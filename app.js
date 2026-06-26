/* app.js — Logique applicative Nexus Learn. */
const D=window.NEXUS_DATA, C=window.NEXUS_CONTENT, TIERS=D.TIERS;
const $=id=>document.getElementById(id);

/* ====== persistent store (localStorage + fallback) ====== */
const STORE={ horses:[], tasks:[], mastered:{} };
function loadStore(){
  try{
    const raw=localStorage.getItem('nexus_stable');
    if(raw){ const d=JSON.parse(raw); STORE.horses=d.horses||[]; STORE.tasks=d.tasks||[]; STORE.mastered=d.mastered||{}; }
  }catch(e){ /* mémoire seule */ }
  Object.keys(D.SKILLS).forEach(k=>{ if(!STORE.mastered[k]) STORE.mastered[k]=[]; });
}
function saveStore(){ try{ localStorage.setItem('nexus_stable', JSON.stringify(STORE)); }catch(e){} }
loadStore();
const mastered={}; Object.keys(D.SKILLS).forEach(k=>mastered[k]=new Set(STORE.mastered[k]||[]));
function persistMastered(){ Object.keys(mastered).forEach(k=>STORE.mastered[k]=[...mastered[k]]); saveStore(); }

function pct(k){return Math.round(mastered[k].size/D.SKILLS[k].nodes.length*100);}
function totalPct(){let m=0,t=0;for(const k in D.SKILLS){m+=mastered[k].size;t+=D.SKILLS[k].nodes.length;}return Math.round(m/t*100);}

