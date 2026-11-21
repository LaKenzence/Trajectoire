// Trajectoire · Le centre de formation (prototype) : de 16 à 18 ans, trois saisons pour un seul contrat pro.
// Le mode s'ouvre sur un match d'essai, puis suit trois personnages qui se souviennent de tes choix :
// Rémi Vasseur, le directeur du centre ; Sacha Lenoir, qui joue à ton poste et vise le même contrat ;
// et le proche qui t'a accompagné le jour de l'essai. Les matchs se jouent avec les mini-jeux. Pas de jauges :
// ce sont les gens qui te disent où tu en es. Six fins, et le film de ces trois ans pour finir.
// L'état vit dans p.centre (emplacement « centre ») ; routeScreen() passe la main à centreRoute().

const CF_CLUB = "Racing Port-Marée";
/** @type {Record<string,{l:string,n:string,pr:string,e:string,appel:string,beard:boolean}>} */
const CF_PARENTS = {
  mere:{l:"Ma mère",n:"ta mère",pr:"elle",e:"e",appel:"Maman",beard:false},
  pere:{l:"Mon père",n:"ton père",pr:"il",e:"",appel:"Papa",beard:true},
  gm:{l:"Ma grand-mère",n:"ta grand-mère",pr:"elle",e:"e",appel:"Mamie",beard:false},
  frere:{l:"Mon grand frère",n:"ton grand frère",pr:"il",e:"",appel:"Karim",beard:true},
  soeur:{l:"Ma grande sœur",n:"ta grande sœur",pr:"elle",e:"e",appel:"Inès",beard:false}
};
const CF_POSTE = {GB:"gardien",DEF:"défenseur",MIL:"milieu",ATT:"attaquant"};
// le poste qu'on te demande de dépanner en réserve, selon le tien
const CF_AUTRE = {GB:"dans le champ, en pointe. Oui, toi, avec des gants dans le sac",DEF:"au milieu de terrain",MIL:"en défense centrale",ATT:"sur le côté droit, en défense"};
const cfCap = s=>s.charAt(0).toUpperCase()+s.slice(1);
const cfC = ()=>p.centre||p.cf;
const cfPar = ()=>CF_PARENTS[cfC().par]||CF_PARENTS.mere;
const cfPrenom = ()=>(p.name||"").split(" ")[0]||p.name;
// les textes : {par} ta mère, {mpar} ma mère (dans ta bouche), {Par} Ta mère, {pr} elle, {Pr} Elle, {e} accord du proche, {appel} Maman, {moi} ton prénom
function T(s){
  const P = cfPar();
  return s.replace(/\{(\w+)\}/g,(m,k)=>({par:P.n,Par:cfCap(P.n),mpar:P.l.charAt(0).toLowerCase()+P.l.slice(1),pr:P.pr,Pr:cfCap(P.pr),e:P.e,appel:P.appel,moi:esc(cfPrenom())})[k]??m);
}
const CF_WHO = {
  vasseur:{n:"Rémi Vasseur",r:"Directeur du centre",col:"#2b2f55"},
  sacha:{n:"Sacha Lenoir",r:"Même poste que toi",col:"#c0392b"},
  par:{n:"",r:"",col:"#5a6b8c"},
  kessler:{n:"Bruno Kessler",r:"Agent de joueurs",col:"#1f4fd1"},
  nino:{n:"Nino",r:"9 ans",col:"#e67e22"},
  ferri:{n:"Dario Ferri",r:"Capitaine de l'équipe pro",col:"#7a1f2b"}
};
function cfSay(who,text){
  const w = CF_WHO[who], look = cfC().looks[who]||randomLook();
  const name = who==="par"?cfPar().appel:w.n, role = who==="par"?cfCap(cfPar().n):w.r;
  return `<div class="cf-say cf-${who}">${avatarSvg(look,46,w.col)}<div><b>${esc(name)}<small>${esc(role)}</small></b><p>${T(text)}</p></div></div>`;
}
const cfNar = (...ps)=>ps.filter(Boolean).map(x=>`<p class="cf-nar">${T(x)}</p>`).join("");
const cfImg = (src,alt)=>`<div class="cf-img" role="img" aria-label="${esc(alt)}" style="background-image:url('${src}')"></div>`;
const cfMark = who=>`<span class="cf-mark">💭 ${T(who)} s'en souviendra.</span>`;
// ce que le choix change, en coulisses : la confiance du coach, la relation avec Sacha, le lien avec le proche
function cfFx(fx){ const c = cfC(); for(const k of ["conf","sacha","lien"]) if(fx[k]) c[k] += fx[k]; }

/* ============ Les actions de match, par poste ============ */
// p : chance de réussite sans mini-jeu ; kind : le mini-jeu joué ; goal : but sur réussite ; them : risque de but adverse sur échec ;
// mine:false : la réussite n'est pas la tienne
const CF_FK = {txt:"Coup franc à vingt mètres, légèrement excentré.",o:[
  {t:"Le tirer toi-même",kind:"fk",p:.3,goal:1,ok:"Par-dessus le mur, sous la barre. But !",ko:"Dans le mur. Quelqu'un siffle dans la tribune."},
  {t:"Le laisser au tireur habituel",mine:false,p:.25,goal:1,ok:"Il le met au fond. Tu cours le féliciter.",ko:"Au-dessus. Personne ne t'en veut."}]};
const CF_ACTS = {
  ATT:[
    {txt:"Ballon en profondeur. Le défenseur central se retourne trop lentement.",o:[
      {t:"Le prendre de vitesse et dribbler",kind:"dribble",p:.5,goal:1,ok:"Tu l'effaces d'un crochet, frappe croisée. But !",ko:"Il revient à la dernière seconde et te reprend le ballon."},
      {t:"Temporiser, attendre le soutien",p:.75,ok:"Tu protèges le ballon, le milieu arrive : corner. Propre.",ko:"Deux défenseurs te serrent. Ballon perdu."}]},
    CF_FK,
    {txt:"Centre tendu de la droite. Tu arrives au premier poteau.",o:[
      {t:"Reprise de volée",p:.38,goal:1,ok:"Le ballon claque sous la barre. But !",ko:"Dans les nuages."},
      {t:"Contrôle de la poitrine, puis frapper",p:.48,goal:1,ok:"Contrôle, frappe, petit filet. But !",ko:"Le temps de contrôler, le défenseur est sur toi."}]},
    {txt:"Tu es fauché dans la surface. Penalty.",o:[
      {t:"Le tirer",kind:"shoot",p:.72,goal:1,ok:"Plein filet.",ko:"Le gardien part du bon côté."},
      {t:"Le laisser au capitaine",mine:false,p:.75,goal:1,ok:"Le capitaine le transforme et vient te taper dans la main.",ko:"Le capitaine le rate. Il te regarde, comme si c'était ta faute."}]},
    {txt:"Une passe en retrait trop courte du défenseur espagnol.",o:[
      {t:"Jaillir et dribbler le gardien",kind:"dribble",p:.5,goal:1,ok:"Tu chipes le ballon, tu effaces le gardien, but dans le but vide. Le président se lève.",ko:"Le gardien plonge dans tes pieds."},
      {t:"Frapper tout de suite",p:.45,goal:1,ok:"Ça rebondit, ça trompe le gardien. Moche, mais ça compte.",ko:"Ta frappe file à côté."}]}],
  MIL:[
    {txt:"Tu récupères au milieu. L'attaquant fait l'appel dans le dos de la défense.",o:[
      {t:"Passe en profondeur",kind:"passe",p:.5,goal:1,ok:"Ta passe coupe toute la défense. But de ton attaquant !",ko:"Trop longue, le gardien sort."},
      {t:"Jouer simple, en retrait",p:.85,ok:"Rien de spectaculaire. Vasseur note quelque chose dans son carnet.",ko:"Même la passe simple est interceptée. Mauvaise soirée."}]},
    CF_FK,
    {txt:"Le ballon traîne à trente mètres du but.",o:[
      {t:"Frappe de loin",p:.25,goal:1,ok:"Lucarne. Tout le banc se lève.",ko:"En tribune."},
      {t:"Décaler sur l'aile",kind:"passe",p:.55,goal:1,ok:"Centre, tête, but. La passe est de toi.",ko:"Ton ailier n'avait pas vu venir le ballon."}]},
    {txt:"Ils pressent haut. Tu es dos au jeu, un adversaire collé à toi.",o:[
      {t:"Feinte et pivot",kind:"dribble",p:.5,ok:"Il passe à côté de toi comme une porte qui claque. Ton équipe repart.",ko:"Ballon perdu à quarante mètres de ton but.",them:.5},
      {t:"Remettre en une touche",p:.8,ok:"Le pressing est cassé.",ko:"La remise est trop courte."}]},
    {txt:"Contre-attaque : trois contre deux, le ballon dans tes pieds.",o:[
      {t:"La passe qui tue",kind:"passe",p:.5,goal:1,ok:"Le ballon file entre deux défenseurs. But. Le président applaudit.",ko:"Interceptée. Le contre s'éteint."},
      {t:"Y aller seul",p:.35,goal:1,ok:"Tu frappes, ça rentre. Personne ne s'y attendait.",ko:"Contré."}]}],
  DEF:[
    {txt:"Leur ailier part seul. Il n'y a plus personne derrière toi.",o:[
      {t:"Tacle glissé",kind:"tacle",p:.5,ok:"Tacle propre, ballon récupéré. La tribune applaudit un tacle, c'est rare.",ko:"Trop tard. Il passe, il marque.",them:1},
      {t:"Reculer, le pousser vers la ligne",p:.65,ok:"Il centre dans le vide.",ko:"Il rentre dans l'axe et frappe. But.",them:1}]},
    {txt:"Corner pour vous. Tu montes.",o:[
      {t:"Attaquer le ballon de la tête",p:.35,goal:1,ok:"Ta tête, au premier poteau. But !",ko:"Tu sautes trop tôt."},
      {t:"Rester en couverture",p:.85,ok:"Le contre est bloqué avant de naître.",ko:"Le contre part quand même.",them:.4}]},
    {txt:"Leur avant-centre te provoque, épaule contre épaule, depuis le début du match.",o:[
      {t:"Le suivre partout, sans répondre",p:.7,ok:"Il finit par sortir, agacé. Toi, tu n'as rien dit.",ko:"Il te glisse entre les doigts et frappe : but.",them:1},
      {t:"Lui rendre la monnaie",p:.4,ok:"Il perd son calme et prend un carton jaune.",ko:"C'est toi qui prends le jaune. Vasseur se lève."}]},
    {txt:"Ballon aérien dans ta surface. L'attaquant arrive lancé.",o:[
      {t:"Le dégager de la tête",p:.65,ok:"Dégagement plein axe, loin.",ko:"Tu le manques. But.",them:1},
      {t:"Le presser pour récupérer",kind:"tacle",p:.5,ok:"Tu lui voles le ballon dans les pieds.",ko:"Faute. Penalty.",them:.7}]},
    {txt:"Leur numéro 9, le meilleur joueur du tournoi, file vers le but.",o:[
      {t:"Tacle glissé",kind:"tacle",p:.5,ok:"Tacle parfait. Le président se tourne vers Vasseur.",ko:"Il t'efface. But.",them:1},
      {t:"Le ralentir, attendre l'aide",p:.6,ok:"Sacha revient, vous le prenez à deux. Ballon récupéré.",ko:"Il ne ralentit pas. But.",them:1}]}],
  GB:[
    {txt:"Penalty contre vous.",o:[
      {t:"Lire le tireur et plonger",kind:"save",p:.32,ok:"Arrêté ! Tes défenseurs te sautent dessus.",ko:"Petit filet. Imparable.",them:1},
      {t:"Rester debout jusqu'au dernier moment",p:.22,ok:"Il tente une panenka. Dans tes bras.",ko:"Il te prend à contre-pied.",them:1}]},
    {txt:"Centre aérien dans la foule.",o:[
      {t:"Sortir dans la foule",kind:"aerien",p:.5,ok:"Tu cueilles le ballon au-dessus de toutes les têtes.",ko:"Tu le manques. Tête, but.",them:1},
      {t:"Rester sur ta ligne",p:.55,ok:"La tête est molle, tu bloques.",ko:"Tête à bout portant. But.",them:1}]},
    {txt:"Coup franc contre vous, à vingt mètres.",o:[
      {t:"Placer ton mur et lire la frappe",kind:"fksave",p:.4,ok:"Claquée au-dessus de la barre.",ko:"Lucarne.",them:1},
      {t:"Mur de cinq, et prier",p:.45,ok:"Dans le mur.",ko:"Ça passe au-dessus du mur. But.",them:1}]},
    {txt:"Une passe en retrait de ton défenseur. L'attaquant fonce sur toi.",o:[
      {t:"Relancer au pied, calmement",p:.55,ok:"Petit pont sur l'attaquant, relance propre. Vasseur applaudit, une fois.",ko:"Contré. But.",them:1},
      {t:"Dégager en touche",p:.9,ok:"En touche. Pas beau, mais sûr.",ko:"Ta frappe touche l'attaquant…",them:.5}]},
    {txt:"Un face-à-face dès la dixième minute.",o:[
      {t:"Sortir à sa rencontre",p:.5,ok:"Tu fermes l'angle, il frappe sur toi.",ko:"Il te lobe. But.",them:1},
      {t:"Rester sur ta ligne",p:.4,ok:"Tu détournes du bout des doigts.",ko:"Il place à ras de terre. But.",them:1}]}]
};

/* ============ Les mini-jeux ============ */
// joue le mini-jeu s'il est activé ; sinon (saison rapide, tests, mini-jeux coupés) la chance décide tout de suite
function cfMini(kind,fallback,cb){
  const fb = ()=>cb(chance(fallback));
  if(!kind||ui.quick||typeof document==="undefined"||!document.body) return fb();
  const pen = ["shoot","save","fk","fksave"].includes(kind);
  const pr = pen?(typeof Penalty!=="undefined"&&minisOn("pen")?playMini(kind,null,cfC().m?{name:cfC().m.opp}:null):null):(minisOn("duel")?playDuel(kind):null);
  if(!pr) return fb();
  pr.then(r=>cb(r==null?chance(fallback):!!r));
}

