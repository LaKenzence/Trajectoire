// Tests de bout en bout : des carrières entières jouées par un bot dans le moteur sans navigateur.
// Lancer : npm test
const test = require("node:test");
const assert = require("node:assert");
const { createGame } = require("../tools/moteur");
const { simulate, playCareer } = require("../tools/simulateur");

const report = issues => issues.map(i => `[graine ${i.seed}] ${i.kind} : ${i.detail}`).join("\n");

test("les scripts du jeu se chargent et affichent l'accueil", () => {
  const g = createGame();
  assert.match(g.lastRender(), /Trajectoire/);
});

test("60 carrières complètes : aucun plantage, aucun affichage cassé, jauges dans leurs bornes", () => {
  const results = simulate(60);
  const issues = results.flatMap(r => r.issues);
  assert.strictEqual(issues.length, 0, report(issues));
  for (const r of results) assert.ok(r.stats && r.stats.seasons >= 1, `graine ${r.seed} : carrière vide`);
});

test("chaque défi de départ se joue jusqu'au bout", () => {
  const g = createGame();
  const defis = g.run("typeof DEFIS!=='undefined'?Object.keys(DEFIS):[]");
  assert.ok(defis.length >= 3, "au moins trois défis de départ");
  for (const defi of defis)
    for (let s = 0; s < 4; s++) {
      const r = playCareer(1000 + s * 7, { defi });
      assert.strictEqual(r.issues.length, 0, `${defi} : ${report(r.issues)}`);
      assert.strictEqual(r.stats.defi, defi);
    }
});

