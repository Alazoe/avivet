// ══ REGISTRO DE NECROPSIAS — AviVet (uso interno) ══════════════════
// 100 % local: los datos y las fotos viven en IndexedDB del dispositivo y
// nunca se envían a ningún servidor. Para pasar datos entre celular y
// notebook (o respaldar) se exporta/importa un .zip que el usuario guarda
// en su Google Drive / OneDrive — ver pestaña Respaldo.
var BORRADOR_KEY = 'avivet_necropsia_borrador';
var RESPALDO_KEY = 'avivet_necropsias_ultimo_respaldo';

// ── IndexedDB ────────────────────────────────────────────────────
// necropsias {id,…} · referencias {id,path,…} · fotos {path, blob}
var dbPromesa = null;
function idb(){
  if (!dbPromesa) dbPromesa = new Promise(function(res, rej){
    var r = indexedDB.open('avivet_necropsias', 1);
    r.onupgradeneeded = function(){
      var d = r.result;
      d.createObjectStore('necropsias', { keyPath:'id' });
      d.createObjectStore('referencias', { keyPath:'id' });
      d.createObjectStore('fotos', { keyPath:'path' });
    };
    r.onsuccess = function(){ res(r.result); };
    r.onerror = function(){ rej(r.error); };
  });
  return dbPromesa;
}
function dbOp(store, modo, fn){
  return idb().then(function(d){ return new Promise(function(res, rej){
    var t = d.transaction(store, modo), req = fn(t.objectStore(store));
    t.oncomplete = function(){ res(req ? req.result : undefined); };
    t.onerror = function(){ rej(t.error); };
    t.onabort = function(){ rej(t.error || new Error('Operación cancelada (¿sin espacio?)')); };
  }); });
}
function dbTodos(store){ return dbOp(store, 'readonly', function(s){ return s.getAll(); }); }
function dbUno(store, k){ return dbOp(store, 'readonly', function(s){ return s.get(k); }); }
function dbPut(store, v){ return dbOp(store, 'readwrite', function(s){ return s.put(v); }); }
function dbBorrar(store, k){ return dbOp(store, 'readwrite', function(s){ return s.delete(k); }); }

// ── Sistemas y hallazgos ─────────────────────────────────────────
var SISTEMAS = [
  { k:'externo', ico:'🐔', t:'Examen externo', organos:[
    ['Condición corporal', ['Emaciada','Delgada','Sobrepeso','Almohadilla grasa gruesa','Deshidratación']],
    ['Plumaje y piel', ['Plumaje erizado','Picaje / canibalismo','Heridas','Piojos','Ácaro rojo','Costras / viruela cutánea']],
    ['Cresta y barbillas', ['Pálida','Cianótica','Costras','Edema']],
    ['Cabeza, ojos y narinas', ['Secreción nasal','Secreción ocular','Cabeza inflamada','Sinusitis infraorbitaria','Conjuntivitis']],
    ['Patas y cloaca', ['Pododermatitis','Hiperqueratosis / sarna','Cloaca empastada','Prolapso','Picaje cloacal']]
  ]},
  { k:'respiratorio', ico:'🫁', t:'Aparato respiratorio', organos:[
    ['Senos y cavidad nasal', ['Moco','Exudado caseoso','Congestión']],
    ['Laringe y tráquea', ['Tráquea roja / hemorrágica','Moco excesivo','Tapón caseoso / fibrina','Placas diftéricas','Coágulos de sangre']],
    ['Sacos aéreos', ['Opacos / engrosados','Espuma','Exudado caseoso','Aerosaculitis fibrinosa']],
    ['Pulmones', ['Congestión','Neumonía unilateral','Consolidación','Nódulos / granulomas','Hongos (aspergilosis)']]
  ]},
  { k:'digestivo', ico:'🌀', t:'Aparato digestivo', organos:[
    ['Boca, esófago y buche', ['Placas diftéricas','Buche vacío','Buche impactado','Micosis (candidiasis)','Contenido fétido']],
    ['Proventrículo', ['Petequias en papilas','Pared engrosada','Aumentado de tamaño','Úlceras']],
    ['Molleja', ['Erosión de koilina','Koilina teñida','Cuerpos extraños','Vacía']],
    ['Intestino delgado', ['Enteritis catarral','Balonamiento','Hemorragias puntiformes','Pared engrosada','Contenido sanguinolento','Necrosis / membrana diftérica','Ascárides','Tenias']],
    ['Ciegos y recto', ['Tiflitis hemorrágica','Núcleos caseosos','Tapones mucosos','Heterakis']],
    ['Páncreas', ['Pálido','Necrosis focal']]
  ]},
  { k:'higado', ico:'🟤', t:'Hígado y vesícula', score:true, organos:[
    ['Hígado', ['Aumentado de tamaño','Friable','Bordes redondeados','Hemorragia / coágulo','Ruptura','Focos necróticos blancos','Moteado','Nódulos / tumores','Perihepatitis fibrinosa']],
    ['Vesícula biliar', ['Distendida','Vacía','Bilis anormal']]
  ]},
  { k:'linfoide', ico:'❤️', t:'Corazón y órganos linfoides', organos:[
    ['Corazón', ['Pericarditis fibrinosa','Hidropericardio','Petequias en grasa coronaria','Nódulos','Cardiomegalia']],
    ['Bazo', ['Esplenomegalia','Moteado','Atrofia','Nódulos / tumores']],
    ['Bolsa de Fabricio y timo', ['Bolsa aumentada / edematosa','Bolsa hemorrágica','Bolsa atrófica','Timo atrófico','Timo hemorrágico']],
    ['Tonsilas cecales', ['Hemorrágicas','Aumentadas']]
  ]},
  { k:'reproductor', ico:'🥚', t:'Aparato reproductor', organos:[
    ['Ovario', ['Inactivo / en regresión','Folículos hemorrágicos','Folículos deformes / flácidos','Tumor ovárico']],
    ['Oviducto', ['Salpingitis','Huevo retenido','Masa caseosa (lamelado)','Quístico','Oviducto inmaduro']],
    ['Cavidad celómica', ['Peritonitis por yema','Ascitis','Adherencias']]
  ]},
  { k:'renal', ico:'🫘', t:'Aparato urinario', organos:[
    ['Riñones', ['Aumentados / pálidos','Uratos en túbulos','Gota visceral','Urolitos en uréteres','Hemorragias']]
  ]},
  { k:'locomotor', ico:'🦴', t:'Músculo, huesos y nervios', organos:[
    ['Esqueleto', ['Quilla desviada','Fracturas de quilla','Huesos frágiles (osteoporosis)','Rosario raquítico']],
    ['Articulaciones y tendones', ['Artritis','Sinovitis / tenosinovitis','Ruptura de tendón']],
    ['Músculo', ['Pálido','Hemorragias','Necrosis / miopatía']],
    ['Nervios periféricos', ['Nervio ciático engrosado','Plexo braquial engrosado','Asimetría']]
  ]}
];
var SIS_POR_K = {}; SISTEMAS.forEach(function(s){ SIS_POR_K[s.k] = s; });
SIS_POR_K.general = { k:'general', ico:'📷', t:'General' };

// Score de color hepático (Royal GD). Colores muestreados de la lámina original.
var SCORE_HIGADO = [
  { c:'#5c220a', g:'normal' }, { c:'#723220', g:'normal' },
  { c:'#7c5018', g:'riesgo' }, { c:'#8d5336', g:'riesgo' }, { c:'#6b3c16', g:'riesgo' },
  { c:'#c48934', g:'flhs' },   { c:'#9f7027', g:'flhs' }
];
var SCORE_TXT = {
  normal: 'Hígado normal: sin acumulación excesiva de grasa. No se justifica tratamiento preventivo de hígado graso.',
  riesgo: 'Grupo de riesgo: pedir triglicéridos (TG) para saber si el lote está en una pre-etapa de FLHS y si vale la pena tratar. No todo cambio de color es hígado graso.',
  flhs:   'Deterioro por acumulación de grasa (FLHS): tratar el lote y revisar energía de la dieta, consumo, temperatura y micotoxinas.'
};
var SCORE_ETQ = { normal:'Normal', riesgo:'Riesgo', flhs:'FLHS' };

// Score de hemorragias hepáticas (Shini et al. / Diaz et al. 1999, escala 0–5;
// ≥3 es muy indicativo de FLHS). Se agrupa 3–5 porque en terreno se distinguen igual.
var HEMO = [
  { v:0, t:'0', d:'Sin hemorragias' },
  { v:1, t:'1', d:'1–10 petequias o equimosis subcapsulares' },
  { v:2, t:'2', d:'Más de 10 petequias o equimosis' },
  { v:3, t:'≥3', d:'Hematomas grandes, hemorragia masiva o cápsula rota con coágulo en cavidad' }
];
var HEMO_TXT = ['Sin hemorragias hepáticas.', '1–10 hemorragias subcapsulares: lesión leve, vigilar el lote.',
  'Más de 10 hemorragias subcapsulares: FLHS en desarrollo si además el hígado es graso.',
  'Hematomas / ruptura de cápsula: cuadro típico de FLHS si el hígado es amarillo y friable con mucha grasa abdominal.'];

