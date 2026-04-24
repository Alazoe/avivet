/* ============================================================
   Proyección Galpón Único — 10 años
   Vanilla JS, SVG puro, sin dependencias. Dinámico: funciona
   con cualquier número de lotes definidos en datos.json.
   ============================================================ */

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

const PALETA_ESTADO = {
  'no nacido':  'transparent',
  'crianza':    '#cfcfcf',
  'postura':    null,       // → color del lote
  'descartado': '#e8e5e1',
};
const COLOR_TOTAL  = '#2d4a2b';
const COLOR_GRID   = '#e0ddd5';
const COLOR_TEXTO  = '#555';
const COLOR_TENUE  = '#888';
const COLOR_ACENTO = '#f0a500';

// ============================================================
// CARGA
// ============================================================
let D = null;   // datos.json completo
let IDS = [];   // ["L1","L2",...]
let COLMAP = {};// { L1: "#f0a500", ... }

async function cargar() {
  try {
    const resp = await fetch('datos.json');
    D = await resp.json();
    IDS   = D.galpones.map(g => g.id);
    COLMAP = Object.fromEntries(D.galpones.map(g => [g.id, '#'+g.color.replace('#','')]));

    document.getElementById('fecha-hoy').textContent    = FORMATO_FECHA(D.metadata.fecha_generacion);
    document.getElementById('fecha-pie').textContent    = FORMATO_FECHA(D.metadata.fecha_generacion);
    document.getElementById('kpi-galpones').textContent = D.metadata.galpones_construidos ?? 1;
    document.getElementById('kpi-aves').textContent     = NUM(D.metadata.aves_por_galpon);
    document.getElementById('kpi-horizonte').textContent= D.metadata.horizonte.total_semanas;
    document.getElementById('kpi-lotes').textContent    = D.galpones.length;

    pintarLotes();
    pintarCronograma();
    pintarProduccion();
    pintarTransiciones();
    pintarAnual();
    pintarTabla();
    poblarFiltros();
  } catch (err) {
    console.error(err);
    document.body.innerHTML = '<div style="padding:60px;font-family:sans-serif;color:#b00">Error cargando datos.json.</div>';
  }
}

