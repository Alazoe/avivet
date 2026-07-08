/* ============================================================
   Informe de Visita Técnica · avivet.cl
   Genera un informe Word (.docx) editable con los requerimientos
   del lote según edad, línea genética y galpón.
   Datos de líneas: LINEAS y EQ de ../curvas-geneticas/app.js
   ============================================================ */

// ── ESTÁNDARES DE CRIANZA POR FASE (todas las líneas, manual de manejo) ──
// densidad: aves/m² · bebedero campana: aves/unidad · nipple: aves/unidad
// cadena: cm/ave · comederoRedondo: aves/unidad
const IV_FASES_CRIANZA = [
  { hastaSem: 2,  label: '0–2 semanas',   densidad: 30, bebedero: 75,  nipple: 10, cadena: 4, comederoRedondo: 35, arranque: true },
  { hastaSem: 5,  label: '2–5 semanas',   densidad: 20, bebedero: 75,  nipple: 10, cadena: 4, comederoRedondo: 35 },
  { hastaSem: 10, label: '5–10 semanas',  densidad: 15, bebedero: 100, nipple: 9,  cadena: 5, comederoRedondo: 25 },
  { hastaSem: 99, label: '10–17 semanas', densidad: 10, bebedero: 100, nipple: 8,  cadena: 7, comederoRedondo: 23 },
];
const IV_ARRANQUE = { bebedero: 75, comedero: 50 };          // aves/unidad, solo 0–2 sem
const IV_VENT = { minima: 0.7, capacidad: 4 };               // m³/hora/kg de peso vivo
const IV_DENSIDAD_POSTURA = 9;                               // aves/m² útil — UE sistemas alternativos
const IV_COMEDERO_DIAM = [[30, 38], [40, 50], [50, 63]];     // [Ø cm, aves máx/comedero]

// ── UTILIDADES ──────────────────────────────────────────────────────────
const ivFmt = n => Number(n).toLocaleString('es-CL');
const ivFmt1 = n => Number(n).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const ivFecha = d => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

function ivFasePorSemana(sem) {
  return IV_FASES_CRIANZA.find(f => sem <= f.hastaSem);
}

