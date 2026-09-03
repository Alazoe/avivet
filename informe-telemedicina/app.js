/* ============================================================
   Informe de Telemedicina · avivet.cl
   Resumen del MV tras una sesión remota: temas tratados,
   indicaciones (vacunación / antiparasitarios / otros
   medicamentos) y observaciones. Captura por voz/teclado,
   guardado local, y descarga de un Word (.docx) editable.
   No depende de curvas-geneticas: es un módulo autónomo.
   ============================================================ */

// ── CATÁLOGOS (chips de inserción rápida — el detalle exacto de dosis por
//    caso lo escribe o dicta el MV; esto evita reescribir lo de siempre y
//    deja la utilidad/indicación de cada producto a mano, tipo ficha técnica) ──
const TM_TEMAS = [
  { id: 'sanitario',     label: 'Manejo sanitario general' },
  { id: 'alimentacion',  label: 'Alimentación y agua' },
  { id: 'vacunacion',    label: 'Vacunación' },
  { id: 'parasitos',     label: 'Control de parásitos' },
  { id: 'bioseguridad',  label: 'Bioseguridad' },
  { id: 'instalaciones', label: 'Instalaciones / equipamiento' },
  { id: 'produccion',    label: 'Postura / producción' },
];

// Vacunas frecuentes en traspatio/criollas, con la enfermedad que previenen.
const TM_VACUNAS = [
  { label: 'Newcastle',            indicacion: 'Paramyxovirus aviar — alta mortalidad, notificación obligatoria SAG.' },
  { label: 'Bronquitis infecciosa',indicacion: 'Virus IBV — cuadro respiratorio, caída de postura y calidad de huevo.' },
  { label: 'Viruela aviar',        indicacion: 'Avipoxvirus — lesiones en cresta/patas; se aplica por punción alar.' },
  { label: 'Coriza infecciosa',    indicacion: 'Avibacterium paragallinarum — hinchazón facial, secreción nasal, caída de postura.' },
  { label: 'Cólera aviar',         indicacion: 'Pasteurella multocida — mortalidad aguda, cuadros crónicos articulares.' },
];

// Calendario de referencia AGRICOVIAL (pollas de reemplazo, programa comercial real) —
// solo para consulta rápida dentro del bloque de vacunación; no se inserta en el informe.
const TM_CALENDARIO_REF = {
  fuente: 'AGRICOVIAL — programa real de pollas de reemplazo (referencial, adaptar según el caso)',
  filas: [
    ['1',   'Marek + LT',                 'INNOVAX ILT-SB1',      's.c.'],
    ['1',   'Gumboro',                    'NOVAMUNE',              'spray'],
    ['1',   'Bronquitis',                 'NOBILIS MA S',          'spray'],
    ['1',   'Salmonella',                 'SALMONELLA VAC E',      'spray'],
    ['28',  'Bronquitis',                 'IB 4/91',               'spray'],
    ['42',  'Newcastle',                  'ND C 2',                'spray'],
    ['42',  'Salmonella',                 'SALMONELLA VAC E',      'agua'],
    ['42',  'Bronquitis',                 'NOBILIS MA 5',          'spray'],
    ['63',  'Coriza',                     'Coriza autovacuna',     'I.M.'],
    ['63',  'Viruela + LT + AE',          'VECTORMUNE FP LT AE',   'P.A.'],
    ['63',  'Bronquitis + Newcastle',     'IBI L',                 'spray'],
    ['98',  'Coriza + ND + IBV + EDS + SE','CEVAC CORYMUNE 7',     'I.M.'],
    ['126', 'Bronquitis',                 'IBIRD',                 'spray'],
  ],
};

// Antiparasitarios sin ficha/calculadora propia en el sitio — solo nombre + indicación.
const TM_ANTIPARASITARIOS_EXTRA = [
  { label: 'Ivermectina',       indicacion: 'Endo y ectoparásitos: nematodos, ácaros, piojos. Inyectable o pour-on.' },
  { label: 'Fenbendazol',       indicacion: 'Nematodos gastrointestinales.' },
  { label: 'Piperazina',        indicacion: 'Áscaris (Ascaridia galli).' },
  { label: 'Amprolio',          indicacion: 'Coccidiosis (Eimeria spp.) — coccidiostato, no es antiparasitario externo.' },
  { label: 'Tierra de diatomeas', indicacion: 'Control ambiental de ectoparásitos (ácaros, piojos) en cama y nidos.' },
];

