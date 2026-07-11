/* e2e Mode difficile : persistance, aides masquées, confiance anti-devinette. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const st={},cls=new Set(),qsa={},at={};
  return { id,tagName:'DIV',_html:'',_text:'',_class:'',children:[],dataset:{},disabled:false,value:'',checked:false,onclick:null,onchange:null,_qsa:qsa,
    style:new Proxy(st,{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:c=>{cls.has(c)?cls.delete(c):cls.add(c);}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    get className(){return this._class;},set className(v){this._class=v==null?'':String(v);},
    querySelectorAll(s){return qsa[s]||[];},querySelector(s){return (qsa[s]||[])[0]||null;},
    appendChild(c){this.children.push(c);return c;},removeChild(c){const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);return c;},
    setAttribute(k,v){at[k]=v;},removeAttribute(k){delete at[k];},getAttribute(k){return at[k];},addEventListener(){},removeEventListener(){},focus(){},blur(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const kids=sp=>sp.map(d=>{const e=mkEl('_b');Object.assign(e.dataset,d);return e;});
  const vf=kids([{v:'true'},{v:'false'}]);
  $id('fcChoice')._qsa['.vf']=vf; $id('tcChoice')._qsa['.vf']=kids([{v:'true'},{v:'false'}]);
  $id('fcGrades')._qsa['.grade']=kids([{g:'1'},{g:'2'},{g:'3'},{g:'4'}]);
  $id('fcConf')._qsa['.conf']=kids([{sure:'1'},{sure:'0'}]);
  const document={getElementById:$id,createElement:t=>{const e=mkEl('_'+t);e.tagName=String(t).toUpperCase();return e;},documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,vf,conf:$id('fcConf')._qsa['.conf']}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }

const probe=makeEnv(); loadApp(probe);
const TRUTH={}; probe.ctx.window.NEXUS_CARDS.filter(c=>c.skill==='camdrone').forEach(c=>TRUTH[c.stmt]=c.truth);
const cardByStmt={}; probe.ctx.window.NEXUS_CARDS.forEach(c=>cardByStmt[c.stmt]=c);

function dueOf(env,stmt){ const id=cardByStmt[stmt].id; const s=JSON.parse(env.ctx.localStorage.getItem('nexus_stable')).srs||{}; return s[id]?s[id].due:0; }

// --- Mode difficile activé ---
const env=makeEnv({hardMode:true, mastered:{}, profilesReset1:true});
loadApp(env); const c=env.ctx; const R=env.reg;
c.renderRevise();
ok('H1 — toggle reflète hardMode=true', R.hardToggle.checked===true);
c.startSession('camdrone');
ok('H2 — aucune aide visuelle (fig masquée)', R.fcFig.classList.contains('has-fig')===false);
// carte 1 : réponse juste + « Je maîtrisais »
let s1=R.fcQ.textContent; env.vf.find(b=>b.dataset.v===String(TRUTH[s1])).onclick();
ok('H3 — pas de note auto : confiance demandée', R.fcConf.style.display==='grid' && R.fcNext.style.display!=='block');
env.conf.find(b=>b.dataset.sure==='1').onclick();
ok('H4 — après confiance, fiche suivante dispo', R.fcNext.style.display==='block');
const dSure=dueOf(env,s1);
R.fcNext.onclick();
// carte 2 : réponse juste + « Au feeling »
let s2=R.fcQ.textContent; env.vf.find(b=>b.dataset.v===String(TRUTH[s2])).onclick();
env.conf.find(b=>b.dataset.sure==='0').onclick();
const dFeel=dueOf(env,s2);
R.fcNext.onclick();
// carte 3 : réponse fausse + « Je maîtrisais »
let s3=R.fcQ.textContent; env.vf.find(b=>b.dataset.v===String(!TRUTH[s3])).onclick();
env.conf.find(b=>b.dataset.sure==='1').onclick();
const dWrong=dueOf(env,s3);
ok('H5 — juste+sûr programme plus loin que juste+feeling', dSure>dFeel);
ok('H7 — les trois ont une échéance future', dSure>Date.now()&&dFeel>Date.now()&&dWrong>Date.now());

// --- Mode normal : note auto, pas de confiance ---
const en=makeEnv({hardMode:false, mastered:{}}); loadApp(en); const cn=en.ctx;
cn.renderRevise(); cn.startSession('camdrone');
const sn=en.reg.fcQ.textContent; en.vf.find(b=>b.dataset.v===String(TRUTH[sn])).onclick();
ok('N1 — mode normal : pas de confiance', en.reg.fcConf.style.display!=='grid');
ok('N2 — mode normal : note auto, suivante directe', en.reg.fcNext.style.display==='block');
ok('N3 — mode normal : aide visuelle possible après réponse', en.reg.fcFig.classList.contains('has-fig')===true);

// --- persistance du toggle ---
const et=makeEnv({mastered:{}}); loadApp(et); et.ctx.renderRevise();
et.reg.hardToggle.checked=true; et.reg.hardToggle.onchange();
ok('P1 — activer le toggle persiste hardMode', JSON.parse(et.ctx.localStorage.getItem('nexus_stable')).hardMode===true);

console.log('\n=== Bilan verif Mode difficile :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
