# ✅ Auditoría SAG Bioseguridad

**https://alazoe.github.io/avivet/auditoria-sag/** · también disponible en `https://avivet.cl/avivet/auditoria-sag/`

Autoevaluación de cumplimiento de bioseguridad para **planteles industriales de Engorda y Ponedoras**, basada en el manual oficial del SAG:

> *Sistema Oficial de Bioseguridad en Establecimientos Pecuarios — Manual bioseguridad en planteles de aves*
> Documento **D-VYC-VIS-PP-004, versión 02**, vigente desde el 13-11-2024, dictado en el marco de la **Resolución Exenta N°2114/2023** ("Crea el Sistema Oficial de Bioseguridad en Establecimientos Pecuarios").

No cubre Reproductoras/Abuelas ni Incubadoras (ver [[project_avivet_registro_visitas]] para el registro de visitas SAG, que sí es de alcance general).

## ¿Qué hace?

1. El productor completa datos del predio y elige su rubro: **Engorda**, **Ponedora A** (≥20.000 aves) o **Ponedora B** (<20.000 aves).
2. Responde cada ítem del checklist con **Cumple / No Cumple / N/A**. El checklist se filtra automáticamente: solo se muestran los ítems que aplican a su rubro (por ejemplo, "Manejo de Huevos" no aparece para Engorda).
3. Ve su **resultado en la misma página**: % de cumplimiento por sección y total, con semáforo (verde ≥80%, amarillo ≥60%, rojo <60%) y gráficos de dona.
4. Puede **descargar el resultado en PDF** (impresión del navegador).
5. Al guardar, la auditoría queda registrada en Supabase y **te llega un correo automático** con el resumen y el detalle de los ítems no conformes.
6. Al final se le ofrece un CTA directo por WhatsApp o correo para pedir asesoría — con el % de cumplimiento ya incluido en el mensaje.

Funciona sin internet: guarda en `localStorage` y sincroniza con Supabase apenas hay conexión.

## Checklist: origen y alcance

Los ítems provienen directamente de la sección 10 del manual (**10.1 Medidas inmediatas/críticas**, **10.2 con plazo de 6 meses**, **10.3 con plazo de 1 año**), que es la propia pauta de implementación del SAG. A la fecha de esta herramienta todos los plazos —incluidos los 6/12 meses adicionales que el manual da a Ponedora B— ya vencieron, así que el % de cumplimiento se calcula sobre **todos los ítems aplicables al rubro elegido**, sin distinción de plazo.

Los ítems marcados con `*` en la app corresponden a los que el manual clasifica como **inmediatos/críticos** (§10.1).

Se excluyeron del checklist los ítems exclusivos de Reproductoras/Abuelas e Incubadoras (aves de un día, ducha obligatoria, desinfección de huevos fértiles, bandejas de incubación), ya que esta herramienta es solo para Engorda y Ponedoras.

## Backend (Supabase)

Mismo proyecto Supabase que usan `registro-productivo-avicola` y `ventas` (`xewujmpycclqjhlmiica`), en una tabla propia:

- **`supabase-schema.sql`** — crea la tabla `auditorias_bioseguridad` (solo-inserción/actualización pública vía RLS, sin lectura pública). Ejecutar una vez en el SQL Editor de Supabase.
- **`alerta-bioseguridad.ts`** — Edge Function que envía el correo de aviso al asesor (y opcionalmente copia al productor, si marcó la casilla). Desplegar en Supabase Dashboard → Edge Functions → *New Function* → nombre `alerta-bioseguridad`, pegar el contenido del archivo, y configurar los secrets `RESEND_API_KEY`, `ALERTA_EMAIL`, `ALERTA_FROM` (se pueden reutilizar los mismos de `alerta-produccion` si ya están configurados).

Los resultados se revisan desde el **Table Editor de Supabase** (`auditorias_bioseguridad`) — no hay política de lectura pública, así que un productor no puede ver los resultados de otro.

## Historial

Antes de esta versión, la herramienta cubría los 5 rubros del manual (incluyendo Reproductora/Abuela e Incubadora), no filtraba los ítems según el rubro elegido (solo los anotaba en el texto), citaba una resolución incorrecta (Res. 7695/2024 en vez de la Res. Ex. N°2114/2023) y guardaba en Google Sheets vía Apps Script sin aviso automático al asesor.