// Otros tratamientos de apoyo sin ficha/calculadora propia.
const TM_OTROS_EXTRA = [
  { label: 'Vitaminas + electrolitos', indicacion: 'Soporte en estrés, post-tratamiento o post-transporte.' },
  { label: 'Calcio',                   indicacion: 'Suplemento para postura — cáscara débil o baja densidad.' },
  { label: 'Probióticos',              indicacion: 'Recuperación de flora intestinal, post-antibiótico.' },
];

// Fármacos con ficha técnica y calculadora de dosis propia en ../calculadoras-dosis/
// (mismo texto de indicación/dosis que sus tarjetas en calculadoras-dosis/index.html —
// un solo origen de la verdad: si cambia allá, actualizar aquí también).
const TM_CATALOGO_MED = [
  { slug: 'zanil80',        activo: 'Oxitetraciclina',              comercial: 'ZANIL® 80', tipo: 'Polvo en alimento',
    indicacion: 'Cólera Aviar · ERC · Coriza Infecciosa', dosis: '25–73,75 mg/kg/día', duracion: '7–14 días' },
  { slug: 'oxitetraciclina',activo: 'Oxitetraciclina',              comercial: 'Zanil® HCL 80% / TERRIVET® 65,5%', tipo: 'Polvo soluble',
    indicacion: 'Sinovitis (M. synoviae) · Respiratorio: M. gallisepticum, E. coli, P. multocida', dosis: '16,8–90,1 mg/kg PV/día', duracion: '5–14 días' },
  { slug: 'florfenicol',    activo: 'Florfenicol',                  comercial: 'Veterin® 10%', tipo: 'Solución oral',
    indicacion: 'E. coli · Pasteurella spp. · Haemophilus spp.', dosis: '0,1–0,3 mL/kg PV/día', duracion: '5–7 días' },
  { slug: 'primavet',       activo: 'Amoxicilina',                  comercial: 'Primavet® 50%', tipo: 'Polvo soluble',
    indicacion: 'Staphylococcus · Streptococcus · P. multocida · A. paragallinarum · E. coli · Salmonella spp.', dosis: '40 mg/kg PV/día (fijo)', duracion: '5–7 días' },
  { slug: 'azovetril',      activo: 'Trimetoprim + Sulfa',          comercial: 'Azovetril®', tipo: 'Solución oral',
    indicacion: 'Coccidiosis · Coriza infecciosa · Pasteurelosis · Colibacilosis · Salmonelosis', dosis: '0,125–0,25 mL/kg PV/día', duracion: '5 días' },
  { slug: 'levantel',       activo: 'Levamisol',                    comercial: 'LEVANTEL® 46%', tipo: 'Antiparasitario', antiparasitario: true,
    indicacion: 'Ascaridia galli · Heterakis gallinae · Capillaria spp.', dosis: '30–40 mg Levamisol base/kg PV', duracion: 'Dosis única' },
  { slug: 'quiflumil',      activo: 'Enrofloxacino',                comercial: 'QUIFLUMIL® 10%', tipo: 'Uso restringido',
    indicacion: 'H. paragallinarum · P. multocida · E. coli · Mycoplasma spp. · Salmonella spp. (fluoroquinolona, no primera línea)', dosis: '0,1 mL/kg PV/día (fijo)', duracion: '5 días · CRD: 10 días' },
  { slug: 'enrofloxacino',  activo: 'Enrofloxacino',                comercial: 'Enromic® 20%', tipo: 'Uso restringido',
    indicacion: 'E. coli · Pasteurella spp. · Salmonella spp. · Mycoplasma spp. (fluoroquinolona, no primera línea)', dosis: '0,05 mL/kg PV/día (fijo)', duracion: '3–5 días' },
  { slug: 'duflosan',       activo: 'Florfenicol',                  comercial: 'DUFLOSAN® 2%', tipo: 'Solución oral',
    indicacion: 'Colibacilosis Aviar (E. coli)', dosis: '0,5–0,75 mL/kg/dosis', duracion: '5 días · 2 dosis/día' },
  { slug: 'coliprim',       activo: 'Sulfacloropiridazina + TMP',   comercial: 'COLIPRIM®', tipo: 'Solución oral',
    indicacion: 'Colibacilosis · Salmonelosis · Pasteurelosis · Coriza infecciosa', dosis: '1–1,5 mL/L de agua (~30 mg/kg PV)', duracion: '5 días' },
];

