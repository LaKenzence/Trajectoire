# Animations Mixamo à ajouter

Le joueur 3D (`img/3d/joueur.glb`) contient aujourd'hui 26 mouvements. Les célébrations et les déceptions sont faites
« à la main » (les bras sont orientés par le code), ce qui reste raide. Ces quatre animations de Mixamo les
remplaceraient automatiquement : le jeu les utilise dès qu'elles sont dans le fichier, sinon il garde la version actuelle.

## À télécharger (gratuit, compte Adobe nécessaire)

Sur [mixamo.com](https://www.mixamo.com), avec le **même personnage** que les autres animations :

| Nom court dans le jeu | Chercher sur Mixamo | Sert à | Réglages |
| --- | --- | --- | --- |
| `joie` | « Cheering » | célébration de base (bras au ciel) | In Place coché |
| `joie_poing` | « Fist Pump » | célébration « le poing rageur » | In Place coché |
| `joie_genou` | « Kneeling Victory » (ou « Victory ») | célébration « un genou à terre » | In Place coché |
| `deception` | « Defeated » (ou « Disappointed ») | penalty raté, tacle manqué | In Place coché |

Format de téléchargement : **FBX Binary, Without Skin, 30 images/s**.

## Les intégrer

1. Mettre les fichiers `.fbx` dans le même dossier que les autres animations Mixamo, avec ces noms exacts :
   `cheering.fbx`, `fist pump.fbx`, `kneeling victory.fbx`, `defeated.fbx` (renommer si Mixamo propose un autre nom).
2. Lancer la configuration « mixamo » (`node tools/mixamo.js`, port 5183), ouvrir la page et cliquer sur « Convertir ».
   La liste `CLIPS` de `tools/mixamo.html` connaît déjà ces quatre noms ; un fichier absent est simplement ignoré.
3. Remplacer `img/3d/joueur.glb` par le fichier produit.

Rien d'autre à changer : `js/match/stade3d.js` utilise `joie`, `joie_poing`, `joie_genou` et `deception` s'ils existent.
