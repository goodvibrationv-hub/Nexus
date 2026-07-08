/* e2e Yoga (Esprit & Matières) : séances, postures, respiration, suivi. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const cls=new Set();
  return { id,_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,onchange:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:()=>{}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);this.children.length=0;},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll:()=>[],querySelector:()=>null,appendChild(c){this.children.push(c);return c;},setAttribute(){},getAttribute(){},addEventListener(){},click(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>mkEl('_'+t),documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),NEXUS_VERSION:'58'},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx;

// ---- données / calculs ----
ok('Y1 — 7 postures avec figure SVG', ['montagne','chien','guerrier','arbre','cobra','enfant','assise'].every(k=>c.poseByKey(k)&&/<svg/.test(c.poseByKey(k).fig)));
ok('Y2 — durée d’une séance = somme des étapes', c.seanceSec({steps:[{s:40},{s:20},{s:30}]})===90);
ok('Y3 — durée respiration = cycles × phases', c.breathTotal({cycles:30,phases:[{s:5},{s:5}]})===300 && c.breathTotal({cycles:8,phases:[{s:4},{s:7},{s:8}]})===152);
ok('Y4 — poseByKey retrouve une posture', c.poseByKey('arbre').n==='Arbre');

// ---- suivi : totaux + série ----
const log=[{date:'2026-07-08',type:'seance',label:'Réveil',sec:360},{date:'2026-07-07',type:'respiration',label:'CC',sec:300},{date:'2026-07-06',type:'seance',label:'Dos',sec:420}];
const t=c.yogaTotals(log);
ok('Y5 — totaux : 3 pratiques, 3 jours, temps cumulé', t.count===3 && t.days===3 && t.sec===1080);
ok('Y6 — série : 3 jours consécutifs incluant aujourd’hui', c.yogaStreak(log,'2026-07-08')===3);
ok('Y7 — série tolère aujourd’hui non fait (compte depuis hier)', c.yogaStreak([{date:'2026-07-07'},{date:'2026-07-06'}],'2026-07-08')===2);
ok('Y8 — série cassée = 0', c.yogaStreak([{date:'2026-07-06'}],'2026-07-08')===0);

// ---- log persiste ----
c.logYoga('manuel','Test',600);
ok('Y9 — logYoga ajoute et persiste', store(env).yoga.log.some(e=>e.label==='Test' && e.type==='manuel'));

// ---- rendus ----
c.rEsprit();
ok('Y10 — hub Esprit : tuile Yoga + Bientôt', /data-e="yoga"/.test(env.reg.espritTiles.innerHTML) && /Bientôt/.test(env.reg.espritTiles.innerHTML));
c.renderYogaHub();
ok('Y11 — hub Yoga : 4 accès', (env.reg.yogaTiles.innerHTML.match(/data-yv=/g)||[]).length===4);
c.renderYogaFlow('postures');
ok('Y12 — bibliothèque : 7 cartes postures', (env.reg.yfBody.innerHTML.match(/data-pose=/g)||[]).length===7);
c.renderYogaFlow('seances');
ok('Y13 — liste des séances : 3 routines', (env.reg.yfBody.innerHTML.match(/data-seance=/g)||[]).length===3);
c.renderYogaFlow('respiration');
ok('Y14 — respiration : 3 exercices', (env.reg.yfBody.innerHTML.match(/data-breath=/g)||[]).length===3);

// ---- lecteur de séance : déroule jusqu’au bout et log ----
const before=store(env).yoga.log.length;
c.startSeance('reveil');
ok('Y15 — le lecteur affiche minuteur + posture', /yp-timer/.test(env.reg.yfBody.innerHTML) && /yp-fig/.test(env.reg.yfBody.innerHTML));
let guard=0; while(guard++<2000){ c.tickSeance(); if(/Séance terminée/.test(env.reg.yfBody.innerHTML)) break; }
ok('Y16 — séance terminée après le minutage', /Séance terminée/.test(env.reg.yfBody.innerHTML));
ok('Y17 — la séance finie est enregistrée dans le suivi', store(env).yoga.log.length===before+1 && store(env).yoga.log.slice(-1)[0].type==='seance');

console.log('\n=== Bilan verif Yoga :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
