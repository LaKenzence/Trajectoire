// Trajectoire · Les gestes de chaque poste, joués au bon moment : dribble, tacle, sortie aérienne, passe
// Duel.play({kind, skill, pressure, title, us, them}) renvoie une promesse {success}. Vue de dessus, ton équipe attaque vers la droite.
const Duel = (() => {
  const W = 800, H = 420, reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a, b, t) => a + (b - a) * t, cl = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a);
  const snd = n => { if (typeof sfx === "function") sfx(n); };
  const HELP = {
    dribble: "Deux défenseurs. Quand le cercle se referme sur l'un d'eux, appuie sur la flèche indiquée (↑ ou ↓, ou clique en haut ou en bas du terrain).",
    tacle: "L'attaquant fonce sur toi. Tacle (Espace ou clic) quand il entre dans l'anneau jaune : trop tôt il t'efface, trop tard c'est la faute.",
    aerien: "Centre dans ta surface. Sors (Espace ou clic) quand le ballon arrive dans le cercle, avant que l'attaquant ne saute.",
    passe: "Trouve l'ouverture : passe (Espace ou clic) quand la ligne vers ton attaquant est verte. Le pressing arrive vite."
  };
  /** @type {any} */
  let D = null;

  function play(opts) {
    return new Promise(resolve => {
      if (D) close();
      D = { opts, resolve, state: "intro", t0: performance.now(), now: performance.now(), stage: 0, result: null, flash: null };
      setup();
      build();
      D.raf = requestAnimationFrame(frame);
    });
  }

  // ---------- mise en place propre à chaque geste ----------
  function setup() {
    const k = D.opts.kind, s = D.opts.skill, pr = D.opts.pressure || 0;
    if (k === "dribble") D.defs = [360, 600].map(x => ({ x, y: 210, dir: Math.random() < 0.5 ? -1 : 1, beaten: false })), D.me = { x: 110, y: 210 }, D.win = 14 + s * 12 - pr * 4;
    if (k === "tacle") D.att = { x: 720, y: rnd(170, 250), feint: Math.random() < 0.45, feinted: false }, D.me = { x: 200, y: 210 }, D.band = 26 + s * 22 - pr * 6;
    if (k === "aerien") D.me = { x: 110, y: 210 }, D.att = { x: 230, y: 250 }, D.dur = 1800 * rnd(0.92, 1.08), D.catchU = 0.76, D.winU = 0.08 + s * 0.07 - pr * 0.02;
    if (k === "passe") D.me = { x: 120, y: 210 }, D.defs = [300, 420, 540].map((x, i) => ({ x, ph: rnd(0, 6), sp: rnd(1.6, 2.6) * lerp(1.25, 0.8, s), amp: rnd(70, 120) })), D.limit = 6000;
  }

  function build() {
    const o = D.opts, el = document.createElement("div");
    el.className = "penmode"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", o.title);
    el.innerHTML = `<div class="pen-wrap"><div class="pen-top"><div class="pen-titles"><p class="pen-eyebrow"></p><p class="pen-sub"></p></div></div>
      <div class="pen-stage"><canvas width="800" height="420" tabindex="0" role="img" aria-label="Le terrain vu de dessus. Espace, clic ou flèches pour jouer le geste." style="aspect-ratio:800/420"></canvas></div>
      <p class="pen-hint" aria-live="polite"></p><div class="pen-foot"><p class="pen-help"></p><button class="pen-skip" type="button">⏩ Simuler</button></div></div>`;
    el.querySelector(".pen-eyebrow").textContent = o.title;
    el.querySelector(".pen-sub").textContent = o.sub || "";
    el.querySelector(".pen-help").textContent = HELP[o.kind];
    document.body.appendChild(el);
    D.el = el; D.cv = el.querySelector("canvas"); D.ctx = D.cv.getContext("2d");
    D.dpr = Math.min(2, window.devicePixelRatio || 1); D.cv.width = W * D.dpr; D.cv.height = H * D.dpr;
    D.cv.addEventListener("pointerdown", e => { const r = D.cv.getBoundingClientRect(); act((e.clientY - r.top) / r.height * H < H / 2 ? "up" : "down"); });
    el.querySelector(".pen-skip").addEventListener("click", skip);
    D.onKey = e => {
      if (!D) return;
      e.stopPropagation();
      if (document.activeElement?.closest(".pen-skip")) return;
      if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); act("any"); }
      else if (e.key === "ArrowUp") { e.preventDefault(); act("up"); }
      else if (e.key === "ArrowDown") { e.preventDefault(); act("down"); }
    };
    addEventListener("keydown", D.onKey, true);
    D.cv.focus({ preventScroll: true });
    hint({ dribble: "Balle au pied… prépare ton dribble !", tacle: "Il arrive sur toi…", aerien: "Le centre arrive…", passe: "Lève la tête, cherche l'ouverture…" }[o.kind]);
  }
  function hint(t) { if (D) D.el.querySelector(".pen-hint").textContent = t; }
  function close() { if (!D) return; cancelAnimationFrame(D.raf); removeEventListener("keydown", D.onKey, true); D.el.remove(); D = null; }

  function end(success, text) {
    if (D.state === "end") return;
    D.state = "end"; D.result = success; D.endAt = D.now;
    D.flash = { text, color: success ? "#f5c542" : "#ff6b6b", start: D.now };
    hint(success ? "Réussi !" : "Raté…");
    snd(success ? "goal" : "concede");
    const session = D;
    setTimeout(() => { if (D !== session) return; const r = D.resolve, skipped = !!D.skipped; close(); r({ success, skipped }); }, 1300);
  }
  function skip() { if (D && D.state !== "end") D.skipped = true, end(Math.random() < 0.45 + D.opts.skill * 0.3, "SIMULÉ"); }

  // ---------- entrée du joueur ----------
  function act(dir) {
    if (!D || D.state !== "play") return;
    const k = D.opts.kind, t = D.now - D.t0;
    if (k === "dribble") {
      const d = D.defs[D.stage]; if (!d || d.cue == null) return;
      if (dir === "any") return; // le dribble se joue avec la bonne flèche (ou un clic en haut / en bas)
      const ok = d.ring <= D.win && dir === (d.dir < 0 ? "up" : "down");
      if (ok) { d.beaten = true; d.cue = null; snd("click"); D.stage++; if (D.stage >= D.defs.length) end(true, "IL EST PASSÉ !"); else hint("Encore un !"); }
      else end(false, d.ring > D.win ? "TROP TÔT" : "MAUVAIS CÔTÉ");
    }
    if (k === "tacle") {
      const dist = D.att.x - D.me.x;
      if (dist < 60) end(false, "FAUTE !"); else if (dist <= 60 + D.band) end(true, "TACLE PARFAIT !"); else end(false, "IL T'EFFACE");
    }
    if (k === "aerien") {
      const u = t / D.dur;
      if (u < D.catchU) end(false, "SORTIE TROP TÔT"); else if (u <= D.catchU + D.winU) end(true, "CAPTÉ !"); else end(false, "TROP TARD");
    }
    if (k === "passe") { if (laneOpen()) end(true, "PASSE PARFAITE !"); else end(false, "INTERCEPTÉ"); }
  }

  // ---------- passe : la ligne entre toi et l'attaquant est-elle libre ? ----------
  function mate() { const t = (D.now - D.t0) / 1000; return { x: 660, y: 210 + Math.sin(t * 1.3) * 90 }; }
  function defPos(d) { const t = (D.now - D.t0) / 1000; return { x: d.x, y: 210 + Math.sin(t * d.sp + d.ph) * d.amp }; }
  function laneOpen() {
    const a = D.me, b = mate();
    return D.defs.every(d => { const q = defPos(d), u = cl(((q.x - a.x) * (b.x - a.x) + (q.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2), 0, 1);
      return Math.hypot(a.x + u * (b.x - a.x) - q.x, a.y + u * (b.y - a.y) - q.y) > 28; });
  }

  // ---------- boucle ----------
  function update() {
    const k = D.opts.kind, t = D.now - D.t0;
    if (D.state === "intro" && t > 1400) { D.state = "play"; D.t0 = D.now; hint({ dribble: "Attends le bon moment…", tacle: "Attends-le…", aerien: "Lis la trajectoire…", passe: "Cherche la ligne verte !" }[k]); return; }
    if (D.state !== "play") return;
    const dt = Math.min(50, D.now - (D.prev || D.now)); // vitesse indépendante de la fréquence de l'écran
    if (k === "dribble") {
      D.me.x += 0.12 * dt;
      const d = D.defs[D.stage];
      if (d) {
        const dist = d.x - D.me.x;
        if (dist < 150 && d.cue == null && !d.beaten) { d.cue = D.now; hint(d.dir < 0 ? "↑ Crochet vers le haut !" : "↓ Crochet vers le bas !"); }
        if (d.cue != null) { d.ring = Math.max(0, 60 * (1 - (D.now - d.cue) / 1150)); if (D.now - d.cue > 1300) end(false, "TACLÉ"); }
      }
      D.defs.forEach(x => { if (x.beaten) x.spin = (x.spin || 0) + 0.2; });
      // contournement du défenseur battu
      const last = D.defs[D.stage - 1];
      D.me.y = last && D.me.x < last.x + 60 ? lerp(D.me.y, 210 + last.dir * 55, 0.2) : lerp(D.me.y, 210, 0.1);
    }
    if (k === "tacle") {
      const a = D.att; a.x -= 0.14 * dt * (a.feinted && D.now - a.feintAt < 250 ? 0.3 : 1);
      if (a.feint && !a.feinted && a.x < 470) { a.feinted = true; a.feintAt = D.now; a.y += Math.random() < 0.5 ? -50 : 50; hint("Feinte ! Reste concentré…"); }
      a.y = lerp(a.y, D.me.y + (a.feinted ? 0 : 0), 0.02);
      if (a.x - D.me.x < 30) end(false, "TROP TARD");
    }
    if (k === "aerien") { if (t / D.dur > D.catchU + D.winU + 0.02) end(false, "L'ATTAQUANT CATAPULTE DE LA TÊTE"); }
    if (k === "passe") { if (t > D.limit) end(false, "PRESSING : BALLON PERDU"); }
  }

  // ---------- dessin ----------
  function player(x, y, color, label, you) {
    const c = D.ctx;
    c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(x, y + 12, 14, 5, 0, 0, 7); c.fill();
    c.fillStyle = color; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill();
    c.strokeStyle = you ? "#f5c542" : "rgba(255,255,255,.7)"; c.lineWidth = you ? 3 : 1.5; c.stroke();
    if (label) { c.fillStyle = "#fff"; c.font = '800 14px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "center"; c.fillText(label, x, y - 20); }
  }
  function ball(x, y, h = 0) {
    const c = D.ctx;
    c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(x, y + 6, 6, 3, 0, 0, 7); c.fill();
    const r = 6 + h / 30, sprite = miniImg("ballon");
    if (sprite) { c.drawImage(sprite, x - r, y - h - r, r * 2, r * 2); return; }
    c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y - h, r, 0, 7); c.fill(); c.strokeStyle = "#111"; c.lineWidth = 1; c.stroke();
  }
  function pitch() {
    const c = D.ctx, grass = miniImg("pelouse-ciel");
    // la pelouse photographiée du ciel (sans ses tribunes), sinon des bandes vertes
    if (grass) { const w = grass.naturalWidth, h = grass.naturalHeight; c.drawImage(grass, w * 0.03, h * 0.17, w * 0.94, h * 0.67, 0, 0, W, H); }
    else for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? "#2f7d4a" : "#2a7343"; c.fillRect(i * 80, 0, 80, H); }
    c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 2;
    c.strokeRect(10, 10, W - 20, H - 20);
    if (D.opts.kind === "aerien" || D.opts.kind === "tacle") { c.strokeRect(10, 90, 130, 240); c.strokeRect(10, 160, 45, 100); c.fillStyle = "rgba(255,255,255,.9)"; c.fillRect(2, 175, 8, 70); }
    else { c.strokeRect(W - 140, 90, 130, 240); c.strokeRect(W - 55, 160, 45, 100); c.fillStyle = "rgba(255,255,255,.9)"; c.fillRect(W - 10, 175, 8, 70); }
  }
  function render() {
    const c = D.ctx, o = D.opts, k = o.kind, t = D.now - D.t0, us = o.us.a, them = o.them.a === us ? "#f2f2f2" : o.them.a;
    c.setTransform(D.dpr, 0, 0, D.dpr, 0, 0);
    pitch();
    if (k === "dribble") {
      D.defs.forEach(d => player(d.x, d.y + (d.beaten ? Math.sin(d.spin) * 6 : 0), them, ""));
      const d = D.defs[D.stage];
      if (d && d.cue != null && D.state === "play") {
        c.strokeStyle = d.ring <= D.win ? "#5fd38d" : "#f5c542"; c.lineWidth = 3; c.beginPath(); c.arc(d.x, d.y, 16 + d.ring, 0, 7); c.stroke();
        c.strokeStyle = "rgba(255,255,255,.4)"; c.beginPath(); c.arc(d.x, d.y, 16 + D.win, 0, 7); c.stroke();
        c.fillStyle = "#fff"; c.font = '800 34px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "center"; c.fillText(d.dir < 0 ? "↑" : "↓", d.x, d.y - 40);
      }
      player(D.me.x, D.me.y, us, "TOI", true); ball(D.me.x + 16, D.me.y + 4);
    }
    if (k === "tacle") {
      c.strokeStyle = "rgba(245,197,66,.85)"; c.lineWidth = D.band; c.beginPath(); c.arc(D.me.x, D.me.y, 60 + D.band / 2, -0.9, 0.9); c.stroke();
      player(D.att.x, D.att.y, them, ""); ball(D.att.x - 16, D.att.y + 4);
      player(D.me.x, D.me.y, us, "TOI", true);
    }
    if (k === "aerien") {
      const u = cl(t / D.dur, 0, 1), sx = 650, sy = 40, tx = 175, ty = 220;
      c.strokeStyle = u >= D.catchU && u <= D.catchU + D.winU ? "#5fd38d" : "rgba(245,197,66,.8)"; c.lineWidth = 3; c.beginPath(); c.arc(tx, ty, 26, 0, 7); c.stroke();
      const jump = u > 0.8 ? Math.sin(cl((u - 0.8) / 0.2, 0, 1) * Math.PI) * 10 : 0;
      player(D.att.x - jump, D.att.y - jump, them, "");
      player(lerp(D.me.x, tx - 10, D.state === "end" && D.result ? 1 : 0), D.me.y, us, "TOI", true);
      if (D.state !== "intro") ball(lerp(sx, tx, u), lerp(sy, ty, u), Math.sin(Math.PI * Math.min(u, 0.98)) * 110);
      player(sx + 30, sy + 10, them, "");
    }
    if (k === "passe") {
      const m = mate(), open = laneOpen();
      if (D.state === "play") { c.strokeStyle = open ? "rgba(95,211,141,.9)" : "rgba(255,107,107,.7)"; c.lineWidth = 4; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(D.me.x, D.me.y); c.lineTo(m.x, m.y); c.stroke(); c.setLineDash([]); }
      D.defs.forEach(d => { const q = defPos(d); player(q.x, q.y, them, ""); });
      player(m.x, m.y, us, "9"); player(D.me.x, D.me.y, us, "TOI", true);
      if (D.state === "end" && D.result) ball(lerp(D.me.x, m.x, cl((D.now - D.endAt) / 500, 0, 1)), lerp(D.me.y, m.y, cl((D.now - D.endAt) / 500, 0, 1))); else ball(D.me.x + 16, D.me.y + 4);
      // chrono du pressing
      if (D.state === "play") { c.fillStyle = "rgba(8,13,24,.7)"; c.fillRect(300, 380, 200, 14); c.fillStyle = "#ff6b6b"; c.fillRect(300, 380, 200 * cl(1 - t / D.limit, 0, 1), 14); }
    }
    if (D.flash) {
      const age = (D.now - D.flash.start) / 1000, sc = reduceMotion ? 1 : 1 + Math.max(0, 0.3 - age);
      c.save(); c.globalAlpha = cl(1.6 - age, 0, 1); c.translate(400, 210); c.scale(sc, sc);
      c.font = '800 64px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.lineWidth = 8; c.strokeStyle = "rgba(8,13,24,.85)"; c.strokeText(D.flash.text, 0, 0); c.fillStyle = D.flash.color; c.fillText(D.flash.text, 0, 0);
      c.restore();
    }
  }
  function frame(ts) { if (!D) return; D.prev = D.now; D.now = ts; update(); if (!D) return; render(); D.raf = requestAnimationFrame(frame); }

  return { play, active: () => !!D };
})();

