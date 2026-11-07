// Trajectoire · Tutos animés des mini-jeux : une petite scène qui montre le geste en boucle dans la consigne
// miniDemo(kind) renvoie un SVG animé (SMIL, aucune bibliothèque) ; il se fige sur l'instant clé si les animations sont réduites.
const DEMO_DUR = 3.2;
// une animation en boucle à partir d'images clés [[t,valeur],…], t de 0 à 1
const dA = (attr, kf) => `<animate attributeName="${attr}" dur="${DEMO_DUR}s" repeatCount="indefinite" keyTimes="${kf.map(k => k[0]).join(";")}" values="${kf.map(k => k[1]).join(";")}"/>`;
const dT = kf => `<animateTransform attributeName="transform" type="translate" dur="${DEMO_DUR}s" repeatCount="indefinite" keyTimes="${kf.map(k => k[0]).join(";")}" values="${kf.map(k => k[1]).join(";")}"/>`;
const dShow = (a, b) => dA("opacity", [[0, 0], [a, 0], [a + .01, 1], [b, 1], [b + .01, 0], [1, 0]]);
// le doigt : un rond blanc qui suit un chemin (glisser) ou qui tape (onde)
const dFinger = (path, a, b) => `<g opacity="0">${dShow(a - .05, b + .04)}<circle r="11" fill="#fff" fill-opacity=".9" stroke="#141633" stroke-width="2"/>
  <animateMotion dur="${DEMO_DUR}s" repeatCount="indefinite" path="${path}" keyPoints="0;0;1;1" keyTimes="0;${a};${b};1" calcMode="linear"/></g>`;
const dTap = (x, y, t) => `<g transform="translate(${x} ${y})"><circle r="11" fill="#fff" fill-opacity=".9" stroke="#141633" stroke-width="2" opacity="0">${dShow(t - .12, t + .06)}</circle>
  <circle r="11" fill="none" stroke="#fff" stroke-width="3" opacity="0">${dA("r", [[0, 11], [t, 11], [t + .12, 30], [1, 30]])}${dA("opacity", [[0, 0], [t, 0], [t + .01, 1], [t + .12, 0], [1, 0]])}</circle></g>`;
const dSay = (txt, a, b, color = "#f7c548") => `<text x="160" y="30" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="900" font-style="italic" font-size="26" fill="${color}" stroke="#141633" stroke-width="4" paint-order="stroke" opacity="0">${dShow(a, b)}${txt}</text>`;
const dCap = txt => `<text x="160" y="172" text-anchor="middle" font-family="Barlow,system-ui,sans-serif" font-weight="700" font-size="12" fill="#fff" fill-opacity=".85">${txt}</text>`;

// ---------- décors ----------
const dGoalScene = inner => `<rect width="320" height="180" fill="#14462e"/><rect y="112" width="320" height="68" fill="#1a5a39"/>
  <path d="M70 112V36H250V112" fill="rgba(255,255,255,.06)" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
  <path d="M100 36V112M130 36V112M160 36V112M190 36V112M220 36V112M70 61H250M70 86H250" stroke="#fff" stroke-opacity=".12"/>
  <path d="M30 112H290" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>${inner}`;
const dKeeper = (color, kf, tilt) => `<g transform="translate(160 108)">${dT(kf)}<g>${tilt ? `<animateTransform attributeName="transform" type="rotate" dur="${DEMO_DUR}s" repeatCount="indefinite" keyTimes="0;${tilt[0]};${tilt[0] + .1};${tilt[1]};${tilt[1] + .02};1" values="0;0;${tilt[2]};${tilt[2]};0;0"/>` : ""}
  <rect x="-10" y="-34" width="20" height="30" rx="8" fill="${color}"/><path d="M-10-28l-12-10M10-28l12-10" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
  <circle cy="-42" r="7" fill="#f1c27d"/><path d="M-6-4v6M6-4v6" stroke="#141633" stroke-width="6" stroke-linecap="round"/></g></g>`;
const dWall = (xs, jump) => `<g>${jump ? dT([[0, "0 0"], [jump, "0 0"], [jump + .08, "0 -10"], [jump + .18, "0 0"], [1, "0 0"]]) : ""}${xs.map(x => `<g transform="translate(${x} 118)"><rect x="-7" y="-22" width="14" height="22" rx="6" fill="#4f6bd8"/><circle cy="-27" r="5" fill="#f1c27d"/></g>`).join("")}</g>`;
const dBall = (r = 8) => `<circle r="${r}" fill="#fff" stroke="#141633" stroke-width="2"/><path d="M-3-3h6l2 5-5 3-5-3z" fill="#141633" transform="scale(${r / 8})"/>`;
const dPitch = inner => `<rect width="320" height="180" fill="#17502f"/><path d="M0 0H320M0 45H320M0 90H320M0 135H320" stroke="#fff" stroke-opacity=".04" stroke-width="45"/>
  <path d="M160 0V180" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>${inner}`;
