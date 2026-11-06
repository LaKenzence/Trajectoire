// Trajectoire · Ambiance de match : foule continue, météo, voix du commentateur
const WEATHER = ["Nuit claire","Pluie battante","Brouillard léger","Grand soleil","Vent glacial","Neige"];

/* ============ Voix du commentateur (synthèse vocale du navigateur) ============ */
let voiceOn = (()=>{ try{ return localStorage.getItem("trajectoire_voice")==="1"; }catch(e){ return false; } })();
function speak(t){
  if(!voiceOn||!window.speechSynthesis||!t) return;
  try{
    const clean = String(t).replace(/<[^>]+>/g,"").replace(/[^\p{L}\p{N}\s'’,.!?:-]/gu,"").replace(/\s+/g," ").trim();
    if(!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "fr-FR"; u.rate = 1.08;
    const v = speechSynthesis.getVoices().find(v=>v.lang&&v.lang.toLowerCase().startsWith("fr"));
    if(v) u.voice = v;
    if(speechSynthesis.pending) speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }catch(e){}
}
function toggleVoice(btn){
  voiceOn = !voiceOn;
  try{ localStorage.setItem("trajectoire_voice",voiceOn?"1":"0"); }catch(e){}
  if(btn){ btn.setAttribute("aria-pressed",String(voiceOn)); btn.classList.toggle("on",voiceOn); }
  if(voiceOn) speak("Commentaires activés."); else try{ speechSynthesis.cancel(); }catch(e){}
}
const lastGoalLine = m=>(m.log.slice().reverse().find(l=>/But/.test(l))||"But !").replace(/^\S+\s+/,"");

/* ============ Foule continue pendant le match clé ============ */
let crowdNode = null;
function ambient(on){
  if(!on||!soundOn){
    if(crowdNode&&AC){
      const n = crowdNode; crowdNode = null;
      try{ n.g.gain.setTargetAtTime(0,AC.currentTime,.35); setTimeout(()=>{ try{ n.src.stop(); }catch(e){} },1500); }catch(e){}
    }
    return;
  }
  if(crowdNode) return;
  const a = ac(); if(!a) return;
  const len = a.sampleRate*4, buf = a.createBuffer(1,len,a.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2-1)*(.65+.35*Math.sin(i/a.sampleRate*Math.PI*.5));
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 650; f.Q.value = .5;
  const g = a.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(.045,a.currentTime,.8);
  src.connect(f).connect(g).connect(a.destination); src.start();
  crowdNode = {src,g};
}
function crowdSwell(){
  if(!crowdNode||!AC) return;
  const g = crowdNode.g.gain, t = AC.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value,t);
  g.linearRampToValueAtTime(.16,t+.3); g.setTargetAtTime(.045,t+1.4,.9);
}

/* ============ Météo sur le mini-terrain ============ */
function weatherFx(m){
  const w = m.weather||"";
  if(/Brouillard/.test(w)) return `<rect width="100" height="60" fill="rgba(220,230,240,.22)"/>`;
  if(!/Pluie|Neige/.test(w)) return "";
  const snow = /Neige/.test(w);
  return `<g class="wx" aria-hidden="true">${Array.from({length:40},(_,i)=>{ const x = (i*37)%100, y = (i*23)%60, dur = snow?6+(i%4):1.1+(i%3)*.2;
    return snow?`<circle cx="${x}" cy="${y}" r=".5" fill="rgba(255,255,255,.85)"><animate attributeName="cy" from="${y-60}" to="${y+60}" dur="${dur}s" repeatCount="indefinite"/></circle>`
      :`<line x1="${x}" y1="${y}" x2="${x-1}" y2="${y+3}" stroke="rgba(200,220,255,.45)" stroke-width=".3"><animate attributeName="y1" from="${y-60}" to="${y+60}" dur="${dur}s" repeatCount="indefinite"/><animate attributeName="y2" from="${y-57}" to="${y+63}" dur="${dur}s" repeatCount="indefinite"/></line>`; }).join("")}</g>`;
}

/* ============ Sons d'ambiance supplémentaires (synthétisés) ============ */
// sifflets du public : un bruit grave et filtré qui retombe
SFX.boo = ()=>{ const a = ac(); if(!a) return;
  const n = a.createBufferSource(), len = a.sampleRate*1.6, buf = a.createBuffer(1,len,a.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2-1)*Math.min(1,i/(a.sampleRate*.2))*(1-i/len);
  const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(420,a.currentTime); f.frequency.linearRampToValueAtTime(240,a.currentTime+1.6);
  const g = a.createGain(); g.gain.value = .35; n.buffer = buf; n.connect(f).connect(g).connect(a.destination); n.start();
  tone(190,1.2,"sawtooth",.025,150); };
// battement de cœur : deux coups sourds
SFX.heart = ()=>{ tone(62,.12,"sine",.22,45); setTimeout(()=>tone(55,.14,"sine",.18,40),150); };
// chant des supporters après un but : quatre notes propres au club, portées par la foule
SFX.chant = ()=>{
  const h = p?hashStr(p.club.name):0, base = [262,294,330,349,392][h%5], seq = [0,4,7,4].map((s,i)=>base*Math.pow(2,((s+(h>>>i)%3)%12)/12));
  crowd(2.4,.32); seq.forEach((f,i)=>setTimeout(()=>{ tone(f,.32,"square",.025); tone(f/2,.32,"triangle",.03); },300+i*340));
};
// la foule retient son souffle (penalties, coups francs) puis reprend
function crowdHush(on){
  if(!crowdNode||!AC) return;
  const g = crowdNode.g.gain, t = AC.currentTime;
  g.cancelScheduledValues(t); g.setTargetAtTime(on?.008:.045,t,on?.3:.8);
}
