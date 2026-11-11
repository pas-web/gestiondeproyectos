# Fuente del cronograma de la presa

Esta carpeta guarda lo necesario para regenerar la página interactiva y los tres PDF de `recursos/cronograma-de-la-presa/`. No forma parte del sitio: ninguna página la enlaza.

- `src/data.js`: la matriz del cronograma (renglones, hitos, compuertas, cargos y fondos). Las fechas y los textos se cambian aquí.
- `src/engine.js`: el motor del calendario (secas y lluvias, Semana Santa, plazos, simulador de retrasos).
- `src/interfaz.html` y `build.js`: la página interactiva.
- `src/documento.js`: la versión para la asamblea, la versión completa y el cartel.
- `tools/imprimir.py` y `tools/finalizar.py`: la impresión con Chrome y el armado final de los PDF.

## Para regenerar

```
npm install
node src/test.js
node build.js
node src/documento.js
python3 tools/imprimir.py "$PWD/out/build/anexo-asamblea.html" "$PWD/out/build/anexo-asamblea.pdf"
python3 tools/imprimir.py "$PWD/out/build/anexo-fondos.html" "$PWD/out/build/anexo-fondos.pdf"
python3 tools/imprimir.py "$PWD/out/build/cartel.html" "$PWD/out/build/cartel.pdf"
python3 tools/finalizar.py
```

`test.js` imprime el calendario, las alertas y la ruta crítica para revisar antes de generar. `imprimir.py` avisa si alguna página desborda. Requisitos: Node 18 o más, Python 3 con `playwright` y `pypdf`, Google Chrome y `qpdf`.

Al terminar se copian `out/sitio/index.html` a `../index.html` y los tres PDF de `out/` a `../`, y se suben juntos, para que la página y los PDF digan las mismas fechas.
