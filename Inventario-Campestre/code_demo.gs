// ============================================================
// BACKEND DEMO — Sistema Inventario Planta de Alimentos
// Datos genéricos para presentación comercial
//
// SETUP:
//   1. Crear Google Sheet nuevo (vacío)
//   2. Cambiar SHEET_ID por el ID del Sheet creado
//   3. Apps Script > Desplegar > Web App > "Anyone"
//   4. Correr inicializarDemo() una sola vez para poblar datos
//   5. Pegar la URL del deploy en config/demo.json → backendUrl
// ============================================================

const SHEET_ID = "REEMPLAZAR_CON_ID_DEL_SHEET_DEMO";

// ──────────────────────────────────────────────
// DATOS MAESTROS — genéricos, sin marca
// ──────────────────────────────────────────────
const MATERIAS_PRIMAS = [
  ["MP-MAIZ-00", "MAÍZ GRANO",                  "kg",     "Energéticos"],
  ["MP-TRGO-00", "TRIGO",                        "kg",     "Energéticos"],
  ["MP-SOYA-00", "PELLET DE SOYA",               "kg",     "Proteínas"],
  ["MP-CARC-00", "CARBONATO DE CALCIO",          "kg",     "Minerales"],
  ["MP-FODB-00", "FOSFATO BICÁLCICO",            "kg",     "Minerales"],
  ["MP-SALN-00", "SAL COMÚN",                    "kg",     "Minerales"],
  ["MP-METD-00", "METIONINA DL",                 "kg",     "Aminoácidos"],
  ["MP-LISH-00", "LISINA HCL 98%",               "kg",     "Aminoácidos"],
  ["MP-NUVP-00", "NÚCLEO VITAMÍNICO PONEDORA",   "kg",     "Núcleos"],
  ["MP-NUVI-00", "NÚCLEO VITAMÍNICO POLLITA",    "kg",     "Núcleos"],
  ["MP-SEQM-00", "SECUESTRANTE MICOTOXINAS",     "kg",     "Aditivos"],
  ["MP-PIGX-00", "PIGMENTO XANTOFILA",           "kg",     "Aditivos"],
  ["MP-COCA-00", "COCCIDIOSTATO",                "kg",     "Medicamentos"],
  ["MP-SAC1-00", "SACO 50KG BLANCO",             "unidad", "Envases"],
  ["MP-SAC2-00", "SACO 50KG AZUL",               "unidad", "Envases"],
];

const RECETAS = {
  "PONEDORA INICIO":  { codigo: "P-INI", activo: true, fecha: "01-mar",
    insumos: {"MP-MAIZ-00":545,"MP-SOYA-00":260,"MP-TRGO-00":80,"MP-CARC-00":68,"MP-FODB-00":9,
              "MP-METD-00":3,"MP-LISH-00":1,"MP-SALN-00":3,"MP-NUVP-00":2,"MP-SEQM-00":0.5}},
  "PONEDORA PICO":    { codigo: "P-PIC", activo: true, fecha: "01-mar",
    insumos: {"MP-MAIZ-00":555,"MP-SOYA-00":235,"MP-TRGO-00":75,"MP-CARC-00":96,"MP-FODB-00":5,
              "MP-METD-00":2.5,"MP-LISH-00":0.5,"MP-SALN-00":3.5,"MP-NUVP-00":2,"MP-SEQM-00":0.5,"MP-PIGX-00":0.5}},
  "PONEDORA FIN":     { codigo: "P-FIN", activo: true, fecha: "01-mar",
    insumos: {"MP-MAIZ-00":570,"MP-SOYA-00":215,"MP-TRGO-00":85,"MP-CARC-00":90,"MP-FODB-00":4,
              "MP-METD-00":2,"MP-LISH-00":0.4,"MP-SALN-00":3,"MP-NUVP-00":2,"MP-SEQM-00":0.5,"MP-PIGX-00":0.3}},
  "POLLITA INICIO":   { codigo: "C-INI", activo: true, fecha: "01-mar",
    insumos: {"MP-MAIZ-00":580,"MP-SOYA-00":310,"MP-CARC-00":18,"MP-FODB-00":13,"MP-METD-00":3,
              "MP-LISH-00":2,"MP-SALN-00":2.5,"MP-NUVI-00":2,"MP-COCA-00":0.6,"MP-SEQM-00":0.5}},
  "POLLITA RECRÍA":   { codigo: "C-REC", activo: true, fecha: "01-mar",
    insumos: {"MP-MAIZ-00":640,"MP-SOYA-00":255,"MP-TRGO-00":60,"MP-CARC-00":12,"MP-FODB-00":8,
              "MP-METD-00":1.5,"MP-LISH-00":0.5,"MP-SALN-00":2.5,"MP-NUVI-00":1.5,"MP-SEQM-00":0.5}},
  "PRE-POSTURA":      { codigo: "C-PRE", activo: true, fecha: "01-mar",
    insumos: {"MP-MAIZ-00":620,"MP-SOYA-00":255,"MP-TRGO-00":50,"MP-CARC-00":35,"MP-FODB-00":8,
              "MP-METD-00":1.5,"MP-LISH-00":0.5,"MP-SALN-00":3,"MP-NUVP-00":1.5,"MP-SEQM-00":0.5}},
};

