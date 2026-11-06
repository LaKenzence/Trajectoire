// Trajectoire · Vie perso : agent, couple et enfants, été, logement, placements, et leurs événements
/* ============ Agents ============ */
// com : commission sur le salaire · offers / reach : nombre et niveau des offres · nego / auction : bonus en négociation
const AGENTS = {
  aucun:{n:"Sans agent",i:"🙋",d:"Pas de commission, mais tu négocies seul et les clubs t'appellent rarement.",com:0,offers:-1,reach:-2,nego:-.05,auction:-.05,moral:0},
  famille:{n:"Un proche",i:"👪",d:"Pas de commission et un moral solide. Son carnet d'adresses reste limité.",com:0,offers:0,reach:0,nego:.05,auction:0,moral:1},
  fidele:{n:"Agent de confiance",i:"🤝",d:"8 % de commission. Des négociations solides, une carrière sereine.",com:.08,offers:1,reach:2,nego:.1,auction:.05,moral:0},
  requin:{n:"Super-agent",i:"🦈",d:"15 % de commission. Les plus grands clubs l'écoutent… mais il aime les affaires louches.",com:.15,offers:1,reach:5,nego:.12,auction:.1,moral:0}
};
const agentOf = ()=>AGENTS[p&&p.agent]||AGENTS.aucun;
function setAgent(k){
  if(!AGENTS[k]||p.agent===k) return;
  // quitter un super-agent coûte une indemnité
  if(p.agent==="requin"&&k!=="requin") p.money = Math.max(0,p.money-Math.round(p.salary*.3));
  p.agent = k;
  p.flags.agent = k==="requin"; p.flags.famille = k==="famille";
  p.moments.push(`${p.year} · ${k==="aucun"?"Se sépare de son agent":`Nouvel agent : ${AGENTS[k].n.toLowerCase()}`}`);
}

/* ============ Famille et logement ============ */
const HOMES = {
  appart:{n:"Appartement en ville",i:"🏢",cost:150,moral:1},
  maison:{n:"Maison avec jardin",i:"🏡",cost:600,moral:2},
  villa:{n:"Villa avec vue",i:"🏰",cost:2500,moral:2,rep:2}
};
function newVie(){ return {couple:null,kids:0,home:null,invest:{livret:0,immo:0,startup:0}}; }
// moral apporté chaque saison par la vie de famille et le logement (plafonné : le terrain reste l'essentiel)
function familyMoral(){
  const v = p.vie||newVie();
  return Math.min(5,(v.couple==="relation"?1:v.couple==="marie"?2:0)+Math.min(2,v.kids)+(HOMES[v.home]?.moral||0)+agentOf().moral);
}
function familyLine(){
  const v = p.vie||newVie();
  const c = v.couple==="marie"?"Marié·e":v.couple==="relation"?"En couple":"Célibataire";
  return `${c}${v.kids?` · ${v.kids} enfant${v.kids>1?"s":""}`:""}`;
}

/* ============ Placements ============ */
// rendement annuel tiré entre lo et hi
const INVESTS = {
  livret:{n:"Livret d'épargne",i:"🏦",d:"Sans risque, rapporte peu.",lo:.01,hi:.025},
  immo:{n:"Immobilier",i:"🏘️",d:"Placement stable sur la durée.",lo:-.02,hi:.08},
  startup:{n:"Start-up d'un ami",i:"🚀",d:"Tout ou rien : peut doubler ou s'effondrer.",lo:-.6,hi:1.1}
};
function investIn(k,amount){
  amount = Math.round(clamp(amount,0,p.money));
  if(!INVESTS[k]||amount<=0) return;
  p.vie.invest[k] = (p.vie.invest[k]||0)+amount; p.money -= amount;
}
function withdraw(k){ const v = p.vie.invest[k]||0; p.money += v; p.vie.invest[k] = 0; }
// appelé une fois par saison : fait fructifier (ou fondre) les placements, renvoie le gain total
function investYear(){
  const inv = p.vie?.invest; if(!inv) return 0;
  let gain = 0;
  for(const k in INVESTS){
    if(!inv[k]) continue;
    const r = R(INVESTS[k].lo,INVESTS[k].hi), d = Math.round(inv[k]*r);
    inv[k] = Math.max(0,inv[k]+d); gain += d;
  }
  return gain;
}
const invested = ()=>Object.values(p.vie?.invest||{}).reduce((a,b)=>a+b,0);

