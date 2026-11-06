// Trajectoire · Le téléphone du joueur : messages (agent, famille, coach, potes, rival) et fil des réseaux sociaux
// Les messages peuvent proposer des réponses rapides avec un effet ; le fil réagit à tes choix, tes matchs et tes publications.
const CONTACTS = {
  agent:{n:()=>agentOf().n,i:()=>agentOf().i},
  famille:{n:()=>"Famille",i:()=>"👪"},
  amour:{n:()=>"Mon cœur",i:()=>"❤️"},
  coach:{n:()=>"Le coach",i:()=>"📋"},
  pote:{n:()=>p.rel?.mate||"Ton pote",i:()=>"🤜"},
  rival:{n:()=>p.rival?.name||"Ton rival",i:()=>"⚔️"},
  club:{n:()=>p.club.name,i:()=>"🏟️"},
  dm:{n:()=>"Message privé",i:()=>"✉️"}
};
const newPhone = ()=>({msgs:[],feed:[],unread:0,posted:null,seq:0});
const phone = ()=>p.phone||(p.phone = newPhone());
function msg(from,txt,replies){
  const P = phone();
  P.msgs.unshift({id:++P.seq,from,txt,y:p.year,replies:replies||null,answered:null});
  P.msgs = P.msgs.slice(0,60); P.unread++;
}
// opts : replies (réponses possibles depuis le fil, comme les messages), com (commentaires imposés)
function post(kind,who,txt,opts){
  const P = phone();
  const likes = Math.round((kind==="moi"?3:1)*(80+p.rep*p.rep*(p.flags.influ?9:4))*R(.4,1.4));
  const com = opts?.com||(kind==="moi"||kind==="journal"||(kind==="fan"&&chance(.35))?comments(kind,txt):[]);
  P.feed.unshift({id:++P.seq,kind,who,txt,likes,y:p.year,com,replies:opts?.replies||null,answered:null});
  P.feed = P.feed.slice(0,50);
}
const followers = ()=>Math.round(300+p.rep*p.rep*(p.flags.influ?260:90)+(p.trophies.length*4000));
const fmtK = n=>n>=1e6?(n/1e6).toFixed(1).replace(".",",")+" M":n>=1000?Math.round(n/1000)+" k":String(n);
const fan = ()=>"@"+pick(["ultra","virage","fan","kop","supporter","mordu"])+"_"+pick(["du","de"])+"_"+p.club.name.split(" ").pop().toLowerCase().normalize("NFD").replace(/[^a-z]/g,"")+RI(7,99);
const JOURNAL = ["@QuotidienBallon","@EchoDuStade","@RadioBallon","@FootInfoDirect"];
const lastName = ()=>p.name.split(" ").pop();
const handle = name=>"@"+name.toLowerCase().normalize("NFD").replace(/[^a-z]/g,"");
const tag = ()=>lastName().normalize("NFD").replace(/[^A-Za-z]/g,"");

