# Sistema Avícola — Inventario de Huevos

## Descripción

Aplicación web de página única (single-file HTML) para gestión de inventario y ventas de huevos, diseñada para productores avícolas chilenos. Permite registrar lotes de producción por categoría (norma chilena AAA–C), procesar ventas con descuento FIFO automático, administrar insumos de embalaje, configurar la estructura de costos y visualizar márgenes por categoría en tiempo real. Todos los datos se sincronizan con Firebase Firestore, por lo que funciona en cualquier dispositivo con acceso a internet sin necesidad de servidor propio.

---

## Firebase — Configuración

**Proyecto:** `avicola-clarita`

| Parámetro | Valor |
|-----------|-------|
| Auth domain | `avicola-clarita.firebaseapp.com` |
| Project ID | `avicola-clarita` |
| Storage bucket | `avicola-clarita.firebasestorage.app` |
| Messaging sender ID | `515153009051` |
| App ID | `1:515153009051:web:579a104f6075a1e05f293e` |

**Autenticación habilitada:** Email/Password (Firebase Auth).

**Reglas de Firestore recomendadas:** cada colección usa un campo `uid` para aislar los datos de cada productor. Las reglas deben verificar `request.auth.uid == resource.data.uid` para lectura/escritura, y `request.auth != null` para creación.

---

## Características por pestaña

### 📊 Dashboard
- KPI cards: stock total, valor en stock, ventas del mes (CLP + cantidad), lotes activos.
- Mini tarjetas por categoría con stock, valor y margen estimado.
- Alerta automática si alguna categoría tiene margen negativo.

### 📦 Inventario
- Tarjetas por categoría con stock, barra proporcional, equivalencias en cajas y valor a precio actual.
- Tabla de equivalencias en formatos: Caja×180, Caja×30, Docena×12, Media docena×6.

### ➕ Ingresar Lote
- Selector de categoría y formato con botones visuales.
- Campos: cantidad de cajas, número de lote, fecha de elaboración, notas.
- Vista previa con unidades resultantes y stock proyectado.

### 🛒 Vender
- Selector de categoría (muestra stock disponible) y formato.
- FIFO automático: descuenta de los lotes más antiguos primero.
- Vista previa con total CLP y margen estimado al momento de la venta.
- Comprobante de venta con detalle completo después de cada operación.

### 📋 Historial
- Filtros por mes y por categoría.
- KPIs: total recaudado, unidades vendidas, transacciones, margen promedio.
- Columna de margen por fila (calculada con los costos configurados).

### 🗂 Lotes
- Tabla de todos los lotes con estado (completo / parcial / agotado), unidades disponibles y porcentaje vendido.

### ⚙️ Precios
- Precio de venta por unidad para cada categoría.
- Vista previa de equivalencias (×30, ×12, ×6) en tiempo real.
- Guardado en Firestore colección `precios/{uid}`.

### 📦 Insumos
- Lista de materiales de empaque con nombre, descripción, unidad y costo unitario.
- Agregar, editar y eliminar insumos mediante modal con backdrop blur.
- Ícono automático según tipo de insumo (bandeja, caja, etiqueta, bolsa).

### 💰 Costos
- **Sección 1:** costo productivo por categoría en $/huevo.
- **Sección 2:** para cada insumo, configurar "N unidades cada M huevos" → ratio = N/M.
- **Sección 3:** tabla resumen con costoProducción, costoInsumos, costoTotal, precioVenta, margen $ y margen % por categoría.
- Guardado en Firestore colección `costos/{uid}`.

---

## Modelo de datos

### `lotes/{docId}`
```
uid               string   — UID del productor
productor         string   — Nombre / email
categoria         string   — "AAA" | "AA" | "A" | "B" | "C"
formato           string   — Label del formato (ej: "Caja 30")
formatoId         string   — ID del formato (ej: "caja30")
cajasIngresadas   number
unidadesTotal     number
disponible        number   — Decrementado en cada venta (FIFO)
numeroLote        string
fechaElaboracion  string   — "YYYY-MM-DD"
notas             string
createdAt         Timestamp
```

### `ventas/{docId}`
```
uid          string
productor    string
categoria    string
formato      string
formatoId    string
cajas        number
unidades     number
precioUnit   number   — Precio por unidad al momento de la venta
total        number   — precioUnit × unidades
cliente      string
createdAt    Timestamp
fechaLocal   string
```

### `precios/{uid}`
```
AAA   number   — CLP por unidad
AA    number
A     number
B     number
C     number
```

### `insumos/{docId}`
```
uid            string
nombre         string   — Ej: "Bandeja plástica 30"
descripcion    string
unidad         string   — "unidad" | "caja" | "pack" | "rollo"
costoUnitario  number   — CLP por unidad
createdAt      Timestamp
```

### `costos/{uid}`
```
costoProduccion   object   — { AAA: number, AA: number, A: number, B: number, C: number }
insumosRatio      object   — { [insumoId]: ratio }  (ratio = N/M, unidades por huevo)
```

---

## Fórmula de cálculo de costos

```
ratio[insumoId]     = N / M
                      (N unidades del insumo cada M huevos)

costoInsumos[cat]   = Σ (costoUnitario[insumoId] × ratio[insumoId])
                      para todos los insumos

costoTotal[cat]     = costoProduccion[cat] + costoInsumos[cat]

margenAbs[cat]      = precioVenta[cat] - costoTotal[cat]

margenPct[cat]      = margenAbs[cat] / precioVenta[cat] × 100
```

---

## Categorías de huevos (Norma Chilena)

| Categoría | Peso | Color badge |
|-----------|------|-------------|
| AAA | ≥ 73 g | Dorado `#c9a84c` |
| AA  | 63–72 g | Plateado `#9e9e9e` |
| A   | 53–62 g | Bronce `#cd7f32` |
| B   | 43–52 g | Verde `#6ec49a` |
| C   | < 43 g  | Gris `#888` |

---

## Cómo desplegar

El archivo `index.html` es completamente autocontenido. No requiere proceso de build ni servidor:

1. **Abrir directamente:** abre `index.html` en cualquier navegador moderno.
2. **Hosting estático:** copia `index.html` a cualquier servicio (GitHub Pages, Netlify, Vercel, Firebase Hosting, Cloudflare Pages). No se necesitan archivos adicionales.
3. **Firebase Hosting (recomendado):**
   ```bash
   firebase init hosting   # directorio público: .
   firebase deploy
   ```

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + ES Modules (vanilla JS) |
| Autenticación | Firebase Auth (email/password) |
| Base de datos | Cloud Firestore (NoSQL, tiempo real) |
| Fuentes | Google Fonts: Playfair Display, Inter |
| CDN Firebase | `gstatic.com/firebasejs/10.12.0` |
| Build | Ninguno — archivo único sin dependencias locales |
