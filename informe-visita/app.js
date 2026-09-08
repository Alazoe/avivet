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
const IV_DENSIDAD_POSTURA = 6;                               // aves/m² — recomendación MV Andrés Lazo (postura piso)
const IV_DENSIDAD_CERT = 1 / 0.14;                           // ≈ 7,14 aves/m² — certificación (0,14 m²/ave)
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
  let densidadRefs;   // [{ nombre, densidad(aves/m²) }] — la primera es la usada para el dictamen principal
  if (enCrianza) {
    const fase = ivFasePorSemana(semana);
    densidadRefs = [{ nombre: `Manual (${fase.label})`, densidad: fase.densidad }];
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
    densidadRefs = [
      { nombre: 'Recomendación AviVet', densidad: IV_DENSIDAD_POSTURA },
      { nombre: 'Certificación (0,14 m²/ave)', densidad: IV_DENSIDAD_CERT },
    ];
    const e = EQ.postura;
    equip.push(['Superficie mínima', ivFmt1(n / IV_DENSIDAD_POSTURA) + ' m²', `${IV_DENSIDAD_POSTURA} aves/m² (recomendación AviVet) · certificación ${ivFmt1(IV_DENSIDAD_CERT)} aves/m²`]);
    equip.push(['Nidos individuales', ivFmt(Math.ceil(n / e.nido_individual.ratio)) + ' unidades', '1 cada 5 aves']);
    equip.push(['Nido comunitario', ivFmt1(n / e.nido_comunitario.ratio) + ' m lineales', '1 m cada 120 aves']);
    equip.push(['Bebederos campana', ivFmt(Math.ceil(n / e.bebedero_campana.ratio)) + ' unidades', '1 cada 100 aves']);
    equip.push(['Nipples', ivFmt(Math.ceil(n / e.nipple.ratio)) + ' unidades', '1 cada 12 aves']);
    equip.push(['Comedero lineal', ivFmt1(n * e.comedero.ratio / 100) + ' m', '4 cm/ave']);
    equip.push(['Perchas totales', ivFmt1(n * e.perchas.ratio / 100) + ' m lineales', '15 cm/ave (≥20% elevadas)']);
    if (inp.exterior) equip.push(['Acceso exterior', ivFmt1(n * e.acceso_exterior.ratio) + ' m²', '0,19 m²/ave']);
  }

  // ── densidad real vs referencias ──
  let densidad = null;
  if (inp.superficie > 0) {
    const real = n / inp.superficie;
    densidad = {
      real,
      refs: densidadRefs.map(r => ({
        nombre: r.nombre,
        densidad: r.densidad,
        superficieMin: n / r.densidad,
        ok: real <= r.densidad,
        exceso: real > r.densidad ? Math.round((real / r.densidad - 1) * 100) : 0,
      })),
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
// Diseño de informe técnico: membrete + pie corridos, banner de portada,
// franja-resumen, secciones con franja de color y tablas con cebra.
function ivConstruirDoc(report, D, logo) {
  const VERDE = '1B4332', VERDE2 = '2D6A4F', AMBAR = 'F0A500', AMBAR_CL = 'FBEFCF',
        GRIS = '6B6B6B', TINTA = '1A1A1A', BLANCO = 'FFFFFF',
        BANDA = 'EDF1EE', ZEBRA = 'F6F3ED', CAJA = 'FAF7F0', LINEA = 'D9D4C8',
        ROJO = 'B71C1C', LABEL = 'F0EEE7';
  const FUENTE = 'Calibri';
  const SB = D.BorderStyle.SINGLE, SH = D.ShadingType.CLEAR;
  const AL = D.AlignmentType, VA = D.VerticalAlign;
  const CONTENIDO = 10240;  // ancho útil en twips (carta - márgenes) para tab derecho

  const run = (text, o = {}) => new D.TextRun({
    text: String(text), size: o.size || 20, bold: o.bold, italics: o.italics,
    color: o.color || TINTA, font: FUENTE, allCaps: o.caps,
  });

  const p = (text, o = {}) => new D.Paragraph({
    children: Array.isArray(text) ? text : [run(text, o)],
    spacing: { after: o.after != null ? o.after : 120, before: o.before || 0, line: o.line },
    alignment: o.align,
    shading: o.fill ? { type: SH, color: 'auto', fill: o.fill } : undefined,
    border: o.border,
    indent: o.indent,
  });

  // nota al pie de una tabla (fuente): texto plano, algo más pequeño
  const nota = text => p(text, { size: 18, after: 60 });

  // encabezado de sección: usa el estilo nativo "Título 2" de Word
  // (sin color/banda; el texto sale con el estilo del documento y es editable)
  const h2 = (num, text) => new D.Paragraph({
    heading: D.HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    children: [new D.TextRun({ text: num + '. ' + text })],
  });

  const bordes = () => {
    const b = { style: SB, size: 2, color: LINEA };
    return { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b };
  };

  const celda = (text, { head, bold, fill, color, align, w } = {}) => {
    const s = String(text);
    const auto = s.startsWith('✔') ? VERDE : s.startsWith('✘') ? ROJO : null;
    return new D.TableCell({
      children: [new D.Paragraph({
        children: [run(s, { bold: head || bold || !!auto, color: head ? BLANCO : (color || auto || TINTA), size: head ? 17 : 19, caps: head })],
        spacing: { after: 0 }, alignment: align || (head ? AL.LEFT : undefined),
      })],
      shading: { type: SH, color: 'auto', fill: head ? VERDE : (fill || BLANCO) },
      width: w ? { size: w, type: D.WidthType.PERCENTAGE } : undefined,
      margins: { top: 55, bottom: 55, left: 110, right: 110 },
      verticalAlign: VA.CENTER,
    });
  };

  // tabla con encabezado + filas alternadas (cebra)
  const tabla = (filas, anchos, aligns) => new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    borders: bordes(),
    rows: filas.map((f, i) => new D.TableRow({
      tableHeader: i === 0,
      children: f.map((c, j) => celda(c, {
        head: i === 0, w: anchos ? anchos[j] : undefined,
        align: aligns ? aligns[j] : undefined,
        fill: i > 0 && i % 2 === 0 ? ZEBRA : undefined,
      })),
    })),
  });

  // tabla de datos: etiqueta (fondo) + valor
  const tablaDatos = pares => new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    borders: bordes(),
    rows: pares.map(([k, v]) => new D.TableRow({
      children: [celda(k, { bold: true, w: 36, fill: LABEL }), celda(v, { w: 64 })],
    })),
  });

  // texto libre (observaciones / recomendaciones): párrafo plano, sin recuadro ni color
  const caja = txt => p(txt, { line: 288, after: 140 });
  const lineasVacias = n => Array.from({ length: n }, () =>
    p('', { border: { bottom: { color: LINEA, size: 4, style: SB, space: 8 } }, after: 260 }));

  // ── reporte: {productor, ubicacion, fechaVisita, tipoVisita, propuesta, pabellones:[inf...]} ──
  // compat: si llega un `inf` suelto (un solo pabellón, shape antiguo), envolverlo
  if (report && report.pabellones == null && report.edad) {
    const im = report.meta || {};
    report = { productor: im.productor, ubicacion: im.ubicacion, fechaVisita: im.fechaVisita,
      tipoVisita: im.tipoVisita, propuesta: im.propuesta, pabellones: [report] };
  }
  const seguimiento = report.tipoVisita === 'seguimiento';
  const propuesta = report.propuesta || {};
  const pabs = report.pabellones;
  const multi = pabs.length > 1;
  const visita = new Date((report.fechaVisita || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  const hijos = [];

  const h3 = titulo => new D.Paragraph({ heading: D.HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 }, children: [new D.TextRun({ text: titulo })] });

  // ── membrete: logo AviVet + tipo de documento ──
  const NONE = D.BorderStyle.NONE;
  const brandCell = logo
    ? new D.TableCell({
        children: [new D.Paragraph({ spacing: { after: 0 }, children: [new D.ImageRun({ data: logo, transformation: { width: 250, height: 100 } })] })],
        verticalAlign: VA.CENTER, width: { size: 50, type: D.WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 120, left: 60, right: 60 },
      })
    : new D.TableCell({
        children: [
          new D.Paragraph({ spacing: { after: 0 }, children: [run('AviVet', { bold: true, color: VERDE, size: 40 })] }),
          new D.Paragraph({ spacing: { before: 20 }, children: [new D.TextRun({ text: 'M E D I C I N A   P R O D U C T I V A', color: AMBAR, size: 14, font: FUENTE })] }),
        ],
        verticalAlign: VA.CENTER, width: { size: 50, type: D.WidthType.PERCENTAGE },
        margins: { top: 120, bottom: 120, left: 120, right: 60 },
      });
  const docInfoCell = new D.TableCell({
    children: [
      new D.Paragraph({ alignment: AL.RIGHT, spacing: { after: 0 }, children: [run(seguimiento ? 'INFORME DE SEGUIMIENTO' : 'INFORME DE VISITA TÉCNICA', { bold: true, color: VERDE, size: 20, caps: true })] }),
      new D.Paragraph({ alignment: AL.RIGHT, spacing: { before: 50 }, children: [run(report.productor || 'Productor', { color: TINTA, size: 18 })] }),
      new D.Paragraph({ alignment: AL.RIGHT, spacing: { before: 4 }, children: [run(ivFecha(visita) + (report.ubicacion ? '  ·  ' + report.ubicacion : ''), { color: GRIS, size: 16 })] }),
    ],
    verticalAlign: VA.CENTER, width: { size: 50, type: D.WidthType.PERCENTAGE },
    margins: { top: 120, bottom: 120, left: 60, right: 120 },
  });
  hijos.push(new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    borders: { top: { style: NONE }, left: { style: NONE }, right: { style: NONE }, insideHorizontal: { style: NONE }, insideVertical: { style: NONE }, bottom: { color: AMBAR, size: 28, style: SB } },
    rows: [new D.TableRow({ children: [brandCell, docInfoCell] })],
  }));

  // numeración de secciones (Heading 2)
  let nSec = 0;
  const H = titulo => h2(String(++nSec), titulo);

  // ── helper: franja-resumen (cifras clave) de un pabellón ──
  const pushFichas = inf => {
    const e = inf.edad, o = inf.objetivo, m = inf.meta;
    const fichas = [
      { num: String(e.semana), lbl: 'Semana', sub: e.meses + ' meses' },
      { num: e.etapa, lbl: 'Etapa', sub: e.enCrianza ? e.fase : 'en producción', size: 20 },
      { num: ivFmt(m.aves), lbl: 'Aves', sub: (m.sistema === 'jaula' ? 'Jaula' : 'Piso') + (m.exterior ? ' + exterior' : '') },
    ];
    if (m.superficie > 0) fichas.push({ num: ivFmt1(m.aves / m.superficie), lbl: 'Densidad', sub: 'aves/m²', size: 26 });
    if (!seguimiento) fichas.push(o.pct != null
      ? { num: ivFmt1(o.pct) + '%', lbl: 'Postura esperada', sub: '≈ ' + ivFmt(o.huevosDia) + ' huevos/día' }
      : { num: ivFmt(o.pesoMin * 1000) + '–' + ivFmt(o.pesoMax * 1000), lbl: 'Peso objetivo (g)', sub: 'semana ' + e.semana, size: 18 });
    const ficha = f => new D.TableCell({
      children: [
        new D.Paragraph({ alignment: AL.CENTER, spacing: { before: 60, after: 20 }, children: [run(f.num, { bold: true, color: VERDE, size: f.size || 30 })] }),
        new D.Paragraph({ alignment: AL.CENTER, spacing: { after: 8 }, children: [run(f.lbl, { bold: true, size: 15, caps: true, color: TINTA })] }),
        new D.Paragraph({ alignment: AL.CENTER, spacing: { after: 60 }, children: [run(f.sub, { size: 14, color: GRIS })] }),
      ],
      shading: { type: SH, color: 'auto', fill: CAJA },
      borders: { top: { color: AMBAR, size: 20, style: SB } },
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      width: { size: Math.round(100 / fichas.length), type: D.WidthType.PERCENTAGE },
      verticalAlign: VA.CENTER,
    });
    hijos.push(new D.Paragraph({ spacing: { after: 60 }, children: [] }));
    hijos.push(new D.Table({
      width: { size: 100, type: D.WidthType.PERCENTAGE },
      borders: { top: { style: NONE }, bottom: { style: NONE }, left: { style: NONE }, right: { style: NONE }, insideVertical: { color: BLANCO, size: 8, style: SB }, insideHorizontal: { style: NONE } },
      rows: [new D.TableRow({ children: fichas.map(ficha) })],
    }));
    hijos.push(new D.Paragraph({ spacing: { after: 120 }, children: [] }));
  };

  // ── helper: filas de datos del lote ──
  const filasLote = inf => {
    const e = inf.edad, m = inf.meta;
    const nac = new Date(m.nacimiento + 'T00:00:00');
    const f = [
      ['Línea genética', m.linea],
      ['Nacimiento del lote', ivFecha(nac)],
      ['Edad del lote', `Semana ${e.semana} · día ${e.diaVida} de vida (${e.meses} meses)`],
      ['Etapa', e.etapa + (e.enCrianza ? ` — fase ${e.fase}` : '')],
      ['Número de aves', ivFmt(m.aves)],
    ];
    if (m.largo > 0 && m.ancho > 0) f.push(['Dimensiones del galpón', `${ivFmt1(m.largo)} × ${ivFmt1(m.ancho)} m`]);
    if (m.superficie > 0) {
      f.push(['Superficie del galpón', ivFmt1(m.superficie) + ' m²']);
      f.push(['Densidad actual', ivFmt1(m.aves / m.superficie) + ' aves/m²']);
    }
    f.push(['Sistema', (m.sistema === 'jaula' ? 'Jaula' : 'Piso') + (m.exterior ? ' con acceso exterior' : '')]);
    return f;
  };

  // ── helper: secciones diagnósticas (primera) + observaciones + recomendaciones ──
  const pushDiagnostico = (inf, Hx) => {
    const e = inf.edad, o = inf.objetivo, m = inf.meta;
    if (!seguimiento) {
      hijos.push(Hx(`Parámetros objetivo — semana ${e.semana}`));
      if (e.notaClamp) hijos.push(nota(e.notaClamp));
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
      hijos.push(tabla(par, [34, 28, 38]));
      hijos.push(nota('Fuente: ' + m.fuente));

      hijos.push(Hx(`Equipamiento requerido — ${ivFmt(m.aves)} aves (${e.enCrianza ? 'crianza ' + e.fase : 'postura'})`));
      hijos.push(tabla([['Equipamiento', 'Requerido', 'Estándar'], ...inf.equip], [34, 26, 40]));
      if (e.enCrianza) {
        hijos.push(nota('Comederos redondos según diámetro: ' + IV_COMEDERO_DIAM.map(d => `Ø${d[0]} cm → ${ivFmt(Math.ceil(m.aves / d[1]))} unid. (${d[1]} aves c/u)`).join(' · ')));
      }

      if (inf.densidad) {
        const d = inf.densidad;
        hijos.push(Hx('Densidad'));
        hijos.push(p([run('Densidad actual del galpón:  ', { bold: true }), run(ivFmt1(d.real) + ' aves/m²', { bold: true })], { after: 100 }));
        hijos.push(tabla([
          ['Referencia', 'Densidad máx.', 'Superficie mínima', 'Evaluación'],
          ...d.refs.map(r => [r.nombre, ivFmt1(r.densidad) + ' aves/m²', ivFmt1(r.superficieMin) + ' m²', r.ok ? '✔ Cumple' : `✘ Sobrecarga +${r.exceso}%`]),
        ], [34, 20, 22, 24]));
      }

      if (inf.ambiente) {
        const a = inf.ambiente;
        hijos.push(Hx('Temperatura e iluminación de crianza'));
        let cab, filas;
        if (a.columnas) { cab = a.columnas; filas = a.periodos; }
        else {
          const esJaula = a.periodos.some(x => x[1] != null);
          cab = esJaula ? ['Edad', 'T. jaula (°C)', 'T. piso (°C)', 'Intensidad (lux)', 'Horas de luz'] : ['Edad', 'T. piso (°C)', 'Intensidad (lux)', 'Horas de luz'];
          filas = a.periodos.map(x => esJaula ? x : [x[0], x[2], x[3], x[4]]);
        }
        hijos.push(tabla([cab, ...filas.map(f => f.map(v => v == null ? '—' : v))]));
        hijos.push(nota('Fuente: ' + a.fuente + (a.referencial ? ' (referencial — la línea seleccionada no publica tabla propia)' : '')));
      }
    }
    hijos.push(Hx('Observaciones de la visita'));
    if (m.obs) hijos.push(caja(m.obs)); else hijos.push(...lineasVacias(3));
    hijos.push(Hx('Recomendaciones y acciones a seguir'));
    if (m.reco) hijos.push(caja(m.reco)); else hijos.push(...lineasVacias(3));
  };

  // ── helper: propuesta de trabajo (solo primera visita) ──
  const pushPropuesta = Hx => {
    if (seguimiento) return;
    const obj = (propuesta.objetivos || '').trim(), alc = (propuesta.alcance || '').trim();
    if (!obj && !alc) return;
    hijos.push(Hx('Propuesta de trabajo'));
    hijos.push(p('Objetivos de la asesoría', { bold: true, after: 40 }));
    if (obj) hijos.push(caja(obj)); else hijos.push(...lineasVacias(2));
    hijos.push(p('Alcance y honorarios', { bold: true, before: 120, after: 40 }));
    if (alc) hijos.push(caja(alc)); else hijos.push(...lineasVacias(2));
  };

  // ── cuerpo ──
  if (!multi) {
    const inf = pabs[0];
    pushFichas(inf);
    hijos.push(H('Datos generales'));
    hijos.push(tablaDatos([
      ['Productor / Predio', report.productor || '—'],
      ['Ubicación', report.ubicacion || '—'],
      ['Fecha de visita', ivFecha(visita)],
      ...filasLote(inf),
    ]));
    pushPropuesta(H);
    pushDiagnostico(inf, H);
  } else {
    hijos.push(H('Datos generales del predio'));
    hijos.push(tablaDatos([
      ['Productor / Predio', report.productor || '—'],
      ['Ubicación', report.ubicacion || '—'],
      ['Fecha de visita', ivFecha(visita)],
      ['Tipo de visita', seguimiento ? 'Seguimiento' : 'Primera visita'],
      ['N.º de pabellones', String(pabs.length)],
    ]));
    pushPropuesta(H);
    pabs.forEach((inf, i) => {
      const m = inf.meta, e = inf.edad;
      const etiqueta = (m.nombre && m.nombre.trim()) ? m.nombre.trim() : ('Pabellón ' + (i + 1));
      hijos.push(H(`${etiqueta} — ${m.linea} · Semana ${e.semana} (${e.etapa})`));
      pushFichas(inf);
      hijos.push(h3('Datos del lote'));
      hijos.push(tablaDatos(filasLote(inf)));
      pushDiagnostico(inf, h3);
    });
  }

  // ── firma ──
  hijos.push(new D.Paragraph({ children: [], spacing: { before: 700 } }));
  hijos.push(p('', { border: { bottom: { color: TINTA, size: 6, style: SB, space: 4 } }, align: AL.CENTER, after: 40, indent: { left: 3200, right: 3200 } }));
  hijos.push(p('MV Andrés Lazo Escobar', { align: AL.CENTER, bold: true, after: 20 }));
  hijos.push(p('Médico Veterinario · Asesoría Veterinaria', { align: AL.CENTER, size: 18 }));

  // ── membrete y pie corridos ──
  const header = new D.Header({
    children: [new D.Paragraph({
      tabStops: [{ type: D.TabStopType.RIGHT, position: CONTENIDO }],
      spacing: { after: 30 },
      border: { bottom: { color: AMBAR, size: 10, style: SB, space: 4 } },
      children: [
        run('AviVet', { bold: true, color: VERDE, size: 22 }),
        run('   Asesoría Veterinaria', { color: AMBAR, size: 16 }),
        new D.TextRun({ text: '\tMV Andrés Lazo Escobar · avivet.cl', color: GRIS, size: 16, font: FUENTE }),
      ],
    })],
  });
  const footer = new D.Footer({
    children: [new D.Paragraph({
      tabStops: [{ type: D.TabStopType.RIGHT, position: CONTENIDO }],
      spacing: { before: 40 },
      border: { top: { color: LINEA, size: 4, style: SB, space: 4 } },
      children: [
        run('WhatsApp +56 9 5895 6340 · andreslazomv@outlook.com', { color: GRIS, size: 15 }),
        new D.TextRun({ children: ['\tPágina ', D.PageNumber.CURRENT, ' de ', D.PageNumber.TOTAL_PAGES], color: GRIS, size: 15, font: FUENTE }),
      ],
    })],
  });

  return new D.Document({
    styles: { default: { document: { run: { font: FUENTE, size: 20, color: TINTA } } } },
    sections: [{
      properties: { page: { margin: { top: 1100, bottom: 1000, left: 1000, right: 1000 } } },
      headers: { default: header },
      footers: { default: footer },
      children: hijos,
    }],
  });
}

