/* e2e Sauvegarde / restauration : export, application, robustesse. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const cls=new Set();
  return { id,_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,onchange:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:()=>{}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll:()=>[],querySelector:()=>null,appendChild(c){this.children.push(c);return c;},setAttribute(){},getAttribute(){},addEventListener(){},click(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>mkEl('_'+t),documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),NEXUS_VERSION:'55'},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const seed={ animals:[{id:'a1',name:'Tina',noteLog:[{id:'n1',date:'2026-07-01',text:'test note'}],photos:[],care:[]}], woodStock:[{id:'l1',speciesKey:'chene',lengthCm:250,diamCm:30,volumeM3:0.17}], mastered:{}, ecuriesNote:'Rappel test' };
const env=makeEnv(seed); loadApp(env); const c=env.ctx;

// export
const bk=c.backupData();
ok('B1 — export : structure app/version/store', bk.app==='nexus-learn' && bk.version==='55' && typeof bk.store==='object');
ok('B2 — export contient les données (animaux + note + bois)', bk.store.animals[0].noteLog[0].text==='test note' && bk.store.woodStock[0].speciesKey==='chene');
ok('B3 — jauge de stockage > 0', c.storageBytes()>0);

// restauration valide
const other={ store:{ animals:[], woodStock:[], mastered:{}, ecuriesNote:'restauré' } };
ok('B4 — applyBackup (format {store}) accepte', c.applyBackup(other)===true && store(env).ecuriesNote==='restauré');
// restauration format brut (le store directement)
ok('B5 — applyBackup (store brut) accepte', c.applyBackup({animals:[{id:'x'}],mastered:{}})===true && store(env).animals[0].id==='x');
// round-trip complet
const env2=makeEnv(seed); const c2=env2.ctx; loadApp(env2);
const snapshot=c2.backupData();
c2.applyBackup({store:{animals:[],mastered:{}}});          // on écrase
ok('B6 — après écrasement, données différentes', store(env2).animals.length===0);
c2.applyBackup(snapshot);                                   // on restaure
ok('B7 — round-trip : restauration rétablit la note', store(env2).animals[0].noteLog[0].text==='test note');

// robustesse : entrées invalides refusées, sans corrompre
c.applyBackup({store:{animals:[{id:'keep'}],mastered:{}}});
ok('B8 — un backup invalide (null) est refusé', c.applyBackup(null)===false && store(env).animals[0].id==='keep');
ok('B9 — un backup invalide (tableau) est refusé', c.applyBackup([1,2,3])===false && store(env).animals[0].id==='keep');
ok('B10 — chaîne/nombre refusés', c.applyBackup('coucou')===false && c.applyBackup(42)===false);

console.log('\n=== Bilan verif Sauvegarde :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
