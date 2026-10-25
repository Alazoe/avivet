# ✅ Auditoría SAG Bioseguridad

**https://alazoe.github.io/avivet/auditoria-sag/** · también disponible en `https://avivet.cl/avivet/auditoria-sag/`

Autoevaluación de cumplimiento de bioseguridad para **planteles industriales de Engorda y Ponedoras** y para **traspatio / agricultura familiar campesina (AFC)**, basada en los manuales oficiales del SAG:

> *Sistema Oficial de Bioseguridad en Establecimientos Pecuarios — Manual bioseguridad en planteles de aves*
> Documento **D-VYC-VIS-PP-004, versión 02**, vigente desde el 13-11-2024, dictado en el marco de la **Resolución Exenta N°2114/2023** ("Crea el Sistema Oficial de Bioseguridad en Establecimientos Pecuarios").

> Normativa: la **Res. Ex. N°2114/2023** crea el Sistema Oficial de Bioseguridad; la **Res. Ex. N°7695/2024** aprueba los manuales v02 y sus pautas de verificación (planteles y traspatio) y deroga la Res. 4534/2023.

No cubre Reproductoras/Abuelas ni Incubadoras (ver [[project_avivet_registro_visitas]] para el registro de visitas SAG, que sí es de alcance general).

## ¿Qué hace?

1. El productor completa datos del predio y elige su rubro: **Engorda**, **Ponedora A** (≥20.000 aves), **Ponedora B** (<20.000 aves) o **Traspatio / AFC**.
2. Responde cada ítem del checklist con **Cumple / No Cumple / N/A**. El checklist se filtra automáticamente: solo se muestran los ítems que aplican a su rubro (por ejemplo, "Manejo de Huevos" no aparece para Engorda).
3. Ve su **resultado en la misma página**: % de cumplimiento por sección y total, con semáforo (verde ≥80%, amarillo ≥60%, rojo <60%) y gráficos de dona.
4. Puede **descargar el resultado en PDF** (impresión del navegador).
5. Al guardar, la auditoría queda registrada en Supabase y **te llega un correo automático** con el resumen y el detalle de los ítems no conformes.
6. Al final se le ofrece un CTA directo por WhatsApp o correo para pedir asesoría — con el % de cumplimiento ya incluido en el mensaje.

Funciona sin internet: guarda en `localStorage` y sincroniza con Supabase apenas hay conexión.

## Traspatio / AFC

Al elegir ese rubro la app cambia de pauta: usa la **pauta de verificación oficial F-VYC-VIS-PP-005 v02** (Res. 7695/2024, 23 ítems C/NC en 3 secciones: responsabilidades del titular, medidas para el predio y el gallinero, manejo de las aves). Solo el ítem 1.4 (*el gallinero evita el ingreso de animales ajenos*) lleva `*`: es lo que el manual declara fiscalizable desde el 2.° semestre de 2025.

Aplica a domicilios o predios con aves para **autoconsumo o venta ocasional, sin iniciación de actividades ni resolución sanitaria**. Quien vende con iniciación de actividades o resolución sanitaria se evalúa como plantel (Ponedora B): así quedó definido al derogarse la versión 2023 del manual, que mezclaba a ambos.

La sección **D) Buenas prácticas recomendadas** no puntúa: reúne medidas del manual v02 que la pauta no verifica (lavado de manos, sin contacto con ajenos, no consumir aves muertas) y otras de la versión 2023 que dejaron de estar en la pauta (dos baldes en la entrada, desinfección de calzado de visitas, vehículo y ropa tras contacto con aves enfermas, encierro ante alerta, aviso al SAG). Aparece aparte en el resumen como «por reforzar».

Los ids de ítems de traspatio llevan prefijo `t` (`t0…`) y los de plantel conservan `i` (`i0…`), de modo que las auditorías ya guardadas no cambian.

## Observaciones y fotos (opcional)

En **Datos del predio** hay una casilla *Registrar observaciones y fotos de respaldo*, apagada por defecto. Al activarla cada ítem muestra un campo de observación y un botón de foto (hasta 3 por ítem y 30 por auditoría). El resumen/PDF agrega una sección *Observaciones y fotos*, y el correo de alerta incluye la observación junto a cada ítem no cumplido.

**Dónde se guarda**

| Qué | Dónde |
| --- | --- |
| Respuestas, puntajes, observaciones | Tabla `auditorias_bioseguridad` de Supabase (columnas `observaciones`, `fotos`, `con_evidencias`, jsonb) |
| Fotos | Bucket **privado** `auditoria-evidencias`, `<id de la auditoría>/<ítem>-<código>.jpg`; la fila guarda solo las rutas |
| Mientras no hay conexión | Fotos en el dispositivo (IndexedDB) y texto en `localStorage`; se suben al guardar |

