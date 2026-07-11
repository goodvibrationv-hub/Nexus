/* e2e Profils & supervision : migration, progression séparée, code admin, stats, gestion. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const cls=new Set(),at={};
  return { id,tagName:'DIV',_html:'',_text:'',children:[],dataset:{},disabled:false,value:'',checked:false,onclick:null,onchange:null,onkeydown:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:(c,f)=>{const on=f===undefined?!cls.has(c):f;on?cls.add(c):cls.delete(c);}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);this.children.length=0;},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll(){return [];},querySelector(){return null;},
    appendChild(c){this.children.push(c);return c;},removeChild(c){const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);return c;},
    setAttribute(k,v){at[k]=v;},removeAttribute(k){delete at[k];},getAttribute(k){return at[k];},addEventListener(){},removeEventListener(){},focus(){},blur(){} }; }
function makeEnv(seed, promptVal){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>{const e=mkEl('_'+t);e.tagName=String(t).toUpperCase();return e;},documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,alert:()=>{},
    prompt:()=>promptVal,
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

// ---- migration d'une install existante (mono-utilisateur) ----
const someCard=(()=>{ const probe=makeEnv({mastered:{}}); loadApp(probe); return probe.ctx.window.NEXUS_CARDS[0]; })();
const drone=(()=>{ const probe=makeEnv({mastered:{}}); loadApp(probe); return probe.ctx.window.NEXUS_CARDS.find(c=>c.skill!==someCard.skill)||someCard; })();

const legacy=makeEnv({ mastered:{ escalade:['e1'] }, srs:{ [someCard.id]:{s:30,d:5,due:Date.now()+9e9,reps:3} }, hardMode:true, profilesReset1:true });
loadApp(legacy); const L=legacy.ctx;
let S=store(legacy);
ok('P1 — 3 profils créés (mael/alizee/lali)', S.profiles && S.profiles.mael && S.profiles.alizee && S.profiles.lali);
ok('P2 — Maël est admin, les autres users', S.profiles.mael.role==='admin' && S.profiles.alizee.role==='user' && S.profiles.lali.role==='user');
ok('P3 — migration : progression existante → Maël', S.profiles.mael.mastered.escalade.indexOf('e1')>=0 && S.profiles.mael.srs[someCard.id]);
ok('P4 — Maël hérite du hardMode existant', S.profiles.mael.hardMode===true);
ok('P5 — Alizée démarre vierge', (S.profiles.alizee.mastered.escalade||[]).length===0 && Object.keys(S.profiles.alizee.srs).length===0);
ok('P6 — profil actif par défaut = mael', S.currentProfile==='mael');

// ---- progression séparée : Alizée révise, Maël intact ----
L.activateProfile('alizee');
ok('P7 — bascule sur Alizée', store(legacy).currentProfile==='alizee');
L.reviewCard(drone.id,3);
S=store(legacy);
ok('P8 — la révision est écrite chez Alizée', !!S.profiles.alizee.srs[drone.id]);
ok('P9 — la progression de Maël est inchangée', !S.profiles.mael.srs[drone.id] && S.profiles.mael.mastered.escalade.indexOf('e1')>=0);
ok('P10 — stats Alizée : 1 révision + 1 jour actif', S.profiles.alizee.stats.reviews===1 && S.profiles.alizee.stats.days.length===1);

// startQueue compte une série
L.startQueue([drone]);
ok('P11 — startQueue incrémente les séries', store(legacy).profiles.alizee.stats.sessions===1);

// ---- profileStats reflète le bon profil ----
const stA=L.profileStats(store(legacy).profiles.alizee);
const stM=L.profileStats(store(legacy).profiles.mael);
ok('P12 — profileStats : niveau et % par profil', typeof stA.level==='string' && stM.masteredN>stA.masteredN);
ok('P13 — profileStats expose lacunes (fragile/retard/weakest)', 'fragile' in stA && 'retard' in stA && 'weakest' in stA);

// ---- accès sans code : ouverture directe, anciens codes inertes ----
const g=makeEnv({mastered:{}}); loadApp(g); const G=g.ctx, GR=g.reg;
const feed=(digits)=>{ String(digits).split('').forEach(d=>G.pinPress(d)); G.pinComplete(); };
ok('PIN1 — hashPin déterministe et distinctif (jetons d’accès)', G.hashPin('1234')===G.hashPin('1234') && G.hashPin('1234')!==G.hashPin('0000'));
G.bindDevice('alizee'); G.openProfile('alizee');
ok('PIN2 — ouverture directe du compte, sans code', store(g).currentProfile==='alizee' && GR.scLanding.classList.contains('active'));
G.startSetPin('alizee'); feed('1111'); feed('1111');   // un ancien code posé jadis…
G.activateProfile('mael'); G.openProfile('alizee');
ok('PIN3 — un ancien code est ignoré (inerte)', store(g).currentProfile==='alizee');

// ---- gestion des comptes ----
ok('P16 — renommer un profil', G.renameProfile('lali','Lali B.') && store(g).profiles.lali.name==='Lali B.');
ok('P17 — renommer vide est ignoré', G.renameProfile('lali','   ')===false && store(g).profiles.lali.name==='Lali B.');
// reset : on garnit Maël puis on réinitialise
L.activateProfile('mael'); L.reviewCard(drone.id,2);
ok('P18 — Maël a une révision avant reset', !!store(legacy).profiles.mael.srs[drone.id]);
L.resetProfile('mael');
S=store(legacy);
ok('P19 — reset vide mastered + srs + stats', Object.keys(S.profiles.mael.srs).length===0 && (S.profiles.mael.mastered.escalade||[]).length===0 && S.profiles.mael.stats.reviews===0);
ok('P20 — reset du profil actif vide aussi les Sets vivants', L.profileStats(store(legacy).profiles.mael).masteredN===0);

// ---- persistance au rechargement ----
G.renameProfile('alizee','Zaza');
const re=makeEnv(store(g)); loadApp(re);
ok('P21 — profils persistés au rechargement', store(re).profiles.alizee.name==='Zaza' && store(re).profiles.lali.name==='Lali B.');

// ---- remise à zéro générale (une fois par appareil) ----
const w=makeEnv({ mastered:{}, deviceOwner:'mael',
  profiles:{ mael:{name:'Maël',role:'admin',mastered:{escalade:['e1','e2']},srs:{c1:{s:9}},hardMode:true,pin:'pXYZ',claimedAt:123,stats:{reviews:9,sessions:2,days:['2026-01-01'],createdAt:1,lastSeen:2}},
             alizee:{name:'Alizée',role:'user',mastered:{meca:['m1']},srs:{},pin:'pABC',stats:{reviews:3,sessions:1,days:[],createdAt:1,lastSeen:2}},
             lali:{name:'Lali',role:'user',mastered:{},srs:{},stats:{reviews:0,sessions:0,days:[],createdAt:1,lastSeen:0}} } });
loadApp(w); const WS=store(w);
ok('Z1 — progression et stats remises à zéro', (WS.profiles.mael.mastered.escalade||[]).length===0 && Object.keys(WS.profiles.mael.srs).length===0 && WS.profiles.mael.stats.reviews===0 && (WS.profiles.alizee.mastered.meca||[]).length===0);
ok('Z2 — codes et liaisons effacés', !WS.profiles.mael.pin && !WS.profiles.alizee.pin && !WS.profiles.mael.claimedAt && !WS.deviceOwner);
ok('Z3 — remise à zéro une seule fois (flag posé)', WS.profilesReset1===true && WS.currentProfile==='mael');

console.log('\n=== Bilan verif Profils & supervision :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
