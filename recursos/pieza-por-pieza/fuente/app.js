/* Pieza por pieza · la página
   Una pregunta a la vez, en ocho tramos: la pieza, las preguntas del agente, la hoja de campo,
   la lista, la precotización, pedir cotizaciones, lo que cotizaron y la partida. A la derecha va
   la hoja del tramo y se ilumina la parte que se está llenando (es la guía de la mochila).
   Los pasos dependen de la pieza: una pregunta del agente es un paso, un número de la foto es
   un paso de la lista, cada proveedor tiene su solicitud. Por eso se dibujan aquí, desde el
   estado, y la guía los vuelve a leer cuando cambia cuántos hay. */
(function () {
  'use strict';
  var D = window.PXP, A = window.AG, $ = M.$, $$ = M.$$, esc = M.esc, L = M.lienzo;
  var ARCH = new M.Archivero('piezas');
  var VERSION = '@VERSION';
  var CLASE = '@CLASE';
  var SITIO = '@SITIO';
  var EN_CLAUDE = '@ENCLAUDE';
  var IAS = [['Claude', 'https://claude.ai/new'], ['ChatGPT', 'https://chatgpt.com/'], ['Gemini', 'https://gemini.google.com/app']];
  var VERDE = '#1E4A36', ARENA = '#E3A23C';
  var PROYECTO = { nombre: 'Proyecto comunitario Presa de La Florida', giro: 'La Florida, Arroyo Seco, Querétaro' };
  var MIME_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  var T = {
    pieza: 'La pieza', preguntas: 'Las preguntas', campo: 'La hoja de campo', lista: 'La lista',
    precot: 'La precotización', pedir: 'Pedir cotizaciones', llegaron: 'Lo que cotizaron', partida: 'La partida'
  };
  var ORDEN_T = [T.pieza, T.preguntas, T.campo, T.lista, T.precot, T.pedir, T.llegaron, T.partida];
  var TITULOS = { 1: 'Ficha de la pieza', 2: 'Lectura de la foto', 3: 'Hoja de campo', 4: 'Lo que lleva la pieza', 5: 'Precotización', 6: 'Solicitud de cotización', 7: 'Partida' };
  // Los archivos de la versión 1 guardan el paso (1 a 7): se abren en el primer paso de ese tramo
  var PRIMERO_DE = { 1: 'equipo', 2: 'leer', 3: 'campo', 4: 'armar', 5: 'ref', 6: 'contacto', 7: 'contraste', 8: 'contraste' };
  var CAUSAS = [
    ['flete', 'Flete'], ['iva', 'IVA'], ['mayoreo', 'Mayoreo o menudeo'], ['calidad', 'Otra calidad o medida'],
    ['ciudad', 'Precio de ciudad'], ['region', 'Precio de la región'], ['cantidad', 'Cantidad mal calculada'],
    ['producto', 'La IA no conocía el producto'], ['otro', 'Otra cosa']
  ];
  var IVA = [['incluido', 'IVA incluido'], ['aparte', 'Más IVA'], ['nodice', 'No dice']];
  var FLETE = [['incluido', 'Flete incluido'], ['aparte', 'Flete aparte'], ['nodice', 'No dice']];

  var P = null;                 // la pieza abierta
  var guia = null;              // la guía de la mochila
  var firma = '';               // los pasos que hay, para saber cuándo volver a dibujarlos
  var hojaPintada = 0;
  var verGrupo = '';            // la solicitud que se ve en la hoja
  var modoCopiar = false;       // aunque haya agente, copiar el encargo
  var trabajando = null;        // { que: 'lectura'|'lista', ctl }
  var errorAgente = null;       // { que, mensaje }
  var agregarPin = false;
  var sePuedeGuardar = true;
  var abierto = { rg: '', cot: {} };   // el renglón que se corrige y la cotización que se llena (por grupo)

  /* ---------- Utilidades ---------- */
  function pesos(n) { return M.pesos(n || 0); }
  function cifra(n) { var v = +n || 0; return v.toLocaleString('es-MX', { maximumFractionDigits: 2 }); }
  function hoy() { return M.hoyISO(); }
  function signo(n) { return n > 0 ? '+' + n : n < 0 ? '\u2212' + Math.abs(n) : '0'; }
  function fecha(iso) { return iso ? M.fecha(iso) : ''; }
  function comp(id) { return D.COMPONENTES.filter(function (c) { return c.id === id; })[0] || null; }
  function prov(id) { return D.PROVEEDORES.filter(function (p) { return p.id === id; })[0] || D.PROVEEDORES[D.PROVEEDORES.length - 1]; }
  function forma(id) { return D.FORMAS.filter(function (f) { return f.id === id; })[0] || D.FORMAS[0]; }
  function tipo(id) { return D.TIPOS.filter(function (t) { return t.id === id; })[0] || D.TIPOS[0]; }
  function bols(id) { return D.BOLSILLOS.filter(function (b) { return b.id === id; })[0] || null; }
  function pieza(id) { return D.PIEZAS.filter(function (p) { return p.id === id; })[0] || null; }
  function act(id) { return A.actividad(id); }
  function actsDe(c) { return ((window.PRESA && PRESA.actividades) || []).filter(function (a) { return a.c === c; }); }
  function opciones(lista, valor, vacio) {
    return (vacio ? '<option value="">' + esc(vacio) + '</option>' : '') + lista.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(valor) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
    }).join('');
  }
  function enClaude() { return A.entorno.claude; }
  function conAgente() { return A.hayAgente() && !modoCopiar; }
  function slug(s) { return M.slug(s || 'pieza') || 'pieza'; }

  function tiene(v) { return String(v == null ? '' : v).trim() !== ''; }
  function minus(s) { s = String(s || ''); return s.charAt(0).toLowerCase() + s.slice(1); }
  function mesLargo(k) { if (!k) return ''; var p = k.split('-'); return ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][+p[1] - 1] + ' de ' + p[0]; }
  function seccion(id) { return id ? $('#secciones [data-paso="' + id + '"]') : null; }
  function codigos() { return (P.actividades || []).map(function (id) { var a = act(id); return a ? a.cod : id; }).join(', '); }

  /* ---------- La pieza: crear, abrir, guardar ---------- */
  function nueva() {
    return {
      id: M.uid(), version: 2, creada: new Date().toISOString(), paso: 1, ejemplo: false,
      equipo: { nombres: '', contacto: '', telefono: '' },
      componente: '', piezaId: '', nombre: '', actividades: [], decidido: '', propuesta: '',
      fotos: [], lectura: null, respuestas: {}, lista: null, imp: 5,
      cotizaciones: [], eleccion: {}, explicaciones: {}, bolsillos: {}, acts: {}
    };
  }
  function normal(p) {
    var v = nueva();
    Object.keys(v).forEach(function (k) { if (p[k] === undefined || (p[k] === null && v[k] !== null)) p[k] = v[k]; });
    p.equipo = Object.assign(v.equipo, p.equipo || {});
    if (p.lista && !p.lista.sig) p.lista.sig = (p.lista.renglones || []).length + 1;
    return p;
  }
  var guardarLuego = M.debounce(function () { guardarYa(); }, 700);
  function guardarYa() {
    if (!P || !sePuedeGuardar) return;
    var ok = ARCH.guardar(P);
    if (!ok) { sePuedeGuardar = false; pintarEstado('Este navegador no guarda: usa «Guardar archivo».'); return; }
    pintarEstado('Guardado en este navegador');
  }
  function pintarEstado(t) { var e = $('#estado'); if (e) e.textContent = t || ''; }
  function probarGuardado() {
    try { localStorage.setItem('pxp:prueba', '1'); localStorage.removeItem('pxp:prueba'); return true; } catch (e) { return false; }
  }
  function abrir(p) {
    if (P && P !== p) guardarYa();
    P = normal(p); ARCH.marcarActual(P.id);
    verGrupo = ''; errorAgente = null; agregarPin = false; abierto = { rg: '', cot: {} };
    if (trabajando && trabajando.ctl) { try { trabajando.ctl.abort(); } catch (e) {} }
    trabajando = null;
    pintarAviso();
    pintarSecciones();
    if (!guia) crearGuia(); else guia.reconstruir();
    guia.abrir({ primero: P.ejemplo ? 'equipo' : (PRIMERO_DE[P.paso] || 'equipo'), sinFoco: true });
    pintarHoja();
    window.scrollTo(0, 0);
  }
  function pintarAviso() {
    $('#aviso-ejemplo').innerHTML = P.ejemplo
      ? '<div class="aviso-ejemplo"><p><b>Esto es un ejemplo armado de principio a fin:</b> dos columpios de tronco, una idea que no está en el cronograma. Recórrelo con «Siguiente» y luego empieza la pieza de tu equipo.</p><button type="button" class="btn chico" data-accion="nueva">' + M.ico.mas + 'Empezar la pieza de mi equipo</button></div>'
      : '';
  }

  /* ---------- Cuentas ---------- */
  function renglones() { return (P.lista && P.lista.renglones) || []; }
  function elementos() { return (P.lectura && P.lectura.elementos) || []; }
  function elemento(n) { return elementos().filter(function (e) { return e.n === n; })[0] || null; }
  function cotsDe(r) {
    return (P.cotizaciones || []).filter(function (c) { return c.precios && +c.precios[r.id] > 0; })
      .map(function (c) { return { c: c, precio: +c.precios[r.id] }; });
  }
  function elegida(r) {
    var cs = cotsDe(r); if (!cs.length) return null;
    var e = P.eleccion && P.eleccion[r.id];
    if (e && e.cot) for (var i = 0; i < cs.length; i++) if (cs[i].c.id === e.cot) return cs[i];
    return cs.slice().sort(function (a, b) { return a.precio - b.precio; })[0];
  }
  function precioReal(r) { var e = elegida(r); return e ? e.precio : null; }
  function precioUso(r, modo) { if (modo === 'real') { var pr = precioReal(r); if (pr != null) return pr; } return +r.precio || 0; }
  function importe(r, modo) { return (+r.cantidad || 0) * precioUso(r, modo); }
  function compras() { return renglones().filter(function (r) { return r.forma === 'compra' && (+r.cantidad || 0) > 0; }); }
  function diasDesde(iso) { if (!iso) return 9999; var d = M.deISO(iso); return d ? Math.floor((Date.now() - d.getTime()) / 864e5) : 9999; }
  function regla(r) {
    var cs = cotsDe(r), pr = precioReal(r), imp = (+r.cantidad || 0) * (pr != null ? pr : (+r.precio || 0));
    var nec = imp >= 1000 ? 3 : 1;
    var escritas = cs.filter(function (x) { return x.c.escrito && diasDesde(x.c.fecha) <= 30; }).length;
    return { nec: nec, tiene: cs.length, escritas: escritas, ok: cs.length >= nec && (nec < 3 || escritas >= 2), importe: imp };
  }
  function sumas(modo) {
    var s = { material: 0, manoPagada: 0, faena: 0, especie: 0, equipo: 0, flete: 0, compras: 0, sinCotizar: 0, sinPrecio: 0 };
    renglones().forEach(function (r) {
      var imp = importe(r, modo);
      if (!(precioUso(r, modo) > 0) && r.ref !== 'C07') s.sinPrecio++;
      if (r.forma === 'compra') {
        s.compras += imp;
        if (r.tipo === 'mano') s.manoPagada += imp; else if (r.tipo === 'equipo') s.equipo += imp; else if (r.tipo === 'flete') s.flete += imp; else s.material += imp;
        if (modo === 'real' && precioReal(r) == null && (+r.cantidad || 0) > 0) s.sinCotizar++;
      } else if (r.forma === 'faena') s.faena += imp;
      else s.especie += imp;
    });
    s.imp = s.compras * (+P.imp || 0) / 100;
    s.dinero = s.compras + s.imp;
    s.enEspecie = s.faena + s.especie;
    s.total = s.dinero + s.enEspecie;
    return s;
  }
  function contraste() {
    return compras().map(function (r) {
      var pr = precioReal(r); if (pr == null) return null;
      var ia = +r.precio || 0, q = +r.cantidad || 0;
      return { r: r, ia: ia, real: pr, dImp: (pr - ia) * q, pct: ia > 0 ? (pr - ia) / ia : null };
    }).filter(Boolean).sort(function (a, b) { return Math.abs(b.dImp) - Math.abs(a.dImp); });
  }
  function tres() { return contraste().filter(function (x) { return Math.abs(x.dImp) >= 1; }).slice(0, 3); }
  function explicada(rid) {
    var e = P.explicaciones && P.explicaciones[rid];
    return !!(e && (e.causas || []).length && String(e.texto || '').trim().length >= 12);
  }
  function grupos() {
    var g = {}, orden = [];
    compras().forEach(function (r) { var k = r.proveedor || 'otros'; if (!g[k]) { g[k] = []; orden.push(k); } g[k].push(r); });
    orden.sort(function (a, b) { return D.PROVEEDORES.indexOf(prov(a)) - D.PROVEEDORES.indexOf(prov(b)); });
    return orden.map(function (k) { return { id: k, p: prov(k), rs: g[k] }; });
  }
  function sinFuente() { return renglones().filter(function (r) { return r.origen === 'estimacion' || (r.ref && D.CAT[r.ref] && D.CAT[r.ref].o === 'practica' && r.origen !== 'web'); }); }
  function preguntas() { return (P.lectura && P.lectura.preguntas) || []; }
  function resp(q) { return (P.respuestas && P.respuestas[q.id]) || {}; }
  function tieneValor(q) { var v = resp(q).valor; return v !== undefined && v !== null && String(v).trim() !== ''; }

  function preguntaPorId(id) { return preguntas().filter(function (q) { return q.id === id; })[0] || null; }
  function grupo(id) { return grupos().filter(function (g) { return g.id === id; })[0] || null; }
  function necGrupo(g) { return g.rs.some(function (r) { return regla(r).nec === 3; }) ? 3 : 1; }
  function cotsDeGrupo(gid) { return (P.cotizaciones || []).filter(function (c) { return c.grupo === gid; }); }
  function esSinFuente(r) { return r.origen === 'estimacion' || (r.ref && D.CAT[r.ref] && D.CAT[r.ref].o === 'practica' && r.origen !== 'web'); }
  function origenDe(r) { return r.origen === 'web' ? 'web' : r.origen === 'estimacion' ? 'estimacion' : (r.ref && D.CAT[r.ref] && D.CAT[r.ref].o === 'practica' ? 'practica' : 'catalogo'); }
  /* Los grupos de la lista: un número de la foto cada uno, y al final lo que es de toda la pieza */
  function gruposLista() {
    var ns = elementos().map(function (e) { return e.n; });
    renglones().forEach(function (r) { if (r.n && ns.indexOf(r.n) < 0) ns.push(r.n); });
    ns.push(0);
    return ns;
  }
  function nombreGrupoLista(n) { var e = elemento(n); return n === 0 ? 'De toda la pieza' : (e ? e.nombre : 'Elemento ' + n); }

  /* ---------- Actividad y bolsillo de cada renglón ---------- */
  function actDe(r) {
    if (P.acts && P.acts[r.id]) return P.acts[r.id];
    var as = P.actividades || []; if (!as.length) return '';
    if (as.length === 1) return as[0];
    return r.tipo === 'mano' ? as[as.length - 1] : as[0];
  }
  function bolsilloDe(r) {
    if (P.bolsillos && P.bolsillos[r.id]) return P.bolsillos[r.id];
    if (r.forma === 'faena') return 'AUT';
    var a = act(actDe(r));
    if (r.forma === 'donado' && a && a.f === 'CNF') return 'CNF';
    if (r.forma !== 'compra') return 'AUT';
    return (a && a.f) || 'AUT';
  }

  /* ---------- Los pasos ---------- */
  function estructura() {
    var l = [], tramo = '', hoja = 1;
    function en(t, h) { tramo = t; hoja = h; }
    function paso(o) { o.tramo = o.tramo || tramo; o.hoja = o.hoja || hoja; l.push(o); }

    en(T.pieza, 1);
    paso({ id: 'equipo', foco: 'equipo', titulo: '¿Quiénes presupuestan esta pieza?', cuerpo: cEquipo });
    paso({ id: 'componente', foco: 'pieza', titulo: '¿De qué componente es?', cuerpo: cComponente, falta: 'el componente' });
    paso({ id: 'pieza', foco: 'pieza cronograma decidido', titulo: '¿Qué pieza les tocó?', cuerpo: cPieza, falta: 'la pieza' });
    paso({ id: 'foto', foco: 'foto', titulo: 'Sube el fotomontaje', cuerpo: cFoto });
    paso({ id: 'propuesta', foco: 'propuesta', titulo: '¿Qué propone tu equipo?', cuerpo: cPropuesta });

    en(T.preguntas, 2);
    paso({ id: 'leer', foco: P.lectura ? 'como cuidados' : 'foto', titulo: P.lectura ? 'El agente ya leyó la foto' : 'Que el agente lea la foto', cuerpo: cLeer, falta: 'la lectura de la foto', seguir: P.lectura ? '' : 'Seguir sin la lectura' });
    if (P.lectura) {
      paso({ id: 'numeros', foco: 'foto elementos', titulo: 'Revisa los números sobre la foto', cuerpo: cNumeros });
      preguntas().filter(function (q) { return !q.medir; }).forEach(function (q) {
        paso({ id: 'pr-' + q.id, foco: 'q-' + q.id, titulo: q.texto, cuerpo: function () { return cPregunta(q, false); } });
      });
    }

    en(T.campo, 3);
    var qm = P.lectura ? preguntas().filter(function (q) { return q.medir; }) : [];
    paso({ id: 'campo', foco: 'medidas como-medir', titulo: !P.lectura ? 'La hoja de campo' : qm.length ? 'Imprime la hoja de campo y ve a medir' : 'No hay nada que medir', cuerpo: cCampo });
    qm.forEach(function (q) { paso({ id: 'md-' + q.id, foco: 'm-' + q.id, titulo: q.texto, cuerpo: function () { return cPregunta(q, true); } }); });

    en(T.lista, 4);
    paso({ id: 'armar', foco: P.lista ? 'supuestos pendientes' : '', titulo: P.lista ? 'La lista está armada' : 'Que el agente arme la lista', cuerpo: cArmar, falta: 'la lista', seguir: P.lista ? '' : 'Seguir sin la lista' });
    if (P.lista) gruposLista().forEach(function (n) {
      paso({ id: 'g-' + n, foco: 'g-' + n, pin: n, titulo: n === 0 ? 'Lo que es de toda la pieza' : nombreGrupoLista(n), cuerpo: function () { return cGrupoLista(n); } });
    });

    en(T.precot, 5);
    paso({ id: 'ref', foco: 'totales', titulo: 'Así queda la precotización', cuerpo: cRef });
    if (P.lista) {
      var sf = sinFuente().length;
      paso({ id: 'sinfuente', foco: 'sinfuente', titulo: sf ? 'Investiga ' + (sf === 1 ? 'el precio' : 'los ' + sf + ' precios') + ' sin fuente' : 'Todos los precios tienen fuente', cuerpo: cSinFuente });
      paso({ id: 'imp', foco: 'imp', titulo: '¿Cuánto guardar para imprevistos?', cuerpo: cImp });
    }

    en(T.pedir, 6);
    var gs = P.lista ? grupos() : [];
    paso({ id: 'contacto', foco: 'contacto', titulo: '¿Quién recibe las cotizaciones?', cuerpo: cContacto });
    gs.forEach(function (g) { paso({ id: 's-' + g.id, grupo: g.id, foco: 'para conceptos', titulo: 'Pide la cotización: ' + g.p.corto, cuerpo: function () { return cSolicitud(g.id); } }); });

    en(T.llegaron, 7);
    gs.forEach(function (g) { paso({ id: 'c-' + g.id, grupo: g.id, foco: 'cot-' + g.id, titulo: 'Lo que cotizaron: ' + g.p.corto, cuerpo: function () { return cCotizaciones(g.id); } }); });
    if (gs.length) paso({ id: 'elegir', foco: 'elegidas', titulo: '¿Con cuál se quedan?', cuerpo: cElegir });

    en(T.partida, 7);
    paso({ id: 'contraste', foco: 'anexo-b', titulo: 'Lo que dijo la IA contra lo que cotizaron', cuerpo: cContraste });
    tres().forEach(function (x, i) { paso({ id: 'd-' + (i + 1), foco: 'dif-' + x.r.id, titulo: x.r.que + ': ¿por qué cambió?', cuerpo: function () { return cDiferencia(i); } }); });
    if (P.lista && (P.actividades || []).length) paso({ id: 'archivo', foco: 'bolsillos', titulo: 'Cada renglón, a su actividad y a su bolsillo', cuerpo: cArchivo });
    paso({ id: 'entregar', foco: 'totales', titulo: 'Entrega la partida', cuerpo: cEntregar });
    return l;
  }
  function tituloHTML(s) {
    return (s.pin !== undefined ? '<span class="n-pin' + (s.pin ? '' : ' cero') + '" aria-hidden="true">' + (s.pin || '·') + '</span> ' : '') + esc(s.titulo);
  }
  function seccionHTML(s) {
    return '<section class="pregunta" data-paso="' + s.id + '" data-tramo="' + esc(s.tramo) + '" data-hoja="' + s.hoja + '" data-foco="' + esc(s.foco || '') + '"' +
      (s.grupo ? ' data-grupo="' + esc(s.grupo) + '"' : '') + (s.falta ? ' data-falta="' + esc(s.falta) + '"' : '') + (s.seguir ? ' data-seguir="' + esc(s.seguir) + '"' : '') + '>' +
      '<h2>' + tituloHTML(s) + '</h2><div class="cuerpo">' + s.cuerpo() + '</div></section>';
  }
  /* Dibuja todos los pasos. La guía los vuelve a leer con reconstruir() */
  function pintarSecciones() {
    var est = estructura(), cont = $('#secciones');
    firma = est.map(function (s) { return s.id; }).join('|');
    cont.innerHTML = est.map(seccionHTML).join('');
    est.forEach(function (s) { montar(s, cont.querySelector('[data-paso="' + s.id + '"]')); });
  }
  function montar(s, el) {
    if (!el) return;
    llenar(el);
    if (s.id === 'numeros') montarPines();
    $$('[data-entregas]', el).forEach(function (c) { M.entregas(c, entregasDe(c.dataset.entregas)); });
    refrescarVivos(el);
  }
  /* Vuelve a dibujar un paso por dentro, sin cambiar cuántos hay */
  function refrescarSeccion(id) {
    var el = seccion(id); if (!el) return;
    var s = estructura().filter(function (x) { return x.id === id; })[0]; if (!s) return;
    var h = el.querySelector('h2'); if (h) h.innerHTML = tituloHTML(s);
    el.dataset.foco = s.foco || '';
    if (s.seguir) el.dataset.seguir = s.seguir; else delete el.dataset.seguir;
    var c = el.querySelector('.cuerpo'), activo = document.activeElement;
    var k = activo && c.contains(activo) && activo.type !== 'radio' ? activo.getAttribute('data-k') : null;
    c.innerHTML = s.cuerpo();
    montar(s, el);
    if (k) enfocar(c.querySelector('[data-k="' + k + '"]'));
  }
  function enfocar(f) { if (!f) return; try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
  /* ¿Cambió cuántos pasos hay? Entonces se dibujan de nuevo y la guía los relee */
  function revisarEstructura() {
    if (!P || !guia) return false;
    var f = estructura().map(function (s) { return s.id; }).join('|');
    if (f === firma) return false;
    var activo = document.activeElement, k = activo && $('#secciones').contains(activo) && activo.type !== 'radio' ? activo.getAttribute('data-k') : null;
    pintarSecciones(); guia.reconstruir();
    if (k) { var sec = seccion(guia.actual()); if (sec) enfocar(sec.querySelector('[data-k="' + k + '"]')); }
    return true;
  }
  /* Después de un cambio que no es tecleo: una opción, un botón */
  function actualizar() {
    if (!guia) return;
    if (!revisarEstructura()) refrescarSeccion(guia.actual());
    pintarHoja(); guia.refrescar(); guardarLuego();
  }
  /* Todo de nuevo: cuando llega la lectura o la lista */
  function rehacerTodo() {
    if (!guia) return;
    pintarSecciones(); guia.reconstruir(); pintarHoja(); guia.refrescar(); guardarYa();
  }
  var pintarHojaLuego = M.debounce(function () { pintarHoja(); }, 220);
  function cambio() { guardarLuego(); pintarHojaLuego(); }

  function crearGuia() {
    guia = M.guia({
      raiz: $('#trabajo'), secciones: $('#secciones'), marco: $('#marco'), panel: $('.panel-hoja'),
      estado: function () { return P; }, guardar: function () { guardarLuego(); },
      listo: listoPaso,
      antesDeMover: revisarEstructura,
      alCambiarPaso: alEntrar
    });
  }
  function alEntrar(id, sec) {
    var n = +sec.dataset.hoja || 1, g = sec.dataset.grupo || '';
    if (n === 6) verGrupo = g || verGrupo || ((grupos()[0] || {}).id || '');
    P.paso = ORDEN_T.indexOf(sec.dataset.tramo) + 1;
    if (id !== 'numeros') agregarPin = false;
    if (abierto.rg && id !== 'g-' + ((renglones().filter(function (r) { return r.id === abierto.rg; })[0] || {}).n)) abierto.rg = '';
    refrescarSeccion(id);
    pintarHoja();
    guia.refrescar();
    guardarLuego();
  }
  function listoPaso(id) {
    var q, g, x;
    switch (id) {
      case 'equipo': return tiene(P.equipo.nombres);
      case 'componente': return !!P.componente;
      case 'pieza': return !!P.nombre;
      case 'foto': return P.fotos.length > 0;
      case 'propuesta': return tiene(P.propuesta);
      case 'leer': return !!P.lectura;
      case 'campo': return P.lectura ? undefined : false;
      case 'armar': return !!P.lista;
      case 'ref': return P.lista ? undefined : false;
      case 'sinfuente': return sinFuente().length ? undefined : true;
      case 'contacto': return tiene(P.equipo.contacto);
      case 'contraste': return contraste().length ? undefined : false;
    }
    if (/^pr-/.test(id)) { q = preguntaPorId(id.slice(3)); return q ? tieneValor(q) : undefined; }
    if (/^md-/.test(id)) { q = preguntaPorId(id.slice(3)); return q ? tieneValor(q) && !!resp(q).medido : undefined; }
    if (/^c-/.test(id)) { g = grupo(id.slice(2)); return g ? g.rs.every(function (r) { return regla(r).ok; }) : undefined; }
    if (/^d-/.test(id)) { x = tres()[+id.slice(2) - 1]; return x ? explicada(x.r.id) : true; }
    return undefined;
  }

  /* ---------- Bloques que se repiten ---------- */
  function falta(texto, paso, boton) {
    return '<p class="falta">' + texto + (paso ? ' <button type="button" class="btn-texto" data-ir="' + paso + '">' + esc(boton) + '</button>' : '') + '</p>';
  }
  function selloModo() {
    var t, cls = 'sello-modo';
    if (!enClaude()) {
      t = 'Sin agente en esta página: el encargo se copia a Claude, ChatGPT o Gemini con la foto, y su respuesta se pega aquí.' +
        (EN_CLAUDE.indexOf('http') === 0 ? ' Para que el agente trabaje aquí mismo, abre <a href="' + EN_CLAUDE + '">la versión en Claude</a>.' : '');
    } else if (!A.entorno.listo && !A.entorno.sample) t = 'Revisando si hay agente…';
    else if (A.hayAgente()) { cls += ' con-agente'; t = 'Con el agente de Claude: usa tu cuenta y la primera vez pide permiso.' + (A.entorno.imagenes ? '' : ' En esta vista no se mandan fotos: trabaja con la descripción.'); }
    else t = 'El agente no está disponible en esta vista. Entra con tu cuenta de Claude, o copia el encargo a otra IA.';
    return '<p class="' + cls + '"><i></i><span>' + t + '</span></p>';
  }
  function pasosEncargo(cual, conFoto) {
    return '<ol class="encargo-pasos">' +
      '<li>Copia el encargo: ya trae lo que el agente sabe del proyecto.<div class="ias"><button type="button" class="btn chico" data-accion="copiar-encargo" data-cual="' + cual + '">' + M.ico.copiar + 'Copiar el encargo</button></div></li>' +
      '<li>Pégalo en una IA' + (conFoto ? ' y adjunta la foto' : '') + '.<div class="ias">' + IAS.map(function (x) { return '<a class="btn claro chico" href="' + x[1] + '" target="_blank" rel="noopener">' + x[0] + '</a>'; }).join('') + '</div></li>' +
      '<li>Copia su respuesta completa y pégala aquí.<textarea id="pegado-' + cual + '" aria-label="La respuesta de la IA" placeholder="Pega aquí la respuesta completa"></textarea><div class="ias"><button type="button" class="btn chico" data-accion="leer-pegado" data-cual="' + cual + '">Leer la respuesta</button></div></li>' +
      '</ol><details class="ver-encargo"><summary>Ver el encargo</summary><pre>' + esc(cual === 'lectura' ? A.encargoLectura(P, true) : A.encargoLista(P, true)) + '</pre></details>';
  }
  function cajaAgente(cual) {
    var h = '<div class="agente">' + selloModo();
    if (trabajando && trabajando.que === cual) {
      h += '<div class="progreso"><span class="punto"></span><span>' + (cual === 'lectura' ? 'Leyendo la foto' : 'Armando la lista') + '. Puede tardar hasta un minuto.</span><button type="button" class="btn claro chico" data-accion="parar">Detener</button></div>';
    } else if (conAgente()) {
      h += '<div class="botones"><button type="button" class="btn" data-accion="claude" data-cual="' + cual + '">' + (cual === 'lectura' ? 'Leer la foto con Claude' : 'Armar la lista con Claude') + '</button><button type="button" class="btn-texto" data-accion="modo-copiar">Prefiero copiar el encargo</button></div>';
    } else {
      h += pasosEncargo(cual, cual === 'lectura' && P.fotos.length);
      if (A.hayAgente()) h += '<p class="nota-chica"><button type="button" class="btn-texto" data-accion="modo-claude">Volver a usar el agente de esta página</button></p>';
    }
    if (errorAgente && errorAgente.que === cual && errorAgente.mensaje) h += '<div class="error-agente">' + esc(errorAgente.mensaje) + '</div>';
    return h + '</div>';
  }
  function fotoPines(editable) {
    var f = P.fotos[0]; if (!f) return '';
    return '<div class="foto-pines' + (editable && agregarPin ? ' agregar' : '') + '"' + (editable ? ' id="fp"' : '') + '><img src="' + f.src + '" alt="El fotomontaje de la pieza">' +
      elementos().map(function (e) {
        return '<button type="button" class="pin" data-n="' + e.n + '" style="left:' + (e.x * 100).toFixed(2) + '%;top:' + (e.y * 100).toFixed(2) + '%" aria-label="Elemento ' + e.n + ': ' + esc(e.nombre) + '. Muévelo con las flechas.">' + e.n + '</button>';
      }).join('') + '</div>';
  }
  function fotoMini(n) {
    var f = P.fotos[0], e = elemento(n); if (!f || !e) return '';
    return '<div class="foto-mini"><img src="' + f.src + '" alt=""><span class="p" style="left:' + (e.x * 100).toFixed(2) + '%;top:' + (e.y * 100).toFixed(2) + '%">' + n + '</span></div>';
  }
  function cifras(l) {
    return '<div class="cifras">' + l.map(function (x) { return '<div class="cifra' + (x[2] ? ' fuerte' : '') + '"><div class="t">' + esc(x[0]) + '</div><div class="v">' + x[1] + '</div></div>'; }).join('') + '</div>';
  }

  /* ---------- 1 · La pieza ---------- */
  function cEquipo() {
    return '<p class="porque">Sus nombres salen en cada hoja que entreguen.</p>' +
      '<div class="campo"><label for="f-nombres">Nombres del equipo</label><input class="grande" type="text" id="f-nombres" data-k="equipo.nombres" data-requerido="los nombres del equipo" placeholder="Por ejemplo: Ana, Luis y Sofía" autocomplete="off"></div>';
  }
  function cComponente() {
    return '<p class="porque">Es la parte del proyecto de la presa en la que trabaja tu equipo.</p><div class="opciones-grandes">' + D.COMPONENTES.map(function (c) {
      return '<button type="button" class="opcion" data-accion="componente" data-id="' + c.id + '" style="--c:' + c.color + '" aria-pressed="' + (P.componente === c.id) + '"><i></i><span class="t">' + esc(c.id + ' · ' + c.corto) + '</span><span class="d">' + esc(c.nombre) + '</span></button>';
    }).join('') + '</div>';
  }
  function cPieza() {
    if (!P.componente) return falta('Primero elige el componente.', 'componente', 'Elegir el componente');
    var ps = D.PIEZAS.filter(function (x) { return x.c === P.componente; });
    var h = '<p class="porque">Cada pieza sale de una actividad del cronograma de la presa. Si su idea no está, elige «Otra pieza».</p><div class="piezas">' + ps.map(function (x) {
      var cods = x.acts.map(function (id) { var a = act(id); return a ? a.cod : id; }).join(', ');
      return '<button type="button" data-accion="pieza" data-id="' + x.id + '" aria-pressed="' + (P.piezaId === x.id) + '">' + esc(x.nombre) + '<span class="cod">' + esc(cods) + '</span></button>';
    }).join('') + '<button type="button" data-accion="pieza" data-id="otra" aria-pressed="' + (P.piezaId === 'otra') + '">Otra pieza<span class="cod">la escriben ustedes</span></button></div>';
    if (P.piezaId === 'otra') {
      var as = actsDe(P.componente);
      h += '<div class="campo" style="margin-top:16px"><label for="f-otra">Nombre de la pieza</label><input class="grande" type="text" id="f-otra" data-k="nombre" placeholder="Por ejemplo: bebedero para el ganado fuera de la orilla"></div>' +
        '<div class="campo" style="margin-top:12px"><label for="f-act">Actividad del cronograma de la que sale</label><select id="f-act" data-accion-cambio="act-otra">' +
        opciones(as.map(function (a) { return [a.id, a.cod + ' · ' + a.n]; }), (P.actividades || [])[0] || '', 'Ninguna: es una idea nueva') + '</select></div>';
    }
    if (P.nombre) {
      h += '<div class="ficha-crono"><p class="rot-ficha">Lo que dice el cronograma</p>';
      if ((P.actividades || []).length) {
        h += '<dl>' + P.actividades.map(function (id) {
          var a = act(id); if (!a) return '';
          var b = bols(a.f);
          return '<dt>' + esc(a.cod) + '</dt><dd>' + esc(a.n) + '. <span class="ayuda">Deja: ' + esc(a.p) + ' · ' + esc(mesLargo(a.mes)) + (b ? ' · ' + esc(b.corto) : '') + '</span></dd>';
        }).join('') + '</dl>';
      } else h += '<p class="ayuda" style="margin:0">Esta pieza no está en el cronograma: se presupuesta igual, pero no se lleva a ningún archivo del equipo.</p>';
      if (P.decidido) h += '<p style="margin:10px 0 0"><b>Lo que ya se decidió.</b> ' + esc(P.decidido) + '</p>';
      h += '</div>';
    }
    return h;
  }
  function cFoto() {
    var h = '<p class="porque">La primera foto es la que el agente numera. Sirven el fotomontaje que hicieron con Gemini y fotos del lugar, hasta tres.</p>';
    if (P.fotos.length) h += '<div class="fotos">' + P.fotos.map(function (f, i) {
      return '<figure><img src="' + f.src + '" alt="Foto ' + (i + 1) + '"><figcaption>' + (i === 0 ? 'La que se numera' : 'Foto ' + (i + 1)) + (f.ilustracion ? ' · ilustración' : '') + '</figcaption><button type="button" class="quitar" data-accion="quitar-foto" data-i="' + i + '" aria-label="Quitar la foto ' + (i + 1) + '">×</button></figure>';
    }).join('') + '</div>';
    if (P.fotos.length < 3) h += '<label class="btn' + (P.fotos.length ? ' claro' : '') + ' subir">' + M.ico.mas + (P.fotos.length ? 'Agregar otra foto' : 'Subir el fotomontaje') + '<input type="file" accept="image/*" multiple data-accion-archivo="fotos"></label>';
    if (!P.fotos.length) h += '<p class="nota-chica">Sin foto el agente trabaja con lo que propone el equipo, pero numerar sobre la foto es lo que vuelve clara la lista.</p>';
    return h;
  }
  function cPropuesta() {
    return '<p class="porque">En dos líneas: qué material, cuántas y dónde. Con eso y la foto, el agente arranca.</p>' +
      '<textarea class="grande" id="f-prop" data-k="propuesta" rows="3" data-requerido="lo que propone el equipo" aria-label="Lo que propone el equipo" placeholder="Por ejemplo: diez bancas de tablón sobre bases de piedra, a la sombra de los encinos de El Llanito."></textarea>';
  }

  /* ---------- 2 · Las preguntas ---------- */
  function cLeer() {
    if (!P.lectura) {
      if (!P.nombre) return falta('Primero elige la pieza.', 'pieza', 'Elegir la pieza');
      var h = '<p class="porque">Mira el fotomontaje con lo que sabe del proyecto, numera lo que hay que cotizar, dice cómo se haría y te pregunta lo que necesita para sacar cantidades.</p>';
      if (!P.fotos.length) h += falta('No hay foto: el agente trabaja con lo que propone el equipo.', 'foto', 'Subir la foto');
      return h + cajaAgente('lectura');
    }
    var L = P.lectura;
    var r = (L.lectura ? '<p class="lectura-texto">' + esc(L.lectura) + '</p>' : '') +
      (L.solucion ? '<h3>Cómo se haría</h3><p class="lectura-texto">' + esc(L.solucion) + '</p>' : '') +
      (L.alertas && L.alertas.length ? '<h3>Cuidados</h3><ul class="alertas">' + L.alertas.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' : '') +
      (L.insumos && L.insumos.length ? '<h3>Lo que probablemente lleve</h3><div class="insumos">' + L.insumos.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' : '');
    var nq = preguntas().length;
    return r + '<p class="nota-chica">' + (L.origen === 'claude' ? 'Lo leyó Claude en esta página' : L.origen === 'ejemplo' ? 'Lectura del ejemplo' : 'Respuesta pegada de otra IA') + ': ' + elementos().length + ' números sobre la foto y ' + nq + (nq === 1 ? ' pregunta' : ' preguntas') + '. <button type="button" class="btn-texto" data-accion="volver-leer">Volver a leer la foto</button></p>';
  }
  function cNumeros() {
    var h = '<p class="porque">Cada número es algo que se cotiza. ' + (P.fotos.length ? 'Arrastra el que quedó fuera de lugar y' : 'Revisa la lista y') + ' corrige el nombre si hace falta.</p>';
    if (P.fotos.length) h += fotoPines(true) +
      '<div class="herr-foto"><button type="button" class="btn claro chico" data-accion="agregar-pin" aria-pressed="' + agregarPin + '">' + (agregarPin ? 'Listo, ya no agregar' : M.ico.mas + 'Agregar un número') + '</button><span>' + (agregarPin ? 'Toca la foto donde va el número nuevo.' : 'Los números se arrastran con el dedo o el ratón.') + '</span></div>';
    h += '<ul class="elementos">' + elementos().map(function (e, i) {
      return '<li><span class="n-pin">' + e.n + '</span><input type="text" data-k="lectura.elementos.' + i + '.nombre" aria-label="Nombre del elemento ' + e.n + '"><button type="button" class="quitar" data-accion="quitar-el" data-n="' + e.n + '" aria-label="Quitar el elemento ' + e.n + '">×</button></li>';
    }).join('') + '</ul>';
    if (!P.fotos.length) h += '<p class="nota-chica"><button type="button" class="btn-texto" data-accion="agregar-el">Agregar un elemento</button></p>';
    return h;
  }
  function cPregunta(q, enCampo) {
    var r = 'respuestas.' + q.id, id = 'in-' + q.id + (enCampo ? '-c' : ''), h = '', campo;
    if (q.por_que) h += '<p class="porque">' + esc(q.por_que) + '</p>';
    if (q.tipo === 'opcion' && q.opciones.length && q.opciones.length <= 5) {
      campo = '<div class="opciones-q" role="radiogroup" aria-label="' + esc(q.texto) + '">' + q.opciones.map(function (o, i) {
        return '<label><input type="radio" name="' + id + '" value="' + esc(o) + '" data-k="' + r + '.valor"' + (String(resp(q).valor) === o ? ' checked' : '') + '><span>' + esc(o) + '</span></label>';
      }).join('') + '</div>';
    } else if (q.tipo === 'opcion' && q.opciones.length) {
      campo = '<div class="resp-grande"><select class="grande" id="' + id + '" data-k="' + r + '.valor" aria-label="' + esc(q.texto) + '">' + opciones(q.opciones.map(function (o) { return [o, o]; }), resp(q).valor, 'Elige') + '</select></div>';
    } else {
      campo = '<div class="resp-grande"><input class="grande" type="text" id="' + id + '" data-k="' + r + '.valor"' + (q.tipo === 'numero' || q.tipo === 'medida' ? ' inputmode="decimal"' : '') + ' aria-label="' + esc(q.texto) + '" placeholder="' + esc(q.sugerido || '') + '">' + (q.unidad ? '<span class="u">' + esc(q.unidad) + '</span>' : '') + '</div>';
    }
    h += campo;
    if (q.sugerido && !(q.tipo === 'opcion' && q.opciones.length && q.opciones.length <= 5)) {
      h += '<div class="ejemplos"><span>El agente sugiere</span><button type="button" data-accion="sugerencia" data-id="' + q.id + '">' + esc(q.sugerido + (q.unidad ? ' ' + q.unidad : '')) + '</button></div>';
    } else if (q.sugerido) h += '<p class="nota-chica">El agente sugiere: ' + esc(q.sugerido) + '.</p>';
    if (enCampo) {
      h += '<label class="palomita grande-p"><input type="checkbox" data-k="' + r + '.medido"> Ya se midió en la orilla</label>' +
        '<div class="campo"><label for="' + id + '-n">¿Cómo se midió?</label><input type="text" id="' + id + '-n" data-k="' + r + '.nota" placeholder="Con cinta, con pasos, en Google Earth…"></div>';
      if (!resp(q).medido) h += '<p class="nota-chica">Mientras no se mida, la lista usa lo que pongan o la sugerencia, y la marca como provisional.</p>';
    }
    return h;
  }

  /* ---------- 3 · La hoja de campo ---------- */
  function cCampo() {
    if (!P.lectura) return falta('La hoja de campo sale de las preguntas del agente.', 'leer', 'Ir a la lectura');
    var qs = preguntas().filter(function (q) { return q.medir; });
    if (!qs.length) return '<p class="porque">El agente no pidió medidas para esta pieza. Si algo se debe medir, agrégalo a la propuesta y vuelve a leer la foto; si no, sigue a la lista.</p>';
    return '<p class="porque">' + (qs.length === 1 ? 'Hay una cosa que se mide' : 'Hay ' + qs.length + ' cosas que se miden') + ' en la orilla. Imprime la hoja, ve a medir con el equipo y luego anota aquí lo que salió, una por una.</p>' +
      '<ol class="por-medir">' + qs.map(function (q) { return '<li>' + esc(q.texto) + (q.unidad ? ' <span class="ayuda">en ' + esc(q.unidad) + '</span>' : '') + '</li>'; }).join('') + '</ol>' +
      '<details class="mas"><summary>Cómo medir</summary><ul class="supuestos">' + D.COMO_MEDIR.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>' +
      '<div data-entregas="campo" style="margin-top:18px"></div>';
  }

  /* ---------- 4 · La lista ---------- */
  function cArmar() {
    if (!P.lectura) return falta('Primero el agente tiene que leer la foto.', 'leer', 'Ir a la lectura');
    if (!P.lista) {
      var h = '<p class="porque">Con tus respuestas calcula cantidades con merma, la mano de obra en jornales y el flete, y le pone a cada renglón un precio de referencia del catálogo de la clase.</p>';
      var prov2 = preguntas().filter(function (q) { return q.medir && !resp(q).medido; }), sin = preguntas().filter(function (q) { return !tieneValor(q); });
      if (prov2.length) h += falta('Hay ' + (prov2.length === 1 ? 'una medida que todavía no se toma' : prov2.length + ' medidas que todavía no se toman') + ': la lista saldrá con lo que pusieron o con la sugerencia, como provisional.', 'md-' + prov2[0].id, 'Ir a medir');
      if (sin.length) h += falta((sin.length === 1 ? 'Una pregunta sin contestar usa' : sin.length + ' preguntas sin contestar usan') + ' la sugerencia del agente.', (sin[0].medir ? 'md-' : 'pr-') + sin[0].id, 'Contestar');
      return h + cajaAgente('lista');
    }
    var Ls = P.lista, ng = gruposLista().length;
    var r = '<div class="asi-va"><span>' + renglones().length + ' renglones en ' + ng + ' grupos, de referencia</span><b>' + pesos(sumas('ia').total) + '</b></div>';
    if ((Ls.supuestos || []).length) r += '<h3>Lo que el agente dio por hecho</h3><ul class="supuestos">' + Ls.supuestos.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    if ((Ls.pendientes || []).length) r += '<h3>Lo que falta saber</h3><ul class="supuestos">' + Ls.pendientes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    return r + '<p class="nota-chica">Ahora se revisa grupo por grupo, con los números de la foto. <button type="button" class="btn-texto" data-accion="rehacer-lista">Volver a armar la lista</button></p>';
  }
  function cGrupoLista(n) {
    var idx = []; renglones().forEach(function (r, i) { if (r.n === n) idx.push(i); });
    var h = '<p class="porque">' + (n === 0 ? 'Mano de obra, herramienta y flete: lo que es de toda la pieza y no de un solo número.' : 'Revisa cada renglón: qué es, cuánto, cómo se consigue y quién lo vende. Corrige lo que no cuadre.') + '</p>';
    if (n) h += fotoMini(n);
    if (!idx.length) h += '<p class="rg-vacio">' + (n === 0 ? 'No hay renglones de toda la pieza.' : 'Este número no lleva renglones. Si sí lleva algo, agrégalo.') + '</p>';
    h += '<div class="revision">' + idx.map(function (i) { return tarjetaRenglon(renglones()[i], i); }).join('') + '</div>';
    h += '<p class="agregar-aqui"><button type="button" class="btn claro chico" data-accion="agregar-rg" data-n="' + n + '">' + M.ico.mas + 'Agregar un renglón aquí</button></p>';
    if (idx.length) h += '<div class="asi-va"><span>Este grupo, de referencia</span><b data-vivo="sub:' + n + '"></b></div>';
    return h;
  }
  function tarjetaRenglon(r, i) {
    if (abierto.rg === r.id) return editorRenglon(r, i);
    var pv = r.forma === 'compra' ? prov(r.proveedor).corto : '';
    return '<div class="rv"><div class="rv-cuerpo"><div class="rv-t">' + esc(r.que || 'Renglón sin nombre') + '</div>' +
      '<div class="rv-d"><b>' + cifra(r.cantidad) + ' ' + esc(r.unidad) + '</b> · ' + esc(tipo(r.tipo).nombre) + ' · ' + esc(forma(r.forma).nombre) + (pv ? ' · ' + esc(pv) : '') + '</div>' +
      (r.calculo ? '<div class="rv-c">' + esc(r.calculo) + '</div>' : '') + '</div>' +
      '<button type="button" class="btn-texto" data-accion="abrir-rg" data-id="' + r.id + '">Corregir</button></div>';
  }
  function editorRenglon(r, i) {
    var k = 'lista.renglones.' + i + '.';
    return '<div class="rv abierto" data-sin-enter>' +
      '<div class="campo"><label for="e-que">Qué es</label><input type="text" id="e-que" data-k="' + k + 'que"></div>' +
      '<div class="ed-tres"><div class="campo"><label for="e-cant">Cantidad</label><input type="text" id="e-cant" inputmode="decimal" data-tipo="num" data-k="' + k + 'cantidad"></div>' +
      '<div class="campo"><label for="e-uni">Unidad</label><input type="text" id="e-uni" data-k="' + k + 'unidad"></div>' +
      '<div class="campo"><label for="e-tipo">Tipo</label><select id="e-tipo" data-k="' + k + 'tipo">' + opciones(D.TIPOS.map(function (t) { return [t.id, t.nombre]; }), r.tipo) + '</select></div></div>' +
      '<div class="ed-dos"><div class="campo"><label for="e-forma">Cómo se consigue</label><select id="e-forma" data-k="' + k + 'forma">' + opciones(D.FORMAS.map(function (f) { return [f.id, f.nombre]; }), r.forma) + '</select></div>' +
      '<div class="campo"><label for="e-prov">Quién lo vende o lo hace</label><select id="e-prov" data-k="' + k + 'proveedor">' + opciones(D.PROVEEDORES.map(function (p) { return [p.id, p.corto]; }), r.proveedor) + '</select></div></div>' +
      '<div class="campo"><label for="e-calc">Cómo se calculó</label><input type="text" id="e-calc" data-k="' + k + 'calculo" placeholder="Por ejemplo: 10 bancas × 2 bases + 10%"></div>' +
      '<div class="rg-botones"><button type="button" class="btn chico" data-accion="cerrar-rg">Listo</button><button type="button" class="btn-texto peligro" data-accion="quitar-rg" data-id="' + r.id + '">Quitar este renglón</button></div></div>';
  }

  /* ---------- 5 · La precotización ---------- */
  function cRef() {
    if (!P.lista) return falta('Primero hay que armar la lista.', 'armar', 'Ir a la lista');
    var s = sumas('ia'), cuenta = { catalogo: 0, web: 0, estimacion: 0, practica: 0 };
    renglones().forEach(function (r) { cuenta[origenDe(r)]++; });
    var n = renglones().length || 1, nombres = { catalogo: 'Catálogo de la clase', web: 'De la web, con fuente', practica: 'Práctica, sin fuente', estimacion: 'Estimación de la IA' };
    var orden = ['catalogo', 'web', 'practica', 'estimacion'].filter(function (k) { return cuenta[k]; });
    return '<p class="porque">Es el precio de referencia de cada renglón y de dónde sale. Sirve para medir lo que cotice tu equipo: no es el presupuesto.</p>' +
      cifras([['Total de referencia', pesos(s.total), true], ['En dinero', pesos(s.dinero)], ['En especie y faena', pesos(s.enEspecie)]]) +
      '<h3>De dónde salen los precios</h3><div class="barra-origen" aria-hidden="true">' + orden.map(function (k) { return '<i class="' + k + '" style="flex:' + cuenta[k] + '"></i>'; }).join('') + '</div>' +
      '<ul class="leyenda-origen">' + orden.map(function (k) { return '<li><span class="origen ' + k + '">' + nombres[k] + '</span> ' + cuenta[k] + (cuenta[k] === 1 ? ' renglón' : ' renglones') + '</li>'; }).join('') + '</ul>' +
      '<p class="nota-chica">De ' + n + ' renglones, ' + (cuenta.estimacion + cuenta.practica) + ' no tienen fuente todavía.</p>';
  }
  function cSinFuente() {
    var sf = sinFuente();
    if (!sf.length) return '<p class="porque">Todos los precios salen del catálogo de la clase o de la web, con su fuente.</p>';
    return '<p class="porque">Son estimaciones de la IA o precios de la práctica sin fuente. Una IA con búsqueda en la web los encuentra con su tienda y su fecha.' + (enClaude() ? ' El agente de esta página no navega, así que este encargo va a un chat.' : '') + '</p>' +
      '<ul class="sin-fuente">' + sf.map(function (r) { return '<li><span>' + esc(r.que) + '</span><b>' + pesos(r.precio) + ' por ' + esc(r.unidad) + '</b></li>'; }).join('') + '</ul>' +
      '<ol class="encargo-pasos"><li>Copia el encargo de investigación.<div class="ias"><button type="button" class="btn chico" data-accion="copiar-investigar">' + M.ico.copiar + 'Copiar el encargo</button></div></li>' +
      '<li>Pégalo en una IA con búsqueda en la web.<div class="ias">' + IAS.map(function (x) { return '<a class="btn claro chico" href="' + x[1] + '" target="_blank" rel="noopener">' + x[0] + '</a>'; }).join('') + '</div></li>' +
      '<li>Pega aquí la tabla que te devuelva.<textarea id="pegado-web" aria-label="La tabla de precios" placeholder="| clave | insumo | unidad | precio | tienda | lugar | fecha | enlace |"></textarea><div class="ias"><button type="button" class="btn chico" data-accion="leer-tabla">Leer la tabla</button></div></li></ol>' +
      '<p class="nota-chica">Si no los investigan, la precotización sale con esos precios marcados como sin fuente.</p>';
  }
  function cImp() {
    var s = sumas('ia');
    return '<p class="porque">Los imponderables cubren lo que falte en la obra: un bulto de más, un flete que sube. Se calculan sobre lo que se compra, que de referencia son ' + pesos(s.compras) + '.</p>' +
      '<div class="opciones-imp" role="radiogroup" aria-label="Imponderables">' + [0, 3, 5, 8, 10].map(function (v) {
        return '<label><input type="radio" name="imp" value="' + v + '" data-k="imp" data-tipo="num"' + (+P.imp === v ? ' checked' : '') + '><span><b>' + (v ? v + '%' : 'Nada') + '</b><small>' + (v ? pesos(s.compras * v / 100) : 'sin guardar') + '</small></span></label>';
      }).join('') + '</div>' +
      '<div class="asi-va"><span>La precotización queda en</span><b>' + pesos(s.total) + '</b></div>';
  }

  /* ---------- 6 · Pedir cotizaciones ---------- */
  function cContacto() {
    if (!P.lista) return falta('Las solicitudes salen de lo que se compra en la lista.', 'armar', 'Ir a la lista');
    var gs = grupos();
    return '<p class="porque">Las solicitudes llevan su nombre y su teléfono para que los proveedores le contesten. Puede ser alguien del equipo.</p>' +
      '<div class="campo"><label for="f-contacto">Quién recibe las cotizaciones</label><input class="grande" type="text" id="f-contacto" data-k="equipo.contacto" data-requerido="quién recibe las cotizaciones" placeholder="Nombre" autocomplete="off"></div>' +
      '<div class="campo"><label for="f-tel">Su WhatsApp o teléfono</label><input class="grande" type="tel" id="f-tel" data-k="equipo.telefono" inputmode="tel" placeholder="10 dígitos"></div>' +
      (gs.length ? '<p class="nota-chica">Van a salir ' + (gs.length === 1 ? 'una solicitud' : gs.length + ' solicitudes') + ', una por tipo de proveedor: ' + gs.map(function (g) { return g.p.corto.toLowerCase(); }).join(', ') + '.</p>'
        : falta('No hay nada que se compre en la lista: todo va en faena o en especie.', 'armar', 'Revisar la lista'));
  }
  function cSolicitud(gid) {
    var g = grupo(gid); if (!g) return '';
    var nec = necGrupo(g), caros = g.rs.filter(function (r) { return regla(r).nec === 3; });
    return '<p class="porque">' + (g.rs.length === 1 ? 'Un concepto' : g.rs.length + ' conceptos') + ', con cantidad y unidad. El precio lo pone el proveedor.</p>' +
      '<ul class="conceptos">' + g.rs.map(function (r) { return '<li><span>' + esc(r.que) + '</span><b>' + cifra(r.cantidad) + ' ' + esc(r.unidad) + '</b></li>'; }).join('') + '</ul>' +
      '<div class="regla-caja' + (nec === 3 ? ' tres' : '') + '"><b>' + (nec === 3 ? 'Pídela a tres proveedores.' : 'Con un proveedor basta.') + '</b> ' +
      (nec === 3 ? (caros.length === 1 ? esc(caros[0].que) + ' pasa' : caros.length + ' conceptos pasan') + ' de mil pesos: la regla de la clase pide tres cotizaciones, dos por escrito y de menos de 30 días.' : 'Ningún concepto pasa de mil pesos: la regla de la clase pide una cotización.') + '</div>' +
      '<div data-entregas="sol-' + gid + '" style="margin-top:16px"></div>';
  }

  /* ---------- 7 · Lo que cotizaron ---------- */
  function cCotizaciones(gid) {
    var g = grupo(gid); if (!g) return '';
    var cs = cotsDeGrupo(gid), nec = necGrupo(g), ab = abierto.cot[gid], i = -1;
    P.cotizaciones.forEach(function (c, j) { if (c.id === ab) i = j; });
    var h = '<p class="porque">Registra cada cotización que llegue: de quién es y cuánto pidió por cada concepto. ' + (nec === 3 ? 'Para esta solicitud se necesitan tres, dos por escrito.' : 'Para esta solicitud basta una.') + '</p>';
    if (i >= 0) h += editorCot(P.cotizaciones[i], i, g, cs.indexOf(P.cotizaciones[i]) + 1);
    if (cs.length) h += '<p class="rg-van">' + (cs.length === 1 ? 'Ya hay una' : 'Ya van ' + cs.length) + '</p><ol class="rg-lista">' + cs.map(function (c, j) {
      var n = g.rs.filter(function (r) { return +(c.precios || {})[r.id] > 0; }).length, tot = g.rs.reduce(function (a, r) { var v = +(c.precios || {})[r.id] || 0; return a + v * (+r.cantidad || 0); }, 0);
      return '<li class="rg-fila' + (c.id === ab ? ' actual' : '') + '"><span class="rg-n">' + (j + 1) + '</span><span class="rg-t' + (c.proveedor ? '' : ' vacio-t') + '">' + esc(c.proveedor || 'Sin nombre todavía') + '</span>' +
        '<span class="rg-d">' + esc([M.fechaCorta(c.fecha), c.escrito ? 'por escrito' : 'de palabra', n + ' de ' + g.rs.length + ' conceptos', tot ? pesos(tot) : ''].filter(Boolean).join(' · ')) + '</span>' +
        '<span class="rg-a">' + (c.id === ab ? '<span class="rg-aqui">aquí</span>' : '<button type="button" data-accion="abrir-cot" data-g="' + gid + '" data-id="' + c.id + '">Cambiar</button>') + '</span></li>';
    }).join('') + '</ol>';
    h += '<p class="agregar-aqui"><button type="button" class="btn' + (cs.length ? ' claro' : '') + '" data-accion="agregar-cot" data-g="' + gid + '">' + M.ico.mas + (cs.length ? 'Agregar otra cotización' : 'Registrar la primera cotización') + '</button></p>';
    h += '<h3>Cómo va la regla</h3><ul class="regla-lista">' + g.rs.map(function (r) { return '<li><span class="t">' + esc(r.que) + '</span><span data-vivo="regla:' + r.id + '">' + reglaChip(r) + '</span></li>'; }).join('') + '</ul>';
    return h;
  }
  function editorCot(c, i, g, pos) {
    var k = 'cotizaciones.' + i + '.';
    return '<div class="rg-editor" data-sin-enter><p class="rg-cual">Cotización ' + pos + '</p>' +
      '<div class="campo"><label for="c-prov">De quién es</label><input class="grande" type="text" id="c-prov" data-k="' + k + 'proveedor" placeholder="Nombre de la tienda o de la persona" autocomplete="off"></div>' +
      '<div class="envoltura"><table class="tp precios-cot"><thead><tr><th>Concepto</th><th class="num">Precio unitario</th><th class="num">Importe</th></tr></thead><tbody>' + g.rs.map(function (r) {
        return '<tr><td>' + esc(r.que) + '<div class="fuente-chica">' + cifra(r.cantidad) + ' ' + esc(r.unidad) + '</div></td><td class="num"><input class="precio" type="text" inputmode="decimal" data-tipo="num" data-k="' + k + 'precios.' + r.id + '" placeholder="no cotizó" aria-label="Precio de ' + esc(r.que) + '"></td><td class="num" data-vivo="imp:' + c.id + ':' + r.id + '"></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="datos-cot"><label>Fecha<input type="date" data-k="' + k + 'fecha"></label><label>Lugar<input type="text" data-k="' + k + 'lugar" placeholder="Arroyo Seco"></label>' +
      '<label>IVA<select data-k="' + k + 'iva">' + opciones(IVA, c.iva) + '</select></label><label>Flete<select data-k="' + k + 'flete">' + opciones(FLETE, c.flete) + '</select></label>' +
      '<label class="palomita"><input type="checkbox" data-k="' + k + 'escrito"> Por escrito</label></div>' +
      '<div class="rg-botones"><button type="button" class="btn chico" data-accion="cerrar-cot" data-g="' + g.id + '">Listo</button><button type="button" class="btn-texto peligro" data-accion="quitar-cot" data-g="' + g.id + '" data-id="' + c.id + '">Quitar esta cotización</button></div></div>';
  }
  function reglaChip(r) {
    var g = regla(r);
    if (g.ok) return '<span class="regla ok">Listo · ' + g.tiene + (g.nec === 3 ? ', ' + g.escritas + ' por escrito' : '') + '</span>';
    var faltan = Math.max(0, g.nec - g.tiene), t = [];
    if (faltan) t.push('faltan ' + faltan);
    if (g.nec === 3 && g.escritas < 2) t.push((2 - g.escritas) + ' más por escrito');
    return '<span class="regla falta-cot">' + t.join(' · ') + '</span><span class="fuente-chica"> ' + (g.nec === 3 ? 'pide 3' : 'pide 1') + '</span>';
  }
  function cElegir() {
    var cps = compras(), con2 = cps.filter(function (r) { return cotsDe(r).length >= 2; });
    var con1 = cps.filter(function (r) { return cotsDe(r).length === 1; }).length, sin = cps.filter(function (r) { return !cotsDe(r).length; }).length;
    var nota = (con1 || sin) ? '<p class="nota-chica">' + [con1 ? (con1 === 1 ? 'Un concepto tiene' : con1 + ' conceptos tienen') + ' una sola cotización: se usa esa.' : '', sin ? (sin === 1 ? 'Un concepto no tiene' : sin + ' conceptos no tienen') + ' cotización: se queda el precio de referencia, marcado.' : ''].filter(Boolean).join(' ') + '</p>' : '';
    if (!con2.length) return '<p class="porque">' + (P.cotizaciones.length ? 'Ningún concepto tiene todavía dos cotizaciones: se usa la única que hay.' : 'Cuando lleguen las cotizaciones, aquí se elige con cuál se quedan.') + '</p>' + nota;
    return '<p class="porque">Por cada concepto se usa la más barata, salvo que haya una razón para otra: la calidad, el flete o que sí entregan en La Florida.</p>' + con2.map(function (r) {
      var cs = cotsDe(r).slice().sort(function (a, b) { return a.precio - b.precio; }), e = elegida(r), barata = cs[0];
      return '<div class="elige"><div class="elige-t">' + esc(r.que) + ' <span class="ayuda">' + cifra(r.cantidad) + ' ' + esc(r.unidad) + '</span></div><div class="elige-op">' + cs.map(function (x, j) {
        return '<label><input type="radio" name="el-' + r.id + '" value="' + esc(x.c.id) + '" data-k="eleccion.' + r.id + '.cot"' + (e && e.c.id === x.c.id ? ' checked' : '') + '><span><b>' + pesos(x.precio) + '</b> ' + esc(x.c.proveedor || 'Sin nombre') + (j === 0 ? ' <small>la más barata</small>' : '') + (x.c.escrito ? '' : ' <small>de palabra</small>') + '</span></label>';
      }).join('') + '</div>' +
        (e && barata && e.c.id !== barata.c.id ? '<div class="campo"><label for="mot-' + r.id + '">Por qué no la más barata</label><input type="text" id="mot-' + r.id + '" data-k="eleccion.' + r.id + '.motivo" placeholder="Por ejemplo: incluye el flete hasta La Florida"></div>' : '') + '</div>';
    }).join('') + nota;
  }

  /* ---------- 8 · La partida ---------- */
  function cContraste() {
    var cx = contraste(), sIA = sumas('ia'), sR = sumas('real');
    if (!cx.length) { var g0 = grupos()[0]; return '<p class="porque">El contraste aparece cuando lleguen las cotizaciones.</p>' + (g0 ? falta('Todavía no hay cotizaciones registradas.', 'c-' + g0.id, 'Registrarlas') : ''); }
    var dif = sIA.dinero > 0 ? signo(Math.round((sR.dinero - sIA.dinero) / sIA.dinero * 100)) + '%' : '·';
    return '<p class="porque">La diferencia enseña dónde se equivoca la IA y por qué. Esto es lo que se compra, en dinero.</p>' +
      cifras([['La IA dijo', pesos(sIA.dinero)], ['Cotizado', pesos(sR.dinero), true], ['Diferencia', dif], ['Sin cotizar', String(sR.sinCotizar)]]) +
      '<div class="envoltura"><table class="tp"><thead><tr><th>Renglón</th><th class="num">IA</th><th class="num">Cotizado</th><th>Diferencia</th></tr></thead><tbody>' + cx.slice(0, 8).map(function (x) {
        var pct = x.pct == null ? 0 : x.pct, w = Math.min(50, Math.abs(pct) * 50);
        return '<tr><td>' + esc(x.r.que) + '</td><td class="num">' + pesos(x.ia) + '</td><td class="num">' + pesos(x.real) + '</td><td><span class="dif ' + (pct > 0 ? 'sube' : 'baja') + '"><span class="barra-dif"><i style="width:' + w.toFixed(1) + '%"></i></span>' + (x.pct == null ? '·' : signo(Math.round(pct * 100)) + '%') + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' + (cx.length > 8 ? '<p class="nota-chica">Y ' + (cx.length - 8) + ' renglones más en la hoja.</p>' : '') +
      (tres().length ? '<p class="nota-chica">Ahora, las ' + (tres().length === 1 ? 'diferencia más grande' : tres().length + ' diferencias más grandes') + ', una por una.</p>' : '');
  }
  function cDiferencia(i) {
    var x = tres()[i]; if (!x) return '<p class="porque">Ya no hay otra diferencia que explicar.</p>';
    var rid = x.r.id, e = P.explicaciones[rid] || {}, cs = e.causas || [];
    return '<p class="porque">La IA dijo ' + pesos(x.ia) + ' por ' + esc(x.r.unidad) + '; se cotizó en ' + pesos(x.real) + '. En el renglón son ' + (x.dImp >= 0 ? pesos(x.dImp) + ' más' : pesos(-x.dImp) + ' menos') + (x.pct != null ? ' (' + signo(Math.round(x.pct * 100)) + '%)' : '') + '.</p>' +
      '<h3>¿Qué pasó? Marca lo que aplique</h3><div class="causas">' + CAUSAS.map(function (c) { return '<label><input type="checkbox" data-accion-cambio="causa" data-r="' + rid + '" data-c="' + c[0] + '"' + (cs.indexOf(c[0]) >= 0 ? ' checked' : '') + '><span>' + esc(c[1]) + '</span></label>'; }).join('') + '</div>' +
      '<div class="campo" style="margin-top:14px"><label for="x-' + rid + '">Explícalo con tus palabras</label><textarea class="grande" id="x-' + rid + '" data-k="explicaciones.' + rid + '.texto" rows="3" data-requerido="la explicación" placeholder="Por ejemplo: el banco de grava más cercano queda en Jalpan y cobra el flete aparte."></textarea></div>';
  }
  function cArchivo() {
    var rs = renglones().filter(function (r) { return (+r.cantidad || 0) > 0; }), pb = {};
    rs.forEach(function (r) { var b = bolsilloDe(r); pb[b] = (pb[b] || 0) + importe(r, 'real'); });
    return '<p class="porque">Así se lleva a la práctica del presupuesto: cada renglón cae en una actividad del cronograma y en el bolsillo de quien lo paga. Ya vienen sugeridos; cambia lo que no cuadre.</p>' +
      '<div class="asignar">' + rs.map(function (r) {
        return '<div class="ab"><div class="ab-t">' + esc(r.que) + '<small>' + esc(forma(r.forma).nombre) + ' · ' + pesos(importe(r, 'real')) + '</small></div>' +
          (P.actividades.length > 1 ? '<select data-k="acts.' + r.id + '" aria-label="Actividad de ' + esc(r.que) + '">' + opciones(P.actividades.map(function (id) { var a = act(id); return [id, a ? a.cod : id]; }), actDe(r)) + '</select>' : '') +
          '<select data-k="bolsillos.' + r.id + '" aria-label="Bolsillo de ' + esc(r.que) + '">' + opciones(D.BOLSILLOS.map(function (b) { return [b.id, b.corto]; }), bolsilloDe(r)) + '</select></div>';
      }).join('') + '</div>' +
      '<h3>Quién lo pagaría</h3>' + D.BOLSILLOS.filter(function (b) { return pb[b.id] > 0; }).map(function (b) { return '<div class="asi-va fila-b"><span>' + esc(b.nombre) + '</span><b>' + pesos(pb[b.id]) + '</b></div>'; }).join('');
  }
  function pendientesPartida() {
    var l = [];
    if (P.lectura) preguntas().forEach(function (q) {
      if (q.medir && !(tieneValor(q) && resp(q).medido)) l.push(['md-' + q.id, 'Medir en la orilla: ' + minus(q.texto)]);
      else if (!q.medir && !tieneValor(q)) l.push(['pr-' + q.id, 'Contestar: ' + minus(q.texto)]);
    });
    if (P.lista) grupos().forEach(function (g) {
      var malos = g.rs.filter(function (r) { return !regla(r).ok; }).length;
      if (malos) l.push(['c-' + g.id, 'Cotizaciones de ' + g.p.corto.toLowerCase() + ': ' + (malos === 1 ? 'un concepto no cumple' : malos + ' conceptos no cumplen') + ' la regla']);
    });
    tres().forEach(function (x, i) { if (!explicada(x.r.id)) l.push(['d-' + (i + 1), 'Explicar por qué cambió: ' + minus(x.r.que)]); });
    if (!P.lista) l.unshift(['armar', 'Armar la lista']);
    if (!l.length) return '<p class="todo-listo">Todo lo indispensable está: las medidas, la regla de las cotizaciones y las tres diferencias explicadas.</p>';
    return '<div class="pendientes"><b>Antes de entregar, revisa:</b><ul>' + l.slice(0, 8).map(function (x) {
      return '<li><a href="#" data-ir="' + x[0] + '">' + esc(x[1]) + '</a></li>';
    }).join('') + (l.length > 8 ? '<li>y ' + (l.length - 8) + ' más</li>' : '') + '</ul></div>';
  }
  function cEntregar() {
    var h = pendientesPartida(), sR = sumas('real');
    if (!P.lista) return h;
    h += '<div class="asi-va"><span>Total de la pieza, con lo cotizado</span><b>' + pesos(sR.total) + '</b></div>';
    h += '<div data-entregas="partida" style="margin-top:16px"></div>';
    if ((P.actividades || []).length) h += '<div class="despues"><h3>Para el archivo del equipo</h3><p class="nota-chica">Las partidas de sus actividades se cambian por estos renglones cotizados; lo demás del archivo se queda igual.</p><button type="button" class="btn claro" data-accion="llevar-equipo">' + M.ico.descargar + 'Llevar al archivo del equipo</button></div>';
    else h += '<p class="nota-chica">Esta pieza no está en el cronograma, así que no se lleva a ningún archivo del equipo.</p>';
    return h;
  }

  /* ---------- Las hojas ---------- */
  function origenChip(r, enHoja) {
    var o = origenDe(r);
    var t = { web: 'Web', estimacion: 'Estimación de la IA', practica: 'Práctica, sin fuente', catalogo: 'Catálogo' }[o];
    return enHoja ? '<span class="chip-doc ' + o + '">' + t + '</span>' : '<span class="origen ' + o + '">' + t + '</span>';
  }
  function fuenteDe(r) {
    if (r.origen === 'web' && r.fuente) return r.fuente.tienda + (r.fuente.lugar ? ', ' + r.fuente.lugar : '') + (r.fuente.fecha ? ', ' + r.fuente.fecha : '');
    if (r.ref && D.CAT[r.ref]) { var c = D.CAT[r.ref]; return c.n + ': ' + c.f + ', ' + c.d; }
    return '';
  }
  function enlaceDe(r) { if (r.origen === 'web' && r.fuente) return r.fuente.enlace || ''; if (r.ref && D.CAT[r.ref]) return D.CAT[r.ref].url || ''; return ''; }
  function membrete(tipoDoc, folio) {
    return '<header class="membrete"><div class="logo"><img src="' + window.EMBLEMA + '" alt=""></div><div class="quien"><div class="nombre">' + PROYECTO.nombre + '</div><div class="giro">' + PROYECTO.giro + '</div></div>' +
      '<div class="doc"><div class="tipo">' + tipoDoc + '</div>' + (folio ? '<div class="folio">' + folio + '</div>' : '') + '</div></header>';
  }
  function datosPieza(extra) {
    var c = comp(P.componente), cods = codigos();
    return '<div class="datos"><div data-parte="pieza"><div class="rot">Pieza</div><div class="dato-grande">' + esc(P.nombre || 'Sin nombre') + '</div><div class="dato">' + esc(c ? c.id + ' · ' + c.nombre : '') + (cods ? ' · cronograma ' + esc(cods) : '') + '</div></div>' +
      '<dl class="pares"><dt>Equipo</dt><dd data-parte="equipo">' + esc(P.equipo.nombres || '·') + '</dd><dt>Fecha</dt><dd>' + esc(fecha(hoy())) + '</dd>' + (extra || '') + '</dl></div>';
  }
  function fotoDoc(chica) {
    var f = P.fotos[0]; if (!f) return '';
    return '<div class="foto-doc' + (chica === 'mini' ? ' mini' : chica ? ' chica' : '') + '" data-parte="foto"><img src="' + f.src + '" alt="">' + elementos().map(function (e) {
      return '<span class="p" style="left:' + (e.x * 100).toFixed(2) + '%;top:' + (e.y * 100).toFixed(2) + '%">' + e.n + '</span>';
    }).join('') + (f.ilustracion ? '<span class="marca-ilus">Ilustración de ejemplo</span>' : '') + '</div>';
  }
  function nEl(n) { return '<span class="n-el' + (n ? '' : ' cero') + '">' + (n || '·') + '</span>'; }
  function pie() { return { pieIzq: PROYECTO.nombre + ' · ' + esc(P.nombre || ''), pieDer: 'Pieza por pieza · ' + esc(fecha(hoy())) }; }
  function hoja(cont, o) { return M.hoja(Object.assign({ acento: VERDE }, pie(), o || {}), cont); }

  function hoja1() {
    var c = membrete('Ficha de la pieza') + datosPieza();
    c += P.fotos.length ? fotoDoc(false) : '<div class="hueco" data-parte="foto">Aquí va el fotomontaje que suban.</div>';
    if ((P.actividades || []).length) {
      c += '<div class="seccion" data-parte="cronograma"><h3 class="titulo-doc">Lo que dice el cronograma</h3><table class="tabla"><thead><tr><th>Código</th><th>Actividad</th><th>Deja</th><th>Mes</th><th>Bolsillo</th></tr></thead><tbody>' + P.actividades.map(function (id) {
        var a = act(id); if (!a) return ''; var b = bols(a.f);
        return '<tr><td>' + esc(a.cod) + '</td><td>' + esc(a.n) + '</td><td>' + esc(a.p) + '</td><td>' + esc(mesLargo(a.mes)) + '</td><td>' + esc(b ? b.corto : 'por definir') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    }
    if (P.decidido) c += '<div class="caja-doc" data-parte="decidido"><b>Lo que ya se decidió.</b> ' + esc(P.decidido) + '</div>';
    c += tiene(P.propuesta) ? '<div class="caja-doc" data-parte="propuesta"><b>Lo que propone el equipo.</b> ' + esc(P.propuesta) + '</div>' : '<div class="hueco" data-parte="propuesta">Aquí va lo que propone el equipo, en dos líneas.</div>';
    if (!P.nombre) c += '<p class="texto-doc gris" style="margin-top:12pt">Elige el componente y la pieza para empezar.</p>';
    return hoja(c);
  }
  function hoja2() {
    var c = membrete('Lectura de la foto') + datosPieza('<dt>Lectura</dt><dd>' + (P.lectura ? (P.lectura.origen === 'claude' ? 'Claude, en esta página' : P.lectura.origen === 'ejemplo' ? 'ejemplo armado' : 'IA, respuesta pegada') : 'pendiente') + '</dd>');
    if (!P.lectura) return hoja(c + (P.fotos.length ? fotoDoc(false) : '<div class="hueco" data-parte="foto">Aquí va la foto que lee el agente.</div>') + '<p class="texto-doc gris" style="margin-top:14pt">Aquí va la foto numerada, lo que el agente ve en ella y sus preguntas.</p>');
    var Lc = P.lectura;
    c += fotoDoc(false);
    c += '<table class="tabla" data-parte="elementos"><thead><tr><th style="width:.4in">Núm.</th><th>Lo que se cotiza</th></tr></thead><tbody>' + elementos().map(function (e) { return '<tr><td>' + nEl(e.n) + '</td><td>' + esc(e.nombre) + (e.nota ? ' <span class="gris">· ' + esc(e.nota) + '</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table>';
    if (Lc.lectura || Lc.solucion) c += '<div class="seccion" data-parte="como"><h3 class="titulo-doc">Cómo se haría</h3>' + (Lc.lectura ? '<p class="texto-doc">' + esc(Lc.lectura) + '</p>' : '') + (Lc.solucion ? '<p class="texto-doc">' + esc(Lc.solucion) + '</p>' : '') + '</div>';
    if ((Lc.alertas || []).length) c += '<div class="caja-doc" data-parte="cuidados"><b>Cuidados.</b><ul class="lista-doc">' + Lc.alertas.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div>';
    if ((Lc.insumos || []).length) c += '<p class="texto-doc"><b>Lo que probablemente lleve:</b> ' + Lc.insumos.map(esc).join(', ') + '.</p>';
    c += '<div class="seccion"><h3 class="titulo-doc">Las preguntas</h3><table class="tabla"><thead><tr><th>Pregunta</th><th>Respuesta</th><th>Sugerencia</th></tr></thead><tbody>' + preguntas().map(function (q) {
      var r = resp(q);
      return '<tr data-parte="q-' + q.id + '"><td>' + esc(q.texto) + (q.medir ? ' <span class="chip-doc web">se mide</span>' : '') + '</td><td>' + (tieneValor(q) ? esc(r.valor) + (q.unidad ? ' ' + esc(q.unidad) : '') + (q.medir ? (r.medido ? ' <span class="gris">· medido</span>' : ' <span class="gris">· provisional</span>') : '') : '<span class="gris">·</span>') + '</td><td class="gris">' + esc(q.sugerido || '') + (q.sugerido && q.unidad ? ' ' + esc(q.unidad) : '') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    c += '<p class="aviso-doc">Lectura hecha con apoyo de inteligencia artificial y revisada por el equipo. Los números de la foto son los mismos de la lista y de la partida.</p>';
    return hoja(c);
  }
  function hoja3() {
    var c = membrete('Hoja de campo') + datosPieza('<dt>Midieron</dt><dd>&nbsp;</dd>');
    if (!P.lectura) return hoja(c + '<p class="texto-doc gris" style="margin-top:14pt">La hoja de campo sale de las preguntas del agente.</p>');
    c += fotoDoc('mini');
    var qs = preguntas().filter(function (q) { return q.medir; });
    c += '<table class="tabla" data-parte="medidas"><thead><tr><th style="width:.3in">#</th><th>Qué medir</th><th>Unidad</th><th>Sugerencia</th><th style="width:1.35in">Medida en la orilla</th></tr></thead><tbody>' +
      (qs.length ? qs.map(function (q, i) {
        var r = resp(q);
        return '<tr data-parte="m-' + q.id + '"><td>' + (i + 1) + '</td><td>' + esc(q.texto) + (q.por_que ? '<div class="gris" style="font-size:7.8pt">' + esc(q.por_que) + '</div>' : '') + '</td><td>' + esc(q.unidad || '') + '</td><td class="gris">' + esc(q.sugerido || '') + '</td><td class="linea-vacia">' + (r.medido && tieneValor(q) ? esc(r.valor) + (r.nota ? '<div class="gris" style="font-size:7.4pt">' + esc(r.nota) + '</div>' : '') : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="5" class="sin">El agente no pidió medidas para esta pieza.</td></tr>') + '</tbody></table>';
    c += '<div class="seccion"><h3 class="titulo-doc">Lo que se cotiza en la foto</h3><p class="texto-doc">' + elementos().map(function (e) { return nEl(e.n) + esc(e.nombre); }).join('&nbsp;&nbsp; ') + '</p></div>';
    c += '<div class="caja-doc" data-parte="como-medir"><b>Cómo medir.</b><ul class="lista-doc">' + D.COMO_MEDIR.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    c += '<div class="seccion"><h3 class="titulo-doc">Lo que se vio en la orilla</h3><div class="renglones-vacios"><div></div><div></div><div></div></div></div>';
    c += '<div class="firma-linea"><div>Midieron</div><div>Fecha y hora</div></div>';
    return hoja(c);
  }
  function filasLista(conPrecio, modo) {
    var cols = conPrecio ? 6 : 4, out = '';
    gruposLista().forEach(function (n) {
      var rs = renglones().filter(function (r) { return r.n === n; }); if (!rs.length) return;
      out += '<tr class="grupo" data-parte="g-' + n + '"><td colspan="' + cols + '">' + nEl(n) + '<b>' + esc(nombreGrupoLista(n)) + '</b></td></tr>';
      rs.forEach(function (r) {
        var pr = precioUso(r, modo), sinCot = modo === 'real' && r.forma === 'compra' && precioReal(r) == null;
        var partes = ['g-' + n];
        if (modo === 'ia' && esSinFuente(r)) partes.push('sinfuente');
        if (modo === 'real' && r.forma === 'compra') partes.push('cot-' + (r.proveedor || 'otros'));
        out += '<tr data-parte="' + partes.join(' ') + '"><td>' + esc(r.que) + (r.calculo && !conPrecio ? '<div class="gris" style="font-size:7.6pt">' + esc(r.calculo) + '</div>' : '') + '</td><td class="num">' + cifra(r.cantidad) + '</td><td>' + esc(r.unidad) + '</td>' +
          '<td>' + esc(forma(r.forma).nombre) + '</td>' +
          (conPrecio ? '<td class="num' + (sinCot ? ' sin' : '') + '">' + pesos(pr) + (modo === 'ia' ? '<div>' + origenChip(r, true) + '</div>' : sinCot ? '<div style="font-size:7pt">sin cotizar</div>' : '') + '</td><td class="num">' + pesos(importe(r, modo)) + '</td>' : '') + '</tr>';
      });
    });
    return out;
  }
  function totalesDoc(modo) {
    var s = sumas(modo);
    var l = [['Materiales que se compran', s.material], ['Mano de obra pagada', s.manoPagada], ['Herramienta y equipo', s.equipo], ['Flete', s.flete]];
    var fila = function (t, v, cls, parte) { return '<div class="fila' + (cls ? ' ' + cls : '') + '"' + (parte ? ' data-parte="' + parte + '"' : '') + '><span>' + esc(t) + '</span><b>' + pesos(v) + '</b></div>'; };
    return '<div class="totales" data-parte="totales">' + l.filter(function (x) { return x[1] > 0; }).map(function (x) { return fila(x[0], x[1]); }).join('') +
      fila('Imponderables, ' + cifra(P.imp) + '% de lo que se compra', s.imp, '', 'imp') +
      fila('En dinero', s.dinero, 'sub') +
      (s.faena > 0 ? fila('Faena valorizada', s.faena) : '') +
      (s.especie > 0 ? fila('Donado, prestado o trocado', s.especie) : '') +
      fila('Total de la pieza', s.total, 'gran') + '</div>';
  }
  function hoja4() {
    var c = membrete('Lo que lleva la pieza') + datosPieza();
    if (!P.lista) return hoja(c + '<p class="texto-doc gris" style="margin-top:14pt">Aquí va la lista que arma el agente con las respuestas del equipo.</p>');
    c += '<table class="tabla"><thead><tr><th>Concepto</th><th class="num">Cantidad</th><th>Unidad</th><th>Cómo se consigue</th></tr></thead><tbody>' + filasLista(false) + '</tbody></table>';
    if ((P.lista.supuestos || []).length) c += '<div class="caja-doc" data-parte="supuestos"><b>Se dio por hecho.</b><ul class="lista-doc">' + P.lista.supuestos.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    if ((P.lista.pendientes || []).length) c += '<div class="caja-doc" data-parte="pendientes"><b>Falta saber.</b><ul class="lista-doc">' + P.lista.pendientes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    return hoja(c);
  }
  function fuentesDoc() {
    var vistos = {}, l = [];
    renglones().forEach(function (r) {
      var f = fuenteDe(r), u = enlaceDe(r), k = f + '|' + u; if (!f || vistos[k]) return; vistos[k] = 1;
      l.push('<li>' + esc(f) + (u ? '. <a href="' + esc(u) + '">' + esc(u) + '</a>' : '') + '</li>');
    });
    return l.length ? '<div class="fuentes-doc"><b>Fuentes de los precios de referencia</b><ol>' + l.join('') + '</ol></div>' : '';
  }
  function hoja5() {
    var c = membrete('Precotización de referencia') + datosPieza('<dt>Precios</dt><dd>catálogo del ' + esc(D.FECHA_CATALOGO) + '</dd>');
    if (!P.lista) return hoja(c + '<p class="texto-doc gris" style="margin-top:14pt">Aquí van los precios de referencia de cada renglón y su fuente.</p>');
    c += '<table class="tabla"><thead><tr><th>Concepto</th><th class="num">Cantidad</th><th>Unidad</th><th>Cómo se consigue</th><th class="num">Precio</th><th class="num">Importe</th></tr></thead><tbody>' + filasLista(true, 'ia') + '</tbody></table>';
    c += totalesDoc('ia');
    c += '<p class="aviso-doc">Precotización hecha con apoyo de inteligencia artificial sobre el catálogo de precios de referencia de la clase. No sustituye las cotizaciones: sirve para compararlas. Los precios marcados como estimación de la IA no tienen fuente.</p>';
    c += fuentesDoc();
    return hoja(c);
  }
  function folioSol(g) { return 'SC-' + (P.id || '').slice(-4).toUpperCase() + '-' + (D.PROVEEDORES.indexOf(prov(g)) + 1); }
  function hoja6() {
    var gs = grupos(), g = gs.filter(function (x) { return x.id === verGrupo; })[0] || gs[0];
    if (!g) return hoja(membrete('Solicitud de cotización') + '<p class="texto-doc gris" style="margin-top:14pt">La solicitud sale de lo que se compra en la lista.</p>');
    var c = membrete('Solicitud de cotización', 'Folio <b>' + folioSol(g.id) + '</b>');
    c += '<div class="datos"><div data-parte="para"><div class="rot">Para</div><div class="dato-grande">' + esc(g.p.nombre) + '</div><div class="dato">Nombre: ____________________________</div></div>' +
      '<dl class="pares"><dt>Fecha</dt><dd>' + esc(fecha(hoy())) + '</dd><dt>Contacto</dt><dd data-parte="contacto">' + esc(P.equipo.contacto || '·') + '</dd><dt>Teléfono</dt><dd data-parte="contacto">' + esc(P.equipo.telefono || '·') + '</dd></dl></div>';
    c += '<p class="texto-doc">Le pedimos cotizar lo siguiente para el presupuesto de un anteproyecto comunitario en la orilla de la Presa de La Florida, Arroyo Seco, Querétaro: ' + esc(P.nombre) + '.</p>';
    c += '<table class="tabla" data-parte="conceptos"><thead><tr><th style="width:.3in">#</th><th>Concepto</th><th class="num">Cantidad</th><th>Unidad</th><th class="num" style="width:1.05in">Precio unitario</th><th class="num" style="width:1.05in">Importe</th></tr></thead><tbody>' +
      g.rs.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.que) + '</td><td class="num">' + cifra(r.cantidad) + '</td><td>' + esc(r.unidad) + '</td><td class="linea-vacia"></td><td class="linea-vacia"></td></tr>'; }).join('') +
      '</tbody></table>';
    c += '<div class="caja-doc"><b>Le pedimos indicar:</b> si el precio incluye IVA; el costo del flete hasta La Florida, Arroyo Seco; la vigencia de la cotización; el tiempo de entrega y la forma de pago.</div>';
    c += '<p class="aviso-doc">Esta solicitud sirve para elaborar un presupuesto. No es una orden de compra ni compromete una compra.</p>';
    c += '<div class="firma-linea"><div data-parte="contacto">Contacto: ' + esc(P.equipo.contacto || '') + '</div><div>Recibió (nombre y firma)</div></div>';
    return hoja(c, { pieIzq: PROYECTO.nombre, pieDer: 'Folio ' + folioSol(g.id) });
  }
  function hoja7() {
    var c = membrete('Partida') + datosPieza();
    if (!P.lista) return hoja(c + '<p class="texto-doc gris" style="margin-top:14pt">La partida sale de la lista con los precios cotizados.</p>');
    if (P.fotos.length) c += fotoDoc(true);
    c += '<table class="tabla"><thead><tr><th>Concepto</th><th class="num">Cantidad</th><th>Unidad</th><th>Cómo se consigue</th><th class="num">Precio</th><th class="num">Importe</th></tr></thead><tbody>' + filasLista(true, 'real') + '</tbody></table>';
    c += totalesDoc('real');
    if ((P.actividades || []).length) {
      var pb = {};
      renglones().forEach(function (r) { var b = bolsilloDe(r); pb[b] = (pb[b] || 0) + importe(r, 'real'); });
      c += '<div class="seccion" data-parte="bolsillos"><h3 class="titulo-doc">Quién lo pagaría</h3><table class="tabla"><tbody>' + D.BOLSILLOS.filter(function (b) { return pb[b.id] > 0; }).map(function (b) { return '<tr><td>' + esc(b.nombre) + '</td><td class="num">' + pesos(pb[b.id]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    var cps = compras();
    c += '<div class="seccion anexo"><h3 class="titulo-doc">Anexo A · Las cotizaciones</h3><table class="tabla" data-parte="elegidas"><thead><tr><th>Concepto</th><th>Cotizaciones</th><th>Elegida</th></tr></thead><tbody>' + cps.map(function (r) {
      var cs = cotsDe(r), e = elegida(r), g = regla(r);
      return '<tr data-parte="cot-' + (r.proveedor || 'otros') + '"><td>' + esc(r.que) + '</td><td>' + (cs.length ? cs.map(function (x) { return esc(x.c.proveedor || 'Sin nombre') + ' ' + pesos(x.precio) + ' <span class="gris">· ' + esc(M.fechaCorta(x.c.fecha)) + (x.c.escrito ? ' · escrita' : '') + '</span>'; }).join('<br>') : '<span class="gris">sin cotizar</span>') +
        (!g.ok ? '<div style="font-size:7.4pt;color:#8A3B2B">La regla pide ' + g.nec + (g.nec === 3 ? ', dos por escrito' : '') + '</div>' : '') + '</td><td>' + (e ? esc(e.c.proveedor || '') + (P.eleccion[r.id] && P.eleccion[r.id].motivo ? '<div class="gris">' + esc(P.eleccion[r.id].motivo) + '</div>' : '') : '·') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    var cx = contraste();
    if (cx.length) {
      var sIA = sumas('ia'), sR = sumas('real');
      c += '<div class="seccion anexo" data-parte="anexo-b"><h3 class="titulo-doc">Anexo B · Contra la precotización de la IA</h3><p class="texto-doc">En dinero, la IA dijo ' + pesos(sIA.dinero) + ' y el equipo cotizó ' + pesos(sR.dinero) + (sIA.dinero > 0 ? ' (' + (sR.dinero >= sIA.dinero ? '+' : '') + Math.round((sR.dinero - sIA.dinero) / sIA.dinero * 100) + '%)' : '') + '.</p>' +
        '<table class="tabla"><thead><tr><th>Concepto</th><th class="num">IA</th><th class="num">Cotizado</th><th class="num">Diferencia</th></tr></thead><tbody>' + cx.map(function (x) {
          return '<tr><td>' + esc(x.r.que) + '</td><td class="num">' + pesos(x.ia) + '</td><td class="num">' + pesos(x.real) + '</td><td class="num">' + (x.pct == null ? '·' : signo(Math.round(x.pct * 100)) + '%') + '</td></tr>';
        }).join('') + '</tbody></table>';
      tres().forEach(function (x) {
        var e = (P.explicaciones && P.explicaciones[x.r.id]) || {};
        var cs = (e.causas || []).map(function (k) { var cc = CAUSAS.filter(function (y) { return y[0] === k; })[0]; return cc ? cc[1] : k; });
        c += '<div class="caja-doc" data-parte="dif-' + x.r.id + '"><b>' + esc(x.r.que) + '.</b> ' + (cs.length ? esc(cs.join(', ')) + '. ' : '') + (e.texto ? esc(e.texto) : '<span class="gris">Falta la explicación del equipo.</span>') + '</div>';
      });
      c += '</div>';
    }
    c += '<p class="aviso-doc">Precios de las cotizaciones que consiguió el equipo; donde falta cotización se usa el precio de referencia y se marca. La precotización de la IA solo sirve para comparar (anexo B). La faena se valoriza al salario mínimo general de 2026.</p>';
    c += '<div class="firma-linea"><div>Elaboró: ' + esc(P.equipo.nombres || '') + '</div><div>Revisó</div></div>';
    return hoja(c);
  }
  var HOJAS = { 1: hoja1, 2: hoja2, 3: hoja3, 4: hoja4, 5: hoja5, 6: hoja6, 7: hoja7 };
  function hojaActual() { var s = guia && guia.actual() && seccion(guia.actual()); return s ? +s.dataset.hoja || 1 : 1; }
  function tituloArchivo() {
    var t = TITULOS[hojaPintada || 1] + ' - ' + (P.nombre || 'pieza');
    if (hojaPintada === 6 && verGrupo) t = 'Solicitud de cotización - ' + prov(verGrupo).corto + ' - ' + (P.nombre || 'pieza');
    return t;
  }
  function botonHoja(chico) {
    return '<button type="button" class="btn claro' + (chico ? ' chico' : '') + '" data-accion="hoja">' + M.ico.pdf + (enClaude() ? 'Descargar la hoja' : 'Imprimir o PDF') + '</button>';
  }
  function pintarHoja() {
    if (!P) return;
    var n = hojaActual(), marco = $('#marco');
    if (n === 6 && !verGrupo && grupos()[0]) verGrupo = grupos()[0].id;
    marco.innerHTML = HOJAS[n]();
    hojaPintada = n;
    M.ajustarHoja(marco);
    $$('img', marco).forEach(function (im) { if (!im.complete) im.onload = function () { M.ajustarHoja(marco); }; });
    $('#mesa').innerHTML = '<div class="mesa-fila"><span class="rot-hoja">' + esc(TITULOS[n]) + (n === 6 && verGrupo ? ' · ' + esc(prov(verGrupo).corto) : '') + '</span>' + botonHoja(true) + '</div>';
    $('#pie-hoja').textContent = enClaude()
      ? 'En Claude la hoja se descarga como archivo; ábrelo en el navegador para imprimirlo o guardarlo en PDF.'
      : 'Para el PDF: en la ventana de imprimir elige «Guardar como PDF», tamaño carta y sin encabezados.';
    var pm = $('#pdf-movil'); if (pm) pm.textContent = enClaude() ? 'Descargar' : 'PDF';
  }

  /* ---------- Llenar, y lo que cambia mientras se escribe ---------- */
  function llenar(raiz) {
    $$('[data-k]', raiz).forEach(function (el) {
      var v = M.obtenerRuta(P, el.dataset.k);
      if (el.type === 'checkbox') { el.checked = !!v; return; }
      if (el.type === 'radio') { if (v !== undefined && v !== null && v !== '') el.checked = String(v) === el.value; return; }
      if (v === undefined || v === null) { if (el.tagName !== 'SELECT') el.value = ''; return; }
      if (document.activeElement !== el) el.value = v;
    });
  }
  function refrescarVivos(raiz) {
    $$('[data-vivo]', raiz || $('#secciones')).forEach(function (el) {
      var p = el.dataset.vivo.split(':');
      if (p[0] === 'imp') {
        var c = P.cotizaciones.filter(function (x) { return x.id === p[1]; })[0], r = renglones().filter(function (x) { return x.id === p[2]; })[0];
        var v = c && r && +(c.precios || {})[r.id] > 0 ? (+r.cantidad || 0) * (+c.precios[r.id]) : 0;
        el.textContent = v ? pesos(v) : '';
      } else if (p[0] === 'regla') {
        var r2 = renglones().filter(function (x) { return x.id === p[1]; })[0];
        if (r2) el.innerHTML = reglaChip(r2);
      } else if (p[0] === 'sub') {
        var n = +p[1];
        el.textContent = pesos(renglones().filter(function (r) { return r.n === n; }).reduce(function (a, r) { return a + importe(r, 'ia'); }, 0));
      }
    });
  }

  /* ---------- Los números sobre la foto ---------- */
  function montarPines() {
    var c = $('#fp'); if (!c) return;
    var arr = null;
    function pos(e) { var r = c.getBoundingClientRect(); return { x: Math.max(.02, Math.min(.98, (e.clientX - r.left) / r.width)), y: Math.max(.03, Math.min(.97, (e.clientY - r.top) / r.height)) }; }
    c.addEventListener('pointerdown', function (e) {
      var pin = e.target.closest('.pin');
      if (pin) { arr = pin; try { pin.setPointerCapture(e.pointerId); } catch (x) {} pin.classList.add('arrastrando'); e.preventDefault(); return; }
      if (agregarPin) { var p = pos(e); agregarElemento(p.x, p.y); }
    });
    c.addEventListener('pointermove', function (e) {
      if (!arr) return;
      var p = pos(e), el = elemento(+arr.dataset.n);
      arr.style.left = (p.x * 100) + '%'; arr.style.top = (p.y * 100) + '%';
      if (el) { el.x = p.x; el.y = p.y; }
    });
    function soltar() { if (!arr) return; arr.classList.remove('arrastrando'); arr = null; cambio(); }
    c.addEventListener('pointerup', soltar); c.addEventListener('pointercancel', soltar);
    c.addEventListener('keydown', function (e) {
      var pin = e.target.closest('.pin'); if (!pin) return;
      var d = { ArrowLeft: [-.01, 0], ArrowRight: [.01, 0], ArrowUp: [0, -.01], ArrowDown: [0, .01] }[e.key]; if (!d) return;
      e.preventDefault(); var el = elemento(+pin.dataset.n); if (!el) return;
      el.x = Math.max(.02, Math.min(.98, el.x + d[0])); el.y = Math.max(.03, Math.min(.97, el.y + d[1]));
      pin.style.left = (el.x * 100) + '%'; pin.style.top = (el.y * 100) + '%'; cambio();
    });
  }
  function agregarElemento(x, y) {
    var n = elementos().reduce(function (a, e) { return Math.max(a, e.n); }, 0) + 1;
    P.lectura.elementos.push({ n: n, nombre: 'Elemento ' + n, x: x, y: y, nota: '' });
    agregarPin = false; actualizar();
    var ins = $$('.elementos input', seccion('numeros')); if (ins.length) { enfocar(ins[ins.length - 1]); ins[ins.length - 1].select(); }
  }

  /* ---------- Diálogos propios (en Claude no hay confirm) ---------- */
  function confirmar(texto, si, alSi) {
    var d = M.cajon('cajon-confirmar', 'Antes de seguir');
    $('.cuerpo-cajon', d).innerHTML = '<p class="texto-cajon">' + esc(texto) + '</p><div class="botones-cajon"><button type="button" class="btn claro" data-r="no">Cancelar</button><button type="button" class="btn" data-r="si">' + esc(si) + '</button></div>';
    $('.cuerpo-cajon', d).onclick = function (e) { var b = e.target.closest('[data-r]'); if (!b) return; M.cerrarCajon(d); if (b.dataset.r === 'si') alSi(); };
    M.abrirCajon(d);
  }
  function mostrarTexto(titulo, texto, ayuda) {
    var d = M.cajon('cajon-texto', titulo);
    $('.cuerpo-cajon', d).innerHTML = '<p class="texto-cajon">' + esc(ayuda) + '</p><textarea readonly id="txt-cajon"></textarea><div class="botones-cajon"><button type="button" class="btn" data-r="copiar">' + M.ico.copiar + 'Copiar</button></div>';
    $('#txt-cajon').value = texto;
    $('.cuerpo-cajon', d).onclick = function (e) { var b = e.target.closest('[data-r]'); if (!b) return; M.copiar(texto).then(function (ok) { M.aviso(ok ? 'Copiado.' : 'No se pudo copiar: selecciona el texto y cópialo.', ok ? '' : 'mal'); }); };
    M.abrirCajon(d);
  }
  M.confirmar = confirmar;

  /* ---------- Salidas: descargar, imprimir, Word e imagen ---------- */
  function bajar(nombre, contenido, mime) {
    if (enClaude()) {
      var dl = A.entorno.descargas;
      if (dl && typeof dl.save === 'function') {
        return Promise.resolve(dl.save({ filename: nombre, data: contenido })).then(function () { M.aviso('Listo: «' + nombre + '».'); }, function (e) {
          M.aviso(e && e.code === 'declined' ? 'No se descargó «' + nombre + '».' : 'No se pudo descargar «' + nombre + '» en esta vista.', 'mal');
        });
      }
      if (typeof contenido === 'string') mostrarTexto('Copia el archivo', contenido, 'En esta vista no se puede descargar. Copia el contenido y guárdalo en un archivo llamado ' + nombre + '.');
      else M.aviso('En esta vista no se pueden descargar archivos. Abre la página en el sitio del curso.', 'mal');
      return Promise.resolve();
    }
    M.descargar(nombre, contenido, mime);
    return Promise.resolve('Descargado: ' + nombre + '.');
  }
  function estilosPagina() { return $$('style').map(function (s) { return s.textContent; }).join('\n'); }
  function documentoSuelto(titulo, html, horizontal) {
    return '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(titulo) + '</title><style>' + estilosPagina() +
      '\n@page { size: letter ' + (horizontal ? 'landscape' : 'portrait') + '; margin: 0; }</style></head><body class="suelto"><button type="button" class="btn boton-imprimir" onclick="window.print()">Imprimir o guardar en PDF</button><div id="impresion">' + html +
      '</div><script>window.addEventListener("load",function(){setTimeout(function(){try{window.print()}catch(e){}},500)});<\/script></body></html>';
  }
  function sacarHoja() {
    pintarHoja();
    if (enClaude()) {
      var h = $('#marco .hoja'); if (!h) return;
      var copia = h.cloneNode(true); copia.style.transform = '';
      $$('.en-foco', copia).forEach(function (x) { x.classList.remove('en-foco', 'late'); });
      return bajar(slug(tituloArchivo()) + '.html', documentoSuelto(tituloArchivo(), copia.outerHTML), 'text/html');
    }
    M.alImprimir(function () { return tituloArchivo(); }, pintarHoja);
    M.imprimir();
  }
  function paquete() { return { pxp: 'pieza', version: 2, guardado: new Date().toISOString(), datos: P }; }
  function descargarPieza() { return bajar(slug(P.nombre || 'pieza') + '.pieza.json', JSON.stringify(paquete()), 'application/json'); }
  function abrirArchivo() {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var p; try { p = JSON.parse(r.result); } catch (e) { M.aviso('Ese archivo no se pudo leer.', 'mal'); return; }
        if (!p || p.pxp !== 'pieza' || !p.datos) { M.aviso(p && p.partidas ? 'Ese es un archivo del equipo: se abre en la práctica del presupuesto.' : 'Ese archivo no es de Pieza por pieza.', 'mal'); return; }
        var d = normal(p.datos); if (ARCH.obtener(d.id) && ARCH.obtener(d.id) !== P) d.id = M.uid();
        abrir(d); guardarYa(); M.aviso('Pieza abierta: ' + (d.nombre || 'sin nombre') + '.');
      };
      r.readAsText(f);
    };
    inp.click();
  }
  function descargarWord(d, nombre) {
    return Promise.resolve(d).then(function (doc) { return doc.blob(); }).then(function (b) { return bajar(nombre, b, MIME_WORD); });
  }
  function entregarImagen(c, nombre, titulo) {
    if (enClaude()) return L.blob(c).then(function (b) { return bajar(nombre, b, 'image/png'); });
    return L.entregar(c, nombre, titulo).then(function (r) { return r === 'compartida' ? 'Imagen compartida.' : r === 'cancelada' ? '' : 'Imagen descargada: ' + nombre + '.'; });
  }
  function compartirTexto(texto, titulo) {
    var tactil = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (tactil && navigator.share && !enClaude()) {
      return navigator.share({ text: texto, title: titulo }).then(function () { return 'Listo.'; }, function (e) {
        if (e && e.name === 'AbortError') return '';
        return copiarTexto(texto);
      });
    }
    return copiarTexto(texto);
  }
  function copiarTexto(texto) {
    return M.copiar(texto).then(function (ok) {
      if (ok) return 'Mensaje copiado: pégalo en el chat del proveedor.';
      mostrarTexto('El mensaje', texto, 'Selecciona el texto y cópialo.'); return '';
    });
  }
  function entregasDe(clave) {
    var pdf = enClaude()
      ? { t: 'La hoja para imprimir', d: 'Se descarga; ábrela en el navegador y guárdala en PDF o imprímela.' }
      : { t: 'Imprimir o guardar en PDF', d: 'Tamaño carta. En la ventana de imprimir, elige «Guardar como PDF».' };
    if (clave === 'campo') return [{ ico: 'pdf', principal: true, t: pdf.t, d: 'La hoja de campo, con espacio para anotar a mano lo que midan.', hacer: sacarHoja }];
    if (/^sol-/.test(clave)) {
      var gid = clave.slice(4), nom = 'solicitud-' + gid + '-' + slug(P.nombre || 'pieza');
      return [
        { ico: 'pdf', principal: true, t: pdf.t, d: 'Para llevarla en papel con el proveedor y que la firme de recibida.', hacer: function () { verGrupo = gid; return sacarHoja(); } },
        { ico: 'word', t: 'Word editable', d: 'Para mandarla por correo o ajustarla antes de imprimir.', hacer: function () { return descargarWord(wordSolicitud(gid), nom + '.docx'); } },
        { ico: 'texto', t: 'Mensaje para WhatsApp', d: 'Los conceptos y lo que se pide, listos para pegar en el chat del proveedor.', hacer: function () { return compartirTexto(textoWhatsApp(gid), 'Solicitud de cotización'); } }
      ];
    }
    if (clave === 'partida') {
      var base = 'partida-' + slug(P.nombre || 'pieza');
      return [
        { ico: 'pdf', principal: true, t: pdf.t, d: 'La partida con sus anexos: las cotizaciones y el contraste con la IA.', hacer: sacarHoja },
        { ico: 'word', t: 'Word editable', d: 'La misma partida, para corregirla o pegarla en el expediente.', hacer: function () { return descargarWord(wordPartida(), base + '.docx'); } },
        { ico: 'imagen', t: 'Imagen para WhatsApp', d: 'El resumen: el total, quién lo paga y lo que cambió contra la IA.', hacer: function () { return imagenPartida().then(function (c) { return entregarImagen(c, base + '.png', P.nombre || 'Partida'); }); } },
        { ico: 'archivo', t: 'La pieza en un archivo', d: 'Con fotos y cotizaciones, para seguir en otra computadora.', hacer: descargarPieza }
      ];
    }
    return [];
  }

  /* La foto con sus números, para Word y para la imagen */
  function fotoConNumeros(ancho) {
    var f = P.fotos[0]; if (!f) return Promise.resolve(null);
    return L.cargar(f.src).then(function (img) {
      if (!img) return null;
      var w = ancho || 1400, h = Math.round(w * (img.naturalHeight || f.h || 780) / (img.naturalWidth || f.w || 1200));
      var x = L.crear(w, h), g = x.g;
      g.drawImage(img, 0, 0, w, h);
      var lado = Math.max(34, Math.round(w * 0.034));
      elementos().forEach(function (e) {
        var cx = e.x * w, cy = e.y * h;
        g.beginPath(); g.arc(cx, cy, lado / 2 + 4, 0, Math.PI * 2); g.fillStyle = '#FFFFFF'; g.fill();
        g.beginPath(); g.arc(cx, cy, lado / 2, 0, Math.PI * 2); g.fillStyle = ARENA; g.fill();
        g.font = '700 ' + Math.round(lado * 0.52) + "px 'Jost', system-ui, sans-serif"; g.fillStyle = '#1B2A27'; g.textAlign = 'center';
        g.fillText(String(e.n), cx, cy + lado * 0.19); g.textAlign = 'left';
      });
      if (f.ilustracion) { g.font = "500 " + Math.round(w * 0.016) + "px 'Jost', system-ui, sans-serif"; g.fillStyle = 'rgba(0,0,0,.45)'; L.rect(g, 12, h - Math.round(w * 0.035), Math.round(w * 0.2), Math.round(w * 0.026), 6, 'rgba(0,0,0,.45)'); g.fillStyle = '#FFFFFF'; g.fillText('Ilustración de ejemplo', 22, h - Math.round(w * 0.016)); }
      return { src: x.c.toDataURL('image/jpeg', 0.86), w: w, h: h };
    });
  }
  function membreteProyecto() { return { nombre: PROYECTO.nombre, giro: PROYECTO.giro, logo: window.EMBLEMA, color: VERDE }; }
  function nuevoWord(titulo, pie) {
    return M.docx({ acento: VERDE, titulo: titulo, autor: P.equipo.nombres || PROYECTO.nombre, pie: pie, margen: { izq: 0.75, der: 0.75, sup: 0.6, inf: 0.7 } });
  }
  var GRIS = '#4B5A5E', TENUE = '#7B898C';
  function wordSolicitud(gid) {
    var g = grupo(gid); if (!g) return Promise.reject(new Error('no hay esa solicitud'));
    var folio = folioSol(gid);
    var d = nuevoWord('Solicitud de cotización ' + folio, PROYECTO.nombre + '   ·   Folio ' + folio);
    M.docxMembrete(d, membreteProyecto(), { tipo: 'Solicitud de cotización', folio: 'Folio ' + folio, tamTipo: 14, ancho: 2.6 });
    var dato = function (t, v) { return { c: [{ t: t + '   ', tam: 7.8, color: TENUE }, { t: v || '·', tam: 9.4 }], f: { despues: 2 } }; };
    d.tabla({ anchos: [d.util * 0.56, d.util * 0.44], margenCelda: 0.04, margenV: 0.1, filas: [[
      { parrafos: [{ c: [{ t: 'Para', tam: 7.8, color: TENUE }] }, { c: [{ t: g.p.nombre, b: true, tam: 13 }], f: { despues: 3 } }, { c: [{ t: 'Nombre: ______________________________', tam: 9, color: GRIS }] }] },
      { parrafos: [dato('Fecha', M.fecha(hoy())), dato('Contacto', P.equipo.contacto), dato('Teléfono', P.equipo.telefono)] }
    ]] });
    d.p([{ t: 'Le pedimos cotizar lo siguiente para el presupuesto de un anteproyecto comunitario en la orilla de la Presa de La Florida, Arroyo Seco, Querétaro: ', tam: 10 }, { t: P.nombre || 'la pieza', b: true, tam: 10 }, { t: '.', tam: 10 }], { antes: 10, despues: 8, linea: 1.15 });
    var resto = d.util - 0.35 - 0.8 - 0.8 - 1.1 - 1.1;
    M.docxTablaDatos(d, [{ t: '#', ancho: 0.35 }, { t: 'Concepto', ancho: resto }, { t: 'Cantidad', ancho: 0.8, alin: 'der' }, { t: 'Unidad', ancho: 0.8 }, { t: 'Precio unitario', ancho: 1.1, alin: 'der' }, { t: 'Importe', ancho: 1.1, alin: 'der' }],
      g.rs.map(function (r, i) { return [String(i + 1), r.que, M.cifra(+r.cantidad || 0), r.unidad, '', '']; }), { tam: 9.4, margen: 0.08 });
    d.p([{ t: 'Le pedimos indicar: ', b: true, tam: 9.2 }, { t: 'si el precio incluye IVA; el costo del flete hasta La Florida, Arroyo Seco; la vigencia de la cotización; el tiempo de entrega y la forma de pago.', tam: 9.2, color: GRIS }], { antes: 12, despues: 6, fondo: d.suave(0.09) });
    d.p([{ t: 'Esta solicitud sirve para elaborar un presupuesto. No es una orden de compra ni compromete una compra.', tam: 8.4, color: TENUE }], { despues: 4 });
    M.docxFirmas(d, [{ que: 'Contacto', nombre: P.equipo.contacto || '', cargo: P.equipo.telefono ? 'Tel. ' + P.equipo.telefono : '' }, { que: 'Recibió (nombre y firma)', nombre: '' }]);
    return Promise.resolve(d);
  }
  function wordPartida() {
    var c = comp(P.componente), cods = codigos(), sR = sumas('real'), sIA = sumas('ia');
    var d = nuevoWord('Partida ' + (P.nombre || ''), PROYECTO.nombre + '   ·   ' + (P.nombre || 'Partida'));
    M.docxMembrete(d, membreteProyecto(), { tipo: 'Partida', folio: M.fecha(hoy()), tamTipo: 18 });
    d.p([{ t: P.nombre || 'Pieza sin nombre', b: true, tam: 14 }], { antes: 10, despues: 1 });
    d.p([{ t: [c ? c.id + ' · ' + c.nombre : '', cods ? 'cronograma ' + cods : 'no está en el cronograma'].filter(Boolean).join('   ·   '), tam: 9, color: GRIS }], { despues: 1 });
    d.p([{ t: 'Equipo   ', tam: 7.8, color: TENUE }, { t: P.equipo.nombres || '·', tam: 9 }], { despues: 6 });
    return fotoConNumeros(1500).then(function (foto) {
      if (foto) { var an = Math.min(5.2, d.util); d.imagen(foto.src, an, an * foto.h / foto.w, { alin: 'centro', despues: 8 }); }
      var resto = d.util - 0.6 - 0.65 - 1.05 - 0.95 - 1.0;
      var filas = [];
      gruposLista().forEach(function (n) {
        var rs = renglones().filter(function (r) { return r.n === n; }); if (!rs.length) return;
        filas.push({ grupo: (n ? n + '. ' : '') + nombreGrupoLista(n) });
        rs.forEach(function (r) {
          var sinCot = r.forma === 'compra' && precioReal(r) == null;
          filas.push([r.que, M.cifra(+r.cantidad || 0), r.unidad, forma(r.forma).nombre,
            { t: [{ t: pesos(precioUso(r, 'real')) }].concat(sinCot ? [{ t: '\nsin cotizar', tam: 7, color: '#8A3B2B' }] : []) }, pesos(importe(r, 'real'))]);
        });
      });
      M.docxTablaDatos(d, [{ t: 'Concepto', ancho: resto }, { t: 'Cant.', ancho: 0.6, alin: 'der' }, { t: 'Unidad', ancho: 0.65 }, { t: 'Cómo se consigue', ancho: 1.05 }, { t: 'Precio', ancho: 0.95, alin: 'der' }, { t: 'Importe', ancho: 1.0, alin: 'der' }], filas, { tam: 8.6, margen: 0.05 });
      // Los totales, a la derecha
      var tot = [['Materiales que se compran', sR.material], ['Mano de obra pagada', sR.manoPagada], ['Herramienta y equipo', sR.equipo], ['Flete', sR.flete]].filter(function (x) { return x[1] > 0; });
      tot.push(['Imponderables, ' + cifra(P.imp) + '% de lo que se compra', sR.imp]);
      var ft = tot.map(function (x) { return [{ t: x[0], tam: 8.8, color: GRIS }, { t: pesos(x[1]), alin: 'der', tam: 8.8 }]; });
      ft.push([{ t: 'En dinero', b: true, tam: 9, bordes: { top: { c: d.suave(0.55), g: 0.75 } } }, { t: pesos(sR.dinero), b: true, alin: 'der', tam: 9, bordes: { top: { c: d.suave(0.55), g: 0.75 } } }]);
      if (sR.faena > 0) ft.push([{ t: 'Faena valorizada', tam: 8.8, color: GRIS }, { t: pesos(sR.faena), alin: 'der', tam: 8.8 }]);
      if (sR.especie > 0) ft.push([{ t: 'Donado, prestado o trocado', tam: 8.8, color: GRIS }, { t: pesos(sR.especie), alin: 'der', tam: 8.8 }]);
      ft.push([{ t: 'Total de la pieza', b: true, tam: 10.5, color: VERDE, bordes: { top: { c: VERDE, g: 1 } } }, { t: pesos(sR.total), b: true, alin: 'der', tam: 10.5, color: VERDE, bordes: { top: { c: VERDE, g: 1 } } }]);
      d.espacio(6);
      d.tabla({ anchos: [2.6, 1.25], alin: 'der', margenCelda: 0.04, margenV: 0.035, filas: ft });
      if ((P.actividades || []).length) {
        var pb = {};
        renglones().forEach(function (r) { var b = bolsilloDe(r); pb[b] = (pb[b] || 0) + importe(r, 'real'); });
        d.p([{ t: 'Quién lo pagaría', b: true, tam: 10, color: VERDE }], { antes: 12, despues: 3, junto: true });
        M.docxTablaDatos(d, [{ t: 'Bolsillo', ancho: d.util - 1.4 }, { t: 'Importe', ancho: 1.4, alin: 'der' }], D.BOLSILLOS.filter(function (b) { return pb[b.id] > 0; }).map(function (b) { return [b.nombre, pesos(pb[b.id])]; }), { tam: 9 });
      }
      // Anexo A
      d.p([{ t: 'Anexo A · Las cotizaciones', b: true, tam: 10.5, color: VERDE }], { antes: 16, despues: 3, junto: true });
      M.docxTablaDatos(d, [{ t: 'Concepto', ancho: d.util * 0.36 }, { t: 'Cotizaciones', ancho: d.util * 0.4 }, { t: 'Elegida', ancho: d.util * 0.24 }], compras().map(function (r) {
        var cs = cotsDe(r), e = elegida(r), g = regla(r);
        var runs = cs.length ? cs.map(function (x, j) { return { t: (j ? '\n' : '') + (x.c.proveedor || 'Sin nombre') + ' ' + pesos(x.precio) + '  ·  ' + M.fechaCorta(x.c.fecha) + (x.c.escrito ? ' · escrita' : ''), tam: 8.2 }; }) : [{ t: 'sin cotizar', tam: 8.2, color: TENUE }];
        if (!g.ok) runs.push({ t: '\nLa regla pide ' + g.nec + (g.nec === 3 ? ', dos por escrito' : ''), tam: 7.4, color: '#8A3B2B' });
        var mot = P.eleccion[r.id] && P.eleccion[r.id].motivo;
        return [r.que, { t: runs }, { t: [{ t: e ? (e.c.proveedor || '') : '·', tam: 8.2 }].concat(mot ? [{ t: '\n' + mot, tam: 7.6, color: TENUE }] : []) }];
      }), { tam: 8.4, margen: 0.05 });
      // Anexo B
      var cx = contraste();
      if (cx.length) {
        d.p([{ t: 'Anexo B · Contra la precotización de la IA', b: true, tam: 10.5, color: VERDE }], { antes: 16, despues: 3, junto: true });
        d.p([{ t: 'En dinero, la IA dijo ' + pesos(sIA.dinero) + ' y el equipo cotizó ' + pesos(sR.dinero) + (sIA.dinero > 0 ? ' (' + (sR.dinero >= sIA.dinero ? '+' : '') + Math.round((sR.dinero - sIA.dinero) / sIA.dinero * 100) + '%)' : '') + '.', tam: 9.2, color: GRIS }], { despues: 4 });
        M.docxTablaDatos(d, [{ t: 'Concepto', ancho: d.util - 3.0 }, { t: 'IA', ancho: 1.0, alin: 'der' }, { t: 'Cotizado', ancho: 1.0, alin: 'der' }, { t: 'Diferencia', ancho: 1.0, alin: 'der' }],
          cx.map(function (x) { return [x.r.que, pesos(x.ia), pesos(x.real), x.pct == null ? '·' : signo(Math.round(x.pct * 100)) + '%']; }), { tam: 8.6 });
        tres().forEach(function (x) {
          var e = P.explicaciones[x.r.id] || {};
          var cs = (e.causas || []).map(function (k) { var cc = CAUSAS.filter(function (y) { return y[0] === k; })[0]; return cc ? cc[1] : k; });
          d.p([{ t: x.r.que + '. ', b: true, tam: 9 }, { t: (cs.length ? cs.join(', ') + '. ' : '') + (e.texto || 'Falta la explicación del equipo.'), tam: 9, color: GRIS }], { antes: 6, despues: 2, fondo: d.suave(0.07) });
        });
      }
      d.p([{ t: 'Precios de las cotizaciones que consiguió el equipo; donde falta cotización se usa el precio de referencia y se marca. La precotización de la IA solo sirve para comparar (anexo B). La faena se valoriza al salario mínimo general de 2026.', tam: 8, color: TENUE }], { antes: 12, despues: 2 });
      M.docxFirmas(d, [{ que: 'Elaboró', nombre: P.equipo.nombres || '' }, { que: 'Revisó', nombre: '' }]);
      return d;
    });
  }
  /* La imagen del resumen, 1080 × 1350, para mandar por WhatsApp */
  function imagenPartida() {
    var W = 1080, H = 1350, x = L.crear(W, H), g = x.g, sR = sumas('real'), sIA = sumas('ia'), c = comp(P.componente);
    var y = 0;
    return L.fuentes().then(function () {
      g.fillStyle = VERDE; g.fillRect(0, 0, W, 14);
      return L.logo(g, membreteProyecto(), 72, 50, 76);
    }).then(function () {
      L.texto(g, PROYECTO.nombre, 166, 58, { tam: 26, peso: 600, color: '#1D2A2E', ancho: W - 238, max: 1 });
      L.texto(g, PROYECTO.giro, 166, 94, { tam: 21, color: GRIS, ancho: W - 238, max: 1 });
      L.texto(g, 'Partida', 72, 166, { tam: 30, peso: 500, color: VERDE });
      y = L.texto(g, P.nombre || 'Pieza sin nombre', 72, 206, { tam: 44, peso: 600, color: '#1D2A2E', ancho: W - 144, max: 2, interlinea: 1.12 });
      y = L.texto(g, [c ? c.id + ' · ' + c.corto : '', codigos() ? 'cronograma ' + codigos() : ''].filter(Boolean).join('  ·  '), 72, y + 6, { tam: 22, color: GRIS, ancho: W - 144, max: 1 });
      return fotoConNumeros(1200);
    }).then(function (foto) {
      return foto ? L.cargar(foto.src) : null;
    }).then(function (img) {
      y += 24;
      if (img) {
        // La foto se recorta a lo ancho de la tarjeta, sin dejar fuera ningún número
        var fw = W - 144, fh = Math.min(340, Math.round(fw * img.naturalHeight / img.naturalWidth));
        var k = Math.max(fw / img.naturalWidth, fh / img.naturalHeight), sw = fw / k, sh = fh / k;
        var ys = elementos().map(function (e) { return e.y * img.naturalHeight; }), m = 0.06 * img.naturalHeight;
        var sy = (img.naturalHeight - sh) / 2;
        if (ys.length) {
          var lo = Math.min.apply(null, ys) - m, hi = Math.max.apply(null, ys) + m;
          sy = hi - lo <= sh ? Math.min(Math.max(sy, hi - sh), lo) : (lo + hi - sh) / 2;
          sy = Math.max(0, Math.min(img.naturalHeight - sh, sy));
        }
        g.save(); L.rect(g, 72, y, fw, fh, 18); g.clip();
        g.drawImage(img, (img.naturalWidth - sw) / 2, sy, sw, sh, 72, y, fw, fh);
        g.restore();
        y += fh + 30;
      }
      L.texto(g, 'Total de la pieza', 72, y, { tam: 24, color: TENUE });
      L.texto(g, pesos(sR.total), 72, y + 30, { tam: 72, peso: 600, color: VERDE });
      y += 124;
      y = L.texto(g, 'En dinero ' + pesos(sR.dinero) + (sR.enEspecie > 0 ? '   ·   en especie y faena ' + pesos(sR.enEspecie) : ''), 72, y, { tam: 23, color: GRIS, ancho: W - 144, max: 2 });
      // La IA contra lo cotizado
      if (contraste().length && sIA.dinero > 0) {
        y += 24; L.linea(g, 72, y, W - 72, y, '#DCE2E3', 2); y += 24;
        var dif = Math.round((sR.dinero - sIA.dinero) / sIA.dinero * 100);
        L.texto(g, 'Lo que se compra', 72, y, { tam: 25, peso: 600, color: '#1D2A2E' });
        L.texto(g, (dif > 0 ? '+' : dif < 0 ? '−' : '') + Math.abs(dif) + '% contra la IA', W - 72, y, { tam: 25, peso: 600, color: dif > 0 ? '#A4552B' : '#2E7A4F', alin: 'der' });
        y += 46;
        var max = Math.max(sIA.dinero, sR.dinero) || 1, ancho = W - 72 - 230 - 200;
        [['La IA dijo', sIA.dinero, '#C9D6D0'], ['Cotizado', sR.dinero, VERDE]].forEach(function (b) {
          L.texto(g, b[0], 72, y, { tam: 22, color: GRIS });
          L.rect(g, 230, y + 4, Math.max(16, ancho * b[1] / max), 24, 12, b[2]);
          L.texto(g, pesos(b[1]), W - 72, y, { tam: 22, color: '#1D2A2E', alin: 'der' });
          y += 44;
        });
        var t3 = tres();
        if (t3.length && y < H - 230) {
          y += 14; L.texto(g, 'Lo que más cambió', 72, y, { tam: 25, peso: 600, color: '#1D2A2E' }); y += 44;
          t3.forEach(function (d3) {
            if (y > H - 170) return;
            L.texto(g, d3.r.que, 72, y, { tam: 22, color: '#1D2A2E', ancho: W - 144 - 150, max: 1 });
            L.texto(g, d3.pct == null ? '·' : signo(Math.round(d3.pct * 100)) + '%', W - 72, y, { tam: 22, peso: 600, color: d3.pct > 0 ? '#A4552B' : '#2E7A4F', alin: 'der' });
            y += 38;
          });
        }
      }
      L.linea(g, 72, H - 104, W - 72, H - 104, '#DCE2E3', 2);
      L.texto(g, P.equipo.nombres || 'El equipo', 72, H - 84, { tam: 24, color: GRIS, ancho: W - 144 - 330, max: 1 });
      L.texto(g, M.fecha(hoy()), W - 72, H - 84, { tam: 24, color: GRIS, alin: 'der' });
      return x.c;
    });
  }

  /* ---------- Al archivo del equipo ---------- */
  function aPartidas(p) {
    var guardada = P; P = p;
    var out = renglones().filter(function (r) { return (+r.cantidad || 0) > 0; }).map(function (r) {
      var id = actDe(r), a = act(id), el = elemento(r.n);
      var que = (r.que + (el && r.n ? ' · ' + el.nombre : '')).slice(0, 140);
      return { actividad: id, que: que, unidad: r.unidad, cant: +r.cantidad || 0, precio: Math.round(precioUso(r, 'real') * 100) / 100, tipo: tipo(r.tipo).practica, bolsillo: bolsilloDe(r), forma: r.forma, mes: a ? a.mes : '', cae: false };
    });
    P = guardada; return out;
  }
  function llevarAlEquipo() {
    var d = M.cajon('cajon-equipo', 'Llevar al archivo del equipo'), archivo = null, nombreArch = '';
    var piezas = ARCH.lista().filter(function (x) { return !x.ejemplo && x.componente === P.componente && (x.actividades || []).length && x.lista; });
    if (!piezas.some(function (x) { return x.id === P.id; })) piezas.unshift(P);
    var marcadas = {}; marcadas[P.id] = true;
    function pintar() {
      var h = '<p class="texto-cajon">El archivo del equipo es el .json que descargaron en la práctica del presupuesto. Las partidas de las actividades de cada pieza se cambian por los renglones cotizados; lo demás se queda igual.</p>';
      h += '<div class="botones-cajon" style="justify-content:flex-start"><button type="button" class="btn claro" data-r="abrir">' + M.ico.abrir + (archivo ? 'Abrir otro archivo' : 'Abrir el archivo del equipo') + '</button>' + (archivo ? '' : '<button type="button" class="btn-texto" data-r="nuevo">No tenemos archivo: empezar uno</button>') + '</div>';
      if (archivo) {
        var c = comp(archivo.componente);
        h += '<p class="texto-cajon"><b>' + esc(nombreArch) + '</b> · ' + esc(c ? c.id + ' · ' + c.corto : 'sin componente') + ' · ' + (archivo.partidas || []).length + ' partidas</p>';
        if (archivo.componente && archivo.componente !== P.componente) h += '<p class="falta">Ese archivo es de otro componente. Ábrelo solo si de verdad es el de tu equipo.</p>';
        h += '<p style="margin:6px 0 4px;font-weight:500">Piezas que se llevan</p><ul class="lista-cambios" style="list-style:none;padding:0">' + piezas.map(function (x) {
          var reemplaza = (archivo.partidas || []).filter(function (pt) { return (x.actividades || []).indexOf(pt.actividad) >= 0; }).length;
          return '<li><label class="palomita"><input type="checkbox" data-p="' + x.id + '"' + (marcadas[x.id] ? ' checked' : '') + '> ' + esc(x.nombre) + ' <span class="ayuda">· cambia ' + reemplaza + (reemplaza === 1 ? ' partida' : ' partidas') + ' por ' + aPartidas(x).length + '</span></label></li>';
        }).join('') + '</ul>';
        h += '<div class="botones-cajon"><button type="button" class="btn" data-r="bajar">' + M.ico.descargar + 'Descargar el archivo actualizado</button></div>';
      }
      $('.cuerpo-cajon', d).innerHTML = h;
    }
    $('.cuerpo-cajon', d).onclick = function (e) {
      var b = e.target.closest('[data-r]');
      var cb = e.target.closest('input[data-p]'); if (cb) { marcadas[cb.dataset.p] = cb.checked; return; }
      if (!b) return;
      if (b.dataset.r === 'abrir') {
        var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
        inp.onchange = function () {
          var f = inp.files && inp.files[0]; if (!f) return; var r = new FileReader();
          r.onload = function () { try { var x = JSON.parse(r.result); if (!x || !Array.isArray(x.partidas)) throw 0; archivo = x; nombreArch = f.name; pintar(); } catch (err) { M.aviso('Ese no es un archivo de la práctica del presupuesto.', 'mal'); } };
          r.readAsText(f);
        };
        inp.click();
      } else if (b.dataset.r === 'nuevo') {
        archivo = { version: 3, equipo: P.equipo.nombres || '', componente: P.componente, partidas: [], sig: 1, flete: { si: false, cant: 1, precio: 0, bolsillo: 'AUT', forma: 'compra', mes: '' }, imp: { si: true, pct: 5, nombre: 'lo que falte en la obra', bolsillo: 'AUT' }, pro: { unidad: 'm²', cant: 0 }, seCae: '' };
        nombreArch = 'archivo nuevo'; pintar();
      } else if (b.dataset.r === 'bajar') {
        var x = JSON.parse(JSON.stringify(archivo)), usadas = piezas.filter(function (p) { return marcadas[p.id]; });
        if (!usadas.length) { M.aviso('Marca al menos una pieza.', 'mal'); return; }
        var quitar = {}; usadas.forEach(function (p) { (p.actividades || []).forEach(function (id) { quitar[id] = 1; }); });
        x.partidas = (x.partidas || []).filter(function (pt) { return !quitar[pt.actividad]; });
        var sig = x.partidas.reduce(function (a, pt) { return Math.max(a, +pt.id || 0); }, 0) + 1;
        usadas.forEach(function (p) { aPartidas(p).forEach(function (pt) { pt.id = sig++; x.partidas.push(pt); }); });
        x.sig = sig; x.version = 3; x.componente = x.componente || P.componente; x.equipo = x.equipo || P.equipo.nombres || '';
        x.guardado = new Date().toISOString(); x.piezaPorPieza = { fecha: x.guardado, piezas: usadas.map(function (p) { return p.nombre; }) };
        delete x.resumen;
        var nombre = 'presupuesto-' + (x.componente || 'sin-componente') + '-' + (slug(x.equipo || 'equipo').slice(0, 40) || 'equipo') + '.json';
        bajar(nombre, JSON.stringify(x, null, 1), 'application/json').then(function () { M.cerrarCajon(d); M.aviso('Ábrelo en la práctica del presupuesto o súbelo a la página que junta los archivos.'); });
      }
    };
    pintar(); M.abrirCajon(d);
  }

  /* ---------- Fotos ---------- */
  function leerFoto(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, k = Math.min(1, 1400 / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        var src; try { src = c.toDataURL('image/jpeg', .84); } catch (e) { src = r.result; }
        cb({ src: src, w: c.width, h: c.height });
      };
      img.onerror = function () { M.aviso('Esa imagen no se pudo abrir. Prueba con un JPG o un PNG.', 'mal'); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }
  function rasterizarIlustracion(p) {
    var f = p.fotos[0]; if (!f || !/^data:image\/svg/.test(f.src)) return;
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement('canvas'); c.width = f.w || 1200; c.height = f.h || 780;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        f.src = c.toDataURL('image/jpeg', .86);
        if (P === p && guia) rehacerTodo();
      } catch (e) {}
    };
    img.src = f.src;
  }

  /* ---------- Leer y pegar respuestas del agente ---------- */
  function fotosParaClaude() { return P.fotos.map(function (f) { return f.src; }).filter(function (s) { return /^data:image\/(jpeg|png|webp|gif)/.test(s); }); }
  function aplicarLectura(o, origen) {
    var Lr = A.normalizarLectura(o); Lr.origen = origen; Lr.fecha = hoy();
    P.lectura = Lr;
    // las respuestas viejas se quedan solo si la pregunta sigue
    var R = {}; Lr.preguntas.forEach(function (q) { if (P.respuestas[q.id] && P.respuestas[q.id].valor !== undefined) R[q.id] = P.respuestas[q.id]; });
    P.respuestas = R;
  }
  function aplicarLista(o, origen) {
    var Ls = A.normalizarLista(o, elementos());
    Ls.renglones.forEach(function (r, i) { r.id = 'r' + (i + 1); });
    Ls.sig = Ls.renglones.length + 1; Ls.origen = origen; Ls.fecha = hoy();
    P.lista = Ls; P.eleccion = {}; P.explicaciones = {}; P.bolsillos = {}; P.acts = {};
    // las cotizaciones se quedan, pero sus precios por renglón ya no aplican
    P.cotizaciones.forEach(function (c) { c.precios = {}; });
    abierto = { rg: '', cot: {} };
  }
  function pasoDe(cual) { return cual === 'lectura' ? 'leer' : 'armar'; }
  function conClaude(cual) {
    if (!A.hayAgente()) { modoCopiar = true; refrescarSeccion(pasoDe(cual)); return; }
    var prompt = cual === 'lectura' ? A.encargoLectura(P, false) : A.encargoLista(P, false);
    var ctl = new AbortController(), p = P;
    trabajando = { que: cual, ctl: ctl }; errorAgente = null; refrescarSeccion(pasoDe(cual));
    A.preguntar(prompt, { fotos: cual === 'lectura' ? fotosParaClaude() : [], signal: ctl.signal }).then(function (o) {
      if (P !== p || !trabajando || trabajando.ctl !== ctl) return;
      trabajando = null;
      try { if (cual === 'lectura') aplicarLectura(o, 'claude'); else aplicarLista(o, 'claude'); }
      catch (e) { errorAgente = { que: cual, mensaje: e.message }; refrescarSeccion(pasoDe(cual)); return; }
      rehacerTodo(); M.aviso(cual === 'lectura' ? 'El agente leyó la foto.' : 'La lista está lista.');
    }, function (e) {
      if (P !== p || !trabajando || trabajando.ctl !== ctl) return;
      trabajando = null;
      errorAgente = { que: cual, mensaje: e.mensaje || AG.MENSAJES.upstream_error };
      if (A.entorno.vetado) modoCopiar = true;
      refrescarSeccion(pasoDe(cual));
    });
  }
  function leerPegado(cual) {
    var t = ($('#pegado-' + cual) || {}).value || '';
    try {
      var o = A.leerJSON(t);
      if (cual === 'lectura') aplicarLectura(o, 'pegado'); else aplicarLista(o, 'pegado');
      errorAgente = null; rehacerTodo(); M.aviso('Respuesta leída.');
    } catch (e) {
      errorAgente = { que: cual, mensaje: e.message }; refrescarSeccion(pasoDe(cual));
      var ta = $('#pegado-' + cual); if (ta) ta.value = t;
    }
  }
  function leerTabla() {
    var t = ($('#pegado-web') || {}).value || '', filas = A.leerTablaWeb(t), n = 0;
    filas.forEach(function (f) {
      var r = renglones().filter(function (x) { return x.id.toLowerCase() === f.id.toLowerCase(); })[0];
      if (r && f.precio > 0) { r.precio = Math.round(f.precio * 100) / 100; r.origen = 'web'; r.fuente = { tienda: f.tienda || 'sin tienda', lugar: f.lugar, fecha: f.fecha, enlace: f.enlace }; n++; }
    });
    if (!n) { M.aviso('No se encontró ningún precio en la tabla. Revisa que traiga la columna «clave» con r1, r2…', 'mal'); return; }
    actualizar(); M.aviso(n + (n === 1 ? ' precio actualizado' : ' precios actualizados') + ' con su fuente.');
  }
  function textoWhatsApp(gid) {
    var g = grupo(gid); if (!g) return '';
    return ['Buen día. Le escribo del ' + PROYECTO.nombre + ' (Arroyo Seco, Qro.). Estamos armando el presupuesto de un anteproyecto y le pedimos cotizar:', '']
      .concat(g.rs.map(function (r, i) { return (i + 1) + '. ' + r.que + ': ' + cifra(r.cantidad) + ' ' + r.unidad; }))
      .concat(['', '¿Nos puede indicar precio unitario, si incluye IVA, el flete hasta La Florida, la vigencia y el tiempo de entrega? No es una orden de compra: es para el presupuesto.', '', 'Gracias. ' + (P.equipo.contacto || '') + (P.equipo.telefono ? ' · ' + P.equipo.telefono : '') + ' · Folio ' + folioSol(gid)]).join('\n');
  }

  /* ---------- Los eventos ---------- */
  function nuevoRenglon(n) {
    var Ls = P.lista;
    var r = { id: 'r' + (Ls.sig++), n: n, tipo: n ? 'material' : 'mano', que: '', unidad: n ? 'pieza' : 'jornal', cantidad: 1, calculo: '', ref: '', precio: 0, origen: 'estimacion', proveedor: n ? 'materiales' : 'mano', forma: n ? 'compra' : 'faena', nota: 'agregado por el equipo' };
    Ls.renglones.push(r);
    return r;
  }
  var ACC = {
    componente: function (b) {
      if (P.componente === b.dataset.id) return;
      P.componente = b.dataset.id; P.piezaId = ''; P.nombre = ''; P.actividades = []; P.decidido = '';
      actualizar();
    },
    pieza: function (b) {
      var id = b.dataset.id;
      P.piezaId = id;
      if (id === 'otra') { P.nombre = ''; P.actividades = []; P.decidido = ''; }
      else { var x = pieza(id); P.nombre = x.nombre; P.actividades = x.acts.slice(); P.decidido = x.decidido; }
      actualizar();
      if (id === 'otra') enfocar($('#f-otra'));
    },
    'quitar-foto': function (b) { P.fotos.splice(+b.dataset.i, 1); actualizar(); },
    claude: function (b) { conClaude(b.dataset.cual); },
    parar: function (b) { var cual = trabajando && trabajando.que; if (trabajando && trabajando.ctl) trabajando.ctl.abort(); trabajando = null; if (cual) refrescarSeccion(pasoDe(cual)); else actualizar(); },
    'modo-copiar': function () { modoCopiar = true; refrescarSeccion(guia.actual()); },
    'modo-claude': function () { modoCopiar = false; errorAgente = null; refrescarSeccion(guia.actual()); },
    'copiar-encargo': function (b) {
      var t = b.dataset.cual === 'lectura' ? A.encargoLectura(P, true) : A.encargoLista(P, true);
      M.copiar(t).then(function (ok) { if (ok) M.aviso(b.dataset.cual === 'lectura' ? 'Encargo copiado. Pégalo en la IA y adjunta la foto.' : 'Encargo copiado. Pégalo en la misma conversación o en una nueva.'); else mostrarTexto('Copia el encargo', t, 'No se pudo copiar solo: selecciona el texto y cópialo.'); });
    },
    'leer-pegado': function (b) { leerPegado(b.dataset.cual); },
    sugerencia: function (b) {
      var q = preguntaPorId(b.dataset.id); if (!q) return;
      M.ponerRuta(P, 'respuestas.' + q.id + '.valor', q.sugerido); actualizar();
    },
    'agregar-pin': function () { agregarPin = !agregarPin; refrescarSeccion('numeros'); },
    'agregar-el': function () { agregarElemento(.5, .5); },
    'quitar-el': function (b) {
      var n = +b.dataset.n;
      var quitar = function () { P.lectura.elementos = elementos().filter(function (e) { return e.n !== n; }); renglones().forEach(function (r) { if (r.n === n) r.n = 0; }); actualizar(); };
      if (renglones().some(function (r) { return r.n === n; })) confirmar('Hay renglones de la lista con el número ' + n + '. Se quedan, pero pasan a «de toda la pieza».', 'Quitar el número', quitar); else quitar();
    },
    'volver-leer': function () { confirmar('Se borra la lectura de la foto y sus preguntas. Las respuestas que coincidan se conservan.', 'Volver a leer', function () { P.lectura = null; rehacerTodo(); }); },
    'rehacer-lista': function () { confirmar('Se reemplaza la lista. Las cotizaciones registradas se quedan, pero hay que volver a poner sus precios por renglón.', 'Volver a armarla', function () { P.lista = null; abierto = { rg: '', cot: {} }; rehacerTodo(); }); },
    'abrir-rg': function (b) { abierto.rg = b.dataset.id; refrescarSeccion(guia.actual()); enfocar($('#e-que')); },
    'cerrar-rg': function () { abierto.rg = ''; actualizar(); },
    'agregar-rg': function (b) {
      var r = nuevoRenglon(+b.dataset.n); abierto.rg = r.id;
      actualizar(); enfocar($('#e-que'));
    },
    'quitar-rg': function (b) {
      var r = renglones().filter(function (x) { return x.id === b.dataset.id; })[0]; if (!r) return;
      confirmar('¿Quitar «' + (r.que || 'el renglón') + '» de la lista?', 'Quitarlo', function () {
        P.lista.renglones = renglones().filter(function (x) { return x.id !== r.id; }); abierto.rg = ''; actualizar();
      });
    },
    'copiar-investigar': function () {
      var t = A.encargoInvestigar(P, sinFuente());
      M.copiar(t).then(function (ok) { if (ok) M.aviso('Encargo copiado. Pégalo en una IA con búsqueda en la web.'); else mostrarTexto('Copia el encargo', t, 'Selecciona el texto y cópialo.'); });
    },
    'leer-tabla': leerTabla,
    'agregar-cot': function (b) {
      var c = { id: 'c' + M.uid().slice(-6), proveedor: '', grupo: b.dataset.g, lugar: '', fecha: hoy(), escrito: false, iva: 'nodice', flete: 'nodice', notas: '', precios: {} };
      P.cotizaciones.push(c); abierto.cot[b.dataset.g] = c.id;
      actualizar(); enfocar($('#c-prov'));
    },
    'abrir-cot': function (b) { abierto.cot[b.dataset.g] = b.dataset.id; refrescarSeccion(guia.actual()); enfocar($('#c-prov')); },
    'cerrar-cot': function (b) { abierto.cot[b.dataset.g] = ''; actualizar(); },
    'quitar-cot': function (b) {
      confirmar('¿Quitar esta cotización?', 'Quitarla', function () {
        P.cotizaciones = P.cotizaciones.filter(function (c) { return c.id !== b.dataset.id; }); abierto.cot[b.dataset.g] = ''; actualizar();
      });
    },
    'llevar-equipo': function () { guardarYa(); llevarAlEquipo(); },
    nueva: function () { guardarYa(); var p = nueva(); abrir(p); guardarYa(); },
    'descargar-pieza': descargarPieza,
    hoja: function () { return sacarHoja(); }
  };
  function alClic(e) {
    var b = e.target.closest('[data-accion]'); if (!b || b.disabled) return;
    var f = ACC[b.dataset.accion]; if (f) { e.preventDefault(); f(b, e); }
  }
  function valorDe(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.dataset.tipo === 'num') return el.value === '' ? '' : M.num(el.value);
    return el.value;
  }
  function alEscribir(e) {
    var el = e.target;
    if (el.dataset && el.dataset.k) {
      var opcion = el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio';
      if (e.type === 'input' && opcion) return;
      if (el.type === 'radio' && !el.checked) return;
      M.ponerRuta(P, el.dataset.k, valorDe(el));
      if (opcion) { actualizar(); return; }
      refrescarVivos();
      cambio();
      return;
    }
    if (e.type !== 'change') return;
    if (el.dataset && el.dataset.accionCambio === 'act-otra') { P.actividades = el.value ? [el.value] : []; actualizar(); }
    else if (el.dataset && el.dataset.accionCambio === 'causa') {
      var r = el.dataset.r, c = el.dataset.c;
      P.explicaciones[r] = P.explicaciones[r] || { causas: [], texto: '' };
      var cs = P.explicaciones[r].causas || (P.explicaciones[r].causas = []);
      var i = cs.indexOf(c); if (el.checked && i < 0) cs.push(c); if (!el.checked && i >= 0) cs.splice(i, 1);
      cambio(); guia.refrescar();
    } else if (el.dataset && el.dataset.accionArchivo === 'fotos') {
      var fs = Array.prototype.slice.call(el.files || [], 0, 3 - P.fotos.length), pend = fs.length;
      fs.forEach(function (f) { leerFoto(f, function (x) { P.fotos.push(x); if (--pend === 0) actualizar(); }); });
    }
  }
  /* Enter en los editores de la lista: cierra el renglón o pasa al siguiente precio */
  function alTeclear(e) {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    var el = e.target;
    if (!el.matches || !el.matches('input')) return;
    if (el.closest('.rv.abierto')) { e.preventDefault(); el.blur(); ACC['cerrar-rg'](); return; }
    if (el.matches('.precios-cot input.precio')) {
      e.preventDefault();
      var ps = $$('.precios-cot input.precio', el.closest('.rg-editor')), i = ps.indexOf(el);
      if (ps[i + 1]) enfocar(ps[i + 1]); else el.blur();
    }
  }

  /* ---------- Arranque ---------- */
  function iniciar() {
    sePuedeGuardar = probarGuardado();
    $('#trabajo').addEventListener('click', alClic);
    $('#mesa').addEventListener('click', alClic);
    $('.conmutador').addEventListener('click', alClic);
    $('#trabajo').addEventListener('input', alEscribir);
    $('#trabajo').addEventListener('change', alEscribir);
    $('#trabajo').addEventListener('keydown', alTeclear, true);
    $('#b-guardar').addEventListener('click', function () { guardarYa(); descargarPieza(); });
    $('#b-piezas').addEventListener('click', function () {
      guardarYa();
      M.listaDocs({
        titulo: 'Mis piezas', archivero: ARCH, nuevoTexto: 'Pieza nueva',
        describir: function (d) { var c = comp(d.componente); return { t: d.nombre || 'Pieza sin nombre', v: d.lista ? pesos(sumarDe(d)) : '', d: (c ? c.id + ' · ' + c.corto + ' · ' : '') + 'va en ' + minus(ORDEN_T[Math.max(0, Math.min(7, (d.paso || 1) - 1))]) + (d.ejemplo ? ' · ejemplo' : '') }; },
        alNuevo: function () { var p = nueva(); abrir(p); guardarYa(); },
        alAbrirArchivo: abrirArchivo,
        alEjemplo: function () { var p = window.PXP_EJEMPLO(hoy()); p.paso = 1; rasterizarIlustracion(p); abrir(p); guardarYa(); },
        alAbrir: function (d) { if (d) abrir(d); },
        alDuplicar: function (d) { if (!d) return; var c = JSON.parse(JSON.stringify(d)); c.id = M.uid(); c.nombre = (c.nombre || 'Pieza') + ' (copia)'; c.ejemplo = false; delete c.guia; abrir(c); guardarYa(); },
        alBorrar: function (id) { if (P && P.id === id) { var l = ARCH.lista(); abrir(l[0] || nueva()); } }
      });
    });
    window.addEventListener('pagehide', guardarYa);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') guardarYa(); });
    A.alCambiarEntorno = function () {
      if (!P || !guia) return;
      var a = guia.actual();
      if (a === 'leer' || a === 'armar') refrescarSeccion(a);
      else { var s1 = seccion('leer'), s2 = seccion('armar'); [s1, s2].forEach(function (s) { if (s) refrescarSeccion(s.dataset.paso); }); }
      pintarHoja();
    };
    M.montarVista();
    var actual = sePuedeGuardar ? ARCH.obtener(ARCH.idActual()) || ARCH.lista()[0] : null;
    if (actual) abrir(actual);
    else { var ej = window.PXP_EJEMPLO(hoy()); ej.paso = 1; rasterizarIlustracion(ej); abrir(ej); }
    if (!sePuedeGuardar) pintarEstado('Esta vista no guarda en el navegador: usa «Guardar archivo».');
    window.addEventListener('resize', function () { M.ajustarHoja($('#marco')); });
  }
  function sumarDe(d) { var g = P; P = normal(JSON.parse(JSON.stringify(d))); var t = sumas('real').total; P = g; return t; }
  // para las pruebas
  window.PXP_APP = {
    estado: function () { return P; }, sumas: function (m) { return sumas(m); }, regla: function (r) { return regla(r); },
    aPartidas: function () { return aPartidas(P); }, tres: function () { return tres(); }, abrir: function (p) { abrir(normal(p)); },
    guia: function () { return guia; }, pasos: function () { return estructura().map(function (s) { return s.id; }); },
    word: function (cual, g) { return (cual === 'solicitud' ? wordSolicitud(g || (grupos()[0] || {}).id) : wordPartida()).then(function (d) { return d.blob(); }); },
    imagen: function () { return imagenPartida(); }, foto: function () { return fotoConNumeros(800); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
