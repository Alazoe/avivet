// Carteles de bioseguridad AviVet — formas y colores según NCh 1411 / ISO 7010,
// contenidos según el Manual SAG D-VYC-VIS-PP-004 v02 (planteles de aves).
// Unidades: milímetros de una hoja A4 vertical (210 × 297); el SVG escala a cualquier tamaño.

const COLOR = {
  prohibicion: '#CC0605',  // RAL 3020
  obligacion: '#0E518D',   // RAL 5017
  advertencia: '#F7B500',  // RAL 1023
  informacion: '#008754',  // RAL 6024
  negro: '#1A1A1A',
  gris: '#5F6B73',
  blanco: '#FFFFFF',
};

const FUENTE = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// ---------- Pictogramas (caja 100 × 100, figura en negro) ----------

// Figura humana de trazo grueso: lista de segmentos articulados + cabeza.
function persona({ cabeza, r = 8.5, cuerpo, extremidades, grosor = 10, color = COLOR.negro }) {
  const linea = (pts, g) =>
    `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${color}"
      stroke-width="${g}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<g>
    <circle cx="${cabeza[0]}" cy="${cabeza[1]}" r="${r}" fill="${color}"/>
    ${linea(cuerpo, grosor * 1.25)}
    ${extremidades.map(e => linea(e, grosor)).join('')}
  </g>`;
}

const PICTO = {
  caminando: () => persona({
    cabeza: [55, 12], r: 8.5, grosor: 9,
    cuerpo: [[53, 26], [48, 54]],
    extremidades: [
      [[52, 30], [42, 42], [35, 51]],          // brazo atrás
      [[52, 30], [61, 41], [69, 48]],          // brazo adelante
      [[48, 54], [40, 71], [29, 86]],          // pierna atrás
      [[48, 54], [58, 70], [60, 89], [69, 89]],// pierna adelante con pie
    ],
  }),
};

// Libro de registro abierto con lápiz (blanco sobre el color de la señal).
PICTO.libroLapiz = (fondo) => {
  const B = COLOR.blanco;
  const renglones = (x1, y1, x2, y2) => [0, 1, 2, 3].map(i => {
    const dy = 10 + i * 8.5;
    return `<line x1="${x1}" y1="${y1 + dy}" x2="${x2}" y2="${y2 + dy}" stroke="${fondo}" stroke-width="2.6" stroke-linecap="round"/>`;
  }).join('');
  return `<g>
    <path d="M8 80 L50 88 L92 80" fill="none" stroke="${B}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M10 30 Q30 24 48 32 L48 82 Q30 74 10 78 Z" fill="${B}"/>
    <path d="M52 32 Q70 24 90 30 L90 78 Q70 74 52 82 Z" fill="${B}"/>
    ${renglones(16, 30, 43, 34)}
    ${renglones(57, 34, 84, 30).split('<line').slice(0, 3).join('<line')}
    <g transform="translate(62 60) rotate(-55)">
      <path d="M0 0 L12 -6 L46 -6 L46 6 L12 6 Z" fill="${B}" stroke="${fondo}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M0 0 L4.5 -2.3 L4.5 2.3 Z" fill="${fondo}"/>
      <line x1="12" y1="-6" x2="12" y2="6" stroke="${fondo}" stroke-width="2"/>
      <line x1="38" y1="-6" x2="38" y2="6" stroke="${fondo}" stroke-width="2"/>
    </g>
  </g>`;
};

// "E" de estacionamiento, como el letrero chileno clásico (geométrica para no depender de la fuente).
PICTO.letraE = () => `<path fill="${COLOR.blanco}"
  d="M24 10 H76 V27 H44 V41.5 H71 V58.5 H44 V73 H76 V90 H24 Z"/>`;