/* ============ Le déroulé ============ */
// chaque étape : scene (texte et choix), match, ou écran propre (essai, nom, proche, poste, fin)
// when : l'étape n'arrive que si la condition est vraie
/** @type {any[]} */
const CF_BEATS = [
  /* ---- Le dimanche de l'essai ---- */
  {id:"essai",k:"essai"},
  {id:"apres",k:"scene",img:"img/terrain.webp",body:c=>({
    but:cfNar("Le filet tremble. Tes coéquipiers d'un jour te sautent dessus. Le coup de sifflet final tombe dans la foulée : 1-0."),
    rate:cfNar(({post:"Le ballon frappe le poteau, revient dans les pieds d'un défenseur, qui dégage loin.",bar:"La barre. Le bruit du ballon sur le métal résonne dans tout le stade.",over:"Le ballon s'envole au-dessus de la barre et rebondit sur le parking.",wide:"Le ballon frôle le poteau et file à côté."})[c.mem.rateHow]||"Le gardien plonge du bon côté. Le ballon s'écrase dans ses gants.")+cfNar("Coup de sifflet final, 0-0. Tu restes au point de penalty, sans bouger."),
    laisse:cfNar("Un grand gaucher prend le ballon. Il frappe au-dessus. Coup de sifflet final, 0-0. Dans la tribune, le carnet se rouvre.")
  })[c.mem.essai],
  ch:c=>c.mem.essai==="but"?[
    {t:"Courir vers la tribune, vers {par}",go:c=>{ c.mem.cel = "par"; cfFx({lien:1}); return `Sous le parapluie, {par} crie ton prénom plus fort que tout le monde. Le recruteur tourne la tête et vous regarde, longtemps.`; }},
    {t:"Montrer ton nom, au dos du maillot, face au recruteur",go:c=>{ c.mem.cel = "show"; cfFx({conf:-3}); return `Le recruteur ne sourit pas. Il écrit quelque chose. Court.`; }},
    {t:"Aller relever le défenseur qui t'a fauché",go:c=>{ c.mem.cel = "fair"; cfFx({conf:5}); return `Le défenseur attrape ta main, surpris. Dans la tribune, le stylo s'arrête une seconde.`; }}
  ]:c.mem.essai==="rate"?[
    {t:"Baisser la tête et sortir",go:c=>{ c.mem.cel = "tete"; return `Tu ramasses ton sac sans regarder personne. Sous le parapluie, {par} ne dit rien et te tend une serviette.`; }},
    {t:"Aller voir le recruteur : « Je le retire quand vous voulez. »",go:c=>{ c.mem.cel = "redemande"; cfFx({conf:8}); return `Il te regarde par-dessus son carnet. « Il n'y a pas de deuxième penalty, ici. » Mais il écrit. Longtemps.`; }},
    {t:"Aller féliciter le gardien",go:c=>{ c.mem.cel = "fair"; cfFx({conf:4}); return c.mem.rateHow&&c.mem.rateHow!=="saved"?`Le gardien te serre la main. « Ça arrive aux meilleurs. Tu reviendras. » Le recruteur a tout vu.`:`Le gardien te serre la main. « Tu l'avais bien tiré, tu sais. » Le recruteur a tout vu.`; }}
  ]:[
    {t:"Aller consoler le grand gaucher",go:c=>{ c.mem.cel = "fair"; cfFx({conf:4}); return `Il pleure un peu, sous la pluie, ça ne se voit pas. Le recruteur, lui, a vu.`; }},
    {t:"Te dire que toi, tu l'aurais mis",go:c=>{ c.mem.cel = "show"; cfFx({conf:-2}); return `Tu le penses très fort. Assez fort pour que ça se lise sur ton visage.`; }},
    {t:"Ramasser le ballon et le rendre à l'arbitre",go:c=>{ c.mem.cel = "tete"; return `Un geste de rien du tout. Personne ne le remarque. Presque personne.`; }}
  ]},
  {id:"nom",k:"nom"},
  {id:"proche",k:"proche"},
  {id:"poste",k:"poste"},
  {id:"nino",k:"scene",body:()=>cfNar("En rangeant ton sac, tu sens qu'on te tire la manche.")+cfSay("nino","« Je m'appelle Nino. Tu peux me signer mon ballon ? Tu vas devenir pro, je le sais. »")+cfNar("Le ballon est dégonflé. Le feutre ne marche presque plus."),
    ch:()=>[
      {t:"Signer, et écrire : « Pour Nino, futur pro »",go:c=>{ c.mem.nino = "mot"; return `Nino lit trois fois, en articulant chaque mot. Puis il repart en courant, le ballon serré contre lui.`; }},
      {t:"Signer vite, {par} attend sous la pluie",go:c=>{ c.mem.nino = "vite"; return `Un gribouillis. Nino le regarde quand même comme un trésor.`; }},
      {t:"« Je suis personne, moi. » Et signer quand même",go:c=>{ c.mem.nino = "modeste"; return `« Pas encore », dit Nino, très sérieux.`; }}
    ]},

  /* ---- Saison 1 : le centre ---- */
  {id:"s1",sn:1,k:"scene",img:"img/vestiaire.webp",
    body:()=>cfNar("Le centre du Racing, c'est un bâtiment gris au bout d'un parking, avec vue sur trois terrains et sur la mer, quand il ne pleut pas. Le premier matin, Vasseur réunit les nouveaux dans le vestiaire.")
      +cfSay("vasseur","« Une seule règle, et je ne la répéterai pas. Dans trois ans, le club signe un contrat pro. Un seul par poste. » Il désigne quelqu'un au fond du vestiaire, puis toi. « Vous deux, vous jouez au même poste. Faites le calcul. »")
      +cfNar("Sacha Lenoir. Un an de centre d'avance, des crampons usés jusqu'à la corde, et un regard qui te mesure de la tête aux pieds."),
    ch:()=>[
      {t:"Tendre la main : « Que le meilleur gagne. »",go:()=>{ cfC().mem.accueil = "main"; cfFx({sacha:1}); return `Sacha hésite, puis serre ta main. Fort.`+cfMark("Sacha"); }},
      {t:"« Le calcul est vite fait. »",go:()=>{ cfC().mem.accueil = "defi"; cfFx({sacha:-1}); return `Quelques rires dans le vestiaire. Sacha sourit. Pas gentiment.`+cfMark("Sacha"); }},
      {t:"Ne rien dire, et regarder ailleurs",go:()=>{ cfC().mem.accueil = "rien"; return `Vasseur passe à la suite. Sacha, non : tu sens son regard jusqu'à la fin de la réunion.`; }}
    ]},
  {id:"nuit",sn:1,k:"scene",body:()=>cfNar("Première nuit à l'internat. Les murs sont fins. Dans la chambre d'à côté, quelqu'un pleure, la tête dans l'oreiller pour ne pas faire de bruit.","Tu reconnais la voix. C'est Sacha."),
    ch:()=>[
      {t:"Frapper doucement à la porte",go:c=>{ c.mem.nuit = "porte"; cfFx({sacha:2}); return `Sacha ouvre, les yeux rouges. Vous parlez jusqu'à deux heures du matin, de chez vous, et de ce que Sacha a laissé là-bas il y a un an. « La mer, au début, ça console. Après, plus du tout. » Au petit déjeuner, Sacha te garde une place.`+cfMark("Sacha"); }},
      {t:"Mettre tes écouteurs et dormir",go:c=>{ c.mem.nuit = "rien"; return `Le lendemain, Sacha a les yeux gonflés et ne dit rien. Toi non plus.`; }},
      {t:"Le raconter aux autres au petit déjeuner",go:c=>{ c.mem.nuit = "moque"; cfFx({sacha:-3,conf:-1}); return `Tout le monde rit. Sacha pose son plateau et sort sans un mot. Ce rire-là te suivra.`+cfMark("Sacha"); }}
    ]},
  {id:"ecole",pool:"s1",sn:1,k:"scene",body:()=>cfNar("Octobre. Le lycée partenaire du centre convoque les familles. Tes notes chutent : tu t'endors en cours, après l'entraînement du matin.")
      +cfSay("par","« Le foot, c'est peut-être. Le bac, c'est sûr. Je ne te demande pas de choisir. Je te demande de ne pas lâcher. »"),
    ch:()=>[
      {t:"Promettre de tenir les deux",go:c=>{ c.mem.ecole = "garde"; cfFx({conf:-2,lien:1}); return "Des fiches de révision dans le bus, des exercices à minuit. Vasseur te trouve fatigué. Tu ne dis pas pourquoi."; }},
      {t:"Tout miser sur le foot",go:c=>{ c.mem.ecole = "lache"; cfFx({conf:3,lien:-1}); return "Tu ne rouvres plus tes cahiers. Sur le terrain, ça se voit. À la maison aussi."; }},
      {t:"Demander à Vasseur d'aménager tes horaires",go:c=>{ c.mem.ecole = "vasseur"; cfFx({conf:1}); return cfSay("vasseur","« Personne ne me l'avait jamais demandé. » Il soupire. « Le mardi et le jeudi après-midi. Pas un de plus. »"); }}
    ]},
  {id:"capitaine",pool:"s1",sn:1,k:"scene",body:c=>cfNar("Novembre. Les U17 élisent leur capitaine. Bulletin secret, un papier plié dans une boîte à chaussures.")
      +(c.sacha>=1?cfSay("sacha","« Tu votes pour qui ? Moi, j'ai mis ton nom. »"):cfNar("Sacha a déjà glissé son papier. Tout le monde pense que Sacha va gagner.")),
    ch:()=>[
      {t:"Écrire ton propre nom",go:c=>{ c.mem.cap = "moi"; cfFx({conf:-1,sacha:-1}); return "Le brassard est pour toi, à une voix près. La tienne. Tu ne le diras jamais à personne."; }},
      {t:"Écrire « Sacha »",go:c=>{ c.mem.cap = "sacha"; cfFx({sacha:2}); return "Sacha prend le brassard, à une voix près. La tienne. Sacha ne le saura jamais. Ou peut-être que si."+cfMark("Sacha"); }},
      {t:"Écrire le nom de Bilal, le défenseur que personne ne remarque",go:c=>{ c.mem.cap = "bilal"; cfFx({conf:3}); return "Bilal reçoit trois voix et ne comprend pas d'où elles viennent. Vasseur, qui dépouille les bulletins, reconnaît ton écriture."; }}
    ]},
  {id:"genou",pool:"s1",sn:1,k:"scene",body:()=>cfNar("La veille des tests physiques de mi-saison, ton genou gauche se met à gonfler. Rien de terrible. Assez pour te faire boiter dans l'escalier de l'internat."),
    ch:()=>[
      {t:"Faire les tests quand même, sans rien dire",go:c=>{ if(chance(.5)){ c.mem.genou = "cache"; cfFx({conf:3}); return "Tu serres les dents et tu bats ton record au sprint. Le genou, lui, s'en souviendra."; } c.mem.genou = "pire"; cfFx({conf:-4}); c.perf = Math.max(0,c.perf-1); return "Tu t'écroules au troisième sprint. Le kiné ne dit rien. Son regard suffit."; }},
      {t:"Aller voir le kiné",go:c=>{ c.mem.genou = "kine"; cfFx({conf:1}); return "Trois jours de glace. Dans le carnet de Vasseur : « Connaît son corps. » Sacha termine premier des tests."; }},
      {t:"Appeler {par}",go:c=>{ c.mem.genou = "par"; cfFx({lien:1,conf:1}); return cfSay("par","« Écoute ton corps. Pas ton orgueil. »")+"Le lendemain matin, tu vas voir le kiné."; }}
    ]},
  {id:"appel",sn:1,k:"scene",body:()=>cfNar("Un mardi soir, ton téléphone vibre. C'est {par}.")
      +cfSay("par","« Tout va bien, ne t'inquiète pas. J'ai trouvé un deuxième boulot, le soir, pour payer le train et tes crampons. Ça ne change rien. Toi, tu te concentres sur le foot. »")
      +cfNar("Derrière sa voix, tu entends le bip d'une caisse enregistreuse. {Pr} a l'air fatigué{e}."),
    ch:()=>[
      {t:"« Arrête ça tout de suite. Je me débrouillerai. »",go:c=>{ c.mem.appel = "refuse"; cfFx({lien:1}); return `« Tu te débrouilleras à vingt ans. Là, tu en as seize. » {Pr} raccroche en riant. Toi, tu ne ris pas.`; }},
      {t:"« Je te le rendrai. Au centuple, je te le promets. »",go:c=>{ c.mem.appel = "promesse"; cfFx({lien:2}); return `Un silence au bout du fil. Puis : « D'accord. Je note. »`+cfMark("{Par}"); }},
      {t:"« Je dois y aller, il y a vidéo. » Raccrocher vite",go:c=>{ c.mem.appel = "vite"; cfFx({lien:-1}); return `Il n'y avait pas de séance vidéo, ce soir-là. Tu le sais. {Pr} aussi, sans doute.`; }}
    ]},
  {id:"m1",sn:1,k:"match",img:"img/match.webp",title:"U17 · face au Stade Rochebrune",opp:"Stade Rochebrune U17",acts:[0,1],mins:[67,81],
    intro:c=>c.conf>=58?"Vasseur te titularise. Sacha est sur le banc, les bras croisés.":"Vasseur aligne Sacha d'entrée. Tu regardes la première heure depuis le banc, les mains entre les genoux. 60e minute : « Échauffe-toi. »"},
  {id:"v1",sn:1,k:"verdict",img:"img/conference.webp",
    body:c=>cfNar("Fin de la première saison. Le bureau de Vasseur sent le café froid. Le carnet est ouvert devant lui.")
      +cfSay("vasseur",({redemande:"« Tu sais pourquoi tu es ici ? Pas pour ton penalty raté. Pour ce que tu m'as dit après. Ça, je l'ai écrit en premier, avant ton nom. »",
        fair:"« Le jour de l'essai, ton premier geste après le coup de sifflet, ça a été pour quelqu'un d'autre. Je l'ai écrit. Ici, je n'oublie rien. »",
        show:"« Ton nom au dos du maillot, je l'ai vu, le jour de l'essai. Maintenant, montre-moi ce qu'il y a devant. »",
        par:"« Le jour de l'essai, tu as couru vers {par}, pas vers moi. J'ai trouvé ça bien. »",
        tete:"« Le jour de l'essai, tu as quitté le terrain sans un mot. J'ai failli ne pas te prendre. »"})[c.mem.cel]||"« Bon. »")
      +cfSay("vasseur",cfRanking(c)),
    ch:()=>[
      {t:"« Qu'est-ce que je dois travailler ? »",go:()=>{ cfFx({conf:2}); return `« Tout. Mais surtout ce qu'il y a là-dedans. » Il se tapote la tempe.`; }},
      {t:"« L'an prochain, je serai devant. »",go:()=>`« On verra. » Il referme le carnet.`},
      {t:"Ne rien dire",go:()=>`Il attend. Tu attends. Il finit par sourire, à peine. « Bonnes vacances. »`}
    ]},

  /* ---- Saison 2 : le doute ---- */
  {id:"depanne",pool:"s2",sn:2,k:"scene",img:"img/tunnel.webp",
    body:()=>cfNar("Septembre. L'équipe réserve a trois blessés. Vasseur t'arrête dans le couloir.")
      +cfSay("vasseur",`« Ce week-end, la réserve a besoin de quelqu'un ${CF_AUTRE[p.pos]}. Ce n'est pas ton poste. Je pensais à toi. »`),
    ch:()=>[
      {t:"Accepter sans discuter",go:c=>{ c.mem.poste = "oui"; cfFx({conf:6}); return `Tu joues quatre-vingt-dix minutes à un poste que tu ne connais pas. Tu cours partout, tu rates beaucoup. Dans le bus du retour, Vasseur s'assoit à côté de toi. Il ne dit rien. Mais il s'assoit là.`; }},
      {t:`« Je suis ${CF_POSTE[p.pos]}. Je joue à mon poste. »`,go:c=>{ c.mem.poste = "non"; cfFx({conf:-4}); return `« Très bien. » C'est Sacha qui y va. Et Sacha y est bon.`; }},
      {t:"Proposer Sacha à ta place",go:c=>{ c.mem.poste = "sacha"; cfFx({conf:-2,sacha:-1}); return `Vasseur te regarde longtemps. « Intéressant. » Sacha y va. Et Sacha apprend de qui vient l'idée.`; }}
    ]},
  {id:"ferri",pool:"s2",sn:2,k:"scene",img:"img/vestiaire.webp",body:()=>cfNar("Octobre. Vasseur t'envoie t'entraîner une semaine avec l'équipe pro. Dans le vestiaire, Dario Ferri, trente-trois ans, capitaine, quatre cents matchs, te regarde arriver.")
      +cfSay("ferri","« C'est toi, le petit du centre ? Va me chercher un café. Deux sucres. »"),
    ch:()=>[
      {t:"Aller chercher le café",go:c=>{ c.mem.ferri = "cafe"; cfFx({conf:2}); return cfSay("ferri","« Bien. Maintenant, tu ne le refais plus jamais. Ici, tu es un joueur. »")+"Le soir, il reste une heure avec toi pour te montrer comment te placer sur les corners."; }},
      {t:"« Je suis là pour jouer, pas pour servir le café. »",go:c=>{ c.mem.ferri = "non"; if(chance(.5)){ cfFx({conf:3}); return "Silence dans le vestiaire. Puis Ferri éclate de rire. « Enfin un qui a du caractère. »"; } cfFx({conf:-3}); return "Il ne te parle plus de la semaine. À l'entraînement, il ne te passe plus le ballon."; }},
      {t:"Faire semblant de ne pas entendre",go:c=>{ c.mem.ferri = "rien"; return "Ferri hausse les épaules et demande à quelqu'un d'autre. Tu passes une semaine invisible."; }}
    ]},
  {id:"reseaux",pool:"s2",sn:2,k:"scene",img:"img/medias.webp",body:()=>cfNar("Un soir de novembre, après une défaite en réserve, une vidéo tourne : ton raté devant le but, au ralenti, avec une musique de cirque. Quarante mille vues. Les commentaires sont pires que la vidéo."),
    ch:()=>[
      {t:"Répondre à ceux qui t'insultent",go:c=>{ c.mem.reseaux = "repond"; cfFx({conf:-4}); return "Tu réponds à un, puis à dix. À deux heures du matin, Vasseur t'envoie un seul message : « Pose ce téléphone. »"; }},
      {t:"Couper ton téléphone pour la semaine",go:c=>{ c.mem.reseaux = "coupe"; cfFx({conf:2,lien:-1}); return "Sept jours sans écran. Tu dors mieux. Tu rates moins. {Par} a essayé de t'appeler quatre fois."; }},
      {t:"La reposter toi-même : « Promis, je m'entraîne »",go:c=>{ c.mem.reseaux = "rit"; cfFx({conf:1}); return c.mem.nino?"Les moqueries tournent aux encouragements. Un compte inconnu commente : « Futur pro. » Sa photo de profil : un ballon dégonflé.":"Les moqueries tournent aux encouragements. Même Sacha partage la vidéo, avec un seul mot : « Respect. »"; }}
    ]},
  {id:"agent",sn:2,k:"scene",img:"img/argent.webp",body:()=>cfNar("Après un match de la réserve, un homme en costume trop bleu t'attend sur le parking. Il te tend une carte.")
      +cfSay("kessler","« Le Racing va te laisser moisir trois ans pour un seul contrat. Moi, j'ai un club en Belgique qui te veut maintenant. Signe avec moi, et demain tu as des crampons neufs. Tout le monde le fait. »"),
    ch:()=>[
      {t:"Signer avec Kessler",go:c=>{ c.mem.agent = "oui"; cfFx({conf:-6}); return `Les crampons arrivent le lendemain, dans une boîte noire. Le surlendemain, Vasseur te demande qui te les a offerts. Il connaît déjà la réponse.`; }},
      {t:"Refuser poliment",go:c=>{ c.mem.agent = "non"; return `Il range sa carte sans se vexer. « Tu as mon numéro. Un jour, tu en auras besoin. »`; }},
      {t:"« J'en parle d'abord à {mpar}. »",go:c=>{ c.mem.agent = "par"; cfFx({lien:1}); return cfSay("par","« Un homme qui te promet tout sur un parking, ce n'est pas un agent. C'est un vendeur. »")+`Tu ne rappelles jamais Kessler.`; }}
    ]},
  {id:"couvre",sn:2,k:"scene",body:()=>cfNar("Une heure du matin. On gratte à ta fenêtre du rez-de-chaussée. Sacha, les cheveux trempés, de retour d'une soirée en ville, bien après le couvre-feu.")
      +cfSay("sacha","« Le veilleur a vu ma silhouette. Demain, Vasseur va demander. Dis que j'étais avec toi, à réviser. S'il te plaît. »"),
    ch:()=>[
      {t:"Mentir pour Sacha",go:c=>{ c.mem.couvre = "ment"; cfFx({sacha:2}); return `Le lendemain, tu mens les yeux dans les yeux. Vasseur hoche la tête et passe à autre chose. Un peu trop vite.`+cfMark("Sacha"); }},
      {t:"Refuser : « Je ne mentirai pas pour toi. »",go:c=>{ c.mem.couvre = "non"; cfFx({sacha:-1}); return `Sacha passe par une autre fenêtre. Le lendemain : deux semaines sans match. Sacha ne te parle plus pendant un mois.`; }},
      {t:"Tout dire à Vasseur avant qu'il demande",go:c=>{ c.mem.couvre = "balance"; cfFx({sacha:-3,conf:3}); return `Vasseur t'écoute jusqu'au bout. « Je ne t'avais rien demandé. » Sacha prend deux semaines de suspension, et tout le centre sait qui a parlé.`+cfMark("Sacha"); }}
    ]},
  {id:"m2",sn:2,k:"match",img:"img/tribunes.webp",title:"U19 · le derby face à l'Olympique Valmont",opp:"Olympique Valmont U19",acts:[2,3],mins:[58,79],
    intro:c=>c.conf>=55?"Cette fois, c'est toi qui commences. Sacha est sur le banc et ne te regarde pas.":c.mem.couvre==="balance"?"Sacha revient de suspension, et Vasseur l'aligne d'entrée. Tu entres à l'heure de jeu.":"Sacha commence. Tu entres à l'heure de jeu, comme souvent."},
  {id:"v2",sn:2,k:"verdict",img:"img/conference.webp",
    body:c=>cfNar("Fin de la deuxième saison. Même bureau, même café froid. Cette fois, Vasseur ne te fait pas asseoir.")
      +cfSay("vasseur",c.mem.agent==="oui"?"« Tes crampons sont jolis. Kessler a bon goût. Mauvais conseils, mais bon goût. »":c.mem.poste==="oui"?"« Le week-end en réserve, à un poste qui n'est pas le tien. C'est là que j'ai compris que tu voulais vraiment être ici. »":c.mem.couvre==="balance"?"« Tu as dit la vérité sur Sacha. C'était juste. Je ne suis pas sûr que c'était bien. »":"« Une saison de plus. Il en reste une. »")
      +(cfC().conf<37?cfSay("vasseur","« Je vais être honnête avec toi, parce que personne ne l'a été avec moi à ton âge. Le club ne te garde pas pour la dernière année. »"):cfSay("vasseur",cfRanking(c))),
    ch:c=>c.conf<37?[{t:"Rendre ton badge",go:c=>{ c.out = "renvoye"; return ""; }}]:[
      {t:"« Je serai là. »",go:()=>`« Tout le monde dit ça. » Il ouvre la porte. « Prouve-le. »`},
      {t:"« Et Sacha, vous lui dites la même chose ? »",go:()=>{ cfFx({conf:1}); return `Il sourit pour la première fois depuis deux ans. « Mot pour mot. »`; }}
    ]},

  /* ---- Saison 3 : le contrat ---- */
  {id:"s3",sn:3,k:"scene",img:"img/tribunes.webp",
    body:c=>cfNar("La dernière année. Au centre, on ne parle que de ça : le dernier match de la saison, contre les U19 de l'Atlético Albaredo, venus d'Espagne pour un tournoi. Le président sera en tribune. Le contrat se jouera ce jour-là.")
      +(c.sacha>=2?cfSay("sacha","« Quoi qu'il arrive en juin, toi et moi, ça ne change rien. D'accord ? »"):c.sacha<=-2?cfNar("Dans le couloir, Sacha te croise sans te regarder. Ça fait des mois que c'est comme ça."):cfSay("sacha","« En juin, alors. »")),
    ch:c=>[
      c.sacha>=2?{t:"« D'accord. »",go:()=>`Vous vous tapez dans la main, comme le premier jour.`}:{t:"Hocher la tête",go:()=>`Chacun repart de son côté du couloir.`},
      {t:"Aller t'entraîner, ce soir encore",go:()=>{ cfFx({conf:2}); return `Le terrain est vide. Tu tires jusqu'à ce que les projecteurs s'éteignent. Quelqu'un, derrière la vitre du bureau, ne les a pas éteints tout de suite.`; }}
    ]},
  {id:"offre",pool:"s3",sn:3,k:"scene",img:"img/mercato.webp",body:c=>cfNar("Janvier. Un appel d'un numéro inconnu : le directeur sportif de l'Olympique Valmont, le plus grand club du pays. Il te propose un contrat pro, tout de suite. Signer, c'est quitter le Racing avant le match du contrat. Et laisser la place à Sacha.")
      +(c.mem.agent==="oui"?cfSay("kessler","« Je t'avais dit que je m'occupais de toi. Signe. »"):""),
    ch:()=>[
      {t:"Signer à Valmont",go:c=>{ c.out = "valmont"; cfFx({sacha:1}); return "Tu signes sur le capot d'une voiture, sur le parking du centre. Quand tu relèves la tête, Vasseur est à la fenêtre de son bureau. Il ne fait aucun geste."; }},
      {t:"Refuser : tu finis ce que tu as commencé ici",go:c=>{ c.mem.offre = "refuse"; cfFx({conf:5}); return "Tu raccroches. Le lendemain, Vasseur pose une main sur ton épaule dans le couloir, sans s'arrêter. Il est au courant."; }},
      {t:"En parler à Vasseur",go:c=>{ c.mem.offre = "vasseur"; cfFx({conf:3}); return cfSay("vasseur","« C'est une bonne offre. Je ne peux rien te promettre de mieux. » Il regarde par la fenêtre. « Mais si tu restes, tu sauras ce que tu vaux. »")+"Tu ne rappelles pas Valmont."; }}
    ]},
  {id:"cheville",pool:"s3",sn:3,k:"scene",body:()=>cfNar("Une semaine avant le match du contrat. À l'entraînement, Sacha retombe mal après un duel avec toi. La cheville. Sacha se relève en grimaçant et te fait signe de te taire.")
      +cfSay("sacha","« Ne dis rien. Si Vasseur l'apprend, je ne joue pas samedi. Et si je ne joue pas, c'est fini pour moi. »"),
    ch:()=>[
      {t:"Garder le secret",go:c=>{ c.mem.cheville = "cache"; cfFx({sacha:2}); return "Sacha s'entraîne en serrant les dents, la cheville bandée sous la chaussette. Tu fais semblant de ne rien voir."+cfMark("Sacha"); }},
      {t:"Le dire à Vasseur",go:c=>{ c.mem.cheville = "dit"; cfFx({conf:2,sacha:-3}); return "Vasseur envoie Sacha passer une radio. Entorse. Sacha jouera quand même, la cheville strappée. Et ne te regarde plus."+cfMark("Sacha"); }},
      {t:"Convaincre Sacha d'aller voir le kiné",go:c=>{ c.mem.cheville = "kine"; cfFx({sacha:1,conf:1}); return "Il te faut une heure. Le kiné strappe la cheville et promet de ne rien dire. Ce soir-là, Sacha te regarde autrement."; }}
    ]},
  {id:"veille",sn:3,k:"scene",body:c=>cfNar("La veille du match, à 21 heures, ton téléphone sonne. Un numéro que tu ne connais pas. C'est l'hôpital, puis la voix de {par}.")
      +cfSay("par",(c.mem.appel==="promesse"?"« Ce n'est rien, je te jure. Un malaise au deuxième boulot, ils me gardent cette nuit pour voir. Surtout, tu ne viens pas. Tu m'as promis le centuple, tu te souviens ? Alors demain, tu joues. »":"« Ce n'est rien, je te jure. Un petit malaise, ils me gardent cette nuit pour voir. Surtout, tu ne viens pas. Tu as ton match. »")),
    ch:c=>[
      {t:"Prendre le dernier train, malgré le couvre-feu",go:c=>{ c.mem.veille = "train"; cfFx({lien:2,conf:-3}); return `Tu arrives à minuit. {Par} dort, un bracelet en plastique au poignet. Tu restes jusqu'à cinq heures sur la chaise à côté du lit. Le premier train du matin te ramène au centre avec trois heures de sommeil.`; }},
      {t:"Rester, et appeler toutes les heures",go:c=>{ c.mem.veille = "appels"; return `22 heures, minuit, 2 heures. À la troisième fois, une infirmière répond : « {Pr} dort. Vous devriez faire pareil. »`; }},
      ...(c.sacha>=2?[{t:"Demander à Sacha de te couvrir pour partir",go:c=>{ c.mem.veille = "sacha"; cfFx({lien:2,sacha:1}); return `Sacha ne pose aucune question. « Vas-y. Je dirai que tu dors. » La veille du match qui doit choisir entre vous deux.`+cfMark("Sacha"); }}]:[])
    ]},
  {id:"m3",sn:3,k:"match",img:"img/tirs-au-but.webp",final:true,title:"Le match du contrat · face à l'Atlético Albaredo",opp:"Atlético Albaredo U19",acts:[4,"dil"],mins:[14,88],
    intro:c=>[
      "Le président est en tribune, une écharpe autour du cou. Vasseur a fait un choix que personne n'attendait : "+(p.pos==="GB"?"une mi-temps chacun dans les buts, et toi d'abord.":"toi et Sacha, sur le terrain ensemble, « pour vous voir l'un à côté de l'autre »."),
      c.mem.nino==="mot"?"Dans un coin de la tribune, un gamin brandit une pancarte en carton : ton prénom, mal écrit, et « FUTUR PRO ». C'est Nino.":c.mem.nino?"Dans un coin de la tribune, un gamin agite un ballon dégonflé. Il te faut une seconde pour le reconnaître : Nino.":"",
      c.mem.veille==="train"?"Tes jambes pèsent trois heures de sommeil.":"",
      c.mem.cheville==="cache"?"À l'échauffement, Sacha boite légèrement. Personne ne le remarque, à part toi.":""
    ].filter(Boolean).join(" ")},
  {id:"v3",sn:3,k:"verdict",img:"img/conference.webp",
    body:c=>{ cfDecide(c); return cfNar(c.out==="valmont"?"Le samedi du match, tu regardes depuis la tribune, une écharpe de Valmont pliée dans ton sac. Le lundi, tu viens rendre ton badge. Vasseur t'attend dans son bureau.":"Le lendemain matin, Vasseur te convoque. Le président est là, debout près de la fenêtre. Le carnet est fermé.")+cfVerdictHtml(c); },
    ch:()=>[{t:"Voir le film de ces trois ans",primary:true,go:()=>""}]},
  {id:"fin",k:"fin"}
];

