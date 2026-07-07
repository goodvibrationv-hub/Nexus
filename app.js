/* app.js — Logique applicative Nexus Learn. */
const D=window.NEXUS_DATA, C=window.NEXUS_CONTENT, TIERS=D.TIERS;
const $=id=>document.getElementById(id);

/* ====== nav SVG icons ====== */
const NAV_IC={
  home:    '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10L11 4l8 6"/><path d="M5.5 8.2V18H9.5V13.5H12.5V18H16.5V8.2"/></svg>',
  explore: '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="12" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="12" width="7" height="7" rx="1.5"/><rect x="12" y="12" width="7" height="7" rx="1.5"/></svg>',
  revise:  '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 11a6.5 6.5 0 1 1 1.7 4.4"/><polyline points="4.5,16.5 4.5,11 10,11"/></svg>',
  progress:'<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="18" x2="4" y2="12"/><line x1="9" y1="18" x2="9" y2="7"/><line x1="14" y1="18" x2="14" y2="10"/><line x1="19" y1="18" x2="19" y2="4"/></svg>',
  stable:  '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5L11 3.5l9 6"/><rect x="4.5" y="9.5" width="5" height="9" rx="1"/><rect x="12.5" y="12" width="5" height="6.5" rx="1"/><line x1="2" y1="18.5" x2="20" y2="18.5"/></svg>'
};

/* ====== persistent store (localStorage + fallback) ====== */
const STORE={ horses:[], tasks:[], mastered:{}, hardMode:false };
function loadStore(){
  try{
    const raw=localStorage.getItem('nexus_stable');
    if(raw){ const d=JSON.parse(raw); STORE.horses=d.horses||[]; STORE.tasks=d.tasks||[]; STORE.mastered=d.mastered||{}; STORE.srs=d.srs||{}; STORE.hardMode=d.hardMode||false;
      if(d.animals) STORE.animals=d.animals; if(d.orders) STORE.orders=d.orders; if(d.stock) STORE.stock=d.stock; if(d.contacts) STORE.contacts=d.contacts;
      if(d.ecuriesNote!==undefined) STORE.ecuriesNote=d.ecuriesNote; if(d.seedFreyche) STORE.seedFreyche=d.seedFreyche;
      if(d.projects) STORE.projects=d.projects; if(d.seedProjects) STORE.seedProjects=d.seedProjects;
      if(d.daily) STORE.daily=d.daily;
      if(d.profiles){ STORE.profiles=d.profiles; STORE.currentProfile=d.currentProfile||'mael'; if(d.seedProfiles) STORE.seedProfiles=d.seedProfiles; } }
  }catch(e){ /* mémoire seule */ }
  Object.keys(D.SKILLS).forEach(k=>{ if(!STORE.mastered[k]) STORE.mastered[k]=[]; });
}
function saveStore(){ try{ localStorage.setItem('nexus_stable', JSON.stringify(STORE)); }catch(e){} }
loadStore();
const mastered={}; Object.keys(D.SKILLS).forEach(k=>mastered[k]=new Set());
function persistMastered(){ Object.keys(mastered).forEach(k=>STORE.mastered[k]=[...mastered[k]]); saveStore(); }

/* ====== profils (multi-utilisateur local + supervision) ======
   Chaque profil possède SA progression d'apprentissage (mastered + srs + hardMode)
   et des stats d'usage. Le Domaine du Freyche (chevaux, tâches, projets…) reste commun.
   STORE.mastered / STORE.srs / STORE.hardMode pointent toujours sur le profil actif :
   persistMastered() et reviewCard() écrivent donc directement dans le bon profil. */
const ADMIN_CODE='Lavieaufreyche';
let adminUnlocked=false;                          // déverrouillage de session, jamais persisté
function todayStr(){ return new Date().toISOString().slice(0,10); }
function newStats(){ return { createdAt:Date.now(), lastSeen:0, reviews:0, sessions:0, days:[] }; }
function initProfiles(){
  if(!STORE.profiles){
    STORE.profiles={
      mael:  { name:'Maël',   role:'admin', mastered:STORE.mastered||{}, srs:STORE.srs||{}, hardMode:!!STORE.hardMode, stats:newStats() },
      alizee:{ name:'Alizée', role:'user',  mastered:{}, srs:{}, hardMode:false, stats:newStats() },
      lali:  { name:'Lali',   role:'user',  mastered:{}, srs:{}, hardMode:false, stats:newStats() }
    };
    STORE.currentProfile='mael'; STORE.seedProfiles=true;
  }
  Object.values(STORE.profiles).forEach(p=>{
    if(!p.mastered) p.mastered={}; if(!p.srs) p.srs={}; if(!p.stats) p.stats=newStats();
    if(!Array.isArray(p.stats.days)) p.stats.days=[];
    Object.keys(D.SKILLS).forEach(k=>{ if(!p.mastered[k]) p.mastered[k]=[]; });
  });
  if(!STORE.currentProfile || !STORE.profiles[STORE.currentProfile]) STORE.currentProfile='mael';
}
function curProfile(){ return STORE.profiles[STORE.currentProfile]; }
function bumpSeen(){ const p=curProfile(); if(!p) return; p.stats.lastSeen=Date.now(); const t=todayStr(); if(!p.stats.days.includes(t)) p.stats.days.push(t); }
function activateProfile(id){
  if(!STORE.profiles[id]) id='mael';
  STORE.currentProfile=id; adminUnlocked=false;
  const p=STORE.profiles[id];
  STORE.mastered=p.mastered; STORE.srs=p.srs; STORE.hardMode=!!p.hardMode;   // partage par référence
  Object.keys(D.SKILLS).forEach(k=>{ mastered[k].clear(); (p.mastered[k]||[]).forEach(x=>mastered[k].add(x)); });
  bumpSeen(); saveStore();
}
initProfiles();
activateProfile(STORE.currentProfile);

function pct(k){return Math.round(mastered[k].size/D.SKILLS[k].nodes.length*100);}
function totalPct(){let m=0,t=0;for(const k in D.SKILLS){m+=mastered[k].size;t+=D.SKILLS[k].nodes.length;}return Math.round(m/t*100);}

/* ====== screen mgmt ====== */
let current=null,currentNode=null,currentSkillK=null,mode='landing';
function show(screen,{accent='#3F5E4E',nav=''}={}){
  document.documentElement.style.setProperty('--forest',accent);
  ['scProfiles','scLanding','scHome','scDetail','scCourse','scTest','scProgress','scStable','scGestion','scStableSection','scAnimal','scRevise','scAdmin'].forEach(s=>$(s).classList.remove('active'));
  $(screen).classList.add('active');
  buildNav(nav);
  const bn=$('bottomnav'); if(bn) bn.style.display=(screen==='scProfiles'||screen==='scAdmin')?'none':'';
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ====== historique de navigation ======
   Vrai « retour » : chaque écran s'empile ; le bouton ← (et le bouton retour
   du téléphone via popstate) reviennent exactement à l'écran précédent. */
const BROWSER_NAV = (typeof window!=='undefined' && typeof history!=='undefined' && typeof history.pushState==='function');
let navHist=[];        // pile des écrans précédents : {go, label}
let navCur=null;       // écran courant
let navPopping=false;
function go(replay, label){
  label=label||'';
  if(navCur && navCur.label===label){ navCur={go:replay,label}; replay(); refreshBack(); return; }  // re-tap du même écran : remplace
  if(navCur) navHist.push(navCur);
  navCur={go:replay, label};
  replay(); refreshBack();
  if(BROWSER_NAV && !navPopping){ try{ history.pushState({n:navHist.length},''); }catch(e){} }
}
function goRoot(replay, label){    // réinitialise la pile (retour à l'accueil)
  navHist=[]; navCur={go:replay, label:label||''};
  replay(); refreshBack();
  if(BROWSER_NAV){ try{ history.replaceState({n:0},''); }catch(e){} }
}
function navBack(){
  if(!navHist.length) return false;
  navCur=navHist.pop();
  navPopping=true; navCur.go(); navPopping=false;
  refreshBack();
  return true;
}
function doBack(){ if(BROWSER_NAV){ try{ history.back(); return; }catch(e){} } navBack(); }
function refreshBack(){
  const b=$('backBtn');
  if(navHist.length){ b.style.display='flex'; $('backLbl').textContent=navHist[navHist.length-1].label||'retour'; b.onclick=doBack; }
  else { b.style.display='none'; b.onclick=null; }
}
if(BROWSER_NAV) window.addEventListener('popstate', ()=>{ navBack(); });

