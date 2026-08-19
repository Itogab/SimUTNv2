import { Alumno, Materia, materiasObjetos } from "./models.js";
import { guardarCambios, cargarCambios, obtenerLegajoGuardado } from "./persistencia.js";
import {
  fetchPlanEstudios,
  fetchEstadoAcademico,
  type PlanResponse,
  type PlanMateria,
  type EstadoAcademicoResponse,
} from "./api.js";

//Quizas convenga hacer una validación mas adecuada de los tipos de datos que vienen del servidor,
//pero hjoy por hoy confiamos en que el servidor nos va a devolver lo que esperamos
const WRAPPER = document.querySelector<HTMLDivElement>(".wrapper")!;
const contador = document.querySelector<HTMLDivElement>(".contador")!;

//Esto es una muy mala practica, pero por ahora nos va a servir para tener un acceso rapido a los divs de materias
const divMateria = document.getElementsByClassName("materia") as HTMLCollectionOf<HTMLElement>;

const legajoForm = document.querySelector<HTMLFormElement>("#legajoForm")!;
const legajoInput = document.querySelector<HTMLInputElement>("#legajoInput")!;
const legajoMensaje = document.querySelector<HTMLParagraphElement>("#legajoMensaje")!;

let cantidadDeMaterias = 0;

// Legajo del tablero actualmente mostrado. El plan de estudios depende de la carrera del
// alumno (resuelta por SySACAD a partir del legajo), así que no hay tablero por defecto:
// no hay nada que dibujar hasta que se conoce un legajo.
let legajoActual: string | null = null;

function construirMaterias(pMaterias: PlanMateria[]): void
{
  pMaterias.forEach((materia) => {
    materiasObjetos.push(new Materia(materia.idMateria, materia.nombre, materia.nivel));
  });
}

function construirCorrelativas(pMaterias: PlanMateria[]): void
{
  for (const materia of pMaterias) {
    const materiaOBJ = materiasObjetos.find((mat) => mat.idMateria === materia.idMateria);
    if (!materiaOBJ) continue;

    const correlativasCursadas = materiasObjetos.filter((objeto) =>
      materia.cursadas.includes(objeto.idMateria),
    );
    const correlativasAprobadas = materiasObjetos.filter((objeto) =>
      materia.aprobadas.includes(objeto.idMateria),
    );
    materiaOBJ.añadir = [correlativasCursadas, correlativasAprobadas];
  }
}

// Agrupa el plan (array plano) por nivel: 1-5 son años de la carrera, 0 son electivas sin
// año fijo (se renderizan aparte, ver dibujarMaterias).
function agruparPorNivel(pMaterias: PlanMateria[]): Map<number, PlanMateria[]>
{
  const grupos = new Map<number, PlanMateria[]>();
  for (const materia of pMaterias) {
    const lista = grupos.get(materia.nivel) ?? [];
    lista.push(materia);
    grupos.set(materia.nivel, lista);
  }
  return grupos;
}

function dibujarSeccion(
  pContenedor: HTMLElement,
  pMaterias: PlanMateria[],
  opciones: { clase: string; dataAnio?: string; indiceAnimacion: number },
): void
{
  const divSeccion = document.createElement("div");
  divSeccion.className = opciones.clase;
  if (opciones.dataAnio) divSeccion.dataset.anio = opciones.dataAnio;
  divSeccion.style.setProperty("--indice-anio", String(opciones.indiceAnimacion));
  pContenedor.appendChild(divSeccion);

  pMaterias.forEach((materia, indice) => {
    const objetoMateria = materiasObjetos.find((mat) => mat.idMateria === materia.idMateria);
    if (!objetoMateria) return;

    const divMateriaEl = document.createElement("div");
    divMateriaEl.innerHTML = materia.nombre;
    divMateriaEl.classList.add("materia");
    divMateriaEl.dataset.idMateria = materia.idMateria;
    divMateriaEl.dataset.tag = `${opciones.dataAnio ?? "E"}.${indice + 1}`;

    if (objetoMateria.correlativas.every((correl) => correl.length === 0)) {
      divMateriaEl.classList.add("habilitada");
    } else {
      divMateriaEl.classList.add("bloqueada");
    }
    divSeccion.appendChild(divMateriaEl);
  });
}

function dibujarMaterias(pContenedor: HTMLElement, pMaterias: PlanMateria[]): void
{
  const grupos = agruparPorNivel(pMaterias);
  const niveles = [...grupos.keys()].filter((nivel) => nivel > 0).sort((a, b) => a - b);

  niveles.forEach((nivel, indiceAnio) => {
    dibujarSeccion(pContenedor, grupos.get(nivel)!, {
      clase: "anio",
      dataAnio: String(nivel),
      indiceAnimacion: indiceAnio,
    });
  });

  const electivas = grupos.get(0);
  if (electivas && electivas.length > 0) {
    dibujarSeccion(pContenedor, electivas, {
      clase: "anio electivas",
      indiceAnimacion: niveles.length,
    });
  }
}

