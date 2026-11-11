// Ensambla la interfaz autocontenida: datos, motor y tipografía incrustados
const fs = require('fs'), path = require('path');
const raiz = __dirname;
const leer = p => fs.readFileSync(path.join(raiz, p), 'utf8');
const fuente = (peso, estilo) => {
  const f = path.join(raiz, `node_modules/@fontsource/jost/files/jost-latin-${peso}-${estilo}.woff2`);
  const b64 = fs.readFileSync(f).toString('base64');
  return `@font-face{font-family:'Jost';font-style:${estilo};font-weight:${peso};font-display:swap;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
};
const fuentes = [fuente(400, 'normal'), fuente(400, 'italic'), fuente(500, 'normal'), fuente(600, 'normal'), fuente(700, 'normal')].join('\n');
let html = leer('src/interfaz.html');
html = html.replace('/*__FUENTES__*/', () => fuentes)
           .replace('/*__DATOS__*/', () => leer('src/data.js'))
           .replace('/*__MOTOR__*/', () => leer('src/engine.js'))
           .replace('/*__EMBLEMA__*/', () => 'data:image/png;base64,' + fs.readFileSync(path.join(raiz, 'assets/emblema-presa-web.png')).toString('base64'));
fs.mkdirSync(path.join(raiz, 'out/sitio'), { recursive: true });
// copia para el artefacto: sin navegación del sitio
const artefacto = html.replace('<!--__SITIO__-->', '').replace('<!--__DESCARGAS__-->', '');
fs.writeFileSync(path.join(raiz, 'out/cronograma-presa-interactivo.html'), artefacto);
// copia para el sitio del curso: recursos/cronograma-de-la-presa/index.html
const sitio = html
  .replace('<!--__SITIO__-->', '<nav class="migas-sitio" aria-label="Sitio del curso"><a href="../../index.html">Volver al curso</a><a href="../cronograma-y-presupuesto/index.html">La clase de cronograma y presupuesto</a></nav>')
  .replace('<!--__DESCARGAS__-->', '<p class="descargas">Para imprimir, en PDF: <a href="cronograma-presa-asamblea.pdf">la versión para la asamblea</a> (6 páginas), <a href="cronograma-presa-fondos.pdf">la versión completa para las instancias de financiamiento</a> (20 páginas) y <a href="cronograma-presa-cartel-90x60.pdf">el cartel de pared de 90 × 60 cm</a>.</p>')
  .replace('<title>Cronograma de la presa</title>', '<title>El cronograma de la presa · Gestión y Manejo de Proyectos</title>');
fs.writeFileSync(path.join(raiz, 'out/sitio/index.html'), sitio);
console.log('interfaz:', (artefacto.length / 1024).toFixed(0), 'KB; sitio:', (sitio.length / 1024).toFixed(0), 'KB');
