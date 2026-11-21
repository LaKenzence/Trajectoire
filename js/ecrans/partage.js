// Trajectoire · Le partage : la carte de fin de carrière en format story (1080 × 1920) et le film de carrière en vidéo
// courte (canvas + MediaRecorder, sans dépendance). Les deux reprennent les données de la carrière ; la vidéo relit les
// images du film (careerFilmFrames) et les anime une à une.

const SW = 1080, SH = 1920;
const SD = "'Barlow Condensed','Arial Narrow',sans-serif", SB = "system-ui,'Segoe UI',sans-serif";
const slug = s=>String(s).toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
// enregistre un fichier : par la capacité de téléchargement si elle existe, sinon par un lien classique
async function saveBlob(blob,fn,btn,okLabel){
  const dl = window.claude?.use?await window.claude.use("downloads").catch(()=>null):null;
  if(dl){ try{ await dl.save({filename:fn,data:blob}); if(btn) btn.textContent = okLabel; return true; }catch(e){ if(e?.code==="declined"){ if(btn) btn.textContent = "Téléchargement annulé"; return false; } } }
  try{ const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); if(btn) btn.textContent = okLabel; return true; }
  catch(e){ return false; }
}
// texte sur plusieurs lignes, centré, renvoie le bas du bloc
function wrapText(g,txt,x,y,maxW,lh){
  const words = String(txt).split(/\s+/), lines = []; let cur = "";
  for(const w of words){ const t = cur?cur+" "+w:w; if(g.measureText(t).width>maxW&&cur){ lines.push(cur); cur = w; } else cur = t; }
  if(cur) lines.push(cur);
  lines.forEach((l,i)=>g.fillText(l,x,y+i*lh));
  return y+lines.length*lh;
}
function storyBg(g,k){
  const gr = g.createLinearGradient(0,0,0,SH); gr.addColorStop(0,"#070a20"); gr.addColorStop(.45,"#141a4a"); gr.addColorStop(1,"#070a20");
  g.fillStyle = gr; g.fillRect(0,0,SW,SH);
  // halo aux couleurs du club, et les projecteurs
  const h = g.createRadialGradient(SW/2,640,40,SW/2,640,900); h.addColorStop(0,k.a); h.addColorStop(1,"rgba(0,0,0,0)");
  g.globalAlpha = .55; g.fillStyle = h; g.fillRect(0,0,SW,SH); g.globalAlpha = 1;
  for(const x of [140,SW-140]){ const s = g.createRadialGradient(x,90,0,x,90,420); s.addColorStop(0,"rgba(255,248,220,.35)"); s.addColorStop(1,"rgba(255,248,220,0)"); g.fillStyle = s; g.fillRect(0,0,SW,700); }
}
async function drawStory(){
  const cv = document.createElement("canvas"); cv.width = SW; cv.height = SH;
  const g = cv.getContext("2d"), t = careerTotals(), s = careerSummary(), k = clubColors(p.club), gr = careerGrade();
  try{ await document.fonts.load(`800 80px ${SD}`); }catch(e){}
  storyBg(g,k);
  g.textAlign = "center"; g.fillStyle = "#f7c548"; g.font = `800 italic 64px ${SD}`; g.fillText("TRAJECTOIRE",SW/2,150);
  const av = await svgImage(avatarSvg(p.look||lookFromName(p.name),360,k.a)); if(av) g.drawImage(av,SW/2-180,230,360,360);
  g.fillStyle = "#fff"; let fs = 120; g.font = `800 ${fs}px ${SD}`;
  while(g.measureText(p.name.toUpperCase()).width>SW-120&&fs>60){ fs -= 4; g.font = `800 ${fs}px ${SD}`; }
  g.fillText(p.name.toUpperCase(),SW/2,720);
  g.font = `600 38px ${SB}`; g.fillStyle = "rgba(255,255,255,.75)"; g.fillText(`${POS[p.pos].n} · ${COUNTRIES[p.country].name} · ${p.seasons.length} saisons`,SW/2,785);
  const title = careerTitles()[0];
  if(title){ g.fillStyle = "#f7c548"; g.font = `800 italic 72px ${SD}`; wrapText(g,`« ${title.n} »`,SW/2,890,SW-140,80); }
  g.fillStyle = "rgba(255,255,255,.9)"; g.font = `700 44px ${SD}`; g.fillText(`${gr.label.toUpperCase()} · ${gr.v}/100`,SW/2,1010);
  // les chiffres, en grille
  const cells = [["Matchs",t.apps],[p.pos==="GB"?"Clean sheets":"Buts",p.pos==="GB"?t.cs:t.g],["Trophées",s.trophies],["Ballons d'Étoile",s.stars],["Sélections",p.caps],["Niveau max",s.peak]];
  cells.forEach(([lab,v],i)=>{
    const x = 120+(i%3)*(SW-240)/3, y = 1080+Math.floor(i/3)*210, w = (SW-240)/3-24;
    g.fillStyle = "rgba(255,255,255,.07)"; roundRect(g,x,y,w,180,26); g.fill();
    g.fillStyle = "#fff"; g.font = `800 88px ${SD}`; g.fillText(String(v),x+w/2,y+105);
    g.fillStyle = "rgba(255,255,255,.65)"; g.font = `600 28px ${SB}`; g.fillText(lab,x+w/2,y+150);
  });
  // les plus beaux trophées et le parcours
  const grouped = {}; p.trophies.forEach(x=>{ const n = x.t.replace(/ \d{4}$/,""); grouped[n] = (grouped[n]||0)+1; });
  const best = Object.entries(grouped).sort((a,b)=>b[1]-a[1]).slice(0,4);
  g.font = `600 36px ${SB}`; g.fillStyle = "#fff";
  let y = 1560;
  if(best.length) for(const [n,c] of best){ g.fillText(`🏆 ${c>1?c+"× ":""}${n}`,SW/2,y); y += 52; }
  else { g.fillStyle = "rgba(255,255,255,.7)"; g.fillText("Une carrière sans trophée, mais pas sans histoire.",SW/2,y); y += 52; }
  g.fillStyle = "rgba(255,255,255,.6)"; g.font = `500 30px ${SB}`;
  wrapText(g,p.clubsHist.join(" → "),SW/2,Math.max(y+20,1790),SW-160,38);
  return cv;
}
async function exportStory(btn){
  const label = btn.textContent; btn.textContent = "Préparation de l'image…";
  try{
    const cv = await drawStory(), blob = await new Promise(r=>cv.toBlob(r,"image/png"));
    if(!blob||!(await saveBlob(blob,`trajectoire-story-${slug(p.name)}.png`,btn,"✅ Image enregistrée"))){ btn.textContent = label; showImage(cv.toDataURL("image/png")); }
  }catch(e){ btn.textContent = label; }
}

