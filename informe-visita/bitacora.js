/* ============================================================
   Bitácora de Terreno · avivet.cl
   Captura por voz/teclado en el celular, guardado local, y
   generación del informe Word reutilizando el motor de app.js
   (ivCalcular / ivConstruirDoc / ivNombreArchivo).
   ============================================================ */

// ── Bloques de observación por tema ─────────────────────────────────────
const BT_BLOQUES = [
  { id: 'sanitario',   label: 'Estado sanitario',   hint: 'Aspecto general, signos clínicos, necropsias, hallazgos…' },
  { id: 'cama',        label: 'Cama y ambiente',     hint: 'Humedad de cama, ventilación, temperatura, olor a amoníaco…' },
  { id: 'agua',        label: 'Agua y alimento',     hint: 'Bebederos, consumo, calidad de agua, comederos, tipo de alimento…' },
  { id: 'equipamiento',label: 'Equipamiento',        hint: 'Nidos, perchas, comederos, estado y cantidad…' },
  { id: 'mortalidad',  label: 'Mortalidad',          hint: 'Nº de bajas, tendencia, distribución…' },
  { id: 'bioseguridad',label: 'Bioseguridad',        hint: 'Cerco sanitario, pediluvios, control de plagas, visitas…' },
];

const BT_KEY_VISITAS = 'avivet_bitacora_visitas';
const BT_KEY_ACTUAL  = 'avivet_bitacora_actual';

let btVisitas = [];      // [{...datos, bloques:{}, reco, muertesDia, creado, modificado}]
let btActualId = null;   // id de la visita en edición
let btGuardarTimer = null;

// ── PERSISTENCIA ────────────────────────────────────────────────────────
function btCargar() {
  try { btVisitas = JSON.parse(localStorage.getItem(BT_KEY_VISITAS)) || []; }
  catch { btVisitas = []; }
  btActualId = localStorage.getItem(BT_KEY_ACTUAL) || null;
}
function btPersistir() {
  localStorage.setItem(BT_KEY_VISITAS, JSON.stringify(btVisitas));
  if (btActualId) localStorage.setItem(BT_KEY_ACTUAL, btActualId);
  else localStorage.removeItem(BT_KEY_ACTUAL);
}
function btVisitaActual() {
  return btVisitas.find(v => v.id === btActualId) || null;
}

// ── MODELO ──────────────────────────────────────────────────────────────
function btNuevaVisita() {
  const v = {
    id: 'v' + Date.now(),
    tipoVisita: 'primera',
    productor: '', ubicacion: '', fechaVisita: new Date().toISOString().slice(0, 10),
    linea: Object.keys(LINEAS)[0], nacimiento: '', aves: '',
    largo: '', ancho: '', superficie: '', sistema: 'piso', exterior: false,
    bloques: {}, muertesDia: '', reco: '',
    creado: Date.now(), modificado: Date.now(),
  };
  btVisitas.unshift(v);
  btActualId = v.id;
  btPersistir();
  return v;
}

function btLeerFormularioA(v) {
  const g = id => document.getElementById(id);
  v.tipoVisita = g('bt-tipo').value;
  v.productor  = g('bt-productor').value.trim();
  v.ubicacion  = g('bt-ubicacion').value.trim();
  v.fechaVisita= g('bt-fecha-visita').value;
  v.linea      = g('bt-linea').value;
  v.nacimiento = g('bt-nacimiento').value;
  v.aves       = g('bt-aves').value;
  v.largo      = g('bt-largo').value;
  v.ancho      = g('bt-ancho').value;
  v.superficie = g('bt-superficie').value;
  v.sistema    = g('bt-sistema').value;
  v.exterior   = g('bt-exterior').checked;
  v.muertesDia = g('bt-muertes').value;
  v.reco       = g('bt-reco').value.trim();
  v.bloques    = {};
  BT_BLOQUES.forEach(b => { v.bloques[b.id] = g('bt-blk-' + b.id).value.trim(); });
  v.modificado = Date.now();
}

