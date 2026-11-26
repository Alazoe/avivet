#!/usr/bin/env python3
"""Convierte la red de picaje de la wiki al formato de la app.

Fuente de verdad: avivet-wiki/Entregables/red-causal-picaje/datos.json (se edita ahí y se
corre su build.py). Este script solo traduce ese archivo a redes-causales/datos/picaje.json.

Uso (desde la raíz del repo):
  python3 redes-causales/importar/picaje.py [ruta a avivet-wiki]
"""
import json, re, sys, textwrap
from pathlib import Path

WIKI = Path(sys.argv[1] if len(sys.argv) > 1 else Path.home() / "Documents/avivet-wiki")
SRC = WIKI / "Entregables/red-causal-picaje/datos.json"
OUT = Path(__file__).resolve().parent.parent / "datos/picaje.json"
d = json.loads(SRC.read_text())

TIPO = {"origen": "o", "mecanismo": "m", "evento": "e", "consecuencia": "x"}
# Factores del catálogo común (datos/factores.json) y enlaces a otros problemas
FACTOR = {"o_fibra": "fibra", "o_forma": "fibra", "o_energia": "energia", "o_aa": "metionina",
          "o_luzint": "luz", "o_luzcambio": "luz", "o_parasitos": "sanidad", "o_enfermedad": "sanidad",
          "o_densidad": "ambiente", "o_comederos": "ambiente", "o_amoniaco": "ambiente", "o_nidos": "ambiente",
          "o_pico": "ambiente", "o_recria": "recria", "o_uniform": "recria", "o_perchas": "recria"}
PROBLEMA = {"c_prolapso": "prolapso", "c_sangre": "sangre"}
FLECHA = {"ciclo": "ciclo", "duda": "discutida"}

def titulo_wiki(pagina):
    hits = list((WIKI / "Wiki").rglob(pagina + ".md"))
    if not hits:
        return None
    m = re.search(r'^titulo:\s*"?(.*?)"?\s*$', hits[0].read_text(), re.M)
    return m.group(1) if m else None

fuentes, faltan = {}, []
def fid(pagina):
    pagina = pagina.strip()
    clave = pagina[len("fuente-"):] if pagina.startswith("fuente-") else pagina
    if clave not in fuentes:
        t = titulo_wiki(pagina)
        if t is None:
            faltan.append(pagina)
        cita = t or pagina
        if not pagina.startswith("fuente-"):
            cita = "Wiki AviVet — " + cita
        fuentes[clave] = {"id": clave, "cita": cita, "wiki": pagina}
    return clave

byid = {n["id"]: n for n in d["nodos"]}
nodos = []
for n in d["nodos"]:
    if n["tipo"] == "medida":
        continue
    lineas = textwrap.wrap(n["label"], 31)
    if len(lineas) > 2:
        raise SystemExit(f"{n['id']}: el texto no cabe en dos líneas: {n['label']}")
    x = {"id": n["id"], "tipo": TIPO[n["tipo"]], "texto": lineas, "detalle": n["texto"],
         "fuentes": [fid(f) for f in n["fuentes"]]}
    if n["tipo"] == "origen":
        x["grupo"] = n["grupo"]
    if n.get("ev"):
        x["evidencia"] = n["ev"]
    if n.get("cifras"):
        x["cifras"] = n["cifras"]
    if n["id"] in FACTOR:
        x["factor"] = FACTOR[n["id"]]
    if n["id"] in PROBLEMA:
        x["problema"] = PROBLEMA[n["id"]]
    nodos.append(x)

flechas, medidas = [], []
for f in d["flechas"]:
    a, b, k = (f + [None])[:3]
    if byid[a]["tipo"] == "medida":
        continue
    flechas.append({"de": a, "a": b, **({"tipo": FLECHA[k]} if k else {})})
for m in (n for n in d["nodos"] if n["tipo"] == "medida"):
    actua = [b for a, b, *k in d["flechas"] if a == m["id"]]
    medidas.append({"id": m["id"], "titulo": m["label"], "actua": actua,
                    "puntos": [m["texto"]] + m.get("cifras", []), "fuentes": [fid(f) for f in m["fuentes"]]})

grupos_pistas = []
for p in d["pistas"]:
    g = next((g for g in grupos_pistas if g["grupo"] == p["grupo"]), None)
    if not g:
        g = {"grupo": p["grupo"], "pistas": []}
        grupos_pistas.append(g)
    g["pistas"].append({"id": p["id"], "texto": p["label"], "apunta": p["h"]})

HASTA = {"cria": 17, "inicio": 30, "mitad": 60, "final": None}
RANGO = re.compile(r"\s*\((.*)\)$")
ventanas = [{"id": f["id"], "titulo": RANGO.sub("", f["label"]), "rango": (RANGO.search(f["label"]) or [None, ""])[1],
             "hasta": HASTA[f["id"]]} for f in d["fases"]]