// Ficha de terreno: diferenciales del hígado amarillo o hemorrágico
var HIGADO_DIFERENCIALES = [
  ['Pollitos de pocos días', 'El hígado amarillo es normal mientras absorben el saco vitelino; no aplicar el score.'],
  ['Pigmentos de la dieta (xantofilas)', 'Hígado amarillento pero firme, bordes agudos y sin hemorragias.'],
  ['Grasas rancias / micotoxinas', 'Pueden dar hemorragias y daño hepático sin gran acumulación de grasa.'],
  ['Marek / leucosis', 'Hígado aumentado y moteado, con nódulos o focos blancos (ver bazo y nervios).'],
  ['Hepatitis bacteriana / manchas', 'Focos necróticos blancos o perihepatitis fibrinosa, no color difuso.'],
  ['Confirmar FLHS', 'Hígado ≥40 % de grasa en materia seca o triglicéridos altos; sumar peso corporal, grasa abdominal y cresta pálida.']
];

var MUESTRAS = ['Histopatología','Bacteriología','Antibiograma','PCR','Serología','Coproparasitario','Micotoxinas en alimento','Triglicéridos (TG)','Raspado / ectoparásitos'];
var TIPOS_AVE = ['Ponedora comercial','Polla de recría','Reproductora','Pollo broiler','Traspatio / criolla','Otra'];

// ── Catálogo de referencias iniciales ────────────────────────────
// Se emparejan por nombre de archivo al importar el paquete
// (~/AviVet_Necropsias/referencias/). Las imágenes NO van en el repo
// público: se suben al bucket privado desde la pestaña Referencias.
var FUENTE_LSC = 'Layer Signals Checkbook (Roodbont) · score hepático Royal GD';
var REF_CATALOGO = {
  'higado-sano-vs-graso':          ['higado','referencia','Hígado sano vs. hígado graso','Izquierda: hígado sano, rojo oscuro. Derecha: hígado graso, amarillo-anaranjado. Cuando la síntesis de grasa supera a su movilización se acumulan lípidos; si persiste se habla de FLHS.'],
  'org-higado-bordes-agudos':      ['higado','normal','Hígado con bordes agudos','El hígado normal tiene bordes afilados. En el síndrome de hígado graso los bordes se ven redondeados e hinchados.'],
  'org-bazo-vesicula':             ['higado','normal','Bazo y vesícula biliar','Al dar vuelta el hígado se ven el bazo (oval) y la vesícula biliar verde. El bazo es el segundo órgano linfoide más grande del ave.'],
  'org-vista-general':             ['linfoide','normal','Vista general de órganos','Primera mirada tras retirar esternón y pechuga: corazón al centro, rodeado del hígado; la vesícula biliar asoma.'],
  'org-corazon':                   ['linfoide','normal','Corazón aislado','Corazón fuera de la cavidad; se puede abrir para revisar las válvulas (aurícula, válvula, ventrículo, aorta, vena cava).'],
  'org-marek-bazo-higado':         ['linfoide','alterado','Marek: bazo e hígado moteados','Bazo (izq.) e hígado (der.) con aspecto moteado por enfermedad de Marek.'],
  'resp-cavidad-nasal':            ['respiratorio','normal','Cavidad nasal','Cortar el pico permite ver bien la cavidad nasal.'],
  'resp-cabeza-inflamada':         ['respiratorio','alterado','Cabeza inflamada','Ave con la cabeza hinchada; los senos estarán llenos de secreción nasal.'],
  'resp-traquea-sana':             ['respiratorio','normal','Tráquea sana','Tráquea de color rosado pálido.'],
  'resp-traquea-ilt':              ['respiratorio','alterado','Tráquea roja (probable LTI)','El color rojo de la tráquea indica infección; probablemente laringotraqueítis infecciosa.'],
  'resp-sacos-aereos':             ['respiratorio','normal','Sacos aéreos','Al retirar el esternón aún se ven restos de los sacos aéreos (membranas finas y transparentes).'],
  'resp-pulmones-in-situ':         ['respiratorio','normal','Pulmones in situ','Los pulmones van adosados a la pared dorsal del ave.'],
  'resp-bronquios-in-situ':        ['respiratorio','normal','Tráquea y bronquios tras retirar pulmones','Al sacar los pulmones quedan visibles los restos de tráquea y bronquios.'],
  'resp-pulmones-sanos':           ['respiratorio','normal','Pulmones sanos de ponedora',''],
  'resp-pulmon-ort':               ['respiratorio','alterado','Neumonía unilateral por ORT','Un pulmón infectado junto al sano de la misma ave: infección unilateral por Ornithobacterium rhinotracheale.'],
  'dig-tracto-completo':           ['digestivo','referencia','Tracto digestivo completo','Tracto extendido desde el proventrículo hasta la cloaca, con las zonas a revisar.'],
  'dig-mesenterio':                ['digestivo','normal','Intestino con mesenterio','Los intestinos vienen unidos por el mesenterio; retirarlo para revisarlos en toda su extensión.'],
  'dig-asa-duodenal':              ['digestivo','normal','Asa duodenal','Primera porción del intestino; el asa duodenal rodea al páncreas.'],
  'dig-intestino-grueso':          ['digestivo','normal','Porción gruesa del intestino',''],
  'dig-mucosa-intestino-delgado':  ['digestivo','normal','Mucosa del intestino delgado',''],
  'dig-proventriculo-molleja':     ['digestivo','normal','Proventrículo y molleja','Arriba el proventrículo (estómago glandular), abajo la molleja (estómago muscular). Al retirar el alimento se ve la koilina amarilla, que se puede sacar para revisar el tejido de abajo.'],
  'dig-proventriculo-sano':        ['digestivo','normal','Unión proventrículo–molleja sana','Superficie lisa y rosada.'],
  'dig-proventriculo-petequias':   ['digestivo','alterado','Petequias en proventrículo','Hemorragias puntiformes en el proventrículo: sugiere Newcastle, Marek o proventriculitis viral transmisible.'],
  'dig-eimeria-necatrix':          ['digestivo','alterado','Eimeria necatrix','Problema común en ponedoras: balonamiento del intestino.'],
  'dig-eimeria-brunetti':          ['digestivo','alterado','Eimeria brunetti','Pared intestinal engrosada y tapones mucosos.']
};

// ── Estado ───────────────────────────────────────────────────────
var necropsias = [];
var referencias = [];
var urlCache = {};            // path → objectURL
var actual = null;            // necropsia en edición
var actualPersistida = false;
var fotosSesion = [];         // paths subidos en esta edición y aún no guardados
var guardando = false;

// ── Utilidades ───────────────────────────────────────────────────
function $(s, r){ return (r||document).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function hoy(){ return new Date().toLocaleDateString('en-CA'); }
function fechaLarga(f){ if(!f) return ''; var p=f.split('-'); return new Date(+p[0], +p[1]-1, +p[2]).toLocaleDateString('es-CL',{day:'numeric',month:'short',year:'numeric'}); }
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return (c=='x'?r:(r&3|8)).toString(16);}); }
function toast(msg){ var t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2600); }

// Devuelve {path: objectURL} para mostrar fotos guardadas en IndexedDB.
async function firmar(paths){
  var faltan = paths.filter(function(p){ return p && !urlCache[p]; });
  for (var i = 0; i < faltan.length; i++){
    var f = await dbUno('fotos', faltan[i]);
    if (f && f.blob) urlCache[faltan[i]] = URL.createObjectURL(f.blob);
  }
  var out = {}; paths.forEach(function(p){ out[p] = urlCache[p] || ''; }); return out;
}
async function borrarFotos(paths){
  for (var i = 0; i < paths.length; i++){
    await dbBorrar('fotos', paths[i]);
    if (urlCache[paths[i]]){ URL.revokeObjectURL(urlCache[paths[i]]); delete urlCache[paths[i]]; }
  }
}

// Reduce la foto a 1600 px por lado (JPEG) antes de subirla.
async function comprimir(file){
  var bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation:'from-image' }); }
  catch(e){ bmp = await createImageBitmap(file); }
  var max = 1600, esc_ = Math.min(1, max / Math.max(bmp.width, bmp.height));
  var c = document.createElement('canvas'); c.width = Math.round(bmp.width*esc_); c.height = Math.round(bmp.height*esc_);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(function(res){ c.toBlob(res, 'image/jpeg', 0.82); });
}
async function subir(path, file, comprimirla){
  var blob = comprimirla === false ? file : await comprimir(file);
  await dbPut('fotos', { path: path, blob: blob });
  if (urlCache[path]){ URL.revokeObjectURL(urlCache[path]); delete urlCache[path]; }
  return path;
}

// ── Arranque ─────────────────────────────────────────────────────
async function iniciar(){
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();   // que el navegador no borre los datos
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
  await Promise.all([cargarNecropsias(), cargarReferencias()]);
  var h = location.hash.slice(1);
  if (h.indexOf('ver/') === 0) verNecropsia(h.slice(4)); else irA(['refs','form','respaldo'].indexOf(h) >= 0 ? h : 'historial');
}

// ── Navegación ───────────────────────────────────────────────────
function irA(vista){
  $$('.vista').forEach(function(v){ v.classList.add('oculto'); });
  $('#v-' + vista).classList.remove('oculto');
  $$('.tab').forEach(function(t){ t.classList.toggle('activa', t.dataset.vista === vista); });
  if (vista === 'historial') renderHistorial();
  if (vista === 'refs') renderReferencias();
  if (vista === 'respaldo') renderRespaldo();
  if (vista === 'form' && !actual) abrirFormulario(null);
  if (vista !== 'ver') history.replaceState(null, '', '#' + vista);
  window.scrollTo(0, 0);
}
$$('.tab').forEach(function(t){ t.addEventListener('click', function(){
  if (t.dataset.vista === 'form' && actual && actualPersistida){ actual = null; }
  irA(t.dataset.vista);
}); });

