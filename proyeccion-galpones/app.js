/* ============================================================
   Proyección Galpones Hy-Line Brown — configurable
   Vanilla JS, SVG puro, sin dependencias.
   Los datos se generan dinámicamente desde CONFIG + CURVA.
   ============================================================ */

// ── Utilidades ─────────────────────────────────────────────
const FORMATO_FECHA = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2,'0')}-${String(m).padStart(2,'0')}-${y}`;
};
const FORMATO_MES = (iso) => {
  const [y, m] = iso.split('-').map(Number);
  const M = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${M[m-1]} ${String(y).slice(-2)}`;
};
const NUM = (n) => Math.round(n).toLocaleString('es-CL');

function addWeeks(iso, w) {
  const d = new Date(iso); d.setDate(d.getDate() + w * 7);
  return d.toISOString().slice(0, 10);
}

// ── Constantes visuales ────────────────────────────────────
const PALETA_ESTADO = { 'no nacido': 'transparent', 'crianza': '#cfcfcf', 'postura': null, 'descartado': '#e8e5e1' };
const COLOR_TOTAL  = '#2d4a2b';
const COLOR_GRID   = '#e0ddd5';
const COLOR_TEXTO  = '#555';
const COLOR_TENUE  = '#888';
const COLOR_ACENTO = '#f0a500';
const PALETA = ['#f0a500','#4a90a4','#e05c5c','#5cae5c','#9b6bb5','#e08c3c','#5c7db5'];

// Parámetros del ciclo (Hy-Line Brown)
const CICLO   = 102; // semanas por ciclo (100 postura + 2 limpieza)
const CRIANZA = 18;  // semanas de crianza (sem 1–18)
const POSTURA = 82;  // semanas productivas (sem 19–100)
const MORT_C  = 0.002; // mortalidad semanal crianza
const MORT_P  = 0.001; // mortalidad semanal postura

// ── Estado global ──────────────────────────────────────────
let D      = null;  // datos en memoria (reconstruido en buildD)
let IDS    = [];    // ['G1','G2',...]
let COLMAP = {};    // { G1: '#f0a500', ... }
let CURVA  = {};    // { 19: { pct: 5.0, peso: 45.0 }, ... }

let CONFIG = {
  horizonte_anios: 4,
  galpones: []
};

// ── Carga inicial ──────────────────────────────────────────
async function cargar() {
  try {
    const resp = await fetch('datos.json');
    const raw  = await resp.json();

    // Extraer curva Hy-Line Brown
    raw.curva_hyline_brown.forEach(c => {
      CURVA[c.semana] = { pct: c.postura_pct, peso: c.peso_huevo_g };
    });

    // Config inicial desde primer lote de datos.json
    const g0 = raw.galpones[0];
    CONFIG.galpones = [{
      id: 'G1',
      nombre: 'Galpón 1',
      fecha_nacimiento: g0.fecha_nacimiento,
      aves: g0.aves_iniciales,
      color: PALETA[0]
    }];

    buildD();
    renderConfig();
    renderTodo();
  } catch (err) {
    console.error(err);
    document.body.innerHTML = '<div style="padding:60px;font-family:sans-serif;color:#b00">Error cargando datos.json.</div>';
  }
}

// ── Construir D desde CONFIG ───────────────────────────────
function buildD() {
  IDS    = CONFIG.galpones.map(g => g.id);
  COLMAP = Object.fromEntries(CONFIG.galpones.map(g => [g.id, g.color]));

  const proyeccion = generarProyeccion();
  const hoy = new Date().toISOString().slice(0, 10);

  D = {
    metadata: {
      fecha_generacion: hoy,
      aves_por_galpon:  CONFIG.galpones[0]?.aves || 0,
      galpones_construidos: CONFIG.galpones.length,
      horizonte: { total_semanas: proyeccion.length }
    },
    galpones: CONFIG.galpones.map(g => ({
      id:   g.id,
      nombre: g.nombre,
      fecha_nacimiento: g.fecha_nacimiento,
      color: g.color,
      aves_iniciales: g.aves,
      fecha_inicio_postura_estimada: addWeeks(g.fecha_nacimiento, CRIANZA),
      fecha_pico_estimada:           addWeeks(g.fecha_nacimiento, 28),
      fecha_descarte_estimada:       addWeeks(g.fecha_nacimiento, CRIANZA + POSTURA)
    })),
    curva_hyline_brown: Object.entries(CURVA).map(([s, v]) => ({
      semana: +s, postura_pct: v.pct, peso_huevo_g: v.peso
    })),
    proyeccion_semanal: proyeccion
  };
}