// Convierte una entrada simple {label, indicacion} en chip: inserta nombre + indicación.
function tmChipDesdeExtra(e) {
  return { label: e.label, title: e.indicacion, insert: `• ${e.label} — ${e.indicacion} ` };
}
// Convierte un producto de TM_CATALOGO_MED en chip: inserta ficha resumida + link a la calculadora.
function tmChipDesdeProducto(m) {
  return {
    label: m.comercial, slug: m.slug,
    title: `${m.activo} · ${m.tipo}\nIndicado en: ${m.indicacion}\nDosis ref.: ${m.dosis}, ${m.duracion}`,
    insert: `• ${m.comercial} (${m.activo}) — ${m.indicacion} · Dosis ref.: ${m.dosis}, ${m.duracion}. `,
  };
}

const TM_BLOQUES = [
  { id: 'vacunacion',      label: 'Indicaciones de vacunación',
    hint: 'Vacuna, edad/momento y vía. Toca un chip para partir la línea con la enfermedad que previene.',
    chips: TM_VACUNAS.map(tmChipDesdeExtra), calendario: TM_CALENDARIO_REF },
  { id: 'antiparasitarios', label: 'Indicaciones antiparasitarias',
    hint: 'Producto, dosis y frecuencia. El 🧮 abre la calculadora de dosis del producto.',
    chips: [
      ...TM_CATALOGO_MED.filter(m => m.antiparasitario).map(tmChipDesdeProducto),
      ...TM_ANTIPARASITARIOS_EXTRA.map(tmChipDesdeExtra),
    ] },
  { id: 'otrosMed',        label: 'Otros medicamentos y tratamientos',
    hint: 'Antibióticos, vitaminas, suplementos… El 🧮 abre la calculadora de dosis del producto.',
    chips: [
      ...TM_CATALOGO_MED.filter(m => !m.antiparasitario).map(tmChipDesdeProducto),
      ...TM_OTROS_EXTRA.map(tmChipDesdeExtra),
    ] },
];

const TM_TIPO_AVES = [
  ['criollas', 'Gallinas criollas / traspatio'],
  ['ponedoras', 'Ponedoras comerciales'],
  ['engorda', 'Pollos de engorda'],
  ['mixto', 'Plantel mixto'],
  ['otro', 'Otro'],
];

const TM_MODALIDAD = [
  ['videollamada', 'Videollamada'],
  ['llamada', 'Llamada telefónica'],
  ['whatsapp', 'WhatsApp (texto/audio)'],
  ['otro', 'Otra'],
];

// ── UTILIDADES ──────────────────────────────────────────────────────────
const tmFmt = n => Number(n).toLocaleString('es-CL');
const tmFecha = d => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
const tmLabel = (lista, val) => (lista.find(([k]) => k === val) || [null, val])[1];

const TM_KEY_SESIONES = 'avivet_telemedicina_sesiones';
const TM_KEY_ACTUAL = 'avivet_telemedicina_actual';

let tmSesiones = [];
let tmActualId = null;
let tmGuardarTimer = null;

// ── PERSISTENCIA (localStorage — nada se envía a servidores) ────────────
function tmCargar() {
  try { tmSesiones = JSON.parse(localStorage.getItem(TM_KEY_SESIONES)) || []; }
  catch { tmSesiones = []; }
  tmActualId = localStorage.getItem(TM_KEY_ACTUAL) || null;
}
function tmPersistir() {
  localStorage.setItem(TM_KEY_SESIONES, JSON.stringify(tmSesiones));
  if (tmActualId) localStorage.setItem(TM_KEY_ACTUAL, tmActualId);
  else localStorage.removeItem(TM_KEY_ACTUAL);
}
function tmSesionActual() {
  return tmSesiones.find(s => s.id === tmActualId) || null;
}

