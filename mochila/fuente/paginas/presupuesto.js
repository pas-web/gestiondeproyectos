/* Presupuesto: partidas por rubro, quién pone cada una, y la matriz de aportaciones. */
(function () {
  'use strict';
  var $ = M.$, n = M.num, esc = M.esc;
  var A = new M.Archivero('presupuesto');
  var banco = $('.banco');
  var PALETA = ['#00899e', '#c46a1f', '#7b52ae', '#a8781a', '#2f6fb7', '#3f8f3a'], GRIS = '#8A9699';
  var RUBROS = ['Materiales e insumos', 'Herramienta y equipo', 'Mano de obra y jornales', 'Servicios', 'Traslados y fletes', 'Capacitación y difusión'];
  var s, memb, c;

  function partidaVacia(rubro, fuente) { return { id: M.uid(), rubro: rubro, c: '', u: '', q: '', p: '', f: fuente || '' }; }
  function nuevo() {
    var f1 = M.uid(), f2 = M.uid();
    var rubros = RUBROS.map(function (r) { return { id: M.uid(), nombre: r }; });
    return {
      id: M.uid(), tocado: false, creado: new Date().toISOString(),
      proyecto: '', lugar: '', organizacion: '', fecha: M.hoyISO(), periodo: '',
      fuentes: [{ id: f1, nombre: 'Apoyo solicitado', tipo: 'dinero' }, { id: f2, nombre: 'Aportación del grupo', tipo: 'especie' }],
      rubros: rubros, partidas: [partidaVacia(rubros[0].id, f1)],
      imp: { pct: 5, f: f1 }, ver: { rubros: true }, notas: '', reviso: { nombre: '', cargo: '' }
    };
  }
  function completar(d) {
    var b = nuevo(), x = M.copia(d || {});
    for (var k in x) { if (x[k] && typeof x[k] === 'object' && !Array.isArray(x[k]) && b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) { for (var j in x[k]) b[k][j] = x[k][j]; } else b[k] = x[k]; }
    return b;
  }

  /* ---------- La cuenta ---------- */
  function r2(x) { return Math.round(x * 100) / 100; }
  function fuente(id) { return s.fuentes.filter(function (f) { return f.id === id; })[0] || null; }
  function colorF(id) { var i = -1; s.fuentes.forEach(function (f, j) { if (f.id === id) i = j; }); return i < 0 ? GRIS : (i < PALETA.length ? PALETA[i] : GRIS); }
  function importe(p) { return r2(n(p.q) * n(p.p)); }
  function viva(p) { return String(p.c || '').trim() || importe(p) > 0; }
  function calcular() {
    var porF = {}, porR = {}, matriz = {}, compras = 0, total = 0, dinero = 0, especie = 0, sinF = 0;
    s.fuentes.forEach(function (f) { porF[f.id] = 0; });
    s.rubros.forEach(function (r) { porR[r.id] = 0; matriz[r.id] = {}; });
    s.partidas.forEach(function (p) {
      if (!viva(p)) return;
      var v = importe(p), f = fuente(p.f);
      if (!matriz[p.rubro]) { matriz[p.rubro] = {}; porR[p.rubro] = 0; }
      porR[p.rubro] += v; total += v;
      if (f) { porF[f.id] += v; matriz[p.rubro][f.id] = (matriz[p.rubro][f.id] || 0) + v; if (f.tipo === 'especie') especie += v; else { dinero += v; compras += v; } }
      else { sinF += v; dinero += v; compras += v; }
    });
    var imp = r2(compras * n(s.imp.pct) / 100), fImp = fuente(s.imp.f) || s.fuentes.filter(function (f) { return f.tipo !== 'especie'; })[0] || s.fuentes[0];
    if (imp > 0) { total += imp; dinero += imp; if (fImp) porF[fImp.id] += imp; else sinF += imp; }
    return { porF: porF, porR: porR, matriz: matriz, compras: r2(compras), imp: imp, fImp: fImp, total: r2(total), dinero: r2(dinero), especie: r2(especie), sinF: r2(sinF) };
  }

  /* ---------- La revisión: los agujeros ---------- */
  function revisar() {
    var l = [], vivas = s.partidas.filter(viva);
    if (!vivas.length) return [{ c: 'ojo', t: 'Todavía no hay partidas.', x: 'Escribe la primera, o abre el ejemplo para ver cómo se ve un presupuesto hecho.' }];
    var compradas = vivas.filter(function (p) { var f = fuente(p.f); return !f || f.tipo !== 'especie'; });
    var hayFlete = vivas.some(function (p) { return /(flete|acarreo|traslado|transporte|env[ií]o|gasolina)/i.test(p.c); });
    var materiales = compradas.filter(function (p) { var r = s.rubros.filter(function (x) { return x.id === p.rubro; })[0]; return r && /(material|herramienta|equipo|insumo)/i.test(r.nombre); });
    if (materiales.length && !hayFlete) l.push({ c: 'mal', t: 'El flete.', x: 'Hay material que se compra y ningún renglón de flete. Lo cotizado en la cabecera no llega solo hasta el lugar: ¿quién lo trae y cuánto cuesta?' });
    else if (materiales.length) l.push({ c: 'bien', t: 'El flete tiene renglón.', x: '' });
    if (compradas.length && !(n(s.imp.pct) > 0)) l.push({ c: 'mal', t: 'Sin imponderables.', x: 'Falta un colchón chico, alrededor del 5% de lo que se compra, con renglón propio y nombre honesto.' });
    else if (compradas.length) l.push({ c: 'bien', t: 'Los imponderables tienen renglón y nombre.', x: '' });
    var sinPrecio = vivas.filter(function (p) { return !(n(p.q) > 0) || !(n(p.p) > 0); });
    if (sinPrecio.length) l.push({ c: 'mal', t: 'Partidas sin precio o sin cantidad.', x: sinPrecio.map(function (p) { return '«' + (p.c || 'sin nombre') + '»'; }).join(', ') + '. Todo lo que se compra se cotiza; lo que se pone en especie también vale algo.' });
    var esp = s.fuentes.filter(function (f) { return f.tipo === 'especie'; });
    if (!esp.length) l.push({ c: 'ojo', t: 'Todo está en dinero.', x: 'Si la comunidad pone jornales, materiales o préstamo de herramienta, eso también se escribe y se valoriza en pesos. Agrega una fuente en especie.' });
    else {
      var vacias = esp.filter(function (f) { return !(c.porF[f.id] > 0); });
      if (vacias.length) l.push({ c: 'mal', t: 'La especie también cuenta.', x: vacias.map(function (f) { return '«' + f.nombre + '»'; }).join(', ') + ' está en cero. Lo que pone la comunidad va completo y valorizado.' });
      else l.push({ c: 'bien', t: 'Lo que se pone en especie está valorizado.', x: '' });
    }
    var vistos = {}, dobles = [];
    vivas.forEach(function (p) {
      var k = String(p.c || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
      if (!k) return;
      if (vistos[k] && vistos[k] !== p.f) dobles.push(p.c); else vistos[k] = p.f;
    });
    if (dobles.length) l.push({ c: 'ojo', t: '¿Doble papel?', x: dobles.map(function (x) { return '«' + x + '»'; }).join(', ') + ' aparece con dos fuentes distintas. Cada cosa va en un solo bolsillo, o se parte en dos partidas con nombre distinto.' });
    var sinF = vivas.filter(function (p) { return !fuente(p.f); });
    if (sinF.length) l.push({ c: 'mal', t: 'Sin fuente.', x: sinF.length + ' partida(s) no dicen quién las pone.' });
    return l;
  }

  /* ---------- Formulario ---------- */
  function opcionesF(sel) { return s.fuentes.map(function (f) { return '<option value="' + esc(f.id) + '"' + (f.id === sel ? ' selected' : '') + '>' + esc(f.nombre || 'Fuente sin nombre') + '</option>'; }).join('') || '<option value="">Primero agrega una fuente</option>'; }
  function pintarFuentes() {
    $('#lista-fuentes').innerHTML = s.fuentes.map(function (f, i) {
      return '<div class="renglon"><span class="muestra" style="background:' + colorF(f.id) + '"></span>' +
        '<input type="text" aria-label="Nombre de la fuente" data-k="fuentes.' + i + '.nombre" placeholder="Quién pone">' +
        '<select aria-label="En dinero o en especie" data-k="fuentes.' + i + '.tipo"><option value="dinero">En dinero</option><option value="especie">En especie</option></select>' +
        '<button type="button" class="quitar" data-quitar-fuente="' + i + '" aria-label="Quitar esta fuente">×</button></div>';
    }).join('') || '<p class="ayuda" style="margin:0">Agrega al menos una fuente.</p>';
    M.llenar($('#lista-fuentes'), s);
    $('#imp-f').innerHTML = opcionesF(s.imp.f); $('#imp-f').value = s.imp.f;
  }
  function pintarRubros() {
    $('#lista-rubros').innerHTML = s.rubros.map(function (r, ri) {
      var ps = s.partidas.map(function (p, pi) { return [p, pi]; }).filter(function (x) { return x[0].rubro === r.id; });
      var esFlete = /(traslado|flete)/i.test(r.nombre);
      return '<div class="rubro" data-rubro="' + esc(r.id) + '"><div class="rubro-cabeza"><input type="text" aria-label="Nombre del rubro" data-k="rubros.' + ri + '.nombre">' +
        '<span class="subtotal" data-sub-rubro="' + esc(r.id) + '"></span><button type="button" class="quitar" data-quitar-rubro="' + ri + '" aria-label="Quitar este rubro">×</button></div>' +
        (ps.length ? '<div class="partidas">' + ps.map(function (x) {
          var pi = x[1];
          return '<div class="partida"><input class="c" type="text" aria-label="Concepto" placeholder="Qué es, con su medida" data-k="partidas.' + pi + '.c">' +
            '<span class="importe" data-importe="' + pi + '"></span><button type="button" class="quitar" data-quitar-partida="' + pi + '" aria-label="Quitar esta partida">×</button>' +
            '<div class="detalle"><label><span class="mini">Unidad</span><input type="text" list="unidades" data-k="partidas.' + pi + '.u" placeholder="pieza"></label>' +
            '<label><span class="mini">Cantidad</span><input type="number" class="cant" inputmode="decimal" min="0" step="any" data-k="partidas.' + pi + '.q" data-tipo="num"></label>' +
            '<label><span class="mini">Precio unitario</span><span class="con-prefijo"><span>$</span><input type="number" class="monto" inputmode="decimal" min="0" step="any" data-k="partidas.' + pi + '.p" data-tipo="num"></span></label>' +
            '<label><span class="mini">¿Quién lo pone?</span><select data-k="partidas.' + pi + '.f">' + opcionesF(x[0].f) + '</select></label></div></div>';
        }).join('') + '</div>' : '') +
        '<div class="pie-rubro"><button type="button" class="btn-texto" data-agregar-partida="' + esc(r.id) + '">Agregar partida</button>' +
        (esFlete ? '<span class="sugerencias" style="margin:0"><button type="button" data-agregar-flete="' + esc(r.id) + '">Flete del material</button></span>' : '') + '</div></div>';
    }).join('');
    M.llenar($('#lista-rubros'), s);
  }
  function pintarCifras() {
    M.$$('[data-importe]').forEach(function (el) { var p = s.partidas[+el.dataset.importe]; el.textContent = p ? M.pesos(importe(p)) : ''; });
    M.$$('[data-sub-rubro]').forEach(function (el) { var v = c.porR[el.dataset.subRubro] || 0; el.textContent = v ? M.pesos(v) : ''; });
    $('#imp-txt').textContent = M.pesos(c.compras) + ' de compras: ' + M.pesos(c.imp) + ' de imponderables.';
    var partes = s.fuentes.map(function (f) { return { f: f, v: c.porF[f.id] || 0 }; }).filter(function (x) { return x.v > 0; });
    var tot = c.total || 1;
    $('#seg-fuentes').innerHTML = partes.length > 1 ? partes.map(function (x) { var w = x.v / tot; return '<div style="flex:' + w + ';background:' + colorF(x.f.id) + '">' + (w >= 0.12 ? M.pct(w) : '') + '</div>'; }).join('') : '';
    $('#seg-fuentes').style.display = partes.length > 1 ? '' : 'none';
    $('#res-fuentes').innerHTML = s.fuentes.map(function (f) {
      var v = c.porF[f.id] || 0;
      return '<div class="fila-f"><i style="background:' + colorF(f.id) + '"></i><span>' + esc(f.nombre || 'Fuente') + (f.tipo === 'especie' ? ' <span class="ayuda">(en especie)</span>' : '') + '</span><b>' + M.pesos(v) + '</b><span class="p">' + (c.total ? M.pct(v / c.total) : '') + '</span></div>';
    }).join('') + '<div class="fila-f"><i></i><span><b>Total del proyecto</b></span><b>' + M.pesos(c.total) + '</b><span class="p"></span></div>' +
      (c.especie ? '<p class="ayuda" style="margin:6px 0 0">En dinero ' + M.pesos(c.dinero) + '; en especie ' + M.pesos(c.especie) + '.</p>' : '');
    $('#revision').innerHTML = revisar().map(function (r) { return '<li class="' + r.c + '"><b>' + esc(r.t) + '</b>' + esc(r.x) + '</li>'; }).join('');
  }

  /* ---------- La hoja ---------- */
  function hojaPresupuesto() {
    var m = memb, F = s.fuentes, horizontal = F.length > 3;
    var der = '<div class="tipo">Presupuesto</div><div class="folio">' + esc(M.fecha(s.fecha)) + '</div>';
    var bajada = [s.lugar && s.lugar + '.', s.organizacion && 'Lo presenta: ' + s.organizacion + '.', s.periodo && 'Periodo: ' + s.periodo + '.'].filter(Boolean).join(' ');
    var cabeza = '<div style="margin-top:.16in"><h2 class="titulo-doc"' + (s.proyecto ? '' : ' style="color:var(--t-tenue)"') + '>' + esc(s.proyecto || 'Nombre del proyecto') + '</h2>' + (bajada ? '<p class="bajada">' + esc(bajada) + '</p>' : '') + '</div>';
    var partes = F.map(function (f) { return { f: f, v: c.porF[f.id] || 0 }; }).filter(function (x) { return x.v > 0; });
    var tot = c.total || 1;
    var resumen = '<div class="resumen-p"><div class="gran-total"><div class="rot">Total del proyecto</div><div class="cifra">' + M.pesos(c.total) + '</div>' +
      '<div class="letra-p">' + M.conLetra(c.total) + '</div>' + (c.especie ? '<div class="dos">En dinero ' + M.pesos(c.dinero) + '<br>En especie ' + M.pesos(c.especie) + '</div>' : '') + '</div>' +
      '<div><div class="rot">Cuánto pone cada quien</div>' +
      (partes.length ? '<div class="seg-p">' + partes.map(function (x) { var w = x.v / tot; return '<div style="flex:' + w + ';background:' + colorF(x.f.id) + '">' + (w >= 0.1 ? M.pct(w) : '') + '</div>'; }).join('') + '</div>' : '<div class="seg-p"><div style="flex:1;background:var(--t-filete)"></div></div>') +
      '<div class="ley-p">' + F.map(function (f) { var v = c.porF[f.id] || 0; return '<i style="background:' + colorF(f.id) + '"></i><span>' + esc(f.nombre || 'Fuente') + ' <span class="tipo-f">' + (f.tipo === 'especie' ? 'en especie' : 'en dinero') + '</span></span><span class="m">' + M.pesos(v) + '</span><span class="p">' + (c.total ? M.pct(v / c.total) : '') + '</span>'; }).join('') + '</div></div></div>';
    // la matriz
    var anchoF = F.length ? (horizontal ? 1.05 : (F.length === 1 ? 1.1 : F.length === 2 ? 1.0 : .82)) : 0;
    var cols = '<colgroup><col><col style="width:.62in"><col style="width:.5in"><col style="width:.82in"><col style="width:.9in">' + F.map(function () { return '<col style="width:' + anchoF + 'in">'; }).join('') + '</colgroup>';
    var th = '<thead><tr><th>Concepto</th><th>Unidad</th><th class="num">Cant.</th><th class="num">Precio unitario</th><th class="num">Importe</th>' + F.map(function (f) { return '<th class="f"><i style="background:' + colorF(f.id) + '"></i>' + esc(f.nombre || 'Fuente') + '</th>'; }).join('') + '</tr></thead>';
    var celdasF = function (porFuente) { return F.map(function (f) { var v = porFuente[f.id] || 0; return '<td class="num' + (v ? '' : ' vacia') + '">' + (v ? M.pesos(v) : '') + '</td>'; }).join(''); };
    var cuerpo = '';
    s.rubros.forEach(function (r) {
      var ps = s.partidas.filter(function (p) { return p.rubro === r.id && viva(p); });
      if (!ps.length) return;
      cuerpo += '<tr class="grupo"><td colspan="' + (5 + F.length) + '">' + esc(r.nombre || 'Rubro') + '</td></tr>';
      ps.forEach(function (p) { var pf = {}; if (p.f) pf[p.f] = importe(p); cuerpo += '<tr><td class="concepto">' + esc(p.c || 'Sin nombre') + '</td><td class="unidad">' + esc(p.u) + '</td><td class="num">' + M.cifra(n(p.q)) + '</td><td class="num">' + M.pesos(n(p.p)) + '</td><td class="num">' + M.pesos(importe(p)) + '</td>' + celdasF(pf) + '</tr>'; });
      cuerpo += '<tr class="sub"><td colspan="4">Subtotal ' + esc((r.nombre || 'rubro').toLowerCase()) + '</td><td class="num">' + M.pesos(c.porR[r.id] || 0) + '</td>' + celdasF(c.matriz[r.id] || {}) + '</tr>';
    });
    if (c.imp > 0) {
      var pi = {}; if (c.fImp) pi[c.fImp.id] = c.imp;
      cuerpo += '<tr class="grupo"><td colspan="' + (5 + F.length) + '">Imponderables</td></tr><tr><td class="concepto">Imponderables, ' + M.cifra(n(s.imp.pct)) + '% de lo que se compra</td><td class="unidad">lote</td><td class="num">1</td><td class="num">' + M.pesos(c.imp) + '</td><td class="num">' + M.pesos(c.imp) + '</td>' + celdasF(pi) + '</tr>';
    }
    if (!cuerpo) cuerpo = '<tr><td colspan="' + (5 + F.length) + '" style="color:var(--t-tenue);padding:14pt 0">Las partidas que escribas aparecen aquí, agrupadas por rubro.</td></tr>';
    var pieT = '<tr class="total"><td colspan="4">Total del proyecto</td><td class="num">' + M.pesos(c.total) + '</td>' + celdasF(c.porF) + '</tr>';
    var matriz = '<table class="tabla matriz">' + cols + th + '<tbody>' + cuerpo + pieT + '</tbody></table>';
    var rubros = '';
    if (s.ver.rubros) {
      var rs = s.rubros.map(function (r) { return { r: r, v: c.porR[r.id] || 0 }; }).filter(function (x) { return x.v > 0; });
      if (c.imp > 0) rs.push({ r: { nombre: 'Imponderables' }, v: c.imp });
      rs.sort(function (a, b) { return b.v - a.v; });
      var max = rs.length ? rs[0].v : 1;
      if (rs.length > 1) rubros = '<div class="rubros-p"><h3>En qué se va el dinero, por rubro</h3>' + rs.map(function (x) {
        return '<div class="fila-r"><span>' + esc(x.r.nombre) + '</span><div class="pista-r"><div style="width:' + (100 * x.v / max).toFixed(2) + '%"></div></div><span class="m">' + M.pesos(x.v) + '</span><span class="p">' + M.pct(x.v / tot) + '</span></div>';
      }).join('') + '</div>';
    }
    var notas = s.notas ? '<p class="notas-p"><b>Notas.</b> ' + M.escBr(s.notas) + '</p>' : '';
    var firmas = '<div class="firmas">' + M.firma(m, 'Elaboró') + (s.reviso.nombre ? M.firma(m, 'Visto bueno', { nombre: s.reviso.nombre, cargo: s.reviso.cargo, sinImagen: true }) : '') + '</div>';
    return M.hoja({ horizontal: horizontal, compacta: true, acento: m.color, pieIzq: M.pieMembrete(m), pieDer: esc((s.proyecto ? s.proyecto + '. ' : '') + 'Presupuesto') },
      M.encabezado(m, der) + cabeza + resumen + matriz + rubros + notas + firmas);
  }
  function pintarHojaYa() {
    $('#marco').innerHTML = hojaPresupuesto(); M.ajustarHoja();
    var vivas = s.partidas.filter(viva).length;
    $('#resumen-hoja').textContent = vivas ? vivas + ' partidas, total ' + M.pesos(c.total) : '';
  }
  var pintarHoja = M.debounce(pintarHojaYa, 60);

  /* ---------- Guardar y abrir ---------- */
  var guardarLuego = M.debounce(function () {
    if (!s.tocado) return;
    if (A.guardar(s)) { var d = new Date(); $('#estado').textContent = 'Guardado ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  }, 350);
  function actualizar() { c = calcular(); pintarCifras(); pintarHoja(); }
  function todo() { pintarFuentes(); pintarRubros(); M.llenar(banco, s); actualizar(); }
  function abrir(d, mensaje, guardarYa) {
    if (s && s.tocado) A.guardar(s);
    s = completar(d); todo();
    $('#estado').textContent = s.tocado ? 'Guardado' : 'Se guarda solo al escribir';
    if (s.tocado) A.marcarActual(s.id);
    if (guardarYa) { s.tocado = true; guardarLuego(); }
    if (mensaje) M.aviso(mensaje);
  }
  function cambio() { s.tocado = true; actualizar(); guardarLuego(); }

  M.escuchar(banco, function () { return s; }, function (k) {
    if (/^fuentes\./.test(k)) {
      M.$$('#lista-rubros select').forEach(function (sel) { var v = sel.value; sel.innerHTML = opcionesF(v); sel.value = v; });
      var iv = $('#imp-f').value; $('#imp-f').innerHTML = opcionesF(iv); $('#imp-f').value = iv;
    }
    cambio();
  });
  banco.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-quitar-fuente]'))) {
      var i = +b.dataset.quitarFuente, f = s.fuentes[i];
      var usadas = s.partidas.filter(function (p) { return p.f === f.id && viva(p); }).length;
      if (usadas && !window.confirm('«' + (f.nombre || 'Esta fuente') + '» tiene ' + usadas + ' partida(s). Si la quitas, se quedan sin fuente. ¿Quitar?')) return;
      s.fuentes.splice(i, 1);
      s.partidas.forEach(function (p) { if (p.f === f.id) p.f = ''; });
      if (s.imp.f === f.id) s.imp.f = (s.fuentes[0] || {}).id || '';
      pintarFuentes(); pintarRubros(); cambio(); return;
    }
    if ((b = e.target.closest('#sug-fuentes button'))) {
      var nom = b.textContent === 'Otra' ? '' : b.textContent;
      s.fuentes.push({ id: M.uid(), nombre: nom, tipo: b.dataset.tipo || 'dinero' });
      pintarFuentes(); pintarRubros(); cambio();
      var ins = M.$$('#lista-fuentes input'); if (ins.length && !nom) ins[ins.length - 1].focus();
      return;
    }
    if ((b = e.target.closest('[data-quitar-rubro]'))) {
      var ri = +b.dataset.quitarRubro, r = s.rubros[ri];
      var con = s.partidas.filter(function (p) { return p.rubro === r.id && viva(p); }).length;
      if (con && !window.confirm('El rubro «' + r.nombre + '» tiene ' + con + ' partida(s). Se borran con él. ¿Quitar?')) return;
      s.rubros.splice(ri, 1); s.partidas = s.partidas.filter(function (p) { return p.rubro !== r.id; });
      pintarRubros(); cambio(); return;
    }
    if ((b = e.target.closest('[data-quitar-partida]'))) {
      s.partidas.splice(+b.dataset.quitarPartida, 1); pintarRubros(); cambio(); return;
    }
    if ((b = e.target.closest('[data-agregar-partida]')) || (b = e.target.closest('[data-agregar-flete]'))) {
      var rid = b.dataset.agregarPartida || b.dataset.agregarFlete;
      var dinero = s.fuentes.filter(function (f) { return f.tipo !== 'especie'; })[0] || s.fuentes[0];
      var p = partidaVacia(rid, dinero ? dinero.id : '');
      if (b.dataset.agregarFlete) { p.c = 'Flete del material hasta el lugar'; p.u = 'viaje'; p.q = 1; }
      var ultimo = -1; s.partidas.forEach(function (x, j) { if (x.rubro === rid) ultimo = j; });
      if (ultimo >= 0) s.partidas.splice(ultimo + 1, 0, p); else s.partidas.push(p);
      pintarRubros(); cambio();
      var idx = s.partidas.indexOf(p), inp = M.$('[data-k="partidas.' + idx + (b.dataset.agregarFlete ? '.p' : '.c') + '"]'); if (inp) inp.focus();
    }
  });
  $('#agregar-rubro').onclick = function () {
    s.rubros.push({ id: M.uid(), nombre: '' }); pintarRubros(); cambio();
    var ins = M.$$('.rubro-cabeza input'); if (ins.length) ins[ins.length - 1].focus();
  };

  function csv() {
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var filas = [['Rubro', 'Concepto', 'Unidad', 'Cantidad', 'Precio unitario', 'Importe', 'Quién lo pone', 'Tipo']];
    s.rubros.forEach(function (r) {
      s.partidas.filter(function (p) { return p.rubro === r.id && viva(p); }).forEach(function (p) {
        var f = fuente(p.f); filas.push([r.nombre, p.c, p.u, n(p.q), n(p.p), importe(p), f ? f.nombre : '', f ? f.tipo : '']);
      });
    });
    if (c.imp > 0) filas.push(['Imponderables', 'Imponderables, ' + n(s.imp.pct) + '% de lo que se compra', 'lote', 1, c.imp, c.imp, c.fImp ? c.fImp.nombre : '', 'dinero']);
    filas.push([]); filas.push(['', 'Total del proyecto', '', '', '', c.total, '', '']);
    s.fuentes.forEach(function (f) { filas.push(['', f.nombre, '', '', '', c.porF[f.id] || 0, f.tipo, c.total ? (100 * (c.porF[f.id] || 0) / c.total).toFixed(1) + '%' : '']); });
    M.descargar(M.slug('presupuesto-' + (s.proyecto || '')) + '.csv', '﻿' + filas.map(function (f) { return f.map(q).join(','); }).join('\r\n'), 'text/csv;charset=utf-8');
  }

  function describir(d) {
    var guardado = s; s = completar(d); var x = calcular(); var r = { t: s.proyecto || 'Presupuesto sin nombre', v: M.pesos(x.total), d: [s.lugar, M.fechaCorta(s.fecha)].filter(Boolean).join(', ') }; s = guardado; return r;
  }
  function ejemplo() {
    var d = nuevo(); d.tocado = true;
    d.proyecto = 'Vivero escolar de especies nativas'; d.lugar = 'Campus Concá, Arroyo Seco'; d.organizacion = 'Grupo de 5.º semestre'; d.periodo = 'Enero a diciembre de 2027';
    var F = [{ id: 'f1', nombre: 'Apoyo solicitado', tipo: 'dinero' }, { id: 'f2', nombre: 'Aportación del grupo', tipo: 'especie' }, { id: 'f3', nombre: 'Aportación del campus', tipo: 'especie' }];
    d.fuentes = F;
    var R = d.rubros;
    var P = [
      [0, 'Malla sombra al 50%', 'm²', 70, 38, 'f1'], [0, 'Bolsa para vivero de 15 × 20 cm', 'millar', 2, 350, 'f1'], [0, 'Sustrato en costal de 40 kg', 'costal', 30, 120, 'f1'],
      [0, 'Tubo PTR de 2 pulgadas para la estructura', 'pieza', 12, 420, 'f1'], [0, 'Semilla y esquejes de especies nativas', 'lote', 1, 1500, 'f2'], [0, 'Agua para el riego, de la toma del campus', 'mes', 5, 250, 'f3'],
      [1, 'Kit de riego por goteo para 60 m²', 'lote', 1, 3200, 'f1'], [1, 'Préstamo de carretillas y palas para la faena', 'día', 2, 400, 'f3'],
      [2, 'Jornales de faena para levantar la estructura', 'jornal', 16, 300, 'f2'], [2, 'Riego por turnos, de mayo a agosto', 'jornal', 40, 300, 'f2'],
      [3, 'Soldadura de la estructura', 'servicio', 1, 2500, 'f1'],
      [4, 'Flete del material desde Jalpan', 'viaje', 2, 600, 'f1'],
      [5, 'Lona de identificación del vivero', 'pieza', 1, 450, 'f1']
    ];
    d.partidas = P.map(function (x) { return { id: M.uid(), rubro: R[x[0]].id, c: x[1], u: x[2], q: x[3], p: x[4], f: x[5] }; });
    d.imp = { pct: 5, f: 'f1' };
    d.notas = 'Precios con IVA, de cotizaciones de octubre de 2026. La aportación del grupo se valoriza a $300 el jornal, el precio de la región.';
    abrir(d, 'Se abrió un ejemplo. Cámbialo por tu proyecto o empieza uno nuevo.', true);
  }
  $('#ver-docs').onclick = function () {
    M.listaDocs({
      titulo: 'Mis presupuestos', archivero: A, nuevoTexto: 'Nuevo presupuesto', describir: describir,
      alNuevo: function () { abrir(nuevo(), 'Presupuesto nuevo.'); },
      alAbrirArchivo: abrirArchivo, alEjemplo: ejemplo, alAbrir: function (d) { abrir(d); },
      alDuplicar: function (d) { var x = completar(d); x.id = M.uid(); x.proyecto = (x.proyecto || 'Presupuesto') + ' (copia)'; abrir(x, 'Copia lista.', true); },
      alBorrar: function (id) { if (s.id === id) abrir(nuevo()); }
    });
  };
  function abrirArchivo() {
    M.abrirArchivo('presupuesto', function (datos) { var d = completar(datos); d.id = M.uid(); memb = M.membrete.leer(); vistaMembrete.recargar(); abrir(d, 'Se abrió «' + (d.proyecto || 'el presupuesto') + '».', true); });
  }
  $('#nueva').onclick = function () { abrir(nuevo(), 'Presupuesto nuevo.'); };
  $('#ejemplo').onclick = ejemplo;
  $('#pdf').onclick = M.imprimir; $('#pdf-movil').onclick = M.imprimir;
  $('#csv').onclick = csv;
  $('#descargar').onclick = function () { s.tocado = true; guardarLuego(); M.descargarArchivo('presupuesto', 'presupuesto-' + (s.proyecto || ''), s); };
  M.alImprimir(function () { return 'Presupuesto ' + (s.proyecto || ''); }, pintarHojaYa);
  if (M.enNavegadorPrestado) $('#pista').textContent = 'Si al apretar «Guardar en PDF» no pasa nada, abre esta página en Chrome o en Safari: los navegadores que vienen dentro de WhatsApp o Facebook no saben imprimir.';

  memb = M.membrete.leer();
  var vistaMembrete = M.montarMembrete($('#membrete'), function (m) { memb = m; $('#res-membrete').textContent = m.nombre || 'Falta tu nombre'; pintarHoja(); });
  $('#res-membrete').textContent = memb.nombre || 'Falta tu nombre';
  if (!memb.nombre) $('#paso-membrete').open = true;
  var id = A.idActual(), guardado = id && A.obtener(id);
  abrir(guardado || nuevo());
  M.montarVista();
  window.addEventListener('pagehide', function () { if (s && s.tocado) A.guardar(s); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && s && s.tocado) A.guardar(s); });
})();
