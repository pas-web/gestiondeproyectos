/* La mochila del gestor · una cosa a la vez
   Cada herramienta se parte en preguntas (.pregunta), agrupadas en tramos. Se ve
   una pregunta a la vez; la hoja de al lado ilumina la parte que se está
   escribiendo ([data-parte] en la hoja, data-foco en la pregunta) y late cuando
   cambia. En el celular, una ventanita enseña cómo va la hoja. */
(function () {
  'use strict';
  var M = window.M;
  var esc = M.esc;
  var puntero = window.matchMedia && matchMedia('(pointer: fine)').matches;
  function celular() { return window.matchMedia ? matchMedia('(max-width: 1020px)').matches : window.innerWidth <= 1020; }

  /* ---------- El membrete, partido en preguntas ---------- */
  M.vistaMembrete = function (m) {
    var logo = m.logo ? '<img alt="" src="' + m.logo + '">' : '<span class="mono" style="background:' + esc(m.color || '#0B3C49') + '">' + esc(M.membrete.iniciales(m.nombre || 'Tu nombre')) + '</span>';
    var contacto = [m.telefono, m.correo, m.lugar].filter(Boolean).map(esc).join('<br>');
    return '<div class="tarjeta-membrete" style="--acento:' + esc(m.color || '#0B3C49') + '"><div class="tm-logo">' + logo + '</div><div class="tm-quien">' +
      '<b>' + esc(m.nombre || 'Sin nombre todavía') + '</b>' + (m.giro ? '<span>' + esc(m.giro) + '</span>' : '') + (contacto ? '<small>' + contacto + '</small>' : '') + '</div></div>';
  };
  M.preguntasMembrete = function () {
    var colores = M.COLORES.map(function (c) {
      return '<label title="' + c[1] + '"><input type="radio" name="m-color" value="' + c[0] + '" data-mk="color"><span style="background:' + c[0] + '"></span><span class="sr">' + c[1] + '</span></label>';
    }).join('');
    var T = 'data-tramo="Tu membrete" data-foco="membrete"';
    return '' +
      '<section class="pregunta" data-paso="mb-listo" data-si="membreteListo" ' + T + '>' +
      '<h2>Este es tu membrete</h2><p class="porque">Sale arriba en tus cotizaciones y en tus recibos, que son lo único que lleva tu logo. Se llena una vez y se queda en este navegador.</p>' +
      '<div id="vista-membrete"></div>' +
      '<p><button type="button" class="btn claro chico" data-accion="editar-membrete">Cambiar algo del membrete</button></p></section>' +

      '<section class="pregunta" data-paso="mb-nombre" data-si="membreteEditar" ' + T + '>' +
      '<h2>¿Cómo te llamas, o cómo se llama tu negocio?</h2><p class="porque">Va arriba y en grande, en cada hoja. Puede ser tu nombre, el de tu despacho o el de tu grupo de trabajo.</p>' +
      '<div class="campo"><label for="m-nombre" class="sr">Tu nombre o el de tu negocio</label><input id="m-nombre" type="text" class="grande" data-mk="nombre" data-requerido="tu nombre o el de tu negocio" autocomplete="organization" placeholder="Tu nombre o el de tu negocio"></div>' +
      '<div class="ejemplos" data-para="m-nombre"><span>Por ejemplo</span><button type="button">Raíz Viva, asesoría agroecológica</button><button type="button">Ana López Martínez</button></div></section>' +

      '<section class="pregunta" data-paso="mb-giro" data-si="membreteEditar" ' + T + '>' +
      '<h2>¿A qué te dedicas, en una línea?</h2><p class="porque">Le dice a quien recibe la hoja qué haces, antes de leer el resto.</p>' +
      '<div class="campo"><label for="m-giro" class="sr">A qué te dedicas</label><input id="m-giro" type="text" class="grande" data-mk="giro" placeholder="Lo que haces, en pocas palabras"></div>' +
      '<div class="ejemplos" data-para="m-giro"><span>Por ejemplo</span><button type="button">Capacitación y asesoría en producción agroecológica</button><button type="button">Proyectos de desarrollo rural</button><button type="button">Viveros y reforestación</button></div></section>' +

      '<section class="pregunta" data-paso="mb-contacto" data-si="membreteEditar" ' + T + '>' +
      '<h2>¿Cómo te encuentran?</h2><p class="porque">Lo mínimo para que te llamen o te escriban. Va debajo de tu nombre.</p>' +
      '<div class="campos">' +
      '<div class="campo c3"><label for="m-tel">Teléfono o WhatsApp</label><input id="m-tel" type="tel" data-mk="telefono" autocomplete="tel" placeholder="441 000 0000"></div>' +
      '<div class="campo c3"><label for="m-correo">Correo</label><input id="m-correo" type="email" data-mk="correo" autocomplete="email" placeholder="nombre@correo.com"></div>' +
      '<div class="campo"><label for="m-lugar">Municipio y estado</label><input id="m-lugar" type="text" data-mk="lugar" placeholder="Arroyo Seco, Querétaro"></div></div>' +
      '<details class="mas"><summary>Más datos, si los tienes</summary><div class="campos">' +
      '<div class="campo c3"><label for="m-rfc">RFC</label><input id="m-rfc" type="text" data-mk="rfc" autocomplete="off" style="text-transform:uppercase"></div>' +
      '<div class="campo c3"><label for="m-web">Página o red social</label><input id="m-web" type="text" data-mk="web" placeholder="facebook.com/raizviva"></div></div></details></section>' +

      '<section class="pregunta" data-paso="mb-cara" data-si="membreteEditar" ' + T + '>' +
      '<h2>La cara de tus documentos</h2><p class="porque">Tu logo y un color. Sin logo, la hoja lleva tus iniciales en un círculo.</p>' +
      '<div class="cara"><div class="logo-zona"><div class="logo-vista" id="m-logo-vista"></div><div><button type="button" class="btn claro chico" id="m-logo-subir">Subir logo</button><br><button type="button" class="btn-texto peligro" id="m-logo-quitar">Quitar el logo</button></div></div>' +
      '<div class="campo"><span class="etiqueta">El color</span><div class="colores" role="radiogroup" aria-label="Color de tus documentos">' + colores + '</div></div></div></section>' +

      '<section class="pregunta" data-paso="mb-firma" data-si="membreteEditar" data-tramo="Tu membrete" data-foco="firma">' +
      '<h2>¿Quién firma?</h2><p class="porque">El nombre bajo la línea de la firma y tu profesión o cargo. La firma en imagen es opcional; sin ella, la hoja trae la línea para firmar a mano.</p>' +
      '<div class="campos">' +
      '<div class="campo c3"><label for="m-fnombre">Nombre en la firma</label><input id="m-fnombre" type="text" data-mk="firmaNombre" placeholder="Si lo dejas vacío, va el de arriba"></div>' +
      '<div class="campo c3"><label for="m-titulo">Profesión o cargo</label><input id="m-titulo" type="text" data-mk="titulo" placeholder="Lic. en Producción Agropecuaria Sustentable"></div>' +
      '<div class="campo"><span class="etiqueta">Tu firma en imagen</span><div class="logo-zona"><div class="logo-vista" id="m-firma-vista" style="width:150px"></div><div><button type="button" class="btn claro chico" id="m-firma-subir">Subir firma</button><br><button type="button" class="btn-texto peligro" id="m-firma-quitar">Quitar la firma</button></div></div>' +
      '<span class="ayuda">Firma con tinta negra en una hoja blanca y tómale una foto de cerca.</span></div></div>' +
      '<p class="ayuda" style="margin-top:16px">Todo esto vive en este navegador. En un aparato prestado, bórralo al terminar. <button type="button" class="btn-texto peligro" id="m-borrar">Borrar mis datos de este navegador</button></p></section>';
  };
  M.enlazarMembrete = function (raiz, alCambiar) {
    var m = M.membrete.leer();
    function pintarVistas() {
      var lv = M.$('#m-logo-vista', raiz), fv = M.$('#m-firma-vista', raiz), vm = M.$('#vista-membrete', raiz);
      if (lv) lv.innerHTML = m.logo ? '<img alt="Tu logo" src="' + m.logo + '">' : '<div class="mono" style="background:' + esc(m.color) + '">' + esc(M.membrete.iniciales(m.nombre)) + '</div>';
      if (fv) fv.innerHTML = m.firma ? '<img alt="Tu firma" src="' + m.firma + '">' : '<span class="ayuda">sin firma</span>';
      var lq = M.$('#m-logo-quitar', raiz), fq = M.$('#m-firma-quitar', raiz);
      if (lq) lq.style.visibility = m.logo ? 'visible' : 'hidden';
      if (fq) fq.style.visibility = m.firma ? 'visible' : 'hidden';
      if (vm) vm.innerHTML = M.vistaMembrete(m);
    }
    function llenarMembrete() {
      M.$$('[data-mk]', raiz).forEach(function (el) {
        var v = m[el.dataset.mk];
        if (el.type === 'radio') el.checked = el.value === v; else if (document.activeElement !== el) el.value = v || '';
      });
      pintarVistas();
    }
    function cambio() { M.membrete.guardar(m); pintarVistas(); if (alCambiar) alCambiar(m); }
    raiz.addEventListener('input', function (e) {
      var el = e.target; if (!el.dataset || !el.dataset.mk) return;
      if (el.type === 'radio' && !el.checked) return;
      m[el.dataset.mk] = el.dataset.mk === 'rfc' ? el.value.toUpperCase() : el.value; cambio();
    });
    raiz.addEventListener('change', function (e) { var el = e.target; if (el.type === 'radio' && el.dataset.mk && el.checked) { m[el.dataset.mk] = el.value; cambio(); } });
    function subir(clave, lado) {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = function () { var f = inp.files && inp.files[0]; if (f) M.leerImagen(f, lado, function (url) { m[clave] = url; cambio(); }); };
      inp.click();
    }
    function al(id, f) { var el = M.$(id, raiz); if (el) el.onclick = f; }
    al('#m-logo-subir', function () { subir('logo', 520); });
    al('#m-firma-subir', function () { subir('firma', 640); });
    al('#m-logo-quitar', function () { m.logo = ''; cambio(); });
    al('#m-firma-quitar', function () { m.firma = ''; cambio(); });
    al('#m-borrar', function () {
      (M.confirmar || function (t) { return Promise.resolve(window.confirm(t)); })('Se borra de este navegador todo lo de la mochila: tu membrete y todos tus documentos guardados. Si quieres conservar algo, descárgalo antes. ¿Borrar?')
        .then(function (si) { if (si) { M.borrarTodo(); window.location.reload(); } });
    });
    llenarMembrete();
    return { recargar: function () { m = M.membrete.leer(); llenarMembrete(); }, leer: function () { return m; } };
  };

  /* ---------- Los ejemplos que se tocan para llenar ---------- */
  function enlazarEjemplos(raiz) {
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('.ejemplos button'); if (!b) return;
      var caja = b.closest('.ejemplos'), id = caja.dataset.para, inp = id && document.getElementById(id);
      if (!inp) return;
      if (caja.dataset.modo === 'renglon' || inp.tagName === 'TEXTAREA' && caja.dataset.modo !== 'reemplazar') {
        var ls = inp.value.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
        if (ls.indexOf(b.textContent) < 0) ls.push(b.textContent);
        inp.value = ls.join('\n');
      } else inp.value = b.textContent;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      if (puntero) inp.focus();
    });
  }

  /* ---------- La guía ---------- */
  M.guia = function (o) {
    var raiz = o.raiz, marco = o.marco;
    var preguntas = [], porId = {}, tramos = [];
    /* Lee las preguntas. Se vuelve a llamar cuando la página las cambia (reconstruir) */
    function escanear() {
      preguntas = M.$$('.pregunta', o.secciones || raiz);
      porId = {}; tramos = [];
      preguntas.forEach(function (p) {
        porId[p.dataset.paso] = p;
        var t = tramos.filter(function (x) { return x.nombre === p.dataset.tramo; })[0];
        if (!t) { t = { nombre: p.dataset.tramo, pasos: [] }; tramos.push(t); }
        t.pasos.push(p); p.tramo = t;
        if (p._guia) return;
        p._guia = true;
        var donde = document.createElement('p'); donde.className = 'donde'; p.insertBefore(donde, p.firstChild);
        var h = p.querySelector('h2'); if (h) { h.id = h.id || 'q-' + p.dataset.paso; p.setAttribute('aria-labelledby', h.id); }
        p.setAttribute('role', 'group'); p.hidden = true;
      });
    }
    escanear();
    var editandoMembrete = o.membrete ? !M.membrete.leer().nombre : false;
    var si = { membreteListo: function () { return !editandoMembrete; }, membreteEditar: function () { return editandoMembrete; } };
    for (var k in (o.si || {})) si[k] = o.si[k];
    var actual = null, latir = false;

    /* El camino de arriba */
    var camino = document.createElement('nav'); camino.className = 'camino'; camino.setAttribute('aria-label', 'Los tramos del documento');
    function listaCamino() {
      return tramos.map(function (t, i) {
        return '<li><button type="button" data-tramo="' + i + '"><span class="num">' + (i + 1) + '</span><span class="nom">' + esc(t.nombre) + '</span></button></li>';
      }).join('');
    }
    camino.innerHTML = '<ol class="camino-lista">' + listaCamino() + '</ol><div class="avance" aria-hidden="true"><i></i></div><div class="camino-pie"><span class="cuenta-pasos"></span><button type="button" class="btn-texto indice">Ver todos los pasos</button></div>';
    var ancla = o.secciones || preguntas[0];
    ancla.parentNode.insertBefore(camino, ancla);

    /* Lo que se dice cuando falta algo, y los botones de abajo */
    var falta = document.createElement('p'); falta.className = 'falta'; falta.hidden = true; falta.setAttribute('role', 'status');
    var pie = document.createElement('div'); pie.className = 'pie-guia';
    pie.innerHTML = '<button type="button" class="btn claro atras">Atrás</button><button type="button" class="btn claro ver-hoja">Ver la hoja</button><button type="button" class="btn seguir">Siguiente</button>';
    raiz.appendChild(falta); raiz.appendChild(pie);

    /* La ventanita del celular */
    var ventana = document.createElement('button'); ventana.type = 'button'; ventana.className = 'ventanita';
    ventana.setAttribute('aria-label', 'Ver la hoja completa');
    ventana.innerHTML = '<span class="rot">Así va tu hoja</span><span class="marco-mini"></span><span class="ver">Ver completa</span>';
    raiz.insertBefore(ventana, falta);

    function visible(p) { var c = p.dataset.si; return !c || !si[c] || !!si[c](); }
    function lista() { return preguntas.filter(visible); }
    function requeridos(p) { return M.$$('[data-requerido]', p); }
    function lleno(el) { return el.type === 'checkbox' ? el.checked : String(el.value || '').trim() !== ''; }
    function estado() { var s = o.estado(); if (!s.guia) s.guia = { paso: '', visto: {} }; if (!s.guia.visto) s.guia.visto = {}; return s.guia; }
    /* La página puede decir si un paso está listo: con un objeto por paso o con una función */
    function listoDeLaPagina(id, p) {
      if (typeof o.listo === 'function') return o.listo(id, p);
      if (o.listo && o.listo[id]) return !!o.listo[id]();
      return undefined;
    }
    function listo(p) {
      var id = p.dataset.paso, a = listoDeLaPagina(id, p);
      if (a !== undefined && a !== null) return !!a;
      var r = requeridos(p);
      if (r.length) return r.every(lleno);
      if (/^mb-/.test(id)) return !!M.membrete.leer().nombre;
      if (estado().visto[id]) return true;
      // Sin requeridos: cuenta como lleno si ya trae algo escrito
      return M.$$('input[type=text], input[type=number], input[type=email], input[type=tel], input[type=date], textarea', p).some(function (el) { return (el.dataset.k || el.dataset.mk) && lleno(el); });
    }
    function faltan() {
      var l = [];
      lista().forEach(function (p) {
        var id = p.dataset.paso;
        if (listoDeLaPagina(id, p) === false && p.dataset.falta) l.push({ paso: id, t: p.dataset.falta, tramo: p.tramo.nombre });
        requeridos(p).forEach(function (el) { if (!lleno(el)) l.push({ paso: id, t: el.dataset.requerido, tramo: p.tramo.nombre }); });
      });
      return l;
    }

    function pintarCamino() {
      var vis = lista(), hechos = vis.filter(listo).length;
      M.$$('.camino-lista button', camino).forEach(function (b) {
        var t = tramos[+b.dataset.tramo], suyos = t ? t.pasos.filter(visible) : [];
        var es = !!(actual && porId[actual] && porId[actual].tramo === t);
        b.parentNode.hidden = !suyos.length;
        b.classList.toggle('actual', !!es);
        b.classList.toggle('hecho', !es && suyos.length && suyos.every(listo));
        b.setAttribute('aria-current', es ? 'step' : 'false');
      });
      var n = 0; M.$$('.camino-lista li', camino).forEach(function (li) { if (!li.hidden) li.querySelector('.num').textContent = ++n; });
      M.$('.avance i', camino).style.width = (100 * hechos / Math.max(1, vis.length)).toFixed(1) + '%';
      var i = vis.indexOf(porId[actual]);
      M.$('.cuenta-pasos', camino).textContent = 'Paso ' + (i + 1) + ' de ' + vis.length;
    }
    function pintarDonde(p) {
      var suyos = p.tramo.pasos.filter(visible), i = suyos.indexOf(p);
      M.$('.donde', p).innerHTML = '<span class="tramo">' + esc(p.tramo.nombre) + '</span>' + (suyos.length > 1 ? '<span class="de">' + (i + 1) + ' de ' + suyos.length + '</span>' : '');
    }
    function pintarPie() {
      if (!actual || !porId[actual]) return;
      var vis = lista(), i = vis.indexOf(porId[actual]);
      M.$('.atras', pie).style.visibility = i > 0 ? 'visible' : 'hidden';
      var ult = i === vis.length - 1, sig = M.$('.seguir', pie);
      sig.hidden = ult;
      sig.textContent = porId[actual].dataset.seguir || (vis[i + 1] && vis[i + 1].tramo !== porId[actual].tramo ? 'Siguiente: ' + vis[i + 1].tramo.nombre.replace(/^./, function (x) { return x.toLowerCase(); }) : 'Siguiente');
      if (celular() && sig.textContent.length > 18) sig.textContent = 'Siguiente';
    }

    /* Ilumina en la hoja la parte que se está llenando */
    function aplicarFoco() {
      var hoja = marco.querySelector('.hoja'); if (!hoja || !actual || !porId[actual]) return;
      var claves = (porId[actual].dataset.foco || '').split(/\s+/).filter(Boolean);
      var primero = null;
      M.$$('[data-parte]', hoja).forEach(function (el) {
        var partes = el.dataset.parte.split(/\s+/), si2 = claves.some(function (c) { return partes.indexOf(c) >= 0; });
        el.classList.toggle('en-foco', si2);
        if (si2 && !primero) primero = el;
      });
      hoja.classList.toggle('con-foco', !!primero);
      return primero;
    }
    function seguirFoco(suave) {
      var f = aplicarFoco(), panel = o.panel;
      if (f && panel && !celular() && panel.scrollHeight > panel.clientHeight + 4) {
        var pr = panel.getBoundingClientRect(), fr = f.getBoundingClientRect();
        var meta = panel.scrollTop + (fr.top - pr.top) - Math.min(140, panel.clientHeight * 0.22);
        if (fr.top < pr.top + 60 || fr.bottom > pr.bottom - 40) panel.scrollTo({ top: Math.max(0, meta), behavior: suave ? 'smooth' : 'auto' });
      }
      pintarVentana();
    }
    function pintarVentana() {
      if (!celular()) return;
      var mini = M.$('.marco-mini', ventana), hoja = marco.querySelector('.hoja');
      if (!hoja) return;
      var copia = hoja.cloneNode(true); copia.style.transform = ''; copia.style.position = 'absolute'; copia.style.left = '0'; copia.style.top = '0';
      mini.innerHTML = ''; mini.appendChild(copia);
      var W = mini.clientWidth || 320, H = mini.clientHeight || 190, ancho = copia.offsetWidth || 816;
      var k = Math.max(W / ancho, 0.5);
      var f = copia.querySelector('.en-foco'), fx = 0, fy = 0, fw = ancho, fh = 0;
      if (f) {
        var r0 = copia.getBoundingClientRect(), r1 = f.getBoundingClientRect();
        fx = r1.left - r0.left; fy = r1.top - r0.top; fw = r1.width; fh = r1.height;
      }
      var dx = Math.max(0, Math.min(ancho * k - W, (fx + fw / 2) * k - W / 2));
      var dy = Math.max(0, Math.min(copia.offsetHeight * k - H, (fy + Math.min(fh, H / k) / 2) * k - H / 2));
      if (!f) { dx = 0; dy = 0; }
      copia.style.transformOrigin = 'top left';
      copia.style.transform = 'translate(' + (-dx).toFixed(1) + 'px,' + (-dy).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
    }
    var pintarVentanaLuego = M.debounce(pintarVentana, 140);
    if (window.MutationObserver) {
      new MutationObserver(function () {
        var f = aplicarFoco();
        if (latir && f) {
          M.$$('.en-foco', marco).forEach(function (el) { el.classList.remove('late'); void el.offsetWidth; el.classList.add('late'); });
        }
        latir = false;
        pintarVentanaLuego();
        pintarCamino();
      }).observe(marco, { childList: true });
    }
    raiz.addEventListener('input', function () { latir = true; ocultarFalta(); });
    raiz.addEventListener('change', function () { latir = true; });

    function ocultarFalta() { if (!falta.hidden) { falta.hidden = true; insistir = null; pintarPie(); } }
    var insistir = null;
    function ir(id, op) {
      op = op || {};
      var p = porId[id];
      if (!p || !visible(p)) { var vis = lista(); p = vis[0]; id = p.dataset.paso; }
      var antes = actual;
      if (antes && porId[antes]) porId[antes].hidden = true;
      actual = id; p.hidden = false;
      p.classList.remove('entra', 'entra-atras'); void p.offsetWidth;
      if (antes && antes !== id) p.classList.add(op.atras ? 'entra-atras' : 'entra');
      var g = estado(); g.paso = id; g.visto[id] = 1;
      falta.hidden = true; insistir = null;
      pintarDonde(p); pintarCamino(); pintarPie();
      if (o.alEntrar && o.alEntrar[id]) o.alEntrar[id](p);
      if (o.alCambiarPaso) o.alCambiarPaso(id, p);
      seguirFoco(true);
      if (!op.sinScroll) {
        var top = camino.getBoundingClientRect().top + window.scrollY - 70;
        if (window.scrollY > top + 10 || celular()) window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
      }
      if (puntero && !op.sinFoco) {
        var f = p.querySelector('input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea, select');
        if (f && !f.closest('details:not([open])')) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }, 30);
      }
      if (o.guardar && o.estado().tocado) o.guardar();
    }
    /* Antes de moverse, la página puede volver a dibujar sus preguntas si cambió cuántas hay */
    function mover() { if (o.antesDeMover) o.antesDeMover(); }
    function siguiente() {
      mover();
      var p = porId[actual], vis = lista(), i = vis.indexOf(p);
      var r = requeridos(p).filter(function (el) { return !lleno(el); });
      if (r.length && insistir !== actual) {
        insistir = actual;
        falta.textContent = 'Falta ' + r.map(function (el) { return el.dataset.requerido; }).join(' y ') + '. Puedes seguir y volver después.';
        falta.hidden = false;
        M.$('.seguir', pie).textContent = 'Seguir sin esto';
        try { r[0].focus({ preventScroll: true }); } catch (e) { r[0].focus(); }
        return;
      }
      if (o.antesDeSeguir && o.antesDeSeguir[actual] && o.antesDeSeguir[actual]() === false) return;
      if (i < vis.length - 1) ir(vis[i + 1].dataset.paso);
    }
    function atras() {
      mover();
      var vis = lista(), i = vis.indexOf(porId[actual]);
      if (i > 0) ir(vis[i - 1].dataset.paso, { atras: true });
    }
    M.$('.seguir', pie).onclick = siguiente;
    M.$('.atras', pie).onclick = atras;
    M.$('.ver-hoja', pie).onclick = function () { M.verVista('hoja'); };
    ventana.onclick = function () { M.verVista('hoja'); };
    camino.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tramo]');
      if (b) mover();
      if (b) { var t = tramos[+b.dataset.tramo], v = t.pasos.filter(visible); if (v.length) ir(v[0].dataset.paso, { atras: lista().indexOf(v[0]) < lista().indexOf(porId[actual]) }); return; }
      if (e.target.closest('.indice')) indice();
    });
    raiz.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      var el = e.target;
      if (!el.matches || !el.matches('.pregunta input:not([type=checkbox]):not([type=radio]):not([type=file])')) return;
      if (el.closest('[data-sin-enter]')) return;
      e.preventDefault(); siguiente();
    });
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-accion="editar-membrete"]');
      if (b) { editandoMembrete = true; ir('mb-nombre'); return; }
      var irA = e.target.closest('[data-ir]');
      if (irA) { e.preventDefault(); mover(); ir(irA.dataset.ir); }
    });
    enlazarEjemplos(raiz);

    /* Todos los pasos, para saltar a cualquiera */
    function indice() {
      mover();
      var d = M.cajon('cajon-indice', 'Todos los pasos');
      var n = 0;
      M.$('.cuerpo-cajon', d).innerHTML = '<ol class="indice-pasos">' + tramos.map(function (t) {
        var v = t.pasos.filter(visible); if (!v.length) return '';
        n++;
        return '<li><b>' + n + '. ' + esc(t.nombre) + '</b><ul>' + v.map(function (p) {
          var h = p.querySelector('h2'), ok = listo(p), es = p.dataset.paso === actual;
          return '<li class="' + (ok ? 'listo' : '') + (es ? ' aqui' : '') + '"><button type="button" class="btn-texto" data-ir-indice="' + p.dataset.paso + '">' + esc(h ? h.textContent : p.dataset.paso) + '</button>' + (es ? '<span class="ayuda"> aquí vas</span>' : '') + '</li>';
        }).join('') + '</ul></li>';
      }).join('') + '</ol>';
      M.$('.cuerpo-cajon', d).onclick = function (e) {
        var b = e.target.closest('[data-ir-indice]'); if (!b) return;
        M.cerrarCajon(d); mover(); ir(b.dataset.irIndice);
      };
      M.abrirCajon(d);
    }

    window.addEventListener('resize', M.debounce(function () { pintarVentana(); }, 200));
    var api = {
      ir: ir, siguiente: siguiente, atras: atras, actual: function () { return actual; },
      faltan: faltan, indice: indice,
      refrescar: function () { if (actual && (!porId[actual] || !visible(porId[actual]))) { var v = lista(); ir(v[0].dataset.paso, { sinScroll: true, sinFoco: true }); } pintarCamino(); pintarPie(); if (actual) pintarDonde(porId[actual]); seguirFoco(false); },
      /* La página volvió a dibujar sus preguntas (cambió cuántas hay): se leen de nuevo y
         se queda en el mismo paso; si ya no existe, en el que ocupa su lugar */
      reconstruir: function () {
        var antes = actual, i0 = antes && porId[antes] ? lista().indexOf(porId[antes]) : 0;
        escanear();
        M.$('.camino-lista', camino).innerHTML = listaCamino();
        var p = antes && porId[antes];
        if (p && visible(p)) {
          p.hidden = false; pintarDonde(p); pintarCamino(); pintarPie(); seguirFoco(false);
          return;
        }
        actual = null;
        var v = lista(); if (!v.length) return;
        ir(v[Math.max(0, Math.min(i0, v.length - 1))].dataset.paso, { sinScroll: true, sinFoco: true });
      },
      paso: function (id) { return porId[id] || null; },
      /* Abre un documento: vuelve a donde se quedó, o al primer paso que toca */
      abrir: function (op) {
        op = op || {};
        var g = estado();
        var destino = op.paso || (g.paso && porId[g.paso] ? g.paso : '');
        if (!destino) { var v = lista(); destino = (op.primero && porId[op.primero] && visible(porId[op.primero])) ? op.primero : v[0].dataset.paso; }
        ir(destino, { sinScroll: true, sinFoco: !!op.sinFoco });
      },
      editarMembrete: function (siNo) { editandoMembrete = !!siNo; api.refrescar(); },
      pintarFaltan: function (cont) {
        var l = faltan();
        cont.innerHTML = l.length ? '<div class="pendientes"><b>Antes de entregar, revisa:</b><ul>' + l.map(function (x) {
          return '<li><a href="#" data-ir="' + esc(x.paso) + '">' + esc(x.t.replace(/^./, function (c) { return c.toUpperCase(); })) + '</a> <span class="ayuda">(' + esc(x.tramo) + ')</span></li>';
        }).join('') + '</ul></div>' : '<p class="todo-listo">Todo lo indispensable está lleno.</p>';
      }
    };
    return api;
  };

  /* ---------- Una lista que se llena de uno en uno ----------
     Arriba, los renglones ya puestos, en corto; abajo, el que se está llenando. */
  M.listaGuiada = function (o) {
    var actual = -1, todas = false, CORTA = 6;
    function filas() {
      var l = o.items();
      var desde = 0, hasta = l.length;
      if (!todas && l.length > CORTA + 1) { desde = Math.max(0, Math.min(actual - 2, l.length - CORTA)); hasta = desde + CORTA; }
      return l.map(function (x, i) {
        if (i < desde || i >= hasta) return '';
        var r = o.resumen(x, i) || {};
        return '<li class="rg-fila' + (i === actual ? ' actual' : '') + '"' + (r.color ? ' style="--color:' + esc(r.color) + '"' : '') + '>' +
          '<span class="rg-n">' + (r.n || i + 1) + '</span><span class="rg-t' + (r.t ? '' : ' vacio-t') + '">' + esc(r.t || o.sinNombre || 'Sin nombre todavía') + '</span>' +
          (r.d ? '<span class="rg-d">' + esc(r.d) + '</span>' : '') +
          '<span class="rg-a">' + (i === actual ? '<span class="rg-aqui">aquí</span>' : '<button type="button" data-rg-editar="' + i + '">Cambiar</button>') + '</span></li>';
      }).join('') + (l.length > CORTA + 1 ? '<li class="rg-mas"><button type="button" class="btn-texto" data-rg-todas>' + (todas ? 'Ver menos' : 'Ver los ' + l.length) + '</button></li>' : '');
    }
    function pintarFilas() { var ol = M.$('.rg-lista', o.cont); if (ol) ol.innerHTML = filas(); }
    function pintar() {
      var l = o.items();
      if (actual >= l.length) actual = l.length - 1;
      var lista = l.length ? '<p class="rg-van">' + esc(o.cuantos ? o.cuantos(l.length) : 'Ya van ' + l.length) + '</p><ol class="rg-lista">' + filas() + '</ol>' : '<p class="rg-vacio">' + esc(o.vacio || 'Todavía no hay nada.') + '</p>';
      var h = '';
      if (actual >= 0 && l[actual]) {
        h += '<div class="rg-editor" data-sin-enter><p class="rg-cual">' + esc(o.titulo ? o.titulo(l[actual], actual) : 'Renglón ' + (actual + 1)) + '</p>' + o.editor(l[actual], actual) +
          '<div class="rg-botones"><button type="button" class="btn claro" data-rg-otra>' + M.ico.mas + esc(o.textoOtra || 'Agregar otro') + '</button>' +
          (o.botones ? o.botones(l[actual], actual) : '') +
          '<button type="button" class="btn-texto peligro" data-rg-quitar="' + actual + '">' + esc(o.textoQuitar || 'Quitar') + '</button></div></div>';
      } else {
        h += '<button type="button" class="btn" data-rg-otra>' + M.ico.mas + esc(o.textoPrimero || o.textoOtra || 'Agregar') + '</button>';
      }
      o.cont.innerHTML = h + lista;
      if (o.llenar) o.llenar(o.cont);
      if (o.alPintar) o.alPintar(o.cont, actual);
    }
    function enfocar() {
      var f = M.$('.rg-editor input:not([type=checkbox]):not([type=radio]), .rg-editor textarea', o.cont);
      if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }, 20);
    }
    o.cont.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-rg-editar]'))) { actual = +b.dataset.rgEditar; pintar(); enfocar(); var ed = M.$('.rg-editor', o.cont); if (ed && ed.getBoundingClientRect().top < 60) ed.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      if (e.target.closest('[data-rg-todas]')) { todas = !todas; pintarFilas(); return; }
      if ((b = e.target.closest('[data-rg-otra]'))) {
        var i = o.agregar(); actual = i == null ? o.items().length - 1 : i; pintar(); enfocar();
        if (o.alCambiar) o.alCambiar(); return;
      }
      if ((b = e.target.closest('[data-rg-quitar]'))) {
        var j = +b.dataset.rgQuitar;
        Promise.resolve(o.quitar(j)).then(function (hecho) {
          if (hecho === false) return;
          var n = o.items().length; actual = Math.min(j, n - 1); pintar(); if (o.alCambiar) o.alCambiar();
        });
      }
    });
    return {
      pintar: pintar, filas: pintarFilas,
      editar: function (i) { actual = i; pintar(); },
      actual: function () { return actual; },
      /* Al entrar al paso: el primero sin nombre, o el último */
      empezar: function (esVacio) {
        var l = o.items(), i = -1;
        l.forEach(function (x, j) { if (i < 0 && esVacio && esVacio(x)) i = j; });
        actual = i >= 0 ? i : (actual >= 0 && actual < l.length ? actual : l.length - 1);
        pintar();
      }
    };
  };

  /* ---------- Entregar: PDF, Word, imagen, archivo ---------- */
  var ICO = {
    pdf: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/>',
    word: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="m8.5 11 1.2 6 1.8-4.5 1.8 4.5 1.2-6"/>',
    imagen: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4.5 18 5-5 3.5 3.5 2.5-2.5 4 4"/>',
    archivo: '<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 20h14"/>',
    texto: '<path d="M5 6h14M5 10h14M5 14h9"/><path d="M15 17.5 17 20l3-4"/>'
  };
  M.entregas = function (cont, opciones) {
    cont.innerHTML = '<div class="entregas">' + opciones.map(function (x, i) {
      return '<button type="button" class="entrega' + (x.principal ? ' principal' : '') + '" data-entrega="' + i + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICO[x.ico] || ICO.archivo) + '</svg>' +
        '<span class="t">' + esc(x.t) + '</span><span class="d">' + esc(x.d) + '</span></button>';
    }).join('') + '</div>';
    cont.onclick = function (e) {
      var b = e.target.closest('[data-entrega]'); if (!b || b.disabled) return;
      var x = opciones[+b.dataset.entrega];
      var r = x.hacer();
      if (r && r.then) {
        b.disabled = true; b.classList.add('haciendo');
        r.then(function (msg) { if (typeof msg === 'string' && msg) M.aviso(msg); }, function (err) { M.aviso('No se pudo: ' + ((err && err.message) || 'algo falló') + '.', 'mal'); })
          .then(function () { b.disabled = false; b.classList.remove('haciendo'); });
      }
    };
  };
})();