// ── MODELO ──────────────────────────────────────────────────────────────
function tmNuevaSesion() {
  const s = {
    id: 't' + Date.now(),
    productor: '', ubicacion: '',
    tipoAves: 'criollas', aves: '',
    fechaSesion: new Date().toISOString().slice(0, 10),
    modalidad: 'videollamada',
    temas: {}, vacunacion: '', antiparasitarios: '', otrosMed: '',
    observaciones: '', seguimiento: '',
    creado: Date.now(), modificado: Date.now(),
  };
  tmSesiones.unshift(s);
  tmActualId = s.id;
  tmPersistir();
  return s;
}

function tmLeerFormularioA(s) {
  const g = id => document.getElementById(id);
  s.productor  = g('tm-productor').value.trim();
  s.ubicacion  = g('tm-ubicacion').value.trim();
  s.tipoAves   = g('tm-tipo-aves').value;
  s.aves       = g('tm-aves').value;
  s.fechaSesion= g('tm-fecha').value;
  s.modalidad  = g('tm-modalidad').value;
  s.observaciones = g('tm-observaciones').value.trim();
  s.seguimiento   = g('tm-seguimiento').value.trim();
  s.temas = {};
  TM_TEMAS.forEach(t => { s.temas[t.id] = !!g('tm-tema-' + t.id).checked; });
  TM_BLOQUES.forEach(b => { s[b.id] = g('tm-blk-' + b.id).value.trim(); });
  s.modificado = Date.now();
}

function tmPintarFormularioDe(s) {
  const g = id => document.getElementById(id);
  g('tm-productor').value  = s.productor || '';
  g('tm-ubicacion').value  = s.ubicacion || '';
  g('tm-tipo-aves').value  = s.tipoAves || 'criollas';
  g('tm-aves').value       = s.aves || '';
  g('tm-fecha').value      = s.fechaSesion || '';
  g('tm-modalidad').value  = s.modalidad || 'videollamada';
  g('tm-observaciones').value = s.observaciones || '';
  g('tm-seguimiento').value   = s.seguimiento || '';
  TM_TEMAS.forEach(t => { g('tm-tema-' + t.id).checked = !!(s.temas && s.temas[t.id]); });
  TM_BLOQUES.forEach(b => { g('tm-blk-' + b.id).value = s[b.id] || ''; });
}

// ── AUTOSAVE ────────────────────────────────────────────────────────────
function tmAutoguardar() {
  clearTimeout(tmGuardarTimer);
  tmGuardarTimer = setTimeout(() => {
    const s = tmSesionActual();
    if (!s) return;
    tmLeerFormularioA(s);
    tmSesiones = [s, ...tmSesiones.filter(x => x.id !== s.id)];
    tmPersistir();
    tmRenderLista();
    tmMarcarGuardado();
  }, 500);
}

function tmMarcarGuardado() {
  const el = document.getElementById('tm-estado');
  if (!el) return;
  el.textContent = '✔ Guardado en este dispositivo · ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  el.classList.add('visible');
}

// ── CHIPS de inserción rápida (cada chip trae su línea ya armada: nombre +
//    indicación/dosis de referencia; el MV ajusta el detalle del caso) ──────
function tmInsertarChip(textareaId, linea) {
  const ta = document.getElementById(textareaId);
  ta.value = (ta.value && !ta.value.endsWith('\n') ? ta.value + '\n' : ta.value) + linea;
  ta.focus();
  ta.selectionStart = ta.selectionEnd = ta.value.length;
  tmAutoguardar();
}

// Construye el DOM de un chip (botón que inserta la línea + link 🧮 opcional a
// la calculadora del producto). Se arma con DOM/textContent, no con HTML
// interpolado, porque las indicaciones traen comas, puntos y paréntesis.
function tmCrearChipEl(c, textareaId) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'tm-chip';
  boton.textContent = c.label;
  if (c.title) boton.title = c.title;
  boton.addEventListener('click', () => tmInsertarChip(textareaId, c.insert));
  if (!c.slug) return boton;

  const wrap = document.createElement('span');
  wrap.className = 'tm-chip-wrap';
  wrap.appendChild(boton);
  const link = document.createElement('a');
  link.className = 'tm-chip-link';
  link.href = '../calculadoras-dosis/' + c.slug + '.html';
  link.target = '_blank';
  link.rel = 'noopener';
  link.title = 'Abrir calculadora de dosis';
  link.textContent = '🧮';
  wrap.appendChild(link);
  return wrap;
}

