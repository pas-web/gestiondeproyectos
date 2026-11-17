/* Pieza por pieza · los datos que viajan con la página
   - PIEZAS: lo que se presupuesta, sacado del cronograma integrado y del catálogo.
   - CATALOGO: precios de referencia que Claude investigó el 16 de noviembre de 2026,
     con tienda, lugar, fecha y enlace. Lo marcado «práctica» viene de la práctica del
     presupuesto (12 de noviembre de 2026) y no tiene fuente: se cotiza sí o sí.
   - EXPEDIENTE: lo que el agente sabe del proyecto.
   Las actividades del cronograma (PRESA.actividades) las mete construir.js. */
(function () {
  'use strict';
  var D = window.PXP = window.PXP || {};

  D.FECHA_CATALOGO = '16 de noviembre de 2026';
  D.JORNAL_MINIMO = 315.04;

  D.COMPONENTES = [
    { id: '1a', nombre: 'Contener la erosión de la orilla', corto: 'Erosión', color: '#B8466E' },
    { id: '1b', nombre: 'Revegetar con especies nativas', corto: 'Revegetación', color: '#4B8F2A' },
    { id: '2', nombre: 'La comunidad cuida y vigila la orilla', corto: 'Comunidad', color: '#6A55C2' },
    { id: '3', nombre: 'Recreación para las distintas edades', corto: 'Recreación', color: '#168C6E' },
    { id: '4', nombre: 'El espacio se mantiene seguro y limpio', corto: 'Seguridad y limpieza', color: '#C0602F' },
    { id: '5', nombre: 'Espacios de convivencia y descanso', corto: 'Convivencia', color: '#3F6FB0' }
  ];

  D.BOLSILLOS = [
    { id: 'AUT', nombre: 'Autogestión y especie', corto: 'Autogestión' },
    { id: 'PRO', nombre: 'PROCODES (CONANP)', corto: 'PROCODES' },
    { id: 'MUN', nombre: 'Ayuntamiento de Arroyo Seco', corto: 'Ayuntamiento' },
    { id: 'CNF', nombre: 'CONAFOR', corto: 'CONAFOR' }
  ];

  D.FORMAS = [
    { id: 'compra', nombre: 'Se compra' },
    { id: 'faena', nombre: 'En faena' },
    { id: 'donado', nombre: 'Donado' },
    { id: 'prestado', nombre: 'Prestado' },
    { id: 'trocado', nombre: 'Trocado' }
  ];

  D.TIPOS = [
    { id: 'material', nombre: 'Material', practica: 'materiales' },
    { id: 'mano', nombre: 'Mano de obra', practica: 'gente' },
    { id: 'equipo', nombre: 'Herramienta y equipo', practica: 'equipo' },
    { id: 'flete', nombre: 'Flete', practica: 'traslado' }
  ];

  D.PROVEEDORES = [
    { id: 'materiales', nombre: 'Casa de materiales o ferretería', corto: 'Materiales' },
    { id: 'madereria', nombre: 'Maderería', corto: 'Maderería' },
    { id: 'vivero', nombre: 'Vivero', corto: 'Vivero' },
    { id: 'herreria', nombre: 'Herrería', corto: 'Herrería' },
    { id: 'maquinaria', nombre: 'Renta de maquinaria y acarreos', corto: 'Maquinaria' },
    { id: 'senaletica', nombre: 'Rótulos e impresión', corto: 'Rótulos' },
    { id: 'electrico', nombre: 'Iluminación y equipo solar', corto: 'Solar' },
    { id: 'mano', nombre: 'Mano de obra de la región', corto: 'Mano de obra' },
    { id: 'flete', nombre: 'Flete', corto: 'Flete' },
    { id: 'otros', nombre: 'Otros', corto: 'Otros' }
  ];

  // Quién hace la pieza: para el plano que se lleva a revisar antes de cotizar
  D.OFICIOS = [
    { id: 'herreria', nombre: 'Herrería', persona: 'el herrero', hace: 'un herrero, al que se le paga' },
    { id: 'carpinteria', nombre: 'Carpintería', persona: 'el carpintero', hace: 'un carpintero, al que se le paga' },
    { id: 'albanileria', nombre: 'Albañilería', persona: 'el albañil', hace: 'un albañil, al que se le paga' },
    { id: 'otro', nombre: 'Otro oficio', persona: 'quien la va a hacer', hace: 'otro oficio, al que se le paga' },
    { id: 'faena', nombre: 'La comunidad, en faena', persona: 'quien coordina la faena', hace: 'la comunidad, en faena' }
  ];

  /* ---------- Las piezas ---------- */
  D.PIEZAS = [
    { id: '1a-trancas', c: '1a', nombre: 'Trancas para el ganado en el vertedor', acts: ['1a.2'],
      decidido: 'Se cierra el paso del ganado a la zona del vertedor. Antes se acuerda con ganaderos y ejido (actividad 1a-01).' },
    { id: '1a-cerco', c: '1a', nombre: 'Cerco contra el ganado en el talud', acts: ['1a.3', '1a.4'],
      decidido: 'Perímetro de protección de 15 m² delimitado con estacas; cerco de estacas vivas o de alambre.' },
    { id: '1a-fajinas', c: '1a', nombre: 'Fajinas de rama en curvas de nivel', acts: ['1a.5', '1a.6'],
      decidido: 'Se instalan en faena con ramas y pastos conseguidos en la zona.' },
    { id: '1a-azolve', c: '1a', nombre: 'Trampa de azolve de costales', acts: ['1a.7', '1a.8'],
      decidido: 'Costales llenos en la parte baja del talud.' },
    { id: '1a-estacas', c: '1a', nombre: 'Estacas vivas de sauce y aile', acts: ['1a.9', '1a.10'],
      decidido: 'Tramo de 5 m de estacas hincadas al pie del talud, con las primeras lluvias; corte propio.' },
    { id: '1b-arboles', c: '1b', nombre: 'Cuarenta árboles con cajete', acts: ['1b.10', '1b.8', '1b.11'],
      decidido: 'Cuarenta árboles nativos (encino, cedro blanco, tepame, huizache, sauce, aile y jarilla) pedidos a CONAFOR, con cajete sobre el suelo retenido; siembra al inicio de las lluvias, meta el 30 de junio; meta de 30 vivas a los tres meses.' },
    { id: '1b-corredores', c: '1b', nombre: 'Cercado de los corredores de monte', acts: ['1b.5'],
      decidido: 'Dos corredores de monte de 15 a 20 m de ancho entre humedal, arroyo y encinar, cercados contra el ganado.' },
    { id: '1b-fauna', c: '1b', nombre: 'Corredor de fauna sobre el cauce', acts: ['1b.6'],
      decidido: 'Franja cercada sobre el cauce que solo en temporadas lleva un hilito de agua; el cauce cruza el camino, con la presa de un lado y el bosque del otro; el ganado queda fuera de la franja.' },
    { id: '1b-sombra', c: '1b', nombre: 'Sombra plantada junto a palapas y bancas', acts: ['1b.12'],
      decidido: 'Tres árboles de sombra del lado poniente de cada sitio de palapa y banca.' },
    { id: '1b-riego', c: '1b', nombre: 'Riego de auxilio en la primera seca', acts: ['1b.14'],
      decidido: 'Cada quince días durante la primera seca, junto con los recorridos.' },
    { id: '2-reglas', c: '2', nombre: 'Letreros de reglas', acts: ['2.9'],
      decidido: 'Letreros de reglas, contacto y emblema, con visto bueno del comité; señalética con el concepto del Department of Conservation de Nueva Zelanda y el emblema de la presa.' },
    { id: '2-bienvenida', c: '2', nombre: 'Letrero de bienvenida y panel de caminatas', acts: ['2.11'],
      decidido: 'El letrero dice «Presa de la Florida» con el emblema en grande (solo en ese letrero) y sin segunda línea. El panel trae tres caminatas: Sótano Hondo (45 min, intermedio), La Escondida de Hidalgo (2 h, avanzado) y Santa María de Cocos (6 h, avanzado).' },
    { id: '3-rutas', c: '3', nombre: 'Señales de las tres rutas', acts: ['3.4', '3.5'],
      decidido: 'Tres rutas de senderismo en la zona de los pinos, con marcas, postes y puntos de descanso.' },
    { id: '3-muelle', c: '3', nombre: 'Muelle de 8 × 4 m', acts: ['3.9', '3.10'],
      decidido: 'Muelle de madera de 32 m² que arranca en la orilla cercana y se interna al agua; fijo o flotante según los niveles medidos en secas. Necesita concesión de zona federal y autorización de impacto ambiental.' },
    { id: '3-boyas', c: '3', nombre: 'Cinco boyas de profundidad', acts: ['3.11'],
      decidido: 'Cinco boyas que marcan la profundidad frente al muelle.' },
    { id: '4-contenedores', c: '4', nombre: 'Contenedores de residuos', acts: ['4.3'],
      decidido: 'Propuesta B del catálogo: contenedor metálico café, a prueba de fauna, con puerta frontal para que el personal lo vacíe fácil; uno por sitio de estancia y sin separación. La ruta de recolección se gestiona con el Ayuntamiento.' },
    { id: '4-fantasmas', c: '4', nombre: 'Fantasmas luminiscentes', acts: ['4.4'],
      decidido: 'En el bordo y en el vertedor, para que se vean de noche.' },
    { id: '4-barreras', c: '4', nombre: 'Barreras vivas', acts: ['4.5'],
      decidido: 'Barreras de plantas en las zonas con riesgo de caída.' },
    { id: '4-magueyes', c: '4', nombre: 'Línea de magueyes', acts: ['4.7'],
      decidido: 'Una línea de magueyes cierra el acceso al camino de antes.' },
    { id: '4-estacionamiento', c: '4', nombre: 'Estacionamiento', acts: ['4.9'],
      decidido: 'El camino comunitario de la izquierda se conserva y el de la derecha da acceso al estacionamiento. Los autos van frente a toda la barda blanca y caben a ambos lados. Se delimita con magueyes o con una cerca bonita y económica; los letreros llevan el emblema.' },
    { id: '4-cerca', c: '4', nombre: 'Cerca de troncos con portón', acts: ['4.10'],
      decidido: 'Cerca A del catálogo, de troncos tipo rancho. Portón normalmente cerrado para vehículos y ganado, que se abre y cierra con un mecanismo manual sin cadena. Paso peatonal fácil de subir y bajar, pensado en personas que no podrían trepar.' },
    { id: '4-lamparas', c: '4', nombre: 'Cinco lámparas solares', acts: ['4.11'],
      decidido: 'En las zonas más frecuentadas.' },
    { id: '4-letreros', c: '4', nombre: 'Letreros de estacionamiento', acts: ['4.12'],
      decidido: 'Con el emblema de la presa.' },
    { id: '5-palapas', c: '5', nombre: 'Tres palapas con mesa, bancas y asador', acts: ['5.4', '5.5'],
      decidido: 'Palapas de 4 × 4 m hechas en faena con troncos de poda, palma, tablones y alambre; cada una con mesa, dos bancas y asador. Van fuera de la ribera y arriba de la cota de crecida, con sombra plantada al poniente.' },
    { id: '5-bancas', c: '5', nombre: 'Diez bancas en la orilla', acts: ['5.6'],
      decidido: 'Diez bancas junto a los árboles de sombra ya plantados.' },
    { id: '5-explanada', c: '5', nombre: 'Explanada de 200 m²', acts: ['5.7'],
      decidido: 'Se nivela y se limpia sin quitar vegetación nativa.' }
  ];

  /* ---------- El catálogo de precios de referencia ---------- */
  var OE_MAT = 'https://oneestimate.ai/es/blog/lista-precios-materiales-construccion-mexico-2026';
  var OE_MO = 'https://oneestimate.ai/en/blog/precios-mano-obra-construccion-2026';
  var OE_ALB = 'https://oneestimate.ai/blog/tabulador-precios-albanileria-mexico-2026';
  var PRACTICA = 'Práctica del presupuesto de la presa (12 nov 2026), sin fuente';
  function r(k, n, u, p, t, f, d, url, nota) { return { k: k, n: n, u: u, p: p, t: t, f: f, d: d, url: url || '', nota: nota || '', o: url ? 'fuente' : 'practica' }; }
  D.CATALOGO = [
    // Materiales de construcción
    r('M01', 'Cemento gris CPC 30R, bulto de 50 kg', 'bulto', 240, 'materiales', 'OneEstimate, promedio de CDMX, Monterrey, Guadalajara y Querétaro: $215 a $245; Tanda Casa estima $240 a $295', '22 ago 2026', OE_MAT),
    r('M02', 'Cemento gris CEMEX Extra, saco de 25 kg', 'saco', 142, 'materiales', 'Home Depot México, sucursal Coapa (CDMX), precio de lista citado por Tanda Casa', '14 sep 2026', 'https://tandacasa.com/blog/bulto-de-cemento-precio-2026'),
    r('M03', 'Arena de mina o de río', 'm³', 650, 'materiales', 'OneEstimate: $580 a $720 por m³, varía según el banco', '22 ago 2026', OE_MAT),
    r('M04', 'Grava de 3/4"', 'm³', 720, 'materiales', 'OneEstimate: $650 a $790 por m³, material de banco', '22 ago 2026', OE_MAT),
    r('M05', 'Piedra braza', 'm³', 615, 'materiales', 'OneEstimate: $550 a $680 por m³', '22 ago 2026', OE_MAT),
    r('M06', 'Varilla corrugada de 3/8", pieza de 12 m', 'pieza', 172, 'materiales', 'OneEstimate: $24,500 a $26,800 la tonelada; la pieza pesa unos 6.7 kg', '22 ago 2026', OE_MAT),
    r('M07', 'Alambre recocido núm. 18', 'kg', 33, 'materiales', 'OneEstimate: $31 a $35 por kg', '22 ago 2026', OE_MAT),
    r('M08', 'Block de concreto hueco 15 × 20 × 40 cm', 'pieza', 18, 'materiales', 'OneEstimate: $16.50 a $19.50', '22 ago 2026', OE_MAT),
    r('M09', 'Tabique rojo recocido 7 × 14 × 28 cm', 'millar', 4550, 'materiales', 'OneEstimate: $4,200 a $4,900 el millar', '22 ago 2026', OE_MAT),
    r('M10', 'Revestimiento o tepetate de banco', 'm³', 450, 'materiales', PRACTICA, '12 nov 2026'),
    r('M11', 'Costal de rafia', 'pieza', 8, 'materiales', PRACTICA, '12 nov 2026'),
    r('M12', 'Pintura esmalte, galón de 4 L', 'galón', 420, 'materiales', PRACTICA, '12 nov 2026'),
    r('M13', 'Malla sombra raschel 90%, rollo de 2 × 20 m', 'rollo', 814, 'materiales', 'Mercado Libre, tienda Brisa Casa, en oferta (antes $1,499), según El Imparcial', '18 jul 2026', 'https://www.elimparcial.com/dinero/2026/07/18/la-malla-sombra-raschel-de-40-m-baja-un-45-en-mercado-libre-y-cuesta-814-pesos-una-rebaja-ideal-para-proteger-plantas-y-autos-de-las-quemaduras-solares-este-ano/', 'Precio de oferta; el normal ronda $1,499.'),
    r('M14', 'Manguera de 1/2", rollo de 50 m', 'rollo', 550, 'materiales', PRACTICA, '12 nov 2026'),
    // Cercos
    r('C01', 'Alambre de púas calibre 15.5, rollo de 300 m (Fiero)', 'rollo', 799, 'materiales', 'Cyberpuerta, más $280 de envío; en Mercado Libre de $777 (oferta) a $1,205', '16 nov 2026', 'https://www.cyberpuerta.mx/Computo-Hardware/Cables/Bobinas/Bobinas-de-Cable-de-Acero/Fiero-Bobina-de-Alambre-de-Puas-Calibre-15-5-300-Metros-Acero.html', 'Envío aparte.'),
    r('C02', 'Alambre de púas calibre 15.5, rollo de 360 m (Magnacero)', 'rollo', 965, 'materiales', 'Mercado Libre, tienda Simacero, envío gratis', '16 nov 2026', 'https://listado.mercadolibre.com.mx/proteccion-para-bardas-de-herreria'),
    r('C03', 'Malla borreguera galvanizada, rollo de 50 m × 1.67 m', 'rollo', 1874, 'materiales', 'Mercado Libre, Deacero por Ferrox, envío gratis; en otra publicación $1,950', '16 nov 2026', 'https://listado.mercadolibre.com.mx/malla-ciclonica-55x55'),
    r('C04', 'Malla ciclónica calibre 13, rollo de 1.25 × 20 m', 'rollo', 1229, 'materiales', 'Mercado Libre, tienda Ferrepat', '16 nov 2026', 'https://listado.mercadolibre.com.mx/malla-ciclonica-55x55'),
    r('C05', 'Grapas para cerco', 'kg', 60, 'materiales', PRACTICA, '12 nov 2026'),
    r('C06', 'Estaca de madera para delimitar', 'pieza', 15, 'madereria', PRACTICA, '12 nov 2026'),
    r('C07', 'Estaca viva de sauce o aile, corte propio', 'pieza', 0, 'otros', PRACTICA, '12 nov 2026', '', 'Se corta en la zona: no se compra.'),
    // Madera
    r('W01', 'Poste rollizo de madera de 2.2 m, de la región', 'pieza', 90, 'madereria', PRACTICA, '12 nov 2026'),
    r('W02', 'Poste de pino impregnado de 14 cm × 2.5 m', 'pieza', 1221, 'madereria', 'Mercado Libre, envío gratis; el de 15 cm cuesta $1,999 y el de 14 cm × 1.2 m, $740', '16 nov 2026', 'https://listado.mercadolibre.com.mx/barrote-de-madera-para-cimbra', 'Precio de tienda en línea; en una maderería de la región suele salir más barato.'),
    r('W03', 'Poste rollizo de pino de 8 cm × 1.8 m', 'pieza', 317, 'madereria', 'Mercado Libre, paquete de 6 piezas en $1,900', '16 nov 2026', 'https://listado.mercadolibre.com.mx/vigas-de-madera-6-metros'),
    r('W04', 'Poste o tronco de 4 m para palapa', 'pieza', 350, 'madereria', PRACTICA, '12 nov 2026', '', 'En el proyecto se piensa en troncos de poda conseguidos.'),
    r('W05', 'Tablón de madera tratada de 2" × 4" × 8\'', 'pieza', 474, 'madereria', 'Mercado Libre', '16 nov 2026', 'https://listado.mercadolibre.com.mx/barrote-de-pino-3ra'),
    r('W06', 'Barrote estufado de 1½" × 3½" × 8\'', 'pieza', 228, 'madereria', 'Mercado Libre, paquete de 2 piezas en $455', '16 nov 2026', 'https://listado.mercadolibre.com.mx/barrote-de-madera-para-cimbra'),
    r('W07', 'Tablón de pino de 2.5 m', 'pieza', 250, 'madereria', PRACTICA, '12 nov 2026'),
    r('W08', 'Palma para techo, por m² cubierto', 'm²', 180, 'otros', PRACTICA, '12 nov 2026'),
    r('W09', 'Tarima de pino usada', 'pieza', 100, 'madereria', PRACTICA, '12 nov 2026'),
    // Piezas terminadas
    r('P01', 'Banca rústica de tronco o tablón', 'pieza', 1200, 'madereria', PRACTICA, '12 nov 2026'),
    r('P02', 'Palapa de palma de 3 × 3 m, contratada llave en mano', 'pieza', 33600, 'otros', 'Habitissimo, promedio del Estado de México (Jalisco: $36,000)', '16 nov 2026', 'https://www.habitissimo.com.mx/presupuesto/construir-palapa/estado-de-mexico', 'Sirve para comparar contra la palapa hecha en faena.'),
    r('P03', 'Tambo metálico abierto de 200 L', 'pieza', 2103, 'herreria', 'Mercado Libre, Cenvases, en oferta (normal $2,500)', '16 nov 2026', 'https://listado.mercadolibre.com.mx/tambo-metalico-200-lts'),
    r('P04', 'Contenedor metálico a prueba de fauna, hecho por herrero', 'pieza', 4500, 'herreria', PRACTICA, '12 nov 2026'),
    r('P05', 'Bote de basura de plástico de 240 L con pedal y tapa', 'pieza', 1927, 'materiales', 'Mercado Libre, Industrial Pallets', '16 nov 2026', 'https://listado.mercadolibre.com.mx/botes-de-basura-industriales'),
    r('P06', 'Tambo de plástico de 200 L, reutilizado de primera', 'pieza', 1250, 'otros', 'Mercado Libre; nuevo, hasta $1,800', '16 nov 2026', 'https://listado.mercadolibre.com.mx/tapas-para-tambos-de-200-lts'),
    r('P07', 'Luminaria solar suburbana de 60 W, todo en uno', 'pieza', 1725, 'electrico', 'Mercado Libre, SL Lighting: $1,690 a $1,760; hay de $800 a $890 con menos autonomía', '16 nov 2026', 'https://listado.mercadolibre.com.mx/luminaria-solar-led-60w'),
    r('P08', 'Lámpara solar de poste de 100 W', 'pieza', 1200, 'electrico', PRACTICA, '12 nov 2026'),
    r('P09', 'Boya señalizadora de 30 cm', 'pieza', 450, 'otros', PRACTICA, '12 nov 2026'),
    r('P10', 'Fantasma luminiscente para poste', 'pieza', 35, 'senaletica', PRACTICA, '12 nov 2026'),
    r('P11', 'Letrero de lámina impreso de 60 × 40 cm', 'pieza', 350, 'senaletica', PRACTICA, '12 nov 2026'),
    r('P12', 'Lona impresa', 'm²', 150, 'senaletica', PRACTICA, '12 nov 2026'),
    // Plantas
    r('V01', 'Planta nativa de vivero, bolsa de 1 L', 'pieza', 45, 'vivero', PRACTICA, '12 nov 2026', '', 'CONAFOR la da en especie: se valoriza a este precio.'),
    // Herramienta y maquinaria
    r('E01', 'Pala o pico', 'pieza', 280, 'materiales', PRACTICA, '12 nov 2026'),
    r('E02', 'Carretilla', 'pieza', 1300, 'materiales', PRACTICA, '12 nov 2026'),
    r('E03', 'Cubeta de 19 L', 'pieza', 60, 'materiales', PRACTICA, '12 nov 2026'),
    r('E04', 'Renta de retroexcavadora', 'hora', 900, 'maquinaria', PRACTICA, '12 nov 2026'),
    // Mano de obra
    r('L01', 'Jornal de faena, valorizado al salario mínimo general 2026', 'jornal', 315.04, 'mano', 'CONASAMI, salario mínimo general 2026 (DOF 9 dic 2025): $315.04 diarios', '1 ene 2026', 'https://www.elcontribuyente.mx/salario-minimo/', 'La práctica usaba $300, abajo del mínimo de 2026.'),
    r('L02', 'Ayudante o peón', 'jornal', 360, 'mano', 'OneEstimate: $350 a $450 en el Valle de México (en el interior, de 10 a 20% menos); su tabulador de albañilería da $320 a $380', '11 may 2026', OE_MO),
    r('L03', 'Albañil oficial', 'jornal', 560, 'mano', 'Cronoshare, El Pueblito (Qro.): $400 a $560 la jornada; OneEstimate: $650 a $850 en el Valle de México', '16 nov 2026', 'https://www.cronoshare.com.mx/servicios/albaniles/queretaro-de-arteaga/el-pueblito'),
    r('L04', 'Carpintero', 'jornal', 750, 'mano', 'OneEstimate, carpintero de cimbra: $850 a $1,100 en el Valle de México, de 10 a 20% menos en el interior', '11 may 2026', OE_MO),
    r('L05', 'Herrero o soldador', 'jornal', 950, 'mano', 'OneEstimate, soldador estructural: $1,100 a $1,600 en el Valle de México, de 10 a 20% menos en el interior', '11 may 2026', OE_MO),
    r('L06', 'Comida de faena, por persona', 'persona', 80, 'otros', PRACTICA, '12 nov 2026'),
    // Traslados
    r('T01', 'Flete en camioneta, de la cabecera a La Florida', 'viaje', 600, 'flete', PRACTICA, '12 nov 2026'),
    r('T02', 'Gasolina Magna', 'litro', 23.70, 'flete', 'Promedio en Querétaro reportado a la CRE (Azteca Noticias); en Jalpan se vendía a $22.11 en enero', '6 jun 2026', 'https://www.tvazteca.com/aztecanoticias/precio-la-gasolina-en-mexico-para-este-6-junio-para-este-2026/'),
    r('T03', 'Pasaje Arroyo Seco a Jalpan, ida y vuelta', 'pasaje', 160, 'flete', PRACTICA, '12 nov 2026')
  ];
  D.CAT = {}; D.CATALOGO.forEach(function (c) { D.CAT[c.k] = c; });
  // referencia usada por el tabulador de albañilería (para la nota del expediente)
  D.FUENTE_TABULADOR = OE_ALB;

  /* ---------- El expediente: lo que el agente sabe ---------- */
  D.EXPEDIENTE = [
    'EXPEDIENTE DEL PROYECTO · Presa de La Florida (versión del 16 de noviembre de 2026)',
    '',
    '1. Qué es. La Presa de La Florida está en la comunidad de La Florida, municipio de Arroyo Seco, Querétaro, dentro de la Reserva de la Biosfera Sierra Gorda, a minutos del Campus Concá de la UAQ. La gente ya usa la orilla: riego, ganado, pesca, fogatas y paseos de fin de semana; Semana Santa es la temporada fuerte. El proyecto busca mejorar y ampliar un lugar que ya se usa: que la orilla sea un lugar donde dé gusto quedarse, convivir y divertirse. Un vecino lo dijo así en la consulta: «Si no le van a arreglar bien, mejor no le hagan nada».',
    '',
    '2. En qué etapa va. Es un anteproyecto, sin proyecto ejecutivo. Nada está decidido ni tiene dinero. El catálogo se presenta como ideas a ejidatarios (reunión previa el 21 de noviembre de 2026) y a la asamblea ejidal (anuencia buscada en diciembre de 2026). Si aprueban, un comité de la comunidad lleva el proyecto y junta fondos y faenas. La obra va en dos olas: la ola 1, lo que depende de la comunidad, durante 2027; la ola 2, lo que espera dinero y permisos, de noviembre de 2027 a abril de 2028. Los presupuestos sirven para gestionar recursos.',
    '',
    '3. El sitio. Cinco zonas con nombres de la comunidad: El Cedral (sombreado y oscuro, con cedros), el Área abierta, El Vertedor (junto a la cortina; erosión con mucha pendiente y suelo expuesto), El Llanito y El Bordo. Bosque de encino con cedros, tepames y huizaches. El ganado entra a la orilla. Hay un cauce temporal que cruza el camino, con la presa de un lado y el bosque del otro. El estacionamiento se plantea frente a una barda blanca.',
    '',
    '4. Reglas del sitio que no se votan. La orilla es zona federal de la CONAGUA: no se construye en la ribera y lo permanente va arriba de la cota de crecida; el muelle necesita concesión de zona federal (trámite CONAGUA-01-006, unos 60 días hábiles). La Reserva pide autorización de impacto ambiental (LGEEPA, artículo 28; unos 90 días hábiles). No se quita vegetación nativa. La obra se hace en secas (noviembre a mayo) y la siembra al arranque de las lluvias (junio); no se trabaja la última semana de diciembre ni la primera de enero. La seguridad del vertedor y la estructura no se deciden por votación.',
    '',
    '5. Criterios para diseñar y cotizar. Materiales de la región, durables y de bajo mantenimiento, que el comité pueda reparar. Resistentes al ganado, a la fauna, al sol y a la humedad; madera exterior tratada o protegida; nada que se vuele o se oxide pronto. Sombra al poniente. Accesible para personas mayores y niños. Lo que la comunidad sabe hacer (cavar, acarrear, sembrar, limpiar, armar con troncos) va en faena; lo especializado (soldar, carpintería de precisión, instalación solar) se paga.',
    '',
    '6. Los cuatro bolsillos. Autogestión y especie: faenas, lo que da o presta el ejido, cooperación, kermés, el capital semilla de la UAQ; todo valorizado. PROCODES (CONANP): proyecto ecoturístico (palapas, bancas, explanada, letrero, panel de caminatas); solicitud en marzo de 2027, primera ministración hacia junio, todo comprobado al 31 de diciembre de 2027; pone hasta 80% y el grupo 20%; da dinero, no especie. Ayuntamiento de Arroyo Seco: en 2027 apoya en especie (limpia, recolección, maquinaria, materiales); la obra (estacionamiento, cerca de acceso, luminaria, muelle) se paga con su presupuesto 2028 y pide visto bueno de Obras Públicas y de Protección Civil; no hay FAIS en La Florida. CONAFOR: planta nativa y asesoría, solo en especie; no da dinero, ni jornales pagados, ni postes, flete o herramienta.',
    '',
    '7. Regla de la clase para cotizar. Todo lo que se compra se cotiza: tres cotizaciones por cada renglón de $1,000 o más (dos por escrito y de menos de 30 días) y al menos una para lo que cuesta menos. El flete lleva renglón propio. Imponderables de alrededor del 5% de lo que se compra. La faena lleva precio: el jornal se valoriza al menos al salario mínimo general de 2026, $315.04 diarios. Cada cosa vive en un solo bolsillo.',
    '',
    '8. Con los proveedores. Las solicitudes de cotización salen a nombre del «Proyecto comunitario Presa de La Florida». Dicen que sirven para un presupuesto y que no son orden de compra. Piden precio con IVA, flete hasta La Florida, vigencia y tiempo de entrega. En la región hay casas de materiales y ferreterías en Arroyo Seco y Jalpan de Serra, madererías, viveros (CONAFOR y otros), herrerías y renta de maquinaria. No se inventan nombres de negocios.',
    '',
    '9. Rendimientos de referencia para estimar jornales. Son órdenes de magnitud y se confirman con quien hace el trabajo: excavar a mano una cepa en tierra con piedra, de 2 a 3 m³ por jornal; cepa, cajete y siembra de un árbol, de 15 a 25 por jornal; hincar postes de cerco con cepa de 60 cm, de 12 a 20 por jornal; tender tres hilos de alambre de púas, de 100 a 150 m por jornal de una pareja; fajinas de rama en curva de nivel, de 8 a 12 m por jornal; concreto hecho a mano, 1 m³ por cada 3 o 4 jornales; mampostería de piedra, de 1 a 1.5 m³ por jornal de albañil con ayudante; limpiar y nivelar a mano, de 40 a 80 m² por jornal; armar una banca de tablón sobre bases, de 2 a 3 por jornal de carpintero con ayudante; muro de block, de 8 a 12 m² por jornal de albañil.',
    '',
    '10. Ideas que se presentan a los ejidatarios el 21 de noviembre y que no están en el cronograma: columpios (lo que más pidió la consulta), alberca natural al pie del vertedor (su seguridad se revisa antes y no se decide con votos), mural del vertedor, palapa iluminada y camino con lucecitas.'
  ].join('\n');

  /* ---------- Cómo medir en campo ---------- */
  D.COMO_MEDIR = [
    'Largos: cinta de 30 m o pasos contados (un paso adulto mide unos 0.75 m; mide el tuyo antes).',
    'Áreas: largo por ancho del rectángulo que mejor cubra el lugar; si es irregular, pártelo en rectángulos.',
    'Pendiente: nivel de manguera o una regla de 1 m y un nivel; anota cuánto baja en un metro.',
    'Fotos: una desde el mismo punto fijo para el antes y el después, con una persona como escala.',
    'Google Earth: la regla de Google Earth da largos y áreas en planta; sirve para revisar, no sustituye la cinta.'
  ];
})();
