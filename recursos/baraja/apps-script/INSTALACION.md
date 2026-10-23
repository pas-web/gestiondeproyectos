# La baraja de la orilla · conectar la hoja

Sin esto la baraja funciona, pero cada teléfono guarda solo lo suyo y los
equipos comparten con «copiar código». Con la hoja conectada, todos los
teléfonos de un equipo ven las mismas decisiones y la plenaria se proyecta sola.

1. Hoja de cálculo nueva en Drive: **Baraja de la orilla 2026**.
2. Extensiones → Apps Script. Pega `Code.gs` completo (borra lo que haya).
3. Ejecuta `prepararHoja` una vez; autoriza.
4. Implementar → Nueva implementación → Aplicación web.
   Ejecutar como **yo**; acceso **cualquier persona**. Copia la URL `/exec`.
5. Pega esa URL en `recursos/baraja/baraja-config.js`, en `BARAJA_API_URL`.
   Sube el cambio al repo.

Pestañas que aparecen solas: **Decisiones** (la última de cada equipo por
carta), **Historial** (todas), **Cartas nuevas** y **Retro** (ronda 2).
Para empezar de cero: borra las filas, no los encabezados.
