// Trajectoire · Histoires en plusieurs épisodes (suites sur plusieurs saisons) et variantes de texte des événements courants
/* ============ Histoires en plusieurs épisodes ============ */
// Chaque épisode « seedOnly » n'arrive que comme suite d'un choix précédent, quelques saisons plus tard.
EVENTS.push(
 // une gêne musculaire qui ne veut pas partir
 {id:"ischios",cond:()=>p.age>=20&&!p.flags.ischios,weight:.6,txt:()=>"Une petite gêne derrière la cuisse depuis deux semaines. Le staff médical te laisse décider.",
  ch:[{t:"Serrer les dents et jouer",risk:{p:()=>p.trait==="athl"||has("acier")?.7:.5,good:{play:3,trust:2,txt:"La douleur finit par partir d'elle-même."},bad:{form:-6,flag:"ischios",seed:{ev:"ischiosRechute",d:[1,2]},txt:"Ça tient… pour l'instant. Le kiné fronce les sourcils."}}},
      {t:"Trois semaines de repos complet",fx:{play:-5,form:6},why:"Frustrant, mais la cuisse est neuve."},
      {t:"Consulter un spécialiste réputé",fx:{money:-25,form:4},why:"Un programme sur mesure. Tu n'en entendras plus parler."}]},
 {id:"ischiosRechute",seedOnly:true,cond:()=>true,txt:()=>"La gêne aux ischios est revenue, plus forte. Cette fois, tu sors sur civière à la 20e minute.",
  ch:[{t:"Se faire opérer et prendre le temps",fx:{play:-20,form:-10,unflag:"ischios",seed:{ev:"ischiosRetour",d:[1,1]}},why:"Six mois loin des terrains. La rééducation commence."},
      {t:"Infiltration et retour express",risk:{p:.45,good:{play:-4,unflag:"ischios",txt:"Miracle : la cuisse tient, et toi aussi."},bad:{play:-25,lvl:-2,form:-18,moment:"Saison gâchée par une blessure à répétition",txt:"Nouvelle déchirure. La saison est finie."}}},
      {t:"Revoir toute ta préparation : yoga, sommeil, nutrition",fx:{play:-8,form:4,lvl:-1,unflag:"ischios",flag:"prepaPro"},why:"Lent, mais ton corps change en profondeur."}]},
 {id:"ischiosRetour",seedOnly:true,cond:()=>true,txt:()=>"Après des mois de rééducation, ton nom réapparaît sur la feuille de match. Tout le stade se lève quand tu entres.",
  ch:[{t:"Jouer libéré, sans y penser",risk:{p:.6,good:{moral:10,rep:4,moment:"Retour gagnant après une longue blessure",txt:"Première action, premier ballon décisif. Le stade chavire."},bad:{moral:-3,txt:"Un peu rouillé. Ça reviendra."}}},
      {t:"Y aller progressivement",fx:{moral:4,form:4},why:"Vingt minutes, puis quarante, puis un match entier. Sans rechute."}]},

 // le gamin que tu parraines
 {id:"pepite",cond:()=>p.age>=27&&!p.flags.pepite,txt:()=>"Un gamin de 16 ans du centre de formation reste chaque soir te regarder frapper au but. Il finit par oser te demander des conseils.",
  ch:[{t:"Le prendre sous ton aile",fx:{moral:4,flag:"pepite",seed:{ev:"pepiteDebuts",d:[2,3]}},why:"Vous restez une heure de plus après chaque séance."},
      {t:"Lui donner un conseil, et filer",fx:{moral:1},why:"« Travaille ton mauvais pied. » Il hoche la tête."}]},
 {id:"pepiteDebuts",seedOnly:true,cond:()=>true,txt:()=>"Ton protégé fait ses débuts professionnels… à ton poste. Le coach hésite entre vous deux.",
  ch:[{t:"Lui laisser sa chance, même si tu perds ta place",fx:{play:-8,rep:4,moral:3,seed:{ev:"pepiteStar",d:[2,4]}},why:"Les supporters saluent ton élégance."},
      {t:"Garder ta place coûte que coûte",fx:{play:6,form:-4,moral:-2},why:"Tu gagnes la bataille. Lui part en prêt, un peu déçu."}]},
 {id:"pepiteStar",seedOnly:true,cond:()=>true,txt:()=>"Ton ancien protégé est devenu une star. En direct à la télé, après un doublé, il te dédie ses buts : « Sans lui, je ne serais rien. »",
  ch:[{t:"L'appeler pour le féliciter",fx:{moral:10,rep:4,moment:"Son ancien protégé devient une star et lui rend hommage"},why:"Vous parlez une heure. Comme au centre, il y a quelques années."}]},

 // le club racheté
 {id:"rachat",cond:()=>p.club.str<=78&&p.age>=19&&!p.flags.rachat,weight:.6,txt:()=>`Un fonds d'investissement étranger veut racheter le ${p.club.name}. Les supporters sont divisés.`,
  ch:[{t:"Soutenir publiquement le projet",fx:{flag:"rachat",trust:3,seed:{ev:"rachatSuite",d:[1,2]}},why:"Les nouveaux propriétaires te remercient en privé."},
      {t:"Exprimer tes inquiétudes",fx:{flag:"rachat",rep:3,trust:-2},why:"Le virage déploie une banderole à ton nom."},
      {t:"Rester en dehors de tout ça",fx:{flag:"rachat"},why:"Tu te concentres sur le terrain."}]},
 {id:"rachatSuite",seedOnly:true,cond:()=>!p.loanFrom,txt:()=>`Un an après le rachat du ${p.club.name}, les nouveaux propriétaires dévoilent leurs ambitions.`,
  ch:[{t:"Croire au projet et prolonger",risk:{p:.6,good:{clubStr:6,salary:1.25,moral:6,moment:()=>`Le ${p.club.name} change de dimension après son rachat`,txt:"Des stars signent, le stade est rénové : ton club joue désormais dans la cour des grands."},bad:{clubStr:-5,moral:-6,txt:"Le projet était un mirage : les investisseurs vendent tout et le club s'effondre."}}},
      {t:"Demander à partir avant qu'il soit trop tard",fx:{flag:"forceDepart",trust:-4},why:"Ton agent prospecte."}]},

 // le coach qui ne compte plus sur toi
 {id:"coachFroid",cond:()=>p.age>=20&&p.rel&&p.rel.trust<40&&!p.flags.coachFroid,txt:()=>"Le coach ne te dit plus bonjour. Tu apprends ta mise sur le banc par la feuille de match affichée au vestiaire.",
  ch:[{t:"Exiger une explication en tête-à-tête",fx:{flag:"coachFroid",trust:-3,seed:{ev:"coachFroidSuite",d:[1,1]}},why:"L'entretien est glacial. Il reste sur ses positions."},
      {t:"Faire ton trou en silence",fx:{flag:"coachFroid",trust:6,form:-3},why:"Tu bosses, il finit par le voir."}]},
 {id:"coachFroidSuite",seedOnly:true,cond:()=>true,txt:()=>"Le président te convoque : « Le coach ou toi, l'un des deux est de trop. Qu'en penses-tu ? »",
  ch:[{t:"Soutenir le coach malgré tout",fx:{trust:15,rep:2},why:"Il l'apprend. Le lendemain, il te rend ta place."},
      {t:"Dire au président ce que tu penses",risk:{p:.5,good:{trust:50,play:8,moment:"Pèse sur le départ de son entraîneur",txt:"Le coach est remercié. Son remplaçant fait de toi un pilier."},bad:{play:-12,flag:"forceDepart",txt:"Le président choisit le coach. Tu es invité à te trouver un autre club."}}},
      {t:"Demander à partir",fx:{flag:"forceDepart",moral:-2},why:"Tu ne veux plus de cette ambiance."}]},

 // le face-à-face télévisé avec le rival
 {id:"rivalPlateau",seedOnly:true,cond:()=>rivalActive(),txt:()=>`Après votre passe d'armes dans la presse, une chaîne de télé vous invite, toi et ${RN()}, sur le même plateau.`,
  ch:[{t:"Y aller et jouer le jeu",risk:{p:()=>has("charisme")?.75:.5,good:{rep:6,moral:4,moment:()=>`Duel télévisé mémorable face à ${p.rival.name}`,txt:"Tu le désarmes d'une réplique. Le clip dépasse les dix millions de vues."},bad:{rep:-3,moral:-4,txt:"Il a les meilleures répliques. Les réseaux se moquent de toi."}}},
      {t:"Refuser et le laisser parler seul",fx:{moral:1},why:"Il parle de toi pendant vingt minutes. Ça en dit long."}]}
);
addSeed("rivalPresse",2,"good","rivalPlateau",[1,2]);

