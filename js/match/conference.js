// Trajectoire · Conférence de presse d'après-match : trois questions, un chrono, et une image publique qui en dépend
// Conference.play({title, questions}) renvoie une promesse {fx, tones} ; chaque réponse a des effets et un ton.
const Conference = (() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TIME = 12000; // le chrono est généreux, et désactivé si l'animation est réduite
  /** @type {any} */
  let C = null;

  function play({ title, questions }) {
    return new Promise(resolve => {
      C = { title, questions, i: 0, fx: {}, tones: [], answers: [], resolve, timer: null };
      const el = document.createElement("div");
      el.className = "confmode"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", title);
      document.body.appendChild(el);
      C.el = el;
      C.onKey = e => {
        if (!C) return;
        e.stopPropagation();
        if (/^[1-4]$/.test(e.key)) { const b = /** @type {HTMLElement} */ (C.el.querySelectorAll(".conf-a")[+e.key - 1]); if (b) { e.preventDefault(); b.click(); } }
      };
      addEventListener("keydown", C.onKey, true);
      ask();
    });
  }

  function ask() {
    clearTimeout(C.timer);
    const q = C.questions[C.i];
    C.el.innerHTML = `<div class="conf-wrap">
      <p class="conf-eyebrow">🎙️ ${esc(C.title)} · question ${C.i + 1}/${C.questions.length}</p>
      <div class="conf-q"><span class="conf-mic" aria-hidden="true">📰</span><p aria-live="polite"><b>${esc(q.who)} :</b> « ${esc(q.q)} »</p></div>
      ${reduceMotion ? "" : `<div class="conf-timer" aria-hidden="true"><i style="animation-duration:${TIME}ms"></i></div>`}
      <div class="conf-answers">${q.a.map((a, j) => `<button class="btn conf-a" type="button" data-j="${j}"><kbd>${j + 1}</kbd>${esc(a.t)}</button>`).join("")}</div>
      <p class="conf-help">${reduceMotion ? "Prends ton temps." : "Sans réponse avant la fin du chrono : « Pas de commentaire. »"}</p></div>`;
    C.el.querySelectorAll(".conf-a").forEach(b => b.addEventListener("click", () => answer(+/** @type {HTMLElement} */ (b).dataset.j)));
    /** @type {HTMLElement} */ (C.el.querySelector(".conf-a")).focus({ preventScroll: true });
    if (!reduceMotion) C.timer = setTimeout(() => answer(-1), TIME);
  }

  function answer(j) {
    if (!C) return;
    clearTimeout(C.timer);
    const q = C.questions[C.i], a = j >= 0 ? q.a[j] : { t: "Pas de commentaire.", fx: { rep: -1 }, tone: "froid", r: "Le silence est mal perçu." };
    for (const k in a.fx) C.fx[k] = typeof a.fx[k] === "number" ? (C.fx[k] || 0) + a.fx[k] : a.fx[k];
    C.tones.push(a.tone); C.answers.push({ t: a.t, tone: a.tone });
    C.el.querySelector(".conf-answers").innerHTML = `<p class="conf-said">Tu réponds : « ${esc(a.t)} »</p><p class="muted">${esc(a.r || "")}</p>`;
    C.el.querySelector(".conf-timer")?.remove();
    C.i++;
    setTimeout(() => { if (!C) return; if (C.i < C.questions.length) ask(); else done(); }, reduceMotion ? 900 : 1400);
  }

  function done() {
    const c = C; C = null;
    removeEventListener("keydown", c.onKey, true);
    c.el.remove();
    c.resolve({ fx: c.fx, tones: c.tones, answers: c.answers });
  }

  return { play, active: () => !!C };
})();

