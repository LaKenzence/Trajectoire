// Trajectoire · Création du joueur, rendu des écrans, sons, écussons, conseils et accessibilité
/* ============ Création ============ */
const FIRST = ["Lucas","Yanis","Matteo","Ibrahima","Noah","Théo","Rayan","Diego","Kylian","Moussa","Enzo","Samir","Joaquín","Arthur","Malik","Tiago","Oscar","Amadou","Luka","Hugo","Bilal","Gonzalo","Elias","Ousmane"];
const LAST = ["Mercier","Diallo","Ferreira","Benali","Costa","Laurent","Koné","Moreau","Silva","Haddad","Rossi","Traoré","Navarro","Petit","Mendes","Okafor","Garnier","Bakari","Vidal","Keller","Sow","Romano","Duarte","Lambert"];
function makeRival(){
  const country = chance(.6)?p.country:pick(Object.keys(COUNTRIES).filter(c=>c!==p.country));
  const clubs = CLUBS.filter(c=>c.country===country).sort((a,b)=>a.str-b.str);
  let name; do name = pick(FIRST)+" "+pick(LAST); while(name===p.name);
  return {name,country,lvl:p.lvl+RI(0,4),pot:RI(80,95),club:{...pick(clubs.slice(3,7))},
    apps:0,goals:0,assists:0,clean:0,trophies:0,stars:0,caps:0,best:0,h2h:{w:0,d:0,l:0},retired:false};
}
function newPlayer(o){
  if(!o.daily&&!o.friend) unseed();
  const pot = o.hard?RI(60,90):RI(68,94);
  p = {hard:!!o.hard, daily:o.daily||null, friend:o.friend||null, name:o.name, country:o.country, pos:o.pos, trait:o.trait, origin:o.origin, ent:o.ent, life:o.life,
    age:16, year:o.heir?o.heir.year:2026, lvl:RI(42,50), pot, form:75, moral:60, rep:2, money:0,
    club:null, contract:0, salary:0, seasons:[], trophies:[], moments:[], flags:{}, seeds:[],
    caps:0, intlGoals:0, used:{}, tmp:{play:0}, phase:"goal", evIdx:0, evCount:3, retired:null, talents:[], tp:1,
    look:o.look||randomLook(), agent:o.ent==="parent"?"famille":"aucun", vie:newVie(), pens:newPens(), phone:newPhone(), defi:DEFIS[o.defi]?o.defi:null, start:DEPARTS[o.start]&&!o.heir?o.start:null, world:{}, clubRep:{}};
  applyWorld();
  for(const fx of [ORIGINS[o.origin].fx,ENTOURAGES[o.ent].fx,LIFESTYLES[o.life].fx])
    for(const k in fx) p[k]+=fx[k];
  if(o.life==="star") p.flags.influ = true;
  if(p.agent==="famille") p.flags.famille = true;
  if(!o.daily&&!o.friend) try{ localStorage.setItem("trajectoire_look",JSON.stringify(p.look)); }catch(e){}
  if(o.heir){ p.heir = o.heir; p.dynasty = o.heir.dynasty; p.pot = clamp(p.pot+o.heir.bonus,40,99); p.rep += 10; p.moral -= 3; }
  const home = CLUBS.filter(c=>c.country===o.country).sort((a,b)=>a.str-b.str);
  const c = pick(home.slice(0,4));
  p.club = {...c}; p.contract = 3; p.salary = 15;
  p.moments.push(`${p.year} · Premier contrat pro à ${c.name}`);
  p.clubsHist = [c.name];
  p.rival = makeRival();
  p.rel = newRel();
  pickLegends();
  if(p.hard) p.rival.pot = Math.min(99,p.rival.pot+4);
  if(p.start&&p.defi!=="zero") DEPARTS[p.start].setup();
  if(p.defi){ DEFIS[p.defi].setup(); p.moments.push(`${p.year} · Défi de départ : ${DEFIS[p.defi].n}`); }
  ui = {};
  save();
}

