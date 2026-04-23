// ============================================================
// BACKEND — Sistema Inventario Planta Alimentos La Campestre
// Google Sheet ID: 1AhcHJ0rgewyu4FPh_37lih5iLjHEyrtkjpt86HhzQtA
// ============================================================

const SHEET_ID = "1AhcHJ0rgewyu4FPh_37lih5iLjHEyrtkjpt86HhzQtA";

// ──────────────────────────────────────────────
// DATOS MAESTROS
// ──────────────────────────────────────────────
const MATERIAS_PRIMAS = [
  ["30MAIZ-00",  "MAÍZ",                              "kg",  "Energéticos"],
  ["30AFSY-00",  "AFRECHO SOYA",                      "kg",  "Proteínas"],
  ["30COCH-00",  "CONCHUELA",                         "kg",  "Minerales"],
  ["30HTR3-00",  "HARINILLA TRIGO",                   "kg",  "Energéticos"],
  ["30PHSB-00",  "FOSFATO PHOSBIC",                   "kg",  "Minerales"],
  ["30MSRB-00",  "SECUESTRANTE",                      "kg",  "Aditivos"],
  ["30MET2-00",  "METIONINA",                         "kg",  "Aminoácidos"],
  ["30INMU-00",  "REGULADOR INTESTINAL",              "kg",  "Aditivos"],
  ["30LIS2-00",  "LISINA 99%",                        "kg",  "Aminoácidos"],
  ["30PLFD-00",  "POLIFEED",                          "kg",  "Aditivos"],
  ["30COCI-00",  "COCCISAN",                          "kg",  "Medicamentos"],
  ["30NSLP-00",  "NUCLEO SOLAGRO POLLITA CON ENZ",    "kg",  "Núcleos"],
  ["30NSLG-00",  "NUCLEO SOLAGRO PONEDORA CON ENZ",   "kg",  "Núcleos"],
  ["30SAL6-00",  "SAL FINA",                          "kg",  "Minerales"],
  ["30OVTO-00",  "OVOTOP",                            "kg",  "Aditivos"],
  ["30PIGM-00",  "PIGMENTO",                          "kg",  "Aditivos"],
  ["30EMEL-00",  "EMERAL",                            "kg",  "Aditivos"],
  ["30FITO-00",  "FITOGÉNICO",                        "kg",  "Aditivos"],
  ["10VSCT-00",  "CHICKTONIC 1LT",                   "litro","Aditivos"],
  ["30INSC-01",  "SACO 50X80 BLANCO",                "unidad","Envases"],
  ["30INSC-02",  "SACO 50X80 GRIS",                  "unidad","Envases"],
  ["30INSC-03",  "SACO 50X80 AMARILLO",              "unidad","Envases"],
  ["30INSC-04",  "SACO 50X80 ROJO",                  "unidad","Envases"],
];

const RECETAS = {
  "PONEDORA 1":     { codigo: "20P120-65", activo: true,  fecha: "19-may",
    insumos: {"30MAIZ-00":562,"30AFSY-00":266,"30COCH-00":106,"30HTR3-00":50,"30PHSB-00":6,"30MSRB-00":0.5,"30MET2-00":2.5,"30INMU-00":0.5,"30LIS2-00":0.5,"30PLFD-00":2,"30NSLP-00":0.5,"30SAL6-00":4,"30OVTO-00":1,"30NSLG-00":1,"30PIGM-00":0.2}},
  "PONEDORA 2":     { codigo: "20P266-90", activo: true,  fecha: "19-may",
    insumos: {"30MAIZ-00":552,"30AFSY-00":257,"30COCH-00":127,"30HTR3-00":50,"30PHSB-00":4,"30MSRB-00":0.5,"30MET2-00":2,"30INMU-00":0.5,"30LIS2-00":0.3,"30PLFD-00":2.5,"30SAL6-00":4,"30OVTO-00":1,"30NSLG-00":1,"30PIGM-00":0.2}},
  "POLLITA INICIAL":{ codigo: "20INI1-08", activo: true,  fecha: "19-may",
    insumos: {"30MAIZ-00":600,"30AFSY-00":315,"30COCH-00":15,"30HTR3-00":50,"30PHSB-00":10,"30MSRB-00":0.5,"30MET2-00":2.5,"30INMU-00":0.5,"30LIS2-00":1.6,"30COCI-00":0.5,"30NSLP-00":1,"30SAL6-00":2.5}},
  "RECRÍA":         { codigo: "20REC9-15", activo: true,  fecha: "19-may",
    insumos: {"30MAIZ-00":661,"30AFSY-00":260,"30COCH-00":13,"30HTR3-00":50,"30PHSB-00":9,"30MSRB-00":0.5,"30MET2-00":1,"30INMU-00":0.5,"30LIS2-00":0.3,"30COCI-00":0.4,"30NSLP-00":1,"30SAL6-00":2.5}},
  "PREPOSTURA":     { codigo: "",          activo: true,  fecha: "19-may",
    insumos: {"30MAIZ-00":646,"30AFSY-00":250,"30COCH-00":63,"30HTR3-00":25,"30PHSB-00":9,"30MSRB-00":0.5,"30MET2-00":1,"30INMU-00":0.5,"30LIS2-00":0.3,"30SAL6-00":3,"30NSLG-00":1}},
  "LOLOL":          { codigo: "",          activo: true,  fecha: "19-may",
    insumos: {"30MAIZ-00":562,"30AFSY-00":269,"30COCH-00":105,"30HTR3-00":50,"30PHSB-00":6,"30MSRB-00":0.5,"30MET2-00":2,"30INMU-00":0.5,"30LIS2-00":0.3,"30PLFD-00":2,"30SAL6-00":3,"30NSLG-00":1}},
  "POLLA NUEVA":    { codigo: "",          activo: true,  fecha: "25-ene",
    insumos: {"30MAIZ-00":558,"30AFSY-00":267,"30COCH-00":108,"30HTR3-00":50,"30PHSB-00":7,"30MSRB-00":0.5,"30MET2-00":2,"30INMU-00":0.5,"30LIS2-00":0.3,"30PLFD-00":3,"30NSLP-00":0.5,"30SAL6-00":3,"30NSLG-00":1,"30PIGM-00":0.2}},
  "LAMPA":          { codigo: "",          activo: false, fecha: "13-nov",
    insumos: {"30MAIZ-00":527,"30AFSY-00":315,"30COCH-00":108,"30HTR3-00":25,"30PHSB-00":11,"30MSRB-00":0.5,"30MET2-00":3,"30INMU-00":0.5,"30LIS2-00":1,"30PLFD-00":4,"30NSLP-00":0.5,"30SAL6-00":3.5,"30NSLG-00":1,"30PIGM-00":0.2}},
};

