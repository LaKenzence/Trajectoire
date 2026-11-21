// Trajectoire · Les chapitres de la carrière : après le centre, la vie de footballeur se découpe en trois périodes,
// chacune avec son enjeu et son verdict, pour que chaque saison compte pour quelque chose de plus grand qu'elle.
// - La percée (jusqu'à 22 ans) : t'imposer comme titulaire ;
// - Le sommet (23 à 29 ans) : un grand titre ;
// - La dernière danse (30 ans et plus) : choisir comment tu pars.
// État : p.acts = {percee:"ok"|"ko", sommet:"ok"|"ko"}, p.flags.danse = "club"|"racines"|"exotique", p.flags.danseClub.

const ACTS = [
  {id:"percee",n:"La percée",to:22,stake:"T'imposer comme titulaire avant tes 23 ans.",
    intro:"Tu n'es plus un espoir qu'on protège. Le football ne fait pas de cadeaux aux jeunes : soit tu prends ta place, soit on t'oublie."},
  {id:"sommet",n:"Le sommet",to:29,stake:"Un grand titre avant tes 30 ans : un championnat avec un grand club, la Coupe des Champions ou un titre international.",
    intro:"Les années où tout se joue. Le corps est au sommet, la tête aussi. Ce que tu ne gagnes pas maintenant, tu ne le gagneras peut-être jamais."},
  {id:"fin",n:"La dernière danse",to:99,stake:"Choisir comment tu pars.",
    intro:"Les jambes répondent un peu moins vite. Les jeunes t'appellent par ton prénom avec respect. Il reste quelques saisons : à toi de décider de quoi elles auront l'air."}
];
const actOf = age=>ACTS.find(a=>age<=a.to)||ACTS[2];
const actIdx = a=>ACTS.indexOf(a)+1;
// l'âge du joueur pour une année de fin de saison
const ageAt = y=>y-(p.year-p.age);

/* ============ Les verdicts ============ */
const BIG_CLUB = 86;
const clubStrOf = name=>(CLUBS.find(c=>c.name===name)||{str:0}).str;
// la percée : une vraie saison de titulaire entre 18 et 22 ans (28 matchs, une note correcte) dans un club solide
function perceeOk(){ return p.seasons.some(s=>s.age>=18&&s.age<=22&&s.apps>=28&&+s.rating>=6.7&&clubStrOf(s.club)>=70); }
// le sommet : un grand titre entre 23 et 29 ans
function sommetTitle(){
  for(const t of p.trophies){
    const a = ageAt(t.y); if(a<24||a>30) continue;
    if(/^(Coupe des Champions|Championnat du Monde|Coupe Continentale)/.test(t.t)) return t.t.replace(/ \d{4}$/,"");
    if(/^Champion –/.test(t.t)){
      const s = p.seasons.find(x=>x.y.startsWith(String(t.y-1)));
      if(s&&clubStrOf(s.club)>=BIG_CLUB) return `${t.t.replace("Champion – ","le titre en ")} avec ${s.club}`;
    }
  }
  return null;
}
// à l'intersaison, quand un chapitre se referme : le verdict, une trace dans la carrière, et un mot pour le dire
function chapterCheck(){
  if(p.daily||p.friend) return null;
  p.acts = p.acts||{};
  let html = null;
  if(p.age===23&&!p.acts.percee){
    const ok = perceeOk(); p.acts.percee = ok?"ok":"ko";
    if(ok){ p.rep = clamp(p.rep+4,0,100); p.moments.push(`${p.year} · S'impose comme titulaire avant 23 ans`); }
    else { p.moral = clamp(p.moral-6,0,100); p.rep = clamp(p.rep-3,0,100); p.moments.push(`${p.year} · À 23 ans, toujours pas de place de titulaire`); }
    html = chapterToast(ACTS[0],ok,ok?"Tu as pris ta place. Plus personne ne te parle comme à un gamin.":"Les recruteurs parlent déjà des joueurs de 18 ans. Il va falloir le prouver autrement.");
  }
  if(p.age===30&&!p.acts.sommet){
    const t = sommetTitle(), ok = !!t; p.acts.sommet = ok?"ok":"ko";
    if(ok){ p.rep = clamp(p.rep+5,0,100); p.moments.push(`${p.year} · Au sommet : ${t}`); }
    else { p.moral = clamp(p.moral-5,0,100); p.moments.push(`${p.year} · Le rendez-vous manqué : aucun grand titre avant 30 ans`); }
    html = chapterToast(ACTS[1],ok,ok?`${cap1(t)}. Ça, personne ne pourra te l'enlever.`:"Les grandes nuits sont passées à côté. Il reste une dernière danse.");
  }
  return html;
}
const cap1 = s=>s.charAt(0).toUpperCase()+s.slice(1);
const chapterToast = (a,ok,txt)=>`<div class="tchoice">📖 Chapitre ${actIdx(a)} · ${a.n} : ${ok?"réussi ✓":"manqué ✗"}</div><div>${esc(txt)}</div>`;

