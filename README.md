# Trajectoire

Jeu de carrière de footballeur, de 16 ans à la retraite : choix, matchs clés joués en direct, penalties et coups francs jouables, dribbles, tacles et passes au bon moment, conférences de presse, téléphone et réseaux sociaux, vestiaire, calendrier, tournois internationaux, vie perso (agent, famille, placements), rival, talents, défis de départ, dynasties et vies d'après-carrière jouables.

Version publiée : https://claude.ai/artifact/7Hpbg6m2A94JtGXD5aPxne (avec les classements partagés)

Version installable sur téléphone : https://lakenzence.github.io/Trajectoire/ (une fois GitHub Pages activé, voir plus bas)

## Lancer en local

```bash
npm start
```

Puis ouvrir http://localhost:5182. Le serveur entoure `trajectoire.html` du même squelette HTML que la page publiée. Aucune installation n'est nécessaire pour jouer : le jeu n'a pas d'étape de build.

## Vérifier avant de publier

```bash
npm install        # une seule fois : installe TypeScript (vérification seulement, rien n'est compilé)
npm run check      # vérification de types de tous les scripts : noms inconnus, fautes de frappe, mauvais arguments
npm test           # carrières complètes jouées par un bot : plantages, « undefined »/« NaN » à l'écran, jauges hors bornes
npm run equilibrage  # rapport chiffré sur 200 carrières, poste par poste (niveau, trophées, Ballons d'Étoile, répétitions…)
npm run equilibrage:rapide  # 30 carrières, pour un coup d'œil après un changement
```

Les carrières d'une série s'enchaînent comme chez un même joueur (Panthéon et carnet gardés) : la ligne « Déjà vus à la carrière d'avant » mesure la part des événements d'une carrière déjà sortis à la précédente.

`npm run equilibrage -- 400 5001` simule 400 carrières à partir de la graine 5001. `npm run equilibrage -- 200 1 --graines 3` réunit trois séries de graines différentes : un écart qui tient sur plusieurs graines n'est pas du bruit. Les tests et le rapport sont reproductibles : un problème signalé avec sa graine se rejoue à l'identique.

## Organisation

