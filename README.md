# SimUTN

Simulador de correlativas y estado académico para UTN. Se usa como módulo embebido dentro de
SySACAD: SySACAD ya sabe quién es el alumno logueado, así que es SySACAD quien le entrega a esta
app todo lo que necesita para dibujar el plan de estudios y el progreso del alumno. SimUTN no
tiene backend propio ni hace consultas a ningún servidor — es un front-end puro que renderiza lo
que recibe.

Basado en el diseño de [SimUTN (versión anterior)](https://github.com/Itogab/SimUTN) y en la
lógica de [Organizador-de-materias-UTN](https://github.com/Itogab/Organizador-de-materias-UTN).

## Cómo se integra con SySACAD

SySACAD debe servir `client/dist/index.html` (generado con `npm run build`) agregando, al final
del `<body>`, un `<script>` **clásico** (sin `type="module"`) que defina `window.SIMUTN_DATA`:

```html
<script>
  window.SIMUTN_DATA = {
    alumno: {
      legajo: 13914,
      nombre: "Ithurburu, Tomas Gabriel",
      especialidad: 5,
      plan: 2023,
      cursadas: [ { idMateria: "5-2023-207", anio: 2026 }, /* ... */ ],
      aprobadas: [ "5-2023-101", /* ... */ ]
    },
    planEstudios: {
      nombre: "Ingeniería en Sistemas de Información",
      materias: [
        {
          idMateria: "5-2023-207",       // compuesto: especialidad-añoDelPlan-código
          nombre: "Sistemas Operativos",
          nivel: 2,                      // 0 = electiva sin año fijo, 1-5 = año de la carrera
          cursadas: ["5-2023-107"],      // idMateria requeridos CURSADOS para poder cursar esta
          aprobadas: []                  // idMateria requeridos APROBADOS para poder cursar esta
        }
        // ...
      ]
    }
  };
</script>
```

No importa si ese `<script>` va antes o después de nuestro `<script type="module" src="...">`:
un script clásico se ejecuta en el momento en que el parser lo encuentra, mientras que uno
`module` se difiere hasta que termina de parsearse el documento — así que `window.SIMUTN_DATA`
siempre está listo cuando arranca nuestro código. El contrato completo (con el reshape de
cursadas/aprobadas) vive en `client/src/datosInyectados.js`; si el día de mañana cambia la forma
en que SySACAD entrega los datos, ese es el único archivo que debería tocarse.

Si la página se abre sin `window.SIMUTN_DATA` definido (por ejemplo, abriendo el HTML fuera de
SySACAD), la app muestra un mensaje en vez de romperse.

## Estructura

- `client/` — la app (Vite + JavaScript vanilla, sin build de tipos).
  - `src/main.js` — arranque, dibujado del tablero y manejo de clics/hover.
  - `src/models.js` — `Materia` y `Alumno` (correlativas, materias posibles, etc.).
  - `src/datosInyectados.js` — el contrato con SySACAD (ver arriba).
  - `src/persistencia.js` — guarda en `localStorage`, por legajo, el progreso *simulado* que el
    alumno arma por encima de su estado real (qué pasaría si cursa tal electiva antes que tal
    otra). El estado real que manda SySACAD en cada carga siempre tiene prioridad; lo local es
    un agregado encima.
- `data/` — datos de ejemplo (un plan de estudios real de Ingeniería en Sistemas y un estado
  académico real, anonimizables) armados junto al profesor a partir de la estructura real de la
  BD de SySACAD. Sirven para desarrollar y probar sin depender de SySACAD.

## Desarrollo local

```bash
cd client
npm install
npm run dev
```

En modo desarrollo (`npm run dev`), si no hay `window.SIMUTN_DATA` la app pide automáticamente
los datos de ejemplo de `./data` a un endpoint que solo existe en el servidor de desarrollo de
Vite (`client/vite.config.js`) — nunca se empaqueta en el build de producción. Vas a ver un aviso
de "Modo demo local" mientras esto ocurre.

## Build de producción

```bash
cd client
npm run build
```

Genera `client/dist/` — HTML, CSS, JS e imágenes estáticas, sin ningún dato de alumno embebido.
Eso es lo que SySACAD debe servir, agregando su propio `<script>` con los datos reales al final.

## Compartir una demo (para que alguien la pruebe sin instalar nada)

```bash
cd client
npm run demo
```

Genera `client/demo/SimUTN-demo.html`: un único archivo HTML autocontenido (CSS, JS e imágenes
inlineados, sin dependencias externas salvo las tipografías de Google Fonts) con los datos de
ejemplo de `./data` ya "inyectados" tal como lo haría SySACAD. Se abre con doble clic, sin
Node, sin servidor, sin conexión al proyecto — se ve y se usa exactamente igual que dentro de
SySACAD. Ese archivo no se sube al repo (`client/demo/` está en `.gitignore`) porque lleva datos
reales de ejemplo embebidos: para compartirlo, mandalo directamente (mail, Drive, etc.), no lo
publiques en un repo público.
