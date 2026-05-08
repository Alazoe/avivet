// ============================================================
// La Campestre — Google Apps Script Backend
// Pegar en el editor de Apps Script del Google Sheet
// Luego: Implementar > Nueva implementación > Aplicación web
//   · Ejecutar como: Yo
//   · Quién puede acceder: Cualquier persona
// Copiar la URL y pegarla en app.js (GAS_URL)
// ============================================================

const SS = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  const action = e.parameter.action || "";
  let result;
  try {
    switch (action) {
      case "productores":      result = getProductores(); break;
      case "vehiculos":        result = getVehiculos(); break;
      case "plan":             result = getPlan(e.parameter.semana); break;
      case "resumen":          result = getResumen(e.parameter.semana); break;
      case "addPlan":          result = addPlan(e.parameter); break;
      case "updatePlan":       result = updatePlan(e.parameter); break;
      case "deletePlan":       result = deletePlan(e.parameter.id); break;
      case "inicializarAltas": result = inicializarAltas(e.parameter.semana); break;
      case "updateProductor":  result = updateProductor(e.parameter); break;
      default:                 result = { error: "Acción desconocida: " + action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getSheet(name) {
  return SS.getSheetByName(name);
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function getLunesSemana() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const lunes = new Date(today);
  lunes.setDate(today.getDate() + diff);
  return Utilities.formatDate(lunes, "America/Santiago", "yyyy-MM-dd");
}

// ── Productores ────────────────────────────────────────────────────────────────

function getProductores() {
  return sheetToObjects(getSheet("Productores")).filter(p => p.activo == 1);
}

function updateProductor(params) {
  const sheet = getSheet("Productores");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf("id");
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(params.id)) {
      ["nombre", "comuna", "latitud", "longitud", "prioridad"].forEach(f => {
        if (params[f] !== undefined)
          sheet.getRange(i + 1, headers.indexOf(f) + 1).setValue(params[f]);
      });
      return { ok: true };
    }
  }
  return { error: "Productor no encontrado" };
}

// ── Vehículos ──────────────────────────────────────────────────────────────────

function getVehiculos() {
  return sheetToObjects(getSheet("Vehiculos")).filter(v => v.activo == 1);
}

// ── Plan semanal ───────────────────────────────────────────────────────────────

const DIAS_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

function getPlan(semana) {
  if (!semana) semana = getLunesSemana();
  const productores = sheetToObjects(getSheet("Productores"));
  const vehiculos   = sheetToObjects(getSheet("Vehiculos"));
  const plan = sheetToObjects(getSheet("Plan")).filter(p => p.fecha_semana === semana);

  const dias = {};
  DIAS_ORDER.forEach(d => { dias[d] = []; });

  plan.forEach(entry => {
    const prod = productores.find(p => String(p.id) === String(entry.productor_id));
    const veh  = vehiculos.find(v => String(v.id) === String(entry.vehiculo_id));
    if (prod && dias[entry.dia] !== undefined) {
      dias[entry.dia].push({
        id:               entry.id,
        productor_id:     entry.productor_id,
        productor_nombre: prod.nombre,
        comuna:           prod.comuna,
        prioridad:        prod.prioridad,
        latitud:          prod.latitud,
        longitud:         prod.longitud,
        vehiculo_id:      entry.vehiculo_id,
        vehiculo_nombre:  veh ? veh.nombre : "",
        retiro_cajas:     Number(entry.retiro_cajas) || 0,
        despacho_kg:      Number(entry.despacho_kg) || 0,
        completado:       Number(entry.completado) || 0,
        notas:            entry.notas || ""
      });
    }
  });
  return { fecha_semana: semana, dias };
}

function getResumen(semana) {
  if (!semana) semana = getLunesSemana();
  const plan = sheetToObjects(getSheet("Plan")).filter(p => p.fecha_semana === semana);
  return DIAS_ORDER.map(dia => {
    const entries = plan.filter(p => p.dia === dia);
    return {
      dia,
      total_cajas:       entries.reduce((s, e) => s + (Number(e.retiro_cajas) || 0), 0),
      total_despacho_kg: entries.reduce((s, e) => s + (Number(e.despacho_kg) || 0), 0),
      num_productores:   entries.length,
      completados:       entries.filter(e => Number(e.completado) === 1).length
    };
  });
}

function addPlan(params) {
  const semana = params.fecha_semana || getLunesSemana();
  const sheet  = getSheet("Plan");
  const existing = sheetToObjects(sheet).find(
    p => p.fecha_semana === semana &&
         String(p.productor_id) === String(params.productor_id) &&
         p.dia === params.dia
  );
  if (existing) return { error: "duplicate", id: existing.id };

  const id = Date.now();
  sheet.appendRow([
    id, semana, Number(params.productor_id), params.dia,
    params.vehiculo_id ? Number(params.vehiculo_id) : "",
    Number(params.retiro_cajas) || 0,
    Number(params.despacho_kg)  || 0,
    0, params.notas || ""
  ]);
  return { id };
}

function updatePlan(params) {
  const sheet = getSheet("Plan");
  const data  = sheet.getDataRange().getValues();
  const h     = data[0];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][h.indexOf("id")]) === String(params.id)) {
      sheet.getRange(i + 1, h.indexOf("retiro_cajas") + 1).setValue(Number(params.retiro_cajas) || 0);
      sheet.getRange(i + 1, h.indexOf("despacho_kg")  + 1).setValue(Number(params.despacho_kg)  || 0);
      sheet.getRange(i + 1, h.indexOf("vehiculo_id")  + 1).setValue(params.vehiculo_id ? Number(params.vehiculo_id) : "");
      sheet.getRange(i + 1, h.indexOf("completado")   + 1).setValue(Number(params.completado) || 0);
      sheet.getRange(i + 1, h.indexOf("notas")        + 1).setValue(params.notas || "");
      return { ok: true };
    }
  }
  return { error: "not found" };
}

