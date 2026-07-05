/* e2e Domaine du Freyche : section Écuries (chevaux + soins), ajout de soin. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const st={},cls=new Set(),qsa={},at={};
  return { id,tagName:'DIV',_html:'',_text:'',_class:'',children:[],dataset:{},disabled:false,value:'',checked:false,onclick:null,onchange:null,_qsa:qsa,
    style:new Proxy(st,{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:c=>{cls.has(c)?cls.delete(c):cls.add(c);}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    get className(){return this._class;},set className(v){this._class=v==null?'':String(v);},
    querySelectorAll(s){return qsa[s]||[];},querySelector(s){return (qsa[s]||[])[0]||null;},
    appendChild(c){this.children.push(c);return c;},removeChild(c){const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);return c;},
    setAttribute(k,v){at[k]=v;},removeAttribute(k){delete at[k];},getAttribute(k){return at[k];},addEventListener(){},removeEventListener(){},focus(){},blur(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const kids=sp=>sp.map(d=>{const e=mkEl('_b');Object.assign(e.dataset,d);return e;});
  $id('fcChoice')._qsa['.vf']=kids([{v:'true'},{v:'false'}]); $id('tcChoice')._qsa['.vf']=kids([{v:'true'},{v:'false'}]);
  $id('fcGrades')._qsa['.grade']=kids([{g:'1'},{g:'2'},{g:'3'},{g:'4'}]); $id('fcConf')._qsa['.conf']=kids([{sure:'1'},{sure:'0'}]);
  const document={getElementById:$id,createElement:t=>{const e=mkEl('_'+t);e.tagName=String(t).toUpperCase();return e;},documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }

const seed={ animals:[{id:'a1',name:'Éclipse',species:'Cheval',breed:'Selle Français',age:'8 ans',notes:'Ombrageux',care:[{id:'c1',type:'Vermifuge',date:'2026-06-01',next:'2026-12-01',note:''}]},
                     {id:'a2',name:'Bijou',species:'Poney',breed:'',age:'',notes:'',care:[]}], tasks:[], mastered:{} };
const env=makeEnv(seed); loadApp(env); const c=env.ctx; const R=env.reg;

// accueil du domaine : compteur d'animaux
c.navGo('stable');
ok('D1 — compteur Écuries reflète les animaux', /2 animaux/.test(R.optEcuriesCount.textContent));

// section Écuries
c.openStableSection('ecuries');
ok('D2 — titre de section = « Écuries »', R.ssTitle.textContent==='Écuries');
ok('D3 — bouton ajout = « + Ajouter un cheval »', R.ssAdd.textContent==='+ Ajouter un cheval');
ok('D4 — 2 fiches chevaux affichées', R.ssList.children.length===2);
const card0=R.ssList.children[0].innerHTML;
ok('D5 — 1re fiche montre le cheval', /Éclipse/.test(card0)&&/Selle Français/.test(card0));
ok('D6 — 1re fiche montre son soin', /Vermifuge/.test(card0));
ok('D7 — fiche sans soin affiche « Aucun soin »', /Aucun soin/.test(R.ssList.children[1].innerHTML));
ok('D8 — actions présentes (Modifier / + Soin / Supprimer)', /data-soin="a2"/.test(R.ssList.children[1].innerHTML));

// ajout d'un soin à Éclipse via le pré-ciblage
c.openCareModal('a1');
ok('D9 — modal soin pré-cible l\'animal', R.careAnimal.value==='a1');
R.cType.value='Parage'; R.cDate.value='2026-07-01'; R.cNext.value=''; R.cNote.value='pieds avant';
R.cSave.onclick();
ok('D10 — après ajout, la vue Écuries se re-rend (pas la section care)', R.ssTitle.textContent==='Écuries');
const saved=JSON.parse(env.ctx.localStorage.getItem('nexus_stable'));
const a1=saved.animals.find(a=>a.id==='a1');
ok('D11 — le soin est bien enregistré sur le bon cheval', a1.care.length===2 && a1.care.some(s=>s.type==='Parage'));
ok('D12 — le nouveau soin apparaît dans la fiche re-rendue', R.ssList.children.some(ch=>/Parage/.test(ch.innerHTML)));

// retour : la section Écuries revient au domaine (pas à la gestion) — vérifie via renderStableMenu intact
c.openGestion();
ok('D13 — la gestion reste accessible (menu rendu)', R.stableMenu.children.length>=5);

console.log('\n=== Bilan verif Domaine/Écuries :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