/* ============ Rendu ============ */
// risque d'un choix : une jauge de trois crans, de vert à rouge, et le mot pour les lecteurs d'écran
function riskHtml(q){ const r = q>=.6?1:q>=.4?2:3; return `<span class="risk r${r}"><i aria-hidden="true"><b></b><b></b><b></b></i>${["Plutôt sûr","Risqué","Très risqué"][r-1]}</span>`; }
function bar(label,v,col){return `<div class="bar">${label} <b style="color:var(--text)">${Math.round(v)}</b><div class="t"><div class="f" style="width:${clamp(v,0,100)}%;background:${col}"></div></div></div>`}
function hud(){
  if(!p) return "";
  return `<div class="hud"><div class="hud-row">
    <button class="hud-id" onclick="showCard()" aria-label="Voir ma carte de joueur">${avatarSvg(p.look,42,clubColors(p.club).a)}<span class="hud-who"><b>${esc(p.name)} ${flag(p.country)}</b><small>Saison ${p.seasons.length+1} · ${p.age} ans · ${crest(p.club,14)} ${esc(p.club.name)}</small></span></button>
    <div class="hud-kpi"><span class="kpi money" title="Fortune">${ic("coins")}${money(p.money)}</span><span class="kpi lvl" title="Niveau">${ic("star")}${p.lvl}</span></div></div>
  <div class="bars">${bar("Niveau",p.lvl,"var(--accent)")}${bar("Forme",p.form,"var(--good)")}${bar("Moral",p.moral,"var(--blue)")}${bar("Réputation",p.rep,"#c08bff")}${bar("Coach",p.rel?.trust??50,"#ff9f5a")}</div>${seasonSteps()}</div>`;
}
// frise des étapes de la saison, sous les jauges
function seasonSteps(){
  if(!p||p.retired) return "";
  const steps = ["Objectif","Moment 1","Moment 2","Moment 3","Match clé","Bilan","Été"];
  const cur = p.phase==="goal"?0:p.phase==="hiver"?3:p.phase==="event"||p.phase==="ordinaire"?1+Math.min(p.evIdx,2):p.phase==="match"?4:p.phase==="season"?5:6;
  return `<div class="steps" aria-label="Étape de la saison : ${steps[cur]}">${steps.map((x,i)=>`<span class="${i<cur?"done":i===cur?"cur":""}" title="${x}"></span>`).join("")}<em>${steps[cur]}</em></div>`;
}
// le bandeau et la barre du bas restent en place : seul ce qui change est redessiné, et l'animation d'entrée
// ne joue qu'en changeant d'étape (événement, match, bilan…), pour ne pas donner l'impression d'un rechargement
let shownHud = null, shownNav = null, lastPhase = null;
// les écussons et l'avatar portent un identifiant SVG unique à chaque dessin : on l'ignore pour savoir si le bandeau a changé
const sameUi = (a,b)=>a!=null&&b!=null&&a.replace(/(cr|av)\d+/g,"$1")===b.replace(/(cr|av)\d+/g,"$1");
function render(html){
  const app = $("#app"), content = takeToast()+`<div class="fade" tabindex="-1">${html}</div>`;
  const hudEl = document.getElementById("hudBox"), scr = document.getElementById("screen"), navEl = document.getElementById("navBox");
  const phase = p?p.phase:null, still = !!phase&&phase===lastPhase;
  lastPhase = phase;
  if(!hudEl||!scr||!navEl||hudEl.parentElement!==app){
    app.innerHTML = `<div id="hudBox">${shownHud = hud()}</div><div id="screen">${content}</div><div id="navBox">${shownNav = navBar()}</div>`;
  } else {
    const h = hud(), n = navBar();
    if(!sameUi(h,shownHud)){ hudEl.innerHTML = h; shownHud = h; }
    if(!sameUi(n,shownNav)){ navEl.innerHTML = n; shownNav = n; }
    scr.innerHTML = content;
  }
  if(still) app.querySelector(".fade")?.classList.add("still");
  placeView(); focusScreen();
}
// place l'écran pour que la décision (les premiers choix) soit visible sans faire défiler,
// en gardant si possible le résultat du choix précédent et le texte de la situation
function placeView(){
  window.scrollTo(0,0);
  const d = document.querySelector("#app .decide");
  if(!d||typeof d.getBoundingClientRect!=="function") return;
  const hudH = document.querySelector("#app .hud")?.getBoundingClientRect().height||0, navH = document.querySelector("#app .navbar")?.getBoundingClientRect().height||0;
  const btns = [...d.querySelectorAll(".btn")], last = btns[Math.min(1,btns.length-1)]||d;
  const vh = window.innerHeight||0;
  let need = last.getBoundingClientRect().bottom-(vh-navH)+12;
  if(!vh||!(need>0)) return;
  // le résultat du choix précédent sortirait de l'écran : il descend juste au-dessus de la décision
  const toast = document.querySelector("#app .toast");
  if(toast&&need>toast.getBoundingClientRect().top-hudH-8&&!d.querySelector(".bubble")){
    d.parentElement.insertBefore(toast,d);
    need = last.getBoundingClientRect().bottom-(vh-navH)+12;
    window.scrollTo(0,Math.max(0,Math.min(need,toast.getBoundingClientRect().top-hudH-8)));
    return;
  }
  const ctx = document.querySelector("#app .bubble")||d.querySelector(".story")||d;
  window.scrollTo(0,Math.max(0,Math.min(need,ctx.getBoundingClientRect().top-hudH-8)));
}
// après un changement d'écran, le focus va au nouveau contenu : un lecteur d'écran l'annonce, Tab part de là
function focusScreen(){ const f = /** @type {HTMLElement} */ (document.querySelector("#app .fade")); if(f&&!document.querySelector(".overlay,.penmode,.confmode")) f.focus({preventScroll:true}); }
// fenêtre par-dessus le jeu : focus sur le premier bouton, Échap ferme, le focus revient où il était
function openOverlay(html,label){
  const prev = /** @type {HTMLElement} */ (document.activeElement);
  const div = document.createElement("div");
  div.className = "overlay"; div.setAttribute("role","dialog"); div.setAttribute("aria-modal","true"); div.setAttribute("aria-label",label||"Fenêtre");
  div.onclick = e=>{ if(e.target===div) closeOverlay(div); };
  div.innerHTML = html;
  /** @type {any} */ (div).prevFocus = prev;
  document.body.appendChild(div);
  /** @type {HTMLElement} */ (div.querySelector("button,[href],input,textarea"))?.focus({preventScroll:true});
  return div;
}
function closeOverlay(div){
  if(!div) return;
  const prev = div.prevFocus; div.remove();
  if(prev&&prev.isConnected) prev.focus({preventScroll:true}); else focusScreen();
}
function confetti(){
  if(typeof lottieBurst==="function") lottieBurst("confettis");
  for(let i=0;i<14;i++){
    const s = document.createElement("span");
    s.className = "confetti"; s.textContent = pick(["🏆","⭐","🎉","✨","🥇"]);
    s.style.left = R(0,100)+"vw"; s.style.animationDuration = R(2.2,4.2)+"s"; s.style.animationDelay = R(0,.8)+"s";
    document.body.appendChild(s); setTimeout(()=>s.remove(),5200);
  }
}

