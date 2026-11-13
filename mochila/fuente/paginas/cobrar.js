/* Cotizar y cobrar: la cuenta en el sobre, la cotización y el recibo en la hoja. */
(function () {
  'use strict';
  var $ = M.$, n = M.num, esc = M.esc;
  var A = new M.Archivero('cobrar');
  var banco = $('.banco');
  var s, c, memb;
  var COLOR_TRABAJO = '#00899e', COLOR_GASTOS = '#c46a1f', COLOR_IMPREVISTOS = '#7b52ae';

  /* ---------- El documento vacío ---------- */
  function nuevo() {
    return {
      id: M.uid(), tocado: false, creado: new Date().toISOString(),
      folio: String((M.leer('folio:COT', 0) || 0) + 1).padStart(3, '0'),
      fecha: M.hoyISO(), vigencia: 30,
      cliente: { nombre: '', contacto: '', telefono: '', correo: '' },
      servicio: { titulo: '', descripcion: '', lugar: '', cuando: '', participantes: '', duracion: '' },
      horas: { preparar: '', traslado: '', hacer: '', entregar: '' },
      trabajan: 1, tarifa: M.leer('tarifa', ''),
      viaticos: [], materiales: [], otros: [],
      gas: { km: '', rend: 12, precio: '' },
      imprevistos: 5, redondeo: 50,
      vista: 'unico', incluye: '', noIncluye: '',
      anticipo: 50, iva: false, formaPago: 'Transferencia o efectivo', notas: '',
      tipoDoc: 'cotizacion',
      recibo: { folio: '', fecha: M.hoyISO(), concepto: 'anticipo', monto: '', anteriores: '', forma: 'Transferencia', referencia: '', notaFiscal: true, manual: false }
    };
  }
  function mezclar(base, x) {
    for (var k in x) {
      if (x[k] && typeof x[k] === 'object' && !Array.isArray(x[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) mezclar(base[k], x[k]);
      else base[k] = x[k];
    }
    return base;
  }
  function completar(d) { return mezclar(nuevo(), M.copia(d || {})); }

  /* ---------- La cuenta ---------- */
  function suma(l, f) { return (l || []).reduce(function (a, x) { return a + f(x); }, 0); }
  function r2(x) { return Math.round(x * 100) / 100; }
  function calcular(s) {
    var h = s.horas, horas = n(h.preparar) + n(h.traslado) + n(h.hacer) + n(h.entregar);
    var personas = Math.max(1, Math.round(n(s.trabajan)) || 1);
    var horasTodas = horas * personas;
    var honor = r2(horasTodas * n(s.tarifa));
    var viat = r2(suma(s.viaticos, function (x) { return n(x.m); }));
    var mat = r2(suma(s.materiales, function (x) { return n(x.q) * n(x.p); }));
    var otros = r2(suma(s.otros, function (x) { return n(x.m); }));
    var base = honor + viat + mat + otros;
    var imp = r2(base * n(s.imprevistos) / 100);
    var sub = r2(base + imp);
    var precio = n(s.redondeo) > 0 ? M.redondearArriba(sub, n(s.redondeo)) : sub;
    var ajuste = r2(precio - sub);
    var iva = s.iva ? r2(precio * 0.16) : 0;
    var total = r2(precio + iva);
    var anticipo = r2(total * n(s.anticipo) / 100);
    return {
      horas: horas, personas: personas, horasTodas: horasTodas, honor: honor, viat: viat, mat: mat, otros: otros,
      gastos: r2(viat + mat + otros), imp: imp, sub: sub, precio: precio, ajuste: ajuste, iva: iva, total: total, anticipo: anticipo,
      invisibles: (horas - n(h.hacer)) * personas, soloHacer: r2(n(h.hacer) * personas * n(s.tarifa))
    };
  }

  /* Los renglones que ve el cliente, según lo que se asoma del sobre */
  function renglonesCliente() {
    var sv = s.servicio, titulo = sv.titulo || 'Servicio';
    var extra = [sv.duracion, sv.participantes && ('para ' + (/^\d+$/.test(String(sv.participantes).trim()) ? sv.participantes + ' personas' : sv.participantes))].filter(Boolean).join(', ');
    if (s.vista === 'gastos') {
      var l = [];
      var g1 = c.mat, g2 = r2(c.viat + c.otros);
      l.push({ c: titulo, d: extra || 'Servicio profesional', q: 1, pu: null, imp: r2(c.precio - g1 - g2) });
      if (g1 > 0) l.push({ c: 'Materiales e insumos', d: 'Para el trabajo y para las personas participantes', q: 1, imp: g1 });
      if (g2 > 0) l.push({ c: c.otros > 0 ? 'Viáticos, traslado y otros gastos' : 'Viáticos y traslado', d: '', q: 1, imp: g2 });
      return l;
    }
    if (s.vista === 'desglose') {
      var d = [];
      if (c.honor > 0 || c.horasTodas > 0) d.push({ c: 'Servicio profesional: ' + titulo, d: M.cifra(c.horasTodas) + ' horas de trabajo' + (c.personas > 1 ? ' (' + c.personas + ' personas)' : '') + ': preparación, traslado, ejecución y entrega', q: c.horasTodas, pu: n(s.tarifa), imp: c.honor, unidad: 'hora' });
      s.materiales.forEach(function (x) { var i = r2(n(x.q) * n(x.p)); if (x.c || i) d.push({ c: x.c || 'Material', q: n(x.q), pu: n(x.p), imp: i }); });
      s.viaticos.forEach(function (x) { if (x.c || n(x.m)) d.push({ c: x.c || 'Viáticos', q: 1, pu: n(x.m), imp: r2(n(x.m)) }); });
      s.otros.forEach(function (x) { if (x.c || n(x.m)) d.push({ c: x.c || 'Otro gasto', q: 1, pu: n(x.m), imp: r2(n(x.m)) }); });
      var resto = r2(c.precio - d.reduce(function (a, x) { return a + x.imp; }, 0));
      if (Math.abs(resto) >= 0.005) d.push({ c: n(s.imprevistos) > 0 ? 'Imprevistos' : 'Ajuste por redondeo', d: n(s.imprevistos) > 0 ? 'Alrededor del ' + n(s.imprevistos) + '% de lo anterior' : '', q: 1, pu: resto, imp: resto });
      return d;
    }
    return [{ c: titulo, d: extra, q: 1, pu: c.precio, imp: c.precio }];
  }

  /* ---------- El sobre en pantalla ---------- */
  function pintarSobre() {
    $('#txt-trabajo').textContent = 'Tu trabajo: ' + M.cifra(c.horas) + ' h' + (c.personas > 1 ? ' × ' + c.personas + ' personas' : '') + ' × ' + (n(s.tarifa) ? M.pesos(n(s.tarifa)) : '$?') + ' la hora';
    $('#sub-trabajo').textContent = M.pesos(c.honor);
    $('#sub-viaticos').textContent = M.pesos(c.viat);
    $('#sub-materiales').textContent = M.pesos(c.mat);
    $('#sub-otros').textContent = M.pesos(c.otros);
    M.$$('[data-importe]').forEach(function (el) { var x = s.materiales[+el.dataset.importe]; el.textContent = x ? M.pesos(n(x.q) * n(x.p)) : ''; });
    var g = s.gas, litros = n(g.rend) ? n(g.km) / n(g.rend) : 0, costo = r2(litros * n(g.precio));
    $('#gas-res').textContent = n(g.km) && n(g.rend) && n(g.precio) ? M.cifra(litros, 1) + ' litros: ' + M.pesos(costo) : 'Llena los tres datos.';
    $('#gas-agregar').disabled = !(costo > 0);

    var faltan = [];
    if (!c.horas) faltan.push('las horas');
    if (!n(s.tarifa)) faltan.push('el valor de tu hora');
    var partes = [
      { t: 'Tu trabajo', v: r2(c.honor + c.ajuste), col: COLOR_TRABAJO },
      { t: 'Gastos', v: c.gastos, col: COLOR_GASTOS },
      { t: 'Imprevistos', v: c.imp, col: COLOR_IMPREVISTOS }
    ].filter(function (p) { return p.v > 0; });
    var tot = partes.reduce(function (a, p) { return a + p.v; }, 0) || 1;
    var h = '<div class="grande"><span class="t">Precio del servicio' + (s.iva ? ', antes de IVA' : '') + '</span><span class="v">' + M.pesos(c.precio) + '</span></div>';
    if (faltan.length) h += '<p class="nota" style="margin-top:4px">Falta ' + faltan.join(' y ') + '. Sin eso, la cuenta sale corta.</p>';
    if (partes.length > 1) {
      h += '<div class="segmentos" role="img" aria-label="' + esc(partes.map(function (p) { return p.t + ' ' + M.pct(p.v / tot); }).join(', ')) + '">' +
        partes.map(function (p) { var w = p.v / tot; return '<div style="flex:' + w + ';background:' + p.col + '">' + (w >= 0.16 ? M.pct(w) : '') + '</div>'; }).join('') + '</div>' +
        '<div class="leyenda">' + partes.map(function (p) { return '<span><i style="background:' + p.col + '"></i>' + p.t + '</span>'; }).join('') + '</div>';
    }
    h += '<div style="margin-top:10px">' +
      fila('Tu trabajo', c.honor) + fila('Viáticos y traslado', c.viat) + fila('Materiales e insumos', c.mat) + (c.otros ? fila('Otros gastos', c.otros) : '') +
      fila('Imprevistos (' + n(s.imprevistos) + '%)', c.imp) + (c.ajuste ? fila('Redondeo', c.ajuste) : '') +
      (s.iva ? fila('IVA (16%), que se le entrega al SAT', c.iva) + fila('Total con IVA', c.total) : '') + '</div>';
    if (c.horas && n(h0().hacer) && c.invisibles > 0 && n(s.tarifa)) {
      h += '<p class="nota">Horas que nadie ve: ' + M.cifra(c.invisibles) + ' de ' + M.cifra(c.horasTodas) + '. Si cobraras solo las de hacer el trabajo, cobrarías ' + M.pesos(c.soloHacer) + ' y las otras ' + M.cifra(c.invisibles) + ' horas las regalarías.</p>';
    }
    if (c.precio > 0) h += '<p class="nota">Lo que te queda a ti: ' + M.pesos(r2(c.honor + c.ajuste)) + (c.imp ? ', más los imprevistos (' + M.pesos(c.imp) + ') si nada sale mal.' : '.') + '</p>';
    $('#cuenta').innerHTML = h;
  }
  function h0() { return s.horas; }
  function fila(t, v) { return '<div class="linea-cuenta"><span>' + esc(t) + '</span><b>' + M.pesos(v) + '</b></div>'; }

  /* ---------- Renglones del sobre ---------- */
  function pintarLista(nombre) {
    var cont = $('#lista-' + nombre), l = s[nombre];
    cont.innerHTML = l.map(function (x, i) {
      if (nombre === 'materiales') {
        return '<div class="renglon r-material">' +
          '<input class="c" type="text" aria-label="Qué material" placeholder="Qué" data-k="materiales.' + i + '.c">' +
          '<input class="q cant" type="number" inputmode="decimal" min="0" step="any" aria-label="Cantidad" data-k="materiales.' + i + '.q" data-tipo="num">' +
          '<div class="con-prefijo p"><span>$</span><input class="monto" type="number" inputmode="decimal" min="0" step="any" aria-label="Precio de cada uno" data-k="materiales.' + i + '.p" data-tipo="num"></div>' +
          '<span class="importe" data-importe="' + i + '"></span>' +
          '<button type="button" class="quitar" data-quitar="materiales" data-i="' + i + '" aria-label="Quitar este renglón">×</button></div>';
      }
      return '<div class="renglon r-monto"><input type="text" aria-label="Concepto" placeholder="Concepto" data-k="' + nombre + '.' + i + '.c">' +
        '<div class="con-prefijo"><span>$</span><input class="monto" type="number" inputmode="decimal" min="0" step="any" aria-label="Cuánto" data-k="' + nombre + '.' + i + '.m" data-tipo="num"></div>' +
        '<button type="button" class="quitar" data-quitar="' + nombre + '" data-i="' + i + '" aria-label="Quitar este renglón">×</button></div>';
    }).join('') || '<p class="ayuda" style="margin:0">Nada todavía.</p>';
    M.llenar(cont, s);
  }
  function pintarListas() { ['viaticos', 'materiales', 'otros'].forEach(pintarLista); }

  /* ---------- La hoja ---------- */
  function pareja(rot, v) { return v ? '<dt>' + esc(rot) + '</dt><dd>' + esc(v) + '</dd>' : ''; }
  function lineas(t) { return String(t || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function bloqueCliente(rot) {
    var cl = s.cliente;
    return '<div><div class="rot">' + (rot || 'Para') + '</div><div class="dato-grande"' + (cl.nombre ? '' : ' style="color:var(--t-tenue)"') + '>' + esc(cl.nombre || 'Nombre del cliente') + '</div>' +
      (cl.contacto ? '<div class="dato">Atención: ' + esc(cl.contacto) + '</div>' : '') +
      ([cl.telefono, cl.correo].filter(Boolean).length ? '<div class="dato">' + esc([cl.telefono, cl.correo].filter(Boolean).join(', ')) + '</div>' : '') + '</div>';
  }
  function hojaCotizacion() {
    var m = memb, sv = s.servicio;
    var der = '<div class="tipo">Cotización</div><div class="folio">No. <b>' + esc(s.folio || 's/n') + '</b></div>';
    var vence = s.fecha && n(s.vigencia) ? M.fecha(M.sumarDias(s.fecha, n(s.vigencia))) : '';
    var datos = '<div class="datos">' + bloqueCliente() +
      '<dl class="pares">' + pareja('Fecha', M.fecha(s.fecha)) + pareja('Vale hasta', vence) + pareja('Lugar', sv.lugar) + pareja('Cuándo', sv.cuando) + '</dl></div>';
    var cuerpo = '<h2 class="titulo-doc"' + (sv.titulo ? '' : ' style="color:var(--t-tenue)"') + '>' + esc(sv.titulo || 'Nombre del servicio') + '</h2>' + (sv.descripcion ? '<p class="bajada">' + M.escBr(sv.descripcion) + '</p>' : '');
    var rs = renglonesCliente();
    var tabla = '<table class="tabla"><thead><tr><th>Concepto</th><th class="num">Cant.</th><th class="num">Precio unitario</th><th class="num">Importe</th></tr></thead><tbody>' +
      rs.map(function (r) {
        var pu = r.pu == null ? r.imp : r.pu;
        return '<tr><td class="concepto"><b>' + esc(r.c) + '</b>' + (r.d ? '<small>' + esc(r.d) + '</small>' : '') + '</td>' +
          '<td class="num">' + M.cifra(r.q) + (r.unidad ? ' h' : '') + '</td><td class="num">' + M.pesos(pu) + '</td><td class="num">' + M.pesos(r.imp) + '</td></tr>';
      }).join('') + '</tbody></table>';
    var totales = '<div class="totales">' +
      (s.iva ? '<div class="fila"><span>Subtotal</span><b>' + M.pesos(c.precio) + '</b></div><div class="fila"><span>IVA 16%</span><b>' + M.pesos(c.iva) + '</b></div>' : '') +
      '<div class="fila gran"><span>Total</span><b>' + M.pesos(c.total) + '</b></div>' +
      '<div class="letra">Son: ' + M.conLetra(c.total) + '</div></div>';
    var inc = lineas(s.incluye), noinc = lineas(s.noIncluye);
    var listas = '';
    if (inc.length || noinc.length) {
      var bl = function (t, l) { return l.length ? '<div class="seccion"><h3>' + t + '</h3><ul>' + l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : ''; };
      listas = '<div class="' + (inc.length && noinc.length ? 'dos-columnas' : '') + '">' + bl('Incluye', inc) + bl('No incluye', noinc) + '</div>';
    }
    var cond = [];
    if (vence) cond.push('Esta cotización vale hasta el ' + vence + '.');
    var ant = n(s.anticipo);
    if (ant >= 100) cond.push('El pago completo se hace por adelantado, para apartar la fecha.');
    else if (ant > 0) cond.push('Para apartar la fecha se pide un anticipo del ' + ant + '% (' + M.pesos(c.anticipo) + '); el resto se paga al terminar.');
    else cond.push('El pago se hace al terminar el servicio.');
    if (s.formaPago) cond.push('Forma de pago: ' + s.formaPago.replace(/^./, function (x) { return x.toLowerCase(); }) + '.');
    lineas(s.notas).forEach(function (x) { cond.push(/[.!?]$/.test(x) ? x : x + '.'); });
    cond.push(s.iva ? 'Precios en pesos mexicanos. El total incluye el IVA.' : 'Precios en pesos mexicanos.');
    var condiciones = '<div class="seccion"><h3>Condiciones</h3><ul>' + cond.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (m.pago ? '<p style="margin-top:4pt"><b style="font-weight:500;color:var(--t-tinta)">Datos para el pago:</b> ' + M.escBr(m.pago) + '</p>' : '') + '</div>';
    var cierre = '<div class="cierre">' + condiciones + '<div class="firmas">' + M.firma(m, 'Atentamente') + '</div></div>';
    return M.hoja({ acento: m.color, pieIzq: M.pieMembrete(m), pieDer: 'Cotización No. ' + esc(s.folio || '') },
      M.encabezado(m, der) + datos + cuerpo + tabla + totales + listas + cierre);
  }
  function hojaRecibo() {
    var m = memb, sv = s.servicio, r = s.recibo;
    var monto = n(r.monto), anteriores = n(r.anteriores), saldo = r2(c.total - anteriores - monto);
    var der = '<div class="tipo">Recibo</div><div class="folio">No. <b>' + esc(r.folio || 's/n') + '</b></div>';
    var datos = '<div class="datos">' + bloqueCliente('Cliente') + '<dl class="pares">' + pareja('Fecha del pago', M.fecha(r.fecha)) + pareja('Forma de pago', r.forma) + pareja('Referencia', r.referencia) + pareja('Cotización', s.folio ? 'No. ' + s.folio : '') + '</dl></div>';
    var que = { anticipo: 'anticipo' + (n(s.anticipo) && n(s.anticipo) < 100 ? ' del ' + n(s.anticipo) + '%' : ''), final: 'pago final', total: 'pago total', otro: 'pago parcial' }[r.concepto] || 'pago';
    var recibi = '<div class="recibi"><p class="frase">Recibí de <b>' + esc(s.cliente.nombre || 'nombre del cliente') + '</b> la cantidad de</p>' +
      '<div class="monto-recibo">' + M.pesos(monto) + '</div><div class="letra-recibo">(' + M.conLetra(monto) + ')</div>' +
      '<p class="frase">por concepto de ' + esc(que) + ' del servicio <b>' + esc(sv.titulo || 'sin título') + '</b>.</p></div>';
    var lugar = (sv.lugar || sv.cuando) ? '<dl class="pares" style="margin-top:6pt">' + pareja('Lugar del servicio', sv.lugar) + pareja('Fecha del servicio', sv.cuando) + '</dl>' : '';
    var cuenta = '<div class="cuenta-recibo">' +
      '<div class="fila"><span>Importe total del servicio' + (s.iva ? ' (con IVA)' : '') + '</span><b>' + M.pesos(c.total) + '</b></div>' +
      (anteriores ? '<div class="fila"><span>Pagos anteriores</span><b>' + M.pesos(anteriores) + '</b></div>' : '') +
      '<div class="fila"><span>Este pago</span><b>' + M.pesos(monto) + '</b></div>' +
      '<div class="fila fuerte"><span>' + (saldo <= 0.005 ? 'Pagado por completo' : 'Saldo pendiente') + '</span><b>' + M.pesos(Math.max(0, saldo)) + '</b></div></div>';
    var nota = r.notaFiscal ? '<p class="nota-fiscal">Este recibo comprueba un pago entre las partes y no sustituye a una factura (CFDI).</p>' : '<div></div>';
    var cierre = '<div class="cierre" style="margin-top:.45in">' + nota + '<div class="firmas">' + M.firma(m, 'Recibí') + '</div></div>';
    return M.hoja({ acento: m.color, pieIzq: M.pieMembrete(m), pieDer: 'Recibo No. ' + esc(r.folio || '') },
      M.encabezado(m, der) + datos + recibi + lugar + cuenta + cierre);
  }
  function pintarHojaYa() {
    $('#marco').innerHTML = s.tipoDoc === 'recibo' ? hojaRecibo() : hojaCotizacion();
    M.ajustarHoja();
  }
  var pintarHoja = M.debounce(pintarHojaYa, 40);

  /* ---------- El recibo: cuánto se recibe ---------- */
  function montoSugerido() {
    var r = s.recibo;
    if (r.concepto === 'anticipo') return n(s.anticipo) > 0 ? c.anticipo : c.total;
    if (r.concepto === 'final') return r2(c.total - n(r.anteriores));
    if (r.concepto === 'total') return c.total;
    return n(r.monto);
  }
  function aplicarConcepto() {
    var r = s.recibo;
    if (r.concepto === 'final') { if (!n(r.anteriores)) r.anteriores = c.anticipo; }
    else if (r.concepto === 'anticipo' || r.concepto === 'total') r.anteriores = '';
    if (r.concepto !== 'otro') { r.monto = montoSugerido(); r.manual = false; }
    M.llenar($('#paso-recibo'), s);
  }
  function asegurarRecibo() {
    if (!s.recibo.folio) s.recibo.folio = String((M.leer('folio:REC', 0) || 0) + 1).padStart(3, '0');
    if (!s.recibo.fecha) s.recibo.fecha = M.hoyISO();
    if (!s.recibo.manual) s.recibo.monto = montoSugerido();
  }
  function mostrarPasoRecibo() {
    $('#paso-recibo').classList.toggle('oculto', s.tipoDoc !== 'recibo');
  }

  /* ---------- Guardar ---------- */
  var guardarLuego = M.debounce(function () {
    if (!s.tocado) return;
    if (A.guardar(s)) {
      var f = parseInt(s.folio, 10); if (f > (M.leer('folio:COT', 0) || 0)) M.guardar('folio:COT', f);
      var rf = parseInt(s.recibo.folio, 10); if (s.tipoDoc === 'recibo' && rf > (M.leer('folio:REC', 0) || 0)) M.guardar('folio:REC', rf);
      var d = new Date(); $('#estado').textContent = 'Guardado ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
  }, 350);

  function actualizar() { c = calcular(s); if (s.tipoDoc === 'recibo' && !s.recibo.manual) { s.recibo.monto = montoSugerido(); var mi = $('#r-monto'); if (mi && document.activeElement !== mi) mi.value = s.recibo.monto; } pintarSobre(); pintarHoja(); }
  function abrir(d, mensaje, guardarYa) {
    if (s && s.tocado) A.guardar(s);
    s = completar(d);
    pintarListas(); M.llenar(banco, s); mostrarPasoRecibo();
    if (s.tipoDoc === 'recibo') { c = calcular(s); asegurarRecibo(); M.llenar(banco, s); }
    actualizar();
    $('#estado').textContent = s.tocado ? 'Guardado' : 'Se guarda sola al escribir';
    if (s.tocado) A.marcarActual(s.id);
    if (guardarYa) { s.tocado = true; guardarLuego(); }
    if (mensaje) M.aviso(mensaje);
  }

  /* ---------- Cambios en el formulario ---------- */
  M.escuchar(banco, function () { return s; }, function (k, el) {
    s.tocado = true;
    if (k === 'tarifa') M.guardar('tarifa', s.tarifa);
    if (k === 'tipoDoc') { mostrarPasoRecibo(); if (s.tipoDoc === 'recibo') { c = calcular(s); asegurarRecibo(); M.llenar($('#paso-recibo'), s); } }
    if (k === 'recibo.concepto') { c = calcular(s); aplicarConcepto(); }
    if (k === 'recibo.monto') { s.recibo.manual = true; if (s.recibo.concepto !== 'otro' && Math.abs(n(s.recibo.monto) - montoSugerido()) > 0.005) { s.recibo.concepto = 'otro'; M.llenar($('#paso-recibo'), s); } }
    if (k === 'recibo.anteriores' && s.recibo.concepto === 'final') { s.recibo.manual = false; }
    actualizar(); guardarLuego();
  });

  banco.addEventListener('click', function (e) {
    var q = e.target.closest('[data-quitar]');
    if (q) { s[q.dataset.quitar].splice(+q.dataset.i, 1); s.tocado = true; pintarLista(q.dataset.quitar); actualizar(); guardarLuego(); return; }
    var sug = e.target.closest('.sugerencias button');
    if (sug) {
      var caja = sug.parentNode;
      if (caja.dataset.lista) {
        var nombre = caja.dataset.lista, t = sug.textContent;
        s[nombre].push(nombre === 'materiales' ? { c: t, q: 1, p: '' } : { c: t, m: '' });
        s.tocado = true; pintarLista(nombre); actualizar(); guardarLuego();
        var ins = M.$$('#lista-' + nombre + ' .renglon'); var ult = ins[ins.length - 1];
        if (ult) { var f = ult.querySelector(nombre === 'materiales' ? '.q' : '.monto'); if (f) f.focus(); }
      } else if (caja.dataset.texto) {
        var k = caja.dataset.texto, actual = lineas(s[k]);
        if (actual.indexOf(sug.textContent) < 0) actual.push(sug.textContent);
        s[k] = actual.join('\n'); s.tocado = true; M.llenar(banco, s); actualizar(); guardarLuego();
      }
    }
  });
  M.$$('.sugerencias[data-lista]').forEach(function (caja) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Otro'; b.dataset.otro = '1';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var nombre = caja.dataset.lista;
      s[nombre].push(nombre === 'materiales' ? { c: '', q: 1, p: '' } : { c: '', m: '' });
      s.tocado = true; pintarLista(nombre); actualizar(); guardarLuego();
      var ins = M.$$('#lista-' + nombre + ' .renglon'); var ult = ins[ins.length - 1]; if (ult) ult.querySelector('input').focus();
    });
    caja.appendChild(b);
  });

  $('#abrir-gas').onclick = function () { var g = $('#gasolina'); g.classList.toggle('oculto'); if (!g.classList.contains('oculto')) $('#g-km').focus(); };
  $('#gas-agregar').onclick = function () {
    var g = s.gas, litros = n(g.km) / (n(g.rend) || 1), costo = r2(litros * n(g.precio));
    if (!(costo > 0)) return;
    s.viaticos.push({ c: 'Gasolina (' + M.cifra(n(g.km)) + ' km)', m: costo });
    s.tocado = true; pintarLista('viaticos'); actualizar(); guardarLuego();
    $('#gasolina').classList.add('oculto');
    M.aviso('Gasolina agregada a los viáticos.');
  };

  /* ---------- Acciones ---------- */
  function describir(d) {
    var x = calcular(completar(d));
    return { t: (d.servicio && d.servicio.titulo) || 'Cotización sin título', v: M.pesos(x.total), d: [(d.cliente && d.cliente.nombre) || 'sin cliente', 'No. ' + (d.folio || ''), M.fechaCorta(d.fecha)].join(', ') };
  }
  function verDocs() {
    M.listaDocs({
      titulo: 'Mis cotizaciones', archivero: A, nuevoTexto: 'Nueva cotización', describir: describir,
      extra: function (doc) { return '<button type="button" class="btn-texto" data-a="recibo" data-id="' + doc.id + '">Hacer recibo</button>'; },
      alExtra: function (a, doc) {
        if (a !== 'recibo' || !doc) return;
        abrir(doc); s.tipoDoc = 'recibo'; s.tocado = true; mostrarPasoRecibo(); c = calcular(s); asegurarRecibo();
        M.llenar(banco, s); actualizar(); guardarLuego();
        M.aviso('Recibo listo con los datos de la cotización. Revisa qué te pagaron.');
      },
      alNuevo: function () { abrir(nuevo(), 'Cotización nueva. Tu membrete ya está puesto.'); },
      alAbrirArchivo: abrirArchivo, alEjemplo: ejemplo,
      alAbrir: function (d) { abrir(d); },
      alDuplicar: function (d) {
        var x = completar(d); x.id = M.uid(); x.folio = String((M.leer('folio:COT', 0) || 0) + 1).padStart(3, '0'); x.fecha = M.hoyISO();
        x.tipoDoc = 'cotizacion'; x.recibo = nuevo().recibo; abrir(x, 'Copia lista, con número nuevo.', true);
      },
      alBorrar: function (id) { if (s.id === id) abrir(nuevo()); }
    });
  }
  function abrirArchivo() {
    M.abrirArchivo('cobrar', function (datos) {
      var d = completar(datos); d.id = M.uid(); d.tocado = true;
      memb = M.membrete.leer(); vistaMembrete.recargar(); abrir(d, 'Se abrió «' + ((d.servicio && d.servicio.titulo) || 'la cotización') + '».', true);
    });
  }
  function ejemplo() {
    var d = nuevo();
    d.tocado = true;
    d.cliente = { nombre: 'Comité de productoras de traspatio', contacto: 'Presidenta del comité', telefono: '', correo: '' };
    d.servicio = {
      titulo: 'Taller de bocashi y caldo sulfocálcico',
      descripcion: 'Dos sesiones prácticas de cuatro horas en el traspatio del grupo: por qué funcionan los abonos fermentados, preparación de una pila de bocashi de 500 kg y de 20 litros de caldo sulfocálcico, y una visita de seguimiento a los quince días.',
      lugar: 'Concá, Arroyo Seco', cuando: '14 y 15 de enero de 2027', participantes: '20 personas', duracion: '8 horas en dos sesiones'
    };
    d.horas = { preparar: 6, traslado: 4, hacer: 8, entregar: 3 };
    d.trabajan = 1; d.tarifa = n(s && s.tarifa) || 250;
    d.viaticos = [{ c: 'Gasolina (90 km)', m: 260 }, { c: 'Comidas de los dos días', m: 300 }];
    d.materiales = [
      { c: 'Melaza (litro)', q: 10, p: 28 }, { c: 'Gallinaza (costal)', q: 6, p: 60 }, { c: 'Azufre (kilo)', q: 5, p: 45 },
      { c: 'Cal viva (kilo)', q: 3, p: 12 }, { c: 'Copias del manual', q: 20, p: 15 }, { c: 'Constancias', q: 20, p: 10 }
    ];
    d.otros = []; d.imprevistos = 5; d.redondeo = 50; d.vista = 'gastos';
    d.incluye = 'Materiales e insumos para las dos prácticas\nManual impreso para cada participante\nConstancia de participación\nVisita de seguimiento a los quince días';
    d.noIncluye = 'El espacio y el agua para la práctica\nLa comida de las personas participantes';
    d.notas = 'Si el taller se cancela con menos de cinco días, se cobra la preparación.';
    abrir(d, 'Se abrió un ejemplo. Cámbialo por tus datos o empieza una nueva.', true);
  }

  $('#ver-docs').onclick = verDocs;
  $('#nueva').onclick = function () { abrir(nuevo(), 'Cotización nueva. Tu membrete ya está puesto.'); };
  $('#ejemplo').onclick = ejemplo;
  $('#pdf').onclick = M.imprimir;
  $('#pdf-movil').onclick = M.imprimir;
  $('#descargar').onclick = function () {
    s.tocado = true; guardarLuego();
    var base = (s.tipoDoc === 'recibo' ? 'recibo-' + (s.recibo.folio || '') : 'cotizacion-' + (s.folio || '')) + '-' + (s.cliente.nombre || s.servicio.titulo || '');
    M.descargarArchivo('cobrar', base, s);
  };
  M.alImprimir(function () {
    return (s.tipoDoc === 'recibo' ? 'Recibo ' + (s.recibo.folio || '') : 'Cotización ' + (s.folio || '')) + (s.cliente.nombre ? ' ' + s.cliente.nombre : '');
  }, pintarHojaYa);
  if (M.enNavegadorPrestado) $('#pista').textContent = 'Si al apretar «Guardar en PDF» no pasa nada, abre esta página en Chrome o en Safari: los navegadores que vienen dentro de WhatsApp o Facebook no saben imprimir.';

  /* ---------- Arranque ---------- */
  memb = M.membrete.leer();
  var detMembrete = $('#paso-membrete');
  var vistaMembrete = M.montarMembrete($('#membrete'), function (m) {
    memb = m; $('#res-membrete').textContent = m.nombre || 'Falta tu nombre'; pintarHoja();
  });
  $('#res-membrete').textContent = memb.nombre || 'Falta tu nombre';
  if (!memb.nombre) detMembrete.open = true;
  var id = A.idActual(), guardado = id && A.obtener(id);
  abrir(guardado || nuevo());
  M.montarVista();
  window.addEventListener('pagehide', function () { if (s && s.tocado) A.guardar(s); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && s && s.tocado) A.guardar(s); });
  window.addEventListener('pageshow', function () { M.ajustarHoja(); });
})();
