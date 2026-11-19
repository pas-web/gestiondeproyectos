/* Presupuesto: partidas por rubro, quién pone cada una, y la matriz de aportaciones.
   Se llena una pregunta a la vez y las partidas de una en una. Sale en PDF, Word,
   imagen («quién pone qué»), hoja de cálculo y archivo. */
(function () {
  'use strict';
  var $ = M.$, n = M.num, esc = M.esc;
  var A = new M.Archivero('presupuesto');
  var banco = $('.banco');
  var PALETA = ['#00899e', '#c46a1f', '#7b52ae', '#a8781a', '#2f6fb7', '#3f8f3a'], GRIS = '#8A9699';
  var RUBROS = ['Materiales e insumos', 'Herramienta y equipo', 'Mano de obra y jornales', 'Servicios', 'Traslados y fletes', 'Capacitación y difusión'];
  var s, memb, c, guia, lista;

  function partidaVacia(rubro, fuente) { return { id: M.uid(), rubro: rubro, c: '', u: '', q: '', p: '', f: fuente || '' }; }
  function nuevo() {
    var f1 = M.uid(), f2 = M.uid();
    var rubros = RUBROS.map(function (r) { return { id: M.uid(), nombre: r }; });
    return {
      id: M.uid(), tocado: false, creado: new Date().toISOString(),
      proyecto: '', lugar: '', organizacion: '', fecha: M.hoyISO(), periodo: '',
      fuentes: [{ id: f1, nombre: 'Apoyo solicitado', tipo: 'dinero' }, { id: f2, nombre: 'Aportación del grupo', tipo: 'especie' }],
      rubros: rubros, partidas: [partidaVacia(rubros[0].id, f1)],
      imp: { pct: 5, f: f1 }, ver: { rubros: true }, notas: '', elaboro: { nombre: '', cargo: '' }, reviso: { nombre: '', cargo: '' },
      guia: { paso: '', visto: {} }
    };
  }
  function completar(d) {
    var b = nuevo(), x = M.copia(d || {});
    for (var k in x) { if (x[k] && typeof x[k] === 'object' && !Array.isArray(x[k]) && b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) { for (var j in x[k]) b[k][j] = x[k][j]; } else b[k] = x[k]; }
    if (!b.partidas.length) b.partidas.push(partidaVacia((b.rubros[0] || {}).id, (b.fuentes[0] || {}).id));
    return b;
  }

  /* ---------- La cuenta ---------- */
  function r2(x) { return Math.round(x * 100) / 100; }
  function fuente(id) { return s.fuentes.filter(function (f) { return f.id === id; })[0] || null; }
  function rubro(id) { return s.rubros.filter(function (r) { return r.id === id; })[0] || null; }
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
    var materiales = compradas.filter(function (p) { var r = rubro(p.rubro); return r && /(material|herramienta|equipo|insumo)/i.test(r.nombre); });
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
    var bajos = vivas.filter(function (p) { return /jornal/i.test(p.u + ' ' + p.c) && n(p.p) > 0 && n(p.p) < 315.04; });
    if (bajos.length) l.push({ c: 'ojo', t: 'El jornal por debajo del mínimo.', x: bajos.map(function (p) { return '«' + p.c + '»'; }).join(', ') + ' vale menos de $315.04, el salario mínimo general de 2026. La faena se valoriza por lo menos a ese precio.' });
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

  /* ---------- Fuentes y rubros ---------- */
  function opcionesF(sel) { return s.fuentes.map(function (f) { return '<option value="' + esc(f.id) + '"' + (f.id === sel ? ' selected' : '') + '>' + esc(f.nombre || 'Fuente sin nombre') + '</option>'; }).join('') || '<option value="">Primero agrega una fuente</option>'; }
  function opcionesR(sel) { return s.rubros.map(function (r) { return '<option value="' + esc(r.id) + '"' + (r.id === sel ? ' selected' : '') + '>' + esc(r.nombre || 'Rubro sin nombre') + '</option>'; }).join(''); }
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
    $('#lista-rubros').innerHTML = s.rubros.map(function (r, i) {
      return '<div class="renglon"><input type="text" aria-label="Nombre del rubro" data-k="rubros.' + i + '.nombre"><span class="subtotal" data-sub-rubro="' + esc(r.id) + '"></span>' +
        '<button type="button" class="quitar" data-quitar-rubro="' + i + '" aria-label="Quitar este rubro">×</button></div>';
    }).join('');
    M.llenar($('#lista-rubros'), s);
  }

  /* ---------- Las partidas, de una en una ---------- */
  function editorPartida(p, i) {
    return '<div class="campo"><label for="pa-c">Qué es, con su medida</label><input id="pa-c" class="grande" type="text" data-k="partidas.' + i + '.c" placeholder="Ej. Malla sombra al 50%"></div>' +
      '<div class="campo"><label for="pa-r">Rubro</label><select id="pa-r" data-k="partidas.' + i + '.rubro">' + opcionesR(p.rubro) + '</select></div>' +
      '<div class="ed-cuenta"><div class="campo"><label for="pa-u">Unidad</label><input id="pa-u" type="text" list="unidades" data-k="partidas.' + i + '.u" placeholder="pieza"></div>' +
      '<div class="campo"><label for="pa-q">Cantidad</label><input id="pa-q" type="number" class="cant" inputmode="decimal" min="0" step="any" data-k="partidas.' + i + '.q" data-tipo="num"></div>' +
      '<div class="campo"><label for="pa-p">Precio unitario</label><span class="con-prefijo"><span>$</span><input id="pa-p" type="number" class="monto" inputmode="decimal" min="0" step="any" data-k="partidas.' + i + '.p" data-tipo="num"></span></div></div>' +
      '<div class="campo"><label for="pa-f">¿Quién lo pone?</label><select id="pa-f" data-k="partidas.' + i + '.f">' + opcionesF(p.f) + '</select></div>' +
      '<div class="asi-va importe-vivo"><span>Importe</span><b data-importe="' + i + '">' + M.pesos(importe(p)) + '</b></div>';
  }
  function resumenPartida(p) {
    var r = rubro(p.rubro), f = fuente(p.f);
    var cuenta = n(p.q) > 0 || n(p.p) > 0 ? M.cifra(n(p.q)) + ' ' + (p.u || '') + ' a ' + M.pesos(n(p.p)) + ' = ' + M.pesos(importe(p)) : '';
    return { t: p.c, d: [r && r.nombre, cuenta.replace(/\s+/g, ' '), f && f.nombre].filter(Boolean).join(', '), color: colorF(p.f) };
  }
  function agregarPartida(base) {
    var ult = s.partidas[s.partidas.length - 1];
    var dinero = s.fuentes.filter(function (f) { return f.tipo !== 'especie'; })[0] || s.fuentes[0];
    var p = partidaVacia(ult ? ult.rubro : (s.rubros[0] || {}).id, ult ? ult.f : (dinero ? dinero.id : ''));
    for (var k in (base || {})) p[k] = base[k];
    if (s.partidas.length === 1 && !viva(s.partidas[0]) && !base) { cambio(); return 0; }
    s.partidas.push(p); cambio();
    return s.partidas.length - 1;
  }
  function focoPartida(i) {
    var pr = M.$('.pregunta[data-paso="partidas"]'), p = s.partidas[i];
    pr.dataset.foco = p && viva(p) ? 'partida-' + p.id : 'matriz';
    if (guia && guia.actual() === 'partidas') guia.refrescar();
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
  function bajada() { return [s.lugar && s.lugar + '.', s.organizacion && 'Lo presenta: ' + s.organizacion + '.', s.periodo && 'Periodo: ' + s.periodo + '.'].filter(Boolean).join(' '); }
  function rubrosOrdenados() {
    var rs = s.rubros.map(function (r) { return { r: r, v: c.porR[r.id] || 0 }; }).filter(function (x) { return x.v > 0; });
    if (c.imp > 0) rs.push({ r: { nombre: 'Imponderables' }, v: c.imp });
    rs.sort(function (a, b) { return b.v - a.v; });
    return rs;
  }
  function hojaPresupuesto() {
    var m = memb, F = s.fuentes, horizontal = F.length > 3;
    var der = '<div class="tipo">Presupuesto</div><div class="folio">' + esc(M.fecha(s.fecha)) + '</div>';
    var b = bajada();
    var cabeza = '<div style="margin-top:.16in" data-parte="proyecto"><h2 class="titulo-doc"' + (s.proyecto ? '' : ' style="color:var(--t-tenue)"') + '>' + esc(s.proyecto || 'Nombre del proyecto') + '</h2>' + (b ? '<p class="bajada">' + esc(b) + '</p>' : '') + '</div>';
    var partes = F.map(function (f) { return { f: f, v: c.porF[f.id] || 0 }; }).filter(function (x) { return x.v > 0; });
    var tot = c.total || 1;
    var resumen = '<div class="resumen-p" data-parte="resumen"><div class="gran-total"><div class="rot">Total del proyecto</div><div class="cifra">' + M.pesos(c.total) + '</div>' +
      '<div class="letra-p">' + M.conLetra(c.total) + '</div>' + (c.especie ? '<div class="dos">En dinero ' + M.pesos(c.dinero) + '<br>En especie ' + M.pesos(c.especie) + '</div>' : '') + '</div>' +
      '<div data-parte="fuentes"><div class="rot">Cuánto pone cada quien</div>' +
      (partes.length ? '<div class="seg-p">' + partes.map(function (x) { var w = x.v / tot; return '<div style="flex:' + w + ';background:' + colorF(x.f.id) + '">' + (w >= 0.1 ? M.pct(w) : '') + '</div>'; }).join('') + '</div>' : '<div class="seg-p"><div style="flex:1;background:var(--t-filete)"></div></div>') +
      '<div class="ley-p">' + F.map(function (f) { var v = c.porF[f.id] || 0; return '<i style="background:' + colorF(f.id) + '"></i><span>' + esc(f.nombre || 'Fuente') + ' <span class="tipo-f">' + (f.tipo === 'especie' ? 'en especie' : 'en dinero') + '</span></span><span class="m">' + M.pesos(v) + '</span><span class="p">' + (c.total ? M.pct(v / c.total) : '') + '</span>'; }).join('') + '</div></div></div>';
    var anchoF = F.length ? (horizontal ? 1.05 : (F.length === 1 ? 1.1 : F.length === 2 ? 1.0 : .82)) : 0;
    var cols = '<colgroup><col><col style="width:.62in"><col style="width:.5in"><col style="width:.82in"><col style="width:.9in">' + F.map(function () { return '<col style="width:' + anchoF + 'in">'; }).join('') + '</colgroup>';
    var th = '<thead><tr><th>Concepto</th><th>Unidad</th><th class="num">Cant.</th><th class="num">Precio unitario</th><th class="num">Importe</th>' + F.map(function (f) { return '<th class="f" data-parte="fuentes"><i style="background:' + colorF(f.id) + '"></i>' + esc(f.nombre || 'Fuente') + '</th>'; }).join('') + '</tr></thead>';
    var celdasF = function (porFuente) { return F.map(function (f) { var v = porFuente[f.id] || 0; return '<td class="num' + (v ? '' : ' vacia') + '">' + (v ? M.pesos(v) : '') + '</td>'; }).join(''); };
    var cuerpo = '';
    s.rubros.forEach(function (r) {
      var ps = s.partidas.filter(function (p) { return p.rubro === r.id && viva(p); });
      if (!ps.length) return;
      cuerpo += '<tr class="grupo"><td colspan="' + (5 + F.length) + '">' + esc(r.nombre || 'Rubro') + '</td></tr>';
      ps.forEach(function (p) { var pf = {}; if (p.f) pf[p.f] = importe(p); cuerpo += '<tr data-parte="partida-' + esc(p.id) + '"><td class="concepto">' + esc(p.c || 'Sin nombre') + '</td><td class="unidad">' + esc(p.u) + '</td><td class="num">' + M.cifra(n(p.q)) + '</td><td class="num">' + M.pesos(n(p.p)) + '</td><td class="num">' + M.pesos(importe(p)) + '</td>' + celdasF(pf) + '</tr>'; });
      cuerpo += '<tr class="sub"><td colspan="4">Subtotal ' + esc((r.nombre || 'rubro').toLowerCase()) + '</td><td class="num">' + M.pesos(c.porR[r.id] || 0) + '</td>' + celdasF(c.matriz[r.id] || {}) + '</tr>';
    });
    if (c.imp > 0) {
      var pi = {}; if (c.fImp) pi[c.fImp.id] = c.imp;
      cuerpo += '<tr class="grupo" data-parte="imponderables"><td colspan="' + (5 + F.length) + '">Imponderables</td></tr><tr data-parte="imponderables"><td class="concepto">Imponderables, ' + M.cifra(n(s.imp.pct)) + '% de lo que se compra</td><td class="unidad">lote</td><td class="num">1</td><td class="num">' + M.pesos(c.imp) + '</td><td class="num">' + M.pesos(c.imp) + '</td>' + celdasF(pi) + '</tr>';
    } else cuerpo += '<tr data-parte="imponderables" class="hueco"><td colspan="' + (5 + F.length) + '">Aquí va el renglón de los imponderables.</td></tr>';
    if (!s.partidas.some(viva)) cuerpo = '<tr><td colspan="' + (5 + F.length) + '" style="color:var(--t-tenue);padding:14pt 0">Las partidas que escribas aparecen aquí, agrupadas por rubro.</td></tr>' + (c.imp > 0 ? '' : '');
    var pieT = '<tr class="total"><td colspan="4">Total del proyecto</td><td class="num">' + M.pesos(c.total) + '</td>' + celdasF(c.porF) + '</tr>';
    var matriz = '<table class="tabla matriz" data-parte="matriz">' + cols + th + '<tbody>' + cuerpo + pieT + '</tbody></table>';
    var rubros = '<div class="rubros-p hueco" data-parte="rubros-p">Aquí va el resumen por rubro, si lo marcas.</div>';
    if (s.ver.rubros) {
      var rs = rubrosOrdenados(), max = rs.length ? rs[0].v : 1;
      if (rs.length > 1) rubros = '<div class="rubros-p" data-parte="rubros-p"><h3>En qué se va el dinero, por rubro</h3>' + rs.map(function (x) {
        return '<div class="fila-r"><span>' + esc(x.r.nombre) + '</span><div class="pista-r"><div style="width:' + (100 * x.v / max).toFixed(2) + '%"></div></div><span class="m">' + M.pesos(x.v) + '</span><span class="p">' + M.pct(x.v / tot) + '</span></div>';
      }).join('') + '</div>';
    }
    var notas = s.notas ? '<p class="notas-p" data-parte="notas"><b>Notas.</b> ' + M.escBr(s.notas) + '</p>' : '<p class="notas-p hueco" data-parte="notas">Aquí van las notas: de dónde salen los precios y cómo se valoriza la faena.</p>';
    var firmas = '<div class="firmas">' + (s.elaboro.nombre ? M.firma(m, 'Elaboró', { nombre: s.elaboro.nombre, cargo: s.elaboro.cargo, sinImagen: true }) : '') + (s.reviso.nombre ? M.firma(m, 'Visto bueno', { nombre: s.reviso.nombre, cargo: s.reviso.cargo, sinImagen: true }) : '') + '</div>';
    return M.hoja({ horizontal: horizontal, compacta: true, acento: m.color, pieIzq: M.pieMembrete(m), pieDer: esc((s.proyecto ? s.proyecto + '. ' : '') + 'Presupuesto') },
      M.cabezaProducto(der) + cabeza + resumen + matriz + rubros + notas + firmas);
  }
  function pintarHojaYa() {
    $('#marco').innerHTML = hojaPresupuesto(); M.ajustarHoja();
    var vivas = s.partidas.filter(viva).length;
    $('#resumen-hoja').textContent = vivas ? 'Así va: ' + vivas + ' partidas, total ' + M.pesos(c.total) : 'Así va tu presupuesto';
  }
  var pintarHoja = M.debounce(pintarHojaYa, 60);

  /* ---------- Word ---------- */
  function wordPresupuesto() {
    var m = memb, F = s.fuentes, horizontal = F.length > 3;
    var d = M.docx({ horizontal: horizontal, acento: m.color, titulo: 'Presupuesto ' + (s.proyecto || ''), autor: m.nombre, pie: [m.nombre, m.telefono, m.correo].filter(Boolean).join('   ·   '), margen: { izq: 0.6, der: 0.6, sup: 0.55, inf: 0.65 } });
    M.docxTitulo(d, { tipo: 'Presupuesto', folio: M.fecha(s.fecha) });
    d.p([{ t: s.proyecto || 'Nombre del proyecto', tam: 13 }], { antes: 8, despues: 1 });
    if (bajada()) d.p([{ t: bajada(), tam: 9.5, color: '#4B5A5E' }], { despues: 4 });
    // el resumen: total a la izquierda, quién pone a la derecha
    var izq = [{ c: [{ t: 'Total del proyecto', tam: 7.8, color: '#7B898C' }] }, { c: [{ t: M.pesos(c.total), b: true, tam: 20, color: d.acento }], f: { despues: 2 } }, { c: [{ t: M.conLetra(c.total), tam: 7.2, color: '#4B5A5E' }] }];
    if (c.especie) izq.push({ c: [{ t: 'En dinero ' + M.pesos(c.dinero) + '\nEn especie ' + M.pesos(c.especie), tam: 8.2, color: '#4B5A5E' }], f: { antes: 4 } });
    var der = [{ c: [{ t: 'Cuánto pone cada quien', tam: 7.8, color: '#7B898C' }], f: { despues: 3 } }].concat(F.map(function (f) {
      var v = c.porF[f.id] || 0;
      return { c: [{ t: '■ ', color: colorF(f.id), tam: 10 }, { t: (f.nombre || 'Fuente') + ' ', tam: 8.6 }, { t: f.tipo === 'especie' ? 'en especie' : 'en dinero', tam: 7.4, color: '#7B898C' }, { tab: true }, { t: M.pesos(v) + (c.total ? '   ' + M.pct(v / c.total) : ''), tam: 8.6 }], f: { tabDer: d.util * 0.58 - 0.15, despues: 1 } };
    }));
    d.tabla({ anchos: [d.util * 0.42, d.util * 0.58], margenCelda: 0.04, margenV: 0.08, bordes: { top: { c: '#DCE2E3', g: 0.5 }, bottom: { c: '#DCE2E3', g: 0.5 } }, filas: [[{ parrafos: izq }, { parrafos: der }]] });
    // la matriz
    var anchoF = horizontal ? 1.05 : (F.length === 1 ? 1.1 : F.length === 2 ? 1.0 : 0.82);
    var fijos = [0.62, 0.5, 0.82, 0.9], resto = d.util - fijos.reduce(function (a, x) { return a + x; }, 0) - anchoF * F.length;
    var columnas = [{ t: 'Concepto', ancho: resto }, { t: 'Unidad', ancho: 0.62 }, { t: 'Cant.', ancho: 0.5, alin: 'der' }, { t: 'Precio unitario', ancho: 0.82, alin: 'der' }, { t: 'Importe', ancho: 0.9, alin: 'der' }]
      .concat(F.map(function (f) { return { t: f.nombre || 'Fuente', ancho: anchoF, alin: 'der' }; }));
    var celdasF = function (pf, extra) { return F.map(function (f) { var v = pf[f.id] || 0; var cc = { t: v ? M.pesos(v) : '', alin: 'der' }; for (var k in (extra || {})) cc[k] = extra[k]; return cc; }); };
    var filas = [];
    s.rubros.forEach(function (r) {
      var ps = s.partidas.filter(function (p) { return p.rubro === r.id && viva(p); });
      if (!ps.length) return;
      filas.push({ grupo: r.nombre || 'Rubro' });
      ps.forEach(function (p) { var pf = {}; if (p.f) pf[p.f] = importe(p); filas.push([p.c || 'Sin nombre', { t: [{ t: p.u || '', color: '#4B5A5E' }] }, M.cifra(n(p.q)), M.pesos(n(p.p)), M.pesos(importe(p))].concat(celdasF(pf))); });
      var sub = { fondo: d.suave(0.09), b: true };
      filas.push([Object.assign({ t: 'Subtotal ' + (r.nombre || 'rubro').toLowerCase(), span: 4 }, sub), Object.assign({ t: M.pesos(c.porR[r.id] || 0) }, sub)].concat(celdasF(c.matriz[r.id] || {}, sub)));
    });
    if (c.imp > 0) {
      var pi = {}; if (c.fImp) pi[c.fImp.id] = c.imp;
      filas.push({ grupo: 'Imponderables' });
      filas.push(['Imponderables, ' + M.cifra(n(s.imp.pct)) + '% de lo que se compra', 'lote', '1', M.pesos(c.imp), M.pesos(c.imp)].concat(celdasF(pi)));
    }
    var tot = { b: true, tam: 10, bordes: { top: { c: d.acento, g: 1 } } };
    filas.push([Object.assign({ t: 'Total del proyecto', span: 4 }, tot), Object.assign({ t: M.pesos(c.total), alin: 'der' }, tot)].concat(celdasF(c.porF, tot)));
    d.espacio(6);
    M.docxTablaDatos(d, columnas, filas, { tam: 8.4, margen: 0.05 });
    if (s.ver.rubros) {
      var rs = rubrosOrdenados(), total = c.total || 1;
      if (rs.length > 1) {
        d.p([{ t: 'En qué se va el dinero, por rubro', b: true, tam: 9, color: d.acento }], { antes: 12, despues: 3, junto: true });
        M.docxTablaDatos(d, [{ t: 'Rubro', ancho: d.util - 2.2 }, { t: 'Importe', ancho: 1.3, alin: 'der' }, { t: 'Parte', ancho: 0.9, alin: 'der' }], rs.map(function (x) { return [x.r.nombre, M.pesos(x.v), M.pct(x.v / total)]; }), { tam: 8.6 });
      }
    }
    if (s.notas) d.p([{ t: 'Notas. ', b: true, tam: 8.6 }, { t: s.notas, tam: 8.6, color: '#4B5A5E' }], { antes: 10 });
    var firmas = [];
    if (s.elaboro.nombre) firmas.push({ que: 'Elaboró', nombre: s.elaboro.nombre, cargo: s.elaboro.cargo });
    if (s.reviso.nombre) firmas.push({ que: 'Visto bueno', nombre: s.reviso.nombre, cargo: s.reviso.cargo });
    if (firmas.length) M.docxFirmas(d, firmas);
    return d;
  }

  /* ---------- La imagen: quién pone qué ---------- */
  var L = M.lienzo;
  function imagenPresupuesto() {
    var m = memb, W = 1080, H = 1350, x = L.crear(W, H), g = x.g, col = m.color || '#0B3C49';
    return L.fuentes().then(function () {
      g.fillStyle = col; g.fillRect(0, 0, W, 14);
      L.texto(g, 'Presupuesto', 72, 104, { tam: 40, peso: 500, color: col });
      L.texto(g, M.fecha(s.fecha), W - 72, 118, { tam: 22, color: '#4B5A5E', alin: 'der' });
      var y = L.texto(g, s.proyecto || 'Nombre del proyecto', 72, 210, { tam: 46, peso: 600, color: '#1D2A2E', ancho: W - 144, max: 2, interlinea: 1.12 });
      if (bajada()) y = L.texto(g, bajada(), 72, y + 8, { tam: 23, color: '#4B5A5E', ancho: W - 144, max: 2 });
      y += 30; L.linea(g, 72, y, W - 72, y, '#DCE2E3', 2); y += 26;
      L.texto(g, 'Total del proyecto', 72, y, { tam: 25, color: '#7B898C' });
      L.texto(g, M.pesos(c.total), 72, y + 32, { tam: 78, peso: 600, color: col });
      y = L.texto(g, M.conLetra(c.total), 72, y + 128, { tam: 19, color: '#4B5A5E', ancho: W - 144, max: 2 });
      y += 34;
      L.texto(g, 'Quién pone qué', 72, y, { tam: 30, peso: 600, color: '#1D2A2E' });
      y += 54;
      var partes = s.fuentes.map(function (f) { return { f: f, v: c.porF[f.id] || 0 }; }), tot = c.total || 1, xx = 72, ancho = W - 144;
      partes.filter(function (p) { return p.v > 0; }).forEach(function (p) { var w = ancho * p.v / tot; L.rect(g, xx, y, Math.max(4, w - 4), 46, 8, colorF(p.f.id)); if (p.v / tot >= 0.1) L.texto(g, M.pct(p.v / tot), xx + 14, y + 8, { tam: 22, peso: 600, color: '#FFFFFF' }); xx += w; });
      if (!c.total) L.rect(g, 72, y, ancho, 46, 8, '#E3E8E9');
      y += 74;
      partes.forEach(function (p) {
        L.rect(g, 72, y + 6, 22, 22, 5, colorF(p.f.id));
        L.texto(g, (p.f.nombre || 'Fuente'), 110, y, { tam: 27, color: '#1D2A2E', ancho: 560, max: 1 });
        L.texto(g, p.f.tipo === 'especie' ? 'en especie' : 'en dinero', 110, y + 34, { tam: 20, color: '#7B898C' });
        L.texto(g, M.pesos(p.v), W - 72 - 110, y, { tam: 27, peso: 500, color: '#1D2A2E', alin: 'der' });
        L.texto(g, c.total ? M.pct(p.v / tot) : '', W - 72, y, { tam: 25, color: '#4B5A5E', alin: 'der' });
        y += 74;
      });
      var rs = rubrosOrdenados().slice(0, 4), max = rs.length ? rs[0].v : 1;
      if (rs.length > 1 && y < H - 330) {
        y += 6; L.texto(g, 'En qué se va', 72, y, { tam: 30, peso: 600, color: '#1D2A2E' }); y += 52;
        rs.forEach(function (r) {
          if (y > H - 150) return;
          L.texto(g, r.r.nombre, 72, y, { tam: 23, color: '#1D2A2E', ancho: 360, max: 1 });
          L.rect(g, 450, y + 6, 360, 18, 9, M.aclarar(col, 0.12));
          L.rect(g, 450, y + 6, Math.max(18, 360 * r.v / max), 18, 9, col);
          L.texto(g, M.pesos(r.v), W - 72, y, { tam: 23, color: '#1D2A2E', alin: 'der' });
          y += 46;
        });
      }
      L.linea(g, 72, H - 104, W - 72, H - 104, '#DCE2E3', 2);
      if (m.telefono) L.texto(g, 'Tel. ' + m.telefono, 72, H - 82, { tam: 26, color: '#4B5A5E' });
      if (m.correo) L.texto(g, m.correo, W - 72, H - 82, { tam: 26, color: '#4B5A5E', alin: 'der' });
      return x.c;
    });
  }

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

  /* ---------- Guardar y abrir ---------- */
  var guardarLuego = M.debounce(function () {
    if (!s.tocado) return;
    if (A.guardar(s)) { var d = new Date(); $('#estado').textContent = 'Guardado ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  }, 350);
  function actualizar() { c = calcular(); pintarCifras(); pintarHoja(); }
  function cambio() { s.tocado = true; actualizar(); guardarLuego(); }
  function abrir(d, mensaje, guardarYa, paso) {
    if (s && s.tocado) A.guardar(s);
    s = completar(d); c = calcular(); pintarFuentes(); pintarRubros(); M.llenar(banco, s);
    lista.empezar(function (p) { return !viva(p); });
    actualizar(); pintarHojaYa();
    $('#estado').textContent = s.tocado ? 'Guardado' : 'Se guarda solo al escribir';
    if (s.tocado) A.marcarActual(s.id);
    if (guardarYa) { s.tocado = true; guardarLuego(); }
    guia.abrir({ paso: paso, primero: 'proyecto', sinFoco: true });
    if (mensaje) M.aviso(mensaje);
  }

  M.escuchar(banco, function () { return s; }, function (k) {
    if (/^fuentes\./.test(k)) {
      var iv = $('#imp-f').value; $('#imp-f').innerHTML = opcionesF(iv); $('#imp-f').value = iv;
      M.$$('#lista-fuentes .muestra').forEach(function (el, i) { if (s.fuentes[i]) el.style.background = colorF(s.fuentes[i].id); });
    }
    if (/^partidas\./.test(k)) { lista.filas(); if (/\.(c|q|p)$/.test(k)) focoPartida(lista.actual()); }
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
      pintarFuentes(); cambio(); return;
    }
    if ((b = e.target.closest('#sug-fuentes button'))) {
      var nom = b.textContent === 'Otra' ? '' : b.textContent;
      s.fuentes.push({ id: M.uid(), nombre: nom, tipo: b.dataset.tipo || 'dinero' });
      pintarFuentes(); cambio();
      var ins = M.$$('#lista-fuentes input'); if (ins.length && !nom) ins[ins.length - 1].focus();
      return;
    }
    if ((b = e.target.closest('[data-quitar-rubro]'))) {
      var ri = +b.dataset.quitarRubro, r = s.rubros[ri];
      var con = s.partidas.filter(function (p) { return p.rubro === r.id && viva(p); }).length;
      if (con && !window.confirm('El rubro «' + r.nombre + '» tiene ' + con + ' partida(s). Se borran con él. ¿Quitar?')) return;
      s.rubros.splice(ri, 1); s.partidas = s.partidas.filter(function (p) { return p.rubro !== r.id; });
      if (!s.partidas.length) s.partidas.push(partidaVacia((s.rubros[0] || {}).id, (s.fuentes[0] || {}).id));
      pintarRubros(); cambio(); return;
    }
    if (e.target.closest('[data-agregar-flete]')) {
      var rf = s.rubros.filter(function (x) { return /(traslado|flete)/i.test(x.nombre); })[0] || s.rubros[s.rubros.length - 1];
      var dinero = s.fuentes.filter(function (f) { return f.tipo !== 'especie'; })[0] || s.fuentes[0];
      var j = agregarPartida({ c: 'Flete del material hasta el lugar', u: 'viaje', q: 1, rubro: rf ? rf.id : '', f: dinero ? dinero.id : '' });
      lista.editar(j); focoPartida(j);
      var inp = M.$('#pa-p'); if (inp) inp.focus();
    }
  });
  $('#agregar-rubro').onclick = function () {
    s.rubros.push({ id: M.uid(), nombre: '' }); pintarRubros(); cambio();
    var ins = M.$$('#lista-rubros input'); if (ins.length) ins[ins.length - 1].focus();
  };

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
      [2, 'Jornales de faena para levantar la estructura', 'jornal', 16, 315.04, 'f2'], [2, 'Riego por turnos, de mayo a agosto', 'jornal', 40, 315.04, 'f2'],
      [3, 'Soldadura de la estructura', 'servicio', 1, 2500, 'f1'],
      [4, 'Flete del material desde Jalpan', 'viaje', 2, 600, 'f1'],
      [5, 'Lona de identificación del vivero', 'pieza', 1, 450, 'f1']
    ];
    d.partidas = P.map(function (x) { return { id: M.uid(), rubro: R[x[0]].id, c: x[1], u: x[2], q: x[3], p: x[4], f: x[5] }; });
    d.imp = { pct: 5, f: 'f1' };
    d.notas = 'Precios con IVA, de cotizaciones de octubre de 2026. La faena se valoriza al salario mínimo general de 2026: $315.04 el jornal.';
    abrir(d, 'Un ejemplo hecho: recórrelo con «Siguiente» para ver cómo se armó, o empieza uno nuevo.', true, 'proyecto');
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
    M.abrirArchivo('presupuesto', function (datos) { var d = completar(datos); d.id = M.uid(); abrir(d, 'Se abrió «' + (d.proyecto || 'el presupuesto') + '».', true); });
  }
  function nombreArchivo(ext) { return M.slug('presupuesto-' + (s.proyecto || '')) + '.' + ext; }
  $('#nueva').onclick = function () { abrir(nuevo(), 'Presupuesto nuevo.'); };
  $('#ejemplo').onclick = ejemplo;
  M.alImprimir(function () { return 'Presupuesto ' + (s.proyecto || ''); }, pintarHojaYa);

  /* ---------- Arranque ---------- */
  memb = M.sinMembrete();
  lista = M.listaGuiada({
    cont: $('#lista-partidas'),
    items: function () { return s.partidas; },
    agregar: function () { return agregarPartida(); },
    quitar: function (i) {
      if (viva(s.partidas[i]) && !window.confirm('¿Quitar «' + (s.partidas[i].c || 'esta partida') + '»?')) return false;
      s.partidas.splice(i, 1);
      if (!s.partidas.length) s.partidas.push(partidaVacia((s.rubros[0] || {}).id, (s.fuentes[0] || {}).id));
      cambio(); return true;
    },
    resumen: resumenPartida,
    titulo: function (p, i) { return 'Partida ' + (i + 1); },
    editor: editorPartida,
    textoOtra: 'Agregar otra partida', textoPrimero: 'Agregar la primera partida', textoQuitar: 'Quitar esta',
    botones: function () { return '<button type="button" class="btn claro" data-agregar-flete>' + M.ico.mas + 'El flete</button>'; },
    llenar: function (cont) { M.llenar(cont, s); },
    alPintar: function (cont, i) { focoPartida(i); }
  });
  function bajarWord() { return wordPresupuesto().descargar(nombreArchivo('docx')).then(function () { return 'Listo: el Word se descargó.'; }); }
  M.entregas($('#entregas'), [
    { ico: 'word', t: 'Word editable', d: 'La matriz completa, para pegarla en tu proyecto y seguir editándola.', hacer: bajarWord, principal: true },
    { ico: 'imagen', t: 'Imagen JPG', d: 'Quién pone qué, en una imagen, para una presentación, el grupo o el comité.', hacer: function () { return imagenPresupuesto().then(function (cv) { return L.entregar(cv, nombreArchivo('jpg'), 'Presupuesto'); }).then(function (r) { return r === 'compartida' ? 'Imagen compartida.' : r === 'cancelada' ? '' : 'Listo: la imagen se descargó.'; }); } },
    { ico: 'texto', t: 'Hoja de cálculo', d: 'Las partidas en CSV, para abrirlas en Excel o en Google Sheets.', hacer: csv },
    { ico: 'archivo', t: 'Guardar para seguir después', d: 'Un archivo de la mochila, para abrirlo en otro aparato o guardarlo en tu Drive.', hacer: function () { s.tocado = true; guardarLuego(); M.descargarArchivo('presupuesto', 'presupuesto-' + (s.proyecto || ''), s); } }
  ]);
  $('#word-movil').onclick = function () { bajarWord().then(function (msg) { M.aviso(msg); }); };
  guia = M.guia({
    raiz: $('#guia'), marco: $('#marco'), panel: $('.panel-hoja'), membrete: false,
    estado: function () { return s; }, guardar: function () { guardarLuego(); },
    listo: { partidas: function () { return s.partidas.some(viva); }, fuentes: function () { return s.fuentes.length > 0; } },
    alEntrar: {
      partidas: function () { lista.empezar(function (p) { return !viva(p); }); },
      rubros: function () { pintarRubros(); pintarCifras(); },
      fuentes: function () { pintarFuentes(); },
      entregar: function () { guia.pintarFaltan($('#faltan')); }
    }
  });
  var id = A.idActual(), guardado = id && A.obtener(id);
  abrir(guardado || nuevo());
  M.montarVista();
  window.addEventListener('pagehide', function () { if (s && s.tocado) A.guardar(s); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && s && s.tocado) A.guardar(s); });
  window.MOCHILA_PRUEBA = { estado: function () { return s; }, guia: function () { return guia; }, word: function () { return wordPresupuesto().blob(); }, imagen: imagenPresupuesto };
})();