def fuentes_hip(h):
    out = []
    for nid in h["nodos"]:
        for f in byid[nid]["fuentes"]:
            k = fid(f)
            if k not in out:
                out.append(k)
    return out

hipotesis = [{"id": h["id"], "titulo": h["label"], "peso": h["fase"], "pesoTipo": h["tipo"],
              "verificar": h["verificar"], "hacer": h["hacer"], "fuentes": fuentes_hip(h),
              "nodos": h["nodos"]} for h in d["hipotesis"]]
for h in hipotesis:
    for w in HASTA:
        h["peso"].setdefault(w, 0)

doc = {
    "id": "picaje", "titulo": "Picaje y canibalismo", "especie": "Ponedora comercial",
    "resumen": "Muchas causas de origen (forrajeo sin destino, alimento, luz, sanidad, galpón, estrés social, recría, inicio de postura) convergen en pocos mecanismos, sobre todo el **forrajeo redirigido** a las plumas. Dos ciclos se retroalimentan: herida con sangre → más picaje, y picaje de cloaca ↔ prolapso.",
    "wiki": ["picaje-canibalismo", "red-causal-picaje", "causas-picaje-evidencia-y-acciones", "pauta-verificacion-estado-basal-picaje"],
    "actualizado": "2026-11-25",
    "red": {
        "intro": {"titulo": "Las flechas van de causa a efecto",
                  "texto": "Las causas de origen están agrupadas por tema y llevan su nivel de evidencia (A fuerte, B moderada, C débil). Confluyen en diez mecanismos y seis tipos de picaje, que no se convierten uno en otro. La línea roja punteada es un ciclo (la sangre atrae más picaje; picaje de cloaca y prolapso); la gris punteada, una relación discutida."},
        "grupos": {k: v for k, v in d["grupos"].items() if any(n.get("grupo") == k for n in nodos)},
        "nodos": nodos, "flechas": flechas, "medidas": medidas,
        "notaMedidas": "Cada medida corta uno o más factores de origen. Lo que se pone recién cuando aparece el problema rinde menos que lo que estaba desde la recría.",
        "noFunciona": d["no_funciona"],
    },
    "brote": {
        "confirmar": ["Si el picoteo **para** cuando la víctima se agacha o se aleja, es jerarquía (picaje agresivo); si **no para**, es picaje de plumas.",
                      "Picaje suave, severo, de cloaca y agresivo tienen causas en parte distintas y, a nivel de grupo, no se convierten uno en otro: marque todos los que vea."],
        "tipos": [{"id": t["id"], "titulo": t["label"], "pista": t["pista"]} for t in d["tipos_picaje"]],
        "hoy": d["hoy"],
        "notaHoy": "Bajar la luz compra tiempo pero no corrige la causa. La sal en el agua solo con agua a voluntad.",
        "ventanas": ventanas, "notaVentanas": d.get("fases_nota", ""),
        "hipotesis": hipotesis, "pistas": grupos_pistas,
        "notaPistas": "Marque solo lo que había **antes** de que empezara el brote.",
        "respuestas": [{"id": r["id"], "titulo": r["label"], "nota": r["nota"], "fuentes": [fid(f) for f in r["fuente"].split(",")]} for r in d["respuestas"]],
        "notaPuntaje": "Puntaje = tipo de picaje (0–3, el mayor entre los marcados) + edad (0–3) + cada pista (1–3). Los pesos son razonamiento propio, no vienen de una fuente: solo ordenan qué revisar primero.",
    },
    "fuentes": sorted(fuentes.values(), key=lambda f: f["cita"].lower()),
    "notaFuentes": "Niveles de evidencia A, B y C según la consulta «Causas de picaje ordenadas por peso de la evidencia». Glatz & Runge 2017 (*Managing Fowl Behaviour*) es una guía de industria casi sin citas internas. Tensiones abiertas: el cambio de alimento aumenta el picaje de cloaca en unos estudios y el efecto es opuesto en cuello en otro; la fibra dura ingerida y la forma del alimento en jaula sin efecto en algunos trabajos; el forrajeo redirigido podría ser exploración más que búsqueda de comida; picaje suave y severo se correlacionan en la misma ave aunque no se conviertan a nivel de grupo; el papel del picaje en el prolapso (≥ 80 % según Glatz frente a solo agravante según Alberta).",
}
OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
print(f"{OUT.name}: {len(nodos)} nodos, {len(flechas)} flechas, {len(medidas)} medidas, {len(hipotesis)} hipótesis, {len(fuentes)} fuentes")
if faltan:
    print("Sin página en la wiki:", ", ".join(faltan))
