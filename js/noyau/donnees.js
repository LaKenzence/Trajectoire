// Trajectoire · Données du jeu : postes, profils, pays et clubs fictifs, utilitaires et sauvegardes
/* Trajectoire : un seul thème, sombre et assumé (un terrain de nuit sous les projecteurs). */
/* ============ Données ============ */
const POS = {
  GB:{n:"Gardien",g:0,a:.005}, DEF:{n:"Défenseur",g:.04,a:.06},
  MIL:{n:"Milieu",g:.12,a:.2}, ATT:{n:"Attaquant",g:.38,a:.15}
};
const TRAITS = {
  tech:{n:"Technicien",d:"Plus de passes décisives et de buts"},
  athl:{n:"Athlète",d:"Moins de blessures, déclin plus lent"},
  lead:{n:"Leader",d:"Moral solide, brassard plus accessible"},
  inst:{n:"Instinctif",d:"Imprévisible : grands soirs et trous d'air"}
};
const ORIGINS = {
  quartier:{n:"Quartier populaire",d:"Moral +10, rage de réussir",fx:{moral:10,pot:2}},
  fils:{n:"Fils d'ancien pro",d:"Réputation +8, attentes élevées",fx:{rep:8,moral:-4}},
  village:{n:"Petite ville",d:"Forme +10, grande résistance",fx:{form:10}},
  academie:{n:"Académie réputée",d:"Niveau +4 au départ",fx:{lvl:4}}
};
// Pays et clubs fictifs : [ville, préfixe, force]
const C = (league,nat,flag,clubs)=>({league,nat,flag,clubs});
const COUNTRIES = {
  FR:{name:"France",...C("Division Hexa",84,"🇫🇷",[["Valmont","Olympique",86],["Port-Marée","Racing",81],["Rochebrune","Stade",77],["Bellerive","AS",73],["Carvelles","FC",70],["Montarde","SC",67],["Lunelle","US",64],["Saint-Aubrac","Stade",61],["Varennes","FC",58],["Sorgues","AC",55]])},
  ES:{name:"Espagne",...C("Liga Solar",85,"🇪🇸",[["Castelar","Real",90],["Albaredo","Atlético",85],["Vallmar","CF",80],["Puerto Lobo","Deportivo",75],["Sierra Alta","UD",71],["Roncal","CD",67],["Torremar","SD",63],["Olivares","Real",60],["Benicor","CF",57],["Mirasol","UD",54]])},
  EN:{name:"Angleterre",...C("Crown League",85,"🏴",[["Ashbury","United",89],["Kingsmoor","City",87],["Northgate","Rovers",82],["Westfold","Athletic",78],["Harrowdale","Town",73],["Brackley","Wanderers",69],["Fenwick","Albion",65],["Duncastle","County",62],["Stourmouth","Rangers",58],["Holloway","FC",55]])},
  IT:{name:"Italie",...C("Lega Aurea",83,"🇮🇹",[["Valdoro","Sporting",86],["Montecalvo","AC",82],["Portoferro","US",78],["Rivalta","Calcio",73],["San Lucio","FC",69],["Collebasso","AS",65],["Terrafina","US",61],["Ardenza","Calcio",58],["Pietrasanta","FC",55],["Lagoverde","AC",52]])},
  DE:{name:"Allemagne",...C("Bundesring",83,"🇩🇪",[["Eisenberg","FC",88],["Rheinfurt","SV",80],["Hohenwald","VfB",76],["Altmark","Borussia",72],["Grünstadt","TSV",68],["Nordhafen","SC",65],["Lindau-Ost","FC",61],["Kaltbach","SV",58],["Weißheim","1. FC",55],["Brunnhof","VfL",52]])},
  PT:{name:"Portugal",...C("Liga Atlântica",80,"🇵🇹",[["Alvorada","Sporting",80],["Porto Velho","FC",79],["Serrana","Benfeira",76],["Marinhal","Vitória",68],["Castro Alto","SC",64],["Ribeira","Académica",60],["Lagoa","GD",57],["Montemar","CD",54],["Vilarinho","FC",51],["Arcos","UD",48]])},
  BE:{name:"Belgique",...C("Pro Ligue Nord",80,"🇧🇪",[["Hoogmeer","Club",77],["Valbrux","RSC",75],["Meuseval","Standard",71],["Gentbeek","KAA",67],["Liersel","KV",63],["Ostdam","KVO",59],["Namur-Haut","RFC",56],["Brugmont","Cercle",53],["Turnel","KFC",50],["Waverlo","SK",47]])},
  BR:{name:"Brésil",...C("Série Ouro",86,"🇧🇷",[["Rio Claro","Flamengal",80],["Santa Luz","Palmares",79],["Porto Novo","Grêmio",75],["São Bento","Corintia",73],["Belavista","Atlético",69],["Itaguara","Cruzeirão",66],["Maracaju","Sport",62],["Vila Rica","EC",58],["Juruá","Náutico",55],["Paraty","AA",51]])},
  AR:{name:"Argentine",...C("Liga Plata",85,"🇦🇷",[["Bahía Azul","Club",78],["San Telmar","Racing",76],["Rosaleda","Newell's Sur",72],["La Cumbre","Estudiantes",69],["Villa Mora","Independiente",66],["Tandilar","Gimnasia",62],["Quilmar","Atlético",59],["Coronel Paz","CA",55],["Puerto Alba","Huracán",52],["Río Seco","Defensores",49]])},
  SN:{name:"Sénégal",...C("Ligue Baobab",79,"🇸🇳",[["Dakar-Plateau","ASC",64],["Thiès","Jaraaf",62],["Saint-Louis","Union",59],["Ziguinchor","Casa Sport",57],["Kaolack","SONACOS",54],["Rufisque","Teungueth",52],["Mbour","Stade",50],["Louga","Linguère",48],["Tamba","AS",46],["Kolda","US",44]])},
  MA:{name:"Maroc",...C("Botola Atlas",81,"🇲🇦",[["Casablanca","Raja Atlas",71],["Rabat","FAR",69],["Fès","Maghreb",65],["Tanger","Ittihad",63],["Agadir","Hassania",60],["Marrakech","Kawkab",58],["Oujda","Mouloudia",55],["Safi","Olympique",53],["Meknès","Codm",50],["Tétouan","Moghreb",48]])},
  CI:{name:"Côte d'Ivoire",...C("Ligue Lagune",78,"🇨🇮",[["Abidjan","ASEC",63],["Treichville","Africa Sports",61],["Bouaké","Stade",58],["Yamoussoukro","SOA",56],["San-Pédro","FC",53],["Daloa","Séwé",51],["Korhogo","Lys",49],["Gagnoa","Racing",47],["Man","Tonnerre",45],["Abengourou","AS",43]])},
  NL:{name:"Pays-Bas",...C("Ligue des Polders",81,"",[["Amstelveen","Ajaxia",79],["Rotterhaven","Feyenburg",77],["Eindhoven-Zuid","PSV",76],["Alkmaarde","AZ",70],["Utrechtse","FC",66],["Twentheim","FC",63],["Groningerland","FC",60],["Heerenveld","SC",57],["Zwolledam","PEC",54],["Bredaveld","NAC",51]])},
  TR:{name:"Turquie",...C("Ligue du Bosphore",78,"",[["Kadıköy","Fenerspor",78],["Galatakent","Aslan SK",77],["Beşiktepe","Kartal JK",74],["Trabzonia","Fırtına",70],["Başakevler","FK",66],["Konyalı","Spor",62],["Sivaskent","Yiğit",59],["Antalyaspor","Akdeniz",56],["Kayseria","Erciyes",53],["Rizeli","Çay SK",50]])},
  US:{name:"États-Unis",...C("Liga Liberty",77,"",[["Los Altos","Galaxy Bay",72],["Seattle Harbor","Sounders FC",69],["Atlanta Peach","United",68],["New Bristol","City",67],["Austin Hill","FC",64],["Portland Pines","Timbers SC",62],["Columbus Gate","Crew",60],["Nashville Row","SC",58],["Denver Ridge","Rapids",55],["Miami Bay","Inter",57]])},
  JP:{name:"Japon",...C("J-Ligue Sakura",79,"",[["Yokohama","Marinos",70],["Kawasaki","Frontale",69],["Kashima","Antlers",67],["Urawa","Reds",66],["Hiroshima","Sanfrecce",63],["Nagoya","Grampus",61],["Osaka-Kita","Gamba",59],["Sapporo","Consadole",56],["Shimizu","S-Pulse",53],["Niigata","Albirex",51]])}
};
const CLUBS = [];
for(const [code,c] of Object.entries(COUNTRIES))
  c.clubs.forEach(([city,pre,str])=>CLUBS.push({name:`${pre} ${city}`,country:code,str}));

