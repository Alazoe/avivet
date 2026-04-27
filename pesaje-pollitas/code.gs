// ── CONFIGURACIÓN ──────────────────────────────────────────────
// Valores configurados en GAS → Configuración del proyecto → Propiedades de script
// SHEET_ID          → ID del Google Sheet (URL entre /d/ y /edit)
// ANTHROPIC_API_KEY → API key de Anthropic (console.anthropic.com)
const SHEET_ID         = PropertiesService.getScriptProperties().getProperty('SHEET_ID')         || '';
const ANTHROPIC_API_KEY = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY') || '';

// Curva estándar Hy-Line Brown (semana → { min, max, promedio, uniformidad_min })
const CURVA_HYLINE = {
  1:  { min:0.060, max:0.070, prom:0.065, unif:0.85 },
  2:  { min:0.120, max:0.130, prom:0.125, unif:0.85 },
  3:  { min:0.180, max:0.200, prom:0.190, unif:0.85 },
  4:  { min:0.260, max:0.290, prom:0.275, unif:0.80 },
  5:  { min:0.350, max:0.380, prom:0.365, unif:0.80 },
  6:  { min:0.460, max:0.480, prom:0.470, unif:0.80 },
  7:  { min:0.550, max:0.590, prom:0.570, unif:0.85 },
  8:  { min:0.660, max:0.710, prom:0.685, unif:0.85 },
  9:  { min:0.770, max:0.820, prom:0.795, unif:0.85 },
  10: { min:0.870, max:0.930, prom:0.900, unif:0.85 },
  11: { min:0.980, max:1.040, prom:1.010, unif:0.85 },
  12: { min:1.070, max:1.130, prom:1.100, unif:0.85 },
  13: { min:1.150, max:1.220, prom:1.185, unif:0.85 },
  14: { min:1.220, max:1.290, prom:1.255, unif:0.85 },
  15: { min:1.290, max:1.360, prom:1.325, unif:0.85 },
  16: { min:1.360, max:1.430, prom:1.395, unif:0.85 },
  17: { min:1.420, max:1.500, prom:1.460, unif:0.80 },
  18: { min:1.480, max:1.560, prom:1.520, unif:0.80 },
  19: { min:1.530, max:1.620, prom:1.575, unif:0.80 },
};

// ── ROUTER ─────────────────────────────────────────────────────
function doGet(e) {
  const action    = e && e.parameter && e.parameter.action;
  const productor = e && e.parameter && e.parameter.productor ? e.parameter.productor.trim() : '';
  if (action === 'getLotes')   return jsonResp(getLotes(productor));
  if (action === 'getResumen') return jsonResp(getResumen(e.parameter.lote, productor));
  if (action === 'getCurva')   return jsonResp({ ok:true, data: CURVA_HYLINE });
  const html = HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle('Pesaje Pollitas')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
  return html;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents)
      return jsonResp({ ok:false, error:'POST vacío — no se recibió body' });

    const body = JSON.parse(e.postData.contents);
    if (!body || typeof body !== 'object')
      return jsonResp({ ok:false, error:'Body inválido: ' + typeof body });

    if (body.action === 'guardarPesaje')   return jsonResp(guardarPesaje(body));
    if (body.action === 'ocr')             return jsonResp(ocr(body.imagen, body.mediaType));
    if (body.action === 'crearLote')       return jsonResp(crearLote(body));
    if (body.action === 'desactivarLote')  return jsonResp(desactivarLote(body));
    return jsonResp({ ok:false, error:'Acción desconocida: ' + body.action });
  } catch(err) {
    return jsonResp({ ok:false, error: err.toString() });
  }
}

function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── LOTES ──────────────────────────────────────────────────────
// CONFIGURACIÓN columns: id_lote(0), nombre_lote(1), fecha_nacimiento(2), n_aves_total(3), activo(4), productor(5)
function getLotes(productor) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName('CONFIGURACIÓN');
  if (!ws) return { ok:false, error:'Hoja CONFIGURACIÓN no encontrada' };
  const rows = ws.getDataRange().getValues().slice(1);
  const lotes = rows
    .filter(r => r[0] && r[1] && (!productor || String(r[5]).trim() === productor))
    .map(r => ({
      id:       String(r[0]).trim(),
      nombre:   String(r[1]).trim(),
      fechaNac: r[2] ? Utilities.formatDate(new Date(r[2]), 'America/Santiago', 'yyyy-MM-dd') : '',
      nAves:    r[3] || '',
      activo:   r[4] !== false
    }));
  return { ok:true, data: lotes };
}