test("les tournois internationaux se jouent l'été, de la phase de groupes à la finale", () => {
  const results = simulate(40, { seed0: 300 });
  const played = results.reduce((a, r) => a + (r.stats?.tourneys || 0), 0);
  assert.ok(played >= 10, `seulement ${played} tournoi(s) joué(s) sur 40 carrières`);
  // un tournoi forcé : on doit pouvoir aller au bout et revenir à l'intersaison
  const g = createGame({ seed: 11 });
  g.run(`newPlayer({name:"Sel Test",country:"BR",pos:"ATT",trait:"tech",origin:"quartier",ent:"ami",life:"pro"});
    p.lvl = 85; p.tourney = newTourney("Championnat du Monde", p.year+1); p.phase = "season"; p.last = {}; startTourney(); tourneyAuto();`);
  assert.strictEqual(g.run("p.tourney.done"), true);
  assert.match(g.lastRender(), /Passer à l'intersaison/);
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
});

test("la conférence de presse pose des questions complètes, y compris sur une déclaration passée", () => {
  const g = createGame({ seed: 21 });
  g.run(`newPlayer({name:"Conf Test",country:"IT",pos:"MIL",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); p.confLast = {t:"Qu'il vienne me le dire en face.",y:p.year-1};`);
  for (const res of ["w", "d", "l"]) {
    const qs = g.run(`JSON.stringify(confQuestions({title:"Derby",score:"1-1",res:"${res}",myG:1,myA:0,tab:"",mr:"7.0"}))`);
    assert.doesNotMatch(qs, /undefined|NaN/);
    assert.strictEqual(JSON.parse(qs).length, 3);
  }
});

test("le défi du jour donne le même départ à tout le monde", () => {
  const start = seed => {
    const g = createGame({ seed });
    g.run("startDaily(); if(p.phase==='goal'){ p.goalOpts = p.goalOpts||goalOptions(); setGoal(0); } eventScreen();");
    return g.run("JSON.stringify({name:p.name,pos:p.pos,club:p.club.name,lvl:p.lvl,pot:p.pot,ev:p.curEv})");
  };
  assert.strictEqual(start(1), start(99));
});

test("une sauvegarde de l'ancienne version se reprend et se met à niveau", () => {
  const g = createGame({ seed: 9 });
  g.run(`newPlayer({name:"Ancien Format",country:"ES",pos:"DEF",trait:"lead",origin:"fils",ent:"ami",life:"fete"});
    delete p.agent; delete p.vie; delete p.pens; delete p.defi; p.flags.agent = true; p.flags.couple = true; save(); p = null; resume(slot);`);
  assert.strictEqual(g.run("JSON.stringify([p.agent, p.vie.couple, p.vie.kids, typeof p.pens.tir])"), JSON.stringify(["requin", "relation", 0, "number"]));
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
});

test("l'export de sauvegarde se réimporte à l'identique", () => {
  const g = createGame({ seed: 5 });
  g.run(`newPlayer({name:"Export Test",country:"FR",pos:"MIL",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); save();`);
  const code = g.run("exportCode()");
  const before = g.run("localStorage.getItem(slotKey(slot))");
  g.run("for(const k of saveKeys()) localStorage.removeItem(k)");
  assert.strictEqual(g.run("localStorage.getItem(slotKey(slot))"), null);
  const res = g.run(`importCode(${JSON.stringify(code)})`);
  assert.ok(res.ok, res.error);
  assert.strictEqual(g.run("localStorage.getItem(slotKey(slot))"), before);
  assert.strictEqual(g.run(`importCode("pas un code").ok`), false);
});

test("le défi entre amis : un même code donne le même départ, et un code invalide est refusé", () => {
  const start = seed => {
    const g = createGame({ seed });
    g.run(`friendStart("K7P2QX"); if(p.phase==='goal'){ p.goalOpts = p.goalOpts||goalOptions(); setGoal(0); } eventScreen();`);
    return g.run("JSON.stringify({name:p.name,pos:p.pos,club:p.club.name,lvl:p.lvl,pot:p.pot,ev:p.curEv,look:p.look,friend:p.friend})");
  };
  assert.strictEqual(start(3), start(77));
  const g = createGame();
  assert.strictEqual(g.run(`FRIEND_RE.test("AMI-K7P2QX")`), true);
  assert.strictEqual(g.run(`FRIEND_RE.test("AMI-123")`), false);
});

test("l'éditeur de noms renomme un club, garde ses couleurs et met à jour une carrière en cours", () => {
  const g = createGame({ seed: 4 });
  g.run(`newPlayer({name:"Nom Test",country:"FR",pos:"MIL",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); save();`);
  const orig = g.run("p.club.orig||p.club.name"), colors = g.run("JSON.stringify(clubColors(p.club).a)");
  g.run(`localStorage.setItem("trajectoire_noms", JSON.stringify({clubs:{[${JSON.stringify(orig)}]:"Mon Club <b>"},leagues:{}})); p = null;`);
  g.run(`applyNames(); const N = loadNames(); N.clubs[${JSON.stringify(orig)}] = cleanName(N.clubs[${JSON.stringify(orig)}]); localStorage.setItem("trajectoire_noms", JSON.stringify(N)); applyNames(); resume(slot);`);
  assert.strictEqual(g.run("p.club.name"), "Mon Club b");
  assert.strictEqual(g.run("JSON.stringify(clubColors(p.club).a)"), colors);
  g.run("namesScreen()");
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
});

test("le centre d'entraînement s'affiche et les mini-jeux joués sont comptés (jamais les simulations)", () => {
  const g = createGame();
  g.run("trainingScreen()");
  assert.match(g.lastRender(), /Entraînement/);
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
  g.run(`recordMini("dribble", true); recordMini("dribble", false); recordMini("inconnu", true);`);
  assert.strictEqual(g.run("JSON.stringify(loadMiniStats())"), JSON.stringify({ dribble: { n: 2, ok: 1 } }));
});

test("le mercato d'hiver et la rééducation apparaissent au fil des carrières", () => {
  let winter = 0, rehab = 0;
  for (let s = 500; s < 530; s++) {
    const g = createGame({ seed: s });
    g.run(require("fs").readFileSync(require("path").join(__dirname, "..", "tools", "simulateur.js"), "utf8").split("String.raw`")[1].split("`;\n")[0]);
    g.run(`newPlayer({name:"Hiver Test",country:"PT",pos:"ATT",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); route();`);
    for (let i = 0; i < 3000; i++) {
      const st = g.run("__step()");
      if (st === "hiver") winter++;
      if (st === "rééducation") rehab++;
      if (st === "fin") break;
    }
  }
  assert.ok(winter >= 3, `mercato d'hiver vu ${winter} fois`);
  assert.ok(rehab >= 3, `rééducation vue ${rehab} fois`);
});

test("le match clé varie : dialogues entre les actions, contexte du score, actions de chaque poste", () => {
  const g = createGame({ seed: 41 });
  g.run(`newPlayer({name:"Dial Test",country:"FR",pos:"DEF",trait:"lead",origin:"quartier",ent:"ami",life:"pro"}); p.phase = "match"; setupMatch();`);
  for (const pos of ["GB", "DEF", "MIL", "ATT"]) assert.ok(g.run(`p.pos="${pos}"; matchActions().length`) >= 10, `${pos} : trop peu d'actions`);
  g.run(`p.pos="DEF"; p.match.talk = "arbitre"; matchScreen();`);
  assert.match(g.lastRender(), /faute imaginaire/);
  g.run("matchTalk(2)");
  assert.strictEqual(g.run("p.match.talk"), null);
  assert.match(g.lastRender(), /💬/);
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
  // chaque dialogue s'affiche sans trou quelle que soit la situation
  for (const id of g.run("MATCH_TALKS.map(t=>t.id)")) {
    g.run(`p.rival = p.rival||{name:"Riv Al"}; p.rel = p.rel||{}; p.rel.mate = "Momo"; p.protege = p.protege||{name:"Petit Gars",age:20,lvl:70,pot:85,club:p.club.name}; p.match.weather = "pluie"; p.match.talk = "${id}"; matchScreen();`);
    assert.doesNotMatch(g.lastRender(), /undefined|NaN/, id);
  }
});

test("les réseaux : bad buzz avec réponses dans le fil, rumeurs de mercato, adieux en fin de carrière", () => {
  const g = createGame({ seed: 42 });
  g.run(`newPlayer({name:"Soc Test",country:"ES",pos:"ATT",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); p.rep = 50;`);
  // le bad buzz n'est pas systématique : plusieurs mauvais matchs finissent par le déclencher
  g.run(`for(let i=0;i<10&&!phone().feed.some(x=>x.replies);i++) socialAfterMatch({title:"Derby",score:"0-3",res:"l",myG:0,myA:0,tab:"",mr:"5.1"},"derby")`);
  const f = g.run("JSON.stringify(phone().feed.find(x=>x.replies))");
  assert.ok(f, "un message de détracteur auquel répondre");
  g.run(`feedReply(phone().feed.find(x=>x.replies).id,0)`);
  assert.match(g.lastRender(), /En tendance/);
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
  g.run(`phoneRumors([{club:CLUBS[0],years:3,salary:900,loan:false}])`);
  assert.match(g.run("phone().feed[0].txt+phone().feed[1].txt"), /MERCATO|Viens chez nous/);
  g.run(`p.flags.adieu = true; p.retired = "test"; afterScreen();`);
  assert.match(g.lastRender(), /jubilé/i);
  assert.match(g.run("phone().feed.map(x=>x.txt).join(' ')"), /raccroche les crampons/);
});

test("matchs de saison, prolongation des finales et appels urgents", () => {
  const g = createGame({ seed: 51 });
  g.run(`newPlayer({name:"Ord Test",country:"FR",pos:"ATT",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); p.lvl = p.club.str; p.phase = "event"; p.evIdx = 1; startOrdinary(); route();`);
  assert.match(g.lastRender(), /Match de saison/);
  g.run("if(p.match.talk) matchTalk(0); matchPick(0); matchNext();");
  assert.strictEqual(g.run("p.phase"), "event");
  assert.strictEqual(g.run("p.ordinaires.length"), 1);
  // finale à égalité : prolongation avant les tirs au but
  g.run(`ui.quick = true; p.phase = "match"; setupMatch(); p.match.type = "final"; p.match.us = 1; p.match.them = 1; p.match.step = 4; p.match.simDone = false; p.match.extraUsed = true; p.match.mins[4] = 93; p.match.step = 5;
    { const sg = simGap; simGap = ()=>{}; finishMatch(); simGap = sg; }`);
  assert.strictEqual(g.run("p.match.et"), true);
  g.run("ui.quick = false; p.match.talk = 'crampes'; matchScreen();");
  assert.match(g.lastRender(), /crampe/);
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
  // chaque appel urgent s'affiche et se répond
  for (const id of g.run("URGENTS.map(u=>u.id)")) {
    g.run(`p.match = null; p.phase = "offseason"; p.offers = []; p.contract = 2; p.retired = null; p.rival = p.rival||{name:"Riv Al",club:{...CLUBS[0]},retired:false,lvl:80};
      phone().trend = {tag:"#Test",good:false,y:p.year};
      { const u = URGENTS.find(x=>x.id==="${id}"); p.urgent = {id:u.id,d:u.data()}; if(!p.urgent.d.club&&/club|rival/.test(u.id)) p.urgent.d.club = {...CLUBS[0]}; }`);
    g.run("urgentScreen()");
    assert.doesNotMatch(g.lastRender(), /undefined|NaN/, id);
    g.run("urgentAnswer(urgentOpts().length-1)");
    assert.strictEqual(g.run("p.urgent"), null, id);
  }
});

test("le protégé grandit, le live pose ses questions, la frise et les succès suivent", () => {
  const g = createGame({ seed: 52 });
  g.run(`newPlayer({name:"Pro Test",country:"BR",pos:"MIL",trait:"lead",origin:"quartier",ent:"ami",life:"pro"}); p.age = 31; p.rep = 40; applyFx({protege:true,flag:"temoin"});`);
  assert.ok(g.run("!!p.protege.name"));
  const qs = g.run("JSON.stringify(liveQuestions())");
  assert.strictEqual(JSON.parse(qs).length, 3);
  assert.doesNotMatch(qs, /undefined|NaN/);
  g.run(`setTrend({tag:"#ProClash",good:true}); setTrend({tag:"#ProOut",good:false});`);
  assert.strictEqual(g.run("p.flags.clash"), true);
  g.run(`p.seasons = [{y:"2026-27",age:31,club:p.club.name,cc:p.club.country,apps:30,goals:3,assists:5,clean:0,rating:"7.00",rank:3,lvl:p.lvl,tr:0}]; p.retired = "test"; p.after = {k:"calme",n:"Profiter",t:"…"}; endScreen();`);
  assert.match(g.lastRender(), /Tes années sur les réseaux/);
  assert.match(g.lastRender(), /#ProOut/);
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
});

test("compétitions : classement complet, buteurs, tirage de la Coupe des Champions, cérémonie du Ballon d'Étoile", () => {
  const g = createGame({ seed: 61 });
  g.run(`newPlayer({name:"Comp Test",country:"ES",pos:"ATT",trait:"tech",origin:"quartier",ent:"ami",life:"pro"});
    p.club = {...CLUBS.find(c=>c.name==="Real Castelar")}; p.lvl = 88; p.rep = 70;
    p.seasons = [{y:"2025-26",age:20,club:p.club.name,cc:p.club.country,apps:30,goals:20,assists:8,clean:0,rating:"7.40",rank:1,lvl:88,tr:1}];
    startSeason();`);
  assert.strictEqual(g.run("p.phase"), "tirage");
  assert.match(g.lastRender(), /Tirage au sort/);
  assert.strictEqual(g.run("p.cdc.group.length"), 3);
  g.run("tirageDone(); setGoal(0); p.evIdx = 3; p.phase = 'match'; p.tmp.match = null; simSeason(); seasonScreen();");
  // la cérémonie s’ouvre par-dessus le bilan : on lit le bilan lui-même
  const h = g.renders.filter(x=>/Bilan de la saison/.test(x)).at(-1);
  assert.match(h, /Classement/);
  assert.match(h, /Meilleurs buteurs/);
  assert.match(h, /Coupe des Champions/);
  assert.doesNotMatch(h, /undefined|NaN/);
  assert.strictEqual(g.run("p.last.full.length"), 10);
  assert.ok(g.run("p.last.full.every((x,i,a)=>i===0||a[i-1].pts>=x.pts)"), "points décroissants");
  // la cérémonie liste les nommés et le vainqueur
  g.run(`p.last.ballon = {top:[{n:"A B",c:"FR",club:"X",s:1},{n:p.name,c:p.country,club:p.club.name,me:true,s:0},{n:"C D",c:"BR",club:"Y",s:0},{n:"E F",c:"IT",club:"Z",s:0},{n:"G H",c:"EN",club:"W",s:0}],myRank:2,year:2027}; ceremonyOpen();`);
  assert.match(g.lastRender(), /attribué à/);
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
});

test("suites des appels urgents et protégé en adversaire", () => {
  const g = createGame({ seed: 62 });
  g.run(`newPlayer({name:"Suite Test",country:"FR",pos:"MIL",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); p.rep = 40; p.phase = "event";
    p.urgent = {id:"boulette",d:{}}; urgentAnswer(2);`);
  assert.ok(g.run("p.urgentSeeds.some(x=>x.id==='bouletteSuite')"));
  g.run("p.year += 1; maybeUrgent('saison');");
  assert.strictEqual(g.run("p.urgent.id"), "bouletteSuite");
  g.run("urgentScreen();");
  assert.match(g.lastRender(), /vidéo complète/);
  g.run("urgentAnswer(0)");
  // le protégé joue dans un autre club du championnat : il finit par être en face
  g.run(`applyFx({protege:true}); p.protege.club = CLUBS.find(c=>c.country===p.club.country&&c.name!==p.club.name).name; p.protege.age = 20;
    let k = 0; do { p.match = null; p.phase = "event"; p.evIdx = 1; startOrdinary(); } while(!p.match.protege && ++k < 40);`);
  assert.strictEqual(g.run("p.match.protege"), true);
  g.run("route();");
  assert.match(g.lastRender(), /ancien protégé/);
  g.run("if(p.match.talk) matchTalk(0); matchPick(0); matchNext();");
  assert.ok(g.run("!!p.protegeH2H"));
});

test("carnet des histoires : la mémoire passe d'une carrière à l'autre et le carnet s'affiche", () => {
  const results = simulate(6, { seed0: 700 });
  assert.strictEqual(results.flatMap(r => r.issues).length, 0, report(results.flatMap(r => r.issues)));
  const later = results.slice(1).map(r => r.stats.dejaVu);
  assert.ok(later.every(v => v != null && v < .6), `trop de déjà-vu d'une carrière à l'autre : ${later.join(", ")}`);
  const g = createGame({ seed: 5 });
  g.run(`newPlayer({name:"Carnet Test",country:"FR",pos:"GB",trait:"tech",origin:"quartier",ent:"ami",life:"pro"});`);
  // une histoire jamais vécue pèse plus qu'une histoire sortie à la carrière d'avant, sauf au défi du jour
  const w = g.run(`(()=>{ const e = EVENTS.find(x=>x.id==="gbButeur"), n = novelty(e);
    VUS[e.id] = {n:1,t:"x",y:2026,k:careerNo()-1}; const old = novelty(e); p.daily = "2026-01-01"; const d = novelty(e); p.daily = null;
    return [n,old,d]; })()`);
  assert.ok(w[0] > w[1] && w[2] === 1, `poids inattendus : ${w}`);
  g.run("carnetScreen()");
  assert.match(g.lastRender(), /Carnet des histoires/);
  assert.doesNotMatch(g.lastRender().replace(/<[^>]+>/g, " "), /undefined|NaN/);
  assert.match(g.lastRender(), /Un match retour qu.on croyait perdu/);
});

test("chaque emoji du code a son icône (sinon il disparaît à l'affichage et laisse une case vide)", () => {
  const fs = require("fs"), path = require("path");
  const g = createGame();
  const keys = new Set(g.run("Object.keys(EMOJI_IC)"));
  const re = /(?:[\u{1F1E6}-\u{1F1FF}]{2}|\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}]|‍\p{Extended_Pictographic}️?)*)/gu;
  const miss = [];
  const walk = d => fs.readdirSync(d).forEach(f => {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) return walk(p);
    if (!p.endsWith(".js")) return;
    fs.readFileSync(p, "utf8").split("\n").forEach((l, i) => {
      for (const [k] of l.matchAll(re)) {
        if (/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(k)) continue;
        if (!keys.has(k) && !keys.has(k.replace(/[️\u{1F3FB}-\u{1F3FF}]/gu, ""))) miss.push(`${k} ${path.basename(p)}:${i + 1}`);
      }
    });
  });
  walk(path.join(__dirname, "..", "js"));
  assert.deepStrictEqual(miss, []);
});

