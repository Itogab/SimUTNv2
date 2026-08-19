import { Router } from "express";
import { fetchEstadoAcademico, fetchPlanEstudios } from "../sysacad/sysacadClient.js";
import { unificarCursadasYAprobadas } from "../sysacad/util.js";

export const alumnosRouter = Router();

// Frontera de reshape: acá es donde absorberíamos cualquier diferencia entre
// la forma cruda de SySACAD y lo que el simulador espera, sin tocar el cliente.
alumnosRouter.get("/alumnos/:legajo/estado-academico", async (req, res) => {
  const estado = await fetchEstadoAcademico(req.params.legajo);
  if (!estado) {
    res.status(404).json({ error: "alumno no encontrado" });
    return;
  }

  // SySACAD guarda cursadas/aprobadas como listas disjuntas; el cliente asume que una materia
  // aprobada también cuenta como cursada (para que las correlativas "para cursar" se cumplan).
  const materiasCursadas = unificarCursadasYAprobadas(
    estado.cursadas.map((c) => c.idMateria),
    estado.aprobadas,
  );
  const materiasAprobadas = estado.aprobadas;

  res.json({ legajo: estado.legajo, materiasCursadas, materiasAprobadas });
});

// Plan de estudios de la carrera del alumno, resuelto por SySACAD a partir de su legajo
alumnosRouter.get("/alumnos/:legajo/plan-estudios", async (req, res) => {
  const plan = await fetchPlanEstudios(req.params.legajo);
  if (!plan) {
    res.status(404).json({ error: "alumno no encontrado" });
    return;
  }

  res.json(plan);
});