function btPintarFormularioDe(v) {
  const g = id => document.getElementById(id);
  g('bt-tipo').value        = v.tipoVisita || 'primera';
  g('bt-productor').value   = v.productor || '';
  g('bt-ubicacion').value   = v.ubicacion || '';
  g('bt-fecha-visita').value= v.fechaVisita || '';
  g('bt-linea').value       = v.linea || Object.keys(LINEAS)[0];
  g('bt-nacimiento').value  = v.nacimiento || '';
  g('bt-aves').value        = v.aves || '';
  g('bt-largo').value       = v.largo || '';
  g('bt-ancho').value       = v.ancho || '';
  g('bt-superficie').value  = v.superficie || '';
  g('bt-sistema').value     = v.sistema || 'piso';
  g('bt-exterior').checked  = !!v.exterior;
  g('bt-muertes').value     = v.muertesDia || '';
  g('bt-reco').value        = v.reco || '';
  BT_BLOQUES.forEach(b => { g('bt-blk-' + b.id).value = (v.bloques && v.bloques[b.id]) || ''; });
}

// ── AUTOSAVE ────────────────────────────────────────────────────────────
function btAutoguardar() {
  clearTimeout(btGuardarTimer);
  btGuardarTimer = setTimeout(() => {
    const v = btVisitaActual();
    if (!v) return;
    btLeerFormularioA(v);
    // reordenar: la más reciente arriba
    btVisitas = [v, ...btVisitas.filter(x => x.id !== v.id)];
    btPersistir();
    btRenderLista();
    btMarcarGuardado();
  }, 500);
}

function btMarcarGuardado() {
  const el = document.getElementById('bt-estado');
  if (!el) return;
  el.textContent = '✔ Guardado en este teléfono · ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  el.classList.add('visible');
}

// ── ENSAMBLADO bitácora → informe (función pura, testeable) ──────────────
function btArmarInput(v) {
  const partes = [];
  BT_BLOQUES.forEach(b => {
    const txt = (v.bloques && v.bloques[b.id] || '').trim();
    if (txt) partes.push(`${b.label}: ${txt}`);
  });
  if (v.muertesDia !== '' && v.muertesDia != null) {
    partes.push(`Mortalidad registrada: ${v.muertesDia} aves/día.`);
  }
  const obs = partes.join(' ');
  return {
    tipoVisita: v.tipoVisita || 'primera',
    productor: v.productor, ubicacion: v.ubicacion, fechaVisita: v.fechaVisita,
    linea: v.linea, nacimiento: v.nacimiento,
    aves: parseInt(v.aves) || 0,
    largo: parseFloat(v.largo) || 0, ancho: parseFloat(v.ancho) || 0,
    superficie: parseFloat(v.superficie) || 0,
    sistema: v.sistema, exterior: !!v.exterior,
    obs, reco: (v.reco || '').trim(),
  };
}

// ── UI: lista de visitas guardadas ──────────────────────────────────────
function btRenderLista() {
  const cont = document.getElementById('bt-lista');
  if (!cont) return;
  if (!btVisitas.length) { cont.innerHTML = '<p class="bt-vacio">Aún no hay visitas guardadas.</p>'; return; }
  cont.innerHTML = btVisitas.map(v => {
    const activo = v.id === btActualId;
    const titulo = v.productor || 'Sin nombre';
    const sub = [v.ubicacion, v.linea, v.fechaVisita].filter(Boolean).join(' · ');
    return `<div class="bt-item ${activo ? 'activo' : ''}" onclick="btAbrir('${v.id}')">
      <div class="bt-item-txt">
        <div class="bt-item-tit">${titulo}</div>
        <div class="bt-item-sub">${sub || 'sin datos'}</div>
      </div>
      <button class="bt-item-del" onclick="event.stopPropagation();btEliminar('${v.id}')" title="Eliminar">🗑</button>
    </div>`;
  }).join('');
}

