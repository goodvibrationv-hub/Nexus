/* e2e Accès par lien personnel : activation, liaison appareil↔compte, première connexion, refus. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };
const djb2=s=>{ s=String(s); let h=5381; for(let i=0;i<s.length;i++) h=(((h<<5)+h)^s.charCodeAt(i))>>>0; return 'p'+h.toString(36); };
const TOK={ mael:'T-MAEL-01', alizee:'T-ALIZ-02', lali:'T-LALI-03' };   // jetons de test (injectés)

function mkEl(id){ const cls=new Set();
  return { id,_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,onchange:null,onkeydown:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:()=>{}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll:()=>[],querySelector:()=>null,appendChild(c){this.children.push(c);return c;},setAttribute(){},getAttribute(){},addEventListener(){},focus(){},click(){} }; }
function makeEnv(seed, opts){ opts=opts||{}; const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>mkEl('_'+t),documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const win={scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),
    location:{hash:opts.hash||'',pathname:'/nexus/',search:''},
    NEXUS_ACCESS:{ mael:djb2(TOK.mael), alizee:djb2(TOK.alizee), lali:djb2(TOK.lali) },
    NEXUS_PRESET:{ mael:djb2('1111'), alizee:djb2('2468'), lali:djb2('3333') }};
  const ctx={window:win,document,localStorage,console,alert:()=>{},prompt:()=>opts.promptVal,
    history:{replaceState(){},pushState(){}},
    setTimeout:(f)=>{f();return 0;},clearTimeout:()=>{},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));
const feed=(c,d)=>{ String(d).split('').forEach(x=>c.pinPress(x)); };

// ---- appareil vierge, sans lien : écran d'activation, rien d'ouvert ----
const v=makeEnv({mastered:{}}); loadApp(v);
ok('X1 — sans lien ni liaison : écran Activation', v.reg.scActivate.classList.contains('active'));
ok('X2 — aucun propriétaire lié', !store(v).deviceOwner);

// ---- première connexion par lien personnel : liaison + création du code ----
const a=makeEnv({mastered:{}}, {hash:'#acces='+TOK.alizee}); loadApp(a); const A=a.ctx;
ok('X3 — lien d’Alizée : appareil lié à alizee', store(a).deviceOwner==='alizee');
ok('X4 — date de première connexion enregistrée', !!store(a).profiles.alizee.claimedAt);
ok('X5 — première connexion : code de session pré-attribué et demandé', a.reg.scLock.classList.contains('active') && store(a).profiles.alizee.pin===A.hashPin('2468'));
feed(A,'0000');                                        // mauvais code refusé
ok('X5b — mauvais code refusé', store(a).currentProfile!=='alizee');
feed(A,'2468');                                        // code reçu avec le lien
ok('X6 — bon code : session ouverte sur SON compte', store(a).currentProfile==='alizee' && a.reg.scLanding.classList.contains('active'));

// ---- reboots suivants : direct sur SON compte, code exigé, pas de sélecteur ----
const a2=makeEnv(store(a)); loadApp(a2); const A2=a2.ctx;
ok('X7 — redémarrage : verrou du compte lié (pas de choix de compte)', a2.reg.scLock.classList.contains('active') && !a2.reg.scProfiles.classList.contains('active'));
ok('X8 — bouton Retour du verrou masqué (appareil lié)', a2.reg.lockCancel.style.display==='none');
feed(A2,'2468'); A2.pinComplete&&null;
ok('X9 — bon code : ouvre le compte du propriétaire', store(a2).currentProfile==='alizee');

// ---- le lien d'un AUTRE compte est refusé sur un appareil déjà lié ----
const b=makeEnv(store(a), {hash:'#acces='+TOK.lali}); loadApp(b);
ok('X10 — lien de Lali refusé : appareil reste à Alizée', store(b).deviceOwner==='alizee' && b.reg.scActivate.classList.contains('active') && /déjà lié/.test(b.reg.actMsg.textContent));

// ---- lien invalide refusé ----
const c2=makeEnv({mastered:{}}, {hash:'#acces=FAUX-JETON'}); loadApp(c2);
ok('X11 — lien invalide : pas de liaison', !store(c2).deviceOwner && c2.reg.scActivate.classList.contains('active'));

// ---- code parent : attribution manuelle (secours) ----
const d=makeEnv({mastered:{}}, {promptVal:'Lavieaufreyche'}); loadApp(d); const D=d.ctx;
d.reg.actParent.onclick();
ok('X12 — code parent ouvre l’attribution', d.reg.scProfiles.classList.contains('active'));
D.bindDevice('mael'); D.openProfile('mael');
ok('X13 — attribution : appareil lié à Maël, session ouverte', store(d).deviceOwner==='mael' && store(d).currentProfile==='mael');
// mauvais code parent
const e=makeEnv({mastered:{}}, {promptVal:'nope'}); loadApp(e);
e.reg.actParent.onclick();
ok('X14 — mauvais code parent : refus', !e.reg.scProfiles.classList.contains('active') && /incorrect/.test(e.reg.actMsg.textContent));

// ---- plus de changement de compte depuis l'accueil ----
const src=fs.readFileSync(P('app.js'),'utf8');
ok('X15 — le chip profil n’ouvre plus le sélecteur', !/profileChip'\)\)\s*\$\('profileChip'\)\.onclick=\(\)=>goProfiles/.test(src));

console.log('\n=== Bilan verif Accès personnel :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
