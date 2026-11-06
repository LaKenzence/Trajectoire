// Trajectoire · Les compétitions autour de toi : classement complet, buteurs et passeurs du championnat,
// Coupe des Champions (qualification, tirage au sort en direct, parcours) et cérémonie du Ballon d'Étoile.

/* ============ Classement complet ============ */
const LEAGUE_GAMES = 36;
// league : clubs triés du premier au dernier, avec leur force du moment (s)
function fullTable(league){
  const mean = league.reduce((a,x)=>a+x.s,0)/league.length;
  let prev = 999;
  return league.map((x,i)=>{
    let pts = clamp(Math.round(50+(x.s-mean)*2.4+R(-3,3)),RI(19,24),90);
    pts = Math.min(pts,prev); prev = pts;
    const d0 = RI(4,11), w = Math.max(0,Math.floor((pts-d0)/3)), d = Math.min(pts-3*w,LEAGUE_GAMES-w), l = Math.max(0,LEAGUE_GAMES-w-d);
    return {n:x.n,pos:i+1,w,d,l,gf:Math.round(w*1.9+d*1.1+R(0,8)),ga:Math.round(l*1.8+d*1.1+R(0,8)),pts:3*w+d};
  });
}
// buteurs et passeurs : des joueurs fictifs, toi, et ton rival s'il joue dans le même championnat
function leagueLeaders(goals,assists,rival){
  const c = p.club, clubs = CLUBS.filter(x=>x.country===c.country).sort((a,b)=>b.str-a.str), yEnd = p.year+1;
  /** @type {(kind:string,top:number)=>any[]} */
  const fake = (kind,top)=>clubs.slice(0,7).map((cl,i)=>{
    const h = hashStr(kind+cl.name+yEnd+i);
    return {n:FIRST[h%FIRST.length]+" "+LAST[(h>>>7)%LAST.length],club:cl.name,v:Math.max(2,Math.round(top-i*R(1.2,3)+R(-2,2)))};
  });
  const sc = fake("b",RI(19,29)), as = fake("p",RI(11,17));
  if(p.pos!=="GB"){ sc.push({n:p.name,club:c.name,v:goals,me:true}); as.push({n:p.name,club:c.name,v:assists,me:true}); }
  else as.push({n:p.name,club:c.name,v:assists,me:true});
  if(rival&&rival.cc===c.country){ sc.push({n:p.rival.name,club:rival.club,v:rival.goals,rival:true}); as.push({n:p.rival.name,club:rival.club,v:rival.assists,rival:true}); }
  const rank = a=>a.sort((x,y)=>y.v-x.v).map((x,i)=>({...x,pos:i+1}));
  return {sc:rank(sc),as:rank(as)};
}
function standingsHtml(L){
  const c = p.club, top = (rows,unit)=>{ const me = rows.find(x=>x.me);
    return `<table class="mini lead">${rows.slice(0,5).map(x=>`<tr class="${x.me?"me":x.rival?"rv":""}"><td>${x.pos}</td><td>${esc(x.n)}${x.rival?" ⚔️":""}<small>${esc(x.club)}</small></td><td><b>${x.v}</b> ${unit}</td></tr>`).join("")}
      ${me&&me.pos>5?`<tr class="me"><td>${me.pos}</td><td>${esc(me.n)}<small>${esc(me.club)}</small></td><td><b>${me.v}</b> ${unit}</td></tr>`:""}</table>`; };
  return `<div class="card"><h3>📊 ${esc(L.lg)} · la saison en chiffres</h3>
    <details open><summary>Classement</summary><div class="tablewrap"><table class="mini standings"><tr><th>#</th><th>Club</th><th>J</th><th>G</th><th>N</th><th>P</th><th>Diff.</th><th>Pts</th></tr>
      ${L.full.map(x=>`<tr class="${x.n===c.name?"me":""} ${x.pos===1?"champ":""}"><td>${x.pos}</td><td>${esc(x.n)}</td><td>${LEAGUE_GAMES}</td><td>${x.w}</td><td>${x.d}</td><td>${x.l}</td><td>${x.gf-x.ga>0?"+":""}${x.gf-x.ga}</td><td><b>${x.pts}</b></td></tr>`).join("")}</table></div></details>
    ${L.leaders?`<details><summary>⚽ Meilleurs buteurs</summary>${top(L.leaders.sc,"buts")}</details>
    <details><summary>🅰️ Meilleurs passeurs</summary>${top(L.leaders.as,"passes")}</details>`:""}</div>`;
}

