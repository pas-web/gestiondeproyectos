/* Cotizar y cobrar: la cuenta en el sobre, la cotización y el recibo en la hoja.
   Se llena una pregunta a la vez (M.guia); al final sale en PDF, Word, imagen y archivo. */
(function () {
  'use strict';
  var $ = M.$, n = M.num, esc = M.esc;
  var A = new M.Archivero('cobrar');
  var banco = $('.banco');
  var s, c, memb, guia, vistaMembrete;
  var COLOR_TRABAJO = '#00899e', COLOR_GASTOS = '#c46a1f', COLOR_IMPREVISTOS = '#7b52ae';
  var PASOS_RECIBO = ['recibo-que', 'recibo-datos', 'recibo-entregar'];

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
      recibo: { activo: false, folio: '', fecha: M.hoyISO(), concepto: 'anticipo', monto: '', anteriores: '', forma: 'Transferencia', referencia: '', notaFiscal: true, manual: false },
      guia: { paso: '', visto: {} }
    };
  }
  function mezclar(base, x) {
    for (var k in x) {
      if (x[k] && typeof x[k] === 'object' && !Array.isArray(x[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) mezclar(base[k], x[k]);
      else base[k] = x[k];
    }
    return base;
  }
  function completar(d) {
    var x = mezclar(nuevo(), M.copia(d || {}));
    if (x.tipoDoc === 'recibo') x.recibo.activo = true;
    return x;
  }

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
  function lineas(t) { return String(t || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function vence() { return s.fecha && n(s.vigencia) ? M.fecha(M.sumarDias(s.fecha, n(s.vigencia))) : ''; }
  /* Las condiciones, iguales en la hoja, en Word y en la imagen */
  function condiciones() {
    var cond = [], v = vence();
    if (v) cond.push('Esta cotización vale hasta el ' + v + '.');
    var ant = n(s.anticipo);
    if (ant >= 100) cond.push('El pago completo se hace por adelantado, para apartar la fecha.');
    else if (ant > 0) cond.push('Para apartar la fecha se pide un anticipo del ' + ant + '% (' + M.pesos(c.anticipo) + '); el resto se paga al terminar.');
    else cond.push('El pago se hace al terminar el servicio.');
    if (s.formaPago) cond.push('Forma de pago: ' + s.formaPago.replace(/^./, function (x) { return x.toLowerCase(); }) + '.');
    lineas(s.notas).forEach(function (x) { cond.push(/[.!?]$/.test(x) ? x : x + '.'); });
    cond.push(s.iva ? 'Precios en pesos mexicanos. El total incluye el IVA.' : 'Precios en pesos mexicanos.');
    return cond;
  }
  function queRecibo() {
    return { anticipo: 'anticipo' + (n(s.anticipo) && n(s.anticipo) < 100 ? ' del ' + n(s.anticipo) + '%' : ''), final: 'pago final', total: 'pago total', otro: 'pago parcial' }[s.recibo.concepto] || 'pago';
  }

  /* ---------- El sobre en pantalla ---------- */
  function pintarSobre() {
    $('#txt-horas').textContent = c.personas > 1 ? 'Horas en total, por ' + c.personas + ' personas' : 'Horas en total';
    $('#sub-horas').textContent = M.cifra(c.horasTodas) + ' h';
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
    if (c.horas && n(s.horas.hacer) && c.invisibles > 0 && n(s.tarifa)) {
      h += '<p class="nota">Horas que nadie ve: ' + M.cifra(c.invisibles) + ' de ' + M.cifra(c.horasTodas) + '. Si cobraras solo las de hacer el trabajo, cobrarías ' + M.pesos(c.soloHacer) + ' y las otras ' + M.cifra(c.invisibles) + ' horas las regalarías.</p>';
    }
    if (c.precio > 0) h += '<p class="nota">Lo que te queda a ti: ' + M.pesos(r2(c.honor + c.ajuste)) + (c.imp ? ', más los imprevistos (' + M.pesos(c.imp) + ') si nada sale mal.' : '.') + '</p>';
    $('#cuenta').innerHTML = h;
  }
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
  function bloqueCliente(rot) {
    var cl = s.cliente;
    return '<div data-parte="cliente"><div class="rot">' + (rot || 'Para') + '</div><div class="dato-grande"' + (cl.nombre ? '' : ' style="color:var(--t-tenue)"') + '>' + esc(cl.nombre || 'Nombre del cliente') + '</div>' +
      (cl.contacto ? '<div class="dato">Atención: ' + esc(cl.contacto) + '</div>' : '') +
      ([cl.telefono, cl.correo].filter(Boolean).length ? '<div class="dato">' + esc([cl.telefono, cl.correo].filter(Boolean).join(', ')) + '</div>' : '') + '</div>';
  }
  function hojaCotizacion() {
    var m = memb, sv = s.servicio;
    var der = '<div class="tipo">Cotización</div><div class="folio">No. <b>' + esc(s.folio || 's/n') + '</b></div>';
    var v = vence();
    var datos = '<div class="datos">' + bloqueCliente() +
      '<dl class="pares" data-parte="datos">' + pareja('Fecha', M.fecha(s.fecha)) + pareja('Vale hasta', v) + pareja('Lugar', sv.lugar) + pareja('Cuándo', sv.cuando) + '</dl></div>';
    var cuerpo = '<div data-parte="servicio"><h2 class="titulo-doc"' + (sv.titulo ? '' : ' style="color:var(--t-tenue)"') + '>' + esc(sv.titulo || 'Nombre del servicio') + '</h2>' +
      (sv.descripcion ? '<p class="bajada">' + M.escBr(sv.descripcion) + '</p>' : '<p class="bajada hueco" data-parte="servicio">Aquí va en qué consiste.</p>') + '</div>';
    var rs = renglonesCliente();
    var tabla = '<table class="tabla" data-parte="tabla"><thead><tr><th>Concepto</th><th class="num">Cant.</th><th class="num">Precio unitario</th><th class="num">Importe</th></tr></thead><tbody>' +
      rs.map(function (r) {
        var pu = r.pu == null ? r.imp : r.pu;
        return '<tr><td class="concepto"><b>' + esc(r.c) + '</b>' + (r.d ? '<small>' + esc(r.d) + '</small>' : '') + '</td>' +
          '<td class="num">' + M.cifra(r.q) + (r.unidad ? ' h' : '') + '</td><td class="num">' + M.pesos(pu) + '</td><td class="num">' + M.pesos(r.imp) + '</td></tr>';
      }).join('') + '</tbody></table>';
    var totales = '<div class="totales" data-parte="totales">' +
      (s.iva ? '<div class="fila"><span>Subtotal</span><b>' + M.pesos(c.precio) + '</b></div><div class="fila"><span>IVA 16%</span><b>' + M.pesos(c.iva) + '</b></div>' : '') +
      '<div class="fila gran"><span>Total</span><b>' + M.pesos(c.total) + '</b></div>' +
      '<div class="letra">Son: ' + M.conLetra(c.total) + '</div></div>';
    var inc = lineas(s.incluye), noinc = lineas(s.noIncluye);
    var listas = '<div class="seccion hueco" data-parte="incluye">Aquí va lo que incluye el servicio y lo que no.</div>';
    if (inc.length || noinc.length) {
      var bl = function (t, l) { return l.length ? '<div class="seccion"><h3>' + t + '</h3><ul>' + l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : ''; };
      listas = '<div data-parte="incluye" class="' + (inc.length && noinc.length ? 'dos-columnas' : '') + '">' + bl('Incluye', inc) + bl('No incluye', noinc) + '</div>';
    }
    var condicionesH = '<div class="seccion" data-parte="condiciones"><h3>Condiciones</h3><ul>' + condiciones().map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (m.pago ? '<p style="margin-top:4pt"><b style="font-weight:500;color:var(--t-tinta)">Datos para el pago:</b> ' + M.escBr(m.pago) + '</p>' : '') + '</div>';
    var cierre = '<div class="cierre">' + condicionesH + '<div class="firmas">' + M.firma(m, 'Atentamente') + '</div></div>';
    return M.hoja({ acento: m.color, pieIzq: M.pieMembrete(m), pieDer: 'Cotización No. ' + esc(s.folio || '') },
      M.encabezado(m, der) + datos + cuerpo + tabla + totales + listas + cierre);
  }
  function hojaRecibo() {
    var m = memb, sv = s.servicio, r = s.recibo;
    var monto = n(r.monto), anteriores = n(r.anteriores), saldo = r2(c.total - anteriores - monto);
    var der = '<div class="tipo">Recibo</div><div class="folio">No. <b>' + esc(r.folio || 's/n') + '</b></div>';
    var datos = '<div class="datos">' + bloqueCliente('Cliente') + '<dl class="pares" data-parte="datos">' + pareja('Fecha del pago', M.fecha(r.fecha)) + pareja('Forma de pago', r.forma) + pareja('Referencia', r.referencia) + pareja('Cotización', s.folio ? 'No. ' + s.folio : '') + '</dl></div>';
    var recibi = '<div class="recibi" data-parte="recibi"><p class="frase">Recibí de <b>' + esc(s.cliente.nombre || 'nombre del cliente') + '</b> la cantidad de</p>' +
      '<div class="monto-recibo">' + M.pesos(monto) + '</div><div class="letra-recibo">(' + M.conLetra(monto) + ')</div>' +
      '<p class="frase">por concepto de ' + esc(queRecibo()) + ' del servicio <b>' + esc(sv.titulo || 'sin título') + '</b>.</p></div>';
    var lugar = (sv.lugar || sv.cuando) ? '<dl class="pares" style="margin-top:6pt">' + pareja('Lugar del servicio', sv.lugar) + pareja('Fecha del servicio', sv.cuando) + '</dl>' : '';
    var cuenta = '<div class="cuenta-recibo" data-parte="cuenta-recibo">' +
      '<div class="fila"><span>Importe total del servicio' + (s.iva ? ' (con IVA)' : '') + '</span><b>' + M.pesos(c.total) + '</b></div>' +
      (anteriores ? '<div class="fila"><span>Pagos anteriores</span><b>' + M.pesos(anteriores) + '</b></div>' : '') +
      '<div class="fila"><span>Este pago</span><b>' + M.pesos(monto) + '</b></div>' +
      '<div class="fila fuerte"><span>' + (saldo <= 0.005 ? 'Pagado por completo' : 'Saldo pendiente') + '</span><b>' + M.pesos(Math.max(0, saldo)) + '</b></div></div>';
    var nota = r.notaFiscal ? '<p class="nota-fiscal" data-parte="nota">Este recibo comprueba un pago entre las partes y no sustituye a una factura (CFDI).</p>' : '<div data-parte="nota"></div>';
    var cierre = '<div class="cierre" style="margin-top:.45in">' + nota + '<div class="firmas">' + M.firma(m, 'Recibí') + '</div></div>';
    return M.hoja({ acento: m.color, pieIzq: M.pieMembrete(m), pieDer: 'Recibo No. ' + esc(r.folio || '') },
      M.encabezado(m, der) + datos + recibi + lugar + cuenta + cierre);
  }
  function pintarHojaYa() {
    $('#marco').innerHTML = s.tipoDoc === 'recibo' ? hojaRecibo() : hojaCotizacion();
    $('#rot-hoja').textContent = s.tipoDoc === 'recibo' ? 'Así va tu recibo' : 'Así va tu cotización';
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
    M.llenar(banco, s);
  }
  function asegurarRecibo() {
    if (!s.recibo.folio) s.recibo.folio = String((M.leer('folio:REC', 0) || 0) + 1).padStart(3, '0');
    if (!s.recibo.fecha) s.recibo.fecha = M.hoyISO();
    if (!s.recibo.manual) s.recibo.monto = montoSugerido();
  }
  function ponerTipo(t) {
    if (s.tipoDoc === t) return;
    s.tipoDoc = t; c = calcular(s);
    if (t === 'recibo') { s.recibo.activo = true; asegurarRecibo(); }
    M.llenar(banco, s); pintarHojaYa();
  }
  function hacerRecibo() {
    s.tocado = true; s.recibo.activo = true; ponerTipo('recibo'); c = calcular(s); asegurarRecibo(); M.llenar(banco, s); actualizar(); guardarLuego();
    guia.refrescar(); guia.ir('recibo-que');
  }

  /* ---------- Guardar ---------- */
  var guardarLuego = M.debounce(function () {
    if (!s.tocado) return;
    if (A.guardar(s)) {
      var f = parseInt(s.folio, 10); if (f > (M.leer('folio:COT', 0) || 0)) M.guardar('folio:COT', f);
      var rf = parseInt(s.recibo.folio, 10); if (s.recibo.activo && rf > (M.leer('folio:REC', 0) || 0)) M.guardar('folio:REC', rf);
      var d = new Date(); $('#estado').textContent = 'Guardado ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
  }, 350);

  function actualizar() { c = calcular(s); if (s.tipoDoc === 'recibo' && !s.recibo.manual) { s.recibo.monto = montoSugerido(); var mi = $('#r-monto'); if (mi && document.activeElement !== mi) mi.value = s.recibo.monto; } pintarSobre(); pintarHoja(); }
  function abrir(d, mensaje, guardarYa, paso) {
    if (s && s.tocado) A.guardar(s);
    s = completar(d);
    pintarListas(); M.llenar(banco, s);
    c = calcular(s);
    if (s.recibo.activo) { asegurarRecibo(); M.llenar(banco, s); }
    actualizar(); pintarHojaYa();
    $('#estado').textContent = s.tocado ? 'Guardado' : 'Se guarda sola al escribir';
    if (s.tocado) A.marcarActual(s.id);
    if (guardarYa) { s.tocado = true; guardarLuego(); }
    guia.abrir({ paso: paso, primero: memb.nombre ? 'cliente' : 'mb-nombre', sinFoco: true });
    if (mensaje) M.aviso(mensaje);
  }

  /* ---------- Cambios en el formulario ---------- */
  M.escuchar(banco, function () { return s; }, function (k) {
    s.tocado = true;
    if (k === 'tarifa') M.guardar('tarifa', s.tarifa);
    if (k === 'tipoDoc') {
      var t = s.tipoDoc; s.tipoDoc = t === 'recibo' ? 'cotizacion' : 'recibo';
      if (t === 'recibo') hacerRecibo(); else { ponerTipo('cotizacion'); guia.ir('entregar'); }
      return;
    }
    if (k === 'recibo.concepto') { c = calcular(s); aplicarConcepto(); }
    if (k === 'recibo.monto') { s.recibo.manual = true; if (s.recibo.concepto !== 'otro' && Math.abs(n(s.recibo.monto) - montoSugerido()) > 0.005) { s.recibo.concepto = 'otro'; M.llenar(banco, s); } }
    if (k === 'recibo.anteriores' && s.recibo.concepto === 'final') { s.recibo.manual = false; }
    actualizar(); guardarLuego();
  });

  banco.addEventListener('click', function (e) {
    var q = e.target.closest('[data-quitar]');
    if (q) { s[q.dataset.quitar].splice(+q.dataset.i, 1); s.tocado = true; pintarLista(q.dataset.quitar); actualizar(); guardarLuego(); return; }
    var sug = e.target.closest('.sugerencias button');
    if (sug && sug.parentNode.dataset.lista && !sug.dataset.otro) {
      var nombre = sug.parentNode.dataset.lista, t = sug.textContent;
      s[nombre].push(nombre === 'materiales' ? { c: t, q: 1, p: '' } : { c: t, m: '' });
      s.tocado = true; pintarLista(nombre); actualizar(); guardarLuego();
      var ins = M.$$('#lista-' + nombre + ' .renglon'); var ult = ins[ins.length - 1];
      if (ult) { var f = ult.querySelector(nombre === 'materiales' ? '.q' : '.monto'); if (f) f.focus(); }
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

  /* ---------- Word ---------- */
  function nombreArchivo(ext) {
    var base = s.tipoDoc === 'recibo' ? 'recibo-' + (s.recibo.folio || '') : 'cotizacion-' + (s.folio || '');
    return M.slug(base + '-' + (s.cliente.nombre || s.servicio.titulo || '')) + '.' + ext;
  }
  function pieWord() { return [memb.nombre, memb.telefono, memb.correo].filter(Boolean).join('   ·   '); }
  function datosWord(d, izq, der) {
    var paresW = der.filter(function (x) { return x[1]; }).map(function (x) { return { c: [{ t: x[0] + '   ', tam: 9, color: '#7B898C' }, { t: x[1], tam: 9 }], f: { despues: 1.5 } }; });
    d.espacio(6);
    d.tabla({ anchos: [d.util * 0.56, d.util * 0.44], margenCelda: 0.02, filas: [[{ parrafos: izq }, { parrafos: paresW.length ? paresW : [{ c: '' }] }]] });
  }
  function clienteWord(rot) {
    var cl = s.cliente;
    var l = [{ c: [{ t: rot || 'Para', tam: 7.8, color: '#7B898C' }], f: { despues: 1 } }, { c: [{ t: cl.nombre || 'Nombre del cliente', tam: 12, color: cl.nombre ? '#1D2A2E' : '#7B898C' }], f: { despues: 1 } }];
    if (cl.contacto) l.push({ c: [{ t: 'Atención: ' + cl.contacto, tam: 9.5, color: '#4B5A5E' }] });
    var tc = [cl.telefono, cl.correo].filter(Boolean).join(', ');
    if (tc) l.push({ c: [{ t: tc, tam: 9.5, color: '#4B5A5E' }] });
    return l;
  }
  function firmaWord(d, que) {
    M.docxFirmas(d, [{ que: que, img: memb.firma, nombre: memb.firmaNombre || memb.nombre, cargo: memb.titulo }]);
  }
  function wordCotizacion() {
    var m = memb, sv = s.servicio;
    var d = M.docx({ acento: m.color, titulo: 'Cotización ' + (s.folio || ''), autor: m.nombre, pie: pieWord() });
    M.docxMembrete(d, m, { tipo: 'Cotización', folio: 'No. ' + (s.folio || 's/n') });
    datosWord(d, clienteWord(), [['Fecha', M.fecha(s.fecha)], ['Vale hasta', vence()], ['Lugar', sv.lugar], ['Cuándo', sv.cuando]]);
    d.p([{ t: sv.titulo || 'Nombre del servicio', tam: 13 }], { antes: 10, despues: 2, junto: true });
    if (sv.descripcion) d.p([{ t: sv.descripcion, tam: 9.5, color: '#4B5A5E' }], { despues: 6 });
    var rs = renglonesCliente();
    M.docxTablaDatos(d, [{ t: 'Concepto', ancho: d.util - 3.4 }, { t: 'Cant.', ancho: 0.7, alin: 'der' }, { t: 'Precio unitario', ancho: 1.35, alin: 'der' }, { t: 'Importe', ancho: 1.35, alin: 'der' }],
      rs.map(function (r) {
        var pu = r.pu == null ? r.imp : r.pu;
        return [{ parrafos: [{ c: [{ t: r.c, b: true }] }].concat(r.d ? [{ c: [{ t: r.d, tam: 8.4, color: '#4B5A5E' }] }] : []) }, M.cifra(r.q) + (r.unidad ? ' h' : ''), M.pesos(pu), M.pesos(r.imp)];
      }));
    var ft = [];
    if (s.iva) { ft.push([{ t: 'Subtotal' }, { t: M.pesos(c.precio), alin: 'der' }]); ft.push([{ t: 'IVA 16%' }, { t: M.pesos(c.iva), alin: 'der' }]); }
    ft.push([{ t: [{ t: 'Total', b: true, color: '#FFFFFF', tam: 12 }], fondo: m.color || '#0B3C49' }, { t: [{ t: M.pesos(c.total), b: true, color: '#FFFFFF', tam: 12 }], fondo: m.color || '#0B3C49', alin: 'der' }]);
    d.tabla({ anchos: [1.9, 1.4], alin: 'der', margenCelda: 0.09, margenV: 0.05, filas: ft, sinPie: true });
    d.p([{ t: 'Son: ' + M.conLetra(c.total), tam: 7.9, color: '#4B5A5E' }], { alin: 'der', antes: 3, despues: 8 });
    var inc = lineas(s.incluye), noinc = lineas(s.noIncluye);
    if (inc.length) { d.titulo('Incluye', { tam: 9.5, b: true, antes: 8 }); d.lista(inc, { tam: 9 }); }
    if (noinc.length) { d.titulo('No incluye', { tam: 9.5, b: true, antes: 8 }); d.lista(noinc, { tam: 9 }); }
    d.titulo('Condiciones', { tam: 9.5, b: true, antes: 10 });
    d.lista(condiciones(), { tam: 9 });
    if (m.pago) d.p([{ t: 'Datos para el pago: ', b: true, tam: 9 }, { t: m.pago, tam: 9, color: '#4B5A5E' }], { antes: 4 });
    firmaWord(d, 'Atentamente');
    return d;
  }
  function wordRecibo() {
    var m = memb, sv = s.servicio, r = s.recibo;
    var monto = n(r.monto), anteriores = n(r.anteriores), saldo = r2(c.total - anteriores - monto);
    var d = M.docx({ acento: m.color, titulo: 'Recibo ' + (r.folio || ''), autor: m.nombre, pie: pieWord() });
    M.docxMembrete(d, m, { tipo: 'Recibo', folio: 'No. ' + (r.folio || 's/n') });
    datosWord(d, clienteWord('Cliente'), [['Fecha del pago', M.fecha(r.fecha)], ['Forma de pago', r.forma], ['Referencia', r.referencia], ['Cotización', s.folio ? 'No. ' + s.folio : '']]);
    d.espacio(8);
    d.tabla({ anchos: [d.util], margenCelda: 0.22, margenV: 0.14, filas: [[{
      fondo: d.suave(0.09), bordes: { top: { c: d.suave(0.55), g: 0.75 }, bottom: { c: d.suave(0.55), g: 0.75 }, left: { c: d.suave(0.55), g: 0.75 }, right: { c: d.suave(0.55), g: 0.75 } },
      parrafos: [
        { c: [{ t: 'Recibí de ', tam: 11 }, { t: s.cliente.nombre || 'nombre del cliente', b: true, tam: 11 }, { t: ' la cantidad de', tam: 11 }], f: { despues: 4 } },
        { c: [{ t: M.pesos(monto), b: true, tam: 24, color: m.color || '#0B3C49' }], f: { despues: 2 } },
        { c: [{ t: '(' + M.conLetra(monto) + ')', tam: 8.6, color: '#4B5A5E' }], f: { despues: 6 } },
        { c: [{ t: 'por concepto de ' + queRecibo() + ' del servicio ', tam: 11 }, { t: sv.titulo || 'sin título', b: true, tam: 11 }, { t: '.', tam: 11 }] }
      ]
    }]] });
    if (sv.lugar || sv.cuando) d.p([{ t: [sv.lugar && 'Lugar del servicio: ' + sv.lugar, sv.cuando && 'Fecha del servicio: ' + sv.cuando].filter(Boolean).join('     '), tam: 9, color: '#4B5A5E' }], { antes: 6 });
    var ft = [[{ t: 'Importe total del servicio' + (s.iva ? ' (con IVA)' : '') }, { t: M.pesos(c.total), alin: 'der' }]];
    if (anteriores) ft.push([{ t: 'Pagos anteriores' }, { t: M.pesos(anteriores), alin: 'der' }]);
    ft.push([{ t: 'Este pago' }, { t: M.pesos(monto), alin: 'der' }]);
    ft.push([{ t: [{ t: saldo <= 0.005 ? 'Pagado por completo' : 'Saldo pendiente', b: true }], bordes: { bottom: { c: m.color || '#0B3C49', g: 1 } } }, { t: [{ t: M.pesos(Math.max(0, saldo)), b: true }], alin: 'der', bordes: { bottom: { c: m.color || '#0B3C49', g: 1 } } }]);
    d.espacio(6);
    d.tabla({ anchos: [2.4, 1.3], alin: 'der', tam: 9.4, margenCelda: 0.05, margenV: 0.04, bordesCelda: { bottom: { c: '#DCE2E3', g: 0.5 } }, filas: ft });
    if (r.notaFiscal) d.p([{ t: 'Este recibo comprueba un pago entre las partes y no sustituye a una factura (CFDI).', tam: 8, color: '#7B898C' }], { antes: 10 });
    firmaWord(d, 'Recibí');
    return d;
  }
  function bajarWord() {
    c = calcular(s);
    var d = s.tipoDoc === 'recibo' ? wordRecibo() : wordCotizacion();
    return d.descargar(nombreArchivo('docx')).then(function () { return 'Listo: el Word se descargó.'; });
  }

  /* ---------- La imagen para WhatsApp ---------- */
  var L = M.lienzo;
  function bandaImagen(g, m, W) {
    var col = m.color || '#0B3C49';
    g.fillStyle = col; g.fillRect(0, 0, W, 250);
    return L.logo(g, m, 72, 66, 118, true).then(function () {
      var y = L.texto(g, m.nombre || 'Tu nombre o el de tu negocio', 220, 74, { tam: 44, peso: 600, color: '#FFFFFF', ancho: W - 292, max: 2, interlinea: 1.12 });
      if (m.giro) L.texto(g, m.giro, 220, y + 6, { tam: 26, color: 'rgba(255,255,255,.82)', ancho: W - 292, max: 2 });
    });
  }
  function pieImagen(g, m, W, H) {
    L.linea(g, 72, H - 104, W - 72, H - 104, '#DCE2E3', 2);
    var izq = m.telefono ? 'Tel. ' + m.telefono : (m.lugar || ''), der = m.correo || (m.telefono ? m.lugar || '' : '');
    if (izq) L.texto(g, izq, 72, H - 82, { tam: 26, color: '#4B5A5E' });
    if (der) L.texto(g, der, W - 72, H - 82, { tam: 26, color: '#4B5A5E', alin: 'der' });
  }
  function imagenCotizacion() {
    var m = memb, sv = s.servicio, W = 1080, H = 1350, x = L.crear(W, H), g = x.g, col = m.color || '#0B3C49';
    return L.fuentes().then(function () { return bandaImagen(g, m, W); }).then(function () {
      L.texto(g, 'Cotización', 72, 296, { tam: 64, peso: 500, color: col });
      L.texto(g, 'No. ' + (s.folio || 's/n'), W - 72, 306, { tam: 28, color: '#4B5A5E', alin: 'der' });
      L.texto(g, M.fecha(s.fecha), W - 72, 344, { tam: 24, color: '#7B898C', alin: 'der' });
      var y = 412;
      L.texto(g, 'Para', 72, y, { tam: 24, color: '#7B898C' });
      y = L.texto(g, s.cliente.nombre || 'Nombre del cliente', 72, y + 32, { tam: 38, peso: 500, color: '#1D2A2E', ancho: W - 144, max: 2, interlinea: 1.15 });
      y = L.texto(g, sv.titulo || 'Nombre del servicio', 72, y + 26, { tam: 34, peso: 500, color: '#1D2A2E', ancho: W - 144, max: 2, interlinea: 1.18 });
      var extra = [sv.cuando, sv.lugar, sv.duracion].filter(Boolean).join(', ');
      if (extra) y = L.texto(g, extra, 72, y + 6, { tam: 25, color: '#4B5A5E', ancho: W - 144, max: 2 });
      y += 22; L.linea(g, 72, y, W - 72, y, col, 3); y += 18;
      var rs = renglonesCliente(), max = 4;
      rs.slice(0, max).forEach(function (r) {
        L.texto(g, r.c, 72, y, { tam: 27, color: '#1D2A2E', ancho: W - 144 - 230, max: 1 });
        L.texto(g, M.pesos(r.imp), W - 72, y, { tam: 27, peso: 500, color: '#1D2A2E', alin: 'der' });
        y += 44; L.linea(g, 72, y - 8, W - 72, y - 8, '#DCE2E3', 1.5);
      });
      if (rs.length > max) { L.texto(g, 'y ' + (rs.length - max) + ' conceptos más en la cotización completa', 72, y, { tam: 23, color: '#7B898C' }); y += 40; }
      if (s.iva) { L.texto(g, 'Incluye IVA de ' + M.pesos(c.iva), 72, y, { tam: 23, color: '#7B898C' }); y += 36; }
      y = Math.max(y + 20, 860);
      L.rect(g, 72, y, W - 144, 132, 16, col);
      L.texto(g, 'Total', 108, y + 44, { tam: 34, peso: 500, color: '#FFFFFF' });
      L.texto(g, M.pesos(c.total), W - 108, y + 30, { tam: 64, peso: 600, color: '#FFFFFF', alin: 'der' });
      y = L.texto(g, 'Son: ' + M.conLetra(c.total), W - 72, y + 146, { tam: 20, color: '#4B5A5E', alin: 'der' });
      var cond = [];
      if (vence()) cond.push('Vale hasta el ' + vence() + '.');
      var ant = n(s.anticipo);
      if (ant > 0 && ant < 100) cond.push('Anticipo del ' + ant + '% para apartar la fecha: ' + M.pesos(c.anticipo) + '.');
      else if (ant >= 100) cond.push('Se paga completo por adelantado.');
      y += 16;
      cond.forEach(function (t) { y = L.texto(g, t, 72, y, { tam: 25, color: '#1D2A2E', ancho: W - 144, max: 2 }) + 4; });
      pieImagen(g, m, W, H);
      return x.c;
    });
  }
  function imagenRecibo() {
    var m = memb, sv = s.servicio, r = s.recibo, W = 1080, H = 1350, x = L.crear(W, H), g = x.g, col = m.color || '#0B3C49';
    var monto = n(r.monto), anteriores = n(r.anteriores), saldo = r2(c.total - anteriores - monto);
    return L.fuentes().then(function () { return bandaImagen(g, m, W); }).then(function () {
      L.texto(g, 'Recibo', 72, 296, { tam: 64, peso: 500, color: col });
      L.texto(g, 'No. ' + (r.folio || 's/n'), W - 72, 306, { tam: 28, color: '#4B5A5E', alin: 'der' });
      L.texto(g, M.fecha(r.fecha), W - 72, 344, { tam: 24, color: '#7B898C', alin: 'der' });
      var f1 = { tam: 30, color: '#1D2A2E', ancho: W - 224, max: 2 }, f3 = { tam: 20, color: '#4B5A5E', ancho: W - 224, max: 2 }, f4 = { tam: 29, color: '#1D2A2E', ancho: W - 224, max: 3 };
      var t1 = 'Recibí de ' + (s.cliente.nombre || 'nombre del cliente') + ' la cantidad de', t4 = 'por concepto de ' + queRecibo() + ' del servicio ' + (sv.titulo || 'sin título') + '.';
      var altoCaja = 36 + L.alto(g, t1, f1) + 140 + L.alto(g, '(' + M.conLetra(monto) + ')', f3) + 18 + L.alto(g, t4, f4) + 40;
      L.rect(g, 72, 410, W - 144, altoCaja, 18, M.aclarar(col, 0.08), M.aclarar(col, 0.5), 2);
      var y = L.texto(g, t1, 112, 446, f1);
      L.texto(g, M.pesos(monto), 112, y + 14, { tam: 96, peso: 600, color: col });
      y = L.texto(g, '(' + M.conLetra(monto) + ')', 112, y + 140, f3);
      L.texto(g, t4, 112, y + 18, f4);
      y = 410 + altoCaja + 52;
      var filas = [['Importe total del servicio', M.pesos(c.total)]];
      if (anteriores) filas.push(['Pagos anteriores', M.pesos(anteriores)]);
      filas.push(['Este pago', M.pesos(monto)]);
      filas.push([saldo <= 0.005 ? 'Pagado por completo' : 'Saldo pendiente', M.pesos(Math.max(0, saldo))]);
      filas.forEach(function (f, i) {
        var fuerte = i === filas.length - 1;
        L.texto(g, f[0], 72, y, { tam: 27, peso: fuerte ? 600 : 400, color: '#1D2A2E' });
        L.texto(g, f[1], W - 72, y, { tam: 27, peso: fuerte ? 600 : 500, color: '#1D2A2E', alin: 'der' });
        y += 46; L.linea(g, 72, y - 8, W - 72, y - 8, fuerte ? col : '#DCE2E3', fuerte ? 3 : 1.5);
      });
      if (r.forma) L.texto(g, 'Pago en ' + r.forma.toLowerCase() + (r.referencia ? ', referencia ' + r.referencia : '') + '.', 72, y + 6, { tam: 23, color: '#7B898C', ancho: W - 144, max: 1 });
      pieImagen(g, m, W, H);
      return x.c;
    });
  }
  function bajarImagen() {
    c = calcular(s);
    var p = s.tipoDoc === 'recibo' ? imagenRecibo() : imagenCotizacion();
    return p.then(function (canvas) {
      return L.entregar(canvas, nombreArchivo('jpg'), s.tipoDoc === 'recibo' ? 'Recibo' : 'Cotización');
    }).then(function (r) { return r === 'compartida' ? 'Imagen compartida.' : r === 'cancelada' ? '' : 'Listo: la imagen se descargó.'; });
  }

  /* ---------- Entregar ---------- */
  function bajarArchivo() {
    s.tocado = true; guardarLuego();
    var base = (s.tipoDoc === 'recibo' ? 'recibo-' + (s.recibo.folio || '') : 'cotizacion-' + (s.folio || '')) + '-' + (s.cliente.nombre || s.servicio.titulo || '');
    M.descargarArchivo('cobrar', base, s);
  }
  function imprimir() { M.imprimir(); }
  var pistaPDF = M.enNavegadorPrestado ? 'Si no pasa nada, abre la página en Chrome o Safari: los navegadores de WhatsApp o Facebook no imprimen.' : 'En la ventana de imprimir, elige «Guardar como PDF».';
  function opcionesEntrega(que) {
    return [
      { ico: 'pdf', t: 'PDF', d: 'Para imprimirla o mandarla tal cual.', hacer: imprimir, principal: true },
      { ico: 'word', t: 'Word', d: 'Para cambiarle lo que quieras en Word o en Google Docs.', hacer: bajarWord },
      { ico: 'imagen', t: 'Imagen para WhatsApp', d: 'El ' + (que === 'recibo' ? 'recibo' : 'resumen de la cotización') + ' en una imagen, para mandarla desde el celular.', hacer: bajarImagen },
      { ico: 'archivo', t: 'Archivo de la mochila', d: 'Para abrirla en otro aparato o guardarla en tu Drive.', hacer: bajarArchivo }
    ];
  }

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
        abrir(doc); hacerRecibo();
        M.aviso('Recibo listo con los datos de la cotización. Revisa qué te pagaron.');
      },
      alNuevo: function () { abrir(nuevo(), 'Cotización nueva. Tu membrete ya está puesto.'); },
      alAbrirArchivo: abrirArchivo, alEjemplo: ejemplo,
      alAbrir: function (d) { abrir(d); },
      alDuplicar: function (d) {
        var x = completar(d); x.id = M.uid(); x.folio = String((M.leer('folio:COT', 0) || 0) + 1).padStart(3, '0'); x.fecha = M.hoyISO();
        x.tipoDoc = 'cotizacion'; x.recibo = nuevo().recibo; x.guia = { paso: 'cliente', visto: {} }; abrir(x, 'Copia lista, con número nuevo.', true);
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
    abrir(d, 'Un ejemplo hecho: recórrelo con «Siguiente» para ver cómo se armó, o empieza una nueva.', true, 'cliente');
  }

  $('#ver-docs').onclick = verDocs;
  $('#nueva').onclick = function () { abrir(nuevo(), 'Cotización nueva. Tu membrete ya está puesto.'); };
  $('#ejemplo').onclick = ejemplo;
  $('#pdf-movil').onclick = imprimir;
  $('#hacer-recibo').onclick = hacerRecibo;
  $('#otro-recibo').onclick = function () {
    var r = s.recibo;
    r.anteriores = r2(n(r.anteriores) + n(r.monto)); r.concepto = r.anteriores >= c.total ? 'otro' : 'final';
    r.folio = String(Math.max(parseInt(r.folio, 10) || 0, M.leer('folio:REC', 0) || 0) + 1).padStart(3, '0');
    r.fecha = M.hoyISO(); r.referencia = ''; r.manual = false;
    s.tocado = true; aplicarConcepto(); actualizar(); guardarLuego(); guia.ir('recibo-que');
    M.aviso('Recibo nuevo, con número ' + r.folio + '. Los pagos anteriores ya están sumados.');
  };
  M.alImprimir(function () {
    return (s.tipoDoc === 'recibo' ? 'Recibo ' + (s.recibo.folio || '') : 'Cotización ' + (s.folio || '')) + (s.cliente.nombre ? ' ' + s.cliente.nombre : '');
  }, pintarHojaYa);

  /* ---------- Arranque ---------- */
  memb = M.membrete.leer();
  $('#preguntas-membrete').outerHTML = M.preguntasMembrete();
  vistaMembrete = M.enlazarMembrete($('#guia'), function (m) { memb = m; pintarHoja(); });
  M.entregas($('#entregas-cot'), opcionesEntrega('cotizacion'));
  M.entregas($('#entregas-rec'), opcionesEntrega('recibo'));
  M.$$('#entregas-cot, #entregas-rec').forEach(function (el) { el.insertAdjacentHTML('afterend', '<p class="pista-impresion">Para el PDF: ' + pistaPDF.replace(/^./, function (x) { return x.toLowerCase(); }) + '</p>'); });
  guia = M.guia({
    raiz: $('#guia'), marco: $('#marco'), panel: $('.panel-hoja'), membrete: true,
    estado: function () { return s; }, guardar: function () { guardarLuego(); },
    si: { recibo: function () { return !!(s && s.recibo.activo); } },
    listo: {
      tarifa: function () { return n(s.tarifa) > 0; },
      horas: function () { return c && c.horas > 0; }
    },
    alCambiarPaso: function (id) {
      if (PASOS_RECIBO.indexOf(id) >= 0) ponerTipo('recibo');
      else if (!/^mb-/.test(id)) ponerTipo('cotizacion');
      if (id === 'entregar') guia.pintarFaltan($('#faltan-cot'));
    },
    alEntrar: { entregar: function () { guia.pintarFaltan($('#faltan-cot')); } }
  });
  var id = A.idActual(), guardado = id && A.obtener(id);
  abrir(guardado || nuevo());
  M.montarVista();
  window.addEventListener('pagehide', function () { if (s && s.tocado) A.guardar(s); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && s && s.tocado) A.guardar(s); });
  window.addEventListener('pageshow', function () { M.ajustarHoja(); });
  window.MOCHILA_PRUEBA = { estado: function () { return s; }, guia: function () { return guia; }, word: function () { c = calcular(s); return (s.tipoDoc === 'recibo' ? wordRecibo() : wordCotizacion()).blob(); }, imagen: function () { c = calcular(s); return s.tipoDoc === 'recibo' ? imagenRecibo() : imagenCotizacion(); } };
})();