/* --- Carte joueur --- */
function careerTotals(){ return p.seasons.reduce((a,s)=>({apps:a.apps+s.apps,g:a.g+s.goals,a:a.a+s.assists,cs:a.cs+s.clean}),{apps:0,g:0,a:0,cs:0}); }
function showCard(){
  const t = careerTotals(), tier = p.lvl>=80?"gold":p.lvl>=68?"silver":"bronze";
  const stars = clamp(Math.round((p.pot-58)/8),1,5);
  const pending = (p.seeds||[]).length;
  const r = p.rival, pn = p.pens||newPens();
  openOverlay(`<div class="pcard ${tier}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><div class="ovr">${p.lvl}</div><b>${p.pos}</b></div>
      <div style="text-align:right">${shirt(p.club,shirtNumber(),64)}<div style="font-size:1.4rem">${flag(p.country)}</div></div>
    </div>
    <h2 style="margin:10px 0 0;display:flex;align-items:center;gap:8px">${avatarSvg(p.look,44,clubColors(p.club).a)}${esc(p.name)}</h2>
    <div>${flag(p.club.country)} ${esc(p.club.name)} · ${p.age} ans</div>
    <div class="attrs">
      <span>Forme <b>${Math.round(p.form)}</b></span><span>Moral <b>${Math.round(p.moral)}</b></span>
      <span>Réputation <b>${Math.round(p.rep)}</b></span><span>Potentiel <b>${"★".repeat(stars)}${"☆".repeat(5-stars)}</b></span>
      <span>Matchs <b>${t.apps}</b></span><span>${p.pos==="GB"?"Clean sheets":"Buts"} <b>${p.pos==="GB"?t.cs:t.g}</b></span>
      <span>Sélections <b>${p.caps}</b></span><span>Trophées <b>${p.trophies.length}</b></span>
    </div>
    <div>${defiTag()}${[TRAITS[p.trait].n,ORIGINS[p.origin].n,ENTOURAGES[p.ent]?.n,LIFESTYLES[p.life]?.n].filter(Boolean).map(x=>`<span class="tag">${x}</span>`).join("")}<span class="tag">${agentOf().i} ${agentOf().n}</span><span class="tag">${familyLine()}</span>${(p.talents||[]).map(k=>`<span class="tag">${TALENTS[k].i} ${TALENTS[k].n}</span>`).join("")}</div>
    ${progressChart()}
    ${pn.tir+pn.face+pn.cf?`<p style="margin:12px 0 4px"><b>Coups de pied arrêtés joués :</b> ${[pn.tir?`penalties ${pn.but}/${pn.tir}`:"",pn.face?`arrêts ${pn.arret}/${pn.face}`:"",pn.cf?`coups francs ${pn.cfBut}/${pn.cf}`:""].filter(Boolean).join(" · ")}</p>`:""}
    ${r?`<p style="margin:12px 0 4px"><b>Rival :</b> ${esc(r.name)} ${flag(r.country)} ${r.retired?"(retraité)":`· ${esc(r.club.name)} · niveau ${r.lvl}`}</p>`:""}
    ${pending?`<p style="margin:4px 0">⏳ ${pending} choix passé${pending>1?"s pourraient":" pourrait"} encore avoir des suites…</p>`:""}
    <button class="btn" onclick="this.closest('.overlay').remove();statsScreen()">📊 Toutes mes stats</button><button class="btn" onclick="exportCard(this)">🖼️ Télécharger ma carte</button><button class="btn" onclick="closeOverlay(this.closest('.overlay'))">Fermer</button></div>`,"Carte joueur");
}

/* --- Accueil --- */
// les réglages, regroupés pour alléger l'écran d'accueil
function settingsScreen(){
  $("#app").innerHTML = `<div class="fade" style="padding-top:20px">
    <div class="muted">⚙️ Réglages</div><h1>Réglages</h1>
    <div class="card">
      <button class="btn" onclick="cycleFont(this)">${fontLabel()}</button>
      <button class="btn" onclick="cycleMinis(this)">${MINIS_LABELS[minisMode]}</button>
      <button class="btn" onclick="namesScreen()">✏️ Renommer les clubs et les championnats</button>
      <button class="btn" onclick="savesScreen()">💾 Sauvegardes · exporter ou importer</button>
    </div>
    <details class="card credits"><summary>Crédits</summary>
      <p class="muted">Photos : Pexels (licence Pexels, utilisation libre). Illustrations (accueil, scènes terrain, vestiaire, sélection et rivalité, tribunes, pelouse et ballon des mini-jeux, tirs au but, galaxie, Terre, vagues, étoiles, couverture du mode Histoire) : générées par IA pour Trajectoire. Animations : LottieFiles (Lottie Simple License) · trophée de Mahendra, confettis de Rohith R Krishnan, étoile d'omid. Bibliothèque d'animation : lottie-web (Airbnb, licence MIT).</p></details>
    <button class="btn ghost" onclick="home()">← Retour à l'accueil</button></div>`;
  window.scrollTo(0,0);
}
// la pelouse de l’accueil, vue depuis la tribune : des bandes qui fuient vers le rond central
function heroPitch(){
  const strips = Array.from({length:10},(_,i)=>{ const x0 = 70+26*i, x1 = -60+52*i; return `<polygon points="${x0},0 ${x0+26},0 ${x1+52},170 ${x1},170" fill="${i%2?"#2a774a":"#318a56"}"/>`; }).join("");
  return `<svg class="pitchsvg" viewBox="0 0 400 170" preserveAspectRatio="none" aria-hidden="true">${strips}
    <g fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"><polygon points="70,0 330,0 460,170 -60,170"/><line x1="40" y1="60" x2="360" y2="60"/><ellipse cx="200" cy="60" rx="58" ry="17"/><polygon points="150,0 250,0 262,22 138,22"/></g></svg>`;
}
function home(){
  p = null; unseed();
  const slots = ["1","2","3"].map(k=>({k,s:loadSlot(k)}));
  const card = ({k,s:sv})=>{
    if(!sv) return `<button class="slot empty" onclick="newCareer('${k}')">${ic("plus")}<span class="muted">Emplacement ${k}</span><b>Nouvelle carrière</b></button>`;
    const done = sv.retired&&sv.after;
    return `<div class="slot"><button class="slotmain" onclick="${done?`viewEnd('${k}')`:`resume('${k}')`}">${crest(sv.club,30)}<span><b>${esc(sv.name)}</b> ${flag(sv.country)}${sv.hard?" 👑":""}<small>${done?`Carrière terminée · ${sv.seasons.length} saisons · voir le bilan`:`${sv.age} ans · ${esc(sv.club.name)} · niveau ${sv.lvl}`}</small></span></button><button class="slotdel" onclick="askDelete('${k}',this)" aria-label="Supprimer la carrière de l'emplacement ${k}">✕</button></div>`;
  };
  const cur = slot!=="daily"&&slot!=="semaine"&&loadSlot(slot), live = cur&&!(cur.retired&&cur.after);
  const ach = Object.keys(loadHof().ach).length, free = slots.find(x=>!x.s);
  const row = (icn,label,sub,fn)=>`<button class="mrow" onclick="${fn}">${ic(icn)}<span><b>${label}</b><small>${sub}</small></span>${ic("chev","chev")}</button>`;
  $("#app").innerHTML = `<div class="fade home">
    <section class="hero" aria-label="Trajectoire">
      <div class="hero-top"><span class="crown" aria-hidden="true">${ic("crown")}</span><h1 class="logo">Trajectoire</h1><span class="swoosh" aria-hidden="true"></span><p class="tagline">Écris ta légende sur les terrains…</p></div>
      <div class="hero-cta">${live?`<button class="btn primary big" onclick="resume('${slot}')">${ic("play")}<span>Continuer<small>${esc(cur.name)} · ${cur.age} ans · ${esc(cur.club.name)}</small></span></button>`:`<button class="btn primary big" onclick="newCareer('${free?free.k:"1"}')">${ic("play")}<span>Nouvelle carrière</span></button>`}</div>
    </section>
    <section class="home-sec"><h3>Mes carrières</h3><div class="slots">${slots.map(card).join("")}</div></section>
    <section class="home-sec"><h3>Jouer</h3><div class="menu-list">
      ${row("calendar","Défi du jour","Le même départ pour tout le monde, et un classement","dailyScreen()")}
      ${row("target","Défi de la semaine",`${weeklyOf(weekKey()).n} : ${weeklyOf(weekKey()).d}`,"weeklyScreen()")}
      ${row("edit","Mode Histoire",storyBest()?`Une carrière en 5 chapitres · meilleur : chapitre ${Math.min(storyBest()+1,STORY.length)}`:"Une carrière racontée en 5 chapitres","storyHome()")}
      ${row("users","Défi entre amis","Un code à partager, les scores à comparer","friendsScreen()")}
      ${row("trophy","Panthéon",`${ach}/${ACH.length} succès · records`,"hofScreen()")}
      ${row("edit","Carnet des histoires",`${carnetCount().seen}/${carnetCount().all} histoires vécues`,"carnetScreen()")}
      ${row("dumbbell","Entraînement","Penalties, coups francs, dribbles, tacles","trainingScreen()")}
      ${installApp?row("plus","Installer l'appli","Sur ton écran d'accueil, jouable hors connexion","installApp()"):""}
      ${row("gear","Options","Texte, mini-jeux, noms des clubs, sauvegardes","settingsScreen()")}
    </div></section>
    <details class="card howto"><summary>Comment ça marche</summary>
      <ol>
        <li>Crée ton joueur : pays, poste, profil, origine, entourage, mode de vie, et un défi de départ si tu veux corser l'aventure.</li>
        <li>Chaque saison, fixe-toi un objectif, puis réponds aux événements. Certains choix ont des suites des années plus tard.</li>
        <li>Joue le match clé et les matchs de saison action par action : penalties et coups francs se tirent, ou s'arrêtent, toi-même.</li>
        <li>L'été, choisis tes vacances, négocie tes contrats et débloque des talents. Ton téléphone peut sonner à tout moment.</li>
        <li>À la retraite, écris ta vie d'après et découvre qui a gagné la rivalité.</li>
      </ol>
      <p class="muted" style="font-size:.82rem;margin:10px 0 0">Au clavier : touches 1 à 4 pour choisir, Entrée pour continuer. <button class="linkbtn" onclick="resetTips()">Revoir les conseils de première partie</button></p>
    </details>
  </div>`;
}
function resume(k){
  if(k) slot = k;
  p = load();
  migrate();
  if(runSeed()) seedRng(runSeed()+":"+p.seasons.length+":reprise"); else unseed();
  route();
}
// met à niveau une sauvegarde créée par une version précédente du jeu
function migrate(){
  p.seeds = p.seeds||[]; p.ent = p.ent||"ami"; p.life = p.life||"pro"; p.rel = p.rel||newRel(); p.used = p.used||{};
  if(!p.agent) p.agent = p.flags.agent?"requin":p.flags.famille?"famille":"aucun";
  if(!p.vie){ p.vie = newVie(); if(p.flags.couple) p.vie.couple = "relation"; if(p.flags.parent) p.vie.kids = 1; }
  p.vie.invest = p.vie.invest||{livret:0,immo:0,startup:0};
  p.pens = p.pens||newPens(); p.phone = p.phone||newPhone(); p.look = p.look||lookFromName(p.name);
  p.clubRep = p.clubRep||{}; applyWorld();
  renameSaved();
}

