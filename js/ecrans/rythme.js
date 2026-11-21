// Trajectoire · Le rythme de la carrière (voir docs/boucle-de-jeu.md) : des grandes saisons qui se jouent en détail,
// et des saisons de transition qui passent vite (deux moments, pas de match de championnat, match clé simulé).
// Chaque saison annonce aussi ses intrigues, et les scènes qui les font avancer sortent en priorité.
// État : p.calm (saison de transition en cours), p.calmRun (transitions d'affilée), p.bigWhy (pourquoi c'est une grande saison).

const paceOn = ()=>!!p&&!p.daily&&!p.friend&&!p.story&&!p.centre;
// pourquoi cette saison compte (null : rien de décisif à l'horizon). Les raisons fortes font toujours une grande
// saison ; les raisons faibles (qui reviennent souvent dans un grand club) seulement après une saison de transition,
// pour qu'une carrière alterne vraiment les temps forts et les respirations.
function bigSeasonWhy(){
  const last = p.seasons.at(-1), a = actOf(p.age);
  if(!last) return "Ta première saison chez les pros.";
  if(last.club!==p.club.name) return `Ta première saison ${auC(p.club.name)}.`;
  if(chapterDeadline()) return "La saison de la dernière chance pour ton chapitre.";
  if(actOf(p.age-1)!==a) return `Un nouveau chapitre commence : ${a.n.toLowerCase()}.`;
  if(p.crewBack&&p.crewBack.length) return "Des retrouvailles t'attendent au vestiaire.";
  if(p.age>=bodyAge()-1) return "Ton corps te le dit : c'est peut-être la dernière.";
  if((p.calmRun||0)>=2) return "Il est temps que quelque chose se passe.";
  if((p.bigRun||0)>=1) return null;
  if(p.cdc) return "La Coupe des Champions t'attend.";
  if((p.year+1)%4===2&&p.caps>0) return "Une année de Coupe du Monde.";
  if(rivalActive()&&p.rival.club.country===p.club.country) return `${p.rival.name} joue dans le même championnat que toi.`;
  if(last.rank<=2) return "L'an dernier, vous vous êtes battus pour le titre.";
  return null;
}
// au début de chaque saison : grande ou de transition
function seasonPace(){
  p.calm = false; p.bigWhy = null;
  if(!paceOn()) return;
  const why = bigSeasonWhy();
  if(why){ p.bigWhy = why; p.calmRun = 0; p.bigRun = (p.bigRun||0)+1; return; }
  p.calm = true; p.calmRun = (p.calmRun||0)+1; p.bigRun = 0; p.calmN = (p.calmN||0)+1; p.evCount = 2;
}
// le joueur préfère jouer cette saison en détail
function playFullSeason(){ p.calm = false; p.calmRun = 0; p.evCount = 3; p.bigWhy = "Tu as choisi de la vivre en détail."; save(); route(); }
// saison de transition : le match clé se joue sans toi à l'écran (mêmes décisions que la saison rapide)
function calmMatch(){
  const so = soundOn; soundOn = false; ui.quick = true;
  try{
    let guard = 0;
    while(guard++<60&&p.phase==="match"&&p.match){
      const m = p.match;
      if(m.awaitTactic) setTactic(m.us>m.them?"def":m.us<m.them?"att":"eq");
      else if(m.talk) matchTalk(bestTalk(m));
      else if(m.pending) matchNext();
      else { const a = matchActions()[m.tpl[m.step]]; let bi = 0, bv = -1; a.o.forEach((o,i)=>{ const q = o.p+talentBonus(o.t); if(q>bv){ bv = q; bi = i; } }); matchPick(bi); }
    }
  } finally { soundOn = so; ui.quick = false; }
  if(p.last) p.last.calm = true;
  if(typeof document!=="undefined"&&document.querySelectorAll) document.querySelectorAll(".confetti").forEach(x=>x.remove());
}
// un match clé à enjeu se joue toujours, même dans une saison de transition
function bigMatch(m){
  if(!m) return false;
  const big = m.type!=="derby"||!!m.stake;
  if(big&&p.calm) m.log.unshift("🔥 La saison a été calme, mais ce match-là, tout le monde l'attendait.");
  return big;
}
// l'écran d'avant-saison : grande saison (et pourquoi) ou saison de transition (et le bouton pour la jouer quand même)
function paceCard(){
  if(!paceOn()) return "";
  const th = seasonThreads();
  const threads = th.length?`<ul class="threads">${th.map(x=>`<li>${x}</li>`).join("")}</ul>`:"";
  if(p.calm) return `<div class="card pace calm"><span class="pace-k">⏩ Saison de transition</span><p>Rien de décisif à l'horizon : cette saison passe vite. Deux moments, puis le match clé se joue sans toi à l'écran.</p>${threads}
    <button class="btn ghost" onclick="playFullSeason()">Vivre cette saison en détail<small>Trois moments, les matchs de championnat et le match clé à jouer</small></button></div>`;
  return `<div class="card pace big"><span class="pace-k">🔥 Grande saison</span><p>${esc(p.bigWhy||"")}</p>${threads}</div>`;
}

/* ============ Les intrigues de la saison ============ */
function seasonThreads(){
  const out = [];
  if(rivalActive()){ const h = p.rival.h2h||{w:0,d:0,l:0}; out.push(`⚔️ <b>${esc(p.rival.name)}</b> · face à face ${h.w}-${h.d}-${h.l}${p.rival.club.name===p.club.name?" · dans ton propre vestiaire":""}`); }
  const cw = typeof crew==="function"?crew():[];
  for(const x of cw){
    const n = `<b>${esc(x.n)}</b>`;
    if(x.role==="capitaine"&&x.age>=33&&!x.mem.adieu) out.push(`©️ ${n}, ton capitaine, approche de la fin. Il cherche à qui confier le brassard.`);
    else if(x.role==="capitaine"&&!x.mem.repas) out.push(`©️ ${n}, le capitaine, observe comment tu t'intègres au groupe.`);
    else if(x.role==="mentor"&&!x.mem.seances) out.push(`🧓 ${n}, le vétéran, t'a à l'œil.`);
    else if(x.role==="mentor"&&x.age>=35&&!x.mem.crampons) out.push(`🧓 ${n} dispute sa dernière saison.`);
    else if(x.role==="jeune"&&!x.mem.aide) out.push(`🌱 ${n}, le gamin du centre, a du mal à trouver sa place.`);
    else if(x.role==="jeune"&&x.age>=21&&x.mem.aide==="oui"&&!x.mem.envol) out.push(`🌱 ${n} est en train d'exploser.`);
  }
  if(p.protege&&p.protege.club===p.club.name) out.push(`🌱 <b>${esc(p.protege.name)}</b>, ton protégé, grandit à côté de toi.`);
  return out.slice(0,3);
}
// dans le tirage des moments : les scènes qui font avancer une intrigue en cours sortent plus souvent
function threadBoost(e){
  if(!paceOn()) return 1;
  const id = e.id;
  if(/^eq[A-Z]/.test(id)) return 3;
  if(/^(ch|act)[A-Z]/.test(id)) return 2;
  if(/^rival/.test(id)&&rivalActive()) return 2;
  if(/^protege/i.test(id)&&p.protege) return 1.6;
  return 1;
}
