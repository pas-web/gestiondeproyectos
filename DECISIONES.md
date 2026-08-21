# Decisiones · Gestión y Manejo de Proyectos (UAQ Campus Concá, ago-dic 2026)

Bitácora de las decisiones aprobadas del curso. Se lee al retomar el trabajo en
cualquier sesión y se actualiza al cerrar cada bloque de mejoras.

## Estado actual

- **Fase:** producción por goteo. El esqueleto de las 17 semanas, los 52 ejercicios
  y el sistema de evaluación ya existen y están publicados.
- **Último bloque cerrado:** bloque 9 (20 ago 2026): el primer no entra al
  cuadernillo y al suelo de la unidad 1, y el contrato de gestión se vuelve
  llenable en línea. Antes, bloque 8 (20 ago 2026): la evaluación de la unidad 1
  consolidada: el cuadernillo 1 se llena en línea y se descarga, el suelo y la
  autoevaluación quedan explicados, y los vacíos detectados se resolvieron (ver
  el bloque al final). Antes, bloque 7 (20 ago 2026): la semana 4 reconstruida como
  mazos de láminas; con ella la unidad 1 queda completa en el formato nuevo. Antes,
  bloque 6 (20 ago 2026): la semana 3 reconstruida como
  mazos de láminas y el mapa de fuentes por semana para producir el resto del
  semestre (ver el bloque al final de este archivo). Antes, bloque 5 (31 jul 2026): el guion de la entrevista a
  profesores sobre manejo y comprobación de recursos quedó como ejercicio de la
  Semana 0 en el gimnasio (`ejercicios/semana-00/`), enlazado desde la lámina
  "Para llevar al campo". El encuadre que da el estudiante habla solo de recabar
  experiencias, sin mencionar que el grupo manejará recursos. Antes, bloque 4
  (31 jul 2026): los dos pactos pasan a
  aceptación en línea, sin imprimir (regla 4 nueva); bloque 3
  (31 jul 2026): formato de mazos de láminas aprobado en la Semana 0 (sustituye
  al formato de día 2.0 como forma de la sesión), con modo presentación en
  `curso.js`, notas del conductor, tecla A para el apoyo y lámina de cierre con
  el QR del ticket; bloque 2 (28 jul 2026):
  formato de día 2.0, los dos pactos como documentos firmables y la hoja de
  retroalimentación de la materia; bloque 1 (28 jul 2026): menú de navegación,
  Semana 0 como semana real, página del gimnasio, detalle de sesiones de las
  semanas 0, 1 y 2, y reparto de contenido entre la Semana 0 y la 1.
- **Siguiente paso acordado:** producir el lote de la unidad 2 (semanas 5 a 10)
  con el mapa de fuentes del bloque 6. La semana 5 abre comentando la
  autoevaluación de ensayo que quedó de tarea del fin de semana de la S4.

## Dónde vive cada cosa

| Cosa | Dónde |
| --- | --- |
| Repositorio | `pas-web/gestiondeproyectos` (rama `main`) |
| Sitio publicado | https://pas-web.github.io/gestiondeproyectos/ |
| Datos del curso (semanas, unidades, recursos fijos) | `curso.js`, constantes al inicio |
| Páginas semanales | `semanas/semana-XX.html` (la 00 no lleva candado) |
| Ejercicios | `ejercicios/semana-XX/` y el índice en `gimnasio.html` |
| Evaluación | `tu-calificacion.html`, `evaluacion/` |
| Hoja de retroalimentación docente | Google Sheet "Retroalimentación · Gestión y Manejo de Proyectos 2026" en el Drive del profesor |

## Sistemas vivos

| Canal | Quién lo alimenta | Quién lo mira | Estado |
| --- | --- | --- | --- |
| Hoja de retroalimentación | El profesor, cuando le llegue la observación | El profesor, por bloques de filas | Activo desde jul 2026 |
| Ticket de salida | El grupo, cada viernes | El profesor, y se lee en voz alta el jueves siguiente | Pendiente de montar el formulario |
| Vitrina de lo producido | El grupo, con el profesor como filtro | Todos, en la sección "Lo que produjimos" de cada semana | Sin montar |

