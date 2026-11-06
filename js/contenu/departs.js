// Trajectoire · Points de départ de la carrière et nouveaux défis, débloqués au fil des carrières
// lock : {d: ce qu'il faut faire, t: hof=>vrai quand c'est débloqué}. setup() s'applique après la création, avant le défi.
const DEPARTS = {
  classique:{n:"Club de ta région",i:"🏠",d:"Un petit club de ton pays te donne ta chance. La carrière classique.",setup(){}},
  etranger:{n:"Exil précoce",i:"✈️",d:"Un centre de formation étranger te recrute à 16 ans. Loin de chez toi, potentiel +2, moral −5.",
    setup(){ const c = pick(CLUBS.filter(x=>x.country!==p.country&&x.str<=66)); setStart(c,`Premier contrat pro à l'étranger, au ${c.name}`); p.pot = clamp(p.pot+2,40,99); p.moral -= 5; }},
  grand:{n:"Formé dans un géant",i:"🏰",d:"Le meilleur club de ton pays. Prestige et concurrence féroce : le banc, ou le prêt, te guette.",lock:{d:"Termine une carrière",t:h=>h.careers.length>=1},
    setup(){ const c = CLUBS.filter(x=>x.country===p.country).sort((a,b)=>b.str-a.str)[0]; setStart(c,`Sort du centre de formation du ${c.name}`); p.pot = clamp(p.pot+2,40,99); p.rep += 4; p.lvl -= 2; }},
  tardif:{n:"Joueur tardif",i:"⏱️",d:"Tu as joué en amateur jusqu'à 21 ans. Plus mûr, plus fort tout de suite, mais moins de temps devant toi.",lock:{d:"Termine 3 carrières",t:h=>h.careers.length>=3},
    setup(){ const c = CLUBS.filter(x=>x.country===p.country).sort((a,b)=>a.str-b.str)[0]; setStart(c,`Repéré en amateur à 21 ans par le ${c.name}`); p.age = 21; p.lvl = RI(57,61); p.pot = clamp(p.pot-3,p.lvl+6,99); p.moral += 4; }},
  fils:{n:"Fils de légende",i:"👑",d:"Ton parent a tout gagné. Réputation +15, potentiel +3, de l'argent… et une comparaison permanente.",lock:{d:"Gagne la Coupe des Champions",t:h=>!!h.ach.cdc},
    setup(){ const c = CLUBS.filter(x=>x.country===p.country).sort((a,b)=>b.str-a.str)[2]||p.club; setStart(c,`Débute au ${c.name}, le club où son parent est une légende`); p.rep += 15; p.pot = clamp(p.pot+3,40,99); p.moral -= 4; p.money += 300; p.flags.filsLegende = true; }},
  vieuxLion:{n:"Vieux lion",i:"🦁",d:"Tu reprends une carrière déjà lancée, à 29 ans : un bon niveau, une réputation, et une dernière fenêtre pour tout gagner.",lock:{d:"Remporte un Ballon d'Étoile",t:h=>!!h.ach.ballon},
    setup(){ const c = pick(CLUBS.filter(x=>x.str>=74&&x.str<=82))||p.club; setStart(c,`Reprend sa carrière en main à 29 ans au ${c.name}`); p.age = 29; p.lvl = RI(76,80); p.pot = p.lvl+RI(2,4); p.rep = 35; p.money = 3000; p.caps = RI(8,25); p.contract = 2; p.salary = Math.round(Math.pow(c.str-35,2)*.8); p.tp = 3; }}
};
function setStart(c,txt){ p.club = {...c}; p.clubsHist = [c.name]; p.moments[0] = `${p.year} · ${txt}`; }
const isUnlocked = x=>!x.lock||x.lock.t(loadHof());
// défis ajoutés à ceux de defis.js : ils se débloquent aussi
Object.assign(DEFIS,{
  exil:{n:"Exilé",i:"🌍",d:"Tu ne joueras jamais dans ton pays : ni au départ, ni plus tard. Potentiel +3.",lock:{d:"Joue pour 4 clubs dans une carrière",t:h=>h.careers.some(c=>(c.clubs||0)>=4)||!!h.ach.globe},
    setup(){ if(p.club.country===p.country){ const c = pick(CLUBS.filter(x=>x.country!==p.country&&x.str<=64)); setStart(c,`Exil forcé : premier contrat au ${c.name}`); } p.pot = clamp(p.pot+3,40,99); }},
  prodige:{n:"Le prodige",i:"💎",d:"Niveau +8 et réputation +12 dès 16 ans, mais potentiel −3 : tout le monde attend que tu tiennes tes promesses.",lock:{d:"Atteins un niveau de 88 dans une carrière",t:h=>h.careers.some(c=>c.peak>=88)},
    setup(){ p.lvl += 8; p.pot = clamp(p.pot-3,p.lvl+12,99); p.rep += 12; p.flags.prodige = true; }}
});
// un club où le joueur a le droit de signer (l'Exilé ne revient jamais au pays)
const clubAllowed = c=>!(defiOn("exil")&&c.country===p.country);
