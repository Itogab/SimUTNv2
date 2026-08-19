export class Materia {
  constructor(idMateria, nombre, nivel) {
    this.idMateria = idMateria;
    this.nombre = nombre;
    this.nivel = nivel; // 0 = electiva sin año fijo, 1-5 = año de la carrera
    // El array de correlativas comienza siendo "nulo": [paraCursar, paraAprobar]
    this.correlativas = [[], []];
  }

  get aprobada() {
    return this.correlativas[1].every((mat) => mat.aprobada);
  }

  set añadir(pCorrelativas) {
    this.correlativas = pCorrelativas;
  }
}

// Todas las Materia construidas al arrancar la app (ver construirMaterias en main.js).
export const materiasObjetos = [];

export const Alumno = {
  materiasAprobadas: [],
  materiasCursadas: [],

  set aproboMateria(pMateria) {
    if (!this.materiasAprobadas.includes(pMateria)) {
      this.materiasAprobadas.push(pMateria);
    }
  },

  set aproboCursada(pMateria) {
    if (!this.materiasCursadas.includes(pMateria)) {
      this.materiasCursadas.push(pMateria);
    }
  },

  get materiasPosibles() {
    const posibles = [];
    for (const materia of materiasObjetos) {
      // noTomada significa que la materia no está ni en cursadas ni en aprobadas
      const noTomada =
        !this.materiasAprobadas.includes(materia) && !this.materiasCursadas.includes(materia);

      // sinCorrelativas significa que la materia no tiene correlativas
      const sinCorrelativas = materia.correlativas.every((correl) => correl.length === 0);

      // devuelve si el alumno esta en condiciones de cursar/aprobar una materia
      const cumpleCorrelativas =
        materia.correlativas[0].every((correl) => this.materiasCursadas.includes(correl)) &&
        materia.correlativas[1].every((correl) => this.materiasAprobadas.includes(correl));

      if (noTomada && (sinCorrelativas || cumpleCorrelativas)) {
        posibles.push(materia);
      }
    }
    return posibles;
  },

  eliminarMateriaCursada(pMateria) {
    this.materiasCursadas = this.materiasCursadas.filter((materia) => materia !== pMateria);
  },

  eliminarMateriaAprobada(pMateria) {
    this.materiasAprobadas = this.materiasAprobadas.filter((materia) => materia !== pMateria);
  },

  reiniciarMaterias() {
    this.materiasAprobadas = [];
    this.materiasCursadas = [];
  },
};
