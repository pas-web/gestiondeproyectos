# Pieza por pieza · la fuente

Esta carpeta guarda la fuente de `recursos/pieza-por-pieza/index.html`. Ninguna
página la enlaza. La página publicada es una sola y autocontenida: trae dentro
sus fuentes (Jost), el emblema de la presa, sus estilos, sus datos y su código,
para que abra igual en el sitio del curso y publicada como artifact de Claude.

## Qué hay aquí

| Archivo | Qué es |
| --- | --- |
| `pagina.html` | La plantilla, con marcas `/*@FUENTES*/`, `/*@COMUN_CSS*/`, `/*@GUIA_CSS*/`, `/*@PXP_CSS*/`, `//@EMBLEMA`, `//@DATOS`, `//@PRESA`, `//@COMUN_JS`, `//@LIENZO`, `//@DOCX`, `//@GUIA`, `//@AGENTE`, `//@EJEMPLO` y `//@APP` |
| `datos.js` | Las 26 piezas, el catálogo de precios de referencia, lo que el agente sabe del proyecto (`EXPEDIENTE`) y los consejos para medir |
| `agente.js` | El agente: detecta si hay Claude en la página, arma los tres encargos (leer la foto, armar la lista, investigar precios), los manda o los deja para copiar, y lee lo que regresa |
| `app.js` | Los pasos (uno por pregunta, en ocho tramos), las siete hojas, las sumas, la regla de las cotizaciones, el contraste, el Word, la imagen y el paso al archivo del equipo |
| `ejemplo.js` | La pieza de ejemplo, «Dos columpios de tronco», con todo lleno |
| `pxp.css`, `comun.css`, `comun.js` | Estilos y piezas comunes; `comun` viene de la mochila del gestor, con el prefijo `pxp:` |
| `fuentes/`, `emblema-presa-web.png` | Jost 400 a 700 en woff2 y el emblema del membrete |
| `enclaude.txt` | La dirección del artifact de Claude, para el enlace que ofrece el paso de la lectura en el sitio |
| `construir.js` | Arma `../index.html` a partir de todo lo anterior y de cuatro archivos de la mochila: `guia.js`, `guia.css`, `docx.js` y `lienzo.js` (`../../../mochila/fuente/`) |

## Para cambiar algo

1. Se edita aquí, nunca en `../index.html` (se sobrescribe).
2. Desde esta carpeta: `node construir.js`. Lee las actividades del cronograma
   integrado (`../../cronograma-de-la-presa/fuente/src/`), revisa que cada pieza
   apunte a actividades que existen, que no quede raya larga ni raya corta y que
   no sobren marcas, y termina en «Listo.».
3. Se suben juntas la fuente y la página.
4. Si cambió el código o el catálogo, también se vuelve a publicar el artifact
   de Claude (ver abajo). Si solo cambió la dirección del artifact, basta con
   `enclaude.txt` y volver a construir.

## Una pregunta a la vez

La página usa la guía de la mochila: se ve una pregunta, arriba va el camino
con los ocho tramos y a la derecha la hoja del tramo, con la parte que se está
llenando iluminada. Los tramos y sus pasos:

| Tramo | Pasos | Hoja |
| --- | --- | --- |
| La pieza | equipo, componente, pieza (con lo que dice el cronograma), foto, propuesta | Ficha de la pieza |
| Las preguntas | la lectura del agente, los números sobre la foto y una pregunta por paso (`pr-…`) | Lectura de la foto |
| La hoja de campo | imprimir la hoja y una medida por paso (`md-…`) | Hoja de campo |
| La lista | armar la lista y un paso por número de la foto (`g-1`, `g-2`… y `g-0`, lo de toda la pieza) | Lo que lleva la pieza |
| La precotización | cómo queda, los precios sin fuente, los imponderables | Precotización |
| Pedir cotizaciones | quién las recibe y una solicitud por proveedor (`s-…`) | Solicitud |
| Lo que cotizaron | las cotizaciones de cada solicitud (`c-…`) y con cuál se quedan | Partida |
| La partida | el contraste, las tres diferencias (`d-1` a `d-3`), actividad y bolsillo, entregar | Partida |

