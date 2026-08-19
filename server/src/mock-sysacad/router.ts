import { Router } from "express";
import { ALUMNOS_MOCK, ESTADOS_ACADEMICOS_MOCK, obtenerPlanPorLegajo } from "./fixtures.js";

// Stand-in para la futura API real de SySACAD. Cuando esa API exista,
// este router se da de baja y sysacadClient.ts apunta a su URL en su lugar.
export const mockSysacadRouter = Router();

mockSysacadRouter.get("/alumnos", (_req, res) => {
  res.json(ALUMNOS_MOCK);
});

mockSysacadRouter.get("/alumnos/:legajo/estado-academico", (req, res) => {
  const estado = ESTADOS_ACADEMICOS_MOCK[req.params.legajo];
  if (!estado) {
    res.status(404).json({ error: "alumno no encontrado" });
    return;
  }
  res.json(estado);
});

// Resuelve legajo -> carrera -> plan de estudios. En la API real esto sería SySACAD
// devolviendo el plan de la carrera en la que está inscripto el alumno.
mockSysacadRouter.get("/alumnos/:legajo/plan-estudios", (req, res) => {
  const plan = obtenerPlanPorLegajo(req.params.legajo);
  if (!plan) {
    res.status(404).json({ error: "alumno no encontrado" });
    return;
  }
  res.json(plan);
});
