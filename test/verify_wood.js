/* e2e Projet Bois : mini-IA d'identification, volume, mesure par repère, projets, stock. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };
const near=(a,b,e)=>Math.abs(a-b)<=(e||0.001);

function mkEl(id){ const cls=new Set(),at={};
  return { id,tagName:'DIV',_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,onchange:null,oninput:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:(c,f)=>{const on=f===undefined?!cls.has(c):f;on?cls.add(c):cls.delete(c);}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);this.children.length=0;},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll(){return [];},querySelector(){return null;},
    appendChild(c){this.children.push(c);return c;},setAttribute(k,v){at[k]=v;},getAttribute(k){return at[k];},addEventListener(){},removeEventListener(){},click(){},focus(){},blur(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>{const e=mkEl('_'+t);if(t==='canvas')e.getContext=()=>({drawImage(){}});e.toDataURL=()=>'data:,';return e;},documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx;

// ---- mini-IA : classement + confiance ----
ok('W1 — sans indice : confiance nulle', c.identifyEssence({})[0].conf===0);
const chene=c.identifyEssence({type:'feuillu',leaf:'lobee',fruit:'gland',bark:'crevassee',hard:'dur'});
ok('W2 — indices chêne → chêne en tête', chene[0].e.k==='chene' && chene[0].conf>=80);
const pin=c.identifyEssence({type:'resineux',leaf:'aig_faisceau',fruit:'cone',bark:'orangee',hard:'mi_dur'});
ok('W3 — indices pin → pin en tête', pin[0].e.k==='pin' && pin[0].conf>=80);
const cheneWrong=c.identifyEssence({type:'feuillu',leaf:'lobee',fruit:'gland',bark:'crevassee',hard:'tendre'});
ok('W4 — un indice contradictoire baisse le score', cheneWrong.find(r=>r.e.k==='chene').score < chene.find(r=>r.e.k==='chene').score);
ok('W5 — confiance bornée 0..100', c.identifyEssence({type:'feuillu'}).every(r=>r.conf>=0&&r.conf<=100));

// ---- volume ----
ok('W6 — volume ≈ cylindre (300×Ø40 ≈ 0.377 m³)', near(c.logVolume(300,40), Math.PI*0.2*0.2*3));
ok('W7 — volume nul si dimension manquante', c.logVolume(0,40)===0 && c.logVolume(300,0)===0);

// ---- mesure par repère d'échelle ----
ok('W8 — distance en pixels', near(c.ptDistPx({xPct:0,yPct:0},{xPct:100,yPct:0},200,300),200,0.01));
ok('W9 — échelle : repère 200px=100cm, cible 400px → 200cm', c.scaleRealCm(
  [{xPct:0,yPct:20},{xPct:100,yPct:20}], [{xPct:10,yPct:50},{xPct:60,yPct:50}], 100, 400, 300)===200);
const m={ ref:[{xPct:10,yPct:50},{xPct:60,yPct:50}], len:[{xPct:0,yPct:20},{xPct:100,yPct:20}], diam:[{xPct:40,yPct:0},{xPct:40,yPct:50}], refCm:100, rw:400, rh:300 };
const rr=c.measureResults({m,mLenManual:'',mDiamManual:''});
ok('W10 — mesure photo : longueur 200cm, Ø 75cm', rr.lenCm===200 && rr.diamCm===75);
const rm=c.measureResults({m:{ref:[],len:[],diam:[],refCm:100,rw:1,rh:1}, mLenManual:'250', mDiamManual:'30'});
ok('W11 — saisie manuelle prioritaire', rm.lenCm===250 && rm.diamCm===30 && near(rm.vol,c.logVolume(250,30)));
const rc=c.measureResults({m:{ref:[],len:[],diam:[],refCm:100,rw:1,rh:1}, mLenManual:'200', mDiamManual:'40', mDiam2Manual:'20'});
ok('W11b — tronc de cône : Ø petit bout + volume < cylindre', rc.diam2Cm===20 && near(rc.vol,c.grumeVolume(200,40,20)) && rc.vol<c.grumeVolume(200,40,0));
const rq=c.measureResults({mMode:'circ', m:{ref:[],len:[],diam:[],refCm:100,rw:1,rh:1}, mLenManual:'200', mDiamManual:'100'});
ok('W11c — circonférence → diamètre (100 → ~32 cm)', rq.diamCm===Math.round(100/Math.PI));

// ---- stock + projets (règles) ----
const chLog={id:'l1',speciesKey:'chene',speciesName:'Chêne',lengthCm:250,diamCm:30,volumeM3:c.logVolume(250,30),photo:''};
const smallLog={id:'l2',speciesKey:'hetre',speciesName:'Hêtre',lengthCm:80,diamCm:12,volumeM3:0.009,photo:''};
const env2=makeEnv({mastered:{}, woodStock:[chLog, smallLog]}); loadApp(env2); const c2=env2.ctx;
ok('W12 — stock : 2 grumes, volume cumulé', c2.woodStats().count===2 && c2.woodStats().vol>0);
const fit=c2.woodProjectFit();
const charp=fit.find(r=>r.p.k==='charpente');
ok('W13 — charpente réalisable avec le chêne 250×30', charp.ok && charp.count===1 && charp.species.indexOf('Chêne')>=0);
const bard=fit.find(r=>r.p.k==='bardage');
ok('W14 — bardage : chêne (durable) éligible', bard.ok);
const env3=makeEnv({mastered:{}, woodStock:[{id:'l3',speciesKey:'chene',speciesName:'Chêne',lengthCm:100,diamCm:10,volumeM3:0.008}]}); loadApp(env3);
const fit3=env3.ctx.woodProjectFit().find(r=>r.p.k==='charpente');
ok('W15 — chêne trop petit : charpente non réalisable + indice', !fit3.ok && /trop petites/.test(fit3.hint));
const env4=makeEnv({mastered:{}, woodStock:[{id:'l4',speciesKey:'peuplier',speciesName:'Peuplier',lengthCm:300,diamCm:40,volumeM3:0.37}]}); loadApp(env4);
const bard4=env4.ctx.woodProjectFit().find(r=>r.p.k==='bardage');
ok('W16 — peuplier non durable : bardage exclu', !bard4.ok && /Aucune essence/.test(bard4.hint));

// ---- rendu stock (innerHTML) ----
c2.renderWoodFlow('stock');
ok('W17 — liste stock affiche l\'essence et le volume', /Chêne/.test(env2.reg.wfBody.innerHTML) && /m³/.test(env2.reg.wfBody.innerHTML));
c2.renderWoodFlow('projects');
ok('W18 — tableau de bord : KPI + stock par essence + projets cochables', /kpi-grid/.test(env2.reg.wfBody.innerHTML)&&/Stock par essence/.test(env2.reg.wfBody.innerHTML)&&/psel-chk/.test(env2.reg.wfBody.innerHTML));

// ---- dossier projet : rendement (débit) + rendu ----
ok('WD1 — débit plots (planche 27mm, Ø34 → ~10)', c2.debitYield('plots',{t:27},{diamCm:34,lengthCm:300})===10);
ok('WD2 — débit équarri : gros oui, petit non', c2.debitYield('equarri',{s:12},{diamCm:38})===1 && c2.debitYield('equarri',{s:12},{diamCm:10})===0);
ok('WD3 — débit fendage (piquet Ø26 ≥ 4)', c2.debitYield('fendage',{d:8},{diamCm:26})>=4);
ok('WD4 — débit bûche (Ø38 L300 > 0)', c2.debitYield('buche',{len:33},{diamCm:38,lengthCm:300})>0);
c2.renderWoodProjectDoc('charpente');
const doc=env2.reg.wfBody.innerHTML;
ok('WD5 — dossier : plan de coupe + découpe + rendement + séchage', /Plan de coupe/.test(doc)&&/Découpe de la grume/.test(doc)&&/Rendement/.test(doc)&&/debitsvg/.test(doc)&&/Séchage/.test(doc));
ok('WD6 — dossier réalisable : estimation de pièces', /≈ \d+ poutre/.test(doc));
ok('WD8 — plan de construction + liste de débit + pièces parfaites', /Ce qu.on construit/.test(doc)&&/plansvg/.test(doc)&&/Liste de débit/.test(doc)&&/cutlist/.test(doc)&&/Sortir des pièces parfaites/.test(doc)&&/Assemblage/.test(doc));
ok('WD9 — liste de débit : lignes de pièces (arbalétrier/entrait)', /Arbalétrier/.test(doc)&&/Entrait/.test(doc));
c2.renderWoodProjectDoc('terrasse');
ok('WD7 — dossier non réalisable : « Pas encore réalisable »', /Pas encore réalisable/.test(env2.reg.wfBody.innerHTML));
// chaque projet a un plan détaillé complet
c.loadWoodDemo(); let allDoc=true;
['charpente','ossature','bardage','terrasse','piquet','planche','meuble','manche','chauffage'].forEach(pk=>{ c.renderWoodProjectDoc(pk); const h=env.reg.wfBody.innerHTML; if(!(/plansvg/.test(h)&&/Liste de débit/.test(h)&&/Sortir des pièces parfaites/.test(h))) allDoc=false; });
ok('WD10 — les 9 projets ont plan + débit + pièces parfaites', allDoc);

// ---- jeu d'essai : 20 grumes → projets ----
c.loadWoodDemo();
ok('W19 — jeu d’essai charge 20 grumes', c.woodStats().count===20);
const dfit=c.woodProjectFit();
ok('W20 — au moins 6 catégories réalisables', dfit.filter(r=>r.ok).length>=6);
ok('W21 — charpente réalisable (grosses grumes)', dfit.find(r=>r.p.k==='charpente').ok);
ok('W22 — piquets réalisables (essences durables)', dfit.find(r=>r.p.k==='piquet').ok);
ok('W23 — bardage réalisable (durables ≥ Ø20)', dfit.find(r=>r.p.k==='bardage').ok);
c.loadWoodDemo();
ok('W24 — rechargement idempotent (pas de doublon)', c.woodStats().count===20);
c.clearWoodStock();
ok('W25 — vider le stock remet à zéro', c.woodStats().count===0);

// ---- tableau de bord : sélection de projets, mise à jour auto, persistance ----
const env5=makeEnv({mastered:{}}); loadApp(env5); const c5=env5.ctx; c5.loadWoodDemo();
const D0=c5.woodDashboardData();
ok('DB1 — KPI : 20 grumes, volume > 0, ≥ 6 réalisables', D0.count===20 && D0.totalVol>0 && D0.feasible>=6);
ok('DB2 — stock par essence renseigné', D0.essences.length>0 && D0.essences[0].vol>0);
ok('DB3 — sans sélection : rien de mobilisé', D0.selCount===0 && D0.mobVol===0 && Math.abs(D0.freeVol-D0.totalVol)<1e-9);
c5.toggleWoodPlan('charpente');
const D1=c5.woodDashboardData();
ok('DB4 — cocher charpente : mobilise du volume, met à jour', D1.selCount===1 && D1.mobVol>0 && D1.freeVol<D1.totalVol);
ok('DB5 — sélection persistée en localStorage', JSON.parse(env5.ls.get('nexus_stable')).woodPlan.selected.indexOf('charpente')>=0);
ok('DB6 — un projet coché a l’état « selected »', c5.woodDashboardData().rows.find(r=>r.p.k==='charpente').state==='selected');
c5.toggleWoodPlan('charpente');
const D2=c5.woodDashboardData();
ok('DB7 — décocher relibère tout le stock', D2.selCount===0 && D2.mobVol===0);

// ---- quantités par construction : compteur, allocation au plus juste, dossier ----
c5.toggleWoodPlan('charpente');                        // re-coche : qty par défaut = max
const q0=c5.woodQty('charpente');
ok('Q1 — quantité par défaut = max réalisable (>0)', q0>=1);
const A0=c5.woodAllocation().alloc.charpente;
ok('Q2 — allocation par défaut : pièces ≥ voulu ou stock épuisé', A0.got>=Math.min(A0.want,A0.got) && A0.logs.length>0 && A0.vol>0);
c5.setWoodQty('charpente',1);                          // je ne veux qu'UNE pièce
const A1=c5.woodAllocation().alloc.charpente;
ok('Q3 — 1 pièce voulue : une seule grume réservée', A1.want===1 && A1.got>=1 && A1.logs.length===1);
const Dq=c5.woodDashboardData();
ok('Q4 — m³ mobilisés = volume des grumes réservées seulement', Math.abs(Dq.mobVol-A1.vol)<1e-9 && Dq.mobVol<Dq.totalVol);
ok('Q5 — compteur affiché sur la carte cochée', /pq-in/.test((()=>{c5.renderWoodDashboard();return env5.reg.wfBody.innerHTML;})()));
c5.setWoodQty('charpente',999);                        // plus que le stock
const A2=c5.woodAllocation().alloc.charpente;
ok('Q6 — quantité > stock : toutes les grumes adaptées, got < want', A2.got<A2.want && A2.logs.length>0);
c5.renderWoodProjectDoc('charpente');
const docH=env5.reg.wfBody.innerHTML;
ok('Q7 — dossier : bloc « Ta construction » avec grumes réservées', /Ta construction/.test(docH) && /réservée/.test(docH));
ok('Q8 — dossier : alerte stock insuffisant', /Stock insuffisant/.test(docH));
c5.toggleWoodPlan('charpente');
ok('Q9 — décocher efface la quantité', !(JSON.parse(env5.ls.get('nexus_stable')).woodPlan.qty||{}).charpente);

// ---- dossier : planification directe depuis le dossier ----
c5.renderWoodProjectDoc('charpente');            // non cochée à ce stade
ok('Q10 — dossier non planifié : bouton « Planifier cette construction »', /Planifier cette construction/.test(env5.reg.wfBody.innerHTML));
c5.toggleWoodPlan('charpente'); c5.setWoodQty('charpente',2); c5.renderWoodProjectDoc('charpente');
const dh=env5.reg.wfBody.innerHTML;
ok('Q11 — dossier planifié : compteur de quantité + retrait', /pq-in/.test(dh) && /Retirer cette construction/.test(dh) && /grume/.test(dh));
c5.toggleWoodPlan('charpente');

// ---- 10 nouvelles constructions : présence, dossiers complets, techniques anciennes ----
const fitAll=c5.woodProjectFit();
ok('N1 — 19 constructions au catalogue', fitAll.length===19);
const newKeys=['barriere','ratelier','ruche','abribois','poulailler','portail','echelle','banc','tavaillon','passerelle'];
ok('N2 — les 10 nouvelles sont présentes', newKeys.every(k=>fitAll.some(r=>r.p.k===k)));
let renderErr=null;
try{ fitAll.forEach(r=>c5.renderWoodProjectDoc(r.p.k)); }catch(e){ renderErr=e; }
ok('N3 — chaque dossier se rend sans erreur', renderErr===null);
c5.renderWoodProjectDoc('ruche');
const rh=env5.reg.wfBody.innerHTML;
ok('N4 — dossier ruche : techniques anciennes (ruche-tronc, flambage)', /Techniques anciennes/.test(rh) && /ruche-tronc/i.test(rh) && /Flambage|flambage/.test(rh));
c5.renderWoodProjectDoc('echelle');
ok('N5 — dossier échelle : fendu jamais scié + queue de renard/coin', /jamais sci/i.test(env5.reg.wfBody.innerHTML));
ok('N6 — de nouvelles constructions sont réalisables avec le stock démo', newKeys.filter(k=>fitAll.find(r=>r.p.k===k).ok).length>=4);

console.log('\n=== Bilan verif Projet Bois :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