/* ====== bottom nav (contextual) ====== */
function navBtn(active, key, icon, label){
  return '<button class="navbtn'+(active===key?' on':'')+'" data-go="'+key+'"><span class="ni">'+icon+'</span><span class="nl">'+label+'</span></button>';
}
function buildNav(active){
  const nav=$('bottomnav');
  if(mode==='stable'){
    document.body.classList.add('stable-mode');
    nav.innerHTML=
      navBtn(active,'landing',NAV_IC.home,'Accueil')+
      navBtn(active,'stable',NAV_IC.stable,'Domaine');
  } else {
    document.body.classList.remove('stable-mode');
    nav.innerHTML=
      navBtn(active,'landing',NAV_IC.home,'Accueil')+
      navBtn(active,'domains',NAV_IC.explore,'Explorer')+
      navBtn(active,'revise',NAV_IC.revise,'Réviser')+
      navBtn(active,'progress',NAV_IC.progress,'Progrès');
  }
  nav.querySelectorAll('.navbtn').forEach(b=>b.onclick=()=>navGo(b.dataset.go));
}
/* rendus purs (appelés par go/navBack) */
function rDomains(){ mode='learn'; renderHome(); show('scHome',{nav:'domains'}); }
function rProgress(){ mode='learn'; renderProgress(); show('scProgress',{nav:'progress'}); }
function rRevise(){ mode='learn'; renderRevise(); show('scRevise',{nav:'revise'}); }
function rStable(){ mode='stable';
  const today=new Date().toISOString().slice(0,10); const dd=(STORE.daily&&STORE.daily.date===today)?STORE.daily.done:{};
  let tot=0,dn=0; (STORE.animals||[]).forEach(a=>{ const t=feedTimes(a); if(t.matin){tot++; if(dd['m_'+a.id])dn++;} if(t.soir){tot++; if(dd['s_'+a.id])dn++;} });
  $('optTasksCount').textContent = tot ? ((tot-dn)+' repas à faire — matin 9h, soir 19h.') : 'Repas des chevaux — matin & soir.';
  const na=(STORE.animals||[]).length; $('optEcuriesCount').textContent=na?(na+(na>1?' animaux':' animal')+' · soins et santé.'):'Ajoute tes animaux et leurs soins.';
  show('scStable',{accent:'#8A5A3C',nav:'stable'});
}
function navGo(g){
  if(g==='landing') goHome();
  else if(g==='domains') go(rDomains,'domaines');
  else if(g==='progress') go(rProgress,'progrès');
  else if(g==='revise') go(rRevise,'révision');
  else if(g==='stable') go(rStable,'domaine');
}

/* ====== landing ====== */
const PROFILE_AV={ mael:'🧭', alizee:'🌸', lali:'🦋' };
function profileAvatar(id){ return PROFILE_AV[id]||'👤'; }
function goLanding(){ mode='landing';
  const p=curProfile();
  if($('chipName')) $('chipName').textContent=p?p.name:'Profil';
  if($('chipAv')) $('chipAv').textContent=profileAvatar(STORE.currentProfile);
  if($('doorAdmin')) $('doorAdmin').style.display=(p&&p.role==='admin')?'block':'none';
  show('scLanding',{accent:'#3F5E4E',nav:'landing'});
}
function goHome(){ goRoot(goLanding,'accueil'); }
$('doorLearn').onclick=()=>go(rDomains,'domaines');
$('doorStable').onclick=()=>navGo('stable');
if($('profileChip')) $('profileChip').onclick=()=>goProfiles();
if($('doorAdmin')) $('doorAdmin').onclick=()=>openAdmin();

/* ====== choix de profil (écran racine) ====== */
function goProfiles(){ mode='landing'; goRoot(renderProfiles,'profils'); }
function renderProfiles(){
  const g=$('profileList'); if(!g) return; g.innerHTML='';
  Object.entries(STORE.profiles).forEach(([id,p])=>{
    const b=document.createElement('button'); b.className='pcard'+(p.role==='admin'?' admin':'');
    const gp=globalPct(p);
    b.innerHTML='<span class="pv">'+profileAvatar(id)+'</span>'+
      '<span class="pmid"><span class="pnm">'+esc(p.name)+(p.role==='admin'?' <span class="prole">admin</span>':'')+'</span>'+
      '<span class="psub">'+gp+'% de progression'+(p.stats&&p.stats.lastSeen?' · vu '+relDate(p.stats.lastSeen):'')+'</span></span>'+
      '<span class="parw">→</span>';
    b.onclick=()=>{ activateProfile(id); goHome(); };
    g.appendChild(b);
  });
  show('scProfiles',{accent:'#3F5E4E',nav:''});
}
function globalPct(p){ let m=0,t=0; for(const k in D.SKILLS){ m+=(p.mastered[k]||[]).length; t+=D.SKILLS[k].nodes.length; } return t?Math.round(m/t*100):0; }
function relDate(ts){ if(!ts) return 'jamais'; const d=Math.floor((Date.now()-ts)/86400000);
  if(d<=0) return "aujourd'hui"; if(d===1) return 'hier'; if(d<7) return 'il y a '+d+' j'; if(d<30) return 'il y a '+Math.floor(d/7)+' sem'; return 'il y a '+Math.floor(d/30)+' mois'; }

/* ====== supervision (admin, protégée par code) ====== */
function openAdmin(){ go(renderAdmin,'supervision'); }
function renderAdmin(){
  const unlocked=adminUnlocked;
  $('adminGate').style.display=unlocked?'none':'block';
  $('adminBoard').style.display=unlocked?'block':'none';
  if(!unlocked){
    if($('adminCode')) $('adminCode').value='';
    if($('adminErr')) $('adminErr').style.display='none';
  } else { renderAdminBoard(); }
  show('scAdmin',{accent:'#8A5A3C',nav:''});
}
if($('adminEnter')) $('adminEnter').onclick=()=>{
  const v=($('adminCode').value||'').trim();
  if(v===ADMIN_CODE){ adminUnlocked=true; renderAdmin(); }
  else { $('adminErr').style.display='block'; }
};
if($('adminCode')) $('adminCode').onkeydown=(e)=>{ if(e&&e.key==='Enter') $('adminEnter').onclick(); };