// ── Generador de proyección semanal ───────────────────────
function generarProyeccion() {
  const fechas   = CONFIG.galpones.map(g => new Date(g.fecha_nacimiento));
  const fechaMin = new Date(Math.min(...fechas));
  const fechaMax = new Date(fechaMin);
  fechaMax.setFullYear(fechaMax.getFullYear() + CONFIG.horizonte_anios);

  // Normalizar a lunes
  const dow = fechaMin.getDay();
  const lunes = new Date(fechaMin);
  if (dow !== 1) lunes.setDate(lunes.getDate() + (dow === 0 ? -6 : 1 - dow));

  const semanas = [];
  let cur = new Date(lunes);
  let semCal = 1;

  while (cur <= fechaMax) {
    const isoLunes = cur.toISOString().slice(0, 10);
    const fila = {
      semana_cal:  semCal,
      fecha_lunes: isoLunes,
      anio: cur.getFullYear(),
      mes:  cur.getMonth() + 1,
      total: { aves_en_postura: 0, huevos_dia: 0, huevos_semana: 0 }
    };

    CONFIG.galpones.forEach(g => {
      const semVida = Math.round((cur - new Date(g.fecha_nacimiento)) / (7 * 86400000));

      if (semVida < 0) {
        fila[g.id] = { sem_vida: 0, estado: 'no nacido', aves: 0, pct_postura: 0, peso_huevo_g: 0, huevos_dia: 0, huevos_semana: 0 };
        return;
      }

      const semCiclo = semVida % CICLO;
      let estado, aves = 0, pct = 0, peso = 0, huevos_dia = 0;

      if (semCiclo < CRIANZA) {
        estado = 'crianza';
        aves   = Math.round(g.aves * Math.pow(1 - MORT_C, semCiclo));
      } else if (semCiclo < CRIANZA + POSTURA) {
        estado = 'postura';
        const avesCrianzaFin = Math.round(g.aves * Math.pow(1 - MORT_C, CRIANZA));
        aves   = Math.round(avesCrianzaFin * Math.pow(1 - MORT_P, semCiclo - CRIANZA));
        pct    = CURVA[semCiclo + 1]?.pct  || 0;
        peso   = CURVA[semCiclo + 1]?.peso || 0;
        huevos_dia = Math.round(aves * pct / 100);
      } else {
        estado = 'descartado';
      }

      fila[g.id] = { sem_vida: semVida, estado, aves, pct_postura: pct, peso_huevo_g: peso, huevos_dia, huevos_semana: huevos_dia * 7 };
      if (estado === 'postura') {
        fila.total.aves_en_postura += aves;
        fila.total.huevos_dia      += huevos_dia;
        fila.total.huevos_semana   += huevos_dia * 7;
      }
    });

    semanas.push(fila);
    cur.setDate(cur.getDate() + 7);
    semCal++;
  }
  return semanas;
}

// ── Panel de configuración ─────────────────────────────────
function renderConfig() {
  const sec = document.getElementById('config-panel');
  if (!sec) return;

  const botones = [1,2,3,4,5,6,7].map(n =>
    `<button class="numb-btn${CONFIG.galpones.length === n ? ' active' : ''}" onclick="setNGalpones(${n})">${n}</button>`
  ).join('');

  const filas = CONFIG.galpones.map((g, i) => `
    <div class="config-galpon-row" style="border-left:4px solid ${g.color}">
      <div class="config-galpon-id" style="color:${g.color}">${g.id}</div>
      <label class="config-field">
        <span>Nombre</span>
        <input type="text"   class="cfg-nombre" value="${g.nombre}">
      </label>
      <label class="config-field">
        <span>Aves</span>
        <input type="number" class="cfg-aves"   min="100" max="50000" value="${g.aves}" style="width:90px">
      </label>
      <label class="config-field">
        <span>Ingreso 1er lote</span>
        <input type="date"   class="cfg-fecha"  value="${g.fecha_nacimiento}">
      </label>
    </div>`).join('');

  sec.innerHTML = `
    <div class="config-header">
      <span class="config-titulo">Configurar proyección</span>
      <button class="config-toggle" id="cfg-toggle">▼ mostrar</button>
    </div>
    <div class="config-body" id="cfg-body" style="display:none">
      <div class="config-top-row">
        <label class="config-field">
          <span>Número de galpones</span>
          <div class="numb-btns">${botones}</div>
        </label>
        <label class="config-field">
          <span>Horizonte</span>
          <div style="display:flex;align-items:center;gap:6px">
            <input type="number" id="cfg-horizonte" min="1" max="15" value="${CONFIG.horizonte_anios}" style="width:64px"> años
          </div>
        </label>
      </div>
      <div id="cfg-galpones">${filas}</div>
      <div class="config-footer">
        <button class="btn-recalcular" onclick="recalcular()">Recalcular proyección</button>
      </div>
    </div>`;

  document.getElementById('cfg-toggle').addEventListener('click', () => {
    const body = document.getElementById('cfg-body');
    const btn  = document.getElementById('cfg-toggle');
    const show = body.style.display === 'none';
    body.style.display = show ? 'block' : 'none';
    btn.textContent    = show ? '▲ ocultar' : '▼ mostrar';
  });
}

function setNGalpones(n) {
  while (CONFIG.galpones.length < n) {
    const i      = CONFIG.galpones.length;
    const prev   = CONFIG.galpones[i - 1].fecha_nacimiento;
    const stagger = Math.round(CICLO / n);
    CONFIG.galpones.push({
      id:   `G${i + 1}`,
      nombre: `Galpón ${i + 1}`,
      fecha_nacimiento: addWeeks(prev, stagger),
      aves:  CONFIG.galpones[0].aves,
      color: PALETA[i % PALETA.length]
    });
  }
  CONFIG.galpones = CONFIG.galpones.slice(0, n);
  renderConfig();
  document.getElementById('cfg-body').style.display = 'block';
  document.getElementById('cfg-toggle').textContent = '▲ ocultar';
}

