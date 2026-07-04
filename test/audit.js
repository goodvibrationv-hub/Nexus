/* AUDIT COMPLET — Nexus Learn. Contrôles données, contenus, fiches, figs,
   hors-ligne, rétro-compat, FSRS, build, version. N'écrit rien : lecture seule. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus';
const P=f=>path.join(ROOT,f);
let PASS=0, WARN=0, FAIL=0; const warns=[], fails=[];
function ok(c,msg){ if(c){PASS++;} else {FAIL++; fails.push(msg); console.log('  ✗ FAIL :',msg);} }
function warn(c,msg){ if(!c){WARN++; warns.push(msg); console.log('  ⚠ WARN :',msg);} }
function head(t){ console.log('\n=== '+t+' ==='); }

/* ---------- charge les données (contexte simple) ---------- */
const dctx={window:{}}; vm.createContext(dctx);
for(const f of ['data_core.js','content_courses.js','cards.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),dctx,{filename:f});
const D=dctx.window.NEXUS_DATA, C=dctx.window.NEXUS_CONTENT, CARDS=dctx.window.NEXUS_CARDS;

/* ============ A. STRUCTURE DES DONNÉES ============ */
head('A. Structure des domaines & nœuds');
ok(D&&D.SKILLS&&D.FIG&&D.TIERS,'NEXUS_DATA a SKILLS, FIG, TIERS');
const allNodes=[], idCount={};
for(const [k,s] of Object.entries(D.SKILLS)){
  ok(s.icon&&s.name&&s.color&&s.meta&&Array.isArray(s.nodes),'domaine '+k+' a icon/name/color/meta/nodes');
  for(const n of s.nodes){ allNodes.push({...n,skill:k}); idCount[n.id]=(idCount[n.id]||0)+1; }
}
ok(Object.values(idCount).every(v=>v===1),'ids de nœuds uniques ('+Object.entries(idCount).filter(([,v])=>v>1).map(([k])=>k).join(',')+')');
const idSet=new Set(allNodes.map(n=>n.id));
for(const n of allNodes){
  ok(typeof n.id==='string'&&Number.isInteger(n.tier)&&n.tier>=0&&n.tier<=3,'nœud '+n.id+' tier valide');
  ok(Array.isArray(n.deps),'nœud '+n.id+' deps est un tableau');
  ok(['course','safety'].includes(n.kind),'nœud '+n.id+' kind valide');
  ok(n.t&&n.d&&n.src,'nœud '+n.id+' a t/d/src');
  ok(n.fig&&(n.fig in D.FIG),'nœud '+n.id+' fig existe ('+n.fig+')');
  for(const dep of n.deps){
    ok(idSet.has(dep),'nœud '+n.id+' dep existe ('+dep+')');
    const dn=allNodes.find(x=>x.id===dep);
    if(dn) ok(dn.skill===n.skill,'nœud '+n.id+' dep '+dep+' dans le même domaine');
  }
}
// pas de cycle (graphe des deps)
(function(){ let cyc=false; const state={};
  const visit=id=>{ if(state[id]==='done')return; if(state[id]==='seen'){cyc=true;return;} state[id]='seen';
    const nd=allNodes.find(x=>x.id===id); (nd?nd.deps:[]).forEach(visit); state[id]='done'; };
  allNodes.forEach(n=>visit(n.id)); ok(!cyc,'aucun cycle de dépendances');
})();
// tier >= max(tier des deps)
for(const n of allNodes){ const mx=Math.max(0,...n.deps.map(d=>{const x=allNodes.find(y=>y.id===d);return x?x.tier:0;}));
  warn(n.tier>=mx,'nœud '+n.id+' tier ('+n.tier+') >= max dep tier ('+mx+')'); }
console.log('  · '+Object.keys(D.SKILLS).length+' domaines, '+allNodes.length+' nœuds, '+Object.keys(D.FIG).length+' figs');

/* ============ B. CONTENUS ============ */
head('B. Contenus de cours');
for(const n of allNodes){ ok(n.id in C,'nœud '+n.id+' a un contenu'); }
for(const id of Object.keys(C)){ ok(idSet.has(id),'contenu '+id+' correspond à un nœud'); }
for(const [id,ct] of Object.entries(C)){
  const n=allNodes.find(x=>x.id===id); if(!n) continue;
  ok(ct.kind===n.kind,'contenu '+id+' kind cohérent ('+ct.kind+'/'+n.kind+')');
  ok(ct.title&&ct.lead&&ct.body,'contenu '+id+' a title/lead/body');
  for(const r of [...(ct.body||'').matchAll(/<FIG:(\w+)>/g)].map(m=>m[1])) ok(r in D.FIG,'contenu '+id+' <FIG:'+r+'> existe');
  if(n.kind==='course'){
    warn(/Pour aller plus loin/.test(ct.body),'contenu '+id+' section « Pour aller plus loin »');
    warn(/Erreurs fréquentes/.test(ct.body),'contenu '+id+' section « Erreurs fréquentes »');
    warn(/En pratique/.test(ct.body),'contenu '+id+' section « En pratique »');
  }
}

/* ============ C. FICHES ============ */
head('C. Fiches de révision');
const cardIds={}; const byNode={};
for(const c of CARDS){
  cardIds[c.id]=(cardIds[c.id]||0)+1;
  (byNode[c.node]=byNode[c.node]||[]).push(c);
  ok(['id','skill','node','stmt','explain'].every(f=>f in c),'fiche '+c.id+' a les champs de base');
  ok(c.skill in D.SKILLS,'fiche '+c.id+' skill existe ('+c.skill+')');
  ok(idSet.has(c.node),'fiche '+c.id+' node existe ('+c.node+')');
  const sk=D.SKILLS[c.skill]; if(sk) ok(sk.nodes.some(n=>n.id===c.node),'fiche '+c.id+' node appartient au skill');
  ok((c.stmt||'').trim().length>0&&(c.explain||'').trim().length>0,'fiche '+c.id+' stmt/explain non vides');
  const t=c.type||'tf'; ok(['tf','recall','cloze'].includes(t),'fiche '+c.id+' type valide ('+t+')');
  if(t==='tf') ok(typeof c.truth==='boolean','fiche tf '+c.id+' truth booléen');           // truth requis pour tf seulement
  if(t==='cloze'){ ok(/___/.test(c.stmt),'cloze '+c.id+' contient ___'); ok(Array.isArray(c.answers)&&c.answers.length,'cloze '+c.id+' answers'); }
  if(t==='recall') ok(!!c.answer,'recall '+c.id+' a answer');
}
ok(Object.values(cardIds).every(v=>v===1),'ids de fiches uniques ('+Object.entries(cardIds).filter(([,v])=>v>1).map(([k])=>k).join(',')+')');
for(const n of allNodes){
  const arr=byNode[n.id]||[]; ok(arr.length>=10,'nœud '+n.id+' >= 10 fiches ('+arr.length+')');
  const tf=arr.filter(c=>(c.type||'tf')==='tf').length;
  ok(tf>=10,'nœud '+n.id+' >= 10 fiches TF (pool de test) ('+tf+')');
  warn(tf>=15,'nœud '+n.id+' a 15 fiches TF (test plein) ('+tf+')');
  // doublons de stmt dans un nœud
  const stmts=arr.map(c=>c.stmt.trim().toLowerCase().replace(/\s+/g,' ')); ok(new Set(stmts).size===stmts.length,'nœud '+n.id+' aucun stmt dupliqué');
}
console.log('  · '+CARDS.length+' fiches, '+Object.keys(byNode).length+' nœuds couverts');

/* ============ D. ILLUSTRATIONS (FIG) ============ */
head('D. Illustrations SVG');
const usedFigs=new Set(); allNodes.forEach(n=>usedFigs.add(n.fig));
Object.values(C).forEach(ct=>[...(ct.body||'').matchAll(/<FIG:(\w+)>/g)].forEach(m=>usedFigs.add(m[1])));
for(const [k,svg] of Object.entries(D.FIG)){
  ok(/^<svg[\s>]/.test(svg)&&/<\/svg>$/.test(svg.trim()),'fig '+k+' est un SVG bien formé');
  ok(/viewBox=/.test(svg),'fig '+k+' a un viewBox');
}
for(const k of Object.keys(D.FIG)) warn(usedFigs.has(k),'fig '+k+' est référencée quelque part');

/* ============ E. HORS-LIGNE / SÉCURITÉ (fichier assemblé) ============ */
const pkg0=JSON.parse(fs.readFileSync(P('package.json'),'utf8'));
head('E. Hors-ligne & sécurité (build nexus_app_v'+pkg0.nexusVersion+'.html)');
const build=fs.readFileSync(P('nexus_app_v'+pkg0.nexusVersion+'.html'),'utf8');
ok(!/\{\{DATA_INJECT\}\}|\{\{APP_INJECT\}\}/.test(build),'aucun marqueur {{...}} résiduel');
// URLs externes hors namespaces SVG/XHTML
const urls=[...build.matchAll(/https?:\/\/[^"'\s)]+/g)].map(m=>m[0]).filter(u=>!/w3\.org/.test(u));
ok(urls.length===0,'aucune URL externe réseau ('+[...new Set(urls)].slice(0,3).join(' | ')+')');
ok(!/<script[^>]+src=/i.test(build),'aucun <script src> externe');
ok(!/<link[^>]+stylesheet/i.test(build),'aucun <link stylesheet> externe');
ok(!/@import\s+url\(/i.test(build),'aucun @import CSS');
ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket\s*\(|navigator\.serviceWorker/.test(build),'aucun appel réseau (fetch/XHR/WS/SW)');
ok(/localStorage/.test(build),'utilise localStorage (état local)');

/* ============ F. APP EN CONTEXTE (DOM simulé) : offline, rétro-compat, FSRS ============ */
head('F. Exécution app : offline, rétro-compat, FSRS');
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
  let net=0;
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{net++;throw new Error('net');},XMLHttpRequest:function(){net++;throw new Error('net');},
    Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,localStorage,_ls,net:()=>net}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }

// F1 offline au chargement
let e=makeEnv(); let loadErr=null; try{ loadApp(e);}catch(err){ loadErr=err.message; }
ok(!loadErr,'app se charge sans erreur'+(loadErr?' ('+loadErr+')':''));
ok(e.net()===0,'aucun appel réseau au chargement');
// F2 rétro-compat : ancienne sauvegarde sans srs, mastered conservé
let e2=makeEnv({mastered:{escalade:['e1','e2']}, orders:[], tasks:[]});
let ok2=true; try{ loadApp(e2);}catch(err){ ok2=false; }
ok(ok2,'charge une ancienne sauvegarde (sans srs) sans crash');
const saved2=JSON.parse(e2.localStorage.getItem('nexus_stable')||'{}');
ok(saved2.mastered&&(saved2.mastered.escalade||[]).includes('e1'),'progression « mastered » préservée à la migration');
// F3 FSRS : Easy > Again (intervalle plus long) sur carte neuve ; due dans le futur
let e3=makeEnv(); loadApp(e3); const c3=e3.ctx;
c3.reviewCard('AUDIT_A',1); c3.reviewCard('AUDIT_E',4);
const srs=JSON.parse(e3.localStorage.getItem('nexus_stable')).srs;
ok(srs.AUDIT_A&&srs.AUDIT_E,'reviewCard crée un état SRS');
ok(srs.AUDIT_A.due>Date.now()&&srs.AUDIT_E.due>Date.now(),'échéances dans le futur');
ok(srs.AUDIT_E.due>srs.AUDIT_A.due,'Facile programme plus loin que À revoir (FSRS cohérent)');
// F4 grade Good sur carte due repousse l'échéance
let e4=makeEnv(); loadApp(e4); const c4=e4.ctx;
c4.reviewCard('AUDIT_G',3); const d1=JSON.parse(e4.localStorage.getItem('nexus_stable')).srs.AUDIT_G.due;
ok(d1>Date.now(),'une révision programme la prochaine échéance');

/* ============ G. BUILD & VERSION ============ */
head('G. Build & cohérence de version');
const pkg=JSON.parse(fs.readFileSync(P('package.json'),'utf8'));
ok(fs.existsSync(P('nexus_app_v'+pkg.nexusVersion+'.html')),'build nexus_app_v'+pkg.nexusVersion+'.html existe');
const buildFile=fs.readFileSync(P('nexus_app_v'+pkg.nexusVersion+'.html'),'utf8');
ok(buildFile.length>50000,'build volumineux (mono-fichier complet)');
warn(fs.readFileSync(P('index.html'),'utf8').length===buildFile.length,'index.html == dernier build (info : synchronisé sur main, pas sur dev)');
warn(/TEST_LEN=15/.test(build),'test de validation à 15 questions présent dans le build');
warn(/rev-modes|modeEclair/.test(build),'modes de révision présents dans le build');
warn(/Le savais-tu/.test(build),'anecdotes « Le savais-tu ? » présentes dans le build');

/* ---------- BILAN ---------- */
console.log('\n================ BILAN AUDIT ================');
console.log('  PASS :',PASS,' | WARN :',WARN,' | FAIL :',FAIL);
if(fails.length){ console.log('\n  Échecs :'); fails.forEach(f=>console.log('   ✗',f)); }
if(warns.length){ console.log('\n  Avertissements ('+warns.length+') :'); warns.slice(0,20).forEach(w=>console.log('   ⚠',w)); if(warns.length>20)console.log('   … +'+(warns.length-20)); }
console.log('\n  Résultat :', FAIL===0?'✓ AUCUNE ERREUR BLOQUANTE':'✗ '+FAIL+' ERREUR(S)');
process.exit(FAIL?1:0);
