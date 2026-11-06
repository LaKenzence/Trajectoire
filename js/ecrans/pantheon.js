// Trajectoire · Panthéon, succès, défi du jour, records partagés, emplacements, carte en image
/* ============ Panthéon et succès (partagés entre les carrières) ============ */
const ACH = [
 {id:"ballon",i:"🌟",n:"Étoile",d:"Remporter un Ballon d'Étoile",t:s=>s.stars>=1},
 {id:"ballon3",i:"💫",n:"Constellation",d:"Remporter 3 Ballons d'Étoile",t:s=>s.stars>=3},
 {id:"monde",i:"🌍",n:"Sur le toit du monde",d:"Gagner le Championnat du Monde",t:s=>s.world},
 {id:"cdc",i:"🏆",n:"Le Graal",d:"Gagner la Coupe des Champions",t:s=>s.cdc},
 {id:"centurion",i:"🎖️",n:"Centurion",d:"Atteindre 100 sélections",t:s=>s.caps>=100},
 {id:"buteur",i:"⚽",n:"Buteur légendaire",d:"Marquer 300 buts en carrière",t:s=>s.goals>=300},
 {id:"mur",i:"🧤",n:"Le Mur",d:"Gardien : 200 clean sheets",t:s=>s.clean>=200},
 {id:"fidele",i:"❤️",n:"Fidèle",d:"Jouer 10 saisons dans le même club",t:s=>s.loyal>=10},
 {id:"globe",i:"✈️",n:"Globe-trotter",d:"Jouer pour 6 clubs différents",t:s=>s.clubs>=6},
 {id:"trois",i:"🗺️",n:"Conquérant",d:"Être champion dans 3 championnats",t:s=>s.leagues>=3},
 {id:"finales",i:"🥇",n:"Homme des finales",d:"Gagner 3 finales de coupe en direct",t:s=>s.finals>=3},
 {id:"rival",i:"⚔️",n:"Ennemi intime",d:"Gagner la rivalité",t:s=>s.rivalWon},
 {id:"echo",i:"⏳",n:"Le passé ne meurt jamais",d:"Vivre 3 échos du passé en une carrière",t:s=>s.echoes>=3},
 {id:"vieux",i:"🧓",n:"Vieux briscard",d:"Jouer jusqu'à 37 ans",t:s=>s.age>=37},
 {id:"riche",i:"💰",n:"Coffre-fort",d:"Gagner 50 M€ en carrière",t:s=>s.money>=50000},
 {id:"top",i:"💎",n:"Perfection",d:"Atteindre un niveau de 95",t:s=>s.peak>=95},
 {id:"legende",i:"👑",n:"Légende des légendes",d:"Ballon d'Étoile en mode Légende",t:s=>s.hard&&s.stars>=1},
 {id:"talents",i:"🧩",n:"Touche-à-tout",d:"Maîtriser 8 talents",t:s=>s.talents>=8},
 {id:"objectifs",i:"🎯",n:"Perfectionniste",d:"Réussir 12 objectifs personnels",t:s=>s.goalsDone>=12},
 {id:"tacticien",i:"📋",n:"Tacticien",d:"Être champion en tant qu'entraîneur",t:s=>s.coachTitles>=1},
 {id:"dynastie",i:"🌳",n:"Dynastie",d:"Mener une famille sur 3 générations",t:s=>s.gens>=3},
 {id:"court",i:"💔",n:"Étoile filante",d:"Raccrocher avant 33 ans",t:s=>s.age<33},
 {id:"defi",i:"🏅",n:"Défi relevé",d:"Finir une carrière avec un défi de départ et au moins 5 trophées",t:s=>s.defi&&s.trophies>=5},
 {id:"sniper",i:"🎯",n:"Sniper",d:"Marquer 10 penalties en les tirant toi-même",t:s=>s.pens.but>=10},
 {id:"chat",i:"🐈",n:"Le Chat",d:"Arrêter 5 penalties ou coups francs toi-même",t:s=>s.pens.arret>=5},
 {id:"enroule",i:"🌀",n:"Enroulé parfait",d:"Marquer 3 coups francs en les tirant toi-même",t:s=>s.pens.cfBut>=3},
 {id:"jubile",i:"🎟️",n:"Jubilé",d:"Faire ses adieux devant plus de 60 000 spectateurs",t:s=>s.jubile>=60000},
 {id:"clash",i:"🎤",n:"Punchline",d:"Gagner un clash sur les réseaux sociaux",t:s=>s.clash},
 {id:"certif",i:"✔️",n:"Phénomène",d:"Obtenir un compte certifié avant 20 ans",t:s=>s.certif},
 {id:"protege",i:"🌱",n:"Passage de témoin",d:"Voir ton protégé prendre ta place",t:s=>s.protDep},
 {id:"prolong",i:"⏱️",n:"Héros des prolongations",d:"Marquer en prolongation d'une finale",t:s=>s.etGoal},
 {id:"saison",i:"📆",n:"Métronome",d:"Gagner 15 matchs de saison joués en direct",t:s=>s.ordWins>=15},
 {id:"joignable",i:"📞",n:"Toujours joignable",d:"Répondre à 8 appels urgents",t:s=>s.urgents>=8},
 {id:"famille",i:"🏡",n:"Bonheur simple",d:"Se marier et avoir 3 enfants pendant sa carrière",t:s=>s.married&&s.kids>=3}
];
function loadHof(){ try{ return JSON.parse(localStorage.getItem("trajectoire_hof"))||{ach:{},careers:[]}; }catch(e){ return {ach:{},careers:[]}; } }
function saveHof(h){ try{ localStorage.setItem("trajectoire_hof",JSON.stringify(h)); }catch(e){} }
function rivalScore(){
  const r = p.rival; if(!r) return 0;
  const t = careerTotals(), peak = Math.max(...p.seasons.map(s=>s.lvl),p.lvl);
  const me = [p.pos==="GB"?t.cs:t.g,p.trophies.length,p.trophies.filter(x=>x.t.startsWith("Ballon")).length,p.caps,peak];
  const him = [p.pos==="GB"?r.clean:r.goals,r.trophies,r.stars,r.caps,r.best];
  return me.reduce((a,v,i)=>a+(v>him[i]?1:v<him[i]?-1:0),0)+(r.h2h.w-r.h2h.l)*.5;
}
function careerSummary(){
  const t = careerTotals(), per = {};
  p.seasons.forEach(s=>per[s.club]=(per[s.club]||0)+1);
  return {goals:t.g,clean:t.cs,caps:p.caps,age:p.age,money:p.money,hard:p.hard,echoes:p.echoes||0,finals:p.finals||0,talents:(p.talents||[]).length,goalsDone:p.goalsDone||0,gens:(p.dynasty||[]).length+1,coachTitles:(p.coachTrophies||[]).filter(t=>t.t.startsWith("Champion")).length,
    stars:p.trophies.filter(x=>x.t.startsWith("Ballon")).length, world:p.trophies.some(x=>x.t.startsWith("Championnat du Monde")),
    cdc:p.trophies.some(x=>x.t==="Coupe des Champions"), loyal:Math.max(0,...Object.values(per)), clubs:p.clubsHist.length,
    leagues:new Set(p.trophies.filter(x=>x.t.startsWith("Champion –")).map(x=>x.t)).size,
    peak:Math.max(...p.seasons.map(s=>s.lvl),p.lvl), rivalWon:rivalScore()>0, trophies:p.trophies.length,
    defi:p.defi||null, pens:p.pens||newPens(), married:p.vie?.couple==="marie", kids:p.vie?.kids||0,
    jubile:p.jubileCrowd||0, clash:!!p.flags.clash, certif:!!p.flags.certif20, protDep:!!p.flags.protDep, etGoal:!!p.flags.etGoal,
    ordWins:(p.ordinaires||[]).filter(o=>o.r==="w").length, urgents:p.urgentsN||0};
}
function recordCareer(){
  if(p.hofSaved) return;
  const s = careerSummary(), h = loadHof();
  p.newAch = ACH.filter(a=>a.t(s)&&!h.ach[a.id]).map(a=>a.id);
  p.newAch.forEach(id=>h.ach[id]=p.year);
  h.careers.push({name:p.name,country:p.country,pos:p.pos,seasons:p.seasons.length,clubs:p.clubsHist.length,goals:p.pos==="GB"?s.clean:s.goals,
    trophies:s.trophies,stars:s.stars,peak:s.peak,hard:p.hard,defi:p.defi||null,after:p.after?.n||"",score:s.stars*25+s.trophies*3+s.peak+(s.rivalWon?10:0)});
  h.careers.sort((a,b)=>b.score-a.score); h.careers = h.careers.slice(0,25);
  if(p.dynasty?.length){
    const fam = p.name.split(" ").slice(1).join(" ")||p.name, root = p.dynasty[0].name;
    const total = p.dynasty.reduce((a,g)=>a+g.score,0)+s.stars*25+s.trophies*3+s.peak;
    h.dyn = (h.dyn||[]).filter(d=>d.root!==root).concat({fam,root,gens:p.dynasty.length+1,score:total,country:p.country}).sort((a,b)=>b.score-a.score).slice(0,10);
  }
  recordTitles(h); recordRival(h);
  saveHof(h); p.hofSaved = true; save();
}
function hofScreen(){
  const h = loadHof(), n = Object.keys(h.ach).length;
  p = null;
  $("#app").innerHTML = `<div class="fade" style="padding-top:20px">
    <header class="cosmos"><div class="muted">Toutes tes carrières</div><h1><span class="emo" aria-hidden="true">🏛️</span> Panthéon</h1></header>
    <div class="card"><h3>Succès · ${n}/${ACH.length}</h3>
      ${ACH.map(a=>`<div class="ach ${h.ach[a.id]?"":"off"}"><span class="i">${a.i}</span><div><b>${a.n}</b><small>${a.d}</small></div></div>`).join("")}</div>
    ${titlesHof(h)}
    <div class="card"><h3>Les plus grandes carrières</h3>${h.careers.length?`<div class="tablewrap"><table><tr><th>#</th><th>Joueur</th><th>Saisons</th><th>Buts</th><th>🏆</th><th>🌟</th><th>Max</th></tr>
      ${h.careers.slice(0,10).map((c,i)=>`<tr><td>${i+1}</td><td>${flag(c.country)} ${esc(c.name)}${c.hard?" 👑":""}<br><small class="muted">${POS[c.pos].n}${c.after?" · "+esc(c.after):""}</small></td><td>${c.seasons}</td><td>${c.goals}</td><td>${c.trophies}</td><td>${c.stars}</td><td>${c.peak}</td></tr>`).join("")}</table></div>`:'<p class="muted">Termine une carrière pour entrer au Panthéon.</p>'}</div>
    ${dynHof(h)}
    <div class="card"><h3>🌍 Records de tous les joueurs</h3><div id="records" class="muted">Chargement…</div></div>
    <button class="btn primary" onclick="home()">← Accueil</button></div>`;
  window.scrollTo(0,0);
  loadRecords();
}

