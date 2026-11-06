// Rapport d'équilibrage : simule des centaines de carrières et résume ce qu'elles donnent, poste par poste.
// Usage : npm run equilibrage  (ou node tools/equilibrage.js 400 pour choisir le nombre de carrières)
//         npm run equilibrage -- --rapide        30 carrières, pour un coup d'œil après un changement
//         npm run equilibrage -- 200 1 --graines 3  trois séries de 200 (graines 1, 10001, 20001) réunies :
//         un écart qui tient sur plusieurs graines n'est pas du bruit
const { simulate, POSITIONS } = require("./simulateur");

const args = process.argv.slice(2), flag = k => args.indexOf(k);
const quick = flag("--rapide") >= 0;
const gi = flag("--graines"), nSeeds = gi >= 0 ? Math.max(1, +args[gi + 1] || 3) : 1;
const nums = args.filter((a, i) => /^\d+$/.test(a) && (gi < 0 || i !== gi + 1));
const n = +nums[0] || (quick ? 30 : 200);
const t0 = Date.now();
const seed0 = +nums[1] || 1;
// --json : mode interne, une série de graines dans ce processus, résultats bruts sur la sortie
if (flag("--json") >= 0) { process.stdout.write(JSON.stringify(simulate(n, { seed0 }))); process.exit(0); }
// chaque série tourne dans son propre processus : un seul processus pour 600 carrières sature la mémoire
const { execFileSync } = require("child_process");
const results = [];
for (let k = 0; k < nSeeds; k++)
  results.push(...JSON.parse(execFileSync(process.execPath, [__filename, String(n), String(seed0 + k * 10000), "--json"], { maxBuffer: 1 << 28, encoding: "utf8" })));
const issues = results.flatMap(r => r.issues);
const all = results.map(r => r.stats).filter(Boolean);

const avg = (rows, f) => rows.length ? rows.reduce((a, r) => a + f(r), 0) / rows.length : 0;
const pct = (rows, f) => Math.round(100 * avg(rows, r => (f(r) ? 1 : 0))) + " %";
const fmt = v => (typeof v === "number" ? v.toFixed(1) : v);

console.log(`\n${results.length} carrières simulées${nSeeds > 1 ? ` (${nSeeds} graines)` : ""} en ${((Date.now() - t0) / 1000).toFixed(1)} s\n`);
const lines = [
  ["Saisons jouées", r => r.seasons],
  ["Âge de la retraite", r => r.age],
  ["Niveau max", r => r.peak],
  ["Niveau max ≥ 80", null, r => r.peak >= 80],
  ["Niveau max ≥ 88", null, r => r.peak >= 88],
  ["Ballons d'Étoile", r => r.stars],
  ["Trophées", r => r.trophies],
  ["Buts (ou clean sheets)", r => (r.pos === "GB" ? r.clean : r.goals)],
  ["Sélections", r => r.caps],
  ["Gains (k€)", r => r.money],
  ["Événements vécus", r => r.events],
  ["Événements différents", r => r.distinct],
  ["Même événement, au pire", r => r.maxRepeat],
  ["Déjà vus à la carrière d'avant", null, null, r => r.dejaVu],
  ["Échos du passé", r => r.echoes],
  ["Tournois internationaux joués", r => r.tourneys],
  ["Tournois internationaux gagnés", r => r.intl],
  ["Coupes des Champions gagnées", r => r.cdc],
  ["Matchs de saison joués", r => r.ord],
  ["Appels urgents", r => r.urg],
];
const groups = [["Tous", all], ...POSITIONS.map(p => [p, all.filter(r => r.pos === p)])];
const pad = (s, w) => String(s).padStart(w);
console.log(pad("", 32) + groups.map(([g]) => pad(g, 9)).join(""));
const share = (rows, f) => { const v = rows.map(f).filter(x => x != null); return v.length ? Math.round(100 * v.reduce((a, b) => a + b, 0) / v.length) + " %" : "–"; };
for (const [label, f, cond, part] of lines)
  console.log(label.padEnd(32) + groups.map(([, rows]) => pad(part ? share(rows, part) : cond ? pct(rows, cond) : fmt(avg(rows, f)), 9)).join(""));

const after = {};
all.forEach(r => (after[r.after || "?"] = (after[r.after || "?"] || 0) + 1));
console.log("\nAprès-carrière : " + Object.entries(after).map(([k, v]) => `${k} ${v}`).join(" · "));

console.log(`\n${issues.length} problème(s) relevé(s)`);
const seen = new Set();
for (const i of issues) {
  const key = i.kind + i.detail.slice(0, 70);
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`- [graine ${i.seed}] ${i.kind} : ${i.detail.slice(0, 400)}`);
}
process.exitCode = issues.length ? 1 : 0;
