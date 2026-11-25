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
  <section class="card mapa"><h2>Cómo se conectan los problemas</h2><p class="nota">Las flechas indican que un problema causa o agrava otro. Los círculos punteados están en preparación.</p>${mapaSVG(idx)}</section>
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
  const refs = ids => (ids || []).map(id => fuentesNum[id] ? `<a href="#/${d.id}/red" data-f="${fuentesNum[id]}">${fuentesNum[id]}</a>` : esc(id)).join(', ');
  const tiposUsados = [...new Set(R.nodos.map(n => n.tipo))];
  const v = R.ventanas;
  const pct = s => ((s - v.desde) / (v.hasta - v.desde) * 100);

  $('app').innerHTML = `
  <section><div class="eyebrow">${esc(d.especie)} · red causal</div><h1>${esc(d.titulo)}: red causal y prevención</h1>
    <p class="lead">${md(d.resumen)} Toque un nodo para ver qué lo provoca, a qué lleva y qué medidas lo cortan; toque una medida para ver en qué punto actúa.${d.brote ? ` Para un lote con problemas, use <a href="#/${d.id}/brote">Investigar un brote</a>.` : ''}</p>
    <div class="leyenda" style="margin-top:10px">${tiposUsados.map(t => `<span><i class="sw" style="background:var(${TIPOS[t].c})"></i>${TIPOS[t].ley}</span>`).join('')}<span><i class="sw" style="background:var(--prev)"></i>Punto que corta la medida seleccionada</span></div></section>
  <section class="net" aria-label="Red causal"><div class="svgbox"><svg id="g" role="img" aria-label="Red causal: ${esc(d.titulo)}"></svg></div><aside class="card panel" id="panel"></aside></section>
  ${v ? `<section class="card ventana"><h3>${esc(v.titulo)}</h3><div class="bar">${v.tramos.map(t => `<div class="risk${t.fuerte?' fuerte':''}" style="left:${pct(t.desde)}%;width:${pct(t.hasta)-pct(t.desde)}%"></div>`).join('')}</div>
    <div class="ticks">${v.marcas.map((m,i,a) => `<span style="left:${pct(m)}%;${i===0?'transform:none':i===a.length-1?'transform:translateX(-100%)':''}">${m}${i===a.length-1?' sem':''}</span>`).join('')}</div><p class="nota">${md(v.nota)}</p></section>` : ''}
  <section style="display:grid;gap:14px"><div><h2>Medidas preventivas</h2>${R.notaMedidas ? `<p class="nota">${md(R.notaMedidas)}</p>` : ''}</div><div class="medidas" id="medidas"></div></section>
  <section class="card fuentes"><h2>Fuentes</h2><ol>${d.fuentes.map((f,i) => `<li id="f${i+1}">${f.url ? `<a href="${esc(f.url)}" target="_blank" rel="noopener">${md(f.cita)}</a>` : md(f.cita)}${f.wiki ? ` <span class="nota">· wiki: <code>fuente-${esc(f.wiki)}</code></span>` : ''}</li>`).join('')}</ol>
    ${d.notaFuentes ? `<p class="nota">${md(d.notaFuentes)}</p>` : ''}
    ${d.wiki ? `<p class="nota">Páginas de la wiki: ${d.wiki.map(w => `<code>${esc(w)}</code>`).join(', ')} · actualizado ${esc(d.actualizado || '')}</p>` : ''}</section>`;

  // posiciones: y del archivo o reparto automático por columna
  const N = R.nodos.map(n => ({...n, x: COLX[TIPOS[n.tipo].col], col: TIPOS[n.tipo].col}));
  const porCol = [0,1,2,3].map(c => N.filter(n => n.col === c));
  const alto = Math.max(...porCol.map(c => c.length)) * 66 + 50;
  porCol.forEach(c => c.forEach((n,i) => { if (n.y == null) n.y = Math.round(40 + (i + .5) * ((alto - 50) / c.length) - H/2); }));
  const VH = Math.max(alto, ...N.map(n => n.y + H + 24));
  const byId = Object.fromEntries(N.map(n => [n.id, n]));
  const E = R.flechas;

  const svg = $('g'), NS = 'http://www.w3.org/2000/svg';
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const mk = (t, a = {}, p = svg) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  const defs = mk('defs');
  [['ar','--text3'],['arc','--consec'],['arp','--prev']].forEach(([id,c]) => { const m = mk('marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},defs); mk('path',{d:'M0,0 L10,5 L0,10 z',fill:`var(${c})`},m); });
  COLS.forEach((t,i) => { if (porCol[i].length) mk('text',{x:COLX[i],y:22,class:'colhead'}).textContent = t; });

  const edgeEls = E.map(e => {
    const s = byId[e.de], t = byId[e.a]; let dd;
    const ciclo = e.tipo === 'ciclo', prot = e.tipo === 'protege';
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
    const el = mk('path', {d:dd, class:'edge' + (ciclo ? ' ciclo' : prot ? ' protege' : ''), 'marker-end':`url(#${ciclo ? 'arc' : prot ? 'arp' : 'ar'})`});
    return {...e, el};
  });

  N.forEach(n => {
    const g = mk('g', {class:'node', tabindex:0, role:'button', 'aria-label':n.texto.join(' ')}); n.g = g;
    const col = `var(${TIPOS[n.tipo].c})`;
    const r = mk('rect', {x:n.x, y:n.y, width:W, height:H, rx:8}, g); r.style.stroke = col;
    const tg = mk('text', {x:n.x+10, y:n.y+15, class:'tag'}, g); tg.textContent = TIPOS[n.tipo].t; tg.style.fill = col;
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
    const hips = (d.brote?.hipotesis || []).filter(h => h.nodo === id);
    const lista = (t, xs) => xs.length ? `<div><b>${t}</b><ul>${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    panel.innerHTML = `<div class="kind" style="color:var(${TIPOS[n.tipo].c})">${TIPOS[n.tipo].t}</div><h3>${esc(nom(id))}</h3><p>${md(n.detalle)}</p>
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
    b.innerHTML = `<h3><b>P${i+1}</b>${esc(p.titulo)}</h3><ul>${p.puntos.map(l => `<li>${md(l)}</li>`).join('')}</ul><div class="meta">Corta: ${p.actua.map(a => esc(byId[a]?.texto[0] || a)).join(' · ')}<br>Fuentes: ${p.fuentes.map(f => fuentesNum[f] || f).join(', ')}</div>`;
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
function vistaBrote(d){
  const B = d.brote, KEY = 'redes-causales:brote:' + d.id;
  const fuentesCorta = Object.fromEntries(d.fuentes.map((f,i) => [f.id, i+1]));
  const winFor = w => (B.ventanas.find(v => v.hasta == null || w < v.hasta) || B.ventanas[B.ventanas.length-1]).id;
  const ej = B.ejemplo;
  const guardado = ls.get(KEY);
  let st = guardado
    ? {wk:guardado.wk, win:guardado.win, signs:new Set(guardado.signs), today:new Set(guardado.today), example:!!guardado.example}
    : {wk: ej?.semanas ?? 24, win: winFor(ej?.semanas ?? 24), signs: new Set(ej?.pistas || []), today: new Set(), example: !!ej};
  const save = () => ls.set(KEY, {wk:st.wk, win:st.win, signs:[...st.signs], today:[...st.today], example:st.example});
  const pista = Object.fromEntries(B.pistas.flatMap(g => g.pistas.map(p => [p.id, p])));
  const ul = xs => `<ul>${xs.map(x => `<li>${md(x)}</li>`).join('')}</ul>`;

  $('app').innerHTML = `
  <section><div class="eyebrow">${esc(d.especie)} · investigación en terreno</div><h1>Brote de ${esc(d.titulo.toLowerCase())}: árbol de investigación</h1>
    <p class="lead">Marque la edad del lote y lo que observa. Las ${B.hipotesis.length} hipótesis se ordenan por la cantidad de pistas que coinciden y cada una dice qué verificar. El orden es orientativo, no una probabilidad. Las causas y su mecanismo están en la <a href="#/${d.id}/red">red causal</a>.</p></section>
  <div class="row2">
    <section class="card"><h2><span class="n">PASO 0</span>Confirmar y medir</h2>${ul(B.confirmar)}</section>
    <section class="card"><h2><span class="n">PASO 1</span>Hoy, sirve para cualquier causa</h2><div class="grupo" id="hoy"></div>${B.notaHoy ? `<p class="nota">${md(B.notaHoy)}</p>` : ''}</section>
  </div>
  <div class="brote">
    <section class="card"><h2><span class="n">PASO 2–3</span>Edad del lote y pistas</h2>
      <div class="semanas"><label for="wk">Edad al inicio del brote</label><input id="wk" type="number" min="1" max="120" step="1" inputmode="numeric"> <span class="nota">semanas</span></div>
      <div class="seg" role="group" aria-label="Ventana de edad" id="win"></div>
      ${ej ? `<div class="banner" id="exbanner"><span>Ejemplo cargado: ${esc(ej.texto)}.</span><button class="btn" type="button" id="clear">Empezar de cero</button></div>` : ''}
      <div id="signs"></div></section>
    <section class="card" aria-live="polite"><h2><span class="n">RESULTADO</span>Hipótesis ordenadas</h2>
      <p class="nota">Puntaje = peso de la ventana de edad (0–3) + 2 por cada pista marcada que apunta a la hipótesis.</p><div id="hyps" style="display:grid;gap:12px"></div></section>
  </div>
  <div class="row2">
    <section class="card"><h2><span class="n">PASO 4</span>Necropsia</h2>${ul(B.necropsia)}<p class="nota">Al marcar los hallazgos en el grupo Necropsia del paso 3, el orden se actualiza.</p></section>
    <section class="card"><h2><span class="n">PASO 5</span>Corregir y seguir</h2>${ul(B.seguir)}
      <h3>Datos para pedir al productor</h3><textarea class="copy" id="ask" readonly></textarea>
      <div class="copyrow"><button class="btn" type="button" id="copyAsk">Copiar lista para el productor</button><button class="btn" type="button" id="copySum">Copiar resumen de la investigación</button><span class="toast" id="toast" role="status"></span></div></section>
  </div>
  <section class="card"><h2><span class="n">FUENTES</span>De la wiki AviVet</h2><p class="nota">Los números remiten a la lista de fuentes de la <a href="#/${d.id}/red">red causal</a>. ${md(d.notaFuentes || '')}</p></section>`;
  window.scrollTo(0,0);

  function renderHoy(){ $('hoy').innerHTML = B.hoy.map((t,i) => `<label class="check${st.today.has(i)?' on':''}"><input type="checkbox" data-i="${i}" ${st.today.has(i)?'checked':''}><span>${md(t)}</span></label>`).join(''); }
  $('hoy').addEventListener('change', e => { const i = +e.target.dataset.i; e.target.checked ? st.today.add(i) : st.today.delete(i); save(); renderHoy(); });
  function renderWin(){ $('win').innerHTML = B.ventanas.map(w => `<button type="button" aria-pressed="${st.win===w.id}" data-w="${w.id}">${esc(w.titulo)} <span style="opacity:.75;font-size:12px">${esc(w.rango)}</span></button>`).join(''); }
  $('win').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.win = b.dataset.w; save(); renderWin(); renderH(); });
  function renderSigns(){ $('signs').innerHTML = B.pistas.map(g => `<div class="grupo"><div class="eyebrow">${esc(g.grupo)}</div>${g.pistas.map(p => `<label class="check${st.signs.has(p.id)?' on':''}"><input type="checkbox" data-s="${p.id}" ${st.signs.has(p.id)?'checked':''}><span>${md(p.texto)}</span></label>`).join('')}</div>`).join(''); }
  $('signs').addEventListener('change', e => { const s = e.target.dataset.s; e.target.checked ? st.signs.add(s) : st.signs.delete(s); st.example = false; save(); renderSigns(); renderH(); if ($('exbanner')) $('exbanner').hidden = true; });
  const ranked = () => B.hipotesis.map(h => { const pistas = [...st.signs].filter(s => pista[s]?.apunta.includes(h.id)); const prior = h.peso[st.win] || 0; return {...h, pistas, prior, score: prior + 2*pistas.length}; })
    .sort((a,b) => b.score - a.score || b.pistas.length - a.pistas.length);
  function renderH(){
    const r = ranked(), max = Math.max(...r.map(x => x.score), 1);
    $('hyps').innerHTML = r.map((h,i) => `<article class="hyp${i===0 && h.score>0 ? ' top' : ''}">
      <header><h3>${esc(h.id)} · ${esc(h.titulo)}</h3><span class="score">${h.score} pts</span></header>
      <div class="barra"><i style="width:${Math.round(h.score/max*100)}%"></i></div>
      <div class="chips">${h.prior ? `<span class="pchip prior">ventana: +${h.prior}</span>` : ''}${h.pistas.map(p => `<span class="pchip">${md(pista[p].texto)}</span>`).join('')}</div>
      <details ${i<3 ? 'open' : ''}><summary>Qué verificar y qué hacer</summary>
        <div class="cols"><div><b>Verificar</b>${ul(h.verificar)}</div><div><b>Hacer</b>${ul(h.hacer)}</div></div>
        <p class="src">Fuentes: ${h.fuentes.map(f => fuentesCorta[f] ? `${fuentesCorta[f]}` : esc(f)).join(', ')}${h.nodo ? ` · <a href="#/${d.id}/red/${h.nodo}">ver en la red causal</a>` : ''}</p></details></article>`).join('');
  }
  $('wk').value = st.wk;
  $('wk').addEventListener('input', e => { const w = parseInt(e.target.value, 10); if (!isNaN(w)){ st.wk = w; st.win = winFor(w); save(); renderWin(); renderH(); } });
  if ($('clear')) $('clear').onclick = () => { st.signs.clear(); st.example = false; save(); renderSigns(); renderH(); $('exbanner').hidden = true; };
  if ($('exbanner')) $('exbanner').hidden = !st.example;
  const plano = s => s.replace(/\*\*?(.+?)\*\*?/g, '$1');
  $('ask').value = B.pedir.map(x => '- ' + plano(x)).join('\n');
  function copy(text){
    const done = () => { $('toast').textContent = 'Copiado'; setTimeout(() => $('toast').textContent = '', 2000); };
    const fallback = () => { $('ask').value = text; $('ask').select(); $('toast').textContent = 'Seleccionado: copie con Ctrl/Cmd+C'; };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch(e){ fallback(); }
  }
  $('copyAsk').onclick = () => copy(`Para investigar el brote de ${d.titulo.toLowerCase()} necesito:\n` + B.pedir.map(x => '- ' + plano(x)).join('\n'));
  $('copySum').onclick = () => {
    const r = ranked().filter(h => h.score > 0).slice(0,3), w = B.ventanas.find(x => x.id === st.win);
    copy(`Brote de ${d.titulo.toLowerCase()} — lote de ${st.wk} semanas (${w.titulo})\nPistas: ${[...st.signs].map(s => plano(pista[s].texto)).join('; ') || 'ninguna marcada'}\nHipótesis principales:\n` + r.map(h => `- ${h.id} ${h.titulo} (${h.score} pts): verificar ${plano(h.verificar[0]).toLowerCase()}`).join('\n'));
  };
  renderHoy(); renderWin(); renderSigns(); renderH();
}
