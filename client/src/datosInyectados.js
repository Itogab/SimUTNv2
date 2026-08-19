// Contrato de datos con SySACAD
// ==============================
// SimUTN ya no tiene backend propio. SySACAD es quien conoce al alumno logueado, así que es
// SySACAD quien debe incluir, al final del HTML de esta app, un <script> (no "module", para que
// se ejecute de forma síncrona antes de que arranque nuestro main.js) que defina:
//
//   <script>
//     window.SIMUTN_DATA = {
//       alumno: {
//         legajo: 13914,
//         nombre: "Ithurburu, Tomas Gabriel",
//         especialidad: 5,
//         plan: 2023,
//         cursadas: [ { idMateria: "5-2023-207", anio: 2026 }, ... ],
//         aprobadas: [ "5-2023-101", ... ]
//       },
//       planEstudios: {
//         nombre: "Ingeniería en Sistemas de Información",
//         materias: [
//           {
//             idMateria: "5-2023-207",
//             nombre: "Sistemas Operativos",
//             nivel: 2, // 0 = electiva sin año fijo, 1-5 = año de la carrera
//             cursadas: ["5-2023-107"],   // idMateria requeridos CURSADOS para poder cursar esta
//             aprobadas: []               // idMateria requeridos APROBADOS para poder cursar esta
//           },
//           ...
//         ]
//       }
//     };
//   </script>
//
// Esta forma es exactamente la de los archivos de ejemplo en ./data (estado-academico.json y
// plan-estudios.json), que fueron armados junto al profesor a partir de la estructura real de la
// BD de SySACAD (idMateria compuesto especialidad-añoDelPlan-código, correlativas separadas en
// "para cursar" / "para aprobar"). El día que SySACAD defina su integración final, esta es la
// única forma que le importa a SimUTN: este archivo es el único lugar que debería cambiar.
//
// Un <script> clásico (sin type="module") se ejecuta en el momento en que el parser lo encuentra,
// de forma síncrona. Nuestro <script type="module"> se difiere hasta que el documento terminó de
// parsearse, sin importar en qué posición esté. Por eso da igual si SySACAD coloca su <script>
// de datos antes o después del nuestro: `window.SIMUTN_DATA` siempre va a existir para cuando
// nuestro main.js arranque.

// SySACAD guarda cursadas y aprobadas como listas disjuntas (una materia aprobada ya no figura
// en cursadas), pero el simulador necesita que "aprobada" implique "cursada" para que las
// correlativas "para cursar" (que solo piden cursada) se cumplan con una materia que ya se
// aprobó. Esta función arma esa lista unificada en el reshape boundary, así el resto del
// simulador no tiene que saber que SySACAD las separa.
function unificarCursadasYAprobadas(cursadas, aprobadas) {
  const idsCursadas = cursadas.map((c) => c.idMateria);
  return [...new Set([...idsCursadas, ...aprobadas])];
}

// Lee y valida mínimamente los datos que SySACAD debió haber inyectado en window.SIMUTN_DATA.
// Devuelve null si no hay datos (la página se abrió fuera de SySACAD, o SySACAD no los inyectó).
export function leerDatosInyectados() {
  const datos = window.SIMUTN_DATA;
  if (!datos || !datos.planEstudios || !datos.alumno) return null;
  if (!Array.isArray(datos.planEstudios.materias)) return null;

  const { alumno, planEstudios } = datos;

  return {
    alumno: {
      legajo: String(alumno.legajo),
      nombre: alumno.nombre ?? "",
      especialidad: alumno.especialidad,
      plan: alumno.plan,
    },
    planEstudios: {
      nombre: planEstudios.nombre ?? "",
      materias: planEstudios.materias,
    },
    // idMateria[] ya unificado: aprobar una materia implica haberla cursado.
    materiasCursadas: unificarCursadasYAprobadas(alumno.cursadas ?? [], alumno.aprobadas ?? []),
    materiasAprobadas: alumno.aprobadas ?? [],
  };
}