| Fichier | Contenu |
| --- | --- |
| `trajectoire.html` | La page : titre, polices, chargement des styles et des scripts dans l'ordre |
| `css/style.css` | La structure des écrans et des mini-jeux |
| `css/theme.css` | L'apparence : nuit bleu-violet, boutons violets, or pour la gloire, photos et animations (chargé après `style.css`) |
| `img/` | Photos des scènes et de l'accueil (Pexels, licence libre, sans club ni joueur réel) |
| `anim/` | Animations Lottie : trophée, confettis, étoile (LottieFiles, Lottie Simple License) ; lottie-web est chargé depuis cdnjs à la première animation |
| **`js/noyau/`** | |
| `donnees.js` | Postes, profils, pays et clubs fictifs, utilitaires, sauvegardes par emplacement |
| `demarrage.js` | Raccourcis clavier et lancement du jeu (toujours chargé en dernier) |
| **`js/contenu/`** | Ce qui raconte la carrière : à enrichir sans toucher aux écrans |
| `evenements.js` | Événements de carrière, talents, objectifs, relations du vestiaire |
| `chaines.js` | Histoires en plusieurs épisodes sur plusieurs saisons, variantes de texte des événements fréquents |
| `vie-perso.js` | Agents, couple et enfants, été, logement, placements, écran « Ma vie » et leurs événements |
| `foot-reel.js` | Histoires inspirées du football réel (clause libératoire, salaires impayés, ultras, remontada, gardien buteur…), avec leur catégorie, les rares et leurs pistes |
| `departs.js` | Points de départ (club de ta région, exil précoce, formé dans un géant, joueur tardif, fils de légende, vieux lion) et défis Exilé et Prodige, débloqués par le Panthéon (`lock`) |
| `histoires-ciblees.js` | Histoires selon le pays, le niveau du club, la sélection et la fin de carrière ; retours dans les anciens clubs ; légendes des carrières passées ; suites qui reviennent des années plus tard |
| `dilemmes.js` | Dilemmes de la carrière vivante : souvenirs qui citent un choix fait des saisons plus tôt, course au titre (jouer blessé, crise, maintien), style du coach, vrais choix où tout coûte |
| `defis.js` | Défis de départ (Parti de rien, Un club une vie, Corps de verre, Sans filet) |
| **`js/ecrans/`** | |
| `interface.js` | Création du joueur, rendu, fenêtres accessibles, sons, écussons, conseils, taille du texte |
| `saison.js` | Simulation de la saison, calendrier match par match, journal, distinctions, Ballon d'Étoile, saison rapide |
| `vivant.js` | La carrière vivante : classement qui avance à chaque moment de la saison et match clé à enjeu, qualités et axe de travail, entraîneurs à style, réputation construite par les choix (`p.persona`, `p.memo`), rêve de carrière et note finale, récap de saison en cartes |
| `competitions.js` | Classement complet, buteurs et passeurs du championnat, Coupe des Champions (qualification, tirage au sort animé, parcours) et cérémonie du Ballon d'Étoile |
| `mercato.js` | Intersaison : offres, négociation en direct (patience du directeur sportif), enchères, talents |
| `fin-de-carriere.js` | Après-carrière jouable (télé, dirigeant, académie, agent), bilan final, entraîneur, Héritage |
| `pantheon.js` | Panthéon, succès, défi du jour, records partagés, carte en image, stats |
| `carnet.js` | Carnet des histoires : mémoire des événements vécus d'une carrière à l'autre (`trajectoire_vus`), tirage qui favorise l'inédit, écran du carnet et carte « nouvelles histoires » du bilan |
| `monde.js` | Réputation dans chaque club (`clubRep`) et offre de retour aux sources, clubs qui montent et chutent (`p.world`), légendes du Panthéon qui reviennent, titre de carrière, unes de journal |
| `histoire.js` | Défi de la semaine (même classement que le défi du jour, `p.daily` porte la clé de la semaine) et mode Histoire en 5 chapitres |
| `installation.js` | Version web seulement (page avec manifeste) : enregistre le service worker et affiche « Installer l'appli » sur l'accueil |
| `sauvegardes.js` | Export et import de toutes les sauvegardes (code à copier ou fichier) |
| `telephone.js` | Le téléphone : messages avec réponses rapides (agent, famille, coach, pote, rival, messages privés), fil des réseaux sociaux (tendances, commentaires, bad buzz auquel répondre, rumeurs de mercato, abonnés et compte certifié, habitués qui te suivent toute la carrière, live avec les abonnés) et adieux de fin de carrière |
| `urgences.js` | Appels et messages urgents qui s'ouvrent seuls (offre de dernière minute, boulette, famille, brassard, sélection…) : `URGENTS` |
| `habillage.js` | Icônes SVG, icône de chaque choix devinée d'après son texte, illustrations de secours, silhouette de l'accueil, barre de navigation et menu, lecture des animations Lottie |
| `avatar.js` | Avatar du joueur (teint, coiffure, cheveux, barbe) en SVG, et son éditeur |
| `noms.js` | Éditeur de noms : clubs et championnats renommés dans le navigateur du joueur (chargé juste après `donnees.js`) |
| `entrainement.js` | Centre d'entraînement et statistiques des mini-jeux (envoyées au stockage partagé, collection `minis`) |
| `defi-amis.js` | Défi entre amis : un code AMI-XXXXXX pour rejouer le même départ |
| `hiver.js` | Mercato d'hiver jouable et rééducation après une blessure |
| `vestiaire.js` | Le vestiaire visible : coéquipiers, humeurs, pote, jaloux, capitaine |
| **`js/match/`** | |
| `match.js` | Match clé en direct : actions par poste, mi-temps, mini-terrain, célébrations, contres (une action défensive réussie peut relancer ton équipe) |
| `ordinaires.js` | Matchs de saison : une action jouée en cours de saison (championnat ou coupe), et la prolongation jouable des finales |
| `dialogues.js` | Actions supplémentaires par poste (tirées en priorité parmi les moins récemment vues, avec variantes de texte dans `ACT_ALT`), phrase de contexte selon le score, réactions du banc et des tribunes, dialogues entre deux actions (`MATCH_TALKS`) |
| `stade3d.js` | Le stade 3D des mini-jeux (Three.js chargé à la demande) et le footballeur animé de `img/3d/joueur.glb` ; repli en 2D sans connexion |
| `penalty.js` | Coups de pied arrêtés jouables : penalty (placé, en force, Panenka), plongeon, tirs au but, coup franc avec mur et effet |
| `conference.js` | Conférence de presse d'après-match, avec chrono |
| `duel.js` | Les gestes de chaque poste joués au bon moment : dribble, tacle, sortie aérienne, passe ; réglage des mini-jeux |
| `tournoi.js` | Championnat du Monde et Coupe Continentale joués l'été : groupes, quarts, demie, finale, tirs au but jouables |
| `ambiance.js` | Foule, chants, sifflets, battements de cœur, météo, voix du commentateur |
| **`tools/`** | |
| `serve.js` | Serveur de développement local |
| `build.js` | Version web installable (`dist/web`) et archive itch.io (`npm run build`) |
| `moteur.js` | Charge le jeu dans Node avec un faux DOM, pour les tests et l'équilibrage |
| `simulateur.js` | Bot qui joue des carrières complètes et relève les problèmes |
| `equilibrage.js` | Rapport d'équilibrage |
| `tests/` | Tests de bout en bout (`node --test`) |
| `types/globals.d.ts` | Ce que la page publiée ajoute au navigateur (`window.claude`), pour la vérification de types |

