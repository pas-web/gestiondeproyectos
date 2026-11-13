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

## Cómo guarda

Todo vive en el `localStorage` del navegador, con el prefijo `mochila:`.
El origen `pas-web.github.io` lo comparten todos los sitios de la organización,
por eso el prefijo. Claves:

- `mochila:membrete`: nombre, logo, contacto, color y firma (compartido por las cuatro herramientas)
- `mochila:docs:<herramienta>` y `mochila:actual:<herramienta>`: los documentos y cuál está abierto
- `mochila:folio:COT` y `mochila:folio:REC`: el último número de cotización y de recibo
- `mochila:tarifa`: el último valor de la hora que se escribió

El botón «Descargar archivo» baja un `.mochila.json` con el documento y el
membrete; «Abrir un archivo» lo vuelve a cargar en cualquier aparato.

## Cómo imprime

La hoja se copia a `#impresion`, se fija `@page { size: letter; margin: 0 }` y
los márgenes de cada página salen de los renglones vacíos del `thead` y el
`tfoot` de `table.pagina`, que el navegador repite en cada hoja. El pie con el
nombre es `position: fixed` al imprimir, para que salga al fondo de cada página.
Así no aparecen la dirección ni la fecha que el navegador pone en los márgenes.
