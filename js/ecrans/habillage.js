// Trajectoire · Habillage graphique : icônes, illustrations des scènes, silhouette de l'accueil,
// barre de navigation du bas et menu. Tout est dessiné en SVG, sans image externe.

/* ============ Icônes ============ */
// tracés au trait (24 × 24), dans le même esprit partout ; ic(nom) renvoie l'icône prête à poser
const ICONS = {
  eye:"M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  snow:"M12 2v20M4.9 7l14.2 10M4.9 17 19.1 7M9 4l3 2 3-2M9 20l3-2 3 2",
  moon:"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  tree:"M12 22v-6M12 2 5 12h4l-3 4h12l-3-4h4z",
  down:"M12 3v12M7 10l5 5 5-5M4 20h16",
  cloud:"M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z",
  home:"M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  dice:"M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01",
  trophy:"M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
  phone:"M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
  menu:"M4 6h16M4 12h16M4 18h16",
  users:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  vol:"M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14",
  volx:"M11 5 6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6",
  mic:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3",
  star:"M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z",
  calendar:"M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M3 10h18",
  dumbbell:"M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12",
  gear:"M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1",
  save:"M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM7 3v5h9M7 21v-7h10v7",
  edit:"M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  play:"M7 4l13 8-13 8z",
  ball:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7l4.3 3.1-1.6 5h-5.4l-1.6-5zM12 7V2.5M16.3 10.1l4.4-1.4M14.7 15.1l2.7 3.8M9.3 15.1l-2.7 3.8M7.7 10.1 3.3 8.7",
  shield:"M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z",
  megaphone:"M3 11v2a2 2 0 0 0 2 2h1l5 4V5L6 9H5a2 2 0 0 0-2 2zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12",
  lock:"M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  chat:"M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12zM8 12h.01M12 12h.01M16 12h.01",
  warning:"M12 3 2 21h20zM12 10v5M12 18h.01",
  coins:"M9 4c3.3 0 6 1.3 6 3s-2.7 3-6 3-6-1.3-6-3 2.7-3 6-3zM3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7M15 12c3.3 0 6 1.3 6 3v3c0 1.7-2.7 3-6 3s-6-1.3-6-3",
  heart:"M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z",
  plane:"M10.2 13.8 3 11l1.5-1.5 7.6 1.1 4.6-4.6a2 2 0 0 1 2.8 2.8L14.9 13.4 16 21l-1.5 1.5-2.8-7.2-3.4 3.4.4 2.8-1.4 1.4-1.5-3.6L2.2 17.8l1.4-1.4 2.8.4z",
  crown:"M3 18h18M4 16 3 7l5 4 4-7 4 7 5-4-1 9z",
  fire:"M12 22c4 0 7-3 7-7 0-5-4-7-5-11-2 3-1 5-3 6-1-1-1-2-2-3-2 3-3 5-3 8 0 4 3 7 6 7z",
  angry:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 16.5c1.2-1.3 2.6-2 4-2s2.8.7 4 2M7.5 8.5l3 1.5M16.5 8.5l-3 1.5",
  check:"M20 6 9 17l-5-5",
  x:"M18 6 6 18M6 6l12 12",
  plus:"M12 5v14M5 12h14",
  cross:"M9 3h6v6h6v6h-6v6H9v-6H3V9h6z",
  clock:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  target:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  bolt:"M13 2 3 14h9l-1 8 10-12h-9z",
  idcard:"M3 5h18v14H3zM8 10a2 2 0 1 0 0 .01M6 16c.5-1.5 1.5-2 2-2s1.5.5 2 2M13 10h5M13 14h4",
  back:"M15 18l-6-6 6-6",
  chev:"M9 6l6 6-6 6",
  handshake:"M2 11 7 6l4 2 3-2 3 1 5 4M7 6v7l4 4 1-1M11 17l2 2 1-1M14 18l2 1 1-1M17 18l1 0 2-3-5-4",
  run:"M14 5a2 2 0 1 0 0-.01M6 21l3-5 3 2v4M9 16l1.5-6 4 3 3 1M7 10l3-1.5"
};
function ic(name,cls){ return `<svg class="ic ${cls||""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONS[name]||ICONS.chat}"/></svg>`; }