Los pasos salen de la pieza, así que `app.js` los dibuja (`estructura()`) y,
si cambia cuántos hay, la guía los vuelve a leer antes de moverse. La pieza
guarda dónde se quedó en `guia.paso`; las de la versión 1 abren en el primer
paso del tramo donde iban (`paso`).

## Lo que sale

| Qué | Cómo |
| --- | --- |
| Las siete hojas | PDF por la ventana de imprimir (en Claude, «Descargar la hoja» baja un HTML suelto para imprimir) |
| La solicitud de cotización | PDF, Word editable y el mensaje para WhatsApp, por proveedor |
| La partida | PDF, Word editable (con la foto numerada, los anexos y las firmas), imagen de 1080 × 1350 para WhatsApp y el archivo de la pieza |
| El archivo del equipo | «Llevar al archivo del equipo», igual que en la versión 1 |

`window.PXP_APP` deja probar sin hacer clic: `pasos()`, `guia()`,
`word('partida' | 'solicitud', grupo)`, `imagen()`.

## Las dos casas de la página

En el sitio del curso no hay agente: cada encargo se copia, junto con la foto, a
Claude, ChatGPT o Gemini, y la respuesta se pega en la página. El paso de la
lectura ofrece la versión de Claude.

Publicada como artifact de Claude, la página usa la capacidad `sample` (con
imágenes) para que el agente trabaje ahí mismo, y `downloads` para bajar
archivos (la hoja, el Word, la imagen y la pieza). Ahí no se puede imprimir:
«Descargar la hoja» baja la hoja como un HTML suelto que se abre en el navegador
y se imprime. El uso del agente cuenta contra
el plan de Claude de quien abre la página; si no hay permiso o se acaba el
límite, la página pasa sola al modo de copiar y pegar.

Para volver a publicar el artifact se sube la misma `../index.html` sobre el
mismo artifact, desde un chat de Claude con las herramientas de artifacts, con
las capacidades `{ sample: { images: true }, downloads: {} }`. Dentro de Claude
el aviso del agente cambia solo y el enlace de `enclaude.txt` no aparece.

## El catálogo

`CATALOGO` en `datos.js`: clave, insumo, unidad, precio, tipo, fuente, fecha y
enlace. Las claves empiezan por la familia: M materiales de construcción,
C cercos, W madera, P piezas terminadas, V plantas, E herramienta y maquinaria,
L mano de obra, T traslados. Lo que no tiene enlace viene de la práctica del
presupuesto (12 de noviembre de 2026) y se marca «Práctica, sin fuente».
`FECHA_CATALOGO` sale en las hojas. La faena (`L01`) se valoriza al salario
mínimo general de 2026, $315.04 diarios (CONASAMI), y el expediente le dice al
agente que ningún jornal va por debajo.

## Cómo guarda

Todo vive en el `localStorage` del navegador con el prefijo `pxp:`
(`pxp:docs:piezas` y `pxp:actual:piezas`). Las fotos se achican a 1400 px y se
guardan con la pieza; si el navegador se llena, la página avisa y el archivo
sigue bajando.

Archivos que entran y salen:

- `nombre.pieza.json`: la pieza completa (`{ pxp: 'pieza', version: 2, guardado, datos }`; también abre las de la versión 1),
  para pasarla de un aparato a otro o de la versión del sitio a la de Claude.
- `presupuesto-<componente>-<equipo>.json`: el archivo del equipo de la
  práctica del presupuesto (versión 3). «Llevar al archivo del equipo» abre el
  que ya tiene el equipo o empieza uno, reemplaza las partidas de las
  actividades de la pieza y deja las demás. Ese archivo se abre en la práctica y
  se junta en `recursos/presupuesto-de-la-presa/`.

## Cómo imprime

Igual que la mochila: la hoja se copia a `#impresion`, `@page { size: letter;
margin: 0 }`, y los márgenes salen de los renglones vacíos del `thead` y el
`tfoot` de `table.pagina`. El pie es `position: fixed` al imprimir.
