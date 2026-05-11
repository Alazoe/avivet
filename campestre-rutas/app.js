// ── Configuración ─────────────────────────────────────────────────────────────
// Reemplaza con la URL de tu Apps Script desplegado
const GAS_URL = "https://script.google.com/macros/s/AKfycbyn1Ac4QWN7IL8GIKmINLMO9qGWk4SPvC6F1Cby2-bi4vdycpMBAPmNAbL_nM0BTHmFmQ/exec";

// ── Constantes ────────────────────────────────────────────────────────────────
const BASE = { lat: -34.47776, lon: -70.98126 };
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const DIA_COLOR = { Lunes: "danger", Martes: "primary", "Miércoles": "warning", Jueves: "danger", Viernes: "secondary" };
const COLORES = ["#dc3545", "#0d6efd", "#198754"];
const COLORES_RUTA = ["red", "blue", "green"];

// ── Zonas geográficas ─────────────────────────────────────────────────────────
const ZONAS = [
  { nombre: "Zona Norte",              icono: "⬆️", test: p => p.latitud > -33.8 },
  { nombre: "Zona Centro",             icono: "🔵", test: p => p.latitud > -34.1  && p.latitud <= -33.8 },
  { nombre: "Zona Rancagua / Requínoa",icono: "🟡", test: p => p.latitud > -34.4  && p.latitud <= -34.1 },
  { nombre: "Zona San Vicente",        icono: "🔴", test: p => p.latitud > -34.6  && p.latitud <= -34.4 && p.longitud > -71.2 },
  { nombre: "Zona Pichidegua / Litueche",icono:"🟠",test: p => p.latitud > -34.6 && p.latitud <= -34.4 && p.longitud <= -71.2 },
  { nombre: "Zona Sur",                icono: "⬇️", test: p => p.latitud <= -34.6 },
];

function getZona(p) {
  return ZONAS.find(z => z.test(p)) || ZONAS[ZONAS.length - 1];
}

// ── Estado global ─────────────────────────────────────────────────────────────
let map, allProductores = [], vehiculos = [], altas = [], seleccionados = new Set();
let markers = {}, rutaLayers = [], vehiculosSeleccionados = new Set();
let fechaSemanaActual = "";
let rutaActiva = { dia: null, paradas: [] };
let altasSeleccionadas = new Set(); // permite deseleccionar productores ALTA

// ── Init ──────────────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", async () => {
  if (GAS_URL === "REEMPLAZAR_CON_URL_DE_APPS_SCRIPT") {
    document.getElementById("banner-config").classList.remove("d-none");
  }
  initMap();
  await cargarDatos();
  irSemanaActual();
});

// ── API (Google Apps Script) ──────────────────────────────────────────────────

