// Genera el anexo en PDF (HTML para imprimir) y el cartel de pared a partir de la matriz y el motor.
const fs = require('fs'), path = require('path');
const D = require('./data.js');
const M = require('./engine.js');
const RAIZ = path.join(__dirname, '..');
const OUT = path.join(RAIZ, 'out', 'build');
fs.mkdirSync(OUT, { recursive: true });

const base = M.programar(D);
const P = base.P;
const cod = M.codigos(D, base);
const idx = M.indexar(D);
const esHito = a => a.t === 'hito' || a.t === 'aprob-municipal';
const ORDEN = ['G', '1a', '1b', '2', '3', '4', '5'];
const COMP = {}; D.COMPONENTES.forEach(c => COMP[c.id] = c);
const COLOR = { G: '#424d60', '1a': '#b8466e', '1b': '#4b8f2a', '2': '#6a55c2', '3': '#168c6e', '4': '#c0602f', '5': '#3f6fb0' };
const T = {
  tinta: '#1f2833', tinta2: '#4a5462', tinta3: '#78818e', filete: '#e3e1da', regla: '#c9c5b8',
  arena: '#bb9c79', pizarra: '#424d60', secas: '#f6f0e2', lluvias: '#e5eff0', ss: 'rgba(66,77,96,.13)', alerta: '#d03b3b', papel: '#ffffff'
};
const ASSETS = path.join(RAIZ, 'assets');
const imgSi = f => { const p = path.join(ASSETS, f); return fs.existsSync(p) ? 'data:image/png;base64,' + fs.readFileSync(p).toString('base64') : null; };
const LOGO_LABRURAL = imgSi('labrural.png');
const EMBLEMA = imgSi('emblema-presa.png');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fechaHito = a => a.fecha || M.hitoTexto(P[a.id].s);
const periodoCorto = a => {
  if (esHito(a)) return fechaHito(a);
  const r = M.rangoCorto(P[a.id].s, P[a.id].e);
  const m = r.match(/^(\S+) (\d{4}) – (\S+) (\d{4})$/);
  return m && m[2] === m[4] ? `${m[1]} – ${m[3]} ${m[2]}` : r;
};
const ssT = base.eventos.filter(e => e.id.startsWith('SS'));

const fuente = (peso, estilo) => `@font-face{font-family:'Jost';font-style:${estilo};font-weight:${peso};src:url('file://${RAIZ}/node_modules/@fontsource/jost/files/jost-latin-${peso}-${estilo}.woff2') format('woff2');}`;
const FUENTES = [fuente(400, 'normal'), fuente(400, 'italic'), fuente(500, 'normal'), fuente(600, 'normal'), fuente(700, 'normal')].join('\n');

/* ───────────────────────── Escenarios para riesgos ───────────────────────── */
function escenario(deltas) {
  const p = M.programar(D, deltas);
  return { p, al: M.alertas(D, p, base), cierre: p.P.H14.s, dif: p.P.H14.s - base.P.H14.s };
}
const E = {
  anu4: escenario({ anuencia: 4 }), din8: escenario({ dinero: 8 }), din16: escenario({ dinero: 16 }),
  per8: escenario({ permisos: 8 }), per16: escenario({ permisos: 16 })
};
const frag = M.fragilidad(D);