// ============================================================
// TARJETAS DE LOTES
// ============================================================
function pintarLotes() {
  const grid = document.getElementById('galpones-grid');
  grid.innerHTML = D.galpones.map((g, i) => `
    <article class="galpon-card" style="border-top:4px solid ${COLMAP[g.id]}">
      <div class="galpon-id" style="color:${COLMAP[g.id]}">${g.id} · ${i===0 ? 'lote actual' : i+'ª reposición'}</div>
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
}

// ============================================================
// CRONOGRAMA — Gantt SVG dinámico
// ============================================================
function pintarCronograma() {
  const filas = D.proyeccion_semanal;
  const n = D.galpones.length;
  const W=1100, PAD_L=60, PAD_R=30, PAD_T=30, PAD_B=50;
  const H = PAD_T + PAD_B + n * 38;
  const iW = W-PAD_L-PAD_R, iH = H-PAD_T-PAD_B;
  const barH = iH/n - 12;

  const t0 = new Date(filas[0].fecha_lunes).getTime();
  const t1 = new Date(filas[filas.length-1].fecha_lunes).getTime();
  const xT = iso => PAD_L + ((new Date(iso).getTime()-t0)/(t1-t0))*iW;

  // marcas semestrales
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  let cur = new Date(filas[0].fecha_lunes); cur.setDate(1);
  while (cur.getTime() <= t1) {
    if (cur.getMonth()%6===0) {
      const iso = cur.toISOString().slice(0,10);
      const x = xT(iso);
      svg += `<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${H-PAD_B}" stroke="${COLOR_GRID}"/>`;
      svg += `<text x="${x}" y="${H-PAD_B+18}" text-anchor="middle" font-size="10" fill="${COLOR_TENUE}">${cur.getFullYear()%100===0?cur.getFullYear():FORMATO_MES(iso)}</text>`;
    }
    cur.setMonth(cur.getMonth()+1);
  }

  // línea hoy
  const hoy = new Date().toISOString().slice(0,10);
  if (hoy >= filas[0].fecha_lunes && hoy <= filas[filas.length-1].fecha_lunes) {
    const xH = xT(hoy);
    svg += `<line x1="${xH}" y1="${PAD_T-6}" x2="${xH}" y2="${H-PAD_B}" stroke="${COLOR_ACENTO}" stroke-width="1.5" stroke-dasharray="3,3"/>`;
    svg += `<text x="${xH}" y="${PAD_T-10}" text-anchor="middle" font-size="10" fill="${COLOR_ACENTO}" font-weight="600">hoy</text>`;
  }

  // barras por lote
  D.galpones.forEach((g, i) => {
    const yB = PAD_T + i*(iH/n) + 6;
    const col = COLMAP[g.id];
    svg += `<text x="${PAD_L-8}" y="${yB+barH/2+4}" text-anchor="end" font-size="11" fill="${col}" font-weight="600">${g.id}</text>`;

    // segmentos
    let prev = null, prevIso = null;
    filas.forEach((f, idx) => {
      const est = f[g.id].estado;
      if (est !== prev) {
        if (prev && prev !== 'no nacido') {
          const x1=xT(prevIso), x2=xT(f.fecha_lunes), w=Math.max(2,x2-x1);
          const fill = prev==='postura' ? col : PALETA_ESTADO[prev];
          if (fill !== 'transparent')
            svg += `<rect x="${x1}" y="${yB}" width="${w}" height="${barH}" fill="${fill}" opacity="${prev==='postura'?1:0.55}"/>`;
        }
        prev=est; prevIso=f.fecha_lunes;
      }
      if (idx===filas.length-1 && prev!=='no nacido') {
        const x1=xT(prevIso), x2=xT(f.fecha_lunes), w=Math.max(2,x2-x1);
        const fill = prev==='postura' ? col : PALETA_ESTADO[prev];
        if (fill!=='transparent')
          svg += `<rect x="${x1}" y="${yB}" width="${w}" height="${barH}" fill="${fill}" opacity="${prev==='postura'?1:0.55}"/>`;
      }
    });

    // hito pico
    const xPico = xT(g.fecha_pico_estimada);
    svg += `<circle cx="${xPico}" cy="${yB+barH/2}" r="3.5" fill="white" stroke="${col}" stroke-width="2"/>`;
  });

  svg += '</svg>';
  document.getElementById('cronograma-svg').innerHTML = svg;
}