// Stocks mínimos = ~4 días de producción base (2.000 kg/día P-PIC + 500 kg/día P-INI)
const STOCKS_MINIMOS = {
  "MP-MAIZ-00": 20000,
  "MP-TRGO-00": 5000,
  "MP-SOYA-00": 8500,
  "MP-CARC-00": 3000,
  "MP-FODB-00": 350,
  "MP-SALN-00": 550,
  "MP-METD-00": 120,
  "MP-LISH-00": 90,
  "MP-NUVP-00": 260,
  "MP-NUVI-00": 80,
  "MP-SEQM-00": 60,
  "MP-PIGX-00": 18,
  "MP-COCA-00": 25,
};

// ──────────────────────────────────────────────
// INICIALIZACIÓN DEMO
// Correr una vez tras crear el Sheet:
//   inicializarDemo()
// ──────────────────────────────────────────────
function inicializarDemo() {
  inicializarSistema();
  Utilities.sleep(2000);
  cargarDatosDemo();
  SpreadsheetApp.getUi().alert("✅ Demo lista. Abre la URL del deploy en el navegador para verificar.");
}

function cargarDatosDemo() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  _cargarStockDemo(ss);
  _cargarPlanificacionDemo(ss);
  _cargarConteosDemo(ss);
  _cargarOrdenesDemo(ss);
  SpreadsheetApp.flush();
}

function _cargarStockDemo(ss) {
  const ws = ss.getSheetByName("STOCK_ACTUAL");

  // [codigo, stock_actual, stock_min, ultimo_conteo_dias_atras]
  const stockData = [
    ["MP-MAIZ-00", 38500,  20000, 1],
    ["MP-TRGO-00", 11200,   5000, 1],
    ["MP-SOYA-00", 13800,   8500, 1],
    ["MP-CARC-00",  4400,   3000, 2],
    ["MP-FODB-00",   165,    350, 3],  // CRÍTICO
    ["MP-SALN-00",  1050,    550, 2],
    ["MP-METD-00",    95,    120, 3],  // BAJO
    ["MP-LISH-00",   195,     90, 2],
    ["MP-NUVP-00",   415,    260, 1],
    ["MP-NUVI-00",     0,     80, 7],  // SIN STOCK
    ["MP-SEQM-00",    48,     60, 4],  // BAJO
    ["MP-PIGX-00",    32,     18, 3],
    ["MP-COCA-00",    40,     25, 5],
  ];

  const tz  = "America/Santiago";
  const now = new Date();

  const wsData = ws.getRange(3, 1, ws.getLastRow() - 2, 9).getValues();
  stockData.forEach(([cod, stock, min, diasAtras]) => {
    const idx = wsData.findIndex(r => r[0] === cod);
    if (idx < 0) return;
    const row   = idx + 3;
    const fecha = new Date(now); fecha.setDate(fecha.getDate() - diasAtras);
    const fechaStr = Utilities.formatDate(fecha, tz, "yyyy-MM-dd HH:mm");

    ws.getRange(row, 3).setValue(stock);
    ws.getRange(row, 4).setValue(min);
    ws.getRange(row, 8).setValue(fechaStr);

    let estado;
    if (stock === 0)         estado = "SIN STOCK";
    else if (stock < min)    estado = "CRÍTICO";
    else if (stock < min*1.5) estado = "BAJO";
    else                     estado = "OK";
    ws.getRange(row, 7).setValue(estado);
  });
}