/* ============ Réactions automatiques ============ */
// après un choix d'événement : les supporters réagissent selon l'effet sur ta réputation et ton moral
function phoneAfterChoice(e,deltas){
  if(!p.phone) phone();
  const score = deltas.reduce((a,d)=>a+(d.k==="Réputation"?d.v*2:d.k==="Moral"?d.v*.5:0),0);
  const n = lastName(), sc = sceneOf(e);
  if(chance(.65)){
    const good = [`${n} 🔥🔥🔥 on a un vrai joueur`,`Franchement respect à ${n}, ça c'est un pro`,`${n} c'est notre gars ❤️`,`Qu'on lui donne le brassard à ${n} !`];
    const bad = [`${n} il faut se réveiller là…`,`Déçu par ${n}, on attend mieux`,`Je comprends pas ce qu'il fait ${n} 🤦`,`${n} pense plus à ses stories qu'au terrain`];
    const meh = [`Quelqu'un a des nouvelles de ${n} ?`,`${n} discret en ce moment 👀`,`On verra sur le terrain avec ${n}`];
    post("fan",fan(),pick(score>2?good:score<-2?bad:meh));
  }
  if(sc==="medias"&&chance(.6)) post("journal",journo(),`${score>=0?"🎙️":"⚠️"} ${n} fait parler de lui : ${score>=0?"un geste salué par les supporters":"la polémique enfle"}.`);
  if(sc==="perso"&&p.vie?.couple&&chance(.4)) msg("amour",pick(["Je suis tellement fier·e de toi ❤️","Tu rentres à quelle heure ce soir ?","Pense à toi aussi, pas qu'au foot 😘","J'ai vu les infos… appelle-moi."]));
}
// après le match clé
function phoneAfterMatch(M,type){
  const n = lastName(), w = M.res==="w", l = M.res==="l";
  post("journal",journo(),`${w?"✅":l?"❌":"➖"} ${M.title} : ${M.score}${M.tab}. ${M.myG?`${n} buteur${M.myG>1?` (×${M.myG})`:""}. `:""}Note : ${M.mr}.`);
  post("fan",fan(),w?pick([`QUELLE SOIRÉE 🔥 ${n} MONSTRUEUX`,`On est là !!! ${M.score} 💪`,`Je pleure de joie, merci les gars 😭`]):l?pick([`Honte ce soir…`,`On mérite pas ça. Remboursez`,`${n} invisible, comme d'hab`]):`Un point… on aurait pu faire mieux`);
  if(p.celeb&&M.myG) post("fan",fan(),`Cette célébration de ${n} ${CELEBS[p.celeb].i} on la refait tous au city stade`);
  msg("famille",w?pick(["On a tout vu à la télé ! Ta grand-mère a crié 😂","Fiers de toi mon grand. Toujours.","Le quartier entier est dans la rue !"]):l?pick(["Tête haute. On t'aime quoi qu'il arrive.","Une défaite ça arrive. Mange bien ce soir.","Ton père dit que l'arbitre était nul 😅"]):"Beau match quand même ! Bisous");
  if(+M.mr>=7.5) msg("coach","Grand match. Continue comme ça.");
  else if(+M.mr<6) msg("coach","On en parle demain au centre. Viens à 9 h.");
  if(type==="rival"&&p.rival) msg("rival",w?"Bien joué. Profite, la prochaine est pour moi.":"Pas mal… pour un second rôle 😏",[
    {t:"« Rendez-vous au prochain match. »",fx:{moral:2},r:"Il répond par un pouce levé."},
    {t:"« Regarde le tableau d'affichage. »",fx:{rep:1,rival:1},r:"Il te bloque. Puis te débloque."}]);
  socialAfterMatch(M,type);
}
// fin de saison : l'agent fait le point sur ton contrat, le club et le pote réagissent
function phoneAfterSeason(L){
  const n = lastName();
  if(L.tr.length) post("club","@"+p.club.name.replace(/\s+/g,""),`🏆 ${L.tr[0]} ! Merci à tous. ${L.goals||L.clean?`Mention spéciale à ${n}.`:""}`);
  if(L.star) post("journal",journo(),`🌟 ${p.name} remporte le Ballon d'Étoile !`);
  if(p.agent!=="aucun"&&!p.retired){
    const end = p.contract<=1;
    msg("agent",end?`Ton contrat se termine bientôt. On fait quoi ?`:`Belle saison. Des clubs se renseignent sur toi. On en parle ?`,[
      {t:"Trouve-moi un plus grand club",fx:{flag:"forceDepart",trust:-2},r:"« Je m'en occupe. Attends-toi à des appels cet été. »"},
      {t:"Je veux rester ici",fx:{trust:4,moral:1},r:"« Compris. Je fais passer le message au club. »"},
      {t:"On verra cet été",fx:{},r:"« Comme tu veux. »"}]);
  }
  if(chance(.5)&&p.rel) msg("pote",L.rank<=3?"Saison de malade frérot 🔥 vacances ensemble ?":"On a galéré cette année… on remet ça mieux l'an prochain 💪");
  if(p.celeb&&(p.celebN||0)>=5&&!p.flags.celebCulte){ p.flags.celebCulte = true; p.rep = clamp(p.rep+2,0,100); post("journal",journo(),`📹 Les enfants de tout le pays imitent la célébration de ${n} ${CELEBS[p.celeb].i}. Phénomène !`); p.moments.push(`${p.year+1} · Sa célébration devient culte`); }
  socialAfterSeason(L);
}

