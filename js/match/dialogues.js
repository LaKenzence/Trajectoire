// Trajectoire · Ce qui fait vivre le match clé : actions supplémentaires par poste, contexte du score,
// réactions du banc et des tribunes, et dialogues entre deux actions (coach, capitaine, rival, arbitre, public).

/* ============ Actions supplémentaires par poste ============ */
function extraActions(b,tech,inst,ath){
  return {
   ATT:[
    {txt:"Le défenseur central qui te marque a déjà pris un jaune. Il hésite à s'engager.",o:[
      {t:"Le provoquer en un contre un",duel:"dribble",p:b-.05+tech,ok:{us:.7,me:"g",txt:"Il n'ose pas te toucher : tu entres dans la surface et tu frappes !"},ko:{txt:"Il te reprend proprement, sans faute."}},
      {t:"Jouer en une touche avec le milieu",p:b+.05,ok:{us:.6,me:"a",txt:"Une-deux express, ton milieu se présente seul…"},ko:{txt:"Le une-deux est mal dosé."}}]},
    {txt:"Leur défense joue très haut. Ton milieu lève la tête.",o:[
      {t:"Appeler en profondeur",p:b-.05+ath,ok:{us:1,me:"g",txt:"Appel parfait, hors-jeu évité d'un cheveu, tu crucifies le gardien !"},ko:{txt:"Drapeau levé : hors-jeu."}},
      {t:"Décrocher pour combiner",p:b+tech,ok:{us:.5,me:"a",txt:"Tu décroches, attires deux défenseurs et sers l'ailier…"},ko:{txt:"Pris en sandwich, tu perds le ballon."}}]},
    {txt:"Le gardien adverse est très avancé. Tu reçois le ballon au rond central.",o:[
      {t:"Tenter du milieu de terrain",p:b-.3+inst*1.5,ok:{us:1,me:"g",rep:5,txt:"Du milieu de terrain ! Le ballon retombe sous la barre. Incroyable !"},ko:{txt:"Trop court, le gardien se replace en souriant."}},
      {t:"Conduire et jouer simple",p:b+.1,ok:{calm:true,txt:"Tu gardes le ballon et fais remonter tout le bloc."},ko:{them:.25,txt:"Tu glisses, ballon perdu…"}}]},
    {txt:"Ballon en retrait de l'ailier, tu arrives lancé au point de penalty.",o:[
      {t:"Frapper en première intention",p:b-.06+inst,ok:{us:1,me:"g",txt:"Plat du pied, petit filet. Clinique."},ko:{txt:"Ta frappe s'envole au-dessus."}},
      {t:"Laisser passer pour le second poteau",p:b-.02+tech*.5,ok:{us:.75,me:"a",txt:"Ta feinte de frappe trompe tout le monde, ton coéquipier est seul…"},ko:{txt:"Personne n'avait lu ta feinte, pas même ton coéquipier."}}]}],
   MIL:[
    {txt:"Le ballon arrive à toi plein axe, à 25 mètres. Deux coéquipiers appellent.",o:[
      {t:"Frappe enroulée",p:b-.2+tech,ok:{us:1,me:"g",rep:2,txt:"Enroulée parfaite, le gardien est battu !"},ko:{txt:"Elle frôle le poteau."}},
      {t:"Passe dans la course à gauche",duel:"passe",p:b+.05+tech,ok:{us:.6,me:"a",txt:"Ta passe coupe la défense en deux…"},ko:{txt:"Passe interceptée."}},
      {t:"Petit pont et percée",duel:"dribble",p:b-.12+inst,ok:{us:.7,me:"g",txt:"Petit pont, percée, frappe au ras du poteau !"},ko:{txt:"Le défenseur ne s'est pas laissé avoir."}}]},
    {txt:"L'adversaire défend à dix derrière le ballon depuis vingt minutes.",o:[
      {t:"Changer le jeu d'une longue transversale",p:b+tech,ok:{us:.5,me:"a",txt:"Transversale de 50 mètres, l'ailier contrôle et centre…"},ko:{txt:"La transversale file en touche."}},
      {t:"Patienter et faire tourner",p:b+.15,ok:{calm:true,txt:"Vous les faites courir. Ils commencent à craquer."},ko:{them:.25,txt:"Une passe latérale interceptée, contre adverse…"}},
      {t:"Te projeter dans la surface",p:b-.1+ath,ok:{us:.65,me:"g",txt:"Personne n'a suivi ton appel : tu reprends le centre !"},ko:{txt:"Le centre est trop long pour toi."}}]},
    {txt:"Leur numéro 10 cherche à se retourner dans ton dos.",o:[
      {t:"Coller au marquage",duel:"tacle",p:b+ath,ok:{txt:"Il ne se retourne jamais. Frustré, il redescend chercher le ballon."},ko:{them:.45,txt:"Il pivote et file vers ton but…"}},
      {t:"Anticiper la passe",p:b-.05+tech,ok:{txt:"Interception ! Tu as lu le jeu avant tout le monde."},ko:{them:.4,txt:"Tu as anticipé trop tôt, il est seul…"}}]},
    {txt:"Corner pour ton équipe. C'est toi qui le tires.",o:[
      {t:"Rentrant au premier poteau",p:b-.05+tech,ok:{us:.8,me:"a",txt:"Ton corner est une offrande, ton défenseur central s'élève…"},ko:{txt:"Dégagé par le premier défenseur."}},
      {t:"Combinaison à deux, à ras de terre",p:b+.05,ok:{us:.45,me:"a",txt:"La combinaison surprend tout le monde, centre en retrait…"},ko:{txt:"La défense ne mord pas."}},
      {t:"Viser directement le but",p:b-.3+inst*1.5,ok:{us:1,me:"g",rep:4,txt:"Un corner direct ! Le gardien est sidéré."},ko:{txt:"Le gardien capte sans trembler."}}]}],
   DEF:[
    {txt:"Leur avant-centre, un colosse, attend le long ballon.",o:[
      {t:"Gagner le duel aérien",duel:"aerien",p:b+ath,ok:{rep:1,txt:"Tu t'envoles plus haut que lui. Ballon dégagé."},ko:{them:.4,txt:"Il remise de la tête pour son partenaire…"}},
      {t:"Laisser rebondir et couvrir",p:b+.05,ok:{txt:"Tu le laisses sauter dans le vide et récupères le rebond."},ko:{them:.35,txt:"Le rebond est pour lui…"}}]},
    {txt:"Tu as le ballon dans les pieds, personne ne te presse.",o:[
      {t:"Monter balle au pied",p:b-.05+ath,ok:{us:.45,me:"a",txt:"Tu traverses le milieu et décales l'ailier…"},ko:{them:.3,txt:"Tu perds le ballon loin de ta zone…"}},
      {t:"Longue diagonale vers l'ailier",duel:"passe",p:b-.05+tech,ok:{us:.55,me:"a",txt:"Diagonale millimétrée, l'ailier part seul…"},ko:{txt:"Trop longue, en touche."}},
      {t:"Frappe lointaine",p:b-.32+inst*1.5,ok:{us:1,me:"g",rep:4,txt:"Un défenseur qui marque de 30 mètres ! Le stade n'y croit pas."},ko:{txt:"Ça finit sur le toit de la tribune."}}]},
    {txt:"Leur attaquant s'écroule dans ta surface après un contact léger. L'arbitre consulte la vidéo.",o:[
      {t:"Rester calme, mains dans le dos",p:.55,ok:{rep:1,txt:"Après visionnage : pas de penalty. Ton calme a joué."},ko:{them:.78,txt:"Penalty accordé…"}},
      {t:"Protester vivement",p:.45,ok:{txt:"L'arbitre revient sur sa décision."},ko:{them:.78,moral:-2,txt:"Penalty, et un jaune pour toi."}}]},
    {txt:"Le ballon traîne sur ta ligne de but, ton gardien est battu !",o:[
      {t:"Sauver sur la ligne",p:b+ath,ok:{rep:3,txt:"Sauvetage acrobatique sur la ligne ! Tu cours embrasser ton gardien."},ko:{them:.9,txt:"Tu arrives une fraction de seconde trop tard…"}},
      {t:"Dégager n'importe où",p:b+.05,ok:{txt:"Dégagement en catastrophe, jusqu'en tribune."},ko:{them:.6,txt:"Ton dégagement heurte un attaquant…"}}]}],
   GB:[
    {txt:"Leur ailier centre à ras de terre devant ton but.",o:[
      {t:"Plonger sur le centre",p:b,ok:{txt:"Tu coupes la trajectoire et bloques le ballon."},ko:{them:.6,txt:"Le ballon passe sous ton corps…"}},
      {t:"Rester debout et fermer l'angle",p:b-.05,ok:{rep:1,txt:"Réflexe du pied à bout portant !"},ko:{them:.55,txt:"Il reprend au premier poteau…"}}]},
    {txt:"Tu captes un corner. Ton attaquant est seul à la ligne médiane.",o:[
      {t:"Relancer à la main, tout de suite",p:b-.1+tech,ok:{us:.5,me:"a",txt:"Relance de 40 mètres dans sa course…"},ko:{them:.3,txt:"Ta relance est coupée…"}},
      {t:"Prendre ton temps",p:.9,ok:{calm:true,txt:"Tu poses le ballon. Tout le monde respire."},ko:{txt:"Tu tardes, l'arbitre te presse."}}]},
    {txt:"Un contre un : leur attaquant feinte, tu dois choisir.",o:[
      {t:"Attendre jusqu'au dernier moment",p:b,ok:{rep:2,txt:"Tu ne bouges pas, il frappe sur toi."},ko:{them:.8,txt:"Il attend aussi, et te lobe…"}},
      {t:"Plonger dans ses pieds",p:b-.05+ath,ok:{rep:2,txt:"Tu lui prends le ballon dans les pieds, courageux."},ko:{them:.85,txt:"Il t'enjambe…"}}]},
    {txt:"Une frappe enroulée part vers ta lucarne.",o:[
      {t:"Envol à pleine extension",p:b-.08+ath,ok:{rep:3,txt:"Envol spectaculaire, du bout des doigts ! L'arrêt de la saison."},ko:{them:.75,txt:"Tes doigts effleurent le ballon…"}},
      {t:"Te placer pour la claquer en corner",p:b,ok:{txt:"Claquette propre en corner."},ko:{them:.6,txt:"Mal placé d'un pas…"}}]}]
  }[p.pos];
}

