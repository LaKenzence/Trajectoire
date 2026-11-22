// Trajectoire · Matchs de saison : un ou deux moments joués en cours de saison, en dehors du match clé.
// Ils réutilisent le moteur du match clé (actions, dialogues, mini-terrain) le temps d'une seule action.
// Chaque but ou passe compte dans le bilan de la saison ; la performance pèse un peu sur le temps de jeu.

// après un événement : un match de saison se glisse parfois avant le suivant
function ordinaryWanted(){
  if(p.retired||p.phase!=="event"||p.evIdx>=p.evCount) return false;
  if(p.lvl<p.club.str-9&&p.age>=18) return false; // remplaçant : pas de temps de jeu à jouer
  if(cdcNightWanted()) return true; // les soirées européennes se jouent même pendant une saison de transition
  if(p.calm) return false;
  return p.evIdx===1?chance(.65):p.evIdx===2?chance(.4):false;
}
function startOrdinary(){
  const night = cdcNightWanted(); if(night) return startCdcNight(night);
  const c = p.club, lg = CLUBS.filter(x=>x.country===c.country&&x.name!==c.name);
  const cup = chance(.25), small = lg.filter(x=>x.str<c.str-6);
  // ton ancien protégé joue dans un club du même championnat : il arrive qu'il soit en face
  const pc = protegeClub(), meet = !!pc&&chance(.45);
  const opp = meet?pc:cup&&small.length?pick(small):pick(lg);
  const home = chance(.5), day = p.evIdx===1?RI(6,15):RI(18,32);
  const title = `${cup?"Coupe nationale":`${day}e journée`} · ${home?"à domicile":"à l'extérieur"} face ${auC(opp.name)}`;
  const min = RI(20,86);
  const m = p.match = {type:"ordinaire",short:true,cup,title,usStr:c.str+(home?2:-2),weather:pick(WEATHER),crowd:Math.round(c.str*(home?560:420)*R(.6,1)),
    opp:{...opp},us:0,them:0,step:0,mins:[min],tpl:[],log:[],myG:0,myA:0,perf:0,pending:null,calm:false,talk:null,protege:false};
  if(meet){ m.protege = true; m.log.push(`🌱 ${esc(p.protege.name)}, ton ancien protégé, est titulaire en face.`); }
  m.tpl = [freshOrder(matchActions().length)[0]];
  if(typeof crewMatchMood==="function") crewMatchMood(m);
  simGap(0,min);
  if(meet||chance(.35)) m.talk = pickTalk(m);
  p.phase = "ordinaire";
}
function ordinaryScreen(){
  const m = p.match;
  let body;
  if(m.talk) body = talkHtml(m);
  else if(m.pending) body = `<p class="story">${m.pending}</p><button class="btn primary" onclick="matchNext()">Fin du match →</button>`;
  else {
    const a = matchActions()[m.tpl[0]];
    if(m.sitStep!==0){ m.sit = situ(m,m.mins[0]); m.sitStep = 0; }
    body = `<p><span class="minute">${m.mins[0]}'</span></p><p class="story">${m.sit||""}${a.txt}</p>
      ${(()=>{ const best = bestOpt(a.o); return a.o.map((o,i)=>{ const q = o.p+talentBonus(o.t); return `<button class="btn" onclick="matchPick(${i})">${choiceLead(o.t,i)}<span class="ctext">${o.t}</span>${miniChip(o)}<small>${riskHtml(q)}${bestTag(i,best)}</small></button>`; }).join(""); })()}`;
  }
  const clock = m.pending?"FIN":`${m.mins[0]}'`;
  render(`<div class="muted">${m.cdcNight?"🏆 Soirée de Coupe des Champions":"⚽ Match de saison"} · ${p.year}-${String(p.year+1).slice(2)} · une action décisive</div>
  <div class="card">${matchTitleHtml(m.title)}
    <div class="broadcast${clock==="FIN"?" done":""}" aria-label="Score : ${esc(p.club.name)} ${m.us}, ${esc(m.opp.name)} ${m.them}"><div class="bc-team">${crest(p.club,30)}<span>${esc(p.club.name)}</span></div><div class="bc-score"><b>${m.us}</b><i>–</i><b>${m.them}</b><span class="bc-clock">${clock}</span></div><div class="bc-team r"><span>${esc(m.opp.name)}</span>${crest(m.opp,30)}</div></div>
    ${pitchSvg(m)}
    ${m.log.length?`<ul class="mlog">${m.log.map((l,i)=>mlogLi(l,i,m)).join("")}</ul>`:""}
    <div class="decide">${body}</div></div>
  ${m.pending?"":`<button class="btn ghost" onclick="finishOrdinary()">⏩ Laisser le match se jouer<small>Le résultat est simulé, sans ton action</small></button>`}`);
  animateBall();
}
function finishOrdinary(){
  const m = p.match;
  simGap(m.mins[0],90);
  let res = m.us>m.them?"w":m.us<m.them?"l":"d", tab = "";
  if(res==="d"&&m.cup){ const win = chance(clamp(.5+(p.club.str-m.opp.str)*.01,.2,.85)); res = win?"w":"l"; tab = win?" (qualifiés aux tirs au but)":" (éliminés aux tirs au but)"; }
  const score = `${m.us}-${m.them}`;
  if(m.cdcNight) cdcNightAfter(m,res,score+tab);
  p.tmp.play += m.perf*2;
  p.tmp.rating = (p.tmp.rating||0)+m.perf*.02;
  p.tmp.ordG = (p.tmp.ordG||0)+m.myG; p.tmp.ordA = (p.tmp.ordA||0)+m.myA;
  p.moral = clamp(p.moral+{w:3,d:0,l:-3}[res],0,100);
  p.ordinaires = [...(p.ordinaires||[]),{y:p.year,t:m.title,s:score+tab,r:res,g:m.myG,a:m.myA}].slice(-80);
  if(m.protege){
    const q = p.protege;
    post("journal",journo(),`🌱 L'élève contre le maître : ${p.club.name} ${score} ${m.opp.name}. ${res==="w"?`${lastName()} garde l'avantage sur ${q.name}.`:res==="l"?`${q.name} prend le dessus sur son mentor.`:"Personne ne cède."}`);
    msg("dm",res==="l"?`${q.name} : « Désolé pour aujourd'hui 😅 Merci pour tout ce que tu m'as appris. »`:`${q.name} : « Bien joué. La prochaine fois, c'est moi. »`);
    p.protegeH2H = {...(p.protegeH2H||{w:0,d:0,l:0}),[res]:((p.protegeH2H||{})[res]||0)+1};
    if(!p.flags.protegeMet){ p.flags.protegeMet = true; p.moments.push(`${p.year} · Affronte pour la première fois son ancien protégé ${q.name}`); }
  }
  if(m.myG>=2) p.moments.push(`${p.year} · Doublé lors de la ${m.title.split(" ·")[0]}`);
  if(chance(.5)) post("journal",journo(),`${res==="w"?"✅":res==="l"?"❌":"➖"} ${m.title.split(" ·")[0]} : ${p.club.name} ${score} ${m.opp.name}${tab}.${m.myG?` ${lastName()} buteur.`:""}`);
  const label = {w:"Victoire",d:"Match nul",l:"Défaite"}[res];
  ui.toast = `<div class="tchoice">⚽ ${tab?`${cap1(tab.replace(/^ \(|\)$/g,""))} (${score})`:`${label} ${score}`}</div><div>${esc(m.title)}${m.myG?` · ⚽×${m.myG}`:""}${m.myA?` · 🅰️×${m.myA}`:""}</div>${ui.cdcNote?`<div>${ui.cdcNote}</div>`:""}`;
  ui.cdcNote = null;
  p.match = null; p.phase = "event";
  if(!ui.quick) sfx(res==="w"?"goal":"whistle");
  save(); route();
}

/* ============ Prolongation des finales ============ */
// une finale à égalité après 90 minutes : 30 minutes de plus, une dernière action, puis les tirs au but
function startExtraTime(m){
  m.et = true; m.simDone = false;
  const min = RI(98,117);
  simGap(90,min);
  m.mins.push(min); m.step = m.mins.length-1;
  m.log.push(`⏱️ Prolongation ! ${m.us}-${m.them} après 90 minutes. Trente minutes de plus, les jambes brûlent.`);
  m.talk = chance(.6)?"crampes":null;
  save(); matchScreen();
}

// le club de ton ancien protégé, s'il joue dans ton championnat (et plus dans ton club)
function protegeClub(){
  const q = p.protege; if(!q||q.club===p.club.name) return null;
  return CLUBS.find(c=>c.name===q.club&&c.country===p.club.country)||null;
}

/* ============ Les soirées de Coupe des Champions ============ */
// Une saison européenne se vit sur le terrain : un match décisif de la phase de groupes au deuxième moment, puis,
// si le club passe, le huitième de finale retour au troisième. Leurs résultats décident du parcours (cdcPath).
// État : p.tmp.cdcN (soirées jouées), p.tmp.cdcQual (sorti des groupes ?), p.tmp.cdc8 (huitième gagné ?), p.tmp.cdcOut.
function cdcNightWanted(){
  const T = p.cdc; if(!T||!T.drawn||p.daily||p.friend||p.story) return null;
  const t = p.tmp||{}, n = t.cdcN||[];
  if(p.evIdx===1&&!n.length) return "groupe";
  if(p.evIdx===2&&n.length===1&&t.cdcQual&&t.cdc8==null) return "8e";
  return null;
}
function startCdcNight(kind){
  const T = p.cdc, c = p.club;
  const ko = CLUBS.filter(x=>x.country!==c.country&&x.str>=76&&!T.group.some(g=>g.name===x.name));
  const opp = kind==="groupe"?[...T.group].sort((a,b)=>b.str-a.str)[RI(0,1)]||T.group[0]:pick(ko)||pick(T.group);
  const home = kind==="8e"?true:chance(.5), min = RI(60,86);
  const title = kind==="groupe"?`Coupe des Champions · phase de groupes · ${home?"à domicile":"à l'extérieur"} face ${auC(opp.name)}`:`Coupe des Champions · huitième de finale retour face ${auC(opp.name)}`;
  const m = p.match = {type:"ordinaire",short:true,cup:kind==="8e",cdcNight:kind,title,usStr:c.str+(home?2:-2),weather:pick(WEATHER),crowd:Math.round(R(52000,78000)),
    opp:{name:opp.name,country:opp.country,str:opp.str},us:0,them:0,step:0,mins:[min],tpl:[],log:[],myG:0,myA:0,perf:0,pending:null,calm:false,talk:null,protege:false};
  m.log.push(`🎙️ L'hymne de la Coupe des Champions résonne. ${home?"Ton stade":"Le stade adverse"} brandit des milliers de lumières.`);
  if(!p.flags.cdcNight){ p.flags.cdcNight = true; m.log.push("✨ Ta première soirée européenne. Petit, tu regardais ces matchs en pyjama."); p.moments.push(`${p.year} · Première soirée de Coupe des Champions, face ${auC(opp.name)}`); }
  if(kind==="groupe") m.log.push(`📊 ${T.group.length+1} équipes, deux places : ce match pèse lourd dans la course à la qualification.`);
  else { const a = RI(0,2); m.log.push(`🔁 Match aller : ${a}-${a}. Tout se joue ce soir.`); }
  m.tpl = [freshOrder(matchActions().length)[0]];
  if(typeof crewMatchMood==="function") crewMatchMood(m);
  simGap(0,min);
  if(chance(.3)) m.talk = pickTalk(m);
  p.phase = "ordinaire";
}
function cdcNightAfter(m,res,score){
  const T = p.cdc, t = p.tmp;
  t.cdcN = [...(t.cdcN||[]),{k:m.cdcNight,opp:m.opp.name,cc:m.opp.country,r:res}];
  if(res==="w") p.rep = clamp(p.rep+2,0,100);
  if(m.myG&&!p.flags.cdcGoal){ p.flags.cdcGoal = true; p.moments.push(`${p.year} · Premier but en Coupe des Champions, face ${auC(m.opp.name)}`); }
  if(m.cdcNight==="groupe"){
    const avg = T.group.reduce((a,g)=>a+g.str,0)/T.group.length, str = p.club.str+myImpact()*2;
    t.cdcQual = chance(clamp(.5+(str-avg)*.035+({w:.15,d:0,l:-.15})[res],.1,.92));
    if(!t.cdcQual) t.cdcOut = "groupes";
    post("journal",journo(),t.cdcQual?`🏆 Coupe des Champions : ${p.club.name} ${score} ${m.opp.name}. Les huitièmes de finale se rapprochent.`:`🏆 Coupe des Champions : ${p.club.name} ${score} ${m.opp.name}. L'aventure européenne tourne court.`);
    ui.cdcNote = t.cdcQual?"🏆 Qualifiés pour les huitièmes de finale de la Coupe des Champions !":"🏆 Éliminés dès la phase de groupes de la Coupe des Champions.";
  } else {
    t.cdc8 = res==="w";
    if(!t.cdc8) t.cdcOut = "8e";
    post("journal",journo(),`🏆 Huitième de finale : ${p.club.name} ${score} ${m.opp.name}. ${t.cdc8?"Direction les quarts !":"Fin du rêve européen."}`);
    ui.cdcNote = t.cdc8?"🏆 En quarts de finale de la Coupe des Champions !":"🏆 Éliminés en huitième de finale de la Coupe des Champions.";
  }
}