/* ============ L'avant-saison : où tu en es du chapitre ============ */
function chapterLine(){
  if(!p||p.daily||p.friend||p.retired) return "";
  danseSync();
  const a = actOf(p.age), i = actIdx(a);
  const fresh = !p.seasons.length||actOf(p.age-1)!==a;
  if(p.calm&&!fresh) return "";
  let status = "";
  if(a.id==="percee") status = perceeOk()?"✓ Objectif atteint : une vraie saison de titulaire.":`${23-p.age>1?`Encore ${23-p.age} saisons pour y arriver.`:"🔥 Dernière chance : cette saison compte un moment de plus."} Il faut une saison à 28 matchs ou plus, bien noté, dans un club de force 70 au moins.`;
  else if(a.id==="sommet"){ const t = sommetTitle(); status = t?`✓ Objectif atteint : ${t}.`:30-p.age>1?`Encore ${30-p.age} saisons pour y arriver.`:"🔥 Dernière chance : cette saison compte un moment de plus."; }
  else status = p.flags.danse?`Ton choix : ${{club:`finir à ${esc(p.flags.danseClub||p.club.name)}`,racines:"revenir là où tout a commencé",exotique:"un dernier voyage, loin"}[p.flags.danse]}.`:"Une décision t'attend cette saison.";
  return `<div class="card chap${fresh?" chap-new":""}${chapterDeadline()?" chap-last":""}"><span class="chap-k">Chapitre ${i} · ${a.n}</span>
    ${fresh?`<p class="chap-intro">${a.intro}</p>`:""}<p class="chap-stake">🎯 ${a.stake}</p><p class="chap-st">${status}</p></div>`;
}

/* ============ La dernière danse : les offres qui vont avec ============ */
function chapterOffers(offers){
  danseSync();
  const d = p.flags.danse; if(!d||p.age<30||defiOn("fidele")) return;
  let c = null;
  if(d==="racines") c = CLUBS.find(x=>x.name===p.clubsHist[0]);
  if(d==="exotique") c = CLUBS.filter(x=>(x.country==="US"||x.country==="JP")&&clubAllowed(x)).sort((a,b)=>b.str-a.str)[RI(0,2)];
  if(!c||c.name===p.club.name||offers.some(o=>o.club.name===c.name)) return;
  offers.push({club:c,years:RI(1,2),salary:Math.round(Math.pow(Math.max(c.str-35,5),2)*(d==="exotique"?1.6:.8)*(1+p.rep/80)),loan:false,home:d==="racines"});
}

