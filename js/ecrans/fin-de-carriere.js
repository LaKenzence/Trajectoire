// Trajectoire · Retraite, bilan final, carrière d'entraîneur et mode Héritage
/* ============ Après-carrière ============ */
const AFTER = {
  coach:{n:"Devenir entraîneur",d:"Le banc de touche t'attire.",ok:()=>true},
  tv:{n:"Consultant télé",d:"Commenter les matchs que tu jouais hier. Tes abonnés te suivront à l'antenne.",ok:()=>p.rep>=25||followers()>=100000},
  boss:{n:"Dirigeant de club",d:"Costume, stratégie et mercato.",ok:()=>p.flags.dirigeant||p.rep>=60},
  acad:{n:"Ouvrir ton académie",d:"Former la prochaine génération.",ok:()=>p.money>=400||p.flags.fond},
  agent:{n:"Agent de joueurs",d:"Passer de l'autre côté de la table des négociations.",ok:()=>p.rep>=30},
  calme:{n:"Profiter de la vie",d:"Famille, voyages, tranquillité.",ok:()=>true}
};
// Chaque vie d'après se joue en trois décisions ; leur somme (s) choisit l'épilogue.
// Une option peut avoir risk:{p,good,bad} comme les événements, ou to:"coach" pour basculer vers la carrière d'entraîneur.
const AFTER_STORIES = {
  tv:{steps:[
    {t:()=>"Premier direct. Le présentateur te demande de juger la boulette d'un ancien coéquipier, en plein prime time.",ch:[
      {t:"Analyser l'action sans l'accabler",s:1,txt:"Ton analyse est fine et respectueuse. Les téléspectateurs découvrent un vrai pédagogue."},
      {t:"Le démolir pour faire le buzz",risk:{p:.5,good:{s:1,txt:"La séquence est reprise partout. La chaîne adore."},bad:{s:-1,txt:"Le vestiaire te tourne le dos et l'ancien coéquipier ne te parle plus."}}}]},
    {t:()=>"La chaîne te propose ta propre émission du lundi soir. Le concept est à inventer.",ch:[
      {t:"Une émission tactique, tableau noir et vidéos",s:2,txt:"Les entraîneurs regardent en cachette. Ton tableau noir devient culte."},
      {t:"Un talk-show avec les stars du moment",risk:{p:.6,good:{s:2,txt:"Les plus grands joueurs se bousculent sur ton plateau."},bad:{s:0,txt:"Les invités se décommandent : l'émission s'arrête après une saison."}}},
      {t:"Rester consultant, sans pression",s:0,txt:"Tu commentes, tu rentres chez toi. Une vie douce."}]},
    {t:()=>"Un club t'appelle : ils cherchent un entraîneur. Ton émission, elle, cartonne.",ch:[
      {t:"Rester à la télé",s:1,txt:"La télé t'a adopté, et tu l'as adoptée."},
      {t:"Tenter l'aventure sur le banc",to:"coach",txt:"Tu raccroches le micro pour le survêtement."}]}],
    end:[()=>`Ta carrière télé reste discrète : quelques saisons à commenter la ${COUNTRIES[p.country].league}, puis tu passes à autre chose.`,
         ()=>`Tu commentes la ${COUNTRIES[p.country].league} le dimanche soir pendant quinze ans. Tes formules font régulièrement le buzz.`,
         ()=>"Ta franchise et tes analyses font de toi le consultant le plus suivi du pays. Ton émission du lundi devient une institution."]},
  boss:{steps:[
    {t:()=>`Ton premier mercato comme directeur sportif ${duC(p.clubsHist[0])}, ton club formateur. Le budget est minuscule.`,ch:[
      {t:"Miser sur les jeunes du centre",s:1,txt:"Trois gamins s'imposent en équipe première. Le public adore."},
      {t:"Recruter une vieille gloire pour remplir le stade",risk:{p:.5,good:{s:2,txt:"Il retrouve une seconde jeunesse et le stade affiche complet."},bad:{s:-1,txt:"Blessé dès le mois de septembre. Un gouffre financier."}}}]},
    {t:()=>"L'entraîneur que tu as nommé enchaîne cinq défaites. Le président te demande de trancher.",ch:[
      {t:"Le soutenir publiquement",risk:{p:.55,good:{s:2,txt:"Il redresse la barre. Ta patience est saluée."},bad:{s:-1,txt:"La série continue. On te reproche ton entêtement."}}},
      {t:"Le remplacer par un jeune coach inconnu",s:1,txt:"Un pari, mais le vestiaire se remet à courir."}]},
    {t:()=>"Un milliardaire veut racheter le club. Il te propose de rester… avec un budget illimité, mais sans ton mot à dire.",ch:[
      {t:"Refuser et partir la tête haute",s:1,txt:"Tu pars, mais avec l'estime de tout un club."},
      {t:"Accepter et construire une armada",risk:{p:.5,good:{s:2,moment:"Bâtit une équipe championne comme dirigeant",txt:"L'argent bien dépensé : le club remporte son premier titre."},bad:{s:0,txt:"Les stars s'entendent mal. Beaucoup d'argent pour peu de joie."}}}]}],
    end:[()=>"Ton passage dans les bureaux te laisse un goût amer : on ne gère pas un club comme on joue au football.",
         ()=>`Directeur sportif respecté, tu sauves ${leC(p.clubsHist[0])} de la faillite et rénoves son stade.`,
         ()=>`Huit ans plus tard, le club que tu as reconstruit dispute la Coupe des Champions pour la première fois de son histoire.`]},
  acad:{steps:[
    {t:()=>"Ton académie va ouvrir ses portes. Reste à choisir où.",ch:[
      {t:"Là où tu as grandi",s:1,txt:"Les gamins du coin font la queue dès le premier jour."},
      {t:"À côté d'un grand club, pour attirer les meilleurs",s:1,txt:"Les meilleurs espoirs de la région débarquent."}]},
    {t:()=>"Un élève de 15 ans éblouit tout le monde. Un géant étranger veut le recruter tout de suite.",ch:[
      {t:"Le laisser partir contre une belle indemnité",s:1,txt:"L'argent finance un nouveau terrain."},
      {t:"Le garder pour qu'il finisse sa formation",risk:{p:.6,good:{s:2,moment:"Forme un futur international dans son académie",txt:"Il signe pro à 18 ans, puis devient international."},bad:{s:0,txt:"Il part quand même, l'année suivante, et gratuitement."}}}]},
    {t:()=>"La fédération s'intéresse à ta méthode de formation.",ch:[
      {t:"La partager gratuitement avec tous les clubs",s:2,txt:"Ta méthode est enseignée dans tout le pays."},
      {t:"La garder pour ton académie",s:1,txt:"Ton académie reste la meilleure. Et la plus chère."}]}],
    end:[()=>`L'Académie ${p.name.split(" ").pop()} ferme après quelques saisons difficiles. Quelques anciens élèves t'écrivent encore.`,
         ()=>`L'Académie ${p.name.split(" ").pop()} devient une référence : ${RI(12,25)} de tes élèves passent pros.`,
         ()=>`Quinze ans plus tard, ${RI(25,40)} de tes élèves sont devenus pros, dont ${RI(2,5)} internationaux. On parle de « l'école ${p.name.split(" ").pop()} ».`]},
  agent:{steps:[
    {t:()=>"Ton premier client : un gamin surdoué mais ingérable, que plus personne ne veut représenter.",ch:[
      {t:"Le prendre et le recadrer",risk:{p:.55,good:{s:2,txt:"Il se calme, explose, et signe dans un grand club."},bad:{s:-1,txt:"Il disparaît en boîte de nuit plus souvent qu'à l'entraînement."}}},
      {t:"Refuser, trop risqué",s:0,txt:"Tu attends un client plus sage."}]},
    {t:()=>"Un président te glisse une enveloppe pour orienter un de tes joueurs vers son club.",ch:[
      {t:"Refuser net",s:1,txt:"Ta réputation d'intégrité fait le tour du milieu."},
      {t:"Accepter, tout le monde le fait",risk:{p:.5,good:{s:1,txt:"Personne n'en saura rien. Ta conscience, si."},bad:{s:-3,moment:"Rattrapé par une affaire de commissions occultes",txt:"Une enquête est ouverte. Ta licence d'agent est suspendue."}}}]},
    {t:()=>"Ta star veut partir dans un championnat exotique pour l'argent. Toi, tu sens le piège.",ch:[
      {t:"Le convaincre de rester au haut niveau",s:1,txt:"Il gagne la Coupe des Champions deux ans plus tard. Il te remercie à chaque interview."},
      {t:"Signer le contrat le plus cher de l'histoire",s:1,txt:"Commission record. Ton client, lui, s'ennuie."}]}],
    end:[()=>"Le métier d'agent n'était pas pour toi. Tu rends ta licence au bout de quelques années.",
         ()=>"Agent respecté, tu gères une vingtaine de joueurs sans jamais faire de vagues.",
         ()=>"Tu deviens l'agent le plus influent du football mondial. Les présidents tremblent quand tu appelles."]}
};
function afterScreen(){
  if(!p.endLogged){ p.moments.push(`${p.year} · Fin de carrière (${p.retired})`); p.endLogged=true; farewell(); save(); }
  if(p.afterStory) return afterStoryScreen();
  const opts = Object.entries(AFTER).filter(([,a])=>a.ok());
  $("#app").innerHTML = `<div class="fade" style="padding-top:20px">
    ${takeToast()}
    <div class="muted">${esc(p.retired)} · ${p.age} ans</div>
    <h1>Et maintenant ?</h1>
    ${p.jubile?`<div class="card"><b>🎟️ Ton jubilé</b><p class="story" style="margin:6px 0 0">${esc(p.jubile)}</p></div>`:""}
    <p class="story">Les crampons sont rangés. ${p.seasons.length} saisons, ${nPl(p.clubsHist.length,"club")}, ${nPl(p.trophies.length,"trophée")}. Il te reste toute une vie à écrire.</p>
    <div class="card">${opts.map(([k,a],i)=>`<button class="btn" onclick="chooseAfter('${k}')">${choiceLead(a.n,i,{coach:"whistle",tv:"tv",boss:"idcard",acad:"sprout",agent:"handshake",calme:"palm"}[k])}<span class="ctext">${a.n}</span><small>${a.d}</small></button>`).join("")}</div></div>`;
  window.scrollTo(0,0);
}
function chooseAfter(k){
  if(k==="coach") return startCoach();
  if(AFTER_STORIES[k]){ p.afterStory = {k,i:0,s:0,log:[]}; save(); return afterStoryScreen(); }
  const kids = p.vie?.kids||0, couple = p.vie?.couple;
  const t = `Tu t'installes au bord de la mer${kids?` avec ${kids>1?"tes enfants":"ton enfant"}`:""}${couple?" et la personne qui a toujours été là":""}. Tu joues encore en vétérans le dimanche, et tu marques toujours.`;
  p.after = {k,n:AFTER[k].n,t};
  save(); endScreen();
}
const afterStoryOpts = ()=>AFTER_STORIES[p.afterStory.k].steps[p.afterStory.i].ch;
function afterStoryScreen(){
  const A = p.afterStory, story = AFTER_STORIES[A.k], step = story.steps[A.i];
  $("#app").innerHTML = `<div class="fade" tabindex="-1" style="padding-top:20px">${takeToast()}
    <div class="muted">${AFTER[A.k].n} · décision ${A.i+1}/${story.steps.length}</div>
    <h1>${AFTER[A.k].n}</h1>
    <div class="card"><p class="story">${step.t()}</p>${step.ch.map((c,j)=>`<button class="btn" onclick="afterStoryChoose(${j})">${choiceLead(c.t,j)}<span class="ctext">${c.t}</span>${c.risk?'<span class="chip">🎲 Risqué</span>':""}</button>`).join("")}</div></div>`;
  window.scrollTo(0,0); focusScreen();
}
function afterStoryChoose(j){
  const A = p.afterStory, story = AFTER_STORIES[A.k], c = story.steps[A.i].ch[j];
  if(c.to==="coach"){ p.moments.push(`${p.year} · Quitte les plateaux télé pour le banc de touche`); delete p.afterStory; return startCoach(); }
  const res = c.risk?(chance(c.risk.p)?c.risk.good:c.risk.bad):c;
  A.s += res.s||0; A.log.push(res.txt);
  if(res.moment) p.moments.push(`${p.year} · ${res.moment}`);
  A.i++;
  if(A.i<story.steps.length){ ui.toast = `<div class="tchoice">Tu as choisi : ${c.t}</div><div>${res.txt}</div>`; save(); return afterStoryScreen(); }
  const tier = A.s>=3?2:A.s>=1?1:0;
  p.after = {k:A.k,n:AFTER[A.k].n,t:`${A.log.join(" ")} ${story.end[tier]()}`};
  delete p.afterStory;
  save(); endScreen();
}