async function api(params) {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

// ── Datos maestros ────────────────────────────────────────────────────────────

async function cargarDatos() {
  const [prods, vehs] = await Promise.all([
    api({ action: "productores" }),
    api({ action: "vehiculos" })
  ]);
  allProductores = prods;
  vehiculos = vehs;
  altas = prods.filter(p => p.prioridad === "ALTA");
  altasSeleccionadas = new Set(altas.map(p => p.id));
  vehiculosSeleccionados = new Set(vehs.map(v => v.id));

  const lunes = new Date(lunesToDate() + "T12:00:00");
  const jueves = new Date(lunes); jueves.setDate(lunes.getDate() + 3);
  document.getElementById("nav-semana").textContent =
    `Semana ${fmt(lunes)} – ${fmt(jueves)}`;

  renderAltas();
  renderProductores();
  renderVehiculos();
  renderTablaProductores();
  renderMarcadores();
}

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function lunesToDate(offset = 0) {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const lunes = new Date(today);
  lunes.setDate(today.getDate() + diff + offset * 7);
  return lunes.toISOString().split("T")[0];
}

function fmt(d) {
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" });
}

function irSemanaActual() {
  const lunes = lunesToDate(0);
  document.getElementById("fecha-semana").value = lunes;
  cargarPlan();
}

// ── Plan semanal ──────────────────────────────────────────────────────────────

async function cargarPlan() {
  const fecha = document.getElementById("fecha-semana").value;
  if (!fecha) return;
  fechaSemanaActual = fecha;

  const [planData, resumen] = await Promise.all([
    api({ action: "plan", semana: fecha }),
    api({ action: "resumen", semana: fecha })
  ]);
  renderResumen(resumen, fecha);
  renderPlanPorDia(planData.dias, fecha);
}

function renderResumen(resumen, fecha) {
  const d = new Date(fecha + "T12:00:00");
  const ju = new Date(d); ju.setDate(d.getDate() + 3);
  const totalCajas = resumen.reduce((s, r) => s + (r.total_cajas || 0), 0);
  const totalKg    = resumen.reduce((s, r) => s + (r.total_despacho_kg || 0), 0);
  const totalProd  = resumen.reduce((s, r) => s + (r.num_productores || 0), 0);
  document.getElementById("resumen-semana").innerHTML = `
    <div class="card bg-light">
      <div class="card-body py-2 px-3">
        <div class="fw-bold small mb-1">Semana del ${fmt(d)} al ${fmt(ju)}</div>
        <div class="d-flex gap-3 small text-muted">
          <span>📦 <b>${totalCajas}</b> cajas</span>
          <span>🌾 <b>${totalKg} kg</b></span>
          <span>🏠 <b>${totalProd}</b> visitas</span>
        </div>
      </div>
    </div>`;
}

function renderPlanPorDia(dias, fecha) {
  const el = document.getElementById("plan-por-dia");
  el.innerHTML = DIAS.map(dia => {
    const entradas = dias[dia] || [];
    const tCajas = entradas.reduce((s, e) => s + (e.retiro_cajas || 0), 0);
    const tDesp  = entradas.reduce((s, e) => s + (e.despacho_kg || 0), 0);
    const esFixo = dia === "Lunes" || dia === "Jueves";

    const filas = entradas.map(e => `
      <tr class="${e.completado ? "table-success" : ""}">
        <td><span class="badge bg-${e.prioridad === "ALTA" ? "danger" : e.prioridad === "MEDIA" ? "primary" : "secondary"}">${e.prioridad}</span></td>
        <td><b>${e.productor_nombre}</b><br><small class="text-muted">${e.comuna}</small></td>
        <td>
          <input type="number" class="form-control form-control-sm" style="width:68px" value="${e.retiro_cajas || 0}" min="0"
            onchange="actualizarEntrada('${e.id}','retiro_cajas',this.value,'${e.despacho_kg||0}','${e.vehiculo_id||''}','${e.completado}')" />
        </td>
        <td>
          <input type="number" class="form-control form-control-sm" style="width:75px" value="${e.despacho_kg || 0}" min="0" step="0.5"
            onchange="actualizarEntrada('${e.id}','despacho_kg','${e.retiro_cajas||0}',this.value,'${e.vehiculo_id||''}','${e.completado}')" />
        </td>
        <td>
          <select class="form-select form-select-sm" style="min-width:110px"
            onchange="actualizarEntrada('${e.id}','vehiculo_id','${e.retiro_cajas||0}','${e.despacho_kg||0}',this.value,'${e.completado}')">
            ${vehiculos.map(v => `<option value="${v.id}" ${String(v.id)===String(e.vehiculo_id)?"selected":""}>${v.nombre}</option>`).join("")}
          </select>
        </td>
        <td class="text-center">
          <input type="checkbox" class="form-check-input" ${e.completado ? "checked" : ""}
            onchange="actualizarEntrada('${e.id}','completado','${e.retiro_cajas||0}','${e.despacho_kg||0}','${e.vehiculo_id||''}',this.checked?1:0)" />
        </td>
        <td>
          <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="eliminarEntrada('${e.id}')">✕</button>
        </td>
      </tr>`).join("");

    return `
      <div class="card mb-2">
        <div class="card-header py-1 d-flex justify-content-between align-items-center ${esFixo ? "bg-danger bg-opacity-10" : ""}">
          <span class="fw-bold small">
            <span class="badge bg-${DIA_COLOR[dia]}">${dia}</span>
            ${esFixo ? "⭐" : ""}
            <span class="text-muted ms-1">${entradas.length} productor${entradas.length !== 1 ? "es" : ""}</span>
          </span>
          <span class="small text-muted">
            📦 ${tCajas} &nbsp; 🌾 ${tDesp}kg
            <button class="btn btn-sm btn-outline-success py-0 px-1 ms-1" onclick="abrirModalAgregar('${dia}','${fecha}')">+ Agregar</button>
          </span>
        </div>
        <div class="card-body p-0">
          ${entradas.length === 0
            ? `<div class="text-muted small p-2">Sin productores. <a href="#" onclick="abrirModalAgregar('${dia}','${fecha}');return false">Agregar</a></div>`
            : `<div class="table-responsive">
                <table class="table table-sm table-hover mb-0 small">
                  <thead><tr><th></th><th>Productor</th><th>Cajas</th><th>Alimento</th><th>Vehículo</th><th>✓</th><th></th></tr></thead>
                  <tbody>${filas}</tbody>
                </table>
              </div>`}
        </div>
      </div>`;
  }).join("");
}

async function actualizarEntrada(id, campo, cajas, desp, vid, comp) {
  const params = {
    action: "updatePlan", id,
    retiro_cajas: campo === "retiro_cajas" ? cajas : cajas,
    despacho_kg:  campo === "despacho_kg"  ? desp  : desp,
    vehiculo_id:  campo === "vehiculo_id"  ? vid   : vid,
    completado:   campo === "completado"   ? comp  : comp,
    notas: ""
  };
  // override the changed field
  if (campo === "retiro_cajas") params.retiro_cajas = cajas;
  if (campo === "despacho_kg")  params.despacho_kg  = desp;
  if (campo === "vehiculo_id")  params.vehiculo_id  = vid;
  if (campo === "completado")   params.completado   = comp;

  await api(params);
  const resumen = await api({ action: "resumen", semana: fechaSemanaActual });
  renderResumen(resumen, fechaSemanaActual);
}

async function eliminarEntrada(id) {
  await api({ action: "deletePlan", id });
  cargarPlan();
}

async function inicializarAltas() {
  const fecha = document.getElementById("fecha-semana").value || lunesToDate();
  const r = await api({ action: "inicializarAltas", semana: fecha });
  alert(`Se agregaron ${r.creados} entradas de productores ALTA para Lunes y Jueves.`);
  cargarPlan();
}

function abrirModalAgregar(dia, fecha) {
  document.getElementById("plan-dia").value = dia;
  document.getElementById("plan-dia-label").textContent = dia;
  document.getElementById("plan-cajas").value = 0;
  document.getElementById("plan-despacho").value = 0;
  document.getElementById("plan-notas").value = "";

  document.getElementById("plan-productor").innerHTML =
    '<option value="">Seleccionar...</option>' +
    allProductores.map(p =>
      `<option value="${p.id}">[${p.prioridad}] ${p.nombre} — ${p.comuna}</option>`
    ).join("");

  document.getElementById("plan-vehiculo").innerHTML =
    vehiculos.map(v => `<option value="${v.id}">${v.nombre}</option>`).join("");

  new bootstrap.Modal(document.getElementById("modalAgregarPlan")).show();
}

async function guardarEntradaPlan() {
  const productor_id = document.getElementById("plan-productor").value;
  if (!productor_id) { alert("Selecciona un productor"); return; }

  const r = await api({
    action:       "addPlan",
    fecha_semana: fechaSemanaActual || lunesToDate(),
    productor_id,
    dia:          document.getElementById("plan-dia").value,
    retiro_cajas: document.getElementById("plan-cajas").value,
    despacho_kg:  document.getElementById("plan-despacho").value,
    vehiculo_id:  document.getElementById("plan-vehiculo").value,
    notas:        document.getElementById("plan-notas").value
  });

  if (r.error === "duplicate") { alert("Ese productor ya está en ese día."); return; }
  bootstrap.Modal.getInstance(document.getElementById("modalAgregarPlan")).hide();
  cargarPlan();
}

// ── Mapa ──────────────────────────────────────────────────────────────────────

function initMap() {
  map = L.map("map").setView([-34.2, -70.9], 8);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);
}

function makeIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:13px;height:13px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    iconSize: [13, 13], iconAnchor: [6, 6]
  });
}

function iconColor(p) {
  if (p.prioridad === "ALTA") return "red";
  if (seleccionados.has(p.id)) return "blue";
  return "#888";
}

function renderMarcadores() {
  L.marker([BASE.lat, BASE.lon], {
    icon: L.divIcon({
      className: "",
      html: `<div style="width:18px;height:18px;border-radius:3px;background:#198754;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.5)"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9]
    })
  }).addTo(map).bindPopup("<b>🏠 La Campestre (Base)</b>");

  allProductores.forEach(p => {
    const m = L.marker([p.latitud, p.longitud], { icon: makeIcon(iconColor(p)) }).addTo(map);
    m.bindPopup(`<b>${p.nombre}</b><br>${p.comuna}<br><span class="badge" style="background:${iconColor(p)};color:white">${p.prioridad}</span>`);
    markers[p.id] = m;
  });
}

function actualizarMarcadores() {
  allProductores.forEach(p => markers[p.id]?.setIcon(makeIcon(iconColor(p))));
}

function limpiarRutas() {
  rutaLayers.forEach(l => map.removeLayer(l));
  rutaLayers = [];
}

function dibujarRuta(paradas, color) {
  const pts = [[BASE.lat, BASE.lon], ...paradas.map(p => [p.latitud, p.longitud]), [BASE.lat, BASE.lon]];
  rutaLayers.push(L.polyline(pts, { color, weight: 3, opacity: 0.8 }).addTo(map));
  paradas.forEach((p, i) => {
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};color:white;text-align:center;line-height:20px;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)">${i+1}</div>`,
      iconSize: [20,20], iconAnchor: [10,10]
    });
    const m = L.marker([p.latitud, p.longitud], { icon }).addTo(map);
    m.bindPopup(`<b>${i+1}. ${p.nombre}</b><br>${p.comuna}`);
    rutaLayers.push(m);
  });
}

