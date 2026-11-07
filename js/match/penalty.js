// Trajectoire · Coups de pied arrêtés jouables : penalty (tir ou plongeon), séance de tirs au but, coup franc (tir ou arrêt)
// Moteur repris de Penalty de Minuit (même dessin du but, du gardien et du ballon), adapté aux matchs de carrière.
// Penalty.play({mode, skill, pressure, title, sub, us, them, youGK, number, weather}) renvoie une promesse {success, us, them, mine}.
// mode : "shoot" (tu tires), "save" (tu plonges), "shootout" (séance), "fk" (tu tires le coup franc), "fksave" (tu l'arrêtes)
// Images des mini-jeux (tribunes, ballon, pelouse vue du ciel), partagées avec duel.js : chargées une fois et dessinées
// dès qu'elles sont prêtes ; sans elles (premier lancement hors ligne, tests), le dessin d'origine prend le relais.
const MINI_IMG = {};
function miniImg(name, onload) {
  if (typeof Image === "undefined") return null;
  let im = MINI_IMG[name];
  if (!im) { im = MINI_IMG[name] = new Image(); im.decoding = "async"; im.src = "img/" + name + ".webp"; }
  if (onload && !im.complete && im.addEventListener) im.addEventListener("load", onload, { once: true });
  return im.complete && im.naturalWidth ? im : null;
}
const Penalty = (() => {
  const W = 800, H = 560;
  const G = { l: 230, r: 570, t: 120, b: 262 };
  const SPOT = { x: 400, y: 478 };
  const HOME = { x: 400, y: 214 };
  const REST = { x: SPOT.x, y: SPOT.y - 13, r: 15, gy: SPOT.y + 2 };
  // coup franc : ballon décalé, mur à mi-chemin (en profondeur), gardien qui couvre le côté opposé au mur
  const FK = { y: 500, wallY: 425, wallU: 0.36, half: 60, top: 342, curlPx: 120 };
  const STYLES = { place: "Placé", force: "En force", panenka: "Panenka" };
  // caméra rapprochée derrière le tireur : le monde (but, gardien, ballon) est agrandi autour de ce point,
  // les jauges et les textes restent à l'échelle de l'écran
  const CAM = { s: 1.28, x: 400, y: 300 };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const snd = n => { if (typeof sfx === "function") sfx(n); };
  const say = t => { if (typeof speak === "function") speak(t); };

  /** @type {any} */
  let S = null;

  // ---------- déroulé ----------
  function play(opts) {
    const wait = typeof Stade3D !== "undefined" ? Stade3D.whenReady(1200) : Promise.resolve(false);
    return wait.then(() => start(opts));
  }
  function start(opts) {
    return new Promise(resolve => {
      if (S) { const old = S; close(); old.resolve({ success: false, us: 0, them: 0, mine: old.mine }); }
      S = { opts, resolve, us: [], them: [], kickIndex: 0, kick: null, flash: null, netShake: 0, state: "intro", t0: performance.now(), now: performance.now(), aim: null, power: 0,
        shake: 0, trail: [], parts: [], swipe: null, dt: 16,
        style: "place", curl: 0, mine: { shots: 0, goals: 0, faced: 0, saves: 0 }, kHome: HOME,
        pref: Math.random() < 0.5 ? -1 : 1, fkSide: Math.random() < 0.5 ? -1 : 1 };
      if (isFk()) {
        // le mur se place entre le ballon et le poteau le plus proche ; le gardien se décale de l'autre côté
        // chaque coup franc est différent : plus il est axial, plus le mur est grand
        S.fkOff = rnd(75, 165);
        const r = rest(), cx = lerp(r.x, 400 + S.fkSide * 80, FK.wallU), n = S.fkOff < 105 ? 5 : S.fkOff < 140 ? 4 : 3;
        S.wall = { cx, half: n * 15, top: FK.top, xs: Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * 30), jumping: false };
        S.kHome = { x: HOME.x - S.fkSide * 40, y: HOME.y };
      }
      build();
      S.prepStart = S.now;
      if (typeof crowdHush === "function") crowdHush(true);
      hint(opts.mode === "save" || opts.mode === "fksave" ? "Concentre-toi…" : opts.mode === "shoot" ? "Le stade retient son souffle…" : opts.mode === "fk" ? "L'arbitre recule le mur de neuf mètres…" : "Les deux équipes se rassemblent au rond central…");
      snd("whistle");
      S.raf = requestAnimationFrame(frame);
    });
  }

  const isFk = () => S.opts.mode === "fk" || S.opts.mode === "fksave";
  const rest = () => isFk() ? { x: 400 + S.fkSide * (S.fkOff || 120), y: FK.y - 11, r: 13, gy: FK.y + 2 } : REST;

  function turn() {
    const o = S.opts;
    if (o.mode === "shoot") return { side: "us", ctl: "shoot" };
    if (o.mode === "fk") return { side: "us", ctl: "fk" };
    if (o.mode === "save" || o.mode === "fksave") return { side: "them", ctl: "dive" };
    const usTurn = S.kickIndex % 2 === 0;
    if (usTurn) return { side: "us", ctl: "shoot", mine: !o.youGK && (S.us.length === (S.myRank || 0) || (S.us.length >= 5 && S.us.length % 3 === 2)) };
    return { side: "them", ctl: "dive", mine: !!o.youGK };
  }

  const goals = a => a.filter(Boolean).length;
  function decided() {
    const o = S.opts;
    if (o.mode === "shoot" || o.mode === "fk") return S.us.length ? (S.us[0] ? "us" : "them") : null;
    if (o.mode === "save" || o.mode === "fksave") return S.them.length ? (S.them[0] ? "them" : "us") : null;
    const yg = goals(S.us), cg = goals(S.them), yt = S.us.length, ct = S.them.length;
    if (yt <= 5 && ct <= 5 && !(yt === 5 && ct === 5)) {
      if (yg + (5 - yt) < cg) return "them";
      if (cg + (5 - ct) < yg) return "us";
      return null;
    }
    if (yt === ct) { if (yg > cg) return "us"; if (cg > yg) return "them"; }
    return null;
  }

  function nextKick() {
    S.flash = null; S.kick = null; S.netShake = 0;
    const w = decided();
    if (w) return finish(w);
    if (S.opts.mode === "shootout" && !S.opts.youGK && S.myRank == null) { S.state = "rank"; showGroup(".pen-rank", true); hint("Quel tireur veux-tu être ?"); renderBoard(); return; }
    S.turn = turn();
    S.style = "place"; S.tell = 0;
    if (S.turn.ctl === "shoot") { S.state = "style"; showStyles(true); hint(S.opts.mode === "shootout" ? (S.turn.mine ? "C'est TON tir ! Glisse le doigt depuis le ballon, ou choisis : 1, 2 ou 3." : `Tir n°${S.us.length + 1} de ton équipe : glisse le doigt depuis le ballon.`) : "Glisse le doigt depuis le ballon vers le but, ou choisis : 1 Placé · 2 En force · 3 Panenka"); }
    else if (S.turn.ctl === "fk") { S.state = "aim"; S.t0 = S.now; hint("Glisse depuis le ballon en courbant le geste pour enrouler, ou clique pour viser"); }
    else {
      S.state = "prep"; S.prepStart = S.now;
      if (S.turn.ctl === "dive") {
        // le tir adverse est décidé dès l'élan : ses appuis le trahissent… sauf quand il feinte
        if (S.opts.mode === "shootout") S.pref = Math.random() < 0.5 ? -1 : 1; // chaque tireur a son côté préféré
        S.planned = isFk() ? planCpuFk() : planCpuPen();
        const real = isFk() || Math.abs(S.planned.tx - 400) < 60 ? 0 : Math.sign(S.planned.tx - 400);
        S.tell = Math.random() < 0.3 - S.opts.skill * 0.15 ? -real : real;
      }
      hint(S.turn.ctl === "dive" ? (isFk() ? `${S.opts.them.short || "L'adversaire"} s'élance… suis le ballon !` : S.opts.mode === "shootout" ? `Fiche du tireur : souvent côté ${(Math.random() < 0.7 + S.opts.skill * 0.25 ? S.pref : -S.pref) < 0 ? "gauche ◀" : "droit ▶"}. Regarde ses appuis !` : `${S.opts.them.short || "L'adversaire"} s'élance… regarde ses appuis et plonge !`) : S.turn.side === "us" ? "Un coéquipier s'avance…" : `${S.opts.them.short || "L'adversaire"} s'avance…`);
    }
    renderBoard();
  }

  // tension du moment : séance qui bascule en mort subite, dernier tir, enjeu du match. Le sang-froid (skill) l'atténue.
  function pressureNow() {
    const o = S.opts;
    let pr = o.pressure || 0;
    if (o.mode === "shootout") pr += S.us.length >= 5 ? 0.25 : S.us.length === 4 ? 0.15 : 0;
    return cl(pr * (1 - o.skill * 0.5), 0, 1);
  }

  function showStyles(on) { showGroup(".pen-shot", on); }
  function chooseRank(r) {
    if (!S || S.state !== "rank") return;
    S.myRank = r; showGroup(".pen-rank", false);
    if (r === 4) S.opts.pressure = Math.min(0.9, (S.opts.pressure || 0) + 0.2);
    nextKick();
  }
  function showGroup(sel, on) {
    const box = S.el.querySelector(sel);
    const had = box.contains(document.activeElement);
    box.hidden = !on;
    if (on) box.querySelector("button").focus({ preventScroll: true });
    else if (had) S.cv.focus({ preventScroll: true });
  }
  function chooseStyle(st) {
    if (!S || S.state !== "style") return;
    S.style = st; showStyles(false);
    if (st === "panenka") { S.state = "panenka"; S.t0 = S.now; hint("Panenka… tout en douceur"); return; }
    S.state = "aim"; S.t0 = S.now;
    hint(st === "force" ? "En force : glisse depuis le ballon, ou fixe le viseur qui file plus vite" : "Glisse depuis le ballon vers le but, ou clique pour fixer le viseur");
  }

  function finish(w) {
    S.state = "end";
    const o = S.opts, won = w === "us";
    const msg = o.mode === "shoot" ? (won ? "Penalty transformé !" : "Penalty manqué…")
      : o.mode === "save" ? (won ? "Penalty arrêté !" : "Le penalty est transformé…")
      : o.mode === "fk" ? (won ? "Coup franc au fond des filets !" : "Coup franc manqué…")
      : o.mode === "fksave" ? (won ? "Coup franc repoussé !" : "Le coup franc est au fond…")
      : (won ? `Victoire aux tirs au but ${goals(S.us)}-${goals(S.them)} !` : `Défaite aux tirs au but ${goals(S.us)}-${goals(S.them)}…`);
    hint(msg);
    if (o.mode === "shootout") say(msg);
    const session = S;
    setTimeout(() => {
      if (S !== session) return; // une autre séance a déjà pris la place
      const r = S.resolve, res = { success: won, us: goals(S.us), them: goals(S.them), mine: S.mine, skipped: !!S.skipped };
      close(); r(res);
    }, o.mode === "shootout" ? 1800 : 1100);
  }

  // simulation instantanée (bouton « Simuler ») : même logique de probabilité que le jeu
  function skip() {
    if (!S || S.state === "end") return;
    S.skipped = true;
    const o = S.opts, k = o.skill, M = S.mine;
    showStyles(false); showGroup(".pen-rank", false);
    const mineShot = ok => { M.shots++; if (ok) M.goals++; return ok; }, mineFace = goal => { M.faced++; if (!goal) M.saves++; return goal; };
    if (o.mode === "shoot") { S.us = [mineShot(Math.random() < .58 + k * .3)]; return finish(S.us[0] ? "us" : "them"); }
    if (o.mode === "save") { S.them = [mineFace(Math.random() > .14 + k * .2)]; return finish(S.them[0] ? "them" : "us"); }
    if (o.mode === "fk") { S.us = [mineShot(Math.random() < .25 + k * .3)]; return finish(S.us[0] ? "us" : "them"); }
    if (o.mode === "fksave") { S.them = [mineFace(Math.random() > .55 + k * .2)]; return finish(S.them[0] ? "them" : "us"); }
    let guard = 0;
    while (!decided() && guard++ < 40) {
      if (S.kickIndex % 2 === 0) { const ok = Math.random() < (o.youGK ? .74 : .74 + k * .08); S.us.push(!o.youGK && S.us.length === (S.myRank || 0) ? mineShot(ok) : ok); }
      else { const goal = Math.random() < (o.youGK ? .8 - k * .12 : .74); S.them.push(o.youGK ? mineFace(goal) : goal); }
      S.kickIndex++;
    }
    renderBoard();
    finish(decided() || "them");
  }

  // ---------- interface ----------
  function build() {
    const o = S.opts, el = document.createElement("div");
    el.className = "penmode" + (o.mode === "shootout" ? " shootout" : "");
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", o.title);
    const shootHelp = "Au doigt ou à la souris : glisse depuis le ballon vers le but. La direction choisit le coin, la vitesse donne la puissance, un geste plus long monte le ballon. Ou choisis ton tir (1, 2 ou 3) puis clique (ou Espace) pour viser, puis pour la puissance. Trop fort, et le ballon s'envole.";
    const help = o.mode === "save" ? "Le tireur peut trahir son côté dans ses appuis… ou feinter. Quand il frappe, clique là où part le ballon. Au clavier : ← ↑ →."
      : o.mode === "shoot" ? shootHelp
      : o.mode === "fk" ? "Glisse depuis le ballon en courbant ton geste : la courbe donne l'effet autour du mur, un geste lent lobe le mur. Ou trois clics (ou Espace) : la cible, la puissance, puis l'effet."
      : o.mode === "fksave" ? "Le ballon passe au-dessus ou autour du mur : clique là où il va, ou ← ↑ →. Attention à l'effet !"
      : "Tu tires tous les penalties de ton équipe et tu plonges sur ceux d'en face (clique où part le ballon, ou ← ↑ →). " + shootHelp;
    // aide de la sous-ligne : le rapport du staff sur le tireur adverse, plus ou moins fiable
    let sub = o.sub || "";
    if (o.mode === "save") {
      const right = Math.random() < 0.7 + o.skill * 0.25 ? S.pref : -S.pref;
      sub += ` Ton entraîneur des gardiens : « Il tire souvent côté ${right < 0 ? "gauche ◀" : "droit ▶"}. »`;
    }
    el.innerHTML = `<div class="pen-wrap">
      <div class="pen-top"><div class="pen-titles"><p class="pen-eyebrow"></p><p class="pen-sub"></p></div><div class="pen-board" aria-live="polite"></div></div>
      <div class="pen-stage"><canvas width="800" height="560" tabindex="0" role="img" aria-label="Le but, le gardien et le ballon. Espace pour viser et frapper, flèches pour plonger."></canvas></div>
      <p class="pen-hint" aria-live="polite"></p>
      <div class="pen-styles pen-rank" role="group" aria-label="Ton rang de tireur" hidden><button type="button" data-rank="0"><kbd>1</kbd>Tirer en premier<small>Ouvrir la séance, donner le ton</small></button><button type="button" data-rank="4"><kbd>2</kbd>Tirer le cinquième<small>Le tir qui peut tout décider. Pression maximale</small></button></div>
      <div class="pen-styles pen-shot" role="group" aria-label="Type de tir" hidden>${Object.entries(STYLES).map(([k, n], i) => `<button type="button" data-style="${k}"><kbd>${i + 1}</kbd>${n}<small>${{ place: "Précis, tu choisis ton coin", force: "Imparable s'il est cadré, mais plus dur à viser", panenka: "Une pichenette au centre : génial ou ridicule" }[k]}</small></button>`).join("")}</div>
      <div class="pen-foot"><p class="pen-help"></p><button class="pen-skip" type="button">⏩ Simuler</button></div></div>`;
    el.querySelector(".pen-eyebrow").textContent = o.title;
    el.querySelector(".pen-sub").textContent = sub;
    el.querySelector(".pen-help").textContent = help;
    document.body.appendChild(el);
    S.el = el; S.cv = el.querySelector("canvas"); S.ctx = S.cv.getContext("2d");
    S.v3 = typeof Stade3D !== "undefined" && Stade3D.ok() ? Stade3D.attach(el.querySelector(".pen-stage"), o) : null;
    // au doigt : glisser depuis le ballon tire (direction = coin, vitesse = puissance, courbe = effet) ; un simple appui joue comme avant
    S.cv.addEventListener("pointerdown", e => {
      const w = toWorld(e);
      if (canSwipe() && Math.hypot(w.x - rest().x, w.y - rest().y) < 150) {
        S.swipe = { x0: w.x, y0: w.y, t0: performance.now(), pts: [w], cur: w, s0: toScreen(e), s1: toScreen(e) };
        try { S.cv.setPointerCapture(e.pointerId); } catch (err) {}
        return;
      }
      act(w.x, w.y);
    });
    S.cv.addEventListener("pointermove", e => { if (S && S.swipe) { const w = toWorld(e); S.swipe.cur = w; S.swipe.s1 = toScreen(e); if (S.swipe.pts.length < 60) S.swipe.pts.push(w); } });
    const up = e => { if (S && S.swipe) { S.swipe.cur = toWorld(e); S.swipe.s1 = toScreen(e); swipeShoot(); } };
    S.cv.addEventListener("pointerup", up);
    S.cv.addEventListener("pointercancel", () => { if (S) S.swipe = null; });
    el.querySelector(".pen-skip").addEventListener("click", skip);
    el.querySelectorAll(".pen-rank button").forEach(b => b.addEventListener("click", () => chooseRank(+/** @type {HTMLElement} */ (b).dataset.rank)));
    el.querySelectorAll(".pen-shot button").forEach(b => b.addEventListener("click", () => chooseStyle(/** @type {HTMLElement} */ (b).dataset.style)));
    S.onKey = e => {
      if (!S) return;
      e.stopPropagation();
      const keys = { ArrowLeft: [G.l + 55, 200], ArrowRight: [G.r - 55, 200], ArrowUp: [400, 150], ArrowDown: [400, 225] };
      if (S.state === "rank" && /^[12]$/.test(e.key)) { e.preventDefault(); chooseRank(e.key === "1" ? 0 : 4); return; }
      if (S.state === "style" && /^[123]$/.test(e.key)) { e.preventDefault(); chooseStyle(Object.keys(STYLES)[+e.key - 1]); return; }
      if (e.code === "Space" || e.key === "Enter") { if (document.activeElement?.closest(".pen-skip,.pen-styles")) return; e.preventDefault(); act(null, null); }
      else if (keys[e.key]) { e.preventDefault(); if (S.state === "flight") act(keys[e.key][0], keys[e.key][1]); }
    };
    addEventListener("keydown", S.onKey, true);
    resize(); renderBoard();
    // le focus va au terrain : Espace y vise et frappe ; le bouton « Simuler » reste atteignable avec Tab
    S.cv.focus({ preventScroll: true });
  }

  function close() {
    if (!S) return;
    cancelAnimationFrame(S.raf);
    removeEventListener("keydown", S.onKey, true);
    if (S.v3) S.v3.detach();
    S.el.remove();
    if (typeof crowdHush === "function") crowdHush(false);
    S = null;
  }

  function hint(t) { if (S) S.el.querySelector(".pen-hint").textContent = t; }

  // ---------- caméra et tir au doigt ----------
  // décalage de la caméra (secousse sur un but) et passage écran → monde pour les clics et les glissés
  const shakeAt = () => S.shake > 0 && !reduceMotion ? { x: Math.sin(S.now * 0.09) * 9 * S.shake, y: Math.cos(S.now * 0.11) * 7 * S.shake } : { x: 0, y: 0 };
  function camOrigin() { const sh = shakeAt(); return { x: CAM.x - CAM.x * CAM.s + sh.x, y: CAM.y - CAM.y * CAM.s + sh.y }; }
  function toScreen(e) { const r = S.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function toWorld(e) {
    const r = S.cv.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * W, sy = (e.clientY - r.top) / r.height * H, o = camOrigin();
    if (S.v3) return S.v3.toWorld(sx, sy, S.state === "flight");
    return { x: (sx - o.x) / CAM.s, y: (sy - o.y) / CAM.s };
  }
  const canSwipe = () => S.turn && (S.turn.ctl === "shoot" || S.turn.ctl === "fk") && (S.state === "style" || S.state === "aim");
  function swipeShoot() {
    const s = S.swipe; S.swipe = null;
    if (!canSwipe()) return;
    const e = s.cur, dx = e.x - s.x0, dy = e.y - s.y0, len = Math.hypot(dx, dy), ms = Math.max(60, performance.now() - s.t0);
    // trop court ou vers le bas : c'est un appui, il garde son rôle d'origine (choisir le tir placé, fixer le viseur)
    if (len < 28 || dy > -20) { act(e.x, e.y); return; }
    if (S.state === "style") { S.style = "place"; showStyles(false); }
    // le geste est prolongé jusqu'au but, adouci (0,62) pour qu'un geste naturel vise le coin plutôt que le poteau
    const b = rest(), toGoal = (b.y - 191) / -dy * 0.62;
    const p = cl((len / ms - 0.22) / 1.1, 0.12, 1), height = cl((len - 70) / 200, 0, 1);
    // le talent et la pression décident de la précision du geste
    const err = (1 - S.opts.skill) * 14 + pressureNow() * 18;
    S.aim = { x: cl(b.x + dx * toGoal, 120, 680) + rnd(-err, err), y: G.b - 12 - height * (G.b - G.t - 24) + rnd(-err, err) };
    // en 3D, le ballon va là où le doigt est lâché (prolongé au ras du sol si on lâche avant le but)
    if (S.v3) { const g = S.v3.aimFromSwipe(s.s0, s.s1); S.aim = { x: cl(g.x, 120, 680) + rnd(-err, err), y: g.y + rnd(-err, err) }; }
    S.power = p;
    // en 3D, la puissance se mesure à l'écran : un geste franc donne une bonne frappe, seul un geste brutal s'envole
    if (S.v3) { const sl = Math.hypot(s.s1.x - s.s0.x, s.s1.y - s.s0.y); S.power = cl((sl / ms - 0.35) / 2.4, 0.15, 1); }
    if (isFk()) {
      // l'effet : de quel côté le geste s'est courbé (écart maximal à la ligne droite)
      let dev = 0;
      for (const q of s.pts) { const d = ((q.x - s.x0) * dy - (q.y - s.y0) * dx) / len; if (Math.abs(d) > Math.abs(dev)) dev = d; }
      S.curl = cl(-dev / 40, -1, 1);
      playerFk();
    } else playerShoot();
  }

  function renderBoard() {
    const o = S.opts, el = S.el.querySelector(".pen-board");
    if (o.mode !== "shootout") { el.innerHTML = ""; return; }
    const n = Math.max(5, S.us.length, S.them.length);
    const row = (team, arr) => `<div class="pen-row"><span class="pen-team">${team}</span><span class="pen-dots">${Array.from({ length: n }, (_, i) => `<i class="${i < arr.length ? (arr[i] ? "g" : "m") : ""}"></i>`).join("")}</span><b>${goals(arr)}</b></div>`;
    el.innerHTML = row(esc(o.us.short || "Nous"), S.us) + row(esc(o.them.short || "Eux"), S.them);
  }

  // ---------- canvas ----------
  function resize() {
    S.dpr = Math.min(2, window.devicePixelRatio || 1);
    S.cv.width = W * S.dpr; S.cv.height = H * S.dpr;
    S.bg = document.createElement("canvas"); S.bg.width = W * S.dpr; S.bg.height = H * S.dpr;
    drawBackground();
  }

  function drawBackground() {
    const c = S.bg.getContext("2d"), o = S.opts;
    c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    let g = c.createLinearGradient(0, 0, 0, G.b);
    g.addColorStop(0, "#070c18"); g.addColorStop(1, "#17243c");
    c.fillStyle = g; c.fillRect(0, 0, W, G.b);
    // tribunes : la photo du stade, recadrée pour que sa pelouse commence sous les panneaux (à 72 % de sa hauteur) ;
    // tant qu'elle n'est pas chargée, la foule aux couleurs des deux clubs
    const stands = miniImg("tribunes", () => { if (S && S.bg) drawBackground(); });
    let s = 11;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const crowd = ["#2b3a55", "#3a2f4a", "#4a3a2a", "#24423f", "#55402a", "#3b4660", "#5a3a36"];
    if (stands) {
      const h = W * stands.naturalHeight / stands.naturalWidth;
      c.save(); c.beginPath(); c.rect(0, 0, W, G.b); c.clip();
      c.drawImage(stands, 0, G.b - 4 - h * 0.72, W, h);
      c.restore();
    }
    for (let row = 0; row < (stands ? 0 : 18); row++) {
      const y = 14 + row * 11.5;
      for (let x = -4; x < W + 8; x += 8 + r() * 3) {
        const fan = r();
        c.fillStyle = fan < 0.09 ? (x < W / 2 ? o.us.a : o.them.a) : crowd[(r() * crowd.length) | 0];
        c.globalAlpha = 0.45 + row * 0.03;
        c.beginPath(); c.arc(x + r() * 3, y + r() * 3, 3.2 + row * 0.1, 0, 7); c.fill();
      }
    }
    c.globalAlpha = 1;
    c.fillStyle = "#10223f"; c.fillRect(0, 230, W, 32);
    c.fillStyle = "rgba(245,197,66,.6)";
    c.font = '800 15px "Barlow Condensed", Impact, sans-serif';
    c.textBaseline = "middle";
    const board = `${(o.us.name || "").toUpperCase()}  ·  ${(o.them.name || "").toUpperCase()}  ·  TRAJECTOIRE  ·  `;
    for (let x = 6; x < W; x += c.measureText(board).width + 6) c.fillText(board, x, 247);
    for (const fx of [40, 760]) {
      g = c.createRadialGradient(fx, -20, 10, fx, -20, 360);
      g.addColorStop(0, "rgba(255,226,160,.30)"); g.addColorStop(1, "rgba(255,226,160,0)");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    const n = 10;
    for (let i = 0; i < n; i++) {
      const y0 = G.b + (H - G.b) * Math.pow(i / n, 1.5), y1 = G.b + (H - G.b) * Math.pow((i + 1) / n, 1.5);
      c.fillStyle = i % 2 ? "#1e5a37" : "#246640";
      c.fillRect(0, y0, W, y1 - y0 + 1);
    }
    g = c.createLinearGradient(0, G.b, 0, H);
    g.addColorStop(0, "rgba(6,12,20,.35)"); g.addColorStop(1, "rgba(6,12,20,0)");
    c.fillStyle = g; c.fillRect(0, G.b, W, H - G.b);
    c.strokeStyle = "rgba(240,245,235,.85)"; c.lineWidth = 2.2; c.lineJoin = "round";
    c.beginPath(); c.moveTo(0, G.b); c.lineTo(W, G.b); c.stroke();
    c.beginPath(); c.moveTo(160, G.b); c.lineTo(128, 302); c.lineTo(672, 302); c.lineTo(640, G.b); c.stroke();
    c.beginPath(); c.moveTo(40, G.b); c.lineTo(-30, 540); c.moveTo(760, G.b); c.lineTo(830, 540); c.moveTo(-30, 540); c.lineTo(830, 540); c.stroke();
    c.fillStyle = "rgba(240,245,235,.9)";
    c.beginPath(); c.ellipse(SPOT.x, SPOT.y, 7, 3, 0, 0, 7); c.fill();
  }

  function line(x1, y1, x2, y2) { const c = S.ctx; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }

  function drawGoal() {
    const ctx = S.ctx, bl = G.l + 18, br = G.r - 18, bt = G.t + 12, bb = G.b - 16, sh = reduceMotion ? 0 : S.netShake, now = S.now;
    ctx.fillStyle = "rgba(5,9,16,.45)";
    ctx.beginPath(); ctx.moveTo(G.l, G.t); ctx.lineTo(G.r, G.t); ctx.lineTo(G.r, G.b); ctx.lineTo(G.l, G.b); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(235,240,235,.30)"; ctx.lineWidth = 1;
    for (let x = bl; x <= br; x += 11) { const o = sh * Math.sin(x * 0.15 + now * 0.04) * 5; line(x, bt + o * 0.4, x + o * 0.3, bb + o); }
    for (let y = bt; y <= bb; y += 11) { const o = sh * Math.sin(y * 0.2 + now * 0.05) * 4; line(bl, y + o, br, y + o); }
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      line(lerp(G.l, G.r, k), G.t, lerp(bl, br, k), bt);
      line(G.l, lerp(G.t, G.b, k), bl, lerp(bt, bb, k));
      line(G.r, lerp(G.t, G.b, k), br, lerp(bt, bb, k));
    }
    ctx.fillStyle = "#f4f6f2";
    ctx.fillRect(G.l - 6, G.t - 6, 7, G.b - G.t + 6);
    ctx.fillRect(G.r - 1, G.t - 6, 7, G.b - G.t + 6);
    ctx.fillRect(G.l - 6, G.t - 6, G.r - G.l + 12, 7);
  }

  // le gardien, vu de face : fléchi sur ses appuis, il se balance et respire ; en plongeon, il s'étire bras tendus
  function drawKeeper(p, color, you) {
    const ctx = S.ctx, dx = p.x - HOME.x, ang = cl(dx / 170, -1, 1) * 1.25, k = S.kick;
    const diving = !!(k && k.dive && S.now >= k.dive.start), breath = diving ? 0 : Math.sin(S.now / 320) * 1.5;
    const look = you ? S.opts.look : null, skin = look ? lookSkin(look) : "#c9946a", hair = look ? lookHair(look) : "#2a1d14";
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath(); ctx.ellipse(p.x, G.b - 2, diving ? 34 : 26, 5, 0, 0, 7); ctx.fill();
    ctx.translate(p.x, p.y + breath); ctx.rotate(ang); ctx.scale(1.12, 1.12);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const spread = diving ? 52 : 34, ay = -22 - spread * 0.6, ax = 30 + (diving ? 6 : 0), knee = diving ? 0 : 5;
    // jambes : chaussettes, genoux fléchis, chaussures
    ctx.strokeStyle = color; ctx.lineWidth = 7.5;
    ctx.beginPath(); ctx.moveTo(-7, 24); ctx.lineTo(-10 - knee, 36); ctx.lineTo(-11 - (diving ? 5 : 0), 48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, 24); ctx.lineTo(10 + knee, 36); ctx.lineTo(11 + (diving ? 5 : 0), 48); ctx.stroke();
    ctx.fillStyle = "#0d1018";
    ctx.beginPath(); ctx.ellipse(-12 - (diving ? 5 : 0), 49.5, 5.5, 3, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12 + (diving ? 5 : 0), 49.5, 5.5, 3, 0, 0, 7); ctx.fill();
    // short
    ctx.fillStyle = "#151a2a"; ctx.beginPath(); ctx.roundRect(-14.5, 12, 29, 15, 4); ctx.fill();
    // bras : manches longues ombrées, gants clairs
    ctx.strokeStyle = color; ctx.lineWidth = 8.5; line(-12, -21, -ax, ay); line(12, -21, ax, ay);
    ctx.strokeStyle = "rgba(0,0,0,.2)"; line(-12, -21, -ax, ay); line(12, -21, ax, ay);
    ctx.fillStyle = "#e9f7b0"; ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1.2;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * (ax + 1), ay - 3, 7, 8.5, sx * 0.3, 0, 7); ctx.fill(); ctx.stroke(); }
    // maillot avec reflet et bande de poitrine
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-15.5, -31, 31, 47, 9); ctx.fill();
    const g = ctx.createLinearGradient(-16, -31, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,.28)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.3)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-15.5, -31, 31, 47, 9); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fillRect(-15.5, -10, 31, 5);
    // cou, tête, cheveux, yeux
    ctx.fillStyle = skin; ctx.fillRect(-4, -36, 8, 7);
    ctx.beginPath(); ctx.arc(0, -43, 10.5, 0, 7); ctx.fill();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(0, -45, 10.8, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    ctx.fillStyle = "#14100c"; ctx.beginPath(); ctx.arc(-3.6, -42, 1.3, 0, 7); ctx.arc(3.6, -42, 1.3, 0, 7); ctx.fill();
    if (you) { ctx.strokeStyle = "#f5c542"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, -10, 46, 0, 7); ctx.stroke(); }
    ctx.restore();
  }

  // lean : le tireur penche du côté où il va frapper (ou fait semblant) à la fin de son élan ; ox décale l'élan (coup franc)
  function drawShooter(color, num, run, you, lean = 0, ox = 0) {
    const ctx = S.ctx, x = lerp(318, 366, run) + ox + lean * 9 * cl((run - 0.55) / 0.45, 0, 1), y = lerp(560, 520, run);
    ctx.save(); ctx.translate(x, y); ctx.scale(1.5, 1.5);
    if (lean) ctx.rotate(lean * 0.2 * cl((run - 0.55) / 0.45, 0, 1));
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath(); ctx.ellipse(0, 22, 24, 6, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#c9a07a"; ctx.lineWidth = 7; ctx.lineCap = "round";
    const stride = Math.sin(run * 14) * 6 * (run < 1 ? 1 : 0);
    line(-7, 0, -9 + stride, 20); line(7, 0, 9 - stride, 20);
    ctx.fillStyle = "#f4f6f2"; ctx.fillRect(-14, -10, 28, 12);
    // bras qui accompagnent la course
    ctx.strokeStyle = color; ctx.lineWidth = 7;
    line(-15, -44, -22 - stride * 0.6, -22); line(15, -44, 22 + stride * 0.6, -22);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(-16, -50, 32, 42, 7); ctx.fill();
    const sg = ctx.createLinearGradient(-16, -50, 16, -8);
    sg.addColorStop(0, "rgba(255,255,255,.22)"); sg.addColorStop(1, "rgba(0,0,0,.28)");
    ctx.fillStyle = sg; ctx.beginPath(); ctx.roundRect(-16, -50, 32, 42, 7); ctx.fill();
    ctx.fillStyle = "rgba(13,21,36,.85)";
    ctx.font = '900 20px "Barlow Condensed", Impact, sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(num), 0, -30);
    const look = you ? S.opts.look : null;
    ctx.fillStyle = look ? (look.hair ? lookHair(look) : lookSkin(look)) : "#2a1f17";
    ctx.beginPath(); ctx.arc(0, -60, 11, 0, 7); ctx.fill();
    if (you) { ctx.fillStyle = "#f5c542"; ctx.font = '800 13px "Barlow Condensed", Impact, sans-serif'; ctx.fillText("TOI", 0, -80); }
    ctx.restore();
  }

  // le mur de quatre joueurs, bras croisés ; il saute au moment de la frappe une fois sur deux
  function drawWall(color) {
    const ctx = S.ctx, w = S.wall, k = S.kick;
    const jump = k && w.jumping ? 20 * Math.sin(Math.PI * cl((S.now - k.start) / 520, 0, 1)) : 0;
    for (const x of w.xs) {
      ctx.save(); ctx.translate(x, FK.wallY - jump); ctx.scale(1.25, 1.25);
      ctx.fillStyle = "rgba(0,0,0,.28)";
      ctx.beginPath(); ctx.ellipse(0, jump / 1.25, 13, 4, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "#1b2233"; ctx.lineWidth = 6; ctx.lineCap = "round";
      line(-5, -18, -6, 0); line(5, -18, 6, 0);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(-11, -50, 22, 34, 6); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(-10, -30, 20, 6);
      ctx.fillStyle = "#c9a07a";
      ctx.beginPath(); ctx.arc(0, -58, 8, 0, 7); ctx.fill();
      ctx.restore();
    }
  }

  function drawBall(b, spin) {
    const ctx = S.ctx;
    ctx.fillStyle = "rgba(0,0,0,.32)";
    ctx.beginPath(); ctx.ellipse(b.x, b.gy, b.r * 1.1, b.r * 0.35, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(spin);
    const sprite = miniImg("ballon");
    if (sprite) {
      ctx.drawImage(sprite, -b.r, -b.r, b.r * 2, b.r * 2); ctx.restore();
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke();
      return;
    }
    ctx.fillStyle = "#f7f7f2";
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, 7); ctx.fill();
    ctx.fillStyle = "#1b1f27";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 - Math.PI / 2; ctx.lineTo(Math.cos(a) * b.r * 0.38, Math.sin(a) * b.r * 0.38); }
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 + Math.PI / 2; ctx.beginPath(); ctx.arc(Math.cos(a) * b.r * 0.92, Math.sin(a) * b.r * 0.92, b.r * 0.26, 0, 7); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke();
  }

  function drawWeather() {
    const w = S.opts.weather || "", ctx = S.ctx;
    if (!/Pluie|Neige/.test(w) || reduceMotion) return;
    const snow = /Neige/.test(w), t = S.now / 1000;
    ctx.save();
    ctx.strokeStyle = "rgba(200,215,235,.35)"; ctx.fillStyle = "rgba(240,245,255,.8)"; ctx.lineWidth = 1.2;
    for (let i = 0; i < 90; i++) {
      const x = (i * 97.3 + t * (snow ? 20 : 60)) % W, y = (i * 53.7 + t * (snow ? 60 : 520)) % H;
      if (snow) { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill(); }
      else line(x, y, x - 4, y + 14);
    }
    ctx.restore();
  }

  // ---------- trajectoires (comme Penalty de Minuit) ----------
  function keeperPos(k, t) {
    const home = S.kHome;
    if (!k || !k.dive) {
      const sway = ["prep", "aim", "power", "curl", "style", "panenka"].includes(S.state) ? Math.sin(t / 260) * 6 : 0;
      return { x: home.x + sway, y: home.y };
    }
    const u = cl((t - k.dive.start) / k.dive.dur, 0, 1), e = 1 - Math.pow(1 - u, 3);
    return { x: lerp(home.x, k.dive.x, e), y: lerp(home.y, k.dive.y, e) };
  }

  // coup franc : trajectoire courbe (l'effet décale le milieu de la course, l'arrivée reste la cible)
  function fkBall(k, u) {
    return { x: lerp(k.sx, k.tx, u) + k.curl * FK.curlPx * Math.sin(Math.PI * u), y: lerp(k.sy, k.ty, u) - Math.sin(Math.PI * u) * k.arc,
      r: lerp(13, 6.5, u), gy: lerp(k.sy + 13, Math.min(G.b - 2, k.ty + 10), u) };
  }
  const flightEnd = k => k.start + k.dur * (k.blockU || 1);

  function ballAt(k, t) {
    if (!k || t < k.start) return rest();
    const uEnd = k.blockU || 1, u = (t - k.start) / k.dur;
    if (u <= uEnd) return k.fk ? fkBall(k, u) : { x: lerp(SPOT.x, k.tx, u), y: lerp(REST.y, k.ty, u) - Math.sin(Math.PI * u) * k.arc, r: lerp(15, 6.5, u), gy: lerp(REST.gy, Math.min(G.b - 2, k.ty + 10), u) };
    const end = k.fk ? fkBall(k, uEnd) : { x: k.tx, y: k.ty, r: 6.5, gy: Math.min(G.b - 2, k.ty + 10) };
    if (!k.post) return { ...end, gy: k.blockU ? end.gy : G.b - 2 };
    const v = cl((t - flightEnd(k)) / k.post.dur, 0, 1), e = 1 - Math.pow(1 - v, 2);
    return { x: lerp(end.x, k.post.x, e), y: lerp(end.y, k.post.y, e) - Math.sin(Math.PI * v) * k.post.hop, r: lerp(end.r, k.post.r, e), gy: lerp(end.gy, k.post.gy, e) };
  }

  // difficulté : le talent du joueur ralentit le viseur et la jauge, le gardien adverse lit moins bien
  const force = () => S.style === "force";
  const aimSpeed = () => lerp(1.0, 0.6, S.opts.skill) * (force() ? 1.2 : 1);
  const powSpeed = () => lerp(1.1, 0.7, S.opts.skill) * (force() ? 1.25 : 1);
  // sous la pression, le viseur tremble (deux sinus rapides qui ne se répètent pas)
  function aimPoint(t) {
    const k = (t - S.t0) / 1000, s = aimSpeed(), tr = pressureNow() * 11;
    return { x: 400 + 182 * Math.sin(k * 1.9 * s) + tr * Math.sin(t * 0.021) * Math.sin(t * 0.0047), y: 191 + 80 * Math.sin(k * 3.1 * s + 1.1) + tr * Math.cos(t * 0.017) };
  }
  function powerAt(t) { const ph = ((t - S.t0) / 1000 * powSpeed()) % 2; return ph < 1 ? ph : 2 - ph; }
  function curlAt(t) { return Math.sin((t - S.t0) / 1000 * lerp(1.9, 1.2, S.opts.skill)); }

  function keeperGuess(tx, ty, read) {
    if (Math.random() < read) return { x: tx + rnd(-24, 24), y: ty + rnd(-18, 18) };
    const zone = [-1, 0, 1][(Math.random() * 3) | 0];
    return { x: zone === 0 ? 400 + rnd(-25, 25) : 400 + zone * rnd(85, 150), y: rnd(150, 235) };
  }

  function shootAt(tx, ty, p, side, read, reach, guess) {
    ty = Math.min(ty, G.b - 8);
    guess = guess || keeperGuess(tx, ty, read);
    const dur = lerp(1150, 520, p) * (force() && side === "us" ? 0.8 : 1);
    S.kick = { side, tx, ty, start: S.now, dur, arc: lerp(34, 10, p),
      reach: reach * (p < 0.35 ? 1.6 : 1) * (1.15 - p * 0.3) * (force() && side === "us" ? 0.82 : 1),
      dive: { x: cl(guess.x, G.l + 22, G.r - 22), y: cl(guess.y, G.t + 18, 238), start: S.now + 110, dur: 360 } };
    S.state = "flight"; hint("");
    snd("click");
  }

  function playerShoot() {
    const p = S.power, err = (5 + p * 14) * (force() ? 1.5 : 1);
    let tx = S.aim.x + rnd(-err, err), ty = S.aim.y + rnd(-err, err);
    // seule une frappe vraiment trop appuyée s'envole (plus tôt en force)
    if (p > (force() ? 0.88 : 0.95)) ty -= 25 + (p - (force() ? 0.88 : 0.95)) * 700;
    shootAt(tx, ty, p, "us", lerp(0.42, 0.2, S.opts.skill), 52);
    S.kick.player = true; S.kick.mine = S.turn.mine !== false;
  }

  // la Panenka : une pichenette au centre. Si le gardien plonge, c'est but ; s'il reste debout, c'est ridicule.
  function panenkaShoot() {
    const stays = Math.random() < 0.24 + pressureNow() * 0.15;
    const guess = stays ? { x: 400 + rnd(-8, 8), y: 192 } : { x: 400 + (Math.random() < 0.5 ? -1 : 1) * rnd(95, 150), y: rnd(170, 230) };
    shootAt(400 + rnd(-14, 14), 168 + rnd(-8, 8), 0.5, "us", 0, 52, guess);
    Object.assign(S.kick, { dur: 1150, arc: 70, player: true });
  }

  // coup franc : la trajectoire est calculée dès la frappe, y compris un éventuel passage dans le mur
  function launchFk(tx, ty, p, curl, side, read, reach, youDive) {
    ty = Math.min(ty, G.b - 8);
    const r = rest(), w = S.wall;
    const k = { fk: true, side, sx: r.x, sy: r.y, tx, ty, curl, start: S.now, dur: lerp(1350, 650, p) * (youDive ? 1.35 : 1), arc: lerp(150, 25, p),
      reach: reach * (p < 0.35 ? 1.5 : 1) * (1.15 - p * 0.3), dive: null, youDive: !!youDive };
    w.jumping = Math.random() < 0.5;
    const at = fkBall(k, FK.wallU);
    if (Math.abs(at.x - w.cx) <= w.half + 5 && at.y > w.top - (w.jumping ? 14 : 0)) k.blockU = FK.wallU;
    if (!youDive) { const g = keeperGuess(tx, ty, read); k.dive = { x: cl(g.x, G.l + 22, G.r - 22), y: cl(g.y, G.t + 18, 238), start: S.now + 170, dur: 380 }; }
    S.kick = k; S.state = "flight"; hint("");
    snd("click");
    return k;
  }
  function playerFk() {
    const p = S.power, err = 5 + p * 16;
    let tx = S.aim.x + rnd(-err, err), ty = S.aim.y + rnd(-err, err);
    if (p > 0.92) ty -= 30 + (p - 0.92) * 700;
    Object.assign(launchFk(tx, ty, p, S.curl, "us", lerp(0.38, 0.18, S.opts.skill), 52, false), { player: true, mine: true });
  }

  // tirs adverses quand tu es dans les cages : décidés au début de l'élan (pour que les appuis puissent les trahir)
  function planCpuPen() {
    const s = Math.random() < 0.62 ? S.pref : (Math.random() < 0.5 ? -1 : 1);
    let tx = Math.random() < 0.62 ? (s < 0 ? rnd(G.l + 18, G.l + 70) : rnd(G.r - 70, G.r - 18)) : rnd(G.l + 70, G.r - 70);
    let ty = rnd(G.t + 16, G.b - 10);
    if (Math.random() < 0.08) { const m = Math.random(); if (m < 0.4) ty = G.t - rnd(10, 45); else if (m < 0.6) tx = s < 0 ? G.l + rnd(-3, 3) : G.r + rnd(-3, 3); else tx = s < 0 ? G.l - rnd(12, 45) : G.r + rnd(12, 45); }
    return { tx, ty };
  }
  function planCpuFk() {
    const s = S.fkSide, far = Math.random() < 0.55;
    let tx = far ? (s < 0 ? rnd(G.r - 75, G.r - 20) : rnd(G.l + 20, G.l + 75)) : (s < 0 ? rnd(G.l + 18, G.l + 70) : rnd(G.r - 70, G.r - 18));
    let ty = rnd(G.t + 16, G.b - 30);
    if (Math.random() < 0.1) { if (Math.random() < 0.5) ty = G.t - rnd(10, 40); else tx = s < 0 ? G.r + rnd(10, 40) : G.l - rnd(10, 40); }
    return { tx, ty, p: rnd(0.42, 0.78), curl: rnd(-0.5, 0.5) };
  }

  function autoShoot(side) {
    // tireur automatique : vise un coin ou le centre, avec un risque de rater
    const q = side === "us" ? 0.6 : 0.55;
    const s = Math.random() < 0.5 ? -1 : 1, corner = Math.random() < 0.6;
    let tx = corner ? (s < 0 ? rnd(G.l + 20, G.l + 75) : rnd(G.r - 75, G.r - 20)) : rnd(G.l + 75, G.r - 75);
    let ty = rnd(G.t + 18, G.b - 12), p = rnd(0.45, 0.88);
    if (Math.random() > q + 0.32) { ty = Math.random() < 0.5 ? G.t - rnd(10, 40) : ty; tx = Math.random() < 0.5 ? (s < 0 ? G.l - rnd(8, 40) : G.r + rnd(8, 40)) : tx; }
    shootAt(tx, ty, p, side, 0.3, 52);
  }

  function cpuShootAtYou() {
    const k = S.opts.skill, pl = S.planned || planCpuPen();
    if (isFk()) { launchFk(pl.tx, pl.ty, pl.p, pl.curl, "them", 0, lerp(46, 62, k), true).mine = true; hint("Plonge !"); return; }
    S.kick = { side: "them", tx: pl.tx, ty: pl.ty, start: S.now, dur: lerp(1000, 1350, k) * rnd(0.92, 1.08), arc: rnd(10, 28), reach: lerp(46, 62, k), dive: null, youDive: true, mine: S.turn.mine !== false };
    S.state = "flight"; hint("Plonge !");
  }

  function playerDive(x, y) {
    const k = S.kick;
    if (!k || !k.youDive || k.dive || S.now > flightEnd(k)) return;
    k.dive = { x: cl(x, G.l + 22, G.r - 22), y: cl(y, G.t + 18, 238), start: S.now, dur: 250 };
  }

  function resolve() {
    const k = S.kick, x = k.tx, y = k.ty, sign = x >= 400 ? 1 : -1;
    let out;
    const nearPost = (Math.abs(x - G.l) <= 6 || Math.abs(x - G.r) <= 6) && y >= G.t - 4 && y <= G.b;
    const nearBar = Math.abs(y - G.t) <= 6 && x >= G.l - 4 && x <= G.r + 4;
    const inside = x > G.l + 4 && x < G.r - 4 && y > G.t + 4;
    if (k.blockU) out = "wall";
    else if (nearPost) out = "post"; else if (nearBar) out = "bar"; else if (!inside) out = y < G.t ? "over" : "wide";
    else { const kp = keeperPos(k, k.start + k.dur); out = Math.hypot(kp.x - x, kp.y - y) < k.reach ? "saved" : "goal"; }
    k.outcome = out;
    const wallAt = k.blockU ? fkBall(k, k.blockU) : null;
    k.post = {
      wall: wallAt && { x: wallAt.x + rnd(-70, 70), y: 548, r: 16, gy: 550, hop: 45, dur: 600 },
      goal: { x: x + (x - 400) * 0.06, y: y + 8, r: 6, gy: G.b - 6, hop: 0, dur: 300 },
      saved: { x: x + sign * 190, y: Math.min(H + 30, y + 200), r: 12, gy: Math.min(H + 30, y + 210), hop: 30, dur: 600 },
      post: { x: 400 + (x - 400) * 1.45, y: 430, r: 13, gy: 445, hop: 50, dur: 650 },
      bar: { x: x + sign * 40, y: 400, r: 12, gy: 415, hop: 70, dur: 650 },
      over: { x: x + (x - SPOT.x) * 0.25, y: y - 30, r: 5, gy: G.b - 10, hop: 0, dur: 450 },
      wide: { x: x + (x - SPOT.x) * 0.3, y: y - 10, r: 5, gy: G.b - 10, hop: 0, dur: 450 }
    }[out];
    const scored = out === "goal", ours = k.side === "us";
    (ours ? S.us : S.them).push(scored);
    S.kickIndex++;
    if (scored) S.netShake = 1;
    if (k.player && k.mine !== false) { S.mine.shots++; if (scored) S.mine.goals++; }
    if (k.youDive && k.mine !== false) { S.mine.faced++; if (!scored) S.mine.saves++; }
    const text = { goal: ours ? "BUT !" : "BUT ADVERSE", saved: ours ? "ARRÊTÉ…" : "ARRÊTÉ !", post: "POTEAU !", bar: "LA BARRE !", over: "AU-DESSUS !", wide: "À CÔTÉ !", wall: "DANS LE MUR !" }[out];
    const good = ours ? scored : !scored;
    S.flash = { text, color: good ? "#f5c542" : "#ff6b6b", start: S.now };
    // un but secoue la caméra ; un geste réussi fait jaillir des paillettes là où le ballon a fini ; le téléphone vibre
    if (scored) S.shake = 1;
    if (good && !reduceMotion) for (let i = 0; i < 70; i++) { const a = rnd(0, Math.PI * 2), v = rnd(0.08, 0.42); S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.18, life: rnd(700, 1300), age: 0, c: Math.random() < 0.6 ? "#f5c542" : Math.random() < 0.5 ? "#ffffff" : "#9a7bff" }); }
    if ((k.player || k.youDive) && navigator.vibrate) { try { navigator.vibrate(good ? [30, 40, 90] : 180); } catch (e) {} }
    snd(good ? (scored ? "goal" : "trophy") : "concede");
    const what = isFk() ? "Le coup franc" : "Le penalty";
    if (S.opts.mode !== "shootout") say({ goal: ours ? `${what} est au fond !` : `${what} est transformé.`, saved: ours ? "Arrêté par le gardien !" : "Quel arrêt !", post: "Sur le poteau !", bar: "Sur la barre !", over: "Au-dessus !", wide: "À côté !", wall: "Dans le mur !" }[out]);
    renderBoard();
    S.state = "after"; S.afterStart = S.now;
  }

  // ---------- entrées ----------
  function act(px, py) {
    if (!S) return;
    if (S.state === "style") chooseStyle("place");
    else if (S.state === "aim") { S.aim = aimPoint(S.now); S.state = "power"; S.t0 = S.now; hint(isFk() ? "Puissance : faible pour lober le mur, forte pour le surprendre" : "Puissance : clique au bon moment"); }
    else if (S.state === "power") {
      S.power = powerAt(S.now);
      if (isFk()) { S.state = "curl"; S.t0 = S.now; hint("Effet : fixe le curseur à gauche ou à droite pour enrouler"); }
      else playerShoot();
    }
    else if (S.state === "curl") { S.curl = curlAt(S.now); playerFk(); }
    else if (S.state === "flight" && S.kick && S.kick.youDive && px != null) playerDive(px, py);
    else if (S.state === "after" && S.now - S.afterStart > 500) nextKick();
  }

  // ---------- boucle ----------
  function update() {
    const now = S.now;
    if (S.state === "intro" && now - S.prepStart > 1600) nextKick();
    if (S.state === "prep" && now - S.prepStart > 1500) {
      if (S.turn.ctl === "dive") cpuShootAtYou(); else autoShoot(S.turn.side);
    }
    if (S.state === "panenka" && now - S.t0 > 450) panenkaShoot();
    // sous forte pression, on entend son cœur battre
    const pr = ["aim", "power", "curl", "style"].includes(S.state) ? pressureNow() : 0;
    if (pr > 0.35 && now - (S.beat || 0) > 1000 - pr * 450) { S.beat = now; snd("heart"); }
    if (S.state === "flight" && S.kick && now >= flightEnd(S.kick)) resolve();
    if (S.state === "after" && now - S.afterStart > (S.opts.mode === "shootout" ? 1500 : 1700)) nextKick();
    S.netShake = Math.max(0, S.netShake - 0.012);
    S.shake = Math.max(0, S.shake - 0.03);
  }

  // jauge de pression (en haut à gauche) : un cœur qui bat plus vite quand la tension monte
  function drawPressure(pr, now) {
    const ctx = S.ctx, beat = 1 + 0.18 * Math.max(0, Math.sin(now / (420 - pr * 220) * Math.PI * 2));
    ctx.save();
    ctx.fillStyle = "rgba(8,13,24,.7)"; ctx.fillRect(14, 14, 168, 34);
    ctx.font = '800 22px "Barlow Condensed", Impact, sans-serif'; ctx.textBaseline = "middle"; ctx.textAlign = "center";
    ctx.translate(34, 31); ctx.scale(beat, beat); ctx.fillStyle = "#ff6b6b"; ctx.fillText("♥", 0, 1);
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    ctx.font = '800 13px "Barlow Condensed", Impact, sans-serif'; ctx.textAlign = "left"; ctx.fillStyle = "#eef1ea"; ctx.fillText("PRESSION", 52, 31);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i < Math.ceil(pr * 5) ? "#ff6b6b" : "rgba(255,255,255,.15)"; ctx.fillRect(112 + i * 13, 25, 10, 12); }
    ctx.restore();
  }
  // jauge d'effet du coup franc : le curseur oscille de gauche à droite
  function drawCurl(v) {
    const ctx = S.ctx, x0 = 290, x1 = 510, y = 528, mx = lerp(x0, x1, (v + 1) / 2);
    ctx.fillStyle = "rgba(8,13,24,.75)"; ctx.fillRect(x0 - 12, y - 16, x1 - x0 + 24, 36);
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, "#6bb8ff"); g.addColorStop(0.5, "#eef1ea"); g.addColorStop(1, "#6bb8ff");
    ctx.fillStyle = g; ctx.fillRect(x0, y - 3, x1 - x0, 6);
    ctx.fillStyle = "#f5c542"; ctx.beginPath(); ctx.arc(mx, y, 8, 0, 7); ctx.fill();
    ctx.font = '800 13px "Barlow Condensed", Impact, sans-serif'; ctx.fillStyle = "#eef1ea"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("◀ EFFET ▶", 400, y - 26 < 0 ? y : y - 26);
  }

  function render() {
    if (S.v3) return render3d();
    const ctx = S.ctx, o = S.opts, now = S.now, cam = camOrigin(), d = S.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#070c18"; ctx.fillRect(0, 0, S.cv.width, S.cv.height);
    ctx.setTransform(CAM.s, 0, 0, CAM.s, cam.x * d, cam.y * d);
    ctx.drawImage(S.bg, 0, 0);
    ctx.setTransform(d * CAM.s, 0, 0, d * CAM.s, cam.x * d, cam.y * d);
    const tr = S.turn || turn();
    const shooterSide = S.kick ? S.kick.side : tr.side;
    const shooter = shooterSide === "us" ? o.us : o.them, keeper = shooterSide === "us" ? o.them : o.us;
    const youShoot = shooterSide === "us" && (tr.ctl === "shoot" || tr.ctl === "fk");
    const youKeep = shooterSide === "them" && (o.mode === "save" || o.mode === "fksave" || o.mode === "shootout");
    const kp = keeperPos(S.kick, now), b = ballAt(S.kick, now), k = S.kick;
    const behindNet = k && k.outcome === "goal" && now > k.start + k.dur;
    // en coup franc, le ballon passe derrière le mur une fois qu'il l'a dépassé
    const behindWall = isFk() && k && now > k.start && (now - k.start) / k.dur > FK.wallU && !(k.blockU && now > flightEnd(k));
    if (behindNet) drawBall(b, now / 90);
    drawGoal();
    drawKeeper(kp, keeper.b === "#ffffff" ? keeper.a : keeper.b, youKeep);
    let run = 1;
    if (S.state === "prep") run = cl((now - S.prepStart) / 1500, 0, 1);
    const spin = k && now > k.start ? (now - k.start) / 70 : 0;
    if (isFk()) {
      if (behindWall && !behindNet) drawBall(b, spin);
      drawWall(keeper.a);
      drawShooter(shooter.a, youShoot ? (o.number || 10) : 10, run, youShoot, 0, rest().x - 400 - 40);
      if (!behindWall && !behindNet) drawBall(b, spin);
    } else {
      drawShooter(shooter.a, youShoot ? (o.number || 9) : 7 + (S.kickIndex % 5) * 2, run, youShoot, S.state === "prep" ? S.tell : 0);
      if (!behindNet) drawBall(b, spin);
    }
    drawTrail(b, k, now);
    drawParts();
    if (S.state === "aim" || S.state === "power" || S.state === "curl") {
      const a = S.state === "aim" ? aimPoint(now) : S.aim;
      ctx.strokeStyle = "#f5c542"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(a.x, a.y, 13, 0, 7); ctx.stroke();
      line(a.x - 20, a.y, a.x - 7, a.y); line(a.x + 7, a.y, a.x + 20, a.y);
      line(a.x, a.y - 20, a.x, a.y - 7); line(a.x, a.y + 7, a.x, a.y + 20);
    }
    drawSwipeGuide(now);
    // ce qui suit (météo, jauges, textes) reste à l'échelle de l'écran
    ctx.setTransform(d, 0, 0, d, 0, 0);
    drawHud(now);
  }
  function drawHud(now) {
    const ctx = S.ctx;
    drawWeather();
    if (["aim", "power", "curl"].includes(S.state) && pressureNow() > 0.15) drawPressure(pressureNow(), now);
    if (S.state === "curl") drawCurl(curlAt(now));
    if (S.state === "power") {
      const p = powerAt(now), x = 712, y = 330, w = 26, h = 190;
      ctx.fillStyle = "rgba(8,13,24,.75)"; ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
      ctx.fillStyle = "rgba(224,80,63,.55)"; ctx.fillRect(x, y, w, h * 0.1);
      const g = ctx.createLinearGradient(0, y + h, 0, y);
      g.addColorStop(0, "#2f7d4c"); g.addColorStop(0.85, "#f5c542"); g.addColorStop(1, "#e0503f");
      ctx.fillStyle = g; ctx.fillRect(x, y + h * (1 - p), w, h * p);
      ctx.fillStyle = "#eef1ea"; ctx.fillRect(x - 8, y + h * (1 - p) - 2, w + 16, 4);
      ctx.font = '800 14px "Barlow Condensed", Impact, sans-serif';
      ctx.textAlign = "center"; ctx.fillText("PUISSANCE", x + w / 2, y + h + 22);
    }
    if (S.flash) {
      const age = (now - S.flash.start) / 1000, sc = reduceMotion ? 1 : 1 + Math.max(0, 0.35 - age) * 1.2;
      ctx.save();
      ctx.globalAlpha = cl(1.6 - age, 0, 1);
      ctx.translate(400, S.v3 ? 120 : 360); ctx.scale(sc, sc);
      ctx.font = '800 76px "Barlow Condensed", Impact, sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 8; ctx.strokeStyle = "rgba(8,13,24,.85)"; ctx.strokeText(S.flash.text, 0, 0);
      ctx.fillStyle = S.flash.color; ctx.fillText(S.flash.text, 0, 0);
      ctx.restore();
    }
  }

  // en 3D : le stade est rendu par Stade3D à partir de l'état du moteur ; ici, seulement le viseur, le geste et l'interface
  function render3d() {
    const ctx = S.ctx, o = S.opts, now = S.now, d = S.dpr, k = S.kick, v3 = S.v3;
    const tr = S.turn || turn(), shooterSide = k ? k.side : tr.side;
    const youShoot = shooterSide === "us" && (tr.ctl === "shoot" || tr.ctl === "fk");
    const youKeep = shooterSide === "them" && (o.mode === "save" || o.mode === "fksave" || o.mode === "shootout");
    v3.draw({ now, dt: S.dt, state: S.state, kick: k, ball: ballAt(k, now), rest: rest(), keeper: keeperPos(k, now), keeperHome: S.kHome,
      shooterSide, youShoot, youKeep, run: S.state === "prep" ? cl((now - S.prepStart) / 1500, 0, 1) : 1, tell: S.state === "prep" ? S.tell : 0,
      number: youShoot && tr.mine !== false ? (o.number || 9) : isFk() ? 10 : 7 + ((S.kickIndex - (S.state === "after" ? 1 : 0)) >> 1) % 5 * 2, wall: isFk() ? S.wall : null,
      ballAtWall: k && k.fk ? fkBall(k, FK.wallU) : null, netShake: S.netShake, shake: S.shake, afterStart: S.afterStart, prepStart: S.prepStart });
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S.cv.width, S.cv.height);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    // traînée : les dernières positions du ballon à l'écran
    if (S.trailKick !== k) { S.trailKick = k; S.trail = []; }
    if (k && now >= k.start && !reduceMotion) {
      if (now <= flightEnd(k) + 250) { S.trail.push(v3.ballScreen()); if (S.trail.length > 14) S.trail.shift(); } else if (S.trail.length) S.trail.shift();
      S.trail.forEach((q, i) => { const a = (i + 1) / S.trail.length; ctx.fillStyle = `rgba(245,197,66,${0.3 * a})`; ctx.beginPath(); ctx.arc(q.x, q.y, 2 + 5 * a, 0, 7); ctx.fill(); });
    }
    drawParts(v3.goalToScreen);
    if (S.state === "aim" || S.state === "power" || S.state === "curl") {
      const a0 = S.state === "aim" ? aimPoint(now) : S.aim, a = v3.goalToScreen(a0.x, a0.y);
      ctx.strokeStyle = "#f5c542"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(a.x, a.y, 11, 0, 7); ctx.stroke();
      line(a.x - 17, a.y, a.x - 6, a.y); line(a.x + 6, a.y, a.x + 17, a.y); line(a.x, a.y - 17, a.x, a.y - 6); line(a.x, a.y + 6, a.x, a.y + 17);
    }
    if (S.swipe && S.swipe.s1 && S.swipe.s0.y - S.swipe.s1.y > 20) {
      const g = v3.aimFromSwipe(S.swipe.s0, S.swipe.s1), a = v3.goalToScreen(g.x, g.y);
      ctx.strokeStyle = "rgba(245,197,66,.95)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(a.x, a.y, 12, 0, 7); ctx.stroke();
      ctx.fillStyle = "rgba(245,197,66,.35)"; ctx.beginPath(); ctx.arc(a.x, a.y, 5, 0, 7); ctx.fill();
    }
    drawSwipeGuide(now, v3.nearToScreen);
    drawHud(now);
  }

  // traînée du ballon en vol : ses dernières positions, de plus en plus pâles
  function drawTrail(b, k, now) {
    if (S.trailKick !== k) { S.trailKick = k; S.trail = []; }
    if (!k || now < k.start || reduceMotion) return;
    if (now <= flightEnd(k) + 250) { S.trail.push({ x: b.x, y: b.y, r: b.r }); if (S.trail.length > 16) S.trail.shift(); }
    else if (S.trail.length) S.trail.shift();
    const ctx = S.ctx;
    S.trail.forEach((q, i) => { const a = (i + 1) / S.trail.length; ctx.fillStyle = `rgba(245,197,66,${0.28 * a})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (0.45 + 0.5 * a), 0, 7); ctx.fill(); });
  }
  // paillettes d'un geste réussi : elles retombent en s'éteignant
  function drawParts(m) {
    const ctx = S.ctx;
    S.parts = S.parts.filter(q => (q.age += S.dt) < q.life);
    for (const q of S.parts) {
      q.x += q.vx * S.dt; q.y += q.vy * S.dt; q.vy += 0.0006 * S.dt;
      const pt = m ? m(q.x, q.y) : q;
      ctx.globalAlpha = 1 - q.age / q.life; ctx.fillStyle = q.c; ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
  // guide du geste : la flèche suit le doigt pendant le glissé ; avant, une flèche pulse au-dessus du ballon
  function drawSwipeGuide(now, m) {
    const ctx = S.ctx, b0 = rest(), M = m || ((x, y) => ({ x, y })), b = { ...b0, ...M(b0.x, b0.y) };
    if (S.swipe) {
      const s = { ...S.swipe, pts: S.swipe.pts.map(q => M(q.x, q.y)), ...M(S.swipe.x0, S.swipe.y0) }, e = M(S.swipe.cur.x, S.swipe.cur.y);
      s.x0 = s.x; s.y0 = s.y;
      ctx.strokeStyle = "rgba(245,197,66,.9)"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); s.pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.lineTo(e.x, e.y); ctx.stroke();
      const a = Math.atan2(e.y - s.y0, e.x - s.x0);
      ctx.fillStyle = "#f5c542"; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * 12, e.y + Math.sin(a) * 12);
      ctx.lineTo(e.x + Math.cos(a + 2.4) * 12, e.y + Math.sin(a + 2.4) * 12); ctx.lineTo(e.x + Math.cos(a - 2.4) * 12, e.y + Math.sin(a - 2.4) * 12); ctx.fill();
      return;
    }
    if (!canSwipe()) return;
    const up = 10 * Math.sin(now / 260);
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(now / 260);
    ctx.strokeStyle = "#f5c542"; ctx.lineWidth = 3; ctx.lineCap = "round";
    line(b.x, b.y - 26 - up, b.x, b.y - 62 - up); line(b.x - 9, b.y - 52 - up, b.x, b.y - 64 - up); line(b.x + 9, b.y - 52 - up, b.x, b.y - 64 - up);
    ctx.globalAlpha = 1;
  }

  // horloge du jeu : elle ralentit dans les derniers mètres de ton tir (ralenti), pas pendant tes plongeons
  function frame(ts) {
    if (!S) return;
    const real = Math.min(50, ts - (S.lastTs || ts)), k = S.kick;
    S.lastTs = ts;
    const slow = !reduceMotion && S.state === "flight" && k && k.player && (S.now - k.start) / k.dur > 0.72 ? 0.32 : 1;
    S.dt = real * slow;
    S.now += S.dt;
    update();
    if (!S) return;
    render();
    S.raf = requestAnimationFrame(frame);
  }

  // debug : l’état de la séance en cours (pour les essais dans la console)
  return { play, active: () => !!S, debug: () => S };
})();

/* ============ Branchements dans la carrière ============ */
// Niveau de difficulté des penalties : niveau du joueur, forme, moral et talent « Sang-froid »
function penSkill(){ return clamp((p.lvl-40)/55+(has("sangfroid")?.12:0)+(p.moral-50)/400+(p.form-60)/500,0,1); }
function penTeams(opp){
  const usName = p.match?.type==="monde"?COUNTRIES[p.country].name:p.club.name;
  const us = clubColors(usName), them = clubColors(opp?opp.name:"Adversaire");
  return {us:{name:usName,short:usName.split(" ").pop(),a:us.a,b:us.b},them:{name:opp?opp.name:"Adversaire",short:opp?opp.name.split(" ").pop():"Adversaire",a:them.a,b:them.b}};
}
const MINI_TITLES = {shoot:"Penalty décisif",save:"Penalty à arrêter",fk:"Coup franc direct",fksave:"Coup franc à arrêter"};
const MINI_SUBS = {shoot:"Tout le stade te regarde.",save:"Tu es dans les cages. Lis le tireur et plonge.",fk:"Le mur est en place. À toi de le contourner.",fksave:"Ton mur est en place. Ne quitte pas le ballon des yeux."};
// tension du moment : enjeu du match et moral du joueur (le moteur l'atténue avec le sang-froid)
function penPressure(){
  const m = p.match, stake = m?{monde:.5,cdc:.45,final:.35,rival:.3,derby:.25}[m.type]||.25:.3;
  return clamp(stake+(50-p.moral)/200,0,.9);
}
const newPens = ()=>({tir:0,but:0,face:0,arret:0,cf:0,cfBut:0});
// garde la trace de tes coups de pied arrêtés joués (carte joueur, succès)
function recordPens(mode,mine){
  if(!mine||!p) return;
  const P = p.pens = p.pens||newPens();
  if(mode==="fk"){ P.cf += mine.shots; P.cfBut += mine.goals; }
  else { P.tir += mine.shots; P.but += mine.goals; }
  P.face += mine.faced; P.arret += mine.saves;
}
// joue un coup de pied arrêté (penalty ou coup franc, au tir ou dans les cages) et renvoie true si c'est réussi pour le joueur
function playMini(mode,title,opp){
  if(ui.quick||typeof Penalty==="undefined"||!minisOn("pen")) return Promise.resolve(null);
  return miniBrief(mode,title||MINI_TITLES[mode],opp?`Face à ${opp.name}`:"").then(go=>!go?Math.random()<(mode==="shoot"?0.72:mode==="fk"?0.3:0.35)+penSkill()*0.15:Penalty.play({mode,look:p.look,skill:penSkill(),pressure:penPressure(),title:title||MINI_TITLES[mode],sub:MINI_SUBS[mode],number:shirtNumber(),weather:p.match?.weather,...penTeams(opp)})
    .then(r=>{ recordPens(mode,r.mine); if(!r.skipped) recordMini(mode,r.success); return r.success; }));
}
function playShootout(m){
  if(ui.quick||typeof Penalty==="undefined"||!minisOn("pen")) return Promise.resolve(null);
  return miniBrief("shootout","Tirs au but",`${m.us}-${m.them} à la fin du temps réglementaire`).then(go=>!go?Math.random()<0.5:Penalty.play({mode:"shootout",look:p.look,skill:penSkill(),pressure:penPressure(),title:"Tirs au but · "+m.title,sub:`${m.us}-${m.them} à la fin du temps réglementaire`,youGK:p.pos==="GB",number:shirtNumber(),weather:m.weather,...penTeams(m.opp)})
    .then(r=>{ recordPens("shootout",r.mine); if(!r.skipped) recordMini("shootout",r.success); return r.success; }));
}
// repère les actions de match qui mènent à un coup de pied arrêté jouable
function tagPen(a){
  a.o.forEach(o=>{
    if(/^Chercher (le contact|le penalty)$/.test(o.t)) o.pen = "shoot";
    if(/Penalty pour l'adversaire/.test(a.txt)) o.pen = "save";
    if(/^Le tirer directement$/.test(o.t)) o.pen = "fk";
    if(/Coup franc adverse à vingt mètres/.test(a.txt)&&/^Lire la frappe/.test(o.t)) o.pen = "fksave";
    // les gestes de chaque poste (duel.js)
    if(/^(Dribbler le gardien|Contrôler et accélérer|Feinte de corps et sortie balle au pied|Dribbler l'attaquant)$/.test(o.t)) o.duel = "dribble";
    if(/^(Passe en profondeur|Décaler à droite|Amortir et servir l'attaquant|Servir l'ailier lancé)$/.test(o.t)) o.duel = "passe";
    if(/^(Tacle glissé|Fondre sur le porteur|Le serrer de près|Le presser pour récupérer)$/.test(o.t)) o.duel = "tacle";
    if(/^Sortir dans la foule$/.test(o.t)) o.duel = "aerien";
  });
  return a;
}
// les coups de pied arrêtés des événements de carrière deviennent jouables
EVENTS.push(
 {id:"cfDerniere",cond:()=>p.pos!=="GB"&&p.age>=18,txt:()=>"93e minute, 1-1. Coup franc idéalement placé, à vingt mètres. Le spécialiste de l'équipe te regarde.",
  ch:[{t:"Prendre le ballon",mini:"fk",risk:{p:()=>clamp(.3+(p.lvl-65)*.01+(p.trait==="tech"?.12:0),.12,.75),good:{rep:6,moral:8,moment:"Coup franc victorieux dans le temps additionnel",txt:"Enroulé, lucarne. Le stade explose."},bad:{moral:-4,rep:-1,txt:"Dans le mur. Le spécialiste lève les yeux au ciel."}}},
      {t:"Laisser le spécialiste",fx:{moral:-1,trust:1},why:"Il le met au-dessus. Personne ne t'en veut."}]},
 {id:"cfGB",cond:()=>p.pos==="GB",txt:()=>"Dernière minute, vous menez 1-0. Coup franc dangereux contre vous, plein axe.",
  ch:[{t:"Placer ton mur et lire la frappe",mini:"fksave",risk:{p:()=>clamp(.45+(p.lvl-65)*.01,.2,.8),good:{rep:5,moral:6,moment:"Arrêt décisif sur coup franc dans les derniers instants",txt:"Claquette en pleine lucarne ! La victoire est préservée."},bad:{moral:-5,txt:"Enroulé parfait, tu touches le ballon du bout des doigts… but."}}}]}
);
EVENTS.find(e=>e.id==="penalty").ch[0].mini = "shoot";
EVENTS.find(e=>e.id==="penaltyGB").ch.forEach(c=>c.mini = "save");
EVENTS.find(e=>e.id==="milCPA").ch[0].mini = "fk";
Object.assign(EVENT_TALENT,{cfDerniere:"frappe",cfGB:"reflexes"});
