/* e2e Dictionnaire de phrases occitan : volume, structure, bannière, rendu, recherche. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const cls=new Set();
  return { id,_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,oninput:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:()=>{}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);this.children.length=0;},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll:()=>[],querySelector:()=>null,appendChild(c){this.children.push(c);return c;},setAttribute(){},getAttribute(){},addEventListener(){},focus(){},click(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>mkEl('_'+t),documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','occitan_phrases.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx, R=env.reg;
const PH=c.window.OCCITAN_PHRASES;
const total=PH.reduce((a,g)=>a+g.items.length,0);

ok('OP1 — au moins 100 phrases', total>=100);
ok('OP2 — ≥10 catégories nommées avec icône', PH.length>=10 && PH.every(g=>g.cat&&g.ic));
ok('OP3 — chaque phrase a occitan (o) + français (f)', PH.every(g=>g.items.every(it=>it.o&&it.f)));
ok('OP4 — pas de doublon de phrase occitane', (()=>{ const s=new Set(); let dup=false; PH.forEach(g=>g.items.forEach(it=>{ if(s.has(it.o)) dup=true; s.add(it.o); })); return !dup; })());

// bannière dans le domaine occitan
c.openDomain('occitan');
ok('OP5 — bannière « Dictionnaire de phrases » dans le domaine', R.tree.children.some(x=>/Dictionnaire de phrases/.test(x._html)&&new RegExp(total+' phrases').test(x._html)));

// rendu du dictionnaire
c.renderOccitanPhrases();
const h=R.atfBody.innerHTML;
ok('OP6 — champ de recherche + liste rendus', /id="occSearch"/.test(h) && /id="occList"/.test(h) && /phr-row/.test(h));
ok('OP7 — écran scAtelierFlow activé', R.scAtelierFlow.classList.contains('active'));
ok('OP8 — toutes les phrases affichées sans filtre', (R.atfBody.innerHTML.match(/phr-row/g)||[]).length===total);
const search=q=>{ R.occSearch.value=q; R.occSearch.oninput(); return R.occList.innerHTML; };
// recherche (accents ignorés) : « merce » doit trouver « Mercé »
let r=search('merce');
ok('OP9 — recherche insensible aux accents (merce → Mercé)', /Mercé/.test(r) && (r.match(/phr-row/g)||[]).length<total);
// recherche côté français
ok('OP10 — recherche en français (combien)', /Quant còsta/.test(search('combien')));
// recherche sans résultat
ok('OP11 — message si aucun résultat', /Cap de frasa trobada/.test(search('zzzptdr')));
// l'input filtre la liste en gardant le champ (pas de rechargement d'écran)
ok('OP12 — l’input filtre la liste sans recharger l’écran', /Bonjorn/.test(search('bonjorn')) && /id="occSearch"/.test(R.atfBody.innerHTML));

console.log('\n=== Bilan verif Dictionnaire occitan :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