// ──────────────────────────────────────────────
// INICIALIZACIÓN — Crea todas las hojas
// ──────────────────────────────────────────────
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
  cargarStocksMinimos();
  const s1 = ss.getSheetByName("Sheet1") || ss.getSheetByName("Hoja 1") || ss.getSheetByName("Hoja1");
  if (s1 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert("✅ Sistema inicializado correctamente. Todas las hojas creadas.");
}

function getOrCreate(ss, nombre) {
  return ss.getSheetByName(nombre) || ss.insertSheet(nombre);
}

function headerStyle(sheet, row, cols, bgHex) {
  const range = sheet.getRange(row, 1, 1, cols);
  range.setBackground("#" + bgHex).setFontColor("#FFFFFF").setFontWeight("bold")
       .setFontFamily("Arial").setFontSize(10).setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(row, 24);
}

// ──────────────────────────────────────────────
// HOJA: CONFIG
// ──────────────────────────────────────────────
function crearHojaConfig(ss) {
  const ws = getOrCreate(ss, "CONFIG");
  ws.clearContents();
  ws.getRange("A1:B1").merge().setValue("CONFIGURACIÓN DEL SISTEMA")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);

  const config = [
    ["clave", "valor"],
    ["planta", "La Campestre"],
    ["responsable_inventario", "Verónica Gangas"],
    ["admin", "Andrés Lazo"],
    ["password_admin", "campestre2025"],
    ["dias_alerta_stock", "7"],
    ["ultima_actualizacion", new Date().toISOString()],
  ];
  ws.getRange(2, 1, config.length, 2).setValues(config);
  headerStyle(ws, 2, 2, "2D6A4F");
  ws.setColumnWidth(1, 220);
  ws.setColumnWidth(2, 280);
}

// ──────────────────────────────────────────────
// HOJA: MATERIAS_PRIMAS
// ──────────────────────────────────────────────
function crearHojaMateriasPrimas(ss) {
  const ws = getOrCreate(ss, "MATERIAS_PRIMAS");
  ws.clearContents();
  ws.getRange("A1:H1").merge().setValue("MATERIAS PRIMAS — Planta Alimentos La Campestre")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);

  const headers = ["Código","Nombre","Unidad","Grupo","Stock Mín (kg)","Proveedor","Precio $/kg","Activo"];
  ws.getRange(2, 1, 1, headers.length).setValues([headers]);
  headerStyle(ws, 2, headers.length, "2D6A4F");

  const data = MATERIAS_PRIMAS.map(mp => [mp[0], mp[1], mp[2], mp[3], 0, "", 0, "SÍ"]);
  ws.getRange(3, 1, data.length, headers.length).setValues(data);
  ws.getRange(3, 1, data.length, headers.length).setFontFamily("Arial").setFontSize(10);

  ws.setColumnWidth(1, 130);
  ws.setColumnWidth(2, 280);
  ws.setColumnWidth(3, 80);
  ws.setColumnWidth(4, 110);
  ws.setColumnWidth(5, 110);
  ws.setColumnWidth(6, 180);
  ws.setColumnWidth(7, 100);
  ws.setColumnWidth(8, 70);
  ws.setFrozenRows(2);
}

