// SySACAD guarda cursadas y aprobadas como listas disjuntas (una materia aprobada ya no
// figura en cursadas), pero el simulador necesita que "aprobada" implique "cursada" para que
// las correlativas "para cursar" (que solo piden cursada) se cumplan con una materia que ya
// se aprobó. Esta función arma esa lista unificada en el reshape boundary, así el resto del
// simulador no tiene que saber que SySACAD las separa.
export function unificarCursadasYAprobadas(cursadas: string[], aprobadas: string[]): string[] {
  return [...new Set([...cursadas, ...aprobadas])];
}
