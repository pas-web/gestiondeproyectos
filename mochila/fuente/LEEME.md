# La mochila del gestor · la fuente

Esta carpeta guarda la fuente de las cinco páginas de `mochila/`. Ninguna
página la enlaza. Las páginas publicadas son autocontenidas: cada HTML trae
dentro sus fuentes (Jost), sus estilos y su código, para que abra sin internet
y se pueda compartir suelto.

## Qué hay aquí

| Archivo | Qué es |
| --- | --- |
| `comun.css` | Estilos del banco de trabajo y de la hoja que se imprime |
| `comun.js` | Piezas comunes: guardado, membrete, archivero, cantidad con letra, impresión |
| `guia.css`, `guia.js` | Una cosa a la vez: la tarjeta de la pregunta, el camino de tramos, la hoja con la parte en foco, la ventanita del celular, las listas de una en una y las salidas del final |
| `docx.js` | El Word editable, hecho en el navegador (ZIP sin compresión y el XML mínimo de Word) |
| `lienzo.js` | Las imágenes para WhatsApp (canvas) y `desdeDom`, que pinta un pedazo de la hoja como imagen |
| `fuentes/` | Jost 400, 500, 600 y 700 en woff2 (la misma subfuente del cronograma de la presa) |
| `paginas/*.html` | La plantilla de cada página, con marcas `/*@FUENTES*/`, `/*@COMUN_CSS*/`, `//@COMUN_JS` y `//@INCLUIR archivo.js` |
| `paginas/*.js` | El código propio de cada herramienta |
| `construir.js` | Arma las páginas de `mochila/` a partir de lo anterior |

## Para cambiar algo

1. Se edita aquí, nunca en las páginas de `mochila/` (se sobrescriben).
2. Desde esta carpeta: `node construir.js`. Escribe `mochila/index.html`,
   `cobrar.html`, `cronograma.html`, `presupuesto.html` y `prompts.html`, y
   avisa si algún texto trae raya larga o raya corta.
3. Se suben juntas la fuente y las páginas.

## Una cosa a la vez

Cada herramienta es una serie de preguntas: `<section class="pregunta"
data-paso="…" data-tramo="…" data-foco="…">`, con su `h2`, un `p.porque` y los
campos (`data-k`, como siempre). `M.guia` enseña una a la vez, arma el camino
con los tramos, guarda en el documento dónde se quedó (`guia.paso`) y avisa,
sin trabar, lo que falta (`data-requerido="lo que falta"`). En la hoja, lo que
lleva `data-parte` se ilumina cuando la pregunta lo nombra en `data-foco`, y
late cuando cambia; lo que lleva además la clase `hueco` solo aparece cuando
está en foco y nunca se imprime. El membrete se arma con
`M.preguntasMembrete()` y `M.enlazarMembrete()`; las listas largas
(actividades, partidas) con `M.listaGuiada()`.

Si los pasos dependen de lo que se llena (Pieza por pieza: una pregunta del
agente es un paso, cada proveedor tiene su solicitud), la página los dibuja en
un contenedor propio (`secciones`), le pasa a la guía `antesDeMover` para
volverlos a dibujar cuando cambió cuántos hay, y llama `guia.reconstruir()`:
la guía los relee y se queda en el mismo paso. `listo` puede ser una función
`(id) => true | false | undefined`. `recursos/pieza-por-pieza/fuente/construir.js`
lee `guia.js`, `guia.css`, `docx.js` y `lienzo.js` de esta carpeta: si se
cambian, también se reconstruye Pieza por pieza.

## Quién lleva membrete

Solo `cobrar.html`: la cotización y el recibo salen con logo, nombre, contacto y
firma (`M.preguntasMembrete()`, `M.encabezado()`, `M.docxMembrete()`). El
cronograma, el presupuesto y los dibujos son piezas para armar un proyecto y
salen sin marca: usan `M.sinMembrete()`, `M.cabezaProducto()` y
`M.docxTitulo()`, no preguntan el membrete y entregan Word editable e imagen
JPG, sin PDF. Las firmas de esas hojas se escriben a mano (`elaboro`, `reviso`)
y solo aparecen si se llenan.

## Lo que sale

PDF por la ventana de imprimir (solo en cotizar y cobrar); Word con `M.docx()` (y `M.docxMembrete`,
`M.docxTablaDatos`, `M.docxFirmas`); imagen con `M.lienzo` (tarjetas de
1080 × 1350 para la cotización, el recibo y el presupuesto; la gráfica de
1600 px del cronograma; la hoja completa en los dibujos). Las imágenes salen en JPG: `M.lienzo.entregar` escoge el formato por la
extensión del nombre. En el celular la
imagen sale por el menú de compartir; en la computadora se descarga. Cada
página deja `window.MOCHILA_PRUEBA` para probar sin hacer clic.

## Cómo guarda

Todo vive en el `localStorage` del navegador, con el prefijo `mochila:`.
El origen `pas-web.github.io` lo comparten todos los sitios de la organización,
por eso el prefijo. Claves:

- `mochila:membrete`: nombre, logo, contacto, color y firma (compartido por las cuatro herramientas)
- `mochila:docs:<herramienta>` y `mochila:actual:<herramienta>`: los documentos y cuál está abierto
- `mochila:folio:COT` y `mochila:folio:REC`: el último número de cotización y de recibo
- `mochila:tarifa`: el último valor de la hora que se escribió

La salida «Archivo de la mochila» baja un `.mochila.json` con el documento y el
membrete; «Abrir un archivo» lo vuelve a cargar en cualquier aparato.

## Cómo imprime

La hoja se copia a `#impresion`, se fija `@page { size: letter; margin: 0 }` y
los márgenes de cada página salen de los renglones vacíos del `thead` y el
`tfoot` de `table.pagina`, que el navegador repite en cada hoja. El pie con el
nombre es `position: fixed` al imprimir, para que salga al fondo de cada página.
Así no aparecen la dirección ni la fecha que el navegador pone en los márgenes.