// ──────────────────────────────────────────────
// HOJA: RECETAS
// ──────────────────────────────────────────────
function crearHojaRecetas(ss) {
  const ws = getOrCreate(ss, "RECETAS");
  ws.clearContents();

  const nombresDietas = Object.keys(RECETAS);
  const numCols = 2 + nombresDietas.length;

  ws.getRange(1, 1, 1, numCols).merge()
    .setValue("RECETAS / FÓRMULAS — kg por 1.000 kg de mezcla")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);

  ws.getRange(2, 1).setValue("INSUMO").setBackground("#2D6A4F").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(2, 2).setValue("Código MP").setBackground("#2D6A4F").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  nombresDietas.forEach((nombre, i) => {
    const r = RECETAS[nombre];
    const bg = r.activo ? "#2D6A4F" : "#888888";
    ws.getRange(2, 3+i).setValue(nombre).setBackground(bg).setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  });
  ws.setRowHeight(2, 24);

  ws.getRange(3, 1).setValue("Fecha inicio").setBackground("#95D5B2").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(3, 2).setBackground("#95D5B2");
  nombresDietas.forEach((nombre, i) => {
    ws.getRange(3, 3+i).setValue(RECETAS[nombre].fecha).setBackground("#95D5B2").setHorizontalAlignment("center").setFontWeight("bold");
  });

  ws.getRange(4, 1).setValue("Activo").setBackground("#D8F3DC").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(4, 2).setBackground("#D8F3DC");
  nombresDietas.forEach((nombre, i) => {
    const activo = RECETAS[nombre].activo;
    ws.getRange(4, 3+i).setValue(activo ? "SÍ" : "NO")
      .setBackground(activo ? "#D8F3DC" : "#FFD6D6")
      .setFontColor(activo ? "#006400" : "#CC0000")
      .setFontWeight("bold").setHorizontalAlignment("center");
  });

  let row = 5;
  MATERIAS_PRIMAS.forEach(([cod, nombre]) => {
    let tieneValor = false;
    nombresDietas.forEach(d => { if (RECETAS[d].insumos[cod]) tieneValor = true; });
    if (!tieneValor) return;

    ws.getRange(row, 1).setValue(nombre).setFontWeight("bold").setFontFamily("Arial").setFontSize(10);
    ws.getRange(row, 2).setValue(cod).setFontColor("#555555").setFontFamily("Arial").setFontSize(9);
    nombresDietas.forEach((dieta, i) => {
      const val = RECETAS[dieta].insumos[cod] || "";
      const c = ws.getRange(row, 3+i);
      c.setValue(val).setHorizontalAlignment("center").setFontFamily("Arial").setFontSize(10);
      if (!RECETAS[dieta].activo) c.setFontColor("#AAAAAA");
    });
    ws.setRowHeight(row, 18);
    row++;
  });

  ws.getRange(row, 1).setValue("TOTAL").setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(row, 2).setBackground("#1B4332");
  for (let i = 0; i < nombresDietas.length; i++) {
    const col = 3 + i;
    const letra = columnToLetter(col);
    ws.getRange(row, col)
      .setFormula(`=SUM(${letra}5:${letra}${row-1})`)
      .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  }
  ws.setRowHeight(row, 22);

  ws.setColumnWidth(1, 240);
  ws.setColumnWidth(2, 140);
  for (let i = 0; i < nombresDietas.length; i++) ws.setColumnWidth(3+i, 110);
  ws.setFrozenRows(4);
}

// ──────────────────────────────────────────────
// HOJA: CONTEOS_FISICOS
// ──────────────────────────────────────────────
function crearHojaConteosFisicos(ss) {
  const ws = getOrCreate(ss, "CONTEOS_FISICOS");
  ws.clearContents();
  ws.getRange("A1:H1").merge().setValue("CONTEOS FÍSICOS — Registro Verónica Gangas")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);

  const headers = ["ID","Fecha","Hora","Código MP","Nombre MP","Cantidad (kg/unidad)","Responsable","Observaciones"];
  ws.getRange(2, 1, 1, headers.length).setValues([headers]);
  headerStyle(ws, 2, headers.length, "2D6A4F");

  const widths = [60, 110, 80, 120, 250, 150, 160, 220];
  widths.forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

// ──────────────────────────────────────────────
// HOJA: STOCK_ACTUAL
// ──────────────────────────────────────────────
function crearHojaStockActual(ss) {
  const ws = getOrCreate(ss, "STOCK_ACTUAL");
  ws.clearContents();
  ws.getRange("A1:I1").merge().setValue("STOCK ACTUAL — Actualizado automáticamente desde conteos")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);

  const headers = ["Código MP","Nombre","Stock (kg)","Stock Mín (kg)","Consumo Diario (kg)","Días de Stock","Estado","Último Conteo","Alerta"];
  ws.getRange(2, 1, 1, headers.length).setValues([headers]);
  headerStyle(ws, 2, headers.length, "2D6A4F");

  MATERIAS_PRIMAS.forEach(([cod, nombre, unidad, grupo], i) => {
    if (grupo === "Envases") return;
    const row = i + 3;
    ws.getRange(row, 1).setValue(cod);
    ws.getRange(row, 2).setValue(nombre);
    ws.getRange(row, 3).setValue(0).setNote("Se actualiza automáticamente al registrar conteo físico");
    ws.getRange(row, 4).setValue(0).setNote("Completar manualmente: stock mínimo de seguridad");
    ws.getRange(row, 5).setValue(0).setNote("Calculado automáticamente desde Planificación");
    ws.getRange(row, 6).setValue("N/D").setNote("Calculado automáticamente desde Planificación");
    ws.getRange(row, 7).setValue("SIN STOCK").setNote("Calculado automáticamente por GAS");
    ws.getRange(row, 8).setValue("").setNote("Se actualiza automáticamente");
    ws.getRange(row, 9).setFormula(`=IF(AND(F${row}<>"N/D",F${row}<7),"⚠ REPONER","")`);
    ws.getRange(row, 1, 1, 9).setFontFamily("Arial").setFontSize(10);
    ws.setRowHeight(row, 18);
  });

  const widths = [130, 260, 100, 110, 140, 110, 110, 140, 110];
  widths.forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

