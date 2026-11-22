// Trajectoire · Les coéquipiers qui comptent : la recette du centre appliquée au vestiaire pro.
// Dans chaque club, trois hommes nommés t'accompagnent sur plusieurs saisons : le capitaine, ton meilleur pote, et selon
// ton âge le vétéran qui t'apprend le métier ou le gamin que tu prends sous ton aile. Ils vieillissent, se souviennent
// de tes choix (aff : l'affection, mem : ce qui s'est passé), partent (retraite, transfert) et reviennent en face de toi.
// État : p.crew = {club, year, list:[{n, role, pos, age, aff, mem, since}], gone:[{…, club, left, why}]}

const CREW_ROLES = {capitaine:{n:"Capitaine",i:"©️"},pote:{n:"Ton meilleur pote",i:"🤜"},mentor:{n:"Le vétéran",i:"🧓"},jeune:{n:"Le gamin",i:"🌱"}};
const crewOn = ()=>!!p&&!p.daily&&!p.friend&&!p.centre&&!p.retired&&!!p.club;
function crewName(){
  const C = p.crew||{list:[],gone:[]}, used = new Set([p.name,p.rival?.name,p.rel?.mate,p.rel?.jealous,...C.list.map(x=>x.n),...C.gone.map(x=>x.n)]);
  let s, i = 0; do s = pick(FIRST)+" "+pick(LAST); while((used.has(s)||s.split(" ")[0]===String(p.name).split(" ")[0])&&++i<50); return s;
}
const otherPos = ()=>pick(["GB","DEF","DEF","MIL","ATT"].filter(q=>q!==p.pos));
function crewMember(role){
  const age = {capitaine:RI(29,32),pote:clamp(p.age+RI(-2,2),18,34),mentor:RI(32,34),jeune:RI(17,19)}[role];
  return {n:role==="pote"&&p.rel?.mate?p.rel.mate:crewName(),role,pos:role==="pote"?pick(["DEF","MIL","ATT"]):otherPos(),age,aff:role==="pote"?10:0,mem:{},since:p.year};
}
// la liste du club actuel ; en changeant de club, ceux d'avant restent là-bas (et deviennent de futurs adversaires)
function crew(){
  if(!crewOn()) return [];
  const C = p.crew = p.crew||{club:null,year:null,list:[],gone:[]};
  if(C.club!==p.club.name){
    if(C.club) for(const x of C.list) C.gone.unshift({...x,club:C.club,left:p.year,why:"toi"});
    C.gone = C.gone.slice(0,10);
    C.club = p.club.name; C.year = p.year; C.list = []; p.crewBack = null;
    // retour dans un ancien club (fin de prêt, retour aux sources) : ceux qui y sont restés t'attendent
    const back = C.gone.filter(x=>x.club===p.club.name&&x.why==="toi"&&x.age<35);
    for(const x of back){ C.gone.splice(C.gone.indexOf(x),1); const {club,left,why,...m} = x; m.mem.retrouve = p.year; C.list.push(m); }
    if(back.length) p.crewBack = back.map(x=>x.n);
    for(const r of ["capitaine","pote",p.age<=25?"mentor":"jeune"]) if(!C.list.some(x=>x.role===r)&&C.list.length<3) C.list.push(crewMember(r));
  }
  const pote = C.list.find(x=>x.role==="pote");
  if(pote&&p.rel){ if(pote.mem.retrouve&&p.rel.mate!==pote.n) p.rel.mate = pote.n; else if(p.rel.mate&&pote.n!==p.rel.mate) pote.n = p.rel.mate; }
  // tu as le brassard : l'ancien capitaine devient le vétéran du groupe
  const cap = C.list.find(x=>x.role==="capitaine");
  if(cap&&p.flags.cap){ cap.role = "mentor"; cap.mem.brassard = true; }
  return C.list;
}
const crewGet = role=>crew().find(x=>x.role===role)||null;
const crewN = role=>esc(crewGet(role)?.n||"un coéquipier");
// pour les textes : le membre du rôle, ou un remplaçant neutre (un choix peut changer les rôles avant que le texte soit relu)
const cg = role=>crewGet(role)||(role==="capitaine"?crewGet("mentor"):null)||{n:"un coéquipier",age:30,aff:0,mem:{}};
// effets d'un choix : {role, aff, mem:{…}}
function crewFx(v){
  const x = crewGet(v.role)||(v.role==="capitaine"?crewGet("mentor"):null); if(!x) return;
  if(v.aff) x.aff = clamp(x.aff+v.aff,-50,50);
  if(v.mem) Object.assign(x.mem,v.mem);
}
// début de saison : chacun prend un an ; les anciens raccrochent, d'autres signent ailleurs, le groupe se complète
function crewYear(){
  if(!crewOn()) return;
  crew(); const C = p.crew;
  if(C.year===p.year) return;
  C.year = p.year;
  const lg = CLUBS.filter(c=>c.country===p.club.country&&c.name!==p.club.name);
  for(const x of C.list.slice()){
    x.age++;
    const retire = x.age>=(x.role==="mentor"?36:35), move = !retire&&x.role!=="jeune"&&chance(x.role==="pote"?.07:.12)&&lg.length;
    if(!retire&&!move) continue;
    const to = move?pick(lg):null;
    C.list.splice(C.list.indexOf(x),1);
    C.gone.unshift({...x,club:to?to.name:C.club,left:p.year,why:retire?"retraite":"transfert"});
    const warm = x.aff>=10;
    if(typeof msg==="function"){
      msg("crew",retire?(warm?`J'ai raccroché les crampons. Je voulais que tu l'apprennes par moi. ${x.mem.seances==="oui"?"Continue les vingt minutes après l'entraînement, hein.":x.mem.brassard?"Prends soin du brassard.":"Ce vestiaire, c'est le tien maintenant."}`:"C'est fini pour moi. Bonne continuation."):(warm?`Je signe ${auC(to.name)}. On se retrouve en face, et je ne te ferai pas de cadeau 😄`:`Je pars ${auC(to.name)}. Bonne chance pour la suite.`),
        retire?[{t:"« Merci pour tout. Vraiment. »",fx:{moral:2},r:"Il t'envoie une photo de vous deux, à l'entraînement, il y a des années."},{t:"« Tu vas t'ennuyer au bout d'une semaine. »",fx:{moral:1},r:"« Déjà fait. J'ai repeint le garage deux fois. »"}]
          :[{t:"« Je te réserve un petit pont. »",fx:{moral:1},r:"« Essaie, pour voir 😄 »"},{t:"« Tu vas nous manquer. »",fx:{moral:2},r:"« Toi aussi. Garde-moi une place au resto du jeudi. »"}]);
      phone().msgs[0].who = x.n;
    }
  }
  C.gone = C.gone.slice(0,10);
  // un capitaine manque : le plus ancien prend le brassard, sinon le club en recrute un
  if(!p.flags.cap&&!C.list.some(x=>x.role==="capitaine")){
    const old = C.list.filter(x=>x.role!=="jeune"&&x.age>=27).sort((a,b)=>b.age-a.age)[0];
    if(old) old.role = "capitaine"; else C.list.push(crewMember("capitaine"));
  }
  if(!C.list.some(x=>x.role==="pote")&&p.rel) C.list.push(crewMember("pote"));
  while(C.list.length<3) C.list.push(crewMember(p.age<=25&&!C.list.some(x=>x.role==="mentor")?"mentor":"jeune"));
  crewLifeDrift();
}
// ta façon de vivre déteint sur le vestiaire, saison après saison : le fêtard plaît au pote et agace les anciens,
// le pro gagne le respect du capitaine et du vétéran, la star fascine le gamin, le leader rassemble
const CREW_LIFE = {fete:{pote:3,capitaine:-2,mentor:-2,jeune:1},pro:{mentor:2,capitaine:2},star:{jeune:2,capitaine:-2,pote:-1},discret:{mentor:1,pote:-1}};
function crewLifeDrift(){
  const d = CREW_LIFE[p.life]||{};
  for(const x of p.crew.list) x.aff = clamp(x.aff+(d[x.role]||0)+(p.trait==="lead"?1:0),-50,50);
}

