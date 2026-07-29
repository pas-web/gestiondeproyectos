# Decisiones · Gestión y Manejo de Proyectos (UAQ Campus Concá, ago-dic 2026)

Bitácora de las decisiones aprobadas del curso. Se lee al retomar el trabajo en
cualquier sesión y se actualiza al cerrar cada bloque de mejoras.

## Estado actual

- **Fase:** producción por goteo. El esqueleto de las 17 semanas, los 51 ejercicios
  y el sistema de evaluación ya existen y están publicados.
- **Último bloque cerrado:** bloque 2 (28 jul 2026): formato de día 2.0 en la
  Semana 0, los dos pactos como documentos firmables y la hoja de
  retroalimentación de la materia. Antes, bloque 1 (28 jul 2026): menú de
  navegación, Semana 0 como semana real, página del gimnasio, detalle de sesiones
  de las semanas 0, 1 y 2, y reparto de contenido entre la Semana 0 y la 1.
- **Siguiente paso acordado:** con el formato de día 2.0 aprobado en la Semana 0,
  migrar las semanas 1 y 2 y después producir las semanas 3 a 17 en lotes por unidad.

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
2. **El contenido de la materia vive en la página semanal.** Cada día se escribe en
   prosa desarrollada, con el concepto explicado, ejemplos resueltos y tablas, al
   nivel del sitio de Etimologías. La tabla minuto a minuto queda prohibida como
   forma principal: cada bloque abre con numeral grande en arena, título en Georgia
   y una chapa discreta con los minutos.
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
4. **Los pactos se firman en papel y viven en el sitio.** Cada pacto es una página
   imprimible en `evaluacion/`, con las dos columnas de compromisos (lo que le toca
   al profesor y lo que le toca al estudiante) y firma por nombre.
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

## Pendientes

- Migrar las semanas 1 y 2 al formato de día 2.0.
- Producir los días de las semanas 3 a 17 en el formato nuevo, en lotes por unidad.
- Revisar si la semana 2 necesita ajuste ahora que la campana del no y el contrato
  de gestión ya no compiten con los pactos.
- Montar el formulario del ticket de salida y colgarlo al pie de cada semana.
- Definir si la vitrina de lo producido arranca este semestre o no.
- Llenar las secciones "Lo que produjimos" conforme avance el curso.
