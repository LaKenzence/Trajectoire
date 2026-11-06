// Trajectoire · Mercato d'hiver jouable (au milieu de la saison) et rééducation après une blessure (pendant l'été)
/* ============ Mercato d'hiver ============ */
// après le 2e moment de la saison, une fenêtre s'ouvre parfois : trop peu de temps de jeu, ou un niveau qui dépasse le club
function winterWindow(){
  if(defiOn("fidele")||p.loanFrom||p.age<18||p.retired||!chance(.3)) return null;
  const bench = p.tmp.play<=-8, star = p.lvl>=p.club.str+4, push = p.flags.forceDepart;
  if(!bench&&!star&&!push) return null;
  const pool = CLUBS.filter(c=>c.name!==p.club.name&&clubAllowed(c));
  const offers = [];
  if(star||push){ const c = shuffle(pool.filter(c=>c.str>p.club.str+1&&c.str<=p.lvl+5))[0]; if(c) offers.push({club:{...c},years:RI(2,4),salary:Math.round(Math.pow(Math.max(c.str-35,5),2)*(1+p.rep/80)),loan:false}); }
  if(bench){
    const c = shuffle(pool.filter(c=>c.str<p.club.str&&c.str>=p.lvl-6))[0];
    if(c) offers.push(p.age<=23?{club:{...c},years:1,salary:p.salary,loan:true}:{club:{...c},years:RI(1,3),salary:Math.round(p.salary*R(.9,1.2)),loan:false});
  }
  if(!offers.length) return null;
  return {offers,why:bench?"bench":"star"};
}
function winterScreen(){
  const W = p.winter;
  if(!W){ p.phase = "event"; return route(); }
  render(`<div class="muted">Saison ${p.year}-${String(p.year+1).slice(2)} · janvier</div>
    <div class="card"><h2>❄️ Mercato d'hiver</h2>
    <p class="story">${W.why==="bench"?"La moitié de la saison est passée et tu cires le banc. Ton téléphone sonne : des clubs te proposent de jouer tout de suite.":"Tu survoles le championnat. Le mercato d'hiver s'ouvre, et un club plus ambitieux veut te faire signer sans attendre l'été."}</p>
    ${W.offers.map((x,i)=>`<button class="btn offer" onclick="winterSign(${i})">${crest(x.club,40)}<span class="of-main"><b>${x.loan?"🔁 Prêt · ":""}${esc(x.club.name)}</b>
      <small>${flag(x.club.country)} ${COUNTRIES[x.club.country].league} · force ${x.club.str}</small>
      <span class="of-tags"><span class="tag">${x.loan?"jusqu'à la fin de la saison":x.years+" an(s)"}</span>${x.loan?"":`<span class="tag">${money(x.salary)}/an</span>`}</span></span></button>`).join("")}
    <button class="btn" onclick="winterStay()">${W.why==="bench"?"Rester et te battre pour ta place":"Rester et finir la saison ici"}<small>${W.why==="bench"?"Le coach apprécie ta loyauté… s'il te fait jouer":"Les supporters t'adorent un peu plus"}</small></button></div>`);
}
function winterSign(i){
  const x = p.winter.offers[i], from = p.club.name;
  if(x.loan){ p.loanFrom = {club:p.club,contract:p.contract,salary:p.salary}; p.contract = 1; }
  else { p.contract = x.years; p.salary = x.salary; }
  if(!x.loan) clubLeave(p.club,x.club,true);
  p.club = x.club; if(!p.clubsHist.includes(x.club.name)) p.clubsHist.push(x.club.name);
  p.moments.push(`${p.year+1} · ${x.loan?"Prêté":"Transféré"} au mercato d'hiver : ${from} → ${x.club.name}`);
  p.flags.cap = false; delete p.flags.forceDepart; p.rel = newRel();
  // nouveau départ : le temps de jeu repart de zéro, avec l'envie de prouver
  p.tmp.play = x.club.str<=p.lvl?6:-2; p.moral = clamp(p.moral+4,0,100);
  msg("agent",`C'est signé avec ${x.club.name} ! Bienvenue dans ton nouveau club.`);
  post("journal",journo(),`🔁 MERCATO : ${p.name} quitte ${from} pour ${x.club.name}${x.loan?" (prêt)":""}.`);
  p.winter = null; p.phase = "event"; save(); route();
}
function winterStay(){
  const W = p.winter;
  if(W.why==="bench"){ p.tmp.play += 3; if(p.rel) p.rel.trust = clamp(p.rel.trust+5,0,100); }
  else p.rep = clamp(p.rep+2,0,100);
  p.winter = null; p.phase = "event"; save(); route();
}