// ──────────────────────────────────────────────
// HOJA: ORDENES_COMPRA
// ──────────────────────────────────────────────
function crearHojaOrdenes(ss) {
  const ws = getOrCreate(ss, "ORDENES_COMPRA");
  ws.clearContents();
  ws.getRange("A1:L1").merge().setValue("ÓRDENES DE COMPRA — Planta Alimentos La Campestre")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);

  const headers = ["N° OC","Fecha OC","Código MP","Nombre MP","Cantidad (kg)","Precio Unit ($)","Total ($)","Proveedor","Fecha Entrega Est.","Estado","Fecha Recepción","Obs."];
  ws.getRange(2, 1, 1, headers.length).setValues([headers]);
  headerStyle(ws, 2, headers.length, "2D6A4F");

  const widths = [80, 110, 120, 240, 110, 110, 110, 200, 130, 110, 130, 200];
  widths.forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

// ──────────────────────────────────────────────
// HOJA: PROYECCIONES
// ──────────────────────────────────────────────
function crearHojaProyecciones(ss) {
  const ws = getOrCreate(ss, "PROYECCIONES");
  ws.clearContents();
  ws.getRange("A1:G1").merge().setValue("PROYECCIONES DE CONSUMO — Actualizar producción diaria (kg/día por dieta)")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);

  ws.getRange("A2:G2").merge().setValue("▶ PRODUCCIÓN DIARIA POR DIETA (ingrese kg producidos por día)")
    .setBackground("#FFF3CD").setFontWeight("bold").setFontSize(10);

  const hProd = ["Dieta","Código","kg/día","kg/semana","kg/mes","Activo","Última actualización"];
  ws.getRange(3, 1, 1, hProd.length).setValues([hProd]);
  headerStyle(ws, 3, hProd.length, "2D6A4F");

  let rowProd = 4;
  Object.entries(RECETAS).filter(([,v]) => v.activo).forEach(([nombre, v]) => {
    ws.getRange(rowProd, 1).setValue(nombre).setFontWeight("bold");
    ws.getRange(rowProd, 2).setValue(v.codigo);
    ws.getRange(rowProd, 3).setValue(0).setBackground("#FFF3CD").setNote("Ingrese kg producidos por día con esta dieta");
    ws.getRange(rowProd, 4).setFormula(`=C${rowProd}*7`);
    ws.getRange(rowProd, 5).setFormula(`=C${rowProd}*30`);
    ws.getRange(rowProd, 6).setValue("SÍ").setFontColor("#006400").setFontWeight("bold");
    ws.getRange(rowProd, 1, 1, 7).setFontFamily("Arial").setFontSize(10);
    ws.setRowHeight(rowProd, 18);
    rowProd++;
  });

  const sepRow = rowProd + 1;
  ws.getRange(sepRow, 1, 1, 7).merge().setValue("▶ CONSUMO ESTIMADO DE MATERIAS PRIMAS")
    .setBackground("#2D6A4F").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  ws.setRowHeight(sepRow, 26);

  const hCons = ["Código MP","Nombre MP","Cons. Diario (kg)","Cons. Semanal (kg)","Cons. Mensual (kg)","Stock Actual (kg)","Días de Stock"];
  ws.getRange(sepRow+1, 1, 1, hCons.length).setValues([hCons]);
  headerStyle(ws, sepRow+1, hCons.length, "2D6A4F");

  const mpsConsumo = MATERIAS_PRIMAS.filter(([,, , g]) => g !== "Envases");
  mpsConsumo.forEach(([cod, nombre], i) => {
    const row = sepRow + 2 + i;
    ws.getRange(row, 1).setValue(cod);
    ws.getRange(row, 2).setValue(nombre);

    let formula = "=";
    const terminos = [];
    let prodRow = 4;
    Object.entries(RECETAS).filter(([,v]) => v.activo).forEach(([, v]) => {
      const proporcion = v.insumos[cod] || 0;
      if (proporcion > 0) terminos.push(`(PROYECCIONES!C${prodRow}*${proporcion}/1000)`);
      prodRow++;
    });
    formula += terminos.length > 0 ? terminos.join("+") : "0";

    ws.getRange(row, 3).setFormula(formula);
    ws.getRange(row, 4).setFormula(`=C${row}*7`);
    ws.getRange(row, 5).setFormula(`=C${row}*30`);
    ws.getRange(row, 6).setFormulaR1C1('=IFERROR(VLOOKUP(RC1,STOCK_ACTUAL!C1:C3,3,FALSE),0)');
    ws.getRange(row, 7).setFormulaR1C1('=IFERROR(IF(RC3>0,ROUND(RC6/RC3,0),"N/D"),"N/D")');
    ws.getRange(row, 1, 1, 7).setFontFamily("Arial").setFontSize(10);
    ws.setRowHeight(row, 18);
  });

  const widths = [130, 260, 130, 130, 130, 130, 110];
  widths.forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(3);
}

