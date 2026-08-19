import { defineConfig } from "vite";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dataDir = fileURLToPath(new URL("../data", import.meta.url));

// Sirve los datos de ejemplo de ./data como si fueran el window.SIMUTN_DATA que SySACAD
// inyectaría en producción. Solo corre en `vite dev` (configureServer no se ejecuta en
// `vite build`), así que estos datos de ejemplo nunca terminan en el bundle final.
function datosDeEjemploPlugin() {
  return {
    name: "simutn-datos-de-ejemplo",
    configureServer(server) {
      server.middlewares.use("/__demo-data/simutn-data.json", async (req, res) => {
        try {
          const [alumno, planEstudios] = await Promise.all([
            readFile(path.join(dataDir, "estado-academico.json"), "utf-8"),
            readFile(path.join(dataDir, "plan-estudios.json"), "utf-8"),
          ]);
          res.setHeader("Content-Type", "application/json");
          res.end(`{"alumno":${alumno},"planEstudios":${planEstudios}}`);
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [datosDeEjemploPlugin()],
});
