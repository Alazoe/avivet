#!/usr/bin/env python3
"""Actualiza los brotes de influenza aviar de Chile y países vecinos (Perú, Argentina, Bolivia)
en riesgo-ia/index.html desde WAHIS (OMSA).

Baja todos los informes de influenza aviar de ALTA patogenicidad (H5N1 y similares, aves de
corral y silvestres) que Chile ha notificado a la OMSA, toma cada brote con sus coordenadas y
reescribe el bloque `const WAHIS_BROTES = [...]` de la app con el mismo formato de siempre.

Clasificación (la misma que usaba la app):
  silvestre  -> especies silvestres
  comercial  -> aves domésticas, 1.000 o más aves expuestas
  traspatio  -> aves domésticas, menos de 1.000
  resuelto   -> el brote tiene fecha de término o el evento está cerrado

Seguro: si WAHIS falla o entrega, para algún país, menos del 90 % de los brotes que ya hay, NO modifica nada.

    python3 riesgo-ia/scripts/actualizar_brotes.py            # actualiza index.html
    python3 riesgo-ia/scripts/actualizar_brotes.py --dry-run  # solo muestra qué cambiaría
"""
from __future__ import annotations
import argparse, datetime as dt, json, re, sys, time
from zoneinfo import ZoneInfo
from pathlib import Path
import urllib.request

API = "https://wahis.woah.org/api/v1/pi"
H = {"User-Agent": "Mozilla/5.0 (AviVet riesgo-ia; actualizacion mensual)",
     "Referer": "https://wahis.woah.org/", "Accept": "application/json",
     "Content-Type": "application/json"}
CHILE = 42
# Chile y países vecinos (nombre en WAHIS -> código que usa la app)
PAISES = {"Chile": "CL", "Peru": "PE", "Argentina": "AR", "Bolivia": "BO"}
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
APP = Path(__file__).resolve().parents[1] / "index.html"


def pedir(url, cuerpo=None, intentos=4):
    for i in range(intentos):
        try:
            req = urllib.request.Request(url, data=json.dumps(cuerpo).encode() if cuerpo else None,
                                         headers=H, method="POST" if cuerpo else "GET")
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            if i == intentos - 1:
                raise
            time.sleep(2 * 2 ** i)


def informes_pais(area_id):
    filtro = {"eventIds": [], "reportIds": [], "countries": [area_id], "firstDiseases": [],
              "secondDiseases": [], "typeStatuses": [], "reasons": [], "eventStatuses": [],
              "reportTypes": [], "reportStatuses": [], "eventStartDate": None, "submissionDate": None,
              "animalTypes": [], "sortColumn": "submissionDate", "sortOrder": "desc",
              "pageNumber": 0, "pageSize": 100}
    todos = []
    while True:
        d = pedir(f"{API}/event/filtered-list?language=en", filtro)
        todos += d["list"]
        if len(todos) >= d.get("totalSize", 0) or not d["list"]:
            return todos
        filtro["pageNumber"] += 1


def fecha_es(iso):
    f = dt.date.fromisoformat(iso[:10])
    return f"{f.day} {MESES[f.month - 1]} {f.year}"


def miles(n):
    return f"{int(n):,}".replace(",", ".")


def clasificar(especies):
    """especies: lista de dicts {nombre, silvestre, expuestas, casos}."""
    dom = [e for e in especies if not e["silvestre"]]
    if dom:
        n = sum(e["expuestas"] or e["casos"] or 0 for e in dom)
        return ("comercial" if n >= 1000 else "traspatio"), n, dom
    n = sum(e["casos"] or e["expuestas"] or 0 for e in especies)
    return "silvestre", n, especies


def ids_paises():
    lista = pedir(f"{API}/country/list?language=en")
    return {c["name"]: c["areaId"] for c in lista if c["name"] in PAISES}


def bajar_brotes(area_id, pausa=0.25):
    reps = [r for r in informes_pais(area_id) if "high pathogenicity" in r["disease"].lower()]
    estado_evento = {r["eventId"]: r["eventStatus"] for r in reps}
    brotes = {}
    for r in reps:
        info = pedir(f"{API}/review/report/{r['reportId']}/all-information?language=en")
        for o in info.get("outbreaks") or []:
            o["_evento"] = r["eventId"]
            brotes[o["outbreakId"]] = o
        time.sleep(pausa)
    salida = []
    for o in brotes.values():
        if o.get("latitude") is None:
            continue
        det = pedir(f"{API}/review/report/{o['lastUpdateReportId']}/outbreak/{o['outbreakId']}/all-information?language=en")
        especies = []
        for q in det.get("speciesQuantities") or []:
            t = q.get("totalQuantities") or {}
            especies.append({"nombre": (t.get("speciesName") or "").strip(), "silvestre": bool(t.get("isWild")),
                             "expuestas": t.get("susceptible"), "casos": t.get("cases")})
        tipo, n, usadas = clasificar(especies) if especies else ("traspatio", 0, [])
        # WAHIS entrega las especies en orden variable: ordenar para que el resultado sea estable
        usadas = sorted(usadas, key=lambda e: (-(e["expuestas"] or e["casos"] or 0), e["nombre"]))
        nombres = [e["nombre"] for e in usadas if e["nombre"]]
        detalle = " · ".join(x for x in [f"{miles(n)} aves" if n else "",
                                         (nombres[0] + (f" +{len(nombres) - 1}" if len(nombres) > 1 else "")) if nombres else ""] if x)
        salida.append({"lat": round(o["latitude"], 4), "lon": round(o["longitude"], 4), "tipo": tipo,
                       "anio": int(o["startDate"][:4]), "fecha": fecha_es(o["startDate"]),
                       "region": (o.get("location") or o.get("adminDivision") or "").strip(),
                       "detalle": detalle,
                       "resuelto": bool(o.get("endDate")) or estado_evento.get(o["_evento"]) == "Resolved",
                       "_iso": o["startDate"][:10]})
        time.sleep(pausa)
    salida.sort(key=lambda b: (b["_iso"], -b["lat"], -b["lon"]), reverse=True)   # orden estable
    return salida


