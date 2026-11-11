/* Motor de calendario del cronograma de la presa.
   Coloca cada renglón en la primera semana posible que respete sus dependencias
   y la regla de su temporada; calcula fases, olas, alertas, carga mensual y ruta crítica. */
(function (raiz) {
  const A0 = 2026, M0 = 10; // t = 0 es la primera semana de octubre de 2026
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const SECAS = new Set([11, 12, 1, 2, 3, 4, 5]);
  const VENTANAS = {
    'siembra': [[6, 3, 4], [7, 1, 4]],
    'pre-siembra': [[5, 3, 4], [6, 1, 2]],
    'entrega-planta': [[6, 2, 4], [7, 1, 2]],
    'ventana-procodes': [[3, 1, 2]],
    'ventana-municipal': [[8, 1, 4], [9, 1, 4], [10, 1, 2]]
  };
  const LIMITE = 400;

  function T(a, m, s) { return (a - A0) * 48 + (m - M0) * 4 + (s - 1); }
  function cal(t) {
    const mi = Math.floor(t / 4), mm = M0 - 1 + mi;
    return { anio: A0 + Math.floor(mm / 12), mes: ((mm % 12) + 12) % 12 + 1, sem: ((t % 4) + 4) % 4 + 1 };
  }
  function diasMes(a, m) { return new Date(a, m, 0).getDate(); }
  function semana(t) {
    const c = cal(t), d1 = [1, 8, 15, 22][c.sem - 1];
    const d2 = c.sem === 4 ? diasMes(c.anio, c.mes) : d1 + 6;
    return { d1, d2, mes: c.mes, anio: c.anio };
  }
  const esVeda = t => { const c = cal(t); return (c.mes === 12 && c.sem === 4) || (c.mes === 1 && c.sem === 1); };
  function sinVeda(s, u) { for (let k = 0; k < Math.max(u, 1); k++) if (esVeda(s + k)) return false; return true; }
  function enSecas(s, u) { for (let k = 0; k < u; k++) if (!SECAS.has(cal(s + k).mes)) return false; return true; }
  function iniciaEn(s, pares) { const c = cal(s); return pares.some(([m, a, b]) => c.mes === m && c.sem >= a && c.sem <= b); }
  function buscar(desde, ok) { for (let s = desde; s < desde + LIMITE; s++) if (ok(s)) return s; return desde; }

  // Rótulos de fecha
  function mesCorto(t) { const c = cal(t); return MES3[c.mes - 1] + ' ' + c.anio; }
  function mesLargo(t) { const c = cal(t); return MESES[c.mes - 1] + ' de ' + c.anio; }
  function semanaTexto(t) { const w = semana(t); return w.d1 + ' al ' + w.d2 + ' de ' + MESES[w.mes - 1] + ' de ' + w.anio; }
  function rangoTexto(s, e) {
    if (e <= s) return semanaTexto(s);
    const a = cal(s), b = cal(e - 1);
    if (a.anio === b.anio && a.mes === b.mes) return MESES[a.mes - 1] + ' de ' + a.anio;
    if (a.anio === b.anio) return MESES[a.mes - 1] + ' a ' + MESES[b.mes - 1] + ' de ' + a.anio;
    return MESES[a.mes - 1] + ' de ' + a.anio + ' a ' + MESES[b.mes - 1] + ' de ' + b.anio;
  }
  function rangoCorto(s, e) {
    if (e <= s) return mesCorto(s);
    const a = mesCorto(s), b = mesCorto(e - 1);
    return a === b ? a : a + ' – ' + b;
  }
  function hitoTexto(t) {
    // un hito cae en la frontera t; se rotula con la semana que termina ahí
    const w = semana(Math.max(0, t - 1));
    return w.d1 + '–' + w.d2 + ' ' + MES3[w.mes - 1] + ' ' + w.anio;
  }

  function indexar(datos) { const m = new Map(); datos.A.forEach(a => m.set(a.id, a)); return m; }

  function orden(datos) {
    const idx = indexar(datos), visto = new Map(), out = [], ciclos = [];
    function dfs(id, pila) {
      const st = visto.get(id);
      if (st === 2) return;
      if (st === 1) { ciclos.push(pila.slice(pila.indexOf(id)).concat(id)); return; }
      visto.set(id, 1); pila.push(id);
      const a = idx.get(id);
      (a ? a.d : []).forEach(d => { if (idx.has(d)) dfs(d, pila); });
      pila.pop(); visto.set(id, 2); out.push(id);
    }
    datos.A.forEach(a => dfs(a.id, []));
    return { orden: out, ciclos };
  }

  function eventosT(datos) { return datos.EVENTOS.map(e => ({ ...e, t: T(e.en[0], e.en[1], e.en[2]) })); }

  /* deltas: { anuencia, dinero, permisos } en semanas; extra: { id: semanas extra de duración } */
  function programar(datos, deltas, extra) {
    deltas = deltas || {}; extra = extra || {};
    const idx = indexar(datos), { orden: ord, ciclos } = orden(datos);
    const ev = eventosT(datos), ss = ev.filter(e => e.id.startsWith('SS')).sort((a, b) => a.t - b.t);
    const ssDesde = es => ss.find(x => x.t >= es);
    const P = {};
    const finPara = id => { const p = P[id]; if (!p) return 0; return p.tipo === 'continuo' ? p.s + 1 : p.e; };
    ord.forEach(id => {
      const a = idx.get(id);
      let es = 0;
      a.d.forEach(d => { if (idx.has(d)) es = Math.max(es, finPara(d)); });
      es += a.lag || 0;
      if (a.min) es = Math.max(es, T(a.min[0], a.min[1], a.min[2]));
      const dSim = a.sim ? (deltas[a.sim] || 0) : 0;
      let u = (a.u || 0) + (extra[id] || 0);
      let s;
      if (a.t === 'espera') { u += dSim; s = es; }
      else if (a.t === 'hito' && !a.x) { s = es + (a.sim === 'anuencia' ? dSim : 0); }
      else if (a.t === 'hito' && a.x === 'SS') { const e = ssDesde(es); s = e ? e.t + e.u : es; }
      else if (a.x === 'SS' || a.t === 'fija') { const e = ssDesde(es); s = e ? e.t : es; }
      else if (a.t === 'aprob-municipal') { s = buscar(es, x => { const c = cal(x); return c.mes === 12 && c.sem === 3; }) + 1 + dSim; }
      else if (a.t === 'continuo') { s = es; }
      else {
        if (a.sim === 'anuencia') es += dSim;
        if (a.t === 'secas') s = buscar(es, x => enSecas(x, u) && sinVeda(x, u));
        else if (VENTANAS[a.t]) s = buscar(es, x => iniciaEn(x, VENTANAS[a.t]) && sinVeda(x, u));
        else if (a.t === 'secas-inicio') s = buscar(es, x => { const c = cal(x); return c.mes === 11 && c.sem === 1; });
        else if (a.t === 'post-lluvias') {
          const j = buscar(es, x => { const c = cal(x); return c.mes === 6 && c.sem === 1; });
          s = buscar(j, x => { const c = cal(x); return c.mes === 11 && c.sem === 1; });
        }
        else s = buscar(es, x => sinVeda(x, u));
      }
      const esHito = a.t === 'hito' || a.t === 'aprob-municipal';
      P[id] = { id, s, e: esHito ? s : s + u, u: esHito ? 0 : u, es, tipo: a.t, hito: esHito };
    });
    // fin del horizonte y actividades continuas
    let fin = 0;
    Object.values(P).forEach(p => { if (p.tipo !== 'continuo') fin = Math.max(fin, p.e); });
    const finEje = Math.ceil((fin + 1) / 4) * 4;
    datos.A.forEach(a => {
      if (a.t !== 'continuo') return;
      const p = P[a.id];
      p.e = a.hasta === 'FIN' ? finEje : (P[a.hasta] ? Math.max(P[a.hasta].s, p.s + 1) : finEje);
      p.u = p.e - p.s;
    });
    // fases y olas
    const fases = {}, olas = {};
    datos.A.forEach(a => {
      const p = P[a.id]; if (a.t === 'continuo') return;
      const f = fases[a.f] || (fases[a.f] = { s: Infinity, e: -Infinity });
      f.s = Math.min(f.s, p.s); f.e = Math.max(f.e, p.e);
      if (a.o && a.banda !== false) { const o = olas[a.o] || (olas[a.o] = { s: Infinity, e: -Infinity }); o.s = Math.min(o.s, p.s); o.e = Math.max(o.e, p.e); }
    });
    return { P, fases, olas, fin, finEje, ciclos, eventos: ev };
  }

  function alertas(datos, prog, base) {
    const out = [], P = prog.P, ev = {};
    prog.eventos.forEach(e => ev[e.id] = e.t);
    datos.ALERTAS.forEach(r => {
      if (r.tipo === 'antes') { const p = P[r.id]; if (p && p.e > ev[r.ev]) out.push({ ...r, ids: [r.id] }); }
      else if (r.tipo === 'salto') { const p = P[r.id], b = base && base.P[r.id]; if (p && b && p.s - b.s >= 30) out.push({ ...r, ids: [r.id] }); }
      else if (r.tipo === 'procodes') {
        const h = P['H7']; if (!h) return;
        const lim = T(cal(h.s).anio + 1, 1, 1);
        const malos = datos.A.filter(a => a.fondo === 'PROCODES' && a.o === 2 && P[a.id].e > lim).map(a => a.id);
        if (malos.length) out.push({ ...r, ids: malos });
      }
      else if (r.tipo === 'permiso150') {
        const ap = P['H6'], au = P['H8'];
        if (ap && au && au.s > ap.s + 21) out.push({ ...r, ids: ['H8', 'H6'] });
      }
    });
    return out;
  }

  function carga(datos, prog) {
    const porMes = {};
    datos.A.forEach(a => {
      if (a.t === 'hito' || a.t === 'aprob-municipal' || a.t === 'continuo' || a.t === 'espera' || a.c === 'G') return;
      const p = prog.P[a.id];
      for (let t = p.s; t < p.e; t++) { const m = Math.floor(t / 4); porMes[m] = (porMes[m] || 0) + 1; }
    });
    return porMes;
  }

  function rutaCritica(datos, deltas) {
    const base = programar(datos, deltas), finBase = base.P['H14'].s, out = {};
    datos.A.forEach(a => {
      if (a.t === 'hito' || a.t === 'aprob-municipal' || a.t === 'continuo') return;
      const p = programar(datos, deltas, { [a.id]: 1 });
      const dif = p.P['H14'].s - finBase;
      if (dif > 0) out[a.id] = dif;
    });
    return out;
  }

  function validar(datos) {
    const idx = indexar(datos), faltan = [], sinDueno = [];
    datos.A.forEach(a => {
      a.d.forEach(d => { if (!idx.has(d)) faltan.push(a.id + ' → ' + d); });
      if (!a.r || /^equipo$/i.test(a.r.trim())) sinDueno.push(a.id);
    });
    return { faltan, sinDueno, ciclos: orden(datos).ciclos };
  }

  // códigos de presentación ordenados por fecha base dentro de cada componente: G-01, 1a-03, H-05…
  function codigos(datos, prog) {
    prog = prog || programar(datos);
    const grupos = {}, out = {};
    datos.A.forEach((a, i) => {
      const pre = a.t === 'hito' || a.t === 'aprob-municipal' ? 'H' : a.c;
      (grupos[pre] = grupos[pre] || []).push({ a, i });
    });
    Object.entries(grupos).forEach(([pre, lista]) => {
      lista.sort((x, y) => (prog.P[x.a.id].s - prog.P[y.a.id].s) || (x.i - y.i));
      lista.forEach((x, k) => out[x.a.id] = pre + '-' + String(k + 1).padStart(2, '0'));
    });
    return out;
  }

  /* Fragilidad: qué pasa si un renglón se atrasa una semana.
     Devuelve, por clave, cuántas semanas se mueve el cierre y qué alertas nuevas aparecen. */
  function fragilidad(datos, deltas) {
    const base = programar(datos, deltas), finBase = base.P['H14'].s;
    const alBase = new Set(alertas(datos, base, base).map(x => x.msg)), out = {};
    datos.A.forEach(a => {
      if (a.t === 'hito' || a.t === 'aprob-municipal' || a.t === 'continuo') return;
      const p = programar(datos, deltas, { [a.id]: 1 });
      const cierre = p.P['H14'].s - finBase;
      const nuevas = alertas(datos, p, base).filter(x => !alBase.has(x.msg)).map(x => x.msg);
      if (cierre > 0 || nuevas.length) out[a.id] = { cierre, alertas: nuevas };
    });
    return out;
  }

  const MOTOR = { T, cal, semana, esVeda, MESES, MES3, SECAS, mesCorto, mesLargo, semanaTexto, rangoTexto, rangoCorto, hitoTexto,
    programar, alertas, carga, rutaCritica, fragilidad, validar, codigos, orden, indexar, eventosT };
  if (typeof module !== 'undefined' && module.exports) module.exports = MOTOR;
  else raiz.MOTOR = MOTOR;
})(typeof window !== 'undefined' ? window : globalThis);
