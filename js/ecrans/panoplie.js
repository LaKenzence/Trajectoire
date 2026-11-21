// Trajectoire · La panoplie : des récompenses visibles gagnées d'une carrière à l'autre (succès du Panthéon).
// Crampons et numéro se voient sur ton joueur en 3D, la célébration se joue après tes buts et tes arrêts, le chant
// du public passe dans l'ambiance du stade. Choix rangés dans localStorage « trajectoire_gear ».

const GEAR = {
  boots:{n:"Crampons",i:"👟",items:[
    {id:"noir",n:"Noirs classiques",c:"#1b1d24"},{id:"blanc",n:"Blancs",c:"#eef0f3"},
    {id:"fluo",n:"Jaune fluo",c:"#d6ff2e",need:1},{id:"rose",n:"Rose électrique",c:"#ff3fa4",need:4},
    {id:"orange",n:"Orange volcan",c:"#ff6a1a",ach:"cdc"},{id:"or",n:"Or massif",c:"#e8b923",ach:"ballon"}]},
  celeb:{n:"Célébration",i:"🙌",items:[
    {id:"bras",n:"Les bras au ciel"},{id:"avion",n:"L'avion",need:2},{id:"poing",n:"Le poing rageur",need:3},
    {id:"ciel",n:"Les doigts vers le ciel",ach:"fidele"},{id:"statue",n:"La statue",ach:"top"},{id:"genou",n:"Un genou à terre",ach:"monde"}]},
  kit:{n:"Numéro du maillot",i:"🎽",items:[
    {id:"club",n:"Aux couleurs du club"},{id:"argent",n:"Argenté",c:"#d5dce4",need:6},{id:"or",n:"Doré",c:"#f2c437",ach:"finales"}]},
  chant:{n:"Chant du public",i:"📣",items:[
    {id:"allez",n:"« Allez, allez ! »"},{id:"ole",n:"Les « Olé ! »",need:5},{id:"nom",n:"Ton nom scandé",ach:"jubile"},{id:"hymne",n:"L'hymne du stade",ach:"trois"}]}
};
const achN = h=>Object.keys((h||loadHof()).ach).length;
function gearOpen(it,h){ return it.ach?!!h.ach[it.ach]:(achN(h)>=(it.need||0)); }
function gearNeed(it){ if(it.ach){ const a = ACH.find(x=>x.id===it.ach); return a?`Succès « ${a.n} »`:"Un succès"; } return `${it.need} succès au Panthéon`; }
function gearPick(){ try{ return JSON.parse(localStorage.getItem("trajectoire_gear"))||{}; }catch(e){ return {}; } }
// la panoplie portée : le choix enregistré s'il est débloqué, sinon le premier objet
function gear(){
  const h = loadHof(), sel = gearPick(), out = {};
  for(const [k,cat] of Object.entries(GEAR)){ const it = cat.items.find(x=>x.id===sel[k]&&gearOpen(x,h))||cat.items[0]; out[k] = it; }
  return out;
}
function setGear(k,id){
  const it = GEAR[k]?.items.find(x=>x.id===id); if(!it||!gearOpen(it,loadHof())) return;
  const sel = gearPick(); sel[k] = id;
  try{ localStorage.setItem("trajectoire_gear",JSON.stringify(sel)); }catch(e){}
  const el = document.getElementById("gear"); if(el) el.outerHTML = gearCard();
}
function gearCard(){
  const h = loadHof(), cur = gear();
  const chip = (k,it)=>{ const open = gearOpen(it,h), on = cur[k].id===it.id;
    return `<button class="gear-it${on?" on":""}${open?"":" locked"}" ${open?`onclick="setGear('${k}','${it.id}')"`:"disabled"} aria-pressed="${on}">${it.c?`<span class="gear-sw" style="background:${it.c}"></span>`:""}<span>${esc(it.n)}</span>${open?"":`<small>🔒 ${esc(gearNeed(it))}</small>`}</button>`; };
  return `<div class="card" id="gear"><h3>🎽 Ta panoplie</h3><p class="muted" style="margin-top:0;font-size:.88rem">Gagnée avec tes succès, portée par tous tes joueurs : sur le terrain en 3D, et dans le stade.</p>
    ${Object.entries(GEAR).map(([k,cat])=>`<div class="gear-cat"><b>${cat.i} ${cat.n}</b><div class="gear-row">${cat.items.map(it=>chip(k,it)).join("")}</div></div>`).join("")}</div>`;
}
// une ligne pour le vestiaire : ce que tu portes
const gearLine = ()=>{ const g = gear(); return `Crampons ${g.boots.n.toLowerCase()} · ${g.celeb.n}${g.kit.id!=="club"?` · numéro ${g.kit.n.toLowerCase()}`:""}`; };
// en fin de carrière : ce que les nouveaux succès viennent de débloquer (annoncé une seule fois)
function gearNews(){
  const h = loadHof(); let seen = [];
  try{ seen = JSON.parse(localStorage.getItem("trajectoire_gear_seen"))||[]; }catch(e){}
  const fresh = [];
  for(const [k,cat] of Object.entries(GEAR)) for(const it of cat.items){
    const key = k+":"+it.id;
    if((it.need||it.ach)&&gearOpen(it,h)&&!seen.includes(key)){ fresh.push({cat,it}); seen.push(key); }
  }
  if(!fresh.length) return "";
  try{ localStorage.setItem("trajectoire_gear_seen",JSON.stringify(seen)); }catch(e){}
  return `<div class="card celebrate"><h3>🎽 Nouveau dans ta panoplie</h3>${fresh.map(({cat,it})=>`<div class="ach new"><span class="i">${it.c?`<span class="gear-sw" style="background:${it.c};width:22px;height:22px"></span>`:cat.i}</span><div><b>${esc(it.n)}</b><small>${cat.n} · à choisir au Panthéon</small></div></div>`).join("")}
    <button class="btn" style="text-align:center" onclick="hofScreen();setTimeout(()=>document.getElementById('gear')?.scrollIntoView({behavior:'smooth'}),300)">Choisir ma panoplie</button></div>`;
}
