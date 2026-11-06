// Trajectoire · Défis de départ : des règles du jeu différentes pour renouveler les carrières
// setup() s'applique à la création du joueur ; les autres règles sont lues là où elles comptent (mercato, saison).
const DEFIS = {
  zero:{n:"Parti de rien",i:"🪨",d:"Tu signes dans le plus petit club du monde, avec un niveau plus bas. Potentiel +4.",
    setup(){ const c = CLUBS.reduce((a,b)=>a.str<b.str?a:b); p.club = {...c}; p.clubsHist = [c.name]; p.moments[0] = `${p.year} · Premier contrat pro à ${c.name}, le plus petit club du monde`; p.lvl -= 4; p.pot = clamp(p.pot+4,40,99); }},
  fidele:{n:"Un club, une vie",i:"❤️",d:"Tu ne quitteras jamais ton premier club : ni transfert, ni prêt. Il te prolonge toujours jusqu'à 35 ans.",
    setup(){ p.moral += 4; }},
  verre:{n:"Corps de verre",i:"🩹",d:"Deux fois plus de blessures. Potentiel +5 pour compenser.",
    setup(){ p.pot = clamp(p.pot+5,40,99); }},
  solo:{n:"Sans filet",i:"🎒",d:"Ni agent ni réseaux sociaux de toute ta carrière. Moral d'acier, potentiel +3, mais les offres se font rares.",
    setup(){ p.agent = "aucun"; delete p.flags.influ; p.pot = clamp(p.pot+3,40,99); p.moral += 6; }}
};
const defiOn = k=>p&&p.defi===k;
const defiTag = ()=>p.defi&&DEFIS[p.defi]?`<span class="tag">${DEFIS[p.defi].i} ${DEFIS[p.defi].n}</span>`:"";
