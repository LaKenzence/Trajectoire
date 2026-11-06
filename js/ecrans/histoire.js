// Trajectoire · Défi de la semaine (une contrainte, un classement) et mode Histoire (une carrière racontée en 5 chapitres)
/* ============ Défi de la semaine ============ */
// il réutilise le défi du jour : p.daily porte la clé de la semaine (« S2026-45 ») et le même classement partagé
const trophyAge = t=>p.seasons.find(s=>+s.y.slice(0,4)===t.y-1)?.age??p.age;
const WEEKLY = [
  {id:"gbPrecoce",n:"Gardien précoce",d:"Gardien : être champion avant 22 ans",pos:"GB",t:()=>p.trophies.some(t=>t.t.startsWith("Champion –")&&trophyAge(t)<22)},
  {id:"buteurFou",n:"Buteur fou",d:"Attaquant : une saison à 40 buts",pos:"ATT",t:()=>p.seasons.some(s=>s.goals>=40)},
  {id:"uneVie",n:"Une vie, un club",d:"15 saisons dans le même club",t:()=>careerSummary().loyal>=15},
  {id:"tourEurope",n:"Conquérant",d:"Être champion dans 2 pays différents",t:()=>careerSummary().leagues>=2},
  {id:"muraille",n:"La muraille",d:"Défenseur : 80 sélections",pos:"DEF",t:()=>p.caps>=80},
  {id:"chefOrchestre",n:"Chef d'orchestre",d:"Milieu : remporter un Ballon d'Étoile",pos:"MIL",t:()=>careerSummary().stars>=1},
  {id:"jeuneGraal",n:"Jeune et sacré",d:"Gagner la Coupe des Champions avant 24 ans",t:()=>p.trophies.some(t=>t.t==="Coupe des Champions"&&trophyAge(t)<24)},
  {id:"globeSemaine",n:"Globe-trotter",d:"Jouer dans 4 pays différents",t:()=>new Set(p.seasons.map(s=>s.cc)).size>=4}
];
function weekKey(){
  const d = new Date(), j = new Date(d.getFullYear(),0,1);
  return `S${d.getFullYear()}-${String(Math.ceil(((+d-+j)/864e5+j.getDay()+1)/7)).padStart(2,"0")}`;
}
const weeklyOf = k=>{ let h = 0; for(const ch of k) h = (h*31+ch.charCodeAt(0))>>>0; return WEEKLY[h%WEEKLY.length]; };
const weeklyDone = ()=>!!p.weekly&&!!WEEKLY.find(w=>w.id===p.weekly)?.t();
function weeklyDraft(){
  const k = weekKey(), w = weeklyOf(k); seedRng("trajectoire:"+k);
  const K = o=>pick(Object.keys(o));
  const o = {look:randomLook(),name:pick(FIRST)+" "+pick(LAST),country:K(COUNTRIES),pos:w.pos||K(POS),trait:K(TRAITS),origin:K(ORIGINS),ent:K(ENTOURAGES),life:K(LIFESTYLES),daily:k};
  unseed(); return {o,w};
}
function startWeekly(){
  slot = "semaine";
  const {o,w} = weeklyDraft();
  seedRng("trajectoire:"+o.daily+":joueur");
  newPlayer(o); p.weekly = w.id; save();
  seedRng(o.daily+":0");
  route();
}
function weeklyScreen(){
  p = null; unseed();
  const {o,w} = weeklyDraft(), saved = loadSlot("semaine");
  const inProgress = saved&&saved.daily===o.daily&&!saved.after;
  $("#app").innerHTML = `<div class="fade" style="padding-top:20px">
    <div class="muted">Défi de la semaine · ${o.daily}</div><h1><span class="emo" aria-hidden="true">🎯</span> ${w.n}</h1>
    <p class="story">Toute la semaine, tout le monde part du même joueur avec le même objectif : <b>${w.d}</b>. Réussir l'objectif rapporte 150 points de plus au classement.</p>
    <div class="card"><h3>${flag(o.country)} ${esc(o.name)}</h3>
      <div>${[POS[o.pos].n,TRAITS[o.trait].n,ORIGINS[o.origin].n,ENTOURAGES[o.ent].n,LIFESTYLES[o.life].n].map(x=>`<span class="tag">${x}</span>`).join("")}</div></div>
    ${inProgress?`<button class="btn primary" onclick="resume('semaine')">Reprendre ton défi de la semaine<small>${saved.age} ans · ${esc(saved.club.name)}</small></button>`:""}
    <button class="btn ${inProgress?"":"primary"}" onclick="slot='semaine';wipe();startWeekly()">${inProgress?"Recommencer le défi":"Jouer le défi de la semaine"}</button>
    <div class="card"><h3>🏁 Classement de la semaine</h3><div class="lb muted">Chargement…</div></div>
    <button class="btn ghost" onclick="home()">← Accueil</button></div>`;
  renderBoard(o.daily,$(".lb"));
  window.scrollTo(0,0);
}

