// ── CONFIGURACIÓN ──────────────────────────────────────────────
// Valor configurado en GAS → Configuración del proyecto → Propiedades de script
// SHEET_ID → ID del Google Sheet (URL entre /d/ y /edit)
const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || '';

const PESO_MIN_SACO = 800;
const PESO_MAX_SACO = 1000;
const PREFIJOS = {
  'Maíz':            'MZ',
  'Harina de Soya':  'HS',
  'Conchuela':       'CO'
};

// ── ROUTER ─────────────────────────────────────────────────────
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'getSugerencia')  return jsonResp(calcularSugerencia(parseFloat(e.parameter.pesoTotal)));
  if (action === 'getRecepciones') return jsonResp(getRecepciones());
  if (action === 'getRecepcion')   return jsonResp(getRecepcion(e.parameter.id));

  const html = HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle('Recepción de Insumos')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return html;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents)
      return jsonResp({ ok: false, error: 'POST vacío — no se recibió body' });

    const body = JSON.parse(e.postData.contents);
    if (body.action === 'crearRecepcion')    return jsonResp(crearRecepcion(body));
    if (body.action === 'registrarPeso')     return jsonResp(registrarPeso(body));
    if (body.action === 'cancelarSaco')      return jsonResp(cancelarSaco(body));
    if (body.action === 'cerrarRecepcion')   return jsonResp(cerrarRecepcion(body));
    if (body.action === 'toggleUsado')       return jsonResp(toggleUsado(body));
    return jsonResp({ ok: false, error: 'Acción desconocida: ' + body.action });
  } catch (err) {
    return jsonResp({ ok: false, error: err.toString() });
  }
}

function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SUGERENCIA DE DIVISIÓN EN SACOS ─────────────────────────────
// Reparte pesoTotal en sacos de entre PESO_MIN_SACO y PESO_MAX_SACO kg.
function calcularSugerencia(pesoTotal) {
  if (!pesoTotal || isNaN(pesoTotal) || pesoTotal <= 0)
    return { ok: false, error: 'Peso total inválido' };

  let nMin = Math.ceil(pesoTotal / PESO_MAX_SACO);  // menos sacos, más llenos (~1000 kg)
  let nMax = Math.floor(pesoTotal / PESO_MIN_SACO); // más sacos, más livianos (~800 kg)
  if (nMin < 1) nMin = 1;
  if (nMax < nMin) nMax = nMin;

  const nSugerido = nMin;
  const promedio = Math.round((pesoTotal / nSugerido) * 100) / 100;

  return { ok: true, pesoTotal, nMin, nMax, nSugerido, promedio };
}