// ──────────────────────────────────────────────
// ROUTER HTTP — doGet / doPost
// ──────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action || "";
  let result;
  try {
    switch (action) {
      case "getMateriasPrimas":    result = getMateriasPrimas();                          break;
      case "getStockActual":       result = getStockActual();                             break;
      case "getOrdenes":           result = getOrdenes();                                 break;
      case "getDashboard":         result = getDashboard();                               break;
      case "getRecetas":           result = getRecetas();                                 break;
      case "guardarRecetas":       result = guardarRecetas(e.parameter);                  break;
      case "registrarConteo":      result = registrarConteo(e.parameter);                 break;
      case "guardarOrden":         result = guardarOrden(e.parameter);                    break;
      case "guardarPlanificacion": result = guardarPlanificacion(JSON.parse(decodeURIComponent(e.parameter.payload||"{}"))); break;
      case "getPlanificacion":     result = getPlanificacion(e.parameter);                break;
      case "getConteosDelDia":     result = getConteosDelDia(e.parameter.fecha);          break;
      default: result = { ok: true, msg: "Sistema activo" };
    }
  } catch(err) {
    result = { ok: false, error: err.message };
  }
  const cb  = e.parameter.callback;
  const out = JSON.stringify(result);
  return ContentService.createTextOutput(cb ? cb + "(" + out + ")" : out)
    .setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

// ──────────────────────────────────────────────
// FUNCIONES DE LECTURA
// ──────────────────────────────────────────────
function getMateriasPrimas() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("MATERIAS_PRIMAS");
  const data = ws.getRange(3, 1, ws.getLastRow()-2, 8).getValues();
  return {
    ok: true,
    data: data.filter(r => r[0]).map(r => ({
      codigo: r[0], nombre: r[1], unidad: r[2], grupo: r[3],
      stock_min: r[4], proveedor: r[5], precio: r[6], activo: r[7]
    }))
  };
}

// ── Calcula consumo diario promedio de cada MP
//    usando el plan de los próximos 7 días desde hoy
function calcularConsumosDiariosDesdeplan() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("PLANIFICACION");
  if (!ws || ws.getLastRow() < 3) return {};

  const tz    = "America/Santiago";
  const hoy   = new Date();
  const hasta = new Date(hoy); hasta.setDate(hasta.getDate() + 7);
  const hoyStr   = Utilities.formatDate(hoy,   tz, "yyyy-MM-dd");
  const hastaStr = Utilities.formatDate(hasta,  tz, "yyyy-MM-dd");

  const rows = ws.getRange(3, 1, ws.getLastRow() - 2, 3).getValues();

  // Sumar kg_dia por dieta y contar fechas distintas con producción
  const planSum  = {};
  const fechaSet = new Set();
  rows.filter(r => r[0] && r[2] > 0).forEach(r => {
    const f = r[0];
    if (f >= hoyStr && f <= hastaStr) {
      fechaSet.add(f);
      planSum[r[1]] = (planSum[r[1]] || 0) + parseFloat(r[2]);
    }
  });

  const numDias = Math.max(fechaSet.size, 1);

  // Usar recetas desde la hoja (con fallback al constante hardcodeado)
  const recetasRes = getRecetas();
  const recetasViva = recetasRes.ok && Object.keys(recetasRes.data).length
    ? recetasRes.data
    : Object.fromEntries(Object.entries(RECETAS).map(([k,v]) => [k, { activo: v.activo, fecha: v.fecha, insumos: v.insumos }]));

  // Consumo diario promedio por MP = Σ(kg_planificados_dieta / numDias × proporción_MP / 1000)
  const consumos = {};
  Object.entries(recetasViva).forEach(([dieta, receta]) => {
    const kgDia = (planSum[dieta] || 0) / numDias;
    if (kgDia <= 0) return;
    Object.entries(receta.insumos || {}).forEach(([cod, prop]) => {
      consumos[cod] = (consumos[cod] || 0) + kgDia * (prop / 1000);
    });
  });

  return consumos;
}

function getStockActual() {
  const ss   = SpreadsheetApp.openById(SHEET_ID);
  const ws   = ss.getSheetByName("STOCK_ACTUAL");
  const last = ws.getLastRow();
  if (last < 3) return { ok: true, ts: new Date().toISOString(), data: [] };

  const data    = ws.getRange(3, 1, last - 2, 9).getValues();
  const consumos = calcularConsumosDiariosDesdeplan();

  return {
    ok: true,
    ts: new Date().toISOString(),
    data: data.filter(r => r[0]).map(r => {
      const stock    = parseFloat(r[2]) || 0;
      const stockMin = parseFloat(r[3]) || 0;
      const consumoD = Math.round((consumos[r[0]] || 0) * 10) / 10;
      const diasStock = consumoD > 0 ? Math.round(stock / consumoD * 10) / 10 : "N/D";

      let estado;
      if (stock === 0)          estado = "SIN STOCK";
      else if (stock < stockMin)           estado = "CRÍTICO";
      else if (stock < stockMin * 1.5)     estado = "BAJO";
      else                                 estado = "OK";

      return {
        codigo:         r[0],
        nombre:         r[1],
        stock,
        stock_min:      stockMin,
        consumo_diario: consumoD,
        dias_stock:     diasStock,
        estado,
        ultimo_conteo:  r[7] ? r[7].toString() : "",
        alerta:         diasStock !== "N/D" && diasStock < 7 ? "⚠ REPONER" : "",
      };
    })
  };
}

function getOrdenes() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("ORDENES_COMPRA");
  const last = ws.getLastRow();
  if (last < 3) return { ok: true, data: [] };
  const data = ws.getRange(3, 1, last-2, 12).getValues();
  return {
    ok: true,
    data: data.filter(r => r[0]).map(r => ({
      noc: r[0], fecha: r[1]?.toString(), codigo: r[2], nombre: r[3],
      cantidad: r[4], precio: r[5], total: r[6], proveedor: r[7],
      fecha_entrega: r[8]?.toString(), estado: r[9], fecha_recepcion: r[10]?.toString(), obs: r[11]
    }))
  };
}

