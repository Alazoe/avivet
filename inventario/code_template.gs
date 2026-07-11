// ================================================================
// TEMPLATE — Sistema Inventario Planta de Alimentos
// Versión mínima: 1 dieta — para replicar en nuevas avícolas
//
// SETUP (hacer una sola vez por cliente):
//   1. Crear un Google Sheet nuevo y vacío
//   2. Herramientas > Apps Script → pegar este archivo
//   3. Cambiar los valores de la sección CONFIGURACIÓN (abajo)
//   4. Desplegar: Implementar > App web > Cualquiera > Implementar
//   5. Ejecutar inicializarTemplate() desde el editor
//   6. Copiar la URL del deploy en config/{cliente}.json → backendUrl
// ================================================================

// ══════════════════════════════════════════════════════════════
//  CONFIGURACIÓN DEL CLIENTE  ← MODIFICAR AQUÍ
// ══════════════════════════════════════════════════════════════

const SHEET_ID            = "REEMPLAZAR_CON_ID_DEL_SHEET";
const NOMBRE_PLANTA       = "Nombre de la Planta";          // ej. "Avícola Los Robles"
const RESPONSABLE_BODEGA  = "Nombre del Encargado";         // quien hace los conteos
const RESPONSABLE_ADMIN   = "Andrés Lazo";
const PASSWORD_ADMIN      = "admin2025";                    // cambiar antes de entregar

// ──────────────────────────────────────────────
//  MATERIAS PRIMAS  ← Se cargan desde el admin en la app
//  Dejar vacío: el usuario agrega los insumos desde el panel
// ──────────────────────────────────────────────
const MATERIAS_PRIMAS = [];

// ──────────────────────────────────────────────
//  RECETAS  ← Se cargan desde el admin en la app
//  Dejar vacío: el usuario define las dietas desde el panel
// ──────────────────────────────────────────────
const RECETAS = {};

// ──────────────────────────────────────────────
//  STOCKS MÍNIMOS  ← Completar con días de cobertura deseados
//  Recomendación: consumo_diario × días_de_seguridad
// ──────────────────────────────────────────────
// Stocks mínimos: se definen desde el panel una vez que se conoce la producción mensual
const STOCKS_MINIMOS = {};

// ══════════════════════════════════════════════════════════════
//  SETUP — ejecutar una sola vez
// ══════════════════════════════════════════════════════════════

function inicializarTemplate() {
  inicializarSistema();
  SpreadsheetApp.getUi().alert(
    "✅ " + NOMBRE_PLANTA + " inicializada.\n\n" +
    "Próximos pasos:\n" +
    "1. Agregar materias primas desde el panel Admin → Stock → Agregar MP\n" +
    "2. Crear las recetas/dietas desde Admin → Recetas\n" +
    "3. Ingresar stock inicial con la app de Conteo\n" +
    "4. Definir stocks mínimos desde Admin → Precios"
  );
}

// ══════════════════════════════════════════════════════════════
//  BACKEND — NO MODIFICAR
//  (idéntico para todos los clientes)
// ══════════════════════════════════════════════════════════════

function inicializarSistema() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  crearHojaConfig(ss);
  crearHojaMateriasPrimas(ss);
  crearHojaRecetas(ss);
  crearHojaConteosFisicos(ss);
  crearHojaStockActual(ss);
  crearHojaOrdenes(ss);
  crearHojaProyecciones(ss);
  crearHojaPlanificacion(ss);
  crearHojaStockTeorico(ss);
  cargarStocksMinimos();
  const s1 = ss.getSheetByName("Sheet1") || ss.getSheetByName("Hoja 1") || ss.getSheetByName("Hoja1");
  if (s1 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  SpreadsheetApp.flush();
}

// ── Utilidades ────────────────────────────────
function getOrCreate(ss, nombre) { return ss.getSheetByName(nombre) || ss.insertSheet(nombre); }

function headerStyle(sheet, row, cols, bgHex) {
  sheet.getRange(row, 1, 1, cols)
    .setBackground("#" + bgHex).setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontFamily("Arial").setFontSize(10).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(row, 24);
}

function normFecha(val) {
  if (!val) return "";
  if (val instanceof Date) return Utilities.formatDate(val, "America/Santiago", "yyyy-MM-dd");
  return String(val).substring(0, 10);
}

function columnToLetter(col) {
  let letter = "";
  while (col > 0) { const rem = (col-1) % 26; letter = String.fromCharCode(65+rem) + letter; col = Math.floor((col-1)/26); }
  return letter;
}

// ── Creación de hojas ─────────────────────────

function crearHojaConfig(ss) {
  const ws = getOrCreate(ss, "CONFIG"); ws.clearContents();
  ws.getRange("A1:B1").merge().setValue("CONFIGURACIÓN DEL SISTEMA")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  const config = [
    ["clave","valor"],
    ["planta",                   NOMBRE_PLANTA],
    ["responsable_inventario",   RESPONSABLE_BODEGA],
    ["admin",                    RESPONSABLE_ADMIN],
    ["password_admin",           PASSWORD_ADMIN],
    ["dias_alerta_stock",        "7"],
    ["ultima_actualizacion",     new Date().toISOString()],
  ];
  ws.getRange(2, 1, config.length, 2).setValues(config);
  headerStyle(ws, 2, 2, "2D6A4F");
  ws.setColumnWidth(1, 220); ws.setColumnWidth(2, 280);
}