// Tabla de consulta rápida (colapsable) con un calendario de referencia real.
function tmCrearCalendarioEl(cal) {
  const det = document.createElement('details');
  det.className = 'tm-calendario';
  const sum = document.createElement('summary');
  sum.textContent = '📅 Ver calendario de referencia';
  det.appendChild(sum);
  const nota = document.createElement('p');
  nota.className = 'tm-calendario-nota';
  nota.textContent = cal.fuente;
  det.appendChild(nota);
  const tabla = document.createElement('table');
  tabla.innerHTML = '<thead><tr><th>Día</th><th>Enfermedad</th><th>Vacuna</th><th>Vía</th></tr></thead>';
  const tbody = document.createElement('tbody');
  cal.filas.forEach(f => {
    const tr = document.createElement('tr');
    f.forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);
  det.appendChild(tabla);
  return det;
}

// Construye la tarjeta completa de un bloque de indicaciones (título, mic,
// chips, calendario opcional y el textarea).
function tmCrearBloqueEl(b, sinVoz) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta';

  const head = document.createElement('div');
  head.className = 'tm-blk-head';
  const h2 = document.createElement('h2');
  h2.textContent = b.label;
  head.appendChild(h2);
  if (!sinVoz) {
    const mic = document.createElement('button');
    mic.type = 'button';
    mic.className = 'tm-mic';
    mic.title = 'Dictar por voz';
    mic.textContent = '🎤 Dictar';
    mic.addEventListener('click', () => tmToggleDictado('tm-blk-' + b.id, mic));
    head.appendChild(mic);
  }
  tarjeta.appendChild(head);

  const chips = document.createElement('div');
  chips.className = 'tm-chips';
  b.chips.forEach(c => chips.appendChild(tmCrearChipEl(c, 'tm-blk-' + b.id)));
  tarjeta.appendChild(chips);

  if (b.calendario) tarjeta.appendChild(tmCrearCalendarioEl(b.calendario));

  const ta = document.createElement('textarea');
  ta.id = 'tm-blk-' + b.id;
  ta.placeholder = b.hint;
  tarjeta.appendChild(ta);

  return tarjeta;
}

// ── Dictado por voz (Web Speech API, si el navegador lo soporta) ─────────
const TM_SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let tmRecActivo = null;

function tmToggleDictado(textareaId, boton) {
  if (!TM_SR) return;
  if (tmRecActivo && tmRecActivo.textareaId === textareaId) { tmRecActivo.rec.stop(); return; }
  if (tmRecActivo) tmRecActivo.rec.stop();

  const ta = document.getElementById(textareaId);
  const rec = new TM_SR();
  rec.lang = 'es-CL';
  rec.continuous = true;
  rec.interimResults = false;
  const base = ta.value;
  rec.onresult = e => {
    let add = '';
    for (let i = e.resultIndex; i < e.results.length; i++) add += e.results[i][0].transcript;
    ta.value = (base ? base + ' ' : '') + add.trim();
    tmAutoguardar();
  };
  rec.onend = () => { boton.classList.remove('grabando'); tmRecActivo = null; };
  rec.onerror = () => { boton.classList.remove('grabando'); tmRecActivo = null; };
  rec.start();
  boton.classList.add('grabando');
  tmRecActivo = { rec, textareaId };
}

// ── UI: lista de sesiones guardadas ──────────────────────────────────────
function tmRenderLista() {
  const cont = document.getElementById('tm-lista');
  if (!cont) return;
  if (!tmSesiones.length) { cont.innerHTML = '<p class="tm-vacio">Aún no hay sesiones guardadas.</p>'; return; }
  cont.innerHTML = tmSesiones.map(s => {
    const activo = s.id === tmActualId;
    const titulo = s.productor || 'Sin nombre';
    const sub = [s.ubicacion, tmLabel(TM_TIPO_AVES, s.tipoAves), s.fechaSesion].filter(Boolean).join(' · ');
    return `<div class="tm-item ${activo ? 'activo' : ''}" onclick="tmAbrir('${s.id}')">
      <div class="tm-item-txt">
        <div class="tm-item-tit">${titulo}</div>
        <div class="tm-item-sub">${sub || 'sin datos'}</div>
      </div>
      <button class="tm-item-del" onclick="event.stopPropagation();tmEliminar('${s.id}')" title="Eliminar">🗑</button>
    </div>`;
  }).join('');
}