/* ============ Publier soi-même ============ */
const POSTS = {
  training:{n:"Une vidéo de ton entraînement",i:"🏋️",fx:{rep:1,moral:1},txt:()=>"Le travail paie toujours 💪 #NoDaysOff"},
  fans:{n:"Un message aux supporters",i:"❤️",fx:{rep:2,trust:1},txt:()=>`Merci pour votre soutien, on ne lâche rien. Allez ${p.club.name.split(" ").pop()} !`},
  rival:{n:"Une pique à ton rival",i:"⚔️",ok:()=>rivalActive(),risk:{p:.5,good:{rep:4,moral:2,rival:1,txt:"Le tweet le plus partagé de la semaine."},bad:{rep:-3,trust:-2,txt:"Retour de bâton : on te trouve arrogant."}},txt:()=>`Certains parlent beaucoup. Moi je réponds sur le terrain. 😉`},
  vacances:{n:"Une photo de vacances",i:"🏝️",risk:{p:()=>p.last?.rank<=5?.75:.45,good:{moral:3,rep:1,txt:"Des milliers de likes : tes fans adorent te voir sourire."},bad:{rep:-2,moral:-1,txt:"« Il bronze pendant que l'équipe galère » : la photo passe mal."}},txt:()=>"Recharger les batteries ☀️ #vacances"},
  hommage:{n:"Un hommage à un coéquipier",i:"🤝",fx:{trust:3,moral:2,rep:1},txt:()=>`Merci ${p.rel?.mate||"à mes coéquipiers"} pour tout ce que tu donnes. Ce vestiaire, c'est une famille. 💙`},
  challenge:{n:"Un défi viral",i:"🎯",risk:{p:()=>p.trait==="tech"?.65:.5,good:{rep:3,moral:2,txt:"Ton défi est repris par des milliers de gamins."},bad:{rep:-1,moral:-2,txt:"Raté en direct : ta vidéo devient un mème."}},trend:bad=>({tag:bad?`#${tag()}Fail`:`#${tag()}Challenge`,good:!bad}),txt:()=>"Barre transversale depuis 30 mètres, du premier coup. À vous ! 🎯 #Challenge"},
  cause:{n:"Soutenir une cause",i:"🕊️",ok:()=>p.rep>=30||p.flags.fond,fx:{rep:3,moral:2},txt:()=>"Le football peut changer des vies. Je m'engage, et je vous invite à faire pareil. 🕊️"},
  reponse:{n:"Répondre aux critiques",i:"🗣️",ok:()=>!!(p.phone?.trend&&!p.phone.trend.good&&p.phone.trend.y>=p.year-1),risk:{p:()=>p.trait==="lead"?.7:.5,good:{rep:3,moral:3,txt:"Ta réponse calme et digne retourne l'opinion."},bad:{rep:-3,moral:-2,txt:"Ton message est mal compris : la polémique repart de plus belle."}},trend:bad=>bad?null:{tag:`#Respect${tag()}`,good:true},txt:()=>"J'ai lu vos messages. Je les mérite parfois. Je vais répondre là où ça compte : sur le terrain."},
  sponsor:{n:"Un post sponsorisé",i:"💸",ok:()=>p.flags.influ||p.rep>=40,fx:{money:()=>Math.round(20+p.rep*4),rep:-1},txt:()=>"Fier de collaborer avec cette marque incroyable ✨ #partenariat"}
};
const postsLeft = ()=>{ const P = phone(); return P.posted===p.year?Math.max(0,2-(P.postedN||1)):2; };
function publish(k){
  const P = phone(), x = POSTS[k];
  if(!postsLeft()||(x.ok&&!x.ok())||p.defi==="solo") return;
  P.postedN = P.posted===p.year?(P.postedN||1)+1:1; P.posted = p.year;
  let res = x.fx, note = "";
  if(x.risk){ res = chance(x.risk.p)?x.risk.good:x.risk.bad; note = res.txt; }
  const deltas = applyFx(res);
  post("moi",handle(p.name),x.txt());
  if(k==="rival"&&p.rival&&chance(.7)) post("rival",handle(p.rival.name),pick(["Le terrain a déjà parlé 😴","On en reparle après le match.","Qui ?"]));
  if(x.trend){ const t = x.trend(res===x.risk?.bad); if(t) setTrend(t); }
  P.note = `${note} ${deltaHtml(deltas)}`;
  save(); phoneScreen("fil");
}
// répondre à une publication du fil (un fan, un détracteur, un journaliste)
function feedReply(id,j){
  const f = phone().feed.find(x=>x.id===id); if(!f||!f.replies||f.answered!=null) return;
  f.answered = j;
  const r = f.replies[j];
  let fx = r.fx, txt = r.r;
  if(r.risk){ fx = chance(r.risk.p)?r.risk.good:r.risk.bad; txt = fx.txt; }
  const d = applyFx(fx);
  f.com = [...(f.com||[]),{who:handle(p.name),txt:r.t,me:true}];
  if(fx.trend) setTrend(fx.trend);
  phone().note = `${esc(txt)} ${deltaHtml(d)}`;
  save(); phoneScreen("fil");
}
function reply(id,j){
  const m = phone().msgs.find(x=>x.id===id); if(!m||m.answered!=null) return;
  m.answered = j;
  const d = applyFx(m.replies[j].fx);
  phone().note = `${esc(m.replies[j].r)} ${deltaHtml(d)}`;
  save(); phoneScreen("msgs");
}