/* --- Création --- */
let draft = {};
const STEPS = [null,{k:"pos",src:POS,h:"Ton poste"},{k:"trait",src:TRAITS,h:"Ton profil"},{k:"origin",src:ORIGINS,h:"D'où viens-tu ?"},{k:"ent",src:ENTOURAGES,h:"Qui t'entoure ?"},{k:"life",src:LIFESTYLES,h:"Ton mode de vie"}];
function createStep(s){
  if(s===0&&!draft.keep) draft = {name:"",country:null,look:randomLook()};
  draft.look = draft.look||randomLook();
  draft.keep = false;
  const dice = (k)=>`<button class="btn dice" onclick="rollDraft('${k}')">🎲</button>`;
  let h = `<div class="create-head"><span class="muted">Création · étape ${s+1}/${STEPS.length}</span><div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${s+1}"><i style="width:${(s+1)/STEPS.length*100}%"></i></div></div>${draft.heir?`<p class="seed">👶 Génération ${draft.heir.gen} · ${esc(draft.name)}, enfant de ${esc(draft.heir.parent)}. Potentiel +${draft.heir.bonus}, réputation de départ… et une pression énorme.</p>`:""}`;
  if(s===0){
    const codes = Object.keys(COUNTRIES);
    h += `<h2>Qui es-tu ?</h2><div class="row"><input id="nm" placeholder="Nom du joueur" value="${esc(draft.name)}" maxlength="24">${dice("name")}</div>
      <h3 style="margin-top:18px">Ton visage</h3>${lookEditor(draft.look,"draftLook")}
      <h3 style="margin-top:18px">Nationalité</h3><div class="grid">${codes.map(c=>`<button class="btn ${draft.country===c?"sel":""}" onclick="setD('country','${c}',0)">${flag(c)} ${COUNTRIES[c].name}</button>`).join("")}</div>
      <button class="btn ghost" onclick="rollDraft('country')">🎲 Pays au hasard</button>
      <label class="toggle"><input type="checkbox" id="hard" ${draft.hard?"checked":""} onchange="draft.hard=this.checked"> <span><b>Mode Légende</b><br><small class="muted">Potentiel plus bas, paris plus risqués, rival plus fort. Pour les vrais.</small></span></label>
      ${draft.heir?"":`<h3 style="margin-top:18px">Point de départ</h3>
      <div class="defis" role="group" aria-label="Point de départ">${Object.entries(DEPARTS).map(([k,d])=>lockBtn(k,d,(draft.start||"classique")===k,"pickStart")).join("")}</div>`}
      <h3 style="margin-top:18px">Défi de départ <span style="text-transform:none;letter-spacing:0;font-weight:400">(facultatif)</span></h3>
      <div class="defis" role="group" aria-label="Défi de départ">${/** @type {[string,any][]} */ ([["",{i:"🎈",n:"Aucun",d:"La carrière classique."}],...Object.entries(DEFIS)]).map(([k,d])=>lockBtn(k,d,(draft.defi||"")===k,"pickDefi")).join("")}</div>
      <button class="btn primary" onclick="nextFrom0()">Continuer</button>`;
  } else {
    const st = STEPS[s];
    h += `<h2>${st.h}</h2>${Object.entries(st.src).map(([k,v],n)=>`<button class="btn ${draft[st.k]===k?"sel":""}" onclick="setD('${st.k}','${k}',${s+1})"><kbd>${n+1}</kbd>${v.n}${v.d?`<small>${v.d}</small>`:""}</button>`).join("")}
      <button class="btn ghost" onclick="rollDraft('${st.k}')">🎲 Au hasard</button>`;
  }
  if(s>0) h += `<button class="btn ghost" onclick="draft.keep=true;createStep(${s-1})">← Retour</button>`;
  $("#app").innerHTML = `<div class="fade">${h}</div>`;
}
function rollDraft(k){
  if(k==="name"){ $("#nm").value = pick(FIRST)+" "+pick(LAST); return; }
  if(k==="country"){ draft.name=$("#nm").value; draft.country=pick(Object.keys(COUNTRIES)); draft.keep=true; createStep(0); return; }
  const s = STEPS.findIndex(x=>x&&x.k===k);
  setD(k,pick(Object.keys(STEPS[s].src)),s+1);
}
function setD(k,v,next){
  if(k==="country"){ draft.name=$("#nm").value; draft.keep=true; }
  draft[k]=v;
  if(draft.heir&&next===3) next = 5;
  if(next>=STEPS.length){ newPlayer(draft); route(); }
  else createStep(next);
}
// bouton de départ ou de défi : grisé tant qu'il n'est pas débloqué, avec ce qu'il faut faire
function lockBtn(k,d,sel,fn){
  if(!isUnlocked(d)) return `<button class="btn locked" disabled aria-disabled="true">🔒 ${d.n}<small>À débloquer : ${d.lock.d}</small></button>`;
  return `<button class="btn ${sel?"sel":""}" aria-pressed="${sel}" onclick="${fn}('${k}')">${d.i} ${d.n}<small>${d.d}</small></button>`;
}
function pickStart(k){ draft.name = $("#nm").value; draft.start = k; draft.keep = true; createStep(0); }
function pickDefi(k){ draft.name = $("#nm").value; draft.defi = k||null; draft.keep = true; createStep(0); }
function nextFrom0(){
  draft.name = $("#nm").value.trim() || pick(FIRST)+" "+pick(LAST);
  if(!draft.country) draft.country = pick(Object.keys(COUNTRIES));
  createStep(1);
}