/* ====== screen mgmt ====== */
let current=null,currentNode=null,currentSkillK=null,mode='landing';
function show(screen,{crumb='',back=null,accent='#3F5E4E',nav=''}={}){
  document.documentElement.style.setProperty('--forest',accent);
  ['scLanding','scHome','scDetail','scCourse','scTest','scProgress','scStable','scGestion','scStableSection','scRevise'].forEach(s=>$(s).classList.remove('active'));
  $(screen).classList.add('active');
  if(back){ $('backBtn').style.display='flex'; $('backLbl').textContent=back.lbl; $('backBtn').onclick=back.fn; }
  else $('backBtn').style.display='none';
  buildNav(nav);
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ====== bottom nav (contextual) ====== */
function buildNav(active){
  const nav=$('bottomnav');
  if(mode==='stable'){
    document.body.classList.add('stable-mode');
    nav.innerHTML=
      '<button class="navbtn" data-go="landing"><span class="ni">⌂</span><span class="nl">Accueil</span></button>'+
      '<button class="navbtn'+(active==='stable'?' on':'')+'" data-go="stable"><span class="ni">🐴</span><span class="nl">Écuries</span></button>';
  } else {
    document.body.classList.remove('stable-mode');
    nav.innerHTML=
      '<button class="navbtn'+(active==='home'?' on':'')+'" data-go="home"><span class="ni">⌂</span><span class="nl">Accueil</span></button>'+
      '<button class="navbtn'+(active==='domains'?' on':'')+'" data-go="domains"><span class="ni">❦</span><span class="nl">Domaines</span></button>'+
      '<button class="navbtn'+(active==='revise'?' on':'')+'" data-go="revise"><span class="ni">⟲</span><span class="nl">Réviser</span></button>'+
      '<button class="navbtn'+(active==='progress'?' on':'')+'" data-go="progress"><span class="ni">◔</span><span class="nl">Progression</span></button>';
  }
  nav.querySelectorAll('.navbtn').forEach(b=>b.onclick=()=>navGo(b.dataset.go));
}
function navGo(g){
  if(g==='landing'){ mode='landing'; goLanding(); }
  else if(g==='home'){ goLanding(); }
  else if(g==='domains'){ mode='learn'; renderHome(); show('scHome',{crumb:'<span class="cur">Domaines</span>',nav:'domains'}); }
  else if(g==='progress'){ mode='learn'; renderProgress(); show('scProgress',{crumb:'<span class="cur">Progression</span>',nav:'progress'}); }
  else if(g==='revise'){ mode='learn'; renderRevise(); show('scRevise',{crumb:'<span class="cur">Réviser</span>',back:{lbl:'accueil',fn:goLanding},nav:'revise'}); }
  else if(g==='stable'){ mode='stable'; const pend=(STORE.tasks||[]).filter(t=>!t.done).length; $('optTasksCount').textContent=pend?(pend+' tâche'+(pend>1?'s':'')+' à faire — voir et ajouter.'):'Voir et ajouter les tâches du jour.'; show('scStable',{back:{lbl:'accueil',fn:goLanding},accent:'#8A5A3C',nav:'stable'}); }
}

/* ====== landing ====== */
function goLanding(){ mode='landing'; show('scLanding',{crumb:'',back:null,accent:'#3F5E4E',nav:''}); }
$('doorLearn').onclick=()=>{ mode='learn'; renderHome(); show('scHome',{crumb:'<span class="cur">Apprendre</span>',back:{lbl:'accueil',fn:goLanding},nav:'home'}); };
$('doorStable').onclick=()=>navGo('stable');

/* ====== learning ====== */
function renderHome(){
  const g=$('domainList'); g.innerHTML='';
  Object.entries(D.SKILLS).forEach(([k,s])=>{
    const b=document.createElement('button'); b.className='domain'; b.style.setProperty('--c',s.color);
    b.innerHTML='<span class="ic">'+s.icon+'</span><div class="mid"><h3>'+s.name+'</h3><div class="meta">'+s.meta+'</div><div class="barwrap"><span class="bar"><i style="width:'+pct(k)+'%"></i></span><span class="pc">'+pct(k)+'%</span></div></div><span class="chev">›</span>';
    b.onclick=()=>openDomain(k); g.appendChild(b);
  });
}
function statusOf(k,n){ if(mastered[k].has(n.id))return 'mastered'; if(n.deps.every(d=>mastered[k].has(d)))return 'available'; return 'locked'; }
function nameOf(k,id){ return D.SKILLS[k].nodes.find(x=>x.id===id).t; }
function openDomain(k){
  current=k; mode='learn'; const s=D.SKILLS[k];
  $('dIc').textContent=s.icon; $('dTitle').textContent=s.name; $('dMeta').textContent=s.meta; renderTree();
  show('scDetail',{crumb:'<span class="cur">'+s.name+'</span>',back:{lbl:'domaines',fn:()=>navGo('domains')},accent:s.color,nav:'domains'});
}
function renderTree(){
  const k=current,s=D.SKILLS[k];
  $('dProg').innerHTML='<b>'+mastered[k].size+'</b> / '+s.nodes.length+' étapes acquises';
  const tree=$('tree'); tree.innerHTML='';
  TIERS.forEach((label,ti)=>{
    const tn=s.nodes.filter(n=>n.tier===ti); if(!tn.length)return;
    const wrap=document.createElement('div'); wrap.className='tier';
    wrap.innerHTML='<div class="tiername"><span class="n">'+(ti+1)+'</span>'+label+'</div>';
    tn.forEach(n=>{
      const st=statusOf(k,n); const b=document.createElement('button'); b.className='step '+st;
      const stateLbl=st==='mastered'?'acquis':st==='available'?'à faire':'requis : '+n.deps.map(d=>nameOf(k,d)).join(', ');
      const kind=n.kind==='course'?'<span class="kind course">cours</span>':'<span class="kind safety">encadré</span>';
      b.innerHTML='<div class="dotcol"><span class="stepdot">'+(st==='mastered'?'✓':'')+'</span></div><div class="stepmid"><h4>'+n.t+'</h4><div class="d">'+n.d+'</div><div class="tags">'+kind+'<span class="stepstate">'+stateLbl+'</span></div></div>'+(st==='locked'?'<span class="chev">🔒</span>':'<span class="chev">›</span>');
      if(st!=='locked') b.onclick=()=>openCourse(k,n);
      wrap.appendChild(b);
    });
    tree.appendChild(wrap);
  });
}
function expandFigures(html){ return html.replace(/<FIG:(\w+)>/g,(_,key)=>'<figure class="figure">'+D.FIG[key]+'<figcaption>Schéma — Nexus Learn</figcaption></figure>'); }
function openCourse(k,n){
  currentNode=n; currentSkillK=k; const c=C[n.id]; const s=D.SKILLS[k];
  $('cTag').textContent=c.tag; $('cTitle').textContent=c.title; $('cLead').textContent=c.lead; $('cBody').innerHTML=expandFigures(c.body);
  renderCourseFoot(k,n);
  show('scCourse',{crumb:'<span>'+s.name+'</span><span class="sep">›</span><span class="cur">'+n.t+'</span>',back:{lbl:s.name,fn:()=>openDomain(k)},accent:s.color,nav:''});
}
function questionsFor(nodeId){ return window.NEXUS_CARDS.filter(c=>c.node===nodeId); }
function renderCourseFoot(k,n){
  const foot=$('courseFoot'); const done=mastered[k].has(n.id);
  const pool=questionsFor(n.id); const nb=Math.min(5,pool.length);
  foot.innerHTML='';
  if(done){
    const ok=document.createElement('div'); ok.className='course-acquired'; ok.innerHTML='<span>✓</span> Cours validé';
    foot.appendChild(ok);
    const again=document.createElement('button'); again.className='doneBtn undo'; again.textContent='Refaire le test';
    again.onclick=()=>startTest(k,n);
    foot.appendChild(again);
  } else {
    const btn=document.createElement('button'); btn.className='doneBtn';
    btn.textContent='Passer le test ('+nb+' question'+(nb>1?'s':'')+')';
    btn.onclick=()=>startTest(k,n);
    foot.appendChild(btn);
  }
}
/* ===== moteur de test ===== */
let testK=null, testN=null, testQueue=[], testIdx=0, testErrors=0, testRevealed=false;
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function startTest(k,n){
  testK=k; testN=n;
  const pool=questionsFor(n.id);
  testQueue=shuffle(pool).slice(0,5);
  testIdx=0; testErrors=0;
  $('testTitle').textContent=n.t;
  $('testResult').style.display='none'; $('testCard').style.display='flex';
  showTestCard();
  show('scTest',{back:{lbl:'cours',fn:()=>openCourse(k,n)},accent:D.SKILLS[k].color,nav:''});
}
function showTestCard(){
  if(testIdx>=testQueue.length){ endTest(); return; }
  const c=testQueue[testIdx];
  $('testProgress').textContent='Question '+(testIdx+1)+' / '+testQueue.length;
  $('tcQ').textContent=c.stmt;
  $('tcChoice').style.display='grid';
  $('tcChoice').querySelectorAll('.vf').forEach(b=>{ b.disabled=false; b.classList.remove('picked'); });
  $('tcVerdict').className='fc-verdict'; $('tcVerdict').textContent='';
  $('tcA').classList.remove('show'); $('tcA').textContent='';
  $('tcNext').style.display='none';
  testRevealed=false;
}
$('tcChoice').querySelectorAll('.vf').forEach(btn=>btn.onclick=()=>{
  if(testRevealed) return; testRevealed=true;
  const c=testQueue[testIdx]; const answer=btn.dataset.v==='true'; const correct=answer===c.truth;
  $('tcChoice').querySelectorAll('.vf').forEach(b=>b.disabled=true); btn.classList.add('picked');
  const v=$('tcVerdict');
  v.textContent=correct?'✓ Correct':'✗ Incorrect — réponse : '+(c.truth?'Vrai':'Faux');
  v.className='fc-verdict show '+(correct?'right':'wrong');
  if(!correct) testErrors++;
  $('tcA').textContent=c.explain; $('tcA').classList.add('show');
  $('tcNext').style.display='block';
});
$('tcNext').onclick=()=>{ testIdx++; showTestCard(); };
function endTest(){
  $('testCard').style.display='none'; $('testResult').style.display='block';
  const passed=testErrors===0;
  $('trIc').textContent=passed?'🎉':'✗';
  $('trIc').style.color=passed?'var(--sage)':'var(--terra)';
  if(passed){
    $('trTitle').textContent='Cours validé !';
    $('trMsg').textContent='Sans-faute. Le cours est acquis et la suite se débloque.';
    mastered[testK].add(testN.id); persistMastered();
    $('trAction').textContent='Continuer'; $('trAction').className='doneBtn';
    $('trAction').onclick=()=>openDomain(testK);
  } else {
    $('trTitle').textContent='Pas encore';
    $('trMsg').textContent=testErrors+' erreur'+(testErrors>1?'s':'')+' sur '+testQueue.length+'. Il faut un sans-faute pour valider — relis le cours et réessaie.';
    $('trAction').textContent='Réessayer le test'; $('trAction').className='doneBtn';
    $('trAction').onclick=()=>startTest(testK,testN);
  }
}
$('trBack').onclick=()=>openCourse(testK,testN);
let resetArmed=false;
function renderProgress(){
  $('totalPc').textContent=totalPct()+'%';
  if($('resetProgress')){ resetArmed=false; $('resetProgress').textContent='Réinitialiser ma progression d\'apprentissage'; $('resetProgress').classList.remove('armed'); }
  const g=$('progList'); g.innerHTML='';
  Object.entries(D.SKILLS).forEach(([k,s])=>{
    const row=document.createElement('button'); row.className='pgrow'; row.style.cssText='display:flex;align-items:center;gap:14px;width:100%;background:none;border:none;border-bottom:1px solid var(--line);cursor:pointer;font:inherit;text-align:left;padding:14px 0';
    row.style.setProperty('--c',s.color);
    row.innerHTML='<span class="ic">'+s.icon+'</span><div class="mid" style="flex:1;min-width:0"><h4>'+s.name+'</h4><span class="bar"><i style="width:'+pct(k)+'%"></i></span></div><span class="pc">'+pct(k)+'%</span>';
    row.onclick=()=>openDomain(k); g.appendChild(row);
  });
}
$('resetProgress').onclick=()=>{
  if(!resetArmed){
    resetArmed=true;
    $('resetProgress').textContent='Confirmer la réinitialisation ? (toucher à nouveau)';
    $('resetProgress').classList.add('armed');
    setTimeout(()=>{ if(resetArmed){ resetArmed=false; $('resetProgress').textContent='Réinitialiser ma progression d\'apprentissage'; $('resetProgress').classList.remove('armed'); } }, 4000);
    return;
  }
  resetArmed=false;
  $('resetProgress').classList.remove('armed');
  Object.keys(mastered).forEach(k=>mastered[k].clear());
  persistMastered();
  renderProgress();
  $('resetProgress').textContent='✓ Progression réinitialisée';
  setTimeout(()=>{ $('resetProgress').textContent='Réinitialiser ma progression d\'apprentissage'; }, 2000);
};

/* ====== STABLE (Écuries du Freyche) ====== */
function esc(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
const SP_ICON={Cheval:'🐴',Poney:'🐎',Poule:'🐔',Mouton:'🐑',Chien:'🐕',Chat:'🐈',Autre:'🐾'};
// init collections + migration horses->animals
if(!STORE.animals){ STORE.animals = (STORE.horses||[]).map(h=>({...h, species:h.species||'Cheval'})); }
if(!STORE.orders) STORE.orders=[];
if(!STORE.stock) STORE.stock=[];
if(!STORE.contacts) STORE.contacts=[];
if(!STORE.tasks) STORE.tasks=[];

const STABLE_MENU=[
  {key:'animals', ic:'🐴', t:'Animaux', count:()=>STORE.animals.length+' fiches'},
  {key:'care', ic:'➕', t:'Soins / santé', count:()=>{let n=0;STORE.animals.forEach(a=>n+=(a.care||[]).length);return n+' soins'}},
  {key:'orders', ic:'🌾', t:'Commandes', count:()=>{const p=STORE.orders.filter(o=>!o.received).length;return p?p+' en attente':STORE.orders.length+' commandes'}},
  {key:'stock', ic:'📦', t:'Stock / matériel', count:()=>STORE.stock.length+' articles'},
  {key:'contacts', ic:'📇', t:'Contacts', count:()=>STORE.contacts.length+' contacts'},
];
function renderStableMenu(){
  const g=$('stableMenu'); g.innerHTML='';
  STABLE_MENU.forEach(m=>{
    const b=document.createElement('button'); b.className='menucard';
    b.innerHTML='<span class="mi">'+m.ic+'</span><span class="mt">'+m.t+'</span><span class="mc">'+m.count()+'</span>';
    b.onclick=()=>openStableSection(m.key);
    g.appendChild(b);
  });
}
function openGestion(){ mode='stable'; renderStableMenu(); show('scGestion',{back:{lbl:'écuries',fn:()=>navGo('stable')},accent:'#8A5A3C',nav:'stable'}); }
$('optGestion').onclick=openGestion;
$('optTasks').onclick=()=>{ mode='stable'; openStableSection('planning'); };
const SECTION_TITLES={animals:'Animaux',care:'Soins / santé',orders:'Commandes de grain',planning:'Planning',stock:'Stock / matériel',contacts:'Contacts'};
const SECTION_ADD={animals:'+ Ajouter un animal',care:'+ Ajouter un soin',orders:'+ Ajouter une commande',planning:'+ Ajouter une tâche',stock:'+ Ajouter un article',contacts:'+ Ajouter un contact'};
let currentSection=null;
function openStableSection(key){
  currentSection=key; mode='stable';
  $('ssTitle').textContent=SECTION_TITLES[key];
  $('ssAdd').textContent=SECTION_ADD[key];
  $('ssAdd').onclick=SECTION_ADD_FN[key];
  renderSection(key);
  const backFn = key==='planning' ? (()=>navGo('stable')) : openGestion;
  const backLbl = key==='planning' ? 'écuries' : 'gestion';
  show('scStableSection',{back:{lbl:backLbl,fn:backFn},accent:'#8A5A3C',nav:'stable'});
}
function renderSection(key){ ({animals:renderAnimals,care:renderCare,orders:renderOrders,planning:renderTasks,stock:renderStock,contacts:renderContacts}[key])(); }

/* --- ANIMALS --- */
function renderAnimals(){
  const list=$('ssList'); list.innerHTML='';
  if(!STORE.animals.length){ list.innerHTML='<div class="empty">Aucun animal pour l\'instant.</div>'; return; }
  STORE.animals.forEach(a=>{
    const card=document.createElement('div'); card.className='horsecard';
    card.innerHTML='<div class="hc-top"><span class="hi">'+(SP_ICON[a.species]||'🐾')+'</span><div style="flex:1"><h4>'+esc(a.name)+'</h4><div class="hmeta">'+[esc(a.species),esc(a.breed),a.age?esc(''+a.age):''].filter(Boolean).join(' · ')+'</div></div></div>'+
      (a.notes?'<div class="hnotes">'+esc(a.notes)+'</div>':'')+
      '<div class="hactions"><button class="miniBtn" data-edit="'+a.id+'">Modifier</button><button class="miniBtn del" data-del="'+a.id+'">Supprimer</button></div>';
    list.appendChild(card);
  });
  list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openAnimalModal(b.dataset.edit));
  list.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    if(b.dataset.armed!=='1'){ b.dataset.armed='1'; b.textContent='Confirmer ?'; b.classList.add('del'); setTimeout(()=>{ if(b.dataset.armed==='1'){ b.dataset.armed='0'; b.textContent='Supprimer'; } },4000); return; }
    STORE.animals=STORE.animals.filter(x=>x.id!==b.dataset.del); saveStore(); renderSection('animals');
  });
}
/* --- CARE (tous animaux) --- */
function renderCare(){
  const list=$('ssList'); list.innerHTML='';
  const all=[];
  STORE.animals.forEach(a=>(a.care||[]).forEach(c=>all.push({...c, animal:a})));
  all.sort((x,y)=>(y.date||'').localeCompare(x.date||''));
  if(!all.length){ list.innerHTML='<div class="empty">Aucun soin enregistré. Ajoute-en un.</div>'; return; }
  all.forEach(c=>{
    const row=document.createElement('div'); row.className='taskrow';
    row.innerHTML='<span style="font-size:20px">'+(SP_ICON[c.animal.species]||'🐾')+'</span><div class="taskmid"><div class="tl">'+esc(c.type)+' · '+esc(c.animal.name)+'</div><div class="tm">'+(c.date||'')+(c.next?' → '+c.next:'')+(c.note?' · '+esc(c.note):'')+'</div></div>';
    list.appendChild(row);
  });
}
/* --- ORDERS (grain) --- */
function renderOrders(){
  const list=$('ssList'); list.innerHTML='';
  const orders=STORE.orders.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(!orders.length){ list.innerHTML='<div class="empty">Aucune commande. Ajoute ta première commande de grain.</div>'; return; }
  orders.forEach(o=>{
    const row=document.createElement('div'); row.className='taskrow'+(o.received?' done':'');
    row.innerHTML='<button class="taskcheck">'+(o.received?'✓':'')+'</button><div class="taskmid"><div class="tl">'+esc(o.item)+' · '+esc(o.qty)+'</div><div class="tm">'+(o.date||'')+(o.supplier?' · '+esc(o.supplier):'')+(o.received?' · reçu':' · en attente')+'</div></div><button class="taskdel">×</button>';
    row.querySelector('.taskcheck').onclick=()=>{ o.received=!o.received; saveStore(); renderSection('orders'); };
    row.querySelector('.taskdel').onclick=()=>{ STORE.orders=STORE.orders.filter(x=>x.id!==o.id); saveStore(); renderSection('orders'); };
    list.appendChild(row);
  });
}
/* --- PLANNING --- */
function renderTasks(){
  const list=$('ssList'); list.innerHTML='';
  const tasks=STORE.tasks.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  if(!tasks.length){ list.innerHTML='<div class="empty">Aucune tâche planifiée.</div>'; return; }
  tasks.forEach(t=>{
    const animal=STORE.animals.find(a=>a.id===t.horseId);
    const row=document.createElement('div'); row.className='taskrow'+(t.done?' done':'');
    row.innerHTML='<button class="taskcheck">'+(t.done?'✓':'')+'</button><div class="taskmid"><div class="tl">'+esc(t.label)+'</div><div class="tm">'+(t.date||'')+(animal?' · '+esc(animal.name):'')+'</div></div><button class="taskdel">×</button>';
    row.querySelector('.taskcheck').onclick=()=>{ t.done=!t.done; saveStore(); renderSection('planning'); };
    row.querySelector('.taskdel').onclick=()=>{ STORE.tasks=STORE.tasks.filter(x=>x.id!==t.id); saveStore(); renderSection('planning'); };
    list.appendChild(row);
  });
}
/* --- STOCK --- */
function renderStock(){
  const list=$('ssList'); list.innerHTML='';
  if(!STORE.stock.length){ list.innerHTML='<div class="empty">Stock vide. Ajoute un article (foin, grain…).</div>'; return; }
  STORE.stock.forEach(s=>{
    const row=document.createElement('div'); row.className='taskrow';
    row.innerHTML='<span style="font-size:20px">📦</span><div class="taskmid"><div class="tl">'+esc(s.item)+'</div><div class="tm">'+esc(s.qty)+(s.min?' · seuil : '+esc(s.min):'')+'</div></div><button class="taskdel">×</button>';
    row.querySelector('.taskdel').onclick=()=>{ STORE.stock=STORE.stock.filter(x=>x.id!==s.id); saveStore(); renderSection('stock'); };
    list.appendChild(row);
  });
}
/* --- CONTACTS --- */
function renderContacts(){
  const list=$('ssList'); list.innerHTML='';
  if(!STORE.contacts.length){ list.innerHTML='<div class="empty">Aucun contact. Ajoute véto, maréchal, fournisseur…</div>'; return; }
  STORE.contacts.forEach(c=>{
    const row=document.createElement('div'); row.className='taskrow';
    row.innerHTML='<span style="font-size:20px">📇</span><div class="taskmid"><div class="tl">'+esc(c.name)+' · '+esc(c.role)+'</div><div class="tm">'+(c.phone?esc(c.phone):'')+(c.note?' · '+esc(c.note):'')+'</div></div>'+(c.phone?'<a href="tel:'+esc(c.phone)+'" style="text-decoration:none;font-size:18px">📞</a>':'')+'<button class="taskdel">×</button>';
    row.querySelector('.taskdel').onclick=()=>{ STORE.contacts=STORE.contacts.filter(x=>x.id!==c.id); saveStore(); renderSection('contacts'); };
    list.appendChild(row);
  });
}