/* ============ Le classement de Vasseur ============ */
// ton dossier contre celui de Sacha : la confiance du coach et tes matchs, contre une saison solide et régulière
const cfMine = c=>c.conf+c.perf*5;
const cfSacha = c=>52+(c.season||1)*3+(c.mem.couvre==="balance"?-6:0)+(c.mem.poste==="non"||c.mem.poste==="sacha"?4:0);
function cfRanking(c){
  const d = cfMine(c)-cfSacha(c);
  return d>=8?"« Pour l'instant, tu passes devant. Nettement. Sacha le sait. »":d>=0?"« Pour l'instant, tu passes devant Sacha. D'un cheveu. Un cheveu, ça se perd. »":d>=-8?"« Pour l'instant, Sacha est devant toi. Pas de beaucoup. »":"« Pour l'instant, Sacha est loin devant. Il va falloir que quelque chose change. »";
}
// le verdict final : qui signe, et à quel prix
function cfDecide(c){
  if(c.out) return c.out;
  const M = c.mem.m3||{us:0,them:0}, win = M.us>M.them;
  const mine = cfMine(c)+(c.mem.dil==="moi"&&c.mem.penOk?10:0)+(win?6:0);
  const sacha = cfSacha(c)+(c.mem.dil==="sacha"&&c.mem.penOk?12:0);
  if(c.mem.dil==="sacha"&&c.sacha>=3&&c.conf>=50) c.out = "double";
  else if(mine>=sacha) c.out = c.sacha<=-2?"prix":"signe";
  else c.out = c.mem.agent==="oui"?"exil":"bas";
  return c.out;
}
const CF_ENDS = {
  double:{n:"Deux contrats",d:"Personne ne perd sa place.",hint:"Il existe une fin où personne ne perd sa place."},
  signe:{n:"Pro",d:"Le contrat est pour toi.",hint:"Signer pro, tout simplement. Ça se mérite."},
  prix:{n:"Le prix",d:"Tu signes. Sacha ne te serre pas la main.",hint:"Il existe une victoire qui a un goût amer."},
  bas:{n:"L'autre chemin",d:"Le contrat est pour Sacha. Tu repars d'en bas.",hint:"Perdre le contrat n'est pas la fin de l'histoire."},
  exil:{n:"L'exil",d:"Kessler t'a trouvé un club en Belgique. Tu n'y connais personne.",hint:"Un agent t'a laissé sa carte, un jour, sur un parking."},
  valmont:{n:"Le raccourci",d:"Tu as signé à l'Olympique Valmont avant le match du contrat.",hint:"Un jour de janvier, un grand club appelle. Tu peux décrocher."},
  renvoye:{n:"Le badge",d:"Le centre ne te garde pas pour la dernière année.",hint:"Certains ne voient jamais la troisième saison."}
};
function cfVerdictHtml(c){
  const pen = c.mem.dil==="sacha"?(c.mem.penOk?"Le penalty que tu as laissé à Sacha":"Le penalty que tu as laissé à Sacha, même raté"):"";
  const back = c.mem.veille==="train"?"« Je sais où tu étais, la veille. Le veilleur a trouvé ta chambre vide. » Un silence. « J'aurais fait pareil. »":c.mem.veille==="sacha"?"« Sacha m'a dit que tu dormais, la veille du match. Sacha ment très mal. »":c.mem.couvre==="ment"?"« La nuit du couvre-feu, tu as menti pour Sacha. Je l'ai su le jour même. Je voulais voir si tu tiendrais. Tu as tenu. »":"";
  const lines = {
    double:[pen?`« ${pen}, le président l'a vu. Moi aussi. »`:"« Le président a vu le match. Moi aussi. »","« Je suis allé le voir hier soir. J'ai dit que je ne choisirais pas. » Il pousse deux contrats sur le bureau. « Il a fini par céder. Deux contrats. Ne me faites pas regretter ça. »"],
    signe:["« Le club te propose un contrat professionnel de trois ans. »",c.sacha>=1?"« Sacha a déjà été prévenu. Sacha m'a demandé de te dire bravo. »":"« Sacha a été prévenu ce matin. »"],
    prix:["« Le club te propose un contrat professionnel de trois ans. »","« Sacha a été prévenu ce matin. Sacha a demandé à ne pas te croiser avant de partir. »"],
    bas:["« Le contrat est pour Sacha. Ce n'est pas une question de talent. C'est une question de moment. »",c.mem.cel==="redemande"||c.mem.cel==="fair"?"Il ouvre son carnet à la toute première page. « J'ai appelé un ami, en troisième division. Il te prend à l'essai lundi. Le jour de ton essai ici, tu m'avais montré quelque chose. Montre-le-lui. »":"« Les petits clubs recrutent tout l'été. Ne lâche pas. »"],
    exil:["« Le contrat est pour Sacha. »","Ton téléphone vibre pendant qu'il parle. Kessler : « Belgique, lundi. Tu pars dimanche. » Vasseur a vu l'écran. « Fais attention à toi. »"],
    valmont:["« Valmont. Le plus grand club du pays. » Il ne lève pas les yeux du carnet.","« Sacha a joué le match du contrat. Sacha signe. Toi, tu as choisi de ne jamais savoir ce que tu valais ici. Bonne chance là-bas. Sincèrement. »"],
    renvoye:[]
  }[c.out];
  return (back?cfSay("vasseur",back):"")+lines.map(l=>cfSay("vasseur",l)).join("");
}

