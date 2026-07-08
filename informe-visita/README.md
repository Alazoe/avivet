# 📄 Informe de Visita Técnica

**https://alazoe.github.io/avivet/informe-visita/**

Herramienta para generar el informe técnico de una visita a productor en un clic:
se ingresan las características del galpón y del lote, y se descarga un documento
**Word (.docx) editable** con todos los requerimientos calculados.

## ¿Cómo funciona?

1. Completa el formulario: productor, fecha de visita, línea genética, fecha de
   nacimiento del lote, número de aves y dimensiones del galpón.
2. Presiona **Generar informe** — se muestra una vista previa en pantalla.
3. Presiona **Descargar Word (.docx)** — el archivo queda listo para editar
   (agregar observaciones, fotos, firma) y entregar al productor.

## ¿Qué calcula?

| Sección | Contenido |
|---|---|
| **Edad del lote** | Semana de vida, día de vida, etapa (crianza/postura) y fase de crianza a la fecha de la visita |
| **Parámetros objetivo** | Peso corporal, consumo de alimento y agua (por ave y total del lote), % postura, huevos/día y bandejas esperadas, mortalidad acumulada esperada |
| **Equipamiento requerido** | Bebederos (campana, nipple, arranque), comederos (lineal, redondo por diámetro, arranque), perchas, nidos, superficie mínima — según fase |
| **Densidad** | Densidad real vs. recomendada con dictamen CUMPLE / SOBRECARGA |
| **Ventilación** | Mínima (0,7 m³/h/kg) y capacidad (4 m³/h/kg) sobre la biomasa estimada |
| **Ambiente de crianza** | Temperatura, intensidad lumínica y horas de luz por edad (primeras 6 semanas) |
| **Proyección** | Peso, consumo y postura de las próximas 4 semanas |
| **Observaciones y recomendaciones** | Texto libre del veterinario (o líneas en blanco para completar en Word) |

## Fuentes de datos

- **Líneas genéticas** (peso, consumo, postura, mortalidad, ambiente): reutiliza
  `LINEAS` y `EQ` de [`../curvas-geneticas/app.js`](../curvas-geneticas/) —
  manuales oficiales Hy-Line Brown, Hy-Line W-80, Lohmann Brown, Nick Brown y
  Dekalb Brown. Un solo punto de mantención: cualquier corrección en curvas-geneticas
  se refleja aquí automáticamente.
- **Equipamiento de crianza por fase** (0–2, 2–5, 5–10, 10–17 semanas): guía de
  equipamiento y control ambiental para pollas de reemplazo (válida para todas
  las líneas).
- **Densidad postura piso**: 9 aves/m² útil (norma UE sistemas alternativos).

## Stack

- HTML / CSS / JavaScript vanilla, sin build.
- [`docx` 8.5.0](https://docx.js.org/) vía CDN para generar el .docx en el navegador
  (no se envía ningún dato a servidores — todo ocurre localmente).

> Los valores son referenciales: el criterio clínico del veterinario prevalece.
