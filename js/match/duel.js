// Trajectoire · Les gestes de chaque poste, joués au bon moment : dribble, tacle, sortie aérienne, passe
// Duel.play({kind, skill, pressure, title, us, them}) renvoie une promesse {success}. Vue de dessus, ton équipe attaque vers la droite.
const Duel = (() => {
  const W = 800, H = 420, reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // passe, en abscisses de la scène (32 px par mètre, le but adverse à droite hors champ) : ligne des 16,5 m,
  // dernier défenseur et n° 9, toujours un peu derrière lui, donc en jeu, à deux mètres de la surface
  const PASS_BOX = 646, PASS_LAST = 590, PASS_MATE = 570;
  // frappe de loin : la scène 3D recule de 14 m, le but est donc à x = 790 + 14 × 32 (hors du cadre 2D, dessiné à 780)
  const SHOT_GOAL = 1238, POST = 117, BAR = 78;
  const HEAD_KINDS = ["tete", "tete_def"];
  const lerp = (a, b, t) => a + (b - a) * t, cl = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a);
  const snd = n => { if (typeof sfx === "function") sfx(n); };
  const HELP = {
    dribble: "Deux défenseurs. Quand l'anneau se referme dans la zone verte, glisse le doigt dans le sens de la flèche (ou flèche ↑ ↓, ou appui en haut ou en bas du terrain).",
    tacle: "L'attaquant fonce sur toi. Tacle (Espace ou clic) quand il entre dans l'anneau jaune : trop tôt il t'efface, trop tard c'est la faute.",
    aerien: "Centre dans ta surface. Sors (Espace ou clic) quand le ballon arrive dans le cercle, avant que l'attaquant ne saute.",
    passe: "Trouve l'ouverture : passe (Espace ou clic) quand la ligne vers ton attaquant est verte. Le pressing arrive vite.",
    tete: "Corner pour ton équipe. Saute (Espace ou clic) quand le ballon entre dans le cercle, avant ton défenseur.",
    tete_def: "Centre dans ta surface. Saute (Espace ou clic) quand le ballon entre dans le cercle, avant leur attaquant.",
    transversale: "La jauge monte et descend : frappe (Espace ou clic) quand elle est dans la zone verte. Trop court, c'est intercepté ; trop long, en touche.",
    frappe: "Le viseur balaie le but : frappe (Espace ou clic) quand il passe dans une zone verte, près d'un poteau. Au centre, le gardien l'arrête."
  };
  /** @type {any} */
  let D = null;

  function play(opts) {
    const wait = typeof Stade3D !== "undefined" ? Stade3D.whenReady(1200) : Promise.resolve(false);
    return wait.then(() => start(opts));
  }
  function start(opts) {
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
    // passe : tu es au milieu, deux joueurs pressent, le dernier défenseur colle ton n° 9 juste devant la surface.
    // Le 9 reste à sa hauteur (jamais derrière lui) : il est en jeu.
    if (k === "passe") D.me = { x: 100, y: 210 }, D.defs = [260, 400, PASS_LAST].map((x, i) => ({ x, ph: rnd(0, 6), sp: rnd(1.6, 2.6) * lerp(1.25, 0.8, s), amp: rnd(70, 120) })), D.limit = 6000;
    // tête : le centre part du côté, arrive au cercle ; tu dois sauter juste avant ton vis-à-vis
    if (k === "tete") D.me = { x: 640, y: 228 }, D.att = { x: 666, y: 204 }, D.gk = { x: 784, y: 210 }, D.from = { x: 700, y: -260 }, D.to = { x: 646, y: 226 }, D.gy = 210 + (Math.random() < .5 ? -1 : 1) * rnd(55, 95);
    if (k === "tete_def") D.me = { x: 205, y: 214 }, D.att = { x: 228, y: 240 }, D.from = { x: 560, y: -250 }, D.to = { x: 210, y: 214 };
    if (HEAD_KINDS.includes(k)) D.dur = 1750 * rnd(0.92, 1.08), D.hitU = 0.78, D.winU = 0.075 + s * 0.06 - pr * 0.02;
    // transversale : tu es côté gauche, en défense ; l'ailier file côté opposé ; un milieu te presse
    if (k === "transversale") D.me = { x: 110, y: 330 }, D.mate = { x: 560, y: -250 }, D.def = { x: 600, y: -205 }, D.press = { x: 330, y: 250 }, D.zone0 = rnd(0.52, 0.68), D.zoneW = 0.13 + s * 0.08 - pr * 0.03, D.period = 1500 * lerp(0.85, 1.15, s), D.limit = 5600;
    // frappe : à 26 m du but, plein axe ; le viseur balaie le cadre ; un défenseur sort pour contrer
    if (k === "frappe") D.me = { x: 400, y: 214 }, D.gk = { x: SHOT_GOAL - 6, y: 210 }, D.block = { x: 560, y: 200 }, D.zoneW = 24 + s * 20 - pr * 6, D.aimSp = rnd(2.3, 2.9) * lerp(1.2, 0.85, s), D.limit = 5200;
  }

  function build() {
    const o = D.opts, el = document.createElement("div");
    el.className = "penmode" + (!["passe", "transversale", "frappe"].includes(o.kind) ? " duel-tall" : ""); // la passe garde le plan large : les deux joueurs doivent rester à l'image el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", o.title);
    el.innerHTML = `<div class="pen-wrap"><div class="pen-top"><div class="pen-titles"><p class="pen-eyebrow"></p><p class="pen-sub"></p></div></div>
      <div class="pen-stage"><canvas width="800" height="420" tabindex="0" role="img" aria-label="Le terrain vu de dessus. Espace, clic ou flèches pour jouer le geste." style="aspect-ratio:800/420"></canvas></div>
      <p class="pen-hint" aria-live="polite"></p><div class="pen-foot"><p class="pen-help"></p><button class="pen-skip" type="button">⏩ Simuler</button></div></div>`;
    el.querySelector(".pen-eyebrow").textContent = o.title;
    el.querySelector(".pen-sub").textContent = o.sub || "";
    el.querySelector(".pen-help").textContent = HELP[o.kind];
    document.body.appendChild(el);
    D.el = el; D.cv = el.querySelector("canvas"); D.ctx = D.cv.getContext("2d");
    D.v3 = typeof Stade3D !== "undefined" && Stade3D.ok() ? Stade3D.attachDuel(el.querySelector(".pen-stage"), { ...o, number: o.number }, CAST[o.kind]) : null;
    D.dpr = Math.min(2, window.devicePixelRatio || 1); D.cv.width = W * D.dpr; D.cv.height = H * D.dpr;
    // au doigt : glisser vers le haut ou le bas fait le crochet ; un simple appui joue selon la moitié touchée (ou tacle, sort, passe)
    D.cv.addEventListener("pointerdown", e => { D.down = { y: e.clientY, half: (e.clientY - D.cv.getBoundingClientRect().top) / D.cv.getBoundingClientRect().height * H < H / 2 ? "up" : "down" }; });
    D.cv.addEventListener("pointerup", e => {
      if (!D || !D.down) return;
      const dy = e.clientY - D.down.y, half = D.down.half; D.down = null;
      act(Math.abs(dy) > 25 ? (dy < 0 ? "up" : "down") : half);
    });
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
    hint({ dribble: "Balle au pied… prépare ton dribble !", tacle: "Il arrive sur toi…", aerien: "Le centre arrive…", passe: "Lève la tête, cherche l'ouverture…", tete: "Le tireur de corner lève le bras…", tete_def: "Le centre arrive…", transversale: "Repère ton ailier, de l'autre côté…", frappe: "Personne ne sort ? Arme ta frappe…" }[o.kind]);
  }
  function hint(t) { if (D) D.el.querySelector(".pen-hint").textContent = t; }
  function close() { if (!D) return; cancelAnimationFrame(D.raf); removeEventListener("keydown", D.onKey, true); if (D.v3) D.v3.detach(); D.el.remove(); D = null; }

  function end(success, text) {
    if (D.state === "end") return;
    D.state = "end"; D.result = success; D.endAt = D.now;
    D.flash = { text, color: success ? "#f5c542" : "#ff6b6b", start: D.now };
    // geste réussi : paillettes autour de toi et légère secousse ; le téléphone vibre dans les deux cas
    D.shake = success ? 0.8 : 0.4;
    if (success && !reduceMotion && D.me) for (let i = 0; i < 50; i++) { const a = rnd(0, Math.PI * 2), v = rnd(0.06, 0.3); (D.parts = D.parts || []).push({ x: D.me.x, y: D.me.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(600, 1100), age: 0, c: Math.random() < 0.6 ? "#f5c542" : "#ffffff" }); }
    if (!D.skipped && navigator.vibrate && navigator.userActivation?.hasBeenActive) { try { navigator.vibrate(success ? [30, 40, 80] : 160); } catch (e) {} }
    hint(success ? "Réussi !" : "Raté…");
    snd(success ? "goal" : "concede");
    const session = D;
    setTimeout(() => { if (D !== session) return; const r = D.resolve, skipped = !!D.skipped; close(); r({ success, skipped }); }, 1300);
  }
  function skip() { if (D && D.state !== "end") D.skipped = true, end(Math.random() < 0.45 + D.opts.skill * 0.3, "SIMULÉ"); }

  // ---------- entrée du joueur ----------
  // un seul appui trop tôt par geste est pardonné : un avertissement, pas une défaite (au doigt, on anticipe vite)
  function grace(text) {
    if (D.graced) return false;
    D.graced = true;
    D.flash = { text, color: "#ff9f5a", start: D.now }; D.shake = 0.25;
    hint("Attends le bon moment… dernière chance !"); snd("click");
    if (navigator.vibrate && navigator.userActivation?.hasBeenActive) { try { navigator.vibrate(40); } catch (e) {} }
    return true;
  }
  function act(dir) {
    if (!D || D.state !== "play") return;
    D.acted = true;
    const k = D.opts.kind, t = D.now - D.t0;
    if (k === "dribble") {
      const d = D.defs[D.stage]; if (!d || d.cue == null) return;
      if (dir === "any") return; // le dribble se joue avec la bonne flèche (ou un clic en haut / en bas)
      if (d.ring > D.win && grace("TROP TÔT !")) return;
      const ok = d.ring <= D.win && dir === (d.dir < 0 ? "up" : "down");
      if (ok) { d.beaten = true; d.cue = null; snd("click"); D.stage++; if (D.stage >= D.defs.length) end(true, "IL EST PASSÉ !"); else hint("Encore un !"); }
      else end(false, d.ring > D.win ? "TROP TÔT" : "MAUVAIS CÔTÉ");
    }
    if (k === "tacle") {
      const dist = D.att.x - D.me.x;
      if (dist > 60 + D.band + 30 && grace("TROP TÔT !")) return;
      if (dist < 60) end(false, "FAUTE !"); else if (dist <= 60 + D.band) end(true, "TACLE PARFAIT !"); else end(false, "IL T'EFFACE");
    }
    if (k === "aerien") {
      const u = t / D.dur;
      if (u < D.catchU - 0.1 && grace("TROP TÔT !")) return;
      if (u < D.catchU) end(false, "SORTIE TROP TÔT"); else if (u <= D.catchU + D.winU) end(true, "CAPTÉ !"); else end(false, "TROP TARD");
    }
    if (k === "passe") { if (!laneOpen() && grace("LIGNE FERMÉE !")) return; if (laneOpen()) end(true, "PASSE PARFAITE !"); else end(false, "INTERCEPTÉ"); }
    if (HEAD_KINDS.includes(k)) {
      const u = t / D.dur;
      if (u < D.hitU - 0.1 && grace("TROP TÔT !")) return;
      D.jumpAt = D.now;
      if (u < D.hitU) end(false, "SAUT TROP TÔT"); else if (u <= D.hitU + D.winU) end(true, k === "tete" ? "BUT DE LA TÊTE !" : "DÉGAGÉ !"); else end(false, "IL TE DEVANCE");
    }
    if (k === "transversale") {
      const g = gauge(); D.shot = g;
      if (g < D.zone0) end(false, "TROP COURTE : INTERCEPTÉE"); else if (g <= D.zone0 + D.zoneW) end(true, "TRANSVERSALE PARFAITE !"); else end(false, "TROP LONGUE : EN TOUCHE");
    }
    if (k === "frappe") {
      const y = aim(), off = Math.abs(y - 210); D.shot = y;
      if (off > POST) end(false, "À CÔTÉ !"); else if (off >= POST - D.zoneW) end(true, "LUCARNE !"); else end(false, "ARRÊTÉ PAR LE GARDIEN");
    }
  }
  // ---------- jauge de la transversale et viseur de la frappe ----------
  function gauge() { return (1 - Math.cos((D.now - D.t0) / D.period * Math.PI * 2)) / 2; }
  function aim() { return 210 + Math.sin((D.now - D.t0) / 1000 * D.aimSp) * (POST + 34); }
  // le ballon du centre : au sol au départ, au cercle (à hauteur de tête) à hitU, puis il continue s'il n'est pas repris
  function headBall(u) {
    const v = u / D.hitU, f = D.from, to = D.to;
    if (v <= 1) return { x: lerp(f.x, to.x, v), y: lerp(f.y, to.y, v), h: 60 * v + 75 * Math.sin(Math.PI * v) };
    const w = v - 1; return { x: to.x + (to.x - f.x) * w, y: to.y + (to.y - f.y) * w, h: Math.max(0, 60 - 260 * w) };
  }

  // ---------- passe : la ligne entre toi et l'attaquant est-elle libre ? ----------
  function mate() { const t = (D.now - D.t0) / 1000; return { x: PASS_MATE, y: 210 + Math.sin(t * 1.3) * 90 }; }
  function defPos(d) { const t = (D.now - D.t0) / 1000; return { x: d.x, y: 210 + Math.sin(t * d.sp + d.ph) * d.amp }; }
  function laneOpen() {
    const a = D.me, b = mate();
    return D.defs.every(d => { const q = defPos(d), u = cl(((q.x - a.x) * (b.x - a.x) + (q.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2), 0, 1);
      return Math.hypot(a.x + u * (b.x - a.x) - q.x, a.y + u * (b.y - a.y) - q.y) > 28; });
  }

  // ---------- boucle ----------
  function update() {
    const k = D.opts.kind, t = D.now - D.t0;
    if (D.state === "intro" && t > 950) { D.state = "play"; D.t0 = D.now; hint({ dribble: "Attends le bon moment…", tacle: "Attends-le…", aerien: "Lis la trajectoire…", passe: "Cherche la ligne verte !", tete: "Suis le ballon jusqu'au cercle…", tete_def: "Suis le ballon jusqu'au cercle…", transversale: "Frappe dans la zone verte !", frappe: "Vise un poteau !" }[k]); return; }
    if (D.state !== "play") return;
    if (D.flash && D.now - D.flash.start > 800) D.flash = null; // l'avertissement « trop tôt » s'efface
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
    if (HEAD_KINDS.includes(k)) { if (t / D.dur > D.hitU + D.winU + 0.02) end(false, k === "tete" ? "LE DÉFENSEUR TE DEVANCE" : "IL TE DEVANCE DE LA TÊTE"); }
    if (k === "transversale") { const f = cl(t / D.limit, 0, 1); D.press.x = lerp(330, 160, f); D.press.y = lerp(250, 320, f); if (t > D.limit) end(false, "PRESSING : BALLON PERDU"); }
    if (k === "frappe") { const f = cl(t / D.limit, 0, 1); D.block.x = lerp(560, 440, f); if (t > D.limit) end(false, "CONTRÉ !"); }
  }

  // ---------- dessin ----------
  // joueur vu de dessus : ombre, épaules aux couleurs du club, bras qui balancent, tête ; face au jeu (droite pour ton équipe)
  function player(x, y, color, label, you, face = you || label ? 1 : -1) {
    const c = D.ctx, sw = Math.sin(D.now / 120 + x * 0.05) * 3;
    c.save(); c.translate(x, y);
    if (you) { c.fillStyle = "rgba(245,197,66,.25)"; c.beginPath(); c.arc(0, 0, 27, 0, 7); c.fill(); }
    c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(3, 6, 18, 11, 0, 0, 7); c.fill();
    c.scale(face, 1);
    // bras
    c.strokeStyle = color; c.lineCap = "round"; c.lineWidth = 6;
    c.beginPath(); c.moveTo(-2, -14); c.lineTo(6 + sw, -19); c.stroke();
    c.beginPath(); c.moveTo(-2, 14); c.lineTo(6 - sw, 19); c.stroke();
    // épaules et maillot
    c.fillStyle = color; c.beginPath(); c.ellipse(0, 0, 11, 16, 0, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.ellipse(-3, -4, 6, 9, 0, 0, 7); c.fill();
    c.strokeStyle = you ? "#f5c542" : "rgba(255,255,255,.75)"; c.lineWidth = you ? 2.5 : 1.4; c.beginPath(); c.ellipse(0, 0, 11, 16, 0, 0, 7); c.stroke();
    // tête
    c.fillStyle = "#2a1d14"; c.beginPath(); c.arc(1, 0, 7, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,.15)"; c.beginPath(); c.arc(-1, -2, 3, 0, 7); c.fill();
    c.restore();
    if (label) { c.fillStyle = you ? "#f5c542" : "#fff"; c.font = '800 15px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = "rgba(8,13,24,.8)"; c.strokeText(label, x, y - 25); c.fillText(label, x, y - 25); }
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
    if (D.opts.kind === "transversale") return; // milieu de terrain : aucune surface dans le cadre
    if (D.opts.kind === "aerien" || D.opts.kind === "tacle" || D.opts.kind === "tete_def") { c.strokeRect(10, 90, 130, 240); c.strokeRect(10, 160, 45, 100); c.fillStyle = "rgba(255,255,255,.9)"; c.fillRect(2, 175, 8, 70); }
    // la passe se joue plus haut : seule la ligne des 16,5 m (et son arc) entre dans le cadre, le but est hors champ
    else if (D.opts.kind === "passe") { c.beginPath(); c.moveTo(PASS_BOX, 10); c.lineTo(PASS_BOX, H - 10); c.stroke(); c.beginPath(); c.arc(PASS_BOX + 176, 210, 293, Math.PI * .705, Math.PI * 1.295); c.stroke(); }
    else { c.strokeRect(W - 140, 90, 130, 240); c.strokeRect(W - 55, 160, 45, 100); c.fillStyle = "rgba(255,255,255,.9)"; c.fillRect(W - 10, 175, 8, 70); }
  }
  function render() {
    if (D.v3) return render3d();
    const c = D.ctx, o = D.opts, k = o.kind, t = D.now - D.t0, us = o.us.a, them = o.them.a === us ? "#f2f2f2" : o.them.a;
    // caméra qui zoome et suit l'action (plus serrée pour le dribble, plus large pour la passe), avec une secousse sur la fin
    const sh = D.shake > 0 && !reduceMotion ? D.shake : 0, dp = D.dpr;
    const s = { dribble: 1.7, tacle: 1.45, aerien: 1.25, passe: 1.3, tete: 1.4, tete_def: 1.4, transversale: 1, frappe: 1 }[k];
    const want = k === "dribble" ? D.me.x + 140 : k === "tacle" ? (D.me.x + D.att.x) / 2 : k === "tete" ? 640 : k === "tete_def" ? 220 : 390;
    const hw = W / (2 * s), hh = H / (2 * s);
    D.camX = D.camX == null || reduceMotion ? want : lerp(D.camX, want, 0.08);
    const cx = cl(D.camX, hw, W - hw), cy = cl(210, hh, H - hh);
    c.setTransform(dp * s, 0, 0, dp * s, dp * (W / 2 - cx * s + Math.sin(D.now * 0.09) * 7 * sh), dp * (H / 2 - cy * s + Math.cos(D.now * 0.11) * 5 * sh));
    D.shake = Math.max(0, (D.shake || 0) - 0.03);
    pitch();
    if (k === "dribble") {
      D.defs.forEach(d => player(d.x, d.y + (d.beaten ? Math.sin(d.spin) * 6 : 0), them, ""));
      const d = D.defs[D.stage];
      if (d && d.cue != null && D.state === "play") {
        // la zone verte : le bon moment ; l'anneau se referme dessus
        const inWin = d.ring <= D.win;
        c.fillStyle = inWin ? "rgba(95,211,141,.35)" : "rgba(95,211,141,.14)"; c.beginPath(); c.arc(d.x, d.y, 18 + D.win, 0, 7); c.fill();
        c.strokeStyle = inWin ? "#5fd38d" : "#f5c542"; c.lineWidth = 4; c.beginPath(); c.arc(d.x, d.y, 18 + d.ring, 0, 7); c.stroke();
        c.fillStyle = inWin ? "#5fd38d" : "#fff"; c.font = '900 42px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "center";
        c.lineWidth = 5; c.strokeStyle = "rgba(8,13,24,.8)"; c.strokeText(d.dir < 0 ? "↑" : "↓", d.x, d.y - 46); c.fillText(d.dir < 0 ? "↑" : "↓", d.x, d.y - 46);
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
    }
    if (HEAD_KINDS.includes(k)) {
      const u = cl(t / D.dur, 0, 1), on = D.state === "play" && u >= D.hitU && u <= D.hitU + D.winU;
      c.strokeStyle = on ? "#5fd38d" : "rgba(245,197,66,.85)"; c.lineWidth = 3; c.beginPath(); c.arc(D.to.x, D.to.y, 24, 0, 7); c.stroke();
      if (D.gk) player(D.gk.x, D.gk.y, "#1d1f2b", "");
      player(D.att.x, D.att.y, them, ""); player(D.me.x, D.me.y, us, "TOI", true);
      if (D.state !== "intro") { const b = D.state === "end" && D.result ? { x: lerp(D.to.x, k === "tete" ? 790 : D.to.x + 300, cl((D.now - D.endAt) / 400, 0, 1)), y: lerp(D.to.y, k === "tete" ? D.gy : -100, cl((D.now - D.endAt) / 400, 0, 1)), h: 40 } : headBall(u); ball(b.x, b.y, b.h); }
    }
    if (k === "transversale") {
      player(D.def.x / 1.3, 60, them, ""); player(D.press.x, D.press.y * 0.9, them, ""); player(D.mate.x / 1.3, 40, us, "7"); player(D.me.x, 360, us, "TOI", true);
      c.strokeStyle = "rgba(255,255,255,.6)"; c.setLineDash([10, 8]); c.lineWidth = 3; c.beginPath(); c.moveTo(D.me.x, 360); c.quadraticCurveTo(300, 60, D.mate.x / 1.3, 40); c.stroke(); c.setLineDash([]);
      if (D.state === "end" && D.result) { const f = cl((D.now - D.endAt) / 700, 0, 1); ball(lerp(D.me.x, D.mate.x / 1.3, f), lerp(360, 40, f), Math.sin(Math.PI * f) * 90); } else ball(D.me.x + 16, 364);
    }
    if (k === "frappe") {
      c.strokeStyle = "#fff"; c.lineWidth = 5; c.beginPath(); c.moveTo(780, 210 - POST * 0.9); c.lineTo(780, 210 + POST * 0.9); c.stroke();
      player(774, 210, "#1d1f2b", ""); player(D.block.x, D.block.y, them, ""); player(D.me.x, D.me.y, us, "TOI", true);
      if (D.state === "end" && D.shot != null) { const f = cl((D.now - D.endAt) / 450, 0, 1); ball(lerp(D.me.x, 780, f), lerp(D.me.y, 210 + (D.shot - 210) * 0.9, f), 30 * f); } else ball(D.me.x + 16, D.me.y + 4);
    }
    if (D.parts) {
      const dt = Math.min(50, D.now - (D.prev || D.now));
      D.parts = D.parts.filter(q => (q.age += dt) < q.life);
      for (const q of D.parts) { q.x += q.vx * dt; q.y += q.vy * dt; c.globalAlpha = 1 - q.age / q.life; c.fillStyle = q.c; c.fillRect(q.x - 2, q.y - 2, 4, 4); }
      c.globalAlpha = 1;
    }
    // la suite (chrono, texte final) reste à l'échelle de l'écran
    c.setTransform(dp, 0, 0, dp, 0, 0);
    if (k === "transversale" && D.state === "play") drawGauge(c);
    if (k === "frappe" && D.state === "play") drawGoalAim(c);
    if ((k === "transversale" || k === "frappe") && D.state === "play") timer(c);
    if (k === "passe" && D.state === "play") { c.fillStyle = "rgba(8,13,24,.7)"; c.fillRect(300, 390, 200, 14); c.fillStyle = "#ff6b6b"; c.fillRect(300, 390, 200 * cl(1 - t / D.limit, 0, 1), 14); }
    if (D.flash) {
      const age = (D.now - D.flash.start) / 1000, sc = reduceMotion ? 1 : 1 + Math.max(0, 0.3 - age);
      c.save(); c.globalAlpha = cl(1.6 - age, 0, 1); c.translate(400, 210); c.scale(sc, sc);
      c.font = '800 64px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.lineWidth = 8; c.strokeStyle = "rgba(8,13,24,.85)"; c.strokeText(D.flash.text, 0, 0); c.fillStyle = D.flash.color; c.fillText(D.flash.text, 0, 0);
      c.restore();
    }
  }
  // la jauge de puissance (zone verte = la bonne longueur) et le chrono du pressing, à l'échelle de l'écran
  function drawGauge(c) {
    const x0 = 250, w = 300, y0 = 352, g = gauge();
    c.fillStyle = "rgba(8,13,24,.75)"; c.fillRect(x0 - 4, y0 - 4, w + 8, 26);
    c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(x0, y0, w, 18);
    c.fillStyle = "rgba(95,211,141,.85)"; c.fillRect(x0 + w * D.zone0, y0, w * D.zoneW, 18);
    const on = g >= D.zone0 && g <= D.zone0 + D.zoneW;
    c.fillStyle = on ? "#5fd38d" : "#f5c542"; c.fillRect(x0 + w * g - 3, y0 - 8, 6, 34);
    c.font = '800 14px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "left"; c.fillStyle = "#fff"; c.fillText("COURT", x0, y0 - 10); c.textAlign = "right"; c.fillText("LONG", x0 + w, y0 - 10);
  }
  // le but vu de face, en haut au centre (les côtés du terrain sont rognés sur téléphone) : zones vertes près des poteaux, le gardien au centre, le viseur qui balaie
  function drawGoalAim(c) {
    const gx = 310, gy = 18, gw = 180, gh = 70, sc = gw / (2 * POST), y = aim(), off = Math.abs(y - 210), on = off <= POST && off >= POST - D.zoneW;
    const X = v => gx + gw / 2 + (v - 210) * sc;
    c.fillStyle = "rgba(8,13,24,.72)"; c.fillRect(gx - 26, gy - 10, gw + 52, gh + 22);
    c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(gx, gy, gw, gh);
    c.fillStyle = "rgba(95,211,141,.6)"; c.fillRect(gx, gy, D.zoneW * sc, gh); c.fillRect(gx + gw - D.zoneW * sc, gy, D.zoneW * sc, gh);
    // le gardien : il couvre tout ce qui n'est pas vert
    c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.arc(gx + gw / 2, gy + 22, 8, 0, 7); c.fill(); c.fillRect(gx + gw / 2 - 30, gy + 32, 60, 8); c.fillRect(gx + gw / 2 - 7, gy + 32, 14, 34);
    c.strokeStyle = "#fff"; c.lineWidth = 4; c.beginPath(); c.moveTo(gx, gy + gh); c.lineTo(gx, gy); c.lineTo(gx + gw, gy); c.lineTo(gx + gw, gy + gh); c.stroke();
    c.strokeStyle = on ? "#5fd38d" : off > POST ? "#ff6b6b" : "#f5c542"; c.lineWidth = 4; c.beginPath(); c.moveTo(X(y), gy - 6); c.lineTo(X(y), gy + gh + 6); c.stroke();
    c.beginPath(); c.arc(X(y), gy + 18, 9, 0, 7); c.stroke();
  }
  function timer(c) { const t = D.now - D.t0; c.fillStyle = "rgba(8,13,24,.7)"; c.fillRect(300, 392, 200, 12); c.fillStyle = "#ff6b6b"; c.fillRect(300, 392, 200 * cl(1 - t / D.limit, 0, 1), 12); }
  // ---------- en 3D : le même moteur, filmé de côté dans le stade ----------
  // les acteurs de chaque geste (toi en premier) ; Stade3D les habille aux couleurs des équipes
  const CAST = {
    dribble: [{ id: "me", team: "us", you: true }, { id: "d0", team: "them" }, { id: "d1", team: "them" }],
    tacle: [{ id: "me", team: "us", you: true }, { id: "att", team: "them" }],
    aerien: [{ id: "me", team: "us", you: true, gk: true }, { id: "att", team: "them" }, { id: "cross", team: "them" }],
    passe: [{ id: "me", team: "us", you: true }, { id: "mate", team: "us", number: 9 }, { id: "d0", team: "them" }, { id: "d1", team: "them" }, { id: "d2", team: "them" }],
    tete: [{ id: "me", team: "us", you: true }, { id: "att", team: "them" }, { id: "gk", team: "them", gk: true }],
    tete_def: [{ id: "me", team: "us", you: true }, { id: "att", team: "them" }],
    transversale: [{ id: "me", team: "us", you: true }, { id: "mate", team: "us", number: 7 }, { id: "def", team: "them" }, { id: "press", team: "them" }],
    frappe: [{ id: "me", team: "us", you: true }, { id: "gk", team: "them", gk: true }, { id: "block", team: "them" }]
  };
  // en fin de geste : depuis combien de secondes, et pourquoi (le texte final dit ce qui s'est passé)
  const since = () => D.state === "end" ? (D.now - D.endAt) / 1000 : -1;
  const why = () => D.flash ? D.flash.text : "";
  function render3d() {
    const o = D.opts, k = o.kind, t = (D.now - D.t0) / 1000, play = D.state === "play", ended = D.state === "end", e = since();
    const A = {};
    let ballP = null, camX = 400;
    if (k === "dribble") {
      const lastDir = D.me.y - (D.prevY ?? D.me.y); D.prevY = D.me.y;
      // raté : s'il t'a taclé (tu n'as rien fait), il glisse et tu tombes ; si tu as joué trop tôt ou du mauvais côté,
      // il te prend simplement le ballon. Un défenseur effacé ne tombe pas : il se retourne et te regarde filer.
      const lost = ended && !D.result, tackled = lost && /TACLÉ/.test(why());
      A.me = { x: D.me.x, y: D.me.y, face: [1, lastDir * 3], anim: tackled && e > .25 ? "chute" : lost ? "attente" : "course", time: tackled ? e - .25 : lost ? e : t * 1.25, loop: !tackled };
      D.defs.forEach((d, i) => {
        const cur = lost && i === D.stage, back = d.beaten && D.me.x > d.x;
        A["d" + i] = { x: d.x, y: d.y, face: back ? [1, (D.me.y - d.y) / 300] : [-1, (D.me.y - d.y) / 300], anim: cur ? (tackled ? "tacle" : "controle") : d.beaten ? "attente" : "gb_attente", time: cur ? (tackled ? e + .1 : 1.2 + e) : t + i * 1.3, loop: !cur };
      });
      const stealer = lost ? D.defs[D.stage] : null;
      ballP = stealer ? { x: lerp(D.me.x + 16, stealer.x - 14, cl(e * 3, 0, 1)), y: lerp(D.me.y + 4, stealer.y + 4, cl(e * 3, 0, 1)), h: 0 } : { x: D.me.x + 16, y: D.me.y + 4, h: 0 };
      camX = D.me.x + 140;
    }
    if (k === "tacle") {
      const won = ended && D.result, foul = ended && /FAUTE/.test(why()), acted = !!D.acted;
      // effacé ou trop tard : l'attaquant poursuit sa course ; taclé : il tombe
      const gone = ended && !won && !foul ? e * 140 : 0;
      A.att = { x: D.att.x - gone, y: D.att.y, face: [-1, 0], anim: won || foul ? "chute" : "course", time: won || foul ? e : t * 1.25, loop: !(won || foul) };
      A.me = { x: D.me.x, y: D.me.y, face: [1, (D.att.y - D.me.y) / 200], anim: acted ? "tacle_glisse" : "gb_attente", time: acted ? .5 + e : t, loop: !acted, ip: !acted };
      ballP = won ? { x: D.me.x + 70 + e * 60, y: D.me.y + 30, h: 0 } : { x: D.att.x - gone - 16, y: D.att.y + 4, h: 0 };
      camX = (D.me.x + D.att.x) / 2;
    }
    if (k === "aerien") {
      const u = play || ended ? cl((D.now - D.t0) / D.dur, 0, 1) : 0, sx = 650, sy = 40, tx = 175, ty = 220;
      const caught = ended && D.result;
      A.cross = { x: sx + 30, y: sy + 10, face: [-1, .3], anim: "frappe2", time: play || ended ? .31 + t : 0 };
      A.att = { x: D.att.x, y: D.att.y, face: [-1, -.2], anim: u > .7 ? "tete" : "attente", time: u > .7 ? .85 + (u - .7) * D.dur / 1000 : t, loop: u <= .7 };
      A.me = { x: caught ? lerp(D.me.x, tx - 10, cl(e * 3, 0, 1)) : D.me.x, y: D.me.y, face: [1, 0], anim: caught ? "gb_arret_haut" : ended ? "gb_rate" : "gb_attente", time: caught ? .55 + e : ended ? e + .3 : t, loop: !ended };
      const hold = caught ? { x: A.me.x + 10, y: D.me.y, h: 62 } : null;
      camX = 250;
      if (D.state !== "intro") ballP = hold || { x: lerp(sx, tx, u), y: lerp(sy, ty, u), h: Math.sin(Math.PI * Math.min(u, .98)) * 110 + (1 - u) * 20 };
    }
    if (k === "passe") {
      const m = mate(), dt = 1 / 60;
      const vel = (fy, fy2) => (fy2 - fy) / dt;
      const ok = ended && D.result;
      A.me = { x: D.me.x, y: D.me.y, face: [1, (m.y - D.me.y) / 540], anim: ended ? "frappe2" : "attente", time: ended ? .31 + e : t, loop: !ended };
      const mv = Math.cos((D.now - D.t0) / 1000 * 1.3);
      A.mate = { x: m.x, y: m.y, face: [-.3, mv], anim: "course", time: t * 1.1, loop: true };
      D.defs.forEach((d, i) => { const q = defPos(d), dv = Math.cos((D.now - D.t0) / 1000 * d.sp + d.ph); A["d" + i] = { x: q.x, y: q.y, face: [-.5, dv], anim: "course", time: t + i * .3, loop: true }; });
      if (ended) { const f = cl(e / .5, 0, 1); const to = ok ? m : defPos(D.defs.reduce((a, d) => Math.abs(defPos(d).y - D.me.y) < Math.abs(defPos(a).y - D.me.y) ? d : a)); ballP = { x: lerp(D.me.x + 16, to.x, e < .12 ? 0 : f), y: lerp(D.me.y + 4, to.y, e < .12 ? 0 : f), h: Math.sin(Math.PI * f) * 8 }; }
      else ballP = { x: D.me.x + 16, y: D.me.y + 4, h: 0 };
      camX = 400;
    }
    if (HEAD_KINDS.includes(k)) {
      const u = play || ended ? cl((D.now - D.t0) / D.dur, 0, 1) : 0, won = ended && D.result, jumped = D.jumpAt != null;
      const meHead = jumped ? (D.now - D.jumpAt) / 1000 : -1, attHead = ended && !won && !jumped ? e : u > D.hitU - 0.05 && !won ? (u - D.hitU + 0.05) * D.dur / 1000 : -1;
      // tu prends ton élan vers le point de chute, puis tu sautes ; ton vis-à-vis saute aussi s'il te devance
      A.me = { x: lerp(D.me.x - (k === "tete" ? 40 : -30), D.me.x, cl(u / D.hitU, 0, 1)), y: D.me.y, face: k === "tete" ? [1, -.2] : [1, -.4], anim: meHead >= 0 ? "tete" : u > .2 ? "course" : "attente", time: meHead >= 0 ? .7 + meHead : t, loop: meHead < 0 };
      A.att = { x: D.att.x, y: D.att.y, face: k === "tete" ? [-1, .3] : [1, -.3], anim: attHead >= 0 ? "tete" : "attente", time: attHead >= 0 ? .7 + attHead : t + .5, loop: attHead < 0 };
      if (D.gk) A.gk = { x: D.gk.x, y: D.gk.y, face: [-1, 0], anim: won && e > .15 ? (D.gy < 210 ? "gb_plongeon_d" : "gb_plongeon_g") : "gb_attente", time: won ? e : t, loop: !won };
      const f = cl(e / .4, 0, 1);
      if (won) ballP = k === "tete" ? { x: lerp(D.to.x, 792, f), y: lerp(D.to.y, D.gy, f), h: lerp(60, 34, f) } : { x: lerp(D.to.x, D.to.x + 320, f), y: lerp(D.to.y, D.to.y - 260, f), h: 60 + Math.sin(Math.PI * f) * 120 };
      else if (ended && !jumped) ballP = k === "tete" ? { x: lerp(D.to.x, D.to.x - 240, f), y: lerp(D.to.y, D.to.y + 200, f), h: 60 + Math.sin(Math.PI * f) * 80 } : { x: lerp(D.to.x, 12, f), y: lerp(D.to.y, 195, f), h: lerp(60, 30, f) };
      else if (D.state !== "intro") ballP = headBall(u);
      camX = k === "tete" ? 680 : 150; // ton propre but reste à l'image
    }
    if (k === "transversale") {
      const won = ended && D.result, f = cl(e / .9, 0, 1), g = D.shot ?? 0;
      A.me = { x: D.me.x, y: D.me.y, face: [1, -.9], anim: ended ? "frappe2" : "attente", time: ended ? .31 + e : t, loop: !ended };
      A.mate = { x: D.mate.x + t * 18, y: D.mate.y, face: [1, .2], anim: "course", time: t * 1.1, loop: true };
      A.def = { x: D.def.x + t * 16, y: D.def.y, face: [1, .1], anim: "course", time: t * 1.05 + .3, loop: true };
      A.press = { x: D.press.x, y: D.press.y, face: [-1, .3], anim: "course", time: t * 1.2, loop: true };
      // la trajectoire suit la puissance : courte, elle meurt sur le milieu ; longue, elle file en touche
      const to = won ? { x: A.mate.x + 20, y: A.mate.y } : g < D.zone0 ? { x: 330, y: 60 } : { x: A.mate.x + 60, y: D.mate.y - 330 };
      ballP = ended ? { x: lerp(D.me.x + 16, to.x, e < .12 ? 0 : f), y: lerp(D.me.y + 4, to.y, e < .12 ? 0 : f), h: Math.sin(Math.PI * f) * (g < D.zone0 ? 70 : 170) } : { x: D.me.x + 16, y: D.me.y + 4, h: 0 };
      camX = 360;
    }
    if (k === "frappe") {
      const won = ended && D.result, f = cl(e / .45, 0, 1), y = D.shot ?? 210, off = Math.abs(y - 210);
      A.me = { x: D.me.x, y: D.me.y, face: [1, 0], anim: ended ? "frappe" : "attente", time: ended ? .45 + e : t, loop: !ended };
      A.block = { x: D.block.x, y: D.block.y, face: [-1, .1], anim: ended && /CONTRÉ/.test(why()) ? "tacle" : "course", time: ended ? e : t * 1.2, loop: !ended };
      const dive = ended && D.shot != null && off <= POST;
      A.gk = { x: D.gk.x, y: D.gk.y, face: [-1, 0], anim: dive ? (off < POST - D.zoneW ? "gb_arret" : y < 210 ? "gb_plongeon_d" : "gb_plongeon_g") : "gb_attente", time: dive ? e * (won ? .8 : 1) : t, loop: !dive };
      if (ended && D.shot != null) ballP = !won && off <= POST ? { x: lerp(D.me.x + 16, D.gk.x - 14, f), y: lerp(D.me.y, lerp(210, y, .4), f), h: 30 * f } : { x: lerp(D.me.x + 16, SHOT_GOAL + 8, f), y: lerp(D.me.y, y, f), h: lerp(0, won ? BAR - 10 : 40, f) + Math.sin(Math.PI * f) * 30 };
      else ballP = ended ? { x: lerp(D.me.x + 16, D.block.x, f), y: D.me.y, h: 0 } : { x: D.me.x + 16, y: D.me.y + 4, h: 0 };
      camX = 830; // ton tireur à gauche, le but entier à droite
    }
    // la fin du geste, mise en scène : le héros du moment exulte (ou se prend la tête), la caméra se rapproche de lui
    let star = null;
    if (ended) {
      const who = (k === "passe" || k === "transversale") && D.result ? A.mate : A.me, wait = { dribble: .3, tacle: .85, aerien: 9, passe: .55, tete: .6, tete_def: .6, transversale: 1, frappe: .6 }[k];
      if (D.result && who && e > wait) Object.assign(who, { anim: "attente", time: t, loop: true, ip: true, fade: 280, cheer: true });
      if (!D.result && A.me && k !== "aerien" && !/TACLÉ/.test(why()) && e > .45) Object.assign(A.me, { anim: "attente", time: t, loop: true, ip: true, fade: 280, despair: cl((e - .45) / .3, 0, 1) });
      star = who || A.me;
      // une frappe de loin : la caméra suit d'abord le ballon jusqu'au but, puis revient sur toi
      if (k === "frappe" && A.gk && e < .8) star = A.gk;
    }
    D.v3.drawDuel({ now: D.now, actors: A, ball: ballP, focus: star ? { x: star.x, k: cl(e / .8, 0, 1) } : null, camX, dist: { passe: 19, aerien: 13.5, tete: 13.5, tete_def: 13.5, transversale: 26, frappe: 31 }[k] || 12.5, shake: D.shake || 0, intro: D.state === "intro" });
    D.shake = Math.max(0, (D.shake || 0) - 0.03);
    overlay3d();
  }
  // les repères du geste, posés au sol de la scène 3D, puis l'interface à l'échelle de l'écran
  function overlay3d() {
    const c = D.ctx, o = D.opts, k = o.kind, P = (x, y, h) => D.v3.toScreen(x, y, h || 0), dp = D.dpr, t = D.now - D.t0;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, D.cv.width, D.cv.height); c.setTransform(dp, 0, 0, dp, 0, 0);
    const ring = (x, y, r, from = 0, to = Math.PI * 2) => { c.beginPath(); for (let i = 0; i <= 40; i++) { const a = from + (to - from) * i / 40, q = P(x + Math.cos(a) * r, y + Math.sin(a) * r); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); } };
    const label = (txt, x, y, h, col) => { const q = P(x, y, h); c.font = '800 18px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = "rgba(8,13,24,.85)"; c.strokeText(txt, q.x, q.y); c.fillStyle = col; c.fillText(txt, q.x, q.y); };
    if (k === "dribble") {
      const d = D.defs[D.stage];
      if (d && d.cue != null && D.state === "play") {
        const inWin = d.ring <= D.win;
        ring(d.x, d.y, 18 + D.win); c.fillStyle = inWin ? "rgba(95,211,141,.4)" : "rgba(95,211,141,.16)"; c.fill();
        ring(d.x, d.y, 18 + d.ring); c.strokeStyle = inWin ? "#5fd38d" : "#f5c542"; c.lineWidth = 4; c.stroke();
        const q = P(d.x, d.y, 2.6); c.font = '900 48px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "center"; c.lineWidth = 6; c.strokeStyle = "rgba(8,13,24,.85)";
        c.strokeText(d.dir < 0 ? "↑" : "↓", q.x, q.y); c.fillStyle = inWin ? "#5fd38d" : "#fff"; c.fillText(d.dir < 0 ? "↑" : "↓", q.x, q.y);
      }
    }
    if (k === "tacle" && D.state !== "end") {
      c.beginPath(); ring(D.me.x, D.me.y, 60, -0.9, 0.9); const outer = []; for (let i = 40; i >= 0; i--) { const a = -0.9 + 1.8 * i / 40; outer.push(P(D.me.x + Math.cos(a) * (60 + D.band), D.me.y + Math.sin(a) * (60 + D.band))); }
      outer.forEach(q => c.lineTo(q.x, q.y)); c.closePath(); c.fillStyle = "rgba(245,197,66,.45)"; c.fill(); c.strokeStyle = "rgba(245,197,66,.9)"; c.lineWidth = 2; c.stroke();
    }
    if (k === "aerien" && D.state !== "end") {
      const u = cl(t / D.dur, 0, 1), on = D.state === "play" && u >= D.catchU && u <= D.catchU + D.winU;
      ring(175, 220, 26); c.fillStyle = on ? "rgba(95,211,141,.4)" : "rgba(245,197,66,.12)"; c.fill(); c.strokeStyle = on ? "#5fd38d" : "rgba(245,197,66,.9)"; c.lineWidth = 3; c.stroke();
    }
    if (k === "passe" && D.state === "play") {
      const m = mate(), a = P(D.me.x, D.me.y, .05), b = P(m.x, m.y, .05), open = laneOpen();
      c.strokeStyle = open ? "rgba(95,211,141,.95)" : "rgba(255,107,107,.8)"; c.lineWidth = 5; c.setLineDash([12, 9]); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.setLineDash([]);
    }
    if (HEAD_KINDS.includes(k) && D.state !== "end") {
      const u = cl(t / D.dur, 0, 1), on = D.state === "play" && u >= D.hitU && u <= D.hitU + D.winU;
      ring(D.to.x, D.to.y, 24); c.fillStyle = on ? "rgba(95,211,141,.4)" : "rgba(245,197,66,.12)"; c.fill(); c.strokeStyle = on ? "#5fd38d" : "rgba(245,197,66,.9)"; c.lineWidth = 3; c.stroke();
    }
    if (k === "transversale" && D.state === "play") {
      // la course de l'ailier : là où la transversale doit tomber
      const a = P(D.me.x, D.me.y, .05), mx = D.mate.x + t / 1000 * 18 + 20, b = P(mx, D.mate.y, .05), m = P((D.me.x + mx) / 2, (D.me.y + D.mate.y) / 2, 4.5);
      c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 4; c.setLineDash([12, 9]); c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(m.x, m.y, b.x, b.y); c.stroke(); c.setLineDash([]);
      label("7", mx - 20, D.mate.y, 2.25, "#fff");
    }
    if (D.state !== "end") label("TOI", D.me.x, D.me.y, 2.25, "#f5c542");
    if (D.parts) {
      const dt = Math.min(50, D.now - (D.prev || D.now));
      D.parts = D.parts.filter(q => (q.age += dt) < q.life);
      for (const q of D.parts) { q.x += q.vx * dt; q.y += q.vy * dt; const s = P(q.x, q.y, 1.2); c.globalAlpha = 1 - q.age / q.life; c.fillStyle = q.c; c.fillRect(s.x - 2, s.y - 2, 4, 4); }
      c.globalAlpha = 1;
    }
    if (k === "passe" && D.state === "play") { c.fillStyle = "rgba(8,13,24,.7)"; c.fillRect(300, 390, 200, 14); c.fillStyle = "#ff6b6b"; c.fillRect(300, 390, 200 * cl(1 - t / D.limit, 0, 1), 14); }
    if (k === "transversale" && D.state === "play") drawGauge(c);
    if (k === "frappe" && D.state === "play") drawGoalAim(c);
    if ((k === "transversale" || k === "frappe") && D.state === "play") timer(c);
    if (D.flash) {
      const age = (D.now - D.flash.start) / 1000, sc = reduceMotion ? 1 : 1 + Math.max(0, 0.3 - age);
      c.save(); c.globalAlpha = cl(1.6 - age, 0, 1); c.translate(400, 90); c.scale(sc, sc);
      c.font = '800 64px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.lineWidth = 8; c.strokeStyle = "rgba(8,13,24,.85)"; c.strokeText(D.flash.text, 0, 0); c.fillStyle = D.flash.color; c.fillText(D.flash.text, 0, 0);
      c.restore();
    }
  }

  function frame(ts) { if (!D) return; D.prev = D.now; D.now = ts; update(); if (!D) return; render(); D.raf = requestAnimationFrame(frame); }

  // debug : l’état du geste en cours (pour les essais dans la console)
  return { play, active: () => !!D, debug: () => D };
})();

/* ============ Branchements ============ */
const DUEL_TITLES = { dribble: "Dribble", tacle: "Tacle", aerien: "Sortie aérienne", passe: "La passe qui tue", tete: "Coup de tête", tete_def: "Duel aérien", transversale: "Longue transversale", frappe: "Frappe de loin" };
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
  if (typeof miniInterrupted === "function" && miniInterrupted(kind)) return Promise.resolve(false);
  const opp = p.match?.opp, t = penTeams(opp);
  return miniBrief(kind,DUEL_TITLES[kind],opp?`Face ${oppA(opp)}`:"").then(go=>!go?Math.random()<0.45+penSkill()*0.3:(miniLockStart(kind),Duel.play({ kind, skill: penSkill(), pressure: penPressure(), title: DUEL_TITLES[kind], sub: opp ? `Face à ${opp.name}` : "", us: t.us, them: t.them, ...(typeof miniVenue === "function" ? miniVenue() : {}) })).then(r => { miniLockEnd(); if (!r.skipped) recordMini(kind, r.success); return r.success; }));
}