## Calendario

- **18 semanas de clase: del jueves 30 de julio al viernes 27 de noviembre de 2026.**
  Sesiones de dos horas los jueves y dos horas los viernes.
- La Semana 0 (aterrizaje) se suma por delante. Las 17 semanas de contenido
  conservan sus fechas originales, de la apertura del 5 de agosto a la del 25 de
  noviembre: ningún candado se movió.
- Sin choques con días feriados. El 16 de septiembre cae miércoles y los feriados
  de noviembre caen lunes, así que ningún jueves ni viernes se pierde.
- La Semana 0 no lleva candado: es también el programa del curso y queda abierta
  todo el semestre.

## Reparto entre la Semana 0 y la Semana 1

La Semana 0 se lleva el gancho y lo administrativo: el encargo contado como
historia, el chapuzón de malabares, el fondo nombrado sin rodeos, la evaluación
explicada a fondo con espacio para objeciones, la firma de los dos pactos y el
armado del expediente. La Semana 1 queda liberada para el oficio: manejo contra
gestión, las dos listas de la presa, el ciclo del proyecto por capas, las
hipótesis sobre las reglas del fondo y el sobre sellado.

Razón: con los pactos dentro, la Semana 1 cargaba siete cosas en cuatro horas y
la evaluación quedaba explicada de prisa. Un sistema de evaluación que no se pudo
discutir el primer día se cobra caro en noviembre.

## Reglas de producción

1. **Voz del sitio.** Tutea al estudiante, seca y cálida a la vez. Sin raya larga,
   sin entusiasmo hueco.
2. **La página semanal conduce la clase: cada día es un mazo de láminas.** La
   página es el medio con el que el profesor guía la sesión proyectada, no un
   texto que narra al lector. Una idea por lámina (`.lam`), con el elemento visual
   como protagonista y la frase grande (`.di`) como lo que se proyecta; debajo, un
   texto de apoyo breve (`.apoyo`) que conserva la sustancia para quien repasa.
   El lenguaje no narra ("recorremos juntos..."): afirma, pregunta al aire o
   instruye, con señales visibles (`.senal`: Actividad, Al aire, Se abre el piso,
   En parejas, Para llevar al campo). Cada bloque del plan de sesión abre su
   lámina con numeral en arena y chapa de minutos; las láminas intermedias van sin
   numeral. El botón **Presentar** de cada mazo abre el telón (todo en `curso.js`):
   pantalla completa, flechas o clicker para avanzar, tecla A oculta el apoyo,
   tecla N muestra las notas del conductor (`.nota-conductor`, invisibles fuera
   del telón), Esc sale. Un mazo con `data-ticket` cierra con la lámina del QR del
   ticket de salida. La tabla minuto a minuto sigue prohibida como forma principal.
   Estándar de referencia: `semanas/semana-00.html`.
3. **El contraste se hace con tipografía, no con emojis.** El énfasis viaja en el
   tamaño, el peso, el color y la caja. La firma visual del sitio es la **pieza en
   caja** (`.piezas` con `.pz`), tomada de la ficha de disección de Etimologías: el
   término clave en monoespaciada grande, su glosa en versalitas debajo y el
   `= resultado` en Georgia. A eso se suman el numeral de bloque (`.n`), el término
   inline `.tt` y los recortes de color `.pasa`, `.ojo`, `.dato`, `.cita`, `.llave`,
   `.flujo`, `.contra` y `table.veredicto`, todos definidos en `curso.js`.
   **Los emojis se quedan en su lugar ritual: uno por página como máximo**, el del
   chapuzón al cierre. Nada de emoji decorativo en encabezados, listas, viñetas de
   callout ni celdas de tabla: si algo necesita señal, se le da color y peso.
