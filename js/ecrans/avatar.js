// Trajectoire · Avatar du joueur : teint, coiffure, couleur de cheveux, barbe. Portrait dessiné en SVG, sans image.
const LOOKS = {
  skin:{n:"Teint",v:["#f6d7c3","#e9b897","#c98e66","#a86b45","#7a4a2c","#4f2f1d"]},
  hair:{n:"Coiffure",v:["Rasé","Court","Bouclé","Long","Crête","Tresses"]},
  hairC:{n:"Cheveux",v:["#1c1410","#4a2c1a","#7b4f2c","#d9b25f","#b4512b","#d8d4cc"]},
  beard:{n:"Barbe",v:["Aucune","Courte","Fournie"]}
};
const randomLook = ()=>({skin:RI(0,5),hair:RI(0,5),hairC:RI(0,4),beard:chance(.6)?0:RI(1,2)});
// apparence stable dérivée du nom, pour les sauvegardes d'avant l'avatar
const lookFromName = n=>{ const h = hashStr(n); return {skin:h%6,hair:(h>>>3)%6,hairC:(h>>>6)%5,beard:(h>>>9)%3===0?1:0}; };
const lookSkin = l=>LOOKS.skin.v[l?.skin??2], lookHair = l=>LOOKS.hairC.v[l?.hairC??0];