// ============================================================
// PRODUCCIÓN — líneas SVG dinámicas
// ============================================================
function pintarProduccion() {
  const filas = D.proyeccion_semanal;
  const W=1100, H=360, PAD_L=72, PAD_R=30, PAD_T=20, PAD_B=50;
  const iW=W-PAD_L-PAD_R, iH=H-PAD_T-PAD_B;

  const t0=new Date(filas[0].fecha_lunes).getTime();
  const t1=new Date(filas[filas.length-1].fecha_lunes).getTime();
  const xT = iso => PAD_L+((new Date(iso).getTime()-t0)/(t1-t0))*iW;

  const maxV = Math.max(...filas.map(f=>f.total.huevos_semana))*1.12;
  const yV = v => PAD_T+iH-(v/maxV)*iH;

  const pathD = (acc) => filas.map((f,i)=>`${i===0?'M':'L'}${xT(f.fecha_lunes).toFixed(1)},${yV(acc(f)).toFixed(1)}`).join(' ');

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

  // grids horizontales
  for (let i=0;i<=5;i++) {
    const v=(maxV/5)*i, y=yV(v);
    svg += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" stroke="${COLOR_GRID}"/>`;
    svg += `<text x="${PAD_L-6}" y="${y+4}" text-anchor="end" font-size="10" fill="${COLOR_TENUE}">${NUM(v)}</text>`;
  }
  svg += `<text x="16" y="${PAD_T+iH/2}" text-anchor="middle" font-size="10" fill="${COLOR_TEXTO}" transform="rotate(-90 16 ${PAD_T+iH/2})">huevos / semana</text>`;

  // eje x
  let cur=new Date(filas[0].fecha_lunes); cur.setDate(1);
  while (cur.getTime()<=t1) {
    if (cur.getMonth()%6===0) {
      const iso=cur.toISOString().slice(0,10), x=xT(iso);
      svg+=`<text x="${x}" y="${PAD_T+iH+18}" text-anchor="middle" font-size="10" fill="${COLOR_TENUE}">${FORMATO_MES(iso)}</text>`;
    }
    cur.setMonth(cur.getMonth()+1);
  }

  // línea hoy
  const hoy=new Date().toISOString().slice(0,10);
  if (hoy>=filas[0].fecha_lunes&&hoy<=filas[filas.length-1].fecha_lunes) {
    const xH=xT(hoy);
    svg+=`<line x1="${xH}" y1="${PAD_T}" x2="${xH}" y2="${PAD_T+iH}" stroke="${COLOR_ACENTO}" stroke-width="1" stroke-dasharray="3,3"/>`;
  }

  // sombrear periodos de crianza (gaps de producción)
  let enGap=false, gapIni=null;
  filas.forEach(f => {
    const prod = f.total.huevos_semana>0;
    if (!prod && !enGap) { enGap=true; gapIni=f.fecha_lunes; }
    if (prod && enGap)   { enGap=false; const x1=xT(gapIni),x2=xT(f.fecha_lunes); svg+=`<rect x="${x1}" y="${PAD_T}" width="${x2-x1}" height="${iH}" fill="#f5f5f5" opacity="0.7"/>`; }
  });

  // series individuales (opacidad reducida)
  IDS.forEach(id => {
    svg += `<path d="${pathD(f=>f[id].huevos_semana)}" stroke="${COLMAP[id]}" stroke-width="1.5" fill="none" opacity="0.6" stroke-linejoin="round"/>`;
  });
  // total grueso encima
  svg += `<path d="${pathD(f=>f.total.huevos_semana)}" stroke="${COLOR_TOTAL}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`;

  // eje base
  svg += `<line x1="${PAD_L}" y1="${PAD_T+iH}" x2="${W-PAD_R}" y2="${PAD_T+iH}" stroke="${COLOR_TENUE}"/>`;
  svg += '</svg>';
  document.getElementById('produccion-svg').innerHTML = svg;
}