4. **Los pactos se aceptan en línea, sin imprimir nada.** Cada pacto es una página
   en `evaluacion/` con las dos columnas de compromisos y, al final, un bloque de
   aceptación (`.acepta-pacto`, montado por `curso.js`): el estudiante escribe su
   nombre completo, marca que leyó y está de acuerdo, y descarga una constancia
   (archivo HTML chiquito con nombre, fecha y, en el de evaluación, su objeción).
   El registro vive en el navegador del estudiante (localStorage) y en su
   constancia; no viaja a ningún servidor ni le llega al profesor. La columna del
   profesor queda comprometida por estar publicada en la página. Desde los bloques 8 y 9, el
   expediente y el contrato de gestión también se llenan en línea (localStorage
   + descarga, mecanismo del cuadernillo digital); el papel sigue valiendo.
5. **El candado de goteo es pedagógico, no de seguridad.** Cada semana abre el
   miércoles anterior a sus sesiones. `?preview` en la URL lo salta, para el profesor.
6. **Los ejercicios son autocontenidos.** Un HTML por ejercicio, sin dependencias
   externas, para que abran sin internet y se compartan por WhatsApp. Por eso el
   `curso.js` del menú NO se inyecta en `ejercicios/`.
7. **Un solo lugar por dato.** Las semanas, unidades y recursos fijos viven en las
   constantes de `curso.js`. Cambiar ahí actualiza portada y menú de golpe.
8. **Ningún dato de estudiante al repositorio.** Nombres, calificaciones y
   seguimiento viven solo en herramientas locales del profesor.
9. **Ningún trabajo lleva número durante el semestre.** El acta se acuerda al final,
   con el expediente en la mesa.
10. **Credenciales fuera del repositorio y fuera del chat.** Si se usa un token de
   GitHub para publicar, se revoca al terminar la sesión.

## Protocolo de la hoja de retroalimentación

Las observaciones se anotan cuando llegan, sin filtrar, una por fila. Se procesan
**por bloques de filas, no fila por fila**: se dice "vamos con las filas 6 a 15" y
ese bloque se trabaja completo hasta cerrarlo. Cada bloque termina en cuatro cosas:

1. Los cambios aplicados a los materiales.
2. La lista de commits.
3. Las reglas nuevas anotadas en este archivo.
4. La pregunta explícita de si alguna de esas reglas aplica a *todos* los cursos y
   no solo a este.

Columnas de la hoja (archivo `Retroalimentacion_GestionDeProyectos.xlsx`, mismo
formato que el de Etimologías): `Semana`, `Elemento`, `Observación`,
`Ideas adicionales`, `Prioridad`, `Estado`, `Fecha captura`, `Respuesta de Claude`.
El desplegable de `Elemento` trae: Plan de sesión, Página semanal, Ejercicio del
gimnasio, Expediente, Pactos y evaluación, Salida de campo, El fondo, Sitio general
y Otro. Las columnas A a G las llena el profesor; la H se pega desde el chat.

Estados: `Pendiente` (anotada, sin tocar), `En bloque` (se está trabajando),
`Aplicado` (el cambio está publicado), `Descartado` (se decidió no hacerlo, con la
razón en la última columna) y `Regla permanente` (se vuelve regla para todas las
semanas futuras y se registra en este archivo).

## Bloque de retroalimentación del 29 de julio de 2026 (filas 2 a 7 de la hoja)

Reglas nuevas que salen de este bloque y que aplican de aquí en adelante:

- **El fondo es capital semilla, no el presupuesto.** Son $10,000, no $20,000, y se
  nombran como contrapartida: el dinero que se pone para ir a buscar el resto. Se
  menciona donde haga falta y no más; deja de ser el gancho del curso. En la
  evaluación no se menciona.
- **La pregunta ancla del curso no lleva monto.** Quedó "¿Qué harías con un dinero
  que no es tuyo?", en `curso.js`, el gimnasio, la semana 0 y la semana 1. Si el
  monto vuelve a cambiar, la pregunta no se toca.
