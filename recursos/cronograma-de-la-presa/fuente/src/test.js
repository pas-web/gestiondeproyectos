const D = require('./data.js');
const M = require('./engine.js');

const v = M.validar(D);
console.log('Validación:', JSON.stringify(v));
const base = M.programar(D);
const cod = M.codigos(D);
const frag = M.fragilidad(D);
console.log('Fin:', base.fin, M.mesCorto(base.fin - 1), 'Eje hasta', base.finEje, M.mesCorto(base.finEje - 1));
console.log('\nFASES');
Object.entries(base.fases).forEach(([f, x]) => console.log(' fase', f, M.rangoCorto(x.s, x.e), `[${x.s},${x.e})`));
console.log('OLAS');
Object.entries(base.olas).forEach(([f, x]) => console.log(' ola', f, M.rangoCorto(x.s, x.e), `[${x.s},${x.e})`));
console.log('\nRENGLONES');
const orden = ['G', '1a', '1b', '2', '3', '4', '5'];
orden.forEach(c => {
  console.log('--', c);
  D.A.filter(a => a.c === c).forEach(a => {
    const p = base.P[a.id];
    const fecha = p.hito ? M.hitoTexto(p.s) : M.rangoCorto(p.s, p.e);
    console.log(`  ${cod[a.id].padEnd(6)} ${a.id.padEnd(6)} f${a.f}${a.o ? ' o' + a.o : '   '} [${String(p.s).padStart(3)},${String(p.e).padStart(3)}) ${fecha.padEnd(22)} ${a.t.padEnd(16)} ${a.n.slice(0, 70)}`);
  });
});
console.log('\nALERTAS base:', M.alertas(D, base, base));
const crit = M.rutaCritica(D);
console.log('\nRUTA CRÍTICA (semanas que se mueve el cierre si se atrasa una semana):');
console.log(Object.entries(crit).map(([id, d]) => `${cod[id]}(${id})+${d}`).join('  '));
console.log('\nCARGA por mes:');
const cg = M.carga(D, base);
Object.keys(cg).sort((a, b) => a - b).forEach(m => console.log('  ', M.mesCorto(+m * 4).padEnd(9), '#'.repeat(cg[m])));

function escenario(nombre, deltas) {
  const p = M.programar(D, deltas);
  const al = M.alertas(D, p, base);
  console.log(`\nESCENARIO ${nombre}: cierre ${M.hitoTexto(p.P.H14.s)} (base ${M.hitoTexto(base.P.H14.s)}), muelle ${M.rangoCorto(p.P['3.10'].s, p.P['3.10'].e)}, siembra ${M.rangoCorto(p.P['1b.11'].s, p.P['1b.11'].e)}, palapas ${M.rangoCorto(p.P['5.5'].s, p.P['5.5'].e)}`);
  al.forEach(a => console.log('   ⚠', a.msg, a.ids.join(',')));
}
escenario('anuencia +4', { anuencia: 4 });
escenario('anuencia +8', { anuencia: 8 });
escenario('dinero +8', { dinero: 8 });
escenario('dinero +16', { dinero: 16 });
escenario('permisos +8', { permisos: 8 });
escenario('permisos +16', { permisos: 16 });

console.log('\nFRAGILIDAD (+1 semana):');
Object.entries(frag).forEach(([id, f]) => console.log('  ', cod[id], id.padEnd(6), 'cierre +' + f.cierre, f.alertas.join(' | ')));
