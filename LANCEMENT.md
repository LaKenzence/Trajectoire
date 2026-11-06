# Lancement de Trajectoire

Liste à suivre dans l'ordre, puis les textes prêts à copier.

## 1. Avant de montrer le jeu

- [ ] Ouvrir la page claude.ai du jeu (https://claude.ai/artifact/7Hpbg6m2A94JtGXD5aPxne), menu **Partager**, choisir l'accès **par lien**. Sans ça, personne ne peut l'ouvrir.
- [ ] Ouvrir ce lien dans une fenêtre privée pour vérifier ce que voient les autres.
- [ ] Jouer une carrière complète toi-même sur téléphone : c'est là que la plupart des gens joueront.
- [ ] Décider si ton nom de profil claude.ai peut apparaître dans les classements (sinon, change-le ou ne joue pas les défis classés avec ce compte).

## 2. Mettre le jeu en ligne, installable sur téléphone (GitHub Pages)

1. Sur GitHub, passer le dépôt **Trajectoire** en public : *Settings → General → Danger Zone → Change visibility*.
2. *Settings → Pages → Source* : choisir **GitHub Actions**.
3. Onglet **Actions** : relancer « Publier sur GitHub Pages » (ou faire un nouveau push). Après 2 à 3 minutes, le jeu est en ligne sur https://lakenzence.github.io/Trajectoire/.
4. Sur ton téléphone, ouvrir ce lien :
   - **Android (Chrome)** : sur l'accueil du jeu, toucher « Installer l'appli ».
   - **iPhone (Safari)** : bouton Partager, puis « Sur l'écran d'accueil ».
5. Ouvrir l'appli installée en mode avion pour vérifier qu'elle marche hors connexion.

C'est ce lien qu'il faut partager en priorité : il s'installe, marche hors connexion, et n'a pas besoin de compte claude.ai. Les classements partagés restent sur le lien claude.ai.

## 2 bis. Mettre le jeu sur itch.io

1. Construire le paquet : `npm run build`. Le fichier à envoyer est `dist/trajectoire-itch.zip` (le dossier `dist/web` sert à le tester : `npm start`, puis http://localhost:5182/dist/web/).
2. Créer un compte sur https://itch.io, puis **Upload new project**.
3. Réglages de la page :
   - **Kind of project** : HTML.
   - **Uploads** : envoyer le .zip, cocher **This file will be played in the browser**.
   - **Embed options** : taille 480 × 800 (le jeu est pensé en colonne), cocher **Mobile friendly** (orientation portrait), **Fullscreen button** et **Automatically start on page load**.
   - **Genre** : Simulation. **Tags** : `football`, `soccer`, `career`, `sports`, `text-based`, `choices-matter`, `singleplayer`, `french`.
   - **Pricing** : No payments (ou « paie ce que tu veux », minimum 0).
   - **Visibility** : d'abord **Draft** pour vérifier, puis **Public**.
4. Ajouter 3 à 5 captures d'écran (voir plus bas) et une image de couverture 630 × 500.
5. Sur itch.io, les classements et records partagés ne fonctionnent pas (ils dépendent de claude.ai) : tout le reste marche, sauvegardes comprises. Le dire dans la description, avec le lien claude.ai pour ceux qui veulent les classements.

**Captures à faire** (sur téléphone ou fenêtre étroite) :
- une une de journal après un grand moment ;
- le bilan de fin de carrière avec le titre de carrière ;
- un penalty ou un coup franc en cours ;
- le téléphone (messages, réseaux sociaux) ;
- la création du joueur avec les points de départ.

## 3. Premiers testeurs (avant le grand public)

- [ ] Envoyer le lien à 5 à 10 proches, avec une seule question : « Qu'est-ce qui t'a donné envie d'arrêter ? »
- [ ] Noter où ils décrochent, ce qu'ils n'ont pas compris, et s'ils relancent une deuxième carrière d'eux-mêmes.
- [ ] Corriger les gros problèmes, republier, puis passer à l'étape 4.

## 4. Communiquer

Un canal à la fois, en lisant les règles de chaque communauté avant de poster (certaines n'acceptent l'autopromo qu'un jour précis ou dans un fil dédié).

| Où | Quand | Note |
| --- | --- | --- |
| r/WebGames, r/playmygame | Dès que la page itch.io est prête | Public habitué à tester, retours rapides |
| r/IndieGaming | Avec une capture ou une courte vidéo | Mettre l'image en avant, pas le texte |
| r/incremental_games, r/FootballManagerGames | Après les premiers retours | Public de jeux de gestion et de carrière |
| r/france (fil d'autopromo), r/Football_France | Selon leurs règles d'autopromo | Version française du message |
| TikTok, Shorts, Reels | Une vidéo par semaine | 15 à 30 s sur un seul moment fort |
| Discord (Football Manager, jeux indés, devs francophones) | Dans les salons « showcase » | Jamais en message privé non sollicité |

## 5. Textes prêts à copier

### Description itch.io

> **Trajectoire** — vis la carrière d'un footballeur, de ses 16 ans à sa retraite.
>
> Chaque saison, des choix : prolonger ou partir libre, accepter la clause d'un géant, calmer les ultras, gérer ton agent, ta famille et tes réseaux. Les matchs clés se jouent en direct : penalties, coups francs, dribbles et tacles au bon moment.
>
> - 6 points de départ et 6 défis (Exilé, Prodige, Corps de verre…)
> - Plus de 200 histoires, dont des rares, et des choix qui reviennent des années plus tard
> - Un monde qui bouge : clubs rachetés, clubs qui s'effondrent, anciens clubs qui se souviennent de toi
> - Un titre de carrière à la fin, et un carnet des histoires à compléter
> - Mode Histoire en 5 chapitres, défi de la semaine
>
> Jouable sur téléphone et ordinateur, en français. Les classements partagés sont sur la version claude.ai : https://claude.ai/artifact/7Hpbg6m2A94JtGXD5aPxne

### Reddit (anglais : r/WebGames, r/playmygame, r/IndieGaming)

> **Title :** I made a football career game you play in the browser, from age 16 to retirement (French)
>
> It's a choice-driven career sim: contracts, release clauses, ultras, agents, family, social media, and the key matches are played live (penalties, free kicks, dribbles). Every career ends with a title like "The Loyal One" or "The Eternal Runner-up", and a journal of stories you unlocked.
>
> The game is in French for now. I'd love feedback on where you got bored or confused.
>
> [lien itch.io]

### Reddit (français : r/france, r/Football_France)

> **Titre :** J'ai créé un jeu de carrière de footballeur jouable dans le navigateur, de 16 ans à la retraite
>
> Tu fais des choix chaque saison (prolonger, partir libre, accepter un géant qui paie ta clause, gérer les ultras, ton agent, ta famille…) et tu joues les matchs clés en direct : penalties, coups francs, dribbles. À la fin, ta carrière reçoit un titre (« Le Fidèle », « L'Éternel second »…).
>
> C'est gratuit, sans pub, jouable sur téléphone. Je cherche surtout des retours : à quel moment vous avez décroché ?
>
> [lien]

### Discord

> Salut ! J'ai fait un jeu de carrière de footballeur dans le navigateur (gratuit, sur téléphone aussi) : choix, mercato, penalties en direct, et un titre de carrière à la fin. Si ça vous tente, je suis preneur de retours : [lien]

### Idées de vidéos courtes

- « Mon gardien a marqué à la 94e » : la scène de l'histoire rare, puis la une de journal.
- « J'ai refusé un géant deux fois » : la clause libératoire puis sa suite des années plus tard.
- « Quel titre pour ma carrière ? » : défiler le bilan jusqu'au titre de carrière.
- Le défi de la semaine : « Gardien champion avant 22 ans, qui fait mieux ? »

## 6. Ce qu'il faut regarder ensuite

- Les commentaires itch.io et Reddit : noter les remarques qui reviennent plusieurs fois.
- Le nombre de parties sur la page itch.io (onglet **Analytics**) : vues, parties lancées, durée.
- Revenir corriger les points les plus cités, puis republier : un push sur GitHub met à jour la version installable, `npm run build` refait l'archive itch.io, et la page claude.ai se republie comme d'habitude.