/* ============ Rééducation (pendant l'été qui suit une blessure) ============ */
const REHAB = {
  repos:{n:"Repos et soins",i:"🛌",prog:18,pain:-12,d:"Lent, mais sans risque"},
  modere:{n:"Travail modéré avec le kiné",i:"🚴",prog:32,pain:4,d:"Le bon équilibre"},
  forcer:{n:"Forcer pour revenir plus vite",i:"🏃",prog:50,pain:22,d:"Rapide… si le corps suit"}
};
const newRehab = injury=>({inj:injury,week:0,prog:0,pain:25,done:false,log:[]});
function rehabCard(){
  const H = p.rehab; if(!H||H.done) return "";
  return `<div class="card"><h3>🩹 Rééducation · ${esc(H.inj)}</h3>
    <p class="muted" style="margin-top:0;font-size:.88rem">Semaine ${H.week+1}/3. Plus la douleur monte, plus le risque de rechute grandit.</p>
    <div class="bar">Progression <b style="color:var(--text)">${H.prog} %</b><div class="t"><div class="f" style="width:${Math.min(100,H.prog)}%;background:var(--good)"></div></div></div>
    <div class="bar" style="margin-top:6px">Douleur <b style="color:var(--text)">${H.pain}</b><div class="t"><div class="f" style="width:${H.pain}%;background:var(--bad)"></div></div></div>
    ${H.log.length?`<ul class="mlog">${H.log.map(l=>`<li>${l}</li>`).join("")}</ul>`:""}
    ${Object.entries(REHAB).map(([k,r])=>`<button class="btn" onclick="rehabWeek('${k}')">${r.i} ${r.n}<small>${r.d}</small></button>`).join("")}</div>`;
}
function rehabWeek(k){
  const H = p.rehab, r = REHAB[k];
  H.week++; H.prog = Math.min(110,H.prog+r.prog+RI(-4,4)); H.pain = clamp(H.pain+r.pain+RI(-3,3),0,100);
  // rechute : plus la douleur est haute quand on force, plus elle est probable
  if(k==="forcer"&&chance(Math.max(0,(H.pain-45)/80))){
    H.done = true; H.log.push("💥 Rechute. Le staff médical te met au repos forcé.");
    p.form = clamp(p.form-12,10,100); p.flags.fragile = true; p.moments.push(`${p.year} · Rechute pendant sa rééducation`);
    ui.toast = `<div class="seed">💥 Rechute en rééducation : forme −12, et un corps fragile la saison prochaine.</div>`;
    save(); return offseasonScreen();
  }
  H.log.push(`${r.i} Semaine ${H.week} : ${r.n.toLowerCase()} · progression ${H.prog} %, douleur ${H.pain}.`);
  if(H.week>=3){
    H.done = true;
    if(H.prog>=100){ p.form = clamp(p.form+10,10,100); p.moral = clamp(p.moral+4,0,100); ui.toast = `<div class="tchoice">🩹 Rééducation réussie</div><div>Tu reviens à 100 %. Forme +10, moral +4.</div>`; }
    else if(H.prog>=60){ p.form = clamp(p.form+4,10,100); ui.toast = `<div class="tchoice">🩹 Rééducation terminée</div><div>Presque remis. Forme +4.</div>`; }
    else { p.flags.fragile = true; ui.toast = `<div class="seed">🩹 Pas totalement remis : ton corps reste fragile la saison prochaine.</div>`; }
  }
  save(); offseasonScreen();
}