// ──────────────────────────────────────────────
// RECETAS — leer y escribir desde la hoja
// ──────────────────────────────────────────────
function getRecetas() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("RECETAS");
  if (!ws) return { ok: false, error: "Hoja RECETAS no encontrada" };

  const lastCol = ws.getLastColumn();
  const lastRow = ws.getLastRow();
  if (lastRow < 5) return { ok: true, data: {} };

  const allData = ws.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const headersRow = allData[0]; // row 2: INSUMO | Código MP | dieta1 | dieta2 ...
  const datesRow   = allData[1]; // row 3: fechas
  const activoRow  = allData[2]; // row 4: SÍ/NO
  const ingRows    = allData.slice(3); // rows 5+

  const dietNames = headersRow.slice(2).filter(n => n !== "");
  const recetas = {};
  dietNames.forEach((nombre, i) => {
    recetas[nombre] = {
      activo: activoRow[2 + i] === "SÍ",
      fecha:  String(datesRow[2 + i] || ""),
      insumos: {}
    };
  });

  ingRows.forEach(row => {
    const cod = String(row[1] || "").trim();
    if (!cod || row[0] === "TOTAL") return;
    dietNames.forEach((nombre, i) => {
      const val = parseFloat(row[2 + i]);
      if (val > 0) recetas[nombre].insumos[cod] = val;
    });
  });

  return { ok: true, data: recetas };
}

function guardarRecetas(body) {
  let recetas;
  try {
    recetas = JSON.parse(decodeURIComponent(body.payload || "{}"));
  } catch(e) {
    return { ok: false, error: "JSON inválido: " + e.message };
  }
  if (!recetas || typeof recetas !== "object") return { ok: false, error: "Datos inválidos" };

  const ss = SpreadsheetApp.openById(SHEET_ID);
  escribirHojaRecetas(ss, recetas);
  SpreadsheetApp.flush();
  return { ok: true, msg: "Recetas actualizadas", n: Object.keys(recetas).length };
}

function escribirHojaRecetas(ss, recetasObj) {
  const ws = getOrCreate(ss, "RECETAS");
  ws.clearContents();

  const nombresDietas = Object.keys(recetasObj);
  if (!nombresDietas.length) return;
  const numCols = 2 + nombresDietas.length;

  ws.getRange(1, 1, 1, numCols).merge()
    .setValue("RECETAS / FÓRMULAS — kg por 1.000 kg de mezcla")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);

  ws.getRange(2, 1).setValue("INSUMO").setBackground("#2D6A4F").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(2, 2).setValue("Código MP").setBackground("#2D6A4F").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  nombresDietas.forEach((nombre, i) => {
    const bg = recetasObj[nombre].activo ? "#2D6A4F" : "#888888";
    ws.getRange(2, 3+i).setValue(nombre).setBackground(bg).setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  });
  ws.setRowHeight(2, 24);

  ws.getRange(3, 1).setValue("Fecha inicio").setBackground("#95D5B2").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(3, 2).setBackground("#95D5B2");
  nombresDietas.forEach((nombre, i) => {
    ws.getRange(3, 3+i).setValue(recetasObj[nombre].fecha || "").setBackground("#95D5B2").setHorizontalAlignment("center").setFontWeight("bold");
  });

  ws.getRange(4, 1).setValue("Activo").setBackground("#D8F3DC").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(4, 2).setBackground("#D8F3DC");
  nombresDietas.forEach((nombre, i) => {
    const activo = recetasObj[nombre].activo;
    ws.getRange(4, 3+i).setValue(activo ? "SÍ" : "NO")
      .setBackground(activo ? "#D8F3DC" : "#FFD6D6")
      .setFontColor(activo ? "#006400" : "#CC0000")
      .setFontWeight("bold").setHorizontalAlignment("center");
  });

  // Collect codes: first from MATERIAS_PRIMAS order, then any extras
  const allCods = [];
  MATERIAS_PRIMAS.forEach(([cod]) => {
    let tieneValor = false;
    nombresDietas.forEach(d => { if ((recetasObj[d].insumos || {})[cod]) tieneValor = true; });
    if (tieneValor) allCods.push(cod);
  });
  nombresDietas.forEach(d => {
    Object.keys(recetasObj[d].insumos || {}).forEach(cod => {
      if (!allCods.includes(cod)) allCods.push(cod);
    });
  });

  let row = 5;
  allCods.forEach(cod => {
    const mp = MATERIAS_PRIMAS.find(m => m[0] === cod);
    const nombre = mp ? mp[1] : cod;
    ws.getRange(row, 1).setValue(nombre).setFontWeight("bold").setFontFamily("Arial").setFontSize(10);
    ws.getRange(row, 2).setValue(cod).setFontColor("#555555").setFontFamily("Arial").setFontSize(9);
    nombresDietas.forEach((dieta, i) => {
      const val = (recetasObj[dieta].insumos || {})[cod] || "";
      const c = ws.getRange(row, 3+i);
      c.setValue(val).setHorizontalAlignment("center").setFontFamily("Arial").setFontSize(10);
      if (!recetasObj[dieta].activo) c.setFontColor("#AAAAAA");
    });
    ws.setRowHeight(row, 18);
    row++;
  });

  ws.getRange(row, 1).setValue("TOTAL").setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(row, 2).setBackground("#1B4332");
  for (let i = 0; i < nombresDietas.length; i++) {
    const col = 3 + i;
    const letra = columnToLetter(col);
    ws.getRange(row, col)
      .setFormula(`=SUM(${letra}5:${letra}${row-1})`)
      .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  }
  ws.setRowHeight(row, 22);
  ws.setColumnWidth(1, 240);
  ws.setColumnWidth(2, 140);
  for (let i = 0; i < nombresDietas.length; i++) ws.setColumnWidth(3+i, 110);
  ws.setFrozenRows(4);
}

