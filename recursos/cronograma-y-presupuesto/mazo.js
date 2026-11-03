/* El telón de los mazos: botón Presentar, una lámina a la vez, flechas o clicker,
   tecla A oculta el apoyo, tecla N muestra la nota del conductor, F pantalla
   completa, Esc sale. ?p=7 abre directo en la lámina 7. */
(function () {
  var laminas = Array.prototype.slice.call(document.querySelectorAll('.lam'));
  if (!laminas.length) return;
  var telon = document.createElement('div');
  telon.id = 'telon';
  telon.innerHTML = '<div class="escenario"></div>'
    + '<div class="barra"><span class="contador"></span>'
    + '<span class="ayuda">flechas o espacio avanzan · A apoyo · N notas · F pantalla · Esc sale</span>'
    + '<span><button type="button" data-ir="-1">◂</button><button type="button" data-ir="1">▸</button><button type="button" data-salir>Salir</button></span></div>';
  document.body.appendChild(telon);
  var escenario = telon.querySelector('.escenario');
  var contador = telon.querySelector('.contador');
  var i = 0, abierto = false;

  function mostrar(n) {
    i = Math.max(0, Math.min(laminas.length - 1, n));
    escenario.innerHTML = '';
    var copia = laminas[i].cloneNode(true);
    escenario.appendChild(copia);
    escenario.scrollTop = 0;
    contador.textContent = (i + 1) + ' / ' + laminas.length;
    try { history.replaceState(null, '', '?p=' + (i + 1)); } catch (e) {}
  }
  function abrir(n) {
    abierto = true; telon.classList.add('abierto'); document.body.style.overflow = 'hidden';
    mostrar(typeof n === 'number' ? n : 0);
  }
  function salir() {
    abierto = false; telon.classList.remove('abierto'); document.body.style.overflow = '';
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    var destino = laminas[i]; if (destino) destino.scrollIntoView({ block: 'center' });
  }
  function pantalla() {
    var el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(function () {});
  }

  Array.prototype.forEach.call(document.querySelectorAll('.btn-presentar'), function (b) {
    b.addEventListener('click', function () { abrir(0); pantalla(); });
  });
  telon.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b && b.hasAttribute('data-ir')) { mostrar(i + parseInt(b.getAttribute('data-ir'), 10)); return; }
    if (b && b.hasAttribute('data-salir')) { salir(); return; }
    if (e.target.closest('a')) return;
    if (e.target.closest('.barra')) return;
    var x = e.clientX / window.innerWidth;
    mostrar(x < 0.3 ? i - 1 : i + 1);
  });
  document.addEventListener('keydown', function (e) {
    if (!abierto) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'ArrowDown' || k === 'Enter') { e.preventDefault(); mostrar(i + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp' || k === 'Backspace') { e.preventDefault(); mostrar(i - 1); }
    else if (k === 'Escape') { salir(); }
    else if (k === 'a' || k === 'A') { telon.classList.toggle('sin-apoyo'); }
    else if (k === 'n' || k === 'N') { telon.classList.toggle('con-notas'); }
    else if (k === 'f' || k === 'F') { pantalla(); }
    else if (k === 'Home') { mostrar(0); }
    else if (k === 'End') { mostrar(laminas.length - 1); }
  });
  // Doble clic en una lámina de la página: abre el telón ahí.
  laminas.forEach(function (l, n) {
    l.addEventListener('dblclick', function () { abrir(n); });
  });
  var m = /[?&]p=(\d+)/.exec(location.search);
  if (m) abrir(parseInt(m[1], 10) - 1);
})();
