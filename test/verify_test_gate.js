/* Vérif e2e du test de validation durci : pilote le vrai code dans un DOM simulé (boîte noire). */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus';
let pass=0, fail=0;
function ok(name,cond){ if(cond){pass++; console.log('  ✓',name);} else {fail++; console.log('  ✗ ÉCHEC :',name);} }

function mkEl(id){
  const styleStore={}; const cls=new Set(); const qsa={}; const attrs={};
  const el={ id, tagName:'DIV', _html:'', _text:'', _class:'', children:[], dataset:{}, disabled:false, value:'', onclick:null, _qsa:qsa,
    style:new Proxy(styleStore,{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:c=>{cls.has(c)?cls.delete(c):cls.add(c);},_s:cls},
    get innerHTML(){return this._html;}, set innerHTML(v){this._html=v==null?'':String(v);},
    get textContent(){return this._text;}, set textContent(v){this._text=v==null?'':String(v);},
    get className(){return this._class;}, set className(v){this._class=v==null?'':String(v);},
    querySelectorAll(sel){return qsa[sel]||[];}, querySelector(sel){return (qsa[sel]||[])[0]||null;},
    appendChild(c){this.children.push(c);return c;}, removeChild(c){const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);return c;},
    setAttribute(k,v){attrs[k]=v;}, removeAttribute(k){delete attrs[k];}, getAttribute(k){return attrs[k];},
    addEventListener(){}, removeEventListener(){}, focus(){}, blur(){} };
  return el;
}
function makeEnv(){
  const reg={};
  const $id=id=>{ if(!reg[id]) reg[id]=mkEl(id); return reg[id]; };
  function kids(spec){ return spec.map(d=>{const e=mkEl('_btn'); Object.assign(e.dataset,d); return e;}); }
  const tcChoiceKids=kids([{v:'true'},{v:'false'}]);
  $id('fcChoice')._qsa['.vf']=kids([{v:'true'},{v:'false'}]);
  $id('tcChoice')._qsa['.vf']=tcChoiceKids;
  $id('fcGrades')._qsa['.grade']=kids([{g:'1'},{g:'2'},{g:'3'},{g:'4'}]);
  const document={ getElementById:$id, createElement:t=>{const e=mkEl('_'+t);e.tagName=String(t).toUpperCase();return e;},
    documentElement:mkEl('html'), body:mkEl('body'), querySelectorAll:()=>[], addEventListener:()=>{} };
  const _ls=new Map();
  const localStorage={ getItem:k=>_ls.has(k)?_ls.get(k):null, setItem:(k,v)=>_ls.set(k,String(v)), removeItem:k=>_ls.delete(k), clear:()=>_ls.clear() };
  const windowObj={ scrollTo:()=>{}, addEventListener:()=>{}, matchMedia:()=>({matches:false,addEventListener(){}}) };
  const ctx={ window:windowObj, document, localStorage, console, setTimeout:()=>0, clearTimeout:()=>{},
    fetch:()=>{throw new Error('réseau interdit');}, Math, Date, JSON, parseInt, parseFloat, isNaN, Object, Array, String, Number, Boolean, RegExp, Set, Map };
  vm.createContext(ctx);
  return { ctx, reg, tcChoiceKids, localStorage };
}
function loadApp(env){
  for(const f of ['data_core.js','content_courses.js','cards.js','app.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), env.ctx, {filename:f});
}
const progN = env => { const m=/\/\s*(\d+)/.exec(env.reg['testProgress'].textContent||''); return m?+m[1]:0; };
const truthMap = (c,nodeId) => { const m={}; c.window.NEXUS_CARDS.forEach(x=>{ if(x.node===nodeId) m[x.stmt]=x.truth; }); return m; };
function pickKid(env, val){ return env.tcChoiceKids.find(k=>k.dataset.v===String(val)); }
function tcNext(env){ env.reg['tcNext'].onclick(); }

// ---- PASS : répondre juste à toutes → nœud validé, aucune correction fuitée ----
(function(){
  const env=makeEnv(); loadApp(env); const c=env.ctx;
  const k='camdrone'; const n=c.window.NEXUS_DATA.SKILLS[k].nodes.find(x=>x.id==='c8');
  const tm=truthMap(c,'c8');
  c.startTest(k,n);
  const N=progN(env);
  ok('P1 — 15 questions', N===15);
  let leaked=false;
  for(let i=0;i<N;i++){
    const stmt=env.reg['tcQ'].textContent;
    pickKid(env, tm[stmt]).onclick();
    const p=env.reg['tcPicked'].textContent;
    if(!/Réponse enregistrée/.test(p) || /Correct|Incorrect|✓|✗/.test(p)) leaked=true;
    tcNext(env);
  }
  ok('P2 — aucune correction pendant le test', !leaked);
  ok('P3 — « Cours validé ! »', env.reg['trTitle'].textContent==='Cours validé !');
  const saved=JSON.parse(env.localStorage.getItem('nexus_stable')||'{}');
  ok('P4 — c8 acquis et persisté', (saved.mastered&&saved.mastered[k]||[]).includes('c8'));
  ok('P5 — pas de bilan de révision au succès', env.reg['trReview'].innerHTML==='');
})();

// ---- FAIL : une réponse fausse → non validé + bilan ciblé ----
(function(){
  const env=makeEnv(); loadApp(env); const c=env.ctx;
  const k='drone'; const n=c.window.NEXUS_DATA.SKILLS[k].nodes.find(x=>x.id==='d2');
  const tm=truthMap(c,'d2');
  c.startTest(k,n); const N=progN(env);
  for(let i=0;i<N;i++){
    const stmt=env.reg['tcQ'].textContent;
    const val=(i===0)?(!tm[stmt]):tm[stmt];   // 1re fausse
    pickKid(env, val).onclick();
    tcNext(env);
  }
  ok('F1 — « Pas encore »', env.reg['trTitle'].textContent==='Pas encore');
  ok('F2 — message « 1 erreur »', /1 erreur/.test(env.reg['trMsg'].textContent));
  const kids=env.reg['trReview'].children;            // le mock reflète appendChild dans children
  ok('F3 — bilan liste 1 affirmation ratée', kids.length===1 && kids[0].className==='test-miss');
  const inner=kids.length?kids[0].innerHTML:'';
  ok('F4 — bonne réponse + explication affichées', /Bonne réponse/.test(inner)&&/tm-e/.test(inner));
  const saved=JSON.parse(env.localStorage.getItem('nexus_stable')||'{}');
  ok('F5 — nœud NON validé', !((saved.mastered&&saved.mastered[k]||[]).includes('d2')));
})();

// ---- tirage frais entre tentatives ----
(function(){
  const env=makeEnv(); loadApp(env); const c=env.ctx;
  const k='camdrone'; const n=c.window.NEXUS_DATA.SKILLS[k].nodes.find(x=>x.id==='c1');
  c.startTest(k,n); const first=env.reg['tcQ'].textContent;
  let diff=false;
  for(let t=0;t<12;t++){ c.startTest(k,n); if(env.reg['tcQ'].textContent!==first){ diff=true; break; } }
  ok('R1 — tirage renouvelé entre tentatives', diff);
})();

console.log('\n=== Bilan verif test durci :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
