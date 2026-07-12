/* e2e Atelier G270 : sections pratiques (dépannage, entretien, fiche, repérage) + persistance + photos. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const cls=new Set();
  return { id,_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,onchange:null,oninput:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:()=>{}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll:()=>[],querySelector:()=>null,appendChild(c){this.children.push(c);return c;},setAttribute(){},getAttribute(){},addEventListener(){},focus(){},click(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>mkEl('_'+t),documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),NEXUS_VERSION:'63'},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','g270_photos.js','g270_atelier.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx, R=env.reg;

// ---- initialisation du sous-store véhicule ----
const S=c.g270S();
ok('A1 — g270S() initialise sheet/fait/journal', S && typeof S.sheet==='object' && typeof S.fait==='object' && Array.isArray(S.journal));

// ---- hub ----
c.renderAtelierHub();
const hub=R.atelierTiles.innerHTML;
ok('A2 — le hub liste les 4 sections', /dépannage/i.test(hub)&&/entretien/i.test(hub)&&/fiche/i.test(hub.toLowerCase())&&/repérage/i.test(hub));
ok('A3 — écran scAtelier activé', R.scAtelier.classList.contains('active'));

// ---- dépannage : rangées cliquables vers un tuto ----
c.renderAtelierFlow('depannage');
const dep=R.atfBody.innerHTML;
ok('A4 — dépannage : 4 familles', /Démarrage/.test(dep)&&/Moteur/.test(dep)&&/Air &amp; freins|Air &/.test(dep)&&/Transmission/.test(dep));
ok('A5 — dépannage : symptômes cliquables (data-tuto)', /data-tuto="dep_nopart"/.test(dep)&&/data-tuto="dep_patine"/.test(dep));

// ---- tutoriel pas-à-pas ----
c.openTuto('dep_nopart');
const tut=R.atfBody.innerHTML;
ok('A5b — tuto : étapes numérotées + électrovanne + purge', /class="tuto-steps"/.test(tut)&&/électrovanne/.test(tut)&&/gasoil/.test(tut));

// ---- diagnostic de la panne en cours ----
c.openPanne('demarrage');
const pan=R.atfBody.innerHTML;
ok('A5c — panne : suspects + marche à suivre + électrovanne', /Marche à suivre/.test(pan)&&/électrovanne/.test(pan)&&/45/.test(pan));
ok('A5d — panne : photo de la pompe d\'injection', /<img[^>]+data-lb/.test(pan)&&/src="data:image\/jpeg/.test(pan));

// ---- panne interactive : verdict, étapes cochables, observations, résolution ----
const PD=c.panneByKey('demarrage');
ok('AP1 — verdict : tension qui tombe → alimentation', /Alimentation/.test((c.panneVerdict(PD,{volt:'non'})||{}).t||''));
ok('AP2 — verdict : 24 V maintenus + redémarre à froid → électrovanne HS', /défaillante/.test((c.panneVerdict(PD,{volt:'oui',cool:'oui'})||{}).t||''));
ok('AP3 — verdict : purge améliore → prise d’air/colmatage', /Prise d’air/.test((c.panneVerdict(PD,{purge:'oui'})||{}).t||''));
const PS=c.panneState('demarrage');
PS.ans.volt='non'; PS.done.e0='2026-07-11'; PS.obs.push({id:'po_t',date:'2026-07-11',text:'calé à 40 s'});
c.saveStore(); c.renderPanneScreen('demarrage');
const ph2=R.atfBody.innerHTML;
ok('AP4 — écran : verdict affiché + étape cochée + observation listée', /Verdict le plus probable/.test(ph2) && /1 \/ 7 fait/.test(ph2) && /calé à 40 s/.test(ph2));
ok('AP5 — état de la panne persisté', (()=>{ const st=store(env); return st.g270.pannes.demarrage.ans.volt==='non' && !!st.g270.pannes.demarrage.done.e0 && st.g270.pannes.demarrage.obs.some(o=>o.id==='po_t'); })());
PS.resolved={date:'2026-07-11',cause:'test'}; c.renderPanneScreen('demarrage');
ok('AP6 — panne marquée résolue (badge)', /Panne résolue/.test(R.atfBody.innerHTML));
delete PS.resolved;

// ---- 2e panne : pompe de cuve (camion de pompiers) ----
const PP=c.panneByKey('pompe');
ok('AP7 — panne pompe présente (PTO / prise de force)', !!PP && /prise de force/i.test(PP.resume));
ok('AP8 — verdict pompe : pas d’air → pression insuffisante', /pression/i.test((c.panneVerdict(PP,{air:'non'})||{}).t||''));
ok('AP9 — verdict pompe : clac audible → mécanique/crabot', /crabot|mécanique/i.test((c.panneVerdict(PP,{clac:'oui'})||{}).t||''));
c.openPanne('pompe');
const pp2=R.atfBody.innerHTML;
ok('AP10 — écran pompe : étapes + photos PTO + questions', /distributeur/i.test(pp2) && /data-lb/.test(pp2) && /data-pq="clac"/.test(pp2));
c.renderAtelierHub();
ok('AP11 — le hub liste les 2 pannes', /data-panne="demarrage"/.test(R.atelierTiles.innerHTML) && /data-panne="pompe"/.test(R.atelierTiles.innerHTML));
// migration : un ancien état single-panne est repris
const mEnv=makeEnv({mastered:{}, g270:{sheet:{},fait:{},journal:[], panne:{done:{e0:'x'},ans:{volt:'non'},obs:[]}}}); loadApp(mEnv);
ok('AP12 — migration ancienne panne → pannes.demarrage', mEnv.ctx.panneState('demarrage').ans.volt==='non');

// ---- entretien ----
c.renderAtelierFlow('entretien');
const ent=R.atfBody.innerHTML;
ok('A6 — entretien : tâches récurrentes', /Purge des réservoirs d'air|Purge des réservoirs/.test(ent)&&/Graissage des croisillons/.test(ent)&&/Journal/.test(ent));

// ---- fiche ----
c.renderAtelierFlow('fiche');
const fi=R.atfBody.innerHTML;
ok('A7 — fiche : champs clés présents', /Immatriculation/.test(fi)&&/VIN/.test(fi)&&/MIDR/.test(fi)&&/textarea/.test(fi));

// ---- persistance : écrire dans le store puis recharger ----
S.sheet.vin='VF-TEST-123'; S.fait.purge_air={date:'2026-07-09'};
S.journal.push({id:'jr_x',date:'2026-07-09',km:120000,text:'vidange test'});
c.saveStore();
const env2=makeEnv(store(env)); loadApp(env2); const S2=env2.ctx.g270S();
ok('A8 — fiche persistée au rechargement', S2.sheet.vin==='VF-TEST-123');
ok('A9 — tâche « faite » persistée', S2.fait.purge_air && S2.fait.purge_air.date==='2026-07-09');
ok('A10 — journal persisté', (S2.journal||[]).some(e=>e.id==='jr_x'&&e.text==='vidange test'));

// ---- photos embarquées ----
const ph=env.ctx.window.G270_PHOTOS||[];
ok('A11 — 15 photos embarquées', ph.length===15);
ok('A12 — chaque photo = data URI JPEG + libellé + description', ph.every(p=>/^data:image\/jpeg;base64,/.test(p.img)&&p.label&&p.desc&&p.cat));

// ---- repérage ----
c.renderAtelierFlow('reperage');
const rep=R.atfBody.innerHTML;
ok('A13 — repérage : images data + libellés WABCO', /<img[^>]+src="data:image\/jpeg/.test(rep)&&/WABCO/.test(rep));

console.log('\n=== Bilan verif Atelier G270 :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
