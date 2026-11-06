// Trajectoire · Avatar du joueur : teint, coiffure, couleur de cheveux, barbe. Dessiné en SVG, sans image.
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

function avatarSvg(look,size,shirtColor){
  const l = look||{skin:2,hair:1,hairC:0,beard:0}, s = lookSkin(l), h = lookHair(l), sz = size||48;
  const hair = [
    "",
    `<path d="M14 21c0-9 5-14 12-14s12 5 12 14c-2-4-6-6-12-6s-10 2-12 6z" fill="${h}"/>`,
    [16,21,26,31,36].map((x,i)=>`<circle cx="${x}" cy="${12+(i%2)*2}" r="5" fill="${h}"/>`).join("")+`<circle cx="14" cy="18" r="4" fill="${h}"/><circle cx="38" cy="18" r="4" fill="${h}"/>`,
    `<path d="M13 23c0-10 5-16 13-16s13 6 13 16v14h-4V22c-2-4-5-6-9-6s-7 2-9 6v15h-4z" fill="${h}"/>`,
    `<path d="M22 6h8l1 12h-10z" fill="${h}"/>`,
    `<path d="M14 20c0-8 5-13 12-13s12 5 12 13" fill="${h}"/>`+[15,20,32,37].map(x=>`<rect x="${x-1.5}" y="18" width="3" height="18" rx="1.5" fill="${h}"/>`).join("")
  ][l.hair]||"";
  const beard = l.beard===1?`<path d="M17 30c2 5 5 7 9 7s7-2 9-7c-2 2-5 3-9 3s-7-1-9-3z" fill="${h}" opacity=".75"/>`
    : l.beard===2?`<path d="M15 26c0 8 5 13 11 13s11-5 11-13c-2 3-6 4-11 4s-9-1-11-4z" fill="${h}"/>`:"";
  return `<svg class="avatar-svg" width="${sz}" height="${sz}" viewBox="0 0 52 52" aria-hidden="true">
    <path d="M6 52c2-9 10-13 20-13s18 4 20 13z" fill="${shirtColor||"#2f6b4c"}"/>
    <rect x="22" y="33" width="8" height="7" fill="${s}"/>
    <ellipse cx="26" cy="24" rx="11" ry="13" fill="${s}"/>
    ${hair}${beard}
    <circle cx="21.5" cy="24" r="1.4" fill="#1b1b1b"/><circle cx="30.5" cy="24" r="1.4" fill="#1b1b1b"/>
    <path d="M22 30.5q4 3 8 0" stroke="#5a2e22" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`;
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
