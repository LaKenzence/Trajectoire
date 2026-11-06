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
