// Trajectoire · Le match clé joué en direct : actions, mi-temps, mini-terrain
/* ============ Match clé en direct ============ */
function setupMatch(){
  const c = p.club, lg = CLUBS.filter(x=>x.country===c.country&&x.name!==c.name);
  let type, opp;
  const nat = COUNTRIES[p.country].nat;
  if((p.year+1)%4===2&&p.age>=19&&p.caps>0&&p.lvl>=nat-6&&chance(clamp((nat-74)*.03+.12,.08,.45))){ type="monde"; const oc = pick(Object.keys(COUNTRIES).filter(k=>k!==p.country&&COUNTRIES[k].nat>=80)); opp = {name:COUNTRIES[oc].name,country:oc,str:COUNTRIES[oc].nat}; }
  else if(p.cdc&&chance(clamp((c.str-74)*.025,.05,.3))){ type="cdc"; opp = pick(CLUBS.filter(x=>x.country!==c.country&&x.str>=80)); }
  else if(rivalActive()&&p.rival.club.name!==c.name&&p.age>=17&&chance(.35)){ type="rival"; opp=p.rival.club; }
  else if(chance(clamp(.15+(c.str-55)*.012,.15,.5))){ type="final"; opp=pick(lg.filter(x=>x.str>=c.str-8))||pick(lg); }
  else { type="derby"; opp=lg.sort((a,b)=>Math.abs(a.str-c.str)-Math.abs(b.str-c.str))[RI(0,2)]; }
  const title = {cdc:"Finale de la Coupe des Champions",monde:`Finale du Championnat du Monde face à ${opp.name}`,final:"Finale de la Coupe nationale",derby:`Derby face au ${opp.name}`,rival:`Le choc face à ${p.rival?.name}`}[type];
  const mins = [RI(8,25),RI(30,44),RI(55,70),RI(78,90)];
  const m = p.match = {type,title,usStr:type==="monde"?nat:c.str,weather:pick(WEATHER),crowd:Math.round((type==="monde"?82000:type==="cdc"?70000:c.str*720)*R(.72,1)),opp:{...opp},us:0,them:0,step:0,mins,tpl:[],log:[],myG:0,myA:0,perf:0,pending:null,calm:false};
  m.tpl = freshOrder(matchActions().length); // les situations les moins récemment vues d'abord
  if(p.lvl<c.str-9&&p.age>=18){ m.step=2; m.log.push("🪑 Tu commences sur le banc. Le coach te lance à l'heure de jeu."); }
  simGap(0,m.mins[m.step]);
}
function simGap(from,to){
  const m = p.match, d = (m.usStr||p.club.str)-m.opp.str, span = (to-from)/90;
  const tm = from>=45&&m.tactic==="att"?[1.35,1.3]:from>=45&&m.tactic==="def"?[.7,.6]:[1,1];
  const lu = span*clamp(1.05+d*.035,.25,2.2)*.75*tm[0], lt = span*clamp(1.05-d*.035,.25,2.2)*.75*(m.calm?.5:1)*tm[1];
  m.calm = false;
  const evs = [];
  const rf = [(m.redThem?1.3:1)*(m.redUs?.7:1),(m.redUs?1.3:1)*(m.redThem?.7:1)];
  if(!m.redUs&&!m.redThem&&span>.15&&chance(.06)){ const mine = chance(.5); if(mine) m.redUs = true; else m.redThem = true; m.log.push(`🟥 ${RI(from+1,Math.max(from+1,to-1))}' Carton rouge ${mine?"pour un de tes coéquipiers":`pour un joueur du ${m.opp.name}`} !`); }
  for(let i=poisson(lu*rf[0]);i>0;i--) evs.push({min:RI(from+1,Math.max(from+1,to-1)),us:true});
  for(let i=poisson(lt*rf[1]);i>0;i--) evs.push({min:RI(from+1,Math.max(from+1,to-1)),us:false});
  const half = ()=>{ if(!m.half){ m.half=true; m.log.push(`⏸️ Mi-temps : ${m.us}-${m.them}`); } };
  evs.sort((a,b)=>a.min-b.min).forEach(e=>{
    if(e.min>45) half();
    if(e.us){ m.us++; m.log.push(`⚽ ${e.min}' But de ton équipe ! (${pick(GOAL_US)})`); }
    else { m.them++; m.log.push(`🔴 ${e.min}' But du ${m.opp.name} (${pick(GOAL_THEM)}).`); }
  });
  if(to>45) half();
}
function matchActions(){
  const m = p.match;
  const b = clamp(.45+(p.lvl-m.opp.str)*.012+(p.form-60)*.002+(p.moral-50)*.003-(p.hard?.06:0)+(m.boost||0),.15,.85);
  const tech = p.trait==="tech"?.12:0, inst = p.trait==="inst"?.1:0, ath = p.trait==="athl"?.1:0;
  return {
   ATT:[
    {txt:"Tu reçois le ballon dans la surface, dos au but.",o:[
      {t:"Pivoter et frapper",p:b-.12+inst,ok:{us:1,me:"g",txt:"Pivot, frappe sèche, filets !"},ko:{txt:"Ta frappe est contrée."}},
      {t:"Remiser pour le milieu qui arrive",p:b+.08,ok:{us:.55,me:"a",txt:"Remise parfaite…"},ko:{txt:"La remise est interceptée."}},
      {t:"Chercher le contact",p:.35,ok:{us:.78,me:"g",txt:"Penalty ! Tu prends le ballon…"},ko:{txt:"Carton jaune pour simulation.",moral:-2}}]},
    {txt:"Contre-attaque : tu te retrouves seul face au gardien.",o:[
      {t:"Frapper fort au premier poteau",p:b,ok:{us:1,me:"g",txt:"Imparable !"},ko:{txt:"Le gardien repousse du pied."}},
      {t:"Dribbler le gardien",p:b-.08+ath,ok:{us:1,me:"g",rep:2,txt:"Crochet, but dans le but vide. Le stade chavire."},ko:{txt:"Le gardien te chipe le ballon."}},
      {t:"Tenter le lob",p:b-.16+tech*1.5,ok:{us:1,me:"g",rep:3,txt:"Lob somptueux ! Ça tournera en boucle."},ko:{txt:"Trop long, au-dessus."}}]},
    {txt:"Centre tendu venu de la droite.",o:[
      {t:"Plonger de la tête",p:b-.05+ath,ok:{us:1,me:"g",txt:"Tête plongeante, but !"},ko:{txt:"Juste à côté."}},
      {t:"Contrôle et reprise",p:b-.1+tech,ok:{us:1,me:"g",txt:"Contrôle orienté, reprise : but !"},ko:{txt:"Le défenseur revient au dernier moment."}},
      {t:"Feinter pour un coéquipier",p:.42,ok:{us:1,me:"a",txt:"Ta feinte libère ton coéquipier qui marque."},ko:{txt:"Personne au second poteau."}}]}],
   MIL:[
    {txt:"Tu récupères le ballon au milieu, leur défense est haute.",o:[
      {t:"Passe en profondeur",p:b+tech,ok:{us:.8,me:"a",txt:"Caviar ! Ton attaquant part seul…"},ko:{txt:"Trop appuyée, le gardien sort."}},
      {t:"Frappe de 30 mètres",p:b-.28+inst*1.5,ok:{us:1,me:"g",rep:3,txt:"Une frappe de mule en pleine lucarne !"},ko:{txt:"Ça finit en tribune."}},
      {t:"Garder le ballon, calmer le jeu",p:b+.15,ok:{calm:true,txt:"Ton équipe reprend le contrôle du match."},ko:{them:.35,txt:"Tu perds le ballon. Contre adverse…"}}]},
    {txt:"Coup franc à 22 mètres, légèrement décentré.",o:[
      {t:"Le tirer directement",p:b-.25+tech*1.5,ok:{us:1,me:"g",rep:2,txt:"Par-dessus le mur, sous la barre !"},ko:{txt:"Dans le mur."}},
      {t:"Centrer au second poteau",p:b-.05,ok:{us:1,me:"a",txt:"Ton défenseur central reprend de la tête : but !"},ko:{txt:"Dégagé par la défense."}}]},
    {txt:"Leur meneur de jeu accélère au milieu.",o:[
      {t:"Faute tactique",p:.85,ok:{calm:true,txt:"Faute intelligente, jaune assumé."},ko:{them:.4,txt:"Il t'échappe quand même…"}},
      {t:"Le presser pour récupérer",p:b+ath,ok:{us:.4,me:"a",txt:"Récupération haute ! Ton équipe part en contre…"},ko:{them:.45,txt:"Il te passe, la défense est prise de vitesse…"}}]}],
   DEF:[
    {txt:"Leur attaquant part seul dans ton dos.",o:[
      {t:"Tacle glissé",p:b+ath,ok:{rep:1,txt:"Tacle parfait, ballon propre !"},ko:{them:.75,txt:"Tu le fauches. Penalty…"}},
      {t:"Temporiser et l'orienter vers l'extérieur",p:b+.1,ok:{txt:"Tu le pousses à la faute. Sortie de but."},ko:{them:.45,txt:"Il centre en retrait…"}}]},
    {txt:"Corner pour ton équipe. Tu montes dans la surface.",o:[
      {t:"Attaquer le premier poteau",p:b-.25+ath,ok:{us:1,me:"g",rep:2,txt:"Tête rageuse au premier poteau, but !"},ko:{txt:"Ta tête frôle le poteau."}},
      {t:"Faire écran sur le gardien",p:.4,ok:{us:1,txt:"Ton écran libère un coéquipier qui marque."},ko:{txt:"Faute sur le gardien."}}]},
    {txt:"Leur ailier rapide te provoque en un contre un.",o:[
      {t:"Le serrer de près",p:b+ath-.05,ok:{txt:"Tu lui prends le ballon et relances proprement."},ko:{them:.5,txt:"Il te dépose sur un crochet…"}},
      {t:"Laisser de l'espace, couper le centre",p:b+.05,ok:{txt:"Son centre est pour toi."},ko:{them:.35,txt:"Il frappe au premier poteau…"}}]}],
   GB:[
    {txt:"Face-à-face : leur avant-centre fonce vers ton but.",o:[
      {t:"Sortir dans ses pieds",p:b+ath,ok:{rep:2,txt:"Sortie autoritaire, ballon capté !"},ko:{them:.85,txt:"Il te contourne…"}},
      {t:"Rester sur ta ligne",p:b-.08,ok:{rep:1,txt:"Parade réflexe du pied !"},ko:{them:.8,txt:"Frappe croisée…"}}]},
    {txt:"Penalty pour l'adversaire !",o:[
      {t:"Plonger à gauche",p:.36+(p.lvl-70)*.004,ok:{rep:4,txt:"Arrêté ! Tu hurles de joie."},ko:{them:1,txt:"Il tire de l'autre côté."}},
      {t:"Plonger à droite",p:.36+(p.lvl-70)*.004,ok:{rep:4,txt:"Arrêté ! Tu hurles de joie."},ko:{them:1,txt:"Raté, il t'a pris à contre-pied."}},
      {t:"Rester au centre",p:.18,ok:{rep:5,txt:"Panenka captée ! Énorme."},ko:{them:1,txt:"En pleine lucarne."}}]},
    {txt:"Long ballon dans le dos de ta défense.",o:[
      {t:"Sortir de ta surface pour dégager",p:b+.05,ok:{txt:"Dégagement de la tête, propre."},ko:{them:.7,txt:"Tu manques ton intervention…"}},
      {t:"Attendre dans tes cages",p:b-.05,ok:{txt:"Tu bloques sa frappe."},ko:{them:.55,txt:"Il a tout son temps…"}},
      {t:"Capter puis relancer vite à la main",p:b-.15+tech,ok:{us:1,me:"a",txt:"Arrêt puis relance éclair : ton équipe marque en contre !"},ko:{them:.3,txt:"Ta relance est interceptée…"}}]}]
  }[p.pos].concat(moreActions(b,tech,inst,ath),extraActions(b,tech,inst,ath),bonusActions(b,tech,inst,ath)).map(tagPen).map(counterAct).map(altText);
}
// Un moment décisif doit peser autant pour tous les postes : une action défensive réussie relance
// ton équipe (contre), une action offensive ratée laisse un contre à l'adversaire.
function counterAct(a){
  a.o.forEach(o=>{
    if(!o.ok.us&&!o.ok.calm&&o.ok.ctr==null) o.ok.ctr = .5;
    if(!o.ko.them&&o.ko.ctr==null) o.ko.ctr = .2;
  });
  return a;
}
// applique le contre éventuel d'une action jouée ; renvoie le texte à ajouter
function counterRoll(r,ok){
  if(!r.ctr||!chance(r.ctr)) return null;
  return ok?pick(COUNTER_US):pick(COUNTER_THEM);
}
const COUNTER_US = ["Sur ta relance, ton équipe part en contre… et marque !","Le ballon récupéré file vers l'avant : trois passes, et c'est au fond !","Ton geste lance l'action : ton équipe punit l'adversaire en contre !"];
const COUNTER_THEM = ["L'adversaire récupère et part en contre… but.","Ballon perdu, ils remontent tout le terrain et marquent.","La sanction tombe sur le contre : but adverse."];
function matchScreen(){
  const m = p.match;
  if(m.short) return ordinaryScreen();
  matchSounds(m); ambient(true);
  const done = m.step>=m.mins.length||m.simDone;
  let body;
  if(m.awaitTactic){
    body = tacticHtml();
  } else if(m.talk){
    body = talkHtml(m);
  } else if(m.pending&&m.celebAsk){
    body = `<p class="story">${m.pending}</p><h3>🎉 Ton premier but dans un grand match ! Ta célébration ?</h3><p class="muted" style="margin-top:0;font-size:.88rem">Elle deviendra ta signature.</p>
      <div class="celebs">${Object.entries(CELEBS).map(([k,c],n)=>`<button class="btn" onclick="celebChoose('${k}')"><kbd>${n+1}</kbd>${c.i} ${c.n}</button>`).join("")}</div>`;
  } else if(m.pending){
    body = `<p class="story">${m.pending}</p><button class="btn primary" onclick="matchNext()">${m.step>=m.mins.length-1?"Fin du match →":"Continuer →"}</button>`;
  } else if(!done){
    const a = matchActions()[m.tpl[m.step]];
    if(m.sitStep!==m.step){ m.sit = situ(m,m.mins[m.step]); m.sitStep = m.step; }
    body = `<p><span class="minute">${m.mins[m.step]}'</span></p><p class="story">${m.sit||""}${a.txt}</p>
      ${a.o.map((o,i)=>{ const q = o.p+talentBonus(o.t), tb = (p.talents||[]).filter(t=>TALENTS[t].re&&TALENTS[t].re.test(o.t)).map(t=>TALENTS[t].i).join("");
        return `<button class="btn" onclick="matchPick(${i})">${choiceLead(o.t,i)}<span class="ctext">${o.t}</span>${miniChip(o)}<small>${riskHtml(q)}${tb?` · ${tb} talent`:""}</small></button>`; }).join("")}`;
  }
  render(`${tip("match")}${tip("minis")}<div class="muted">Match clé · saison ${p.year}-${String(p.year+1).slice(2)}</div>
  <div class="card"><h2 style="text-align:center">${esc(m.title)}</h2>${m.weather?`<p class="muted" style="text-align:center;margin:-4px 0 6px;font-size:.85rem">🏟️ ${m.crowd.toLocaleString("fr-FR")} spectateurs · ${m.weather}</p>`:""}
    ${(()=>{ const usName = m.type==="monde"?COUNTRIES[p.country].name:p.club.name;
      const clock = m.simDone?"FIN":m.awaitTactic?"MT":`${m.mins[Math.min(m.step,m.mins.length-1)]}'`;
      return `<div class="broadcast" aria-label="Score : ${esc(usName)} ${m.us}, ${esc(m.opp.name)} ${m.them}"><div class="bc-team">${crest(usName,30)}<span>${esc(usName)}</span></div><div class="bc-score"><b>${m.us}</b><i>–</i><b>${m.them}</b><span class="bc-clock">${clock}</span></div><div class="bc-team r"><span>${esc(m.opp.name)}</span>${crest(m.opp,30)}</div></div>`; })()}
    ${pitchSvg(m)}
    ${m.log.length?`<ul class="mlog">${m.log.map(l=>`<li>${l}</li>`).join("")}</ul>`:""}
    <div class="decide">${body||`<button class="btn primary" onclick="finishMatch()">Terminer le match →</button>`}</div></div>`);
  animateBall();
}
function matchPick(i){
  const m = p.match, a = matchActions()[m.tpl[m.step]], o = a.o[i];
  const bu = m.us, bt = m.them, bp = m.perf;
  if(o.duel&&ui.penOk==null&&!ui.quick&&minisOn("duel")){ playDuel(o.duel).then(ok=>{ ui.penOk = ok; matchPick(i); }); return; }
  if(o.pen&&ui.penOk==null&&!ui.quick&&typeof Penalty!=="undefined"&&minisOn("pen")){
    if(o.pen==="save"||o.pen==="fksave"){ playMini(o.pen,o.pen==="save"?"Penalty contre ton équipe":"Coup franc contre ton équipe",m.opp).then(ok=>{ ui.penOk = ok; matchPick(i); }); return; }
    if(o.pen==="fk"){ playMini("fk","Coup franc pour ton équipe !",m.opp).then(ok=>{ ui.penOk = ok; ui.penRes = ok; matchPick(i); }); return; }
    if(chance(clamp(o.p+talentBonus(o.t),.05,.95))){ playMini("shoot","Penalty pour ton équipe !",m.opp).then(ok=>{ ui.penOk = true; ui.penRes = ok; matchPick(i); }); return; }
    ui.penOk = false;
  }
  const min = m.mins[m.step];
  markAct(m.tpl[m.step]);
  let txt;
  const okRoll = ui.penOk!=null?ui.penOk:chance(clamp(o.p+talentBonus(o.t),.05,.95)), penRes = ui.penRes;
  ui.penOk = ui.penRes = null;
  if(okRoll){
    const r = o.ok; txt = r.txt; m.perf++;
    if(r.rep) p.rep = clamp(p.rep+r.rep,0,100);
    if(r.calm) m.calm = true;
    if(r.us){
      if(penRes!=null?penRes:chance(r.us)){
        m.us++;
        if(r.me==="g"){ m.myG++; if(m.et) p.flags.etGoal = true; m.log.push(`⚽ ${min}' BUT de ${esc(p.name)} !${p.celeb?` ${CELEBS[p.celeb].i} ${CELEBS[p.celeb].n} !`:""}`); celebrate(m); }
        else { if(r.me==="a") m.myA++; m.log.push(`⚽ ${min}' But de ton équipe${r.me==="a"?` (passe de ${esc(p.name)})`:""} !`); }
        if(r.us<1) txt += " Et c'est au fond !";
      } else txt += " …mais l'action n'aboutit pas.";
    } else {
      m.log.push(`✅ ${min}' ${esc(r.txt)}`);
      const c = counterRoll(r,true);
      if(c){ m.us++; m.log.push(`⚽ ${Math.min(min+1,90)}' But de ton équipe en contre !`); txt += " "+c; }
    }
  } else {
    const r = o.ko; txt = r.txt; m.perf--;
    if(r.moral) p.moral = clamp(p.moral+r.moral,0,100);
    if(r.them && chance(r.them)){ m.them++; m.log.push(`🔴 ${min}' But du ${m.opp.name}.`); txt += " But adverse."; }
    else if(r.them) txt += " Ouf, ça passe à côté.";
    else { const c = counterRoll(r,false); if(c){ m.them++; m.log.push(`🔴 ${Math.min(min+1,90)}' But du ${m.opp.name} en contre.`); txt += " "+c; } }
  }
  txt += reaction(okRoll,m);
  m.boost = 0;
  m.pending = txt;
  m.pendingGoal = m.us>bu?"us":m.them>bt?"them":null; m.pendingOk = m.perf>bp;
  save(); matchScreen();
}
function matchNext(){
  const m = p.match;
  if(m.short) return finishOrdinary();
  m.pending = null; m.pendingGoal = null; m.step++;
  if(m.step===2&&!m.tactic){ simGap(m.mins[1],45); m.awaitTactic = true; save(); return matchScreen(); }
  if(m.step<4){ simGap(m.mins[m.step-1],m.mins[m.step]); if(chance(.5)) m.talk = pickTalk(m); }
  else if(m.step===4&&!m.extraUsed&&!m.et&&m.us-m.them>=-1&&m.us<=m.them&&chance(.7)){ simGap(m.mins[3],90); m.extraUsed = true; m.mins[4] = 90+RI(2,6); m.log.push(`⏱️ ${m.mins[4]-90} minutes de temps additionnel. Dernière chance !`); }
  else return finishMatch();
  save(); matchScreen();
}
function finishMatch(){
  const m = p.match;
  if(!m.simDone){ if(m.et) simGap(m.mins.at(-1),120); else if(!m.extraUsed) simGap(m.mins[3],90); }
  m.simDone = true;
  if(m.us===m.them&&["final","cdc","monde"].includes(m.type)&&!m.et&&m.shootRes===undefined) return startExtraTime(m);
  if(m.us===m.them&&["final","cdc","monde"].includes(m.type)&&m.shootRes===undefined&&!ui.quick&&typeof Penalty!=="undefined"){
    m.shootRes = null; save(); ambient(false);
    playShootout(m).then(won=>{ m.shootRes = won; finishMatch(); });
    return;
  }
  let res = m.us>m.them?"w":m.us<m.them?"l":"d", tab = "";
  if(res==="d"&&["final","cdc","monde"].includes(m.type)){
    const win = m.shootRes!=null?m.shootRes:chance(clamp(.5+(p.club.str-m.opp.str)*.01+(p.pos==="GB"?(p.lvl-70)*.006:0)+(has("sangfroid")?.12:0),.2,.85));
    tab = win?" Victoire aux tirs au but !":" Défaite aux tirs au but…"; res = win?"w":"l";
  }
  const score = `${m.us}-${m.them}`;
  const fx = {w:{rep:3+(m.type==="final"?3:["cdc","monde"].includes(m.type)?7:0),moral:7},d:{moral:1},l:{moral:-5,rep:-1}}[res];
  p.rep = clamp(p.rep+(fx.rep||0)+(m.myG>=2?3:0),0,100);
  p.moral = clamp(p.moral+fx.moral,0,100);
  p.tmp.play += m.perf*2; p.tmp.rating = (p.tmp.rating||0)+m.perf*.04;
  if(m.type==="final") p.tmp.cup = res==="w";
  if(m.type==="cdc") p.tmp.cdc = res==="w";
  if(m.type==="monde") p.tmp.world = res==="w";
  if(res==="w"&&(m.type==="cdc"||m.type==="monde")) p.moments.push(`${p.year+1} · Vainqueur de la ${m.title.split(" face")[0].toLowerCase()} (${score})`);
  if(m.type==="final"&&res==="w") p.finals = (p.finals||0)+1;
  const mr = clamp(6.2+m.perf*.5+m.myG*.6+m.myA*.4+(res==="w"?.3:0),3,10).toFixed(1);
  if(m.type==="final"&&res==="w") p.moments.push(`${p.year+1} · Vainqueur de la finale de coupe (${score})`);
  if(m.type==="rival"&&p.rival){ p.rival.h2h[res]++; if(res==="w"&&m.myG+m.myA>=1) p.moments.push(`${p.year+1} · Décisif dans le choc face à ${p.rival.name} (${score})`); }
  if(m.myG>=3) p.moments.push(`${p.year+1} · Triplé lors du ${m.title.toLowerCase()}`);
  p.tmp.match = {title:m.title,score,res,myG:m.myG,myA:m.myA,tab,mr};
  phoneAfterMatch(p.tmp.match,m.type);
  p.match = null;
  p.phase = "season"; simSeason(); save();
  const label = {w:"Victoire",d:"Match nul",l:"Défaite"}[res];
  render(`<div class="card ${res==="w"?"celebrate":""}"><h2>${label} ${score}${tab}</h2>
    <p class="story">${res==="w"?(m.type==="monde"?"CHAMPION DU MONDE ! Tout un pays descend dans la rue.":m.type==="cdc"?"La Coupe des Champions est à vous ! Le sommet du football de club.":m.type==="final"?"La coupe est à vous ! Les tribunes chantent ton nom.":"Les trois points, et une soirée que tu n'oublieras pas."):res==="d"?"Un match accroché, rien de décidé.":"Une soirée à oublier… ou à retenir pour la prochaine fois."}</p>
    <ul class="mlog">${m.log.map(l=>`<li>${l}</li>`).join("")}</ul>
    <div class="stats"><div class="stat"><b style="color:${+mr>=7.5?"var(--good)":+mr<6?"var(--bad)":"var(--text)"}">${mr}</b><span>ta note</span></div>
      <div class="stat"><b>${m.myG}</b><span>but(s)</span></div><div class="stat"><b>${m.myA}</b><span>passe(s) déc.</span></div></div>
    <button class="btn primary" onclick="route()">Voir le bilan de la saison →</button>
    ${p.rep>=8?`<button class="btn" style="text-align:center" onclick="pressConference()">🎙️ Passer en conférence de presse<small>Trois questions, peu de temps pour répondre : à toi de soigner ton image</small></button>`:""}</div>`);
  if(res==="w"&&m.type!=="derby") confetti();
  ambient(false); speak(`Coup de sifflet final. ${label}, ${score}${tab}`);
  sfx("whistle"); if(res==="w"&&m.type!=="derby") setTimeout(()=>sfx("trophy"),900);
}

