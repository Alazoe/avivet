#!/usr/bin/env node
// Revisa que los datos de redes-causales estén completos y que todas las referencias existan.
// Uso: node redes-causales/validar.mjs        (desde la raíz del repo)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'datos');
const leer = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const errores = [], avisos = [];
const err = (p, m) => errores.push(`${p}: ${m}`), av = (p, m) => avisos.push(`${p}: ${m}`);

const idx = leer('indice.json');
const fac = new Set(leer('factores.json').factores.map(f => f.id));
const probIds = new Set(idx.problemas.map(p => p.id));
for (const r of idx.relaciones || []) if (!probIds.has(r.de) || !probIds.has(r.a)) err('indice.json', `relación ${r.de}→${r.a} con problema inexistente`);

for (const p of idx.problemas) {
  const f = `${p.id}.json`;
  if (p.estado !== 'listo') { if (fs.existsSync(path.join(dir, f))) av(f, 'existe pero el índice lo marca en preparación'); continue; }
  if (!fs.existsSync(path.join(dir, f))) { err('indice.json', `${p.id} está "listo" pero falta datos/${f}`); continue; }
  const d = leer(f);
  if (d.id !== p.id) err(f, `id "${d.id}" no coincide con el índice ("${p.id}")`);
  for (const k of ['titulo', 'especie', 'resumen', 'red', 'fuentes']) if (!d[k]) err(f, `falta "${k}"`);
  const fuentes = new Set((d.fuentes || []).map(x => x.id));
  const chkF = (ids, donde) => (ids || []).forEach(id => { if (!fuentes.has(id)) err(f, `${donde}: fuente "${id}" no está en "fuentes"`); });
  const nodos = new Map();
  for (const n of d.red?.nodos || []) {
    if (nodos.has(n.id)) err(f, `nodo repetido "${n.id}"`);
    nodos.set(n.id, n);
    if (!'opmex'.includes(n.tipo) || n.tipo.length !== 1) err(f, `nodo ${n.id}: tipo "${n.tipo}" (usar o, p, m, e, x)`);
    if (!Array.isArray(n.texto) || !n.texto.length || n.texto.length > 2) err(f, `nodo ${n.id}: "texto" debe ser 1 o 2 líneas`);
    (n.texto || []).forEach(l => { if (l.length > 34) av(f, `nodo ${n.id}: línea larga (${l.length} car.) puede salirse de la caja`); });
    if (!n.detalle) err(f, `nodo ${n.id}: falta "detalle"`);
    if (n.factor && !fac.has(n.factor)) err(f, `nodo ${n.id}: factor "${n.factor}" no está en factores.json`);
    if (n.problema && !probIds.has(n.problema)) err(f, `nodo ${n.id}: problema "${n.problema}" no está en indice.json`);
    chkF(n.fuentes, `nodo ${n.id}`);
    if (!n.fuentes?.length) av(f, `nodo ${n.id}: sin fuentes`);
  }
  for (const e of d.red?.flechas || []) {
    if (!nodos.has(e.de) || !nodos.has(e.a)) err(f, `flecha ${e.de}→${e.a}: nodo inexistente`);
    if (e.tipo && !['ciclo', 'protege'].includes(e.tipo)) err(f, `flecha ${e.de}→${e.a}: tipo "${e.tipo}"`);
  }
  const conFlecha = new Set((d.red?.flechas || []).flatMap(e => [e.de, e.a]));
  for (const id of nodos.keys()) if (!conFlecha.has(id)) av(f, `nodo ${id} sin flechas`);
  for (const m of d.red?.medidas || []) {
    m.actua.forEach(a => { if (!nodos.has(a)) err(f, `medida ${m.id}: actúa en nodo inexistente "${a}"`); });
    chkF(m.fuentes, `medida ${m.id}`);
  }
  if (d.brote) {
    const B = d.brote, wins = new Set(B.ventanas.map(w => w.id)), hips = new Set(B.hipotesis.map(h => h.id));
    for (const k of ['confirmar', 'hoy', 'ventanas', 'hipotesis', 'pistas', 'necropsia', 'seguir', 'pedir']) if (!B[k]) err(f, `brote: falta "${k}"`);
    for (const h of B.hipotesis) {
      for (const w of wins) if (!(w in h.peso)) err(f, `hipótesis ${h.id}: falta peso para la ventana "${w}"`);
      Object.values(h.peso).forEach(v => { if (v < 0 || v > 3) err(f, `hipótesis ${h.id}: peso fuera de 0–3`); });
      if (h.nodo && !nodos.has(h.nodo)) err(f, `hipótesis ${h.id}: nodo "${h.nodo}" no existe`);
      chkF(h.fuentes, `hipótesis ${h.id}`);
    }
    const usadas = new Set();
    for (const g of B.pistas) for (const s of g.pistas) s.apunta.forEach(h => { usadas.add(h); if (!hips.has(h)) err(f, `pista ${s.id}: hipótesis "${h}" no existe`); });
    for (const h of hips) if (!usadas.has(h)) av(f, `hipótesis ${h} sin pistas que apunten a ella`);
    (B.ejemplo?.pistas || []).forEach(s => { if (!B.pistas.some(g => g.pistas.some(x => x.id === s))) err(f, `ejemplo: pista "${s}" no existe`); });
  }
  console.log(`✓ ${f}: ${nodos.size} nodos, ${d.red.flechas.length} flechas, ${d.red.medidas.length} medidas${d.brote ? `, ${d.brote.hipotesis.length} hipótesis` : ''}, ${fuentes.size} fuentes`);
}
avisos.forEach(a => console.log('  aviso ·', a));
if (errores.length) { errores.forEach(e => console.error('  ERROR ·', e)); process.exit(1); }
console.log(errores.length ? '' : 'Sin errores.');