Cada foto se reduce en el dispositivo a 1280 px de lado mayor, JPEG calidad 0,72 (≈ 150–300 KB). Con el plan gratuito de Supabase (1 GB) caben unas 3.000 a 6.000 fotos. Igual que la tabla, el bucket permite **subir pero no leer ni listar** con la llave pública: las fotos se ven desde Supabase › Storage. Al borrar una foto en la app se quita de la auditoría, pero el archivo ya subido queda en el bucket (no hay política de borrado público).

Las columnas de evidencias solo se envían si el modo está activo, así que la app sigue funcionando para Engorda y Ponedoras aunque la migración aún no se haya ejecutado.

## Checklist: origen y alcance

Los ítems provienen directamente de la sección 10 del manual (**10.1 Medidas inmediatas/críticas**, **10.2 con plazo de 6 meses**, **10.3 con plazo de 1 año**), que es la propia pauta de implementación del SAG. A la fecha de esta herramienta todos los plazos —incluidos los 6/12 meses adicionales que el manual da a Ponedora B— ya vencieron, así que el % de cumplimiento se calcula sobre **todos los ítems aplicables al rubro elegido**, sin distinción de plazo.

Los ítems marcados con `*` en la app corresponden a los que el manual clasifica como **inmediatos/críticos** (§10.1).

Se excluyeron del checklist los ítems exclusivos de Reproductoras/Abuelas e Incubadoras (aves de un día, ducha obligatoria, desinfección de huevos fértiles, bandejas de incubación), ya que esta herramienta es solo para Engorda y Ponedoras.

## Backend (Supabase)

Mismo proyecto Supabase que usan `registro-productivo-avicola` y `ventas` (`xewujmpycclqjhlmiica`), en una tabla propia:

- **`supabase-schema.sql`** — crea la tabla `auditorias_bioseguridad` (solo-inserción/actualización pública vía RLS, sin lectura pública). Ejecutar una vez en el SQL Editor de Supabase.
- **`supabase-migracion-traspatio-evidencias.sql`** — agrega el rubro `traspatio`, las columnas de evidencias y el bucket privado con su política de solo inserción. Ejecutar una vez en el SQL Editor, después de `supabase-schema.sql` (es idempotente). Hasta que se ejecute, las auditorías de traspatio o con evidencias quedan pendientes en el dispositivo.
- **`alerta-bioseguridad.ts`** — Edge Function que envía el correo de aviso al asesor (y opcionalmente copia al productor, si marcó la casilla). Desplegar en Supabase Dashboard → Edge Functions → *New Function* → nombre `alerta-bioseguridad`, pegar el contenido del archivo, y configurar los secrets `RESEND_API_KEY`, `ALERTA_EMAIL`, `ALERTA_FROM` (se pueden reutilizar los mismos de `alerta-produccion` si ya están configurados).

Los resultados se revisan desde el **Table Editor de Supabase** (`auditorias_bioseguridad`) — no hay política de lectura pública, así que un productor no puede ver los resultados de otro.

## Historial

Antes de esta versión, la herramienta cubría los 5 rubros del manual (incluyendo Reproductora/Abuela e Incubadora), no filtraba los ítems según el rubro elegido (solo los anotaba en el texto), citaba solo la Res. 7695/2024 (que aprueba los manuales y sus pautas) y no la Res. Ex. N°2114/2023 (que crea el sistema oficial) y guardaba en Google Sheets vía Apps Script sin aviso automático al asesor.

## Evaluación de riesgo AviVet (aparte de la pauta SAG)

La pauta SAG no se toca: sigue siendo cumple / no cumple / no aplica, con su % y su semáforo.
Debajo, el resumen muestra una **segunda lectura de las mismas respuestas**, ponderada por riesgo:

- Cada ítem tiene un peso (1 · 0,8 · 0,6 · 0,4 · 0,2) y una categoría, externa o interna, definidos en [pesos-riesgo.xlsx](pesos-riesgo.xlsx) (columna «TU PESO» manda sobre «Peso propuesto»).
- Índice = 100 · Σ(peso · cumple) / Σ(peso de los ítems aplicables); los N/A no cuentan. Se entrega total, externo, interno y un **radar por categoría**.
- **Barrera crítica:** un ítem de peso 1 sin cumplir impide el nivel «riesgo bajo» y se lista por nombre.
- Los 68 pesos de plantel parten de los del informe SEPA (marzo 2025, escala 1–5 ÷ 5; con ellos el caso SEPA da 77,8 %); la columna «Borrador inicial» guarda los pesos anteriores y «Origen del peso» indica la fuente. Traspatio sigue con pesos borrador.
- Para actualizar pesos: editar el Excel y correr `python3 generar-pesos.py` (agrega `--revisado` cuando estén aprobados; mientras tanto la app avisa «pesos en revisión»).