- **El home desarrolla el curso, no explica el sitio.** La portada argumenta para
  qué sirve la materia y qué se sale sabiendo hacer, con la profundidad del inicio
  de Etimologías. La mecánica del sitio (cuándo se abre una semana, qué pasa cada
  día, que el gimnasio no cierra) se sacó de la portada: eso vive en la Semana 0.
- **Barra de navegación persistente.** Todas las páginas que cargan `curso.js`
  llevan arriba una barra fija con Inicio, Programa, Gimnasio, Expediente y Tu
  calificación, más el botón de las semanas. Sustituye al botón flotante. Los
  ejercicios del gimnasio siguen sin cargar el script, así que no la llevan.
- **El expediente va por cuadernillos, uno por unidad.** Cuatro archivos
  (`evaluacion/expediente-uN.html`), cada uno con portadilla, sus hojas de trabajo,
  el suelo de esa unidad y su autoevaluación. `expediente-del-gestor.html` quedó
  como índice que los reparte. No se imprime todo en agosto: se imprime el que
  empieza. Las hojas transversales (anti-currículum, solicitudes reales, mapa de
  evidencias) se pasan al cuadernillo en curso.
- **Las láminas del home van rotuladas y en formato webp.** Se guardan en
  `assets/img/`, dentro de un `figure.lamina` con texto alternativo descriptivo y
  pie en dos niveles (la idea, y abajo una nota más chica). La primera es
  `plan-y-realidad.webp`, que enmarca el semestre: el plan es una recta, la
  realidad sube dando tumbos y termina a la misma altura. Se conserva la versión
  sin rótulos por si se quiere proyectar limpia.
- **No hay ningún compromiso sobre los tickets de salida.** Se quitó del pacto de
  evaluación, de la Semana 0 y del plan de sesión de la Semana 1. El ticket sigue
  existiendo como instrumento y se justifica solo (le sirve al estudiante para caer
  en cuenta de qué entendió, y al curso para saber por dónde va el grupo), pero el
  profesor no promete leerlos ni devolverlos.

### Reglas transversales a todos los cursos de Eduardo

Estas dos dejan de ser de esta materia y aplican a cualquier curso que se arme de
aquí en adelante. Al diseñar otra materia, se dan por puestas.

- **La portada de un curso argumenta la materia, no explica el sitio.** Para qué
  sirve lo que se va a aprender y qué se sale sabiendo hacer, con ejemplos y con
  la profundidad del inicio de Etimologías. La mecánica (cuándo abre una semana,
  qué pasa cada día, qué está siempre disponible) vive en la semana de aterrizaje.
- **El expediente o portafolio se imprime por unidad**, un cuadernillo a la vez
  conforme avanza el semestre, nunca completo al inicio. Cada cuadernillo lleva
  portadilla, sus hojas de trabajo, el suelo de esa unidad y su autoevaluación.
- **La declaración de IA entrega el prompt** (cuatro datos: herramienta, para
  qué, qué cambió la persona, prompt transcrito o anexo), porque hay un oficio
  detrás de un buen prompt y se revisa en clase. Vale para cualquier curso con
  pacto de IA. Confirmada el 30 de julio de 2026.

## Bloques de retroalimentación del 29 y 30 de julio de 2026 (filas 8 a 30)

- **La voz de los materiales renuncia al remate** y deja huecos para discutir.
  Subió a reglas transversales. La Semana 0 completa ya pasó por ella: fuera
  aforismos de cierre, antítesis con dos puntos en serie y anuncios de guion.
