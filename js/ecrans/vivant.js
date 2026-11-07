// Trajectoire · La carrière vivante
// - la course au championnat qui avance au fil de la saison (classement à chaque moment, match clé à enjeu) ;
// - les qualités du joueur et l'axe de travail choisi avant chaque saison ;
// - des entraîneurs avec un style, qui changent ;
// - la réputation qui se construit choix après choix (loyal, mercenaire, diva, leader, pro, fêtard) et la mémoire des choix ;
// - le rêve de carrière et la note finale ; le récap de saison en cartes.

/* ============ La course au championnat ============ */
// Au début de la saison, chaque club reçoit sa dynamique (le hasard de la saison). À chaque moment, le classement
// provisoire se lit à partir de cette dynamique et de ton état du moment : tes choix le font bouger. Le classement
// final (simSeason) part de la même dynamique, plus l'effet du match clé.
function newRace(){
  const c = p.club;
  return {club:c.name,teams:CLUBS.filter(x=>x.country===c.country).map(x=>({n:x.name,str:x.str,luck:R(-9,9),me:x.name===c.name})),bonus:0,seen:{}};
}
function ensureRace(){ if(!p.race||p.race.club!==p.club.name) p.race = newRace(); return p.race; }
// ton apport estimé, sur le modèle de simSeason (note et temps de jeu)
function myImpact(){
  const c = p.club, diff = p.lvl-c.str;
  const rating = 6.4+diff*.035+(p.moral-50)*.006+(p.form-50)*.004+(p.tmp?.rating||0);
  const play = clamp(50+diff*3.5+(p.moral-50)*.25+(p.form-50)*.3+(p.tmp?.play||0)+(coachStyle().young&&p.age<=21?coachStyle().young:0),3,97);
  return (rating-6.5)*3*(play/100);
}
function raceLeague(impact){
  const r = ensureRace();
  return r.teams.map(t=>({n:t.n,s:t.str+t.luck+(t.me?impact+r.bonus:0)}));
}
// classement à la journée J : environ 50 points sur 38 matchs pour un club moyen (comme fullTable)
function raceTable(J){
  const sc = raceLeague(myImpact()), mean = sc.reduce((a,t)=>a+t.s,0)/sc.length, me = p.club.name;
  const rows = sc.map(t=>{ const h = hashStr(t.n+p.year+":"+J), noise = ((h%100)/100-.5)*Math.max(0,5-J*.13);
    return {n:t.n,me:t.n===me,pts:Math.max(0,Math.round(J*clamp(1.316+(t.s-mean)*.063,.3,2.6)+noise))}; });
  rows.sort((a,b)=>b.pts-a.pts||(a.me?-1:b.me?1:0));
  rows.forEach((r,i)=>r.pos=i+1);
  return rows;
}
// l'objectif du club, selon sa force (le même que celui du bilan)
function clubObjective(str){
  const n = ensureRace().teams.length;
  return str>=85?{t:"Être champion",ok:r=>r<=1,line:1}:str>=76?{t:"Finir sur le podium",ok:r=>r<=3,line:3}:str>=64?{t:"Finir dans la première moitié",ok:r=>r<=Math.floor(n/2),line:Math.floor(n/2)}:{t:"Éviter la dernière place",ok:r=>r<n,line:n-1};
}
const RACE_DAYS = [7,18,28];
// le bandeau du championnat, en tête de chaque moment de la saison
function raceBanner(){
  if(!p||p.retired||!p.club) return "";
  const J = RACE_DAYS[Math.min(p.evIdx,2)], rows = raceTable(J), me = rows.find(r=>r.me), r = ensureRace();
  if(!me) return "";
  const prev = r.seen[J]==null?Object.entries(r.seen).filter(([j])=>+j<J).sort((a,b)=>+b[0]-+a[0])[0]?.[1]:null;
  if(r.seen[J]==null) r.seen[J] = me.pos;
  const move = prev==null?"":prev>me.pos?`<b class="up">▲ ${prev-me.pos}</b>`:prev<me.pos?`<b class="down">▼ ${me.pos-prev}</b>`:`<b class="muted">=</b>`;
  const obj = clubObjective(p.club.str), lineRow = rows[obj.line-1], okNow = obj.ok(me.pos);
  const gap = okNow?(rows[obj.line]?me.pts-rows[obj.line].pts:0):lineRow.pts-me.pts;
  const show = rows.filter(x=>x.pos<=3||x.me);
  const status = okNow?(gap<=2?`<span class="warn">en ballottage (+${gap} pt${gap>1?"s":""})</span>`:`<span class="good">en bonne voie</span>`):`<span class="bad">à ${gap} pt${gap>1?"s":""}</span>`;
  return `<div class="card race"><div class="race-head"><span>📊 ${esc(COUNTRIES[p.club.country].league)} · journée ${J}</span>${move}</div>
    <table class="mini race-t">${show.map(x=>`<tr class="${x.me?"me":""}"><td>${x.pos}</td><td>${esc(x.n)}</td><td>${x.pts} pts</td></tr>`).join("")}</table>
    <p class="race-obj">🎯 Objectif du club : <b>${obj.t}</b> · ${status}</p>${rivalLine(rows)}${coachLine()}</div>`;
}
// ton rival pendant la saison : où en est son club, ou ce qu'il devient
function rivalLine(rows){
  if(typeof rivalActive!=="function"||!rivalActive()) return "";
  const r = p.rival, his = rows.find(x=>x.n===r.club.name&&!x.me);
  const lead = p.lvl>r.lvl?"tu as l'avantage":p.lvl<r.lvl?"il a une longueur d'avance":"vous êtes à égalité";
  return `<p class="race-coach">⚔️ Ton rival <b>${esc(r.name)}</b> · ${his?`son club est ${his.pos}${his.pos===1?"er":"e"} (${his.pts} pts)`:`au ${esc(r.club.name)}`} · niveau ${r.lvl}, ${lead}</p>`;
}
// l'enjeu du match clé, lu dans le classement juste avant : titre, maintien, place visée
function raceStake(){
  if(!p.race||p.race.club!==p.club.name) return null;
  const rows = raceTable(33), me = rows.find(r=>r.me), n = rows.length;
  if(!me) return null;
  const near = k=>rows[k-1]&&rows[k-1].n!==me.n?rows[k-1]:rows[k]||rows[k-2];
  if(me.pos<=2&&Math.abs(rows[0].pts-(rows[1]?.pts||0))<=5) return {k:"titre",opp:me.pos===1?rows[1]:rows[0],t:"Le match du titre",gap:me.pts-(me.pos===1?rows[1].pts:rows[0].pts)};
  // le maintien ne se joue que si la dernière place est vraiment à portée
  if(me.pos>=n-2&&me.pts-rows[n-1].pts<=4) return {k:"maintien",opp:me.pos===n?rows[n-2]:rows[n-1],t:"Le match de la peur",gap:me.pts-(me.pos===n?rows[n-2].pts:rows[n-1].pts)};
  const obj = clubObjective(p.club.str);
  const line = rows[obj.line-1];
  if(obj.line>1&&Math.abs(me.pts-line.pts)<=4&&line.n!==me.n) return {k:"objectif",opp:line,t:obj.line===3?"Le choc pour le podium":"Le match de la saison",gap:me.pts-line.pts};
  return null;
}
// après le match clé : la course est relancée (ou perdue)
function raceAfterMatch(res,stake){
  const r = ensureRace(), big = !!stake;
  r.bonus += {w:big?4:1.5,d:big?.5:0,l:big?-3.5:-1}[res];
}