// ── GUARDAR PESAJE ─────────────────────────────────────────────
// PESAJES columns: lote(0),semana(1),fecha(2),n_aves(3),promedio_kg(4),cv_pct(5),uniformidad_pct(6),
//                 rango_min(7),rango_max(8),fuera_rango(9),metodo(10),pesos_raw(11),timestamp(12),productor(13)
function guardarPesaje(body) {
  const { lote, semana, fecha, pesos, metodo, productor } = body;
  if (!lote || !semana || !pesos || !pesos.length)
    return { ok:false, error:'Datos incompletos' };

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let ws = ss.getSheetByName('PESAJES');
  if (!ws) {
    ws = ss.insertSheet('PESAJES');
    ws.appendRow(['lote','semana','fecha','n_aves','promedio_kg','cv_pct','uniformidad_pct','rango_min','rango_max','fuera_rango','metodo','pesos_raw','timestamp','productor']);
    ws.setFrozenRows(1);
  }

  const stats = calcularStats(pesos);
  const curva = CURVA_HYLINE[semana] || {};

  ws.appendRow([
    lote,
    semana,
    fecha,
    stats.n,
    stats.promedio,
    stats.cv,
    stats.uniformidad,
    curva.min || '',
    curva.max || '',
    stats.fueraRango,
    metodo || 'manual',
    pesos.join(','),
    new Date(),
    productor || ''
  ]);

  return { ok:true, stats, curva };
}

// ── RESUMEN POR LOTE ───────────────────────────────────────────
function getResumen(lote, productor) {
  if (!lote) return { ok:false, error:'Lote requerido' };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName('PESAJES');
  if (!ws) return { ok:true, data: [] };
  const rows = ws.getDataRange().getValues().slice(1);
  const data = rows
    .filter(r => String(r[0]) === String(lote) && (!productor || String(r[13]).trim() === productor))
    .map(r => ({
      semana:       r[1],
      fecha:        r[2] ? Utilities.formatDate(new Date(r[2]), 'America/Santiago', 'yyyy-MM-dd') : '',
      nAves:        r[3],
      promedio:     r[4],
      cv:           r[5],
      uniformidad:  r[6],
      rangoMin:     r[7],
      rangoMax:     r[8],
      fueraRango:   r[9],
      metodo:       r[10]
    }))
    .sort((a,b) => a.semana - b.semana);
  return { ok:true, data, curva: CURVA_HYLINE };
}

// ── CREAR LOTE ─────────────────────────────────────────────────
function crearLote(body) {
  if (!body) return { ok:false, error:'crearLote: body no recibido' };
  const { nombre, fechaNac, nAves, productor } = body;
  if (!nombre || !fechaNac) return { ok:false, error:'Nombre y fecha requeridos' };

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let ws   = ss.getSheetByName('CONFIGURACIÓN');
  if (!ws) {
    ws = ss.insertSheet('CONFIGURACIÓN');
    ws.appendRow(['id_lote','nombre_lote','fecha_nacimiento','n_aves_total','activo','productor']);
    ws.setFrozenRows(1);
  }

  // ID único global (todos los productores comparten secuencia)
  const rows = ws.getDataRange().getValues().slice(1).filter(r => r[0]);
  const id   = 'L' + String(rows.length + 1).padStart(2,'0');
  ws.appendRow([id, nombre.trim(), fechaNac, parseInt(nAves) || 0, true, productor || '']);
  return { ok:true, id, nombre: nombre.trim() };
}

// ── DESACTIVAR LOTE ────────────────────────────────────────────
function desactivarLote(body) {
  const { id, productor } = body;
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  const ws  = ss.getSheetByName('CONFIGURACIÓN');
  if (!ws) return { ok:false, error:'Hoja no encontrada' };
  const rows = ws.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(id).trim()) {
      // Solo puede archivar el propio productor
      if (productor && String(rows[i][5]).trim() !== productor)
        return { ok:false, error:'Sin permiso para archivar este lote' };
      ws.getRange(i + 1, 5).setValue(false);
      return { ok:true };
    }
  }
  return { ok:false, error:'Lote no encontrado' };
}

