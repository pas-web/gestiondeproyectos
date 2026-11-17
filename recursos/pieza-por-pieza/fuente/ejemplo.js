/* Pieza por pieza · el ejemplo armado
   Dos columpios de tronco: lo que más pidió la consulta; se presenta a los ejidatarios y no
   está en el cronograma, así que no es de ningún equipo. La foto es una ilustración.
   Los proveedores son inventados y dicen «de ejemplo». */
(function () {
  'use strict';
  function ilustracion() {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 780" width="1200" height="780">' +
      '<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFD9E6"/><stop offset="1" stop-color="#EEF3EA"/></linearGradient>' +
      '<linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E9DB6"/><stop offset="1" stop-color="#3F7F99"/></linearGradient>' +
      '<linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9B978"/><stop offset="1" stop-color="#8FA25E"/></linearGradient></defs>' +
      '<rect width="1200" height="780" fill="url(#c)"/>' +
      '<path d="M0 300 L170 210 L300 260 L470 170 L640 250 L800 190 L980 260 L1200 200 L1200 420 L0 420Z" fill="#40705A"/>' +
      '<path d="M0 350 L220 290 L420 330 L620 280 L860 330 L1060 300 L1200 330 L1200 430 L0 430Z" fill="#2F5D47"/>' +
      '<rect y="405" width="1200" height="80" fill="url(#a)"/>' +
      '<path d="M120 432 h90 M320 450 h70 M560 438 h110 M820 455 h80 M1010 440 h90" stroke="#9CC6D6" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M0 470 C200 455 420 480 600 468 C820 455 1000 478 1200 465 L1200 780 L0 780Z" fill="url(#p)"/>' +
      // encinos al fondo
      arbol(70, 470, 1.15) + arbol(170, 488, .9) + arbol(1060, 476, 1.2) + arbol(1150, 495, .85) + arbol(985, 492, .8) +
      // cama de grava
      '<ellipse cx="600" cy="655" rx="400" ry="62" fill="#D8CDB4"/><ellipse cx="600" cy="652" rx="372" ry="48" fill="#E3D9C3"/>' +
      piedritas() +
      columpio(250) + columpio(650) +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }
  function arbol(x, y, k) {
    return '<rect x="' + (x - 8 * k) + '" y="' + (y - 70 * k) + '" width="' + 16 * k + '" height="' + 80 * k + '" fill="#6B4A2E"/>' +
      '<circle cx="' + x + '" cy="' + (y - 110 * k) + '" r="' + 62 * k + '" fill="#2F5A3B"/>' +
      '<circle cx="' + (x - 44 * k) + '" cy="' + (y - 84 * k) + '" r="' + 44 * k + '" fill="#3A6B47"/>' +
      '<circle cx="' + (x + 46 * k) + '" cy="' + (y - 88 * k) + '" r="' + 46 * k + '" fill="#356341"/>';
  }
  function piedritas() {
    var o = '', pts = [[300, 640], [360, 668], [450, 630], [520, 676], [610, 640], [700, 670], [780, 636], [860, 664], [930, 646], [400, 690], [820, 692]];
    pts.forEach(function (p) { o += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="7" ry="4" fill="#BFB297"/>'; });
    return o;
  }
  function columpio(x0) {
    var vig = '#7A5232', w = 300, yT = 300, yB = 630, o = '';
    // dos marcos en A
    [x0 + 20, x0 + w - 20].forEach(function (xa) {
      o += '<path d="M' + (xa - 56) + ' ' + yB + ' L' + xa + ' ' + yT + ' L' + (xa + 56) + ' ' + yB + '" stroke="' + vig + '" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      o += '<path d="M' + (xa - 30) + ' 470 L' + (xa + 30) + ' 470" stroke="#8A6040" stroke-width="10" stroke-linecap="round"/>';
    });
    // viga
    o += '<path d="M' + (x0 + 4) + ' ' + (yT + 4) + ' L' + (x0 + w - 4) + ' ' + (yT + 4) + '" stroke="#6E4A2C" stroke-width="24" stroke-linecap="round"/>';
    // dos asientos de llanta con cadena
    [x0 + 105, x0 + 195].forEach(function (xs) {
      o += '<path d="M' + (xs - 24) + ' ' + (yT + 14) + ' L' + (xs - 26) + ' 560 M' + (xs + 24) + ' ' + (yT + 14) + ' L' + (xs + 26) + ' 560" stroke="#8C9496" stroke-width="4"/>';
      o += '<ellipse cx="' + xs + '" cy="568" rx="40" ry="15" fill="#262626"/><ellipse cx="' + xs + '" cy="565" rx="22" ry="6" fill="#4A4A4A"/>';
    });
    return o;
  }

  window.PXP_EJEMPLO = function (hoyISO) {
    function diasAntes(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
    var R = [
      { id: 'r1', n: 1, tipo: 'material', que: 'Tronco de 4 m para los marcos, de poda', unidad: 'pieza', cantidad: 8, calculo: '2 columpios × 2 marcos × 2 troncos', ref: 'W04', precio: 350, origen: 'catalogo', proveedor: 'madereria', forma: 'donado', nota: 'Los dona el ejido de la poda.' },
      { id: 'r2', n: 2, tipo: 'material', que: 'Tronco de 3 m para la viga, de poda', unidad: 'pieza', cantidad: 2, calculo: '1 por columpio', ref: '', precio: 280, origen: 'estimacion', proveedor: 'madereria', forma: 'donado', nota: '' },
      { id: 'r3', n: 1, tipo: 'material', que: 'Cemento gris CPC 30R, bulto de 50 kg', unidad: 'bulto', cantidad: 6, calculo: '8 bases de 0.12 m³ ≈ 1 m³ de concreto, 6 bultos', ref: 'M01', precio: 240, origen: 'catalogo', proveedor: 'materiales', forma: 'compra', nota: '' },
      { id: 'r4', n: 1, tipo: 'material', que: 'Grava de 3/4" para el concreto', unidad: 'm³', cantidad: 1, calculo: 'para 1 m³ de concreto', ref: 'M04', precio: 720, origen: 'catalogo', proveedor: 'materiales', forma: 'compra', nota: '' },
      { id: 'r5', n: 1, tipo: 'material', que: 'Arena de río', unidad: 'm³', cantidad: 0.5, calculo: 'para 1 m³ de concreto', ref: 'M03', precio: 650, origen: 'catalogo', proveedor: 'materiales', forma: 'compra', nota: '' },
      { id: 'r6', n: 4, tipo: 'material', que: 'Grava para la cama que amortigua las caídas', unidad: 'm³', cantidad: 5, calculo: '2 camas de 6 × 2 m × 0.20 m + 5%', ref: 'M04', precio: 720, origen: 'catalogo', proveedor: 'materiales', forma: 'compra', nota: '' },
      { id: 'r7', n: 3, tipo: 'material', que: 'Cadena galvanizada de 1/4"', unidad: 'metro', cantidad: 20, calculo: '4 asientos × 2 tramos × 2.3 m + 5%', ref: '', precio: 95, origen: 'estimacion', proveedor: 'materiales', forma: 'compra', nota: '' },
      { id: 'r8', n: 3, tipo: 'material', que: 'Grillete galvanizado de 3/8"', unidad: 'pieza', cantidad: 16, calculo: '4 asientos × 4', ref: '', precio: 45, origen: 'estimacion', proveedor: 'materiales', forma: 'compra', nota: '' },
      { id: 'r9', n: 2, tipo: 'material', que: 'Perno de ojo galvanizado de 1/2" con tuerca', unidad: 'pieza', cantidad: 8, calculo: '4 asientos × 2', ref: '', precio: 85, origen: 'estimacion', proveedor: 'materiales', forma: 'compra', nota: '' },
      { id: 'r10', n: 3, tipo: 'material', que: 'Llanta reciclada para asiento', unidad: 'pieza', cantidad: 4, calculo: '2 por columpio', ref: '', precio: 50, origen: 'estimacion', proveedor: 'otros', forma: 'donado', nota: 'De una vulcanizadora de la región.' },
      { id: 'r11', n: 1, tipo: 'material', que: 'Aceite para madera exterior, galón', unidad: 'galón', cantidad: 2, calculo: 'dos manos a los 10 troncos', ref: '', precio: 650, origen: 'estimacion', proveedor: 'materiales', forma: 'compra', nota: '' },
      { id: 'r12', n: 0, tipo: 'mano', que: 'Faena: cavar las cepas y colar las bases', unidad: 'jornal', cantidad: 6, calculo: '8 cepas de 0.5 m³ ≈ 4 m³ a 2 m³ por jornal, más el colado', ref: 'L01', precio: 315.04, origen: 'catalogo', proveedor: 'mano', forma: 'faena', nota: '' },
      { id: 'r13', n: 0, tipo: 'mano', que: 'Carpintero: armar marcos y viga', unidad: 'jornal', cantidad: 3, calculo: '2 columpios a 1.5 jornales', ref: 'L04', precio: 750, origen: 'catalogo', proveedor: 'mano', forma: 'compra', nota: '' },
      { id: 'r14', n: 0, tipo: 'mano', que: 'Ayudante del carpintero', unidad: 'jornal', cantidad: 3, calculo: 'uno por jornal de carpintero', ref: 'L02', precio: 360, origen: 'catalogo', proveedor: 'mano', forma: 'compra', nota: '' },
      { id: 'r15', n: 0, tipo: 'equipo', que: 'Renta de revolvedora de un saco', unidad: 'día', cantidad: 1, calculo: 'un día de colado', ref: '', precio: 450, origen: 'estimacion', proveedor: 'maquinaria', forma: 'compra', nota: '' },
      { id: 'r16', n: 0, tipo: 'flete', que: 'Flete de grava, arena y cemento a La Florida', unidad: 'viaje', cantidad: 2, calculo: '6 m³ de grava y arena en dos viajes', ref: 'T01', precio: 600, origen: 'catalogo', proveedor: 'flete', forma: 'compra', nota: '' }
    ];
    return {
      id: 'ejemplo-' + Date.now().toString(36), version: 1, ejemplo: true, paso: 7,
      creada: new Date().toISOString(),
      equipo: { nombres: 'Equipo de ejemplo', contacto: 'Contacto del equipo', telefono: '' },
      componente: '3', piezaId: 'otra', nombre: 'Dos columpios de tronco (ejemplo)', actividades: [],
      decidido: 'Idea de la consulta, la que más se pidió, que se presenta a los ejidatarios el 21 de noviembre; no está en el cronograma.',
      propuesta: 'Dos columpios dobles de tronco en El Llanito, con asientos de llanta, sobre una cama de grava para amortiguar las caídas.',
      fotos: [{ src: ilustracion(), w: 1200, h: 780, ilustracion: true }],
      lectura: {
        origen: 'ejemplo', fecha: hoyISO,
        lectura: 'Se ven dos columpios dobles de tronco en un llano, lejos del agua, con encinos atrás.',
        elementos: [
          { n: 1, nombre: 'Marco de troncos en A (dos por columpio)', x: 0.235, y: 0.62, nota: '' },
          { n: 2, nombre: 'Viga de tronco de arriba', x: 0.35, y: 0.395, nota: '' },
          { n: 3, nombre: 'Columpio con asiento de llanta', x: 0.4, y: 0.735, nota: '' },
          { n: 4, nombre: 'Cama de grava bajo los columpios', x: 0.64, y: 0.86, nota: '' }
        ],
        solucion: 'Cada columpio lleva dos marcos en A de troncos de 4 m, enterrados 80 cm en bases de concreto, y una viga de tronco de 3 m. Los asientos cuelgan de cadena galvanizada con grilletes y pernos de ojo. Debajo va una cama de grava de 20 cm para amortiguar caídas. Los troncos se protegen con aceite para exterior.',
        alertas: ['Arriba de la cota de crecida y lejos del vertedor.', 'Cadenas y grilletes se revisan cada mes: es tarea del comité.'],
        insumos: ['Troncos de 4 m', 'Troncos de 3 m', 'Cemento', 'Grava', 'Arena', 'Cadena galvanizada', 'Grilletes', 'Pernos de ojo', 'Llantas', 'Aceite para madera'],
        preguntas: [
          { id: 'p1', texto: '¿Cuántos columpios dobles van?', tipo: 'numero', unidad: 'columpios', opciones: [], sugerido: '2', por_que: 'Cada columpio doble lleva dos marcos y una viga.', medir: false },
          { id: 'p2', texto: '¿Qué largo tiene el llano donde irían?', tipo: 'medida', unidad: 'm', opciones: [], sugerido: '10', por_que: 'Cada columpio pide unos 6 m de largo libre para el vaivén.', medir: true },
          { id: 'p3', texto: '¿Los troncos se consiguen de poda o se compran?', tipo: 'opcion', unidad: '', opciones: ['De poda, donados', 'Se compran'], sugerido: 'De poda, donados', por_que: 'Cambia el renglón más caro de la pieza.', medir: false },
          { id: 'p4', texto: '¿El asiento es de llanta o de tablón?', tipo: 'opcion', unidad: '', opciones: ['Llanta reciclada', 'Tablón'], sugerido: 'Llanta reciclada', por_que: 'La llanta golpea menos si un niño se cae.', medir: false },
          { id: 'p5', texto: '¿A qué altura queda la viga?', tipo: 'medida', unidad: 'm', opciones: [], sugerido: '2.4', por_que: 'Define el largo de la cadena.', medir: false },
          { id: 'p6', texto: '¿Hay piedra en el suelo donde se cava?', tipo: 'opcion', unidad: '', opciones: ['Sí, mucha', 'Poca', 'No'], sugerido: 'Poca', por_que: 'Cambia los jornales de excavación.', medir: true }
        ]
      },
      respuestas: {
        p1: { valor: '2' }, p2: { valor: '12', medido: true, nota: 'Medido con cinta el sábado.' }, p3: { valor: 'De poda, donados' },
        p4: { valor: 'Llanta reciclada' }, p5: { valor: '2.4' }, p6: { valor: 'Poca', medido: true }
      },
      lista: { origen: 'ejemplo', fecha: hoyISO, supuestos: ['Los troncos de poda llegan secos y sin plaga.', 'El concreto se hace a mano con una revolvedora rentada.'], pendientes: ['Confirmar con el ejido qué troncos de poda hay.'], renglones: R, sig: R.length + 1 },
      imp: 5,
      cotizaciones: [
        { id: 'c1', proveedor: 'Materiales de ejemplo A', grupo: 'materiales', lugar: 'Arroyo Seco', fecha: diasAntes(5), escrito: true, iva: 'incluido', flete: 'aparte', notas: '',
          precios: { r3: 255, r4: 780, r5: 700, r6: 780, r7: 120, r8: 38, r9: 70, r11: 590 } },
        { id: 'c2', proveedor: 'Materiales de ejemplo B', grupo: 'materiales', lugar: 'Jalpan de Serra', fecha: diasAntes(4), escrito: true, iva: 'incluido', flete: 'incluido', notas: 'Flete incluido a partir de 3 m³.',
          precios: { r3: 268, r4: 850, r5: 720, r6: 850, r7: 105, r8: 42, r9: 64, r11: 640 } },
        { id: 'c3', proveedor: 'Ferretería de ejemplo C', grupo: 'materiales', lugar: 'Concá', fecha: diasAntes(3), escrito: false, iva: 'nodice', flete: 'nodice', notas: 'Por WhatsApp.',
          precios: { r3: 249, r7: 135, r8: 35, r9: 80, r11: 610 } },
        { id: 'c4', proveedor: 'Carpintero de ejemplo', grupo: 'mano', lugar: 'La Florida', fecha: diasAntes(2), escrito: true, iva: 'nodice', flete: 'nodice', notas: '',
          precios: { r13: 650, r14: 380 } },
        { id: 'c5', proveedor: 'Carpintero de ejemplo 2', grupo: 'mano', lugar: 'Concá', fecha: diasAntes(2), escrito: true, iva: 'nodice', flete: 'nodice', notas: '',
          precios: { r13: 700, r14: 400 } },
        { id: 'c6', proveedor: 'Fletes de ejemplo', grupo: 'flete', lugar: 'Arroyo Seco', fecha: diasAntes(5), escrito: false, iva: 'nodice', flete: 'nodice', notas: '',
          precios: { r16: 700 } },
        { id: 'c7', proveedor: 'Renta de equipo de ejemplo', grupo: 'maquinaria', lugar: 'Jalpan de Serra', fecha: diasAntes(5), escrito: false, iva: 'nodice', flete: 'nodice', notas: '',
          precios: { r15: 380 } },
        { id: 'c8', proveedor: 'Carpintero de ejemplo 3', grupo: 'mano', lugar: 'Arroyo Seco', fecha: diasAntes(1), escrito: false, iva: 'nodice', flete: 'nodice', notas: 'Por teléfono.',
          precios: { r13: 720, r14: 390 } },
        { id: 'c9', proveedor: 'Fletes de ejemplo 2', grupo: 'flete', lugar: 'Concá', fecha: diasAntes(4), escrito: true, iva: 'nodice', flete: 'nodice', notas: '',
          precios: { r16: 650 } },
        { id: 'c10', proveedor: 'Fletes de ejemplo 3', grupo: 'flete', lugar: 'Jalpan de Serra', fecha: diasAntes(4), escrito: true, iva: 'nodice', flete: 'nodice', notas: '',
          precios: { r16: 760 } },
        { id: 'c11', proveedor: 'Materiales de ejemplo D', grupo: 'materiales', lugar: 'Arroyo Seco', fecha: diasAntes(2), escrito: false, iva: 'incluido', flete: 'aparte', notas: 'Solo materiales de banco.',
          precios: { r4: 760, r5: 690, r6: 760 } }
      ],
      eleccion: {},
      explicaciones: {
        r6: { causas: ['ciudad', 'flete'], texto: 'La grava del catálogo es precio promedio de ciudad; en la región el banco queda lejos y se cobra más.' },
        r13: { causas: ['region'], texto: 'El carpintero de La Florida cobra menos que el promedio de ciudad que trae el catálogo.' },
        r7: { causas: ['producto'], texto: 'La IA estimó la cadena sin fuente; la más barata de la región salió un poco más cara.' },
        r16: { causas: ['flete'], texto: 'El viaje a La Florida es más largo que el del catálogo y el camino es de terracería.' }
      },
      bolsillos: {}, acts: {}
    };
  };
})();
