// Arma un único archivo HTML autocontenido (CSS, JS e imágenes inlineados) con los datos de
// ejemplo de ./data ya "inyectados" como lo haría SySACAD, para poder mandárselo a alguien y que
// lo abra con doble clic, sin instalar nada ni levantar ningún servidor.
//
// Uso: npm run demo   (corre primero `vite build`, después este script)

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientDir = fileURLToPath(new URL("..", import.meta.url));
const dataDir = path.join(clientDir, "..", "data");
const distDir = path.join(clientDir, "dist");
const demoDir = path.join(clientDir, "demo");

function mimeDePng() {
  return "image/png";
}

async function comoDataUri(rutaAbsoluta) {
  const buffer = await readFile(rutaAbsoluta);
  return `data:${mimeDePng()};base64,${buffer.toString("base64")}`;
}

async function main() {
  let html = await readFile(path.join(distDir, "index.html"), "utf-8");

  // Encontrar el JS y CSS que Vite generó (el nombre lleva un hash, así que no es fijo).
  const assetsDir = path.join(distDir, "assets");
  const archivosAssets = await readdir(assetsDir);
  const nombreJs = archivosAssets.find((f) => f.endsWith(".js"));
  const nombreCss = archivosAssets.find((f) => f.endsWith(".css"));

  let js = await readFile(path.join(assetsDir, nombreJs), "utf-8");
  let css = await readFile(path.join(assetsDir, nombreCss), "utf-8");

  // Inlinear las imágenes referenciadas por ruta absoluta /images/*.png como data URIs, tanto
  // en el HTML (favicon, ícono del eyebrow) como en el CSS (textura de fondo de las materias).
  const imagesDir = path.join(clientDir, "public", "images");
  for (const nombreImagen of await readdir(imagesDir)) {
    const dataUri = await comoDataUri(path.join(imagesDir, nombreImagen));
    const referencia = `/images/${nombreImagen}`;
    html = html.split(referencia).join(dataUri);
    css = css.split(referencia).join(dataUri);
  }

  // Reemplazar los <link>/<script> que apuntan a los archivos generados por versiones inline.
  html = html.replace(
    /<script type="module" crossorigin src="\/assets\/[^"]+"><\/script>/,
    `<script type="module">\n${js}\n</script>`,
  );
  html = html.replace(
    /<link rel="stylesheet" crossorigin href="\/assets\/[^"]+">/,
    `<style>\n${css}\n</style>`,
  );

  // Simular exactamente lo que SySACAD debería inyectar: un <script> clásico al final del body
  // con los datos reales del alumno y el plan de estudios (ver client/src/datosInyectados.js).
  const [alumno, planEstudios] = await Promise.all([
    readFile(path.join(dataDir, "estado-academico.json"), "utf-8"),
    readFile(path.join(dataDir, "plan-estudios.json"), "utf-8"),
  ]);
  const scriptDeDatos = `<script>\n  window.SIMUTN_DATA = { "alumno": ${alumno.trim()}, "planEstudios": ${planEstudios.trim()} };\n</script>\n`;
  html = html.replace("</body>", `${scriptDeDatos}</body>`);

  await mkdir(demoDir, { recursive: true });
  const destino = path.join(demoDir, "SimUTN-demo.html");
  await writeFile(destino, html, "utf-8");

  console.log(`Demo autocontenida generada en: ${destino}`);
  console.log("Contiene datos de ejemplo reales de ./data — no la subas a un repo público.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
