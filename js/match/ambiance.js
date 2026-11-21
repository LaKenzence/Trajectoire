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
// la foule, ses chants et ses silences : voir stade-son.js
