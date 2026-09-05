# Cómo publicar el sitio del curso (pas-web.github.io/gestiondeproyectos)

Este archivo es para ti, Eduardo. No es parte del sitio (puedes subirlo sin problema, no estorba).

## La primera vez (crear el repositorio)

1. Entra a github.com con tu cuenta de la organización **Campus-Conca**.
2. Botón **New repository** → nombre: `gestion` → público → **Create repository**.
3. En el repo nuevo: **Add file → Upload files** y arrastra TODO el contenido de esta carpeta `sitio/` (los archivos y las carpetas `semanas/`, `ejercicios/`, `evaluacion/`). Incluye el archivo `.nojekyll` (si tu explorador lo esconde, créalo desde GitHub: **Add file → Create new file**, nombre `.nojekyll`, sin contenido, y commit).
4. Mensaje de commit (por ejemplo "Arranque del sitio: portada, Tu calificación, S1 y S6") → **Commit changes**.
5. Activa GitHub Pages: **Settings → Pages → Source: Deploy from a branch → Branch: main, carpeta / (root) → Save**.
6. Espera 1-2 minutos. El sitio queda en `https://pas-web.github.io/gestiondeproyectos`.

## Para comprobar que quedó bien

- La portada, con las 17 semanas: las que estén en `DISPONIBLES` con enlace, el resto en gris.
- `.../tu-calificacion.html` → abierta siempre, sin candado.
- `.../semanas/semana-09.html` → mientras la 9 no esté en `DISPONIBLES`, muestra "Esta semana todavía no abre".
- `.../semanas/semana-09.html?preview` → tú la ves completa, con todo y gimnasio.

## Para abrir una semana

El sitio gotea **por contenido, no por fecha**: una semana se abre cuando el
grupo llega, no cuando lo dice el calendario. Si vamos adelantados se adelanta;
si algo nos retrasa, espera. Hay un solo interruptor.

1. Si la semana es nueva, sube `semanas/semana-XX.html` y la carpeta
   `ejercicios/semana-XX/` a las mismas rutas del repo.
2. Edita **`curso.js`**, la línea `var DISPONIBLES = [0, 1, 2, 3, 4, 5];`, y
   agrega el número de la semana. Es lo único que hay que tocar: de ahí salen
   el enlace en el mapa del curso, el de la barra lateral y el candado de la
   propia página.
3. Commit y listo.

Para cerrar una semana otra vez (rarísimo, pero se puede) se quita el número.

Y para verla tú antes de abrirla al grupo, sin tocar nada: agrégale `?preview`
a la URL.

## Reglas de la casa (para que el sitio no pierda su voz)

- Sin raya larga en páginas del sitio (coma o paréntesis). Máximo un emoji por página, solo en El chapuzón.
- Datos de estudiantes, calificaciones y el tablero docente: JAMÁS al repositorio. El tablero (`tablero-docente.html`) vive solo en tu computadora.
- Los planes docentes (`Plan_Sesiones_...`) tampoco se suben: traen las sorpresas.
- Al editar un ejercicio ya publicado, actualizar las DOS copias: la de tu carpeta local y la del repo.