test("chaque point de départ et les nouveaux défis se jouent jusqu'au bout ; l'Exilé ne joue jamais au pays", () => {
  const g = createGame();
  const starts = g.run("Object.keys(DEPARTS)");
  for (const start of starts) {
    const r = playCareer(7000 + start.length, { start });
    assert.strictEqual(r.issues.length, 0, `${start} : ${report(r.issues)}`);
  }
  for (let s = 0; s < 3; s++) {
    const r = playCareer(7100 + s, { defi: "exil" });
    assert.strictEqual(r.issues.length, 0, report(r.issues));
  }
  const e = createGame({ seed: 7 });
  e.run(`newPlayer({name:"Exil Test",country:"FR",pos:"ATT",trait:"tech",origin:"quartier",ent:"ami",life:"pro",defi:"exil"});`);
  assert.notStrictEqual(e.run("p.club.country"), "FR");
  assert.ok(e.run("p.last = {apps:30}; p.lvl = 80; p.rep = 60; p.flags.forceDepart = true; Array.from({length:20},()=>makeOffers()).flat().every(o=>o.club.country!=='FR')"), "une offre vient du pays de l'Exilé");
  // tant qu'aucune carrière n'est finie, les départs avancés restent verrouillés
  assert.match(e.run("createStep(0),document.querySelector('#app').innerHTML"), /À débloquer : Termine une carrière/);
});

