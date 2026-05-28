// ═══════════════════════════════════════════════════════════════════
//  AviVet – Apps Script para recibir datos de la planilla telemedicina
//  y guardarlos en Google Sheets.
//
//  INSTRUCCIONES DE CONFIGURACIÓN (solo la primera vez):
//
//  1. Ir a https://script.google.com  → "Nuevo proyecto"
//  2. Borrar el código de ejemplo y pegar TODO este archivo.
//  3. Reemplazar SHEET_ID con el ID de tu Google Sheet
//     (el ID está en la URL: docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit)
//  4. Clic en "Guardar" (ícono de disco o Ctrl+S).
//  5. Clic en "Implementar" → "Nueva implementación".
//  6. Tipo: "Aplicación web".
//     - Ejecutar como: Yo (tu cuenta Google)
//     - Quién tiene acceso: Cualquier persona
//  7. Clic "Implementar" → Autorizar → Copiar la URL de la Web App.
//  8. Pegar esa URL en el archivo index.html, línea:
//       const APPS_SCRIPT_URL = 'REEMPLAZAR_CON_TU_URL_DE_APPS_SCRIPT';
//  9. Hacer commit y push al repo para publicar el cambio.
//
//  Cada vez que recibas un formulario, aparecerá una fila nueva
//  en la hoja "Consultas" de tu Google Sheet.
// ═══════════════════════════════════════════════════════════════════

const SHEET_ID   = '1NpAJJkV1k6U-q1ZOCGFFoK8oyBAIWGH6535Wc-bA8Yw';
const SHEET_NAME = 'Consultas';
const DATA_TOKEN = 'avivet2026'; // cambia esto por un código privado tuyo

// Orden y etiquetas de las columnas en el Sheet
const COLUMNAS = [
  ['timestamp',              'Timestamp (automático)'],
  ['fecha_consulta',         'Fecha consulta'],
  ['tipo_sesion',            'Tipo de sesión'],
  ['productor',              'Productor / empresa'],
  ['telefono',               'Teléfono'],
  ['email',                  'Email'],
  ['localidad',              'Localidad / comuna'],
  ['region',                 'Región'],
  // Pabellón
  ['n_pabellones',           'N° pabellones'],
  ['pab_largo',              'Largo pabellón (m)'],
  ['pab_ancho',              'Ancho pabellón (m)'],
  ['pab_altura',             'Altura cumbrera (m)'],
  ['orientacion',            'Orientación'],
  ['cubierta',               'Cubierta'],
  ['muro',                   'Muro'],
  ['piso_tipo',              'Piso'],
  ['ventilacion',            'Ventilación'],
  ['n_extractores',          'N° extractores'],
  ['tipo_iluminacion',       'Tipo iluminación'],
  ['n_focos',                'N° focos'],
  ['horas_luz',              'Horas luz artificial (h/día)'],
  ['lux_medidos',            'Lux medidos'],
  // Sistema de alojamiento
  ['sistema_alojamiento',    'Sistema de alojamiento'],
  ['marca_jaulas',           'Marca / modelo jaulas'],
  ['j_pisos',                'N° pisos/módulo'],
  ['j_modulos',              'N° módulos'],
  ['j_largo',                'Largo jaula (cm)'],
  ['j_prof',                 'Profundidad jaula (cm)'],
  ['j_alto',                 'Alto jaula (cm)'],
  ['j_aves_jaula',           'Aves por jaula'],
  ['area_jaula_cm2',         'Área jaula (cm²)'],
  ['cm2_por_ave',            'cm²/ave (calculado)'],
  ['eval_densidad_jaula',    'Evaluación densidad jaulas'],
  ['material_cama',          'Material cama'],
  ['prof_cama',              'Profundidad cama (cm)'],
  ['estado_cama',            'Estado cama'],
  ['p_largo',                'Largo pabellón piso (m)'],
  ['p_ancho',                'Ancho pabellón piso (m)'],
  ['p_pct_area',             '% área efectiva'],
  ['p_aves',                 'N° aves en piso'],
  ['aves_por_m2',            'Aves/m² (calculado)'],
  ['m2_por_ave',             'm²/ave (calculado)'],
  ['sup_interior',           'Sup. interior semilibertad (m²)'],
  ['sup_potrero',            'Sup. potrero (m²)'],
  ['sl_aves',                'N° aves semilibertad'],
  ['horas_exterior',         'Horas acceso exterior (h/día)'],
  ['tipo_potrero',           'Tipo de potrero'],
  ['rotacion_potrero',       'Rotación potrero'],
  // Equipamiento
  ['tipo_comedero',          'Tipo comedero'],
  ['comederos_cantidad',     'N° comederos / m lineales'],
  ['diametro_comedero',      'Diámetro comedero circular (cm)'],
  ['estado_comederos',       'Estado comederos'],
  ['tipo_bebedero',          'Tipo bebedero'],
  ['n_bebederos',            'N° bebederos'],
  ['fuente_agua',            'Fuente de agua'],
  ['tratamiento_agua',       'Tratamiento agua'],
  ['analisis_agua',          'Análisis de agua'],
  ['tipo_nidal',             'Tipo nidal'],
  ['n_nidales',              'N° nidales'],
  ['material_nidal',         'Material nidal'],
  // Lote
  ['n_lotes',                'N° lotes en el plantel'],
  ['num_lote',               'N° de este lote'],
  ['linea_genetica',         'Línea genética'],
  ['fecha_nacimiento',       'Fecha nacimiento / llegada'],
  ['semana_edad',            'Semana de edad'],
  ['etapa_productiva',       'Etapa productiva'],
  ['n_aves_ingresadas',      'N° aves ingresadas'],
  ['n_aves_actuales',        'N° aves actuales'],
  ['mortalidad_pct',         'Mortalidad acumulada (%)'],
  ['sem_inicio_postura',     'Sem. inicio postura'],
  // Parámetros
  ['total_huevos_dia',       'Total huevos producidos (día)'],
  ['pct_postura',            '% postura'],
  ['peso_corporal',          'Peso corporal (g/ave)'],
  ['humedad',                'Humedad relativa (%)'],
  ['tiene_termometro',       '¿Tiene termómetro interior?'],
  ['temp_minima',            'T° mínima registrada (°C)'],
  ['lotes_adicionales',      'Datos lotes adicionales'],
  // Alimentación
  ['tipo_alimento',          'Tipo alimento'],
  ['n_veces_alimentacion',   'N° veces alimenta al día'],
  ['horarios_alimentacion',  'Horarios de alimentación'],
  ['obs_alimentacion',       'Obs. alimentación / suplementos'],
  // Sanidad
  ['programa_vacunacion',    'Programa vacunación'],
  ['ultima_vacuna',          'Última vacuna'],
  ['control_ectoparasitos',  'Control ectoparásitos'],
  ['desinfeccion',           'Desinfección'],
  ['registro_productivo',    'Registro productivo'],
  ['otras_especies',         'Otras especies en predio'],
  // Consulta
  ['motivo_consulta',        'Motivo de consulta'],
  ['desde_cuando',           'Desde cuándo'],
  ['pct_afectadas',          '% aves afectadas'],
  ['diagnosticos_previos',   'Diagnósticos previos'],
  ['descripcion_problema',   'Descripción del problema'],
  ['tratamientos_aplicados', 'Tratamientos aplicados'],
  // Fotos
  ['obs_fotos',              'Observaciones fotos'],
  ['fotos_drive_url',        'Fotos en Drive (URL carpeta)'],
  ['obs_adicionales',        'Observaciones adicionales'],
];