function recalcular() {
  CONFIG.horizonte_anios = Math.max(1, parseInt(document.getElementById('cfg-horizonte').value) || 4);
  document.querySelectorAll('.config-galpon-row').forEach((row, i) => {
    CONFIG.galpones[i].nombre          = row.querySelector('.cfg-nombre').value.trim() || `Galpón ${i+1}`;
    CONFIG.galpones[i].aves            = Math.max(100, parseInt(row.querySelector('.cfg-aves').value) || 2000);
    CONFIG.galpones[i].fecha_nacimiento = row.querySelector('.cfg-fecha').value;
  });
  buildD();
  renderTodo();
}

function renderTodo() {
  // KPIs
  document.getElementById('fecha-hoy').textContent     = FORMATO_FECHA(D.metadata.fecha_generacion);
  document.getElementById('fecha-pie').textContent     = FORMATO_FECHA(D.metadata.fecha_generacion);
  document.getElementById('kpi-galpones').textContent  = D.metadata.galpones_construidos;
  document.getElementById('kpi-aves').textContent      = NUM(D.metadata.aves_por_galpon);
  document.getElementById('kpi-horizonte').textContent = D.metadata.horizonte.total_semanas;
  const elCiclo = document.getElementById('kpi-ciclo');
  if (elCiclo) elCiclo.textContent = CONFIG.horizonte_anios + ' años';

  // Hero bajada dinámica
  const bajada = document.getElementById('hero-bajada');
  if (bajada) {
    const g0 = CONFIG.galpones[0];
    const n  = CONFIG.galpones.length;
    bajada.textContent = `Proyección de ${n} galpón${n > 1 ? 'es' : ''} con ${NUM(g0.aves)} aves Hy-Line Brown, horizonte de ${CONFIG.horizonte_anios} años desde ${FORMATO_FECHA(g0.fecha_nacimiento)}. Ciclo de 100 semanas productivas, mortalidad ~10% acumulada.`;
  }

  pintarLotes();
  pintarCronograma();
  pintarProduccion();
  pintarTransiciones();
  pintarInfraestructura();
  pintarAnual();

  // Resetear filtros y tabla
  const selAnio = document.getElementById('filtro-anio');
  selAnio.innerHTML = '<option value="todos">Todos</option>';
  poblarFiltros();
  pintarTabla();
}

// ── Tarjetas de galpones ───────────────────────────────────
function pintarLotes() {
  const grid = document.getElementById('galpones-grid');
  grid.innerHTML = D.galpones.map(g => `
    <article class="galpon-card" style="border-top:4px solid ${COLMAP[g.id]}">
      <div class="galpon-id" style="color:${COLMAP[g.id]}">${g.id}</div>
      <h3 class="galpon-nombre">${g.nombre}</h3>
      <dl class="galpon-fechas">
        <dt>Aves iniciales</dt>              <dd>${NUM(g.aves_iniciales)}</dd>
        <dt>Ingreso 1er lote</dt>            <dd>${FORMATO_FECHA(g.fecha_nacimiento)}</dd>
        <dt>Inicio postura (sem 19)</dt>     <dd>${FORMATO_FECHA(g.fecha_inicio_postura_estimada)}</dd>
        <dt>Pico (sem 29)</dt>               <dd>${FORMATO_FECHA(g.fecha_pico_estimada)}</dd>
        <dt>Descarte 1er lote (sem 100)</dt> <dd>${FORMATO_FECHA(g.fecha_descarte_estimada)}</dd>
      </dl>
    </article>`).join('');
}