// ── CREAR RECEPCIÓN (camión) Y GENERAR CORRELATIVOS ─────────────
// RECEPCIONES columns: id_recepcion(0), fecha(1), materia_prima(2), camion_proveedor(3),
//                       peso_total_guia(4), n_sacos(5), peso_promedio_sugerido(6),
//                       peso_acumulado(7), estado(8), timestamp(9)
// MAXISACOS columns:   correlativo(0), id_recepcion(1), fecha(2), materia_prima(3),
//                       camion_proveedor(4), peso_real_kg(5), estado(6), timestamp(7), usado(8)
//                       "usado" = ya se consumió en producción diaria (independiente de estado)
function crearRecepcion(body) {
  const { materiaPrima, camion, pesoTotalGuia, fecha, nSacos } = body;

  if (!materiaPrima || !camion || !pesoTotalGuia)
    return { ok: false, error: 'Faltan datos: materia prima, camión y peso total son obligatorios' };

  const prefijo = PREFIJOS[materiaPrima];
  if (!prefijo) return { ok: false, error: 'Materia prima no reconocida: ' + materiaPrima };

  const pesoTotal = parseFloat(pesoTotalGuia);
  if (isNaN(pesoTotal) || pesoTotal <= 0) return { ok: false, error: 'Peso total inválido' };

  const sug = calcularSugerencia(pesoTotal);
  const nFinal = nSacos ? parseInt(nSacos) : sug.nSugerido;
  if (isNaN(nFinal) || nFinal < 1) return { ok: false, error: 'Cantidad de sacos inválida' };

  const fechaObj = fecha ? new Date(fecha + 'T12:00:00') : new Date();
  const fechaCompacta = Utilities.formatDate(fechaObj, 'America/Santiago', 'yyyyMMdd');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);

    let wsRec = ss.getSheetByName('RECEPCIONES');
    if (!wsRec) {
      wsRec = ss.insertSheet('RECEPCIONES');
      wsRec.appendRow(['id_recepcion', 'fecha', 'materia_prima', 'camion_proveedor', 'peso_total_guia', 'n_sacos', 'peso_promedio_sugerido', 'peso_acumulado', 'estado', 'timestamp']);
      wsRec.setFrozenRows(1);
    }

    const prefijoDia = prefijo + '-' + fechaCompacta + '-';
    const filasRec = wsRec.getDataRange().getValues().slice(1);
    const existentes = filasRec.filter(r => String(r[0]).indexOf(prefijoDia) === 0).length;
    const idRecepcion = prefijoDia + String(existentes + 1).padStart(2, '0');
    const pesoPromedio = Math.round((pesoTotal / nFinal) * 100) / 100;

    wsRec.appendRow([idRecepcion, fechaObj, materiaPrima, camion.trim(), pesoTotal, nFinal, pesoPromedio, 0, 'abierta', new Date()]);

    let wsBag = ss.getSheetByName('MAXISACOS');
    if (!wsBag) {
      wsBag = ss.insertSheet('MAXISACOS');
      wsBag.appendRow(['correlativo', 'id_recepcion', 'fecha', 'materia_prima', 'camion_proveedor', 'peso_real_kg', 'estado', 'timestamp', 'usado']);
      wsBag.setFrozenRows(1);
    }

    const correlativos = [];
    const filasNuevas = [];
    for (let i = 1; i <= nFinal; i++) {
      const correlativo = idRecepcion + '-' + String(i).padStart(3, '0');
      filasNuevas.push([correlativo, idRecepcion, fechaObj, materiaPrima, camion.trim(), '', 'pendiente', '', false]);
      correlativos.push(correlativo);
    }
    wsBag.getRange(wsBag.getLastRow() + 1, 1, filasNuevas.length, 9).setValues(filasNuevas);

    return {
      ok: true,
      idRecepcion,
      materiaPrima,
      camion: camion.trim(),
      pesoTotalGuia: pesoTotal,
      nSacos: nFinal,
      pesoPromedio,
      sugerencia: sug,
      correlativos
    };
  } finally {
    lock.releaseLock();
  }
}

// ── REGISTRAR PESO REAL DE UN MAXISACO ──────────────────────────
function registrarPeso(body) {
  const { correlativo, pesoReal } = body;
  if (!correlativo || !pesoReal) return { ok: false, error: 'Faltan datos: correlativo y peso real' };

  const peso = parseFloat(pesoReal);
  if (isNaN(peso) || peso <= 0) return { ok: false, error: 'Peso real inválido' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const wsBag = ss.getSheetByName('MAXISACOS');
    if (!wsBag) return { ok: false, error: 'No hay maxisacos registrados aún' };

    const filas = wsBag.getDataRange().getValues();
    let fila = -1;
    for (let i = 1; i < filas.length; i++) {
      if (String(filas[i][0]).trim() === String(correlativo).trim()) { fila = i; break; }
    }
    if (fila === -1) return { ok: false, error: 'Correlativo no encontrado: ' + correlativo };

    const idRecepcion = filas[fila][1];
    wsBag.getRange(fila + 1, 6).setValue(peso);       // peso_real_kg
    wsBag.getRange(fila + 1, 7).setValue('registrado'); // estado
    wsBag.getRange(fila + 1, 8).setValue(new Date());   // timestamp

    const resumen = actualizarAcumuladoRecepcion(ss, idRecepcion);
    return { ok: true, correlativo, pesoReal: peso, ...resumen };
  } finally {
    lock.releaseLock();
  }
}