Les scripts sont des scripts classiques qui partagent le même espace global : l'ordre de chargement dans `trajectoire.html` compte, et le moteur de tests le lit au même endroit. Un nouveau fichier s'ajoute donc à un seul endroit.

## Ajouter du contenu

- **Un événement** : un objet de plus dans `EVENTS` (voir l'en-tête de `evenements.js` pour les effets possibles). Effets propres à la vie perso : `agent`, `couple`, `kid`, `clubStr`.
- **Catégorie, rareté, piste** : `scene:"vestiaire"` (une clé de `SCENES`) range l'événement dans le carnet ; `rare:true` le fait sortir peu souvent ; `hint:"…"` l'affiche comme piste dans le carnet tant qu'il n'a pas été vécu.
- **Un point de départ ou un défi verrouillé** : `lock:{d:"ce qu'il faut faire", t:hof=>vrai si débloqué}` dans `DEPARTS` ou `DEFIS`.
- **Un titre de carrière** : un objet de plus dans `TITLES` (`monde.js`) ; l'ordre de la liste donne la priorité du titre principal.
- **Une suite** : un événement `seedOnly:true`, déclenché par `seed:{ev, d:[min, max]}` dans les effets d'un choix (ou `addSeed(...)`).
- **Une variante de texte** : une ligne de plus dans `ALT` (`chaines.js`).
- **Un mini-jeu dans un événement** : `mini:"shoot" | "save" | "fk" | "fksave"` sur un choix risqué. Dans le match clé, les actions reçoivent `pen` ou `duel` (`dribble`, `tacle`, `aerien`, `passe`) dans `tagPen` (`penalty.js`).
- **Un message ou un post** : `msg(contact, texte, réponses)` et `post(type, auteur, texte, {replies})` dans `telephone.js` ; un post avec `replies` se répond depuis le fil.
- **Un appel urgent** : un objet de plus dans `URGENTS` (`urgences.js`), avec `when` (« saison » ou « ete »), une condition et des réponses (`fx`, `risk` ou `run`). Une réponse avec `next:{id, d:[min,max]}` programme une suite ; une suite porte `follow:true`.
- **Une variante de situation de match** : une ligne de plus dans `ACT_ALT` (`dialogues.js`), sous le texte d'origine de l'action.
- **Un dialogue de match** : un objet de plus dans `MATCH_TALKS` (`dialogues.js`), avec une condition sur le match et des réponses (`boost`, `calm`, `moral`, `rep`, `form` ou `risk`).
- Les emojis passent par `EMOJI_IC` (`habillage.js`) : un emoji sans icône disparaît à l'affichage, et un test le signale.
- Lancer `npm test` ensuite : le bot passe par le nouveau contenu au fil des carrières.

## Publier

`npm run build` construit la **version web installable** dans `dist/web` : une vraie page `index.html`, un manifeste d'application, les icônes (`img/app/`) et un service worker qui garde tout le jeu en cache pour jouer hors connexion. Il produit aussi `dist/trajectoire-itch.zip` pour itch.io. Hors de claude.ai, tout fonctionne sauf les classements et records partagés. Pour la tester : `npm start`, puis http://localhost:5182/dist/web/.

**GitHub Pages** : à chaque push sur `main`, le workflow `.github/workflows/pages.yml` lance la vérification de types et les tests, construit `dist/web` et la publie. À activer une fois dans le dépôt (public) : *Settings → Pages → Source : GitHub Actions*. Sur téléphone, l'accueil du jeu propose alors « Installer l'appli » (Android) ou explique l'ajout à l'écran d'accueil (iPhone, depuis Safari).

Les étapes de lancement sont dans `LANCEMENT.md`.


La page publiée est `trajectoire.html`, avec `css/`, `js/`, `img/` et `anim/` (et leurs sous-dossiers) envoyés comme fichiers d'accompagnement. Les crédits des photos et animations sont dans Options. `tools/`, `tests/`, `types/` et `node_modules/` ne sont pas publiés.
Le classement du défi du jour (`scores`), les records (`records`) et les statistiques des mini-jeux (`minis`) sont stockés dans la base partagée de l'artifact : chaque joueur n'écrit que son propre document, sans nom, et la page additionne les totaux. Les règles d'accès de `minis` sont les mêmes que celles de `scores` (lecture pour tous, écriture de son propre document).
