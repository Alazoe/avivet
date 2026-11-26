# Redes causales AviVet

Una sola app para todos los problemas de ponedoras que trabajamos como red causal: prolapso, picaje, huevos con sangre, etc. Cada problema es **un archivo de datos**; la app dibuja todo lo demás.

- **Portada** (`#/`): los problemas, el mapa de cómo se conectan y los factores que comparten.
- **Red causal** (`#/<id>/red`, o `#/<id>/red/<nodo>` para abrir un nodo).
- **Investigar un brote** (`#/<id>/brote`): pasos 0–5, pistas y ranking de hipótesis. Lo marcado se guarda en el navegador.

La **fuente de verdad es la wiki** (`~/Documents/avivet-wiki`): cada problema tiene sus consultas ahí (`red-causal-<id>`, `investigacion-brote-<id>`) y el JSON se arma desde ellas. Si cambia la wiki, se actualiza el JSON; nunca al revés.

## Archivos

```
redes-causales/
  index.html          estilos y esqueleto
  app.js              portada, red y brote (no cambia al agregar problemas)
  validar.mjs         revisa los datos: node redes-causales/validar.mjs
  importar/picaje.py  convierte la red de picaje de la wiki (Entregables/red-causal-picaje/datos.json)
  datos/
    indice.json       lista de problemas (estado) y relaciones entre ellos
    factores.json     catálogo de factores compartidos (luz, metionina, densidad…)
    prolapso.json     un archivo por problema
    picaje.json       generado con importar/picaje.py (no editar a mano)
```

## Problemas y de dónde salen

| Problema | Origen de los datos | Cómo actualizar |
|---|---|---|
| Prolapso | consultas `red-causal-prolapso` e `investigacion-brote-prolapso` | editar `datos/prolapso.json` a mano, siguiendo la wiki |
| Picaje | `avivet-wiki/Entregables/red-causal-picaje/datos.json` (la misma fuente que el Canvas y los artifacts de picaje) | editar ese `datos.json` en la wiki y correr `python3 redes-causales/importar/picaje.py` |


## Agregar un problema nuevo (por ejemplo `picaje`)

1. Tener en la wiki la red causal del problema (consulta con nodos, flechas, medidas y fuentes) y, si aplica, el protocolo de brote.
2. Crear `datos/picaje.json` con el formato de abajo. Copiar `prolapso.json` como modelo.
3. Usar los **factores del catálogo** (`"factor": "luz"`) en los nodos que correspondan. Si hace falta un factor nuevo, agregarlo a `factores.json`.
4. En `indice.json`, pasar el problema a `"estado": "listo"` y revisar las `relaciones`.
5. Correr `node redes-causales/validar.mjs` hasta que diga *Sin errores*.
6. Probar en el navegador (servidor local, abajo) la portada, la red y el brote.

## Formato de `datos/<id>.json`

