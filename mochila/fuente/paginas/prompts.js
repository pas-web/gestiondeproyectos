/* Prompts y dibujos: árbol de problemas, árbol de objetivos, teoría del cambio y marco lógico.
   El prompt sigue la anatomía de la clase (contexto, encargo, formato y ejemplo) con reglas estrictas;
   la respuesta se pega, se audita con las pruebas de la clase y la hoja la dibuja. */
(function () {
  'use strict';
  var $ = M.$, esc = M.esc;
  var A = new M.Archivero('prompts');
  var banco = $('.banco');
  var s, memb;
  var B0 = '\u0001', B1 = '\u0002'; // marcas internas de bloque (no viajan en el texto copiado)

  /* ================= Las cuatro herramientas ================= */
  var HERR = {
    arbol: {
      nombre: 'Árbol de problemas', articulo: 'el árbol de problemas', corto: 'árbol de problemas', completo: 'completo',
      campos: [
        { k: 'efectos', l: 'Lo que se ve que pasa (los efectos)', t: 'area', ph: 'Ej. Las plantas se secan en abril; la gente ya no va a las faenas.', hueco: 'LOS EFECTOS QUE SE VEN' },
        { k: 'causas', l: 'Lo que creen que lo causa', t: 'area', ph: 'Ej. Nadie riega después de la faena; el ganado entra.', hueco: 'LO QUE CREEMOS QUE LO CAUSA' },
        { k: 'tarjetas', l: 'Frases textuales de la gente (las tarjetas de la consulta), una por renglón', t: 'area', ph: 'Como las dijeron, sin arreglarlas.', hueco: 'FRASES TEXTUALES DE LA CONSULTA' }
      ],
      necesita: function (d) {
        return 'LO QUE YA TENEMOS PARA EL ÁRBOL\n- Lo que se ve que pasa: ' + v(d.efectos, 'LOS EFECTOS QUE SE VEN') +
          '\n- Lo que creemos que lo causa: ' + v(d.causas, 'LO QUE CREEMOS QUE LO CAUSA') +
          '\n- Frases textuales de la gente:' + lista(d.tarjetas, 'FRASES TEXTUALES DE LA CONSULTA', true);
      },
      encargo: 'Arma el árbol de problemas del proyecto: un problema central (el tronco), sus causas (las raíces, que contestan «¿y eso por qué pasa?») y sus efectos (las ramas, que contestan «¿y eso qué provoca?»). Baja por cada causa preguntando por qué, dos o tres niveles, hasta llegar a causas que el grupo pueda cambiar.',
      reglas: [
        'El problema se escribe como lo que pasa, no como lo que falta. «Falta una palapa» es una solución disfrazada; «las familias no tienen dónde resguardarse del sol en la orilla» es un problema.',
        'Ninguna caja se puede cotizar. Si algo se puede comprar o construir, es una solución disfrazada: reescríbelo como lo que le pasa a la gente.',
        'Una idea por caja, sin «y» que junte dos problemas.',
        'Cada flecha se lee de abajo hacia arriba y suena derecha: «si [causa], entonces [lo de arriba]».',
        'El tronco, del tamaño justo: que quepa en lo que el grupo puede mover. Ni todo el municipio ni una sola tarjeta.',
        'Cada caja se apoya en algo que te escribí, de preferencia en una frase de la gente. Si no, márcala con (hipótesis) al final.'
      ],
      formato: 'Entrega primero el árbol en un solo bloque, entre las dos marcas, con estas etiquetas exactas y con la numeración que dice de quién cuelga cada caja (la 1.2 cuelga de la 1). Una caja por renglón:',
      bloque: '=== ÁRBOL DE PROBLEMAS ===\nPROBLEMA CENTRAL: ...\nEFECTO 1: ...\nEFECTO 1.1: ...\nCAUSA 1: ...\nCAUSA 1.1: ...\nCAUSA 1.2: ... (hipótesis)\n=== CIERRE ===',
      despues: 'Después del bloque, en no más de diez renglones: qué cajas marcaste como hipótesis y qué dato de campo las confirmaría, y cuál de las causas crees que el grupo sí puede mover.',
      ejemplo: '=== ÁRBOL DE PROBLEMAS ===\nPROBLEMA CENTRAL: Las milpas de ladera dan cada año menos maíz\nEFECTO 1: Las familias compran más maíz en la tienda\nEFECTO 2: Los jóvenes dejan de sembrar la ladera (hipótesis)\nCAUSA 1: El aguacero se lleva la tierra de la ladera\nCAUSA 1.1: Se siembra a favor de la pendiente\nCAUSA 1.2: El suelo queda desnudo después de la cosecha (hipótesis)\nCAUSA 2: Las semillas criollas se están perdiendo\n=== CIERRE ===',
      plantilla: '=== ÁRBOL DE PROBLEMAS ===\nPROBLEMA CENTRAL: \nEFECTO 1: \nEFECTO 2: \nCAUSA 1: \nCAUSA 1.1: \nCAUSA 2: \nCAUSA 2.1: \n=== CIERRE ===',
      auditoria: [
        { t: 'La tarjeta', d: 'Cada caja enseña su frase de la consulta, o va marcada como hipótesis.', falla: 'Prueba de la tarjeta: hay cajas que no se apoyan en ninguna frase de la gente y no están marcadas como hipótesis.' },
        { t: 'Si... entonces', d: 'Cada flecha se lee de abajo hacia arriba y suena derecha.', falla: 'Prueba del «si... entonces»: hay flechas que, leídas de abajo hacia arriba, no suenan derechas.' },
        { t: 'La cotización', d: 'Ninguna caja se puede cotizar.', falla: 'Prueba de la cotización: hay cajas que se pueden comprar o construir; son soluciones disfrazadas.' },
        { t: 'Una idea por caja', d: 'Sin «y» ni comas que junten dos problemas.', falla: 'Prueba de una idea por caja: hay cajas que juntan dos problemas.' },
        { t: 'El tamaño', d: 'El tronco cabe en lo que el grupo puede mover.', falla: 'Prueba del tamaño: el tronco es tan grande que el grupo no lo puede mover, o tan chico que es una sola tarjeta.' },
        { t: 'Nada inventado', d: 'No metió datos, cifras ni lugares que ustedes no le dijeron.', falla: 'Metiste datos que no te dimos: quítalos o márcalos como hipótesis.' }
      ]
    },
    objetivos: {
      nombre: 'Árbol de objetivos', articulo: 'el árbol de objetivos', corto: 'árbol de objetivos', completo: 'completo',
      campos: [
        { k: 'arbol', l: 'Su árbol de problemas, con el formato de la mochila', t: 'mono', ph: 'Pega aquí el bloque del árbol de problemas.', usar: [['arbol', 'Usar el árbol de problemas que dibujé']] },
        { k: 'alcance', l: 'Lo que el grupo sí puede mover (opcional)', t: 'texto', ph: 'Ej. El vivero y la asamblea, no el ganado.' }
      ],
      necesita: function (d) {
        return 'NUESTRO ÁRBOL DE PROBLEMAS\n' + (d.arbol ? B0 + d.arbol.trim() + B1 : '[[ PEGA AQUÍ EL ÁRBOL DE PROBLEMAS ]]') + (d.alcance ? '\n- Lo que el grupo sí puede mover: ' + d.alcance : '');
      },
      encargo: 'Voltea el árbol de problemas en un árbol de objetivos: cada caja negativa se reescribe como la situación positiva que se alcanzaría. El problema central se vuelve el objetivo central; las causas se vuelven medios; los efectos se vuelven fines.',
      reglas: [
        'Respeta la estructura y la numeración del árbol original: cada medio corresponde a su causa y cada fin a su efecto.',
        'Escribe situaciones alcanzadas, no actividades: «la ladera conserva su tierra», no «hacer terrazas».',
        'Si al voltear una caja queda algo imposible o fuera del alcance del grupo, márcala con (fuera de alcance) en lugar de forzarla.',
        'A los fines se les apuesta; no se prometen. No agregues cifras ni plazos que no estén en el árbol.',
        'No agregues cajas nuevas. Si una caja original era hipótesis, conserva la marca (hipótesis).'
      ],
      formato: 'Entrega primero el árbol volteado en un solo bloque, entre las dos marcas, con estas etiquetas exactas y la misma numeración del árbol de problemas. Una caja por renglón:',
      bloque: '=== ÁRBOL DE OBJETIVOS ===\nOBJETIVO CENTRAL: ...\nFIN 1: ...\nFIN 1.1: ...\nMEDIO 1: ...\nMEDIO 1.1: ...\nMEDIO 1.2: ... (fuera de alcance)\n=== CIERRE ===',
      despues: 'Después del bloque, en no más de ocho renglones: qué medios podría trabajar el grupo (de ahí salen las líneas del proyecto) y cuáles quedan fuera de su alcance.',
      ejemplo: '=== ÁRBOL DE OBJETIVOS ===\nOBJETIVO CENTRAL: Las milpas de ladera sostienen su rendimiento de maíz\nFIN 1: Las familias compran menos maíz en la tienda\nFIN 2: Los jóvenes siguen sembrando la ladera (hipótesis)\nMEDIO 1: La ladera conserva su tierra en el aguacero\nMEDIO 1.1: Se siembra en curvas a nivel\nMEDIO 1.2: El suelo queda cubierto después de la cosecha (hipótesis)\nMEDIO 2: Las semillas criollas se conservan en la comunidad (fuera de alcance)\n=== CIERRE ===',
      plantilla: '=== ÁRBOL DE OBJETIVOS ===\nOBJETIVO CENTRAL: \nFIN 1: \nFIN 2: \nMEDIO 1: \nMEDIO 1.1: \nMEDIO 2: \n=== CIERRE ===',
      auditoria: [
        { t: 'Cada caja con su par', d: 'Cada medio corresponde a una causa del árbol, y cada fin a un efecto.', falla: 'Hay medios o fines que no corresponden a ninguna caja del árbol de problemas.' },
        { t: 'Situaciones, no actividades', d: 'Dice lo que se alcanza, no lo que se hace.', falla: 'Hay cajas escritas como actividades («hacer», «impartir», «construir») y no como situaciones alcanzadas.' },
        { t: 'El alcance', d: 'Lo que el grupo no puede mover quedó marcado, no forzado.', falla: 'Hay medios fuera del alcance del grupo que no están marcados como (fuera de alcance).' },
        { t: 'Sin promesas', d: 'Los fines no traen cifras ni plazos inventados.', falla: 'Los fines prometen cifras o plazos que no estaban en el árbol.' },
        { t: 'Nada nuevo', d: 'No agregó cajas ni datos que no estaban.', falla: 'Agregaste cajas o datos que no estaban en el árbol de problemas.' }
      ]
    },
    cambio: {
      nombre: 'Teoría del cambio', articulo: 'la teoría del cambio', corto: 'teoría del cambio', completo: 'completa',
      campos: [
        { k: 'grande', l: 'El cambio grande que buscan, a largo plazo', t: 'texto', ph: 'Ej. Que los cerros del valle recuperen sombra y suelo.', hueco: 'EL CAMBIO GRANDE QUE BUSCAMOS' },
        { k: 'hacer', l: 'Lo que van a hacer', t: 'area', ph: 'Las actividades, en pocas palabras.', hueco: 'LO QUE VAMOS A HACER' },
        { k: 'entregar', l: 'Lo que van a entregar', t: 'area', ph: 'Lo que queda al terminar: plantas sembradas, un acta, un taller dado.', hueco: 'LO QUE VAMOS A ENTREGAR' },
        { k: 'quien', l: 'Quién tendría que hacer algo distinto para que lo entregado sirva', t: 'texto', ph: 'Un cargo o un rol, no un nombre.', hueco: 'QUIÉN TENDRÍA QUE HACER ALGO DISTINTO' },
        { k: 'objetivos', l: 'Su árbol de objetivos (opcional)', t: 'mono', ph: 'Si ya lo tienen, pégalo aquí.', usar: [['objetivos', 'Usar el árbol de objetivos que dibujé']] }
      ],
      necesita: function (d) {
        return 'LO QUE YA TENEMOS PARA LA TEORÍA DEL CAMBIO\n- El cambio grande que buscamos: ' + v(d.grande, 'EL CAMBIO GRANDE QUE BUSCAMOS') +
          '\n- Lo que vamos a hacer: ' + v(d.hacer, 'LO QUE VAMOS A HACER') +
          '\n- Lo que vamos a entregar: ' + v(d.entregar, 'LO QUE VAMOS A ENTREGAR') +
          '\n- Quién tendría que hacer algo distinto para que sirva: ' + v(d.quien, 'QUIÉN TENDRÍA QUE HACER ALGO DISTINTO') +
          (d.objetivos ? '\n- Nuestro árbol de objetivos:\n' + B0 + d.objetivos.trim() + B1 : '');
      },
      encargo: 'Arma la teoría del cambio del proyecto como una cadena de «si hacemos esto, entonces pasa esto otro, siempre que...». Sube por la escalera: lo que hacemos (actividades), lo que entregamos (productos), lo que la gente hace distinto (resultados) y el cambio grande y lento (impacto). Entre escalón y escalón escribe el «siempre que»: la condición que el equipo no controla y que tiene que cumplirse para que el siguiente escalón ocurra.',
      reglas: [
        'Entregar no es que lo usen: entre productos y resultados siempre hay alguien que tiene que hacer algo distinto. Escríbelo.',
        'Un «siempre que» es algo que el equipo no controla. Si depende del equipo, es chamba: va como actividad, no como supuesto.',
        'Señala el eslabón frágil: lo que alguien de fuera del proyecto tendría que hacer para que lo entregado sirva, y quién es (un cargo o un rol, no un nombre).',
        'De los productos responde el equipo completo; a los resultados y al impacto se les apuesta. No prometas el impacto.'
      ],
      formato: 'Entrega primero la cadena en un solo bloque, entre las dos marcas, con estas etiquetas exactas. Repite ACTIVIDAD, PRODUCTO o RESULTADO las veces que haga falta, uno por renglón. Cada SIEMPRE QUE va entre los dos escalones que une: el que va de productos a resultados se escribe después de los productos y antes de los resultados.',
      bloque: '=== TEORÍA DEL CAMBIO ===\nAPUESTA: Si [lo que hacemos], entonces [lo que cambia], siempre que [la condición clave].\nACTIVIDAD: ...\nSIEMPRE QUE: ...\nPRODUCTO: ...\nSIEMPRE QUE: ...\nRESULTADO: ...\nSIEMPRE QUE: ...\nIMPACTO: ...\nESLABÓN FRÁGIL: ...\nQUIÉN: ...\n=== CIERRE ===',
      despues: 'Después del bloque, en no más de ocho renglones: qué eslabón te parece más débil y qué tendría que pasar para apuntalarlo.',
      ejemplo: '=== TEORÍA DEL CAMBIO ===\nAPUESTA: Si sembramos encinos en faena con quien cuida el potrero, entonces el cerro recupera sombra, siempre que alguien los riegue en la primera seca.\nACTIVIDAD: Producir 200 encinos en el vivero de la escuela\nACTIVIDAD: Sembrarlos en faena, con las primeras lluvias\nSIEMPRE QUE: La delegación convoque la faena\nPRODUCTO: 200 encinos sembrados en cajete\nSIEMPRE QUE: Haya agua cerca del área sembrada\nRESULTADO: Los encinos sobreviven a la primera seca\nSIEMPRE QUE: El ganado no entra al área sembrada\nIMPACTO: El cerro recupera sombra, suelo y agua\nESLABÓN FRÁGIL: Que alguien riegue los encinos en la primera seca\nQUIÉN: El comité de la faena, con quien tiene ganado en el potrero\n=== CIERRE ===',
      plantilla: '=== TEORÍA DEL CAMBIO ===\nAPUESTA: Si , entonces , siempre que .\nACTIVIDAD: \nSIEMPRE QUE: \nPRODUCTO: \nSIEMPRE QUE: \nRESULTADO: \nSIEMPRE QUE: \nIMPACTO: \nESLABÓN FRÁGIL: \nQUIÉN: \n=== CIERRE ===',
      auditoria: [
        { t: 'Cada «entonces»', d: 'Leída en voz alta, la cadena suena derecha, sin brincos.', falla: 'Leída en voz alta, la cadena brinca: hay un «entonces» que no se sigue del escalón anterior.' },
        { t: 'Entregar no es que lo usen', d: 'Entre productos y resultados hay alguien que hace algo distinto.', falla: 'Entre productos y resultados no aparece quién tiene que hacer algo distinto: entregar no es que lo usen.' },
        { t: 'Supuesto o chamba', d: 'Ningún «siempre que» depende del equipo.', falla: 'Hay «siempre que» que dependen del equipo: son chamba y van como actividad.' },
        { t: 'El eslabón frágil', d: 'Dice qué tiene que pasar y quién lo hace, con un cargo o un rol.', falla: 'El eslabón frágil no dice quién lo hace, o lo dice con un nombre en lugar de un cargo o un rol.' },
        { t: 'Sin promesas', d: 'Al impacto se le apuesta: no se promete.', falla: 'El impacto se promete con cifras o plazos; al impacto se le apuesta.' },
        { t: 'Nada inventado', d: 'No metió actores, cifras ni datos que ustedes no le dijeron.', falla: 'Metiste actores, cifras o datos que no te dimos.' }
      ]
    },
    marco: {
      nombre: 'Marco lógico', articulo: 'el marco lógico', corto: 'marco lógico', completo: 'completo',
      campos: [
        { k: 'cadena', l: 'Su teoría del cambio o su árbol de objetivos', t: 'mono', ph: 'Pega aquí la cadena o el árbol.', usar: [['cambio', 'Usar la teoría del cambio que dibujé'], ['objetivos', 'Usar el árbol de objetivos']], hueco: 'PEGA AQUÍ LA TEORÍA DEL CAMBIO O EL ÁRBOL DE OBJETIVOS' },
        { k: 'base', l: 'Datos que ya tienen para la línea base', t: 'area', ph: 'Conteos, fechas y de dónde salen. Ej. 31 de 200 plantas vivas en el conteo de noviembre.', hueco: 'LOS DATOS DE LÍNEA BASE QUE YA TENEMOS' },
        { k: 'fondo', l: 'Para qué fondo o convocatoria es (opcional)', t: 'texto', ph: 'Ej. PROCODES, modalidad proyectos.' }
      ],
      necesita: function (d) {
        return 'LO QUE YA TENEMOS PARA EL MARCO\n- Nuestra cadena:\n' + (d.cadena ? B0 + d.cadena.trim() + B1 : '[[ PEGA AQUÍ LA TEORÍA DEL CAMBIO O EL ÁRBOL DE OBJETIVOS ]]') +
          '\n- Datos que ya tenemos para la línea base: ' + v(d.base, 'LOS DATOS DE LÍNEA BASE QUE YA TENEMOS') +
          (d.fondo ? '\n- Es para: ' + d.fondo : '');
      },
      encargo: 'Traduce la cadena a una matriz de marco lógico: cuatro niveles (fin, propósito, componentes y actividades) y cuatro columnas (resumen narrativo, indicadores, medios de verificación y supuestos).',
      reglas: [
        'Lógica vertical: si se hacen las actividades y se cumplen sus supuestos, se logran los componentes; si se logran los componentes y se cumplen sus supuestos, se logra el propósito; y de ahí, el fin. Cada salto tiene que sonar derecho leído en voz alta.',
        'Un solo propósito: el cambio al que el proyecto le apuesta, escrito como situación alcanzada.',
        'Indicadores que se pueden contar sin fe: qué se mide, cuánto y para cuándo, con su línea base (el antes). Si no te di el dato de la línea base, escribe «línea base por levantar» en lugar de inventarla.',
        'Medios de verificación concretos: una lista, un acta, una foto con fecha, un conteo firmado. «Encuesta», sola, no alcanza.',
        'Supuestos externos, escritos en positivo, que el equipo no controla. Lo que depende del equipo es actividad, no supuesto.'
      ],
      formato: 'Entrega la matriz como tabla en formato Markdown, con exactamente estas cinco columnas y un renglón por nivel: uno por cada componente y uno por cada actividad, numerados.',
      bloque: '| Nivel | Resumen narrativo | Indicadores | Medios de verificación | Supuestos |\n|---|---|---|---|---|\n| Fin | ... | ... | ... | ... |\n| Propósito | ... | ... | ... | ... |\n| Componente 1 | ... | ... | ... | ... |\n| Actividad 1.1 | ... | ... | ... | ... |',
      despues: 'Después de la tabla, en no más de ocho renglones: qué indicadores quedaron sin línea base y quién la levantaría.',
      ejemplo: '| Nivel | Resumen narrativo | Indicadores | Medios de verificación | Supuestos |\n|---|---|---|---|---|\n| Propósito | Los encinos sembrados en el cerro sobreviven a la primera seca | Al menos 150 de 200 encinos vivos en mayo de 2027 (línea base: 0 sembrados) | Conteo con fotos y fecha, firmado por el comité | La lluvia llega antes de julio |',
      plantilla: '| Nivel | Resumen narrativo | Indicadores | Medios de verificación | Supuestos |\n|---|---|---|---|---|\n| Fin |  |  |  |  |\n| Propósito |  |  |  |  |\n| Componente 1 |  |  |  |  |\n| Actividad 1.1 |  |  |  |  |\n| Actividad 1.2 |  |  |  |  |',
      auditoria: [
        { t: 'La lógica vertical', d: 'Leída de abajo hacia arriba, cada salto suena derecho.', falla: 'Leída de abajo hacia arriba, la lógica vertical brinca en algún salto.' },
        { t: 'Un solo propósito', d: 'Hay un propósito, escrito como situación alcanzada.', falla: 'Hay más de un propósito, o el propósito está escrito como actividad.' },
        { t: 'Indicadores sin fe', d: 'Cada indicador dice qué, cuánto y cuándo, con su línea base.', falla: 'Hay indicadores sin cantidad, sin fecha o sin línea base.' },
        { t: 'Papeles concretos', d: 'Los medios de verificación son documentos que se pueden enseñar.', falla: 'Hay medios de verificación vagos («encuesta», «registro»): di qué papel y de quién.' },
        { t: 'Supuestos de verdad', d: 'Van en positivo y no dependen del equipo.', falla: 'Hay supuestos en negativo o que dependen del equipo: los segundos son actividades.' },
        { t: 'Nada inventado', d: 'No inventó cifras, fechas ni líneas base.', falla: 'Inventaste cifras, fechas o líneas base que no te dimos: márcalas «por levantar».' }
      ]
    }
  };
  var COMUNES = [
    'No inventes datos del lugar ni de la gente: ni cifras, ni nombres, ni fechas. Usa solo lo que te escribí; lo que supongas, márcalo con (hipótesis).',
    'Si ves algo entre corchetes dobles, es un dato que todavía no tenemos: pregúntalo en lugar de inventarlo.',
    'Español llano, frases cortas, sin tecnicismos.'
  ];
  function v(x, hueco) { x = String(x || '').trim(); return x ? x : '[[ ' + hueco + ' ]]'; }
  function lista(x, hueco, comillas) {
    var l = String(x || '').split(/\r?\n/).map(function (y) { return y.trim(); }).filter(Boolean);
    if (!l.length) return ' [[ ' + hueco + ' ]]';
    return l.map(function (y) { return '\n  - ' + (comillas && !/^[«"“]/.test(y) ? '«' + y + '»' : y); }).join('');
  }

  /* ================= El prompt ================= */
  function armarPrompt() {
    var H = HERR[s.herramienta], p = s.proyecto, d = s.datos[s.herramienta] || {};
    var sec = [];
    sec.push({ p: 'contexto', n: 'Contexto', t: 'Eres un asesor con experiencia en formular proyectos de desarrollo rural y comunitario en México. Vas a ayudarme con ' + H.articulo + ' de un proyecto real. Trabaja solo con lo que te escribo aquí.\n\nCONTEXTO DEL PROYECTO\n' +
      '- Proyecto: ' + v(p.nombre, 'NOMBRE DEL PROYECTO') + '\n- Dónde: ' + v(p.lugar, 'COMUNIDAD, MUNICIPIO Y ESTADO') +
      '\n- Con quién y para quién: ' + v(p.gente, 'QUIÉN PARTICIPA Y A QUIÉN LE SIRVE') + '\n- El problema, en nuestras palabras: ' + v(p.problema, 'LO QUE PASA, NO LO QUE FALTA') +
      '\n- Lo que ya sabemos por el diagnóstico: ' + v(p.diagnostico, 'LO QUE SALIÓ DE LA CONSULTA, LA OBSERVACIÓN O LAS ENTREVISTAS') +
      (String(p.recursos || '').trim() ? '\n- Lo que ya tenemos: ' + p.recursos.trim() : '') + (String(p.limites || '').trim() ? '\n- Lo que hay que respetar: ' + p.limites.trim() : '') +
      '\n\n' + H.necesita(d) });
    if (s.preguntar) sec.push({ p: 'preguntas', n: 'Antes de empezar', t: 'ANTES DE EMPEZAR\nAntes de escribir nada, hazme las preguntas que necesites para hacerlo bien: máximo cinco, numeradas. Espera mis respuestas y después entrega el resultado con el formato de abajo.' });
    sec.push({ p: 'encargo', n: 'Encargo', t: 'ENCARGO\n' + H.encargo });
    sec.push({ p: 'reglas', n: 'Reglas estrictas', t: 'REGLAS ESTRICTAS\n' + H.reglas.concat(COMUNES).map(function (r, i) { return (i + 1) + '. ' + r; }).join('\n') });
    sec.push({ p: 'formato', n: 'Formato', t: 'FORMATO DE SALIDA\n' + H.formato + '\n' + B0 + H.bloque + B1 + '\n' + H.despues });
    sec.push({ p: 'ejemplo', n: 'Ejemplo', t: 'EJEMPLO DEL FORMATO (de otro proyecto; no lo copies)\n' + B0 + H.ejemplo + B1 });
    return sec;
  }
  function textoPlano(sec) { return sec.map(function (x) { return x.t.replace(/[\u0001\u0002]/g, ''); }).join('\n\n'); }
  function htmlPrompt(sec) {
    return sec.map(function (x) {
      var h = esc(x.t).replace(/\u0001([\s\S]*?)\u0002/g, function (m, b) { return '<span class="bloque">' + b + '</span>'; })
        .replace(/\[\[([^\]]*)\]\]/g, function (m) { return '<mark class="hueco">' + m + '</mark>'; });
      return '<section class="p-' + x.p + '"><div class="pieza">' + esc(x.n) + '</div><pre>' + h + '</pre></section>';
    }).join('');
  }

  /* ================= Leer lo que devuelve la IA ================= */
  function normal(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }
  function limpiar(l) { return String(l).replace(/\*\*|__|`/g, '').replace(/^\s*(?:[-*•·>]+\s*)+/, '').replace(/^#+\s*/, '').trim(); }
  function marcas(t) {
    var hip = /[(\[]\s*hip[oó]tesis\s*[)\]]/i.test(t), fuera = /[(\[]\s*fuera de alcance\s*[)\]]/i.test(t);
    return { t: t.replace(/[(\[]\s*hip[oó]tesis\s*[)\]]/ig, '').replace(/[(\[]\s*fuera de alcance\s*[)\]]/ig, '').replace(/\s+([.,;])/g, '$1').trim(), hip: hip, fuera: fuera };
  }
  function leerArbol(texto) {
    var t = { tronco: null, arriba: [], abajo: [], cajas: [] }, num = { arriba: {}, abajo: {} }, auto = { arriba: 0, abajo: 0 };
    String(texto || '').split(/\r?\n/).forEach(function (l0) {
      var l = limpiar(l0); if (!l || /^={2,}/.test(l)) return;
      var i = l.search(/[:：]/); if (i < 1) return;
      var cab = normal(l.slice(0, i)).replace(/[^A-Z0-9. ]/g, '').trim(), cuerpo = l.slice(i + 1).trim();
      var m = /^(PROBLEMA CENTRAL|OBJETIVO CENTRAL|PROBLEMA|OBJETIVO|EFECTOS?|CAUSAS?|FIN(?:ES)?|MEDIOS?)\s*((?:\d+\.?)*)$/.exec(cab);
      if (!m || !cuerpo) return;
      var x = marcas(cuerpo);
      if (/^(PROBLEMA|OBJETIVO)/.test(m[1])) { t.tronco = { texto: x.t, hip: x.hip }; return; }
      var lado = /^(EFECTO|FIN)/.test(m[1]) ? 'arriba' : 'abajo';
      var n = String(m[2] || '').replace(/\.$/, '');
      if (!n) n = String(++auto[lado]);
      var nodo = { num: n, texto: x.t, hip: x.hip, fuera: x.fuera, hijos: [] };
      var padre = n.indexOf('.') > 0 ? n.slice(0, n.lastIndexOf('.')) : '';
      if (padre && num[lado][padre]) num[lado][padre].hijos.push(nodo); else t[lado].push(nodo);
      num[lado][n] = nodo; t.cajas.push(nodo);
      var tope = parseInt(n, 10); if (tope > auto[lado]) auto[lado] = tope;
    });
    return t;
  }
  function leerCambio(texto) {
    var c = { apuesta: '', cols: [[], [], [], []], sq: [[], [], []], sueltos: [], fragil: '', quien: '' }, ult = -1;
    String(texto || '').split(/\r?\n/).forEach(function (l0) {
      var l = limpiar(l0); if (!l || /^={2,}/.test(l)) return;
      var i = l.search(/[:：]/); if (i < 1) return;
      var cab = normal(l.slice(0, i)).replace(/[^A-Z ]/g, '').trim(), cuerpo = l.slice(i + 1).trim();
      if (!cuerpo) return;
      var x = marcas(cuerpo);
      var col = /^ACTIVIDAD/.test(cab) ? 0 : /^PRODUCTO/.test(cab) ? 1 : /^RESULTADO/.test(cab) ? 2 : /^IMPACTO/.test(cab) ? 3 : -1;
      if (/^APUESTA/.test(cab)) c.apuesta = x.t;
      else if (col >= 0) { c.cols[col].push(x); ult = col; }
      else if (/^(SIEMPRE QUE|SUPUESTO)/.test(cab)) { var k = ult < 0 ? 0 : ult; if (k <= 2) c.sq[k].push(x); else c.sueltos.push(x); }
      else if (/^ESLABON/.test(cab)) c.fragil = x.t;
      else if (/^QUIEN/.test(cab)) c.quien = x.t;
    });
    return c;
  }
  function leerMarco(texto) {
    var filas = [];
    String(texto || '').split(/\r?\n/).forEach(function (l) {
      var t = l.trim(); if (t.indexOf('|') < 0) return;
      if (/^\|?\s*:?-{2,}/.test(t)) return;
      var celdas = t.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map(function (x) { return x.replace(/<br\s*\/?>/gi, '\n').replace(/\*\*|__/g, '').trim(); });
      if (celdas.length < 3) return;
      var n0 = normal(celdas[0]);
      var tipo = /^FIN/.test(n0) ? 'fin' : /^PROP/.test(n0) ? 'proposito' : /^(COMP|PROD)/.test(n0) ? 'componente' : /^ACT/.test(n0) ? 'actividad' : '';
      if (!tipo) return;
      filas.push({ tipo: tipo, nivel: celdas[0], resumen: celdas[1] || '', ind: celdas[2] || '', mv: celdas[3] || '', sup: celdas[4] || '' });
    });
    return filas;
  }

  /* ================= Los avisos automáticos ================= */
  function avisos(herr, texto) {
    var l = [];
    if (!String(texto || '').trim()) return l;
    if (herr === 'arbol' || herr === 'objetivos') {
      var t = leerArbol(texto), obj = herr === 'objetivos';
      if (!t.tronco) l.push({ c: 'mal', t: 'Sin tronco.', x: 'No encontré el renglón ' + (obj ? 'OBJETIVO CENTRAL' : 'PROBLEMA CENTRAL') + '. Revisa que la etiqueta esté igual que en el formato.' });
      var todas = (t.tronco ? [{ num: obj ? 'Objetivo central' : 'Problema central', texto: t.tronco.texto }] : []).concat(t.cajas);
      var nom = function (x) { return /^\d/.test(x.num) ? (obj ? (t.arriba.indexOf(x) >= 0 || buscar(t.arriba, x) ? 'Fin ' : 'Medio ') : (buscar(t.arriba, x) ? 'Efecto ' : 'Causa ')) + x.num : x.num; };
      if (!obj) {
        var falta = todas.filter(function (x) { return /^(falta|faltan|no hay|no existe|no existen|carece|carecen|ausencia|insuficiencia|escasez)\b/i.test(x.texto); });
        if (falta.length) l.push({ c: 'ojo', t: '¿Solución disfrazada?', x: falta.map(nom).join(', ') + ' empieza con «falta» o «no hay»: dice qué solución se quiere, no qué le pasa a la gente.' });
        var cotiza = todas.filter(function (x) { return /(constru|instala|compra|palapa|banca|asador|letrero|se[ñn]al[eé]tica|muelle|malla|cerca\b|ba[ñn]o|juegos|lancha|techad|tinaco|bomba)/i.test(x.texto); });
        if (cotiza.length) l.push({ c: 'ojo', t: '¿Se puede cotizar?', x: cotiza.map(nom).join(', ') + ' nombra algo que se compra o se construye.' });
      } else {
        var act = todas.filter(function (x) { return /^(hacer|construir|instalar|realizar|impartir|dar|capacitar|comprar|sembrar|elaborar|organizar|gestionar|crear|implementar|promover|fomentar)\b/i.test(x.texto); });
        if (act.length) l.push({ c: 'ojo', t: '¿Actividad en lugar de situación?', x: act.map(nom).join(', ') + ' empieza con un verbo de hacer. El árbol de objetivos dice lo que se alcanza.' });
        var neg = todas.filter(function (x) { return /\b(no hay|falta|faltan|no se )/i.test(x.texto); });
        if (neg.length) l.push({ c: 'ojo', t: '¿Quedó sin voltear?', x: neg.map(nom).join(', ') + ' sigue en negativo.' });
      }
      var dos = todas.filter(function (x) { return /\s(y|e)\s/i.test(x.texto) && x.texto.length > 45; });
      if (dos.length) l.push({ c: 'ojo', t: '¿Dos ideas en una caja?', x: dos.map(nom).join(', ') + ' trae una «y». Si junta dos problemas, se parte en dos cajas.' });
      var hip = t.cajas.filter(function (x) { return x.hip; });
      if (t.cajas.length >= 4 && !hip.length) l.push({ c: 'ojo', t: 'Ninguna hipótesis.', x: 'Ninguna caja está marcada como hipótesis. ¿De verdad todas tienen su frase de la consulta?' });
      else if (hip.length) l.push({ c: 'bien', t: hip.length + ' hipótesis a la vista.', x: 'Van con línea punteada. Confírmalas en campo antes de usarlas en una solicitud.' });
    } else if (herr === 'cambio') {
      var c = leerCambio(texto);
      if (!c.cols[2].length) l.push({ c: 'mal', t: 'Sin resultados.', x: 'Falta lo que la gente hace distinto (RESULTADO). Sin eso, la cadena salta de entregar a lo grande.' });
      var chamba = [].concat(c.sq[0], c.sq[1], c.sq[2]).filter(function (x) { return /(el equipo|nosotros|nuestro equipo|vamos a|haremos|realizaremos|el grupo (va|har))/i.test(x.t); });
      if (chamba.length) l.push({ c: 'ojo', t: '¿Chamba disfrazada de supuesto?', x: chamba.map(function (x) { return '«' + x.t + '»'; }).join(', ') + ' depende del equipo: va como actividad.' });
      var prod = c.cols[2].filter(function (x) { return /^(se entrega|se entregan|se instala|se instalan|se construye|se construyen|se siembra|se siembran|se imparte|se realiza|se realizan|se hace|se hacen|se elabora|entregar|instalar|construir|sembrar)/i.test(x.t); });
      if (prod.length) l.push({ c: 'ojo', t: '¿Producto en el lugar del resultado?', x: prod.map(function (x) { return '«' + x.t + '»'; }).join(', ') + '. Entregar no es que lo usen.' });
      if (!c.fragil) l.push({ c: 'mal', t: 'Sin eslabón frágil.', x: 'Falta el renglón ESLABÓN FRÁGIL.' });
      else if (!c.quien) l.push({ c: 'mal', t: 'El eslabón frágil no tiene quién.', x: 'Falta el renglón QUIÉN, con un cargo o un rol.' });
      var promesa = c.cols[3].filter(function (x) { return /\d/.test(x.t); });
      if (promesa.length) l.push({ c: 'ojo', t: '¿Se promete el impacto?', x: 'El impacto trae cifras. Al impacto se le apuesta: sin números ni plazos.' });
      if (!l.length) l.push({ c: 'bien', t: 'La cadena tiene sus cuatro escalones y su eslabón frágil.', x: '' });
    } else if (herr === 'marco') {
      var f = leerMarco(texto);
      if (!f.length) { l.push({ c: 'mal', t: 'No encontré la tabla.', x: 'Pídele a la IA que la entregue en formato Markdown, con las cinco columnas del formato.' }); return l; }
      var props = f.filter(function (x) { return x.tipo === 'proposito'; });
      if (props.length !== 1) l.push({ c: 'mal', t: props.length ? 'Más de un propósito.' : 'Sin propósito.', x: 'El marco lleva un solo propósito.' });
      var medibles = f.filter(function (x) { return x.tipo === 'proposito' || x.tipo === 'componente'; });
      var sinNum = medibles.filter(function (x) { return x.ind && !/\d/.test(x.ind) && !/por levantar/i.test(x.ind); });
      if (sinNum.length) l.push({ c: 'ojo', t: 'Indicadores sin número.', x: sinNum.map(function (x) { return x.nivel; }).join(', ') + ': ¿cuánto y para cuándo?' });
      var sinBase = medibles.filter(function (x) { return x.ind && !/(base|antes)/i.test(x.ind); });
      if (sinBase.length) l.push({ c: 'ojo', t: '¿Y el antes?', x: sinBase.map(function (x) { return x.nivel; }).join(', ') + ' no trae línea base.' });
      var vagos = f.filter(function (x) { return /^(encuestas?|registros?|informes?|fotos?|evidencias?)\.?$/i.test(x.mv.trim()); });
      if (vagos.length) l.push({ c: 'ojo', t: 'Medios de verificación vagos.', x: vagos.map(function (x) { return x.nivel; }).join(', ') + ': di qué papel y de quién.' });
      var negs = f.filter(function (x) { return /^(no |que no )/i.test(x.sup.trim()); });
      if (negs.length) l.push({ c: 'ojo', t: 'Supuestos en negativo.', x: negs.map(function (x) { return x.nivel; }).join(', ') + ': escríbelos en positivo.' });
      var chambas = f.filter(function (x) { return /(el equipo|nosotros|nuestro equipo|vamos a)/i.test(x.sup); });
      if (chambas.length) l.push({ c: 'ojo', t: '¿Chamba disfrazada de supuesto?', x: chambas.map(function (x) { return x.nivel; }).join(', ') + ' depende del equipo.' });
      if (!l.length) l.push({ c: 'bien', t: 'Sin fallas de columna de las típicas.', x: 'Ahora escucha la lógica vertical en voz alta.' });
    }
    return l;
  }
  function buscar(lista, x) { for (var i = 0; i < lista.length; i++) { if (lista[i] === x || buscar(lista[i].hijos || [], x)) return true; } return false; }

  /* ================= Dibujar ================= */
  var NS = 'http://www.w3.org/2000/svg';
  function dibujarArbol(marco, t, obj) {
    var intentos = [{ W: 150, TW: 280, X: 14, Y: 30, f: 1 }, { W: 128, TW: 250, X: 11, Y: 26, f: .94 }, { W: 108, TW: 220, X: 8, Y: 22, f: .88 }];
    var dispW = marco.clientWidth || 960, dispH = 470, r, k;
    var hoja = marco.closest('.hoja');
    if (hoja) {
      var escalaActual = hoja.getBoundingClientRect().height / (hoja.offsetHeight || 1) || 1;
      var arriba = (marco.getBoundingClientRect().top - hoja.getBoundingClientRect().top) / escalaActual;
      dispH = Math.max(260, 816 - 60 - arriba - 38);
    }
    for (var i = 0; i < intentos.length; i++) {
      r = componer(marco, t, obj, intentos[i]);
      k = Math.min(1, dispW / r.w, dispH / r.h);
      if (k >= 0.8 || i === intentos.length - 1) break;
    }
    if (k < 0.5) return false;
    r.lz.style.transform = 'scale(' + k + ')';
    r.lz.style.left = Math.max(0, (dispW - r.w * k) / 2) + 'px';
    marco.style.height = Math.ceil(r.h * k) + 'px';
    return true;
  }
  function componer(marco, t, obj, P) {
    marco.innerHTML = '';
    var lz = document.createElement('div'); lz.className = 'lienzo'; marco.appendChild(lz);
    function caja(texto, clase, ancho, rot, hip, fuera) {
      var d = document.createElement('div');
      d.className = 'caja ' + clase + (hip ? ' hip' : '') + (fuera ? ' fuera' : '');
      d.style.width = ancho + 'px';
      if (P.f !== 1) d.style.fontSize = (clase === 'tronco' ? 10.5 : 8.6) * P.f + 'pt';
      d.innerHTML = '<span class="rot-caja">' + esc(rot) + '</span>' + esc(texto) + (hip ? '<em>hipótesis</em>' : '') + (fuera ? '<em>fuera de alcance</em>' : '');
      lz.appendChild(d); return d;
    }
    var nArriba = obj ? 'Fin' : 'Efecto', nAbajo = obj ? 'Medio' : 'Causa';
    var tronco = caja(t.tronco ? t.tronco.texto : 'Falta el ' + (obj ? 'objetivo' : 'problema') + ' central', 'tronco', P.TW, obj ? 'Objetivo central' : 'Problema central', t.tronco && t.tronco.hip);
    (function crear(ns, clase, nombre) { ns.forEach(function w(nd) { nd.el = caja(nd.texto, clase, P.W, nombre + ' ' + nd.num, nd.hip, nd.fuera); (nd.hijos || []).forEach(w); }); })(t.arriba, 'efecto', nArriba);
    (function crear(ns, clase, nombre) { ns.forEach(function w(nd) { nd.el = caja(nd.texto, clase, P.W, nombre + ' ' + nd.num, nd.hip, nd.fuera); (nd.hijos || []).forEach(w); }); })(t.abajo, 'causa', nAbajo);
    function sw(nd) { var hs = nd.hijos || [], x = hs.reduce(function (a, h) { return a + sw(h); }, 0) + P.X * Math.max(0, hs.length - 1); nd.sw = Math.max(P.W, x); return nd.sw; }
    function anchoLado(ns) { return ns.length ? ns.reduce(function (a, nd) { return a + sw(nd); }, 0) + P.X * (ns.length - 1) : 0; }
    var wA = anchoLado(t.arriba), wB = anchoLado(t.abajo), W = Math.max(wA, wB, P.TW);
    function ponerX(ns, x0) {
      var x = x0;
      ns.forEach(function (nd) {
        nd.cx = x + nd.sw / 2;
        var hs = nd.hijos || [];
        if (hs.length) { var wh = hs.reduce(function (a, h) { return a + h.sw; }, 0) + P.X * (hs.length - 1); ponerX(hs, nd.cx - wh / 2); }
        x += nd.sw + P.X;
      });
    }
    ponerX(t.arriba, (W - wA) / 2); ponerX(t.abajo, (W - wB) / 2);
    function niveles(ns) { var L = []; (function w(arr, d) { arr.forEach(function (nd) { nd.d = d; nd.h = nd.el.offsetHeight; L[d] = Math.max(L[d] || 0, nd.h); w(nd.hijos || [], d + 1); }); })(ns, 0); return L; }
    var LA = niveles(t.arriba), LB = niveles(t.abajo);
    var hA = LA.reduce(function (a, h) { return a + h + P.Y; }, 0), hB = LB.reduce(function (a, h) { return a + h + P.Y; }, 0);
    var th = tronco.offsetHeight, trTop = hA, trBot = hA + th, H = trBot + hB;
    function yA(d) { var y = trTop - P.Y; for (var q = 0; q < d; q++) y -= LA[q] + P.Y; return y; }
    function yB(d) { var y = trBot + P.Y; for (var q = 0; q < d; q++) y += LB[q] + P.Y; return y; }
    tronco.style.left = (W - P.TW) / 2 + 'px'; tronco.style.top = trTop + 'px';
    (function poner(ns, arriba) { ns.forEach(function w(nd) { nd.top = arriba ? yA(nd.d) - nd.h : yB(nd.d); nd.el.style.left = (nd.cx - P.W / 2) + 'px'; nd.el.style.top = nd.top + 'px'; (nd.hijos || []).forEach(w); }); })(t.arriba, true);
    (function poner(ns, arriba) { ns.forEach(function w(nd) { nd.top = arriba ? yA(nd.d) - nd.h : yB(nd.d); nd.el.style.left = (nd.cx - P.W / 2) + 'px'; nd.el.style.top = nd.top + 'px'; (nd.hijos || []).forEach(w); }); })(t.abajo, false);
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'conectores'); svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var trazos = '', puntas = '', tcx = W / 2;
    function punta(x, y) { puntas += 'M' + (x - 3.6) + ' ' + (y + 6.5) + 'L' + x + ' ' + y + 'L' + (x + 3.6) + ' ' + (y + 6.5) + 'Z'; }
    (function abajo(ns, px, pBot, d) {
      ns.forEach(function (nd) {
        var mid = yB(nd.d) - P.Y / 2;
        trazos += 'M' + nd.cx + ' ' + nd.top + 'V' + mid + 'H' + px + 'V' + (pBot + 1);
        punta(px, pBot + 1);
        abajo(nd.hijos || [], nd.cx, nd.top + nd.h, d + 1);
      });
    })(t.abajo, tcx, trBot, 0);
    (function arriba(ns, px, pTop) {
      ns.forEach(function (nd) {
        var base = nd.top + nd.h, mid = yA(nd.d) + P.Y / 2;
        trazos += 'M' + px + ' ' + pTop + 'V' + mid + 'H' + nd.cx + 'V' + (base + 1);
        punta(nd.cx, base + 1);
        arriba(nd.hijos || [], nd.cx, nd.top);
      });
    })(t.arriba, tcx, trTop);
    svg.innerHTML = '<path d="' + trazos + '" fill="none" stroke="#7D8B8E" stroke-width="1"/><path d="' + puntas + '" fill="#5E6D70"/>';
    lz.insertBefore(svg, lz.firstChild);
    lz.style.width = W + 'px'; lz.style.height = H + 'px';
    return { lz: lz, w: W, h: H };
  }
  function htmlEsquema(t, obj) {
    function ul(ns) { return ns.length ? '<ul>' + ns.map(function (nd) { return '<li><b style="font-weight:600">' + esc(nd.num) + '</b> ' + esc(nd.texto) + (nd.hip ? ' <span style="color:var(--t-tenue)">(hipótesis)</span>' : '') + (nd.fuera ? ' <span style="color:var(--t-tenue)">(fuera de alcance)</span>' : '') + ul(nd.hijos || []) + '</li>'; }).join('') + '</ul>' : ''; }
    return '<div class="esquema"><div class="tronco-e">' + esc(t.tronco ? t.tronco.texto : 'Sin tronco') + '</div>' +
      '<h3>' + (obj ? 'Fines' : 'Efectos') + '</h3>' + (ul(t.arriba) || '<p>Sin ' + (obj ? 'fines' : 'efectos') + '.</p>') +
      '<h3>' + (obj ? 'Medios' : 'Causas') + '</h3>' + (ul(t.abajo) || '<p>Sin ' + (obj ? 'medios' : 'causas') + '.</p>') + '</div>';
  }
  function htmlCambio(c) {
    var cols = [['Lo que hacemos', 'Actividades', 'responde'], ['Lo que entregamos', 'Productos', 'responde'], ['Lo que la gente hace distinto', 'Resultados', 'apuesta-e'], ['El cambio grande y lento', 'Impacto', 'apuesta-e']];
    var h = c.apuesta ? '<div class="apuesta"><b>La apuesta.</b> ' + esc(c.apuesta) + '</div>' : '';
    h += '<div class="cadena">';
    cols.forEach(function (col, i) {
      h += '<div class="escalon ' + col[2] + '"><h4>' + col[0] + '<b>' + col[1] + '</b></h4>' +
        (c.cols[i].length ? c.cols[i].map(function (x) { return '<div class="caja-c' + (x.hip ? ' hip' : '') + '">' + esc(x.t) + '</div>'; }).join('') : '<div class="caja-c" style="color:var(--t-tenue)">Sin ' + col[1].toLowerCase() + '</div>') + '</div>';
      if (i < 3) h += '<div class="paso-c' + (i === 1 ? ' critico' : '') + '"><svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3 6H92M85 1.5L94 6L85 10.5" fill="none" stroke="#5E6D70" stroke-width="1.5"/></svg>' +
        c.sq[i].map(function (x) { return '<div class="sq"><b>siempre que</b>' + esc(x.t) + '</div>'; }).join('') + '</div>';
    });
    h += '</div><div class="tramos"><div class="t1">De esto responde el equipo, completo</div><div class="t2">A esto le apuesta el proyecto</div></div>';
    if (c.fragil || c.quien) h += '<div class="fragil"><p class="rot">El eslabón frágil</p><div>' + esc(c.fragil || 'Sin escribir') + '</div><p class="rot">Quién</p><div>' + esc(c.quien || 'Sin escribir') + '</div></div>';
    if (c.sueltos.length) h += '<p class="supuestos-sueltos"><b style="font-weight:600">Otros supuestos:</b> ' + c.sueltos.map(function (x) { return esc(x.t); }).join('; ') + '.</p>';
    return h;
  }
  function htmlMarco(f) {
    return '<table class="tabla marco-t"><colgroup><col style="width:1.05in"><col style="width:2.55in"><col style="width:2.35in"><col style="width:1.85in"><col></colgroup>' +
      '<thead><tr><th>Nivel</th><th>Resumen narrativo</th><th>Indicadores</th><th>Medios de verificación</th><th>Supuestos</th></tr></thead><tbody>' +
      f.map(function (x) { return '<tr class="n-' + x.tipo + '"><td class="nivel">' + esc(x.nivel) + '</td><td>' + M.escBr(x.resumen) + '</td><td>' + M.escBr(x.ind) + '</td><td>' + M.escBr(x.mv) + '</td><td>' + M.escBr(x.sup) + '</td></tr>'; }).join('') +
      '</tbody></table>';
  }

  /* ================= La hoja ================= */
  var pendienteArbol = null;
  function hojaDibujo() {
    var herr = s.herramienta, H = HERR[herr], m = memb, texto = s.respuestas[herr] || '', muestra = !String(texto).trim();
    if (muestra) texto = H.ejemplo;
    var der = '<div class="tipo">' + esc(H.nombre) + '</div><div class="folio">' + esc(M.fecha(M.hoyISO())) + '</div>';
    var p = s.proyecto;
    var cab = '<div style="margin-top:.12in">' + (muestra ? '<span class="marca-muestra">Muestra con el ejemplo del formato: así se verá lo tuyo</span>' : '') +
      '<h2 class="titulo-doc"' + (p.nombre ? '' : ' style="color:var(--t-tenue)"') + '>' + esc(p.nombre || 'Nombre del proyecto') + '</h2>' +
      (p.lugar || p.gente ? '<p class="bajada">' + esc([p.lugar, p.gente].filter(Boolean).join('. ')) + '.</p>' : '') + '</div>';
    var cuerpo = '', ley = '';
    pendienteArbol = null;
    if (herr === 'arbol' || herr === 'objetivos') {
      var t = leerArbol(texto), obj = herr === 'objetivos';
      pendienteArbol = { t: t, obj: obj };
      cuerpo = '<div class="lienzo-marco" id="lienzo-marco"></div>';
      ley = '<div class="ley-dibujo"><span><i style="border-color:#00899e;background:#EBF6F8"></i>' + (obj ? 'Fines: a lo que se contribuye' : 'Efectos: las ramas') + '</span>' +
        '<span><i style="border-color:#c46a1f;background:#FCF4EC"></i>' + (obj ? 'Medios: lo que se alcanza para llegar' : 'Causas: las raíces') + '</span>' +
        '<span><i style="border-color:#7D8B8E;border-style:dashed"></i>Hipótesis: falta su frase de la consulta</span>' +
        (obj ? '<span><i style="border-color:#c46a1f;opacity:.5"></i>Fuera del alcance del grupo</span>' : '') +
        '<span>Las flechas se leen de abajo hacia arriba: si pasa lo de abajo, entonces pasa lo de arriba.</span></div>';
    } else if (herr === 'cambio') {
      cuerpo = htmlCambio(leerCambio(texto));
      ley = '<div class="ley-dibujo"><span>La flecha roja marca el salto de entregar a que lo usen, donde casi siempre está el eslabón frágil.</span><span><i style="border-color:#7D8B8E;border-style:dashed"></i>Hipótesis</span></div>';
    } else {
      var f = leerMarco(texto);
      cuerpo = f.length ? htmlMarco(f) : '<div class="vacio-hoja">No encontré la tabla del marco lógico en lo que pegaste.</div>';
    }
    var declara = s.declarar && !muestra ? '<p class="declara">Elaborado con apoyo de inteligencia artificial y revisado por ' + esc(m.firmaNombre || m.nombre || 'el equipo') + '.</p>' : '';
    return M.hoja({ horizontal: true, compacta: true, acento: m.color, pieIzq: M.pieMembrete(m), pieDer: esc((p.nombre ? p.nombre + '. ' : '') + H.nombre) },
      M.encabezado(m, der) + cab + (herr === 'arbol' || herr === 'objetivos' ? ley + cuerpo : cuerpo + ley) + declara);
  }
  function pintarHojaYa() {
    $('#marco').innerHTML = hojaDibujo();
    if (pendienteArbol) {
      var lm = $('#lienzo-marco');
      if (lm && !dibujarArbol(lm, pendienteArbol.t, pendienteArbol.obj)) {
        lm.outerHTML = '<p class="bajada" style="margin-top:6pt">El árbol tiene demasiadas cajas para una hoja; aquí va como esquema.</p>' + htmlEsquema(pendienteArbol.t, pendienteArbol.obj);
      }
    }
    M.ajustarHoja();
    var texto = s.respuestas[s.herramienta] || '';
    $('#resumen-hoja').textContent = texto.trim() ? '' : 'Muestra: pega la respuesta en el paso 6.';
  }
  var pintarHoja = M.debounce(pintarHojaYa, 120);

  /* ================= El formulario ================= */
  function pintarCampos() {
    var H = HERR[s.herramienta], d = s.datos[s.herramienta];
    $('#titulo-necesita').textContent = 'Lo que necesita ' + H.articulo;
    $('#campos-herramienta').innerHTML = H.campos.map(function (cp) {
      var k = 'datos.' + s.herramienta + '.' + cp.k, id = 'c-' + s.herramienta + '-' + cp.k;
      var input = cp.t === 'texto' ? '<input id="' + id + '" type="text" data-k="' + k + '" placeholder="' + esc(cp.ph) + '">'
        : '<textarea id="' + id + '" data-k="' + k + '" rows="' + (cp.t === 'mono' ? 6 : 3) + '" placeholder="' + esc(cp.ph) + '"' + (cp.t === 'mono' ? ' class="respuesta" style="min-height:130px" spellcheck="false"' : '') + '></textarea>';
      var usar = (cp.usar || []).map(function (u) { return '<button type="button" class="btn-texto" data-usar="' + u[0] + '" data-en="' + k + '">' + esc(u[1]) + '</button>'; }).join(' ');
      return '<div class="campo"><label for="' + id + '">' + esc(cp.l) + '</label>' + input + (usar ? '<div>' + usar + '</div>' : '') + '</div>';
    }).join('');
    M.llenar($('#campos-herramienta'), s);
  }
  function pintarPrompt() {
    var sec = armarPrompt();
    $('#prompt-vista').innerHTML = htmlPrompt(sec);
    var t = textoPlano(sec), huecos = (t.match(/\[\[/g) || []).length;
    $('#contador').textContent = M.cifra(t.length, 0) + ' caracteres. ' + (huecos ? (huecos === 1 ? '1 dato pendiente entre corchetes dobles: la IA te lo va a preguntar.' : huecos + ' datos pendientes entre corchetes dobles: la IA te los va a preguntar.') : 'Sin datos pendientes.');
  }
  function pintarAuditoria() {
    var herr = s.herramienta, H = HERR[herr], a = s.auditoria[herr] || {};
    var av = avisos(herr, s.respuestas[herr]);
    $('#avisos').innerHTML = av.map(function (x) { return '<li class="' + x.c + '"><b>' + esc(x.t) + '</b>' + esc(x.x) + '</li>'; }).join('') +
      (av.length ? '<li class="ojo"><b>Estos avisos los da una regla sencilla.</b>Atrapan los errores típicos, no todos: que no marquen nada no quiere decir que esté bien.</li>' : '');
    $('#auditoria').innerHTML = H.auditoria.map(function (x, i) {
      var e = a[i];
      return '<li class="' + (e === 'falla' ? 'falla' : '') + '"><span><b>' + esc(x.t) + '.</b> ' + esc(x.d) + '</span><span class="dos-botones">' +
        '<button type="button" class="pasa" data-audita="' + i + '" data-v="pasa" aria-pressed="' + (e === 'pasa') + '">Pasa</button>' +
        '<button type="button" class="falla" data-audita="' + i + '" data-v="falla" aria-pressed="' + (e === 'falla') + '">Falla</button></span></li>';
    }).join('');
  }
  function textoVuelta() {
    var herr = s.herramienta, H = HERR[herr], a = s.auditoria[herr] || {}, vu = s.vuelta[herr] || {};
    var fallas = H.auditoria.map(function (x, i) { return a[i] === 'falla' ? x.falla : null; }).filter(Boolean);
    var enc = String(vu.encontraron || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
    var L = ['Revisamos tu ' + H.corto + ' con las pruebas de la clase y encontramos esto:'];
    fallas.concat(enc).forEach(function (x) { L.push('- ' + x); });
    if (!fallas.length && !enc.length) L.push('- [[ LO QUE ENCONTRARON, CON EL NÚMERO DE CAJA O DE RENGLÓN ]]');
    L.push('', 'Además, esto lo sabemos por haber estado ahí y tú no podías saberlo: ' + (String(vu.campo || '').trim() || '[[ LO QUE SABEN DEL LUGAR ]]'));
    L.push('', 'Corrige ' + H.articulo + ' ' + H.completo + ' con las mismas reglas estrictas del encargo original, sin cambiar lo que ya estaba bien, y devuélvelo en el mismo formato' + (herr === 'marco' ? ', como tabla en Markdown.' : ', entre las mismas marcas.'));
    return L.join('\n');
  }
  function pintarVuelta() {
    var vu = s.vuelta[s.herramienta] || {};
    M.$$('[data-vuelta]').forEach(function (el) { if (document.activeElement !== el) el.value = vu[el.dataset.vuelta] || ''; });
    $('#vuelta-vista').innerHTML = htmlPrompt([{ p: 'encargo', n: 'Segunda vuelta', t: textoVuelta() }]);
  }
  function pintarRespuesta() {
    var el = $('#respuesta'), herr = s.herramienta, texto = s.respuestas[herr] || '';
    if (document.activeElement !== el) el.value = texto;
    el.placeholder = 'Pega aquí el bloque que te devolvió la IA. Debe verse así:\n\n' + HERR[herr].bloque;
    var lec = $('#lectura');
    if (!texto.trim()) { lec.className = 'lectura'; lec.textContent = 'Todavía no hay respuesta. La hoja muestra el ejemplo del formato.'; return; }
    var msg = '', ok = true;
    if (herr === 'arbol' || herr === 'objetivos') {
      var t = leerArbol(texto), obj = herr === 'objetivos';
      var cuenta = function (ns) { var n = 0; (function w(a) { a.forEach(function (x) { n++; w(x.hijos || []); }); })(ns); return n; };
      ok = !!t.tronco && t.cajas.length > 0;
      msg = (t.tronco ? 'Se leyó el ' + (obj ? 'objetivo' : 'problema') + ' central, ' : 'Falta el ' + (obj ? 'objetivo' : 'problema') + ' central; ') + cuenta(t.abajo) + (obj ? ' medios y ' : ' causas y ') + cuenta(t.arriba) + (obj ? ' fines.' : ' efectos.');
    } else if (herr === 'cambio') {
      var c = leerCambio(texto);
      ok = c.cols.some(function (x) { return x.length; });
      msg = 'Se leyeron ' + c.cols[0].length + ' actividades, ' + c.cols[1].length + ' productos, ' + c.cols[2].length + ' resultados, ' + c.cols[3].length + ' impacto y ' + (c.sq[0].length + c.sq[1].length + c.sq[2].length + c.sueltos.length) + ' supuestos.';
    } else {
      var f = leerMarco(texto); ok = f.length > 0;
      msg = ok ? 'Se leyeron ' + f.length + ' renglones de la matriz.' : 'No encontré la tabla. Tiene que venir en Markdown, con los renglones empezando con «|».';
    }
    lec.className = 'lectura ' + (ok ? 'bien' : 'mal'); lec.textContent = msg;
  }
  function todoHerramienta() { pintarCampos(); pintarPrompt(); pintarRespuesta(); pintarAuditoria(); pintarVuelta(); pintarHoja(); }

  /* ================= Datos, guardar y abrir ================= */
  function nuevo() {
    return {
      id: M.uid(), tocado: false, creado: new Date().toISOString(),
      proyecto: { nombre: '', lugar: '', gente: '', problema: '', diagnostico: '', recursos: '', limites: '' },
      herramienta: 'arbol', preguntar: true, declarar: true,
      datos: { arbol: {}, objetivos: {}, cambio: {}, marco: {} },
      respuestas: { arbol: '', objetivos: '', cambio: '', marco: '' },
      auditoria: { arbol: {}, objetivos: {}, cambio: {}, marco: {} },
      vuelta: { arbol: {}, objetivos: {}, cambio: {}, marco: {} }
    };
  }
  function completar(d) {
    var b = nuevo(), x = M.copia(d || {});
    for (var k in x) { if (x[k] && typeof x[k] === 'object' && !Array.isArray(x[k]) && b[k] && typeof b[k] === 'object') { for (var j in x[k]) b[k][j] = x[k][j]; } else b[k] = x[k]; }
    ['arbol', 'objetivos', 'cambio', 'marco'].forEach(function (h) { ['datos', 'auditoria', 'vuelta'].forEach(function (z) { if (!b[z][h]) b[z][h] = {}; }); if (b.respuestas[h] == null) b.respuestas[h] = ''; });
    if (!HERR[b.herramienta]) b.herramienta = 'arbol';
    return b;
  }
  var guardarLuego = M.debounce(function () {
    if (!s.tocado) return;
    if (A.guardar(s)) { var d = new Date(); $('#estado').textContent = 'Guardado ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  }, 400);
  function abrir(d, mensaje, guardarYa) {
    if (s && s.tocado) A.guardar(s);
    s = completar(d);
    M.llenar(banco, s); todoHerramienta();
    $('#estado').textContent = s.tocado ? 'Guardado' : 'Se guarda solo al escribir';
    if (s.tocado) A.marcarActual(s.id);
    if (guardarYa) { s.tocado = true; guardarLuego(); }
    if (mensaje) M.aviso(mensaje);
  }

  M.escuchar(banco, function () { return s; }, function (k) {
    s.tocado = true;
    if (k === 'herramienta') { todoHerramienta(); guardarLuego(); return; }
    if (k === 'declarar') { pintarHoja(); guardarLuego(); return; }
    pintarPrompt(); if (/^proyecto\./.test(k)) pintarHoja();
    guardarLuego();
  });
  $('#respuesta').addEventListener('input', function () {
    s.tocado = true; s.respuestas[s.herramienta] = this.value;
    pintarRespuesta(); pintarAuditoria(); pintarHoja(); guardarLuego();
  });
  M.$$('[data-vuelta]').forEach(function (el) {
    el.addEventListener('input', function () { s.tocado = true; s.vuelta[s.herramienta][el.dataset.vuelta] = el.value; pintarVuelta(); guardarLuego(); });
  });
  banco.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-audita]'))) {
      var a = s.auditoria[s.herramienta], i = b.dataset.audita;
      a[i] = a[i] === b.dataset.v ? undefined : b.dataset.v; s.tocado = true;
      pintarAuditoria(); pintarVuelta(); guardarLuego(); return;
    }
    if ((b = e.target.closest('[data-usar]'))) {
      var origen = s.respuestas[b.dataset.usar] || '';
      if (!origen.trim()) { M.aviso('Todavía no hay ' + HERR[b.dataset.usar].articulo + ' dibujado. Hazlo primero en esa herramienta.', 'mal'); return; }
      M.ponerRuta(s, b.dataset.en, origen); s.tocado = true; M.llenar($('#campos-herramienta'), s); pintarPrompt(); guardarLuego();
      M.aviso('Listo: ' + HERR[b.dataset.usar].articulo + ' quedó dentro del prompt.');
    }
  });
  function copiarPrompt(abrirEn) {
    var t = textoPlano(armarPrompt());
    M.copiar(t).then(function (ok) {
      M.aviso(ok ? (abrirEn ? 'Prompt copiado. Pégalo en el chat que se abrió.' : 'Prompt copiado.') : 'No se pudo copiar solo: selecciona el texto y cópialo a mano.', ok ? '' : 'mal');
    });
    if (abrirEn) window.open(abrirEn, '_blank', 'noopener');
  }
  $('#copiar').onclick = function () { copiarPrompt(); };
  M.$$('[data-abrir]').forEach(function (b) { b.onclick = function () { copiarPrompt(b.dataset.abrir); }; });
  $('#txt').onclick = function () { M.descargar(M.slug('prompt-' + HERR[s.herramienta].corto + '-' + (s.proyecto.nombre || '')) + '.txt', textoPlano(armarPrompt()), 'text/plain;charset=utf-8'); };
  $('#copiar-vuelta').onclick = function () { M.copiar(textoVuelta()).then(function (ok) { M.aviso(ok ? 'Segunda vuelta copiada. Pégala en el mismo chat.' : 'No se pudo copiar solo: cópialo a mano.', ok ? '' : 'mal'); }); };
  $('#a-mano').onclick = function () {
    var el = $('#respuesta');
    if (el.value.trim() && !window.confirm('Ya hay algo escrito. ¿Lo cambio por el formato vacío?')) return;
    el.value = HERR[s.herramienta].plantilla; el.dispatchEvent(new Event('input')); el.focus();
  };
  $('#limpiar').onclick = function () {
    var el = $('#respuesta'); if (!el.value.trim()) return;
    if (!window.confirm('¿Borrar la respuesta pegada?')) return;
    el.value = ''; el.dispatchEvent(new Event('input'));
  };

  function describir(d) {
    var x = completar(d), hay = ['arbol', 'objetivos', 'cambio', 'marco'].filter(function (h) { return String(x.respuestas[h] || '').trim(); });
    return { t: x.proyecto.nombre || 'Proyecto sin nombre', v: hay.length + ' de 4', d: hay.length ? 'Con ' + hay.map(function (h) { return HERR[h].corto; }).join(', ') : 'Sin dibujos todavía' };
  }
  function ejemplo() {
    var d = nuevo(); d.tocado = true;
    d.proyecto = {
      nombre: 'Vivero escolar de especies nativas', lugar: 'Campus Concá, Arroyo Seco, Querétaro',
      gente: 'Familias de las comunidades del valle que reforestan en faena, con el grupo de 5.º semestre',
      problema: 'Las plantas que se reparten para reforestar se mueren antes de la primera seca.',
      diagnostico: 'En la faena de julio de 2026 se sembraron 200 encinos; en el conteo de noviembre quedaban 31 vivos. En la consulta, varias personas dijeron «nadie las riega después de la faena» y «las plantas vienen de fuera y se queman con el sol». Dos ejidatarios dijeron que el ganado entra a las áreas sembradas.',
      recursos: 'Un terreno de 60 m² en el campus, la toma de agua del campus y el grupo de 5.º semestre.',
      limites: 'No prometer plantas ni obras a ninguna comunidad antes de la asamblea.'
    };
    d.datos.arbol = { efectos: 'Se gasta dinero y trabajo en faenas que no dejan árboles. La gente ya no quiere ir a las faenas.', causas: 'Nadie riega después de la faena; el ganado entra; las plantas vienen de viveros de otro clima.', tarjetas: 'Nadie las riega después de la faena\nLas plantas vienen de fuera y se queman con el sol\nEl ganado entra y se las come' };
    d.respuestas.arbol = '=== ÁRBOL DE PROBLEMAS ===\nPROBLEMA CENTRAL: Las plantas que se siembran en las faenas del valle se mueren antes de la primera seca\nEFECTO 1: El trabajo de las faenas no deja árboles vivos\nEFECTO 1.1: La gente deja de ir a las faenas de reforestación (hipótesis)\nEFECTO 2: Los cerros siguen perdiendo suelo\nCAUSA 1: Las plantas vienen de viveros de otro clima, más húmedo que el valle\nCAUSA 1.1: Las plantas se eligen por precio, sin fijarse en la especie ni en el origen\nCAUSA 2: Nadie riega las plantas en la primera seca\nCAUSA 2.1: Después de la faena, nadie queda a cargo de las plantas\nCAUSA 2.2: Quienes cuidan el terreno no saben que la planta necesita riego el primer año (hipótesis)\nCAUSA 3: El ganado se come o pisa las plantas\nCAUSA 3.1: Las áreas sembradas quedan abiertas al paso del ganado\n=== CIERRE ===';
    d.datos.objetivos = { arbol: d.respuestas.arbol, alcance: 'El vivero y la asamblea; el ganado depende de los ganaderos.' };
    d.respuestas.objetivos = '=== ÁRBOL DE OBJETIVOS ===\nOBJETIVO CENTRAL: Las plantas que se siembran en las faenas del valle sobreviven a la primera seca\nFIN 1: El trabajo de las faenas deja árboles vivos\nFIN 1.1: La gente vuelve a las faenas de reforestación (hipótesis)\nFIN 2: Los cerros dejan de perder suelo\nMEDIO 1: Las plantas que se siembran vienen de un vivero con el clima del valle\nMEDIO 1.1: Las plantas se eligen por su origen, no solo por su precio\nMEDIO 2: Alguien riega las plantas en la primera seca\nMEDIO 2.1: Después de la faena, cada área sembrada tiene quien quede a cargo\nMEDIO 2.2: Quienes cuidan el terreno saben que la planta necesita riego el primer año (hipótesis)\nMEDIO 3: Las plantas quedan a salvo del ganado\nMEDIO 3.1: Las áreas sembradas se cercan con acuerdo de los ganaderos (fuera de alcance)\n=== CIERRE ===';
    d.datos.cambio = { grande: 'Que los cerros del valle recuperen sombra y suelo.', hacer: 'Producir plantas nativas en el vivero del campus; acordar en asamblea quién cuida cada área; sembrar en faena con las lluvias.', entregar: 'Plantas nativas sembradas en cajete y un acta con quien queda a cargo de cada área.', quien: 'Quien cuida cada área sembrada', objetivos: d.respuestas.objetivos };
    d.respuestas.cambio = '=== TEORÍA DEL CAMBIO ===\nAPUESTA: Si producimos plantas nativas del valle y dejamos cada área sembrada con alguien a cargo, entonces las plantas sobreviven a la primera seca, siempre que quien cuida el área tenga agua para regarlas.\nACTIVIDAD: Producir 1,500 plantas nativas en el vivero del campus\nACTIVIDAD: Acordar en asamblea quién recibe las plantas y quién cuida cada área\nACTIVIDAD: Sembrar en faena al inicio de las lluvias\nSIEMPRE QUE: La delegación convoque la faena al inicio de las lluvias\nPRODUCTO: 1,000 plantas nativas sembradas en cajete\nPRODUCTO: Un acta con quien queda a cargo de cada área\nSIEMPRE QUE: Quien cuida cada área tenga agua cerca para regar\nSIEMPRE QUE: Los ganaderos respeten el acuerdo de la asamblea\nRESULTADO: Quien cuida cada área riega las plantas en la primera seca\nRESULTADO: El ganado no entra a las áreas sembradas\nSIEMPRE QUE: Las lluvias del año siguiente lleguen a tiempo\nIMPACTO: Los cerros del valle recuperan sombra y suelo\nESLABÓN FRÁGIL: Que alguien riegue las plantas de marzo a mayo, cuando el grupo ya no está\nQUIÉN: Quien cuida cada área, según el acta de la asamblea\n=== CIERRE ===';
    d.datos.marco = { cadena: d.respuestas.cambio, base: 'En el conteo de noviembre de 2026 quedaban 31 de los 200 encinos sembrados en julio. Ninguna área sembrada tiene hoy quien la cuide.', fondo: '' };
    d.respuestas.marco = '| Nivel | Resumen narrativo | Indicadores | Medios de verificación | Supuestos |\n|---|---|---|---|---|\n| Fin | Los cerros del valle recuperan sombra y suelo | No se mide en este proyecto: se le apuesta | | Las lluvias de los próximos años llegan a tiempo |\n| Propósito | Las plantas sembradas en las faenas del valle sobreviven a la primera seca | Al menos 700 de 1,000 plantas vivas en junio de 2028 (línea base: 31 de 200 vivas en noviembre de 2026) | Conteo por área con fotos y fecha, firmado por quien la cuida | Quien cuida cada área tiene agua cerca para regar |\n| Componente 1 | Plantas nativas producidas en el vivero del campus | 1,500 plantas listas para sembrar en junio de 2027 (línea base: 0) | Bitácora del vivero y conteo con fotos | La toma del campus da agua todo el año |\n| Componente 2 | Cada área sembrada tiene quien quede a cargo | Acta firmada con una persona responsable para cada una de las 5 áreas, antes de la faena (línea base: 0 áreas con responsable) | Acta de la asamblea | La delegación convoca la asamblea en enero |\n| Actividad 1.1 | Conseguir semilla y esquejes de especies nativas | Semilla etiquetada de al menos cuatro especies en marzo de 2027 | Inventario con fotos | Hay semilla disponible en la temporada |\n| Actividad 1.2 | Llenar bolsas, sembrar y regar por turnos | 1,500 bolsas sembradas en abril de 2027 | Bitácora de riego firmada | El servicio de agua del campus es continuo en abril |\n| Actividad 2.1 | Acordar en asamblea quién cuida cada área | Una asamblea con acta en enero de 2027 | Acta y lista de asistencia | La comunidad acepta repartir las áreas |';
    d.preguntar = true;
    abrir(d, 'Se abrió un ejemplo con las cuatro herramientas. Cambia de herramienta en el paso 3 para ver cada dibujo.', true);
  }
  $('#ver-docs').onclick = function () {
    M.listaDocs({
      titulo: 'Mis proyectos', archivero: A, nuevoTexto: 'Nuevo proyecto', describir: describir,
      alNuevo: function () { abrir(nuevo(), 'Proyecto nuevo.'); },
      alAbrirArchivo: abrirArchivo, alEjemplo: ejemplo, alAbrir: function (d) { abrir(d); },
      alDuplicar: function (d) { var x = completar(d); x.id = M.uid(); x.proyecto.nombre = (x.proyecto.nombre || 'Proyecto') + ' (copia)'; abrir(x, 'Copia lista.', true); },
      alBorrar: function (id) { if (s.id === id) abrir(nuevo()); }
    });
  };
  function abrirArchivo() {
    M.abrirArchivo('prompts', function (datos) { var d = completar(datos); d.id = M.uid(); memb = M.membrete.leer(); vistaMembrete.recargar(); abrir(d, 'Se abrió «' + (d.proyecto.nombre || 'el proyecto') + '».', true); });
  }
  $('#nueva').onclick = function () { abrir(nuevo(), 'Proyecto nuevo.'); };
  $('#ejemplo').onclick = ejemplo;
  $('#pdf').onclick = M.imprimir; $('#pdf-movil').onclick = M.imprimir;
  $('#descargar').onclick = function () { s.tocado = true; guardarLuego(); M.descargarArchivo('prompts', 'proyecto-' + (s.proyecto.nombre || ''), s); };
  M.alImprimir(function () { return HERR[s.herramienta].nombre + ' ' + (s.proyecto.nombre || ''); }, pintarHojaYa);
  if (M.enNavegadorPrestado) $('#pista').textContent = 'Si al apretar «Guardar en PDF» no pasa nada, abre esta página en Chrome o en Safari: los navegadores que vienen dentro de WhatsApp o Facebook no saben imprimir.';

  memb = M.membrete.leer();
  var vistaMembrete = M.montarMembrete($('#membrete'), function (m) { memb = m; $('#res-membrete').textContent = m.nombre || 'Falta tu nombre'; pintarHoja(); });
  $('#res-membrete').textContent = memb.nombre || 'Falta tu nombre';
  if (!memb.nombre) $('#paso-membrete').open = true;
  var id = A.idActual(), guardado = id && A.obtener(id);
  abrir(guardado || nuevo());
  M.montarVista();
  window.addEventListener('pagehide', function () { if (s && s.tocado) A.guardar(s); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && s && s.tocado) A.guardar(s); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { pintarHojaYa(); });
})();
