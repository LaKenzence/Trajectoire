// Simulateur de carrières : un « bot » joue des carrières complètes dans le moteur sans navigateur,
// en choisissant tantôt au hasard, tantôt comme la saison rapide. Il relève au passage les plantages,
// les écrans qui affichent « undefined » ou « NaN » et les jauges qui sortent de leurs bornes.
const { createGame } = require("./moteur");

// Le bot tourne dans le bac à sable du jeu : il a accès à p, ui et à toutes les fonctions globales.
const BOT = String.raw`
function __pickChoice(e){
  const valid = e.ch.map((c,i)=>i).filter(i=>!e.ch[i].cond||e.ch[i].cond());
  return chance(.5)?bestChoice(e):pick(valid);
}
function __offseason(){
  // talents d'abord, quand il y a des points
  const avail = Object.keys(TALENTS).filter(k=>!has(k)&&TALENTS[k].pos.includes(p.pos));
  if(avail.length&&(p.tp||0)>=talentCost()&&chance(.8)){ learn(pick(avail)); return "talent"; }
  if(p.rehab&&!p.rehab.done&&chance(.8)){ rehabWeek(pick(Object.keys(REHAB))); return "rééducation"; }
  if(chance(.12)){ phoneScreen(pick(["msgs","fil"])); const m = phone().msgs.find(x=>x.replies&&x.answered==null); if(m) reply(m.id,RI(0,m.replies.length-1)); return "téléphone"; }
  if(chance(.06)){ const ok = Object.keys(POSTS).filter(k=>!POSTS[k].ok||POSTS[k].ok()); publish(pick(ok)); return "publication"; }
  if(chance(.05)){ vestiaireScreen(); vieScreen(); return "vestiaire"; }
  if(typeof SUMMERS!=="undefined"&&!p.summer&&chance(.85)){ summerChoose(pick(Object.keys(SUMMERS).filter(k=>SUMMERS[k].ok()))); return "été"; }
  if(typeof AGENTS!=="undefined"&&chance(.08)){ setAgent(pick(Object.keys(AGENTS))); offseasonScreen(); return "agent"; }
  if(typeof investIn==="function"&&p.money>100&&chance(.15)){ investIn(pick(Object.keys(INVESTS)),Math.round(p.money*R(.1,.4))); offseasonScreen(); return "placement"; }
  const o = p.offers||[], free = p.contract<=0;
  if(p.age>=bodyAge()-1&&chance(.3)) { retire(); return "retraite"; }
  if(p.renew&&chance(.5)){ sign(-1); return "prolonge"; }
  if(o.length&&chance(free?1:.4)){
    const i = RI(0,o.length-1);
    if(!o[i].loan&&chance(.3)){
      negoScreen(i);
      for(let k=RI(1,4);k>0&&p.nego;k--){ const asks = Object.keys(NEGO_ASKS).filter(a=>(!NEGO_ASKS[a].ok||NEGO_ASKS[a].ok(p.offers[p.nego.i]))&&!(a==="bluff"&&p.nego.used.bluff)); if(!asks.length) break; negoAsk(pick(asks)); }
      if(p.nego) negoSign();
      return "négo";
    }
    if(o.filter(x=>!x.loan).length>=2&&!p.auctionDone&&chance(.3)){
      auctionStart(); auctionRaise(); auctionRaise(); p.auctionDone = true;
      const live = p.auction.names.map(offerIdx).filter(j=>j>=0);
      if(live.length) sign(live[0],true); else offseasonScreen();
      return "enchères";
    }
    sign(i,true); return "signe";
  }
  if(!free){ stay(); return "reste"; }
  if(p.renew){ sign(-1); return "prolonge"; }
  offseasonScreen(); return "attente";
}
function __after(){
  if(p.afterStory){ afterStoryChoose(RI(0,afterStoryOpts().length-1)); return "après"; }
  const opts = Object.entries(AFTER).filter(([,a])=>a.ok()).map(([k])=>k);
  chooseAfter(pick(opts)); return "après";
}
function __coach(){
  const k = p.coach;
  if(k.step==="event"){ if(k.ev===null) coachEventScreen(); coachChoose(RI(0,COACH_EVENTS[k.ev].ch.length-1)); return "coach"; }
  if(k.step==="style"){ coachPlay(pick(["att","eq","def"])); return "coach"; }
  if(k.hist.length>=6||k.age>=70){ endCoach(); return "coach"; }
  if(!k.res.sacked&&chance(.6)) coachStay(); else if(k.offers.length) coachSign(RI(0,k.offers.length-1)); else endCoach();
  return "coach";
}
function __step(){
  if(!p) return "fin";
  if(p.retired) return p.after?"fin":p.coach?__coach():__after();
  if(p.urgent){ urgentAnswer(RI(0,urgentOpts().length-1)); return "urgence"; }
  ui.quick = true;
  try{
    if(p.phase==="tirage"){ tirageScreen(); tirageDone(); return "tirage"; }
    if(p.phase==="goal"){ if(!p.goalOpts) p.goalOpts = goalOptions(); if(chance(.5)){ goalScreen(); setFocus(pick(Object.keys(QUALS))); if(chance(.4)) setIntensity(pick(Object.keys(INTENS))); } setGoal(RI(0,p.goalOpts.length-1)); return "objectif"; }
    if(p.phase==="event"){ if(!p.curEv) eventScreen(); choose(__pickChoice(EVENTS.find(x=>x.id===p.curEv))); return "événement"; }
    if(p.phase==="match"||p.phase==="ordinaire"){
      const m = p.match;
      if(m.awaitTactic) setTactic(pick(["att","eq","def"]));
      else if(m.talk) matchTalk(RI(0,MATCH_TALKS.find(x=>x.id===m.talk).o.length-1));
      else if(m.pending) matchNext();
      else if(m.step>=m.mins.length||m.simDone) finishMatch();
      else matchPick(RI(0,matchActions()[m.tpl[m.step]].o.length-1));
      return "match";
    }
    if(p.phase==="season"){ if(p.tourney&&!p.tourney.done) startTourney(); else toOffseason(); return "saison"; }
    if(p.phase==="hiver"){ if(chance(.5)) winterSign(RI(0,p.winter.offers.length-1)); else winterStay(); return "hiver"; }
    if(p.phase==="tournoi"){
      const T = p.tourney;
      if(T.done){ tourneyEndScreen(); toOffseason(); return "tournoi"; }
      if(chance(.05)){ tourneyAuto(); return "tournoi"; }
      if(!T.cur) tourneyScreen();
      if(T.cur.post) tourneyNext(); else tourneyPick(RI(0,tourneyAct().o.length-1));
      return "tournoi";
    }
  } finally { ui.quick = false; }
  if(p.phase==="offseason") return __offseason();
  return "inconnu";
}
function __check(){
  if(!p) return [];
  const bad = [];
  for(const k of ["lvl","pot","form","moral","rep","money","age"]) if(typeof p[k]!=="number"||!isFinite(p[k])) bad.push(k+" = "+p[k]);
  if(p.lvl<20||p.lvl>99) bad.push("niveau hors bornes : "+p.lvl);
  for(const k of ["form","moral","rep"]) if(p[k]<0||p[k]>100) bad.push(k+" hors bornes : "+p[k]);
  if(p.money<0) bad.push("argent négatif : "+p.money);
  return bad;
}
soundOn = false;
`;