// ── Cronograma Gantt ───────────────────────────────────────
function pintarCronograma() {
  const filas = D.proyeccion_semanal;
  const n  = D.galpones.length;
  const W  = 1100, PAD_L = 60, PAD_R = 30, PAD_T = 30, PAD_B = 50;
  const H  = PAD_T + PAD_B + n * 38;
  const iW = W - PAD_L - PAD_R, iH = H - PAD_T - PAD_B;
  const barH = iH / n - 12;

  const t0 = new Date(filas[0].fecha_lunes).getTime();
  const t1 = new Date(filas[filas.length - 1].fecha_lunes).getTime();
  const xT = iso => PAD_L + ((new Date(iso).getTime() - t0) / (t1 - t0)) * iW;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

  // Marcas semestrales
  let cur = new Date(filas[0].fecha_lunes); cur.setDate(1);
  while (cur.getTime() <= t1) {
    if (cur.getMonth() % 6 === 0) {
      const iso = cur.toISOString().slice(0, 10);
      const x   = xT(iso);
      svg += `<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${H-PAD_B}" stroke="${COLOR_GRID}"/>`;
      svg += `<text x="${x}" y="${H-PAD_B+18}" text-anchor="middle" font-size="10" fill="${COLOR_TENUE}">${FORMATO_MES(iso)}</text>`;
    }
    cur.setMonth(cur.getMonth() + 1);
  }

  // Línea hoy
  const hoy = new Date().toISOString().slice(0, 10);
  if (hoy >= filas[0].fecha_lunes && hoy <= filas[filas.length-1].fecha_lunes) {
    const xH = xT(hoy);
    svg += `<line x1="${xH}" y1="${PAD_T-6}" x2="${xH}" y2="${H-PAD_B}" stroke="${COLOR_ACENTO}" stroke-width="1.5" stroke-dasharray="3,3"/>`;
    svg += `<text x="${xH}" y="${PAD_T-10}" text-anchor="middle" font-size="10" fill="${COLOR_ACENTO}" font-weight="600">hoy</text>`;
  }

  // Barras por galpón
  D.galpones.forEach((g, i) => {
    const yB  = PAD_T + i * (iH / n) + 6;
    const col = COLMAP[g.id];
    svg += `<text x="${PAD_L-8}" y="${yB+barH/2+4}" text-anchor="end" font-size="11" fill="${col}" font-weight="600">${g.id}</text>`;

    let prev = null, prevIso = null;
    filas.forEach((f, idx) => {
      const est = f[g.id].estado;
      if (est !== prev) {
        if (prev && prev !== 'no nacido') {
          const x1 = xT(prevIso), x2 = xT(f.fecha_lunes), w = Math.max(2, x2 - x1);
          const fill = prev === 'postura' ? col : PALETA_ESTADO[prev];
          if (fill !== 'transparent')
            svg += `<rect x="${x1}" y="${yB}" width="${w}" height="${barH}" fill="${fill}" opacity="${prev === 'postura' ? 1 : 0.55}"/>`;
        }
        prev = est; prevIso = f.fecha_lunes;
      }
      if (idx === filas.length - 1 && prev !== 'no nacido') {
        const x1 = xT(prevIso), x2 = xT(f.fecha_lunes), w = Math.max(2, x2 - x1);
        const fill = prev === 'postura' ? col : PALETA_ESTADO[prev];
        if (fill !== 'transparent')
          svg += `<rect x="${x1}" y="${yB}" width="${w}" height="${barH}" fill="${fill}" opacity="${prev === 'postura' ? 1 : 0.55}"/>`;
      }
    });

    // Hito pico
    const xPico = xT(g.fecha_pico_estimada);
    if (xPico >= PAD_L && xPico <= W - PAD_R)
      svg += `<circle cx="${xPico}" cy="${yB+barH/2}" r="3.5" fill="white" stroke="${col}" stroke-width="2"/>`;
  });

  svg += '</svg>';
  document.getElementById('cronograma-svg').innerHTML = svg;

  // Leyenda dinámica
  const leyEl = document.getElementById('prod-leyenda');
  if (leyEl) _renderLeyenda(leyEl);
}

function _renderLeyenda(el) {
  const items = IDS.map(id => `<span class="leyenda-item"><span class="cuad" style="background:${COLMAP[id]}"></span>${id} — ${D.galpones.find(g=>g.id===id).nombre}</span>`).join('');
  el.innerHTML = items + `<span class="leyenda-item"><span class="cuad" style="background:${COLOR_TOTAL}"></span><strong>Total</strong></span>`;
}

// ── Producción semanal ─────────────────────────────────────
function pintarProduccion() {
  const filas = D.proyeccion_semanal;
  const W = 1100, H = 360, PAD_L = 72, PAD_R = 30, PAD_T = 20, PAD_B = 50;
  const iW = W - PAD_L - PAD_R, iH = H - PAD_T - PAD_B;

  const t0  = new Date(filas[0].fecha_lunes).getTime();
  const t1  = new Date(filas[filas.length-1].fecha_lunes).getTime();
  const xT  = iso => PAD_L + ((new Date(iso).getTime() - t0) / (t1 - t0)) * iW;
  const maxV = Math.max(...filas.map(f => f.total.huevos_semana)) * 1.12 || 1;
  const yV  = v => PAD_T + iH - (v / maxV) * iH;
  const pathD = acc => filas.map((f, i) => `${i===0?'M':'L'}${xT(f.fecha_lunes).toFixed(1)},${yV(acc(f)).toFixed(1)}`).join(' ');

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

  // Grid horizontal
  for (let i = 0; i <= 5; i++) {
    const v = (maxV / 5) * i, y = yV(v);
    svg += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" stroke="${COLOR_GRID}"/>`;
    svg += `<text x="${PAD_L-6}" y="${y+4}" text-anchor="end" font-size="10" fill="${COLOR_TENUE}">${NUM(v)}</text>`;
  }
  svg += `<text x="16" y="${PAD_T+iH/2}" text-anchor="middle" font-size="10" fill="${COLOR_TEXTO}" transform="rotate(-90 16 ${PAD_T+iH/2})">huevos / semana</text>`;

  // Eje x (semestralmente)
  let cur = new Date(filas[0].fecha_lunes); cur.setDate(1);
  while (cur.getTime() <= t1) {
    if (cur.getMonth() % 6 === 0) {
      const iso = cur.toISOString().slice(0, 10), x = xT(iso);
      svg += `<text x="${x}" y="${PAD_T+iH+18}" text-anchor="middle" font-size="10" fill="${COLOR_TENUE}">${FORMATO_MES(iso)}</text>`;
    }
    cur.setMonth(cur.getMonth() + 1);
  }

  // Línea hoy
  const hoy = new Date().toISOString().slice(0, 10);
  if (hoy >= filas[0].fecha_lunes && hoy <= filas[filas.length-1].fecha_lunes) {
    const xH = xT(hoy);
    svg += `<line x1="${xH}" y1="${PAD_T}" x2="${xH}" y2="${PAD_T+iH}" stroke="${COLOR_ACENTO}" stroke-width="1" stroke-dasharray="3,3"/>`;
  }

  // Sombrear gaps
  let enGap = false, gapIni = null;
  filas.forEach(f => {
    const prod = f.total.huevos_semana > 0;
    if (!prod && !enGap) { enGap = true; gapIni = f.fecha_lunes; }
    if (prod && enGap)   { enGap = false; const x1 = xT(gapIni), x2 = xT(f.fecha_lunes); svg += `<rect x="${x1}" y="${PAD_T}" width="${x2-x1}" height="${iH}" fill="#f5f5f5" opacity="0.7"/>`; }
  });

  // Series individuales
  IDS.forEach(id => {
    svg += `<path d="${pathD(f => f[id].huevos_semana)}" stroke="${COLMAP[id]}" stroke-width="1.5" fill="none" opacity="0.6" stroke-linejoin="round"/>`;
  });
  svg += `<path d="${pathD(f => f.total.huevos_semana)}" stroke="${COLOR_TOTAL}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`;
  svg += `<line x1="${PAD_L}" y1="${PAD_T+iH}" x2="${W-PAD_R}" y2="${PAD_T+iH}" stroke="${COLOR_TENUE}"/>`;
  svg += '</svg>';
  document.getElementById('produccion-svg').innerHTML = svg;

  // Leyenda dinámica bajo el gráfico
  const leyEl = document.getElementById('prod-leyenda');
  if (leyEl) _renderLeyenda(leyEl);
}