/* ============ L'écran du téléphone ============ */
function phoneScreen(tab){
  if(!p) return;
  const P = phone(); tab = tab||"msgs";
  if(tab==="msgs") P.unread = 0;
  const note = P.note; P.note = null;
  const msgs = P.msgs.length?P.msgs.map(m=>{ const c = CONTACTS[m.from];
    return `<div class="sms"><span class="sms-i" aria-hidden="true">${c.i()}</span><div><b>${esc(c.n())}</b> <small class="muted">${m.y}</small><p>${esc(m.txt)}</p>
      ${m.replies?m.answered!=null?`<p class="sms-me">Toi : ${esc(m.replies[m.answered].t)}</p>`:m.replies.map((r,j)=>`<button class="hudbtn" onclick="reply(${m.id},${j})">${esc(r.t)}</button>`).join(" "):""}</div></div>`; }).join(""):'<p class="muted">Aucun message pour l\'instant.</p>';
  const canPost = postsLeft()>0&&p.defi!=="solo";
  const compose = p.defi==="solo"?'<p class="muted">Défi « Sans filet » : pas de réseaux sociaux.</p>':canPost?`<details class="compose"><summary><b>✍️ Publier</b> <small class="muted">(encore ${postsLeft()} cette saison)</small></summary>${Object.entries(POSTS).filter(([,x])=>!x.ok||x.ok()).map(([k,x])=>`<button class="btn" onclick="publish('${k}')">${x.i} ${x.n}${x.risk?'<span class="chip">🎲 Risqué</span>':""}</button>`).join("")}</details>`:'<p class="muted" style="font-size:.85rem">Tu as assez publié cette saison.</p>';
  const feed = P.feed.map(f=>`<div class="tweet ${f.kind}"><b>${esc(f.who)}</b>${f.kind==="moi"&&verified()?' <span class="verif" title="Compte certifié">✔</span>':""}<p>${esc(f.txt)}</p><small class="muted">♥ ${fmtK(f.likes)} · 💬 ${(f.com||[]).length} · ${f.y}</small>
    ${(f.com||[]).length?`<ul class="coms">${f.com.map(c=>`<li class="${c.me?"me":""}"><b>${esc(c.who)}</b> ${esc(c.txt)}</li>`).join("")}</ul>`:""}
    ${f.replies&&f.answered==null?`<div class="fil-rep">${f.replies.map((r,j)=>`<button class="hudbtn" onclick="feedReply(${f.id},${j})">${esc(r.t)}${r.risk?" 🎲":""}</button>`).join(" ")}</div>`:""}</div>`).join("")||'<p class="muted">Ton fil est vide.</p>';
  const fol = followers(), prev = P.fol?.at(-2)?.n, trend = P.trend&&P.trend.y>=p.year-1?P.trend:null;
  const head = `<div class="soc-head"><div><b>${fmtK(fol)}</b> abonnés${prev!=null?` <span class="${fol>=prev?"up":"down"}">${fol>=prev?"+":""}${fmtK(fol-prev)} cette saison</span>`:""}${verified()?' · <span class="verif">✔ certifié</span>':""}</div>
    ${trend?`<div class="trend ${trend.good?"good":"bad"}">🔥 En tendance : <b>${esc(trend.tag)}</b></div>`:""}
    ${p.defi==="solo"?"":`<div class="habitues muted">Tes habitués : 📰 ${esc(cast().journo.h)} · ❤️ ${esc(cast().fan)} · 😈 ${esc(cast().hater)}</div>`}
    ${p.defi==="solo"||P.live===p.year||p.retired?"":`<button class="btn live-btn" onclick="startLive()">🔴 Lancer un live<small>Trois questions de tes abonnés, en direct, une fois par saison</small></button>`}</div>`;
  document.querySelector(".overlay")?.remove();
  openOverlay(`<div class="sheet phone" role="document"><div class="phone-top"><h2>📱 Téléphone</h2>${avatarSvg(p.look,30,clubColors(p.club).a)}<span class="muted">${fmtK(followers())} abonnés</span></div>
    <div class="tabs" role="tablist"><button role="tab" aria-selected="${tab==="msgs"}" class="${tab==="msgs"?"on":""}" onclick="phoneScreen('msgs')">💬 Messages</button><button role="tab" aria-selected="${tab==="fil"}" class="${tab==="fil"?"on":""}" onclick="phoneScreen('fil')">📣 Réseaux</button></div>
    ${note?`<div class="toast" role="status">${note}</div>`:""}
    <div class="phone-body">${tab==="msgs"?msgs:head+compose+feed}</div>
    <button class="btn" onclick="closeOverlay(this.closest('.overlay'));route()">Fermer</button></div>`,"Téléphone");
}
const phoneBadge = ()=>p?.phone?.unread?`<span class="badge" aria-label="${p.phone.unread} nouveaux messages">${Math.min(9,p.phone.unread)}${p.phone.unread>9?"+":""}</span>`:"";