/* ============ Questions selon le match et la carrière ============ */
const J = ["La journaliste de L'Écho du Stade", "Le reporter de Radio Ballon", "Une journaliste de la télé nationale", "Le chroniqueur du Quotidien du Ballon"];
function confQuestions(M){
  const won = M.res==="w", lost = M.res==="l", n = p.name.split(" ").pop(), qs = [];
  qs.push(won
    ? {q:`Victoire ${M.score}. Qu'est-ce qui a fait la différence ce soir ?`,a:[
        {t:"Le collectif. On a tous couru les uns pour les autres.",fx:{trust:3,moral:1},tone:"humble",r:"Le vestiaire apprécie."},
        {t:"Moi. Je l'avais annoncé, je l'ai fait.",fx:{rep:3,trust:-3},tone:"cash",r:"La phrase tourne en boucle sur les réseaux."},
        {t:"Le coach a trouvé les bons mots à la mi-temps.",fx:{trust:5},tone:"humble",r:"Le coach te fait un clin d'œil en sortant."}]}
    : lost
    ? {q:`Défaite ${M.score}. Vous assumez ?`,a:[
        {t:"Oui. Moi le premier, je n'ai pas été au niveau.",fx:{rep:2,moral:-1,trust:2},tone:"humble",r:"Ton honnêteté est saluée."},
        {t:"L'arbitre nous a volés, c'est un scandale.",fx:{rep:-2,moral:2},tone:"provoc",r:"La commission de discipline prend note."},
        {t:"On n'a pas joué assez juste. On va travailler.",fx:{trust:2},tone:"humble",r:"Sobre et professionnel."}]}
    : {q:`Match nul ${M.score}. Frustré ?`,a:[
        {t:"Un point, c'est mieux que rien. On avance.",fx:{trust:2},tone:"humble",r:"Discours de vestiaire."},
        {t:"Frustré, oui. On méritait mieux.",fx:{moral:1,rep:1},tone:"cash",r:"Les supporters partagent ta frustration."},
        {t:"Demandez au coach, ce sont ses choix.",fx:{trust:-5,rep:1},tone:"provoc",r:"Le coach lit l'interview le lendemain. Il n'aime pas."}]});
  if(M.myG+M.myA>0) qs.push({q:`${M.myG?`${M.myG} but${M.myG>1?"s":""}`:`${M.myA} passe${M.myA>1?"s":""} décisive${M.myA>1?"s":""}`} ce soir. Vous êtes le meilleur à votre poste ?`,a:[
    {t:"Je laisse les autres en juger.",fx:{rep:1},tone:"humble",r:"Réponse élégante."},
    {t:"Oui. Et de loin.",fx:{rep:3,moral:2,trust:-2},tone:"cash",r:"Un titre en une le lendemain."},
    {t:"Sans mes coéquipiers, je ne marque rien.",fx:{trust:3,moral:1},tone:"humble",r:"Le vestiaire est touché."}]});
  if(rivalActive()) qs.push({q:`${p.rival.name} a dit cette semaine que vous n'étiez « pas à son niveau ». Une réponse ?`,a:[
    {t:"Je lui réponds sur le terrain, pas dans les journaux.",fx:{moral:2},tone:"humble",r:"Classe."},
    {t:"Qu'il vienne me le dire en face.",fx:{rep:3,rival:1},tone:"provoc",r:"La rivalité s'enflamme. Les audiences aussi."},
    {t:"Je lui souhaite bonne chance. Il en aura besoin.",fx:{rep:2},tone:"cash",r:"Le sourire en coin fait le tour du web."}]});
  if((p.rel?.trust??50)<45) qs.push({q:"On vous sent en froid avec votre entraîneur. Que se passe-t-il ?",a:[
    {t:"Rien du tout. Je suis à sa disposition.",fx:{trust:6},tone:"humble",r:"Il apprécie que tu aies fermé la porte aux rumeurs."},
    {t:"Je veux jouer plus, c'est tout.",fx:{trust:-3,moral:2},tone:"cash",r:"Message reçu… par lui aussi."},
    {t:"Ça, c'est entre lui et moi.",fx:{},tone:"froid",r:"Le mystère reste entier."}]});
  qs.push({q:`Des rumeurs vous envoient dans un plus grand club cet été. ${n}, vous restez ?`,a:[
    {t:"J'ai un contrat, je le respecte.",fx:{rep:2,trust:2},tone:"humble",r:"Les supporters chantent ton nom à la sortie."},
    {t:"Je ne ferme aucune porte.",fx:{flag:"forceDepart",trust:-3},tone:"cash",r:"Les recruteurs ont l'oreille tendue."},
    {t:"Je suis ici pour gagner des titres. Ici.",fx:{moral:2,rep:1},tone:"humble",r:"Une réponse de capitaine."}]});
  // les journalistes ont de la mémoire : une phrase choc de la dernière conférence revient sur la table
  const L = p.confLast;
  /** @type {any[]} */
  const mem = L?[{q:`La dernière fois, vous aviez déclaré : « ${L.t} » Vous le pensez toujours ?`,a:[
    {t:"Oui, et je le redirais.",fx:{rep:2,trust:-2},tone:"cash",r:"Constant dans ses idées, titre la presse."},
    {t:"J'étais à chaud. Je nuancerais.",fx:{trust:2,moral:1},tone:"humble",r:"Ta maturité est saluée."},
    {t:"Je ne me souviens pas avoir dit ça.",fx:{rep:-2},tone:"froid",r:"La vidéo ressort dans la soirée. Aïe."}]}]:[];
  p.confLast = null;
  return mem.concat(shuffle(qs.slice(1))).slice(0,2).concat(qs[0]).reverse().map((q,i)=>({...q,who:J[(hashStr(p.name)+i)%J.length]}));
}
// ton dominant de la conférence → titre du lendemain
function confHeadline(tones){
  const c = t=>tones.filter(x=>x===t).length, n = p.name.split(" ").pop();
  if(c("provoc")>=2) return `${n} met le feu en conférence de presse`;
  if(c("cash")>=2) return `${n}, sans filtre`;
  if(c("froid")>=2) return `${n}, le silence qui interroge`;
  return `${n}, la tête sur les épaules`;
}
function pressConference(){
  const M = p.tmp?.match;
  if(!M||M.conf||typeof Conference==="undefined") return route();
  M.conf = true; save();
  Conference.play({title:"Conférence d'après-match",questions:confQuestions(M)}).then(res=>{
    const deltas = applyFx(res.fx);
    const shock = res.answers.find(a=>a.tone==="provoc")||res.answers.find(a=>a.tone==="cash");
    p.confLast = shock?{t:shock.t,y:p.year}:null;
    ui.toast = `<div class="tchoice">📰 Le lendemain dans la presse</div><div><b>« ${esc(confHeadline(res.tones))} »</b></div><div class="delta">${deltaHtml(deltas)}</div>`;
    save(); route();
  });
}