/* ───────────────────────── Gráfica maestra (SVG) ───────────────────────── */
function est(txt, size) { return String(txt).length * size * 0.53; }
const CARRILES = {
  G: [['Catálogo y asamblea ejidal', ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']], ['Presentación a la comunidad', ['G7']], ['Carpeta y solicitud PROCODES', ['G8', 'G12', 'G13', 'G14']],
      ['Impacto ambiental y zona federal', ['G15', 'G16', 'G17', 'G18']], ['Petición municipal 2028', ['G19']], ['Informe final', ['G22']]],
  '1a': [['Acuerdo con ganaderos y trancas', ['1a.1', '1a.2']], ['Cerco, fajinas y trampa de azolve', ['1a.3', '1a.4', '1a.5', '1a.6', '1a.7', '1a.8']], ['Estacas vivas con las primeras lluvias', ['1a.9', '1a.10']], ['Prendimiento', ['1a.12']]],
  '1b': [['Especies y pedido de planta', ['1b.1', '1b.2']], ['Corredores de monte cercados', ['1b.3', '1b.4', '1b.5', '1b.6']], ['Cajetes y siembra de 40 árboles', ['1b.7', '1b.8', '1b.9', '1b.10', '1b.11', '1b.12']], ['Riego en la primera seca', ['1b.14']], ['Reposición', ['1b.15']]],
  '2': [['Comité y reglamento', ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6']], ['Letreros de reglas', ['2.8', '2.9']], ['Recorridos de vigilancia', ['2.7']], ['Bienvenida y caminatas', ['2.11']]],
  '3': [['Tres rutas señaladas', ['3.3', '3.4', '3.5']], ['Niveles y diseño del muelle', ['3.1', '3.2', '3.7', '3.8']], ['Estreno de rutas', ['3.6']], ['Muelle y boyas', ['3.9', '3.10', '3.11']], ['Estreno del muelle', ['3.12']]],
  '4': [['Recolección, contenedores y fantasmas', ['4.1', '4.2', '4.3', '4.4']], ['Estacionamiento: trazo y visto bueno', ['4.6', '4.8']], ['Barreras vivas y magueyes', ['4.5', '4.7']], ['Estacionamiento, cerca y lámparas', ['4.9', '4.10', '4.11', '4.12']]],
  '5': [['Sitios y ficha técnica', ['5.1', '5.2', '5.3']], ['Materiales', ['5.4']], ['Palapas, bancas y explanada', ['5.5', '5.6', '5.7', '5.8']]]
};

function svgMaestro(o) {
  // o: { W, etq, unidad, f (escala de fuente), filaFase, filaOla, carril, hitoNivel, conCarriles, conHitos, conOlas }
  const X = t => o.etq + t * o.unidad, fin = base.finEje, f = o.f;
  let y = 0, s = '';
  const meses = fin / 4;
  // eje
  const yAnio = 14 * f, yMes0 = 20 * f, hMes = 18 * f, yTemp = yMes0 + hMes + 3 * f, hTemp = 10 * f;
  for (let m = 0; m < meses; m++) {
    const c = M.cal(m * 4), x = X(m * 4);
    if (m === 0 || c.mes === 1) s += `<text x="${x + 3 * f}" y="${yAnio}" font-size="${12 * f}" font-weight="600" fill="${T.tinta}">${c.anio}</text>`;
    s += `<rect x="${x}" y="${yMes0}" width="${4 * o.unidad}" height="${hMes}" fill="${m % 2 ? '#ffffff' : '#f1efe9'}"/>`;
    for (let k = 1; k < 4; k++) s += `<line x1="${x + k * o.unidad}" x2="${x + k * o.unidad}" y1="${yMes0 + hMes - (k === 2 ? 6 : 4) * f}" y2="${yMes0 + hMes}" stroke="${T.regla}" stroke-width="${.8 * f}"/>`;
    const txt = 4 * o.unidad >= 26 * f ? M.MES3[c.mes - 1] : M.MES3[c.mes - 1][0];
    s += `<text x="${x + 2 * o.unidad}" y="${yMes0 + hMes - 5 * f}" font-size="${10.5 * f}" text-anchor="middle" fill="${T.tinta2}">${txt}</text>`;
  }
  s += `<line x1="${o.etq}" x2="${X(fin)}" y1="${yMes0 + hMes}" y2="${yMes0 + hMes}" stroke="${T.regla}" stroke-width="${f}"/>`;
  // tira de temporadas
  let ini = 0;
  for (let m = 1; m <= meses; m++) {
    const prev = M.SECAS.has(M.cal((m - 1) * 4).mes), cur = m < meses ? M.SECAS.has(M.cal(m * 4).mes) : !prev;
    if (cur !== prev) {
      const x0 = X(ini * 4), x1 = X(m * 4);
      s += `<rect x="${x0}" y="${yTemp}" width="${x1 - x0}" height="${hTemp}" fill="${prev ? '#eadfc4' : '#cfe2e4'}"/>`;
      if (x1 - x0 > est(prev ? 'secas' : 'lluvias', 9 * f) + 8) s += `<text x="${(x0 + x1) / 2}" y="${yTemp + hTemp - 2.4 * f}" font-size="${8.5 * f}" text-anchor="middle" fill="${T.tinta2}">${prev ? 'secas' : 'lluvias'}</text>`;
      ini = m;
    }
  }
  y = yTemp + hTemp + 8 * f;
  const yIniCuerpo = y;
  let cuerpo = '', etiquetas = '', guias = '';
  const seccion = txt => { cuerpo += `<text x="0" y="${y + 11 * f}" font-size="${9.5 * f}" fill="${T.tinta3}">${txt}</text>`; y += 16 * f; };
  // fases
  if (o.conFases !== false) seccion('Fases');
  const halo = `stroke="#fff" stroke-width="${3.2 * f}" stroke-linejoin="round" paint-order="stroke"`;
  const rotuloTras = (x0, x1, yy, txt, size, color) => {
    // rótulo después del final de la barra; si no cabe, antes de su inicio
    const tx = x1 + 6 * f, cabe = tx + est(txt, size) < X(fin);
    return `<text x="${cabe ? tx : x0 - 6 * f}" y="${yy}" font-size="${size}" text-anchor="${cabe ? 'start' : 'end'}" fill="${color}" ${halo}>${esc(txt)}</text>`;
  };
  (o.conFases === false ? [] : D.FASES).forEach(fz => {
    const r = base.fases[fz.id], h = o.filaFase, yc = y + h / 2;
    cuerpo += `<text x="0" y="${yc + 3.6 * f}" font-size="${10.5 * f}" font-weight="600" fill="${T.tinta}">${fz.id}. ${esc(fz.nombre)}</text>`;
    if (o.olasEnFase5 && fz.id === 5) {
      const o1 = base.olas[1], o2 = base.olas[2], o3 = base.olas[3];
      const seg = (a, b, relleno, borde) => `<rect x="${X(a)}" y="${yc - 6 * f}" width="${Math.max(X(b) - X(a) - 1.5 * f, 3)}" height="${12 * f}" rx="${3 * f}" fill="${relleno}"${borde ? ` stroke="${borde}" stroke-width="${f}"` : ''}/>`;
      cuerpo += seg(o1.s, o1.e, T.tinta2) + seg(o2.s, o2.e, T.pizarra) + seg(o2.e, o3.e, 'url(#rayas)', T.tinta3);
      const dentro = (a, b, txt, txtCorto) => {
        const ancho = X(b) - X(a) - 10 * f, t = est(txt, 9 * f) <= ancho ? txt : (est(txtCorto, 9 * f) <= ancho ? txtCorto : '');
        return t ? `<text x="${X(a) + 5 * f}" y="${yc + 3.2 * f}" font-size="${9 * f}" fill="#fff" font-weight="500">${esc(t)}</text>` : '';
      };
      cuerpo += dentro(o1.s, o1.e, 'Ola 1: lo que depende de la comunidad', 'Ola 1') + dentro(o2.s, o2.e, 'Ola 2: lo que espera dinero y permisos', 'Ola 2');
      if (X(o3.e) - X(o2.e) > est('Seguimiento', 9 * f) + 12 * f) cuerpo += `<text x="${X(o2.e) + 6 * f}" y="${yc + 3.2 * f}" font-size="${9 * f}" fill="${T.tinta}" font-weight="500" ${halo}>Seguimiento</text>`;
    } else {
      cuerpo += `<rect x="${X(r.s)}" y="${yc - 6 * f}" width="${Math.max(X(r.e) - X(r.s) - 1.5 * f, 3)}" height="${12 * f}" rx="${3 * f}" fill="${T.tinta2}"/>`;
      cuerpo += rotuloTras(X(r.s), X(r.e), yc + 3.4 * f, M.rangoCorto(r.s, r.e), 9.5 * f, T.tinta3);
    }
    y += h;
  });
  if (o.conOlas !== false && o.conFases !== false) {
    y += 4 * f; seccion('Olas de implementación');
    D.OLAS.forEach(ol => {
      const r = base.olas[ol.id], h = o.filaOla;
      cuerpo += `<text x="0" y="${y + h / 2 + 3.4 * f}" font-size="${10 * f}" font-weight="600" fill="${T.tinta}">${esc(ol.nombre)}</text>`;
      cuerpo += `<text x="${est(ol.nombre, 10 * f) + 8 * f}" y="${y + h / 2 + 3.4 * f}" font-size="${9 * f}" fill="${T.tinta3}">${M.rangoCorto(r.s, r.e)}</text>`;
      const w = Math.max(X(r.e) - X(r.s) - 1.5 * f, 3);
      if (ol.id === 3) {
        cuerpo += `<rect x="${X(r.s)}" y="${y + h / 2 - 4 * f}" width="${w}" height="${8 * f}" rx="${2.5 * f}" fill="url(#rayas)" stroke="${T.tinta3}" stroke-width="${.8 * f}"/>`;
      } else cuerpo += `<rect x="${X(r.s)}" y="${y + h / 2 - 4 * f}" width="${w}" height="${8 * f}" rx="${2.5 * f}" fill="${T.tinta3}"/>`;
      const tx = X(r.e) + 6 * f, txt = ol.sub, cabe = tx + est(txt, 9.5 * f) < X(fin);
      cuerpo += `<text x="${cabe ? tx : X(r.s) - 6 * f}" y="${y + h / 2 + 3.4 * f}" font-size="${9.5 * f}" text-anchor="${cabe ? 'start' : 'end'}" fill="${T.tinta2}" ${halo}>${esc(txt)}</text>`;
      y += h;
    });
  }
  // hitos con rótulos escalonados
  if (o.conHitos !== false) {
    y += 4 * f; seccion('Hitos y compuertas');
    const hitos = D.A.filter(esHito).sort((a, b) => P[a.id].s - P[b.id].s);
    const nivelFin = [], fs1 = 9.5 * f, fs2 = 8.5 * f, lh = o.hitoNivel;
    const nombreH = a => o.hitoCorto ? (a.corto || a.n) : a.n;
    const coloc = hitos.map(a => {
      const x = X(P[a.id].s), w = Math.max(est(nombreH(a), fs1), est(fechaHito(a), fs2)) + 10 * f;
      const der = x + w > X(fin), x0 = der ? x - w : x, x1 = der ? x : x + w;
      let nv = 0; while (nivelFin[nv] !== undefined && nivelFin[nv] > x0 - 4 * f) nv++;
      nivelFin[nv] = x1;
      return { a, x, nv, der };
    });
    const niveles = nivelFin.length, alto = niveles * lh + 18 * f;
    coloc.forEach(({ a, x, nv, der }) => {
      const yt = y + nv * lh, yd = y + niveles * lh + 6 * f;
      const tx = der ? x - 3 * f : x + 3 * f, ta = der ? 'end' : 'start';
      guias += `<line x1="${x}" x2="${x}" y1="${yt + 3 * f}" y2="${yd - 5 * f}" stroke="${T.regla}" stroke-width="${.8 * f}"/>`;
      etiquetas += `<text x="${tx}" y="${yt + fs1}" font-size="${fs1}" text-anchor="${ta}" fill="${T.tinta}" font-weight="500" ${halo}>${esc(nombreH(a))}</text>`;
      etiquetas += `<text x="${tx}" y="${yt + fs1 + fs2 + 1.5 * f}" font-size="${fs2}" text-anchor="${ta}" fill="${T.tinta3}" ${halo}>${esc(fechaHito(a))}</text>`;
      const r = 4.6 * f;
      etiquetas += a.gate
        ? `<rect x="${x - r}" y="${yd - r}" width="${2 * r}" height="${2 * r}" transform="rotate(45 ${x} ${yd})" fill="#fff" stroke="${T.pizarra}" stroke-width="${1.8 * f}"/>`
        : `<rect x="${x - r}" y="${yd - r}" width="${2 * r}" height="${2 * r}" transform="rotate(45 ${x} ${yd})" fill="${T.pizarra}"/>`;
    });
    y += alto;
  }
  // carriles por componente
  if (o.conCarriles !== false) {
    y += (o.conFases === false && o.conHitos === false ? 0 : 6 * f); seccion('Componentes');
    ORDEN.forEach(c => {
      const grupos = (CARRILES[c] || []).map(([txt, ids]) => ({ txt, s: Math.min(...ids.map(i => P[i].s)), e: Math.max(...ids.map(i => P[i].e)) })).sort((a, b) => a.s - b.s);
      const fsG = 8.8 * f, lhG = fsG + 5 * f, nivelFin = [];
      grupos.forEach(g => { const x = X(g.s), w = est(g.txt, fsG) + 8 * f; let nv = 0; while (nivelFin[nv] !== undefined && nivelFin[nv] > x) nv++; nivelFin[nv] = x + w; g.nv = nv; });
      const niveles = Math.max(1, nivelFin.length), hEt = niveles * lhG, h = hEt + o.carril;
      const nombre = c === 'G' ? COMP[c].nombre : COMP[c].clave + ' ' + COMP[c].nombre;
      cuerpo += `<circle cx="${5 * f}" cy="${y + hEt + o.carril / 2}" r="${4.5 * f}" fill="${COLOR[c]}"/>`;
      // nombre en una o dos líneas
      const max = o.etq - 26 * f, fsN = 10 * f, palabras = nombre.split(' '); let l1 = '', l2 = '';
      palabras.forEach(p => { if (!l2 && est(l1 + ' ' + p, fsN) <= max) l1 = (l1 ? l1 + ' ' : '') + p; else l2 = (l2 ? l2 + ' ' : '') + p; });
      const yN = y + hEt + o.carril / 2 + (l2 ? -1.5 * f : 3.5 * f);
      cuerpo += `<text x="${15 * f}" y="${yN}" font-size="${fsN}" font-weight="600" fill="${T.tinta}">${esc(l1)}</text>`;
      if (l2) cuerpo += `<text x="${15 * f}" y="${yN + 12 * f}" font-size="${fsN}" font-weight="600" fill="${T.tinta}">${esc(l2)}</text>`;
      // barras
      const yb = y + hEt + o.carril / 2;
      D.A.filter(a => a.c === c && !esHito(a)).forEach(a => {
        const p = P[a.id], x = X(p.s), w = Math.max(X(p.e) - x - 1.5 * f, 2.5 * f);
        if (a.t === 'continuo') cuerpo += `<rect x="${x}" y="${yb - 1.5 * f}" width="${w}" height="${3 * f}" rx="${1.5 * f}" fill="${COLOR[c]}"/>`;
        else if (a.t === 'espera') cuerpo += `<rect x="${x}" y="${yb - 6 * f}" width="${w}" height="${12 * f}" rx="${3 * f}" fill="url(#rayas-${c})" stroke="${COLOR[c]}" stroke-width="${1.1 * f}"/>`;
        else cuerpo += `<rect x="${x}" y="${yb - 6 * f}" width="${w}" height="${12 * f}" rx="${3 * f}" fill="${COLOR[c]}"/>`;
      });
      grupos.forEach(g => {
        const yt = y + g.nv * lhG + fsG;
        guias += `<line x1="${X(g.s)}" x2="${X(g.s)}" y1="${yt + 2 * f}" y2="${yb - 7 * f}" stroke="${T.regla}" stroke-width="${.8 * f}"/>`;
        etiquetas += `<text x="${X(g.s)}" y="${yt}" font-size="${fsG}" fill="${T.tinta2}" ${halo}>${esc(g.txt)}</text>`;
      });
      y += h + 4 * f;
      cuerpo += `<line x1="0" x2="${X(fin)}" y1="${y - 2 * f}" y2="${y - 2 * f}" stroke="${T.filete}" stroke-width="${.8 * f}"/>`;
    });
  }
  const H = y + 4 * f;
  // fondo de temporadas y Semana Santa, debajo de todo
  let fondo = '';
  for (let m = 0; m < meses; m++) {
    const c = M.cal(m * 4);
    fondo += `<rect x="${X(m * 4)}" y="${yIniCuerpo}" width="${4 * o.unidad}" height="${H - yIniCuerpo}" fill="${M.SECAS.has(c.mes) ? T.secas : T.lluvias}"/>`;
    fondo += `<line x1="${X(m * 4)}" x2="${X(m * 4)}" y1="${yIniCuerpo}" y2="${H}" stroke="${c.mes === 1 ? T.regla : T.filete}" stroke-width="${(c.mes === 1 ? 1.2 : .7) * f}"/>`;
  }
  ssT.filter(e => e.t < fin).forEach(e => {
    fondo += `<rect x="${X(e.t)}" y="${yIniCuerpo}" width="${e.u * o.unidad}" height="${H - yIniCuerpo}" fill="${T.ss}"/>`;
    fondo += `<text x="${X(e.t + e.u) + 3 * f}" y="${yIniCuerpo + 9 * f}" font-size="${8 * f}" fill="${T.tinta2}">Semana Santa</text>`;
  });
  const defs = `<defs><pattern id="rayas" width="${5 * f}" height="${5 * f}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${2.2 * f}" height="${5 * f}" fill="${T.tinta3}"/></pattern>` +
    ORDEN.map(c => `<pattern id="rayas-${c}" width="${5 * f}" height="${5 * f}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${2.2 * f}" height="${5 * f}" fill="${COLOR[c]}"/></pattern>`).join('') + `</defs>`;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${o.W}" height="${H}" viewBox="0 0 ${o.W} ${H}" font-family="Jost, sans-serif">${defs}${fondo}${s}${guias}${cuerpo}${etiquetas}</svg>`, alto: H };
}

/* ───────────────────────── Tabla-Gantt por componente ───────────────────────── */
function fondoBarras(eje) {
  const n = (eje.e - eje.s) / 4, capas = [];
  let g = [];
  for (let i = 0; i < n; i++) {
    const c = M.cal(eje.s + i * 4), col = M.SECAS.has(c.mes) ? T.secas : T.lluvias;
    g.push(`${col} ${(i / n * 100).toFixed(3)}%`, `${col} ${((i + 1) / n * 100).toFixed(3)}%`);
  }
  const lineas = [];
  for (let i = 1; i < n; i++) {
    const p = (i / n * 100).toFixed(3), c = M.cal(eje.s + i * 4), col = c.mes === 1 ? T.regla : '#dedbd2';
    lineas.push(`transparent calc(${p}% - .5px)`, `${col} calc(${p}% - .5px)`, `${col} calc(${p}% + .5px)`, `transparent calc(${p}% + .5px)`);
  }
  const ss = [];
  ssT.forEach(e => { if (e.t >= eje.s && e.t < eje.e) { const a = ((e.t - eje.s) / (eje.e - eje.s) * 100).toFixed(3), b = ((e.t + e.u - eje.s) / (eje.e - eje.s) * 100).toFixed(3); ss.push(`transparent ${a}%`, `${T.ss} ${a}%`, `${T.ss} ${b}%`, `transparent ${b}%`); } });
  if (ss.length) capas.push(`linear-gradient(to right, transparent 0%, ${ss.join(', ')}, transparent 100%)`);
  if (lineas.length) capas.push(`linear-gradient(to right, transparent 0%, ${lineas.join(', ')}, transparent 100%)`);
  capas.push(`linear-gradient(to right, ${g.join(', ')})`);
  return capas.join(', ');
}
function ejeDe(ids) {
  let s = Math.min(...ids.map(i => P[i].s)), e = Math.max(...ids.map(i => esHito(idx.get(i)) ? P[i].s + 1 : P[i].e));
  s = Math.floor(s / 4) * 4; e = Math.ceil(e / 4) * 4;
  if (e - s < 16) e = s + 16;
  return { s, e };
}
function cabeceraEje(eje) {
  const n = (eje.e - eje.s) / 4;
  let meses = '', anios = '';
  for (let i = 0; i < n; i++) {
    const c = M.cal(eje.s + i * 4);
    meses += `<span style="width:${100 / n}%">${n > 14 ? M.MES3[c.mes - 1][0] : M.MES3[c.mes - 1]}</span>`;
    if (i === 0 || c.mes === 1) anios += `<span style="left:${i / n * 100}%">${c.anio}</span>`;
  }
  return `<div class="eje"><div class="anios">${anios}</div><div class="meses">${meses}</div></div>`;
}
function filaTabla(a, eje) {
  const p = P[a.id], span = eje.e - eje.s;
  const izq = ((p.s - eje.s) / span * 100).toFixed(3), ancho = ((p.e - p.s) / span * 100).toFixed(3);
  let barra;
  if (esHito(a)) barra = `<i class="rombo${a.gate ? ' gate' : ''}" style="left:${izq}%"></i>`;
  else if (a.t === 'continuo') barra = `<i class="barra continua" style="left:${izq}%;width:calc(${ancho}% - 1px)"></i>`;
  else barra = `<i class="barra${a.t === 'espera' ? ' espera' : ''}" style="left:${izq}%;width:max(calc(${ancho}% - 1.5px), 3px)"></i>`;
  const deps = a.d.filter(d => idx.has(d)).map(d => `<span class="nw">${cod[d]}</span>`).join(', ') || '—';
  return `<div class="c cod">${cod[a.id]}</div><div class="c act${esHito(a) ? ' hito' : ''}">${esc(a.n)}</div><div class="c">${esc(a.p)}</div><div class="c">${esc(a.r)}</div><div class="c dep"><span>${deps}</span></div><div class="c per">${esc(periodoCorto(a))}</div><div class="c barras" style="--c:${COLOR[a.c]};background:${fondoBarras(eje)}">${barra}</div>`;
}
function tablaGantt(ids) {
  const eje = ejeDe(ids);
  const filas = ids.map(i => filaTabla(idx.get(i), eje)).join('');
  return `<div class="gt" data-cols="7"><div class="cab">Código</div><div class="cab">Actividad</div><div class="cab">Producto que deja</div><div class="cab">Responsable</div><div class="cab">Depende de</div><div class="cab">Periodo</div><div class="cab barras-cab">${cabeceraEje(eje)}</div>${filas}</div>`;
}

/* ───────────────────────── Versiones del documento ───────────────────────── */
const VERSIONES = {
  fondos: { id: 'fondos', pre: 'Versión completa para las instancias de financiamiento', pie: 'Cronograma hipotético, versión completa para las instancias de financiamiento, noviembre de 2026' },
  asamblea: { id: 'asamblea', pre: 'Versión para la asamblea ejidal de La Florida', pie: 'Cronograma hipotético, versión para la asamblea ejidal de La Florida, diciembre de 2026' }
};

const membrete = () => `<div class="membrete"><div class="lockup">${LOGO_LABRURAL ? `<img src="${LOGO_LABRURAL}" alt="Laboratorio de Desarrollo Rural">` : '<b>Laboratorio de Desarrollo Rural</b><span>Universidad Autónoma de Querétaro</span>'}</div><div class="doc">Cronograma hipotético de la Presa de La Florida</div></div>`;
function hacerPagina(V) {
  return (contenido, clase = '', nota = false) => {
    const pie = nota
      ? `<div class="pie"><span>Nota para el equipo de trabajo; no forma parte del documento que se entrega</span><span></span></div>`
      : `<div class="pie"><span>${esc(V.pie)}</span><span class="num"></span></div>`;
    return `<section class="pagina ${clase}${nota ? ' nota-pag' : ''}">${membrete()}<div class="cuerpo">${contenido}</div>${pie}</section>`;
  };
}
const tabla = (clase, cols, cabeceras) => `<div class="tabla ${clase}" data-cols="${cols}">` + cabeceras.map(c => `<div class="cab">${c}</div>`).join('');

/* Paginador: parte en páginas de continuación las tablas que no caben y numera el pie. Corre en el navegador. */
function paginador() {
  const desborda = c => c.scrollHeight > c.clientHeight + 1;
  const nCab = t => +t.dataset.cols;
  const filasDe = t => (t.children.length - nCab(t)) / nCab(t);
  const movible = el => el && el.hasAttribute('data-cols') && filasDe(el) > 1;
  function continuar(pg) {
    const nueva = document.createElement('section');
    nueva.className = pg.className + ' continua';
    const cuerpo = document.createElement('div'); cuerpo.className = 'cuerpo';
    const h2 = pg.querySelector('.cuerpo > h2.titulo');
    let ancla = null;
    if (h2) {
      ancla = h2.cloneNode(true);
      ancla.querySelectorAll('.retirar, .cont').forEach(x => x.remove());
      const s = document.createElement('span'); s.className = 'cont'; s.textContent = '(continuación)';
      ancla.appendChild(s); cuerpo.appendChild(ancla);
    }
    nueva.append(pg.querySelector('.membrete').cloneNode(true), cuerpo, pg.querySelector('.pie').cloneNode(true));
    pg.after(nueva);
    return { nueva, c2: cuerpo, ancla };
  }
  const poner = (c2, ancla, el) => { if (ancla) ancla.after(el); else c2.prepend(el); };
  const cola = Array.from(document.querySelectorAll('section.pagina:not(.portada):not(.fija)'));
  let guardia = 0;
  while (cola.length && guardia++ < 500) {
    const pg = cola.shift(), c = pg.querySelector('.cuerpo');
    if (!c || !desborda(c)) continue;
    if (c.children.length < 2 || (c.children.length === 2 && !movible(c.lastElementChild))) continue;
    const { nueva, c2, ancla } = continuar(pg);
    const espejo = new Map();
    let vueltas = 0;
    while (desborda(c) && vueltas++ < 400) {
      const ult = c.lastElementChild;
      if (!ult || ult === c.firstElementChild) break;
      if (ult.hasAttribute('data-cols')) {
        const n = nCab(ult);
        let t2 = espejo.get(ult);
        if (!t2 && filasDe(ult) <= 4 && c.children.length > 2) poner(c2, ancla, ult);
        else if (filasDe(ult) > 1) {
          if (!t2) { t2 = ult.cloneNode(false); for (let k = 0; k < n; k++) t2.appendChild(ult.children[k].cloneNode(true)); poner(c2, ancla, t2); espejo.set(ult, t2); }
          const celdas = Array.from(ult.children).slice(-n), ref = t2.children[n] || null;
          celdas.forEach(x => t2.insertBefore(x, ref));
        } else if (t2) {
          const celdas = Array.from(ult.children).slice(n), ref = t2.children[n] || null;
          celdas.forEach(x => t2.insertBefore(x, ref));
          ult.remove();
        } else poner(c2, ancla, ult);
      } else poner(c2, ancla, ult);
      const fin = c.lastElementChild;
      if (fin && fin !== c.firstElementChild && fin.matches('h3')) poner(c2, ancla, fin);
    }
    cola.unshift(nueva);
  }
  const numeradas = Array.from(document.querySelectorAll('section.pagina')).filter(p => !p.classList.contains('nota-pag'));
  numeradas.forEach((p, i) => { const s = p.querySelector('.pie .num'); if (s) s.textContent = (i + 1) + ' de ' + numeradas.length; });
  window.__paginado = true;
}
const SCRIPT_PAGINADOR = `window.__paginado = false;
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(${paginador.toString()}));`;

/* ───────────────────────── Piezas compartidas ───────────────────────── */
function portada(V) {
  const grande = V.id === 'asamblea';
  const fsT = grande ? 14 : 11.5, alto = grande ? 29 : 24, barra = grande ? 15 : 13;
  const ancho = 860, unidad = ancho / base.finEje, X = t => t * unidad;
  const hFondo = 8 + 5 * alto;
  let g = '';
  const meses = base.finEje / 4;
  for (let m = 0; m < meses; m++) {
    const c = M.cal(m * 4);
    g += `<rect x="${X(m * 4)}" y="0" width="${4 * unidad}" height="${hFondo}" fill="${M.SECAS.has(c.mes) ? T.secas : T.lluvias}"/>`;
    if (c.mes === 1 || m === 0) g += `<text x="${X(m * 4) + 4}" y="${hFondo + 19}" font-size="${fsT}" fill="${T.tinta3}">${c.anio}</text>`;
    g += `<line x1="${X(m * 4)}" x2="${X(m * 4)}" y1="${hFondo}" y2="${hFondo + (c.mes === 1 ? 8 : 4)}" stroke="${T.regla}"/>`;
  }
  D.FASES.forEach((fz, i) => {
    const r = base.fases[fz.id], yy = 6 + i * alto;
    g += `<rect x="${X(r.s)}" y="${yy}" width="${Math.max(X(r.e) - X(r.s) - 1.5, 3)}" height="${barra}" rx="3" fill="${T.tinta2}"/>`;
    const txt = `${fz.id}. ${fz.nombre}`, w = est(txt, fsT), tx = X(r.e) + 6;
    const pos = tx + w < ancho ? { x: tx, a: 'start', c: T.tinta } : X(r.s) - 6 - w > 0 ? { x: X(r.s) - 6, a: 'end', c: T.tinta } : { x: X(r.s) + 8, a: 'start', c: '#fff' };
    g += `<text x="${pos.x}" y="${yy + barra * .8}" font-size="${fsT}" text-anchor="${pos.a}" fill="${pos.c}">${esc(txt)}</text>`;
  });
  const hSvg = hFondo + 26;
  return `<section class="pagina portada">
    <div class="p-cabeza">${LOGO_LABRURAL ? `<img src="${LOGO_LABRURAL}" alt="Laboratorio de Desarrollo Rural" class="p-logo">` : '<div class="p-lockup"><b>Laboratorio de Desarrollo Rural</b><span>Universidad Autónoma de Querétaro</span><span>Facultad de Ciencias Naturales, Campus Concá</span></div>'}</div>
    <div class="p-centro">
      ${EMBLEMA ? `<img src="${EMBLEMA}" alt="Emblema de la Presa de La Florida" class="p-emblema">` : ''}
      <div class="p-titulos">
        <p class="p-pre">${esc(V.pre)}</p>
        <h1>Cronograma hipotético del anteproyecto</h1>
        <p class="p-sub">Habilitación de la orilla de la Presa de La Florida, Arroyo Seco, Querétaro</p>
        <p class="p-per">Octubre de 2026 a noviembre de 2028</p>
      </div>
    </div>
    <svg class="p-graf" width="${ancho}" height="${hSvg}" viewBox="0 0 ${ancho} ${hSvg}" font-family="Jost, sans-serif">${g}</svg>
    <div class="p-pie"><span>Licenciatura en Producción Agropecuaria Sustentable, curso Gestión y Manejo de Proyectos</span><span>Versión de noviembre de 2026</span></div>
  </section>`;
}

function textosRiesgo() {
  const tiene = (e, txt) => e.al.some(a => a.msg.includes(txt));
  const cierre = e => e.dif > 0 ? `el cierre pasa a ${M.hitoTexto(e.cierre)}, ${e.dif} semanas después` : 'el cierre no se mueve';
  const partes = lista => lista.filter(Boolean).join('; ');
  return {
    anu: partes([
      (tiene(E.anu4, 'reglamento') || tiene(E.anu4, 'letreros') || tiene(E.anu4, 'contenedores')) && 'Semana Santa de 2027 llega sin reglamento, letreros ni contenedores',
      tiene(E.anu4, 'ventanilla') && 'la solicitud a PROCODES pierde la ventanilla de marzo y palapas, bancas y explanada se recorren un año',
      cierre(E.anu4)]),
    din8: partes([tiene(E.din8, 'muelle no está listo') && 'el muelle no llega a Semana Santa de 2028', cierre(E.din8)]),
    din16: partes([tiene(E.din16, '31 de diciembre') && 'parte de la obra de PROCODES rebasa el 31 de diciembre', tiene(E.din16, 'muelle se recorre') && 'el muelle pasa a las secas siguientes', cierre(E.din16)]),
    per8: partes([tiene(E.per8, '150 días') && 'la autorización ambiental rebasa los 150 días de PROCODES y el apoyo se cancela', tiene(E.per8, 'muelle no está listo') && 'el muelle no llega a Semana Santa de 2028', cierre(E.per8)]),
    per16: partes([tiene(E.per16, '31 de diciembre') && 'además, la obra de PROCODES rebasa el 31 de diciembre', tiene(E.per16, 'muelle se recorre') && 'el muelle pasa a las secas siguientes'])
  };
}
const RQ = textosRiesgo();
const ordenar = ids => ids.sort((a, b) => (P[a].s - P[b].s) || (D.A.indexOf(idx.get(a)) - D.A.indexOf(idx.get(b))));
const rangoCompacto = (s, e) => {
  const r = M.rangoCorto(s, e), m = r.match(/^(\S+) (\d{4}) – (\S+) (\d{4})$/);
  return m && m[2] === m[4] ? `${m[1]} – ${m[3]} ${m[2]}` : r;
};

/* ───────────────────────── Versión completa (fondos) ───────────────────────── */
function anexoFondos() {
  const V = VERSIONES.fondos, pagina = hacerPagina(V), paginas = [portada(V)];

  paginas.push(pagina(`
  <h2 class="titulo">Presentación</h2>
  <div class="dos-col">
    <div>
      <p>Este documento presenta el calendario hipotético del anteproyecto para habilitar la orilla de la Presa de La Florida como espacio de uso público, de convivencia y de conservación. El calendario no compromete obra ni recursos: cada etapa queda sujeta a que la anterior se cumpla y a las decisiones de la asamblea ejidal, de la comunidad y de las instancias de financiamiento.</p>
      <p>La secuencia arranca con el catálogo de propuestas que integró el grupo de la Licenciatura en Producción Agropecuaria Sustentable. Sigue con la presentación del catálogo a la asamblea ejidal y a la comunidad en diciembre de 2026, para recoger su retroalimentación y su consentimiento. Con el comité de la presa constituido en enero de 2027 se redactan los acuerdos de uso y el reglamento, que la asamblea aprueba antes de Semana Santa de 2027.</p>
      <p>Durante 2027 corre la gestión de financiamiento y permisos: autogestión y aportación en especie, Ayuntamiento de Arroyo Seco, PROCODES de la CONANP y CONAFOR, junto con la autorización en materia de impacto ambiental y la concesión de zona federal que exige el muelle.</p>
      <p>La implementación avanza en dos olas. La primera, de enero a octubre de 2027, reúne lo que la comunidad puede hacer con sus propios medios: control de erosión, revegetación, contenedores, rutas y letreros de reglas. La segunda, de noviembre de 2027 a abril de 2028, construye lo que requiere financiamiento externo y permisos: palapas con asadores, bancas, explanada, estacionamiento con cerca de acceso, luminaria y muelle.</p>
    </div>
    <div>
      <h3>Cómo leer el cronograma</h3>
      <p><b>Unidad de tiempo.</b> Cada mes se divide en cuatro semanas aproximadas (1 a 7, 8 a 14, 15 a 21 y 22 al cierre). No se programa trabajo en la última semana de diciembre ni en la primera de enero.</p>
      <p><b>Temporadas.</b> El fondo distingue las secas, de noviembre a mayo, y las lluvias, de junio a octubre. Lo que se construye cae en secas; lo que se siembra arranca con las primeras lluvias.</p>
      <p><b>Semana Santa.</b> Las franjas grises marcan Semana Santa de 2027 y de 2028, las fechas de mayor uso de la orilla y las metas de la primera prueba y del estreno.</p>
      <p><b>Hitos y compuertas.</b> El rombo lleno marca un producto o una decisión; el rombo hueco marca una compuerta: lo que sigue solo ocurre si la respuesta es afirmativa. El apartado de hitos detalla qué pasa si la respuesta es negativa.</p>
      <p><b>Esperas.</b> Las barras rayadas son plazos que dependen de un tercero (dictámenes y permisos).</p>
      <p><b>Códigos.</b> Cada renglón lleva el código de su componente: G para la ruta de gestión, 1a a 5 para los seis componentes y H para los hitos. La columna «Depende de» usa esos códigos.</p>
      <p class="cifras">${D.A.length} renglones, ${D.A.filter(esHito).length} hitos, ${D.A.filter(a => a.gate).length} compuertas y ${new Set(D.A.map(a => a.r)).size} cargos responsables. Cada renglón deja un producto verificable.</p>
      <div class="firma"><span class="linea"></span><b>Dr. Eduardo Luna Sánchez</b><span>Profesor-investigador</span><span>Facultad de Ciencias Naturales, Campus Concá</span></div>
    </div>
  </div>`, 'fija'));

  // Cinco fases
  {
    const g = svgMaestro({ W: 952, etq: 200, unidad: (952 - 200) / base.finEje, f: 1, filaFase: 20, filaOla: 18, carril: 20, hitoNivel: 22, conCarriles: false, conHitos: false });
    const hitosDe = f => D.A.filter(a => esHito(a) && a.f === f).sort((x, y) => P[x.id].s - P[y.id].s).map(a => `${esc(a.n)} (${esc(fechaHito(a))})`).join('; ');
    const QUE = {
      1: 'Integración de las propuestas de los seis equipos, fotomontajes y cronograma hipotético.',
      2: 'Solicitud del punto en el orden del día, convocatoria con cédulas, presentación del catálogo y ajustes.',
      3: 'Presentación pública en la orilla, censo de quienes cuidan hoy la orilla, constitución del comité, reglas de fuego y reglamento consultado y aprobado.',
      4: 'Carpeta con cotizaciones; autogestión, Ayuntamiento, PROCODES y CONAFOR; impacto ambiental y concesión de zona federal.',
      5: 'Ola 1, lo que depende de la comunidad; ola 2, lo que espera dinero y permisos; seguimiento de riego, reposición y revisiones tras las lluvias.'
    };
    let t = tabla('t-fases', 4, ['Fase', 'Periodo', 'Qué ocurre', 'Hitos']);
    D.FASES.forEach(fz => { const r = base.fases[fz.id]; t += `<div class="c"><b>${fz.id}. ${esc(fz.nombre)}</b></div><div class="c">${M.rangoTexto(r.s, r.e)}</div><div class="c">${QUE[fz.id]}</div><div class="c">${hitosDe(fz.id) || '—'}</div>`; });
    t += '</div>';
    paginas.push(pagina(`<h2 class="titulo">El calendario en cinco fases</h2><p class="intro">Las fases se traslapan: la ola 1 arranca en enero de 2027, mientras siguen abiertos el financiamiento y los permisos.</p><div class="graf">${g.svg}</div>${t}`, 'fija'));
  }

  // Gantt maestro en dos páginas: fases e hitos; componentes
  {
    const a = svgMaestro({ W: 952, etq: 196, unidad: (952 - 196) / base.finEje, f: 1.27, filaFase: 25, filaOla: 20, carril: 20, hitoNivel: 29, conOlas: false, olasEnFase5: true, hitoCorto: false, conCarriles: false });
    paginas.push(pagina(`<h2 class="titulo">Gantt maestro: fases e hitos</h2><p class="intro">Las cinco fases y los catorce hitos, de octubre de 2026 a noviembre de 2028. El rombo hueco marca una compuerta: lo que sigue solo ocurre si la respuesta es afirmativa.</p><div class="graf">${a.svg}</div>`, 'maestro fija'));
    const b = svgMaestro({ W: 952, etq: 196, unidad: (952 - 196) / base.finEje, f: 1.18, filaFase: 22, filaOla: 20, carril: 21, hitoNivel: 27, conFases: false, conHitos: false });
    paginas.push(pagina(`<h2 class="titulo">Gantt maestro: componentes</h2><p class="intro">Los seis componentes y la ruta de gestión sobre el mismo eje de tiempo. El detalle de cada uno, renglón por renglón, sigue en las páginas siguientes.</p><div class="graf">${b.svg}</div>`, 'maestro fija'));
  }

  // Componentes
  const paginaComp = (c, titulo, ids, intro) => paginas.push(pagina(`<h2 class="titulo"><i class="punto" style="background:${COLOR[c]}"></i>${esc(titulo)}</h2><p class="intro">${esc(intro)}</p>${tablaGantt(ids)}`));
  const gA = ordenar(D.A.filter(a => a.c === 'G' && (a.f <= 3 || a.f === 5)).map(a => a.id));
  const gB = ordenar(D.A.filter(a => a.c === 'G' && a.f === 4).map(a => a.id));
  paginaComp('G', 'Ruta de gestión: catálogo, anuencias, comité y cierre', gA, 'Del catálogo a la asamblea ejidal y la comunidad, la línea base compartida, los hitos de la implementación y el informe final.');
  paginaComp('G', 'Ruta de gestión: financiamiento y permisos', gB, 'Carpeta del proyecto, ventanillas de financiamiento y trámites de impacto ambiental y zona federal. Las barras rayadas son plazos que controla un tercero.');
  ['1a', '1b', '2', '3', '4', '5'].forEach(c => paginaComp(c, COMP[c].clave + ' · ' + COMP[c].nombre, ordenar(D.A.filter(a => a.c === c).map(a => a.id)), 'Deja: ' + COMP[c].deja));

  // Hitos y compuertas
  {
    const hs = D.A.filter(esHito).sort((a, b) => P[a.id].s - P[b.id].s);
    let t = tabla('t-hitos', 6, ['Código', 'Hito', 'Fecha', 'Qué deja', 'Responsable', 'Si la respuesta es negativa']);
    hs.forEach(a => { t += `<div class="c cod">${cod[a.id]}</div><div class="c"><span><i class="rombo-t${a.gate ? ' gate' : ''}"></i><b>${esc(a.n)}</b></span></div><div class="c">${esc(fechaHito(a))}</div><div class="c">${esc(a.p)}</div><div class="c">${esc(a.r)}</div><div class="c">${a.gate ? esc(a.siNo) : '<span class="tenue">No es compuerta.</span>'}</div>`; });
    t += '</div>';
    paginas.push(pagina(`<h2 class="titulo">Hitos y compuertas</h2><p class="intro">Seis compuertas condicionan el avance: la anuencia del ejido, el consentimiento de la comunidad, el apoyo de PROCODES, la autorización de impacto ambiental, la concesión de zona federal y el presupuesto municipal 2028.</p>${t}`));
  }

  // Ventanillas y permisos
  {
    const f = (s, e) => M.rangoCorto(P[s].s, P[e || s].e);
    const fondos = [
      ['Autogestión y aportación en especie', 'Casi toda la ola 1: trancas, cercos, fajinas, trampa de azolve, estacas vivas, cajetes y siembra, contenedores, fantasmas luminiscentes, rutas y letreros de reglas.', 'Comité de la presa, ejido y faenas comunitarias.', `Desde febrero de 2027; kermés en Semana Santa de 2027. Las faenas se registran como jornales valorizados (${cod.G10}).`, 'El capital semilla de la UAQ se declara como contrapartida.'],
      ['Ayuntamiento de Arroyo Seco', 'En 2027: ruta de recolección, servicio de limpia, maquinaria y materiales en especie. En 2028: estacionamiento, cerca de acceso, luminaria y muelle como obra con recursos propios.', 'Presidencia del comité, con el expediente técnico.', `Petición entre agosto y mediados de octubre de 2027 (${cod.G19}), antes de que se integre el presupuesto de egresos 2028; aprobación en diciembre (${cod.H10}).`, 'Sin FAIS, que no aplica en La Florida. Requiere el visto bueno de Obras Públicas y Protección Civil.'],
      ['CONANP · PROCODES', 'Proyecto ecoturístico: tres palapas con mesa, bancas y asador; diez bancas; explanada; letrero de bienvenida y panel de caminatas.', 'El comité de la presa como grupo organizado, con al menos cinco personas por concepto y el acta de anuencia del ejido. La UAQ acompaña y no puede ser solicitante.', 'Referencia 2026: convocatoria a más tardar el último día hábil de febrero; 15 días hábiles para solicitudes; dictamen hasta 20 días hábiles; notificación hasta 10; primera ministración hasta 20 días hábiles después del convenio.', 'Permisos y autorizaciones ambientales dentro de 150 días naturales tras la aprobación; acciones concluidas antes del 31 de diciembre; comité de seguimiento con presidencia, secretaría y tesorería. El concepto «atracadero para embarcaciones menores» abre una ruta alterna para el muelle en una convocatoria posterior.'],
      ['CONAFOR', 'Planta de especies nativas para los cuarenta árboles, la sombra de palapas y bancas y la reposición; asesoría técnica.', 'Vocalía de siembra, con el ejido.', `Pedido en febrero de 2027 (${cod['1b.2']}); entrega con las lluvias, de junio a julio (${cod['1b.10']}). Por confirmar con la oficina estatal.`, 'Reglas de operación 2026 publicadas el 16 de enero de 2026; los apoyos de restauración operan con convocatorias específicas de ventana corta.']
    ];
    const permisos = [
      ['Anuencia de la asamblea ejidal', 'Comisariado ejidal y asamblea', 'Convocatoria con cédulas de 8 a 15 días antes; un mes, representante de la Procuraduría Agraria y fedatario si el acuerdo toca el destino de tierras de uso común (Ley Agraria, arts. 25 y 28).', 'Toda obra; acredita la posesión ante PROCODES.', `${f('G4')} a ${fechaHito(idx.get('H2'))}`],
      ['Autorización en materia de impacto ambiental', 'SEMARNAT, con opinión de la Dirección de la Reserva de la Biosfera Sierra Gorda', 'De 60 a 120 días hábiles para la manifestación; 20 para el informe preventivo. Las obras en áreas naturales protegidas federales la requieren (LGEEPA, art. 28, fr. XI).', 'Palapas, explanada, estacionamiento, luminaria y muelle.', `Ingreso ${M.rangoCorto(P.G16.s, P.G16.e)}; resolución ${fechaHito(idx.get('H8'))}`],
      ['Concesión de zona federal (CONAGUA-01-006)', 'CONAGUA', '60 días hábiles con expediente completo; pide la autorización de impacto ambiental o su exención. La zona federal es la franja de diez metros contigua al vaso.', 'Muelle y boyas.', `${M.rangoCorto(P.G18.s, P.G18.e)}; título ${fechaHito(idx.get('H9'))}`],
      ['Visto bueno municipal y reglas de fuego', 'Ayuntamiento: Obras Públicas y Protección Civil', 'Sin plazo legal fijado en este cronograma. La temporada de incendios de la Sierra Gorda va de diciembre a junio, con marzo y abril como meses críticos.', 'Estacionamiento, luminaria, asadores y fogatas.', `${f('4.8')}; reglas de fuego ${f('5.3')}`]
    ];
    let t1 = tabla('t-fondos', 5, ['Fuente', 'Qué financiaría', 'Quién solicita', 'Ventana y plazos', 'Condiciones']);
    fondos.forEach(r => { t1 += `<div class="c"><b>${esc(r[0])}</b></div>` + r.slice(1).map(x => `<div class="c">${esc(x)}</div>`).join(''); });
    t1 += '</div>';
    let t2 = tabla('t-permisos', 5, ['Trámite', 'Autoridad', 'Plazo y requisito', 'Piezas que cubre', 'En el cronograma']);
    permisos.forEach(r => { t2 += `<div class="c"><b>${esc(r[0])}</b></div>` + r.slice(1).map(x => `<div class="c">${esc(x)}</div>`).join(''); });
    t2 += '</div>';
    paginas.push(pagina(`<h2 class="titulo">Ventanillas de financiamiento y permisos</h2><p class="intro">Cada fuente financia la ola cuyo calendario le cuadra. Los plazos de PROCODES y CONAFOR toman como referencia las reglas de operación de 2026 mientras se publican las de 2027.</p>${t1}<h3 class="sub">Permisos y trámites</h3>${t2}`));
  }

  // Supuestos y riesgos
  {
    const filas = [
      ['La anuencia del ejido llega tarde', 'El punto no entra en el orden del día de la asamblea de diciembre.', `Con cuatro semanas de atraso: ${RQ.anu}.`, 'Pedir el punto antes del 25 de noviembre; si la asamblea se recorre, convocar una extraordinaria en enero y reducir la ola 1 a lo que pide Semana Santa.'],
      ['La presentación a la comunidad se recorre a enero', 'La fecha cae en la última semana de diciembre.', `Es el renglón con menos holgura: una semana de atraso recorre el cierre ${frag.G7 ? frag.G7.cierre : 0} semanas, porque la cadena pierde la ventanilla de PROCODES.`, 'Fijar el domingo de la presentación en la misma asamblea ejidal.'],
      ['El dinero llega tarde', 'El dictamen de PROCODES o el presupuesto municipal se demoran.', `Con ocho semanas: ${RQ.din8}. Con dieciséis: ${RQ.din16}.`, 'Comprar materiales en julio con la primera ministración y dejar la faena de palapas lista para la primera semana de noviembre.'],
      ['Los permisos tardan', 'La manifestación de impacto ambiental recibe observaciones o la concesión se detiene.', `Con ocho semanas por permiso: ${RQ.per8}. Con dieciséis: ${RQ.per16 || 'los mismos efectos, más acentuados'}.`, 'Ingresar la manifestación en marzo de 2027 tras consultar la vía con la Dirección de la Reserva; separar el muelle del resto si la concesión se detiene.'],
      ['La carga de febrero de 2027', 'Faenas encimadas y vocalías saturadas.', 'Febrero concentra el arranque porque Semana Santa y la ventanilla de PROCODES llegan en marzo; un atraso ahí rompe primero los letreros de reglas.', 'Priorizar reglamento, contenedores, letreros y rutas; erosión y corredores quedan para marzo a mayo.'],
      ['Las lluvias se adelantan o se retrasan', 'El temporal no arranca en la segunda quincena de junio.', 'La siembra y las estacas vivas pierden su ventana y esperan un año.', 'Tener los cajetes listos al final de mayo y sembrar con las primeras lluvias reales, no con una fecha fija.'],
      ['Incendios en la temporada de secas', 'Quemas cercanas o declaratoria de emergencia estatal.', 'Asadores y fogatas operan en la temporada de mayor riesgo, de diciembre a junio.', 'Abrir los asadores solo con reglas de fuego aprobadas y restringir fogatas en la temporada.'],
      ['Desgaste del comité', 'Recorridos sin cubrir y actas sin firmas.', 'Los recorridos y el riego de auxilio se interrumpen.', 'Acta con suplencias, turnos rotativos e informe trimestral a la asamblea.']
    ];
    let t = tabla('t-riesgos', 4, ['Supuesto o riesgo', 'Señal temprana', 'Efecto en el calendario', 'Respuesta prevista']);
    filas.forEach(r => { t += `<div class="c"><b>${esc(r[0])}</b></div>` + r.slice(1).map(x => `<div class="c">${esc(x)}</div>`).join(''); });
    t += '</div>';
    paginas.push(pagina(`<h2 class="titulo">Supuestos y riesgos</h2><p class="intro">Los efectos se calcularon con el mismo motor del cronograma: se atrasa una fecha y se recorre todo lo que depende de ella, respetando secas, lluvias y plazos.</p>${t}`));
  }

  // Nota de elaboración (sin número)
  {
    const decisiones = [
      'El cronograma integra los seis cronogramas de los equipos y el catálogo de propuestas. Se corrigieron dependencias circulares, renglones que dependían de sí mismos o de renglones inexistentes y cruces sin resolver: el componente 2 recibía en mayo espacios que el 5 entregaba hasta septiembre, y la explanada se nivelaba en temporada de lluvias.',
      'Las piezas fuera de la lista de ocho se acomodaron en los seis componentes originales: trancas del vertedor en 1a; corredor de fauna en 1b; reglamento, comité, recorridos y letreros en 2; muelle, boyas y senderos en 3; estacionamiento con cerca, contenedores, luminaria y barreras vivas en 4; palapas con asadores, bancas y explanada en 5.',
      'Los contenedores siguen el catálogo (uno metálico por sitio, sin separación) en lugar de los nueve con separación del cronograma del equipo.',
      'El equipo de Participación planeó informar al comisariado sin pedir asamblea; el cronograma sigue la decisión posterior de pedir anuencia en asamblea.',
      'Los consentimientos del ejido y de la comunidad se fijaron en diciembre de 2026: asamblea en la primera semana y presentación comunitaria en la tercera. El comité se formaliza en enero de 2027.',
      'Se usa una sola línea base compartida en lugar de seis repetidas. Los árboles de sombra se plantan en junio de 2027 en los sitios marcados para palapas y bancas, antes de que estas existan.',
      'Responsables por cargo y no por nombre, porque el semestre termina el 27 de noviembre de 2026 y el calendario vive en 2027 y 2028.',
      'Duraciones de trámites: impacto ambiental con 90 días hábiles, punto medio del rango de 60 a 120; zona federal con 60 días hábiles. La concesión del Parque Lineal de Concá, detenida más de dos años, justifica tratar al muelle como el renglón más frágil.',
      'Dos versiones del mismo calendario. La de la asamblea se queda con lo que se pide al ejido, las fases, los componentes, las compuertas y los riesgos principales, con letra de 11 puntos o más. Esta versión completa lleva las tablas a 8 puntos y parte en páginas de continuación las que no caben.',
      'El emblema es el motivo de ola y cerro, el que guardó el equipo de señalética junto a los letreros. El logotipo del Laboratorio de Desarrollo Rural no se encontró en Drive y el membrete va en texto, con Jost como sustituto libre de Futura.'
    ];
    const fuentes = [
      'Reglas de Operación del PROCODES para el ejercicio fiscal 2026, DOF 15/01/2026, numerales 3.1, 3.2, 3.3 y 4.2, y Anexo 2.',
      'Reglas de Operación 2026 del Programa Desarrollo Forestal Sustentable para el Bienestar (CONAFOR), DOF 16/01/2026.',
      'CONAGUA, ficha del trámite CONAGUA-01-006, Concesión para la ocupación de terrenos federales.',
      'Ley General del Equilibrio Ecológico y la Protección al Ambiente, artículos 28 (fracción XI) y 35 bis.',
      'Ley Agraria, artículos 23, 25 y 28.',
      'CONANP, Manejo de fuego en áreas naturales protegidas de la Región Central de la Sierra Madre Oriental.'
    ];
    paginas.push(pagina(`<h2 class="titulo">Nota de elaboración <span class="retirar">Retirar antes de imprimir</span></h2>
    <div class="dos-col nota"><div><h3>Decisiones interpretativas</h3><ul>${decisiones.map(d => `<li>${esc(d)}</li>`).join('')}</ul></div>
    <div><h3>Fuentes consultadas</h3><ul>${fuentes.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
    <h3>Pendiente</h3><ul><li>Insertar el logotipo del Laboratorio de Desarrollo Rural en el membrete.</li><li>Confirmar con la oficina estatal de CONAFOR la ventana de entrega de planta.</li><li>Actualizar los plazos de PROCODES y CONAFOR cuando se publiquen las reglas de 2027.</li></ul></div></div>`, 'fija', true));
  }
  return paginas;
}

/* ───────────────────────── Versión para la asamblea ───────────────────────── */
function anexoAsamblea() {
  const V = VERSIONES.asamblea, pagina = hacerPagina(V), paginas = [portada(V)];
  const A = id => idx.get(id);
  const cuando = id => periodoCorto(A(id));
  const N = txt => { const a = D.A.find(x => x.n.startsWith(txt)); if (!a) throw new Error('Falta el renglón: ' + txt); return a; };

  // Lo que se pide al ejido
  {
    const filas = [
      [cuando('H2'), 'Escuchar el catálogo de propuestas, pedir los cambios que considere, decidir si da su anuencia y acordar el domingo de la presentación a la comunidad.', `${N('Presentar el catálogo en asamblea').p}; si se aprueba, ${A('H2').p.toLowerCase()}`],
      [periodoCorto(N('Acordar con ganaderos')), 'Acordar con los ganaderos cerrar el paso del ganado a la zona del vertedor.', N('Acordar con ganaderos').p],
      [cuando('H5'), 'Aprobar en asamblea el reglamento de uso de la orilla, antes de Semana Santa.', N('Convocar la asamblea ejidal y aprobar el reglamento').p],
      [periodoCorto(N('Registrar las faenas')), 'Participar en las faenas de trancas, fajinas, cajetes, siembra y palapas. Cada jornal se registra como aportación en especie.', N('Registrar las faenas').p],
      [periodoCorto(N('Contar las plantas vivas')), 'Escuchar la lectura de las plantas vivas a los tres meses de la siembra (meta: 30 de 40 árboles).', N('Contar las plantas vivas').p],
      [periodoCorto(N('Revisar el reglamento tras')), 'Revisar el reglamento después de la primera temporada de uso.', N('Revisar el reglamento tras').p],
      [periodoCorto(N('Informe final a la asamblea')), 'Recibir el informe final del proyecto.', N('Informe final a la asamblea').p]
    ];
    let t = tabla('ta-pide', 3, ['Cuándo', 'Qué se pide al ejido', 'Qué queda']);
    filas.forEach(r => { t += `<div class="c"><b>${esc(r[0])}</b></div><div class="c">${esc(r[1])}</div><div class="c">${esc(r[2])}</div>`; });
    t += '</div>';
    paginas.push(pagina(`<h2 class="titulo">Lo que se pide al ejido</h2><p class="intro">El calendario es hipotético: cada paso depende de que el anterior se cumpla. Estos son los momentos en que el proyecto necesita una decisión o el trabajo del ejido.</p>${t}<p class="aviso"><b>Si la asamblea no da su anuencia.</b> ${esc(A('H2').siNo)} El acta de anuencia también es requisito para solicitar el apoyo de PROCODES en marzo de 2027.</p>`, 'fija'));
  }

  // Cinco fases
  {
    const g = svgMaestro({ W: 952, etq: 236, unidad: (952 - 236) / base.finEje, f: 1.28, filaFase: 28, filaOla: 25, carril: 20, hitoNivel: 22, conCarriles: false, conHitos: false });
    const QUE = {
      1: 'Los seis equipos integran sus propuestas en el catálogo y en este cronograma.',
      2: 'La asamblea conoce el catálogo, pide cambios y decide si da su anuencia.',
      3: 'Presentación en la orilla, comité de la presa y reglamento aprobado antes de Semana Santa.',
      4: 'Faenas, Ayuntamiento, PROCODES y CONAFOR; permisos ambientales y de zona federal.',
      5: 'Primero lo que la comunidad hace con sus medios; después lo que espera dinero y permisos.'
    };
    let t = tabla('ta-fases', 2, ['Fase', 'Qué ocurre']);
    D.FASES.forEach(fz => { t += `<div class="c"><b>${fz.id}. ${esc(fz.nombre)}</b></div><div class="c">${esc(QUE[fz.id])}</div>`; });
    t += '</div>';
    paginas.push(pagina(`<h2 class="titulo">El calendario en cinco fases</h2><p class="intro">Las fases se traslapan: lo que la comunidad puede hacer con sus propios medios arranca en enero de 2027, sin esperar los permisos.</p><div class="graf">${g.svg}</div>${t}`, 'fija'));
  }

  // Qué se hace en la orilla y cuándo
  {
    const comps = ['1a', '1b', '2', '3', '4', '5'];
    const todos = D.A.filter(a => comps.includes(a.c)).map(a => a.id);
    const eje = ejeDe(todos), span = eje.e - eje.s;
    let t = `<div class="tabla ta-comp" data-cols="4"><div class="cab">Componente</div><div class="cab">Qué deja</div><div class="cab">Cuándo</div><div class="cab barras-cab">${cabeceraEje(eje)}</div>`;
    comps.forEach(c => {
      const filas = D.A.filter(a => a.c === c && !esHito(a));
      const s = Math.min(...filas.map(a => P[a.id].s)), e = Math.max(...filas.map(a => P[a.id].e));
      const barras = filas.map(a => {
        const p = P[a.id], izq = ((p.s - eje.s) / span * 100).toFixed(3), ancho = ((p.e - p.s) / span * 100).toFixed(3);
        if (a.t === 'continuo') return `<i class="barra continua" style="left:${izq}%;width:calc(${ancho}% - 1px)"></i>`;
        return `<i class="barra${a.t === 'espera' ? ' espera' : ''}" style="left:${izq}%;width:max(calc(${ancho}% - 1.5px), 3px)"></i>`;
      }).join('');
      t += `<div class="c"><span><i class="punto" style="background:${COLOR[c]}"></i><b>${esc(COMP[c].clave)} ${esc(COMP[c].nombre)}</b></span></div><div class="c">${esc(COMP[c].deja)}</div><div class="c">${esc(rangoCompacto(s, e))}</div><div class="c barras" style="--c:${COLOR[c]};background:${fondoBarras(eje)}">${barras}</div>`;
    });
    t += '</div>';
    paginas.push(pagina(`<h2 class="titulo">Qué se hace en la orilla y cuándo</h2><p class="intro">Los seis componentes del anteproyecto. Cada barra es una tarea; la franja gris marca Semana Santa y el fondo distingue las secas de las lluvias.</p>${t}<p class="leyenda-a"><span><i class="m-barra"></i>Trabajo programado</span><span><i class="m-barra espera"></i>Espera de un permiso o dictamen</span><span><i class="m-linea"></i>Tarea continua, como los recorridos</span></p>`, 'fija'));
  }

  // Compuertas
  {
    const gates = D.A.filter(a => a.gate).sort((a, b) => P[a.id].s - P[b.id].s);
    let t = tabla('ta-gates', 4, ['Cuándo', 'Compuerta', 'Quién la lleva', 'Si la respuesta es no']);
    gates.forEach(a => { t += `<div class="c"><b>${esc(fechaHito(a))}</b></div><div class="c"><span><i class="rombo-t gate"></i>${esc(a.n)}</span></div><div class="c">${esc(a.r)}</div><div class="c">${esc(a.siNo)}</div>`; });
    t += '</div>';
    paginas.push(pagina(`<h2 class="titulo">Seis compuertas</h2><p class="intro">Una compuerta es una decisión de la que depende lo que sigue. La última columna dice qué pasa con el proyecto si la respuesta es no.</p>${t}`, 'fija'));
  }

  // Lo que puede atrasar el calendario
  {
    const filas = [
      ['La anuencia llega tarde', `Con cuatro semanas de atraso: ${RQ.anu}.`, 'Pedir el punto antes del 25 de noviembre; si la asamblea se recorre, convocar una extraordinaria en enero y reducir la primera ola a lo que pide Semana Santa.'],
      ['El dinero llega tarde', `Con ocho semanas: ${RQ.din8}. Con dieciséis: ${RQ.din16}.`, 'Comprar materiales en julio con el primer depósito de PROCODES y dejar lista la faena de palapas para noviembre.'],
      ['Los permisos tardan', `Con ocho semanas por permiso: ${RQ.per8}.`, 'Ingresar la manifestación de impacto ambiental en marzo de 2027 y separar el muelle del resto si la concesión se detiene.'],
      ['Las lluvias se adelantan o se retrasan', 'La siembra y las estacas vivas pierden su ventana y esperan un año.', 'Tener los cajetes listos al final de mayo y sembrar con las primeras lluvias reales.']
    ];
    let t = tabla('ta-riesgos', 3, ['Qué puede pasar', 'Qué se movería', 'Qué se haría']);
    filas.forEach(r => { t += `<div class="c"><b>${esc(r[0])}</b></div><div class="c">${esc(r[1])}</div><div class="c">${esc(r[2])}</div>`; });
    t += '</div>';
    paginas.push(pagina(`<h2 class="titulo">Lo que puede atrasar el calendario</h2><p class="intro">Los efectos se calcularon con el mismo calendario: se atrasa una fecha y se recorre todo lo que depende de ella, respetando secas, lluvias y plazos.</p>${t}`, 'fija'));
  }
  return paginas;
}

/* ───────────────────────── Estilos ───────────────────────── */
const CSS = `${FUENTES}
@page { size: 11in 8.5in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: 'Jost', sans-serif; color: ${T.tinta}; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 13px; line-height: 1.4; }
.pagina { width: 1056px; height: 816px; position: relative; overflow: hidden; break-after: page; page-break-after: always; background: #fff; }
.membrete { position: absolute; left: 52px; right: 52px; top: 24px; height: 36px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.3px solid ${T.arena}; padding-bottom: 6px; color: ${T.pizarra}; font-size: 10.7px; }
.membrete .lockup { display: flex; flex-direction: column; line-height: 1.15; }
.membrete .lockup b { font-weight: 600; font-size: 11.5px; }
.membrete .lockup img { height: 26px; }
.membrete .doc { color: ${T.tinta3}; }
.pie { position: absolute; left: 52px; right: 52px; bottom: 20px; border-top: 1.3px solid ${T.arena}; padding-top: 5px; font-size: 10.7px; color: ${T.tinta3}; display: flex; justify-content: space-between; }
.cuerpo { position: absolute; left: 52px; right: 52px; top: 76px; bottom: 52px; }
h2.titulo { font-size: 23px; font-weight: 600; margin: 0 0 4px; display: flex; align-items: center; gap: 9px; line-height: 1.15; }
h2.titulo .punto { width: 14px; height: 14px; border-radius: 50%; display: inline-block; flex: none; }
h2.titulo .cont { font-size: 15px; font-weight: 400; color: ${T.tinta3}; }
.continua h2.titulo { margin-bottom: 12px; }
h3 { font-size: 14px; font-weight: 600; margin: 0 0 6px; }
h3.sub { margin: 16px 0 6px; }
p { margin: 0 0 8px; }
p.intro { font-size: 13px; color: ${T.tinta2}; max-width: 860px; margin-bottom: 12px; }
.tenue { color: ${T.tinta3}; }
.dos-col { display: grid; grid-template-columns: 1.05fr 1fr; gap: 34px; font-size: 12.6px; line-height: 1.5; }
.dos-col p { max-width: 64ch; }
.cifras { margin-top: 12px; color: ${T.tinta2}; }
.firma { margin-top: 22px; display: flex; flex-direction: column; font-size: 12px; line-height: 1.35; }
.firma .linea { width: 220px; border-top: 1px solid ${T.tinta2}; margin-bottom: 6px; }
.graf svg { display: block; }
.tabla { display: grid; font-size: 10.7px; line-height: 1.32; border-top: 1px solid ${T.regla}; }
.tabla .cab { font-size: 10.7px; color: ${T.tinta3}; padding: 5px 7px; border-bottom: 1px solid ${T.regla}; display: flex; align-items: flex-end; }
.tabla .c { padding: 6px 7px; border-bottom: .7px solid ${T.filete}; }
.t-fases { grid-template-columns: 180px 160px 1fr 1fr; margin-top: 8px; }
.t-hitos { grid-template-columns: 52px 220px 108px 1fr 160px 1.25fr; }
.t-fondos { grid-template-columns: 136px 1fr 170px 1fr 1fr; }
.t-permisos { grid-template-columns: 160px 150px 1.3fr 1fr 150px; }
.t-riesgos { grid-template-columns: 160px 180px 1.35fr 1fr; }
.rombo-t { display: inline-block; width: 9px; height: 9px; transform: rotate(45deg); background: ${T.pizarra}; margin: 0 8px 1px 1px; }
.rombo-t.gate { background: #fff; box-shadow: inset 0 0 0 1.8px ${T.pizarra}; }
.gt { display: grid; grid-template-columns: 46px 1fr 156px 112px 66px 86px 260px; font-size: 10.7px; line-height: 1.28; border-top: 1px solid ${T.regla}; }
.gt .cab { font-size: 10.7px; color: ${T.tinta3}; padding: 3px 6px 4px; border-bottom: 1px solid ${T.regla}; display: flex; align-items: flex-end; }
.gt .c { padding: 5px 6px; border-bottom: .7px solid ${T.filete}; display: flex; align-items: center; min-height: 30px; }
.nw { white-space: nowrap; }
.gt .cod, .gt .dep, .tabla .cod { color: ${T.tinta3}; font-variant-numeric: tabular-nums; }
.gt .act.hito { font-weight: 600; }
.gt .per { font-variant-numeric: tabular-nums; }
.barras { position: relative; padding: 0 !important; border-bottom-color: transparent !important; }
.barras-cab { padding: 0 !important; display: block !important; width: 100%; }
.barra { position: absolute; top: 50%; height: 10px; margin-top: -5px; border-radius: 3px; background: var(--c); }
.barra.espera { background: repeating-linear-gradient(135deg, var(--c) 0 2.6px, rgba(255,255,255,.75) 2.6px 5.2px); box-shadow: inset 0 0 0 1px var(--c); }
.barra.continua { height: 3.5px; margin-top: -1.75px; border-radius: 2px; }
.gt .rombo { position: absolute; top: 50%; width: 10px; height: 10px; margin: -5px 0 0 -5px; transform: rotate(45deg); background: ${T.pizarra}; }
.gt .rombo.gate { background: #fff; box-shadow: inset 0 0 0 1.8px ${T.pizarra}; }
.eje { position: relative; height: 32px; }
.eje .anios { position: relative; height: 14px; font-size: 10px; font-weight: 600; color: ${T.tinta2}; }
.eje .anios span { position: absolute; top: 0; padding-left: 2px; }
.eje .meses { display: flex; height: 18px; font-size: 10px; color: ${T.tinta2}; }
.eje .meses span { text-align: center; border-left: .7px solid ${T.regla}; line-height: 18px; }
.eje .meses span:nth-child(odd) { background: #f1efe9; }
.retirar { font-size: 11px; font-weight: 500; color: ${T.alerta}; border: 1px solid ${T.alerta}; border-radius: 4px; padding: 1px 6px; margin-left: 6px; }
.nota ul { padding-left: 16px; margin: 0 0 12px; font-size: 10.7px; line-height: 1.42; }
.nota li { margin: 0 0 5px; }
/* portada */
.portada { padding: 52px 64px; display: flex; flex-direction: column; }
.p-cabeza { border-bottom: 1.3px solid ${T.arena}; padding-bottom: 10px; color: ${T.pizarra}; }
.p-lockup { display: flex; flex-direction: column; line-height: 1.3; font-size: 12px; }
.p-lockup b { font-size: 14px; font-weight: 600; }
.p-logo { height: 54px; }
.p-centro { flex: 1; display: flex; align-items: center; gap: 44px; }
.p-emblema { width: 176px; height: auto; flex: none; }
.p-pre { font-size: 14px; color: ${T.tinta2}; margin: 0 0 10px; }
.portada h1 { font-size: 46px; line-height: 1.04; font-weight: 600; margin: 0; max-width: 16ch; letter-spacing: -.01em; }
.p-sub { font-size: 18px; color: ${T.tinta2}; margin: 14px 0 6px; max-width: 46ch; }
.p-per { font-size: 15px; color: ${T.tinta3}; margin: 0; }
.p-graf { display: block; margin: 0 0 18px; }
.p-pie { border-top: 1.3px solid ${T.arena}; padding-top: 8px; display: flex; justify-content: space-between; font-size: 10.7px; color: ${T.tinta3}; }
`;

/* Versión para la asamblea: letra de 11 puntos o más */
const CSS_ASAMBLEA = `
body { font-size: 15px; line-height: 1.4; }
.membrete { font-size: 12px; } .membrete .lockup b { font-size: 13px; }
.pie { font-size: 12px; }
h2.titulo { font-size: 29px; margin-bottom: 6px; }
p.intro { font-size: 15px; margin-bottom: 14px; }
.tabla { font-size: 15px; line-height: 1.36; }
.tabla .cab { font-size: 14px; padding: 6px 9px; }
.tabla .c { padding: 9px 9px; }
.tabla .punto { width: 13px; height: 13px; border-radius: 50%; display: inline-block; margin-right: 8px; vertical-align: -1px; }
.rombo-t { width: 11px; height: 11px; margin-right: 10px; }
.rombo-t.gate { box-shadow: inset 0 0 0 2.2px ${T.pizarra}; }
.ta-pide { grid-template-columns: 170px 1fr 330px; }
.ta-fases { grid-template-columns: 290px 1fr; margin-top: 10px; }
.ta-comp { grid-template-columns: 210px 1fr 136px 280px; }
.ta-comp .c { min-height: 64px; display: flex; align-items: center; }
.ta-comp .cab .eje .meses, .ta-comp .cab .eje .anios { font-size: 12px; }
.ta-comp .eje { height: 36px; } .ta-comp .eje .anios { height: 16px; } .ta-comp .eje .meses { height: 20px; } .ta-comp .eje .meses span { line-height: 20px; }
.ta-comp .barra { height: 14px; margin-top: -7px; }
.ta-comp .barra.continua { height: 4px; margin-top: -2px; }
.ta-gates { grid-template-columns: 150px 270px 210px 1fr; }
.ta-riesgos { grid-template-columns: 220px 1fr 1fr; }
.aviso { margin-top: 16px; padding: 12px 16px; border-left: 4px solid ${T.arena}; background: #f7f3ea; max-width: 880px; }
.leyenda-a { display: flex; flex-wrap: wrap; gap: 6px 26px; margin-top: 12px; font-size: 14px; color: ${T.tinta2}; }
.leyenda-a span { display: inline-flex; align-items: center; gap: 8px; }
.m-barra { display: inline-block; width: 34px; height: 14px; border-radius: 3px; background: ${T.tinta2}; }
.m-barra.espera { background: repeating-linear-gradient(135deg, ${T.tinta2} 0 2.6px, #fff 2.6px 5.2px); box-shadow: inset 0 0 0 1px ${T.tinta2}; }
.m-linea { display: inline-block; width: 34px; height: 4px; border-radius: 2px; background: ${T.tinta2}; }
.p-emblema { width: 200px; }
.p-pre { font-size: 17px; }
.p-sub { font-size: 20px; }
.p-per { font-size: 17px; }
.p-lockup { font-size: 13px; } .p-lockup b { font-size: 15px; }
.p-pie { font-size: 12px; }
`;

function escribir(nombre, paginas, extra = '') {
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Cronograma hipotético de la Presa de La Florida</title><style>${CSS}${extra}</style></head><body>${paginas.join('\n')}<script>${SCRIPT_PAGINADOR}</script></body></html>`;
  fs.writeFileSync(path.join(OUT, nombre), html);
  console.log(nombre + ':', paginas.length, 'páginas antes de paginar');
}
escribir('anexo-fondos.html', anexoFondos());
escribir('anexo-asamblea.html', anexoAsamblea(), CSS_ASAMBLEA);


/* ───────────────────────── Cartel de pared 90 × 60 cm ───────────────────────── */
(function cartel() {
  // 1 mm = 3.7795 px a 96 dpi
  const mm = 3.7795, W = 900 * mm, Hh = 600 * mm, marg = 28 * mm;
  const anchoGraf = W - 2 * marg, etq = 150 * mm;
  const g = svgMaestro({ W: anchoGraf, etq, unidad: (anchoGraf - etq) / base.finEje, f: 2.2, filaFase: 12 * mm, filaOla: 10 * mm, carril: 12 * mm, hitoNivel: 14.5 * mm, conOlas: false, olasEnFase5: true, hitoCorto: true });
  const leyenda = `
    <span><i class="mu" style="background:${T.secas};box-shadow:inset 0 0 0 1px ${T.regla}"></i>Secas, de noviembre a mayo</span>
    <span><i class="mu" style="background:${T.lluvias};box-shadow:inset 0 0 0 1px ${T.regla}"></i>Lluvias, de junio a octubre</span>
    <span><i class="mu" style="background:${T.ss}"></i>Semana Santa</span>
    <span><i class="mu" style="background:repeating-linear-gradient(135deg,${T.tinta2} 0 6px,#fff 6px 12px);box-shadow:inset 0 0 0 2px ${T.tinta2}"></i>Espera de un tercero</span>
    <span><svg width="34" height="34" viewBox="0 0 34 34"><rect x="9" y="9" width="16" height="16" transform="rotate(45 17 17)" fill="${T.pizarra}"/></svg>Hito</span>
    <span><svg width="34" height="34" viewBox="0 0 34 34"><rect x="9.5" y="9.5" width="15" height="15" transform="rotate(45 17 17)" fill="#fff" stroke="${T.pizarra}" stroke-width="4"/></svg>Compuerta: lo que sigue solo ocurre si la respuesta es sí</span>`;
  const css = `${FUENTES}
  @page { size: 900mm 600mm; margin: 0; }
  html, body { margin: 0; }
  body { font-family: 'Jost', sans-serif; color: ${T.tinta}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cartel { width: 900mm; height: 600mm; position: relative; overflow: hidden; background: #fff; padding: ${marg}px; box-sizing: border-box; display: flex; flex-direction: column; }
  .cab { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid ${T.arena}; padding-bottom: 7mm; margin-bottom: 8mm; }
  .cab h1 { font-size: 108pt; line-height: .95; margin: 0; font-weight: 600; letter-spacing: -.01em; }
  .cab .sub { font-size: 34pt; color: ${T.tinta2}; margin: 5mm 0 0; }
  .cab .lema { font-size: 30pt; font-style: italic; color: ${T.tinta2}; margin: 3mm 0 0; }
  .cab .der { text-align: right; color: ${T.pizarra}; font-size: 20pt; line-height: 1.3; display: flex; flex-direction: column; align-items: flex-end; gap: 4mm; }
  .cab .der b { font-size: 24pt; font-weight: 600; }
  .cab .izq { display: flex; align-items: center; gap: 12mm; }
  .cab .izq img.emb { height: 64mm; width: auto; flex: none; }
  .cab .der img.logo { height: 26mm; }
  .graf { flex: 1; }
  .pie { display: flex; justify-content: space-between; align-items: center; gap: 10mm; border-top: 3px solid ${T.arena}; padding-top: 5mm; font-size: 17pt; color: ${T.tinta2}; }
  .leyenda { display: flex; flex-wrap: wrap; gap: 4mm 12mm; align-items: center; }
  .leyenda span { display: inline-flex; align-items: center; gap: 4mm; }
  .mu { display: inline-block; width: 16mm; height: 7mm; border-radius: 2mm; }
  .nota { max-width: 260mm; text-align: right; color: ${T.tinta3}; }`;
  const htmlC = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Cartel · Cronograma de la presa</title><style>${css}</style></head><body><div class="cartel">
    <div class="cab"><div class="izq">${EMBLEMA ? `<img class="emb" src="${EMBLEMA}" alt="Emblema de la Presa de La Florida">` : ''}<div><h1>El cronograma de la presa</h1><p class="sub">Anteproyecto para habilitar la orilla de la Presa de La Florida, octubre de 2026 a noviembre de 2028</p><p class="lema">Lo que se siembra espera la lluvia; lo que se construye busca la seca.</p></div></div>
    <div class="der">${LOGO_LABRURAL ? `<img class="logo" src="${LOGO_LABRURAL}" alt="Laboratorio de Desarrollo Rural">` : '<b>Laboratorio de Desarrollo Rural</b><span>Universidad Autónoma de Querétaro</span><span>Facultad de Ciencias Naturales, Campus Concá</span>'}</div></div>
    <div class="graf">${g.svg}</div>
    <div class="pie"><div class="leyenda">${leyenda}</div><div class="nota">Calendario hipotético, sujeto a la anuencia del ejido, al consentimiento de la comunidad, al financiamiento y a los permisos.</div></div>
  </div></body></html>`;
  fs.writeFileSync(path.join(OUT, 'cartel.html'), htmlC);
  console.log('cartel: alto de la gráfica', (g.alto / mm).toFixed(0), 'mm de', ((Hh - 2 * marg) / mm).toFixed(0), 'disponibles');
})();
