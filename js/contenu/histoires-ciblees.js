// Trajectoire · Histoires ciblées : selon le pays, le niveau du club, la sélection, la fin de carrière,
// les anciens clubs, les légendes des carrières passées, et des suites qui reviennent des années plus tard
const AFRIQUE = ["SN","CI","MA"], LOIN = ["JP","US"];
const expat = ()=>p.club.country!==p.country;
EVENTS.push(
 /* --- Selon le pays --- */
 {id:"derbyVille",scene:"rival",cond:()=>!expat()&&p.age>=18,txt:()=>`Derby de la ville. Ton quartier est coupé en deux, et la moitié de ta famille supporte l'autre club.`,
  ch:[{t:"Promettre un but à ton quartier",risk:{p:()=>clamp(.4+(p.lvl-65)*.012,.2,.75),good:{rep:5,moral:7,moment:"Décisif dans le derby de sa ville",txt:"Tu marques et tu cours vers la tribune où se trouve ton quartier."},bad:{rep:-3,moral:-4,txt:"Défaite, et des messages moqueurs de ta propre famille."}}},
      {t:"Rester sobre dans les médias",fx:{trust:2,form:2},why:"Le coach apprécie ton calme."}]},
 {id:"coupeAfrique",scene:"selection",hint:"Une Coupe Continentale en plein milieu de saison…",cond:()=>AFRIQUE.includes(p.country)&&expat()&&p.caps>=1,
  txt:()=>`La Coupe Continentale se joue en janvier, en pleine saison. Le ${p.club.name} fait pression pour que tu déclines la convocation.`,
  ch:[{t:"Partir défendre ton pays",fx:{nat:10,rep:4,play:-8,trust:-4,moral:5},why:"Tout le pays te remercie. Ton club compte les jours."},
      {t:"Rester au club",fx:{nat:-12,trust:5,play:6,rep:-4},why:"La presse de ton pays te traite de mercenaire."}]},
 {id:"pionnier",scene:"medias",hint:"Être le premier de ton pays à réussir là-bas…",cond:()=>LOIN.includes(p.country)&&expat()&&p.age<=26,
  txt:()=>`Tu es le premier joueur de ${COUNTRIES[p.country].name} à briller dans ce championnat. Des millions de compatriotes regardent tes matchs en pleine nuit.`,
  ch:[{t:"Accepter le rôle d'ambassadeur",fx:{rep:5,money:150,form:-3},why:"Interviews, pubs, émissions : tu deviens un symbole."},
      {t:"Demander qu'on te laisse jouer",fx:{form:3,moral:2},why:"Tu te protèges, la ferveur continue sans toi."}]},
 {id:"malDuPays",scene:"perso",cond:()=>expat()&&p.age<=23,txt:()=>"Loin de chez toi, les soirées sont longues. Tu manges seul, tu ne comprends pas toutes les blagues du vestiaire.",
  ch:[{t:"Prendre des cours de langue intensifs",fx:{moral:4,trust:3,form:-2},why:"Trois mois plus tard, tu fais rire le vestiaire."},
      {t:"Faire venir un proche",fx:{moral:7,money:-40},why:"Une présence qui change tout."},
      {t:"Serrer les dents",fx:{moral:-5,lvl:1},why:"Tu te réfugies dans le travail."}]},
 {id:"footRoi",scene:"selection",cond:()=>["BR","AR"].includes(p.country)&&p.pos!=="GB"&&p.caps>=3&&p.lvl>=75,
  txt:()=>"Dans ton pays, le football est une religion. Après un match nul, une émission te désigne comme coupable devant 40 millions de téléspectateurs.",
  ch:[{t:"Répondre sur le terrain",risk:{p:.55,good:{rep:6,nat:6,txt:"Doublé au match suivant. Les mêmes chroniqueurs t'encensent."},bad:{rep:-4,nat:-6,txt:"Nouveau match terne. La pression devient étouffante."}}},
      {t:"Couper les réseaux et la télé",fx:{moral:4,rep:-1},why:"Tu retrouves un peu de calme."}]},
 {id:"fumigenes",scene:"terrain",cond:()=>p.club.country==="TR"||p.club.str>=80,txt:()=>"Match arrêté vingt minutes : les fumigènes ont envahi le terrain, l'arbitre menace de tout arrêter.",
  ch:[{t:"Aller calmer tes supporters",risk:{p:.6,good:{rep:4,trust:2,txt:"Le virage t'écoute. Le match reprend, la ligue te félicite."},bad:{moral:-3,txt:"Personne ne t'écoute. Huis clos au prochain match."}}},
      {t:"Rester avec le groupe au centre du terrain",fx:{form:1},why:"Le match finit par reprendre."}]},

 /* --- Selon le niveau du club --- */
 {id:"maintien",scene:"terrain",hint:"Une dernière journée pour sauver ton club…",cond:()=>p.club.str<=62&&p.age>=19,
  txt:()=>`Dernière journée. Le ${p.club.name} doit gagner pour se maintenir. Le stade est plein, la ville retient son souffle.`,
  ch:[{t:"Tout donner, même blessé",risk:{p:.5,good:{rep:6,moral:8,moment:()=>`Sauve le ${p.club.name} de la relégation lors de la dernière journée`,txt:"Victoire 1-0. Les supporters envahissent le terrain en larmes."},bad:{moral:-8,form:-6,txt:"Défaite. Relégation. Le silence du stade te hante."}}},
      {t:"Jouer prudemment",fx:{form:2},why:"Match nul. Le maintien se joue sur un autre terrain… et passe."}]},
 {id:"venteDirigeant",scene:"argent",cond:()=>p.club.str<=66&&p.age>=20,txt:()=>"Le président vend tes trois meilleurs coéquipiers le dernier jour du mercato. Le vestiaire est sonné.",
  ch:[{t:"Prendre la parole pour remobiliser le groupe",fx:{trust:4,rep:2,moral:-1},why:"Tu deviens le patron d'une équipe en reconstruction."},
      {t:"Demander à partir toi aussi",fx:{flag:"forceDepart",trust:-5},why:"Ton agent prospecte pour cet été."}]},
 {id:"galactique",scene:"vestiaire",cond:()=>p.club.str>=84&&p.age>=21,txt:()=>"Le club vient de recruter une star mondiale à ton poste pour 150 M€. Les journaux te voient déjà sur le banc.",
  ch:[{t:"Accepter la concurrence",fx:{lvl:1,form:-4,play:-4},why:"Chaque entraînement devient une finale."},
      {t:"Exiger des garanties de temps de jeu",risk:{p:.45,good:{play:8,txt:"Le coach te rassure : tu restes titulaire."},bad:{flag:"forceDepart",trust:-6,txt:"Le club préfère te vendre."}}}]},
 {id:"tourneeAsie",scene:"argent",cond:()=>p.club.str>=82,txt:()=>"Tournée d'été : quatre matchs, trois pays, dix jours. Les sponsors sont ravis, ton corps beaucoup moins.",
  ch:[{t:"Jouer le jeu à fond",fx:{rep:3,money:80,form:-8},why:"Des fans partout, des nuits courtes."},
      {t:"Demander à être ménagé",fx:{form:4,trust:-2},why:"Le service marketing grince des dents."}]},
 {id:"ultimatumPresident",scene:"vestiaire",cond:()=>p.club.str>=86&&p.age>=24,txt:()=>"Le président est clair devant tout le groupe : « Sans Coupe des Champions cette saison, je change tout. »",
  ch:[{t:"Prendre la pression pour toi",fx:{rep:3,moral:-3,form:2},why:"Tu deviens le visage du projet."},
      {t:"Détendre l'atmosphère",fx:{moral:3,trust:2},why:"Une blague dans le bus, et le groupe respire."}]},

 /* --- Sélection --- */
 {id:"premiereConvoc",scene:"selection",cond:()=>p.caps===0&&p.lvl>=66&&p.age>=19,txt:()=>"Ta première convocation en sélection… mais tu traînes une petite gêne à la cheville.",
  ch:[{t:"Y aller et le cacher",risk:{p:.6,good:{nat:12,moral:6,txt:"Tu joues 20 minutes. Ta mère pleure devant la télé."},bad:{form:-15,nat:-4,txt:"La cheville lâche à l'entraînement. Retour au club, déçu."}}},
      {t:"Prévenir le médecin de la sélection",fx:{nat:4,form:5},why:"Le sélectionneur apprécie ton honnêteté et te rappellera."}]},
 {id:"clanSelection",scene:"selection",cond:()=>p.caps>=5,txt:()=>"En stage de sélection, deux clans se sont formés : les joueurs de deux grands clubs rivaux ne se parlent plus.",
  ch:[{t:"Organiser une soirée pour réunir tout le monde",risk:{p:.6,good:{nat:6,rep:2,txt:"Karaoké, rires : le groupe se ressoude."},bad:{nat:-3,txt:"Personne ne vient. Ambiance glaciale."}}},
      {t:"Rester neutre",fx:{},why:"Le malaise continue sans toi."}]},
 {id:"brassardSelection",scene:"selection",cond:()=>p.caps>=40&&p.rep>=50&&!p.flags.capSel,txt:()=>"Le sélectionneur te propose le brassard de ton pays.",
  ch:[{t:"Accepter avec fierté",fx:{flag:"capSel",nat:8,rep:5,moral:6,moment:"Capitaine de sa sélection"},why:"Le plus bel honneur de ta carrière."},
      {t:"Le laisser à un plus ancien",fx:{rep:2,nat:2},why:"Le vestiaire salue ton humilité."}]},
 {id:"jeunePousseSel",scene:"selection",cond:()=>p.caps>=30&&p.age>=30,txt:()=>"Le sélectionneur annonce qu'il préfère lancer un jeune à ton poste pour le prochain tournoi.",
  ch:[{t:"L'accepter et aider le jeune",fx:{rep:3,moral:-2,nat:-4},why:"Tu restes dans le groupe, comme grand frère."},
      {t:"Contester publiquement",fx:{rep:-3,nat:-10,moral:2},why:"La fédération n'oublie pas."}]},
 {id:"retraiteInter",scene:"selection",hint:"Dire adieu à la sélection…",cond:()=>p.caps>=60&&p.age>=32&&!p.flags.retraiteInter,txt:()=>"Après tant de matchs avec ton pays, une question revient : faut-il laisser ta place pour prolonger ta carrière en club ?",
  ch:[{t:"Annoncer ta retraite internationale",fx:{flag:"retraiteInter",form:10,moral:3,nat:-40,moment:"Fait ses adieux à la sélection"},why:"Un dernier match, une haie d'honneur, et plus de repos en club."},
      {t:"Continuer tant qu'on t'appelle",fx:{nat:3,form:-3},why:"Le maillot de ton pays n'a pas de prix."}]},

 /* --- Fin de carrière --- */
 {id:"joker",scene:"vestiaire",cond:()=>p.age>=32,txt:()=>"Le coach te propose un nouveau rôle : joker de luxe, entrer en fin de match et encadrer les jeunes.",
  ch:[{t:"Accepter le rôle",fx:{trust:5,form:6,play:-6,rep:1},why:"Ton corps respire, ton influence grandit."},
      {t:"Te battre pour rester titulaire",fx:{form:-6,play:4},why:"Tu tiens bon, mais chaque match laisse des traces."}]},
 {id:"dernierDerby",scene:"rival",cond:()=>p.age>=33,txt:()=>"Ton dernier derby, sans doute. Les supporters adverses, qui t'ont sifflé quinze ans, préparent quelque chose.",
  ch:[{t:"Aller les saluer avant le match",risk:{p:.7,good:{rep:6,moral:8,moment:"Applaudi par les supporters adverses lors de son dernier derby",txt:"Ils t'applaudissent. Tu ne t'y attendais pas : tu as les larmes aux yeux."},bad:{moral:-3,txt:"Sifflets jusqu'au bout. Certaines choses ne changent pas."}}},
      {t:"Rester concentré sur le match",fx:{form:2},why:"Un derby reste un derby."}]},

 /* --- Anciens clubs --- */
 {id:"retourOvation",scene:"echo",hint:"Revenir dans un stade qui t'aime…",cond:()=>!!lovedClub(),txt:()=>`Premier retour au ${lovedClub().name}, ton ancien club. Le speaker annonce ton nom… et le stade entier se lève.`,
  ch:[{t:"Saluer chaque tribune",fx:{rep:4,moral:8,moment:()=>`Standing ovation pour son retour au ${lovedClub().name}`},why:"Un moment qui vaut tous les trophées."},
      {t:"Ne pas célébrer si tu marques",fx:{rep:3,moral:4},why:"Tu marques, mains levées en signe d'excuse. Les deux publics applaudissent."}]},
 {id:"retourSifflets",scene:"echo",hint:"Revenir dans un stade qui ne t'a pas pardonné…",cond:()=>!!hatedClub(),txt:()=>`Retour au ${hatedClub().name}. Les supporters n'ont pas digéré ton départ : faux billets à ton effigie, sifflets à chaque ballon.`,
  ch:[{t:"Leur répondre par un but",risk:{p:()=>clamp(.35+(p.lvl-70)*.015,.15,.7),good:{rep:4,moral:6,txt:"Tu marques et mets un doigt sur la bouche. Une image qui fera le tour du monde."},bad:{moral:-6,rep:-2,txt:"Tu passes à côté. Ils chantent ton nom… pour se moquer."}}},
      {t:"Les applaudir en partant",fx:{rep:3,moral:-1},why:"Un geste élégant. Certains finissent par applaudir aussi."}]},

 /* --- Légendes des carrières passées --- */
 {id:"legendeCoach",scene:"vestiaire",hint:"Une légende d'une autre génération…",cond:()=>!!p.legend&&p.age>=19&&!p.flags.legendeCoach,
  txt:()=>`Ton nouvel entraîneur ? ${p.legend.name}, une légende d'une autre génération : ${p.legend.trophies} trophées${p.legend.stars?`, ${p.legend.stars} Ballon(s) d'Étoile`:""}. Il te regarde à l'entraînement comme s'il se revoyait.`,
  ch:[{t:"Lui demander de t'apprendre",fx:{flag:"legendeCoach",lvl:1,pot:1,trust:5},why:"Il te prend sous son aile. Ses conseils valent de l'or."},
      {t:"Lui prouver que tu peux faire mieux que lui",risk:{p:.5,good:{flag:"legendeCoach",lvl:2,trust:3,txt:"Il sourit : « Enfin quelqu'un qui a faim. »"},bad:{flag:"legendeCoach",trust:-6,txt:"Il n'aime pas ton arrogance."}}}]},
 {id:"legendeRecord",scene:"medias",cond:()=>!!p.legend&&p.rep>=40&&p.legend.goals>50,
  txt:()=>`Les journaux comptent : tu pourrais battre le record de ${p.legend.name}, ${p.legend.goals} ${p.legend.pos==="GB"?"clean sheets":"buts"} en carrière.`,
  ch:[{t:"Dire que tu vas le battre",fx:{rep:3,moral:2,form:-2},why:"Le défi est lancé, la presse adore."},
      {t:"Dire ton respect pour lui",fx:{rep:2},why:"Il te remercie par message."}]},
 {id:"filsDuRival",scene:"rival",hint:"Le fils d'un vieil ennemi…",cond:()=>!!p.oldRival&&p.age>=21,
  txt:()=>`Le fils de ${p.oldRival.name} — l'ennemi intime de ${p.oldRival.by} — vient de signer dans ton club. Il a le même regard que son père.`,
  ch:[{t:"L'accueillir comme un frère",fx:{moral:3,trust:2,rep:2},why:"Une vieille rivalité devient une amitié."},
      {t:"Raviver la rivalité à l'entraînement",fx:{lvl:1,moral:-2},why:"Chaque séance devient un duel. Vous progressez tous les deux."}]},

 /* --- Départs particuliers --- */
 {id:"filsComparaison",scene:"medias",cond:()=>!!p.flags.filsLegende&&p.age<=23,txt:()=>"Encore une émission entière consacrée à « ce que tu n'as pas hérité de ton parent ».",
  ch:[{t:"En rire publiquement",fx:{rep:3,moral:2},why:"Ton autodérision désarme les critiques."},
      {t:"Changer de nom sur ton maillot",fx:{moral:4,rep:-1},why:"Tu veux exister pour toi-même."}]},
 {id:"prodigePression",scene:"medias",cond:()=>!!p.flags.prodige&&p.age<=20,txt:()=>"Couverture d'un grand magazine : « Le futur meilleur joueur du monde ». Tu as 17 ans.",
  ch:[{t:"Jouer le jeu des médias",fx:{rep:5,form:-4,moral:2},why:"Ta cote explose, ta concentration un peu moins."},
      {t:"Refuser toutes les interviews",fx:{form:3,rep:-1},why:"Ton club te protège."}]},

 /* --- Suites qui reviennent des années plus tard --- */
 {id:"clauseRetour",seedOnly:true,cond:()=>p.age<=33,txt:()=>"Le géant dont tu avais refusé l'offre revient. « Dernière chance », dit son président. Ton club actuel te supplie de rester.",
  ch:[{t:"Cette fois, partir",fx:{flag:"forceDepart",rep:3,moral:4},why:"Tu signeras cet été, sans regrets."},
      {t:"Rester, encore",fx:{rep:5,moral:3,moment:"Refuse deux fois le même géant"},why:"On parlera de toi comme d'un symbole."}]},
 {id:"racismeSuite",seedOnly:true,cond:()=>true,txt:()=>"Le coéquipier pour qui tu avais quitté le terrain est devenu capitaine de sa sélection. Dans un documentaire, il raconte ce soir-là.",
  ch:[{t:"Témoigner à ses côtés",fx:{rep:5,moral:6},why:"Le documentaire bouleverse le pays."},
      {t:"Le remercier par message",fx:{moral:4},why:"« Je n'oublierai jamais », te répond-il."}]},
 {id:"taupeSuite",seedOnly:true,cond:()=>p.age<=36,txt:()=>"Le coéquipier que tu avais accusé à tort d'être la taupe est devenu… ton entraîneur.",
  ch:[{t:"Lui présenter des excuses",fx:{trust:6,moral:3},why:"« J'ai attendu longtemps », dit-il. Puis il te serre la main."},
      {t:"Faire comme si de rien n'était",fx:{trust:-10,play:-8},why:"Il n'a rien oublié."}]},
 {id:"ultrasSuite",seedOnly:true,cond:()=>true,txt:()=>"Le chef des ultras avec qui tu avais discuté ce soir-là t'invite à une fête de quartier organisée par le virage.",
  ch:[{t:"Y aller",fx:{rep:4,moral:5},why:"Le virage déploie une banderole géante pour toi au match suivant."},
      {t:"Décliner poliment",fx:{},why:"Il comprend. Les chants pour toi continuent."}]},
 {id:"starRancune",seedOnly:true,cond:()=>true,txt:()=>"La star à qui tu avais repris le ballon du penalty joue désormais dans un club rival. En conférence, il parle encore de toi.",
  ch:[{t:"L'inviter à boire un café",fx:{moral:3,rep:2},why:"Vous riez de cette histoire. Une photo de vous deux fait le buzz."},
      {t:"Lui répondre en conférence",fx:{rep:2,moral:-1},why:"Le match suivant entre vos clubs devient le plus regardé de l'année."}]},
 {id:"provocSuite",seedOnly:true,cond:()=>p.caps>=1,txt:()=>"Le défenseur qui t'avait fait exclure en finale vient d'être naturalisé : il rejoint ta sélection.",
  ch:[{t:"Faire la paix",fx:{nat:4,moral:2},why:"Sur le terrain, vous devenez complémentaires."},
      {t:"Refuser de lui serrer la main",fx:{nat:-6,rep:-2},why:"Le sélectionneur est furieux."}]}
);
// les suites accrochées aux histoires du foot réel
addSeed("clause",1,null,"clauseRetour",[3,6]);
addSeed("racisme",0,null,"racismeSuite",[3,7]);
addSeed("taupe",0,"bad","taupeSuite",[4,8]);
addSeed("ultras",1,"good","ultrasSuite",[2,5]);
addSeed("tireurDesigne",1,"good","starRancune",[2,5]);
addSeed("provoc",1,"bad","provocSuite",[2,5]);