/* ============ Contexte du score ============ */
// une phrase d'accroche selon le score et la minute, pour que deux matchs ne se ressemblent pas
function situ(m,min){
  const d = m.us-m.them, sc = `${m.us}-${m.them}`;
  if(min>90) return pick([`Temps additionnel, ${sc}. `,`Dernières secondes ! `,`Le quatrième arbitre a levé son panneau. `]);
  if(d<0) return min>=75?pick([`Menés ${sc} et le temps file. `,`Il faut un exploit, vite. `]):pick([`Menés ${sc}, il faut réagir. `,`Le stade gronde, vous êtes menés. `]);
  if(d>0) return min>=75?pick([`Vous menez ${sc}, encore un quart d'heure à tenir. `,`Ils jettent tout à l'attaque. `]):pick([`Vous menez ${sc}. `,`Dans l'élan du but, `]);
  if(min>=80) return pick([`Toujours ${sc}, chaque ballon compte. `,`Ça sent la prolongation… `]);
  if(min<=20) return pick([`Le match vient de commencer. `,`Premières minutes, tout le monde se cherche. `,""]);
  return pick(["","",`Le match s'emballe. `,`${m.crowd>40000?"Le stade est en fusion. ":"Le public pousse. "}`]);
}

/* ============ Réactions après une action ============ */
function reaction(ok,m){
  if(!chance(.55)) return "";
  const r = p.rival?.name, mate = p.rel?.mate;
  const pool = ok
    ? ["« Voilà ! » hurle le coach depuis son banc.","Ton capitaine vient te taper dans la main.","Le commentateur s'enflamme : « Quelle lecture du jeu ! »","Le public se lève d'un bond.","Sur le banc, les remplaçants sont debout.",
       "Le coach adjoint note quelque chose dans son carnet, en souriant.","Un « olé » descend des tribunes.","Le consultant télé : « Ça, c'est un joueur intelligent. »","Ton gardien lève le poing depuis sa surface.","Les supporters adverses, pour une fois, se taisent.","Le speaker du stade répète ton nom.","Ton coéquipier te pointe du doigt : « Lui ! »",
       ...(mate?[`${mate} te saute dessus : « T'es fou ! »`]:[]),...(m.type==="rival"&&r?[`${r} détourne le regard.`]:[]),...(m.type==="monde"?["Au pays, des millions de gens hurlent devant leur écran."]:[])]
    : ["Le coach lève les bras au ciel.","« C'est rien, on continue ! » crie ton capitaine.","Quelques sifflets descendent des tribunes.","Le commentateur : « Il pouvait mieux faire. »","Tu te prends la tête entre les mains.",
       "Le coach adjoint secoue la tête.","Les supporters adverses chambrent bruyamment.","Le consultant télé : « Mauvais choix, clairement. »","Tu fixes la pelouse quelques secondes.","Un coéquipier te fait signe de te calmer.","Le coach mime le geste qu'il fallait faire.",
       ...(m.type==="rival"&&r?[`${r} t'applaudit, ironique.`]:[]),...(mate?[`${mate} te fait signe : « La prochaine ! »`]:[])];
  const last = p.lastReac||[], fresh = pool.filter(x=>!last.includes(x)), r2 = pick(fresh.length?fresh:pool);
  p.lastReac = [...last,r2].slice(-10);
  return ` <i>${esc(r2)}</i>`;
}