/* ============ Réseaux sociaux : tendances, commentaires, bad buzz, rumeurs ============ */
const verified = ()=>followers()>=250000;
function setTrend(t){
  const P = phone();
  P.trend = {...t,y:p.year};
  // l'historique des tendances alimente la frise du bilan de carrière
  if(!(P.trends||[]).some(x=>x.tag===t.tag&&x.y===p.year)) P.trends = [...(P.trends||[]),{tag:t.tag,good:t.good,y:p.year,age:p.age}].slice(-40);
  if(/Clash$/.test(t.tag)) p.flags.clash = true;
}
function comments(kind,txt){
  const n = lastName(), club = p.club.name.split(" ").pop();
  const pools = {
    moi:["🔥🔥🔥","Légende.",`On t'aime ${n} ❤️`,"Moins de posts, plus de buts 😒","Signe chez nous 🙏","Le meilleur du championnat, point.",`Allez ${club} !`,...((p.clubsHist||[]).length>1?[`Reviens au ${p.clubsHist.at(-2)} 😢`]:[]),"Mon fils a ton maillot sur le dos tous les jours"],
    journal:["Il mérite mieux que ça","Surcoté depuis toujours","Enfin on parle de lui","Source ?","Le titre est putaclic","Respect 👏",`${n} > tout le monde`],
    fan:["Tellement vrai","N'importe quoi","+1","😂😂😂","Ratio","Je valide"]
  };
  const pool = pools[kind]||pools.fan;
  const out = shuffle(pool).slice(0,RI(1,kind==="moi"?3:2)).map(t=>({who:fan(),txt:t}));
  if(kind==="moi"&&chance(.3)) out.push({who:cast().fan,txt:pick(["Je suis là depuis le premier jour 🙏","Toujours fier de toi","Je l'avais dit à tout le monde !"])});
  if(kind==="journal"&&chance(.25)) out.push({who:cast().hater,txt:pick(["Surcoté, je le répète depuis des années.","Attendez la saison prochaine, vous verrez.","Encore un article pour lui…"])});
  return out;
}
// après le match clé : tendance, demande de fan ou bad buzz auquel tu peux répondre
function socialAfterMatch(M,type){
  if(p.defi==="solo") return;
  const n = lastName(), w = M.res==="w", l = M.res==="l";
  if(w&&(M.myG>=2||+M.mr>=8)){
    setTrend({tag:M.myG>=3?`#${tag()}HatTrick`:`#${tag()}`,good:true});
    post("fan",chance(.4)?cast().fan:fan(),pick([`${n} tu peux me donner ton maillot au prochain match ? 🥺`,`${n} tu viens à l'anniversaire de mon petit frère ?? Il a 8 ans et il dort avec ton poster`]),{replies:[
      {t:"« Promis ! »",fx:{rep:1,moral:2},r:"Il poste une capture : « IL M'A RÉPONDU 😭 ». Des milliers de partages."},
      {t:"Un cœur, sans plus",fx:{moral:1},r:"Un petit geste, déjà énorme pour lui."}]});
  } else if(l&&+M.mr<6.3&&chance(.75)){
    setTrend({tag:`#${tag()}Out`,good:false});
    post("fan",chance(.6)?cast().hater:fan(),pick([`Vendez ${n}. Il nous coûte des matchs.`,`${n} a joué avec les pieds de son grand-père ce soir`,`Rendez l'argent, ${n} 🤡`]),{replies:[
      {t:"« Je vais travailler pour vous faire changer d'avis. »",fx:{rep:2,moral:-1},r:"La réponse est saluée. Même ce supporter finit par s'excuser."},
      {t:"« Toi, tu joues où déjà ? »",risk:{p:.4,good:{rep:2,moral:2,trend:{tag:`#${tag()}Clash`,good:true},txt:"Réponse culte : tout le monde applaudit."},bad:{rep:-4,moral:-2,trust:-3,txt:"Polémique : on te trouve arrogant. Le club te convoque."}}},
      {t:"Ne rien répondre",fx:{moral:-1},r:"Tu poses le téléphone. Ça finira par passer."}]});
  }
  if(type==="rival"&&p.rival&&chance(.6)) post("rival",handle(p.rival.name),w?pick(["Bravo à eux. Rendez-vous au retour.","Pas notre soirée. On se reverra."]):pick([`Merci ${n} pour le match 😘`,"3 points à la maison 🏠","Certains parlent, d'autres gagnent."]));
}
// fin de saison : historique des abonnés, nouvelles du rival, messages privés
function socialAfterSeason(L){
  const P = phone(), n = lastName();
  P.fol = [...(P.fol||[]),{y:p.year+1,n:followers()}].slice(-20);
  if(p.defi==="solo") return;
  if(!P.verif&&verified()){ P.verif = true; if(p.age<=19) p.flags.certif20 = true; msg("dm","Félicitations ! Ton compte est désormais certifié ✔"); }
  if(L.rival?.note&&p.rival) post("rival",handle(p.rival.name),/signé/.test(L.rival.note)?`Nouveau chapitre. ${L.rival.club} 🔥`:/Ballon/.test(L.rival.note)?"Merci à tous. Ce Ballon d'Étoile est à vous 🌟":"Merci le football. ❤️");
  if(L.star) setTrend({tag:`#BallonDÉtoile${tag()}`,good:true});
  else if(L.rank===1) setTrend({tag:`#Champions${p.club.name.split(" ").pop()}`,good:true});
  if(p.rep>=20&&!p.retired&&chance(.35)){
    const dms = [
      {txt:"Salut ! Je suis streamer (1,2 M d'abonnés). Tu viens sur mon live un soir ? 🎮",replies:[
        {t:"Avec plaisir",fx:{rep:2,form:-2},r:"Le live bat un record d'audience. Tu te couches à 3 h."},
        {t:"Pas le temps, désolé",fx:{form:1},r:"Il comprend. Peut-être plus tard."}]},
      {txt:"Bonjour, je suis infirmière en pédiatrie. Un petit garçon hospitalisé ne parle que de toi. Tu accepterais un appel vidéo ?",replies:[
        {t:"Bien sûr, dès ce soir",fx:{rep:3,moral:4},r:"Il n'a pas arrêté de sourire. Toi non plus."},
        {t:"Envoyer un maillot dédicacé",fx:{rep:1,moral:1},r:"Le maillot est arrivé. Il l'a mis par-dessus son pyjama."}]},
      {txt:"Une marque de vêtements veut créer une collection à ton nom. Intéressé ?",replies:[
        {t:"Fonce",fx:{money:Math.round(40+p.rep*5),rep:1},r:"La collection est en rupture de stock en deux jours."},
        {t:"Seulement si c'est fabriqué proprement",fx:{rep:2,money:Math.round(20+p.rep*2)},r:"Ils acceptent. Les médias saluent ton exigence."}]},
      {txt:`Salut ${n}, c'est un ancien du centre de formation. On jouait ensemble à 15 ans. Tu te souviens de moi ?`,replies:[
        {t:"« Évidemment ! On se voit cet été ? »",fx:{moral:3},r:"Une soirée à refaire le monde comme à 15 ans."},
        {t:"Laisser en vu",fx:{},r:"Le message reste sans réponse."}]}
    ];
    const d = pick(dms); msg("dm",d.txt,d.replies);
  }
}
// intersaison : rumeurs de transfert dans la presse, vraies ou fausses
function phoneRumors(offers){
  if(!p.phone||p.defi==="solo") return;
  const o = offers.filter(x=>!x.loan)[0];
  if(o){
    post("journal",journo(),`🔁 MERCATO · Selon nos informations, ${o.club.name} a formulé une offre pour ${p.name}.`);
    if(chance(.6)) post("fan","@"+pick(["ultra","kop","fan"])+"_"+o.club.name.split(" ").pop().toLowerCase().normalize("NFD").replace(/[^a-z]/g,"")+RI(7,99),`Viens chez nous ${lastName()} 🙏🙏`);
  }
  const big = CLUBS.filter(c=>c.str>=85&&c.name!==p.club.name);
  if(p.rep>=35&&big.length&&chance(.3)){
    const b = pick(big);
    post("journal",journo(),`💣 RUMEUR · ${b.name} penserait à ${p.name}. Le joueur n'a pas démenti.`,{replies:[
      {t:"Démentir : « Je suis bien ici »",fx:{trust:3,rep:1},r:"Les supporters de ton club apprécient ta loyauté."},
      {t:"Laisser planer le doute",fx:{rep:2,trust:-3},r:"Tout le monde en parle. Ton coach, lui, n'apprécie pas."}]});
  }
}

