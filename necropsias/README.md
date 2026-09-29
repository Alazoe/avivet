# Registro de Necropsias 🔒

Herramienta **privada** del MV para ir guardando las necropsias de campo, con
fotos y un atlas de imágenes de referencia para comparar.

- URL: https://avivet.cl/avivet/necropsias/ (`noindex`, no enlazada desde el sitio público)
- Stack: HTML/JS vanilla + Supabase (mismo proyecto `xewujmpycclqjhlmiica`)

## Privacidad

- Hay que iniciar sesión (cuenta Supabase del asesor).
- Tablas `necropsias` y `necropsia_referencias` con RLS `user_id = auth.uid()`:
  cada usuario ve solo lo suyo — los productores que tienen cuenta en el mismo
  proyecto (registro productivo) **no** ven nada.
- Fotos en el bucket **privado** `necropsias`, carpeta `{user_id}/…`; se muestran
  con URLs firmadas de 1 hora. Se comprimen a 1600 px / JPEG antes de subir.
- El código es público (repo GitHub), los datos no.

## Qué registra

1. **Caso**: fecha, productor, galpón/lote, tipo de ave, línea genética, edad,
   n° de aves, condición (muertas / sacrificadas).
2. **Historia clínica**: motivo, mortalidad, signos, vacunaciones/tratamientos.
3. **Hallazgos por sistema** (externo, respiratorio, digestivo, hígado,
   corazón y linfoides, reproductor, urinario, locomotor): estado *sin
   alteraciones / alterado / no evaluado*, chips de lesiones por órgano, notas
   (con dictado por voz) y fotos por sistema.
4. **Score de color hepático** (Royal GD, 7 colores): normal / grupo de riesgo
   (→ pedir TG) / FLHS (→ tratar).
5. **Conclusión**: diagnóstico presuntivo, diferenciales, muestras enviadas,
   laboratorio, recomendaciones.

Vista de informe con impresión a PDF y botón «Copiar resumen» (para WhatsApp).
Mientras se edita queda un borrador en `localStorage` (`avivet_necropsia_borrador`).

## Referencias

- Pestaña **Referencias**: atlas por sistema (borde verde = normal, rojo = alterado).
  Las mismas miniaturas aparecen dentro de cada sistema del formulario.
- **Paquete inicial**: 25 recortes de *Layer Signals Checkbook* (Roodbont, cap. 7
  Salud) + lámina de hígado graso de Royal GD. Por derechos de autor **no están en
  este repo**: viven en `~/AviVet_Necropsias/referencias/` y se suben una vez al
  bucket privado con «Importar paquete inicial» (se clasifican por nombre de
  archivo según `REF_CATALOGO` en `app.js`).
- Se pueden agregar referencias propias, o marcar ⭐ cualquier foto de una
  necropsia como referencia desde el visor.

## Instalación (una sola vez)

1. Supabase → SQL Editor → ejecutar [`supabase-schema.sql`](supabase-schema.sql)
   (crea tablas, políticas RLS y el bucket privado).
2. Ingresar a la herramienta → Referencias → «Importar paquete inicial» →
   seleccionar todos los `.jpg` de `~/AviVet_Necropsias/referencias/`.