```jsonc
{
  "id": "prolapso",                       // igual que en indice.json y el nombre del archivo
  "titulo": "Prolapso de oviducto y cloaca",
  "especie": "Ponedora comercial",
  "resumen": "Una o dos frases.",         // admite **negrita** y *cursiva*
  "wiki": ["prolapso-cloacal", "red-causal-prolapso"],   // páginas de la wiki de origen
  "actualizado": "2026-11-25",

  "red": {
    "intro": { "titulo": "…", "texto": "…" },            // panel antes de tocar un nodo
    "nodos": [
      {
        "id": "luz",                       // corto, sin espacios
        "tipo": "o",                       // o origen · p protector · m mecanismo · e evento · x consecuencia
        "texto": ["Fotoestímulo precoz o brusco", "(por edad, saltos grandes)"],  // 1–2 líneas, ≤ 34 caracteres
        "detalle": "Explicación del panel.",
        "fuentes": ["lera-2022", "alberta-2006-prolapso"],   // ids de la lista "fuentes"
        "factor": "luz",                   // opcional: id de factores.json
        "problema": "picaje",              // opcional: este nodo es también otro problema
        "central": true,                   // opcional: el nodo del problema (se destaca)
        "grupo": "luz",                    // opcional (solo origen): agrupa la columna con subtítulos de red.grupos
        "evidencia": "A",                  // opcional: A fuerte · B moderada · C débil
        "cifras": ["30 lux en recría → …"],// opcional: datos duros en el panel
        "y": 296                           // opcional: posición vertical; sin "y" se reparte solo
      }
    ],
    "flechas": [
      { "de": "luz", "a": "huevo" },
      { "de": "fibra", "a": "picoteo", "tipo": "protege" },   // verde punteada: reduce
      { "de": "canib", "a": "prolapso", "tipo": "ciclo" },    // roja punteada: retroalimentación
      { "de": "e_gfp", "a": "e_sfp", "tipo": "discutida" }    // gris punteada: relación discutida
    ],
    "grupos": { "luz": "Luz" },            // opcional: nombres de los grupos de la columna de origen
    "noFunciona": [["Medida que no sirve", "Por qué"]],     // opcional: tabla «Lo que no funciona"
    "ventanas": {                          // opcional: barra de edades de riesgo
      "titulo": "…", "desde": 16, "hasta": 80,
      "tramos": [{ "desde": 17, "hasta": 30, "fuerte": true }],
      "marcas": [16, 30, 60, 80], "nota": "…"
    },
    "medidas": [
      { "id": "p1", "titulo": "…", "actua": ["luz", "peso"], "puntos": ["…"], "fuentes": ["…"] }
    ],
    "notaMedidas": "…"
  },

  "brote": {                               // opcional: árbol de investigación
    "confirmar": ["…"],                    // paso 0 (opcional)
    "tipos": [{ "id": "cloaca", "titulo": "Picaje de cloaca", "pista": "Cómo reconocerlo" }],  // opcional: paso 0 marca tipos
    "hoy": ["…"], "notaHoy": "…",          // paso 1, medidas para cualquier causa
    "ventanas": [                          // paso 2; "hasta" = semana en que termina (null en la última)
      { "id": "ini", "titulo": "Inicio de postura", "rango": "≈ 18–30 sem", "hasta": 30 }
    ],
    "hipotesis": [
      { "id": "H1", "titulo": "…", "peso": { "ini": 3, "pico": 0, "fin": 0 },   // 0–3 por ventana
        "verificar": ["…"], "hacer": ["…"], "fuentes": ["…"], "nodo": "peso",    // nodo (o "nodos": [...]): enlace a la red
        "pesoTipo": { "cloaca": 3 } }      // opcional, con "tipos": suma el mayor de los tipos marcados
    ],
    "pistas": [                            // paso 3
      { "grupo": "Recría y luz", "pistas": [ { "id": "peso_bajo", "texto": "…", "apunta": ["H1"] } ] }
      // "apunta" como lista suma 2 por hipótesis; como objeto {"H1": 3, "H4": 1} suma ese peso (1–3)
    ],
    "respuestas": [{ "id": "r1", "titulo": "Se bajaron horas de luz", "nota": "Qué dice la evidencia", "fuentes": ["…"] }],  // opcional: «lo que ya se hizo», no suma
    "notaPuntaje": "…",                    // opcional: explica el puntaje si no es el estándar
    "necropsia": ["…"], "seguir": ["…"], "pedir": ["…"],   // opcionales
    "ejemplo": { "semanas": 24, "pistas": ["doble", "luz"], "texto": "lote de 24 semanas con…" }
  },

  "fuentes": [
    { "id": "lera-2022", "cita": "Lera 2022 — Prolapse in laying hens (Hendrix Genetics)",
      "url": "https://…", "wiki": "lera-2022" }      // wiki = ficha fuente-<wiki>.md (omitir si no hay ficha)
  ],
  "notaFuentes": "Independencia de las fuentes, discrepancias, cifras sin ensayo."
}
```

**Puntaje del brote:** tipo (el mayor de los marcados, si hay tipos) + peso de la ventana de edad + peso de cada pista marcada. Sin ejemplo, la edad parte vacía y no suma. Es orientativo, no una probabilidad.

**Fuentes:** `wiki` es el nombre completo de la página (`fuente-lera-2022`, `iluminacion`).

**Reglas de contenido** (las mismas de la wiki): cada afirmación con su fuente; las discrepancias se dicen, no se borran; lo que es razonamiento propio se marca *(sin fuente)*.

## Probar en local

`fetch` no funciona abriendo el archivo directamente; hay que servir la carpeta:

```bash
cd ~/avivet-repo && python3 -m http.server 8765
```

y abrir `http://localhost:8765/redes-causales/`.

Página interna: lleva `noindex` y no está en el sitemap.