/* ============ Dialogues entre deux actions ============ */
// Chaque dialogue a une condition, un texte et deux ou trois réponses. Effets possibles :
// boost (chances de la prochaine action), moral, rep, form, calm (moins de buts adverses), perf, risk:{p,good,bad}
const MATCH_TALKS = [
  {id:"consigne",who:"📋 Le coach",cond:()=>true,txt:()=>"Le coach t'appelle sur le bord du terrain : « Tu décroches trop ! Reste dans ta zone ! »",o:[
    {t:"Hocher la tête et appliquer",fx:{boost:.05},r:"Il lève le pouce. Tu sais exactement où te placer."},
    {t:"Lui montrer que tu sais ce que tu fais",risk:{p:()=>p.flags.cap||p.rep>=50?.65:.4,good:{boost:.08,moral:2,txt:"Il sourit : « D'accord, fais ton truc. »"},bad:{boost:-.04,moral:-2,txt:"Il fulmine. Le quatrième arbitre doit le calmer."}}}]},
  {id:"capitaine",who:"©️ Ton capitaine",cond:()=>!p.flags.cap,txt:()=>"Ton capitaine te secoue par le maillot : « Réveille-toi, on a besoin de toi ce soir ! »",o:[
    {t:"« Donne-moi le ballon. »",fx:{boost:.06,moral:1},r:"Il hoche la tête. Le prochain ballon sera pour toi."},
    {t:"Le repousser, agacé",fx:{moral:-2,boost:.02},r:"Il hausse les épaules. L'ambiance se tend."}]},
  {id:"brassard",who:"©️ Ton brassard",cond:()=>p.flags.cap,txt:()=>"Arrêt de jeu. Tes coéquipiers se tournent vers toi, le capitaine. Ils attendent un mot.",o:[
    {t:"Les rassembler et calmer le jeu",fx:{calm:true,rep:1},r:"« On reste en bloc. » Tout le monde se resserre."},
    {t:"Pousser tout le monde vers l'avant",fx:{boost:.07},r:"« On va les chercher ! » Le bloc monte d'un cran."}]},
  {id:"rival",who:"⚔️ Ton rival",cond:m=>m.type==="rival"&&p.rival,txt:()=>`Sur un arrêt de jeu, ${p.rival.name} passe à côté de toi : « Tu vas pleurer ce soir. »`,o:[
    {t:"L'ignorer",fx:{boost:.05},r:"Tu ne lui offres même pas un regard. Ça le rend fou."},
    {t:"« Regarde bien le tableau d'affichage. »",risk:{p:.5,good:{moral:3,rep:1,txt:"Il ne répond rien. Les caméras ont tout vu, les réseaux adorent."},bad:{moral:-3,boost:-.04,txt:"Ça dégénère, l'arbitre vous avertit tous les deux."}}}]},
  {id:"arbitre",who:"🟨 L'arbitre",cond:()=>true,txt:()=>"L'arbitre siffle une faute imaginaire contre toi. Le banc explose.",o:[
    {t:"Protester",risk:{p:.4,good:{rep:1,boost:.03,txt:"Il reconnaît son erreur d'un geste discret."},bad:{moral:-3,boost:-.05,txt:"Carton jaune. Tu vas devoir jouer sur des œufs."}}},
    {t:"Applaudir ironiquement",risk:{p:.3,good:{rep:2,txt:"Les tribunes t'imitent. L'arbitre fait mine de ne rien voir."},bad:{moral:-4,boost:-.06,txt:"Jaune direct. Le coach se prend la tête."}}},
    {t:"Passer à autre chose",fx:{boost:.02},r:"Tu repars en trottinant. Tête froide."}]},
  {id:"virage",who:"🏟️ Les tribunes",cond:m=>m.type!=="monde"&&p.rep>=25,txt:()=>`Le virage scande ton nom : « ${lastName().toUpperCase()} ! ${lastName().toUpperCase()} ! »`,o:[
    {t:"Lever les bras vers eux",fx:{rep:1,boost:.03},r:"Le bruit redouble. Tu as des frissons."},
    {t:"Rester concentré",fx:{boost:.05},r:"Tu baisses la tête et serres le poing. Plus tard, la fête."}]},
  {id:"sifflets",who:"📣 Les tribunes",cond:m=>m.type==="derby"||m.type==="rival"||m.type==="cdc",txt:()=>"Sifflets à chaque touche de balle. Une banderole te vise directement.",o:[
    {t:"Mettre un doigt sur la bouche",risk:{p:.45,good:{rep:3,moral:3,txt:"Le stade se tait. Image du match."},bad:{rep:-2,moral:-3,txt:"Les sifflets redoublent, des projectiles volent."}}},
    {t:"Faire comme si de rien n'était",fx:{boost:.04},r:"Tu laisses glisser. Ton jeu répondra."}]},
  {id:"pote",who:"🤜 Ton pote",cond:()=>!!p.rel?.mate,txt:()=>`${p.rel.mate} te glisse : « Donne-la-moi la prochaine fois, je la sens ce soir. »`,o:[
    {t:"« Promis. »",fx:{moral:2,boost:.03},r:"Il te fait un clin d'œil. Vous êtes sur la même longueur d'onde."},
    {t:"« Mérite-la d'abord. »",fx:{boost:.05,moral:-1},r:"Il serre les dents et se met à courir comme un fou."}]},
  {id:"menes",who:"💬 Le vestiaire",cond:m=>m.us<m.them,txt:()=>"Menés au score, un coéquipier baisse la tête et traîne les pieds.",o:[
    {t:"Le relever et l'encourager",fx:{boost:.04,moral:2},r:"« On a encore le temps ! » Il relève la tête."},
    {t:"Taper dans tes mains pour réveiller tout le monde",fx:{boost:.06},r:"Le bloc se remet à presser."},
    {t:"Te concentrer sur ton propre jeu",fx:{boost:.02},r:"Chacun pour soi. Ça peut marcher… ou pas."}]},
  {id:"menons",who:"⏱️ Le banc",cond:m=>m.us>m.them&&m.step>=2,txt:()=>"Vous menez. Le banc vous fait de grands signes : il faut gagner du temps.",o:[
    {t:"Garder le ballon au poteau de corner",fx:{calm:true},r:"Trois minutes grignotées. Les adversaires s'énervent."},
    {t:"Chercher le but du break",fx:{boost:.06},r:"Tu veux tuer le match. Risqué, mais ambitieux."}]},
  {id:"choc",who:"🩹 Le kiné",cond:()=>true,txt:()=>"Tu prends un coup sur la cheville. Le kiné arrive en courant.",o:[
    {t:"Serrer les dents et rester sur le terrain",risk:{p:()=>p.trait==="athl"?.75:.55,good:{rep:1,boost:.03,txt:"La douleur passe. Tu repars comme si de rien n'était."},bad:{form:-6,boost:-.07,txt:"Tu boites. Chaque appui fait mal."}}},
    {t:"Te faire soigner une minute",fx:{boost:-.02,form:2},r:"Une bombe de froid, un bandage, tu reviens."}]},
  {id:"gamin",who:"🌱 Un jeune",cond:()=>p.age>=29,txt:()=>"Un gamin de 19 ans joue son premier grand match. Il tremble à chaque ballon.",o:[
    {t:"Le rassurer",fx:{moral:2,rep:1},r:"« Joue comme à l'entraînement. » Il se détend d'un coup."},
    {t:"Lui demander de te donner le ballon",fx:{boost:.05},r:"Il te cherche à chaque action. Tu portes l'équipe."}]},
  {id:"ligne",who:"🧤 Ta défense",cond:()=>p.pos==="GB"||p.pos==="DEF",txt:()=>"Ta ligne défensive recule trop. Il faut parler, et fort.",o:[
    {t:"Hurler pour faire remonter la ligne",fx:{boost:.05,rep:1},r:"Ta voix porte. Tout le monde remonte de dix mètres."},
    {t:"Laisser faire, ils savent",fx:{calm:true},r:"Le bloc reste bas et compact."}]},
  {id:"selection",who:"🌍 Le sélectionneur",cond:m=>m.type==="monde",txt:()=>`Le sélectionneur s'approche : « Tout le pays te regarde. Tu te sens comment ? »`,o:[
    {t:"« Prêt. »",fx:{boost:.05,moral:2},r:"Il te tape sur l'épaule. « Alors va gagner ce match. »"},
    {t:"« J'ai les jambes lourdes. »",fx:{form:3,boost:-.02},r:"Il apprécie ta franchise et ajuste ton rôle."}]},
  {id:"crampes",who:"🦵 Ton corps",cond:m=>!!m.et,txt:()=>"Prolongation. Ton mollet se tétanise : une crampe, la pire au pire moment.",o:[
    {t:"Serrer les dents et jouer",risk:{p:()=>p.trait==="athl"?.75:.5,good:{boost:.05,rep:1,txt:"La douleur passe au second plan. Tu cours encore."},bad:{boost:-.08,form:-4,txt:"Tu boites. Chaque sprint est un supplice."}}},
    {t:"T'étirer au sol une minute",fx:{boost:-.02,form:2},r:"Le kiné tire sur ta jambe. Le stade retient son souffle, puis applaudit quand tu te relèves."},
    {t:"Demander à tes coéquipiers de jouer pour toi",fx:{calm:true},r:"Le bloc se resserre autour de toi. On attend les tirs au but."}]},
  {id:"changement",who:"📋 Le banc",cond:m=>m.step>=2&&p.age>=27,txt:()=>"Le quatrième arbitre lève le panneau… avec ton numéro. Le coach veut te faire sortir.",o:[
    {t:"Supplier le coach de te laisser",risk:{p:()=>p.flags.cap?.65:.4,good:{boost:.06,moral:2,txt:"Il hésite… puis fait signe à un autre de sortir. Tu restes !"},bad:{moral:-3,boost:-.04,txt:"Il ne cède pas. Tu sors en tapant dans les mains… puis il te fait revenir : le remplaçant s'est blessé à l'échauffement."}}},
    {t:"Sortir sous les applaudissements",fx:{rep:1,form:3,boost:-.03},r:"Standing ovation. Mais le remplaçant se tord la cheville : tu reviens deux minutes plus tard."}]},
  {id:"selfie",who:"📱 Un supporter",cond:m=>m.type!=="monde"&&p.rep>=40,txt:()=>"Un supporter a franchi la sécurité et court vers toi, téléphone à la main, pour un selfie.",o:[
    {t:"Faire le selfie avant que la sécurité arrive",fx:{rep:2,moral:2},r:"La photo fait le tour des réseaux. L'arbitre, lui, ne rit pas du tout."},
    {t:"Le raccompagner calmement vers les stewards",fx:{rep:1,boost:.02},r:"Geste classe. Le stade applaudit."}]},
  {id:"tribune",who:"👪 Les tribunes",cond:()=>true,txt:()=>"Tu aperçois ta famille dans la tribune. Ton petit cousin agite une pancarte avec ton nom.",o:[
    {t:"Leur faire un signe",fx:{moral:3},r:"Ils hurlent de joie. Tu as le cœur léger."},
    {t:"Te concentrer, tu leur feras la fête après",fx:{boost:.05},r:"Tu baisses la tête et te replaces. Plus tard, les câlins."}]},
  {id:"tactique",who:"©️ Le capitaine",cond:m=>p.pos!=="GB",txt:()=>"Le capitaine vient te voir : « Leur latéral gauche est à la rue. Change de côté. »",o:[
    {t:"Changer de côté",fx:{boost:.06},r:"Il avait raison : leur latéral souffre dès le premier duel."},
    {t:"Rester à ton poste, comme le coach l'a demandé",fx:{boost:.02,trust:2},r:"Discipline tactique. Le coach apprécie depuis son banc."}]},
  {id:"gardienAdverse",who:"🧤 Leur gardien",cond:()=>p.pos==="ATT"||p.pos==="MIL",txt:()=>"Leur gardien te glisse, sur un arrêt de jeu : « Tu ne me marqueras jamais. »",o:[
    {t:"Sourire sans répondre",fx:{boost:.05},r:"Ton sourire l'agace plus que n'importe quelle phrase."},
    {t:"« On en reparle à la fin. »",risk:{p:.5,good:{boost:.08,moral:2,txt:"Il perd sa concentration. Tu le sens fébrile."},bad:{boost:-.03,txt:"Il rigole. Il a gagné ce petit duel-là."}}}]},
  {id:"jeuneAdverse",who:"🌱 Un adversaire",cond:()=>p.rep>=55,txt:()=>"Un jeune adversaire de 18 ans te demande ton maillot… en plein match, sur une touche.",o:[
    {t:"« À la fin, promis. »",fx:{rep:2,moral:1},r:"Il hoche la tête, ému. Il te le rappellera."},
    {t:"« Concentre-toi sur ton match, petit. »",fx:{boost:.03},r:"Il rougit et repart. Il ne te lâchera plus d'une semelle."}]},
  {id:"protegeTerrain",who:"🌱 Ton protégé",cond:()=>!!p.protege&&p.protege.club===p.club.name&&p.protege.age>=19,txt:()=>`${p.protege.name} te fait signe : « Je suis seul à droite, donne-la-moi ! »`,o:[
    {t:"Lui faire confiance",fx:{boost:.04,moral:2},r:"Il t'adresse un clin d'œil. Vous jouez de mémoire."},
    {t:"« Pas maintenant, petit. »",fx:{boost:.02,moral:-1},r:"Il serre les dents. Il veut te prouver quelque chose."}]},
  {id:"protegeFace",who:"🌱 Ton ancien protégé",cond:m=>!!m.protege,txt:()=>`${p.protege.name}, le gamin que tu as formé, joue en face. Il passe à côté de toi : « Pas de cadeau aujourd'hui. »`,o:[
    {t:"« Montre-moi ce que je t'ai appris. »",fx:{boost:.05,moral:2},r:"Il sourit. Le duel commence."},
    {t:"Lui mettre un petit coup d'épaule",risk:{p:.5,good:{boost:.07,txt:"Il vacille. Le maître reste le maître."},bad:{boost:-.04,moral:-2,txt:"Il ne bouge pas d'un centimètre. Le gamin a grandi."}}}]},
  {id:"meteo",who:"🌧️ Le terrain",cond:m=>/pluie|neige|orage/i.test(m.weather||""),txt:()=>"La pelouse est détrempée. Les ballons fusent et rebondissent n'importe comment.",o:[
    {t:"Jouer simple, au sol",fx:{boost:.04},r:"Tu adaptes ton jeu. Moins beau, plus efficace."},
    {t:"Tenter des frappes : le gardien va glisser",risk:{p:.5,good:{boost:.08,txt:"Bien vu : leur gardien a déjà relâché deux ballons."},bad:{boost:-.03,txt:"Tes appuis se dérobent à chaque frappe."}}}]}
];
// choisit un dialogue jamais vu dans ce match ; garde la variété d'un match à l'autre
function pickTalk(m){
  const seen = m.talks||[], last = p.lastTalks||[];
  const ok = MATCH_TALKS.filter(t=>t.id!=="crampes"&&!seen.includes(t.id)&&t.cond(m));
  if(m.protege&&!seen.includes("protegeFace")) return "protegeFace";
  const fresh = ok.filter(t=>!last.includes(t.id));
  const t = pick(fresh.length?fresh:ok);
  return t?t.id:null;
}
function talkHtml(m){
  const t = MATCH_TALKS.find(x=>x.id===m.talk);
  return `<p class="talk-who">${t.who}</p><p class="story">${esc(t.txt())}</p>
    ${t.o.map((o,i)=>`<button class="btn" onclick="matchTalk(${i})">${choiceLead(o.t,i)}<span class="ctext">${esc(o.t)}</span>${o.risk?'<span class="chip">🎲 Risqué</span>':""}</button>`).join("")}`;
}
function matchTalk(i){
  const m = p.match, t = MATCH_TALKS.find(x=>x.id===m.talk), o = t.o[i];
  let fx = o.fx, txt = o.r;
  if(o.risk){ const pr = typeof o.risk.p==="function"?o.risk.p():o.risk.p; fx = chance(pr)?o.risk.good:o.risk.bad; txt = fx.txt; }
  m.boost = clamp((m.boost||0)+(fx.boost||0),-.15,.15);
  if(fx.calm) m.calm = true;
  for(const k of ["moral","rep","form"]) if(fx[k]) p[k] = clamp(p[k]+fx[k],0,100);
  if(fx.trust&&p.rel) p.rel.trust = clamp(p.rel.trust+fx.trust,0,100);
  m.log.push(`💬 ${esc(t.who.replace(/^\S+\s/,""))} · ${esc(o.t)} : ${esc(txt)}`);
  m.talks = [...(m.talks||[]),t.id];
  p.lastTalks = [...(p.lastTalks||[]),t.id].slice(-12);
  m.talk = null;
  save(); matchScreen();
}
// la réponse « la plus sûre » pour la saison rapide et le bot : celle qui donne le plus d'élan
function bestTalk(m){
  const t = MATCH_TALKS.find(x=>x.id===m.talk);
  let bi = 0, bv = -1;
  t.o.forEach((o,i)=>{ const v = o.risk?0:(o.fx.boost||0)+(o.fx.calm?.04:0); if(v>bv){ bv = v; bi = i; } });
  return bi;
}

