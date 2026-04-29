# Pesaje Pollitas

App móvil para registro de pesos individuales y control de uniformidad de lotes de pollitas. Ingreso por tipeo, foto (OCR con Claude Vision) y voz. Backend en Supabase con autenticación y datos aislados por productor.

**URL:** http://avivet.cl/avivet/pesaje-pollitas/  
**Autor:** Andrés Lazo Escobar, Médico Veterinario · avivet.cl

---

## Funcionalidades

- **Ingreso manual** — teclea cada peso en kg o gramos (se convierte automático)
- **Ingreso por foto / PDF** — fotografía el papel o sube un PDF → Claude Vision extrae los pesos automáticamente
- **Semáforo en tiempo real** — uniformidad y CV vs rangos aceptables de la curva Hy-Line Brown
- **Comparación con curva** — alerta si el promedio está sobre o bajo el estándar por semana
- **Historial** — tabla y gráfico de uniformidad semanal por lote, con histograma de distribución

## Arquitectura

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML + JS estático (GitHub Pages) |
| Base de datos | Supabase (PostgreSQL + Row Level Security) |
| Autenticación | Supabase Auth (email/contraseña por productor) |
| OCR | Edge Function Deno → Anthropic Claude Haiku |

## Estructura del repositorio

```
pesaje-pollitas/
├── index.html          App completa (HTML + CSS + JS)
├── ocr-pesaje.ts       Edge Function Deno para OCR con Claude Vision
├── supabase-schema.sql Tablas y políticas RLS
└── code.gs             Versión anterior (Google Apps Script) — referencia
```

## Configuración inicial (una vez)

### 1. Crear tablas en Supabase

En el SQL Editor del proyecto, ejecuta `supabase-schema.sql`. Crea las tablas `lotes` y `pesajes` con Row Level Security activado.

### 2. Desplegar Edge Function

En Supabase Dashboard → Edge Functions → New Function:
- Nombre: `ocr-pesaje-ts`
- Contenido: pega `ocr-pesaje.ts`

### 3. Agregar secret

En Project Settings → Edge Functions → Secrets:
- `ANTHROPIC_API_KEY` = tu clave de Anthropic (`sk-ant-...`)

### 4. Crear cuenta del productor

En Authentication → Users → Add user: ingresa email y contraseña del productor. Cada usuario solo ve sus propios lotes y pesajes.

## Datos calculados

- **Promedio kg** por sesión
- **CV%** (coeficiente de variación)
- **Uniformidad %** = aves dentro de ±10% del promedio / total
- **Comparación vs curva Hy-Line Brown** semana a semana