// ============================================================
// TRANSICIONES — detalle de cada cambio de lote
// ============================================================
function pintarTransiciones() {
  const filas = D.proyeccion_semanal;

  // Detectar transiciones: semanas donde total=0 (crianza sin solapamiento)
  const gaps = [];
  let ini = null;
  filas.forEach(f => {
    if (f.total.huevos_semana===0 && f.total.aves_en_postura===0) {
      // ver si hay algún lote en crianza
      const enCrianza = IDS.some(id => f[id].estado==='crianza');
      if (enCrianza && !ini) ini = f.fecha_lunes;
    } else {
      if (ini) { gaps.push({ini, fin:f.fecha_lunes}); ini=null; }
    }
  });

  // Stats de cada gap
  const statsHtml = gaps.slice(0,5).map((g,i) => {
    const wks = Math.round((new Date(g.fin)-new Date(g.ini))/(7*86400*1000));
    // semana anterior al gap: último valor de producción
    const prevFila = filas.filter(f=>f.fecha_lunes<g.ini&&f.total.huevos_dia>0).slice(-1)[0];
    const nextFila = filas.filter(f=>f.fecha_lunes>=g.fin&&f.total.huevos_dia>0)[0];
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
    '<div class="valle-stat"><span class="valle-stat-lbl">Sin transiciones en el horizonte visible</span></div>';

  // Mini gráfico SVG: huevos/día en la primera transición
  if (!gaps.length) { document.getElementById('valle-svg').innerHTML=''; return; }
  const g0 = gaps[0];
  const ventana = filas.filter(f => f.fecha_lunes >= addWeeks(g0.ini,-8) && f.fecha_lunes <= addWeeks(g0.fin,8));
  if (ventana.length < 3) return;

  const W=900,H=280,PAD_L=70,PAD_R=30,PAD_T=30,PAD_B=50;
  const iW=W-PAD_L-PAD_R,iH=H-PAD_T-PAD_B;
  const maxV=Math.max(...ventana.map(f=>f.total.huevos_dia),1)*1.15;
  const yV=v=>PAD_T+iH-(v/maxV)*iH;
  const xI=i=>PAD_L+(i/(ventana.length-1))*iW;

  let svg=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=0;i<=4;i++){const v=(maxV/4)*i,y=yV(v);svg+=`<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" stroke="${COLOR_GRID}"/>`;svg+=`<text x="${PAD_L-6}" y="${y+4}" text-anchor="end" font-size="10" fill="${COLOR_TENUE}">${NUM(v)}</text>`;}
  svg+=`<text x="16" y="${PAD_T+iH/2}" text-anchor="middle" font-size="10" fill="${COLOR_TEXTO}" transform="rotate(-90 16 ${PAD_T+iH/2})">huevos/día</text>`;

  // zona de gap
  const xG1=xI(ventana.findIndex(f=>f.fecha_lunes>=g0.ini));
  const xG2=xI(ventana.findIndex(f=>f.fecha_lunes>=g0.fin));
  if(xG1<xG2) svg+=`<rect x="${xG1}" y="${PAD_T}" width="${xG2-xG1}" height="${iH}" fill="${COLOR_ACENTO}" opacity="0.08"/>`;
  svg+=`<text x="${(xG1+xG2)/2}" y="${PAD_T+14}" text-anchor="middle" font-size="10" fill="${COLOR_ACENTO}" font-weight="600">crianza L2</text>`;

  // barras apiladas por lote
  const wBar=iW/ventana.length*0.65;
  ventana.forEach((f,i) => {
    const x=xI(i)-wBar/2; let yAcum=yV(0);
    IDS.forEach(id => {
      const v=f[id].huevos_dia;
      if(v>0){const h=(v/maxV)*iH;yAcum-=h;svg+=`<rect x="${x}" y="${yAcum}" width="${wBar}" height="${h}" fill="${COLMAP[id]}" opacity="0.85"/>`;}
    });
  });

  // eje x
  ventana.forEach((f,i)=>{
    if(i%2===0){const[,m,d]=f.fecha_lunes.split('-');svg+=`<text x="${xI(i)}" y="${PAD_T+iH+16}" text-anchor="middle" font-size="9" fill="${COLOR_TENUE}" transform="rotate(-30 ${xI(i)} ${PAD_T+iH+16})">${d}/${m}</text>`;}
  });
  svg+=`<line x1="${PAD_L}" y1="${PAD_T+iH}" x2="${W-PAD_R}" y2="${PAD_T+iH}" stroke="${COLOR_TENUE}"/>`;
  svg+='</svg>';
  document.getElementById('valle-svg').innerHTML = svg;
}

function addWeeks(iso, w) {
  const d = new Date(iso); d.setDate(d.getDate()+w*7); return d.toISOString().slice(0,10);
}

// ============================================================
// ANUAL — cards dinámicas
// ============================================================
function pintarAnual() {
  const porAnio = {};
  D.proyeccion_semanal.forEach(f => {
    if (!porAnio[f.anio]) { porAnio[f.anio] = { total:0 }; IDS.forEach(id=>porAnio[f.anio][id]=0); }
    IDS.forEach(id => porAnio[f.anio][id] += f[id].huevos_semana);
    porAnio[f.anio].total += f.total.huevos_semana;
  });

  const anios = Object.keys(porAnio).sort();
  const primerA = anios[0], ultimoA = anios[anios.length-1];

  const html = anios.map(a => {
    const da = porAnio[a];
    const parcial = (a===primerA||a===ultimoA);
    const docenas = Math.round(da.total/12);
    const detalles = IDS.map(id => da[id]>0
      ? `<div class="anual-detalle-item"><span class="anual-detalle-lbl" style="color:${COLMAP[id]}">${id}</span><span class="anual-detalle-val">${NUM(da[id])}</span></div>`
      : '').join('');
    return `
      <article class="anual-card${parcial?' parcial':''}">
        <div class="anual-anio">año ${a}${parcial?' *':''}</div>
        <div class="anual-total">${NUM(da.total)}</div>
        <div class="anual-unidad">huevos · ${NUM(docenas)} docenas</div>
        ${parcial?'<div class="anual-parcial">año parcial</div>':''}
        <div class="anual-detalle">${detalles}</div>
      </article>`;
  }).join('');

  document.getElementById('anual-grid').innerHTML = html + `
    <p class="anual-nota">* Años parciales (inicio/fin del horizonte de simulación).
    Durante años completos en régimen: ~${NUM(Math.round(
      anios.filter(a=>!([primerA,ultimoA].includes(a))).map(a=>porAnio[a].total)
        .reduce((s,v,_,arr)=>s+v/arr.length,0)
    ))} huevos/año.</p>`;
}

// ============================================================
// TABLA — cabeceras y filas dinámicas
// ============================================================
function pintarTabla() {
  const thead = document.querySelector('#tabla-semanal thead');
  const cols = IDS.map(id=>`<th class="grupo-g1" colspan="3" style="background:${COLMAP[id]}22;color:${COLMAP[id]}">${id}</th>`).join('');
  const subcols = IDS.map(()=>`<th>Sem</th><th>Estado</th><th>Huev/día</th>`).join('');
  thead.innerHTML = `
    <tr><th rowspan="2">Sem cal.</th><th rowspan="2">Fecha</th>${cols}<th class="grupo-tot" colspan="2">Total</th></tr>
    <tr>${subcols}<th class="grupo-tot">Aves</th><th class="grupo-tot">Huev/día</th></tr>`;

  document.getElementById('filtro-anio').addEventListener('change', renderTabla);
  document.getElementById('filtro-produccion').addEventListener('change', renderTabla);
  renderTabla();
}

function poblarFiltros() {
  const anios = [...new Set(D.proyeccion_semanal.map(f=>f.anio))].sort();
  const sel = document.getElementById('filtro-anio');
  anios.forEach(a => { const o=document.createElement('option'); o.value=a; o.textContent=a; sel.appendChild(o); });
}

function renderTabla() {
  const anioSel = document.getElementById('filtro-anio').value;
  const soloP   = document.getElementById('filtro-produccion').checked;
  let filas = D.proyeccion_semanal;
  if (anioSel!=='todos') filas=filas.filter(f=>f.anio===Number(anioSel));
  if (soloP) filas=filas.filter(f=>f.total.huevos_dia>0);

  const tbody = document.querySelector('#tabla-semanal tbody');
  tbody.innerHTML = filas.map(f => {
    const celdas = IDS.map(id => {
      const r=f[id];
      const est=r.estado;
      const cls=est==='postura'?'estado-postura':est==='crianza'?'estado-crianza':'';
      return `<td>${r.sem_vida||'—'}</td><td class="estado ${cls}">${est}</td><td>${r.huevos_dia>0?NUM(r.huevos_dia):'—'}</td>`;
    }).join('');
    return `<tr>
      <td>${f.semana_cal}</td>
      <td class="fecha">${FORMATO_FECHA(f.fecha_lunes)}</td>
      ${celdas}
      <td class="total-celda">${NUM(f.total.aves_en_postura)}</td>
      <td class="total-celda">${f.total.huevos_dia>0?NUM(f.total.huevos_dia):'—'}</td>
    </tr>`;
  }).join('');
  document.getElementById('tabla-conteo').textContent = `${filas.length} semanas`;
}

// ============================================================
cargar();