- **No se anuncia lo que no se hará** ("nada de X hoy", "lo administrativo es
  mañana"): se presenta solo lo que sí pasa. Vale para páginas y para los planes
  de sesión.
- **El ciclo del semestre se dice en seis verbos**: se escucha (S1-4), se diseña
  (S5-8), se consigue (S9-11), se hace (S12-14), se mide (S15), se cuenta
  (S16-17). Está dibujado en el bloque "A dónde vamos" de la Semana 0.
- **El fondo es capital semilla de $10,000 y opera como palanca.** La
  ministración se condiciona a contrapartida gestionada, en faenas o en monto
  (cláusula 5.6 nueva). Sin tope fijo por componente: mínimo $2,000 y el
  dictamen reparte por orden de calificación hasta agotar la Bolsa (cláusula
  5.2). Reglas del fondo y Anexo 1 actualizados en la carpeta local; la condición
  se anuncia desde la Semana 0, sección 4 del jueves.
- **La declaración de IA pide el prompt**: cuatro datos en lugar de tres
  (herramienta, para qué, qué cambiaste, prompt transcrito o anexo), porque hay
  un oficio detrás de un buen prompt y se revisa en clase. Cambiado en el pacto
  (ambas copias) y en la Semana 0.
- **La familia del marco lógico quedó completa**: árbol de problemas (S5), árbol
  de objetivos (S7), cadena nombrada también teoría del cambio (S7-S8) y marco
  (S8). El PROCODES 2026 entra con tres cláusulas textuales en La letra chiquita
  (S5) y la sesión "El donante también es actor" (S9); el plan de palanca vive en
  S9, el presupuesto a dos columnas en S10 y los asientos en especie en S12 y S16.

## Pendientes

- Confirmar los temas vivos de La Florida con la autoridad local antes de la
  consulta del viernes 28 de agosto (lo pide la lámina 4 del viernes de la S3).
- Decidir el canal definitivo de la autoevaluación transcrita: hoy el botón del
  cuadernillo arma un correo a eduardo.lusan@gmail.com con asunto uniforme
  «Autoevaluación U1 · Nombre» (mismo camino que el vaciado de la entrevista);
  si Eduardo prefiere Google Form, se cambia el botón.
- Al producir los cuadernillos 2 a 4, darles el mismo llenado en línea
  (data-cuadernillo + data-exp, ya genérico en curso.js) y resolver ahí las
  hojas transversales: el anti-currículum vive en el cuadernillo 3 pero se
  estrena en la S2, y la hoja de solicitudes reales aún no existe en ninguno.
- Ilustraciones a tinta de la semana 3, cuando Eduardo las entregue. Candidatas:
  la promesa de contrabando, el mosaico de la comunidad, la pared del parque de
  perros.
- Menú de navegación tipo Etimologías en la portada (fila 2 de la hoja).
- Integrar la imagen del home cuando Eduardo la entregue (fila 7).
- Reimprimir las reglas del fondo y el Anexo 1 para la semana 5: cambiaron la
  Bolsa, el tope y la cláusula de palanca.
- Producir los días de las semanas 5 a 17 en el formato nuevo, en lotes por
  unidad, siguiendo el mapa de fuentes del bloque 6.
- Ilustraciones a tinta de la semana 4, cuando Eduardo las entregue. Candidatas:
  los vecinos difíciles del ensayo, el pliego a media consulta, el sobre abierto
  junto al agua.
- Revisar si la semana 2 necesita ajuste ahora que la campana del no y el contrato
  de gestión ya no compiten con los pactos.
- Definir si la vitrina de lo producido arranca este semestre o no.
- Llenar las secciones "Lo que produjimos" conforme avance el curso.

## Bloque 6 (20 de agosto de 2026): la semana 3 y el mapa de fuentes del semestre

La semana 3 (Diseñar la consulta) quedó reconstruida como mazos de láminas:
jueves "El oficio de preguntar" (Acción sin Daño, mensajes implícitos, la regla
de no prometer, la entrevista apreciativa, gimnasios 1 y 2) y viernes "El diseño
fino de la consulta" (la lista nombrada, el pliego de quién falta, los temas
vivos, las tres estaciones, roles y registro, gimnasio 3). Los tres ejercicios
del gimnasio ya existían y no se tocaron.

### Las dos fuentes que alimentan la producción de aquí en adelante

1. **El banco de patrones de espacio público** (skill `espacio-publico`, 150
   fichas de seis libros y el corpus de PPS, hecho para la presa de Arroyo
   Seco). El eje I (participación y consulta) alimentó la S3 y alimenta la S4.