// ── CANCELAR SACO SOBRANTE (no se usó del todo el camión) ───────
function cancelarSaco(body) {
  const { correlativo } = body;
  if (!correlativo) return { ok: false, error: 'Falta el correlativo' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const wsBag = ss.getSheetByName('MAXISACOS');
    if (!wsBag) return { ok: false, error: 'No hay maxisacos registrados aún' };

    const filas = wsBag.getDataRange().getValues();
    let fila = -1;
    for (let i = 1; i < filas.length; i++) {
      if (String(filas[i][0]).trim() === String(correlativo).trim()) { fila = i; break; }
    }
    if (fila === -1) return { ok: false, error: 'Correlativo no encontrado: ' + correlativo };

    const idRecepcion = filas[fila][1];
    wsBag.getRange(fila + 1, 7).setValue('cancelado');

    const resumen = actualizarAcumuladoRecepcion(ss, idRecepcion);
    return { ok: true, correlativo, ...resumen };
  } finally {
    lock.releaseLock();
  }
}

// ── MARCAR/DESMARCAR SACO COMO USADO EN PRODUCCIÓN DIARIA ───────
// Independiente del cierre de la recepción: un saco ya registrado (con
// peso real) se puede ir tachando cuando se consume, sin importar el día.
function toggleUsado(body) {
  const { correlativo } = body;
  if (!correlativo) return { ok: false, error: 'Falta el correlativo' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const wsBag = ss.getSheetByName('MAXISACOS');
    if (!wsBag) return { ok: false, error: 'No hay maxisacos registrados aún' };

    const filas = wsBag.getDataRange().getValues();
    let fila = -1;
    for (let i = 1; i < filas.length; i++) {
      if (String(filas[i][0]).trim() === String(correlativo).trim()) { fila = i; break; }
    }
    if (fila === -1) return { ok: false, error: 'Correlativo no encontrado: ' + correlativo };
    if (filas[fila][6] !== 'registrado')
      return { ok: false, error: 'Solo se puede marcar como usado un saco ya registrado (con peso real)' };

    const usadoNuevo = filas[fila][8] !== true;
    wsBag.getRange(fila + 1, 9).setValue(usadoNuevo); // usado

    return { ok: true, correlativo, usado: usadoNuevo };
  } finally {
    lock.releaseLock();
  }
}

// ── CERRAR RECEPCIÓN (cancela pendientes restantes) ─────────────
function cerrarRecepcion(body) {
  const { idRecepcion } = body;
  if (!idRecepcion) return { ok: false, error: 'Falta el id de recepción' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const wsBag = ss.getSheetByName('MAXISACOS');
    if (wsBag) {
      const filas = wsBag.getDataRange().getValues();
      for (let i = 1; i < filas.length; i++) {
        if (String(filas[i][1]).trim() === String(idRecepcion).trim() && filas[i][6] === 'pendiente') {
          wsBag.getRange(i + 1, 7).setValue('cancelado');
        }
      }
    }

    const resumen = actualizarAcumuladoRecepcion(ss, idRecepcion);

    const wsRec = ss.getSheetByName('RECEPCIONES');
    const filasRec = wsRec.getDataRange().getValues();
    for (let i = 1; i < filasRec.length; i++) {
      if (String(filasRec[i][0]).trim() === String(idRecepcion).trim()) {
        wsRec.getRange(i + 1, 9).setValue('cerrada');
        break;
      }
    }

    return { ok: true, idRecepcion, ...resumen, diferenciaFinal: Math.round((resumen.pesoAcumulado - resumen.pesoTotalGuia) * 100) / 100 };
  } finally {
    lock.releaseLock();
  }
}

