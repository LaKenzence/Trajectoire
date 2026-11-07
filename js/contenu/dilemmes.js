// Trajectoire · Dilemmes de la carrière vivante : souvenirs qui reviennent, course au titre, style du coach, vrais choix
// Chaque option coûte quelque chose. Les souvenirs citent mot pour mot un choix fait des saisons plus tôt (p.memo, vivant.js).

// où en est la course au moment présent (classement provisoire de vivant.js)
function raceNow(){
  if(typeof raceTable!=="function"||!p||!p.club) return null;
  const rows = raceTable(RACE_DAYS[Math.min(p.evIdx||0,2)]), me = rows.find(r=>r.me);
  if(!me) return null;
  const obj = clubObjective(p.club.str), line = rows[obj.line-1];
  return {pos:me.pos,n:rows.length,top2:me.pos<=2&&Math.abs(rows[0].pts-rows[1].pts)<=6,bottom:me.pos>=rows.length-2&&me.pts-rows[rows.length-1].pts<=5,behind:obj.ok(me.pos)?0:line.pts-me.pts,leader:rows[0].me?rows[1]:rows[0]};
}
// un souvenir choisi au moment où l'événement s'affiche (puis marqué comme revenu)
function memoFor(tag){
  if(p.memoCur&&p.memoCur.tag===tag&&p.memoCur.y===p.memoCurY) return p.memoCur;
  const m = memoPick(tag); if(!m) return null;
  p.memoCur = m; p.memoCurY = m.y; memoDone(m);
  return m;
}
const ago = m=>{ const n = p.year-m.y; return n<=1?"la saison dernière":`il y a ${n} saisons`; };
const raceBonus = v=>()=>{ if(p.race) p.race.bonus += v; return 0; };