// ── OCR CON CLAUDE VISION ──────────────────────────────────────
function ocr(base64Data, mediaType) {
  if (!ANTHROPIC_API_KEY) return { ok:false, error:'API key no configurada' };
  mediaType = mediaType || 'image/jpeg';
  const isPdf = mediaType === 'application/pdf';

  const bloque = isPdf
    ? { type:'document', source:{ type:'base64', media_type:'application/pdf', data: base64Data } }
    : { type:'image',    source:{ type:'base64', media_type: mediaType,         data: base64Data } };

  const payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        bloque,
        {
          type: 'text',
          text: `Este documento contiene registros de pesaje de aves. Puede venir en distintos formatos:
- "N-PESO": número de ave seguido de guion y peso (ej: "1-245", "2-225"). Extrae SOLO el peso (número después del guion).
- Lista de pesos directos (ej: "245", "1.245", "1,245").
- Tabla con columnas de número y peso.

Los pesos pueden estar en gramos (valores >100) o en kg (valores <10).
Si están en gramos, divídelos por 1000 para convertir a kg.
Devuelve SOLO un array JSON con los pesos en kg. Ejemplo: [0.245, 0.225, 0.260]
No incluyas los números de identificación de las aves, solo los pesos.`
        }
      ]
    }]
  };

  const headers = {
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  };
  // PDF support requiere cabecera beta
  if (isPdf) headers['anthropic-beta'] = 'pdfs-2024-09-25';

  const resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const result = JSON.parse(resp.getContentText());
  if (result.error) return { ok:false, error: result.error.message };

  try {
    const raw = result.content[0].text.trim();
    // Extraer el array JSON aunque Claude añada texto extra alrededor
    const match = raw.match(/\[[\d.,\s]+\]/);
    if (!match) return { ok:false, error:'Claude respondió pero sin array de pesos. Respuesta: ' + raw.slice(0, 200) };
    const pesos = JSON.parse(match[0]);
    if (!Array.isArray(pesos) || !pesos.length) throw new Error('Array vacío');
    return { ok:true, pesos };
  } catch(e) {
    return { ok:false, error:'No se pudo extraer pesos: ' + e.message };
  }
}

// ── ESTADÍSTICAS ───────────────────────────────────────────────
function calcularStats(pesos) {
  const vals = pesos.map(Number).filter(v => v > 0);
  const n = vals.length;
  if (!n) return { n:0, promedio:0, cv:0, uniformidad:0, fueraRango:0 };

  const prom = vals.reduce((a,b) => a+b, 0) / n;
  const sd   = Math.sqrt(vals.map(v => Math.pow(v-prom,2)).reduce((a,b)=>a+b,0) / n);
  const cv   = prom > 0 ? sd / prom : 0;

  const rangoMin = prom * 0.9;
  const rangoMax = prom * 1.1;
  const fuera    = vals.filter(v => v < rangoMin || v > rangoMax).length;
  const unif     = (n - fuera) / n;

  return {
    n,
    promedio: Math.round(prom * 1000) / 1000,
    cv:       Math.round(cv * 10000) / 10000,
    uniformidad: Math.round(unif * 10000) / 10000,
    fueraRango: fuera
  };
}

// ── INICIALIZAR SHEET ──────────────────────────────────────────
function inicializarSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  let cfg = ss.getSheetByName('CONFIGURACIÓN');
  if (!cfg) {
    cfg = ss.insertSheet('CONFIGURACIÓN');
    cfg.appendRow(['id_lote','nombre_lote','fecha_nacimiento','n_aves_total','activo','productor']);
    cfg.appendRow(['L01','Lote 01','2026-01-01',10000,true,'demo']);
    cfg.setFrozenRows(1);
  }

  let pes = ss.getSheetByName('PESAJES');
  if (!pes) {
    pes = ss.insertSheet('PESAJES');
    pes.appendRow(['lote','semana','fecha','n_aves','promedio_kg','cv_pct','uniformidad_pct','rango_min','rango_max','fuera_rango','metodo','pesos_raw','timestamp','productor']);
    pes.setFrozenRows(1);
  }

  return { ok:true, msg:'Sheet inicializado' };
}
