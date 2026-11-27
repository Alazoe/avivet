/* Redes causales AviVet — una app, un archivo de datos por problema (datos/<id>.json).
   Rutas: #/  ·  #/<id>  ·  #/<id>/red/<nodo>  ·  #/<id>/brote
   El formato de los datos está en README.md. */
'use strict';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Markdown mínimo: **negrita** y *cursiva*
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
const ls = {
  get(k){ try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};

const TIPOS = {
  o:{c:'--origen', t:'ORIGEN', col:0, ley:'Factor de origen (manejo, genética, sanidad)'},
  p:{c:'--prev', t:'PROTECTOR', col:0, ley:'Factor protector'},
  m:{c:'--mecanismo', t:'MECANISMO', col:1, ley:'Mecanismo'},
  e:{c:'--evento', t:'EVENTO', col:2, ley:'Evento'},
  x:{c:'--consec', t:'CONSECUENCIA', col:3, ley:'Consecuencia'}
};
const COLX = [20, 320, 620, 900], COLS = ['FACTORES DE ORIGEN','MECANISMOS','EVENTO','CONSECUENCIAS'];
const W = 240, H = 56, VW = 1160;

/* ---------- carga de datos ---------- */
const cache = {};
async function getJSON(path){
  if (!cache[path]) cache[path] = fetch(path, {cache:'no-cache'}).then(r => { if(!r.ok) throw new Error(path+' → '+r.status); return r.json(); });
  return cache[path];
}
const indice = () => getJSON('datos/indice.json');
const factores = () => getJSON('datos/factores.json');
const problema = id => getJSON('datos/' + encodeURIComponent(id) + '.json');

/* ---------- router ---------- */
window.addEventListener('hashchange', route);
route();

async function route(){
  const [, id, vista, nodo] = (location.hash.replace(/^#\/?/, '#/').split('/'));
  const app = $('app');
  try {
    const idx = await indice();
    if (!id){ setCab(null); return portada(idx); }
    const meta = idx.problemas.find(p => p.id === id);
    if (!meta || meta.estado !== 'listo'){ setCab(meta || {id, titulo:id}); app.innerHTML = `<section class="card"><h2>${esc(meta ? meta.titulo : id)}</h2><p>Este problema todavía no tiene red causal publicada.</p><p><a href="#/">Volver a la portada</a></p></section>`; return; }
    const d = await problema(id);
    setCab(d, vista === 'brote' ? 'brote' : 'red');
    if (vista === 'brote') vistaBrote(d); else vistaRed(d, nodo ? decodeURIComponent(nodo) : null);
    document.title = `${d.titulo} · Redes causales AviVet`;
  } catch(e){
    app.innerHTML = `<div class="error"><b>No se pudieron cargar los datos.</b><br>${esc(e.message)}<br><span class="nota">Si abrió el archivo directamente desde el disco, use un servidor local (ver README).</span></div>`;
  }
}

function setCab(d, vista){
  const miga = $('miga'), tabs = $('tabs');
  if (!d){ miga.innerHTML = ''; tabs.classList.add('oculto'); document.title = 'Redes causales · AviVet'; window.scrollTo(0,0); return; }
  miga.innerHTML = `<a href="#/">Problemas</a> › ${esc(d.titulo)}`;
  if (!vista){ tabs.classList.add('oculto'); return; }
  tabs.classList.remove('oculto');
  $('tabsc').innerHTML = `<a class="tab" href="#/${d.id}/red" ${vista==='red'?'aria-current="page"':''}>Red causal</a>`
    + (d.brote ? `<a class="tab" href="#/${d.id}/brote" ${vista==='brote'?'aria-current="page"':''}>Investigar un brote</a>` : '');
}

/* ---------- portada ---------- */
async function portada(idx){
  const fac = await factores();
  const listos = idx.problemas.filter(p => p.estado === 'listo');
  const datos = await Promise.all(listos.map(p => problema(p.id).catch(() => null)));
  const porId = Object.fromEntries(listos.map((p,i) => [p.id, datos[i]]));

  const cards = idx.problemas.map(p => {
    const d = porId[p.id];
    if (p.estado === 'listo' && d) return `<article class="card prob"><span class="estado">Disponible</span><h2>${esc(d.titulo)}</h2><p class="nota">${md(d.resumen)}</p>
      <p class="nota">${d.red.nodos.length} nodos · ${d.red.medidas.length} medidas${d.brote ? ` · ${d.brote.hipotesis.length} hipótesis de brote` : ''}</p>
      <div class="acciones"><a class="btn prim" href="#/${p.id}/red">Red causal</a>${d.brote ? `<a class="btn" href="#/${p.id}/brote">Investigar un brote</a>` : ''}</div></article>`;
    return `<article class="card prob prep"><span class="estado">En preparación</span><h2>${esc(p.titulo)}</h2>${p.wiki ? `<p class="nota">Base en la wiki: <code>${esc(p.wiki)}</code></p>` : ''}</article>`;
  }).join('');

  // factores compartidos: qué nodos de cada problema usan cada factor
  const filas = fac.factores.map(f => {
    const usos = listos.flatMap(p => (porId[p.id]?.red.nodos || []).filter(n => n.factor === f.id).map(n => ({p, n})));
    const probs = new Set(usos.map(u => u.p.id));
    return {f, usos, n: probs.size};
  }).sort((a,b) => b.n - a.n);

  $('app').innerHTML = `
  <section><div class="eyebrow">Wiki AviVet · ponedoras</div><h1>Redes causales y árboles de investigación</h1>
    <p class="lead">Cada problema tiene una red causal (qué lo provoca, cómo y qué medidas lo cortan) y, cuando corresponde, un árbol para investigar un brote en un lote. Los problemas comparten factores: corregir uno puede prevenir varios.</p></section>
  <section class="problemas">${cards}</section>
  <section class="card mapa"><h2>Cómo se conectan los problemas</h2><p class="nota">Las flechas indican que un problema causa o agrava otro.${idx.problemas.some(p => p.estado !== 'listo') ? ' Los círculos punteados están en preparación.' : ''}</p>${mapaSVG(idx)}</section>
  <section class="card"><h2>Factores compartidos</h2><p class="nota">Factores del catálogo común (<code>datos/factores.json</code>) y dónde aparecen en cada red. Toque un nodo para abrirlo.</p>
    <div class="tabla"><table><thead><tr><th>Factor</th><th>Aparece en</th><th>Tema en la wiki</th></tr></thead><tbody>
    ${filas.map(({f, usos}) => `<tr><td>${esc(f.nombre)}</td><td>${usos.length ? usos.map(u => `<a class="chip" href="#/${u.p.id}/red/${u.n.id}">${esc(u.p.id)} · ${esc(u.n.texto[0])}</a>`).join('') : '<span class="nota">—</span>'}</td><td><code>${esc(f.wiki || '')}</code></td></tr>`).join('')}
    </tbody></table></div></section>`;
  window.scrollTo(0,0);
}

function mapaSVG(idx){
  const P = idx.problemas, n = P.length, cx = 380, cy = 170, R = n > 1 ? 120 : 0;
  const pos = Object.fromEntries(P.map((p,i) => { const a = -Math.PI/2 + i * 2*Math.PI/n; return [p.id, {x: cx + R*1.6*Math.cos(a), y: cy + R*Math.sin(a)}]; }));
  const r = 54;
  const rels = (idx.relaciones || []).filter(e => pos[e.de] && pos[e.a]).map(e => {
    const s = pos[e.de], t = pos[e.a], dx = t.x - s.x, dy = t.y - s.y, L = Math.hypot(dx,dy) || 1;
    const ux = dx/L, uy = dy/L, nx = -uy*14, ny = ux*14; // desplazado para que ida y vuelta no se monten
    const x1 = s.x + ux*r + nx, y1 = s.y + uy*r + ny, x2 = t.x - ux*(r+4) + nx, y2 = t.y - uy*(r+4) + ny;
    return `<path class="rel" d="M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}" marker-end="url(#mapar)"><title>${esc(e.texto)}</title></path>`;
  }).join('');
  const nodos = P.map((p,i) => {
    const {x,y} = pos[p.id], listo = p.estado === 'listo';
    const col = ['--evento','--origen','--consec','--mecanismo','--prev'][i % 5];
    const palabras = (p.corto || p.titulo).split(/\s+/), lin = []; let cur = '';
    palabras.forEach(w => { if ((cur + ' ' + w).trim().length > 14 && cur){ lin.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) lin.push(cur);
    const ls3 = lin.slice(0,3);
    const txt = ls3.map((l,j) => `<text x="${x}" y="${y + (j - (ls3.length-1)/2)*15 + 4}">${esc(l)}</text>`).join('');
    const g = `<g class="pn${listo ? '' : ' prep'}"><circle cx="${x}" cy="${y}" r="${r}" style="stroke:var(${col})"/>${txt}</g>`;
    return listo ? `<a href="#/${p.id}/red" aria-label="${esc(p.titulo)}">${g}</a>` : g;
  }).join('');
  return `<svg viewBox="0 0 760 340" role="img" aria-label="Mapa de relaciones entre problemas"><defs><marker id="mapar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--text3)"/></marker></defs>${rels}${nodos}</svg>
  <ul class="nota">${(idx.relaciones||[]).map(e => `<li><b>${esc(nombre(idx,e.de))} → ${esc(nombre(idx,e.a))}:</b> ${esc(e.texto)}</li>`).join('')}</ul>`;
}
const nombre = (idx, id) => { const p = idx.problemas.find(p => p.id === id); return p ? (p.corto || p.titulo) : id; };

/* ---------- vista: red causal ---------- */
function vistaRed(d, nodoInicial){
  const R = d.red, fuentesNum = Object.fromEntries(d.fuentes.map((f,i) => [f.id, i+1]));
  const refs = ids => [...(ids || [])].sort((x,y) => (fuentesNum[x]||999) - (fuentesNum[y]||999)).map(id => fuentesNum[id] ? `<a href="#/${d.id}/red" data-f="${fuentesNum[id]}">${fuentesNum[id]}</a>` : esc(id)).join(', ');
  const tiposUsados = [...new Set(R.nodos.map(n => n.tipo))];
  const v = R.ventanas;
  const pct = s => ((s - v.desde) / (v.hasta - v.desde) * 100);

  $('app').innerHTML = `
  <section><div class="eyebrow">${esc(d.especie)} · red causal</div><h1>${esc(d.titulo)}: red causal y prevención</h1>
    <p class="lead">${md(d.resumen)} Toque un nodo para ver qué lo provoca, a qué lleva y qué medidas lo cortan; toque una medida para ver en qué punto actúa.${d.brote ? ` Para un lote con problemas, use <a href="#/${d.id}/brote">Investigar un brote</a>.` : ''}</p>
    <div class="leyenda" style="margin-top:10px">${tiposUsados.map(t => `<span><i class="sw" style="background:var(${TIPOS[t].c})"></i>${TIPOS[t].ley}</span>`).join('')}<span><i class="sw" style="background:var(--prev)"></i>Punto que corta la medida seleccionada</span>${R.flechas.some(e => e.tipo === 'ciclo') ? '<span><i class="sw" style="background:none;border-top:2px dashed var(--consec);height:0;border-radius:0"></i>Ciclo que se retroalimenta</span>' : ''}${R.flechas.some(e => e.tipo === 'discutida') ? '<span><i class="sw" style="background:none;border-top:2px dashed var(--text3);height:0;border-radius:0"></i>Relación discutida</span>' : ''}${R.nodos.some(n => n.evidencia) ? '<span>A · B · C = evidencia fuerte, moderada, débil</span>' : ''}</div></section>
  <section class="net" aria-label="Red causal"><div class="svgbox"><svg id="g" role="img" aria-label="Red causal: ${esc(d.titulo)}"></svg></div><aside class="card panel" id="panel"></aside></section>
  ${v ? `<section class="card ventana"><h3>${esc(v.titulo)}</h3><div class="bar">${v.tramos.map(t => `<div class="risk${t.fuerte?' fuerte':''}" style="left:${pct(t.desde)}%;width:${pct(t.hasta)-pct(t.desde)}%"></div>`).join('')}</div>
    <div class="ticks">${v.marcas.map((m,i,a) => `<span style="left:${pct(m)}%;${i===0?'transform:none':i===a.length-1?'transform:translateX(-100%)':''}">${m}${i===a.length-1?' sem':''}</span>`).join('')}</div><p class="nota">${md(v.nota)}</p></section>` : ''}
  <section style="display:grid;gap:14px"><div><h2>Medidas preventivas</h2>${R.notaMedidas ? `<p class="nota">${md(R.notaMedidas)}</p>` : ''}</div><div class="medidas" id="medidas"></div></section>
  ${R.noFunciona?.length ? `<section class="card"><h2>Lo que no funciona</h2><div class="tabla"><table><thead><tr><th>Medida</th><th>Por qué</th></tr></thead><tbody>${R.noFunciona.map(([a,b]) => `<tr><td>${md(a)}</td><td>${md(b)}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
  <section class="card fuentes"><h2>Fuentes</h2><ol>${d.fuentes.map((f,i) => `<li id="f${i+1}">${f.url ? `<a href="${esc(f.url)}" target="_blank" rel="noopener">${md(f.cita)}</a>` : md(f.cita)}${f.wiki ? ` <span class="nota">· wiki: <code>${esc(f.wiki)}</code></span>` : ''}</li>`).join('')}</ol>
    ${d.notaFuentes ? `<p class="nota">${md(d.notaFuentes)}</p>` : ''}
    ${d.wiki ? `<p class="nota">Páginas de la wiki: ${d.wiki.map(w => `<code>${esc(w)}</code>`).join(', ')} · actualizado ${esc(d.actualizado || '')}</p>` : ''}</section>`;

  // posiciones: "y" del archivo; si no, columna 0 por grupos (o pareja) y las demás cerca de sus causas
  const N = R.nodos.map(n => ({...n, x: COLX[TIPOS[n.tipo].col], col: TIPOS[n.tipo].col}));
  const byId = Object.fromEntries(N.map(n => [n.id, n]));
  const E = R.flechas;
  const porCol = [0,1,2,3].map(c => N.filter(n => n.col === c));
  const GAP = 10, cabeceras = [];
  const libres = c => porCol[c].filter(n => n.y == null);
  if (R.grupos && libres(0).length){
    let y = 40;
    const orden = [...Object.keys(R.grupos), undefined];
    orden.forEach(g => { const ns = libres(0).filter(n => n.grupo === g || (g === undefined && !R.grupos[n.grupo])); if (!ns.length) return;
      if (g){ cabeceras.push([R.grupos[g], y + 12]); y += 20; }
      ns.forEach(n => { n.y = y; y += H + GAP; }); y += 10; });
  } else {
    const alto = Math.max(...porCol.map(c => c.length)) * 66 + 50;
    porCol.forEach(c => c.forEach((n,i) => { if (n.y == null) n.y = Math.round(40 + (i + .5) * ((alto - 50) / c.length) - H/2); }));
  }
  [1,2,3].forEach(c => {
    const ns = libres(c); if (!ns.length) return;
    ns.forEach(n => { const ps = E.filter(e => e.a === n.id && e.tipo !== 'ciclo' && byId[e.de].y != null && byId[e.de].col < c).map(e => byId[e.de].y);
      n.bc = ps.length ? ps.reduce((a,b) => a + b, 0) / ps.length : 40; });
    ns.sort((a,b) => a.bc - b.bc);
    let prev = 40; ns.forEach(n => { n.y = Math.max(prev, Math.round(n.bc)); prev = n.y + H + 24; });
  });
  const VH = Math.max(...N.map(n => n.y + H + 24));

  const svg = $('g'), NS = 'http://www.w3.org/2000/svg';
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const mk = (t, a = {}, p = svg) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  const defs = mk('defs');
  [['ar','--text3'],['arc','--consec'],['arp','--prev']].forEach(([id,c]) => { const m = mk('marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},defs); mk('path',{d:'M0,0 L10,5 L0,10 z',fill:`var(${c})`},m); });
  COLS.forEach((t,i) => { if (porCol[i].length) mk('text',{x:COLX[i],y:22,class:'colhead'}).textContent = t; });
  cabeceras.forEach(([t,y]) => { mk('text',{x:COLX[0],y,class:'grphead'}).textContent = t.toUpperCase(); });

  const edgeEls = E.map(e => {
    const s = byId[e.de], t = byId[e.a]; let dd;
    const ciclo = e.tipo === 'ciclo', prot = e.tipo === 'protege', disc = e.tipo === 'discutida';
    const tieneVuelta = E.some(o => o.tipo === 'ciclo' && o.de === e.a && o.a === e.de);
    if (ciclo){
      dd = `M${s.x},${s.y+H*.75} C${s.x-60},${s.y+H*.75} ${t.x+W+60},${t.y+H*.25} ${t.x+W},${t.y+H*.25}`;
    } else if (s.x === t.x){
      const y1 = s.y + H*.7, y2 = t.y + H*.3, der = s.x + W + 50 < VW, ex = der ? s.x + W : s.x, bx = der ? ex + 46 : ex - 30;
      dd = `M${ex},${y1} C${bx},${y1} ${bx},${y2} ${ex},${y2}`;
    } else {
      const x1 = s.x + W, y1 = s.y + H*(tieneVuelta ? .3 : .5), x2 = t.x, y2 = t.y + H/2, mx = (x1 + x2)/2;
      dd = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    }
    const el = mk('path', {d:dd, class:'edge' + (ciclo ? ' ciclo' : prot ? ' protege' : disc ? ' discutida' : ''),'marker-end':`url(#${ciclo ? 'arc' : prot ? 'arp' : 'ar'})`});
    return {...e, el};
  });

  N.forEach(n => {
    const g = mk('g', {class:'node', tabindex:0, role:'button', 'aria-label':n.texto.join(' ')}); n.g = g;
    const col = `var(${TIPOS[n.tipo].c})`;
    const r = mk('rect', {x:n.x, y:n.y, width:W, height:H, rx:8}, g); r.style.stroke = col;
    const tg = mk('text', {x:n.x+10, y:n.y+15, class:'tag'}, g); tg.textContent = TIPOS[n.tipo].t + (n.evidencia ? ' · ' + n.evidencia : ''); tg.style.fill = col;
    if (n.problema){ const l = mk('text', {x:n.x+W-10, y:n.y+15, class:'link', 'text-anchor':'end'}, g); l.textContent = '↗ ' + n.problema; }
    n.texto.forEach((ln,i) => { const t = mk('text', {x:n.x+10, y:n.y+32+i*16}, g); t.textContent = ln; if (n.central && i === 0){ t.classList.add('central'); t.style.fill = col; } });
    g.addEventListener('click', () => selectNode(n.id));
    g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); selectNode(n.id); } });
  });

  const reach = (id, adelante) => { const out = new Set([id]), q = [id];
    while (q.length){ const c = q.shift(); E.forEach(e => { if (e.tipo === 'ciclo') return; const [f,t] = adelante ? [e.de,e.a] : [e.a,e.de]; if (f === c && !out.has(t)){ out.add(t); q.push(t); } }); }
    return out; };
  const panel = $('panel'), nom = id => byId[id].texto.join(' ');
  const clearAll = () => { N.forEach(n => n.g.classList.remove('dim','sel','cut')); edgeEls.forEach(e => e.el.classList.remove('dim','hot')); document.querySelectorAll('.medida').forEach(p => { p.classList.remove('on'); p.setAttribute('aria-pressed','false'); }); };
  const intro = () => { clearAll(); panel.innerHTML = `<div class="kind" style="color:var(--text2)">Cómo leer la red</div><h3>${esc(R.intro?.titulo || 'Las flechas van de causa a efecto')}</h3><p>${md(R.intro?.texto || '')}</p><p class="nota">Toque cualquier caja o una medida preventiva.</p>`; };
  const bindReset = () => { const b = $('rst'); if (b) b.onclick = () => { history.replaceState(null, '', `#/${d.id}/red`); intro(); }; };
  panel.addEventListener('click', ev => { const a = ev.target.closest('a[data-f]'); if (a){ ev.preventDefault(); const li = $('f' + a.dataset.f); li.scrollIntoView({behavior:'smooth', block:'center'}); history.replaceState(null,'',`#/${d.id}/red`); } });

  function selectNode(id){
    const n = byId[id]; if (!n) return intro();
    clearAll(); const up = reach(id,false), dn = reach(id,true), on = new Set([...up,...dn]);
    N.forEach(m => { if (!on.has(m.id)) m.g.classList.add('dim'); }); n.g.classList.add('sel');
    edgeEls.forEach(e => { const hot = (up.has(e.de) && up.has(e.a)) || (dn.has(e.de) && dn.has(e.a)) || e.de === id || e.a === id; e.el.classList.add(hot ? 'hot' : 'dim'); });
    const causas = E.filter(e => e.a === id && e.tipo !== 'protege').map(e => nom(e.de));
    const reduce = E.filter(e => e.a === id && e.tipo === 'protege').map(e => nom(e.de));
    const efectos = E.filter(e => e.de === id).map(e => (e.tipo === 'protege' ? 'Reduce: ' : '') + nom(e.a));
    const meds = R.medidas.map((m,i) => ({...m, i})).filter(m => m.actua.includes(id));
    const hips = (d.brote?.hipotesis || []).filter(h => h.nodo === id || (h.nodos || []).includes(id));
    const lista = (t, xs) => xs.length ? `<div><b>${t}</b><ul>${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    panel.innerHTML = `<div class="kind" style="color:var(${TIPOS[n.tipo].c})">${TIPOS[n.tipo].t}${n.grupo && R.grupos?.[n.grupo] ? ' · ' + esc(R.grupos[n.grupo]) : ''}${n.evidencia ? ` <span class="ev">Evidencia ${esc(n.evidencia)}</span>` : ''}</div><h3>${esc(nom(id))}</h3><p>${md(n.detalle)}</p>
      ${n.cifras?.length ? `<div><b>Cifras</b><ul>${n.cifras.map(c => `<li>${md(c)}</li>`).join('')}</ul></div>` : ''}
      ${lista('Lo provoca', causas)}${lista('Lo reduce', reduce)}${lista('Lleva a', efectos)}
      <div><b>Medidas que actúan aquí</b><br>${meds.length ? meds.map(m => `<span class="chip">P${m.i+1} ${esc(m.titulo)}</span>`).join('') : '<span class="nota">Actúan sobre sus causas (ver arriba).</span>'}</div>
      ${hips.length ? `<div><b>En un brote</b><br>${hips.map(h => `<a class="chip" href="#/${d.id}/brote">${esc(h.id)} ${esc(h.titulo)}</a>`).join('')}</div>` : ''}
      ${n.problema ? `<p class="nota">Es también un problema propio: <a href="#/${esc(n.problema)}">${esc(n.problema)}</a>.</p>` : ''}
      <div class="nota">Fuentes: ${n.fuentes?.length ? refs(n.fuentes) : 'conocimiento clínico general'}</div>
      <button class="btn" type="button" id="rst">Ver toda la red</button>`;
    bindReset();
  }

  const pg = $('medidas');
  R.medidas.forEach((p,i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'medida'; b.setAttribute('aria-pressed','false');
    b.innerHTML = `<h3><b>P${i+1}</b>${esc(p.titulo)}</h3><ul>${p.puntos.map(l => `<li>${md(l)}</li>`).join('')}</ul><div class="meta">Corta: ${p.actua.map(a => esc(byId[a]?.texto.join(' ') || a)).join(' · ')}<br>Fuentes: ${p.fuentes.map(f => fuentesNum[f] || f).join(', ')}</div>`;
    b.onclick = () => {
      const was = b.classList.contains('on'); clearAll(); if (was) return intro();
      b.classList.add('on'); b.setAttribute('aria-pressed','true');
      const dn = new Set(); p.actua.forEach(a => reach(a,true).forEach(x => dn.add(x)));
      N.forEach(n => { if (p.actua.includes(n.id)) n.g.classList.add('cut'); else if (!dn.has(n.id)) n.g.classList.add('dim'); });
      edgeEls.forEach(e => e.el.classList.add(dn.has(e.de) && dn.has(e.a) ? 'hot' : 'dim'));
      panel.innerHTML = `<div class="kind" style="color:var(--prev)">Medida preventiva P${i+1}</div><h3>${esc(p.titulo)}</h3><p>Actúa en los nodos marcados en verde. Las flechas resaltadas muestran lo que deja de alimentar el problema.</p><ul>${p.puntos.map(l => `<li>${md(l)}</li>`).join('')}</ul><button class="btn" type="button" id="rst">Ver toda la red</button>`;
      bindReset();
      if (matchMedia('(max-width:1400px)').matches) document.querySelector('.svgbox').scrollIntoView({behavior:'smooth', block:'start'});
    };
    pg.appendChild(b);
  });

  if (nodoInicial && byId[nodoInicial]){ selectNode(nodoInicial); requestAnimationFrame(() => byId[nodoInicial].g.scrollIntoView?.({block:'center', inline:'center'})); }
  else { intro(); window.scrollTo(0,0); }
}

/* ---------- vista: investigar un brote ---------- */
// Admite opcionales: tipos (paso 0 con pesoTipo), pistas con pesos {H1:2}, respuestas ("lo que ya se hizo"),
// necropsia, seguir y pedir. Sin ejemplo, la edad parte vacía y no suma.
function vistaBrote(d){
  const B = d.brote, KEY = 'redes-causales:brote:' + d.id;
  const fnum = Object.fromEntries(d.fuentes.map((f,i) => [f.id, i+1]));
  const fref = ids => [...(ids || [])].sort((x,y) => (fnum[x]||999) - (fnum[y]||999)).map(f => fnum[f] || esc(f)).join(', ');
  const winFor = w => (B.ventanas.find(v => v.hasta == null || w < v.hasta) || B.ventanas[B.ventanas.length-1]).id;
  const ej = B.ejemplo, g = ls.get(KEY);
  let st = g ? {wk:g.wk ?? null, win:g.win ?? null, signs:new Set(g.signs || []), today:new Set(g.today || []), tipos:new Set(g.tipos || []), resp:new Set(g.resp || []), example:!!g.example}
             : {wk:ej?.semanas ?? null, win:ej ? winFor(ej.semanas) : null, signs:new Set(ej?.pistas || []), today:new Set(), tipos:new Set(ej?.tipos || []), resp:new Set(), example:!!ej};
  const save = () => ls.set(KEY, {wk:st.wk, win:st.win, signs:[...st.signs], today:[...st.today], tipos:[...st.tipos], resp:[...st.resp], example:st.example});
  const pista = Object.fromEntries(B.pistas.flatMap(gr => gr.pistas.map(p => [p.id, p])));
  const peso = (p, hid) => Array.isArray(p.apunta) ? (p.apunta.includes(hid) ? 2 : 0) : (p.apunta[hid] || 0);
  const conPesos = B.pistas.some(gr => gr.pistas.some(p => !Array.isArray(p.apunta)));
  const ul = xs => `<ul>${xs.map(x => `<li>${md(x)}</li>`).join('')}</ul>`;
  const plano = s => String(s).replace(/\*\*?(.+?)\*\*?/g, '$1');
  let n = 0; const paso = t => `<h2><span class="n">PASO ${n++}</span>${t}</h2>`;
  const nodoRed = h => h.nodo || (h.nodos || []).find(id => d.red.nodos.some(x => x.id === id));

  const p0 = `<section class="card">${paso(B.tipos ? '¿Qué tipo de problema es?' : 'Confirmar y medir')}${B.confirmar ? ul(B.confirmar) : ''}
      ${B.tipos ? `<div class="grupo" id="tipos"></div>` : ''}</section>`;
  const p1 = `<section class="card">${paso('Hoy, sirve para cualquier causa')}<div class="grupo" id="hoy"></div>${B.notaHoy ? `<p class="nota">${md(B.notaHoy)}</p>` : ''}</section>`;
  const p2 = `<section class="card">${paso('Edad del lote y pistas')}
      <div class="semanas"><label for="wk">${esc(B.etiquetaEdad || 'Edad al inicio del brote')}</label><input id="wk" type="number" min="0" max="120" step="1" inputmode="numeric" placeholder="—"> <span class="nota">semanas</span></div>
      <div class="seg" role="group" aria-label="Ventana de edad" id="win"></div>
      ${B.notaVentanas ? `<p class="nota">${md(B.notaVentanas)}</p>` : ''}
      ${ej ? `<div class="banner" id="exbanner"><span>Ejemplo cargado: ${esc(ej.texto)}.</span><button class="btn" type="button" id="clear">Empezar de cero</button></div>` : ''}
      ${B.notaPistas ? `<p class="nota">${md(B.notaPistas)}</p>` : ''}
      <div id="signs"></div></section>`;
  const p3 = B.respuestas ? `<section class="card">${paso('Lo que ya se hizo por el brote')}<p class="nota">No suma puntos: son respuestas, no causas. Cada una sale con lo que dice la evidencia y pasa al resumen.</p><div class="grupo" id="resp"></div><div id="respnotes" style="display:grid;gap:8px"></div></section>` : '';
  const pN = B.necropsia ? `<section class="card">${paso('Necropsia')}${ul(B.necropsia)}<p class="nota">Al marcar los hallazgos en el grupo Necropsia de las pistas, el orden se actualiza.</p></section>` : '';
  const pS = `<section class="card">${B.seguir ? paso('Corregir y seguir') + ul(B.seguir) : '<h2>Resumen para el productor</h2>'}
      ${B.pedir ? '<h3>Datos para pedir al productor</h3>' : '<p class="nota">Las tres hipótesis con más puntaje, con qué revisar y qué hacer. Se actualiza al marcar.</p>'}<textarea class="copy" id="ask" readonly></textarea>
      <div class="copyrow">${B.pedir ? '<button class="btn" type="button" id="copyAsk">Copiar lista para el productor</button>' : ''}<button class="btn" type="button" id="copySum">Copiar resumen de la investigación</button><button class="btn" type="button" id="limpiar">Limpiar marcas</button><span class="toast" id="toast" role="status"></span></div></section>`;

  $('app').innerHTML = `
  <section><div class="eyebrow">${esc(d.especie)} · investigación en terreno</div><h1>Brote de ${esc(d.titulo.toLowerCase())}: árbol de investigación</h1>
    <p class="lead">Marque la edad del lote y lo que observa. Las ${B.hipotesis.length} hipótesis se ordenan por las pistas que coinciden y cada una dice qué verificar. El orden es orientativo, no una probabilidad. Las causas y su mecanismo están en la <a href="#/${d.id}/red">red causal</a>.</p></section>
  <div class="row2">${p0}${p1}</div>
  <div class="brote"><div style="display:grid;gap:22px">${p2}${p3}</div>
    <section class="card" aria-live="polite"><h2><span class="n">RESULTADO</span>Hipótesis ordenadas</h2>
      <p class="nota">${md(B.notaPuntaje || 'Puntaje = peso de la ventana de edad (0–3) + 2 por cada pista marcada que apunta a la hipótesis.')}</p><div id="hyps" style="display:grid;gap:12px"></div></section></div>
  <div class="row2">${pN}${pS}</div>
  <section class="card"><h2><span class="n">FUENTES</span>De la wiki AviVet</h2><p class="nota">Los números remiten a la lista de fuentes de la <a href="#/${d.id}/red">red causal</a>. ${md(d.notaFuentes || '')}</p></section>`;
  window.scrollTo(0,0);

  const checks = (items, set, attr) => items.map(([id, texto, sub]) => `<label class="check${set.has(id)?' on':''}"><input type="checkbox" data-${attr}="${esc(id)}" ${set.has(id)?'checked':''}><span>${md(texto)}${sub ? `<br><span class="nota">${md(sub)}</span>` : ''}</span></label>`).join('');
  const toggle = (set, v, on) => on ? set.add(v) : set.delete(v);
  const noEjemplo = () => { st.example = false; if ($('exbanner')) $('exbanner').hidden = true; };

  function renderHoy(){ $('hoy').innerHTML = checks(B.hoy.map((t,i) => [String(i), t]), new Set([...st.today].map(String)), 'i'); }
  $('hoy').addEventListener('change', e => { const i = +e.target.dataset.i; toggle(st.today, i, e.target.checked); save(); renderHoy(); });
  function renderTipos(){ if (B.tipos) $('tipos').innerHTML = checks(B.tipos.map(t => [t.id, '**' + t.titulo + '**', t.pista]), st.tipos, 't'); }
  if (B.tipos) $('tipos').addEventListener('change', e => { toggle(st.tipos, e.target.dataset.t, e.target.checked); noEjemplo(); save(); renderTipos(); renderH(); });
  function renderWin(){ $('win').innerHTML = B.ventanas.map(w => `<button type="button" aria-pressed="${st.win===w.id}" data-w="${w.id}">${esc(w.titulo)} <span style="opacity:.75;font-size:12px">${esc(w.rango)}</span></button>`).join(''); }
  $('win').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.win = st.win === b.dataset.w ? null : b.dataset.w; save(); renderWin(); renderH(); });
  function renderSigns(){ $('signs').innerHTML = B.pistas.map(gr => `<div class="grupo"><div class="eyebrow">${esc(gr.grupo)}</div>${checks(gr.pistas.map(p => [p.id, p.texto]), st.signs, 's')}</div>`).join(''); }
  $('signs').addEventListener('change', e => { toggle(st.signs, e.target.dataset.s, e.target.checked); noEjemplo(); save(); renderSigns(); renderH(); });
  function renderResp(){ if (!B.respuestas) return;
    $('resp').innerHTML = checks(B.respuestas.map(r => [r.id, r.titulo]), st.resp, 'r');
    $('respnotes').innerHTML = B.respuestas.filter(r => st.resp.has(r.id)).map(r => `<div class="banner" style="display:block"><b>${esc(r.titulo)}.</b> ${md(r.nota)} <span class="nota">(fuentes ${fref(r.fuentes)})</span></div>`).join(''); }
  if (B.respuestas) $('resp').addEventListener('change', e => { toggle(st.resp, e.target.dataset.r, e.target.checked); save(); renderResp(); renderH(); });

  const ranked = () => B.hipotesis.map(h => {
    const pistas = [...st.signs].filter(s => pista[s] && peso(pista[s], h.id) > 0);
    const tipo = Math.max(0, ...[...st.tipos].map(t => h.pesoTipo?.[t] || 0));
    const prior = st.win ? (h.peso[st.win] || 0) : 0;
    const sp = pistas.reduce((a, s) => a + peso(pista[s], h.id), 0);
    return {...h, pistas, tipo, prior, sp, score: tipo + prior + sp};
  }).sort((a,b) => b.score - a.score || b.pistas.length - a.pistas.length);

  function resumen(){
    const r = ranked().filter(h => h.score > 0).slice(0,3), w = B.ventanas.find(x => x.id === st.win);
    const tipos = B.tipos ? [...st.tipos].map(t => B.tipos.find(x => x.id === t)?.titulo).filter(Boolean) : [];
    const resp = (B.respuestas || []).filter(x => st.resp.has(x.id));
    return [`Brote de ${d.titulo.toLowerCase()} — ${st.wk != null ? `lote de ${st.wk} semanas` : 'edad sin indicar'}${w ? ` (${w.titulo})` : ''}`,
      tipos.length ? 'Tipo: ' + tipos.join('; ') : '',
      'Pistas: ' + ([...st.signs].map(s => plano(pista[s]?.texto || s)).join('; ') || 'ninguna marcada'),
      '', r.length ? 'Hipótesis principales:' : 'Sin hipótesis con puntaje: marque edad, tipo o pistas.',
      ...r.map(h => `\n${h.id} ${h.titulo} (${h.score} pts)\nRevisar:\n${h.verificar.map(v => '  - ' + plano(v)).join('\n')}\nHacer:\n${h.hacer.map(v => '  - ' + plano(v)).join('\n')}`),
      resp.length ? '\nLo que ya se hizo:\n' + resp.map(x => `  - ${x.titulo}: ${plano(x.nota)}`).join('\n') : '',
      '\nHoy, en todos los casos:\n' + B.hoy.map(x => '  - ' + plano(x)).join('\n')].filter(x => x !== '').join('\n');
  }
  function renderH(){
    const r = ranked(), max = Math.max(...r.map(x => x.score), 1);
    $('hyps').innerHTML = r.map((h,i) => `<article class="hyp${i===0 && h.score>0 ? ' top' : ''}">
      <header><h3>${esc(h.id)} · ${esc(h.titulo)}</h3><span class="score">${h.score} pts</span></header>
      <div class="barra"><i style="width:${Math.round(h.score/max*100)}%"></i></div>
      <div class="chips">${h.tipo ? `<span class="pchip prior">tipo: +${h.tipo}</span>` : ''}${h.prior ? `<span class="pchip prior">edad: +${h.prior}</span>` : ''}${h.pistas.map(p => `<span class="pchip">${md(pista[p].texto)}${conPesos ? ` +${peso(pista[p], h.id)}` : ''}</span>`).join('')}</div>
      <details ${i<3 && h.score>0 ? 'open' : ''}><summary>Qué verificar y qué hacer</summary>
        <div class="cols"><div><b>Verificar</b>${ul(h.verificar)}</div><div><b>Hacer</b>${ul(h.hacer)}</div></div>
        <p class="src">Fuentes: ${fref(h.fuentes) || '—'}${nodoRed(h) ? ` · <a href="#/${d.id}/red/${nodoRed(h)}">ver en la red causal</a>` : ''}</p></details></article>`).join('');
    if (!B.pedir) $('ask').value = resumen();
  }
  $('wk').value = st.wk ?? '';
  $('wk').addEventListener('input', e => { const w = parseInt(e.target.value, 10); if (isNaN(w)){ st.wk = null; st.win = null; } else { st.wk = w; st.win = winFor(w); } save(); renderWin(); renderH(); });
  if ($('clear')) $('clear').onclick = () => { st.signs.clear(); st.tipos.clear(); noEjemplo(); save(); renderTipos(); renderSigns(); renderH(); };
  if ($('exbanner')) $('exbanner').hidden = !st.example;
  $('limpiar').onclick = () => { st = {wk:null, win:null, signs:new Set(), today:new Set(), tipos:new Set(), resp:new Set(), example:false}; save(); $('wk').value = ''; if ($('exbanner')) $('exbanner').hidden = true; renderAll(); };
  if (B.pedir) $('ask').value = B.pedir.map(x => '- ' + plano(x)).join('\n');
  function copy(text){
    const done = () => { $('toast').textContent = 'Copiado'; setTimeout(() => $('toast').textContent = '', 2000); };
    const fallback = () => { $('ask').value = text; $('ask').select(); $('toast').textContent = 'Seleccionado: copie con Ctrl/Cmd+C'; };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch(e){ fallback(); }
  }
  if (B.pedir) $('copyAsk').onclick = () => copy(`Para investigar el brote de ${d.titulo.toLowerCase()} necesito:\n` + B.pedir.map(x => '- ' + plano(x)).join('\n'));
  $('copySum').onclick = () => copy(resumen());
  function renderAll(){ renderHoy(); renderTipos(); renderWin(); renderSigns(); renderResp(); renderH(); }
  renderAll();
}
