export class Materia {
  idMateria: string;
  nombre: string;
  nivel: number; // 0 = electiva sin año fijo, 1-5 = año de la carrera
  //El array de correlativas comienza siendo "nulo"
  correlativas: [Materia[], Materia[]] = [[], []];

  constructor(idMateria: string, nombre: string, nivel: number)
  {
    this.idMateria = idMateria;
    this.nombre = nombre;
    this.nivel = nivel;
  }

  get aprobada(): boolean 
  {
    return this.correlativas[1].every((mat) => mat.aprobada);
  }

  set añadir(pCorrelativas: [Materia[], Materia[]]) 
  {
    this.correlativas = pCorrelativas;
  }
}

// Todas las Materia construidas al arrancar la app (ver construirMaterias en main.ts).
export const materiasObjetos: Materia[] = [];

export const Alumno = {
  materiasAprobadas: [] as Materia[],
  materiasCursadas: [] as Materia[],

  set aproboMateria(pMateria: Materia) 
  {
    if (!this.materiasAprobadas.includes(pMateria)) {
      this.materiasAprobadas.push(pMateria);
    }
  },

  set aproboCursada(pMateria: Materia) 
  {
    if (!this.materiasCursadas.includes(pMateria)) {
      this.materiasCursadas.push(pMateria);
    }
  },

  get materiasPosibles(): Materia[] 
  {
    const posibles: Materia[] = [];
    for (const materia of materiasObjetos) {
      //noTomada significa que la materia no está ni en cursadas ni en aprobadas
      const noTomada =
        !this.materiasAprobadas.includes(materia) && !this.materiasCursadas.includes(materia);

      //sinCorrelativas significa que la materia no tiene correlativas 
      const sinCorrelativas = materia.correlativas.every((correl) => correl.length === 0);
      
      //devuelve si el alumno esta en condiciones de cursar/aprobar una materia
      const cumpleCorrelativas =
        materia.correlativas[0].every((correl) => this.materiasCursadas.includes(correl)) &&
        materia.correlativas[1].every((correl) => this.materiasAprobadas.includes(correl));

      if (noTomada && (sinCorrelativas || cumpleCorrelativas)) {
        posibles.push(materia);
      }
    }
    return posibles;
  },

  eliminarMateriaCursada(pMateria: Materia): void 
  {
    this.materiasCursadas = this.materiasCursadas.filter((materia) => materia !== pMateria);
  },

  eliminarMateriaAprobada(pMateria: Materia): void 
  {
    this.materiasAprobadas = this.materiasAprobadas.filter((materia) => materia !== pMateria);
  },

  reiniciarMaterias(): void 
  {
    this.materiasAprobadas = [];
    this.materiasCursadas = [];
  },
};
