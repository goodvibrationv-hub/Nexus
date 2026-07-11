/* e2e écran Progrès : niveau + indicateurs + coaching, avec données simulées. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const st={},cls=new Set(),qsa={},at={};
  return { id,tagName:'DIV',_html:'',_text:'',_class:'',children:[],dataset:{},disabled:false,value:'',onclick:null,_qsa:qsa,
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
  $id('fcGrades')._qsa['.grade']=kids([{g:'1'},{g:'2'},{g:'3'},{g:'4'}]);
  const document={getElementById:$id,createElement:t=>{const e=mkEl('_'+t);e.tagName=String(t).toUpperCase();return e;},documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }

// 1) charge une fois pour récupérer des ids de fiches réels
const probe=makeEnv(); loadApp(probe);
const CARDS=probe.ctx.window.NEXUS_CARDS;
const esc=CARDS.filter(c=>c.skill==='escalade').slice(0,6).map(c=>c.id);
const mec=CARDS.filter(c=>c.skill==='meca').slice(0,4).map(c=>c.id);
const DAY=86400000, now=Date.now();
const srs={};
esc.slice(0,4).forEach(id=>srs[id]={s:30,d:5,due:now+30*DAY,reps:5});   // solides, à jour
esc.slice(4,6).forEach(id=>srs[id]={s:3,d:8,due:now-2*DAY,reps:1});      // fragiles + en retard
mec.slice(0,2).forEach(id=>srs[id]={s:2,d:9,due:now-5*DAY,reps:1});      // meca en retard (négligé)
const seed={ mastered:{escalade:['e1','e2','e3','e4','e5','e6','e7','e8'], meca:['m1','m2']}, srs, profilesReset1:true };

// 2) recharge avec les données simulées et rend l'écran
const env=makeEnv(seed); loadApp(env); const c=env.ctx;
c.renderProgress();
const R=env.reg;
ok('L1 — niveau nommé (palier)', ['Novice','Débutant','Apprenti','Confirmé','Avancé','Expert'].includes(R.lvlName.textContent));
ok('L2 — sous-titre nœuds maîtrisés', /10 nœuds maîtrisés sur 82/.test(R.lvlSub.textContent));
ok('L3 — barre de niveau à ~12%', /^1[234]%$/.test(R.lvlBar.style.width||''));
ok('L4 — prochain palier indiqué', /Plus que .* pour/.test(R.lvlNext.textContent));
const win=R.winGrid.innerHTML, gap=R.gapGrid.innerHTML, tips=R.proTips.innerHTML;
ok('V1 — victoire nœuds maîtrisés 10/82', /10 \/ 82/.test(win)&&/nœuds maîtrisés/.test(win));
ok('V2 — 1 domaine complété (escalade)', /1 \/ \d+/.test(win)&&/domaines complétés/.test(win));
ok('V3 — 4 fiches solides', /class="v">4<\/span><span class="l">fiches solides/.test(win));
ok('V4 — révisions faites comptées', /révisions faites/.test(win));
ok('G1 — nœuds à débloquer 72', /72<\/span><span class="l">nœuds à débloquer/.test(gap));
ok('G2 — fiches fragiles comptées (>=4)', /fiches fragiles/.test(gap));
ok('G3 — fiches en retard comptées (>=4)', /fiches en retard/.test(gap));
ok('C1 — un conseil parle des fiches en retard', /en retard/.test(tips));
ok('C2 — un conseil cite un domaine faible ou négligé', /retrait|délaisses/.test(tips));
ok('C3 — au plus 4 conseils', (tips.match(/class="tip"/g)||[]).length<=4 && (tips.match(/class="tip"/g)||[]).length>=1);

// 3) cas vierge : aucune progression → conseil de démarrage
const env0=makeEnv(); loadApp(env0); env0.ctx.renderProgress();
ok('C4 — profil vierge : conseil de démarrage', /Valide un premier cours|Commence à apprendre/.test(env0.reg.proTips.innerHTML));
ok('N1 — profil vierge : niveau Novice', env0.reg.lvlName.textContent==='Novice');

console.log('\n=== Bilan verif Progrès :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
