import { SYSACAD_BASE_URL } from "../config.js";
import type { SysacadEstadoAcademico, SysacadPlanEstudios } from "./types.js";

// Esta es la parte core del sistema: sysacadClient.ts es el único archivo que conoce la URL
// base y la forma cruda de datos de SySACAD. Hoy por hoy SYSACAD_BASE_URL apunta al mock
// montado en el mismo server de simUTN (/mock-sysacad); el día que SySACAD publique su API
// real, alcanza con cambiar esa variable de entorno y ajustar el parseo acá.

export async function fetchEstadoAcademico(legajo: string): Promise<SysacadEstadoAcademico | null>
{
  const res = await fetch(`${SYSACAD_BASE_URL}/alumnos/${encodeURIComponent(legajo)}/estado-academico`);

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`SySACAD respondio ${res.status}`);
  }

  return (await res.json()) as SysacadEstadoAcademico;
}

// Resuelve el plan de estudios de la carrera del alumno a partir de su legajo.
export async function fetchPlanEstudios(legajo: string): Promise<SysacadPlanEstudios | null>
{
  const res = await fetch(`${SYSACAD_BASE_URL}/alumnos/${encodeURIComponent(legajo)}/plan-estudios`);

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`SySACAD respondio ${res.status}`);
  }

  return (await res.json()) as SysacadPlanEstudios;
}
