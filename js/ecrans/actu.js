// Trajectoire · Le fil d'actu de la saison : entre deux moments, deux brèves sur le monde autour du joueur
// (son rival, le haut du classement, son ancien club, son protégé, ses anciens coéquipiers, le mercato, la sélection).
// Purement narratif : aucune jauge ne bouge. Le tirage dépend de la saison et du moment, pour qu'un même écran
// affiche toujours les mêmes brèves quand on y revient.

// un choix stable pour ce moment de la saison
const actuPick = (arr,salt)=>arr[hashStr(salt+":"+p.year+":"+p.evIdx+":"+p.name)%arr.length];
function actuItems(){
  const out = [], J = RACE_DAYS[Math.min(p.evIdx,2)];
  // ton rival
  if(rivalActive()&&p.rival.club){
    const r = p.rival, c = r.club.name, gb = p.pos==="GB";
    const lines = r.lvl>p.lvl+2?[
      `${r.name} brille ${auC(c)} : la presse locale le compare déjà aux plus grands.`,
      `${r.name} a été élu joueur du mois. Il a remercié « ceux qui ne croyaient pas en lui ».`,
      `Les ralentis tournent en boucle : ${r.name} a encore fait la différence avec ${leC(c)}.`
    ]:r.lvl<p.lvl-2?[
      `${r.name} traverse une période compliquée ${auC(c)} : deux matchs de suite sur le banc.`,
      `Un journaliste demande à ${r.name} s'il te suit. « Je regarde mes matchs, pas les siens. »`,
      `${r.name} a raté un penalty important ce week-end. Les réseaux ne l'ont pas épargné.`
    ]:[
      `${r.name} ${gb?"a gardé sa cage inviolée":"a marqué"} ce week-end avec ${leC(c)}. Vous êtes au coude à coude.`,
      `Dans une interview, ${r.name} parle de toi : « On se pousse l'un l'autre. C'est sain. »`,
      `${r.name} et toi, même niveau, même ambition. Les journaux comptent déjà les points.`
    ];
    out.push({k:"rival",i:"⚔️",t:actuPick(lines,"rv")});
  }
  // le haut du classement
  try{
    const rows = raceTable(J), top = rows[0], snd = rows[1], me = rows.find(x=>x.me);
    if(top&&snd&&me){
      const gap = top.pts-snd.pts;
      if(top.me) out.push({k:"table",i:"📊",t:actuPick([`Vous êtes en tête après ${J} journées. Les journaux commencent à parler ${duC(p.club.name)} comme d'un champion possible.`,`Premiers à la ${J}e journée. Dans les tribunes, plus personne n'ose prononcer le mot « titre ».`],"tb")});
      else if(gap>=6) out.push({k:"table",i:"📊",t:`${LeC(top.n)} caracole en tête avec ${nPl(gap,"point")} d'avance après ${J} journées.`});
      else out.push({k:"table",i:"📊",t:gap?`Bataille en tête : ${leC(top.n)} et ${leC(snd.n)} se tiennent en ${nPl(gap,"point")}.`:`Bataille en tête : ${leC(top.n)} et ${leC(snd.n)} sont à égalité de points.`});
      if(me.pos>=rows.length-2&&J>=18) out.push({k:"bas",i:"📰",t:actuPick([`La presse classe ${leC(p.club.name)} parmi les candidats à la relégation. Le vestiaire a lu l'article.`,`${LeC(p.club.name)} est dans la zone rouge. Le président a parlé aux joueurs, porte fermée.`],"bas")});
    }
  }catch(e){}
  // ton ancien club
  const old = (p.clubsHist||[]).filter(n=>n!==p.club.name).at(-1);
  if(old) out.push({k:"ancien",i:"🏟️",t:actuPick([
    `${cap1(auC(old))}, ton ancien club, les supporters ont chanté ton nom pendant cinq minutes.`,
    `${cap1(auC(old))}, le nouveau numéro qui a pris ton maillot vient de marquer. Il a fait ta célébration.`,
    `${LeC(old)}, ton ancien club, enchaîne trois défaites. Un ancien dirigeant glisse : « Avec lui, c'était différent. »`,
    `${LeC(old)}, ton ancien club, a battu le leader. Tu as regardé le résumé deux fois.`
  ],"old")});
  // ton protégé
  if(p.protege){
    const q = p.protege, here = q.club===p.club.name;
    out.push({k:"protege",i:"🌱",t:actuPick(q.lvl>=75?[
      `${q.name}, ${q.age} ans, fait la une des journaux. Il cite ton nom dans chaque interview.`,
      `Trois clubs étrangers suivent ${q.name}. Il t'a demandé conseil par message, à deux heures du matin.`
    ]:[
      `${q.name}, ${q.age} ans, ${here?"gratte du temps de jeu dans ton club":`gratte du temps de jeu ${auC(q.club)}`}. Il progresse vite.`,
      `${q.name} a marqué son premier but de la saison. Il t'a envoyé la vidéo avant même ses parents.`
    ],"pg")});
  }
  // un ancien coéquipier
  const ex = (p.crew?.gone||[]).find(x=>x.why!=="retraite"&&x.club!==p.club.name);
  if(ex) out.push({k:"ex",i:"👥",t:actuPick([
    `${ex.n}, ton ancien ${ex.role==="capitaine"?"capitaine":ex.role==="mentor"?"mentor":ex.role==="jeune"?"protégé du vestiaire":"meilleur pote"}, est devenu titulaire indiscutable ${auC(ex.club)}.`,
    `${ex.n} a posté une vieille photo de vous deux à l'entraînement. Trois mille commentaires.`
  ],"ex")});
  // le mercato
  const big = CLUBS.filter(c=>c.country!==p.club.country&&c.str>=84);
  if(big.length&&hashStr("mc"+p.year+p.evIdx)%2) out.push({k:"mercato",i:"💸",t:actuPick([
    `Mercato : ${leC(actuPick(big,"m1").name)} prépare une offre record pour ${p.pos==="GB"?"un gardien":p.pos==="DEF"?"un défenseur central":p.pos==="MIL"?"un milieu":"un avant-centre"}. Ton agent jure qu'il n'y est pour rien.`,
    `Mercato : ${leC(actuPick(big,"m2").name)} a changé d'entraîneur. Le nouveau veut tout reconstruire.`,
    `Mercato : un transfert à cent millions secoue le continent. Ton agent t'envoie l'article sans commentaire.`
  ],"mc")});
  // la sélection
  const nat = COUNTRIES[p.country]?.nat||80;
  if(p.age>=19&&p.lvl>=nat-8) out.push({k:"sel",i:"🌍",t:p.caps?`Le sélectionneur ${pays(p.country,"de")} prépare sa prochaine liste. Ton nom revient dans tous les pronostics.`:`Le sélectionneur ${pays(p.country,"de")} était en tribune ce week-end. Personne ne sait pour qui.`});
  // le Ballon d'Étoile
  if(p.rep>=82&&p.age>=21) out.push({k:"ballon",i:"🌟",t:actuPick([`Les bookmakers te placent dans le top 10 du Ballon d'Étoile.`,`Un grand quotidien publie son classement du Ballon d'Étoile. Tu y es. Ton rival aussi ?`],"bal")});
  return out;
}
// deux brèves, jamais les mêmes sujets d'un moment à l'autre de la saison
function actuHtml(){
  if(!p||p.retired||!p.club||p.daily||p.centre||p.story) return "";
  const all = actuItems(); if(!all.length) return "";
  // les sujets montrés à chaque moment restent en mémoire pour la saison (p.tmp repart à zéro chaque année)
  const T = /** @type {any} */ (p.tmp = p.tmp||{}), seen = T.actu = T.actu||{};
  const prev = seen[p.evIdx-1]||[];
  const fresh = all.filter(x=>!prev.includes(x.k)), pool = fresh.length>=2?fresh:all;
  const h = hashStr("actu:"+p.year+":"+p.evIdx), a = pool[h%pool.length], rest = pool.filter(x=>x!==a), b = rest.length?rest[(h>>>5)%rest.length]:null;
  const shown = [a,b].filter(Boolean);
  if(!seen[p.evIdx]) seen[p.evIdx] = shown.map(x=>x.k);
  return `<div class="card actu"><div class="race-head"><span>📰 Ailleurs cette semaine</span></div><ul class="actu-l">${shown.map(x=>`<li><span aria-hidden="true">${x.i}</span> ${esc(x.t)}</li>`).join("")}</ul></div>`;
}

