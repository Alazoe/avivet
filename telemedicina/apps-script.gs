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
  ['cm_comedero_ave',        'cm comedero/ave'],
  ['estado_comederos',       'Estado comederos'],
  ['tipo_bebedero',          'Tipo bebedero'],
  ['n_bebederos',            'N° bebederos'],
  ['aves_por_bebedero',      'Aves por bebedero'],
  ['fuente_agua',            'Fuente de agua'],
  ['tratamiento_agua',       'Tratamiento agua'],
  ['analisis_agua',          'Análisis de agua'],
  ['tipo_nidal',             'Tipo nidal'],
  ['n_nidales',              'N° nidales'],
  ['aves_por_nidal',         'Aves por nidal'],
  ['material_nidal',         'Material nidal'],
  // Lote
  ['linea_genetica',         'Línea genética'],
  ['fecha_nacimiento',       'Fecha nacimiento / llegada'],
  ['semana_edad',            'Semana de edad'],
  ['etapa_productiva',       'Etapa productiva'],
  ['n_aves_ingresadas',      'N° aves ingresadas'],
  ['n_aves_actuales',        'N° aves actuales'],
  ['mortalidad_pct',         'Mortalidad acumulada (%)'],
  ['sem_inicio_postura',     'Sem. inicio postura'],
  // Parámetros
  ['pct_postura',            '% postura'],
  ['peso_corporal',          'Peso corporal (g/ave)'],
  ['consumo_alimento',       'Consumo alimento (g/ave/día)'],
  ['consumo_agua',           'Consumo agua (mL/ave/día)'],
  ['peso_huevo',             'Peso huevo (g)'],
  ['huevos_rotos_pct',       'Huevos rotos + sucios (%)'],
  ['temperatura',            'Temperatura pabellón (°C)'],
  ['humedad',                'Humedad relativa (%)'],
  // Nutrición
  ['tipo_alimento',          'Tipo alimento'],
  ['marca_alimento',         'Marca / proveedor alimento'],
  ['fase_racion',            'Fase / ración'],
  ['proteina',               'Proteína (%)'],
  ['energia_kcal',           'EM (kcal/kg)'],
  ['calcio',                 'Calcio (%)'],
  ['obs_alimentacion',       'Obs. alimentación'],
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
  ['foto_exterior',          'Foto exterior pabellón'],
  ['foto_interior',          'Foto interior general'],
  ['foto_jaulas',            'Foto jaulas'],
  ['foto_cama',              'Foto cama/piso'],
  ['foto_comederos',         'Foto comederos'],
  ['foto_bebederos',         'Foto bebederos'],
  ['foto_aves_sanas',        'Foto aves representativas'],
  ['foto_aves_enfermas',     'Foto aves con signos clínicos'],
  ['foto_huevos',            'Foto huevos'],
  ['foto_fecas',             'Foto fecas'],
  ['foto_nidales',           'Foto nidales'],
  ['foto_alimento',          'Foto etiqueta alimento'],
  ['foto_registro',          'Foto registro productivo'],
  ['foto_ventilacion',       'Foto ventilación'],
  ['foto_iluminacion',       'Foto iluminación'],
  ['foto_mortalidades',      'Foto mortalidades'],
  ['otras_fotos',            'Otras fotos / videos'],
  ['obs_adicionales',        'Observaciones adicionales'],
];

// ─────────────────────────────────────────────────────────────────────
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

// Endpoint GET para verificar que el script está activo
function doGet(e) {
  return ContentService.createTextOutput('AviVet Telemedicina API activa ✓');
}