function _cargarPlanificacionDemo(ss) {
  const ws  = ss.getSheetByName("PLANIFICACION");
  const tz  = "America/Santiago";
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const ahora = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm");

  const rows = [];
  // 14 días: P-PIC 2.200 kg/día + P-INI 600 kg/día + C-REC 400 kg/día
  for (let i = -3; i <= 10; i++) {
    const d = new Date(hoy); d.setDate(d.getDate() + i);
    if (d.getDay() === 0) continue; // sin producción domingos
    const f = Utilities.formatDate(d, tz, "yyyy-MM-dd");
    rows.push([f, "PONEDORA PICO",   2200, ahora]);
    rows.push([f, "PONEDORA INICIO",  600, ahora]);
    rows.push([f, "POLLITA RECRÍA",   400, ahora]);
  }
  if (rows.length) ws.getRange(ws.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
}

function _cargarConteosDemo(ss) {
  const wsConteos = ss.getSheetByName("CONTEOS_FISICOS");
  const tz  = "America/Santiago";
  const now = new Date();

  const responsable = "Encargado de Bodega";

  // 8 conteos de los últimos 3 días para que el historial no esté vacío
  const conteos = [
    { diasAtras: 0, hora: "09:15", cod: "MP-MAIZ-00", nombre: "Maíz Grano",             cantidad: 38500 },
    { diasAtras: 0, hora: "09:32", cod: "MP-SOYA-00", nombre: "Pellet de Soya",          cantidad: 13800 },
    { diasAtras: 0, hora: "09:45", cod: "MP-FODB-00", nombre: "Fosfato Bicálcico",       cantidad: 165,  obs: "Pendiente reposición urgente" },
    { diasAtras: 1, hora: "08:55", cod: "MP-TRGO-00", nombre: "Trigo",                   cantidad: 11200 },
    { diasAtras: 1, hora: "09:10", cod: "MP-METD-00", nombre: "Metionina DL",            cantidad: 95,   obs: "Stock bajo mínimo" },
    { diasAtras: 1, hora: "09:20", cod: "MP-NUVP-00", nombre: "Núcleo Vitamínico Pon.",  cantidad: 415 },
    { diasAtras: 2, hora: "10:05", cod: "MP-CARC-00", nombre: "Carbonato de Calcio",     cantidad: 4400 },
    { diasAtras: 3, hora: "09:30", cod: "MP-NUVI-00", nombre: "Núcleo Vitamínico Poll.", cantidad: 0,    obs: "Sin stock — no llegó el pedido" },
  ];

  const lastRow = wsConteos.getLastRow();
  let id = lastRow > 2 ? wsConteos.getRange(lastRow, 1).getValue() + 1 : 1;

  conteos.forEach(c => {
    const fecha = new Date(now); fecha.setDate(fecha.getDate() - c.diasAtras);
    const fechaStr = Utilities.formatDate(fecha, tz, "yyyy-MM-dd");
    wsConteos.appendRow([id++, fechaStr, c.hora, c.cod, c.nombre, c.cantidad, responsable, c.obs || ""]);
  });
}

function _cargarOrdenesDemo(ss) {
  const ws   = ss.getSheetByName("ORDENES_COMPRA");
  const tz   = "America/Santiago";
  const ahora = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  const ayer  = Utilities.formatDate(new Date(new Date().setDate(new Date().getDate()-1)), tz, "yyyy-MM-dd");
  const en3   = Utilities.formatDate(new Date(new Date().setDate(new Date().getDate()+3)), tz, "yyyy-MM-dd");
  const en5   = Utilities.formatDate(new Date(new Date().setDate(new Date().getDate()+5)), tz, "yyyy-MM-dd");

  const ordenes = [
    ["OC-001", ayer,  "MP-FODB-00","Fosfato Bicálcico",       2000, 850,  1700000, "Proveedor Minerales SpA", en3, "PENDIENTE", "", "Urgente — stock crítico"],
    ["OC-002", ahora, "MP-NUVI-00","Núcleo Vitamínico Pollita", 500, 4200, 2100000, "Núcleos y Aditivos Ltda", en5, "PENDIENTE", "", ""],
    ["OC-003", ahora, "MP-METD-00","Metionina DL",               300, 2800,  840000, "Aminoácidos Chile",       en5, "PENDIENTE", "", ""],
  ];

  ordenes.forEach(o => ws.appendRow(o));
}

// ──────────────────────────────────────────────
// INICIALIZACIÓN — Crea todas las hojas
// (idéntico a code.gs — no modificar)
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

function crearHojaConfig(ss) {
  const ws = getOrCreate(ss, "CONFIG");
  ws.clearContents();
  ws.getRange("A1:B1").merge().setValue("CONFIGURACIÓN DEL SISTEMA")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  const config = [
    ["clave", "valor"],
    ["planta", "Planta Demo"],
    ["responsable_inventario", "Encargado de Bodega"],
    ["admin", "Andrés Lazo"],
    ["password_admin", "demo2025"],
    ["dias_alerta_stock", "7"],
    ["ultima_actualizacion", new Date().toISOString()],
  ];
  ws.getRange(2, 1, config.length, 2).setValues(config);
  headerStyle(ws, 2, 2, "2D6A4F");
  ws.setColumnWidth(1, 220);
  ws.setColumnWidth(2, 280);
}

function crearHojaMateriasPrimas(ss) {
  const ws = getOrCreate(ss, "MATERIAS_PRIMAS");
  ws.clearContents();
  ws.getRange("A1:H1").merge().setValue("MATERIAS PRIMAS — Planta de Alimentos Demo")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  const headers = ["Código","Nombre","Unidad","Grupo","Stock Mín (kg)","Proveedor","Precio $/kg","Activo"];
  ws.getRange(2, 1, 1, headers.length).setValues([headers]);
  headerStyle(ws, 2, headers.length, "2D6A4F");
  const data = MATERIAS_PRIMAS.map(mp => [mp[0], mp[1], mp[2], mp[3], 0, "", 0, "SÍ"]);
  ws.getRange(3, 1, data.length, headers.length).setValues(data);
  ws.getRange(3, 1, data.length, headers.length).setFontFamily("Arial").setFontSize(10);
  [130, 280, 80, 110, 110, 180, 100, 70].forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

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
    ws.getRange(2, 3+i).setValue(nombre).setBackground(RECETAS[nombre].activo ? "#2D6A4F" : "#888888")
      .setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  });
  ws.setRowHeight(2, 24);
  ws.getRange(3, 1).setValue("Fecha inicio").setBackground("#95D5B2").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(3, 2).setBackground("#95D5B2");
  nombresDietas.forEach((n, i) => ws.getRange(3, 3+i).setValue(RECETAS[n].fecha).setBackground("#95D5B2").setHorizontalAlignment("center").setFontWeight("bold"));
  ws.getRange(4, 1).setValue("Activo").setBackground("#D8F3DC").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(4, 2).setBackground("#D8F3DC");
  nombresDietas.forEach((n, i) => {
    const a = RECETAS[n].activo;
    ws.getRange(4, 3+i).setValue(a ? "SÍ" : "NO").setBackground(a ? "#D8F3DC" : "#FFD6D6")
      .setFontColor(a ? "#006400" : "#CC0000").setFontWeight("bold").setHorizontalAlignment("center");
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
    ws.getRange(row, col).setFormula(`=SUM(${letra}5:${letra}${row-1})`)
      .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  }
  ws.setColumnWidth(1, 240); ws.setColumnWidth(2, 140);
  for (let i = 0; i < nombresDietas.length; i++) ws.setColumnWidth(3+i, 110);
  ws.setFrozenRows(4);
}

