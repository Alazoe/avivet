# AviVet — herramientas web (repo Alazoe/avivet)

Sitio estático (HTML + JS vanilla, sin build ni npm) servido por GitHub Pages en **avivet.cl/avivet/** (también alazoe.github.io/avivet/). Push a `main` publica en 1–2 minutos.

## Antes de tocar nada
- Clon válido: **`~/avivet-repo`**. Nunca `~/Documents/avivet*` ni otros clones (hubo copias atrasadas y se trabajó sobre la equivocada). Si aparece otra copia, comparar `git log -1` antes de editar.
- Revisar la rama: `git status -sb`. Este clon a veces queda en una rama de trabajo (p. ej. `necropsias`) con cambios sin commitear: no los mezcles ni los descartes; si la tarea es de otra app, trabaja en una rama o worktree desde `main` (como `~/avivet-redes`, rama `redes-causales`).
- El sitio raíz (portada, `apps.html`, `sitemap.xml`, `robots.txt`) vive en otro repo: **`~/alazoe-github-io`** (Alazoe/alazoe.github.io → avivet.cl/). Una app o guía nueva de este repo casi siempre implica tocar también ese.

## Estructura
Una carpeta por herramienta, cada una con su `index.html`, su JS y su `README.md`:
`auditoria-sag`, `calculadoras-dosis`, `curvas-geneticas` (datos LINEAS/EQ que reutiliza `informe-visita`), `informe-visita` (+ `bitacora.html`), `informe-telemedicina`, `telemedicina`, `inventario` / `inventario-huevos` / `plantasdealimento` / `manual`, `necropsias` (100 % local, IndexedDB/PWA), `presupuesto-diario`, `proyeccion-galpones`, `recepcion-insumos`, `pesaje-pollitas`, `campestre-rutas`, `riesgo-ia`, `valores-nutricionales`, `vacunacion-agua|spray|inyectable`, `redes-causales` (un JSON por problema), `charlas`, `Recursos/<slug>/` (guías técnicas numeradas).

## Reglas
- **README**: al cambiar una herramienta, actualizar su `README.md` y, si cambia el acceso, la tabla «Acceso rápido» del `README.md` raíz. Sin esperar a que lo pidan.
- **SEO**: toda herramienta nueva nace con `<meta name="robots" content="noindex, nofollow">` y **no** va al sitemap. Solo las guías de `Recursos/` enlazadas desde la portada van a `sitemap.xml` (en alazoe-github-io), con canonical, Open Graph y JSON-LD.
- **Guía nueva en Recursos**: copiar el `<style>` de la guía anterior, numerar el kicker (N.º 0X) y registrarla en tres lugares de alazoe-github-io: `sitemap.xml`, tarjeta en Recursos de `index.html` y tarjeta en «Guías técnicas» de `apps.html` (descripción ≤ ~50 caracteres).
- **Caché**: si cambias un `.js` o `.css` enlazado, sube el `?v=N` en el `<script>`/`<link>` que lo carga; hubo fallos de «no se ve el cambio» por esto. Tras publicar, comprobar con `curl -s "https://avivet.cl/avivet/<app>/?cb=$(date +%s)"`.
- **Probar como usuario** antes de dar algo por listo: servidor local (`python3 -m http.server`), teclado, clics, recargar, exportar; decir en una línea qué se probó.
- **Datos reales**: nunca borrar ni sobrescribir datos de productores al probar; usar registros ficticios y borrarlos por id exacto.
- Librerías solo por CDN con versión fija (jsPDF, docx 8.5.0, Chart.js…). Sin frameworks.
- Unidades métricas (m, m², m³). Escribir «bursa» (de Fabricio), nunca «bolsa».
- Commit y push solo cuando Andrés lo pida.

## Flujos frecuentes (hay skills)
- Publicar un cambio en avivet.cl → skill `publicar-avivet`.
- Red causal de un problema nuevo → skill `red-causal` (fuente: la wiki `~/Documents/avivet-wiki`).
- Informe de visita / asesoría en Word → skill `informe-visita`.