/* ============ Partage ============ */
function shareText(){
  const t = careerTotals(), s = careerSummary();
  return [`⚽ Ma carrière dans Trajectoire${p.hard?" (mode Légende)":""}`,
    `${p.name} · ${COUNTRIES[p.country].name} · ${POS[p.pos].n}`,
    `${p.seasons.length} saisons · ${t.apps} matchs · ${p.pos==="GB"?t.cs+" clean sheets":t.g+" buts"} · ${t.a} passes décisives`,
    `🏆 ${s.trophies} trophées${s.stars?` · 🌟 ${s.stars} Ballon(s) d'Étoile`:""} · ${p.caps} sélections · niveau max ${s.peak}`,
    `Clubs : ${p.clubsHist.join(" → ")}`,
    p.rival?`⚔️ Rivalité contre ${p.rival.name} : ${s.rivalWon?"gagnée":"perdue"}`:"",
    p.after?`Après : ${p.after.n}`:""].filter(Boolean).join("\n");
}
function copyCareer(btn){
  const txt = shareText(), done = ()=>{ btn.textContent = "✅ Bilan copié !"; };
  try{ navigator.clipboard.writeText(txt).then(done,()=>fallbackCopy(txt,done)); }catch(e){ fallbackCopy(txt,done); }
}
function fallbackCopy(txt,done){
  const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select();
  try{ document.execCommand("copy"); done(); }catch(e){} ta.remove();
}

