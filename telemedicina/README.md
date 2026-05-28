# Planilla Telemedicina Avícola — AviVet

Formulario web para recopilar información de productores antes o después de una sesión de telemedicina. Los datos se envían automáticamente a Google Sheets y las fotos a Google Drive.

| | URL |
|---|---|
| **Formulario (productores)** | [avivet.cl/avivet/telemedicina](https://avivet.cl/avivet/telemedicina/) |
| **Panel de consultas (privado)** | [avivet.cl/avivet/telemedicina/dashboard](https://avivet.cl/avivet/telemedicina/dashboard/) |

---

## Flujo de datos

1. El productor llena el formulario y adjunta fotos.
2. Al enviar, el navegador comprime las fotos (JPEG, máx. 1200px) y hace POST al Apps Script.
3. El script guarda una fila en el Google Sheet y las fotos en una carpeta de Google Drive nombrada `FECHA_Productor`.
4. El link a la carpeta queda en la columna **Fotos en Drive** del Sheet.

---

## Secciones del formulario

| # | Sección | Campos destacados |
|---|---------|-------------------|
| 1 | Identificación | Nombre, teléfono, email, región (Valparaíso → Magallanes) |
| 2 | Pabellón | Largo × ancho × altura, cubierta, muro, ventilación, iluminación. Si hay ≥ 2 pabellones, permite dimensionar cada uno |
| 3 | Sistema de alojamiento | **Jaulas:** calculadora cm²/ave · **Piso:** calculadora aves/m² · **Semilibertad** |
| 4 | Equipamiento | Comederos (tipo + diámetro), bebederos, nidales, fuente y tratamiento de agua |
| 5 | Lote | N° lotes, línea genética, semana, etapa, aves, postura. Si hay ≥ 2 lotes, permite detallar cada uno |
| 6 | Parámetros | Total huevos/día, % postura, peso corporal, humedad, termómetro + T° mínima |
| 7 | Alimentación | Tipo (comercial/propio/mixto), N° veces al día, horarios, suplementos |
| 8 | Sanidad | Vacunación, ectoparásitos, desinfección, registro productivo |
| 9 | Motivo de consulta | Problema principal, descripción, tratamientos previos |
| 10 | Fotos | Upload directo: cama/piso · nidales · ventilación/entrada · sospecha enfermedad |

---

## Panel de consultas (dashboard)

URL privada: `avivet.cl/avivet/telemedicina/dashboard/`

- **Acceso** por código (definido en `CODIGO_CORRECTO` en el HTML y `DATA_TOKEN` en el Apps Script).
- **Estadísticas:** total de consultas, este mes, regiones, con fotos.
- **Filtros:** búsqueda libre, región, motivo, sistema de alojamiento.
- **Tarjetas** ordenadas de más reciente a más antigua.
- **Detalle completo** al hacer clic en cada tarjeta.
- **Link directo** a la carpeta de fotos en Drive.

---

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Formulario público para productores |
| `dashboard/index.html` | Panel privado de visualización de consultas |
| `apps-script.gs` | Backend: recibe datos (POST), guarda fotos en Drive, devuelve datos al dashboard (GET) |

---

## Configuración del backend (Apps Script)

El script ya está desplegado. Para re-desplegar o migrar:

1. Abre [script.google.com](https://script.google.com) → pega el contenido de `apps-script.gs`.
2. Reemplaza `SHEET_ID` con el ID de tu Google Sheet.
3. Cambia `DATA_TOKEN` por tu código privado (debe coincidir con `CODIGO_CORRECTO` en `dashboard/index.html`).
4. **Implementar → Nueva implementación:**
   - Tipo: *Aplicación web* · Ejecutar como: *Yo* · Acceso: *Cualquier persona*
5. Copia la URL y pégala en `index.html` y `dashboard/index.html` (`APPS_SCRIPT_URL`).
6. Commit + push.

### Recursos actuales
- **Google Sheet:** [AviVet Telemedicina](https://docs.google.com/spreadsheets/d/1NpAJJkV1k6U-q1ZOCGFFoK8oyBAIWGH6535Wc-bA8Yw/edit)
- **Apps Script:** `https://script.google.com/macros/s/AKfycbysLTpZKj4y47xd9qXM_WsZYJegyDN27UDajZr0JVpAg7J67YGqMt_ixVr3GJCWJcyljw/exec`
- **Fotos Drive:** carpeta `AviVet Telemedicina Fotos` en Google Drive

---

## Compartir con pacientes

```
Hola! Para preparar mejor nuestra sesión de telemedicina,
te pido que completes esta planilla con los datos de tu plantel:
https://avivet.cl/avivet/telemedicina/
```

---

*MV Andrés Lazo E. · [avivet.cl](https://avivet.cl)*