EVENTS.push(
 /* ---------- Les souvenirs qui reviennent ---------- */
 {id:"echoMercenaire",scene:"echo",cond:()=>!!memoPick("mercenaire")&&p.clubsHist.length>=2,
  txt:()=>{ const m = memoFor("mercenaire"); return `À la sortie du stade, un supporter du ${esc(m.club)} t'attend, ton ancien maillot sur le dos : « Tu te souviens ? ${ago(m)}, tu as choisi : « ${esc(m.t)} ». Nous, on n'a pas oublié. »`; },
  ch:[{t:"Assumer : c'est ton métier",fx:{moral:2,rep:-2},why:"Il crache par terre. Tu dors très bien quand même."},
      {t:"Lui signer son maillot et t'excuser",fx:{rep:3,moral:-2},why:"La vidéo tourne : « Le geste classe de l'année. »"},
      {t:"Financer le centre de formation de ton ancien club",cond:()=>p.money>=150,fx:{money:()=>-Math.round(Math.max(100,p.money*.08)),rep:6,moral:4},why:"Les supporters déploient une banderole à ton nom. La page est tournée."}]},
 {id:"echoLoyal",scene:"echo",cond:()=>!!memoPick("loyal"),
  txt:()=>{ const m = memoFor("loyal"); return `${ago(m)[0].toUpperCase()+ago(m).slice(1)}, au ${esc(m.club)}, tu as choisi : « ${esc(m.t)} ». Le président s'en souvient : il veut faire de toi l'ambassadeur du club, avec un rôle à vie après ta carrière.`; },
  ch:[{t:"Accepter, la main sur le cœur",fx:{moral:7,rep:3,flag:"ambassadeur"},why:"Ton nom est gravé sur le mur du centre d'entraînement."},
      {t:"Négocier une vraie part au club",fx:{money:()=>Math.round(p.rep*8),rep:-2},why:"Signé, mais certains trouvent que tu as fait payer ta fidélité."},
      {t:"Refuser : tu veux garder ta liberté",fx:{moral:-2},why:"Il comprend. La porte reste ouverte."}]},
 {id:"echoDiva",scene:"echo",cond:()=>!!memoPick("diva"),
  txt:()=>{ const m = memoFor("diva"); return `Un documentaire sur ta carrière ressort ton coup d'éclat : ${ago(m)}, tu as choisi « ${esc(m.t)} ». Sur les réseaux, deux camps s'affrontent : « génie incompris » contre « enfant gâté ».`; },
  ch:[{t:"En rire et en faire une pub",fx:{money:()=>Math.round(p.rep*6),rep:2,trust:-3},why:"La pub cartonne. Ton coach lève les yeux au ciel."},
      {t:"Reconnaître que tu étais immature",fx:{rep:4,moral:-1,trust:4},why:"« Il a grandi », titre la presse."},
      {t:"Ne rien dire et répondre sur le terrain",risk:{p:()=>clamp(.4+(p.lvl-70)*.015,.2,.8),good:{rep:6,moral:5,txt:"Doublé le week-end suivant. Le débat est clos."},bad:{rep:-3,moral:-3,txt:"Match raté. Les moqueries redoublent."}}}]},
 {id:"echoLeader",scene:"echo",cond:()=>!!memoPick("leader")&&!!p.rel,
  txt:()=>{ const m = memoFor("leader"); return `${ago(m)[0].toUpperCase()+ago(m).slice(1)}, tu as choisi : « ${esc(m.t)} ». Le coéquipier que tu avais aidé ce jour-là est devenu entraîneur adjoint, ici. Il glisse au coach que tu es « le vrai patron du vestiaire ».`; },
  ch:[{t:"Le remercier, discrètement",fx:{trust:8,moral:3},why:"Le coach te regarde autrement."},
      {t:"Demander le brassard dans la foulée",risk:{p:()=>clamp(.35+(p.rel.trust-50)*.012+qd("lea")*.02,.15,.85),good:{flag:"cap",trust:6,rep:4,txt:"Le brassard est à toi."},bad:{trust:-6,txt:"« Pas si vite. » L'adjoint est gêné."}}}]},
 {id:"echoPro",scene:"echo",cond:()=>!!memoPick("pro")&&p.age>=27,
  txt:()=>{ const m = memoFor("pro"); return `Ton préparateur physique ressort ses carnets : ${ago(m)}, tu as choisi « ${esc(m.t)} ». « C'est pour ça que ton corps tient encore à ${p.age} ans », dit-il. Il te propose un programme pour durer.`; },
  ch:[{t:"Suivre le programme à la lettre",fx:{form:8,moral:-1,lvl:()=>p.age>=31?1:0},why:"Plus de pâtes, plus de sommeil, moins de tout le reste. Ça marche."},
      {t:"Garder tes habitudes",fx:{moral:3},why:"Tu connais ton corps. Pour l'instant."}]},
 {id:"echoFetard",scene:"echo",cond:()=>!!memoPick("fetard"),
  txt:()=>{ const m = memoFor("fetard"); return `Des photos refont surface : ${ago(m)}, la fameuse nuit où tu avais choisi « ${esc(m.t)} ». Un tabloïd les publie la veille d'un match important.`; },
  ch:[{t:"Faire ton mea culpa",fx:{rep:-1,trust:4,moral:-3},why:"Le coach apprécie. Les sponsors respirent."},
      {t:"Dire que c'est ta vie privée",fx:{rep:-4,moral:2},why:"Les supporters sont partagés. Le club, lui, est furieux."},
      {t:"Marquer et dédier le but aux paparazzis",cond:()=>p.pos!=="GB",risk:{p:()=>clamp(.35+(p.lvl-70)*.015,.15,.75),good:{rep:6,moral:6,txt:"But, doigt sur la bouche. Les photos sont oubliées."},bad:{rep:-5,trust:-5,txt:"Rien ne va. Les photos tournent en boucle."}}}]},

 /* ---------- La course au titre ---------- */
 {id:"titreBlesse",scene:"sante",cond:()=>{ const r = raceNow(); return !!r&&r.top2&&p.evIdx>=1; },
  txt:()=>`Ton club est ${raceNow().pos===1?"en tête":"deuxième"} et la course au titre se joue à rien. Mais ta cuisse tire. Le médecin est clair : quinze jours de repos, sinon c'est la déchirure.`,
  ch:[{t:"Jouer quand même avec une infiltration",risk:{p:()=>clamp(.5+qd("phy")*.02,.25,.8),good:{moral:6,rep:4,play:6,lvl:raceBonus(2),txt:"Tu tiens. Tu es décisif. Les supporters scandent ton nom."},bad:{form:-18,moral:-6,flag:"fragile",lvl:raceBonus(-1),txt:"Claquage à la 20e. Tu sors en larmes."}}},
      {t:"Écouter le médecin",fx:{form:10,play:-8,lvl:raceBonus(-1)},why:"Ton club perd des points sans toi. Mais tu reviens frais pour le sprint."},
      {t:"Négocier : entrer seulement en fin de match",fx:{form:2,play:-3,trust:-2,lvl:raceBonus(.5)},why:"Un entre-deux qui ne satisfait personne, mais qui préserve tout le monde."}]},
 {id:"criseVestiaire",scene:"vestiaire",cond:()=>{ const r = raceNow(); return !!r&&r.behind>=4&&p.evIdx>=1&&p.age>=19; },
  txt:()=>`Le club est à ${raceNow().behind} points de son objectif. Réunion de crise entre joueurs, sans le staff. Tout le monde regarde ses chaussures.`,
  ch:[{t:"Prendre la parole devant le groupe",risk:{p:()=>clamp(.35+qd("lea")*.03+(p.age-20)*.02,.15,.85),good:{trust:8,moral:5,rep:3,lvl:raceBonus(2),moment:"Le discours qui a relancé la saison",txt:"Ton discours retourne le vestiaire. Trois victoires de suite."},bad:{moral:-4,rep:-2,txt:"On t'écoute poliment. Rien ne change."}}},
      {t:"Défendre le coach, publiquement",fx:{trust:10,rep:-2},why:"Le coach n'oubliera pas. Certains coéquipiers, si."},
      {t:"Dire tout haut que la tactique est mauvaise",fx:{trust:-12,rep:3,moral:2},why:"Les journalistes adorent. Le coach te regarde comme un traître."}]},
 {id:"releguable",scene:"vestiaire",cond:()=>{ const r = raceNow(); return !!r&&r.bottom&&p.age>=20&&p.lvl>=p.club.str; },
  txt:()=>`Ton club est dans la zone rouge. Ton agent t'appelle : « Un club du haut du tableau te veut en janvier. Si tu restes, tu risques de descendre avec eux. »`,
  ch:[{t:"Rester et te battre pour le maintien",fx:{rep:5,moral:-2,trust:6,lvl:raceBonus(2),moment:"A refusé de quitter le navire dans la tempête"},why:"Le capitaine te serre dans ses bras. Le combat commence."},
      {t:"Pousser pour partir au plus offrant",fx:{money:()=>Math.round(p.salary*.3),rep:-5,trust:-10},why:"Le club te met au placard en attendant. Ton agent sourit."},
      {t:"Attendre la fin de saison pour décider",fx:{moral:-3},why:"Tu joues avec une boule au ventre."}]},
 {id:"titreRival",scene:"rival",cond:()=>{ const r = raceNow(); return !!r&&r.top2&&rivalActive()&&r.leader&&p.rival.club.name===r.leader.n; },
  txt:()=>`Coïncidence cruelle : le ${esc(p.rival.club.name)}, ton concurrent direct pour le titre, est le club de ${esc(p.rival.name)}. Il te provoque en interview : « Le titre, il est pour nous. Lui, il regardera. »`,
  ch:[{t:"Lui répondre sèchement",fx:{rep:3,moral:4,trust:-2,rival:-1},why:"Le choc est lancé. Toute la presse en parle."},
      {t:"Le féliciter pour sa saison",fx:{rep:2,moral:-1},why:"Classe. Mais il en rit avec ses coéquipiers."},
      {t:"Ne rien dire, travailler en silence",fx:{form:4,lvl:raceBonus(1)},why:"Tes coéquipiers prennent exemple."}]},

 /* ---------- Le style du coach ---------- */
 {id:"coachNouveau",scene:"vestiaire",cond:()=>!!p.rel?.coach?.fresh&&p.evIdx===0,
  txt:()=>{ const k = p.rel.coach, s = COACH_STYLES[k.style]; return `Ton nouveau coach, ${esc(k.name)}, te convoque dans son bureau. ${s.i} ${s.n} : « ${s.d} Je veux savoir où tu te situes. »`; },
  ch:[{t:"Lui promettre un travail irréprochable",fx:{trust:7,form:2},why:"Il note quelque chose dans son carnet. C'est bon signe."},
      {t:"Lui dire franchement ce que tu attends",fx:{trust:2,moral:3,rep:1},why:"« Au moins, c'est clair. » Le respect s'installe."},
      {t:"Exiger une place de titulaire",fx:{trust:-8,play:5},why:"Il te titularise… et t'attend au tournant."}]},
 {id:"coachDur",scene:"vestiaire",cond:()=>p.rel?.coach?.style==="dur",
  txt:()=>`Le sergent te sort à la mi-temps, devant tout le stade, pour « manque d'engagement ». Dans le vestiaire, il hurle ton nom.`,
  ch:[{t:"Serrer les dents et bosser deux fois plus",fx:{lvl:1,moral:-4,trust:4},why:"Tu le détestes. Tu progresses."},
      {t:"Lui répondre devant tout le monde",fx:{trust:-12,moral:4,rep:2},why:"Le vestiaire est stupéfait. Le coach, glacial."},
      {t:"Demander un entretien en tête à tête",fx:{trust:5,moral:1},why:"« Je suis dur parce que tu peux aller plus haut. »"}]},
 {id:"coachJeunes",scene:"vestiaire",cond:()=>p.rel?.coach?.style==="jeunes"&&p.age>=28,
  txt:()=>`Le formateur titularise un gamin de 18 ans à ta place. « Il est l'avenir, tu es le présent. Mais l'avenir commence maintenant. »`,
  ch:[{t:"Le prendre sous ton aile",fx:{protege:1,trust:6,play:-4,moral:2},why:"Le gamin t'appelle « le grand ». Le coach est conquis."},
      {t:"Te battre pour reprendre ta place",risk:{p:()=>clamp(.45+(p.lvl-p.club.str)*.03+qd("phy")*.02,.15,.85),good:{play:8,moral:4,txt:"Tu rappelles à tout le monde qui tu es."},bad:{play:-8,moral:-5,txt:"Le gamin est meilleur. Tout le monde le voit."}}},
      {t:"Demander à partir",fx:{trust:-10,money:()=>Math.round(p.salary*.15)},why:"Ton agent s'active. Le coach ne te retient pas."}]},
 {id:"coachOffensif",scene:"terrain",cond:()=>p.rel?.coach?.style==="offensif"&&p.pos!=="GB",
  txt:()=>`Le romantique veut te voir jouer plus haut : « Oublie tes tâches défensives, je veux du spectacle ! » Les supporters adorent. Le capitaine, beaucoup moins.`,
  ch:[{t:"Foncer : le spectacle avant tout",fx:{rep:4,play:4,moral:3,form:-3},why:"Tu te régales. L'équipe prend plus de buts."},
      {t:"Garder ton équilibre",fx:{trust:-3,lvl:1},why:"Le coach soupire. Ton jeu, lui, mûrit."}]},
 {id:"coachTacticien",scene:"vestiaire",cond:()=>p.rel?.coach?.style==="tacticien",
  txt:()=>`Séance vidéo de trois heures, rien que sur tes erreurs de placement. Le tacticien met sur pause à chaque fois : « Là. Et là. Encore là. »`,
  ch:[{t:"Prendre des notes et demander plus",fx:{lvl:1,trust:6,moral:-2},why:"« Enfin quelqu'un qui écoute. » Tu progresses."},
      {t:"Lever les yeux au ciel",fx:{trust:-8,moral:2},why:"Il éteint l'écran. Silence de mort."}]},
 {id:"coachPere",scene:"vestiaire",cond:()=>p.rel?.coach?.style==="pere",
  txt:()=>`Ton erreur a coûté le match. En conférence de presse, le grand frère prend tout sur lui : « C'est ma faute, pas la sienne. »`,
  ch:[{t:"Le remercier en privé",fx:{trust:6,moral:4},why:"Vous vous comprenez sans un mot."},
      {t:"Assumer publiquement ton erreur",fx:{rep:4,trust:8,moral:-2},why:"« Voilà un homme », écrit la presse. Le vestiaire aussi."},
      {t:"Laisser couler",fx:{moral:2,trust:-2},why:"Ça passe. Mais il retient."}]},

 /* ---------- De vrais choix, où tout coûte ---------- */
 {id:"naissance",scene:"perso",cond:()=>!!p.flags.couple&&p.evIdx===2&&p.age>=22,
  txt:()=>`Le terme tombe le jour du match clé de la saison. Ta moitié te regarde : « Je comprendrai, quoi que tu choisisses. » Ce n'est pas vrai, et vous le savez tous les deux.`,
  ch:[{t:"Être à la maternité, quoi qu'il arrive",fx:{kid:1,moral:10,trust:-8,play:-10},why:"Tu tiens ton enfant dans tes bras pendant que ton équipe joue sans toi."},
      {t:"Jouer le match et filer juste après",fx:{kid:1,moral:-6,trust:5},why:"Tu arrives deux heures trop tard. On te pardonnera. Un jour."},
      {t:"Demander au coach de te faire entrer en fin de match",risk:{p:.5,good:{kid:1,moral:6,trust:2,txt:"Tu joues vingt minutes, tu files, tu arrives à temps. Miracle."},bad:{kid:1,moral:-4,trust:-4,txt:"Bouchons. Tu rates les deux."}}}]},
 {id:"brassardTitre",scene:"vestiaire",cond:()=>{ const r = raceNow(); return !!r&&r.top2&&!p.flags.cap&&p.age>=22&&qd("lea")>=-4; },
  txt:()=>`Le capitaine se blesse en pleine course au titre. Le coach hésite entre toi et le vétéran du vestiaire, qui attend ce brassard depuis dix ans.`,
  ch:[{t:"Te proposer pour le brassard",risk:{p:()=>clamp(.4+qd("lea")*.03+(p.rel?.trust-50)*.01,.15,.85),good:{flag:"cap",rep:4,moral:5,lvl:raceBonus(1),txt:"Le brassard est à toi. Le vétéran te serre la main, les dents serrées."},bad:{trust:-4,moral:-3,txt:"Le coach choisit le vétéran. Tu as l'air ambitieux, pas leader."}}},
      {t:"Soutenir le vétéran",fx:{trust:5,moral:2,rep:1},why:"Le vestiaire est soudé. Le vétéran te le rendra."}]},
 {id:"pariSaison",scene:"argent",cond:()=>p.age>=21&&p.lvl>=68&&p.pos!=="GB",
  txt:()=>`Ton agent a une idée folle : réduire ton salaire de 30 % cette saison, contre une prime énorme si tu atteins ton objectif personnel.`,
  ch:[{t:"Parier sur toi",fx:{salary:.7,flag:"pariObjectif",moral:3},why:"Tu signes. Maintenant, il faut le faire."},
      {t:"Rester raisonnable",fx:{moral:-1},why:"Ton agent hausse les épaules. « Ton choix. »"}]}
);