function crearHojaMateriasPrimas(ss) {
  const ws = getOrCreate(ss, "MATERIAS_PRIMAS"); ws.clearContents();
  ws.getRange("A1:H1").merge().setValue("MATERIAS PRIMAS — " + NOMBRE_PLANTA)
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  const headers = ["Código","Nombre","Unidad","Grupo","Stock Mín (kg)","Proveedor","Precio $/kg","Activo"];
  ws.getRange(2, 1, 1, headers.length).setValues([headers]);
  headerStyle(ws, 2, headers.length, "2D6A4F");
  const data = MATERIAS_PRIMAS.map(mp => [mp[0], mp[1], mp[2], mp[3], 0, "", 0, "SÍ"]);
  ws.getRange(3, 1, data.length, headers.length).setValues(data).setFontFamily("Arial").setFontSize(10);
  [130, 280, 80, 110, 110, 180, 100, 70].forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

function crearHojaRecetas(ss) {
  const ws = getOrCreate(ss, "RECETAS"); ws.clearContents();
  const nombres = Object.keys(RECETAS); const numCols = 2 + nombres.length;
  ws.getRange(1, 1, 1, numCols).merge()
    .setValue("RECETAS / FÓRMULAS — kg por 1.000 kg de mezcla")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  ws.getRange(2, 1).setValue("INSUMO").setBackground("#2D6A4F").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(2, 2).setValue("Código MP").setBackground("#2D6A4F").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  nombres.forEach((n, i) => {
    ws.getRange(2, 3+i).setValue(n).setBackground(RECETAS[n].activo ? "#2D6A4F" : "#888888").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  });
  ws.setRowHeight(2, 24);
  ws.getRange(3, 1).setValue("Fecha inicio").setBackground("#95D5B2").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(3, 2).setBackground("#95D5B2");
  nombres.forEach((n, i) => ws.getRange(3, 3+i).setValue(RECETAS[n].fecha).setBackground("#95D5B2").setHorizontalAlignment("center").setFontWeight("bold"));
  ws.getRange(4, 1).setValue("Activo").setBackground("#D8F3DC").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(4, 2).setBackground("#D8F3DC");
  nombres.forEach((n, i) => {
    const a = RECETAS[n].activo;
    ws.getRange(4, 3+i).setValue(a ? "SÍ" : "NO").setBackground(a ? "#D8F3DC" : "#FFD6D6").setFontColor(a ? "#006400" : "#CC0000").setFontWeight("bold").setHorizontalAlignment("center");
  });
  let row = 5;
  MATERIAS_PRIMAS.forEach(([cod, nombre]) => {
    let tieneValor = false;
    nombres.forEach(d => { if (RECETAS[d].insumos[cod]) tieneValor = true; });
    if (!tieneValor) return;
    ws.getRange(row, 1).setValue(nombre).setFontWeight("bold").setFontFamily("Arial").setFontSize(10);
    ws.getRange(row, 2).setValue(cod).setFontColor("#555555").setFontFamily("Arial").setFontSize(9);
    nombres.forEach((d, i) => {
      const val = RECETAS[d].insumos[cod] || "";
      ws.getRange(row, 3+i).setValue(val).setHorizontalAlignment("center").setFontFamily("Arial").setFontSize(10);
      if (!RECETAS[d].activo) ws.getRange(row, 3+i).setFontColor("#AAAAAA");
    });
    ws.setRowHeight(row, 18); row++;
  });
  ws.getRange(row, 1).setValue("TOTAL").setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(row, 2).setBackground("#1B4332");
  for (let i = 0; i < nombres.length; i++) {
    const col = 3 + i; const letra = columnToLetter(col);
    ws.getRange(row, col).setFormula(`=SUM(${letra}5:${letra}${row-1})`).setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  }
  ws.setColumnWidth(1, 240); ws.setColumnWidth(2, 140);
  for (let i = 0; i < nombres.length; i++) ws.setColumnWidth(3+i, 130);
  ws.setFrozenRows(4);
}

function crearHojaConteosFisicos(ss) {
  const ws = getOrCreate(ss, "CONTEOS_FISICOS"); ws.clearContents();
  ws.getRange("A1:H1").merge().setValue("CONTEOS FÍSICOS — " + NOMBRE_PLANTA)
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  ws.getRange(2, 1, 1, 8).setValues([["ID","Fecha","Hora","Código MP","Nombre MP","Cantidad (kg/unidad)","Responsable","Observaciones"]]);
  headerStyle(ws, 2, 8, "2D6A4F");
  [60, 110, 80, 120, 250, 150, 180, 220].forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

function crearHojaStockActual(ss) {
  const ws = getOrCreate(ss, "STOCK_ACTUAL"); ws.clearContents();
  ws.getRange("A1:I1").merge().setValue("STOCK ACTUAL — Actualizado automáticamente desde conteos")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  ws.getRange(2, 1, 1, 9).setValues([["Código MP","Nombre","Stock (kg)","Stock Mín (kg)","Consumo Diario (kg)","Días de Stock","Estado","Último Conteo","Alerta"]]);
  headerStyle(ws, 2, 9, "2D6A4F");
  MATERIAS_PRIMAS.forEach(([cod, nombre,, grupo], i) => {
    if (grupo === "Envases") return;
    const row = i + 3;
    ws.getRange(row, 1).setValue(cod); ws.getRange(row, 2).setValue(nombre);
    ws.getRange(row, 3).setValue(0); ws.getRange(row, 4).setValue(0);
    ws.getRange(row, 5).setValue(0); ws.getRange(row, 6).setValue("N/D");
    ws.getRange(row, 7).setValue("SIN STOCK"); ws.getRange(row, 8).setValue("");
    ws.getRange(row, 9).setFormula(`=IF(AND(F${row}<>"N/D",F${row}<7),"⚠ REPONER","")`);
    ws.getRange(row, 1, 1, 9).setFontFamily("Arial").setFontSize(10);
    ws.setRowHeight(row, 18);
  });
  [130, 260, 100, 110, 140, 110, 110, 140, 110].forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

function crearHojaOrdenes(ss) {
  const ws = getOrCreate(ss, "ORDENES_COMPRA"); ws.clearContents();
  ws.getRange("A1:L1").merge().setValue("ÓRDENES DE COMPRA — " + NOMBRE_PLANTA)
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  ws.getRange(2, 1, 1, 12).setValues([["N° OC","Fecha OC","Código MP","Nombre MP","Cantidad (kg)","Precio Unit ($)","Total ($)","Proveedor","Fecha Entrega Est.","Estado","Fecha Recepción","Obs."]]);
  headerStyle(ws, 2, 12, "2D6A4F");
  [80,110,120,240,110,110,110,200,130,110,130,200].forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

function crearHojaProyecciones(ss) {
  const ws = getOrCreate(ss, "PROYECCIONES"); ws.clearContents();
  ws.getRange("A1:G1").merge().setValue("PROYECCIONES DE CONSUMO")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  ws.getRange("A2:G2").merge().setValue("▶ PRODUCCIÓN DIARIA POR DIETA (kg producidos por día)")
    .setBackground("#FFF3CD").setFontWeight("bold").setFontSize(10);
  ws.getRange(3, 1, 1, 7).setValues([["Dieta","Código","kg/día","kg/semana","kg/mes","Activo","Últ. actualización"]]);
  headerStyle(ws, 3, 7, "2D6A4F");
  let rowProd = 4;
  Object.entries(RECETAS).filter(([,v]) => v.activo).forEach(([nombre, v]) => {
    ws.getRange(rowProd, 1).setValue(nombre).setFontWeight("bold");
    ws.getRange(rowProd, 2).setValue(v.codigo);
    ws.getRange(rowProd, 3).setValue(0).setBackground("#FFF3CD");
    ws.getRange(rowProd, 4).setFormula(`=C${rowProd}*7`);
    ws.getRange(rowProd, 5).setFormula(`=C${rowProd}*30`);
    ws.getRange(rowProd, 6).setValue("SÍ").setFontColor("#006400").setFontWeight("bold");
    ws.getRange(rowProd, 1, 1, 7).setFontFamily("Arial").setFontSize(10);
    ws.setRowHeight(rowProd, 18); rowProd++;
  });
  const sepRow = rowProd + 1;
  ws.getRange(sepRow, 1, 1, 7).merge().setValue("▶ CONSUMO ESTIMADO DE MATERIAS PRIMAS")
    .setBackground("#2D6A4F").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  ws.setRowHeight(sepRow, 26);
  ws.getRange(sepRow+1, 1, 1, 7).setValues([["Código MP","Nombre MP","Cons. Diario (kg)","Cons. Semanal","Cons. Mensual","Stock Actual","Días de Stock"]]);
  headerStyle(ws, sepRow+1, 7, "2D6A4F");
  MATERIAS_PRIMAS.filter(([,,, g]) => g !== "Envases").forEach(([cod, nombre], i) => {
    const row = sepRow + 2 + i;
    ws.getRange(row, 1).setValue(cod); ws.getRange(row, 2).setValue(nombre);
    let prodRow = 4; const terminos = [];
    Object.entries(RECETAS).filter(([,v]) => v.activo).forEach(([, v]) => {
      const prop = v.insumos[cod] || 0;
      if (prop > 0) terminos.push(`(PROYECCIONES!C${prodRow}*${prop}/1000)`);
      prodRow++;
    });
    ws.getRange(row, 3).setFormula("=" + (terminos.length ? terminos.join("+") : "0"));
    ws.getRange(row, 4).setFormula(`=C${row}*7`);
    ws.getRange(row, 5).setFormula(`=C${row}*30`);
    ws.getRange(row, 6).setFormulaR1C1('=IFERROR(VLOOKUP(RC1,STOCK_ACTUAL!C1:C3,3,FALSE),0)');
    ws.getRange(row, 7).setFormulaR1C1('=IFERROR(IF(RC3>0,ROUND(RC6/RC3,0),"N/D"),"N/D")');
    ws.getRange(row, 1, 1, 7).setFontFamily("Arial").setFontSize(10); ws.setRowHeight(row, 18);
  });
  [130,260,130,130,130,130,110].forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(3);
}

function crearHojaPlanificacion(ss) {
  const ws = getOrCreate(ss, "PLANIFICACION"); ws.clearContents();
  ws.getRange("A1:D1").merge().setValue("PLANIFICACIÓN DE PRODUCCIÓN — kg/día por dieta")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  ws.getRange(2, 1, 1, 4).setValues([["Fecha","Dieta","kg_dia","Guardado"]]);
  headerStyle(ws, 2, 4, "2D6A4F");
  [120, 200, 100, 160].forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

function crearHojaStockTeorico(ss) {
  const ws = getOrCreate(ss, "STOCK_TEORICO"); ws.clearContents();
  ws.getRange("A1:J1").merge()
    .setValue("STOCK TEÓRICO — Calculado desde último conteo + plan de producción")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  ws.getRange(2, 1, 1, 10).setValues([[
    "Fecha Producción","Código MP","Nombre MP",
    "Fecha Último Conteo","Stock Último Conteo (kg)",
    "Consumo Acumulado (kg)","Stock Teórico (kg)",
    "Conteo Real (kg)","Diferencia (kg)","Calculado"
  ]]);
  headerStyle(ws, 2, 10, "2D6A4F");
  [130,120,250,140,160,160,140,130,120,130].forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

function cargarStocksMinimos() {
  const ss   = SpreadsheetApp.openById(SHEET_ID);
  const ws   = ss.getSheetByName("STOCK_ACTUAL");
  const data = ws.getRange(3, 1, ws.getLastRow()-2, 4).getValues();
  data.forEach((row, i) => { const min = STOCKS_MINIMOS[row[0]]; if (min !== undefined) ws.getRange(i+3, 4).setValue(min); });
  SpreadsheetApp.flush();
}

// ── Router ────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action || "";
  let result;
  try {
    switch (action) {
      case "getMateriasPrimas":    result = getMateriasPrimas();                                                                break;
      case "getStockActual":       result = getStockActual();                                                                  break;
      case "getOrdenes":           result = getOrdenes();                                                                      break;
      case "getDashboard":         result = getDashboard();                                                                    break;
      case "getRecetas":           result = getRecetas();                                                                      break;
      case "guardarRecetas":       result = guardarRecetas(e.parameter);                                                       break;
      case "registrarConteo":      result = registrarConteo(e.parameter);                                                      break;
      case "guardarOrden":         result = guardarOrden(e.parameter);                                                         break;
      case "guardarPlanificacion": result = guardarPlanificacion(JSON.parse(decodeURIComponent(e.parameter.payload||"{}"))); break;
      case "getPlanificacion":     result = getPlanificacion(e.parameter);                                                     break;
      case "getConteosDelDia":     result = getConteosDelDia(e.parameter.fecha);                          break;
      case "agregarMateriaPrima": result = agregarMateriaPrima(e.parameter);                                               break;
      case "actualizarPrecios":    result = actualizarPrecios(JSON.parse(decodeURIComponent(e.parameter.payload||"{}")));   break;
      case "calcularStockTeorico": result = calcularYGuardarStockTeorico(e.parameter);                                         break;
      case "getStockTeorico":      result = getStockTeorico(e.parameter);                                                      break;
      default: result = { ok: true, msg: NOMBRE_PLANTA + " — sistema activo" };
    }
  } catch(err) { result = { ok: false, error: err.message }; }
  const cb = e.parameter.callback; const out = JSON.stringify(result);
  return ContentService.createTextOutput(cb ? cb + "(" + out + ")" : out)
    .setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

// ── CRUD / Lectura ────────────────────────────

function getMateriasPrimas() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("MATERIAS_PRIMAS");
  const data = ws.getRange(3, 1, ws.getLastRow()-2, 8).getValues();
  return { ok: true, data: data.filter(r => r[0]).map(r => ({
    codigo: r[0], nombre: r[1], unidad: r[2], grupo: r[3],
    stock_min: r[4], proveedor: r[5], precio: r[6], activo: r[7]
  }))};
}

function calcularConsumosDiariosDesdeplan() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("PLANIFICACION");
  if (!ws || ws.getLastRow() < 3) return {};
  const tz = "America/Santiago"; const hoy = new Date(); const hasta = new Date(hoy); hasta.setDate(hasta.getDate() + 7);
  const hoyStr = Utilities.formatDate(hoy, tz, "yyyy-MM-dd"); const hastaStr = Utilities.formatDate(hasta, tz, "yyyy-MM-dd");
  const rows = ws.getRange(3, 1, ws.getLastRow()-2, 3).getValues();
  const planSum = {}; const fechaSet = new Set();
  rows.filter(r => r[0] && r[2] > 0).forEach(r => {
    const f = r[0]; if (f >= hoyStr && f <= hastaStr) { fechaSet.add(f); planSum[r[1]] = (planSum[r[1]] || 0) + parseFloat(r[2]); }
  });
  const numDias = Math.max(fechaSet.size, 1);
  const recetasRes = getRecetas();
  const recetasViva = recetasRes.ok && Object.keys(recetasRes.data).length
    ? recetasRes.data
    : Object.fromEntries(Object.entries(RECETAS).map(([k,v]) => [k, v]));
  const consumos = {};
  Object.entries(recetasViva).forEach(([dieta, receta]) => {
    const kgDia = (planSum[dieta] || 0) / numDias; if (kgDia <= 0) return;
    Object.entries(receta.insumos || {}).forEach(([cod, prop]) => { consumos[cod] = (consumos[cod] || 0) + kgDia * (prop / 1000); });
  });
  return consumos;
}

function getStockActual() {
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = ss.getSheetByName("STOCK_ACTUAL"); const last = ws.getLastRow();
  if (last < 3) return { ok: true, ts: new Date().toISOString(), data: [] };
  const data = ws.getRange(3, 1, last-2, 9).getValues(); const consumos = calcularConsumosDiariosDesdeplan();
  return { ok: true, ts: new Date().toISOString(), data: data.filter(r => r[0]).map(r => {
    const stock = parseFloat(r[2])||0; const stockMin = parseFloat(r[3])||0;
    const consumoD = Math.round((consumos[r[0]]||0)*10)/10;
    const diasStock = consumoD > 0 ? Math.round(stock/consumoD*10)/10 : "N/D";
    let estado;
    if (stock===0) estado="SIN STOCK"; else if (stock<stockMin) estado="CRÍTICO"; else if (stock<stockMin*1.5) estado="BAJO"; else estado="OK";
    return { codigo: r[0], nombre: r[1], stock, stock_min: stockMin, consumo_diario: consumoD,
             dias_stock: diasStock, estado, ultimo_conteo: r[7] ? r[7].toString() : "",
             alerta: diasStock !== "N/D" && diasStock < 7 ? "⚠ REPONER" : "" };
  })};
}

function getDashboard() {
  const stock = getStockActual();
  const data  = stock.ok ? stock.data : [];
  const sinStock = data.filter(d => d.estado === "SIN STOCK").length;
  const critico  = data.filter(d => d.estado === "CRÍTICO").length;
  const bajo     = data.filter(d => d.estado === "BAJO").length;
  const ok       = data.filter(d => d.estado === "OK").length;
  const ordenes  = getOrdenes();
  const pendientes = ordenes.ok ? ordenes.data.filter(o => o.estado === "PENDIENTE").length : 0;
  return { ok: true, ts: new Date().toISOString(), stock: data, resumen: { sinStock, critico, bajo, ok, pendientes } };
}

function getOrdenes() {
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = ss.getSheetByName("ORDENES_COMPRA"); const last = ws.getLastRow();
  if (last < 3) return { ok: true, data: [] };
  const data = ws.getRange(3, 1, last-2, 12).getValues();
  return { ok: true, data: data.filter(r => r[0]).map(r => ({
    noc: r[0], fecha: r[1]?.toString(), codigo: r[2], nombre: r[3],
    cantidad: r[4], precio: r[5], total: r[6], proveedor: r[7],
    fecha_entrega: r[8]?.toString(), estado: r[9], fecha_recepcion: r[10]?.toString(), obs: r[11]
  }))};
}

function getRecetas() {
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = ss.getSheetByName("RECETAS");
  if (!ws) return { ok: false, error: "Hoja RECETAS no encontrada" };
  const lastCol = ws.getLastColumn(); const lastRow = ws.getLastRow();
  if (lastRow < 5 || lastCol < 3) return { ok: true, data: {} };
  const allData = ws.getRange(2, 1, lastRow-1, lastCol).getValues();
  const headersRow = allData[0]; const datesRow = allData[1]; const activoRow = allData[2]; const ingRows = allData.slice(3);
  const dietNames = headersRow.slice(2).filter(n => n !== "");
  const recetas = {};
  dietNames.forEach((nombre, i) => { recetas[nombre] = { activo: activoRow[2+i] === "SÍ", fecha: String(datesRow[2+i]||""), insumos: {} }; });
  ingRows.forEach(row => {
    const cod = String(row[1]||"").trim(); if (!cod || row[0]==="TOTAL") return;
    dietNames.forEach((nombre, i) => { const val = parseFloat(row[2+i]); if (val > 0) recetas[nombre].insumos[cod] = val; });
  });
  return { ok: true, data: recetas };
}

function guardarRecetas(body) {
  let recetas;
  try { recetas = JSON.parse(decodeURIComponent(body.payload||"{}")); } catch(e) { return { ok: false, error: "JSON inválido" }; }
  if (!recetas || typeof recetas !== "object") return { ok: false, error: "Datos inválidos" };
  _respaldoRecetas(recetas);
  _escribirHojaRecetas(recetas);
  return { ok: true, msg: "Recetas actualizadas", n: Object.keys(recetas).length };
}

function _respaldoRecetas(recetasObj) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let ws = ss.getSheetByName("RECETAS_HISTORIAL");
    if (!ws) { ws = ss.insertSheet("RECETAS_HISTORIAL"); ws.getRange(1,1,1,4).setValues([["Fecha","Hora","N° dietas","Snapshot JSON"]]).setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold"); ws.setFrozenRows(1); }
    const ahora = new Date();
    ws.appendRow([Utilities.formatDate(ahora,"America/Santiago","yyyy-MM-dd"), Utilities.formatDate(ahora,"America/Santiago","HH:mm:ss"), Object.keys(recetasObj).length, JSON.stringify(recetasObj)]);
    const filas = ws.getLastRow() - 1; if (filas > 50) ws.deleteRows(2, filas-50);
  } catch(e) { console.error("Respaldo falló: "+e.message); }
}

function _escribirHojaRecetas(recetasObj) {
  const data = (recetasObj && Object.keys(recetasObj).length) ? recetasObj : RECETAS;
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = getOrCreate(ss, "RECETAS"); ws.clearContents(); ws.clearFormats();
  const nombres = Object.keys(data); if (!nombres.length) return; const numCols = 2 + nombres.length;
  ws.getRange(1,1,1,numCols).merge().setValue("RECETAS / FÓRMULAS — kg por 1.000 kg de mezcla").setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center"); ws.setRowHeight(1,30);
  ws.getRange(2,1,3,numCols).setValues([["INSUMO","Código MP",...nombres],["Fecha inicio","",...nombres.map(n=>data[n].fecha||"")],["Activo","",...nombres.map(n=>data[n].activo?"SÍ":"NO")]]).setFontFamily("Arial").setFontSize(10).setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(2,1,1,2).setBackground("#2D6A4F").setFontColor("#FFFFFF"); nombres.forEach((n,i) => { ws.getRange(2,3+i).setBackground(data[n].activo?"#2D6A4F":"#888888").setFontColor("#FFFFFF"); ws.getRange(3,3+i).setBackground("#95D5B2"); ws.getRange(4,3+i).setBackground(data[n].activo?"#D8F3DC":"#FFD6D6").setFontColor(data[n].activo?"#006400":"#CC0000"); });
  let row = 5;
  MATERIAS_PRIMAS.forEach(([cod, nombre]) => {
    let tv = false; nombres.forEach(d => { if ((data[d].insumos||{})[cod]) tv = true; }); if (!tv) return;
    ws.getRange(row,1).setValue(nombre).setFontWeight("bold").setFontFamily("Arial").setFontSize(10);
    ws.getRange(row,2).setValue(cod).setFontColor("#555555").setFontFamily("Arial").setFontSize(9);
    nombres.forEach((d,i) => { const v=(data[d].insumos||{})[cod]||""; ws.getRange(row,3+i).setValue(v).setHorizontalAlignment("center").setFontFamily("Arial").setFontSize(10); }); ws.setRowHeight(row,18); row++;
  });
  ws.getRange(row,1).setValue("TOTAL").setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center"); ws.getRange(row,2).setBackground("#1B4332");
  for (let i = 0; i < nombres.length; i++) { const col = 3+i; const l = columnToLetter(col); ws.getRange(row,col).setFormula(`=SUM(${l}5:${l}${row-1})`).setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center"); }
  ws.setColumnWidth(1,240); ws.setColumnWidth(2,140); for (let i=0;i<nombres.length;i++) ws.setColumnWidth(3+i,130); ws.setFrozenRows(4);
}

function registrarConteo(body) {
  const { codigo, nombre, cantidad, responsable, obs } = body;
  if (!codigo || cantidad === undefined) return { ok: false, error: "Faltan campos: codigo, cantidad" };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const wsConteos = ss.getSheetByName("CONTEOS_FISICOS"); const wsStock = ss.getSheetByName("STOCK_ACTUAL");
  const lastRow = wsConteos.getLastRow(); const id = lastRow > 2 ? (wsConteos.getRange(lastRow,1).getValue()+1) : 1;
  const ahora = new Date();
  wsConteos.appendRow([id, Utilities.formatDate(ahora,"America/Santiago","yyyy-MM-dd"), Utilities.formatDate(ahora,"America/Santiago","HH:mm"), codigo, nombre, cantidad, responsable || RESPONSABLE_BODEGA, obs || ""]);
  const stockData = wsStock.getRange(3,1,wsStock.getLastRow()-2,9).getValues();
  const idx = stockData.findIndex(r => r[0] === codigo);
  if (idx >= 0) { wsStock.getRange(idx+3,3).setValue(cantidad); wsStock.getRange(idx+3,8).setValue(Utilities.formatDate(ahora,"America/Santiago","yyyy-MM-dd HH:mm")); }
  SpreadsheetApp.flush();
  return { ok: true, id, ts: ahora.toISOString(), msg: `Conteo registrado: ${nombre} = ${cantidad}` };
}

function guardarOrden(body) {
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = ss.getSheetByName("ORDENES_COMPRA");
  const noc = `OC-${String(ws.getLastRow()-1).padStart(3,"0")}`; const ahora = new Date();
  ws.appendRow([noc, Utilities.formatDate(ahora,"America/Santiago","yyyy-MM-dd"), body.codigo, body.nombre, body.cantidad, body.precio||0, (body.cantidad||0)*(body.precio||0), body.proveedor||"", body.fecha_entrega||"", "PENDIENTE", "", body.obs||""]);
  SpreadsheetApp.flush();
  return { ok: true, noc, msg: `Orden ${noc} creada` };
}

function guardarPlanificacion(body) {
  const ss = SpreadsheetApp.openById(SHEET_ID); let ws = ss.getSheetByName("PLANIFICACION");
  if (!ws) { crearHojaPlanificacion(ss); ws = ss.getSheetByName("PLANIFICACION"); }
  const dias = body.dias || []; const fechas = body.fechas || [...new Set(dias.map(d=>d.fecha))];
  if (!fechas.length) return { ok: false, error: "Sin datos" };
  const ahora = Utilities.formatDate(new Date(),"America/Santiago","yyyy-MM-dd HH:mm");
  const last = ws.getLastRow();
  if (last > 2) {
    const data = ws.getRange(3,1,last-2,2).getValues();
    const toDelete = []; data.forEach((r,i) => { if (fechas.includes(normFecha(r[0]))) toDelete.push(i+3); });
    for (let i = toDelete.length-1; i >= 0; i--) ws.deleteRow(toDelete[i]);
  }
  const rows = dias.filter(d => d.kg > 0).map(d => [d.fecha, d.dieta, d.kg, ahora]);
  if (rows.length) ws.getRange(ws.getLastRow()+1,1,rows.length,4).setValues(rows);
  SpreadsheetApp.flush();
  return { ok: true, msg: `Plan actualizado: ${rows.length} filas`, fechas };
}

function getPlanificacion(params) {
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = ss.getSheetByName("PLANIFICACION");
  if (!ws || ws.getLastRow() < 3) return { ok: true, data: [] };
  const desde = params.desde || null; const hasta = params.hasta || null;
  const data = ws.getRange(3,1,ws.getLastRow()-2,3).getValues()
    .filter(r => r[0] && r[2] > 0)
    .filter(r => { const f = normFecha(r[0]); if (desde && f < desde) return false; if (hasta && f > hasta) return false; return true; })
    .map(r => ({ fecha: normFecha(r[0]), dieta: r[1], kg_dia: r[2] }));
  return { ok: true, data };
}

function getConteosDelDia(fecha) {
  if (!fecha) return { ok: false, error: "Falta fecha" };
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = ss.getSheetByName("CONTEOS_FISICOS");
  if (!ws || ws.getLastRow() < 3) return { ok: true, data: [] };
  const data = ws.getRange(3,1,ws.getLastRow()-2,8).getValues();
  return { ok: true, data: data.filter(r => r[0] && normFecha(r[1]) === fecha).map(r => ({
    id: r[0], fecha: normFecha(r[1]), hora: r[2], codigo: String(r[3]||"").trim(),
    nombre: r[4], cantidad: parseFloat(r[5])||0, responsable: r[6], obs: r[7],
    ts_local: normFecha(r[1]) + "T" + (r[2]||"00:00")
  }))};
}

function actualizarPrecios(precios) {
  if (!precios || typeof precios !== "object") return { ok: false, error: "Payload inválido" };
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = ss.getSheetByName("MATERIAS_PRIMAS");
  if (!ws) return { ok: false, error: "Hoja MATERIAS_PRIMAS no encontrada" };
  const data = ws.getRange(3,1,ws.getLastRow()-2,7).getValues(); let actualizados = 0;
  data.forEach((row,i) => { const cod = row[0]; if (cod && precios[cod] !== undefined) { ws.getRange(3+i,7).setValue(Number(precios[cod])||0); actualizados++; } });
  return { ok: true, msg: `${actualizados} precios actualizados`, n: actualizados };
}

function calcularYGuardarStockTeorico(params) {
  const fecha = params.fecha || Utilities.formatDate(new Date(),"America/Santiago","yyyy-MM-dd");
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const wsConteos = ss.getSheetByName("CONTEOS_FISICOS");
  const ultimoConteo = {};
  if (wsConteos && wsConteos.getLastRow() > 2) {
    wsConteos.getRange(3,1,wsConteos.getLastRow()-2,8).getValues().filter(r => r[0] && r[1]).forEach(r => {
      const f = normFecha(r[1]); const cod = String(r[3]||"").trim(); const kg = parseFloat(r[5])||0;
      if (f <= fecha && cod) { if (!ultimoConteo[cod] || f > ultimoConteo[cod].fecha || (f === ultimoConteo[cod].fecha && String(r[2]) > ultimoConteo[cod].hora)) ultimoConteo[cod] = { fecha: f, hora: String(r[2]||""), cantidad: kg }; }
    });
  }
  const recetasRes = getRecetas();
  const recetas = recetasRes.ok && Object.keys(recetasRes.data).length ? recetasRes.data : Object.fromEntries(Object.entries(RECETAS).map(([k,v]) => [k,v]));
  const consumoAcum = {};
  const wsPlan = ss.getSheetByName("PLANIFICACION");
  if (wsPlan && wsPlan.getLastRow() > 2) {
    wsPlan.getRange(3,1,wsPlan.getLastRow()-2,3).getValues().filter(r => r[0] && r[2] > 0).forEach(r => {
      const fPlan = normFecha(r[0]); if (fPlan > fecha) return;
      const dieta = String(r[1]||"").trim(); const kgDia = parseFloat(r[2])||0; const rec = recetas[dieta]; if (!rec) return;
      Object.entries(rec.insumos||{}).forEach(([cod, prop]) => { const uc = ultimoConteo[cod]; if (uc && fPlan > uc.fecha && fPlan <= fecha) consumoAcum[cod] = (consumoAcum[cod]||0) + kgDia*(prop/1000); });
    });
  }
  const resultado = [];
  MATERIAS_PRIMAS.filter(([,,,g]) => g !== "Envases").forEach(([cod, nombre]) => {
    const uc = ultimoConteo[cod]; if (!uc) return;
    const consumo = Math.round((consumoAcum[cod]||0)*10)/10; const teorico = Math.round((uc.cantidad - consumo)*10)/10;
    resultado.push({ cod, nombre, fecha_conteo: uc.fecha, stock_conteo: uc.cantidad, consumo, teorico });
  });
  let wsTeor = ss.getSheetByName("STOCK_TEORICO");
  if (!wsTeor) { crearHojaStockTeorico(ss); wsTeor = ss.getSheetByName("STOCK_TEORICO"); }
  if (wsTeor.getLastRow() > 2) {
    const existing = wsTeor.getRange(3,1,wsTeor.getLastRow()-2,1).getValues();
    const toDelete = []; existing.forEach((r,i) => { if (normFecha(r[0]) === fecha) toDelete.push(i+3); });
    for (let i = toDelete.length-1; i >= 0; i--) wsTeor.deleteRow(toDelete[i]);
  }
  const conteosReales = {};
  if (wsConteos && wsConteos.getLastRow() > 2) {
    wsConteos.getRange(3,1,wsConteos.getLastRow()-2,8).getValues().filter(r => r[0] && normFecha(r[1]) === fecha).forEach(r => { const cod = String(r[3]||"").trim(); if (cod) conteosReales[cod] = parseFloat(r[5])||0; });
  }
  const ts = Utilities.formatDate(new Date(),"America/Santiago","yyyy-MM-dd HH:mm");
  resultado.forEach(r => { const real = conteosReales[r.cod] !== undefined ? conteosReales[r.cod] : ""; const diff = real !== "" ? Math.round((real - r.teorico)*10)/10 : ""; wsTeor.appendRow([fecha, r.cod, r.nombre, r.fecha_conteo, r.stock_conteo, r.consumo, r.teorico, real, diff, ts]); });
  SpreadsheetApp.flush();
  return { ok: true, fecha, data: resultado, n: resultado.length, msg: `Stock teórico calculado para ${fecha}: ${resultado.length} insumos` };
}

function getStockTeorico(params) {
  const fecha = params.fecha || ""; const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("STOCK_TEORICO"); if (!ws || ws.getLastRow() < 3) return { ok: true, data: [], calculado: false };
  const rows = ws.getRange(3,1,ws.getLastRow()-2,10).getValues().filter(r => r[0] && (!fecha || normFecha(r[0]) === fecha));
  if (!rows.length) return { ok: true, data: [], calculado: false };
  const wsConteos = ss.getSheetByName("CONTEOS_FISICOS"); const conteosReales = {};
  if (wsConteos && wsConteos.getLastRow() > 2) {
    wsConteos.getRange(3,1,wsConteos.getLastRow()-2,8).getValues().filter(r => r[0] && normFecha(r[1]) === fecha).forEach(r => { const cod = String(r[3]||"").trim(); if (cod) conteosReales[cod] = parseFloat(r[5])||0; });
  }
  return { ok: true, calculado: true, fecha, data: rows.map(r => {
    const cod = String(r[1]||""); const teorico = parseFloat(r[6])||0;
    const real = conteosReales[cod] !== undefined ? conteosReales[cod] : (r[7] !== "" ? parseFloat(r[7]) : null);
    const diff = real !== null ? Math.round((real - teorico)*10)/10 : null;
    let estado = "Pendiente";
    if (real !== null) { const pct = teorico > 0 ? Math.abs(diff)/teorico*100 : 0; estado = pct <= 3 ? "OK" : pct <= 7 ? "Alerta" : (diff < 0 ? "Pérdida" : "Exceso"); }
    return { codigo: cod, nombre: String(r[2]||""), fecha_ultimo_conteo: normFecha(r[3]), stock_ultimo_conteo: parseFloat(r[4])||0, consumo_produccion: parseFloat(r[5])||0, stock_teorico: teorico, conteo_real: real, diferencia: diff, estado };
  })};
}


function agregarMateriaPrima(params) {
  var codigo = String(params.codigo || "").trim().toUpperCase();
  var nombre = String(params.nombre || "").trim();
  var unidad = String(params.unidad || "kg").trim();
  var grupo  = String(params.grupo  || "Otros").trim();
  if (!codigo || !nombre) return { ok: false, error: "Faltan codigo y nombre" };
  var ss   = SpreadsheetApp.openById(SHEET_ID);
  var wsMP = ss.getSheetByName("MATERIAS_PRIMAS");
  if (!wsMP) return { ok: false, error: "Hoja MATERIAS_PRIMAS no encontrada" };
  var lastMP = wsMP.getLastRow();
  if (lastMP > 2) {
    var existing = wsMP.getRange(3, 1, lastMP - 2, 1).getValues().map(function(r){ return String(r[0]); });
    if (existing.indexOf(codigo) >= 0) return { ok: false, error: "El codigo " + codigo + " ya existe" };
  }
  wsMP.appendRow([codigo, nombre, unidad, grupo, 0, "", 0, "SI"]);
  var wsStock = ss.getSheetByName("STOCK_ACTUAL");
  if (wsStock) wsStock.appendRow([codigo, nombre, 0, 0, 0, "N/D", "SIN STOCK", "", ""]);
  SpreadsheetApp.flush();
  return { ok: true, msg: nombre + " agregada con codigo " + codigo, codigo: codigo, nombre: nombre };
}
