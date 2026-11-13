/* Cronograma: actividades, fases e hitos; la hoja dibuja el Gantt. */
(function () {
  'use strict';
  var $ = M.$, n = M.num, esc = M.esc;
  var A = new M.Archivero('cronograma');
  var banco = $('.banco');
  var PALETA = ['#00899e', '#c46a1f', '#7b52ae', '#a8781a', '#2f6fb7', '#3f8f3a'], GRIS = '#8A9699';
  var s, memb;

  function lunesProximo() { var d = new Date(), mas = ((8 - d.getDay()) % 7) || 7; d.setDate(d.getDate() + mas); return M.aISO(d); }
  function actVacia(hito) { return { id: M.uid(), fase: '', nombre: '', resp: '', prod: '', ini: 1, dur: hito ? 0 : 1, hito: !!hito, dep: '' }; }
  function nuevo() {
    return {
      id: M.uid(), tocado: false, creado: new Date().toISOString(),
      titulo: 'Cronograma de actividades', proyecto: '', lugar: '', ejecuta: '',
      inicio: lunesProximo(), unidad: 'semanas', periodos: '', lluvias: { si: false, de: 6, a: 10 },
      fases: [], acts: [actVacia()], ver: { responsables: true, tabla: true }, nota: '', reviso: { nombre: '', cargo: '' }
    };
  }
  function completar(d) {
    var b = nuevo(), x = M.copia(d || {});
    for (var k in x) { if (x[k] && typeof x[k] === 'object' && !Array.isArray(x[k]) && b[k] && typeof b[k] === 'object') { for (var j in x[k]) b[k][j] = x[k][j]; } else b[k] = x[k]; }
    b.acts = (b.acts || []).map(function (a) { var v = actVacia(); for (var k in a) v[k] = a[k]; return v; });
    return b;
  }

  /* ---------- El tiempo ---------- */
  var semanas = function () { return s.unidad !== 'meses'; };
  function deps(a) { return String(a.dep || '').split(/[^\d]+/).filter(Boolean).map(Number); }
  function finDe(a) { return n(a.dur) > 0 ? n(a.ini) - 1 + n(a.dur) : n(a.ini); }
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

  /* ---------- La revisión: las ilusiones del calendario ---------- */
  function revisar() {
    var l = [], acts = s.acts.filter(function (a) { return String(a.nombre).trim(); });
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

  /* ---------- Formulario: fases y actividades ---------- */
  function pintarFases() {
    $('#lista-fases').innerHTML = s.fases.map(function (f, i) {
      return '<div class="renglon"><span class="muestra" style="background:' + colorFase(f.id) + '"></span>' +
        '<input type="text" aria-label="Nombre de la fase" data-k="fases.' + i + '.nombre" placeholder="Nombre de la fase">' +
        '<button type="button" class="quitar" data-quitar-fase="' + i + '" aria-label="Quitar esta fase">×</button></div>';
    }).join('') || '<p class="ayuda" style="margin:0">Sin fases: todas las barras van en el color de tu membrete.</p>';
    M.llenar($('#lista-fases'), s);
  }
  function opcionesFase(sel) {
    return '<option value="">Sin fase</option>' + s.fases.map(function (f) { return '<option value="' + esc(f.id) + '"' + (f.id === sel ? ' selected' : '') + '>' + esc(f.nombre || 'Fase sin nombre') + '</option>'; }).join('');
  }
  function pintarActs() {
    var u = semanas() ? ['la semana', 'semana', 'semanas'] : ['el mes', 'mes', 'meses'];
    $('#lista-acts').innerHTML = s.acts.map(function (a, i) {
      var hito = n(a.dur) <= 0;
      return '<div class="act' + (hito ? ' es-hito' : '') + '" data-act="' + i + '" style="border-left-color:' + colorFase(a.fase) + '">' +
        '<div class="act-cabeza"><span class="act-n">' + (i + 1) + '</span>' +
        '<input type="text" aria-label="Actividad ' + (i + 1) + '" data-k="acts.' + i + '.nombre" placeholder="' + (hito ? 'Qué se decide o se entrega (hito)' : 'Qué se hace') + '">' +
        '<div class="act-mover"><button type="button" data-mover="-1" data-i="' + i + '" aria-label="Subir">↑</button><button type="button" data-mover="1" data-i="' + i + '" aria-label="Bajar">↓</button><button type="button" class="quitar" data-quitar-act="' + i + '" aria-label="Quitar">×</button></div></div>' +
        '<div class="act-campos"><select aria-label="Fase" data-k="acts.' + i + '.fase">' + opcionesFase(a.fase) + '</select>' +
        '<input type="text" aria-label="Quién responde" data-k="acts.' + i + '.resp" placeholder="Quién responde (cargo o nombre)">' +
        '<input type="text" aria-label="Qué deja" data-k="acts.' + i + '.prod" placeholder="Qué deja al terminar">' + '</div>' +
        '<div class="act-tiempo"><label>Empieza en ' + u[0] + ' <input type="number" inputmode="numeric" min="1" step="1" data-k="acts.' + i + '.ini" data-tipo="num"></label>' +
        '<label>dura <input type="number" inputmode="decimal" min="0" step="1" data-k="acts.' + i + '.dur" data-tipo="num"> ' + u[2] + '</label>' +
        '<label class="palomita"><input type="checkbox" data-k="acts.' + i + '.hito"><span>Termina en hito</span></label>' +
        '<label>Depende de <input type="text" class="dep" inputmode="numeric" data-k="acts.' + i + '.dep" placeholder="2, 3"></label></div>' +
        '<div class="act-fecha" data-fecha="' + i + '">' + esc(cuando(a)) + (hito ? ' · un hito, sin duración' : '') + '</div></div>';
    }).join('');
    M.llenar($('#lista-acts'), s);
  }
  function refrescarFechas() {
    M.$$('[data-fecha]').forEach(function (el) {
      var a = s.acts[+el.dataset.fecha]; if (!a) return;
      el.textContent = cuando(a) + (n(a.dur) <= 0 ? ' · un hito, sin duración' : '');
      var card = el.closest('.act'); card.style.borderLeftColor = colorFase(a.fase); card.classList.toggle('es-hito', n(a.dur) <= 0);
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
    var acts = s.acts.filter(function (a) { return String(a.nombre).trim(); });
    var pct = function (x) { return (100 * Math.max(0, Math.min(N, x)) / N).toFixed(4) + '%'; };
    var lluvias = s.lluvias.si ? rangosLluvia(N).map(function (r) { return '<div class="lluvia" style="left:' + pct(r[0]) + ';width:' + (100 * (r[1] - r[0]) / N).toFixed(4) + '%"></div>'; }).join('') : '';
    var tipo = s.titulo || 'Cronograma';
    var der = '<div class="tipo"' + (tipo.length > 16 ? ' style="font-size:15pt"' : '') + '>' + esc(tipo) + '</div><div class="folio">' + esc(M.fecha(M.hoyISO())) + '</div>';
    var fin = finPeriodo(N - 1), ini = inicioPeriodo(0);
    var periodo = 'Del ' + M.fecha(ini) + ' al ' + M.fecha(fin) + ', por ' + (semanas() ? 'semanas' : 'meses') + '.';
    var cabeza = '<div style="margin-top:.14in"><h2 class="titulo-doc"' + (s.proyecto ? '' : ' style="color:var(--t-tenue)"') + '>' + esc(s.proyecto || 'Nombre del proyecto') + '</h2><p class="bajada">' +
      esc([s.lugar && s.lugar + '.', s.ejecuta && 'A cargo de: ' + s.ejecuta + '.', periodo].filter(Boolean).join(' ')) + '</p></div>';
    function filaAct(a) {
      var i = s.acts.indexOf(a), col = colorFase(a.fase), x0 = n(a.ini) - 1, d = n(a.dur);
      var marca = '';
      if (d > 0) marca += '<div class="barra-g" style="left:' + pct(x0) + ';width:' + (100 * Math.max(0, Math.min(N, x0 + d) - Math.max(0, x0)) / N).toFixed(4) + '%;background:' + col + '"></div>';
      if (d <= 0) marca += '<div class="rombo" style="left:' + pct(x0 + 0.5) + '"></div>';
      else if (a.hito) marca += '<div class="rombo" style="left:' + pct(x0 + d) + '"></div>';
      return '<tr><td class="n-act">' + (i + 1) + '</td><td>' + esc(a.nombre) + '</td>' + (conResp ? '<td class="resp">' + esc(a.resp) + '</td>' : '') +
        '<td class="linea">' + lluvias + marca + '</td></tr>';
    }
    var cuerpo = '';
    var usadas = s.fases.filter(function (f) { return acts.some(function (a) { return a.fase === f.id; }); });
    if (usadas.length) {
      var grupos = usadas.map(function (f) { return { f: f, l: acts.filter(function (a) { return a.fase === f.id; }) }; });
      var sueltas = acts.filter(function (a) { return !usadas.some(function (f) { return f.id === a.fase; }); });
      if (sueltas.length) grupos.push({ f: { id: '', nombre: 'Otras actividades' }, l: sueltas });
      grupos.forEach(function (g) {
        var a0 = Math.min.apply(null, g.l.map(function (a) { return n(a.ini) - 1; })), a1 = Math.max.apply(null, g.l.map(function (a) { return n(a.dur) > 0 ? n(a.ini) - 1 + n(a.dur) : n(a.ini) - 0.5; }));
        var col = g.f.id ? colorFase(g.f.id) : GRIS;
        cuerpo += '<tr class="fase"><td></td><td class="nombre-fase"' + (conResp ? ' colspan="2"' : '') + '><i style="background:' + col + '"></i>' + esc(g.f.nombre || 'Fase sin nombre') + '</td>' +
          '<td class="linea"><div class="llave-fase" style="left:' + pct(a0) + ';width:' + (100 * Math.max(0.3, a1 - a0) / N).toFixed(4) + '%;background:' + col + '"></div></td></tr>';
        cuerpo += g.l.map(filaAct).join('');
      });
    } else cuerpo = acts.map(filaAct).join('');
    if (!acts.length) cuerpo = '<tr><td></td><td colspan="' + (conResp ? 3 : 2) + '" style="color:var(--t-tenue);padding:14pt 0">Las actividades que escribas aparecen aquí, con su barra.</td></tr>';
    var tabla = '<table class="gantt" style="--n:' + N + '"><colgroup><col style="width:.3in"><col style="width:' + (conResp ? 2.55 : 3.1) + 'in">' + (conResp ? '<col style="width:1.25in">' : '') + '<col></colgroup>' +
      '<thead><tr><th></th><th>Actividad</th>' + (conResp ? '<th>Responsable</th>' : '') + '<th class="escala-th">' + escala(N) + '</th></tr></thead><tbody>' + cuerpo + '</tbody></table>';
    var ley = [];
    if (usadas.length > 1) usadas.forEach(function (f) { ley.push('<span><i style="background:' + colorFase(f.id) + '"></i>' + esc(f.nombre || 'Fase') + '</span>'); });
    if (acts.some(function (a) { return a.hito || n(a.dur) <= 0; })) ley.push('<span><i class="r"></i>Hito</span>');
    if (s.lluvias.si) ley.push('<span><i class="ll"></i>Temporada de lluvias</span>');
    var leyenda = ley.length ? '<div class="leyenda-g">' + ley.join('') + '</div>' : '';
    var fechas = '';
    if (s.ver.tabla && acts.length) {
      fechas = '<h3 class="titulo-tabla">Calendario de actividades</h3><table class="tabla fechas"><thead><tr><th class="num">#</th><th>Actividad</th>' + (usadas.length ? '<th>Fase</th>' : '') +
        '<th>Responsable</th><th>Qué deja</th><th class="nw">Empieza</th><th class="nw">Termina</th><th class="nw">Depende</th></tr></thead><tbody>' +
        acts.map(function (a) {
          var i = n(a.ini) - 1, d = n(a.dur), f = s.fases.filter(function (x) { return x.id === a.fase; })[0];
          var e = semanas() ? M.fechaCorta(inicioPeriodo(i)) : mesAnio(inicioPeriodo(i));
          var t = d <= 0 ? 'Hito' : (semanas() ? M.fechaCorta(finPeriodo(i + d - 1)) : mesAnio(inicioPeriodo(i + d - 1)));
          return '<tr><td class="num" style="color:var(--t-tenue)">' + (s.acts.indexOf(a) + 1) + '</td><td>' + esc(a.nombre) + (a.hito && d > 0 ? ' <span style="color:var(--t-tenue)">(termina en hito)</span>' : '') + '</td>' +
            (usadas.length ? '<td class="fase-c">' + esc(f ? f.nombre : '') + '</td>' : '') + '<td>' + esc(a.resp) + '</td><td>' + esc(a.prod) + '</td><td class="nw">' + esc(e) + '</td><td class="nw">' + esc(t) + '</td><td class="nw">' + esc(deps(a).join(', ')) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    var nota = s.nota ? '<p class="nota-pie">' + M.escBr(s.nota) + '</p>' : '';
    var firmas = '<div class="firmas">' + M.firma(m, 'Elaboró') + (s.reviso.nombre ? M.firma(m, 'Revisó', { nombre: s.reviso.nombre, cargo: s.reviso.cargo, sinImagen: true }) : '') + '</div>';
    return M.hoja({ horizontal: true, compacta: true, acento: m.color, pieIzq: M.pieMembrete(m), pieDer: esc((s.proyecto ? s.proyecto + '. ' : '') + tipo) },
      M.encabezado(m, der) + cabeza + leyenda + tabla + nota + fechas + firmas);
  }
  function pintarHojaYa() {
    $('#marco').innerHTML = hojaCronograma(); M.ajustarHoja();
    var acts = s.acts.filter(function (a) { return String(a.nombre).trim(); }), N = largo();
    $('#resumen-hoja').textContent = acts.length ? acts.length + ' renglones, ' + acts.filter(function (a) { return a.hito || n(a.dur) <= 0; }).length + ' hitos, ' + N + ' ' + (semanas() ? 'semanas' : 'meses') : '';
    $('#ayuda-periodos').textContent = n(s.periodos) > 0 ? 'Fijo en ' + N + ' ' + (semanas() ? 'semanas' : 'meses') + '.' : 'En blanco, se ajusta a las actividades (ahora: ' + N + ' ' + (semanas() ? 'semanas' : 'meses') + ').';
  }
  var pintarHoja = M.debounce(pintarHojaYa, 60);

  /* ---------- Guardar y abrir ---------- */
  var guardarLuego = M.debounce(function () {
    if (!s.tocado) return;
    if (A.guardar(s)) { var d = new Date(); $('#estado').textContent = 'Guardado ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  }, 350);
  function actualizar() { pintarRevision(); pintarHoja(); }
  function todo() { pintarFases(); pintarActs(); M.llenar(banco, s); mostrarLluvias(); actualizar(); }
  function mostrarLluvias() { $('#lluvia-de').classList.toggle('oculto', !s.lluvias.si); $('#lluvia-a').classList.toggle('oculto', !s.lluvias.si); }
  function abrir(d, mensaje, guardarYa) {
    if (s && s.tocado) A.guardar(s);
    s = completar(d); todo();
    $('#estado').textContent = s.tocado ? 'Guardado' : 'Se guarda solo al escribir';
    if (s.tocado) A.marcarActual(s.id);
    if (guardarYa) { s.tocado = true; guardarLuego(); }
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
      var hay = s.acts.some(function (a) { return String(a.nombre).trim(); });
      if (hay && window.confirm('¿Paso también las actividades a ' + (semanas() ? 'semanas' : 'meses') + '? Así cada una se queda en las mismas fechas. Si dices que no, los números se quedan igual y cambian de significado.')) {
        convertir(semanas()); M.llenar(banco, s);
      }
      pintarActs();
    }
    if (k === 'lluvias.si') mostrarLluvias();
    if (/^fases\./.test(k)) { M.$$('#lista-acts select').forEach(function (sel, i) { sel.innerHTML = opcionesFase(s.acts[i].fase); }); }
    if (/^acts\.\d+\.dur$/.test(k)) { var a = s.acts[+k.split('.')[1]]; if (n(a.dur) <= 0) a.hito = true; M.llenar($('#lista-acts'), s); }
    refrescarFechas(); actualizar(); guardarLuego();
  });
  banco.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-quitar-fase]'))) {
      var f = s.fases[+b.dataset.quitarFase]; s.fases.splice(+b.dataset.quitarFase, 1);
      s.acts.forEach(function (a) { if (a.fase === f.id) a.fase = ''; });
      s.tocado = true; pintarFases(); pintarActs(); actualizar(); guardarLuego(); return;
    }
    if ((b = e.target.closest('[data-quitar-act]'))) {
      var i = +b.dataset.quitarAct;
      if (String(s.acts[i].nombre).trim() && !window.confirm('¿Quitar la actividad ' + (i + 1) + '?')) return;
      reacomodar(function () { s.acts.splice(i, 1); });
      if (!s.acts.length) s.acts.push(actVacia());
      s.tocado = true; pintarActs(); actualizar(); guardarLuego(); return;
    }
    if ((b = e.target.closest('[data-mover]'))) {
      var j = +b.dataset.i, k = j + (+b.dataset.mover);
      if (k < 0 || k >= s.acts.length) return;
      reacomodar(function () { var t = s.acts[j]; s.acts[j] = s.acts[k]; s.acts[k] = t; });
      s.tocado = true; pintarActs(); actualizar(); guardarLuego();
      var btn = M.$('[data-act="' + k + '"] [data-mover="' + b.dataset.mover + '"]'); if (btn) btn.focus();
      return;
    }
    if ((b = e.target.closest('#sug-fases button'))) {
      var nombre = b.textContent === 'Otra' ? '' : b.textContent;
      s.fases.push({ id: M.uid(), nombre: nombre }); s.tocado = true; pintarFases(); pintarActs(); actualizar(); guardarLuego();
      var ins = M.$$('#lista-fases input'); if (ins.length && !nombre) ins[ins.length - 1].focus();
    }
  });
  function agregar(hito) {
    var ult = s.acts[s.acts.length - 1], a = actVacia(hito);
    if (ult) { a.fase = ult.fase; a.ini = Math.max(1, ult.dur > 0 ? n(ult.ini) + n(ult.dur) : n(ult.ini)); }
    if (s.acts.length === 1 && !String(s.acts[0].nombre).trim() && !hito) { s.acts[0].fase = a.fase; } else s.acts.push(a);
    s.tocado = true; pintarActs(); actualizar(); guardarLuego();
    var ins = M.$$('#lista-acts .act-cabeza input'); if (ins.length) ins[ins.length - 1].focus();
  }
  $('#agregar-act').onclick = function () { agregar(false); };
  $('#agregar-hito').onclick = function () { agregar(true); };
  $('#ordenar').onclick = function () {
    reacomodar(function () {
      var con = s.acts.map(function (a, i) { return [a, i]; });
      con.sort(function (x, y) { return (n(x[0].ini) - n(y[0].ini)) || (x[1] - y[1]); });
      s.acts = con.map(function (x) { return x[0]; });
    });
    s.tocado = true; pintarActs(); actualizar(); guardarLuego(); M.aviso('Ordenadas por fecha de inicio. Las dependencias siguen apuntando a las mismas actividades.');
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
    var L = [
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
    d.acts = L.map(function (x) { return { id: M.uid(), fase: x[0], nombre: x[1], resp: x[2], prod: x[3], ini: x[4], dur: x[5], hito: x[6], dep: x[7] }; });
    d.nota = 'Calendario sujeto a la fecha en que llegue el recurso. Lo que depende de la delegación se confirma en la asamblea de enero.';
    abrir(d, 'Se abrió un ejemplo. Cámbialo por tu proyecto o empieza uno nuevo.', true);
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
  $('#nueva').onclick = function () { abrir(nuevo(), 'Cronograma nuevo.'); };
  $('#ejemplo').onclick = ejemplo;
  $('#pdf').onclick = M.imprimir; $('#pdf-movil').onclick = M.imprimir;
  $('#descargar').onclick = function () { s.tocado = true; guardarLuego(); M.descargarArchivo('cronograma', 'cronograma-' + (s.proyecto || ''), s); };
  M.alImprimir(function () { return 'Cronograma ' + (s.proyecto || ''); }, pintarHojaYa);
  if (M.enNavegadorPrestado) $('#pista').textContent = 'Si al apretar «Guardar en PDF» no pasa nada, abre esta página en Chrome o en Safari: los navegadores que vienen dentro de WhatsApp o Facebook no saben imprimir.';

  memb = M.membrete.leer();
  var vistaMembrete = M.montarMembrete($('#membrete'), function (m) { memb = m; $('#res-membrete').textContent = m.nombre || 'Falta tu nombre'; pintarFases(); refrescarFechas(); pintarHoja(); });
  $('#res-membrete').textContent = memb.nombre || 'Falta tu nombre';
  if (!memb.nombre) $('#paso-membrete').open = true;
  var id = A.idActual(), guardado = id && A.obtener(id);
  abrir(guardado || nuevo());
  M.montarVista();
  window.addEventListener('pagehide', function () { if (s && s.tocado) A.guardar(s); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && s && s.tocado) A.guardar(s); });
})();
