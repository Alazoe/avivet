# Manual de Usuario — Pesaje Pollitas
**AviVet · avivet.cl**

---

## ¿Qué es esta aplicación?

**Pesaje Pollitas** es una herramienta para registrar y analizar el peso corporal de pollitas de reemplazo semana a semana. Compara los datos reales con la curva genética de referencia (Hy-Line, Dekalb, ISA) y calcula automáticamente uniformidad, CV% y desviación respecto a la curva.

---

## 1. Acceso

Ingresa en [avivet.cl](https://avivet.cl) con tu correo y contraseña.  
Si no tienes cuenta, contacta al administrador del sistema.

---

## 2. Gestión de Lotes (pestaña 🐔 Lotes)

### Crear un lote
1. Ve a la pestaña **Lotes**
2. Completa: nombre del lote, fecha de nacimiento (BB), número de aves y línea genética
3. Toca **+ Crear lote**

> **Importante:** La fecha de nacimiento es clave — la app calcula automáticamente la semana de vida actual del lote.

### Archivar o eliminar un lote
- **Archivar:** El lote desaparece de los selectores pero conserva todos sus datos. Úsalo cuando el lote ya terminó su crianza.
- **Eliminar:** Borra el lote **y todos sus pesajes permanentemente**. Se pide confirmación escribiendo el nombre exacto.

---

## 3. Registro de Pesajes (pestaña 📋 Registro)

### Paso a paso
1. Selecciona el **lote**
2. Selecciona la **semana de vida** (se sugiere automáticamente según fecha de nacimiento)
3. Verifica o ajusta la **fecha del pesaje**
4. Elige el **método de ingreso** y carga los pesos
5. Toca **💾 Guardar pesaje**

### Métodos de ingreso

#### ⌨️ Manual
- Escribe el peso en kg (ej: `1.250`) o en gramos (ej: `1250`) y toca **+**
- También puedes presionar **Enter**
- Los pesos en gramos (>10) se convierten automáticamente a kg
- Toca cualquier chip de peso para **eliminarlo**

#### 🎤 Voz
- Toca el ícono 🎤 para activar el micrófono
- Di el peso en voz alta: *"uno con doscientos cincuenta"*, *"mil trescientos gramos"*, *"uno punto tres kilos"*
- Toca nuevamente 🎤 para detener la escucha
- Disponible en Chrome y Safari

#### 📷 Foto / PDF
- Toma una foto de la pantalla de la balanza o sube un PDF con los datos
- Toca **🔍 Extraer pesos con IA** para que el sistema identifique los valores automáticamente
- Revisa los pesos extraídos antes de guardar

#### 📊 Excel / CSV
- Selecciona un archivo `.xlsx`, `.xls` o `.csv` con los pesos registrados en planilla
- La app detecta automáticamente si los valores están en kg (0.05–4) o gramos (50–4000)
- Muestra una vista previa con el número de pesos encontrados antes de importar
- Toca **📥 Importar X pesos** para agregarlos al registro actual

### Indicadores en tiempo real
Mientras ingresas pesos (mínimo 3 aves) se muestran:
- **Promedio** en kg
- **Uniformidad** — % de aves dentro del ±10% del promedio
- **CV%** — coeficiente de variación
- **Fuera de rango** — aves fuera del ±10%
- Comparación automática con la curva genética del lote

### Planilla en blanco para pesar a mano 🖨️
Si prefieres registrar en papel antes de ingresar a la app:
1. Selecciona lote y semana
2. Toca **🖨️ Planilla en blanco para pesar a mano**
3. Ingresa el peso promedio esperado (la app lo sugiere desde la curva genética)
4. Se genera una tabla Gaussiana con filas cada 10 g, centrada en ese promedio, con ±2 desviaciones estándar
5. Imprime o guarda como PDF
6. En terreno: pesa cada ave y marca una raya en la fila correspondiente
7. Luego transcribe a la app usando el modo manual o Excel

---

## 4. Historial y Análisis (pestaña 📊 Historial)

### Ver el historial de un lote
1. Ve a la pestaña **Historial**
2. Selecciona un lote en el selector
3. Aparece la tabla con todos los pesajes registrados y los dos gráficos

### Tabla de historial
| Columna | Descripción |
|---------|-------------|
| Sem | Semana de vida |
| Prom kg | Peso promedio medido |
| Curva | Peso esperado por la curva genética |
| Dif | Diferencia porcentual respecto a la curva |
| Unif | Uniformidad del lote |
| CV% | Coeficiente de variación |
| N | Número de aves pesadas |
| 📊 | Ver histograma de distribución |
| ✏️ | Editar o eliminar ese pesaje |

### Gráfico: Peso promedio vs curva genética
- **Línea verde** — peso promedio medido por semana
- **Banda verde clara** — rango min-max esperado de la curva
- **Línea rosa punteada** — promedio esperado de la curva
- **Punto verde** — el peso está dentro del rango
- **Punto rojo** — el peso está fuera del rango

### Gráfico: Uniformidad vs curva esperada
- **Línea verde** — uniformidad real del lote
- **Línea gris punteada** — uniformidad mínima esperada por la curva
- **Punto rojo** — la uniformidad está por debajo de lo esperado

### Histograma de distribución (tocar fila 📊)
- **Barras verdes** — aves dentro del ±10% del promedio (zona de uniformidad)
- **Barras amarillas** — aves en el ±20% (leve dispersión)
- **Barras rojas** — aves fuera del ±20% (alta dispersión)
- **Curva azul** — distribución normal ajustada a los datos reales
- **Líneas grises punteadas** — marcadores ±1 desviación estándar
- **Línea verde sólida** — promedio medido (x̄)
- **Línea rosa punteada** — promedio esperado por la curva (★)
- **Caja CV** — coeficiente de variación con semáforo de calidad
- **Bracket inferior** — uniformidad real (aves dentro ±10%)

---

## 5. Editar o Eliminar un Pesaje ✏️

Si cometiste un error al guardar (semana incorrecta, pesos equivocados, fecha mal ingresada):

1. Ve a la pestaña **Historial** y selecciona el lote
2. Busca la fila correspondiente en la tabla
3. Toca el botón **✏️** de esa fila
4. En el formulario que se abre puedes:
   - **Cambiar la semana** — por ejemplo, si guardaste como semana 8 y era semana 9
   - **Cambiar la fecha** del pesaje
   - **Corregir los pesos individuales** — edita la lista (un peso por línea, en kg)
5. Toca **💾 Guardar cambios** — las estadísticas se recalculan automáticamente
6. Para eliminar ese pesaje completamente, toca **🗑️ Eliminar** (pide confirmación)

> Cerrar el modal sin guardar (toca la × o el fondo oscuro) descarta todos los cambios.

---

## 6. Exportar PDF

### PDF de un pesaje semanal
1. En el historial, toca la fila para abrir el histograma
2. Toca **📄 PDF semana** (aparece en la tarjeta del histograma)
3. Se abre una nueva pestaña con el informe listo para imprimir:
   - Datos del lote y semana
   - Estadísticas principales (promedio, uniformidad, CV%, N aves)
   - Comparación con curva genética
   - Histograma de distribución

### PDF del historial acumulado
1. En el historial, toca **📄 PDF acumulado** (tarjeta del gráfico de peso)
2. Incluye:
   - Tabla completa de todas las semanas
   - Gráfico de peso promedio vs curva genética
   - Gráfico de uniformidad

> Si el navegador bloquea la ventana emergente, busca la notificación en la barra de direcciones y permite las ventanas emergentes para avivet.cl.

---

## 7. Interpretación de Indicadores

### Uniformidad
- Porcentaje de aves cuyo peso está **dentro del ±10% del promedio** del lote
- **≥ 85%** — buena uniformidad ✅
- **75–84%** — uniformidad aceptable ⚠️
- **< 75%** — uniformidad deficiente, revisar manejo ❌

La uniformidad baja puede deberse a problemas de espacio, comederos, agua, jerarquía de parvada o enfermedades.

### CV% (Coeficiente de Variación)
Mide la dispersión relativa de los pesos respecto al promedio:
- **≤ 10%** — lote uniforme ✅
- **10–15%** — dispersión moderada ⚠️
- **> 15%** — alta dispersión, investigar causas ❌

### Comparación con curva genética
- **Dif = 0%** — el peso promedio coincide exactamente con el estándar
- **Dif positiva (+)** — el lote está sobre la curva (puede ser sobrealimentación o muy buena ganancia)
- **Dif negativa (−)** — el lote está bajo la curva (revisar dieta, salud, densidad)
- Diferencias menores al **±5%** generalmente son aceptables

### Curvas genéticas disponibles (semanas 1–100)
| Línea | Curva de referencia | Fuente |
|-------|---------------------|--------|
| Hy-Line Brown / Hy-Line Brown Jaula | Hy-Line Brown 2024 | Guía de manejo Hy-Line |
| Hy-Line W-80 | Hy-Line W-80 2024 | Guía de manejo Hy-Line |
| Lohmann Brown / Lohmann White | Lohmann Brown-Lite 2021 | Guía Sist. Alternativos |
| Nick Brown | Nick Brown (H&N) | Guía de manejo H&N |
| Dekalb Brown | Dekalb Brown Product Guide | Hendrix Genetics |
| ISA Brown | Dekalb Brown (proxy) | Hendrix Genetics (misma empresa) |

---

## 8. Preguntas Frecuentes

**¿Puedo usar la app desde el celular?**  
Sí. La interfaz está diseñada para móvil. Se recomienda Chrome en Android o Safari en iPhone.

**¿Los datos se guardan en la nube?**  
Sí. Todo se almacena en Supabase (base de datos en la nube). Los datos están disponibles desde cualquier dispositivo con tu cuenta.

**¿Puedo ingresar más de un pesaje por semana?**  
La app no impide ingresar dos registros para la misma semana. Si lo haces por error, usa el botón ✏️ en el historial para eliminar el duplicado.

**¿Puedo cambiar la línea genética de un lote después de crearlo?**  
No directamente desde la app. Se puede hacer desde Supabase o contactar al administrador. La línea genética define qué curva de referencia se usa en todos los cálculos.

**¿Cuántas aves debo pesar para que el resultado sea confiable?**  
Se recomienda pesar entre 30 y 100 aves por galpón, elegidas al azar de distintos sectores. Con menos de 10 aves los estadísticos (CV, uniformidad) son poco representativos.

**¿Por qué el histograma no aparece en algunas filas?**  
El histograma requiere que los pesos individuales estén guardados (`pesos_raw`). Los registros ingresados con versiones antiguas de la app pueden no tenerlos.

**¿Qué formatos acepta el modo Excel?**  
`.xlsx`, `.xls` y `.csv`. La primera hoja del archivo debe contener los pesos en una columna, en kg (ej: `1.250`) o en gramos (ej: `1250`). La app detecta la unidad automáticamente.

**¿El modo de voz funciona sin internet?**  
No. La API de reconocimiento de voz requiere conexión a internet en la mayoría de los navegadores.

---

## 9. Soporte

Para reportar problemas o solicitar funciones nuevas, escribe a: **alazoemv@gmail.com**

---

*AviVet · Herramienta de seguimiento productivo avícola · avivet.cl*  
*Versión: julio 2026*