/* --- modals : animal --- */
let editingAnimal=null;
function openAnimalModal(id){
  editingAnimal=id?STORE.animals.find(a=>a.id===id):null;
  $('animalModalTitle').textContent=editingAnimal?'Modifier l\'animal':'Nouvel animal';
  $('aName').value=editingAnimal?editingAnimal.name:''; $('aSpecies').value=editingAnimal?editingAnimal.species||'Cheval':'Cheval';
  $('aBreed').value=editingAnimal?editingAnimal.breed||'':''; $('aAge').value=editingAnimal?editingAnimal.age||'':''; $('aNotes').value=editingAnimal?editingAnimal.notes||'':'';
  $('animalModal').classList.add('open');
}
$('aCancel').onclick=()=>$('animalModal').classList.remove('open');
$('aSave').onclick=()=>{
  const name=$('aName').value.trim(); if(!name){ $('aName').focus(); return; }
  const data={ name, species:$('aSpecies').value, breed:$('aBreed').value.trim(), age:$('aAge').value.trim(), notes:$('aNotes').value.trim() };
  if(editingAnimal){ Object.assign(editingAnimal,data); } else { STORE.animals.push({ id:'a_'+Date.now(), ...data, care:[] }); }
  saveStore(); $('animalModal').classList.remove('open'); renderSection('animals');
};
/* --- modals : care --- */
function openCareModal(){
  if(!STORE.animals.length){ alert('Ajoute d\'abord un animal.'); return; }
  const sel=$('careAnimal'); sel.innerHTML=STORE.animals.map(a=>'<option value="'+a.id+'">'+(SP_ICON[a.species]||'')+' '+esc(a.name)+'</option>').join('');
  $('cType').value='Vermifuge'; $('cDate').value=new Date().toISOString().slice(0,10); $('cNext').value=''; $('cNote').value='';
  $('careModal').classList.add('open');
}
$('cCancel').onclick=()=>$('careModal').classList.remove('open');
$('cSave').onclick=()=>{
  const a=STORE.animals.find(x=>x.id===$('careAnimal').value); if(!a) return;
  a.care=a.care||[]; a.care.push({ id:'c_'+Date.now(), type:$('cType').value, date:$('cDate').value, next:$('cNext').value, note:$('cNote').value.trim() });
  saveStore(); $('careModal').classList.remove('open'); renderSection('care');
};
/* --- modals : order --- */
function openOrderModal(){ $('oItem').value=''; $('oQty').value=''; $('oSupplier').value=''; $('oDate').value=new Date().toISOString().slice(0,10); $('orderModal').classList.add('open'); }
$('oCancel').onclick=()=>$('orderModal').classList.remove('open');
$('oSave').onclick=()=>{
  const item=$('oItem').value.trim(); if(!item){ $('oItem').focus(); return; }
  STORE.orders.push({ id:'o_'+Date.now(), item, qty:$('oQty').value.trim(), supplier:$('oSupplier').value.trim(), date:$('oDate').value, received:false });
  saveStore(); $('orderModal').classList.remove('open'); renderSection('orders');
};
/* --- modals : stock --- */
function openStockModal(){ $('stItem').value=''; $('stQty').value=''; $('stMin').value=''; $('stockModal').classList.add('open'); }
$('stCancel').onclick=()=>$('stockModal').classList.remove('open');
$('stSave').onclick=()=>{
  const item=$('stItem').value.trim(); if(!item){ $('stItem').focus(); return; }
  STORE.stock.push({ id:'st_'+Date.now(), item, qty:$('stQty').value.trim(), min:$('stMin').value.trim() });
  saveStore(); $('stockModal').classList.remove('open'); renderSection('stock');
};
/* --- modals : contact --- */
function openContactModal(){ $('ctName').value=''; $('ctRole').value=''; $('ctPhone').value=''; $('ctNote').value=''; $('contactModal').classList.add('open'); }
$('ctCancel').onclick=()=>$('contactModal').classList.remove('open');
$('ctSave').onclick=()=>{
  const name=$('ctName').value.trim(); if(!name){ $('ctName').focus(); return; }
  STORE.contacts.push({ id:'ct_'+Date.now(), name, role:$('ctRole').value.trim(), phone:$('ctPhone').value.trim(), note:$('ctNote').value.trim() });
  saveStore(); $('contactModal').classList.remove('open'); renderSection('contacts');
};
/* --- modals : task --- */
function openTaskModal(){
  $('tLabel').value=''; $('tDate').value=new Date().toISOString().slice(0,10);
  const sel=$('tHorse'); sel.innerHTML='<option value="">— Aucun —</option>'+STORE.animals.map(a=>'<option value="'+a.id+'">'+(SP_ICON[a.species]||'')+' '+esc(a.name)+'</option>').join('');
  $('taskModal').classList.add('open');
}
$('tCancel').onclick=()=>$('taskModal').classList.remove('open');
$('tSave').onclick=()=>{
  const label=$('tLabel').value.trim(); if(!label){ $('tLabel').focus(); return; }
  STORE.tasks.push({ id:'t_'+Date.now(), label, date:$('tDate').value, horseId:$('tHorse').value||null, done:false });
  saveStore(); $('taskModal').classList.remove('open'); renderSection('planning');
};
const SECTION_ADD_FN={animals:()=>openAnimalModal(null),care:openCareModal,orders:openOrderModal,planning:openTaskModal,stock:openStockModal,contacts:openContactModal};
[ 'animalModal','careModal','orderModal','stockModal','contactModal','taskModal' ].forEach(id=>$(id).addEventListener('click',e=>{ if(e.target===$(id))$(id).classList.remove('open'); }));