// les retrouvailles : l'affection de chacun, puis la scène ne revient plus
function crewBackFx(v){ for(const x of crew()) if((p.crewBack||[]).includes(x.n)) x.aff = clamp(x.aff+v,-50,50); p.crewBack = null; }

/* ============ Les scènes du vestiaire ============ */
const crewCan = (role,f)=>()=>{ const x = crewOn()&&crewGet(role); return !!x&&f(x); };
EVENTS.push(
  {id:"eqRepas",scene:"vestiaire",weight:2,cond:crewCan("capitaine",x=>!x.mem.repas),
    txt:()=>`${esc(cg("capitaine").n)}, le capitaine, organise un dîner d'équipe chez lui, le soir où tu avais prévu de te reposer. « Tout le monde vient. Tout le monde. »`,
    ch:[{t:"Y aller, et rester jusqu'au bout",fx:{moral:2,crew:{role:"capitaine",aff:10,mem:{repas:"oui"}}},why:"Tu finis la soirée à parler foot avec lui sur la terrasse. Il te raconte ses débuts. Vous ne vous regardez plus de la même façon."},
        {t:"Décliner poliment",fx:{form:2,crew:{role:"capitaine",aff:-6,mem:{repas:"non"}}},why:"Tu dors dix heures. Le lendemain, au vestiaire, il te salue d'un simple signe de tête."}]},
  {id:"eqBrassard",scene:"vestiaire",weight:4,cond:()=>crewCan("capitaine",x=>x.age>=33&&x.aff>=5&&!x.mem.adieu)()&&!p.flags.cap&&p.age>=22,
    txt:()=>{ const x = cg("capitaine"); return `${esc(x.n)} annonce au groupe que c'est sa dernière saison. Plus tard, sur le parking, il t'attend près de ta voiture. ${x.mem.repas==="oui"?"« Tu te souviens du dîner ? Ce soir-là, j'ai su. » ":""}« Le coach m'a demandé à qui donner le brassard l'an prochain. J'ai dit ton nom. »`; },
    ch:[{t:"Le prendre, et le mériter",fx:{flag:"cap",rep:3,moral:4,moment:"Reçoit le brassard des mains de son capitaine",crew:{role:"capitaine",aff:8,mem:{adieu:"brassard"}}},why:"Il te tape sur l'épaule. « Ne change rien. Et parle plus fort. »"},
        {t:"« Garde-le jusqu'au dernier match. »",fx:{moral:3,trust:3,crew:{role:"capitaine",aff:12,mem:{adieu:"respect"}}},why:"Il détourne les yeux, ému. Le dernier match, il te tendra le brassard à la 80e minute, devant tout le stade."}]},
  {id:"eqCapFroid",scene:"vestiaire",weight:2,cond:crewCan("capitaine",x=>x.aff<=-5&&!x.mem.froid),
    txt:()=>`Devant tout le monde, ${esc(cg("capitaine").n)} te reproche de jouer pour toi. « Ici, on gagne ensemble ou on perd ensemble. Toi, tu fais ta vie. »`,
    ch:[{t:"Lui répondre devant le groupe",risk:{p:()=>clamp(.35+p.rep/200,.2,.7),good:{rep:2,crew:{role:"capitaine",aff:4,mem:{froid:"tenu"}},txt:"Il se tait. Le soir, il t'envoie un message : « Tu as du caractère. C'est bien. »"},bad:{moral:-4,trust:-3,crew:{role:"capitaine",aff:-8,mem:{froid:"guerre"}},txt:"Le ton monte. Le coach doit vous séparer. Le vestiaire choisit son camp, et ce n'est pas le tien."}}},
        {t:"Aller le voir seul, après",fx:{trust:2,crew:{role:"capitaine",aff:12,mem:{froid:"parle"}}},why:"Dix minutes dans le couloir. Il avait raison sur deux ou trois choses. Tu le lui dis."}]},
  {id:"eqSeances",scene:"terrain",weight:2,cond:crewCan("mentor",x=>!x.mem.seances),
    txt:()=>`Le vétéran ${esc(cg("mentor").n)}, ${cg("mentor").age} ans, reste après l'entraînement et t'attend avec un sac de ballons. « Vingt minutes par jour. Je vais t'apprendre ce que personne ne t'apprendra. »`,
    ch:[{t:"Rester, tous les jours",fx:{lvl:1,trust:2,crew:{role:"mentor",aff:12,mem:{seances:"oui"}}},why:"Le placement du corps, le premier contrôle, la façon de lire les épaules d'un défenseur. Au bout d'un mois, tu joues avec un temps d'avance."},
        {t:"« Merci, mais j'ai mon programme. »",fx:{form:1,crew:{role:"mentor",aff:-4,mem:{seances:"non"}}},why:"Il hausse les épaules. « Comme tu veux, petit. » Il range les ballons."}]},
  {id:"eqCrampons",scene:"vestiaire",weight:4,cond:crewCan("mentor",x=>x.age>=35&&x.mem.seances==="oui"&&!x.mem.crampons),
    txt:()=>`Dernier entraînement de ${esc(cg("mentor").n)}. Dans le vestiaire, il pose sur ton banc une paire de crampons usés jusqu'à la corde. « Ceux de mes plus belles années. Tu en feras quelque chose. »`,
    ch:[{t:"Les accrocher au-dessus de ton casier",fx:{moral:5,moment:"Reçoit les crampons de son mentor",crew:{role:"mentor",aff:10,mem:{crampons:"casier"}}},why:"Ils y resteront tant que tu joueras ici. Chaque matin, tu les regardes avant de lacer les tiens."},
        {t:"Les porter au prochain match",risk:{p:.55,good:{rep:2,moral:4,moment:"Joue un match avec les crampons de son mentor",crew:{role:"mentor",aff:12,mem:{crampons:"match"}},txt:"Un but, ce soir-là. Tu cours vers la tribune où il est assis, et tu montres tes pieds."},bad:{form:-3,crew:{role:"mentor",aff:6,mem:{crampons:"match"}},txt:"Deux ampoules et un match moyen. Il éclate de rire : « Ils n'étaient pas faits pour toi, idiot. »"}}}]},
  {id:"eqGamin",scene:"vestiaire",weight:2,cond:crewCan("jeune",x=>!x.mem.aide),
    txt:()=>`${esc(cg("jeune").n)}, ${cg("jeune").age} ans, tout juste monté du centre, n'ose pas te parler. Un coéquipier te glisse qu'il pleure le soir dans sa chambre : sa famille est à six cents kilomètres.`,
    ch:[{t:"L'inviter à dîner chez toi",fx:{moral:2,crew:{role:"jeune",aff:14,mem:{aide:"oui"}}},why:"Il mange trois assiettes et ne dit presque rien. En partant, il te serre la main très fort."},
        {t:"Le laisser trouver sa place seul",fx:{form:1,crew:{role:"jeune",aff:-2,mem:{aide:"non"}}},why:"Tu es passé par là, toi aussi. On apprend en se débrouillant. Enfin, c'est ce que tu te dis."}]},
  {id:"eqEnvol",scene:"echo",weight:4,cond:crewCan("jeune",x=>x.age>=21&&x.mem.aide==="oui"&&!x.mem.envol),
    txt:()=>`${esc(cg("jeune").n)} a explosé cette saison. Trois clubs étrangers le veulent. Avant de répondre à qui que ce soit, il vient frapper à ta porte, comme le soir de son premier dîner chez toi : « Toi, tu ferais quoi ? »`,
    ch:[{t:"« Reste encore un an. Deviens grand ici. »",fx:{moral:3,crew:{role:"jeune",aff:8,mem:{envol:"reste"}}},why:"Il reste. À sa première conférence de presse de la saison, il te cite trois fois."},
        {t:"« Pars. Ces trains-là ne repassent pas. »",fx:{rep:2,moment:"Conseille son protégé au moment de son grand départ",crew:{role:"jeune",aff:10,mem:{envol:"part"}}},why:"Il signe dans un grand club. Sur le réseau, il publie une photo de vous deux : « Merci, grand frère. »"}]},
  {id:"eqRetrouvailles",scene:"echo",weight:9,cond:()=>crewOn()&&!!(p.crewBack&&p.crewBack.length),
    txt:()=>{ const n = (p.crewBack||[]).map(esc); return `Premier jour de retour au vestiaire ${esc(duC(p.club.name))}. ${n.length>1?`${n.slice(0,-1).join(", ")} et ${n.at(-1)} t'attendent`:`${n[0]||"Un ancien coéquipier"} t'attend`} devant ton ancien casier, qui porte encore ton nom au feutre. « On savait que tu reviendrais. »`; },
    ch:[{t:"Les serrer dans tes bras",fx:{moral:5,trust:2,crewBack:6},why:"Les autres joueurs regardent la scène sans tout comprendre. Eux, ils savent d'où tu reviens."},
        {t:"« Je ne suis pas revenu pour faire la fête. »",fx:{form:3,rep:1,crewBack:-2},why:"Ils rient. Tu n'as pas changé. Le soir même, tu es le dernier à quitter l'entraînement."}]}
);

