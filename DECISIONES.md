# Decisiones · Gestión y Manejo de Proyectos (UAQ Campus Concá, ago-dic 2026)

Bitácora de las decisiones aprobadas del curso. Se lee al retomar el trabajo en
cualquier sesión y se actualiza al cerrar cada bloque de mejoras.

## Estado actual

- **Fase:** producción por goteo. El esqueleto de las 17 semanas, los 51 ejercicios
  y el sistema de evaluación ya existen y están publicados.
- **Último bloque cerrado:** bloque 1 (28 jul 2026): menú de navegación, Semana 0,
  página del gimnasio y detalle de sesiones de las semanas 1 y 2.
- **Siguiente paso acordado:** producir la sección "El jueves y el viernes" de las
  semanas 3 a 17, en lotes por unidad, previa aprobación del formato piloto.

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

## Reglas de producción

1. **Voz del sitio.** Tutea al estudiante, seca y cálida a la vez. Sin raya larga,
   sin entusiasmo hueco. Un solo emoji por página, en su lugar ritual (el chapuzón).
2. **El candado de goteo es pedagógico, no de seguridad.** Cada semana abre el
   miércoles anterior a sus sesiones. `?preview` en la URL lo salta, para el profesor.
3. **Los ejercicios son autocontenidos.** Un HTML por ejercicio, sin dependencias
   externas, para que abran sin internet y se compartan por WhatsApp. Por eso el
   `curso.js` del menú NO se inyecta en `ejercicios/`.
4. **Un solo lugar por dato.** Las semanas, unidades y recursos fijos viven en las
   constantes de `curso.js`. Cambiar ahí actualiza portada y menú de golpe.
5. **Ningún dato de estudiante al repositorio.** Nombres, calificaciones y
   seguimiento viven solo en herramientas locales del profesor.
6. **Ningún trabajo lleva número durante el semestre.** El acta se acuerda al final,
   con el expediente en la mesa.
7. **Credenciales fuera del repositorio y fuera del chat.** Si se usa un token de
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

Columnas de la hoja: `#`, `Fecha`, `Semana`, `Sesión`, `Dónde vive`,
`Qué pasó (observación cruda)`, `Qué haría distinto`, `Prioridad`, `Estado`,
`Bloque`, `Qué cambió al aplicarlo`.

Estados: `Pendiente` (anotada, sin tocar), `En bloque` (se está trabajando),
`Aplicado` (el cambio está publicado), `Descartado` (se decidió no hacerlo, con
la razón en la última columna).

## Pendientes

- Sección "El jueves y el viernes" de las semanas 3 a 17.
- Montar el formulario del ticket de salida y colgarlo al pie de cada semana.
- Definir si la vitrina de lo producido arranca este semestre o no.
- Llenar las secciones "Lo que produjimos" conforme avance el curso.