/* ============ Branchements ============ */
const DUEL_TITLES = { dribble: "Dribble", tacle: "Tacle", aerien: "Sortie aérienne", passe: "La passe qui tue" };
// réglage du joueur : tous les mini-jeux, seulement les coups de pied arrêtés, ou aucun
let minisMode = (() => { try { return localStorage.getItem("trajectoire_minis") || "tous"; } catch (e) { return "tous"; } })();
const minisOn = kind => minisMode === "tous" || (minisMode === "arretes" && kind === "pen");
const MINIS_LABELS = { tous: "🎮 Mini-jeux : tous", arretes: "🎮 Mini-jeux : coups de pied arrêtés seulement", aucun: "🎮 Mini-jeux : désactivés" };
function cycleMinis(btn) {
  minisMode = minisMode === "tous" ? "arretes" : minisMode === "arretes" ? "aucun" : "tous";
  try { localStorage.setItem("trajectoire_minis", minisMode); } catch (e) {}
  if (btn) btn.textContent = MINIS_LABELS[minisMode];
}
const miniChip = o => (o.duel && minisOn("duel")) || (o.pen && minisOn("pen")) ? '<span class="chip">🎮 À jouer</span>' : "";
function playDuel(kind) {
  if (ui.quick || !minisOn("duel")) return Promise.resolve(null);
  const opp = p.match?.opp, t = penTeams(opp);
  return miniBrief(kind,DUEL_TITLES[kind],opp?`Face à ${opp.name}`:"").then(go=>!go?Math.random()<0.45+penSkill()*0.3:Duel.play({ kind, skill: penSkill(), pressure: penPressure(), title: DUEL_TITLES[kind], sub: opp ? `Face à ${opp.name}` : "", us: t.us, them: t.them }).then(r => { if (!r.skipped) recordMini(kind, r.success); return r.success; }));
}