/* ============ Les scènes d'ouverture de chaque chapitre ============ */
const actOnce = id=>!(p.used||{})[id]&&!p.daily&&!p.friend;
const cfLine = (who,txt)=>typeof cfSay==="function"&&p.cf?cfSay(who,txt):"";
EVENTS.push(
  {id:"actPercee",scene:"vestiaire",weight:6,cond:()=>actOnce("actPercee")&&p.age>=19&&p.age<=21&&!perceeOk(),
    txt:()=>"Le coach te convoque dans son bureau. « Je vais être clair. Cette saison, je te donne dix matchs. Si tu me convaincs, la place est à toi. Sinon, je recrute quelqu'un à ton poste cet été. »",
    ch:[{t:"« Dix matchs, c'est plus qu'il ne m'en faut. »",risk:{p:()=>clamp(.45+(p.lvl-p.club.str)*.02,.15,.8),good:{play:14,rep:3,moral:4,txt:"Tu marques ta place dès le troisième match. Le coach ne parle plus de recruter."},bad:{play:-6,moral:-5,txt:"Tu as voulu trop en faire. Après cinq matchs, retour sur le banc."}}},
        {t:"Demander ce qu'il attend exactement",fx:{play:8,trust:6},why:"Il prend vingt minutes pour t'expliquer. Tu sais enfin où tu vas."},
        {t:"Demander à être prêté pour jouer",fx:{flag:"wantLoan",moral:2},why:"« C'est peut-être sage. » Il appelle quelques clubs."}]},
  {id:"actSommet",scene:"vestiaire",weight:6,cond:()=>actOnce("actSommet")&&p.age>=23&&p.age<=25,
    txt:()=>"Dans le vestiaire, un gamin de dix-sept ans tout juste monté du centre t'appelle « monsieur ». Tout le monde rit. Toi aussi, un peu. Tu n'es plus un espoir : tu es la référence. Les années qui viennent sont celles qui comptent.",
    ch:[{t:"Viser le plus grand club possible",fx:{flag:"forceDepart",moral:3},why:"Ton agent a compris le message. Cet été, ton téléphone va sonner."},
        {t:"Devenir la légende de ce club",fx:{trust:8,moral:4,rep:2},why:"Les supporters ont entendu. Le coach aussi."},
        {t:"Prendre le gamin sous ton aile",fx:{protege:1,moral:4},why:"Il te suit partout. Tu te revois, quelques années plus tôt."}]},
  {id:"actFin",scene:"echo",weight:8,cond:()=>actOnce("actFin")&&p.age>=30&&p.age<=33,
    txt:()=>`Trente ans passés. Un soir, seul dans le vestiaire après tout le monde, tu regardes ton casier plus longtemps que d'habitude. Il reste quelques saisons. Tu sais déjà de quoi tu veux qu'elles aient l'air.${p.cf?" Tu repenses à un dimanche de pluie, à seize ans.":""}`,
    ch:[{get t(){ return `Finir ici, à ${p&&p.club?p.club.name:"ton club"}`; },fx:{trust:6,moral:4,flag:"danseClub"},why:"Ici. Avec ces supporters-là. Jusqu'au bout."},
        {t:"Revenir là où tout a commencé",fx:{moral:5,flag:"danseRacines"},why:"Tu en parles à ton agent. Ton premier club sera prévenu."},
        {t:"Un dernier voyage, loin, sous d'autres lumières",fx:{moral:3,money:20,flag:"danseExo"},why:"Les États-Unis, le Japon… Ton agent a déjà des noms."}]}
);