function getDashboard() {
  const stock   = getStockActual();
  const ordenes = getOrdenes();
  const criticos    = stock.data.filter(m => m.estado === "CRÍTICO" || m.estado === "SIN STOCK");
  const pendientes  = ordenes.data.filter(o => o.estado === "PENDIENTE");
  return {
    ok: true,
    ts: new Date().toISOString(),
    resumen: {
      total_mps:    stock.data.length,
      criticos:     criticos.length,
      sin_stock:    stock.data.filter(m => m.estado === "SIN STOCK").length,
      oc_pendientes: pendientes.length,
    },
    alertas:           criticos,
    stock:             stock.data,
    ordenes_pendientes: pendientes,
  };
}

function getProyecciones() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("PROYECCIONES");
  const last = ws.getLastRow();
  if (last < 5) return { ok: true, data: [] };
  return { ok: true, data: ws.getDataRange().getValues() };
}

// ──────────────────────────────────────────────
// getConteosDelDia — para Control Diario
// Devuelve todos los conteos físicos de una fecha (yyyy-MM-dd)
// Hoja CONTEOS_FISICOS: ID | Fecha | Hora | Código MP | Nombre MP | Cantidad | Responsable | Obs
// ──────────────────────────────────────────────
function getConteosDelDia(fecha) {
  if (!fecha) return { ok: false, error: "Falta parámetro fecha" };

  const ss   = SpreadsheetApp.openById(SHEET_ID);
  const ws   = ss.getSheetByName("CONTEOS_FISICOS");
  const last = ws.getLastRow();
  if (last < 3) return { ok: true, data: [] };

  const data = ws.getRange(3, 1, last - 2, 8).getValues();

  const resultado = data
    .filter(r => r[0] && r[1])
    .filter(r => {
      // Columna B (índice 1) es la Fecha — puede ser Date o string
      const f = Utilities.formatDate(
        r[1] instanceof Date ? r[1] : new Date(r[1]),
        "America/Santiago",
        "yyyy-MM-dd"
      );
      return f === fecha;
    })
    .map(r => ({
      id:          r[0],
      codigo:      r[3],
      nombre:      r[4],
      cantidad:    parseFloat(r[5]) || 0,
      responsable: r[6],
      obs:         r[7],
      // ts_local reconstruido para que el frontend lo pueda ordenar
      ts_local: Utilities.formatDate(
        r[1] instanceof Date ? r[1] : new Date(r[1]),
        "America/Santiago",
        "yyyy-MM-dd"
      ) + "T" + (r[2] || "00:00"),
    }));

  return { ok: true, data: resultado };
}

// ──────────────────────────────────────────────
// FUNCIONES DE ESCRITURA
// ──────────────────────────────────────────────
function registrarConteo(body) {
  const { codigo, nombre, cantidad, responsable, obs } = body;
  if (!codigo || cantidad === undefined) return { ok: false, error: "Faltan campos: codigo, cantidad" };

  const ss        = SpreadsheetApp.openById(SHEET_ID);
  const wsConteos = ss.getSheetByName("CONTEOS_FISICOS");
  const wsStock   = ss.getSheetByName("STOCK_ACTUAL");

  const lastRow = wsConteos.getLastRow();
  const id      = lastRow > 2 ? (wsConteos.getRange(lastRow, 1).getValue() + 1) : 1;
  const ahora   = new Date();

  wsConteos.appendRow([
    id,
    Utilities.formatDate(ahora, "America/Santiago", "yyyy-MM-dd"),
    Utilities.formatDate(ahora, "America/Santiago", "HH:mm"),
    codigo, nombre, cantidad, responsable || "Verónica Gangas", obs || ""
  ]);

  const stockData = wsStock.getRange(3, 1, wsStock.getLastRow()-2, 9).getValues();
  const idx = stockData.findIndex(r => r[0] === codigo);
  if (idx >= 0) {
    const stockRow = idx + 3;
    wsStock.getRange(stockRow, 3).setValue(cantidad);
    wsStock.getRange(stockRow, 8).setValue(Utilities.formatDate(ahora, "America/Santiago", "yyyy-MM-dd HH:mm"));
  }

  SpreadsheetApp.flush();
  return { ok: true, id: id, ts: ahora.toISOString(), msg: `Conteo registrado para ${nombre}: ${cantidad} kg` };
}

