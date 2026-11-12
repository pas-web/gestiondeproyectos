// ── Núcleo compartido: los cuatro bolsillos, sus reglas y las cuentas de un presupuesto ──
var BOLSILLOS = [
  { id: 'AUT', nombre: 'Autogestión y especie', corto: 'Autogestión', color: '#c0602f', claro: '#F6E3D8' },
  { id: 'PRO', nombre: 'PROCODES (CONANP)', corto: 'PROCODES', color: '#168c6e', claro: '#D7EEE6' },
  { id: 'MUN', nombre: 'Ayuntamiento de Arroyo Seco', corto: 'Ayuntamiento', color: '#6a55c2', claro: '#E6E1F6' },
  { id: 'CNF', nombre: 'CONAFOR', corto: 'CONAFOR', color: '#4b8f2a', claro: '#E0EEDA' }
];
var BOLS = {}; BOLSILLOS.forEach(function (b) { BOLS[b.id] = b; });
var FORMAS = ['compra', 'faena', 'prestado', 'trocado', 'donado'];
var TIPOS = ['materiales', 'gente', 'traslado', 'equipo'];
var MESES_TXT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
var MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
var MESES = [];
(function () { var a = 2026, m = 11; while (a < 2028 || (a === 2028 && m <= 11)) { MESES.push(a + '-' + (m < 10 ? '0' + m : m)); m++; if (m > 12) { m = 1; a++; } } })();
// Cuándo puede pagar cada bolsillo (meses en formato AAAA-MM; se comparan como texto)
var VENTANA = {
  PRO: { desde: '2027-06', hasta: '2027-12' },
  MUN: { desde: '2028-01', especie: '2027-02' },
  CNF: { desde: '2027-06' }
};
var PRO_M2 = 5490, PRO_LOTE = 75000, PRO_UMBRAL = 300000;

function mesTxt(k) { if (!k) return ''; var p = k.split('-'); return MESES_TXT[+p[1] - 1] + ' ' + p[0]; }
function mesLargo(k) { if (!k) return ''; var p = k.split('-'); return MESES_LARGOS[+p[1] - 1] + ' de ' + p[0]; }
function pesos(n) { return '$' + Math.round(n || 0).toLocaleString('es-MX'); }
function enMiles(n) { if (!n) return ''; if (n < 100) return '&lt;0.1'; var v = n / 1000; return v.toLocaleString('es-MX', { maximumFractionDigits: v < 10 ? 1 : 0 }); }
function miles(n) { if (!n) return ''; if (n < 1000) return '$' + Math.round(n); return '$' + (n / 1000).toLocaleString('es-MX', { maximumFractionDigits: n < 10000 ? 1 : 0 }) + ' mil'; }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function totalDe(p) { return (+p.cant || 0) * (+p.precio || 0); }
function esDinero(p) { return p.forma === 'compra'; }
// cada partida guarda el id estable de su actividad; el código (5-04) cambia si el cronograma se reacomoda
function actividadDe(clave) { if (!clave) return null; for (var i = 0; i < PRESA.actividades.length; i++) { var a = PRESA.actividades[i]; if (a.id === clave || a.cod === clave) return a; } return null; }
function componenteDe(id) { for (var i = 0; i < PRESA.componentes.length; i++) if (PRESA.componentes[i].id === id) return PRESA.componentes[i]; return null; }
function nombreComp(id) { var c = componenteDe(id); return c ? (c.id === 'G' ? c.nombre : c.clave + ' · ' + c.nombre) : ''; }

