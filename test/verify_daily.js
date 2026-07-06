/* e2e Tâches quotidiennes : régimes matin/soir, foin, reset du jour, persistance. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const cls=new Set(),at={};
  return { id,tagName:'DIV',_html:'',_text:'',children:[],dataset:{},disabled:false,value:'',checked:false,onclick:null,onchange:null,
    style:new Proxy({},{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:(c,f)=>{const on=f===undefined?!cls.has(c):f;on?cls.add(c):cls.delete(c);}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);this.children.length=0;},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    querySelectorAll(){return [];},querySelector(){return null;},
    appendChild(c){this.children.push(c);return c;},removeChild(c){const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);return c;},
    setAttribute(k,v){at[k]=v;},removeAttribute(k){delete at[k];},getAttribute(k){return at[k];},addEventListener(){},removeEventListener(){},focus(){},blur(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const document={getElementById:$id,createElement:t=>{const e=mkEl('_'+t);e.tagName=String(t).toUpperCase();return e;},documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg,ls:_ls}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }

const HORSES=[
  {id:'h_tina',name:'Tina',regime:'¾ floc ¾ orge ⅓ happy',hay:1},
  {id:'h_kitai',name:'Kitaï',regime:'1 floc ½ orge ⅓ happy — le soir seulement',hay:1},
  {id:'h_georgette',name:'Georgette',regime:'½ orge ½ floc ⅓ happy — 1 fois par jour, le matin',hay:1},
  {id:'h_braddy',name:'Braddy',regime:'1 son ½ orge ½ floc ⅓ happy',hay:2},
];
const env=makeEnv({animals:HORSES, mastered:{}, seedFreyche:true});
loadApp(env); const c=env.ctx;

// --- feedTimes : classification selon régime ---
const byId=n=>HORSES.find(a=>a.id===n);
ok('D1 — Tina : matin ET soir', (()=>{const t=c.feedTimes(byId('h_tina'));return t.matin&&t.soir;})());
ok('D2 — Kitaï : soir seulement', (()=>{const t=c.feedTimes(byId('h_kitai'));return !t.matin&&t.soir;})());
ok('D3 — Georgette : matin seulement', (()=>{const t=c.feedTimes(byId('h_georgette'));return t.matin&&!t.soir;})());
ok('D4 — Braddy : matin ET soir', (()=>{const t=c.feedTimes(byId('h_braddy'));return t.matin&&t.soir;})());

// --- renderDaily : contenu des sections ---
c.renderDaily();
const H=env.reg.ssList.innerHTML;
const matinIdx=H.indexOf("Matin"), soirIdx=H.indexOf("Soir");
ok('D5 — deux sections Matin 9h / Soir 19h', matinIdx>=0 && soirIdx>matinIdx && H.indexOf('9h')>=0 && H.indexOf('19h')>=0);
const matinPart=H.slice(matinIdx,soirIdx), soirPart=H.slice(soirIdx);
ok('D6 — Georgette au matin, pas au soir', matinPart.includes('Georgette') && !soirPart.includes('Georgette'));
ok('D7 — Kitaï au soir, pas au matin', soirPart.includes('Kitaï') && !matinPart.includes('Kitaï'));
ok('D8 — Braddy : 2 brouettes de foin', H.includes('2 brouette') && H.includes('Braddy'));
ok('D9 — Tina : 1 brouette de foin', H.includes('1 brouette'));
ok('D10 — chaque bouton porte data-daily', (H.match(/data-daily=/g)||[]).length===6); // 3 matin + 3 soir

// --- reset du jour ---
const env2=makeEnv({animals:HORSES, mastered:{}, seedFreyche:true, daily:{date:'2020-01-01', done:{m_h_tina:true}}});
loadApp(env2);
const st=env2.ctx.dailyState();
const today=new Date().toISOString().slice(0,10);
ok('D11 — dailyState réinitialise à la date du jour', st.date===today && Object.keys(st.done).length===0);
ok('D12 — reset persisté en localStorage', JSON.parse(env2.ls.get('nexus_stable')).daily.date===today);

// --- persistance d'un repas coché (logique du clic) ---
const st3=env.ctx.dailyState(); st3.done['m_h_tina']=true; env.ctx.saveStore();
const env3=makeEnv(JSON.parse(env.ls.get('nexus_stable')));
loadApp(env3); env3.ctx.renderDaily();
const H3=env3.reg.ssList.innerHTML;
const saved=JSON.parse(env3.ls.get('nexus_stable')).daily;
// le bouton de Tina matin doit être marqué done (classe + ✓)
ok('D13 — repas coché persiste après rechargement', /dailytask done"[^>]*data-daily="m_h_tina"/.test(H3) && saved.done['m_h_tina']===true);

console.log('\n=== Bilan verif Tâches quotidiennes :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
