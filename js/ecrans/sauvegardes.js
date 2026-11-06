// Trajectoire · Export et import des sauvegardes : carrières, Panthéon et réglages tiennent dans un code à copier ou un fichier
// Le navigateur peut effacer ses données (navigation privée, nettoyage) : ce code permet de tout retrouver, sur n'importe quel appareil.
const SAVE_PREFIX = "TRAJ1:";
const saveKeys = ()=>{ const out = []; try{ for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k&&k.startsWith("trajectoire_")) out.push(k); } }catch(e){} return out.sort(); };
// encodage en base64 qui supporte les accents et les emojis
function toB64(s){
  const bytes = new TextEncoder().encode(s); let bin = "";
  for(let i=0;i<bytes.length;i+=8192) bin += String.fromCharCode(...bytes.subarray(i,i+8192)); // par morceaux : les grosses sauvegardes dépassent la limite d'arguments
  return btoa(bin);
}
const fromB64 = s=>new TextDecoder().decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0)));
function exportCode(){
  const data = {};
  for(const k of saveKeys()) data[k] = localStorage.getItem(k);
  return SAVE_PREFIX+toB64(JSON.stringify({v:1,at:new Date().toISOString(),data}));
}
// renvoie {ok, n} ou {ok:false, error} ; n'écrit rien si le code est invalide
function importCode(code){
  try{
    const raw = String(code||"").replace(/\s+/g,"");
    if(!raw.startsWith(SAVE_PREFIX)) return {ok:false,error:"Ce n'est pas un code de sauvegarde Trajectoire (il commence par TRAJ1:)."};
    const body = JSON.parse(fromB64(raw.slice(SAVE_PREFIX.length)));
    const entries = Object.entries(body&&body.data||{}).filter(([k,v])=>k.startsWith("trajectoire_")&&typeof v==="string");
    if(!entries.length) return {ok:false,error:"Ce code ne contient aucune sauvegarde."};
    for(const k of saveKeys()) localStorage.removeItem(k);
    for(const [k,v] of entries) localStorage.setItem(k,v);
    return {ok:true,n:entries.length};
  }catch(e){ return {ok:false,error:"Code illisible : vérifie qu'il a été copié en entier."}; }
}
function savesScreen(msg){
  p = null; unseed();
  const slots = ["1","2","3"].map(k=>loadSlot(k)), hof = loadHof();
  const fileName = `trajectoire-sauvegarde-${today()}.txt`;
  $("#app").innerHTML = `<div class="fade" tabindex="-1" style="padding-top:20px">
    <div class="muted">Tes données restent dans ce navigateur</div><h1><span class="emo" aria-hidden="true">💾</span> Sauvegardes</h1>
    ${msg?`<div class="toast" role="status">${msg}</div>`:""}
    <div class="card"><h3>Ce qui est sauvegardé ici</h3>
      <ul class="log">${slots.map((s,i)=>`<li>Emplacement ${i+1} : ${s?`${esc(s.name)} · ${s.retired?"carrière terminée":`${s.age} ans, ${esc(s.club.name)}`}`:"vide"}</li>`).join("")}
      <li>Panthéon : ${Object.keys(hof.ach).length} succès, ${hof.careers.length} carrière(s) au classement</li></ul></div>
    <div class="card"><h3>Exporter</h3>
      <p class="muted" style="margin-top:0;font-size:.9rem">Garde ce code quelque part (notes, e-mail…) ou télécharge-le en fichier. Il contient tout ce qui est listé au-dessus.</p>
      <label class="sr-only" for="exportBox">Code de sauvegarde</label>
      <textarea id="exportBox" class="code" readonly rows="4">${exportCode()}</textarea>
      <button class="btn" onclick="copySave(this)">📋 Copier le code</button>
      <button class="btn" onclick="downloadSave(this,'${fileName}')">⬇️ Télécharger le fichier</button></div>
    <div class="card"><h3>Importer</h3>
      <p class="muted" style="margin-top:0;font-size:.9rem">Colle un code ou choisis un fichier de sauvegarde. ⚠️ Tout ce qui est sauvegardé ici sera remplacé.</p>
      <label class="sr-only" for="importBox">Code à importer</label>
      <textarea id="importBox" class="code" rows="4" placeholder="TRAJ1:…"></textarea>
      <label class="btn" style="text-align:center">📂 Choisir un fichier<input type="file" accept=".txt,text/plain" class="sr-only" onchange="readSaveFile(this)"></label>
      <button class="btn primary" onclick="askImport(this)">Importer</button></div>
    <button class="btn ghost" onclick="home()">← Accueil</button></div>`;
  window.scrollTo(0,0); focusScreen();
}
function copySave(btn){
  const box = /** @type {HTMLTextAreaElement} */ ($("#exportBox"));
  const done = ()=>{ btn.textContent = "✅ Code copié !"; };
  try{ navigator.clipboard.writeText(box.value).then(done,()=>{ box.select(); fallbackCopy(box.value,done); }); }catch(e){ fallbackCopy(box.value,done); }
}
async function downloadSave(btn,fileName){
  const blob = new Blob([exportCode()],{type:"text/plain"});
  const dl = window.claude?.use?await window.claude.use("downloads").catch(()=>null):null;
  if(dl){
    try{ await dl.save({filename:fileName,data:blob}); btn.textContent = "✅ Fichier enregistré"; }
    catch(e){ btn.textContent = e?.code==="declined"?"Téléchargement annulé":"Le téléchargement a échoué : copie plutôt le code"; }
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  btn.textContent = "✅ Fichier téléchargé";
}
function readSaveFile(input){
  const f = input.files&&input.files[0]; if(!f) return;
  f.text().then(t=>{ /** @type {HTMLTextAreaElement} */ ($("#importBox")).value = t.trim(); });
}
function askImport(btn){
  const code = /** @type {HTMLTextAreaElement} */ ($("#importBox")).value;
  if(!code.trim()){ btn.textContent = "Colle d'abord un code"; return; }
  if(!btn.dataset.sure){ btn.dataset.sure = "1"; btn.textContent = "Tout remplacer ? Clique encore pour confirmer"; return; }
  const res = importCode(code);
  if(!res.ok){ delete btn.dataset.sure; btn.textContent = "Importer"; return savesScreen(`❌ ${res.error}`); }
  try{ slot = localStorage.getItem("trajectoire_slot")||"1"; }catch(e){}
  tipsSeen = (()=>{ try{ return JSON.parse(localStorage.getItem("trajectoire_tips"))||{}; }catch(e){ return {}; } })();
  VUS = loadVus();
  savesScreen(`✅ Sauvegarde importée (${res.n} élément${res.n>1?"s":""}). Tes carrières t'attendent à l'accueil.`);
}
