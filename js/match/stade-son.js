// Trajectoire · Le son du stade, synthétisé (aucun fichier audio) mais travaillé pour sonner comme une vraie tribune :
// - un fond de foule en stéréo : des bruits filtrés sur les formants de la voix, qui respirent chacun à leur rythme ;
// - une réverbération de stade (réponse impulsionnelle calculée) ;
// - des chants à plusieurs dizaines de voix légèrement désaccordées, avec des claquements de mains ;
// - une montée sur les occasions, une explosion sur les buts, un silence tendu avant un penalty.
// Remplace ambient(), crowdSwell(), crowdHush() et SFX.chant d'ambiance.js ; le chant choisi vient de la panoplie.

const STADE = {bus:null,verb:null,bed:null};
// le bus du stade : tout passe par une réverbération et un compresseur doux
function stadeBus(){
  const a = ac(); if(!a) return null;
  if(STADE.bus&&STADE.bus.context===a) return STADE.bus;
  const out = a.createDynamicsCompressor(); out.threshold.value = -18; out.ratio.value = 3; out.connect(a.destination);
  const dry = a.createGain(); dry.gain.value = .75; dry.connect(out);
  const verb = a.createConvolver(), wet = a.createGain(); wet.gain.value = .5;
  // réponse impulsionnelle : 2,6 s de bruit stéréo qui décroît, plus sourd avec le temps (l'air du stade)
  const len = Math.floor(a.sampleRate*2.6), ir = a.createBuffer(2,len,a.sampleRate);
  for(let c=0;c<2;c++){ const d = ir.getChannelData(c); let lp = 0;
    for(let i=0;i<len;i++){ const t = i/len, k = .04+.5*t; lp += ((Math.random()*2-1)-lp)*(1-k); d[i] = lp*Math.pow(1-t,2.4)*(i<a.sampleRate*.012?0:1); } }
  verb.buffer = ir; verb.connect(wet).connect(out);
  const bus = a.createGain(); bus.connect(dry); bus.connect(verb);
  STADE.bus = bus; return bus;
}
// un bruit rose (plus naturel que le bruit blanc pour une foule), en boucle
function pinkBuffer(a,secs){
  const len = Math.floor(a.sampleRate*secs), buf = a.createBuffer(2,len,a.sampleRate);
  for(let c=0;c<2;c++){ const d = buf.getChannelData(c); let b0 = 0,b1 = 0,b2 = 0;
    for(let i=0;i<len;i++){ const w = Math.random()*2-1; b0 = .99765*b0+w*.099; b1 = .963*b1+w*.2965; b2 = .57*b2+w*1.0526; d[i] = (b0+b1+b2+w*.1848)*.11; } }
  return buf;
}
// le fond de foule : trois couches de « voix » (graves, médiums, aigus) modulées lentement et indépendamment
function ambient(on){
  if(!on||!soundOn){
    const b = STADE.bed; STADE.bed = null;
    if(b) clearInterval(b.timer);
    if(b&&AC){ try{ b.master.gain.setTargetAtTime(0,AC.currentTime,.4); setTimeout(()=>{ b.srcs.forEach(s=>{ try{ s.stop(); }catch(e){} }); },1800); }catch(e){} }
    return;
  }
  if(STADE.bed) return;
  const a = ac(), bus = stadeBus(); if(!a||!bus) return;
  const master = a.createGain(); master.gain.value = 0; master.gain.setTargetAtTime(.5,a.currentTime,1.2); master.connect(bus);
  const shelf = a.createBiquadFilter(); shelf.type = "highshelf"; shelf.frequency.value = 1800; shelf.gain.value = 0; shelf.connect(master);
  const srcs = [], buf = pinkBuffer(a,6);
  for(const [f,q,v,rate] of [[320,1.1,.9,.07],[780,1.4,.7,.11],[2400,1.8,.35,.17],[150,.7,.5,.05]]){
    const s = a.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = Math.random()*2; s.playbackRate.value = .9+Math.random()*.2;
    const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q;
    const g = a.createGain(); g.gain.value = v;
    // la respiration de la foule : une onde lente sur le volume de chaque couche
    const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = rate; lg.gain.value = v*.35; lfo.connect(lg).connect(g.gain); lfo.start();
    s.connect(bp).connect(g).connect(shelf); s.start(0,Math.random()*5); srcs.push(s,lfo);
  }
  STADE.bed = {master,tone:shelf,srcs,base:.5,timer:0};
  // de temps en temps, un chant monte d'une tribune
  STADE.bed.timer = setInterval(()=>{ if(STADE.bed&&soundOn&&Math.random()<.35) stadeChant(.55); },9000);
}
function bedTo(v,t0,tc){ const b = STADE.bed; if(!b||!AC) return; const g = b.master.gain, t = AC.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.setTargetAtTime(v,t+(t0||0),tc||.3); }
// une occasion : la foule se lève, le son s'éclaircit (les « ooooh »), puis retombe
function crowdSwell(){
  const b = STADE.bed; if(!b||!AC) return;
  const t = AC.currentTime, g = b.master.gain;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(1.25,t+.35); g.setTargetAtTime(b.base,t+1.6,1);
  b.tone.gain.cancelScheduledValues(t); b.tone.gain.setValueAtTime(0,t); b.tone.gain.linearRampToValueAtTime(7,t+.3); b.tone.gain.setTargetAtTime(0,t+1.4,.8);
}
// un penalty, un coup franc : tout le stade retient son souffle
function crowdHush(on){ bedTo(on?.06:STADE.bed?STADE.bed.base:.5,0,on?.35:.9); }
// l'explosion d'un but : un rugissement qui monte, des milliers de cris, puis le chant
function stadeRoar(vol){
  const a = ac(), bus = stadeBus(); if(!a||!bus) return;
  const t = a.currentTime, s = a.createBufferSource(); s.buffer = pinkBuffer(a,4);
  const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = .7; bp.frequency.setValueAtTime(400,t); bp.frequency.exponentialRampToValueAtTime(1300,t+.5); bp.frequency.exponentialRampToValueAtTime(700,t+3.5);
  const g = a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(3*(vol||1),t+.25); g.gain.setTargetAtTime(.0001,t+1.6,.9);
  s.connect(bp).connect(g).connect(bus); s.start(t); s.stop(t+4);
  // des cris isolés par-dessus : de courtes voyelles chantées qui montent
  for(let i=0;i<14;i++) voice(a,bus,t+Math.random()*.6,.5+Math.random()*.7,180+Math.random()*260,1.3+Math.random()*.5,.05,["a","o","e"][i%3]);
  bedTo(1,0,.2); setTimeout(()=>bedTo(STADE.bed?STADE.bed.base:.5,0,1.2),2600);
}
// une voix chantée : une dent de scie passée par deux formants de voyelle
const VOWELS = {a:[730,1090],o:[570,840],e:[530,1840],u:[300,870]};
function voice(a,bus,t,dur,f0,glide,vol,vw){
  const o = a.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f0,t); if(glide) o.frequency.exponentialRampToValueAtTime(f0*glide,t+dur*.8);
  o.detune.value = (Math.random()-.5)*40;
  const [f1,f2] = VOWELS[vw]||VOWELS.a, b1 = a.createBiquadFilter(), b2 = a.createBiquadFilter(), g = a.createGain();
  b1.type = b2.type = "bandpass"; b1.frequency.value = f1; b2.frequency.value = f2; b1.Q.value = 6; b2.Q.value = 8;
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.05+Math.random()*.06); g.gain.setTargetAtTime(.0001,t+dur*.85,.08);
  o.connect(b1).connect(g); o.connect(b2).connect(g); g.connect(bus); o.start(t); o.stop(t+dur+.4);
}
// des claquements de mains : des milliers de petites rafales de bruit
function claps(a,bus,t,vol){
  const len = Math.floor(a.sampleRate*.12), buf = a.createBuffer(1,len,a.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2-1)*Math.exp(-i/(a.sampleRate*.018))*(.6+.4*Math.random());
  for(let k=0;k<6;k++){ const s = a.createBufferSource(); s.buffer = buf; s.playbackRate.value = .8+Math.random()*.5;
    const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1400+Math.random()*900; f.Q.value = 1.2;
    const g = a.createGain(); g.gain.value = vol*(.6+Math.random()*.5); s.connect(f).connect(g).connect(bus); s.start(t+Math.random()*.035); }
}
// les chants : notes (demi-tons au-dessus de la tonique), durées en temps, voyelle ; « x » = claquement de mains
const CHANTS = {
  allez:{bpm:150,n:[[0,1,"a"],[-3,1,"e"],[0,1,"a"],[-3,1,"e"],[2,1,"a"],[0,1,"e"],["x",.5],["x",.5],["x",1]]},
  ole:{bpm:120,n:[[0,.5,"o"],[4,1.5,"e"],[2,.5,"o"],[5,1.5,"e"],[4,.5,"o"],[7,1,"e"],[5,.5,"o"],[4,2,"e"]]},
  nom:{bpm:132,n:[[0,1,"a"],[-5,1.5,"o"],["x",.5],["x",.5],["x",.5],[0,1,"a"],[-5,1.5,"o"],["x",.5],["x",.5],["x",.5]]},
  hymne:{bpm:84,n:[[0,1,"o"],[4,1,"o"],[7,2,"a"],[5,1,"o"],[4,1,"o"],[2,2,"u"],[0,3,"o"]]}
};
function stadeChant(vol){
  const a = ac(), bus = stadeBus(); if(!a||!bus||!soundOn) return;
  const id = typeof gear==="function"?gear().chant.id:"allez", C = CHANTS[id]||CHANTS.allez;
  const h = p&&p.club?hashStr(p.club.name):0, root = 165*Math.pow(2,(h%5)/12), beat = 60/C.bpm;
  let t = a.currentTime+.15;
  for(const [n,d,vw] of C.n){
    if(n==="x") claps(a,bus,t,.35*vol);
    else for(let v=0;v<16;v++){ const oct = v%4===0?2:1; voice(a,bus,t+Math.random()*.07,d*beat*.95,root*oct*Math.pow(2,n/12),0,.022*vol,vw); }
    t += d*beat;
  }
}
SFX.chant = ()=>{ stadeChant(1); };
// le but : la fanfare d'origine, plus la tribune qui explose
const _goalSfx = SFX.goal;
SFX.goal = ()=>{ _goalSfx(); stadeRoar(1); };