/* ============ Le match clé : ceux qui sont partis reviennent en face ============ */
function crewMatchSetup(m){
  if(!crewOn()||!m||!p.crew) return;
  const ex = p.crew.gone.find(x=>x.why!=="retraite"&&x.club===m.opp.name);
  if(ex){ m.exMate = ex.n; m.log.push(`👥 En face, ${esc(ex.n)}, ${ex.role==="capitaine"?"ton ancien capitaine":ex.role==="mentor"?"le vétéran qui t'a appris le métier":ex.role==="jeune"?"le gamin que tu as vu grandir":"ton ancien meilleur pote"}. ${ex.aff>=10?"Vous vous êtes envoyé des messages toute la semaine.":"Vous ne vous êtes plus parlé depuis son départ."}`); return; }
  crewMatchMood(m);
  const cap = crewGet("capitaine");
  if(cap&&cap.aff>=10&&chance(.6)&&!m.crewHelp) m.log.push(`©️ Dans le tunnel, ${esc(cap.n)} rassemble tout le monde. Il te regarde en dernier : « Toi, ce soir, tu nous portes. »`);
}
// avant un match : celui qui t'adore te cherche à chaque ballon, celui que tu as froissé t'ignore
function crewMatchMood(m){
  if(!crewOn()||!m||m.crewMood) return;
  m.crewMood = true;
  const L = crew().filter(x=>x.n!==m.exMate), best = [...L].sort((a,b)=>b.aff-a.aff)[0], worst = [...L].sort((a,b)=>a.aff-b.aff)[0];
  if(best&&best.aff>=15&&chance(.55)){
    m.crewHelp = best.n; m.boost = clamp((m.boost||0)+.03,-.15,.15);
    m.log.push(`🤜 ${esc(best.n)} ${pick(["te cherche à chaque ballon. Vous jouez de mémoire.","t'a glissé dans le tunnel : « Fais tes appels, je te trouve. »","a demandé au coach de jouer juste derrière toi."])}`);
  } else if(worst&&worst.aff<=-10&&chance(.55)){
    m.crewCold = worst.n; m.boost = clamp((m.boost||0)-.03,-.15,.15);
    m.log.push(`😤 ${esc(worst.n)} ${pick(["ne te passe plus le ballon. Tout le stade le voit.","t'a à peine salué à l'échauffement.","préfère tenter seul plutôt que de te servir."])}`);
  }
}
/** @type {any[]} */ (MATCH_TALKS).push(
  {id:"c_aide",who:"🤜 Ton coéquipier",cond:m=>!!m.crewHelp,txt:()=>`${p.match?.crewHelp||"Ton coéquipier"} se retourne vers toi sur une touche : « Fais l'appel dans la profondeur, je te la mets. »`,o:[
    {t:"Faire l'appel",fx:{boost:.07,moral:1},r:"Le ballon arrive pile dans ta course. Il lève le pouce, l'air de dire : je te l'avais dit."},
    {t:"« Joue pour toi, tu es mieux placé. »",fx:{boost:.03,rep:1},r:"Il sourit. Ce soir, vous jouez l'un pour l'autre."}]},
  {id:"c_froid",who:"😤 Ton coéquipier",cond:m=>!!m.crewCold,txt:()=>`Tu étais seul au second poteau. ${p.match?.crewCold||"Ton coéquipier"} a préféré frapper. Il évite ton regard.`,o:[
    {t:"Aller le voir et lui parler franchement",risk:{p:.5,good:{boost:.06,txt:"Deux phrases, une tape sur l'épaule. Le ballon recommence à circuler."},bad:{boost:-.04,moral:-2,txt:"Il s'énerve. L'arbitre doit s'interposer entre deux coéquipiers."}}},
    {t:"Faire comme si de rien n'était",fx:{boost:.01},r:"Tu ravales ta colère. Vous réglerez ça au vestiaire."}]},
  {id:"c_exmate",who:"👥 Ton ancien coéquipier",cond:m=>!!m.exMate,txt:()=>`Sur un corner, ${p.match?.exMate||"ton ancien coéquipier"} se colle à toi au marquage. « Je connais toutes tes feintes, tu sais. »`,o:[
    {t:"« Alors tu connais aussi celle-là. »",risk:{p:.5,good:{boost:.08,moral:2,txt:"Une feinte que tu n'as jamais montrée à l'entraînement. Il éclate de rire en se relevant."},bad:{boost:-.04,txt:"Il avait raison : il connaissait celle-là aussi."}}},
    {t:"Lui donner une accolade",fx:{rep:1,moral:2,boost:.02},r:"Les photographes adorent. L'arbitre un peu moins : « On joue, messieurs. »"}]}
);
function crewAfterMatch(m,res){
  if(!crewOn()||typeof msg!=="function") return;
  for(const x of crew()){ if(x.n===m.crewHelp&&res==="w") x.aff = clamp(x.aff+3,-50,50); if(x.n===m.crewCold) x.aff = clamp(x.aff+(res==="w"?3:-2),-50,50); }
  if(m.exMate&&chance(.8)){ msg("crew",res==="w"?"Bravo. Mais la prochaine fois, je te marque de plus près 😤":res==="l"?"Désolé pour ce soir… pas trop quand même 😄 À bientôt !":"Match nul, comme au bon vieux temps à l'entraînement."); phone().msgs[0].who = m.exMate; return; }
  const x = crew().filter(c=>c.role!=="pote"&&c.aff>=5).sort((a,b)=>b.aff-a.aff)[0];
  if(!x||!chance(.5)) return;
  const L = {capitaine:{w:"Voilà ce que je veux voir. Fier de toi ce soir.",l:"On a perdu ensemble. Demain, on se relève ensemble.",d:"Pas fini. On va les chercher la prochaine fois."},
    mentor:{w:"T'as vu ? Le contrôle orienté, comme on l'a travaillé 👏",l:"Revois ton placement sur leur deuxième but. Demain, vingt minutes.",d:"Pas mal. Tu peux mieux."},
    jeune:{w:"T'ES UN MONSTRE 🔥🔥 j'ai filmé depuis le banc",l:"C'est pas ta faute. Tu m'as appris que ça arrive à tout le monde.",d:"Je retiens tout ce que tu fais, tu sais."}}[x.role];
  if(!L) return;
  msg("crew",L[res]||L.d); phone().msgs[0].who = x.n;
}

