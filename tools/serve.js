// Serveur de développement : sert le jeu comme la page publiée (squelette HTML autour de trajectoire.html)
// Usage : node tools/serve.js  puis ouvrir http://localhost:5182
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const PORT = +process.env.PORT || 5182;
const TYPES = {".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".png":"image/png", ".svg":"image/svg+xml", ".webp":"image/webp", ".jpg":"image/jpeg", ".json":"application/json", ".webmanifest":"application/manifest+json"};
const SKELETON = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>';

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/" || url === "/index.html") {
    res.setHeader("content-type", "text/html;charset=utf-8");
    return res.end(SKELETON + fs.readFileSync(path.join(ROOT, "trajectoire.html"), "utf8") + "</body></html>");
  }
  let file = path.join(ROOT, url);
  // un dossier avec index.html (la version web construite dans dist/web) se sert comme un site statique
  if (fs.existsSync(file) && fs.statSync(file).isDirectory() && fs.existsSync(path.join(file, "index.html"))) file = path.join(file, "index.html");
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end("Introuvable"); }
  res.setHeader("content-type", (TYPES[path.extname(file)] || "application/octet-stream") + ";charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(fs.readFileSync(file));
}).listen(PORT, () => console.log(`Trajectoire : http://localhost:${PORT}`));