// ── Optimización de rutas (cliente — Nearest Neighbor + 2-opt) ────────────────

function haversine(a, b) {
  const R = 6371, toRad = x => x * Math.PI / 180;
  const dlat = toRad(b.latitud - a.latitud), dlon = toRad(b.longitud - a.longitud);
  const x = Math.sin(dlat/2)**2 + Math.cos(toRad(a.latitud))*Math.cos(toRad(b.latitud))*Math.sin(dlon/2)**2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

function distBase(p) { return haversine({ latitud: BASE.lat, longitud: BASE.lon }, p); }

function nearestNeighbor(prods) {
  if (!prods.length) return [];
  const visited = new Set(), route = [];
  let current = { latitud: BASE.lat, longitud: BASE.lon };
  while (visited.size < prods.length) {
    let best = null, bestDist = Infinity;
    prods.forEach((p, i) => {
      if (!visited.has(i)) {
        const d = haversine(current, p);
        if (d < bestDist) { bestDist = d; best = i; }
      }
    });
    visited.add(best);
    route.push(best);
    current = prods[best];
  }
  return route;
}

function routeDist(prods, route) {
  let d = distBase(prods[route[0]]);
  for (let i = 0; i < route.length - 1; i++) d += haversine(prods[route[i]], prods[route[i+1]]);
  d += distBase(prods[route[route.length - 1]]);
  return d;
}

function twoOpt(prods, route) {
  let improved = true, best = [...route];
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = [...best.slice(0, i), ...best.slice(i, j+1).reverse(), ...best.slice(j+1)];
        if (routeDist(prods, candidate) < routeDist(prods, best)) { best = candidate; improved = true; }
      }
    }
  }
  return best;
}

