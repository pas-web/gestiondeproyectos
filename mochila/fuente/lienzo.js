/* La mochila del gestor · imágenes para WhatsApp
   Se dibujan en un canvas, con la misma letra de las hojas (Jost). En el celular
   se mandan con el menú de compartir; en la computadora se descargan. */
(function () {
  'use strict';
  var M = window.M || (window.M = {});
  var FAMILIA = "'Jost', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

  function fuente(f) { return (f.peso || 400) + ' ' + Math.round(f.tam || 28) + 'px ' + FAMILIA; }
  function lineas(g, texto, ancho, f) {
    g.font = fuente(f);
    var salida = [];
    String(texto == null ? '' : texto).split(/\r?\n/).forEach(function (parrafo) {
      var palabras = parrafo.split(/\s+/).filter(Boolean), linea = '';
      if (!palabras.length) { salida.push(''); return; }
      palabras.forEach(function (p) {
        var prueba = linea ? linea + ' ' + p : p;
        if (g.measureText(prueba).width <= ancho || !linea) {
          if (!linea && g.measureText(p).width > ancho) {
            // una palabra que no cabe: se parte
            var trozo = '';
            p.split('').forEach(function (ch) { if (g.measureText(trozo + ch).width > ancho && trozo) { salida.push(trozo); trozo = ch; } else trozo += ch; });
            linea = trozo;
          } else linea = prueba;
        } else { salida.push(linea); linea = p; }
      });
      if (linea) salida.push(linea);
    });
    return salida;
  }

  M.lienzo = {
    crear: function (w, h, fondo) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var g = c.getContext('2d'); g.fillStyle = fondo || '#FFFFFF'; g.fillRect(0, 0, w, h);
      g.textBaseline = 'alphabetic';
      return { c: c, g: g };
    },
    /* Espera a que la letra esté lista, para que la imagen no salga con otra */
    fuentes: function () {
      if (!document.fonts || !document.fonts.load) return Promise.resolve();
      return Promise.all([400, 500, 600].map(function (p) { return document.fonts.load(p + " 40px 'Jost'").catch(function () {}); })).then(function () {}, function () {});
    },
    medir: function (g, texto, f) { g.font = fuente(f); return g.measureText(String(texto == null ? '' : texto)).width; },
    lineas: lineas,
    /* Escribe un texto con salto de línea. y es la parte de arriba de la primera línea. Devuelve dónde termina. */
    texto: function (g, texto, x, y, f) {
      f = f || {};
      var tam = f.tam || 28, alto = tam * (f.interlinea || 1.28);
      var ls = f.ancho ? lineas(g, texto, f.ancho, f) : String(texto == null ? '' : texto).split(/\r?\n/);
      if (f.max && ls.length > f.max) {
        ls = ls.slice(0, f.max);
        var ult = ls[f.max - 1]; g.font = fuente(f);
        while (ult.length > 1 && g.measureText(ult + '…').width > (f.ancho || 1e9)) ult = ult.slice(0, -1);
        ls[f.max - 1] = ult.replace(/[\s,.;:]+$/, '') + '…';
      }
      g.font = fuente(f); g.fillStyle = f.color || '#1D2A2E';
      g.textAlign = f.alin === 'der' ? 'right' : f.alin === 'centro' ? 'center' : 'left';
      ls.forEach(function (l, i) { g.fillText(l, x, y + tam * 0.92 + i * alto); });
      g.textAlign = 'left';
      return y + ls.length * alto;
    },
    /* Cuánto mide de alto un texto, sin dibujarlo */
    alto: function (g, texto, f) { var ls = f.ancho ? lineas(g, texto, f.ancho, f) : String(texto == null ? '' : texto).split(/\r?\n/); if (f.max) ls = ls.slice(0, f.max); return ls.length * (f.tam || 28) * (f.interlinea || 1.28); },
    rect: function (g, x, y, w, h, r, relleno, borde, grosor) {
      r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
      g.beginPath();
      g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
      if (relleno) { g.fillStyle = relleno; g.fill(); }
      if (borde) { g.strokeStyle = borde; g.lineWidth = grosor || 2; g.stroke(); }
    },
    linea: function (g, x1, y1, x2, y2, color, grosor, punteada) {
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = color || '#DCE2E3'; g.lineWidth = grosor || 2;
      g.setLineDash(punteada ? [6, 6] : []); g.stroke(); g.setLineDash([]);
    },
    cargar: function (src) {
      return new Promise(function (listo) {
        if (!src) { listo(null); return; }
        var i = new Image(); i.onload = function () { listo(i); }; i.onerror = function () { listo(null); }; i.src = src;
      });
    },
    /* Una imagen dentro de una caja, sin deformarla */
    poner: function (g, img, x, y, w, h, alin) {
      if (!img) return;
      var k = Math.min(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * k, ih = img.naturalHeight * k;
      var ix = alin === 'izq' ? x : alin === 'der' ? x + w - iw : x + (w - iw) / 2;
      g.drawImage(img, ix, y + (h - ih) / 2, iw, ih);
    },
    /* El logo, o un círculo con las iniciales en el color del membrete */
    logo: function (g, m, x, y, lado, fondoClaro) {
      return M.lienzo.cargar(m.logo).then(function (img) {
        if (img) {
          if (fondoClaro) { M.lienzo.rect(g, x, y, lado, lado, lado * 0.18, '#FFFFFF'); M.lienzo.poner(g, img, x + lado * 0.08, y + lado * 0.08, lado * 0.84, lado * 0.84); }
          else M.lienzo.poner(g, img, x, y, lado, lado);
          return;
        }
        g.beginPath(); g.arc(x + lado / 2, y + lado / 2, lado / 2, 0, Math.PI * 2);
        g.fillStyle = fondoClaro ? '#FFFFFF' : (m.color || '#0B3C49'); g.fill();
        var ini = M.membrete ? M.membrete.iniciales(m.nombre || 'Tu nombre') : '?';
        g.font = fuente({ peso: 600, tam: lado * 0.38 }); g.fillStyle = fondoClaro ? (m.color || '#0B3C49') : '#FFFFFF';
        g.textAlign = 'center'; g.fillText(ini, x + lado / 2, y + lado / 2 + lado * 0.135); g.textAlign = 'left';
      });
    },
    /* Para Word: las iniciales como imagen, cuando no hay logo */
    iniciales: function (m, lado) {
      lado = lado || 160;
      var x = M.lienzo.crear(lado, lado, 'rgba(0,0,0,0)'), g = x.g;
      g.clearRect(0, 0, lado, lado);
      g.beginPath(); g.arc(lado / 2, lado / 2, lado / 2, 0, Math.PI * 2); g.fillStyle = m.color || '#0B3C49'; g.fill();
      g.font = fuente({ peso: 600, tam: lado * 0.38 }); g.fillStyle = '#FFFFFF'; g.textAlign = 'center';
      g.fillText(M.membrete ? M.membrete.iniciales(m.nombre || 'Tu nombre') : '?', lado / 2, lado / 2 + lado * 0.135);
      return x.c.toDataURL('image/png');
    },
    /* Pinta en un canvas lo que se ve de un pedazo de la página: fondos, bordes,
       texto, imágenes y los trazos de los SVG. Sirve para los dibujos de la hoja. */
    desdeDom: function (raiz, op) {
      op = op || {};
      var r0 = raiz.getBoundingClientRect(), S = (op.ancho || 1800) / Math.max(1, r0.width), mg = op.margen || 0;
      var W = Math.round(r0.width * S) + 2 * mg, H = Math.round(r0.height * S) + 2 * mg;
      var x = M.lienzo.crear(W, H, op.fondo || '#FFFFFF'), g = x.g;
      function X(v) { return (v - r0.left) * S + mg; }
      function Y(v) { return (v - r0.top) * S + mg; }
      function px(v) { return parseFloat(v) || 0; }
      function factor(el) { var r = el.getBoundingClientRect(); return el.offsetWidth ? r.width / el.offsetWidth : 1; }
      function transparente(c) { return !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c); }
      function caja(el, cs, r, f) {
        var rad = px(cs.borderTopLeftRadius) * f * S;
        var bx = X(r.left), by = Y(r.top), bw = r.width * S, bh = r.height * S;
        if (!transparente(cs.backgroundColor)) M.lienzo.rect(g, bx, by, bw, bh, rad, cs.backgroundColor);
        var lados = ['Top', 'Right', 'Bottom', 'Left'].map(function (l) { return { w: px(cs['border' + l + 'Width']) * f * S, c: cs['border' + l + 'Color'], s: cs['border' + l + 'Style'] }; });
        var iguales = lados.every(function (l) { return l.w === lados[0].w && l.c === lados[0].c && l.s === lados[0].s; });
        if (iguales && lados[0].w > 0 && lados[0].s !== 'none' && !transparente(lados[0].c)) {
          g.setLineDash(lados[0].s === 'dashed' ? [lados[0].w * 3, lados[0].w * 2.5] : lados[0].s === 'dotted' ? [lados[0].w, lados[0].w * 1.6] : []);
          M.lienzo.rect(g, bx + lados[0].w / 2, by + lados[0].w / 2, bw - lados[0].w, bh - lados[0].w, Math.max(0, rad - lados[0].w / 2), null, lados[0].c, lados[0].w);
          g.setLineDash([]);
        } else {
          var seg = [[bx, by, bx + bw, by], [bx + bw, by, bx + bw, by + bh], [bx, by + bh, bx + bw, by + bh], [bx, by, bx, by + bh]];
          lados.forEach(function (l, i) {
            if (!(l.w > 0) || l.s === 'none' || transparente(l.c)) return;
            var s0 = seg[i], o = l.w / 2 * (i === 0 || i === 3 ? 1 : -1);
            if (i % 2 === 0) M.lienzo.linea(g, s0[0], s0[1] + o, s0[2], s0[3] + o, l.c, l.w, l.s === 'dashed' || l.s === 'dotted');
            else M.lienzo.linea(g, s0[0] + o, s0[1], s0[2] + o, s0[3], l.c, l.w, l.s === 'dashed' || l.s === 'dotted');
          });
        }
      }
      function trazos(svg) {
        var r = svg.getBoundingClientRect(), vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
        var vw = vb.length === 4 ? vb[2] : r.width, vh = vb.length === 4 ? vb[3] : r.height;
        g.save(); g.translate(X(r.left), Y(r.top)); g.scale(r.width * S / (vw || 1), r.height * S / (vh || 1));
        M.$$('path, line, polyline, rect, circle', svg).forEach(function (el) {
          var cs = getComputedStyle(el), d = el.getAttribute('d'), p;
          if (el.tagName === 'path' && d) p = new Path2D(d);
          else if (el.tagName === 'line') { p = new Path2D(); p.moveTo(+el.getAttribute('x1'), +el.getAttribute('y1')); p.lineTo(+el.getAttribute('x2'), +el.getAttribute('y2')); }
          else if (el.tagName === 'rect') { p = new Path2D(); p.rect(+el.getAttribute('x') || 0, +el.getAttribute('y') || 0, +el.getAttribute('width') || 0, +el.getAttribute('height') || 0); }
          else if (el.tagName === 'circle') { p = new Path2D(); p.arc(+el.getAttribute('cx') || 0, +el.getAttribute('cy') || 0, +el.getAttribute('r') || 0, 0, Math.PI * 2); }
          if (!p) return;
          if (cs.fill && cs.fill !== 'none' && !transparente(cs.fill)) { g.fillStyle = cs.fill; g.fill(p); }
          if (cs.stroke && cs.stroke !== 'none' && !transparente(cs.stroke)) { g.strokeStyle = cs.stroke; g.lineWidth = px(cs.strokeWidth) || 1; g.stroke(p); }
        });
        g.restore();
      }
      function textos(nodo) {
        var el = nodo.parentElement, cs = getComputedStyle(el), f = factor(el), t = nodo.nodeValue;
        if (!t || !t.trim()) return;
        var tam = px(cs.fontSize) * f * S, peso = cs.fontWeight;
        g.font = (cs.fontStyle === 'italic' ? 'italic ' : '') + peso + ' ' + tam + 'px ' + "'Jost', system-ui, sans-serif";
        g.fillStyle = cs.color; g.textBaseline = 'alphabetic';
        var m0 = g.measureText('Hg'), asc = m0.fontBoundingBoxAscent || tam * 0.94, des = m0.fontBoundingBoxDescent || tam * 0.26;
        var mayus = cs.textTransform === 'uppercase';
        var rango = document.createRange(), lineas = [], actual = null;
        for (var i = 0; i < t.length; i++) {
          rango.setStart(nodo, i); rango.setEnd(nodo, i + 1);
          var rs = rango.getClientRects(); if (!rs.length) continue;
          var rc = rs[0];
          if (!actual || Math.abs(rc.top - actual.top) > rc.height * 0.5) { actual = { top: rc.top, h: rc.height, left: null, txt: '' }; lineas.push(actual); }
          if (actual.left == null && /\S/.test(t[i])) actual.left = rc.left;
          actual.txt += t[i];
        }
        lineas.forEach(function (l) {
          var txt = l.txt.replace(/\s+$/, ''); if (!txt.trim()) return;
          if (mayus) txt = txt.toUpperCase();
          var by = Y(l.top) + (l.h * S - (asc + des)) / 2 + asc;
          if (l.left == null) return;
          g.fillText(txt.replace(/^\s+/, ''), X(l.left), by);
        });
      }
      function pintar(el, alfa) {
        var cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        var al = alfa * (parseFloat(cs.opacity) || 0);
        g.globalAlpha = al;
        if (el.tagName.toLowerCase() === 'svg') { trazos(el); g.globalAlpha = 1; return; }
        var r = el.getBoundingClientRect();
        if (r.width && r.height) {
          caja(el, cs, r, factor(el));
          if (el.tagName === 'IMG' && el.complete && el.naturalWidth) { try { g.drawImage(el, X(r.left), Y(r.top), r.width * S, r.height * S); } catch (e) {} }
        }
        for (var h = el.firstChild; h; h = h.nextSibling) {
          if (h.nodeType === 1) pintar(h, al);
          else if (h.nodeType === 3) { g.globalAlpha = al; textos(h); }
        }
        g.globalAlpha = 1;
      }
      pintar(raiz, 1);
      return x.c;
    },
    blob: function (c, tipo) {
      tipo = tipo || 'image/png';
      if (tipo === 'image/jpeg') {
        var b2 = document.createElement('canvas'); b2.width = c.width; b2.height = c.height;
        var g2 = b2.getContext('2d'); g2.fillStyle = '#FFFFFF'; g2.fillRect(0, 0, b2.width, b2.height); g2.drawImage(c, 0, 0); c = b2;
      }
      return new Promise(function (listo) {
        if (c.toBlob) c.toBlob(function (b) { listo(b); }, tipo, 0.92);
        else { var u = c.toDataURL(tipo, 0.92), bin = atob(u.split(',')[1]), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); listo(new Blob([a], { type: tipo })); }
      });
    },
    /* En el celular abre el menú de compartir (WhatsApp, correo); si no se puede, descarga */
    entregar: function (c, nombre, titulo) {
      var tipo = /\.jpe?g$/i.test(nombre || '') ? 'image/jpeg' : 'image/png';
      return M.lienzo.blob(c, tipo).then(function (b) {
        var archivo = null;
        try { archivo = new File([b], nombre, { type: tipo }); } catch (e) { archivo = null; }
        var tactil = window.matchMedia && matchMedia('(pointer: coarse)').matches;
        if (tactil && archivo && navigator.canShare && navigator.canShare({ files: [archivo] })) {
          return navigator.share({ files: [archivo], title: titulo || nombre }).then(function () { return 'compartida'; }, function (e) {
            if (e && e.name === 'AbortError') return 'cancelada';
            M.descargar(nombre, b, tipo); return 'descargada';
          });
        }
        M.descargar(nombre, b, tipo);
        return 'descargada';
      });
    }
  };
})();