/* ============ Variété : rotation des actions et variantes de texte ============ */
// les actions les moins récemment jouées passent en premier, pour ne pas revoir la même situation deux matchs de suite
function freshOrder(n){
  const seen = p.actSeen||{};
  return shuffle([...Array(n).keys()]).sort((a,b)=>(seen[p.pos+":"+a]||0)-(seen[p.pos+":"+b]||0));
}
function markAct(i){ p.actN = (p.actN||0)+1; p.actSeen = {...(p.actSeen||{}),[p.pos+":"+i]:p.actN}; }
// une même situation racontée autrement ; le choix reste stable pendant toute l'action
const ACT_ALT = {
  "Tu reçois le ballon dans la surface, dos au but.":["Long ballon de ton gardien : tu le contrôles de la poitrine, dos au but, un défenseur collé à toi.","Ton milieu te sert dans les seize mètres. Tu es dos au but, le défenseur te pousse."],
  "Contre-attaque : tu te retrouves seul face au gardien.":["Le hors-jeu n'est pas signalé : tu es seul face au gardien !","Une passe lumineuse te lance. Plus personne entre le gardien et toi."],
  "Centre tendu venu de la droite.":["L'ailier déborde et envoie un centre fuyant.","Centre au cordeau depuis la ligne de but."],
  "Le gardien adverse relance mal, le ballon traîne à 25 mètres.":["Une relance ratée du gardien : le ballon arrive dans tes pieds à 25 mètres.","Leur défenseur glisse, le ballon roule vers toi, à 25 mètres du but."],
  "Corner rentrant au premier poteau.":["Corner tendu au premier poteau, ça se bouscule.","Le ballon tournoie depuis le poteau de corner vers le premier poteau."],
  "Un défenseur te tient le maillot dans la surface.":["Dans la surface, ton marqueur s'accroche à ton maillot.","Le défenseur te ceinture à chaque appel dans la surface."],
  "Tu récupères le ballon au milieu, leur défense est haute.":["Interception au rond central : leur défense est restée très haute.","Tu chipes le ballon au milieu, il y a de l'espace dans leur dos."],
  "Coup franc à 22 mètres, légèrement décentré.":["Faute à l'entrée de la surface : coup franc à 22 mètres.","Coup franc idéalement placé, à 22 mètres, légèrement sur la gauche."],
  "Leur meneur de jeu accélère au milieu.":["Leur numéro 10 démarre balle au pied au milieu de terrain.","Leur meneur de jeu élimine un premier joueur et accélère."],
  "Contre-attaque à trois contre deux, tu portes le ballon.":["Trois contre deux, c'est toi qui conduis le contre.","Vous sortez vite : trois contre deux, le ballon dans tes pieds."],
  "Un ballon dévié retombe à l'entrée de la surface.":["Un dégagement raté retombe pile à l'entrée de la surface.","Le ballon contré monte haut… et redescend devant toi, à vingt mètres."],
  "Leur pressing est très haut, tu es acculé près de ta surface.":["Trois adversaires se ruent sur toi près de ta surface.","Ils pressent comme des fous : tu as le ballon dos à ton but, sous pression."],
  "Leur attaquant part seul dans ton dos.":["Une passe en profondeur te prend de vitesse : leur attaquant file seul.","Leur avant-centre a pris ton dos, il part au but."],
  "Corner pour ton équipe. Tu montes dans la surface.":["Corner pour vous : tu montes, comme sur chaque coup de pied arrêté.","Le coach te fait signe de monter sur le corner."],
  "Leur ailier rapide te provoque en un contre un.":["Leur ailier, le plus rapide du championnat, fonce droit sur toi.","Un contre un sur l'aile face à leur dribbleur."],
  "Coup franc adverse dangereux, tu es dans le mur.":["Coup franc pour eux à vingt mètres : tu te places dans le mur.","Ils ont un coup franc dangereux ; tu prends ta place dans le mur."],
  "Leur avant-centre te provoque, il cherche à t'énerver.":["Leur avant-centre te marche sur les pieds à chaque duel.","Il te parle à l'oreille, te pousse, te cherche."],
  "Ballon perdu au milieu : contre adverse à deux contre un.":["Perte de balle au milieu : ils sont deux, tu es seul.","Contre éclair : deux attaquants contre toi, dernier défenseur."],
  "Face-à-face : leur avant-centre fonce vers ton but.":["Leur avant-centre a passé toute la défense : il est seul face à toi.","Ta défense est battue, il ne reste que toi face à l'attaquant."],
  "Long ballon dans le dos de ta défense.":["Un long ballon passe au-dessus de tes défenseurs.","Ballon en profondeur : la course entre toi et l'attaquant commence."],
  "Frappe lointaine flottante sous la pluie.":["Frappe des trente mètres, le ballon flotte et change de trajectoire.","Ils tentent de loin : une frappe qui flotte bizarrement."],
  "Corner tendu dans ta surface encombrée.":["Corner pour eux, ta surface est noire de monde.","Ils envoient le corner dans la mêlée, devant ta ligne."]
};
function altText(a){
  a.scene = a.txt;
  const alts = ACT_ALT[a.txt];
  if(alts){ const m = p.match, h = hashStr(a.txt+(m?.title||"")+(m?.mins||[]).join()+(m?.step||0)); a.txt = [a.txt,...alts][h%(alts.length+1)]; }
  return a;
}

