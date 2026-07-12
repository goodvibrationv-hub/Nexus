/* e2e Cordiste + Élagage : domaines présents, cours, guide par arbre. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };
function mkEl(id){ const cls=new Set();
  return { id,_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:()=>{}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll:()=>[],querySelector:()=>null,appendChild(c){this.children.push(c);return c;},setAttribute(){},getAttribute(){},addEventListener(){},focus(){},click(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>mkEl('_'+t),documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','elagage_guide.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx, R=env.reg;
const D=c.window.NEXUS_DATA, CARDS=c.window.NEXUS_CARDS;
ok('E1 — domaines cordiste et élagage présents', !!D.SKILLS.cordiste && !!D.SKILLS.elagage);
ok('E2 — 7 nœuds chacun, avec un encadré sécurité', D.SKILLS.cordiste.nodes.length===7 && D.SKILLS.elagage.nodes.length===7 && D.SKILLS.cordiste.nodes[0].kind==='safety' && D.SKILLS.elagage.nodes[0].kind==='safety');
ok('E3 — ≥10 fiches par nœud', ['r1','r4','r6','l1','l3','l5'].every(n=>CARDS.filter(x=>x.node===n).length>=10));
ok('E4 — contenu cordiste : règle des deux cordes', /deux cordes/i.test(c.window.NEXUS_CONTENT.r1.body));
ok('E5 — contenu élagage : col de branche + coupe 3 temps', /col de branche/i.test(c.window.NEXUS_CONTENT.l2.body) && /3 temps/.test(c.window.NEXUS_CONTENT.l3.body));
// guide par arbre
ok('E6 — guide : ≥15 arbres classés par type', c.window.ELAG_GUIDE.reduce((a,g)=>a+g.arbres.length,0)>=15 && c.window.ELAG_GUIDE.some(g=>/Résineux/.test(g.cat)));
c.renderElagGuide();
const g=R.atfBody.innerHTML;
ok('E7 — guide rendu : groupes + arbres dépliables', /Feuillus durs — /.test(g) && /Résineux — /.test(g) && /dep-item arb/.test(g));
ok('E8 — fiche arbre : période, méthodes, piège', /Période/.test(g) && /Méthodes/.test(g) && /arb-warn/.test(g));
ok('E9 — pièges spécifiques présents (bouleau pleureur, cerisier été)', /saigne|pleureur/i.test(g) && /gommose/i.test(g));
console.log('\n=== Bilan verif Cordiste & Élagage :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
