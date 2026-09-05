# Proyección Galpones · avivet.cl

Herramienta web para proyectar la producción de huevos de N galpones desfasados de gallinas Hy-Line Brown, con escenarios guardados, gráficos (Chart.js) y exportación a PDF/Excel.

## Contenido

```
proyeccion-galpones/
└── index.html      Página completa: HTML + CSS + JS en un solo archivo autocontenido
```

Un solo archivo, sin build ni dependencias que instalar. Las fuentes externas son Google Fonts (Crimson Pro, Inter, IBM Plex Mono), Chart.js y SheetJS (xlsx), todas cargadas vía CDN.

## Escenarios

Cada escenario (N° de galpones 1–7, sistema productivo, semanas de postura, fechas de ingreso, horizonte de proyección) se guarda en `localStorage` del navegador (clave `avivet_galpones_v1`) y puede crearse, editarse, recalcularse o eliminarse de forma independiente desde el selector superior. No hay backend: todo vive en el navegador de quien lo usa.

Los tres sistemas productivos (Jaulas, Libre de jaulas, Crianza libre / pastoreo) solo definen mortalidad, factor sobre la curva oficial de postura y una **duración de postura sugerida** — pero las semanas de postura son editables por escenario (20–82 semanas) porque en la práctica cada sistema sostiene un ciclo productivo de distinta duración (jaulas persiste más cerca del tope de la curva oficial; pastoreo/campo libre suele descartarse antes por estacionalidad, calidad de cáscara y depredación).

Pestañas disponibles por escenario: Resumen, Cronograma (Gantt), Producción semanal, Infraestructura (eficiencia y brechas), Anual, Curva genética de referencia, Detalle semanal y Configuración rápida.

## Despliegue en avivet.cl (GitHub Pages)

### Opción A — Subir como subdirectorio del sitio principal

Si avivet.cl está hospedado desde un repo tipo `alazoe.github.io` o `avivet`:

1. En el repo de GitHub, crear la carpeta `proyeccion-galpones/`
2. Subir `index.html`
3. Hacer commit y push
4. Acceder en: `https://avivet.cl/avivet/proyeccion-galpones/`

### Opción B — Repositorio independiente

```bash
# Desde la carpeta extraída
cd proyeccion-galpones
git init
git add .
git commit -m "Proyección galpones Hy-Line Brown"
git branch -M main
git remote add origin git@github.com:Alazoe/proyeccion-galpones.git
git push -u origin main
```

Luego en el repo: `Settings → Pages → Source: main / root`. URL final:
`https://alazoe.github.io/proyeccion-galpones/`

## Pruebas locales

Al ser un archivo autocontenido (sin `fetch()` a datos externos), `index.html` puede abrirse directamente con doble clic. También puede servirse con un servidor local si se prefiere:

```bash
cd proyeccion-galpones
python3 -m http.server 8000
# Abrir http://localhost:8000
```

## Actualizar el modelo

- **Curva genética:** editar la constante `CURVA_HYLINE_BROWN` en el `<script>` de `index.html` (objeto `{ semana: {pct, peso} }`, cubre semanas 19–100 — el tope `POSTURA_MAX` no puede superar ese rango sin extender la curva).
- **Sistemas productivos:** editar la constante `SISTEMAS` (mortalidad de crianza/postura, factor sobre la curva oficial y `semanas_postura_sugerida` por sistema — solo es una sugerencia inicial, el usuario la ajusta libremente por escenario).
- **Ciclo del lote:** `CRIANZA` (semanas fijas de recría, 18) + `semanas_postura` por escenario (20–82, ver `POSTURA_MIN`/`POSTURA_MAX`) + 2 semanas de limpieza fijas. El total se calcula con `cicloTotal(esc)`, no es una constante fija.

## Personalización

- **Colores:** variables CSS al inicio de `index.html` (`--color-primario`, `--color-acento`, etc.) y la paleta `PALETA` en JS (colores por galpón, hasta 7).
- **Fuentes:** cambiar el `<link>` de Google Fonts y las variables `--fuente-titulo`, `--fuente-cuerpo`, `--fuente-mono`.
- **Pestañas:** agregar/quitar entradas en `RENDER_TAB` y el botón/panel correspondiente en `construirSkeletonContenido()`.

## Licencia

Material técnico de avivet.cl. Uso interno para clientes y consultorías.
