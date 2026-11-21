// Trajectoire · Le match clé en direct : entre deux actions, le chrono défile minute par minute, les buts tombent à
// leur minute (le tableau de score change, la foule explose ou se tait), et la dernière action d'un match serré
// devient un « moment décisif ». C'est un habillage de l'écran du match : les règles de match.js ne changent pas.
// État : m.live = {min, n} (minute affichée, lignes du fil déjà montrées), pour ne jamais rejouer ce qu'on a vu.

const liveReduce = typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const liveOn = ()=>typeof document!=="undefined"&&!!document.querySelector&&!ui.quick&&!liveReduce;
// la minute où l'écran du match doit arriver
function liveTarget(m){
  if(m.simDone) return m.et?120:90;
  if(m.awaitTactic) return 45;
  return m.mins[Math.min(m.step,m.mins.length-1)]||0;
}
const lineMin = l=>{ const r = /(\d+)'/.exec(String(l)); return r?+r[1]:null; };
const isUsGoal = l=>/^⚽/.test(String(l)), isThemGoal = l=>/^🔴/.test(String(l));
function liveTicker(m){
  if(!m||m.short) return;
  const target = liveTarget(m), L = m.live = m.live||{min:0,n:0};
  if(!liveOn()){ L.min = target; L.n = m.log.length; return; }
  const items = [...document.querySelectorAll(".mlog li")], fresh = [];
  for(let i=L.n;i<m.log.length&&i<items.length;i++){ fresh.push({el:items[i],line:m.log[i],min:lineMin(m.log[i])}); items[i].classList.add("live-hide"); }
  const from = Math.min(L.min,target);
  L.min = target; L.n = m.log.length;
  const clock = document.querySelector(".bc-clock"), sc = document.querySelectorAll(".bc-score b"), decide = document.querySelector(".decide");
  // le score de départ : celui d'avant les buts pas encore montrés
  let us = m.us-fresh.filter(f=>isUsGoal(f.line)).length, them = m.them-fresh.filter(f=>isThemGoal(f.line)).length;
  const paint = min=>{ if(clock&&!m.awaitTactic&&!m.simDone) clock.textContent = `${min}'`; if(sc[0]) sc[0].textContent = String(us); if(sc[1]) sc[1].textContent = String(them); };
  const reveal = f=>{
    f.el.classList.remove("live-hide"); f.el.classList.add("live-in");
    if(isUsGoal(f.line)){ us++; flashScore("us"); if(typeof sfx==="function"){ sfx("goal"); setTimeout(()=>sfx("chant"),900); } }
    else if(isThemGoal(f.line)){ them++; flashScore("them"); if(typeof sfx==="function") sfx("concede"); }
  };
  if(target-from<=0||!fresh.some(f=>f.min!=null&&f.min>from)){
    // rien à faire défiler : on montre tout de suite (le résultat d'une action, une réplique)
    paint(target); fresh.forEach(reveal); liveDecisive(m); return;
  }
  if(decide) decide.classList.add("live-wait");
  const card = decide&&decide.closest(".card");
  let min = from, stop = false, swelled = false;
  const ff = ()=>{ stop = true; };
  if(card) card.addEventListener("click",ff,{once:true});
  paint(from);
  const step = Math.max(28,Math.min(70,2600/Math.max(1,target-from)));
  const tick = ()=>{
    min = stop?target:min+1;
    // dans l'ordre du fil : une ligne sans minute (mi-temps, réplique) suit celle d'avant
    for(const f of fresh){ if(f.el.classList.contains("live-in")) continue; if(f.min!=null&&f.min>min) break; reveal(f); }
    // une occasion de temps en temps : la foule se lève
    if(!swelled&&!stop&&Math.random()<.05){ swelled = true; if(typeof crowdSwell==="function") crowdSwell(); }
    paint(Math.min(min,target));
    if(min<target) setTimeout(tick,step);
    else { if(card) card.removeEventListener("click",ff); if(decide) decide.classList.remove("live-wait"); paint(target); liveDecisive(m); }
  };
  setTimeout(tick,step);
}
function flashScore(side){
  const b = /** @type {HTMLElement} */ (document.querySelector(".broadcast")); if(!b) return;
  b.classList.remove("goal-us","goal-them"); void b.offsetWidth; b.classList.add(side==="us"?"goal-us":"goal-them");
}
// la dernière action d'un match serré : bandeau, cadre qui bat, cœur qui cogne
function liveDecisive(m){
  const decide = document.querySelector(".decide");
  if(!decide||m.pending||m.talk||m.awaitTactic||m.simDone||m.step>=m.mins.length) return;
  const last = m.step>=m.mins.length-1||m.mins[m.step]>=80;
  if(!last||Math.abs(m.us-m.them)>1||decide.querySelector(".decisive-k")) return;
  decide.classList.add("decisive");
  const k = document.createElement("p"); k.className = "decisive-k";
  k.textContent = m.us===m.them?"Moment décisif · le prochain but gagne le match":m.us>m.them?"Moment décisif · tiens ce résultat":"Moment décisif · il faut égaliser";
  decide.prepend(k);
  if(typeof sfx==="function"){ sfx("heart"); setTimeout(()=>sfx("heart"),1100); }
  if(typeof crowdHush==="function"){ crowdHush(true); setTimeout(()=>crowdHush(false),2600); }
}