/* ============ Le film en vidéo ============ */
const filmMime = ()=>typeof MediaRecorder==="undefined"?null:["video/mp4;codecs=avc1","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"].find(m=>MediaRecorder.isTypeSupported(m))||null;
const filmVideoOk = ()=>typeof document!=="undefined"&&!!document.createElement("canvas").captureStream&&!!filmMime();
// les images du film, lues dans le HTML : l'âge, la phrase, et la réplique s'il y en a une
function filmScenes(){
  const doc = new DOMParser().parseFromString(`<div>${careerFilmFrames().join("")}</div>`,"text/html");
  return [...doc.querySelectorAll(".cf-frame")].map(f=>({age:f.querySelector(".cf-age")?.textContent||"",title:f.querySelector(".cf-endt")?.textContent||"",
    text:f.querySelector(".cf-ft")?.textContent||"",who:f.querySelector(".cf-say b")?.childNodes[0]?.textContent||"",quote:f.querySelector(".cf-say p")?.textContent||""}));
}
function drawScene(g,sc,u,k){
  storyBg(g,k);
  const a = Math.min(1,u*4,(1-u)*5), z = 1+u*.04;
  g.save(); g.globalAlpha = Math.max(0,a); g.translate(SW/2,SH/2); g.scale(z,z); g.translate(-SW/2,-SH/2);
  g.textAlign = "center"; g.fillStyle = "#f7c548"; g.font = `800 italic 52px ${SD}`; g.fillText("TRAJECTOIRE",SW/2,170);
  g.fillStyle = "rgba(255,255,255,.7)"; g.font = `700 64px ${SD}`; g.fillText(sc.age.toUpperCase(),SW/2,720);
  g.fillStyle = "#fff";
  let y = 830;
  if(sc.title){ g.fillStyle = "#f7c548"; g.font = `800 italic 104px ${SD}`; y = wrapText(g,sc.title,SW/2,y+40,SW-140,110); g.fillStyle = "#fff"; }
  if(sc.text){ g.font = `600 58px ${SB}`; y = wrapText(g,sc.text,SW/2,y+40,SW-160,76); }
  if(sc.quote){ g.font = `italic 500 46px ${SB}`; g.fillStyle = "rgba(255,255,255,.88)"; y = wrapText(g,sc.quote,SW/2,y+70,SW-200,62);
    g.fillStyle = "#f7c548"; g.font = `700 40px ${SD}`; g.fillText(`— ${sc.who}`,SW/2,y+30); }
  g.restore();
}
async function exportFilm(btn){
  const mime = filmMime(); if(!mime) return;
  const label = btn.textContent, scenes = filmScenes(), k = clubColors(p.club), per = 3200;
  const cv = document.createElement("canvas"); cv.width = SW; cv.height = SH;
  const g = cv.getContext("2d"), stream = cv.captureStream(30), rec = new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4e6}), chunks = [];
  try{ await document.fonts.load(`800 80px ${SD}`); }catch(e){}
  rec.ondataavailable = e=>{ if(e.data.size) chunks.push(e.data); };
  const done = new Promise(r=>rec.onstop = r);
  rec.start(500);
  const total = scenes.length*per, t0 = performance.now();
  await new Promise(res=>{
    const tick = ()=>{
      const t = performance.now()-t0;
      if(t>=total){ res(); return; }
      const i = Math.floor(t/per); drawScene(g,scenes[i],(t%per)/per,k);
      btn.textContent = `Enregistrement… ${Math.round(t/total*100)} %`;
      // setTimeout plutôt que requestAnimationFrame : la vidéo continue même si l'onglet passe en arrière-plan
      setTimeout(tick,1000/30);
    };
    tick();
  });
  rec.stop(); await done;
  const blob = new Blob(chunks,{type:mime.split(";")[0]}), ext = mime.includes("mp4")?"mp4":"webm";
  if(!(await saveBlob(blob,`trajectoire-film-${slug(p.name)}.${ext}`,btn,"✅ Vidéo enregistrée"))) btn.textContent = label;
}