function ivNombreArchivo(r) {
  // acepta un reporte {productor, fechaVisita, tipoVisita} o un inf suelto {meta:{...}}
  const meta = r.pabellones ? r : (r.meta || r);
  const prod = (meta.productor || 'productor').trim().replace(/[^\wáéíóúñÁÉÍÓÚÑ-]+/g, '_');
  const tipo = meta.tipoVisita === 'seguimiento' ? 'Seguimiento' : 'PrimeraVisita';
  return `Informe_${tipo}_${prod}_${meta.fechaVisita || new Date().toISOString().slice(0, 10)}.docx`;
}

// Carga el logo AviVet (assets/avivet_logo.png) como bytes para incrustarlo en el .docx.
// Devuelve Uint8Array, o null si no está disponible (el documento cae al monograma).
let ivLogoCache = null;
async function ivCargarLogo() {
  if (ivLogoCache !== null) return ivLogoCache || null;
  try {
    const r = await fetch('assets/avivet_logo.png');
    ivLogoCache = r.ok ? new Uint8Array(await r.arrayBuffer()) : false;
  } catch { ivLogoCache = false; }
  return ivLogoCache || null;
}

// ── EXPORT PARA NODE (tests) ────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ivCalcular, ivConstruirDoc, ivNombreArchivo, IV_FASES_CRIANZA, IV_VENT };
}