/* stats d'un profil (lecture seule ; réutilise LEVELS/NEXUS_CARDS) */
function profileStats(p){
  const now=Date.now(), nDom=Object.keys(D.SKILLS).length;
  let masteredN=0, totalN=0, dDone=0; const domPct={};
  for(const [k,s] of Object.entries(D.SKILLS)){
    const size=(p.mastered[k]||[]).length; masteredN+=size; totalN+=s.nodes.length;
    if(size===s.nodes.length) dDone++; domPct[k]=Math.round(size/s.nodes.length*100);
  }
  let solide=0, fragile=0, retard=0, vue=0, jamais=0;
  const srs=p.srs||{};
  for(const c of window.NEXUS_CARDS){ const st=srs[c.id];
    if(!st){ jamais++; continue; } vue++;
    if(st.s>=21) solide++; if(st.s<10) fragile++; if(st.due<=now) retard++;
  }
  const prop=totalN?masteredN/totalN:0; let li=0; for(let i=0;i<LEVELS.length;i++){ if(prop>=LEVELS[i][0]) li=i; }
  const weakest=Object.entries(domPct).filter(([k])=>(p.mastered[k]||[]).length<D.SKILLS[k].nodes.length).sort((a,b)=>a[1]-b[1])[0];
  return { level:LEVELS[li][1], glob:Math.round(prop*100), masteredN, totalN, dDone, nDom, domPct, solide, fragile, retard, vue, jamais, weakest, stats:p.stats||newStats() };
}
function renderAdminBoard(){
  const users=Object.entries(STORE.profiles);
  $('adminSub').textContent=users.length+' profils · progression, révisions et lacunes.';
  const wrap=$('adminCards'); wrap.innerHTML='';
  users.forEach(([id,p])=>{
    const st=profileStats(p); const S=st.stats;
    const card=document.createElement('div'); card.className='ucard'+(p.role==='admin'?' admin':'');
    const doms=Object.entries(st.domPct).sort((a,b)=>b[1]-a[1])
      .map(([k,v])=>'<div class="udom"><span class="dn">'+esc(D.SKILLS[k].name)+'</span><span class="db"><i style="width:'+v+'%;background:'+D.SKILLS[k].color+'"></i></span><span class="dp">'+v+'%</span></div>').join('');
    const stat=(v,l,warn)=>'<div class="ustat'+(warn?' warn':'')+'"><div class="sv">'+v+'</div><div class="sl">'+l+'</div></div>';
    const weak=st.weakest?('« '+D.SKILLS[st.weakest[0]].name+' » ('+st.weakest[1]+'%)'):'—';
    card.innerHTML=
      '<div class="uhead"><span class="uav">'+profileAvatar(id)+'</span><span class="unm">'+esc(p.name)+'</span><span class="ulvl">'+st.level+'</span></div>'+
      '<div class="uglob"><span class="ubig">'+st.glob+'%</span><span class="ubar"><i style="width:'+st.glob+'%"></i></span></div>'+
      '<div class="usect">Progression par domaine</div><div class="udoms">'+doms+'</div>'+
      '<div class="usect">Activité de révision</div><div class="ustats">'+
        stat((S.reviews||0),'révisions faites')+stat((S.sessions||0),'séries lancées')+
        stat((S.days?S.days.length:0),'jours actifs')+stat(relDate(S.lastSeen),'dernière activité')+
      '</div>'+
      '<div class="usect">Lacunes</div><div class="ustats">'+
        stat(st.totalN-st.masteredN,'nœuds à débloquer',st.totalN-st.masteredN>0)+
        stat(st.fragile,'fiches fragiles',st.fragile>0)+
        stat(st.retard,'fiches en retard',st.retard>0)+
        stat(weak,'domaine le plus faible')+
      '</div>'+
      '<div class="uacts"><button data-rename="'+id+'">Renommer</button><button class="danger" data-reset="'+id+'">Réinitialiser la progression</button></div>';
    wrap.appendChild(card);
  });
  wrap.querySelectorAll('[data-rename]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.rename, p=STORE.profiles[id];
    const nv=(typeof prompt==='function')?prompt('Nouveau nom du profil',p.name):null;
    if(renameProfile(id,nv)) renderAdminBoard();
  });
  wrap.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.reset;
    if(b.classList.contains('armed')){ resetProfile(id); renderAdminBoard(); return; }
    b.classList.add('armed'); b.textContent='Confirmer ? (toucher à nouveau)';
    setTimeout(()=>{ if(b&&b.classList.contains('armed')){ b.classList.remove('armed'); b.textContent='Réinitialiser la progression'; } },4000);
  });
}
function renameProfile(id,name){ const p=STORE.profiles[id]; if(p&&name&&String(name).trim()){ p.name=String(name).trim(); saveStore(); return true; } return false; }
function resetProfile(id){ const p=STORE.profiles[id]; if(!p) return;
  Object.keys(D.SKILLS).forEach(k=>{ p.mastered[k]=[]; }); p.srs={}; p.stats=newStats();
  if(id===STORE.currentProfile){ Object.keys(mastered).forEach(k=>mastered[k].clear()); STORE.srs=p.srs; STORE.mastered=p.mastered; }
  saveStore();
}

