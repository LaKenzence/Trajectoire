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
  if(big&&p.calm) m.log.unshift("🔥 "+pick(["La saison a été calme, mais ce match-là, tout le monde l'attendait.","Une saison sans relief, jusqu'à ce soir. Ce match-là, personne ne veut le rater.","Tout le reste était un échauffement. Le vrai rendez-vous de la saison, c'est maintenant."]));
  return big;
}
// l'écran d'avant-saison : grande saison (et pourquoi) ou saison de transition (et le bouton pour la jouer quand même)
function paceCard(){
  if(!paceOn()) return "";
  const th = seasonThreads();
  const threads = th.length?`<ul class="threads">${th.map(x=>`<li>${x}</li>`).join("")}</ul>`:"";
  if(p.calm) return `<div class="card pace calm"><span class="pace-k">⏩ Saison de transition</span><p>Rien de décisif à l'horizon : cette saison passe vite. Deux moments, puis le match clé se joue sans toi à l'écran.</p>${threads}
    ${projectCard()}<button class="btn ghost" onclick="playFullSeason()">Vivre cette saison en détail<small>Trois moments, les matchs de championnat et le match clé à jouer</small></button></div>`;
  return `<div class="card pace big"><span class="pace-k">🔥 Grande saison</span><p>${esc(p.bigWhy||"")}</p>${threads}</div>`;
}

