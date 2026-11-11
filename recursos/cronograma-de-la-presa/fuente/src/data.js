/* Cronograma hipotético · Presa de La Florida · 2026-2028
   Matriz maestra de actividades.
   Unidad de tiempo: semana aproximada (cuarto de mes). t = 0 es del 1 al 7 de octubre de 2026.
   Semanas de cada mes: 1 (días 1-7), 2 (8-14), 3 (15-21), 4 (22 al fin de mes).

   Campos de cada renglón
   id     clave interna            c   componente (G, 1a, 1b, 2, 3, 4, 5)
   f      fase (1-5)               o   ola de implementación (1, 2) o nada
   n      actividad                p   producto que deja
   r      cargo responsable        d   depende de (claves)
   t      regla de calendario      u   duración en semanas
   min    no antes de [año, mes, semana]
   lag    semanas de espera después de sus dependencias
   sim    perilla del simulador que la mueve (anuencia, dinero, permisos)
   fondo  fuente de recursos       gate  compuerta de decisión (con siNo)
   hasta  fin de una actividad continua (clave o 'FIN')
   fecha  rótulo fijo para hitos con fecha conocida
*/
(function (raiz) {
  const COMPONENTES = [
    { id: 'G', clave: 'Gestión', nombre: 'Ruta de gestión', corto: 'Gestión',
      deja: 'Catálogo, anuencias, comité, carpeta del proyecto, solicitudes de fondos y permisos.' },
    { id: '1a', clave: '1a', nombre: 'Contener la erosión de la orilla', corto: 'Erosión',
      deja: 'Talud junto al vertedor con cerco, fajinas, trampa de azolve y estacas vivas; ganado fuera.' },
    { id: '1b', clave: '1b', nombre: 'Revegetar con especies nativas', corto: 'Revegetación',
      deja: 'Dos corredores de monte cercados, corredor de fauna en el cauce, cuarenta árboles con cajete y sombra plantada donde irán palapas y bancas.' },
    { id: '2', clave: '2', nombre: 'La comunidad cuida y vigila la orilla', corto: 'Comunidad',
      deja: 'Comité de la presa con acta, reglamento aprobado en asamblea, recorridos por turnos y letreros de reglas y bienvenida.' },
    { id: '3', clave: '3', nombre: 'Recreación para las distintas edades', corto: 'Recreación',
      deja: 'Tres rutas señaladas en la zona de los pinos, muelle de 8 × 4 m con cinco boyas de profundidad y conteos de visitantes por edades.' },
    { id: '4', clave: '4', nombre: 'El espacio se mantiene seguro y limpio', corto: 'Seguridad y limpieza',
      deja: 'Contenedores con ruta de recolección, fantasmas luminiscentes, barreras vivas, estacionamiento con cerca de acceso y cinco lámparas solares.' },
    { id: '5', clave: '5', nombre: 'Espacios de convivencia y descanso', corto: 'Convivencia',
      deja: 'Tres palapas de 4 × 4 m con mesa, bancas y asador, diez bancas en la orilla y una explanada de 200 m².' }
  ];

  const FASES = [
    { id: 1, nombre: 'Catálogo', sub: 'El anteproyecto',
      texto: 'Las propuestas de los seis equipos se integran en un catálogo con fotomontajes y este cronograma hipotético.' },
    { id: 2, nombre: 'Asamblea ejidal', sub: 'Anuencia del ejido',
      texto: 'Convocatoria con cédulas, presentación del catálogo, retroalimentación y acta de anuencia.' },
    { id: 3, nombre: 'Comunidad y comité', sub: 'Consentimiento, comité y reglamento',
      texto: 'Presentación pública en la orilla, comité de la presa con acta y reglamento de uso aprobado antes de Semana Santa.' },
    { id: 4, nombre: 'Financiamiento y permisos', sub: 'Ventanillas y trámites',
      texto: 'Carpeta con cotizaciones, autogestión, Ayuntamiento, PROCODES y CONAFOR; impacto ambiental y zona federal.' },
    { id: 5, nombre: 'Implementación', sub: 'Dos olas de obra y siembra',
      texto: 'Ola 1: lo que depende de la comunidad. Ola 2: lo que espera dinero y permisos. Lo que se siembra espera la lluvia; lo que se construye busca la seca.' }
  ];

  const OLAS = [
    { id: 1, nombre: 'Ola 1', sub: 'Lo que depende de la comunidad' },
    { id: 2, nombre: 'Ola 2', sub: 'Lo que espera dinero y permisos' },
    { id: 3, nombre: 'Seguimiento', sub: 'Riego, reposición y revisiones tras las lluvias' }
  ];

  const FONDOS = {
    'Autogestión': 'Autogestión y aportación en especie: faenas valorizadas, cooperación, kermés, materiales donados por el ejido; capital semilla de la UAQ como contrapartida.',
    'Municipio': 'Ayuntamiento de Arroyo Seco: servicio de limpia, apoyo en especie y obra pública con recursos propios (sin FAIS).',
    'PROCODES': 'CONANP · Programa de Conservación para el Desarrollo Sostenible: proyecto ecoturístico (palapas, señalización, senderos).',
    'CONAFOR': 'Comisión Nacional Forestal: planta para la revegetación y asesoría técnica.'
  };

  // Semana Santa (domingo de Ramos a domingo de Pascua) en semanas del calendario
  const EVENTOS = [
    { id: 'SS27', nombre: 'Semana Santa 2027', fecha: '21 al 28 de marzo de 2027', en: [2027, 3, 4], u: 1 },
    { id: 'SS28', nombre: 'Semana Santa 2028', fecha: '9 al 16 de abril de 2028', en: [2028, 4, 2], u: 2 },
    { id: 'SS29', nombre: 'Semana Santa 2029', fecha: '25 de marzo al 1 de abril de 2029', en: [2029, 3, 4], u: 1, oculto: true },
    { id: 'SS30', nombre: 'Semana Santa 2030', fecha: '14 al 21 de abril de 2030', en: [2030, 4, 3], u: 1, oculto: true }
  ];

  const R = {
    prof: 'Profesor responsable (UAQ)',
    grupo: 'Grupo de la Lic. PAS (UAQ)',
    ss: 'Servicio social (UAQ)',
    comis: 'Comisariado ejidal',
    deleg: 'Delegado de La Florida',
    pres: 'Presidencia del comité',
    secr: 'Secretaría del comité',
    tes: 'Tesorería del comité',
    vig: 'Vocalía de vigilancia',
    obra: 'Vocalía de obra',
    siem: 'Vocalía de siembra',
    op: 'Ayuntamiento · Obras Públicas',
    conanp: 'CONANP · Dirección Regional',
    semarnat: 'SEMARNAT',
    conagua: 'CONAGUA'
  };

  const A = [
    // ───────────── FASE 1 · CATÁLOGO ─────────────
    { id: 'G1', c: 'G', f: 1, n: 'Integrar en el catálogo las propuestas de los seis equipos', p: 'Catálogo en borrador con fichas por componente', r: R.prof, d: [], t: 'libre', u: 3, min: [2026, 10, 4] },
    { id: 'G2', c: 'G', f: 1, n: 'Revisar el catálogo con el grupo y cerrar fotomontajes y cronograma', p: 'Catálogo final y cronograma hipotético', r: R.grupo, d: ['G1'], t: 'libre', u: 2 },
    { id: 'H1', corto: 'Catálogo entregado', c: 'G', f: 1, n: 'Catálogo entregado', p: 'Catálogo impreso y en el Drive', r: R.prof, d: ['G2'], t: 'hito', fecha: '27 nov 2026' },

    // ───────────── FASE 2 · ASAMBLEA EJIDAL ─────────────
    { id: 'G3', c: 'G', f: 2, n: 'Pedir al comisariado el punto en el orden del día de la asamblea', p: 'Oficio con acuse', r: R.prof, d: [], t: 'libre', u: 1, min: [2026, 11, 3] },
    { id: 'G4', c: 'G', f: 2, n: 'Expedir la convocatoria con cédulas, de 8 a 15 días antes', p: 'Cédulas fijadas en lugares visibles del ejido', r: R.comis, d: ['G3'], t: 'libre', u: 1 },
    { id: 'G5', c: 'G', f: 2, n: 'Presentar el catálogo en asamblea ejidal y recoger su retroalimentación', p: 'Acta de asamblea con los acuerdos', r: R.comis, d: ['G4', 'H1'], t: 'libre', u: 1, sim: 'anuencia' },
    { id: 'H2', corto: 'Anuencia del ejido', c: 'G', f: 2, n: 'Anuencia del ejido', p: 'Acta de anuencia', r: R.comis, d: ['G5'], t: 'hito', gate: true,
      siNo: 'Se ajusta el catálogo con lo que pidió la asamblea y se presenta de nuevo. Sin anuencia no se construye nada.' },
    { id: 'G6', c: 'G', f: 2, n: 'Ajustar el catálogo con lo que pidió la asamblea', p: 'Catálogo ajustado y lista de cambios', r: R.prof, d: ['G5'], t: 'libre', u: 1 },

    // ───────────── FASE 3 · COMUNIDAD Y COMITÉ ─────────────
    { id: 'G7', c: 'G', f: 3, n: 'Presentar las propuestas a la comunidad en la orilla, un domingo', p: 'Lista de asistencia y registro de interesados', r: R.deleg, d: ['H2', 'G6'], t: 'libre', u: 1 },
    { id: 'H3', corto: 'Consentimiento comunitario', c: 'G', f: 3, n: 'Consentimiento de la comunidad', p: 'Relatoría firmada de la reunión', r: R.deleg, d: ['G7'], t: 'hito', gate: true,
      siNo: 'Las piezas rechazadas salen del catálogo o se reformulan. El comité no se forma sobre un no.' },
    { id: '2.1', c: '2', f: 3, n: 'Censar quién cuida hoy la orilla, su estado y sus usos', p: 'Ficha del censo con fotos', r: R.ss, d: ['H3'], t: 'libre', u: 2, min: [2027, 1, 2] },
    { id: '2.2', c: '2', f: 3, n: 'Constituir el comité de la presa con acta (al menos cinco personas por línea de trabajo)', p: 'Acta con presidencia, secretaría, tesorería y vocalías', r: R.deleg, d: ['2.1'], t: 'libre', u: 1 },
    { id: 'H4', corto: 'Comité constituido', c: 'G', f: 3, n: 'Comité de la presa constituido', p: 'Acta de constitución', r: R.deleg, d: ['2.2'], t: 'hito' },
    { id: '2.3', c: '2', f: 3, n: 'Acordar turnos, ruta de recorridos y a quién se reporta cada hallazgo', p: 'Acuerdo de turnos y ruta', r: R.vig, d: ['2.2'], t: 'libre', u: 2 },
    { id: '5.3', c: '5', f: 3, n: 'Proponer con Protección Civil las reglas de fuego para asadores y fogatas', p: 'Reglas de fuego para el reglamento', r: R.pres, d: ['2.2'], t: 'libre', u: 1,
      nota: 'La temporada de incendios de la Sierra Gorda corre de diciembre a junio y coincide con las secas en que se construye.' },
    { id: '2.4', c: '2', f: 3, n: 'Redactar el borrador del reglamento: fuego, basura, ganado, vehículos y horarios', p: 'Borrador del reglamento', r: R.secr, d: ['2.2', '5.3'], t: 'libre', u: 2 },
    { id: '2.5', c: '2', f: 3, n: 'Consultar el borrador del reglamento con la comunidad', p: 'Relatoría con los cambios pedidos', r: R.pres, d: ['2.4'], t: 'libre', u: 1 },
    { id: '2.6', c: '2', f: 3, n: 'Convocar la asamblea ejidal y aprobar el reglamento de uso', p: 'Acta con el reglamento aprobado', r: R.comis, d: ['2.5'], t: 'libre', u: 2 },
    { id: 'H5', corto: 'Reglamento aprobado', c: 'G', f: 3, n: 'Reglamento aprobado', p: 'Reglamento firmado', r: R.comis, d: ['2.6'], t: 'hito' },

    // ───────────── FASE 4 · FINANCIAMIENTO Y PERMISOS ─────────────
    { id: 'G8', c: 'G', f: 4, n: 'Armar la carpeta del proyecto con tres cotizaciones por partida', p: 'Carpeta del proyecto con presupuesto', r: R.tes, d: ['2.2'], t: 'libre', u: 4 },
    { id: 'G9', c: 'G', f: 4, n: 'Pedir al Ayuntamiento limpia, maquinaria y materiales para 2027', p: 'Oficio con acuse', r: R.pres, d: ['2.2'], t: 'libre', u: 1, fondo: 'Municipio' },
    { id: 'G10', c: 'G', f: 4, n: 'Registrar las faenas como aportación en especie', p: 'Bitácora de jornales valorizados', r: R.secr, d: ['2.2'], t: 'continuo', hasta: 'H14', fondo: 'Autogestión' },
    { id: 'G11', c: 'G', f: 4, n: 'Kermés de Semana Santa y cooperación de visitantes', p: 'Corte de caja público', r: R.tes, d: ['H5'], t: 'fija', x: 'SS', u: 1, fondo: 'Autogestión' },
    { id: 'G12', c: 'G', f: 4, n: 'Ventanilla PROCODES: entregar la solicitud del proyecto ecoturístico', p: 'Solicitud con acuse de la CONANP', r: R.pres, d: ['G8', 'H2', '5.2'], t: 'ventana-procodes', u: 2, fondo: 'PROCODES',
      nota: 'La convocatoria sale a más tardar el último día hábil de febrero y recibe solicitudes 15 días hábiles. La UAQ no puede ser solicitante: solicita el comité como grupo organizado.' },
    { id: 'G13', c: 'G', f: 4, n: 'Dictamen y notificación de PROCODES', p: 'Oficio de autorización', r: R.conanp, d: ['G12'], t: 'espera', u: 6, sim: 'dinero', fondo: 'PROCODES',
      nota: 'Dictamen hasta 20 días hábiles después del cierre y notificación hasta 10 días hábiles después (reglas 2026).' },
    { id: 'H6', corto: 'PROCODES autorizado', c: 'G', f: 4, n: 'Apoyo PROCODES autorizado', p: 'Oficio de autorización', r: R.conanp, d: ['G13'], t: 'hito', gate: true, fondo: 'PROCODES',
      siNo: 'La ola 1 sigue con autogestión; palapas, bancas, explanada y letreros grandes esperan la convocatoria siguiente.' },
    { id: 'G14', c: 'G', f: 4, n: 'Firmar el convenio y recibir la primera ministración (hasta 50%)', p: 'Convenio de concertación y depósito', r: R.tes, d: ['H6'], t: 'espera', u: 5, fondo: 'PROCODES',
      nota: 'La primera ministración llega hasta 20 días hábiles después de firmado el convenio (reglas 2026).' },
    { id: 'H7', corto: 'Recurso PROCODES', c: 'G', f: 4, n: 'Recurso PROCODES disponible', p: 'Estado de cuenta', r: R.tes, d: ['G14'], t: 'hito', fondo: 'PROCODES' },
    { id: 'G15', c: 'G', f: 4, n: 'Consultar a la Dirección de la Reserva la vía de impacto ambiental', p: 'Minuta u oficio de respuesta', r: R.prof, d: ['H2'], t: 'libre', u: 2, min: [2027, 1, 2] },
    { id: 'G16', c: 'G', f: 4, n: 'Integrar y entregar a SEMARNAT la manifestación de impacto ambiental del conjunto', p: 'Manifestación con acuse de ingreso', r: R.prof, d: ['G15', '5.2', '3.7', '4.6'], t: 'libre', u: 5,
      nota: 'Las obras en áreas naturales protegidas federales requieren autorización previa en materia de impacto ambiental (LGEEPA, art. 28, fr. XI).' },
    { id: 'G17', c: 'G', f: 4, n: 'Evaluación de impacto ambiental (de 60 a 120 días hábiles)', p: 'Resolución de SEMARNAT', r: R.semarnat, d: ['G16'], t: 'espera', u: 18, sim: 'permisos',
      nota: 'Se calcula con 90 días hábiles, el punto medio del rango. PROCODES pide entregar los permisos dentro de los 150 días naturales siguientes a la aprobación.' },
    { id: 'H8', corto: 'Autorización ambiental', c: 'G', f: 4, n: 'Autorización de impacto ambiental', p: 'Resolución favorable', r: R.semarnat, d: ['G17'], t: 'hito', gate: true,
      siNo: 'Las piezas observadas se rediseñan o salen del proyecto; lo que no es obra sigue su curso.' },
    { id: 'G18', c: 'G', f: 4, n: 'Concesión de zona federal para el muelle (CONAGUA-01-006, 60 días hábiles)', p: 'Título de concesión', r: R.conagua, d: ['H8', '3.7'], t: 'espera', u: 12, sim: 'permisos',
      nota: 'La zona federal es la franja de diez metros contigua al vaso. El trámite pide la autorización de impacto ambiental. La concesión del Parque Lineal de Concá lleva más de dos años detenida.' },
    { id: 'H9', corto: 'Concesión de zona federal', c: 'G', f: 4, n: 'Concesión de zona federal', p: 'Título de concesión', r: R.conagua, d: ['G18'], t: 'hito', gate: true,
      siNo: 'El muelle y las boyas no se construyen; el resto del proyecto sigue sin ellos.' },
    { id: 'G19', c: 'G', f: 4, n: 'Pedir al Ayuntamiento obra para 2028: estacionamiento, cerca de acceso, luminaria y muelle', p: 'Oficio con expediente técnico y acuse', r: R.pres, d: ['4.8', '4.2', '3.8'], t: 'ventana-municipal', u: 2, fondo: 'Municipio',
      nota: 'La petición debe llegar antes de que se integre el presupuesto de egresos del año siguiente.' },
    { id: 'H10', corto: 'Presupuesto municipal 2028', c: 'G', f: 4, n: 'Presupuesto municipal 2028 con las obras del proyecto', p: 'Presupuesto de egresos aprobado', r: R.op, d: ['G19'], t: 'aprob-municipal', sim: 'dinero', gate: true, fondo: 'Municipio',
      siNo: 'Estacionamiento, cerca, luminaria y muelle se recorren un año o buscan otra fuente.' },
    { id: 'G20', c: 'G', f: 4, n: 'Comprobar PROCODES y firmar el acta de entrega-recepción', p: 'Acta de entrega-recepción y comprobantes', r: R.tes, d: ['5.8'], t: 'libre', u: 1, fondo: 'PROCODES',
      nota: 'Las acciones de PROCODES no pueden rebasar el 31 de diciembre del año en que se autorizan.' },

    // ───────────── FASE 5 · IMPLEMENTACIÓN ─────────────
    { id: 'G21', c: 'G', f: 5, o: 1, n: 'Levantar la línea base en la orilla con la hoja de observación (tres domingos)', p: 'Hoja de observación llena y en el Drive', r: R.secr, d: ['H3'], t: 'libre', u: 3, min: [2027, 1, 2],
      nota: 'Una sola línea base para los seis componentes, en lugar de seis repetidas.' },

    // 1a · Erosión
    { id: '1a.1', c: '1a', f: 5, o: 1, n: 'Acordar con ganaderos y ejido cerrar el acceso del ganado al vertedor', p: 'Minuta firmada con los ganaderos', r: R.comis, d: ['H2'], t: 'libre', u: 2, min: [2027, 1, 2] },
    { id: '1a.2', c: '1a', f: 5, o: 1, n: 'Colocar trancas para que el ganado no entre a la zona del vertedor', p: 'Trancas colocadas, foto', r: R.obra, d: ['1a.1'], t: 'secas', u: 1, fondo: 'Autogestión' },
    { id: '1a.3', c: '1a', f: 5, o: 1, n: 'Delimitar con estacas el perímetro de protección de los 15 m²', p: 'Acta de delimitación y foto', r: R.obra, d: ['1a.1', 'G21'], t: 'libre', u: 1, min: [2027, 3, 1] },
    { id: '1a.4', c: '1a', f: 5, o: 1, n: 'Establecer el cerco contra el ganado, de estacas vivas o alambre', p: 'Cerco concluido, foto', r: R.obra, d: ['1a.3'], t: 'secas', u: 3, fondo: 'Autogestión' },
    { id: '1a.5', c: '1a', f: 5, o: 1, n: 'Conseguir ramas y pastos para las fajinas', p: 'Registro del material reunido', r: R.obra, d: ['1a.3'], t: 'secas', u: 1, fondo: 'Autogestión' },
    { id: '1a.6', c: '1a', f: 5, o: 1, n: 'Instalar fajinas de rama en curvas de nivel, en faena', p: 'Foto antes y después, lista de asistencia', r: R.obra, d: ['1a.4', '1a.5'], t: 'secas', u: 2, fondo: 'Autogestión' },
    { id: '1a.7', c: '1a', f: 5, o: 1, n: 'Conseguir y preparar los costales para la trampa de azolve', p: 'Costales listos', r: R.obra, d: ['1a.3'], t: 'libre', u: 1, fondo: 'Autogestión' },
    { id: '1a.8', c: '1a', f: 5, o: 1, n: 'Colocar la trampa de azolve de costales en la parte baja', p: 'Trampa instalada, foto', r: R.obra, d: ['1a.6', '1a.7'], t: 'secas', u: 2, fondo: 'Autogestión' },
    { id: '1a.9', c: '1a', f: 5, o: 1, n: 'Cortar estacas vivas de sauce y aile', p: 'Foto de las estacas', r: R.siem, d: ['1b.1'], t: 'siembra', u: 1 },
    { id: '1a.10', c: '1a', f: 5, o: 1, n: 'Enterrar las estacas vivas al pie del talud con las primeras lluvias', p: 'Tramo de 5 m de estacas hincadas, foto', r: R.siem, d: ['1a.9', '1a.8'], t: 'siembra', u: 2, fondo: 'Autogestión' },
    { id: '1a.11', c: '1a', f: 5, o: 1, n: 'Armar el informe fotográfico de antes y después con la bitácora de obra', p: 'Informe en el Drive', r: R.secr, d: ['1a.10'], t: 'libre', u: 2 },
    { id: '1a.12', c: '1a', f: 5, o: 1, n: 'Registrar el prendimiento de las estacas a los tres meses', p: 'Registro de prendimiento con fecha', r: R.secr, d: ['1a.10'], t: 'libre', u: 1, lag: 12 },

    // 1b · Revegetación
    { id: '1b.1', c: '1b', f: 5, o: 1, n: 'Investigar especies nativas de la región, para siembra y estacas vivas', p: 'Lista de especies investigadas', r: R.ss, d: ['H3'], t: 'libre', u: 4, min: [2027, 1, 2] },
    { id: '1b.2', c: '1b', f: 5, o: 1, n: 'Pedir planta de encino, cedro blanco, tepame, huizache, sauce, aile y jarilla', p: 'Pedido con acuse del vivero o de CONAFOR', r: R.siem, d: ['1b.1', '2.2'], t: 'libre', u: 1, fondo: 'CONAFOR' },
    { id: '1b.3', c: '1b', f: 5, o: 1, n: 'Observar dónde cruza el ganado con frecuencia', p: 'Croquis de cruces con fechas', r: R.vig, d: ['G21'], t: 'libre', u: 4 },
    { id: '1b.4', c: '1b', f: 5, o: 1, n: 'Trazar los dos corredores de monte, de 15 a 20 m, entre humedal, arroyo y encinar', p: 'Plano con el trazo', r: R.ss, d: ['1b.3'], t: 'libre', u: 2 },
    { id: '1b.5', c: '1b', f: 5, o: 1, n: 'Cercar los corredores contra el ganado', p: 'Cerco, foto desde el punto fijo', r: R.obra, d: ['1b.4', '1a.1'], t: 'secas', u: 4, fondo: 'Autogestión', min: [2027, 4, 2] },
    { id: '1b.6', c: '1b', f: 5, o: 1, n: 'Cercar la franja del corredor de fauna sobre el cauce, con el ganado fuera', p: 'Franja cercada, foto', r: R.obra, d: ['1b.5'], t: 'secas', u: 2, fondo: 'Autogestión' },
    { id: '1b.7', c: '1b', f: 5, o: 1, n: 'Ubicar cajetes y árboles de sombra junto a los sitios de palapas y bancas', p: 'Croquis con puntos de siembra', r: R.siem, d: ['1b.4', '5.1'], t: 'libre', u: 2 },
    { id: '1b.8', c: '1b', f: 5, o: 1, n: 'Hacer los cuarenta cajetes sobre el suelo retenido, en faena', p: 'Cuarenta cajetes, foto', r: R.siem, d: ['1b.7'], t: 'pre-siembra', u: 2, fondo: 'Autogestión' },
    { id: '1b.9', c: '1b', f: 5, o: 1, n: 'Convocar por la delegación la faena de siembra', p: 'Aviso de la delegación', r: R.deleg, d: ['1b.8'], t: 'libre', u: 1 },
    { id: '1b.10', c: '1b', f: 5, o: 1, n: 'Recibir la planta del vivero', p: 'Remisión de entrega', r: R.siem, d: ['1b.2'], t: 'entrega-planta', u: 1, fondo: 'CONAFOR' },
    { id: '1b.11', c: '1b', f: 5, o: 1, n: 'Sembrar los cuarenta árboles con cajete al inicio de las lluvias (meta: 30 de junio)', p: 'Lista de asistencia, foto desde el punto fijo', r: R.siem, d: ['1b.8', '1b.9', '1b.10'], t: 'siembra', u: 1, fondo: 'Autogestión' },
    { id: 'H11', corto: 'Siembra', c: 'G', f: 5, o: 1, n: 'Siembra al inicio de las lluvias', p: 'Cuarenta árboles en el suelo', r: R.siem, d: ['1b.11'], t: 'hito' },
    { id: '1b.12', c: '1b', f: 5, o: 1, n: 'Plantar tres árboles de sombra del lado poniente de cada sitio de palapa y banca', p: 'Árboles sembrados, foto', r: R.siem, d: ['1b.11', '1b.7'], t: 'siembra', u: 1,
      nota: 'Se plantan antes de que existan las palapas: un árbol tarda más en dar sombra que un dictamen en salir.' },
    { id: '1b.13', c: '1b', f: 5, o: 1, n: 'Contar las plantas vivas a los tres meses y leer la tabla en asamblea (meta: 30 vivas)', p: 'Tabla de plantas vivas y acta de lectura', r: R.secr, d: ['1b.11'], t: 'libre', u: 1, lag: 12 },
    { id: '1b.14', c: '1b', f: 5, o: 3, n: 'Riego de auxilio cada quince días en la primera seca, con los recorridos', p: 'Bitácora de riego', r: R.vig, d: ['1b.11', '2.7'], t: 'secas-inicio', u: 28 },
    { id: '1b.15', c: '1b', f: 5, o: 3, n: 'Reponer las plantas muertas con las lluvias siguientes', p: 'Plantas repuestas y conteo actualizado', r: R.siem, d: ['1b.13'], t: 'siembra', u: 1 },

    // 2 · Comunidad (implementación)
    { id: '2.7', c: '2', f: 5, o: 1, n: 'Recorridos de vigilancia por turnos; Semana Santa es la primera prueba', p: 'Bitácora de recorridos', r: R.vig, d: ['2.3', '2.6'], t: 'continuo', hasta: 'FIN' },
    { id: '2.8', c: '2', f: 5, o: 1, n: 'Diseñar los letreros de reglas, contacto y emblema de la presa', p: 'Diseño con visto bueno del comité', r: R.ss, d: ['2.4'], t: 'libre', u: 2 },
    { id: '2.9', c: '2', f: 5, o: 1, n: 'Fabricar e instalar los letreros de reglas', p: 'Fotos y acta de instalación', r: R.obra, d: ['2.6', '2.8'], t: 'libre', u: 1, fondo: 'Autogestión' },
    { id: '2.10', c: '2', f: 5, o: 3, n: 'Revisar el reglamento tras la primera temporada de uso', p: 'Acta de asamblea con ajustes', r: R.comis, d: ['2.6'], t: 'post-lluvias', u: 1 },
    { id: '2.11', c: '2', f: 5, o: 2, n: 'Instalar el letrero de bienvenida y el panel de caminatas', p: 'Letreros instalados, foto con una persona como escala', r: R.obra, d: ['H7', 'H8', '2.8'], t: 'secas', u: 1, fondo: 'PROCODES' },
    { id: '2.12', c: '2', f: 5, o: 2, n: 'Recibir los espacios de convivencia y sumarlos a los recorridos', p: 'Acta de entrega-recepción', r: R.pres, d: ['5.8'], t: 'libre', u: 1 },

    // 3 · Recreación
    { id: '3.1', c: '3', f: 5, o: 1, n: 'Pedir por oficio a CONAGUA el dato de nivel y calidad del agua', p: 'Oficio con acuse; el dato, cuando llegue', r: R.prof, d: ['H2'], t: 'libre', u: 1, min: [2027, 1, 2] },
    { id: '3.2', c: '3', f: 5, o: 1, n: 'Medir en campo el nivel del agua en secas, con estadal y fotos', p: 'Registro de niveles con fecha', r: R.ss, d: ['H3'], t: 'secas', u: 4, min: [2027, 1, 2] },
    { id: '3.3', c: '3', f: 5, o: 1, n: 'Recorrer la zona de los pinos y trazar las tres rutas de senderismo', p: 'Croquis de las rutas con sus zonas de descanso', r: R.ss, d: ['H3'], t: 'libre', u: 2, min: [2027, 1, 2] },
    { id: '3.4', c: '3', f: 5, o: 1, n: 'Fabricar los postes para señalar rutas y zonas de descanso', p: 'Postes entregados', r: R.obra, d: ['3.3'], t: 'libre', u: 2, fondo: 'Autogestión' },
    { id: '3.5', c: '3', f: 5, o: 1, n: 'Señalar las tres rutas con marcas, postes y puntos de descanso', p: 'Señales colocadas, foto', r: R.obra, d: ['3.4'], t: 'secas', u: 3, fondo: 'Autogestión' },
    { id: '3.6', c: '3', f: 5, o: 1, n: 'Estrenar las rutas en Semana Santa y contar visitantes por edades', p: 'Conteo por edades y fotos', r: R.secr, d: ['3.5'], t: 'fija', x: 'SS', u: 1 },
    { id: '3.7', c: '3', f: 5, o: 1, n: 'Diseñar el muelle de 8 × 4 m con los niveles medidos, fijo o flotante', p: 'Plano con medidas', r: R.prof, d: ['3.2'], t: 'libre', u: 3 },
    { id: '3.8', c: '3', f: 5, o: 1, n: 'Cotizar los materiales del muelle (tres cotizaciones)', p: 'Presupuesto de materiales', r: R.tes, d: ['3.7'], t: 'libre', u: 2 },
    { id: '3.9', c: '3', f: 5, o: 2, n: 'Comprar los materiales del muelle', p: 'Facturas', r: R.tes, d: ['3.8', 'H9', 'H10'], t: 'libre', u: 2, fondo: 'Municipio' },
    { id: '3.10', c: '3', f: 5, o: 2, n: 'Construir el muelle en secas, antes de Semana Santa', p: 'Muelle de 32 m², informe fotográfico', r: R.obra, d: ['3.9'], t: 'secas', u: 6, fondo: 'Municipio' },
    { id: '3.11', c: '3', f: 5, o: 2, n: 'Colocar las cinco boyas con nivel de profundidad', p: 'Boyas colocadas, foto', r: R.obra, d: ['3.10'], t: 'secas', u: 1, fondo: 'Municipio' },
    { id: '3.12', c: '3', f: 5, o: 2, n: 'Estrenar el muelle en Semana Santa y contar visitantes por edades', p: 'Lista, fotos y conteo por edades', r: R.secr, d: ['3.11'], t: 'fija', x: 'SS', u: 1 },
    { id: '3.13', c: '3', f: 5, o: 3, n: 'Revisar muelle, boyas y señales tras la temporada de lluvias', p: 'Ficha de estado con fotos', r: R.vig, d: ['3.12'], t: 'post-lluvias', u: 1 },

    // 4 · Seguridad y limpieza
    { id: '4.1', c: '4', f: 5, o: 1, n: 'Gestionar con el Ayuntamiento la ruta de recolección de residuos', p: 'Oficio con respuesta', r: R.pres, d: ['2.2'], t: 'libre', u: 3, fondo: 'Municipio' },
    { id: '4.2', c: '4', f: 5, o: 1, n: 'Cotizar contenedores, fantasmas luminiscentes y lámparas solares (tres por rubro)', p: 'Tres cotizaciones por escrito', r: R.tes, d: ['2.2'], t: 'libre', u: 2 },
    { id: '4.3', c: '4', f: 5, o: 1, n: 'Colocar un contenedor metálico a prueba de fauna por sitio de estancia', p: 'Contenedores instalados y ruta de vaciado acordada', r: R.vig, d: ['4.1', '4.2'], t: 'secas', u: 2, fondo: 'Autogestión',
      nota: 'Modelo B del catálogo: café, con puerta frontal, uno por sitio y sin separación.' },
    { id: '4.4', c: '4', f: 5, o: 1, n: 'Instalar fantasmas luminiscentes en el bordo y el vertedor', p: 'Fantasmas instalados, foto de noche', r: R.obra, d: ['4.2'], t: 'secas', u: 1, fondo: 'Autogestión' },
    { id: '4.5', c: '4', f: 5, o: 1, n: 'Sembrar barreras vivas en las zonas con riesgo de caída', p: 'Barreras sembradas, foto', r: R.siem, d: ['G21', '1b.12'], t: 'siembra', u: 2, fondo: 'Autogestión' },
    { id: '4.6', c: '4', f: 5, o: 1, n: 'Trazar el estacionamiento: acceso por el camino derecho y autos frente a la barda blanca', p: 'Croquis con cajones y circulación', r: R.ss, d: ['H3'], t: 'libre', u: 2, min: [2027, 1, 2] },
    { id: '4.7', c: '4', f: 5, o: 1, n: 'Cerrar el camino anterior con una línea de magueyes', p: 'Línea de magueyes plantada, foto', r: R.siem, d: ['4.6', '4.5'], t: 'siembra', u: 1, fondo: 'Autogestión' },
    { id: '4.8', c: '4', f: 5, o: 1, n: 'Obtener el visto bueno municipal del estacionamiento y la luminaria', p: 'Oficio de visto bueno', r: R.pres, d: ['4.6', '2.2'], t: 'libre', u: 4 },
    { id: '4.9', c: '4', f: 5, o: 2, n: 'Construir el estacionamiento: nivelar, revestir y delimitar', p: 'Estacionamiento delimitado, foto', r: R.op, d: ['H10', 'H8'], t: 'secas', u: 3, fondo: 'Municipio' },
    { id: '4.10', c: '4', f: 5, o: 2, n: 'Hacer la cerca de troncos con portón manual sin cadena y paso peatonal fácil', p: 'Cerca y portón instalados, foto', r: R.obra, d: ['4.9'], t: 'secas', u: 3, fondo: 'Municipio' },
    { id: '4.11', c: '4', f: 5, o: 2, n: 'Colocar las cinco lámparas solares en las zonas más frecuentadas', p: 'Lámparas instaladas, foto de noche', r: R.op, d: ['H10', 'H8'], t: 'secas', u: 2, fondo: 'Municipio' },
    { id: '4.12', c: '4', f: 5, o: 2, n: 'Poner los letreros de estacionamiento con el emblema de la presa', p: 'Letreros instalados, foto', r: R.obra, d: ['4.9', '2.8'], t: 'libre', u: 1, fondo: 'Municipio' },
    { id: '4.13', c: '4', f: 5, o: 3, n: 'Revisar contenedores, luminaria y cerca tras las lluvias', p: 'Ficha de estado con fotos', r: R.vig, d: ['4.10', '4.11'], t: 'post-lluvias', u: 1 },

    // 5 · Convivencia
    { id: '5.1', c: '5', f: 5, o: 1, n: 'Preguntar a los vecinos, en la orilla, dónde quieren sombra, bancas y asadores', p: 'Mapa con sitios fuera de la ribera y arriba de la cota de crecida', r: R.ss, d: ['2.2'], t: 'libre', u: 1 },
    { id: '5.2', c: '5', f: 5, o: 1, n: 'Hacer el croquis y la ficha técnica de palapas, asadores, bancas y explanada', p: 'Croquis y ficha técnica', r: R.prof, d: ['5.1'], t: 'libre', u: 2 },
    { id: '5.4', c: '5', f: 5, o: 2, n: 'Conseguir troncos de poda, palma, tablones, alambre y herramienta', p: 'Notas de compra y oficios de donación', r: R.tes, d: ['H7', '5.2'], t: 'libre', u: 6, fondo: 'PROCODES', banda: false },
    { id: '5.5', c: '5', f: 5, o: 2, n: 'Construir en faena las tres palapas de 4 × 4 m con mesa, dos bancas y asador', p: 'Listas de asistencia y fotos georreferenciadas', r: R.obra, d: ['5.4', 'H8'], t: 'secas', u: 3, fondo: 'PROCODES' },
    { id: '5.6', c: '5', f: 5, o: 2, n: 'Colocar las diez bancas de la orilla junto a los árboles de sombra ya plantados', p: 'Fotos georreferenciadas de cada banca', r: R.obra, d: ['5.5', '1b.12'], t: 'secas', u: 2, fondo: 'PROCODES' },
    { id: '5.7', c: '5', f: 5, o: 2, n: 'Nivelar y limpiar la explanada de 200 m² sin quitar vegetación nativa', p: 'Fotos de antes y después desde punto fijo', r: R.obra, d: ['5.4', 'H8'], t: 'secas', u: 2, fondo: 'PROCODES' },
    { id: '5.8', c: '5', f: 5, o: 2, n: 'Entregar los espacios con acta, reglamento a la vista y calendario de revisión', p: 'Acta de entrega y foto del letrero', r: R.pres, d: ['5.5', '5.6', '5.7', '2.9'], t: 'libre', u: 1, fondo: 'PROCODES' },
    { id: 'H12', corto: 'Espacios entregados', c: 'G', f: 5, o: 2, n: 'Espacios de convivencia entregados', p: 'Acta de entrega', r: R.pres, d: ['5.8'], t: 'hito' },
    { id: '5.9', c: '5', f: 5, o: 3, n: 'Revisar el estado de las piezas tras la primera temporada de lluvias', p: 'Ficha de estado de las piezas', r: R.vig, d: ['5.8'], t: 'post-lluvias', u: 1 },

    // Cierre
    { id: 'H13', corto: 'Estreno de la ola 2', c: 'G', f: 5, o: 2, n: 'Estreno de la segunda ola en Semana Santa', p: 'Conteo de visitantes por edades', r: R.secr, d: ['H12', '4.10', '4.11', '4.12', '2.11'], t: 'hito', x: 'SS' },
    { id: 'G22', c: 'G', f: 5, n: 'Informe final a la asamblea ejidal y a los fondos', p: 'Informe con fotos de punto fijo y acta de lectura', r: R.pres, d: ['H13', 'G20'], t: 'libre', u: 2 },
    { id: 'H14', corto: 'Cierre', c: 'G', f: 5, n: 'Cierre del proyecto', p: 'Acta de cierre', r: R.pres, d: ['G22'], t: 'hito' }
  ];

  // Reglas de alerta del simulador
  const ALERTAS = [
    { tipo: 'antes', id: 'H5', ev: 'SS27', msg: 'Semana Santa 2027 llega sin reglamento aprobado.' },
    { tipo: 'antes', id: '2.9', ev: 'SS27', msg: 'Los letreros de reglas no están puestos para Semana Santa 2027.' },
    { tipo: 'antes', id: '4.3', ev: 'SS27', msg: 'Los contenedores no llegan a Semana Santa 2027.' },
    { tipo: 'antes', id: '3.5', ev: 'SS27', msg: 'Las tres rutas no quedan señaladas para Semana Santa 2027.' },
    { tipo: 'salto', id: 'G12', msg: 'La solicitud a PROCODES pierde la ventanilla de marzo y espera la del año siguiente.' },
    { tipo: 'salto', id: '5.5', msg: 'Palapas, bancas y explanada se recorren a las secas del año siguiente.' },
    { tipo: 'salto', id: '1b.11', msg: 'La siembra pierde las lluvias de 2027 y espera las del año siguiente.' },
    { tipo: 'salto', id: '1a.10', msg: 'Las estacas vivas pierden las primeras lluvias de 2027.' },
    { tipo: 'procodes', msg: 'Palapas, bancas y explanada rebasan el 31 de diciembre que exige PROCODES.' },
    { tipo: 'permiso150', msg: 'La autorización ambiental llega después de los 150 días que da PROCODES: el apoyo se cancela.' },
    { tipo: 'antes', id: '3.10', ev: 'SS28', msg: 'El muelle no está listo para Semana Santa 2028.' },
    { tipo: 'antes', id: '5.5', ev: 'SS28', msg: 'Las palapas no están listas para Semana Santa 2028.' },
    { tipo: 'salto', id: '3.10', msg: 'El muelle se recorre a las secas del año siguiente.' },
    { tipo: 'salto', id: '4.9', msg: 'El estacionamiento se recorre a las secas del año siguiente.' }
  ];

  const DATOS = { COMPONENTES, FASES, OLAS, FONDOS, EVENTOS, A, ALERTAS, R,
    titulo: 'Cronograma hipotético de la Presa de La Florida',
    subtitulo: 'Anteproyecto de habilitación de la orilla · octubre de 2026 a noviembre de 2028',
    hoy: [2026, 11, 11] };

  if (typeof module !== 'undefined' && module.exports) module.exports = DATOS;
  else raiz.DATOS = DATOS;
})(typeof window !== 'undefined' ? window : globalThis);
