/* e2e Nœuds : catalogue, tuile accueil, recherche, « je le sais » persisté. */
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
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','noeuds.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx, R=env.reg;
const N=c.window.NOEUDS;
const total=N.cats.reduce((a,g)=>a+g.noeuds.length,0);

ok('K1 — catalogue : ≥8 familles, ≥25 nœuds', N.cats.length>=8 && total>=25);
ok('K2 — chaque nœud : nom, difficulté, usage, étapes', N.cats.every(g=>g.noeuds.every(k=>k.n&&k.diff&&k.usage&&k.faire.length)));
ok('K3 — grands classiques présents', JSON.stringify(N).match(/chaise/i) && /huit/i.test(JSON.stringify(N)) && /cabestan/i.test(JSON.stringify(N)) && /Prusik/i.test(JSON.stringify(N)));

// tuile accueil
c.renderHome();
ok('K4 — tuile Nœuds sur l’accueil', R.domainList.children.some(x=>/Nœuds/.test(x._html)));
ok('K5 — pas un cours (aucun nœud SKILLS ni fiche)', !c.window.NEXUS_DATA.SKILLS.noeud && !c.window.NEXUS_CARDS.some(x=>x.skill==='noeud'));

// rendu catalogue + recherche
c.renderNoeuds();
const h=R.atfBody.innerHTML;
ok('K6 — recherche + liste + compteur connus', /id="nkSearch"/.test(h) && /id="nkList"/.test(h) && /0 \/ /.test(h) && /data-nk=/.test(h));
ok('K7 — écran activé', R.scAtelierFlow.classList.contains('active'));
const search=q=>{ R.nkSearch.value=q; R.nkSearch.oninput(); return R.nkList.innerHTML; };
ok('K8 — recherche par nom (chaise)', /chaise/i.test(search('chaise')) && (search('chaise').match(/dep-item/g)||[]).length<total);
ok('K9 — recherche par usage (arrimage)', /camionneur/i.test(search('arrimage')));
ok('K10 — recherche vide → message', /Aucun nœud/.test(search('zzzptdr')));

// « je le sais » : persistance + compteur
c._nkQ=''; c.renderNoeuds();
const st=c.noeudS(); const key=c.noeudKey('Nœud de chaise'); st.known[key]=1; c.saveStore();
ok('K11 — progression comptée', c.noeudProgress().done===1 && c.noeudProgress().total===total);
const env2=makeEnv(store(env)); loadApp(env2);
ok('K12 — « je le sais » persisté au rechargement', !!env2.ctx.noeudS().known[key]);

console.log('\n=== Bilan verif Nœuds :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