/* --- Routage --- */
function route(){
  routeScreen();
  // un appel urgent s'ouvre par-dessus l'écran du moment
  if(p&&p.urgent&&!p.retired&&!ui.quick) urgentScreen();
}
function routeScreen(){
  save();
  if(p.phase!=="match") ambient(false);
  if(p.retired) return p.after?endScreen():p.coach?coachRoute():afterScreen();
  if(p.phase==="tirage") return tirageScreen();
  if(p.phase==="goal") return goalScreen();
  if(p.phase==="event") return eventScreen();
  if(p.phase==="match") return matchScreen();
  if(p.phase==="ordinaire") return ordinaryScreen();
  if(p.phase==="season") return seasonScreen();
  if(p.phase==="tournoi") return tourneyScreen();
  if(p.phase==="hiver") return winterScreen();
  if(p.phase==="offseason") return offseasonScreen();
}

/* --- Événements --- */
function drawEvent(){
  // une conséquence arrivée à échéance passe en priorité
  const i = (p.seeds||[]).findIndex(s=>s.age<=p.age&&EVENTS.find(e=>e.id===s.ev).cond());
  if(i>=0){ const ev = p.seeds.splice(i,1)[0].ev; return EVENTS.find(e=>e.id===ev); }
  const ok = e=>!e.seedOnly&&e.cond()&&!ui.seenThisSeason?.includes(e.id);
  let pool = EVENTS.filter(e=>ok(e)&&(p.used[e.id]||0)<3);
  if(!pool.length) pool = EVENTS.filter(ok);
  if(!pool.length) pool = EVENTS.filter(e=>!e.seedOnly&&e.cond());
  // les événements jamais vus (dans cette carrière comme dans les autres) sortent plus souvent ; les rares, peu ; le fêtard attire les soirées
  const w = pool.map(e=>(e.weight||(e.rare?RARE_W:1))*novelty(e)*(e.id==="soiree"&&p.life==="fete"?2.5:1)/(1+(p.used[e.id]||0)*2));
  let r = Math.random()*w.reduce((a,b)=>a+b,0);
  for(let j=0;j<pool.length;j++){ r-=w[j]; if(r<=0) return pool[j]; }
  return pool[0];
}
function eventScreen(){
  if(!p.curEv){ const e = drawEvent(); p.curEv = e.id; ui.seenThisSeason = (ui.seenThisSeason||[]).concat(e.id); save(); }
  const e = EVENTS.find(x=>x.id===p.curEv);
  const opts = e.ch.map((c,i)=>({c,i})).filter(o=>!o.c.cond||o.c.cond());
  render(`${tip("event")}<div class="card event-card">${sceneHtml(e)}<div class="bubble"><p class="story">${evText(e)}</p></div>${e.rare?'<span class="chip rare">⭐ Histoire rare</span>':""}${isNewStory(e)?'<span class="chip new">✨ Nouvelle histoire</span>':""}<div class="decide"><h3 class="ask">Que fais-tu ?</h3>
    ${opts.map((o,n)=>`<button class="btn" onclick="choose(${o.i})">${choiceLead(o.c.t,n)}<span class="ctext">${o.c.t}</span>${o.c.mini&&minisOn("pen")?'<span class="chip">🎮 À jouer</span>':o.c.risk?'<span class="chip">🎲 Risqué</span>':""}</button>`).join("")}</div></div>${e.seedOnly?"":quickBtn()}`);
}
// scène illustrée en tête de chaque événement : une catégorie, sa couleur et son pictogramme
const SCENES = {
  terrain:{n:"Sur le terrain",i:"⚽",c:"#2f9a5f"}, vestiaire:{n:"Vestiaire",i:"🚪",c:"#4f6bd8"}, medias:{n:"Médias",i:"📸",c:"#c0568f"},
  perso:{n:"Vie privée",i:"🏠",c:"#c98a35"}, argent:{n:"Affaires",i:"💼",c:"#8a9a3a"}, sante:{n:"Santé",i:"🩺",c:"#c64f4f"},
  selection:{n:"Sélection",i:"🌍",c:"#2a8fb0"}, rival:{n:"Rivalité",i:"⚔️",c:"#c2512f"}, echo:{n:"Écho du passé",i:"⏳",c:"#8a5bd0"}
};
function sceneOf(e){
  const id = e.id;
  if(e.scene) return e.scene;
  if(e.seedOnly) return "echo";
  if(/^rival/.test(id)) return "rival";
  if(/croises|cuisse|infiltration|complement|nutri|yoga|insomnie|canicule|blesse/.test(id)) return "sante";
  if(/binational|amicalBlesse/.test(id)) return "selection";
  if(/interview|reseaux|badBuzz|streamer|documentaire|jaquette|selfie|pubYaourt|sponsor|starCollab|discretRumeur|chant|prof|^var$|arbitre|sifflets/.test(id)) return "medias";
  if(/agent|augment|fisc|voiture|dette|familleContrat|amiArgent|mercatoHiver|pret|voisins/.test(id)) return "argent";
  if(/famille|amour|enfant|ecole|grandmere|console|soiree|fetard|amiJalousie|parent|solitude|permis|tatouage|fondation|jeuneFan|academieVisite|livre|heir|langue/.test(id)) return "perso";
  if(/coach|capitaine|capCrise|bagarre|mentor|mate|jealous|systeme|dj|poste|veteran|proRigide|drone|centenaire|stage/.test(id)) return "vestiaire";
  return "terrain";
}
function sceneHtml(e){
  const s = SCENES[sceneOf(e)];
  return `<div class="scene-pic">${sceneArt(sceneOf(e))}</div><div class="scene" style="--sc:${s.c}"><span class="scene-i" aria-hidden="true">${ic(SCENE_IC[sceneOf(e)]||"bolt")}</span><span class="scene-l">${ic(SCENE_IC[sceneOf(e)]||"bolt")} ${s.n}</span><span class="scene-m">Saison ${p.year}-${String(p.year+1).slice(2)} · moment ${p.evIdx+1}/${p.evCount}</span></div>`;
}
const LABELS = {lvl:"Niveau",pot:"Potentiel",form:"Forme",moral:"Moral",rep:"Réputation",money:"Argent",play:"Temps de jeu",nat:"Chances en sélection",trust:"Confiance du coach"};
function applyFx(fx){
  const out = [];
  for(const k in fx){
    let v = typeof fx[k]==="function"?fx[k]():fx[k];
    if(k==="txt") continue;
    if(k==="flag"){ p.flags[v]=true; continue; }
    if(k==="unflag"){ delete p.flags[v]; continue; }
    if(k==="moment"){ p.moments.push(`${p.year} · ${v}`); continue; }
    if(k==="retire"){ p.retired = v; continue; }
    if(k==="seed"){ p.seeds.push({ev:v.ev,age:p.age+RI(v.d[0],v.d[1])}); ui.seeded=true; continue; }
    if(k==="rival"){ if(p.rival) p.rival.lvl = clamp(p.rival.lvl+v,30,99); continue; }
    if(k==="protege"){ if(!p.protege) p.protege = {name:pick(FIRST)+" "+pick(LAST),age:18,lvl:RI(58,64),pot:RI(80,92),club:p.club.name}; continue; }
    if(k==="rivalJoin"){ if(p.rival) p.rival.club = {...p.club}; continue; }
    if(k==="agent"){ if(p.defi!=="solo") setAgent(v); continue; }
    if(k==="couple"){ p.vie.couple = v; if(v) p.flags.couple = true; else delete p.flags.couple; continue; }
    if(k==="kid"){ p.vie.kids += v; p.flags.parent = true; msg("famille",p.vie.kids>1?"Un petit frère ou une petite sœur ! Toute la famille est folle de joie 👶":"Bienvenue au bébé !!! On arrive dès demain 👶❤️"); continue; }
    if(k==="clubStr"){ p.club.str = clamp(p.club.str+v,40,95); out.push({k:"Force du club",v}); continue; }
    if(k==="salary"){ const old=p.salary; p.salary=Math.round(p.salary*v); out.push({k:"Salaire",v:p.salary-old,money:true}); continue; }
    if(k==="play"){ p.tmp.play += v; if(p.rel) p.rel.trust = clamp(p.rel.trust+v*.5,0,100); }
    else if(k==="trust"){ if(p.rel) p.rel.trust = clamp(p.rel.trust+v,0,100); }
    else if(k==="nat"){ p.tmp.nat = (p.tmp.nat||0)+v; }
    else if(k==="money"){ p.money = Math.max(0,p.money+v); }
    else if(k==="pot"){ p.pot = clamp(p.pot+v,40,99); }
    else if(k==="lvl"){ p.lvl = clamp(p.lvl+v,20,Math.max(p.pot,p.lvl)); }
    else p[k] = clamp(p[k]+v,0,100);
    if(v) out.push({k:LABELS[k],v,money:k==="money"});
  }
  return out;
}
function deltaHtml(deltas){ return deltas.map(d=>`<span class="${d.v>0?"up":"down"}">${d.k} ${d.v>0?"+":""}${d.money?money(d.v):d.v}</span>`).join("")||'<span class="muted">Aucun changement immédiat</span>'; }
function choose(i){
  const e = EVENTS.find(x=>x.id===p.curEv), c = e.ch[i];
  let txt, deltas;
  if(c.mini&&ui.forced==null&&!ui.quick&&typeof Penalty!=="undefined"&&minisOn("pen")){
    const opp = pick(CLUBS.filter(x=>x.country===p.club.country&&x.name!==p.club.name));
    playMini(c.mini,MINI_TITLES[c.mini],opp).then(ok=>{ ui.forced = ok; choose(i); });
    return;
  }
  ui.seeded = false;
  if(c.risk){
    const pr = (typeof c.risk.p==="function"?c.risk.p():c.risk.p)*(p.hard?.85:1)+(has(EVENT_TALENT[e.id])?.15:0);
    const res = (ui.forced!=null?ui.forced:chance(pr))?c.risk.good:c.risk.bad; ui.forced = null;
    txt = res.txt; deltas = applyFx(res);
  } else { txt = c.why; deltas = applyFx(c.fx); }
  const nMoments = p.moments.length;
  markSeen(e,evText(e));
  p.used[e.id] = (p.used[e.id]||0)+1;
  phoneAfterChoice(e,deltas);
  if(e.id==="sifflets"||deltas.some(d=>d.k==="Réputation"&&d.v<=-5)) setTimeout(()=>sfx("boo"),200);
  if(e.seedOnly) p.echoes = (p.echoes||0)+1;
  p.curEv = null; p.evIdx++;
  if(!p.retired&&p.evIdx===2){ const w = winterWindow(); if(w){ p.winter = w; p.phase = "hiver"; } }
  if(!p.retired && p.evIdx>=p.evCount){ p.phase="match"; setupMatch(); }
  else if(ordinaryWanted()) startOrdinary();
  if(!p.retired&&!p.urgent&&(chance(.1)||(urgentDue("saison")&&chance(.5)))) maybeUrgent("saison");
  save();
  ui.toast = `<div class="tchoice">Tu as choisi : ${c.t}</div><div>${txt}</div><div class="delta">${deltaHtml(deltas)}</div>${ui.seeded?`<div class="seed">⏳ Ce choix pourrait avoir des suites…</div>`:""}${p.moments.length>nMoments?une(p.moments.at(-1).split(" · ").slice(1).join(" · "),"",p.year):""}`;
  route();
}

