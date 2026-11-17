// Arma recursos/pieza-por-pieza/index.html: una sola página con todo adentro
// (fuentes Jost, emblema, estilos, datos y código), que funciona igual en el sitio del
// curso y publicada como artifact de Claude.
// Lee las actividades del cronograma integrado (../../cronograma-de-la-presa/fuente) y la guía de
// la mochila (../../../mochila/fuente: guia.js, guia.css, docx.js y lienzo.js), la misma que usan
// sus cuatro herramientas: una pregunta a la vez, la hoja que se ilumina, Word e imagen.
// Uso, desde esta carpeta:  node construir.js
// Opciones:  ENCLAUDE=<url del artifact> node construir.js   (para el enlace del sitio)
//            SALIDA=<ruta> node construir.js                  (para escribir en otro lado)
const fs = require('fs'), path = require('path');
const AQUI = __dirname;
const CRONO = path.join(AQUI, '..', '..', 'cronograma-de-la-presa', 'fuente');
const MOCHILA = path.join(AQUI, '..', '..', '..', 'mochila', 'fuente');
const SALIDA = process.env.SALIDA || path.join(AQUI, '..', 'index.html');
const VERSION = 'versión 2 · 16 de noviembre de 2026';
const CLASE = 'https://pas-web.github.io/gestiondeproyectos/recursos/cronograma-y-presupuesto/index.html';
const SITIO = 'https://pas-web.github.io/gestiondeproyectos/recursos/pieza-por-pieza/';
const ENCLAUDE = process.env.ENCLAUDE || fs.existsSync(path.join(AQUI, 'enclaude.txt')) && fs.readFileSync(path.join(AQUI, 'enclaude.txt'), 'utf8').trim() || '';

const leer = f => fs.readFileSync(path.join(AQUI, f), 'utf8');
const deMochila = f => fs.readFileSync(path.join(MOCHILA, f), 'utf8');

// Las actividades del cronograma, con su código, su mes y el bolsillo sugerido
const D = require(path.join(CRONO, 'src/data.js'));
const E = require(path.join(CRONO, 'src/engine.js'));
const base = E.programar(D), cod = E.codigos(D, base);
const mesDe = t => { const c = E.cal(t); return c.anio + '-' + String(c.mes).padStart(2, '0'); };
const FONDO = { 'Autogestión': 'AUT', 'PROCODES': 'PRO', 'Municipio': 'MUN', 'CONAFOR': 'CNF' };
const SIN_COSTO = new Set(['hito', 'espera', 'aprob-municipal']);
const actividades = D.A.filter(a => !SIN_COSTO.has(a.t) && a.c !== 'G')
  .sort((x, y) => (base.P[x.id].s - base.P[y.id].s) || (D.A.indexOf(x) - D.A.indexOf(y)))
  .map(a => ({ id: a.id, cod: cod[a.id], c: a.c, n: a.n, p: a.p, mes: mesDe(base.P[a.id].s), f: FONDO[a.fondo] || '', ola: a.o || 0 }));
const PRESA = { fecha: '11 de noviembre de 2026', actividades };

// Las piezas tienen que apuntar a actividades que existen
const datos = leer('datos.js');
const idsPiezas = [...datos.matchAll(/acts: \[([^\]]*)\]/g)].flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]));
const faltan = idsPiezas.filter(id => !actividades.some(a => a.id === id));
if (faltan.length) { console.error('Piezas con actividades que no están en el cronograma: ' + faltan.join(', ')); process.exit(1); }

const fuente = (peso) => `@font-face{font-family:'Jost';font-style:normal;font-weight:${peso};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(AQUI, 'fuentes', 'jost-' + peso + '.woff2')).toString('base64')}) format('woff2');}`;
const emblema = 'data:image/png;base64,' + fs.readFileSync(path.join(AQUI, 'emblema-presa-web.png')).toString('base64');

const poner = (h, marca, contenido) => h.split(marca).join('\u0000').replace(/\u0000/g, () => contenido);
let html = leer('pagina.html');
html = poner(html, '/*@FUENTES*/', [400, 500, 600, 700].map(fuente).join('\n'));
html = poner(html, '/*@COMUN_CSS*/', leer('comun.css'));
html = poner(html, '/*@GUIA_CSS*/', deMochila('guia.css'));
html = poner(html, '/*@PXP_CSS*/', leer('pxp.css'));
html = poner(html, '//@EMBLEMA', 'window.EMBLEMA = ' + JSON.stringify(emblema) + ';');
html = poner(html, '//@DATOS', datos);
html = poner(html, '//@PRESA', 'var PRESA = window.PRESA = ' + JSON.stringify(PRESA) + ';');
html = poner(html, '//@COMUN_JS', leer('comun.js'));
html = poner(html, '//@LIENZO', deMochila('lienzo.js'));
html = poner(html, '//@DOCX', deMochila('docx.js'));
html = poner(html, '//@GUIA', deMochila('guia.js'));
html = poner(html, '//@AGENTE', leer('agente.js'));
html = poner(html, '//@EJEMPLO', leer('ejemplo.js'));
html = poner(html, '//@APP', leer('app.js'));
html = poner(html, '@VERSION', VERSION);
html = poner(html, '@CLASE', CLASE);
html = poner(html, '@SITIO', SITIO);
html = poner(html, '@ENCLAUDE', ENCLAUDE);

// Revisiones: sin raya larga ni raya corta, sin marcas sin reemplazar
const rayas = (html.match(/[—–]/g) || []).length;
if (rayas) { console.error('Hay ' + rayas + ' rayas largas o cortas.'); process.exit(1); }
const marcas = html.match(/\/\*@[A-Z_]+\*\/|\/\/@[A-Z_]+\b|'@[A-Z]+'/g);
if (marcas) { console.error('Quedaron marcas sin reemplazar: ' + marcas.join(', ')); process.exit(1); }

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, html);
console.log(path.relative(process.cwd(), SALIDA) + '  ' + (html.length / 1024).toFixed(0) + ' KB  ·  ' + actividades.length + ' actividades  ·  ' + (ENCLAUDE ? 'con enlace a Claude' : 'sin enlace a Claude'));
console.log('Listo.');