/* ============ Les intrigues de la saison ============ */
function seasonThreads(){
  const out = [];
  if(rivalActive()){ const h = p.rival.h2h||{w:0,d:0,l:0}; out.push(`⚔️ <b>${esc(p.rival.name)}</b> · face à face ${h.w}-${h.d}-${h.l}${p.rival.club.name===p.club.name?" · dans ton propre vestiaire":""}`); }
  const cw = typeof crew==="function"?crew():[];
  for(const x of cw){
    const n = `<b>${esc(x.n)}</b>`;
    if(x.role==="capitaine"&&x.age>=33&&!x.mem.adieu) out.push(`©️ ${n}, ton capitaine, approche de la fin. ${["Il cherche à qui confier le brassard.","Il te regarde de plus en plus souvent à l'entraînement.","Dans le vestiaire, on se demande qui portera le brassard après lui."][p.year%3]}`);
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

/* ============ Le projet d'une saison de transition ============ */
// Une saison calme n'est pas une saison vide : avant la reprise, le joueur se fixe un chantier personnel. Il ne
// change rien au terrain pendant la saison ; il paie au bilan (qualités, confiance du coach, réputation, diplôme…).
// État : p.project = {id, y}.
const PROJECTS = {
  poste:{i:"🔁",n:"Apprendre un second poste",d:"Le coach adore les joueurs polyvalents",ok:()=>p.pos!=="GB",
    end:()=>{ const q = ensureQuals(); q.tec = clamp(q.tec+3,20,99); return {t:"Tu peux dépanner à un autre poste. Le coach t'appelle « mon couteau suisse ».",fx:{trust:6}}; }},
  pied:{i:"🎯",n:"Travailler ton mauvais pied",d:"Une heure de plus, chaque jour, contre un mur",ok:()=>true,
    end:()=>{ const q = ensureQuals(); q.tec = clamp(q.tec+4,20,99); q.sig = clamp(q.sig+2,20,99); return {t:"Ton mauvais pied n'en est plus vraiment un. Les défenseurs ne savent plus de quel côté te fermer.",fx:{}}; }},
  corps:{i:"💪",n:"Prendre soin de ton corps",d:"Nutritionniste, sommeil, cryothérapie",ok:()=>p.age>=27,
    end:()=>{ const q = ensureQuals(); q.phy = clamp(q.phy+4,20,99); return {t:"Ton corps te remercie. Le préparateur parle d'un « âge physique de 25 ans ».",fx:{form:8}}; }},
  gamin:{i:"🌱",n:"Parrainer un gamin du centre",d:"Un jeune de 17 ans te suivra toute la saison",ok:()=>p.age>=25&&!p.protege,
    start:()=>{ p.protege = {name:pick(FIRST)+" "+pick(LAST),age:17,lvl:RI(55,62),pot:RI(80,92),club:p.club.name}; },
    end:()=>{ const q = ensureQuals(); q.lea = clamp(q.lea+4,20,99); return {t:`${p.protege?.name||"Ton filleul"} a signé son premier contrat pro. Il t'a offert le maillot de ses débuts.`,fx:{rep:3,moral:5}}; }},
  langue:{i:"🌍",n:"Apprendre la langue du pays",d:"Des cours le soir, et la télé locale sans sous-titres",ok:()=>p.club.country!==p.country,
    end:()=>({t:"Tu fais rire tout le vestiaire avec ton accent, mais on te comprend. Tu n'es plus l'étranger du groupe.",fx:{moral:6,trust:4}})},
  image:{i:"📸",n:"Soigner ton image",d:"Un attaché de presse, des interviews choisies",ok:()=>p.rep>=25,
    end:()=>({t:"Les journalistes parlent de toi autrement. Tu es devenu « un bon client ».",fx:{rep:6}})},
  diplome:{i:"📋",n:"Diplômes d'entraîneur",d:"Des cours le lundi, pour préparer l'après",ok:()=>p.age>=28&&!p.flags.diplome,
    end:()=>{ p.flags.diplome = true; p.moments.push(`${p.year+1} · Obtient son diplôme d'entraîneur`); return {t:"Diplôme en poche. Le jour où tu raccrocheras, un banc t'attendra peut-être.",fx:{moral:3}}; }},
  video:{i:"📊",n:"Séances vidéo",d:"Chaque lundi avec l'analyste du club",ok:()=>true,
    end:()=>{ const q = ensureQuals(); q.men = clamp(q.men+3,20,99); return {t:"Tu lis le jeu une seconde avant les autres. L'analyste dit que tu es son meilleur élève.",fx:{trust:4}}; }},
  mental:{i:"🧠",n:"Préparation mentale",d:"Respiration, visualisation, gestion de la pression",ok:()=>true,
    end:()=>{ const q = ensureQuals(); q.men = clamp(q.men+4,20,99); return {t:"Les grands soirs ne te font plus trembler. Tu dors même la veille des derbys.",fx:{moral:5}}; }},
  affaires:{i:"💼",n:"Préparer tes affaires",d:"Un conseiller, des placements, un projet de restaurant",ok:()=>p.money>=200,
    end:()=>({t:"Tes placements rapportent. Ton restaurant ouvre au printemps, ton nom en lettres dorées sur la façade.",fx:{money:Math.round(clamp(p.money*.08,40,600))}})}
};
// trois chantiers proposés, toujours les mêmes pour une saison donnée
function projectChoices(){
  const ok = Object.keys(PROJECTS).filter(k=>PROJECTS[k].ok());
  return ok.map(k=>({k,h:hashStr(k+p.year+p.name)})).sort((a,b)=>a.h-b.h).slice(0,3).map(x=>x.k);
}
function setProject(k){
  const P = PROJECTS[k]; if(!P) return;
  p.project = {id:k,y:p.year};
  if(P.start) P.start();
  save(); route();
}
function projectCard(){
  if(!p.calm||!paceOn()) return "";
  const cur = p.project&&p.project.y===p.year?PROJECTS[p.project.id]:null;
  if(cur) return `<p class="proj-now">${cur.i} Projet de la saison : <b>${esc(cur.n)}</b>. Le résultat tombera au bilan.</p>`;
  return `<div class="proj-pick"><p><b>🎯 Ton projet pour cette saison calme</b><br><small class="muted">Un chantier perso, qui paie au bilan. Facultatif.</small></p>
    ${projectChoices().map(k=>{ const P = PROJECTS[k]; return `<button class="btn" onclick="setProject('${k}')">${P.i} ${esc(P.n)}<small>${esc(P.d)}</small></button>`; }).join("")}</div>`;
}
// au bilan : le projet de la saison paie (à appeler après la mise à jour des jauges de fin de saison)
function projectEnd(){
  const pr = p.project; if(!pr||pr.y!==p.year) return null;
  const P = PROJECTS[pr.id]; p.project = null; if(!P) return null;
  const q0 = {...ensureQuals()}, r = P.end(), q1 = ensureQuals();
  const dq = Object.keys(q1).filter(k=>q1[k]!==q0[k]).map(k=>({k:qualName(k),v:q1[k]-q0[k]}));
  return {n:P.n,i:P.i,t:r.t,d:dq.concat(applyFx(r.fx))};
}