test("mode Histoire et défi de la semaine : jusqu'au dernier chapitre et au score", () => {
  for (let s = 0; s < 2; s++) {
    const r = playCareer(7200 + s, { launch: "startStory()" });
    assert.strictEqual(r.issues.length, 0, report(r.issues));
    assert.strictEqual(r.stats.story, 5, "l'histoire n'arrive pas au chapitre final");
  }
  const w = playCareer(7300, { launch: "startWeekly()" });
  assert.strictEqual(w.issues.length, 0, report(w.issues));
  assert.ok(w.stats.weekly, "le défi de la semaine n'a pas d'objectif");
});

test("monde vivant : clubs qui bougent, réputation par club, titre de carrière et unes", () => {
  const g = createGame({ seed: 21 });
  g.run(`newPlayer({name:"Monde Test",country:"ES",pos:"MIL",trait:"tech",origin:"quartier",ent:"ami",life:"pro"});`);
  const moved = g.run("(()=>{ for(let i=0;i<6;i++) worldShift(); return CLUBS.filter(c=>c.str!==c.base).length; })()");
  assert.ok(moved > 0, "aucun club n'a bougé");
  // la force du monde survit à une sauvegarde
  assert.ok(g.run("(()=>{ const n = CLUBS.find(c=>c.str!==c.base).name, v = CLUBS.find(c=>c.name===n).str; save(); applyWorld(); p = load(); migrate(); return CLUBS.find(c=>c.name===n).str===v; })()"));
  g.run(`clubSeason(p.club,0,"6.1"); clubLeave(p.club,{country:"ES"},true); p.club = {...CLUBS.find(c=>c.name!==p.club.name)};`);
  assert.ok(g.run("formerClubs().length===1&&formerClubs()[0].rep<0"), "partir sous contrat chez un rival du pays doit fâcher les supporters");
  g.run(`p.retired = "Test"; p.moments.push(p.year+" · Remontada historique après un 4-0 à l'aller");`);
  const html = g.run("titleCard()+unesCard()");
  assert.match(html, /Titre de carrière/);
  assert.match(html, /Remontada historique/);
});

