/* e2e Bien-être : tuile accueil, hub recettes, bissap en tête, recette détaillée + « déjà faite », rituels, persistance. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const cls=new Set();
  return { id,_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:()=>{}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);this.children.length=0;},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll:()=>[],querySelector:()=>null,appendChild(c){this.children.push(c);return c;},setAttribute(){},getAttribute(){},addEventListener(){},focus(){},click(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>mkEl('_'+t),documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','amenagement.js','bienetre.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx, R=env.reg;
const B=c.window.BIENETRE;

// ---- données ----
ok('B1 — compétence Bien-être définie', B && B.name==='Bien-être' && B.icon && B.color);
ok('B2 — bissap en 1re recette', B.recettes[0].key==='bissap' && /hibiscus/i.test(B.recettes[0].t+B.recettes[0].s));
ok('B3 — ≥6 recettes, chacune avec ingrédients + étapes', B.recettes.length>=6 && B.recettes.every(r=>r.ingr.length&&r.etapes.length&&r.t&&r.key));
ok('B4 — bissap : conseils des anciens (≥3)', Array.isArray(B.recettes[0].anciens) && B.recettes[0].anciens.length>=3);
ok('B5 — rituels bien-être présents', B.astuces.length>=1 && B.astuces.every(g=>g.items.every(x=>x.t&&x.d)));

// ---- accueil : tuile dédiée, pas un cours ----
c.renderHome();
ok('B6 — tuile Bien-être sur l’accueil', R.domainList.children.some(x=>/Bien-être/.test(x._html)));
ok('B7 — pas un cours : aucun nœud SKILLS ni fiche', !c.window.NEXUS_DATA.SKILLS.bienetre && !c.window.NEXUS_CARDS.some(x=>x.skill==='bienetre'));

// ---- hub ----
c.renderBienetreHub();
const hub=R.atfBody.innerHTML;
ok('B8 — hub : bannière rituels + recettes listées + bissap', /data-beast/.test(hub) && /data-berec="bissap"/.test(hub) && new RegExp('0 / '+B.recettes.length).test(hub));
ok('B9 — écran scAtelierFlow activé', R.scAtelierFlow.classList.contains('active'));

// ---- recette détaillée + « déjà faite » ----
c.renderRecette('bissap');
const rec=R.atfBody.innerHTML;
ok('B10 — recette : ingrédients + préparation + anciens + bouton fait', /Ingrédients/.test(rec) && /Préparation/.test(rec) && /rec-ingr/.test(rec) && /tour de main des anciens/.test(rec) && /id="recDone"/.test(rec));
const st=c.bienetreS(); st.done.bissap='2026-07-20'; c.saveStore();
c.renderRecette('bissap',true);
ok('B11 — recette cochée « faite »', /retirer/.test(R.atfBody.innerHTML));
ok('B12 — progression : 1 recette faite', c.bienetreProgress().done===1 && c.bienetreProgress().total===B.recettes.length);
c.renderBienetreHub();
ok('B13 — hub reflète 1 recette faite', new RegExp('1 / '+B.recettes.length).test(R.atfBody.innerHTML));
const env2=makeEnv(store(env)); loadApp(env2);
ok('B14 — état persisté au rechargement', env2.ctx.bienetreS().done.bissap==='2026-07-20');

// ---- rituels ----
c.renderBienetreAstuces();
ok('B15 — rituels rendus (dépliables)', /dep-item arb/.test(R.atfBody.innerHTML) && /Rituels/.test(R.atfTitle.textContent));

console.log('\n=== Bilan verif Bien-être :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