// Si el bolsillo no puede pagar en ese mes, devuelve el porqué
function cuandoMal(p) {
  if (!p.mes || !p.bolsillo) return '';
  if (p.bolsillo === 'PRO') {
    if (p.mes < VENTANA.PRO.desde) return 'PROCODES deposita la primera ministración hacia junio de 2027';
    if (p.mes > VENTANA.PRO.hasta) return 'lo de PROCODES se ejecuta y se comprueba a más tardar el 31 de diciembre de 2027';
  }
  if (p.bolsillo === 'MUN') {
    if (esDinero(p) && p.mes < VENTANA.MUN.desde) return 'el Ayuntamiento paga obra con el presupuesto 2028, desde enero de 2028; en 2027 apoya en especie';
    if (!esDinero(p) && p.mes < VENTANA.MUN.especie) return 'el apoyo municipal en especie se pide en febrero de 2027';
  }
  if (p.bolsillo === 'CNF' && p.mes < VENTANA.CNF.desde) return 'la planta de CONAFOR llega con las lluvias, de junio a julio de 2027';
  return '';
}
// Si el bolsillo no paga esa clase de cosa, devuelve el porqué
function bolsilloMal(p) {
  if (p.bolsillo === 'CNF' && (esDinero(p) || p.tipo === 'traslado' || p.tipo === 'equipo')) return 'CONAFOR da planta y asesoría en especie: no da dinero, ni flete, ni herramienta';
  if (p.bolsillo === 'PRO' && !esDinero(p)) return 'PROCODES da dinero; lo que se consigue en especie es la parte del grupo y va en autogestión';
  return '';
}

function calcular(e) {
  var s = { bols: {}, tipos: {}, total: 0, dinero: 0, especie: 0, compras: 0, imp: 0, flete: 0, mes: {} };
  ['AUT', 'PRO', 'MUN', 'CNF', ''].forEach(function (b) { s.bols[b] = { dinero: 0, especie: 0 }; });
  TIPOS.forEach(function (t) { s.tipos[t] = 0; });
  function suma(b, forma, tipo, monto, mes) {
    var k = s.bols[b] ? b : '', din = forma === 'compra';
    s.bols[k][din ? 'dinero' : 'especie'] += monto;
    s.total += monto; if (din) s.dinero += monto; else s.especie += monto;
    if (tipo) s.tipos[tipo] = (s.tipos[tipo] || 0) + monto;
    if (mes) { if (!s.mes[mes]) s.mes[mes] = {}; s.mes[mes][k] = (s.mes[mes][k] || 0) + monto; }
  }
  (e.partidas || []).forEach(function (p) { var t = totalDe(p); if (esDinero(p)) s.compras += t; suma(p.bolsillo, p.forma, p.tipo, t, p.mes); });
  if (e.flete && e.flete.si) {
    var f = (+e.flete.cant || 0) * (+e.flete.precio || 0); s.flete = f;
    if (e.flete.forma === 'compra') s.compras += f;
    suma(e.flete.bolsillo, e.flete.forma, 'traslado', f, e.flete.mes);
  }
  if (e.imp && e.imp.si) { s.imp = s.compras * (+e.imp.pct || 0) / 100; suma(e.imp.bolsillo || 'AUT', 'compra', null, s.imp, null); }
  s.comunidad = s.bols.AUT.dinero + s.bols.AUT.especie;
  s.fondos = s.bols.PRO.dinero + s.bols.PRO.especie + s.bols.MUN.dinero + s.bols.MUN.especie + s.bols.CNF.dinero + s.bols.CNF.especie;
  s.sinBolsillo = s.bols[''].dinero + s.bols[''].especie;
  // PROCODES: lo que pone el programa, la parte del grupo en el proyecto PROCODES y el tope
  // el proyecto PROCODES: las actividades que paga PROCODES o que el cronograma le asigna
  var actPro = {};
  (e.partidas || []).forEach(function (p) { var a = actividadDe(p.actividad); if (p.actividad && (p.bolsillo === 'PRO' || (a && a.f === 'PRO'))) actPro[p.actividad] = 1; });
  var grupo = 0;
  (e.partidas || []).forEach(function (p) { if (p.bolsillo === 'AUT' && actPro[p.actividad]) grupo += totalDe(p); });
  var pro = s.bols.PRO.dinero + s.bols.PRO.especie;
  var cant = e.pro ? +e.pro.cant || 0 : 0, unidad = e.pro && e.pro.unidad === 'lote' ? 'lote' : 'm²';
  s.pro = { monto: pro, grupo: grupo, proyecto: pro + grupo, pct: pro + grupo > 0 ? pro / (pro + grupo) : 0,
            cant: cant, unidad: unidad, tope: cant * (unidad === 'lote' ? PRO_LOTE : PRO_M2), hay: pro > 0, actividades: Object.keys(actPro) };
  return s;
}