test("championnat cohérent : classement final, calendrier et classement provisoire racontent la même saison", () => {
  for (const [seed, country, lvl] of [[71, "ES", 45], [72, "EN", 92], [73, "SN", 70], [74, "FR", 60], [75, "DE", 99]]) {
    const g = createGame({ seed });
    g.run(`newPlayer({name:"Table Test",country:${JSON.stringify(country)},pos:"GB",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); p.lvl = ${lvl};
      p.goalOpts = p.goalOpts||goalOptions(); setGoal(0); var __mid = raceTable(28); p.evIdx = 3; p.phase = 'match'; p.tmp.match = null; simSeason();`);
    const full = g.run("p.last.full"), cal = g.run("p.last.cal"), me = g.run("p.last.full.find(x=>x.n===p.club.name)"), mid = g.run("__mid");
    assert.strictEqual(full.length, 10);
    full.forEach((x, i) => {
      assert.strictEqual(x.w * 3 + x.d, x.pts, `${x.n} : victoires et nuls ne redonnent pas les points`);
      assert.strictEqual(x.w + x.d + x.l, 36, `${x.n} : pas 36 matchs`);
      assert.ok(x.w >= 0 && x.d >= 0 && x.l >= 1, `${x.n} : bilan impossible ${x.w}-${x.d}-${x.l}`);
      if (i) {
        const a = full[i - 1];
        assert.ok(a.pts > x.pts || (a.pts === x.pts && a.gf - a.ga > x.gf - x.ga), `le ${i}e (${a.pts} pts) doit devancer le ${i + 1}e (${x.pts} pts)`);
      }
    });
    assert.ok(full[0].pts > full[1].pts, "le champion est seul en tête");
    assert.strictEqual(g.run("p.last.rank"), me.pos);
    // le calendrier du bilan reprend la ligne du club
    assert.strictEqual(cal.days.length, 36);
    assert.strictEqual(cal.pts, me.pts);
    assert.strictEqual(cal.days.filter(d => d.r === "w").length, me.w);
    assert.strictEqual(cal.days.filter(d => d.on).length, Math.min(36, g.run("p.last.apps")));
    assert.ok(cal.days.every(d => !(d.g && d.r === "l")), "un clean sheet un soir de défaite");
    // à la 28e journée, personne n'est déjà au-delà de ce que le classement final permet, ni à la traîne de façon absurde
    for (const r of mid) assert.ok(r.pts >= 10 && r.pts <= 72, `${r.n} : ${r.pts} points après 28 journées`);
  }
});

test("match clé : la finale de coupe se mérite, la mi-temps précède la consigne, le bandeau garde la bonne saison", () => {
  const g = createGame({ seed: 81 });
  g.run(`newPlayer({name:"Coupe Test",country:"ES",pos:"ATT",trait:"tech",origin:"quartier",ent:"ami",life:"pro"});`);
  const ch = g.run("CLUBS.filter(c=>c.country==='ES').sort((a,b)=>b.str-a.str).map(c=>cupFinalChance(c))");
  assert.ok(ch[0] >= .25 && ch[9] <= .05, "un grand y va souvent, un petit presque jamais");
  assert.ok(ch.every((x, i) => i === 0 || x <= ch[i - 1]), "les chances baissent avec le rang");
  // le journal du match : la mi-temps s'inscrit avant la consigne
  g.run("p.goalOpts = p.goalOpts||goalOptions(); setGoal(0); p.evIdx = 3; p.phase = 'match'; setupMatch(); const m = p.match; m.step = 1; m.pending = 'x'; matchNext();");
  assert.strictEqual(g.run("p.match.awaitTactic"), true);
  g.run("setTactic('att')");
  const log = g.run("p.match.log.map(String)");
  const iHalf = log.findIndex(l => /Mi-temps/.test(l)), iTac = log.findIndex(l => /Consigne/.test(l));
  assert.ok(iHalf >= 0 && iHalf < iTac, "mi-temps avant la consigne : " + log.join(" | "));
  assert.strictEqual(log.filter(l => /Mi-temps :/.test(l)).length, 1);
  // pendant le bilan de la première saison, le bandeau dit encore « Saison 1 »
  g.run("p.match = null; p.tmp.match = null; simSeason(); p.phase = 'season'; seasonScreen();");
  assert.match(g.run("hud()"), /Saison 1 ·/);
  g.run("toOffseason()");
  if (g.run("!p.retired")) assert.match(g.run("hud()"), /Saison 2 ·/);
});

// joue le centre de formation jusqu'au bout en choisissant au hasard ; renvoie la fin et les écrans vus
function playCentre(seed) {
  const g = createGame({ seed });
  g.run("startCentre(); ui.quick = true;");
  for (let n = 0; n < 200; n++) {
    const k = g.run("(()=>{ const c = p.centre, b = CF_BEATS[c.i]; return b?b.k:'fin'; })()");
    if (k === "fin") break;
    g.run(`(()=>{ const c = p.centre, b = CF_BEATS[c.i];
      if(b.k==="essai") return cfEssai(RI(0,1));
      if(b.k==="nom") return cfName(chance(.5));
      if(b.k==="proche") return cfPickPar(pick(Object.keys(CF_PARENTS)));
      if(b.k==="poste") return cfPickPoste(pick(Object.keys(CF_POSTE)));
      if(b.k==="match"){ const m = c.m; if(m.done) return cfMatchEnd(); if(b.acts[m.a]==="dil") return cfDil(RI(0,1)); return cfPlay(RI(0,1)); }
      return cfChoose(RI(0,b.ch(c).length-1));
    })()`);
  }
  g.run("ui.quick = false; route(); cfFilmSkip();");
  return { g, out: g.run("p.centre.out"), i: g.run("p.centre.i"), n: g.run("CF_BEATS.length") };
}

