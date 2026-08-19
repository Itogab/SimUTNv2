//PERSIST4ENCIA DE DATOS, ESTE ARCHIVO GUARDA EN LOCAL STORAGE LOS AVANCES DEL ALUMNO
//LA IDEA ES QUE ESTO LUEGO CAMBIE Y SEA MODIFICADO POR LA BASE DE DATOS DEL SIMULADOR
import { Alumno, materiasObjetos } from "./models.js";

const CLAVE_LOCALSTORAGE = "estadoAlumno";

// Lo que guarda Alumno.materiasAprobadas/materiasCursadas son objetos Materia
// completos (con sus correlativas anidadas), así que al recuperarlos de
// localStorage solo confiamos en el campo .idMateria para re-matchearlos contra
// materiasObjetos.
interface EstadoGuardado
{
  legajo: string;
  materiasAprobadas: { idMateria: string }[];
  materiasCursadas: { idMateria: string }[];
}


//Guarda los cambios hechos, junto con el legajo del tablero actual (para poder
//restaurar el tablero correcto la próxima vez que se abra la app)
export function guardarCambios(legajo: string): void
{
  const data: EstadoGuardado =
  {
    legajo,
    materiasAprobadas: Alumno.materiasAprobadas,
    materiasCursadas: Alumno.materiasCursadas,
  };
  localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(data));
}

//Devuelve el legajo guardado de una sesión anterior, si hay alguno, sin tocar Alumno.
export function obtenerLegajoGuardado(): string | null
{
  const raw_data = localStorage.getItem(CLAVE_LOCALSTORAGE);
  if (!raw_data) return null;

  const data = JSON.parse(raw_data) as EstadoGuardado;
  return data.legajo ?? null;
}

//Recupera de localstorage los cambios
export function cargarCambios(): void
{
  const raw_data = localStorage.getItem(CLAVE_LOCALSTORAGE);
  if (!raw_data) return;

  const data = JSON.parse(raw_data) as EstadoGuardado;

  for (const materiaData of data.materiasCursadas) {
    const materia = materiasObjetos.find((m) => m.idMateria === materiaData.idMateria);
    if (materia) Alumno.aproboCursada = materia;
  }

  for (const materiaData of data.materiasAprobadas) {
    const materia = materiasObjetos.find((m) => m.idMateria === materiaData.idMateria);
    if (materia) Alumno.aproboMateria = materia;
  }
}