function optimizarCliente(prods, vehiculosList) {
  if (!prods.length || !vehiculosList.length) return [];

  // Dividir productores entre vehículos por clustering geográfico simple
  const n = vehiculosList.length;
  const lats = prods.map(p => p.latitud).sort((a,b)=>a-b);
  const midLat = lats[Math.floor(lats.length / 2)];

  let grupos;
  if (n === 1) {
    grupos = [prods];
  } else if (n === 2) {
    grupos = [prods.filter(p => p.latitud >= midLat), prods.filter(p => p.latitud < midLat)];
  } else {
    const lons = prods.map(p => p.longitud).sort((a,b)=>a-b);
    const midLon = lons[Math.floor(lons.length / 2)];
    grupos = [
      prods.filter(p => p.latitud >= midLat && p.longitud >= midLon),
      prods.filter(p => p.latitud >= midLat && p.longitud < midLon),
      prods.filter(p => p.latitud < midLat)
    ];
  }

  return grupos.map((grupo, i) => {
    if (!grupo.length) return null;
    const idxRoute = nearestNeighbor(grupo);
    const optimized = twoOpt(grupo, idxRoute);
    const paradas = optimized.map(idx => grupo[idx]);
    const dist = routeDist(grupo, optimized);
    return { vehiculo: vehiculosList[i], paradas, distancia_km: Math.round(dist * 10) / 10 };
  }).filter(Boolean);
}

// ── Panel Rutas ───────────────────────────────────────────────────────────────

function renderAltas() {
  const sel = altasSeleccionadas.size;
  document.getElementById("badge-altas").textContent = `${sel}/${altas.length}`;
  document.getElementById("lista-altas").innerHTML = altas.map(p => {
    const checked = altasSeleccionadas.has(p.id);
    return `<div class="productor-item ${checked ? "selected" : ""}" onclick="toggleAlta(${p.id})">
      <input type="checkbox" class="me-1" ${checked ? "checked" : ""} />
      <span class="badge badge-alta me-1">ALTA</span>
      ${p.nombre} <span class="text-muted">— ${p.comuna}</span>
    </div>`;
  }).join("");
}

function toggleAlta(id) {
  altasSeleccionadas.has(id) ? altasSeleccionadas.delete(id) : altasSeleccionadas.add(id);
  renderAltas();
  actualizarMarcadores();
}

function renderProductores(filtro = "") {
  const f = filtro.toLowerCase();
  const candidatos = allProductores.filter(p =>
    p.prioridad !== "ALTA" &&
    (p.nombre.toLowerCase().includes(f) || p.comuna.toLowerCase().includes(f))
  );

  // Agrupar por zona
  const grupos = ZONAS.map(z => ({
    ...z,
    items: candidatos.filter(p => z.test(p))
  })).filter(g => g.items.length > 0);

  document.getElementById("lista-productores").innerHTML = grupos.map(g => `
    <div class="zona-header">${g.icono} ${g.nombre} <span class="text-muted">(${g.items.length})</span></div>
    ${g.items.map(p => {
      const sel = seleccionados.has(p.id);
      return `<div class="productor-item ${sel ? "selected" : ""}" onclick="toggleSeleccion(${p.id})">
        <input type="checkbox" class="me-1" ${sel ? "checked" : ""} />
        <span class="badge badge-${p.prioridad.toLowerCase()} me-1">${p.prioridad}</span>
        ${p.nombre} <span class="text-muted">— ${p.comuna}</span>
      </div>`;
    }).join("")}
  `).join("");

  document.getElementById("badge-sel").textContent = `${seleccionados.size} sel.`;
}

