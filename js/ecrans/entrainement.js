// Trajectoire · Centre d'entraînement (tous les mini-jeux, sans enjeu) et mesure de leur difficulté réelle
// Chaque mini-jeu joué, en carrière ou à l'entraînement, compte dans tes statistiques. Ton propre document
// minis/<ton id> est envoyé au stockage partagé ; la page additionne ceux de tous les joueurs (aucun nom, que des totaux).
const MINIS = {
  shoot:{n:"Penalty (tir)",i:"⚽",help:"Choisis ton style (1 placé, 2 en force, 3 Panenka), puis Espace ou clic pour viser, et une deuxième fois pour la puissance. Trop fort, ça s'envole."},
  save:{n:"Penalty (gardien)",i:"🧤",help:"Regarde les appuis du tireur pendant son élan, puis clique où part le ballon (ou ← ↑ →) au moment de la frappe."},
  fk:{n:"Coup franc",i:"🌀",help:"Trois temps : la cible, la puissance (faible = lobe le mur mais lent), puis l'effet pour enrouler autour du mur."},
  fksave:{n:"Coup franc (gardien)",i:"🧱",help:"Le ballon passe au-dessus ou autour de ton mur : suis-le et plonge au bon endroit."},
  shootout:{n:"Tirs au but",i:"🎯",help:"Choisis ton rang de tireur, puis enchaîne. Tes coéquipiers et ton gardien font le reste."},
  dribble:{n:"Dribble",i:"🌪️",help:"Quand le cercle se referme sur le défenseur, appuie sur la flèche indiquée (↑ ou ↓, ou clic en haut ou en bas)."},
  tacle:{n:"Tacle",i:"🦵",help:"Tacle (Espace ou clic) quand l'attaquant entre dans l'anneau jaune. Méfie-toi des feintes."},
  aerien:{n:"Sortie aérienne",i:"🙌",help:"Sors (Espace ou clic) quand le ballon entre dans le cercle, avant que l'attaquant ne saute."},
  passe:{n:"Passe décisive",i:"🎯",help:"Passe (Espace ou clic) quand la ligne vers ton attaquant devient verte, avant la fin du chrono."}
};
const DUEL_KINDS = ["dribble","tacle","aerien","passe"];

/* ============ Statistiques des mini-jeux ============ */
const loadMiniStats = ()=>{ try{ return JSON.parse(localStorage.getItem("trajectoire_minis_stats"))||{}; }catch(e){ return {}; } };
let miniTimer = null, miniSending = false;
// appelé après chaque mini-jeu joué pour de vrai (jamais pour un « Simuler »)
function recordMini(mode,success){
  if(success==null||!MINIS[mode]) return;
  const s = loadMiniStats(), m = s[mode] = s[mode]||{n:0,ok:0};
  m.n++; if(success) m.ok++;
  try{ localStorage.setItem("trajectoire_minis_stats",JSON.stringify(s)); }catch(e){}
  // un seul envoi par pause de jeu, jamais deux en même temps sur le même document
  clearTimeout(miniTimer); miniTimer = setTimeout(sendMiniStats,4000);
}
async function sendMiniStats(){
  if(miniSending) return void (miniTimer = setTimeout(sendMiniStats,4000));
  const db = await getDb(), user = await getUser(), uid = user?await user.id():null;
  if(!db||!uid) return;
  miniSending = true;
  try{ await withTimeout(db.doc("minis/"+uid).set({m:loadMiniStats()}),10000); }catch(e){}
  miniSending = false;
}
// totaux de tous les joueurs : {mode: {n, ok}} ou null si le stockage partagé n'est pas disponible
async function globalMiniStats(){
  const db = await getDb(); if(!db) return null;
  try{
    const snap = await withTimeout(db.collection("minis").get(),10000), tot = {};
    snap.docs.forEach(d=>{ const m = (d.data()||{}).m||{}; for(const k in m){ if(!MINIS[k]||typeof m[k]?.n!=="number") continue; const t = tot[k] = tot[k]||{n:0,ok:0,players:0}; t.n += m[k].n; t.ok += Math.min(m[k].ok||0,m[k].n); t.players++; } });
    return tot;
  }catch(e){ return null; }
}
const pct = s=>s&&s.n?Math.round(100*s.ok/s.n)+" %":"–";

/* ============ Centre d'entraînement ============ */
const TRAIN_US = {name:"Trajectoire FC",short:"Nous",a:"#2f9a5f",b:"#ffffff"}, TRAIN_THEM = {name:"Sparring",short:"Sparring",a:"#4f6bd8",b:"#ffffff"};
function trainingScreen(note){
  p = null; unseed();
  const mine = loadMiniStats();
  $("#app").innerHTML = `<div class="fade" tabindex="-1" style="padding-top:20px">
    <div class="muted">Sans enjeu, autant de fois que tu veux</div><h1><span class="emo" aria-hidden="true">🏋️</span> Entraînement</h1>
    ${note?`<div class="toast" role="status">${note}</div>`:""}
    <p class="story">Chaque mini-jeu peut tomber au pire moment d'une carrière. Ici, tu apprends les gestes au calme.</p>
    <div class="train">${Object.entries(MINIS).map(([k,x])=>`<div class="card train-c"><h3>${x.i} ${x.n}</h3><p>${x.help}</p>
      <p class="muted" style="font-size:.82rem;margin:4px 0 8px">Toi : <b style="color:var(--text)">${pct(mine[k])}</b>${mine[k]?.n?` sur ${mine[k].n}`:""} · tous les joueurs : <b class="glob" data-k="${k}" style="color:var(--text)">…</b></p>
      <button class="btn" onclick="trainPlay('${k}')">Jouer</button></div>`).join("")}</div>
    <button class="btn ghost" onclick="home()">← Accueil</button></div>`;
  window.scrollTo(0,0); focusScreen();
  globalMiniStats().then(tot=>document.querySelectorAll(".glob").forEach(el=>{ const s = tot&&tot[/** @type {HTMLElement} */ (el).dataset.k];
    el.textContent = !tot?"disponible depuis le lien claude.ai":s&&s.n>=10?`${pct(s)} (${s.players} joueur${s.players>1?"s":""})`:"pas encore assez de parties"; }));
}
function trainPlay(k){
  const done = (ok,skipped)=>{ if(!skipped) recordMini(k,ok); trainingScreen(`${MINIS[k].i} ${MINIS[k].n} : ${ok?"réussi ✅":"raté ❌"}. Encore une fois ?`); };
  const base = {skill:.55,pressure:.15,title:`Entraînement · ${MINIS[k].n}`,us:TRAIN_US,them:TRAIN_THEM,number:10,look:loadLook()};
  // la consigne d’abord, comme en match
  miniBrief(k,base.title,"").then(go=>{
    if(!go) return trainingScreen();
    if(DUEL_KINDS.includes(k)) return Duel.play({...base,kind:k,sub:"Contre le sparring-partner"}).then(r=>done(r.success,r.skipped));
    Penalty.play({...base,mode:k,sub:"Personne ne te regarde. Ou presque.",youGK:k==="save"||k==="fksave"}).then(r=>done(r.success,r.skipped));
  });
}
// dernier avatar créé, pour que le joueur de l'entraînement te ressemble
const loadLook = ()=>{ try{ return JSON.parse(localStorage.getItem("trajectoire_look"))||null; }catch(e){ return null; } };
