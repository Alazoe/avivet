# Energía de la Gallina

**[→ Abrir](http://avivet.cl/avivet/energia-gallina/)**

Balance energético de la ponedora: dos gallinas comen la misma ración y una barra muestra qué parte de su energía diaria cubre. Incluye un formulador de dieta base (maíz, soya, canola, trigo, avena) con metas de energía, proteína y lisina por línea.

## Fuentes

- **Ecuaciones de energía:** Rostagno et al. 2024 (Tablas Brasileñas 5ª ed., Cap. 3), Peguri & Coon 1991, Brainer et al. 2016.
- **Lisina digestible factorial:** Rostagno et al. 2024, Tabla 3.16.
- **Composición de insumos:** Rostagno et al. 2024, Cap. 1, Tabla 1.01 (EM gallinas, lisina digestible aves, inclusión máxima en ponedora).
- **Curvas por línea genética** (peso, % postura, peso de huevo, consumo del manual por semana): copiadas de `curvas-geneticas/app.js` (objeto `LINEAS`, columnas de postura) en octubre de 2026.

## Mantenimiento

Los datos de las líneas están **duplicados** dentro de `index.html` (constante `CURVES`). Si se actualiza una curva en `curvas-geneticas/app.js`, hay que volver a copiarla aquí.