/* ============ Le film de carrière : l'homme du vestiaire ============ */
function crewFilmFrame(){
  if(!p.crew) return null;
  const all = [...p.crew.list.map(x=>({...x,club:p.crew.club})),...p.crew.gone].filter(x=>x.aff>=10);
  const x = all.sort((a,b)=>b.aff-a.aff)[0];
  if(!x) return null;
  const quote = x.mem.adieu==="brassard"?"« Je savais que le brassard serait bien gardé. »":x.mem.adieu==="respect"?"« Tu m'as laissé finir avec le brassard. Ça, je ne l'oublierai jamais. »"
    :x.mem.crampons?"« Mes vieux crampons ont fait une plus belle carrière avec toi qu'avec moi. »":x.mem.seances==="oui"?"« Vingt minutes par jour. Tu n'en as pas manqué une. »"
    :x.mem.envol?"« Grand frère. Je t'ai toujours appelé comme ça, dans ma tête. »":x.mem.aide==="oui"?"« Le soir de ce dîner, j'ai décidé de ne pas rentrer chez moi. »"
    :x.mem.repas==="oui"?"« Le dîner chez moi. C'est là que tout a commencé entre nous. »":"« Partager un vestiaire avec toi, c'était quelque chose. »";
  const say = `<div class="cf-say">${avatarSvg(lookFromName(x.n),46,clubColors(x.club).a)}<div><b>${esc(x.n)}<small>${esc(CREW_ROLES[x.role]?.n||"Coéquipier")} ${esc(auC(x.club))}</small></b><p>${esc(quote)}</p></div></div>`;
  return filmFrame("Le vestiaire","Certains coéquipiers restent pour la vie.",say);
}