/* ============ Mi-temps : choix tactique ============ */
function setTactic(t){
  const m = p.match;
  m.tactic = t; m.awaitTactic = false;
  if(chance(.5)) m.talk = pickTalk(m);
  m.log.push({att:"⚔️ Consigne de mi-temps : tout pour l'attaque.",def:"🛡️ Consigne de mi-temps : on verrouille.",eq:"⚖️ Consigne de mi-temps : on garde le plan."}[t]);
  simGap(45,m.mins[2]);
  save(); matchScreen();
}
function tacticHtml(){
  return `<p><span class="minute">MT</span></p><p class="story">Mi-temps dans le vestiaire. Le coach se tourne vers les cadres : « Qu'est-ce qu'on fait ? »</p>
    <button class="btn" onclick="setTactic('att')"><kbd>1</kbd>⚔️ Tout pour l'attaque<small>Plus de buts… des deux côtés</small></button>
    <button class="btn" onclick="setTactic('eq')"><kbd>2</kbd>⚖️ Garder le plan<small>Rien ne change</small></button>
    <button class="btn" onclick="setTactic('def')"><kbd>3</kbd>🛡️ Verrouiller<small>Moins d'occasions, moins de risques</small></button>`;
}

/* ============ Mini-terrain du match clé ============ */
// Ton équipe attaque vers la droite (but adverse en x = 100). Coordonnées : 100 × 60.
// Chaque situation de match a sa mise en scène : où tu es, où est le ballon, qui t'entoure.
/** @type {[RegExp, any][]} */
const PITCH_SCENES = [
  // attaquant
  [/dos au but/,               {att:1, me:[84,31], ball:[84,31], opp:[[88,31]], mates:[[72,22],[74,40]]}],
  [/seul face au gardien/,     {alone:1, att:1, me:[80,30], ball:[82,30], opp:[[62,26],[64,36]], mates:[]}],
  [/Centre tendu/,             {att:1, me:[87,26], ball:[90,55], opp:[[89,31],[86,36]], mates:[[90,55],[80,40]]}],
  [/relance mal/,              {att:1, me:[71,33], ball:[73,33], opp:[[82,28],[80,40]], mates:[[76,18]]}],
  [/Corner rentrant/,          {att:1, me:[91,25], ball:[99,59], opp:[[91,29],[89,34],[93,22]], mates:[[99,59],[88,38]]}],
  [/tient le maillot/,         {att:1, me:[88,35], ball:[86,30], opp:[[87,37],[90,28]], mates:[[80,24]]}],
  // milieu
  [/au milieu, leur défense est haute/, {att:1, me:[50,30], ball:[51,30], opp:[[58,24],[58,38],[70,30]], mates:[[64,14],[66,44]]}],
  [/Coup franc à 22/,          {att:1, me:[73,38], ball:[76,36], opp:[[83,27],[83,30],[83,33]], mates:[[86,22]]}],
  [/meneur de jeu accélère/,   {att:0, me:[44,31], ball:[50,33], opp:[[50,33],[58,20]], mates:[[38,20],[36,42]]}],
  [/trois contre deux/,        {att:1, me:[64,30], ball:[65,30], opp:[[78,25],[78,37]], mates:[[72,16],[72,44]]}],
  [/dévié retombe/,            {att:1, me:[79,32], ball:[80,30], opp:[[86,25],[87,36]], mates:[[72,20]]}],
  [/pressing est très haut/,   {att:0, me:[18,36], ball:[19,36], opp:[[24,31],[23,44],[29,38]], mates:[[12,22]]}],
  // défenseur
  [/part seul dans ton dos/,   {att:0, me:[27,33], ball:[20,28], opp:[[20,28]], mates:[[40,20]]}],
  [/Corner pour ton équipe/,   {att:1, me:[90,26], ball:[99,1], opp:[[91,30],[88,22],[92,36]], mates:[[99,1],[86,34]]}],
  [/ailier rapide/,            {att:0, me:[22,48], ball:[29,53], opp:[[29,53],[14,32]], mates:[[16,28]]}],
  [/Coup franc adverse à vingt/,{att:0, me:[2,30], ball:[21,30], opp:[[21,30],[10,24]], mates:[[11,27],[11,30],[11,33]]}],
  [/Coup franc adverse/,       {att:0, me:[20,31], ball:[29,32], opp:[[29,32],[12,26]], mates:[[20,28],[20,34]]}],
  [/te provoque/,              {att:0, me:[16,30], ball:[38,30], opp:[[15,33],[38,30]], mates:[[16,22]]}],
  [/deux contre un/,           {att:0, me:[24,31], ball:[33,24], opp:[[33,24],[31,38]], mates:[[44,30]]}],
  // gardien
  [/Face-à-face/,              {att:0, me:[4,30], ball:[13,30], opp:[[13,30]], mates:[[24,22]]}],
  [/Penalty pour l'adversaire/,{att:0, me:[1.5,30], ball:[11,30], opp:[[12.5,30]], mates:[[20,20],[20,40]]}],
  [/Long ballon dans le dos/,  {att:0, me:[5,30], ball:[24,25], opp:[[24,25]], mates:[[22,34]]}],
  [/Frappe lointaine/,         {att:0, me:[3,30], ball:[30,28], opp:[[30,28],[16,36]], mates:[[16,24]]}],
  [/Corner tendu dans ta surface/,{att:0, me:[3,30], ball:[1,59], opp:[[8,26],[9,34],[1,59]], mates:[[7,30],[10,22]]}],
  [/passe en retrait trop courte/,{att:0, me:[6,30], ball:[10,32], opp:[[14,30]], mates:[[25,32]]}]
];
function pitchScene(m){
  const done = m.step>=m.mins.length||m.simDone;
  if(m.awaitTactic||done) return {att:1,me:null,ball:[50,30],opp:[],mates:[],rest:true};
  const a = matchActions()[m.tpl[m.step]];
  const hit = PITCH_SCENES.find(([re])=>re.test(a.scene||a.txt));
  const z = {ATT:[80,28],MIL:[56,30],DEF:[25,32],GB:[4,30]}[p.pos];
  return hit?hit[1]:{att:p.pos==="ATT"||p.pos==="MIL"?1:0,me:z,ball:z,opp:[],mates:[]};
}
// où finit le ballon une fois l'action jouée
function pitchOutcome(sc,m){
  if(m.pendingGoal==="us") return [99.4,clamp(sc.ball[1],27.5,32.5)];
  if(m.pendingGoal==="them") return [.6,clamp(sc.ball[1],27.5,32.5)];
  if(!m.pending||!sc.me) return sc.ball;
  if(sc.att) return m.pendingOk?[93,sc.ball[1]<30?26:34]:[96.5,30];
  return m.pendingOk?[clamp(sc.me[0]+18,6,60),sc.me[1]]:[7,clamp(sc.ball[1],24,36)];
}
function pitchSvg(m){
  const key = m.title+m.mins.join();
  if(ui.pitchKey!==key){ ui.pitchKey = key; ui.pitchPos = {}; }
  const sc = pitchScene(m), ball = pitchOutcome(sc,m), gk = p.pos==="GB";
  const usC = m.type==="monde"?clubColors(COUNTRIES[p.country].name):clubColors(p.club), them = clubColors(m.opp);
  const themCol = Math.abs(hashStr(m.opp.name)%360-hashStr(m.type==="monde"?COUNTRIES[p.country].name:p.club.name)%360)<40?"#f2f2f2":them.a;
  // le reste des équipes suit l'action
  const focus = sc.ball[0], shift = (focus-50)*.45;
  const fillUs = [[24,14],[24,46],[36,24],[36,36],[48,15],[48,45],[58,30]].slice(0,Math.max(0,7-sc.mates.length));
  const fillOp = [[76,14],[76,46],[64,24],[64,36],[52,16],[52,44],[42,30]].slice(0,Math.max(0,7-sc.opp.length));
  const actors = [];
  const dot = (fill,stroke)=>`<circle r="1.9" fill="${fill}" stroke="${stroke}" stroke-width=".45"/>`;
  // les joueurs de remplissage s'écartent de l'action ; sur un face-à-face, tous les adversaires sont derrière toi
  const away = (x,y)=>{ if(!sc.me) return x; if(sc.alone) return Math.min(x,sc.me[0]-14-(Math.round(y*7)%11)); return Math.hypot(x-sc.me[0],y-sc.me[1])<11?x+(sc.att?-13:13):x; };
  fillUs.forEach(([x,y],i)=>{ const fx = clamp(x+shift,8,88); actors.push({k:"fu"+i,x:clamp(away(fx,y),6,90),y,html:dot(usC.a,usC.b)}); });
  fillOp.forEach(([x,y],i)=>{ const fx = clamp(x+shift,12,92); actors.push({k:"fo"+i,x:clamp(away(fx,y),6,92),y,html:dot(themCol,"rgba(0,0,0,.45)")}); });
  sc.mates.forEach(([x,y],i)=>actors.push({k:"mu"+i,x,y,html:dot(usC.a,usC.b)}));
  sc.opp.forEach(([x,y],i)=>actors.push({k:"mo"+i,x,y,html:dot(themCol,"rgba(0,0,0,.45)")}));
  // gardiens (le tien est « TOI » si tu es gardien)
  const keeperDot = c=>`<rect x="-1.6" y="-2" width="3.2" height="4" rx="1" fill="${c}" stroke="#111" stroke-width=".35"/>`;
  actors.push({k:"opK",x:sc.att&&m.pending&&!m.pendingOk&&!m.pendingGoal?96.5:97.5,y:30,html:keeperDot("#d9e04a")});
  if(!gk) actors.push({k:"usK",x:2.5,y:30,html:keeperDot("#7fd1ff")});
  // toi
  const meBase = sc.me||{ATT:[60,30],MIL:[50,24],DEF:[30,30],GB:[3,30]}[p.pos];
  const meNow = m.pending&&m.pendingOk&&sc.me?[meBase[0]+(ball[0]-meBase[0])*.35,meBase[1]+(ball[1]-meBase[1])*.35]:meBase;
  actors.push({k:"me",x:meNow[0],y:meNow[1],html:`<circle r="3.4" fill="none" stroke="var(--accent)" stroke-width=".6"><animate attributeName="r" values="2.8;3.8;2.8" dur="1.6s" repeatCount="indefinite"/></circle>${gk?keeperDot(usC.a):`<circle r="2.2" fill="${usC.a}" stroke="#fff" stroke-width=".6"/>`}<text y="-4.4" text-anchor="middle" font-size="3.2" fill="#fff" font-weight="700" stroke="rgba(0,0,0,.6)" stroke-width=".5" paint-order="stroke">TOI</text>`});
  actors.push({k:"ball",x:ball[0],y:ball[1],html:`<circle r="1.3" fill="#fff" stroke="#111" stroke-width=".35"/>`});
  // trajectoire de l'action qui vient d'être jouée
  const trail = m.pending&&sc.me?`<line class="trail" x1="${sc.ball[0]}" y1="${sc.ball[1]}" x2="${ball[0]}" y2="${ball[1]}" stroke="${m.pendingGoal==="them"||(!m.pendingOk&&!m.pendingGoal)?"#ff6b6b":"#f5c542"}" stroke-width=".6" stroke-dasharray="1.6 1.2" stroke-linecap="round"/>`:"";
  const prev = ui.pitchPos||{}; ui.pitchNext = {};
  const groups = actors.map(a=>{ const pp = prev[a.k]||[a.x,a.y]; ui.pitchNext[a.k] = [a.x,a.y]; return `<g class="pl${a.k==="ball"?" ball":""}" data-k="${a.k}" style="transform:translate(${pp[0]}px,${pp[1]}px)">${a.html}</g>`; }).join("");
  const stripes = Array.from({length:10},(_,i)=>`<rect x="${i*10}" width="10" height="60" fill="${i%2?"#2f7d4a":"#2a7343"}"/>`).join("");
  return `<svg class="pitch" viewBox="0 0 100 60" role="img" aria-label="${sc.rest?"Les équipes au repos":`Mise en scène de l'action : tu es ${sc.att?"dans le camp adverse":"dans ton camp"}, le ballon ${m.pendingGoal==="us"?"est au fond des filets adverses":m.pendingGoal==="them"?"est au fond de tes filets":"est en jeu"}`}">
    ${stripes}
    <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".5"><rect x="1" y="1" width="98" height="58"/><line x1="50" y1="1" x2="50" y2="59"/><circle cx="50" cy="30" r="8"/><rect x="1" y="16" width="14" height="28"/><rect x="85" y="16" width="14" height="28"/><rect x="1" y="24" width="5" height="12"/><rect x="94" y="24" width="5" height="12"/><circle cx="11" cy="30" r=".5" fill="rgba(255,255,255,.7)"/><circle cx="89" cy="30" r=".5" fill="rgba(255,255,255,.7)"/></g>
    <rect x="-.5" y="26" width="1.5" height="8" fill="rgba(255,255,255,.9)"/><rect x="99" y="26" width="1.5" height="8" fill="rgba(255,255,255,.9)"/>
    <text x="3" y="5" font-size="2.6" fill="rgba(255,255,255,.55)">◀ ton but</text><text x="97" y="5" font-size="2.6" fill="rgba(255,255,255,.55)" text-anchor="end">but adverse ▶</text>
    ${trail}
    ${groups}
    ${weatherFx(m)}
    ${m.pendingGoal?`<text class="goalflash" x="50" y="34" text-anchor="middle" font-size="12" font-weight="800" fill="${m.pendingGoal==="us"?"#f5c542":"#ff6b6b"}" font-family="Barlow Condensed,Arial Narrow,sans-serif">${m.pendingGoal==="us"?"BUT !":"BUT ADVERSE"}</text>`:""}
  </svg>`;
}
// fait glisser chaque joueur et le ballon de leur ancienne position vers la nouvelle
function animateBall(){
  const next = ui.pitchNext; if(!next) return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    document.querySelectorAll(".pitch .pl").forEach((/** @type {SVGElement} */ g)=>{ const v = next[g.dataset.k]; if(v) g.style.transform = `translate(${v[0]}px,${v[1]}px)`; });
  }));
  ui.pitchPos = next;
}

/* ============ Matchs : nouvelles actions par poste ============ */
function moreActions(b,tech,inst,ath){
  return {
   ATT:[
    {txt:"Le gardien adverse relance mal, le ballon traîne à 25 mètres.",o:[
      {t:"Frappe immédiate",p:b-.15+inst,ok:{us:1,me:"g",rep:2,txt:"Une frappe instantanée qui le surprend !"},ko:{txt:"Ta frappe passe largement à côté."}},
      {t:"Contrôler et accélérer",p:b-.05+ath,ok:{us:1,me:"g",txt:"Tu files au but et conclus en force."},ko:{txt:"Un défenseur revient au sprint."}},
      {t:"Servir l'ailier lancé",p:.45,ok:{us:.7,me:"a",txt:"Passe parfaite dans la course…"},ko:{txt:"La passe est trop longue."}}]},
    {txt:"Corner rentrant au premier poteau.",o:[
      {t:"Reprise acrobatique",p:b-.22+inst*1.5,ok:{us:1,me:"g",rep:3,txt:"Une bicyclette ! Le stade n'en revient pas."},ko:{txt:"Spectaculaire… mais dans les tribunes."}},
      {t:"Dévier de la tête",p:b-.08+ath,ok:{us:1,me:"g",txt:"Déviation subtile, le ballon file au second poteau."},ko:{txt:"Le gardien capte."}},
      {t:"Remiser en retrait",p:.45,ok:{us:.5,me:"a",txt:"Remise pour l'arrivée d'un milieu…"},ko:{txt:"Personne n'a suivi."}}]},
    {txt:"Un défenseur te tient le maillot dans la surface.",o:[
      {t:"Se dégager et frapper",p:b-.1+ath,ok:{us:1,me:"g",txt:"Tu t'arraches et trompes le gardien !"},ko:{txt:"Déséquilibré, tu frappes sur le poteau."}},
      {t:"Chercher le penalty",p:.35,ok:{us:.78,me:"g",txt:"Penalty ! Tu prends tes responsabilités…"},ko:{moral:-2,txt:"L'arbitre te met un jaune pour simulation."}}]}],
   MIL:[
    {txt:"Contre-attaque à trois contre deux, tu portes le ballon.",o:[
      {t:"Décaler à droite",p:b+.05+tech,ok:{us:.75,me:"a",txt:"Décalage parfait…"},ko:{txt:"Ta passe est coupée."}},
      {t:"Frapper du gauche",p:b-.18,ok:{us:1,me:"g",txt:"Du mauvais pied, en pleine lucarne !"},ko:{txt:"Ça part en tribune."}},
      {t:"Ralentir et attendre le soutien",p:b+.2,ok:{calm:true,txt:"Ton équipe s'installe dans leur camp."},ko:{them:.3,txt:"Le ballon est perdu, contre adverse…"}}]},
    {txt:"Un ballon dévié retombe à l'entrée de la surface.",o:[
      {t:"Demi-volée",p:b-.22+inst*1.5,ok:{us:1,me:"g",rep:3,txt:"Une demi-volée parfaite. But de l'année ?"},ko:{txt:"Mal cadrée."}},
      {t:"Amortir et servir l'attaquant",p:b+tech,ok:{us:.6,me:"a",txt:"Amorti soyeux, passe millimétrée…"},ko:{txt:"Le ballon t'échappe."}}]},
    {txt:"Leur pressing est très haut, tu es acculé près de ta surface.",o:[
      {t:"Feinte de corps et sortie balle au pied",p:b+tech-.05,ok:{calm:true,txt:"Tu élimines deux joueurs. Le stade applaudit."},ko:{them:.5,txt:"Ballon perdu dans une zone dangereuse…"}},
      {t:"Dégager en touche",p:.9,ok:{txt:"Sobre. Tout le monde se replace."},ko:{them:.2,txt:"Dégagement raté…"}}]}],
   DEF:[
    {txt:"Coup franc adverse dangereux, tu es dans le mur.",o:[
      {t:"Sauter",p:b+.05,ok:{txt:"Le ballon frappe ta tête et sort. Courageux."},ko:{them:.45,txt:"Le ballon passe sous le mur…"}},
      {t:"Rester au sol",p:b-.05,ok:{txt:"Tu bloques la frappe rasante."},ko:{them:.4,txt:"Il enroule par-dessus…"}}]},
    {txt:"Leur avant-centre te provoque, il cherche à t'énerver.",o:[
      {t:"Rester calme",p:.8,ok:{txt:"Tu le laisses parler. Il s'énerve tout seul."},ko:{them:.2,txt:"Un instant d'inattention…"}},
      {t:"Lui répondre physiquement",p:b-.15,ok:{rep:1,txt:"Duel gagné, il se fait plus discret."},ko:{them:.4,moral:-3,txt:"Faute bête, coup franc idéalement placé…"}}]},
    {txt:"Ballon perdu au milieu : contre adverse à deux contre un.",o:[
      {t:"Couper la ligne de passe",p:b-.05+ath,ok:{txt:"Interception parfaite, tu relances."},ko:{them:.7,txt:"Il fait la passe au bon moment…"}},
      {t:"Fondre sur le porteur",p:b-.1,ok:{txt:"Tacle propre, danger écarté."},ko:{them:.6,txt:"Il te dribble et file au but…"}}]}],
   GB:[
    {txt:"Frappe lointaine flottante sous la pluie.",o:[
      {t:"Boxer le ballon",p:b+.05,ok:{txt:"Poings fermés, ballon dégagé."},ko:{them:.5,txt:"Le ballon te glisse sur les gants…"}},
      {t:"Tenter de capter",p:b-.08+tech,ok:{rep:2,txt:"Captée en deux temps. Quelle sérénité."},ko:{them:.65,txt:"Le ballon t'échappe…"}}]},
    {txt:"Corner tendu dans ta surface encombrée.",o:[
      {t:"Sortir dans la foule",p:b-.05+ath,ok:{rep:1,txt:"Sortie aérienne autoritaire."},ko:{them:.55,txt:"Tu manques le ballon…"}},
      {t:"Rester sur ta ligne",p:b-.02,ok:{txt:"Réflexe sur la tête à bout portant !"},ko:{them:.45,txt:"Tête puissante…"}}]},
    {txt:"Coup franc adverse à vingt mètres, plein axe. Leur tireur pose le ballon.",o:[
      {t:"Lire la frappe et plonger",p:b-.05+tech*.5,ok:{rep:3,txt:"Claquette du bout des gants ! Le coup franc est repoussé."},ko:{them:1,txt:"Enroulé parfait, tu touches le ballon… mais il rentre."}},
      {t:"Mettre six joueurs dans le mur",p:b-.12,ok:{txt:"Le ballon s'écrase sur ton mur."},ko:{them:.6,txt:"Le tireur surprend tout le monde au ras du sol…"}}]},
    {txt:"Ton défenseur te fait une passe en retrait trop courte.",o:[
      {t:"Dégager en catastrophe",p:b+.1,ok:{txt:"Dégagé en touche. Ouf."},ko:{them:.4,txt:"Le ballon rebondit sur l'attaquant…"}},
      {t:"Dribbler l'attaquant",p:b-.2+tech,ok:{rep:3,txt:"Crochet dans ta surface ! Le stade retient son souffle, puis exulte."},ko:{them:.9,txt:"Il te chipe le ballon…"}}]}]
  }[p.pos];
}
const GOAL_US = ["frappe du capitaine","tête sur corner","contre éclair","penalty","reprise de volée","coup franc direct","but contre son camp adverse","frappe déviée","tir croisé","lob astucieux"];
const GOAL_THEM = ["frappe sous la barre","tête plongeante","contre rapide","penalty","coup franc enroulé","erreur de relance","reprise au second poteau"];

/* ============ Célébrations ============ */
const CELEBS = {
  genoux:{n:"La glissade à genoux",i:"🛷"}, avion:{n:"L'avion, bras écartés",i:"✈️"}, coeur:{n:"Le cœur avec les doigts",i:"🫶"},
  chut:{n:"Le doigt sur la bouche",i:"🤫"}, salto:{n:"Le salto arrière",i:"🤸"}, statue:{n:"La statue, immobile",i:"🗿"},
  danse:{n:"La petite danse",i:"🕺"}, ciel:{n:"Les doigts vers le ciel",i:"☝️"}
};
// ton premier but dans un match clé : tu inventes ta célébration, qui devient ta signature
function celebrate(m){
  if(p.celeb){ p.celebN = (p.celebN||0)+1; return; }
  if(ui.quick) { p.celeb = pick(Object.keys(CELEBS)); p.celebN = 1; return; }
  m.celebAsk = true;
}
function celebChoose(k){
  const m = p.match; p.celeb = k; p.celebN = 1; m.celebAsk = false;
  m.log.push(`🎉 ${CELEBS[k].i} ${CELEBS[k].n} : ta nouvelle célébration !`);
  p.moments.push(`${p.year} · Invente sa célébration : ${CELEBS[k].n.toLowerCase()}`);
  p.rep = clamp(p.rep+1,0,100);
  save(); matchScreen();
}
