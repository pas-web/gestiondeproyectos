/* Mapa y menú del curso · Gestión y Manejo de Proyectos · UAQ Campus Concá 2026
   Un solo archivo alimenta el índice de la portada y el menú desplegable de
   todas las páginas. Para publicar una semana, agrega su número a DISPONIBLES. */
(function () {

  var ME = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  var BASE = ME.src.replace(/curso\.js(\?.*)?$/, '');

  /* ---------- Datos del curso ---------- */

  var DISPONIBLES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  var FIJAS = [
    { href: 'semanas/semana-00.html', t: 'Semana 0 · El programa', d: 'Qué vas a aprender, en qué orden y para qué te sirve.' },
    { href: 'tu-calificacion.html', t: 'Tu calificación', d: 'Cómo se evalúa este curso, sin letra chiquita.' },
    { href: 'evaluacion/expediente-del-gestor.html', t: 'Expediente del gestor', d: 'La carpeta que armas todo el semestre y te llevas al final.' },
    { href: 'evaluacion/contrato-de-gestion.html', t: 'Mi contrato de gestión', d: 'Tus dos compromisos firmados del semestre.' },
    { href: 'gimnasio.html', t: 'Todo el gimnasio', d: 'Los ejercicios de las diecisiete semanas, siempre abiertos.' }
  ];

  var UNIDADES = [
    { n: 1, t: 'Escuchar la presa', p: '¿Qué quiere la gente y cómo se sabe?', de: 1, a: 4 },
    { n: 2, t: 'Diseñar lo que pidieron', p: '¿Cómo se convierte una petición en un proyecto que se sostiene?', de: 5, a: 10 },
    { n: 3, t: 'Construir en la presa', p: '¿Qué pasa cuando el plan se topa con la realidad?', de: 11, a: 14 },
    { n: 4, t: 'Entregar la presa viva', p: '¿Cómo se sabe que funcionó y quién lo cuida después?', de: 15, a: 17 }
  ];

  var SEMANAS = [
    { n: 1, t: 'La presa y el fondo', abre: '2026-08-05', q: '¿Qué harías con veinte mil pesos que no son tuyos?' },
    { n: 2, t: 'Agencia', abre: '2026-08-12', q: '¿Qué pedirías si el no ya lo tuvieras?' },
    { n: 3, t: 'Diseñar la consulta', abre: '2026-08-19', q: '¿Cómo se pregunta sin prometer?' },
    { n: 4, t: 'La consulta y el sobre', abre: '2026-08-26', q: '¿Y si la respuesta no es la que esperabas?' },
    { n: 5, t: 'Líneas y reglas del fondo', abre: '2026-09-02', q: '¿Cómo se reparte lo que no alcanza?' },
    { n: 6, t: 'Prototipo en la presa', abre: '2026-09-09', q: '¿Cómo pruebas una idea antes de gastar un peso en ella?' },
    { n: 7, t: 'La apuesta causal', abre: '2026-09-16', q: '¿Por qué crees que eso va a funcionar?' },
    { n: 8, t: 'Ingeniería del papel', abre: '2026-09-23', q: '¿Cómo se mide una promesa?' },
    { n: 9, t: 'La política del proyecto', abre: '2026-09-30', q: '¿Quién tiene que decir que sí?' },
    { n: 10, t: 'Presupuesto y pre-pitch', abre: '2026-10-07', q: '¿Cuánto cuesta hacerlo de verdad?' },
    { n: 11, t: 'La Dictaminadora', abre: '2026-10-14', q: '¿Y si dicen que no?' },
    { n: 12, t: 'La faena y el libro del fondo', abre: '2026-10-21', q: '¿Quién carga qué?' },
    { n: 13, t: 'El velorio del proyecto', abre: '2026-10-28', q: '¿De qué va a morir tu proyecto?' },
    { n: 14, t: 'Obra y comunicación', abre: '2026-11-04', q: '¿La obra habla por sí sola?' },
    { n: 15, t: 'Medir lo que importa', abre: '2026-11-11', q: '¿Cómo sabrás que funcionó?' },
    { n: 16, t: 'Auditoría y radar', abre: '2026-11-18', q: '¿Y el dinero dónde quedó?' },
    { n: 17, t: 'La inauguración', abre: '2026-11-25', q: '¿Qué se queda y qué te llevas?' }
  ];

  window.CURSO = { BASE: BASE, DISPONIBLES: DISPONIBLES, SEMANAS: SEMANAS, UNIDADES: UNIDADES, FIJAS: FIJAS };

  /* ---------- Estilos del menú ---------- */

  var css = ''
    + '.mapa{margin:1rem 0 0}'
    + '.mapa details{background:#fff;border:1px solid var(--borde,#CFE3DD);border-radius:12px;margin:.5rem 0;overflow:hidden}'
    + '.mapa details[open]{box-shadow:0 1px 0 rgba(11,60,73,.05)}'
    + '.mapa summary{cursor:pointer;list-style:none;padding:.85rem 1.1rem;font-family:Georgia,serif;color:var(--profundo,#0B3C49);font-size:1.05rem;display:flex;align-items:baseline;gap:.6rem}'
    + '.mapa summary::-webkit-details-marker{display:none}'
    + '.mapa summary::before{content:"+";font-family:Georgia,serif;color:var(--arena,#D9A441);font-weight:bold;font-size:1.15rem;width:1rem;flex:none}'
    + '.mapa details[open]>summary::before{content:"\\2013"}'
    + '.mapa summary .sub{margin-left:auto;font-size:.8rem;color:#8aa39c;font-family:"Source Sans 3",system-ui,sans-serif;white-space:nowrap}'
    + '.mapa .cuerpo{padding:.2rem 1.1rem 1rem}'
    + '.mapa .guia{font-family:Georgia,serif;font-style:italic;color:#68807a;margin:.1rem 0 .7rem;font-size:.95rem}'
    + '.mapa .fila{display:flex;gap:.7rem;align-items:baseline;padding:.5rem 0;border-bottom:1px dashed var(--borde,#CFE3DD)}'
    + '.mapa .fila:last-child{border-bottom:none}'
    + '.mapa .fila .num{font-family:Georgia,serif;color:var(--arena,#D9A441);font-weight:bold;min-width:2rem;flex:none}'
    + '.mapa .fila a{color:var(--marca,#0F6E6E);font-weight:bold;text-decoration:none}'
    + '.mapa .fila a:hover{text-decoration:underline}'
    + '.mapa .fila .q{display:block;font-size:.88rem;color:#68807a}'
    + '.mapa .fila .fecha{margin-left:auto;font-size:.78rem;color:#8aa39c;white-space:nowrap;flex:none}'
    + '.mapa .fila.cerrada a,.mapa .fila.cerrada .titulo{color:#8aa39c;font-weight:normal}'
    + '.mapa .fila .d{display:block;font-size:.88rem;color:#68807a}'
    + '#btn-menu{position:fixed;top:.7rem;right:.7rem;z-index:60;background:var(--arena,#D9A441);color:#20160a;border:none;border-radius:999px;padding:.5rem 1rem;font:inherit;font-size:.9rem;font-weight:bold;cursor:pointer;box-shadow:0 2px 10px rgba(11,60,73,.25)}'
    + '#btn-menu:hover{filter:brightness(1.06)}'
    + '#panel-menu{position:fixed;inset:0;z-index:70;display:none}'
    + '#panel-menu.abierto{display:block}'
    + '#panel-menu .fondo{position:absolute;inset:0;background:rgba(11,60,73,.55)}'
    + '#panel-menu .caja{position:absolute;top:0;right:0;bottom:0;width:min(28rem,100%);background:var(--fondo,#F2F7F5);overflow-y:auto;padding:1.1rem 1.1rem 3rem;box-shadow:-4px 0 24px rgba(11,60,73,.3)}'
    + '#panel-menu .caja h2{font-family:Georgia,serif;color:var(--marca,#0F6E6E);font-size:1.2rem;margin:.2rem 0 .1rem}'
    + '#panel-menu .cerrar{position:absolute;top:.6rem;right:.7rem;background:none;border:none;font-size:1.7rem;line-height:1;color:var(--profundo,#0B3C49);cursor:pointer}'
    + '@media print{#btn-menu,#panel-menu{display:none!important}}'
    /* Bloque "El jueves y el viernes" de las páginas semanales */
    + '.pista-ses{font-size:.95rem;color:#68807a;margin:.2rem 0 .6rem}'
    + 'details.sesion{background:#fff;border:1px solid var(--borde,#CFE3DD);border-radius:12px;margin:.6rem 0;overflow:hidden}'
    + 'details.sesion summary{cursor:pointer;list-style:none;padding:.85rem 1.2rem;font-family:Georgia,serif;color:var(--profundo,#0B3C49);font-size:1.06rem;display:flex;align-items:baseline;gap:.6rem}'
    + 'details.sesion summary::-webkit-details-marker{display:none}'
    + 'details.sesion summary::before{content:"+";font-family:Georgia,serif;color:var(--arena,#D9A441);font-weight:bold;font-size:1.15rem;width:1rem;flex:none}'
    + 'details.sesion[open]>summary::before{content:"\\2013"}'
    + 'details.sesion summary .sub{margin-left:auto;font-size:.8rem;color:#8aa39c;font-family:"Source Sans 3",system-ui,sans-serif;white-space:nowrap}'
    + 'details.sesion .cuerpo{padding:.2rem 1.2rem 1.1rem}'
    + 'details.sesion .foco{font-family:Georgia,serif;font-style:italic;color:var(--marca,#0F6E6E);margin:.2rem 0 .8rem}'
    + 'table.minutos{width:100%;border-collapse:collapse;font-size:.97rem}'
    + 'table.minutos td{padding:.5rem .2rem;border-bottom:1px dashed var(--borde,#CFE3DD);vertical-align:top}'
    + 'table.minutos tr:last-child td{border-bottom:none}'
    + 'table.minutos td.m{width:4.6rem;font-family:Georgia,serif;color:var(--arena,#D9A441);font-weight:bold;white-space:nowrap}'
    + 'details.sesion .trae{margin:.9rem 0 0;padding-top:.7rem;border-top:1px solid var(--borde,#CFE3DD);font-size:.95rem;color:#45605a}'
    + 'details.sesion .ajuste{margin:.5rem 0 0;font-size:.93rem;color:#68807a}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- Construcción ---------- */

  function fecha(iso) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
  }

  function xx(n) { return (n < 10 ? '0' : '') + n; }

  function filaSemana(s) {
    var pub = DISPONIBLES.indexOf(s.n) !== -1;
    var d = document.createElement('div');
    d.className = 'fila' + (pub ? '' : ' cerrada');
    d.innerHTML = '<span class="num">S' + s.n + '</span>'
      + '<div>' + (pub
        ? '<a href="' + BASE + 'semanas/semana-' + xx(s.n) + '.html">' + s.t + '</a>'
        : '<span class="titulo">' + s.t + '</span>')
      + '<span class="q">' + s.q + '</span></div>'
      + '<span class="fecha">abre el ' + fecha(s.abre) + '</span>';
    return d;
  }

  function construirMapa(cont, abrirPrimera) {
    cont.className = 'mapa';
    cont.innerHTML = '';

    var dEmp = document.createElement('details');
    dEmp.open = true;
    dEmp.innerHTML = '<summary>Empieza aquí<span class="sub">siempre abierto</span></summary>';
    var cEmp = document.createElement('div');
    cEmp.className = 'cuerpo';
    FIJAS.forEach(function (f) {
      var fila = document.createElement('div');
      fila.className = 'fila';
      fila.innerHTML = '<span class="num">·</span><div><a href="' + BASE + f.href + '">' + f.t + '</a>'
        + '<span class="d">' + f.d + '</span></div>';
      cEmp.appendChild(fila);
    });
    dEmp.appendChild(cEmp);
    cont.appendChild(dEmp);

    UNIDADES.forEach(function (u, i) {
      var det = document.createElement('details');
      if (abrirPrimera && i === 0) det.open = true;
      det.innerHTML = '<summary>Unidad ' + u.n + ' · ' + u.t
        + '<span class="sub">semanas ' + u.de + ' a ' + u.a + '</span></summary>';
      var cuerpo = document.createElement('div');
      cuerpo.className = 'cuerpo';
      var guia = document.createElement('p');
      guia.className = 'guia';
      guia.textContent = u.p;
      cuerpo.appendChild(guia);
      SEMANAS.filter(function (s) { return s.n >= u.de && s.n <= u.a; })
        .forEach(function (s) { cuerpo.appendChild(filaSemana(s)); });
      det.appendChild(cuerpo);
      cont.appendChild(det);
    });
  }

  function montarPanel() {
    var btn = document.createElement('button');
    btn.id = 'btn-menu';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Menú del curso';

    var panel = document.createElement('div');
    panel.id = 'panel-menu';
    panel.innerHTML = '<div class="fondo"></div><div class="caja" role="dialog" aria-label="Menú del curso">'
      + '<button class="cerrar" type="button" aria-label="Cerrar">×</button>'
      + '<h2>Mapa del curso</h2>'
      + '<p style="margin:.1rem 0 .6rem;font-size:.9rem;color:#68807a">'
      + '<a href="' + BASE + 'index.html" style="color:var(--marca,#0F6E6E);font-weight:bold">Portada del curso</a></p>'
      + '<div id="mapa-panel"></div></div>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    construirMapa(panel.querySelector('#mapa-panel'), false);

    function abrir() { panel.classList.add('abierto'); btn.setAttribute('aria-expanded', 'true'); }
    function cerrar() { panel.classList.remove('abierto'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', abrir);
    panel.querySelector('.cerrar').addEventListener('click', cerrar);
    panel.querySelector('.fondo').addEventListener('click', cerrar);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
  }

  function arrancar() {
    var inline = document.getElementById('mapa-curso');
    if (inline) construirMapa(inline, true);
    else montarPanel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

})();