/* ============ Le film et la fin ============ */
// les plans du film : les moments que tu as choisis, avec les mots des gens qui les ont vécus
function cfFilm(c){
  const P = cfPar(), F = [];
  F.push({a:"16 ans",t:{but:"Un dimanche de pluie. Un penalty. Le filet qui tremble.",rate:"Un dimanche de pluie. Un penalty raté.",laisse:"Un dimanche de pluie. Un penalty que tu n'as pas tiré."}[c.mem.essai],
    q:c.mem.cel==="redemande"?["vasseur","« Personne ne m'avait jamais redemandé un penalty. »"]:c.mem.cel==="par"?["par","« Tu as couru vers moi. Pas vers le recruteur. Vers moi. »"]:["vasseur","« J'ai écrit ton nom en bas de la page. »"]});
  if(c.mem.nino==="mot") F.push({a:"16 ans",t:"Un ballon dégonflé, un feutre presque vide.",q:["nino","« Pour Nino, futur pro. Je l'ai encore. »"]});
  if(c.mem.nuit==="porte") F.push({a:"16 ans",t:"La première nuit. Une porte, deux heures du matin.",q:["sacha","« Sans toi, j'aurais fait mes valises cette nuit-là. »"]});
  if(c.mem.nuit==="moque") F.push({a:"16 ans",t:"Un petit déjeuner. Un rire de trop.",q:["sacha","« Tu as oublié. Moi, non. »"]});
  if(c.mem.appel==="promesse") F.push({a:"16 ans",t:"Un mardi soir, le bip d'une caisse enregistreuse.",q:["par","« Au centuple. Je note. »"]});
  if(c.mem.poste==="oui") F.push({a:"17 ans",t:"Un bus de nuit, au retour d'un match à un poste qui n'était pas le tien.",q:["vasseur","« Je me suis assis à côté de toi. C'était ma façon de le dire. »"]});
  if(c.mem.agent==="par") F.push({a:"17 ans",t:"Une carte de visite, jetée dans une poubelle de parking.",q:["par","« Ce n'est pas un agent. C'est un vendeur. »"]});
  if(c.mem.couvre==="ment") F.push({a:"17 ans",t:"Une heure du matin, une fenêtre, un mensonge.",q:["sacha","« Tu as tenu. Je ne l'ai jamais oublié. »"]});
  if(c.mem.couvre==="balance") F.push({a:"17 ans",t:"La vérité, dite avant qu'on la demande.",q:["sacha","« Tu avais raison. Je te déteste quand même. »"]});
  if(c.mem.veille==="train"||c.mem.veille==="sacha") F.push({a:"18 ans",t:"Un hôpital, minuit, une chaise en plastique.",q:["par","« Tu étais là. Je dormais, mais je le savais. »"]});
  if(c.mem.cap==="sacha") F.push({a:"16 ans",t:"Un papier plié dans une boîte à chaussures.",q:["sacha","« Une voix d'écart. J'ai toujours su que c'était la tienne. »"]});
  if(c.mem.ecole==="garde") F.push({a:"16 ans",t:"Des fiches de révision dans un bus de nuit.",q:["par","« Je ne te demandais pas de choisir. Juste de ne pas lâcher. »"]});
  if(c.mem.ferri==="cafe") F.push({a:"17 ans",t:"Un café, deux sucres, dans le vestiaire des pros.",q:["ferri","« Ici, tu es un joueur. »"]});
  if(c.mem.cheville==="cache") F.push({a:"18 ans",t:"Une cheville bandée sous une chaussette. Un secret.",q:["sacha","« Tu n'as rien dit. Je te le dois. »"]});
  if(c.out==="valmont") F.push({end:1,a:"18 ans",t:"Un contrat signé sur le capot d'une voiture.",q:["vasseur","« Tu ne sauras jamais ce que tu valais ici. »"]});
  if(c.mem.dil) F.push({end:1,a:"18 ans",t:c.mem.dil==="moi"?(c.mem.penOk?"88e minute. Le ballon dans tes mains, puis au fond des filets.":"88e minute. Le ballon dans tes mains. Le poteau."):(c.mem.penOk?"88e minute. Tu tends le ballon à Sacha. Le filet tremble.":"88e minute. Tu tends le ballon à Sacha. Le gardien plonge du bon côté."),
    q:c.mem.dil==="sacha"?["sacha","« Personne n'avait jamais fait ça pour moi. »"]:["vasseur","« Le président a regardé ce penalty debout. »"]});
  if(c.out==="renvoye") F.push({end:1,a:"17 ans",t:"Un badge rendu à l'accueil. Le parking gris, une dernière fois.",q:["par","« On rentre. Je t'ai fait des pâtes. »"]});
  // sept images au plus : le début et la fin restent toujours, les souvenirs du milieu suivent l'ordre des âges
  const end = F.filter(x=>x.end), mid = F.filter(x=>!x.end).slice(0,7-end.length);
  return mid.map((x,i)=>({x,i})).sort((u,v)=>parseInt(u.x.a)-parseInt(v.x.a)||u.i-v.i).map(o=>o.x).concat(end);
}
// et aujourd'hui : ce que sont devenus les gens que tu as croisés
function cfToday(c){
  const P = cfPar(), out = c.out, pro = ["signe","prix","double"].includes(out), L = [];
  if(out==="valmont") L.push("Sacha a signé au Racing. Vous vous croisez deux fois par saison, en championnat. Sacha ne te serre jamais la main avant le match. Toujours après.");
  else if(out==="double") L.push("Sacha et toi partagez encore la même chambre lors des déplacements de l'équipe pro.");
  else if(pro) L.push(out==="prix"?"Sacha joue en deuxième division. Vous ne vous êtes plus jamais parlé.":c.sacha>=1?"Sacha joue en deuxième division. Vous vous écrivez avant chaque match.":"Sacha joue en deuxième division. Tu suis ses résultats, sans le dire à personne.");
  else if(out!=="renvoye") L.push(c.mem.nuit==="porte"?"Sacha a signé pro. Le soir de la signature, un message : « Sans toi, j'aurais fait mes valises le premier soir. »":"Sacha a signé pro. Tu as regardé sa première titularisation depuis ta chambre.");
  else L.push("Sacha a signé pro l'année suivante, sans jamais savoir pourquoi ton badge n'était plus là.");
  if(c.mem.appel==="promesse"&&(pro||out==="valmont")) L.push(T("Le premier salaire est arrivé un vendredi. Le samedi, {par} a quitté son deuxième boulot."));
  else if(out==="valmont") L.push(T("{Par} a appris pour Valmont dans le journal. L'article est découpé, plié en quatre, dans un tiroir. Pas sur le frigo."));
  else if(!pro) L.push(T("{Par} n'a jamais demandé ce qui s'était passé. {Pr} a juste mis deux assiettes sur la table."));
  else L.push(T("{Par} a encadré ton premier contrat. Il est accroché au-dessus de la télé."));
  if(c.mem.nino==="mot") L.push(pro?"Nino a dix ans. Il est entré à l'école de foot du Racing. Il a demandé ton numéro.":"Nino a gardé le ballon. Il dit à tout le monde qu'il connaît un futur pro.");
  if(c.mem.ecole==="garde") L.push(T("Ton bac est rangé dans un tiroir. {Par} sait exactement lequel."));
  if(c.mem.ferri==="cafe") L.push(pro?"Dario Ferri a pris sa retraite l'an dernier. Le jour de son dernier match, il t'a tendu le brassard dans le vestiaire, sans un mot.":"Dario Ferri t'envoie un message à chaque anniversaire. Toujours le même : « Deux sucres. »");
  const mot = c.conf>=62?"Oui.":c.conf>=45?"Peut-être.":"Non.";
  L.push(`Vasseur a pris sa retraite. Dans son vieux carnet, à la page de ton essai, il n'y a qu'une ligne : « ${c.mem.cel==="redemande"?"A redemandé le ballon.":mot} »`);
  return L;
}
function cfEndsSeen(){ try{ return JSON.parse(localStorage.getItem("trajectoire_centre_fins"))||{}; }catch(e){ return {}; } }
function cfRecordEnd(k){ const s = cfEndsSeen(); if(!s[k]){ s[k] = cfPrenom(); try{ localStorage.setItem("trajectoire_centre_fins",JSON.stringify(s)); }catch(e){} } }

