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

  /* URL del formulario del ticket de salida (Google Form). Mientras esté vacía,
     el bloque del ticket no se muestra. Pégala entre las comillas y listo. */
  var TICKET_URL = 'https://forms.gle/674ik4CafFpvVK6A8';

  var FIJAS = [
    { href: 'semanas/semana-00.html', t: 'Semana 0 · Aterrizaje', d: 'El programa completo del curso. Sesiones del 30 y 31 de julio.' },
    { href: 'tu-calificacion.html', t: 'Tu calificación', d: 'Cómo se evalúa este curso, sin letra chiquita.' },
    { href: 'evaluacion/expediente-del-gestor.html', t: 'Expediente del gestor', d: 'La carpeta que armas todo el semestre, en un cuadernillo por unidad.' },
    { href: 'evaluacion/contrato-de-gestion.html', t: 'Mi contrato de gestión', d: 'Tus dos compromisos firmados del semestre.' },
    { href: 'evaluacion/pacto-de-evaluacion.html', t: 'Pacto de evaluación', d: 'El acuerdo sobre cómo se califica. Se firma el 31 de julio.' },
    { href: 'evaluacion/pacto-de-ia.html', t: 'Pacto de uso de IA', d: 'Qué sí, qué no y cómo se declara. Se firma el 31 de julio.' },
    { href: 'gimnasio.html', t: 'Todo el gimnasio', d: 'Los ejercicios de las diecisiete semanas, siempre abiertos.' }
  ];

  /* Barra de navegación: las secciones que se usan todo el semestre. */
  var NAV = [
    { href: 'index.html', t: 'Gestión de Proyectos', casa: true },
    { href: 'index.html', t: 'Inicio' },
    { href: 'semanas/semana-00.html', t: 'Programa' },
    { href: 'gimnasio.html', t: 'Gimnasio' },
    { href: 'evaluacion/expediente-del-gestor.html', t: 'Expediente' },
    { href: 'tu-calificacion.html', t: 'Tu calificación' }
  ];

  var UNIDADES = [
    { n: 1, t: 'Escuchar la presa', p: '¿Qué quiere la gente y cómo se sabe?', de: 1, a: 4 },
    { n: 2, t: 'Diseñar lo que pidieron', p: '¿Cómo se convierte una petición en un proyecto que se sostiene?', de: 5, a: 10 },
    { n: 3, t: 'Construir en la presa', p: '¿Qué pasa cuando el plan se topa con la realidad?', de: 11, a: 14 },
    { n: 4, t: 'Entregar la presa viva', p: '¿Cómo se sabe que funcionó y quién lo cuida después?', de: 15, a: 17 }
  ];

  var SEMANAS = [
    { n: 1, t: 'La presa y el fondo', abre: '2026-08-05', q: '¿Qué harías con un dinero que no es tuyo?' },
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
    /* ---- Barra de navegación persistente ---- */
    + '.nav-curso{position:sticky;top:0;z-index:60;background:var(--marca,#0F6E6E);box-shadow:0 1px 8px rgba(11,60,73,.18)}'
    + '.nav-curso .nav-in{max-width:980px;margin:0 auto;display:flex;align-items:stretch;gap:.1rem;padding:0 .5rem;overflow-x:auto;scrollbar-width:none}'
    + '.nav-curso .nav-in::-webkit-scrollbar{display:none}'
    + '.nav-curso a{display:flex;align-items:center;white-space:nowrap;padding:.72rem .78rem;color:#DCEFEA;text-decoration:none;font-size:.94rem;font-weight:600;border-bottom:3px solid transparent}'
    + '.nav-curso a:hover{color:#fff;background:rgba(255,255,255,.09)}'
    + '.nav-curso a.aqui{color:#fff;border-bottom-color:var(--arena,#D9A441)}'
    + '.nav-curso a.casa{font-family:Georgia,serif;font-weight:bold;color:#fff;padding-left:.4rem;padding-right:.9rem;margin-right:.15rem;border-right:1px solid rgba(255,255,255,.18)}'
    + '.nav-curso .esp{flex:1 1 auto;min-width:.3rem}'
    + '#btn-menu{flex:none;align-self:center;margin:.35rem .1rem .35rem .4rem;background:var(--arena,#D9A441);color:#20160a;border:none;border-radius:999px;padding:.42rem .95rem;font:inherit;font-size:.88rem;font-weight:bold;cursor:pointer;white-space:nowrap}'
    + '#btn-menu:hover{filter:brightness(1.06)}'
    + '@media(max-width:620px){.nav-curso a{padding:.65rem .58rem;font-size:.88rem}.nav-curso a.casa{display:none}}'
    + '@media print{.nav-curso{display:none!important}}'
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
    + 'details.sesion .ajuste{margin:.5rem 0 0;font-size:.93rem;color:#68807a}'

    /* ---- Formato de día 2.0: el contenido de la sesión vive en la página ---- */
    + '.dia{background:#fff;border:1px solid var(--borde,#CFE3DD);border-radius:14px;margin:1.1rem 0 1.8rem;overflow:hidden}'
    + '.dia>.cabeza{background:var(--profundo,#0B3C49);color:#EAF4F2;padding:1rem 1.3rem}'
    + '.dia>.cabeza .cuando{font-size:.76rem;letter-spacing:.13em;text-transform:uppercase;opacity:.72;font-weight:bold}'
    + '.dia>.cabeza h3{font-family:Georgia,serif;font-size:1.5rem;line-height:1.2;margin:.2rem 0 .3rem;color:#fff}'
    + '.dia>.cabeza .foco{margin:0;font-size:.98rem;opacity:.92;font-family:Georgia,serif;font-style:italic}'
    + '.dia>.cuerpo{padding:.2rem 1.3rem 1.2rem}'
    + '.bloque{border-top:1px solid var(--borde,#CFE3DD);padding-top:1.15rem;margin-top:1.15rem}'
    + '.bloque:first-child{border-top:none;margin-top:.9rem;padding-top:0}'
    + '.bloque>h4{display:flex;align-items:baseline;gap:.6rem;flex-wrap:wrap;font-family:Georgia,serif;color:var(--profundo,#0B3C49);font-size:1.18rem;line-height:1.3;margin:0 0 .55rem}'
    + '.bloque>h4 .n{font-family:Georgia,serif;font-weight:bold;font-size:1.7rem;line-height:.9;color:var(--arena,#D9A441);flex:none}'

    /* ---- Piezas: la palabra clave en caja, con su glosa debajo ---- */
    + '.piezas{display:flex;flex-wrap:wrap;gap:.45rem;align-items:flex-end;margin:1.1rem 0 1.3rem}'
    + '.pz{font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:700;font-size:clamp(1.1rem,4vw,1.7rem);padding:.2em .55em;border-radius:.45em;line-height:1.1}'
    + '.pz small{display:block;font-family:"Source Sans 3",system-ui,sans-serif;font-weight:700;font-size:.56rem;letter-spacing:.1em;text-transform:uppercase;opacity:.82;margin-top:.32em;line-height:1.3}'
    + '.pz--oscura{background:var(--profundo,#0B3C49);color:#EAF4F2}'
    + '.pz--clara{background:#DDEDE8;color:#0B4A45}'
    + '.pz--arena{background:#FBEFD5;color:#7C6222}'
    + '.pz--roja{background:#FBE6E1;color:#7A3123}'
    + '.piezas .eq{font-family:Georgia,serif;font-weight:bold;font-size:clamp(1rem,3.2vw,1.35rem);color:#5b7671;padding-bottom:.35em}'
    + '.piezas .op{font-family:Georgia,serif;font-weight:bold;font-size:1.5rem;color:var(--arena,#D9A441);padding-bottom:.32em;flex:none}'
    + '.tt{font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;font-weight:700;font-size:.9em;background:#EDF5F3;color:#0B4A45;padding:.08em .3em;border-radius:.3em;margin-right:-.12em}'
    + '.entrada{font-size:1.14rem;line-height:1.55;color:var(--profundo,#0B3C49)}'
    + '.reloj{margin-left:auto;font-family:"Source Sans 3",system-ui,sans-serif;font-size:.7rem;font-weight:bold;letter-spacing:.07em;text-transform:uppercase;color:#7C6222;background:#FBEFD5;border:1px solid #E8D4A4;border-radius:999px;padding:.15rem .62rem;white-space:nowrap;flex:none}'
    + '.bloque p{margin:.55rem 0}'
    + '.bloque ul,.bloque ol{margin:.5rem 0;padding-left:1.25rem}'
    + '.bloque li{margin:.35rem 0}'
    + '.pasa{background:#EDF5F3;border-left:4px solid var(--marca,#0F6E6E);border-radius:0 10px 10px 0;padding:.7rem 1rem;margin:.7rem 0;font-size:.97rem}'
    + '.pasa b{color:var(--profundo,#0B3C49)}'
    + '.ojo{background:#FDF6E7;border-left:4px solid var(--arena,#D9A441);border-radius:0 10px 10px 0;padding:.75rem 1rem;margin:.9rem 0;font-size:.97rem;color:#5C4A1C}'
    + '.dato{background:#F0F6FB;border-left:4px solid #3C7EA8;border-radius:0 10px 10px 0;padding:.75rem 1rem;margin:.9rem 0;font-size:.97rem;color:#1F4258}'
    + '.cita{font-family:Georgia,serif;font-style:italic;font-size:1.22rem;line-height:1.45;color:var(--profundo,#0B3C49);border-left:5px solid var(--arena,#D9A441);margin:1.1rem 0;padding:.3rem 0 .3rem 1.1rem}'
    + '.cita cite{display:block;font-size:.82rem;font-style:normal;font-family:"Source Sans 3",system-ui,sans-serif;color:#7d918c;margin-top:.45rem;letter-spacing:.03em}'
    + '.flujo{display:flex;flex-wrap:wrap;align-items:stretch;gap:.4rem;margin:1rem 0}'
    + '.flujo .paso{flex:1 1 8rem;background:#F7FAF9;border:1px solid var(--borde,#CFE3DD);border-radius:10px;padding:.65rem .7rem;text-align:center;font-size:.84rem;line-height:1.35;color:#5b7671}'
    + '.flujo .paso b{display:block;font-family:Georgia,serif;font-size:1.6rem;line-height:1;color:var(--arena,#D9A441);margin-bottom:.35rem}'
    + '.flujo .paso .t{display:block;font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;font-weight:700;color:var(--profundo,#0B3C49);font-size:1.02rem;margin-bottom:.15rem}'
    + '.flujo .flecha{align-self:center;color:var(--arena,#D9A441);font-weight:bold;font-size:1.1rem;flex:none}'
    + '.contra{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin:1rem 0}'
    + '.contra>div{border-radius:12px;padding:.85rem 1rem;font-size:.95rem;line-height:1.5}'
    + '.contra .mal{background:#FBF0EE;border:1px solid #EBCFC9;color:#6B2F22}'
    + '.contra .bien{background:#EEF6F0;border:1px solid #C9E2CF;color:#1F4A2C}'
    + '.contra .rot{display:block;font-size:.71rem;letter-spacing:.1em;text-transform:uppercase;font-weight:bold;opacity:.75;margin-bottom:.3rem}'
    + '@media(max-width:620px){.contra{grid-template-columns:1fr}}'
    + 'table.veredicto{width:100%;border-collapse:collapse;margin:.8rem 0;font-size:.94rem}'
    + 'table.veredicto th{background:#E4EFEB;color:var(--profundo,#0B3C49);text-align:left;padding:.5rem .65rem;border:1px solid var(--borde,#CFE3DD);font-size:.86rem;letter-spacing:.03em}'
    + 'table.veredicto td{padding:.55rem .65rem;border:1px solid var(--borde,#CFE3DD);vertical-align:top;background:#fff}'
    + 'table.veredicto td.v{text-align:center;white-space:nowrap;font-weight:bold;width:5.4rem}'
    + 'table.veredicto tr.si td.v{background:#EEF6F0;color:#1F4A2C}'
    + 'table.veredicto tr.cuidado td.v{background:#FDF6E7;color:#7C6222}'
    + 'table.veredicto tr.no td.v{background:#FBF0EE;color:#6B2F22}'
    + '.pie-dia{margin:1.4rem -1.3rem -1.2rem;padding:.95rem 1.3rem 1.1rem;background:#F7FAF9;border-top:1px solid var(--borde,#CFE3DD);font-size:.93rem;color:#5b7671}'
    + '.pie-dia p{margin:.35rem 0}'
    + '.pie-dia .rot{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;font-weight:bold;color:var(--marca,#0F6E6E)}'
    + '.llave{background:var(--profundo,#0B3C49);color:#EAF4F2;border-radius:12px;padding:.9rem 1.15rem;margin:1rem 0;font-size:1.02rem}'
    + '.llave .rot{display:block;font-size:.71rem;letter-spacing:.12em;text-transform:uppercase;color:var(--arena,#D9A441);font-weight:bold;margin-bottom:.25rem}'
    + '.indice{display:flex;flex-wrap:wrap;gap:.45rem;margin:.8rem 0 0}'
    + '.indice a{display:inline-block;background:#fff;border:1px solid var(--borde,#CFE3DD);border-radius:999px;padding:.3rem .85rem;font-size:.88rem;text-decoration:none;color:var(--marca,#0F6E6E);font-weight:bold}'
    + '.indice a:hover{background:#E4EFEB}'

    /* ---- Barra lateral fija (pantallas anchas): el mapa siempre a la vista ---- */
    + '.lado{display:none;position:fixed;top:0;left:0;bottom:0;width:21rem;overflow-y:auto;background:#fff;border-right:1px solid var(--borde,#CFE3DD);padding:1rem 1.1rem 2.5rem;z-index:50}'
    + '.lado .lado-tit{font-family:Georgia,serif;font-size:1.05rem;margin:.2rem 0 .6rem}'
    + '.lado .lado-tit a{color:var(--profundo,#0B3C49);text-decoration:none}'
    + '.lado .lado-tit a:hover{color:var(--marca,#0F6E6E)}'
    + '.mapa .fila.actual{background:#F3FAF7;border-radius:8px;padding-left:.45rem;padding-right:.45rem}'
    + '.mapa .fila.actual a{color:var(--profundo,#0B3C49)}'
    + '@media(min-width:1200px){body{padding-left:21rem}.lado{display:block}#btn-menu{display:none}}'
    + '@media print{.lado{display:none!important}body{padding-left:0!important}}'

    /* ---- Ticket de salida al pie de cada semana ---- */
    + '.ticket-salida{display:flex;gap:1.1rem;align-items:center;background:#fff;border:1px solid var(--borde,#CFE3DD);border-left:5px solid var(--arena,#D9A441);border-radius:12px;padding:1rem 1.2rem;margin:1.6rem 0 0}'
    + '.ticket-salida .rot{display:block;font-size:.72rem;letter-spacing:.11em;text-transform:uppercase;font-weight:bold;color:var(--marca,#0F6E6E);margin-bottom:.25rem}'
    + '.ticket-salida p{margin:.2rem 0 .6rem;font-size:.95rem}'
    + '.ticket-salida .btn{display:inline-block;background:var(--marca,#0F6E6E);color:#fff;text-decoration:none;font-weight:bold;font-size:.9rem;border-radius:999px;padding:.42rem 1rem}'
    + '.ticket-salida .btn:hover{filter:brightness(1.08)}'
    + '.ticket-salida .qr{width:120px;height:120px;flex:none;border:1px solid var(--borde,#CFE3DD);border-radius:8px}'
    + '@media(max-width:540px){.ticket-salida .qr{display:none}}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- Construcción ---------- */

  function fecha(iso) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
  }

  function xx(n) { return (n < 10 ? '0' : '') + n; }

  function semanaActual() {
    var m = location.pathname.match(/semana-(\d\d)\.html$/);
    return m ? parseInt(m[1], 10) : null;
  }

  function filaSemana(s) {
    var pub = DISPONIBLES.indexOf(s.n) !== -1;
    var d = document.createElement('div');
    d.className = 'fila' + (pub ? '' : ' cerrada') + (semanaActual() === s.n ? ' actual' : '');
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

    var actual = semanaActual();
    UNIDADES.forEach(function (u, i) {
      var det = document.createElement('details');
      if (abrirPrimera && i === 0) det.open = true;
      if (actual !== null && actual >= u.de && actual <= u.a) det.open = true;
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

  /* Barra de navegación persistente, en todas las páginas del sitio. */
  function montarBarra(btn) {
    var nav = document.createElement('nav');
    nav.className = 'nav-curso';
    nav.setAttribute('aria-label', 'Navegación del curso');

    var caja = document.createElement('div');
    caja.className = 'nav-in';

    var aqui = location.pathname.replace(/\/$/, '/index.html');

    NAV.forEach(function (l) {
      var a = document.createElement('a');
      a.href = BASE + l.href;
      a.textContent = l.t;
      if (l.casa) a.className = 'casa';
      else try {
        if (new URL(a.href, location.href).pathname === aqui) a.className = 'aqui';
      } catch (e) {}
      caja.appendChild(a);
    });

    var esp = document.createElement('span');
    esp.className = 'esp';
    caja.appendChild(esp);
    caja.appendChild(btn);

    nav.appendChild(caja);
    document.body.insertBefore(nav, document.body.firstChild);
  }

  function montarPanel() {
    var btn = document.createElement('button');
    btn.id = 'btn-menu';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Las semanas';

    var panel = document.createElement('div');
    panel.id = 'panel-menu';
    panel.innerHTML = '<div class="fondo"></div><div class="caja" role="dialog" aria-label="Menú del curso">'
      + '<button class="cerrar" type="button" aria-label="Cerrar">×</button>'
      + '<h2>Mapa del curso</h2>'
      + '<p style="margin:.1rem 0 .6rem;font-size:.9rem;color:#68807a">'
      + '<a href="' + BASE + 'index.html" style="color:var(--marca,#0F6E6E);font-weight:bold">Portada del curso</a></p>'
      + '<div id="mapa-panel"></div></div>';

    document.body.appendChild(panel);
    montarBarra(btn);
    construirMapa(panel.querySelector('#mapa-panel'), false);

    function abrir() { panel.classList.add('abierto'); btn.setAttribute('aria-expanded', 'true'); }
    function cerrar() { panel.classList.remove('abierto'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', abrir);
    panel.querySelector('.cerrar').addEventListener('click', cerrar);
    panel.querySelector('.fondo').addEventListener('click', cerrar);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
  }

  /* Ticket de salida al pie de la semana, cuando el formulario ya existe. */
  function montarTicket() {
    if (!TICKET_URL) return;
    var n = semanaActual();
    if (n === null) return;
    var cont = document.getElementById('wk-gate') || document.querySelector('main');
    if (!cont) return;
    var qr = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(TICKET_URL);
    var d = document.createElement('div');
    d.className = 'ticket-salida';
    d.innerHTML = '<div><span class="rot">Ticket de salida · Semana ' + n + '</span>'
      + '<p>Noventa segundos antes de irte: qué te llevas, qué quedó turbio y cómo estuvo el ritmo. Con nombre o sin él, como prefieras.</p>'
      + '<a class="btn" href="' + TICKET_URL + '" target="_blank" rel="noopener">Abrir el formulario</a></div>'
      + '<img class="qr" alt="Código QR del formulario del ticket de salida" src="' + qr + '">';
    cont.appendChild(d);
  }

  /* Barra lateral fija en pantallas anchas: el mapa completo siempre a la vista. */
  function montarLado() {
    var lado = document.createElement('aside');
    lado.className = 'lado';
    lado.setAttribute('aria-label', 'Mapa del curso');
    lado.innerHTML = '<p class="lado-tit"><a href="' + BASE + 'index.html">Gestión y Manejo de Proyectos</a></p>';
    var mapa = document.createElement('div');
    lado.appendChild(mapa);
    document.body.appendChild(lado);
    construirMapa(mapa, false);
  }

  function arrancar() {
    montarPanel();
    montarLado();
    montarTicket();
    var inline = document.getElementById('mapa-curso');
    if (inline) construirMapa(inline, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

})();
