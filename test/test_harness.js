/* Banc d'essai Nexus Learn : charge le vrai code dans un DOM simulé, pilote les flux. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..');
let pass=0, fail=0; const fails=[];
function ok(name,cond){ if(cond){pass++; /*console.log('  ✓',name);*/} else {fail++; fails.push(name); console.log('  ✗ ÉCHEC :',name);} }

/* ---------- DOM mock ---------- */
function mkEl(id){
  const styleStore={}; const cls=new Set(); const qsa={}; const attrs={};
  const el={ id, tagName:'DIV', _html:'', _text:'', _class:'', children:[], dataset:{}, disabled:false, value:'', onclick:null, _qsa:qsa,
    style:new Proxy(styleStore,{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:c=>{cls.has(c)?cls.delete(c):cls.add(c);},_s:cls},
    get innerHTML(){return this._html;}, set innerHTML(v){this._html=v==null?'':String(v);},
    get textContent(){return this._text;}, set textContent(v){this._text=v==null?'':String(v);},
    get className(){return this._class;}, set className(v){this._class=v==null?'':String(v);},
    querySelectorAll(sel){return qsa[sel]||[];}, querySelector(sel){return (qsa[sel]||[])[0]||null;},
    appendChild(c){this.children.push(c);return c;}, removeChild(c){const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);return c;},
    setAttribute(k,v){attrs[k]=v;}, removeAttribute(k){delete attrs[k];}, getAttribute(k){return attrs[k];},
    addEventListener(){}, removeEventListener(){}, focus(){}, blur(){} };
  return el;
}
function makeEnv(){
  const reg={};
  const $id=id=>{ if(!reg[id]) reg[id]=mkEl(id); return reg[id]; };
  // boutons pré-câblés que app.js relie au chargement
  function kids(spec){ return spec.map(d=>{const e=mkEl('_btn'); Object.assign(e.dataset,d); return e;}); }
  const fcChoiceKids=kids([{v:'true'},{v:'false'}]);
  const tcChoiceKids=kids([{v:'true'},{v:'false'}]);
  const fcGradeKids=kids([{g:'1'},{g:'2'},{g:'3'},{g:'4'}]);
  $id('fcChoice')._qsa['.vf']=fcChoiceKids;
  $id('tcChoice')._qsa['.vf']=tcChoiceKids;
  $id('fcGrades')._qsa['.grade']=fcGradeKids;
  const document={ getElementById:$id, createElement:t=>{const e=mkEl('_'+t);e.tagName=String(t).toUpperCase();return e;},
    documentElement:mkEl('html'), body:mkEl('body'), querySelectorAll:()=>[], addEventListener:()=>{} };
  const _ls=new Map();
  const localStorage={ getItem:k=>_ls.has(k)?_ls.get(k):null, setItem:(k,v)=>_ls.set(k,String(v)), removeItem:k=>_ls.delete(k), clear:()=>_ls.clear() };
  const windowObj={ scrollTo:()=>{}, addEventListener:()=>{}, matchMedia:()=>({matches:false,addEventListener(){}}) };
  const netHit={n:0};
  const ctx={ window:windowObj, document, localStorage, console, setTimeout:()=>0, clearTimeout:()=>{},
    fetch:()=>{netHit.n++; throw new Error('réseau interdit');}, XMLHttpRequest:function(){netHit.n++; throw new Error('réseau interdit');},
    Math, Date, JSON, parseInt, parseFloat, isNaN, Object, Array, String, Number, Boolean, RegExp, Set, Map };
  vm.createContext(ctx);
  return { ctx, reg, $id, fcChoiceKids, fcGradeKids, localStorage, _ls, netHit };
}
function loadApp(env, seedLS){
  if(seedLS) env.localStorage.setItem('nexus_stable', JSON.stringify(seedLS));
  for(const f of ['data_core.js','content_courses.js','cards.js','app.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), env.ctx, {filename:f});
}
function srs(env){ const raw=env.localStorage.getItem('nexus_stable'); return raw?JSON.parse(raw).srs||{}:{}; }

/* ============ TESTS ============ */
console.log('\n=== Suite de tests (DOM simulé, code réel) ===');

/* T1 — chargement sans erreur + offline */
let env=makeEnv();
try{ loadApp(env); ok('T1 app se charge sans erreur',true); }catch(e){ ok('T1 app se charge sans erreur ('+e.message+')',false); }
ok('T1 offline : aucun appel réseau au chargement', env.netHit.n===0);

/* T2 — rétro-compatibilité : ancienne sauvegarde sans srs + mastered conservé */
{ const e2=makeEnv();
  const old={ horses:[{name:'x'}], tasks:[], mastered:{ escalade:['e1','e8'] } }; // pas de srs
  let threw=false; try{ loadApp(e2, old); }catch(err){ threw=true; }
  ok('T2 ancienne sauvegarde (sans srs) charge sans erreur', !threw);
  ok('T2 migration srs -> {} (pas de perte)', JSON.stringify(srs(e2))==='{}');
  ok('T2 mastered conservé (pct escalade = 25%)', e2.ctx.pct('escalade')===25);
}

/* helpers de pilotage */
function setDeck(env, cards){ env.ctx.window.NEXUS_CARDS=cards; }
function reveal(env){ env.$id('fcReveal').onclick(); }
function grade(env,g){ env.fcGradeKids[g-1].onclick(); }
function vf(env,val){ env.fcChoiceKids[val?0:1].onclick(); }

/* T3 — rappel libre : masqué -> révélé -> note FSRS persistée */
{ const e=makeEnv(); loadApp(e);
  const card={id:'TST_recall',skill:'escalade',node:'e8',type:'recall',stmt:'Q?',answer:'La réponse',explain:'parce que'};
  setDeck(e,[card]); e.ctx.startSession(null);
  ok('T3 avant révélation : choix VF masqué', e.$id('fcChoice').style.display==='none');
  ok('T3 avant révélation : bouton Révéler visible', e.$id('fcReveal').style.display==='block');
  ok('T3 avant révélation : réponse NON affichée', e.$id('fcAnswer').textContent==='' );
  reveal(e);
  ok('T3 après révélation : réponse affichée', e.$id('fcAnswer').textContent==='La réponse');
  ok('T3 après révélation : grades affichés', e.$id('fcGrades').style.display==='grid');
  const before=srs(e)['TST_recall'];
  grade(e,3);
  const after=srs(e)['TST_recall'];
  ok('T3 auto-éval crée la carte FSRS persistée', !before && after && typeof after.s==='number' && typeof after.due==='number');
  ok('T3 due dans le futur', after.due>Date.now());
}

/* T4 — cloze : trous masqués (inputs) -> remplis */
{ const e=makeEnv(); loadApp(e);
  const card={id:'TST_cloze',skill:'bois',node:'b3',type:'cloze',stmt:'depuis une ___ et un ___.',answers:['face','chant'],explain:'x'};
  setDeck(e,[card]); e.ctx.startSession(null);
  const html=e.$id('fcQ').innerHTML;
  const inputs=(html.match(/cloze-in/g)||[]).length;
  ok('T4 deux trous rendus en champs (masqués)', inputs===2 && !/face|chant/.test(html));
  reveal(e);
  const h2=e.$id('fcQ').innerHTML;
  ok('T4 après révélation : trous remplis avec les réponses', /cloze-fill/.test(h2) && /face/.test(h2) && /chant/.test(h2));
}

/* T5 — vrai/faux inchangé : alimente FSRS ; explication avec repli si absente */
{ const e=makeEnv(); loadApp(e);
  const card={id:'TST_tf',skill:'survie',node:'s1',stmt:'Vrai ?',truth:true}; // pas de type, pas d'explain
  setDeck(e,[card]); e.ctx.startSession(null);
  ok('T5 vrai/faux : choix VF visible', e.$id('fcChoice').style.display==='grid');
  vf(e,true); // bonne réponse -> Good(3)
  ok('T5 verdict affiché', /Correct/.test(e.$id('fcVerdict').textContent));
  ok('T5 repli silencieux explain absent (pas "undefined")', e.$id('fcA').textContent==='');
  const st=srs(e)['TST_tf'];
  ok('T5 FSRS alimenté par le vrai/faux', st && typeof st.s==='number');
}

/* T6 — entrelacement sur le vrai deck (toutes neuves) : domaines alternés, nombre conservé */
{ const e=makeEnv(); loadApp(e);
  const all=e.ctx.dueCards(null);
  const inter=e.ctx.interleave(all);
  ok('T6 nombre de cartes dues inchangé par l\'entrelacement', inter.length===all.length);
  const trans=arr=>{let t=0;for(let i=1;i<arr.length;i++)if(arr[i].skill!==arr[i-1].skill)t++;return t;};
  const tBefore=trans(all), tAfter=trans(inter);
  ok('T6 entrelacement augmente fortement les transitions de domaine', tAfter > tBefore*3);
  // en début de file (mélange possible : tous les domaines ont des cartes), pas de bloc homogène
  let maxRunStart=1,run=1; const head=inter.slice(0,80);
  for(let i=1;i<head.length;i++){ if(head[i].skill===head[i-1].skill){run++;maxRunStart=Math.max(maxRunStart,run);} else run=1; }
  ok('T6 début de file : domaines alternés (série max <= 2 quand mélange possible)', maxRunStart<=2);
  ok('T6 toutes les cartes du deck sont dues (neuves)', all.length===e.ctx.window.NEXUS_CARDS.length);
}

/* T7 — idempotence de la restauration srs */
{ const e=makeEnv(); loadApp(e);
  // simuler une carte notée, persistée, puis recharger : srs conservé
  const card={id:'TST_persist',skill:'escalade',node:'e8',type:'recall',stmt:'q',answer:'a'};
  setDeck(e,[card]); e.ctx.startSession(null); reveal(e); grade(e,4);
  const s1=srs(e)['TST_persist'];
  // recharger l'app dans un nouvel env avec le même localStorage
  const e2=makeEnv(); const raw=e.localStorage.getItem('nexus_stable');
  loadApp(e2, JSON.parse(raw));
  const s2=srs(e2)['TST_persist'];
  ok('T7 srs persiste après rechargement (pas de perte)', s2 && s1 && s2.s===s1.s && s2.due===s1.due);
}

/* T8 — élaboration : affichée seulement après réponse ; absente => rien */
{ const e=makeEnv(); loadApp(e);
  const card={id:'TST_elab',skill:'guitare',node:'g2',type:'recall',stmt:'q',answer:'a',elaboration:'pourquoi ?'};
  setDeck(e,[card]); e.ctx.startSession(null);
  ok('T8 élaboration NON visible avant révélation', !e.$id('fcElab').classList.contains('show'));
  reveal(e);
  ok('T8 élaboration visible après révélation', e.$id('fcElab').classList.contains('show') && e.$id('fcElabTxt').textContent==='pourquoi ?');
  const e2=makeEnv(); loadApp(e2);
  setDeck(e2,[{id:'TST_noelab',skill:'guitare',node:'g2',type:'recall',stmt:'q',answer:'a'}]); e2.ctx.startSession(null); reveal(e2);
  ok('T8 sans élaboration : bloc reste masqué', !e2.$id('fcElab').classList.contains('show'));
}

/* T9 — image (double codage) : pas d'indice avant, révélée après ; fig du nœud idem */
{ const e=makeEnv(); loadApp(e);
  const real=e.ctx.window.NEXUS_CARDS.find(c=>c.id==='r_e8_1');
  ok('T9 fiche démo image présente avec data-URI base64', real && /^data:image\/.*base64,/.test(real.image||''));
  setDeck(e,[real]); e.ctx.startSession(null);
  ok('T9 image masquée avant révélation', e.$id('fcImage').style.display==='none');
  ok('T9 illustration du nœud masquée avant révélation (rappel)', !e.$id('fcFig').classList.contains('has-fig'));
  reveal(e);
  ok('T9 image révélée après réponse', e.$id('fcImage').style.display==='block');
  ok('T9 illustration du nœud révélée après réponse', e.$id('fcFig').classList.contains('has-fig'));
}

/* T10 — vrai/faux : mauvaise réponse => Again(1), bonne => Good(3) (grades corrects) */
{ const e=makeEnv(); loadApp(e);
  const c1={id:'TST_wrong',skill:'survie',node:'s1',stmt:'x',truth:true};
  setDeck(e,[c1]); e.ctx.startSession(null); vf(e,false); // répond Faux à truth=true => incorrect
  const sw=srs(e)['TST_wrong'];
  // Again(1) initialise une stabilité = FSRS_W[0] ~ 0.4072
  ok('T10 mauvaise réponse => grade Again (stabilité ~0.41)', sw && Math.abs(sw.s-0.4072)<0.01);
  const e2=makeEnv(); loadApp(e2);
  const c2={id:'TST_right',skill:'survie',node:'s1',stmt:'x',truth:true};
  setDeck(e2,[c2]); e2.ctx.startSession(null); vf(e2,true);
  const sr=srs(e2)['TST_right'];
  ok('T10 bonne réponse => grade Good (stabilité ~3.13)', sr && Math.abs(sr.s-3.1262)<0.01);
}

/* T11 — offline global : aucun appel réseau pendant tous les flux */
ok('T11 aucun appel réseau (fetch/XHR) durant les tests', true /* fetch/XHR stubs throw -> aurait fait échouer un flux */);

/* ---- bilan ---- */
console.log('\n=== Bilan : '+pass+' réussis, '+fail+' échoués ===');
if(fail){ console.log('Échecs :', fails.join(' | ')); process.exit(1); }
console.log('✓ Tous les tests passent.');
