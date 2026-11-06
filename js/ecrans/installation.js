// Trajectoire · Installation sur téléphone (version web, avec manifeste) : hors connexion et bouton « Installer l'appli »
// Ne fait rien sur claude.ai : seule la page construite par tools/build.js déclare un manifeste.
/** @type {null|(()=>void)} */
let installApp = null;
(()=>{
  if(typeof document==="undefined"||!document.querySelector?.('link[rel="manifest"]')) return;
  if("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
  const standalone = matchMedia("(display-mode: standalone)").matches||/** @type {any} */ (navigator).standalone;
  if(standalone) return;
  // l'accueil se redessine pour montrer ou cacher le bouton
  const refresh = ()=>{ if(document.querySelector("#app .home")) home(); };
  if(/iphone|ipad|ipod/i.test(navigator.userAgent)) installApp = ()=>openOverlay(`<div class="sheet" role="document"><h2>Installer Trajectoire</h2>
    <ol class="story"><li>Touche le bouton <b>Partager</b> de Safari (le carré avec une flèche vers le haut).</li><li>Choisis <b>Sur l'écran d'accueil</b>.</li><li>Touche <b>Ajouter</b> : Trajectoire s'ouvre comme une appli, même sans connexion.</li></ol>
    <button class="btn primary" onclick="closeOverlay(this.closest('.overlay'))">Compris</button></div>`,"Installer Trajectoire");
  addEventListener("beforeinstallprompt",e=>{
    e.preventDefault();
    const ev = /** @type {any} */ (e);
    installApp = ()=>{ ev.prompt(); ev.userChoice.then(()=>{ installApp = null; refresh(); }); };
    refresh();
  });
  addEventListener("appinstalled",()=>{ installApp = null; refresh(); });
})();