/* ============ Variantes de texte ============ */
// Les événements qui reviennent souvent changent de mise en scène d'une fois sur l'autre.
const ALT = {
  coach:["Le coach t'arrête à la sortie de la séance vidéo : « Je te trouve en dedans en ce moment. »","Devant tout le groupe, le coach te prend en exemple… de ce qu'il ne faut pas faire à l'entraînement."],
  soiree:["Un coéquipier fête son contrat dans un rooftop, trois jours avant un match capital.","Ton cousin se marie le samedi soir. Le match a lieu le dimanche à 13 h."],
  cuisse:["Un coup reçu sur le mollet à l'échauffement. Ça tire à chaque accélération.","Ton adducteur se rappelle à toi dans le tunnel, juste avant d'entrer sur le terrain."],
  bagarre:["Le ton monte entre deux cadres à l'entraînement. Un coup de poing part.","Dans le bus du retour, deux coéquipiers s'empoignent après une défaite."],
  nutri:["Le nouveau préparateur affiche ton taux de masse grasse au tableau. Tout le monde rigole, sauf toi.","Le club engage une cheffe étoilée : régime strict pour tout l'effectif."],
  arbitre:["Deuxième carton jaune pour une main involontaire. En zone mixte, tu ne te retiens pas.","L'arbitre ne siffle pas un penalty flagrant. À la mi-temps, tu l'attends dans le couloir."],
  canicule:["Match à 15 h en plein été : la pelouse brûle sous les crampons.","Coupure fraîcheur toutes les vingt minutes : il fait 37 °C dans le stade."],
  insomnie:["La veille du match, le chant des supporters adverses sous ta fenêtre d'hôtel t'empêche de dormir.","Deux heures du matin, et ton cerveau rejoue le dernier match en boucle."],
  maillotFan:["Une petite fille t'attend au bord du terrain avec une pancarte : « Ton maillot STP ! »","Au bord de la pelouse, un gamin en fauteuil te tend un feutre et son plâtre à signer."],
  neige:["Il a neigé toute la nuit : le terrain ressemble à une piste de ski.","Flocons énormes, lignes à peine visibles : le match est maintenu."],
  var:["La VAR met quatre minutes à annuler ton but. Le stade gronde.","But accordé, puis annulé : l'arbitre a vu une faute imaginaire à la vidéo."],
  nouveauCoach:["Après une série noire, le président change d'entraîneur. Le nouveau arrive avec ses propres idées.","Ton entraîneur part dans un club plus huppé. Son successeur débarque de l'étranger."],
  sifflets:["Ton propre virage déploie une banderole contre toi après une série de matchs ratés.","À chaque ballon touché, des sifflets descendent de ta propre tribune."],
  console:["Le tournoi de jeu vidéo du vestiaire dure jusqu'à quatre heures du matin.","Tu viens d'acheter la nouvelle console : les nuits raccourcissent dangereusement."]
};
for(const [id,alt] of Object.entries(ALT)){ const e = EVENTS.find(x=>x.id===id); if(e) e.alt = alt; }
// texte affiché : l'original la première fois, puis une variante à chaque nouvelle occurrence
function evText(e){
  const v = [e.txt,...(e.alt||[])], t = v[(p.used[e.id]||0)%v.length];
  return typeof t==="function"?t():t;
}