// fin de carrière : jubilé (si la dernière saison a été annoncée), hommages et messages
function farewell(){
  const n = lastName(), crowd = Math.round(clamp(p.club.str*700*(.6+p.rep/120),8000,90000)/100)*100, q = p.protege;
  if(p.flags.adieu){
    p.jubileCrowd = crowd;
    p.jubile = `${crowd.toLocaleString("fr-FR")} spectateurs au ${p.club.name} pour ton dernier match. Tes anciens coéquipiers sont là${p.rival&&!p.rival.retired?", et même "+p.rival.name:""}.${q?` ${q.name}, le gamin que tu as pris sous ton aile, porte le brassard ce soir-là.`:""} À la 90e, le stade entier se lève.`;
    p.moments.push(`${p.year} · Jubilé devant ${crowd.toLocaleString("fr-FR")} spectateurs`);
    p.rep = clamp(p.rep+3,0,100);
  }
  if(p.defi==="solo") return;
  post("club","@"+p.club.name.replace(/\s+/g,""),`Merci pour tout, ${p.name}. ${p.seasons.length} saisons, ${p.trophies.length} trophée(s), une seule passion. 💙 #Merci${tag()}`);
  post("journal",journo(),`📰 ${p.name} raccroche les crampons à ${p.age} ans. Retour sur une carrière ${p.trophies.length>=10?"légendaire":p.trophies.length>=3?"bien remplie":"de combattant"}.`);
  setTrend({tag:`#Merci${tag()}`,good:true});
  if(p.rival) msg("rival",p.rival.retired?"Bienvenue au club des retraités 😄 Tu m'auras fait courir toute ma vie.":"Tu vas me manquer. Sans toi, ça n'a plus la même saveur.");
  msg("famille","On est tellement fiers de toi. Maintenant, tu vas enfin pouvoir venir aux repas du dimanche ❤️");
}