function deletePlan(id) {
  const sheet = getSheet("Plan");
  const data  = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf("id");
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { error: "not found" };
}

function inicializarAltas(semana) {
  if (!semana) semana = getLunesSemana();
  const altas = sheetToObjects(getSheet("Productores")).filter(p => p.prioridad === "ALTA" && p.activo == 1);
  const vid   = sheetToObjects(getSheet("Vehiculos")).filter(v => v.activo == 1)[0]?.id || "";
  let creados = 0;
  altas.forEach(p => {
    ["Lunes", "Jueves"].forEach(dia => {
      const r = addPlan({ fecha_semana: semana, productor_id: p.id, dia, vehiculo_id: vid });
      if (!r.error) creados++;
    });
  });
  return { creados };
}

// ── Inicialización (ejecutar UNA vez desde el editor) ─────────────────────────

function inicializarHojas() {
  const productoresData = [
    [1,"CONCHUELA","COLINA",-33.09883,-70.76326,"BAJA"],
    [2,"ANGELICA CORNEJO","PICHIDEGA",-34.43846,-71.30873,"MEDIA"],
    [3,"ANGELINE CORNEJO","PUMANQUE",-34.54806,-71.68435,"MEDIA"],
    [4,"BARBARA","LAMPA",-33.27868,-70.84818,"MEDIA"],
    [5,"BERNARDO RUZ","PICHIDEGA",-34.35616,-71.41152,"MEDIA"],
    [6,"BEZETA","SAN FRANCISCO",-33.96581,-70.69931,"MEDIA"],
    [7,"CARLA SANTIBAÑEZ","OLIVAR",-34.22223,-70.80626,"MEDIA"],
    [8,"CARLOS VILCHES","LLAY LLAY",-32.84061,-70.97313,"MEDIA"],
    [9,"CRISTIAN ARTEAGA","PLACILLA",-34.61108,-71.1317,"ALTA"],
    [10,"CRISTIAN REYES","OLIVAR",-34.23181,-70.89639,"MEDIA"],
    [11,"CRISTIAN URBANO","MELIPILLA",-33.66754,-71.24712,"MEDIA"],
    [12,"EDUARDO CHAMAL","MELIPILLA",-33.83696,-71.3646,"MEDIA"],
    [13,"EDUARDO RIVERA","SAN VICENTE",-34.47651,-71.15129,"ALTA"],
    [14,"ELSA PADILLA","PICHIDEGUA",-34.03086,-70.65492,"MEDIA"],
    [15,"FERNANDO BARRA","Graneros",-34.48418,-71.45676,"MEDIA"],
    [16,"GENESIS","PERALILLO",-34.19748,-70.64267,"MEDIA"],
    [17,"GEORGINA RAMIREZ","MACHALI",-34.19748,-70.64267,"MEDIA"],
    [18,"HECTOR MATIAS","RINCONADA",-34.50228,-71.0851,"MEDIA"],
    [19,"HELGA PLET","LAMPA",-33.22101,-70.84057,"MEDIA"],
    [20,"ISABEL LOPEZ","LOLOL",-34.71001,-71.7107,"MEDIA"],
    [21,"JAQUELINE","PICHIDEGA",-34.38526,-71.2421,"MEDIA"],
    [22,"JASNE QUINTERO","REQUINOA",-34.29368,-70.74807,"MEDIA"],
    [23,"JUAN CARLOS ABURTO","LOLOL",-34.72993,-71.66992,"MEDIA"],
    [24,"JUAN SANCHEZ","CHIMBARONGO",-34.66868,-71.00557,"MEDIA"],
    [25,"JUANA MUÑOZ","Graneros",-34.12656,-70.68635,"MEDIA"],
    [26,"LA BERTUCA","SAN FERNANDO",-34.58066,-70.90901,"ALTA"],
    [27,"LA CAMPESTRE","San Vicente",-34.47776,-70.98126,"MEDIA"],
    [28,"LA MONTAÑA","QUILICURA",-33.32888,-70.72637,"MEDIA"],
    [29,"LABORATORIO LABSER","RANCAGUA",-34.18718,-70.75643,"MEDIA"],
    [30,"LUIS OLGUIN","PERALILLO",-34.47605,-71.48031,"MEDIA"],
    [31,"LUIS RIVERA","SAN VICENTE",-34.47651,-71.15129,"ALTA"],
    [32,"MAIKO","EL MONTE",-33.65498,-70.99604,"MEDIA"],
    [33,"MARCELO CORNEJO","PICHIDEGA",-34.40586,-71.31345,"MEDIA"],
    [34,"MARGARITA HERRERA","PENCAHUE",-34.43283,-71.11664,"MEDIA"],
    [35,"MARGOT AVENDAÑO","REQUINOA",-34.29168,-70.8547,"MEDIA"],
    [36,"MARIA MONTECINOS","REQUINOA",-34.28545,-70.82466,"ALTA"],
    [37,"MARIA MONTECINOS (MACHALI)","MACHALI",-34.25726,-70.46707,"MEDIA"],
    [38,"MARIA TORRES","REQUINOA",-34.25811,-70.77626,"MEDIA"],
    [39,"MARTA DURAN","SAN FERNANDO",-34.56441,-70.91495,"MEDIA"],
    [40,"MIGUEL ALISTE","PELEQUEN",-34.44676,-70.88195,"MEDIA"],
    [41,"MOISES LABBE","PLACILLA",-34.59458,-71.09242,"MEDIA"],
    [42,"MOLINERA DEL REY","MELIPILLA",-33.67893,-71.21718,"MEDIA"],
    [43,"MUNDO MIEL","LITUECHE",-34.16238,-71.7936,"MEDIA"],
    [44,"NADIA GUTIERREZ","LOS MAYOS",-34.51286,-71.17095,"MEDIA"],
    [45,"NELSON BANDEJAS","SAN BERNARDO",-33.59031,-70.71456,"MEDIA"],
    [46,"NELSON PRADO","LITUECHE",-34.07066,-71.7042,"MEDIA"],
    [47,"ORFILA SILVA","MACHALI",-34.19796,-70.53276,"MEDIA"],
    [48,"PALOMA CAMPAÑA","RANCAGUA",-34.10233,-70.83589,"MEDIA"],
    [49,"PROKAB","LAMPA",-33.31315,-70.73507,"BAJA"],
    [50,"RETIRO MAXI SACAS","PEDRO AGUIRRE CERDA",-33.50225,-70.68835,"MEDIA"],
    [51,"RICARDO QUINTERO","REQUINOA",-34.29368,-70.74807,"MEDIA"],
    [52,"RICARDO TOBAR","PERALILLO",-34.52948,-71.54998,"MEDIA"],
    [53,"TAMARA SOTO","LOLOL",-34.70691,-71.69992,"MEDIA"]
  ];

  // Hoja Productores
  let sheet = SS.getSheetByName("Productores") || SS.insertSheet("Productores");
  sheet.clearContents();
  sheet.appendRow(["id","nombre","comuna","latitud","longitud","prioridad","activo"]);
  productoresData.forEach(r => sheet.appendRow([r[0],r[1],r[2],r[3],r[4],r[5],1]));

  // Hoja Vehiculos
  sheet = SS.getSheetByName("Vehiculos") || SS.insertSheet("Vehiculos");
  sheet.clearContents();
  sheet.appendRow(["id","nombre","capacidad_kg","activo"]);
  sheet.appendRow([1,"Camión Grande",10000,1]);
  sheet.appendRow([2,"Camión Mediano",6000,1]);
  sheet.appendRow([3,"Chevrolet Partner",1000,1]);

  // Hoja Plan
  sheet = SS.getSheetByName("Plan") || SS.insertSheet("Plan");
  sheet.clearContents();
  sheet.appendRow(["id","fecha_semana","productor_id","dia","vehiculo_id","retiro_cajas","despacho_kg","completado","notas"]);

  SpreadsheetApp.getUi().alert("Hojas inicializadas correctamente con 53 productores.");
}
