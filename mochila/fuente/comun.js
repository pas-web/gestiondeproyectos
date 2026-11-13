/* La mochila del gestor · piezas comunes
   Todo se guarda en el navegador de quien usa la página (localStorage, con el
   prefijo «mochila:»). Nada se manda a ningún servidor. */
(function () {
  'use strict';
  var M = window.M = {};
  var PRE = 'mochila:';

  /* ---------- Utilidades ---------- */
  M.$ = function (s, r) { return (r || document).querySelector(s); };
  M.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  M.esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  M.escBr = function (s) { return M.esc(s).replace(/\r?\n/g, '<br>'); };
  M.num = function (v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var s = String(v == null ? '' : v).replace(/[^\d.,-]/g, '').replace(/,/g, '');
    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  };
  M.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  M.copia = function (o) { return JSON.parse(JSON.stringify(o)); };
  M.debounce = function (fn, ms) {
    var t; return function () { var a = arguments, th = this; clearTimeout(t); t = setTimeout(function () { fn.apply(th, a); }, ms); };
  };
  M.slug = function (s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'documento';
  };

  var fmt2 = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmt0 = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
  M.pesos = function (n, sinCentavos) {
    n = M.num(n);
    var s = (sinCentavos ? fmt0 : fmt2).format(Math.abs(n));
    return (n < 0 ? '-$' : '$') + s;
  };
  M.cifra = function (n, dec) {
    n = M.num(n);
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: dec == null ? 2 : dec }).format(n);
  };
  M.pct = function (n) { return M.cifra(n * 100, n * 100 < 10 ? 1 : 0) + '%'; };
  M.redondearArriba = function (n, paso) { return paso > 0 ? Math.ceil((n - 1e-9) / paso) * paso : n; };

  /* ---------- Fechas ---------- */
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  M.MESES = MESES;
  M.MES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  M.hoyISO = function () { var d = new Date(); return M.aISO(d); };
  M.aISO = function (d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  M.deISO = function (s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  M.fecha = function (iso) {
    var d = typeof iso === 'string' ? M.deISO(iso) : iso;
    return d ? d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear() : '';
  };
  M.fechaCorta = function (iso) {
    var d = typeof iso === 'string' ? M.deISO(iso) : iso;
    return d ? d.getDate() + ' ' + M.MES3[d.getMonth()] + ' ' + d.getFullYear() : '';
  };
  M.sumarDias = function (iso, n) {
    var d = M.deISO(iso); if (!d) return '';
    d.setDate(d.getDate() + n); return M.aISO(d);
  };

  /* ---------- Cantidad con letra (pesos mexicanos) ---------- */
  var UNI = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE',
    'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS',
    'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
  var DEC = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  var CEN = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  function menorMil(n) {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    var c = Math.floor(n / 100), r = n % 100, t;
    if (r < 30) t = UNI[r]; else { var d = Math.floor(r / 10), u = r % 10; t = DEC[d] + (u ? ' Y ' + UNI[u] : ''); }
    return (CEN[c] + (CEN[c] && t ? ' ' : '') + t).trim();
  }
  function apocope(s) { return s.replace(/VEINTIUNO$/, 'VEINTIÚN').replace(/UNO$/, 'UN'); }
  function entero(n) {
    if (n === 0) return 'CERO';
    var partes = [], mm = Math.floor(n / 1e6), mi = Math.floor((n % 1e6) / 1000), r = n % 1000;
    if (mm) partes.push(mm === 1 ? 'UN MILLÓN' : apocope(entero(mm)) + ' MILLONES');
    if (mi) partes.push(mi === 1 ? 'MIL' : apocope(menorMil(mi)) + ' MIL');
    if (r) partes.push(menorMil(r));
    return partes.join(' ');
  }
  M.conLetra = function (monto) {
    var c = Math.round(Math.abs(M.num(monto)) * 100), e = Math.floor(c / 100), cent = c % 100;
    var letras = apocope(entero(e));
    var de = e >= 1e6 && e % 1e6 === 0 ? ' DE' : '';
    return letras + de + ' ' + (e === 1 ? 'PESO' : 'PESOS') + ' ' + String(cent).padStart(2, '0') + '/100 M.N.';
  };

  /* ---------- Guardar en el navegador ---------- */
  M.leer = function (k, def) {
    try { var v = localStorage.getItem(PRE + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
  };
  M.guardar = function (k, v) {
    try { localStorage.setItem(PRE + k, JSON.stringify(v)); return true; } catch (e) {
      M.aviso(e && e.name === 'QuotaExceededError'
        ? 'Ya no cabe nada más en este navegador. Descarga tus archivos y borra los documentos viejos.'
        : 'Este navegador no deja guardar. Descarga el archivo para no perder lo que llevas.', 'mal');
      return false;
    }
  };
  M.borrarClave = function (k) { try { localStorage.removeItem(PRE + k); } catch (e) {} };
  M.borrarTodo = function () {
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PRE) === 0) localStorage.removeItem(k); }); } catch (e) {}
  };
  M.siguienteFolio = function (clave) {
    var n = (M.leer('folio:' + clave, 0) || 0) + 1; M.guardar('folio:' + clave, n);
    return String(n).padStart(3, '0');
  };

  /* ---------- El archivero: los documentos de cada herramienta ---------- */
  function Archivero(tipo) { this.tipo = tipo; }
  Archivero.prototype.lista = function () { return M.leer('docs:' + this.tipo, []) || []; };
  Archivero.prototype.obtener = function (id) { return this.lista().filter(function (d) { return d.id === id; })[0] || null; };
  Archivero.prototype.guardar = function (doc) {
    var l = this.lista(), i = -1;
    doc.cambiado = new Date().toISOString();
    l.forEach(function (d, j) { if (d.id === doc.id) i = j; });
    if (i >= 0) l[i] = doc; else l.unshift(doc);
    l.sort(function (a, b) { return String(b.cambiado).localeCompare(String(a.cambiado)); });
    var ok = M.guardar('docs:' + this.tipo, l);
    M.guardar('actual:' + this.tipo, doc.id);
    return ok;
  };
  Archivero.prototype.borrar = function (id) {
    M.guardar('docs:' + this.tipo, this.lista().filter(function (d) { return d.id !== id; }));
    if (M.leer('actual:' + this.tipo) === id) M.borrarClave('actual:' + this.tipo);
  };
  Archivero.prototype.idActual = function () { return M.leer('actual:' + this.tipo, null); };
  Archivero.prototype.marcarActual = function (id) { M.guardar('actual:' + this.tipo, id); };
  M.Archivero = Archivero;

  /* ---------- Rutas y enlaces de campos ---------- */
  M.obtenerRuta = function (o, ruta) {
    return String(ruta).split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o);
  };
  M.ponerRuta = function (o, ruta, v) {
    var ks = String(ruta).split('.'), a = o;
    for (var i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null) a[ks[i]] = {}; a = a[ks[i]]; }
    a[ks[ks.length - 1]] = v;
  };
  function valorDe(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.dataset.tipo === 'num') return el.value === '' ? '' : M.num(el.value);
    return el.value;
  }
  M.llenar = function (raiz, o) {
    M.$$('[data-k]', raiz).forEach(function (el) {
      var v = M.obtenerRuta(o, el.dataset.k);
      if (el.type === 'checkbox') el.checked = !!v;
      else if (el.type === 'radio') el.checked = String(v) === el.value;
      else if (document.activeElement !== el) el.value = v == null ? '' : v;
    });
  };
  M.escuchar = function (raiz, obtenerEstado, alCambiar) {
    function h(e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-k]') : null;
      if (!el || !raiz.contains(el)) return;
      if (el.type === 'radio' && !el.checked) return;
      if (e.type === 'input' && (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT')) return;
      M.ponerRuta(obtenerEstado(), el.dataset.k, valorDe(el));
      alCambiar(el.dataset.k, el);
    }
    raiz.addEventListener('input', h);
    raiz.addEventListener('change', h);
  };

  /* ---------- Avisos flotantes ---------- */
  var flot, tFlot;
  M.aviso = function (texto, tipo) {
    if (!flot) { flot = document.createElement('div'); flot.className = 'flotante'; flot.setAttribute('role', 'status'); document.body.appendChild(flot); }
    flot.textContent = texto; flot.className = 'flotante ver' + (tipo === 'mal' ? ' mal' : '');
    clearTimeout(tFlot); tFlot = setTimeout(function () { flot.className = 'flotante' + (tipo === 'mal' ? ' mal' : ''); }, tipo === 'mal' ? 5200 : 2600);
  };

  /* ---------- Copiar, descargar, abrir ---------- */
  M.copiar = function (texto) {
    function viejo() {
      var t = document.createElement('textarea'); t.value = texto; t.setAttribute('readonly', '');
      t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t); return ok;
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return viejo(); });
    }
    return Promise.resolve(viejo());
  };
  M.descargar = function (nombre, contenido, tipo) {
    var b = new Blob([contenido], { type: tipo || 'application/octet-stream' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  M.descargarArchivo = function (tipo, nombreBase, datos) {
    var paquete = { mochila: tipo, version: 1, guardado: new Date().toISOString(), membrete: M.membrete.leer(), datos: datos };
    M.descargar(M.slug(nombreBase) + '.mochila.json', JSON.stringify(paquete, null, 1), 'application/json');
  };
  M.abrirArchivo = function (tipo, alAbrir) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var p; try { p = JSON.parse(r.result); } catch (e) { M.aviso('Ese archivo no se pudo leer. Tiene que ser uno descargado de la mochila.', 'mal'); return; }
        if (!p || p.mochila !== tipo || !p.datos) {
          M.aviso(p && p.mochila ? 'Ese archivo es de otra herramienta de la mochila (' + p.mochila + ').' : 'Ese archivo no es de la mochila.', 'mal'); return;
        }
        var mio = M.membrete.leer();
        if (p.membrete && p.membrete.nombre && !mio.nombre) M.membrete.guardar(p.membrete);
        else if (p.membrete && p.membrete.nombre && p.membrete.nombre !== mio.nombre &&
          window.confirm('El archivo trae el membrete de «' + p.membrete.nombre + '». ¿Lo usas en este navegador en lugar del tuyo?')) M.membrete.guardar(p.membrete);
        alAbrir(p.datos);
      };
      r.readAsText(f);
    };
    inp.click();
  };

  /* ---------- Imágenes (logo y firma) ---------- */
  M.leerImagen = function (archivo, lado, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || img.width || lado, h = img.naturalHeight || img.height || lado;
        var k = Math.min(1, lado / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        var g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
        try { cb(c.toDataURL('image/png')); } catch (e) { cb(r.result); }
      };
      img.onerror = function () { M.aviso('Esa imagen no se pudo abrir. Prueba con un PNG o un JPG.', 'mal'); };
      img.src = r.result;
    };
    r.readAsDataURL(archivo);
  };

  /* ---------- El membrete ---------- */
  var COLORES = [
    ['#0B3C49', 'Petróleo'], ['#2F5D3A', 'Monte'], ['#7A3E22', 'Barro'], ['#5B3A6B', 'Ciruela'],
    ['#36454F', 'Pizarra'], ['#7A5A12', 'Ocre'], ['#0F6E6E', 'Verde agua']
  ];
  M.COLORES = COLORES;
  var MEMBRETE_VACIO = { nombre: '', giro: '', telefono: '', correo: '', lugar: '', rfc: '', web: '', color: '#0B3C49', logo: '', firma: '', firmaNombre: '', titulo: '', pago: '' };
  var oyentes = [];
  M.membrete = {
    leer: function () { var m = M.leer('membrete', null) || {}; var o = M.copia(MEMBRETE_VACIO); for (var k in m) if (m[k] != null) o[k] = m[k]; return o; },
    guardar: function (m) { var ok = M.guardar('membrete', m); oyentes.forEach(function (f) { f(m); }); return ok; },
    alCambiar: function (f) { oyentes.push(f); },
    iniciales: function (nombre) {
      var p = String(nombre || '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/)
        .filter(function (x) { return x && !/^(de|del|la|las|los|y|el|e)$/i.test(x); });
      return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase();
    }
  };

  M.montarMembrete = function (contenedor, alCambiar) {
    var m = M.membrete.leer();
    var colores = COLORES.map(function (c, i) {
      return '<label title="' + c[1] + '"><input type="radio" name="m-color" value="' + c[0] + '" data-mk="color"><span style="background:' + c[0] + '"></span><span class="sr">' + c[1] + '</span></label>';
    }).join('');
    contenedor.innerHTML =
      '<div class="campos">' +
      '<div class="campo c4"><label for="m-nombre">Tu nombre o el de tu negocio</label><input id="m-nombre" type="text" data-mk="nombre" autocomplete="organization" placeholder="Ej. Raíz Viva, asesoría agroecológica"></div>' +
      '<div class="campo c2"><span class="etiqueta">Logo</span><div class="logo-zona"><div class="logo-vista" id="m-logo-vista"></div><div><button type="button" class="btn claro chico" id="m-logo-subir">Subir logo</button><br><button type="button" class="btn-texto peligro" id="m-logo-quitar">Quitar</button></div></div></div>' +
      '<div class="campo"><label for="m-giro">A qué te dedicas, en una línea</label><input id="m-giro" type="text" data-mk="giro" placeholder="Ej. Capacitación y asesoría en producción agroecológica"></div>' +
      '<div class="campo c3"><label for="m-tel">Teléfono o WhatsApp</label><input id="m-tel" type="tel" data-mk="telefono" autocomplete="tel" placeholder="441 000 0000"></div>' +
      '<div class="campo c3"><label for="m-correo">Correo</label><input id="m-correo" type="email" data-mk="correo" autocomplete="email" placeholder="nombre@correo.com"></div>' +
      '<div class="campo c3"><label for="m-lugar">Municipio y estado</label><input id="m-lugar" type="text" data-mk="lugar" placeholder="Arroyo Seco, Querétaro"></div>' +
      '<div class="campo c3"><label for="m-rfc">RFC (si lo tienes)</label><input id="m-rfc" type="text" data-mk="rfc" autocomplete="off" style="text-transform:uppercase"></div>' +
      '<div class="campo"><label for="m-web">Página o red social (opcional)</label><input id="m-web" type="text" data-mk="web" placeholder="facebook.com/raizviva"></div>' +
      '<div class="campo"><span class="etiqueta">Color de tus documentos</span><div class="colores" role="radiogroup" aria-label="Color de tus documentos">' + colores + '</div></div>' +
      '<div class="campo c3"><label for="m-fnombre">Nombre en la firma</label><input id="m-fnombre" type="text" data-mk="firmaNombre" placeholder="Si lo dejas vacío, va el de arriba"></div>' +
      '<div class="campo c3"><label for="m-titulo">Profesión o cargo</label><input id="m-titulo" type="text" data-mk="titulo" placeholder="Lic. en Producción Agropecuaria Sustentable"></div>' +
      '<div class="campo"><span class="etiqueta">Tu firma en imagen (opcional)</span><div class="logo-zona"><div class="logo-vista" id="m-firma-vista" style="width:150px"></div><div><button type="button" class="btn claro chico" id="m-firma-subir">Subir firma</button><br><button type="button" class="btn-texto peligro" id="m-firma-quitar">Quitar</button></div></div><span class="ayuda">Firma con tinta negra en una hoja blanca y tómale una foto de cerca. Si no la subes, la hoja trae la línea para firmar a mano.</span></div>' +
      '<div class="campo"><label for="m-pago">Datos para que te paguen (opcional)</label><textarea id="m-pago" data-mk="pago" rows="2" placeholder="Banco, nombre de la cuenta y CLABE"></textarea><span class="ayuda">Salen en las condiciones de pago. Se guardan solo en este navegador.</span></div>' +
      '</div>' +
      '<p class="ayuda" style="margin-top:14px">El membrete se llena una vez y sale en todo lo que hagas con la mochila: cotizaciones, recibos, cronogramas, presupuestos y dibujos. Vive en este navegador; en un aparato prestado, bórralo al terminar. <button type="button" class="btn-texto peligro" id="m-borrar">Borrar mis datos de este navegador</button></p>';

    function pintarVistas() {
      var lv = M.$('#m-logo-vista', contenedor), fv = M.$('#m-firma-vista', contenedor);
      lv.innerHTML = m.logo ? '<img alt="Tu logo" src="' + m.logo + '">' : '<div class="mono" style="background:' + M.esc(m.color) + '">' + M.esc(M.membrete.iniciales(m.nombre)) + '</div>';
      fv.innerHTML = m.firma ? '<img alt="Tu firma" src="' + m.firma + '">' : '<span class="ayuda">sin firma</span>';
      M.$('#m-logo-quitar', contenedor).style.visibility = m.logo ? 'visible' : 'hidden';
      M.$('#m-firma-quitar', contenedor).style.visibility = m.firma ? 'visible' : 'hidden';
    }
    function llenarMembrete() {
      M.$$('[data-mk]', contenedor).forEach(function (el) {
        var v = m[el.dataset.mk];
        if (el.type === 'radio') el.checked = el.value === v; else if (document.activeElement !== el) el.value = v || '';
      });
      pintarVistas();
    }
    function cambio() { M.membrete.guardar(m); pintarVistas(); if (alCambiar) alCambiar(m); }
    contenedor.addEventListener('input', function (e) {
      var el = e.target; if (!el.dataset || !el.dataset.mk) return;
      if (el.type === 'radio' && !el.checked) return;
      m[el.dataset.mk] = el.dataset.mk === 'rfc' ? el.value.toUpperCase() : el.value; cambio();
    });
    contenedor.addEventListener('change', function (e) { var el = e.target; if (el.type === 'radio' && el.dataset.mk && el.checked) { m[el.dataset.mk] = el.value; cambio(); } });
    function subir(clave, lado) {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = function () { var f = inp.files && inp.files[0]; if (f) M.leerImagen(f, lado, function (url) { m[clave] = url; cambio(); }); };
      inp.click();
    }
    M.$('#m-logo-subir', contenedor).onclick = function () { subir('logo', 520); };
    M.$('#m-firma-subir', contenedor).onclick = function () { subir('firma', 640); };
    M.$('#m-logo-quitar', contenedor).onclick = function () { m.logo = ''; cambio(); };
    M.$('#m-firma-quitar', contenedor).onclick = function () { m.firma = ''; cambio(); };
    M.$('#m-borrar', contenedor).onclick = function () {
      if (!window.confirm('Se borra de este navegador todo lo de la mochila: tu membrete y todos tus documentos guardados. Si quieres conservar algo, descárgalo antes. ¿Borrar?')) return;
      M.borrarTodo(); window.location.reload();
    };
    llenarMembrete();
    return {
      recargar: function () { m = M.membrete.leer(); llenarMembrete(); },
      resumen: function () { return m.nombre ? m.nombre : 'Falta tu nombre'; }
    };
  };

  /* ---------- La hoja: membrete, pie y paginación ---------- */
  M.encabezado = function (m, derecha, opciones) {
    opciones = opciones || {};
    var nombre = m.nombre || 'Tu nombre o el de tu negocio';
    var logo = m.logo ? '<img alt="" src="' + m.logo + '">' : '<div class="mono">' + M.esc(M.membrete.iniciales(m.nombre || 'Tu nombre')) + '</div>';
    var contacto = [m.telefono && 'Tel. ' + m.telefono, m.correo, m.lugar, m.rfc && 'RFC ' + m.rfc, m.web]
      .filter(Boolean).map(function (x) { return '<span>' + M.esc(x) + '</span>'; }).join('');
    return '<header class="membrete">' +
      '<div class="logo">' + logo + '</div>' +
      '<div class="quien"><div class="nombre"' + (m.nombre ? '' : ' style="color:var(--t-tenue)"') + '>' + M.esc(nombre) + '</div>' +
      (m.giro ? '<div class="giro">' + M.esc(m.giro) + '</div>' : '') +
      (contacto ? '<div class="contacto">' + contacto + '</div>' : '') + '</div>' +
      (derecha ? '<div class="doc">' + derecha + '</div>' : '') + '</header>';
  };
  M.firma = function (m, que, opciones) {
    opciones = opciones || {};
    var nombre = opciones.nombre != null ? opciones.nombre : (m.firmaNombre || m.nombre || '');
    var cargo = opciones.cargo != null ? opciones.cargo : (m.titulo || '');
    var img = opciones.sinImagen ? '' : (m.firma ? '<img alt="" src="' + m.firma + '">' : '');
    return '<div class="firma">' + (que ? '<div class="que">' + M.esc(que) + '</div>' : '') +
      '<div class="trazo">' + img + '</div>' +
      '<div class="quien-firma">' + (M.esc(nombre) || '&nbsp;') + '</div>' +
      (cargo ? '<div class="cargo">' + M.esc(cargo) + '</div>' : '') + '</div>';
  };
  /* Mezcla un color con blanco (sin color-mix, para celulares viejos) */
  M.aclarar = function (hex, cuanto) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim()); if (!m) return '#EEF2F1';
    var v = parseInt(m[1], 16), c = [v >> 16 & 255, v >> 8 & 255, v & 255];
    return '#' + c.map(function (x) { return Math.round(x * cuanto + 255 * (1 - cuanto)).toString(16).padStart(2, '0'); }).join('');
  };
  M.hoja = function (o, contenido) {
    var clases = 'hoja' + (o.horizontal ? ' horizontal' : '') + (o.compacta ? ' compacta' : '');
    var ac = /^#[0-9a-f]{6}$/i.test(o.acento || '') ? o.acento : '#0B3C49';
    return '<article class="' + clases + '" style="--acento:' + ac + ';--acento-suave:' + M.aclarar(ac, .09) + ';--acento-linea:' + M.aclarar(ac, .55) + '">' +
      '<table class="pagina"><thead><tr><td><div class="m-sup"></div></td></tr></thead>' +
      '<tbody><tr><td class="contenido">' + contenido + '</td></tr></tbody>' +
      '<tfoot><tr><td><div class="m-inf"></div></td></tr></tfoot>' +
      '</table><div class="pie-doc"><span>' + (o.pieIzq || '') + '</span><span>' + (o.pieDer || '') + '</span></div></article>';
  };
  M.pieMembrete = function (m) {
    return M.esc([m.nombre, m.telefono, m.correo].filter(Boolean).join('   ·   '));
  };

  /* ---------- La vista: la hoja a escala y el conmutador del celular ---------- */
  M.ajustarHoja = function (marco) {
    marco = marco || M.$('.marco-hoja');
    if (!marco) return;
    var hoja = marco.querySelector('.hoja'); if (!hoja) return;
    var w = marco.clientWidth, hw = hoja.offsetWidth || 816;
    var k = Math.min(1, w / hw);
    hoja.style.transform = 'scale(' + k + ')';
    marco.style.height = Math.ceil(hoja.offsetHeight * k) + 'px';
  };
  M.montarVista = function () {
    var marco = M.$('.marco-hoja');
    if (marco && window.ResizeObserver) {
      var ro = new ResizeObserver(function () { M.ajustarHoja(marco); });
      ro.observe(marco);
    }
    window.addEventListener('resize', function () { M.ajustarHoja(marco); });
    document.body.dataset.vista = document.body.dataset.vista || 'llenar';
    M.$$('[data-ver]').forEach(function (b) {
      b.addEventListener('click', function () { M.verVista(b.dataset.ver); });
    });
    M.verVista(document.body.dataset.vista);
  };
  M.verVista = function (v) {
    document.body.dataset.vista = v;
    M.$$('[data-ver]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.ver === v ? 'true' : 'false'); });
    if (v === 'hoja') { window.scrollTo(0, 0); setTimeout(function () { M.ajustarHoja(); }, 0); }
  };

  /* ---------- Imprimir o guardar en PDF ---------- */
  var tituloPDF = null, pintarYa = null;
  M.alImprimir = function (f, pintar) { tituloPDF = f; pintarYa = pintar || null; };
  function prepararImpresion() {
    if (pintarYa) { try { pintarYa(); } catch (e) {} }
    var hoja = M.$('.marco-hoja .hoja'); if (!hoja) return;
    var dest = M.$('#impresion');
    if (!dest) { dest = document.createElement('div'); dest.id = 'impresion'; document.body.appendChild(dest); }
    dest.innerHTML = ''; var copia = hoja.cloneNode(true); copia.style.transform = ''; dest.appendChild(copia);
    var est = M.$('#estilo-pagina');
    if (!est) { est = document.createElement('style'); est.id = 'estilo-pagina'; document.head.appendChild(est); }
    est.textContent = '@page { size: letter ' + (hoja.classList.contains('horizontal') ? 'landscape' : 'portrait') + '; margin: 0; }';
    if (tituloPDF) { var t = tituloPDF(); if (t) { M._tituloOriginal = M._tituloOriginal || document.title; document.title = t; } }
  }
  window.addEventListener('beforeprint', prepararImpresion);
  window.addEventListener('afterprint', function () { if (M._tituloOriginal) { document.title = M._tituloOriginal; M._tituloOriginal = null; } });
  M.prepararImpresion = prepararImpresion;
  M.imprimir = function () {
    prepararImpresion();
    if (typeof window.print !== 'function') { M.aviso('Este navegador no sabe imprimir. Abre la página en Chrome o Safari.', 'mal'); return; }
    window.print();
  };
  M.enNavegadorPrestado = /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)|GSA\//i.test(navigator.userAgent || '');

  /* ---------- El cajón: la lista de documentos guardados ---------- */
  M.cajon = function (id, titulo) {
    var d = document.getElementById(id);
    if (!d) {
      d = document.createElement('dialog'); d.id = id; d.className = 'cajon';
      d.innerHTML = '<div class="cabeza-cajon"><h2></h2><button type="button" class="btn claro chico cerrar">Cerrar</button></div><div class="cuerpo-cajon"></div>';
      document.body.appendChild(d);
      M.$('.cerrar', d).onclick = function () { M.cerrarCajon(d); };
      d.addEventListener('click', function (e) { if (e.target === d) M.cerrarCajon(d); });
    }
    M.$('h2', d).textContent = titulo;
    return d;
  };
  M.abrirCajon = function (d) {
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else { d.setAttribute('open', ''); d.style.position = 'fixed'; d.style.top = '8vh'; d.style.zIndex = 80; }
  };
  M.cerrarCajon = function (d) { if (typeof d.close === 'function' && d.open) d.close(); else d.removeAttribute('open'); };

  /* Lista estándar de documentos guardados de una herramienta */
  M.listaDocs = function (o) {
    var d = M.cajon('cajon-docs', o.titulo);
    function pintar() {
      var l = o.archivero.lista(), actual = o.archivero.idActual();
      var html = '<div class="acciones-cajon">' +
        '<button type="button" class="btn chico" data-a="nuevo">' + M.ico.mas + o.nuevoTexto + '</button>' +
        '<button type="button" class="btn claro chico" data-a="abrir-archivo">' + M.ico.abrir + 'Abrir un archivo</button>' +
        '<button type="button" class="btn claro chico" data-a="ejemplo">Ver un ejemplo</button></div>';
      if (!l.length) html += '<p class="vacio">Todavía no hay nada guardado en este navegador. Lo que llenes se guarda solo, aquí.</p>';
      else html += '<ul class="lista-docs">' + l.map(function (doc) {
        var x = o.describir(doc);
        return '<li class="' + (doc.id === actual ? 'actual' : '') + '"><div class="t">' + M.esc(x.t) + '</div><div class="v">' + M.esc(x.v || '') + '</div>' +
          '<div class="d">' + M.esc(x.d || '') + '</div><div class="a">' +
          '<button type="button" class="btn-texto" data-a="abrir" data-id="' + doc.id + '">Abrir</button>' +
          (o.extra ? o.extra(doc) : '') +
          '<button type="button" class="btn-texto" data-a="duplicar" data-id="' + doc.id + '">Hacer una copia</button>' +
          '<button type="button" class="btn-texto peligro" data-a="borrar" data-id="' + doc.id + '">Borrar</button></div></li>';
      }).join('') + '</ul>';
      M.$('.cuerpo-cajon', d).innerHTML = html;
    }
    M.$('.cuerpo-cajon', d).onclick = function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a, id = b.dataset.id;
      if (a === 'nuevo') { M.cerrarCajon(d); o.alNuevo(); }
      else if (a === 'abrir-archivo') { M.cerrarCajon(d); o.alAbrirArchivo(); }
      else if (a === 'ejemplo') { M.cerrarCajon(d); o.alEjemplo(); }
      else if (a === 'abrir') { M.cerrarCajon(d); o.alAbrir(o.archivero.obtener(id)); }
      else if (a === 'duplicar') { M.cerrarCajon(d); o.alDuplicar(o.archivero.obtener(id)); }
      else if (a === 'borrar') {
        var doc = o.archivero.obtener(id), x = o.describir(doc);
        if (window.confirm('¿Borrar «' + x.t + '» de este navegador?')) { o.archivero.borrar(id); if (o.alBorrar) o.alBorrar(id); pintar(); }
      } else if (o.alExtra) { M.cerrarCajon(d); o.alExtra(a, o.archivero.obtener(id)); }
    };
    pintar(); M.abrirCajon(d);
  };

  /* ---------- Íconos ---------- */
  function svg(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  M.ico = {
    mochila: svg('<path d="M9 5.5V4.6a3 3 0 0 1 6 0v.9"/><rect x="4.5" y="5.5" width="15" height="15.5" rx="4.5"/><path d="M4.5 11.5h15"/><rect x="8.5" y="14" width="7" height="4" rx="1"/>'),
    pdf: svg('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/>'),
    descargar: svg('<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 20h14"/>'),
    abrir: svg('<path d="M3.5 7.5V18a1.5 1.5 0 0 0 1.5 1.5h14A1.5 1.5 0 0 0 20.5 18V9.5A1.5 1.5 0 0 0 19 8h-7l-2-2.5H5A1.5 1.5 0 0 0 3.5 7z"/>'),
    mas: svg('<path d="M12 5v14M5 12h14"/>'),
    copiar: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>'),
    lista: svg('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1"/><circle cx="4.8" cy="12" r="1"/><circle cx="4.8" cy="17.5" r="1"/>'),
    salir: svg('<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 8l-4 4 4 4M6 12h10"/>')
  };
  M.$$('[data-ico]').forEach(function (el) { if (M.ico[el.dataset.ico]) el.insertAdjacentHTML('afterbegin', M.ico[el.dataset.ico]); });
})();
