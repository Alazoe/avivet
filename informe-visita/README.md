# 📄 Informe de Visita Técnica

**https://alazoe.github.io/avivet/informe-visita/**

Herramienta para generar el informe técnico de una visita a productor en un clic:
se ingresan las características del galpón y del lote, y se descarga un documento
**Word (.docx) editable** con todos los requerimientos calculados.

## Dos modos

- **Informe** ([`index.html`](index.html)) — formulario de escritorio: llenas los datos y descargas el Word.
- **Bitácora de terreno** ([`bitacora.html`](bitacora.html)) — pensada para el **celular**: dictas la visita por voz, se guarda sola en el teléfono y generas el informe desde ahí. Ver sección [Bitácora](#bitácora-de-terreno).

## ¿Cómo funciona?

1. Completa el formulario: productor, fecha de visita, línea genética, fecha de
   nacimiento del lote, número de aves y dimensiones del galpón.
2. Presiona **Generar informe** — se muestra una vista previa en pantalla.
3. Presiona **Descargar Word (.docx)** — el archivo queda listo para editar
   (agregar observaciones, fotos, firma) y entregar al productor.

## Tipos de visita

Un selector define qué contiene el informe:

- **Primera visita** (completa, diagnóstico): datos, parámetros objetivo, equipamiento,
  densidad, ambiente de crianza, observaciones y recomendaciones/acciones. Deja el estándar
  por escrito una vez.
- **Seguimiento** (liviana, 1–2 páginas): solo datos generales, observaciones y
  **recomendaciones y acciones a seguir**. Omite objetivo, equipamiento, densidad y ambiente
  — para no dejar registrado en cada visita lo que ya se estableció en la primera. El
  documento se titula **INFORME DE SEGUIMIENTO**.

## ¿Qué calcula? (secciones de la primera visita)

| Sección | Contenido |
|---|---|
| **Edad del lote** | Semana de vida, día de vida, etapa (crianza/postura) y fase de crianza a la fecha de la visita |
| **Parámetros objetivo** | Peso corporal, consumo de alimento y agua (por ave y total del lote), % postura, huevos/día y bandejas esperadas, mortalidad acumulada esperada |
| **Equipamiento requerido** | Bebederos (campana, nipple, arranque), comederos (lineal, redondo por diámetro, arranque), perchas, nidos, superficie mínima — según fase |
| **Densidad** | Densidad real del galpón comparada contra referencias, con superficie mínima y dictamen Cumple / Sobrecarga por cada una. En postura: recomendación AviVet (6 aves/m²) y certificación (0,14 m²/ave ≈ 7,14 aves/m²) |
| **Ambiente de crianza** | Temperatura, intensidad lumínica y horas de luz por edad (primeras 6 semanas) |
| **Observaciones y recomendaciones y acciones** | Texto libre del veterinario (o líneas en blanco para completar en Word). Presentes en ambos tipos de visita |

## Fuentes de datos

- **Líneas genéticas** (peso, consumo, postura, mortalidad, ambiente): reutiliza
  `LINEAS` y `EQ` de [`../curvas-geneticas/app.js`](../curvas-geneticas/) —
  manuales oficiales Hy-Line Brown, Hy-Line W-80, Lohmann Brown, Nick Brown y
  Dekalb Brown. Un solo punto de mantención: cualquier corrección en curvas-geneticas
  se refleja aquí automáticamente.
- **Equipamiento de crianza por fase** (0–2, 2–5, 5–10, 10–17 semanas): guía de
  equipamiento y control ambiental para pollas de reemplazo (válida para todas
  las líneas).
- **Densidad postura piso**: se comparan dos referencias — 6 aves/m² (recomendación MV Andrés Lazo) y 0,14 m²/ave ≈ 7,14 aves/m² (certificación).

## Bitácora de terreno

[`bitacora.html`](bitacora.html) — captura móvil de la visita:

- **Datos del plantel** + **observaciones por tema**: estado sanitario, cama y ambiente,
  agua y alimento, equipamiento, mortalidad y bioseguridad, más recomendaciones.
- **Dictado por voz**: botón 🎤 en cada bloque (Web Speech API, `es-CL`) donde el navegador
  lo soporta; en iPhone/Safari se usa el micrófono del teclado, que funciona en cualquier campo.
- **Guardado automático en el teléfono** (localStorage): cada tecla se guarda; se mantiene una
  lista de visitas que sobrevive al cerrar el navegador. Nada se envía a servidores.
- **Generar informe Word**: arma las observaciones de todos los bloques y llama al mismo motor
  `ivCalcular` / `ivConstruirDoc` del informe. Un solo motor, dos entradas.
- **Respaldo**: exportar/importar la bitácora completa como JSON (para respaldar o mover de dispositivo).

> `bitacora.js` expone `btArmarInput()` (bitácora → input del informe) vía `module.exports` para tests en Node.

## Diseño del documento

El .docx se genera con una plantilla de informe técnico (`ivConstruirDoc`):

- **Membrete con el logo real de AviVet** ([`assets/avivet_logo.png`](assets/)) a la izquierda
  y el tipo de documento + predio + fecha a la derecha, con regla ámbar (si el logo no carga,
  cae a un monograma tipográfico).
- **Pie corrido** en cada página (contacto + número de página).
- **Franja-resumen** con las cifras clave (semana, etapa, aves, postura/peso objetivo).
- **Secciones** con franja de color y numeración; **tablas** con encabezado verde,
  filas alternadas (cebra) y bordes finos.
- **Dictámenes con color**: ✔ Cumple en verde, ✘ Sobrecarga en rojo.
- **Recuadros** para observaciones y recomendaciones, y bloque de firma.

Paleta AviVet (verde `#1B4332`, ámbar `#F0A500`), tipografía Calibri.

## Stack

- HTML / CSS / JavaScript vanilla, sin build.
- [`docx` 8.5.0](https://docx.js.org/) vía CDN para generar el .docx en el navegador
  (no se envía ningún dato a servidores — todo ocurre localmente).

> Los valores son referenciales: el criterio clínico del veterinario prevalece.