// La revisión: los seis agujeros de siempre y los tres de los bolsillos
function revisar(e, s) {
  // las partidas recién creadas y vacías no se revisan todavía
  var ps = (e.partidas || []).filter(function (p) { return (p.que || '').trim() || totalDe(p) > 0; }), lista = [], fila = {};
  function marca(p, t) { fila[p.id] = (fila[p.id] ? fila[p.id] + ' · ' : '') + t; }
  function r(malos, titulo, bien, mal, clase) { lista.push({ clase: malos ? (clase || 'mal') : 'bien', titulo: titulo, texto: malos ? mal : bien }); }
  var ids = function (a) { return a.map(function (p) { return '#' + p.id; }).join(', '); };

  var oidas = ps.filter(function (p) { var sin = !(p.papel || '').trim() || /o[ií]das|aprox|creo|m[aá]s o menos|por pedir|pendiente|falta/i.test(p.papel); if (sin && totalDe(p) >= 1000) { marca(p, 'sin papel'); return true; } return false; });
  r(oidas.length, 'El precio de oídas', 'Cada partida de mil pesos o más dice quién dio el precio y cuándo.', 'Partidas de mil pesos o más que todavía no tienen su papel: ' + ids(oidas) + '. Van a la hoja para cotizar: tres cotizaciones, dos por escrito y de menos de treinta días.');

  var cero = ps.filter(function (p) { if (esDinero(p) && !(+p.precio) ) { marca(p, 'sin precio'); return true; } return false; });
  if (cero.length) lista.push({ clase: 'ojo', titulo: 'Lo que todavía no tiene precio', texto: 'Partidas de compra con precio en cero: ' + ids(cero) + '. Se dejan escritas, con su pendiente, en lugar de borrarlas: lo que no se escribe lo termina pagando alguien de su bolsa.' });

  var bolsa = ps.filter(function (p) { var b = !p.actividad || /\bvarios\b|diversos|\betc\b|misc/i.test(p.que || '') || (s.total > 0 && totalDe(p) > 0.5 * s.total && ps.length > 3); if (b) marca(p, 'partida bolsa'); return b; });
  r(bolsa.length, 'La partida bolsa', 'Cada partida cuelga de una actividad y dice qué es exactamente.', 'Renglones que no dicen de qué actividad son, que dicen «varios» o que se comen casi la mitad del presupuesto: ' + ids(bolsa) + '. Se parten hasta que cada pedazo se pueda leer en voz alta.');

  var hayMaterial = ps.some(function (p) { return (p.tipo === 'materiales' || p.tipo === 'equipo') && esDinero(p) && totalDe(p) > 0; });
  var hayTraslado = (e.flete && e.flete.si) || ps.some(function (p) { return p.tipo === 'traslado'; });
  r(hayMaterial && !hayTraslado ? 1 : 0, 'El flete olvidado', hayMaterial ? 'El traslado tiene renglón propio, en dinero o en especie.' : 'No hay material comprado que mover.', 'Hay material comprado y nadie lo trae a la orilla. El flete va en su renglón, pagado o conseguido en especie con su nota.');

  var hayCompras = s.compras > 0;
  r(hayCompras && !(e.imp && e.imp.si && +e.imp.pct > 0) ? 1 : 0, 'El presupuesto al centavo', hayCompras ? 'Los imponderables tienen renglón y nombre.' : 'Todavía no hay compras.', 'Sin imponderables: falta un colchón chico, alrededor del 5% de lo que se compra, con nombre honesto.');

  var vistos = {}, doble = [];
  ps.forEach(function (p) { var k = (p.que || '').trim().toLowerCase().slice(0, 28); if (!k) return; var firma = p.bolsillo + '|' + esDinero(p); if (vistos[k] && vistos[k] !== firma) { doble.push(p); marca(p, 'doble papel'); } else vistos[k] = firma; });
  r(doble.length, 'El doble papel', 'Nada aparece dos veces en bolsillos distintos.', 'Lo mismo aparece en dos bolsillos o comprado y en especie a la vez: ' + ids(doble) + '. Cada cosa vive en un solo lugar.');

  // la asistencia técnica especializada sí la paga PROCODES, hasta el 10% de lo que aprueba
  var asesoria = function (p) { return /asesor|asistencia t[eé]cnica|acompa[ñn]amiento t[eé]cnico/i.test(p.que || ''); };
  var pecado = ps.filter(function (p) { var mal = p.bolsillo && p.bolsillo !== 'AUT' && esDinero(p) && ((/honorario|sueldo|pago al equipo|nuestro trabajo|estudiantes/i.test(p.que || '') && !(p.bolsillo === 'PRO' && asesoria(p))) || (/comida|refresco|alimento|tamal|caf[eé]/i.test(p.que || '') && !/faena/i.test(p.que || ''))); if (mal) marca(p, 'no lo paga un fondo'); return mal; });
  var proMal = [];
  var ase = ps.filter(function (p) { return p.bolsillo === 'PRO' && esDinero(p) && asesoria(p); }), aseMonto = ase.reduce(function (a, p) { return a + totalDe(p); }, 0);
  if (aseMonto > 0 && aseMonto > 0.1 * s.pro.monto + 1e-9) { ase.forEach(function (p) { marca(p, 'asesoría arriba del 10%'); }); proMal.push('la asistencia técnica que se le carga a PROCODES (' + pesos(aseMonto) + ') pasa del 10% de lo que pondría el programa (' + pesos(0.1 * s.pro.monto) + ')'); }
  if (s.pro.hay && s.pro.pct > 0.8 + 1e-9) proMal.push('PROCODES pondría el ' + Math.round(100 * s.pro.pct) + '% de su proyecto y el programa pone hasta el 80%: el grupo tiene que poner al menos ' + pesos(s.pro.monto / 4 - s.pro.grupo > 0 ? s.pro.monto / 4 - s.pro.grupo : 0) + ' más en jornales, materiales o dinero, en las actividades del proyecto PROCODES');
  if (s.pro.hay && s.pro.tope > 0 && s.pro.monto > s.pro.tope) proMal.push('lo que se le pide a PROCODES (' + pesos(s.pro.monto) + ') pasa el tope de ' + s.pro.cant + ' ' + s.pro.unidad + ' (' + pesos(s.pro.tope) + ')');
  r(pecado.length || proMal.length ? 1 : 0, 'El pecado mayor', 'Ningún fondo paga lo que sus reglas no admiten ni más de su tope.', (pecado.length ? 'Honorarios del propio equipo o comida que no es de faena cargados a un fondo: ' + ids(pecado) + '. ' : '') + (proMal.length ? proMal.join('; ') + '.' : ''));

  var equivocado = ps.filter(function (p) { var t = bolsilloMal(p); if (t) marca(p, t); return !!t; });
  r(equivocado.length, 'El bolsillo equivocado', 'Cada bolsillo paga lo que sus reglas dejan.', 'Partidas en un bolsillo que no paga esa clase de cosa: ' + equivocado.map(function (p) { return '#' + p.id + ' (' + bolsilloMal(p) + ')'; }).join('; ') + '.');

  var tarde = ps.filter(function (p) { var t = cuandoMal(p); if (t) marca(p, 'llega tarde'); return !!t; });
  if (e.flete && e.flete.si && cuandoMal(e.flete)) tarde.push({ id: 'flete', mes: e.flete.mes, bolsillo: e.flete.bolsillo, forma: e.flete.forma });
  r(tarde.length, 'El dinero que llega tarde', 'Cada peso llega antes del mes en que se gasta.', 'Se gastaría antes de que llegue el bolsillo, o después de que cierre: ' + tarde.map(function (p) { return (p.id === 'flete' ? 'el flete' : '#' + p.id) + ' en ' + mesTxt(p.mes) + ' (' + cuandoMal(p) + ')'; }).join('; ') + '. Se mueve la compra de mes, se adelanta con autogestión o se cambia de bolsillo.');

  var sinB = ps.filter(function (p) { if (!p.bolsillo) { marca(p, 'sin bolsillo'); return true; } return false; });
  r(sinB.length, 'La partida sin bolsillo', 'Cada partida dice quién la pagaría.', 'Partidas que todavía no tienen quién las pague: ' + ids(sinB) + '. Si nadie la pagaría, se dice en voz alta: es una gestión pendiente, no un olvido.', 'ojo');

  var cae = ps.filter(function (p) { return p.cae; });
  r(cae.length ? 0 : 1, 'Lo que se cae primero', 'Marcado: ' + ids(cae) + '. Si un bolsillo no llega, el equipo ya sabe qué suelta.', 'Ninguna partida está marcada. Si un bolsillo no llega, ¿qué se suelta primero y por qué el resto sigue sirviendo?');
  return { lista: lista, fila: fila };
}
