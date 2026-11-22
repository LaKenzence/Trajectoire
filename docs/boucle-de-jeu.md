# La boucle de jeu : moins de saisons moyennes, plus de grandes saisons

## Le constat

Une carrière simulée dure environ 21 saisons et 64 événements. Chaque saison suit le même moule : objectif, trois
moments, match clé, bilan, été. Le contenu est riche, mais ce moule répété vingt fois rend le milieu de carrière
répétitif, et beaucoup de choix (« Moral +2 ») ne se sentent pas.

On ne réécrit pas le moteur : il marche et il est testé. On change la façon dont le contenu est servi.

## Les trois principes

1. **Des saisons de longueur variable.** Une saison est soit *grande* (elle se joue en détail), soit *de transition*
   (elle passe vite : deux moments, pas de match de championnat à jouer, le match clé se simule, puis le bilan).
   Le joueur peut toujours demander à jouer une saison de transition en détail.
2. **Des fils d'histoire.** Chaque saison annonce ses intrigues (le chapitre, le rival, un coéquipier, le
   président…). Les scènes qui font avancer ces intrigues sortent en priorité ; les scènes isolées passent derrière.
3. **Moins de bruit à l'écran.** Ce qui fait vivre l'histoire reste au premier plan ; le reste se replie.

## Qu'est-ce qu'une grande saison ?

Raisons fortes (toujours une grande saison) :

- la première saison pro, ou la première dans un nouveau club ;
- un chapitre qui commence, ou sa saison décisive (la dernière chance) ;
- des retrouvailles au vestiaire ;
- la fin qui approche (le corps est à un an de sa limite) ;
- jamais plus de deux saisons de transition d'affilée.

Raisons faibles (une grande saison seulement si la précédente était de transition, car elles reviennent presque
chaque année dans un grand club) :

- une Coupe des Champions à jouer, une année de Coupe du Monde quand on est déjà sélectionné ;
- un rival dans le même championnat ;
- la course au titre l'an dernier (dans les 2 premiers).

Sinon, la saison est de transition. Les suites d'anciens choix (échos du passé) sortent en priorité dans n'importe
quelle saison, elles n'ont pas besoin d'une grande saison.

Mesure (rapport d'équilibrage, 30 carrières) : environ 7,5 saisons de transition sur 21, soit un tiers de la
carrière qui passe vite, sans changer les niveaux, trophées ni Ballons d'Étoile.

## Ce qu'on garde, ce qu'on change

| On garde | On change |
| --- | --- |
| Le moteur (clubs, championnat, simulation, tests) | Le moule unique de saison → grande / transition |
| Les événements, les personnages, la mémoire | Le tirage au hasard → priorité aux intrigues de la saison |
| Le match clé joué en détail | Seulement dans les grandes saisons (simulé sinon) |
| Les mini-jeux 3D | Rien |
| Les jauges principales | Les cartes secondaires se replient dans les saisons de transition |

## Ordre de travail

1. Saisons de longueur variable (le plus d'effet pour le moins de risque).
2. Intrigues de la saison : annonce sur l'écran d'objectif, priorité dans le tirage.
3. Allègement de l'écran d'avant-saison.
4. Mesurer : rapport d'équilibrage (nombre d'écrans par carrière), puis faire jouer de vrais joueurs.

## À faire plus tard

- Des conséquences plus fortes sur moins de choix : revoir les scènes aux effets trop faibles (±2).
  Fait en partie (2026-11-22) : le moral et la réputation ne restent plus collés à 100 (avant, dès 20 et 23 ans,
  tous les « Moral +2 » et « Réputation +1 » étaient sans effet). En fin de saison, le moral se rapproche de
  l'humeur de la saison (temps de jeu, trophées, objectif) et la réputation de ce que vaut la saison (note, club,
  trophées, sélection, niveau). Milieu de carrière : moral ~86, réputation ~84, le plafond est réservé aux stars.
  Les effets affichés sont les vrais (« Moral au max » au lieu d'un faux « +4 »), et les événements dont aucun
  choix ne pesait ont été renforcés. Reste : relire les autres choix à ±2 maintenant que les jauges bougent.
- Un match clé plus intense : le score en direct, deux ou trois décisions vraiment décisives.
  Fait en partie (2026-11-22) : la dernière action d'un match serré décide vraiment, et les chances affichées
  ne sont plus presque toutes « Plutôt sûr » en milieu de carrière (~73 % au lieu de ~81 %).
- Tester avec 3 ou 4 joueurs et noter où ils décrochent.

## Ajouté le 2026-11-22

- Fil d'actu (js/ecrans/actu.js) : deux brèves sous chaque moment (rival, classement, ancien club, protégé,
  anciens coéquipiers, mercato, sélection). Purement narratif.
- Soirées de Coupe des Champions (ordinaires.js) : un match de groupe joué au 2e moment, puis le huitième de finale
  retour au 3e si le club passe. Leurs résultats décident du parcours (cdcPath).
- Vestiaire qui réagit (coequipiers.js) : le mode de vie fait bouger l'affection chaque saison ; en match, le
  coéquipier qui t'adore te cherche (petit élan), celui que tu as froissé t'ignore.
- Projet d'une saison de transition (rythme.js) : un chantier perso au choix, qui paie au bilan.
- Rupture des croisés en plusieurs saisons : le match du retour après l'opération, ou le genou fragile du
  retour express qui se rappelle à toi (evenements.js : genouRetour, genouAlerte).
