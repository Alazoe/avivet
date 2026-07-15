# Recepción de Insumos

App para registrar en terreno la descarga de camiones de **Maíz**, **Harina de Soya** y **Conchuela**: divide el peso total de la guía en maxisacos (800–1000 kg c/u), genera el correlativo de cada uno para imprimir y pegar en el saco, y va sumando el peso real a medida que se llenan.

**URL (tras publicar en GitHub Pages):** https://alazoe.github.io/avivet/recepcion-insumos/
**Autor:** Andrés Lazo Escobar, Médico Veterinario · avivet.cl

---

## ¿Qué resuelve?

Hoy el registro es en papel: el correlativo de cada maxisaco se anota a mano y es fuente de errores (números repetidos, ilegibles, saltados), y no hay forma fácil de saber si el total cargado cuadra con la guía del camión. Esta herramienta:

1. **Recibe el peso total de la guía** (ej. 29.000 kg) y sugiere en cuántos maxisacos dividirlo para que cada uno quede entre 800 y 1000 kg.
2. **Genera todos los correlativos de una vez**, listos para imprimir como etiquetas y pegar en los sacos vacíos antes de llenarlos.
3. A medida que se llena cada saco, se **registra su peso real** contra su correlativo — la app va sumando el acumulado y muestra el saldo restante y cuánto debería pesar en promedio cada saco que falta, para ayudar a cuadrar el total.
4. Al cerrar la recepción, muestra la **diferencia final** entre lo acumulado y la guía, y cancela los correlativos sobrantes que no se llegaron a usar.

## Flujo de uso

1. **Nueva recepción de camión** → completa materia prima, camión/proveedor, peso total de la guía y fecha → "Calcular división en maxisacos" (puedes ajustar la cantidad sugerida) → "Crear recepción y generar correlativos".
2. **Imprimir etiquetas en blanco** → una por cada maxisaco generado, con su correlativo grande para pegar en el saco físico.
3. La recepción queda **abierta indefinidamente**: los sacos no tienen que usarse todos el mismo día ni en orden. En **Recepción activa** hay una cuadrícula con el número de cada maxisaco — tocas el que usaste ese día (aunque sea el N° 15 de 30), ingresas su peso real y se **tacha visualmente**. Lo que queda sin tachar es el stock real pendiente.
4. Tocar un saco ya tachado (registrado) precarga su peso para corregirlo si te equivocaste.
5. Si el camión no alcanza a llenar todos los sacos planeados, usa **Cancelar** en los sobrantes (tabla de detalle).
6. **Reimprimir con pesos** → reimprime las mismas etiquetas pero mostrando el peso real ya registrado de cada saco, útil como respaldo impreso una vez terminada la descarga.
7. **Cerrar recepción** cuando termines de descargar el camión — muestra la diferencia final vs la guía.
8. El selector de recepciones muestra **abiertas y cerradas**. Al elegir una **cerrada**, la cuadrícula cambia de función: ya no registra peso del camión, sino que sirve para ir **tachando cada maxisaco a medida que lo usas en tu producción diaria** (sin importar el día ni el orden). El stat "Stock real (sin usar en producción)" muestra cuántos maxisacos de esa descarga quedan disponibles todavía. Tocar un saco tachado lo destacha (por si te equivocaste).

## Formato de correlativo

| Nivel | Formato | Ejemplo |
|---|---|---|
| Recepción (camión) | `PREFIJO-AAAAMMDD-##` | `MZ-20260714-01` (1er camión de maíz del día) |
| Maxisaco | `{recepción}-###` | `MZ-20260714-01-015` (saco 15 de esa recepción) |

| Materia prima | Prefijo |
|---|---|
| Maíz | MZ |
| Harina de Soya | HS |
| Conchuela | CO |

Cada correlativo de saco queda ligado a su camión de origen — trazabilidad completa sin depender de la memoria de quién cargó qué.

## Arquitectura

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML + JS estático (GitHub Pages) |
| Backend | Google Apps Script (Web App) |
| Base de datos | Google Sheet (hojas `RECEPCIONES` y `MAXISACOS`) |

## Estructura del repositorio

```
recepcion-insumos/
├── index.html   App completa (HTML + CSS + JS)
└── code.gs       Backend Google Apps Script
```

## Configuración inicial (una vez)

### 1. Crear el Google Sheet

Crea una hoja de cálculo nueva en Google Drive (vacía, el script crea las pestañas `RECEPCIONES` y `MAXISACOS` solo). Copia su ID desde la URL (entre `/d/` y `/edit`).

### 2. Crear el proyecto de Apps Script

En el mismo Sheet: **Extensiones → Apps Script**. Pega el contenido de `code.gs` y crea un archivo HTML llamado `index` con el contenido de `index.html`.

### 3. Configurar la propiedad del script

**Configuración del proyecto → Propiedades de script → Agregar propiedad**:
- `SHEET_ID` = el ID copiado en el paso 1

### 4. Publicar como Web App

**Implementar → Nueva implementación → Aplicación web**:
- Ejecutar como: **Yo**
- Quién tiene acceso: **Cualquier usuario**

Copia la URL `.../exec` que entrega.

### 5. Conectar el frontend

En `index.html`, reemplaza:

```js
const APP_URL = 'PEGA_AQUI_LA_URL_DE_TU_WEB_APP';
```

por la URL del paso anterior, y publica `index.html` en GitHub Pages (o ábrelo directo desde Apps Script mientras pruebas). Si ya tenías una implementación publicada, recuerda subir **Nueva versión** desde **Implementar → Administrar implementaciones** para que los cambios se reflejen en la misma URL.

## Extrapolación futura a Odoo

El modelo de datos ya está pensado para mapear directo a los módulos estándar de Odoo:

| Este sistema | Odoo (Inventario) |
|---|---|
| `id_recepcion` (RECEPCIONES) | `stock.picking` de recepción, con `origin` = guía del camión |
| `correlativo` (MAXISACOS) | `lot_id` / número de serie del maxisaco (`stock.lot`) |
| `materia_prima` | `product_id` (`product.product`) |
| `peso_real_kg` | `product_uom_qty` del movimiento de stock (`stock.move.line`) |
| `peso_total_guia` | Cantidad esperada del `stock.move` (demand) |
| `camion_proveedor` | `res.partner` (proveedor) asociado al `stock.picking` |

Cuando se migre, cada recepción se puede importar como un `stock.picking` con una línea por maxisaco (`stock.move.line` con lote propio) — el correlativo actual pasa a ser el número de lote/serie de Odoo, sin perder trazabilidad.