/* ============ Les habitués : des comptes qui te suivent toute ta carrière ============ */
function cast(){
  const P = phone();
  if(!P.cast){
    const j = pick(["Claire Vasseur","Marc Delorme","Inès Bouchard","Paolo Ricci","Léa Montel","Sami Rachedi"]);
    P.cast = {journo:{n:j,h:"@"+j.replace(/\s+/g,"")},
      fan:"@"+pick(["karim","sophie","lucie","jojo","mamadou","nina"])+"_depuis_"+(p.seasons[0]?.y?.slice(0,4)||p.year),
      hater:"@"+pick(["verite","lucide","sansfiltre","objectif","realiste"])+"_foot"+RI(10,99)};
  }
  return P.cast;
}
// la journaliste qui te suit signe une partie des articles ; les autres viennent des rédactions
const journo = ()=>chance(.45)?cast().journo.h:pick(JOURNAL);

/* ============ Live avec les abonnés ============ */
function liveQuestions(){
  const n = lastName(), C = cast(), r = p.rival, trend = p.phone?.trend;
  const pool = [
    {who:fan(),q:"C'est quoi ton rituel avant un match ?",a:[
      {t:"Toujours la même playlist, dans le même ordre.",fx:{moral:1},tone:"humble",r:"Les abonnés demandent la playlist. Elle fait un million d'écoutes."},
      {t:"J'appelle ma mère. Toujours.",fx:{rep:1,moral:1},tone:"humble",r:"Les commentaires fondent de tendresse."},
      {t:"Rien. Je dors dans le bus.",fx:{rep:1},tone:"cash",r:"« Le calme des grands », écrit quelqu'un."}]},
    {who:fan(),q:"Tu signes où l'été prochain ?? 👀",a:[
      {t:"Je suis bien ici, arrêtez 😄",fx:{trust:2},tone:"humble",r:"Les supporters du club adorent."},
      {t:"On verra… 😏",fx:{rep:1,trust:-2},tone:"cash",r:"La capture d'écran tourne sur tous les comptes mercato."},
      {t:"Demandez à mon agent.",fx:{},tone:"froid",r:"Esquive propre."}]},
    {who:C.fan,q:`Je te suis depuis tes débuts ! Tu te souviens de ton premier match pro ?`,a:[
      {t:"Comme si c'était hier. J'avais les jambes en coton.",fx:{moral:2,rep:1},tone:"humble",r:`${C.fan} est aux anges. Les anciens fans partagent leurs souvenirs.`},
      {t:"Franchement non, ça va trop vite.",fx:{},tone:"froid",r:"Un peu de déception dans les commentaires."}]},
    {who:fan(),q:"Un conseil pour les jeunes qui veulent devenir pros ?",a:[
      {t:"L'école d'abord. Le foot peut s'arrêter du jour au lendemain.",fx:{rep:2},tone:"humble",r:"Des profs partagent l'extrait en classe."},
      {t:"Travaillez plus que tout le monde. Point.",fx:{rep:1,moral:1},tone:"cash",r:"L'extrait devient une vidéo de motivation."},
      {t:"Trouvez un bon agent 😂",fx:{rep:-1},tone:"provoc",r:"Ça fait rire… à moitié."}]},
    {who:fan(),q:"Coupe des Champions ou Championnat du Monde, tu choisis quoi ?",a:[
      {t:"Le Monde. Pour mon pays, pour ma famille.",fx:{nat:3,rep:1},tone:"humble",r:"Le sélectionneur a vu le live, paraît-il."},
      {t:"La Coupe des Champions, avec mon club.",fx:{trust:2},tone:"humble",r:"Ton club repartage l'extrait."},
      {t:"Les deux, et le Ballon d'Étoile avec.",fx:{rep:2,moral:1},tone:"cash",r:"Ambitieux. Les commentaires s'enflamment."}]},
    ...(r?[{who:fan(),q:`Tu le détestes vraiment, ${r.name} ?`,a:[
      {t:"Je le respecte. Il me pousse à être meilleur.",fx:{rep:2},tone:"humble",r:`${r.name} like le passage. Respect mutuel.`},
      {t:"On ne partira pas en vacances ensemble 😅",fx:{rep:1,moral:1},tone:"cash",r:"Le live explose de rires."},
      {t:"Qui ?",fx:{rep:1,rival:1},tone:"provoc",r:`La séquence est vue des millions de fois. ${r.name} n'apprécie pas.`}]}]:[]),
    ...(trend&&!trend.good?[{who:C.hater,q:`Et le ${trend.tag}, t'en penses quoi ?`,a:[
      {t:"Ils ont le droit. À moi de leur donner tort.",fx:{rep:3,moral:-1},tone:"humble",r:"Même tes détracteurs saluent la réponse."},
      {t:"Je ne lis pas les commentaires.",fx:{moral:1},tone:"froid",r:"Personne n'y croit, mais c'est passé."},
      {t:"Va jouer, toi, avant de parler.",fx:{rep:-3,moral:2},tone:"provoc",r:"Le clip tourne en boucle. Le club n'apprécie pas."}]}]:[]),
    ...((p.vie?.kids||0)>0?[{who:fan(),q:"Ton enfant veut devenir footballeur ?",a:[
      {t:"Il fera ce qu'il veut. Moi, je serai là.",fx:{moral:2,rep:1},tone:"humble",r:"Les parents dans les commentaires approuvent."},
      {t:"Il a déjà un meilleur pied gauche que moi 😂",fx:{moral:2},tone:"cash",r:"Tout le monde veut voir la vidéo."}]}]:[])
  ];
  return shuffle(pool).slice(0,3);
}
function startLive(){
  const P = phone();
  if(P.live===p.year||p.defi==="solo") return;
  P.live = p.year;
  document.querySelector(".overlay")?.remove();
  const viewers = Math.round(followers()*R(.02,.06));
  Conference.play({title:`🔴 En direct · ${fmtK(viewers)} spectateurs`,questions:liveQuestions()}).then(res=>{
    const d = applyFx(res.fx);
    const provoc = res.tones.filter(t=>t==="provoc").length;
    post("moi",handle(p.name),`Merci d'être venus si nombreux sur le live 🔴 On remet ça bientôt !`);
    if(provoc) post("journal",journo(),`📺 Le live de ${p.name} fait polémique : ${provoc>1?"plusieurs sorties":"une sortie"} mal passée${provoc>1?"s":""}.`);
    P.note = `🔴 Live terminé · ${fmtK(viewers)} spectateurs ${deltaHtml(d)}`;
    save(); phoneScreen("fil");
  });
}
