#!/usr/bin/env node
/* Construye las páginas de la mochila: mete fuentes, estilos y código dentro de
   cada HTML para que cada uno abra solo, sin internet y sin archivos al lado.
   Uso: node construir.js   (escribe en la carpeta de arriba, mochila/) */
'use strict';
const fs = require('fs');
const path = require('path');

const F = __dirname;
const SALIDA = path.join(F, '..');
const leer = (p) => fs.readFileSync(path.join(F, p), 'utf8');
const VERSION = 'versión 1 · 13 de noviembre de 2026';

const fuentes = [400, 500, 600, 700].map((w) =>
  "@font-face{font-family:'Jost';font-style:normal;font-weight:" + w + ';font-display:swap;src:url(data:font/woff2;base64,' +
  fs.readFileSync(path.join(F, 'fuentes', 'jost-' + w + '.woff2')).toString('base64') + ") format('woff2');}"
).join('\n');
const css = leer('comun.css');
const js = leer('comun.js');

// Ojo: siempre con función de reemplazo, porque el código trae «$'» y «$&».
const poner = (h, marca, contenido) => h.split(marca).join('\u0000').replace(/\u0000/g, () => contenido);

const paginas = fs.readdirSync(path.join(F, 'paginas')).filter((f) => f.endsWith('.html'));
let problemas = 0;
for (const p of paginas) {
  let h = leer(path.join('paginas', p));
  h = poner(h, '/*@FUENTES*/', fuentes);
  h = poner(h, '/*@COMUN_CSS*/', css);
  h = poner(h, '//@COMUN_JS', js);
  h = h.replace(/\/\/@INCLUIR ([\w.-]+)/g, (m, f) => leer(path.join('paginas', f)));
  h = h.replace(/@VERSION/g, () => VERSION);
  fs.writeFileSync(path.join(SALIDA, p), h);

  // Revisión de voz: sin raya larga ni raya corta en lo que se ve.
  const visible = h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const rayas = (visible.match(/[—–]/g) || []).length;
  const enCodigo = ((h.match(/<script[\s\S]*?<\/script>/g) || []).join('').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').match(/[—–]/g) || []).length;
  if (rayas || enCodigo) { problemas++; console.log('  ojo: ' + p + ' trae ' + (rayas + enCodigo) + ' rayas largas o cortas'); }
  console.log(p.padEnd(18) + (fs.statSync(path.join(SALIDA, p)).size / 1024).toFixed(0).padStart(5) + ' KB');
}
console.log(problemas ? 'Listo, con avisos.' : 'Listo.');
