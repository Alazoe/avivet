# Planilla Telemedicina Avícola — AviVet

Formulario web para recopilar información de los productores antes o después de una sesión de telemedicina. Los datos se envían automáticamente a Google Sheets para construir una base de datos de consultas.

**URL pública:** [avivet.cl/avivet/telemedicina](https://avivet.cl/avivet/telemedicina/)

---

## Qué hace

- El productor llena el formulario en su celular o computador.
- Al hacer clic en **Enviar planilla**, los datos van via `fetch` al Apps Script desplegado.
- El script escribe una fila nueva en la hoja **Consultas** del Google Sheet.
- La primera vez que se recibe un envío, el script crea la hoja con encabezados formateados automáticamente.

---

## Secciones del formulario

| # | Sección | Campos destacados |
|---|---------|-------------------|
| 1 | Identificación del productor | Nombre, teléfono, email, región |
| 2 | Pabellón / galpón | Dimensiones (largo × ancho × altura), cubierta, muro, ventilación, iluminación |
| 3 | Sistema de alojamiento | **Jaulas:** dimensiones + calculadora cm²/ave con semáforo de bienestar · **Piso:** m² + calculadora aves/m² · **Semilibertad** |
| 4 | Equipamiento | Comederos, bebederos, nidales, fuente de agua, tratamiento |
| 5 | Lote y parámetros productivos | Línea genética, semana de edad, % postura, peso corporal, consumo alimento/agua — para comparar con [curvas genéticas](https://avivet.cl/avivet/curvas-geneticas/) |
| 6 | Nutrición | Tipo de alimento, marca, proteína, EM, calcio |
| 7 | Sanidad | Vacunación, ectoparásitos, desinfección, registro productivo |
| 8 | Motivo de consulta | Problema principal, descripción, tratamientos previos |
| 9 | Fotos solicitadas | Checklist de 16 puntos fotográficos (pabellón, jaulas, aves, huevos, fecas, etc.) |
| 10 | Observaciones adicionales | Campo libre |

---

## Calculadora de densidad integrada

### Jaulas en batería
> Ingresa: largo × profundidad de la jaula (cm) + N° aves → calcula **cm²/ave** con evaluación automática:
> - ✅ Óptimo: ≥ 550 cm²/ave
> - ✅ Adecuado: ≥ 550 cm²/ave
> - ⚠️ Mínimo bienestar: 450–549 cm²/ave
> - ❌ Bajo: < 450 cm²/ave

### Sistema de piso
> Ingresa: largo × ancho (m) + % área efectiva + N° aves → calcula **aves/m²** y **m²/ave**

---

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Formulario web completo (HTML + CSS + JS, sin dependencias externas) |
| `apps-script.gs` | Código del Google Apps Script que recibe los datos y los escribe en el Sheet |

---

## Configuración del backend (Apps Script)

El script ya está desplegado. Si necesitas volver a desplegarlo o migrar a otro sheet:

1. Abre [script.google.com](https://script.google.com) → pega el contenido de `apps-script.gs`.
2. Reemplaza `SHEET_ID` con el ID de tu Google Sheet  
   *(está en la URL: `docs.google.com/spreadsheets/d/**ID**/edit`)*.
3. **Implementar → Nueva implementación:**
   - Tipo: *Aplicación web*
   - Ejecutar como: *Yo*
   - Acceso: *Cualquier persona*
4. Copia la URL generada y pégala en `index.html`:
   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
   ```
5. Commit + push para publicar el cambio.

### Base de datos actual
- **Google Sheet:** [AviVet Telemedicina](https://docs.google.com/spreadsheets/d/1NpAJJkV1k6U-q1ZOCGFFoK8oyBAIWGH6535Wc-bA8Yw/edit)
- **Apps Script URL:** `https://script.google.com/macros/s/AKfycbysLTpZKj4y47xd9qXM_WsZYJegyDN27UDajZr0JVpAg7J67YGqMt_ixVr3GJCWJcyljw/exec`

---

## Uso con pacientes

Puedes compartir el link directamente por WhatsApp antes de la consulta:

```
Hola! Para preparar mejor nuestra sesión de telemedicina,
te pido que completes esta planilla con los datos de tu plantel:
https://avivet.cl/telemedicina
```

---

*MV Andrés Lazo E. · [avivet.cl](https://avivet.cl)*
