# Registro de Necropsias 🔒

Herramienta **privada y 100 % local** del MV para ir guardando las necropsias de
campo, con fotos y un atlas de imágenes de referencia para comparar.

- URL: https://avivet.cl/avivet/necropsias/ (`noindex`, no enlazada desde el sitio público)
- Stack: HTML/JS vanilla, IndexedDB, JSZip (cdnjs), PWA instalable con service worker

## Privacidad: los datos no salen del dispositivo

- Fichas, fotos y referencias se guardan en **IndexedDB del navegador** del
  celular o notebook. No hay servidor, login ni base de datos en la nube.
- La página es pública (código en GitHub), pero quien la abra —un productor, por
  ejemplo— ve una app vacía: solo aparece lo que se registró en *ese* dispositivo.
- Funciona sin señal: el service worker (`sw.js`) guarda la app en caché la
  primera vez que se abre con internet.
- Se pide `navigator.storage.persist()` para que el navegador no borre los datos.
  En iPhone conviene **instalarla en la pantalla de inicio** (Safari → Compartir →
  «Agregar a inicio»): Safari puede borrar datos de sitios que no se abren en
  varias semanas, pero no los de apps instaladas.

## Respaldo y traspaso celular ↔ notebook (Google Drive / OneDrive)

Pestaña **💾 Respaldo**:

- **Exportar** genera `necropsias-respaldo-AAAA-MM-DD.zip` (`necropsias.json`,
  `referencias.json`, `fotos/…`, `referencias/…`). En el celular «Compartir» abre
  el menú del sistema → Drive u OneDrive; en el notebook se descarga y se sube a
  la carpeta privada.
- **Importar** abre ese .zip en el otro dispositivo y **fusiona**: agrega lo nuevo
  y, si una necropsia existe en ambos lados, gana la de `updated_at` más reciente.
  No borra nada (una necropsia eliminada en un equipo sigue en el otro).
- El historial avisa cuando hay necropsias sin respaldar (≥3, o más de 7 días).

## Qué registra

1. **Caso**: fecha, productor, galpón/lote, tipo de ave, línea genética, edad,
   n° de aves, condición (muertas / sacrificadas).
2. **Historia clínica**: motivo, mortalidad, signos, vacunaciones/tratamientos.
3. **Hallazgos por sistema** (externo, respiratorio, digestivo, hígado,
   corazón y linfoides, reproductor, urinario, nervioso, locomotor): estado *sin
   alteraciones / alterado / no evaluado*, chips de lesiones por órgano, notas
   (con dictado por voz) y fotos por sistema (se reducen a 1600 px / JPEG).
4. **Hígado** (sección abierta por defecto):
   - Score de color (Royal GD, 7 colores): normal / grupo de riesgo (→ pedir TG) / FLHS (→ tratar).
   - Score de hemorragias 0 · 1 · 2 · ≥3 (Shini et al. 2019; Diaz, Squires y Julian 1999;
     ≥3 = hematomas / ruptura de cápsula, muy indicativo de FLHS).
   - Diferenciales del hígado amarillo (pollitos con saco vitelino, xantofilas,
     grasas rancias/micotoxinas, Marek, hepatitis) y criterio de confirmación
     (≥40 % grasa en MS / triglicéridos) — Merck Veterinary Manual.
   - La misma información está como **ficha de terreno** al inicio de la pestaña
     Referencias, sin necesidad de importar imágenes.
5. **Conclusión**: diagnóstico presuntivo, diferenciales, muestras enviadas,
   laboratorio, recomendaciones.

Vista de informe con impresión a PDF y botón «Copiar resumen» (para WhatsApp).
Mientras se edita queda un borrador en `localStorage` (`avivet_necropsia_borrador`).

## Guía paso a paso (pestaña 📖 Guía)

`guia.js` define `GUIA` (secciones en orden de trabajo, cada paso con foto y texto
traducido al español) y `GUIA_CONSEJOS` (muestras asépticas antes que sépticas,
autólisis, formalina). Secciones actuales: pechuga, cuello, hígado, molleja,
corazón, siringe, extracción del digestivo, bolsa de Fabricio, gónadas y
adrenales, riñones, serosa intestinal, proventrículo/molleja, mucosa digestiva y
raspado para coccidias, encéfalo, limpieza y eliminación de cadáveres.

- Cada sistema del formulario tiene un enlace «📖 Cómo examinarlo» a su sección.
- Los pasos marcados `normal`/`alterado` también se registran como referencias
  del sistema; los de técnica (`tecnica`) solo aparecen en la guía y con el
  filtro «Técnica» de Referencias.
- Para agregar láminas nuevas: recortar a `~/AviVet_Necropsias/referencias/guia-*.jpg`,
  agregar el paso en `GUIA` y regenerar `paquete-referencias.zip`. Al importar el
  zip de nuevo solo se suman las fotos que faltan.
- Falta cubrir: examen externo, eutanasia y apertura de la cavidad (no venían en
  las láminas recibidas).

## Referencias

- Pestaña **Referencias**: atlas por sistema (borde verde = normal, rojo = alterado).
  Las mismas miniaturas aparecen dentro de cada sistema del formulario.
- **Paquete inicial** (99 imágenes): las 74 fotos de la guía más 25 recortes de *Layer Signals Checkbook* (Roodbont, cap. 7
  Salud) + lámina de hígado graso de Royal GD. Por derechos de autor **no están en
  este repo**: viven en `~/AviVet_Necropsias/paquete-referencias.zip` (y las fotos
  sueltas en `~/AviVet_Necropsias/referencias/`). Se importan una vez por
  dispositivo desde Referencias → «Importar paquete inicial»; se clasifican por
  nombre de archivo según `REF_CATALOGO` en `app.js`. También viajan dentro de
  los respaldos.
- Se pueden agregar referencias propias, o marcar ⭐ cualquier foto de una
  necropsia como referencia desde el visor.