// ── Datos ────────────────────────────────────────────────────────
async function cargarNecropsias(){
  necropsias = (await dbTodos('necropsias')).sort(function(a, b){
    return (b.fecha||'').localeCompare(a.fecha||'') || (b.created_at||'').localeCompare(a.created_at||'');
  });
}
async function cargarReferencias(){
  referencias = (await dbTodos('referencias')).sort(function(a, b){ return (a.created_at||'').localeCompare(b.created_at||''); });
}

function sistemasAlterados(n){
  var h = n.hallazgos || {};
  return SISTEMAS.filter(function(s){ return h[s.k] && h[s.k].estado === 'alt'; });
}

// ══ HISTORIAL ════════════════════════════════════════════════════
var filtroHist = '';
async function renderHistorial(){
  var v = $('#v-historial');
  var años = {}; necropsias.forEach(function(n){ años[n.fecha.slice(0,4)] = 1; });
  v.innerHTML =
    '<h2 class="titulo">Historial de necropsias</h2>' +
    '<p class="sub">' + necropsias.length + ' registro' + (necropsias.length===1?'':'s') + ' · guardados solo en este dispositivo.</p>' + avisoRespaldo() +
    '<div class="hist-barra"><input type="text" id="hist-buscar" placeholder="Buscar productor, lote, diagnóstico, hallazgo…" value="' + esc(filtroHist) + '">' +
    '<button class="btn prim" id="hist-nueva">＋ Nueva</button></div><div id="hist-lista"></div>';
  $('#hist-buscar').addEventListener('input', function(e){ filtroHist = e.target.value; pintarLista(); });
  $('#hist-nueva').addEventListener('click', function(){ actual = null; irA('form'); });
  pintarLista();
}
async function pintarLista(){
  var q = filtroHist.toLowerCase().trim();
  var lista = necropsias.filter(function(n){ return !q || JSON.stringify(n).toLowerCase().indexOf(q) >= 0; });
  var cont = $('#hist-lista');
  if (!necropsias.length){ cont.innerHTML = '<div class="vacio">Aún no hay necropsias registradas.<br><br><button class="btn prim" onclick="actual=null;irA(\'form\')">Registrar la primera</button></div>'; return; }
  if (!lista.length){ cont.innerHTML = '<div class="vacio">Sin resultados para «' + esc(filtroHist) + '».</div>'; return; }
  cont.innerHTML = lista.map(function(n){
    var alt = sistemasAlterados(n), f = (n.fotos||[]);
    return '<div class="hist-item" data-id="' + n.id + '">' +
      '<div class="hist-thumb" data-path="' + esc(f[0] ? f[0].path : '') + '">' + (f[0] ? '' : '🔬') + '</div>' +
      '<div class="hist-body"><div class="hist-fecha">' + fechaLarga(n.fecha) + (n.edad_semanas ? ' · ' + n.edad_semanas + ' sem' : '') + '</div>' +
      '<div class="hist-prod">' + esc(n.productor) + (n.lote ? ' <span style="font-weight:400;color:var(--text2)">· ' + esc(n.lote) + '</span>' : '') + '</div>' +
      '<div class="hist-dx">' + esc(n.dx_presuntivo || 'Sin diagnóstico presuntivo') + '</div>' +
      '<div class="pills">' + (alt.length ? alt.map(function(s){ return '<span class="pill alt">' + s.t + '</span>'; }).join('') : '<span class="pill ok">Sin lesiones registradas</span>') +
      (f.length ? '<span class="pill">📷 ' + f.length + '</span>' : '') + '</div></div></div>';
  }).join('');
  $$('.hist-item', cont).forEach(function(el){ el.addEventListener('click', function(){ verNecropsia(el.dataset.id); }); });
  var paths = $$('.hist-thumb', cont).map(function(t){ return t.dataset.path; }).filter(Boolean);
  if (paths.length){ var u = await firmar(paths); $$('.hist-thumb', cont).forEach(function(t){ if (u[t.dataset.path]) t.style.backgroundImage = 'url("' + u[t.dataset.path] + '")'; }); }
}

// ══ FORMULARIO ═══════════════════════════════════════════════════
function nuevaNecropsia(){
  var h = {}; SISTEMAS.forEach(function(s){ h[s.k] = { estado:'ne', chips:[], notas:'' }; });
  return { id: uuid(), fecha: hoy(), productor:'', lote:'', tipo_ave:'Ponedora comercial', linea_genetica:'', edad_semanas:null, n_aves:1,
    historia:{ motivo:'', condicion:'muerta', mortalidad:'', signos:'', vacunacion:'', tratamientos:'' },
    hallazgos:h, fotos:[], dx_presuntivo:'', diferenciales:'', muestras:[], laboratorio:'', recomendaciones:'' };
}

function abrirFormulario(id){
  fotosSesion = [];
  if (id){
    actual = JSON.parse(JSON.stringify(necropsias.find(function(n){ return n.id === id; })));
    actualPersistida = true;
    SISTEMAS.forEach(function(s){ actual.hallazgos[s.k] = actual.hallazgos[s.k] || { estado:'ne', chips:[], notas:'' }; });
  } else {
    var b = null; try { b = JSON.parse(localStorage.getItem(BORRADOR_KEY)); } catch(e){}
    if (b && b.productor !== undefined && confirm('Hay un borrador sin guardar' + (b.productor ? ' (' + b.productor + ')' : '') + '. ¿Retomarlo?')){
      actual = b; actualPersistida = necropsias.some(function(n){ return n.id === b.id; });
    } else { actual = nuevaNecropsia(); actualPersistida = false; limpiarBorrador(); }
  }
  renderFormulario();
}

function opcion(v, sel){ return '<option' + (v === sel ? ' selected' : '') + '>' + esc(v) + '</option>'; }