/* ============ Les écrans ============ */
function centreRender(html,label){
  $("#app").innerHTML = `<div class="cf"><div class="cf-top"><button class="linkbtn" onclick="home()">← Accueil</button><span>${label||"Le centre de formation"}</span></div><div class="fade" tabindex="-1">${typeof takeToast==="function"?takeToast():""}${html}</div></div>`;
  window.scrollTo(0,0);
  /** @type {HTMLElement} */ (document.querySelector("#app .fade"))?.focus?.({preventScroll:true});
}
const cfBtns = (chs,fn)=>chs.map((x,i)=>`<button class="btn${x.primary?" primary":""}" onclick="${fn}(${i})">${x.primary?T(x.t):`<kbd>${i+1}</kbd><span class="cf-bt">${T(x.t)}${x.kind?' <span class="chip">À jouer</span>':""}</span>`}${x.sub?`<small>${x.sub}</small>`:""}</button>`).join("");
const cfRes = c=>c.res?`<div class="cf-res">${T(c.res)}</div>`:"";
function centreRoute(){
  const c = cfC(); cfMigrate(c);
  const b = CF_BEATS[c.i];
  if(!b) return cfEndScreen();
  const head = c.head&&b.sn?`<div class="cf-title"><span>Saison ${b.sn} · ${15+b.sn} ans</span><h1>${CF_SEASONS[b.sn]}</h1></div>`:"";
  const label = c.head?"Le centre de formation":c.season?`Saison ${c.season} · ${p.age} ans`:"Le jour de l'essai";
  if(b.k==="essai") return cfEssaiScreen();
  if(b.k==="nom") return cfNomScreen();
  if(b.k==="proche") return centreRender(cfRes(c)+cfSay("vasseur","« Et la personne sous le parapluie, là-haut, c'est qui ? »")+`<div class="decide">${Object.values(CF_PARENTS).map((x,i)=>`<button class="btn" onclick="cfPickPar('${Object.keys(CF_PARENTS)[i]}')"><kbd>${i+1}</kbd><span class="cf-bt">${x.l}</span></button>`).join("")}</div>`,label);
  if(b.k==="poste") return centreRender(cfRes(c)+cfSay("vasseur","« Lundi, huit heures. Dernière chose : tu joues où, d'habitude ? »")+`<div class="decide">${Object.keys(CF_POSTE).map((k,i)=>`<button class="btn" onclick="cfPickPoste('${k}')"><kbd>${i+1}</kbd><span class="cf-bt">${cfCap(CF_POSTE[k])}</span></button>`).join("")}</div>`,label);
  if(b.k==="match") return cfMatchScreen(b,label);
  ambient(false);
  if(b.k==="fin") return cfFilmScreen();
  const chs = b.ch(c);
  centreRender(cfRes(c)+head+(b.img?cfImg(b.img,""):"")+b.body(c)+`<div class="decide">${cfBtns(chs,"cfChoose")}</div>`,label);
}
// une étape tirée au sort (pool) n'arrive que si elle fait partie du tirage de cette partie
const cfActive = (b,c)=>!b.pool||(c.pool||[]).includes(b.id);
function cfAdvance(){
  const c = cfC();
  c.head = false;
  if(c.out&&CF_BEATS[c.i].id!=="v3"){ c.i = CF_BEATS.findIndex(b=>b.id==="v3"); if(c.out==="renvoye") c.i++; }
  else { c.i++; while(CF_BEATS[c.i]&&!cfActive(CF_BEATS[c.i],c)) c.i++; }
  const b = CF_BEATS[c.i];
  if(b&&b.sn&&b.sn!==c.season){ c.season = b.sn; p.age = 15+b.sn; c.head = true; }
  save(); route();
}
const CF_SEASONS = {1:"Le centre",2:"Le doute",3:"Le contrat"};
// les scènes déjà vécues dans les parties précédentes : le tirage donne d'abord leur chance aux autres
function cfVus(){ try{ return JSON.parse(localStorage.getItem("trajectoire_centre_vus"))||{}; }catch(e){ return {}; } }
function cfVu(id){ const v = cfVus(); v[id] = (v[id]||0)+1; try{ localStorage.setItem("trajectoire_centre_vus",JSON.stringify(v)); }catch(e){} }
function cfDraw(){
  const v = cfVus(), out = [];
  for(const g of ["s1","s2","s3"]){
    const ids = CF_BEATS.filter(b=>b.pool===g).map(b=>b.id), least = Math.min(...ids.map(id=>v[id]||0));
    out.push(pick(ids.filter(id=>(v[id]||0)===least)));
  }
  return out;
}
// une partie commencée avant le tirage des scènes : on la retrouve à la même étape
const CF_OLD_IDS = ["essai","apres","nom","proche","poste","nino","s1","nuit","appel","m1","v1","s2","agent","couvre","m2","v2","s3","veille","m3","v3","fin"];
function cfMigrate(c){
  if(c.v>=2) return;
  const old = CF_OLD_IDS[c.i]==="s2"?"depanne":CF_OLD_IDS[c.i], at = CF_BEATS.findIndex(b=>b.id===old);
  const s3 = pick(["cheville","veille-only"]);
  c.pool = ["depanne"].concat(c.i<=CF_OLD_IDS.indexOf("s1")?[pick(["ecole","capitaine","genou"])]:[]).concat(s3==="cheville"?["cheville"]:[]);
  if(at>=0) c.i = at;
  c.v = 2;
}
function cfChoose(i){
  const c = cfC(), b = CF_BEATS[c.i], ch = b.ch(c)[i];
  if(!ch) return;
  // comme en carrière, le choix qu'on vient de faire reste écrit au-dessus de sa suite
  c.res = `<span class="cf-picked">Tu as choisi : ${ch.t}</span>`+(ch.go(c)||"");
  if(b.pool) cfVu(b.id);
  if(b.id==="v3"){ cfDecide(c); c.res = ""; }
  cfAdvance();
}

/* --- L'essai --- */
function cfEssaiScreen(){
  centreRender(cfImg("img/terrain.webp","Un joueur frappe le ballon sous la pluie")
    +`<div class="cf-title"><span>16 ans</span><h1>Le jour de l'essai</h1></div>`
    +cfNar("Un dimanche de pluie, sur le synthétique du stade municipal. Quarante gamins pour trois places au centre de formation du Racing Port-Marée.",
      "Dans la petite tribune, un homme en imperméable n'a pas levé les yeux de son carnet depuis une heure. Juste à côté, sous un parapluie, il y a quelqu'un qui est venu pour toi.",
      "88e minute, 0-0. Tu entres dans la surface, un défenseur te fauche. L'arbitre siffle. Penalty.",
      "L'homme en imperméable referme son carnet. Il regarde.")
    +`<div class="decide">${cfBtns([{t:"Prendre le ballon",kind:"shoot"},{t:"Le laisser à quelqu'un d'autre"}],"cfEssai")}</div>
    <p class="cf-classic"><button class="linkbtn" onclick="cfClassic()">Créer mon joueur en détail plutôt</button><small>Pays, profil, points de départ et défis</small></p>`,"Le jour de l'essai");
}
function cfEssai(i){
  const c = cfC();
  if(i===1){ c.mem.essai = "laisse"; c.res = ""; return cfAdvance(); }
  cfMini("shoot",.7,ok=>{ c.mem.essai = ok?"but":"rate"; c.mem.rateHow = !ok&&typeof Penalty!=="undefined"&&Penalty.lastOut?Penalty.lastOut():null; c.res = ""; if(ok) p.lvl += 1; cfAdvance(); });
}
function cfNomScreen(){
  const c = cfC();
  const extra = {redemande:"« Personne ne m'avait jamais redemandé un penalty. »",show:"« Ton nom, je l'ai lu dans ton dos. Je veux l'entendre. »",par:"« C'est pour cette personne que tu as couru ? On verra ça après. »",fair:"« Joli geste, tout à l'heure. »"}[c.mem.cel]||"";
  centreRender(cfRes(c)+cfNar(c.mem.cel==="redemande"?"Il referme son carnet et descend les marches de la tribune, jusqu'à ta hauteur. La pluie ne semble pas le déranger.":"L'homme en imperméable descend de la tribune et marche droit vers toi. La pluie ne semble pas le déranger.")
    +cfSay("vasseur",`« Rémi Vasseur. Je dirige le centre de formation du Racing. » ${extra} Il ouvre son carnet. « Ton nom. »`)
    +`<div class="decide"><label class="cf-name"><span class="muted">Ton nom</span><input id="cfnm" maxlength="26" autocomplete="off" placeholder="Prénom Nom" onkeydown="if(event.key==='Enter')cfName()"></label>
      <button class="btn primary" onclick="cfName()">C'est moi</button><button class="btn ghost" onclick="cfRollName()">Un nom au hasard</button></div>`,"Le jour de l'essai");
  setTimeout(()=>/** @type {HTMLElement} */ (document.getElementById("cfnm"))?.focus?.(),50);
}
// le hasard remplit le champ : on voit le nom, on peut relancer ou le retoucher avant de valider
function cfRollName(){
  const el = /** @type {HTMLInputElement} */ (document.getElementById("cfnm"));
  if(!el) return cfName(true);
  el.value = pick(FIRST)+" "+pick(LAST); el.focus();
}
function cfName(rnd){
  const el = /** @type {HTMLInputElement} */ (document.getElementById("cfnm"));
  const v = !rnd&&el&&el.value?el.value.trim():"";
  p.name = v||pick(FIRST)+" "+pick(LAST);
  cfC().res = `Il écrit ton nom en bas de la page, en lettres capitales. « ${esc(p.name.toUpperCase())}. »`;
  cfAdvance();
}
function cfPickPar(k){
  const c = cfC(); c.par = k;
  const look = c.looks.par; if(!CF_PARENTS[k].beard) look.beard = 0;
  // l'âge se voit : cheveux gris pour la grand-mère, pas de crâne rasé ni de crête pour la mère et la sœur
  if(k==="gm"){ look.hairC = 5; look.hair = pick([1,2,3]); }
  else if(!CF_PARENTS[k].beard&&(look.hair===0||look.hair===4)) look.hair = pick([2,3,5]);
  c.res = `Il lève les yeux vers la tribune. ${T("{Par}")} fait un petit signe de la main, sous le parapluie. Vasseur le lui rend.`;
  cfAdvance();
}
function cfPickPoste(k){
  p.pos = k; const c = cfC();
  c.res = {GB:"« Gardien. Et tu as tiré le penalty quand même ? » Il secoue la tête. Il sourit presque.",DEF:"« Défenseur. Bien. Les défenseurs, on s'en souvient moins. Fais en sorte qu'on se souvienne de toi. »",MIL:"« Milieu. Le cerveau. Montre-moi que tu en as un. »",ATT:"« Attaquant. Alors marque. Tout le temps. »"}[k];
  cfAdvance();
}

