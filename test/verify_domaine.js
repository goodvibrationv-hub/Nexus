/* e2e Domaine/Écuries + fiche animal : seed, tableau de bord, notes, soins, photos. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..','..','..','..','..','home','user','Nexus');
const R0='/home/user/Nexus'; const P=f=>path.join(R0,f);
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

function mkEl(id){ const st={},cls=new Set(),qsa={},at={};
  return { id,tagName:'DIV',_html:'',_text:'',_class:'',children:[],dataset:{},disabled:false,value:'',checked:false,onclick:null,onchange:null,files:[],_qsa:qsa,
    style:new Proxy(st,{get(t,p){return p==='setProperty'?((k,v)=>{t[k]=v;}):t[p];},set(t,p,v){t[p]=v;return true;}}),
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:c=>{cls.has(c)?cls.delete(c):cls.add(c);}},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=v==null?'':String(v);this.children.length=0;},
    get textContent(){return this._text;},set textContent(v){this._text=v==null?'':String(v);},
    get className(){return this._class;},set className(v){this._class=v==null?'':String(v);},
    querySelectorAll(s){ if(qsa[s])return qsa[s]; const out=[]; const attr=(s.match(/^\[(.+?)=/)||[])[1]; if(attr){ const re=new RegExp(attr+'="([^"]+)"','g'); let m; while((m=re.exec(this._html))){ const e=mkEl('_x'); const key=attr.replace(/^data-/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase()); e.dataset[key]=m[1]; out.push(e); } } return out; },
    querySelector(s){return (qsa[s]||[])[0]||mkEl('_qs');},   // stub non-null : les rows câblent .onclick sans planter
    appendChild(c){this.children.push(c);return c;},removeChild(c){const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);return c;},
    setAttribute(k,v){at[k]=v;},removeAttribute(k){delete at[k];},getAttribute(k){return at[k];},addEventListener(){},removeEventListener(){},focus(){},blur(){} }; }
function makeEnv(seed){ const reg={}; const $id=id=>{ if(!reg[id])reg[id]=mkEl(id); return reg[id]; };
  const kids=sp=>sp.map(d=>{const e=mkEl('_b');Object.assign(e.dataset,d);return e;});
  $id('fcChoice')._qsa['.vf']=kids([{v:'true'},{v:'false'}]); $id('tcChoice')._qsa['.vf']=kids([{v:'true'},{v:'false'}]);
  $id('fcGrades')._qsa['.grade']=kids([{g:'1'},{g:'2'},{g:'3'},{g:'4'}]); $id('fcConf')._qsa['.conf']=kids([{sure:'1'},{sure:'0'}]);
  const document={getElementById:$id,createElement:t=>{const e=mkEl('_'+t);e.tagName=String(t).toUpperCase();return e;},documentElement:mkEl('h'),body:mkEl('b'),querySelectorAll:()=>[],addEventListener(){}};
  const _ls=new Map(); if(seed)_ls.set('nexus_stable',JSON.stringify(seed));
  const localStorage={getItem:k=>_ls.has(k)?_ls.get(k):null,setItem:(k,v)=>_ls.set(k,String(v)),removeItem:k=>_ls.delete(k),clear:()=>_ls.clear()};
  const ctx={window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})},document,localStorage,console,alert:()=>{},
    setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>{throw new Error('net');},Math,Date,JSON,parseInt,parseFloat,isNaN,Object,Array,String,Number,Boolean,RegExp,Set,Map};
  vm.createContext(ctx); return {ctx,reg}; }
function loadApp(env){ for(const f of ['data_core.js','content_courses.js','cards.js','app.js']) vm.runInContext(fs.readFileSync(P(f),'utf8'),env.ctx,{filename:f}); }

// --- profil vierge : la graine crée les 7 chevaux + le rappel alimentation ---
const env=makeEnv(); loadApp(env); const c=env.ctx; const R=env.reg;
const store=()=>JSON.parse(env.ctx.localStorage.getItem('nexus_stable'));
const names=()=>store().animals.map(a=>a.name);
ok('S1 — graine : 7 chevaux créés', store().animals.length===7);
ok('S2 — TINA … GEORGETTE présents', ['TINA','ERMES','JAGUAR','KITAÏ','BRADDY','JAM','GEORGETTE'].every(n=>names().includes(n)));
ok('S3 — régime pré-rempli (JAGUAR)', (store().animals.find(a=>a.name==='JAGUAR')||{}).regime==='2 senior, ⅔ orge, ⅓ happy');
ok('S4 — rappel « humidifier l\'orge » enregistré', /humidifier l.orge/i.test(store().ecuriesNote||''));
ok('S5 — champs fiche initialisés', store().animals.every(a=>a.sex!==undefined&&a.regime!==undefined&&Array.isArray(a.noteLog)&&Array.isArray(a.photos)));

// --- liste Écuries ---
c.navGo('stable'); c.openStableSection('ecuries');
ok('E1 — bannière alimentation affichée', /ecuries-banner/.test(R.ssList.innerHTML));
ok('E2 — 7 lignes animaux (vue d\'ensemble)', (R.ssList.innerHTML.match(/class="animalrow"/g)||[]).length===7);
ok('E3 — chaque ligne montre le régime', /ar-reg/.test(R.ssList.innerHTML)&&/orge/.test(R.ssList.innerHTML));
ok('E4 — compteur « 7 animaux » en tête', /7 animaux/.test(R.ssList.innerHTML));

// --- ouvrir une fiche ---
const tina=store().animals.find(a=>a.name==='TINA').id;
c.openAnimal(tina);
ok('F1 — écran fiche actif', R.scAnimal.classList.contains('active'));
ok('F2 — nom affiché', R.anName.textContent==='TINA');
ok('F3 — tableau de bord (Espèce)', /Espèce/.test(R.anDash.innerHTML));
ok('F4 — régime dans la fiche', R.anRegime.style.display==='block' && /floc/.test(R.anRegime.innerHTML));

// --- écrire une note ---
c.openNoteModal(tina); R.nText.value='Boiterie légère AD'; R.nSave.onclick();
ok('F5 — note ajoutée au journal', (store().animals.find(a=>a.id===tina).noteLog||[]).some(n=>/Boiterie/.test(n.text)));
ok('F6 — note visible', /Boiterie/.test(R.anNotes.innerHTML));

// --- soin depuis la fiche (rafraîchit la fiche) ---
c.openCareModal(tina); R.cType.value='Vermifuge'; R.cDate.value='2026-07-01'; R.cNext.value=''; R.cNote.value=''; R.cSave.onclick();
ok('F7 — soin enregistré', (store().animals.find(a=>a.id===tina).care||[]).some(s=>s.type==='Vermifuge'));
ok('F8 — fiche reste active après soin', R.scAnimal.classList.contains('active'));
ok('F9 — soin visible dans la fiche', /Vermifuge/.test(R.anCare.innerHTML));

// --- édition : sexe + régime ---
c.openAnimalModal(tina);
ok('F10 — modal pré-remplit le régime', R.aRegime.value==='¾ floc, ¾ orge, ⅓ happy');
R.aSex.value='Jument'; R.aName.value='TINA'; R.aSpecies.value='Cheval'; R.aBreed.value=''; R.aAge.value='12 ans'; R.aRegime.value='¾ floc, ¾ orge, ⅓ happy'; R.aNotes.value='';
R.aSave.onclick();
ok('F11 — sexe enregistré', store().animals.find(a=>a.id===tina).sex==='Jument');
ok('F12 — fiche re-rendue après édition', R.scAnimal.classList.contains('active') && /Jument/.test(R.anDash.innerHTML));

// --- photos : rendu + suppression (via un animal pré-doté d'une photo) ---
const env3=makeEnv({ seedFreyche:true, animals:[{id:'ph1',name:'Photo',species:'Cheval',sex:'',breed:'',age:'',regime:'',notes:'',noteLog:[],photos:['data:image/jpeg;base64,AAAA','data:image/jpeg;base64,BBBB'],care:[]}], mastered:{} });
loadApp(env3); const c3=env3.ctx, R3=env3.reg;
c3.openAnimal('ph1');
ok('P1 — 2 photos rendues (img)', (R3.anPhotos.innerHTML.match(/<img/g)||[]).length===2);
ok('P2 — chaque photo a son bouton de suppression', /data-photo="0"/.test(R3.anPhotos.innerHTML) && /data-photo="1"/.test(R3.anPhotos.innerHTML) && /class="rm"/.test(R3.anPhotos.innerHTML));

// --- rétro-compat : ancien animal sans nouveaux champs ---
const env2=makeEnv({ animals:[{id:'old1',name:'Vieux',species:'Cheval'}], seedFreyche:true, mastered:{} });
loadApp(env2); const R2=env2.reg;
env2.ctx.openAnimal('old1');           // migration en mémoire
env2.ctx.openNoteModal('old1'); R2.nText.value='ok'; R2.nSave.onclick();   // déclenche saveStore
const a2=JSON.parse(env2.ctx.localStorage.getItem('nexus_stable')).animals.find(x=>x.id==='old1');
ok('R1 — ancien animal migré et persisté (photos ajouté par la migration)', Array.isArray(a2.photos)&&a2.sex!==undefined&&a2.regime!==undefined);

// --- Projets du domaine (remplace Animaux ; Soins retiré du menu Gestion) ---
ok('PJ1 — graine : 3 projets', store().projects.length===3 && ['Nettoyage panneaux solaires','Clôtures enclos n°2','Bord des sentiers'].every(t=>store().projects.some(p=>p.title===t)));
c.openGestion();
const menuHtml=R.stableMenu.children.map(x=>x.innerHTML).join(' ');
ok('PJ2 — menu Gestion : Projets présent, Animaux et Soins retirés', /Projets/.test(menuHtml) && !/Animaux/.test(menuHtml) && !/Soins/.test(menuHtml) && R.stableMenu.children.length===4);
c.openStableSection('projects');
ok('PJ3 — section Projets : titre + 3 lignes', R.ssTitle.textContent==='Projets' && R.ssList.children.length===3);
c.openProjectModal(); R.pjTitle.value='Réparer abreuvoir'; R.pjDetail.value='pré du bas'; R.pjSave.onclick();
ok('PJ4 — ajout de projet', store().projects.length===4 && store().projects.some(p=>p.title==='Réparer abreuvoir'));
ok('PJ5 — santé toujours dans la fiche animal (section Soins présente)', /Soins \/ santé/.test(require('fs').readFileSync('/home/user/Nexus/template.html','utf8').match(/id="scAnimal"[\s\S]*?<\/section>/)[0]));

console.log('\n=== Bilan verif Domaine/Écuries :', pass, 'réussis,', fail, 'échoués ===');
process.exit(fail?1:0);