/* ============ Mode Histoire ============ */
// une carrière écrite d'avance dans ses grandes lignes : chaque chapitre a un objectif, et un récit quand il se termine
const STORY = [
  {n:"Le gamin du quartier",goal:"Devenir titulaire (25 matchs dans une saison) avant 21 ans",until:21,t:()=>p.seasons.some(s=>s.apps>=25),
    win:"Le gamin qui jouait contre le mur de l'immeuble est devenu titulaire. Ta mère a encadré ta première feuille de match.",
    miss:"Le temps de jeu n'est pas venu aussi vite que prévu. Mais les grands joueurs ne sont pas toujours les plus précoces."},
  {n:"Le premier trophée",goal:"Remporter un trophée avant 26 ans",until:26,t:()=>p.trophies.length>=1,
    win:"Ton premier trophée. Tu l'as gardé dans tes bras toute la nuit, dans le bus, puis dans ton lit.",
    miss:"Pas encore de trophée. Ton coach te répète : « Les titres viendront à ceux qui restent debout. »"},
  {n:"Le maillot du pays",goal:"Atteindre 10 sélections avant 29 ans",until:29,t:()=>p.caps>=10,
    win:"Dix fois, tu as chanté l'hymne avec le maillot de ton pays sur le dos. Ton quartier a peint une fresque à ton effigie.",
    miss:"La sélection ne t'a pas assez appelé. Tu as appris à briller pour ton club, et pour les tiens."},
  {n:"La nuit des étoiles",goal:"Atteindre un niveau de 84 avant 32 ans",until:32,t:()=>Math.max(p.lvl,...p.seasons.map(s=>s.lvl))>=84,
    win:"Tu fais partie des meilleurs joueurs du monde. Dans les cours d'école, des gamins portent ton nom dans le dos.",
    miss:"Tu n'as pas touché les étoiles. Mais ta carrière vaut mieux que bien des rêves."},
  {n:"Les adieux",goal:"Terminer ta carrière",until:99,t:()=>!!p.retired,
    win:"Le dernier coup de sifflet. Le stade chante ton nom une dernière fois. L'histoire est écrite : c'est la tienne.",miss:""}
];
const STORY_KEY = "trajectoire_histoire";
const storyBest = ()=>{ try{ return +(localStorage.getItem(STORY_KEY)||0); }catch(e){ return 0; } };
function startStory(){
  slot = "histoire"; wipe();
  newPlayer({name:"Noah Diallo",country:"FR",pos:"MIL",trait:"tech",origin:"quartier",ent:"parent",life:"pro",look:randomLook()});
  p.story = {ch:0,log:[]}; p.moments.push(`${p.year} · Chapitre 1 : ${STORY[0].n}`);
  save(); route();
}
// fin de saison : le chapitre en cours est réussi, ou son délai est passé ; le récit s'affiche dans le bilan
function storyCheck(){
  const s = p.story; if(!s||s.ch>=STORY.length) return;
  const c = STORY[s.ch], ok = c.t();
  if(!ok&&p.age<c.until) return;
  s.log.push({ch:s.ch,ok,y:p.year});
  s.news = {n:c.n,ok,txt:ok?c.win:c.miss,next:STORY[s.ch+1]||null};
  s.ch++;
  if(STORY[s.ch]) p.moments.push(`${p.year} · Chapitre ${s.ch+1} : ${STORY[s.ch].n}`);
  try{ if(s.ch>storyBest()) localStorage.setItem(STORY_KEY,String(s.ch)); }catch(e){}
}
function storyCard(){
  const s = p.story; if(!s) return "";
  const n = s.news; s.news = null;
  const cur = STORY[s.ch];
  return `<div class="card story-card">${n?`<span class="muted">Chapitre ${s.ch} ${n.ok?"terminé":"refermé"}</span><h3>${n.ok?"📖":"⏳"} ${n.n}</h3><p class="story">${n.txt}</p>`:""}
    ${cur?`<p style="margin:0"><b>Chapitre ${s.ch+1} · ${cur.n}</b><br><span class="muted">${cur.goal}</span></p>`:""}</div>`;
}
function storyEndCard(){
  const s = p.story; if(!s) return "";
  // à la retraite, les chapitres restants se referment : réussis si leur objectif est atteint, sinon manqués
  if(p.retired&&s.ch<STORY.length){
    for(; s.ch<STORY.length; s.ch++) s.log.push({ch:s.ch,ok:STORY[s.ch].t(),y:p.year});
    save();
  }
  const ok = s.log.filter(l=>l.ok&&l.ch<STORY.length-1).length;
  return `<div class="card story-card"><span class="muted">Mode Histoire · ${ok}/${STORY.length-1} chapitres réussis</span><h3>📖 ${STORY.at(-1).n}</h3><p class="story">${STORY.at(-1).win}</p>
    <ul class="log">${s.log.filter(l=>l.ch<STORY.length-1).map(l=>`<li>${l.ok?"✅":"⏳"} Chapitre ${l.ch+1} · ${STORY[l.ch].n}${l.ok?"":" (manqué)"}</li>`).join("")}</ul></div>`;
}
function storyHome(){
  const saved = loadSlot("histoire"), live = saved&&saved.story&&!(saved.retired&&saved.after);
  p = null;
  $("#app").innerHTML = `<div class="fade" style="padding-top:20px">
    <div class="muted">Mode Histoire</div><h1><span class="emo" aria-hidden="true">📖</span> La trajectoire de Noah Diallo</h1>
    <img class="story-cover" src="img/histoire.webp" alt="Un joueur en maillot bleu frappe le ballon, sous un ciel étoilé au-dessus du stade" width="620" height="827">
    <p class="story">Un milieu de terrain né dans un quartier populaire, élevé par son père. Cinq chapitres, de ses 16 ans à ses adieux. Les grandes étapes sont écrites, à toi de remplir les pages.</p>
    <div class="card">${STORY.map((c,i)=>`<div class="ach ${i<=storyBest()?"":"off"}"><span class="i">${i<storyBest()?"✅":i===storyBest()?"📖":"🔒"}</span><div><b>Chapitre ${i+1} · ${c.n}</b><small>${c.goal}</small></div></div>`).join("")}</div>
    ${live?`<button class="btn primary" onclick="resume('histoire')">Reprendre l'histoire<small>${saved.age} ans · chapitre ${Math.min(saved.story.ch+1,STORY.length)}</small></button>`:""}
    <button class="btn ${live?"":"primary"}" onclick="startStory()">${live?"Recommencer l'histoire":"Commencer l'histoire"}</button>
    <button class="btn ghost" onclick="home()">← Accueil</button></div>`;
  window.scrollTo(0,0);
}