function guardarOrden(body) {
  const ss      = SpreadsheetApp.openById(SHEET_ID);
  const ws      = ss.getSheetByName("ORDENES_COMPRA");
  const lastRow = ws.getLastRow();
  const noc     = `OC-${String(lastRow - 1).padStart(3,"0")}`;
  const ahora   = new Date();
  ws.appendRow([
    noc,
    Utilities.formatDate(ahora, "America/Santiago", "yyyy-MM-dd"),
    body.codigo, body.nombre, body.cantidad, body.precio || 0,
    (body.cantidad || 0) * (body.precio || 0),
    body.proveedor || "", body.fecha_entrega || "",
    "PENDIENTE", "", body.obs || ""
  ]);
  SpreadsheetApp.flush();
  return { ok: true, noc: noc, msg: `Orden ${noc} creada` };
}

function actualizarConfig(body) {
  const ss   = SpreadsheetApp.openById(SHEET_ID);
  const ws   = ss.getSheetByName("CONFIG");
  const data = ws.getRange(3, 1, ws.getLastRow()-2, 2).getValues();
  data.forEach((row, i) => {
    if (body[row[0]] !== undefined) ws.getRange(i+3, 2).setValue(body[row[0]]);
  });
  return { ok: true, msg: "Configuración actualizada" };
}

// ──────────────────────────────────────────────
// STOCKS MÍNIMOS — 4 días producción base
// ──────────────────────────────────────────────
const STOCKS_MINIMOS = {
  "30MAIZ-00":  22936,
  "30AFSY-00":  11228,
  "30COCH-00":  3148,
  "30HTR3-00":  2000,
  "30PHSB-00":  288,
  "30MSRB-00":  20,
  "30MET2-00":  100,
  "30INMU-00":  20,
  "30LIS2-00":  33,
  "30PLFD-00":  56,
  "30COCI-00":  6,
  "30NSLP-00":  26,
  "30NSLG-00":  28,
  "30SAL6-00":  142,
  "30OVTO-00":  28,
  "30PIGM-00":  6,
};

function cargarStocksMinimos() {
  const ss   = SpreadsheetApp.openById(SHEET_ID);
  const ws   = ss.getSheetByName("STOCK_ACTUAL");
  const data = ws.getRange(3, 1, ws.getLastRow()-2, 4).getValues();
  data.forEach((row, i) => {
    const min = STOCKS_MINIMOS[row[0]];
    if (min !== undefined) ws.getRange(i+3, 4).setValue(min);
  });
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert("✅ Stocks mínimos cargados (base: 4 días P1+Inicial)");
}

// ──────────────────────────────────────────────
// HOJA: PLANIFICACION
// ──────────────────────────────────────────────
function crearHojaPlanificacion(ss) {
  const ws = getOrCreate(ss, "PLANIFICACION");
  ws.clearContents();
  ws.getRange("A1:D1").merge().setValue("PLANIFICACIÓN DE PRODUCCIÓN — kg/día por dieta")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  const headers = ["Fecha","Dieta","kg_dia","Guardado"];
  ws.getRange(2,1,1,4).setValues([headers]);
  headerStyle(ws, 2, 4, "2D6A4F");
  ws.setColumnWidth(1, 120);
  ws.setColumnWidth(2, 180);
  ws.setColumnWidth(3, 100);
  ws.setColumnWidth(4, 160);
  ws.setFrozenRows(2);
}

function guardarPlanificacion(body) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let ws    = ss.getSheetByName("PLANIFICACION");
  if (!ws) { crearHojaPlanificacion(ss); ws = ss.getSheetByName("PLANIFICACION"); }

  const dias = body.dias || [];
  if (!dias.length) return { ok: false, error: "Sin datos" };

  const ahora  = Utilities.formatDate(new Date(), "America/Santiago", "yyyy-MM-dd HH:mm");
  const fechas = [...new Set(dias.map(d => d.fecha))];

  const last = ws.getLastRow();
  if (last > 2) {
    const data        = ws.getRange(3, 1, last-2, 2).getValues();
    const rowsToDelete = [];
    data.forEach((row, i) => { if (fechas.includes(row[0])) rowsToDelete.push(i+3); });
    for (let i = rowsToDelete.length-1; i >= 0; i--) ws.deleteRow(rowsToDelete[i]);
  }

  const rows = dias.filter(d => d.kg_dia > 0).map(d => [d.fecha, d.dieta, d.kg_dia, ahora]);
  if (rows.length) ws.getRange(ws.getLastRow()+1, 1, rows.length, 4).setValues(rows);

  SpreadsheetApp.flush();
  return { ok: true, msg: `${rows.length} entradas guardadas`, ts: ahora };
}

function getPlanificacion(body) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("PLANIFICACION");
  if (!ws || ws.getLastRow() < 3) return { ok: true, data: [] };

  const data  = ws.getRange(3, 1, ws.getLastRow()-2, 3).getValues();
  const desde = body && body.desde ? body.desde : null;
  const hasta = body && body.hasta ? body.hasta : null;

  const resultado = data
    .filter(r => r[0] && r[2] > 0)
    .filter(r => {
      if (desde && r[0] < desde) return false;
      if (hasta && r[0] > hasta) return false;
      return true;
    })
    .map(r => ({ fecha: r[0], dieta: r[1], kg_dia: r[2] }));

  return { ok: true, data: resultado };
}

// ──────────────────────────────────────────────
// UTILIDADES
// ──────────────────────────────────────────────
function columnToLetter(col) {
  let letter = "";
  while (col > 0) {
    const rem = (col - 1) % 26;
    letter    = String.fromCharCode(65 + rem) + letter;
    col       = Math.floor((col - 1) / 26);
  }
  return letter;
}