// une icône pour chaque choix, devinée à partir de ce qu'il dit
/** @type {[RegExp,string][]} */
const CHOICE_ICONS = [
  [/langue de bois|neutre|diplomat|prudent|sobre|poli/i,"shield"],
  [/franchement|dire ce que|tu penses|parler|expliquer|annoncer|déclar|confirm|démentir/i,"megaphone"],
  [/éloge|soutenir|remercier|féliciter|rassurer|encourag|aider|hommage/i,"heart"],
  [/coach|staff|vestiaire|coéquipier|capitaine|équipe/i,"users"],
  [/rester|fidèle|prolong|ici/i,"home"],
  [/excuse|pardon|désolé|assumer|reconna/i,"megaphone"],
  [/discret|silence|ne rien|rien dire|te taire|garder pour|calme|ignorer|laisser couler|sans répondre/i,"lock"],
  [/répondre|critique|clash|pique|provoc|regarde le tableau|démolir|sèchement|vivement|protester|engueul/i,"angry"],
  [/argent|payer|salaire|augmentation|négoci|sponsor|contrat|placement|prix|€|signer avec|fonce/i,"coins"],
  [/famille|parent|mère|père|enfant|fils|fille|frère|maison|rentrer|cœur|amour|couple|mari/i,"heart"],
  [/entraîn|séance|travail|bosser|effort|humble|progresser|apprendre|conseils/i,"dumbbell"],
  [/ambiti|viser|titulaire|exiger|brassard|capitaine|place|légende|meilleur/i,"trophy"],
  [/partir|transfert|quitter|prêt|étranger|valise|avion|signe à|départ/i,"plane"],
  [/presse|interview|journal|média|publier|post|vidéo|réseaux|live|selfie|story/i,"chat"],
  [/repos|soign|kiné|médec|opération|blessure|genou|guérir|rééducation/i,"cross"],
  [/frapp|tir|dribbl|lob|reprise|tête|volée|centre|penalty|coup franc|but/i,"ball"],
  [/tacle|défend|bloquer|couvrir|serrer|mur|sauver|dégager|plonger|arrêt/i,"shield"],
  [/fête|soirée|boîte|sortir|vacances|plage/i,"fire"],
  [/temps|attendre|patien|plus tard|réfléchi|on verra/i,"clock"],
  [/accepter|oui|promis|bien sûr|j'arrive|d'accord|merci/i,"check"],
  [/refuser|non|jamais|décliner|pas maintenant/i,"x"],
  [/études|cours|programme|inscri|livre|dévorer|table de nuit/i,"edit"],
  [/psycholog|préparateur|spécialiste|infiltration|traitement|ménager|corps|yoga|sommeil|nutrition/i,"cross"],
  [/avocat|contester|régularis|accuser|nier|avouer|veto|signaler|recours/i,"shield"],
  [/chaîne|comptes|en ligne|téléphone|filmer|écouteurs|du son/i,"phone"],
  [/colère|confronter|provoquer|virer|couper les ponts|grève|exploser de colère|patron|moquer/i,"angry"],
  [/confiance|sous ton aile|tendre la main|paix|soutien|visite|offrir|dédier|sauter dans|honneur|saluer|respect|collecte|naissance|relation|ensemble|séparer|chien|demande sur la pelouse/i,"heart"],
  [/discours|dire|demander|discussion|discuter|écouter|conseil|exprimer|message|réunir|consignes|en parler/i,"chat"],
  [/signer|intéressé|arrivée|propose|embaucher|agent/i,"handshake"],
  [/tatouage|déménager|danser|chanter|plaisir|profiter|décontracté|exception/i,"star"],
  [/seul|propre route|tracer|reprendre la main|choisir ton propre/i,"run"],
  [/lever le pied|à moitié|coup de vent|progressivement|simple|libéré|comme si de rien/i,"clock"],
  [/fin à ta carrière|finir ta carrière|héritage/i,"trophy"],
  [/foot|match|jouer|terrain|maillot|ballon|crampon|célébr|gestes|pelouse|virage|numéro|spécialiste/i,"ball"]
];
function choiceIcon(t){ const hit = CHOICE_ICONS.find(([re])=>re.test(t)); return hit?hit[1]:"bolt"; }
// la pastille d'icône d'un choix, avec son numéro de raccourci clavier
function choiceLead(t,n){ return `<span class="cic t${n%3}">${ic(choiceIcon(t))}<kbd>${n+1}</kbd></span>`; }

