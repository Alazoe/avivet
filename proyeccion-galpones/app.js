/* ============================================================
   Proyección 3 Galpones — App
   Vanilla JS, SVG puro, sin dependencias
   ============================================================ */

const COLORES = {
  G1: '#f0a500',
  G2: '#1b4332',
  G3: '#58a6ff',
  total: '#2d4a2b',
  crianza: '#cfcfcf',
  traspaso: '#9aa0a6',
  descartado: '#d6d3d1',
  texto: '#1a1a1a',
  textoSuave: '#555',
  textoTenue: '#888',
  linea: '#e0ddd5',
  acento: '#f0a500',
};

const FORMATO_FECHA = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2,'0')}-${String(m).padStart(2,'0')}-${y}`;
};
const FORMATO_FECHA_CORTA = (iso) => {
  const [y, m] = iso.split('-').map(Number);
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${meses[m-1]} ${String(y).slice(-2)}`;
};
const NUM = (n) => n.toLocaleString('es-CL');

// ============================================================
// CARGA DE DATOS
// ============================================================
let DATOS = null;

async function cargar() {
  try {
    const resp = await fetch('datos.json');
    DATOS = await resp.json();
    document.getElementById('fecha-hoy').textContent = FORMATO_FECHA(DATOS.metadata.fecha_generacion);
    document.getElementById('fecha-pie').textContent = FORMATO_FECHA(DATOS.metadata.fecha_generacion);
    document.getElementById('kpi-galpones').textContent = DATOS.galpones.length;
    document.getElementById('kpi-aves').textContent = NUM(DATOS.galpones.length * DATOS.metadata.aves_por_galpon);
    document.getElementById('kpi-horizonte').textContent = DATOS.metadata.horizonte.total_semanas;
    pintarGalpones();
    pintarCronograma();
    pintarProduccion();
    pintarValle();
    pintarAnual();
    pintarTabla();
    poblarFiltros();
  } catch (err) {
    console.error('Error cargando datos:', err);
    document.body.innerHTML = '<div style="padding:60px;font-family:sans-serif;color:#b00">Error cargando datos.json. Verifica que el archivo esté en la misma carpeta.</div>';
  }
}

// ============================================================
// GALPONES — Tarjetas
// ============================================================
function pintarGalpones() {
  const grid = document.getElementById('galpones-grid');
  const html = DATOS.galpones.map((g, i) => `
    <article class="galpon-card g${i+1}">
      <div class="galpon-id">${g.id} · ${i === 0 ? 'existente' : 'a construir'}</div>
      <h3 class="galpon-nombre">${g.nombre}</h3>
      <dl class="galpon-fechas">
        <dt>Aves iniciales</dt>           <dd>${NUM(g.aves_iniciales)}</dd>
        <dt>Nacimiento (BB)</dt>          <dd>${FORMATO_FECHA(g.fecha_nacimiento)}</dd>
        <dt>Inicio postura (sem 19)</dt>  <dd>${FORMATO_FECHA(g.fecha_inicio_postura_estimada)}</dd>
        <dt>Pico (sem 29)</dt>            <dd>${FORMATO_FECHA(g.fecha_pico_estimada)}</dd>
        <dt>Descarte (sem 100)</dt>       <dd>${FORMATO_FECHA(g.fecha_descarte_estimada)}</dd>
      </dl>
    </article>
  `).join('');
  grid.innerHTML = html;
}

