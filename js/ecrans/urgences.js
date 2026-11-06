// Trajectoire · Appels et messages urgents : le téléphone sonne tout seul, il faut décider tout de suite.
// p.urgent = {id, d} tant que la décision n'est pas prise ; la fenêtre s'ouvre par-dessus l'écran en cours.
// Une réponse a des effets (fx, comme les événements), un risque (risk) ou une action (run) qui renvoie le texte à afficher.
// next:{id, d:[min,max]} programme une suite (en saisons) ; les suites (follow:true) ne sortent que comme ça.

// un grand club à portée, pour les offres de dernière minute
const urgentClub = ()=>shuffle(CLUBS.filter(c=>c.name!==p.club.name&&c.str>p.club.str&&c.str<=p.lvl+8&&clubAllowed(c)))[0]||null;
const urgentSalary = c=>Math.round(Math.pow(Math.max(c.str-35,5),2)*.95*(1+p.rep/80));
const URGENTS = [
  {id:"clubAppel",when:"ete",from:"agent",kind:"appel",cond:()=>!defiOn("fidele")&&!p.loanFrom&&p.age<33&&!!urgentClub(),data:()=>({club:urgentClub()}),
   txt:d=>`Ton agent, essoufflé : « ${d.club.name} vient d'appeler ! Ils veulent une réponse dans l'heure, sinon ils prennent un autre joueur. »`,o:[
    {t:"« Fonce, je signe ! »",run:d=>{ p.offers = [{club:d.club,years:RI(2,4),salary:urgentSalary(d.club),loan:false},...(p.offers||[])]; p.moments.push(`${p.year} · Signe en une heure à ${d.club.name}`); sign(0,true); return null; }},
    {t:"« Dis-leur que je réfléchis »",run:d=>{ if(chance(.5)){ p.offers = [{club:d.club,years:RI(2,4),salary:urgentSalary(d.club),loan:false},...(p.offers||[])]; return `${d.club.name} accepte d'attendre : leur offre t'attend dans ta liste.`; } return `Trop tard : ${d.club.name} a signé quelqu'un d'autre dans l'heure.`; }},
    {t:"« Je suis bien ici »",fx:{trust:3,moral:1},r:"Ton agent soupire. Ton coach, lui, l'apprend et apprécie.",next:{id:"clubAppel",d:[1,2]}}]},
  {id:"rivalAppel",when:"ete",from:"rival",kind:"appel",cond:()=>!defiOn("fidele")&&rivalActive()&&clubAllowed(p.rival.club)&&p.rival.club.name!==p.club.name&&p.rival.club.str>=p.club.str-4,data:()=>({club:{...p.rival.club}}),
   txt:d=>`Numéro masqué… C'est ${p.rival.name} : « Mon club cherche un joueur comme toi. ${d.club.name}, toi et moi dans la même équipe. Tu imagines ? »`,o:[
    {t:"« Pourquoi pas… »",run:d=>{ p.offers = [{club:d.club,years:RI(2,3),salary:urgentSalary(d.club),loan:false},...(p.offers||[])]; return `${d.club.name} t'envoie une offre dans la soirée. Elle est dans ta liste.`; }},
    {t:"« Plutôt arrêter le foot. »",fx:{moral:2,rival:1},r:"Il éclate de rire. « Je m'en doutais. À bientôt sur le terrain. »"}]},
  {id:"scoop",when:"ete",from:"dm",kind:"message",cond:()=>p.rep>=25,data:()=>({}),
   txt:()=>`${cast().journo.n}, journaliste : « J'ai une info sur ton avenir. Je publie dans dix minutes. Tu confirmes ou tu démens ? »`,o:[
    {t:"« Pas de commentaire. »",fx:{},r:"L'article sort quand même, plein de conditionnels."},
    {t:"Démentir fermement",fx:{trust:2,rep:-1},r:"L'article ne sort pas. Elle ne t'appellera plus en premier."},
    {t:"Lui donner une exclusivité",fx:{rep:2,trust:-2},r:"Son article fait la une. Elle te doit une faveur.",next:{id:"scoopSuite",d:[1,2]}}]},
  {id:"boulette",when:"saison",from:"club",kind:"appel",cond:()=>p.rep>=20&&p.defi!=="solo",data:()=>({}),
   txt:()=>"Le service communication du club : « Une vidéo de toi en boîte de nuit circule depuis vingt minutes. 400 000 vues. On fait quoi ? »",o:[
    {t:"Présenter des excuses publiques",fx:{rep:-1,trust:2,moral:-1},r:"Le communiqué calme le jeu. Le coach te met à l'amende, sans plus."},
    {t:"« C'est un montage ! »",risk:{p:.35,good:{rep:1,txt:"Le doute s'installe, l'histoire retombe."},bad:{rep:-5,trust:-3,trend:"bad",txt:"Une deuxième vidéo sort. Le mensonge fait plus de mal que la soirée."}},next:{id:"bouletteSuite",d:[0,1]}},
    {t:"Ne rien dire",fx:{rep:-3},trend:"bad",r:"Le silence nourrit la polémique pendant toute la semaine.",next:{id:"bouletteSuite",d:[0,1]}}]},
  {id:"famille",when:"saison",from:"famille",kind:"appel",cond:()=>true,data:()=>({}),
   txt:()=>"Ta mère, la voix tremblante : « Ton père a fait un malaise. Il est à l'hôpital… Ils disent que ça va aller, mais… »",o:[
    {t:"Partir tout de suite",fx:{moral:2,play:-6,form:-2},r:"Tu manques un match. Ton père te serre la main en souriant : « Fallait pas venir, idiot. »",next:{id:"familleSuite",d:[0,1]}},
    {t:"Jouer le match et y aller juste après",fx:{moral:-3,play:3},r:"Tu marques et dédies le but à ton père. Il l'a vu depuis son lit.",next:{id:"familleSuite",d:[0,1]}},
    {t:"Appeler toutes les heures",fx:{moral:-1},r:"Tu passes la nuit le téléphone à la main. Il va mieux au matin."}]},
  {id:"brassard",when:"saison",from:"coach",kind:"appel",cond:()=>!p.flags.cap&&p.age>=22&&p.lvl>=p.club.str-6,data:()=>({}),
   txt:()=>"Le coach, à 23 h : « Le capitaine s'est blessé à l'entraînement. Demain, c'est toi qui portes le brassard. »",o:[
    {t:"« Je serai prêt. »",fx:{flag:"cap",rep:3,moral:3,play:4,moment:"Capitaine pour la première fois, appelé la veille au soir"},r:"Tu ne dors pas de la nuit. Le lendemain, tu mènes l'équipe."},
    {t:"« Je ne me sens pas prêt. »",fx:{moral:-1,trust:-1},r:"Il respecte ta réponse. Le brassard va à un autre."}]},
  {id:"selection",when:"saison",from:"dm",kind:"appel",cond:()=>p.age>=18&&p.caps<5&&p.lvl>=COUNTRIES[p.country].nat-10,data:()=>({}),
   txt:()=>`Le sélectionneur de ${COUNTRIES[p.country].name} : « Un joueur s'est blessé. Tu es dans l'avion demain matin. »`,o:[
    {t:"« J'arrive ! »",fx:{nat:10,moral:5,moment:"Appelé en urgence en sélection"},r:"Tu fais ta valise en cinq minutes. Ta mère pleure de joie au téléphone."},
    {t:"« J'ai une petite gêne… »",fx:{form:3,nat:-4},r:"Il raccroche sèchement. Ce genre d'appel ne revient pas souvent."}]},
  {id:"pote",when:"saison",from:"pote",kind:"message",cond:()=>p.money>=60,data:()=>({}),
   txt:()=>"Ton ami d'enfance : « Frérot je suis au commissariat, c'est une erreur, j'ai besoin d'un avocat ce soir stp 🙏 »",o:[
    {t:"Payer un avocat",fx:{money:-50,moral:3},r:"Il sort le lendemain matin. « Je te dois tout. »"},
    {t:"Appeler ses parents",fx:{moral:1},r:"Ses parents s'en occupent. Il t'en veut un peu de ne pas être venu."},
    {t:"Ne pas répondre",fx:{moral:-3},r:"Tu éteins ton téléphone. Ça te travaille toute la nuit.",next:{id:"poteSuite",d:[0,1]}}]},
  {id:"sponsorFuit",when:"saison",from:"agent",kind:"appel",cond:()=>p.rep>=30&&!!(p.phone?.trend&&!p.phone.trend.good),data:()=>({}),
   txt:()=>`Ton agent : « Ton sponsor a vu le hashtag ${p.phone.trend.tag}. Ils menacent de rompre le contrat. »`,o:[
    {t:"Les appeler toi-même pour t'expliquer",risk:{p:.6,good:{rep:1,moral:1,txt:"Ils restent. Ta sincérité les a convaincus."},bad:{money:()=>-Math.round(p.rep*4),txt:"Ils partent quand même, avec des pénalités."}}},
    {t:"« Qu'ils partent. »",fx:{money:()=>-Math.round(p.rep*4),moral:1},r:"Contrat rompu. Ta liberté a un prix.",next:{id:"sponsorNouveau",d:[0,1]}}]},
  /* --- les suites --- */
  {id:"bouletteSuite",follow:true,when:"saison",from:"dm",kind:"appel",cond:()=>true,data:()=>({}),
   txt:()=>`${cast().journo.n}, journaliste : « J'ai la vidéo complète de cette fameuse soirée. Ce n'est pas joli. Un commentaire avant que je publie ? »`,o:[
    {t:"Tout raconter toi-même, en interview",fx:{rep:2,moral:2},r:"Ta franchise désarme tout le monde. L'affaire est close pour de bon."},
    {t:"Menacer d'un procès",risk:{p:.4,good:{txt:"L'article ne sort jamais."},bad:{rep:-4,trend:"bad",txt:"L'article sort, avec ta menace en titre. Effet désastreux."}}},
    {t:"La laisser publier",fx:{rep:-3,moral:-2},r:"Une semaine difficile. Puis on passe à autre chose."}]},
  {id:"familleSuite",follow:true,when:"saison",from:"famille",kind:"appel",cond:()=>true,data:()=>({}),
   txt:()=>"Ton père, rétabli, la voix pleine d'énergie : « Samedi, je viens au stade. Comme quand tu avais huit ans. »",o:[
    {t:"Lui réserver la meilleure place",fx:{moral:5,money:-5},r:"Il est assis juste derrière le banc. Tu le vois se lever à chaque action."},
    {t:"Lui promettre de lui dédier un but",fx:{moral:3,moment:"Son père revient au stade après son malaise"},r:"Tu tiens parole. Il ne s'en remet pas."}]},
  {id:"poteSuite",follow:true,when:"saison",from:"pote",kind:"message",cond:()=>true,data:()=>({}),
   txt:()=>"Ton ami d'enfance : « Je suis sorti. C'était une erreur, comme je t'avais dit. T'étais où, quand j'avais besoin de toi ? »",o:[
    {t:"T'excuser sincèrement",fx:{moral:2},r:"« T'inquiète. Mais la prochaine fois, réponds. » Vous vous retrouvez le soir même."},
    {t:"« Je ne peux pas tout gérer. »",fx:{moral:-2},r:"Il ne répond pas. Une amitié de vingt ans se fissure."},
    {t:"Lui proposer un travail dans ta fondation",cond:()=>!!p.flags.fond,fx:{rep:2,moral:3},r:"Il accepte. Il devient le meilleur éducateur de ta fondation."}]},
  {id:"scoopSuite",follow:true,when:"ete",from:"dm",kind:"appel",cond:()=>!defiOn("fidele"),data:()=>({}),
   txt:()=>`${cast().journo.n} te rend la faveur : « Ton club négocie ta vente dans ton dos. Je te le dis avant tout le monde. »`,o:[
    {t:"Aller voir le président",risk:{p:.5,good:{trust:3,moral:2,txt:"Il dément, gêné, et te propose une prolongation pour se faire pardonner."},bad:{trust:-4,moral:-3,txt:"Il ne dément pas. L'ambiance est glaciale."}}},
    {t:"Demander à ton agent de trouver mieux",fx:{flag:"forceDepart",moral:1},r:"« Je m'en occupe. » Ton téléphone va sonner cet été."},
    {t:"Faire comme si de rien n'était",fx:{moral:-2},r:"Tu joues, tu te tais. Mais tu ne regardes plus le président de la même façon."}]},
  {id:"sponsorNouveau",follow:true,when:"saison",from:"agent",kind:"appel",cond:()=>true,data:()=>({}),
   txt:()=>"Ton agent : « Une marque engagée a vu que tu avais laissé partir ton sponsor plutôt que de t'excuser. Ils adorent. Ils veulent te signer. »",o:[
    {t:"Signer avec eux",fx:{money:()=>Math.round(30+p.rep*5),rep:2},r:"Une campagne qui te ressemble. Les fans adorent."},
    {t:"Faire une pause avec les sponsors",fx:{moral:2,form:2},r:"Moins de tournages, plus de temps pour toi."}]}
];
const urgentDef = ()=>URGENTS.find(u=>u.id===p.urgent?.id);
const urgentOpts = ()=>urgentDef().o.filter(o=>!o.cond||o.cond());
// une suite attend-elle son moment ?
const urgentDue = when=>(p.urgentSeeds||[]).some(x=>x.y<=p.year&&URGENTS.find(u=>u.id===x.id)?.when===when);
// déclenché après un événement (« saison ») ou en début d'intersaison (« ete »)
function maybeUrgent(when){
  if(!p||p.retired||p.urgent) return;
  // une suite arrivée à échéance passe avant tout
  const si = (p.urgentSeeds||[]).findIndex(x=>x.y<=p.year&&URGENTS.find(u=>u.id===x.id)?.when===when&&URGENTS.find(u=>u.id===x.id).cond());
  let u;
  if(si>=0){ const id = p.urgentSeeds.splice(si,1)[0].id; u = URGENTS.find(x=>x.id===id); }
  else {
    // un même appel ne revient pas plus de deux fois par carrière
    const ok = URGENTS.filter(u=>!u.follow&&u.when===when&&u.cond()&&!(p.urgentsSeen||[]).includes(u.id+p.year)&&((p.urgentCount||{})[u.id]||0)<2);
    if(!ok.length) return;
    u = pick(ok);
  }
  p.urgentCount = {...(p.urgentCount||{}),[u.id]:((p.urgentCount||{})[u.id]||0)+1};
  p.urgent = {id:u.id,d:u.data()};
  p.urgentsSeen = [...(p.urgentsSeen||[]),u.id+p.year].slice(-30);
}
function urgentScreen(){
  const u = urgentDef(); if(!u) return void (p.urgent = null);
  const c = CONTACTS[u.from];
  document.querySelector(".overlay")?.remove();
  openOverlay(`<div class="sheet urgent ${u.kind}" role="document">
    <div class="urg-head"><span class="urg-i" aria-hidden="true">${c.i()}</span><div><small>${u.kind==="appel"?"📞 Appel entrant":"💬 Message urgent"}</small><b>${esc(c.n())}</b></div></div>
    <p class="story">${esc(u.txt(p.urgent.d))}</p>
    ${urgentOpts().map((o,j)=>`<button class="btn" onclick="urgentAnswer(${j})">${choiceLead(o.t,j)}<span class="ctext">${esc(o.t)}</span>${o.risk?'<span class="chip">🎲 Risqué</span>':""}</button>`).join("")}
  </div>`,u.kind==="appel"?"Appel entrant":"Message urgent");
  if(!ui.quick) sfx("whistle");
}
function urgentAnswer(j){
  const u = urgentDef(); if(!u) return;
  const o = urgentOpts()[j], d = p.urgent.d;
  if(o.next) p.urgentSeeds = [...(p.urgentSeeds||[]),{id:o.next.id,y:p.year+RI(o.next.d[0],o.next.d[1])}];
  p.urgent = null; p.urgentsN = (p.urgentsN||0)+1;
  document.querySelector(".overlay")?.remove();
  msg(u.from,u.txt(d));
  const m = phone().msgs[0]; m.replies = [{t:o.t,fx:{},r:""}]; m.answered = 0; phone().unread = Math.max(0,phone().unread-1);
  if(o.run){ const t = o.run(d); if(t==null) return; ui.toast = `<div class="tchoice">📞 ${esc(o.t)}</div><div>${esc(t)}</div>`; save(); return route(); }
  let fx = o.fx, txt = o.r, trend = o.trend;
  if(o.risk){ fx = chance(o.risk.p)?o.risk.good:o.risk.bad; txt = fx.txt; trend = fx.trend; }
  const deltas = applyFx(Object.fromEntries(Object.entries(fx).filter(([k])=>k!=="trend")));
  if(trend==="bad") setTrend({tag:`#${tag()}Out`,good:false});
  ui.toast = `<div class="tchoice">📞 ${esc(o.t)}</div><div>${esc(txt)}</div><div class="delta">${deltaHtml(deltas)}</div>`;
  save(); route();
}