function crearHojaConteosFisicos(ss) {
  const ws = getOrCreate(ss, "CONTEOS_FISICOS");
  ws.clearContents();
  ws.getRange("A1:H1").merge().setValue("CONTEOS FÍSICOS — Sistema Demo")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  const headers = ["ID","Fecha","Hora","Código MP","Nombre MP","Cantidad (kg/unidad)","Responsable","Observaciones"];
  ws.getRange(2, 1, 1, headers.length).setValues([headers]);
  headerStyle(ws, 2, headers.length, "2D6A4F");
  [60, 110, 80, 120, 250, 150, 160, 220].forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

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
  MATERIAS_PRIMAS.forEach(([cod, nombre,, grupo], i) => {
    if (grupo === "Envases") return;
    const row = i + 3;
    ws.getRange(row, 1).setValue(cod);
    ws.getRange(row, 2).setValue(nombre);
    ws.getRange(row, 3).setValue(0);
    ws.getRange(row, 4).setValue(0);
    ws.getRange(row, 5).setValue(0);
    ws.getRange(row, 6).setValue("N/D");
    ws.getRange(row, 7).setValue("SIN STOCK");
    ws.getRange(row, 8).setValue("");
    ws.getRange(row, 9).setFormula(`=IF(AND(F${row}<>"N/D",F${row}<7),"⚠ REPONER","")`);
    ws.getRange(row, 1, 1, 9).setFontFamily("Arial").setFontSize(10);
    ws.setRowHeight(row, 18);
  });
  [130, 260, 100, 110, 140, 110, 110, 140, 110].forEach((w, i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

function crearHojaOrdenes(ss) {
  const ws = getOrCreate(ss, "ORDENES_COMPRA");
  ws.clearContents();
  ws.getRange("A1:L1").merge().setValue("ÓRDENES DE COMPRA — Sistema Demo")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  const headers = ["N° OC","Fecha OC","Código MP","Nombre MP","Cantidad (kg)","Precio Unit ($)","Total ($)","Proveedor","Fecha Entrega Est.","Estado","Fecha Recepción","Obs."];
  ws.getRange(2, 1, 1, headers.length).setValues([headers]);
  headerStyle(ws, 2, headers.length, "2D6A4F");
  [80,110,120,240,110,110,110,200,130,110,130,200].forEach((w,i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

function crearHojaProyecciones(ss) {
  const ws = getOrCreate(ss, "PROYECCIONES");
  ws.clearContents();
  ws.getRange("A1:G1").merge().setValue("PROYECCIONES DE CONSUMO")
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
    ws.getRange(rowProd, 3).setValue(0).setBackground("#FFF3CD");
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
  const mpsConsumo = MATERIAS_PRIMAS.filter(([,,, g]) => g !== "Envases");
  mpsConsumo.forEach(([cod, nombre], i) => {
    const row = sepRow + 2 + i;
    ws.getRange(row, 1).setValue(cod);
    ws.getRange(row, 2).setValue(nombre);
    let formula = "=";
    const terminos = [];
    let prodRow = 4;
    Object.entries(RECETAS).filter(([,v]) => v.activo).forEach(([, v]) => {
      const prop = v.insumos[cod] || 0;
      if (prop > 0) terminos.push(`(PROYECCIONES!C${prodRow}*${prop}/1000)`);
      prodRow++;
    });
    formula += terminos.length ? terminos.join("+") : "0";
    ws.getRange(row, 3).setFormula(formula);
    ws.getRange(row, 4).setFormula(`=C${row}*7`);
    ws.getRange(row, 5).setFormula(`=C${row}*30`);
    ws.getRange(row, 6).setFormulaR1C1('=IFERROR(VLOOKUP(RC1,STOCK_ACTUAL!C1:C3,3,FALSE),0)');
    ws.getRange(row, 7).setFormulaR1C1('=IFERROR(IF(RC3>0,ROUND(RC6/RC3,0),"N/D"),"N/D")');
    ws.getRange(row, 1, 1, 7).setFontFamily("Arial").setFontSize(10);
    ws.setRowHeight(row, 18);
  });
  [130,260,130,130,130,130,110].forEach((w,i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(3);
}

function crearHojaPlanificacion(ss) {
  const ws = getOrCreate(ss, "PLANIFICACION");
  ws.clearContents();
  ws.getRange("A1:D1").merge().setValue("PLANIFICACIÓN DE PRODUCCIÓN — kg/día por dieta")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);
  ws.getRange(2,1,1,4).setValues([["Fecha","Dieta","kg_dia","Guardado"]]);
  headerStyle(ws, 2, 4, "2D6A4F");
  [120, 180, 100, 160].forEach((w,i) => ws.setColumnWidth(i+1, w));
  ws.setFrozenRows(2);
}

function cargarStocksMinimos() {
  const ss   = SpreadsheetApp.openById(SHEET_ID);
  const ws   = ss.getSheetByName("STOCK_ACTUAL");
  const data = ws.getRange(3, 1, ws.getLastRow()-2, 4).getValues();
  data.forEach((row, i) => {
    const min = STOCKS_MINIMOS[row[0]];
    if (min !== undefined) ws.getRange(i+3, 4).setValue(min);
  });
  SpreadsheetApp.flush();
}

// ──────────────────────────────────────────────
// ROUTER HTTP — idéntico a code.gs
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
      default: result = { ok: true, msg: "Demo activa" };
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
// FUNCIONES DE LECTURA Y ESCRITURA
// (idénticas a code.gs — leen desde el Sheet)
// ──────────────────────────────────────────────
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
  const tz = "America/Santiago";
  const hoy   = new Date();
  const hasta = new Date(hoy); hasta.setDate(hasta.getDate() + 7);
  const hoyStr   = Utilities.formatDate(hoy,   tz, "yyyy-MM-dd");
  const hastaStr = Utilities.formatDate(hasta,  tz, "yyyy-MM-dd");
  const rows = ws.getRange(3, 1, ws.getLastRow()-2, 3).getValues();
  const planSum = {}; const fechaSet = new Set();
  rows.filter(r => r[0] && r[2] > 0).forEach(r => {
    const f = r[0]; if (f >= hoyStr && f <= hastaStr) { fechaSet.add(f); planSum[r[1]] = (planSum[r[1]] || 0) + parseFloat(r[2]); }
  });
  const numDias = Math.max(fechaSet.size, 1);
  const recetasRes = getRecetas();
  const recetasViva = recetasRes.ok && Object.keys(recetasRes.data).length
    ? recetasRes.data
    : Object.fromEntries(Object.entries(RECETAS).map(([k,v]) => [k, { activo: v.activo, fecha: v.fecha, insumos: v.insumos }]));
  const consumos = {};
  Object.entries(recetasViva).forEach(([dieta, receta]) => {
    const kgDia = (planSum[dieta] || 0) / numDias;
    if (kgDia <= 0) return;
    Object.entries(receta.insumos || {}).forEach(([cod, prop]) => { consumos[cod] = (consumos[cod] || 0) + kgDia * (prop / 1000); });
  });
  return consumos;
}

function getStockActual() {
  const ss   = SpreadsheetApp.openById(SHEET_ID);
  const ws   = ss.getSheetByName("STOCK_ACTUAL");
  const last = ws.getLastRow();
  if (last < 3) return { ok: true, ts: new Date().toISOString(), data: [] };
  const data     = ws.getRange(3, 1, last-2, 9).getValues();
  const consumos = calcularConsumosDiariosDesdeplan();
  return { ok: true, ts: new Date().toISOString(), data: data.filter(r => r[0]).map(r => {
    const stock = parseFloat(r[2]) || 0; const stockMin = parseFloat(r[3]) || 0;
    const consumoD = Math.round((consumos[r[0]] || 0) * 10) / 10;
    const diasStock = consumoD > 0 ? Math.round(stock / consumoD * 10) / 10 : "N/D";
    let estado;
    if (stock === 0) estado = "SIN STOCK";
    else if (stock < stockMin)        estado = "CRÍTICO";
    else if (stock < stockMin * 1.5)  estado = "BAJO";
    else                              estado = "OK";
    return { codigo: r[0], nombre: r[1], stock, stock_min: stockMin, consumo_diario: consumoD,
             dias_stock: diasStock, estado, ultimo_conteo: r[7] ? r[7].toString() : "",
             alerta: diasStock !== "N/D" && diasStock < 7 ? "⚠ REPONER" : "" };
  })};
}

function getOrdenes() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("ORDENES_COMPRA");
  const last = ws.getLastRow();
  if (last < 3) return { ok: true, data: [] };
  const data = ws.getRange(3, 1, last-2, 12).getValues();
  return { ok: true, data: data.filter(r => r[0]).map(r => ({
    noc: r[0], fecha: r[1]?.toString(), codigo: r[2], nombre: r[3],
    cantidad: r[4], precio: r[5], total: r[6], proveedor: r[7],
    fecha_entrega: r[8]?.toString(), estado: r[9], fecha_recepcion: r[10]?.toString(), obs: r[11]
  }))};
}

function getRecetas() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("RECETAS");
  if (!ws) return { ok: false, error: "Hoja RECETAS no encontrada" };
  const lastCol = ws.getLastColumn(); const lastRow = ws.getLastRow();
  if (lastRow < 5 || lastCol < 3) return { ok: true, data: {} };
  const allData   = ws.getRange(2, 1, lastRow-1, lastCol).getValues();
  const headersRow = allData[0]; const datesRow = allData[1];
  const activoRow  = allData[2]; const ingRows  = allData.slice(3);
  const dietNames  = headersRow.slice(2).filter(n => n !== "");
  const recetas = {};
  dietNames.forEach((nombre, i) => {
    recetas[nombre] = { activo: activoRow[2+i] === "SÍ", fecha: String(datesRow[2+i] || ""), insumos: {} };
  });
  ingRows.forEach(row => {
    const cod = String(row[1] || "").trim();
    if (!cod || row[0] === "TOTAL") return;
    dietNames.forEach((nombre, i) => { const val = parseFloat(row[2+i]); if (val > 0) recetas[nombre].insumos[cod] = val; });
  });
  return { ok: true, data: recetas };
}

function guardarRecetas(body) {
  let recetas;
  try { recetas = JSON.parse(decodeURIComponent(body.payload || "{}")); } catch(e) { return { ok: false, error: "JSON inválido" }; }
  if (!recetas || typeof recetas !== "object") return { ok: false, error: "Datos inválidos" };
  guardarRespaldoRecetas(recetas);
  escribirHojaRecetas(recetas);
  return { ok: true, msg: "Recetas actualizadas", n: Object.keys(recetas).length };
}


// ── Respaldo automático de recetas ──────────────
// Cada guardarRecetas() deja un snapshot JSON en la hoja
// RECETAS_HISTORIAL antes de reescribir la hoja RECETAS.
function guardarRespaldoRecetas(recetasObj) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let ws = ss.getSheetByName("RECETAS_HISTORIAL");
    if (!ws) {
      ws = ss.insertSheet("RECETAS_HISTORIAL");
      ws.getRange(1, 1, 1, 4).setValues([["Fecha", "Hora", "N° dietas", "Snapshot JSON"]])
        .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold");
      ws.setColumnWidth(1, 100);
      ws.setColumnWidth(2, 80);
      ws.setColumnWidth(4, 600);
      ws.setFrozenRows(1);
    }
    const ahora = new Date();
    ws.appendRow([
      Utilities.formatDate(ahora, "America/Santiago", "yyyy-MM-dd"),
      Utilities.formatDate(ahora, "America/Santiago", "HH:mm:ss"),
      Object.keys(recetasObj).length,
      JSON.stringify(recetasObj)
    ]);
    // Conservar solo los últimos 50 respaldos (los más antiguos arriba)
    const filas = ws.getLastRow() - 1;
    if (filas > 50) ws.deleteRows(2, filas - 50);
  } catch (e) {
    // El respaldo nunca debe bloquear el guardado principal
    console.error("Respaldo de recetas falló: " + e.message);
  }
}

// ── Restaurar el último respaldo ────────────────
// Ejecutar desde el editor de Apps Script si la hoja
// RECETAS queda vacía o corrupta.
function restaurarUltimoRespaldo() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName("RECETAS_HISTORIAL");
  if (!ws || ws.getLastRow() < 2) throw new Error("No hay respaldos en RECETAS_HISTORIAL");
  const json = ws.getRange(ws.getLastRow(), 4).getValue();
  escribirHojaRecetas(JSON.parse(json));
}

function escribirHojaRecetas(recetasObj) {
  const data = (recetasObj && typeof recetasObj === "object" && Object.keys(recetasObj).length)
               ? recetasObj : RECETAS;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = getOrCreate(ss, "RECETAS");
  ws.clearContents();
  ws.clearFormats();

  const nombresDietas = Object.keys(data);
  if (!nombresDietas.length) return;
  const numCols = 2 + nombresDietas.length;

  // Fila 1: título
  ws.getRange(1, 1, 1, numCols).merge()
    .setValue("RECETAS / FÓRMULAS — kg por 1.000 kg de mezcla")
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold")
    .setFontSize(13).setHorizontalAlignment("center");
  ws.setRowHeight(1, 30);

  // Filas 2-4: cabeceras en batch
  const cabeceraValues = [
    ["INSUMO", "Código MP", ...nombresDietas],
    ["Fecha inicio", "", ...nombresDietas.map(n => data[n].fecha || "")],
    ["Activo",       "", ...nombresDietas.map(n => data[n].activo ? "SÍ" : "NO")]
  ];
  ws.getRange(2, 1, 3, numCols).setValues(cabeceraValues)
    .setFontFamily("Arial").setFontSize(10).setFontWeight("bold").setHorizontalAlignment("center");

  ws.getRange(2, 1, 1, 2).setBackground("#2D6A4F").setFontColor("#FFFFFF");
  nombresDietas.forEach((n, i) => {
    ws.getRange(2, 3+i).setBackground(data[n].activo ? "#2D6A4F" : "#888888").setFontColor("#FFFFFF");
  });
  ws.setRowHeight(2, 24);
  ws.getRange(3, 1, 1, numCols).setBackground("#95D5B2");
  ws.getRange(4, 1, 1, 2).setBackground("#D8F3DC");
  nombresDietas.forEach((n, i) => {
    const a = data[n].activo;
    ws.getRange(4, 3+i).setBackground(a ? "#D8F3DC" : "#FFD6D6").setFontColor(a ? "#006400" : "#CC0000");
  });

  // Recopilar códigos con valores
  const allCods = [];
  MATERIAS_PRIMAS.forEach(([cod]) => {
    if (nombresDietas.some(d => (data[d].insumos||{})[cod])) allCods.push(cod);
  });
  nombresDietas.forEach(d => Object.keys(data[d].insumos||{}).forEach(cod => {
    if (!allCods.includes(cod)) allCods.push(cod);
  }));

  // Insumos en batch
  const ingData = allCods.map(cod => {
    const mp = MATERIAS_PRIMAS.find(m => m[0] === cod);
    return [mp ? mp[1] : cod, cod, ...nombresDietas.map(d => (data[d].insumos||{})[cod] || "")];
  });
  if (ingData.length) {
    ws.getRange(5, 1, ingData.length, numCols).setValues(ingData)
      .setFontFamily("Arial").setFontSize(10).setVerticalAlignment("middle");
    ws.getRange(5, 1, ingData.length, 1).setFontWeight("bold");
    ws.getRange(5, 2, ingData.length, 1).setFontColor("#555555").setFontSize(9);
    ws.getRange(5, 3, ingData.length, nombresDietas.length).setHorizontalAlignment("center");
    nombresDietas.forEach((d, i) => {
      if (!data[d].activo) ws.getRange(5, 3+i, ingData.length, 1).setFontColor("#AAAAAA");
    });
    for (let r = 5; r < 5 + ingData.length; r++) ws.setRowHeight(r, 18);
  }

  // Fila TOTAL con fórmulas
  const totalRow = 5 + ingData.length;
  ws.getRange(totalRow, 1, 1, numCols)
    .setBackground("#1B4332").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  ws.getRange(totalRow, 1).setValue("TOTAL");
  for (let i = 0; i < nombresDietas.length; i++) {
    const letra = columnToLetter(3 + i);
    ws.getRange(totalRow, 3+i).setFormula(`=SUM(${letra}5:${letra}${totalRow-1})`);
  }
  ws.setRowHeight(totalRow, 22);

  // Anchos de columna y formato final
  ws.setColumnWidth(1, 240);
  ws.setColumnWidth(2, 140);
  for (let i = 0; i < nombresDietas.length; i++) ws.setColumnWidth(3+i, 110);
  ws.setFrozenRows(4);
}

function getDashboard() {
  const stock = getStockActual(); const ordenes = getOrdenes();
  const criticos   = stock.data.filter(m => m.estado==="CRÍTICO"||m.estado==="SIN STOCK");
  const pendientes = ordenes.data.filter(o => o.estado==="PENDIENTE");
  return { ok: true, ts: new Date().toISOString(),
    resumen: { total_mps: stock.data.length, criticos: criticos.length,
               sin_stock: stock.data.filter(m=>m.estado==="SIN STOCK").length, oc_pendientes: pendientes.length },
    alertas: criticos, stock: stock.data, ordenes_pendientes: pendientes };
}

function registrarConteo(body) {
  const { codigo, nombre, cantidad, responsable, obs } = body;
  if (!codigo || cantidad === undefined) return { ok: false, error: "Faltan campos: codigo, cantidad" };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const wsConteos = ss.getSheetByName("CONTEOS_FISICOS");
  const wsStock   = ss.getSheetByName("STOCK_ACTUAL");
  const lastRow   = wsConteos.getLastRow();
  const id        = lastRow > 2 ? wsConteos.getRange(lastRow, 1).getValue() + 1 : 1;
  const ahora     = new Date();
  wsConteos.appendRow([id, Utilities.formatDate(ahora,"America/Santiago","yyyy-MM-dd"),
    Utilities.formatDate(ahora,"America/Santiago","HH:mm"), codigo, nombre, cantidad,
    responsable || "Encargado de Bodega", obs || ""]);
  const stockData = wsStock.getRange(3, 1, wsStock.getLastRow()-2, 9).getValues();
  const idx = stockData.findIndex(r => r[0] === codigo);
  if (idx >= 0) {
    const stockRow = idx + 3;
    wsStock.getRange(stockRow, 3).setValue(cantidad);
    wsStock.getRange(stockRow, 8).setValue(Utilities.formatDate(ahora,"America/Santiago","yyyy-MM-dd HH:mm"));
  }
  SpreadsheetApp.flush();
  return { ok: true, id, ts: ahora.toISOString(), msg: `Conteo registrado para ${nombre}: ${cantidad} kg` };
}

function guardarOrden(body) {
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = ss.getSheetByName("ORDENES_COMPRA");
  const noc = `OC-${String(ws.getLastRow()-1).padStart(3,"0")}`; const ahora = new Date();
  ws.appendRow([noc, Utilities.formatDate(ahora,"America/Santiago","yyyy-MM-dd"),
    body.codigo, body.nombre, body.cantidad, body.precio||0,
    (body.cantidad||0)*(body.precio||0), body.proveedor||"", body.fecha_entrega||"",
    "PENDIENTE","", body.obs||""]);
  SpreadsheetApp.flush();
  return { ok: true, noc, msg: `Orden ${noc} creada` };
}

function getConteosDelDia(fecha) {
  if (!fecha) return { ok: false, error: "Falta parámetro fecha" };
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = ss.getSheetByName("CONTEOS_FISICOS");
  const last = ws.getLastRow(); if (last < 3) return { ok: true, data: [] };
  const data = ws.getRange(3, 1, last-2, 8).getValues();
  return { ok: true, data: data.filter(r => r[0] && r[1]).filter(r => {
    const f = Utilities.formatDate(r[1] instanceof Date?r[1]:new Date(r[1]),"America/Santiago","yyyy-MM-dd");
    return f === fecha;
  }).map(r => ({ id: r[0], codigo: r[3], nombre: r[4], cantidad: parseFloat(r[5])||0,
    responsable: r[6], obs: r[7],
    ts_local: Utilities.formatDate(r[1] instanceof Date?r[1]:new Date(r[1]),"America/Santiago","yyyy-MM-dd")+"T"+(r[2]||"00:00") }))};
}

function guardarPlanificacion(body) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let ws = ss.getSheetByName("PLANIFICACION");
  if (!ws) { crearHojaPlanificacion(ss); ws = ss.getSheetByName("PLANIFICACION"); }
  const dias = body.dias || []; const fechas = body.fechas || [...new Set(dias.map(d=>d.fecha))];
  if (!fechas.length) return { ok: false, error: "Sin datos" };
  const ahora = Utilities.formatDate(new Date(),"America/Santiago","yyyy-MM-dd HH:mm");
  const last = ws.getLastRow();
  if (last > 2) {
    const data = ws.getRange(3,1,last-2,2).getValues(); const toDelete = [];
    data.forEach((row,i) => { if (fechas.includes(normFecha(row[0]))) toDelete.push(i+3); });
    for (let i=toDelete.length-1;i>=0;i--) ws.deleteRow(toDelete[i]);
  }
  const rows = dias.filter(d=>d.kg_dia>0).map(d=>[d.fecha,d.dieta,d.kg_dia,ahora]);
  if (rows.length) ws.getRange(ws.getLastRow()+1,1,rows.length,4).setValues(rows);
  SpreadsheetApp.flush();
  return { ok: true, msg: `${rows.length} entradas guardadas`, ts: ahora };
}

function getPlanificacion(body) {
  const ss = SpreadsheetApp.openById(SHEET_ID); const ws = ss.getSheetByName("PLANIFICACION");
  if (!ws || ws.getLastRow() < 3) return { ok: true, data: [] };
  const data = ws.getRange(3,1,ws.getLastRow()-2,3).getValues();
  const desde = body&&body.desde?body.desde:null; const hasta = body&&body.hasta?body.hasta:null;
  return { ok: true, data: data.filter(r=>r[0]&&r[2]>0).filter(r => {
    const f=normFecha(r[0]); if(desde&&f<desde)return false; if(hasta&&f>hasta)return false; return true;
  }).map(r=>({fecha:normFecha(r[0]),dieta:r[1],kg_dia:r[2]})) };
}

function normFecha(val) {
  if (!val) return "";
  if (val instanceof Date) return Utilities.formatDate(val,"America/Santiago","yyyy-MM-dd");
  return String(val).substring(0,10);
}

function columnToLetter(col) {
  let letter = "";
  while (col > 0) { const rem=(col-1)%26; letter=String.fromCharCode(65+rem)+letter; col=Math.floor((col-1)/26); }
  return letter;
}

