/* e2e Projet Bois : mini-IA d'identification, volume, mesure par repère, projets, stock. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };
const near=(a,b,e)=>Math.abs(a-b)<=(e||0.001);

function mkEl(id){ const cls=new Set(),at={};
  return { id,tagName:'DIV',_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,onchange:null,oninput:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:(c,f)=>{const on=f===undefined?!cls.has(c):f;on?cls.add(c):cls.delete(c);}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);this.children.length=0;},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll(){return [];},querySelector(){return null;},
    appendChild(c){this.children.push(c);return c;},setAttribute(k,v){at[k]=v;},getAttribute(k){return at[k];},addEventListener(){},removeEventListener(){},click(){},focus(){},blur(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>{const e=mkEl('_'+t);if(t==='canvas')e.getContext=()=>({drawImage(){}});e.toDataURL=()=>'data:,';return e;},documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx;

// ---- mini-IA : classement + confiance ----
ok('W1 — sans indice : confiance nulle', c.identifyEssence({})[0].conf===0);
const chene=c.identifyEssence({type:'feuillu',leaf:'lobee',fruit:'gland',bark:'crevassee',hard:'dur'});
ok('W2 — indices chêne → chêne en tête', chene[0].e.k==='chene' && chene[0].conf>=80);
const pin=c.identifyEssence({type:'resineux',leaf:'aig_faisceau',fruit:'cone',bark:'orangee',hard:'mi_dur'});
ok('W3 — indices pin → pin en tête', pin[0].e.k==='pin' && pin[0].conf>=80);
const cheneWrong=c.identifyEssence({type:'feuillu',leaf:'lobee',fruit:'gland',bark:'crevassee',hard:'tendre'});
ok('W4 — un indice contradictoire baisse le score', cheneWrong.find(r=>r.e.k==='chene').score < chene.find(r=>r.e.k==='chene').score);
ok('W5 — confiance bornée 0..100', c.identifyEssence({type:'feuillu'}).every(r=>r.conf>=0&&r.conf<=100));

// ---- volume ----
ok('W6 — volume ≈ cylindre (300×Ø40 ≈ 0.377 m³)', near(c.logVolume(300,40), Math.PI*0.2*0.2*3));
ok('W7 — volume nul si dimension manquante', c.logVolume(0,40)===0 && c.logVolume(300,0)===0);

// ---- mesure par repère d'échelle ----
ok('W8 — distance en pixels', near(c.ptDistPx({xPct:0,yPct:0},{xPct:100,yPct:0},200,300),200,0.01));
ok('W9 — échelle : repère 200px=100cm, cible 400px → 200cm', c.scaleRealCm(
  [{xPct:0,yPct:20},{xPct:100,yPct:20}], [{xPct:10,yPct:50},{xPct:60,yPct:50}], 100, 400, 300)===200);
const m={ ref:[{xPct:10,yPct:50},{xPct:60,yPct:50}], len:[{xPct:0,yPct:20},{xPct:100,yPct:20}], diam:[{xPct:40,yPct:0},{xPct:40,yPct:50}], refCm:100, rw:400, rh:300 };
const rr=c.measureResults({m,mLenManual:'',mDiamManual:''});
ok('W10 — mesure photo : longueur 200cm, Ø 75cm', rr.lenCm===200 && rr.diamCm===75);
const rm=c.measureResults({m:{ref:[],len:[],diam:[],refCm:100,rw:1,rh:1}, mLenManual:'250', mDiamManual:'30'});
ok('W11 — saisie manuelle prioritaire', rm.lenCm===250 && rm.diamCm===30 && near(rm.vol,c.logVolume(250,30)));

// ---- stock + projets (règles) ----
const chLog={id:'l1',speciesKey:'chene',speciesName:'Chêne',lengthCm:250,diamCm:30,volumeM3:c.logVolume(250,30),photo:''};
const smallLog={id:'l2',speciesKey:'hetre',speciesName:'Hêtre',lengthCm:80,diamCm:12,volumeM3:0.009,photo:''};
const env2=makeEnv({mastered:{}, woodStock:[chLog, smallLog]}); loadApp(env2); const c2=env2.ctx;
ok('W12 — stock : 2 grumes, volume cumulé', c2.woodStats().count===2 && c2.woodStats().vol>0);
const fit=c2.woodProjectFit();
const charp=fit.find(r=>r.p.k==='charpente');
ok('W13 — charpente réalisable avec le chêne 250×30', charp.ok && charp.count===1 && charp.species.indexOf('Chêne')>=0);
const bard=fit.find(r=>r.p.k==='bardage');
ok('W14 — bardage : chêne (durable) éligible', bard.ok);
const env3=makeEnv({mastered:{}, woodStock:[{id:'l3',speciesKey:'chene',speciesName:'Chêne',lengthCm:100,diamCm:10,volumeM3:0.008}]}); loadApp(env3);
const fit3=env3.ctx.woodProjectFit().find(r=>r.p.k==='charpente');
ok('W15 — chêne trop petit : charpente non réalisable + indice', !fit3.ok && /trop petites/.test(fit3.hint));
const env4=makeEnv({mastered:{}, woodStock:[{id:'l4',speciesKey:'peuplier',speciesName:'Peuplier',lengthCm:300,diamCm:40,volumeM3:0.37}]}); loadApp(env4);
const bard4=env4.ctx.woodProjectFit().find(r=>r.p.k==='bardage');
ok('W16 — peuplier non durable : bardage exclu', !bard4.ok && /Aucune essence/.test(bard4.hint));

// ---- rendu stock (innerHTML) ----
c2.renderWoodFlow('stock');
ok('W17 — liste stock affiche l\'essence et le volume', /Chêne/.test(env2.reg.wfBody.innerHTML) && /m³/.test(env2.reg.wfBody.innerHTML));
c2.renderWoodFlow('projects');
ok('W18 — écran projets affiche « Réalisable » + « À compléter »', /Réalisable maintenant/.test(env2.reg.wfBody.innerHTML) && /compléter/.test(env2.reg.wfBody.innerHTML));

console.log('\n=== Bilan verif Projet Bois :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