2. **«Acción sin Daño como aporte a la Construcción de Paz»** (Universidad
   Nacional de Colombia / Synergia / COSUDE / GIZ / PNUD, 2011). Cinco etapas
   metodológicas y 18 herramientas. Es la adaptación colombiana del Do No Harm
   de Mary Anderson y le da columna ética al curso: entra por primera vez en la
   S3 y reaparece por herramientas en las semanas siguientes.

**Regla de producción nueva:** en las páginas del curso las fuentes se citan con
narrativa (nombres, casos, años), nunca con ID de ficha ni sigla de herramienta.
Los ID quedan en esta bitácora para poder rastrear.

### Mapa de fuentes por semana (se consulta al producir cada lote)

| Semana | Fuente principal |
| --- | --- |
| S4 · La consulta y el sobre | Pilotear la hoja y el ensayo (PPS-15: "cuando hay respuestas malas, la culpa es de la hoja"); el pliego de quién falta operando en campo (THO-03 + PIP3-02); la apertura honesta (KIC-11: invitado, no experto). |
| S5 · Líneas y reglas del fondo | Herramienta 5 del manual (matriz de contexto: hechos, oportunidades, riesgos, actores) para leer las reglas del fondo como contexto y no como trámite. |
| S6 · Prototipo en la presa | La temporada de prueba ligera, rápida y barata (KIC-21 + PIP1-04 + PPS-04); "cumplir lo prometido": de cada contacto con la comunidad sale algo visible antes del siguiente (PPS-18). Aquí se revela Kenia. |
| S7 · La apuesta causal | Herramienta 9 del manual: la Cadena de Cambios, que es la teoría del cambio con nombre colombiano. Encaja exacta con el árbol de objetivos ya planeado. |
| S8 · Ingeniería del papel | Herramientas 10 y 11 (indicadores de cambio y preguntas guía) + PPS-29: indicadores que cualquiera lee (mujeres por cada diez, mezcla de edades, quién recoge basura ajena). |
| S9 · La política del proyecto | Herramientas 6 y 7 del manual: mapa de actores (posición / interés / necesidad, cuatro poderes) y radar de relaciones. Y convertir el pleito en propuesta: de estar en contra a estar a favor (KIC-31). |
| S10 · Presupuesto y pre-pitch | Herramienta 16: qué efectos causa en el contexto la forma de usar los recursos (a quién se compra, a quién se contrata) + la columna del presupuesto chico: comprado, prestado, trocado o donado (PPS-22 + PPS-33). |
| S11 · La Dictaminadora | Sin fuente nueva: corre con lo ya diseñado. |
| S12 · La faena y el libro del fondo | Mensaje ético 4 del manual (el uso de los recursos habla por la organización, H15) + "nada se construye sin el nombre de quien lo va a mantener" (THO-12). |
| S13 · El velorio del proyecto | Herramienta 12 (cambios no deseados en el contexto) y Herramienta 13 (efectos sobre conectores y divisores): el velorio con vocabulario de Acción sin Daño. |
| S14 · Obra y comunicación | El cuarto abierto a pie de obra (PIP1-03) y los técnicos que van a la fiesta sin instrumento en la mano (PIP1-17). |
| S15 · Medir lo que importa | La misma hoja, dos veces (PIP1-10 + PIP3-18 + PPS-12): línea base y comparación; si sube la gente sentada, comiendo y platicando, la obra sirvió; si solo sube la que pasa, no. |
| S16 · Auditoría y radar | Herramientas 15 y 16: transparencia en el manejo de los recursos como mensaje ético, no como formalidad. |
| S17 · La inauguración | Estrenar con película y comida, no con corte de listón (KIC-14) + Herramienta 17 (estrategia de salida: qué queda, quién sigue, con qué) + Etapa 5 del manual (sistematizar y aprender). |

