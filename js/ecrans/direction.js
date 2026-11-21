// Trajectoire · La direction des clubs : chaque club a un dirigeant nommé (directeur sportif ou président), avec son
// caractère, qui parle pendant la négociation et l'été, et qui se souvient : un refus, une offre retirée, un départ.
// Le dirigeant est tiré du nom du club (toujours le même) ; sa mémoire est dans p.bosses[club] = {met, mem:{…}}.

const BOSS_KINDS = {
  batisseur:{n:"le bâtisseur",d:"Il pense projet, centre de formation, années."},
  affaires:{n:"l'homme d'affaires",d:"Il parle chiffres, revente, image."},
  sanguin:{n:"le sanguin",d:"Il décide avec le cœur et oublie peu."},
  paternel:{n:"le paternel",d:"Il connaît le prénom de chaque gamin du centre."}
};
function boss(club){
  const name = typeof club==="string"?club:club.name, c = CLUBS.find(x=>x.name===name)||{str:70};
  const h = hashStr("dir:"+name);
  return {n:FIRST[h%FIRST.length]+" "+LAST[(h>>>7)%LAST.length],role:c.str<72?"président":"directeur sportif",
    kind:Object.keys(BOSS_KINDS)[(h>>>12)%4],club:name};
}
function bossMem(club){ const b = p.bosses = p.bosses||{}; return b[club]||(b[club] = {met:null,mem:{}}); }
// ce que le dirigeant dit, selon son caractère et ce qu'il se rappelle de toi
function bossLine(club,sit,x){
  const B = boss(club), M = bossMem(club).mem, k = B.kind;
  const lines = {
    open:()=>M.walk?`« La dernière fois, tu as tellement tiré sur la corde que j'ai raccroché. On recommence, mais je n'ai pas oublié. »`
      :M.refused?`« ${p.year-M.refused<1?"Tout à l’heure":`Il y a ${p.year-M.refused} an${p.year-M.refused>1?"s":""}`}, tu nous as préféré ${M.refusedFor||"un autre club"}. Je te repose la question : tu viens, cette fois ? »`
      :M.left?`« Tu es parti d'ici en ${M.left}. Je n'ai jamais arrêté de penser que tu reviendrais. »`
      :{batisseur:"« Je ne t'achète pas pour une saison. Je t'achète pour construire quelque chose autour de toi. »",affaires:`« Parlons franchement : tu as une valeur, j'ai un budget. Trouvons le chiffre. »`,sanguin:"« Je t'ai vu jouer, et j'ai eu des frissons. C'est tout ce que j'ai besoin de savoir. »",paternel:"« Assieds-toi. Café ? Raconte-moi d'abord comment va ta famille. »"}[k],
    yes:()=>({batisseur:"« Si c'est ce qu'il faut pour que tu sois bien ici, d'accord. »",affaires:"« Ça rentre dans les cases. Accordé. »",sanguin:"« Banco ! »",paternel:"« D'accord, mais tu me le rendras sur le terrain. »"}[k]),
    no:()=>({batisseur:"« Non. Ce n'est pas comme ça qu'on construit une équipe. »",affaires:"« Hors budget. Le tableur dit non, et moi aussi. »",sanguin:"« Tu me prends pour qui ? »",paternel:"« Non, fiston. Même pour toi. »"}[k]),
    walk:()=>({batisseur:"« On ne construit rien avec quelqu'un qui ne pense qu'à son salaire. Bonne chance. »",affaires:"« L'offre est retirée. Mon téléphone sonnera pour d'autres. »",sanguin:"« Dehors ! Et ne reviens pas ! »",paternel:"« Tu me déçois. Vraiment. »"}[k]),
    sign:()=>({batisseur:"« Bienvenue. Maintenant, le travail commence. »",affaires:"« Excellente affaire, pour tout le monde. Souris pour la photo. »",sanguin:"« Le stade va exploser à ta présentation ! »",paternel:"« Bienvenue à la maison. »"}[k]),
    // l'été, ton propre club : le bilan de la saison, puis la suite
    summer:()=>{ const L = p.last||{}, ok = L.obj?.ok;
      return M.renewNo?"« On n'a pas prolongé, je sais. Ça ne veut pas dire que je ne te respecte pas. »"
        :ok?{batisseur:"« Objectif atteint. On est sur le bon chemin, et tu en fais partie. »",affaires:"« Bonne saison. Ta valeur a monté. Les miens aussi, d'ailleurs. »",sanguin:"« Quelle saison ! J'ai pleuré dans ma loge, je te le dis. »",paternel:"« Tu as été formidable. Va te reposer, tu l'as mérité. »"}[k]
        :{batisseur:"« Saison manquée. Je ne change pas de cap pour autant. »",affaires:"« Les résultats ne suivent pas. Il faudra en reparler. »",sanguin:"« Je n'ai pas dormi depuis la dernière journée. Il faut que ça change. »",paternel:"« On a tous raté quelque chose cette année. Toi aussi. On se relève. »"}[k]; },
    renew:()=>({batisseur:`« ${x||"Quelques"} ans de plus. Je veux que tu finisses ce qu'on a commencé. »`,affaires:"« Voici notre proposition. Elle est juste. »",sanguin:"« Signe, et on soulève des trophées ensemble ! »",paternel:"« Reste. C'est chez toi, ici. »"}[k]),
    bye:()=>({batisseur:"« Tu pars au moment où on allait récolter. Dommage. »",affaires:"« Merci pour tout. Et pour l'indemnité. »",sanguin:"« Tu nous trahis ! … Bon. Reviens nous voir, quand même. »",paternel:"« Va. Mais la porte reste ouverte. »"}[k])
  };
  return (lines[sit]||lines.open)();
}
// la bulle du dirigeant, avec son portrait
function bossSay(club,sit,x){
  const B = boss(club), k = clubColors(club);
  return `<div class="cf-say boss-say">${avatarSvg(lookFromName(B.n),46,k.a)}<div><b>${esc(B.n)}<small>${cap1(B.role)} ${esc(duC(club))} · ${BOSS_KINDS[B.kind].n}</small></b><p>${esc(bossLine(club,sit,x))}</p></div></div>`;
}
// les souvenirs : une offre laissée de côté, un départ, une offre retirée
function bossRemember(kind,club,extra){
  const M = bossMem(club); M.met = M.met||p.year;
  if(kind==="refused"){ M.mem.refused = p.year; M.mem.refusedFor = extra; }
  if(kind==="walk") M.mem.walk = p.year;
  if(kind==="left") M.mem.left = p.year;
  if(kind==="signed"){ delete M.mem.refused; delete M.mem.walk; M.mem.signed = p.year; }
}
