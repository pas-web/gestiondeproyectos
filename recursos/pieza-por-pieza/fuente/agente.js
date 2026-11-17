/* Pieza por pieza · el agente
   Arma los encargos (prompts), los manda a Claude cuando la página vive en Claude
   y lee las respuestas, vengan de Claude o pegadas de otra IA. */
(function () {
  'use strict';
  var D = window.PXP, AG = window.AG = {};

  /* ---------- Dónde vive la página ---------- */
  // window.claude solo existe cuando la página se abre como artifact de Claude.
  AG.entorno = { claude: !!(window.claude && typeof window.claude.use === 'function'), sample: null, descargas: null, imagenes: false, maxImagenes: 0, listo: false };
  AG.alCambiarEntorno = function () {};
  if (AG.entorno.claude) {
    var pend = 2;
    var fin = function () { if (--pend <= 0) { AG.entorno.listo = true; } AG.alCambiarEntorno(); };
    window.claude.use('sample').then(function (s) {
      AG.entorno.sample = s || null;
      if (s && typeof s.limits === 'function') {
        s.limits().then(function (l) {
          AG.entorno.imagenes = !!(l && l.images);
          AG.entorno.maxImagenes = l && l.images ? l.images.maxCount : 0;
          fin();
        }, fin);
      } else fin();
    }, function () { fin(); });
    window.claude.use('downloads').then(function (d) { AG.entorno.descargas = d || null; fin(); }, fin);
  } else {
    AG.entorno.listo = true;
  }
  AG.hayAgente = function () { return !!AG.entorno.sample && !AG.entorno.vetado; };

  /* ---------- Piezas de texto que viajan en los encargos ---------- */
  function actividad(id) {
    var l = (window.PRESA && PRESA.actividades) || [];
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }
  AG.actividad = actividad;
  var BOLS = { AUT: 'Autogestión y especie', PRO: 'PROCODES', MUN: 'Ayuntamiento de Arroyo Seco', CNF: 'CONAFOR' };
  function componente(id) { return D.COMPONENTES.filter(function (c) { return c.id === id; })[0] || null; }

  AG.bloquePieza = function (p) {
    var c = componente(p.componente);
    var l = ['PIEZA QUE SE PRESUPUESTA'];
    l.push('Componente: ' + (c ? c.id + ' · ' + c.nombre : 'sin componente'));
    l.push('Pieza: ' + (p.nombre || 'sin nombre'));
    (p.actividades || []).forEach(function (id) {
      var a = actividad(id);
      if (a) l.push('Actividad del cronograma ' + a.cod + ': ' + a.n + '. Deja: ' + a.p + '. Mes: ' + a.mes + '. Bolsillo previsto: ' + (BOLS[a.f] || 'por definir') + '.');
    });
    if (!(p.actividades || []).length) l.push('Esta pieza no está en el cronograma: es una idea nueva o un ejemplo.');
    if (p.decidido) l.push('Lo que ya se decidió: ' + p.decidido);
    l.push('Lo que propone el equipo: ' + (p.propuesta && p.propuesta.trim() ? p.propuesta.trim() : '(no escribió nada; guíate por la imagen)'));
    return l.join('\n');
  };

  AG.bloqueCatalogo = function () {
    var l = ['CATÁLOGO DE PRECIOS DE LA CLASE (clave | insumo | unidad | precio por unidad en pesos | fuente y fecha)'];
    D.CATALOGO.forEach(function (c) {
      l.push(c.k + ' | ' + c.n + ' | ' + c.u + ' | ' + c.p + ' | ' + (c.o === 'practica' ? 'sin fuente, de la práctica' : c.f.split(';')[0] + ', ' + c.d));
    });
    return l.join('\n');
  };

  AG.bloqueLectura = function (p) {
    var x = p.lectura || {};
    var l = ['LECTURA DE LA FOTO (paso anterior)'];
    if (x.lectura) l.push('Lo que se ve: ' + x.lectura);
    (x.elementos || []).forEach(function (e) { l.push('Elemento ' + e.n + ': ' + e.nombre + (e.nota ? ' (' + e.nota + ')' : '')); });
    if (x.solucion) l.push('Cómo se haría: ' + x.solucion);
    if ((x.alertas || []).length) l.push('Cuidados: ' + x.alertas.join('; '));
    return l.join('\n');
  };

  AG.bloqueRespuestas = function (p) {
    var x = p.lectura || {}, R = p.respuestas || {};
    var l = ['RESPUESTAS DEL EQUIPO'];
    (x.preguntas || []).forEach(function (q) {
      var r = R[q.id] || {}, v = r.valor;
      var tiene = v !== undefined && v !== null && String(v).trim() !== '';
      var txt = tiene ? String(v) + (q.unidad ? ' ' + q.unidad : '') : '(sin respuesta; usa la sugerencia: ' + (q.sugerido || 'ninguna') + ')';
      if (tiene && q.medir && !r.medido) txt += ' (provisional: todavía no se mide en campo)';
      if (tiene && q.medir && r.medido) txt += ' (medido en campo)';
      l.push('- ' + q.texto + ' → ' + txt + (r.nota ? '. Nota: ' + r.nota : ''));
    });
    return l.join('\n');
  };

  /* ---------- Los tres encargos ---------- */
  var FORMA_LECTURA = '{"lectura":"…","elementos":[{"n":1,"nombre":"…","x":0.3,"y":0.6,"nota":"…"}],"solucion":"…","alertas":["…"],"insumos":["…"],"preguntas":[{"id":"p1","texto":"¿…?","tipo":"numero","unidad":"bancas","opciones":[],"sugerido":"10","por_que":"…","medir":false}]}';
  var FORMA_LISTA = '{"supuestos":["…"],"pendientes":["…"],"renglones":[{"n":1,"tipo":"material","que":"Tablón de madera tratada de 2\\" × 4\\" × 8\'","unidad":"pieza","cantidad":22,"calculo":"10 bancas × 2 + 10%","ref":"W05","precio":474,"origen":"catalogo","proveedor":"madereria","forma":"compra","nota":""}]}';

  function pieFormato(forma, pegado) {
    return pegado
      ? 'Responde solo con un bloque de código JSON (```json … ```), sin texto antes ni después, con esta forma:\n' + forma
      : 'Responde solo con un objeto JSON, sin texto antes ni después, con esta forma:\n' + forma;
  }

  AG.encargoLectura = function (p, pegado) {
    var nf = (p.fotos || []).length;
    return [
      'Eres el agente de cotización del proyecto comunitario de la Presa de La Florida. Abajo está el expediente del proyecto: es todo lo que sabes de él. Un equipo de estudiantes de la Licenciatura en Producción Agropecuaria Sustentable de la UAQ va a presupuestar una pieza del catálogo.',
      nf ? (pegado ? 'Te adjunto ' + (nf === 1 ? 'una imagen: el fotomontaje' : nf + ' imágenes; la primera es el fotomontaje') + ' de la pieza. Si no ves la imagen adjunta, pídemela antes de responder.' : 'Va ' + (nf === 1 ? 'una imagen: el fotomontaje' : nf + ' imágenes; la primera es el fotomontaje') + ' de la pieza.') : 'El equipo no mandó imagen: trabaja con su descripción y deja la lista de elementos con x y y en 0.5.',
      '',
      'Lo que tienes que hacer en este paso:',
      '1. Mira la imagen. Numera cada cosa física que habría que comprar, conseguir o construir para esta pieza, de izquierda a derecha, con un máximo de 8. Da su posición aproximada en la primera imagen: x y y entre 0 y 1, desde la esquina superior izquierda. Si la imagen no muestra la pieza, dilo en «lectura».',
      '2. Explica en 3 a 5 frases cómo se construiría, con materiales de la región y bajo mantenimiento, respetando las reglas del sitio.',
      '3. Señala los choques con las reglas del sitio o los riesgos (zona federal, crecidas, ganado, vegetación nativa, seguridad, mantenimiento). Si no hay, deja la lista vacía.',
      '4. Recomienda los insumos que probablemente lleve, sin cantidades ni precios.',
      '5. Haz de 4 a 8 preguntas para poder calcular cantidades. Separa lo que decide el equipo (medir: false) de lo que hay que medir en la orilla (medir: true). Cada pregunta trae una sugerencia razonable y por qué importa. Pregunta cantidades, medidas, materiales y quién hace el trabajo; no preguntes lo que ya dice el expediente.',
      'Todavía no pongas precios. Escribe en español de México, claro y corto.',
      '',
      D.EXPEDIENTE,
      '',
      AG.bloquePieza(p),
      '',
      pieFormato(FORMA_LECTURA, pegado),
      '«tipo» es numero, medida, opcion o texto; en «opcion» llena «opciones».'
    ].join('\n');
  };

  AG.encargoLista = function (p, pegado) {
    return [
      'Eres el agente de cotización del proyecto comunitario de la Presa de La Florida (el expediente va abajo). Ya leíste el fotomontaje de una pieza y el equipo contestó tus preguntas. Ahora arma la lista de todo lo que lleva la pieza, renglón por renglón, con la mano de obra.',
      '',
      'Reglas de la lista:',
      '- Un renglón por insumo, por oficio o por equipo. «n» es el número del elemento de la foto al que pertenece; 0 si es de toda la pieza, como el flete.',
      '- Cantidad calculada con las respuestas, con merma donde aplique (madera 10%, alambre y malla 5%, cemento 5%, piedra 10%). Escribe el cálculo corto en «calculo», por ejemplo «10 bancas × 2 + 10%».',
      '- Mano de obra en jornales (unidad "jornal") con el rendimiento que usaste en «calculo». «forma» es "faena" para lo que la comunidad sabe hacer y "compra" para lo especializado que se paga.',
      '- Lo que se consigue sin pagar lleva su forma: "donado" (la planta de CONAFOR, lo que regala el ejido), "prestado" o "trocado", y también lleva precio, porque se valoriza.',
      '- Precio de referencia por unidad: si el insumo está en el catálogo de la clase, pon su clave en «ref», su precio en «precio» y «origen» "catalogo". Si no está, estima un precio razonable para la Sierra Gorda en noviembre de 2026, deja «ref» vacío y pon «origen» "estimacion". Nunca inventes una fuente ni una tienda.',
      '- Si el catálogo vende por otra unidad (rollo contra metro, millar contra pieza), usa la del catálogo y convierte la cantidad.',
      '- El flete hasta la orilla va en su propio renglón, con «tipo» "flete".',
      '- No pongas imponderables: la página los calcula.',
      '- «proveedor» es uno de: materiales, madereria, vivero, herreria, maquinaria, senaletica, electrico, mano, flete, otros.',
      '- En «supuestos» va lo que diste por hecho y en «pendientes» lo que falta saber.',
      '',
      D.EXPEDIENTE,
      '',
      AG.bloqueCatalogo(),
      '',
      AG.bloquePieza(p),
      '',
      AG.bloqueLectura(p),
      '',
      AG.bloqueRespuestas(p),
      '',
      pieFormato(FORMA_LISTA, pegado),
      '«tipo» es material, mano, equipo o flete. «forma» es compra, faena, donado, prestado o trocado.'
    ].join('\n');
  };

  AG.encargoInvestigar = function (p, renglones) {
    return [
      'Investiga en la web el precio actual en México de estos insumos para un proyecto comunitario en La Florida, Arroyo Seco, Querétaro (Sierra Gorda). Busca primero en tiendas de Querétaro, San Luis Potosí o Hidalgo; si no hay, en tiendas en línea con envío a Arroyo Seco. Para cada uno da el precio por la unidad indicada, la tienda, el lugar, la fecha de consulta y el enlace. Si no lo encuentras, escribe «no encontrado» en precio. No inventes tiendas ni enlaces.',
      '',
      'Responde con una tabla en Markdown con estas columnas, en este orden:',
      '| clave | insumo | unidad | precio | tienda | lugar | fecha | enlace |',
      '',
      'Insumos:',
      renglones.map(function (r) { return '| ' + r.id + ' | ' + r.que + ' | ' + r.unidad + ' |'; }).join('\n')
    ].join('\n');
  };

  /* ---------- Leer respuestas ---------- */
  /* ---------- El plano para quien hace la pieza ---------- */
  AG.oficio = function (id) { return D.OFICIOS.filter(function (o) { return o.id === id; })[0] || D.OFICIOS[3]; };
  function lleno(v) { return String(v == null ? '' : v).trim() !== ''; }
  AG.aPersona = function (x) { return /^el /i.test(x) ? 'al ' + x.slice(3) : 'a ' + x; };
  // Lo que pide el plano: las mismas partes y reglas en Pieza por pieza y en la práctica del presupuesto
  AG.partesPlano = function (quien) {
    return [
      'ENCARGO',
      'Haz el plano como una página para imprimir en tamaño carta (en Claude, como artifact), con los dibujos en SVG, las medidas acotadas y estas partes, en este orden:',
      '1. Ficha: qué es, en una frase; sus medidas clave; el material; lo que hay que comprar, en piezas o tramos que sí se venden; y el peso aproximado.',
      '2. La pieza armada, en una vista que se entienda de un vistazo.',
      '3. Un corte por el centro, con alturas y anchos.',
      '4. La planta, vista desde arriba, con sus medidas.',
      '5. La pieza que se repite, si la hay, sobre una cuadrícula para trazarla a tamaño real.',
      '6. Una tabla de material y cortes: pieza, cantidad, material, largo, forma y lugar. Al final, lo que se compra y cuánto sobra.',
      '7. Notas para ' + quien + ': cómo se toman las medidas (a eje, exteriores o interiores), las uniones, los dobleces o ensambles, los empalmes, el acabado y la protección contra el sol, la humedad y el óxido.',
      '8. Antes de mandarla a hacer: la medida que manda y cómo comprobarla en el lugar, y las decisiones que tomaste y que se pueden cambiar.',
      '9. Preguntas para ' + quien + ': de tres a cinco, para que diga si así funciona y qué cambiaría.',
      '',
      'REGLAS ESTRICTAS',
      '1. Medidas en metros y centímetros; di siempre si son a eje, exteriores o interiores.',
      '2. La tabla de cortes cuadra con lo que se compra: piezas o tramos que sí se venden (tubo de 6 m, tablón de 2.5 m, varilla de 12 m) y lo que sobra.',
      '3. No pongas precios: el precio lo da quien la hace.',
      '4. No garantices que aguanta. Si haces una cuenta de resistencia, di con qué carga la hiciste y pide que el experto la confirme.',
      '5. Respeta lo que te escribí y las reglas del sitio. Lo que propongas tú, márcalo «propuesta».',
      '6. Si te falta un dato para dibujar, pregúntalo antes de empezar.',
      '7. Español llano y frases cortas, con las palabras que usa el oficio.'
    ].join('\n');
  };
  AG.ajustePlano = function (o, quien) {
    return [
      'Llevamos el plano ' + AG.aPersona(lleno(o.quien) ? o.quien.trim() : quien) + '. Esto dijo:',
      lleno(o.dijo) ? o.dijo.trim() : '[[ LO QUE DIJO DEL PLANO ]]',
      '',
      'Ajusta el plano con esto: ' + (lleno(o.ajustes) ? o.ajustes.trim() : '[[ LO QUE HAY QUE AJUSTAR ]]'),
      '',
      'No cambies lo que ya estaba bien. Marca en el plano lo que cambió, actualiza la tabla de material y cortes y lo que se compra, y al final deja una lista corta de los cambios.'
    ].join('\n');
  };
  AG.encargoPlano = function (p) {
    var o = p.plano || {}, of = AG.oficio(o.oficio);
    var rs = ((p.lista && p.lista.renglones) || []).filter(function (r) { return (+r.cantidad || 0) > 0 && r.tipo !== 'flete'; });
    var l = [
      'Eres dibujante técnico y conoces la obra rural en México. Vas a dibujar el plano de una pieza del proyecto comunitario de la Presa de La Florida para que ' + of.persona + ' lo revise, lo cotice y la haga. Abajo van el expediente del proyecto y lo que ya sabemos de la pieza. Trabaja solo con eso; lo que propongas tú, márcalo «propuesta».' +
        ((p.fotos || []).length ? ' Si te adjunto el fotomontaje, úsalo para la forma general; las medidas mandan sobre la foto.' : ''),
      '',
      D.EXPEDIENTE,
      '',
      AG.bloquePieza(p)
    ];
    if (p.lectura) l.push('', AG.bloqueLectura(p), '', AG.bloqueRespuestas(p));
    if (rs.length) {
      l.push('', 'LO QUE LLEVA, SEGÚN LA LISTA DEL EQUIPO');
      rs.forEach(function (r) { l.push('- ' + r.que + ': ' + r.cantidad + ' ' + r.unidad + (r.calculo ? ' (' + r.calculo + ')' : '')); });
    }
    l.push('', 'PARA EL PLANO');
    l.push('- Quién la hace: ' + of.hace);
    l.push('- La medida que manda (la que no se mueve): ' + (lleno(o.manda) ? o.manda.trim() : '[[ LA MEDIDA QUE MANDA ]]'));
    if (lleno(o.respetar)) l.push('- Lo que no debe cambiar: ' + o.respetar.trim());
    l.push('', AG.partesPlano(of.persona));
    return l.join('\n');
  };
  AG.encargoPlanoAjuste = function (p) { var o = p.plano || {}; return AG.ajustePlano(o, AG.oficio(o.oficio).persona); };

  AG.leerJSON = function (texto) {
    var t = String(texto || '').trim();
    if (!t) throw new Error('No hay nada pegado.');
    var m = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
    if (m) t = m[1].trim();
    var a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('No se encontró el bloque de datos. Copia la respuesta completa, desde la primera llave { hasta la última }.');
    t = t.slice(a, b + 1);
    var intentos = [
      function (s) { return s; },
      function (s) { return s.replace(/,\s*([}\]])/g, '$1'); },
      function (s) { return s.replace(/[“”]/g, '"').replace(/,\s*([}\]])/g, '$1'); }
    ], err;
    for (var i = 0; i < intentos.length; i++) {
      try { return JSON.parse(intentos[i](t)); } catch (e) { err = e; }
    }
    throw new Error('La respuesta no se pudo leer (' + (err && err.message ? err.message : 'formato') + '). Pide a la IA que repita su respuesta solo como bloque JSON.');
  };

  function txt(v, max) { v = v == null ? '' : String(v).trim(); return max ? v.slice(0, max) : v; }
  function num(v) { var n = typeof v === 'number' ? v : parseFloat(String(v || '').replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
  function entre(v, a, b) { v = num(v); return Math.max(a, Math.min(b, v)); }
  function lista(v) { return Array.isArray(v) ? v : (v ? [v] : []); }

  AG.normalizarLectura = function (o) {
    if (!o || typeof o !== 'object') throw new Error('La respuesta no trae la lectura de la foto.');
    var el = lista(o.elementos).slice(0, 12).map(function (e, i) {
      return { n: Math.round(num(e.n)) || (i + 1), nombre: txt(e.nombre || e.name, 90) || 'Elemento ' + (i + 1), x: entre(e.x === undefined ? 0.5 : e.x, 0.02, 0.98), y: entre(e.y === undefined ? 0.5 : e.y, 0.03, 0.97), nota: txt(e.nota, 200) };
    });
    // números sin repetir
    var vistos = {};
    el.forEach(function (e, i) { while (vistos[e.n]) e.n++; vistos[e.n] = 1; });
    var qs = lista(o.preguntas).slice(0, 10).map(function (q, i) {
      var tipo = /^(numero|medida|opcion|texto)$/.test(q.tipo) ? q.tipo : (q.opciones && q.opciones.length ? 'opcion' : 'texto');
      return { id: txt(q.id, 12) || ('p' + (i + 1)), texto: txt(q.texto || q.pregunta, 220), tipo: tipo, unidad: txt(q.unidad, 30), opciones: lista(q.opciones).map(function (x) { return txt(x, 60); }).filter(Boolean).slice(0, 8), sugerido: txt(q.sugerido, 80), por_que: txt(q.por_que || q.porque, 240), medir: !!q.medir };
    }).filter(function (q) { return q.texto; });
    var ids = {};
    qs.forEach(function (q, i) { if (ids[q.id]) q.id = 'p' + (i + 1) + 'b'; ids[q.id] = 1; });
    if (!el.length && !qs.length) throw new Error('La respuesta no trae elementos ni preguntas. Vuelve a intentar.');
    return { lectura: txt(o.lectura, 900), elementos: el, solucion: txt(o.solucion, 1400), alertas: lista(o.alertas).map(function (x) { return txt(x, 260); }).filter(Boolean).slice(0, 8), insumos: lista(o.insumos).map(function (x) { return txt(typeof x === 'object' ? (x.insumo || x.nombre) : x, 120); }).filter(Boolean).slice(0, 24), preguntas: qs };
  };

  var TIPOS = { material: 1, mano: 1, equipo: 1, flete: 1 };
  var FORMAS = { compra: 1, faena: 1, donado: 1, prestado: 1, trocado: 1 };
  var PROVS = {}; D.PROVEEDORES.forEach(function (p) { PROVS[p.id] = 1; });
  AG.normalizarLista = function (o, elementos) {
    if (!o || typeof o !== 'object') throw new Error('La respuesta no trae la lista.');
    var ns = {}; (elementos || []).forEach(function (e) { ns[e.n] = 1; });
    var rs = lista(o.renglones).slice(0, 80).map(function (r) {
      var tipo = TIPOS[r.tipo] ? r.tipo : (/jornal/i.test(r.unidad || '') ? 'mano' : 'material');
      var forma = FORMAS[r.forma] ? r.forma : (tipo === 'mano' ? 'faena' : 'compra');
      var ref = txt(r.ref, 6).toUpperCase(); if (ref && !D.CAT[ref]) ref = '';
      var precio = num(r.precio), origen = ref ? 'catalogo' : 'estimacion';
      if (ref && !(precio > 0) && D.CAT[ref].p >= 0) precio = D.CAT[ref].p;
      var prov = PROVS[r.proveedor] ? r.proveedor : (tipo === 'mano' ? 'mano' : tipo === 'flete' ? 'flete' : ref ? D.CAT[ref].t : 'otros');
      var n = Math.round(num(r.n)); if (n && !ns[n]) n = 0;
      return { n: n, tipo: tipo, que: txt(r.que || r.insumo, 140) || 'Sin nombre', unidad: txt(r.unidad, 24) || 'pieza', cantidad: Math.max(0, Math.round(num(r.cantidad) * 100) / 100), calculo: txt(r.calculo, 160), ref: ref, precio: Math.max(0, Math.round(precio * 100) / 100), origen: origen, proveedor: prov, forma: forma, nota: txt(r.nota, 200) };
    }).filter(function (r) { return r.que; });
    if (!rs.length) throw new Error('La respuesta no trae renglones. Vuelve a intentar.');
    return { supuestos: lista(o.supuestos).map(function (x) { return txt(x, 240); }).filter(Boolean).slice(0, 10), pendientes: lista(o.pendientes).map(function (x) { return txt(x, 240); }).filter(Boolean).slice(0, 10), renglones: rs };
  };

  // Tabla en Markdown de la investigación en la web: | clave | insumo | unidad | precio | tienda | lugar | fecha | enlace |
  AG.leerTablaWeb = function (texto) {
    var out = [];
    String(texto || '').split(/\r?\n/).forEach(function (linea) {
      if (linea.indexOf('|') < 0) return;
      var c = linea.split('|').map(function (x) { return x.trim(); });
      if (c[0] === '') c.shift(); if (c[c.length - 1] === '') c.pop();
      if (c.length < 4 || /^:?-+:?$/.test(c[0]) || /^clave$/i.test(c[0])) return;
      var precio = num((c[3] || '').replace(/,/g, ''));
      var enlace = (c[7] || '').replace(/^<|>$/g, '');
      var mm = /\((https?:[^)]+)\)/.exec(enlace); if (mm) enlace = mm[1];
      if (!/^https?:\/\//i.test(enlace)) enlace = '';
      out.push({ id: c[0].replace(/[*`]/g, ''), precio: /no encontrado/i.test(c[3] || '') ? 0 : precio, unidad: c[2] || '', tienda: (c[4] || '').replace(/[*`]/g, ''), lugar: c[5] || '', fecha: c[6] || '', enlace: enlace });
    });
    return out;
  };

  /* ---------- Preguntarle a Claude desde la página ---------- */
  function blobDe(dataURL) {
    var p = dataURL.split(','), mime = (/data:([^;]+)/.exec(p[0]) || [])[1] || 'image/jpeg';
    var bin = atob(p[1]), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: mime });
  }
  AG.MENSAJES = {
    cancelled: '',
    not_granted: 'No se dio permiso a esta página para usar Claude. Puedes copiar el encargo y pegarlo en Claude, ChatGPT o Gemini.',
    sampling_disabled: 'Claude no está disponible en esta cuenta. Copia el encargo y pégalo en otra IA.',
    capability_disabled: 'Esta vista no puede usar a Claude. Copia el encargo y pégalo en otra IA.',
    capability_removed: 'Esta vista no puede usar a Claude. Copia el encargo y pégalo en otra IA.',
    not_declared: 'Esta página ya no tiene permiso de usar a Claude. Copia el encargo y pégalo en otra IA.',
    images_unavailable: 'Esta vista no puede mandar fotos a Claude. Describe la pieza en «Lo que propone el equipo» y vuelve a intentar, o copia el encargo.',
    image_rejected: 'La foto no se pudo mandar. Prueba con otra en JPG o PNG.',
    rate_limited: 'Tu cuenta de Claude llegó a su límite por ahora. Intenta más tarde o copia el encargo a otra IA.',
    session_expired: 'Tu sesión de Claude venció. Vuelve a entrar y repite.',
    refused: 'Claude no respondió a este encargo. Cambia la descripción y vuelve a intentar.',
    invalid_json: 'La respuesta llegó incompleta o sin el formato. Vuelve a intentar.',
    prompt_too_large: 'El encargo quedó demasiado largo. Quita una foto o recorta lo que propone el equipo.',
    empty_completion: 'Claude no escribió nada. Vuelve a intentar.',
    upstream_error: 'Falló la conexión con Claude. Vuelve a intentar.'
  };
  var VETAR = { not_granted: 1, sampling_disabled: 1, capability_disabled: 1, capability_removed: 1, not_declared: 1 };
  AG.preguntar = function (prompt, o) {
    o = o || {};
    var s = AG.entorno.sample;
    if (!s) return Promise.reject({ code: 'capability_disabled', message: 'sin sample' });
    var op = { modelTier: 'default', onText: o.onText, signal: o.signal };
    if (o.fotos && o.fotos.length && AG.entorno.imagenes) op.images = o.fotos.slice(0, AG.entorno.maxImagenes || 1).map(blobDe);
    return s.json(prompt, op).catch(function (e) {
      e = e || {}; var code = e.code || 'upstream_error';
      if (VETAR[code]) AG.entorno.vetado = true;
      throw { code: code, mensaje: AG.MENSAJES[code] !== undefined ? AG.MENSAJES[code] : AG.MENSAJES.upstream_error, texto: e.text || '' };
    });
  };
})();