// ── CÁLCULO PRINCIPAL ───────────────────────────────────────────────────
// inp: { productor, ubicacion, fechaVisita:'YYYY-MM-DD', linea, nacimiento:'YYYY-MM-DD',
//        aves, superficie, largo, ancho, sistema, exterior, obs, reco }
// Devuelve objeto informe o { error }.
function ivCalcular(inp) {
  const L = LINEAS[inp.linea];
  if (!L) return { error: 'Línea genética no válida.' };
  if (!inp.nacimiento) return { error: 'Falta la fecha de nacimiento del lote.' };
  if (!(inp.aves > 0)) return { error: 'El número de aves debe ser mayor que cero.' };

  const visita = new Date((inp.fechaVisita || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  const nac = new Date(inp.nacimiento + 'T00:00:00');
  const dias = Math.floor((visita - nac) / 86400000);
  if (dias < 0) return { error: 'La fecha de nacimiento es posterior a la fecha de visita.' };

  const diaVida = dias + 1;                       // día 1 = día de nacimiento
  const semana = Math.ceil(diaVida / 7);
  const enCrianza = semana <= L.crianzaSem;
  const n = inp.aves;

  // fila de referencia (clamp al rango disponible)
  const semMaxPostura = L.postura[L.postura.length - 1][0];
  const semClamp = Math.min(semana, semMaxPostura);
  const notaClamp = semana > semMaxPostura ? `Semana ${semana} fuera de tabla — se usan valores de la semana ${semMaxPostura}.` : null;

  let obj;
  if (enCrianza) {
    const fila = L.crianza[Math.min(semana, L.crianza.length) - 1];
    obj = { pesoMin: fila[1], pesoMax: fila[2], alMin: fila[3], alMax: fila[4], aguaMin: fila[5], aguaMax: fila[6], pct: null, pesoHuevo: null };
  } else {
    const idx = Math.min(semClamp - L.postura[0][0], L.postura.length - 1);
    const fila = L.postura[Math.max(idx, 0)];
    obj = { pesoMin: fila[1], pesoMax: fila[2], alMin: fila[5], alMax: fila[6], aguaMin: fila[7], aguaMax: fila[8], pct: fila[3], pesoHuevo: fila[4] };
  }

  // mortalidad acumulada esperada
  let mortEsp = null;
  if (enCrianza && L.mortCrianza) {
    mortEsp = L.mortCrianza[Math.min(semana, L.mortCrianza.length) - 1];
  } else if (!enCrianza && L.mortPostura) {
    const mortCrianzaFinal = L.mortCrianza ? L.mortCrianza[L.mortCrianza.length - 1] : 0;
    const idx = Math.min(semClamp - L.postura[0][0], L.mortPostura.length - 1);
    mortEsp = idx >= 0 ? mortCrianzaFinal + L.mortPostura[idx] : mortCrianzaFinal;
    mortEsp = Math.round(mortEsp * 100) / 100;
  }

  const pesoProm = (obj.pesoMin + obj.pesoMax) / 2;
  const biomasa = pesoProm * n;

  // ── equipamiento según etapa ──
  const equip = [];
  let densidadRec;
  if (enCrianza) {
    const fase = ivFasePorSemana(semana);
    densidadRec = fase.densidad;
    equip.push(['Superficie mínima', ivFmt1(n / fase.densidad) + ' m²', `${fase.densidad} aves/m² (${fase.label})`]);
    if (fase.arranque) {
      equip.push(['Bebederos de arranque', ivFmt(Math.ceil(n / IV_ARRANQUE.bebedero)) + ' unidades', `1 cada ${IV_ARRANQUE.bebedero} aves (solo 0–2 sem)`]);
      equip.push(['Comederos de arranque', ivFmt(Math.ceil(n / IV_ARRANQUE.comedero)) + ' unidades', `1 cada ${IV_ARRANQUE.comedero} aves (solo 0–2 sem)`]);
    }
    equip.push(['Bebederos campana', ivFmt(Math.ceil(n / fase.bebedero)) + ' unidades', `1 cada ${fase.bebedero} aves`]);
    equip.push(['Nipples', ivFmt(Math.ceil(n / fase.nipple)) + ' unidades', `1 cada ${fase.nipple} aves`]);
    equip.push(['Comedero lineal (cadena)', ivFmt1(n * fase.cadena / 100) + ' m', `${fase.cadena} cm/ave`]);
    equip.push(['Comederos redondos', ivFmt(Math.ceil(n / fase.comederoRedondo)) + ' unidades', `1 cada ${fase.comederoRedondo} aves (Ø estándar)`]);
    equip.push(['Perchas', ivFmt1(n * EQ.crianza.perchas.ratio / 100) + ' m lineales', '15 cm/ave']);
  } else {
    densidadRec = IV_DENSIDAD_POSTURA;
    const e = EQ.postura;
    equip.push(['Superficie mínima', ivFmt1(n / IV_DENSIDAD_POSTURA) + ' m²', `${IV_DENSIDAD_POSTURA} aves/m² útil (UE sist. alternativos)`]);
    equip.push(['Nidos individuales', ivFmt(Math.ceil(n / e.nido_individual.ratio)) + ' unidades', '1 cada 5 aves']);
    equip.push(['Nido comunitario', ivFmt1(n / e.nido_comunitario.ratio) + ' m lineales', '1 m cada 120 aves']);
    equip.push(['Bebederos campana', ivFmt(Math.ceil(n / e.bebedero_campana.ratio)) + ' unidades', '1 cada 100 aves']);
    equip.push(['Nipples', ivFmt(Math.ceil(n / e.nipple.ratio)) + ' unidades', '1 cada 12 aves']);
    equip.push(['Comedero lineal', ivFmt1(n * e.comedero.ratio / 100) + ' m', '4 cm/ave']);
    equip.push(['Perchas totales', ivFmt1(n * e.perchas.ratio / 100) + ' m lineales', '15 cm/ave (≥20% elevadas)']);
    if (inp.exterior) equip.push(['Acceso exterior', ivFmt1(n * e.acceso_exterior.ratio) + ' m²', '0,19 m²/ave']);
  }

  // ── densidad real vs recomendada ──
  let densidad = null;
  if (inp.superficie > 0) {
    const real = n / inp.superficie;
    densidad = {
      real,
      recomendada: densidadRec,
      superficieMin: n / densidadRec,
      ok: real <= densidadRec,
      exceso: real > densidadRec ? Math.round((real / densidadRec - 1) * 100) : 0,
    };
  }

  // ── ambiente crianza (primeras 6 semanas) ──
  let ambiente = null;
  if (enCrianza && diaVida <= 42) {
    const amb = L.crianzaAmb || LINEAS['Hy-Line Brown'].crianzaAmb;
    ambiente = { ...amb, referencial: !L.crianzaAmb };
  }

  // ── proyección próximas 4 semanas ──
  const proyeccion = [];
  for (let s = semana; s <= Math.min(semana + 4, semMaxPostura); s++) {
    if (s <= L.crianzaSem) {
      const f = L.crianza[Math.min(s, L.crianza.length) - 1];
      proyeccion.push({ sem: s, etapa: 'Crianza', peso: `${ivFmt(f[1] * 1000)}–${ivFmt(f[2] * 1000)} g`, alimento: `${f[3]}–${f[4]} g`, agua: `${f[5]}–${f[6]} ml`, pct: '—', huevo: '—' });
    } else {
      const idx = Math.max(0, Math.min(s - L.postura[0][0], L.postura.length - 1));
      const f = L.postura[idx];
      proyeccion.push({ sem: s, etapa: 'Postura', peso: `${ivFmt(f[1] * 1000)}–${ivFmt(f[2] * 1000)} g`, alimento: `${f[5]}–${f[6]} g`, agua: `${f[7]}–${f[8]} ml`, pct: ivFmt1(f[3]) + ' %', huevo: ivFmt1(f[4]) + ' g' });
    }
  }

  return {
    meta: { ...inp, fuente: L.fuente },
    edad: {
      dias, diaVida, semana, semClamp, notaClamp,
      meses: (dias / 30.44).toFixed(1),
      etapa: enCrianza ? 'Crianza' : 'Postura',
      enCrianza,
      fase: enCrianza ? ivFasePorSemana(semana).label : 'Postura',
    },
    objetivo: {
      ...obj,
      mortEsp,
      avesEsperadas: mortEsp != null ? Math.round(n * (1 - mortEsp / 100)) : null,
      biomasa,
      alimentoLoteMin: n * obj.alMin / 1000, alimentoLoteMax: n * obj.alMax / 1000,   // kg/día
      aguaLoteMin: n * obj.aguaMin / 1000, aguaLoteMax: n * obj.aguaMax / 1000,       // L/día
      huevosDia: obj.pct != null ? Math.round(n * obj.pct / 100) : null,
      bandejasDia: obj.pct != null ? Math.round(n * obj.pct / 100 / 30) : null,
    },
    equip,
    densidad,
    ventilacion: { min: biomasa * IV_VENT.minima, cap: biomasa * IV_VENT.capacidad },
    ambiente,
    proyeccion,
  };
}

// ── DOCUMENTO WORD ──────────────────────────────────────────────────────
// D = librería docx (global en navegador, require('docx') en node)
function ivConstruirDoc(inf, D) {
  const VERDE = '1B4332', AMBAR = 'F0A500', GRIS = '666666';

  const p = (text, opts = {}) => new D.Paragraph({
    children: [new D.TextRun({ text, size: opts.size || 22, bold: opts.bold, color: opts.color, italics: opts.italics })],
    spacing: { after: opts.after != null ? opts.after : 120 },
    alignment: opts.center ? D.AlignmentType.CENTER : undefined,
  });

  const h2 = text => new D.Paragraph({
    children: [new D.TextRun({ text: text.toUpperCase(), size: 24, bold: true, color: VERDE })],
    spacing: { before: 320, after: 160 },
    border: { bottom: { color: AMBAR, size: 12, style: D.BorderStyle.SINGLE, space: 4 } },
  });

  const celda = (text, { head, w, bold } = {}) => new D.TableCell({
    children: [new D.Paragraph({ children: [new D.TextRun({ text: String(text), size: 20, bold: head || bold, color: head ? 'FFFFFF' : undefined })], spacing: { after: 0 } })],
    shading: head ? { fill: VERDE, type: D.ShadingType.CLEAR, color: 'auto' } : undefined,
    width: w ? { size: w, type: D.WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });

  const tabla = (filas, anchos) => new D.Table({
    rows: filas.map((f, i) => new D.TableRow({
      children: f.map((c, j) => celda(c, { head: i === 0, w: anchos ? anchos[j] : undefined })),
      tableHeader: i === 0,
    })),
    width: { size: 100, type: D.WidthType.PERCENTAGE },
  });

  const m = inf.meta, e = inf.edad, o = inf.objetivo;
  const visita = new Date((m.fechaVisita || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  const nac = new Date(m.nacimiento + 'T00:00:00');
  const hijos = [];

  // ── encabezado ──
  hijos.push(new D.Paragraph({
    children: [new D.TextRun({ text: 'INFORME DE VISITA TÉCNICA', size: 40, bold: true, color: VERDE })],
    alignment: D.AlignmentType.CENTER, spacing: { after: 60 },
  }));
  hijos.push(p('AviVet · MV Andrés Lazo Escobar · Medicina Aviar · avivet.cl', { center: true, color: GRIS, size: 20, after: 320 }));

  // ── 1. datos generales ──
  hijos.push(h2('1. Datos generales'));
  const datos = [
    ['Productor / Predio', m.productor || '________________'],
    ['Ubicación', m.ubicacion || '________________'],
    ['Fecha de visita', ivFecha(visita)],
    ['Línea genética', m.linea],
    ['Fecha de nacimiento del lote', ivFecha(nac)],
    ['Edad del lote', `Semana ${e.semana} · día ${e.diaVida} de vida (${e.meses} meses)`],
    ['Etapa', e.etapa + (e.enCrianza ? ` — fase ${e.fase}` : '')],
    ['Número de aves', ivFmt(m.aves)],
  ];
  if (m.largo > 0 && m.ancho > 0) datos.push(['Dimensiones del galpón', `${ivFmt1(m.largo)} × ${ivFmt1(m.ancho)} m`]);
  if (m.superficie > 0) datos.push(['Superficie del galpón', ivFmt1(m.superficie) + ' m²']);
  datos.push(['Sistema', (m.sistema === 'jaula' ? 'Jaula' : 'Piso') + (m.exterior ? ' con acceso exterior' : '')]);
  hijos.push(new D.Table({
    rows: datos.map(f => new D.TableRow({ children: [celda(f[0], { bold: true, w: 38 }), celda(f[1], { w: 62 })] })),
    width: { size: 100, type: D.WidthType.PERCENTAGE },
  }));

  // ── 2. parámetros objetivo ──
  hijos.push(h2(`2. Parámetros objetivo — semana ${e.semana}`));
  if (e.notaClamp) hijos.push(p(e.notaClamp, { italics: true, color: GRIS, size: 18 }));
  const par = [
    ['Parámetro', 'Por ave', 'Total lote'],
    ['Peso corporal', `${ivFmt(o.pesoMin * 1000)}–${ivFmt(o.pesoMax * 1000)} g`, `Biomasa ≈ ${ivFmt(Math.round(o.biomasa))} kg`],
    ['Consumo de alimento', `${o.alMin}–${o.alMax} g/día`, `${ivFmt1(o.alimentoLoteMin)}–${ivFmt1(o.alimentoLoteMax)} kg/día`],
    ['Consumo de agua', `${o.aguaMin}–${o.aguaMax} ml/día`, `${ivFmt1(o.aguaLoteMin)}–${ivFmt1(o.aguaLoteMax)} L/día`],
  ];
  if (o.pct != null) {
    par.push(['Postura esperada', ivFmt1(o.pct) + ' %', `≈ ${ivFmt(o.huevosDia)} huevos/día (${ivFmt(o.bandejasDia)} bandejas de 30)`]);
    par.push(['Peso del huevo', ivFmt1(o.pesoHuevo) + ' g', `≈ ${ivFmt1(o.huevosDia * o.pesoHuevo / 1000)} kg/día`]);
  }
  if (o.mortEsp != null) par.push(['Mortalidad acumulada esperada', ivFmt1(o.mortEsp) + ' %', `≈ ${ivFmt(o.avesEsperadas)} aves vivas esperadas`]);
  hijos.push(tabla(par, [30, 30, 40]));
  hijos.push(p('Fuente: ' + m.fuente, { size: 16, color: GRIS, italics: true }));

  // ── 3. equipamiento requerido ──
  hijos.push(h2(`3. Equipamiento requerido — ${ivFmt(m.aves)} aves (${e.enCrianza ? 'crianza ' + e.fase : 'postura'})`));
  hijos.push(tabla([['Equipamiento', 'Requerido', 'Estándar'], ...inf.equip], [34, 26, 40]));
  if (e.enCrianza) {
    hijos.push(p('Comederos redondos según diámetro: ' + IV_COMEDERO_DIAM.map(d => `Ø${d[0]} cm → ${ivFmt(Math.ceil(m.aves / d[1]))} unid. (${d[1]} aves c/u)`).join(' · '), { size: 18, color: GRIS }));
  }

  // ── 4. densidad ──
  if (inf.densidad) {
    const d = inf.densidad;
    hijos.push(h2('4. Densidad'));
    hijos.push(tabla([
      ['Indicador', 'Valor'],
      ['Densidad actual', ivFmt1(d.real) + ' aves/m²'],
      ['Densidad recomendada (máx.)', ivFmt1(d.recomendada) + ' aves/m²'],
      ['Superficie mínima requerida', ivFmt1(d.superficieMin) + ' m²'],
      ['Evaluación', d.ok ? '✔ CUMPLE — densidad dentro del estándar' : `✘ SOBRECARGA — excede el estándar en ${d.exceso}%`],
    ], [45, 55]));
  }

  // ── 5. ventilación ──
  hijos.push(h2(`${inf.densidad ? 5 : 4}. Ventilación`));
  hijos.push(tabla([
    ['Parámetro', 'Estándar', 'Requerido para el lote'],
    ['Ventilación mínima', IV_VENT.minima + ' m³/hora/kg', ivFmt(Math.round(inf.ventilacion.min)) + ' m³/hora'],
    ['Capacidad de ventilación', IV_VENT.capacidad + ' m³/hora/kg', ivFmt(Math.round(inf.ventilacion.cap)) + ' m³/hora'],
  ], [34, 26, 40]));
  hijos.push(p(`Calculado sobre biomasa estimada de ${ivFmt(Math.round(o.biomasa))} kg (${ivFmt(m.aves)} aves × ${ivFmt(Math.round((o.pesoMin + o.pesoMax) / 2 * 1000))} g promedio).`, { size: 18, color: GRIS }));

  let nSec = inf.densidad ? 6 : 5;

  // ── ambiente crianza ──
  if (inf.ambiente) {
    const a = inf.ambiente;
    hijos.push(h2(`${nSec}. Temperatura e iluminación de crianza`));
    let cab, filas;
    if (a.columnas) {
      cab = a.columnas;
      filas = a.periodos;
    } else {
      const esJaula = a.periodos.some(x => x[1] != null);
      cab = esJaula ? ['Edad', 'T. jaula (°C)', 'T. piso (°C)', 'Intensidad (lux)', 'Horas de luz'] : ['Edad', 'T. piso (°C)', 'Intensidad (lux)', 'Horas de luz'];
      filas = a.periodos.map(x => esJaula ? x : [x[0], x[2], x[3], x[4]]);
    }
    hijos.push(tabla([cab, ...filas.map(f => f.map(v => v == null ? '—' : v))]));
    hijos.push(p('Fuente: ' + a.fuente + (a.referencial ? ' (referencial — la línea seleccionada no publica tabla propia)' : ''), { size: 16, color: GRIS, italics: true }));
    nSec++;
  }

  // ── proyección ──
  hijos.push(h2(`${nSec}. Proyección próximas semanas`));
  hijos.push(tabla([
    ['Semana', 'Etapa', 'Peso corporal', 'Alimento/ave/día', 'Agua/ave/día', '% Postura', 'Peso huevo'],
    ...inf.proyeccion.map(f => [f.sem, f.etapa, f.peso, f.alimento, f.agua, f.pct, f.huevo]),
  ]));
  nSec++;

  // ── observaciones y recomendaciones ──
  hijos.push(h2(`${nSec}. Observaciones de la visita`));
  hijos.push(p(m.obs || '_______________________________________________________________________', { after: 60 }));
  if (!m.obs) { hijos.push(p('_______________________________________________________________________', { after: 60 })); hijos.push(p('_______________________________________________________________________')); }
  nSec++;

  hijos.push(h2(`${nSec}. Recomendaciones`));
  hijos.push(p(m.reco || '_______________________________________________________________________', { after: 60 }));
  if (!m.reco) { hijos.push(p('_______________________________________________________________________', { after: 60 })); hijos.push(p('_______________________________________________________________________')); }

  // ── firma ──
  hijos.push(new D.Paragraph({ children: [], spacing: { before: 600 } }));
  hijos.push(p('______________________________', { center: true, after: 40 }));
  hijos.push(p('MV Andrés Lazo Escobar', { center: true, bold: true, after: 20 }));
  hijos.push(p('Medicina Aviar · AviVet', { center: true, color: GRIS, size: 20, after: 20 }));
  hijos.push(p('WhatsApp +56 9 5895 6340 · andreslazomv@outlook.com · avivet.cl', { center: true, color: GRIS, size: 18 }));

  return new D.Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      children: hijos,
    }],
  });
}

function ivNombreArchivo(inf) {
  const prod = (inf.meta.productor || 'productor').trim().replace(/[^\wáéíóúñÁÉÍÓÚÑ-]+/g, '_');
  return `Informe_Visita_${prod}_${inf.meta.fechaVisita || new Date().toISOString().slice(0, 10)}.docx`;
}

// ── EXPORT PARA NODE (tests) ────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ivCalcular, ivConstruirDoc, ivNombreArchivo, IV_FASES_CRIANZA, IV_VENT };
}

