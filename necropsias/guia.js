// ══ GUÍA PASO A PASO DE NECROPSIA ═══════════════════════════════════
// Texto traducido y adaptado al español a partir de láminas de un manual
// de necropsia aviar (secuencia fotográfica paso a paso). Las fotos NO van
// en el repo público: se importan con el paquete de referencias
// (~/AviVet_Necropsias/paquete-referencias.zip) y se emparejan por nombre.
//
// Cada paso: [archivo, texto, estado?, título?]
//   estado: 'tecnica' (por defecto) | 'normal' | 'alterado'
//   Los pasos 'normal'/'alterado' aparecen además como referencia dentro
//   del sistema correspondiente del formulario.
var FUENTE_GUIA = 'Manual de necropsia aviar (láminas paso a paso), traducción AviVet';

var GUIA_CONSEJOS = [
  'Toma primero las muestras de tejidos <b>asépticos</b> (corazón, hígado, bolsa, encéfalo, sacos aéreos) y recién después abre el tubo digestivo: al abrirlo se liberan muchas bacterias que contaminan todo y confunden el diagnóstico.',
  'La pared intestinal se autoliza muy rápido. Si vas a pedir histopatología de intestino, usa aves recién sacrificadas o muertas hace muy poco.',
  'Después de la muerte las bacterias del intestino migran a los tejidos que normalmente son estériles: toma las muestras lo antes posible.',
  'Para aislamiento viral desde tejidos sépticos, muestrea apenas abras, antes de contaminar con contenido intestinal.',
  'Las muestras para bacteriología van en frasco estéril (refrigeradas); las de histopatología, en formalina al 10 % (10 volúmenes de formalina por 1 de tejido, trozos de ≤ 5 mm de grosor).'
];