// Camión de frente bajo un arco de desinfección que lo rocía (blanco sobre el color de la señal).
PICTO.arcoDesinfeccion = (fondo) => {
  const B = COLOR.blanco;
  // Boquilla + abanico de 3 rayos punteados.
  const gotas = (x, y, ang) => {
    const rad = ang * Math.PI / 180, bx = x + Math.cos(rad) * 1.5, by = y + Math.sin(rad) * 1.5;
    const boquilla = `<circle cx="${x}" cy="${y}" r="2.6" fill="${B}"/>`;
    return boquilla + [-24, 0, 24].map(a => {
      const r = (ang + a) * Math.PI / 180;
      const x1 = bx + Math.cos(r) * 4.5, y1 = by + Math.sin(r) * 4.5;
      const x2 = bx + Math.cos(r) * 12.5, y2 = by + Math.sin(r) * 12.5;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
        stroke="${B}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0 4"/>`;
    }).join('');
  };
  return `<g transform="translate(0 -3)">
    <path d="M12 92 V20 H88 V92" fill="none" stroke="${B}" stroke-width="5" stroke-linejoin="round"/>
    ${[34, 50, 66].map(x => gotas(x, 23, 90)).join('')}
    ${[42, 58, 74].map(y => gotas(15, y, 0) + gotas(85, y, 180)).join('')}
    <rect x="31" y="40" width="38" height="41" rx="4" fill="${B}"/>
    <rect x="35" y="45" width="30" height="15" rx="2" fill="${fondo}"/>
    <circle cx="38" cy="71" r="3" fill="${fondo}"/><circle cx="62" cy="71" r="3" fill="${fondo}"/>
    ${[66.5, 71, 75.5].map(y => `<line x1="45" y1="${y}" x2="55" y2="${y}" stroke="${fondo}" stroke-width="2"/>`).join('')}
    <rect x="29" y="82" width="42" height="4" rx="1" fill="${B}"/>
    <rect x="32" y="86" width="8" height="6" rx="1" fill="${B}"/><rect x="60" y="86" width="8" height="6" rx="1" fill="${B}"/>
  </g>`;
};

// Silueta libre (CC0) de carteles/siluetas/, escalada a la caja 100 × 100 y apoyada abajo.
// trazo: color para las líneas internas del dibujo original (si las tiene); sin trazo queda silueta plana.
// grosor: ancho de esas líneas como fracción del ancho del dibujo (las originales suelen ser muy finas para un cartel).
PICTO.silueta = (nombre, color = COLOR.negro, caja = [0, 0, 100, 100], alinear = 'xMidYMax', trazo = 'none', grosor = 0.012) => {
  const s = SILUETAS[nombre];
  const [x, y, w, h] = caja;
  const clase = 'tz-' + nombre.replace(/[^a-z0-9]/gi, '');
  const ancho = (+s.vb.split(/[ ,]+/)[2] * grosor).toFixed(2);
  const estilo = trazo === 'none' ? '' : `<style>.${clase} *{stroke-width:${ancho}px !important;stroke-linejoin:round}</style>`;
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${s.vb}" preserveAspectRatio="${alinear} meet"
    overflow="visible">${estilo}<g class="${clase}" fill="${color}" stroke="${trazo}">${s.cuerpo}</g></svg>`;
};

// Huevo arriba-derecha y trutro abajo-izquierda: los dos huecos que deja la barra de prohibición.
PICTO.huevoCarne = () =>
  PICTO.silueta('alimentos/egg', COLOR.negro, [48, 0, 48, 50], 'xMidYMid') +
  PICTO.silueta('alimentos/food-drumstick', COLOR.negro, [2, 48, 50, 50], 'xMidYMid');

PICTO.cubiertos = () => PICTO.silueta('alimentos/silverware-fork-knife', COLOR.blanco, [0, 0, 100, 100], 'xMidYMid');

// Polera + zapato: vestimenta exclusiva del plantel.
PICTO.ropaCalzado = () =>
  PICTO.silueta('vestuario/tshirt-crew', COLOR.blanco, [-2, -4, 68, 68], 'xMidYMid') +
  PICTO.silueta('vestuario/shoe-sneaker', COLOR.blanco, [34, 38, 70, 70], 'xMidYMid');

// Bota de goma de perfil mirando a la derecha, en caja 100 × 100 (forma geométrica propia).
function bota(color, fondo) {
  return `<path fill="${color}" d="M30 6 H60 V46 C60 51 64 53 70 54 L80 56 C88 58 92 63 92 70 V76 H30 Z"/>
    <rect x="27" y="76" width="68" height="9" rx="2.5" fill="${color}"/>
    <line x1="30" y1="17" x2="60" y2="17" stroke="${fondo}" stroke-width="3"/>`;
}

// Bota entrando a una bandeja con desinfectante.
PICTO.pediluvio = (fondo) => {
  const B = COLOR.blanco;
  return `<g transform="translate(16 20) scale(0.72)">${bota(B, fondo)}</g>
    <path d="M6 66 L12 94 H88 L94 66" fill="none" stroke="${B}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M14 76 Q22 71 30 76 T46 76 T62 76 T78 76 T90 76" fill="none" stroke="${fondo}" stroke-width="8" stroke-linecap="round"/>
    <path d="M14 76 Q22 71 30 76 T46 76 T62 76 T78 76 T90 76" fill="none" stroke="${B}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M18 84 Q26 79 34 84 T50 84 T66 84 T82 84" fill="none" stroke="${B}" stroke-width="3.5" stroke-linecap="round"/>`;
};

// Botas con flechas de intercambio arriba.
const BOTAS_CALZADO = 'vestuario/botas-goma-openclipart-298760';
PICTO.cambioCalzado = () =>
  PICTO.silueta(BOTAS_CALZADO, COLOR.blanco, [6, 30, 88, 66], 'xMidYMid', COLOR.obligacion) +
  PICTO.silueta('senaletica/swap-horizontal-bold', COLOR.blanco, [28, -4, 44, 32], 'xMidYMid');

// Rociador de desinfectante sobre una caja. Variantes: aerosol, gatillo, mano.
const ROCIADOR = 'gatillo';
function abanico(x0, y0, ang, largo, abrir = 26) {
  return [-abrir, 0, abrir].map(a => {
    const r = (ang + a) * Math.PI / 180;
    return `<line x1="${(x0 + Math.cos(r) * 3).toFixed(1)}" y1="${(y0 + Math.sin(r) * 3).toFixed(1)}"
      x2="${(x0 + Math.cos(r) * largo).toFixed(1)}" y2="${(y0 + Math.sin(r) * largo).toFixed(1)}"
      stroke="${COLOR.blanco}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="0 4"/>`;
  }).join('');
}
PICTO.rociarObjetos = () => {
  const espejo = (s) => `<g transform="translate(100 0) scale(-1 1)">${s}</g>`;
  if (ROCIADOR === 'aerosol')
    return espejo(PICTO.silueta('higiene/spray', COLOR.blanco, [44, 4, 62, 92], 'xMidYMid')) +
      abanico(52, 30, 12, 13, 20) +
      PICTO.silueta('instalaciones/package-variant-closed', COLOR.blanco, [58, 30, 44, 44], 'xMidYMid');
  if (ROCIADOR === 'gatillo')
    return PICTO.silueta('higiene/spray-bottle', COLOR.blanco, [-6, 4, 64, 92], 'xMidYMid') + abanico(50, 22, 22, 16, 22) +
      PICTO.silueta('instalaciones/package-variant-closed', COLOR.blanco, [58, 32, 44, 44], 'xMidYMid');
  return espejo(PICTO.silueta('higiene/mano-pulverizador-openclipart-220976', COLOR.blanco, [8, 2, 96, 70], 'xMidYMid', COLOR.obligacion, 0.008)) +
    PICTO.silueta('instalaciones/package-variant-closed', COLOR.blanco, [54, 52, 44, 44], 'xMidYMid');
};

// Depósito (basurero con tapa) para aves muertas.
PICTO.deposito = () => PICTO.silueta('residuos/delete', COLOR.negro, [8, 4, 84, 92], 'xMidYMid');

// Guanera: carretilla sola o delante de un cerco.
const GUANERA = 'carretilla';
PICTO.guanera = () => GUANERA === 'carretilla'
  ? PICTO.silueta('residuos/wheel-barrow', COLOR.negro, [4, 6, 92, 88], 'xMidYMid')
  : PICTO.silueta('instalaciones/fence', COLOR.negro, [0, 4, 100, 60], 'xMidYMid') +
    `<rect x="14" y="52" width="72" height="46" fill="${COLOR.advertencia}"/>` +
    PICTO.silueta('residuos/wheel-barrow', COLOR.negro, [12, 42, 76, 58], 'xMidYMax');

// ---------- Señales geométricas (NCh 1411) ----------

// Advertencia: triángulo amarillo, borde y símbolo negros (d = lado).
function senalAdvertencia(picto, cx, cy, d, escala = 0.6) {
  const h = d * 0.866, borde = d * 0.07;
  const top = cy - h * 0.6, base = cy + h * 0.4;
  const pts = `${cx},${top} ${cx + d / 2},${base} ${cx - d / 2},${base}`;
  const s = (d * escala) / 100;
  return `<g>
    <polygon points="${pts}" fill="${COLOR.advertencia}" stroke="${COLOR.negro}" stroke-width="${borde}" stroke-linejoin="round"/>
    <g transform="translate(${cx - 50 * s} ${base - borde * 1.1 - 93 * s}) scale(${s})">${picto}</g>
  </g>`;
}

// Información / condición segura: cuadrado verde, símbolo blanco.
function senalInformacion(picto, cx, cy, d) {
  const s = (d * 0.8) / 100;
  return `<g>
    <rect x="${cx - d / 2}" y="${cy - d / 2}" width="${d}" height="${d}" rx="${d * 0.06}" fill="${COLOR.informacion}"/>
    <g transform="translate(${cx - 50 * s} ${cy - 50 * s}) scale(${s})">${picto}</g>
  </g>`;
}

// Obligación: disco azul, símbolo blanco.
function senalObligacion(picto, cx, cy, d) {
  const s = (d * 0.74) / 100;
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${d / 2}" fill="${COLOR.obligacion}"/>
    <g transform="translate(${cx - 50 * s} ${cy - 50 * s}) scale(${s})">${picto}</g>
  </g>`;
}

// Prohibición: círculo rojo, fondo blanco, barra a 45° sobre el pictograma.
function senalProhibicion(picto, cx, cy, d) {
  const r = d / 2, anillo = d * 0.1, interior = r - anillo;
  const s = (interior * 2 * 0.8) / 100;  // pictograma ocupa ~80 % del interior
  const a = Math.PI / 4, x = Math.cos(a) * (r - anillo / 2), y = Math.sin(a) * (r - anillo / 2);
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r - anillo / 2}" fill="${COLOR.blanco}"
      stroke="${COLOR.prohibicion}" stroke-width="${anillo}"/>
    <g transform="translate(${cx - 50 * s} ${cy - 50 * s}) scale(${s})">${picto}</g>
    <line x1="${cx - x}" y1="${cy - y}" x2="${cx + x}" y2="${cy + y}"
      stroke="${COLOR.prohibicion}" stroke-width="${anillo * 0.9}"/>
  </g>`;
}

// ---------- Texto ----------

// Ajusta el tamaño para que la línea quepa en el ancho (mayúsculas en negrita ≈ 0.68 em por carácter).
function tamanoLinea(txt, ancho, max) {
  return Math.min(max, ancho / (txt.length * 0.68));
}

function textoCentrado(lineas, { x, y, ancho, max, color, peso = 800, interlinea = 1.08, anchor = 'middle' }) {
  const tam = Math.min(...lineas.map(l => tamanoLinea(l, ancho, max)));
  return lineas.map((l, i) =>
    `<text x="${x}" y="${y + i * tam * interlinea}" font-family="${FUENTE}" font-weight="${peso}"
      font-size="${tam.toFixed(2)}" fill="${color}" text-anchor="${anchor}">${l}</text>`).join('');
}

// ---------- Plantilla A4 ----------

function plantilla(c, opciones = {}) {
  if (c.pasosFiltro) {
    const ids = opciones.pasos && opciones.pasos.length ? opciones.pasos : PASOS_POR_DEFECTO;
    return plantillaPasos({ ...c, pasos: PASOS_FILTRO.filter(p => ids.includes(p.id)) }, opciones);
  }
  if (c.lleno) return plantillaLlena(c, opciones);
  const W = 210, H = 297, M = 12;
  const col = COLOR[c.tipo];
  const plantel = (opciones.plantel || '').trim();
  const t = c.titulo.length;

  // Bloque de título en el color de la categoría, texto blanco.
  const yBanda = 166, altoBanda = t === 1 ? 44 : 64;
  const titulo = textoCentrado(c.titulo, {
    x: W / 2, y: yBanda + (t === 1 ? 30 : 28), ancho: W - 2 * M - 16, max: 26, peso: 900,
    color: c.tipo === 'advertencia' ? COLOR.negro : COLOR.blanco,
  });
  const ySub = yBanda + altoBanda + 16;
  const sub = textoCentrado(c.subtitulo, {
    x: W / 2, y: ySub, ancho: W - 2 * M - 10, max: 12.5, color: COLOR.negro, peso: 800, interlinea: 1.25,
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">
    <rect width="${W}" height="${H}" fill="${COLOR.blanco}"/>
    <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="6" fill="none" stroke="${col}" stroke-width="2.5"/>

    <text x="${W / 2}" y="24" font-family="${FUENTE}" font-weight="800" font-size="9"
      letter-spacing="1.2" fill="${COLOR.negro}" text-anchor="middle">ÁREA BAJO BIOSEGURIDAD</text>

    ${c.senal(W / 2, 95, 122)}

    <rect x="${M}" y="${yBanda}" width="${W - 2 * M}" height="${altoBanda}" rx="4" fill="${col}"/>
    ${titulo}
    ${sub}

    ${pie(W, H, M, plantel)}
  </svg>`;
}

// Cartel entero del color de la categoría, con dibujo y letras negras (sin señal geométrica ni franja).
function plantillaLlena(c, opciones = {}) {
  const W = 210, H = 297, M = 12, N = COLOR.negro;
  const plantel = (opciones.plantel || '').trim();
  const s = 1.3;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">
    <rect width="${W}" height="${H}" fill="${COLOR[c.tipo]}"/>
    <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="6" fill="none" stroke="${N}" stroke-width="3.5"/>
    <text x="${W / 2}" y="28" font-family="${FUENTE}" font-weight="800" font-size="9"
      letter-spacing="1.2" fill="${N}" text-anchor="middle">ÁREA BAJO BIOSEGURIDAD</text>
    <g transform="translate(${W / 2 - 50 * s} 38) scale(${s})">${c.dibujo()}</g>
    ${textoCentrado(c.titulo, { x: W / 2, y: 196, ancho: W - 2 * M - 10, max: 30, color: N, peso: 900 })}
    ${textoCentrado(c.subtitulo, { x: W / 2, y: 226, ancho: W - 2 * M - 10, max: 12.5, color: N, peso: 800, interlinea: 1.25 })}
    ${pie(W, H, M, plantel).replace(/#D0D5D8|#5F6B73/g, N)}
  </svg>`;
}

function pie(W, H, M, plantel) {
  return `<line x1="${M + 6}" y1="${H - 25}" x2="${W - M - 6}" y2="${H - 25}" stroke="#D0D5D8" stroke-width="0.5"/>
    ${plantel ? `<text x="${M + 6}" y="${H - 16}" font-family="${FUENTE}" font-weight="800" font-size="6"
      fill="${COLOR.negro}">${escapar(plantel)}</text>` : ''}
    <text x="${M + 6}" y="${H - (plantel ? 10 : 13)}" font-family="${FUENTE}" font-size="4"
      fill="${COLOR.gris}">Manual SAG de bioseguridad en planteles de aves</text>
    <text x="${W - M - 6}" y="${H - (plantel ? 10 : 13)}" font-family="${FUENTE}" font-weight="700" font-size="4"
      fill="${COLOR.gris}" text-anchor="end">avivet.cl</text>`;
}

// Cartel de pasos numerados (p. ej. filtro sanitario): franja de título y una fila por paso.
function plantillaPasos(c, opciones = {}) {
  const W = 210, H = 297, M = 12;
  const col = COLOR[c.tipo], plantel = (opciones.plantel || '').trim();
  const y0 = 88, yFin = H - 31, hueco = 3.5, n = c.pasos.length;
  const alto = (yFin - y0 - hueco * (n - 1)) / n;
  const d = Math.min(36, alto - 2.5), xN = M + 4, lado = Math.min(17, alto - 5), xI = xN + lado + 6, xT = xI + d + 7;
  const anchoT = W - M - 6 - xT;
  const tam = Math.min((alto - 5) / 2.3, ...c.pasos.flatMap(p => p.texto.map(l => tamanoLinea(l, anchoT, 11))));
  const pasos = c.pasos.map((p, i) => {
    const y = y0 + i * (alto + hueco), cy = y + alto / 2;
    const nl = p.texto.length, altoTxt = nl * tam * 1.1 + (p.nota ? 6.5 : 0);
    const yT = cy - altoTxt / 2 + tam * 0.82;
    return `<rect x="${M}" y="${y}" width="${W - 2 * M}" height="${alto}" rx="5" fill="#EEF2F7"/>
      <rect x="${xN}" y="${cy - lado / 2}" width="${lado}" height="${lado}" rx="3" fill="${col}"/>
      <text x="${xN + lado / 2}" y="${cy + lado * 0.27}" font-family="${FUENTE}" font-weight="900" font-size="${lado * 0.76}"
        fill="${COLOR.blanco}" text-anchor="middle">${i + 1}</text>
      ${senalObligacion(p.icono(), xI + d / 2, cy, d)}
      ${textoCentrado(p.texto, { x: xT, y: yT, ancho: anchoT, max: tam, color: COLOR.negro, peso: 900, interlinea: 1.1, anchor: 'start' })}
      ${p.nota ? `<text x="${xT}" y="${yT + (nl - 1) * tam * 1.1 + 7}" font-family="${FUENTE}" font-weight="800"
        font-size="5.5" letter-spacing="0.6" fill="${p.colorNota || COLOR.gris}">${p.nota}</text>` : ''}`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">
    <rect width="${W}" height="${H}" fill="${COLOR.blanco}"/>
    <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="6" fill="none" stroke="${col}" stroke-width="2.5"/>
    <text x="${W / 2}" y="24" font-family="${FUENTE}" font-weight="800" font-size="9"
      letter-spacing="1.2" fill="${COLOR.negro}" text-anchor="middle">ÁREA BAJO BIOSEGURIDAD</text>
    <rect x="${M}" y="32" width="${W - 2 * M}" height="36" rx="4" fill="${col}"/>
    ${textoCentrado(c.titulo, { x: W / 2, y: 58, ancho: W - 2 * M - 16, max: 22, color: COLOR.blanco, peso: 900 })}
    ${textoCentrado(c.subtitulo, { x: W / 2, y: 80, ancho: W - 2 * M, max: 8, color: COLOR.negro, peso: 800 })}
    ${pasos}
    ${pie(W, H, M, plantel)}
  </svg>`;
}

function escapar(s) {
  return s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

// ---------- Pasos del filtro sanitario (se eligen por plantel, salen en este orden) ----------

const ico = (nombre) => () => PICTO.silueta(nombre, COLOR.blanco, [0, 0, 100, 100], 'xMidYMid');
const PASOS_FILTRO = [
  { id: 'registro', nombre: 'Registro de ingreso', texto: ['REGISTRE', 'SU INGRESO'], icono: ico('registro/notebook-edit') },
  { id: 'ropa-calle', nombre: 'Dejar ropa y calzado de calle', porDefecto: true, texto: ['DEJE ROPA Y', 'CALZADO DE CALLE'],
    nota: 'ZONA SUCIA', colorNota: COLOR.prohibicion, icono: ico('vestuario/hanger') },
  { id: 'ducha', nombre: 'Ducha (reproductoras y abuelas)', texto: ['DÚCHESE'], icono: ico('higiene/shower-head') },
  { id: 'manos', nombre: 'Lavado y desinfección de manos', porDefecto: true, texto: ['LÁVESE Y DESINFECTE', 'LAS MANOS'],
    icono: ico('higiene/hand-wash') },
  { id: 'ropa-plantel', nombre: 'Ropa y calzado del plantel', porDefecto: true, texto: ['PÓNGASE ROPA Y', 'CALZADO DEL PLANTEL'],
    icono: () => PICTO.ropaCalzado() },
  { id: 'cubrecalzado', nombre: 'Overol desechable y cubrecalzado', texto: ['PÓNGASE OVEROL', 'Y CUBRECALZADO'],
    icono: () => PICTO.ropaCalzado() },
  { id: 'calzado', nombre: 'Desinfección de calzado', texto: ['DESINFECTE', 'EL CALZADO'], icono: ico('higiene/shoe-print') },
  { id: 'zona-limpia', nombre: 'Pasar a zona limpia', porDefecto: true, texto: ['PASE A LA', 'ZONA LIMPIA'],
    icono: ico('senaletica/door-open') },
];
const MANOS_ICONO = 'higiene/manos-iso7010-m011';
const PASOS_POR_DEFECTO = PASOS_FILTRO.filter(p => p.porDefecto).map(p => p.id);

// ---------- Catálogo ----------
// estado: 'listo' | 'borrador' | 'pendiente'

const CARTELES = [
  {
    id: 'prohibido-ingreso', estado: 'listo', tipo: 'prohibicion', lugar: 'Cerco perimetral y portón',
    titulo: ['PROHIBIDO', 'EL INGRESO'],
    subtitulo: ['A PERSONAS AJENAS', 'A LA EMPRESA'],
    norma: '§6.1',
    senal: (cx, cy, d) => senalProhibicion('', cx, cy, d),
  },
  {
    id: 'registro-visitas', estado: 'listo', tipo: 'obligacion', lugar: 'Portería',
    titulo: ['REGISTRE', 'SU VISITA'],
    subtitulo: ['ANTES DE INGRESAR', 'AL PLANTEL'],
    norma: '§6.1 y §6.3',
    senal: (cx, cy, d) => senalObligacion(PICTO.libroLapiz(COLOR.obligacion), cx, cy, d),
  },
  {
    id: 'estacionamiento', estado: 'listo', tipo: 'informacion', lugar: 'Estacionamiento, antes del cerco',
    titulo: ['ESTACIONE', 'AFUERA'],
    subtitulo: ['PERSONAL Y VISITAS:', 'FUERA DEL CERCO'],
    norma: '§6.2',
    senal: (cx, cy, d) => senalInformacion(PICTO.letraE(), cx, cy, d * 0.92),
  },
  {
    id: 'desinfeccion-vehiculos', estado: 'listo', tipo: 'obligacion', lugar: 'Arco / zona de desinfección',
    titulo: ['DESINFECCIÓN', 'DE VEHÍCULOS'],
    subtitulo: ['OBLIGATORIA PARA TODO', 'VEHÍCULO QUE INGRESA'],
    norma: '§6.2',
    senal: (cx, cy, d) => senalObligacion(PICTO.arcoDesinfeccion(COLOR.obligacion), cx, cy, d),
  },
  {
    id: 'vacio-sanitario', estado: 'listo', tipo: 'advertencia', lugar: 'Portería',
    titulo: ['24 HORAS', 'SIN OTRAS AVES'],
    subtitulo: ['NO INGRESE SI TUVO CONTACTO', 'CON AVES EN LAS ÚLTIMAS 24 H'],
    norma: '§6.3',
    senal: (cx, cy, d) => senalAdvertencia(PICTO.silueta('aves-produccion/gallina-phylopic-arcadia'), cx, cy + 8, d * 1.05, 0.40),
  },
  {
    id: 'productos-crudos', estado: 'listo', tipo: 'prohibicion', lugar: 'Ingreso del personal y filtro sanitario',
    titulo: ['PROHIBIDO', 'HUEVOS Y CARNES'],
    subtitulo: ['PERSONAL Y VISITAS NO INGRESAN', 'PRODUCTOS CRUDOS DE ORIGEN ANIMAL'],
    norma: '§6.3',
    senal: (cx, cy, d) => senalProhibicion(PICTO.huevoCarne(), cx, cy, d),
  },
  {
    id: 'filtro-pasos', estado: 'listo', tipo: 'obligacion', lugar: 'Filtro sanitario, a la entrada',
    titulo: ['FILTRO SANITARIO'],
    subtitulo: ['SIGA ESTOS PASOS PARA INGRESAR'],
    norma: '§6.3 a',
    pasosFiltro: true,
  },
  {
    id: 'respete-filtros', estado: 'listo', tipo: 'obligacion', lugar: 'Portería, filtros y entrada de pabellones',
    titulo: ['RESPETE LOS', 'FILTROS SANITARIOS'],
    subtitulo: ['OBLIGATORIOS AL INGRESAR', 'Y AL SALIR'],
    norma: '§6.3',
    senal: (cx, cy, d) => senalObligacion(ico('senaletica/shield-check')(), cx, cy, d),
  },
  {
    id: 'zona-sucia', estado: 'listo', tipo: 'advertencia', lugar: 'Filtro sanitario, lado exterior',
    titulo: ['ZONA SUCIA'],
    subtitulo: ['ROPA Y CALZADO DE CALLE', 'SOLO HASTA AQUÍ'],
    norma: '§6.3 b',
    senal: (cx, cy, d) => senalAdvertencia(PICTO.silueta('riesgos/bacteria', COLOR.negro, [0, 0, 100, 100], 'xMidYMid'),
      cx, cy + 8, d * 1.05, 0.44),
  },
  {
    id: 'zona-limpia', estado: 'listo', tipo: 'informacion', lugar: 'Filtro sanitario, lado interior',
    titulo: ['ZONA LIMPIA'],
    subtitulo: ['SOLO CON ROPA Y CALZADO', 'DEL PLANTEL'],
    norma: '§6.3 b',
    senal: (cx, cy, d) => senalInformacion(PICTO.ropaCalzado(), cx, cy, d * 0.92),
  },
  {
    id: 'lavado-manos', estado: 'listo', tipo: 'obligacion', lugar: 'Lavamanos del filtro y de los pabellones',
    titulo: ['LÁVESE', 'LAS MANOS'],
    subtitulo: ['CON AGUA Y JABÓN, LUEGO', 'APLIQUE DESINFECTANTE'],
    norma: '§6.3 c',
    senal: (cx, cy, d) => senalObligacion(ico(MANOS_ICONO)(), cx, cy, d),
  },
  {
    id: 'desinfeccion-materiales', estado: 'listo', tipo: 'obligacion', lugar: 'Filtro de materiales e insumos',
    titulo: ['DESINFECTE', 'LOS MATERIALES'],
    subtitulo: ['TODO OBJETO O INSUMO', 'QUE INGRESA O SALE'],
    norma: '§6.4',
    senal: (cx, cy, d) => senalObligacion(PICTO.rociarObjetos(), cx, cy, d),
  },
  {
    id: 'pediluvio', estado: 'borrador', tipo: 'obligacion', lugar: 'Entrada de cada pabellón',
    titulo: ['PASE POR', 'EL PEDILUVIO'],
    subtitulo: ['AL ENTRAR Y AL SALIR', 'DEL PABELLÓN'],
    norma: '§7.1',
    senal: (cx, cy, d) => senalObligacion(PICTO.pediluvio(COLOR.obligacion), cx, cy, d),
  },
  {
    id: 'cambio-calzado', estado: 'listo', tipo: 'obligacion', lugar: 'Entrada de cada pabellón (alternativa al pediluvio)',
    titulo: ['CAMBIO', 'DE CALZADO'],
    subtitulo: ['USE EL CALZADO EXCLUSIVO', 'DE ESTE PABELLÓN'],
    norma: '§7.1',
    senal: (cx, cy, d) => senalObligacion(PICTO.cambioCalzado(), cx, cy, d),
  },
  {
    id: 'mortalidad', estado: 'listo', tipo: 'advertencia', lugar: 'Zona de disposición de cadáveres y contenedores',
    titulo: ['AVES MUERTAS'],
    subtitulo: ['MANTENGA EL DEPÓSITO', 'SIEMPRE CERRADO'],
    norma: '§8.5',
    lleno: true,
    dibujo: () => PICTO.deposito(),
    senal: (cx, cy, d) => senalAdvertencia(PICTO.deposito(), cx, cy + 8, d * 1.05, 0.46),
  },
  {
    id: 'guanera', estado: 'listo', tipo: 'advertencia', lugar: 'Guanera y acopio de guano',
    titulo: ['GUANERA'],
    subtitulo: ['ACCESO RESTRINGIDO', 'MANTENGA EL CERCO CERRADO'],
    norma: '§8.7',
    lleno: true,
    dibujo: () => PICTO.guanera(),
    senal: (cx, cy, d) => senalAdvertencia(PICTO.guanera(), cx, cy + 8, d * 1.05, 0.46),
  },
  {
    id: 'comedor', estado: 'listo', tipo: 'informacion', lugar: 'Comedor del personal',
    titulo: ['COMEDOR'],
    subtitulo: ['ÚNICO LUGAR PARA COMER', 'DENTRO DEL PLANTEL'],
    norma: '§6.3',
    senal: (cx, cy, d) => senalInformacion(PICTO.cubiertos(), cx, cy, d * 0.92),
  },
];

if (typeof module !== 'undefined') module.exports = { CARTELES, plantilla, COLOR };
