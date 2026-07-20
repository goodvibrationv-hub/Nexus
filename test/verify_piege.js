/* e2e Pièges à insectes : catalogue (mouches d'abord), tuile, recherche, « déjà fait » persisté. */
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
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','pieges.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx, R=env.reg;
const Pg=c.window.PIEGES;
const total=Pg.cats.reduce((a,g)=>a+g.items.length,0);

ok('G1 — les mouches sont la 1re catégorie', Pg.cats[0].cat==='Mouches' && Pg.cats[0].items.length>=3);
ok('G2 — ≥6 familles, ≥15 pièges', Pg.cats.length>=6 && total>=15);
ok('G2b — famille souris & rongeurs (tapette, capture vivante)', Pg.cats.some(g=>/rongeurs/i.test(g.cat)&&g.items.some(k=>/tapette/i.test(k.n))&&g.items.some(k=>/capture vivante/i.test(k.n))));
ok('G3 — chaque piège : nom, cible, matériel, étapes', Pg.cats.every(g=>g.items.every(k=>k.n&&k.cible&&k.materiel.length&&k.etapes.length)));
ok('G4 — note de protection des abeilles', /abeille/i.test(JSON.stringify(Pg)));

// tuile accueil
c.renderHome();
ok('G5 — tuile Pièges sur l’accueil', R.domainList.children.some(x=>/>Pièges</.test(x._html)));
ok('G6 — pas un cours', !c.window.NEXUS_DATA.SKILLS.piege && !c.window.NEXUS_CARDS.some(x=>x.skill==='piege'));

// rendu + recherche
c.renderPieges();
const h=R.atfBody.innerHTML;
ok('G7 — recherche + liste + compteur + mouches en tête', /id="pgSearch"/.test(h) && /Mouches/.test(h) && /data-pg=/.test(h) && /0 \/ /.test(h));
ok('G8 — écran activé', R.scAtelierFlow.classList.contains('active'));
const search=q=>{ R.pgSearch.value=q; R.pgSearch.oninput(); return R.pgList.innerHTML; };
ok('G9 — recherche par insecte (moustique)', /CO₂|levure/i.test(search('moustique')) && (search('moustique').match(/dep-item/g)||[]).length<total);
ok('G10 — recherche par méthode (vinaigre)', /vinaigre/i.test(search('vinaigre')));
ok('G11 — recherche vide → message', /Aucun piège/.test(search('zzzptdr')));

// « déjà fait » : persistance
c._pgQ=''; c.renderPieges();
const st=c.piegeS(); const key=c.piegeKey('Piège-bouteille à appât'); st.done[key]=1; c.saveStore();
ok('G12 — progression comptée', c.piegeProgress().done===1 && c.piegeProgress().total===total);
const env2=makeEnv(store(env)); loadApp(env2);
ok('G13 — « déjà fait » persisté au rechargement', !!env2.ctx.piegeS().done[key]);

console.log('\n=== Bilan verif Pièges :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
