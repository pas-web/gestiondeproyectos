/* La baraja de la orilla · configuración
   ------------------------------------------------------------------
   BARAJA_API_URL: la URL de la aplicación web de Apps Script (termina en
   /exec) que guarda las decisiones de cada equipo en una hoja de cálculo.
   El código y las instrucciones están en apps-script/Code.gs.
   Mientras esté vacía, la baraja guarda solo en el teléfono de cada quien
   y los equipos comparten su resultado con el botón «copiar código». */
window.BARAJA_API_URL = 'https://script.google.com/macros/s/AKfycbyws8DN7LsdhchDyQ3cf4dhLYDLX3PUMWW5tvuPYsMDZfC3gNTnQzdEc-x0WfO9Pa_Ydw/exec';

/* Los cinco equipos: uno por línea estratégica, con los componentes de la
   baraja que le tocan. El número del equipo es el de la línea del árbol. */
window.BARAJA_EQUIPOS = [
  { n: 1, nombre: 'Restauración ecológica', comps: ['1a', '1b'], color: '#5F8F3E' },
  { n: 2, nombre: 'La comunidad cuida y vigila', comps: ['2'], color: '#B4443C' },
  { n: 3, nombre: 'Recreación para las edades', comps: ['3'], color: '#3B86B5' },
  { n: 4, nombre: 'Seguro y limpio', comps: ['4'], color: '#0F6E6E' },
  { n: 5, nombre: 'Convivencia y descanso', comps: ['5'], color: '#7A6A2A' }
];
