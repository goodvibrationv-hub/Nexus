/* e2e Ateliers par domaine : couverture, bannière, check cochable persistée, memo, tips, reset. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const cls=new Set();
  return { id,_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,
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
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','dom_ateliers.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx, R=env.reg;
const DA=c.window.DOM_ATELIERS, SK=c.window.NEXUS_DATA.SKILLS;

// ---- couverture : tous les domaines sauf g270 (qui a son atelier complet) ----
const attendus=Object.keys(SK).filter(k=>k!=='g270');
ok('DA1 — un atelier pour chaque domaine (14, g270 exclu)', attendus.every(k=>DA[k]) && !DA.g270);
ok('DA2 — chaque atelier : sous-titre bannière + ≥3 sections', attendus.every(k=>DA[k].short&&DA[k].sub&&DA[k].sections.length>=3));
ok('DA3 — chaque atelier a 1 check + 1 memo + 1 tips', attendus.every(k=>{ const ts=DA[k].sections.map(s=>s.type);
  return ts.includes('check')&&ts.includes('memo')&&ts.includes('tips'); }));
ok('DA4 — items bien formés (check ≥5, memo q/a ≥4, clés de section)', attendus.every(k=>DA[k].sections.every(s=>{
  if(!s.k||!s.t) return false;
  if(s.type==='check') return s.items.length>=5 && s.items.every(x=>typeof x==='string');
  if(s.type==='memo')  return s.items.length>=4 && s.items.every(x=>x.q&&x.a);
  return s.items.length>=4; })));

// ---- bannière dans l'arbre du domaine ----
c.openDomain('escalade');
ok('DA5 — bannière « Atelier — aide pratique » dans le domaine', R.tree.children.some(x=>/Atelier — aide pratique/.test(x._html)&&/Check partenaire/.test(x._html)));
c.openDomain('g270');
const nb=R.tree.children.filter(x=>/Atelier — aide pratique/.test(x._html)).length;
ok('DA6 — g270 : un seul atelier (le sien), pas de doublon', nb===1);

// ---- rendu de l'atelier : check + memo + tips ----
c.renderDomAtelier('escalade');
const h=R.atfBody.innerHTML;
ok('DA7 — titre + sections check/memo/tips rendues', R.atfTitle.textContent==='Atelier — Escalade' && /data-dchk="pcheck_0"/.test(h) && /dep-item arb/.test(h) && /dat-tips/.test(h));
ok('DA8 — compteur de check à 0 au départ', /Check partenaire — avant CHAQUE montée — 0 \/ 7/.test(h));
ok('DA9 — écran scAtelierFlow activé', R.scAtelierFlow.classList.contains('active'));

// ---- cocher : persistance + compteur + bouton reset ----
const st=c.domAtelierS('escalade'); st.done.pcheck_0='2026-07-13'; st.done.pcheck_1='2026-07-13'; c.saveStore();
c.renderDomAtelier('escalade',true);
const h2=R.atfBody.innerHTML;
ok('DA10 — 2 items cochés : compteur 2 / 7 + cases marquées', /— 2 \/ 7/.test(h2) && /pan-chk on/.test(h2));
ok('DA11 — bouton « Tout décocher » proposé', /data-dreset="pcheck"/.test(h2));
ok('DA12 — état écrit dans le store', store(env).domAteliers.escalade.done.pcheck_0==='2026-07-13');
const env2=makeEnv(store(env)); loadApp(env2);
ok('DA13 — persistance au rechargement', env2.ctx.domAtelierS('escalade').done.pcheck_1==='2026-07-13');

// ---- contenu métier : sondages ----
ok('DA14 — soudure : règle des 30–40 A/mm dans les réglages', DA.soudure.sections.some(s=>s.items.some(x=>/30 à 40 A/.test(typeof x==='string'?x:x.a||''))));
ok('DA15 — drone : antenne VTX avant la LiPo dans le check', DA.drone.sections.find(s=>s.type==='check').items.some(x=>/ANTENNE VTX/.test(x)));
ok('DA16 — cordiste : syndrome du harnais dans les règles d’or', DA.cordiste.sections.some(s=>s.items.some(x=>/syndrome du harnais/.test(typeof x==='string'?x:x.a||''))));

// ---- domaine sans données chargées : pas de bannière (suites sans dom_ateliers.js) ----
const g=makeEnv({mastered:{}});
for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),g.ctx,{filename:f});
g.ctx.openDomain('escalade');
ok('DA17 — sans DOM_ATELIERS chargé, l’arbre reste sans bannière', !g.reg.tree.children.some(x=>/aide pratique/.test(x._html)));

console.log('\n=== Bilan verif Ateliers domaines :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