var GUIA = [
  { id:'pechuga', t:'Examen de la pechuga', sis:'locomotor',
    intro:'Inspecciona la región pectoral buscando lesiones.',
    pasos:[
      ['guia-pech-1', 'Retira la piel hacia la entrada del tórax para dejar expuesta la pechuga.'],
      ['guia-pech-musculo', 'Músculos: evalúa la condición corporal según la masa muscular.', 'normal', 'Masa muscular de la pechuga'],
      ['guia-pech-quilla', 'Huesos: evalúa la simetría de la quilla buscando desviaciones (como en la foto). Revisa las costillas y sus articulaciones buscando colapso o engrosamiento (rosario raquítico).', 'alterado', 'Quilla desviada'],
      ['guia-pech-pared', 'Pared abdominal: antes de cortarla, busca exceso de grasa, ascitis o exudado.', 'normal', 'Pared abdominal y grasa']
    ]},
  { id:'cuello', t:'Apertura y estructuras del cuello', sis:'linfoide',
    intro:'Expón los tejidos del cuello y examina tráquea, esófago, nervios, timo y buche.',
    pasos:[
      ['guia-cuello-1', 'Examina los tejidos del cuello en toda su longitud.'],
      ['guia-cuello-nervios', 'Nervios: el nervio vago corre lateral a la vena yugular y de él salen los nervios cervicales. Compara ambos lados (engrosamiento → Marek).', 'normal', 'Nervio vago y cervicales'],
      ['guia-cuello-vasos', 'Vasos: la vena yugular recorre ambos lados del cuello.', 'normal', 'Vena yugular'],
      ['guia-cuello-timo', 'Timo: 4 a 7 lóbulos paralelos al nervio vago. Se atrofia con la madurez sexual o por enfermedad.', 'normal', 'Timo (lóbulos 1–4)']
    ]},
  { id:'higado', t:'Hígado in situ', sis:'higado',
    intro:'El hígado ocupa el centro de la cavidad toracoabdominal. Tiene un lóbulo derecho y uno izquierdo unidos en la base; el izquierdo es más chico. Su tamaño es variable y puede sobrepasar el borde del esternón.',
    pasos:[
      ['guia-hig-insitu', 'Busca lesiones macroscópicas: hemorragias, necrosis, color anormal y hepatomegalia.', 'normal', 'Hígado in situ'],
      ['guia-hig-color', 'Color: lo normal va de café rojizo a levemente amarillo según la grasa infiltrada (ver ficha de hígado graso).', 'referencia', 'Rango de color normal del hígado'],
      ['guia-hig-textura', 'Textura: superficie lisa y brillante; firme a la palpación.', 'normal', 'Superficie hepática normal'],
      ['guia-hig-tamano', 'Tamaño: la inflamación o la cirrosis pueden asociarse a bordes engrosados y redondeados.', 'alterado', 'Bordes hepáticos engrosados']
    ]},
  { id:'molleja', t:'Molleja in situ', sis:'digestivo',
    intro:'La molleja (ventrículo) está bajo el hígado. Es la porción trituradora del estómago: cuatro bandas de músculo liso en círculo, ancladas al centro por tendones.',
    pasos:[
      ['guia-moll-insitu', 'Evalúa las paredes musculares: cambios de color, adelgazamiento, flacidez u otras lesiones.', 'normal', 'Molleja in situ'],
      ['guia-moll-color', 'Color: bandas rojo oscuro (músculo grueso) y rojo claro (músculo delgado).', 'normal', 'Color de la molleja'],
      ['guia-moll-textura', 'Textura: músculos gruesos, órgano muy firme al tacto; las bandas delgadas son más blandas.', 'normal', 'Músculo de la molleja'],
      ['guia-moll-tamano', 'Tamaño: varía con la dieta; con grano entero y grit es más grande que con alimento molido.', 'referencia', 'Tamaño de molleja según dieta']
    ]},
  { id:'corazon', t:'Extracción y examen del corazón', sis:'linfoide',
    intro:'Saca el corazón y ábrelo para revisar miocardio, cavidades y válvulas.',
    pasos:[
      ['guia-cor-1', 'Levanta el corazón y corta los grandes vasos para extraerlo.'],
      ['guia-cor-2', 'Corta el ápice del corazón.'],
      ['guia-cor-3', 'Compara el tamaño de las luces ventriculares: la izquierda es más grande que la derecha, que es como una hendidura (si la derecha está dilatada, pensar en ascitis / hipertensión pulmonar).', 'normal', 'Ventrículos: luz izquierda y derecha'],
      ['guia-cor-4', 'Introduce la tijera en la luz izquierda y ábrela.'],
      ['guia-cor-5', 'Inspecciona la superficie del miocardio y las válvulas.', 'normal', 'Miocardio y válvulas (lado izquierdo)'],
      ['guia-cor-6', 'Repite en el lado derecho e inspecciona miocardio y válvulas.'],
      ['guia-cor-muestra', 'Muestra de corazón: un trozo en frasco estéril para microbiología y otro en formalina para histopatología.']
    ]},
  { id:'siringe', t:'Siringe y bronquios', sis:'respiratorio',
    intro:'El extremo distal de la tráquea se estrecha para formar la siringe y luego se bifurca en los bronquios primarios.',
    pasos:[
      ['guia-siringe', 'Ubica tráquea, siringe y bronquios primarios.', 'normal', 'Siringe y bronquios'],
      ['guia-siringe-lumen', 'Revisa la luz buscando exudado o parásitos (Syngamus). La siringe es angosta y se obstruye con facilidad (tapones caseosos).', 'normal', 'Luz de la siringe']
    ]},
  { id:'gi', t:'Extracción del tubo digestivo', sis:'digestivo',
    intro:'Saca proventrículo, molleja, hígado e intestino en un solo bloque y déjalo aparte para examinarlo al final, después de muestrear los tejidos asépticos.',
    pasos:[
      ['guia-gi-1', 'Corta el proventrículo separándolo del esófago.'],
      ['guia-gi-2', 'Corta las inserciones que fijan proventrículo, molleja, hígado e intestino.'],
      ['guia-gi-3', 'Tira suavemente y estira el intestino, con cuidado de no romperlo ni derramar su contenido.']
    ]},
  { id:'bolsa', t:'Bolsa de Fabricio', sis:'linfoide',
    intro:'La bolsa está en la pared dorsal de la cloaca. Tira el intestino hacia atrás para exponerla (también se puede llegar por vía dorsal a través de la piel).',
    pasos:[
      ['guia-bolsa-insitu', 'Su integridad es un buen indicador de inmunocompetencia en aves inmaduras. En las gallinas adultas involuciona por completo.', 'normal', 'Bolsa de Fabricio in situ'],
      ['guia-bolsa-color', 'Color: la superficie externa es rosada pálida.', 'normal', 'Bolsa de Fabricio: color normal'],
      ['guia-bolsa-tamano', 'Tamaño: sin infecciones inmunosupresoras (Gumboro, anemia infecciosa, Marek) alcanza su máximo alrededor de las 8 semanas (en la foto, ave de 10 semanas, ~2 cm).', 'normal', 'Bolsa de Fabricio: tamaño a las 10 semanas'],
      ['guia-bolsa-1', 'Separa la bolsa de la cloaca.'],
      ['guia-bolsa-2', 'Ábrela para exponer la luz.'],
      ['guia-bolsa-3', 'Examina los pliegues rosados de la mucosa: busca hemorragias, edema o inflamación.', 'normal', 'Mucosa de la bolsa'],
      ['guia-bolsa-muestra', 'Muestra de bolsa: un trozo en formalina para histopatología y otro para microbiología.'],
      ['guia-gi-extendido', 'Corta el extremo posterior del intestino en la cloaca y deja el tubo digestivo aparte hasta terminar con los tejidos asépticos.', 'referencia', 'Tubo digestivo extendido']
    ]},
  { id:'gonadas', t:'Gónadas y adrenales', sis:'reproductor',
    intro:'En la hembra solo se desarrolla el aparato reproductor izquierdo. El ovario está detrás de los pulmones y delante de los riñones.',
    pasos:[
      ['guia-ovario-1', 'El tamaño del ovario varía mucho con la edad y el estado sexual.', 'normal', 'Ovario'],
      ['guia-ovario-2', 'En hembras inmaduras el ovario es pequeño, con aspecto finamente nodular.', 'normal', 'Ovario inmaduro'],
      ['guia-ovario-3', 'Un ovario activo tiene folículos en distintas etapas de desarrollo.', 'normal', 'Ovario activo'],
      ['guia-infundibulo', 'En gallinas en postura el infundíbulo es grande y se asocia a los folículos. Examina el infundíbulo y la serosa del oviducto.', 'normal', 'Infundíbulo y oviducto'],
      ['guia-adrenal', 'Las adrenales son pequeñas, amarillo-café, delante de los riñones, parcialmente tapadas por el ovario o los testículos.', 'normal', 'Adrenal y testículo inmaduro'],
      ['guia-testiculo', 'En el macho los testículos son bilaterales, delante de los riñones; su tamaño varía mucho con el desarrollo sexual.', 'normal', 'Testículos maduros']
    ]},
  { id:'rinones', t:'Riñones', sis:'renal',
    intro:'En este momento los riñones quedan totalmente expuestos. Tienen tres lóbulos a cada lado, firmemente alojados en el sinsacro de la pelvis.',
    pasos:[
      ['guia-rinon-insitu', 'Busca hemorragias, aumento de tamaño, nódulos y exceso de uratos blancos.', 'normal', 'Riñones in situ'],
      ['guia-rinon-color', 'Color: café rojizo oscuro. Una pequeña cantidad de uratos blancos en los uréteres es normal.', 'normal', 'Color renal y uréter'],
      ['guia-rinon-textura', 'Textura: levemente granular.', 'normal', 'Textura renal'],
      ['guia-rinon-tamano', 'Tamaño: los lóbulos deben quedar al ras de la fosa del sinsacro (si sobresalen, están aumentados).', 'normal', 'Tamaño renal']
    ]},
  { id:'serosa', t:'Serosa intestinal', sis:'digestivo',
    intro:'Busca anomalías regionales como engrosamientos o dilataciones, y lesiones focales como hemorragias o necrosis. Los segmentos del intestino no están bien delimitados: se habla de tercio anterior, medio y posterior.',
    pasos:[
      ['guia-serosa', 'Duodeno y páncreas, yeyuno, divertículo de Meckel (marca el fin del yeyuno), íleon, ciegos y recto.', 'normal', 'Segmentos del intestino'],
      ['guia-anaerobio', 'Muestra para anaerobios (ej. Clostridium): antes de abrir el intestino, amarra y corta un segmento y ponlo en un frasco para microbiología, para no exponerlo al oxígeno.']
    ]},
  { id:'proventriculo', t:'Mucosa de proventrículo y molleja', sis:'digestivo',
    intro:'Abre el tubo digestivo con tijera para ver las mucosas. Busca hemorragias, necrosis, úlceras, proliferaciones y nódulos.',
    pasos:[
      ['guia-prov-1', 'Abre el proventrículo y lava suavemente el contenido.'],
      ['guia-prov-2', 'Evalúa las glándulas: aumento de las papilas, úlceras o hemorragias.', 'normal', 'Papilas del proventrículo'],
      ['guia-prov-3', 'Abre la molleja y lava suavemente el contenido. Evalúa la pared muscular y la mucosa.'],
      ['guia-prov-4', 'Busca cambios de color en la pared y defectos en la capa de koilina.', 'normal', 'Koilina de la molleja'],
      ['guia-prov-koilina', 'Desprende la koilina.'],
      ['guia-moll-mucosa', 'Revisa úlceras, hemorragias u otras lesiones en la mucosa bajo la koilina.', 'normal', 'Mucosa de la molleja sin koilina']
    ]},
  { id:'mucosa', t:'Mucosa del tubo digestivo', sis:'digestivo',
    intro:'Inspecciona la mucosa intestinal. Si hace falta, retira el contenido con suavidad, pero no raspes la mucosa: dañas el tejido y arruinas la histopatología.',
    pasos:[
      ['guia-muc-duodeno', 'Abre el duodeno y evalúa la mucosa.', 'normal', 'Mucosa del duodeno'],
      ['guia-muc-yeyuno', 'Abre el yeyuno y evalúa la mucosa.', 'normal', 'Mucosa del yeyuno'],
      ['guia-muc-ileon', 'Abre el íleon y evalúa la mucosa.', 'normal', 'Mucosa del íleon'],
      ['guia-muc-ciego', 'Abre el ciego y evalúa la mucosa.', 'normal', 'Mucosa del ciego'],
      ['guia-tonsila-normal', 'En la base de los ciegos pon atención a las tonsilas cecales: normalmente son rosadas pálidas.', 'normal', 'Tonsila cecal normal'],
      ['guia-tonsila-alterada', 'Estas estructuras linfoides pueden aumentar de tamaño, ponerse hemorrágicas o necróticas durante una infección (Newcastle, entre otras).', 'alterado', 'Tonsila cecal hemorrágica / necrótica'],
      ['guia-muestra-gi-1', 'Muestras de digestivo: saca tiras de proventrículo, istmo (unión) y molleja para histopatología (en formalina).'],
      ['guia-muestra-gi-2', 'Saca segmentos de duodeno, yeyuno, íleon y ciego.'],
      ['guia-raspado', 'Si sospechas coccidiosis, raspa con el filo del cuchillo la mucosa de distintos segmentos del intestino y de los ciegos…'],
      ['guia-frotis', '…y prepara frotis para ver al microscopio la especie y la carga de coccidias.']
    ]},
  { id:'encefalo', t:'Examen del encéfalo', sis:'nervioso',
    intro:'Exponer el encéfalo para examen macroscópico y toma de muestras es importante si se observaron signos nerviosos.',
    pasos:[
      ['guia-enc-1', 'Retira la cresta.'],
      ['guia-enc-2', 'Retira la piel hacia los lados hasta dejar expuesto todo el techo del cráneo.'],
      ['guia-enc-3', 'Empezando por el agujero occipital (foramen magno), corta el techo del cráneo alrededor del encéfalo con cortes cortos y superficiales.'],
      ['guia-enc-4', 'Levanta y retira el techo del cráneo.'],
      ['guia-enc-5', 'Examina in situ la superficie del cerebro y del cerebelo.', 'normal', 'Cerebro y cerebelo in situ'],
      ['guia-enc-6', 'Separa el encéfalo de los nervios craneales y de la médula espinal.'],
      ['guia-enc-7', 'Deposita el encéfalo sobre una superficie estéril para inspeccionarlo (o directo en formalina / frasco estéril).', 'normal', 'Encéfalo extraído']
    ]},
  { id:'descarte', t:'Limpieza y eliminación', sis:'general',
    intro:'Eliminar bien los cadáveres es clave para la bioseguridad. Si el productor tiene un método bioseguro de eliminación, se desechan en el predio; si no, llévatelos para eliminarlos en forma sanitaria.',
    pasos:[
      ['guia-descarte-1', 'Si hay que sacarlos, pon los cadáveres y todo el material sucio en una bolsa plástica resistente.'],
      ['guia-descarte-2', 'Mete esa bolsa dentro de una segunda bolsa que no haya tocado el suelo.'],
      ['guia-descarte-3', 'Cierra la segunda bolsa y guárdala en el vehículo (idealmente en un contenedor lavable, nunca en la cabina).']
    ]}
];