/* ============ Son (synthétisé, sans fichier) ============ */
let AC = null;
let soundOn = (()=>{ try{ return localStorage.getItem("trajectoire_sound")!=="0"; }catch(e){ return true; } })();
function ac(){
  if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } }
  if(AC.state==="suspended") AC.resume();
  return AC;
}
function tone(freq,dur,type,vol,to){
  const a = ac(); if(!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
  o.type = type||"sine"; o.frequency.setValueAtTime(freq,t);
  if(to) o.frequency.exponentialRampToValueAtTime(to,t+dur);
  g.gain.setValueAtTime(vol||.1,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t+dur);
}
function crowd(dur,vol){
  const a = ac(); if(!a) return;
  const n = a.createBufferSource(), buf = a.createBuffer(1,a.sampleRate*dur,a.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1)*Math.min(1,i/(a.sampleRate*.15))*(1-i/d.length);
  const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; f.Q.value = .6;
  const g = a.createGain(); g.gain.value = vol;
  n.buffer = buf; n.connect(f).connect(g).connect(a.destination); n.start();
}
const SFX = {
  click:()=>tone(720,.04,"triangle",.035),
  whistle:()=>{ tone(2700,.18,"sine",.06); setTimeout(()=>tone(2700,.45,"sine",.06),240); },
  goal:()=>{ crowd(1.8,.5); [523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.22,"triangle",.07),i*120)); },
  concede:()=>tone(330,.6,"sawtooth",.04,140),
  trophy:()=>[523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>tone(f,.4,"triangle",.07),i*130))
};
// vibrations sur mobile pour les grands moments (si le son est activé et que l'appareil le permet)
const BUZZ = {goal:[60,40,140],trophy:[100,60,100,60,220],concede:[220]};
function sfx(n){ if(!soundOn) return; try{ SFX[n](); }catch(e){} try{ if(BUZZ[n]&&navigator.vibrate&&navigator.userActivation?.hasBeenActive) navigator.vibrate(BUZZ[n]); }catch(e){} }
function toggleSound(btn){
  soundOn = !soundOn;
  try{ localStorage.setItem("trajectoire_sound",soundOn?"1":"0"); }catch(e){}
  if(btn) btn.textContent = soundOn?"🔊":"🔇";
  if(soundOn) sfx("click"); else ambient(false);
}
// suit le score du match en cours pour jouer les bons sons
function matchSounds(m){
  if(ui.msKey!==m.title+m.mins.join()){ ui.msKey = m.title+m.mins.join(); ui.ms = {us:0,them:0}; sfx("whistle"); speak(`Coup d'envoi. ${m.title}.`); }
  if(m.us>ui.ms.us){ sfx("goal"); crowdSwell(); setTimeout(()=>sfx("chant"),900); speak(lastGoalLine(m)); }
  else if(m.them>ui.ms.them){ sfx("concede"); if(m.them-m.us>=2) setTimeout(()=>sfx("boo"),500); speak(lastGoalLine(m)); }
  ui.ms = {us:m.us,them:m.them};
}
document.addEventListener("click",e=>{ if(/** @type {Element} */(e.target).closest?.(".btn")) sfx("click"); });

