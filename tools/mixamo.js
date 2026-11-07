// Atelier Mixamo : convertit les fichiers FBX de a-integrer/mixamo en un fichier léger pour le jeu (img/3d/*.glb)
// Usage : node tools/mixamo.js  puis ouvrir http://localhost:5183/tools/mixamo.html
// La conversion se fait dans la page (Three.js lit le FBX, réduit les textures et les animations, écrit un GLB) ;
// ce serveur sert les fichiers du projet et enregistre le résultat, uniquement dans img/3d/.
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, ".."), OUT = path.join(ROOT, "img", "3d");
const PORT = +process.env.PORT || 5183;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".glb": "model/gltf-binary" };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (req.method === "POST" && url.startsWith("/enregistrer/")) {
    const name = path.basename(url.slice("/enregistrer/".length));
    if (!/^[\w.-]+\.(glb|json)$/.test(name)) { res.statusCode = 400; return res.end("nom refusé"); }
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      fs.mkdirSync(OUT, { recursive: true });
      const buf = Buffer.concat(chunks);
      fs.writeFileSync(path.join(OUT, name), buf);
      console.log(`img/3d/${name} : ${(buf.length / 1024).toFixed(0)} Ko`);
      res.end("ok");
    });
    return;
  }
  // la liste des FBX disponibles
  if (url === "/liste-fbx") {
    const files = [];
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => e.isDirectory() ? walk(path.join(d, e.name)) : /\.fbx$/i.test(e.name) && files.push(path.relative(ROOT, path.join(d, e.name)).replace(/\\/g, "/")));
    walk(path.join(ROOT, "a-integrer", "mixamo"));
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(files));
  }
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end("Introuvable"); }
  res.setHeader("content-type", TYPES[path.extname(file)] || "application/octet-stream");
  res.setHeader("cache-control", "no-store");
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Atelier Mixamo : http://localhost:${PORT}/tools/mixamo.html`));
