# 📄 Informe de Telemedicina

**https://alazoe.github.io/avivet/informe-telemedicina/**

Herramienta para dejar por escrito, al cierre de una sesión de asesoría remota, **tus
indicaciones y observaciones** — no lo que completa el productor (eso ya lo cubre
[`telemedicina/`](../telemedicina/), el formulario de datos pre-consulta con envío a
Google Sheets). Este módulo es la otra mitad: lo que tú, como MV, dictaminas.

## ¿Cómo funciona?

1. Completa datos de la sesión: productor, ubicación, tipo de aves, fecha, modalidad.
2. Marca los **temas tratados** en la sesión.
3. En cada bloque de indicaciones (**vacunación**, **antiparasitarios**, **otros
   medicamentos**) toca un **chip** para insertar el nombre y completar dosis/vía a
   mano, o **dicta por voz** (🎤) — funciona igual que la
   [Bitácora de Terreno](../informe-visita/bitacora.html) de Informe de Visita.
4. Agrega observaciones generales y próximos pasos.
5. Presiona **Generar informe Word** — descarga un `.docx` editable, listo para
   enviar al productor.

Todo se guarda solo en este dispositivo (localStorage): mantiene una lista de
sesiones para retomar o volver a descargar, con export/import JSON de respaldo.

## Catálogos de chips (ficha técnica resumida, no reemplazan el criterio clínico)

Cada chip inserta una línea con el producto **y su utilidad** (qué previene o trata,
según la ficha real), lista para que ajustes dosis/vía al caso concreto:

- **Vacunación**: Newcastle, Bronquitis infecciosa, Viruela aviar, Coriza infecciosa,
  Cólera aviar — con la enfermedad/patógeno que cubre cada una. Además hay un
  desplegable **📅 Calendario de referencia** con el programa real de pollas de
  reemplazo (AGRICOVIAL) — día, enfermedad, vacuna y vía — solo para consulta, no
  se inserta en el informe.
- **Antiparasitarios y otros medicamentos**: los fármacos que ya tienen **ficha
  técnica y calculadora de dosis propia** en
  [`../calculadoras-dosis/`](../calculadoras-dosis/) — Levamisol (Levantel),
  Oxitetraciclina (Zanil 80 / Zanil HCL / Terrivet), Florfenicol (Veterin /
  Duflosan), Amoxicilina (Primavet), Trimetoprim+Sulfa (Azovetril), Enrofloxacino
  (Quiflumil / Enromic), Sulfacloropiridazina+TMP (Coliprim) — cada uno con un
  **🧮** que abre su calculadora en una pestaña nueva para sacar la dosis exacta
  del caso. Se completan con productos de uso frecuente que aún no tienen
  calculadora propia (Ivermectina, Fenbendazol, Piperazina, Amprolio, tierra de
  diatomeas, vitaminas + electrolitos, calcio, probióticos).

El texto de indicación/dosis de los productos con ficha vive en `TM_CATALOGO_MED`
(`app.js`) — mismo contenido que sus tarjetas en `calculadoras-dosis/index.html`;
si se actualiza allá, hay que reflejarlo aquí también (no hay una fuente única
compartida entre ambos módulos todavía).

## Diseño del documento

Reutiliza el estilo del informe de visita (paleta AviVet, membrete con logo, pie
corrido) pero sin sus cálculos de galpón/línea genética — es un módulo autónomo,
no depende de `curvas-geneticas`. Título del documento: **INFORME DE TELEMEDICINA**,
con nota fija de que es un resumen de sesión a distancia y no reemplaza un examen
clínico presencial. Firma informal: MV Andrés Lazo Escobar · Asesoría Veterinaria
(sin datos tipo receta).

## Stack

- HTML / CSS / JavaScript vanilla, sin build.
- [`docx` 8.5.0](https://docx.js.org/) vía CDN para generar el .docx en el navegador
  (todo ocurre localmente, nada se envía a servidores).
- Dictado por voz: Web Speech API (`es-CL`) donde el navegador lo soporta; en
  iPhone/Safari se usa el micrófono del teclado.
- `app.js` expone `tmConstruirDoc` / `tmNombreArchivo` vía `module.exports` para
  pruebas en Node.

> Los chips son solo referencia rápida: el criterio clínico del veterinario prevalece.
