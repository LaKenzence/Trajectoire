// Trajectoire · Intersaison : offres, négociation, enchères
/* ============ Intersaison ============ */
// l'âge où le corps dit stop : les gardiens et les athlètes durent plus longtemps, les corps fragiles et les fêtards moins
function bodyAge(){ return 35+(p.pos==="GB"?3:0)+(p.trait==="athl"?2:0)+(has("acier")?1:0)-(defiOn("verre")?2:0)-(p.life==="fete"?1:0); }
function makeOffers(){
  const offers = [];
  if(defiOn("fidele")) return offers; // un club, une vie : personne ne vient frapper à la porte
  const reach = p.lvl+4+p.rep/12+agentOf().reach;
  const cand = CLUBS.filter(c=>c.name!==p.club.name && c.str<=reach && c.str>=p.lvl-14 && clubAllowed(c));
  const n = Math.max(0,RI(0,3)+agentOf().offers-Math.max(0,p.age-(bodyAge()-3)));
  for(const c of shuffle(cand).slice(0,n)){
    const sal = Math.round(Math.pow(Math.max(c.str-35,5),2)*.9*(1+p.rep/80)*(p.age<21?.6:1));
    offers.push({club:c,years:p.age>=31?RI(1,2):RI(2,5),salary:sal,loan:false});
  }
  if(p.flags.forceDepart||p.flags.clauseNext){ // une porte ouverte par un choix passé ou une clause
    delete p.flags.clauseNext;
    const big = shuffle(CLUBS.filter(c=>c.str>p.club.str&&c.str<=p.lvl+8&&clubAllowed(c)&&!offers.some(o=>o.club.name===c.name)))[0];
    if(big) offers.push({club:big,years:RI(3,5),salary:Math.round(Math.pow(Math.max(big.str-35,5),2)*(1+p.rep/80)),loan:false});
    delete p.flags.forceDepart;
  }
  const hc = homecomingOffer(); if(hc&&!offers.some(o=>o.club.name===hc.club.name)) offers.push(hc);
  if(p.contract>=1&&!p.loanFrom&&(p.flags.wantLoan||(p.age<=22&&p.last.apps<15))){
    const lc = shuffle(CLUBS.filter(c=>c.str<p.club.str-4&&c.str>=p.lvl-8&&clubAllowed(c)))[0];
    if(lc) offers.push({club:lc,years:1,salary:p.salary,loan:true});
  }
  return offers.sort((a,b)=>b.club.str-a.club.str);
}
function toOffseason(){
  p.phase="offseason"; p.age++; p.year++; p.contract--;
  ui.confettiShown = false;
  if(p.loanFrom && p.contract<=0){ // fin de prêt : retour au club d'origine
    p.club = p.loanFrom.club; p.contract = p.loanFrom.contract-1; p.salary = p.loanFrom.salary; p.loanFrom = null;
    p.note = `Fin du prêt : retour à ${p.club.name}.`;
  } else p.note = null;
  p.offers = makeOffers();
  phoneRumors(p.offers);
  if(p.offers.length&&p.agent!=="aucun") msg("agent",`${p.offers.length} club${p.offers.length>1?"s ont":" a"} fait une offre : ${p.offers.slice(0,2).map(o=>o.club.name).join(", ")}${p.offers.length>2?"…":""}. On en parle ?`);
  p.auctionDone = false; p.auction = null; p.summer = null; p.tourney = null; p.match = null;
  p.flags.wantLoan=false;
  const canRenew = defiOn("fidele")&&!p.loanFrom ? p.age<35||(p.lvl>=p.club.str-8&&p.age<38) : p.lvl>=p.club.str-8 && p.age<bodyAge()+2 && (p.age<bodyAge()-2||chance(.6));
  p.renew = p.contract<=0 && canRenew ? {years:p.age>=31?1:RI(2,4),salary:Math.round(Math.max(p.salary*R(1.05,1.4),Math.pow(Math.max(p.club.str-35,5),2)*.8*(1+p.rep/90)))} : null;
  if(p.flags.adieu) { p.retired = "Dernière saison bouclée, sous les applaudissements"; }
  else if(p.age>=Math.min(42,bodyAge()+5)) { p.retired = `Retraite à ${p.age} ans : le corps a dit stop`; }
  else if(defiOn("fidele") && p.contract<=0 && !p.renew){ p.retired = `Fin de l'aventure à ${p.club.name} : le club ne te prolonge pas`; }
  else if(p.contract<=0 && !p.renew && !p.offers.length){
    if(p.age>=31) p.retired = "Plus aucun club ne s'est manifesté";
    else p.offers = [fallbackOffer()]; // un club modeste finit toujours par appeler
  }
  if(!p.retired&&(chance(.3)||urgentDue("ete"))) maybeUrgent("ete");
  save(); route();
}
function fallbackOffer(){
  const c = shuffle(CLUBS.filter(x=>x.str<=p.lvl+2&&x.name!==p.club.name&&clubAllowed(x))).sort((a,b)=>b.str-a.str)[0] || CLUBS.reduce((a,b)=>a.str<b.str?a:b);
  return {club:c,years:p.age>=31?1:2,salary:Math.round(Math.pow(Math.max(c.str-35,5),2)*.6),loan:false};
}
function offseasonScreen(){
  if(p.contract<=0&&!p.renew&&!(p.offers||[]).length&&!defiOn("fidele")) p.offers = [fallbackOffer()];
  const free = p.contract<=0;
  const o = p.offers||[];
  let h = `${tip("summer")}<div class="mercato-banner" aria-hidden="true"></div><div class="muted">Été ${p.year}</div><div class="card"><h2>Intersaison</h2>
    ${p.note?`<p>${p.note}</p>`:""}
    <p>${free?`Ton contrat avec <b>${esc(p.club.name)}</b> est terminé.`:`Il te reste <b>${p.contract} an(s)</b> de contrat à ${esc(p.club.name)} (${money(p.salary)}/an).`}</p>`;
  if(!free) h += `<button class="btn primary" onclick="stay()">Rester à ${esc(p.club.name)}</button>`;
  if(p.renew) h += `<button class="btn primary" onclick="sign(-1)">Prolonger à ${esc(p.club.name)}<small>${p.renew.years} an(s) · ${money(p.renew.salary)}/an</small></button>`;
  if(o.length){
    h += `<h3 style="margin-top:16px">${o.length} offre(s) reçue(s)</h3>`;
    o.forEach((x,i)=>{
      const d = p.lvl-x.club.str;
      const hint = d>=4?"Titulaire assuré":d>=-2?"Place à prendre":d>=-7?"Forte concurrence":"Rôle de remplaçant probable";
      const rv = rivalActive()&&p.rival.club.name===x.club.name?" · ⚔️ club de ton rival":"";
      h += `<button class="btn offer" onclick="sign(${i})">${crest(x.club,40)}<span class="of-main"><b>${x.loan?"🔁 Prêt · ":""}${esc(x.club.name)}</b>
        <small>${flag(x.club.country)} ${COUNTRIES[x.club.country].league} · force ${x.club.str}${rv}</small>
        <span class="of-tags">${x.home?`<span class="tag ok">❤️ Retour aux sources</span>`:""}<span class="tag">${x.loan?"1 saison":x.years+" an(s)"}</span>${x.loan?"":`<span class="tag">${money(x.salary)}/an</span>`}<span class="tag ${d>=-2?"ok":"warn"}">${hint}</span></span></span></button>`;
    });
    const bigOffers = o.filter(x=>!x.loan);
    if(bigOffers.length>=2&&!p.auctionDone) h += `<button class="btn" style="text-align:center;border-color:var(--accent)" onclick="auctionStart()">⚔️ Faire jouer la concurrence<small>${esc(bigOffers[0].club.name)} contre ${esc(bigOffers[1].club.name)}</small></button>`;
  } else if(defiOn("fidele")) h += `<p class="muted">❤️ Un club, une vie : tu ne regardes même pas les offres des autres clubs.</p>`;
  else if(!p.renew && !free) h += `<p class="muted">Aucune offre cet été.</p>`;
  if(p.age>=bodyAge()-3) h += `<button class="btn ghost" onclick="retire()">Prendre ma retraite</button>`;
  h += `</div>`;
  render(h+rehabCard()+summerCard()+talentsCard());
}
const talentCost = ()=>1+Math.floor((p.talents||[]).length/3);
function talentsCard(){
  const owned = p.talents||[], cost = talentCost(), tp = p.tp||0;
  const avail = Object.entries(TALENTS).filter(([k,t])=>!owned.includes(k)&&t.pos.includes(p.pos));
  return `<div class="card"><h3>🧩 Talents · ${tp} point${tp>1?"s":""}</h3>
    <p class="muted" style="margin-top:0;font-size:.88rem">Tu gagnes des points en réussissant tes objectifs, en remportant des trophées et pendant tes jeunes années. Prochain talent : ${cost} point${cost>1?"s":""}.</p>
    ${owned.length?`<div style="margin-bottom:8px">${owned.map(k=>`<span class="tag">${TALENTS[k].i} ${TALENTS[k].n}</span>`).join("")}</div>`:""}
    ${avail.map(([k,t])=>`<button class="btn" ${tp<cost?"disabled style='opacity:.45;cursor:default'":""} onclick="learn('${k}')">${t.i} ${t.n}<small>${t.d}</small></button>`).join("")||'<p class="muted">Tu maîtrises tous les talents de ton poste !</p>'}</div>`;
}
function learn(k){
  const cost = talentCost();
  if((p.tp||0)<cost||has(k)) return;
  p.tp -= cost; p.talents = (p.talents||[]).concat(k);
  p.moments.push(`${p.year} · Nouveau talent : ${TALENTS[k].n}`);
  save(); offseasonScreen();
}

