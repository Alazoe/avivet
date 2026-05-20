const API = "http://localhost:5050";
const COLORES = ["#C0392B", "#1E6091", "#5A6B31"];
const COLORES_RUTA = ["#C0392B", "#1E6091", "#5A6B31"];
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const DIA_COLOR = {
  Lunes: "var(--rojo)", Martes: "var(--azul)",
  "Miércoles": "var(--amarillo)", Jueves: "var(--rojo)", Viernes: "var(--gris)"
};

let map, allProductores = [], vehiculos = [], altas = [], seleccionados = new Set();
let markers = {}, rutaLayers = [];
let fechaSemanaActual = "";

// ── UI helpers ────────────────────────────────────────────────────────────────

function switchTab(id, btn) {
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("activo"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("activo"));
  document.getElementById("tab-" + id).classList.add("activo");
  btn.classList.add("activo");
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
  document.body.style.overflow = "";
}

function closeModalOutside(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}

// ── Init ──────────────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", async () => {
  initMap();
  await cargarDatos();
  irSemanaActual();
});

function initMap() {
  map = L.map("map").setView([-34.2, -70.9], 9);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);
}

async function cargarDatos() {
  const data = await fetch(`${API}/api/semana_actual`).then(r => r.json());
  allProductores = data.todos;
  vehiculos = data.vehiculos;
  altas = data.altas;

  const lunes = new Date(data.lunes_fecha + "T12:00:00");
  const jueves = new Date(lunes); jueves.setDate(lunes.getDate() + 3);
  document.getElementById("semana-label").textContent =
    `Semana ${fmt(lunes)} – ${fmt(jueves)}`;

  renderAltas();
  renderProductores();
  renderVehiculos();
  renderTablaProductores();
  renderMarcadores();
}

function fmt(d) {
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" });
}

// ── Panel ALTA ────────────────────────────────────────────────────────────────

function renderAltas() {
  const el = document.getElementById("lista-altas");
  document.getElementById("badge-altas").textContent = altas.length;
  el.innerHTML = altas.map(p =>
    `<div class="prod-item">
      <span class="badge badge-alta">ALTA</span>
      <span class="prod-nombre">${p.nombre}</span>
      <span class="prod-comuna">${p.comuna}</span>
    </div>`
  ).join("");
}

// ── Panel Productores semana ───────────────────────────────────────────────────

function renderProductores(filtro = "") {
  const el = document.getElementById("lista-productores");
  const lista = allProductores.filter(p =>
    p.prioridad !== "ALTA" &&
    p.nombre.toLowerCase().includes(filtro.toLowerCase())
  );
  el.innerHTML = lista.map(p => {
    const sel = seleccionados.has(p.id);
    return `<div class="prod-item ${sel ? "selected" : ""}" onclick="toggleSeleccion(${p.id})">
      <input type="checkbox" ${sel ? "checked" : ""} onclick="event.stopPropagation()" onchange="toggleSeleccion(${p.id})" />
      <span class="badge badge-${p.prioridad.toLowerCase()}">${p.prioridad}</span>
      <span class="prod-nombre">${p.nombre}</span>
      <span class="prod-comuna">${p.comuna}</span>
    </div>`;
  }).join("");
  document.getElementById("badge-seleccionados").textContent = `${seleccionados.size} selec.`;
}

function toggleSeleccion(id) {
  if (seleccionados.has(id)) seleccionados.delete(id);
  else seleccionados.add(id);
  renderProductores(document.getElementById("filtro-prod").value);
  actualizarMarcadores();
}

function filtrarProductores() {
  renderProductores(document.getElementById("filtro-prod").value);
}

// ── Vehículos ─────────────────────────────────────────────────────────────────

let vehiculosSeleccionados = new Set();

function renderVehiculos() {
  vehiculosSeleccionados = new Set(vehiculos.map(v => v.id));
  const el = document.getElementById("lista-vehiculos");
  el.innerHTML = vehiculos.map((v, i) =>
    `<div class="veh-item">
      <input type="checkbox" id="veh-${v.id}" checked onchange="toggleVehiculo(${v.id})" />
      <div class="veh-dot" style="background:${COLORES[i]}"></div>
      <label for="veh-${v.id}" style="cursor:pointer;flex:1">
        ${v.nombre} <span style="color:var(--gris);font-size:11px">(${(v.capacidad_kg/1000).toFixed(0)} T)</span>
      </label>
    </div>`
  ).join("");
}

