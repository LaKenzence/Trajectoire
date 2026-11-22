# Prompts d'images pour le centre de formation

Images à générer avec ChatGPT (ou un autre générateur gratuit), pour remplacer les photos génériques des scènes du
centre de formation. Les scènes les plus fortes du jeu (l'essai sous la pluie, le bureau de Vasseur, la chambre
d'internat) utilisent aujourd'hui une photo de grand stade ou de conférence de presse, ce qui contredit le texte.

## Comment faire

1. Colle d'abord le **bloc de style** ci-dessous, puis le prompt de l'image (ou les deux ensemble).
2. Demande le format **paysage 3:2** (1536 × 1024).
3. Enregistre chaque image dans `img/nouvelles/` avec **exactement** le nom indiqué (PNG ou JPG, peu importe).
4. Dis-le-moi : je les convertis en WebP, je les allège et je les branche dans les bonnes scènes.

Si une image ne te plaît pas, régénère-la. Le plus important : **aucun visage net, aucun logo, aucun texte**.

## Bloc de style (à coller avant chaque prompt)

> Photo réaliste au rendu cinématographique, format paysage 3:2. Ambiance de film sur le football, lumière douce et
> dramatique, dominante de couleurs violet profond et bleu nuit avec des touches de lumière dorée chaude. Grain léger,
> faible profondeur de champ. Le sujet principal est au centre de l'image, dans une bande horizontale (le haut et le
> bas seront recadrés). Aucun texte, aucune lettre, aucun logo, aucune marque, aucun écusson de club, aucun joueur ou
> personne réelle. Les personnes sont de dos, de loin, floues ou en silhouette : pas de visage net. Maillots violets
> unis, sans sponsor ni numéro.

## Les images

### 1. `essai-pluie` : le jour de l'essai (16 ans)

> Un terrain synthétique municipal un dimanche de pluie, en fin d'après-midi grise. Une petite tribune en béton de
> quatre rangées, presque vide, avec quelques parents sous des parapluies. Au premier rang, un homme en imperméable
> sombre, de dos ou de trois quarts flou, un carnet à la main. Sur le terrain, des adolescents en maillots violets
> détrempés, de loin. Flaques sur la pelouse synthétique, pluie visible dans la lumière d'un projecteur. Ambiance
> modeste et mélancolique, pas un grand stade.

### 2. `centre-exterieur` : le centre de formation

> Un bâtiment gris et modeste de centre de formation de football, au bout d'un grand parking presque vide. Derrière,
> trois terrains d'entraînement en herbe, et au loin la mer grise sous un ciel nuageux. Petit matin, lampadaires encore
> allumés, reflets sur le bitume mouillé. Aucun panneau lisible.

### 3. `internat-nuit` : la première nuit à l'internat

> Une petite chambre d'internat sportif, la nuit. Un lit simple défait, un sac de sport ouvert par terre avec des
> crampons, un maillot violet posé sur une chaise. Un mur fin et blanc. Seule lumière : un lampadaire à travers la
> fenêtre et un téléphone allumé sur le lit. Ambiance de solitude et de nostalgie.

### 4. `bureau-vasseur` : le bureau du directeur du centre

> Le bureau d'un directeur de centre de formation, en fin de journée. Un vieux bureau en bois, un carnet à spirale
> ouvert avec un stylo, une tasse de café froid, des piles de dossiers. Par la fenêtre, des terrains d'entraînement
> sous un ciel gris et la mer au loin. Lumière d'une lampe de bureau dorée. Personne dans la pièce.

### 5. `parking-agent` : l'agent sur le parking

> Le parking d'un petit stade le soir, après un match de jeunes. Une voiture noire luxueuse garée sous un lampadaire.
> Appuyé contre la voiture, un homme en costume bleu électrique trop brillant, vu de loin et de dos ou de profil flou.
> Bitume mouillé, reflets du lampadaire, ambiance un peu louche.

### 6. `caisse-soir` : la grand-mère au téléphone

> Une caisse de supermarché de quartier, tard le soir, sous les néons. Un tapis de caisse vide, un tiroir-caisse, un
> téléphone portable posé à côté. Une silhouette de femme âgée floue au second plan, en blouse de travail, de dos.
> Ambiance fatiguée et tendre.

### 7. `match-jeunes` : le premier match U17

> Un match de football de jeunes de 16 ans sur un terrain modeste en fin de journée. Une main courante blanche, une
> vingtaine de parents debout le long du terrain, un banc de touche en plexiglas. Des joueurs en maillots violets et
> d'autres en blanc, de loin, en pleine action. Lumière rasante dorée, ciel violet. Pas de grand stade, pas de foule.

### 8. `hopital-nuit` : la veille du match du contrat

> Un couloir d'hôpital la nuit, lumière froide des néons. Une chaise en plastique à côté de la porte entrouverte d'une
> chambre, un sac de sport violet posé dessus. Au fond, une fenêtre sur la ville la nuit. Personne de visible.
> Ambiance d'attente et d'inquiétude.

### 9. `gare-pluie` : le proche vient voir son premier match pro

> Un quai de gare de province sous la pluie, le soir. Une silhouette âgée de dos, avec un vieux parapluie, attend
> près d'un train régional à l'arrêt. Lumière jaune des lampadaires du quai, reflets sur le sol mouillé.
> Ambiance émouvante et simple.