// ─────────────────────────────────────────────────────────────────────
// Guarda las imágenes en Drive y devuelve la URL de la carpeta
function guardarImagenesEnDrive(imagenes, productor, fecha) {
  const parentName = 'AviVet Telemedicina Fotos';
  let parentFolder;
  const search = DriveApp.getFoldersByName(parentName);
  parentFolder = search.hasNext() ? search.next() : DriveApp.createFolder(parentName);

  const safe = (productor || 'sin_nombre').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '').trim().substring(0, 40);
  const folderName = (fecha || Utilities.formatDate(new Date(), 'America/Santiago', 'yyyy-MM-dd')) + '_' + safe;
  const folder = parentFolder.createFolder(folderName);

  imagenes.forEach((img, i) => {
    try {
      const decoded = Utilities.base64Decode(img.base64);
      const nombre  = (img.etiqueta || 'foto') + '_' + (i + 1) + '.jpg';
      const blob    = Utilities.newBlob(decoded, 'image/jpeg', nombre);
      folder.createFile(blob);
    } catch (_) {}
  });

  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder.getUrl();
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    let sheet   = ss.getSheetByName(SHEET_NAME);

    // Crear hoja y encabezados si no existe
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = COLUMNAS.map(c => c[1]);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight('bold')
           .setBackground('#2e7d32')
           .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // Guardar fotos en Drive si vienen adjuntas
    if (Array.isArray(data.imagenes) && data.imagenes.length > 0) {
      data.fotos_drive_url = guardarImagenesEnDrive(data.imagenes, data.productor, data.fecha_consulta);
    }
    delete data.imagenes;

    // Construir fila en el orden definido en COLUMNAS
    const keys = COLUMNAS.map(c => c[0]);
    const row  = keys.map(key => {
      if (key === 'timestamp') return new Date();
      return data[key] !== undefined ? data[key] : '';
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Endpoint GET — devuelve datos del Sheet si el token es correcto
function doGet(e) {
  const params = e.parameter || {};

  if (params.action === 'getData' && params.token === DATA_TOKEN) {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService.createTextOutput('[]').setMimeType(ContentService.MimeType.JSON);
    }
    const data    = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows    = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] instanceof Date ? row[i].toISOString() : row[i]; });
      return obj;
    });
    return ContentService
      .createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput('AviVet Telemedicina API activa ✓');
}
