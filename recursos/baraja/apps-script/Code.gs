/**
 * LA BARAJA DE LA ORILLA · servicio de equipos (Google Apps Script)
 * Gestión y Manejo de Proyectos · UAQ Campus Concá · 2026
 * ------------------------------------------------------------------
 * El puente entre la baraja (recursos/baraja/index.html, estática en
 * GitHub Pages) y una hoja de cálculo. Hace tres cosas:
 *   1. Guarda la decisión de cada equipo sobre cada carta (va / quizá / no,
 *      zona, quién la cuida, comentario) y quién la tomó. Todos los
 *      teléfonos de un mismo equipo ven lo mismo.
 *   2. Guarda las cartas en blanco que inventa cada equipo.
 *   3. Guarda la retroalimentación de la ronda 2 («falta» / «choca con lo
 *      mío») y se la devuelve al equipo que presenta y a la pantalla
 *      proyectada (plenaria.html).
 *
 * ============================= INSTALACIÓN =============================
 *  1. Crea una hoja de cálculo nueva en Drive: «Baraja de la orilla 2026».
 *  2. Extensiones → Apps Script. Borra lo que haya y pega TODO este archivo.
 *  3. Ejecuta «prepararHoja» una vez y autoriza los permisos.
 *  4. Implementar → Nueva implementación → engrane → Aplicación web
 *       - Descripción: baraja
 *       - Ejecutar como: YO (tu cuenta)
 *       - Quién tiene acceso: CUALQUIER PERSONA
 *     → Implementar → copia la «URL de la aplicación web» (termina en /exec).
 *  5. Pégala en recursos/baraja/baraja-config.js, en BARAJA_API_URL.
 *  Si cambias este código después: Implementar → Gestionar implementaciones
 *  → editar → Versión: NUEVA. Si no, el enlace sigue sirviendo la anterior.
 *  Al pegar una versión nueva, vuelve a ejecutar «prepararHoja».
 *
 *  No hay clave: lo que guardan los equipos lo ve el grupo entero, que es
 *  la idea de la ronda 2. Para empezar de cero otro semestre, basta con
 *  borrar las filas de las pestañas (no los encabezados).
 */

const HOJA_DEC = 'Decisiones';      // una fila por equipo+carta, la última decisión
const HOJA_HIST = 'Historial';      // todas las decisiones, en orden de llegada
const HOJA_NUEVAS = 'Cartas nuevas';
const HOJA_RETRO = 'Retro';

const COLS_DEC = ['equipo', 'carta', 'estado', 'zona', 'cuida', 'nota', 'quien', 'ts', 'actualizado'];
const COLS_HIST = ['fecha', 'equipo', 'carta', 'estado', 'zona', 'cuida', 'nota', 'quien', 'ts'];
const COLS_NUEVAS = ['equipo', 'id', 'titulo', 'que', 'ejemplo', 'quien', 'ts', 'actualizado'];
const COLS_RETRO = ['fecha', 'de', 'para', 'carta', 'tipo', 'texto', 'quien', 'id'];

function prepararHoja() {
  /* Las columnas con códigos de carta (3-01, 1a-04…) se declaran de texto: si no, la hoja
     convierte «3-01» en la fecha 3 de enero y la plenaria ya no sabe de qué carta se trata. */
  textoCol_(hoja_(HOJA_DEC, COLS_DEC), 2); textoCol_(hoja_(HOJA_HIST, COLS_HIST), 3);
  textoCol_(hoja_(HOJA_NUEVAS, COLS_NUEVAS), 2); textoCol_(hoja_(HOJA_RETRO, COLS_RETRO), 4);
}
function textoCol_(sh, col) { sh.getRange(2, col, sh.getMaxRows() - 1, 1).setNumberFormat('@'); }

/* ===================== ENTRADAS WEB ===================== */

function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  try {
    if (p.action === 'equipo') {
      const eq = equipo_(p.equipo);
      return json_({ ok: true, equipo: eq, decisiones: leerDec_(eq), nuevas: leerNuevas_(eq), retro: leerRetro_(eq, null) }, p.callback);
    }
    if (p.action === 'todo') {
      return json_({ ok: true, decisiones: leerDec_(0), nuevas: leerNuevas_(0), retro: leerRetro_(0, null) }, p.callback);
    }
    return ContentService.createTextOutput('La baraja está viva. Este enlace no se abre: lo usan la baraja y la plenaria.');
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) }, p.callback);
  }
}