// ── Transiciones ───────────────────────────────────────────
function pintarTransiciones() {
  const filas = D.proyeccion_semanal;

  const gaps = [];
  let ini = null;
  filas.forEach(f => {
    if (f.total.huevos_semana === 0 && f.total.aves_en_postura === 0) {
      if (IDS.some(id => f[id].estado === 'crianza') && !ini) ini = f.fecha_lunes;
    } else {
      if (ini) { gaps.push({ ini, fin: f.fecha_lunes }); ini = null; }
    }
  });

  const statsHtml = gaps.slice(0, 6).map((g, i) => {
    const wks      = Math.round((new Date(g.fin) - new Date(g.ini)) / (7 * 86400 * 1000));
    const prevFila = filas.filter(f => f.fecha_lunes < g.ini && f.total.huevos_dia > 0).slice(-1)[0];
    const nextFila = filas.filter(f => f.fecha_lunes >= g.fin && f.total.huevos_dia > 0)[0];
    const prev = prevFila ? prevFila.total.huevos_dia : 0;
    const next = nextFila ? nextFila.total.huevos_dia : 0;
    return `
      <div class="valle-stat">
        <span class="valle-stat-num">${FORMATO_MES(g.ini)}</span>
        <span class="valle-stat-lbl">Transición ${i+1}</span>
        <span style="font-size:.8rem;color:#666">${wks} sem. sin postura</span>
        <span style="font-size:.8rem;color:#888">Prev: ${NUM(prev)}/día → Post: ${NUM(next)}/día</span>
      </div>`;
  }).join('');

  document.getElementById('valle-stats').innerHTML = statsHtml ||
    '<div class="valle-stat" style="color:#2d6a2d"><span class="valle-stat-num">✓</span><span class="valle-stat-lbl">Sin brechas de producción en el horizonte</span></div>';

  // Descripción dinámica
  const desc = document.getElementById('valle-desc');
  if (desc) {
    if (gaps.length === 0) {
      desc.textContent = `Con ${IDS.length} galpón${IDS.length>1?'es':''} desfasados, no hay semanas sin producción en el horizonte de ${CONFIG.horizonte_anios} años.`;
    } else {
      const durMed = Math.round(gaps.reduce((s,g) => s + Math.round((new Date(g.fin)-new Date(g.ini))/(7*86400000)), 0) / gaps.length);
      desc.textContent = `Con ${IDS.length} galpón${IDS.length>1?'es':''}, hay ${gaps.length} brecha${gaps.length>1?'s':''} de ~${durMed} semanas sin producción en ${CONFIG.horizonte_anios} años (2 limpieza + 18 crianza por transición).`;
    }
  }

  if (!gaps.length) { document.getElementById('valle-svg').innerHTML = ''; return; }

  const g0     = gaps[0];
  const ventana = filas.filter(f => f.fecha_lunes >= addWeeks(g0.ini, -8) && f.fecha_lunes <= addWeeks(g0.fin, 8));
  if (ventana.length < 3) return;

  // Detectar qué galpón está en crianza durante este gap
  const enCrianza = IDS.find(id => ventana.some(f => f.fecha_lunes >= g0.ini && f.fecha_lunes < g0.fin && f[id].estado === 'crianza'));

  const W = 900, H = 280, PAD_L = 70, PAD_R = 30, PAD_T = 30, PAD_B = 50;
  const iW = W-PAD_L-PAD_R, iH = H-PAD_T-PAD_B;
  const maxV = Math.max(...ventana.map(f => f.total.huevos_dia), 1) * 1.15;
  const yV = v => PAD_T + iH - (v / maxV) * iH;
  const xI = i => PAD_L + (i / (ventana.length - 1)) * iW;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  for (let i = 0; i <= 4; i++) {
    const v = (maxV/4)*i, y = yV(v);
    svg += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" stroke="${COLOR_GRID}"/>`;
    svg += `<text x="${PAD_L-6}" y="${y+4}" text-anchor="end" font-size="10" fill="${COLOR_TENUE}">${NUM(v)}</text>`;
  }
  svg += `<text x="16" y="${PAD_T+iH/2}" text-anchor="middle" font-size="10" fill="${COLOR_TEXTO}" transform="rotate(-90 16 ${PAD_T+iH/2})">huevos/día</text>`;

  const xG1 = xI(ventana.findIndex(f => f.fecha_lunes >= g0.ini));
  const xG2 = xI(ventana.findIndex(f => f.fecha_lunes >= g0.fin));
  if (xG1 < xG2) svg += `<rect x="${xG1}" y="${PAD_T}" width="${xG2-xG1}" height="${iH}" fill="${COLOR_ACENTO}" opacity="0.08"/>`;
  if (xG1 < xG2) svg += `<text x="${(xG1+xG2)/2}" y="${PAD_T+14}" text-anchor="middle" font-size="10" fill="${COLOR_ACENTO}" font-weight="600">${enCrianza ? `crianza ${enCrianza}` : 'sin producción'}</text>`;

  const wBar = iW / ventana.length * 0.65;
  ventana.forEach((f, i) => {
    const x = xI(i) - wBar/2; let yAcum = yV(0);
    IDS.forEach(id => {
      const v = f[id].huevos_dia;
      if (v > 0) { const h = (v/maxV)*iH; yAcum -= h; svg += `<rect x="${x}" y="${yAcum}" width="${wBar}" height="${h}" fill="${COLMAP[id]}" opacity="0.85"/>`; }
    });
  });

  ventana.forEach((f, i) => {
    if (i % 2 === 0) {
      const [, m, d] = f.fecha_lunes.split('-');
      svg += `<text x="${xI(i)}" y="${PAD_T+iH+16}" text-anchor="middle" font-size="9" fill="${COLOR_TENUE}" transform="rotate(-30 ${xI(i)} ${PAD_T+iH+16})">${d}/${m}</text>`;
    }
  });
  svg += `<line x1="${PAD_L}" y1="${PAD_T+iH}" x2="${W-PAD_R}" y2="${PAD_T+iH}" stroke="${COLOR_TENUE}"/>`;
  svg += '</svg>';
  document.getElementById('valle-svg').innerHTML = svg;
}

