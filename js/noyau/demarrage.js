// Trajectoire · Raccourcis clavier et lancement du jeu (chargé en dernier)
/* ============ Raccourcis clavier ============ */
document.addEventListener("keydown",e=>{
  const target = /** @type {HTMLElement} */ (e.target);
  if(target.tagName==="INPUT"||target.tagName==="TEXTAREA"||e.ctrlKey||e.metaKey||e.altKey) return;
  const ov = document.querySelector(".overlay");
  if(ov){
    if(e.key==="Escape") closeOverlay(ov);
    // un appel urgent se répond au clavier, comme les événements
    else if(/^[1-9]$/.test(e.key)&&ov.querySelector(".urgent")){
      const b = /** @type {HTMLElement} */ (ov.querySelectorAll(".btn")[+e.key-1]);
      if(b){ b.click(); e.preventDefault(); }
    }
    return;
  }
  if(/^[1-9]$/.test(e.key)){
    const t = /** @type {HTMLElement[]} */ ([...document.querySelectorAll("#app .btn")]).filter(x=>x.querySelector("kbd"))[+e.key-1];
    if(t){ t.click(); e.preventDefault(); }
  } else if(e.key==="Enter"&&!(document.activeElement instanceof HTMLButtonElement)){
    const b = /** @type {HTMLElement} */ (document.querySelector("#app .btn.primary"));
    if(b){ b.click(); e.preventDefault(); }
  }
});

home();