/* ============ Encore des situations, poste par poste ============ */
function bonusActions(b,tech,inst,ath){
  return {
   ATT:[
    {txt:"Le ballon rebondit devant toi après un tir de ton coéquipier repoussé par le gardien.",o:[
      {t:"Reprendre de volée tout de suite",p:b-.08+inst,ok:{us:1,me:"g",txt:"Reprise instantanée, le gardien n'a pas eu le temps de se relever !"},ko:{txt:"Ta volée s'envole au-dessus."}},
      {t:"Contrôler pour ajuster",p:b-.12+tech,ok:{us:1,me:"g",txt:"Contrôle, crochet, but. Tout en sang-froid."},ko:{txt:"Le temps de contrôler, trois défenseurs sont revenus."}}]},
    {txt:"Ton équipe défend. Tu es le seul attaquant, et le ballon arrive vers toi en chandelle.",o:[
      {t:"Garder le ballon pour faire remonter l'équipe",p:b+.05+ath,ok:{calm:true,txt:"Tu protèges le ballon contre deux défenseurs. Tout le bloc remonte."},ko:{them:.25,txt:"Tu perds le duel, le ballon revient aussitôt…"}},
      {t:"Partir seul en dribble",duel:"dribble",p:b-.12+tech,ok:{us:.7,me:"g",txt:"Tu élimines ton défenseur et files au but !"},ko:{txt:"Pris à deux, tu laisses filer le ballon."}}]},
    {txt:"Leur gardien sort loin de sa ligne pour couper un ballon. Tu arrives lancé.",o:[
      {t:"Le devancer d'une pichenette",p:b-.1+tech,ok:{us:1,me:"g",rep:2,txt:"Pichenette par-dessus le gardien, le ballon roule dans le but vide."},ko:{txt:"Le gardien plonge dans tes pieds."}},
      {t:"Mettre le pied le premier",p:b-.04+ath,ok:{us:.6,me:"g",txt:"Tu touches le ballon avant lui… il file vers le but !"},ko:{moral:-1,txt:"Choc avec le gardien. Faute pour lui."}}]}],
   MIL:[
    {txt:"Le ballon traîne au milieu après un duel aérien. Tu es le premier dessus.",o:[
      {t:"Lancer le contre en une touche",duel:"passe",p:b+tech,ok:{us:.55,me:"a",txt:"Remise en une touche, ton ailier part comme une fusée…"},ko:{txt:"Ta remise est coupée."}},
      {t:"Pivoter et percer plein axe",p:b-.08+ath,ok:{us:.6,me:"g",txt:"Pivot, percée de quarante mètres, frappe !"},ko:{them:.3,txt:"Tu perds le ballon dans le rond central…"}}]},
    {txt:"Penalty pour ton équipe. Le tireur habituel est sorti sur blessure.",o:[
      {t:"Prendre tes responsabilités",pen:"shoot",p:.95,ok:{us:.78,me:"g",txt:"Tu poses le ballon. Le stade retient son souffle…"},ko:{txt:"L'arbitre revient sur sa décision après vidéo."}},
      {t:"Laisser l'attaquant tirer",p:.9,ok:{us:.75,txt:"Ton attaquant ne tremble pas."},ko:{txt:"L'attaquant manque le cadre."}}]},
    {txt:"Leur sentinelle est fatiguée. Tu peux jouer dans son dos.",o:[
      {t:"Appel dans son dos",p:b-.03+ath,ok:{us:.7,me:"g",txt:"Personne ne t'a suivi : tu reprends le centre en retrait !"},ko:{txt:"Le défenseur central a anticipé."}},
      {t:"La provoquer en dribble",duel:"dribble",p:b-.08+tech,ok:{us:.5,me:"a",txt:"Tu la passes facilement et sers ton avant-centre…"},ko:{txt:"Elle a encore des ressources : faute tactique."}}]}],
   DEF:[
    {txt:"Leur attaquant reçoit dos au but dans ta surface.",o:[
      {t:"Le serrer pour l'empêcher de pivoter",p:b+ath,ok:{txt:"Il ne peut pas se retourner : il remise en arrière, danger écarté."},ko:{them:.5,txt:"Il pivote sur toi et frappe…"}},
      {t:"Anticiper et couper la remise",p:b-.05+tech,ok:{txt:"Tu coupes la remise et relances proprement."},ko:{them:.45,txt:"Tu as anticipé trop tôt : il est libre…"}}]},
    {txt:"Coup franc pour ton équipe, loin du but. Le coach veut que tu le tires long.",o:[
      {t:"Ballon brossé vers le second poteau",p:b-.05+tech,ok:{us:.55,me:"a",txt:"Ton ballon trouve la tête de ton avant-centre…"},ko:{txt:"Le gardien capte sans souci."}},
      {t:"Jouer court et relancer",p:b+.15,ok:{calm:true,txt:"Vous gardez le ballon, l'adversaire court dans le vide."},ko:{txt:"La relance courte est interceptée, sans danger."}}]},
    {txt:"Tu es averti. Leur ailier le sait et fonce sur toi.",o:[
      {t:"Défendre sans toucher",p:b-.05,ok:{rep:1,txt:"Tu le raccompagnes jusqu'à la ligne de sortie sans faute. Défense de patron."},ko:{them:.5,txt:"Il te passe : tu n'as pas osé intervenir…"}},
      {t:"Tacler quand même",duel:"tacle",p:b-.1+ath,ok:{rep:2,txt:"Tacle parfait, sur le ballon. Le stade hurle de soulagement."},ko:{them:.35,moral:-3,txt:"Deuxième jaune ! Ton équipe finit à dix…"}}]}],
   GB:[
    {txt:"Leur attaquant tire un penalty contre ton équipe. Il a l'air nerveux.",o:[
      {t:"Le faire attendre, le regarder dans les yeux",pen:"save",p:.4+(p.lvl-70)*.004,ok:{rep:4,txt:"Il craque : tu détournes le penalty !"},ko:{them:1,txt:"Il garde son sang-froid et marque."}},
      {t:"Choisir ton côté à l'avance",p:.33+(p.lvl-70)*.004,ok:{rep:4,txt:"Bon côté ! Arrêt décisif."},ko:{them:1,txt:"Mauvais côté."}}]},
    {txt:"Un coéquipier dévie le ballon vers ton but par erreur !",o:[
      {t:"Réflexe à bout portant",p:b-.05+ath,ok:{rep:2,txt:"Réflexe incroyable : tu sauves ton coéquipier d'un but contre son camp."},ko:{them:.85,txt:"Trop près, trop vite…"}},
      {t:"Rester gainé et fermer l'angle",p:b-.08,ok:{txt:"Le ballon te heurte et sort en corner."},ko:{them:.7,txt:"Le ballon passe sous toi…"}}]},
    {txt:"Fin de match. Tu as le ballon dans les mains, ton équipe veut accélérer.",o:[
      {t:"Dégagement de volée vers l'avant-centre",p:b-.05+tech,ok:{us:.45,me:"a",txt:"Ton dégagement trouve l'avant-centre lancé…"},ko:{txt:"Ton dégagement file en touche."}},
      {t:"Prendre ton temps",p:.9,ok:{calm:true,txt:"Tu fais durer. Les adversaires s'impatientent."},ko:{rep:-1,txt:"Carton jaune pour gain de temps."}}]}]
  }[p.pos];
}