// ── Infraestructura ────────────────────────────────────────
function pintarInfraestructura() {
  const el = document.getElementById('infra-grid');
  if (!el) return;

  const filas    = D.proyeccion_semanal;
  const N        = IDS.length;
  const semsTotal = filas.length;
  const semsProd  = filas.filter(f => f.total.huevos_dia > 0).length;
  const semsVacio = semsTotal - semsProd;
  const pctEfic   = Math.round(semsProd / semsTotal * 100);

  // Brechas detectadas
  const brechas = [];
  let ini = null;
  filas.forEach(f => {
    const enBrecha = f.total.huevos_semana === 0;
    if (enBrecha && !ini) ini = f.fecha_lunes;
    else if (!enBrecha && ini) { brechas.push({ ini, fin: f.fecha_lunes }); ini = null; }
  });
  const nBrechas   = brechas.length;
  const durMedia   = nBrechas ? Math.round(semsVacio / nBrechas) : 0;

  // Cuántos galpones se necesitan en total para flujo continuo
  const galpNecesarios = Math.ceil(CICLO / POSTURA); // = 2
  const galpFaltantes  = Math.max(0, galpNecesarios - N);
  const desfaseOpt     = galpFaltantes > 0 ? Math.round(CICLO / (N + galpFaltantes)) : 0;
  const fechaSig       = galpFaltantes > 0 ? addWeeks(D.galpones[N-1].fecha_nacimiento, desfaseOpt) : null;

  const promDia = semsProd > 0 ? Math.round(
    filas.filter(f => f.total.huevos_dia > 0).reduce((s, f) => s + f.total.huevos_dia, 0) / semsProd
  ) : 0;

  const estadoEfic = nBrechas === 0 ? 'ok' : pctEfic >= 90 ? 'ok' : 'alerta';

  const fichas = [
    { num: pctEfic + '%', cls: estadoEfic, lbl: `eficiencia productiva<br>${N} galpón${N>1?'es':''} configurado${N>1?'s':''}` },
    { num: nBrechas === 0 ? '✓' : String(nBrechas), cls: nBrechas === 0 ? 'ok' : 'alerta', lbl: nBrechas === 0 ? 'sin brechas en<br>el horizonte' : `brecha${nBrechas>1?'s':''} de producción<br>en ${CONFIG.horizonte_anios} años` },
    ...(nBrechas > 0 ? [{ num: String(durMedia), cls: '', lbl: 'semanas sin producción<br>por transición' }] : []),
    ...(galpFaltantes > 0 ? [{ num: '+' + galpFaltantes, cls: '', lbl: `galpón${galpFaltantes>1?'es':''} adicional${galpFaltantes>1?'es':''}<br>para flujo continuo`, color: COLOR_ACENTO }] : []),
  ];

  let texto = '';
  if (nBrechas === 0) {
    texto = `<p>Con <strong>${N} galpones desfasados</strong>, la operación no presenta brechas en los ${CONFIG.horizonte_anios} años proyectados. La producción es continua.</p>`;
  } else {
    texto = `<p>Con <strong>${N} galpón${N>1?'es':''}</strong>, hay ${nBrechas} brecha${nBrechas>1?'s':''} de ~${durMedia} semanas (${2} limpieza + ${CRIANZA} crianza) en ${CONFIG.horizonte_anios} años.</p>`;
    if (galpFaltantes > 0) {
      texto += `<p>Para <strong>eliminar las brechas</strong> se necesita${galpFaltantes>1?'n':''} <strong>${galpFaltantes} galpón${galpFaltantes>1?'es':''} adicional${galpFaltantes>1?'es':''} (${N+galpFaltantes} en total)</strong>, con desfase de ~${desfaseOpt} semanas (≈ ${Math.round(desfaseOpt/4.33)} meses) entre galpones. Puedes configurarlo en el panel de arriba.</p>`;
    }
  }

  el.innerHTML = `
    <div class="infra-fichas">
      ${fichas.map(f => `
        <div class="infra-ficha${f.color ? ' destac' : ''}">
          <span class="infra-num ${f.cls || ''}" ${f.color ? `style="color:${f.color}"` : ''}>${f.num}</span>
          <span class="infra-lbl">${f.lbl}</span>
        </div>`).join('')}
    </div>
    <div class="infra-detalle">${texto}</div>
    ${fechaSig ? `<div class="recomendacion"><strong>Fecha ideal de entrada del próximo galpón:</strong> semana del ${FORMATO_FECHA(fechaSig)} — desfase ~${desfaseOpt} semanas desde el último galpón configurado.</div>` : ''}`;

  _pintarInfraChart(filas);
}