/* ============ L'album de carrière ============ */
// Les unes du Quotidien du Ballon (gardées dans p.album), les trophées et les grands moments, à feuilleter.
function albumScreen(){
  const A = p.album||[], T = p.trophies||[], M = (p.moments||[]).slice(-14).reverse();
  const unes = A.length?`<div class="alb-grid">${A.map((u,i)=>`<button class="alb-une" type="button" onclick="showUne(p.album[${i}])" aria-label="Relire la une : ${esc(u.k)}">
      <span class="alb-mast">Le Quotidien du Ballon · ${esc(u.date)}</span><b>${u.h}</b><span class="alb-img" style="background-image:url('img/${u.img}.webp')"></span><small>${esc(u.k)}</small></button>`).join("")}</div>`
    :`<p class="muted">Pas encore de une à ton nom. Un premier contrat, un trophée, un grand transfert : le Quotidien du Ballon guette.</p>`;
  const tro = T.length?`<ul class="alb-tro">${T.map(t=>`<li>🏆 ${esc(t.t)}</li>`).join("")}</ul>`:`<p class="muted">L'armoire à trophées attend son premier locataire.</p>`;
  const mom = M.length?`<ul class="alb-mom">${M.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";
  openOverlay(`<div class="album"><h2>📖 Album de carrière</h2>
    <h3>Les unes</h3>${unes}
    <h3>L'armoire à trophées · ${nPl(T.length,"trophée")}</h3>${tro}
    ${mom?`<h3>Les derniers grands moments</h3>${mom}`:""}
    <button class="btn" onclick="closeOverlay(this.closest('.overlay'))">Fermer</button></div>`,"Album de carrière");
}