/* --- Négociation de contrat, en direct --- */
// Le directeur sportif a une patience limitée : chaque demande l'entame, un refus encore plus. À zéro, il retire l'offre.
const NEGO_ASKS = {
  plus10:{t:"Demander 10 % de plus",d:"Une demande raisonnable",pr:.15,cost:12,fx:x=>{ x.salary = Math.round(x.salary*1.1); }},
  plus25:{t:"Demander 25 % de plus",d:"Ça va le crisper",pr:-.12,cost:28,fx:x=>{ x.salary = Math.round(x.salary*1.25); }},
  titulaire:{t:"Exiger la promesse d'être titulaire",d:"Gros bonus de temps de jeu la première saison",pr:-.08,cost:18,ok:x=>!x.titulaire,fx:x=>{ x.titulaire = true; }},
  clause:{t:"Ajouter une clause de départ",d:"Un grand club pourra te recruter l'été suivant",pr:.02,cost:15,ok:x=>!x.clause,fx:x=>{ x.clause = true; }},
  bluff:{t:"Bluffer : « Un autre club offre bien plus »",d:"Il te croit… ou il se vexe",pr:-.05,cost:10,ok:()=>p.offers.filter(o=>!o.loan).length>=2,fx:x=>{ x.salary = Math.round(x.salary*1.15); }}
};
function negoScreen(i){
  const x = p.offers[i], d = p.lvl-x.club.str;
  if(!p.nego||p.nego.i!==i) p.nego = {i,base:clamp(.5+d*.03+agentOf().nego+(has("charisme")?.1:0)+(p.rep-40)*.004,.12,.9),patience:100,round:0,log:[],used:{}};
  const N = p.nego, pat = N.patience;
  const face = pat>70?"🙂":pat>40?"😐":pat>15?"😤":"🤬";
  const odds = k=>{ const q = N.base+NEGO_ASKS[k].pr-N.round*.04; return q>=.6?"Il devrait accepter":q>=.4?"Ça peut passer":"Très risqué"; };
  render(`<div class="muted">Été ${p.year} · négociation</div>
    <div class="card"><h2>${crest(x.club,26)} ${esc(x.club.name)}</h2>
    <p>Offre actuelle : <b>${x.years} an(s)</b> à <b>${money(x.salary)}/an</b>${x.titulaire?" · <b>titulaire promis</b>":""}${x.clause?" · <b>clause de départ</b>":""}.</p>
    <div class="nego"><span class="nego-face" aria-hidden="true">${face}</span><div><b>Patience du directeur sportif</b><div class="bar"><div class="t"><div class="f" style="width:${pat}%;background:${pat>40?"var(--good)":pat>15?"#ff9f5a":"var(--bad)"}"></div></div></div></div></div>
    ${N.log.length?`<ul class="mlog">${N.log.map(l=>`<li>${l}</li>`).join("")}</ul>`:""}
    <button class="btn primary" onclick="negoSign()">Signer à ces conditions</button>
    ${Object.entries(NEGO_ASKS).filter(([k,a])=>(!a.ok||a.ok(x))&&!(k==="bluff"&&N.used.bluff)).map(([k,a],n)=>`<button class="btn" onclick="negoAsk('${k}')"><kbd>${n+1}</kbd>${a.t}<small>${a.d} · ${odds(k)}</small></button>`).join("")}
    <button class="btn ghost" onclick="p.nego=null;offseasonScreen()">← Revoir les autres offres</button></div>`);
}
function negoAsk(k){
  const N = p.nego, x = p.offers[N.i], a = NEGO_ASKS[k];
  N.round++; N.used[k] = true;
  if(chance(N.base+a.pr-(N.round-1)*.04)){ a.fx(x); N.patience -= a.cost; N.log.push(`✅ ${a.t} : « D'accord. »`); }
  else { N.patience -= Math.round(a.cost*(k==="bluff"?3:1.6)); N.log.push(`❌ ${a.t} : « Hors de question. »`); }
  if(N.patience<=0){
    p.offers.splice(N.i,1); p.nego = null;
    p.note = `😬 Le directeur sportif du ${x.club.name} a perdu patience et retire son offre.`;
    save(); return offseasonScreen();
  }
  save(); negoScreen(N.i);
}
function negoSign(){
  const N = p.nego, x = p.offers[N.i];
  if(N.log.some(l=>l.startsWith("✅"))) p.moments.push(`${p.year} · Négociation réussie avec ${x.club.name}`);
  sign(N.i,true);
}
function startSeason(){
  if(runSeed()) seedRng(runSeed()+":"+p.seasons.length);
  if(p.story) p.story.news = null;
  p.phase="goal"; p.evIdx=0; p.evCount=3; p.curEv=null; p.goal=null; p.nego=null;
  p.tmp={play:p.starterPromise?12:0}; p.starterPromise=false; ui.seenThisSeason=[];
  p.cdc = cdcQualified()?newCdc():null;
  if(p.cdc) p.phase = "tirage";
  route();
}
function goalScreen(){
  if(!p.goalOpts) p.goalOpts = goalOptions();
  render(`<div class="muted">Saison ${p.year}-${String(p.year+1).slice(2)} · avant la reprise</div>
    ${tip("goal")}<div class="card"><h2>🎯 Ton objectif personnel</h2>
    <p class="story">Choisis l'objectif que tu te fixes pour cette saison. S'il est atteint : réputation, moral et un point de talent en plus.</p>
    ${p.goalOpts.map((g,i)=>`<button class="btn" onclick="setGoal(${i})"><kbd>${i+1}</kbd>${esc(g.t)}</button>`).join("")}</div>${quickBtn()}`);
}
function setGoal(i){ p.goal = p.goalOpts[i]; p.goalOpts = null; p.phase = "event"; route(); }
function stay(){ startSeason(); }
function sign(i,final){
  if(i===-1){ p.contract=p.renew.years; p.salary=p.renew.salary; p.moments.push(`${p.year} · Prolongation à ${p.club.name}`); return startSeason(); }
  const x = p.offers[i];
  if(!x.loan&&!final) return negoScreen(i);
  if(x.loan){ p.loanFrom={club:p.club,contract:p.contract,salary:p.salary}; p.contract=1; }
  else { p.contract=x.years; p.salary=x.salary; p.loanFrom=null; if(x.titulaire) p.starterPromise = true; if(x.clause) p.flags.clauseNext = true; }
  const big = x.club.str>p.club.str+6;
  if(!x.loan) clubLeave(p.club,x.club,p.contract>0);
  p.moments.push(x.home?`${p.year} · Retour aux sources au ${x.club.name}, où les supporters ne l'ont jamais oublié`:`${p.year} · ${x.loan?"Prêté":"Transféré"} à ${x.club.name}${big?" (grand bond en avant)":""}`);
  p.club = {...x.club};
  if(!p.clubsHist.includes(x.club.name)) p.clubsHist.push(x.club.name);
  p.flags.cap=false;
  p.rel = newRel();
  startSeason();
}
function retire(){ p.retired="Retraite choisie"; route(); }

