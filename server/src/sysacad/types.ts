/*

Esta parte implementa los types de los datos que se reciben del SySACAD.
Es una forma provisional porque el contrato real de SySACAD todavía no está diseñado, pero
está alineada con la estructura real de su BD (relevada con el profesor): idMateria compuesto
(especialidad-añoDelPlan-código) y correlativas separadas en "para cursar" / "para aprobar".
Cuando SySACAD defina su API real, este archivo y el sysacadClient.ts son los únicos lugares
que deberían cambiar.

*/

//Una materia del plan de estudios, tal como la modela SySACAD
export interface SysacadMateria {
  idMateria: string; // compuesto: especialidad-añoDelPlan-código, ej. "5-2023-207"
  nombre: string;
  nivel: number; // 0 = electiva sin año fijo, 1-5 = año de la carrera
  cursadas: string[]; // idMateria requeridos CURSADOS para poder cursar esta
  aprobadas: string[]; // idMateria requeridos APROBADOS para poder cursar esta
}

//interfaz que representa el plan de estudios de la carrera de un alumno, según lo que
//devolvería SySACAD para su legajo (resuelve legajo -> carrera -> plan internamente)
export interface SysacadPlanEstudios {
  nombre: string; // nombre de la carrera
  materias: SysacadMateria[];
}

//Una materia cursada por un alumno, con el año en que la cursó
export interface SysacadAlumnoCursada {
  idMateria: string;
  anio: number;
}

//interfaz que representa el estado académico de un alumno según lo que devuelve SySACAD.
//cursadas y aprobadas son disjuntas: una materia aprobada ya no figura en cursadas.
export interface SysacadEstadoAcademico {
  legajo: string;
  cursadas: SysacadAlumnoCursada[];
  aprobadas: string[]; // idMateria[]
}
