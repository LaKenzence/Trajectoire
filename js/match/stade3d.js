// Trajectoire · Le stade en 3D des coups de pied arrêtés (penalty, tirs au but, coup franc, côté tireur ou gardien)
// Le moteur de penalty.js garde toutes ses règles en coordonnées 2D (le plan du but) ; ce module ne fait que le dessin :
// il convertit ces coordonnées en mètres, place le stade, les joueurs animés et la caméra, et rend les points
// écran et jeu pour les glissés et les jauges. Three.js est chargé à la demande ; sans lui (hors ligne, WebGL absent,
// tests), Stade3D.ok() reste faux et penalty.js dessine en 2D comme avant.
const Stade3D = (() => {
  // Three.js et ses modules par jsDelivr (la même copie de Three pour tous), le joueur dans img/3d
  const CDN = "https://cdn.jsdelivr.net/npm/three@0.160.0/", MODEL = "img/3d/joueur.glb";
  const W = 800, H = 560;
  // le plan du but en 2D (penalty.js) : 340 px de large pour 7,32 m, 142 px de haut pour 2,44 m
  const GL = 230, GR = 570, GT = 120, GB = 262, PXH = 340 / 7.32, PXV = 142 / 2.44;
  const GW = 3.66, GH = 2.44;
  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a, b, t) => a + (b - a) * t, cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = u => 1 - Math.pow(1 - cl(u, 0, 1), 3);
  /** @type {any} */ let T = null, SU = null;
  let state = "idle", loading = null;
  /** @type {any} */ let R = null; // renderer, scène et décor, créés une fois et réutilisés

  // ---------- chargement ----------
  function webgl() {
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }
  function load() {
    if (loading) return loading;
    if (typeof document === "undefined" || typeof WebGLRenderingContext === "undefined" || !webgl()) { state = "off"; return loading = Promise.resolve(false); }
    state = "loading";
    return loading = Promise.all([import(CDN + "+esm"), import(CDN + "examples/jsm/loaders/GLTFLoader.js/+esm"), import(CDN + "examples/jsm/utils/SkeletonUtils.js/+esm")])
      .then(([three, gl, su]) => { T = three; SU = su; return new gl.GLTFLoader().loadAsync(MODEL); })
      .then(g => { prepModel(g); return warm(); })
      .then(() => { state = "ready"; return true; })
      .catch(() => { state = "off"; return false; });
  }
  // attend la 3D au plus `ms` millisecondes (elle se charge pendant la consigne du mini-jeu)
  function whenReady(ms) {
    if (state === "ready") return Promise.resolve(true);
    if (state === "off") return Promise.resolve(false);
    return Promise.race([load(), new Promise(r => setTimeout(() => r(false), ms))]);
  }
  const ok = () => state === "ready";

  // ---------- textures dessinées ----------
  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  // la pelouse : bandes de tonte et lignes de la surface, de x = -34 à 34 m et de z = -6 (derrière le but) à 46 m
  function pitchTex() {
    const S = 16, X0 = -34, Z0 = -6;
    return canvasTex(68 * S, 52 * S, (c, w, h) => {
      for (let z = -11, i = 0; z < 47; z += 5.5, i++) { c.fillStyle = i % 2 ? "#2f8a45" : "#37984d"; c.fillRect(0, (z - Z0) * S, w, 5.5 * S + 1); }
      // un léger grain, pour que l'herbe ne soit pas un aplat
      for (let i = 0; i < 9000; i++) { c.fillStyle = Math.random() < .5 ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.035)"; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      const px = x => (x - X0) * S, pz = z => (z - Z0) * S;
      c.strokeStyle = "rgba(255,255,255,.92)"; c.lineWidth = .13 * S;
      const rect = (x0, z0, x1, z1) => c.strokeRect(px(x0), pz(z0), px(x1) - px(x0), pz(z1) - pz(z0));
      c.beginPath(); c.moveTo(0, pz(0)); c.lineTo(w, pz(0)); c.stroke();
      rect(-9.16, 0, 9.16, 5.5); rect(-20.16, 0, 20.16, 16.5);
      c.fillStyle = "#fff"; c.beginPath(); c.arc(px(0), pz(11), .16 * S, 0, 7); c.fill();
      const a = Math.acos(5.5 / 9.15);
      c.beginPath(); c.arc(px(0), pz(11), 9.15 * S, Math.PI / 2 - a, Math.PI / 2 + a); c.stroke();
      // un liseré sombre derrière la ligne de but
      c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(0, 0, w, pz(0) - .1 * S);
    });
  }
  function crowdTex(home) {
    const cols = [home || "#c0392b", home || "#c0392b", "#f4f4f4", "#1d2b4f", "#e9c46a", "#2a2a2a", "#8d99ae", "#d62828"];
    return canvasTex(512, 256, (c, w, h) => {
      c.fillStyle = "#151a2c"; c.fillRect(0, 0, w, h);
      for (let row = 0; row < 16; row++) {
        c.fillStyle = "rgba(255,255,255,.04)"; c.fillRect(0, row * 16 + 13, w, 3);
        for (let x = 3; x < w; x += 7 + Math.random() * 3) {
          if (Math.random() < .08) continue;
          const y = row * 16 + 4 + Math.random() * 2;
          c.fillStyle = cols[(Math.random() * cols.length) | 0]; c.fillRect(x, y + 4, 5, 6);
          c.fillStyle = ["#f1c27d", "#c68642", "#8d5524", "#e0ac69"][(Math.random() * 4) | 0]; c.fillRect(x + 1, y, 3, 4);
        }
      }
    }, [6, 2]);
  }
  function boardsTex() {
    const words = ["TRAJECTOIRE", "ALLEZ !", "LIGUE DES RÊVES", "16 ANS · LÉGENDE", "LE GRAND SOIR"];
    return canvasTex(2048, 64, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#3d2bb8"); g.addColorStop(.5, "#6d4dff"); g.addColorStop(1, "#3d2bb8");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.font = '900 italic 40px "Barlow Condensed", Impact, sans-serif'; c.textBaseline = "middle";
      let x = 20, i = 0;
      while (x < w) { const t = words[i++ % words.length]; c.fillStyle = i % 2 ? "#f7c548" : "#ffffff"; c.fillText(t, x, h / 2 + 2); x += c.measureText(t).width + 70; }
    }, [3, 1]);
  }
  function netTex() {
    return canvasTex(128, 128, (c, w, h) => {
      c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 3;
      c.beginPath(); for (let i = 0; i <= w; i += 32) { c.moveTo(i, 0); c.lineTo(i, h); c.moveTo(0, i); c.lineTo(w, i); } c.stroke();
    }, [1, 1]);
  }
  function glowTex() {
    return canvasTex(128, 128, (c, w) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,255,240,1)"); g.addColorStop(.25, "rgba(255,250,220,.55)"); g.addColorStop(1, "rgba(255,250,220,0)"); c.fillStyle = g; c.fillRect(0, 0, w, w); });
  }
  function ballTex() {
    return canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = "#f7f7f7"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#1b1f2e";
      const pent = (x, y, r) => { c.beginPath(); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); };
      for (let i = 0; i < 5; i++) { pent(i * 51 + 25, 64, 15); pent(i * 51 + 51, 22, 11); pent(i * 51 + 51, 106, 11); }
      c.fillStyle = "#6d4dff"; for (let i = 0; i < 5; i++) c.fillRect(i * 51 + 10, 86, 30, 4);
    });
  }

  // ---------- le décor, créé une fois ----------
  function setup() {
    const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = T.SRGBColorSpace;
    const scene = new T.Scene();
    scene.background = canvasTex(4, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#050816"); g.addColorStop(.55, "#18245a"); g.addColorStop(1, "#3a3f7a"); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    scene.fog = new T.Fog(0x1a2150, 60, 140);
    const camera = new T.PerspectiveCamera(31, W / H, 0.1, 300);

    // lumières de soirée : un ciel bleuté, le projecteur principal qui porte les ombres, un contre-jour chaud
    scene.add(new T.HemisphereLight(0xbfd4ff, 0x1d3a22, 1.1));
    const sun = new T.DirectionalLight(0xfff4e0, 2.4);
    sun.position.set(-12, 30, 26); sun.target.position.set(0, 0, 6);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 5, far: 80 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    scene.add(sun, sun.target);
    const rim = new T.DirectionalLight(0xffd29a, 0.8); rim.position.set(14, 12, -20); scene.add(rim);

    const ground = new T.Mesh(new T.PlaneGeometry(200, 200), new T.MeshStandardMaterial({ color: 0x24683a, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; ground.receiveShadow = true; scene.add(ground);
    const pitch = new T.Mesh(new T.PlaneGeometry(68, 52), new T.MeshStandardMaterial({ map: pitchTex(), roughness: .95 }));
    pitch.rotation.x = -Math.PI / 2; pitch.position.set(0, 0, 20); pitch.receiveShadow = true; scene.add(pitch);

    // le but : poteaux, barre et filet (le fond du filet est déformable pour gonfler sur un but)
    const white = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .35, metalness: .1 });
    const goal = new T.Group();
    const post = (x) => { const m = new T.Mesh(new T.CylinderGeometry(.06, .06, GH + .06, 16), white); m.position.set(x, GH / 2, 0); m.castShadow = true; return m; };
    const bar = new T.Mesh(new T.CylinderGeometry(.06, .06, GW * 2 + .12, 16), white); bar.rotation.z = Math.PI / 2; bar.position.set(0, GH, 0); bar.castShadow = true;
    goal.add(post(-GW), post(GW), bar);
    const nt = netTex();
    const netMat = (rx, ry) => { const t = nt.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new T.MeshStandardMaterial({ map: t, transparent: true, alphaTest: .35, side: T.DoubleSide, roughness: 1, depthWrite: false }); };
    const backGeo = new T.PlaneGeometry(GW * 2, Math.hypot(GH, 1.2), 28, 12);
    const back = new T.Mesh(backGeo, netMat(30, 11)); back.position.set(0, GH / 2, -1.6); back.rotation.x = Math.atan2(1.2, GH);
    back.userData.base = Float32Array.from(backGeo.attributes.position.array);
    const roof = new T.Mesh(new T.PlaneGeometry(GW * 2, 1, 1, 1), netMat(30, 4)); roof.rotation.x = -Math.PI / 2; roof.position.set(0, GH, -0.5);
    const sideGeo = () => { const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute([0, 0, 0, 0, 0, -2.2, 0, GH, -1, 0, GH, 0], 3)); g.setAttribute("uv", new T.Float32BufferAttribute([0, 0, 2.2, 0, 1, 2.44, 0, 2.44], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; };
    const sm = netMat(4, 4); sm.map.repeat.set(4, 4);
    const sL = new T.Mesh(sideGeo(), sm); sL.position.x = -GW; const sR = new T.Mesh(sideGeo(), sm); sR.position.x = GW;
    const rods = new T.MeshStandardMaterial({ color: 0xd8dbe6, roughness: .5 });
    for (const x of [-GW, GW]) { const r = new T.Mesh(new T.CylinderGeometry(.025, .025, Math.hypot(GH, 1.2), 8), rods); r.position.set(x, GH / 2, -1.6); r.rotation.x = Math.atan2(1.2, GH); goal.add(r); }
    goal.add(back, roof, sL, sR);
    scene.add(goal);

    // les panneaux lumineux derrière la ligne de but
    const bt = boardsTex();
    const boards = new T.Mesh(new T.BoxGeometry(60, .9, .2), new T.MeshStandardMaterial({ color: 0x111111, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: 1.1, map: bt }));
    boards.position.set(0, .45, -5); scene.add(boards);
    const sideBoardsL = boards.clone(); sideBoardsL.rotation.y = Math.PI / 2; sideBoardsL.position.set(-29, .45, 20); scene.add(sideBoardsL);
    const sideBoardsR = boards.clone(); sideBoardsR.rotation.y = -Math.PI / 2; sideBoardsR.position.set(29, .45, 20); scene.add(sideBoardsR);

    // les tribunes : un muret, puis des gradins inclinés couverts de public, et un toit
    const stands = new T.Group();
    const concrete = new T.MeshStandardMaterial({ color: 0x2b3150, roughness: .9 });
    const crowdMat = new T.MeshStandardMaterial({ map: crowdTex(), roughness: 1, color: 0xb8bcd0 });
    const stand = (w, depth, rise) => {
      const g = new T.Group();
      const wall = new T.Mesh(new T.BoxGeometry(w, 2.2, .6), concrete); wall.position.set(0, 1.1, 0); g.add(wall);
      const slope = new T.Mesh(new T.PlaneGeometry(w, Math.hypot(depth, rise)), crowdMat); slope.position.set(0, 2.2 + rise / 2, -depth / 2); slope.rotation.x = -Math.atan2(depth, rise); g.add(slope);
      const roofM = new T.Mesh(new T.BoxGeometry(w, .5, depth * .55), new T.MeshStandardMaterial({ color: 0x0c1020, roughness: .8 })); roofM.position.set(0, 2.2 + rise + 4, -depth * .7); g.add(roofM);
      const strip = new T.Mesh(new T.BoxGeometry(w, .18, .18), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3d0, emissiveIntensity: 2 })); strip.position.set(0, 2.2 + rise + 3.72, -depth * .44); g.add(strip);
      return g;
    };
    const behind = stand(96, 24, 15); behind.position.set(0, 0, -9); stands.add(behind);
    const left = stand(80, 22, 13); left.rotation.y = Math.PI / 2; left.position.set(-33, 0, 22); stands.add(left);
    const right = stand(80, 22, 13); right.rotation.y = -Math.PI / 2; right.position.set(33, 0, 22); stands.add(right);
    scene.add(stands);
    // projecteurs dans les angles, avec leur halo
    const glow = glowTex();
    for (const [x, z] of [[-34, -16], [34, -16], [-40, 50], [40, 50]]) {
      const mast = new T.Mesh(new T.CylinderGeometry(.35, .5, 34, 8), concrete); mast.position.set(x, 17, z); scene.add(mast);
      const panel = new T.Mesh(new T.BoxGeometry(6, 3, .5), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffbe8, emissiveIntensity: 3 })); panel.position.set(x, 34, z); panel.lookAt(0, 0, 10); scene.add(panel);
      const halo = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xfff6dd, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); halo.scale.set(22, 22, 1); halo.position.set(x, 34, z); scene.add(halo);
    }

    // le ballon
    const ball = new T.Mesh(new T.SphereGeometry(.11, 32, 20), new T.MeshStandardMaterial({ map: ballTex(), roughness: .45 }));
    ball.castShadow = true; scene.add(ball);
    // le point d'impact du ballon dans le filet, pour le faire gonfler
    R = { renderer, scene, camera, ball, back, stands, sun, actors: new T.Group() };
    scene.add(R.actors);
  }

  // ---------- les joueurs : le footballeur Mixamo (img/3d/joueur.glb), animé par de vrais mouvements filmés ----------
  // instants clés mesurés dans les fichiers (secondes) : contact du pied ; pour le gardien, le moment où il est en l'air,
  // bras tendus (pour les plongeons, c'est avant qu'il ne retombe au sol, vers 1,35 s)
  const HIT = { penalty: .73, frappe2: .43 };
  const DIVES = {
    gb_plongeon_g: { ext: 1.1, span: .4, hand: "LeftHand" }, gb_plongeon_d: { ext: 1.05, span: .4, hand: "RightHand" },
    gb_arret: { ext: .4, span: .3, hand: "RightHand" }, gb_arret_haut: { ext: .83, span: .5, hand: "RightHand" }, gb_ramasse: { ext: .73, span: .4, hand: "RightHand" }
  };
  const BASE_SKIN = [222, 178, 150], BASE_HAIR = [70, 52, 40];
  /** @type {any} */ let M = null;
  const q1 = () => new T.Quaternion(), UP = () => new T.Vector3(0, 1, 0);
  function prepModel(gltf) {
    const clips = {}, inPlace = {};
    for (const c of gltf.animations) {
      clips[c.name] = c;
      // version « sur place » : le bassin garde sa hauteur, le déplacement au sol est fait par le jeu
      const ip = c.clone(), tr = ip.tracks.find(t => /Hips\.position$/.test(t.name));
      if (tr) { const v = tr.values = tr.values.slice(), x0 = v[0], z0 = v[2]; for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; } }
      inPlace[c.name] = ip;
    }
    gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; if (o.material.name === "Hair") o.material.transparent = false; } });
    M = { scene: gltf.scene, clips, inPlace, info: {} };
    // mesures prises une fois sur un exemplaire caché : le pied au contact, les mains au bout du plongeon
    const probe = SU.clone(M.scene), mx = new T.AnimationMixer(probe);
    const at = (clip, t, bone) => { mx.stopAllAction(); mx.clipAction(clip).play(); mx.setTime(t); probe.updateMatrixWorld(true); return new T.Vector3().setFromMatrixPosition(probe.getObjectByName("mixamorig5" + bone).matrixWorld); };
    M.info.penFoot = at(clips.penalty, HIT.penalty, "RightFoot");
    M.info.kickFoot = at(inPlace.frappe2, HIT.frappe2, "RightFoot");
    for (const [n, d] of Object.entries(DIVES)) M.info[n] = at(inPlace[n], d.ext, d.hand);
  }
  function numberTex(n, ink) {
    return canvasTex(128, 128, (c, w, h) => { c.font = '900 100px "Barlow Condensed", Impact, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 6; c.strokeStyle = ink === "#ffffff" ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.35)"; c.strokeText(String(n), w / 2, h / 2 + 6); c.fillStyle = ink; c.fillText(String(n), w / 2, h / 2 + 6); });
  }
  const rgb = hex => { const v = parseInt(String(hex).replace("#", "").padEnd(6, "0").slice(0, 6), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
  const inkFor = hex => { const [r, g, b] = rgb(hex); return r * .3 + g * .59 + b * .11 > 150 ? "#141633" : "#ffffff"; };
  // la texture d'origine est multipliée par une teinte : pour viser une couleur, on divise par celle de la texture
  const tint = (hex, base) => { const c = rgb(hex).map((v, i) => Math.min(255, Math.round(v / base[i] * 255))); return new T.Color(`rgb(${c[0]},${c[1]},${c[2]})`); };
  function makeActor(o, shadow) {
    const root = SU.clone(M.scene), g = new T.Group(); g.add(root);
    if (!shadow) { const blob = new T.Mesh(new T.CircleGeometry(.35, 20), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.y = .015; g.add(blob); }
    root.traverse(m => {
      if (!m.isMesh) return;
      m.castShadow = !!shadow;
      m.material = m.material.clone(); const n = m.material.name;
      if (n === "Shirt") m.material.color.set(o.shirt); else if (n === "Shorts") m.material.color.set(o.shorts); else if (n === "Socks") m.material.color.set(o.socks);
      else if (n === "Body") m.material.color.copy(tint(o.skin, BASE_SKIN)); else if (n === "Hair") m.material.color.copy(tint(o.hair, BASE_HAIR));
    });
    const bone = n => root.getObjectByName("mixamorig5" + n);
    // le numéro dans le dos, accroché au haut du dos (unités de l'os : centimètres)
    const num = new T.Mesh(new T.PlaneGeometry(22, 22), new T.MeshStandardMaterial({ map: numberTex(o.number, inkFor(o.shirt)), transparent: true, roughness: .7, polygonOffset: true, polygonOffsetFactor: -2 }));
    num.position.set(0, 4, -13.5); num.rotation.y = Math.PI; bone("Spine2").add(num);
    // les gants du gardien
    if (o.gk) for (const s of ["Left", "Right"]) { const gl = new T.Mesh(new T.BoxGeometry(9, 12, 5), new T.MeshStandardMaterial({ color: o.gloves, roughness: .6 })); gl.position.set(0, 7, 0); gl.castShadow = true; bone(s + "Hand").add(gl); }
    const mixer = new T.AnimationMixer(root), acts = {};
    const A = { g, root, bone, num, numVal: o.number, ink: inkFor(o.shirt), cur: null, prev: null, ph: 0 };
    const action = (name, ip) => { const key = name + (ip ? "" : "!"); if (!acts[key]) { const a = acts[key] = mixer.clipAction((ip ? M.inPlace : M.clips)[name]); a.play(); a.paused = true; a.setEffectiveWeight(0); } return acts[key]; };
    // une pose : tel mouvement à tel instant ; en changeant de mouvement, l'ancien s'efface en `fade` ms
    A.pose = (name, time, now, opt = {}) => {
      const ip = opt.ip !== false, key = name + (ip ? "" : "!"), fade = opt.fade ?? 140;
      if (!A.cur || A.cur.key !== key) { A.prev = A.cur; A.cur = { key, name, ip, at: now }; }
      const a = action(name, ip), d = a.getClip().duration;
      a.time = opt.loop ? ((time % d) + d) % d : cl(time, 0, d - 1e-3);
      A.cur.time = a.time;
      const w = fade > 0 && A.prev ? cl((now - A.cur.at) / fade, 0, 1) : 1;
      for (const k in acts) acts[k].setEffectiveWeight(0);
      a.setEffectiveWeight(w);
      if (w < 1 && A.prev) { const p = action(A.prev.name, A.prev.ip); p.time = A.prev.time; p.setEffectiveWeight(1 - w); }
      mixer.update(0);
    };
    return A;
  }
  function setNumber(A, n) {
    if (A.numVal === n) return;
    A.numVal = n; A.num.material.map.dispose(); A.num.material.map = numberTex(n, A.ink); A.num.material.needsUpdate = true;
  }
  // oriente un os (son axe Y, le long du membre) vers une direction du monde
  function pointBone(b, dir) {
    b.parent.updateWorldMatrix(true, false);
    const wq = b.getWorldQuaternion(q1()), cur = UP().applyQuaternion(wq);
    const nq = q1().setFromUnitVectors(cur, dir.clone().normalize()).multiply(wq);
    b.quaternion.copy(b.parent.getWorldQuaternion(q1()).invert().multiply(nq));
    b.updateMatrixWorld(true);
  }
  // tourne un os autour d'un axe du monde
  function turnBone(b, axis, ang) {
    b.parent.updateWorldMatrix(true, false);
    const nq = q1().setFromAxisAngle(axis, ang).multiply(b.getWorldQuaternion(q1()));
    b.quaternion.copy(b.parent.getWorldQuaternion(q1()).invert().multiply(nq));
  }
  // la joie : bras au ciel et petits sauts
  function cheer(A, t, theta) {
    A.g.updateMatrixWorld(true);
    const left = new T.Vector3(Math.cos(theta), 0, -Math.sin(theta)), wave = Math.sin(t / 140) * .15;
    pointBone(A.bone("LeftArm"), UP().addScaledVector(left, .45 + wave)); pointBone(A.bone("LeftForeArm"), UP().addScaledVector(left, .2));
    pointBone(A.bone("RightArm"), UP().addScaledVector(left, -.45 - wave)); pointBone(A.bone("RightForeArm"), UP().addScaledVector(left, -.2));
    A.g.position.y += Math.max(0, Math.sin(t / 170)) * .18;
  }
  // le raté : les mains sur la tête, le regard au sol
  function despair(A, theta, e) {
    if (e <= 0) return;
    A.g.updateMatrixWorld(true);
    const left = new T.Vector3(Math.cos(theta), 0, -Math.sin(theta)), fwd = new T.Vector3(Math.sin(theta), 0, Math.cos(theta));
    const mix = (a, b) => a.clone().lerp(b, e);
    const down = new T.Vector3(0, -1, 0);
    pointBone(A.bone("LeftArm"), mix(down, UP().multiplyScalar(.55).addScaledVector(left, .8).addScaledVector(fwd, .25)));
    pointBone(A.bone("LeftForeArm"), mix(down, left.clone().multiplyScalar(-1).addScaledVector(UP(), .35)));
    pointBone(A.bone("RightArm"), mix(down, UP().multiplyScalar(.55).addScaledVector(left, -.8).addScaledVector(fwd, .25)));
    pointBone(A.bone("RightForeArm"), mix(down, left.clone().addScaledVector(UP(), .35)));
    turnBone(A.bone("Head"), left, .35 * e);
  }
  // positionne un acteur pour qu'un point de son corps (mesuré, repère du modèle) tombe sur un point du terrain
  function placeAt(A, local, target, theta) {
    const off = local.clone().setY(0).applyAxisAngle(UP(), theta);
    A.g.position.set(target.x - off.x, 0, target.z - off.z); A.g.rotation.y = theta;
  }

  // ---------- une séance : les acteurs aux couleurs des équipes ----------
  const SKINS = ["#f1c9a5", "#e0ac69", "#c68642", "#8d5524", "#5c3a21"], HAIRS = ["#1c1410", "#3b2516", "#111111", "#4a2f1d"];
  function teamLook(team, you, look, gk) {
    const pick = a => a[(Math.random() * a.length) | 0];
    const skin = you && typeof lookSkin === "function" ? lookSkin(look) : pick(SKINS);
    const hair = you && typeof lookHair === "function" ? lookHair(look) : pick(HAIRS);
    if (gk) { const c = team.b === "#ffffff" ? team.a : team.b; return { shirt: c, shorts: "#1d1f2b", socks: c, skin, hair, gk: true, gloves: "#f2f2f2" }; }
    return { shirt: team.a, shorts: team.b || "#ffffff", socks: team.a, skin, hair };
  }
  function warm() {
    if (!R) setup();
    const a = makeActor({ shirt: "#ffffff", shorts: "#ffffff", socks: "#ffffff", skin: SKINS[0], hair: HAIRS[0], number: 10, gk: true, gloves: "#ffffff" }, true), b = makeActor({ shirt: "#ffffff", shorts: "#ffffff", socks: "#ffffff", skin: SKINS[0], hair: HAIRS[0], number: 4 }, false);
    R.actors.add(a.g, b.g); a.pose("attente", 0, 0); b.pose("attente", 0, 0);
    R.camera.position.set(0, 1.8, 6); R.camera.lookAt(0, 1, 0);
    const done = () => { R.actors.clear(); };
    return (R.renderer.compileAsync ? R.renderer.compileAsync(R.scene, R.camera) : Promise.resolve(R.renderer.compile(R.scene, R.camera))).then(done, done);
  }
  function attach(stage, opts) {
    if (!ok()) return null;
    try { if (!R) setup(); } catch (e) { state = "off"; return null; }
    const cv = R.renderer.domElement;
    cv.className = "pen-3d"; cv.setAttribute("aria-hidden", "true");
    stage.classList.add("has-3d"); stage.prepend(cv);
    resize(W, H); R.ball.visible = true;
    // les acteurs de la séance (reconstruits à chaque fois : couleurs, peau et numéro changent)
    R.actors.clear();
    const fk = opts.mode === "fk" || opts.mode === "fksave";
    const mk = (o, shadow) => { const a = makeActor(o, shadow); R.actors.add(a.g); return a; };
    const A = {
      us: mk({ ...teamLook(opts.us, !opts.youGK, opts.look, false), number: opts.number || 9 }, true),
      them: mk({ ...teamLook(opts.them, false, null, false), number: 9 }, true),
      gkUs: mk({ ...teamLook(opts.us, !!opts.youGK, opts.look, true), number: 1 }, true),
      gkThem: mk({ ...teamLook(opts.them, false, null, true), number: 1 }, true),
      wall: fk ? Array.from({ length: 5 }, () => mk({ ...teamLook(opts.mode === "fk" ? opts.them : opts.us, false, null, false), number: 2 + ((Math.random() * 20) | 0) })) : [],
      extras: []
    };
    // les autres joueurs, au bord de la surface, pour que le terrain ne soit pas vide
    for (let i = 0; i < (fk ? 3 : 0); i++) {
      const team = i % 2 ? opts.them : opts.us, p = mk({ ...teamLook(team, false, null, false), number: 3 + i * 2 });
      const side = i % 2 ? 1 : -1, x = fk ? (i - 1.5) * 3.2 + (Math.random() - .5) : side * (19 + (i >> 1) * 2), z = fk ? 6.5 + Math.random() * 4 : 14 + (i >> 1) * 2.5;
      p.g.position.set(x, 0, z); p.g.rotation.y = fk ? Math.PI + (Math.random() - .5) * .6 : -side * Math.PI / 2 + Math.PI; p.ph = Math.random() * 10;
      A.extras.push(p);
    }
    // public aux couleurs de l'équipe qui reçoit
    const cm = R.stands.children[0].children[1].material; if (cm.map) cm.map.dispose(); cm.map = crowdTex(opts.us.a); cm.needsUpdate = true;
    R.sun.target.position.set(0, 0, fk ? 13 : 6); R.sun.position.set(-12, 30, fk ? 33 : 26);
    R.view = { A, fk, opts, kickSeen: null, lift: 0, z0: fk ? 22 : 11, introAt: null, dive: null };
    return { draw, goalToScreen, nearToScreen, toWorld, ballScreen, aimFromSwipe, detach };
  }
  function detach() {
    if (!R) return;
    const cv = R.renderer.domElement; cv.parentElement?.classList.remove("has-3d"); cv.remove();
    R.actors.clear(); R.view = null;
  }

  // ---------- les duels (dribble, tacle, sortie aérienne, passe), filmés de côté ----------
  // le terrain vu de dessus de duel.js (800 × 420 px, 32 px par mètre) est posé dans le stade : le but du geste
  // (à gauche pour le tacle et la sortie aérienne, à droite sinon) tombe sur le but de la scène, et la caméra
  // regarde le terrain de côté, comme à la télévision : le haut de la vue de dessus est le fond de l'image
  const DPX = 32;
  function attachDuel(stage, opts, cast) {
    if (!ok()) return null;
    try { if (!R) setup(); } catch (e) { state = "off"; return null; }
    const cv = R.renderer.domElement;
    cv.className = "pen-3d"; cv.setAttribute("aria-hidden", "true");
    stage.classList.add("has-3d"); stage.prepend(cv);
    resize(800, 420);
    R.actors.clear();
    const A = {};
    cast.forEach((c, i) => {
      const team = c.team === "us" ? opts.us : opts.them;
      const a = makeActor({ ...teamLook(team, !!c.you, c.you ? opts.look : null, !!c.gk), number: c.number || (c.you ? opts.number || 10 : 2 + i * 3) }, true);
      R.actors.add(a.g); A[c.id] = a;
    });
    const side = opts.kind === "tacle" || opts.kind === "aerien" ? 1 : -1;
    const cm = R.stands.children[0].children[1].material; if (cm.map) cm.map.dispose(); cm.map = crowdTex(opts.us.a); cm.needsUpdate = true;
    R.sun.target.position.set(0, 0, 10); R.sun.position.set(-12, 30, 30);
    R.view = { duel: true, A, side, opts, introAt: null };
    return { drawDuel, toScreen: duelToScreen, detach };
  }
  const dW = (x, y, h = 0) => { const s = R.view.side; return new T.Vector3(s * (210 - y) / DPX, h, s > 0 ? (x - 10) / DPX : (790 - x) / DPX); };
  function duelToScreen(x, y, h = 0) { const p = dW(x, y, h); return project(p.x, p.y, p.z); }
  // v : { now, actors: { id: { x, y, h?, face: [dx, dy], anim, time, loop?, ip?, cheer? } }, ball: { x, y, h } | null, camX, shake, intro }
  function drawDuel(v) {
    const V = R.view, s = V.side, t = v.now;
    for (const [id, a] of Object.entries(V.A)) {
      const st = v.actors[id]; a.g.visible = !!st;
      if (!st) continue;
      const p = dW(st.x, st.y, 0); a.g.position.set(p.x, 0, p.z);
      const fx = -s * (st.face?.[1] || 0), fz = s * (st.face?.[0] ?? 1);
      a.g.rotation.y = Math.atan2(fx, fz);
      a.pose(st.anim, st.time, t, { loop: !!st.loop, ip: st.ip !== false, fade: st.fade ?? 160 });
      if (st.cheer) cheer(a, t, a.g.rotation.y);
    }
    R.ball.visible = !!v.ball;
    if (v.ball) {
      const b = dW(v.ball.x, v.ball.y, .11 + (v.ball.h || 0) / DPX);
      if (R.lastBall) R.ball.rotation.x += (b.distanceTo(R.lastBall) / .11) * .5;
      R.ball.position.copy(b); R.lastBall = b.clone();
    }
    R.ball.scale.setScalar(1.3);
    if (R.netDirty) { const pos = R.back.geometry.attributes.position; pos.array.set(R.back.userData.base); pos.needsUpdate = true; R.netDirty = false; }
    R.stands.position.y = 0;
    // caméra latérale qui suit l'action ; à l'arrivée, elle descend d'un plan large
    const c = dW(v.camX, 210), cam = R.camera;
    const dist = v.dist || 12.5;
    let px = -s * dist, py = dist * .48, pz = c.z, lx = s * 1.2, ly = .5, lz = c.z;
    if (v.intro && !reduceMotion) {
      if (V.introAt == null) V.introAt = t;
      const e = ease((t - V.introAt) / 1300);
      px = lerp(-s * 26, px, e); py = lerp(16, py, e); pz = lerp(c.z + s * 8, pz, e);
    }
    if (v.shake > 0 && !reduceMotion) { px += Math.sin(t * .09) * .06 * v.shake; py += Math.cos(t * .11) * .05 * v.shake; }
    cam.position.set(px, py, pz); cam.lookAt(lx, ly, lz); cam.updateMatrixWorld();
    R.renderer.render(R.scene, cam);
  }
  // taille du rendu (800 × 560 pour les coups de pied arrêtés, 800 × 420 pour les duels)
  function resize(w, h) {
    if (R.size && R.size[0] === w && R.size[1] === h) return;
    R.size = [w, h]; R.renderer.setSize(w, h, false); R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
  }

  // ---------- conversions entre 2D et 3D ----------
  // le ballon : sa taille dit sa profondeur (15 px au point de penalty, 6,5 px sur la ligne de but)
  function ball3(v, b) {
    const r0 = v.rest.r, z0 = R.view.z0, g0 = v.rest.y + v.rest.r;
    const u = (r0 - b.r) / (r0 - 6.5);
    const z = z0 * (1 - u), x = (b.x - 400) / PXH;
    const y = Math.max(.11, (lerp(g0, GB, u) - b.y) / (PXV * Math.max(4, b.r) / 6.5));
    return { x, y, z, u };
  }
  const goal3 = (x, y) => ({ x: (x - 400) / PXH, y: (GB - y) / PXV, z: 0 });
  function project(x, y, z) {
    const p = new T.Vector3(x, y, z).project(R.camera);
    const [w, h] = R.size || [W, H];
    return { x: (p.x + 1) / 2 * w, y: (1 - p.y) / 2 * h };
  }
  function goalToScreen(x, y) { const g = goal3(x, y); return project(g.x, g.y, g.z); }
  function ballScreen() { const p = R.ball.position; return project(p.x, p.y, p.z); }
  // près du ballon, l'écran et le jeu sont liés par une simple mise à l'échelle autour du ballon : un glissé du ballon
  // vers un coin du but à l'écran donne le même geste qu'en 2D
  function nearScale() {
    const v = R.lastView, b = R.restScreen, mid = (GB - 191) / PXV;
    const gc = project(0, mid, 0), gl = project(-GW, mid, 0), gr = project(GW, mid, 0);
    return { b, kx: (GR - GL) / Math.max(40, gr.x - gl.x), ky: (v.rest.y - 191) / Math.max(40, b.y - gc.y) };
  }
  function nearToScreen(wx, wy) { const v = R.lastView, s = nearScale(); return { x: s.b.x + (wx - v.rest.x) / s.kx, y: s.b.y + (wy - v.rest.y) / s.ky }; }
  function toWorld(sx, sy, onGoal) {
    if (onGoal) {
      // rayon depuis la caméra jusqu'au plan du but (z = 0)
      const ndc = new T.Vector3(sx / W * 2 - 1, -(sy / H * 2 - 1), .5).unproject(R.camera), o = R.camera.position;
      const d = ndc.sub(o), t = -o.z / d.z, X = o.x + d.x * t, Y = o.y + d.y * t;
      return { x: 400 + X * PXH, y: GB - Y * PXV };
    }
    const v = R.lastView, s = nearScale();
    return { x: v.rest.x + (sx - s.b.x) * s.kx, y: v.rest.y + (sy - s.b.y) * s.ky };
  }

  // le point visé par un glissé (coordonnées écran du début et de la fin) : là où le doigt est lâché, sur le plan du but ;
  // lâché sous la ligne de but, le geste est prolongé jusqu'au ras du sol
  function aimFromSwipe(a, b) {
    const hit = (x, y) => toWorld(x, y, true), low = GB - 14;
    let g = hit(b.x, b.y);
    if (g.y > low) {
      const dx = b.x - a.x, dy = b.y - a.y;
      if (dy < -4) for (let s = 1; s < 10; s += .05) { const q = hit(a.x + dx * s, a.y + dy * s); if (q.y <= low) { g = q; break; } }
      g.y = Math.min(g.y, low);
    }
    return g;
  }

  // ---------- une image ----------
  // v : l'état du moteur, déjà traduit par penalty.js (voir render3d)
  function draw(v) {
    const V = R.view, A = V.A, t = v.now, k = v.kick;
    R.lastView = v;
    // ballon
    const b = ball3(v, v.ball);
    if (k && k !== V.kickSeen) {
      V.kickSeen = k; V.lift = 0; V.kickAt = t;
      // en coup franc, si le ballon passe au-dessus du mur, on s'assure qu'il le survole vraiment à l'image
      if (V.fk && v.wall && !k.blockU && k.fk) {
        const at = ball3(v, v.ballAtWall), wx = (v.wall.cx - 400) / PXH, half = v.wall.half / PXH + .3;
        if (Math.abs(at.x - wx) < half && at.y < 2.15) V.lift = 2.15 - at.y;
      }
    }
    if (!k) V.kickSeen = null;
    let by = b.y;
    if (k && V.lift && b.u > 0 && b.u < 1) by += V.lift * Math.sin(Math.PI * b.u);
    R.ball.position.set(b.x, by, b.z);
    if (k && t > k.start) { R.ball.rotation.x -= .35 * (v.dt / 16); R.ball.rotation.z += (k.curl || 0) * .2; }
    else R.ball.rotation.set(0, 0, 0);
    const restB = ball3(v, v.rest);

    // gardien : celui de l'équipe qui ne tire pas
    const gkTeam = v.shooterSide === "us" ? "them" : "us";
    const gk = gkTeam === "us" ? A.gkUs : A.gkThem, gkOff = gkTeam === "us" ? A.gkThem : A.gkUs;
    gk.g.visible = true; gkOff.g.visible = false;
    const kp = goal3(v.keeper.x, v.keeper.y), home = goal3(v.keeperHome.x, v.keeperHome.y);
    gk.g.rotation.y = 0; gk.g.position.set(kp.x, 0, .3);
    if (k && k.dive && t >= k.dive.start) {
      // le plongeon choisi une fois par tir, d'après le point visé : un côté, ou face à lui (haut, milieu, au sol)
      if (!V.dive || V.dive.k !== k) {
        const f = goal3(k.dive.x, k.dive.y), side = f.x - home.x;
        const name = Math.abs(side) > .85 ? (side > 0 ? "gb_plongeon_g" : "gb_plongeon_d") : f.y > 1.75 ? "gb_arret_haut" : f.y > .55 ? "gb_arret" : "gb_ramasse";
        V.dive = { k, name, f };
      }
      const D = DIVES[V.dive.name], hand = M.info[V.dive.name], f = V.dive.f;
      // l'extension tombe à l'arrivée du ballon (jamais avant la fin du plongeon du moteur) ; ensuite il retombe
      const arrive = Math.max(k.dive.start + k.dive.dur, k.start + k.dur * (k.blockU || 1));
      const e = cl((t - k.dive.start) / (arrive - k.dive.start), 0, 1);
      const ct = e < 1 ? D.ext - D.span + Math.pow(e, .8) * D.span : Math.min(D.ext + .9, D.ext + (t - arrive) / 1000);
      gk.pose(V.dive.name, ct, t, { fade: 80 });
      // le corps est déplacé pour que la main arrive au point visé ; un ballon haut le fait décoller
      const ee = ease(e), land = ease(cl((t - arrive) / 450, 0, 1));
      gk.g.position.x = lerp(home.x, f.x - hand.x, ee);
      gk.g.position.y = Math.max(0, f.y - hand.y - .1) * ee * (1 - land);
    } else gk.pose("gb_attente", t / 1000, t, { loop: true });

    // tireur : il regarde le but
    const sh = v.shooterSide === "us" ? A.us : A.them, shOff = v.shooterSide === "us" ? A.them : A.us;
    sh.g.visible = true; shOff.g.visible = false;
    if (v.number != null) setNumber(sh, v.number);
    const theta = Math.atan2(-restB.x, -restB.z), fwd = new T.Vector3(Math.sin(theta), 0, Math.cos(theta));
    const spot = new T.Vector3(restB.x, 0, restB.z).addScaledVector(fwd, -.16);
    sh.g.position.y = 0;
    if (v.youShoot) {
      // toi : prêt derrière le ballon, puis la frappe (un mouvement sans élan, déclenché par ton geste)
      // en attendant, un pas en arrière et sur le côté ; à la frappe, il avance sur le ballon
      placeAt(sh, M.info.kickFoot, spot, theta);
      const left = new T.Vector3(Math.cos(theta), 0, -Math.sin(theta)), back = fwd.clone().multiplyScalar(-1).addScaledVector(left, .7);
      const step = k ? 1 - ease(cl((t - k.start + 140) / 220, 0, 1)) : 1;
      sh.g.position.addScaledVector(back, step);
      if (!k) sh.pose("attente", t / 1000, t, { loop: true });
      else if (v.state === "after" && t - v.afterStart > 300) {
        if (k.outcome === "goal") { sh.pose("attente", t / 1000, t, { loop: true, fade: 200 }); cheer(sh, t, theta); }
        else { sh.pose("attente", t / 1000, t, { loop: true, fade: 200 }); despair(sh, theta, cl((t - v.afterStart - 300) / 250, 0, 1)); }
      } else sh.pose("frappe2", HIT.frappe2 - .12 + Math.max(0, t - k.start) / 1000, t, { fade: 70 });
    } else {
      // l'adversaire ou un coéquipier : la vraie course d'élan, calée pour que le pied touche le ballon au départ du tir
      placeAt(sh, M.info.penFoot, spot, theta);
      let ct = 0;
      if (k) ct = HIT.penalty + Math.max(0, t - k.start) / 1000;
      else if (v.state === "prep") ct = Math.max(0, (t - v.prepStart - 1500) / 1000 + HIT.penalty);
      sh.pose("penalty", ct, t, { ip: false, fade: 0 });
      // les appuis trahissent (ou feintent) le côté du tir
      if (v.tell && !k && ct > .3) { sh.g.updateMatrixWorld(true); turnBone(sh.bone("Spine1"), fwd, -v.tell * .22 * cl((ct - .3) / .4, 0, 1)); }
    }

    // le mur, face au ballon ; il saute une fois sur deux
    A.wall.forEach((p, i) => {
      const w = v.wall; p.g.visible = !!w && i < w.xs.length;
      if (!p.g.visible) return;
      p.g.position.set((w.xs[i] - 400) / PXH, 0, V.z0 * (1 - .36)); p.g.rotation.y = Math.atan2(restB.x - p.g.position.x, restB.z - p.g.position.z);
      const jt = k && w.jumping ? cl((t - k.start) / 650, 0, 1) : 0;
      p.pose("attente", t / 1000 + i * 1.7, t, { loop: true });
      p.g.position.y = Math.sin(Math.PI * jt) * .45;
    });
    // les autres attendent ; sur un but, ils exultent
    const goalNow = v.state === "after" && k?.outcome === "goal";
    A.extras.forEach(p => { p.g.position.y = 0; p.pose("attente", t / 1000 + p.ph, t, { loop: true }); if (goalNow) cheer(p, t + p.ph * 300, p.g.rotation.y); });

    // filet qui gonfle à l'endroit du but
    const pos = R.back.geometry.attributes.position, base = R.back.userData.base;
    if (v.netShake > 0 && k) {
      const hx = (k.tx - 400) / PXH, hy = (GB - k.ty) / PXV - GH / 2;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1], d = Math.hypot(x - hx, (y - hy) * .9);
        pos.array[i * 3 + 2] = base[i * 3 + 2] - Math.exp(-d * d / .9) * .9 * v.netShake * (1 + .25 * Math.sin(t / 40));
      }
      pos.needsUpdate = true; R.netDirty = true;
    } else if (R.netDirty) { pos.array.set(base); pos.needsUpdate = true; R.netDirty = false; }
    // le public saute sur un but
    R.stands.position.y = v.state === "after" && k?.outcome === "goal" ? Math.abs(Math.sin(t / 110)) * .25 : 0;

    // caméra : derrière le ballon, elle descend du ciel à l'arrivée, puis avance un peu pendant le vol
    const cam = R.camera, behindX = restB.x * .55 + (V.fk ? .8 : .7);
    let px = behindX, py = V.fk ? 3.4 : 2.95, pz = restB.z + (V.fk ? 8.5 : 6.6), lx = restB.x * .22, ly = V.fk ? -.3 : .55, lz = 0;
    if (v.state === "intro" && !reduceMotion) {
      if (V.introAt == null) V.introAt = t;
      const e = ease((t - V.introAt) / 1500);
      px = lerp(-9, px, e); py = lerp(7.5, py, e); pz = lerp(pz + 9, pz, e); ly = lerp(3, ly, e);
    }
    if (k && t > k.start && !reduceMotion) {
      const e = ease((t - k.start) / (k.dur * 1.4));
      pz -= .6 * e; lx = lerp(lx, b.x * .45, e); ly = lerp(ly, Math.min(1.6, by * .6 + .7), e);
    }
    if (v.shake > 0 && !reduceMotion) { px += Math.sin(t * .09) * .05 * v.shake; py += Math.cos(t * .11) * .04 * v.shake; }
    cam.position.set(px, py, pz); cam.lookAt(lx, ly, lz);
    cam.updateMatrixWorld();
    // le point du ballon au repos, à l'écran (pour le geste) : mesuré caméra au repos, pas pendant le vol
    if (!k) R.restScreen = project(restB.x, restB.y, restB.z);
    else if (!R.restScreen) R.restScreen = project(restB.x, restB.y, restB.z);
    // de loin, le ballon grossit un peu pour rester lisible (comme dans tous les jeux de foot)
    R.ball.scale.setScalar(cl(R.ball.position.distanceTo(cam.position) / 10, 1, 2.4));
    R.renderer.render(R.scene, cam);
  }

  // debug : le modèle et la scène (pour les essais dans la console)
  return { load, whenReady, ok, attach, attachDuel, debug: () => ({ M, R, T, SU }) };
})();
