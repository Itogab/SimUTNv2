/*
Planes de estudio que en la realidad viviría SySACAD (una carrera puede tener su propio plan
de materias y correlativas). Por ahora solo está cargada Ingeniería en Sistemas de Información
(código "ISI"), pero el mapa está pensado para sumar otras carreras a futuro sin tocar la forma
del dato.

El plan en sí (plan-isi.json) es el dato de prueba que armó el profesor a partir de la BD real
de SySACAD, ya en la forma definitiva (idMateria compuesto, correlativas separadas para cursar/
aprobar) — no es todavía el plan real de la FRD, pero sí la forma real.
*/
import planISI from "./data/plan-isi.json" with { type: "json" };
import type { SysacadPlanEstudios } from "../sysacad/types.js";

//Codigos de carrera que conoce el mock, hoy por hoy solo tenemos sistemas, pero se podría
//ampliar a más carreras
export type CarreraCodigo = "ISI";

//Aca estamos simulando la BD de planes de estudio que en la realidad viviría en la BD del SySACAD,
//No conocemos como guarda la BD del SySACAD los planes de estudio, pero para el simulador alcanza con que tengamos un mapa de carrera -> plan de estudios.

/*
Si se quiere hacer bien, esta parte en realidad tendría que tener su conexión a la BD de SySACAD
*/

//Esto es SUPER SUPER SUPER escalable, si se quiere agregar una nueva carrera, simplemente
// es una cuesiton de agregar una nueva entrada aca:
export const PLANES_POR_CARRERA: Record<CarreraCodigo, SysacadPlanEstudios> = {
  ISI: planISI as SysacadPlanEstudios,
};
