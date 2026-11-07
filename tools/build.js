// Version web installable : une vraie page index.html autour de trajectoire.html, avec manifeste d'application,
// icônes et service worker (jeu jouable hors connexion), dans dist/web ; puis une archive pour itch.io.
// Usage : npm run build           →  dist/web/ et dist/trajectoire-itch.zip
//         node tools/build.js --sans-zip   (déploiement GitHub Pages : seul dist/web compte)
// Hors de claude.ai, tout le jeu fonctionne sauf les classements et records partagés (ils demandent window.claude).
const fs = require("fs"), path = require("path"), crypto = require("crypto"), { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, ".."), DIST = path.join(ROOT, "dist"), OUT = path.join(DIST, "web");
const ZIP = path.join(DIST, "trajectoire-itch.zip");
const BG = "#0b0d2a";

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const dir of ["css", "js", "img", "anim"]) fs.cpSync(path.join(ROOT, dir), path.join(OUT, dir), { recursive: true });

// manifeste : nom, couleurs, icônes ; l'icône 512 sert aussi d'icône « maskable » (le dessin tient dans la zone sûre)
fs.writeFileSync(path.join(OUT, "manifest.webmanifest"), JSON.stringify({
  name: "Trajectoire", short_name: "Trajectoire", lang: "fr",
  description: "Jeu de carrière de footballeur, de 16 ans à la retraite.",
  start_url: "./", scope: "./", display: "standalone", orientation: "portrait",
  background_color: BG, theme_color: BG,
  icons: [
    { src: "img/app/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "img/app/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "img/app/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
}, null, 2));

// le titre et les métadonnées vont dans <head>, le reste de trajectoire.html dans <body>
const page = fs.readFileSync(path.join(ROOT, "trajectoire.html"), "utf8");
const head = page.match(/^\s*<title>[\s\S]*?(?=<div id="app">)/)?.[0] || "<title>Trajectoire</title>";
const body = page.slice(head.length);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Jeu de carrière de footballeur, de 16 ans à la retraite : choix, matchs en direct, penalties, mercato, vie perso.">
<meta name="theme-color" content="${BG}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="img/app/favicon-32.png">
<link rel="apple-touch-icon" href="img/app/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Trajectoire">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
${head.trim()}
</head>
<body>
${body.trim()}
</body>
</html>
`);

// service worker : tous les fichiers du jeu en cache, version = empreinte du contenu (une nouvelle version remplace l'ancienne)
const files = [];
const walk = d => fs.readdirSync(d).forEach(f => { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(path.relative(OUT, p).replace(/\\/g, "/")); });
walk(OUT);
const hash = crypto.createHash("sha256");
for (const f of files.sort()) hash.update(f).update(fs.readFileSync(path.join(OUT, f)));
fs.writeFileSync(path.join(OUT, "sw.js"), `// Généré par tools/build.js : le jeu en cache pour jouer hors connexion
const CACHE = "trajectoire-${hash.digest("hex").slice(0, 12)}";
const FILES = ${JSON.stringify(["./", ...files])};
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// d'abord le cache ; sinon le réseau, et les polices et bibliothèques externes sont gardées pour la prochaine fois
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => {
    if (res.ok && (new URL(r.url).origin === location.origin || /fonts\\.(googleapis|gstatic)\\.com|cdnjs\\.cloudflare\\.com|cdn\\.jsdelivr\\.net/.test(r.url))) {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy));
    }
    return res;
  }).catch(() => r.mode === "navigate" ? caches.match("./") : Response.error())));
});
`);

// .nojekyll : GitHub Pages sert les fichiers tels quels
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

if (!process.argv.includes("--sans-zip")) {
  fs.rmSync(ZIP, { force: true });
  if (process.platform === "win32")
    execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${OUT}\\*' -DestinationPath '${ZIP}'`], { stdio: "inherit" });
  else execFileSync("zip", ["-qr", ZIP, "."], { cwd: OUT, stdio: "inherit" });
  console.log(`Archive itch.io : ${path.relative(ROOT, ZIP)} (${(fs.statSync(ZIP).size / 1024 / 1024).toFixed(1)} Mo)`);
}
console.log(`Version web installable : ${path.relative(ROOT, OUT)} (${files.length + 1} fichiers). Test : npm start, puis http://localhost:5182/dist/web/`);
