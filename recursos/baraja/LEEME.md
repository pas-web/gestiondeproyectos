# La baraja de la orilla · La Florida

La baraja como sitio: cada equipo la abre en su teléfono, decide carta por carta
(va / quizá / no), pone zona y doliente, voltea la carta para copiar el prompt de
Gemini y escribe el código de la carta en un post-it para el mapa del salón.

- `index.html` — la baraja para los equipos. `?equipo=3` entra directo al equipo 3.
  Pestañas: los componentes del equipo, «Las que van» (códigos grandes para los
  post-its, resumen para WhatsApp, código del equipo), «Ronda 2 · retro» (tarjetas
  «falta» y «choca con lo mío» para el equipo que presenta) y «Cómo se juega».
- `plenaria.html` — la pantalla que se proyecta en la ronda 2: lo que va de cada
  equipo, con zona y doliente, y las tarjetas que llegan en vivo. Pestaña
  «Catálogo» con todo lo que va, imprimible, y las semillas del marco lógico.
  Flechas ← → cambian de equipo; C abre el catálogo.
- `baraja-datos.js` — las 81 cartas, los seis componentes, las cinco zonas y los
  prompts de las cartas en blanco. `baraja-config.js` — la URL de la hoja y los
  cinco equipos.
- `apps-script/Code.gs` — el servicio que guarda todo en una hoja de cálculo para
  que los teléfonos de un mismo equipo vean lo mismo y la plenaria se llene sola.
  Instrucciones en `apps-script/INSTALACION.md`. Sin la hoja, cada teléfono guarda
  lo suyo y los equipos pegan su «código del equipo» en la plenaria.
- `img/` — ilustraciones opcionales con el nombre de la carta (`1a-01.png`); si no
  están, se muestra el pictograma. `baraja-de-la-orilla.pdf` — la versión impresa.
