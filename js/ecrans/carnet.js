// Trajectoire · Carnet des histoires : ce qui a été vécu d'une carrière à l'autre, et ce qu'il reste à découvrir
/* ============ Mémoire des événements (partagée entre les carrières) ============ */
// trajectoire_vus : {id: {n: fois vécu en tout, t: début du texte, y: année de la découverte, k: dernière carrière où il est sorti}}
// trajectoire_vus_n : nombre de carrières commencées, pour savoir ce qui est sorti récemment
const loadVus = ()=>{ try{ return JSON.parse(localStorage.getItem("trajectoire_vus"))||{}; }catch(e){ return {}; } };
let VUS = loadVus();
const isNewStory = e=>!VUS[e.id];
function careerNo(){
  if(!p.cno){ let n = 0; try{ n = +(localStorage.getItem("trajectoire_vus_n")||0)+1; localStorage.setItem("trajectoire_vus_n",String(n)); }catch(err){} p.cno = n||1; }
  return p.cno;
}
function markSeen(e,txt){
  const v = VUS[e.id], k = careerNo();
  if(v){ v.n++; v.k = k; }
  else{
    const plain = String(txt).replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
    const first = plain.match(/^.{20,}?[.!?…»](\s|$)/)?.[0]||plain;
    VUS[e.id] = {n:1,t:first.length>120?first.slice(0,117)+"…":first.trim(),y:p.year,k};
    p.found = (p.found||[]).concat(e.id);
  }
  try{ localStorage.setItem("trajectoire_vus",JSON.stringify(VUS)); }catch(err){}
}
// poids du tirage : une histoire jamais vécue sort bien plus souvent ; une histoire sortie à la carrière d'avant se fait oublier,
// et plus on l'a vécue, moins elle revient. Le défi du jour et le défi entre amis gardent un tirage identique pour tout le monde.
function novelty(e){
  if(p.daily||p.friend) return 1;
  const v = VUS[e.id];
  if(!v) return 3;
  const ago = careerNo()-(v.k||0);
  if(ago<=0) return .3;   // déjà sortie dans cette carrière : se répéter est pire que revenir d'une autre carrière
  return (ago===1?.3:ago===2?.6:1)/(1+.2*Math.min(v.n,6));
}
const RARE_W = .3;

/* ============ Écran du carnet ============ */
// les histoires qu'on peut découvrir : les événements de carrière (les suites comptent, ce sont les échos du passé)
const storyPool = ()=>EVENTS.filter(e=>!e.hidden);
function carnetCount(){ const all = storyPool(); return {seen:all.filter(e=>VUS[e.id]).length,all:all.length}; }
function carnetScreen(){
  const all = storyPool(), c = carnetCount(), back = p?.retired?"endScreen()":"home()";
  const byCat = {};
  for(const e of all){ const k = sceneOf(e); (byCat[k] = byCat[k]||[]).push(e); }
  const pistes = all.filter(e=>!VUS[e.id]&&e.hint);
  const cat = k=>{
    const list = byCat[k], s = SCENES[k], got = list.filter(e=>VUS[e.id]);
    got.sort((a,b)=>(VUS[a.id].y||0)-(VUS[b.id].y||0));
    return `<details class="card carnet-cat" style="--sc:${s.c}"><summary><span class="scene-i" aria-hidden="true">${ic(SCENE_IC[k]||"bolt")}</span><b>${s.n}</b><span class="muted">${got.length}/${list.length}</span>
      <span class="bar" style="flex:1 1 100%"><span class="t"><span class="f" style="display:block;width:${Math.round(100*got.length/list.length)}%;background:${s.c}"></span></span></span></summary>
      ${got.length?got.map(e=>`<div class="ach"><span class="i">${e.rare?"⭐":"📖"}</span><div><b>${esc(VUS[e.id].t)}</b><small>Vécue ${VUS[e.id].n} fois${e.rare?" · histoire rare":""}</small></div></div>`).join(""):'<p class="muted">Aucune histoire vécue ici pour l\'instant.</p>'}
      ${list.length>got.length?`<p class="muted" style="margin:8px 0 0">🔒 Encore ${list.length-got.length} à découvrir.</p>`:'<p style="margin:8px 0 0">✅ Tout vu dans cette catégorie !</p>'}</details>`;
  };
  $("#app").innerHTML = `<div class="fade" style="padding-top:20px">
    <header class="cosmos"><div class="muted">Toutes tes carrières</div><h1><span class="emo" aria-hidden="true">📖</span> Carnet des histoires</h1></header>
    <div class="card"><h3>${c.seen}/${c.all} histoires vécues · ${Math.round(100*c.seen/c.all)} %</h3>
      <p class="muted" style="margin:0">Les histoires que tu n'as jamais vécues sortent plus souvent. Certaines sont rares, d'autres n'arrivent qu'à un poste, dans un certain club ou après un choix précis.</p></div>
    ${pistes.length?`<div class="card"><h3>🔎 Pistes</h3>${pistes.slice(0,8).map(e=>`<div class="ach off"><span class="i">${e.rare?"⭐":"🔒"}</span><div><b>${esc(e.hint)}</b><small>${SCENES[sceneOf(e)].n}${e.rare?" · rare":""}</small></div></div>`).join("")}</div>`:""}
    ${Object.keys(SCENES).filter(k=>byCat[k]).map(cat).join("")}
    <button class="btn primary" onclick="${back}">← Retour</button></div>`;
  window.scrollTo(0,0);
}
// carte du bilan final : ce que cette carrière a fait découvrir
function foundCard(){
  const n = (p.found||[]).length, c = carnetCount();
  if(!n) return `<div class="card"><h3>📖 Carnet des histoires · ${c.seen}/${c.all}</h3><p class="muted" style="margin:0">Aucune nouvelle histoire cette fois. Change de poste, de pays ou de défi pour en croiser d'autres.</p></div>`;
  return `<div class="card celebrate"><h3>📖 ${n} nouvelle${n>1?"s":""} histoire${n>1?"s":""} découverte${n>1?"s":""} · ${c.seen}/${c.all}</h3>
    ${p.found.slice(-4).map(id=>VUS[id]?`<div class="ach new"><span class="i">${EVENTS.find(e=>e.id===id)?.rare?"⭐":"📖"}</span><div><b>${esc(VUS[id].t)}</b></div></div>`:"").join("")}
    <button class="btn ghost" onclick="carnetScreen()">Ouvrir le carnet</button></div>`;
}
