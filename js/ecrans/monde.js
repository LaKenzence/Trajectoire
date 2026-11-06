// Trajectoire · Un monde qui bouge : réputation dans chaque club, clubs qui montent et s'effondrent,
// légendes des carrières passées qui reviennent, titre de carrière et unes de journal
/* ============ Réputation dans chaque club ============ */
// p.clubRep : {nom du club: {rep, seasons, left}} ; rep monte avec les saisons et les trophées, baisse selon la façon de partir
function clubSeason(c,trophies,rating){
  const r = (p.clubRep = p.clubRep||{})[c.name] = p.clubRep[c.name]||{rep:0,seasons:0,left:null};
  r.seasons++; r.rep += 1+trophies*2+(+rating>=7?1:0);
}
function clubLeave(from,to,underContract){
  const r = (p.clubRep||{})[from.name];
  if(!r) return;
  r.left = p.year;
  if(r.seasons>=6) r.rep += 3;                        // un fidèle qui s'en va reste aimé
  if(underContract) r.rep -= to.country===from.country?5:2;   // partir chez un concurrent du pays, c'est trahir
  else if(r.seasons<=2) r.rep -= 1;
}
// les anciens clubs (hors club actuel), du plus aimé au plus détesté
function formerClubs(){
  return Object.entries(p.clubRep||{}).filter(([n,r])=>n!==p.club.name&&r.left).map(([n,r])=>({name:n,...r})).sort((a,b)=>b.rep-a.rep);
}
const lovedClub = ()=>formerClubs().find(c=>c.rep>=6)||null;
const hatedClub = ()=>[...formerClubs()].reverse().find(c=>c.rep<=-2)||null;
// en fin de carrière, un ancien club qui t'aime peut te proposer de revenir
function homecomingOffer(){
  if(p.age<30||!chance(.45)) return null;
  const l = lovedClub(), c = l&&CLUBS.find(x=>x.name===l.name);
  if(!c||!clubAllowed(c)) return null;
  return {club:c,years:RI(1,2),salary:Math.round(Math.pow(Math.max(c.str-35,5),2)*.9*(1+p.rep/80)),loan:false,home:true};
}

/* ============ Clubs qui montent et qui s'effondrent ============ */
// p.world : écart de force de chaque club par rapport à sa force d'origine, pour toute la carrière
function applyWorld(){
  for(const c of CLUBS){ if(c.base==null) c.base = c.str; c.str = clamp(c.base+((p&&p.world||{})[c.name]||0),40,95); }
}
function worldShift(){
  const w = p.world = p.world||{}, news = [];
  const bump = (c,d)=>{ w[c.name] = clamp((w[c.name]||0)+d,-18,18); };
  // un rachat par un fonds richissime
  const up = pick(CLUBS.filter(c=>c.str<=72&&c.name!==p.club.name));
  if(up&&chance(.6)){ bump(up,RI(5,9)); news.push(`Rachat XXL : un fonds richissime reprend le ${up.name} et promet de le mener au sommet.`); }
  // une chute : dette, descente, scandale
  const down = pick(CLUBS.filter(c=>c.str>=72&&c.name!==p.club.name));
  if(down&&chance(.5)){ bump(down,-RI(5,9)); news.push(pick([`Le ${down.name}, criblé de dettes, doit vendre ses meilleurs joueurs.`,`Scandale financier : le ${down.name} écope d'une lourde sanction.`,`Le ${down.name} s'effondre : sa direction démissionne en bloc.`])); }
  // le reste du monde bouge un peu, et les écarts se résorbent lentement
  for(const c of shuffle(CLUBS).slice(0,8)) bump(c,RI(-2,2));
  for(const k in w) if(w[k]) w[k] -= Math.sign(w[k]);
  // ton propre club
  if(chance(.12)){ const d = chance(.5)?RI(3,6):-RI(3,6); bump(p.club,d); news.push(d>0?`Ton club, le ${p.club.name}, investit massivement cet été.`:`Ton club, le ${p.club.name}, traverse une crise financière.`); }
  applyWorld();
  const mine = CLUBS.find(c=>c.name===p.club.name); if(mine) p.club.str = mine.str;
  return news;
}

/* ============ Légendes des carrières passées ============ */
// à la création, une ancienne carrière du Panthéon et un ancien rival peuvent revenir dans le monde du nouveau joueur
function pickLegends(){
  if(p.daily||p.friend) return;
  const h = loadHof(), old = h.careers.filter(c=>c.name!==p.name);
  if(old.length) p.legend = {...pick(old.slice(0,10))};
  const rv = (h.rivals||[]).filter(r=>r.name!==p.name);
  if(rv.length) p.oldRival = {...pick(rv)};
}
function recordRival(h){
  if(!p.rival) return;
  h.rivals = (h.rivals||[]).filter(r=>r.name!==p.rival.name).concat({name:p.rival.name,country:p.rival.country,by:p.name,won:rivalScore()<0}).slice(-10);
}