function renderFormulario(){
  var n = actual, h = n.historia || {};
  var v = $('#v-form');
  v.innerHTML =
    '<h2 class="titulo">' + (actualPersistida ? 'Editar necropsia' : 'Nueva necropsia') + '</h2>' +
    '<p class="sub">Marca cada sistema como <b style="color:var(--ok)">sin alteraciones</b> o <b style="color:var(--red)">alterado</b>, elige los hallazgos y adjunta fotos. Se guarda un borrador en este equipo mientras escribes.</p>' +

    '<div class="tarjeta"><h3>Datos del caso</h3><div class="grid">' +
      '<label class="campo">Fecha<input type="date" data-f="fecha" value="' + esc(n.fecha) + '"></label>' +
      '<label class="campo">Productor / granja *<input type="text" data-f="productor" value="' + esc(n.productor) + '" list="dl-productores"></label>' +
      '<label class="campo">Galpón / lote<input type="text" data-f="lote" value="' + esc(n.lote) + '"></label>' +
      '<label class="campo">Tipo de ave<select data-f="tipo_ave">' + TIPOS_AVE.map(function(t){ return opcion(t, n.tipo_ave); }).join('') + '</select></label>' +
      '<label class="campo">Línea genética<input type="text" data-f="linea_genetica" value="' + esc(n.linea_genetica) + '" list="dl-lineas"></label>' +
      '<label class="campo">Edad (semanas)<input type="number" step="0.1" min="0" data-f="edad_semanas" value="' + esc(n.edad_semanas) + '"></label>' +
      '<label class="campo">N° aves necropsiadas<input type="number" min="1" data-f="n_aves" value="' + esc(n.n_aves) + '"></label>' +
      '<label class="campo">Condición<select data-h="condicion">' + [['muerta','Muertas en galpón'],['sacrificada','Sacrificadas (enfermas)'],['mixta','Mixto']].map(function(o){ return '<option value="' + o[0] + '"' + (h.condicion===o[0]?' selected':'') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
    '</div>' +
    '<datalist id="dl-productores">' + unicos('productor').map(function(p){ return '<option value="' + esc(p) + '">'; }).join('') + '</datalist>' +
    '<datalist id="dl-lineas">' + ['Hy-Line Brown','Hy-Line W-36','Lohmann Brown','Lohmann LSL','ISA Brown','Hisex Brown','Bovans Brown','Novogen Brown','Dekalb White','Ross 308','Cobb 500'].concat(unicos('linea_genetica')).filter(function(x,i,a){ return a.indexOf(x)===i; }).map(function(p){ return '<option value="' + esc(p) + '">'; }).join('') + '</datalist>' +
    '</div>' +

    '<div class="tarjeta"><h3>Historia clínica</h3><div class="grid dos">' +
      campoNotas('Motivo de consulta', 'h:motivo', h.motivo) +
      campoNotas('Mortalidad / morbilidad', 'h:mortalidad', h.mortalidad, 'Ej: 0,4 %/sem, 12 aves en 3 días') +
      campoNotas('Signos clínicos', 'h:signos', h.signos, 'Postura, consumo, cresta pálida, estornudos…') +
      campoNotas('Vacunaciones y tratamientos recientes', 'h:vacunacion', h.vacunacion) +
    '</div></div>' +

    '<div id="sistemas">' + SISTEMAS.map(htmlSistema).join('') + '</div>' +

    '<div class="tarjeta"><h3>Fotos generales</h3><div class="fotos" data-fotos="general"></div>' + btnFoto('general') + '</div>' +

    '<div class="tarjeta"><h3>Conclusión</h3><div class="grid dos">' +
      campoNotas('Diagnóstico presuntivo', 'dx_presuntivo', n.dx_presuntivo) +
      campoNotas('Diagnósticos diferenciales', 'diferenciales', n.diferenciales) +
    '</div>' +
    '<div class="organo" style="margin-top:12px"><div class="organo-t">Muestras tomadas</div><div class="chips">' +
      MUESTRAS.map(function(m){ return '<button type="button" class="chip muestra' + ((n.muestras||[]).indexOf(m)>=0?' on':'') + '" data-muestra="' + esc(m) + '">' + esc(m) + '</button>'; }).join('') +
    '</div></div>' +
    '<div class="grid dos" style="margin-top:12px">' +
      '<label class="campo">Laboratorio / N° de caso<input type="text" data-f="laboratorio" value="' + esc(n.laboratorio) + '"></label>' +
    '</div><div style="margin-top:12px">' + campoNotas('Recomendaciones al productor', 'recomendaciones', n.recomendaciones) + '</div></div>' +

    '<div class="barra-guardar">' +
      '<button class="btn" id="f-cancelar">Cancelar</button>' +
      '<button class="btn prim" id="f-guardar">💾 Guardar necropsia</button>' +
    '</div><div class="estado-guardado" id="f-estado"></div>';

  // Eventos
  $$('[data-f],[data-h]', v).forEach(function(el){ el.addEventListener('input', function(){ leerCampo(el); guardarBorrador(); }); });
  $$('.sis', v).forEach(conectarSistema);
  $$('[data-muestra]', v).forEach(function(b){ b.addEventListener('click', function(){
    var m = b.dataset.muestra, i = actual.muestras.indexOf(m);
    if (i >= 0) actual.muestras.splice(i, 1); else actual.muestras.push(m);
    b.classList.toggle('on', i < 0); guardarBorrador();
  }); });
  $$('.btn-foto input', v).forEach(function(inp){ inp.addEventListener('change', function(){ agregarFotos(inp.dataset.sis, inp.files); inp.value=''; }); });
  $$('.mic', v).forEach(conectarMic);
  $('#f-guardar').addEventListener('click', guardar);
  $('#f-cancelar').addEventListener('click', cancelar);
  pintarFotosForm();
  pintarRefsForm();
}

function unicos(campo){ var o = {}; necropsias.forEach(function(n){ if (n[campo]) o[n[campo]] = 1; }); return Object.keys(o).sort(); }

function campoNotas(label, key, val, ph){
  var attr = key.indexOf('h:') === 0 ? 'data-h="' + key.slice(2) + '"' : key.indexOf('s:') === 0 ? 'data-snotas="' + key.slice(2) + '"' : 'data-f="' + key + '"';
  return '<label class="campo">' + esc(label) + '<div class="fila-notas"><textarea ' + attr + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>' + esc(val) + '</textarea>' +
    '<button type="button" class="mic" title="Dictar">🎙</button></div></label>';
}
function btnFoto(sis){
  return '<label class="btn chico btn-foto">📷 Agregar fotos<input type="file" accept="image/*" multiple data-sis="' + sis + '"></label>';
}

function htmlSistema(s){
  var d = actual.hallazgos[s.k];
  var html = '<div class="sis' + (s.score ? ' abierto' : '') + '" data-sis="' + s.k + '" data-estado="' + d.estado + '">' +
    '<div class="sis-cab"><span class="ico">' + s.ico + '</span><h3>' + s.t + '</h3><span class="sis-resumen"></span></div>' +
    '<div class="sis-cuerpo"><div class="seg">' +
      [['sin','Sin alteraciones'],['alt','Alterado'],['ne','No evaluado']].map(function(o){ return '<button type="button" data-v="' + o[0] + '"' + (d.estado===o[0]?' class="on"':'') + '>' + o[1] + '</button>'; }).join('') +
    '</div>';
  if (s.score) html += htmlScore(d.score) + htmlHemo(d.hemo) + '<details class="dif"><summary>¿Hígado amarillo = hígado graso? Diferenciales</summary>' + htmlDiferenciales() + '</details>';
  html += s.organos.map(function(o){
    return '<div class="organo"><div class="organo-t">' + o[0] + '</div><div class="chips">' +
      o[1].map(function(c){ var key = o[0] + ': ' + c; return '<button type="button" class="chip' + (d.chips.indexOf(key)>=0?' on':'') + '" data-chip="' + esc(key) + '">' + esc(c) + '</button>'; }).join('') +
    '</div></div>';
  }).join('');
  html += campoNotas('Descripción / otras lesiones', 's:' + s.k, d.notas);
  html += '<div class="fotos" data-fotos="' + s.k + '"></div>' + btnFoto(s.k);
  html += '<div class="ref-tira-wrap" data-refs="' + s.k + '"></div>';
  return html + '</div></div>';
}

function htmlScore(sel){
  return '<div class="organo"><div class="organo-t">Score de color hepático (Royal GD)</div>' +
    '<div class="score-higado">' + SCORE_HIGADO.map(function(x, i){ return '<div class="sw' + (sel===i+1?' on':'') + '" data-score="' + (i+1) + '" style="background:' + x.c + '" title="' + SCORE_ETQ[x.g] + '"></div>'; }).join('') + '</div>' +
    '<div class="score-leyenda"><span class="n">Normal</span><span class="r">Grupo de riesgo</span><span class="f">FLHS</span></div>' +
    '<div class="score-msg"' + (sel ? '' : ' style="display:none"') + '>' + (sel ? SCORE_TXT[SCORE_HIGADO[sel-1].g] : '') + '</div></div>';
}

function htmlHemo(sel){
  return '<div class="organo"><div class="organo-t">Hemorragias hepáticas (score 0–5)</div><div class="hemo">' +
    HEMO.map(function(h){ return '<button type="button" data-hemo="' + h.v + '"' + (sel===h.v?' class="on"':'') + '><b>' + h.t + '</b><span>' + h.d + '</span></button>'; }).join('') +
    '</div><div class="score-msg hemo-msg"' + (sel == null ? ' style="display:none"' : '') + '>' + (sel == null ? '' : HEMO_TXT[sel]) + '</div></div>';
}
function htmlDiferenciales(){
  return '<ul class="dif-lista">' + HIGADO_DIFERENCIALES.map(function(x){ return '<li><b>' + x[0] + ':</b> ' + x[1] + '</li>'; }).join('') + '</ul>';
}
// Ficha de terreno siempre disponible (pestaña Referencias), no depende de importar imágenes.
function htmlFichaHigado(){
  var grupos = [['normal','Normal','No se justifica tratamiento preventivo.'],['riesgo','Grupo de riesgo','Pedir triglicéridos (TG) antes de tratar.'],['flhs','FLHS','Tratar el lote y corregir la causa.']];
  return '<details class="tarjeta ficha" open><summary><h3 style="display:inline">🟤 Ficha de terreno: hígado graso (FLHS)</h3></summary>' +
    '<p style="font-size:14px;color:var(--text2);margin:6px 0 12px">Compara el hígado con luz natural, sobre fondo blanco y recién abierta el ave. Usar en gallinas en postura, no en pollitos. Sube el brillo de la pantalla al máximo: el color en pantalla es orientativo.</p>' +
    '<div class="organo-t">1 · Color (Royal GD)</div>' +
    grupos.map(function(g){
      return '<div class="ficha-grupo"><div class="ficha-sw">' + SCORE_HIGADO.map(function(x, i){ return x.g === g[0] ? '<div class="sw grande" style="background:' + x.c + '"><span>' + (i+1) + '</span></div>' : ''; }).join('') + '</div>' +
        '<div><b class="' + g[0] + '">' + g[1] + '</b><br><span>' + g[2] + '</span></div></div>';
    }).join('') +
    '<div class="organo-t" style="margin-top:14px">2 · Hemorragias (Shini / Diaz, 0–5)</div><ul class="dif-lista">' +
      HEMO.map(function(h){ return '<li><b>' + h.t + ':</b> ' + h.d + '</li>'; }).join('') + '</ul>' +
    '<div class="organo-t" style="margin-top:14px">3 · Forma y consistencia</div><ul class="dif-lista">' +
      '<li><b>Normal:</b> bordes agudos, firme, rojo oscuro.</li><li><b>Graso:</b> aumentado, bordes redondeados e hinchados, friable (se rompe al tomarlo), amarillo a color masilla.</li>' +
      '<li><b>Acompañan:</b> almohadilla de grasa abdominal gruesa, peso corporal alto, cresta pálida, muerte súbita de aves en buena condición.</li></ul>' +
    '<div class="organo-t" style="margin-top:14px">4 · Diferenciales</div>' + htmlDiferenciales() +
    '<p style="font-size:11px;color:var(--text3);margin-top:10px">Fuentes: Royal GD / Layer Signals Checkbook; Shini et al. 2019 (Avian Pathology); Diaz, Squires y Julian 1999 (Avian Diseases); Merck Veterinary Manual — FLHS.</p></details>';
}

function resumenSis(el){
  var d = actual.hallazgos[el.dataset.sis], nf = actual.fotos.filter(function(f){ return f.sistema === el.dataset.sis; }).length;
  var t = d.estado === 'alt' ? d.chips.length + ' hallazgo' + (d.chips.length===1?'':'s') : d.estado === 'sin' ? 'sin alteraciones' : '';
  if (d.score) t += (t?' · ':'') + 'color ' + d.score;
  if (d.hemo != null) t += (t?' · ':'') + 'hemorragias ' + HEMO[d.hemo].t;
  if (nf) t += (t?' · ':'') + '📷' + nf;
  $('.sis-resumen', el).textContent = t;
}

function conectarSistema(el){
  var k = el.dataset.sis, d = actual.hallazgos[k];
  $('.sis-cab', el).addEventListener('click', function(){ el.classList.toggle('abierto'); });
  $$('.seg button', el).forEach(function(b){ b.addEventListener('click', function(){
    d.estado = b.dataset.v; el.dataset.estado = d.estado;
    $$('.seg button', el).forEach(function(x){ x.classList.toggle('on', x === b); });
    resumenSis(el); guardarBorrador();
  }); });
  $$('[data-chip]', el).forEach(function(b){ b.addEventListener('click', function(){
    var c = b.dataset.chip, i = d.chips.indexOf(c);
    if (i >= 0) d.chips.splice(i, 1); else d.chips.push(c);
    b.classList.toggle('on', i < 0);
    if (i < 0 && d.estado !== 'alt'){ $('.seg button[data-v=alt]', el).click(); }
    resumenSis(el); guardarBorrador();
  }); });
  $$('[data-score]', el).forEach(function(sw){ sw.addEventListener('click', function(){
    var v = +sw.dataset.score; d.score = d.score === v ? null : v;
    $$('[data-score]', el).forEach(function(x){ x.classList.toggle('on', +x.dataset.score === d.score); });
    var m = $('.score-msg', el);
    if (d.score){ m.style.display = ''; m.textContent = SCORE_TXT[SCORE_HIGADO[d.score-1].g]; } else m.style.display = 'none';
    if (d.score && d.estado === 'ne'){ $('.seg button[data-v=' + (d.score <= 2 ? 'sin' : 'alt') + ']', el).click(); }
    resumenSis(el); guardarBorrador();
  }); });
  $$('[data-hemo]', el).forEach(function(b){ b.addEventListener('click', function(){
    var v = +b.dataset.hemo; d.hemo = d.hemo === v ? null : v;
    $$('[data-hemo]', el).forEach(function(x){ x.classList.toggle('on', +x.dataset.hemo === d.hemo); });
    var m = $('.hemo-msg', el);
    if (d.hemo != null){ m.style.display = ''; m.textContent = HEMO_TXT[d.hemo]; } else m.style.display = 'none';
    if (d.hemo > 0 && d.estado !== 'alt'){ $('.seg button[data-v=alt]', el).click(); }
    resumenSis(el); guardarBorrador();
  }); });
  $('[data-snotas]', el).addEventListener('input', function(e){ d.notas = e.target.value; guardarBorrador(); });
  resumenSis(el);
}

function leerCampo(el){
  if (el.dataset.h){ actual.historia[el.dataset.h] = el.value; return; }
  var f = el.dataset.f, v = el.value;
  if (f === 'edad_semanas') v = v === '' ? null : parseFloat(v);
  if (f === 'n_aves') v = v === '' ? null : parseInt(v, 10);
  actual[f] = v;
}

var tBorrador;
function guardarBorrador(){
  clearTimeout(tBorrador);
  tBorrador = setTimeout(function(){
    try { localStorage.setItem(BORRADOR_KEY, JSON.stringify(actual)); } catch(e){}
    var e = $('#f-estado'); if (e) e.textContent = 'Borrador guardado en este equipo · sin guardar en la nube';
  }, 400);
}
function limpiarBorrador(){ try { localStorage.removeItem(BORRADOR_KEY); } catch(e){} }

// ── Fotos del formulario ─────────────────────────────────────────
async function agregarFotos(sis, files){
  files = Array.prototype.slice.call(files || []);
  var cont = $('[data-fotos="' + sis + '"]');
  for (var i = 0; i < files.length; i++){
    var ph = document.createElement('div'); ph.className = 'foto subiendo'; ph.textContent = 'Subiendo…'; cont.appendChild(ph);
    try {
      var path = 'fotos/' + actual.id + '/' + uuid() + '.jpg';
      await subir(path, files[i]);
      actual.fotos.push({ path: path, sistema: sis, nota: '' });
      fotosSesion.push(path);
    } catch(e){ toast('No se pudo subir la foto: ' + (e.message || e)); }
    ph.remove();
  }
  guardarBorrador(); pintarFotosForm();
  var el = $('.sis[data-sis="' + sis + '"]'); if (el) resumenSis(el);
}

async function pintarFotosForm(){
  var paths = actual.fotos.map(function(f){ return f.path; });
  var u = paths.length ? await firmar(paths) : {};
  $$('[data-fotos]').forEach(function(cont){
    var sis = cont.dataset.fotos;
    var lista = actual.fotos.filter(function(f){ return f.sistema === sis; });
    cont.innerHTML = lista.map(function(f){ return '<div class="foto" data-path="' + esc(f.path) + '" style="background-image:url(&quot;' + esc(u[f.path]) + '&quot;)"><button type="button" class="x" title="Quitar">✕</button></div>'; }).join('');
    $$('.foto', cont).forEach(function(el, idx){
      el.addEventListener('click', function(){ abrirVisor(lista.map(function(f){ return { path:f.path, titulo: SIS_POR_K[f.sistema].t, desc: f.nota }; }), idx); });
      $('.x', el).addEventListener('click', function(ev){
        ev.stopPropagation();
        if (!confirm('¿Quitar esta foto?')) return;
        var p = el.dataset.path;
        actual.fotos = actual.fotos.filter(function(f){ return f.path !== p; });
        // Solo se borra del bucket si se subió en esta edición; si ya estaba guardada, se borra al guardar.
        if (fotosSesion.indexOf(p) >= 0){ borrarFotos([p]); fotosSesion.splice(fotosSesion.indexOf(p), 1); }
        guardarBorrador(); pintarFotosForm();
        var s = $('.sis[data-sis="' + sis + '"]'); if (s) resumenSis(s);
      });
    });
  });
}

async function pintarRefsForm(){
  var paths = referencias.map(function(r){ return r.path; });
  var u = paths.length ? await firmar(paths) : {};
  $$('[data-refs]').forEach(function(w){
    var lista = referencias.filter(function(r){ return r.sistema === w.dataset.refs; });
    if (!lista.length){ w.innerHTML = ''; return; }
    w.innerHTML = '<div class="ref-tira-t">🖼 Referencias para comparar</div><div class="ref-tira">' +
      lista.map(function(r, i){ return '<div class="ref-mini ' + r.estado + '" data-i="' + i + '"><div class="im" style="background-image:url(&quot;' + esc(u[r.path]) + '&quot;)"></div><span>' + esc(r.titulo) + '</span></div>'; }).join('') + '</div>';
    $$('.ref-mini', w).forEach(function(m){ m.addEventListener('click', function(){ abrirVisor(lista.map(refAVisor), +m.dataset.i); }); });
  });
}
function refAVisor(r){ return { path:r.path, titulo:r.titulo, desc:r.descripcion, estado:r.estado, fuente:r.fuente }; }

// ── Dictado por voz ──────────────────────────────────────────────
var Reconocedor = window.SpeechRecognition || window.webkitSpeechRecognition;
function conectarMic(btn){
  if (!Reconocedor){ btn.remove(); return; }
  var rec = null;
  btn.addEventListener('click', function(){
    if (rec){ rec.stop(); return; }
    var ta = btn.previousElementSibling;
    rec = new Reconocedor(); rec.lang = 'es-CL'; rec.continuous = true; rec.interimResults = false;
    rec.onresult = function(e){
      for (var i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal){
        var t = e.results[i][0].transcript.trim();
        ta.value = (ta.value ? ta.value.replace(/\s*$/, ' ') : '') + t.charAt(0).toUpperCase() + t.slice(1);
        ta.dispatchEvent(new Event('input'));
      }
    };
    rec.onend = function(){ btn.classList.remove('rec'); rec = null; };
    rec.start(); btn.classList.add('rec');
  });
}

// ── Guardar / cancelar ───────────────────────────────────────────
async function guardar(){
  if (guardando) return;
  if (!actual.productor.trim()){ toast('Falta el productor / granja'); $('[data-f=productor]').focus(); return; }
  guardando = true; $('#f-guardar').disabled = true; $('#f-guardar').textContent = 'Guardando…';
  var fila = {
    fecha: actual.fecha || hoy(), productor: actual.productor.trim(), lote: actual.lote, tipo_ave: actual.tipo_ave,
    linea_genetica: actual.linea_genetica, edad_semanas: actual.edad_semanas, n_aves: actual.n_aves,
    historia: actual.historia, hallazgos: actual.hallazgos, fotos: actual.fotos,
    dx_presuntivo: actual.dx_presuntivo, diferenciales: actual.diferenciales, muestras: actual.muestras,
    laboratorio: actual.laboratorio, recomendaciones: actual.recomendaciones, updated_at: new Date().toISOString()
  };
  // Fotos que estaban guardadas y se quitaron en esta edición
  var previa = necropsias.find(function(n){ return n.id === actual.id; });
  var quitadas = previa ? (previa.fotos||[]).map(function(f){ return f.path; }).filter(function(p){ return !actual.fotos.some(function(f){ return f.path === p; }); }) : [];

  try {
    await dbPut('necropsias', Object.assign({ id: actual.id, created_at: previa ? previa.created_at : new Date().toISOString() }, fila));
  } catch(e){
    guardando = false; $('#f-guardar').disabled = false; $('#f-guardar').textContent = '💾 Guardar necropsia';
    toast('Error al guardar: ' + (e.message || e)); return;
  }
  guardando = false;
  quitadas = quitadas.filter(function(p){ return !referencias.some(function(x){ return x.path === p; }); });
  if (quitadas.length) await borrarFotos(quitadas);
  limpiarBorrador(); fotosSesion = [];
  var id = actual.id; actual = null;
  await cargarNecropsias();
  toast('Necropsia guardada');
  verNecropsia(id);
}

function cancelar(){
  if (!confirm(actualPersistida ? '¿Descartar los cambios?' : '¿Descartar esta necropsia? Se borrarán las fotos que subiste.')) return;
  if (fotosSesion.length) borrarFotos(fotosSesion);
  fotosSesion = []; limpiarBorrador();
  var id = actualPersistida ? actual.id : null; actual = null;
  if (id) verNecropsia(id); else irA('historial');
}

// ══ VER / INFORME ════════════════════════════════════════════════
async function verNecropsia(id){
  var n = necropsias.find(function(x){ return x.id === id; });
  if (!n){ irA('historial'); return; }
  $$('.vista').forEach(function(v){ v.classList.add('oculto'); });
  $('#v-ver').classList.remove('oculto');
  $$('.tab').forEach(function(t){ t.classList.toggle('activa', t.dataset.vista === 'historial'); });
  history.replaceState(null, '', '#ver/' + id);
  window.scrollTo(0, 0);

  var h = n.historia || {}, hz = n.hallazgos || {}, fotos = n.fotos || [];
  var u = fotos.length ? await firmar(fotos.map(function(f){ return f.path; })) : {};
  function fotosDe(k){
    var l = fotos.filter(function(f){ return f.sistema === k; });
    return l.length ? '<div class="inf-fotos">' + l.map(function(f){ return '<figure><img src="' + esc(u[f.path]) + '" data-path="' + esc(f.path) + '" alt=""></figure>'; }).join('') + '</div>' : '';
  }
  function bloque(t, x){ return x ? '<div class="inf-bloque"><h4>' + t + '</h4><p style="white-space:pre-wrap">' + esc(x) + '</p></div>' : ''; }
  var meta = [['Fecha', fechaLarga(n.fecha)], ['Galpón / lote', n.lote], ['Tipo de ave', n.tipo_ave], ['Línea genética', n.linea_genetica],
    ['Edad', n.edad_semanas ? n.edad_semanas + ' semanas' : ''], ['Aves necropsiadas', n.n_aves], ['Condición', {muerta:'Muertas en galpón',sacrificada:'Sacrificadas',mixta:'Mixto'}[h.condicion]]];

  var sisHtml = SISTEMAS.map(function(s){
    var d = hz[s.k] || { estado:'ne', chips:[] };
    if (d.estado === 'ne' && !d.notas && !fotos.some(function(f){ return f.sistema === s.k; })) return '';
    var tx = d.estado === 'sin' ? 'Sin alteraciones macroscópicas.' : (d.chips||[]).join(' · ');
    if (d.score){ var g = SCORE_HIGADO[d.score-1]; tx = '<span style="display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-2px;background:' + g.c + '"></span> Score de color ' + d.score + '/7 (' + SCORE_ETQ[g.g] + ')' + (d.hemo != null ? ' · Hemorragias ' + HEMO[d.hemo].t + ' (' + HEMO[d.hemo].d.toLowerCase() + ')' : '') + (tx ? ' · ' + esc(tx) : ''); }
    else if (d.hemo != null) tx = 'Hemorragias ' + HEMO[d.hemo].t + ' (' + HEMO[d.hemo].d.toLowerCase() + ')' + (tx ? ' · ' + esc(tx) : '');
    else tx = esc(tx);
    return '<div class="inf-sis ' + d.estado + '"><h4>' + s.ico + ' ' + s.t + '</h4><p>' + tx + '</p>' +
      (d.notas ? '<p style="white-space:pre-wrap">' + esc(d.notas) + '</p>' : '') + fotosDe(s.k) + '</div>';
  }).join('');

  $('#v-ver').innerHTML =
    '<div class="inf-acciones">' +
      '<button class="btn" id="i-volver">← Historial</button>' +
      '<button class="btn prim" id="i-editar">✎ Editar</button>' +
      '<button class="btn" id="i-imprimir">🖨 Imprimir / PDF</button>' +
      '<button class="btn" id="i-copiar">📋 Copiar resumen</button>' +
      '<button class="btn peligro" id="i-borrar">Eliminar</button>' +
    '</div>' +
    '<div class="tarjeta">' +
      '<div class="inf-cab"><div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);font-weight:600">Informe de necropsia · AviVet</div>' +
      '<h2>' + esc(n.productor) + '</h2></div><div style="font-size:13px;color:var(--text2);text-align:right">MV Andrés Lazo<br>' + fechaLarga(n.fecha) + '</div></div>' +
      '<div class="inf-meta">' + meta.filter(function(m){ return m[1]; }).map(function(m){ return '<div><span>' + m[0] + '</span>' + esc(m[1]) + '</div>'; }).join('') + '</div>' +
      bloque('Motivo de consulta', h.motivo) + bloque('Mortalidad / morbilidad', h.mortalidad) + bloque('Signos clínicos', h.signos) + bloque('Vacunaciones y tratamientos', h.vacunacion) +
      '<div class="inf-bloque"><h4>Hallazgos de necropsia</h4>' + (sisHtml || '<p style="color:var(--text3)">Sin hallazgos registrados.</p>') + '</div>' +
      (fotos.some(function(f){ return f.sistema === 'general'; }) ? '<div class="inf-bloque"><h4>Fotos generales</h4>' + fotosDe('general') + '</div>' : '') +
      bloque('Diagnóstico presuntivo', n.dx_presuntivo) + bloque('Diagnósticos diferenciales', n.diferenciales) +
      ((n.muestras||[]).length ? bloque('Muestras tomadas', n.muestras.join(', ') + (n.laboratorio ? '\nLaboratorio: ' + n.laboratorio : '')) : bloque('Laboratorio', n.laboratorio)) +
      bloque('Recomendaciones', n.recomendaciones) +
    '</div>';

  $('#i-volver').addEventListener('click', function(){ irA('historial'); });
  $('#i-editar').addEventListener('click', function(){ abrirFormulario(id); $$('.vista').forEach(function(v){ v.classList.add('oculto'); }); $('#v-form').classList.remove('oculto'); $$('.tab').forEach(function(t){ t.classList.toggle('activa', t.dataset.vista === 'form'); }); window.scrollTo(0,0); });
  $('#i-imprimir').addEventListener('click', function(){ window.print(); });
  $('#i-copiar').addEventListener('click', function(){ copiarResumen(n); });
  $('#i-borrar').addEventListener('click', function(){ borrarNecropsia(n); });
  var lista = fotos.map(function(f){ return { path:f.path, titulo:SIS_POR_K[f.sistema].t, desc:f.nota, sistema:f.sistema, propia:true }; });
  $$('.inf-fotos img', $('#v-ver')).forEach(function(img){ img.addEventListener('click', function(){
    abrirVisor(lista, lista.findIndex(function(f){ return f.path === img.dataset.path; }));
  }); });
}

function copiarResumen(n){
  var h = n.historia || {}, L = ['*Necropsia · ' + n.productor + '*', fechaLarga(n.fecha) + (n.lote ? ' · ' + n.lote : '') + (n.edad_semanas ? ' · ' + n.edad_semanas + ' sem' : '') + (n.n_aves ? ' · ' + n.n_aves + ' ave(s)' : '')];
  if (h.motivo) L.push('', 'Motivo: ' + h.motivo);
  var alt = sistemasAlterados(n);
  L.push('', '*Hallazgos*');
  if (!alt.length) L.push('Sin lesiones macroscópicas relevantes.');
  alt.forEach(function(s){ var d = n.hallazgos[s.k]; L.push('• ' + s.t + ': ' + (d.chips||[]).join('; ') + (d.score ? ' (color hepático ' + d.score + '/7, ' + SCORE_ETQ[SCORE_HIGADO[d.score-1].g] + ')' : '') + (d.hemo != null ? ' (hemorragias ' + HEMO[d.hemo].t + ')' : '') + (d.notas ? '. ' + d.notas : '')); });
  if (n.dx_presuntivo) L.push('', '*Diagnóstico presuntivo:* ' + n.dx_presuntivo);
  if ((n.muestras||[]).length) L.push('Muestras: ' + n.muestras.join(', '));
  if (n.recomendaciones) L.push('', '*Recomendaciones*', n.recomendaciones);
  navigator.clipboard.writeText(L.join('\n')).then(function(){ toast('Resumen copiado'); }, function(){ toast('No se pudo copiar'); });
}

async function borrarNecropsia(n){
  if (!confirm('¿Eliminar definitivamente la necropsia de ' + n.productor + ' (' + fechaLarga(n.fecha) + ') y sus fotos?')) return;
  await dbBorrar('necropsias', n.id);
  // No borrar fotos que se marcaron como referencia
  var paths = (n.fotos||[]).map(function(f){ return f.path; }).filter(function(p){ return !referencias.some(function(x){ return x.path === p; }); });
  if (paths.length) await borrarFotos(paths);
  await cargarNecropsias(); toast('Necropsia eliminada'); irA('historial');
}

// ══ REFERENCIAS ══════════════════════════════════════════════════
var filtroRef = 'todos';
async function renderReferencias(){
  var v = $('#v-refs');
  var faltan = Object.keys(REF_CATALOGO).filter(function(k){ return !referencias.some(function(r){ return r.path === 'referencias/' + k + '.jpg'; }); });
  v.innerHTML =
    '<h2 class="titulo">Referencias para terreno</h2>' + htmlFichaHigado() +
    '<p class="sub">Atlas para comparar durante la necropsia. <span style="color:#4caf50;font-weight:600">Verde</span> = normal, <span style="color:#e53935;font-weight:600">rojo</span> = alterado. También aparecen dentro de cada sistema del formulario.</p>' +
    (faltan.length ? '<div class="aviso">📦 Faltan ' + faltan.length + ' de ' + Object.keys(REF_CATALOGO).length + ' imágenes del paquete inicial (Layer Signals Checkbook). ' +
      'Importa el archivo <b>paquete-referencias.zip</b> (o las fotos sueltas de la carpeta <b>referencias</b>) y se clasificarán solas.<br><label class="btn chico btn-foto" style="margin-top:8px">Importar paquete inicial<input type="file" accept=".zip,application/zip,image/*" multiple id="ref-importar"></label></div>' : '') +
    '<div class="tarjeta"><h3>Agregar referencia propia</h3><div class="grid">' +
      '<label class="campo">Sistema<select id="nr-sis">' + SISTEMAS.map(function(s){ return '<option value="' + s.k + '">' + s.t + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo">Estado<select id="nr-est"><option value="alterado">Alterado</option><option value="normal">Normal</option><option value="referencia">Referencia / anatomía</option></select></label>' +
      '<label class="campo">Título<input type="text" id="nr-tit" placeholder="Ej: Tiflitis por Eimeria tenella"></label>' +
    '</div><div class="grid dos" style="margin-top:12px"><label class="campo">Descripción<textarea id="nr-desc"></textarea></label>' +
      '<label class="campo">Fuente<input type="text" id="nr-fuente" placeholder="Caso propio, libro, laboratorio…"></label></div>' +
    '<label class="btn prim btn-foto" style="margin-top:12px">📷 Elegir imagen y guardar<input type="file" accept="image/*" id="nr-file"></label></div>' +
    '<div class="ref-filtros">' + [['todos','Todos'],['normal','Normal'],['alterado','Alterado'],['referencia','Anatomía']].map(function(f){ return '<button class="chip muestra' + (filtroRef===f[0]?' on':'') + '" data-fr="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>' +
    '<div id="ref-galeria"></div>';

  var imp = $('#ref-importar'); if (imp) imp.addEventListener('change', function(){ var f = Array.prototype.slice.call(imp.files); if (f.length === 1 && /\.zip$/i.test(f[0].name)) importarRespaldo(f[0]); else importarPaquete(f); });
  $('#nr-file').addEventListener('change', function(e){ agregarReferencia(e.target.files[0]); e.target.value=''; });
  $$('[data-fr]', v).forEach(function(b){ b.addEventListener('click', function(){ filtroRef = b.dataset.fr; renderReferencias(); }); });
  pintarGaleria();
}

async function pintarGaleria(){
  var g = $('#ref-galeria');
  var lista = referencias.filter(function(r){ return filtroRef === 'todos' || r.estado === filtroRef; });
  if (!lista.length){ g.innerHTML = '<div class="vacio">Sin imágenes de referencia todavía.</div>'; return; }
  var u = await firmar(lista.map(function(r){ return r.path; }));
  g.innerHTML = SISTEMAS.map(function(s){
    var l = lista.filter(function(r){ return r.sistema === s.k; });
    if (!l.length) return '';
    return '<div class="ref-grupo"><h3>' + s.ico + ' ' + s.t + '</h3><div class="ref-grid">' + l.map(function(r){
      return '<div class="ref-card ' + r.estado + '" data-id="' + r.id + '"><div class="im" style="background-image:url(&quot;' + esc(u[r.path]) + '&quot;)"></div><div class="tx">' + esc(r.titulo) + '<small>' + esc(r.fuente || '') + '</small></div></div>';
    }).join('') + '</div></div>';
  }).join('');
  $$('.ref-card', g).forEach(function(c){ c.addEventListener('click', function(){
    var r = referencias.find(function(x){ return x.id === c.dataset.id; });
    var grupo = lista.filter(function(x){ return x.sistema === r.sistema; });
    abrirVisor(grupo.map(function(x){ var o = refAVisor(x); o.refId = x.id; return o; }), grupo.indexOf(r));
  }); });
}

async function importarPaquete(files){
  files = Array.prototype.slice.call(files || []);
  var ok = 0, ignorados = [];
  toast('Importando ' + files.length + ' imágenes…');
  for (var i = 0; i < files.length; i++){
    var base = files[i].name.replace(/\.[^.]+$/, ''), c = REF_CATALOGO[base];
    if (!c){ ignorados.push(files[i].name); continue; }
    var path = 'referencias/' + base + '.jpg';
    try {
      await subir(path, files[i], false);
      if (!referencias.some(function(r){ return r.path === path; })) await dbPut('referencias', refDeCatalogo(base));
      ok++;
    } catch(e){ toast('Error con ' + files[i].name + ': ' + (e.message||e)); }
  }
  await cargarReferencias();
  toast(ok + ' referencias importadas' + (ignorados.length ? ' · ' + ignorados.length + ' archivos no reconocidos' : ''));
  renderReferencias();
}

async function agregarReferencia(file){
  if (!file) return;
  var tit = $('#nr-tit').value.trim();
  if (!tit){ toast('Ponle un título a la referencia'); return; }
  try {
    var path = 'referencias/' + uuid() + '.jpg';
    await subir(path, file);
    await dbPut('referencias', { id:uuid(), created_at:new Date().toISOString(), path:path, sistema:$('#nr-sis').value, estado:$('#nr-est').value, titulo:tit, descripcion:$('#nr-desc').value.trim(), fuente:$('#nr-fuente').value.trim() || 'Caso propio' });
    await cargarReferencias(); toast('Referencia agregada'); renderReferencias();
  } catch(e){ toast('Error: ' + (e.message||e)); }
}

// Guardar una foto de un caso como referencia (desde el visor)
async function fotoComoReferencia(item){
  var tit = prompt('Título para esta referencia:', item.titulo);
  if (!tit) return;
  var estado = confirm('¿Es un hallazgo ALTERADO?\n(Aceptar = alterado · Cancelar = normal)') ? 'alterado' : 'normal';
  await dbPut('referencias', { id:uuid(), created_at:new Date().toISOString(), path:item.path, sistema:item.sistema === 'general' ? 'externo' : item.sistema, estado:estado, titulo:tit, fuente:'Caso propio' });
  await cargarReferencias(); toast('Guardada en Referencias');
}

async function borrarReferencia(id){
  var r = referencias.find(function(x){ return x.id === id; });
  if (!r || !confirm('¿Quitar «' + r.titulo + '» de las referencias?')) return;
  await dbBorrar('referencias', id);
  // Borrar el archivo solo si no es foto de una necropsia
  var usada = necropsias.some(function(n){ return (n.fotos||[]).some(function(f){ return f.path === r.path; }); });
  if (!usada) await borrarFotos([r.path]);
  await cargarReferencias(); cerrarVisor(); renderReferencias();
}

function refDeCatalogo(base){
  var c = REF_CATALOGO[base];
  return { id:'cat-' + base, created_at:new Date().toISOString(), path:'referencias/' + base + '.jpg',
    sistema:c[0], estado:c[1], titulo:c[2], descripcion:c[3], fuente:FUENTE_LSC };
}

// ══ RESPALDO / TRASPASO ENTRE DISPOSITIVOS ═══════════════════════
// Formato del .zip: necropsias.json · referencias.json · fotos/… · referencias/…
// Importar FUSIONA (no reemplaza): gana la versión más reciente de cada necropsia.
function ultimoRespaldo(){ try { return localStorage.getItem(RESPALDO_KEY); } catch(e){ return null; } }
function avisoRespaldo(){
  if (!necropsias.length) return '';
  var u = ultimoRespaldo(), dias = u ? Math.floor((Date.now() - new Date(u)) / 864e5) : null;
  var pendientes = necropsias.filter(function(n){ return !u || (n.updated_at || n.created_at) > u; }).length;
  if (!pendientes || (dias !== null && dias < 7 && pendientes < 3)) return '';
  return '<div class="aviso">💾 ' + pendientes + ' necropsia' + (pendientes===1?'':'s') + ' sin respaldar' +
    (u ? ' (último respaldo hace ' + dias + ' día' + (dias===1?'':'s') + ')' : '') +
    '. Si pierdes o cambias el celular, se pierden. <a href="#respaldo" onclick="irA(\'respaldo\');return false" style="color:inherit;font-weight:600">Respaldar ahora →</a></div>';
}

async function renderRespaldo(){
  var v = $('#v-respaldo'), u = ultimoRespaldo();
  var nFotos = (await dbTodos('fotos')).length;
  var est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
  var persist = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null;
  v.innerHTML =
    '<h2 class="titulo">Respaldo y traspaso</h2>' +
    '<p class="sub">Todo se guarda <b>solo en este dispositivo</b>; nada pasa por internet ni por avivet.cl. Para respaldar o pasar tus necropsias entre el celular y el notebook, exporta un archivo y guárdalo en tu Google Drive o OneDrive.</p>' +
    '<div class="tarjeta"><h3>En este dispositivo</h3><div class="inf-meta">' +
      '<div><span>Necropsias</span>' + necropsias.length + '</div>' +
      '<div><span>Referencias</span>' + referencias.length + '</div>' +
      '<div><span>Fotos</span>' + nFotos + '</div>' +
      (est ? '<div><span>Espacio usado</span>' + (est.usage/1048576).toFixed(1) + ' MB</div>' : '') +
      '<div><span>Último respaldo</span>' + (u ? new Date(u).toLocaleString('es-CL', { dateStyle:'medium', timeStyle:'short' }) : 'Nunca') + '</div>' +
    '</div>' + (persist === false ? '<p style="font-size:13px;color:var(--text2)">⚠️ El navegador no marcó el almacenamiento como permanente. En iPhone, instala la app en la pantalla de inicio (Compartir → «Agregar a inicio») para que Safari no la borre si no la usas por varias semanas.</p>' : '') + '</div>' +

    '<div class="tarjeta"><h3>1 · Exportar respaldo</h3>' +
      '<p style="font-size:14px;color:var(--text2);margin-bottom:12px">Genera <b>necropsias-respaldo-FECHA.zip</b> con todas las fichas, fotos y referencias. En el celular, «Compartir» abre el menú del sistema: elige <b>Drive</b> u <b>OneDrive</b> y guárdalo en una carpeta privada (ej. «AviVet Necropsias»).</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        (navigator.canShare ? '<button class="btn prim" id="r-compartir">📤 Compartir a Drive / OneDrive</button>' : '') +
        '<button class="btn' + (navigator.canShare ? '' : ' prim') + '" id="r-descargar">⬇ Descargar archivo</button>' +
        '<label class="btn"><input type="checkbox" id="r-sinrefs" checked style="margin-right:4px"> Incluir referencias</label>' +
      '</div><div id="r-estado" style="font-size:13px;color:var(--text2);margin-top:8px"></div></div>' +

    '<div class="tarjeta"><h3>2 · Importar en otro dispositivo</h3>' +
      '<p style="font-size:14px;color:var(--text2);margin-bottom:12px">Abre el .zip desde Drive / OneDrive (en el celular: «Examinar» → Drive). Se <b>fusiona</b> con lo que ya hay: agrega lo nuevo y, si una necropsia existe en ambos lados, conserva la versión editada más recientemente. No borra nada.</p>' +
      '<label class="btn prim btn-foto">📥 Importar respaldo (.zip)<input type="file" accept=".zip,application/zip" id="r-importar"></label></div>';

  var c = $('#r-compartir'); if (c) c.addEventListener('click', function(){ exportar(true); });
  $('#r-descargar').addEventListener('click', function(){ exportar(false); });
  $('#r-importar').addEventListener('change', function(e){ if (e.target.files[0]) importarRespaldo(e.target.files[0]); e.target.value = ''; });
}

async function exportar(compartir){
  if (!window.JSZip){ toast('No se cargó el compresor (JSZip). Abre la app una vez con internet.'); return; }
  var est = $('#r-estado'); est.textContent = 'Preparando respaldo…';
  var conRefs = $('#r-sinrefs').checked;
  var zip = new JSZip();
  var ns = await dbTodos('necropsias'), rs = await dbTodos('referencias'), fs = await dbTodos('fotos');
  zip.file('necropsias.json', JSON.stringify(ns, null, 1));
  zip.file('referencias.json', JSON.stringify(conRefs ? rs : [], null, 1));
  var usadas = {}; ns.forEach(function(n){ (n.fotos||[]).forEach(function(f){ usadas[f.path] = 1; }); });
  if (conRefs) rs.forEach(function(r){ usadas[r.path] = 1; });
  fs.forEach(function(f){ if (usadas[f.path]) zip.file(f.path, f.blob); });
  // Las fotos ya vienen en JPEG: no se recomprimen (STORE), el zip se genera rápido.
  var blob = await zip.generateAsync({ type:'blob', compression:'STORE' });
  var nombre = 'necropsias-respaldo-' + hoy() + '.zip';
  var mb = (blob.size/1048576).toFixed(1) + ' MB';
  var file = new File([blob], nombre, { type:'application/zip' });
  if (compartir && navigator.canShare && navigator.canShare({ files:[file] })){
    try { await navigator.share({ files:[file], title:nombre }); marcarRespaldo(); est.textContent = 'Respaldo compartido (' + mb + ').'; }
    catch(e){ est.textContent = e.name === 'AbortError' ? 'Cancelado.' : 'No se pudo compartir: ' + e.message + '. Usa «Descargar archivo».'; }
    return;
  }
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 5000);
  marcarRespaldo();
  est.textContent = 'Descargado ' + nombre + ' (' + mb + '). Súbelo a tu carpeta de Drive / OneDrive.';
}
function marcarRespaldo(){ try { localStorage.setItem(RESPALDO_KEY, new Date().toISOString()); } catch(e){} }

async function importarRespaldo(file){
  if (!window.JSZip){ toast('No se cargó el compresor (JSZip). Abre la app una vez con internet.'); return; }
  toast('Importando…');
  try {
    var zip = await JSZip.loadAsync(file);
    var nsIn = zip.file('necropsias.json') ? JSON.parse(await zip.file('necropsias.json').async('string')) : [];
    var rsIn = zip.file('referencias.json') ? JSON.parse(await zip.file('referencias.json').async('string')) : [];
    var nuevas = 0, actualizadas = 0, refsNuevas = 0, fotosNuevas = 0;

    // Fotos (fotos/… y referencias/…); solo las que no están
    var archivos = Object.keys(zip.files).filter(function(k){ return !zip.files[k].dir && /\.(jpe?g|png|webp)$/i.test(k); });
    for (var i = 0; i < archivos.length; i++){
      if (await dbUno('fotos', archivos[i])) continue;
      var b = await zip.file(archivos[i]).async('blob');
      await dbPut('fotos', { path: archivos[i], blob: new Blob([b], { type: /\.png$/i.test(archivos[i]) ? 'image/png' : 'image/jpeg' }) });
      fotosNuevas++;
    }
    // Necropsias: gana la edición más reciente
    for (var j = 0; j < nsIn.length; j++){
      var n = nsIn[j], ya = necropsias.find(function(x){ return x.id === n.id; });
      if (!ya){ await dbPut('necropsias', n); nuevas++; }
      else if ((n.updated_at||'') > (ya.updated_at||'')){ await dbPut('necropsias', n); actualizadas++; }
    }
    // Referencias: una por archivo
    for (var k = 0; k < rsIn.length; k++){
      if (!referencias.some(function(r){ return r.path === rsIn[k].path || r.id === rsIn[k].id; })){ await dbPut('referencias', rsIn[k]); refsNuevas++; }
    }
    // Paquete inicial sin referencias.json: clasificar por nombre de archivo
    await cargarReferencias();
    for (var m = 0; m < archivos.length; m++){
      var base = archivos[m].replace(/^.*\//, '').replace(/\.[^.]+$/, '');
      if (/^referencias\//.test(archivos[m]) && REF_CATALOGO[base] && !referencias.some(function(r){ return r.path === archivos[m]; })){
        await dbPut('referencias', refDeCatalogo(base)); refsNuevas++;
      }
    }
    await Promise.all([cargarNecropsias(), cargarReferencias()]);
    toast(nuevas + ' nuevas · ' + actualizadas + ' actualizadas · ' + refsNuevas + ' referencias · ' + fotosNuevas + ' fotos');
    var vis = $$('.vista').find(function(v){ return !v.classList.contains('oculto'); });
    irA(vis && vis.id === 'v-refs' ? 'refs' : vis && vis.id === 'v-respaldo' ? 'respaldo' : 'historial');
  } catch(e){ toast('No se pudo importar: ' + (e.message || e)); }
}

// ══ VISOR ════════════════════════════════════════════════════════
var visorLista = [], visorIdx = 0;
async function abrirVisor(lista, idx){
  visorLista = lista; visorIdx = Math.max(0, idx);
  $('#visor').classList.remove('oculto');
  await pintarVisor();
}
async function pintarVisor(){
  var it = visorLista[visorIdx], u = await firmar([it.path]);
  $('#visor img').src = u[it.path];
  $('#visor .cap').innerHTML = '<b>' + esc(it.titulo) + '</b>' + (it.estado && it.estado !== 'referencia' ? '<span style="color:' + (it.estado==='normal'?'#81c784':'#ef9a9a') + ';font-weight:600">' + (it.estado==='normal'?'Normal':'Alterado') + '</span> · ' : '') + esc(it.desc || '') + (it.fuente ? '<br><small>Fuente: ' + esc(it.fuente) + '</small>' : '');
  var acc = $('#visor .acc'); acc.innerHTML = '';
  if (it.propia && !referencias.some(function(r){ return r.path === it.path; })){
    var b = document.createElement('button'); b.className = 'btn chico'; b.textContent = '⭐ Guardar como referencia';
    b.onclick = function(){ fotoComoReferencia(it); }; acc.appendChild(b);
  }
  if (it.refId){
    var d = document.createElement('button'); d.className = 'btn chico peligro'; d.textContent = 'Quitar de referencias';
    d.onclick = function(){ borrarReferencia(it.refId); }; acc.appendChild(d);
  }
  $('#visor .ant').style.visibility = visorLista.length > 1 ? '' : 'hidden';
  $('#visor .sig').style.visibility = visorLista.length > 1 ? '' : 'hidden';
}
function moverVisor(d){ visorIdx = (visorIdx + d + visorLista.length) % visorLista.length; pintarVisor(); }
function cerrarVisor(){ $('#visor').classList.add('oculto'); $('#visor img').src = ''; }
$('#visor .cerrar').addEventListener('click', cerrarVisor);
$('#visor .ant').addEventListener('click', function(){ moverVisor(-1); });
$('#visor .sig').addEventListener('click', function(){ moverVisor(1); });
$('#visor').addEventListener('click', function(e){ if (e.target.id === 'visor') cerrarVisor(); });
document.addEventListener('keydown', function(e){
  if ($('#visor').classList.contains('oculto')) return;
  if (e.key === 'Escape') cerrarVisor(); else if (e.key === 'ArrowLeft') moverVisor(-1); else if (e.key === 'ArrowRight') moverVisor(1);
});

iniciar();