/* ============ Coupe des Champions ============ */
// qualifié par le classement de la saison passée (avec le même club), ou en rejoignant un grand club
function cdcQualified(){
  const last = p.seasons.at(-1); if(!last) return false;
  const nat = COUNTRIES[p.club.country].nat, spots = nat>=84?3:nat>=81?2:1;
  return last.club===p.club.name?last.rank<=spots:p.club.str>=80;
}
// quatre chapeaux : un adversaire de chaque niveau, jamais du même pays
function newCdc(){
  const pool = CLUBS.filter(x=>x.country!==p.club.country), pots = [[86,99],[80,85],[74,79],[60,73]];
  const mine = pots.findIndex(([a,b])=>p.club.str>=a&&p.club.str<=b);
  const group = [], used = new Set([p.club.country]);
  pots.forEach(([a,b],i)=>{
    if(i===(mine<0?3:mine)) return;
    const c = shuffle(pool.filter(x=>x.str>=a&&x.str<=b&&!used.has(x.country)))[0]||shuffle(pool.filter(x=>x.str>=a&&x.str<=b))[0];
    if(c){ used.add(c.country); group.push({name:c.name,country:c.country,str:c.str,pot:i+1}); }
  });
  return {group,drawn:false,myPot:(mine<0?3:mine)+1};
}
function tirageScreen(){
  const T = p.cdc, by = [...T.group].sort((a,b)=>a.pot-b.pot);
  render(`<div class="muted">Saison ${p.year}-${String(p.year+1).slice(2)} · Coupe des Champions</div>
  <div class="card tirage"><h2>🎱 Tirage au sort de la phase de groupes</h2>
    <p class="story">Dans la salle des congrès de la confédération, les anciens champions plongent la main dans les urnes. ${esc(p.club.name)} est dans le chapeau ${T.myPot}.</p>
    <div class="urnes">${by.map((g,i)=>`<div class="urne" style="--d:${1+i*1.6}s"><span class="pot">Chapeau ${g.pot}</span><span class="boule" aria-hidden="true">⚪</span><span class="tire">${flag(g.country)} <b>${esc(g.name)}</b><small>force ${g.str}</small></span></div>`).join("")}</div>
    <p class="verdict" style="--d:${1+by.length*1.6}s">${groupVerdict(T.group)}</p>
    <button class="btn primary" onclick="tirageDone()">Découvrir la saison →</button>
    <button class="btn ghost" onclick="this.closest('.tirage').classList.add('skip');this.remove()">⏩ Tout révéler</button></div>`);
}
function groupVerdict(group){
  const avg = group.reduce((a,g)=>a+g.str,0)/group.length;
  return avg>=81?"😱 Le groupe de la mort. Il faudra se battre à chaque match.":avg>=76?"Un groupe relevé, mais jouable.":"Un tirage clément. Pas le droit de se rater.";
}
function tirageDone(){
  const T = p.cdc; if(!T) return;
  T.drawn = true;
  post("journal",journo(),`🎱 Coupe des Champions : ${p.club.name} affrontera ${T.group.map(g=>g.name).join(", ")}. ${groupVerdict(T.group)}`);
  if(p.rel&&chance(.6)) msg("pote",T.group.some(g=>g.str>=86)?`T'as vu le tirage ?? ${T.group.find(g=>g.str>=86).name} 😱😱`:"Tirage tranquille, on va passer 😎");
  p.phase = "goal"; save(); route();
}
// le parcours de la saison ; si la finale a été jouée en match clé, son résultat décide
function cdcPath(c,impact,finalRes){
  const T = p.cdc, str = c.str+impact*2;
  const avg = T.group.reduce((a,g)=>a+g.str,0)/T.group.length;
  const forced = finalRes!==undefined;
  const qual = forced||chance(clamp(.55+(str-avg)*.04,.15,.95));
  const out = {group:T.group,pos:qual?(chance(.55)?1:2):(chance(.6)?3:4),steps:[],won:false};
  if(!qual) return out;
  const pool = CLUBS.filter(x=>x.country!==c.country&&!T.group.some(g=>g.name===x.name));
  for(const [r,min] of [["Quart de finale",78],["Demi-finale",82],["Finale",85]]){
    const opp = pick(pool.filter(x=>x.str>=min))||pick(pool);
    const w = forced?(r==="Finale"?!!finalRes:true):chance(clamp(.5+(str-opp.str)*.035,.15,.88));
    out.steps.push({r,opp:opp.name,cc:opp.country,w});
    if(!w) return out;
  }
  out.won = true;
  return out;
}
function cdcHtml(K){
  const last = K.steps.at(-1);
  return `<div class="card cdc"><h3>🏆 Coupe des Champions</h3>
    <p>Phase de groupes : <b>${K.pos}${K.pos===1?"er":"e"}</b> du groupe (${K.group.map(g=>esc(g.name)).join(", ")})${K.pos>2?" · éliminés":""}</p>
    ${K.steps.length?`<ul class="parcours">${K.steps.map(s=>`<li class="${s.w?"w":"l"}">${s.w?"✅":"❌"} ${s.r} · ${flag(s.cc)} ${esc(s.opp)}</li>`).join("")}</ul>`:""}
    <p class="muted" style="margin:6px 0 0">${K.won?"Le sommet du football de club. Vous l'avez fait.":last?`Fin du parcours en ${last.r.toLowerCase()}.`:"L'aventure européenne s'arrête dès l'automne."}</p></div>`;
}