/* ====== learning ====== */
function renderHome(){
  const g=$('domainList'); g.innerHTML='';
  const n=Object.keys(D.SKILLS).length;
  if($('domainCount')) $('domainCount').textContent=n+' domaines';
  Object.entries(D.SKILLS).forEach(([k,s])=>{
    const b=document.createElement('button'); b.className='dtile'; b.style.setProperty('--c',s.color);
    b.innerHTML='<div class="top"><span class="ic">'+s.icon+'</span><h3>'+s.name+'</h3></div><div class="barwrap"><span class="bar"><i style="width:'+pct(k)+'%"></i></span><span class="pc">'+pct(k)+'%</span></div>';
    b.onclick=()=>openDomain(k); g.appendChild(b);
  });
}
function statusOf(k,n){ if(mastered[k].has(n.id))return 'mastered'; if(n.deps.every(d=>mastered[k].has(d)))return 'available'; return 'locked'; }
function nameOf(k,id){ return D.SKILLS[k].nodes.find(x=>x.id===id).t; }
function openDomain(k){ const s=D.SKILLS[k]; go(()=>{
  current=k; mode='learn';
  $('dIc').textContent=s.icon; $('dTitle').textContent=s.name; $('dMeta').textContent=s.meta; renderTree();
  show('scDetail',{accent:s.color,nav:'domains'});
}, s.name); }
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
function openCourse(k,n){ const s=D.SKILLS[k]; go(()=>{
  currentNode=n; currentSkillK=k; const c=C[n.id];
  $('cTag').textContent=c.tag; $('cTitle').textContent=c.title; $('cLead').textContent=c.lead; $('cBody').innerHTML=expandFigures(c.body);
  renderCourseFoot(k,n);
  show('scCourse',{accent:s.color,nav:'domains'});
}, n.t); }
function questionsFor(nodeId){ return window.NEXUS_CARDS.filter(c=>c.node===nodeId); }
function renderCourseFoot(k,n){
  const foot=$('courseFoot'); const done=mastered[k].has(n.id);
  const tfPool=questionsFor(n.id).filter(c=>(c.type||'tf')==='tf'); const nb=Math.min(TEST_LEN,tfPool.length);
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
/* Test de validation durci : 15 questions vrai/faux tirées à neuf dans le nœud,
   conditions d'examen (aucune correction avant la fin), sans-faute requis pour valider,
   puis bilan ciblé listant les affirmations ratées. Indépendant du moteur FSRS. */
const TEST_LEN=15;
let testK=null, testN=null, testQueue=[], testIdx=0, testAnswers=[], testRevealed=false;
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function startTest(k,n){ go(()=>{
  testK=k; testN=n;
  const pool=questionsFor(n.id).filter(c=>(c.type||'tf')==='tf');
  testQueue=shuffle(pool).slice(0,Math.min(TEST_LEN,pool.length));
  testIdx=0; testAnswers=[];
  $('testTitle').textContent=n.t;
  $('trReview').innerHTML='';
  $('testResult').style.display='none'; $('testCard').style.display='flex';
  showTestCard();
  show('scTest',{accent:D.SKILLS[k].color,nav:'domains'});
}, 'test'); }
function showTestCard(){
  if(testIdx>=testQueue.length){ endTest(); return; }
  const c=testQueue[testIdx];
  $('testProgress').textContent='Question '+(testIdx+1)+' / '+testQueue.length;
  $('tcQ').textContent=c.stmt;
  $('tcChoice').style.display='grid';
  $('tcChoice').querySelectorAll('.vf').forEach(b=>{ b.disabled=false; b.classList.remove('picked'); });
  $('tcPicked').textContent='';
  $('tcNext').style.display='none';
  testRevealed=false;
}
/* Conditions d'examen : on enregistre la réponse SANS révéler si elle est juste. */
$('tcChoice').querySelectorAll('.vf').forEach(btn=>btn.onclick=()=>{
  if(testRevealed) return; testRevealed=true;
  const c=testQueue[testIdx]; const answer=btn.dataset.v==='true'; const correct=answer===c.truth;
  $('tcChoice').querySelectorAll('.vf').forEach(b=>b.disabled=true); btn.classList.add('picked');
  testAnswers.push({c:c, picked:answer, correct:correct});
  $('tcPicked').textContent='Réponse enregistrée · '+(answer?'Vrai':'Faux');
  const last=(testIdx+1>=testQueue.length);
  $('tcNext').textContent=last?'Voir le résultat':'Question suivante';
  $('tcNext').style.display='block';
});
$('tcNext').onclick=()=>{ testIdx++; showTestCard(); };
function endTest(){
  $('testCard').style.display='none'; $('testResult').style.display='block';
  const misses=testAnswers.filter(a=>!a.correct);
  const passed=misses.length===0;
  const total=testQueue.length;
  const rv=$('trReview'); rv.innerHTML='';
  $('trIc').textContent=passed?'🎉':'✗';
  $('trIc').style.color=passed?'var(--sage)':'var(--terra)';
  if(passed){
    $('trTitle').textContent='Cours validé !';
    $('trMsg').textContent='Sans-faute sur '+total+' questions. Le cours est acquis et la suite se débloque.';
    mastered[testK].add(testN.id); persistMastered();
    $('trAction').textContent='Continuer'; $('trAction').className='doneBtn';
    $('trAction').onclick=()=>openDomain(testK);
  } else {
    $('trTitle').textContent='Pas encore';
    $('trMsg').textContent=misses.length+' erreur'+(misses.length>1?'s':'')+' sur '+total+'. Il faut un sans-faute pour valider. À revoir :';
    misses.forEach(a=>{
      const item=document.createElement('div'); item.className='test-miss';
      item.innerHTML='<div class="tm-q">'+esc(a.c.stmt)+'</div><div class="tm-a">Bonne réponse : '+(a.c.truth?'Vrai':'Faux')+'</div><div class="tm-e">'+esc(a.c.explain||'')+'</div>';
      rv.appendChild(item);
    });
    $('trAction').textContent='Réessayer le test'; $('trAction').className='doneBtn';
    $('trAction').onclick=()=>startTest(testK,testN);
  }
}
$('trBack').onclick=()=>doBack();
let resetArmed=false;
/* Niveau + indicateurs (victoires/lacunes) + coaching personnalisé, à partir de
   mastered (nœuds) et de l'état FSRS de chaque fiche. Lecture seule, aucun schéma ajouté. */
const LEVELS=[[0,'Novice'],[0.10,'Débutant'],[0.25,'Apprenti'],[0.50,'Confirmé'],[0.75,'Avancé'],[0.95,'Expert']];
function renderLevelSection(){
  const now=Date.now();
  let masteredN=0, totalN=0, dDone=0; const domPct={}, nDom=Object.keys(D.SKILLS).length;
  for(const [k,s] of Object.entries(D.SKILLS)){
    masteredN+=mastered[k].size; totalN+=s.nodes.length;
    if(mastered[k].size===s.nodes.length) dDone++;
    domPct[k]=pct(k);
  }
  let solide=0, fragile=0, retard=0, vue=0, reps=0, jamais=0; const domOverdue={};
  for(const c of window.NEXUS_CARDS){
    const st=cardState(c.id);
    if(!st){ jamais++; continue; }
    vue++; reps+=(st.reps||0);
    if(st.s>=21) solide++;
    if(st.s<10) fragile++;
    if(st.due<=now){ retard++; domOverdue[c.skill]=(domOverdue[c.skill]||0)+1; }
  }
  const p=totalN?masteredN/totalN:0;
  let li=0; for(let i=0;i<LEVELS.length;i++){ if(p>=LEVELS[i][0]) li=i; }
  $('lvlName').textContent=LEVELS[li][1];
  $('lvlSub').textContent=masteredN+' nœud'+(masteredN>1?'s':'')+' maîtrisé'+(masteredN>1?'s':'')+' sur '+totalN;
  $('lvlBar').style.width=Math.round(p*100)+'%';
  if(li<LEVELS.length-1){ const need=Math.max(1,Math.ceil(LEVELS[li+1][0]*totalN)-masteredN); $('lvlNext').textContent='Plus que '+need+' nœud'+(need>1?'s':'')+' pour « '+LEVELS[li+1][1]+' ».'; }
  else $('lvlNext').textContent='Niveau maximum atteint — bravo.';
  const tile=(v,l,cls)=>'<div class="ind '+cls+'"><span class="v">'+v+'</span><span class="l">'+l+'</span></div>';
  $('winGrid').innerHTML=[
    tile(masteredN+' / '+totalN,'nœuds maîtrisés','win'),
    tile(dDone+' / '+nDom,'domaines complétés','win'),
    tile(solide,'fiches solides','win'),
    tile(reps,'révisions faites','win')
  ].join('');
  $('gapGrid').innerHTML=[
    tile(totalN-masteredN,'nœuds à débloquer','gap'),
    tile(fragile,'fiches fragiles','gap'),
    tile(retard,'fiches en retard','gap'),
    tile(jamais,'fiches à découvrir','gap')
  ].join('');
  const nameOf=k=>D.SKILLS[k].name;
  const weakest=Object.entries(domPct).filter(([k])=>mastered[k].size<D.SKILLS[k].nodes.length).sort((a,b)=>a[1]-b[1])[0];
  const neglected=Object.entries(domOverdue).sort((a,b)=>b[1]-a[1])[0];
  const tips=[];
  if(masteredN===0) tips.push('🚀 Valide un premier cours pour lancer ta progression : lis-le, puis passe le test.');
  if(retard>0) tips.push('🔁 '+retard+' fiche'+(retard>1?'s':'')+' en retard — une session de révision les remet d’aplomb.');
  if(neglected && neglected[1]>0) tips.push('🕒 Tu délaisses « '+nameOf(neglected[0])+' » : '+neglected[1]+' fiche'+(neglected[1]>1?'s':'')+' y attendent une révision.');
  if(weakest) tips.push('📉 Ton domaine le plus en retrait : « '+nameOf(weakest[0])+' » ('+weakest[1]+' %). Débloque le prochain nœud pour combler l’écart.');
  if(fragile>0) tips.push('🧠 '+fragile+' fiche'+(fragile>1?'s':'')+' encore fragile'+(fragile>1?'s':'')+' : les revoir les ancre durablement.');
  if(solide>0) tips.push('✅ '+solide+' fiche'+(solide>1?'s':'')+' désormais solide'+(solide>1?'s':'')+' — tes révisions paient.');
  if(dDone>0) tips.push('🏆 '+dDone+' domaine'+(dDone>1?'s':'')+' complété'+(dDone>1?'s':'')+'. Continue sur cette lancée.');
  if(retard===0 && vue>0) tips.push('🌿 Tout est à jour côté révisions. Profites-en pour débloquer un nouveau nœud.');
  $('proTips').innerHTML = tips.length ? tips.slice(0,4).map(t=>'<div class="tip">'+t+'</div>').join('') : '<div class="tip">Commence à apprendre pour recevoir des conseils personnalisés.</div>';
}
function renderProgress(){
  $('totalPc').textContent=totalPct()+'%';
  renderLevelSection();
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
if(!STORE.projects) STORE.projects=[];
/* migration : nouveaux champs de fiche animal */
STORE.animals.forEach(a=>{ if(a.sex===undefined)a.sex=''; if(a.regime===undefined)a.regime=''; if(a.hay===undefined)a.hay=/braddy/i.test(a.name||'')?2:1; if(!Array.isArray(a.noteLog))a.noteLog=[]; if(!Array.isArray(a.photos))a.photos=[]; if(!Array.isArray(a.care))a.care=[]; });
if(STORE.ecuriesNote===undefined) STORE.ecuriesNote="Toujours humidifier l'orge (à peine humide) · Mouiller le son";
/* graine unique : chevaux du Freyche avec leur régime */
if(!STORE.seedFreyche){
  [ ['TINA','¾ floc, ¾ orge, ⅓ happy'], ['ERMES','1 floc, ½ orge, ⅓ happy'], ['JAGUAR','2 senior, ⅔ orge, ⅓ happy'],
    ['KITAÏ','1 floc, ½ orge, ⅓ happy — le soir seulement'], ['BRADDY','1 son, ½ orge, ½ floc, ⅓ happy'],
    ['JAM','½ floc + ½ orge, ⅓ happy'], ['GEORGETTE','½ orge + ½ floc, ⅓ happy — 1 fois par jour, le matin'] ]
  .forEach(([name,regime],i)=>{ if(!STORE.animals.some(a=>(a.name||'').trim().toLowerCase()===name.toLowerCase())) STORE.animals.push({ id:'a_seed_'+i, name, species:'Cheval', sex:'', breed:'', age:'', regime, notes:'', noteLog:[], photos:[], care:[] }); });
  STORE.seedFreyche=true; saveStore();
}
/* graine unique : projets du domaine (exemples) */
if(!STORE.seedProjects){
  ['Nettoyage panneaux solaires','Clôtures enclos n°2','Bord des sentiers']
    .forEach((title,i)=>{ if(!STORE.projects.some(p=>(p.title||'').trim().toLowerCase()===title.toLowerCase())) STORE.projects.push({ id:'pj_seed_'+i, title, detail:'', done:false }); });
  STORE.seedProjects=true; saveStore();
}
function saveStoreOk(){ try{ localStorage.setItem('nexus_stable', JSON.stringify(STORE)); return true; }catch(e){ return false; } }

const STABLE_MENU=[
  {key:'projects', ic:'🧰', t:'Projets', count:()=>{const td=STORE.projects.filter(p=>!p.done).length; return td?td+' à faire':STORE.projects.length+' projets';}},
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
function openGestion(){ go(()=>{ mode='stable'; renderStableMenu(); show('scGestion',{accent:'#8A5A3C',nav:'stable'}); }, 'gestion'); }
$('optGestion').onclick=openGestion;
$('optTasks').onclick=()=>{ mode='stable'; openStableSection('daily'); };
$('optEcuries').onclick=()=>{ mode='stable'; openStableSection('ecuries'); };
const SECTION_TITLES={ecuries:'Écuries',daily:'Tâches quotidiennes',projects:'Projets',animals:'Animaux',care:'Soins / santé',orders:'Commandes de grain',planning:'Planning',stock:'Stock / matériel',contacts:'Contacts'};
const SECTION_ADD={ecuries:'+ Ajouter un animal',daily:'',projects:'+ Ajouter un projet',animals:'+ Ajouter un animal',care:'+ Ajouter un soin',orders:'+ Ajouter une commande',planning:'+ Ajouter une tâche',stock:'+ Ajouter un article',contacts:'+ Ajouter un contact'};
let currentSection=null;
function openStableSection(key){ go(()=>{
  currentSection=key; mode='stable';
  $('ssTitle').textContent=SECTION_TITLES[key];
  if(SECTION_ADD[key]){ $('ssAdd').style.display=''; $('ssAdd').textContent=SECTION_ADD[key]; $('ssAdd').onclick=SECTION_ADD_FN[key]; }
  else { $('ssAdd').style.display='none'; }
  renderSection(key);
  show('scStableSection',{accent:'#8A5A3C',nav:'stable'});
}, SECTION_TITLES[key]); }
function renderSection(key){ ({ecuries:renderEcuries,daily:renderDaily,projects:renderProjects,animals:renderAnimals,care:renderCare,orders:renderOrders,planning:renderTasks,stock:renderStock,contacts:renderContacts}[key])(); }
/* --- TÂCHES QUOTIDIENNES : repas des chevaux, matin/soir, d'après le régime --- */
function feedTimes(a){
  const r=(a.regime||'').toLowerCase();
  if(/soir seulement|uniquement le soir|que le soir/.test(r)) return {matin:false,soir:true};
  if(/le matin|matin seulement|uniquement le matin/.test(r)) return {matin:true,soir:false};
  return {matin:true,soir:true};
}
function dailyState(){
  const today=new Date().toISOString().slice(0,10);
  if(!STORE.daily || STORE.daily.date!==today){ STORE.daily={date:today, done:{}}; saveStore(); }  // reset chaque jour
  return STORE.daily;
}
function renderDaily(){
  const list=$('ssList');
  const st=dailyState(); const done=st.done;
  const matin=[], soir=[];
  STORE.animals.forEach(a=>{ const t=feedTimes(a); if(t.matin) matin.push(a); if(t.soir) soir.push(a); });
  const task=(a,slot)=>{ const key=slot+'_'+a.id; const hay=(a.hay!=null?a.hay:1); const d=!!done[key];
    return '<button class="dailytask'+(d?' done':'')+'" data-daily="'+key+'"><span class="dt-check">'+(d?'✓':'')+'</span><span class="dt-body"><span class="dt-name">Nourrir '+esc(a.name)+'</span><span class="dt-detail">'+esc(a.regime||'ration')+' · '+hay+' brouette'+(hay>1?'s':'')+' de foin</span></span></button>'; };
  const sec=(label,time,animals,slot)=>'<div class="daily-sec"><div class="daily-h">'+label+' <span class="daily-t">'+time+'</span></div>'+(animals.length?animals.map(a=>task(a,slot)).join(''):'<div class="empty">Aucun repas.</div>')+'</div>';
  let html = STORE.ecuriesNote ? '<div class="ecuries-banner"><span class="bl">Rappel</span>'+esc(STORE.ecuriesNote)+'</div>' : '';
  html += sec('Matin','9h',matin,'m') + sec('Soir','19h',soir,'s');
  list.innerHTML=html;
  /* clic : bascule + animation, sans re-render (l'anim vient de la transition CSS) */
  list.querySelectorAll('[data-daily]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.daily; const now=!STORE.daily.done[k]; STORE.daily.done[k]=now; saveStore();
    b.classList.toggle('done',now); const chk=b.querySelector('.dt-check'); if(chk) chk.textContent=now?'✓':'';
  });
}
/* --- PROJETS du domaine (chantiers, entretien) --- */
function renderProjects(){
  const list=$('ssList'); list.innerHTML='';
  if(!STORE.projects.length){ list.innerHTML='<div class="empty">Aucun projet. Ajoute un chantier du domaine (entretien, clôtures, sentiers…).</div>'; return; }
  const items=STORE.projects.slice().sort((a,b)=>(a.done?1:0)-(b.done?1:0));
  items.forEach(p=>{
    const row=document.createElement('div'); row.className='taskrow'+(p.done?' done':'');
    row.innerHTML='<button class="taskcheck">'+(p.done?'✓':'')+'</button><div class="taskmid"><div class="tl">'+esc(p.title)+'</div>'+(p.detail?'<div class="tm">'+esc(p.detail)+'</div>':'')+'</div><button class="taskdel">×</button>';
    row.querySelector('.taskcheck').onclick=()=>{ p.done=!p.done; saveStore(); renderSection('projects'); };
    row.querySelector('.taskdel').onclick=()=>{ STORE.projects=STORE.projects.filter(x=>x.id!==p.id); saveStore(); renderSection('projects'); };
    list.appendChild(row);
  });
}
/* --- ÉCURIES : chevaux + leurs soins réunis --- */
/* Vue d'ensemble de TOUS les animaux : lignes compactes (esp./sexe/âge + régime
   en un coup d'œil, pastilles soins/photos) + compteur, pensé pour tenir sans défiler. */
function renderEcuries(){
  const list=$('ssList');
  const na=STORE.animals.length;
  const byName=STORE.animals.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'','fr'));
  let html = STORE.ecuriesNote ? '<div class="ecuries-banner sm"><span class="bl">Rappel</span>'+esc(STORE.ecuriesNote)+'</div>' : '';
  html += '<div class="ec-head">'+na+(na>1?' animaux':' animal')+'</div>';
  if(!na){ list.innerHTML = html + '<div class="empty">Aucun animal pour l\'instant. Ajoute-en un.</div>'; return; }
  html += '<div class="animallist">';
  byName.forEach(a=>{
    const meta=[esc(a.species),a.sex?esc(a.sex):'',esc(a.breed),a.age?esc(''+a.age):''].filter(Boolean).join(' · ');
    const np=(a.photos||[]).length, ns=(a.care||[]).length;
    const badges=[ns?('<span class="ec-badge">🩺 '+ns+'</span>'):'', np?('<span class="ec-badge">📷 '+np+'</span>'):''].filter(Boolean).join('');
    html += '<button class="animalrow" data-an="'+a.id+'">'+
      '<span class="ar-ic">'+(SP_ICON[a.species]||'🐾')+'</span>'+
      '<span class="ar-mid"><span class="ar-name">'+esc(a.name)+'</span>'+
        (meta?'<span class="ar-meta">'+meta+'</span>':'')+
        (a.regime?'<span class="ar-reg">'+esc(a.regime)+'</span>':'')+
      '</span>'+
      (badges?'<span class="ar-badges">'+badges+'</span>':'')+
      '<span class="chev">›</span></button>';
  });
  html += '</div>';
  list.innerHTML=html;
  list.querySelectorAll('[data-an]').forEach(b=>b.onclick=()=>openAnimal(b.dataset.an));
}
/* --- FICHE ANIMAL : tableau de bord + notes + soins + photos --- */
let currentAnimal=null;
function openAnimal(id){ const a=STORE.animals.find(x=>x.id===id); if(!a) return; go(()=>{ currentAnimal=id; mode='stable'; renderAnimal(id); show('scAnimal',{accent:'#8A5A3C',nav:'stable'}); }, a.name); }
function renderAnimal(id){
  const a=STORE.animals.find(x=>x.id===id); if(!a){ navBack(); return; }
  $('anIc').textContent=SP_ICON[a.species]||'🐾';
  $('anName').textContent=a.name;
  const rows=[['Espèce',a.species],['Sexe',a.sex],['Race',a.breed],['Âge',a.age],['Foin / repas',a.hay!=null?(a.hay+' brouette'+(a.hay>1?'s':'')):'']].filter(r=>r[1]);
  $('anDash').innerHTML=rows.length?rows.map(r=>'<tr><td class="k">'+r[0]+'</td><td class="v">'+esc(''+r[1])+'</td></tr>').join(''):'<tr><td class="v" style="color:var(--mut)">Complète la fiche avec « Modifier ».</td></tr>';
  if(a.regime){ $('anRegime').style.display='block'; $('anRegime').innerHTML='<span class="rl">Régime alimentaire</span>'+esc(a.regime); } else $('anRegime').style.display='none';
  const nl=(a.noteLog||[]).slice().sort((x,y)=>(y.date||'').localeCompare(x.date||''));
  $('anNotes').innerHTML = nl.length ? nl.map(n=>'<div class="notelog"><div class="nd"><span>'+(n.date||'')+'</span><span class="nx" data-noterm="'+n.id+'">×</span></div>'+esc(n.text)+'</div>').join('') : '<div class="empty">Aucune note pour l\'instant.</div>';
  $('anNotes').querySelectorAll('[data-noterm]').forEach(b=>b.onclick=()=>{ a.noteLog=(a.noteLog||[]).filter(x=>x.id!==b.dataset.noterm); saveStore(); renderAnimal(id); });
  const soins=(a.care||[]).slice().sort((x,y)=>(y.date||'').localeCompare(x.date||''));
  $('anCare').innerHTML = soins.length ? soins.map(c=>'<div class="notelog"><div class="nd"><span>'+esc(c.type)+' · '+(c.date||'')+(c.next?' → '+c.next:'')+'</span><span class="nx" data-carerm="'+c.id+'">×</span></div>'+(c.note?esc(c.note):'')+'</div>').join('') : '<div class="empty">Aucun soin enregistré.</div>';
  $('anCare').querySelectorAll('[data-carerm]').forEach(b=>b.onclick=()=>{ a.care=(a.care||[]).filter(x=>x.id!==b.dataset.carerm); saveStore(); renderAnimal(id); });
  $('anPhotos').innerHTML=(a.photos||[]).map((p,i)=>'<div class="ph"><img src="'+p+'" alt=""><button class="rm" data-photo="'+i+'">×</button></div>').join('');
  $('anPhotos').querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{ a.photos.splice(+b.dataset.photo,1); saveStore(); renderAnimal(id); });
}
if($('anEdit')) $('anEdit').onclick=()=>{ if(currentAnimal) openAnimalModal(currentAnimal); };
if($('anDel')) $('anDel').onclick=()=>{ const b=$('anDel'); if(b.dataset.armed!=='1'){ b.dataset.armed='1'; b.textContent='Confirmer la suppression ?'; setTimeout(()=>{ if(b.dataset.armed==='1'){b.dataset.armed='0';b.textContent='Supprimer';} },4000); return; } STORE.animals=STORE.animals.filter(x=>x.id!==currentAnimal); saveStore(); navBack(); };
if($('anNoteAdd')) $('anNoteAdd').onclick=()=>openNoteModal(currentAnimal);
if($('anCareAdd')) $('anCareAdd').onclick=()=>openCareModal(currentAnimal);
if($('anPhotoAdd')) $('anPhotoAdd').onclick=()=>$('anPhotoInput').click();
if($('anPhotoInput')) $('anPhotoInput').onchange=e=>{ const f=e.target.files&&e.target.files[0]; if(f) addPhotoFile(f,currentAnimal); e.target.value=''; };
/* note modal */
let noteAnimalId=null;
function openNoteModal(id){ noteAnimalId=id; $('nText').value=''; $('noteModal').classList.add('open'); }
if($('nCancel')) $('nCancel').onclick=()=>$('noteModal').classList.remove('open');
if($('nSave')) $('nSave').onclick=()=>{ const t=$('nText').value.trim(); if(!t){ $('nText').focus&&$('nText').focus(); return; } const a=STORE.animals.find(x=>x.id===noteAnimalId); if(!a) return; a.noteLog=a.noteLog||[]; a.noteLog.push({ id:'n_'+Date.now(), date:new Date().toISOString().slice(0,10), text:t }); saveStore(); $('noteModal').classList.remove('open'); renderAnimal(noteAnimalId); };
/* photo : redimensionne (max 1000px, JPEG 0.72) puis stocke en base64 — 100% hors-ligne */
function addPhotoFile(file, animalId){
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      let w=img.width, h=img.height; const max=1000;
      if(w>max||h>max){ const r=Math.min(max/w,max/h); w=Math.round(w*r); h=Math.round(h*r); }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      let data; try{ data=cv.toDataURL('image/jpeg',0.72); }catch(err){ alert('Image illisible.'); return; }
      const a=STORE.animals.find(x=>x.id===animalId); if(!a) return;
      a.photos=a.photos||[]; a.photos.push(data);
      if(!saveStoreOk()){ a.photos.pop(); alert('Stockage plein — photo non enregistrée. Supprime des photos existantes.'); }
      renderAnimal(animalId);
    };
    img.onerror=()=>alert('Format d\'image non supporté (essaie une photo JPG/PNG).');
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

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
  $('animalModalTitle').textContent=editingAnimal?'Modifier la fiche':'Nouvel animal';
  $('aName').value=editingAnimal?editingAnimal.name:''; $('aSpecies').value=editingAnimal?editingAnimal.species||'Cheval':'Cheval';
  $('aSex').value=editingAnimal?editingAnimal.sex||'':'';
  $('aBreed').value=editingAnimal?editingAnimal.breed||'':''; $('aAge').value=editingAnimal?editingAnimal.age||'':'';
  $('aRegime').value=editingAnimal?editingAnimal.regime||'':''; $('aHay').value=editingAnimal?(editingAnimal.hay!=null?editingAnimal.hay:1):1; $('aNotes').value=editingAnimal?editingAnimal.notes||'':'';
  $('animalModal').classList.add('open');
}
$('aCancel').onclick=()=>$('animalModal').classList.remove('open');
$('aSave').onclick=()=>{
  const name=$('aName').value.trim(); if(!name){ $('aName').focus(); return; }
  const hayN=parseInt($('aHay').value,10);
  const data={ name, species:$('aSpecies').value, sex:$('aSex').value, breed:$('aBreed').value.trim(), age:$('aAge').value.trim(), regime:$('aRegime').value.trim(), hay:isNaN(hayN)?1:Math.max(0,hayN), notes:$('aNotes').value.trim() };
  if(editingAnimal){ Object.assign(editingAnimal,data); } else { STORE.animals.push({ id:'a_'+Date.now(), ...data, noteLog:[], photos:[], care:[] }); }
  saveStore(); $('animalModal').classList.remove('open');
  if($('scAnimal').classList.contains('active') && currentAnimal) renderAnimal(currentAnimal);
  else renderSection(currentSection||'animals');
};
/* --- modals : care --- */
function openCareModal(preId){
  if(!STORE.animals.length){ alert('Ajoute d\'abord un animal.'); return; }
  const sel=$('careAnimal'); sel.innerHTML=STORE.animals.map(a=>'<option value="'+a.id+'">'+(SP_ICON[a.species]||'')+' '+esc(a.name)+'</option>').join('');
  if(preId) sel.value=preId;
  $('cType').value='Vermifuge'; $('cDate').value=new Date().toISOString().slice(0,10); $('cNext').value=''; $('cNote').value='';
  $('careModal').classList.add('open');
}
$('cCancel').onclick=()=>$('careModal').classList.remove('open');
$('cSave').onclick=()=>{
  const a=STORE.animals.find(x=>x.id===$('careAnimal').value); if(!a) return;
  a.care=a.care||[]; a.care.push({ id:'c_'+Date.now(), type:$('cType').value, date:$('cDate').value, next:$('cNext').value, note:$('cNote').value.trim() });
  saveStore(); $('careModal').classList.remove('open');
  if($('scAnimal').classList.contains('active') && currentAnimal) renderAnimal(currentAnimal);
  else renderSection(currentSection||'care');
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
/* --- modals : projet --- */
function openProjectModal(){ $('pjTitle').value=''; $('pjDetail').value=''; $('projectModal').classList.add('open'); }
if($('pjCancel')) $('pjCancel').onclick=()=>$('projectModal').classList.remove('open');
if($('pjSave')) $('pjSave').onclick=()=>{ const t=$('pjTitle').value.trim(); if(!t){ $('pjTitle').focus&&$('pjTitle').focus(); return; } STORE.projects.push({ id:'pj_'+Date.now(), title:t, detail:$('pjDetail').value.trim(), done:false }); saveStore(); $('projectModal').classList.remove('open'); renderSection('projects'); };
const SECTION_ADD_FN={ecuries:()=>openAnimalModal(null),projects:openProjectModal,animals:()=>openAnimalModal(null),care:openCareModal,orders:openOrderModal,planning:openTaskModal,stock:openStockModal,contacts:openContactModal};
[ 'animalModal','noteModal','projectModal','careModal','orderModal','stockModal','contactModal','taskModal' ].forEach(id=>$(id).addEventListener('click',e=>{ if(e.target===$(id))$(id).classList.remove('open'); }));

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
  STORE.srs[id]=st; const p=curProfile(); if(p){ p.stats.reviews=(p.stats.reviews||0)+1; bumpSeen(); } saveStore();
}
function isDue(id){ const st=cardState(id); return !st || st.due<=Date.now(); }
function dueCards(skill){ return window.NEXUS_CARDS.filter(c=>(!skill||c.skill===skill)&&isDue(c.id)); }
/* Entrelacement (Bloc 4) : réordonne UNIQUEMENT l'affichage. La priorité FSRS prime —
   on regroupe par palier de retard (jours entiers, plus urgent d'abord), puis on alterne
   les domaines à l'intérieur d'un même palier. Une carte plus en retard n'est jamais
   repoussée derrière une moins en retard. Ne touche ni à la sélection ni aux échéances. */