/* ============ Utilitaires ============ */
const R = (a,b)=>a+Math.random()*(b-a);
const RI = (a,b)=>Math.floor(R(a,b+1));
const pick = a=>a[Math.floor(Math.random()*a.length)];
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const chance = p=>Math.random()<p;
const shuffle = a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const money = k=>k>=1000?(k/1000).toFixed(1).replace('.',',')+" M€":Math.round(k)+" k€";
const esc = s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// drapeaux dessinés en CSS : les emojis de drapeaux ne s'affichent pas sous Windows
const flag = code=>`<i class="fl fl-${code}" title="${COUNTRIES[code].name}"></i>`;
const $ = s=>document.querySelector(s);

/** @type {any} */
let p = null;      // joueur
let ui = {};       // état d'écran temporaire

// trois emplacements de carrière, plus un pour le défi du jour
let slot = (()=>{ try{ return localStorage.getItem("trajectoire_slot")||"1"; }catch(e){ return "1"; } })();
const slotKey = k=>"trajectoire_save_"+k;
function loadSlot(k){ try{ return JSON.parse(localStorage.getItem(slotKey(k))); }catch(e){ return null; } }
function save(){ if(!p) return; try{ localStorage.setItem(slotKey(slot),JSON.stringify(p)); localStorage.setItem("trajectoire_slot",slot); }catch(e){} }
function load(){ return loadSlot(slot); }
function wipe(k){ try{ localStorage.removeItem(slotKey(k||slot)); }catch(e){} }
try{ // reprise de l'ancienne sauvegarde unique
  const old = localStorage.getItem("trajectoire_save");
  if(old&&!localStorage.getItem(slotKey("1"))) localStorage.setItem(slotKey("1"),old);
  localStorage.removeItem("trajectoire_save");
}catch(e){}
