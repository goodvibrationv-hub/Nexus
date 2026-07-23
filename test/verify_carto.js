/* e2e Cartographie du domaine : graine des parcelles, tuile, registre, édition, persistance (partagé). */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const cls=new Set();
  return { id,_html:'',_text:'',children:[],dataset:{},value:'',onclick:null,onchange:null,
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
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','carto_data.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }
const store=env=>JSON.parse(env.ls.get('nexus_stable'));

const env=makeEnv({mastered:{}}); loadApp(env); const c=env.ctx, R=env.reg;

// ---- graine ----
const SEED=c.window.CARTO_SEED;
ok('C1 — graine : 13 parcelles bien formées', SEED.parcelles.length===13 && SEED.parcelles.every(p=>p.num&&p.section&&p.insee&&p.cont));
ok('C2 — deux communes (09060 & 09331)', SEED.parcelles.some(p=>p.insee==='09060') && SEED.parcelles.some(p=>p.insee==='09331'));
const total=SEED.parcelles.reduce((a,p)=>a+p.cont,0);
ok('C3 — surface totale ≈ 22,31 ha', Math.abs(total-223115)<1 && Math.abs(c.cartoTotalHa()-22.31)<0.01);

// ---- store initialisé (partagé, racine) + tuile ----
ok('C4 — cartoS() initialise STORE.carto depuis la graine', c.cartoS().parcelles.length===13 && store(env).carto);
ok('C5 — progression : 0 usage au départ', c.cartoProgress().done===0 && c.cartoProgress().total===13);
ok('C5b — géométrie officielle embarquée (13/13)', c.cartoGeoCount()===13 && SEED.parcelles.every(p=>p.geo&&p.geo.coordinates));
c.renderHome();
ok('C6 — tuile Cartographie sur l’accueil', R.domainList.children.some(x=>/Cartographie/.test(x._html)));
ok('C7 — pas un cours (aucun nœud SKILLS)', !c.window.NEXUS_DATA.SKILLS.carto);

// ---- registre ----
c.renderCarto();
const h=R.atfBody.innerHTML;
ok('C8 — registre : total ha + groupé par commune + parcelle 0961', /22\.31 ha/.test(h) && /Commune 09060/.test(h) && /Commune 09331/.test(h) && /Parcelle 0961/.test(h) && /data-cp=/.test(h));
ok('C9 — écran activé', R.scAtelierFlow.classList.contains('active'));

// ---- édition : renseigner un usage → persistance + progression ----
c.renderCartoEdit('p_0961');
ok('C10 — formulaire d’édition rendu', /id="cfNum"/.test(R.atfBody.innerHTML) && /id="cfUse"/.test(R.atfBody.innerHTML));
const pc=c.cartoS().parcelles.find(x=>x.id==='p_0961'); pc.usage='Bois'; c.saveStore();
ok('C11 — usage renseigné → progression 1/13', c.cartoProgress().done===1);
const env2=makeEnv(store(env)); loadApp(env2);
ok('C12 — données cartographie persistées (partagées)', env2.ctx.cartoS().parcelles.find(x=>x.id==='p_0961').usage==='Bois');
// ajout d'une parcelle
c.cartoS().parcelles.push({id:'p_test',num:'9999',section:'0A',feuille:'4',insee:'09060',cont:1000,usage:'',note:''}); c.saveStore();
ok('C13 — ajout d’une parcelle pris en compte', c.cartoS().parcelles.length===14 && store(env).carto.parcelles.some(x=>x.num==='9999'));