/* --- Les matchs --- */
function cfMatchStart(b){
  const c = cfC();
  c.m = {id:b.id,opp:b.opp,a:0,us:0,them:0,ok:0,log:[],last:null,done:false};
  if(!b.final&&chance(.4)){ const ours = chance(.5); if(ours) c.m.us++; else c.m.them++; c.m.log.push(ours?"But de ton équipe en première période.":`But ${duC(b.opp)} en première période.`); }
  c.m.prevUs = c.m.us; c.m.prevThem = c.m.them;
}
function cfAct(b,k){ return k==="dil"?null:CF_ACTS[p.pos][k]; }
function cfMatchScreen(b,label){
  const c = cfC(); if(!c.m||c.m.id!==b.id) cfMatchStart(b);
  const m = c.m, k = b.acts[m.a];
  ambient(!m.done&&!ui.quick);
  const flash = m.flash; m.flash = null;
  const board = `<div class="cf-board${flash?" cf-flash-"+flash:""}"><span>${esc(CF_CLUB.split(" ")[0])} ${b.final?"U19":b.id==="m1"?"U17":"U19"}</span><b>${m.us} – ${m.them}</b><span>${esc(b.opp)}</span></div>`;
  let body = "";
  if(m.a===0&&!m.last) body += cfNar(b.intro(c));
  if(m.last) body += `<div class="cf-res">${m.last}</div>`;
  if(m.done){
    const res = m.us>m.them?"w":m.us<m.them?"l":"d";
    if(!m.whistled&&!ui.quick){ m.whistled = true; sfx("whistle"); }
    body += cfNar(`Coup de sifflet final : ${m.us}-${m.them}.`)
      +(m.ok>=2?cfSay("vasseur","« Pas mal. »")+cfNar("Venant de lui, c'est presque un compliment."):m.ok===1?cfSay("vasseur","« Bien. Et moins bien. »"):cfNar("Vasseur ne dit rien. Il écrit."))
      +(b.final?"":cfNar(({w:["Dans le vestiaire, quelqu'un met la musique trop fort.","Sous la douche, tout le monde chante faux. Même Vasseur sourit, dans le couloir."],l:["Le bus du retour est silencieux.","Dans le vestiaire, personne n'enlève ses crampons. Vasseur passe sans un mot."],d:["Un nul. Personne ne sait trop quoi en penser.","Un nul. Dans le bus, Sacha refait le match à voix basse, action par action."]})[res][b.id==="m1"?0:1]))
      +`<div class="decide"><button class="btn primary" onclick="cfMatchEnd()">Continuer</button></div>`;
  } else if(k==="dil") body += cfDilHtml(c);
  else {
    const a = cfAct(b,k);
    body += `<p class="cf-min">${b.mins[m.a]}'</p><p class="story">${a.txt}</p><div class="decide">${cfBtns(a.o,"cfPlay")}</div>`;
  }
  // la suite du dernier choix (avant le coup d'envoi) reste affichée en tête, comme pour une scène
  centreRender((m.a===0&&!m.last?cfRes(c):"")+(b.img&&m.a===0&&!m.last?cfImg(b.img,""):"")+`<h2 class="cf-mtitle">${esc(b.title)}</h2>`+board+(m.log.length?`<ul class="mlog">${m.log.map(l=>`<li>${l}</li>`).join("")}</ul>`:"")+body,label);
}
function cfPlay(i){
  const c = cfC(), b = CF_BEATS[c.i], m = c.m, a = cfAct(b,b.acts[m.a]), o = a&&a.o[i];
  if(!o||ui.cfBusy) return;
  ui.cfBusy = true;
  cfMini(o.kind,o.p,ok=>{
    ui.cfBusy = false;
    const min = b.mins[m.a];
    if(ok){ if(o.mine!==false) m.ok++; if(o.goal){ m.us++; m.log.push(`${min}' But ! ${o.mine===false?"":"C'est toi."}`.trim()); } }
    else if(o.them&&chance(o.them)){ m.them++; m.log.push(`${min}' But ${duC(b.opp)}.`); }
    m.last = ok?o.ok:o.ko;
    const scored = m.us>(m.prevUs??0), conceded = m.them>(m.prevThem??0);
    m.prevUs = m.us; m.prevThem = m.them;
    if(!ui.quick){ if(scored){ m.flash = "us"; sfx("goal"); crowdSwell(); } else if(conceded){ m.flash = "them"; sfx("concede"); } else if(ok) sfx("click"); }
    m.a++;
    if(m.a>=b.acts.length) cfMatchFinish(b);
    else if(b.acts[m.a]==="dil") cfBeforeDil(b);
    save(); route();
  });
}
// le reste du match, simulé ; la finale arrive à égalité à la 88e, quoi qu'il arrive
// les buts du temps simulé apparaissent au tableau avec leur minute : le score ne change jamais sans explication
function cfSimGoals(b,from,to,lu,lt){
  const m = cfC().m, evs = [];
  for(let i=poisson(lu);i>0;i--) evs.push({min:RI(from+1,to),us:true});
  for(let i=poisson(lt);i>0;i--) evs.push({min:RI(from+1,to),us:false});
  evs.sort((x,y)=>x.min-y.min).forEach(e=>{ if(e.us){ m.us++; m.log.push(`${e.min}' But de ton équipe.`); } else { m.them++; m.log.push(`${e.min}' But ${duC(b.opp)}.`); } });
}
function cfBeforeDil(b){
  const m = cfC().m;
  cfSimGoals(b,b.mins[Math.max(0,m.a-1)],74,.5,.6);
  if(m.us>m.them){ m.them = m.us; m.log.push(`80' Ils égalisent. ${m.us}-${m.them}. Le président ne bouge plus.`); }
  else if(m.them>m.us){ m.us = m.them; m.log.push(`76' Sacha égalise ! ${m.us}-${m.them}.`); }
}
function cfMatchFinish(b){
  const m = cfC().m;
  if(!b.final) cfSimGoals(b,b.mins[b.mins.length-1],90,.55,.55);
  m.done = true;
}
function cfDilHtml(c){
  const m = c.m, gk = p.pos==="GB";
  const say = c.sacha>=2?cfSay("sacha",gk?"« Fais ce que tu sens. Si tu sors, je l'arrête pour nous deux. »":"« Laisse-moi le tirer. C'est la dernière chance que j'ai. »")
    :c.sacha<=-2?cfNar("Sacha te fixe sans un mot. Tu sais exactement ce que Sacha pense de toi."):cfSay("sacha",gk?"« À toi de voir. »":"« Tu le tires, ou je le tire ? »");
  const txt = gk?`88e minute, ${m.us}-${m.them}. Penalty contre vous. Vasseur se lève et fait signe au quatrième arbitre. Sur le banc, Sacha retire sa chasuble : Sacha arrête plus de penalties que toi, tout le monde le sait.`
    :`88e minute, ${m.us}-${m.them}. Penalty pour vous. C'est toi qui les tires depuis le début de la saison. Sacha s'approche.`;
  return `<p class="cf-min">88'</p><p class="story">${txt}</p>${gk?cfSay("vasseur","« Je te laisse choisir. Tu restes, ou tu sors ? »"):""}${say}
    <div class="decide">${cfBtns(gk?[{t:"Rester dans les buts",kind:"save"},{t:"Sortir et laisser ta place à Sacha"}]:[{t:"Prendre le ballon",kind:"shoot"},{t:"Le donner à Sacha"}],"cfDil")}</div>`;
}
function cfDil(i){
  const c = cfC(), b = CF_BEATS[c.i], m = c.m, gk = p.pos==="GB";
  if(ui.cfBusy) return;
  const done = ok=>{
    ui.cfBusy = false; c.mem.penOk = ok;
    if(gk){ if(!ok) m.them++; } else if(ok) m.us++;
    m.log.push(`88' ${i===0?(gk?(ok?"Tu arrêtes le penalty !":"Le penalty est au fond."):(ok?"Ton penalty est au fond !":"Ton penalty sur le poteau.")):(gk?(ok?"Sacha entre et arrête le penalty !":"Sacha entre, plonge du bon côté… mais trop court."):(ok?"Sacha transforme le penalty !":"Sacha frappe… le gardien l'arrête."))}`);
    m.last = i===0?(ok?"Tout le stade se lève. Dans la tribune, le président applaudit.":"Le silence. Puis le bruit des Espagnols qui exultent."):(ok?"Sacha court vers toi, pas vers la tribune. Vers toi.":"Sacha s'effondre. La première main tendue, c'est la tienne.");
    if(!ui.quick){ if(ok){ m.flash = "us"; sfx("goal"); crowdSwell(); } else { m.flash = "them"; sfx("concede"); } }
    m.a++; cfMatchFinish(b); save(); route();
  };
  ui.cfBusy = true;
  if(i===0){ c.mem.dil = "moi"; cfMini(gk?"save":"shoot",gk?.35:.7,done); }
  else { c.mem.dil = "sacha"; cfFx({conf:5,sacha:3}); done(chance((gk?.45:.72)-(c.mem.cheville==="cache"?.12:0))); }
}
function cfMatchEnd(){
  const c = cfC(), m = c.m, b = CF_BEATS[c.i];
  const win = m.us>m.them, n = b.acts.filter(k=>k!=="dil").length;
  c.mem[m.id] = {us:m.us,them:m.them,ok:m.ok};
  c.perf += m.ok; cfFx({conf:m.ok*4-(n-m.ok)*2+(win?2:0)});
  p.lvl = clamp(p.lvl+2+m.ok*2,20,99);
  c.res = ""; c.m = null;
  cfAdvance();
}

/* --- La fin --- */
/** @type {null|(()=>void)} */
let filmDone = null;
function filmEnd(){ clearTimeout(/** @type {any} */ (window).cfTimer); const d = filmDone||cfFilmSkip; filmDone = null; d(); }
function filmShow(frames,label){
  $("#app").innerHTML = `<div class="cf-film" data-i="0" role="region" aria-label="${label}" onclick="cfFilmStep()">${frames.join("")}
    <div class="cf-film-nav"><button class="btn ghost" onclick="event.stopPropagation();filmEnd()">Passer</button></div></div>`;
  cfFilmPaint();
}
const filmFrame = (age,text,quote)=>`<section class="cf-frame"><span class="cf-age">${age}</span><p class="cf-ft">${text}</p>${quote||""}</section>`;
function cfFilmScreen(){
  const c = cfC(), F = cfFilm(c), E = CF_ENDS[c.out];
  cfRecordEnd(c.out);
  const frames = F.map(f=>`<section class="cf-frame"><span class="cf-age">${f.a}</span><p class="cf-ft">${T(f.t)}</p>${f.q?cfSay(f.q[0],f.q[1]):""}</section>`)
    .concat(`<section class="cf-frame"><span class="cf-age">${p.age} ans</span><h1 class="cf-endt">${E.n}</h1><p class="cf-ft">${E.d}</p></section>`);
  filmDone = cfFilmSkip;
  filmShow(frames,"Le film de tes trois ans au centre");
}
function cfFilmPaint(){
  const box = /** @type {HTMLElement} */ (document.querySelector(".cf-film")); if(!box||!box.dataset) return;
  const i = +box.dataset.i, fs = box.querySelectorAll(".cf-frame");
  fs.forEach((f,j)=>f.classList.toggle("on",j===i));
  const fr = fs[i]; if(fr) speak([...fr.querySelectorAll(".cf-ft,.cf-endt,.cf-say p")].map(x=>x.textContent).join(" "));
  clearTimeout(/** @type {any} */ (window).cfTimer);
  /** @type {any} */ (window).cfTimer = setTimeout(cfFilmStep,i>=fs.length-1?4200:3800);
}
function cfFilmStep(){
  const box = /** @type {HTMLElement} */ (document.querySelector(".cf-film")); if(!box||!box.dataset) return;
  const n = box.querySelectorAll(".cf-frame").length, i = +box.dataset.i+1;
  if(i>=n) return filmEnd();
  box.dataset.i = String(i); cfFilmPaint();
}
function cfFilmSkip(){ clearTimeout(/** @type {any} */ (window).cfTimer); cfC().filmSeen = true; save(); cfEndScreen(); }
function cfEndScreen(){
  const c = cfC(), E = CF_ENDS[c.out], seen = cfEndsSeen(), keys = Object.keys(CF_ENDS);
  const missing = keys.filter(k=>!seen[k]);
  if(!c.partied&&cfPro(c)&&!ui.quick){ c.partied = true; save(); setTimeout(()=>{ confetti(); sfx("trophy"); },350); }
  centreRender(`<div class="cf-title"><span>${esc(p.name)} · ${p.age} ans</span><h1>${E.n}</h1></div><p class="cf-nar">${E.d}</p>
    <div class="card cf-today"><h3>Aujourd'hui</h3>${cfToday(c).map(l=>`<p>${esc(l)}</p>`).join("")}</div>
    <div class="card"><h3>Fins découvertes · ${keys.length-missing.length}/${keys.length}</h3>
      ${keys.map(k=>`<div class="ach ${seen[k]?"":"off"}"><span class="i">${seen[k]?"🏅":"🔒"}</span><div><b>${seen[k]?CF_ENDS[k].n:"???"}</b><small>${seen[k]?CF_ENDS[k].d:CF_ENDS[k].hint}</small></div></div>`).join("")}</div>
    ${missing.length?`<p class="cf-nar cf-tease">Et si… ${esc(CF_ENDS[pick(missing)].hint)}</p>`:`<p class="cf-nar cf-tease">Tu as vu toutes les fins. Vasseur referme son carnet.</p>`}
    <button class="btn primary" onclick="cfToCareer()">${cfCareerLabel(c)} →<small>${esc(cfCareerClub(c).name)}${c.out==="exil"?" · Belgique":""} · ta carrière continue, et ces gens-là aussi</small></button>
    <button class="btn" onclick="cfFilmScreen()">Revoir le film</button>
    <button class="btn ghost" onclick="startCentre(slot)">Recommencer depuis l'essai</button>`,"Trois ans plus tard");
}