/* ============ L'été : un choix par intersaison ============ */
const SUMMERS = {
  famille:{n:"Vacances en famille",i:"👨‍👩‍👧",d:"Moral et forme rechargés",ok:()=>p.vie.couple||p.vie.kids||p.ent!=="seul",fx:{moral:6,form:5}},
  stage:{n:"Préparation physique privée",i:"🏋️",d:"80 k€ · niveau et forme, mais pas de vacances",ok:()=>p.money>=80&&p.age<=31,fx:{money:-80,lvl:1,form:6,moral:-2}},
  promo:{n:"Tournée promo et sponsors",i:"📸",d:"Argent et réputation, au prix de la fatigue",ok:()=>p.rep>=25,fx:{money:()=>Math.round(30+p.rep*6),rep:2,form:-4}},
  voyage:{n:"Voyage au bout du monde",i:"🌏",d:"Tu reviens la tête vide… dans le bon sens",ok:()=>true,fx:{moral:8,form:-2}},
  racines:{n:"Retour aux sources",i:"⚽",d:"Stage gratuit pour les gamins de ton enfance",ok:()=>p.origin==="quartier"||p.origin==="village"||p.flags.fond,fx:{rep:2,moral:4}},
  repos:{n:"Repos complet",i:"🛌",d:"Le corps d'abord",ok:()=>true,fx:{form:9,moral:1}}
};
function summerChoose(k){
  const s = SUMMERS[k]; if(!s||p.summer||!s.ok()) return;
  p.summer = k;
  const deltas = applyFx(s.fx);
  ui.toast = `<div class="tchoice">Ton été : ${s.i} ${s.n}</div><div class="delta">${deltaHtml(deltas)}</div>`;
  save(); offseasonScreen();
}
function summerCard(){
  if(p.summer) return `<div class="card"><h3>☀️ Ton été</h3><p style="margin:0">${SUMMERS[p.summer].i} ${SUMMERS[p.summer].n}. Rendez-vous à la reprise.</p></div>`;
  const opts = Object.entries(SUMMERS).filter(([,s])=>s.ok());
  return `<div class="card"><h3>☀️ Ton été</h3><p class="muted" style="margin-top:0;font-size:.88rem">Un seul choix par été, avant de signer ou de rester.</p>
    ${opts.map(([k,s])=>`<button class="btn" onclick="summerChoose('${k}')">${s.i} ${s.n}<small>${s.d}</small></button>`).join("")}</div>`;
}

