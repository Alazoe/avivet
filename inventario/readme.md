# Sistema de Inventario de Alimento — AviVet

Control de materias primas para plantas de alimento avícola. Cada planta tiene su propia Google Sheet y deploy de Google Apps Script. El frontend es compartido y se personaliza por cliente vía parámetro `?c=`.

---

## Acceso rápido

| Planta | App Conteo | Panel Admin | Google Sheet |
|--------|------------|-------------|--------------|
| **La Campestre** | [Abrir conteo](https://avivet.cl/avivet/inventario/?c=campestre) | [Abrir admin](https://avivet.cl/avivet/inventario/admin.html?c=campestre) | [Ver Sheet](https://docs.google.com/spreadsheets/d/1AhcHJ0rgewyu4FPh_37lih5iLjHEyrtkjpt86HhzQtA/edit) |
| **Praderas del Ranco** | [Abrir conteo](https://avivet.cl/avivet/inventario/?c=praderas-ranco) | [Abrir admin](https://avivet.cl/avivet/inventario/admin.html?c=praderas-ranco) | [Ver Sheet](https://docs.google.com/spreadsheets/d/1mEr6zgj2IM43FMg0kGePljM1WmKYoi2xnRxhNYMOEYM/edit) |
| **Reinhard** | [Abrir conteo](https://avivet.cl/avivet/inventario/?c=reinhard) | [Abrir admin](https://avivet.cl/avivet/inventario/admin.html?c=reinhard) | [Ver Sheet](https://docs.google.com/spreadsheets/d/1Ec9SzJayEOddPb0CA7f4P4CCxiWfuv-z6O3WUr7xuls/edit) |

- **Portal plantas**: https://avivet.cl/avivet/plantasdealimento
- **Manual de usuario**: https://avivet.cl/avivet/manual

---

## Detalle por planta

### La Campestre

- **Config**: `config/campestre.json`
- **Código GAS**: `code.gs`
- **Google Sheet ID**: `1AhcHJ0rgewyu4FPh_37lih5iLjHEyrtkjpt86HhzQtA`
- **GAS Deploy URL**:
  ```
  https://script.google.com/macros/s/AKfycby8dfFibuDyDeRRK3J44Vqw9pJA1F3sMFKuYPHoC_1OHB-GIeeOlAYCdMDklE8o7b7u/exec
  ```
- **Bodeguera**: Verónica Gangas

---

### Praderas del Ranco

- **Config**: `config/praderas-ranco.json`
- **Código GAS**: `code_praderas-ranco.gs`
- **Google Sheet ID**: `1mEr6zgj2IM43FMg0kGePljM1WmKYoi2xnRxhNYMOEYM`
- **GAS Deploy URL**:
  ```
  https://script.google.com/macros/s/AKfycbx6LZHLrah39NTTbb8nsNHMw3wEtIptIjwIqt8jnvfMKJepWBh1SbJ3xEjG4CTJhXHHLw/exec
  ```

---

### Reinhard

- **Config**: `config/reinhard.json`
- **Código GAS**: `code_reinhard.gs`
- **Google Sheet ID**: `1Ec9SzJayEOddPb0CA7f4P4CCxiWfuv-z6O3WUr7xuls`
- **GAS Deploy URL**:
  ```
  https://script.google.com/macros/s/AKfycbz7i4BtaB54MtfDy87mafELK3APRPvxSdjZ-zQwOvoEkVsGozrMi5PO8HTRdFopiyFJJA/exec
  ```

---

## Agregar una nueva planta

1. Crear una Google Sheet nueva y vacía
2. Ir a **Extensiones → Apps Script**, borrar el contenido por defecto
3. Copiar el contenido de `code_template.gs` y pegarlo completo
4. Editar la sección de configuración al inicio:
   ```javascript
   var SHEET_ID = "ID_DE_TU_NUEVA_SHEET";
   var NOMBRE_PLANTA = "Nombre de la planta";
   ```
5. Ejecutar `inicializarTemplate()` una sola vez (crea todas las hojas automáticamente)
6. Desplegar: **Implementar → App web → Ejecutar como yo → Cualquiera puede acceder → Implementar**
7. Copiar la URL del deploy
8. Duplicar cualquier `config/*.json`, renombrarlo con el ID del nuevo cliente y actualizar:
   - `clientId`: ID corto (ej. `mi-planta`)
   - `clientName`: nombre visible
   - `backendUrl`: URL del deploy copiada en paso 7
9. Agregar la card en `plantasdealimento/index.html`
10. Push a `main` → GitHub Pages publica automáticamente

> Las nuevas plantas parten desde cero (sin materias primas ni recetas). Se cargan desde el panel admin.

---

## Actualizar código GAS (redesplegar)

Cada vez que se modifica el `.gs` hay que crear una nueva versión del deploy para que los cambios tomen efecto. **La URL pública no cambia.**

> Apps Script → **Implementar → Administrar implementaciones → ✏️ (editar) → Nueva versión → Guardar**

---

## Estructura de la Google Sheet

| Hoja | Descripción |
|------|-------------|
| `CONFIG` | Nombre planta, responsable, días de alerta |
| `MATERIAS_PRIMAS` | Catálogo: código, nombre, unidad, grupo, precio |
| `RECETAS` | Fórmulas por dieta (kg por 1.000 kg de mezcla) |
| `RECETAS_HISTORIAL` | Respaldo automático de cada guardado de recetas |
| `CONTEOS_FISICOS` | Historial de todos los conteos con fecha y hora |
| `STOCK_ACTUAL` | Stock vigente por MP; columna D = stock mínimo |
| `ORDENES_COMPRA` | Órdenes con estado (pendiente / recibida / anulada) |
| `PLANIFICACION` | kg/día por dieta — ventana de planificación |
| `PROYECCIONES` | Consumo estimado de MPs según planificación |
| `STOCK_TEORICO` | Stock calculado vs. conteo real |

---

## Stack técnico

- **Frontend**: HTML + CSS + Vanilla JS — sin dependencias externas
- **Backend**: Google Apps Script (`doGet` con router por `action`)
- **Base de datos**: Google Sheets (una por planta)
- **Hosting**: GitHub Pages → avivet.cl (prefijo `/avivet/`)
- **Offline**: `localStorage` + sync queue automático

---

*Sistema bajo la marca [AviVet](https://avivet.cl) · Valdivia, Chile*