/* ====== REVISION : moteur FSRS + écran ====== */
const FSRS_W=[0.4072,1.1829,3.1262,15.4722,7.2102,0.5316,1.0651,0.0234,1.616,0.1544,1.0824,1.9813,0.0953,0.2975,2.2042,0.2407,2.9466,0.5034,0.6567];
const FSRS_DECAY=-0.5, FSRS_FACTOR=Math.pow(0.9,1/FSRS_DECAY)-1, FSRS_TARGET=0.9;
const clampF=(x,a,b)=>Math.min(b,Math.max(a,x));
function fsrsInterval(s){ return s/FSRS_FACTOR*(Math.pow(FSRS_TARGET,1/FSRS_DECAY)-1); }
function fsrsRetr(t,s){ return Math.pow(1+FSRS_FACTOR*t/s,FSRS_DECAY); }
function fsrsInitS(g){ return Math.max(FSRS_W[g-1],0.1); }
function fsrsInitD(g){ return clampF(FSRS_W[4]-Math.exp(FSRS_W[5]*(g-1))+1,1,10); }
function fsrsNextD(d,g){ const dd=d-FSRS_W[6]*(g-3); return clampF(FSRS_W[7]*fsrsInitD(4)+(1-FSRS_W[7])*dd,1,10); }
function fsrsGainS(d,s,r,g){ const hp=g===2?FSRS_W[15]:1, eb=g===4?FSRS_W[16]:1; return s*(1+Math.exp(FSRS_W[8])*(11-d)*Math.pow(s,-FSRS_W[9])*(Math.exp((1-r)*FSRS_W[10])-1)*hp*eb); }
function fsrsLapseS(d,s,r){ return Math.min(FSRS_W[11]*Math.pow(d,-FSRS_W[12])*(Math.pow(s+1,FSRS_W[13])-1)*Math.exp((1-r)*FSRS_W[14]),s); }
const DAY=86400000;
function cardState(id){ if(!STORE.srs) STORE.srs={}; return STORE.srs[id]||null; }
function reviewCard(id,g){
  if(!STORE.srs) STORE.srs={};
  const now=Date.now(); let st=STORE.srs[id];
  if(!st){ st={s:fsrsInitS(g), d:fsrsInitD(g), due:now+Math.max(1,Math.round(fsrsInterval(fsrsInitS(g))))*DAY, reps:1}; }
  else {
    const elapsed=Math.max(0,(now-(st.due-Math.round(fsrsInterval(st.s))*DAY))/DAY);
    const r=fsrsRetr(elapsed,st.s);
    st.d=fsrsNextD(st.d,g);
    st.s=(g===1)?fsrsLapseS(st.d,st.s,r):fsrsGainS(st.d,st.s,r,g);
    st.due=now+Math.max(1,Math.round(fsrsInterval(st.s)))*DAY; st.reps=(st.reps||0)+1;
  }
  STORE.srs[id]=st; saveStore();
}
function isDue(id){ const st=cardState(id); return !st || st.due<=Date.now(); }
function dueCards(skill){ return window.NEXUS_CARDS.filter(c=>(!skill||c.skill===skill)&&isDue(c.id)); }