const dPlayer = (color, ring) => `${ring ? `<circle r="15" fill="none" stroke="#f7c548" stroke-width="2"/>` : ""}<circle r="11" fill="${color}" stroke="#141633" stroke-width="2"/>`;

const MINI_DEMO = {
  // le geste : glisser du ballon vers le coin, le gardien part du mauvais côté
  shoot: () => dGoalScene(`${dKeeper("#4f6bd8", [[0, "160 108"], [.5, "160 108"], [.62, "205 100"], [.9, "205 100"], [.92, "160 108"], [1, "160 108"]], [.5, .9, 70])}
    <path d="M160 152L100 60" stroke="#f7c548" stroke-width="5" stroke-linecap="round" stroke-dasharray="110" stroke-dashoffset="110" opacity="0">${dA("stroke-dashoffset", [[0, 110], [.15, 110], [.42, 0], [1, 0]])}${dShow(.15, .62)}</path>
    <g>${dT([[0, "160 152"], [.45, "160 152"], [.6, "96 52"], [.9, "96 52"], [.901, "160 152"], [1, "160 152"]])}${dBall()}${dA("opacity", [[0, 1], [.9, 1], [.91, 0], [.95, 0], [.96, 1], [1, 1]])}</g>
    ${dFinger("M160 152L100 60", .15, .42)}${dSay("BUT !", .62, .88)}${dCap("Glisse du ballon vers le coin, puis lâche")}`),
  // le gardien, c'est toi : touche là où part le ballon
  save: () => dGoalScene(`${dKeeper("#f7c548", [[0, "160 108"], [.5, "160 108"], [.62, "212 92"], [.9, "212 92"], [.92, "160 108"], [1, "160 108"]], [.5, .9, 70])}
    <g>${dT([[0, "160 160"], [.3, "160 160"], [.6, "222 62"], [.66, "236 140"], [.9, "236 140"], [.901, "160 160"], [1, "160 160"]])}${dBall()}</g>
    ${dTap(222, 64, .5)}${dSay("ARRÊT !", .64, .88)}${dCap("Dès la frappe, touche là où part le ballon")}`),
  // courber le geste pour enrouler autour du mur
  fk: () => dGoalScene(`${dKeeper("#4f6bd8", [[0, "175 108"], [.6, "175 108"], [.72, "150 104"], [1, "150 104"]])}${dWall([112, 128, 144, 160], .45)}
    <path d="M232 156Q308 80 112 56" fill="none" stroke="#f7c548" stroke-width="5" stroke-linecap="round" stroke-dasharray="260" stroke-dashoffset="260" opacity="0">${dA("stroke-dashoffset", [[0, 260], [.12, 260], [.42, 0], [1, 0]])}${dShow(.12, .7)}</path>
    <g><animateMotion dur="${DEMO_DUR}s" repeatCount="indefinite" path="M232 156Q308 80 112 56" keyPoints="0;0;1;1" keyTimes="0;.45;.7;1" calcMode="spline" keySplines="0 0 1 1;.3 .1 .6 1;0 0 1 1"/>${dBall(7)}</g>
    ${dFinger("M232 156Q308 80 112 56", .12, .42)}${dSay("LUCARNE !", .72, .92)}${dCap("Courbe ton geste : le ballon enroule le mur")}`),
  // le coup franc contre toi : suis l'effet et touche le point d'arrivée
  fksave: () => dGoalScene(`${dKeeper("#f7c548", [[0, "185 108"], [.52, "185 108"], [.64, "120 92"], [.9, "120 92"], [.92, "185 108"], [1, "185 108"]], [.52, .9, -70])}${dWall([150, 166, 182, 198], .3)}
    <g><animateMotion dur="${DEMO_DUR}s" repeatCount="indefinite" path="M100 160Q20 70 112 62L60 140" keyPoints="0;0;.8;1;1" keyTimes="0;.3;.6;.7;1" calcMode="linear"/>${dBall(7)}</g>
    ${dTap(112, 64, .5)}${dSay("SORTI !", .66, .9)}${dCap("Suis l'effet et touche là où il arrive")}`),
  // vue de dessus : l'anneau se referme, il devient vert, on glisse dans le sens de la flèche
  dribble: () => dPitch(`<g transform="translate(170 90)">${dPlayer("#ff6b6b")}
      <circle r="44" fill="none" stroke-width="4">${dA("r", [[0, 44], [.08, 44], [.38, 16], [.48, 16], [.49, 44], [1, 44]])}${dA("stroke", [[0, "#ffffff"], [.28, "#ffffff"], [.29, "#3ee08f"], [1, "#3ee08f"]])}${dA("opacity", [[0, 1], [.48, 1], [.49, 0], [1, 0]])}</circle>
      <text y="-28" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" stroke="#141633" stroke-width="4" paint-order="stroke">↑${dA("opacity", [[0, 1], [.48, 1], [.49, 0], [1, 0]])}</text></g>
    <g><animateMotion dur="${DEMO_DUR}s" repeatCount="indefinite" path="M30 90L140 90Q170 40 210 50T300 90" keyPoints="0;0;.42;1;1" keyTimes="0;.06;.36;.75;1" calcMode="linear"/>${dPlayer("#f7c548", true)}<g transform="translate(13 6)">${dBall(5)}</g></g>
    ${dFinger("M262 140L262 84", .3, .42)}${dSay("EFFACÉ !", .55, .85)}${dCap("Anneau vert : glisse dans le sens de la flèche")}`),
  // l'attaquant entre dans l'anneau jaune : on tacle
  tacle: () => dPitch(`<circle cx="100" cy="90" r="40" fill="rgba(247,197,72,.12)" stroke="#f7c548" stroke-width="3" stroke-dasharray="7 6"/>
    <g>${dT([[0, "100 90"], [.48, "100 90"], [.56, "126 92"], [.9, "126 92"], [.92, "100 90"], [1, "100 90"]])}${dPlayer("#f7c548")}</g>
    <g>${dT([[0, "310 92"], [.5, "138 92"], [.6, "150 70"], [.9, "150 70"], [.92, "310 92"], [1, "310 92"]])}${dPlayer("#ff6b6b")}</g>
    <g>${dT([[0, "297 96"], [.5, "125 96"], [.62, "80 150"], [.9, "80 150"], [.92, "297 96"], [1, "297 96"]])}${dBall(5)}</g>
    ${dTap(240, 140, .5)}${dSay("BALLE RÉCUPÉRÉE !", .6, .88)}${dCap("Tacle quand il entre dans l'anneau jaune")}`),
  // le centre arrive dans le cercle : on sort avant que l'attaquant saute
  aerien: () => dPitch(`<path d="M14 55V125" stroke="#fff" stroke-width="5"/><path d="M14 40H70V140H14" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <circle cx="86" cy="90" r="18" fill="none" stroke-width="3" stroke-dasharray="6 5">${dA("stroke", [[0, "#ffffff"], [.42, "#ffffff"], [.43, "#3ee08f"], [.62, "#3ee08f"], [.63, "#ffffff"], [1, "#ffffff"]])}</circle>
    <g>${dT([[0, "130 112"], [.6, "120 100"], [.66, "112 96"], [1, "112 96"]])}<g>${dA("opacity", [[0, 1], [1, 1]])}${dPlayer("#ff6b6b")}</g></g>
    <g>${dT([[0, "38 90"], [.5, "38 90"], [.58, "80 90"], [.9, "80 90"], [.92, "38 90"], [1, "38 90"]])}${dPlayer("#f7c548")}</g>
    <g><animateMotion dur="${DEMO_DUR}s" repeatCount="indefinite" path="M300 16Q190 -10 86 90" keyPoints="0;0;1;1" keyTimes="0;.1;.55;1" calcMode="linear"/><g>${dBall(6)}${dA("opacity", [[0, 1], [.58, 1], [.59, 0], [.9, 0], [.91, 1], [1, 1]])}</g></g>
    ${dTap(240, 140, .5)}${dSay("CAPTÉ !", .6, .88)}${dCap("Sors quand le ballon arrive dans le cercle vert")}`),
  // la ligne de passe : rouge quand un défenseur la coupe, verte quand elle est libre
  passe: () => dPitch(`<path d="M40 100L280 70" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 8">${dA("stroke", [[0, "#ff5a6e"], [.36, "#ff5a6e"], [.37, "#3ee08f"], [.8, "#3ee08f"], [.81, "#ff5a6e"], [1, "#ff5a6e"]])}</path>
    <g>${dT([[0, "160 86"], [.2, "160 86"], [.36, "160 140"], [.8, "160 140"], [.92, "160 86"], [1, "160 86"]])}${dPlayer("#ff6b6b")}</g>
    <g transform="translate(236 136)">${dPlayer("#ff6b6b")}</g>
    <g transform="translate(40 100)">${dPlayer("#f7c548")}</g><g transform="translate(280 70)">${dPlayer("#3ee08f")}</g>
    <g>${dT([[0, "52 102"], [.48, "52 102"], [.62, "268 72"], [.9, "268 72"], [.91, "52 102"], [1, "52 102"]])}${dBall(5)}</g>
    ${dTap(150, 30, .46)}${dSay("PASSE DÉCISIVE !", .64, .88)}${dCap("Passe dès que la ligne devient verte")}`)
};
MINI_DEMO.shootout = MINI_DEMO.shoot;

function miniDemo(kind) {
  const d = MINI_DEMO[kind];
  return d ? `<div class="brief-demo"><svg viewBox="0 0 320 180" role="img" aria-label="Démonstration animée du geste">${d()}</svg></div>` : "";
}
// à appeler une fois la démo dans la page : figée sur le moment clé si les animations sont réduites
function miniDemoStart(root) {
  const svg = /** @type {SVGSVGElement|null} */ (root.querySelector(".brief-demo svg"));
  if (!svg || !svg.pauseAnimations) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { svg.pauseAnimations(); svg.setCurrentTime(DEMO_DUR * .7); }
}
