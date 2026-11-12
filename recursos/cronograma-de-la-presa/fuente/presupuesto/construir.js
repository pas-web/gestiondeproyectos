// Arma la práctica del presupuesto y la página que junta los presupuestos de los equipos.
// Toma las actividades del cronograma integrado (../src/data.js y ../src/engine.js),
// las mete en las dos plantillas junto con el núcleo de cálculo compartido y escribe:
//   recursos/cronograma-y-presupuesto/practica-presupuesto.html
//   recursos/presupuesto-de-la-presa/index.html
// Uso, desde esta carpeta:  node construir.js
const fs = require('fs'), path = require('path');
const AQUI = __dirname, FUENTE = path.join(AQUI, '..'), RECURSOS = path.join(AQUI, '..', '..', '..');
const D = require(path.join(FUENTE, 'src/data.js'));
const M = require(path.join(FUENTE, 'src/engine.js'));
const base = M.programar(D), cod = M.codigos(D, base);

const mesDe = t => { const c = M.cal(t); return c.anio + '-' + String(c.mes).padStart(2, '0'); };
const FONDO = { 'Autogestión': 'AUT', 'PROCODES': 'PRO', 'Municipio': 'MUN', 'CONAFOR': 'CNF' };
const SIN_COSTO = new Set(['hito', 'espera', 'aprob-municipal']);   // hitos y esperas no se presupuestan

const actividades = D.A
  .filter(a => !SIN_COSTO.has(a.t))
  .sort((x, y) => (base.P[x.id].s - base.P[y.id].s) || (D.A.indexOf(x) - D.A.indexOf(y)))
  .map(a => {
    const p = base.P[a.id];
    // En la ruta de gestión el campo «fondo» dice con qué fuente se gestiona, no quién paga:
    // solo se sugiere el bolsillo cuando es la propia autogestión.
    const f = a.c === 'G' ? (a.fondo === 'Autogestión' ? 'AUT' : '') : (FONDO[a.fondo] || '');
    return { id: a.id, cod: cod[a.id], c: a.c, n: a.n, p: a.p, r: a.r, mes: mesDe(p.s), fin: mesDe(p.e - 1), per: M.rangoCorto(p.s, p.e), f, ola: a.o || 0 };
  });
const componentes = D.COMPONENTES.map(c => ({ id: c.id, clave: c.clave, nombre: c.nombre, corto: c.corto, deja: c.deja }));
const act = codigo => { const a = actividades.find(x => x.cod === codigo); if (!a) throw new Error('No existe la actividad ' + codigo); return a; };

// El ejemplo armado: la ruta de gestión, con precios de referencia que después se cotizan.
const ejemplo = {
  version: 3, equipo: 'Ejemplo: la ruta de gestión', componente: 'G',
  partidas: [
    { actividad: act('G-05').id, que: 'Impresión del catálogo para la asamblea, juegos engargolados', unidad: 'juego', cant: 25, precio: 60, tipo: 'materiales', bolsillo: 'AUT', forma: 'compra', mes: '2026-11' },
    { actividad: act('G-05').id, que: 'Lona del cronograma de la presa, 2 por 1.2 m', unidad: 'm²', cant: 2.4, precio: 150, tipo: 'materiales', bolsillo: 'AUT', forma: 'compra', mes: '2026-11', cae: true },
    { actividad: act('G-07').id, que: 'Sillas y equipo de sonido de la delegación para la presentación en la orilla', unidad: 'evento', cant: 1, precio: 1200, tipo: 'equipo', bolsillo: 'AUT', forma: 'prestado', mes: '2026-12' },
    { actividad: act('G-07').id, que: 'Montaje y limpieza de la presentación, seis personas una jornada', unidad: 'jornal', cant: 6, precio: 300, tipo: 'gente', bolsillo: 'AUT', forma: 'faena', mes: '2026-12' },
    { actividad: act('G-13').id, que: 'Pasajes a la oficina de la Reserva en Jalpan, dos personas, dos viajes', unidad: 'pasaje', cant: 4, precio: 160, tipo: 'traslado', bolsillo: 'AUT', forma: 'compra', mes: '2027-02' },
    { actividad: act('G-14').id, que: 'Elaboración de la manifestación de impacto ambiental por un prestador de servicios ambientales', unidad: 'servicio', cant: 1, precio: 0, tipo: 'gente', bolsillo: '', forma: 'compra', mes: '2027-03' },
    { actividad: act('G-22').id, que: 'Impresión del informe final con fotos de punto fijo', unidad: 'juego', cant: 10, precio: 120, tipo: 'materiales', bolsillo: 'AUT', forma: 'compra', mes: '2028-04' }
  ],
  flete: { si: false, cant: 0, precio: 0, bolsillo: 'AUT', forma: 'compra', mes: '' },
  imp: { si: true, pct: 5, nombre: 'lo que falte en la papelería', bolsillo: 'AUT' },
  pro: { unidad: 'm²', cant: 0 },
  seCae: 'La lona del cronograma: el catálogo impreso y el cartel de pared hacen el mismo trabajo.'
};

const PRESA = { fecha: '11 de noviembre de 2026', componentes, actividades, ejemplo };
const nucleo = fs.readFileSync(path.join(AQUI, 'nucleo.js'), 'utf8');
const destinos = [
  ['practica.html', path.join(RECURSOS, 'cronograma-y-presupuesto', 'practica-presupuesto.html')],
  ['integrar.html', path.join(RECURSOS, 'presupuesto-de-la-presa', 'index.html')]
];
for (const [plantilla, destino] of destinos) {
  const html = fs.readFileSync(path.join(AQUI, plantilla), 'utf8')
    .replace('/*__PRESA__*/', () => 'var PRESA = ' + JSON.stringify(PRESA) + ';')
    .replace('/*__NUCLEO__*/', () => nucleo);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, html);
  console.log(path.relative(RECURSOS, destino), (html.length / 1024).toFixed(0) + ' KB');
}
console.log(actividades.length + ' actividades presupuestables en ' + componentes.length + ' componentes');