function toggleVehiculo(id) {
  if (vehiculosSeleccionados.has(id)) vehiculosSeleccionados.delete(id);
  else vehiculosSeleccionados.add(id);
}

// ── Mapa ──────────────────────────────────────────────────────────────────────

function iconColor(prioridad, seleccionado) {
  if (prioridad === "ALTA") return "#C0392B";
  if (seleccionado) return "#1E6091";
  return "#9CA3AF";
}

function makeIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

function renderMarcadores() {
  L.marker([-34.47776, -70.98126], {
    icon: L.divIcon({
      className: "",
      html: `<div style="width:18px;height:18px;border-radius:3px;background:#3B4A20;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.5)"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9]
    })
  }).addTo(map).bindPopup("<b>🏠 La Campestre (Base)</b>");

  allProductores.forEach(p => {
    const m = L.marker([p.latitud, p.longitud], {
      icon: makeIcon(iconColor(p.prioridad, seleccionados.has(p.id)))
    }).addTo(map);
    m.bindPopup(`<b>${p.nombre}</b><br>${p.comuna}<br>
      <span style="background:${iconColor(p.prioridad, seleccionados.has(p.id))};color:#fff;padding:1px 7px;border-radius:10px;font-size:11px">${p.prioridad}</span>`);
    markers[p.id] = m;
  });
}

function actualizarMarcadores() {
  allProductores.forEach(p => {
    if (markers[p.id]) {
      markers[p.id].setIcon(makeIcon(iconColor(p.prioridad, seleccionados.has(p.id))));
    }
  });
}

function limpiarRutas() {
  rutaLayers.forEach(l => map.removeLayer(l));
  rutaLayers = [];
}

function dibujarRuta(paradas, color, base) {
  const puntos = [
    [base.latitud, base.longitud],
    ...paradas.map(p => [p.latitud, p.longitud]),
    [base.latitud, base.longitud]
  ];
  const poly = L.polyline(puntos, { color, weight: 3, opacity: 0.8 }).addTo(map);
  rutaLayers.push(poly);

  paradas.forEach((p, i) => {
    const num = L.divIcon({
      className: "",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};color:white;text-align:center;line-height:20px;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)">${i + 1}</div>`,
      iconSize: [20, 20], iconAnchor: [10, 10]
    });
    const m = L.marker([p.latitud, p.longitud], { icon: num }).addTo(map);
    m.bindPopup(`<b>${i + 1}. ${p.nombre}</b><br>${p.comuna}`);
    rutaLayers.push(m);
  });
}

// ── Generar rutas ALTA (Lunes / Jueves) ──────────────────────────────────────

async function generarRuta(dia) {
  limpiarRutas();
  const ids = altas.map(p => p.id);
  const vIds = Array.from(vehiculosSeleccionados);

  const res = await fetch(`${API}/api/optimizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productor_ids: ids, vehiculo_ids: vIds, dia })
  }).then(r => r.json());

  mostrarResultado(res, dia);
  const base = { latitud: -34.47776, longitud: -70.98126 };
  res.forEach((ruta, i) => dibujarRuta(ruta.paradas, COLORES_RUTA[i % COLORES_RUTA.length], base));
  map.fitBounds([[-34.65, -71.25], [-34.2, -70.5]]);
}

// ── Optimizar rutas semanales ─────────────────────────────────────────────────

async function optimizarRutas() {
  limpiarRutas();
  const ids = [...altas.map(p => p.id), ...Array.from(seleccionados)];
  const vIds = Array.from(vehiculosSeleccionados);

  if (ids.length === 0) {
    alert("Selecciona al menos un productor para la semana.");
    return;
  }

  const res = await fetch(`${API}/api/optimizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productor_ids: ids, vehiculo_ids: vIds, dia: "Semana" })
  }).then(r => r.json());

  mostrarResultado(res, "Rutas de la semana");
  const base = { latitud: -34.47776, longitud: -70.98126 };
  res.forEach((ruta, i) => dibujarRuta(ruta.paradas, COLORES_RUTA[i % COLORES_RUTA.length], base));
  map.fitBounds(rutaLayers.length ? map.getBounds() : [[-35, -72], [-33, -70]]);
}