function renderRevise(){
  $('reviseHome').style.display='block'; $('reviseSession').style.display='none';
  const due=dueCards(null);
  $('dueCount').textContent=due.length;
  $('startRevise').textContent=due.length?'Commencer la révision ('+due.length+')':'Tout est à jour ✓';
  $('startRevise').disabled=!due.length; $('startRevise').style.opacity=due.length?'1':'.5';
  const list=$('reviseList'); list.innerHTML='';
  Object.entries(D.SKILLS).forEach(([k,s])=>{
    const total=window.NEXUS_CARDS.filter(c=>c.skill===k).length;
    const d=dueCards(k).length;
    const row=document.createElement('button');
    row.style.cssText='display:flex;align-items:center;gap:14px;width:100%;background:none;border:none;border-bottom:1px solid var(--line);cursor:pointer;font:inherit;text-align:left;padding:13px 0';
    row.innerHTML='<span style="font-size:24px">'+s.icon+'</span><div style="flex:1;min-width:0"><h4 style="font-family:Fraunces,serif;font-size:16px;font-weight:600">'+s.name+'</h4><div style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--mut);margin-top:2px">'+total+' fiches'+(d?' · '+d+' à revoir':' · à jour')+'</div></div>'+(d?'<span style="font-family:JetBrains Mono,monospace;font-size:13px;color:var(--terra)">'+d+'</span>':'<span style="color:var(--sage)">✓</span>');
    row.onclick=()=>{ if(d) startSession(k); };
    list.appendChild(row);
  });
}
let revQueue=[], revIndex=0, revStats=0, revRevealed=false;
function startSession(skill){
  revQueue=dueCards(skill); revIndex=0; revStats=0;
  if(!revQueue.length) return;
  $('reviseHome').style.display='none'; $('reviseSession').style.display='block';
  $('revDone').style.display='none'; $('flashcard').style.display='flex'; showCard();
}
function showCard(){
  if(revIndex>=revQueue.length){ endSession(); return; }
  const c=revQueue[revIndex];
  $('revProgress').textContent='Fiche '+(revIndex+1)+' / '+revQueue.length;
  $('fcSkill').textContent=D.SKILLS[c.skill].name;
  $('fcQ').textContent=c.stmt;
  $('fcChoice').style.display='grid';
  $('fcChoice').querySelectorAll('.vf').forEach(b=>{ b.disabled=false; b.classList.remove('picked'); });
  $('fcVerdict').className='fc-verdict'; $('fcVerdict').textContent='';
  $('fcA').classList.remove('show'); $('fcA').textContent='';
  $('fcNext').style.display='none';
  revRevealed=false;
}
$('fcChoice').querySelectorAll('.vf').forEach(btn=>btn.onclick=()=>{
  if(revRevealed) return;
  revRevealed=true;
  const c=revQueue[revIndex];
  const answer=btn.dataset.v==='true';
  const correct=answer===c.truth;
  $('fcChoice').querySelectorAll('.vf').forEach(b=>{ b.disabled=true; });
  btn.classList.add('picked');
  const v=$('fcVerdict');
  v.textContent=correct?'✓ Correct':('✗ Incorrect — réponse : '+(c.truth?'Vrai':'Faux'));
  v.className='fc-verdict show '+(correct?'right':'wrong');
  $('fcA').textContent=c.explain; $('fcA').classList.add('show');
  reviewCard(c.id, correct?3:1);
  revStats++;
  $('fcNext').style.display='block';
});
$('fcNext').onclick=()=>{ revIndex++; showCard(); };

function endSession(){
  $('flashcard').style.display='none'; $('revDone').style.display='block';
  $('revDoneMsg').textContent=revStats+' fiche'+(revStats>1?'s':'')+' révisée'+(revStats>1?'s':'')+'. Elles reviendront au bon moment.';
}
$('revBackBtn').onclick=()=>renderRevise();
$('startRevise').onclick=()=>{ if(dueCards(null).length) startSession(null); };

goLanding();