/* ============ Écran « Ma vie » ============ */
function vieScreen(){
  if(!p) return;
  const v = p.vie, a = agentOf(), summer = p.phase==="offseason"&&!p.retired, locked = p.defi==="solo";
  const section = (title,body)=>`<section class="vie-sec"><h3>${title}</h3>${body}</section>`;
  const agentBody = `<p style="margin:0 0 6px"><b>${a.i} ${a.n}</b><br><small class="muted">${a.d}</small></p>
    ${locked?`<p class="muted" style="margin:0">Défi « Sans filet » : pas d'agent pour toi.</p>`:summer?Object.entries(AGENTS).filter(([k])=>k!==p.agent).map(([k,x])=>`<button class="btn" onclick="vieAct('agent','${k}')">${x.i} Passer à : ${x.n}<small>${x.d}${p.agent==="requin"?` · indemnité de départ ${money(Math.round(p.salary*.3))}`:""}</small></button>`).join(""):`<p class="muted" style="margin:0;font-size:.85rem">Tu pourras changer d'agent à l'intersaison.</p>`}`;
  const familyBody = `<p style="margin:0">${familyLine()}${p.ent?` · ${ENTOURAGES[p.ent].n}`:""}</p>
    <p class="muted" style="margin:4px 0 0;font-size:.85rem">Ta vie de famille et ton logement t'apportent <b style="color:var(--text)">+${familyMoral()}</b> de moral par saison.</p>`;
  const home = HOMES[v.home];
  const homeBody = `<p style="margin:0 0 6px">${home?`${home.i} ${home.n}`:"Tu loues encore un petit appartement."}</p>
    ${Object.entries(HOMES).filter(([k,h])=>!home||h.cost>home.cost).map(([k,h])=>`<button class="btn" ${p.money<h.cost?"disabled":""} onclick="vieAct('home','${k}')">${h.i} Acheter : ${h.n}<small>${money(h.cost)} · moral +${h.moral} par saison${p.money<h.cost?" · pas assez d'argent":""}</small></button>`).join("")}`;
  const investBody = `<p class="muted" style="margin:0 0 6px;font-size:.85rem">Fortune disponible : <b style="color:var(--text)">${money(p.money)}</b> · placée : <b style="color:var(--text)">${money(invested())}</b>. Les placements évoluent à chaque fin de saison.</p>
    ${Object.entries(INVESTS).map(([k,x])=>`<div class="vie-inv"><span>${x.i} <b>${x.n}</b> · ${money(v.invest[k]||0)}<small>${x.d}</small></span>
      <span class="vie-btns">${summer?`<button class="hudbtn" ${p.money<10?"disabled":""} onclick="vieAct('invest','${k}')">+ 25 %</button>${v.invest[k]?`<button class="hudbtn" onclick="vieAct('withdraw','${k}')">Retirer</button>`:""}`:""}</span></div>`).join("")}
    ${summer?"":`<p class="muted" style="margin:6px 0 0;font-size:.85rem">Placements et achats se font à l'intersaison.</p>`}`;
  openOverlay(`<div class="sheet" role="document"><h2>🏠 Ma vie</h2>
    ${section("Apparence",lookEditor(p.look,"myLook"))}${section("Agent",agentBody)}${section("Famille",familyBody)}${section("Logement",summer?homeBody:`<p style="margin:0">${home?`${home.i} ${home.n}`:"Tu loues encore un petit appartement."}</p>`)}${section("Placements",investBody)}
    <button class="btn" onclick="closeOverlay(this.closest('.overlay'))">Fermer</button></div>`,"Ma vie");
}
function vieAct(kind,k){
  if(kind==="agent") setAgent(k);
  if(kind==="home"){ const h = HOMES[k]; if(p.money>=h.cost){ p.money -= h.cost; p.vie.home = k; if(h.rep) p.rep = clamp(p.rep+h.rep,0,100); p.moments.push(`${p.year} · S'offre une ${h.n.toLowerCase()}`); } }
  if(kind==="invest") investIn(k,Math.max(10,Math.round(p.money*.25)));
  if(kind==="withdraw") withdraw(k);
  save();
  document.querySelector(".overlay")?.remove();
  vieScreen();
  if(p.phase==="offseason"&&!p.retired) offseasonScreen();
}