// (Re)construye el tablero para el plan de estudios de la carrera del legajo cargado.
// Se usa tanto al restaurar una sesión previa como al cargar un legajo nuevo, así que
// limpia cualquier tablero anterior antes de dibujar.
function construirTablero(plan: PlanResponse): void
{
  materiasObjetos.length = 0;
  WRAPPER.innerHTML = "";

  construirMaterias(plan.materias);
  construirCorrelativas(plan.materias);
  dibujarMaterias(WRAPPER, plan.materias);
  configurarHoverMaterias();

  cantidadDeMaterias = materiasObjetos.length;
}

function obtenerValorObjeto(pElemento: HTMLElement): Materia | undefined
{
  const idMateria = pElemento.dataset.idMateria;
  return materiasObjetos.find((materiaObjeto) => materiaObjeto.idMateria === idMateria);
}

function reseteoVisual(): void
{
  const divs = document.querySelectorAll<HTMLElement>(".materia");
  divs.forEach((div) => {
    const mat = obtenerValorObjeto(div);

    if (mat && Alumno.materiasAprobadas.includes(mat)) {
      div.className = "materia aprobada";
    } else if (mat && Alumno.materiasPosibles.includes(mat)) {
      div.className = "materia habilitada";
    } else if (mat && Alumno.materiasCursadas.includes(mat)) {
      div.className = "materia cursada";
    } else {
      div.className = "materia bloqueada";
    }
  });
}

function contar(): void
{
  contador.innerHTML = `${Alumno.materiasAprobadas.length} / ${cantidadDeMaterias}`;
  document.documentElement.style.setProperty(
    "--progreso",
    `${(Alumno.materiasAprobadas.length / cantidadDeMaterias) * 100}%`,
  );
  if (Alumno.materiasAprobadas.length === cantidadDeMaterias) {
    alert("Bien ahi wachin, te recibiste!");
  }
}

function eliminarMateriaYDependientes(pMateria: Materia): void
{
  Alumno.materiasAprobadas = Alumno.materiasAprobadas.filter((mat) => mat !== pMateria);
  Alumno.materiasCursadas = Alumno.materiasCursadas.filter((mat) => mat !== pMateria);

  for (const posible of materiasObjetos) {
    const dependeDeElla =
      posible.correlativas[0].includes(pMateria) || posible.correlativas[1].includes(pMateria);
    if (!dependeDeElla) continue;

    if (Alumno.materiasAprobadas.includes(posible) || Alumno.materiasCursadas.includes(posible)) {
      eliminarMateriaYDependientes(posible);
    }
  }
}

const estaAprobada = (pMateria: Materia): boolean => Alumno.materiasAprobadas.includes(pMateria);
const estaCursada = (pMateria: Materia): boolean => Alumno.materiasCursadas.includes(pMateria);

const puedeCursar = (pMateria: Materia): boolean => {
  for (const div of Array.from(divMateria)) {
    if (div.dataset.idMateria === pMateria.idMateria) {
      return div.classList.contains("habilitada");
    }
  }
  return false;
};

// Guarda el progreso solo si ya hay un tablero/legajo activo (nada que guardar antes de eso).
function persistirCambios(): void
{
  if (legajoActual) guardarCambios(legajoActual);
}

// Los listeners de hover se atan directamente a cada div ".materia" (no están delegados en
// WRAPPER), así que hay que re-atarlos cada vez que el tablero se reconstruye.
function configurarHoverMaterias(): void
{
  Array.from(divMateria).forEach((div) => {
    div.addEventListener("mouseover", () => {
      if (div.classList.contains("aprobada")) return;

      const materiaActual = obtenerValorObjeto(div);
      if (!materiaActual) return;

      const podriaCursarCandidatas = materiasObjetos.filter((materia) =>
        materia.correlativas.some((array) => array.includes(materiaActual)),
      );

      for (const podriaCursar of podriaCursarCandidatas) {
        const aprobadasMasMateriaActual = [...Alumno.materiasAprobadas, materiaActual];
        const cursadasMasMateriaActual = [...Alumno.materiasCursadas, materiaActual];

        const leFaltabaAprobarla =
          podriaCursar.correlativas[1].every((mat) => aprobadasMasMateriaActual.includes(mat)) &&
          podriaCursar.correlativas[0].every((mat) => Alumno.materiasCursadas.includes(mat)) &&
          estaCursada(materiaActual);

        const leFaltabaCursarla =
          podriaCursar.correlativas[0].every((mat) => cursadasMasMateriaActual.includes(mat)) &&
          podriaCursar.correlativas[1].every((mat) => Alumno.materiasAprobadas.includes(mat)) &&
          puedeCursar(materiaActual);

        if (leFaltabaCursarla || leFaltabaAprobarla) {
          Array.from(divMateria).forEach((divMat) => {
            if (
              divMat.dataset.idMateria === podriaCursar.idMateria &&
              !divMat.classList.contains("cursada") &&
              !divMat.classList.contains("aprobada") &&
              !divMat.classList.contains("habilitada")
            ) {
              divMat.classList.add("podriaCursar");
            }
          });
        }
      }
    });

    div.addEventListener("mouseout", () => {
      Array.from(divMateria).forEach((divMat) => divMat.classList.remove("podriaCursar"));
    });
  });
}

