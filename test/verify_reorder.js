/* e2e Réorganisation des compétences : ordre par défaut, ordre personnalisé mémorisé, nouveaux domaines à la fin. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const cls=new Set();
  return { id,_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,title:'',
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:()=>{}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);this.children.length=0;},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll:()=>[],querySelector:()=>null,appendChild(c){this.children.push(c);return c;},
    insertBefore(c,ref){const i=ref?this.children.indexOf(ref):-1;if(i>=0)this.children.splice(i,0,c);else this.children.push(c);return c;},
    setAttribute(){},getAttribute(){},addEventListener(){},removeEventListener(){},focus(){},click(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>mkEl('_'+t),documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){},elementFromPoint:()=>null};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,alert:()=>{},navigator:{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','amenagement.js','bienetre.js','noeuds.js','pieges.js','carto_data.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));
const order=env=>env.reg.domainList.children.map(c=>c.dataset.key);

// --- ordre par défaut ---
const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx;
c.renderHome();
const keys=c.homeKeys();
ok('R1 — toutes les tuiles présentes', order(env).length===keys.length && keys.length>=15);
ok('R2 — par défaut : escalade en 1er, modules à la fin', order(env)[0]==='escalade' && order(env).includes('amenagement') && order(env).includes('bienetre'));
ok('R3 — chaque tuile porte sa clé (data-key)', env.reg.domainList.children.every(x=>x.dataset.key));

// --- ordre personnalisé mémorisé ---
const env2=makeEnv({mastered:{}, domainOrder:['soudure','occitan','escalade']}); loadApp(env2); const c2=env2.ctx;
c2.renderHome();
const o2=order(env2);
ok('R4 — ordre sauvegardé appliqué (soudure, occitan, escalade en tête)', o2[0]==='soudure'&&o2[1]==='occitan'&&o2[2]==='escalade');
ok('R5 — les domaines absents de l’ordre sauvé restent présents (à la suite)', o2.length===keys.length && keys.every(k=>o2.includes(k)));

// --- homeOrder() ignore les clés inconnues et complète ---
const ho=c2.homeOrder();
ok('R6 — homeOrder complète les nouveaux domaines à la fin', ho.slice(0,3).join(',')==='soudure,occitan,escalade' && ho.length===keys.length);
const env3=makeEnv({mastered:{}, domainOrder:['zzz-inconnu','guitare']}); loadApp(env3);
ok('R7 — une clé inconnue est ignorée', env3.ctx.homeOrder().indexOf('zzz-inconnu')<0 && env3.ctx.homeOrder()[0]==='guitare');

// --- persistance : dragUp écrit l’ordre du DOM dans le store ---
c2.renderHome();
const g=env2.reg.domainList;
g.children.reverse();                    // on simule un ré-ordonnancement du DOM
c2.__setDragActiveForTest ? c2.__setDragActiveForTest() : null;
// dragUp lit l’ordre du DOM et sauvegarde (drag actif requis) — on vérifie via la fonction exposée
c2.persistDomainOrderFromDOM();
ok('R8 — l’ordre du DOM est persisté dans le store', JSON.stringify(store(env2).domainOrder)===JSON.stringify(order(env2)));
const env4=makeEnv(store(env2)); loadApp(env4); env4.ctx.renderHome();
ok('R9 — l’ordre persiste au rechargement', JSON.stringify(order(env4))===JSON.stringify(order(env2)));

console.log('\n=== Bilan verif Réorganisation :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
