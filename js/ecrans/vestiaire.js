// Trajectoire · Le vestiaire visible : tes coéquipiers, leur humeur et ce qu'ils sont pour toi
// L'effectif est tiré à partir du nom du club (il ne change pas à chaque ouverture) et se renouvelle par tiers chaque saison.
function squad(){
  const c = p.club, out = [], used = new Set([p.name,p.rival?.name]);
  const posList = ["GB","DEF","DEF","DEF","MIL","MIL","MIL","ATT","ATT"];
  posList.forEach((pos,i)=>{
    // un tiers de l'effectif change chaque saison
    const h = hashStr(`${c.name}:${i}:${Math.floor((p.seasons.length+i)/3)}`);
    let name = FIRST[h%FIRST.length]+" "+LAST[(h>>>7)%LAST.length];
    if(used.has(name)) name = FIRST[(h>>>3)%FIRST.length]+" "+LAST[(h>>>11)%LAST.length];
    used.add(name);
    out.push({name,pos,age:19+(h>>>5)%15,lvl:clamp(c.str-6+(h>>>9)%12,40,95),h});
  });
  // les personnages de ta carrière prennent leur place dans le groupe
  const set = (i,name,tag)=>{ out[i].name = name; out[i].tag = tag; };
  if(p.rel){ set(4,p.rel.mate,"pote"); set(7,p.rel.jealous,"jaloux"); }
  if(rivalActive()&&p.rival.club.name===c.name) set(8,p.rival.name,"rival");
  if(!p.flags.cap) out[2].tag = out[2].tag||"capitaine";
  if(p.flags.pepite) out[6].tag = out[6].tag||"protégé";
  return out.filter(x=>x.pos!==p.pos||x.tag);
}
// humeur : l'ambiance du club (classement, dernier match) plus l'histoire de chacun avec toi
function mood(x){
  const L = p.last||{}, team = (L.rank?(5-L.rank)*6:0)+(L.match?.res==="w"?8:L.match?.res==="l"?-8:0)+((x.h>>>4)%21-10);
  const bonus = {pote:20,jaloux:p.flags.jealousPaix?5:-30,rival:-15,protégé:15,capitaine:5}[x.tag]||0;
  const v = team+bonus;
  return v>12?"😄":v>0?"🙂":v>-12?"😐":"😠";
}
const TAGS = {pote:"🤜 Ton meilleur pote",jaloux:"😒 Te jalouse",rival:"⚔️ Ton rival",capitaine:"© Capitaine",protégé:"🌱 Ton protégé"};
function vestiaireScreen(){
  if(!p) return;
  const k = clubColors(p.club), trust = p.rel?.trust??50;
  const card = x=>`<div class="mate"><span class="avatar" style="background:${k.a};color:${k.b==="#14171c"?"#fff":k.b}" aria-hidden="true">${initials(x.name)}</span>
    <div><b>${esc(x.name)}</b> <span aria-label="humeur">${mood(x)}</span><small>${POS[x.pos].n} · ${x.age} ans · niveau ${x.lvl}</small>${x.tag?`<small class="mate-tag">${TAGS[x.tag]}</small>`:""}</div></div>`;
  openOverlay(`<div class="sheet" role="document"><h2>👥 Vestiaire · ${esc(p.club.name)}</h2>
    <div class="mate me"><span class="avatar">${avatarSvg(p.look,40,k.a)}</span><div><b>${esc(p.name)} (toi)</b>${p.flags.cap?' <small class="mate-tag">© Capitaine</small>':""}<small>${POS[p.pos].n} · niveau ${p.lvl}</small></div></div>
    <div class="mate"><span class="avatar" aria-hidden="true">📋</span><div><b>Le coach</b> <span>${trust>=65?"😄":trust>=45?"🙂":trust>=30?"😐":"😠"}</span><small>Confiance en toi : ${Math.round(trust)} / 100</small></div></div>
    <div class="mates">${squad().map(card).join("")}</div>
    <button class="btn" onclick="closeOverlay(this.closest('.overlay'))">Fermer</button></div>`,"Vestiaire");
}
