import { Alumno, Materia, materiasObjetos } from "./models.js";
import { guardarCambios, restaurarProgresoSimulado } from "./persistencia.js";
import { leerDatosInyectados } from "./datosInyectados.js";

const WRAPPER = document.querySelector("#wrapper");
const contador = document.querySelector("#contador");
const alumnoInfo = document.querySelector("#alumnoInfo");
const estadoMensaje = document.querySelector("#estadoMensaje");

// Esto es una muy mala practica, pero por ahora nos va a servir para tener un acceso rapido a los divs de materias
const divMateria = document.getElementsByClassName("materia");

let cantidadDeMaterias = 0;
let legajoActual = null;

function construirMaterias(pMaterias) {
  pMaterias.forEach((materia) => {
    materiasObjetos.push(new Materia(materia.idMateria, materia.nombre, materia.nivel));
  });
}

function construirCorrelativas(pMaterias) {
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
function agruparPorNivel(pMaterias) {
  const grupos = new Map();
  for (const materia of pMaterias) {
    const lista = grupos.get(materia.nivel) ?? [];
    lista.push(materia);
    grupos.set(materia.nivel, lista);
  }
  return grupos;
}

function dibujarSeccion(pContenedor, pMaterias, opciones) {
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

function dibujarMaterias(pContenedor, pMaterias) {
  const grupos = agruparPorNivel(pMaterias);
  const niveles = [...grupos.keys()].filter((nivel) => nivel > 0).sort((a, b) => a - b);

  niveles.forEach((nivel, indiceAnio) => {
    dibujarSeccion(pContenedor, grupos.get(nivel), {
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

// Construye el tablero para el plan de estudios recibido de SySACAD.
function construirTablero(planEstudios) {
  materiasObjetos.length = 0;
  WRAPPER.innerHTML = "";

  construirMaterias(planEstudios.materias);
  construirCorrelativas(planEstudios.materias);
  dibujarMaterias(WRAPPER, planEstudios.materias);
  configurarHoverMaterias();

  cantidadDeMaterias = materiasObjetos.length;
}

function obtenerValorObjeto(pElemento) {
  const idMateria = pElemento.dataset.idMateria;
  return materiasObjetos.find((materiaObjeto) => materiaObjeto.idMateria === idMateria);
}

function reseteoVisual() {
  const divs = document.querySelectorAll(".materia");
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

function contar() {
  contador.innerHTML = `${Alumno.materiasAprobadas.length} / ${cantidadDeMaterias}`;
  document.documentElement.style.setProperty(
    "--progreso",
    `${(Alumno.materiasAprobadas.length / cantidadDeMaterias) * 100}%`,
  );
  if (cantidadDeMaterias > 0 && Alumno.materiasAprobadas.length === cantidadDeMaterias) {
    alert("Bien ahi wachin, te recibiste!");
  }
}

function eliminarMateriaYDependientes(pMateria) {
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

const estaAprobada = (pMateria) => Alumno.materiasAprobadas.includes(pMateria);
const estaCursada = (pMateria) => Alumno.materiasCursadas.includes(pMateria);

const puedeCursar = (pMateria) => {
  for (const div of Array.from(divMateria)) {
    if (div.dataset.idMateria === pMateria.idMateria) {
      return div.classList.contains("habilitada");
    }
  }
  return false;
};

// Guarda el progreso simulado solo si ya hay un tablero/legajo activo.
function persistirCambios() {
  if (legajoActual) guardarCambios(legajoActual, Alumno);
}

// Los listeners de hover se atan directamente a cada div ".materia" (no están delegados en
// WRAPPER), así que hay que re-atarlos cada vez que el tablero se reconstruye.
function configurarHoverMaterias() {
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

// Eventos delegados en WRAPPER/document: no dependen de que el tablero ya exista,
// así que se atan una sola vez al arrancar.
function configurarEventosGlobales() {
  WRAPPER.addEventListener("click", (e) => {
    const materiaDIV = e.target;
    if (!materiaDIV.classList || !materiaDIV.classList.contains("materia")) return;

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
    const materiaDIV = e.target;
    if (!materiaDIV.classList || !materiaDIV.classList.contains("materia")) return;
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
}

// En dev (npm run dev, fuera de SySACAD) no hay quien inyecte window.SIMUTN_DATA, así que se
// pide al servidor de desarrollo de Vite (ver vite.config.js) los datos de ejemplo de ./data.
// Este fetch nunca ocurre en producción: la rama solo se toma en modo dev y el endpoint no
// existe en el build final.
async function cargarDatosDeDesarrollo() {
  const res = await fetch("/__demo-data/simutn-data.json");
  if (!res.ok) return null;
  window.SIMUTN_DATA = await res.json();
  return true;
}

async function iniciar() {
  configurarEventosGlobales();

  let datos = leerDatosInyectados();
  let esDemo = false;

  if (!datos && import.meta.env.DEV) {
    esDemo = await cargarDatosDeDesarrollo().catch(() => null);
    datos = leerDatosInyectados();
  }

  if (!datos) {
    estadoMensaje.textContent =
      "No se recibieron datos académicos. SimUTN debe abrirse desde el menú de SySACAD.";
    return;
  }

  legajoActual = datos.alumno.legajo;

  alumnoInfo.textContent = `${datos.alumno.nombre} · Legajo ${datos.alumno.legajo} · ${datos.planEstudios.nombre}`;

  construirTablero(datos.planEstudios);
  Alumno.reiniciarMaterias();

  // 1) Estado real inyectado por SySACAD (fuente de verdad, siempre fresco en esta carga).
  for (const idMateria of datos.materiasCursadas) {
    const materia = materiasObjetos.find((m) => m.idMateria === idMateria);
    if (materia) Alumno.aproboCursada = materia;
  }
  for (const idMateria of datos.materiasAprobadas) {
    const materia = materiasObjetos.find((m) => m.idMateria === idMateria);
    if (materia) Alumno.aproboMateria = materia;
  }

  // 2) Progreso simulado por el alumno más allá de lo real, guardado en visitas anteriores.
  restaurarProgresoSimulado(legajoActual, Alumno, materiasObjetos);

  reseteoVisual();
  contar();
  persistirCambios();
  estadoMensaje.textContent = esDemo ? "Modo demo local (datos de ejemplo de ./data)." : "";
}

iniciar().catch((err) => {
  console.error(err);
  WRAPPER.textContent = "No se pudo cargar el plan de estudios.";
});