/* ============ Les scènes propres à chaque chapitre ============ */
// une saison de 20 ans ne ressemble pas à une saison de 27 ou de 33 ans : ces scènes ne sortent que dans leur chapitre
const inAct = id=>!p.daily&&!p.friend&&actOf(p.age).id===id;
EVENTS.push(
  // la percée
  {id:"chEchauffement",scene:"terrain",weight:3,cond:()=>inAct("percee")&&p.age>=18&&!perceeOk(),
    txt:()=>"Échauffement d'un match à l'extérieur. Le titulaire à ton poste se tient la cuisse et sort en grimaçant. Le coach se tourne vers le banc et te regarde : « Tu es prêt ? »",
    ch:[{t:"« Prêt depuis toujours. »",risk:{p:()=>clamp(.5+(p.lvl-p.club.str)*.025+(p.form-60)/200,.2,.8),good:{play:10,rep:2,moral:4,txt:"Un match plein, une passe décisive. Le lendemain, ton nom est dans la composition type du journal."},bad:{play:-3,moral:-4,txt:"Tu as joué comme on tremble. Le coach te remplace à l'heure de jeu, sans un mot."}}},
        {t:"Demander deux minutes pour te concentrer",fx:{play:5,form:2},why:"Écouteurs, respiration, trois sprints. Tu entres sur le terrain la tête froide. Un match propre, sans éclat."}]},
  {id:"chVideo",scene:"vestiaire",weight:2,cond:()=>inAct("percee")&&p.age>=18,
    txt:()=>"L'analyste vidéo du club t'a préparé un montage : tes quarante dernières pertes de balle, une par une. « Je ne veux pas t'humilier. Je veux que tu voies ce que voient les adversaires. »",
    ch:[{t:"Tout regarder, et revenir demain",fx:{lvl:1,trust:4,moral:-1},why:"Deux heures, deux jours de suite. Tu ne referas plus jamais ce contrôle orienté vers l'intérieur."},
        {t:"« Montre-moi plutôt ce que je fais bien. »",fx:{moral:3},why:"Il soupire, puis lance un autre montage. Tu repars confiant, mais tu n'as rien appris."}]},
  // le sommet
  {id:"chGolfe",scene:"argent",weight:2,cond:()=>inAct("sommet")&&p.rep>=40&&p.defi!=="fidele",
    txt:()=>`Ton agent pose son téléphone sur la table. « Un club du Golfe. Trois fois ton salaire, quatre ans, maison avec piscine. Ils veulent une réponse avant vendredi. » Tu as ${p.age} ans.`,
    ch:[{t:"Refuser : ta carrière se joue ici",fx:{moral:3,rep:2,trust:3},why:"« Je le savais. » Ton agent sourit. La presse apprend le refus et adore ton ambition."},
        {t:"T'en servir pour renégocier ton contrat",risk:{p:()=>clamp(.4+p.rep/200,.3,.8),good:{salary:1.3,txt:"Ton président a compris le message : nouveau contrat, salaire en hausse."},bad:{trust:-6,moral:-2,txt:"Le président n'a pas aimé la manœuvre. L'ambiance se rafraîchit."}}},
        {t:"Y réfléchir vraiment",fx:{money:30,moral:-2},why:"Tu passes la semaine à hésiter. Tu dis non, finalement, mais le club t'a offert une prime pour rester."}]},
  {id:"chClans",scene:"vestiaire",weight:2,cond:()=>inAct("sommet")&&p.age>=25,
    txt:()=>"Le vestiaire s'est coupé en deux : les anciens, qui veulent que le coach parte, et les jeunes, qui le défendent. Tout le monde attend de savoir de quel côté tu te ranges.",
    ch:[{t:"Réunir tout le monde, sans le coach",risk:{p:()=>clamp(.4+p.rep/150+(typeof qd==="function"?qd("lea")/100:0),.25,.85),good:{rep:3,trust:4,moral:3,txt:"Une heure de vérité. Le lendemain, le groupe s'entraîne comme jamais. On te regarde autrement."},bad:{moral:-4,trust:-3,txt:"Ça s'est fini en cris. Le président a eu vent de la réunion."}}},
        {t:"Rester en dehors de ça",fx:{form:2},why:"Tu te concentres sur ton jeu. Personne ne peut te le reprocher. Personne ne te remercie non plus."}]},
  // la dernière danse
  {id:"chRecup",scene:"sante",weight:3,cond:()=>inAct("fin"),
    txt:()=>"Il te faut maintenant deux jours pour récupérer d'un match. Le préparateur physique te propose un programme sur mesure : cryothérapie, sommeil surveillé, plus de dessert.",
    ch:[{t:"Tout accepter, même le dessert",fx:{form:6,money:-10,moral:-1},why:"Tu dors dix heures, tu manges des légumes vapeur. Et sur le terrain, tu cours comme à 26 ans."},
        {t:"Jouer moins pour jouer mieux",fx:{play:-6,form:4,trust:2},why:"Le coach accepte de te ménager. Tu choisis tes matchs ; tu les joues tous à fond."},
        {t:"« Mon corps, je le connais. »",risk:{p:.5,good:{form:2,txt:"Tu tiens la saison à l'instinct. Pour cette fois."},bad:{form:-8,moral:-3,txt:"Une contracture en novembre, une autre en février. Ton corps t'a parlé, tu n'as pas écouté."}}}]},
  {id:"chDerniere",scene:"medias",weight:3,cond:()=>inAct("fin")&&p.age>=32&&p.rep>=25,
    txt:()=>"Conférence de presse d'avant-match. Un journaliste, au dernier rang : « On entend dire que c'est votre dernière saison. Vous confirmez ? »",
    ch:[{t:"« Je déciderai à la fin. Quand je ne prendrai plus de plaisir. »",fx:{moral:2,rep:1},why:"Réponse sobre. Les titres du lendemain parlent d'un joueur serein."},
        {t:"« Vous me verrez encore longtemps. »",fx:{moral:4,form:2},why:"La salle rit. Mais ce soir-là, tu cours plus que tout le monde."},
        {t:"Lui laisser croire que oui",fx:{rep:4,moral:-1},why:"Chaque stade où tu passes se lève pour t'applaudir. Tu ne sais plus très bien si tu mentais."}]}
);
// les drapeaux de la dernière danse deviennent un choix lisible
function danseSync(){
  if(!p||!p.flags) return;
  const f = p.flags;
  if(f.danseClub===true){ f.danse = "club"; f.danseClub = p.club.name; }
  if(f.danseRacines){ delete f.danseRacines; f.danse = "racines"; }
  if(f.danseExo){ delete f.danseExo; f.danse = "exotique"; }
}
// la dernière danse réussie : finir là où tu l'as décidé
function danseOk(){
  danseSync();
  const d = p.flags&&p.flags.danse, last = p.club;
  if(!d||!last) return null;
  return d==="club"?last.name===p.flags.danseClub:d==="racines"?last.name===p.clubsHist[0]:["US","JP"].includes(last.country);
}