/* ============ Couleurs, écussons et maillots des clubs ============ */
function hashStr(s){ let h = 2166136261; for(const ch of s){ h ^= ch.charCodeAt(0); h = Math.imul(h,16777619); } return h>>>0; }
function initials(n){ const w = n.split(/\s+/).filter(x=>x.length>1); return (w.length>1?w[0][0]+w[w.length-1][0]:(w[0]||n).slice(0,2)).toUpperCase(); }
function clubColors(c){
  // les couleurs suivent le nom d'origine : un club renommé garde son maillot
  const n = typeof c==="string"?(NAME_ORIG[c]||c):(c.orig||NAME_ORIG[c.name]||c.name), h = hashStr(n), hue = h%360;
  const a = `hsl(${hue} 68% ${[36,44,50][h%3]}%)`, alt = (h>>>8)%5;
  const b = alt===0?"#ffffff":alt===1?"#14171c":`hsl(${(hue+150+((h>>>4)%60))%360} 75% ${alt===4?86:56}%)`;
  return {a,b,pattern:(h>>>12)%5,ini:initials(typeof c==="string"?c:c.name)};
}
function patternShapes(k,w,h){
  if(k.pattern===1) return [0,1,2,3,4].map(i=>`<rect x="${i*w/5+w/20}" width="${w/10}" height="${h}" fill="${k.b}"/>`).join("");
  if(k.pattern===2) return [0,1,2,3].map(i=>`<rect y="${i*h/4+h/16}" width="${w}" height="${h/8}" fill="${k.b}"/>`).join("");
  if(k.pattern===3) return `<polygon points="0,${h*.2} ${w*.25},0 ${w},${h*.8} ${w*.75},${h}" fill="${k.b}"/>`;
  if(k.pattern===4) return `<rect x="${w/2}" width="${w/2}" height="${h}" fill="${k.b}"/>`;
  return "";
}
let svgId = 0;
function crest(c,size){
  size = size||22;
  const k = clubColors(c), id = "cr"+(svgId++), shield = "M4 4h32v18c0 11-8 18-16 21C12 40 4 33 4 22z";
  return `<svg class="crest" width="${size}" height="${Math.round(size*1.15)}" viewBox="0 0 40 46" aria-hidden="true"><defs><clipPath id="${id}"><path d="${shield}"/></clipPath></defs><g clip-path="url(#${id})"><rect width="40" height="46" fill="${k.a}"/>${patternShapes(k,40,46)}</g><path d="${shield}" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/><text x="20" y="27" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="14" fill="#fff" stroke="rgba(0,0,0,.5)" stroke-width="1" paint-order="stroke">${k.ini}</text></svg>`;
}
function shirt(c,num,size){
  size = size||64;
  const k = clubColors(c), id = "sh"+(svgId++), path = "M20 6 8 13l5 11 6-3v33h22V21l6 3 5-11-12-7c-2 4-6 6-10 6s-8-2-10-6z";
  return `<svg width="${size}" height="${size}" viewBox="0 0 60 60" aria-hidden="true"><defs><clipPath id="${id}"><path d="${path}"/></clipPath></defs><g clip-path="url(#${id})"><rect width="60" height="60" fill="${k.a}"/>${patternShapes(k,60,60)}</g><path d="${path}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/><text x="30" y="42" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="17" fill="#fff" stroke="rgba(0,0,0,.55)" stroke-width="1.2" paint-order="stroke">${num}</text></svg>`;
}
const shirtNumber = ()=>p.flags?.numParent&&p.dynasty?.length?DEFAULT_NUM[p.dynasty.at(-1).pos]:p.flags?.numOwn?7+hashStr(p.name)%20:DEFAULT_NUM[p.pos];