// portrait en buste dans un médaillon : fond lumineux, maillot à col, visage ombré d'un côté, coiffure et barbe par-dessus.
// Les identifiants SVG commencent par « av » (le bandeau du jeu les ignore pour savoir s'il a changé).
function avatarSvg(look,size,shirtColor){
  const l = look||{skin:2,hair:1,hairC:0,beard:0}, s = lookSkin(l), h = lookHair(l), sz = size||48, shirt = shirtColor||"#5b3fd6";
  const id = "av"+(svgId++), H = `fill="${h}"`;
  // coiffures : derrière la tête (cheveux longs), puis devant
  const back = l.hair===3?`<path d="M14.6 22c0-8.6 5-14 11.4-14s11.4 5.4 11.4 14v12.5c-1.4.9-2.8 1.2-4 1V24.5H19.6v11c-1.2.2-2.6-.1-4-1z" ${H}/>`:"";
  const sideCap = `<path d="M16.2 20.6c0-6.9 4.4-11.4 9.8-11.4s9.8 4.5 9.8 11.4c-1.7-3.3-5-5.3-9.8-5.3s-8.1 2-9.8 5.3z" ${H}`;
  const hair = [
    `${sideCap} opacity=".55"/>`,
    `<path d="M15.6 21.6c-.5-8.1 4.4-13.5 10.4-13.5 6.4 0 11.1 4.9 10.4 13.5-1.1-3.1-2.6-5-4.4-5.9-1.9 1.5-4.5 2.1-7.2 1.5-2.1-.5-4-1.3-5.3-.6-1.8.9-3.1 2.7-3.9 5z" ${H}/>
      <path d="M20 11.5c2.6-1.6 6.3-1.9 9.4-.6" stroke="#fff" stroke-opacity=".18" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
    [[16.6,18,3.5],[18.6,13.4,3.8],[22.6,10.4,4],[27.4,10,4.1],[31.8,12.4,3.9],[34.8,17,3.6],[25,14,3.6],[29.5,15,3.2],[20.5,15.6,3.2]]
      .map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" ${H}/>`).join("")+`<circle cx="23" cy="9.4" r="1.4" fill="#fff" opacity=".15"/><circle cx="31" cy="11.6" r="1.2" fill="#fff" opacity=".12"/>`,
    `<path d="M16 21.2c.5-7.1 4.6-11.7 10-11.7s9.5 4.6 10 11.7c-2-3.7-5.4-5.5-10-5.5-2.5 0-5 .6-6.7 1.9z" ${H}/>`,
    `${sideCap} opacity=".35"/><path d="M23.1 7.2c1.1-1.1 4.7-1.1 5.8 0l.8 10.8h-7.4z" ${H}/>`,
    `${sideCap}/>`+[19.5,23,26,29,32.5].map(x=>`<path d="M${x} 10.5q${(x-26)*.12} 4 ${(x-26)*.25} 7.5" stroke="#000" stroke-opacity=".25" stroke-width=".7" fill="none"/>`).join("")
      +[[15.2,19],[36.8,19]].map(([x,y])=>`<rect x="${x-1.3}" y="${y}" width="2.6" height="15" rx="1.3" ${H}/>`).join("")
  ][l.hair]||"";
  const beard = l.beard===1
    ? `<path d="M16.6 25c.3 6 4.3 10.5 9.4 10.5s9.1-4.5 9.4-10.5c-1 2.6-2.4 4.4-4 5.2-1.6-1-3.4-1.4-5.4-1.4s-3.8.4-5.4 1.4c-1.6-.8-3-2.6-4-5.2z" ${H} opacity=".42"/>`
    : l.beard===2
    ? `<path d="M16 24c0 7.6 4.4 12.7 10 12.7S36 31.6 36 24c-.8 2.8-2.4 4.6-4.4 5.4-1.6-1-3.4-1.5-5.6-1.5s-4 .5-5.6 1.5C18.4 28.6 16.8 26.8 16 24z" ${H}/>
       <path d="M22.4 28.7q3.6-1.8 7.2 0-3.6 1-7.2 0z" ${H}/>`
    : "";
  return `<svg class="avatar-svg" width="${sz}" height="${sz}" viewBox="0 0 52 52" aria-hidden="true">
    <defs><radialGradient id="${id}b" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#3a3196"/><stop offset="1" stop-color="#0f1238"/></radialGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
      <clipPath id="${id}c"><circle cx="26" cy="26" r="26"/></clipPath></defs>
    <g clip-path="url(#${id}c)">
    <rect width="52" height="52" fill="url(#${id}b)"/>
    <ellipse cx="26" cy="14" rx="16" ry="9" fill="#f5c542" opacity=".1"/>
    ${back}
    <path d="M4 53c1-8.6 7.8-12.7 15-13.7l7 4.2 7-4.2c7.2 1 14 5.1 15 13.7z" fill="${shirt}"/>
    <path d="M4 53c1-8.6 7.8-12.7 15-13.7l7 4.2 7-4.2c7.2 1 14 5.1 15 13.7z" fill="url(#${id}s)"/>
    <path d="M21.4 31h9.2v6.8c-1.5 1.5-3 2.1-4.6 2.1s-3.1-.6-4.6-2.1z" fill="${s}"/>
    <path d="M21.4 33.5c1.6 1.4 3 2 4.6 2s3-.6 4.6-2v1.8c-1.6 1.4-3 2-4.6 2s-3-.6-4.6-2z" fill="#000" opacity=".16"/>
    <path d="M18.8 38.8l7.2 5.4 7.2-5.4-1.6-.9-5.6 4.1-5.6-4.1z" fill="#fff" opacity=".85"/>
    <ellipse cx="15.7" cy="24.2" rx="1.9" ry="2.9" fill="${s}"/><ellipse cx="36.3" cy="24.2" rx="1.9" ry="2.9" fill="${s}"/>
    <path d="M16.1 21c0-7.2 4.4-12 9.9-12s9.9 4.8 9.9 12v3c0 6.6-4.4 11.6-9.9 11.6S16.1 30.6 16.1 24z" fill="${s}"/>
    <path d="M29.8 10c4 2.1 6.1 6 6.1 11v3c0 6.6-4.4 11.6-9.9 11.6 3.3-2.2 5.6-6.2 5.6-11.6v-3c0-4.6-.6-8.2-1.8-11z" fill="#000" opacity=".1"/>
    ${hair}${beard}
    <path d="M19.6 20.7q2.5-1.6 5-.3M27.4 20.4q2.5-1.3 5 .3" stroke="${h}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <ellipse cx="22.1" cy="23.7" rx="1.75" ry="1.2" fill="#fff"/><ellipse cx="29.9" cy="23.7" rx="1.75" ry="1.2" fill="#fff"/>
    <circle cx="22.3" cy="23.8" r=".95" fill="#2a1a10"/><circle cx="30.1" cy="23.8" r=".95" fill="#2a1a10"/>
    <circle cx="22.6" cy="23.4" r=".3" fill="#fff"/><circle cx="30.4" cy="23.4" r=".3" fill="#fff"/>
    <path d="M26.2 24.6v3.1q-.2.9-1.5.7" stroke="#000" stroke-opacity=".28" stroke-width=".9" fill="none" stroke-linecap="round"/>
    <path d="M23.1 30.1q2.9 1.9 5.8 0" stroke="#7a3b2e" stroke-width="1.15" fill="none" stroke-linecap="round"/>
    </g></svg>`;
}
// éditeur : une ligne « ◀ valeur ▶ » par trait ; fn est le nom de la fonction appelée avec (trait, ±1)
function lookEditor(look,fn){
  const row = k=>{ const L = LOOKS[k], v = L.v[look[k]], swatch = v.startsWith("#");
    return `<div class="look-row"><span>${L.n}</span><button type="button" class="hudbtn" onclick="${fn}('${k}',-1)" aria-label="${L.n} précédent">◀</button>
      <b>${swatch?`<i class="sw" style="background:${v}"></i>`:v}</b><button type="button" class="hudbtn" onclick="${fn}('${k}',1)" aria-label="${L.n} suivant">▶</button></div>`; };
  return `<div class="look"><div class="look-prev">${avatarSvg(look,88)}</div><div>${Object.keys(LOOKS).map(row).join("")}</div></div>`;
}
const cycle = (look,k,d)=>{ const n = LOOKS[k].v.length; look[k] = (look[k]+d+n)%n; };
// pendant la création
function draftLook(k,d){ draft.name = $("#nm").value; cycle(draft.look,k,d); draft.keep = true; createStep(0); }
// depuis « Ma vie »
function myLook(k,d){ cycle(p.look,k,d); try{ localStorage.setItem("trajectoire_look",JSON.stringify(p.look)); }catch(e){} save(); document.querySelector(".overlay")?.remove(); vieScreen(); }