### 10. `vestiaire-pros` : le premier jour chez les pros

> Le couloir d'un vestiaire professionnel moderne, une grande porte entrouverte au bout, avec une lumière vive qui
> passe par l'entrebâillement. Au premier plan, un homme âgé en imperméable, de dos, qui s'est arrêté avant la
> porte. Sol brillant, murs sombres, éclairage violet et doré.

## Bonus si tu as le temps

- `carnet` : gros plan sur un vieux carnet à spirale ouvert, une écriture penchée illisible, un stylo, sur un bureau
  en bois, lumière dorée. (Pour le film de fin du centre.)
- `ballon-degonfle` : gros plan sur un vieux ballon de foot dégonflé avec un gribouillis de feutre illisible, posé sur
  une étagère de chambre d'enfant. (Pour Nino.)

---

# Portraits des personnages

Ils remplacent les petits avatars dessinés dans les dialogues (le joueur, lui, garde son avatar personnalisable).
Ces personnages sont fixes d'une partie à l'autre : un portrait chacun suffit.

## Comment faire

- Format **carré** (1024 × 1024). Enregistre dans `img/perso/` avec le nom indiqué.
- Cette fois, le **visage doit être net** : ce sont des personnages inventés. Garde la même ambiance pour tous.
- Colle d'abord le bloc de style des portraits, puis la description.

## Bloc de style des portraits

> Portrait photo réaliste au rendu cinématographique, format carré, cadré en buste, visage net et expressif, regard
> légèrement de côté. Fond sombre et flou dans des tons violet profond et bleu nuit, lumière douce et dorée venant d'un
> côté. Personne entièrement fictive, qui ne ressemble à aucune personne réelle ni célébrité. Aucun texte, aucun
> logo, aucune marque, aucun écusson.

## Les portraits

- `vasseur` : un homme d'une soixantaine d'années, directeur de centre de formation de football. Cheveux gris
  coupés court, barbe grise courte, visage sévère mais bienveillant, rides marquées. Imperméable sombre au col relevé,
  mouillé par la pluie. Il tient un vieux carnet à spirale contre lui.
- `kessler` : un agent de joueurs d'environ 45 ans, sourire commercial un peu trop large, cheveux gominés en arrière.
  Costume bleu électrique trop brillant, chemise blanche, cravate dorée. Il a l'air de vouloir te vendre quelque chose.
- `sacha` : un garçon de 17 ans, joueur de centre de formation. Survêtement d'entraînement violet uni, cheveux en
  bataille, regard intense qui jauge, mâchoire serrée. Un peu fatigué, très déterminé.
- `nino` : un petit garçon de 9 ans, maillot de foot violet trop grand pour lui, grand sourire édenté, yeux qui
  brillent. Il serre contre lui un vieux ballon dégonflé couvert d'un gribouillis de feutre illisible.
- `ferri` : le capitaine d'une équipe professionnelle, environ 32 ans, barbe soignée, regard calme de leader. Veste
  d'échauffement violette unie.
- `proche-gm` : une grand-mère d'environ 70 ans, cheveux gris courts, petites lunettes, gilet en laine sur un
  chemisier, regard tendre et un peu fatigué. Gouttes de pluie sur les épaules, un vieux parapluie fermé à la main.
- `proche-mere` : une mère d'environ 45 ans, cheveux attachés à la va-vite, gilet sur un t-shirt, regard fier et
  inquiet à la fois.
- `proche-pere` : un père d'environ 48 ans, barbe de quelques jours, veste de travail imperméable, mains abîmées,
  sourire pudique.
- `proche-frere` : un grand frère d'environ 24 ans, sweat à capuche sombre, barbe courte, sourire protecteur.
- `proche-soeur` : une grande sœur d'environ 25 ans, cheveux longs bouclés, sweat à capuche, regard malicieux et
  protecteur.

# Photos de une du journal

Elles illustrent la une plein écran du Quotidien du Ballon. Le titre et le texte restent écrits par le jeu (les
générateurs d'images massacrent le texte), donc les photos ne doivent contenir **aucun texte**.

Format **paysage 3:2**, dans `img/nouvelles/`. Utilise le **bloc de style** du début (personnes de dos ou floues).

- `une-signature` : les mains d'un jeune joueur de 18 ans qui signent un contrat posé sur le capot d'une voiture,
  sur un parking de club, au crépuscule. Un stylo, une feuille, des gouttes de pluie sur la carrosserie.
- `une-trophee` : un joueur de dos, maillot violet, qui soulève un trophée argenté au-dessus de sa tête, sous une pluie
  de confettis dorés, dans un stade illuminé.
- `une-ballon` : un ballon de football doré posé sur un piédestal noir, sur une scène de cérémonie, projecteurs et
  fumée légère, salle sombre et élégante. Personne au premier plan.
- `une-transfert` : la présentation d'un nouveau joueur : une silhouette de dos qui tient un maillot violet déplié face
  à une tribune, flashs de photographes, pelouse au premier plan.
- `une-coupe-champions` : un capitaine de dos qui brandit une grande coupe à grandes anses, entouré de coéquipiers en
  maillots violets, feux d'artifice au-dessus du stade.
- `une-pays` : une foule immense en liesse dans une avenue la nuit, fumigènes violets, bras levés, vue de dos.
  Aucun drapeau de pays réel.