/* ============ Défi du jour et classement partagé ============ */
const nativeRandom = Math.random;
function seedRng(str){
  let h = 2166136261;
  for(const ch of str){ h ^= ch.charCodeAt(0); h = Math.imul(h,16777619); }
  let a = h>>>0;
  Math.random = ()=>{ a = a+0x6D2B79F5|0; let t = Math.imul(a^a>>>15,1|a); t = t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
}
function unseed(){ Math.random = nativeRandom; }
const today = ()=>{ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
function dailyDraft(){
  const d = today(); seedRng("trajectoire:"+d);
  const k = o=>pick(Object.keys(o));
  const o = {look:randomLook(),name:pick(FIRST)+" "+pick(LAST),country:k(COUNTRIES),pos:k(POS),trait:k(TRAITS),origin:k(ORIGINS),ent:k(ENTOURAGES),life:k(LIFESTYLES),daily:d};
  unseed(); return o;
}
function startDaily(){
  slot = "daily";
  const o = dailyDraft();
  seedRng("trajectoire:"+o.daily+":joueur");
  newPlayer(o);
  seedRng(o.daily+":0");
  route();
}
function dailyScore(){
  const s = careerSummary();
  return Math.round(s.stars*40+s.trophies*6+s.peak*2+(p.pos==="GB"?s.clean/3:s.goals/4)+s.caps/5+(s.rivalWon?20:0)+s.goalsDone*3+(weeklyDone()?150:0));
}
let dbP = null, userP = null;
const getDb = ()=>dbP||(dbP = window.claude?.use?window.claude.use("db").catch(()=>null):Promise.resolve(null));
const getUser = ()=>userP||(userP = window.claude?.use?window.claude.use("user").catch(()=>null):Promise.resolve(null));
const withTimeout = (pr,ms)=>Promise.race([pr,new Promise((_,rej)=>setTimeout(()=>rej({code:"timeout"}),ms))]);
async function submitDaily(){
  const box = $("#dailyBox"); if(!box) return;
  const lb = box.querySelector(".lb");
  const db = await getDb(), user = await getUser(), uid = user?await user.id():null;
  if(!db||!uid){ lb.textContent = "Le classement partagé fonctionne quand le jeu est ouvert depuis son lien claude.ai, en étant connecté."; return; }
  if(!p.dailySent){
    try{
      const ref = db.doc("scores/"+uid), snap = await withTimeout(ref.get(),10000);
      const body = snap.exists?JSON.parse(JSON.stringify(snap.data())):{};
      const days = body.days||{}, score = dailyScore(), prev = days[p.daily];
      if(!prev||prev.score<score){
        const s = careerSummary();
        days[p.daily] = {score,player:p.name,pos:p.pos,country:p.country,trophies:s.trophies,stars:s.stars,peak:s.peak};
        const keep = Object.keys(days).sort().slice(-14), kept = {}; keep.forEach(d=>kept[d]=days[d]);
        await withTimeout(ref.set({days:kept}),10000);
      }
      p.dailySent = true; save();
    }catch(e){ lb.textContent = "Ton score n'a pas pu être enregistré. Il faut un accès Contributeur ou plus au jeu pour apparaître au classement."; return; }
  }
  renderBoard(p.daily,lb);
}
async function renderBoard(day,el){
  const db = await getDb(), user = await getUser();
  if(!db){ el.textContent = "Le classement partagé fonctionne quand le jeu est ouvert depuis son lien claude.ai, en étant connecté."; return; }
  el.textContent = "Chargement du classement…";
  try{
    const snap = await withTimeout(db.collection("scores").get(),10000);
    const rows = snap.docs.map(d=>({id:d.id,...((d.data()||{}).days||{})[day]})).filter(r=>typeof r.score==="number").sort((a,b)=>b.score-a.score).slice(0,20);
    if(!rows.length){ el.textContent = "Personne n'a encore terminé le défi du jour. Sois le premier !"; return; }
    const me = user?await user.id():null, ps = user?await user.profiles(rows.map(r=>r.id)):{};
    el.innerHTML = `<table class="mini"><tr><th>#</th><th>Joueur</th><th>Carrière</th><th>Score</th></tr>${rows.map((r,i)=>`<tr class="${r.id===me?"me":""}"><td>${i+1}</td><td>${esc(ps[r.id]?.name||"Un joueur")}${r.id===me?" (toi)":""}</td><td>${flag(COUNTRIES[r.country]?r.country:"FR")} ${esc(r.player||"")}<br><small class="muted">🏆 ${r.trophies||0}${r.stars?` · 🌟 ${r.stars}`:""} · max ${r.peak||"?"}</small></td><td><b>${r.score}</b></td></tr>`).join("")}</table>`;
  }catch(e){ el.textContent = "Le classement n'a pas pu être chargé. Réessaie dans un instant."; }
}
function dailyScreen(){
  p = null; unseed();
  const o = dailyDraft(), saved = loadSlot("daily");
  const inProgress = saved&&saved.daily===o.daily&&!saved.after;
  $("#app").innerHTML = `<div class="fade" style="padding-top:20px">
    <div class="muted">Défi du jour · ${o.daily}</div><h1><span class="emo" aria-hidden="true">📅</span> Même départ pour tous</h1>
    <p class="story">Aujourd'hui, tout le monde commence avec le même joueur et les mêmes coups du sort en début de saison. Tes choix feront la différence. Le meilleur score de la journée l'emporte.</p>
    <div class="card"><h3>${flag(o.country)} ${esc(o.name)}</h3>
      <div>${[POS[o.pos].n,TRAITS[o.trait].n,ORIGINS[o.origin].n,ENTOURAGES[o.ent].n,LIFESTYLES[o.life].n].map(x=>`<span class="tag">${x}</span>`).join("")}</div>
      <p class="muted" style="font-size:.88rem;margin-bottom:0">Score : titres, trophées, Ballons d'Étoile, niveau max, buts, sélections, rivalité et objectifs réussis.</p></div>
    ${inProgress?`<button class="btn primary" onclick="resume('daily')">Reprendre ton défi du jour<small>${saved.age} ans · ${esc(saved.club.name)}</small></button>`:""}
    ${saved&&!inProgress&&!(saved.retired&&saved.after)?`<p class="muted">⚠️ Relancer le défi remplace ta partie du jour en cours (${esc(saved.name)}).</p>`:""}
    <button class="btn ${inProgress?"":"primary"}" onclick="slot='daily';wipe();startDaily()">${inProgress?"Recommencer le défi":"Jouer le défi du jour"}</button>
    <div class="card"><h3>🏁 Classement du jour</h3><div class="lb muted">Chargement…</div></div>
    <button class="btn ghost" onclick="home()">← Accueil</button></div>`;
  renderBoard(o.daily,$(".lb"));
  window.scrollTo(0,0);
}

/* ============ Records de tous les joueurs (partagés) ============ */
const RECORDS = [
  {k:"goals",n:"Buts en carrière",v:s=>s.goals},
  {k:"clean",n:"Clean sheets en carrière",v:s=>s.clean},
  {k:"stars",n:"Ballons d'Étoile",v:s=>s.stars},
  {k:"trophies",n:"Trophées",v:s=>s.trophies},
  {k:"caps",n:"Sélections",v:s=>s.caps},
  {k:"peak",n:"Niveau maximum",v:s=>s.peak},
  {k:"seasons",n:"Saisons jouées",v:()=>p.seasons.length}
];
async function submitRecords(){
  if(p.recordsSent) return;
  const db = await getDb(), user = await getUser(), uid = user?await user.id():null;
  if(!db||!uid) return;
  try{
    const ref = db.doc("records/"+uid), snap = await withTimeout(ref.get(),10000);
    const best = snap.exists?JSON.parse(JSON.stringify(snap.data().best||{})):{};
    const s = careerSummary(); let changed = false;
    for(const r of RECORDS){ const v = r.v(s); if(v>0&&(!best[r.k]||best[r.k].v<v)){ best[r.k] = {v,player:p.name,country:p.country}; changed = true; } }
    if(changed) await withTimeout(ref.set({best}),10000);
    p.recordsSent = true; save();
  }catch(e){}
}
async function loadRecords(){
  const el = $("#records"); if(!el) return;
  const db = await getDb(), user = await getUser();
  if(!db){ el.textContent = "Les records de tous les joueurs s'affichent quand le jeu est ouvert depuis son lien claude.ai."; return; }
  try{
    const snap = await withTimeout(db.collection("records").get(),10000);
    const docs = snap.docs.map(d=>({id:d.id,best:(d.data()||{}).best||{}}));
    const rows = RECORDS.map(r=>{ let top = null; docs.forEach(d=>{ const b = d.best[r.k]; if(b&&typeof b.v==="number"&&(!top||b.v>top.v)) top = {...b,id:d.id}; }); return {r,top}; }).filter(x=>x.top);
    if(!rows.length){ el.textContent = "Aucun record pour l'instant. Termine une carrière pour inscrire le premier !"; return; }
    const ps = user?await user.profiles(rows.map(x=>x.top.id)):{}, me = user?await user.id():null;
    el.innerHTML = `<table class="mini"><tr><th>Record</th><th>Détenteur</th><th>Valeur</th></tr>${rows.map(({r,top})=>`<tr class="${top.id===me?"me":""}"><td>${r.n}</td><td>${esc(ps[top.id]?.name||"Un joueur")}<br><small class="muted">${flag(COUNTRIES[top.country]?top.country:"FR")} ${esc(top.player||"")}</small></td><td><b>${top.v}</b></td></tr>`).join("")}</table>`;
  }catch(e){ el.textContent = "Les records n'ont pas pu être chargés. Réessaie dans un instant."; }
}

/* ============ Emplacements de sauvegarde ============ */
function newCareer(k){ slot = k; draft = {}; createStep(0); }
function viewEnd(k){ slot = k; p = loadSlot(k); migrate(); endScreen(); }
function askDelete(k,btn){
  if(btn.dataset.sure){ wipe(k); home(); return; }
  btn.dataset.sure = "1"; btn.textContent = "Supprimer ?"; btn.classList.add("sure");
  setTimeout(()=>{ if(btn.isConnected){ delete btn.dataset.sure; btn.textContent = "✕"; btn.classList.remove("sure"); } },3000);
}

/* ============ Succès débloqués en direct ============ */
const END_ONLY = ["court","rival","tacticien","dynastie","defi"];
function liveAch(){
  if(!p||p.retired) return;
  const s = careerSummary(), h = loadHof();
  const got = ACH.filter(a=>!END_ONLY.includes(a.id)&&!h.ach[a.id]&&a.t(s));
  if(!got.length) return;
  got.forEach(a=>h.ach[a.id] = p.year+1); saveHof(h);
  p.liveAch = (p.liveAch||[]).concat(got.map(a=>a.id));
  ui.toast = (ui.toast||"")+got.map(a=>`<div class="ach new"><span class="i">${a.i}</span><div><b>Succès débloqué : ${a.n}</b><small>${a.d}</small></div></div>`).join("");
  sfx("trophy");
}

/* ============ Carte joueur en image ============ */
function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function svgImage(svg){
  return new Promise(res=>{ const i = new Image(); i.onload = ()=>res(i); i.onerror = ()=>res(null); i.src = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg.replace("<svg ","<svg xmlns=\"http://www.w3.org/2000/svg\" ")); });
}
async function drawCard(){
  const W = 600, H = 860, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d"), t = careerTotals(), s = careerSummary();
  try{ await document.fonts.load("800 60px 'Barlow Condensed'"); }catch(e){}
  const D = "'Barlow Condensed','Arial Narrow',sans-serif", B = "system-ui,'Segoe UI',sans-serif";
  const tier = p.lvl>=80?["#fff3b8","#e8b923","#9c7206"]:p.lvl>=68?["#f6f8fa","#b9c3cc","#76838f"]:["#f7d6b6","#c27c45","#74411c"];
  const gr = g.createLinearGradient(0,0,W,H); gr.addColorStop(0,tier[0]); gr.addColorStop(.55,tier[1]); gr.addColorStop(1,tier[2]);
  roundRect(g,0,0,W,H,40); g.fillStyle = gr; g.fill();
  g.fillStyle = "#1b1b1b"; g.textBaseline = "alphabetic";
  g.font = `800 132px ${D}`; g.fillText(p.lvl,44,150);
  g.font = `700 40px ${D}`; g.fillText(p.pos,50,198);
  const img = await svgImage(shirt(p.club,shirtNumber(),220)); if(img) g.drawImage(img,W-262,28,220,220);
  let fs = 60; g.font = `800 ${fs}px ${D}`;
  while(g.measureText(p.name.toUpperCase()).width>W-88&&fs>30){ fs -= 2; g.font = `800 ${fs}px ${D}`; }
  g.fillText(p.name.toUpperCase(),44,315);
  g.font = `600 24px ${B}`; g.fillText(`${p.club.name} · ${COUNTRIES[p.country].name} · ${p.age} ans`,44,355);
  g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(44,378,W-88,2);
  const cells = [["Matchs",t.apps],[p.pos==="GB"?"Clean sheets":"Buts",p.pos==="GB"?t.cs:t.g],["Passes déc.",t.a],["Sélections",p.caps],["Trophées",s.trophies],["Ballons d'Étoile",s.stars],["Niveau max",s.peak],["Saisons",p.seasons.length]];
  cells.forEach(([k,v],i)=>{
    const x = 44+(i%2)*(W-88)/2, y = 420+Math.floor(i/2)*56;
    g.fillStyle = "rgba(0,0,0,.65)"; g.font = `600 22px ${B}`; g.fillText(k,x,y);
    g.fillStyle = "#1b1b1b"; g.font = `800 34px ${D}`; g.textAlign = "right"; g.fillText(String(v),x+(W-88)/2-24,y); g.textAlign = "left";
  });
  const S = p.seasons;
  if(S.length>1){
    const x0 = 44, x1 = W-44, y0 = 760, y1 = 660, xs = i=>x0+i*(x1-x0)/(S.length-1), ys = v=>y0-(clamp(v,30,100)-30)/70*(y0-y1);
    g.strokeStyle = "rgba(0,0,0,.8)"; g.lineWidth = 4; g.lineJoin = "round"; g.beginPath();
    S.forEach((q,i)=>i?g.lineTo(xs(i),ys(q.lvl)):g.moveTo(xs(i),ys(q.lvl))); g.stroke();
    g.fillStyle = "rgba(0,0,0,.6)"; g.font = `600 18px ${B}`; g.fillText("Niveau saison par saison",x0,y1-14);
  }
  g.fillStyle = "#1b1b1b"; g.font = `800 30px ${D}`; g.fillText("TRAJECTOIRE",44,H-40);
  g.font = `600 18px ${B}`; g.textAlign = "right"; g.fillText(p.daily?`Défi du jour ${p.daily}`:`${p.retired?"Carrière terminée":"Carrière en cours"}`,W-44,H-44); g.textAlign = "left";
  return cv;
}
async function exportCard(btn){
  const label = btn.textContent; btn.textContent = "Préparation de l'image…";
  const cv = await drawCard();
  const blob = await new Promise(r=>cv.toBlob(r,"image/png"));
  const dl = window.claude?.use?await window.claude.use("downloads").catch(()=>null):null;
  const fn = `trajectoire-${p.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}.png`;
  if(dl&&blob){
    try{ await dl.save({filename:fn,data:blob}); btn.textContent = "✅ Carte enregistrée"; }
    catch(e){ btn.textContent = e?.code==="declined"?"Téléchargement annulé":label; if(e?.code!=="declined") showImage(cv.toDataURL("image/png")); }
    return;
  }
  btn.textContent = label; showImage(cv.toDataURL("image/png"));
}
function showImage(src){
  const div = document.createElement("div");
  div.className = "overlay"; div.onclick = e=>{ if(e.target===div) div.remove(); };
  div.innerHTML = `<div style="max-width:min(380px,100%);text-align:center"><img src="${src}" alt="Carte joueur de ${esc(p.name)}" style="width:100%;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.5)"><p style="color:#fff">Clic droit ou appui long sur l'image pour l'enregistrer.</p><button class="btn" onclick="this.closest('.overlay').remove()">Fermer</button></div>`;
  document.body.appendChild(div);
}

/* ============ Mes stats en cours de carrière ============ */
function statsScreen(){
  const t = careerTotals(), grouped = {};
  p.trophies.forEach(x=>{ const k = x.t.replace(/ \d{4}$/,""); grouped[k] = (grouped[k]||[]).concat(x.y); });
  const avg = p.seasons.length?(p.seasons.reduce((a,s)=>a+ +s.rating,0)/p.seasons.length).toFixed(2):"–";
  render(`<div class="muted">Mes stats · ${p.seasons.length} saison(s)</div>
    <div class="stats"><div class="stat"><b>${t.apps}</b><span>matchs</span></div>${p.pos==="GB"?`<div class="stat"><b>${t.cs}</b><span>clean sheets</span></div>`:`<div class="stat"><b>${t.g}</b><span>buts</span></div>`}<div class="stat"><b>${t.a}</b><span>passes déc.</span></div><div class="stat"><b>${avg}</b><span>note moy.</span></div><div class="stat"><b>${p.caps}</b><span>sélections</span></div><div class="stat"><b>${p.trophies.length}</b><span>trophées</span></div></div>
    <div class="card"><h3>Palmarès</h3>${Object.keys(grouped).length?Object.entries(grouped).map(([k,ys])=>`<div class="trophy">🏆 ${ys.length>1?ys.length+"× ":""}${k} <span class="muted" style="font-weight:400">(${ys.join(", ")})</span></div>`).join(""):'<span class="muted">Pas encore de trophée.</span>'}</div>
    ${p.seasons.length?`<div class="card"><h3>Saison par saison</h3><div class="tablewrap"><table><tr><th>Saison</th><th>Club</th><th>MJ</th><th>${p.pos==="GB"?"CS":"B"}</th><th>PD</th><th>Note</th><th>Cl.</th></tr>${p.seasons.map(s=>`<tr><td>${s.y}</td><td>${crest(s.club,14)} ${esc(s.club)}</td><td>${s.apps}</td><td>${p.pos==="GB"?s.clean:s.goals}</td><td>${s.assists}</td><td>${s.rating}</td><td>${s.rank}${s.tr?" 🏆":""}</td></tr>`).join("")}</table></div></div>`:""}
    <div class="card"><h3>Derniers moments marquants</h3><ul class="log">${p.moments.slice(-12).reverse().map(m=>`<li>${esc(m)}</li>`).join("")}</ul></div>
    <button class="btn primary" onclick="route()">← Retour au jeu</button>`);
}