window.btAbrir = function (id) {
  const v = btVisitas.find(x => x.id === id);
  if (!v) return;
  btActualId = id;
  btPersistir();
  btPintarFormularioDe(v);
  btRenderLista();
  document.getElementById('bt-error').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.btEliminar = function (id) {
  if (!confirm('¿Eliminar esta visita de la bitácora? No se puede deshacer.')) return;
  btVisitas = btVisitas.filter(x => x.id !== id);
  if (btActualId === id) btActualId = btVisitas[0] ? btVisitas[0].id : null;
  if (!btActualId) btNuevaVisita();
  btPersistir();
  const v = btVisitaActual();
  if (v) btPintarFormularioDe(v);
  btRenderLista();
};

window.btNueva = function () {
  const v = btNuevaVisita();
  btPintarFormularioDe(v);
  btRenderLista();
  document.getElementById('bt-error').style.display = 'none';
  document.getElementById('bt-productor').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Dictado por voz (Web Speech API, si el navegador lo soporta) ─────────
const BT_SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let btRecActivo = null; // { rec, textareaId }

function btToggleDictado(textareaId, boton) {
  if (!BT_SR) return;
  // si ya hay uno activo sobre este mismo campo → detener
  if (btRecActivo && btRecActivo.textareaId === textareaId) { btRecActivo.rec.stop(); return; }
  if (btRecActivo) btRecActivo.rec.stop();

  const ta = document.getElementById(textareaId);
  const rec = new BT_SR();
  rec.lang = 'es-CL';
  rec.continuous = true;
  rec.interimResults = false;
  const base = ta.value;
  rec.onresult = e => {
    let add = '';
    for (let i = e.resultIndex; i < e.results.length; i++) add += e.results[i][0].transcript;
    ta.value = (base ? base + ' ' : '') + add.trim();
    btAutoguardar();
  };
  rec.onend = () => { boton.classList.remove('grabando'); btRecActivo = null; };
  rec.onerror = () => { boton.classList.remove('grabando'); btRecActivo = null; };
  rec.start();
  boton.classList.add('grabando');
  btRecActivo = { rec, textareaId };
}

// ── Generar informe Word ────────────────────────────────────────────────
window.btGenerarWord = async function () {
  const err = document.getElementById('bt-error');
  err.style.display = 'none';
  const v = btVisitaActual();
  if (!v) return;
  btLeerFormularioA(v);
  btPersistir();

  const inf = ivCalcular(btArmarInput(v));
  if (inf.error) { err.textContent = inf.error; err.style.display = 'block'; return; }

  const logo = await ivCargarLogo();
  const doc = ivConstruirDoc(inf, docx, logo);
  const blob = await docx.Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = ivNombreArchivo(inf);
  a.click();
  URL.revokeObjectURL(a.href);
};

// ── Exportar / importar bitácora (respaldo JSON) ─────────────────────────
window.btExportar = function () {
  const blob = new Blob([JSON.stringify(btVisitas, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bitacora_avivet_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

window.btImportar = function (input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const datos = JSON.parse(reader.result);
      if (!Array.isArray(datos)) throw new Error('Formato inválido');
      const ids = new Set(btVisitas.map(v => v.id));
      datos.forEach(v => { if (!ids.has(v.id)) btVisitas.push(v); });
      btVisitas.sort((a, b) => (b.modificado || 0) - (a.modificado || 0));
      btPersistir();
      btRenderLista();
      alert('Bitácora importada: ' + datos.length + ' visita(s).');
    } catch (e) { alert('No se pudo importar: ' + e.message); }
    input.value = '';
  };
  reader.readAsText(file);
};

// ── INIT ────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('bt-form')) return;

    // selector de línea
    document.getElementById('bt-linea').innerHTML =
      Object.keys(LINEAS).map(k => `<option value="${k}">${k}</option>`).join('');

    // bloques de observación
    const sinVoz = !BT_SR;
    document.getElementById('bt-bloques').innerHTML = BT_BLOQUES.map(b => `
      <div class="campo campo-full">
        <div class="bt-blk-head">
          <label for="bt-blk-${b.id}">${b.label}</label>
          ${sinVoz ? '' : `<button type="button" class="bt-mic" onclick="btToggleDictado('bt-blk-${b.id}',this)" title="Dictar por voz">🎤 Dictar</button>`}
        </div>
        <textarea id="bt-blk-${b.id}" placeholder="${b.hint}"></textarea>
      </div>`).join('');
    if (sinVoz) {
      const aviso = document.getElementById('bt-voz-aviso');
      if (aviso) aviso.style.display = 'block';
    }

    btCargar();
    if (!btVisitaActual()) {
      if (btVisitas.length) btActualId = btVisitas[0].id;
      else btNuevaVisita();
    }
    btPintarFormularioDe(btVisitaActual());
    btRenderLista();

    // autosave en cualquier cambio del formulario
    document.getElementById('bt-form').addEventListener('input', btAutoguardar);
    document.getElementById('bt-form').addEventListener('change', btAutoguardar);

    // superficie automática desde largo × ancho
    ['bt-largo', 'bt-ancho'].forEach(id => document.getElementById(id).addEventListener('input', () => {
      const l = parseFloat(document.getElementById('bt-largo').value);
      const a = parseFloat(document.getElementById('bt-ancho').value);
      if (l > 0 && a > 0) document.getElementById('bt-superficie').value = (l * a).toFixed(1);
    }));

    document.getElementById('bt-fecha-hoy').textContent = new Date().toLocaleDateString('es-CL');
  });
}

// ── EXPORT NODE (tests) ─────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { btArmarInput, BT_BLOQUES };
}