/* ============ Qualités et axe de travail ============ */
const QUALS = {sig:{i:"⚽"},tec:{n:"Technique",i:"🎯"},phy:{n:"Physique",i:"💪"},men:{n:"Mental",i:"🧠"},lea:{n:"Leadership",i:"©️"}};
const qualName = k=>k==="sig"?{ATT:"Finition",MIL:"Vision",DEF:"Défense",GB:"Réflexes"}[p.pos]:QUALS[k].n;
const QUAL_D = {sig:()=>({ATT:"Plus de buts",MIL:"Plus de passes décisives",DEF:"De meilleures notes",GB:"Plus de clean sheets"})[p.pos],tec:()=>"Mini-jeux plus faciles, gestes plus sûrs",phy:()=>"Moins de blessures, déclin plus tardif",men:()=>"Moins de pression, moral plus solide",lea:()=>"Le coach et le vestiaire te suivent"};
const INTENS = {doux:{n:"Douce",d:"Forme +, peu de risques"},normal:{n:"Normale",d:"L'équilibre"},intense:{n:"Intense",d:"Progrès +, blessures +"}};
function ensureQuals(){
  if(p.q) return p.q;
  const b = p.lvl, t = p.trait;
  p.q = {sig:b+2,tec:b+(t==="tech"?5:-1),phy:b+(t==="athl"?5:-1),men:b+(t==="lead"?3:t==="inst"?-3:0),lea:b-6+(t==="lead"?8:0)};
  for(const k in p.q) p.q[k] = clamp(Math.round(p.q[k]),20,99);
  p.focus = p.focus||"sig"; p.intens = p.intens||"normal";
  return p.q;
}
// écart d'une qualité au niveau général : c'est lui qui pèse sur la saison
const qd = k=>(ensureQuals()[k]-p.lvl);
function qualsSeason(growth,apps){
  const q = ensureQuals(), f = p.focus||"sig", it = p.intens||"normal";
  for(const k in q){
    let d = (p.lvl-q[k])*.3+growth*.6;
    if(k===f) d += R(2,4)*(it==="intense"?1.4:it==="doux"?.7:1)*(apps>=10?1:.7);
    if(k==="phy"&&p.age>=30) d -= (p.age-29)*.6*(p.trait==="athl"?.6:1);
    if((k==="men"||k==="lea")&&p.age>=25) d += .8;
    if(k==="lea"&&p.flags.cap) d += 1.5;
    q[k] = clamp(Math.round(q[k]+d),20,Math.min(99,p.lvl+14));
  }
}
function focusHtml(){
  const q = ensureQuals();
  return `<div class="card"><h2>🏋️ Ton axe de travail</h2><p class="story">Sur quoi tu bosses cette saison ? La qualité choisie progresse plus vite, et chaque qualité pèse sur le terrain.</p>
    <div class="quals">${Object.keys(QUALS).map(k=>`<button class="btn qual ${p.focus===k?"sel":""}" aria-pressed="${p.focus===k}" onclick="setFocus('${k}')"><span class="q-i">${QUALS[k].i}</span><span class="q-n">${qualName(k)}<small>${QUAL_D[k]()}</small></span><b>${q[k]}</b></button>`).join("")}</div>
    <h3 style="margin-top:12px">Intensité de la préparation</h3><div class="row3">${Object.entries(INTENS).map(([k,v])=>`<button class="btn ${p.intens===k?"sel":""}" aria-pressed="${p.intens===k}" onclick="setIntensity('${k}')">${v.n}<small>${v.d}</small></button>`).join("")}</div></div>`;
}
function setFocus(k){ ensureQuals(); p.focus = k; save(); route(); }
function setIntensity(k){ ensureQuals(); p.intens = k; save(); route(); }
// le radar des qualités, pour la carte du joueur
function qualsRadar(size=180){
  const q = ensureQuals(), ks = Object.keys(QUALS), c = size/2, r = size/2-26;
  const pt = (i,v)=>{ const a = -Math.PI/2+i*2*Math.PI/ks.length, d = r*clamp((v-30)/69,0,1); return [c+Math.cos(a)*d,c+Math.sin(a)*d]; };
  const ring = f=>ks.map((_,i)=>pt(i,30+69*f).join(",")).join(" ");
  return `<svg class="radar" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Qualités : ${ks.map(k=>qualName(k)+" "+q[k]).join(", ")}">
    ${[.33,.66,1].map(f=>`<polygon points="${ring(f)}" fill="none" stroke="rgba(255,255,255,.15)"/>`).join("")}
    <polygon points="${ks.map((k,i)=>pt(i,q[k]).join(",")).join(" ")}" fill="rgba(247,197,72,.35)" stroke="#f7c548" stroke-width="2"/>
    ${ks.map((k,i)=>{ const [x,y] = pt(i,104); return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#fff" font-family="Barlow,sans-serif">${qualName(k)} ${q[k]}</text>`; }).join("")}</svg>`;
}

/* ============ Les entraîneurs ============ */
const COACH_STYLES = {
  tacticien:{n:"Le tacticien",i:"📋",d:"Il récompense la discipline et fait progresser les esprits.",trust:.8,growth:.3},
  pere:{n:"Le grand frère",i:"🤝",d:"Il protège ses joueurs et pardonne les erreurs.",trust:1.3,moral:3},
  dur:{n:"Le sergent",i:"🪖",d:"Dur, parfois injuste, mais on progresse avec lui.",trust:.6,growth:.8,moral:-3},
  offensif:{n:"Le romantique",i:"⚡",d:"Tout pour l'attaque : les buts pleuvent.",goals:1.15},
  jeunes:{n:"Le formateur",i:"🌱",d:"Il donne leur chance aux jeunes.",young:12}
};
function ensureCoach(){
  if(!p.rel) return null;
  if(!p.rel.coach) p.rel.coach = {name:pick(FIRST)+" "+pick(LAST),style:pick(Object.keys(COACH_STYLES)),since:p.year,fresh:true};
  return p.rel.coach;
}
const coachStyle = ()=>{ const k = p&&p.rel&&p.rel.coach; return k?COACH_STYLES[k.style]:{}; };
function coachLine(){
  const k = ensureCoach(); if(!k) return "";
  const s = COACH_STYLES[k.style];
  return `<p class="race-coach">${s.i} Ton coach : <b>${esc(k.name)}</b>, ${s.n.toLowerCase()}${k.fresh?' <span class="chip new">nouveau</span>':""}</p>`;
}
// fin de saison : un coach qui manque l'objectif peut sauter ; l'été suivant, un autre arrive
function coachSeasonEnd(objOk){
  const k = ensureCoach(); if(!k) return null;
  k.fresh = false;
  if(!objOk&&p.year-k.since>=1&&chance(.45)){
    const old = k.name; p.rel.coach = {name:pick(FIRST)+" "+pick(LAST),style:pick(Object.keys(COACH_STYLES).filter(x=>x!==k.style)),since:p.year+1,fresh:true};
    p.rel.trust = clamp(Math.round((p.rel.trust+50)/2),5,100);
    return `${old} est limogé. ${p.rel.coach.name} (${COACH_STYLES[p.rel.coach.style].n.toLowerCase()}) le remplace.`;
  }
  return null;
}

/* ============ Réputation : qui tu deviens, choix après choix ============ */
const PERSONAS = {
  loyal:{n:"Le fidèle",i:"💙",d:"Les supporters t'adorent, ta parole compte."},
  mercenaire:{n:"Le mercenaire",i:"💰",d:"Les offres pleuvent, mais personne ne t'aime vraiment."},
  diva:{n:"La diva",i:"👑",d:"Tout le monde parle de toi. Le coach un peu moins bien."},
  leader:{n:"Le leader",i:"©️",d:"Le vestiaire te suit, le coach t'écoute."},
  pro:{n:"Le pro",i:"🏋️",d:"Exemplaire : ton corps te le rend."},
  fetard:{n:"Le fêtard",i:"🎉",d:"La vie est belle… la forme, moins."}
};
/** @type {[string,RegExp][]} */
const TAG_RX = [
  ["",/lever le pied|en fin de match/i],
  ["leader",/prendre la parole|sous ton aile|brassard/i],
  ["fetard",/soirée|faire la fête|la fête|boîte|alcool|sortir (en boîte|avec eux|ce soir)|nuit blanche|vacances de luxe/i],
  ["mercenaire",/garder ton argent|plus d'argent|salaire|offre la plus|prime|sponsor|contrat publicitaire|négocier (plus|toi-même|une|un|le|la|ton)|augmentation|le plus offrant|clause|partir pour l'argent/i],
  ["loyal",/rester (au club|ici|dans ton club|avec eux|et te battre)|fidèle(?! à ta routine)|club de c(œ|oe)ur|refuser l'offre|prolonger|ne pas partir|tes racines|ton quartier|les supporters/i],
  ["diva",/exiger|grève|clash|provoqu|caprice|menacer|répondre sur les réseaux|faire le buzz|bouder|claquer la porte|refuser publiquement|devant le groupe|tout haut/i],
  ["leader",/l'équipe|coéquipier|soutenir|protéger|brassard|rassembler|parler au groupe|le jeune|prendre la parole|sous ton aile/i],
  ["pro",/entraîn|séances? supplémentaires?|travailler|repos|récupér|sérieux|kiné|dormir|régime|rester concentré|analyse vidéo|bosser/i]
];
// le trait que révèle un choix (d'après son texte et ses effets), ou rien
// quelques événements disent d'eux-mêmes ce que révèle chaque option (dans l'ordre des choix)
const EVENT_TAGS = {soiree:["fetard",null,"pro"],sponsor:["mercenaire","mercenaire","pro"],fetard:["fetard",null,"pro"]};
function choiceTag(c,e){
  if(!c) return null;
  const t = c.t||"", fx = c.fx||{};
  if(e&&EVENT_TAGS[e.id]){ const i = e.ch.indexOf(c); if(i>=0) return EVENT_TAGS[e.id][i]||null; }
  for(const [k,rx] of TAG_RX) if(rx.test(t)) return k||null;
  if(typeof fx.money==="number"&&fx.money>=100) return "mercenaire";
  return null;
}
function tagChip(c,e){ const k = choiceTag(c,e); return k?`<span class="chip tag-${k}" title="Ce choix façonne ta réputation">${PERSONAS[k].i} ${PERSONAS[k].n.replace(/^(Le|La) /,"")}</span>`:""; }
function persona(){
  const s = p.persona||{}, e = Object.entries(s).sort((a,b)=>b[1]-a[1]);
  if(!e.length||e[0][1]<3||(e[1]&&e[0][1]-e[1][1]<1)) return null;
  return e[0][0];
}
// après chaque choix : il compte dans ta réputation, et les plus marquants restent en mémoire pour revenir plus tard
function personaAfterChoice(e,c,deltas){
  const k = choiceTag(c,e); if(!k) return null;
  const before = persona();
  p.persona = p.persona||{}; p.persona[k] = (p.persona[k]||0)+1;
  const big = deltas.some(d=>Math.abs(d.v)>=6)||c.risk;
  if(big){ p.memo = (p.memo||[]).concat({tag:k,t:c.t,ev:e.id,y:p.year,club:p.club.name,age:p.age}).slice(-14); }
  const now = persona();
  return now&&now!==before?now:null;
}
// la réputation pèse sur la saison
function personaSeason(){
  const k = persona(); if(!k) return;
  if(k==="pro") p.form = clamp(p.form+4,10,100);
  if(k==="fetard"){ p.form = clamp(p.form-4,10,100); p.moral = clamp(p.moral+3,5,100); }
  if(k==="leader"&&p.rel) p.rel.trust = clamp(p.rel.trust+4,5,100);
  if(k==="diva"){ p.rep = clamp(p.rep+2,0,100); if(p.rel) p.rel.trust = clamp(p.rel.trust-3,5,100); }
  if(k==="loyal") p.moral = clamp(p.moral+2,5,100);
}
// un souvenir à faire revenir : un choix marquant d'au moins une saison
function memoPick(tag){ return (p.memo||[]).filter(m=>(!tag||m.tag===tag)&&p.year-m.y>=1&&!m.back).slice(-1)[0]||null; }
function memoDone(m){ if(m) m.back = true; }

/* ============ Le rêve de carrière et la note finale ============ */
const DREAMS = {
  ballon:{i:"🌟",n:"Ballon d'Étoile",d:"Être sacré meilleur joueur du monde.",ok:s=>s.stars>=1},
  monde:{i:"🌍",n:"Champion du monde",d:"Soulever le trophée avec ta sélection.",ok:()=>p.trophies.some(t=>t.t.startsWith("Championnat du Monde"))},
  cdc:{i:"🏆",n:"Coupe des Champions",d:"Gagner la plus grande compétition de clubs.",ok:()=>p.trophies.some(t=>t.t==="Coupe des Champions")},
  fidele:{i:"💙",n:"Une vie, un club",d:"Faire toute ta carrière (12 saisons ou plus) dans un seul club.",ok:()=>p.clubsHist.length===1&&p.seasons.length>=12},
  record:{i:"📈",n:"Entrer dans l'histoire",d:"Un record de poste : 250 buts, 150 passes, 180 clean sheets ou 15 trophées en défense.",ok:()=>{ const t = careerTotals(); return p.pos==="ATT"?t.g>=250:p.pos==="MIL"?t.a>=150:p.pos==="GB"?t.cs>=180:p.trophies.length>=15; }},
  monde4:{i:"✈️",n:"Globe-trotter",d:"Jouer dans quatre championnats différents.",ok:()=>new Set(p.seasons.map(s=>s.cc)).size>=4}
};
function dreamProgress(){
  const d = DREAMS[p.dream]; if(!d) return "";
  const ok = d.ok(careerSummary());
  return `<p class="dream ${ok?"ok":""}">${d.i} Ton rêve : <b>${d.n}</b> · ${ok?"accompli ✨":esc(d.d)}</p>`;
}
// note de carrière sur 100 : sommet, trophées, Ballons, longévité, rêve
function careerGrade(){
  const s = careerSummary(), peak = Math.max(p.lvl,...p.seasons.map(x=>x.lvl));
  const dream = DREAMS[p.dream]&&DREAMS[p.dream].ok(s);
  const v = clamp(Math.round((peak-55)*1.25+Math.min(18,p.trophies.length*.9)+s.stars*6+Math.min(6,p.seasons.length*.3)+(dream?10:0)),0,100);
  const label = v>=95?"Immortel":v>=85?"Légende":v>=72?"Star":v>=58?"Grand joueur":v>=42?"Bon pro":"Carrière modeste";
  return {v,label,dream,peak};
}
function gradeHtml(){
  const g = careerGrade();
  let best = 0; try{ best = +localStorage.getItem("trajectoire_best_grade")||0; if(g.v>best) localStorage.setItem("trajectoire_best_grade",String(g.v)); }catch(e){}
  const d = DREAMS[p.dream];
  return `<div class="card grade"><div class="grade-v">${g.v}<small>/100</small></div><div><b class="grade-l">${g.label}</b>
    ${d?`<p>${d.i} Rêve « ${d.n} » : ${g.dream?'<span class="good">accompli ✨ (+10)</span>':'<span class="bad">pas cette fois</span>'}</p>`:""}
    <p class="muted">${g.v>best?"🎉 Nouveau record personnel !":best?`Ton record : ${best}/100`:""}</p></div></div>`;
}

/* ============ Le récap de saison, en cartes ============ */
function seasonStoryOpen(){
  const L = p.last; if(!L) return;
  const s = p.seasons.at(-1), q = ensureQuals(), per = persona();
  const cards = [
    `<div class="st-big">${p.pos==="GB"?L.clean:L.goals}</div><div class="st-cap">${p.pos==="GB"?"clean sheets":"buts"} · ${L.assists} passes · note ${L.rating}</div><p>${L.apps} matchs, dont ${L.starts} comme titulaire.</p>`,
    `<div class="st-big">${L.rank}<sup>e</sup></div><div class="st-cap">${esc(L.lg)}</div><p>Objectif du club : <b>${L.obj.t}</b> ${L.obj.ok?"✓":"✗"}</p>${L.match?.title?`<p>Match clé : ${esc(L.match.title)} · <b>${L.match.score}</b></p>`:""}`,
    `<div class="st-big">${p.lvl}</div><div class="st-cap">de niveau ${L.d.lvl?`(${L.d.lvl>0?"+":""}${L.d.lvl})`:""}</div>${qualsRadar(170)}<p>Axe de travail : <b>${qualName(p.focus||"sig")}</b></p>`,
    `<div class="st-big">${per?PERSONAS[per].i:"❔"}</div><div class="st-cap">${per?PERSONAS[per].n:"Réputation en construction"}</div><p>${per?PERSONAS[per].d:"Tes prochains choix diront qui tu es."}</p>${L.coachNews?`<p>📋 ${esc(L.coachNews)}</p>`:""}`,
    L.tr.length?`<div class="st-big">🏆 ${L.tr.length}</div><div class="st-cap">trophée${L.tr.length>1?"s":""}</div><p>${L.tr.map(esc).join("<br>")}</p>`:`<div class="st-big">${L.goal?.ok?"🎯":"⏳"}</div><div class="st-cap">${L.goal?.ok?"Objectif perso atteint":"La saison prochaine sera la bonne"}</div><p>${L.goal?esc(L.goal.t):""}</p>`
  ];
  const ov = openOverlay(`<div class="story-ov" data-i="0"><div class="st-bars">${cards.map(()=>"<i></i>").join("")}</div>
    <p class="st-eyebrow">Ta saison ${s.y}</p>${cards.map((h,i)=>`<section class="st-card${i?"":" on"}">${h}</section>`).join("")}
    <div class="st-nav"><button class="btn ghost" onclick="storyStep(this,-1)">←</button><button class="btn primary" onclick="storyStep(this,1)">Suivant →</button></div></div>`,"Récap de la saison");
  storyPaint(ov.querySelector(".story-ov"));
}
function storyPaint(box){
  const i = +box.dataset.i, cs = box.querySelectorAll(".st-card");
  cs.forEach((c,j)=>c.classList.toggle("on",j===i));
  box.querySelectorAll(".st-bars i").forEach((b,j)=>b.classList.toggle("on",j<=i));
  box.querySelector(".st-nav .primary").textContent = i>=cs.length-1?"Fermer":"Suivant →";
}
function storyStep(btn,d){
  const box = btn.closest(".story-ov"), n = box.querySelectorAll(".st-card").length, i = +box.dataset.i+d;
  if(i>=n) return closeOverlay(btn.closest(".overlay"));
  box.dataset.i = String(clamp(i,0,n-1)); storyPaint(box);
}
// la phrase d'enjeu affichée au coup d'envoi du match clé
function stakeLine(st){
  const g = st.gap, pts = n=>`${Math.abs(n)} point${Math.abs(n)>1?"s":""}`;
  if(st.k==="titre") return g>0?`🔥 Enjeu : vous avez ${pts(g)} d'avance sur le ${st.opp.n}. Gagnez, et le titre vous tend les bras.`:g<0?`🔥 Enjeu : ${pts(g)} de retard sur le ${st.opp.n}. Il faut gagner, sinon le titre s'envole.`:`🔥 Enjeu : à égalité de points avec le ${st.opp.n}. Le vainqueur file vers le titre.`;
  if(st.k==="maintien") return g>=0?`😰 Enjeu : ${pts(g)} d'avance sur la zone rouge. Une défaite, et c'est la panique.`:`😰 Enjeu : ${pts(g)} de retard sur le maintien. Il n'y a plus le choix.`;
  return g>=0?`🎯 Enjeu : ${pts(g)} d'avance sur le ${st.opp.n} dans la course à l'objectif du club.`:`🎯 Enjeu : ${pts(g)} de retard sur le ${st.opp.n}. Une victoire, et vous le dépassez.`;
}