// ── Mostrar resultado rutas ───────────────────────────────────────────────────

function mostrarResultado(rutas, titulo) {
  const el = document.getElementById("resultado-rutas");
  if (!rutas.length) {
    el.innerHTML = `<div class="alerta-warn">No se pudo generar ruta.</div>`;
    return;
  }
  el.innerHTML = `<div class="seccion-titulo">${titulo}</div>` + rutas.map((ruta, i) =>
    `<div class="ruta-card v${i}">
      <div class="ruta-header">
        <span style="color:${COLORES[i]}">🚚 ${ruta.vehiculo.nombre}</span>
        <span class="badge badge-num">${ruta.distancia_km} km</span>
        <span class="tag">${ruta.paradas.length} paradas</span>
      </div>
      <div class="ruta-body">
        <ol>
          ${ruta.paradas.map(p => `<li><b>${p.nombre}</b> — ${p.comuna}</li>`).join("")}
        </ol>
      </div>
    </div>`
  ).join("");
}

// ── Tabla productores ─────────────────────────────────────────────────────────

function renderTablaProductores(filtro = "") {
  const el = document.getElementById("tabla-productores");
  const lista = allProductores.filter(p =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.comuna.toLowerCase().includes(filtro.toLowerCase())
  );
  el.innerHTML = `<table class="tabla-prod">
    <thead><tr><th>#</th><th>Nombre</th><th>Comuna</th><th>Prioridad</th><th></th></tr></thead>
    <tbody>
      ${lista.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.nombre}</td>
          <td>${p.comuna}</td>
          <td><span class="badge badge-${p.prioridad.toLowerCase()}">${p.prioridad}</span></td>
          <td><button class="btn-icon" onclick="editarProductor(${p.id})">✏️</button></td>
        </tr>`
      ).join("")}
    </tbody>
  </table>`;
}

function filtrarTodos() {
  renderTablaProductores(document.getElementById("filtro-all").value);
}

// ── Plan Semanal ──────────────────────────────────────────────────────────────

function lunesToDate(offset = 0) {
  const today = new Date();
  const day = today.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const lunes = new Date(today);
  lunes.setDate(today.getDate() + diff + offset * 7);
  return lunes.toISOString().split("T")[0];
}

function irSemanaActual() {
  const lunes = lunesToDate(0);
  document.getElementById("fecha-semana").value = lunes;
  cargarPlan();
}

async function cargarPlan() {
  const fecha = document.getElementById("fecha-semana").value;
  if (!fecha) return;
  fechaSemanaActual = fecha;

  const [planData, resumen] = await Promise.all([
    fetch(`${API}/api/plan?semana=${fecha}`).then(r => r.json()),
    fetch(`${API}/api/plan/resumen?semana=${fecha}`).then(r => r.json())
  ]);

  renderResumen(resumen, fecha);
  renderPlanPorDia(planData.dias, fecha);
}

function renderResumen(resumen, fecha) {
  const d = new Date(fecha + "T12:00:00");
  const jueves = new Date(d); jueves.setDate(d.getDate() + 3);
  const titulo = `Semana del ${fmt(d)} al ${fmt(jueves)}`;

  const totalCajas = resumen.reduce((s, r) => s + (r.total_cajas || 0), 0);
  const totalDespKg = resumen.reduce((s, r) => s + (r.total_despacho_kg || 0), 0);
  const totalProd = resumen.reduce((s, r) => s + (r.num_productores || 0), 0);

  document.getElementById("resumen-semana").innerHTML = `
    <div class="resumen-card">
      <div class="resumen-titulo">${titulo}</div>
      <div class="resumen-kpis">
        <span class="kpi">📦 <b>${totalCajas}</b> cajas</span>
        <span class="kpi">🌾 <b>${totalDespKg} kg</b> alimento</span>
        <span class="kpi">🏠 <b>${totalProd}</b> visitas</span>
      </div>
    </div>`;
}

function renderPlanPorDia(dias, fecha) {
  const el = document.getElementById("plan-por-dia");
  el.innerHTML = DIAS.map(dia => {
    const entradas = dias[dia] || [];
    const totalCajas = entradas.reduce((s, e) => s + (e.retiro_cajas || 0), 0);
    const totalDesp = entradas.reduce((s, e) => s + (e.despacho_kg || 0), 0);
    const esFijo = dia === "Lunes" || dia === "Jueves";

    const filas = entradas.map(e => {
      const prio = e.prioridad === "ALTA" ? "alta" : e.prioridad === "MEDIA" ? "media" : "baja";
      return `
      <tr class="${e.completado ? "completada" : ""}">
        <td>
          <span class="badge badge-${prio}">${e.prioridad}</span>
          ${e.completado ? '<span class="badge badge-ok" style="margin-left:3px">✓</span>' : ""}
        </td>
        <td><b>${e.productor_nombre}</b><br><span style="font-size:11px;color:var(--gris)">${e.comuna}</span></td>
        <td>
          <input type="number" class="input input-sm input-num"
            value="${e.retiro_cajas || 0}" min="0"
            onchange="actualizarEntrada(${e.id}, 'retiro_cajas', this.value, ${e.despacho_kg || 0}, ${e.vehiculo_id || "null"}, ${e.completado})" />
        </td>
        <td>
          <input type="number" class="input input-sm input-num input-num-w"
            value="${e.despacho_kg || 0}" min="0" step="0.5"
            onchange="actualizarEntrada(${e.id}, 'despacho_kg', this.value, ${e.retiro_cajas || 0}, ${e.vehiculo_id || "null"}, ${e.completado})" />
        </td>
        <td>
          <select class="input input-sm" style="min-width:110px"
            onchange="actualizarEntrada(${e.id}, 'vehiculo_id', this.value, ${e.retiro_cajas || 0}, ${e.despacho_kg || 0}, ${e.completado})">
            ${vehiculos.map(v => `<option value="${v.id}" ${v.id == e.vehiculo_id ? "selected" : ""}>${v.nombre}</option>`).join("")}
          </select>
        </td>
        <td style="text-align:center">
          <input type="checkbox" ${e.completado ? "checked" : ""}
            onchange="actualizarEntrada(${e.id}, 'completado', this.checked ? 1 : 0, ${e.retiro_cajas || 0}, ${e.despacho_kg || 0}, ${e.vehiculo_id || "null"})" />
        </td>
        <td>
          <button class="btn-icon" onclick="eliminarEntrada(${e.id})">✕</button>
        </td>
      </tr>`;
    }).join("");

    return `
      <div class="card">
        <div class="dia-header${esFijo ? " fijo" : ""}">
          <div class="dia-meta">
            <span class="badge" style="background:${DIA_COLOR[dia]};color:#fff">${dia}</span>
            ${esFijo ? "⭐" : ""}
            <span class="dia-kpis">${entradas.length} productor${entradas.length !== 1 ? "es" : ""}</span>
          </div>
          <div class="dia-kpis">
            📦 ${totalCajas} &nbsp; 🌾 ${totalDesp} kg
            <button class="btn btn-primary btn-xs" onclick="abrirModalAgregar('${dia}', '${fecha}')">+ Agregar</button>
          </div>
        </div>
        <div style="padding:0">
          ${entradas.length === 0
            ? `<div class="vacio">Sin productores asignados.
                <a href="#" onclick="abrirModalAgregar('${dia}', '${fecha}'); return false">Agregar uno</a></div>`
            : `<div style="overflow-x:auto">
                <table class="tabla-plan">
                  <thead><tr>
                    <th></th><th>Productor</th>
                    <th>Cajas 📦</th><th>Alimento 🌾</th>
                    <th>Vehículo 🚚</th><th>✓</th><th></th>
                  </tr></thead>
                  <tbody>${filas}</tbody>
                </table>
              </div>`}
        </div>
      </div>`;
  }).join("");
}

async function actualizarEntrada(id, campo, valor, cajasActual, despActual, vehActual) {
  const body = {
    retiro_cajas: parseInt(cajasActual) || 0,
    despacho_kg: parseFloat(despActual) || 0,
    vehiculo_id: vehActual == "null" ? null : parseInt(vehActual),
    completado: 0,
    notas: ""
  };
  if (campo === "retiro_cajas") body.retiro_cajas = parseInt(valor) || 0;
  else if (campo === "despacho_kg") body.despacho_kg = parseFloat(valor) || 0;
  else if (campo === "vehiculo_id") body.vehiculo_id = parseInt(valor);
  else if (campo === "completado") body.completado = parseInt(valor);

  await fetch(`${API}/api/plan/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const resumen = await fetch(`${API}/api/plan/resumen?semana=${fechaSemanaActual}`).then(r => r.json());
  renderResumen(resumen, fechaSemanaActual);
}

