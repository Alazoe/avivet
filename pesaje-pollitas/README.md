# Pesaje Pollitas — App GAS

App móvil para registro de pesos individuales y control de uniformidad de lotes, con ingreso por tipeo, voz y foto (OCR con Claude Vision).

**Autor:** Andrés Lazo Escobar, Médico Veterinario · avivet.cl

---

## Cómo desplegar (una vez por productor)

### 1. Crear el Google Sheet

1. Crea un Google Sheet nuevo para el productor
2. Copia el ID de la URL: `https://docs.google.com/spreadsheets/d/**ID_AQUÍ**/edit`

### 2. Configurar Apps Script

1. En el Sheet: **Extensiones → Apps Script**
2. Pega el contenido de `code.gs` en el editor (`Código.gs`)
3. Crea un archivo nuevo `index.html` y pega el contenido de `index.html`
4. Guarda (Cmd+S)

### 3. Configurar constantes en code.gs

```javascript
const SHEET_ID = 'TU_SHEET_ID';          // ID del Google Sheet
const ANTHROPIC_API_KEY = 'sk-ant-...';  // API key de Anthropic (para OCR foto)
```

### 4. Inicializar el Sheet

1. En Apps Script, ejecuta la función `inicializarSheet()` una vez
2. Esto crea las hojas CONFIGURACIÓN y PESAJES

### 5. Agregar lotes del productor

En la hoja **CONFIGURACIÓN**, completa los datos:

| id_lote | nombre_lote | fecha_nacimiento | n_aves_total | activo |
|---------|-------------|------------------|--------------|--------|
| L01     | Lote 01     | 2026-01-15       | 10000        | TRUE   |

### 6. Publicar como Web App

1. **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Ejecutar como: **Yo**
4. Quién tiene acceso: **Cualquier persona** (para que el productor pueda usarla sin login)
5. Copiar la URL y enviársela al productor

---

## Funcionalidades

- **Ingreso manual**: teclea cada peso uno por uno (en kg o gramos, se convierte automático)
- **Ingreso por voz**: dicta números en voz alta, la app los captura y convierte
- **Ingreso por foto**: fotografía el papel con los pesos escritos → Claude Vision los extrae automáticamente
- **Semáforo en tiempo real**: muestra si uniformidad y CV están dentro de rangos aceptables vs curva Hy-Line Brown
- **Comparación con curva**: alerta si el promedio está sobre o bajo la curva estándar
- **Historial**: tabla y gráfico de uniformidad semanal por lote

## Estructura del Sheet

| Hoja | Contenido |
|------|-----------|
| CONFIGURACIÓN | Lista de lotes activos (id, nombre, fecha nacimiento, N aves) |
| PESAJES | Un registro por sesión de pesaje (promedio, CV, uniformidad, pesos raw) |

## Datos calculados automáticamente

- **Promedio kg** por sesión
- **CV%** (coeficiente de variación)
- **Uniformidad %** = aves dentro de ±10% del promedio / total
- **Comparación vs curva Hy-Line Brown** semana a semana