Dos límites que el propio banco declara y que conviene decir en clase cuando
toque: sus fichas no cubren seguridad acuática ni calidad del agua (vacíos 2 y 3
de `vacios.md`), y cualquier cifra de campo que traiga es propuesta de trabajo,
no dato bibliográfico. Si el proyecto real de los estudiantes toca la orilla,
esas dos ausencias se nombran como tarea de gestión (pedir el dato a quien lo
tiene), que es exactamente el oficio que el curso enseña.

## Bloque 7 (20 de agosto de 2026): la semana 4 en mazos, la unidad 1 completa

Jueves "El ensayo general": las tres brújulas (no prometer, registrar textual,
código de auxilio), el ensayo como piloto de la hoja (PPS-15: "cuando las
respuestas salen malas, la culpa es de la hoja"), el ensayo por estaciones con
tarjetas de personaje en secreto (incluido un vecino amable, porque cerrar una
conversación buena también se ensaya) y el protocolo del día. Viernes "La
consulta en La Florida": el encuadre de invitado y no experto con las palabras
prohibidas (KIC-11), la única promesa autorizada ("les traemos apuntado lo que
salga hoy": KIC-11 + PPS-18), el pliego revisado a media consulta (THO-03 +
PIP3-02), la respuesta incómoda, el círculo de los dos minutos, la apertura de
los sobres junto al agua y el levantamiento como mensaje implícito (Acción sin
Daño). Los tres ejercicios del gimnasio ya existían y no se tocaron.

Decisiones que obligan hacia adelante:

- **La autoevaluación de ensayo se lleva de tarea el fin de semana** (con el
  cuadernillo de la unidad 1) y se comenta al abrir el jueves de la S5, junto
  con el registro en limpio. La S5 se produce con ese arranque.
- **"Promesa accidental" entra al vocabulario del curso** (hoja de consulta S4):
  la expectativa sembrada sin querer o el rumor que corre en nombre del
  proyecto. Reaparecerá en la S14 (obra y comunicación).
- El suelo de la unidad 1 nombra "los dos minutos" (así se le dice al primer
  peldaño) en lugar de "la presentación en parejas": el círculo se hace por
  estaciones, no por parejas.

## Bloque 8 (20 de agosto de 2026): la evaluación de la unidad 1, consolidada

Pedido de Eduardo: que el cuadernillo se pueda llenar y guardar en la página,
no solo imprimir; que el suelo y la autoevaluación queden explicados (es la
primera vez que el grupo los vive); y detectar vacíos.

### Lo construido

- **Cuadernillo digital genérico en `curso.js`** (`montarCuadernillo`): cualquier
  página con `[data-cuadernillo]` guarda sus campos `[data-exp]` en localStorage
  mientras se escribe, con barra fija: Descargar mi cuadernillo (archivo HTML
  autocontenido con todo lo escrito, casillas incluidas), Imprimir y Borrar mis
  respuestas. Misma filosofía que los pactos: nada viaja a ningún servidor
  (regla 8 intacta). Sirve tal cual para los cuadernillos 2 a 4.
- **`expediente-u1.html` rehecho:** portadilla con nombre capturable, página
  nueva "Cómo funciona este cuadernillo" (incluye la advertencia de máquinas
  compartidas), Dónde empiezo con textareas, mapa de evidencias con 10 filas
  capturables, el suelo con casillas reales y cada punto explicado con su
  evidencia y su plan B, página nueva "La autoevaluación, explicada", y la
  autoevaluación 1 capturable con botón que arma el correo de transcripción.
- **S4 jueves gana el bloque 7, "El cierre de la unidad, explicado"** (10 min,
  dos láminas: el suelo es piso no techo; la autoevaluación produce práctica,
  no número). El protocolo pasa a bloque 8; el jueves queda en 110 min.
- **`expediente-del-gestor.html`** anuncia el llenado en línea.

### Vacíos detectados y cómo se resolvieron

1. **La compensatoria de la consulta no existía.** Definida en el suelo:
   entrevista apreciativa a dos personas de la propia comunidad con el guion de
   la estación, registro textual y en limpio, antes del viernes de la S5.
   (Definición propuesta por Claude; Eduardo puede ajustarla.)
2. **El "formulario privado" de la autoevaluación no existía.** Se armó por
   mailto con asunto uniforme, como el vaciado de la entrevista. Queda en
   pendientes decidir si se cambia a Google Form.
3. **El punto de tickets del suelo era inauditable** (los tickets pueden ir
   anónimos). Se volvió explícito que la casilla se marca bajo palabra.
4. **El sobre no tenía plan para quien entró tarde.** Resuelto: se declara en
   la autoevaluación y la casilla se da por cubierta.
5. **La regla de los tres casos "desde el ensayo" no decía cómo opera sin
   número.** Resuelto: comparación voluntaria de lecturas en cinco minutos,
   sin registro de ninguna de las dos.
6. **Hojas transversales:** el anti-currículum vive en el cuadernillo 3 pero se
   estrena en la S2, y la hoja de solicitudes reales no existe aún. Se difiere
   a la producción de los cuadernillos 2 a 4 (quedó en pendientes).

### Ilustraciones

Los prompts en inglés para Gemini de las semanas 3 y 4 (cuatro por semana)
viven en `~/Descargas/imagenes-semana-03.md` y `~/Descargas/imagenes-semana-04.md`
(carpeta local del profesor, no se suben). Los placeholders ya están comentados
en el HTML de las dos semanas, cada uno como lámina independiente
(`.lam--figura`) para que la imagen no se corte en el telón: llegada la imagen
a `assets/img/semana-0N/`, solo se descomenta.

## Bloque 9 (20 de agosto de 2026): el primer no al suelo, el contrato en línea

Pedido de Eduardo: que el ejercicio "Mi primer no" (S2) esté en el cuadernillo
y en el suelo de la unidad 1, al menos su sistematización; y lo mismo el
contrato de gestión.

- **`contrato-de-gestion.html` es ahora llenable en línea** con el mecanismo
  del cuadernillo digital (`data-cuadernillo="contrato"`): áreas, apoyo, tabla
  de personas puente, habilidad, los dos compromisos, día y firma (el nombre
  escrito hace las veces de firma; la copia descargada es la constancia; la
  línea del testigo se firma en papel o se da por atendida al revisar el
  suelo). El papel repartido en clase sigue valiendo igual. La regla 4 quedó
  enmendada.
- **El cuadernillo 1 gana la hoja "Mi primer no, sistematizado"** (semana 2):
  qué pedí y a quién, la petición textual, cuándo y por qué canal, qué pasó
  (sí, no o silencio), qué aprendí y si sonó la campana. Se llena entre las
  semanas 2 y 5.
- **El suelo de la unidad 1 pasa de 5 a 6 casillas:** entra "Mi primer no: la
  petición real de la semana 2, hecha y sistematizada". El resultado no cuenta
  (sí, no o silencio valen igual); el intento sí. **Decisión que amarra la
  contabilidad del semestre: el primer no cuenta como la solicitud real 1** (el
  suelo de la U3 ya pedía la "solicitud real 2", y el transversal pide dos en
  el semestre; así cierran las cuentas). Plan B: hacerla y registrarla antes
  del viernes de la semana 5.
- Actualizados en cadena: la fila U1 de `tu-calificacion.html`, las láminas del
  cierre de unidad y la hoja de consulta de la S4, y las menciones de la S2
  (el contrato "se puede llenar directo" y la petición "se sistematiza en el
  cuadernillo").
- **Adenda del mismo día: el suelo pasa de 6 a 7 casillas.** Entra "Subí mi
  reporte de la guía de observación al Drive" (carpeta S2): la guía de "Mirar
  como gestor" llena con sus ocho bloques, foto y croquis. Es individual (la
  zona se trabajó en pareja, el reporte lo sube cada quien con su nombre; una
  foto legible del cuaderno cuenta igual). Plan B: subirlo antes del viernes
  de la semana 5. El destino del reporte quedó dicho también dentro del propio
  ejercicio y en el gimnasio de la S2.
