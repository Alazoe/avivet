# 📦 Sistema de Inventario — Planta de Alimentos La Campestre

Sistema de control de inventario de materias primas para la planta de alimentos de Huevos La Campestre. Desarrollado con Google Apps Script + Google Sheets como backend y GitHub Pages como frontend.

---

## 🔗 URLs

| App | URL | Usuario |
|-----|-----|---------|
| Control de inventario | [avivet.cl/Inventario-Campestre/](https://avivet.cl/avivet/Inventario-Campestre/) | Verónica Gangas |
| Panel admin | [avivet.cl/Inventario-Campestre/admin.html](https://avivet.cl/avivet/Inventario-Campestre/admin) | Andrés Lazo |

---

## 🗂 Estructura del proyecto

```
Inventario-Campestre/
├── index.html       # App móvil de conteo físico (Verónica)
├── admin.html       # Panel administrativo (Andrés)
└── README.md
```

**Backend:**
- Google Sheet: `1AhcHJ0rgewyu4FPh_37lih5iLjHEyrtkjpt86HhzQtA`
- Apps Script Web App: desplegado como acceso público

---

## 📋 Hojas del Google Sheet

| Hoja | Descripción |
|------|-------------|
| `CONFIG` | Parámetros del sistema (responsables, alertas) |
| `MATERIAS_PRIMAS` | Maestro de insumos con unidad, grupo, proveedor y precio |
| `RECETAS` | Fórmulas de las 8 dietas en kg por 1.000 kg de mezcla |
| `CONTEOS_FISICOS` | Registro histórico de todos los conteos de bodega |
| `STOCK_ACTUAL` | Stock en tiempo real con estado y alertas automáticas |
| `ORDENES_COMPRA` | Historial y estado de órdenes de compra |
| `PROYECCIONES` | Consumo estimado de MPs según producción diaria |

---

## 📱 App de conteo (Verónica)

Diseñada para uso móvil. Permite:

- Ver todas las materias primas agrupadas por categoría con stock actual
- Registrar conteos físicos con soporte de expresiones: `770 + 22 + 21 = 813`
- Funciona **offline** — guarda localmente y sincroniza al recuperar conexión
- Historial de conteos del día
- **Exportar PDF** de cierre diario con conteos + stock completo

---

## 🖥 Panel admin (Andrés)

Acceso con contraseña. Incluye:

- Dashboard con métricas globales y alertas de stock crítico
- Tabla de stock ordenada por estado (críticos primero)
- Gestión de órdenes de compra
- Vista de recetas y fórmulas comparativas
- Proyecciones de consumo: ingresa kg/día por dieta → calcula días de stock restantes por MP

---

## 🧪 Materias primas registradas (23)

| Grupo | Insumos |
|-------|---------|
| Energéticos | Maíz, Harinilla Trigo |
| Proteínas | Afrecho Soya |
| Minerales | Conchuela, Fosfato Phosbic, Sal Fina |
| Aminoácidos | Metionina, Lisina 99% |
| Núcleos | Nucleo Solagro Ponedora, Nucleo Solagro Pollita |
| Aditivos | Secuestrante, Regulador Intestinal, Polifeed, Ovotop, Pigmento, Emeral, Fitogénico, Chicktonic |
| Medicamentos | Coccisan |
| Envases | Sacos 50x80 (blanco, gris, amarillo, rojo) |

---

## 🌾 Dietas activas (7)

| Dieta | Código | Desde |
|-------|--------|-------|
| Ponedora 1 | 20P120-65 | may-19 |
| Ponedora 2 | 20P266-90 | may-19 |
| Pollita Inicial | 20INI1-08 | may-19 |
| Recría | 20REC9-15 | may-19 |
| Prepostura | — | may-19 |
| Lolol | — | may-19 |
| Polla Nueva | — | ene-25 |

> Dieta **Lampa** marcada como inactiva.

---

## ⚙️ Configuración inicial (Apps Script)

1. Abrir el Google Sheet → **Extensiones → Apps Script**
2. Pegar el contenido de `backend_inventario.gs`
3. Ejecutar la función `inicializarSistema()` — crea todas las hojas automáticamente
4. **Implementar → Nueva implementación**
   - Tipo: Aplicación web
   - Ejecutar como: Yo
   - Acceso: Cualquier persona
5. Copiar la URL generada y actualizarla en `index.html` y `admin.html` (constante `BACKEND`)

---

## 🔄 Integración con Odoo

El Sheet está estructurado para exportación directa a Odoo:

| Módulo Odoo | Hoja de origen | Acción |
|-------------|---------------|--------|
| Inventario → Productos | `MATERIAS_PRIMAS` | Importar CSV |
| Inventario → Stock | `STOCK_ACTUAL` | Importar CSV |
| Compras → Proveedores | `MATERIAS_PRIMAS` (col. Proveedor) | Importar CSV |
| Compras → OC | `ORDENES_COMPRA` | Filtrar estado = PENDIENTE |
| Fabricación → Lista de materiales | `RECETAS` | Una fila por insumo/receta |

> El implementador de Odoo puede exportar cualquier hoja como CSV desde **Archivo → Descargar → CSV** y luego importarla directamente.

---

## 🛠 Stack técnico

- **Frontend:** HTML + CSS + Vanilla JS — sin dependencias externas
- **Backend:** Google Apps Script (doGet / doPost)
- **Base de datos:** Google Sheets
- **Hosting:** GitHub Pages → avivet.cl
- **Offline:** localStorage + sync queue automático

---

## 👥 Equipo

| Rol | Nombre | Contacto |
|-----|--------|---------|
| Médico Veterinario / Admin | Andrés Lazo Escobar | andreslazomv@outlook.com |
| Encargada de Bodega | Verónica Gangas | — |

---

*Sistema desarrollado bajo la marca [AviVet](https://avivet.cl) · Valdivia, Chile*
