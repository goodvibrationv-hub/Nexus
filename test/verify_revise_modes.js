/* Vérif e2e des révisions récréatives : modes de session + « Le savais-tu ? ». */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus';
let pass=0, fail=0;
function ok(n,c){ if(c){pass++; console.log('  ✓',n);} else {fail++; console.log('  ✗ ÉCHEC :',n);} }

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
  const kids=spec=>spec.map(d=>{const e=mkEl('_btn'); Object.assign(e.dataset,d); return e;});
  const fcChoiceKids=kids([{v:'true'},{v:'false'}]);
  const fcGradeKids=kids([{g:'1'},{g:'2'},{g:'3'},{g:'4'}]);
  $id('fcChoice')._qsa['.vf']=fcChoiceKids;
  $id('tcChoice')._qsa['.vf']=kids([{v:'true'},{v:'false'}]);
  $id('fcGrades')._qsa['.grade']=fcGradeKids;
  const document={ getElementById:$id, createElement:t=>{const e=mkEl('_'+t);e.tagName=String(t).toUpperCase();return e;},
    documentElement:mkEl('html'), body:mkEl('body'), querySelectorAll:()=>[], addEventListener:()=>{} };
  const _ls=new Map();
  const localStorage={ getItem:k=>_ls.has(k)?_ls.get(k):null, setItem:(k,v)=>_ls.set(k,String(v)), removeItem:k=>_ls.delete(k), clear:()=>_ls.clear() };
  const ctx={ window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}, document, localStorage, console,
    setTimeout:()=>0, clearTimeout:()=>{}, fetch:()=>{throw new Error('réseau interdit');},
    Math, Date, JSON, parseInt, parseFloat, isNaN, Object, Array, String, Number, Boolean, RegExp, Set, Map };
  vm.createContext(ctx);
  return { ctx, reg, fcChoiceKids, fcGradeKids };
}
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), env.ctx, {filename:f}); }
const N = env => { const m=/\/\s*(\d+)/.exec(env.reg['revProgress'].textContent||''); return m?+m[1]:0; };
const nodeOfStmt = (env,stmt) => { const c=env.ctx.window.NEXUS_CARDS.find(x=>x.stmt===stmt); return c?c.node:null; };
function answerOne(env){
  if(env.reg['fcChoice'].style.display==='grid'){ env.fcChoiceKids[0].onclick(); }
  else { env.reg['fcReveal'].onclick(); env.fcGradeKids[2].onclick(); }
  env.reg['fcNext'].onclick();
}

// M1 — mode éclair plafonne à 7
(function(){ const env=makeEnv(); loadApp(env); const c=env.ctx; c.renderRevise();
  env.reg['modeEclair'].onclick();
  ok('M1 — mode éclair = 7 fiches', N(env)===7);
})();

// M2 — pioche du jour déterministe (même 1re carte à deux chargements le même jour)
(function(){ const e1=makeEnv(); loadApp(e1); e1.ctx.renderRevise(); e1.reg['modePioche'].onclick(); const a=e1.reg['fcQ'].textContent;
  const e2=makeEnv(); loadApp(e2); e2.ctx.renderRevise(); e2.reg['modePioche'].onclick(); const b=e2.reg['fcQ'].textContent;
  ok('M2 — pioche du jour déterministe', a && a===b);
  ok('M3 — pioche = 12 fiches', N(e1)===12);
})();

// M4 — spécial sécurité : la file ne contient que des nœuds de sécurité
(function(){ const env=makeEnv(); loadApp(env); const c=env.ctx;
  const SAFE=new Set(); Object.values(c.window.NEXUS_DATA.SKILLS).forEach(s=>s.nodes.forEach(n=>{ if(n.kind==='safety') SAFE.add(n.id); }));
  c.renderRevise(); env.reg['modeSafety'].onclick();
  let allSafe=true; const total=N(env);
  for(let i=0;i<total;i++){ const nd=nodeOfStmt(env, env.reg['fcQ'].textContent); if(!SAFE.has(nd)) allSafe=false; answerOne(env); }
  ok('M4 — spécial sécurité ne contient que des nœuds safety', allSafe && total>0);
})();

// M5/M6 — « Le savais-tu ? » affiché en fin de session, avec une anecdote réelle
(function(){ const env=makeEnv(); loadApp(env); const c=env.ctx;
  c.renderRevise(); env.reg['modeEclair'].onclick();
  for(let i=0;i<7;i++){ answerOne(env); }   // termine la session de 7
  ok('M5 — panneau « Le savais-tu ? » affiché en fin de session', env.reg['revFact'].style.display==='block');
  const t=env.reg['revFactTxt'].textContent;
  ok('M6 — anecdote non vide et plausible', typeof t==='string' && t.length>25 && /[.:]/.test(t));
})();

// M7 — une file vide (rien à revoir) ne démarre aucune session
(function(){ const env=makeEnv(); loadApp(env); const c=env.ctx;
  c.startQueue([]);
  const rp=c.document.getElementById('revProgress').textContent;
  ok('M7 — file vide ne démarre aucune session', rp==='');
})();

console.log('\n=== Bilan verif révisions récréatives :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
