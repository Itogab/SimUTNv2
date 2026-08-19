//fixtures.ts hace de mock de la API de SySACAD, para poder desarrollar sin depender de la API real
import { PLANES_POR_CARRERA, type CarreraCodigo } from "./planes.js";
import { unificarCursadasYAprobadas } from "../sysacad/util.js";
import type { SysacadEstadoAcademico, SysacadAlumnoCursada } from "../sysacad/types.js";
import alumno13914 from "./data/alumno-13914.json" with { type: "json" };

//Interfaz que representa un alumno de prueba
interface FixtureAlumno
{
  legajo: string;
  nombre: string;
  carrera: CarreraCodigo;
  cursadas: SysacadAlumnoCursada[];
  aprobadas: string[]; // idMateria[]
}

/*
 Valida que un alumno de prueba sea alcanzable respetando correlativas
 (evita que una fixture quede en un estado imposible por error manual).
*/

//construirEstado toma un FixtureAlumno y devuelve un SysacadEstadoAcademico,
// validando que las materias cursadas/aprobadas respeten las correlativas del plan de su carrera
function construirEstado({ legajo, carrera, cursadas, aprobadas }: FixtureAlumno): SysacadEstadoAcademico
{
  const plan = PLANES_POR_CARRERA[carrera];
  const materiasPorId = new Map(plan.materias.map((materia) => [materia.idMateria, materia]));

  const cursadasIds = cursadas.map((c) => c.idMateria);
  const aprobadasSet = new Set(aprobadas);
  const cursadasOAprobadas = new Set(unificarCursadasYAprobadas(cursadasIds, aprobadas));

  for (const idMateria of [...aprobadas, ...cursadasIds]) {
    const materia = materiasPorId.get(idMateria);
    if (!materia) {
      throw new Error(`Fixture ${legajo}: "${idMateria}" no es una materia del plan de ${carrera}`);
    }
    const faltaCursar = materia.cursadas.filter((id) => !cursadasOAprobadas.has(id));
    const faltaAprobar = materia.aprobadas.filter((id) => !aprobadasSet.has(id));
    if (faltaCursar.length > 0 || faltaAprobar.length > 0) {
      throw new Error(
        `Fixture ${legajo}: "${idMateria}" no cumple correlativas (faltan cursar: ${faltaCursar.join(", ") || "-"}; faltan aprobar: ${faltaAprobar.join(", ") || "-"})`,
      );
    }
  }

  return { legajo, cursadas, aprobadas };
}

const PLAN_ISI = PLANES_POR_CARRERA.ISI;

// Materias obligatorias (no electivas) de 1er y 2do año, para armar el fixture "promedio".
const OBLIGATORIAS_ANIO_1_2 = PLAN_ISI.materias
  .filter((materia) => materia.nivel <= 2 && materia.nivel >= 1 && !materia.nombre.includes("(Elec.)"))
  .map((materia) => materia.idMateria);

// Materias de 3er año cuyas correlativas ya quedan satisfechas por OBLIGATORIAS_ANIO_1_2 —
// Probabilidad y Estadística, Bases de Datos, Comunicación de Datos.
const CURSANDO_ANIO_3 = ["5-2023-301", "5-2023-303", "5-2023-305"];

// Todo el plan menos los dos nodos terminales (nada los referencia como correlativa), para
// armar el fixture "avanzado" (a falta de Proyecto Final y la PPS).
const TERMINALES = new Set(["5-2023-506", "5-2023-507"]);
const CASI_TODO_EL_PLAN = PLAN_ISI.materias
  .filter((materia) => !TERMINALES.has(materia.idMateria))
  .map((materia) => materia.idMateria);

//Fixtures de alumnos de prueba
const FIXTURES: FixtureAlumno[] = [
  {
    legajo: "00000",
    nombre: "Alumno Cero",
    carrera: "ISI",
    cursadas: [],
    aprobadas: [],
  },
  {
    // Dato real de prueba armado por el profesor a partir de la BD de SySACAD.
    legajo: String(alumno13914.legajo),
    nombre: alumno13914.nombre,
    carrera: "ISI",
    cursadas: alumno13914.cursadas,
    aprobadas: alumno13914.aprobadas,
  },
  {
    legajo: "20213045",
    nombre: "Alumno Promedio",
    carrera: "ISI",
    cursadas: CURSANDO_ANIO_3.map((idMateria) => ({ idMateria, anio: 2025 })),
    aprobadas: OBLIGATORIAS_ANIO_1_2,
  },
  {
    legajo: "20180012",
    nombre: "Alumno Avanzado",
    carrera: "ISI",
    cursadas: [],
    aprobadas: CASI_TODO_EL_PLAN,
  },
];

//Devuelve un array de objetos alumnos, con legajo, nombre y carrera, basandose en el fixture de prueba
//En la implementación de la api real, esto tendría que devolver un array de objetos alumnos basandose en la base de datos real
export const ALUMNOS_MOCK = FIXTURES.map(({ legajo, nombre, carrera }) => ({ legajo, nombre, carrera }));

//Devuelve un objeto que mapea legajos a estados academicos, construido a partir de los fixtures
//De esa manera, un legajo tiene asignado un estado academico particular
export const ESTADOS_ACADEMICOS_MOCK: Record<string, SysacadEstadoAcademico> = Object.fromEntries(
  FIXTURES.map((fixture) => [fixture.legajo, construirEstado(fixture)]),
);

//Resuelve legajo -> carrera del alumno -> plan de estudios de esa carrera.
//Esto es lo que en la API real haría SySACAD: dado un legajo, sabe a qué carrera pertenece
//y devuelve el plan correspondiente (no necesariamente el mismo para todos los alumnos).
export function obtenerPlanPorLegajo(legajo: string) {
  const fixture = FIXTURES.find((f) => f.legajo === legajo);
  return fixture ? PLANES_POR_CARRERA[fixture.carrera] : undefined;
}
