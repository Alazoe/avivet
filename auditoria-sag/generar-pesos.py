#!/usr/bin/env python3
"""Lee pesos-riesgo.xlsx y escribe los pesos dentro de index.html (entre /*PESOS-INICIO*/ y /*PESOS-FIN*/).

El Excel es la fuente de verdad de la «Evaluación de riesgo». Hojas «Plantel» y «Traspatio»:
  Id · Subsección · Ítem · Crítico SAG · Bioseguridad (Externa/Interna) · Categoría AviVet ·
  Peso propuesto · TU PESO (si difiere) · Por qué · Aplica a
Vale «TU PESO» si hay algo escrito; si no, «Peso propuesto». Pesos permitidos: 1, 0.8, 0.6, 0.4, 0.2.
La categoría y si es externa o interna también se pueden cambiar en el Excel.

Uso:
  python3 generar-pesos.py                 # pesos aún en revisión (la app muestra un aviso)
  python3 generar-pesos.py --revisado      # pesos aprobados: la app quita el aviso
Requiere openpyxl (por ejemplo, el .venv de ~/AviVet_Documentos).
"""
import json, pathlib, re, sys
import openpyxl

AQUI = pathlib.Path(__file__).resolve().parent
EXCEL, HTML = AQUI / "pesos-riesgo.xlsx", AQUI / "index.html"
PERMITIDOS = {1.0, 0.8, 0.6, 0.4, 0.2}
revisado = "--revisado" in sys.argv

wb = openpyxl.load_workbook(EXCEL, data_only=True)
pesos, orden = {}, []
for hoja in ("Plantel", "Traspatio"):
    for fila in wb[hoja].iter_rows(min_row=2, values_only=True):
        id_, _sub, _item, _crit, tipo, cat, propuesto, suyo = fila[:8]
        if not id_:
            continue
        w = suyo if suyo not in (None, "") else propuesto
        try:
            w = float(str(w).replace(",", "."))
        except (TypeError, ValueError):
            sys.exit(f"{hoja} {id_}: el peso «{w}» no es un número")
        if w not in PERMITIDOS:
            sys.exit(f"{hoja} {id_}: el peso {w} no está en la escala 1 · 0,8 · 0,6 · 0,4 · 0,2")
        t = "E" if str(tipo).strip().lower().startswith("ext") else "I"
        pesos[id_] = {"w": w, "c": str(cat).strip(), "t": t}
        if (str(cat).strip(), t) not in orden:
            orden.append((str(cat).strip(), t))

# externas primero y luego internas, respetando el orden de la hoja
orden.sort(key=lambda x: 0 if x[1] == "E" else 1)
bloque = (
    "/*PESOS-INICIO*/\n"
    f"var RIESGO_BORRADOR={'false' if revisado else 'true'};\n"
    f"var RIESGO_ORDEN={json.dumps([[c, t] for c, t in orden], ensure_ascii=False)};\n"
    f"var RIESGO={json.dumps(pesos, ensure_ascii=False, separators=(',', ':'))};\n"
    "/*PESOS-FIN*/"
)
html = HTML.read_text()
if "/*PESOS-INICIO*/" in html:
    html = re.sub(r"/\*PESOS-INICIO\*/.*?/\*PESOS-FIN\*/", lambda m: bloque, html, flags=re.S)
else:
    html = html.replace("var STATE={", bloque + "\n\nvar STATE={", 1)
HTML.write_text(html)
print(f"{len(pesos)} ítems con peso · {len(orden)} categorías · {'REVISADO' if revisado else 'en revisión'}")
