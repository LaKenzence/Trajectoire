// Trajectoire · Éditeur de noms : chacun renomme les clubs et les championnats dans son propre navigateur.
// Le jeu publié reste entièrement fictif ; les noms personnalisés ne quittent jamais l'appareil (sauf export de sauvegarde).
// Chaque club garde son nom d'origine dans `orig` : c'est lui qui fixe ses couleurs et qui sert de clé.
const loadNames = ()=>{ try{ return JSON.parse(localStorage.getItem("trajectoire_noms"))||{clubs:{},leagues:{}}; }catch(e){ return {clubs:{},leagues:{}}; } };
const LEAGUE_ORIG = Object.fromEntries(Object.entries(COUNTRIES).map(([k,c])=>[k,c.league]));
let NAME_ORIG = {}; // nom affiché → nom d'origine
function applyNames(){
  const N = loadNames(); NAME_ORIG = {};
  for(const c of CLUBS){ c.orig = c.orig||c.name; c.name = N.clubs[c.orig]||c.orig; NAME_ORIG[c.name] = c.orig; }
  for(const k in COUNTRIES) COUNTRIES[k].league = N.leagues[k]||LEAGUE_ORIG[k];
}
// met à jour les clubs copiés dans une sauvegarde (club actuel, prêt, rival, offres)
function renameSaved(){
  if(!p) return;
  const fix = c=>{ if(!c||!c.name) return; const o = c.orig||NAME_ORIG[c.name]||c.name, now = CLUBS.find(x=>x.orig===o); if(now){ c.orig = o; c.name = now.name; } };
  fix(p.club); fix(p.loanFrom?.club); fix(p.rival?.club); (p.offers||[]).forEach(o=>fix(o.club));
}
const cleanName = s=>String(s||"").replace(/[<>"&]/g,"").replace(/\s+/g," ").trim().slice(0,30);
function namesScreen(note){
  p = null; unseed();
  const N = loadNames();
  $("#app").innerHTML = `<div class="fade" tabindex="-1" style="padding-top:20px">
    <div class="muted">Uniquement dans ce navigateur</div><h1><span class="emo" aria-hidden="true">✏️</span> Noms des clubs</h1>
    ${note?`<div class="toast" role="status">${note}</div>`:""}
    <p class="story">Renomme les clubs et les championnats comme tu veux. Ces noms restent sur ton appareil : le jeu publié, lui, reste fictif pour tout le monde. Les carrières en cours prennent les nouveaux noms.</p>
    ${Object.entries(COUNTRIES).map(([k,c])=>`<details class="card names"><summary>${flag(k)} <b>${c.name}</b> · ${esc(c.league)}</summary>
      <label class="names-row"><span>Championnat</span><input data-league="${k}" maxlength="30" placeholder="${esc(LEAGUE_ORIG[k])}" value="${esc(N.leagues[k]||"")}"></label>
      ${CLUBS.filter(x=>x.country===k).map(x=>`<label class="names-row"><span>${crest(x.orig,18)} force ${x.str}</span><input data-club="${esc(x.orig)}" maxlength="30" placeholder="${esc(x.orig)}" value="${esc(N.clubs[x.orig]||"")}"></label>`).join("")}</details>`).join("")}
    <button class="btn primary" onclick="saveNames()">Enregistrer les noms</button>
    <button class="btn" style="text-align:center" onclick="resetNames(this)">Revenir aux noms d'origine</button>
    <button class="btn ghost" onclick="home()">← Accueil</button></div>`;
  window.scrollTo(0,0); focusScreen();
}
function saveNames(){
  const N = {clubs:{},leagues:{}}, taken = new Set();
  document.querySelectorAll("input[data-club]").forEach((/** @type {HTMLInputElement} */ el)=>{ const v = cleanName(el.value); if(v&&!taken.has(v)){ N.clubs[el.dataset.club] = v; taken.add(v); } });
  document.querySelectorAll("input[data-league]").forEach((/** @type {HTMLInputElement} */ el)=>{ const v = cleanName(el.value); if(v) N.leagues[el.dataset.league] = v; });
  try{ localStorage.setItem("trajectoire_noms",JSON.stringify(N)); }catch(e){}
  applyNames();
  namesScreen(`✅ ${Object.keys(N.clubs).length} club(s) et ${Object.keys(N.leagues).length} championnat(s) renommés.`);
}
function resetNames(btn){
  if(!btn.dataset.sure){ btn.dataset.sure = "1"; btn.textContent = "Effacer tous tes noms ? Clique encore pour confirmer"; return; }
  try{ localStorage.removeItem("trajectoire_noms"); }catch(e){}
  applyNames(); namesScreen("Noms d'origine rétablis.");
}
applyNames();
