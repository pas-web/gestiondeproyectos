/* Cronograma: actividades, fases e hitos; la hoja dibuja el Gantt.
   Se llena una pregunta a la vez y las actividades de una en una (M.guia, M.listaGuiada).
   Sale en PDF, en Word (la gráfica como tabla) y en imagen. */
(function () {
  'use strict';
  var $ = M.$, n = M.num, esc = M.esc;
  var A = new M.Archivero('cronograma');
  var banco = $('.banco');
  var PALETA = ['#00899e', '#c46a1f', '#7b52ae', '#a8781a', '#2f6fb7', '#3f8f3a'], GRIS = '#8A9699';
  var s, memb, guia, lista, vistaMembrete;

  function lunesProximo() { var d = new Date(), mas = ((8 - d.getDay()) % 7) || 7; d.setDate(d.getDate() + mas); return M.aISO(d); }
  function actVacia(hito) { return { id: M.uid(), fase: '', nombre: '', resp: '', prod: '', ini: 1, dur: hito ? 0 : 1, hito: !!hito, dep: '' }; }
  function nuevo() {
    return {
      id: M.uid(), tocado: false, creado: new Date().toISOString(),
      titulo: 'Cronograma de actividades', proyecto: '', lugar: '', ejecuta: '',
      inicio: lunesProximo(), unidad: 'semanas', periodos: '', lluvias: { si: false, de: 6, a: 10 },
      fases: [], acts: [actVacia()], ver: { responsables: true, tabla: true }, nota: '', reviso: { nombre: '', cargo: '' },
      guia: { paso: '', visto: {} }
    };
  }
  function completar(d) {
    var b = nuevo(), x = M.copia(d || {});
    for (var k in x) { if (x[k] && typeof x[k] === 'object' && !Array.isArray(x[k]) && b[k] && typeof b[k] === 'object') { for (var j in x[k]) b[k][j] = x[k][j]; } else b[k] = x[k]; }
    b.acts = (b.acts || []).map(function (a) { var v = actVacia(); for (var k in a) v[k] = a[k]; return v; });
    if (!b.acts.length) b.acts.push(actVacia());
    return b;
  }

  /* ---------- El tiempo ---------- */
  var semanas = function () { return s.unidad !== 'meses'; };
  function deps(a) { return String(a.dep || '').split(/[^\d]+/).filter(Boolean).map(Number); }
  function finDe(a) { return n(a.dur) > 0 ? n(a.ini) - 1 + n(a.dur) : n(a.ini); }
  function vivas() { return s.acts.filter(function (a) { return String(a.nombre).trim(); }); }
  function largo() {
    if (n(s.periodos) > 0) return Math.min(104, Math.round(n(s.periodos)));
    var maxFin = s.acts.reduce(function (m, a) { return Math.max(m, finDe(a)); }, 0);
    var paso = semanas() ? 4 : 3;
    return Math.max(paso * 2, Math.ceil(Math.max(1, maxFin) / paso) * paso);
  }
  function base() { return M.deISO(s.inicio) || new Date(); }
  function inicioPeriodo(i) {
    var d = base();
    if (!semanas()) return new Date(d.getFullYear(), d.getMonth() + i, i === 0 ? d.getDate() : 1);
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + 7 * i); return x;
  }
  function finPeriodo(i) {
    var d = base();
    if (!semanas()) return new Date(d.getFullYear(), d.getMonth() + i + 1, 0);
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + 7 * i + 6); return x;
  }
  function mesDe(i) { var d = inicioPeriodo(i); if (semanas()) d.setDate(d.getDate() + 3); return d.getMonth(); }
  function enLluvias(mes) {
    var de = n(s.lluvias.de) - 1, a = n(s.lluvias.a) - 1;
    return de <= a ? (mes >= de && mes <= a) : (mes >= de || mes <= a);
  }
  function mesAnio(d) { return M.MES3[d.getMonth()] + ' ' + d.getFullYear(); }
  function cuando(a) {
    var i = n(a.ini) - 1; if (i < 0) return '';
    if (n(a.dur) <= 0) return semanas() ? 'Semana del ' + M.fechaCorta(inicioPeriodo(i)) : 'En ' + mesAnio(inicioPeriodo(i));
    var f = i + n(a.dur) - 1;
    if (!semanas()) return f === i ? mesAnio(inicioPeriodo(i)) : 'De ' + mesAnio(inicioPeriodo(i)) + ' a ' + mesAnio(inicioPeriodo(f));
    return 'Del ' + M.fechaCorta(inicioPeriodo(i)) + ' al ' + M.fechaCorta(finPeriodo(f));
  }
  function colorFase(id) {
    var i = -1; s.fases.forEach(function (f, j) { if (f.id === id) i = j; });
    return i < 0 ? (memb.color || '#0B3C49') : (i < PALETA.length ? PALETA[i] : GRIS);
  }
  function periodoTexto() { return 'Del ' + M.fecha(inicioPeriodo(0)) + ' al ' + M.fecha(finPeriodo(largo() - 1)) + ', por ' + (semanas() ? 'semanas' : 'meses') + '.'; }
  function bajada() { return [s.lugar && s.lugar + '.', s.ejecuta && 'A cargo de: ' + s.ejecuta + '.', periodoTexto()].filter(Boolean).join(' '); }
  function grupos() {
    var acts = vivas(), usadas = s.fases.filter(function (f) { return acts.some(function (a) { return a.fase === f.id; }); });
    if (!usadas.length) return { usadas: [], l: [{ f: null, l: acts }] };
    var gs = usadas.map(function (f) { return { f: f, l: acts.filter(function (a) { return a.fase === f.id; }) }; });
    var sueltas = acts.filter(function (a) { return !usadas.some(function (f) { return f.id === a.fase; }); });
    if (sueltas.length) gs.push({ f: { id: '', nombre: 'Otras actividades' }, l: sueltas });
    return { usadas: usadas, l: gs };
  }

  /* ---------- La revisión: las ilusiones del calendario ---------- */
  function revisar() {
    var l = [], acts = vivas();
    if (!acts.length) return [{ c: 'ojo', t: 'Todavía no hay actividades', x: 'Escribe la primera, o abre el ejemplo para ver cómo se ve un cronograma hecho.' }];
    function nums(arr) { return arr.map(function (a) { return s.acts.indexOf(a) + 1; }).join(', '); }
    var sinDueno = acts.filter(function (a) { var r = String(a.resp || '').trim(); return !r || /^(todos|todas|el equipo|equipo|nosotros|el grupo|todo el grupo|todo el equipo)$/i.test(r); });
    l.push(sinDueno.length ? { c: 'mal', t: 'El renglón sin dueño.', x: 'Sin un nombre o un cargo: ' + nums(sinDueno) + '. Lo que es de todos no es de nadie.' } : { c: 'bien', t: 'Cada renglón tiene quién responda.', x: '' });
    var N = largo(), conT = acts.filter(function (a) { return n(a.ini) >= 1; });
    var alFinal = conT.filter(function (a) { return finDe(a) > N * 0.75; });
    var joroba = conT.length >= 4 && alFinal.length / conT.length > 0.5;
    l.push(joroba ? { c: 'mal', t: 'La joroba.', x: alFinal.length + ' de ' + conT.length + ' actividades terminan en el último cuarto del calendario. Ahí ya no queda margen para que algo salga mal: algo tiene que recorrerse hacia el principio.' } : { c: 'bien', t: 'El calendario no se amontona al final.', x: '' });
    var malas = [];
    acts.forEach(function (a) {
      deps(a).forEach(function (k) {
        var b = s.acts[k - 1]; if (!b || b === a) return;
        var finB = n(b.dur) > 0 ? n(b.ini) - 1 + n(b.dur) : n(b.ini) - 1;
        if (n(a.ini) - 1 < finB) malas.push('la ' + (s.acts.indexOf(a) + 1) + ' empieza antes de que termine la ' + k);
      });
    });
    if (malas.length) l.push({ c: 'mal', t: 'Lo que espera a otro.', x: malas.join('; ').replace(/^./, function (x) { return x.toUpperCase(); }) + '. O se recorre, o la dependencia no es tal.' });
    var sinProd = acts.filter(function (a) { return n(a.dur) > 0 && !String(a.prod || '').trim(); });
    l.push(sinProd.length ? { c: 'ojo', t: 'El producto que deja.', x: 'Sin producto: ' + nums(sinProd) + '. Cada actividad deja algo que se puede enseñar: una lista, una foto, un acta.' } : { c: 'bien', t: 'Cada actividad deja algo que se puede enseñar.', x: '' });
    if (s.lluvias.si) {
      var obra = /(constru|colar|cimient|excav|zanj|techa|levant|pintar|obra|cercar|cerca |muro|piso|firme|tarima|banca)/i, siembra = /(sembr|plant|reforest|trasplant)/i;
      var mojadas = [], secas = [];
      acts.forEach(function (a) {
        if (n(a.dur) <= 0) return;
        var meses = []; for (var i = n(a.ini) - 1; i < n(a.ini) - 1 + n(a.dur); i++) meses.push(enLluvias(mesDe(i)));
        if (obra.test(a.nombre) && meses.every(Boolean)) mojadas.push(a);
        if (siembra.test(a.nombre) && !meses.some(Boolean)) secas.push(a);
      });
      if (mojadas.length) l.push({ c: 'ojo', t: 'Obra en plenas lluvias.', x: 'La ' + nums(mojadas) + ' cae completa en la temporada de lluvias. Lo que se construye busca la seca.' });
      if (secas.length) l.push({ c: 'ojo', t: 'Siembra en la seca.', x: 'La ' + nums(secas) + ' no toca la temporada de lluvias. Lo que se siembra espera la lluvia, o lleva riego asegurado.' });
    }
    if (!acts.some(function (a) { return a.hito || n(a.dur) <= 0; })) l.push({ c: 'ojo', t: 'Sin hitos.', x: 'Marca con rombo los momentos que deciden algo: la firma, la asamblea, la entrega.' });
    var fuera = acts.filter(function (a) { return finDe(a) > N; });
    if (fuera.length) l.push({ c: 'ojo', t: 'Se sale de la gráfica.', x: 'La ' + nums(fuera) + ' termina después del periodo ' + N + '. Alarga la gráfica o deja el largo en blanco.' });
    return l;
  }
  function pintarRevision() {
    $('#revision').innerHTML = revisar().map(function (r) { return '<li class="' + r.c + '"><b>' + esc(r.t) + '</b>' + esc(r.x) + '</li>'; }).join('');
  }

  /* ---------- Las fases ---------- */
  function pintarFases() {
    $('#lista-fases').innerHTML = s.fases.map(function (f, i) {
      return '<div class="renglon"><span class="muestra" style="background:' + colorFase(f.id) + '"></span>' +
        '<input type="text" aria-label="Nombre de la fase" data-k="fases.' + i + '.nombre" placeholder="Nombre de la fase">' +
        '<button type="button" class="quitar" data-quitar-fase="' + i + '" aria-label="Quitar esta fase">×</button></div>';
    }).join('') || '<p class="ayuda" style="margin:0">Sin fases todavía. Toca las de abajo o sigue sin fases.</p>';
    M.llenar($('#lista-fases'), s);
  }
  function opcionesFase(sel) {
    return '<option value="">Sin fase</option>' + s.fases.map(function (f) { return '<option value="' + esc(f.id) + '"' + (f.id === sel ? ' selected' : '') + '>' + esc(f.nombre || 'Fase sin nombre') + '</option>'; }).join('');
  }

  /* ---------- Las actividades, de una en una ---------- */
  function editorAct(a, i) {
    var u = semanas() ? ['la semana', 'semanas'] : ['el mes', 'meses'];
    var fase = '<div class="campo"><label for="a-fase">Fase</label><select id="a-fase" data-k="acts.' + i + '.fase">' + opcionesFase(a.fase) + '</select></div>';
    return '<div class="campo"><label for="a-nombre">Qué se hace</label><input id="a-nombre" class="grande" type="text" data-k="acts.' + i + '.nombre" placeholder="' + (n(a.dur) <= 0 ? 'Qué se decide o se entrega' : 'Una actividad que se pueda terminar') + '"></div>' +
      '<div class="campos"><div class="campo c3"><label for="a-resp">Quién responde</label><input id="a-resp" type="text" data-k="acts.' + i + '.resp" placeholder="Un nombre o un cargo"></div>' +
      '<div class="campo c3"><label for="a-prod">Qué deja al terminar</label><input id="a-prod" type="text" data-k="acts.' + i + '.prod" placeholder="Algo que se pueda enseñar"></div></div>' +
      '<p class="ed-tit">Cuándo</p><div class="ed-tiempo">' +
      '<label>Empieza en ' + u[0] + ' <input type="number" inputmode="numeric" min="1" step="1" data-k="acts.' + i + '.ini" data-tipo="num" aria-label="Empieza en ' + u[0] + '"></label>' +
      '<label>y dura <input type="number" inputmode="decimal" min="0" step="1" data-k="acts.' + i + '.dur" data-tipo="num" aria-label="Dura"> ' + u[1] + '</label>' +
      '<label class="palomita"><input type="checkbox" data-k="acts.' + i + '.hito"><span>Termina en hito</span></label></div>' +
      '<p class="ed-fecha" data-fecha="' + i + '"></p>' +
      (s.fases.length ? fase : '') +
      '<details class="mas"><summary>' + (s.fases.length ? 'Lo que espera a otra' : 'Fase y lo que espera a otra') + '</summary><div class="campos">' +
      (s.fases.length ? '' : '<div class="campo c3"><label for="a-fase">Fase</label><select id="a-fase" data-k="acts.' + i + '.fase">' + opcionesFase(a.fase) + '</select></div>') +
      '<div class="campo c3"><label for="a-dep">Depende de (los números)</label><input id="a-dep" type="text" class="dep" inputmode="numeric" data-k="acts.' + i + '.dep" placeholder="2, 3"></div></div></details>';
  }
  function refrescarFechas() {
    M.$$('[data-fecha]').forEach(function (el) {
      var a = s.acts[+el.dataset.fecha]; if (!a) return;
      el.textContent = cuando(a) + (n(a.dur) <= 0 ? '. Es un hito: un momento, sin duración.' : '');
    });
  }
  /* Reacomodar sin romper las dependencias */
  function reacomodar(cambio) {
    var antes = s.acts.slice();
    s.acts.forEach(function (a) { a._d = deps(a).map(function (k) { return antes[k - 1] && antes[k - 1].id; }).filter(Boolean); });
    cambio();
    var pos = {}; s.acts.forEach(function (a, i) { pos[a.id] = i + 1; });
    s.acts.forEach(function (a) { a.dep = (a._d || []).map(function (id) { return pos[id]; }).filter(Boolean).join(', '); delete a._d; });
  }
  function agregar(hito) {
    var ult = s.acts[s.acts.length - 1], a = actVacia(hito);
    if (ult) { a.fase = ult.fase; a.ini = Math.max(1, ult.dur > 0 ? n(ult.ini) + n(ult.dur) : n(ult.ini)); }
    if (s.acts.length === 1 && !String(s.acts[0].nombre).trim() && !hito) { s.acts[0].fase = a.fase; cambio(); return 0; }
    s.acts.push(a); cambio();
    return s.acts.length - 1;
  }
  function focoAct(i) {
    var p = M.$('.pregunta[data-paso="actividades"]'), a = s.acts[i];
    p.dataset.foco = a && String(a.nombre).trim() ? 'act-' + a.id : 'gantt';
    if (guia && guia.actual() === 'actividades') guia.refrescar();
    refrescarFechas();
  }

  /* ---------- La hoja ---------- */
  function rangosLluvia(N) {
    var r = [], ini = -1;
    for (var i = 0; i <= N; i++) {
      var si = i < N && enLluvias(mesDe(i));
      if (si && ini < 0) ini = i;
      if (!si && ini >= 0) { r.push([ini, i]); ini = -1; }
    }
    return r;
  }
  function escala(N) {
    var arriba = '', abajo = '', pct = function (i) { return (100 * i / N).toFixed(4) + '%'; };
    if (!semanas()) {
      var cada = N > 24 ? 2 : 1;
      for (var i = 0; i < N; i++) {
        var d = inicioPeriodo(i);
        if (i === 0 || d.getMonth() === 0) arriba += '<span style="left:' + pct(i) + '">' + d.getFullYear() + '</span>';
        if (i % cada === 0) abajo += '<span style="left:' + pct(i) + '">' + M.MES3[d.getMonth()] + '</span>';
      }
    } else {
      var paso = N <= 16 ? 1 : N <= 32 ? 2 : 4, mesPrevio = -1;
      for (var j = 0; j < N; j++) {
        var m = mesDe(j), dj = inicioPeriodo(j);
        if (m !== mesPrevio) { arriba += '<span style="left:' + pct(j) + '">' + M.MES3[m] + (j === 0 || m === 0 ? ' ' + dj.getFullYear() : '') + '</span>'; mesPrevio = m; }
        if (j % paso === 0) abajo += '<span style="left:' + pct(j) + '">' + (j + 1) + '</span>';
      }
    }
    return '<div class="escala"><div class="arriba">' + arriba + '</div><div class="abajo">' + abajo + '</div></div>';
  }
  function hojaCronograma() {
    var m = memb, N = largo(), conResp = !!s.ver.responsables;
    var acts = vivas();
    var pct = function (x) { return (100 * Math.max(0, Math.min(N, x)) / N).toFixed(4) + '%'; };
    var lluvias = s.lluvias.si ? rangosLluvia(N).map(function (r) { return '<div class="lluvia" style="left:' + pct(r[0]) + ';width:' + (100 * (r[1] - r[0]) / N).toFixed(4) + '%"></div>'; }).join('') : '';
    var tipo = s.titulo || 'Cronograma';
    var der = '<div class="tipo"' + (tipo.length > 16 ? ' style="font-size:15pt"' : '') + '>' + esc(tipo) + '</div><div class="folio">' + esc(M.fecha(M.hoyISO())) + '</div>';
    var cabeza = '<div style="margin-top:.14in" data-parte="proyecto"><h2 class="titulo-doc"' + (s.proyecto ? '' : ' style="color:var(--t-tenue)"') + '>' + esc(s.proyecto || 'Nombre del proyecto') + '</h2><p class="bajada">' + esc(bajada()) + '</p></div>';
    function filaAct(a) {
      var i = s.acts.indexOf(a), col = colorFase(a.fase), x0 = n(a.ini) - 1, d = n(a.dur);
      var marca = '';
      if (d > 0) marca += '<div class="barra-g" style="left:' + pct(x0) + ';width:' + (100 * Math.max(0, Math.min(N, x0 + d) - Math.max(0, x0)) / N).toFixed(4) + '%;background:' + col + '"></div>';
      if (d <= 0) marca += '<div class="rombo" style="left:' + pct(x0 + 0.5) + '"></div>';
      else if (a.hito) marca += '<div class="rombo" style="left:' + pct(x0 + d) + '"></div>';
      return '<tr data-parte="act-' + esc(a.id) + '"><td class="n-act">' + (i + 1) + '</td><td>' + esc(a.nombre) + '</td>' + (conResp ? '<td class="resp">' + esc(a.resp) + '</td>' : '') +
        '<td class="linea">' + lluvias + marca + '</td></tr>';
    }
    var g = grupos(), cuerpo = '';
    if (g.usadas.length) {
      g.l.forEach(function (gr) {
        var a0 = Math.min.apply(null, gr.l.map(function (a) { return n(a.ini) - 1; })), a1 = Math.max.apply(null, gr.l.map(function (a) { return n(a.dur) > 0 ? n(a.ini) - 1 + n(a.dur) : n(a.ini) - 0.5; }));
        var col = gr.f.id ? colorFase(gr.f.id) : GRIS;
        cuerpo += '<tr class="fase"><td></td><td class="nombre-fase"' + (conResp ? ' colspan="2"' : '') + '><i style="background:' + col + '"></i>' + esc(gr.f.nombre || 'Fase sin nombre') + '</td>' +
          '<td class="linea"><div class="llave-fase" style="left:' + pct(a0) + ';width:' + (100 * Math.max(0.3, a1 - a0) / N).toFixed(4) + '%;background:' + col + '"></div></td></tr>';
        cuerpo += gr.l.map(filaAct).join('');
      });
    } else cuerpo = acts.map(filaAct).join('');
    if (!acts.length) cuerpo = '<tr><td></td><td colspan="' + (conResp ? 3 : 2) + '" style="color:var(--t-tenue);padding:14pt 0">Las actividades que escribas aparecen aquí, con su barra.</td></tr>';
    var tabla = '<table class="gantt" data-parte="gantt" style="--n:' + N + '"><colgroup><col style="width:.3in"><col style="width:' + (conResp ? 2.55 : 3.1) + 'in">' + (conResp ? '<col style="width:1.25in">' : '') + '<col></colgroup>' +
      '<thead><tr><th></th><th>Actividad</th>' + (conResp ? '<th>Responsable</th>' : '') + '<th class="escala-th" data-parte="escala">' + escala(N) + '</th></tr></thead><tbody>' + cuerpo + '</tbody></table>';
    var ley = [];
    if (g.usadas.length > 1) g.usadas.forEach(function (f) { ley.push('<span><i style="background:' + colorFase(f.id) + '"></i>' + esc(f.nombre || 'Fase') + '</span>'); });
    if (acts.some(function (a) { return a.hito || n(a.dur) <= 0; })) ley.push('<span><i class="r"></i>Hito</span>');
    if (s.lluvias.si) ley.push('<span><i class="ll"></i>Temporada de lluvias</span>');
    var leyenda = ley.length ? '<div class="leyenda-g" data-parte="leyenda">' + ley.join('') + '</div>' : '<div class="leyenda-g hueco" data-parte="leyenda">Aquí va la leyenda: los colores de las fases, los hitos y las lluvias.</div>';
    var fechas = '<div class="hueco" data-parte="tabla-fechas" style="margin-top:.2in">Aquí va la tabla con fechas, si la marcas.</div>';
    if (s.ver.tabla && acts.length) {
      fechas = '<div data-parte="tabla-fechas"><h3 class="titulo-tabla">Calendario de actividades</h3><table class="tabla fechas"><thead><tr><th class="num">#</th><th>Actividad</th>' + (g.usadas.length ? '<th>Fase</th>' : '') +
        '<th>Responsable</th><th>Qué deja</th><th class="nw">Empieza</th><th class="nw">Termina</th><th class="nw">Depende</th></tr></thead><tbody>' +
        acts.map(function (a) {
          var f = s.fases.filter(function (x) { return x.id === a.fase; })[0], fc = filaFechas(a);
          return '<tr><td class="num" style="color:var(--t-tenue)">' + (s.acts.indexOf(a) + 1) + '</td><td>' + esc(a.nombre) + (a.hito && n(a.dur) > 0 ? ' <span style="color:var(--t-tenue)">(termina en hito)</span>' : '') + '</td>' +
            (g.usadas.length ? '<td class="fase-c">' + esc(f ? f.nombre : '') + '</td>' : '') + '<td>' + esc(a.resp) + '</td><td>' + esc(a.prod) + '</td><td class="nw">' + esc(fc.e) + '</td><td class="nw">' + esc(fc.t) + '</td><td class="nw">' + esc(deps(a).join(', ')) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    var nota = s.nota ? '<p class="nota-pie" data-parte="nota">' + M.escBr(s.nota) + '</p>' : '<p class="nota-pie hueco" data-parte="nota">Aquí va la nota al pie.</p>';
    var firmas = '<div class="firmas">' + M.firma(m, 'Elaboró') + (s.reviso.nombre ? M.firma(m, 'Revisó', { nombre: s.reviso.nombre, cargo: s.reviso.cargo, sinImagen: true }) : '') + '</div>';
    return M.hoja({ horizontal: true, compacta: true, acento: m.color, pieIzq: M.pieMembrete(m), pieDer: esc((s.proyecto ? s.proyecto + '. ' : '') + tipo) },
      M.encabezado(m, der) + cabeza + leyenda + tabla + nota + fechas + firmas);
  }
  function filaFechas(a) {
    var i = n(a.ini) - 1, d = n(a.dur);
    return { e: semanas() ? M.fechaCorta(inicioPeriodo(i)) : mesAnio(inicioPeriodo(i)), t: d <= 0 ? 'Hito' : (semanas() ? M.fechaCorta(finPeriodo(i + d - 1)) : mesAnio(inicioPeriodo(i + d - 1))) };
  }
  function pintarHojaYa() {
    $('#marco').innerHTML = hojaCronograma(); M.ajustarHoja();
    var acts = vivas(), N = largo();
    $('#resumen-hoja').textContent = acts.length ? 'Así va: ' + acts.length + ' renglones, ' + acts.filter(function (a) { return a.hito || n(a.dur) <= 0; }).length + ' hitos, ' + N + ' ' + (semanas() ? 'semanas' : 'meses') : 'Así va tu cronograma';
    $('#ayuda-periodos').textContent = n(s.periodos) > 0 ? 'Fijo en ' + N + ' ' + (semanas() ? 'semanas' : 'meses') + '.' : 'En blanco, se ajusta a las actividades (ahora: ' + N + ' ' + (semanas() ? 'semanas' : 'meses') + ').';
  }
  var pintarHoja = M.debounce(pintarHojaYa, 60);

  /* ---------- Word: la gráfica como tabla ---------- */
  function columnas() {
    var N = largo(), cada = semanas() ? (N > 52 ? 4 : N > 26 ? 2 : 1) : (N > 36 ? 2 : 1), cols = [];
    for (var i = 0; i < N; i += cada) cols.push({ de: i, a: Math.min(N, i + cada) - 1 });
    return cols;
  }
  function wordCronograma() {
    var m = memb, acts = vivas(), conResp = !!s.ver.responsables, tipo = s.titulo || 'Cronograma';
    var d = M.docx({ horizontal: true, acento: m.color, titulo: tipo + (s.proyecto ? ' ' + s.proyecto : ''), autor: m.nombre, pie: [m.nombre, m.telefono, m.correo].filter(Boolean).join('   ·   '), margen: { izq: 0.5, der: 0.5, sup: 0.5, inf: 0.6 } });
    M.docxMembrete(d, m, { tipo: tipo, folio: M.fecha(M.hoyISO()), tamTipo: tipo.length > 16 ? 15 : 20, ancho: 3.2 });
    d.p([{ t: s.proyecto || 'Nombre del proyecto', tam: 13 }], { antes: 8, despues: 1 });
    d.p([{ t: bajada(), tam: 9, color: '#4B5A5E' }], { despues: 6 });
    var cols = columnas(), wN = 0.3, wAct = conResp ? 2.5 : 3.3, wResp = conResp ? 1.3 : 0;
    var wCol = (d.util - wN - wAct - wResp) / cols.length;
    var anchos = [wN, wAct].concat(conResp ? [wResp] : []).concat(cols.map(function () { return wCol; }));
    var fijas = conResp ? 3 : 2, filas = [];
    var linea = { c: '#E3E8E9', g: 0.25 };
    // Encabezado: meses arriba, semanas o meses abajo
    var fila1 = [{ t: '', span: fijas }], fila2 = [{ t: '' }, { t: [{ t: 'Actividad', tam: 7.4, color: '#7B898C' }] }].concat(conResp ? [{ t: [{ t: 'Responsable', tam: 7.4, color: '#7B898C' }] }] : []);
    var grupo = null;
    cols.forEach(function (cl) {
      var d0 = inicioPeriodo(cl.de), etiqueta = semanas() ? M.MES3[mesDe(cl.de)] + (cl.de === 0 || mesDe(cl.de) === 0 ? ' ' + d0.getFullYear() : '') : String(d0.getFullYear());
      var clave = semanas() ? mesDe(cl.de) + '-' + d0.getFullYear() : String(d0.getFullYear());
      if (grupo && grupo.clave === clave) grupo.celda.span++;
      else { grupo = { clave: clave, celda: { t: [{ t: etiqueta, b: true, tam: 7, color: '#1D2A2E' }], span: 1, bordes: { left: { c: '#9AA7AA', g: 0.5 } } } }; fila1.push(grupo.celda); }
      fila2.push({ t: [{ t: semanas() ? String(cl.de + 1) : M.MES3[d0.getMonth()], tam: 6.5, color: '#7B898C' }], alin: 'centro', bordes: { left: linea } });
    });
    fila2.forEach(function (c) { c.bordes = Object.assign({}, c.bordes || {}, { bottom: { c: d.acento, g: 1 } }); });
    filas.push(fila1, fila2);
    function celdasLinea(a, claro) {
      var x0 = n(a.ini) - 1, du = n(a.dur), col = colorFase(a.fase);
      return cols.map(function (cl) {
        var ocupa = du > 0 && x0 <= cl.a && x0 + du - 1 >= cl.de;
        var rombo = (du <= 0 && x0 >= cl.de && x0 <= cl.a) || (du > 0 && a.hito && x0 + du - 1 >= cl.de && x0 + du - 1 <= cl.a);
        var lluvia = s.lluvias.si && enLluvias(mesDe(cl.de));
        var c = { t: rombo ? [{ t: '◆', tam: 8, color: ocupa ? '#FFFFFF' : '#1D2A2E' }] : '', alin: 'centro', vAlin: 'center', bordes: { left: linea, bottom: { c: '#DCE2E3', g: 0.5 } } };
        if (ocupa) c.fondo = claro ? M.aclarar(col, 0.4) : col; else if (lluvia) c.fondo = '#E5F2F4';
        return c;
      });
    }
    var g = grupos();
    var abajo = { bottom: { c: '#DCE2E3', g: 0.5 } };
    g.l.forEach(function (gr) {
      if (gr.f) {
        var col = gr.f.id ? colorFase(gr.f.id) : GRIS;
        var a0 = Math.min.apply(null, gr.l.map(function (a) { return n(a.ini); })), a1 = Math.max.apply(null, gr.l.map(function (a) { return n(a.dur) > 0 ? n(a.ini) - 1 + n(a.dur) : n(a.ini); }));
        filas.push([{ t: '' }, { t: [{ t: gr.f.nombre || 'Fase sin nombre', b: true, tam: 8.4, color: col }], span: fijas - 1, antes: 4 }].concat(cols.map(function (cl) {
          var dentro = a0 - 1 <= cl.a && a1 - 1 >= cl.de;
          return { t: '', fondo: dentro ? M.aclarar(col, 0.22) : null, bordes: { left: linea } };
        })));
      }
      gr.l.forEach(function (a) {
        filas.push([{ t: [{ t: String(s.acts.indexOf(a) + 1), tam: 8, color: '#7B898C' }], alin: 'der', bordes: abajo }, { t: [{ t: a.nombre, tam: 8.4 }], bordes: abajo }]
          .concat(conResp ? [{ t: [{ t: a.resp || '', tam: 7.8, color: '#4B5A5E' }], bordes: abajo }] : []).concat(celdasLinea(a)));
      });
    });
    if (!acts.length) filas.push([{ t: '' }, { t: [{ t: 'Todavía no hay actividades.', color: '#7B898C' }], span: fijas - 1 + cols.length }]);
    d.tabla({ anchos: anchos, encabezado: 2, tam: 8, margenCelda: 0.03, margenV: 0.03, filas: filas });
    var ley = [];
    if (g.usadas.length > 1) g.usadas.forEach(function (f) { ley.push({ t: '■ ', color: colorFase(f.id), tam: 10 }, { t: (f.nombre || 'Fase') + '      ', tam: 8, color: '#4B5A5E' }); });
    if (acts.some(function (a) { return a.hito || n(a.dur) <= 0; })) ley.push({ t: '◆ ', tam: 8 }, { t: 'Hito      ', tam: 8, color: '#4B5A5E' });
    if (s.lluvias.si) ley.push({ t: '■ ', color: '#BFE0E5', tam: 10 }, { t: 'Temporada de lluvias', tam: 8, color: '#4B5A5E' });
    if (ley.length) d.p(ley, { antes: 6, despues: 4 });
    if (s.nota) d.p([{ t: s.nota, tam: 8.5, color: '#4B5A5E' }], { antes: 6 });
    if (s.ver.tabla && acts.length) {
      d.p([{ t: 'Calendario de actividades', b: true, tam: 10.5 }], { antes: 14, despues: 4, junto: true });
      var cs = [{ t: '#', ancho: 0.35, alin: 'der' }, { t: 'Actividad', ancho: 2.6 }].concat(g.usadas.length ? [{ t: 'Fase', ancho: 1 }] : [])
        .concat([{ t: 'Responsable', ancho: 1.5 }, { t: 'Qué deja', ancho: 1.9 }, { t: 'Empieza', ancho: 0.85 }, { t: 'Termina', ancho: 0.85 }, { t: 'Depende', ancho: 0.6 }]);
      var resto = d.util - cs.reduce(function (s2, c) { return s2 + c.ancho; }, 0); cs[1].ancho += resto;
      M.docxTablaDatos(d, cs, acts.map(function (a) {
        var f = s.fases.filter(function (x) { return x.id === a.fase; })[0], fc = filaFechas(a);
        return [{ t: [{ t: String(s.acts.indexOf(a) + 1), color: '#7B898C' }] }, a.nombre + (a.hito && n(a.dur) > 0 ? ' (termina en hito)' : '')].concat(g.usadas.length ? [f ? f.nombre : ''] : [])
          .concat([a.resp, a.prod, fc.e, fc.t, deps(a).join(', ')]);
      }), { tam: 8.2 });
    }
    var firmas = [{ que: 'Elaboró', img: m.firma, nombre: m.firmaNombre || m.nombre, cargo: m.titulo }];
    if (s.reviso.nombre) firmas.push({ que: 'Revisó', nombre: s.reviso.nombre, cargo: s.reviso.cargo });
    M.docxFirmas(d, firmas);
    return d;
  }

  /* ---------- La imagen: la gráfica para WhatsApp ---------- */
  var L = M.lienzo;
  function imagenCronograma() {
    var m = memb, acts = vivas(), N = largo(), g = grupos(), col0 = m.color || '#0B3C49';
    var filasN = acts.length + (g.usadas.length ? g.l.length : 0), FILA = 50;
    var W = 1600, X0 = 72, XN = 72 + 560, XF = W - 72, H = 300 + Math.max(3, filasN) * FILA + 170;
    var x = L.crear(W, H), ctx = x.g, ancho = (XF - XN) / N;
    return L.fuentes().then(function () {
      ctx.fillStyle = col0; ctx.fillRect(0, 0, W, 14);
      return L.logo(ctx, m, X0, 46, 70);
    }).then(function () {
      L.texto(ctx, m.nombre || '', X0 + 90, 52, { tam: 26, peso: 600, color: '#1D2A2E', ancho: 700, max: 1 });
      L.texto(ctx, s.titulo || 'Cronograma', XF, 50, { tam: 34, peso: 500, color: col0, alin: 'der' });
      L.texto(ctx, s.proyecto || 'Nombre del proyecto', X0, 140, { tam: 44, peso: 600, color: '#1D2A2E', ancho: W - 144, max: 1 });
      L.texto(ctx, bajada(), X0, 198, { tam: 24, color: '#4B5A5E', ancho: W - 144, max: 1 });
      var yE = 254;
      // la escala
      if (s.lluvias.si) rangosLluvia(N).forEach(function (r) { ctx.fillStyle = 'rgba(0,137,158,.09)'; ctx.fillRect(XN + r[0] * ancho, yE, (r[1] - r[0]) * ancho, H - yE - 150); });
      var mesPrevio = -1, paso = semanas() ? (N <= 16 ? 1 : N <= 32 ? 2 : 4) : (N > 24 ? 2 : 1);
      for (var i = 0; i < N; i++) {
        var xi = XN + i * ancho, d0 = inicioPeriodo(i), mesI = semanas() ? mesDe(i) : d0.getMonth();
        if (semanas() ? mesI !== mesPrevio : (i === 0 || mesI === 0)) {
          L.linea(ctx, xi, yE, xi, yE + 30, '#9AA7AA', 1.5);
          L.texto(ctx, semanas() ? M.MES3[mesI] + (i === 0 || mesI === 0 ? ' ' + inicioPeriodo(i).getFullYear() : '') : String(d0.getFullYear()), xi + 6, yE, { tam: 19, peso: 600, color: '#1D2A2E' });
          mesPrevio = mesI;
        }
        if (i % paso === 0) L.texto(ctx, semanas() ? String(i + 1) : M.MES3[mesI], xi + 4, yE + 30, { tam: 16, color: '#7B898C' });
        L.linea(ctx, xi, yE + 56, xi, yE + 56 + filasN * FILA, '#EEF1F1', 1);
      }
      L.texto(ctx, 'Actividad', X0, yE + 30, { tam: 17, color: '#7B898C' });
      var y = yE + 58;
      L.linea(ctx, X0, y, XF, y, col0, 2.5);
      function barra(a) {
        var c = colorFase(a.fase), x0 = n(a.ini) - 1, du = n(a.dur), yc = y + FILA / 2;
        L.texto(ctx, String(s.acts.indexOf(a) + 1), X0 + 26, y + 13, { tam: 18, color: '#7B898C', alin: 'der' });
        L.texto(ctx, a.nombre, X0 + 40, y + 12, { tam: 21, color: '#1D2A2E', ancho: XN - X0 - 56, max: 1 });
        if (du > 0) L.rect(ctx, XN + Math.max(0, x0) * ancho + 1, yc - 11, Math.max(4, (Math.min(N, x0 + du) - Math.max(0, x0)) * ancho - 2), 22, 6, c);
        var xr = du <= 0 ? x0 + 0.5 : (a.hito ? x0 + du : null);
        if (xr != null && xr <= N) {
          var cx = XN + xr * ancho; ctx.save(); ctx.translate(cx, yc); ctx.rotate(Math.PI / 4);
          ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-10, -10, 20, 20); ctx.fillStyle = '#1D2A2E'; ctx.fillRect(-7.5, -7.5, 15, 15); ctx.restore();
        }
        y += FILA; L.linea(ctx, X0, y, XF, y, '#E3E8E9', 1);
      }
      g.l.forEach(function (gr) {
        if (gr.f) {
          var c = gr.f.id ? colorFase(gr.f.id) : GRIS;
          L.rect(ctx, X0 + 40, y + 18, 14, 14, 3, c);
          L.texto(ctx, gr.f.nombre || 'Fase sin nombre', X0 + 62, y + 12, { tam: 20, peso: 600, color: c, ancho: XN - X0 - 80, max: 1 });
          var a0 = Math.min.apply(null, gr.l.map(function (a) { return n(a.ini) - 1; })), a1 = Math.max.apply(null, gr.l.map(function (a) { return n(a.dur) > 0 ? n(a.ini) - 1 + n(a.dur) : n(a.ini) - 0.5; }));
          L.rect(ctx, XN + a0 * ancho, y + FILA / 2 + 2, Math.max(6, (a1 - a0) * ancho), 5, 2.5, c);
          y += FILA;
        }
        gr.l.forEach(barra);
      });
      if (!acts.length) L.texto(ctx, 'Las actividades aparecen aquí, con su barra.', X0 + 40, y + 12, { tam: 21, color: '#7B898C' });
      // la leyenda
      var yl = H - 128, xl = X0;
      function ley(color, texto, rombo) {
        if (rombo) { ctx.save(); ctx.translate(xl + 9, yl + 13); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#1D2A2E'; ctx.fillRect(-7, -7, 14, 14); ctx.restore(); }
        else L.rect(ctx, xl, yl + 4, 30, 18, 5, color);
        L.texto(ctx, texto, xl + 40, yl, { tam: 20, color: '#4B5A5E' });
        xl += 40 + L.medir(ctx, texto, { tam: 20 }) + 34;
      }
      if (g.usadas.length > 1) g.usadas.forEach(function (f) { ley(colorFase(f.id), f.nombre || 'Fase'); });
      if (acts.some(function (a) { return a.hito || n(a.dur) <= 0; })) ley('', 'Hito', true);
      if (s.lluvias.si) ley('rgba(0,137,158,.22)', 'Temporada de lluvias');
      L.linea(ctx, X0, H - 72, XF, H - 72, '#DCE2E3', 1.5);
      L.texto(ctx, [m.nombre, m.telefono && 'Tel. ' + m.telefono, m.correo].filter(Boolean).join('     '), X0, H - 56, { tam: 20, color: '#7B898C' });
      return x.c;
    });
  }

  /* ---------- Guardar y abrir ---------- */
  var guardarLuego = M.debounce(function () {
    if (!s.tocado) return;
    if (A.guardar(s)) { var d = new Date(); $('#estado').textContent = 'Guardado ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  }, 350);
  function actualizar() { pintarRevision(); pintarHoja(); }
  function cambio() { s.tocado = true; actualizar(); guardarLuego(); }
  function mostrarLluvias() { $('#lluvias-meses').classList.toggle('oculto', !s.lluvias.si); }
  function abrir(d, mensaje, guardarYa, paso) {
    if (s && s.tocado) A.guardar(s);
    s = completar(d); pintarFases(); M.llenar(banco, s); mostrarLluvias();
    lista.empezar(function (a) { return !String(a.nombre).trim(); });
    actualizar(); pintarHojaYa();
    $('#estado').textContent = s.tocado ? 'Guardado' : 'Se guarda solo al escribir';
    if (s.tocado) A.marcarActual(s.id);
    if (guardarYa) { s.tocado = true; guardarLuego(); }
    guia.abrir({ paso: paso, primero: memb.nombre ? 'proyecto' : 'mb-nombre', sinFoco: true });
    if (mensaje) M.aviso(mensaje);
  }

  var SEM_POR_MES = 4.345;
  function convertir(aSemanas) {
    s.acts.forEach(function (a) {
      var i = Math.max(1, n(a.ini) || 1), d = Math.max(0, n(a.dur));
      if (aSemanas) { a.ini = Math.round((i - 1) * SEM_POR_MES) + 1; a.dur = d > 0 ? Math.max(1, Math.round(d * SEM_POR_MES)) : 0; }
      else { a.ini = Math.floor((i - 1) / SEM_POR_MES) + 1; a.dur = d > 0 ? Math.max(1, Math.round(d / SEM_POR_MES)) : 0; }
    });
    if (n(s.periodos) > 0) s.periodos = aSemanas ? Math.round(n(s.periodos) * SEM_POR_MES) : Math.max(1, Math.round(n(s.periodos) / SEM_POR_MES));
  }
  M.escuchar(banco, function () { return s; }, function (k) {
    s.tocado = true;
    if (k === 'unidad') {
      var hay = vivas().length;
      if (hay && window.confirm('¿Paso también las actividades a ' + (semanas() ? 'semanas' : 'meses') + '? Así cada una se queda en las mismas fechas. Si dices que no, los números se quedan igual y cambian de significado.')) {
        convertir(semanas()); M.llenar(banco, s);
      }
      lista.pintar();
    }
    if (k === 'lluvias.si') mostrarLluvias();
    if (/^acts\.\d+\.dur$/.test(k)) { var a = s.acts[+k.split('.')[1]]; if (n(a.dur) <= 0) { a.hito = true; M.llenar($('#lista-acts'), s); } }
    if (/^acts\./.test(k)) { lista.filas(); if (/\.nombre$/.test(k)) focoAct(lista.actual()); }
    if (/^fases\./.test(k)) pintarColoresFase();
    refrescarFechas(); actualizar(); guardarLuego();
  });
  function pintarColoresFase() { M.$$('#lista-fases .muestra').forEach(function (el, i) { if (s.fases[i]) el.style.background = colorFase(s.fases[i].id); }); }
  banco.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-quitar-fase]'))) {
      var f = s.fases[+b.dataset.quitarFase]; s.fases.splice(+b.dataset.quitarFase, 1);
      s.acts.forEach(function (a) { if (a.fase === f.id) a.fase = ''; });
      pintarFases(); cambio(); return;
    }
    if ((b = e.target.closest('#sug-fases button'))) {
      var nombre = b.textContent === 'Otra' ? '' : b.textContent;
      s.fases.push({ id: M.uid(), nombre: nombre }); pintarFases(); cambio();
      var ins = M.$$('#lista-fases input'); if (ins.length && !nombre) ins[ins.length - 1].focus();
      return;
    }
    if (e.target.closest('[data-agregar-hito]')) {
      var i = agregar(true); lista.editar(i); focoAct(i);
      var inp = M.$('#a-nombre'); if (inp) inp.focus();
    }
  });
  $('#ordenar').onclick = function () {
    reacomodar(function () {
      var con = s.acts.map(function (a, i) { return [a, i]; });
      con.sort(function (x, y) { return (n(x[0].ini) - n(y[0].ini)) || (x[1] - y[1]); });
      s.acts = con.map(function (x) { return x[0]; });
    });
    lista.pintar(); cambio(); M.aviso('Ordenadas por fecha de inicio. Las dependencias siguen apuntando a las mismas actividades.');
  };

  var opcionesMes = M.MESES.map(function (m, i) { return '<option value="' + (i + 1) + '">' + m + '</option>'; }).join('');
  $('#ll-de').innerHTML = opcionesMes; $('#ll-a').innerHTML = opcionesMes;

  function describir(d) {
    var x = completar(d), acts = x.acts.filter(function (a) { return String(a.nombre).trim(); });
    return { t: x.proyecto || 'Cronograma sin nombre', v: acts.length + ' renglones', d: [x.lugar, 'empieza ' + M.fechaCorta(x.inicio)].filter(Boolean).join(', ') };
  }
  function ejemplo() {
    var d = nuevo(); d.tocado = true;
    d.proyecto = 'Vivero escolar de especies nativas'; d.lugar = 'Campus Concá, Arroyo Seco'; d.ejecuta = 'Grupo de 5.º semestre';
    d.inicio = '2027-01-04'; d.unidad = 'meses'; d.periodos = 12; d.lluvias = { si: true, de: 6, a: 10 };
    d.fases = [{ id: 'f1', nombre: 'Preparar' }, { id: 'f2', nombre: 'Construir' }, { id: 'f3', nombre: 'Producir' }, { id: 'f4', nombre: 'Entregar' }];
    var Lx = [
      ['f1', 'Conseguir la autorización para usar el terreno', 'Coordinación del campus', 'Oficio de autorización', 1, 1, true, ''],
      ['f1', 'Pedir tres cotizaciones de malla, bolsas y sustrato', 'Tesorería del grupo', 'Tres cotizaciones por escrito', 1, 1, false, ''],
      ['f1', 'Conseguir semilla y esquejes de especies nativas', 'Equipo de colecta', 'Semilla etiquetada por especie', 2, 2, false, ''],
      ['f2', 'Comprar el material', 'Tesorería del grupo', 'Facturas', 2, 1, false, '2'],
      ['f2', 'Faena para levantar la estructura y la malla sombra', 'Comité de faena, convocado por la delegación', 'Estructura de 6 × 10 m techada', 3, 1, false, '1, 4'],
      ['f2', 'Instalar el riego por goteo', 'Responsable técnico', 'Riego funcionando', 4, 1, false, '5'],
      ['f3', 'Llenar bolsas y sembrar en el vivero', 'Equipo del vivero', '1,500 bolsas sembradas', 4, 1, false, '3, 5'],
      ['f3', 'Riego y cuidado diario, por turnos', 'Rol de riego escrito y firmado', 'Bitácora de riego', 5, 4, false, '6, 7'],
      ['f3', 'Conteo de sobrevivencia', 'Responsable técnico', 'Conteo con fotos', 9, 0, true, '8'],
      ['f4', 'Asamblea para acordar a quién se entregan las plantas', 'Delegación', 'Acta de acuerdos', 8, 0, true, ''],
      ['f4', 'Entrega y siembra en faena, con las lluvias', 'Comité de faena', '1,000 plantas sembradas', 9, 1, false, '9, 10'],
      ['f4', 'Informe y reunión de cierre', 'Coordinación del grupo', 'Informe con fotos', 11, 1, true, '11']
    ];
    d.acts = Lx.map(function (x) { return { id: M.uid(), fase: x[0], nombre: x[1], resp: x[2], prod: x[3], ini: x[4], dur: x[5], hito: x[6], dep: x[7] }; });
    d.nota = 'Calendario sujeto a la fecha en que llegue el recurso. Lo que depende de la delegación se confirma en la asamblea de enero.';
    abrir(d, 'Un ejemplo hecho: recórrelo con «Siguiente» para ver cómo se armó, o empieza uno nuevo.', true, 'proyecto');
  }
  $('#ver-docs').onclick = function () {
    M.listaDocs({
      titulo: 'Mis cronogramas', archivero: A, nuevoTexto: 'Nuevo cronograma', describir: describir,
      alNuevo: function () { abrir(nuevo(), 'Cronograma nuevo.'); },
      alAbrirArchivo: abrirArchivo, alEjemplo: ejemplo, alAbrir: function (d) { abrir(d); },
      alDuplicar: function (d) { var x = completar(d); x.id = M.uid(); x.proyecto = (x.proyecto || 'Cronograma') + ' (copia)'; abrir(x, 'Copia lista.', true); },
      alBorrar: function (id) { if (s.id === id) abrir(nuevo()); }
    });
  };
  function abrirArchivo() {
    M.abrirArchivo('cronograma', function (datos) { var d = completar(datos); d.id = M.uid(); memb = M.membrete.leer(); vistaMembrete.recargar(); abrir(d, 'Se abrió «' + (d.proyecto || 'el cronograma') + '».', true); });
  }
  function nombreArchivo(ext) { return M.slug('cronograma-' + (s.proyecto || '')) + '.' + ext; }
  $('#nueva').onclick = function () { abrir(nuevo(), 'Cronograma nuevo.'); };
  $('#ejemplo').onclick = ejemplo;
  $('#pdf-movil').onclick = M.imprimir;
  M.alImprimir(function () { return 'Cronograma ' + (s.proyecto || ''); }, pintarHojaYa);

  /* ---------- Arranque ---------- */
  memb = M.membrete.leer();
  $('#preguntas-membrete').outerHTML = M.preguntasMembrete();
  vistaMembrete = M.enlazarMembrete($('#guia'), function (m) { memb = m; pintarColoresFase(); refrescarFechas(); pintarHoja(); });
  lista = M.listaGuiada({
    cont: $('#lista-acts'),
    items: function () { return s.acts; },
    agregar: function () { return agregar(false); },
    quitar: function (i) {
      if (String(s.acts[i].nombre).trim() && !window.confirm('¿Quitar la actividad ' + (i + 1) + '?')) return false;
      reacomodar(function () { s.acts.splice(i, 1); });
      if (!s.acts.length) s.acts.push(actVacia());
      cambio(); return true;
    },
    resumen: function (a) { return { t: a.nombre, d: [cuando(a), a.resp].filter(Boolean).join(', '), color: colorFase(a.fase) }; },
    titulo: function (a, i) { return (n(a.dur) <= 0 ? 'Hito ' : 'Actividad ') + (i + 1); },
    sinNombre: 'Sin nombre todavía',
    editor: editorAct,
    textoOtra: 'Agregar otra actividad', textoPrimero: 'Agregar la primera actividad', textoQuitar: 'Quitar esta',
    botones: function () { return '<button type="button" class="btn claro" data-agregar-hito>' + M.ico.mas + 'Agregar un hito</button>'; },
    llenar: function (cont) { M.llenar(cont, s); },
    alPintar: function (cont, i) { focoAct(i); }
  });
  var pistaPDF = M.enNavegadorPrestado ? 'si no pasa nada, abre la página en Chrome o Safari: los navegadores de WhatsApp o Facebook no imprimen.' : 'en la ventana de imprimir, elige «Guardar como PDF» y la orientación horizontal.';
  M.entregas($('#entregas'), [
    { ico: 'pdf', t: 'PDF', d: 'Para imprimirlo o mandarlo tal cual. Sale horizontal.', hacer: M.imprimir, principal: true },
    { ico: 'word', t: 'Word', d: 'La gráfica como tabla, para pegarla en tu proyecto y seguir editándola.', hacer: function () { return wordCronograma().descargar(nombreArchivo('docx')).then(function () { return 'Listo: el Word se descargó.'; }); } },
    { ico: 'imagen', t: 'Imagen para WhatsApp', d: 'La gráfica en una imagen, para mandarla desde el celular.', hacer: function () { return imagenCronograma().then(function (c) { return L.entregar(c, nombreArchivo('png'), 'Cronograma'); }).then(function (r) { return r === 'compartida' ? 'Imagen compartida.' : r === 'cancelada' ? '' : 'Listo: la imagen se descargó.'; }); } },
    { ico: 'archivo', t: 'Archivo de la mochila', d: 'Para abrirlo en otro aparato o guardarlo en tu Drive.', hacer: function () { s.tocado = true; guardarLuego(); M.descargarArchivo('cronograma', 'cronograma-' + (s.proyecto || ''), s); } }
  ]);
  $('#entregas').insertAdjacentHTML('afterend', '<p class="pista-impresion">Para el PDF: ' + pistaPDF + '</p>');
  guia = M.guia({
    raiz: $('#guia'), marco: $('#marco'), panel: $('.panel-hoja'), membrete: true,
    estado: function () { return s; }, guardar: function () { guardarLuego(); },
    listo: { actividades: function () { return vivas().length > 0; }, fases: function () { return s.fases.length > 0 || !!(s.guia && s.guia.visto.fases); } },
    alEntrar: {
      actividades: function () { lista.empezar(function (a) { return !String(a.nombre).trim(); }); },
      fases: function () { pintarFases(); },
      entregar: function () { guia.pintarFaltan($('#faltan')); },
      revision: function () { pintarRevision(); }
    }
  });
  var id = A.idActual(), guardado = id && A.obtener(id);
  abrir(guardado || nuevo());
  M.montarVista();
  window.addEventListener('pagehide', function () { if (s && s.tocado) A.guardar(s); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && s && s.tocado) A.guardar(s); });
  window.MOCHILA_PRUEBA = { estado: function () { return s; }, guia: function () { return guia; }, word: function () { return wordCronograma().blob(); }, imagen: imagenCronograma };
})();
