# Bolsa PAS · Octubre 2026 · Qué mejorar

Observaciones a partir del escaneo y de la revisión del código de `bolsa.html`, `egresados.html` e `index.html` (repo `pas-web/soy.pas`).

## Ya resuelto en esta entrega

1. **Sección "Comparte una vacante" retirada** (tarjeta con formulario, chip del hero, CSS y script en `bolsa.html`; tarjeta y CSS en `egresados.html`). Queda una sola línea en el aviso "Cómo funciona esta bolsa" invitando a compartir vacantes por el grupo de WhatsApp.
2. **Tarjetas que caducan solas.** Las tarjetas con fecha de cierre llevan ahora `data-cierre="AAAA-MM-DD"`; un script de 8 líneas las atenúa y les añade "· ya cerró" cuando la fecha pasa. Así la bolsa no muestra como vigente algo vencido entre un escaneo y otro (en septiembre quedaron visibles 6 tarjetas ya cerradas: CESAVE ×2, auxiliar de rancho, CoSMoS, los dos eventos de la UAQ y el BUMP).
3. **Enlace de posgrado Chapingo** apuntaba a `convocatoria_p26`; ahora apunta a la página oficial de Primavera 2027 (`posgrado-p27`).

## Pendiente, por orden de impacto

1. **Peso de la página: 470 KB por el logo en base64.** El logo PAS va incrustado dos veces por página (topbar y pie), 215 KB cada vez, en las tres páginas. Mover el PNG a `assets/logo-pas.png` (y el favicon a `assets/favicon.png`) baja cada página a menos de 40 KB, se cachea una sola vez y carga mucho más rápido desde WhatsApp con datos móviles. Es el cambio con más efecto por línea de código.
2. **Decidir qué hacer con `comparte.html`.** Ya no la enlaza nadie, pero sigue publicada y su pie apunta a `pas-web.github.io`. Opciones: borrarla, o dejarla como redirección a `bolsa.html`. No la toqué porque borrar es decisión tuya.
3. **URL canónica.** El sitio vive en `soypas.campusconcauaq.workers.dev`, pero el `og:image` comentado y varios enlaces absolutos siguen con `pas-web.github.io`. Conviene fijar una sola URL pública, activar `og:image` con el logo ya alojado como archivo (punto 1) y así las ligas compartidas en WhatsApp muestran tarjeta con imagen.
4. **Enlaces frágiles.** Computrabajo e Indeed caducan en semanas y LinkedIn exige sesión en móvil. Este mes 7 de 20 tarjetas dependen de Computrabajo. Siempre que exista, usar el portal del empleador (Koppert, FIRA, SNE, Chapingo lo tienen). Para la ficha de Indeed de Agricultores El Fuerte no había enlace directo estable, por eso va en el Radar con el correo de reclutamiento.
5. **Fuentes de la Sierra Gorda están mudas.** GESG, CONANP y CESAVE SLP no publicaron nada abierto en octubre y sus sitios no son rastreables (el de CESAVE SLP aparece en buscadores con el título secuestrado por un sitio de apuestas: vale avisarles). Para no depender de sus portales, conviene un contacto humano (correo o WhatsApp) en cada una que te mande las convocatorias cuando salgan; eso alimentaría la bolsa mejor que el formulario que acabamos de retirar.
6. **Rutina del skill.** El contenedor donde corre el escaneo no puede abrir los portales directamente (red restringida), así que la verificación de vigencia se hizo por búsqueda. Si la próxima vez la corres desde un entorno con red abierta (o añades a la lista de dominios permitidos los portales del `fuentes.md`), el skill podrá leer cada ficha y confirmar fechas de cierre y sueldos con más certeza.
7. **Categoría "Apoyos para proyectos" vacía en octubre.** No había ninguna ventanilla abierta; la categoría se omitió y se explica en la nota de "Convocatorias y registros". Si prefieres que la categoría siempre aparezca (aunque sea con una tarjeta "próxima ventanilla: enero"), dímelo y lo dejo fijo en el skill.
8. **Accesibilidad menor.** Los chips del hero llevan estilos inline (`style="text-decoration:none;color:inherit"`); conviene pasarlos a la clase `.chip`. El `aria-labelledby="t-radar"` está en un `div`; mejor `section`.
