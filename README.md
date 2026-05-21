# 🐔 AviVet — Herramientas Digitales para Avicultura del Sur de Chile

**Médico Veterinario Andrés Lazo Escobar** · [avivet.cl](https://avivet.cl) · Los Ríos / La Araucanía / Los Lagos

---

## 🔗 Acceso rápido

| Herramienta | Link | Descripción |
|-------------|------|-------------|
| **Calculadoras de Dosis** | [🔗 Abrir herramienta](https://alazoe.github.io/avivet/calculadoras-dosis/) | Cálculo de dosis de antibióticos en agua de bebida |
| **Auditoría SAG Bioseguridad** | [🔗 Abrir herramienta](https://alazoe.github.io/avivet/auditoria-sag/) | Pauta de verificación Res. 7695/2024 |
| **Inventario de Huevos** | [🔗 Abrir herramienta](https://alazoe.github.io/avivet/inventario-huevos/) | Control de stock y ventas |
| **Gestión de Rutas — La Campestre** | [🔗 Abrir herramienta](https://alazoe.github.io/avivet/campestre-rutas/) | Planificación y optimización de rutas de retiro de huevos |

---

## 📋 Auditoría SAG Bioseguridad

### ➡️ [https://alazoe.github.io/avivet/auditoria-sag/](https://alazoe.github.io/avivet/auditoria-sag/)

Herramienta digital basada en la **Resolución Exenta N° 7695/2024** del SAG, que actualiza los manuales de bioseguridad para el rubro avícola.

### ¿Qué incluye?

- ✅ Pauta completa de verificación para **planteles de aves** (Res. 7695/2024)
- ✅ Secciones A, B y C: Infraestructura, Pabellones y Procedimientos Operacionales
- ✅ Clasificación por rubro: Reproductora, Incubadora, Engorda, Ponedora A y B
- ✅ Ítems críticos marcados con `*` según la normativa
- ✅ Gráficos de cumplimiento por sección (dona)
- ✅ Exportación a PDF
- ✅ Funciona **sin internet** — sincroniza automáticamente al recuperar conexión
- ✅ Registro centralizado en Google Sheets por establecimiento

### ¿Para quién es?

Productores avícolas del sur de Chile que necesitan autoevaluar su nivel de cumplimiento de la normativa SAG vigente, y veterinarios que asesoran predios avícolas.

### Rubros cubiertos

| Rubro | Descripción |
|-------|-------------|
| Abuela / Reproductora | Planteles de reproducción |
| Incubadora | Plantas de incubación y nacedoras |
| Engorda | Broiler, pavos |
| Ponedora A | ≥ 20.000 aves en el RUP |
| Ponedora B | < 20.000 aves en el RUP |

---

## 🗺️ Gestión de Rutas — La Campestre

### ➡️ [https://alazoe.github.io/avivet/campestre-rutas/](https://alazoe.github.io/avivet/campestre-rutas/)

Herramienta para planificar y optimizar rutas de retiro de huevos frescos y despacho de alimento, con 53 productores geolocalizados.

### ¿Qué incluye?

- ✅ Mapa interactivo con todos los productores (ALTA / MEDIA / BAJA prioridad)
- ✅ Ruta de retiro ALTA con Chevrolet Partner — elige el día libremente
- ✅ Sugerencias automáticas de productores cercanos para aprovechar el viaje
- ✅ Tiempo estimado de viaje por ruta y por productor adicional
- ✅ Plan semanal por día con tabla editable (cajas, alimento, vehículo)
- ✅ Optimización de rutas semanales para 3 vehículos (10T, 6T, Partner)
- ✅ Datos en Google Sheets — sin servidor, acceso desde cualquier dispositivo

### Flota

| Vehículo | Capacidad |
|---|---|
| Camión Grande | 10 toneladas |
| Camión Mediano | 6 toneladas |
| Chevrolet Partner | ~1 tonelada |

---

## 💊 Calculadoras de Dosis

Scripts Python para calcular dosis de antibióticos vía oral en agua de bebida para aves.

```bash
cd avivet-repo/calculadoras-dosis
python3 oxitetraciclina.py
```

| Herramienta | Tipo | Antibiótico | Especies | Dosis |
|-------------|------|------------|---------|-------|
| `oxitetraciclina.html` | Web | Oxitetraciclina · Zanil® HCL 80% / TERRIVET® 65,5% | Pollos / Pavos | 16,8–90,1 mg/kg PV/día · 5–14 días |
| `florfenicol.html` | Web | Florfenicol · Veterin® 10% | Pollos / Pavos / Cerdos | 0,1–0,3 mL/kg PV/día · 5–7 días |
| `primavet.html` | Web | Amoxicilina · Primavet® 50% | Pollos broiler / Cerdos | 40 mg/kg PV/día · 5–7 días |
| `azovetril.html` | Web | Trimetoprim+Sulfadimidina · Azovetril® | Pollos broiler / Pavos | 0,125–0,25 mL/kg PV/día · 5 días |
| `levantel.html` | Web | Levamisol · LEVANTEL® 46% | Pollos broiler | 30–40 mg base/kg PV · Dosis única |
| `quiflumil.html` | Web | Enrofloxacino · QUIFLUMIL® 10% | Pollos broiler / Pavos / Ponedoras crianza | 0,1 mL/kg PV/día · 5–10 días |
| `enrofloxacino.html` | Web | Enrofloxacino · Enromic® 20% | Pollos broiler / Pollas reemplazo | 0,05 mL/kg PV/día · 3–5 días |
| `coliprim.html` | Web | Sulfacloropiridazina + Trimetoprima · COLIPRIM® | Pollos broiler / Pollas reemplazo / Conejos | 1–1,5 mL/L agua · ~30 mg/kg PV · 5 días |
| `oxitetraciclina.py` | Python CLI | Oxitetraciclina · Zanil® HCL 80% | Pollos / Pavos | 27–80 mg/kg PV/día · 7–14 días |

---

## 📞 Contacto y Asesoría

**MV Andrés Lazo Escobar**
Especialista en medicina aviar · Sur de Chile

- 📱 WhatsApp: [+56 9 5895 6340](https://wa.me/56958956340)
- 📧 Email: [andreslazomv@outlook.com](mailto:andreslazomv@outlook.com)
- 🌐 Web: [avivet.cl](https://avivet.cl)

---

## 🛠️ Stack técnico

- HTML / CSS / JavaScript vanilla — sin dependencias
- Google Apps Script + Google Sheets (backend de registros)
- GitHub Pages (hosting)

---

*Última actualización: 2026*