function _pintarInfraChart(filas) {
  const svgEl = document.getElementById('infra-svg');
  if (!svgEl) return;

  const series = filas.map(f => {
    const por = {}; let tot = 0;
    IDS.forEach(id => { por[id] = f[id].huevos_dia; tot += por[id]; });
    return { fecha: f.fecha_lunes, por, tot };
  });

  const W = 900, H = 300, PL = 72, PR = 30, PT = 40, PB = 50;
  const iW = W-PL-PR, iH = H-PT-PB;
  const maxV = Math.max(...series.map(s => s.tot), 1) * 1.12;
  const yV = v => PT + iH - (v / maxV) * iH;
  const xI = i => PL + (i / (series.length - 1)) * iW;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

  // Bandas de año
  const anios = [...new Set(series.map(s => s.fecha.slice(0,4)))];
  anios.forEach((a, ai) => {
    const i0 = series.findIndex(s => s.fecha.startsWith(a));
    const i1 = series.findLastIndex(s => s.fecha.startsWith(a));
    if (ai % 2 === 0) svg += `<rect x="${xI(i0)}" y="${PT}" width="${xI(i1)-xI(i0)}" height="${iH}" fill="#f5f3ee" opacity="0.6"/>`;
    svg += `<text x="${(xI(i0)+xI(i1))/2}" y="${PT+iH+18}" text-anchor="middle" font-size="11" fill="${COLOR_TENUE}">${a}</text>`;
  });

  // Grid
  for (let i = 0; i <= 4; i++) {
    const v = (maxV/4)*i, y = yV(v);
    svg += `<line x1="${PL}" y1="${y}" x2="${W-PR}" y2="${y}" stroke="${COLOR_GRID}"/>`;
    svg += `<text x="${PL-6}" y="${y+4}" text-anchor="end" font-size="10" fill="${COLOR_TENUE}">${NUM(v)}</text>`;
  }
  svg += `<text x="14" y="${PT+iH/2}" text-anchor="middle" font-size="10" fill="${COLOR_TEXTO}" transform="rotate(-90 14 ${PT+iH/2})">huevos/día</text>`;

  // Áreas apiladas por galpón
  IDS.forEach((id, idx) => {
    const prevIDS = IDS.slice(0, idx);
    const pts = series.map((s, i) => {
      const base = prevIDS.reduce((sum, pid) => sum + s.por[pid], 0);
      return { x: xI(i), yTop: yV(base + s.por[id]), yBase: yV(base) };
    });
    const topPath = pts.map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.yTop.toFixed(1)}`).join(' ');
    const botPath = pts.map((_, i) => { const p = pts[pts.length-1-i]; return `L${p.x.toFixed(1)},${p.yBase.toFixed(1)}`; }).join(' ');
    svg += `<path d="${topPath} ${botPath} Z" fill="${COLMAP[id]}" opacity="0.45"/>`;
  });

  // Línea total
  const pathTot = series.map((s, i) => `${i===0?'M':'L'}${xI(i).toFixed(1)},${yV(s.tot).toFixed(1)}`).join(' ');
  svg += `<path d="${pathTot}" stroke="${COLOR_TOTAL}" stroke-width="2.5" fill="none"/>`;

  // Ejes
  svg += `<line x1="${PL}" y1="${PT+iH}" x2="${W-PR}" y2="${PT+iH}" stroke="${COLOR_TENUE}"/>`;
  svg += `<line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT+iH}" stroke="${COLOR_TENUE}"/>`;

  // Leyenda
  let lx = PL;
  IDS.forEach(id => {
    svg += `<rect x="${lx}" y="${PT-22}" width="16" height="12" fill="${COLMAP[id]}" opacity="0.6" rx="2"/>`;
    svg += `<text x="${lx+20}" y="${PT-11}" font-size="10" fill="${COLOR_TEXTO}">${id}</text>`;
    lx += 65;
  });
  svg += `<line x1="${lx}" y1="${PT-16}" x2="${lx+20}" y2="${PT-16}" stroke="${COLOR_TOTAL}" stroke-width="2.5"/>`;
  svg += `<text x="${lx+24}" y="${PT-11}" font-size="10" fill="${COLOR_TEXTO}">Total combinado</text>`;
  svg += '</svg>';
  svgEl.innerHTML = svg;
}