/* ============ Bandeau de résultat (moins de clics) ============ */
function takeToast(){ const t = ui.toast; ui.toast = null; return t?`<div class="toast" role="status">${t}</div>`:""; }

/* ============ Courbe de progression (carte joueur) ============ */
function progressChart(){
  const S = p.seasons; if(S.length<2) return "";
  const W = 300, H = 90, n = S.length, x = i=>8+i*(W-16)/(n-1), y = v=>H-12-(clamp(v,30,100)-30)/70*(H-24);
  const gk = p.pos==="GB", vals = S.map(s=>gk?s.clean:s.goals), mx = Math.max(1,...vals);
  const bars = vals.map((v,i)=>`<rect x="${x(i)-3}" y="${H-12-v/mx*30}" width="6" height="${v/mx*30}" fill="rgba(0,0,0,.22)"/>`).join("");
  const line = S.map((s,i)=>`${x(i)},${y(s.lvl)}`).join(" ");
  const best = S.reduce((b,s,i)=>s.lvl>S[b].lvl?i:b,0);
  return `<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:.75rem;font-weight:600"><span>Niveau par saison</span><span>barres : ${gk?"clean sheets":"buts"}</span></div>
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Niveau saison par saison, de ${S[0].lvl} à ${S[n-1].lvl}">
      <line x1="8" x2="${W-8}" y1="${y(80)}" y2="${y(80)}" stroke="rgba(0,0,0,.18)" stroke-dasharray="3 3"/><text x="${W-8}" y="${y(80)-3}" text-anchor="end" font-size="9" fill="rgba(0,0,0,.55)">80</text>
      ${bars}<polyline points="${line}" fill="none" stroke="rgba(0,0,0,.8)" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="${x(best)}" cy="${y(S[best].lvl)}" r="3.5" fill="#1b1b1b"/><text x="${clamp(x(best),20,W-20)}" y="${y(S[best].lvl)-7}" text-anchor="middle" font-size="10" font-weight="700" fill="#1b1b1b">${S[best].lvl}</text>
      <text x="8" y="${H-1}" font-size="9" fill="rgba(0,0,0,.6)">${S[0].age} ans</text><text x="${W-8}" y="${H-1}" text-anchor="end" font-size="9" fill="rgba(0,0,0,.6)">${S[n-1].age} ans</text>
    </svg></div>`;
}

/* ============ Conseils de première partie ============ */
const TIPS = {
  goal:"🎯 Avant chaque saison, choisis un objectif personnel. Réussi, il rapporte de la réputation, du moral et un point de talent.",
  event:"Les jauges en haut de l'écran bougent avec chacun de tes choix : niveau, forme, moral, réputation et confiance du coach. Les choix risqués peuvent rapporter gros… ou coûter cher.",
  match:"⚽ Le match clé se joue en quatre actions. « Plutôt sûr », « Risqué » et « Très risqué » indiquent tes chances. À la mi-temps, tu donnes la consigne.",
  season:"📰 Le bilan montre tes stats, le classement, ton objectif et ton rival. « Ma carte », en haut, résume toute ta carrière.",
  minis:"🎮 Les actions marquées « À jouer » lancent un mini-jeu. Tu peux t'y entraîner au calme depuis l'accueil (Centre d'entraînement), ou les désactiver.",
  summer:"☀️ L'été, tu restes ou tu pars : négocie les offres, lance une bataille d'enchères quand deux clubs te veulent, et dépense tes points de talent plus bas."
};
let tipsSeen = (()=>{ try{ return JSON.parse(localStorage.getItem("trajectoire_tips"))||{}; }catch(e){ return {}; } })();
function tip(id){ return tipsSeen[id]?"":`<div class="tip" id="tip-${id}"><div>${TIPS[id]}</div><button class="linkbtn" onclick="hideTip('${id}')">Compris</button></div>`; }
function hideTip(id){ tipsSeen[id] = 1; try{ localStorage.setItem("trajectoire_tips",JSON.stringify(tipsSeen)); }catch(e){} document.getElementById("tip-"+id)?.remove(); }
function resetTips(){ tipsSeen = {}; try{ localStorage.removeItem("trajectoire_tips"); }catch(e){} home(); }

/* ============ Taille du texte ============ */
let fontScale = (()=>{ try{ return +localStorage.getItem("trajectoire_font")||1; }catch(e){ return 1; } })();
function applyFont(){ document.documentElement.style.fontSize = Math.round(fontScale*100)+"%"; }
const fontLabel = ()=>`Aa · Taille du texte : ${Math.round(fontScale*100)} %`;
function cycleFont(btn){
  fontScale = fontScale>=1.3?1:fontScale>=1.15?1.3:1.15;
  try{ localStorage.setItem("trajectoire_font",String(fontScale)); }catch(e){}
  applyFont(); if(btn) btn.textContent = fontLabel();
}
applyFont();