function overdueTier(c){ const st=cardState(c.id); if(!st) return 0; return Math.max(0,Math.floor((Date.now()-st.due)/DAY)); }
function interleave(cards){
  const tiers=new Map();
  cards.forEach(c=>{ const t=overdueTier(c); (tiers.get(t)||tiers.set(t,[]).get(t)).push(c); });
  const out=[];
  [...tiers.keys()].sort((a,b)=>b-a).forEach(t=>{           // paliers : plus en retard d'abord
    const bySkill=new Map();
    tiers.get(t).forEach(c=>{ (bySkill.get(c.skill)||bySkill.set(c.skill,[]).get(c.skill)).push(c); });
    const qs=[...bySkill.values()]; let left=tiers.get(t).length, i=0;
    while(left>0){ const q=qs[i%qs.length]; if(q.length){ out.push(q.shift()); left--; } i++; } // round-robin domaines
  });
  return out;
}

function renderRevise(){
  $('reviseHome').style.display='block'; $('reviseSession').style.display='none';
  const due=dueCards(null);
  $('dueCount').textContent=due.length;
  $('startRevise').textContent=due.length?'Commencer la révision ('+due.length+')':'Tout est à jour ✓';
  $('startRevise').disabled=!due.length; $('startRevise').style.opacity=due.length?'1':'.5';
  ['modeEclair','modePioche','modeSafety'].forEach(id=>{ const b=$(id); if(b){ b.disabled=!due.length; b.style.opacity=due.length?'1':'.45'; } });
  if($('hardToggle')){ $('hardToggle').checked=!!STORE.hardMode; $('hardToggle').onchange=()=>{ STORE.hardMode=$('hardToggle').checked; const p=curProfile(); if(p) p.hardMode=STORE.hardMode; saveStore(); }; }
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
function startQueue(cards){
  if(!cards||!cards.length) return;
  const p=curProfile(); if(p){ p.stats.sessions=(p.stats.sessions||0)+1; bumpSeen(); saveStore(); }
  revQueue=cards; revIndex=0; revStats=0;
  $('reviseHome').style.display='none'; $('reviseSession').style.display='block';
  $('revDone').style.display='none'; $('flashcard').style.display='flex'; showCard();
}
function startSession(skill){ startQueue(interleave(dueCards(skill))); }
/* Modes de session récréatifs — opèrent TOUJOURS sur les cartes dues, donc le planning
   FSRS reste respecté ; seuls le tri et la taille de la file changent. */
const SAFETY_NODES=new Set();
Object.values(D.SKILLS).forEach(s=>s.nodes.forEach(n=>{ if(n.kind==='safety') SAFETY_NODES.add(n.id); }));
function daySeed(){ const s=new Date().toISOString().slice(0,10); let h=2166136261; for(let i=0;i<s.length;i++){ h=Math.imul(h^s.charCodeAt(i),16777619); } return h>>>0; }
function seededShuffle(arr, seed){ const a=arr.slice(); let s=seed>>>0;
  const rnd=()=>{ s=(s+0x6D2B79F5)>>>0; let t=Math.imul(s^(s>>>15),1|s); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
/* texte à trous : chaque ___ devient un champ de saisie (non corrigé), ou la réponse une fois révélé */
function renderCloze(stmt, answers, revealed){
  const parts=String(stmt).split('___');
  let html=esc(parts[0]);
  for(let i=1;i<parts.length;i++){
    if(revealed){ const a=(answers&&answers[i-1]!=null)?answers[i-1]:'…'; html+='<span class="cloze-fill">'+esc(a)+'</span>'; }
    else{ html+='<input class="cloze-in" type="text" autocomplete="off" autocapitalize="off" aria-label="à compléter">'; }
    html+=esc(parts[i]);
  }
  return html;
}
function showCard(){
  if(revIndex>=revQueue.length){ endSession(); return; }
  const c=revQueue[revIndex];
  $('revProgress').textContent='Fiche '+(revIndex+1)+' / '+revQueue.length;
  $('fcSkill').textContent=D.SKILLS[c.skill].name;
  $('fcQ').textContent=c.stmt;
  const node=D.SKILLS[c.skill].nodes.find(n=>n.id===c.node);
  const ctype=c.type||'tf';
  const figEl=$('fcFig');
  const hasFig=node&&node.fig&&D.FIG[node.fig];
  figEl.innerHTML=hasFig?D.FIG[node.fig]:'';
  /* sur rappel/cloze — et en Mode difficile sur tout — l'illustration ne s'affiche pas comme indice */
  const figLeak=(ctype==='recall'||ctype==='cloze')||STORE.hardMode;
  if(hasFig&&!figLeak) figEl.classList.add('has-fig'); else figEl.classList.remove('has-fig');
  /* image base64 (double codage) : masquée par défaut, révélée après réponse — jamais en Mode difficile en amont */
  const imgEl=$('fcImage');
  if(c.image) imgEl.src=c.image; else imgEl.removeAttribute('src');
  imgEl.style.display=(c.image&&c.imageUpfront===true&&!STORE.hardMode)?'block':'none';
  /* reset commun aux deux types */
  $('fcVerdict').className='fc-verdict'; $('fcVerdict').textContent='';
  $('fcA').classList.remove('show'); $('fcA').textContent='';
  $('fcAnswer').classList.remove('show'); $('fcAnswer').textContent='';
  $('fcElab').classList.remove('show'); $('fcElabTxt').textContent='';
  $('fcGrades').style.display='none';
  if($('fcConf')) $('fcConf').style.display='none';
  $('fcReveal').style.display='none';
  $('fcNext').style.display='none';
  revRevealed=false;
  if(ctype==='recall'||ctype==='cloze'){
    if(ctype==='cloze') $('fcQ').innerHTML=renderCloze(c.stmt, c.answers||[], false);
    $('fcChoice').style.display='none';
    $('fcReveal').style.display='block';
  } else {
    $('fcChoice').style.display='grid';
    $('fcChoice').querySelectorAll('.vf').forEach(b=>{ b.disabled=false; b.classList.remove('picked'); });
  }
}
/* élaboration : question de compréhension révélée après la réponse, sans note FSRS distincte */
function showElab(c){ if(c&&c.elaboration){ $('fcElabTxt').textContent=c.elaboration; $('fcElab').classList.add('show'); } }
/* double codage : révèle l'illustration du nœud et l'image base64 après la réponse (jamais d'indice avant) */
function revealVisuals(c){
  if(STORE.hardMode) return;   // Mode difficile : aucune aide visuelle, même après réponse
  const node=D.SKILLS[c.skill].nodes.find(n=>n.id===c.node);
  if(node&&node.fig&&D.FIG[node.fig]) $('fcFig').classList.add('has-fig');
  if(c.image){ $('fcImage').src=c.image; $('fcImage').style.display='block'; }
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
  $('fcA').textContent=c.explain||''; $('fcA').classList.add('show');
  showElab(c); revealVisuals(c);
  if(STORE.hardMode && $('fcConf')){
    /* Mode difficile : pas de note automatique — le pilote déclare sa confiance (anti-devinette). */
    pendingCorrect=correct;
    $('fcConf').style.display='grid';
  } else {
    reviewCard(c.id, correct?3:1);
    revStats++;
    $('fcNext').style.display='block';
  }
});
/* Mode difficile — confiance après un vrai/faux : une bonne réponse « au feeling » revient plus tôt. */
let pendingCorrect=false;
if($('fcConf')) $('fcConf').querySelectorAll('.conf').forEach(btn=>btn.onclick=()=>{
  const c=revQueue[revIndex]; const sure=btn.dataset.sure==='1';
  const g = !pendingCorrect ? 1 : (sure ? 3 : 2);   // faux→Again ; juste+sûr→Good ; juste+feeling→Hard
  reviewCard(c.id, g); revStats++;
  $('fcConf').style.display='none';
  $('fcNext').style.display='block';
});
/* rappel libre : révéler la réponse attendue, puis auto-évaluation mappée FSRS */
$('fcReveal').onclick=()=>{
  if(revRevealed) return;
  revRevealed=true;
  const c=revQueue[revIndex];
  $('fcReveal').style.display='none';
  if((c.type||'tf')==='cloze'){ $('fcQ').innerHTML=renderCloze(c.stmt, c.answers||[], true); }
  else{ $('fcAnswer').textContent=c.answer||''; $('fcAnswer').classList.add('show'); }
  if(c.explain){ $('fcA').textContent=c.explain; $('fcA').classList.add('show'); }
  showElab(c); revealVisuals(c);
  $('fcGrades').style.display='grid';
};
$('fcGrades').querySelectorAll('.grade').forEach(btn=>btn.onclick=()=>{
  if(!revRevealed) return;
  const c=revQueue[revIndex];
  reviewCard(c.id, parseInt(btn.dataset.g,10));
  revStats++;
  $('fcGrades').style.display='none';
  $('fcNext').style.display='block';
});
$('fcNext').onclick=()=>{ revIndex++; showCard(); };

/* « Le savais-tu ? » — anecdotes de fin de session (curiosité, ludique et calme). */
const FUNFACTS={
  escalade:["Le nœud de huit tient parce qu'il se serre sur lui-même : plus la corde tire, plus il verrouille.","En tête, la dureté d'une chute se mesure au « facteur de chute » — le rapport hauteur chutée sur longueur de corde qui l'absorbe, pas la hauteur seule.","La magnésie n'augmente pas l'adhérence : elle assèche la transpiration qui, elle, fait glisser."],
  meca:["Trop serré, un boulon s'allonge et casse : la clé dynamométrique existe pour doser cette tension, pas seulement la force.","Un moteur thermique ne transforme qu'environ 30 à 40 % de l'énergie du carburant en mouvement ; le reste part surtout en chaleur.","Les freins convertissent le mouvement en chaleur — d'où des disques brûlants après une longue descente."],
  survie:["La règle des 3 : environ 3 minutes sans air, 3 jours sans eau, 3 semaines sans nourriture. D'où l'ordre des priorités.","L'hypothermie tue plus souvent que la faim : rester au sec et coupé du vent prime sur trouver à manger.","Une eau claire n'est pas une eau potable : la plupart des micro-organismes dangereux sont invisibles."],
  apiculture:["Une abeille ouvrière ne produit qu'environ un douzième de cuillère à café de miel dans toute sa vie.","La danse en huit de l'abeille indique aux autres la direction ET la distance d'une source de nectar.","La reine peut pondre jusqu'à 2000 œufs par jour, soit davantage que son propre poids."],
  bois:["Le bois « travaille » surtout en largeur : une planche gonfle et rétrécit avec l'humidité, presque pas en longueur.","Les scies japonaises coupent en tirant, pas en poussant : la lame reste tendue et le trait est plus fin.","Le sens du fil décide de tout : raboter à contre-fil arrache les fibres au lieu de les trancher."],
  cheval:["Le cheval sommeille debout grâce à un blocage de ses articulations, mais doit se coucher pour le sommeil paradoxal.","Ses yeux latéraux lui offrent près de 350° de champ visuel, avec deux angles morts : pile devant le nez et juste derrière lui.","On aborde un cheval par l'épaule : ni de face, ni par l'arrière, pour rester dans son champ de vision."],
  guitare:["Ce n'est pas la force mais la tension qui fixe la note d'une corde : trop tendue, elle casse au lieu de monter indéfiniment.","Les frettes suivent un rapport constant : chaque case divise la longueur vibrante par le même facteur, environ 1,059.","Pincer plus fort ne monte pas dans les aigus : la corde sonne plus fort, pas plus haut."],
  soudure:["Souder, c'est fondre les pièces elles-mêmes ; braser, c'est les assembler avec un métal d'apport qui fond plus bas, sans les fondre.","L'arc de soudage dépasse 3000 °C et émet des UV : un « coup d'arc » brûle les yeux comme un coup de soleil.","L'aluminium se soude mal car sa couche d'oxyde fond vers 2000 °C alors que le métal dessous fond vers 660 °C."],
  drone:["En mode Acro, le drone n'a aucune notion d'horizontale : il obéit à des vitesses de rotation et ne se remet jamais à plat seul.","La vidéo analogique, moins belle que le numérique, reste prisée en course : sa latence quasi nulle laisse réagir à pleine vitesse.","Une LiPo tire sa puissance de sa chimie très dense — la même densité qui la rend dangereuse en cas de choc ou de surcharge."],
  camdrone:["Le stationnaire parfait d'un drone-caméra vient du GPS combiné à des caméras vers le sol qui « voient » qu'il ne bouge pas.","Règle du 180° : en vidéo, on cale la vitesse d'obturation au double de la cadence d'images pour un flou de mouvement naturel.","Les capteurs d'obstacles ne voient ni les câbles fins ni le verre : la plupart des drones perdus le sont par excès de confiance."]
};
function pickFact(domains){
  const pool=[]; (domains||[]).forEach(d=>{ (FUNFACTS[d]||[]).forEach(f=>pool.push(f)); });
  if(!pool.length) Object.values(FUNFACTS).forEach(a=>a.forEach(f=>pool.push(f)));
  return pool.length?pool[Math.floor(Math.random()*pool.length)]:'';
}
function endSession(){
  $('flashcard').style.display='none'; $('revDone').style.display='block';
  $('revDoneMsg').textContent=revStats+' fiche'+(revStats>1?'s':'')+' révisée'+(revStats>1?'s':'')+'. Elles reviendront au bon moment.';
  const domains=[...new Set(revQueue.map(c=>c.skill))];
  const fact=pickFact(domains);
  if(fact){ $('revFactTxt').textContent=fact; $('revFact').style.display='block'; }
  else $('revFact').style.display='none';
}
$('revBackBtn').onclick=()=>renderRevise();
$('startRevise').onclick=()=>{ if(dueCards(null).length) startSession(null); };
/* Modes récréatifs (sur cartes dues → planning FSRS intact) */
if($('modeEclair')) $('modeEclair').onclick=()=>{ startQueue(interleave(dueCards(null)).slice(0,7)); };
if($('modePioche')) $('modePioche').onclick=()=>{ startQueue(seededShuffle(dueCards(null), daySeed()).slice(0,12)); };
if($('modeSafety')) $('modeSafety').onclick=()=>{ startQueue(interleave(dueCards(null).filter(c=>SAFETY_NODES.has(c.node)))); };

goProfiles();