/* ============ Bilan final ============ */
function endScreen(){
  recordCareer();
  const newAch = ACH.filter(a=>(p.newAch||[]).includes(a.id)||(p.liveAch||[]).includes(a.id));
  const tot = careerTotals();
  const avg = p.seasons.length?(p.seasons.reduce((a,s)=>a+ +s.rating,0)/p.seasons.length).toFixed(2):"–";
  const peak = Math.max(...p.seasons.map(s=>s.lvl),p.lvl);
  const grouped = {}; p.trophies.forEach(t=>{const k=t.t.replace(/ \d{4}$/,"");grouped[k]=(grouped[k]||[]).concat(t.y)});
  const stars = p.trophies.filter(t=>t.t.startsWith("Ballon")).length;
  const gradeCard = gradeHtml();
  const verdict = stars?"Une légende du football mondial.":peak>=88?"Un joueur de classe mondiale.":peak>=80?"Une très belle carrière au plus haut niveau.":peak>=70?"Un pro solide, respecté partout où il est passé.":p.seasons.length<6?"Une carrière trop courte, pleine de regrets.":"Un parcours modeste, mais un rêve vécu.";
  const clubHue = n=>(p.clubsHist.indexOf(n)*67+40)%360;
  const r = p.rival;
  let rivalCard = "";
  if(r){
    const me = {g:p.pos==="GB"?tot.cs:tot.g,t:p.trophies.length,s:stars,c:p.caps,b:peak};
    const him = {g:p.pos==="GB"?r.clean:r.goals,t:r.trophies,s:r.stars,c:r.caps,b:r.best};
    const pts = ["g","t","s","c","b"].reduce((a,k)=>a+(me[k]>him[k]?1:me[k]<him[k]?-1:0),0)+(r.h2h.w-r.h2h.l)*.5;
    const row = (lbl,a,b)=>`<b class="${a>b?"w":""}">${a}</b><span class="lbl">${lbl}</span><b class="${b>a?"w":""}">${b}</b>`;
    rivalCard = `<div class="card"><h3>⚔️ La rivalité : toi contre ${esc(r.name)} ${flag(r.country)}</h3>
      <div class="vs"><b>${esc(p.name)}</b><span></span><b>${esc(r.name)}</b>
      ${row(p.pos==="GB"?"clean sheets":"buts",me.g,him.g)}${row("trophées",me.t,him.t)}${row("Ballons d'Étoile",me.s,him.s)}${row("sélections",me.c,him.c)}${row("niveau max",me.b,him.b)}
      ${row("confrontations gagnées",r.h2h.w,r.h2h.l)}</div>
      <p class="story" style="margin-bottom:0"><b>${pts>0?"Tu as gagné la rivalité. On parlera de toi en premier.":pts<0?`${esc(r.name)} a gagné la rivalité… mais il te doit une partie de sa grandeur.`:"Impossible de vous départager. Deux légendes liées pour toujours."}</b></p></div>`;
  }
  $("#app").innerHTML = `<div class="fade" style="padding-top:20px">
  <div class="muted">Bilan de carrière</div><h1>${esc(p.name)} ${flag(p.country)}</h1>
  <p class="story">${POS[p.pos].n} · ${TRAITS[p.trait].n} · ${p.seasons.length} saisons · retraite à ${p.age} ans<br><b>${verdict}</b></p>${gradeCard}
  ${titleCard()}
  ${chaptersCard()}
  ${storyEndCard()}
  <div class="stats">
    <div class="stat"><b>${tot.apps}</b><span>matchs</span></div>
    ${p.pos==="GB"?`<div class="stat"><b>${tot.cs}</b><span>clean sheets</span></div>`:`<div class="stat"><b>${tot.g}</b><span>buts</span></div>`}
    <div class="stat"><b>${tot.a}</b><span>passes déc.</span></div>
    <div class="stat"><b>${avg}</b><span>note moy.</span></div>
    <div class="stat"><b>${p.caps}</b><span>sélections</span></div>
    <div class="stat"><b>${peak}</b><span>niveau max</span></div>
    <div class="stat money"><b>${money(p.money)}</b><span>fortune</span></div>
  </div>
  <div class="card"><h3>Trajectoire</h3><div class="muted" style="font-size:.8rem">Niveau saison par saison · une couleur par club · ★ saison avec trophée</div>
    <div class="timeline">${p.seasons.map(s=>`<div class="${s.tr?"t":""}" title="${s.y} · ${esc(s.club)} · niveau ${s.lvl}" style="height:${clamp((s.lvl-30)/70*100,6,100)}%;background:hsl(${clubHue(s.club)} 65% 55%)"></div>`).join("")}</div>
    <div style="display:flex;justify-content:space-between" class="muted"><small>${p.seasons[0]?.age??16} ans</small><small>${p.age} ans</small></div></div>
  ${unesCard()}
  ${(p.phone?.trends||[]).length?`<div class="card"><h3>📱 Tes années sur les réseaux</h3><div class="frise">${p.phone.trends.map(t=>`<span class="${t.good?"good":"bad"}"><small>${t.age} ans</small>${esc(t.tag)}</span>`).join("")}</div></div>`:""}
  ${newAch.length?`<div class="card celebrate"><h3>🔓 ${newAch.length} succès débloqué${newAch.length>1?"s":""} !</h3>${newAch.map(a=>`<div class="ach new"><span class="i">${a.i}</span><div><b>${a.n}</b><small>${a.d}</small></div></div>`).join("")}</div>`:""}
  ${typeof gearNews==="function"&&!p.daily&&!p.friend?gearNews():""}
  ${p.daily||p.friend?"":foundCard()}
  ${p.after?`<div class="card"><h3>Après la carrière : ${p.after.n}</h3><p class="epi">${p.after.t}</p></div>`:""}
  ${coachCard()}
  ${dynastyCard()}
  ${p.daily?`<div class="card celebrate" id="dailyBox"><h3>${p.weekly?`🎯 Défi de la semaine · ${p.daily}</h3><p class="muted" style="margin:0 0 6px">Objectif « ${WEEKLY.find(w=>w.id===p.weekly)?.d} » : ${weeklyDone()?"réussi ✅ (+150)":"manqué"}</p>`:`📅 Défi du jour · ${p.daily}</h3>`}<p class="story" style="margin:0 0 8px">Ton score : <b style="font-size:1.6rem;color:var(--accent)">${dailyScore()}</b></p><div class="lb muted">Envoi de ton score…</div></div>`:""}
  ${friendCard()}
  ${rivalCard}
  <div class="card"><h3>Palmarès</h3>${Object.keys(grouped).length?Object.entries(grouped).map(([k,ys])=>`<div class="trophy">🏆 ${ys.length>1?ys.length+"× ":""}${k} <span class="muted" style="font-weight:400">(${ys.join(", ")})</span></div>`).join(""):'<span class="muted">Aucun trophée.</span>'}</div>
  <div class="card"><h3>Clubs</h3>${p.clubsHist.map(n=>`<span class="tag" style="border-color:hsl(${clubHue(n)} 65% 55%)">${crest(n,14)} ${esc(n)}</span>`).join("")}</div>
  <div class="card"><h3>Saison par saison</h3><div class="tablewrap"><table><tr><th>Saison</th><th>Club</th><th>Âge</th><th>MJ</th><th>${p.pos==="GB"?"CS":"B"}</th><th>PD</th><th>Note</th><th>Cl.</th></tr>
  ${p.seasons.map(s=>`<tr><td>${s.y}</td><td>${flag(s.cc)} ${esc(s.club)}</td><td>${s.age}</td><td>${s.apps}</td><td>${p.pos==="GB"?s.clean:s.goals}</td><td>${s.assists}</td><td>${s.rating}</td><td>${s.rank}${s.tr?" 🏆":""}</td></tr>`).join("")}</table></div></div>
  <div class="card"><h3>Moments marquants</h3><ul class="log">${p.moments.map(m=>`<li>${esc(m)}</li>`).join("")}</ul></div>
  <button class="btn primary" onclick="${p.weekly?"weeklyScreen()":p.daily?"dailyScreen()":p.friend?"friendsScreen()":"startCentre(slot)"}">${p.friend?"Retour aux défis entre amis":p.weekly?"Retour au défi de la semaine":p.daily?"Retour au défi du jour":"Nouvelle carrière"}</button>
  ${p.daily||p.friend?"":`<button class="btn" style="text-align:center;border-color:var(--accent)" onclick="startHeir()">👶 Continuer la dynastie<small>Ton enfant reprend le flambeau à 16 ans, dans cet emplacement</small></button>`}
  <button class="btn" style="text-align:center" onclick="careerFilm()">🎬 Revoir le film de ta carrière</button>
  <button class="btn" style="text-align:center" onclick="exportCard(this)">🖼️ Télécharger ma carte en image</button>
  ${typeof exportStory==="function"?`<button class="btn" style="text-align:center" onclick="exportStory(this)">📱 Image format story<small>Verticale, prête pour les réseaux</small></button>`:""}
  ${typeof filmVideoOk==="function"&&filmVideoOk()?`<button class="btn" style="text-align:center" onclick="exportFilm(this)">🎞️ Exporter le film en vidéo<small>Une trentaine de secondes, format vertical</small></button>`:""}
  <button class="btn" style="text-align:center" onclick="copyCareer(this)">📋 Copier mon bilan pour le partager</button>
  <button class="btn ghost" onclick="hofScreen()">🏛️ Panthéon</button>
  <button class="btn ghost" onclick="home()">Accueil</button></div>`;
  if(newAch.length) confetti();
  if(p.daily) submitDaily();
  submitRecords();
  window.scrollTo(0,0);
}

