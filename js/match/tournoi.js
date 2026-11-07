// Trajectoire · Tournoi international joué pendant l'été : phase de groupes, puis quarts, demie et finale
// Chaque match se résume à un moment décisif joué comme une action du match clé (penalties et coups francs compris).
const STAGES = ["Groupe · match 1","Groupe · match 2","Groupe · match 3","Quart de finale","Demi-finale","Finale"];
function newTourney(name,year){
  const others = shuffle(Object.keys(COUNTRIES).filter(c=>c!==p.country));
  const byStr = (min)=>others.filter(c=>COUNTRIES[c].nat>=min);
  // trois adversaires de groupe de niveaux variés, puis des adversaires de plus en plus forts
  const group = [byStr(84)[0]||others[0],...others.filter(c=>COUNTRIES[c].nat<84).slice(0,2)];
  while(group.length<3) group.push(others[group.length+3]);
  // phase finale : trois équipes distinctes parmi les huit plus fortes restantes, de la moins forte à la plus forte
  const rest = others.filter(c=>!group.includes(c)).sort((a,b)=>COUNTRIES[b].nat-COUNTRIES[a].nat).slice(0,8);
  const ko = shuffle(rest).slice(0,3).sort((a,b)=>COUNTRIES[a].nat-COUNTRIES[b].nat);
  return {name,year,opps:group.concat(ko),stage:0,pts:0,gf:0,ga:0,res:[],cur:null,done:false,out:null,myG:0,myA:0,
    role:p.lvl>=COUNTRIES[p.country].nat-2?"titulaire":"remplaçant"};
}
const tourneyOpp = T=>{ const c = T.opps[T.stage]; return {name:COUNTRIES[c].name,country:c,str:COUNTRIES[c].nat}; };
const usStr = ()=>COUNTRIES[p.country].nat+(p.lvl-80)*.3;
// buts marqués sur une portion du match (share = fraction des 90 minutes)
function tourneyGoals(share,opp){
  const d = usStr()-opp.str;
  return {us:poisson(share*1.3*clamp(1+d*.04,.35,2)),them:poisson(share*1.3*clamp(1-d*.04,.35,2))};
}
function startTourney(){
  const T = p.tourney;
  p.phase = "tournoi";
  p.moments.push(`${T.year} · Convoqué pour le ${T.name}${T.role==="remplaçant"?" (remplaçant)":""}`);
  save(); route();
}
// prépare le match en cours : score avant le moment décisif et action à jouer
// pendant le tournoi, p.match décrit le match de sélection en cours : les actions, les couleurs
// des penalties et le nom de l'équipe (« monde » = ta sélection) en dépendent
function tourneyMatchCtx(){
  const T = p.tourney, opp = tourneyOpp(T);
  if(!p.match||p.match.opp?.name!==opp.name) p.match = {type:"monde",opp,title:`${T.name} · ${STAGES[T.stage]}`,weather:pick(WEATHER)};
  return opp;
}
function tourneyPrepare(){
  const T = p.tourney, opp = tourneyMatchCtx();
  const g = tourneyGoals(.7,opp);
  T.cur = {us:g.us,them:g.them,min:RI(62,84),act:freshOrder(matchActions().length)[0],post:null,myG:0,myA:0};
  save();
}
const tourneyAct = ()=>{ tourneyMatchCtx(); return matchActions()[p.tourney.cur.act]; };
function tourneyScreen(){
  const T = p.tourney;
  if(T.done) return tourneyEndScreen();
  if(!T.cur) tourneyPrepare();
  const opp = tourneyOpp(T), C = T.cur, a = tourneyAct();
  const board = `<div class="broadcast" aria-label="Score : ${esc(COUNTRIES[p.country].name)} ${C.us}, ${esc(opp.name)} ${C.them}"><div class="bc-team">${flag(p.country)}<span>${esc(COUNTRIES[p.country].name)}</span></div><div class="bc-score"><b>${C.us}</b><i>–</i><b>${C.them}</b><span class="bc-clock">${C.post?"FIN":C.min+"'"}</span></div><div class="bc-team r"><span>${esc(opp.name)}</span>${flag(opp.country)}</div></div>`;
  const body = C.post
    ? `<p class="story">${C.post}</p><button class="btn primary" onclick="tourneyNext()">Suite →</button>`
    : `<p class="story">${T.role==="remplaçant"&&T.stage<3?`Tu entres en jeu à la ${C.min-10}e minute. `:""}${a.txt}</p>
      ${a.o.map((o,i)=>{ const q = o.p+talentBonus(o.t); return `<button class="btn" onclick="tourneyPick(${i})">${choiceLead(o.t,i)}<span class="ctext">${o.t}</span><small>${riskHtml(q)}${miniChip(o)?" · 🎮 à jouer":""}</small></button>`; }).join("")}`;
  render(`<div class="world-banner" aria-hidden="true"></div><div class="muted">${flag(p.country)} ${esc(T.name)} · ${STAGES[T.stage]}${T.stage<3?` · ${T.pts} pt${T.pts>1?"s":""}`:""}</div>
    <div class="card"><h2 style="text-align:center">${esc(COUNTRIES[p.country].name)} – ${esc(opp.name)}</h2>${board}
    ${T.res.length?`<ul class="mlog">${T.res.map(r=>`<li>${r}</li>`).join("")}</ul>`:""}${body}</div>
    ${C.post?"":`<button class="btn ghost" onclick="tourneyAuto()">⏩ Simuler le reste du tournoi<small>Le jeu choisit pour toi jusqu'à la fin</small></button>`}`);
}
function tourneyPick(i){
  const T = p.tourney, C = T.cur, opp = tourneyOpp(T), o = tourneyAct().o[i];
  if(ui.penOk==null) markAct(C.act);
  // penalties et coups francs se jouent pour de vrai, comme dans le match clé
  if(o.duel&&ui.penOk==null&&!ui.quick&&minisOn("duel")) return void playDuel(o.duel).then(ok=>{ ui.penOk = ok; tourneyPick(i); });
  if(o.pen&&ui.penOk==null&&!ui.quick&&typeof Penalty!=="undefined"&&minisOn("pen")){
    const go = (mode,title,then)=>{ playMini(mode,title,opp).then(then); };
    if(o.pen==="save"||o.pen==="fksave") return go(o.pen,o.pen==="save"?"Penalty contre ta sélection":"Coup franc contre ta sélection",ok=>{ ui.penOk = ok; tourneyPick(i); });
    if(o.pen==="fk") return go("fk","Coup franc pour ta sélection !",ok=>{ ui.penOk = ok; ui.penRes = ok; tourneyPick(i); });
    if(chance(clamp(o.p+talentBonus(o.t),.05,.95))) return go("shoot","Penalty pour ta sélection !",ok=>{ ui.penOk = true; ui.penRes = ok; tourneyPick(i); });
    ui.penOk = false;
  }
  const okRoll = ui.penOk!=null?ui.penOk:chance(clamp(o.p+talentBonus(o.t),.05,.95)), penRes = ui.penRes;
  ui.penOk = ui.penRes = null;
  let txt;
  if(okRoll){
    const r = o.ok; txt = r.txt;
    if(r.rep) p.rep = clamp(p.rep+r.rep,0,100);
    if(r.us){
      if(penRes!=null?penRes:chance(r.us)){ C.us++; if(r.me==="g") C.myG++; else if(r.me==="a") C.myA++; if(r.us<1) txt += " Et c'est au fond !"; }
      else txt += " …mais l'action n'aboutit pas.";
    } else { const c = counterRoll(r,true); if(c){ C.us++; txt += " "+c; } }
  } else {
    const r = o.ko; txt = r.txt;
    if(r.them&&chance(r.them)){ C.them++; txt += " But adverse."; } else if(r.them) txt += " Ouf, ça passe à côté.";
    else { const c = counterRoll(r,false); if(c){ C.them++; txt += " "+c; } }
  }
  const g = tourneyGoals(.3,opp); C.us += g.us; C.them += g.them;
  finishTourneyMatch(txt);
}
function finishTourneyMatch(txt){
  const T = p.tourney, C = T.cur, opp = tourneyOpp(T), ko = T.stage>=3;
  if(ko&&C.us===C.them&&C.tab==null){
    // match nul en phase finale : tirs au but, jouables si tu n'es pas en mode rapide
    if(!ui.quick&&typeof Penalty!=="undefined"){
      C.tab = "pending"; save();
      playShootout({title:`${STAGES[T.stage]} · ${COUNTRIES[p.country].name} – ${opp.name}`,us:C.us,them:C.them,weather:p.match?.weather,opp}).then(won=>{ C.tab = won; finishTourneyMatch(txt); });
      return;
    }
    C.tab = chance(clamp(.5+(usStr()-opp.str)*.01+(p.pos==="GB"?(p.lvl-70)*.006:0)+(has("sangfroid")?.1:0),.2,.8));
  }
  const res = C.us>C.them||(C.tab===true)?"w":C.us<C.them||C.tab===false?"l":"d";
  T.gf += C.us; T.ga += C.them; T.myG += C.myG; T.myA += C.myA;
  p.caps++; p.intlGoals += C.myG;
  if(T.stage<3) T.pts += res==="w"?3:res==="d"?1:0;
  const score = `${C.us}-${C.them}${C.tab!=null?` (${C.tab?"victoire":"défaite"} aux tirs au but)`:""}`;
  T.res.push(`${res==="w"?"✅":res==="d"?"➖":"❌"} ${STAGES[T.stage]} : ${esc(COUNTRIES[p.country].name)} ${score} ${esc(opp.name)}${C.myG?` · ⚽×${C.myG}`:""}${C.myA?` · 🅰️×${C.myA}`:""}`);
  if(C.myG>=2) p.moments.push(`${T.year} · ${C.myG>=3?"Triplé":"Doublé"} face à ${opp.name} au ${T.name}`);
  C.post = `${txt}<br><b>Coup de sifflet final : ${score}.</b>`;
  C.res = res;
  save();
  if(!ui.quick){ sfx(res==="w"?"goal":"whistle"); route(); }
}
// fin de la phase de groupes : qualifié avec 5 points, à 4 si la différence de buts est bonne
function groupQualified(T){ const gd = T.gf-T.ga; return T.pts>=5||(T.pts===4&&gd>=0)||(T.pts===3&&gd>0&&chance(.5)); }
function tourneyNext(){
  const T = p.tourney, C = T.cur;
  if(T.stage>=3&&C.res==="l") return endTourney(T.stage===5?"finale":STAGES[T.stage].toLowerCase());
  if(T.stage===2&&!groupQualified(T)) return endTourney("groupes");
  if(T.stage===5) return endTourney(null);
  T.stage++; T.cur = null; p.match = null;
  if(T.stage===3) T.res.push(`🎉 Qualifiés pour les quarts de finale (${T.pts} points)`);
  save(); route();
}
function endTourney(out){
  const T = p.tourney;
  T.done = true; T.out = out; T.cur = null; p.match = null;
  const won = !out;
  if(won){
    const t = `${T.name} ${T.year}`;
    p.trophies.push({t,y:T.year}); if(p.seasons.length) p.seasons.at(-1).tr++;
    p.moments.push(`${T.year} · Vainqueur du ${T.name} avec ${COUNTRIES[p.country].name}`);
    p.rep = clamp(p.rep+8,0,100); p.moral = clamp(p.moral+10,0,100); p.tp = (p.tp||0)+1;
    post("journal",journo(),`🏆 ${COUNTRIES[p.country].name.toUpperCase()} SUR LE TOIT DU MONDE ! ${p.name} et les siens remportent le ${T.name}.`);
    msg("famille","On a pleuré devant la télé. Tout le pays est dehors !! 🏆");
  } else if(out==="finale"){ p.rep = clamp(p.rep+3,0,100); p.moral = clamp(p.moral-3,0,100); p.moments.push(`${T.year} · Finaliste du ${T.name}`); }
  else p.moral = clamp(p.moral-(out==="groupes"?6:3),0,100);
  liveAch(); save();
  if(!ui.quick){ route(); if(won){ confetti(); sfx("trophy"); } }
}
function tourneyEndScreen(){
  const T = p.tourney, won = !T.out;
  render(`<div class="card ${won?"celebrate":""}">${T.name.startsWith("Championnat du Monde")?`<img class="trophy-img dark${won?"":" lost"}" src="img/coupe-monde.webp" alt="" width="520" height="520">`:""}<h2>${won?`🏆 ${esc(COUNTRIES[p.country].name)} remporte le ${esc(T.name)} !`:`${esc(T.name)} : ${T.out==="groupes"?"éliminés en phase de groupes":T.out==="finale"?"battus en finale":`éliminés en ${T.out}`}`}</h2>
    <p class="story">${won?"Tout un pays dans la rue. Ton nom restera associé à cet été pour toujours.":T.out==="finale"?"Si près du but… La médaille d'argent a un goût amer, mais le pays est fier de vous.":"Le retour au pays est silencieux. Il faudra attendre le prochain tournoi."}</p>
    <ul class="mlog">${T.res.map(r=>`<li>${r}</li>`).join("")}</ul>
    <div class="stats"><div class="stat"><b>${T.res.filter(r=>!r.startsWith("🎉")).length}</b><span>matchs</span></div><div class="stat"><b>${T.myG}</b><span>but(s)</span></div><div class="stat"><b>${T.myA}</b><span>passe(s) déc.</span></div></div>
    <button class="btn primary" onclick="toOffseason()">Passer à l'intersaison →</button></div>`);
}
// mode rapide : le jeu joue chaque moment avec le meilleur choix
function tourneyAuto(){
  ui.quick = true;
  try{
    let guard = 0;
    while(!p.tourney.done&&guard++<20){
      if(!p.tourney.cur) tourneyPrepare();
      if(p.tourney.cur.post){ tourneyNext(); continue; }
      const a = tourneyAct(); let bi = 0, bv = -1;
      a.o.forEach((o,i)=>{ const q = o.p+talentBonus(o.t); if(q>bv){ bv = q; bi = i; } });
      tourneyPick(bi);
    }
  } finally { ui.quick = false; }
  route();
}