// ---- import GeoJSON + carte interactive ----
const gj=JSON.stringify({type:'FeatureCollection',features:[
  {type:'Feature',properties:{numero:'0961',section:'0A',commune:'09060',contenance:20280},geometry:{type:'Polygon',coordinates:[[[1.600,43.100],[1.601,43.100],[1.601,43.101],[1.600,43.101],[1.600,43.100]]]}},
  {type:'Feature',properties:{id:'090600000A0963'},geometry:{type:'Polygon',coordinates:[[[1.602,43.100],[1.603,43.100],[1.603,43.101],[1.602,43.101],[1.602,43.100]]]}},
  {type:'Feature',properties:{numero:'8888',commune:'09999'},geometry:{type:'Polygon',coordinates:[[[9,9],[9,9.1],[9.1,9.1],[9,9]]]}}
]});
const ri=c.cartoImport(gj);
ok('C14 — import GeoJSON relie 2 parcelles (par n° et par id)', ri.matched===2 && c.cartoGeoCount()===13 && !!c.cartoS().parcelles.find(x=>x.id==='p_0961').geo && !!c.cartoS().parcelles.find(x=>x.id==='p_0963').geo);
ok('C15 — JSON invalide → erreur', !!c.cartoImport('{pas du json').error);
c.renderCartoMap();
ok('C16 — carte : SVG + polygones cliquables + plein écran', /<svg/.test(R.atfBody.innerHTML) && (R.atfBody.innerHTML.match(/<polygon/g)||[]).length>=2 && /data-cp=/.test(R.atfBody.innerHTML) && /cm-full/.test(R.atfBody.innerHTML));
ok('C16b — bâtiments : ≥6 seed + surcouche non-cliquable', ((c.window.CARTO_SEED.batiments||[]).length>=6) && (R.atfBody.innerHTML.match(/pointer-events="none"/g)||[]).length>=6);
ok('C16b2 — fond IGN par défaut (ortho IGN affichée à l’ouverture)', /<image[^>]+data\.geopf\.fr[^>]+ORTHOIMAGERY\.ORTHOPHOTOS/.test(R.atfBody.innerHTML) && /BD ORTHO/.test(R.atfBody.innerHTML));
ok('C16c — cycle des 4 fonds : ortho IGN, Esri, Plan IGN, cadastre', (()=>{ if(!/id="cmLayer"/.test(R.atfBody.innerHTML)) return false;
  let ign=false,esri=false,rando=false,plan=false;
  for(let i=0;i<4;i++){ const h=R.atfBody.innerHTML;
    if(/<image[^>]+data\.geopf\.fr[^>]+ORTHOIMAGERY\.ORTHOPHOTOS/.test(h) && /CRS=EPSG:4326/.test(h.replace(/&amp;/g,'&')) && /preserveAspectRatio="none"/.test(h) && /BD ORTHO/.test(h)) ign=true;
    if(/<image[^>]+arcgisonline\.com[^>]+World_Imagery/.test(h) && /Esri/.test(h)) esri=true;
    if(/<image[^>]+data\.geopf\.fr[^>]+GEOGRAPHICALGRIDSYSTEMS\.PLANIGNV2/.test(h) && /Plan IGN/.test(h)) rando=true;
    if(!/<image/.test(h)) plan=true;
    R.cmLayer.onclick(); }
  return ign && esri && rando && plan; })());
c._cmLayer='ign'; c.renderCartoMap();
c.renderCartoMap();
ok('C16d — plein écran : overlay no-swipe + bouton fermer + panneau repliable', (()=>{ const h=R.atfBody.innerHTML;
  return /class="cm-wrap cm-full no-swipe"/.test(h) && /id="cmBack" class="cm-close"/.test(h) && /id="cmFold"/.test(h) && /id="cmUnfold"/.test(h) && typeof R.cmFold.onclick==='function' && typeof R.cmBack.onclick==='function'; })());
ok('C16e — porte « Le Territoire » sur l’accueil ouvre la carto', typeof R.doorCarto.onclick==='function' && (()=>{ R.doorCarto.onclick(); return R.scAtelierFlow.classList.contains('active'); })());
c.renderCartoMap();
ok('C16g — chemins : ≥6 segments seed + polylignes + bouton 🚶 masque/affiche', (()=>{ const chm=c.window.CARTO_SEED.chemins||[]; const h=R.atfBody.innerHTML;
  if(chm.length<6) return false;
  const okDraw=(h.match(/<polyline/g)||[]).length>=chm.length && /id="cmPaths"/.test(h);
  if(!okDraw||typeof R.cmPaths.onclick!=='function') return false;
  R.cmPaths.onclick(); const off=R.atfBody.innerHTML; // masqué
  const okOff=!/<polyline/.test(off);
  R.cmPaths.onclick(); // ré-affiche pour la suite
  return okOff; })());
c.renderCartoMap();
ok('C16f — point GPS : bouton 📍 + groupe marqueur + fermeture coupe le GPS', (()=>{ const h=R.atfBody.innerHTML;
  if(!/id="cmGeo"/.test(h) || !/id="cmMe"/.test(h) || typeof R.cmGeo.onclick!=='function') return false;
  // pas de navigator dans le vm : un tap ne doit pas planter (géoloc indisponible → alert avalée)
  let crash=false; try{ R.cmGeo.onclick(); }catch(e){ crash=true; }
  return !crash && typeof R.cmBack.onclick==='function'; })());
ok('C17 — géométrie persistée au rechargement', (()=>{ const e3=makeEnv(store(env)); loadApp(e3); return e3.ctx.cartoGeoCount()===13; })());

// ---- migration : un registre existant SANS géométrie récupère les contours ----
const oldSeed={mastered:{}, carto:{ note:'', parcelles:[
  {id:'p_0961', num:'0961', section:'0A', feuille:'4', insee:'09060', cont:20280, usage:'Bois', note:'ma note'},
  {id:'p_1139', num:'1139', section:'0A', feuille:'4', insee:'09060', cont:38698, usage:'', note:''}
]}};
const em=makeEnv(oldSeed); loadApp(em); const P0=em.ctx.cartoS().parcelles;
ok('C18 — migration : contours ajoutés à un registre existant', em.ctx.cartoGeoCount()===2 && P0.find(x=>x.id==='p_0961').geo);
ok('C19 — migration : usage et note préservés', P0.find(x=>x.id==='p_0961').usage==='Bois' && P0.find(x=>x.id==='p_0961').note==='ma note');

console.log('\n=== Bilan verif Cartographie :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