/* ============ Bataille d'enchères ============ */
function auctionStart(){
  const big = (p.offers||[]).filter(o=>!o.loan).slice(0,2);
  p.auction = {names:big.map(o=>o.club.name),round:0,log:[]};
  save(); auctionScreen();
}
const offerIdx = name=>p.offers.findIndex(o=>o.club.name===name&&!o.loan);
function auctionScreen(){
  const A = p.auction, live = A.names.filter(n=>offerIdx(n)>=0);
  render(`<div class="muted">Été ${p.year} · bataille d'enchères</div>
    <div class="card"><h2>⚔️ ${live.length>1?"Deux clubs se disputent ta signature":"Il n'en reste qu'un"}</h2>
    ${A.log.length?`<ul class="mlog">${A.log.map(l=>`<li>${l}</li>`).join("")}</ul>`:`<p class="story">Ton agent fait savoir aux deux clubs qu'ils ne sont pas seuls. À toi de décider jusqu'où tu fais monter les prix.</p>`}
    ${live.map(n=>{ const i = offerIdx(n), x = p.offers[i]; return `<button class="btn" onclick="p.auctionDone=true;sign(${i},true)">${crest(x.club,22)} Signer au ${esc(x.club.name)} <span class="muted">(${x.club.str})</span><small>${x.years} an(s) · ${money(x.salary)}/an</small></button>`; }).join("")}
    ${live.length>1&&A.round<3?`<button class="btn primary" onclick="auctionRaise()">Faire monter les enchères (tour ${A.round+1}/3)<small>Chaque club peut surenchérir… ou abandonner</small></button>`:""}
    <button class="btn ghost" onclick="p.auctionDone=true;offseasonScreen()">← Revenir aux offres</button></div>`);
}
function auctionRaise(){
  const A = p.auction; let dropped = false;
  if(A.names.filter(x=>offerIdx(x)>=0).length<2||A.round>=3) return auctionScreen();
  A.round++;
  for(const n of shuffle(A.names.filter(x=>offerIdx(x)>=0))){
    const i = offerIdx(n), x = p.offers[i];
    const interest = clamp(.55+(p.lvl-x.club.str)*.04+p.rep*.004+agentOf().auction,.15,.92);
    if(!dropped&&!chance(interest)){ dropped = true; p.offers.splice(i,1); A.log.push(`❌ Le ${esc(n)} jette l'éponge.`); continue; }
    const r = R(1.08,1.22); x.salary = Math.round(x.salary*r);
    A.log.push(`📈 Le ${esc(n)} monte à ${money(x.salary)}/an (+${Math.round((r-1)*100)} %).`);
  }
  save(); auctionScreen();
}