// ── HELPER: recalcula peso acumulado y saldo de una recepción ──
function actualizarAcumuladoRecepcion(ss, idRecepcion) {
  const wsBag = ss.getSheetByName('MAXISACOS');
  const filasBag = wsBag.getDataRange().getValues().slice(1)
    .filter(r => String(r[1]).trim() === String(idRecepcion).trim());

  const pesoAcumulado = Math.round(
    filasBag.filter(r => r[6] === 'registrado').reduce((sum, r) => sum + (Number(r[5]) || 0), 0) * 100
  ) / 100;
  const sacosPendientes = filasBag.filter(r => r[6] === 'pendiente').length;
  const sacosRegistrados = filasBag.filter(r => r[6] === 'registrado').length;

  const wsRec = ss.getSheetByName('RECEPCIONES');
  const filasRec = wsRec.getDataRange().getValues();
  let pesoTotalGuia = 0;
  for (let i = 1; i < filasRec.length; i++) {
    if (String(filasRec[i][0]).trim() === String(idRecepcion).trim()) {
      pesoTotalGuia = Number(filasRec[i][4]) || 0;
      wsRec.getRange(i + 1, 8).setValue(pesoAcumulado); // peso_acumulado
      break;
    }
  }

  const saldo = Math.round((pesoTotalGuia - pesoAcumulado) * 100) / 100;
  const promedioRestante = sacosPendientes > 0 ? Math.round((saldo / sacosPendientes) * 100) / 100 : 0;

  return { idRecepcion, pesoAcumulado, pesoTotalGuia, saldo, sacosRegistrados, sacosPendientes, promedioRestante };
}

// ── TODAS LAS RECEPCIONES, abiertas y cerradas (para el selector) ──
function getRecepciones() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const wsRec = ss.getSheetByName('RECEPCIONES');
  if (!wsRec) return { ok: true, data: [] };

  const rows = wsRec.getDataRange().getValues().slice(1);
  const data = rows
    .filter(r => r[0])
    .map(r => ({
      idRecepcion: r[0],
      fecha: Utilities.formatDate(new Date(r[1]), 'America/Santiago', 'yyyy-MM-dd'),
      materiaPrima: r[2],
      camion: r[3],
      pesoTotalGuia: r[4],
      nSacos: r[5],
      pesoAcumulado: r[7],
      estado: r[8]
    }))
    .reverse();

  return { ok: true, data };
}

// ── DETALLE DE UNA RECEPCIÓN (header + lista de sacos) ──────────
function getRecepcion(idRecepcion) {
  if (!idRecepcion) return { ok: false, error: 'Falta el id de recepción' };
  const ss = SpreadsheetApp.openById(SHEET_ID);

  const wsRec = ss.getSheetByName('RECEPCIONES');
  if (!wsRec) return { ok: false, error: 'No hay recepciones registradas aún' };
  const filasRec = wsRec.getDataRange().getValues().slice(1);
  const rec = filasRec.find(r => String(r[0]).trim() === String(idRecepcion).trim());
  if (!rec) return { ok: false, error: 'Recepción no encontrada: ' + idRecepcion };

  const header = {
    idRecepcion: rec[0],
    fecha: Utilities.formatDate(new Date(rec[1]), 'America/Santiago', 'yyyy-MM-dd'),
    materiaPrima: rec[2],
    camion: rec[3],
    pesoTotalGuia: rec[4],
    nSacos: rec[5],
    pesoPromedioSugerido: rec[6],
    pesoAcumulado: rec[7],
    estado: rec[8]
  };

  const wsBag = ss.getSheetByName('MAXISACOS');
  const bags = wsBag
    ? wsBag.getDataRange().getValues().slice(1)
        .filter(r => String(r[1]).trim() === String(idRecepcion).trim())
        .map(r => ({ correlativo: r[0], pesoReal: r[5], estado: r[6], usado: r[8] === true }))
    : [];

  const saldo = Math.round((header.pesoTotalGuia - header.pesoAcumulado) * 100) / 100;
  const sacosPendientes = bags.filter(b => b.estado === 'pendiente').length;
  const promedioRestante = sacosPendientes > 0 ? Math.round((saldo / sacosPendientes) * 100) / 100 : 0;
  const stockReal = bags.filter(b => b.estado === 'registrado' && !b.usado).length;

  return { ok: true, header, bags, saldo, sacosPendientes, promedioRestante, stockReal };
}