test("le centre de formation se joue jusqu'au film, sans texte cassé, et ses fins varient", () => {
  const outs = {};
  for (let s = 1; s <= 60; s++) {
    const { g, out, i, n } = playCentre(900 + s);
    assert.ok(out && g.run(`!!CF_ENDS[${JSON.stringify(out)}]`), `graine ${900 + s} : pas de fin (${out})`);
    assert.strictEqual(i, n - 1, `graine ${900 + s} : la partie s'arrête avant la fin`);
    outs[out] = (outs[out] || 0) + 1;
    for (const h of g.renders) {
      const t = h.replace(/<[^>]+>/g, " ");
      assert.doesNotMatch(t, /\b(undefined|NaN|null)\b|\[object|\{(par|Par|pr|Pr|e|appel|moi)\}/, `graine ${900 + s} : ${t.match(/.{0,60}(undefined|NaN|null|\[object|\{\w+\}).{0,40}/)?.[0]}`);
    }
    assert.match(g.lastRender(), /Aujourd'hui/);
    assert.match(g.lastRender(), /Fins découvertes/);
  }
  assert.ok(Object.keys(outs).length >= 5, "au moins cinq fins différentes sur 60 parties : " + JSON.stringify(outs));
  // la reprise d'une partie en cours retombe au même endroit
  const g = createGame({ seed: 3 });
  g.run("startCentre(); ui.quick = true; cfEssai(0); cfChoose(0); cfName(true); cfPickPar('gm');");
  g.run("const k = p.centre.i; p = null; resume(slot); globalThis.__k = k;");
  assert.strictEqual(g.run("p.centre.i"), g.run("__k"));
  assert.match(g.lastRender(), /tu joues où/);
  // la carrière classique n'est pas touchée : l'accueil propose le centre, et une carrière normale démarre comme avant
  g.run("home(); newCareer('2')");
  assert.match(g.lastRender(), /Le jour de l'essai/);
  assert.strictEqual(g.run("slot"), "2");
});

// le centre joué au hasard jusqu'au bout, puis la carrière qui continue (lancement pour le simulateur)
const CENTRE_PUIS_CARRIERE = `startCentre('1'); ui.quick = true;
  for(let n=0;n<200&&CF_BEATS[p.centre.i]&&CF_BEATS[p.centre.i].k!=="fin";n++){ const c = p.centre, b = CF_BEATS[c.i];
    if(b.k==="essai") cfEssai(RI(0,1)); else if(b.k==="nom") cfName(true); else if(b.k==="proche") cfPickPar(pick(Object.keys(CF_PARENTS)));
    else if(b.k==="poste") cfPickPoste(pick(Object.keys(CF_POSTE)));
    else if(b.k==="match"){ if(!c.m) cfMatchStart(b); const m = c.m; if(m.done) cfMatchEnd(); else if(b.acts[m.a]==="dil") cfDil(RI(0,1)); else cfPlay(RI(0,1)); }
    else cfChoose(RI(0,b.ch(c).length-1)); }
  cfToCareer()`;

test("après le centre, la carrière continue avec Sacha en rival, et les gens du centre reviennent", () => {
  const seen = new Set();
  for (let s = 0; s < 16; s++) {
    const r = playCareer(1500 + s, { launch: CENTRE_PUIS_CARRIERE });
    assert.strictEqual(r.issues.length, 0, report(r.issues));
    assert.ok(r.stats && r.stats.seasons >= 1, `graine ${1500 + s} : carrière vide`);
    r.stats.ids.filter(id => /^cf/.test(id)).forEach(id => seen.add(id));
  }
  assert.ok(seen.size >= 4, "au moins quatre retours de personnages différents sur 16 carrières : " + [...seen].join(", "));
  // juste après le centre : même joueur, même âge, Sacha en rival, et la carrière démarre normalement
  const g = createGame({ seed: 77 });
  g.run(CENTRE_PUIS_CARRIERE);
  assert.strictEqual(g.run("p.centre"), undefined);
  assert.strictEqual(g.run("p.rival.name"), "Sacha Lenoir");
  assert.strictEqual(g.run("p.phase"), "goal");
  assert.ok(g.run("p.age>=17&&p.age<=18"));
  assert.ok(g.run("p.name!=='Inconnu'"));
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
});

test("centre rejouable : une scène tirée par saison, inédite d'abord, et les anciennes parties se reprennent", () => {
  const g = createGame({ seed: 5 });
  const pools = [];
  for (let k = 0; k < 3; k++) {
    g.run("startCentre('1'); ui.quick = true;");
    const pool = g.run("p.centre.pool");
    assert.strictEqual(pool.length, 3, "une scène par saison");
    pools.push(pool);
    g.run("p.centre.pool.forEach(cfVu)");
  }
  // trois parties de suite : jamais deux fois la même scène tant qu'il en reste d'inédites
  const s1 = pools.map(x => x[0]);
  assert.strictEqual(new Set(s1).size, 3, "saison 1 : " + s1.join(", "));
  // une partie du premier prototype (sans tirage) reprend à la même étape
  g.run(`startCentre('2'); const c = p.centre; delete c.v; delete c.pool; c.i = 12; save(); p = null; resume('2');`);
  assert.strictEqual(g.run("CF_BEATS[p.centre.i].id"), "agent");
  assert.ok(g.run("p.centre.pool.includes('depanne')"));
  assert.doesNotMatch(g.lastRender(), /undefined|NaN/);
});

test("à la retraite, le film de la carrière passe avant le bilan, avec les gens du centre", () => {
  const g = createGame({ seed: 88 });
  g.run(CENTRE_PUIS_CARRIERE);
  g.run(`p.seasons = [{y:"2028-29",age:18,club:p.club.name,cc:"FR",apps:30,goals:9,assists:3,clean:0,rating:"7.00",rank:3,lvl:70,tr:1}];
    p.moments.push("2031 · Ballon d'Étoile !"); p.retired = "test"; p.after = {k:"calme",n:"Profiter",t:"…"}; ui.quick = false; route();`);
  const film = g.lastRender();
  assert.match(film, /Le film de ta carrière/);
  assert.match(film, /Sacha/);
  assert.doesNotMatch(film.replace(/<[^>]+>/g, " "), /undefined|NaN|\{(par|Par|e|pr)\}/);
  // la fin du film ouvre le bilan, et le bilan propose de le revoir
  g.run("filmEnd()");
  assert.match(g.lastRender(), /Bilan de carrière/);
  assert.match(g.lastRender(), /Revoir le film de ta carrière/);
  assert.strictEqual(g.run("p.filmSeen"), true);
});

test("chapitres : la percée et le sommet ont un verdict, la dernière danse amène son offre, le bilan les raconte", () => {
  const g = createGame({ seed: 91 });
  g.run(`newPlayer({name:"Chap Test",country:"FR",pos:"ATT",trait:"tech",origin:"quartier",ent:"ami",life:"pro"});
    p.goalOpts = goalOptions(); goalScreen();`);
  assert.match(g.lastRender(), /Chapitre 1 · La percée/);
  // 23 ans : sans saison pleine, la percée est manquée ; avec, elle est réussie
  g.run(`p.age = 23; p.seasons = [{y:"2030-31",age:21,club:p.club.name,cc:"FR",apps:12,goals:2,assists:1,clean:0,rating:"6.40",rank:5,lvl:70,tr:0}]; globalThis.__t = chapterCheck();`);
  assert.strictEqual(g.run("p.acts.percee"), "ko");
  assert.match(g.run("__t"), /manqué/);
  g.run(`p.acts = {}; p.club = {...CLUBS.find(c=>c.name==="Olympique Valmont")}; p.seasons[0] = {...p.seasons[0],club:"Olympique Valmont",apps:33,rating:"7.10"}; chapterCheck();`);
  assert.strictEqual(g.run("p.acts.percee"), "ok");
  // 30 ans : une Coupe des Champions à 27 ans valide le sommet
  g.run(`p.age = 30; p.trophies = [{t:"Coupe des Champions",y:p.year-3}]; chapterCheck();`);
  assert.strictEqual(g.run("p.acts.sommet"), "ok");
  assert.ok(g.run("p.moments.some(m=>/Au sommet : Coupe des Champions/.test(m))"));
  // la dernière danse « revenir aux racines » fait venir une offre du premier club
  g.run(`p.clubsHist = ["Stade Saint-Aubrac","Olympique Valmont"]; p.flags.danseRacines = true; globalThis.__o = []; chapterOffers(__o);`);
  assert.strictEqual(g.run("p.flags.danse"), "racines");
  assert.strictEqual(g.run("__o[0]&&__o[0].club.name"), "Stade Saint-Aubrac");
  const card = g.run("chaptersCard()");
  assert.match(card, /Tes chapitres/);
  assert.doesNotMatch(card, /undefined|NaN/);
});

test("rythme : la saison décisive d'un chapitre a un moment de plus, et chaque conseil ne s'affiche qu'une fois", () => {
  const g = createGame({ seed: 93 });
  g.run(`newPlayer({name:"Rythme Test",country:"FR",pos:"MIL",trait:"tech",origin:"quartier",ent:"ami",life:"pro"});
    p.age = 22; p.seasons = [{y:"2031-32",age:21,club:p.club.name,cc:"FR",apps:10,goals:1,assists:1,clean:0,rating:"6.20",rank:6,lvl:60,tr:0}]; startSeason();`);
  assert.strictEqual(g.run("p.evCount"), 4);
  assert.match(g.run("seasonSteps()"), /Moment 4/);
  assert.match(g.run("chapterLine()"), /Dernière chance/);
  g.run("p.age = 25; startSeason();");
  assert.strictEqual(g.run("p.evCount"), g.run("p.calm") ? 2 : 3);
  // un conseil vu ne revient pas, même sans avoir cliqué sur « Compris »
  g.run("tipsSeen = {}");
  assert.match(g.run("tip('goal')"), /objectif personnel/);
  assert.strictEqual(g.run("tip('goal')"), "");
});

test("vestiaire vivant : les coéquipiers durent, se souviennent, partent et reviennent en face ; le dirigeant se souvient", () => {
  const g = createGame({ seed: 97 });
  g.run(`newPlayer({name:"Vestiaire Test",country:"FR",pos:"ATT",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); p.centre = null; p.age = 21;`);
  const roles = JSON.parse(g.run("JSON.stringify(crew().map(x=>x.role))"));
  assert.deepStrictEqual(roles, ["capitaine", "pote", "mentor"]);
  // un choix laisse une trace chez le coéquipier, et le texte qui suit s'en souvient
  g.run(`applyFx({crew:{role:"capitaine",aff:10,mem:{repas:"oui"}}})`);
  assert.strictEqual(g.run("crewGet('capitaine').mem.repas"), "oui");
  g.run("crewGet('capitaine').age = 33; p.age = 23;");
  assert.strictEqual(g.run("EVENTS.find(e=>e.id==='eqBrassard').cond()"), true);
  assert.match(g.run("EVENTS.find(e=>e.id==='eqBrassard').txt()"), /dîner/);
  // le texte se relit sans planter une fois le brassard pris (le capitaine devient le vétéran)
  g.run("applyFx({flag:'cap',crew:{role:'capitaine',aff:8,mem:{adieu:'brassard'}}})");
  assert.ok(g.run("EVENTS.find(e=>e.id==='eqBrassard').txt()").length > 20);
  // en changeant de club, le groupe reste là-bas ; un ancien coéquipier en face est annoncé et a son dialogue
  const old = g.run("p.club.name");
  g.run(`p.club = {...CLUBS.find(c=>c.country===p.club.country&&c.name!==p.club.name)}; p.rel = newRel(); crew();`);
  assert.ok(JSON.parse(g.run("JSON.stringify(p.crew.gone.map(x=>x.club))")).every(c => c === old));
  g.run(`p.phase = "match"; setupMatch(); p.match.opp = {...CLUBS.find(c=>c.name===${JSON.stringify(old)})}; p.match.log = []; crewMatchSetup(p.match);`);
  assert.ok(g.run("!!p.match.exMate"));
  assert.strictEqual(g.run("pickTalk(p.match)"), "c_exmate");
  // retour dans l'ancien club (fin de prêt) : ceux qui y sont restés sont là, et la scène des retrouvailles les nomme
  const capName = g.run("p.crew.gone.find(x=>x.role==='mentor'||x.role==='capitaine').n");
  g.run(`p.match = null; p.club = {...CLUBS.find(c=>c.name===${JSON.stringify(old)})}; crew();`);
  assert.ok(JSON.parse(g.run("JSON.stringify(crew().map(x=>x.n))")).includes(capName));
  assert.strictEqual(g.run("EVENTS.find(e=>e.id==='eqRetrouvailles').cond()"), true);
  assert.match(g.run("EVENTS.find(e=>e.id==='eqRetrouvailles').txt()"), new RegExp(capName));
  g.run("applyFx({moral:5,crewBack:6})");
  assert.strictEqual(g.run("EVENTS.find(e=>e.id==='eqRetrouvailles').cond()"), false);
  // le film de carrière garde l'homme du vestiaire
  assert.match(g.run("crewFilmFrame()||''"), /Le vestiaire/);
  // le dirigeant : un refus est retenu, et il le rappelle à la négociation suivante
  g.run(`bossRemember("refused","Olympique Valmont","Stade X"); p.year += 2;`);
  assert.match(g.run(`bossLine("Olympique Valmont","open")`), /préféré Stade X/);
  assert.match(g.run(`bossSay("Olympique Valmont","sign")`), /cf-say/);
  // la panoplie : sans succès, seul l'équipement de base est porté
  assert.strictEqual(g.run("gear().boots.id"), "noir");
});

test("rythme de carrière : grandes saisons et saisons de transition, qui passent vite et se jouent en détail sur demande", () => {
  const g = createGame({ seed: 101 });
  g.run(`newPlayer({name:"Rythme Bis",country:"FR",pos:"MIL",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); p.centre = null; p.age = 25;
    p.seasons = [{y:"2030-31",age:24,club:p.club.name,cc:"FR",apps:30,goals:4,assists:6,clean:0,rating:"6.90",rank:8,lvl:70,tr:0}];
    p.rival = null; p.caps = 0; p.bigRun = 1; p.calmRun = 0; startSeason();`);
  // rien de décisif : saison de transition, deux moments, pas de match de championnat
  assert.strictEqual(g.run("p.calm"), true);
  assert.strictEqual(g.run("p.evCount"), 2);
  g.run("goalScreen()"); assert.match(g.lastRender(), /Saison de transition/);
  // elle va jusqu'au bilan sans jouer le match clé à l'écran
  g.run("setGoal(0); choose(0); if(p.phase==='hiver'){ p.winter=null; p.phase='event'; } if(p.phase==='event') choose(0);");
  // un match à enjeu (course au titre, finale) reste joué en détail même dans une saison calme : on le simule ici
  if (g.run("p.phase") === "match") { assert.strictEqual(g.run("bigMatch(p.match)"), true); g.run("calmMatch()"); }
  assert.strictEqual(g.run("p.phase"), "season");
  assert.strictEqual(g.run("!!p.last.calm"), true);
  // après un match joué, le récit « ta saison en 5 cartes » peut s'ouvrir par-dessus le bilan : on lit les deux derniers rendus
  g.run("seasonScreen()"); assert.match(g.renders.slice(-2).join(""), /Saison de transition/);
  // trois saisons de transition d'affilée n'existent pas
  g.run("p.calmRun = 2; p.seasons.push({...p.seasons[0],club:p.club.name}); startSeason();");
  assert.strictEqual(g.run("p.calm"), false);
  // on peut toujours vivre une saison de transition en détail
  g.run("p.calmRun = 0; p.bigRun = 1; startSeason();");
  if (g.run("p.calm")) { g.run("playFullSeason()"); assert.strictEqual(g.run("p.evCount"), 3); assert.strictEqual(g.run("p.calm"), false); }
  // un nouveau club fait toujours une grande saison, avec ses intrigues
  g.run(`p.club = {...CLUBS.find(c=>c.country===p.club.country&&c.name!==p.club.name)}; p.bigRun = 5; startSeason();`);
  assert.strictEqual(g.run("p.calm"), false);
  assert.match(g.run("paceCard()"), /Grande saison/);
});

test("après le centre : les deux premières saisons pro ont leurs scènes écrites, quelle que soit la fin", () => {
  for (const out of ["signe", "valmont", "bas", "double", "exil", "renvoye", "prix"]) {
    const g = createGame({ seed: 31 });
    g.run(`startCentre("1"); ui.quick = true; p.name = "Léo Fil"; const c = p.centre; c.out = "${out}"; c.mem = {nino:"mot",appel:"promesse"}; c.sacha = 1; c.par = "gm"; c.i = CF_BEATS.length; cfToCareer();`);
    const seen = [];
    for (let s = 0; s < 3; s++) {
      g.run(`if(p.phase==="goal"){ p.goalOpts = goalOptions(); setGoal(0); }`);
      for (let k = 0; k < 8 && g.run("p.phase") === "event"; k++) {
        seen.push(g.run(`(()=>{ if(!p.curEv){ const e = drawEvent(); p.curEv = e.id; ui.seenThisSeason = (ui.seenThisSeason||[]).concat(e.id); } const e = EVENTS.find(x=>x.id===p.curEv), t = evText(e)+e.ch.map(c=>c.t+(c.why||"")).join(); if(/undefined|NaN|\{par\}|\{mpar\}/.test(t)) throw new Error("texte cassé "+e.id+" : "+t.slice(0,200)); choose(0); return e.id; })()`));
        g.run(`if(p.phase==="hiver"){ p.winter=null; p.phase="event"; } if(p.phase==="ordinaire") p.phase="event";`);
      }
      g.run(`(()=>{ let n=0; while(p.phase!=="goal"&&!p.retired&&n++<50){ if(p.phase==="match") calmMatch(); else if(p.phase==="season") toOffseason(); else if(p.phase==="offseason"||p.phase==="summer") stay(); else if(p.phase==="ordinaire") p.phase="event"; else if(p.phase==="tirage") tirageDone(); else if(p.phase==="event"){ if(!p.curEv){ p.curEv = drawEvent().id; } choose(0); } else break; } })()`);
    }
    for (const id of ["cfCasier", "cfNinoLettre", "cfVasseurAppel"]) assert.ok(seen.includes(id), `${out} : ${id} absent (${seen.join(" ")})`);
    assert.ok(seen.indexOf("cfCasier") < seen.indexOf("cfNinoLettre"), `${out} : ordre du fil`);
  }
});

test("un mini-jeu interrompu par un rechargement compte comme manqué, au même endroit seulement", () => {
  const g = createGame({ seed: 5 });
  g.run(`newPlayer({name:"Verrou Test",country:"FR",pos:"ATT",trait:"tech",origin:"quartier",ent:"ami",life:"pro"}); p.phase = "event"; p.evIdx = 1; p.curEv = "coach"; miniLockStart("shoot");`);
  assert.strictEqual(g.run("miniInterrupted('shoot')"), true);
  assert.strictEqual(g.run("!!p.miniLock"), false);
  // ailleurs dans la saison, la note ne pénalise pas un autre mini-jeu
  g.run(`miniLockStart("shoot"); p.evIdx = 2;`);
  assert.strictEqual(g.run("miniInterrupted('shoot')"), false);
});
