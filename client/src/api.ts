export interface PlanMateria {
  idMateria: string; // compuesto: especialidad-añoDelPlan-código, ej. "5-2023-207"
  nombre: string;
  nivel: number; // 0 = electiva sin año fijo, 1-5 = año de la carrera
  cursadas: string[]; // idMateria requeridos CURSADOS para poder cursar esta
  aprobadas: string[]; // idMateria requeridos APROBADOS para poder cursar esta
}

export interface PlanResponse {
  nombre: string; // nombre de la carrera
  materias: PlanMateria[];
}

// El plan de estudios depende de la carrera del alumno, que el server resuelve a partir
// del legajo (vía SySACAD). null significa "legajo no encontrado" (404), no un error de red.
export async function fetchPlanEstudios(legajo: string): Promise<PlanResponse | null>
{
  const res = await fetch(`/api/alumnos/${encodeURIComponent(legajo)}/plan-estudios`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`No se pudo obtener el plan de estudios (${res.status})`);
  }
  return res.json();
}

export interface EstadoAcademicoResponse
{
  legajo: string;
  materiasCursadas: string[]; // idMateria[]
  materiasAprobadas: string[]; // idMateria[]
}

// null significa "legajo no encontrado" (404), no un error de red
export async function fetchEstadoAcademico(legajo: string): Promise<EstadoAcademicoResponse | null>
{
  const res = await fetch(`/api/alumnos/${encodeURIComponent(legajo)}/estado-academico`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`No se pudo consultar SySACAD (${res.status})`);
  }
  return res.json();
}