/* ============ Le bilan : tes trois chapitres ============ */
function chaptersCard(){
  if(p.daily||p.friend) return "";
  const a = p.acts||{}, d = danseOk();
  const row = (act,st,txt)=>`<div class="ach ${st===false?"off":""}"><span class="i">${st===true?"✓":st===false?"✗":"·"}</span><div><b>Chapitre ${actIdx(act)} · ${act.n}</b><small>${txt}</small></div></div>`;
  return `<div class="card chap-end"><h3>📖 Tes chapitres</h3>
    ${row(ACTS[0],a.percee==="ok"?true:a.percee==="ko"?false:null,a.percee==="ok"?"Titulaire avant 23 ans.":a.percee==="ko"?"Pas de place de titulaire avant 23 ans.":"Carrière terminée avant la fin du chapitre.")}
    ${row(ACTS[1],a.sommet==="ok"?true:a.sommet==="ko"?false:null,a.sommet==="ok"?esc(cap1((p.moments.find(m=>/Au sommet :/.test(m))||"").split("Au sommet : ")[1]||"Un grand titre"))+".":a.sommet==="ko"?"Aucun grand titre avant 30 ans.":"Carrière terminée avant la fin du chapitre.")}
    ${row(ACTS[2],d,d===null?(p.age>=30?"Tu n'as pas choisi comment partir.":"Jamais atteint."):d?{club:`Fin de carrière à ${esc(p.club.name)}, comme promis.`,racines:"De retour là où tout a commencé.",exotique:"Un dernier voyage, sous d'autres lumières."}[p.flags.danse]:"Le choix fait à 30 ans ne s'est pas réalisé.")}</div>`;
}