window.tmAbrir = function (id) {
  const s = tmSesiones.find(x => x.id === id);
  if (!s) return;
  tmActualId = id;
  tmPersistir();
  tmPintarFormularioDe(s);
  tmRenderLista();
  document.getElementById('tm-error').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.tmEliminar = function (id) {
  if (!confirm('¿Eliminar esta sesión? No se puede deshacer.')) return;
  tmSesiones = tmSesiones.filter(x => x.id !== id);
  if (tmActualId === id) tmActualId = tmSesiones[0] ? tmSesiones[0].id : null;
  if (!tmActualId) tmNuevaSesion();
  tmPersistir();
  const s = tmSesionActual();
  if (s) tmPintarFormularioDe(s);
  tmRenderLista();
};

window.tmNueva = function () {
  const s = tmNuevaSesion();
  tmPintarFormularioDe(s);
  tmRenderLista();
  document.getElementById('tm-error').style.display = 'none';
  document.getElementById('tm-productor').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Exportar / importar (respaldo JSON) ──────────────────────────────────
window.tmExportar = function () {
  const blob = new Blob([JSON.stringify(tmSesiones, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'telemedicina_avivet_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

window.tmImportar = function (input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const datos = JSON.parse(reader.result);
      if (!Array.isArray(datos)) throw new Error('Formato inválido');
      const ids = new Set(tmSesiones.map(s => s.id));
      datos.forEach(s => { if (!ids.has(s.id)) tmSesiones.push(s); });
      tmSesiones.sort((a, b) => (b.modificado || 0) - (a.modificado || 0));
      tmPersistir();
      tmRenderLista();
      alert('Sesiones importadas: ' + datos.length + '.');
    } catch (e) { alert('No se pudo importar: ' + e.message); }
    input.value = '';
  };
  reader.readAsText(file);
};

// ── Logo AviVet (compartido con informe-visita) ──────────────────────────
let tmLogoCache = null;
async function tmCargarLogo() {
  if (tmLogoCache !== null) return tmLogoCache || null;
  try {
    const r = await fetch('../informe-visita/assets/avivet_logo.png');
    tmLogoCache = r.ok ? new Uint8Array(await r.arrayBuffer()) : false;
  } catch { tmLogoCache = false; }
  return tmLogoCache || null;
}

// ── Construcción del .docx ────────────────────────────────────────────
function tmConstruirDoc(s, D, logo) {
  const VERDE = '1B4332', AMBAR = 'F0A500', GRIS = '6B6B6B', TINTA = '1A1A1A',
        BLANCO = 'FFFFFF', ZEBRA = 'F6F3ED', LABEL = 'F0EEE7', LINEA = 'D9D4C8';
  const FUENTE = 'Calibri';
  const SB = D.BorderStyle.SINGLE, SH = D.ShadingType.CLEAR, NONE = D.BorderStyle.NONE;
  const AL = D.AlignmentType, VA = D.VerticalAlign;
  const CONTENIDO = 10240;

  const run = (text, o = {}) => new D.TextRun({
    text: String(text), size: o.size || 20, bold: o.bold, italics: o.italics,
    color: o.color || TINTA, font: FUENTE,
  });
  const p = (text, o = {}) => new D.Paragraph({
    children: Array.isArray(text) ? text : [run(text, o)],
    spacing: { after: o.after != null ? o.after : 120, before: o.before || 0, line: o.line },
    alignment: o.align, indent: o.indent, border: o.border,
  });
  const h2 = (num, text) => new D.Paragraph({
    heading: D.HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    children: [new D.TextRun({ text: num + '. ' + text })],
  });
  const bordes = () => {
    const b = { style: SB, size: 2, color: LINEA };
    return { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b };
  };
  const celda = (text, { head, bold, fill, w } = {}) => new D.TableCell({
    children: [new D.Paragraph({
      children: [run(text, { bold: head || bold, color: head ? BLANCO : TINTA, size: head ? 17 : 19 })],
      spacing: { after: 0 },
    })],
    shading: { type: SH, color: 'auto', fill: head ? VERDE : (fill || BLANCO) },
    width: w ? { size: w, type: D.WidthType.PERCENTAGE } : undefined,
    margins: { top: 55, bottom: 55, left: 110, right: 110 },
    verticalAlign: VA.CENTER,
  });
  const tablaDatos = pares => new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    borders: bordes(),
    rows: pares.map(([k, v]) => new D.TableRow({
      children: [celda(k, { bold: true, w: 36, fill: LABEL }), celda(v, { w: 64 })],
    })),
  });
  // texto libre: una línea por salto de línea real (docx no traduce '\n' dentro
  // de un run a un quiebre visible — hay que partirlo en párrafos nosotros).
  const caja = txt => {
    const lineas = String(txt).split('\n').map(l => l.trim()).filter(Boolean);
    return lineas.length
      ? lineas.map((l, i) => p(l, { line: 288, after: i === lineas.length - 1 ? 140 : 60 }))
      : [p(String(txt), { line: 288, after: 140 })];
  };
  const lineasVacias = n => Array.from({ length: n }, () =>
    p('', { border: { bottom: { color: LINEA, size: 4, style: SB, space: 8 } }, after: 260 }));
  const bullets = items => items.length
    ? items.map(t => p('•  ' + t, { after: 60 }))
    : [p('—', { after: 140, color: GRIS })];

  const fecha = new Date((s.fechaSesion || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  const hijos = [];

  // ── membrete ──
  const brandCell = logo
    ? new D.TableCell({
        children: [new D.Paragraph({ spacing: { after: 0 }, children: [new D.ImageRun({ data: logo, transformation: { width: 250, height: 100 } })] })],
        verticalAlign: VA.CENTER, width: { size: 50, type: D.WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 120, left: 60, right: 60 },
      })
    : new D.TableCell({
        children: [
          new D.Paragraph({ spacing: { after: 0 }, children: [run('AviVet', { bold: true, color: VERDE, size: 40 })] }),
          new D.Paragraph({ spacing: { before: 20 }, children: [new D.TextRun({ text: 'A S E S O R Í A   V E T E R I N A R I A', color: AMBAR, size: 14, font: FUENTE })] }),
        ],
        verticalAlign: VA.CENTER, width: { size: 50, type: D.WidthType.PERCENTAGE },
        margins: { top: 120, bottom: 120, left: 120, right: 60 },
      });
  const docInfoCell = new D.TableCell({
    children: [
      new D.Paragraph({ alignment: AL.RIGHT, spacing: { after: 0 }, children: [run('INFORME DE TELEMEDICINA', { bold: true, color: VERDE, size: 20 })] }),
      new D.Paragraph({ alignment: AL.RIGHT, spacing: { before: 50 }, children: [run(s.productor || 'Productor', { color: TINTA, size: 18 })] }),
      new D.Paragraph({ alignment: AL.RIGHT, spacing: { before: 4 }, children: [run(tmFecha(fecha) + (s.ubicacion ? '  ·  ' + s.ubicacion : ''), { color: GRIS, size: 16 })] }),
    ],
    verticalAlign: VA.CENTER, width: { size: 50, type: D.WidthType.PERCENTAGE },
    margins: { top: 120, bottom: 120, left: 60, right: 120 },
  });
  hijos.push(new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    borders: { top: { style: NONE }, left: { style: NONE }, right: { style: NONE }, insideHorizontal: { style: NONE }, insideVertical: { style: NONE }, bottom: { color: AMBAR, size: 28, style: SB } },
    rows: [new D.TableRow({ children: [brandCell, docInfoCell] })],
  }));
  hijos.push(p('Resumen de una sesión de asesoría a distancia — no reemplaza un examen clínico presencial.', { italics: true, size: 16, color: GRIS, before: 100, after: 200 }));

  let nSec = 0;
  const H = titulo => h2(String(++nSec), titulo);

  // ── datos de la sesión ──
  hijos.push(H('Datos de la sesión'));
  const datos = [
    ['Productor / predio', s.productor || '—'],
    ['Ubicación', s.ubicacion || '—'],
    ['Tipo de aves', tmLabel(TM_TIPO_AVES, s.tipoAves)],
  ];
  if (s.aves) datos.push(['N° de aves aprox.', tmFmt(s.aves)]);
  datos.push(['Fecha de la sesión', tmFecha(fecha)]);
  datos.push(['Modalidad', tmLabel(TM_MODALIDAD, s.modalidad)]);
  hijos.push(tablaDatos(datos));

  // ── temas tratados ──
  hijos.push(H('Temas tratados en la sesión'));
  const temasMarcados = TM_TEMAS.filter(t => s.temas && s.temas[t.id]).map(t => t.label);
  hijos.push(...bullets(temasMarcados));

  // ── bloques de indicaciones ──
  TM_BLOQUES.forEach(b => {
    hijos.push(H(b.label));
    if (s[b.id]) hijos.push(...caja(s[b.id]));
    else hijos.push(...lineasVacias(2));
  });

  // ── observaciones y seguimiento ──
  hijos.push(H('Observaciones generales'));
  if (s.observaciones) hijos.push(...caja(s.observaciones));
  else hijos.push(...lineasVacias(3));

  hijos.push(H('Próximos pasos y seguimiento'));
  if (s.seguimiento) hijos.push(...caja(s.seguimiento));
  else hijos.push(...lineasVacias(3));

  // ── firma ──
  hijos.push(new D.Paragraph({ children: [], spacing: { before: 700 } }));
  hijos.push(p('', { border: { bottom: { color: TINTA, size: 6, style: SB, space: 4 } }, align: AL.CENTER, after: 40, indent: { left: 3200, right: 3200 } }));
  hijos.push(p('MV Andrés Lazo Escobar', { align: AL.CENTER, bold: true, after: 20 }));
  hijos.push(p('Médico Veterinario · Asesoría Veterinaria', { align: AL.CENTER, size: 18 }));

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

function tmNombreArchivo(s) {
  const prod = (s.productor || 'productor').trim().replace(/[^\wáéíóúñÁÉÍÓÚÑ-]+/g, '_');
  return `Informe_Telemedicina_${prod}_${s.fechaSesion || new Date().toISOString().slice(0, 10)}.docx`;
}

// ── Generar informe Word ────────────────────────────────────────────────
window.tmGenerarWord = async function () {
  const err = document.getElementById('tm-error');
  err.style.display = 'none';
  const s = tmSesionActual();
  if (!s) return;
  tmLeerFormularioA(s);
  tmPersistir();

  if (!s.productor) { err.textContent = 'Ingresa al menos el nombre del productor.'; err.style.display = 'block'; return; }

  const logo = await tmCargarLogo();
  const doc = tmConstruirDoc(s, docx, logo);
  const blob = await docx.Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = tmNombreArchivo(s);
  a.click();
  URL.revokeObjectURL(a.href);
};

// ── INIT ────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('tm-form')) return;

    document.getElementById('tm-tipo-aves').innerHTML =
      TM_TIPO_AVES.map(([k, l]) => `<option value="${k}">${l}</option>`).join('');
    document.getElementById('tm-modalidad').innerHTML =
      TM_MODALIDAD.map(([k, l]) => `<option value="${k}">${l}</option>`).join('');

    document.getElementById('tm-temas').innerHTML = TM_TEMAS.map(t => `
      <div class="campo campo-check">
        <input type="checkbox" id="tm-tema-${t.id}">
        <label for="tm-tema-${t.id}">${t.label}</label>
      </div>`).join('');

    const sinVoz = !TM_SR;
    const contBloques = document.getElementById('tm-bloques');
    contBloques.innerHTML = '';
    TM_BLOQUES.forEach(b => contBloques.appendChild(tmCrearBloqueEl(b, sinVoz)));
    if (sinVoz) {
      const aviso = document.getElementById('tm-voz-aviso');
      if (aviso) aviso.style.display = 'block';
    }

    tmCargar();
    if (!tmSesionActual()) {
      if (tmSesiones.length) tmActualId = tmSesiones[0].id;
      else tmNuevaSesion();
    }
    tmPintarFormularioDe(tmSesionActual());
    tmRenderLista();

    document.getElementById('tm-form').addEventListener('input', tmAutoguardar);
    document.getElementById('tm-form').addEventListener('change', tmAutoguardar);

    document.getElementById('tm-fecha-hoy').textContent = new Date().toLocaleDateString('es-CL');
  });
}

// ── EXPORT NODE (tests) ─────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    tmConstruirDoc, tmNombreArchivo, TM_TEMAS, TM_BLOQUES, TM_TIPO_AVES, TM_MODALIDAD,
    TM_VACUNAS, TM_CALENDARIO_REF, TM_CATALOGO_MED, TM_ANTIPARASITARIOS_EXTRA, TM_OTROS_EXTRA,
  };
}