// ── Producción anual ───────────────────────────────────────
function pintarAnual() {
  const porAnio = {};
  D.proyeccion_semanal.forEach(f => {
    if (!porAnio[f.anio]) { porAnio[f.anio] = { total: 0 }; IDS.forEach(id => porAnio[f.anio][id] = 0); }
    IDS.forEach(id => porAnio[f.anio][id] += f[id].huevos_semana);
    porAnio[f.anio].total += f.total.huevos_semana;
  });

  const anios   = Object.keys(porAnio).sort();
  const primerA = anios[0], ultimoA = anios[anios.length-1];

  const html = anios.map(a => {
    const da     = porAnio[a];
    const parcial = a === primerA || a === ultimoA;
    const docenas = Math.round(da.total / 12);
    const detalles = IDS.map(id => da[id] > 0
      ? `<div class="anual-detalle-item"><span class="anual-detalle-lbl" style="color:${COLMAP[id]}">${id}</span><span class="anual-detalle-val">${NUM(da[id])}</span></div>`
      : '').join('');
    return `
      <article class="anual-card${parcial ? ' parcial' : ''}">
        <div class="anual-anio">año ${a}${parcial ? ' *' : ''}</div>
        <div class="anual-total">${NUM(da.total)}</div>
        <div class="anual-unidad">huevos · ${NUM(docenas)} docenas</div>
        ${parcial ? '<div class="anual-parcial">año parcial</div>' : ''}
        <div class="anual-detalle">${detalles}</div>
      </article>`;
  }).join('');

  const medios = anios.filter(a => a !== primerA && a !== ultimoA).map(a => porAnio[a].total);
  const promAnual = medios.length ? Math.round(medios.reduce((s,v) => s+v, 0) / medios.length) : 0;

  document.getElementById('anual-grid').innerHTML = html + `
    <p class="anual-nota">* Años parciales. ${promAnual ? `Año completo en régimen: ~${NUM(promAnual)} huevos/año.` : ''}</p>`;
}

// ── Tabla semanal ──────────────────────────────────────────
function pintarTabla() {
  const thead = document.querySelector('#tabla-semanal thead');
  const cols    = IDS.map(id => `<th class="grupo-g1" colspan="3" style="background:${COLMAP[id]}22;color:${COLMAP[id]}">${id}</th>`).join('');
  const subcols = IDS.map(() => `<th>Sem</th><th>Estado</th><th>Huev/día</th>`).join('');
  thead.innerHTML = `
    <tr><th rowspan="2">Sem.</th><th rowspan="2">Fecha</th>${cols}<th class="grupo-tot" colspan="2">Total</th></tr>
    <tr>${subcols}<th class="grupo-tot">Aves</th><th class="grupo-tot">Huev/día</th></tr>`;
  renderTabla();
}

function poblarFiltros() {
  const anios = [...new Set(D.proyeccion_semanal.map(f => f.anio))].sort();
  const sel   = document.getElementById('filtro-anio');
  anios.forEach(a => {
    const o = document.createElement('option'); o.value = a; o.textContent = a; sel.appendChild(o);
  });
}

function renderTabla() {
  const anioSel = document.getElementById('filtro-anio').value;
  const soloP   = document.getElementById('filtro-produccion').checked;
  let filas = D.proyeccion_semanal;
  if (anioSel !== 'todos') filas = filas.filter(f => f.anio === Number(anioSel));
  if (soloP) filas = filas.filter(f => f.total.huevos_dia > 0);

  const tbody = document.querySelector('#tabla-semanal tbody');
  tbody.innerHTML = filas.map(f => {
    const celdas = IDS.map(id => {
      const r = f[id], est = r.estado;
      const cls = est === 'postura' ? 'estado-postura' : est === 'crianza' ? 'estado-crianza' : '';
      return `<td>${r.sem_vida || '—'}</td><td class="estado ${cls}">${est}</td><td>${r.huevos_dia > 0 ? NUM(r.huevos_dia) : '—'}</td>`;
    }).join('');
    return `<tr>
      <td>${f.semana_cal}</td>
      <td class="fecha">${FORMATO_FECHA(f.fecha_lunes)}</td>
      ${celdas}
      <td class="total-celda">${NUM(f.total.aves_en_postura)}</td>
      <td class="total-celda">${f.total.huevos_dia > 0 ? NUM(f.total.huevos_dia) : '—'}</td>
    </tr>`;
  }).join('');
  document.getElementById('tabla-conteo').textContent = `${filas.length} semanas`;
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('filtro-anio').addEventListener('change', renderTabla);
  document.getElementById('filtro-produccion').addEventListener('change', renderTabla);
});
cargar();
