/* La mochila del gestor · Word editable, hecho en el navegador
   Un .docx es un ZIP con XML adentro. Aquí se arma sin librerías: un ZIP sin
   compresión y el XML mínimo que abren Word, Google Docs y LibreOffice.
   Medidas: pulgadas hacia afuera; adentro, dxa (1/1440 de pulgada) y EMU. */
(function () {
  'use strict';
  var M = window.M || (window.M = {});

  /* ---------- ZIP sin compresión ---------- */
  var TABLA = (function () {
    var t = new Uint32Array(256);
    for (var i = 0; i < 256; i++) { var c = i; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; }
    return t;
  })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = TABLA[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  var utf8 = new TextEncoder();
  function zip(archivos) {
    var d = new Date();
    var hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
    var dia = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var trozos = [], central = [], pos = 0;
    archivos.forEach(function (a) {
      var nombre = utf8.encode(a.nombre), datos = typeof a.datos === 'string' ? utf8.encode(a.datos) : a.datos;
      var crc = crc32(datos), largo = datos.length;
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0, true); h.setUint16(8, 0, true);
      h.setUint16(10, hora, true); h.setUint16(12, dia, true); h.setUint32(14, crc, true);
      h.setUint32(18, largo, true); h.setUint32(22, largo, true); h.setUint16(26, nombre.length, true); h.setUint16(28, 0, true);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0, true); c.setUint16(10, 0, true);
      c.setUint16(12, hora, true); c.setUint16(14, dia, true); c.setUint32(16, crc, true); c.setUint32(20, largo, true); c.setUint32(24, largo, true);
      c.setUint16(28, nombre.length, true); c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true);
      c.setUint32(38, 0, true); c.setUint32(42, pos, true);
      trozos.push(new Uint8Array(h.buffer), nombre, datos);
      central.push(new Uint8Array(c.buffer), nombre);
      pos += 30 + nombre.length + largo;
    });
    var tamCentral = central.reduce(function (s, x) { return s + x.length; }, 0);
    var fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(4, 0, true); fin.setUint16(6, 0, true);
    fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
    fin.setUint32(12, tamCentral, true); fin.setUint32(16, pos, true); fin.setUint16(20, 0, true);
    return new Blob(trozos.concat(central, [new Uint8Array(fin.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  /* ---------- XML ---------- */
  function x(s) {
    return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function hex(c, def) { var m = /^#?([0-9a-f]{6})$/i.exec(String(c || '').trim()); return m ? m[1].toUpperCase() : (def || '1D2A2E'); }
  function aclarar(c, k) {
    var v = parseInt(hex(c), 16), rgb = [v >> 16 & 255, v >> 8 & 255, v & 255];
    return rgb.map(function (y) { return Math.round(y * k + 255 * (1 - k)).toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }
  var DXA = 1440, EMU = 914400;
  var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  var NS_DIB = ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  var REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  var CAB = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  /* Un trozo de texto: cadena, o { t, b, i, color, tam, sub } o una lista de esos */
  function runs(contenido, f) {
    f = f || {};
    var l = Array.isArray(contenido) ? contenido : [typeof contenido === 'object' && contenido !== null ? contenido : { t: contenido }];
    return l.map(function (r) {
      if (typeof r !== 'object' || r === null) r = { t: r };
      if (r.tab) return '<w:r><w:tab/></w:r>';
      var b = r.b != null ? r.b : f.b, i = r.i != null ? r.i : f.i, color = r.color || f.color, tam = r.tam || f.tam;
      var pr = '';
      if (b) pr += '<w:b/><w:bCs/>';
      if (i) pr += '<w:i/><w:iCs/>';
      if (color) pr += '<w:color w:val="' + hex(color) + '"/>';
      if (r.esp || f.esp) pr += '<w:spacing w:val="' + Math.round((r.esp || f.esp) * 20) + '"/>';
      if (tam) pr += '<w:sz w:val="' + Math.round(tam * 2) + '"/><w:szCs w:val="' + Math.round(tam * 2) + '"/>';
      var partes = String(r.t == null ? '' : r.t).split(/\r?\n/);
      var cuerpo = partes.map(function (p, j) { return (j ? '<w:br/>' : '') + '<w:t xml:space="preserve">' + x(p) + '</w:t>'; }).join('');
      return '<w:r>' + (pr ? '<w:rPr>' + pr + '</w:rPr>' : '') + cuerpo + '</w:r>';
    }).join('');
  }
  function borde(lado, b) {
    if (!b) return '';
    if (b === 'nada') return '<w:' + lado + ' w:val="nil"/>';
    return '<w:' + lado + ' w:val="single" w:sz="' + Math.round((b.g || 0.5) * 8) + '" w:space="' + (b.esp || 0) + '" w:color="' + hex(b.c, 'DCE2E3') + '"/>';
  }
  function pPr(f) {
    f = f || {};
    var s = '';
    if (f.estilo) s += '<w:pStyle w:val="' + f.estilo + '"/>';
    if (f.junto) s += '<w:keepNext/>';
    if (f.entero) s += '<w:keepLines/>';
    if (f.saltoAntes) s += '<w:pageBreakBefore/>';
    if (f.vineta) s += '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>';
    if (f.raya || f.rayaArriba) {
      s += '<w:pBdr>' + (f.rayaArriba ? borde('top', { c: f.rayaArriba.c, g: f.rayaArriba.g || 0.75, esp: 4 }) : '') +
        (f.raya ? borde('bottom', { c: f.raya.c, g: f.raya.g || 0.75, esp: f.raya.esp != null ? f.raya.esp : 6 }) : '') + '</w:pBdr>';
    }
    if (f.fondo) s += '<w:shd w:val="clear" w:color="auto" w:fill="' + hex(f.fondo) + '"/>';
    if (f.tabDer) s += '<w:tabs><w:tab w:val="right" w:pos="' + Math.round(f.tabDer * DXA) + '"/></w:tabs>';
    var antes = f.antes != null ? f.antes : null, despues = f.despues != null ? f.despues : null;
    if (antes != null || despues != null || f.linea) {
      s += '<w:spacing' + (antes != null ? ' w:before="' + Math.round(antes * 20) + '"' : '') + (despues != null ? ' w:after="' + Math.round(despues * 20) + '"' : '') +
        (f.linea ? ' w:line="' + Math.round(f.linea * 240) + '" w:lineRule="auto"' : '') + '/>';
    }
    if (f.sangria) s += '<w:ind w:left="' + Math.round(f.sangria * DXA) + '"/>';
    if (f.alin) s += '<w:jc w:val="' + ({ izq: 'left', centro: 'center', der: 'right', just: 'both' }[f.alin] || 'left') + '"/>';
    return s ? '<w:pPr>' + s + '</w:pPr>' : '';
  }

  /* ---------- El documento ---------- */
  M.docx = function (o) {
    o = o || {};
    var horizontal = !!o.horizontal;
    var anchoPag = horizontal ? 15840 : 12240, altoPag = horizontal ? 12240 : 15840;
    var mg = o.margen || {};
    var mI = mg.izq != null ? mg.izq : 0.7, mD = mg.der != null ? mg.der : 0.7, mS = mg.sup != null ? mg.sup : 0.6, mF = mg.inf != null ? mg.inf : 0.75;
    var util = (anchoPag / DXA) - mI - mD;
    var acento = hex(o.acento, '0B3C49');
    var bloques = [], imagenes = [], idDib = 0;

    function imagen(src, ancho, alto) {
      var im = { id: 'rIdImg' + (imagenes.length + 1), n: imagenes.length + 1, src: src, ancho: ancho || 1, alto: alto || 1, dib: ++idDib };
      imagenes.push(im);
      return im;
    }
    function dibujo(im) {
      var cx = Math.round(im.w * EMU), cy = Math.round(im.h * EMU);
      return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/>' +
        '<wp:docPr id="' + im.dib + '" name="Imagen ' + im.dib + '"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
        '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="' + im.dib + '" name="imagen' + im.n + '.' + im.ext + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip r:embed="' + im.id + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    }
    /* Un párrafo como objeto: se vuelve XML al final, cuando ya se saben las medidas de las imágenes */
    function parrafo(contenido, f) { return { tipo: 'p', c: contenido, f: f || {} }; }
    function xmlParrafo(b) {
      if (b.img) return '<w:p>' + pPr(b.f) + dibujo(b.img) + '</w:p>';
      return '<w:p>' + pPr(b.f) + runs(b.c == null ? '' : b.c, b.f) + '</w:p>';
    }
    function xmlCelda(cel, ancho, t) {
      if (cel == null || typeof cel !== 'object' || Array.isArray(cel)) cel = { t: cel };
      var tc = '<w:tcW w:w="' + Math.round(ancho * DXA) + '" w:type="dxa"/>';
      if (cel.span > 1) tc += '<w:gridSpan w:val="' + cel.span + '"/>';
      var bs = cel.bordes || t.bordesCelda;
      if (bs) tc += '<w:tcBorders>' + ['top', 'left', 'bottom', 'right'].map(function (l) { return borde(l, bs[l]); }).join('') + '</w:tcBorders>';
      if (cel.fondo) tc += '<w:shd w:val="clear" w:color="auto" w:fill="' + hex(cel.fondo) + '"/>';
      if (cel.mar) tc += '<w:tcMar><w:top w:w="' + Math.round(cel.mar * DXA) + '" w:type="dxa"/><w:bottom w:w="' + Math.round(cel.mar * DXA) + '" w:type="dxa"/></w:tcMar>';
      tc += '<w:vAlign w:val="' + (cel.vAlin || t.vAlin || 'top') + '"/>';
      var f = { alin: cel.alin, b: cel.b, color: cel.color, tam: cel.tam || t.tam, antes: cel.antes != null ? cel.antes : 0, despues: cel.despues != null ? cel.despues : 0, linea: cel.linea || t.linea };
      var ps = [];
      if (cel.img) ps.push(xmlParrafo({ img: cel.img, f: { alin: cel.alin, antes: 0, despues: 0 } }));
      if (cel.parrafos) {
        cel.parrafos.forEach(function (p) { var ff = {}; for (var k in f) ff[k] = f[k]; for (var j in (p.f || {})) ff[j] = p.f[j]; ps.push(xmlParrafo({ c: p.c, f: ff })); });
      } else if (Array.isArray(cel.t)) {
        ps.push(xmlParrafo({ c: cel.t, f: f }));
      } else if (!cel.img || (cel.t != null && cel.t !== '')) {
        String(cel.t == null ? '' : cel.t).split(/\n\n/).forEach(function (trozo) { ps.push(xmlParrafo({ c: trozo, f: f })); });
      }
      if (!ps.length) ps.push('<w:p/>');
      return '<w:tc><w:tcPr>' + tc + '</w:tcPr>' + ps.join('') + '</w:tc>';
    }
    function xmlTabla(t) {
      var anchos = t.anchos, total = anchos.reduce(function (s, a) { return s + a; }, 0);
      var tb = '<w:tblW w:w="' + Math.round(total * DXA) + '" w:type="dxa"/>';
      if (t.alin === 'der') tb += '<w:jc w:val="right"/>'; else if (t.alin === 'centro') tb += '<w:jc w:val="center"/>';
      var B = t.bordes || {};
      tb += '<w:tblBorders>' + borde('top', B.top || 'nada') + borde('left', B.left || 'nada') + borde('bottom', B.bottom || 'nada') + borde('right', B.right || 'nada') +
        borde('insideH', B.insideH || 'nada') + borde('insideV', B.insideV || 'nada') + '</w:tblBorders>';
      tb += '<w:tblLayout w:type="fixed"/>';
      var m = t.margenCelda != null ? t.margenCelda : 0.06, mv = t.margenV != null ? t.margenV : 0.03;
      tb += '<w:tblCellMar><w:top w:w="' + Math.round(mv * DXA) + '" w:type="dxa"/><w:left w:w="' + Math.round(m * DXA) + '" w:type="dxa"/><w:bottom w:w="' + Math.round(mv * DXA) + '" w:type="dxa"/><w:right w:w="' + Math.round(m * DXA) + '" w:type="dxa"/></w:tblCellMar>';
      tb += '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>';
      var grid = '<w:tblGrid>' + anchos.map(function (a) { return '<w:gridCol w:w="' + Math.round(a * DXA) + '"/>'; }).join('') + '</w:tblGrid>';
      var filas = t.filas.map(function (fila, fi) {
        var celdas = Array.isArray(fila) ? fila : fila.celdas, extra = Array.isArray(fila) ? {} : fila;
        var tr = '<w:cantSplit/>' + (fi < (t.encabezado || 0) ? '<w:tblHeader/>' : '');
        var col = 0;
        var tcs = celdas.map(function (cel) {
          var span = cel && typeof cel === 'object' && !Array.isArray(cel) && cel.span > 1 ? cel.span : 1;
          var ancho = anchos.slice(col, col + span).reduce(function (s, a) { return s + a; }, 0);
          col += span;
          var cc = cel;
          if (extra.fondo || extra.b || extra.color || extra.bordes || extra.tam) {
            cc = (cel && typeof cel === 'object' && !Array.isArray(cel)) ? Object.assign({}, cel) : { t: cel };
            if (extra.fondo && !cc.fondo) cc.fondo = extra.fondo;
            if (extra.b && cc.b == null) cc.b = extra.b;
            if (extra.color && !cc.color) cc.color = extra.color;
            if (extra.tam && !cc.tam) cc.tam = extra.tam;
            if (extra.bordes && !cc.bordes) cc.bordes = extra.bordes;
          }
          return xmlCelda(cc, ancho, t);
        }).join('');
        return '<w:tr><w:trPr>' + tr + '</w:trPr>' + tcs + '</w:tr>';
      }).join('');
      return '<w:tbl><w:tblPr>' + tb + '</w:tblPr>' + grid + filas + '</w:tbl>';
    }

    var api = {
      util: util, acento: '#' + acento,
      suave: function (k) { return '#' + aclarar('#' + acento, k == null ? 0.09 : k); },
      p: function (contenido, f) { bloques.push(parrafo(contenido, f)); return api; },
      titulo: function (texto, f) {
        f = f || {};
        bloques.push(parrafo([{ t: texto, b: f.b != null ? f.b : false, color: f.color || ('#' + acento), tam: f.tam || 13 }], { antes: f.antes != null ? f.antes : 12, despues: f.despues != null ? f.despues : 4, junto: true, estilo: f.nivel === 2 ? 'Heading2' : 'Heading1' }));
        return api;
      },
      lista: function (items, f) {
        (items || []).forEach(function (it) { var ff = { vineta: true, despues: 1.5, tam: (f && f.tam) || 9.5, color: f && f.color }; bloques.push(parrafo(it, ff)); });
        return api;
      },
      raya: function (color, f) { bloques.push(parrafo('', { raya: { c: color || ('#' + aclarar('#' + acento, 0.55)), g: 0.75, esp: 1 }, despues: (f && f.despues) || 6, tam: 2 })); return api; },
      espacio: function (pt) { bloques.push(parrafo('', { antes: 0, despues: 0, tam: Math.max(1, pt || 6) })); return api; },
      salto: function () { bloques.push({ tipo: 'salto' }); return api; },
      tabla: function (t) { bloques.push({ tipo: 'tabla', t: t }); return api; },
      /* Imagen suelta, cabe en una caja de ancho × alto (pulgadas) */
      imagen: function (src, ancho, alto, f) { if (!src) return api; bloques.push({ tipo: 'p', img: imagen(src, ancho, alto), f: f || {} }); return api; },
      /* Imagen dentro de una celda: { img: d.img(src, ancho, alto) } */
      img: function (src, ancho, alto) { return src ? imagen(src, ancho, alto) : null; },
      /* Un bloque de XML ya armado (para casos raros) */
      crudo: function (xml) { bloques.push({ tipo: 'crudo', x: xml }); return api; },

      blob: function () {
        return Promise.all(imagenes.map(preparar)).then(function () {
          var cuerpo = bloques.map(function (b) {
            if (b.tipo === 'tabla') return xmlTabla(b.t) + (b.t.sinPie ? '' : '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:sz w:val="4"/><w:szCs w:val="4"/></w:rPr><w:t xml:space="preserve"> </w:t></w:r></w:p>');
            if (b.tipo === 'salto') return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
            if (b.tipo === 'crudo') return b.x;
            return xmlParrafo(b);
          }).join('');
          var pie = o.pie || '';
          var doc = CAB + '<w:document ' + NS + NS_DIB + '><w:body>' + cuerpo + '<w:p/>' +
            '<w:sectPr><w:footerReference w:type="default" r:id="rIdPie"/><w:pgSz w:w="' + anchoPag + '" w:h="' + altoPag + '"' + (horizontal ? ' w:orient="landscape"' : '') + '/>' +
            '<w:pgMar w:top="' + Math.round(mS * DXA) + '" w:right="' + Math.round(mD * DXA) + '" w:bottom="' + Math.round(mF * DXA) + '" w:left="' + Math.round(mI * DXA) + '" w:header="432" w:footer="360" w:gutter="0"/>' +
            '<w:cols w:space="708"/></w:sectPr></w:body></w:document>';
          var footer = CAB + '<w:ftr ' + NS + '><w:p><w:pPr><w:pStyle w:val="Footer"/><w:tabs><w:tab w:val="right" w:pos="' + Math.round(util * DXA) + '"/></w:tabs></w:pPr>' +
            runs(pie) + '<w:r><w:tab/></w:r>' + runs('Página ') + '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>' +
            runs(' de ') + '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
          var archivos = [
            { nombre: '[Content_Types].xml', datos: CAB + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
              '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
              '<Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/>' +
              '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
              '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
              '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>' +
              '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
              '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
              '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
              '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>' },
            { nombre: '_rels/.rels', datos: CAB + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
              '<Relationship Id="rId1" Type="' + REL + 'officeDocument" Target="word/document.xml"/>' +
              '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
              '<Relationship Id="rId3" Type="' + REL + 'extended-properties" Target="docProps/app.xml"/></Relationships>' },
            { nombre: 'docProps/core.xml', datos: CAB + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
              '<dc:title>' + x(o.titulo || 'Documento') + '</dc:title><dc:creator>' + x(o.autor || '') + '</dc:creator>' +
              '<dcterms:created xsi:type="dcterms:W3CDTF">' + new Date().toISOString().replace(/\.\d+Z$/, 'Z') + '</dcterms:created>' +
              '<dcterms:modified xsi:type="dcterms:W3CDTF">' + new Date().toISOString().replace(/\.\d+Z$/, 'Z') + '</dcterms:modified></cp:coreProperties>' },
            { nombre: 'docProps/app.xml', datos: CAB + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>' + x(o.programa || 'La mochila del gestor') + '</Application></Properties>' },
            { nombre: 'word/_rels/document.xml.rels', datos: CAB + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
              '<Relationship Id="rIdEst" Type="' + REL + 'styles" Target="styles.xml"/><Relationship Id="rIdAju" Type="' + REL + 'settings" Target="settings.xml"/>' +
              '<Relationship Id="rIdNum" Type="' + REL + 'numbering" Target="numbering.xml"/><Relationship Id="rIdPie" Type="' + REL + 'footer" Target="footer1.xml"/>' +
              imagenes.map(function (im) { return '<Relationship Id="' + im.id + '" Type="' + REL + 'image" Target="media/imagen' + im.n + '.' + im.ext + '"/>'; }).join('') + '</Relationships>' },
            { nombre: 'word/document.xml', datos: doc },
            { nombre: 'word/styles.xml', datos: estilos(o) },
            { nombre: 'word/settings.xml', datos: CAB + '<w:settings ' + NS + '><w:defaultTabStop w:val="708"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>' },
            { nombre: 'word/numbering.xml', datos: CAB + '<w:numbering ' + NS + '><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>' +
              '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="300" w:hanging="200"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="' + aclarar('#' + acento, 0.8) + '"/></w:rPr></w:lvl>' +
              '</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>' },
            { nombre: 'word/footer1.xml', datos: footer }
          ];
          imagenes.forEach(function (im) { archivos.push({ nombre: 'word/media/imagen' + im.n + '.' + im.ext, datos: im.bytes }); });
          return zip(archivos);
        });
      },
      descargar: function (nombre) {
        return api.blob().then(function (b) {
          var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nombre;
          document.body.appendChild(a); a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
          return b;
        });
      }
    };
    return api;
  };

  function estilos(o) {
    var f = o.fuente || 'Calibri';
    return CAB + '<w:styles ' + NS + '><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="' + f + '" w:hAnsi="' + f + '" w:eastAsia="' + f + '" w:cs="' + f + '"/>' +
      '<w:color w:val="1D2A2E"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="es-MX" w:eastAsia="es-MX" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>' +
      '<w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/>' +
      '<w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="' + f + '" w:hAnsi="' + f + '"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/>' +
      '<w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="160" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:rFonts w:ascii="' + f + '" w:hAnsi="' + f + '"/><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="99"/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:color w:val="7B898C"/><w:sz w:val="15"/><w:szCs w:val="15"/></w:rPr></w:style>' +
      '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/>' +
      '<w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>' +
      '</w:styles>';
  }

  /* Prepara una imagen: bytes, formato y tamaño que cabe en su caja */
  function preparar(im) {
    return new Promise(function (listo) {
      var src = im.src, m = /^data:image\/(png|jpe?g);base64,(.*)$/i.exec(src || '');
      function conBytes(b64, ext, w, h) {
        var bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        im.bytes = bytes; im.ext = ext;
        var k = Math.min(im.ancho / (w || 1), im.alto / (h || 1));
        im.w = Math.max(0.05, (w || 1) * k); im.h = Math.max(0.05, (h || 1) * k);
        listo();
      }
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || 1, h = img.naturalHeight || 1;
        if (m) conBytes(m[2], /png/i.test(m[1]) ? 'png' : 'jpeg', w, h);
        else {
          try {
            var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0);
            conBytes(c.toDataURL('image/png').split(',')[1], 'png', w, h);
          } catch (e) { conBytes(PIXEL, 'png', 1, 1); }
        }
      };
      img.onerror = function () { conBytes(PIXEL, 'png', 1, 1); };
      img.src = src;
    });
  }
  var PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axxm6oAAAAASUVORK5CYII=';

  /* ---------- Piezas que comparten las herramientas ---------- */
  /* El membrete: logo, nombre y contacto a la izquierda; el tipo de documento a la derecha */
  M.docxMembrete = function (d, m, derecha) {
    derecha = derecha || {};
    var logo = m.logo || (M.lienzo ? M.lienzo.iniciales(m, 160) : '');
    var contacto = [m.telefono && 'Tel. ' + m.telefono, m.correo, m.lugar, m.rfc && 'RFC ' + m.rfc, m.web].filter(Boolean).join('   ·   ');
    var quien = [{ c: [{ t: m.nombre || 'Tu nombre o el de tu negocio', b: true, tam: 15, color: m.nombre ? '#1D2A2E' : '#7B898C' }], f: { despues: 1 } }];
    if (m.giro) quien.push({ c: [{ t: m.giro, tam: 9.5, color: '#4B5A5E' }], f: { despues: 2 } });
    if (contacto) quien.push({ c: [{ t: contacto, tam: 8.3, color: '#4B5A5E' }] });
    var der = [];
    if (derecha.tipo) der.push({ c: [{ t: derecha.tipo, tam: derecha.tamTipo || 20, color: d.acento }], f: { alin: 'der', despues: 2 } });
    if (derecha.folio) der.push({ c: [{ t: derecha.folio, tam: 9, color: '#4B5A5E' }], f: { alin: 'der' } });
    var anchoDer = derecha.ancho || 2.1, anchoLogo = 0.95;
    d.tabla({
      anchos: [anchoLogo, d.util - anchoLogo - anchoDer, anchoDer], vAlin: 'center', margenCelda: 0.04,
      bordes: { bottom: { c: d.suave(0.55), g: 0.75 } },
      filas: [[{ img: d.img(logo, 0.82, 0.82), mar: 0.06 }, { parrafos: quien }, { parrafos: der.length ? der : [{ c: '' }] }]]
    });
  };
  /* La cabeza de un producto de trabajo: qué es a la izquierda y la fecha a la derecha, sin logo */
  M.docxTitulo = function (d, o) {
    var anchoDer = 2.4;
    d.tabla({
      anchos: [d.util - anchoDer, anchoDer], vAlin: 'bottom', margenCelda: 0.04,
      bordes: { bottom: { c: d.suave(0.55), g: 0.75 } },
      filas: [[{ parrafos: [{ c: [{ t: o.tipo || '', tam: o.tamTipo || 20, color: d.acento }] }] },
        { parrafos: [{ c: [{ t: o.folio || '', tam: 9, color: '#4B5A5E' }], f: { alin: 'der' } }] }]]
    });
  };
  /* Una firma: imagen o espacio, la línea, el nombre y el cargo */
  M.docxFirmas = function (d, firmas) {
    var ancho = Math.min(2.7, (d.util - 0.4 * (firmas.length - 1)) / firmas.length);
    var anchos = [];
    firmas.forEach(function (f, i) { if (i) anchos.push(0.4); anchos.push(ancho); });
    // Tres filas: lo que se firma, el trazo con su raya, y el nombre con el cargo
    var fila1 = [], fila2 = [], fila3 = [];
    firmas.forEach(function (f, i) {
      if (i) { fila1.push(''); fila2.push(''); fila3.push(''); }
      fila1.push({ t: [{ t: f.que || '', tam: 7.8, color: '#7B898C' }], alin: 'centro' });
      fila2.push(f.img ? { img: d.img(f.img, 2.2, 0.6), alin: 'centro', vAlin: 'bottom', bordes: { bottom: { c: '#1D2A2E', g: 0.75 } } } :
        { t: [{ t: ' ', tam: 26 }], alin: 'centro', vAlin: 'bottom', bordes: { bottom: { c: '#1D2A2E', g: 0.75 } } });
      fila3.push({ parrafos: [{ c: [{ t: f.nombre || ' ', b: true, tam: 9.2 }], f: { alin: 'centro', antes: 3 } }].concat(f.cargo ? [{ c: [{ t: f.cargo, tam: 8, color: '#4B5A5E' }], f: { alin: 'centro' } }] : []) });
    });
    var total = anchos.reduce(function (s, a) { return s + a; }, 0);
    d.espacio(14);
    d.tabla({ anchos: anchos, alin: total < d.util - 0.1 ? 'der' : null, margenCelda: 0.02, filas: [fila1, fila2, fila3] });
  };
  /* Una tabla de datos con el estilo de las hojas: encabezado con raya de acento, renglones con filete */
  M.docxTablaDatos = function (d, columnas, filas, o) {
    o = o || {};
    var anchos = columnas.map(function (c) { return c.ancho; });
    var fil = '#DCE2E3';
    var cab = columnas.map(function (c) { return { t: [{ t: c.t, tam: 7.8, color: '#7B898C' }], alin: c.alin, bordes: { bottom: { c: d.acento, g: 1 } } }; });
    var cuerpo = filas.map(function (f) {
      if (f && f.grupo) return { celdas: [{ parrafos: [{ c: [{ t: f.grupo, b: true, tam: 8.6, color: d.acento }], f: { junto: true } }], span: columnas.length, bordes: { bottom: { c: d.suave(0.55), g: 0.5 } }, antes: 6 }] };
      if (f && f.celdas) return f;
      var col = 0;
      return f.map(function (cel) {
        var c = (cel && typeof cel === 'object' && !Array.isArray(cel)) ? Object.assign({}, cel) : { t: cel };
        if (!c.alin && columnas[col]) c.alin = columnas[col].alin;
        col += c.span > 1 ? c.span : 1;
        if (!c.bordes) c.bordes = { bottom: { c: fil, g: 0.5 } };
        return c;
      });
    });
    d.tabla({ anchos: anchos, encabezado: 1, tam: o.tam || 9.2, margenCelda: o.margen != null ? o.margen : 0.06, margenV: 0.045, filas: [cab].concat(cuerpo) });
  };
})();