// Eventos delegados en WRAPPER/document/el form: no dependen de que el tablero ya exista,
// así que se atan una sola vez al arrancar.
function configurarEventosGlobales(): void {
  WRAPPER.addEventListener("click", (e) => {
    const materiaDIV = e.target as HTMLElement;
    if (!materiaDIV.classList.contains("materia")) return;

    const materiaObjeto = obtenerValorObjeto(materiaDIV);
    if (!materiaObjeto) return;

    if (estaAprobada(materiaObjeto)) {
      eliminarMateriaYDependientes(materiaObjeto);
      contar();
    } else if (puedeCursar(materiaObjeto)) {
      Alumno.aproboCursada = materiaObjeto;
    } else if (estaCursada(materiaObjeto)) {
      Alumno.aproboMateria = materiaObjeto;
      contar();
    } else {
      return;
    }

    reseteoVisual();
    persistirCambios();
  });

  WRAPPER.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const materiaDIV = e.target as HTMLElement;
    if (!materiaDIV.classList.contains("materia")) return;
    if (materiaDIV.classList.contains("bloqueada")) return;

    const materiaObjeto = obtenerValorObjeto(materiaDIV);
    if (!materiaObjeto) return;

    if (estaAprobada(materiaObjeto)) {
      eliminarMateriaYDependientes(materiaObjeto);
      contar();
    } else if (estaCursada(materiaObjeto)) {
      Alumno.eliminarMateriaCursada(materiaObjeto);
    }

    reseteoVisual();
    persistirCambios();
  });

  document.addEventListener("keypress", (e) => {
    if (e.key === "r" || e.key === "R") {
      if (!legajoActual) return;
      Alumno.reiniciarMaterias();
      reseteoVisual();
      contar();
      persistirCambios();
    }
  });

  legajoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const legajo = legajoInput.value.trim();
    if (legajo) void cargarPorLegajo(legajo);
  });
}

async function cargarPorLegajo(legajo: string): Promise<void> {
  legajoMensaje.textContent = "Buscando...";

  let plan: PlanResponse | null;
  let estado: EstadoAcademicoResponse | null;
  try {
    [plan, estado] = await Promise.all([fetchPlanEstudios(legajo), fetchEstadoAcademico(legajo)]);
  } catch {
    legajoMensaje.textContent = "Error al consultar SySACAD. Intentá de nuevo.";
    return;
  }

  if (!plan || !estado) {
    legajoMensaje.textContent = "Alumno no encontrado.";
    return;
  }

  // Cargar un legajo reemplaza el tablero y el estado actuales, no los mezcla con lo anterior.
  legajoActual = legajo;
  construirTablero(plan);
  Alumno.reiniciarMaterias();

  // materiasCursadas ya viene unificada con materiasAprobadas desde el reshape boundary del
  // server (una materia aprobada también cuenta como cursada), así que alcanza con este orden.
  for (const idMateria of estado.materiasCursadas) {
    const materia = materiasObjetos.find((m) => m.idMateria === idMateria);
    if (materia) Alumno.aproboCursada = materia;
  }
  for (const idMateria of estado.materiasAprobadas) {
    const materia = materiasObjetos.find((m) => m.idMateria === idMateria);
    if (materia) Alumno.aproboMateria = materia;
  }

  reseteoVisual();
  contar();
  persistirCambios();
  legajoMensaje.textContent = `Estado académico cargado (legajo ${estado.legajo}).`;
}

async function iniciar(): Promise<void> {
  configurarEventosGlobales();

  const legajoGuardado = obtenerLegajoGuardado();
  if (!legajoGuardado) {
    legajoMensaje.textContent = "Ingresá tu legajo para comenzar.";
    return;
  }

  // Restaurar una sesión previa: solo se vuelve a pedir el plan (para reconstruir el
  // tablero de la carrera correspondiente), NO el estado académico — así el progreso
  // manual guardado localmente no se pisa con un fetch "de reemplazo" a SySACAD.
  legajoInput.value = legajoGuardado;
  const plan = await fetchPlanEstudios(legajoGuardado).catch(() => null);
  if (!plan) {
    legajoMensaje.textContent = "Ingresá tu legajo para comenzar.";
    return;
  }

  legajoActual = legajoGuardado;
  construirTablero(plan);
  cargarCambios();
  reseteoVisual();
  contar();
  legajoMensaje.textContent = `Legajo ${legajoGuardado} (progreso local restaurado).`;
}

iniciar().catch((err: unknown) => {
  console.error(err);
  WRAPPER.textContent = "No se pudo cargar el plan de estudios";
});