// ── UI (solo navegador) ─────────────────────────────────────────────────
if (typeof document !== 'undefined' && typeof window !== 'undefined') {

  let ivReporte = null;
  const ivEsc = t => (t == null ? '' : String(t)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ivPabVacio = () => ({ nombre: '', linea: Object.keys(LINEAS)[0], nacimiento: '', aves: '', largo: '', ancho: '', superficie: '', sistema: 'piso', exterior: false, obs: '', reco: '' });

  // ── bloque de pabellón en el formulario ──
  function ivPabBloqueHTML(p, i, total) {
    const lineaOpts = Object.keys(LINEAS).map(k => `<option value="${k}"${k === p.linea ? ' selected' : ''}>${k}</option>`).join('');
    const sisOpts = `<option value="piso"${p.sistema === 'piso' ? ' selected' : ''}>Piso</option><option value="jaula"${p.sistema === 'jaula' ? ' selected' : ''}>Jaula</option>`;
    return `<div class="pab-bloque" data-pab="${i}">
      <div class="pab-head">
        <span class="pab-titulo">Pabellón ${i + 1}</span>
        ${total > 1 ? `<button type="button" class="pab-del" onclick="ivEliminarPabellon(${i})">Eliminar</button>` : ''}
      </div>
      <div class="form-grid">
        <div class="campo"><label>Nombre / etiqueta (opcional)</label><input type="text" data-f="nombre" value="${ivEsc(p.nombre)}" placeholder="Ej: Galpón 1"></div>
        <div class="campo"><label>Línea genética</label><select data-f="linea">${lineaOpts}</select></div>
        <div class="campo"><label>Nacimiento del lote</label><input type="date" data-f="nacimiento" value="${ivEsc(p.nacimiento)}"></div>
        <div class="campo"><label>Número de aves</label><input type="number" inputmode="numeric" min="1" data-f="aves" value="${ivEsc(p.aves)}" placeholder="Ej: 2000"></div>
        <div class="campo"><label>Sistema</label><select data-f="sistema">${sisOpts}</select></div>
        <div class="campo"><label>Galpón — largo (m)</label><input type="number" inputmode="decimal" min="0" step="0.1" data-f="largo" value="${ivEsc(p.largo)}" oninput="ivDimensiones(${i})"></div>
        <div class="campo"><label>Galpón — ancho (m)</label><input type="number" inputmode="decimal" min="0" step="0.1" data-f="ancho" value="${ivEsc(p.ancho)}" oninput="ivDimensiones(${i})"></div>
        <div class="campo"><label>Superficie (m²)</label><input type="number" inputmode="decimal" min="0" step="0.1" data-f="superficie" value="${ivEsc(p.superficie)}" placeholder="se calcula sola"></div>
        <div class="campo campo-check"><input type="checkbox" data-f="exterior" ${p.exterior ? 'checked' : ''}><label>Con acceso exterior</label></div>
        <div class="campo campo-full"><label>Observaciones de este pabellón</label><textarea data-f="obs" placeholder="Estado sanitario, cama, plumaje, hallazgos…">${ivEsc(p.obs)}</textarea></div>
        <div class="campo campo-full"><label>Recomendaciones y acciones</label><textarea data-f="reco" placeholder="Ajustes de manejo, equipamiento faltante, próximos pasos…">${ivEsc(p.reco)}</textarea></div>
      </div>
    </div>`;
  }

  function ivLeerPabs() {
    return [...document.querySelectorAll('#iv-pabellones .pab-bloque')].map(bl => {
      const g = f => bl.querySelector(`[data-f="${f}"]`);
      return {
        nombre: g('nombre').value.trim(), linea: g('linea').value, nacimiento: g('nacimiento').value,
        aves: g('aves').value, largo: g('largo').value, ancho: g('ancho').value, superficie: g('superficie').value,
        sistema: g('sistema').value, exterior: g('exterior').checked,
        obs: g('obs').value.trim(), reco: g('reco').value.trim(),
      };
    });
  }
  function ivRenderPabs(pabs) {
    document.getElementById('iv-pabellones').innerHTML = pabs.map((p, i) => ivPabBloqueHTML(p, i, pabs.length)).join('');
  }

  window.ivAgregarPabellon = function () {
    const pabs = ivLeerPabs(); pabs.push(ivPabVacio()); ivRenderPabs(pabs);
    const ult = document.querySelector(`#iv-pabellones .pab-bloque[data-pab="${pabs.length - 1}"]`);
    if (ult) ult.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  window.ivEliminarPabellon = function (i) {
    const pabs = ivLeerPabs(); pabs.splice(i, 1); if (!pabs.length) pabs.push(ivPabVacio()); ivRenderPabs(pabs);
  };
  window.ivDimensiones = function (i) {
    const bl = document.querySelector(`#iv-pabellones .pab-bloque[data-pab="${i}"]`); if (!bl) return;
    const l = parseFloat(bl.querySelector('[data-f="largo"]').value), a = parseFloat(bl.querySelector('[data-f="ancho"]').value);
    if (l > 0 && a > 0) bl.querySelector('[data-f="superficie"]').value = (l * a).toFixed(1);
  };
  window.ivToggleTipo = function () {
    const seg = document.getElementById('iv-tipo').value === 'seguimiento';
    const card = document.getElementById('iv-propuesta-card');
    if (card) card.style.display = seg ? 'none' : '';
  };

  window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('iv-pabellones')) return;
    ivRenderPabs([ivPabVacio()]);
    document.getElementById('iv-fecha-visita').value = new Date().toISOString().slice(0, 10);
    document.getElementById('iv-fecha-hoy').textContent = new Date().toLocaleDateString('es-CL');
    window.ivToggleTipo();
  });

  function ivLeerReporte() {
    return {
      tipoVisita: document.getElementById('iv-tipo').value,
      productor: document.getElementById('iv-productor').value.trim(),
      ubicacion: document.getElementById('iv-ubicacion').value.trim(),
      fechaVisita: document.getElementById('iv-fecha-visita').value,
      propuesta: {
        objetivos: document.getElementById('iv-prop-obj').value.trim(),
        alcance: document.getElementById('iv-prop-alc').value.trim(),
      },
      pabs: ivLeerPabs(),
    };
  }

  window.ivGenerar = function () {
    const err = document.getElementById('iv-error');
    err.style.display = 'none';
    const r = ivLeerReporte();
    const pabInfs = [];
    for (let i = 0; i < r.pabs.length; i++) {
      const pin = r.pabs[i];
      const inf = ivCalcular({
        ...pin, tipoVisita: r.tipoVisita, productor: r.productor, ubicacion: r.ubicacion, fechaVisita: r.fechaVisita,
        aves: parseInt(pin.aves) || 0, largo: parseFloat(pin.largo) || 0, ancho: parseFloat(pin.ancho) || 0, superficie: parseFloat(pin.superficie) || 0,
      });
      if (inf.error) {
        err.textContent = (r.pabs.length > 1 ? `Pabellón ${i + 1}: ` : '') + inf.error;
        err.style.display = 'block';
        document.getElementById('iv-resultado').style.display = 'none';
        return;
      }
      pabInfs.push(inf);
    }
    ivReporte = { productor: r.productor, ubicacion: r.ubicacion, fechaVisita: r.fechaVisita, tipoVisita: r.tipoVisita, propuesta: r.propuesta, pabellones: pabInfs };
    ivRenderPreview(ivReporte);
    document.getElementById('iv-resultado').style.display = 'block';
    document.getElementById('iv-resultado').scrollIntoView({ behavior: 'smooth' });
  };

  window.ivDescargarWord = async function () {
    if (!ivReporte) return;
    const logo = await ivCargarLogo();
    const doc = ivConstruirDoc(ivReporte, docx, logo);
    const blob = await docx.Packer.toBlob(doc);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = ivNombreArchivo(ivReporte);
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // preview de un pabellón (devuelve HTML)
  function ivPreviewPabellon(inf, seguimiento, titulo) {
    const e = inf.edad, o = inf.objetivo, m = inf.meta;
    const fila = (a, b) => `<tr><td style="text-align:left;font-weight:500">${a}</td><td style="text-align:left">${b}</td></tr>`;
    let html = titulo ? `<h3 class="iv-prev-pab">${ivEsc(titulo)} — ${m.linea} · Semana ${e.semana} (${e.etapa})</h3>` : '';
    let fichas = `
      <div class="eq-ficha"><div class="eq-num">${e.semana}</div><div class="eq-lbl">Semana de vida</div><div class="eq-unit">día ${e.diaVida} · ${e.meses} meses</div></div>
      <div class="eq-ficha"><div class="eq-num" style="font-size:20px;padding-top:8px">${e.etapa}</div><div class="eq-lbl">Etapa</div><div class="eq-unit">${e.enCrianza ? 'fase ' + e.fase : 'en producción'}</div></div>
      <div class="eq-ficha"><div class="eq-num">${ivFmt(m.aves)}</div><div class="eq-lbl">Aves</div><div class="eq-unit">${m.sistema === 'jaula' ? 'Jaula' : 'Piso'}</div></div>`;
    if (m.superficie > 0) fichas += `<div class="eq-ficha"><div class="eq-num">${ivFmt1(m.aves / m.superficie)}</div><div class="eq-lbl">Densidad actual</div><div class="eq-unit">aves/m²</div></div>`;
    if (!seguimiento) fichas += `
      <div class="eq-ficha"><div class="eq-num">${ivFmt1(o.alimentoLoteMin)}–${ivFmt1(o.alimentoLoteMax)}</div><div class="eq-lbl">Alimento lote</div><div class="eq-unit">kg/día</div></div>
      <div class="eq-ficha"><div class="eq-num">${ivFmt1(o.aguaLoteMin)}–${ivFmt1(o.aguaLoteMax)}</div><div class="eq-lbl">Agua lote</div><div class="eq-unit">L/día</div></div>
      ${o.huevosDia != null ? `<div class="eq-ficha"><div class="eq-num">${ivFmt(o.huevosDia)}</div><div class="eq-lbl">Huevos/día esperados</div><div class="eq-unit">${ivFmt(o.bandejasDia)} bandejas de 30</div></div>` : ''}`;
    html += `<div class="eq-grid" style="margin-bottom:20px">${fichas}</div>`;

    if (!seguimiento) {
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
        const d = inf.densidad, todasOk = d.refs.every(r => r.ok);
        html += `<div class="iv-densidad ${todasOk ? 'ok' : 'alerta'}">Densidad actual del galpón: <strong>${ivFmt1(d.real)} aves/m²</strong></div>
        <div class="tabla-wrap" style="max-height:none"><table><thead><tr><th>Referencia</th><th>Densidad máx.</th><th>Superficie mínima</th><th>Evaluación</th></tr></thead>
        <tbody>${d.refs.map(r => `<tr><td style="text-align:left;font-weight:500">${r.nombre}</td><td>${ivFmt1(r.densidad)} aves/m²</td><td>${ivFmt1(r.superficieMin)} m²</td><td style="font-weight:600;color:${r.ok ? '#1b4332' : '#b71c1c'}">${r.ok ? '✔ Cumple' : '✘ Sobrecarga +' + r.exceso + '%'}</td></tr>`).join('')}</tbody></table></div>`;
      }
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
    }
    html += `<h4 class="iv-prev-h">Observaciones</h4>
      <p style="white-space:pre-wrap;color:${m.obs ? 'var(--tinta)' : 'var(--tenue)'}">${m.obs ? ivEsc(m.obs) : '(se completará en el documento)'}</p>`;
    html += `<h4 class="iv-prev-h">Recomendaciones y acciones a seguir</h4>
      <p style="white-space:pre-wrap;color:${m.reco ? 'var(--tinta)' : 'var(--tenue)'}">${m.reco ? ivEsc(m.reco) : '(se completará en el documento)'}</p>`;
    return html;
  }

  function ivRenderPreview(report) {
    const seguimiento = report.tipoVisita === 'seguimiento';
    const multi = report.pabellones.length > 1;
    document.getElementById('iv-prev-titulo').textContent =
      `${report.productor || 'Productor'} · ${report.pabellones.length} pabellón${report.pabellones.length > 1 ? 'es' : ''}` + (seguimiento ? ' · Seguimiento' : '');

    let html = '';
    if (seguimiento) html += `<p class="iv-nota" style="margin-bottom:22px">Informe de <strong>seguimiento</strong>: datos, observaciones y recomendaciones/acciones. Se omiten objetivo y equipamiento (van en la primera visita).</p>`;
    if (!seguimiento && (report.propuesta.objetivos || report.propuesta.alcance)) {
      html += `<h4 class="iv-prev-h">Propuesta de trabajo</h4>`;
      html += `<p style="white-space:pre-wrap"><strong>Objetivos:</strong> ${report.propuesta.objetivos ? ivEsc(report.propuesta.objetivos) : '—'}</p>`;
      html += `<p style="white-space:pre-wrap"><strong>Alcance y honorarios:</strong> ${report.propuesta.alcance ? ivEsc(report.propuesta.alcance) : '—'}</p>`;
    }
    report.pabellones.forEach((inf, i) => {
      html += ivPreviewPabellon(inf, seguimiento, multi ? ((inf.meta.nombre && inf.meta.nombre.trim()) || 'Pabellón ' + (i + 1)) : null);
      if (multi && i < report.pabellones.length - 1) html += '<hr style="border:0;border-top:1px solid var(--linea);margin:28px 0">';
    });
    document.getElementById('iv-prev-cuerpo').innerHTML = html;
  }
}