/* ============ Le film de la carrière ============ */
// joué une fois, juste avant le bilan ; « Revoir le film » le relance
function careerFilm(){
  const fr = careerFilmFrames();
  filmDone = ()=>{ p.filmSeen = true; save(); endScreen(); };
  filmShow(fr,"Le film de ta carrière");
}
// les images du film (HTML) : aussi lues par partage.js pour la vidéo
function careerFilmFrames(){
  const by = p.year-p.age, ms = p.moments.map(x=>{ const [y,...t] = x.split(" · "); return {y:+y,t:t.join(" · ")}; }).filter(x=>x.t&&x.y);
  const big = ms.filter(x=>!(!p.cf&&x.t.startsWith("Premier contrat pro"))).filter(x=>BIG.test(x.t)||/S'impose comme titulaire|Au sommet|rendez-vous manqué|Premier contrat|Première sélection|Saison à \d+ buts|Triplé|finale de coupe/.test(x.t));
  // au plus six moments, répartis sur toute la carrière
  const pickN = (a,n)=>a.length<=n?a:Array.from({length:n},(_,i)=>a[Math.round(i*(a.length-1)/(n-1))]);
  const fr = [filmFrame(`${p.cf?16:p.seasons[0]?.age??16} ans`,esc(p.cf?"Un dimanche de pluie, un penalty, un homme en imperméable.":`Tout a commencé ${auC(p.clubsHist[0])}.`),p.cf?cfSay("vasseur","« Ton nom. »"):"")];
  const dot = t=>/[.!?…»]$/.test(t)?t:t+".";
  for(const m of pickN(big.length?big:ms.slice(-4),6)) fr.push(filmFrame(`${m.y-by} ans`,esc(dot(m.t))));
  if(p.cf){
    const c = p.cf, r = p.rival, won = typeof rivalScore==="function"&&rivalScore()>0;
    if(r&&r.cf) fr.push(filmFrame("Sacha",won?"La rivalité est pour toi.":"La rivalité est pour Sacha.",cfSay("sacha",won?(c.sacha>=1?"« Tu as gagné. Je ne te l'ai jamais dit en face. Voilà, c'est dit. »":"« Tu as gagné. Ça ne veut pas dire que tu avais raison. »"):(c.mem.nuit==="porte"?"« J'ai gagné. Mais sans toi, je n'aurais pas tenu la première nuit. »":"« On est quittes. Presque. »"))));
    fr.push(filmFrame("Toujours là",T("{Par}, dans la tribune, le jour de ton dernier match."),cfSay("par","« Je suis venu{e} à tous les matchs que j'ai pu. Les autres, je les ai regardés en cachette, le son coupé, le cœur à cent à l'heure. »")));
  }
  const cr = typeof crewFilmFrame==="function"?crewFilmFrame():null; if(cr) fr.push(cr);
  const t = careerTitles()[0], g = careerGrade();
  fr.push(`<section class="cf-frame"><span class="cf-age">${p.age} ans · ${p.seasons.length} saison${p.seasons.length>1?"s":""}</span><h1 class="cf-endt">« ${esc(t.n)} »</h1><p class="cf-ft">${esc(g.label)} · ${g.v}/100</p></section>`);
  return fr;
}

/* ============ Carrière d'entraîneur ============ */
/** @type {any[]} */
const COACH_EVENTS = [
 {t:"Un gamin de 17 ans éblouit tout le monde à l'entraînement.",ch:[
   {t:"Le lancer dans le grand bain",risk:{p:.55,good:{b:3,lvl:1,moment:"Lance un futur crack",txt:"Il explose. Les recruteurs du monde entier appellent."},bad:{b:-2,txt:"Il craque sous la pression. Tu as brûlé les étapes."}}},
   {t:"Le faire patienter",fx:{},why:"Il progressera à son rythme."}]},
 {t:"Le président veut t'imposer une recrue de son ami agent.",ch:[
   {t:"Accepter pour avoir la paix",fx:{b:-1,sack:-10},why:"Le président t'adore. Le vestiaire grince."},
   {t:"Refuser fermement",risk:{p:.5,good:{b:1,lvl:1,txt:"Le président s'incline. Ton autorité grandit."},bad:{sack:20,txt:"Le président ne l'oubliera pas."}}}]},
 {t:"Ta star menace de bouder si elle n'est pas augmentée.",ch:[
   {t:"La soutenir auprès de la direction",fx:{b:1},why:"Elle se donne à fond pour toi."},
   {t:"La mettre sur le banc",risk:{p:.5,good:{b:2,lvl:1,txt:"Le groupe se resserre derrière toi."},bad:{b:-3,txt:"Elle refuse de jouer. Le vestiaire se divise."}}}]},
 {t:"En conférence de presse, un journaliste te provoque sur tes résultats.",ch:[
   {t:"Répondre avec humour",fx:{lvl:1},why:"La séquence devient virale."},
   {t:"Quitter la salle",fx:{sack:10,b:1},why:"Le vestiaire apprécie, la direction beaucoup moins."}]},
 {t:"Ton adjoint propose une méthode d'entraînement révolutionnaire.",ch:[
   {t:"L'essayer",risk:{p:.5,good:{b:3,lvl:2,txt:"Tes joueurs volent sur le terrain."},bad:{b:-2,txt:"Une vague de blessures musculaires."}}},
   {t:"Garder tes méthodes",fx:{},why:"Pas de surprise."}]},
 {t:"Après trois défaites, le vestiaire est divisé en deux clans.",ch:[
   {t:"Organiser un stage de cohésion",fx:{b:2},why:"Les clans disparaissent."},
   {t:"Écarter les meneurs",risk:{p:.45,good:{b:2,lvl:1,txt:"Électrochoc réussi."},bad:{b:-3,sack:15,txt:"Ça explose dans la presse."}}}]},
 {t:"Un ancien coéquipier, devenu agent, te propose un joueur inconnu.",ch:[
   {t:"Lui faire confiance",risk:{p:.5,good:{b:3,txt:"La pépite cachée de la saison !"},bad:{b:-1,txt:"Un flop retentissant."}}},
   {t:"Décliner poliment",fx:{},why:"Pas de risque inutile."}]},
 {cond:()=>p.coach.lvl>=72,t:"Une petite fédération te propose de prendre sa sélection en parallèle de ton club.",ch:[
   {t:"Accepter le double défi",risk:{p:.5,good:{lvl:3,moment:"Qualifie une petite sélection pour le Championnat du Monde",txt:"Tu qualifies la sélection pour le Championnat du Monde !"},bad:{b:-2,txt:"Tu t'épuises sur les deux fronts."}}},
   {t:"Rester concentré sur ton club",fx:{b:1},why:"Le club te remercie de ta loyauté."}]},
 {cond:()=>p.rival&&p.rival.coachClub,t:()=>`Avant le choc contre ${esc(p.rival.coachClub.name)}, ton ancien rival ${esc(p.rival.name)}, désormais entraîneur, te chambre dans la presse.`,ch:[
   {t:"Répondre sur le terrain",risk:{p:.5,good:{b:2,lvl:1,moment:"Bat son ancien rival sur le banc",txt:"Tactiquement, tu l'as dominé. Il te serre la main, beau joueur."},bad:{b:-1,txt:"Il gagne la bataille des bancs. Pour cette fois."}}},
   {t:"L'inviter à dîner après le match",fx:{b:1},why:"Deux anciens rivaux, enfin amis."}]},
 {t:"Ton gardien titulaire enchaîne les boulettes. Le public réclame la doublure.",ch:[
   {t:"Le maintenir : « Il reste mon numéro 1. »",risk:{p:.55,good:{b:2,txt:"Il sort le match de sa vie le week-end suivant. Il ne l'oubliera jamais."},bad:{b:-2,sack:10,txt:"Encore une erreur. Les sifflets visent maintenant ton banc."}}},
   {t:"Lancer la doublure",fx:{b:1,sack:-5},why:"Le jeune tient la baraque. Le titulaire boude."}]},
 {t:"Un grand club vient chercher ton meilleur joueur en plein hiver.",ch:[
   {t:"Supplier la direction de refuser",fx:{b:1,sack:5},why:"Il reste, mais le président a perdu une fortune."},
   {t:"Le laisser partir et recruter avec l'argent",risk:{p:.5,good:{b:2,lvl:1,txt:"Tes deux recrues font mieux que lui. Le flair du coach."},bad:{b:-3,txt:"Personne ne le remplace. Ton équipe perd son âme."}}}]},
 {t:"Avant un match capital, la presse révèle ta composition d'équipe. Il y a une taupe dans le vestiaire.",ch:[
   {t:"Chercher la fuite",risk:{p:.5,good:{b:1,lvl:1,txt:"Tu trouves la taupe. Le groupe sort ressoudé."},bad:{b:-2,txt:"La chasse aux sorcières empoisonne le vestiaire."}}},
   {t:"Changer de plan au dernier moment",fx:{b:2},why:"L'adversaire avait préparé le mauvais match."}]},
 {t:"Tes joueurs se plaignent : tes séances sont trop dures.",ch:[
   {t:"Lever le pied",fx:{b:1},why:"Le sourire revient aux entraînements."},
   {t:"Serrer la vis",risk:{p:.5,good:{b:3,txt:"En fin de saison, ils courent encore quand les autres marchent."},bad:{b:-2,sack:10,txt:"Les cadres vont se plaindre au président."}}}]},
 {t:"La fédération te propose de suivre une formation d'entraîneur de haut niveau, en pleine saison.",ch:[
   {t:"T'inscrire",fx:{lvl:2,b:-1},why:"Tu apprends énormément. Ton adjoint gère les séances du lundi."},
   {t:"Plus tard",fx:{},why:"Ta saison d'abord."}]},
 {t:"Un documentaire veut te suivre toute la saison, caméras dans le vestiaire.",ch:[
   {t:"Accepter",risk:{p:.5,good:{lvl:1,sack:-10,txt:"La série cartonne. Tout le pays découvre ta méthode."},bad:{b:-2,txt:"Tes joueurs jouent pour les caméras, plus pour le maillot."}}},
   {t:"Refuser",fx:{b:1},why:"Ce qui se passe dans le vestiaire reste dans le vestiaire."}]},
 {t:"Ton capitaine, 35 ans, te demande s'il doit prolonger d'un an.",ch:[
   {t:"« Reste, j'ai besoin de toi. »",fx:{b:1},why:"Il sera ta voix dans le vestiaire."},
   {t:"« Il est temps de passer le relais. »",risk:{p:.5,good:{b:2,txt:"Le nouveau capitaine prend le groupe en main."},bad:{b:-2,txt:"Le vestiaire perd son repère."}}}]},
 {t:"Un match se joue sous la neige. L'arbitre hésite à le reporter.",ch:[
   {t:"Pousser pour jouer : ton équipe est prête",risk:{p:.5,good:{b:2,txt:"Vous gagnez dans la poudreuse. Victoire de caractère."},bad:{b:-1,txt:"Deux blessés sur un terrain gelé."}}},
   {t:"Demander le report",fx:{},why:"Le match est rejoué un mardi, sans histoire."}]}
];
function startCoach(){
  const peak = Math.max(...p.seasons.map(s=>s.lvl),p.lvl);
  const lvl = Math.round(clamp(45+(peak-60)*.5+(p.flags.cap?5:0)+(p.trait==="lead"?5:0)+(p.flags.diplome?3:0)+(has("charisme")?3:0),40,80));
  const home = CLUBS.filter(c=>c.country===p.country).sort((a,b)=>a.str-b.str);
  const club = pick(home.slice(0,5));
  p.coach = {lvl,club:{...club},age:p.age,year:p.year,hist:[],trophies:[],sack:0,step:"event",ev:null,b:0,clubs:[club.name],res:null};
  if(p.rival&&p.rival.retired&&chance(.6)) p.rival.coachClub = {...pick(CLUBS.filter(c=>c.str>=60))};
  p.moments.push(`${p.year} · Débuts d'entraîneur ${auC(club.name)}`);
  save(); route();
}
function coachRoute(){
  const k = p.coach;
  if(k.step==="event") return coachEventScreen();
  if(k.step==="mercato") return coachMercatoScreen();
  if(k.step==="style") return coachStyleScreen();
  if(k.step==="match") return coachMatchScreen();
  return coachResultScreen();
}
function coachHead(){
  const k = p.coach;
  return `<div class="hud"><div class="top"><b>📋 Coach ${esc(p.name)} ${flag(p.country)}</b><span class="muted">${k.age} ans · ${k.hist.length?`${nPl(k.hist.length,"saison")} sur le banc`:"première saison sur le banc"}</span><span>${flag(k.club.country)} ${esc(k.club.name)} <span class="muted">(${k.club.str})</span></span></div>
  <div class="bars">${bar("Talent de coach",k.lvl,"var(--accent)")}${bar("Pression du président",clamp(k.sack,0,100),"var(--bad)")}${bar("Trophées",Math.min(100,k.trophies.length*10),"var(--good)")}</div></div>`;
}
// sur le banc aussi, on peut revenir à l'accueil ou ouvrir le menu
const coachNav = ()=>`<nav class="navbar" aria-label="Navigation"><button class="nav-b" onclick="home()">${ic("home")}<span>Accueil</span></button><button class="nav-b" onclick="menuSheet()">${ic("menu")}<span>Menu</span></button></nav>`;
function coachRender(html){ $("#app").innerHTML = coachHead()+`<div class="fade">${html}</div>`+coachNav(); window.scrollTo(0,0); }
function coachEventScreen(){
  const k = p.coach;
  if(k.ev===null){
    // pas deux fois la même situation tant qu'il en reste de nouvelles
    const ok = COACH_EVENTS.map((e,i)=>i).filter(i=>!COACH_EVENTS[i].cond||COACH_EVENTS[i].cond()), seen = k.seen||[];
    const fresh = ok.filter(i=>!seen.includes(i));
    k.ev = pick(fresh.length?fresh:ok); k.seen = [...seen,k.ev]; save();
  }
  const e = COACH_EVENTS[k.ev], txt = typeof e.t==="function"?e.t():e.t;
  coachRender(`<div class="muted">Saison ${k.year}-${String(k.year+1).slice(2)} · sur le banc</div>
    <div class="card"><p class="story">${txt}</p>${e.ch.map((c,i)=>`<button class="btn" onclick="coachChoose(${i})">${choiceLead(c.t,i)}<span class="ctext">${c.t}</span>${c.risk?'<span class="chip">🎲 Risqué</span>':""}</button>`).join("")}</div>`);
}
function coachChoose(i){
  const k = p.coach, c = COACH_EVENTS[k.ev].ch[i];
  let res = c.fx, txt = c.why;
  if(c.risk){ res = chance(c.risk.p)?c.risk.good:c.risk.bad; txt = res.txt; }
  if(res.b) k.b += res.b; if(res.lvl) k.lvl = clamp(k.lvl+res.lvl,30,99); if(res.sack) k.sack = clamp(k.sack+res.sack,0,100);
  if(res.moment) p.moments.push(`${k.year} · ${res.moment}`);
  k.step = "mercato"; k.note = txt; save(); coachMercatoScreen();
}
// l'été du coach : le mercato, en une décision
const COACH_REC = {
  star:{i:"💸",n:"Exiger une star",d:"Un gros coup tout de suite. Le président attend des résultats.",b:2},
  jeunes:{i:"🌱",n:"Lancer les jeunes du centre",d:"Plus faible cette saison, mais ils grandiront avec toi",b:-1},
  groupe:{i:"🤝",n:"Garder le groupe",d:"La stabilité, et un président rassuré",b:.5}
};
function coachMercatoScreen(){
  const k = p.coach;
  coachRender(`${k.note?`<div class="card"><p class="story" style="margin:0">${k.note}</p></div>`:""}
    <div class="card"><h2>☀️ Ton mercato d'été</h2>${k.youth?`<p class="muted">Tes jeunes lancés les saisons passées : ${nPl(k.youth,"génération")} qui progresse.</p>`:""}
    ${Object.entries(COACH_REC).map(([id,r],i)=>`<button class="btn" onclick="coachRecruit('${id}')"><span class="cic t${i}">${ic(({star:"coins",jeunes:"tree",groupe:"handshake"})[id])}<kbd>${i+1}</kbd></span><span class="ctext">${r.n}</span><small>${r.d}</small></button>`).join("")}</div>`);
}
function coachRecruit(id){
  const k = p.coach, r = COACH_REC[id];
  // les jeunes lancés les étés précédents finissent par porter l'équipe (jusqu'à +3)
  k.b += r.b+Math.min(3,k.youth||0); k.rec = id;
  if(id==="jeunes"){ k.youth = (k.youth||0)+1; if(k.youth===3) p.moments.push(`${k.year} · Entraîneur : sa génération dorée du centre éclot ${auC(k.club.name)}`); }
  if(id==="groupe") k.sack = clamp(k.sack-3,0,100);
  k.note = null; k.step = "style"; save(); coachStyleScreen();
}
function coachStyleScreen(){
  const k = p.coach;
  coachRender(`${k.note?`<div class="card"><p class="story" style="margin:0">${k.note}</p></div>`:""}
    <div class="card"><h2>Ton style de jeu cette saison</h2>
    ${[["att","fire","Offensif","Spectaculaire et risqué : grosses saisons ou gros trous"],["eq","target","Équilibré","Le juste milieu"],["def","shield","Défensif","Régulier, rarement brillant"]].map(([k,i,t,d],n)=>`<button class="btn" onclick="coachPickStyle('${k}')"><span class="cic t${n}">${ic(i)}<kbd>${n+1}</kbd></span><span class="ctext">${t}</span><small>${d}</small></button>`).join("")}</div>`);
}
// le match clé de la saison, vu du banc : une décision à la 70e minute
const COACH_MATCH = [
  {t:c=>`Derby, 70e minute, 0-0. Les tribunes ${duC(c.name)} grondent. Ton adjoint attend ta décision.`,o:[
    {t:"Faire entrer le gamin de 18 ans",p:.45,ok:"Il marque sur son premier ballon. Le stade chavire, la presse parle de coup de génie.",ko:"Il se liquéfie. Défaite 0-1, et la presse se demande ce qui t'est passé par la tête."},
    {t:"Passer à trois derrière et attendre le contre",p:.55,ok:"Un contre, un but, 1-0. Du grand art tactique.",ko:"Ils marquent quand même, sur coup de pied arrêté. 0-1."},
    {t:"Ne rien changer",p:.5,ok:"Ton équipe finit par faire craquer la défense. 1-0 à la 88e.",ko:"0-0. Un point, et des sifflets."}]},
  {t:c=>`Choc au sommet, 70e minute, vous êtes menés 0-1. Ton capitaine te regarde depuis la pelouse.`,o:[
    {t:"Tout pour l'attaque : trois attaquants",p:.42,ok:"Égalisation, puis 2-1 dans le temps additionnel. Ton banc envahit le terrain.",ko:"Contre adverse, 0-2. Tu as perdu le match et le vestiaire grogne."},
    {t:"Changer de système, sans paniquer",p:.52,ok:"Ton équipe reprend le contrôle et égalise. 1-1, un point qui vaut de l'or.",ko:"Rien n'y fait. 0-1."}]},
  {t:c=>`Finale de la coupe nationale, prolongation, 1-1. Tes joueurs ont des crampes. Il te reste un changement.`,o:[
    {t:"Faire entrer ton tireur de penalties",p:.5,ok:"Tirs au but. Il marque le dernier. La coupe est à vous !",ko:"Tirs au but perdus. Ton tireur marque, les autres tremblent."},
    {t:"Faire entrer un attaquant frais",p:.45,ok:"118e minute, une tête plongeante. La coupe est à vous !",ko:"Il manque l'occasion du match à la 119e. Tirs au but perdus."}]},
  {t:c=>`Dernière journée, il faut gagner pour rester dans la course. Mi-temps, 0-0. Le vestiaire attend ton discours.`,o:[
    {t:"Hausser le ton",p:.5,ok:"Ils reviennent sur la pelouse comme des fauves. 2-0.",ko:"Le groupe se crispe. 0-0, et des larmes dans le vestiaire."},
    {t:"Les rassurer, calmement",p:.5,ok:"Libérés, ils jouent enfin. 1-0 à l'heure de jeu.",ko:"Trop calmes. Ils encaissent sur la première occasion adverse."}]}
];
function coachPickStyle(style){
  const k = p.coach; k.style = style; k.mi = RI(0,COACH_MATCH.length-1); k.step = "match"; save(); coachMatchScreen();
}
function coachMatchScreen(){
  const k = p.coach, M = COACH_MATCH[k.mi||0];
  coachRender(`<div class="card"><h2>📋 Le match clé, depuis le banc</h2><p class="story">${esc(M.t(k.club))}</p>
    ${M.o.map((o,i)=>`<button class="btn" onclick="coachMatch(${i})">${choiceLead(o.t,i)}<span class="ctext">${esc(o.t)}</span><small>${riskHtml(o.p+(k.lvl-60)*.005)}</small></button>`).join("")}</div>`);
}
function coachMatch(i){
  const k = p.coach, o = COACH_MATCH[k.mi||0].o[i], ok = chance(clamp(o.p+(k.lvl-60)*.005,.1,.9));
  k.b += ok?1.5:-1; if(ok) k.lvl = clamp(k.lvl+1,30,99);
  k.matchNote = (ok?"✅ ":"❌ ")+(ok?o.ok:o.ko);
  // la scène de la finale de coupe décide vraiment du trophée
  k.cupForced = /^Finale de la coupe/.test(COACH_MATCH[k.mi||0].t(k.club))?ok:null;
  coachPlay(k.style||"eq");
}
function coachPlay(style){
  const k = p.coach, c = k.club;
  const spread = {att:13,eq:9,def:5}[style], bonus = {att:1,eq:.5,def:0}[style];
  const power = c.str+(k.lvl-60)*.3+k.b+bonus;
  const league = CLUBS.filter(x=>x.country===c.country).map(x=>({n:x.name,s:x.name===c.name?power+R(-spread,spread):x.str+R(-9,9)})).sort((a,b)=>b.s-a.s);
  const rank = league.findIndex(x=>x.n===c.name)+1, lg = COUNTRIES[c.country].league;
  const tr = [];
  if(rank===1) tr.push(`Champion – ${lg}`);
  if(k.cupForced!=null?k.cupForced:chance(clamp(.05+(power-60)*.008,.02,.3))) tr.push(`Coupe nationale (${COUNTRIES[c.country].name})`);
  if(c.str>=78&&chance(clamp((power-76)*.015,0,.3))) tr.push("Coupe des Champions");
  const obj = c.str>=85?{t:"Être champion",ok:rank<=1}:c.str>=76?{t:"Finir sur le podium",ok:rank<=3}:c.str>=64?{t:"Finir dans la première moitié",ok:rank<=5}:{t:"Éviter la dernière place",ok:rank<10};
  k.lvl = clamp(k.lvl+(obj.ok?RI(1,3):-RI(0,2))+tr.length*2,30,99);
  k.sack = clamp(k.sack+(obj.ok?-12:16)+(rank>=league.length-1?15:0)-tr.length*10+(k.rec==="star"&&!obj.ok?10:0),0,100);
  const sacked = k.sack>=45&&chance(.7);
  tr.forEach(t=>{ k.trophies.push({t,y:k.year+1}); });
  if(tr.length) p.moments.push(`${k.year+1} · Entraîneur : ${tr.join(", ")} avec ${c.name}`);
  let rivalLine = null;
  if(p.rival?.coachClub){
    const rc = p.rival.coachClub;
    if(rc.country===c.country){ const rr = league.findIndex(x=>x.n===rc.name)+1; rivalLine = `${p.rival.name} (${rc.name}) termine ${rr}e. ${rr>rank?"Tu le devances !":"Il te devance."}`; }
    else rivalLine = `${p.rival.name} entraîne toujours ${leC(rc.name)}.`;
  }
  k.hist.push({y:`${k.year}-${String(k.year+1).slice(2)}`,club:c.name,cc:c.country,rank,tr:tr.length,style});
  const won = rank<=3||tr.length>0;
  const n = won?RI(1,3):obj.ok?RI(0,2):RI(0,1);
  k.offers = shuffle(CLUBS.filter(x=>x.name!==c.name&&x.str>=c.str-4&&x.str<=c.str+(won?10:4)+(k.lvl-60)*.2)).slice(0,n).map(x=>({...x}));
  if(sacked){ p.moments.push(`${k.year+1} · Limogé ${duC(c.name)}`); if(!k.offers.length) k.offers = [{...pick(CLUBS.filter(x=>x.str<c.str&&x.str>=c.str-15))||pick(CLUBS)}]; }
  k.res = {match:k.matchNote||null,rank,tr,obj,sacked,rivalLine,table:league.map((x,i)=>({n:x.n,pos:i+1})).filter(x=>x.pos<=4||x.n===c.name),lg,style};
  k.year++; k.age++; k.b = 0; k.rec = null; k.matchNote = null; k.cupForced = null; k.step = "result";
  save(); coachResultScreen();
  if(tr.length){ confetti(); sfx("trophy"); }
}
function coachResultScreen(){
  const k = p.coach, r = k.res, c = k.club;
  const end = k.age>=70;
  coachRender(`<div class="muted">Bilan de la saison ${k.hist.at(-1).y} · style ${({att:"offensif",eq:"équilibré",def:"défensif"})[r.style]}</div>
    ${r.match?`<div class="card"><p class="story" style="margin:0">📋 ${esc(r.match)}</p></div>`:""}
    ${r.tr.length?`<div class="card celebrate">${r.tr.map(t=>`<div class="trophy" style="font-size:1.1rem">🏆 ${t}</div>`).join("")}</div>`:""}
    <div class="card"><h2>${flag(c.country)} ${esc(c.name)} · ${r.rank}<sup>e</sup></h2>
      <table class="mini"><tr><th>#</th><th>${esc(r.lg)}</th></tr>${r.table.map(x=>`<tr class="${x.n===c.name?"me":""}"><td>${x.pos}</td><td>${esc(x.n)}</td></tr>`).join("")}</table>
      <p>Objectif du président : <b>${r.obj.t}</b> — ${r.obj.ok?'<span style="color:var(--good)">atteint ✓</span>':'<span style="color:var(--bad)">manqué ✗</span>'}</p>
      ${r.rivalLine?`<p>⚔️ ${esc(r.rivalLine)}</p>`:""}
      ${r.sacked?`<p style="color:var(--bad)"><b>Le président te limoge.</b></p>`:""}</div>
    <div class="card"><h3>La suite</h3>
      ${!r.sacked&&!end?`<button class="btn primary" onclick="coachStay()">Rester ${auC(esc(c.name))}</button>`:""}
      ${!end?k.offers.map((x,i)=>`<button class="btn" onclick="coachSign(${i})">${flag(x.country)} ${esc(x.name)} <span class="muted">(${x.str})</span><small>${COUNTRIES[x.country].league}</small></button>`).join(""):`<p class="muted">À ${k.age} ans, il est temps de passer la main.</p>`}
      <button class="btn ghost" onclick="endCoach()">Raccrocher le survêtement</button></div>`);
}
function coachStay(){ const k = p.coach; k.step = "event"; k.ev = null; k.note = null; save(); route(); }
function coachSign(i){
  const k = p.coach, x = k.offers[i];
  k.club = {...x}; if(!k.clubs.includes(x.name)) k.clubs.push(x.name);
  k.sack = 10; p.moments.push(`${k.year} · Nommé entraîneur ${duC(x.name)}`);
  coachStay();
}
function endCoach(){
  const k = p.coach, titles = k.trophies.length;
  const leagues = k.trophies.filter(t=>t.t.startsWith("Champion")).length, cdc = k.trophies.filter(t=>t.t==="Coupe des Champions").length;
  const t = `${nPl(k.hist.length,"saison")} sur le banc, ${k.clubs.length} ${k.clubs.length>1?"clubs entraînés":"club entraîné"}${titles?`, ${nPl(titles,"trophée")} dont ${nPl(leagues,"titre")} de champion${cdc?` et ${nPl(cdc,"Coupe")} des Champions`:""}`:", sans trophée, mais avec le respect de tes joueurs"}. ${k.lvl>=85?"Les écoles d'entraîneurs étudient tes méthodes.":k.lvl>=70?"Un entraîneur respecté partout où il est passé.":"Le banc t'aura appris l'humilité."}`;
  p.after = {k:"coach",n:"Entraîneur",t};
  p.coachHist = k.hist; p.coachTrophies = k.trophies;
  save(); endScreen();
}
function coachCard(){
  if(!p.coachHist?.length) return "";
  return `<div class="card"><h3>📋 Carrière d'entraîneur</h3>
    ${p.coachTrophies.length?`<div style="margin-bottom:8px">${p.coachTrophies.map(t=>`<div class="trophy">🏆 ${t.t} <span class="muted" style="font-weight:400">(${t.y})</span></div>`).join("")}</div>`:""}
    <div class="tablewrap"><table><tr><th>Saison</th><th>Club</th><th>Cl.</th><th>Style</th></tr>
    ${p.coachHist.map(h=>`<tr><td>${h.y}</td><td>${flag(h.cc)} ${esc(h.club)}</td><td>${h.rank}${h.tr?" 🏆":""}</td><td>${({att:"⚔️",eq:"⚖️",def:"🛡️"})[h.style]}</td></tr>`).join("")}</table></div></div>`;
}

/* ============ Mode Héritage : la dynastie ============ */
const DEFAULT_NUM = {GB:1,DEF:4,MIL:8,ATT:9};
function startHeir(){
  const last = p.name.split(" ").slice(1).join(" ")||p.name, s = careerSummary();
  const gen = {name:p.name,pos:p.pos,peak:s.peak,trophies:s.trophies,stars:s.stars,seasons:p.seasons.length,score:s.stars*25+s.trophies*3+s.peak};
  const dynasty = (p.dynasty||[]).concat(gen);
  const heir = {parent:p.name,bonus:2+(s.peak>=85?3:s.peak>=75?1:0),dynasty,year:p.year+RI(3,8),gen:dynasty.length+1};
  let first; do first = pick(FIRST); while(p.name.startsWith(first+" "));
  draft = {name:first+" "+last,country:p.country,origin:"fils",ent:"parent",heir,keep:true,look:{...randomLook(),skin:p.look?.skin??2}};
  wipe(); p = null; createStep(1);
}
EVENTS.push(
 {id:"heirCompare",cond:()=>p.heir&&p.age<=24,txt:()=>`Les journalistes te comparent sans cesse à ${esc(p.heir.parent)}. « Jamais au niveau », titre un journal.`,
  ch:[{t:"Revendiquer l'héritage",risk:{p:.5,good:{rep:5,moral:5,moment:"Rend hommage à son parent après un but",txt:"Tu marques et reprends la célébration de ton parent. Le stade est en larmes."},bad:{moral:-6,txt:"Tu passes à côté. La comparaison fait mal."}}},
      {t:"Tracer ta propre route",fx:{moral:3,lvl:1},why:"Tu veux qu'on retienne ton prénom."},
      {t:"Demander conseil à ton parent",fx:{moral:5,form:2},why:"Une longue discussion, comme avant."}]},
 {id:"heirClub",cond:()=>p.heir&&p.age>=19,txt:()=>`Un ancien club de ${esc(p.heir.parent)} rêve de faire signer l'héritier de la famille.`,
  ch:[{t:"Être intéressé",fx:{flag:"forceDepart",rep:2},why:"Une offre arrivera cet été."},
      {t:"Refuser : pas de passe-droit",fx:{moral:3},why:"Tu veux réussir par toi-même."}]},
 {id:"heirNumero",cond:()=>p.heir&&!p.flags.numParent&&!p.flags.numOwn,txt:()=>`Le club te propose de porter le même numéro que ${esc(p.heir.parent)}.`,
  ch:[{t:"Accepter ce numéro",fx:{flag:"numParent",rep:3,moral:2},why:"Le maillot pèse lourd. Quelle fierté."},
      {t:"Choisir ton propre numéro",fx:{flag:"numOwn",moral:2},why:"Le tien. Rien qu'à toi."}]}
);
function dynastyCard(){
  if(!p.dynasty?.length) return "";
  const s = careerSummary(), fam = p.name.split(" ").slice(1).join(" ")||p.name;
  const gens = p.dynasty.concat({name:p.name,pos:p.pos,peak:s.peak,trophies:s.trophies,stars:s.stars,seasons:p.seasons.length,me:true});
  return `<div class="card"><h3>🌳 La dynastie ${esc(fam)}</h3>${gens.map((g,i)=>`<div class="ach"><span class="i">${i+1}</span><div><b>${esc(g.name)}</b>${g.me?" (toi)":""}<small>${POS[g.pos].n} · ${g.seasons} saisons · ${nPl(g.trophies,"trophée")}${g.stars?` · 🌟 ${g.stars}`:""} · niveau max ${g.peak}</small></div></div>`).join("")}</div>`;
}
function dynHof(h){
  if(!h.dyn?.length) return "";
  return `<div class="card"><h3>🌳 Dynasties</h3><table class="mini"><tr><th>Famille</th><th>Générations</th><th>Score</th></tr>${h.dyn.map(d=>`<tr><td>${flag(d.country)} ${esc(d.fam)}</td><td>${d.gens}</td><td>${d.score}</td></tr>`).join("")}</table></div>`;
}