/* ============ Lancement ============ */
// une nouvelle carrière commence par le match d'essai ; la création détaillée reste possible (cfClassic)
function startCentre(k){
  slot = k||slot||"1"; wipe();
  newPlayer({name:"Inconnu",country:"FR",pos:"ATT",trait:"tech",origin:"quartier",ent:"parent",life:"pro"});
  const club = CLUBS.find(x=>x.name===CF_CLUB)||p.club;
  p.club = {...club}; p.clubsHist = [club.name]; p.moments = []; p.lvl = 48; p.age = 16;
  const looks = {vasseur:{...randomLook(),beard:1,hairC:5,hair:1},sacha:{...randomLook(),beard:0},par:randomLook(),kessler:randomLook(),nino:{...randomLook(),beard:0},ferri:{...randomLook(),beard:2}};
  p.centre = {v:2,i:0,season:0,conf:45,sacha:0,lien:0,perf:0,mem:{},par:"mere",looks,m:null,res:"",out:null,pool:cfDraw(),head:false};
  save(); route();
}
function cfClassic(){ const k = slot; wipe(); p = null; slot = k; draft = {}; createStep(0); }

/* ============ Du centre à la carrière ============ */
const cfPro = c=>["signe","prix","double","valmont"].includes(c.out);
// le club où commence la carrière, selon la fin du centre
function cfCareerClub(c){
  const racing = CLUBS.find(x=>x.name===CF_CLUB), small = cc=>CLUBS.filter(x=>x.country===cc).sort((a,b)=>a.str-b.str).slice(0,3);
  return c.out==="valmont"?CLUBS.find(x=>x.name==="Olympique Valmont")||racing:cfPro(c)?racing:c.out==="exil"?pick(small("BE")):pick(small("FR"));
}
const cfCareerLabel = c=>c.out==="valmont"?"Rejoindre Valmont":cfPro(c)?"Commencer ma carrière pro":c.out==="exil"?"Partir en Belgique":"Repartir d'en bas";
// la carrière reprend là où le centre s'arrête : même joueur, même âge, et les mêmes gens autour
function cfToCareer(){
  const c = p.centre; if(!c||!c.out) return;
  const pro = cfPro(c), club = cfCareerClub(c), racing = CLUBS.find(x=>x.name===CF_CLUB)||club;
  p.year = 2026+p.age-16;
  p.club = {...club}; p.clubsHist = [club.name]; p.contract = pro?3:2; p.salary = pro?40:18;
  if(pro) p.lvl = clamp(p.lvl+3,20,99);
  // ce que les trois ans ont révélé de toi
  p.trait = c.mem.cel==="show"?"inst":c.mem.cel==="redemande"||c.mem.accueil==="main"?"lead":p.pos==="MIL"?"tech":c.mem.poste==="oui"?"athl":"tech";
  p.ent = "parent"; p.agent = c.mem.agent==="oui"?"requin":"famille";
  if(p.agent==="famille") p.flags.famille = true; else delete p.flags.famille;
  if(c.mem.veille==="train") p.moral = clamp(p.moral+5,5,100);
  // Sacha devient ton rival de carrière : au Racing si le contrat était pour Sacha (ou pour vous deux), ailleurs sinon
  const sClub = pro&&c.out!=="double"&&c.out!=="valmont"?pick(CLUBS.filter(x=>x.country==="FR"&&x.str<racing.str-8).sort((a,b)=>b.str-a.str).slice(0,3)):racing;
  p.rival = {name:"Sacha Lenoir",country:"FR",lvl:clamp(p.lvl+RI(-3,2)+(pro?-2:3),30,99),pot:RI(84,92),club:{...sClub},
    apps:0,goals:0,assists:0,clean:0,trophies:0,stars:0,caps:0,best:0,h2h:{w:0,d:0,l:0},retired:false,cf:true};
  p.moments = [`2026 · Essai au Racing Port-Marée${c.mem.essai==="but"?" : penalty marqué":c.mem.essai==="rate"?" : penalty raté":""}`];
  if(c.out==="renvoye") p.moments.push(`${p.year} · Le centre du Racing ne le garde pas`);
  p.moments.push(pro?`${p.year} · Premier contrat pro à ${club.name}${c.out==="double"?", le même jour que Sacha Lenoir":c.out==="valmont"?", avant même la fin du centre":""}`:`${p.year} · Premier contrat à ${club.name}`);
  c.s0 = p.seasons.length; // repère du fil des premières saisons pro (cfArcNext)
  p.cf = c; delete p.centre;
  p.phase = "goal"; p.evIdx = 0; p.tmp = {play:0}; p.goalOpts = null; p.match = null; p.rel = newRel();
  ui = {};
  ui.toast = `<div class="tchoice">Saison ${p.year}-${String(p.year+1).slice(2)} · ${esc(club.name)}</div><div>${pro?"Le vestiaire des pros. Ton nom est sur un casier, à côté de joueurs que tu regardais à la télé.":"Un petit stade, des vestiaires qui sentent la peinture fraîche. Personne ne te connaît ici. Tout est à refaire."}</div>`;
  save(); route();
}

/* ============ Ils reviennent pendant la carrière ============ */
// des événements qui n'existent que pour les joueurs passés par le centre ; chacun ne sort qu'une fois
const cfOnce = id=>!!p.cf&&!(p.used||{})[id];
const cfM = ()=>(p.cf&&p.cf.mem)||{};
/** @type {any[]} */
const CF_EVENTS = [
  {id:"cfStade",scene:"perso",weight:4,arc:[0,1],cond:()=>cfOnce("cfStade")&&p.age<=21,
    txt:()=>T("{Par} vient te voir jouer pour la première fois depuis ton premier contrat. Au téléphone, {pr} fait comme si ce n'était rien. Tu entends bien que si."),
    ch:[{get t(){ return T("Aller chercher {par} à la gare toi-même"); },fx:{moral:6,form:-2},get why(){ return T("Sur le quai, {par} tient le vieux parapluie du jour de l'essai."); }},
        {t:"Réserver une place en tribune d'honneur",fx:{moral:4,money:-8},why:"Pendant tout le match, tu sais exactement où regarder."},
        {t:"Rester concentré, vous vous verrez après",fx:{form:3,moral:-2},why:"Après le match, il est tard. Vous mangez un sandwich sur le parking."}]},
  {id:"cfPromesse",scene:"perso",weight:5,cond:()=>cfOnce("cfPromesse")&&cfM().appel==="promesse"&&p.money>=400&&p.age>=20,
    txt:()=>T("Tu n'as pas oublié ce mardi soir, à seize ans : « Au centuple. » Une maison est à vendre, à deux rues de chez {par}."),
    ch:[{t:"L'acheter et offrir les clés",fx:{money:-350,moral:10,moment:()=>T("Offre une maison à {par}, comme promis à 16 ans")},get why(){ return T("{Par} tourne la clé dans la serrure, s'arrête, et dit seulement : « Je note. »"); }},
        {t:"Pas encore. Plus tard",fx:{moral:-3},why:"Plus tard. Tu te le répètes souvent."}]},
  {id:"cfKessler",scene:"argent",weight:3,cond:()=>cfOnce("cfKessler")&&cfM().agent==="non"&&p.age>=20&&p.age<=25&&p.agent!=="requin"&&p.defi!=="solo",
    txt:()=>"Un costume trop bleu sur le parking du stade. Bruno Kessler, plus gris, même sourire. « Je t'avais dit qu'un jour tu aurais besoin de moi. »",
    ch:[{t:"Signer avec lui, cette fois",fx:{agent:"requin",rep:2},why:"« Tu vois ? Il suffisait d'attendre. »"},
        {t:"Refuser, encore",fx:{moral:3},why:"Il range sa carte. « Toujours aussi têtu. J'aime bien. »"}]},
  {id:"cfSachaDur",scene:"rival",weight:4,cond:()=>cfOnce("cfSachaDur")&&p.cf.sacha>=1&&p.age>=20&&p.age<=27&&!!p.rival?.cf&&rivalActive(),
    txt:()=>"Trois heures du matin, un message de Sacha : « Les croisés. Saison finie. Tu te souviens de la première nuit au centre ? C'est pareil. »",
    ch:[{t:"Prendre le premier train pour aller voir Sacha",fx:{moral:6,form:-3,rival:-2},why:"Vous parlez jusqu'à deux heures du matin. Comme avant."},
        {t:"Écrire un long message",fx:{moral:3},why:"« Merci. Vraiment. » Puis plus rien pendant des semaines."},
        {t:"Ne pas répondre",fx:{moral:-4},why:"Le message reste là, marqué « lu »."}]},
  {id:"cfSachaInterview",scene:"rival",weight:4,cond:()=>cfOnce("cfSachaInterview")&&p.cf.sacha<=-1&&p.age>=20&&!!p.rival?.cf&&rivalActive(),
    txt:()=>`Dans une longue interview, Sacha raconte ses années au centre. ${cfM().nuit==="moque"?"Un petit déjeuner, un rire, une humiliation":cfM().couvre==="balance"?"Une suspension, et quelqu'un qui a parlé":"Une rivalité qui a mal tourné"}. Sans te nommer. Tout le monde a compris.`,
    ch:[{t:"Répondre publiquement",fx:{rep:2,moral:-3},why:"Les réseaux s'enflamment. Sacha ne répond pas."},
        {t:"Appeler Sacha pour t'excuser",fx:{moral:5,rival:-1},why:"Un long silence au bout du fil. Puis : « Il t'a fallu le temps. »"},
        {t:"Ne rien dire",fx:{},why:"Le silence, aussi, est une réponse."}]},
  {id:"cfNino",scene:"vestiaire",weight:4,cond:()=>cfOnce("cfNino")&&cfM().nino==="mot"&&p.age>=24&&!p.protege,
    txt:()=>"Au bord du terrain d'entraînement, un ado attend, un vieux ballon dégonflé sous le bras. Ton gribouillis est encore lisible. « Pour Nino, futur pro. Tu te souviens ? J'ai quinze ans. Je suis au centre. »",
    ch:[{t:"Le prendre sous ton aile",fx:{protege:1,moral:()=>{ if(p.protege){ p.protege.name = "Nino "+pick(LAST); p.protege.age = 15; } return 6; }},why:"Il ne te lâche plus d'une semelle. Tu reconnais quelqu'un, à seize ans, sous la pluie."},
        {t:"Lui signer un nouveau ballon",fx:{moral:3,rep:1},why:"« Pour Nino, toujours futur pro. » Il rit."}]},
  {id:"cfVasseur",scene:"echo",weight:4,cond:()=>cfOnce("cfVasseur")&&p.age>=26,
    txt:()=>`Après un match, un homme en imperméable t'attend près du car. Rémi Vasseur, plus vieux, le même carnet sous le bras. ${cfPro(p.cf)?"« Je passais. Je voulais te voir jouer en vrai, une fois. »":"« Je me suis trompé sur toi. Ça m'arrive rarement. Je voulais te le dire en face. »"}${({venu:" « Le gamin du banc de touche, sous la pluie. Il a signé pro la semaine dernière. Il a demandé ton numéro. »",video:" « Le gamin de ta vidéo a tenu bon. Il la regarde encore avant les matchs. »",non:" « Le gamin de l'autre fois a arrêté. Ce n'est pas ta faute. » Sa voix dit le contraire."})[cfM().vasseurAide]||""}`,
    ch:[{t:"Lui demander ce qu'il avait écrit, le jour de l'essai",fx:{moral:5},why:"Il ouvre le carnet à la première page et te le tend. Tu lis. Tu ne dis rien pendant un long moment."},
        {t:"L'inviter à dîner",fx:{moral:6,form:-1},why:"Il parle de tout le monde : de Sacha, de tes années au centre, des gamins d'aujourd'hui. Jamais de lui."},
        {t:"Lui dire que tu n'as jamais oublié",fx:{moral:4,rep:1},why:"« Moi non plus. » Il remonte le col de son imperméable et s'en va."}]}
];
/* ---- Le fil des premières saisons pro ----
   Juste après le centre, la carrière ne doit pas devenir anonyme : à des moments fixes des deux premières saisons,
   une scène écrite fait revenir les gens du centre (arc:[saison pro, moment minimum]). Elles passent avant le tirage. */
