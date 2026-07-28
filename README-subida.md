# Cómo publicar el sitio del curso (campus-conca.github.io/gestion)

Este archivo es para ti, Eduardo. No es parte del sitio (puedes subirlo sin problema, no estorba).

## La primera vez (crear el repositorio)

1. Entra a github.com con tu cuenta de la organización **Campus-Conca**.
2. Botón **New repository** → nombre: `gestion` → público → **Create repository**.
3. En el repo nuevo: **Add file → Upload files** y arrastra TODO el contenido de esta carpeta `sitio/` (los archivos y las carpetas `semanas/`, `ejercicios/`, `evaluacion/`). Incluye el archivo `.nojekyll` (si tu explorador lo esconde, créalo desde GitHub: **Add file → Create new file**, nombre `.nojekyll`, sin contenido, y commit).
4. Mensaje de commit (por ejemplo "Arranque del sitio: portada, Tu calificación, S1 y S6") → **Commit changes**.
5. Activa GitHub Pages: **Settings → Pages → Source: Deploy from a branch → Branch: main, carpeta / (root) → Save**.
6. Espera 1-2 minutos. El sitio queda en `https://campus-conca.github.io/gestion`.

## Para comprobar que quedó bien

- `https://campus-conca.github.io/gestion` → portada con las 17 semanas (S1 y S6 con enlace, el resto en gris).
- `.../gestion/tu-calificacion.html` → abierta siempre, sin candado.
- `.../gestion/semanas/semana-01.html` → antes del 5 de agosto debe mostrar "Esta semana todavía no abre".
- `.../gestion/semanas/semana-01.html?preview` → tú la ves completa, con todo y gimnasio.

## Cada vez que se produzca una semana nueva

1. Sube `semanas/semana-XX.html` y la carpeta `ejercicios/semana-XX/` a las mismas rutas del repo.
2. Edita `index.html` del repo: en la línea `var DISPONIBLES = [1, 6];` agrega el número de la semana nueva (por ejemplo `[1, 2, 6]`). Con eso la portada le pone enlace.
3. Commit y listo: el candado de goteo hace el resto solo (cada página trae su fecha).

## Reglas de la casa (para que el sitio no pierda su voz)

- Sin raya larga en páginas del sitio (coma o paréntesis). Máximo un emoji por página, solo en El chapuzón.
- Datos de estudiantes, calificaciones y el tablero docente: JAMÁS al repositorio. El tablero (`tablero-docente.html`) vive solo en tu computadora.
- Los planes docentes (`Plan_Sesiones_...`) tampoco se suben: traen las sorpresas.
- Al editar un ejercicio ya publicado, actualizar las DOS copias: la de tu carpeta local y la del repo.