/* ============ Cérémonie du Ballon d'Étoile ============ */
// s'ouvre d'elle-même la première fois que tu es nommé ; les révélations s'enchaînent, du 5e au vainqueur
function ceremonyOpen(){
  const B = p.last?.ballon; if(!B) return;
  const list = B.top.slice(0,5), win = list[0];
  document.querySelector(".overlay")?.remove();
  const rev = list.slice(1).reverse();
  openOverlay(`<div class="sheet ceremonie" role="document">
    <p class="cer-eyebrow">🌟 Cérémonie du Ballon d'Étoile ${B.year}</p>
    <h2>Les nommés</h2>
    <ol class="cer-list" reversed>${rev.map((x,i)=>`<li class="cer-r ${x.me?"me":""}" style="--d:${1.2+i*1.5}s"><span>${list.indexOf(x)+1}<sup>e</sup></span>${flag(x.c)} <b>${esc(x.n)}</b>${x.me?" (toi)":x.rival?" ⚔️":""}<small>${esc(x.club)}</small></li>`).join("")}</ol>
    <p class="cer-env" style="--d:${1.2+rev.length*1.5}s">✉️ « Et le Ballon d'Étoile ${B.year} est attribué à… »</p>
    <div class="cer-win ${win.me?"me":""}" style="--d:${3.6+rev.length*1.5}s">🌟 ${flag(win.c)} <b>${esc(win.n)}</b><small>${esc(win.club)}</small>${win.me?"<p>C'est toi. Le stade de la cérémonie se lève.</p>":win.rival?"<p>Ton rival. Tu applaudis… du bout des doigts.</p>":""}</div>
    ${B.myRank>5?`<p class="muted cer-me" style="--d:${4.4+rev.length*1.5}s">Tu termines ${B.myRank}e du vote.</p>`:""}
    <button class="btn ghost" onclick="this.closest('.ceremonie').classList.add('skip')">⏩ Passer</button>
    <button class="btn primary" onclick="closeOverlay(this.closest('.overlay'))">Fermer</button></div>`,"Cérémonie du Ballon d'Étoile");
  if(win.me) setTimeout(()=>{ const c = document.querySelector(".ceremonie"); if(c){ confetti(); sfx("trophy"); const st = document.createElement("div"); st.className = "cer-star"; c.querySelector(".cer-win")?.prepend(st); playLottie("etoile",st,true); } },(3.6+rev.length*1.5)*1000);
}