/* ============ La saison décisive ============ */
// la dernière saison d'un chapitre pas encore réussi : un moment de plus pour forcer le destin
function chapterDeadline(){
  if(!p||p.daily||p.friend) return null;
  if(p.age===22&&!perceeOk()) return ACTS[0];
  if(p.age===29&&!sommetTitle()) return ACTS[1];
  return null;
}

/* ============ Le match clé, aux couleurs du chapitre ============ */
// quand le classement ne fait pas du match clé un choc décisif, le « derby » de fin de saison prend la couleur du moment
// de la carrière : on ne rejoue pas le même match chaque année. Chaque affiche a son texte d'avant-match, son dialogue
// sur le terrain (MATCH_TALKS, id "c_…") et ses conséquences.
const oldClubsIn = lg=>lg.filter(x=>p.clubsHist.includes(x.name));
const byStr = lg=>lg.slice().sort((a,b)=>b.str-a.str);
const CHAP_MATCHES = [
  {id:"place",acts:["percee"],w:3,cond:()=>!perceeOk()&&p.age>=18,opp:lg=>byStr(lg)[Math.min(lg.length-1,RI(3,7))],
    t:o=>`Le match pour ta place face ${auC(o.name)}`,log:()=>"📖 Le coach t'a prévenu à l'entraînement : ce soir, tu commences. Fais-le regretter de ne pas l'avoir fait plus tôt."},
  {id:"affichePremiere",acts:["percee"],w:2,cond:()=>!p.flags.affichePremiere,opp:lg=>byStr(lg)[0],
    t:o=>`Ta première grande affiche face ${auC(o.name)}`,log:o=>`🏟️ ${LeC(o.name)}, ses stars, son stade plein à craquer. Il y a deux ans, tu les regardais à la télévision.`},
  {id:"anciens",acts:["percee","sommet","fin"],w:4,cond:lg=>oldClubsIn(lg).length>0,opp:lg=>pick(oldClubsIn(lg)),
    t:o=>`Retour chez ton ancien club, ${leC(o.name)}`,log:o=>`🏟️ ${LeC(o.name)}. Tu connais chaque recoin de ce vestiaire, chaque employé du stade. Ce soir, tu es dans l'autre camp.`},
  {id:"affiche",acts:["sommet"],w:3,cond:()=>p.club.str>=76,opp:lg=>byStr(lg)[0],
    t:o=>`L'affiche de la saison face ${auC(o.name)}`,log:o=>`📺 Diffusé dans quarante pays. Les deux meilleurs joueurs du championnat sur la même pelouse : toi, et la star ${duC(o.name)}.`},
  {id:"piege",acts:["sommet","fin"],w:2,cond:()=>p.club.str>=72,opp:lg=>byStr(lg).at(-1),
    t:o=>`Le match piège chez ${leC(o.name)}`,log:o=>`⚠️ ${LeC(o.name)} est dernier, le terrain est gras, et ils n'ont rien à perdre. Tout le monde vous voit gagner. C'est exactement comme ça qu'on perd.`},
  {id:"heritier",acts:["fin"],w:3,cond:()=>true,opp:lg=>pick(byStr(lg).slice(0,6)),
    t:o=>`L'ancien contre le nouveau, face ${auC(o.name)}`,log:()=>"👶 En face, un gamin de 19 ans que tout le pays présente comme ton héritier. Les journaux ont fait leur une : vous deux, côte à côte."},
  {id:"adieux",acts:["fin"],w:3,cond:()=>p.age>=33,opp:lg=>lg.slice().sort((a,b)=>Math.abs(a.str-p.club.str)-Math.abs(b.str-p.club.str))[0],
    t:o=>`Peut-être ton dernier grand soir, face ${auC(o.name)}`,log:()=>"🌙 Personne ne l'a dit à voix haute. Mais dans les tribunes, il y a des banderoles avec ton nom, et ta famille est là, au complet."}
];
// tirée à la mise en place du match clé ; jamais deux fois de suite la même affiche
function chapterMatch(lg){
  if(!p||p.daily||p.friend||!lg.length) return null;
  const a = actOf(p.age).id, last = p.lastChapMatch;
  const pool = CHAP_MATCHES.filter(c=>c.acts.includes(a)&&c.id!==last&&c.cond(lg));
  if(!pool.length||!chance(.75)) return null;
  let r = Math.random()*pool.reduce((s,c)=>s+c.w,0), c = pool[0];
  for(const x of pool){ r -= x.w; if(r<=0){ c = x; break; } }
  const o = c.opp(lg); if(!o) return null;
  p.lastChapMatch = c.id;
  if(c.id==="affichePremiere") p.flags.affichePremiere = true;
  return {id:c.id,opp:o,t:c.t(o),log:c.log(o)};
}
// après le coup de sifflet final : ce que l'affiche change
function chapterMatchAfter(m,res){
  const k = m.chap; if(!k) return;
  const y = p.year+1, good = res==="w"||(res==="d"&&m.perf>=1);
  if(k==="place"){ p.tmp.play += good?6:-3; if(p.rel) p.rel.trust = clamp(p.rel.trust+(good?6:-3),0,100); if(good&&m.perf>=1) p.moments.push(`${y} · Le soir où il a gagné sa place`); }
  if(k==="affichePremiere"&&res==="w") p.moments.push(`${y} · Première grande affiche, première victoire face ${auC(m.opp.name)}`);
  if(k==="anciens"&&m.myG>0) p.moments.push(`${y} · Buteur contre son ancien club, ${leC(m.opp.name)}`);
  if(k==="affiche"&&res==="w") p.rep = clamp(p.rep+2,0,100);
  if(k==="piege"&&res==="l"){ p.moral = clamp(p.moral-3,0,100); m.log.push("⚠️ Le piège s'est refermé. On en parlera toute la semaine."); }
  if(k==="heritier"&&m.perf>=1){ p.rep = clamp(p.rep+2,0,100); p.moments.push(`${y} · A rappelé à tout le monde qui était le patron, face au jeune prodige`); }
  if(k==="adieux"&&res==="w") p.moments.push(`${y} · Un grand soir de plus, sous les banderoles à son nom`);
}
// les dialogues sur le terrain qui vont avec chaque affiche
/** @type {any[]} */ (MATCH_TALKS).push(
  {id:"c_place",who:"📋 Le coach",cond:m=>m.chap==="place",txt:()=>"À l'échauffement, le coach passe derrière toi et te glisse : « Je ne te demande pas d'être génial. Je te demande d'être là pendant quatre-vingt-dix minutes. »",o:[
    {t:"Jouer simple, sans une seule erreur",fx:{boost:.04,calm:true},r:"Passe courte, replacement, passe courte. Le coach hoche la tête à chaque ballon."},
    {t:"Lui montrer que tu peux faire basculer un match",risk:{p:()=>clamp(.4+(p.lvl-p.club.str)*.02,.2,.7),good:{boost:.08,moral:3,txt:"Ton premier dribble soulève le stade. Le coach applaudit."},bad:{boost:-.04,moral:-2,txt:"Ballon perdu, contre adverse. Le coach se retourne vers son banc."}}}]},
  {id:"c_affichePremiere",who:"🏟️ Le tunnel",cond:m=>m.chap==="affichePremiere",txt:()=>"Dans le tunnel, leur capitaine, que tu as tant regardé à la télé, te tend la main. « C'est toi, le petit dont tout le monde parle ? »",o:[
    {t:"« Tu verras bien sur le terrain. »",risk:{p:.5,good:{boost:.07,moral:2,txt:"Il sourit. À la vingtième minute, tu lui passes le ballon entre les jambes."},bad:{boost:-.03,txt:"Il ne te lâche plus de la soirée. Chaque duel est une leçon."}}},
    {t:"Lui serrer la main, simplement",fx:{boost:.04,form:1},r:"Respect. Et une fois le coup d'envoi donné, plus aucun respect."}]},
  {id:"c_anciens",who:"🏟️ Ton ancien public",cond:m=>m.chap==="anciens",txt:()=>`À l'annonce de ton nom, les supporters ${p.match?duC(p.match.opp.name):"du club"} se partagent : la moitié applaudit, l'autre siffle.`,o:[
    {t:"Applaudir ceux qui t'applaudissent",fx:{rep:2,moral:2},r:"Une ovation. Même tes anciens coéquipiers tapent dans leurs mains."},
    {t:"Rester de marbre et jouer",fx:{boost:.06},r:"Pas un regard vers la tribune. Ils comprendront ce soir que tu es parti pour une raison."}]},
  {id:"c_affiche",who:"📺 La télévision",cond:m=>m.chap==="affiche",txt:()=>"La caméra ne te lâche pas. Avant le match, le consultant a passé dix minutes à parler de ton duel avec leur star.",o:[
    {t:"Gagner ce duel, coûte que coûte",risk:{p:()=>clamp(.45+(p.lvl-80)*.02,.25,.75),good:{boost:.08,rep:2,txt:"Tu le domines de la tête aux pieds. Le réalisateur montre le ralenti trois fois."},bad:{boost:-.05,rep:-1,txt:"Il t'a fait tourner en bourrique sur une action. Le ralenti aussi, ils le passent trois fois."}}},
    {t:"Jouer pour l'équipe, pas pour la caméra",fx:{boost:.05,calm:true},r:"Le bloc tient. Les héros, ce sera pour les journaux de demain."}]},
  {id:"c_piege",who:"⚠️ Le terrain",cond:m=>m.chap==="piege",txt:()=>"Ils jouent chaque ballon comme une finale. Un tacle par derrière, pas de carton. Tes coéquipiers commencent à perdre leurs nerfs.",o:[
    {t:"Calmer tout le monde",fx:{calm:true,moral:1},r:"« Eux n'ont que ça. Nous, on a le ballon. » Le calme revient."},
    {t:"Répondre par l'impact physique",risk:{p:.5,good:{boost:.07,txt:"Ton premier duel gagné rend le stade muet. Ils ont compris."},bad:{boost:-.05,moral:-2,txt:"Carton jaune, et l'adversaire galvanisé."}}}]},
  {id:"c_heritier",who:"👶 Le gamin d'en face",cond:m=>m.chap==="heritier",txt:()=>"Sur un arrêt de jeu, le jeune prodige s'approche de toi, un peu gêné : « J'avais ton poster dans ma chambre. »",o:[
    {t:"« Alors tu sais ce qui t'attend. »",fx:{boost:.07},r:"Il rit, nerveux. Le ballon suivant, tu le lui prends sans ménagement."},
    {t:"Lui donner un conseil",fx:{rep:2,moral:3,boost:.02},r:"« Ne joue jamais pour les caméras. » Il hoche la tête. Les réseaux adoreront la photo."}]},
  {id:"c_adieux",who:"🌙 Les tribunes",cond:m=>m.chap==="adieux",txt:()=>"À la 80e minute, tout le stade se lève et chante ton nom. Le match n'est pas fini.",o:[
    {t:"Lever les bras vers eux",fx:{rep:2,moral:4},r:"Tu as la gorge serrée. Dans la tribune, ta famille filme."},
    {t:"Rester concentré jusqu'au bout",fx:{boost:.06},r:"Pas encore. Les émotions, ce sera pour plus tard."}]}
);
