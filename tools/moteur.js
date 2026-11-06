// Moteur sans navigateur : charge les scripts du jeu dans un bac à sable Node (vm),
// avec un faux DOM minimal, pour simuler des carrières entières dans les tests et l'équilibrage.
// Les scripts sont lus dans l'ordre de trajectoire.html : c'est la seule liste à tenir à jour.
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");

function scriptList() {
  const html = fs.readFileSync(path.join(ROOT, "trajectoire.html"), "utf8");
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
}

// générateur pseudo-aléatoire reproductible (mulberry32)
function seeded(seed) {
  let a = 0;
  for (const ch of String(seed)) a = Math.imul(a ^ ch.charCodeAt(0), 2654435761);
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// élément factice : retient le HTML écrit et laisse le jeu appeler ses méthodes sans planter
function fakeEl(onHtml) {
  let html = "";
  const el = {
    style: {}, dataset: {}, children: [], textContent: "", value: "", isConnected: true,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    get innerHTML() { return html; },
    set innerHTML(v) { html = String(v); if (onHtml) onHtml(html); },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    appendChild(c) { el.children.push(c); return c; }, remove() {}, append() {},
    querySelector: () => fakeEl(), querySelectorAll: () => [], closest: () => null,
    addEventListener() {}, removeEventListener() {}, focus() {}, blur() {}, click() {}, select() {},
    getContext: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 560 }),
  };
  return el;
}

function createGame({ seed = 1 } = {}) {
  const renders = [], store = new Map();
  const app = fakeEl(h => renders.push(h));
  const document = {
    body: fakeEl(), documentElement: fakeEl(), activeElement: null, fonts: { load: async () => {} },
    querySelector: s => (s === "#app" ? app : fakeEl()), querySelectorAll: () => [],
    // les fenêtres (téléphone, vestiaire…) sont vérifiées comme l'écran principal
    getElementById: () => null, createElement: () => fakeEl(h => renders.push(h)), addEventListener() {}, execCommand() {},
  };
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k), key: i => [...store.keys()][i] ?? null, get length() { return store.size; },
  };
  const ctx = {
    document, localStorage, console, Promise, JSON, Date, Intl, URL, Blob: class {}, TextEncoder, TextDecoder,
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0, cancelAnimationFrame() {}, performance: { now: () => 0 },
    matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {}, removeEventListener() {},
    scrollTo() {}, HTMLButtonElement: function () {}, Image: function () {}, btoa: s => Buffer.from(s, "binary").toString("base64"),
    atob: s => Buffer.from(s, "base64").toString("binary"),
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  // le hasard du jeu devient reproductible : la graine est posée avant le chargement
  ctx.__rnd = seeded(seed);
  vm.runInContext("Math.random = __rnd; delete globalThis.__rnd;", ctx);
  for (const src of scriptList()) {
    const file = path.join(ROOT, src);
    vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: src });
  }
  // un délai maximal transforme une boucle infinie du jeu en erreur signalée
  const run = code => vm.runInContext(code, ctx, { timeout: 3000 });
  return { ctx, run, renders, store, lastRender: () => renders[renders.length - 1] || "" };
}

module.exports = { createGame, scriptList, seeded, ROOT };