const cfOut = ()=>(p.cf&&p.cf.out)||"";
const cfSameClubSacha = ()=>!!p.rival?.cf&&p.rival.club.name===p.club.name;
CF_EVENTS.push(
  {id:"cfCasier",scene:"vestiaire",weight:4,arc:[0,0],cond:()=>cfOnce("cfCasier"),
    txt:()=>cfOut()==="valmont"
      ?"Premier jour à Valmont. Dans ton casier, entre les crampons neufs, une enveloppe. Tu reconnais l'écriture penchée du carnet."+cfSay("vasseur","« Tu as choisi de ne jamais savoir ce que tu valais au Racing. Alors fais en sorte que ça en vaille la peine. R. V. »")
      :cfPro(p.cf)
      ?"Premier jour chez les pros. Vasseur t'accompagne jusqu'au bout du couloir, là où commence le vestiaire de l'équipe première. Il s'arrête net devant la porte."+cfSay("vasseur","« Ici s'arrête mon couloir. Derrière cette porte, je n'ai plus aucune autorité. Il me reste un conseil, si tu le veux. »")
      :T("Premier jour dans ton nouveau club. Un stade de quartier, une tribune en béton, un vestiaire qui sent la peinture fraîche. Dans ton sac, {par} a cousu ton nom à l'intérieur de la poche, comme à l'école.")+cfSay("par","« Ce n'est pas le Racing, et alors ? Le ballon est le même. »"),
    ch:[
      {get t(){ return cfOut()==="valmont"?"Garder la lettre au fond de ton sac":cfPro(p.cf)?"« Je veux bien le conseil. »":T("Envoyer une photo du vestiaire à {mpar}"); },
        fx:{moral:()=>{ p.cf.mem.casier = "garde"; return 4; },form:2},
        get why(){ return cfOut()==="valmont"?"Elle ne quittera plus ton sac. Les soirs de défaite, tu la relis sans l'ouvrir : tu la connais par cœur.":cfPro(p.cf)?cfSay("vasseur","« Ton premier ballon, rends-le simple. Les gens se souviennent du deuxième. »")+"Il tourne les talons. Tu ne le vois pas sourire, mais tu l'entends.":T("La réponse arrive dans la minute : « Il est très bien, ce vestiaire. Garde ton nom bien cousu. » Une deuxième photo suit : ta chambre, que personne n'a touchée depuis ton départ."); }},
      {get t(){ return cfOut()==="valmont"?"La jeter : tu n'as besoin de personne":cfPro(p.cf)?"« Je vous rendrai fier. »":"Ne rien dire à personne, et te mettre au travail"; },
        fx:{form:3,moral:()=>{ p.cf.mem.casier = "seul"; return -1; }},
        get why(){ return cfOut()==="valmont"?"La poubelle du vestiaire. Le soir, tu reviens la chercher. Elle est encore là, un peu froissée.":cfPro(p.cf)?cfSay("vasseur","« Je ne te demande pas ça. Je te demande de durer. »")+"La porte se referme derrière toi.":"Premier arrivé, dernier parti. Le gardien du stade finit par te donner un double des clés."; }},
      {get t(){ return cfOut()==="valmont"?"Appeler Vasseur":cfPro(p.cf)?"Le serrer dans tes bras, sans rien dire":"Appeler Sacha"; },
        fx:{moral:()=>{ p.cf.mem.casier = "appel"; if(p.cf.sacha!=null&&!cfPro(p.cf)&&cfOut()!=="valmont") p.cf.sacha += 1; return 5; }},
        get why(){ return cfOut()==="valmont"?cfSay("vasseur","« Je t'ai écrit pour ne pas avoir à te parler. Mais bon. Mange bien. Dors. Et ne regarde jamais le banc. »")+"Il raccroche avant que tu aies répondu.":cfPro(p.cf)?"Il se raidit. Une seconde. Puis il te tape deux fois dans le dos, comme on tape sur une porte. « Allez. File. »":"« Tu sais quoi ? Un jour on jouera l'un contre l'autre en finale. Et je gagnerai. » Sacha rit. Toi aussi, enfin."; }}
    ]},
  {id:"cfSachaDuel",scene:"rival",weight:4,arc:[1,0],cond:()=>cfOnce("cfSachaDuel")&&!!p.rival?.cf&&rivalActive()&&p.seasons.length-(p.cf.s0??0)>=1&&(cfSameClubSacha()||p.rival.club.country===p.club.country),
    txt:()=>cfSameClubSacha()
      ?"Le coach réunit le groupe avant la reprise. Une seule place sur la feuille de match, à ton poste. Deux noms au tableau, l'un sous l'autre : le tien, et celui de Sacha. Comme au centre."+(p.cf.sacha>=1?cfSay("sacha","« On a déjà fait ça une fois. On sait faire. »"):cfSay("sacha","« Ça recommence. Tant mieux. »"))
      :`Le calendrier est sorti. Dans trois semaines, ${esc(p.club.name)} reçoit ${esc(p.rival.club.name)}. Toi contre Sacha, pour la première fois chez les pros. Les journaux ont déjà ressorti une photo de vous deux à seize ans, en survêtement du Racing.`+(p.cf.sacha>=1?cfSay("sacha","« Tu as vu la photo ? J'avais une tête de pomme de terre. Toi aussi. On dîne après le match ? »"):cfSay("sacha","« Tu as vu la photo ? Profite, c'est la dernière où tu es devant moi. »")),
    ch:[
      {t:"« Que le meilleur gagne. » Comme le premier jour",fx:{moral:4,rival:1,trust:()=>{ p.cf.sacha += 1; return 1; }},why:"Sacha répond par un pouce levé. Puis, une minute plus tard : « Toujours aussi naïf. » Tu souris."},
      {t:"Faire monter la pression dans la presse",fx:{rep:3,moral:2,trust:()=>{ p.cf.sacha -= 1; return -1; }},why:"« Au centre, je passais devant. Ça ne va pas changer. » La phrase fait la une. Sacha l'imprime et la colle dans son casier."},
      {t:"Ne rien dire, et travailler",fx:{form:3,lvl:()=>chance(.5)?1:0},why:"Trois semaines de séances supplémentaires. Le jour du match, tu ne penses plus à la photo."}
    ]},
  {id:"cfNinoLettre",scene:"perso",weight:4,arc:[1,1],cond:()=>cfOnce("cfNinoLettre")&&!!cfM().nino&&p.seasons.length-(p.cf.s0??0)>=1,
    txt:()=>`Une lettre arrive au club, une écriture d'enfant qui monte en diagonale. « C'est Nino. Celui du ballon dégonflé. J'ai onze ans maintenant. Mon entraîneur dit que je ${p.pos==="GB"?"plonge":"frappe"} comme toi. Est-ce que c'est vrai que tu ${cfM().nino==="modeste"?"disais que tu étais personne ? Parce que maintenant tu es quelqu'un":"te souviens de moi"} ? »`,
    ch:[
      {t:"Lui envoyer ton maillot, dédicacé",fx:{moral:4,rep:1,trust:()=>{ p.cf.mem.nino = "mot"; return 0; }},why:"« Pour Nino, toujours futur pro. » Trois semaines plus tard, une photo : le maillot lui descend jusqu'aux genoux. Il dort avec."},
      {t:"L'inviter à un match, avec sa famille",fx:{moral:6,money:-3,trust:()=>{ p.cf.mem.nino = "mot"; p.cf.mem.ninoMatch = true; return 1; }},why:"Il passe tout le match debout, la main sur le cœur à chaque fois que tu touches le ballon. Après, il te montre son vieux ballon. Il l'a apporté."},
      {t:"Pas le temps. La lettre finit dans un tiroir",fx:{form:1,trust:()=>{ p.cf.mem.nino = "oubli"; return 0; }},why:"Le tiroir se referme. Tu n'y penses plus. Presque plus."}
    ]},
  {id:"cfVasseurAppel",scene:"echo",weight:4,arc:[2,0],cond:()=>cfOnce("cfVasseurAppel")&&p.seasons.length-(p.cf.s0??0)>=2,
    txt:()=>"Ton téléphone sonne un mardi soir. Le numéro du centre du Racing. Tu n'avais pas entendu cette voix depuis longtemps."+cfSay("vasseur","« J'ai un gamin de seize ans qui veut tout arrêter. Il a raté un penalty à son essai, lui aussi. Il ne m'écoute pas. Toi, il t'écoutera peut-être. »"),
    ch:[
      {t:"Prendre le train dès demain",fx:{moral:6,form:-2,rep:1,trust:()=>{ p.cf.mem.vasseurAide = "venu"; return 0; }},why:"Vous parlez une heure sur le banc de touche, sous la pluie. Tu lui racontes ton penalty. Il ne dit rien. Le lendemain, il est à l'entraînement à huit heures."},
      {t:"Lui enregistrer un message vidéo",fx:{moral:3,trust:()=>{ p.cf.mem.vasseurAide = "video"; return 0; }},why:"Quarante secondes, enregistrées dans ta voiture. Vasseur t'écrit le soir même : « Il l'a regardée onze fois. Bon. »"},
      {t:"« Je ne peux pas, désolé. »",fx:{form:2,moral:-3,trust:()=>{ p.cf.mem.vasseurAide = "non"; return 0; }},why:"« Je comprends. » Il raccroche. Tu sais qu'il ne rappellera pas."}
    ]}
);
// la scène du fil due à ce moment de la saison (une par moment au plus), ou rien
function cfArcNext(){
  if(!p.cf||p.retired||p.daily||p.friend) return null;
  const idx = p.seasons.length-(p.cf.s0??0);
  return CF_EVENTS.find(e=>e.arc&&e.arc[0]===idx&&p.evIdx>=e.arc[1]&&!ui.seenThisSeason?.includes(e.id)&&e.cond())||null;
}
EVENTS.push(...CF_EVENTS);

/* ============ Le téléphone : ils t'écrivent ============ */
// ton proche a son propre fil ; Sacha écrit sur celui du rival ; Vasseur passe par les messages privés
CONTACTS.proche = {n:()=>p.cf?cfPar().appel:"Famille",i:()=>"👪"};
// après chaque saison, au plus un message de quelqu'un du centre, selon la saison et ce que vous avez vécu
function cfPhoneSeason(L){
  if(!p.cf||p.retired) return;
  const c = p.cf, first = p.seasons.length===1, rival = p.rival&&p.rival.cf&&!p.rival.retired;
  const who = first?"proche":pick(["proche","proche",rival?"sacha":"proche",p.age>=21&&L.tr.length?"vasseur":"proche"]);
  if(who==="proche"){
    const t = first?"Ton nom était dans le journal. Je l'ai découpé. Il est sur le frigo, à côté de la photo de l'essai, sous la pluie."
      :L.tr.length?"J'ai tout regardé. J'ai crié si fort que les voisins sont venus voir ce qui se passait. 🏆"
      :L.injury?"Tu manges bien ? Tu dors ? Ne reviens pas trop vite, s'il te plaît. Je te connais."
      :L.rank>=8?"Les journaux, je ne les lis pas. Je t'ai vu jouer à six ans sous la grêle. Je sais ce que tu vaux."
      :c.mem.appel==="promesse"&&p.money>=200&&!(p.used||{}).cfPromesse?"Tu sais que je n'attends rien, hein. Le « centuple », c'était pour rire. Enfin… à moitié 😄"
      :pick(["Tu viens manger dimanche ? Je fais ton plat. Pas de discussion.","Le gamin d'en face porte ton maillot. Il m'a demandé si je te connaissais. J'ai dit un peu.","Pense à appeler. Pas pour moi, hein. Pour toi."]);
    msg("proche",t,[
      {t:"« Je t'appelle ce soir. »",fx:{moral:3},r:T("Tu appelles. Une heure et demie. {Par} parle surtout de toi.")},
      {t:"« Merci. Pour tout. »",fx:{moral:2},r:"« Arrête, tu vas me faire pleurer. » Trop tard."},
      {t:"Un cœur, et c'est tout",fx:{},r:"Vu."}]);
  } else if(who==="sacha"){
    if(c.sacha>=1) msg("rival",pick(["Vu ton match. Le contrôle orienté, c'est moi qui te l'ai appris, rappelle-toi 😏","Toujours la même chambre que toi en déplacement, dans mes rêves. Ton ronflement me manque presque.","Tu te souviens de la mer, le premier soir ? J'y étais cet été. Pas pareil sans toi."]),[
      {t:"« Vacances ensemble cet été ? »",fx:{moral:4},r:"« Seulement si tu paies les glaces. »"},
      {t:"« Rendez-vous sur le terrain. »",fx:{moral:2,rival:1},r:"« Toujours. »"}]);
    else msg("rival","Bien joué ce week-end.",[
      {t:"« Merci. Et pardon, pour le centre. »",fx:{moral:()=>{ c.sacha += 2; return 5; }},r:"Trois points de suspension. Puis : « Il était temps. On se boit un café un de ces jours. »"},
      {t:"« Toi aussi. »",fx:{},r:"Rien d'autre. Jamais rien d'autre."}]);
  } else {
    msg("dm",`Rémi Vasseur : « ${pick(["Je l'ai regardé à la télé. J'ai noté.","Ton placement sur les phases arrêtées a progressé. Le reste aussi. Bon.","Un de mes gamins porte ton numéro. Je lui ai dit de choisir le sien."])} »`);
  }
}
// le choc face à Sacha : un message qui sait d'où vous venez
function cfPhoneRival(w){
  const c = p.cf; if(!c) return false;
  if(c.sacha>=1) msg("rival",w?"Bravo. Je te déteste ce soir. Demain ça ira mieux. 🫂":"Désolé pour ce soir. Bon… pas tant que ça 😄",[
    {t:"« La prochaine est pour moi. »",fx:{moral:2},r:"« On verra. Comme disait Vasseur. »"},
    {t:"« Dîner après le match retour ? »",fx:{moral:3},r:"« Seulement si le perdant paie. »"}]);
  else msg("rival",w?"Profite.":"Le tableau d'affichage, regarde-le bien.",[
    {t:"« Bien joué, sincèrement. »",fx:{moral:()=>{ c.sacha += 1; return 2; }},r:"Pas de réponse. Mais Sacha n'a pas bloqué ton numéro."},
    {t:"Ne pas répondre",fx:{},r:"Le silence, encore."}]);
  return true;
}

/* ============ Dans le bilan de saison : leur réaction aux grands moments ============ */
function cfSeasonCard(L){
  if(!p.cf||!L) return "";
  const c = p.cf, T0 = L.tr.join(" | "), firstTr = L.tr.length&&p.trophies.length===L.tr.length;
  let who = null, line = "";
  if(L.star){ who = "vasseur"; line = "« Ballon d'Étoile. J'ai rouvert le carnet à la page de ton essai. J'ai ajouté une ligne. »"; }
  else if(/Coupe des Champions|Championnat du Monde/.test(T0)){ who = "par"; line = "« Je n'ai pas réussi à regarder les dernières minutes. J'étais dans le couloir. Les voisins ont crié pour moi. »"; }
  else if(L.rival&&L.rival.note&&/Ballon/.test(L.rival.note)&&p.rival&&p.rival.cf){ who = "sacha"; line = c.mem.dil==="sacha"?"« Tu vois ? Il fallait me laisser ce penalty, à dix-huit ans. Ça porte chance. »":"« Ton tour viendra. Peut-être. »"; }
  else if(firstTr){ who = "par"; line = "« Ton premier trophée. Je l'ai pris en photo sur l'écran de la télé. Elle est floue. Je l'adore. »"; }
  return who?`<div class="card cf-react">${cfSay(who,line)}</div>`:"";
}
