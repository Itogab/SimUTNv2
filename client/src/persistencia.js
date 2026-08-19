// SySACAD inyecta, en cada carga de página, el estado académico REAL del alumno (fuente de
// verdad). Lo que se guarda acá es la simulación que el alumno arma por encima de esa base
// (p. ej. "y si curso estas tres electivas en este orden"): materias que marcó como cursadas o
// aprobadas más allá de lo que ya certificó SySACAD. Se guarda por legajo para no mezclar el
// progreso simulado de un alumno con el de otro en una computadora compartida.

/*
  Persistencia guarda únicamente las simulaciones que hace el alumno, en base a su estado académico, por encima
  de lo que inyecta el SySACAD que es el estado académico REAL del alumno

*/
const PREFIJO_CLAVE = "simUTN:progreso:";

function clavePara(legajo) {
  return `${PREFIJO_CLAVE}${legajo}`;
}

// Guarda el estado (cursadas + aprobadas) actual del Alumno para este legajo.
export function guardarCambios(legajo, alumno) {
  const data = {
    materiasCursadas: alumno.materiasCursadas.map((m) => m.idMateria),
    materiasAprobadas: alumno.materiasAprobadas.map((m) => m.idMateria),
  };
  localStorage.setItem(clavePara(legajo), JSON.stringify(data));
}

// Aplica sobre el Alumno cualquier progreso simulado guardado previamente para este legajo.
// Es aditivo (usa los setters aproboCursada/aproboMateria, que son idempotentes), pensado para
// aplicarse DESPUÉS de haber cargado el estado real inyectado por SySACAD.
export function restaurarProgresoSimulado(legajo, alumno, materiasObjetos) {
  const raw = localStorage.getItem(clavePara(legajo));
  if (!raw) return;

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  for (const idMateria of data.materiasCursadas ?? []) {
    const materia = materiasObjetos.find((m) => m.idMateria === idMateria);
    if (materia) alumno.aproboCursada = materia;
  }
  for (const idMateria of data.materiasAprobadas ?? []) {
    const materia = materiasObjetos.find((m) => m.idMateria === idMateria);
    if (materia) alumno.aproboMateria = materia;
  }
}