function toggleSeleccion(id) {
  seleccionados.has(id) ? seleccionados.delete(id) : seleccionados.add(id);
  renderProductores(document.getElementById("filtro-prod").value);
  actualizarMarcadores();
}

function filtrarProductores() { renderProductores(document.getElementById("filtro-prod").value); }

function renderVehiculos() {
  document.getElementById("lista-vehiculos").innerHTML = vehiculos.map((v, i) =>
    `<div class="form-check">
      <input class="form-check-input" type="checkbox" id="veh-${v.id}" checked onchange="toggleVehiculo(${v.id})" />
      <label class="form-check-label small" for="veh-${v.id}">
        <span style="color:${COLORES[i]};font-weight:bold">●</span>
        ${v.nombre} <span class="text-muted">(${v.capacidad_kg/1000}T)</span>
      </label>
    </div>`
  ).join("");
}

function toggleVehiculo(id) {
  vehiculosSeleccionados.has(id) ? vehiculosSeleccionados.delete(id) : vehiculosSeleccionados.add(id);
}

// ── Lógica de inserción (costo de agregar un productor a una ruta existente) ──

function insertionCost(rutaParadas, candidato) {
  const puntos = [{ latitud: BASE.lat, longitud: BASE.lon }, ...rutaParadas, { latitud: BASE.lat, longitud: BASE.lon }];
  let min = Infinity;
  for (let i = 0; i < puntos.length - 1; i++) {
    const costo = haversine(puntos[i], candidato) + haversine(candidato, puntos[i + 1]) - haversine(puntos[i], puntos[i + 1]);
    if (costo < min) min = costo;
  }
  return min;
}

function calcularSugerencias(rutaParadas) {
  const idsEnRuta = new Set(rutaParadas.map(p => String(p.id)));
  return allProductores
    .filter(p => !idsEnRuta.has(String(p.id)))
    .map(p => ({ ...p, costo_km: Math.round(insertionCost(rutaParadas, p) * 10) / 10 }))
    .sort((a, b) => a.costo_km - b.costo_km)
    .slice(0, 10);
}

// ── Tiempo estimado ───────────────────────────────────────────────────────────

const VEL_PROMEDIO_KMH = 60; // velocidad promedio en rutas rurales Chile

function tiempoViaje(distancia_km, numParadas) {
  const minParada = parseInt(document.getElementById("min-parada")?.value || 20);
  const minRuta = (distancia_km / VEL_PROMEDIO_KMH) * 60;
  const total = Math.round(minRuta + numParadas * minParada);
  return total >= 60
    ? `${Math.floor(total / 60)}h ${total % 60}min`
    : `${total} min`;
}

function tiempoCosto(kmExtra, numParadasActual) {
  const minParada = parseInt(document.getElementById("min-parada")?.value || 20);
  const minExtra = Math.round((kmExtra / VEL_PROMEDIO_KMH) * 60) + minParada;
  return minExtra >= 60
    ? `+${Math.floor(minExtra / 60)}h ${minExtra % 60}min`
    : `+${minExtra} min`;
}

// ── Rutas de retiro ALTA (Chevrolet Partner) ──────────────────────────────────

function generarRuta() {
  const dia = document.getElementById("dia-retiro").value;
  const partner = vehiculos.find(v => v.nombre.toLowerCase().includes("partner")) || vehiculos[vehiculos.length - 1];
  const altasFiltradas = altas.filter(p => altasSeleccionadas.has(p.id));
  if (!altasFiltradas.length) { alert("Selecciona al menos un productor ALTA."); return; }
  rutaActiva = { dia, paradas: [...altasFiltradas] };
  _dibujarRutaActiva(partner);
}

function agregarSugerido(prodId) {
  const prod = allProductores.find(p => String(p.id) === String(prodId));
  if (!prod) return;
  rutaActiva.paradas.push(prod);
  const partner = vehiculos.find(v => v.nombre.toLowerCase().includes("partner")) || vehiculos[vehiculos.length - 1];
  _dibujarRutaActiva(partner);
}

