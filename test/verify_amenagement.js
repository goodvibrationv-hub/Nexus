/* e2e Aménagement de camion : tuile accueil, hub modules, étapes cochables, liens domaines, astuces, persistance. */
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
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','amenagement.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx, R=env.reg;
const A=c.window.AMENAGEMENT;

// ---- données ----
ok('M1 — 10 modules, tous avec key/ic/titre/résumé', A && A.modules.length===10 && A.modules.every(m=>m.key&&m.ic&&m.t&&m.s));
const nEt=A.modules.reduce((a,m)=>a+m.etapes.length,0);
ok('M2 — au moins 40 étapes, chacune avec titre + détail', nEt>=40 && A.modules.every(m=>m.etapes.every(e=>e.t&&e.d)));
ok('M3 — des conseils et des exemples présents', A.modules.every(m=>m.etapes.some(e=>e.conseils&&e.conseils.length)) && A.modules.filter(m=>m.etapes.some(e=>e.ex)).length>=5);
const liens=[].concat(...A.modules.map(m=>[].concat(...m.etapes.map(e=>e.liens||[]))));
ok('M4 — liens vers des domaines existants (bois, soudure, g270, meca…)', liens.length>=8 && liens.every(k=>c.window.NEXUS_DATA.SKILLS[k]) && liens.includes('bois') && liens.includes('soudure') && liens.includes('g270'));
const nAst=A.astuces.reduce((a,g)=>a+g.items.length,0);
ok('M5 — astuces : ≥6 thèmes et ≥25 astuces (titre + détail)', A.astuces.length>=6 && nAst>=25 && A.astuces.every(g=>g.cat&&g.items.every(x=>x.t&&x.d)));

// ---- accueil : tuile dédiée, PAS un cours ----
c.renderHome();
ok('M6 — tuile « Aménagement de camion » sur l’accueil', R.domainList.children.some(x=>/Aménagement de camion/.test(x._html)));
ok('M7 — compteur : 14 domaines', R.domainCount.textContent==='14 domaines');
ok('M8 — pas un cours : aucun nœud SKILLS ni fiche ajoutés', !c.window.NEXUS_DATA.SKILLS.amenagement && !c.window.NEXUS_CARDS.some(x=>x.skill==='amenagement'));

// ---- hub des modules ----
c.renderAmenHub();
const hub=R.atfBody.innerHTML;
ok('M9 — hub : bannière Meilleures astuces + 10 modules listés', /data-amast/.test(hub) && (hub.match(/data-ammod=/g)||[]).length===10);
ok('M10 — hub : progression 0 / total affichée', new RegExp('0 / '+nEt+' étapes faites').test(hub));
ok('M11 — écran scAtelierFlow activé', R.scAtelierFlow.classList.contains('active'));

// ---- un module : étapes cochables + conseils + exemple + domaines liés ----
c.renderAmenModule('electricite');
const md=R.atfBody.innerHTML;
ok('M12 — module élec : étapes cochables (data-amst) + conseils + exemple', /data-amst="0"/.test(md) && /mod-tips/.test(md) && /mod-ex/.test(md));
ok('M13 — module élec : chip vers le domaine G270', /data-dom="g270"/.test(md) && /Camion G270/.test(md));
ok('M14 — module élec : renvoi au module suivant (eau)', /data-amnext="eau"/.test(md));

// ---- cocher une étape : persistance + compteurs ----
const st=c.amenS(); st.done['electricite_0']='2026-07-12'; c.saveStore();
c.renderAmenModule('electricite',true);
ok('M15 — étape cochée : compteur 1 / 5 + case marquée', /1 \/ 5 faite/.test(R.atfBody.innerHTML) && /pan-chk on/.test(R.atfBody.innerHTML));
c.renderAmenHub();
ok('M16 — hub : le module élec affiche 1 / 5', />1 \/ 5</.test(R.atfBody.innerHTML));
ok('M17 — progression globale à jour', c.amenProgress().done===1 && c.amenProgress().total===nEt);
const env2=makeEnv(store(env)); loadApp(env2);
ok('M18 — état persisté au rechargement', env2.ctx.amenS().done['electricite_0']==='2026-07-12');

// ---- dernier module : pas de suivant ----
c.renderAmenModule('homologation');
ok('M19 — dernier module : message de fin, pas de suivant', !/data-amnext/.test(R.atfBody.innerHTML) && /Dernier module/.test(R.atfBody.innerHTML));

// ---- onglet astuces ----
c.renderAstuces();
const as=R.atfBody.innerHTML;
ok('M20 — astuces : thèmes + items dépliables', /Gain de place/.test(as) && /Erreurs classiques/.test(as) && (as.match(/dep-item arb/g)||[]).length===nAst);

console.log('\n=== Bilan verif Aménagement :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