/* ============ Titre de carrière ============ */
// le premier titre qui correspond est le titre principal ; les autres sont aussi gagnés et rangés au Panthéon
const TITLES = [
  {id:"legende",n:"La Légende",d:"Au moins deux Ballons d'Étoile",t:s=>s.stars>=2},
  {id:"fidele",n:"Le Fidèle",d:"12 saisons dans le même club",t:s=>s.loyal>=12},
  {id:"lion",n:"Le Vieux Lion",d:"Encore sur le terrain à 38 ans (40 pour un gardien)",t:s=>s.age>=(p.pos==="GB"?40:38)},
  {id:"filante",n:"L'Étoile filante",d:"Raccrocher avant 33 ans",t:s=>s.age<33},
  {id:"batisseur",n:"Le Bâtisseur",d:"Propriétaire d'un club ou sauveur de son club formateur",t:s=>s.builder},
  {id:"showman",n:"Le Showman",d:"Une star des réseaux avec une réputation maximale",t:s=>s.influ&&s.rep>=85},
  {id:"gache",n:"Le Talent gâché",d:"Finir 10 points sous son potentiel",t:s=>s.pot-s.peak>=10},
  {id:"mercenaire",n:"Le Mercenaire",d:"6 clubs ou plus",t:s=>s.clubs>=6},
  {id:"globe",n:"Le Globe-trotter",d:"Jouer dans 4 pays différents",t:s=>s.countries>=4},
  {id:"second",n:"L'Éternel second",d:"Classe mondiale, sans Ballon d'Étoile, et une rivalité perdue",t:s=>!s.stars&&s.peak>=86&&!s.rivalWon},
  {id:"famille",n:"Le Père de famille",d:"Marié et trois enfants",t:s=>s.married&&s.kids>=3},
  {id:"conquerant",n:"Le Conquérant",d:"Deux Coupes des Champions et un Championnat du Monde",t:s=>s.cdcN>=2&&s.world},
  {id:"heros",n:"Le Héros national",d:"100 sélections et un titre international",t:s=>s.caps>=100&&s.intl},
  {id:"grandsSoirs",n:"L'Homme des grands soirs",d:"3 finales gagnées en direct",t:s=>s.finals>=3},
  {id:"capitaine",n:"Le Capitaine",d:"Finir sa carrière avec le brassard",t:s=>s.cap},
  {id:"discret",n:"Le Discret",d:"15 saisons loin des projecteurs",t:s=>s.seasons>=15&&s.rep<40},
  {id:"travailleur",n:"Le Travailleur",d:"Une carrière honnête, gagnée à la sueur",t:()=>true}
];
function titleStats(){
  const s = careerSummary();
  return {...s,cdcN:p.trophies.filter(t=>t.t==="Coupe des Champions").length,intl:p.trophies.some(t=>/^(Championnat du Monde|Coupe Continentale)/.test(t.t)),countries:new Set(p.seasons.map(x=>x.cc)).size,
    builder:!!(p.flags.investi||p.moments.some(m=>/de la faillite/.test(m))),influ:!!p.flags.influ,rep:p.rep,cap:!!p.flags.cap,pot:p.pot,seasons:p.seasons.length};
}
function careerTitles(){ const s = titleStats(); return TITLES.filter(t=>t.t(s)); }
function titleCard(){
  const all = careerTitles(), main = all[0], h = loadHof(), got = Object.keys(h.titles||{}).length;
  return `<div class="card title-card"><span class="muted">Titre de carrière</span><h2>« ${main.n} »</h2><p class="muted" style="margin:0">${main.d}</p>
    ${all.length>2?`<p style="margin:8px 0 0">Aussi : ${all.slice(1,-1).map(t=>`<span class="tag">${t.n}</span>`).join("")}</p>`:""}
    <p class="muted" style="margin:8px 0 0;font-size:.8rem">${got}/${TITLES.length} titres obtenus en tout, à retrouver au Panthéon.</p></div>`;
}
function recordTitles(h){
  h.titles = h.titles||{};
  for(const t of careerTitles()) if(!h.titles[t.id]) h.titles[t.id] = p.name;
}
function titlesHof(h){
  const t = h.titles||{};
  return `<div class="card"><h3>Titres de carrière · ${Object.keys(t).length}/${TITLES.length}</h3>
    ${TITLES.map(x=>`<div class="ach ${t[x.id]?"":"off"}"><span class="i">${t[x.id]?"🏅":"🔒"}</span><div><b>${x.n}</b><small>${x.d}${t[x.id]?` · ${esc(t[x.id])}`:""}</small></div></div>`).join("")}</div>`;
}

/* ============ Unes de journal ============ */
const PAPERS = ["Le Quotidien du Ballon","Planète Foot","L'Écho des Stades","Le Matin Sportif"];
const une = (title,sub,year)=>`<div class="paper une"><div class="mast"><span>${pick(PAPERS)}</span><span>${year}</span></div><h3>${esc(title)}</h3>${sub?`<p>${esc(sub)}</p>`:""}</div>`;
// les moments qui méritent la une, du plus fort au plus anecdotique
const BIG = /Ballon d'Étoile|Coupe des Champions|Championnat du Monde|Coupe Continentale|historique|légende|Remontada|record|gardien|refuse un géant|clause|faillite|monte de division/i;
function bigMoments(){
  const m = p.moments.map(x=>{ const [y,...t] = x.split(" · "); return {y,t:t.join(" · ")}; }).filter(x=>x.t);
  const big = m.filter(x=>BIG.test(x.t));
  return (big.length?big:m.slice(-3)).slice(-4);
}
function unesCard(){
  const m = bigMoments();
  return m.length?`<div class="card"><h3>📰 Tes unes</h3><div class="unes">${m.map(x=>une(x.t,"",x.y)).join("")}</div></div>`:"";
}