// ── UI (solo navegador) ─────────────────────────────────────────────────
if (typeof document !== 'undefined' && typeof window !== 'undefined') {

  let ivInforme = null;

  window.addEventListener('DOMContentLoaded', () => {
    const selLinea = document.getElementById('iv-linea');
    if (!selLinea) return;
    selLinea.innerHTML = Object.keys(LINEAS).map(k => `<option value="${k}">${k}</option>`).join('');
    document.getElementById('iv-fecha-visita').value = new Date().toISOString().slice(0, 10);
    document.getElementById('iv-fecha-hoy').textContent = new Date().toLocaleDateString('es-CL');
  });

  window.ivDimensiones = function () {
    const largo = parseFloat(document.getElementById('iv-largo').value);
    const ancho = parseFloat(document.getElementById('iv-ancho').value);
    if (largo > 0 && ancho > 0) document.getElementById('iv-superficie').value = (largo * ancho).toFixed(1);
  };

  function ivLeerFormulario() {
    return {
      productor:   document.getElementById('iv-productor').value.trim(),
      ubicacion:   document.getElementById('iv-ubicacion').value.trim(),
      fechaVisita: document.getElementById('iv-fecha-visita').value,
      linea:       document.getElementById('iv-linea').value,
      nacimiento:  document.getElementById('iv-nacimiento').value,
      aves:        parseInt(document.getElementById('iv-aves').value) || 0,
      largo:       parseFloat(document.getElementById('iv-largo').value) || 0,
      ancho:       parseFloat(document.getElementById('iv-ancho').value) || 0,
      superficie:  parseFloat(document.getElementById('iv-superficie').value) || 0,
      sistema:     document.getElementById('iv-sistema').value,
      exterior:    document.getElementById('iv-exterior').checked,
      obs:         document.getElementById('iv-obs').value.trim(),
      reco:        document.getElementById('iv-reco').value.trim(),
    };
  }

  window.ivGenerar = function () {
    const err = document.getElementById('iv-error');
    err.style.display = 'none';
    const inf = ivCalcular(ivLeerFormulario());
    if (inf.error) {
      err.textContent = inf.error;
      err.style.display = 'block';
      document.getElementById('iv-resultado').style.display = 'none';
      return;
    }
    ivInforme = inf;
    ivRenderPreview(inf);
    document.getElementById('iv-resultado').style.display = 'block';
    document.getElementById('iv-resultado').scrollIntoView({ behavior: 'smooth' });
  };

  window.ivDescargarWord = async function () {
    if (!ivInforme) return;
    const doc = ivConstruirDoc(ivInforme, docx);
    const blob = await docx.Packer.toBlob(doc);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = ivNombreArchivo(ivInforme);
    a.click();
    URL.revokeObjectURL(a.href);
  };

  function ivRenderPreview(inf) {
    const e = inf.edad, o = inf.objetivo, m = inf.meta;
    const fila = (a, b) => `<tr><td style="text-align:left;font-weight:500">${a}</td><td style="text-align:left">${b}</td></tr>`;

    document.getElementById('iv-prev-titulo').textContent =
      `${m.productor || 'Productor'} · ${m.linea} · Semana ${e.semana} (${e.etapa})`;

    let html = `<div class="eq-grid" style="margin-bottom:24px">
      <div class="eq-ficha"><div class="eq-num">${e.semana}</div><div class="eq-lbl">Semana de vida</div><div class="eq-unit">día ${e.diaVida} · ${e.meses} meses</div></div>
      <div class="eq-ficha"><div class="eq-num" style="font-size:20px;padding-top:8px">${e.etapa}</div><div class="eq-lbl">Etapa</div><div class="eq-unit">${e.enCrianza ? 'fase ' + e.fase : 'semana ' + e.semana}</div></div>
      <div class="eq-ficha"><div class="eq-num">${ivFmt1(o.alimentoLoteMin)}–${ivFmt1(o.alimentoLoteMax)}</div><div class="eq-lbl">Alimento lote</div><div class="eq-unit">kg/día</div></div>
      <div class="eq-ficha"><div class="eq-num">${ivFmt1(o.aguaLoteMin)}–${ivFmt1(o.aguaLoteMax)}</div><div class="eq-lbl">Agua lote</div><div class="eq-unit">L/día</div></div>
      ${o.huevosDia != null ? `<div class="eq-ficha"><div class="eq-num">${ivFmt(o.huevosDia)}</div><div class="eq-lbl">Huevos/día esperados</div><div class="eq-unit">${ivFmt(o.bandejasDia)} bandejas de 30</div></div>` : ''}
    </div>`;

    html += `<h4 class="iv-prev-h">Parámetros objetivo — semana ${e.semana}${e.notaClamp ? ' <span class="iv-nota">(' + e.notaClamp + ')</span>' : ''}</h4>
      <div class="tabla-wrap" style="max-height:none"><table><thead><tr><th>Parámetro</th><th>Valor</th></tr></thead><tbody>
      ${fila('Peso corporal', `${ivFmt(o.pesoMin * 1000)}–${ivFmt(o.pesoMax * 1000)} g`)}
      ${fila('Consumo alimento', `${o.alMin}–${o.alMax} g/ave/día`)}
      ${fila('Consumo agua', `${o.aguaMin}–${o.aguaMax} ml/ave/día`)}
      ${o.pct != null ? fila('% Postura esperada', ivFmt1(o.pct) + ' %') + fila('Peso huevo', ivFmt1(o.pesoHuevo) + ' g') : ''}
      ${o.mortEsp != null ? fila('Mortalidad acumulada esperada', ivFmt1(o.mortEsp) + ' % → ≈ ' + ivFmt(o.avesEsperadas) + ' aves vivas') : ''}
      </tbody></table></div>`;

    html += `<h4 class="iv-prev-h">Equipamiento requerido (${ivFmt(m.aves)} aves)</h4>
      <div class="tabla-wrap" style="max-height:none"><table><thead><tr><th>Equipamiento</th><th>Requerido</th><th>Estándar</th></tr></thead>
      <tbody>${inf.equip.map(f => `<tr><td style="text-align:left;font-weight:500">${f[0]}</td><td>${f[1]}</td><td style="text-align:left;color:var(--tenue)">${f[2]}</td></tr>`).join('')}</tbody></table></div>`;

    if (inf.densidad) {
      const d = inf.densidad;
      html += `<div class="iv-densidad ${d.ok ? 'ok' : 'alerta'}">
        Densidad actual: <strong>${ivFmt1(d.real)} aves/m²</strong> · recomendada máx. ${ivFmt1(d.recomendada)} aves/m² —
        ${d.ok ? '✔ cumple el estándar' : `✘ sobrecarga de ${d.exceso}% · superficie mínima ${ivFmt1(d.superficieMin)} m²`}
      </div>`;
    }

    html += `<h4 class="iv-prev-h">Ventilación (biomasa ≈ ${ivFmt(Math.round(o.biomasa))} kg)</h4>
      <div class="tabla-wrap" style="max-height:none"><table><thead><tr><th>Parámetro</th><th>Estándar</th><th>Requerido</th></tr></thead><tbody>
      <tr><td style="text-align:left">Ventilación mínima</td><td>0,7 m³/h/kg</td><td>${ivFmt(Math.round(inf.ventilacion.min))} m³/hora</td></tr>
      <tr><td style="text-align:left">Capacidad de ventilación</td><td>4 m³/h/kg</td><td>${ivFmt(Math.round(inf.ventilacion.cap))} m³/hora</td></tr>
      </tbody></table></div>`;

    if (inf.ambiente) {
      const a = inf.ambiente;
      let cab, filas;
      if (a.columnas) { cab = a.columnas; filas = a.periodos; }
      else {
        const esJaula = a.periodos.some(x => x[1] != null);
        cab = esJaula ? ['Edad', 'T. jaula (°C)', 'T. piso (°C)', 'Lux', 'Horas luz'] : ['Edad', 'T. piso (°C)', 'Lux', 'Horas luz'];
        filas = a.periodos.map(x => esJaula ? x : [x[0], x[2], x[3], x[4]]);
      }
      html += `<h4 class="iv-prev-h">Temperatura e iluminación de crianza</h4>
        <div class="tabla-wrap" style="max-height:none"><table><thead><tr>${cab.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${filas.map(f => `<tr>${f.map(v => `<td>${v == null ? '—' : v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="iv-nota">Fuente: ${a.fuente}${a.referencial ? ' (referencial)' : ''}</p>`;
    }

    html += `<h4 class="iv-prev-h">Proyección próximas semanas</h4>
      <div class="tabla-wrap" style="max-height:none"><table><thead><tr><th>Sem</th><th>Etapa</th><th>Peso</th><th>Alimento</th><th>Agua</th><th>% Postura</th><th>Huevo</th></tr></thead>
      <tbody>${inf.proyeccion.map(f => `<tr><td>${f.sem}</td><td>${f.etapa}</td><td>${f.peso}</td><td>${f.alimento}</td><td>${f.agua}</td><td>${f.pct}</td><td>${f.huevo}</td></tr>`).join('')}</tbody></table></div>`;

    document.getElementById('iv-prev-cuerpo').innerHTML = html;
  }
}