/* ============ Illustrations des scènes ============ */
// une petite scène dessinée par catégorie d'événement (400 × 170), en aplats et lumières
const SKY = (a,b)=>`<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="gl"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient></defs><rect width="400" height="170" fill="url(#sk)"/>`;
const artShirt = (x,y,s,c,n)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-16-20l9-5h14l9 5 9 10-7 7-5-4v30h-26v-30l-5 4-7-7z" fill="${c}"/><text y="10" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="Barlow Condensed,sans-serif">${n}</text></g>`;
const person = (x,y,s,c)=>`<g transform="translate(${x} ${y}) scale(${s})"><circle cy="-34" r="11" fill="${c}"/><path d="M-22 10c0-20 9-30 22-30s22 10 22 30z" fill="${c}"/></g>`;
// photos des scènes : img/<catégorie>.webp (Pexels, licence libre ; terrain, vestiaire, sélection et rivalité générées par IA)
// pictogramme de chaque catégorie de scène
const SCENE_IC = {terrain:"ball",vestiaire:"users",medias:"mic",perso:"home",argent:"coins",sante:"cross",selection:"star",rival:"bolt",echo:"clock"};
const SCENE_PHOTOS = ["terrain","vestiaire","medias","perso","argent","sante","selection","rival","echo"];
function sceneArt(cat){
  if(SCENE_PHOTOS.includes(cat)) return `<img class="scene-photo" src="img/${cat}.webp" alt="" decoding="async" onerror="this.outerHTML=sceneSvg('${cat}')">`;
  return sceneSvg(cat);
}
function sceneSvg(cat){
  const club = p?clubColors(p.club):{a:"#6c4dff",b:"#fff"};
  const art = {
    terrain:()=>`${SKY("#0c1240","#1b2a6b")}
      <circle cx="40" cy="22" r="60" fill="url(#gl)" opacity=".55"/><circle cx="360" cy="22" r="60" fill="url(#gl)" opacity=".55"/>
      <g fill="#e9ecff"><rect x="30" y="14" width="22" height="9" rx="2"/><rect x="348" y="14" width="22" height="9" rx="2"/></g>
      <path d="M0 86 Q200 54 400 86 V112 H0z" fill="#141a4a"/><path d="M0 92 Q200 62 400 92" stroke="#2a3478" stroke-width="5" fill="none" stroke-dasharray="2 6"/>
      <path d="M-40 170 L60 108 H340 L440 170z" fill="#23864f"/><path d="M60 108 H340 L440 170 H-40z" fill="url(#sk)" opacity=".15"/>
      <g stroke="#ffffff" stroke-opacity=".6" stroke-width="2" fill="none"><path d="M60 108 H340 L440 170 H-40z"/><path d="M200 108 V170"/><ellipse cx="200" cy="136" rx="46" ry="12"/></g>
      <circle cx="252" cy="146" r="7" fill="#fff"/><path d="M247 143h10M249 149h6" stroke="#222" stroke-width="1.4"/>`,
    vestiaire:()=>`${SKY("#16204f","#0d1336")}
      ${[0,1,2,3,4].map(i=>`<rect x="${28+i*72}" y="12" width="64" height="118" rx="4" fill="#1f2a63" stroke="#2c3a80"/><rect x="${32+i*72}" y="18" width="56" height="8" rx="2" fill="#2c3a80"/>${artShirt(60+i*72,72,1.15,i===2?club.a:["#3a4ea8","#e6e9ff","#3a4ea8","#e6e9ff","#3a4ea8"][i],[7,18,10,4,9][i])}`).join("")}
      <rect x="0" y="134" width="400" height="36" fill="#0a0f2b"/><rect x="20" y="138" width="360" height="10" rx="3" fill="#8a5a33"/><circle cx="200" cy="40" r="70" fill="url(#gl)" opacity=".25"/>`,
    medias:()=>`${SKY("#1b0f3d","#0b0b26")}
      ${[[60,40,40],[330,30,46],[190,20,30],[110,110,26],[300,120,30]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gl)" opacity=".7"/>`).join("")}
      ${[[150,-12],[200,0],[250,12]].map(([x,a])=>`<g transform="translate(${x} 170) rotate(${a})"><rect x="-4" y="-80" width="8" height="80" fill="#2a2f55"/><rect x="-14" y="-118" width="28" height="44" rx="12" fill="#3b4277"/><rect x="-16" y="-92" width="32" height="12" rx="3" fill="${x===200?club.a:"#6c4dff"}"/></g>`).join("")}`,
    perso:()=>`${SKY("#0b1036","#28265e")}
      <circle cx="330" cy="38" r="20" fill="#fff4cf"/><circle cx="338" cy="32" r="18" fill="#0b1036" opacity=".9"/>
      ${[[0,70,50],[52,50,40],[96,82,46],[146,40,38],[188,64,52],[244,52,42],[290,78,48],[342,58,58]].map(([x,y,w])=>`<rect x="${x}" y="${y}" width="${w}" height="${170-y}" fill="#141a45"/>${Array.from({length:6},(_,k)=>`<rect x="${x+6+(k%2)*(w/2-4)}" y="${y+10+Math.floor(k/2)*18}" width="8" height="8" fill="${(x+k)%3?"#ffd36b":"#2a3170"}"/>`).join("")}`).join("")}`,
    argent:()=>`${SKY("#0f2a2a","#0b1530")}
      <path d="M30 140 L110 110 L170 120 L250 70 L320 80 L370 30" stroke="#47d488" stroke-width="5" fill="none"/><path d="M370 30l-18 2 10 14z" fill="#47d488"/>
      ${[[90,150],[130,150],[110,132],[260,152],[300,152],[280,134],[280,116]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="22" ry="8" fill="#f6c445" stroke="#b8860b" stroke-width="2"/>`).join("")}`,
    sante:()=>`${SKY("#0c2f3a","#0b1638")}
      <circle cx="200" cy="80" r="52" fill="#ffffff" opacity=".1"/><path d="M188 48h24v20h20v24h-20v20h-24v-20h-20v-24h20z" fill="#fff"/>
      <path d="M0 140h120l14-24 16 44 18-58 14 38h218" stroke="#5ae0c0" stroke-width="4" fill="none"/>`,
    selection:()=>`${SKY("#0e1450","#1e2a78")}
      <circle cx="200" cy="10" r="90" fill="url(#gl)" opacity=".35"/>
      <path d="M150 30 v130" stroke="#d9dcf5" stroke-width="5"/><path d="M152 34 C200 20 230 52 280 36 V96 C230 112 200 80 152 94z" fill="#f6c445"/>
      <path d="M215 52l5 10 11 1-8 7 2 11-10-6-10 6 2-11-8-7 11-1z" fill="#fff"/>
      <path d="M0 150 Q200 120 400 150 V170 H0z" fill="#141a4a"/>`,
    rival:()=>`<defs><linearGradient id="rv" x1="0" x2="1"><stop offset="0" stop-color="#4b2bd6"/><stop offset=".5" stop-color="#1a1240"/><stop offset="1" stop-color="#c2263f"/></linearGradient></defs><rect width="400" height="170" fill="url(#rv)"/>
      ${person(110,170,2.2,"#0b0a24")}${person(290,170,2.2,"#0b0a24")}
      <text x="200" y="104" text-anchor="middle" font-size="64" font-weight="900" font-style="italic" fill="#f6c445" font-family="Barlow Condensed,sans-serif">VS</text>`,
    echo:()=>`${SKY("#2a1458","#0e0b2e")}
      ${Array.from({length:16},(_,i)=>`<circle cx="${(i*67)%400}" cy="${(i*41)%150+10}" r="${1+i%3}" fill="#e6d8ff" opacity=".7"/>`).join("")}
      <path d="M170 24h60M170 146h60M178 24c0 40 44 40 44 61s-44 21-44 61M222 24c0 40-44 40-44 61s44 21 44 61" stroke="#e6d8ff" stroke-width="5" fill="none"/>
      <path d="M186 50h28l-14 22zM180 140c6-14 34-14 40 0z" fill="#f6c445"/>`
  }[cat]||(()=>SKY("#0c1240","#1b2a6b"));
  return `<svg class="scene-svg" viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${art()}</svg>`;
}

/* ============ Accueil : le n°10 de dos, face au stade ============ */
function heroArt(nm){
  const name = (nm||p?.name||"").split(" ").pop()||"TOI";
  return `<svg class="hero-svg" viewBox="0 0 400 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0e33"/><stop offset=".55" stop-color="#1b2470"/><stop offset="1" stop-color="#0d1240"/></linearGradient>
      <radialGradient id="hlight"><stop offset="0" stop-color="#fff7e0"/><stop offset=".3" stop-color="#cfd7ff" stop-opacity=".55"/><stop offset="1" stop-color="#cfd7ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="hjersey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14123a"/><stop offset="1" stop-color="#06071a"/></linearGradient>
      <filter id="hglow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <linearGradient id="hfade" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#0a0c24" stop-opacity="0"/><stop offset="1" stop-color="#0a0c24"/></linearGradient>
    </defs>
    <g transform="translate(200 352) scale(1.22)">
      <path d="M-104 120c4-66 30-102 72-114h64c42 12 68 48 72 114z" fill="url(#hjersey)" stroke="rgba(190,175,255,.55)" stroke-width="1.5"/>
      <rect x="-14" y="-36" width="28" height="32" rx="10" fill="#07081c"/>
      <ellipse cx="-29" cy="-62" rx="5" ry="9" fill="#07081c"/><ellipse cx="29" cy="-62" rx="5" ry="9" fill="#07081c"/>
      <ellipse cy="-64" rx="28" ry="32" fill="#07081c" stroke="rgba(190,175,255,.5)" stroke-width="1.2"/>
      <text y="30" text-anchor="middle" font-size="20" font-weight="800" letter-spacing="2" fill="#f6c445" filter="url(#hglow)" font-family="Barlow Condensed,sans-serif">${esc(name.toUpperCase().slice(0,12))}</text>
      <text y="92" text-anchor="middle" font-size="62" font-weight="900" fill="#f6c445" filter="url(#hglow)" font-family="Barlow Condensed,sans-serif">10</text>
    </g>
    <rect width="400" height="520" fill="url(#hfade)"/>
  </svg>`;
}

/* ============ Barre de navigation du bas et menu ============ */
function navBar(){
  if(!p||p.retired) return "";
  const b = (icn,label,fn,extra)=>`<button class="nav-b" onclick="${fn}">${ic(icn)}<span>${label}</span>${extra||""}</button>`;
  return `<nav class="navbar" aria-label="Navigation">${b("home","Accueil","home()")}${b("idcard","Carrière","showCard()")}${b("phone","Téléphone","phoneScreen()",phoneBadge())}${b("menu","Menu","menuSheet()")}</nav>`;
}
function menuSheet(){
  document.querySelector(".overlay")?.remove();
  const row = (icn,label,sub,fn)=>`<button class="mrow" onclick="${fn}">${ic(icn)}<span><b>${label}</b><small>${sub}</small></span>${ic("chev","chev")}</button>`;
  openOverlay(`<div class="sheet menu" role="document"><h2>Menu</h2>
    ${row("heart","Ma vie","Agent, famille, logement, placements","closeOverlay(this.closest('.overlay'));vieScreen()")}
    ${row("users","Vestiaire","Coéquipiers, humeurs, capitaine","closeOverlay(this.closest('.overlay'));vestiaireScreen()")}
    ${row(soundOn?"vol":"volx","Son",soundOn?"Activé":"Coupé","toggleSound(null);menuSheet()")}
    ${row("mic","Commentateur vocal",voiceOn?"Activé":"Coupé","toggleVoice(null);menuSheet()")}
    ${row("home","Retour à l'accueil","Ta partie est sauvegardée","closeOverlay(this.closest('.overlay'));home()")}
    <button class="btn" onclick="closeOverlay(this.closest('.overlay'))">Fermer</button></div>`,"Menu");
}

/* ============ Animations (LottieFiles, licence Lottie Simple License) ============ */
// la bibliothèque lottie-web n'est chargée qu'à la première animation, depuis cdnjs
let lottieLib = null;
function loadLottie(){
  if(lottieLib) return lottieLib;
  lottieLib = new Promise((ok,ko)=>{
    if(typeof window==="undefined"||!document.head) return ko();
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js";
    sc.onload = ()=>ok(/** @type {any} */ (window).lottie); sc.onerror = ko;
    document.head.appendChild(sc);
  });
  return lottieLib;
}
// joue anim/<nom>.json dans un élément ; sans réseau ou sans animations, rien ne se passe
function playLottie(name,el,loop){
  if(!el||typeof fetch!=="function"||matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  Promise.all([loadLottie(),fetch("anim/"+name+".json").then(r=>r.json())])
    .then(([lib,data])=>{ if(lib&&el.isConnected) lib.loadAnimation({container:el,renderer:"svg",loop:!!loop,autoplay:true,animationData:data}); })
    .catch(()=>{});
}
// pluie de confettis plein écran, par-dessus les petites icônes qui tombent déjà
function lottieBurst(name){
  const el = document.createElement("div");
  el.className = "lottie-burst "+name; el.setAttribute("aria-hidden","true");
  document.body.appendChild(el);
  playLottie(name,el,false);
  setTimeout(()=>el.remove(),4200);
}

/* ============ Plus d'emojis : des icônes dessinées à la place ============ */
// le jeu écrit encore des emojis un peu partout (textes, succès, messages) ; à l'affichage, chacun devient
// l'icône du même style que le reste de l'interface, et ceux qui ne servent qu'à décorer disparaissent
Object.assign(ICONS, {
  medal:"M8 2h8l-2 6h-4zM12 22a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 13.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z",
  camera:"M3 8h4l2-3h6l2 3h4v12H3zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  chart:"M3 21h18M6 17v-5M11 17V8M16 17v-3M20 17V5",
  minus:"M5 12h14",
  pause:"M8 5v14M16 5v14",
  card:"M7 3h10v18H7z",
  flag:"M5 21V4M5 4h12l-2 4 2 4H5",
  smile:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 14c1 1.5 2.5 2.3 4 2.3s3-.8 4-2.3M9 9.5h.01M15 9.5h.01",
  meh:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 15h8M9 9.5h.01M15 9.5h.01"
});
const EMOJI_IC = {
  "⚔":"bolt","⚽":"ball","🏆":"trophy","✅":"check","❤":"heart","💙":"heart","♥":"heart","🫶":"heart","🕊":"heart","👶":"heart",
  "📋":"idcard","🎟":"idcard","🎯":"target","🧠":"target","🅰":"target","🌟":"star","⭐":"star","✨":"star","💫":"star","🎉":"star","☀":"star","🧩":"star","💎":"star","🏝":"star","🏟":"star",
  "🎲":"dice","⚠":"warning","💣":"warning","🔥":"fire","❌":"x","🩹":"cross","🩺":"cross","🎮":"play","▶":"play","⏩":"play","🎬":"play","◀":"back",
  "🌱":"run","🏃":"run","🚴":"run","🦵":"run","🧤":"shield","🛡":"shield","⚖":"shield","🧱":"shield","©":"shield","🔴":"ball","🎱":"ball",
  "⏱":"clock","⏳":"clock","🛌":"clock","📰":"chat","💬":"chat","✉":"chat","🗣":"megaphone","📣":"megaphone","🎤":"mic","🎙":"mic","🤝":"handshake",
  "🔁":"plane","✈":"plane","🌍":"flag","🌏":"flag","🌐":"flag","🗺":"flag","🏁":"flag","📞":"phone","📱":"phone","💥":"bolt","🌀":"bolt","🚀":"bolt","🦈":"bolt",
  "👪":"users","👥":"users","🤜":"users","🙋":"users","👨‍👩‍👧":"users","🏋":"dumbbell","💪":"dumbbell","🦾":"dumbbell","🏠":"home","🏡":"home","🏘":"home","🏢":"home","🚪":"home","🏰":"home",
  "📅":"calendar","📆":"calendar","🥇":"medal","🥈":"medal","🥉":"medal","🏅":"medal","🎖":"medal","👑":"crown","🏛":"trophy","➖":"minus","✔":"check",
  "📸":"camera","📹":"camera","📺":"camera","🖼":"camera","📊":"chart","📈":"chart","✏":"edit","✍":"edit","💾":"save","⏸":"pause",
  "💰":"coins","💸":"coins","💼":"coins","🏦":"coins","🔊":"vol","🔇":"volx","⚙":"gear","🟥":"card","🟨":"card","🔓":"lock","🔒":"lock","📖":"edit","🔎":"target",
  
  "🪨":"run","🦁":"fire","🎒":"plane","👁":"eye","👀":"eye","🗿":"shield","🧊":"snow","❄":"snow","🌙":"moon","⚪":"ball","😱":"warning","🌪":"bolt","🙌":"users","🌳":"tree","🎈":"star","🧓":"clock","💔":"heart","🐈":"shield","⬇":"down","📂":"save","🤦":"meh","😘":"smile","😭":"meh","😂":"smile","😅":"smile","😏":"smile","😉":"smile","😴":"clock","😈":"fire","🙏":"handshake","😢":"meh","👏":"handshake","🥺":"meh","🤡":"meh","🌧":"cloud","🪑":"clock","🛷":"run","🤫":"chat","🤸":"run","🕺":"run","☝":"target","🏴":"flag",
  "🙂":"smile","😄":"smile","😎":"smile","😐":"meh","😬":"meh","😠":"angry","😤":"angry","🤬":"angry","😒":"angry"
};
const EMO_RE = /(?:[\u{1F1E6}-\u{1F1FF}]{2}|\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}]|‍\p{Extended_Pictographic}️?)*|[#*0-9]️?⃣)/u;
const EMO_RE_G = new RegExp(EMO_RE.source,"gu");
const emojiKey = e=>EMOJI_IC[e]?e:e.replace(/[️\u{1F3FB}-\u{1F3FF}]/gu,"");
function deEmoji(root){
  if(!root) return;
  const nodes = [];
  if(root.nodeType===3) nodes.push(root);
  else if(root.nodeType===1){
    const w = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()) nodes.push(n);
  }
  for(const n of nodes){
    const t = n.nodeValue, par = n.parentElement;
    if(!t||!EMO_RE.test(t)||!par||par.closest("script,style,textarea,input,svg,canvas,.keep-emoji")) continue;
    const frag = document.createDocumentFragment();
    let last = 0;
    for(const m of t.matchAll(EMO_RE_G)){
      frag.append(t.slice(last,m.index));
      const name = EMOJI_IC[emojiKey(m[0])];
      if(name){ const s = document.createElement("span"); s.className = "emo"; s.innerHTML = ic(name); frag.append(s); }
      last = m.index+m[0].length;
    }
    frag.append(t.slice(last).replace(/^\s+(?=\S)/,last===0?"":" "));
    n.replaceWith(frag);
  }
}
if(typeof MutationObserver!=="undefined"&&typeof document!=="undefined"&&document.body){
  new MutationObserver(list=>{ for(const r of list) r.addedNodes.forEach(deEmoji); }).observe(document.body,{childList:true,subtree:true});
  deEmoji(document.body);
}

/* ============ Avant un mini-jeu : la consigne, puis « Je suis prêt » et un décompte ============ */
const MINI_BRIEF = {
  shoot:{icon:"ball",title:"Penalty pour toi",steps:["Choisis ton tir : placé, en force ou Panenka.","Le viseur bouge dans le but : clique quand il est sur le coin visé.","Une jauge de puissance monte et descend : clique avant le rouge, sinon le ballon passe au-dessus."]},
  save:{icon:"shield",title:"Penalty contre toi",steps:["Tu es dans les cages. Le tireur prend son élan : regarde ses appuis.","Dès qu'il frappe, clique à l'endroit du but où tu veux plonger.","Plus tu cliques près du ballon, plus tu as de chances de l'arrêter."]},
  fk:{icon:"target",title:"Coup franc pour toi",steps:["Clique quand le viseur est sur le coin visé.","Puissance : faible pour passer par-dessus le mur, forte pour surprendre le gardien.","Effet : fixe le curseur à gauche ou à droite pour enrouler."]},
  fksave:{icon:"shield",title:"Coup franc contre toi",steps:["Le tireur s'élance au-dessus du mur.","Dès que le ballon part, clique à l'endroit du but où tu veux plonger."]},
  shootout:{icon:"ball",title:"Tirs au but",steps:["Chaque équipe tire à tour de rôle.","Quand c'est toi qui tires : viseur, puis puissance, comme un penalty.","Si tu es gardien, clique où plonger dès que le tireur frappe."]},
  dribble:{icon:"run",title:"Dribble",steps:["Tu fonces balle au pied vers deux défenseurs.","Une flèche apparaît au-dessus de chacun et un cercle se referme.","Quand le cercle devient vert, appuie sur la flèche indiquée (↑ ou ↓), ou clique en haut ou en bas du terrain."]},
  tacle:{icon:"shield",title:"Tacle",steps:["L'attaquant fonce sur toi, et il peut feinter.","Attends qu'il entre dans l'anneau jaune devant toi.","Alors tacle : Espace ou clic. Trop tôt il t'efface, trop tard c'est la faute."]},
  aerien:{icon:"shield",title:"Sortie aérienne",steps:["Un centre arrive dans ta surface.","Suis le ballon jusqu'au cercle devant ton but.","Sors (Espace ou clic) quand le cercle devient vert, avant que l'attaquant ne saute."]},
  passe:{icon:"target",title:"La passe qui tue",steps:["Trois défenseurs bougent entre toi et ton attaquant.","La ligne de passe est rouge quand elle est coupée, verte quand elle est libre.","Passe (Espace ou clic) quand elle est verte. Le pressing arrive : ne traîne pas."]}
};
// renvoie une promesse : true pour jouer, false pour laisser le jeu simuler
function miniBrief(kind,title,sub){
  const b = MINI_BRIEF[kind];
  if(!b||typeof document==="undefined"||!document.body) return Promise.resolve(true);
  return new Promise(res=>{
    const el = document.createElement("div");
    el.className = "brief"; el.setAttribute("role","dialog"); el.setAttribute("aria-modal","true"); el.setAttribute("aria-label",title||b.title);
    el.innerHTML = `<div class="brief-card"><span class="brief-ic">${ic(b.icon)}</span><p class="brief-eyebrow">Mini-jeu</p><h2>${esc(title||b.title)}</h2>${sub?`<p class="muted">${esc(sub)}</p>`:""}
      <ol class="brief-steps">${b.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
      <button class="btn primary brief-go" type="button">Je suis prêt</button><button class="btn ghost brief-sim" type="button">Laisser le jeu simuler</button>
      <div class="brief-count" aria-live="assertive"></div></div>`;
    document.body.appendChild(el);
    const done = v=>{ removeEventListener("keydown",key,true); el.remove(); res(v); };
    const go = ()=>{
      el.querySelector(".brief-go").setAttribute("disabled",""); el.querySelector(".brief-sim").setAttribute("disabled","");
      if(matchMedia("(prefers-reduced-motion: reduce)").matches) return done(true);
      const c = /** @type {HTMLElement} */ (el.querySelector(".brief-count")); el.classList.add("counting");
      let n = 3; const tick = ()=>{ if(n===0) return done(true); c.textContent = String(n); c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); if(typeof sfx==="function") sfx("click"); n--; setTimeout(tick,650); };
      tick();
    };
    const key = e=>{ if(el.classList.contains("counting")) return; if(e.key==="Enter"||e.code==="Space"){ e.preventDefault(); e.stopPropagation(); go(); } else if(e.key==="Escape"){ e.preventDefault(); e.stopPropagation(); done(false); } };
    addEventListener("keydown",key,true);
    el.querySelector(".brief-go").addEventListener("click",go);
    el.querySelector(".brief-sim").addEventListener("click",()=>done(false));
    /** @type {HTMLElement} */ (el.querySelector(".brief-go")).focus({preventScroll:true});
  });
}