/* ============ Événements de vie perso ============ */
EVENTS.push(
 // couple : de la rencontre au mariage
 {id:"demande",seedOnly:true,cond:()=>p.vie.couple==="relation",txt:()=>"Ça fait plusieurs années que vous êtes ensemble. Tes coéquipiers te charrient : « Alors, c'est pour quand ? »",
  ch:[{t:"Faire ta demande sur la pelouse, devant le stade",risk:{p:.75,good:{couple:"marie",moral:12,rep:3,moment:"Demande en mariage sur la pelouse",txt:"Un oui devant 40 000 personnes. La vidéo fait le tour du monde."},bad:{moral:-6,rep:-1,txt:"Gêne totale : trop de pression devant les caméras. On te demande du temps."}}},
      {t:"Un dîner en tête-à-tête, loin des caméras",fx:{couple:"marie",moral:10,moment:"Mariage loin des projecteurs"},why:"Une bague, un oui, et une fête entre proches."},
      {t:"Pas encore, la carrière d'abord",fx:{moral:-2,seed:{ev:"ultimatum",d:[1,3]}},why:"Un sourire, mais l'attente ne durera pas éternellement."}]},
 {id:"ultimatum",seedOnly:true,cond:()=>p.vie.couple==="relation",txt:()=>"La personne qui partage ta vie te pose la question franchement : « On construit quelque chose, ou pas ? »",
  ch:[{t:"Tout construire ensemble",fx:{couple:"marie",moral:8,moment:"Mariage"},why:"Tu ne regrettes rien."},
      {t:"Lui avouer que tu n'es pas prêt",fx:{couple:null,moral:-10,form:2},why:"Séparation. L'appartement est bien vide."}]},
 {id:"coupDeFoudre",cond:()=>p.age>=23&&!p.vie.couple&&!p.flags.coupDeFoudre,txt:()=>"Lors d'un gala de charité, tu passes la soirée à parler avec quelqu'un qui ne connaît rien au football. Et ça te fait un bien fou.",
  ch:[{t:"Demander son numéro",fx:{couple:"relation",moral:8,flag:"coupDeFoudre",seed:{ev:"demande",d:[2,4]}},why:"Premier rendez-vous loin des stades. Puis un deuxième."},
      {t:"Rester concentré sur ta carrière",fx:{lvl:1,moral:-2,flag:"coupDeFoudre"},why:"Tu y repenses souvent, les soirs de match."}]},
 {id:"expatFamille",cond:()=>p.vie.couple&&p.club.country!==p.country&&p.age>=21,txt:()=>`La personne qui partage ta vie a du mal à se faire à la vie en ${COUNTRIES[p.club.country].name}. Ni travail ni amis ici : le quotidien est dur.`,
  ch:[{t:"Tout faire pour l'aider à s'intégrer",fx:{money:-40,moral:4},why:"Cours de langue, nouvelle maison, nouveaux amis : le sourire revient."},
      {t:"Demander un transfert dans ton pays",fx:{flag:"forceDepart",moral:2,trust:-4},why:"Ton agent prospecte du côté de chez toi."},
      {t:"Lui proposer de rentrer, et vivre à distance",fx:{moral:-6,form:2},why:"Les appels du soir remplacent les dîners."}]},
 {id:"enfant2",cond:()=>p.vie.couple&&p.vie.kids>=1&&p.vie.kids<3&&p.age>=26,weight:.6,txt:()=>"Un nouveau bébé est en route ! La famille s'agrandit.",
  ch:[{t:"Prendre un congé parental complet",fx:{kid:1,moral:10,play:-4,form:2},why:"Des nuits courtes, un bonheur immense."},
      {t:"Ne rater aucun match",fx:{kid:1,moral:4,form:-4},why:"Tu jongles entre le stade et les biberons."}]},
 {id:"spectacle",cond:()=>p.vie.kids>=1,txt:()=>"Le spectacle de fin d'année de ton enfant tombe le soir d'un match de coupe.",
  ch:[{t:"Demander au coach à être ménagé",fx:{moral:8,trust:-5,play:-2},why:"Ton enfant te cherche dans la salle, te voit, et rayonne."},
      {t:"Jouer et lui dédier ton match",risk:{p:.5,good:{moral:6,rep:2,txt:"But et cœur avec les doigts vers la caméra. Ton enfant regarde le replay en boucle."},bad:{moral:-5,txt:"Défaite, et une petite voix au téléphone : « Tu étais pas là. »"}}},
      {t:"Le faire filmer par un proche",fx:{moral:-2},why:"Tu le regardes dans le bus. Ce n'est pas pareil."}]},
 {id:"enfantFoot",cond:()=>p.vie.kids>=1&&p.age>=30&&!p.flags.heirBoost,txt:()=>"Ton enfant joue au foot dans le jardin des heures durant. Ton enfant veut faire comme toi.",
  ch:[{t:"L'entraîner toi-même le week-end",fx:{moral:6,form:-2,flag:"heirBoost"},why:"Déjà ton pied gauche. Un jour, peut-être…"},
      {t:"L'inscrire au club du coin, sans pression",fx:{moral:4,flag:"heirBoost"},why:"Ses copains, le ballon, les goûters d'après-match. C'est l'essentiel."},
      {t:"Le pousser vers autre chose",fx:{moral:1},why:"Tu sais trop bien ce que ce milieu coûte."}]},
 {id:"divorce",cond:()=>p.vie.couple==="marie"&&(p.life==="fete"||p.moral<35),weight:.5,txt:()=>"Les absences, les soirées, les tensions : ton couple traverse une vraie crise.",
  ch:[{t:"Faire une thérapie de couple",fx:{money:-20,moral:3,form:-2},why:"Ça prend du temps, mais vous vous retrouvez."},
      {t:"Changer de vie : fini les sorties",fx:{moral:2,form:5,flag:"rangé"},why:"Tu rentres tôt. Ton couple respire."},
      {t:"Se séparer",fx:{couple:null,moral:-12,money:()=>-Math.round(p.money*.25),moment:"Divorce"},why:"La presse people s'en donne à cœur joie. Les avocats aussi."}]},
 {id:"parentsSante",cond:()=>p.age>=26&&!p.flags.parentsSante,weight:.6,txt:()=>"Un coup de fil de ton pays : ta mère est hospitalisée. Rien de grave, mais elle s'inquiète de te voir si peu.",
  ch:[{t:"Prendre l'avion entre deux matchs",fx:{moral:6,form:-5,flag:"parentsSante"},why:"Tu passes une nuit à son chevet. Elle va déjà mieux."},
      {t:"Lui payer les meilleurs soins et l'appeler chaque soir",fx:{money:-30,moral:3,flag:"parentsSante"},why:"Elle est bien entourée, et elle t'entend tous les jours."},
      {t:"Demander à te rapprocher de chez toi",fx:{flag:"forceDepart",moral:2},why:"Un club de ton pays pourrait se manifester cet été."}]},
 // agent
 {id:"agentDemarche",cond:()=>p.agent==="aucun"&&p.rep>=20&&p.defi!=="solo",txt:()=>"Ton téléphone n'arrête pas de sonner : trois agents veulent te représenter.",
  ch:[{t:"Choisir le super-agent aux grosses voitures",fx:{agent:"requin",rep:2},why:"Il te promet le monde. Il prendra 15 %."},
      {t:"Choisir l'agent discret recommandé par ton capitaine",fx:{agent:"fidele",moral:2},why:"Il parle peu, mais il connaît tout le monde."},
      {t:"Rester seul maître de ta carrière",fx:{moral:2},why:"Pas de commission. Pas de réseau non plus."}]},
 {id:"agentRequinPige",cond:()=>p.agent==="requin"&&p.age>=22&&p.age<=30,txt:()=>"Ton agent a « une affaire en or » : un club exotique offre un salaire délirant. Lui toucherait une commission record.",
  ch:[{t:"Écouter ton agent",fx:{flag:"forceDepart",money:()=>Math.round(p.salary*.5)},why:"Prime de signature versée d'avance. Un club se manifestera cet été."},
      {t:"Lui rappeler qui est le patron",risk:{p:.6,good:{moral:3,rep:1,txt:"Il s'excuse et se remet au travail pour toi."},bad:{moral:-4,txt:"Vexé, il laisse filer plusieurs offres intéressantes."}}},
      {t:"Le remplacer par un agent de confiance",fx:{agent:"fidele",moral:2},why:"Moins d'esbroufe, plus de sérénité."}]},
 {id:"agentFideleConseil",cond:()=>p.agent==="fidele"&&p.age>=23,txt:()=>"Ton agent t'invite à déjeuner : « Je t'ai trouvé une clause intéressante pour ton prochain contrat. Mais il faudra être patient. »",
  ch:[{t:"Lui faire confiance",fx:{flag:"clauseNext",moral:2},why:"Un grand club pourra activer ta clause l'été prochain."},
      {t:"Lui demander de viser plus gros tout de suite",risk:{p:.4,good:{flag:"forceDepart",txt:"Il décroche un rendez-vous avec un cador."},bad:{moral:-2,txt:"Rien ne se concrétise cette année."}}}]}
);
addSeed("amour",0,null,"demande",[2,4]);
