/* e2e navigation : historique de retour + onglet Accueil + reset. */
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
  // bottomnav .navbtn se peuple via innerHTML ; on ne clique pas dessus ici
  $id('bottomnav')._qsa['.navbtn']=[];
  const document={getElementById:$id,createElement:t=>{const e=mkEl('_'+t);e.tagName=String(t).toUpperCase();return e;},documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx; const R=env.reg;
const active=id=>R[id]&&R[id].classList.contains('active');
const backLbl=()=>R.backLbl.textContent;
const backShown=()=>R.backBtn.style.display==='flex';

// au chargement : accueil, pas de retour
ok('N1 — démarre sur l\'accueil', active('scLanding'));
ok('N2 — pas de bouton retour à l\'accueil', !backShown());
ok('N3 — barre du bas mode apprentissage a 4 onglets (Accueil inclus)', /Accueil/.test(R.bottomnav.innerHTML)&&/Explorer/.test(R.bottomnav.innerHTML)&&/Réviser/.test(R.bottomnav.innerHTML)&&/Progrès/.test(R.bottomnav.innerHTML));

// accueil -> domaines
c.navGo('domains');
ok('N4 — écran domaines actif', active('scHome'));
ok('N5 — retour visible, libellé « accueil »', backShown()&&backLbl()==='accueil');

// domaines -> domaine -> cours
const esc=c.window.NEXUS_DATA.SKILLS.escalade; const n0=esc.nodes[0];
c.openDomain('escalade');
ok('N6 — écran domaine actif', active('scDetail'));
ok('N7 — retour = « domaines »', backLbl()==='domaines');
c.openCourse('escalade', n0);
ok('N8 — écran cours actif', active('scCourse'));
ok('N9 — retour = nom du domaine', backLbl()===esc.name);

// vrai retour : cours -> domaine -> domaines -> accueil
c.navBack();
ok('N10 — retour ramène au domaine', active('scDetail')&&backLbl()==='domaines');
c.navBack();
ok('N11 — retour ramène aux domaines', active('scHome')&&backLbl()==='accueil');
c.navBack();
ok('N12 — retour ramène à l\'accueil (retour caché)', active('scLanding')&&!backShown());

// onglet Accueil réinitialise depuis un écran profond
c.navGo('revise'); c.navGo('progress');
ok('N13 — navigation entre onglets empile', backShown());
c.navGo('landing');
ok('N14 — onglet Accueil ramène à l\'accueil et vide la pile', active('scLanding')&&!backShown());

// mode écuries : barre Accueil + Domaine ; retour depuis une section
c.navGo('stable');
ok('N15 — barre écuries = Accueil + Domaine', /Accueil/.test(R.bottomnav.innerHTML)&&/Domaine/.test(R.bottomnav.innerHTML)&&!/Explorer/.test(R.bottomnav.innerHTML));
c.openStableSection('ecuries');
ok('N16 — section Écuries active, retour = « domaine »', active('scStableSection')&&backLbl()==='domaine');
c.doBack();
ok('N17 — doBack (= bouton téléphone en mock) revient au domaine', active('scStable'));

// re-tap du même onglet ne ré-empile pas
c.navGo('landing');           // reset propre
c.navGo('domains');
c.navGo('domains');           // même onglet : dup-guard -> remplace, pas d'empilement
c.navBack();
ok('N18 — re-tap du même onglet ne ré-empile pas (retour direct à l\'accueil)', active('scLanding'));

console.log('\n=== Bilan verif navigation :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