function quitarDeRuta(prodId) {
  rutaActiva.paradas = rutaActiva.paradas.filter(p => String(p.id) !== String(prodId));
  const partner = vehiculos.find(v => v.nombre.toLowerCase().includes("partner")) || vehiculos[vehiculos.length - 1];
  _dibujarRutaActiva(partner);
}

function _dibujarRutaActiva(vehiculo) {
  limpiarRutas();
  const rutas = optimizarCliente(rutaActiva.paradas, [vehiculo]);
  const rutaOrdenada = rutas[0]?.paradas || rutaActiva.paradas;
  _renderRutaRetiro(rutas, rutaActiva.dia);
  rutas.forEach((r, i) => dibujarRuta(r.paradas, COLORES_RUTA[i % COLORES_RUTA.length]));
  const sugerencias = calcularSugerencias(rutaOrdenada);
  _renderSugerencias(sugerencias, rutas[0]);
}

function _renderRutaRetiro(rutas, dia) {
  const r = rutas[0];
  if (!r) return;
  const extras = r.paradas.filter(p => p.prioridad !== "ALTA").length;
  const tiempo = tiempoViaje(r.distancia_km, r.paradas.length);

  document.getElementById("resultado-rutas").innerHTML = `
    <div class="card ruta-card v0 mb-2">
      <div class="card-header py-2">
        <div class="d-flex justify-content-between align-items-center">
          <span class="fw-bold" style="color:${COLORES[0]}">🚚 ${r.vehiculo.nombre} — ${dia}</span>
          <span>
            <span class="badge bg-secondary">${r.distancia_km} km</span>
            <span class="badge bg-success ms-1">⏱ ${tiempo}</span>
          </span>
        </div>
        <div class="small text-muted mt-1">
          ${r.paradas.length} paradas · ${r.paradas.filter(p=>p.prioridad==="ALTA").length} obligatorias
          ${extras ? ` · <span class="text-primary">${extras} adicionales</span>` : ""}
        </div>
      </div>
      <div class="card-body p-0">
        <table class="table table-sm mb-0 small">
          <tbody>
            ${r.paradas.map((p, i) => `
              <tr>
                <td class="text-muted ps-2" style="width:24px">${i + 1}</td>
                <td><b>${p.nombre}</b><br><span class="text-muted" style="font-size:11px">${p.comuna}</span></td>
                <td class="text-end pe-2">
                  <span class="badge ${p.prioridad === "ALTA" ? "bg-danger" : "bg-primary"}">${p.prioridad}</span>
                  ${p.prioridad !== "ALTA"
                    ? `<button class="btn btn-sm btn-outline-secondary py-0 px-1 ms-1" style="font-size:10px" onclick="quitarDeRuta(${p.id})">✕</button>`
                    : ""}
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div id="panel-sugerencias"></div>`;
}

function _renderSugerencias(sugerencias, ruta) {
  const el = document.getElementById("panel-sugerencias");
  if (!sugerencias.length || !el) return;
  const distBase = ruta?.distancia_km || 0;

  el.innerHTML = `
    <div class="card border-primary mb-2">
      <div class="card-header py-1 bg-primary bg-opacity-10 d-flex justify-content-between align-items-center">
        <span class="fw-bold small">💡 ¿A quién más visitar?</span>
        <span class="text-muted small">ordenado por menor desvío</span>
      </div>
      <div class="card-body p-0">
        <table class="table table-sm table-hover mb-0 small">
          <thead>
            <tr>
              <th>Productor</th>
              <th>Comuna</th>
              <th class="text-end">+ km</th>
              <th class="text-end">+ tiempo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${sugerencias.map(p => `
              <tr>
                <td><b>${p.nombre}</b></td>
                <td class="text-muted">${p.comuna}</td>
                <td class="text-end">
                  <span class="badge ${p.costo_km <= 5 ? "bg-success" : p.costo_km <= 15 ? "bg-warning text-dark" : "bg-secondary"}">
                    +${p.costo_km} km
                  </span>
                </td>
                <td class="text-end text-muted" style="font-size:11px">${tiempoCosto(p.costo_km, ruta?.paradas?.length || 5)}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary py-0 px-2" onclick="agregarSugerido(${p.id})">+ Ir</button>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ── Rutas semanales generales ─────────────────────────────────────────────────

function optimizarRutas() {
  limpiarRutas();
  const prods = [...altas, ...allProductores.filter(p => p.prioridad !== "ALTA" && seleccionados.has(p.id))];
  const vehs  = vehiculos.filter(v => vehiculosSeleccionados.has(v.id));
  if (!prods.length) { alert("Selecciona al menos un productor."); return; }
  const rutas = optimizarCliente(prods, vehs);
  document.getElementById("resultado-rutas-semana").innerHTML =
    `<h6 class="fw-bold mt-1">Rutas semanales</h6>` +
    rutas.map((r, i) =>
      `<div class="card ruta-card v${i} mb-2">
        <div class="card-body p-2">
          <div class="fw-bold" style="color:${COLORES[i]}">
            🚚 ${r.vehiculo.nombre}
            <span class="badge bg-secondary ms-1">${r.distancia_km} km</span>
            <span class="badge bg-success ms-1">⏱ ${tiempoViaje(r.distancia_km, r.paradas.length)}</span>
            <span class="badge bg-light text-dark ms-1">${r.paradas.length} paradas</span>
          </div>
          <ol class="mb-0 mt-1 ps-3 small">
            ${r.paradas.map(p => `<li><b>${p.nombre}</b> — ${p.comuna}</li>`).join("")}
          </ol>
        </div>
      </div>`
    ).join("");
  rutas.forEach((r, i) => dibujarRuta(r.paradas, COLORES_RUTA[i % COLORES_RUTA.length]));
}

// ── Tabla productores ─────────────────────────────────────────────────────────

function renderTablaProductores(filtro = "") {
  const lista = allProductores.filter(p =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.comuna.toLowerCase().includes(filtro.toLowerCase())
  );
  document.getElementById("tabla-productores").innerHTML =
    `<table class="table table-sm table-hover small">
      <thead><tr><th>#</th><th>Nombre</th><th>Comuna</th><th>Prior.</th><th></th></tr></thead>
      <tbody>${lista.map((p, i) =>
        `<tr>
          <td>${i+1}</td><td>${p.nombre}</td><td>${p.comuna}</td>
          <td><span class="badge badge-${p.prioridad.toLowerCase()}">${p.prioridad}</span></td>
          <td><button class="btn btn-sm btn-outline-secondary py-0 px-1" onclick="editarProductor(${p.id})">✏️</button></td>
        </tr>`).join("")}
      </tbody>
    </table>`;
}

function filtrarTodos() { renderTablaProductores(document.getElementById("filtro-all").value); }

function editarProductor(id) {
  const p = allProductores.find(x => x.id === id); if (!p) return;
  document.getElementById("edit-id").value = p.id;
  document.getElementById("edit-nombre").value = p.nombre;
  document.getElementById("edit-comuna").value = p.comuna;
  document.getElementById("edit-lat").value = p.latitud;
  document.getElementById("edit-lon").value = p.longitud;
  document.getElementById("edit-prioridad").value = p.prioridad;
  new bootstrap.Modal(document.getElementById("modalProductor")).show();
}

async function guardarProductor() {
  const id = document.getElementById("edit-id").value;
  await api({
    action: "updateProductor", id,
    nombre:    document.getElementById("edit-nombre").value,
    comuna:    document.getElementById("edit-comuna").value,
    latitud:   document.getElementById("edit-lat").value,
    longitud:  document.getElementById("edit-lon").value,
    prioridad: document.getElementById("edit-prioridad").value
  });
  bootstrap.Modal.getInstance(document.getElementById("modalProductor")).hide();
  await cargarDatos();
}
