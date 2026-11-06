// Trajectoire · Simulation de la saison, journal, Ballon d'Étoile, saison rapide, actualités
/* ============ Simulation de saison ============ */
function poisson(l){ let L=Math.exp(-l),k=0,q=1; do{k++;q*=Math.random();}while(q>L); return k-1; }
function ageGrowth(age){ return age<=19?R(3,7):age<=22?R(2,5):age<=26?R(0,3):age<=29?R(-1,1.5):age<=32?R(-3.5,-.5):R(-6,-2); }
function simRival(playerStar){
  const r = p.rival; if(!r||r.retired) return null;
  let g = ageGrowth(p.age); if(g>0) g = Math.min(g,Math.max(0,r.pot-r.lvl));
  r.lvl = clamp(Math.round(r.lvl+g),30,99);
  const diff = r.lvl-r.club.str, play = clamp(50+diff*3.5+(p.age<=18?20:p.age<=20?10:0),5,97);
  const apps = Math.round(R(30,38)*play/100), q = clamp(1+diff*.03,.3,2);
  const goals = poisson(apps*POS[p.pos].g*q), assists = poisson(apps*POS[p.pos].a*q), clean = p.pos==="GB"?poisson(apps*.3):0;
  let tr = chance(clamp((r.club.str-70)*.03,0,.45))?1:0, note = null;
  if(r.lvl>=COUNTRIES[r.country].nat-6&&p.age>=18) r.caps += RI(5,10);
  if(!playerStar&&r.lvl>=87&&chance(.35)){ r.stars++; tr++; note = "a remporté le Ballon d'Étoile"; p.moments.push(`${p.year+1} · Son rival ${r.name} remporte le Ballon d'Étoile`); }
  r.apps+=apps; r.goals+=goals; r.assists+=assists; r.clean+=clean; r.trophies+=tr; r.best = Math.max(r.best,r.lvl);
  if(r.lvl>r.club.str+3&&chance(.6)){ const nc = shuffle(CLUBS.filter(c=>c.str>r.club.str&&c.str<=r.lvl+6))[0]; if(nc){ r.club={...nc}; note = note||`a signé à ${nc.name}`; } }
  if(p.age>=34&&(chance(.35)||p.age>=37)){ r.retired = true; note = "a annoncé sa retraite"; p.moments.push(`${p.year+1} · Son rival ${r.name} prend sa retraite`); }
  return {apps,goals,assists,clean,lvl:r.lvl,club:r.club.name,cc:r.club.country,note};
}
function simSeason(){
  const c = p.club, diff = p.lvl-c.str, M = p.tmp.match;
  const youth = p.age<=18?20:p.age<=20?10:0;
  let play = 50+diff*3.5+(p.moral-50)*.25+(p.form-50)*.3+p.tmp.play+youth+(p.flags.cap?5:0)+((p.rel?.trust??50)-50)*.3;
  play = clamp(play,3,97);
  let avail = 1, injury = null;
  const injP = clamp((.1+(60-p.form)*.005+(p.age>30?.05:0)-(p.trait==="athl"?.05:0)-(has("acier")?.05:0))*(defiOn("verre")?2:1),.03,defiOn("verre")?.7:.45);
  if(chance(injP+(p.flags.fragile?.08:0))){ avail = R(.45,.85); injury = pick(["Entorse de la cheville","Lésion aux ischios","Fracture du pied","Pubalgie","Élongation au mollet"]); }
  const apps = Math.max(1,Math.round(R(34,38)*play/100*avail));
  const starts = Math.round(apps*clamp(play/100+.1,0,1));
  let rating = 6.4+diff*.035+(p.moral-50)*.006+(p.form-50)*.004+(p.tmp.rating||0)+R(-.35,.35)*(p.trait==="inst"?1.8:1);
  rating = clamp(rating,5.2,9.2);
  const q = clamp(1+diff*.03+(rating-6.5)*.25,.3,2.2);
  const share = starts/Math.max(apps,1)*.6+.4;
  const goals = poisson(apps*POS[p.pos].g*q*(p.trait==="inst"?1.2:1)*(has("finition")?1.15:1)*share)+(M?M.myG:0)+(p.tmp.ordG||0);
  const assists = poisson(apps*POS[p.pos].a*q*(p.trait==="tech"?1.35:1)*(has("vision")?1.2:1)*share)+(M?M.myA:0)+(p.tmp.ordA||0);
  const clean = p.pos==="GB"?poisson(apps*clamp(.15+(c.str-60)*.008+diff*.004,.08,.55)*(has("reflexes")?1.15:1)):0;
  // classement
  const impact = (rating-6.5)*3*(apps/38);
  const league = CLUBS.filter(x=>x.country===c.country).map(x=>({n:x.name,s:x.str+R(-9,9)+(x.name===c.name?impact:0)}));
  league.sort((a,b)=>b.s-a.s);
  const rank = league.findIndex(x=>x.n===c.name)+1;
  const tr = [], lg = COUNTRIES[c.country].league;
  if(rank===1) tr.push(`Champion – ${lg}`);
  const cupName = `Coupe nationale (${COUNTRIES[c.country].name})`;
  if(p.tmp.cup===true) tr.push(cupName);
  else if(p.tmp.cup===undefined&&chance(clamp(.04+(c.str-60)*.006,.02,.22))) tr.push(cupName);
  // la Coupe des Champions se joue seulement si le club est qualifié (tirage en début de saison)
  const cdc = p.cdc?cdcPath(c,impact,p.tmp.cdc):null;
  if(cdc?.won) tr.push("Coupe des Champions");
  const obj = c.str>=85?{t:"Être champion",ok:rank<=1}:c.str>=76?{t:"Finir sur le podium",ok:rank<=3}:c.str>=64?{t:"Finir dans la première moitié",ok:rank<=5}:{t:"Éviter la dernière place",ok:rank<10};
  // sélection
  const nat = COUNTRIES[p.country].nat, yEnd = p.year+1;
  let caps=0, ig=0, intl=null;
  if(p.tmp.world!==undefined||(p.age>=18&&p.lvl+R(-3,3)+(p.tmp.nat||0)>=nat-7&&apps>=12)){
    caps = RI(4,9); ig = poisson(caps*POS[p.pos].g*.8);
    const tourn = yEnd%4===2?"Championnat du Monde":yEnd%4===0?"Coupe Continentale":null;
    // la finale déjà jouée comme match clé décide du tournoi ; sinon le tournoi se joue pendant l'été (tournoi.js)
    if(tourn&&p.tmp.world!==undefined){
      caps += RI(3,7);
      if(p.tmp.world){ intl = `${tourn} ${yEnd}`; tr.push(intl); }
      else intl = `${tourn} ${yEnd} : battu en finale`;
    } else if(tourn){ p.tourney = newTourney(tourn,yEnd); intl = `${tourn} ${yEnd} : convoqué ✈️ (à jouer cet été)`; }
    if(p.caps===0) p.moments.push(`${p.year} · Première sélection avec ${COUNTRIES[p.country].name}`);
  }
  // distinctions
  const awardScore = rating*10+(p.pos==="ATT"?goals*.4:p.pos==="MIL"?(goals+assists)*.35:p.pos==="GB"?clean*.45:5.5)+tr.length*4+(p.lvl-80);
  let star = false;
  if(p.lvl>=86&&apps>=25&&awardScore>R(95,112)){ star = true; tr.push(`Ballon d'Étoile ${yEnd}`); p.moments.push(`${yEnd} · Ballon d'Étoile !`); }
  else if(p.age<=21&&rating>=7.1&&apps>=20&&chance(.5)) tr.push(`Révélation de l'année ${yEnd}`);
  if(p.pos==="ATT"&&goals>=25&&rank<=5&&chance(.5)) tr.push(`Meilleur buteur – ${lg}`);
  // chaque poste a sa distinction individuelle, comme le titre de meilleur buteur pour les attaquants
  if(p.pos==="GB"&&clean>=12&&rank<=5&&chance(.5)) tr.push(`Gant d'or – ${lg}`);
  if((p.pos==="DEF"||p.pos==="MIL")&&rating>=7.35&&apps>=28&&rank<=5&&chance(.5)) tr.push(`Équipe type – ${lg}`);

  // évolution : âge, entourage, mode de vie
  const old = {lvl:p.lvl,form:p.form,moral:p.moral,rep:p.rep};
  let g = ageGrowth(p.age);
  if(p.trait==="athl"&&g<0) g*=.7;
  if(p.pos==="GB"&&g<0&&p.age<=36) g*=.8; // les gardiens déclinent plus tard
  if(has("acier")&&g<0) g*=.75;
  if(has("travail")&&p.age<=28&&p.lvl<p.pot) g+=1;
  if(g>0){ g*=.45+apps/38*.75; if(p.life==="pro") g+=.6; if(p.ent==="coach"&&p.age<=27) g+=.6; g=Math.min(g,Math.max(0,p.pot-p.lvl)); }
  p.lvl = clamp(Math.round(p.lvl+g),20,99);
  p.form = clamp(p.form+(78-p.form)*.5-(p.age>30?(p.age-30)*2:0)-(injury?8:0)-(p.life==="fete"?5:0)-(p.life==="star"?2:0)+(p.life==="pro"?3:0),10,100);
  p.moral = clamp(p.moral+(play-50)*.15+tr.length*5+(obj.ok?4:-4)+(p.trait==="lead"?3:0)+(55-p.moral)*.2+(p.life==="fete"?3:0)+(p.ent==="ami"?2:0)+familyMoral(),5,100);
  if(p.ent==="parent") p.moral = Math.max(p.moral,30);
  if(has("mental")) p.moral = Math.max(p.moral,35);
  if(p.rel) p.rel.trust = clamp(p.rel.trust+(rating-6.5)*12+(50-p.rel.trust)*.15,5,100);
  const repMul = (p.life==="star"?1.25:p.life==="discret"?.8:1)*(defiOn("solo")?.85:1);
  p.rep = clamp(p.rep+((rating-6.3)*4*(apps/30)+tr.length*3+(caps?3:0)+(c.str-65)*.05)*repMul,0,100);
  let earn = p.salary*(1-agentOf().com)*(p.ent==="coach"?.92:1)+(p.life==="star"?p.rep*3:0);
  p.money += earn;
  const inv = investYear();
  p.caps += caps; p.intlGoals += ig;
  tr.forEach(t=>p.trophies.push({t,y:yEnd}));
  if(injury){ p.moments.push(`${p.year} · ${injury}`); p.rehab = newRehab(injury); } else p.rehab = null;
  delete p.flags.fragile;
  if(goals>=30) p.moments.push(`${p.year} · Saison à ${goals} buts`);
  const rival = simRival(star);
  if(p.protege){ const q = p.protege; q.age++; q.lvl = clamp(Math.round(q.lvl+Math.min(ageGrowth(q.age),Math.max(0,q.pot-q.lvl))),40,99); if(p.flags.protOff&&q.club===p.club.name&&q.lvl>=76){ const big = CLUBS.filter(c=>c.name!==p.club.name&&c.str>=Math.min(84,q.lvl+2)); const same = big.filter(c=>c.country===p.club.country); const nc = pick(same.length?same:big); if(nc){ q.club = nc.name; p.moments.push(`${p.year+1} · Son protégé ${q.name} signe à ${nc.name}`); } } }
  const ballon = ballonPodium(star,rival,rating,tr.length);
  // objectif personnel et points de talent
  const goalOk = checkGoal(p.goal,{goals,clean,assists,apps,rating:rating.toFixed(2),caps,tr,match:M});
  if(goalOk){ p.rep = clamp(p.rep+4,0,100); p.moral = clamp(p.moral+6,0,100); p.tp = (p.tp||0)+1; p.goalsDone = (p.goalsDone||0)+1; }
  else if(goalOk===false) p.moral = clamp(p.moral-4,0,100);
  if(p.age<=19) p.tp = (p.tp||0)+1;
  if(tr.length) p.tp = (p.tp||0)+1;

  const table = league.map((x,i)=>({n:x.n,pos:i+1})).filter(x=>x.pos<=4||x.n===c.name);
  const full = fullTable(league), leaders = leagueLeaders(goals,assists,rival);
  const cal = seasonCalendar(rank,apps,goals+clean,injury);
  p.last = {full,leaders,cdc,cal,apps,starts,goals,assists,clean,rating:rating.toFixed(2),rank,tr,obj,caps,ig,intl,injury,match:M,rival,table,lg,star,ballon,news:worldShift().concat(worldNews()).slice(0,4),goal:p.goal?{t:p.goal.t,ok:goalOk}:null,
    d:{lvl:p.lvl-old.lvl,form:Math.round(p.form-old.form),moral:Math.round(p.moral-old.moral),rep:Math.round(p.rep-old.rep)},earn:Math.round(earn),inv};
  p.seasons.push({y:`${p.year}-${String(yEnd).slice(2)}`,age:p.age,club:c.name,cc:c.country,apps,goals,assists,clean,rating:rating.toFixed(2),rank,lvl:p.lvl,tr:tr.length});
  clubSeason(c,tr.length,rating);
  storyCheck();
  phoneAfterSeason(p.last);
  liveAch();
}
function seasonScreen(){
  const L = p.last, c = p.club, r = L.rival;
  const ds = Object.entries(L.d).filter(([,v])=>v).map(([k,v])=>`<span class="${v>0?"up":"down"}">${LABELS[k]} ${v>0?"+":""}${v}</span>`).join("");
  const h = headline(L);
  render(`${tip("season")}<div class="muted">Bilan de la saison ${p.seasons.at(-1).y}</div>
  <div class="paper"><div class="mast"><span>Le Quotidien du Ballon</span><span>${p.year+1}</span></div><h3>${h[0]}</h3><p>${h[1]}</p></div>
  ${storyCard()}
  ${L.cal?calendarHtml(L.cal):""}
  ${L.ballon?ballonHtml(L.ballon):""}
  ${L.ballon&&L.ballon.myRank<=5?`<button class="btn" style="text-align:center" onclick="ceremonyOpen()">🎬 Revoir la cérémonie du Ballon d'Étoile</button>`:""}
  ${L.cdc?cdcHtml(L.cdc):""}
  ${L.full?standingsHtml(L):""}
  ${L.news?newsHtml(L.news):""}
  ${L.tr.length?`<div class="card celebrate"><div class="tr-anim" aria-hidden="true"></div>${L.tr.map(t=>`<div class="trophy" style="font-size:1.1rem">🏆 ${t}</div>`).join("")}</div>`:""}
  <div class="card"><div class="recap-hero">${crest(c,50)}<div class="rh-name"><span class="muted">${esc(L.lg)}</span><h2>${esc(c.name)}</h2></div><div class="rank"><b>${L.rank}<sup>e</sup></b><span>au classement</span></div></div>
    <div class="stats">
      <div class="stat"><b>${L.apps}</b><span>matchs (${L.starts} tit.)</span></div>
      ${p.pos==="GB"?`<div class="stat"><b>${L.clean}</b><span>clean sheets</span></div>`:`<div class="stat"><b>${L.goals}</b><span>buts</span></div>`}
      <div class="stat"><b>${L.assists}</b><span>passes déc.</span></div>
      <div class="stat"><b>${L.rating}</b><span>note moyenne</span></div>
    </div>
    ${L.full?"":L.table?`<table class="mini" style="margin-top:10px"><tr><th>#</th><th>${esc(L.lg)}</th></tr>${L.table.map(x=>`<tr class="${x.n===c.name?"me":""}"><td>${x.pos}</td><td>${esc(x.n)}</td></tr>`).join("")}</table>`:""}
    ${L.match?.mr?`<p>⚽ Match clé : ${esc(L.match.title)} — <b>${L.match.score}</b>${L.match.tab} · ta note ${L.match.mr}</p>`:""}
    ${L.goal?`<p>🎯 Ton objectif : <b>${esc(L.goal.t)}</b> — ${L.goal.ok?'<span style="color:var(--good)">réussi ✓ (+1 point de talent)</span>':'<span style="color:var(--bad)">manqué ✗</span>'}</p>`:""}
    <p>Objectif du club : <b>${L.obj.t}</b> — ${L.obj.ok?'<span style="color:var(--good)">atteint ✓</span>':'<span style="color:var(--bad)">manqué ✗</span>'}</p>
    ${L.injury?`<p>🩹 Blessure : ${L.injury}</p>`:""}
    ${L.caps?`<p>${flag(p.country)} Sélection : ${L.caps} matchs, ${L.ig} but(s)${L.intl?` · ${L.intl}`:""}</p>`:""}
    <p class="muted" style="margin-bottom:0">Revenus de la saison : ${money(L.earn)}${agentOf().com?` (après ${Math.round(agentOf().com*100)} % pour ton agent)`:""}${L.inv?` · placements : <b style="color:${L.inv>0?"var(--good)":"var(--bad)"}">${L.inv>0?"+":"−"}${money(Math.abs(L.inv))}</b>`:""}</p>
    <div class="delta">${ds}</div>
  </div>
  ${r?`<div class="card"><h3>⚔️ Ton rival : ${esc(p.rival.name)} ${flag(p.rival.country)}</h3>
    <div class="vs"><b class="${p.lvl>=r.lvl?"w":""}">${p.lvl}</b><span class="lbl">niveau</span><b class="${r.lvl>p.lvl?"w":""}">${r.lvl}</b>
    ${p.pos==="GB"?`<b class="${L.clean>=r.clean?"w":""}">${L.clean}</b><span class="lbl">clean sheets</span><b class="${r.clean>L.clean?"w":""}">${r.clean}</b>`:`<b class="${L.goals>=r.goals?"w":""}">${L.goals}</b><span class="lbl">buts</span><b class="${r.goals>L.goals?"w":""}">${r.goals}</b>`}
    <b>${L.assists}</b><span class="lbl">passes</span><b>${r.assists}</b></div>
    <p class="muted" style="margin:8px 0 0">${flag(r.cc)} ${esc(r.club)}${r.note?` · <b style="color:var(--text)">Il ${r.note}.</b>`:""}</p></div>`:""}
  ${p.tourney&&!p.tourney.done?`<button class="btn primary" onclick="startTourney()">✈️ Partir au ${esc(p.tourney.name)} →</button>`:`<button class="btn primary" onclick="toOffseason()">Passer à l'intersaison →</button>`}`);
  if(L.tr.length){ playLottie("trophee",document.querySelector(".tr-anim"),false); if(!ui.confettiShown){ ui.confettiShown = true; confetti(); } }
  // nommé au Ballon d'Étoile : la cérémonie s'ouvre d'elle-même, une seule fois
  if(L.ballon&&L.ballon.myRank<=5&&!L.ballonSeen&&!ui.quick){ L.ballonSeen = true; save(); ceremonyOpen(); }
}

/* ============ Journal de la saison ============ */
function headline(L){
  const n = p.name.split(" ").pop(), c = p.club.name;
  if(L.star) return [`${n}, roi du monde`,`Le Ballon d'Étoile récompense une saison hors norme : ${L.goals} buts, ${L.assists} passes décisives.`];
  if(L.intl&&L.tr.includes(L.intl)) return [`${COUNTRIES[p.country].name} sur le toit du monde !`,`${n} et les siens soulèvent le trophée. Un pays entier dans la rue.`];
  if(L.rank===1) return [`${c} champion, ${n} en héros`,`Le titre de ${L.lg} se fête toute la nuit.`];
  if(L.match?.res==="w"&&L.match.title.startsWith("Finale")) return [`La coupe pour ${c} !`,`Score final ${L.match.score}${L.match.tab}. ${n} noté ${L.match.mr}.`];
  if(L.injury&&L.apps<15) return [`Coup dur pour ${n}`,`${L.injury} : une saison presque blanche.`];
  if(L.goals>=25) return [`${n}, la machine à buts`,`${L.goals} réalisations cette saison. Les défenses tremblent.`];
  if(L.rival?.note?.includes("Ballon")) return [`${p.rival.name} sacré, ${n} dans l'ombre`,`Le rival de toujours prend une longueur d'avance.`];
  if(+L.rating>=7.4) return [`${n} éblouit la ${L.lg}`,`Note moyenne de ${L.rating} : une saison de patron.`];
  if(L.apps<8) return [`Où est passé ${n} ?`,`Seulement ${L.apps} apparition(s). Le banc lui colle à la peau.`];
  if(!L.obj.ok&&L.rank>=9) return [`${c} au fond du trou`,`Saison cauchemar : ${L.rank}e place.`];
  if(+L.rating<6.2) return [`${n} en panne`,`Note moyenne de ${L.rating}. Les supporters attendent mieux.`];
  if(p.age<=19&&L.apps>=15) return [`${n}, la pépite qui monte`,`Déjà ${L.apps} matchs à ${p.age} ans. Les recruteurs prennent des notes.`];
  return [`Saison honnête pour ${n}`,`${L.rank}e avec ${c}, ${L.apps} matchs, note moyenne de ${L.rating}.`];
}

/* ============ Cérémonie du Ballon d'Étoile ============ */
function ballonPodium(star,rival,rating,tr){
  const rivalWon = !!rival?.note?.includes("Ballon");
  if(!(p.lvl>=80||star||rivalWon)) return null;
  const yEnd = p.year+1, codes = Object.keys(COUNTRIES), POSN = ["ATT","MIL","DEF","GB"];
  /** @type {any[]} */
  const cands = [{n:p.name,c:p.country,club:p.club.name,me:true,s:p.lvl+(+rating)*3+tr*2+(star?100:0)}];
  if(p.rival&&!p.rival.retired) cands.push({n:p.rival.name,c:p.rival.country,club:p.rival.club.name,rival:true,s:p.rival.lvl+R(0,8)+(rivalWon?100:0)});
  for(let i=0;i<4;i++){
    const h = hashStr("etoile"+yEnd+i), big = CLUBS.filter(c=>c.str>=82);
    cands.push({n:FIRST[h%FIRST.length]+" "+LAST[(h>>>7)%LAST.length],c:codes[(h>>>3)%codes.length],club:big[(h>>>11)%big.length].name,pos:POSN[(h>>>5)%4],s:84+(h%100)/10});
  }
  if(!star&&!rivalWon) cands.slice(-4).sort((a,b)=>b.s-a.s)[0].s += 100;
  cands.sort((a,b)=>b.s-a.s);
  return {top:cands.slice(0,5),myRank:cands.findIndex(x=>x.me)+1,year:yEnd};
}
function ballonHtml(B){
  const medal = ["🥇","🥈","🥉"];
  return `<div class="card podium"><h3>🌟 Ballon d'Étoile ${B.year}</h3>
    ${[2,1,0].map((i,j)=>{ const x = B.top[i]; return `<div class="pl ${x.me?"me":""}" style="animation-delay:${.4+j*.8}s"><span class="md">${medal[i]}</span>${flag(x.c)} <b>${esc(x.n)}</b>${x.me?" (toi)":x.rival?" ⚔️ ton rival":""}<small>${esc(x.club)}</small></div>`; }).join("")}
    ${B.myRank>3?`<p class="muted" style="margin:8px 0 0">Tu termines ${B.myRank}e du vote.</p>`:""}</div>`;
}

/* ============ Saison rapide ============ */
function fxValue(fx){
  if(!fx) return 0;
  const w = {lvl:4,pot:2,form:.3,moral:.3,rep:.5,play:.35,trust:.3,nat:.2};
  let v = 0;
  for(const k in w) if(typeof fx[k]==="number") v += fx[k]*w[k];
  if(typeof fx.money==="number") v += fx.money*.01;
  if(fx.retire) v -= 100;
  return v;
}
function bestChoice(e){
  let bi = 0, bv = -1e9;
  e.ch.forEach((c,i)=>{
    if(c.cond&&!c.cond()) return;
    let v;
    if(c.risk){
      const pr = clamp((typeof c.risk.p==="function"?c.risk.p():c.risk.p)*(p.hard?.85:1)+(has(EVENT_TALENT[e.id])?.15:0),0,1);
      v = pr*fxValue(c.risk.good)+(1-pr)*fxValue(c.risk.bad);
    } else v = fxValue(c.fx);
    if(v>bv){ bv = v; bi = i; }
  });
  return bi;
}
function quickSeason(){
  const so = soundOn; soundOn = false; ui.quick = true;
  let guard = 0, paused = false;
  while(guard++<80&&!p.retired&&["goal","event","match","ordinaire"].includes(p.phase)){
    if(p.urgent){ urgentAnswer(0); continue; }
    if(p.phase==="goal"){ if(!p.goalOpts) p.goalOpts = goalOptions(); setGoal(0); continue; }
    if(p.phase==="event"){
      if(!p.curEv) eventScreen();
      const e = EVENTS.find(x=>x.id===p.curEv);
      if(e.seedOnly){ paused = true; break; }
      choose(bestChoice(e)); continue;
    }
    const m = p.match;
    if(m.awaitTactic) setTactic(m.us>m.them?"def":m.us<m.them?"att":"eq");
    else if(m.talk) matchTalk(bestTalk(m));
    else if(m.pending) matchNext();
    else { const a = matchActions()[m.tpl[m.step]]; let bi = 0, bv = -1; a.o.forEach((o,i)=>{ const q = o.p+talentBonus(o.t); if(q>bv){ bv = q; bi = i; } }); matchPick(bi); }
  }
  soundOn = so; ui.quick = false;
  document.querySelectorAll(".confetti").forEach(x=>x.remove());
  if(paused) ui.toast = `<div class="seed">⏸️ Saison rapide en pause : un écho du passé attend ta décision.</div>`;
  route();
}
const quickBtn = ()=>`<button class="btn ghost" onclick="quickSeason()">⏩ Saison rapide<small>Le jeu choisit pour toi jusqu'au bilan de la saison</small></button>`;

/* ============ Fil d'actualité du football ============ */
function worldNews(){
  const star = ()=>pick(FIRST)+" "+pick(LAST), big = CLUBS.filter(c=>c.str>=80), any = ()=>pick(CLUBS);
  const a = pick(big), b = pick(big.filter(c=>c.name!==a.name)), c = any(), lg = COUNTRIES[c.country].league;
  const pool = [
    `Transfert record : ${star()} quitte le ${a.name} pour le ${b.name} contre ${RI(90,190)} M€.`,
    `Le ${c.name} remporte la ${lg} pour la ${RI(2,31)}e fois de son histoire.`,
    `${star()} annonce sa retraite à ${RI(34,40)} ans, après ${RI(600,900)} matchs.`,
    `L'entraîneur du ${any().name} est limogé après ${RI(5,9)} défaites de suite.`,
    `Insolite : un gardien marque de ${RI(60,95)} mètres en ${COUNTRIES[pick(Object.keys(COUNTRIES))].league}.`,
    `${star()}, 17 ans, devient le plus jeune buteur de l'histoire du ${any().name}.`,
    `Le ${any().name} inaugure un stade de ${RI(40,80)} 000 places.`,
    `${star()} suspendu ${RI(2,6)} matchs pour un geste d'humeur envers l'arbitre.`,
    `${COUNTRIES[pick(Object.keys(COUNTRIES))].name} change de sélectionneur avant le prochain tournoi.`,
    `Le ${any().name}, promu, termine sur le podium. Le conte de fées de la saison.`
  ];
  return shuffle(pool).slice(0,3);
}
const newsHtml = n=>`<div class="card news"><h3>🌐 Ailleurs dans le monde du foot</h3><ul class="log">${n.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`;

/* ============ Calendrier : la saison match par match ============ */
// 38 journées cohérentes avec le classement final : victoires, nuls, défaites, tes matchs joués et tes buts (ou clean sheets)
function seasonCalendar(rank,apps,mine,injury){
  const pts = clamp(Math.round(88-(rank-1)*6.5+R(-4,4)),18,98), draws = RI(5,11), wins = clamp(Math.round((pts-draws)/3),0,38-draws);
  const res = shuffle([...Array(wins).fill("w"),...Array(draws).fill("d"),...Array(Math.max(0,38-wins-draws)).fill("l")]);
  // blessure : une période d'absence d'un seul tenant ; sinon les matchs sans toi sont éparpillés (banc, rotation)
  let played = new Array(38).fill(false);
  if(injury&&apps<38){ const miss = 38-apps, start = RI(4,Math.max(4,37-miss)); played = played.map((_,i)=>i<start||i>=start+miss); }
  else shuffle([...Array(38).keys()]).slice(0,apps).forEach(i=>played[i] = true);
  const cal = res.map((r,i)=>({r,on:played[i],g:0,inj:injury&&!played[i]}));
  const mine0 = cal.filter(c=>c.on);
  for(let k=0;k<mine;k++){ if(!mine0.length) break; const c = pick(mine0.filter(x=>x.r!=="l").length&&chance(.75)?mine0.filter(x=>x.r!=="l"):mine0); c.g++; }
  let best = 0, cur = 0; for(const c of cal){ cur = c.r==="w"?cur+1:0; best = Math.max(best,cur); }
  return {days:cal,pts,best};
}
function calendarHtml(C){
  const gk = p.pos==="GB", lbl = {w:"Victoire",d:"Nul",l:"Défaite"};
  return `<div class="card"><h3>📅 Ta saison match par match</h3>
    <div class="cal" role="list">${C.days.map((c,i)=>`<span role="listitem" class="cal-d ${c.r}${c.on?"":" off"}" style="animation-delay:${i*25}ms" title="J${i+1} · ${lbl[c.r]}${c.on?(c.g?` · ${gk?"🧤":"⚽"}×${c.g}`:""):c.inj?" · blessé":" · sans toi"}">${c.on?(c.g?(gk?"🧤":"⚽").repeat(Math.min(2,c.g)):""):c.inj?"🩹":"·"}</span>`).join("")}</div>
    <p class="muted" style="margin:8px 0 0;font-size:.85rem">${C.pts} points · plus longue série : ${C.best} victoire${C.best>1?"s":""} · <span class="cal-key"><i class="w"></i>victoire <i class="d"></i>nul <i class="l"></i>défaite</span></p></div>`;
}