async function eliminarEntrada(id) {
  await fetch(`${API}/api/plan/${id}`, { method: "DELETE" });
  cargarPlan();
}

async function inicializarSemanaAltas() {
  const fecha = document.getElementById("fecha-semana").value || lunesToDate(0);
  await fetch(`${API}/api/plan/semana_altas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fecha_semana: fecha })
  });
  cargarPlan();
}

function abrirModalAgregar(dia, fecha) {
  document.getElementById("plan-dia").value = dia;
  document.getElementById("plan-dia-label").textContent = dia;
  document.getElementById("plan-cajas").value = 0;
  document.getElementById("plan-despacho").value = 0;
  document.getElementById("plan-notas").value = "";

  const selProd = document.getElementById("plan-productor");
  selProd.innerHTML = '<option value="">Seleccionar...</option>' +
    allProductores.map(p =>
      `<option value="${p.id}">[${p.prioridad}] ${p.nombre} — ${p.comuna}</option>`
    ).join("");

  const selVeh = document.getElementById("plan-vehiculo");
  selVeh.innerHTML = vehiculos.map(v =>
    `<option value="${v.id}">${v.nombre} (${v.capacidad_kg / 1000}T)</option>`
  ).join("");

  openModal("modal-agregar");
}

async function guardarEntradaPlan() {
  const productor_id = parseInt(document.getElementById("plan-productor").value);
  if (!productor_id) { alert("Selecciona un productor"); return; }

  const body = {
    fecha_semana: fechaSemanaActual || lunesToDate(0),
    productor_id,
    dia: document.getElementById("plan-dia").value,
    retiro_cajas: parseInt(document.getElementById("plan-cajas").value) || 0,
    despacho_kg: parseFloat(document.getElementById("plan-despacho").value) || 0,
    vehiculo_id: parseInt(document.getElementById("plan-vehiculo").value) || null,
    notas: document.getElementById("plan-notas").value
  };

  const res = await fetch(`${API}/api/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (res.status === 409) {
    alert("Este productor ya está en ese día.");
    return;
  }

  closeModal("modal-agregar");
  cargarPlan();
}

// ── Modal editar productor ────────────────────────────────────────────────────

function editarProductor(id) {
  const p = allProductores.find(x => x.id === id);
  if (!p) return;
  document.getElementById("edit-id").value = p.id;
  document.getElementById("edit-nombre").value = p.nombre;
  document.getElementById("edit-comuna").value = p.comuna;
  document.getElementById("edit-lat").value = p.latitud;
  document.getElementById("edit-lon").value = p.longitud;
  document.getElementById("edit-prioridad").value = p.prioridad;
  openModal("modal-productor");
}

async function guardarProductor() {
  const id = document.getElementById("edit-id").value;
  const data = {
    nombre: document.getElementById("edit-nombre").value,
    comuna: document.getElementById("edit-comuna").value,
    latitud: parseFloat(document.getElementById("edit-lat").value),
    longitud: parseFloat(document.getElementById("edit-lon").value),
    prioridad: document.getElementById("edit-prioridad").value
  };
  await fetch(`${API}/api/productores/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  closeModal("modal-productor");
  await cargarDatos();
}