function doPost(e) {
  let p;
  try { p = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'json' }); }
  try {
    switch (p.action) {
      case 'decidir': guardarDecision_(p); return json_({ ok: true });
      case 'nueva':   guardarNueva_(p);    return json_({ ok: true });
      case 'retro':   guardarRetro_(p);    return json_({ ok: true });
      default:        return json_({ ok: false, error: 'accion' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

/* ===================== GUARDAR ===================== */

function guardarDecision_(p) {
  const eq = equipo_(p.equipo); const carta = id_(p.carta);
  if (!eq || !carta) throw new Error('falta equipo o carta');
  const ts = Number(p.ts) || Date.now();
  const vals = [eq, txt_(carta), celda_(p.estado, 10), celda_(p.zona, 40), celda_(p.cuida, 200), celda_(p.nota, 2000), celda_(p.quien, 80), ts, new Date()];
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = hoja_(HOJA_DEC, COLS_DEC);
    const data = sh.getDataRange().getValues();
    let row = -1;
    for (let i = 1; i < data.length; i++) if (Number(data[i][0]) === eq && codigo_(data[i][1]) === carta) { row = i + 1; break; }
    /* Si en la hoja hay una decisión más nueva (otro teléfono del mismo equipo), esa gana. */
    if (row > 0 && Number(data[row - 1][7]) > ts) return;
    if (row > 0) sh.getRange(row, 1, 1, vals.length).setValues([vals]); else sh.appendRow(vals);
    hoja_(HOJA_HIST, COLS_HIST).appendRow([new Date(), eq, txt_(carta), vals[2], vals[3], vals[4], vals[5], vals[6], ts]);
  } finally { lock.releaseLock(); }
}

function guardarNueva_(p) {
  const eq = equipo_(p.equipo); const id = id_(p.id);
  if (!eq || !id) throw new Error('falta equipo o id');
  const ts = Number(p.ts) || Date.now();
  const vals = [eq, txt_(id), celda_(p.titulo, 200), celda_(p.que, 2000), celda_(p.ejemplo, 2000), celda_(p.quien, 80), ts, new Date()];
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = hoja_(HOJA_NUEVAS, COLS_NUEVAS);
    const data = sh.getDataRange().getValues();
    let row = -1;
    for (let i = 1; i < data.length; i++) if (Number(data[i][0]) === eq && codigo_(data[i][1]) === id) { row = i + 1; break; }
    if (row > 0) sh.getRange(row, 1, 1, vals.length).setValues([vals]); else sh.appendRow(vals);
  } finally { lock.releaseLock(); }
}

function guardarRetro_(p) {
  const de = equipo_(p.de); const para = equipo_(p.para);
  if (!de || !para) throw new Error('falta equipo');
  const tipo = p.tipo === 'choca' ? 'choca' : 'falta';
  hoja_(HOJA_RETRO, COLS_RETRO).appendRow([new Date(), de, para, txt_(id_(p.carta)), tipo, celda_(p.texto, 1000), celda_(p.quien, 80), txt_(id_(p.id))]);
}

/* ===================== LEER ===================== */

function leerDec_(eq) {
  return filas_(HOJA_DEC, COLS_DEC).filter(function (r) { return !eq || Number(r.equipo) === eq; })
    .map(function (r) { return { equipo: Number(r.equipo), carta: r.carta, estado: r.estado, zona: r.zona, cuida: r.cuida, nota: r.nota, quien: r.quien, ts: Number(r.ts) || 0 }; });
}
function leerNuevas_(eq) {
  return filas_(HOJA_NUEVAS, COLS_NUEVAS).filter(function (r) { return !eq || Number(r.equipo) === eq; })
    .map(function (r) { return { equipo: Number(r.equipo), id: r.id, titulo: r.titulo, que: r.que, ejemplo: r.ejemplo, quien: r.quien, ts: Number(r.ts) || 0 }; });
}
function leerRetro_(para, de) {
  return filas_(HOJA_RETRO, COLS_RETRO).filter(function (r) { return (!para || Number(r.para) === para) && (!de || Number(r.de) === de); })
    .map(function (r) { return { fecha: r.fecha instanceof Date ? r.fecha.getTime() : 0, de: Number(r.de), para: Number(r.para), carta: r.carta, tipo: r.tipo, texto: r.texto, quien: r.quien, id: r.id }; });
}

/* Un código de carta que la hoja ya haya convertido en fecha (3-01 → 3 de enero) se recupera. */
function codigo_(v) {
  if (v instanceof Date) return (v.getMonth() + 1) + '-' + ('0' + v.getDate()).slice(-2);
  return String(v == null ? '' : v);
}
function filas_(nombre, cols) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!sh || sh.getLastRow() < 2) return [];
  const data = sh.getDataRange().getValues();
  const enc = data[0].map(function (c) { return String(c).trim(); });
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const o = {};
    enc.forEach(function (c, j) { o[c] = (c === 'carta' || c === 'id') ? codigo_(data[i][j]) : data[i][j]; });
    Object.keys(o).forEach(function (k) { if (typeof o[k] === 'string' && o[k].charAt(0) === "'") o[k] = o[k].slice(1); });
    out.push(o);
  }
  return out;
}

/* ===================== UTILERÍA ===================== */

function hoja_(nombre, cols) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    sh.appendRow(cols);
    sh.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#0B3C49').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}
function json_(o, callback) {
  const s = JSON.stringify(o);
  if (callback && /^[\w.]+$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + s + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}
function equipo_(v) { const n = Number(v); return (n >= 1 && n <= 9) ? Math.floor(n) : 0; }
function id_(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40); }
function clip_(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }
/* Lo que llega del navegador se guarda como texto: sin el apóstrofo, la hoja
   evaluaría como fórmula cualquier valor que empiece con = + - @. */
function celda_(s, n) { s = clip_(s, n); return /^[=+\-@\t\r\n]/.test(s) ? "'" + s : s; }
/* Los códigos de carta van siempre con apóstrofo: la hoja los guarda como texto y no como fecha. */
function txt_(s) { s = String(s == null ? '' : s); return s ? "'" + s : s; }
