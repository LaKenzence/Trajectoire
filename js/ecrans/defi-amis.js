// Trajectoire · Défi entre amis : un code à partager pour jouer exactement le même départ et comparer les scores.
// Comme le défi du jour, le hasard est rejoué à l'identique à chaque début de saison, mais rien n'est envoyé : on compare à la main.
const FRIEND_RE = /^AMI-([A-Z0-9]{6})$/;
const newFriendSeed = ()=>Array.from({length:6},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(nativeRandom()*32)]).join("");
function friendDraft(seed){
  seedRng("ami:"+seed);
  const k = o=>pick(Object.keys(o));
  const o = {look:randomLook(),name:pick(FIRST)+" "+pick(LAST),country:k(COUNTRIES),pos:k(POS),trait:k(TRAITS),origin:k(ORIGINS),ent:k(ENTOURAGES),life:k(LIFESTYLES),friend:seed};
  unseed(); return o;
}
function friendsScreen(note){
  p = null; unseed();
  const saved = loadSlot("ami"), inProgress = saved&&saved.friend&&!(saved.retired&&saved.after);
  const fresh = ui.friendSeed = ui.friendSeed||newFriendSeed(), o = friendDraft(fresh);
  $("#app").innerHTML = `<div class="fade" tabindex="-1" style="padding-top:20px">
    <div class="muted">Même joueur, mêmes coups du sort</div><h1><span class="emo" aria-hidden="true">🤝</span> Défi entre amis</h1>
    ${note?`<div class="toast" role="status">${note}</div>`:""}
    <p class="story">Envoie un code à tes amis : vous démarrez avec le même joueur et les mêmes débuts de saison. Tes choix font la différence. À la fin, comparez vos scores.</p>
    ${inProgress?`<button class="btn primary" onclick="resume('ami')">▶ Reprendre le défi AMI-${saved.friend}<small>${esc(saved.name)} · ${saved.age} ans · ${esc(saved.club.name)}</small></button>`:""}
    <div class="card"><h3>Lancer un nouveau défi</h3>
      <p style="margin:0 0 6px">${avatarSvg(o.look,36)} ${flag(o.country)} <b>${esc(o.name)}</b> · ${POS[o.pos].n} · ${TRAITS[o.trait].n}</p>
      <p>Ton code : <b class="code-big">AMI-${fresh}</b></p>
      <button class="btn" onclick="copyFriend(this,'AMI-${fresh}')">📋 Copier le code pour tes amis</button>
      <button class="btn" onclick="ui.friendSeed=null;friendsScreen()">🎲 Un autre joueur</button>
      <button class="btn ${inProgress?"":"primary"}" onclick="friendStart('${fresh}')">Jouer ce défi</button></div>
    <div class="card"><h3>Rejoindre le défi d'un ami</h3>
      <label class="sr-only" for="friendCode">Code du défi</label>
      <input id="friendCode" placeholder="AMI-XXXXXX" maxlength="10" autocomplete="off">
      <button class="btn" onclick="friendJoin()">Rejoindre</button></div>
    ${inProgress?`<p class="muted" style="font-size:.85rem">⚠️ Lancer un autre défi remplace celui en cours.</p>`:""}
    <button class="btn ghost" onclick="home()">← Accueil</button></div>`;
  window.scrollTo(0,0); focusScreen();
}
function copyFriend(btn,code){
  const txt = `Je te défie sur Trajectoire ! Code : ${code} (accueil → Défi entre amis)`, done = ()=>{ btn.textContent = "✅ Copié !"; };
  try{ navigator.clipboard.writeText(txt).then(done,()=>fallbackCopy(txt,done)); }catch(e){ fallbackCopy(txt,done); }
}
function friendJoin(){
  const m = FRIEND_RE.exec(/** @type {HTMLInputElement} */ ($("#friendCode")).value.trim().toUpperCase());
  if(!m) return friendsScreen("❌ Ce code ne ressemble pas à un code de défi (AMI- suivi de 6 caractères).");
  friendStart(m[1]);
}
function friendStart(seed){
  slot = "ami"; wipe("ami"); ui.friendSeed = null;
  const o = friendDraft(seed);
  seedRng("ami:"+seed+":joueur");
  newPlayer(o);
  seedRng("ami:"+seed+":0");
  route();
}
// graine des débuts de saison : défi du jour ou défi entre amis
const runSeed = ()=>p.daily||(p.friend?"ami:"+p.friend:null);
function friendCard(){
  if(!p.friend) return "";
  return `<div class="card celebrate"><h3>🤝 Défi entre amis · AMI-${p.friend}</h3><p class="story" style="margin:0 0 8px">Ton score : <b style="font-size:1.6rem;color:var(--accent)">${dailyScore()}</b></p>
    <p class="muted" style="margin:0 0 8px;font-size:.88rem">Même calcul que le défi du jour : titres, trophées, Ballons d'Étoile, niveau max, buts, sélections, rivalité et objectifs.</p>
    <button class="btn" onclick="copyFriendScore(this)">📋 Copier mon score pour mes amis</button></div>`;
}
function copyFriendScore(btn){
  const txt = `Défi Trajectoire AMI-${p.friend} : ${dailyScore()} points avec ${p.name}. À toi de faire mieux !`, done = ()=>{ btn.textContent = "✅ Score copié !"; };
  try{ navigator.clipboard.writeText(txt).then(done,()=>fallbackCopy(txt,done)); }catch(e){ fallbackCopy(txt,done); }
}