// ============================================================
// CRONOGRAMA — Gantt SVG
// ============================================================
function pintarCronograma() {
  const filas = DATOS.proyeccion_semanal;
  const W = 1100, H = 280, PAD_L = 60, PAD_R = 30, PAD_T = 30, PAD_B = 50;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const barH = innerH / DATOS.galpones.length - 14;

  const fechaIni = new Date(filas[0].fecha_lunes).getTime();
  const fechaFin = new Date(filas[filas.length-1].fecha_lunes).getTime();
  const xEscala = (iso) => {
    const t = new Date(iso).getTime();
    return PAD_L + ((t - fechaIni) / (fechaFin - fechaIni)) * innerW;
  };

  // Generar segmentos por estado para cada galpón
  const segmentos = DATOS.galpones.map((g, i) => {
    const segs = [];
    let actual = null;
    filas.forEach((f, idx) => {
      const est = f[g.id].estado;
      if (!actual || actual.estado !== est) {
        if (actual) actual.fin = f.fecha_lunes;
        actual = { estado: est, ini: f.fecha_lunes, fin: f.fecha_lunes };
        segs.push(actual);
      }
      if (idx === filas.length - 1) actual.fin = f.fecha_lunes;
    });
    return { g, segs };
  });

  const colorEstado = {
    'no nacido': 'transparent',
    'crianza': COLORES.crianza,
    'traspaso': COLORES.traspaso,
    'postura': null, // se setea por galpón
    'descartado': COLORES.descartado,
  };

  // Generar marcas de tiempo (cada trimestre/semestre)
  const marcas = [];
  let cursor = new Date(filas[0].fecha_lunes);
  cursor.setDate(1);
  while (cursor.getTime() <= fechaFin) {
    if (cursor.getMonth() % 6 === 0) {
      marcas.push({
        fecha: cursor.toISOString().slice(0,10),
        label: `${cursor.toLocaleDateString('es-CL',{month:'short'})} ${cursor.getFullYear()}`,
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cronograma de los tres galpones">`;

  // grid vertical (años)
  marcas.forEach(m => {
    const x = xEscala(m.fecha);
    svg += `<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${H-PAD_B}" class="svg-grid"/>`;
    svg += `<text x="${x}" y="${H-PAD_B+18}" class="svg-eje" text-anchor="middle">${m.label}</text>`;
  });

  // Línea hoy
  const hoy = new Date().toISOString().slice(0,10);
  if (hoy >= filas[0].fecha_lunes && hoy <= filas[filas.length-1].fecha_lunes) {
    const xH = xEscala(hoy);
    svg += `<line x1="${xH}" y1="${PAD_T-6}" x2="${xH}" y2="${H-PAD_B}" stroke="${COLORES.acento}" stroke-width="1.5" stroke-dasharray="3,3"/>`;
    svg += `<text x="${xH}" y="${PAD_T-10}" class="svg-eje" text-anchor="middle" fill="${COLORES.acento}" font-weight="600">hoy</text>`;
  }

  // Barras
  segmentos.forEach((s, i) => {
    const yBase = PAD_T + i * (innerH / DATOS.galpones.length) + 8;
    const colorPostura = COLORES[s.g.id];
    
    // Etiqueta del galpón (izquierda)
    svg += `<text x="${PAD_L-10}" y="${yBase + barH/2 + 5}" class="svg-etiqueta-galpon" fill="${colorPostura}" text-anchor="end">${s.g.id}</text>`;

    s.segs.forEach(seg => {
      if (seg.estado === 'no nacido') return;
      const x1 = xEscala(seg.ini);
      const x2 = xEscala(seg.fin);
      const w = Math.max(2, x2 - x1);
      const fill = seg.estado === 'postura' ? colorPostura : colorEstado[seg.estado];
      const opacity = seg.estado === 'postura' ? 1 : 0.6;
      const stroke = seg.estado === 'descartado' ? '#888' : 'none';
      const dash = seg.estado === 'descartado' ? '3,2' : '0';
      svg += `<rect x="${x1}" y="${yBase}" width="${w}" height="${barH}" fill="${fill}" opacity="${opacity}" stroke="${stroke}" stroke-dasharray="${dash}"/>`;
    });

    // Marcadores de hitos: nacimiento, pico, descarte
    const xNac = xEscala(s.g.fecha_nacimiento);
    const xPico = xEscala(s.g.fecha_pico_estimada);
    const xDesc = xEscala(s.g.fecha_descarte_estimada);
    
    // pico (estrella simple)
    svg += `<circle cx="${xPico}" cy="${yBase + barH/2}" r="3.5" fill="white" stroke="${colorPostura}" stroke-width="2"/>`;
    svg += `<text x="${xPico}" y="${yBase - 4}" class="svg-eje" text-anchor="middle" font-weight="600" fill="${colorPostura}">pico</text>`;
  });

  svg += `</svg>`;
  document.getElementById('cronograma-svg').innerHTML = svg;
}

// ============================================================
// PRODUCCIÓN — Líneas SVG
// ============================================================
function pintarProduccion() {
  const filas = DATOS.proyeccion_semanal;
  const W = 1100, H = 360, PAD_L = 70, PAD_R = 30, PAD_T = 20, PAD_B = 50;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const fechaIni = new Date(filas[0].fecha_lunes).getTime();
  const fechaFin = new Date(filas[filas.length-1].fecha_lunes).getTime();
  const xEscala = (iso) => PAD_L + ((new Date(iso).getTime() - fechaIni) / (fechaFin - fechaIni)) * innerW;

  const maxVal = Math.max(...filas.map(f => f.total.huevos_semana)) * 1.1;
  const yEscala = (v) => PAD_T + innerH - (v / maxVal) * innerH;

  // Series
  const series = [
    { key: 'G1', color: COLORES.G1, w: 1.5, opacity: 0.7 },
    { key: 'G2', color: COLORES.G2, w: 1.5, opacity: 0.7 },
    { key: 'G3', color: COLORES.G3, w: 1.5, opacity: 0.7 },
    { key: 'TOTAL', color: COLORES.total, w: 2.5, opacity: 1 },
  ];

  const path = (acc) => filas.map((f, i) => {
    const v = acc(f);
    const x = xEscala(f.fecha_lunes);
    const y = yEscala(v);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Producción semanal proyectada">`;

  // Grid horizontal
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const v = (maxVal / ticks) * i;
    const y = yEscala(v);
    svg += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" class="svg-grid"/>`;
    svg += `<text x="${PAD_L-8}" y="${y+3}" class="svg-eje" text-anchor="end">${NUM(Math.round(v))}</text>`;
  }
  // título eje y
  svg += `<text x="20" y="${PAD_T + innerH/2}" class="svg-titulo-eje" text-anchor="middle" transform="rotate(-90 20 ${PAD_T + innerH/2})">huevos por semana</text>`;

  // Marcas eje x
  let cursor = new Date(filas[0].fecha_lunes);
  cursor.setDate(1);
  while (cursor.getTime() <= fechaFin) {
    if (cursor.getMonth() % 6 === 0) {
      const isoCur = cursor.toISOString().slice(0,10);
      const x = xEscala(isoCur);
      svg += `<line x1="${x}" y1="${PAD_T+innerH}" x2="${x}" y2="${PAD_T+innerH+5}" stroke="${COLORES.textoTenue}"/>`;
      svg += `<text x="${x}" y="${PAD_T+innerH+18}" class="svg-eje" text-anchor="middle">${cursor.toLocaleDateString('es-CL',{month:'short'})} ${cursor.getFullYear()}</text>`;
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Sombrear el valle (jun-jul 2027)
  const xV1 = xEscala('2027-06-14');
  const xV2 = xEscala('2027-07-12');
  svg += `<rect x="${xV1}" y="${PAD_T}" width="${xV2-xV1}" height="${innerH}" fill="${COLORES.acento}" opacity="0.08"/>`;
  svg += `<text x="${(xV1+xV2)/2}" y="${PAD_T+12}" class="svg-eje" text-anchor="middle" fill="${COLORES.acento}" font-weight="600">valle</text>`;

  // Series (G1, G2, G3 con opacidad reducida; total grueso)
  series.forEach(s => {
    const acc = s.key === 'TOTAL'
      ? (f) => f.total.huevos_semana
      : (f) => f[s.key].huevos_semana;
    svg += `<path d="${path(acc)}" stroke="${s.color}" stroke-width="${s.w}" fill="none" opacity="${s.opacity}" stroke-linejoin="round"/>`;
  });

  // Eje x base
  svg += `<line x1="${PAD_L}" y1="${PAD_T+innerH}" x2="${W-PAD_R}" y2="${PAD_T+innerH}" stroke="${COLORES.textoTenue}"/>`;

  svg += `</svg>`;
  document.getElementById('produccion-svg').innerHTML = svg;
}

// ============================================================
// VALLE — Detalle del periodo crítico
// ============================================================
function pintarValle() {
  // Filtrar 12 semanas alrededor de jun-jul 2027
  const filas = DATOS.proyeccion_semanal.filter(f => {
    return f.fecha_lunes >= '2027-05-01' && f.fecha_lunes <= '2027-08-15';
  });

  const W = 900, H = 320, PAD_L = 70, PAD_R = 30, PAD_T = 30, PAD_B = 60;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...filas.map(f => f.total.huevos_dia)) * 1.15;
  const yEscala = (v) => PAD_T + innerH - (v / maxVal) * innerH;
  const xEscala = (i) => PAD_L + (i / (filas.length - 1)) * innerW;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Detalle del valle de transición">`;

  // grid
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const v = (maxVal / ticks) * i;
    const y = yEscala(v);
    svg += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" class="svg-grid"/>`;
    svg += `<text x="${PAD_L-8}" y="${y+3}" class="svg-eje" text-anchor="end">${NUM(Math.round(v))}</text>`;
  }
  svg += `<text x="20" y="${PAD_T + innerH/2}" class="svg-titulo-eje" text-anchor="middle" transform="rotate(-90 20 ${PAD_T + innerH/2})">huevos por día</text>`;

  // barras apiladas
  const wBar = innerW / filas.length * 0.7;
  filas.forEach((f, i) => {
    const x = xEscala(i) - wBar/2;
    let yAcum = yEscala(0);
    ['G1','G2','G3'].forEach(k => {
      const v = f[k].huevos_dia;
      if (v > 0) {
        const h = (v / maxVal) * innerH;
        yAcum -= h;
        svg += `<rect x="${x}" y="${yAcum}" width="${wBar}" height="${h}" fill="${COLORES[k]}" opacity="0.85"/>`;
      }
    });
  });

  // Eje x con fechas
  filas.forEach((f, i) => {
    const x = xEscala(i);
    const [y, m, d] = f.fecha_lunes.split('-');
    const lbl = `${d}/${m}`;
    svg += `<text x="${x}" y="${PAD_T+innerH+15}" class="svg-eje" text-anchor="middle" transform="rotate(-30 ${x} ${PAD_T+innerH+15})">${lbl}</text>`;
  });

  // Línea de referencia: nivel "estable" (~3300 huevos/día con 2 lotes en postura plena)
  const yRef = yEscala(3300);
  svg += `<line x1="${PAD_L}" y1="${yRef}" x2="${W-PAD_R}" y2="${yRef}" stroke="${COLORES.total}" stroke-width="1" stroke-dasharray="4,4" opacity="0.6"/>`;
  svg += `<text x="${W-PAD_R-5}" y="${yRef-5}" class="svg-eje" text-anchor="end" fill="${COLORES.total}" font-weight="600">nivel régimen ~3.300/día</text>`;

  svg += `<line x1="${PAD_L}" y1="${PAD_T+innerH}" x2="${W-PAD_R}" y2="${PAD_T+innerH}" stroke="${COLORES.textoTenue}"/>`;
  svg += `</svg>`;
  document.getElementById('valle-svg').innerHTML = svg;

  // Stats del valle
  const valleFilas = DATOS.proyeccion_semanal.filter(f =>
    f.fecha_lunes >= '2027-06-21' && f.fecha_lunes <= '2027-07-12'
  );
  const minVal = Math.min(...valleFilas.map(f => f.total.huevos_dia));
  const promVal = Math.round(valleFilas.reduce((a,f) => a+f.total.huevos_dia, 0) / valleFilas.length);
  const caidaPct = Math.round((1 - promVal/3300) * 100);

  document.getElementById('valle-stats').innerHTML = `
    <div class="valle-stat"><span class="valle-stat-num">${NUM(minVal)}</span><span class="valle-stat-lbl">huevos/día en mínimo</span></div>
    <div class="valle-stat"><span class="valle-stat-num">${NUM(promVal)}</span><span class="valle-stat-lbl">promedio del valle</span></div>
    <div class="valle-stat"><span class="valle-stat-num">−${caidaPct}%</span><span class="valle-stat-lbl">vs. régimen estable</span></div>
    <div class="valle-stat"><span class="valle-stat-num">${valleFilas.length}</span><span class="valle-stat-lbl">semanas críticas</span></div>
  `;
}

// ============================================================
// ANUAL — Cards
// ============================================================
function pintarAnual() {
  const porAnio = {};
  DATOS.proyeccion_semanal.forEach(f => {
    if (!porAnio[f.anio]) porAnio[f.anio] = { G1: 0, G2: 0, G3: 0 };
    porAnio[f.anio].G1 += f.G1.huevos_semana;
    porAnio[f.anio].G2 += f.G2.huevos_semana;
    porAnio[f.anio].G3 += f.G3.huevos_semana;
  });

  const aniosOrdenados = Object.keys(porAnio).sort();
  const primerAnio = aniosOrdenados[0];
  const ultimoAnio = aniosOrdenados[aniosOrdenados.length - 1];

  const html = aniosOrdenados.map(a => {
    const d = porAnio[a];
    const total = d.G1 + d.G2 + d.G3;
    const docenas = Math.round(total / 12);
    const esParcial = (a === primerAnio || a === ultimoAnio);
    const notaParcial = esParcial ? `<div class="anual-parcial">año parcial</div>` : '';
    return `
      <article class="anual-card${esParcial ? ' parcial' : ''}">
        <div class="anual-anio">año ${a}${esParcial ? ' *' : ''}</div>
        <div class="anual-total">${NUM(total)}</div>
        <div class="anual-unidad">huevos · ${NUM(docenas)} docenas</div>
        ${notaParcial}
        <div class="anual-detalle">
          <div class="anual-detalle-item"><span class="anual-detalle-lbl" style="color:${COLORES.G1}">G1</span><span class="anual-detalle-val">${NUM(d.G1)}</span></div>
          <div class="anual-detalle-item"><span class="anual-detalle-lbl" style="color:${COLORES.G2}">G2</span><span class="anual-detalle-val">${NUM(d.G2)}</span></div>
          <div class="anual-detalle-item"><span class="anual-detalle-lbl" style="color:${COLORES.G3}">G3</span><span class="anual-detalle-val">${NUM(d.G3)}</span></div>
        </div>
      </article>
    `;
  }).join('');
  document.getElementById('anual-grid').innerHTML = html + `
    <p class="anual-nota">
      <strong>*</strong> Los años marcados son parciales (el horizonte de simulación va de
      julio 2025 a diciembre 2028). El año 2027 representa el régimen estable proyectado
      con dos galpones siempre en postura: ~1,1 millones de huevos/año.
    </p>
  `;
}

// ============================================================
// TABLA
// ============================================================
function pintarTabla() {
  const thead = document.querySelector('#tabla-semanal thead');
  thead.innerHTML = `
    <tr>
      <th rowspan="2">Sem</th>
      <th rowspan="2">Fecha</th>
      <th class="grupo-g1" colspan="4">Galpón 1</th>
      <th class="grupo-g2" colspan="4">Galpón 2</th>
      <th class="grupo-g3" colspan="4">Galpón 3</th>
      <th class="grupo-tot" colspan="2">Total</th>
    </tr>
    <tr>
      <th class="grupo-g1">Sem vida</th>
      <th class="grupo-g1">Estado</th>
      <th class="grupo-g1">% post</th>
      <th class="grupo-g1">Huev/día</th>
      <th class="grupo-g2">Sem vida</th>
      <th class="grupo-g2">Estado</th>
      <th class="grupo-g2">% post</th>
      <th class="grupo-g2">Huev/día</th>
      <th class="grupo-g3">Sem vida</th>
      <th class="grupo-g3">Estado</th>
      <th class="grupo-g3">% post</th>
      <th class="grupo-g3">Huev/día</th>
      <th class="grupo-tot">Aves post</th>
      <th class="grupo-tot">Huev/día</th>
    </tr>
  `;

  document.getElementById('filtro-anio').addEventListener('change', renderTabla);
  document.getElementById('filtro-produccion').addEventListener('change', renderTabla);
  renderTabla();
}

function poblarFiltros() {
  const anios = [...new Set(DATOS.proyeccion_semanal.map(f => f.anio))].sort();
  const sel = document.getElementById('filtro-anio');
  anios.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    sel.appendChild(opt);
  });
}

function renderTabla() {
  const anioSel = document.getElementById('filtro-anio').value;
  const soloProduccion = document.getElementById('filtro-produccion').checked;

  let filas = DATOS.proyeccion_semanal;
  if (anioSel !== 'todos') filas = filas.filter(f => f.anio === Number(anioSel));
  if (soloProduccion) filas = filas.filter(f => f.total.huevos_dia > 0);

  const tbody = document.querySelector('#tabla-semanal tbody');
  const html = filas.map(f => {
    const cellEstado = (e) => `<td class="estado ${e==='postura' ? 'estado-postura':''}">${e}</td>`;
    const cellPct = (p) => p > 0 ? `${p.toFixed(1)}%` : '—';
    const cellHuev = (n) => n > 0 ? NUM(n) : '—';
    return `
      <tr>
        <td>${f.semana_cal}</td>
        <td class="fecha">${FORMATO_FECHA(f.fecha_lunes)}</td>
        <td>${f.G1.sem_vida || '—'}</td>${cellEstado(f.G1.estado)}<td>${cellPct(f.G1.pct_postura)}</td><td>${cellHuev(f.G1.huevos_dia)}</td>
        <td>${f.G2.sem_vida || '—'}</td>${cellEstado(f.G2.estado)}<td>${cellPct(f.G2.pct_postura)}</td><td>${cellHuev(f.G2.huevos_dia)}</td>
        <td>${f.G3.sem_vida || '—'}</td>${cellEstado(f.G3.estado)}<td>${cellPct(f.G3.pct_postura)}</td><td>${cellHuev(f.G3.huevos_dia)}</td>
        <td class="total-celda">${NUM(f.total.aves_en_postura)}</td>
        <td class="total-celda">${NUM(f.total.huevos_dia)}</td>
      </tr>
    `;
  }).join('');
  tbody.innerHTML = html;

  document.getElementById('tabla-conteo').textContent = `${filas.length} semanas`;
}

// ============================================================
// INICIO
// ============================================================
cargar();