const POSITIONS = ["GB", "DEF", "MIL", "ATT"];

function playCareer(seed, opts = {}) {
  const game = createGame({ seed });
  // ce qui survit d'une carrière à l'autre chez un vrai joueur (Panthéon, événements déjà vus)
  for (const [k, v] of Object.entries(opts.carry || {})) game.store.set(k, v);
  game.run("VUS = loadVus();");
  const issues = [];
  const note = (kind, detail) => { if (issues.length < 8) issues.push({ seed, kind, detail }); };
  game.run(BOT);
  let seen = game.renders.length;
  const scanRenders = step => {
    for (; seen < game.renders.length; seen++) {
      const h = game.renders[seen].replace(/<[^>]+>/g, " ");
      const m = h.match(/.{0,60}\b(undefined|NaN|\[object Object\])\b.{0,60}/);
      if (m) note("affichage", `${step} : …${m[0].replace(/\s+/g, " ").trim()}…`);
    }
  };
  const pos = opts.pos || POSITIONS[seed % 4];
  try {
    // opts.launch : une autre façon de démarrer (mode Histoire, défi de la semaine…)
    if (opts.launch) game.run(opts.launch + ";route();"); else
    game.run(`(()=>{
      const k = o=>pick(Object.keys(o));
      newPlayer({name:"Test Bot",country:k(COUNTRIES),pos:${JSON.stringify(pos)},trait:k(TRAITS),origin:k(ORIGINS),ent:k(ENTOURAGES),life:k(LIFESTYLES),hard:chance(.2)${opts.defi ? `,defi:${JSON.stringify(opts.defi)}` : ""}${opts.start ? `,start:${JSON.stringify(opts.start)}` : ""}});
      route();
    })()`);
  } catch (e) { note("plantage", "création : " + (e.stack || e).toString().split("\n").slice(0, 3).join(" | ")); return { seed, issues }; }
  let steps = 0, last = "";
  while (steps++ < 3000) {
    let step;
    try { step = game.run("__step()"); }
    catch (e) { note("plantage", `après « ${last} » : ` + (e.stack || e).toString().split("\n").slice(0, 4).join(" | ")); break; }
    scanRenders(step);
    for (const b of game.run("__check()")) note("jauge", `${step} : ${b}`);
    if (step === "fin") break;
    last = step;
  }
  if (steps >= 3000) note("boucle", `la carrière ne se termine pas (dernière étape : ${last})`);
  // sauvegarde et reprise : la partie doit survivre à un aller-retour JSON
  try { game.run("if(p){ save(); const k = slot; p = null; resume(k); }"); scanRenders("reprise"); }
  catch (e) { note("plantage", "reprise : " + String(e.stack || e).split("\n")[0]); }
  const stats = game.run(`p?(()=>{ const s = careerSummary(), u = Object.values(p.used||{});
    return {pos:p.pos,seasons:p.seasons.length,age:p.age,peak:s.peak,stars:s.stars,trophies:s.trophies,goals:s.goals,clean:s.clean,caps:p.caps,money:p.money,
      echoes:p.echoes||0,after:p.after?.k||null,coach:(p.coachHist||[]).length,events:u.reduce((a,b)=>a+b,0),distinct:u.length,maxRepeat:Math.max(0,...u),
      pens:p.pens||null,defi:p.defi||null,intl:p.trophies.filter(t=>/^(Championnat du Monde|Coupe Continentale)/.test(t.t)).length,
      tourneys:p.moments.filter(m=>/Convoqué pour le/.test(m)).length,cdc:p.trophies.filter(t=>t.t==="Coupe des Champions").length,ordWins:(p.ordinaires||[]).filter(o=>o.r==="w").length,ord:(p.ordinaires||[]).length,urg:p.urgentsN||0,story:p.story?p.story.ch:null,weekly:p.weekly||null,title:careerTitles()[0].id,ids:Object.keys(p.used||{})}; })():null`);
  if (opts.carry) for (const k of CARRY) if (game.store.has(k)) opts.carry[k] = game.store.get(k);
  // les écrans déjà analysés ne servent plus : sans ça, des centaines de carrières saturent la mémoire
  game.renders.length = 0; game.store.clear();
  return { seed, issues, stats };
}

const CARRY = ["trajectoire_hof", "trajectoire_vus", "trajectoire_vus_n"];
// les carrières d'une série s'enchaînent comme chez un même joueur : on mesure ce qu'il a déjà vu à la précédente
function simulate(n, opts = {}) {
  const results = [], carry = {};
  let prev = null;
  for (let i = 0; i < n; i++) {
    const r = playCareer((opts.seed0 || 1) + i, { ...opts, carry });
    if (r.stats) {
      const ids = r.stats.ids;
      r.stats.dejaVu = prev && ids.length ? ids.filter(id => prev.has(id)).length / ids.length : null;
      prev = new Set(ids); delete r.stats.ids;
    }
    results.push(r);
  }
  return results;
}

module.exports = { playCareer, simulate, POSITIONS };