def bajar_todo():
    ids = ids_paises()
    faltan = set(PAISES) - set(ids)
    if faltan:
        sys.exit(f"WAHIS no devolvió el código de: {', '.join(sorted(faltan))}. No modifico nada.")
    todos = []
    for nombre, codigo in PAISES.items():
        brotes = bajar_brotes(ids[nombre])
        for b in brotes:
            b["pais"] = codigo
        print(f"  {nombre:10} {len(brotes):4} brotes")
        todos += brotes
    todos.sort(key=lambda b: (b["_iso"], -b["lat"], -b["lon"]), reverse=True)
    return todos


def js(b):
    esc = lambda s: s.replace("\\", "\\\\").replace("'", "\\'")
    return (f"  {{ lat:{b['lat']}, lon:{b['lon']}, tipo:'{b['tipo']}', anio:{b['anio']}, fecha:'{b['fecha']}', "
            f"region:'{esc(b['region'])}', detalle:'{esc(b['detalle'])}', resuelto:{'true' if b['resuelto'] else 'false'}, pais:'{b['pais']}' }},")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--app", default=str(APP))
    a = ap.parse_args()
    app = Path(a.app); html = app.read_text(encoding="utf-8")
    m = re.search(r"const WAHIS_BROTES = \[\n(.*?)\n\];", html, re.S)
    if not m:
        sys.exit("No encontré el bloque WAHIS_BROTES en la app.")
    actuales = {}
    for linea in m.group(1).splitlines():
        if "{ lat:" in linea:
            pm = re.search(r"pais:'(\w+)'", linea)
            c = pm.group(1) if pm else "CL"          # datos antiguos sin país = Chile
            actuales[c] = actuales.get(c, 0) + 1
    nuevos = bajar_todo()
    for c, n in actuales.items():
        n_nuevo = sum(1 for b in nuevos if b["pais"] == c)
        if n_nuevo < 0.9 * n:
            sys.exit(f"SEGURO: WAHIS entregó {n_nuevo} brotes de {c} y la app tiene {n}. No modifico nada.")
    actuales = sum(actuales.values())
    hoy = dt.datetime.now(ZoneInfo("America/Santiago")).date()   # GitHub corre en UTC
    viejos = set(re.findall(r"lat:(-?[\d.]+), lon:(-?[\d.]+), tipo:'\w+', anio:\d+, fecha:'([^']+)'", m.group(1)))
    nuevos = nuevos
    agregados = [b for b in nuevos if (str(b["lat"]), str(b["lon"]), b["fecha"]) not in viejos]
    print(f"Brotes en la app: {actuales} | en WAHIS: {len(nuevos)} | nuevos o cambiados: {len(agregados)}")
    for b in agregados[:15]:
        print(f"   + {b['pais']} {b['fecha']:12} {b['tipo']:9} {b['region'][:45]}")
    if a.dry_run:
        return
    cuerpo = "\n".join(js(b) for b in nuevos)
    anios = sorted({b["anio"] for b in nuevos})
    por_pais = " · ".join(f"{c} {sum(1 for b in nuevos if b['pais'] == c)}" for c in PAISES.values())
    cab = (f"// Brotes de Influenza Aviar de alta patogenicidad en Chile y países vecinos — fuente: WAHIS/OMSA (API pública)\n"
           f"// {len(nuevos)} brotes {anios[0]}-{anios[-1]} ({por_pais}) · generado por scripts/actualizar_brotes.py el {hoy:%d-%m-%Y}\n"
           f"// clasificados por especie y nº de aves (comercial >=1.000) · resuelto = con fecha de término o evento cerrado\n"
           f"const WAHIS_ACTUALIZADO = '{hoy:%d-%m-%Y}';\n")
    ini = html.rfind("\n//", 0, m.start())          # comentario de cabecera anterior
    while html.rfind("\n//", 0, ini) == html.rfind("\n", 0, ini) and html.rfind("\n//", 0, ini) > 0:
        ini = html.rfind("\n//", 0, ini)
    previo = html[ini + 1:m.start()]
    if not all(l.startswith("//") or l.startswith("const WAHIS_ACTUALIZADO") or not l.strip() for l in previo.splitlines()):
        ini = m.start() - 1
    html = html[:ini + 1] + cab + f"const WAHIS_BROTES = [\n{cuerpo}\n];" + html[m.end():]
    app.write_text(html, encoding="utf-8")
    print(f"index.html actualizado: {len(nuevos)} brotes, fecha {hoy:%d-%m-%Y}")


if __name__ == "__main__":
    main()
