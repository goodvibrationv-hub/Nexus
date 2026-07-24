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
      if(d.profiles){ STORE.profiles=d.profiles; STORE.currentProfile=d.currentProfile||'mael'; if(d.seedProfiles) STORE.seedProfiles=d.seedProfiles; }
      if(d.woodStock) STORE.woodStock=d.woodStock; if(d.woodPlan) STORE.woodPlan=d.woodPlan; if(d.woodLastSpecies) STORE.woodLastSpecies=d.woodLastSpecies;
      if(d.yoga) STORE.yoga=d.yoga; if(d.g270) STORE.g270=d.g270;
      if(d.amenagement) STORE.amenagement=d.amenagement;
      if(d.bienetre) STORE.bienetre=d.bienetre;
      if(d.noeuds) STORE.noeuds=d.noeuds;
      if(d.pieges) STORE.pieges=d.pieges;
      if(d.carto) STORE.carto=d.carto;
      if(d.pieges) STORE.pieges=d.pieges;
      if(d.domAteliers) STORE.domAteliers=d.domAteliers;
      if(d.domainOrder) STORE.domainOrder=d.domainOrder;
      if(d.deviceOwner) STORE.deviceOwner=d.deviceOwner;
      if(d.profilesReset1) STORE.profilesReset1=d.profilesReset1; }
  }catch(e){ /* mémoire seule */ }
  Object.keys(D.SKILLS).forEach(k=>{ if(!STORE.mastered[k]) STORE.mastered[k]=[]; });
}
let _saveWarned=false;
function saveStore(){ if(cryptoOn){ scheduleVaultSave(); return true; }
  try{ localStorage.setItem('nexus_stable', JSON.stringify(STORE)); _saveWarned=false; return true; }
  catch(e){ if(!_saveWarned){ _saveWarned=true; try{ alert('⚠️ Mémoire de l’appareil pleine : ta dernière saisie n’a pas pu être enregistrée (elle sera perdue au rechargement).\n\nLibère de la place : supprime des photos (fiches animaux ou grumes), puis réessaie.'); }catch(_){} } return false; } }
loadStore();
const mastered={}; Object.keys(D.SKILLS).forEach(k=>mastered[k]=new Set());
function persistMastered(){ Object.keys(mastered).forEach(k=>STORE.mastered[k]=[...mastered[k]]); saveStore(); }

/* ====== chiffrement des données (coffre AES-GCM, clé dérivée d'une phrase) ======
   Chiffrement AU REPOS, optionnel. Par défaut l'app reste en clair (comportement
   inchangé). Une fois activé, tout le STORE est chiffré dans localStorage sous une
   clé de données (DK) aléatoire, elle-même « enveloppée » par une phrase secrète
   (PBKDF2-SHA256 → AES-GCM) et par le code parent de secours. Web Crypto natif. */
const VAULT_KEY='nexus_vault';
let cryptoOn=false, cryptoLocked=false, sessionDK=null, _vaultSaveTimer=null;
function _subtle(){ try{ if(typeof crypto!=='undefined'&&crypto.subtle) return crypto; if(typeof window!=='undefined'&&window.crypto&&window.crypto.subtle) return window.crypto; }catch(e){} return null; }
function cryptoAvailable(){ return !!_subtle(); }
function _b64e(buf){ const b=new Uint8Array(buf); let s=''; for(let i=0;i<b.length;i++) s+=String.fromCharCode(b[i]); return btoa(s); }
function _b64d(str){ const s=atob(str); const b=new Uint8Array(s.length); for(let i=0;i<s.length;i++) b[i]=s.charCodeAt(i); return b; }
function _sb(s){ return new TextEncoder().encode(String(s)); }
function _bs(b){ return new TextDecoder().decode(b); }
async function _derive(pass, saltBytes){ const c=_subtle();
  const base=await c.subtle.importKey('raw', _sb(pass), 'PBKDF2', false, ['deriveKey']);
  return c.subtle.deriveKey({name:'PBKDF2', salt:saltBytes, iterations:150000, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']); }
async function _importDK(raw){ return _subtle().subtle.importKey('raw', raw, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']); }
async function _enc(key, bytes){ const c=_subtle(); const iv=c.getRandomValues(new Uint8Array(12)); const ct=await c.subtle.encrypt({name:'AES-GCM', iv}, key, bytes); return { iv:_b64e(iv), ct:_b64e(ct) }; }
async function _dec(key, ivB64, ctB64){ const pt=await _subtle().subtle.decrypt({name:'AES-GCM', iv:_b64d(ivB64)}, key, _b64d(ctB64)); return new Uint8Array(pt); }
async function _wrap(pass, dkRaw){ const c=_subtle(); const salt=c.getRandomValues(new Uint8Array(16)); const k=await _derive(pass, salt); const w=await _enc(k, dkRaw); return { salt:_b64e(salt), iv:w.iv, ct:w.ct }; }
async function _unwrap(wrap, pass){ try{ const k=await _derive(pass, _b64d(wrap.salt)); return await _dec(k, wrap.iv, wrap.ct); }catch(e){ return null; } }
async function enableEncryption(pass){ const c=_subtle(); if(!c) throw new Error('crypto indisponible');
  const dkRaw=c.getRandomValues(new Uint8Array(32));
  const wraps={ code:await _wrap(pass, dkRaw), rec:await _wrap(RECOVERY_CODE, dkRaw) };
  const dk=await _importDK(dkRaw);
  const vault={ v:1, wraps, data:await _enc(dk, _sb(JSON.stringify(STORE))) };
  // vérification round-trip AVANT d'effacer le clair
  const back=await _unwrap(vault.wraps.code, pass); if(!back) throw new Error('verify');
  const chk=JSON.parse(_bs(await _dec(await _importDK(back), vault.data.iv, vault.data.ct)));
  if(!chk||typeof chk!=='object') throw new Error('verify');
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  localStorage.removeItem('nexus_stable');        // seulement après écriture + vérification
  cryptoOn=true; cryptoLocked=false; sessionDK=dk; return true; }
async function unlockVault(pass, useRecovery){
  const raw=localStorage.getItem(VAULT_KEY); if(!raw) return false; const vault=JSON.parse(raw);
  let dkRaw = useRecovery ? await _unwrap(vault.wraps.rec, pass) : await _unwrap(vault.wraps.code, pass);
  if(!dkRaw && vault.wraps.rec) dkRaw=await _unwrap(vault.wraps.rec, pass);   // le code parent marche aussi
  if(!dkRaw) return false;
  let obj; try{ obj=JSON.parse(_bs(await _dec(await _importDK(dkRaw), vault.data.iv, vault.data.ct))); }catch(e){ return false; }
  hydrateStore(obj); sessionDK=await _importDK(dkRaw); cryptoOn=true; cryptoLocked=false; return true; }
async function disableEncryption(){ if(!cryptoOn) return true;
  localStorage.setItem('nexus_stable', JSON.stringify(STORE)); localStorage.removeItem(VAULT_KEY);
  cryptoOn=false; cryptoLocked=false; sessionDK=null; return true; }
function scheduleVaultSave(){ if(!cryptoOn||!sessionDK||_vaultSaveTimer) return;
  const run=async()=>{ _vaultSaveTimer=null; try{ const raw=localStorage.getItem(VAULT_KEY); if(!raw) return; const vault=JSON.parse(raw);
    vault.data=await _enc(sessionDK, _sb(JSON.stringify(STORE))); localStorage.setItem(VAULT_KEY, JSON.stringify(vault)); }catch(e){} };
  if(typeof setTimeout==='function') _vaultSaveTimer=setTimeout(run,350); else run(); }
function hydrateStore(obj){ Object.keys(STORE).forEach(k=>{ delete STORE[k]; }); Object.assign(STORE, obj); if(!STORE.mastered) STORE.mastered={}; }
if(localStorage.getItem(VAULT_KEY)){ cryptoOn=true; cryptoLocked=true; }   // coffre présent → attendre le déverrouillage

/* ====== profils (multi-utilisateur local + supervision) ======
   Chaque profil possède SA progression d'apprentissage (mastered + srs + hardMode)
   et des stats d'usage. Le Domaine du Freyche (chevaux, tâches, projets…) reste commun.
   STORE.mastered / STORE.srs / STORE.hardMode pointent toujours sur le profil actif :
   persistMastered() et reviewCard() écrivent donc directement dans le bon profil. */
const RECOVERY_CODE='Lavieaufreyche';   // code parent de secours (déblocage d'un profil dont le code est oublié)
/* Accès par lien personnel : chaque compte s'active via un jeton unique (#acces=…).
   Seules les empreintes des jetons sont embarquées ici, jamais les jetons en clair. */
const ACCESS_TOKENS=(typeof window!=='undefined'&&window.NEXUS_ACCESS)||{ mael:'pgvv7ji', alizee:'ppoljgc', lali:'p1sgjwz3' };
/* Accès sans code : le lien personnel suffit, l'appareil lié ouvre directement le compte. */
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
  /* Remise à zéro générale des profils (une seule fois par appareil) :
     progression, stats, codes et liaison d'appareil effacés ; les données
     communes (Domaine, Bois, Atelier G270, Yoga…) sont conservées. */
  if(!STORE.profilesReset1){
    Object.values(STORE.profiles).forEach(p=>{ p.mastered={}; p.srs={}; p.hardMode=false; p.stats=newStats(); delete p.pin; delete p.claimedAt; });
    delete STORE.deviceOwner; STORE.currentProfile='mael'; STORE.profilesReset1=true;
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
  STORE.currentProfile=id;
  const p=STORE.profiles[id];
  STORE.mastered=p.mastered; STORE.srs=p.srs; STORE.hardMode=!!p.hardMode;   // partage par référence
  Object.keys(D.SKILLS).forEach(k=>{ mastered[k].clear(); (p.mastered[k]||[]).forEach(x=>mastered[k].add(x)); });
  bumpSeen(); saveStore();
}
if(!cryptoLocked){ initProfiles(); activateProfile(STORE.currentProfile); }

function pct(k){return Math.round(mastered[k].size/D.SKILLS[k].nodes.length*100);}
function totalPct(){let m=0,t=0;for(const k in D.SKILLS){m+=mastered[k].size;t+=D.SKILLS[k].nodes.length;}return Math.round(m/t*100);}

/* ====== screen mgmt ====== */
let current=null,currentNode=null,currentSkillK=null,mode='landing';
function show(screen,{accent='#3F5E4E',nav='',noScroll=false}={}){
  document.documentElement.style.setProperty('--forest',accent);
  ['scProfiles','scActivate','scLock','scVault','scLanding','scHome','scDetail','scCourse','scTest','scProgress','scStable','scGestion','scStableSection','scAnimal','scRevise','scWood','scWoodFlow','scAtelier','scAtelierFlow','scBackup','scEsprit','scYoga','scYogaFlow'].forEach(s=>$(s).classList.remove('active'));
  $(screen).classList.add('active');
  buildNav(nav);
  const bn=$('bottomnav'); if(bn) bn.style.display=(screen==='scProfiles'||screen==='scActivate'||screen==='scLock'||screen==='scVault'||screen==='scBackup')?'none':'';
  if(typeof stopYoga==='function' && screen!=='scYogaFlow') stopYoga();
  if(!noScroll) window.scrollTo({top:0,behavior:'smooth'});
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
  const tb=$('thumbBack');
  if(tb){ if(navHist.length){ tb.style.display='flex'; tb.onclick=doBack; } else { tb.style.display='none'; tb.onclick=null; } }
}
if(BROWSER_NAV) window.addEventListener('popstate', ()=>{ navBack(); });
/* geste : balayer vers la droite = retour (pouce). On démarre au-delà du bord
   gauche pour ne pas gêner le geste « précédent » du navigateur, et on exige un
   mouvement franchement horizontal pour ne pas perturber le défilement. */
(function(){
  if(typeof window==='undefined'||!window.addEventListener) return;
  let sx=0, sy=0, st=0, ok=false;
  window.addEventListener('touchstart', e=>{ if(!e.touches||e.touches.length!==1){ ok=false; return; } const t=e.touches[0];
    // ne pas armer le retour si le geste démarre sur une zone pannable (carte plein écran)
    if(e.target&&e.target.closest&&e.target.closest('.no-swipe')){ ok=false; return; }
    sx=t.clientX; sy=t.clientY; st=Date.now(); ok=sx>30; }, {passive:true});
  window.addEventListener('touchend', e=>{ if(!ok||!st) return; ok=false; const t=(e.changedTouches&&e.changedTouches[0]); if(!t) return;
    const dx=t.clientX-sx, dy=t.clientY-sy, dt=Date.now()-st;
    if(dx>78 && Math.abs(dy)<48 && Math.abs(dx)>Math.abs(dy)*1.7 && dt<600 && navHist.length){ doBack(); }
  }, {passive:true});
})();

/* ====== bottom nav (contextual) ====== */
function navBtn(active, key, icon, label){
  return '<button class="navbtn'+(active===key?' on':'')+'" data-go="'+key+'"><span class="ni">'+icon+'</span><span class="nl">'+label+'</span></button>';
}
function buildNav(active){
  const nav=$('bottomnav');
  if(mode==='esprit'){
    document.body.classList.add('stable-mode');
    nav.innerHTML=
      navBtn(active,'landing',NAV_IC.home,'Accueil')+
      navBtn(active,'esprit',NAV_IC.revise,'Esprit');
  } else if(mode==='wood'){
    document.body.classList.add('stable-mode');
    nav.innerHTML=
      navBtn(active,'landing',NAV_IC.home,'Accueil')+
      navBtn(active,'wood',NAV_IC.stable,'Projet Bois');
  } else if(mode==='stable'){
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
  else if(g==='wood') go(rWood,'projet bois');
  else if(g==='esprit') go(rEsprit,'esprit');
}

/* ====== landing ====== */
const PROFILE_AV={ mael:'🧭', alizee:'🌸', lali:'🦋' };
function profileAvatar(id){ return PROFILE_AV[id]||'👤'; }
function goLanding(){ mode='landing';
  const p=curProfile();
  if($('chipName')) $('chipName').textContent=p?p.name:'Profil';
  if($('chipAv')) $('chipAv').textContent=profileAvatar(STORE.currentProfile);
  show('scLanding',{accent:'#3F5E4E',nav:'landing'});
}
function goHome(){ goRoot(goLanding,'accueil'); }
$('doorLearn').onclick=()=>go(rDomains,'domaines');
$('doorStable').onclick=()=>navGo('stable');
if($('doorWood')) $('doorWood').onclick=()=>navGo('wood');
if($('doorEsprit')) $('doorEsprit').onclick=()=>navGo('esprit');
if($('doorCarto')) $('doorCarto').onclick=()=>openCartoMap();
/* compte personnel : pas de changement d'utilisateur depuis l'app */

/* ====== attribution du propriétaire de l'appareil (code parent uniquement) ====== */
function goProfiles(){ mode='landing'; goRoot(renderProfiles,'profils'); }
function renderProfiles(){
  const g=$('profileList'); if(!g) return; g.innerHTML='';
  Object.entries(STORE.profiles).forEach(([id,p])=>{
    const b=document.createElement('button'); b.className='pcard'+(p.role==='admin'?' admin':'');
    const gp=globalPct(p);
    b.innerHTML='<span class="pv">'+profileAvatar(id)+'</span>'+
      '<span class="pmid"><span class="pnm">'+esc(p.name)+(p.pin?'<span class="plock">🔒</span>':'')+'</span>'+
      '<span class="psub">'+gp+'% de progression'+(p.stats&&p.stats.lastSeen?' · vu '+relDate(p.stats.lastSeen):'')+'</span></span>'+
      '<span class="parw">→</span>';
    b.onclick=()=>{ bindDevice(id); openProfile(id); };
    g.appendChild(b);
  });
  show('scProfiles',{accent:'#3F5E4E',nav:''});
}

/* ====== accès par lien personnel : un appareil = un compte ====== */
function deviceOwner(){ const id=STORE.deviceOwner; return (id&&STORE.profiles&&STORE.profiles[id])?id:null; }
function bindDevice(id){ if(!STORE.profiles[id]) return false;
  STORE.deviceOwner=id;
  if(!STORE.profiles[id].claimedAt) STORE.profiles[id].claimedAt=Date.now();
  saveStore(); return true; }
function accessTokenFromUrl(){ try{ const m=String(window.location.hash||'').match(/acces=([\w-]+)/i); return m?m[1]:null; }catch(e){ return null; } }
function clearAccessHash(){ try{ history.replaceState(null,'',window.location.pathname+window.location.search); }catch(e){} }
function claimFromToken(tok){ if(!tok) return null;
  const h=hashPin(String(tok).trim());
  const id=Object.keys(ACCESS_TOKENS).find(k=>ACCESS_TOKENS[k]===h);
  if(!id||!STORE.profiles[id]) return null;
  const cur=deviceOwner();
  if(cur&&cur!==id) return 'denied';               // appareil déjà lié à un autre compte
  bindDevice(id); clearAccessHash(); return id; }
function renderActivate(msg){ mode='landing';
  if($('actMsg')) $('actMsg').textContent=msg||'';
  const b=$('actParent'); if(b) b.onclick=()=>{
    const code=(typeof prompt==='function')?prompt('Code parent'):null;
    if(code==null) return;
    if(String(code).trim()===RECOVERY_CODE) goProfiles();
    else if($('actMsg')) $('actMsg').textContent='Code parent incorrect.';
  };
  show('scActivate',{accent:'#3F5E4E',nav:''});
}
function bootEntry(){
  const tok=accessTokenFromUrl();
  if(tok){ const r=claimFromToken(tok);
    if(r==='denied'){ const own=deviceOwner();
      renderActivate('Cet appareil est déjà lié au compte de '+STORE.profiles[own].name+'.'); return; }
    if(r){ enterProfile(r); return; }
    renderActivate('Lien d’accès invalide.'); return;
  }
  const own=deviceOwner();
  if(own) openProfile(own); else renderActivate();
}
function globalPct(p){ let m=0,t=0; for(const k in D.SKILLS){ m+=(p.mastered[k]||[]).length; t+=D.SKILLS[k].nodes.length; } return t?Math.round(m/t*100):0; }
function relDate(ts){ if(!ts) return 'jamais'; const d=Math.floor((Date.now()-ts)/86400000);
  if(d<=0) return "aujourd'hui"; if(d===1) return 'hier'; if(d<7) return 'il y a '+d+' j'; if(d<30) return 'il y a '+Math.floor(d/7)+' sem'; return 'il y a '+Math.floor(d/30)+' mois'; }

/* ====== verrou par code (PIN 4 chiffres, par profil) ======
   Sécurité locale : le code protège l'ACCÈS à un profil sur l'appareil. Il est
   stocké empreinté (non en clair), mais comme tout est hors-ligne sur le
   téléphone, ce n'est pas un chiffrement des données : c'est un verrou d'entrée.
   Le code parent de secours (RECOVERY_CODE) débloque un profil en cas d'oubli. */
function hashPin(s){ s=String(s); let h=5381; for(let i=0;i<s.length;i++) h=(((h<<5)+h)^s.charCodeAt(i))>>>0; return 'p'+h.toString(36); }
let lock=null;   // {mode:'unlock'|'set'|'confirm', profileId, buf, first, cb}
function renderKeypad(){ const kp=$('keypad'); if(!kp) return;
  const keys=['1','2','3','4','5','6','7','8','9','','0','⌫'];
  kp.innerHTML=keys.map(k=>k===''?'<span class="kp-empty"></span>':'<button class="kp-btn" data-k="'+k+'">'+k+'</button>').join('');
  kp.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>pinPress(b.dataset.k));
}
function lockDots(){ const d=$('lockDots'); if(!d) return; const n=(lock&&lock.buf.length)||0; let h=''; for(let i=0;i<4;i++) h+='<span class="dot'+(i<n?' on':'')+'"></span>'; d.innerHTML=h; }
function lockShake(msg){ if($('lockMsg')) $('lockMsg').textContent=msg||''; if(lock) lock.buf=''; lockDots();
  const w=$('lockWrap'); if(w&&w.classList){ w.classList.remove('shake'); void (w.offsetWidth||0); w.classList.add('shake'); } }
function pinPress(k){ if(!lock) return;
  if(k==='⌫'){ lock.buf=lock.buf.slice(0,-1); if($('lockMsg'))$('lockMsg').textContent=''; lockDots(); return; }
  if(lock.buf.length>=4) return;
  lock.buf+=k; lockDots();
  if(lock.buf.length===4){ const done=()=>pinComplete(); (typeof setTimeout==='function')?setTimeout(done,110):done(); }
}
function pinComplete(){ if(!lock) return; const code=lock.buf; lock.buf='';
  if(lock.mode==='unlock'){ const p=STORE.profiles[lock.profileId];
    if(p&&p.pin===hashPin(code)) enterProfile(lock.profileId); else lockShake('Code incorrect'); }
  else if(lock.mode==='set'){ lock.first=code; lock.mode='confirm';
    if($('lockTitle'))$('lockTitle').textContent='Confirme le code'; if($('lockSub'))$('lockSub').textContent='Retape les 4 chiffres'; if($('lockMsg'))$('lockMsg').textContent=''; lockDots(); }
  else if(lock.mode==='confirm'){
    if(code===lock.first){ const p=STORE.profiles[lock.profileId]; p.pin=hashPin(code); saveStore(); const cb=lock.cb; lock=null; (cb||goLanding)(); }
    else { lock.mode='set'; lock.first=''; if($('lockTitle'))$('lockTitle').textContent='Choisis un code'; lockShake('Les deux codes diffèrent'); } }
}
function openProfile(id){ if(STORE.profiles[id]) enterProfile(id); }
function enterProfile(id){ lock=null; activateProfile(id); goHome(); }
function startUnlock(id){ const p=STORE.profiles[id]; if(!p) return; lock={mode:'unlock',profileId:id,buf:'',first:''};
  if($('lockAv'))$('lockAv').textContent=profileAvatar(id); if($('lockTitle'))$('lockTitle').textContent=p.name;
  if($('lockSub'))$('lockSub').textContent='Entre ton code à 4 chiffres'; if($('lockMsg'))$('lockMsg').textContent='';
  const f=$('lockForgot'); if(f){ f.style.display='block'; f.textContent='Code oublié ?'; f.onclick=recoverPin; }
  const c=$('lockCancel'); if(c){ if(deviceOwner()){ c.style.display='none'; c.onclick=null; } else { c.style.display='block'; c.onclick=()=>goProfiles(); } }
  renderKeypad(); lockDots(); show('scLock',{accent:'#3F5E4E',nav:''});
}
function startSetPin(id, cb){ const p=STORE.profiles[id]; if(!p) return; lock={mode:'set',profileId:id,buf:'',first:'',cb:cb};
  if($('lockAv'))$('lockAv').textContent=profileAvatar(id); if($('lockTitle'))$('lockTitle').textContent='Choisis un code';
  if($('lockSub'))$('lockSub').textContent='4 chiffres pour protéger « '+p.name+' »'; if($('lockMsg'))$('lockMsg').textContent='';
  const f=$('lockForgot');
  if(f){ if(p.pin){ f.style.display='block'; f.textContent='Retirer le code'; f.onclick=()=>{ delete p.pin; saveStore(); const g=cb||goLanding; lock=null; g(); }; }
         else { f.style.display='none'; f.onclick=null; } }
  const c=$('lockCancel'); if(c) c.onclick=()=>{ const g=cb||goLanding; lock=null; g(); };
  renderKeypad(); lockDots(); show('scLock',{accent:'#3F5E4E',nav:''});
}
function recoverPin(){ if(!lock) return; const id=lock.profileId;
  const code=(typeof prompt==='function')?prompt('Code parent de secours'):null;
  if(code==null) return;
  if(String(code).trim()===RECOVERY_CODE){ const p=STORE.profiles[id]; if(p) delete p.pin; saveStore(); enterProfile(id); }
  else lockShake('Code parent incorrect');
}

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
function renameProfile(id,name){ const p=STORE.profiles[id]; if(p&&name&&String(name).trim()){ p.name=String(name).trim(); saveStore(); return true; } return false; }
function resetProfile(id){ const p=STORE.profiles[id]; if(!p) return;
  Object.keys(D.SKILLS).forEach(k=>{ p.mastered[k]=[]; }); p.srs={}; p.stats=newStats();
  if(id===STORE.currentProfile){ Object.keys(mastered).forEach(k=>mastered[k].clear()); STORE.srs=p.srs; STORE.mastered=p.mastered; }
  saveStore();
}

/* ====== learning ====== */
function homeKeys(){ const keys=Object.keys(D.SKILLS); if(window.AMENAGEMENT) keys.push('amenagement'); if(window.BIENETRE) keys.push('bienetre'); if(window.NOEUDS) keys.push('noeud'); if(window.PIEGES) keys.push('piege'); if(window.CARTO_SEED) keys.push('carto'); return keys; }
function homeOrder(){
  const keys=homeKeys();
  const saved=(STORE.domainOrder||[]).filter(k=>keys.includes(k));
  keys.forEach(k=>{ if(!saved.includes(k)) saved.push(k); }); // nouveaux domaines à la fin
  return saved;
}
function tileInfo(k){
  if(k==='amenagement'){ const A=window.AMENAGEMENT; const pr=amenProgress(); const p=pr.total?Math.round(pr.done*100/pr.total):0;
    return {color:A.color, icon:A.icon, name:A.name, pc:p, open:()=>openAmenagement()}; }
  if(k==='bienetre'){ const B=window.BIENETRE; const pr=bienetreProgress(); const p=pr.total?Math.round(pr.done*100/pr.total):0;
    return {color:B.color, icon:B.icon, name:B.name, pc:p, open:()=>openBienetre()}; }
  if(k==='noeud'){ const N=window.NOEUDS; const pr=noeudProgress(); const p=pr.total?Math.round(pr.done*100/pr.total):0;
    return {color:N.color, icon:N.icon, name:N.name, pc:p, open:()=>openNoeuds()}; }
  if(k==='piege'){ const Pg=window.PIEGES; const pr=piegeProgress(); const p=pr.total?Math.round(pr.done*100/pr.total):0;
    return {color:Pg.color, icon:Pg.icon, name:Pg.name, pc:p, open:()=>openPieges()}; }
  if(k==='carto'){ const pr=cartoProgress(); const p=pr.total?Math.round(pr.done*100/pr.total):0;
    return {color:'#3E7C4E', icon:'🗺️', name:'Cartographie', pc:p, open:()=>openCarto()}; }
  const s=D.SKILLS[k]; return {color:s.color, icon:s.icon, name:s.name, pc:pct(k), open:()=>openDomain(k)};
}
function makeTile(k){
  const t=tileInfo(k);
  const b=document.createElement('button'); b.className='dtile'; b.style.setProperty('--c',t.color); b.dataset.key=k;
  b.title='Appuie longuement pour déplacer';
  b.innerHTML='<div class="top"><span class="ic">'+t.icon+'</span><h3>'+t.name+'</h3></div><div class="barwrap"><span class="bar"><i style="width:'+t.pc+'%"></i></span><span class="pc">'+t.pc+'%</span></div>';
  b.onclick=()=>{ if(Date.now()<_dragSuppressClick) return; t.open(); };
  attachTileDrag(b);
  return b;
}
function renderHome(){
  const g=$('domainList'); g.innerHTML='';
  if($('domainCount')) $('domainCount').textContent=homeKeys().length+' domaines';
  homeOrder().forEach(k=>g.appendChild(makeTile(k)));
}
/* ---- réorganisation par appui long + glisser (tactile & souris) ---- */
let _drag=null, _dragSuppressClick=0;
function attachTileDrag(el){
  el.addEventListener('touchstart', e=>dragDown(el, e.touches[0]), {passive:true});
  el.addEventListener('mousedown', e=>{ if(e.button===0) dragDown(el, e); });
}
function dragPoint(e){ return e.touches&&e.touches[0] ? e.touches[0] : e; }
function dragDown(el, pt){
  dragCleanup();
  _drag={ el, x0:pt.clientX, y0:pt.clientY, active:false, timer:0 };
  _drag.timer=setTimeout(dragStart, 380);
  document.addEventListener('touchmove', dragMove, {passive:false});
  document.addEventListener('touchend', dragUp, {passive:true});
  document.addEventListener('touchcancel', dragUp, {passive:true});
  document.addEventListener('mousemove', dragMove, true);
  document.addEventListener('mouseup', dragUp, true);
}
function dragStart(){
  if(!_drag) return;
  _drag.active=true; _drag.el.classList.add('dragging'); _drag.el.style.pointerEvents='none';
  document.body.classList.add('reordering');
  try{ if(navigator.vibrate) navigator.vibrate(15); }catch(e){}
}
function dragMove(e){
  if(!_drag) return;
  const p=dragPoint(e), dx=p.clientX-_drag.x0, dy=p.clientY-_drag.y0;
  if(!_drag.active){
    if(Math.abs(dx)>10||Math.abs(dy)>10){ clearTimeout(_drag.timer); dragCleanup(); } // c'est un défilement / tap
    return;
  }
  if(e.cancelable) e.preventDefault();               // on bloque le scroll pendant le glisser
  const under=document.elementFromPoint(p.clientX, p.clientY);
  const tgt=under&&under.closest ? under.closest('.dtile') : null;
  if(tgt&&tgt!==_drag.el&&tgt.dataset.key){
    const g=$('domainList'); const r=tgt.getBoundingClientRect();
    const before = p.clientY < r.top + r.height/2;
    g.insertBefore(_drag.el, before ? tgt : tgt.nextSibling);
  }
}
function persistDomainOrderFromDOM(){
  const g=$('domainList'); if(!g) return;
  STORE.domainOrder=[...g.children].map(c=>c.dataset.key).filter(Boolean);
  saveStore();
}
function dragUp(){
  if(_drag&&_drag.active){
    persistDomainOrderFromDOM();
    _dragSuppressClick=Date.now()+350;               // évite l'ouverture juste après le lâcher
  }
  dragCleanup();
}
function dragCleanup(){
  if(_drag){ if(_drag.timer) clearTimeout(_drag.timer);
    if(_drag.el){ _drag.el.classList.remove('dragging'); _drag.el.style.pointerEvents=''; } }
  document.body.classList.remove('reordering');
  document.removeEventListener('touchmove', dragMove, {passive:false});
  document.removeEventListener('touchend', dragUp);
  document.removeEventListener('touchcancel', dragUp);
  document.removeEventListener('mousemove', dragMove, true);
  document.removeEventListener('mouseup', dragUp, true);
  _drag=null;
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
  if(k==='g270'){
    const at=document.createElement('button'); at.className='atelier-banner'; at.type='button';
    at.innerHTML='<span class="ab-ic">🧰</span><span class="ab-mid"><span class="ab-t">Atelier — aide pratique</span><span class="ab-s">Dépannage · entretien · fiche du camion · repérage photos</span></span><span class="ab-go">Ouvrir ›</span>';
    at.onclick=()=>openAtelier();
    tree.appendChild(at);
  }
  if(k!=='g270'&&window.DOM_ATELIERS&&window.DOM_ATELIERS[k]){
    const da=window.DOM_ATELIERS[k];
    const ab=document.createElement('button'); ab.className='atelier-banner'; ab.type='button';
    ab.innerHTML='<span class="ab-ic">🧰</span><span class="ab-mid"><span class="ab-t">Atelier — aide pratique</span><span class="ab-s">'+da.short+'</span></span><span class="ab-go">Ouvrir ›</span>';
    ab.onclick=()=>openDomAtelier(k);
    tree.appendChild(ab);
  }
  if(k==='occitan'&&window.OCCITAN_PHRASES){
    const pb=document.createElement('button'); pb.className='atelier-banner guide'; pb.type='button';
    const nP=window.OCCITAN_PHRASES.reduce((a,g)=>a+g.items.length,0);
    pb.innerHTML='<span class="ab-ic">📖</span><span class="ab-mid"><span class="ab-t">Dictionnaire de phrases</span><span class="ab-s">'+nP+' phrases occitan → français, par thème, avec recherche</span></span><span class="ab-go">Ouvrir ›</span>';
    pb.onclick=()=>openOccitanPhrases();
    tree.appendChild(pb);
  }
  if(k==='elagage'&&window.ELAG_GUIDE){
    const gb=document.createElement('button'); gb.className='atelier-banner guide'; gb.type='button';
    const nA=window.ELAG_GUIDE.reduce((a,g)=>a+g.arbres.length,0);
    gb.innerHTML='<span class="ab-ic">🌳</span><span class="ab-mid"><span class="ab-t">Guide d’élagage par arbre</span><span class="ab-s">'+nA+' arbres · périodes, méthodes et pièges par essence</span></span><span class="ab-go">Ouvrir ›</span>';
    gb.onclick=()=>openElagGuide();
    tree.appendChild(gb);
    if(window.ELAG_CALENDAR){
      const cb=document.createElement('button'); cb.className='atelier-banner guide'; cb.type='button';
      cb.innerHTML='<span class="ab-ic">📅</span><span class="ab-mid"><span class="ab-t">Calendrier de taille du verger</span><span class="ab-s">Mois par mois : quoi tailler, quoi faire, quoi éviter</span></span><span class="ab-go">Ouvrir ›</span>';
      cb.onclick=()=>openElagCalendar();
      tree.appendChild(cb);
    }
    if(window.ELAG_VARIETES){
      const vb=document.createElement('button'); vb.className='atelier-banner guide'; vb.type='button';
      vb.innerHTML='<span class="ab-ic">🍎</span><span class="ab-mid"><span class="ab-t">Variétés locales d’Ariège</span><span class="ab-s">Fruitiers du pays &amp; conservatoires où les trouver</span></span><span class="ab-go">Ouvrir ›</span>';
      vb.onclick=()=>openElagVarietes();
      tree.appendChild(vb);
    }
  }
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
function saveStoreOk(){ if(cryptoOn){ scheduleVaultSave(); return true; } try{ localStorage.setItem('nexus_stable', JSON.stringify(STORE)); return true; }catch(e){ return false; } }

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

/* ====== sauvegarde / restauration + jauge de stockage ====== */
const APP_VERSION=(typeof window!=='undefined'&&window.NEXUS_VERSION)||'?';
function storageBytes(){ const key=cryptoOn?VAULT_KEY:'nexus_stable'; try{ return new Blob([localStorage.getItem(key)||'']).size; }catch(e){ try{ return (localStorage.getItem(key)||'').length; }catch(_){ return 0; } } }
function backupData(){ let store={}; try{ store=cryptoOn?JSON.parse(JSON.stringify(STORE)):JSON.parse(localStorage.getItem('nexus_stable')||'{}'); }catch(e){} return { app:'nexus-learn', version:APP_VERSION, exportedAt:new Date().toISOString(), store }; }
function applyBackup(obj){ const store=(obj&&(obj.store||obj.data))||obj; if(!store||typeof store!=='object'||Array.isArray(store)) return false; try{ localStorage.setItem('nexus_stable', JSON.stringify(store)); return true; }catch(e){ return false; } }
function exportBackup(){ try{ const blob=new Blob([JSON.stringify(backupData(),null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='nexus-sauvegarde-'+new Date().toISOString().slice(0,10)+'.json'; document.body.appendChild(a); a.click(); setTimeout(()=>{ if(a.parentNode)a.parentNode.removeChild(a); URL.revokeObjectURL(url); },200); }catch(e){ alert('Export impossible sur ce navigateur.'); } }
function importBackup(file, cb){ const r=new FileReader(); r.onload=e=>{ let ok=false; try{ ok=applyBackup(JSON.parse(e.target.result)); }catch(err){ ok=false; } cb(ok); }; r.onerror=()=>cb(false); r.readAsText(file); }
function renderBackup(){ mode='landing';
  const bytes=storageBytes(); const ko=Math.round(bytes/1024); const budget=5*1024*1024; const pct=Math.min(100,Math.round(bytes/budget*100));
  const warn=pct>80;
  $('storageBox').innerHTML='<div class="sg-top"><span>Espace utilisé</span><b>≈ '+ko+' Ko</b></div><div class="sg-bar"><i style="width:'+Math.max(2,pct)+'%'+(warn?';background:#B4453A':'')+'"></i></div><div class="sg-sub">'+(warn?'Bientôt plein — exporte puis supprime des photos.':'sur ~5 Mo disponibles sur cet appareil')+'</div>';
  renderCryptoBox();
  show('scBackup',{accent:'#3F5E4E',nav:''});
}
function renderCryptoBox(){ const box=$('cryptoBox'); if(!box) return;
  if(!cryptoAvailable()){ box.innerHTML='<div class="crypto-row"><span>🔐 Chiffrement</span><span class="crypto-off">non disponible sur ce navigateur</span></div>'; return; }
  if(cryptoOn){
    box.innerHTML='<div class="crypto-row"><span>🔐 Données chiffrées</span><span class="crypto-badge">activé</span></div><button class="miniBtn" id="btnCryptoOff">Désactiver le chiffrement</button>';
    const b=$('btnCryptoOff'); if(b) b.onclick=async()=>{ if(!confirm('Désactiver le chiffrement ? Les données seront de nouveau stockées en clair sur cet appareil.')) return; await disableEncryption(); alert('Chiffrement désactivé.'); renderBackup(); };
  } else {
    box.innerHTML='<button class="save" id="btnCryptoOn" style="width:100%">🔐 Chiffrer mes données</button><div class="backup-note">Choisis une phrase secrète : les données seront illisibles sans elle. <b>Exporte d’abord une sauvegarde</b> par sécurité — une phrase perdue = données irrécupérables.</div>';
    const b=$('btnCryptoOn'); if(b) b.onclick=()=>startEnableEncryption();
  }
}
if($('doorBackup')) $('doorBackup').onclick=()=>go(renderBackup,'sauvegarde');
if($('btnExport')) $('btnExport').onclick=exportBackup;
if($('btnImport')) $('btnImport').onclick=()=>$('importInput').click();
if($('importInput')) $('importInput').onchange=e=>{ const f=e.target.files&&e.target.files[0]; if(f) importBackup(f, ok=>{ if(ok){ alert('Sauvegarde restaurée. L’app va se recharger.'); try{ location.reload(); }catch(_){} } else alert('Fichier de sauvegarde invalide.'); }); e.target.value=''; };

/* ---- écran coffre (phrase secrète) : déverrouillage au démarrage & activation ---- */
let vaultMode='unlock';
function _vq(id){ return $(id); }
function startVaultUnlock(){ vaultMode='unlock';
  if($('vaultTitle')) $('vaultTitle').textContent='Données chiffrées';
  if($('vaultSub')) $('vaultSub').textContent='Entre ta phrase secrète pour ouvrir l’application.';
  if($('vaultPass')){ $('vaultPass').value=''; $('vaultPass').placeholder='Phrase secrète'; }
  if($('vaultPass2')) $('vaultPass2').style.display='none';
  if($('vaultMsg')) $('vaultMsg').textContent='';
  if($('vaultGo')) $('vaultGo').textContent='Déverrouiller';
  const a=$('vaultAlt'); if(a){ a.style.display='block'; a.textContent='Utiliser le code parent'; a.onclick=()=>{ vaultMode='recover'; if($('vaultSub'))$('vaultSub').textContent='Entre le code parent de secours.'; if($('vaultPass'))$('vaultPass').placeholder='Code parent'; a.style.display='none'; }; }
  show('scVault',{accent:'#3F5E4E',nav:''});
}
function startEnableEncryption(){ vaultMode='enable';
  if($('vaultTitle')) $('vaultTitle').textContent='Chiffrer mes données';
  if($('vaultSub')) $('vaultSub').textContent='Choisis une phrase secrète (6 caractères minimum). Note-la : sans elle, tes données seront illisibles.';
  if($('vaultPass')){ $('vaultPass').value=''; $('vaultPass').placeholder='Phrase secrète'; }
  if($('vaultPass2')){ $('vaultPass2').value=''; $('vaultPass2').placeholder='Confirme la phrase'; $('vaultPass2').style.display='block'; }
  if($('vaultMsg')) $('vaultMsg').textContent='';
  if($('vaultGo')) $('vaultGo').textContent='Activer le chiffrement';
  const a=$('vaultAlt'); if(a){ a.style.display='block'; a.textContent='Annuler'; a.onclick=()=>go(renderBackup,'sauvegarde'); }
  go(()=>show('scVault',{accent:'#3F5E4E',nav:''}), 'chiffrement');
}
function vaultErr(m){ if($('vaultMsg')) $('vaultMsg').textContent=m||''; }
async function vaultSubmit(){
  const pass=($('vaultPass')&&$('vaultPass').value)||'';
  if(vaultMode==='enable'){
    const p2=($('vaultPass2')&&$('vaultPass2').value)||'';
    if(pass.length<6){ vaultErr('6 caractères minimum.'); return; }
    if(pass!==p2){ vaultErr('Les deux phrases diffèrent.'); return; }
    if($('vaultGo')) $('vaultGo').textContent='Chiffrement…';
    try{ await enableEncryption(pass); try{ alert('Chiffrement activé. Garde bien ta phrase secrète.'); }catch(_){}; goHome(); }
    catch(e){ vaultErr('Échec du chiffrement sur cet appareil.'); if($('vaultGo')) $('vaultGo').textContent='Activer le chiffrement'; }
  } else {
    if(!pass){ vaultErr('Entre ta phrase.'); return; }
    if($('vaultGo')) $('vaultGo').textContent='…';
    const ok=await unlockVault(pass, vaultMode==='recover');
    if(ok){ initProfiles(); activateProfile(STORE.currentProfile); bootEntry(); }
    else { vaultErr('Phrase incorrecte.'); if($('vaultGo')) $('vaultGo').textContent='Déverrouiller'; }
  }
}
if($('vaultGo')) $('vaultGo').onclick=vaultSubmit;
['vaultPass','vaultPass2'].forEach(id=>{ const el=$(id); if(el) el.onkeydown=(e)=>{ if(e&&e.key==='Enter') vaultSubmit(); }; });

/* ============================================================
   ESPRIT & MATIÈRES — univers Yoga (séances minutées, postures,
   respiration guidée, suivi). 100% local, aucune requête réseau.
   ============================================================ */
if(!STORE.yoga||!Array.isArray(STORE.yoga.log)) STORE.yoga={log:[]};
function yogaState(){ if(!STORE.yoga||!Array.isArray(STORE.yoga.log)) STORE.yoga={log:[]}; return STORE.yoga; }
function fmtSec(n){ n=Math.max(0,Math.round(n)); const m=Math.floor(n/60), s=n%60; return m+':'+String(s).padStart(2,'0'); }
function yfig(inner){ return '<svg class="posesvg" viewBox="0 0 120 130" aria-hidden="true"><g fill="none" stroke="#3F5E4E" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">'+inner+'</g></svg>'; }
const YOGA_POSES=[
  {k:'montagne',n:'Montagne',sk:'Tadasana',lvl:'Débutant',benefit:'Posture d’ancrage : aligne le dos, calme le mental, base des postures debout.',caution:'Épaules basses, poids réparti sur les deux pieds, respire par le ventre.',fig:yfig('<circle cx="60" cy="18" r="7" fill="#3F5E4E"/><path d="M60,26 V72 M60,38 L46,64 M60,38 L74,64 M60,72 L52,114 M60,72 L68,114"/>')},
  {k:'chien',n:'Chien tête en bas',sk:'Adho Mukha Svanasana',lvl:'Débutant',benefit:'Étire l’arrière des jambes et le dos, dynamise, soulage la nuque.',caution:'Plie les genoux si ça tire ; mains bien écartées, hanches vers le haut.',fig:yfig('<circle cx="40" cy="98" r="6.5" fill="#3F5E4E"/><path d="M22,112 L60,44 L98,112"/>')},
  {k:'guerrier',n:'Guerrier II',sk:'Virabhadrasana II',lvl:'Débutant',benefit:'Renforce jambes et gainage, ouvre les hanches, ancre et stabilise.',caution:'Genou avant au-dessus de la cheville, jamais au-delà.',fig:yfig('<circle cx="60" cy="38" r="7" fill="#3F5E4E"/><path d="M60,46 V74 M26,54 H94 M60,74 L28,114 M60,74 L98,114"/>')},
  {k:'arbre',n:'Arbre',sk:'Vrksasana',lvl:'Débutant',benefit:'Équilibre et concentration, renforce les chevilles, apaise le mental.',caution:'Le pied s’appuie au-dessus ou en dessous du genou, jamais dessus.',fig:yfig('<circle cx="60" cy="40" r="7" fill="#3F5E4E"/><path d="M60,48 V72 M60,48 L52,30 M60,48 L68,30 M52,30 L60,20 M68,30 L60,20 M60,72 V114 M60,84 L44,90 L57,76"/>')},
  {k:'cobra',n:'Cobra',sk:'Bhujangasana',lvl:'Débutant',benefit:'Ouvre la poitrine, renforce le bas du dos, contre la position assise.',caution:'Épaules loin des oreilles, ne force pas la cambrure.',fig:yfig('<circle cx="33" cy="70" r="6.5" fill="#3F5E4E"/><path d="M102,106 H56 Q46,106 41,86 M41,86 L47,106"/>')},
  {k:'enfant',n:'Posture de l’enfant',sk:'Balasana',lvl:'Débutant',benefit:'Repos, étire doucement le dos, apaise le système nerveux.',caution:'Idéale pour souffler entre deux postures. Front au sol, relâche tout.',fig:yfig('<circle cx="30" cy="92" r="6.5" fill="#3F5E4E"/><path d="M40,96 Q72,58 90,78 Q94,100 76,106 L46,106 M36,94 L16,101"/>')},
  {k:'assise',n:'Assise facile',sk:'Sukhasana',lvl:'Débutant',benefit:'Assise de respiration et de méditation, redresse la colonne.',caution:'Surélève le bassin sur un coussin si le dos s’arrondit.',fig:yfig('<circle cx="60" cy="27" r="7" fill="#3F5E4E"/><path d="M60,35 V74 M60,52 L40,72 M60,52 L80,72 M40,102 L60,80 L80,102 M40,102 H80"/>')}
];
function poseByKey(k){ return YOGA_POSES.find(p=>p.k===k); }
const YOGA_SEANCES=[
  {k:'reveil',n:'Réveil du matin',dur:'~6 min',desc:'Réveiller le corps en douceur.',steps:[
    {p:'montagne',s:40,cue:'Ancre tes pieds, grandis-toi — 3 respirations.'},
    {p:'chien',s:45,cue:'Pousse les mains, monte les hanches.'},
    {p:'guerrier',s:45,cue:'Côté droit — regard par-dessus la main avant.'},
    {p:'guerrier',s:45,cue:'Côté gauche.'},
    {p:'arbre',s:40,cue:'Un pied ancré, fixe un point devant toi.'},
    {p:'montagne',s:30,cue:'Reviens debout, ressens l’énergie.'}]},
  {k:'dos',n:'Dos & nuque',dur:'~7 min',desc:'Détendre le dos après la position assise.',steps:[
    {p:'enfant',s:50,cue:'Front au sol, relâche les épaules.'},
    {p:'chien',s:45,cue:'Étire tout l’arrière du corps.'},
    {p:'cobra',s:40,cue:'Ouvre la poitrine, épaules basses.'},
    {p:'enfant',s:40,cue:'Repos.'},
    {p:'assise',s:60,cue:'Assise, grandis la colonne, respire.'}]},
  {k:'soir',n:'Détente du soir',dur:'~6 min',desc:'Relâcher avant le coucher.',steps:[
    {p:'assise',s:60,cue:'Respire lentement, allonge l’expiration.'},
    {p:'enfant',s:60,cue:'Abandonne le poids du corps.'},
    {p:'cobra',s:30,cue:'Douce ouverture, sans forcer.'},
    {p:'enfant',s:50,cue:'Repos.'},
    {p:'assise',s:60,cue:'Quelques respirations pour finir.'}]}
];
function seanceSec(s){ return s.steps.reduce((a,st)=>a+st.s,0); }
const YOGA_BREATH=[
  {k:'coherence',n:'Cohérence cardiaque',desc:'5 s inspire / 5 s expire, ~5 min. Apaise, réduit le stress.',phases:[{l:'Inspire',s:5},{l:'Expire',s:5}],cycles:30},
  {k:'478',n:'Respiration 4-7-8',desc:'Inspire 4, retiens 7, expire 8. Favorise l’endormissement.',phases:[{l:'Inspire',s:4},{l:'Retiens',s:7},{l:'Expire',s:8}],cycles:8},
  {k:'carree',n:'Respiration carrée',desc:'4-4-4-4 : équilibre et concentration.',phases:[{l:'Inspire',s:4},{l:'Retiens',s:4},{l:'Expire',s:4},{l:'Retiens',s:4}],cycles:10}
];
/* --- suivi (log local) --- */
function logYoga(type,label,sec){ const y=yogaState(); y.log.push({date:todayStr(),type,label,sec:Math.round(sec||0)}); saveStore(); }
function yogaTotals(log){ log=log||[]; const days={}; log.forEach(e=>days[e.date]=1); return {count:log.length, sec:log.reduce((a,e)=>a+(e.sec||0),0), days:Object.keys(days).length}; }
function yogaStreak(log, today){ const days={}; (log||[]).forEach(e=>days[e.date]=1); let d=new Date((today||todayStr())+'T00:00:00');
  if(!days[d.toISOString().slice(0,10)]) d.setDate(d.getDate()-1);
  let n=0; while(days[d.toISOString().slice(0,10)]){ n++; d.setDate(d.getDate()-1); } return n; }

/* --- hub Esprit & Matières --- */
function rEsprit(){ mode='esprit'; renderEspritHub(); show('scEsprit',{accent:'#7B6E86',nav:'esprit'}); }
function renderEspritHub(){
  const st=yogaTotals(yogaState().log);
  const yogaSub=st.count?(st.count+' séance'+(st.count>1?'s':'')+' · '+Math.round(st.sec/60)+' min'):'Séances, postures, respiration';
  $('espritTiles').innerHTML=
    '<button class="woodtile" data-e="yoga"><span class="wt-ic">🧘</span><span class="wt-mid"><span class="wt-t">Yoga</span><span class="wt-s">'+esc(yogaSub)+'</span></span><span class="chev">›</span></button>'+
    '<button class="woodtile soon" disabled><span class="wt-ic">✦</span><span class="wt-mid"><span class="wt-t">Bientôt</span><span class="wt-s">D’autres pratiques à venir</span></span></button>';
  const y=$('espritTiles').querySelector('[data-e]'); if(y) y.onclick=()=>openYoga();
}
function openYoga(){ go(rYoga,'yoga'); }
function rYoga(){ mode='esprit'; stopYoga(); renderYogaHub(); show('scYoga',{accent:'#7B6E86',nav:'esprit'}); }
function renderYogaHub(){
  const log=yogaState().log; const t=yogaTotals(log); const streak=yogaStreak(log);
  $('yogaSummary').textContent = t.count ? (t.count+' séance'+(t.count>1?'s':'')+' · '+Math.round(t.sec/60)+' min · série '+streak+' j') : 'Séances guidées, postures, respiration.';
  const tiles=[{v:'seances',ic:'🧘',t:'Séances guidées',s:'Routines minutées'},{v:'postures',ic:'🌿',t:'Postures',s:'Bibliothèque illustrée'},{v:'respiration',ic:'🌬️',t:'Respiration',s:'Cohérence, 4-7-8…'},{v:'suivi',ic:'📈',t:'Suivi',s:'Séries & temps'}];
  $('yogaTiles').innerHTML=tiles.map(t=>'<button class="woodtile" data-yv="'+t.v+'"><span class="wt-ic">'+t.ic+'</span><span class="wt-mid"><span class="wt-t">'+t.t+'</span><span class="wt-s">'+esc(t.s)+'</span></span><span class="chev">›</span></button>').join('');
  $('yogaTiles').querySelectorAll('[data-yv]').forEach(b=>b.onclick=()=>openYogaView(b.dataset.yv));
}
const YOGA_VLABEL={seances:'séances',postures:'postures',respiration:'respiration',suivi:'suivi'};
function openYogaView(view){ go(()=>renderYogaFlow(view), YOGA_VLABEL[view]||'yoga'); }
function renderYogaFlow(view){ mode='esprit'; stopYoga();
  if(view==='seances'){ $('yfTitle').textContent='Séances guidées'; renderSeanceList(); }
  else if(view==='postures'){ $('yfTitle').textContent='Postures'; renderPostureList(); }
  else if(view==='respiration'){ $('yfTitle').textContent='Respiration'; renderBreathList(); }
  else if(view==='suivi'){ $('yfTitle').textContent='Suivi de pratique'; renderYogaSuivi(); }
  show('scYogaFlow',{accent:'#7B6E86',nav:'esprit'});
}
/* --- timers (séance + respiration) --- */
let yogaTimer=null, seancePlay=null, breathPlay=null;
function stopYoga(){ if(yogaTimer){ try{ clearInterval(yogaTimer); }catch(e){} yogaTimer=null; } seancePlay=null; breathPlay=null; }
/* --- séances guidées --- */
function renderSeanceList(){ const b=$('yfBody');
  b.innerHTML=YOGA_SEANCES.map(s=>'<button class="woodtile" data-seance="'+s.k+'"><span class="wt-ic">🧘</span><span class="wt-mid"><span class="wt-t">'+esc(s.n)+'</span><span class="wt-s">'+esc(s.dur+' · '+s.desc)+'</span></span><span class="chev">›</span></button>').join('');
  b.querySelectorAll('[data-seance]').forEach(x=>x.onclick=()=>startSeance(x.dataset.seance));
}
function startSeance(k){ const s=YOGA_SEANCES.find(x=>x.k===k); if(!s) return;
  seancePlay={ s, i:0, remaining:s.steps[0].s, playing:true, elapsed:0, total:seanceSec(s) };
  drawSeance(); if(typeof setInterval==='function'){ if(yogaTimer)clearInterval(yogaTimer); yogaTimer=setInterval(tickSeance,1000); }
}
function tickSeance(){ const p=seancePlay; if(!p||!p.playing) return; p.remaining--; p.elapsed++;
  if(p.remaining<=0){ p.i++; if(p.i>=p.s.steps.length){ finishSeance(); return; } p.remaining=p.s.steps[p.i].s; }
  drawSeance();
}
function drawSeance(){ const p=seancePlay; if(!p) return; const st=p.s.steps[p.i]; const pose=poseByKey(st.p); const next=p.s.steps[p.i+1]; const nextPose=next?poseByKey(next.p):null;
  const pct=Math.round(p.elapsed/p.total*100);
  $('yfBody').innerHTML='<div class="yplayer">'+
    '<div class="yp-prog"><i style="width:'+pct+'%"></i></div>'+
    '<div class="yp-step">Posture '+(p.i+1)+' / '+p.s.steps.length+' · '+esc(p.s.n)+'</div>'+
    '<div class="yp-fig">'+(pose?pose.fig:'')+'</div>'+
    '<div class="yp-name">'+(pose?esc(pose.n):'')+'</div>'+
    '<div class="yp-cue">'+esc(st.cue)+'</div>'+
    '<div class="yp-timer">'+fmtSec(p.remaining)+'</div>'+
    '<div class="yp-next">'+(nextPose?'Ensuite : '+esc(nextPose.n):'Dernière posture')+'</div>'+
    '<div class="yp-ctrl"><button class="miniBtn" id="ypPrev">◀︎ Préc.</button><button class="save" id="ypPlay">'+(p.playing?'Pause':'Reprendre')+'</button><button class="miniBtn" id="ypNext">Suiv. ▶︎</button></div>'+
    '<button class="demolink del" id="ypStop" style="margin-top:12px;flex:none;width:100%">Arrêter la séance</button>'+
  '</div>';
  $('ypPlay').onclick=()=>{ p.playing=!p.playing; drawSeance(); };
  $('ypPrev').onclick=()=>{ if(p.i>0){ p.i--; p.remaining=p.s.steps[p.i].s; drawSeance(); } };
  $('ypNext').onclick=()=>{ p.i++; if(p.i>=p.s.steps.length){ finishSeance(); } else { p.remaining=p.s.steps[p.i].s; drawSeance(); } };
  $('ypStop').onclick=()=>{ stopYoga(); renderSeanceList(); };
}
function finishSeance(){ const p=seancePlay; stopYoga(); if(p) logYoga('seance', p.s.n, p.total);
  $('yfBody').innerHTML='<div class="ydone"><div class="yd-ic">🌿</div><div class="yd-t">Séance terminée</div><div class="yd-s">Bravo — '+(p?Math.round(p.total/60):0)+' min enregistrées.</div><button class="save" id="ydBack" style="margin-top:16px">Terminer</button></div>';
  const bk=$('ydBack'); if(bk) bk.onclick=()=>renderSeanceList();
}
/* --- postures (bibliothèque) --- */
function renderPostureList(){ const b=$('yfBody');
  b.innerHTML='<div class="posegrid">'+YOGA_POSES.map(p=>'<button class="posecard" data-pose="'+p.k+'"><span class="pc-fig">'+p.fig+'</span><span class="pc-n">'+esc(p.n)+'</span><span class="pc-sk">'+esc(p.sk)+'</span></button>').join('')+'</div>';
  b.querySelectorAll('[data-pose]').forEach(x=>x.onclick=()=>renderPostureDetail(x.dataset.pose));
}
function renderPostureDetail(k){ const p=poseByKey(k); if(!p) return; const b=$('yfBody');
  b.innerHTML='<div class="posedetail"><div class="pd-fig">'+p.fig+'</div><div class="pd-n">'+esc(p.n)+'</div><div class="pd-sk">'+esc(p.sk)+' · '+esc(p.lvl)+'</div>'+
    '<div class="usect">Bienfaits</div><div class="doc-p">'+esc(p.benefit)+'</div>'+
    '<div class="usect">À savoir</div><div class="doc-p">'+esc(p.caution)+'</div>'+
    '<div class="wnav"><button class="miniBtn" id="pdBack">← Postures</button></div></div>';
  const bk=$('pdBack'); if(bk) bk.onclick=()=>renderPostureList();
}
/* --- respiration guidée --- */
function renderBreathList(){ const b=$('yfBody');
  b.innerHTML=YOGA_BREATH.map(p=>'<button class="woodtile" data-breath="'+p.k+'"><span class="wt-ic">🌬️</span><span class="wt-mid"><span class="wt-t">'+esc(p.n)+'</span><span class="wt-s">'+esc(p.desc)+'</span></span><span class="chev">›</span></button>').join('');
  b.querySelectorAll('[data-breath]').forEach(x=>x.onclick=()=>startBreath(x.dataset.breath));
}
function breathTotal(pat){ return pat.cycles*pat.phases.reduce((a,p)=>a+p.s,0); }
function startBreath(k){ const pat=YOGA_BREATH.find(x=>x.k===k); if(!pat) return;
  breathPlay={ pat, cycle:0, pi:0, remaining:pat.phases[0].s, playing:true, elapsed:0, total:breathTotal(pat) };
  drawBreath(true); if(typeof setInterval==='function'){ if(yogaTimer)clearInterval(yogaTimer); yogaTimer=setInterval(tickBreath,1000); }
}
function tickBreath(){ const p=breathPlay; if(!p||!p.playing) return; p.remaining--; p.elapsed++;
  if(p.elapsed>=p.total){ finishBreath(); return; }
  if(p.remaining<=0){ p.pi++; if(p.pi>=p.pat.phases.length){ p.pi=0; p.cycle++; } p.remaining=p.pat.phases[p.pi].s; drawBreath(true); }
  else drawBreath(false);
}
function drawBreath(phaseChange){ const p=breathPlay; if(!p) return; const ph=p.pat.phases[p.pi];
  const scale = /inspire/i.test(ph.l)?1 : /expire/i.test(ph.l)?0.45 : null;
  if(phaseChange){
    $('yfBody').innerHTML='<div class="bplayer">'+
      '<div class="yp-step">'+esc(p.pat.n)+' · cycle '+(p.cycle+1)+' / '+p.pat.cycles+'</div>'+
      '<div class="breathwrap"><span class="breathcircle" id="breathCircle"></span><span class="breathlbl" id="breathLbl"></span></div>'+
      '<div class="yp-timer" id="breathCount"></div>'+
      '<div class="yp-ctrl"><button class="save" id="bpPlay" style="flex:none;min-width:140px">Pause</button></div>'+
      '<button class="demolink del" id="bpStop" style="margin-top:12px;flex:none;width:100%">Arrêter</button>'+
    '</div>';
    const pb=$('bpPlay'); if(pb) pb.onclick=()=>{ p.playing=!p.playing; pb.textContent=p.playing?'Pause':'Reprendre'; };
    const sb=$('bpStop'); if(sb) sb.onclick=()=>{ stopYoga(); renderBreathList(); };
  }
  const c=$('breathCircle'); if(c && scale!=null){ c.style.transitionDuration=ph.s+'s'; c.style.transform='scale('+scale+')'; }
  const l=$('breathLbl'); if(l) l.textContent=ph.l;
  const cn=$('breathCount'); if(cn) cn.textContent=p.remaining;
}
function finishBreath(){ const p=breathPlay; stopYoga(); if(p) logYoga('respiration', p.pat.n, p.total);
  $('yfBody').innerHTML='<div class="ydone"><div class="yd-ic">🌸</div><div class="yd-t">Respiration terminée</div><div class="yd-s">'+(p?Math.round(p.total/60):0)+' min · beau travail.</div><button class="save" id="ydBack" style="margin-top:16px">Terminer</button></div>';
  const bk=$('ydBack'); if(bk) bk.onclick=()=>renderBreathList();
}
/* --- suivi --- */
function renderYogaSuivi(){ const b=$('yfBody'); const log=yogaState().log; const t=yogaTotals(log); const streak=yogaStreak(log);
  const kpi=(v,l)=>'<div class="kpi"><div class="kpi-v">'+v+'</div><div class="kpi-l">'+l+'</div></div>';
  let html='<div class="kpi-grid">'+kpi(streak+' j','série en cours')+kpi(t.count,'séances')+kpi(Math.round(t.sec/60)+' min','temps total')+kpi(t.days,'jours actifs')+'</div>';
  html+='<button class="addbtn" id="yManual" style="margin-top:14px">+ J’ai pratiqué aujourd’hui</button>';
  html+='<div class="dash-h">Historique</div>';
  const recent=log.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,25);
  html+= recent.length ? '<div class="woodlist">'+recent.map(e=>'<div class="logrow"><span class="lg-ph">'+(e.type==='respiration'?'🌬️':e.type==='seance'?'🧘':'✔️')+'</span><span class="lg-mid"><span class="lg-n">'+esc(e.label||'Pratique')+'</span><span class="lg-m">'+esc(e.date)+' · '+Math.max(1,Math.round((e.sec||0)/60))+' min</span></span></div>').join('')+'</div>' : '<div class="empty">Aucune pratique enregistrée. Fais une séance, ou note-la ici.</div>';
  b.innerHTML=html;
  const m=$('yManual'); if(m) m.onclick=()=>{ logYoga('manuel','Pratique libre',10*60); renderYogaSuivi(); };
}

/* ============================================================
   PROJET BOIS — grumes : photo, identification (mini-IA hors-ligne),
   mesure (photo + repère d'échelle), stock et projets possibles.
   Tout est local et déterministe : aucune requête réseau.
   ============================================================ */
if(!STORE.woodStock) STORE.woodStock=[];
if(!STORE.woodPlan||!Array.isArray(STORE.woodPlan.selected)) STORE.woodPlan={selected:[]};
const ESS_COLOR={chene:'#8A5A3C',hetre:'#C99A3F',frene:'#A9B18F',chataignier:'#9C6B3F',charme:'#B8A98C',bouleau:'#CBBfa0',noyer:'#5B4636',merisier:'#A4572F',robinier:'#8A8A3C',peuplier:'#C6CEBb',pin:'#C98A4F',epicea:'#8FA98F',sapin:'#7E9E86',douglas:'#B06A4F',meleze:'#A85A3C'};
function essColor(k){ return ESS_COLOR[k]||'#8A7A5C'; }

/* base de données d'essences (attributs observables) */
const WOOD_Q=[
  {id:'type', q:'Feuilles ou aiguilles ?', o:[['feuillu','Feuilles larges (feuillu)'],['resineux','Aiguilles / écailles (résineux)']]},
  {id:'leaf', q:'Forme des feuilles / aiguilles', o:[['simple','Feuille simple, entière'],['dentee','Feuille dentée'],['lobee','Feuille lobée (découpée)'],['composee','Feuille composée (folioles)'],['aig_faisceau','Aiguilles groupées par 2-5'],['aig_isolees','Aiguilles courtes, isolées, piquantes'],['aig_plates','Aiguilles plates et douces'],['aig_rosette','Aiguilles en touffes, tombent l’hiver'],['ecailles','Écailles (type cyprès)']]},
  {id:'fruit', q:'Fruit / graine observé', o:[['gland','Gland'],['faine','Faîne (triangulaire)'],['samare','Graine ailée (samare)'],['chataigne','Châtaigne (bogue piquante)'],['noix','Noix'],['charnu','Petit fruit charnu (cerise…)'],['cone','Cône / pomme de pin'],['gousse','Gousse (type haricot)'],['aucun','Aucun / je ne sais pas']]},
  {id:'bark', q:'Écorce', o:[['lisse','Lisse, grise'],['crevassee','Crevassée, sillons'],['ecailleuse','Écailleuse (plaques)'],['blanche','Blanche, papier'],['orangee','Orangée en haut, écailleuse'],['cannelee','Lisse et cannelée (musclée)']]},
  {id:'color', q:'Couleur du bois coupé', o:[['blanc','Très clair, blanc'],['blond','Clair, blond'],['brun','Brun'],['brun_rouge','Brun rougeâtre'],['brun_fonce','Brun foncé'],['jaune_vert','Jaune-verdâtre']]},
  {id:'hard', q:'Dureté (ongle / entame)', o:[['tendre','Tendre (se raye vite)'],['mi_dur','Mi-dur'],['dur','Dur'],['tres_dur','Très dur']]}
];
const HARD_LBL={tendre:'tendre',mi_dur:'mi-dur',dur:'dur',tres_dur:'très dur'};
const USE_LBL={charpente:'Charpente',planche:'Planches',meuble:'Meuble',piquet:'Piquets',bardage:'Bardage',terrasse:'Terrasse',manche:'Manches',chauffage:'Chauffage',caisse:'Caisserie'};
const ESSENCES=[
  {k:'chene',n:'Chêne',t:'Feuillu',hard:'dur',dens:0.72,ext:true,uses:['charpente','planche','meuble','piquet','bardage','chauffage'],
   feat:{type:['feuillu'],leaf:['lobee'],fruit:['gland'],bark:['crevassee'],color:['brun','blond'],hard:['dur','tres_dur']},
   note:'Bois dur, solide et durable. Charpente, parquet, tonnellerie, meuble.'},
  {k:'hetre',n:'Hêtre',t:'Feuillu',hard:'dur',dens:0.68,ext:false,uses:['meuble','planche','chauffage'],
   feat:{type:['feuillu'],leaf:['simple','dentee'],fruit:['faine'],bark:['lisse'],color:['blond','blanc'],hard:['dur']},
   note:'Dur et homogène, mais craint l’humidité. Meuble, contreplaqué, tournage.'},
  {k:'frene',n:'Frêne',t:'Feuillu',hard:'dur',dens:0.69,ext:false,uses:['manche','meuble','planche'],
   feat:{type:['feuillu'],leaf:['composee'],fruit:['samare'],bark:['crevassee','lisse'],color:['blond','blanc'],hard:['dur']},
   note:'Dur et souple à la fois. Manches d’outils, meuble, articles de sport.'},
  {k:'chataignier',n:'Châtaignier',t:'Feuillu',hard:'mi_dur',dens:0.58,ext:true,uses:['piquet','charpente','bardage','meuble'],
   feat:{type:['feuillu'],leaf:['dentee'],fruit:['chataigne'],bark:['crevassee'],color:['blond','brun'],hard:['mi_dur','dur']},
   note:'Naturellement durable (tannins). Piquets, charpente légère, bardage.'},
  {k:'charme',n:'Charme',t:'Feuillu',hard:'tres_dur',dens:0.75,ext:false,uses:['manche','chauffage'],
   feat:{type:['feuillu'],leaf:['dentee'],fruit:['samare'],bark:['cannelee','lisse'],color:['blanc','blond'],hard:['tres_dur']},
   note:'Très dur et dense. Pièces qui frottent, manches, excellent bois de chauffage.'},
  {k:'bouleau',n:'Bouleau',t:'Feuillu',hard:'mi_dur',dens:0.61,ext:false,uses:['planche','meuble'],
   feat:{type:['feuillu'],leaf:['dentee','simple'],fruit:['samare'],bark:['blanche'],color:['blanc','blond'],hard:['mi_dur']},
   note:'Écorce blanche typique. Contreplaqué, déco, tournage.'},
  {k:'noyer',n:'Noyer',t:'Feuillu',hard:'dur',dens:0.65,ext:false,uses:['meuble'],
   feat:{type:['feuillu'],leaf:['composee'],fruit:['noix'],bark:['crevassee'],color:['brun_fonce','brun'],hard:['dur']},
   note:'Bois noble brun foncé. Ébénisterie, meuble de luxe, placage.'},
  {k:'merisier',n:'Merisier',t:'Feuillu',hard:'mi_dur',dens:0.60,ext:false,uses:['meuble'],
   feat:{type:['feuillu'],leaf:['dentee'],fruit:['charnu'],bark:['lisse'],color:['brun_rouge'],hard:['mi_dur']},
   note:'Brun rosé chaleureux. Ébénisterie, meuble, placage.'},
  {k:'robinier',n:'Robinier (faux-acacia)',t:'Feuillu',hard:'tres_dur',dens:0.77,ext:true,uses:['piquet','terrasse','charpente','manche'],
   feat:{type:['feuillu'],leaf:['composee'],fruit:['gousse'],bark:['crevassee'],color:['jaune_vert'],hard:['tres_dur']},
   note:'Extrêmement durable sans traitement. Piquets, terrasse, structures extérieures.'},
  {k:'peuplier',n:'Peuplier',t:'Feuillu',hard:'tendre',dens:0.45,ext:false,uses:['planche','caisse'],
   feat:{type:['feuillu'],leaf:['simple'],fruit:['aucun'],bark:['lisse','crevassee'],color:['blanc'],hard:['tendre']},
   note:'Léger et tendre. Cagettes, contreplaqué, palettes.'},
  {k:'pin',n:'Pin sylvestre',t:'Résineux',hard:'mi_dur',dens:0.52,ext:false,uses:['charpente','planche','bardage'],
   feat:{type:['resineux'],leaf:['aig_faisceau'],fruit:['cone'],bark:['orangee','ecailleuse'],color:['blond'],hard:['mi_dur']},
   note:'Résineux polyvalent. Charpente, menuiserie, lambris.'},
  {k:'epicea',n:'Épicéa',t:'Résineux',hard:'tendre',dens:0.45,ext:false,uses:['charpente','planche'],
   feat:{type:['resineux'],leaf:['aig_isolees'],fruit:['cone'],bark:['ecailleuse'],color:['blanc','blond'],hard:['tendre']},
   note:'Léger et clair. Charpente, lambris, caisserie, lutherie.'},
  {k:'sapin',n:'Sapin',t:'Résineux',hard:'tendre',dens:0.45,ext:false,uses:['charpente','planche'],
   feat:{type:['resineux'],leaf:['aig_plates'],fruit:['cone'],bark:['lisse'],color:['blanc'],hard:['tendre']},
   note:'Proche de l’épicéa, aiguilles plates. Charpente, menuiserie.'},
  {k:'douglas',n:'Douglas',t:'Résineux',hard:'mi_dur',dens:0.53,ext:true,uses:['charpente','bardage','terrasse'],
   feat:{type:['resineux'],leaf:['aig_plates','aig_isolees'],fruit:['cone'],bark:['crevassee'],color:['brun_rouge','blond'],hard:['mi_dur']},
   note:'Résineux durable au cœur. Charpente, bardage et ossature extérieurs.'},
  {k:'meleze',n:'Mélèze',t:'Résineux',hard:'mi_dur',dens:0.55,ext:true,uses:['bardage','terrasse','charpente'],
   feat:{type:['resineux'],leaf:['aig_rosette'],fruit:['cone'],bark:['crevassee'],color:['brun_rouge'],hard:['mi_dur','dur']},
   note:'Aiguilles caduques, cœur durable. Bardage, terrasse, extérieur.'}
];
function essenceByKey(k){ return ESSENCES.find(e=>e.k===k); }
/* « mini-IA » : score pondéré par indice observé → classement + confiance */
function identifyEssence(ans){
  const results=ESSENCES.map(e=>{
    let score=0, answered=0;
    for(const q in ans){ const v=ans[q]; if(v==null||v==='') continue; answered++;
      const acc=e.feat[q]; if(!acc) continue;               // pas de contrainte connue → neutre
      if(acc.indexOf(v)>=0) score+=2; else score-=1.2;       // accord / désaccord
    }
    const conf=(answered&&score>0)?Math.max(0,Math.min(100,Math.round(100*score/(2*answered)))):0;
    return {e,score,conf,answered};
  });
  results.sort((a,b)=> b.score-a.score || a.e.n.localeCompare(b.e.n));
  return results;
}
/* volume d'une grume ≈ cylindre (Ø médian) */
function logVolume(lenCm,diamCm){ const r=(diamCm/2)/100, l=lenCm/100; return (lenCm>0&&diamCm>0)?Math.PI*r*r*l:0; }
/* mesure par repère d'échelle (points en % de l'image) */
function ptDistPx(a,b,rw,rh){ return Math.hypot((a.xPct-b.xPct)/100*rw,(a.yPct-b.yPct)/100*rh); }
function scaleRealCm(segPts, refPts, refCm, rw, rh){
  if(segPts.length<2||refPts.length<2||!refCm) return 0;
  const refPx=ptDistPx(refPts[0],refPts[1],rw,rh); if(refPx<=0) return 0;
  const segPx=ptDistPx(segPts[0],segPts[1],rw,rh);
  return Math.round(segPx*refCm/refPx);
}
/* volume : tronc de cône si 2 diamètres, sinon cylindre (Ø médian) */
function grumeVolume(lenCm,d1,d2){ const L=(lenCm||0)/100; if(!(L>0)||!(d1>0)) return 0;
  if(d2>0){ const r1=(d1/2)/100, r2=(d2/2)/100; return Math.PI*L/3*(r1*r1+r1*r2+r2*r2); }
  const r=(d1/2)/100; return Math.PI*r*r*L; }
/* estimation du nombre de planches d'une épaisseur donnée dans une grume */
function plankEstimate(lenCm,diamCm,thickCm){ if(!(lenCm>0)||!(diamCm>0)||!(thickCm>0)) return 0;
  const side=diamCm*0.7, kerf=0.4; return Math.max(0,Math.floor((side+kerf)/(thickCm+kerf))); }
function measureResults(d){
  const m=d.m||{}; const rw=m.rw||1, rh=m.rh||1; const circ=(d.mMode==='circ');
  const toD=v=>(circ&&v>0)?v/Math.PI:v;                 // circonférence → diamètre (mesure manuelle)
  const manL=(d.mLenManual!=null&&d.mLenManual!==''), manD=(d.mDiamManual!=null&&d.mDiamManual!==''), manD2=(d.mDiam2Manual!=null&&d.mDiam2Manual!=='');
  let lenCm  = manL ? parseFloat(d.mLenManual) : scaleRealCm(m.len||[], m.ref||[], m.refCm, rw, rh);
  let diamCm = manD ? toD(parseFloat(d.mDiamManual)) : scaleRealCm(m.diam||[], m.ref||[], m.refCm, rw, rh);
  let diam2Cm= manD2 ? toD(parseFloat(d.mDiam2Manual)) : 0;
  lenCm=Math.round(lenCm||0); diamCm=Math.round(diamCm||0); diam2Cm=Math.round(diam2Cm||0);
  return { lenCm, diamCm, diam2Cm, vol:grumeVolume(lenCm,diamCm,diam2Cm) };
}
/* photo → base64 redimensionné (réutilise le pipeline canvas) */
function readPhoto(file, cb){
  const reader=new FileReader();
  reader.onload=ev=>{ const img=new Image();
    img.onload=()=>{ let w=img.width,h=img.height; const max=1100; if(w>max||h>max){ const r=Math.min(max/w,max/h); w=Math.round(w*r); h=Math.round(h*r); }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h; cv.getContext('2d').drawImage(img,0,0,w,h);
      let data; try{ data=cv.toDataURL('image/jpeg',0.72); }catch(err){ alert('Image illisible.'); return; } cb(data); };
    img.onerror=()=>alert('Format d’image non supporté (essaie une photo JPG/PNG).');
    img.src=ev.target.result; };
  reader.readAsDataURL(file);
}
let woodPhotoCb=null;
if($('woodPhotoInput')) $('woodPhotoInput').onchange=e=>{ const f=e.target.files&&e.target.files[0]; if(f&&woodPhotoCb) readPhoto(f, woodPhotoCb); e.target.value=''; };
function grabPhoto(cb){ woodPhotoCb=cb; $('woodPhotoInput').click(); }

/* ---- hub ---- */
function woodStats(){ const s=STORE.woodStock||[]; return { count:s.length, vol:s.reduce((a,l)=>a+(l.volumeM3||0),0) }; }
function rWood(){ mode='wood'; renderWoodHub(); show('scWood',{accent:'#7C5A34',nav:'wood'}); }
function renderWoodHub(){
  const st=woodStats();
  $('woodSummary').textContent = st.count ? (st.count+' grume'+(st.count>1?'s':'')+' · '+st.vol.toFixed(2)+' m³ en stock') : 'Inventorie tes grumes : photo, essence, dimensions, stock.';
  const tiles=[
    {v:'new', ic:'➕', t:'Nouvelle grume', s:'Photo → essence → mesure'},
    {v:'identify', ic:'🌳', t:'Identifier une essence', s:'Guide + mini-IA'},
    {v:'stock', ic:'📦', t:'Stock', s:st.count+' grume'+(st.count>1?'s':'')},
    {v:'projects', ic:'📊', t:'Tableau de bord', s:'KPI, stock & projets'}
  ];
  let html=tiles.map(t=>'<button class="woodtile" data-wv="'+t.v+'"><span class="wt-ic">'+t.ic+'</span><span class="wt-mid"><span class="wt-t">'+t.t+'</span><span class="wt-s">'+esc(t.s)+'</span></span><span class="chev">›</span></button>').join('');
  html+='<div class="wood-demo"><button class="demolink" id="woodDemo">🧪 Charger 20 grumes d’exemple</button>'+(st.count?'<button class="demolink del" id="woodClear">Vider le stock</button>':'')+'</div>';
  $('woodTiles').innerHTML=html;
  $('woodTiles').querySelectorAll('[data-wv]').forEach(b=>b.onclick=()=>{ const v=b.dataset.wv; if(v==='new') startWoodNew(); else openWoodView(v); });
  if($('woodDemo')) $('woodDemo').onclick=()=>{ loadWoodDemo(); openWoodView('projects'); };
  if($('woodClear')){ const c=$('woodClear'); c.onclick=()=>{ if(c.dataset.armed!=='1'){ c.dataset.armed='1'; c.textContent='Confirmer ? vider tout le stock'; setTimeout(()=>{ if(c.dataset.armed==='1'){ c.dataset.armed='0'; c.textContent='Vider le stock'; } },4000); return; } clearWoodStock(); renderWoodHub(); }; }
}
/* jeu d'essai : 20 grumes d'essences et tailles variées pour explorer les projets */
function woodDemoLogs(){
  const spec=[['chene',300,38],['chene',90,12],['douglas',260,30],['douglas',180,22],['epicea',240,26],['epicea',150,16],['pin',220,28],['meleze',200,24],['meleze',120,15],['chataignier',160,16],['chataignier',130,10],['robinier',200,26],['robinier',140,12],['frene',120,18],['frene',90,14],['hetre',140,28],['charme',80,16],['noyer',110,30],['merisier',100,26],['peuplier',300,40]];
  return spec.map((s,i)=>{ const e=essenceByKey(s[0]); return { id:'log_demo_'+i, date:new Date(Date.now()-i*86400000).toISOString().slice(0,10), speciesKey:s[0], speciesName:e.n, lengthCm:s[1], diamCm:s[2], volumeM3:+logVolume(s[1],s[2]).toFixed(3), photo:'' }; });
}
function loadWoodDemo(){ woodDemoLogs().forEach(l=>{ if(!STORE.woodStock.some(x=>x.id===l.id)) STORE.woodStock.push(l); }); saveStore(); }
function clearWoodStock(){ STORE.woodStock=[]; saveStore(); }
const WOOD_VIEW_LABEL={identify:'identifier',stock:'stock',projects:'projets'};
function openWoodView(view){ go(()=>renderWoodFlow(view), WOOD_VIEW_LABEL[view]||'bois'); }
function renderWoodFlow(view){
  mode='wood';
  if(view==='stock'){ $('wfTitle').textContent='Stock de grumes'; renderWoodStock(); }
  else if(view==='projects'){ $('wfTitle').textContent='Tableau de bord'; renderWoodDashboard(); }
  else if(view==='identify'){ $('wfTitle').textContent='Identifier une essence'; renderWoodIdentify(); }
  show('scWoodFlow',{accent:'#7C5A34',nav:'wood'});
}

/* ---- identification (guide + mini-IA), réutilisable ---- */
function renderIdentifyUI(host, ans, onPick){
  const res=identifyEssence(ans);
  const answered=Object.values(ans).filter(v=>v!=null&&v!=='').length;
  let html='<div class="woodq">';
  WOOD_Q.forEach(q=>{ html+='<div class="wq"><div class="wq-t">'+q.q+'</div><div class="wq-opts">';
    q.o.forEach(([v,label])=>{ const on=ans[q.id]===v; html+='<button class="wopt'+(on?' on':'')+'" data-q="'+q.id+'" data-v="'+v+'">'+esc(label)+'</button>'; });
    html+='</div></div>'; });
  html+='</div>';
  html+='<div class="wres"><div class="wres-h">Proposition de la mini-IA'+(answered?' · '+answered+' indice'+(answered>1?'s':''):'')+'</div>';
  if(!answered){ html+='<div class="empty">Réponds à quelques questions : les essences probables s’affichent ici.</div>'; }
  else { res.slice(0,3).forEach((r,i)=>{ html+='<button class="wcand'+(i===0&&r.conf>0?' top':'')+'" data-pick="'+r.e.k+'"><span class="wc-main"><span class="wc-n">'+esc(r.e.n)+'</span><span class="wc-m">'+r.e.t+' · '+HARD_LBL[r.e.hard]+'</span></span><span class="wc-conf"><span class="wc-bar"><i style="width:'+r.conf+'%"></i></span><b>'+r.conf+'%</b></span></button>'; }); }
  html+='</div>';
  host.innerHTML=html;
  host.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{ const q=b.dataset.q; ans[q]=(ans[q]===b.dataset.v)?'':b.dataset.v; renderIdentifyUI(host,ans,onPick); });
  host.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>onPick(b.dataset.pick));
}
function essenceFicheHTML(e){
  const uses=e.uses.map(u=>'<span class="wtag">'+(USE_LBL[u]||u)+'</span>').join('');
  return '<div class="efiche"><div class="ef-h"><span class="ef-n">'+esc(e.n)+'</span><span class="ef-t">'+e.t+'</span></div>'+
    '<div class="ef-row"><span>Dureté</span><b>'+HARD_LBL[e.hard]+'</b></div>'+
    '<div class="ef-row"><span>Densité indicative</span><b>~'+e.dens.toFixed(2)+'</b></div>'+
    '<div class="ef-row"><span>Extérieur sans traitement</span><b>'+(e.ext?'oui':'non')+'</b></div>'+
    '<div class="ef-note">'+esc(e.note)+'</div><div class="ef-uses">'+uses+'</div></div>';
}
let woodIdAns={};
function renderWoodIdentify(){
  const b=$('wfBody');
  b.innerHTML='<div id="wid"></div>';
  renderIdentifyUI($('wid'), woodIdAns, (k)=>{
    const e=essenceByKey(k);
    b.innerHTML='<div class="wstep">Fiche essence</div>'+essenceFicheHTML(e)+'<div class="wnav"><button class="miniBtn" id="widBack">← Revenir au guide</button></div>';
    $('widBack').onclick=()=>renderWoodIdentify();
  });
}

/* ---- stock ---- */
let woodSort='date';
function woodByEssence(){ const s=STORE.woodStock||[]; const map={}; s.forEach(l=>{ const k=l.speciesName||'—'; (map[k]||(map[k]={n:0,vol:0})); map[k].n++; map[k].vol+=(l.volumeM3||0); }); return Object.entries(map).sort((a,b)=>b[1].vol-a[1].vol); }
function woodExportText(){ const s=STORE.woodStock||[]; const cl=x=>String(x==null?'':x).replace(/[;\n]/g,',');
  const head='n°;essence;longueur_cm;diam_cm;diam2_cm;volume_m3;etat;provenance;date_abattage;note';
  return head+'\n'+s.map(l=>[l.numero,l.speciesName,l.lengthCm,l.diamCm,l.diam2Cm,l.volumeM3,l.etat,l.provenance,l.dateAbattage,l.note].map(cl).join(';')).join('\n'); }
function duplicateWoodLog(id){ const l=(STORE.woodStock||[]).find(x=>x.id===id); if(!l) return;
  const cp=JSON.parse(JSON.stringify(l)); cp.id='log_'+Date.now(); cp.date=new Date().toISOString().slice(0,10); cp.numero='';
  STORE.woodStock.push(cp); if(!saveStoreOk()){ STORE.woodStock.pop(); alert('Stockage plein.'); return; } renderWoodStock(); }
function renderWoodStock(){
  const b=$('wfBody'); const s=STORE.woodStock||[];
  if(!s.length){ b.innerHTML='<div class="empty">Aucune grume en stock. Ajoute-en une depuis « Nouvelle grume ».</div>'; return; }
  const st=woodStats();
  let html='<div class="ec-head">'+st.count+' grume'+(st.count>1?'s':'')+' · '+st.vol.toFixed(2)+' m³</div>';
  html+='<details class="wood-tot"><summary>Total par essence</summary><div class="wt-list">'+woodByEssence().map(([n,v])=>'<div class="wt-row"><span>'+esc(n)+'</span><b>'+v.n+' · '+v.vol.toFixed(2)+' m³</b></div>').join('')+'</div></details>';
  html+='<div class="wsort">'+[['date','Récent'],['vol','Volume'],['essence','Essence']].map(([k,l])=>'<button class="wsortb'+(woodSort===k?' on':'')+'" data-sort="'+k+'">'+l+'</button>').join('')+'</div>';
  const sorted=s.slice();
  if(woodSort==='vol') sorted.sort((a,b)=>(b.volumeM3||0)-(a.volumeM3||0));
  else if(woodSort==='essence') sorted.sort((a,b)=>(a.speciesName||'').localeCompare(b.speciesName||''));
  else sorted.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  html+='<div class="woodlist">';
  sorted.forEach(l=>{ const e=essenceByKey(l.speciesKey);
    const num=l.numero?'<span class="lg-num">n°'+esc(l.numero)+'</span> ':'';
    const dims=l.lengthCm?(l.lengthCm+' cm × Ø'+l.diamCm+(l.diam2Cm?'/'+l.diam2Cm:'')+' cm'):'dimensions —';
    const extra=[]; if(l.provenance) extra.push('📍'+esc(l.provenance)); if(l.etat) extra.push(esc(l.etat)); if(l.qualite) extra.push(esc(l.qualite));
    const ep=parseFloat(l.epaisseur); if(ep>0){ extra.push('🌬️ sec ≈ '+ep+' an'+(ep>1?'s':'')+' après débit'); const nb=plankEstimate(l.lengthCm,l.diamCm,ep); if(nb>0) extra.push('🪚 ≈ '+nb+' planche'+(nb>1?'s':'')+' de '+ep+' cm'); }
    html+='<div class="logrow"><span class="lg-ph">'+(l.photo?'<img src="'+l.photo+'" alt="">':'🪵')+'</span>'+
      '<span class="lg-mid"><span class="lg-n">'+num+esc(l.speciesName||(e?e.n:'Grume'))+'</span>'+
      '<span class="lg-m">'+dims+' · '+(l.volumeM3?l.volumeM3.toFixed(3)+' m³':'—')+'</span>'+
      (extra.length?'<span class="lg-x">'+extra.join(' · ')+'</span>':'')+'</span>'+
      '<span class="lg-acts"><button class="lg-dup" data-dup="'+l.id+'" title="Dupliquer">⧉</button><button class="lg-del" data-del="'+l.id+'">×</button></span></div>';
  });
  html+='</div>';
  html+='<details class="wood-exp"><summary>Exporter l’inventaire (copier-coller)</summary><textarea class="wexp-ta" readonly rows="6">'+esc(woodExportText())+'</textarea></details>';
  b.innerHTML=html;
  b.querySelectorAll('[data-sort]').forEach(x=>x.onclick=()=>{ woodSort=x.dataset.sort; renderWoodStock(); });
  b.querySelectorAll('[data-del]').forEach(x=>x.onclick=()=>{ STORE.woodStock=STORE.woodStock.filter(l=>l.id!==x.dataset.del); saveStore(); renderWoodStock(); });
  b.querySelectorAll('[data-dup]').forEach(x=>x.onclick=()=>duplicateWoodLog(x.dataset.dup));
}

/* ---- projets possibles (règles essence + dimensions + durabilité) ---- */
const WOOD_PROJECTS=[
  {k:'charpente',n:'Charpente / poutres',ic:'🏠',use:'charpente',minLen:200,minDiam:25,ext:false,desc:'Grumes droites et fortes pour poutres et pannes.'},
  {k:'ossature',n:'Ossature / abri',ic:'🛖',use:'charpente',minLen:150,minDiam:15,ext:false,desc:'Montants et solives d’un abri ou d’une extension.'},
  {k:'bardage',n:'Bardage extérieur',ic:'🧱',use:'bardage',minLen:150,minDiam:20,ext:true,desc:'Planches de façade — essence durable requise.'},
  {k:'terrasse',n:'Terrasse / platelage',ic:'🪵',use:'terrasse',minLen:100,minDiam:18,ext:true,desc:'Lames de terrasse en essence durable.'},
  {k:'piquet',n:'Piquets de clôture',ic:'🚧',use:'piquet',minLen:120,minDiam:8,ext:true,desc:'Piquets — essence naturellement durable.'},
  {k:'planche',n:'Planches / menuiserie',ic:'🪚',use:'planche',minLen:100,minDiam:22,ext:false,desc:'Débit en planches pour menuiserie intérieure.'},
  {k:'meuble',n:'Meuble / ébénisterie',ic:'🪑',use:'meuble',minLen:60,minDiam:25,ext:false,desc:'Belles billes pour plateaux et meubles.'},
  {k:'manche',n:'Manches d’outils',ic:'🔨',use:'manche',minLen:40,minDiam:8,ext:false,desc:'Bois dur et souple pour manches.'},
  {k:'chauffage',n:'Bois de chauffage',ic:'🔥',use:'chauffage',minLen:0,minDiam:0,ext:false,desc:'Feuillus denses — surtout charme, hêtre, chêne.'},
  {k:'barriere',n:'Barrières de paddock',ic:'🐴',use:'piquet',minLen:250,minDiam:12,ext:true,desc:'Lisses et poteaux pour clôturer prairies et paddocks.'},
  {k:'ratelier',n:'Râtelier à foin',ic:'🌾',use:'charpente',minLen:150,minDiam:12,ext:true,desc:'Râtelier robuste pour le foin des chevaux.'},
  {k:'ruche',n:'Ruche (corps & cadres)',ic:'🐝',use:'planche',minLen:60,minDiam:24,ext:false,desc:'Corps de ruche en planches de 27 mm, sans traitement.'},
  {k:'abribois',n:'Abri à bois',ic:'⛺',use:'charpente',minLen:180,minDiam:12,ext:true,desc:'Appentis ventilé pour sécher le bois de chauffage.'},
  {k:'poulailler',n:'Poulailler',ic:'🐔',use:'planche',minLen:80,minDiam:18,ext:false,desc:'Caisse saine, perchoirs et pondoirs.'},
  {k:'portail',n:'Portail de prairie',ic:'🚪',use:'bardage',minLen:150,minDiam:16,ext:true,desc:'Barrière à écharpe en essence durable.'},
  {k:'echelle',n:'Échelle',ic:'🪜',use:'manche',minLen:180,minDiam:10,ext:false,desc:'Montants à fil suivi, barreaux emmanchés.'},
  {k:'banc',n:'Banc & table rustiques',ic:'🛋️',use:'meuble',minLen:120,minDiam:28,ext:true,desc:'Plateaux massifs sur piètement fendu.'},
  {k:'tavaillon',n:'Bardeaux / tavaillons',ic:'🍂',use:'piquet',minLen:40,minDiam:22,ext:true,desc:'Couverture en bois fendu, à l’ancienne.'},
  {k:'passerelle',n:'Passerelle / petit pont',ic:'🌉',use:'charpente',minLen:250,minDiam:24,ext:true,desc:'Poutres équarries pour franchir fossé ou ruisseau.'}
];
function woodProjectFit(){
  const stock=STORE.woodStock||[];
  return WOOD_PROJECTS.map(p=>{
    let hasSpecies=false, tooSmall=false;
    const fit=stock.filter(l=>{ const e=essenceByKey(l.speciesKey); if(!e) return false;
      if(e.uses.indexOf(p.use)<0) return false; if(p.ext&&!e.ext) return false;
      hasSpecies=true;
      if((l.lengthCm||0)<p.minLen||(l.diamCm||0)<p.minDiam){ tooSmall=true; return false; }
      return true; });
    const vol=fit.reduce((a,l)=>a+(l.volumeM3||0),0);
    const species=[...new Set(fit.map(l=>{const e=essenceByKey(l.speciesKey);return e?e.n:'';}).filter(Boolean))];
    let hint=''; if(!fit.length){ hint = !hasSpecies ? 'Aucune essence adaptée en stock.' : (tooSmall?'Grumes présentes mais trop petites.':'—'); }
    return {p,count:fit.length,vol,species,ok:fit.length>0,hint,logs:fit};
  });
}
/* ---- tableau de bord (KPI + stock par essence + projets cochables) ---- */
function woodPlanSet(){ return new Set((STORE.woodPlan&&STORE.woodPlan.selected)||[]); }
function woodQty(k){ const q=(STORE.woodPlan&&STORE.woodPlan.qty)||{}; return Math.max(1,q[k]||1); }
function setWoodQty(k,n){ if(!STORE.woodPlan) STORE.woodPlan={selected:[]}; if(!STORE.woodPlan.qty) STORE.woodPlan.qty={};
  STORE.woodPlan.qty[k]=Math.max(1,Math.min(999,parseInt(n,10)||1)); saveStore(); }
function logPieces(k,l){ const doc=WOOD_DOC[k]; return doc?debitYield(doc.y.type,doc.y.params,l):0; }
function toggleWoodPlan(k){ const sel=woodPlanSet(); const qty=(STORE.woodPlan&&STORE.woodPlan.qty)||{};
  if(sel.has(k)){ sel.delete(k); delete qty[k]; }
  else { sel.add(k);
    if(!qty[k]){ const r=woodProjectFit().find(x=>x.p.k===k);   // défaut : le max réalisable
      const max=(r?r.logs:[]).reduce((a,l)=>a+logPieces(k,l),0); qty[k]=Math.max(1,max); } }
  STORE.woodPlan={selected:[...sel], qty}; saveStore(); }
/* Allocation : chaque construction choisie réserve juste les grumes nécessaires
   pour atteindre le nombre de pièces voulu (meilleur rendement d'abord). */
function woodAllocation(fit){
  fit=fit||woodProjectFit();
  const sel=(STORE.woodPlan&&STORE.woodPlan.selected)||[];
  const used=new Set(); const alloc={};
  sel.forEach(k=>{ const r=fit.find(x=>x.p.k===k); if(!r) return;
    const want=woodQty(k);
    const cand=r.logs.filter(l=>!used.has(l.id)).map(l=>({l,y:logPieces(k,l)}))
      .filter(c=>c.y>0).sort((a,b)=>b.y-a.y);
    let got=0; const logs=[]; let vol=0;
    for(const c of cand){ if(got>=want) break; logs.push(c); used.add(c.l.id); got+=c.y; vol+=c.l.volumeM3||0; }
    const doc=WOOD_DOC[k];
    alloc[k]={want, got, logs, vol, unit:(doc&&doc.y.unit)||'pièce'};
  });
  return {alloc, used};
}
function woodDashboardData(){
  const stock=STORE.woodStock||[];
  const fit=woodProjectFit();
  const sel=woodPlanSet();
  const A=woodAllocation(fit);
  const mob=A.used;                                      // grumes réservées par les constructions choisies
  const totalVol=stock.reduce((a,l)=>a+(l.volumeM3||0),0);
  const mobVol=stock.filter(l=>mob.has(l.id)).reduce((a,l)=>a+(l.volumeM3||0),0);
  const byE={};
  stock.forEach(l=>{ const k=l.speciesKey; const e=essenceByKey(k); if(!byE[k]) byE[k]={k,n:e?e.n:(l.speciesName||'Grume'),count:0,vol:0,mob:0}; byE[k].count++; byE[k].vol+=l.volumeM3||0; if(mob.has(l.id)) byE[k].mob+=l.volumeM3||0; });
  const essences=Object.values(byE).sort((a,b)=>b.vol-a.vol);
  const rows=fit.map(r=>{ const selected=sel.has(r.p.k);
    const freeAdapted=r.logs.filter(l=>!mob.has(l.id));
    let state, count, vol, species, al=null;
    if(selected){ al=A.alloc[r.p.k]||{want:1,got:0,logs:[],vol:0,unit:'pièce'};
      state='selected'; count=al.logs.length; vol=al.vol;
      species=[...new Set(al.logs.map(c=>{const e=essenceByKey(c.l.speciesKey);return e?e.n:'';}).filter(Boolean))]; }
    else if(freeAdapted.length){ state='feasible'; count=freeAdapted.length; vol=freeAdapted.reduce((a,l)=>a+(l.volumeM3||0),0); species=[...new Set(freeAdapted.map(l=>{const e=essenceByKey(l.speciesKey);return e?e.n:'';}).filter(Boolean))]; }
    else if(r.logs.length){ state='blocked'; count=0; vol=0; species=[]; }
    else { state='none'; count=0; vol=0; species=[]; }
    return {p:r.p, state, count, vol, species, hint:r.hint, al};
  });
  return { count:stock.length, totalVol, mobVol, freeVol:totalVol-mobVol, feasible:fit.filter(r=>r.ok).length, selCount:sel.size, essences, rows, maxVol:Math.max(0.001,...essences.map(e=>e.vol)), stillFeasible:rows.filter(r=>r.state==='feasible').length };
}
function renderWoodDashboard(){
  const b=$('wfBody');
  if(!(STORE.woodStock||[]).length){ b.innerHTML='<div class="empty">Ajoute des grumes au stock (ou charge le jeu d’essai) pour voir le tableau de bord.</div>'; return; }
  const d=woodDashboardData();
  const kpi=(v,l)=>'<div class="kpi"><div class="kpi-v">'+v+'</div><div class="kpi-l">'+l+'</div></div>';
  let html='<div class="kpi-grid">'+kpi(d.count,'grumes')+kpi(d.totalVol.toFixed(2)+' m³','volume total')+kpi(d.feasible,'projets réalisables')+kpi(d.selCount,'projets choisis')+'</div>';
  if(d.selCount){ html+='<div class="plan-sum"><span class="ps-a">Ta sélection : '+d.mobVol.toFixed(2)+' m³ mobilisés</span><span class="ps-b">'+d.freeVol.toFixed(2)+' m³ libres · '+d.stillFeasible+' projet'+(d.stillFeasible>1?'s':'')+' encore faisable'+(d.stillFeasible>1?'s':'')+'</span></div>'; }
  // stock par essence
  html+='<div class="dash-h">Stock par essence</div><div class="stockbars">';
  d.essences.forEach(e=>{ const w=Math.round(e.vol/d.maxVol*100); const mw=e.vol>0?Math.round(e.mob/e.vol*w):0;
    html+='<div class="sb-row"><span class="sb-name">'+esc(e.n)+'</span><span class="sb-track"><span class="sb-bar" style="width:'+w+'%;background:'+essColor(e.k)+'"><span class="sb-mob" style="width:'+mw+'%"></span></span></span><span class="sb-val">'+e.count+' · '+e.vol.toFixed(2)+' m³</span></div>';
  });
  html+='</div>';
  // projets cochables
  html+='<div class="dash-h">Projets — coche ceux que tu veux réaliser</div><div class="psel">';
  d.rows.forEach(r=>{ const on=r.state==='selected';
    let sub, qtyBar='';
    if(r.state==='selected'){ const al=r.al;
      sub=r.count+' grume'+(r.count>1?'s':'')+' · '+r.vol.toFixed(2)+' m³ utilisés · '+esc(r.species.join(', '));
      const short=al.got<al.want;
      qtyBar='<div class="psel-qty"><button class="pq-btn" data-qm="'+r.p.k+'" aria-label="moins">−</button>'+
        '<input class="pq-in" data-qi="'+r.p.k+'" type="number" inputmode="numeric" min="1" max="999" value="'+al.want+'">'+
        '<button class="pq-btn" data-qp="'+r.p.k+'" aria-label="plus">+</button>'+
        '<span class="pq-lbl">'+esc(al.unit)+(al.want>1?'s':'')+' voulue'+(al.want>1?'s':'')+'</span>'+
        '<span class="pq-got'+(short?' warn':'')+'">'+(short?('stock : ≈ '+al.got+' max'):('≈ '+al.got+' possible'+(al.got>1?'s':'')))+'</span></div>';
    }
    else if(r.state==='feasible') sub='Réalisable : '+r.count+' grume'+(r.count>1?'s':'')+' · '+r.vol.toFixed(2)+' m³ dispo';
    else if(r.state==='blocked') sub='Grumes déjà réservées par tes constructions';
    else sub=r.hint||'Aucune grume adaptée';
    html+='<div class="psel-row '+r.state+'"><button class="psel-chk'+(on?' on':'')+'" data-sel="'+r.p.k+'" aria-label="choisir">'+(on?'✓':'')+'</button>'+
      '<div class="psel-body"><button class="psel-main" data-proj="'+r.p.k+'"><span class="psel-ic">'+r.p.ic+'</span><span class="psel-mid"><span class="psel-n">'+esc(r.p.n)+'</span><span class="psel-s">'+esc(sub)+'</span></span><span class="pr-go">Dossier ›</span></button>'+qtyBar+'</div></div>';
  });
  html+='</div>';
  b.innerHTML=html;
  b.querySelectorAll('[data-sel]').forEach(x=>x.onclick=()=>{ toggleWoodPlan(x.dataset.sel); renderWoodDashboard(); });
  b.querySelectorAll('[data-proj]').forEach(x=>x.onclick=()=>openWoodProjectDoc(x.dataset.proj));
  b.querySelectorAll('[data-qm]').forEach(x=>x.onclick=()=>{ setWoodQty(x.dataset.qm, woodQty(x.dataset.qm)-1); renderWoodDashboard(); });
  b.querySelectorAll('[data-qp]').forEach(x=>x.onclick=()=>{ setWoodQty(x.dataset.qp, woodQty(x.dataset.qp)+1); renderWoodDashboard(); });
  b.querySelectorAll('[data-qi]').forEach(x=>x.onchange=()=>{ setWoodQty(x.dataset.qi, x.value); renderWoodDashboard(); });
}
/* ---- dossier projet : pièce visée, plan de coupe, rendement, guide ---- */
const DEBIT_LBL={plots:'Sciage en plots (planches parallèles)',equarri:'Équarrissage (poutre carrée)',avive:'Avivé / délignage (sections)',fendage:'Fendage radial (à la masse)',buche:'Tronçonnage + fendage'};
const WOOD_DOC={
  charpente:{intro:'Transformer une grosse grume droite en poutre porteuse à section carrée.',piece:'Poutre équarrie',section:'12×12 à 20×20 cm',long:'2 à 4 m',essences:'Chêne, douglas, mélèze, épicéa',debit:'equarri',y:{type:'equarri',params:{s:12},unit:'poutre'},
    guide:['Caler la grume, repérer la face la plus droite.','Tracer un carré centré sur le cœur, côté ≈ Ø × 0,7.','Retirer les 4 dosses (arrondis) à la tronçonneuse ou scie mobile.','Dresser les faces au trait, vérifier l’équerre et l’aplomb.','Chanfreiner les arêtes pour limiter les fentes.'],
    outils:['Tronçonneuse ou scie mobile','Cordeau + équerre','Coins & masse'],sechage:'≈ 1 an/cm à l’air, sous abri ventilé. Une fente à cœur est normale.',securite:'EPI anti-coupure complet, grume calée, gare au rebond en bout de barre.',astuce:'Cœur bien centré = poutre qui travaille symétrique et reste droite.'},
  ossature:{intro:'Débiter une grume en montants et chevrons pour une ossature ou un abri.',piece:'Montant / chevron',section:'6×8 à 8×10 cm',long:'2 à 3 m',essences:'Douglas, épicéa, pin, châtaignier',debit:'avive',y:{type:'avive',params:{w:8,h:8},unit:'montant'},
    guide:['Équarrir d’abord la grume (voir Charpente).','Tracer une trame de sections sur le bout.','Refendre en planches épaisses, puis déligner en montants.','Contrôler la section à chaque pièce.'],
    outils:['Tronçonneuse + guide de délignage','Scie circulaire de charpente','Réglet'],sechage:'6 mois à 1 an sous abri, empilé sur liteaux et cerclé pour rester droit.',securite:'Serre-joints, appuis stables, lame adaptée à l’épaisseur.',astuce:'Numérote les pièces d’un même abri : tu retrouves l’ordre au montage.'},
  bardage:{intro:'Scier des planches minces pour habiller une façade.',piece:'Planche / clin',section:'ép. 18–22 mm, larg. ≈ Ø',long:'selon grume',essences:'Douglas, mélèze, châtaignier, chêne (durables)',debit:'plots',y:{type:'plots',params:{t:20},unit:'planche'},
    guide:['Dérouler la grume en plots (sciage de fil en fil).','Refendre les plots en planches de 18–22 mm.','Déligner des rives parallèles.','Poser ventilé, avec un jour de dilatation.'],
    outils:['Scierie mobile ou tronçonneuse + cadre','Rabot','Serre-joints'],sechage:'Viser ≈ 18 % d’humidité. Lame d’air derrière le bardage obligatoire.',securite:'Planche mince = projections : poussée régulière, mains éloignées.',astuce:'Pose en clin (recouvrement) ou couvre-joint pour l’étanchéité pluie.'},
  terrasse:{intro:'Débiter des lames épaisses pour un platelage extérieur.',piece:'Lame de terrasse',section:'ép. 22–27 mm, larg. 12–14 cm',long:'selon grume',essences:'Douglas, mélèze, robinier, châtaignier (durables)',debit:'plots',y:{type:'plots',params:{t:24},unit:'lame'},
    guide:['Scier en plots épais.','Déligner des lames de 12–14 cm, 22–27 mm.','Casser les arêtes, pré-percer les fixations.','Poser sur lambourdes, pente 1–2 %, jour de 5 mm.'],
    outils:['Scierie mobile','Rabot / ponceuse','Perceuse + fraise'],sechage:'Séchage partiel toléré (extérieur), mais pré-percer contre les fentes.',securite:'Bois lourd et humide : gestes de levage, gants.',astuce:'Cœur (dosse) vers le bas : la lame tuile moins vers le haut.'},
  piquet:{intro:'Refendre une grume durable en piquets de clôture.',piece:'Piquet fendu',section:'≈ 8–10 cm, pointe',long:'1,5 à 2 m',essences:'Robinier, châtaignier, chêne (cœur durable)',debit:'fendage',y:{type:'fendage',params:{d:8},unit:'piquet'},
    guide:['Tronçonner à longueur (1,5–2 m).','Fendre radialement à la masse et aux coins.','Refendre chaque quartier jusqu’à ≈ 8 cm.','Tailler une pointe, retirer l’aubier.'],
    outils:['Masse + coins (ou merlin)','Tronçonneuse','Serpe / plane'],sechage:'Robinier/châtaignier utilisables verts. Garde le cœur, l’aubier pourrit.',securite:'Coins qui sautent : lunettes obligatoires, mains hors de la fente.',astuce:'Brûler légèrement le pied enterré prolonge la tenue en terre.'},
  planche:{intro:'Débiter une bille en planches de menuiserie.',piece:'Planche',section:'ép. 27 mm, larg. ≈ Ø',long:'selon grume',essences:'Chêne, hêtre, frêne, pin, épicéa',debit:'plots',y:{type:'plots',params:{t:27},unit:'planche'},
    guide:['Débit sur dosse (rapide) ou sur quartier (stable).','Scier en planches régulières de 27 mm.','Déligner les flaches, marquer l’ordre des planches.','Empiler sur liteaux dès la sortie de scie.'],
    outils:['Scierie mobile / chevalet','Rabot-dégau (finition)','Liteaux de séchage'],sechage:'≈ 1 an/cm à l’air : 27 mm ≈ 2–3 ans, puis finition intérieure.',securite:'Poussée régulière, écarteur derrière la lame contre le pincement.',astuce:'Le débit « sur quartier » (mailles) bouge le moins : idéal meuble.'},
  meuble:{intro:'Sortir de beaux plateaux épais d’une bille noble.',piece:'Plateau',section:'ép. 40–54 mm, larg. max',long:'selon usage',essences:'Noyer, merisier, chêne, frêne, hêtre',debit:'plots',y:{type:'plots',params:{t:45},unit:'plateau'},
    guide:['Repérer la plus belle face (fil, ronce).','Débit en plots épais (40–54 mm), garder l’ordre (livre ouvert).','Laisser sécher « en plot ».','Dresser seulement au moment de l’usinage.'],
    outils:['Scierie mobile','Dégauchisseuse / raboteuse','Humidimètre'],sechage:'Long : ≈ 1 an/cm + finition en atelier chauffé. Patience = stabilité.',securite:'Charges lourdes ; usiner un bois bien sec, protections.',astuce:'Garde les plateaux consécutifs : assortiment parfait pour un plateau de table.'},
  manche:{intro:'Fendre du bois dur pour des ébauches de manches d’outils.',piece:'Ébauche de manche',section:'≈ 4×4 cm',long:'30 à 90 cm',essences:'Frêne, charme, robinier, cormier',debit:'fendage',y:{type:'fendage',params:{d:4},unit:'ébauche'},
    guide:['Tronçonner à longueur.','Fendre (pas scier) pour suivre le fil : le manche ne casse pas.','Dégrossir au plane / à la hachette.','Finir à la râpe, sécher avant ponçage fin.'],
    outils:['Coins / merlin','Plane (draw knife)','Râpe & cale à poncer'],sechage:'Fendu vert, séchage 6–12 mois. Un manche reste légèrement souple.',securite:'Plane vers l’extérieur, pièce serrée à l’étau/valet.',astuce:'Tronçon au fil droit, sans nœud : 90 % de la solidité.'},
  chauffage:{intro:'Tronçonner et fendre en bûches calibrées, prêtes à sécher.',piece:'Bûche',section:'Ø ≈ 8–12 cm',long:'25, 33 ou 50 cm',essences:'Charme, hêtre, chêne, robinier (feuillus denses)',debit:'buche',y:{type:'buche',params:{len:33},unit:'bûche'},
    guide:['Tronçonner en rondins à la longueur du foyer (25/33/50 cm).','Fendre en quartiers de 8–12 cm.','Empiler à l’abri de la pluie, faces au vent.','Attendre le séchage avant de brûler.'],
    outils:['Tronçonneuse','Fendeuse ou merlin','Abri / palette de stockage'],sechage:'≥ 18–24 mois pour < 20 % d’humidité. Bois vert = peu de chaleur + encrassement.',securite:'Chevalet stable ; jamais tenir le rondin à la main.',astuce:'1 stère de charme ≈ 1 800–2 000 kWh : les feuillus denses chauffent le plus.'},
  barriere:{intro:'Clôturer un paddock avec des lisses en bois fendu : plus durables que sciées, car le fil du bois est suivi.',piece:'Lisse fendue + poteau',section:'demi-rond Ø 11-14 cm (lisse) · 14×14 (poteau)',long:'3 à 4 m (lisse) · 2,2 m (poteau)',essences:'Robinier, châtaignier, chêne',debit:'fendage',y:{type:'fendage',params:{d:11},unit:'lisse'},
    guide:['Choisir des grumes droites, à fil régulier, sans nœuds traversants.','Fendre en deux à la masse et aux coins, en suivant une fente amorcée au départoir.','Écorcer à la plane : l’aubier écorcé sèche vite et prend moins l’eau.','Tailler les poteaux en pointe côté pied ; garder 60-70 cm à enterrer.','Percer ou entailler les poteaux pour recevoir les lisses (mortaise traversante).'],
    outils:['Masse & coins','Départoir','Plane & chevalet','Tarière'],sechage:'Lisses posées vertes acceptées : le bois fendu travaille peu. Poteaux : 6 mois sous abri si possible.',securite:'Fendage : jambes de part et d’autre, jamais dans l’axe des coins qui peuvent gicler.',astuce:'Le robinier tient 25-40 ans en terre sans aucun traitement : garde-le pour les poteaux.'},
  ratelier:{intro:'Un râtelier à foin surélevé, au sec, qui évite le gaspillage et respecte l’encolure des chevaux.',piece:'Montant + barreau',section:'6×6 cm (montants) · Ø 4 cm (barreaux)',long:'1,6 m (montants) · 0,9 m (barreaux)',essences:'Chêne, châtaignier, robinier, douglas',debit:'avive',y:{type:'avive',params:{w:6,h:6},unit:'montant'},
    guide:['Équarrir puis déligner les montants 6×6.','Façonner les barreaux au rabot (octogone puis rond) ou les fendre dans du frêne.','Percer les traverses hautes et basses à la tarière Ø 4, tous les 28 cm.','Emmancher les barreaux inclinés (~15°) : le cheval tire le foin sans se cogner.','Assembler le cadre à tenons-mortaises chevillés, hors sol sur patins.'],
    outils:['Tarière Ø 4','Scie & rabot','Bédane & maillet','Chevilles bois'],sechage:'Bois mi-sec (6 mois) : les emmanchements se resserrent en finissant de sécher.',securite:'Aucune pointe ni vis saillante côté animal ; arrondir tous les angles.',astuce:'Espace les barreaux de 28-30 cm : assez pour tirer le foin, trop peu pour y passer un sabot.'},
  ruche:{intro:'Un corps de ruche en planches de 27 mm, sans traitement ni colle toxique : seules la cire et la propolis protégeront l’intérieur.',piece:'Planche calibrée',section:'27 mm d’épaisseur',long:'0,54 m (côtés) · 0,45 m (faces)',essences:'Peuplier, pin, épicéa (léger et sain)',debit:'plots',y:{type:'plots',params:{t:27},unit:'planche'},
    guide:['Scier en plots à 30 mm, sécher, puis raboter à 27 mm exactement.','Déligner aux cotes du corps (Dadant 10 : 45×54 cm hors tout).','Assembler les angles à queues droites collées à la colle chaude d’os ou chevillées.','Creuser la feuillure haute qui recevra les cadres (retrait 17 mm).','Ne rien traiter à l’intérieur ; à l’extérieur, peinture suédoise ou huile de lin.'],
    outils:['Scie fine','Rabot','Guimbarde (feuillure)','Serre-joints'],sechage:'Impératif : bois sec à 15 % avant usinage, sinon les joints s’ouvrent.',securite:'Cotes internes précises au mm : trop d’espace = constructions sauvages, trop peu = cadres collés.',astuce:'Flambe légèrement l’intérieur à la flamme : les abeilles adorent, et ça assainit.'},
  abribois:{intro:'Un appentis ouvert, dos au vent de pluie, où le bois de chauffage sèche en un été.',piece:'Poteau + panne',section:'7×7 cm',long:'2,2 m (avant) · 1,8 m (arrière)',essences:'Douglas, mélèze, châtaignier, chêne',debit:'avive',y:{type:'avive',params:{w:7,h:7},unit:'poteau'},
    guide:['Équarrir les poteaux 7×7 ; deux hauteurs pour la pente (30 % mini).','Poser chaque poteau sur une pierre plate ou un plot : jamais de bois en terre.','Relier par pannes et contreventer par écharpes à 45° (assemblage à mi-bois).','Couvrir léger : tôle, bardeaux ou tavaillons maison.','Plancher à claire-voie surélevé de 10 cm pour l’air.'],
    outils:['Scie','Ciseau & maillet','Niveau & cordeau','Tarière'],sechage:'Structure en bois mi-sec acceptée ; éviter le bois vert pour les écharpes.',securite:'Ancrer contre le vent (équerres ou piquets) : un appentis léger s’envole.',astuce:'Oriente l’ouverture au soleil levant et le dos aux pluies dominantes : séchage deux fois plus rapide.'},
  poulailler:{intro:'Une caisse saine et démontable : l’hygiène d’un poulailler tient à ce qu’on peut nettoyer.',piece:'Planche',section:'20 mm',long:'0,8 à 1,2 m',essences:'Peuplier, pin, épicéa',debit:'plots',y:{type:'plots',params:{t:20},unit:'planche'},
    guide:['Scier en plots à 23 mm, sécher, raboter à 20 mm.','Monter une caisse sur pieds (60 cm du sol) à panneaux vissés démontables.','Percer les perchoirs Ø 4-5 en frêne ou charme, plus hauts que les pondoirs.','Faire un tiroir à déjections sous les perchoirs (nettoyage en une minute).','Grillager les aérations hautes ; trappe à coulisse au sud.'],
    outils:['Scie','Rabot','Visserie inox','Grillage'],sechage:'Bois sec (l’humidité plus les fientes = pourriture éclair).',securite:'Aucun traitement chimique à l’intérieur ; badigeon de chaux, c’est tout.',astuce:'Perchoirs amovibles posés sur encoches : tu les sors et les flambes contre les poux rouges.'},
  portail:{intro:'Une barrière de prairie à cadre chevillé et écharpe : la diagonale fait toute la rigidité.',piece:'Traverse / montant',section:'4×9 cm',long:'1 à 3,5 m',essences:'Chêne, douglas, mélèze, châtaignier',debit:'avive',y:{type:'avive',params:{w:4,h:9},unit:'traverse'},
    guide:['Déligner montants et traverses 4×9.','Assembler le cadre à tenons-mortaises chevillés bois (pas de vis porteuses).','Poser l’écharpe en diagonale DEPUIS le gond bas VERS le coin opposé haut : elle travaille en compression.','Chanfreiner le dessus des traverses (l’eau file).','Ferrer : gonds scellés au poteau, jeu de 10 mm au sol.'],
    outils:['Scie & bédane','Tarière & chevilles','Serre-joints','Gonds'],sechage:'Bois sec pour le cadre ; une barrière verte se voile en une saison.',securite:'Poteau de gond massif (20×20) scellé profond : tout le poids porte dessus.',astuce:'La cheville en bois sec dans un avant-trou de bois mi-sec se bloque définitivement en séchant.'},
  echelle:{intro:'L’échelle traditionnelle se FEND, ne se scie pas : le fil continu du frêne fait des montants quasi incassables.',piece:'Montant + barreau',section:'4×6 cm (montants) · Ø 3,2 (barreaux)',long:'2 à 4 m',essences:'Frêne (le roi), robinier, charme (barreaux)',debit:'avive',y:{type:'avive',params:{w:4,h:6},unit:'montant'},
    guide:['Fendre la grume de frêne en quartiers, dégauchir à la plane : le fil ne doit jamais être tranché.','Amincir les montants vers le haut (4×6 en pied, 4×4,5 en tête).','Percer les montants Ø 3,2 tous les 28 cm, en vis-à-vis parfait (gabarit).','Tourner ou fendre les barreaux ; queue légèrement conique.','Emmancher à refus, puis bloquer chaque barreau par un petit coin de bois dur dans son bout fendu.'],
    outils:['Coins & masse','Plane & chevalet','Tarière Ø 32','Maillet'],sechage:'Montants mi-secs, barreaux très secs : en finissant de sécher, le montant se resserre sur le barreau.',securite:'Test avant usage : l’échelle à plat sur cales, monte au milieu. Elle doit plier, jamais craquer.',astuce:'Le coin dans le bout du barreau (comme un manche de hache) rend l’assemblage indémontable.'},
  banc:{intro:'Le banc rustique : un plateau massif en dosse et quatre pieds fendus emmanchés — zéro vis, un siècle de service.',piece:'Plateau (dosse épaisse)',section:'45 mm',long:'1,2 à 2 m',essences:'Chêne, châtaignier (dehors) · hêtre, noyer (dedans)',debit:'plots',y:{type:'plots',params:{t:45},unit:'plateau'},
    guide:['Scier le plateau à 50 mm, sécher, dresser à 45 mm en gardant si tu veux une rive naturelle.','Fendre les pieds dans du bois droit, dégrossir à la plane en léger cône.','Percer le plateau par-dessous à la tarière, incliné de 10-12° vers l’extérieur.','Emmancher les pieds à refus, bouts fendus d’un trait de scie : glisser un coin (queue de renard).','Araser les pieds au plateau posé sur sol plat ; huile de lin chaude en finition.'],
    outils:['Tarière Ø 35-40','Plane','Scie','Coins & maillet'],sechage:'Plateau : un an par tranche de 25 mm. Pieds secs dans plateau mi-sec = serrage naturel.',securite:'Pieds inclinés dans les DEUX sens (10° × 10°) sinon le banc bascule.',astuce:'La « queue de renard » (tenon fendu + coin) est l’assemblage des bancs d’église : increvable.'},
  tavaillon:{intro:'Le tavaillon est une tuile de bois FENDUE au départoir : les fibres intactes font glisser l’eau pendant 50 ans.',piece:'Tavaillon fendu',section:'10-12 mm d’épaisseur · 8-14 cm de large',long:'0,40 m',essences:'Châtaignier, chêne, robinier (mélèze en montagne)',debit:'fendage',y:{type:'fendage',params:{d:6},unit:'tavaillon'},
    guide:['Tronçonner des rondins de 40 cm SANS nœuds.','Fendre en quartiers, retirer cœur et aubier.','Au départoir frappé au maillet, lever des lames de 10-12 mm en suivant le rayon.','Affiner et biseauter le talon à la plane sur le chevalet.','Poser en triple recouvrement (chaque rang couvre les deux tiers du précédent), deux pointes inox par tavaillon.'],
    outils:['Départoir','Maillet','Plane & chevalet','Tronçonneuse'],sechage:'Se pose vert ou ressuyé : il finit de sécher cloué, en se plaquant.',securite:'Départoir : main derrière le fil, jamais devant ; gants épais.',astuce:'Ne rabote JAMAIS un tavaillon en pleine face : c’est la surface fendue brute qui fait l’étanchéité.'},
  passerelle:{intro:'Franchir un fossé avec deux poutres équarries à la hache, comme les charpentiers de rivière.',piece:'Poutre équarrie',section:'16×16 cm minimum',long:'2,5 à 4 m',essences:'Chêne, douglas, mélèze, robinier',debit:'equarri',y:{type:'equarri',params:{s:16},unit:'poutre'},
    guide:['Tracer l’équarrissage à la ligne (cordeau enduit) sur la grume calée.','Entailler à la hache tous les 20 cm jusqu’au trait, puis abattre les dosses — ou scier.','Poser les deux poutres sur des culées en pierres plates, 30 cm au-dessus des hautes eaux.','Cheviller un platelage en planches épaisses (27-34 mm), 8 mm d’écart pour l’eau.','Ajouter une main courante au-delà de 50 cm de haut.'],
    outils:['Hache de charpentier','Cordeau à tracer','Tarière & chevilles','Niveau'],sechage:'Poutres posées ressuyées ; le platelage sec.',securite:'JAMAIS de bois en contact avec la terre : pierre en interface. Vérifie la portance (16×16 chêne ≈ 400 kg sur 3 m).',astuce:'L’équarrissage à la hache laisse des facettes qui évacuent l’eau mieux qu’une face sciée lisse.'}
};
function debitYield(type,params,l){ const D=l.diamCm||0, L=l.lengthCm||0, side=D*0.707;
  if(type==='plots') return Math.max(0,Math.floor(D*10*0.8/params.t));
  if(type==='equarri') return side>=params.s?1:0;
  if(type==='avive') return Math.max(0,Math.floor(side/params.w)*Math.floor(side/params.h));
  if(type==='fendage') return Math.max(1,Math.floor((D/params.d)*(D/params.d)*0.55));
  if(type==='buche'){ const rounds=Math.max(1,Math.floor(L/params.len)); return rounds*Math.max(1,Math.round((D/12)*(D/12))); }
  return 0;
}
function debitSVG(type){ const c='#7C5A34', bg='#EFE6D6', ln='#3F5E4E';
  let inner='';
  if(type==='plots'){ for(let y=18;y<=102;y+=13) inner+='<line x1="12" y1="'+y+'" x2="108" y2="'+y+'" stroke="'+ln+'" stroke-width="1.6"/>'; }
  else if(type==='equarri'){ inner='<rect x="22" y="22" width="76" height="76" fill="none" stroke="'+ln+'" stroke-width="2.4"/>'; }
  else if(type==='avive'){ for(let i=0;i<=3;i++){ const p=22+i*25.3; inner+='<line x1="'+p.toFixed(1)+'" y1="22" x2="'+p.toFixed(1)+'" y2="98" stroke="'+ln+'" stroke-width="1.5"/><line x1="22" y1="'+p.toFixed(1)+'" x2="98" y2="'+p.toFixed(1)+'" stroke="'+ln+'" stroke-width="1.5"/>'; } }
  else if(type==='fendage'){ for(let a=0;a<180;a+=45){ const r=a*Math.PI/180,dx=54*Math.cos(r),dy=54*Math.sin(r); inner+='<line x1="'+(60-dx).toFixed(1)+'" y1="'+(60-dy).toFixed(1)+'" x2="'+(60+dx).toFixed(1)+'" y2="'+(60+dy).toFixed(1)+'" stroke="'+ln+'" stroke-width="1.6"/>'; } }
  else if(type==='buche'){ inner='<line x1="60" y1="8" x2="60" y2="112" stroke="'+ln+'" stroke-width="1.6"/><line x1="8" y1="60" x2="112" y2="60" stroke="'+ln+'" stroke-width="1.6"/>'; }
  return '<svg class="debitsvg" viewBox="0 0 120 120" width="118" height="118" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="'+bg+'" stroke="'+c+'" stroke-width="2.6"/>'+inner+'<circle cx="60" cy="60" r="3.2" fill="'+c+'"/></svg>';
}
/* ---- plans détaillés de construction (mise en pratique) ---- */
const PRECISION_BASE=[
  'Marque une face de référence + un chant de référence sur chaque pièce (repère ✓ du menuisier).',
  'Dresse la face de référence (droite et plane), puis mets d’épaisseur parallèle : pièces calibrées.',
  'Trace toujours depuis les faces de référence, au trait fin, et scie côté chute du trait.',
  'Contrôle l’équerre et la planéité à chaque étape — un défaut se corrige tôt, jamais à la fin.',
  'Assemblages : vise ±0,5 mm, ajuste au ciseau affûté ou au rabot ; serré « à la main », sans forcer.',
  'Ponce dans le fil, grains croissants (80 → 120 → 180), sans arrondir les arêtes utiles.'
];
function stackSVG(){ let c=''; for(let r=0;r<5;r++){ for(let i=0;i<6;i++){ c+='<circle cx="'+(80+i*20)+'" cy="'+(48+r*20)+'" r="9" fill="#EFE6D6" stroke="#2A2520" stroke-width="1.2"/>'; } }
  return '<svg class="plansvg" viewBox="0 0 300 170"><rect x="66" y="30" width="128" height="112" fill="none" stroke="#2A2520" stroke-width="2.4"/>'+c+'<g stroke="#A4572F" stroke-width="1"><line x1="212" y1="30" x2="212" y2="142"/><line x1="208" y1="30" x2="216" y2="30"/><line x1="208" y1="142" x2="216" y2="142"/></g><text x="230" y="90" fill="#6E6253" font-family="monospace" font-size="9">1,00 m</text><text x="130" y="164" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="10">1 stère = 1×1×1 m · bûches 0,33 m</text></svg>'; }
const WOOD_PLAN={
  charpente:{build:'Ferme de comble',dims:'Portée 4,00 m · pente ≈ 45 %',
    plan:'<svg class="plansvg" viewBox="0 0 300 170"><polygon points="30,130 270,130 150,45" fill="#EFE6D6" stroke="#2A2520" stroke-width="2.4" stroke-linejoin="round"/><g stroke="#2A2520" stroke-width="2.2"><line x1="150" y1="130" x2="150" y2="45"/><line x1="92" y1="130" x2="150" y2="88"/><line x1="208" y1="130" x2="150" y2="88"/></g><g stroke="#A4572F" stroke-width="1"><line x1="30" y1="150" x2="270" y2="150"/><line x1="30" y1="146" x2="30" y2="154"/><line x1="270" y1="146" x2="270" y2="154"/></g><text x="150" y="163" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="10">entrait 4,00 m</text><text x="153" y="70" fill="#6E6253" font-family="monospace" font-size="9">poinçon</text><text x="60" y="118" fill="#6E6253" font-family="monospace" font-size="9">arbalétrier</text></svg>',
    cutlist:[{p:'Arbalétrier',sec:'8×15',l:'2,40 m',q:2},{p:'Entrait',sec:'8×18',l:'4,10 m',q:1},{p:'Poinçon',sec:'8×12',l:'1,10 m',q:1},{p:'Contrefiche',sec:'8×10',l:'1,20 m',q:2}],
    joint:{name:'Tenon-mortaise chevillé + embrèvement',desc:'Pied d’arbalétrier embrevé dans l’entrait ; assemblages tenon-mortaise chevillés (cheville chêne Ø14).'},
    assembly:['Tailler entrait, arbalétriers et poinçon aux longueurs d’épure.','Exécuter mortaises et tenons, ajuster à blanc au sol.','Percer et poser les chevilles, contrôler l’équerre de la ferme.','Lever la ferme, contreventer avant fixation définitive.'],
    precision:['Épure au sol : trace la ferme grandeur nature sur une aire plane pour reporter angles et longueurs exacts.']},
  ossature:{build:'Pan de mur ossature',dims:'2,50 × 2,40 m · montants entraxe ≈ 0,60 m',
    plan:'<svg class="plansvg" viewBox="0 0 300 170"><rect x="30" y="30" width="240" height="110" fill="#EFE6D6" stroke="#2A2520" stroke-width="2.4"/><g stroke="#2A2520" stroke-width="2.2"><line x1="78" y1="30" x2="78" y2="140"/><line x1="126" y1="30" x2="126" y2="140"/><line x1="174" y1="30" x2="174" y2="140"/><line x1="222" y1="30" x2="222" y2="140"/></g><line x1="30" y1="85" x2="270" y2="85" stroke="#2A2520" stroke-width="1.6" stroke-dasharray="5 4"/><g stroke="#A4572F" stroke-width="1"><line x1="30" y1="152" x2="270" y2="152"/><line x1="30" y1="148" x2="30" y2="156"/><line x1="270" y1="148" x2="270" y2="156"/></g><text x="150" y="164" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="10">2,50 m — entraxe ≈ 0,60 m</text><text x="34" y="26" fill="#6E6253" font-family="monospace" font-size="9">lisses haute &amp; basse</text></svg>',
    cutlist:[{p:'Lisse haute & basse',sec:'6×8',l:'2,50 m',q:2},{p:'Montant',sec:'6×8',l:'2,28 m',q:5},{p:'Entretoise',sec:'6×8',l:'0,54 m',q:4}],
    joint:{name:'Vissage en about + équerres',desc:'Montants vissés en about dans les lisses (2 vis 6×120) ou entaillés ; équerres métalliques en angle.'},
    assembly:['Couper lisses et montants à longueur (butée, pas de mesure répétée).','Répartir les montants à l’entraxe, équerrer le cadre.','Visser en about, poser les entretoises à mi-hauteur.','Diagonale = diagonale : cadre d’équerre avant de contreventer.'],
    precision:['Toutes les pièces de même rôle à la même longueur exacte : c’est la butée qui garantit l’équerrage, pas le mètre.']},
  bardage:{build:'Bardage à clins horizontaux',dims:'Recouvrement 2 cm · lame d’air 2 cm',
    plan:'<svg class="plansvg" viewBox="0 0 300 170"><line x1="58" y1="15" x2="58" y2="155" stroke="#2A2520" stroke-width="2.4"/><rect x="70" y="15" width="8" height="140" fill="#EFE6D6" stroke="#2A2520" stroke-width="1.6"/><g fill="#EFE6D6" stroke="#2A2520" stroke-width="1.8"><rect x="86" y="30" width="150" height="20"/><rect x="86" y="52" width="150" height="20"/><rect x="86" y="74" width="150" height="20"/><rect x="86" y="96" width="150" height="20"/><rect x="86" y="118" width="150" height="20"/></g><g stroke="#A4572F" stroke-width="1"><line x1="58" y1="140" x2="86" y2="140"/></g><text x="58" y="12" fill="#6E6253" font-family="monospace" font-size="9">mur</text><text x="64" y="150" fill="#6E6253" font-family="monospace" font-size="9">tasseau</text><text x="150" y="164" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="10">lame d’air 20 mm · recouvrement 20 mm</text></svg>',
    cutlist:[{p:'Tasseau vertical',sec:'27×40',l:'2,40 m',q:6},{p:'Clin',sec:'20×135',l:'selon mur',q:'—'},{p:'Grille anti-rongeur',sec:'—',l:'bas de mur',q:1}],
    joint:{name:'Pose à clin vissée (inox)',desc:'Chaque clin recouvre le précédent de 2 cm, vissé sur les tasseaux — jamais à travers deux lames (le bois doit pouvoir bouger).'},
    assembly:['Poser un pare-pluie, puis les tasseaux verticaux d’aplomb.','Fixer une grille anti-rongeur en pied de mur.','Poser les clins du bas vers le haut, avec une cale de recouvrement.','Contrôler l’horizontalité tous les 4–5 rangs.'],
    precision:['Une cale-gabarit de recouvrement donne le même jour et la même ligne partout, sans mesurer.']},
  terrasse:{build:'Terrasse sur lambourdes',dims:'Entraxe 40 cm · jour 5 mm · pente 1,5 %',
    plan:'<svg class="plansvg" viewBox="0 0 300 170"><g stroke="#2A2520" stroke-width="1.6" stroke-dasharray="6 4"><line x1="55" y1="25" x2="55" y2="150"/><line x1="115" y1="25" x2="115" y2="150"/><line x1="175" y1="25" x2="175" y2="150"/><line x1="235" y1="25" x2="235" y2="150"/></g><g fill="#EFE6D6" stroke="#2A2520" stroke-width="1.6"><rect x="30" y="30" width="240" height="15"/><rect x="30" y="49" width="240" height="15"/><rect x="30" y="68" width="240" height="15"/><rect x="30" y="87" width="240" height="15"/><rect x="30" y="106" width="240" height="15"/><rect x="30" y="125" width="240" height="15"/></g><text x="150" y="163" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="10">lames (—) · lambourdes (··) entraxe 40 cm</text></svg>',
    cutlist:[{p:'Lambourde',sec:'40×60',l:'selon plots',q:'—'},{p:'Lame',sec:'24×135',l:'selon plan',q:'—'},{p:'Plot / cale de réglage',sec:'—',l:'sous lambourdes',q:'—'}],
    joint:{name:'Vissage inox en tête',desc:'2 vis inox pré-percées par croisement lame/lambourde, tête fraisée. Bois de bout jamais au ras du sol.'},
    assembly:['Régler les lambourdes de niveau avec la pente 1,5 %, entraxe 40 cm.','Commencer par une lame de rive, gabarit de jour de 5 mm.','Visser chaque croisement (2 vis), pré-perçage obligatoire.','Aligner les abouts, couper la rive en fin de pose à la règle.'],
    precision:['Règle + niveau à chaque lame : 1,5 % de pente régulière, aucune lame ne doit retenir l’eau.']},
  piquet:{build:'Clôture 3 lisses',dims:'Poteaux ts 2,50 m · H 1,20 m · enterré 0,50 m',
    plan:'<svg class="plansvg" viewBox="0 0 300 170"><g stroke="#2A2520" stroke-width="2.6"><line x1="50" y1="40" x2="50" y2="140"/><line x1="150" y1="40" x2="150" y2="140"/><line x1="250" y1="40" x2="250" y2="140"/></g><g stroke="#2A2520" stroke-width="2" stroke-dasharray="5 4"><line x1="50" y1="140" x2="50" y2="160"/><line x1="150" y1="140" x2="150" y2="160"/><line x1="250" y1="140" x2="250" y2="160"/></g><g stroke="#7C5A34" stroke-width="2.4"><line x1="50" y1="56" x2="250" y2="56"/><line x1="50" y1="90" x2="250" y2="90"/><line x1="50" y1="124" x2="250" y2="124"/></g><line x1="20" y1="140" x2="290" y2="140" stroke="#A4572F" stroke-width="1"/><text x="100" y="36" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="9">2,50 m</text><text x="150" y="164" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="10">H 1,20 m · 3 lisses · enterré 0,50 m</text></svg>',
    cutlist:[{p:'Poteau',sec:'Ø8–10',l:'1,80 m',q:'1 / 2,5 m'},{p:'Lisse (refendue)',sec:'Ø6–8',l:'2,50 m',q:3},{p:'Jambe de force',sec:'Ø8',l:'1,50 m',q:'aux angles'}],
    joint:{name:'Entaille + tire-fond',desc:'Lisses logées dans une entaille du poteau, fixées au tire-fond ou clou galva ; contrefiche aux angles et tous les ~25 m.'},
    assembly:['Implanter au cordeau, trous tous les 2,50 m.','Sceller ou battre les poteaux, arase à 1,20 m, d’aplomb.','Entailler et fixer les 3 lisses (gabarit de hauteur).','Poser les jambes de force aux angles, puis tendre l’ensemble.'],
    precision:['Un gabarit de hauteur reporte l’emplacement des lisses à l’identique sur tous les poteaux.']},
  planche:{build:'Étagère / caisson',dims:'0,80 × 0,90 × 0,30 m · 3 tablettes ép. 27 mm',
    plan:'<svg class="plansvg" viewBox="0 0 300 170"><rect x="90" y="20" width="120" height="130" fill="#EFE6D6" stroke="#2A2520" stroke-width="2.4"/><g stroke="#2A2520" stroke-width="2.2"><line x1="90" y1="63" x2="210" y2="63"/><line x1="90" y1="106" x2="210" y2="106"/></g><g stroke="#A4572F" stroke-width="1"><line x1="90" y1="12" x2="210" y2="12"/><line x1="90" y1="8" x2="90" y2="16"/><line x1="210" y1="8" x2="210" y2="16"/></g><text x="150" y="6" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="9">0,80 m</text><text x="150" y="164" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="10">3 tablettes ép. 27 mm · H 0,90 m</text></svg>',
    cutlist:[{p:'Montant',sec:'27×300',l:'0,90 m',q:2},{p:'Tablette',sec:'27×300',l:'0,80 m',q:3},{p:'Traverse arrière',sec:'27×80',l:'0,80 m',q:1}],
    joint:{name:'Entaille (dado) ou tourillons',desc:'Tablettes logées dans une entaille des montants (ou tourillonnées) ; traverse arrière contre le vrillage.'},
    assembly:['Corroyer montants et tablettes à épaisseur identique.','Tracer et exécuter les entailles/tourillons, mêmes cotes des deux côtés.','Assembler à blanc, contrôler l’équerre.','Coller et serrer, traverse arrière posée d’équerre.'],
    precision:['Corroie toutes les tablettes ensemble à la même épaisseur : elles s’emboîtent sans jeu.']},
  meuble:{build:'Table',dims:'1,80 × 0,90 × 0,75 m · plateau ép. 40 mm',
    plan:'<svg class="plansvg" viewBox="0 0 300 170"><rect x="40" y="45" width="220" height="16" fill="#EFE6D6" stroke="#2A2520" stroke-width="2.2"/><line x1="60" y1="70" x2="240" y2="70" stroke="#2A2520" stroke-width="4"/><rect x="54" y="61" width="12" height="80" fill="#EFE6D6" stroke="#2A2520" stroke-width="2"/><rect x="234" y="61" width="12" height="80" fill="#EFE6D6" stroke="#2A2520" stroke-width="2"/><g stroke="#A4572F" stroke-width="1"><line x1="40" y1="35" x2="260" y2="35"/><line x1="40" y1="31" x2="40" y2="39"/><line x1="260" y1="31" x2="260" y2="39"/></g><text x="150" y="29" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="9">1,80 m</text><text x="150" y="164" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="10">H 0,75 m · ceinture + 4 pieds 8×8</text></svg>',
    cutlist:[{p:'Plateau (lames collées)',sec:'40×900',l:'1,80 m',q:1},{p:'Pied',sec:'8×8',l:'0,71 m',q:4},{p:'Traverse longue',sec:'3×10',l:'1,50 m',q:2},{p:'Traverse courte',sec:'3×10',l:'0,60 m',q:2}],
    joint:{name:'Tenon-mortaise + boutons de plateau',desc:'Traverses assemblées aux pieds par tenon-mortaise ; plateau fixé par boutons/tasseaux qui autorisent le retrait du bois.'},
    assembly:['Coller le plateau lame à lame (livre ouvert), araser après séchage.','Tailler pieds et traverses, tenons-mortaises ajustés.','Monter le piétement à blanc, équerrer, puis coller.','Fixer le plateau avec des boutons (laisse le bois travailler).'],
    precision:['Monte tout « à blanc » (sans colle) d’abord : tu vérifies l’équerrage et l’absence de vrille avant l’irréversible.']},
  manche:{build:'Manche d’outil (ex. hache)',dims:'L 0,70 m · poignée ≈ Ø35 mm',
    plan:'<svg class="plansvg" viewBox="0 0 300 170"><path d="M40,88 C60,72 120,76 150,82 C200,90 232,72 258,86 C232,98 205,88 152,94 C120,98 60,102 40,92 Z" fill="#EFE6D6" stroke="#2A2520" stroke-width="2.2"/><circle cx="250" cy="86" r="13" fill="none" stroke="#2A2520" stroke-width="2"/><g stroke="#A4572F" stroke-width="1"><line x1="40" y1="118" x2="258" y2="118"/><line x1="40" y1="114" x2="40" y2="122"/><line x1="258" y1="114" x2="258" y2="122"/></g><text x="150" y="132" text-anchor="middle" fill="#6E6253" font-family="monospace" font-size="10">L 0,70 m</text><text x="52" y="62" fill="#6E6253" font-family="monospace" font-size="9">talon</text><text x="228" y="60" fill="#6E6253" font-family="monospace" font-size="9">œil / tête</text></svg>',
    cutlist:[{p:'Ébauche fendue',sec:'4×4',l:'0,75 m',q:1},{p:'Coin d’œil',sec:'bois dur + métal',l:'court',q:1}],
    joint:{name:'Emmanchement à coin',desc:'Tête ajustée sur le manche puis fendue et coincée (coin bois + coin métal croisé) : serrage définitif, sans jeu.'},
    assembly:['Dégrossir au fil, garder le fil continu du talon à la tête.','Ajuster l’œil de l’outil au plus juste (lime), sans jeu.','Fendre la tête, poser les coins, araser.','Huiler (lin) : protège et regonfle légèrement les fibres.'],
    precision:['Suis le fil du bois, pas le trait : un manche parfait épouse les fibres, il ne les tranche pas.']},
  chauffage:{build:'Stère de bois',dims:'1 × 1 × 1 m · bûches 33 cm',
    plan:stackSVG(),
    cutlist:[{p:'Bûche 33 cm',sec:'Ø8–12',l:'0,33 m',q:'≈ 60–80 / stère'},{p:'Palette de base',sec:'—',l:'—',q:2}],
    joint:{name:'Empilage ventilé',desc:'Piles croisées en tête pour la stabilité ; base sur palette, faces exposées au vent dominant.'},
    assembly:['Tronçonner à 33 cm avec une butée (longueur constante).','Fendre à 8–12 cm : sèche plus vite et brûle mieux.','Empiler sur palette, écorce vers le haut.','Bâcher le dessus seulement — laisser les côtés respirer.'],
    precision:['Calibre les bûches à la longueur du foyer avec une butée : rangement serré et combustion régulière.']},
  barriere:{build:'Clôture de paddock 3 lisses',dims:'poteaux tous les 3 m · lisses à 40/80/120 cm',
    cutlist:[{p:'Poteau',sec:'14×14 ou rond Ø 14',l:'220 cm',q:'1 / 3 m'},{p:'Lisse fendue',sec:'demi-rond Ø 11-14',l:'300-400 cm',q:3},{p:'Cheville',sec:'Ø 2 châtaignier',l:'16 cm',q:6}],
    joint:{name:'Mortaise traversante chevillée',desc:'La lisse traverse le poteau évidé et se bloque par une cheville : rien ne se dévisse jamais, tout se remplace pièce à pièce.'},
    assembly:['Planter/sceller les poteaux (70 cm en terre, pierre au fond du trou).','Enfiler les lisses dans les mortaises, joints décalés d’un poteau à l’autre.','Cheviller chaque traversée ; araser.','Pointes des poteaux biseautées pour l’eau.'],
    precision:['Cordeau tendu entre poteaux d’angle : l’alignement se juge à l’œil ET au cordeau.','Hauteur de lisse haute constante : gabarit-bâton, pas de mètre.'],
    ancien:[{t:'Bois fendu, pas scié',d:'Une lisse fendue suit le fil du bois : l’eau ne pénètre pas dans les fibres tranchées. Durée de vie doublée par rapport au sciage.'},{t:'Pieds passés au feu',d:'Carboniser 2 mm de la partie enterrée des poteaux (technique millénaire, cousine du yakisugi japonais) : le charbon ne pourrit pas.'},{t:'Écorçage à la plane',d:'Un poteau écorcé sèche debout sans se piquer ; l’écorce laissée devient un nid à insectes et à humidité.'}]},
  ratelier:{build:'Râtelier mural ou sur pieds',dims:'180 × 90 × 160 cm · barreaux tous les 28 cm',
    cutlist:[{p:'Montant',sec:'6×6',l:'160 cm',q:4},{p:'Traverse',sec:'6×6',l:'180 cm',q:4},{p:'Barreau',sec:'Ø 4',l:'90 cm',q:6},{p:'Patin',sec:'7×7',l:'60 cm',q:2}],
    joint:{name:'Tenon-mortaise chevillé',desc:'Cadre porteur assemblé sans quincaillerie : les chevilles travaillent en cisaillement et se remplacent en cinq minutes.'},
    assembly:['Assembler les deux cadres latéraux à plat (tenons collés d’eau chaude ou à sec).','Relier par les traverses, contrôler les diagonales.','Emmancher les barreaux inclinés avant de fermer le second flanc.','Poser sur patins, jamais en terre ; fixer au mur si mural.'],
    precision:['Perce les vis-à-vis des barreaux avec un gabarit cloué : 1 mm d’écart se voit sur 6 barreaux.','Diagonales égales = cadre d’équerre, toujours.'],
    ancien:[{t:'Barreaux en frêne fendu',d:'Comme les râteaux à foin d’autrefois : un barreau fendu plie sous le museau d’un cheval au lieu de casser en écharde.'},{t:'Resserrage par séchage',d:'Barreau sec dans montant mi-sec : le bois vert se rétracte autour du tenon. C’est l’assemblage qui se serre tout seul avec le temps.'},{t:'Angles cassés au couteau',d:'Tous les arêtes côté animal arrondies à la plane ou au couteau : ni écharde ni blessure, et le bois roulé sous la main dure plus.'}]},
  ruche:{build:'Corps Dadant 10 cadres',dims:'45 × 54 cm hors tout · h 31 cm · bois 27 mm',
    cutlist:[{p:'Face avant/arrière',sec:'27 mm',l:'45 cm',q:2},{p:'Côté',sec:'27 mm',l:'54 cm',q:2},{p:'Crémaillère/feuillure',sec:'17×10 mm',l:'45 cm',q:2},{p:'Plancher & toit',sec:'27 mm',l:'selon modèle',q:'1+1'}],
    joint:{name:'Queue droite chevillée',desc:'Les angles emboîtés à queues droites offrent un long joint étanche ; chevillé bois, il vieillit sans rouille dans un milieu humide et propolisé.'},
    assembly:['Assembler les 4 côtés à queues droites, équerrage strict.','Régler la feuillure : dessus de cadre affleurant à 7-8 mm sous le rebord (bee-space).','Plancher grillagé amovible ; toit débordant en casquette.','Extérieur : peinture suédoise ; intérieur : rien.'],
    precision:['Le « bee-space » (7-8 mm) est la cote reine : en-dessous les abeilles propolisent, au-dessus elles construisent.','Contrôle les diagonales du corps au mm : un corps voilé fuit et refroidit.'],
    ancien:[{t:'Ruche-tronc cévenole',d:'Technique inédite à essayer : un tronçon de châtaignier creux, couvert d’une lauze, faisait ruche pendant des générations. Ton stock de grumes creuses peut devenir un rucher-patrimoine.'},{t:'Flambage intérieur',d:'Les anciens passaient l’intérieur des ruches à la flamme de paille : assainissement sans aucun produit, odeur que les essaims recherchent.'},{t:'Colle d’os chaude',d:'Réversible à la vapeur, sans solvant : la colle des ébénistes d’avant 1950, parfaite en milieu alimentaire.'}]},
  abribois:{build:'Appentis 2 × 4 m monopente',dims:'h 2,2 m devant · 1,8 m derrière · pente 30 %',
    cutlist:[{p:'Poteau avant',sec:'7×7',l:'220 cm',q:3},{p:'Poteau arrière',sec:'7×7',l:'180 cm',q:3},{p:'Panne',sec:'7×7',l:'200 cm',q:4},{p:'Écharpe',sec:'5×7',l:'90 cm',q:6},{p:'Chevron',sec:'5×7',l:'150 cm',q:5}],
    joint:{name:'Mi-bois + écharpes à 45°',desc:'Chaque écharpe cloue un triangle indéformable dans la structure : c’est elle, pas les poteaux, qui tient l’appentis debout dans le vent.'},
    assembly:['Implanter 6 pierres/plots de niveau entre eux (niveau d’eau : tuyau transparent).','Lever les portiques poteau-panne à plat puis les dresser.','Contreventer immédiatement (écharpes provisoires puis définitives).','Chevronner, couvrir, planchéier à claire-voie.'],
    precision:['Le niveau d’eau (tuyau rempli d’eau) donne le même niveau à 10 m sans laser.','Débord de toit 30 cm minimum : la pluie battante n’atteint pas le bois empilé.'],
    ancien:[{t:'Poteau sur pierre',d:'La règle d’or des granges anciennes : le bois ne touche JAMAIS la terre. Une pierre plate en interface et le poteau dure un siècle.'},{t:'Niveau d’eau romain',d:'Un simple tuyau transparent rempli d’eau : deux extrémités, même niveau exact, à n’importe quelle distance. Imbattable, gratuit.'},{t:'Bois cordé (inédit)',d:'Si tu veux des murs : la technique du bois cordé (bûches maçonnées à la chaux/sciure) fait des murs isolants avec ton bois de chauffage déclassé.'}]},
  poulailler:{build:'Poulailler 6 poules sur pieds',dims:'120 × 80 cm · h 80 cm + pieds 60 cm',
    cutlist:[{p:'Panneau',sec:'20 mm',l:'80-120 cm',q:'6 faces'},{p:'Pied',sec:'6×6',l:'140 cm',q:4},{p:'Perchoir',sec:'Ø 4-5',l:'110 cm',q:2},{p:'Pondoir',sec:'20 mm',l:'30×30×35',q:3}],
    joint:{name:'Panneaux vissés démontables',desc:'Ici, exception : la vis inox est reine, car TOUT doit se démonter pour le grand nettoyage annuel à la chaux.'},
    assembly:['Cadre sur 4 pieds, panneaux vissés dessus.','Tiroir à déjections sous les perchoirs (tôle ou planche cirée).','Pondoirs plus bas que les perchoirs, dans le coin sombre.','Trappe sud à coulisse, aérations hautes grillagées.'],
    precision:['Perchoir 4-5 cm à angles cassés : la poule couvre ses doigts de ses plumes l’hiver.','Tout recoin doit être atteignable par une main : ce qui ne se nettoie pas devient un nid à poux.'],
    ancien:[{t:'Badigeon de chaux vive',d:'Le désinfectant des fermes depuis toujours : murs et pondoirs chaulés chaque printemps, aucun produit moderne ne fait mieux.'},{t:'Perchoirs flambés',d:'Perchoirs amovibles passés à la flamme deux fois l’an : le pou rouge niche dans le bois, le feu le déloge sans chimie.'},{t:'Cendres du poêle',d:'Un bac de cendres tamisées = le bain de poussière antiparasitaire gratuit et traditionnel.'}]},
  portail:{build:'Barrière de prairie 1 vantail',dims:'3 à 3,5 m × 1,1 m · 5 traverses',
    cutlist:[{p:'Montant',sec:'4×9',l:'110 cm',q:2},{p:'Traverse',sec:'4×9',l:'300-350 cm',q:5},{p:'Écharpe',sec:'4×9',l:'~150 cm',q:1},{p:'Cheville',sec:'Ø 2',l:'12 cm',q:12}],
    joint:{name:'Tenon-mortaise + écharpe en compression',desc:'L’écharpe part du gond bas et monte vers le nez de la barrière : le poids la comprime au lieu d’arracher les fixations.'},
    assembly:['Cadre à plat sur tréteaux, tenons chevillés.','Tracer l’écharpe en place, entailler à mi-bois, cheviller.','Ferrer le montant côté gond ; gond haut ET bas dans le même aplomb.','Régler la garde au sol à 10 mm, loquet ou chaîne.'],
    precision:['Le sens de l’écharpe est LE point que tout le monde rate : compression depuis le gond bas, sinon la barrière s’affaisse en un an.','Cheville légèrement conique, enfoncée du même côté que le parement.'],
    ancien:[{t:'Chevillage à tire',d:'Percer la mortaise 2 mm décalée vers l’épaulement : en entrant, la cheville TIRE le tenon au fond du joint. Serrage éternel, technique de charpentier.'},{t:'Gonds déportés (inédit)',d:'Déporte le gond haut de 3 cm vers l’intérieur : la barrière se referme toute seule par gravité, sans ressort.'},{t:'Chapeau d’eau',d:'Toutes les coupes horizontales biseautées à 15° : l’eau file, le bois de bout ne boit pas.'}]},
  echelle:{build:'Échelle simple 3 m',dims:'montants 4×6 · 10 barreaux Ø 3,2 tous les 28 cm',
    cutlist:[{p:'Montant',sec:'4×6 → 4×4,5 en tête',l:'300 cm',q:2},{p:'Barreau',sec:'Ø 3,2',l:'45 → 38 cm',q:10},{p:'Coin',sec:'bois dur',l:'3 cm',q:10}],
    joint:{name:'Emmanchement conique à coin (queue de renard)',desc:'Le barreau traverse le montant, son bout fendu reçoit un coin qui l’évase : impossible à extraire, comme un manche de hache.'},
    assembly:['Percer les deux montants ensemble, serrés l’un contre l’autre (vis-à-vis parfait).','Élargir légèrement la sortie du trou côté extérieur (cône).','Emmancher tous les barreaux sur un montant, coiffer du second.','Serrer au maillet, couper les tenons à 5 mm, fendre, encoller le coin, frapper, araser.'],
    precision:['L’échelle se rétrécit vers le haut (stabilité et poids) : 45 cm entre montants en pied, 38 en tête.','Chaque barreau doit chanter clair au maillet : un son mat = fente.'],
    ancien:[{t:'Frêne fendu, jamais scié',d:'Les échelles de ferme se fendaient : le fil continu plie et rend, il ne casse pas. Une échelle sciée peut rompre sans prévenir sur un nœud tranché.'},{t:'Séchage différentiel',d:'Barreaux au four (très secs) dans des montants à l’air (mi-secs) : en équilibrant, le montant étreint le barreau pour toujours.'},{t:'Test du charpentier',d:'Échelle à plat sur deux cales, marcher au centre : elle doit ployer franchement et revenir. La raideur absolue est suspecte.'}]},
  banc:{build:'Banc 5 pieds ou table basse',dims:'plateau 45 mm × 35 cm × 1,5-2 m · pieds Ø 6-7',
    cutlist:[{p:'Plateau (dosse)',sec:'45 mm',l:'150-200 cm',q:1},{p:'Pied fendu',sec:'Ø 6-7 conique',l:'45 cm',q:4},{p:'Coin bois dur',sec:'—',l:'4 cm',q:4}],
    joint:{name:'Queue de renard inclinée',desc:'Tenon conique traversant, fendu, bloqué par un coin perpendiculaire au fil du plateau : l’assemblage des bancs et escabeaux depuis le Moyen Âge.'},
    assembly:['Percer le plateau incliné 10-12° dans les deux plans (gabarit ou regard).','Ajuster chaque pied au couteau jusqu’au serrage dur à la main.','Coller d’eau, emmancher au maillet, coin encollé, frapper.','Araser tenons et coins au ras du plateau : c’est aussi la signature esthétique.'],
    precision:['Perce TOUJOURS par la face du dessous : l’éclat de sortie reste invisible.','Araser les 4 pieds : banc sur une surface plane, cale-crayon qui fait le tour.'],
    ancien:[{t:'Bois de réaction interdit',d:'Pour les pieds, fends dans une bille bien droite : le bois de branche ou penché « tire » en séchant et vrille le banc.'},{t:'Huile de lin chaude',d:'Chauffée au bain-marie, elle pénètre trois fois plus : deux couches à 24 h, lustrage à la cire d’abeille de tes ruches.'},{t:'Rive naturelle (inédit)',d:'Garde l’écorce ou la rive brute d’un côté du plateau (live edge) : très recherché, zéro travail en plus.'}]},
  tavaillon:{build:'Couverture ou bardage en tavaillons',dims:'40 cm × 8-14 cm × 10-12 mm · pose au tiers',
    cutlist:[{p:'Tavaillon',sec:'10-12 mm',l:'40 cm',q:'~70 / m²'},{p:'Liteau',sec:'27×40',l:'—',q:'tous les 13 cm'},{p:'Pointe inox',sec:'2,2×45',l:'—',q:'2 / tavaillon'}],
    joint:{name:'Pose au tiers (triple épaisseur)',desc:'Chaque point du toit est couvert par trois tavaillons : l’eau ruisselle de lame en lame sans jamais toucher le liteau.'},
    assembly:['Liteauner tous les 13 cm (pureau du tiers).','Premier rang doublé en pied de toit.','Décaler chaque rang d’une demi-largeur (joints jamais alignés).','Deux pointes par tavaillon, à 2 cm des rives, JAMAIS au centre.','Faîtage : planche de rive ou tavaillons croisés.'],
    precision:['Laisse 3-4 mm entre tavaillons voisins : ils gonflent à la pluie et se plaquent.','Cloue souple : une pointe enfoncée à mort fend la lame au premier gel.'],
    ancien:[{t:'Le départoir et le chevalet',d:'L’outillage complet du tavaillonneur tient en trois pièces : départoir, maillet, plane sur chevalet. Un savoir-faire des Alpes et du Jura à faire revivre.'},{t:'Fendu = étanche',d:'La lame fendue garde ses vaisseaux fermés et brillants : l’eau perle. Une lame sciée boit et noircit en deux hivers.'},{t:'Tri à la lumière',d:'Lève chaque tavaillon vers le ciel : s’il laisse passer des points de lumière au fil, il partira en petit bois — au toit, il fuirait.'}]},
  passerelle:{build:'Passerelle 3 m sur fossé',dims:'2 poutres 16×16 · platelage 27-34 mm · largeur 80 cm',
    cutlist:[{p:'Poutre',sec:'16×16',l:'300 cm',q:2},{p:'Lame de platelage',sec:'27-34 mm × 15',l:'80 cm',q:'~20'},{p:'Traverse d’entretoise',sec:'7×7',l:'60 cm',q:3},{p:'Main courante',sec:'Ø 5',l:'300 cm',q:'0-2'}],
    joint:{name:'Chevillage sur entaille',desc:'Chaque lame repose dans une légère entaille des poutres et se chevile : pas de vis qui rouille sous l’eau, remplacement lame à lame.'},
    assembly:['Poser les culées : pierres plates ou blocs, hors gel si possible.','Présenter les poutres, entre-toiser aux extrémités et au centre.','Entailler légèrement (5 mm) l’assise des lames, cheviller.','Ménager 8 mm entre lames ; anti-dérapant : rainures à la scie tous les 3 cm.'],
    precision:['Bombement volontaire : pose les poutres cœur vers le HAUT, leur flèche naturelle fait un dos d’âne qui évacue l’eau.','Contrôle chaque année les appuis : une passerelle meurt par ses culées, pas par son tablier.'],
    ancien:[{t:'Équarrissage à la ligne',d:'Cordeau frotté de charbon, claqué sur la grume : le trait de coupe des charpentiers depuis l’Antiquité. Puis entailles à la hache et abattage des dosses.'},{t:'Cœur vers le haut',d:'Règle des ponts de bois anciens : la poutre posée cœur au-dessus se cambre contre la charge au lieu de s’affaisser.'},{t:'Facettes de hache (inédit)',d:'Une poutre équarrie à la hache, aux facettes irrégulières, sèche mieux et fend moins qu’une poutre sciée : les fibres sont écrasées, pas tranchées.'}]}
};
function openWoodProjectDoc(k){ go(()=>renderWoodProjectDoc(k),'dossier'); }
function renderWoodProjectDoc(k,keep){
  mode='wood'; const p=WOOD_PROJECTS.find(x=>x.k===k), doc=WOOD_DOC[k], row=woodProjectFit().find(r=>r.p.k===k);
  $('wfTitle').textContent=p.n;
  const sec=(t,body)=>'<div class="doc-sec"><div class="doc-h">'+t+'</div>'+body+'</div>';
  const li=arr=>'<ol class="doc-ol">'+arr.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>';
  const tags=arr=>'<div class="ef-uses">'+arr.map(o=>'<span class="wtag">'+esc(o)+'</span>').join('')+'</div>';
  let pieces=0; (row.logs||[]).forEach(l=>{ pieces+=debitYield(doc.y.type,doc.y.params,l); });
  const yieldBox = row.ok
    ? '<div class="doc-yield"><span class="dy-n">≈ '+pieces+' '+doc.y.unit+(pieces>1?'s':'')+'</span><span class="dy-s">estimé depuis '+row.count+' grume'+(row.count>1?'s':'')+' adaptée'+(row.count>1?'s':'')+' ('+esc(row.species.join(', '))+')</span></div>'
    : '<div class="doc-yield warn"><span class="dy-n">Pas encore réalisable</span><span class="dy-s">'+esc(row.hint||'—')+'</span></div>';
  /* construction planifiée : quantité voulue + grumes réservées */
  let buildBox='';
  const isSel=woodPlanSet().has(k);
  if(isSel){ const al=woodAllocation().alloc[k];
    if(al){ const short=al.got<al.want;
      const rowsL=al.logs.map(c=>{ const e=essenceByKey(c.l.speciesKey);
        return '<tr><td>'+esc(e?e.n:(c.l.speciesName||'Grume'))+'</td><td>'+(c.l.lengthCm||0)+'×Ø'+(c.l.diamCm||0)+' cm</td><td>'+(c.l.volumeM3||0).toFixed(2)+' m³</td><td>≈ '+c.y+'</td></tr>'; }).join('');
      buildBox='<div class="doc-build'+(short?' warn':'')+'"><div class="db-head"><b>'+al.want+' '+esc(al.unit)+(al.want>1?'s':'')+' voulue'+(al.want>1?'s':'')+'</b>'+
        '<span>'+al.logs.length+' grume'+(al.logs.length>1?'s':'')+' réservée'+(al.logs.length>1?'s':'')+' · '+al.vol.toFixed(2)+' m³ · ≈ '+al.got+' '+esc(al.unit)+(al.got>1?'s':'')+' possible'+(al.got>1?'s':'')+'</span>'+
        (short?'<span class="db-warn">⚠️ Stock insuffisant pour '+al.want+' : ajoute des grumes adaptées ou réduis la quantité.</span>':'')+'</div>'+
        '<div class="psel-qty"><button class="pq-btn" data-qm="'+k+'">−</button><input class="pq-in" data-qi="'+k+'" type="number" inputmode="numeric" min="1" max="999" value="'+al.want+'"><button class="pq-btn" data-qp="'+k+'">+</button><span class="pq-lbl">'+esc(al.unit)+(al.want>1?'s':'')+' voulue'+(al.want>1?'s':'')+'</span></div>'+
        (rowsL?'<div class="tablewrap"><table class="cutlist"><thead><tr><th>Essence</th><th>Dimensions</th><th>Volume</th><th>Pièces</th></tr></thead><tbody>'+rowsL+'</tbody></table></div>':'')+
        '<button class="demolink del" id="docUnbuild">Retirer cette construction</button></div>';
    }
  } else {
    buildBox='<div class="doc-build off"><div class="db-head"><b>Pas encore planifiée</b><span>Choisis-la : les grumes nécessaires seront réservées et listées ici, avec la quantité de pièces que tu veux.</span></div><button class="mnt-btn add" id="docBuild" style="width:100%">🔨 Planifier cette construction</button></div>';
  }
  const plan=WOOD_PLAN[k]||{};
  const cut=(plan.cutlist||[]).map(r=>'<tr><td>'+esc(r.p)+'</td><td>'+esc(r.sec)+'</td><td>'+esc(r.l)+'</td><td>'+esc(''+r.q)+'</td></tr>').join('');
  const prec=PRECISION_BASE.concat(plan.precision||[]);
  let html='<div class="doc-top"><span class="doc-ic">'+p.ic+'</span><div><div class="doc-intro">'+esc(doc.intro)+'</div></div></div>';
  if(buildBox) html+=sec('Ta construction', buildBox);
  if(plan.plan){ html+=sec('Ce qu’on construit','<div class="planwrap"><div class="plan-t"><b>'+esc(plan.build)+'</b><span>'+esc(plan.dims)+'</span></div>'+plan.plan+'</div>'); }
  html+=sec('La pièce à sortir de la grume','<div class="efiche"><div class="ef-row"><span>Pièce</span><b>'+esc(doc.piece)+'</b></div><div class="ef-row"><span>Section / calibre</span><b>'+esc(doc.section)+'</b></div><div class="ef-row"><span>Longueur</span><b>'+esc(doc.long)+'</b></div><div class="ef-row"><span>Essences conseillées</span><b>'+esc(doc.essences)+'</b></div></div>');
  html+=sec('Plan de coupe de la grume','<div class="debitwrap">'+debitSVG(doc.debit)+'<div class="debit-cap"><b>'+esc(DEBIT_LBL[doc.debit])+'</b><span>Coupe transversale (● = cœur).</span></div></div>');
  if(cut){ html+=sec('Liste de débit','<div class="tablewrap"><table class="cutlist"><thead><tr><th>Pièce</th><th>Section (cm/mm)</th><th>Long.</th><th>Qté</th></tr></thead><tbody>'+cut+'</tbody></table></div>'); }
  html+=sec('Rendement estimé — ton stock', yieldBox);
  if(plan.joint){ html+=sec('Assemblage','<div class="joint"><b>'+esc(plan.joint.name)+'</b><span>'+esc(plan.joint.desc)+'</span></div>'+li(plan.assembly||[])); }
  if(plan.ancien&&plan.ancien.length){ html+=sec('Techniques anciennes & inédites','<div class="ancien">'+plan.ancien.map(a=>'<div class="anc"><b>🏺 '+esc(a.t)+'</b><span>'+esc(a.d)+'</span></div>').join('')+'</div>'); }
  html+=sec('Découpe de la grume, pas à pas', li(doc.guide));
  html+=sec('Sortir des pièces parfaites','<div class="perfect">'+prec.map(s=>'<div class="pf"><span class="pf-c">✓</span><span>'+esc(s)+'</span></div>').join('')+'</div>');
  html+=sec('Outils', tags(doc.outils));
  html+=sec('Séchage','<div class="doc-p">'+esc(doc.sechage)+'</div>');
  html+=sec('Sécurité','<div class="doc-p">'+esc(doc.securite)+'</div>');
  html+=sec('Astuce','<div class="doc-p astuce">💡 '+esc(doc.astuce)+'</div>');
  html+='<div class="wnav"><button class="miniBtn" id="docBack">← Projets</button></div>';
  $('wfBody').innerHTML=html;
  $('docBack').onclick=()=>doBack();
  const bWrap=$('wfBody');
  const db=$('docBuild'); if(db) db.onclick=()=>{ toggleWoodPlan(k); renderWoodProjectDoc(k,true); };
  const du=$('docUnbuild'); if(du) du.onclick=()=>{ toggleWoodPlan(k); renderWoodProjectDoc(k,true); };
  bWrap.querySelectorAll('[data-qm]').forEach(x=>x.onclick=()=>{ setWoodQty(k, woodQty(k)-1); renderWoodProjectDoc(k,true); });
  bWrap.querySelectorAll('[data-qp]').forEach(x=>x.onclick=()=>{ setWoodQty(k, woodQty(k)+1); renderWoodProjectDoc(k,true); });
  bWrap.querySelectorAll('[data-qi]').forEach(x=>x.onchange=()=>{ setWoodQty(k, x.value); renderWoodProjectDoc(k,true); });
  if(!keep) show('scWoodFlow',{accent:'#7C5A34',nav:'wood'});
}

/* ---- nouvelle grume : assistant photo → essence → mesure → stock ---- */
let woodDraft=null;
function startWoodNew(){ const last=STORE.woodLastSpecies||{}; woodDraft={step:1, photo:'', ans:{}, speciesKey:last.key||'', speciesName:last.name||'', m:null, mMode:'diam', mLenManual:'', mDiamManual:'', mDiam2Manual:'', numero:'', provenance:'', dateAbattage:'', etat:'', qualite:'', epaisseur:'', note:''}; go(renderWoodNew,'nouvelle grume'); }
function renderWoodNew(){ mode='wood'; $('wfTitle').textContent='Nouvelle grume'; drawWoodStep(); show('scWoodFlow',{accent:'#7C5A34',nav:'wood'}); }
function drawWoodStep(){
  const d=woodDraft, b=$('wfBody'); if(!d) return;
  if(d.step===1){
    b.innerHTML='<div class="wstep">Étape 1 / 4 · Photo</div>'+
      (d.photo?'<div class="wm-imgwrap"><img src="'+d.photo+'" alt=""></div>':'<div class="empty">Prends la grume en photo (avec un mètre ou une planche posée dessus, utile pour la mesure).</div>')+
      '<button class="addbtn" id="wnPhoto">📷 '+(d.photo?'Reprendre la photo':'Prendre la grume en photo')+'</button>'+
      '<div class="wnav"><span></span><button class="save" id="wnNext">'+(d.photo?'Continuer →':'Passer cette étape →')+'</button></div>';
    $('wnPhoto').onclick=()=>grabPhoto(data=>{ d.photo=data; drawWoodStep(); });
    $('wnNext').onclick=()=>{ d.step=2; drawWoodStep(); };
  } else if(d.step===2){
    b.innerHTML='<div class="wstep">Étape 2 / 4 · Essence</div>'+
      (d.speciesKey?'<div class="wpick">Choisie : <b>'+esc(d.speciesName)+'</b> — <span class="wpick-x" id="wnClear">changer</span></div>':'')+
      '<div id="wid"></div><div class="wnav"><button class="miniBtn" id="wnBack">← Photo</button><button class="save" id="wnNext"'+(d.speciesKey?'':' disabled style="opacity:.5"')+'>Mesurer →</button></div>';
    renderIdentifyUI($('wid'), d.ans, (k)=>{ const e=essenceByKey(k); d.speciesKey=k; d.speciesName=e.n; drawWoodStep(); });
    if($('wnClear')) $('wnClear').onclick=()=>{ d.speciesKey=''; d.speciesName=''; drawWoodStep(); };
    $('wnBack').onclick=()=>{ d.step=1; drawWoodStep(); };
    if(d.speciesKey) $('wnNext').onclick=()=>{ d.step=3; drawWoodStep(); };
  } else if(d.step===3){
    drawMeasureStep();
  } else if(d.step===4){
    const r=measureResults(d);
    let h='<div class="wstep">Étape 4 / 4 · Récapitulatif</div>'+
      (d.photo?'<div class="wm-imgwrap sm"><img src="'+d.photo+'" alt=""></div>':'')+
      '<div class="efiche"><div class="ef-h"><span class="ef-n">'+esc(d.speciesName||'Grume')+'</span></div>'+
      '<div class="ef-row"><span>Longueur</span><b>'+(r.lenCm||'—')+' cm</b></div>'+
      '<div class="ef-row"><span>'+(r.diam2Cm?'Ø gros bout':'Diamètre')+'</span><b>'+(r.diamCm||'—')+' cm</b></div>'+
      (r.diam2Cm?'<div class="ef-row"><span>Ø petit bout</span><b>'+r.diam2Cm+' cm</b></div>':'')+
      '<div class="ef-row"><span>Volume'+(r.diam2Cm?' (tronc de cône)':'')+'</span><b>'+(r.vol?r.vol.toFixed(3):'—')+' m³</b></div></div>';
    h+='<div class="wstep">Détails (facultatif)</div>';
    h+='<div class="field"><label>N° de grume</label><input id="wnNum" type="text" value="'+esc(d.numero||'')+'" placeholder="ex : 12"></div>';
    h+='<div class="field"><label>Provenance / parcelle</label><input id="wnProv" type="text" value="'+esc(d.provenance||'')+'" placeholder="ex : bois du bas"></div>';
    h+='<div class="field"><label>Date d’abattage</label><input id="wnAbat" type="date" value="'+esc(d.dateAbattage||'')+'"></div>';
    h+='<div class="field"><label>État</label><select id="wnEtat"><option value="">—</option>'+['Grume fraîche','Ressuyée','Sèche'].map(o=>'<option'+(d.etat===o?' selected':'')+'>'+o+'</option>').join('')+'</select></div>';
    h+='<div class="field"><label>Qualité / défauts</label><input id="wnQual" type="text" value="'+esc(d.qualite||'')+'" placeholder="droite, nœuds, cœur excentré, gélivure…"></div>';
    h+='<div class="field"><label>Épaisseur de débit visée (cm)</label><input id="wnEp" type="number" min="0" step="0.5" value="'+esc(d.epaisseur||'')+'"></div>';
    const ep=parseFloat(d.epaisseur);
    if(ep>0){ h+='<p class="wm-help">🌬️ Séchage à l’air après débit : ≈ '+scaleFmt(ep)+' an'+(ep>1?'s':'')+' (règle 1 an / cm d’épaisseur).</p>';
      const nb=plankEstimate(r.lenCm,r.diamCm,ep); if(nb>0) h+='<p class="wm-help">🪚 Débit estimé : ≈ '+nb+' planche'+(nb>1?'s':'')+' de '+scaleFmt(ep)+' cm (~'+Math.round(r.diamCm*0.7)+' cm de large × '+r.lenCm+' cm).</p>'; }
    h+='<div class="field"><label>Note</label><input id="wnNote" type="text" value="'+esc(d.note||'')+'" placeholder="remarque libre"></div>';
    h+='<div class="wnav"><button class="miniBtn" id="wnBack">← Mesure</button><button class="save" id="wnSave">Enregistrer dans le stock</button></div>';
    b.innerHTML=h;
    const st=(id,f)=>{ const el=$(id); if(el){ const ev=el.tagName==='SELECT'?'onchange':'oninput'; el[ev]=e=>{ d[f]=e.target.value; }; } };
    st('wnNum','numero'); st('wnProv','provenance'); st('wnAbat','dateAbattage'); st('wnEtat','etat'); st('wnQual','qualite'); st('wnNote','note');
    if($('wnEp')){ $('wnEp').oninput=e=>{ d.epaisseur=e.target.value; }; $('wnEp').onchange=e=>{ d.epaisseur=e.target.value; drawWoodStep(); }; }
    $('wnBack').onclick=()=>{ d.step=3; drawWoodStep(); };
    $('wnSave').onclick=()=>saveWoodLog();
  }
}
function drawMeasureStep(){
  const d=woodDraft, b=$('wfBody');
  d.m=d.m||{stage:'ref', ref:[], len:[], diam:[], refCm:100, rw:1, rh:1};
  if(!d.photo){
    b.innerHTML='<div class="wstep">Étape 3 / 4 · Mesure</div><div class="empty">Il faut une photo (avec un repère de longueur connue) pour mesurer, ou saisis les dimensions à la main.</div>'+
      '<button class="addbtn" id="wmPhoto">📷 Photo de mesure</button>'+manualBlock(d)+
      '<div class="wnav"><button class="miniBtn" id="wnBack">← Essence</button><button class="save" id="wmNext">Valider la mesure →</button></div>';
    $('wmPhoto').onclick=()=>grabPhoto(data=>{ d.photo=data; drawWoodStep(); });
    bindManual(d); $('wnBack').onclick=()=>{ d.step=2; drawWoodStep(); }; $('wmNext').onclick=()=>{ d.step=4; drawWoodStep(); };
    return;
  }
  const seg={ref:'Repère',len:'Longueur',diam:'Diamètre'};
  let html='<div class="wstep">Étape 3 / 4 · Mesure</div>';
  html+='<p class="wm-help">Renseigne la longueur du repère, puis pointe sur la photo : les 2 bouts du <b>repère</b>, la <b>longueur</b> et le <b>diamètre</b> de la grume.</p>';
  html+='<div class="field"><label>Longueur réelle du repère (cm)</label><input id="wmRef" type="number" min="1" value="'+d.m.refCm+'"></div>';
  html+='<div class="wm-seg">'+['ref','len','diam'].map(s=>'<button class="wm-segb'+(d.m.stage===s?' on':'')+'" data-seg="'+s+'">'+seg[s]+' '+(d.m[s].length===2?'✓':d.m[s].length+'/2')+'</button>').join('')+'</div>';
  html+='<div class="wm-imgwrap tap" id="wmImg"><img src="'+d.photo+'" alt=""><div class="wm-dots" id="wmDots"></div></div>';
  const r=measureResults(d);
  html+='<div class="wm-out"><div class="ustat"><div class="sv">'+(r.lenCm||'—')+(r.lenCm?' cm':'')+'</div><div class="sl">longueur</div></div>'+
    '<div class="ustat"><div class="sv">'+(r.diamCm||'—')+(r.diamCm?' cm':'')+'</div><div class="sl">diamètre</div></div>'+
    '<div class="ustat"><div class="sv">'+(r.vol?r.vol.toFixed(3)+' m³':'—')+'</div><div class="sl">volume</div></div></div>';
  html+='<details class="wm-manualwrap"><summary>Saisie manuelle (sans photo)</summary>'+manualBlock(d)+'</details>';
  html+='<div class="wnav"><button class="miniBtn" id="wnBack">← Essence</button><button class="save" id="wmNext">Valider la mesure →</button></div>';
  b.innerHTML=html;
  drawDots(d);
  $('wmRef').oninput=e=>{ d.m.refCm=parseFloat(e.target.value)||0; updateMeasureOut(d); };
  b.querySelectorAll('[data-seg]').forEach(x=>x.onclick=()=>{ d.m.stage=x.dataset.seg; d.m[d.m.stage]=[]; drawMeasureStep(); });
  const img=$('wmImg');
  img.onclick=(e)=>{ const el=img.querySelector('img'); const rect=el.getBoundingClientRect();
    if(!rect.width||!rect.height) return;
    d.m.rw=rect.width; d.m.rh=rect.height;
    const p={ xPct:Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100)), yPct:Math.max(0,Math.min(100,(e.clientY-rect.top)/rect.height*100)) };
    const arr=d.m[d.m.stage]; if(arr.length>=2) arr.length=0; arr.push(p);
    if(arr.length===2){ const order=['ref','len','diam']; const i=order.indexOf(d.m.stage); if(i<2&&d.m[order[i+1]].length<2) d.m.stage=order[i+1]; }
    drawMeasureStep();
  };
  bindManual(d);
  $('wnBack').onclick=()=>{ d.step=2; drawWoodStep(); };
  $('wmNext').onclick=()=>{ const r2=measureResults(d); d.mLenFinal=r2.lenCm; d.mDiamFinal=r2.diamCm; d.step=4; drawWoodStep(); };
}
function manualBlock(d){ const circ=(d.mMode==='circ');
  const dl=circ?'Circonférence gros bout (cm)':'Ø gros bout (cm)';
  const d2l=circ?'Circonférence petit bout (cm, option)':'Ø petit bout (cm, option)';
  return '<div class="wm-manual">'+
    '<div class="wm-mode"><button type="button" class="wm-modeb'+(!circ?' on':'')+'" data-mode="diam">Diamètre</button><button type="button" class="wm-modeb'+(circ?' on':'')+'" data-mode="circ">Circonf. (mètre ruban)</button></div>'+
    '<div class="field"><label>Longueur (cm)</label><input id="wmLen" type="number" min="0" value="'+(d.mLenManual||'')+'"></div>'+
    '<div class="field"><label>'+dl+'</label><input id="wmDiam" type="number" min="0" value="'+(d.mDiamManual||'')+'"></div>'+
    '<div class="field"><label>'+d2l+'</label><input id="wmDiam2" type="number" min="0" value="'+(d.mDiam2Manual||'')+'"></div>'+
    '</div>'; }
function bindManual(d){
  if($('wmLen')) $('wmLen').oninput=e=>{ d.mLenManual=e.target.value; updateMeasureOut(d); };
  if($('wmDiam')) $('wmDiam').oninput=e=>{ d.mDiamManual=e.target.value; updateMeasureOut(d); };
  if($('wmDiam2')) $('wmDiam2').oninput=e=>{ d.mDiam2Manual=e.target.value; updateMeasureOut(d); };
  document.querySelectorAll('[data-mode]').forEach(x=>x.onclick=()=>{ d.mMode=x.dataset.mode; drawWoodStep(); });
}
function updateMeasureOut(d){ const r=measureResults(d); const out=document.querySelectorAll('.wm-out .sv'); if(out.length===3){ out[0].textContent=r.lenCm?r.lenCm+' cm':'—'; out[1].textContent=r.diamCm?r.diamCm+' cm':'—'; out[2].textContent=r.vol?r.vol.toFixed(3)+' m³':'—'; } }
function drawDots(d){ const host=$('wmDots'); if(!host) return; const cls={ref:'dref',len:'dlen',diam:'ddiam'};
  let h=''; ['ref','len','diam'].forEach(s=>{ (d.m[s]||[]).forEach(p=>{ h+='<span class="wm-dot '+cls[s]+'" style="left:'+p.xPct+'%;top:'+p.yPct+'%"></span>'; });
    if((d.m[s]||[]).length===2){ const a=d.m[s][0],b2=d.m[s][1]; h+='<span class="wm-line '+cls[s]+'" style="left:'+a.xPct+'%;top:'+a.yPct+'%;width:'+Math.hypot((b2.xPct-a.xPct),(b2.yPct-a.yPct))+'%;transform:rotate('+Math.atan2((b2.yPct-a.yPct),(b2.xPct-a.xPct))+'rad)"></span>'; } });
  host.innerHTML=h;
}
function saveWoodLog(){
  const d=woodDraft; const r=measureResults(d);
  const log={ id:'log_'+Date.now(), date:new Date().toISOString().slice(0,10), dateAbattage:d.dateAbattage||'', speciesKey:d.speciesKey, speciesName:d.speciesName, lengthCm:r.lenCm, diamCm:r.diamCm, diam2Cm:r.diam2Cm||0, volumeM3:+r.vol.toFixed(3), numero:d.numero||'', provenance:d.provenance||'', etat:d.etat||'', qualite:d.qualite||'', epaisseur:d.epaisseur||'', note:d.note||'', photo:d.photo||'' };
  if(d.speciesKey) STORE.woodLastSpecies={key:d.speciesKey,name:d.speciesName};
  STORE.woodStock.push(log);
  if(!saveStoreOk()){ STORE.woodStock.pop(); alert('Stockage plein — grume non enregistrée. Supprime des photos/grumes.'); return; }
  woodDraft=null; goRoot(rWood,'projet bois');
}

/* ============================================================
   ATELIER G270 — aide pratique persistante (à côté des cours)
   4 sections : dépannage · entretien · fiche du camion · repérage photos.
   Données du camion stockées à la racine du STORE (un seul véhicule).
   ============================================================ */
function g270S(){ if(!STORE.g270) STORE.g270={sheet:{},fait:{},journal:[]};
  if(!STORE.g270.pannes) STORE.g270.pannes={};
  if(STORE.g270.panne){ if(!STORE.g270.pannes.demarrage) STORE.g270.pannes.demarrage=STORE.g270.panne; delete STORE.g270.panne; }
  if(!STORE.g270.conso) STORE.g270.conso={refs:{},buy:{},custom:[]};
  if(!STORE.g270.conso.refs) STORE.g270.conso.refs={}; if(!STORE.g270.conso.buy) STORE.g270.conso.buy={};
  if(!Array.isArray(STORE.g270.conso.custom)) STORE.g270.conso.custom=[];
  if(!STORE.g270.sheet) STORE.g270.sheet={}; if(!STORE.g270.fait) STORE.g270.fait={};
  if(!Array.isArray(STORE.g270.journal)) STORE.g270.journal=[]; return STORE.g270; }

/* G270_DEP, G270_TUTO, G270_PANNE : fournis par g270_atelier.js (window.*). */
const G270_TASKS=[
  {key:'purge_air', t:'Purge des réservoirs d\'air', f:'chaque jour'},
  {key:'niveaux',   t:'Niveaux (huile moteur, refroidissement)', f:'chaque semaine'},
  {key:'pneus',     t:'Pression & état des pneus', f:'chaque semaine'},
  {key:'graissage', t:'Graissage des croisillons', f:'périodique'},
  {key:'vidange',   t:'Vidange huile moteur + filtre', f:'périodique'},
  {key:'filtre_air',t:'Filtre à air', f:'périodique'},
  {key:'filtre_go', t:'Filtre à gasoil + décanteur (eau)', f:'périodique'},
  {key:'assecheur', t:'Cartouche d\'assécheur d\'air', f:'périodique'},
  {key:'freins',    t:'Garnitures de frein & jeux', f:'périodique'},
  {key:'boite_pont',t:'Niveaux boîte & pont, garde d\'embrayage', f:'périodique'}
];
const G270_FIELDS=[
  {key:'immat',   t:'Immatriculation'},
  {key:'vin',     t:'N° de série (VIN)'},
  {key:'moteur',  t:'Réf. moteur (MIDR)'},
  {key:'boite',   t:'Réf. boîte de vitesses'},
  {key:'wabco',   t:'Réfs WABCO (valves)'},
  {key:'huile_m', t:'Huile moteur (type / capacité)'},
  {key:'refroid', t:'Refroidissement (type / capacité)'},
  {key:'pneu_av', t:'Pression pneus AV'},
  {key:'pneu_ar', t:'Pression pneus AR'},
  {key:'couple',  t:'Couple de serrage des roues'},
  {key:'notes',   t:'Notes', big:true}
];

function openElagGuide(){ go(renderElagGuide,'guide arbres'); }
function renderElagGuide(){
  mode='learn';
  $('atfTitle').textContent='Guide d’élagage par arbre';
  let h='<p class="atf-lead">Chaque arbre a ses règles : sa période, sa tolérance à la taille, ses méthodes et ses pièges. Touche un arbre pour dérouler.</p>';
  (window.ELAG_GUIDE||[]).forEach(g=>{
    h+='<div class="dep-cat">'+esc(g.cat)+' — '+g.arbres.length+'</div>';
    g.arbres.forEach(a=>{
      h+='<details class="dep-item arb"><summary><span class="arb-ic">'+a.ic+'</span><span class="dep-s">'+esc(a.n)+'</span><span class="dep-c">'+esc(a.tol)+'</span></summary>'+
        '<div class="dep-k"><div class="arb-row"><b>📅 Période :</b> '+esc(a.per)+'</div>'+
        '<div class="arb-row"><b>✂️ Méthodes :</b><ul class="arb-ul">'+a.meth.map(m=>'<li>'+esc(m)+'</li>').join('')+'</ul></div>'+
        '<div class="arb-warn">⚠️ '+esc(a.warn)+'</div></div></details>';
    });
  });
  h+='<p class="atf-note">Rappels transversaux : coupe en 3 temps, au col de branche, sections petites, outils propres — voir les cours du domaine.</p>';
  $('atfBody').innerHTML=h;
  show('scAtelierFlow',{accent:'#557A3C',nav:'domains'});
}
/* ====== Ateliers par domaine : aide pratique qui reste avec les cours (patron G270) ====== */
function domAtelierS(k){ if(!STORE.domAteliers) STORE.domAteliers={}; if(!STORE.domAteliers[k]) STORE.domAteliers[k]={done:{}}; if(!STORE.domAteliers[k].done) STORE.domAteliers[k].done={}; return STORE.domAteliers[k]; }
function openDomAtelier(k){ go(()=>renderDomAtelier(k),'atelier'); }
function renderDomAtelier(k,keep){
  mode='learn'; const A=(window.DOM_ATELIERS||{})[k]; const s=D.SKILLS[k]; const st=domAtelierS(k);
  const today=new Date().toISOString().slice(0,10);
  if(!A||!s){ $('atfBody').innerHTML='<p class="atf-note">Atelier indisponible.</p>'; if(!keep) show('scAtelierFlow',{accent:'#8C4A4A',nav:'domains'}); return; }
  $('atfTitle').textContent='Atelier — '+s.name.replace(/&amp;/g,'&');
  let h='<p class="atf-lead">'+esc(A.sub)+'</p>';
  A.sections.forEach(sec=>{
    if(sec.type==='check'){
      const dn=sec.items.filter((x,i)=>st.done[sec.k+'_'+i]).length;
      h+='<div class="dep-cat">'+esc(sec.t)+' — '+dn+' / '+sec.items.length+'</div><ol class="tuto-steps big check">';
      sec.items.forEach((x,i)=>{ const on=!!st.done[sec.k+'_'+i];
        h+='<li class="'+(on?'done':'')+'"><button class="pan-chk'+(on?' on':'')+'" data-dchk="'+sec.k+'_'+i+'" aria-label="fait">'+(on?'✓':'')+'</button><div class="pan-stx">'+esc(x)+'</div></li>'; });
      h+='</ol>';
      if(dn) h+='<button class="mnt-btn" data-dreset="'+sec.k+'">↺ Tout décocher — réutiliser la liste</button>';
    } else if(sec.type==='memo'){
      h+='<div class="dep-cat">'+esc(sec.t)+'</div>';
      sec.items.forEach(it=>{ h+='<details class="dep-item arb"><summary><span class="arb-ic">'+(sec.ic||'📌')+'</span><span class="dep-s">'+esc(it.q)+'</span></summary><div class="dep-k">'+esc(it.a)+'</div></details>'; });
    } else {
      h+='<div class="dep-cat">'+esc(sec.t)+'</div><ul class="arb-ul dat-tips">'+sec.items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
    }
  });
  h+='<p class="atf-note">Cette aide reste disponible à côté des cours — le pourquoi et le détail sont dans les cours du domaine.</p>';
  $('atfBody').innerHTML=h;
  $('atfBody').querySelectorAll('[data-dchk]').forEach(b=>b.onclick=()=>{ const kk=b.dataset.dchk;
    if(st.done[kk]) delete st.done[kk]; else st.done[kk]=today; saveStore(); renderDomAtelier(k,true); });
  $('atfBody').querySelectorAll('[data-dreset]').forEach(b=>b.onclick=()=>{ const p=b.dataset.dreset+'_';
    Object.keys(st.done).forEach(x=>{ if(x.indexOf(p)===0) delete st.done[x]; }); saveStore(); renderDomAtelier(k,true); });
  if(!keep) show('scAtelierFlow',{accent:s.color,nav:'domains'});
}

/* ====== Nœuds : catalogue consultable + recherche + « je le sais » ====== */
function noeudS(){ if(!STORE.noeuds) STORE.noeuds={known:{}}; if(!STORE.noeuds.known) STORE.noeuds.known={}; return STORE.noeuds; }
function noeudKey(n){ return occNorm(n).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function noeudProgress(){ const st=noeudS(); let d=0,t=0; ((window.NOEUDS&&window.NOEUDS.cats)||[]).forEach(g=>g.noeuds.forEach(k=>{ t++; if(st.known[noeudKey(k.n)]) d++; })); return {done:d,total:t}; }
let _nkQ='';
function noeudListHTML(){
  const q=occNorm(_nkQ); const st=noeudS(); let h='', n=0;
  ((window.NOEUDS&&window.NOEUDS.cats)||[]).forEach(g=>{
    const items=g.noeuds.filter(k=>!q||occNorm(k.n+' '+(k.aka||'')+' '+k.usage).includes(q));
    if(!items.length) return; n+=items.length;
    h+='<div class="dep-cat">'+esc((g.ic?g.ic+' ':'')+g.cat)+' — '+items.length+'</div>';
    items.forEach(k=>{ const key=noeudKey(k.n); const on=!!st.known[key];
      h+='<details class="dep-item arb"><summary><span class="arb-ic">➰</span><span class="dep-s">'+esc(k.n)+'</span><span class="dep-c">'+esc(k.diff)+'</span></summary><div class="dep-k">'+
         (k.aka?'<div class="nk-aka">aussi appelé : '+esc(k.aka)+'</div>':'')+
         '<div class="arb-row"><b>🎯 Usage :</b> '+esc(k.usage)+'</div>'+
         '<div class="arb-row"><b>➰ Le faire :</b><ol class="nk-steps">'+k.faire.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol></div>'+
         (k.tips?'<div class="arb-row"><b>💡 Astuce :</b> '+esc(k.tips)+'</div>':'')+
         (k.warn?'<div class="arb-warn">⚠️ '+esc(k.warn)+'</div>':'')+
         '<button class="mnt-btn'+(on?'':' add')+'" data-nk="'+key+'">'+(on?'✓ Je le sais':'☐ Je le sais')+'</button>'+
         '</div></details>';
    });
  });
  if(!n) h='<p class="atf-note">Aucun nœud trouvé — essaie un autre mot.</p>';
  return h;
}
function bindNoeudToggles(){
  $('atfBody').querySelectorAll('[data-nk]').forEach(b=>b.onclick=()=>{ const st=noeudS(), key=b.dataset.nk;
    if(st.known[key]) delete st.known[key]; else st.known[key]=1; saveStore();
    const on=!!st.known[key]; b.textContent=on?'✓ Je le sais':'☐ Je le sais'; b.className='mnt-btn'+(on?'':' add');
    const cc=$('nkCount'); if(cc){ const pr=noeudProgress(); cc.textContent=pr.done+' / '+pr.total+' connus'; } });
}
function openNoeuds(){ _nkQ=''; go(renderNoeuds,'nœuds'); }
function renderNoeuds(){
  mode='learn'; const N=window.NOEUDS; const pr=noeudProgress();
  $('atfTitle').textContent=N.name;
  let h='<p class="atf-lead">'+esc(N.meta)+'. <b id="nkCount">'+pr.done+' / '+pr.total+' connus</b>. Touche un nœud pour dérouler ; coche ceux que tu maîtrises.</p>';
  h+='<input id="nkSearch" class="occ-search" type="text" placeholder="🔎 Rechercher un nœud (nom ou usage)" value="'+esc(_nkQ)+'">';
  h+='<div id="nkList">'+noeudListHTML()+'</div>';
  h+='<p class="atf-note">30 nœuds classés par famille. Visuels non embarqués (app hors-ligne) : les étapes sont écrites pas à pas.</p>';
  $('atfBody').innerHTML=h; bindNoeudToggles();
  const s=$('nkSearch'); if(s) s.oninput=()=>{ _nkQ=s.value; const l=$('nkList'); if(l){ l.innerHTML=noeudListHTML(); bindNoeudToggles(); } };
  show('scAtelierFlow',{accent:N.color,nav:'domains'});
}

/* ====== Cartographie du domaine : registre des parcelles (partagé, éditable) ====== */
function cartoS(){ if(!STORE.carto){ const seed=(window.CARTO_SEED&&window.CARTO_SEED.parcelles)||[]; STORE.carto={parcelles:JSON.parse(JSON.stringify(seed)), note:''}; saveStore(); }
  if(!Array.isArray(STORE.carto.parcelles)) STORE.carto.parcelles=[];
  /* migration : ajoute les contours (geo) aux registres créés avant leur intégration, sans écraser usage/note */
  const seed=(window.CARTO_SEED&&window.CARTO_SEED.parcelles)||[]; let changed=false;
  seed.forEach(sp=>{ if(!sp.geo) return; const p=STORE.carto.parcelles.find(x=>x.id===sp.id||(x.num===sp.num&&x.insee===sp.insee));
    if(p&&!p.geo){ p.geo=sp.geo; if(!p.cont) p.cont=sp.cont; changed=true; } });
  if(!Array.isArray(STORE.carto.pois)){ STORE.carto.pois=JSON.parse(JSON.stringify((window.CARTO_SEED&&window.CARTO_SEED.pois)||[])); changed=true; }
  if(changed) saveStore();
  return STORE.carto; }
function cartoAddPoi(lon,lat){ const s=cartoS(); if(!Array.isArray(s.pois)) s.pois=[];
  const nm=(typeof prompt!=='undefined')?prompt('Nom du point (ex : 🐑 Moutons, 💧 Abreuvoir, 🛖 Cabanon) :',''):null; if(nm==null) return false;
  s.pois.push({id:'poi_'+Date.now().toString(36), lon:+lon.toFixed(6), lat:+lat.toFixed(6), n:(nm.trim()||'📍 Point')}); saveStore(); return true; }
function cartoEditPoi(id){ const s=cartoS(); const po=(s.pois||[]).find(x=>x.id===id); if(!po) return;
  const nm=(typeof prompt!=='undefined')?prompt('Renommer ce point (champ vide = supprimer) :', po.n||''):po.n; if(nm==null) return;
  if(!nm.trim()){ s.pois=s.pois.filter(x=>x.id!==id); } else { po.n=nm.trim(); } saveStore(); }
function cartoProgress(){ const p=cartoS().parcelles; return {done:p.filter(x=>x.usage).length, total:p.length}; }
function cartoTotalHa(){ return cartoS().parcelles.reduce((a,p)=>a+(+p.cont||0),0)/10000; }
function cartoSurf(cont){ const v=+cont||0; return v>=10000?(v/10000).toFixed(2)+' ha':v+' m²'; }
// miniature aérienne d'une parcelle : ortho IGN de son emprise + contour (charge en ligne)
function cartoThumb(p){ const rings=geoRings(p.geo); if(!rings.length) return '';
  let a=1/0,b=1/0,c=-1/0,d=-1/0; rings.forEach(r=>r.forEach(pt=>{ if(pt[0]<a)a=pt[0]; if(pt[0]>c)c=pt[0]; if(pt[1]<b)b=pt[1]; if(pt[1]>d)d=pt[1]; }));
  const mx=(c-a)*0.15||0.0003, my=(d-b)*0.15||0.0003; a-=mx;c+=mx;b-=my;d+=my;
  const midLat=(b+d)/2, ls=Math.cos(midLat*Math.PI/180)||1, wW=(c-a)*ls||1e-9, wH=(d-b)||1e-9;
  const W=600, H=Math.max(120,Math.round(W*wH/wW));
  const PR=pt=>[ (pt[0]-a)*ls/wW*W, (d-pt[1])/wH*H ];
  const url='https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ORTHOIMAGERY.ORTHOPHOTOS&STYLES=&CRS=EPSG:4326&BBOX='+b+','+a+','+d+','+c+'&WIDTH='+W+'&HEIGHT='+H+'&FORMAT=image/jpeg';
  let poly=''; rings.forEach(r=>{ poly+='<polygon points="'+r.map(PR).map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')+'" fill="rgba(255,214,0,.10)" stroke="#ffd400" stroke-width="2.4"/>'; });
  // meet = parcelle entière visible (pas de rognage)
  return '<svg class="cm-thumb" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><image href="'+esc(url)+'" x="0" y="0" width="'+W+'" height="'+H+'" preserveAspectRatio="none"/>'+poly+'</svg>'; }
function openCarto(){ go(renderCarto,'cartographie'); }
function renderCarto(){
  mode='learn'; const c=cartoS(); const pr=cartoProgress();
  $('atfTitle').textContent='Cartographie du domaine';
  let h='<p class="atf-lead">'+esc((window.CARTO_SEED&&window.CARTO_SEED.domaine)||'Domaine')+', parcelle par parcelle. <b>'+c.parcelles.length+' parcelles</b> · <b>'+cartoTotalHa().toFixed(2)+' ha</b> · '+pr.done+' / '+pr.total+' avec un usage.</p>';
  h+='<button class="mnt-btn" id="cartoMap" style="width:100%">🗺️ Voir la carte — '+cartoGeoCount()+' / '+c.parcelles.length+' géolocalisées</button>';
  h+='<button class="mnt-btn add" id="cartoAdd" style="width:100%;margin-top:6px">+ Ajouter une parcelle</button>';
  h+='<details class="wood-exp"><summary>Importer le cadastre (GeoJSON)</summary><p class="atf-note">Colle le GeoJSON des parcelles (depuis <b>cadastre.data.gouv.fr</b>). Je relie chaque forme à ta parcelle (par n° + commune).</p><button class="mnt-btn add" id="cartoFileBtn" style="width:100%">📁 Choisir un fichier GeoJSON…</button><input type="file" id="cartoFile" accept=".json,.geojson,application/json,application/geo+json" style="display:none"><p class="atf-note" style="text-align:center">— ou colle le texte —</p><textarea id="cartoGj" class="wexp-ta" rows="4" placeholder=\'{"type":"FeatureCollection","features":[…]}\'></textarea><button class="mnt-btn add" id="cartoImp" style="width:100%;margin-top:6px">Importer le texte</button></details>';
  const byC={}; c.parcelles.forEach(p=>{ const k=p.insee||'—'; (byC[k]||(byC[k]=[])).push(p); });
  Object.keys(byC).sort().forEach(insee=>{ const list=byC[insee]; const sha=(list.reduce((a,p)=>a+(+p.cont||0),0)/10000).toFixed(2);
    h+='<div class="dep-cat">Commune '+esc(insee)+' — '+list.length+' · '+sha+' ha</div>';
    list.slice().sort((a,b)=>(a.num||'').localeCompare(b.num||'')).forEach(p=>{
      h+='<button class="mod-row'+(p.usage?' full':'')+'" type="button" data-cp="'+esc(p.id)+'">'+(p.geo?cartoThumb(p):'<span class="arb-ic">🗺️</span>')+'<span class="mod-mid"><span class="dep-s">Parcelle '+esc(p.num)+(p.usage?' · '+esc(p.usage):'')+'</span><span class="mod-s">'+esc('Sect. '+(p.section||'?')+' · F'+(p.feuille||'?'))+(p.note?' · '+esc(p.note):'')+'</span></span><span class="dep-c">'+esc(cartoSurf(p.cont))+'</span></button>';
    });
  });
  h+='<p class="atf-note">Cartographie en cours — touche une parcelle pour renseigner son usage (bois, pré, bâti…). Données partagées, visibles par tous les comptes.</p>';
  $('atfBody').innerHTML=h;
  $('atfBody').querySelectorAll('[data-cp]').forEach(b=>b.onclick=()=>openCartoEdit(b.dataset.cp));
  const add=$('cartoAdd'); if(add) add.onclick=()=>openCartoEdit(null);
  const mp=$('cartoMap'); if(mp) mp.onclick=()=>openCartoMap();
  const imp=$('cartoImp'); if(imp) imp.onclick=()=>{ const t=($('cartoGj').value||'').trim(); if(!t){ return; } const r=cartoImport(t); if(r.error){ alert('Import : '+r.error); return; } alert(r.matched+' parcelle(s) reliée(s) sur '+r.total+'.'); renderCarto(); };
  const fb=$('cartoFileBtn'), fi=$('cartoFile');
  if(fb&&fi){ fb.onclick=()=>fi.click();
    fi.onchange=()=>{ const f=fi.files&&fi.files[0]; if(!f||typeof FileReader==='undefined') return;
      const rd=new FileReader(); rd.onload=()=>{ const r=cartoImport(String(rd.result||'')); if(r.error){ alert('Import : '+r.error); return; } alert(r.matched+' parcelle(s) reliée(s) sur '+r.total+' (fichier '+(f.name||'')+').'); renderCarto(); }; rd.readAsText(f); }; }
  show('scAtelierFlow',{accent:'#3E7C4E',nav:'domains'});
}
function openCartoEdit(id){ go(()=>renderCartoEdit(id),'parcelle'); }
function renderCartoEdit(id){
  mode='learn'; const c=cartoS(); const p=id?c.parcelles.find(x=>x.id===id):null; const isNew=!p;
  const d=p?Object.assign({},p):{id:'p_'+Date.now(),num:'',section:'0A',feuille:'',insee:'',cont:'',usage:'',note:''};
  $('atfTitle').textContent=isNew?'Nouvelle parcelle':('Parcelle '+(d.num||''));
  const usages=['','Bois','Pré / prairie','Bâti','Cour / accès','Verger','Jardin','Friche','Eau / ruisseau','Autre'];
  let h='';
  if(p&&p.geo) h+='<div class="cf-thumb">'+cartoThumb(p)+'<span class="cf-thumb-tag">🛰 Vue aérienne — en ligne</span></div>';
  h+='<div class="field"><label>N° de parcelle</label><input id="cfNum" value="'+esc(d.num)+'" placeholder="ex : 0961"></div>';
  h+='<div class="field"><label>Section</label><input id="cfSec" value="'+esc(d.section)+'"></div>';
  h+='<div class="field"><label>Feuille</label><input id="cfFeu" value="'+esc(d.feuille)+'"></div>';
  h+='<div class="field"><label>Commune (INSEE)</label><input id="cfIns" value="'+esc(d.insee)+'" placeholder="ex : 09060"></div>';
  h+='<div class="field"><label>Contenance (m²)</label><input id="cfCont" type="number" value="'+esc(String(d.cont||''))+'"></div>';
  h+='<div class="field"><label>Usage</label><select id="cfUse">'+usages.map(u=>'<option'+(d.usage===u?' selected':'')+'>'+(u||'—')+'</option>').join('')+'</select></div>';
  h+='<div class="field"><label>Note</label><input id="cfNote" value="'+esc(d.note)+'" placeholder="remarque"></div>';
  h+='<button class="save" id="cfSave" style="width:100%;margin-top:6px">Enregistrer</button>';
  if(!isNew) h+='<button class="demolink del" id="cfDel" style="width:100%;margin-top:10px">Supprimer cette parcelle</button>';
  $('atfBody').innerHTML=h;
  $('cfSave').onclick=()=>{ d.num=($('cfNum').value||'').trim(); d.section=($('cfSec').value||'').trim(); d.feuille=($('cfFeu').value||'').trim(); d.insee=($('cfIns').value||'').trim(); d.cont=($('cfCont').value||'').trim(); const u=$('cfUse').value; d.usage=(u==='—'?'':u); d.note=($('cfNote').value||'').trim();
    if(!d.num){ alert('Indique au moins le n° de parcelle.'); return; }
    if(p) Object.assign(p,d); else c.parcelles.push(d);
    saveStore(); navBack(); };
  if($('cfDel')) $('cfDel').onclick=()=>{ c.parcelles=c.parcelles.filter(x=>x.id!==id); saveStore(); navBack(); };
  show('scAtelierFlow',{accent:'#3E7C4E',nav:'domains'});
}

/* ---- carte : géométrie, import GeoJSON, rendu SVG interactif ---- */
function geoRings(g){ if(!g) return []; if(g.type==='Polygon') return g.coordinates||[];
  if(g.type==='MultiPolygon'){ const r=[]; (g.coordinates||[]).forEach(poly=>(poly||[]).forEach(ring=>r.push(ring))); return r; } return []; }
function cartoGeoCount(){ return cartoS().parcelles.filter(p=>p.geo&&geoRings(p.geo).length).length; }
function cartoUsageColor(u){ return ({'Bois':'#3E7C4E','Pré / prairie':'#9BB84E','Bâti':'#8A7B6B','Cour / accès':'#B0A18C','Verger':'#C58A33','Jardin':'#7BA05B','Friche':'#A98B5A','Eau / ruisseau':'#4A7A8C','Autre':'#9A8560'}[u])||'#B9AE97'; }
function cartoImport(text){
  let fc; try{ fc=JSON.parse(text); }catch(e){ return {error:'JSON illisible'}; }
  const feats=fc.type==='FeatureCollection'?(fc.features||[]):(fc.type==='Feature'?[fc]:(Array.isArray(fc)?fc:[]));
  if(!feats.length) return {error:'aucune parcelle (FeatureCollection attendu)'};
  const parc=cartoS().parcelles; let matched=0; const strip=s=>String(s||'').replace(/^0+/,'')||'0';
  feats.forEach(f=>{ if(!f||!f.geometry) return; const pr=f.properties||{};
    let num=pr.numero||'', ins=pr.commune||'';
    if((!num||!ins)&&typeof pr.id==='string'&&pr.id.length>=14){ ins=ins||pr.id.slice(0,5); num=num||pr.id.slice(10,14); }
    const nN=strip(num); const p=parc.find(x=> strip(x.num)===nN && (!ins||x.insee===ins));
    if(p){ p.geo=f.geometry; if(pr.contenance) p.cont=+pr.contenance; matched++; }
  });
  saveStore(); return {matched, total:parc.length};
}
function cartoBBox(){ let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;
  cartoS().parcelles.forEach(p=>geoRings(p.geo).forEach(ring=>ring.forEach(pt=>{ const x=pt[0],y=pt[1]; if(x<a)a=x; if(x>c)c=x; if(y<b)b=y; if(y>d)d=y; })));
  return isFinite(a)?{minx:a,miny:b,maxx:c,maxy:d}:null; }
const CM_VW=320, CM_VH=360, CM_PAD=14;
function cartoProject(bb){ const midLat=(bb.miny+bb.maxy)/2; const lonScale=Math.cos(midLat*Math.PI/180)||1;
  const wW=(bb.maxx-bb.minx)*lonScale||1e-9, wH=(bb.maxy-bb.miny)||1e-9;
  const s=Math.min((CM_VW-2*CM_PAD)/wW,(CM_VH-2*CM_PAD)/wH); const oX=(CM_VW-wW*s)/2, oY=(CM_VH-wH*s)/2;
  return pt=>[ oX+(pt[0]-bb.minx)*lonScale*s, oY+(bb.maxy-pt[1])*s ]; }
function cmCentroid(ring,proj){ let sx=0,sy=0,n=0; (ring||[]).forEach(pt=>{ const q=proj(pt); sx+=q[0]; sy+=q[1]; n++; }); return n?[sx/n,sy/n]:[0,0]; }
// rectangle (repère SVG) couvrant exactement le bbox — pour poser un fond image calé
function cartoImgRect(bb){ const midLat=(bb.miny+bb.maxy)/2, lonScale=Math.cos(midLat*Math.PI/180)||1;
  const wW=(bb.maxx-bb.minx)*lonScale||1e-9, wH=(bb.maxy-bb.miny)||1e-9;
  const s=Math.min((CM_VW-2*CM_PAD)/wW,(CM_VH-2*CM_PAD)/wH), oX=(CM_VW-wW*s)/2, oY=(CM_VH-wH*s)/2;
  return {x:oX,y:oY,w:wW*s,h:wH*s}; }
// une seule image ortho EPSG:4326 calée sur le bbox — IGN (officiel FR) ou ESRI (mondial)
function cartoSatUrl(bb,prov,W){ const dLon=(bb.maxx-bb.minx)||1e-9, dLat=(bb.maxy-bb.miny)||1e-9;
  W=W||1024; const H=Math.max(1,Math.round(W*dLat/dLon));
  const ignWms=lay=>'https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS='+lay+'&STYLES=&CRS=EPSG:4326&BBOX='+
    bb.miny+','+bb.minx+','+bb.maxy+','+bb.maxx+'&WIDTH='+W+'&HEIGHT='+H+'&FORMAT=image/jpeg';
  if(prov==='ign') return ignWms('ORTHOIMAGERY.ORTHOPHOTOS');
  if(prov==='ignplan') return ignWms('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2'); // carte topo : chemins & sentiers
  return 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox='+
    bb.minx+','+bb.miny+','+bb.maxx+','+bb.maxy+'&bboxSR=4326&imageSR=4326&size='+W+','+H+'&format=jpg&f=image'; }
// fournisseurs de fond : cadastre → ortho IGN → ortho ESRI → Plan IGN (chemins/sentiers)
const CM_LAYERS=['plan','ign','esri','ignplan'];
function cmSatMeta(l){ return l==='ign'?{ic:'🇫🇷',nom:'IGN BD ORTHO®',attr:'IGN — BD ORTHO® (data.geopf.fr)'}
  :l==='esri'?{ic:'🌍',nom:'Esri World Imagery',attr:'Imagerie © Esri, Maxar, Earthstar Geographics'}
  :l==='ignplan'?{ic:'🥾',nom:'Plan IGN — chemins & sentiers',attr:'Plan IGN® © IGN (data.geopf.fr)'}:{ic:'🛰',nom:'',attr:''}; }
let _cmZoom=1,_cmX=0,_cmY=0,_cmSel='',_cmLayer='ign';
let _cmGeo=null,_cmWatch=null,_cmProj=null,_cmUnproj=null,_cmPxDegLat=0,_cmGeoFirst=false,_cmPaths=true,_cmFollow=false;
let _cmMeasure=false,_cmMpts=[],_cmAddPoi=false;
const CM_OPEN_ZOOM=4; // petit zoom appliqué au premier point GPS (carte collée à la position)
const CM_LBL_Z=2;   // n° de parcelles visibles à partir de ce zoom
const CM_CLBL_Z=3;  // noms de chemins visibles à partir de ce zoom
// projection inverse : point (repère viewBox) → [lon,lat]
function cartoUnproject(bb){ const midLat=(bb.miny+bb.maxy)/2, lonScale=Math.cos(midLat*Math.PI/180)||1;
  const wW=(bb.maxx-bb.minx)*lonScale||1e-9, wH=(bb.maxy-bb.miny)||1e-9;
  const s=Math.min((CM_VW-2*CM_PAD)/wW,(CM_VH-2*CM_PAD)/wH), oX=(CM_VW-wW*s)/2, oY=(CM_VH-wH*s)/2;
  return q=>[ bb.minx+(q[0]-oX)/(lonScale*s), bb.maxy-(q[1]-oY)/s ]; }
// mesures (comme « mesurer une distance » sur Maps)
function cmHaversine(a,b){ const R=6371000, t=Math.PI/180, dLa=(b[1]-a[1])*t, dLo=(b[0]-a[0])*t, la1=a[1]*t, la2=b[1]*t;
  const h=Math.sin(dLa/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.min(1,Math.sqrt(h))); }
function cmMeasDist(){ let d=0; for(let i=1;i<_cmMpts.length;i++) d+=cmHaversine(_cmMpts[i-1],_cmMpts[i]); return d; }
function cmPolyArea(pts){ if(pts.length<3) return 0; const midLat=pts.reduce((a,p)=>a+p[1],0)/pts.length, k=Math.cos(midLat*Math.PI/180)*111320, mL=111320;
  let s=0; for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; s+=(a[0]*k)*(b[1]*mL)-(b[0]*k)*(a[1]*mL); } return Math.abs(s)/2; }
function cmFmtDist(m){ return m<1000?Math.round(m)+' m':(m/1000).toFixed(m<10000?2:1)+' km'; }
function cmFmtArea(a){ return a<10000?Math.round(a)+' m²':(a/10000).toFixed(2)+' ha'; }
function cmMeasVal(){ if(_cmMpts.length<2) return 'Touche la carte pour poser des points';
  let t='📏 '+cmFmtDist(cmMeasDist()); if(_cmMpts.length>=3) t+=' · '+cmFmtArea(cmPolyArea(_cmMpts))+' (surface)'; return t; }
function cmMeasMarkup(){ if(!_cmProj||!_cmMpts.length) return ''; const P=_cmMpts.map(_cmProj); let s='';
  if(P.length>=3) s+='<polygon points="'+P.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')+'" fill="rgba(43,108,255,.14)" stroke="none" pointer-events="none"/>';
  if(P.length>=2) s+='<polyline points="'+P.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')+'" fill="none" stroke="#2b6cff" stroke-width="1" stroke-dasharray="2 1.4" stroke-linejoin="round" pointer-events="none"/>';
  P.forEach(q=>{ s+='<circle cx="'+q[0].toFixed(1)+'" cy="'+q[1].toFixed(1)+'" r="1.8" fill="#fff" stroke="#2b6cff" stroke-width="1" pointer-events="none"/>'; });
  return s; }
function cmUpdateMeas(){ const g=document.getElementById('cmMeas'); if(g) g.innerHTML=cmMeasMarkup();
  const v=document.getElementById('cmMeasVal'); if(v) v.textContent=cmMeasVal(); }
// marqueur « je suis ici » (dans le groupe zoomable → suit pan/zoom)
function cmMeMarkup(){ if(!_cmGeo||!_cmProj) return '';
  const v=_cmProj([_cmGeo.lon,_cmGeo.lat]); const accPx=Math.max(1.6,Math.min(120,(_cmGeo.acc/111320)*_cmPxDegLat));
  return '<circle cx="'+v[0].toFixed(1)+'" cy="'+v[1].toFixed(1)+'" r="'+accPx.toFixed(1)+'" fill="#2b6cff" fill-opacity=".14" stroke="#2b6cff" stroke-opacity=".55" stroke-width=".4"/>'+
    '<circle cx="'+v[0].toFixed(1)+'" cy="'+v[1].toFixed(1)+'" r="2.6" fill="#2b6cff" stroke="#fff" stroke-width="1.1"/>'; }
function cmDrawMe(){ const g=document.getElementById('cmMe'); if(g) g.innerHTML=cmMeMarkup(); }
function cmApplyLabels(){ const pl=document.getElementById('cmPLbl'); if(pl) pl.style.display=(_cmZoom>=CM_LBL_Z?'':'none');
  const cl=document.getElementById('cmCLbl'); if(cl) cl.style.display=(_cmZoom>=CM_CLBL_Z?'':'none'); }
function cmCenterMe(){ if(!_cmGeo||!_cmProj) return; const v=_cmProj([_cmGeo.lon,_cmGeo.lat]);
  _cmX=CM_VW/2 - v[0]*_cmZoom; _cmY=CM_VH/2 - v[1]*_cmZoom; const g=document.getElementById('cmG'); if(g) g.setAttribute('transform',cmTransform()); cmApplyLabels(); }
function cmStopGeo(){ if(_cmWatch!=null && typeof navigator!=='undefined' && navigator.geolocation) try{ navigator.geolocation.clearWatch(_cmWatch); }catch(_){}
  _cmWatch=null; }
function cmToggleGeo(){ if(_cmWatch!=null){ cmStopGeo(); _cmGeo=null; renderCartoMap(); return; }
  if(typeof navigator==='undefined' || !navigator.geolocation){ alert('Géolocalisation indisponible sur cet appareil.'); return; }
  _cmGeoFirst=true;
  _cmWatch=navigator.geolocation.watchPosition(pos=>{
      _cmGeo={lon:pos.coords.longitude,lat:pos.coords.latitude,acc:pos.coords.accuracy||25,ts:Date.now()};
      cmDrawMe();
      if(_cmGeoFirst){ _cmGeoFirst=false; _cmZoom=CM_OPEN_ZOOM; cmCenterMe(); }
      else if(_cmFollow){ cmCenterMe(); } },
    err=>{ cmStopGeo(); _cmFollow=false; alert('Position introuvable : '+((err&&err.message)||'autorisation refusée ?')); renderCartoMap(); },
    {enableHighAccuracy:true,maximumAge:4000,timeout:20000});
  renderCartoMap(); }
function cmTransform(){ return 'translate('+_cmX.toFixed(1)+','+_cmY.toFixed(1)+') scale('+_cmZoom.toFixed(3)+')'; }
const CM_MINZ=0.3; // dézoom possible sous 1 pour voir les parcelles voisines / la ville
function cmZoomAt(f,cx,cy){ const z=Math.max(CM_MINZ,Math.min(12,_cmZoom*f)); if(z===_cmZoom) return; _cmX=cx-(cx-_cmX)*(z/_cmZoom); _cmY=cy-(cy-_cmY)*(z/_cmZoom); _cmZoom=z; }
function cmZoomBy(f){ cmZoomAt(f,CM_VW/2,CM_VH/2); }
// convertit un point écran → coordonnées viewBox de la carte (tient compte du letterbox 'meet')
function cmClientToVB(svg,clientX,clientY){ const r=svg.getBoundingClientRect(); const s=Math.min(r.width/CM_VW,r.height/CM_VH)||1;
  const offX=(r.width-CM_VW*s)/2, offY=(r.height-CM_VH*s)/2;
  return [ (clientX-r.left-offX)/s, (clientY-r.top-offY)/s ]; }
function openCartoMap(){ _cmZoom=1;_cmX=0;_cmY=0;_cmSel=''; _cmFollow=true; _cmGeoFirst=true; go(renderCartoMap,'carte');
  if(_cmWatch==null) cmToggleGeo(); }
function renderCartoMap(){
  mode='learn'; const parc=cartoS().parcelles; const bb=cartoBBox();
  $('atfTitle').textContent='Carte du domaine';
  if(!bb){ $('atfBody').innerHTML='<p class="atf-lead">Pas encore de contours. Reviens au registre et <b>importe le GeoJSON</b> du cadastre pour dessiner la carte.</p><button class="mnt-btn" id="cmBack" style="width:100%">← Registre</button>';
    $('cmBack').onclick=()=>navBack(); show('scAtelierFlow',{accent:'#3E7C4E',nav:'domains'}); return; }
  const proj=cartoProject(bb); const sat=(_cmLayer!=='plan'), ortho=(_cmLayer==='ign'||_cmLayer==='esri'); let inner='', labels='';
  _cmProj=proj; _cmUnproj=cartoUnproject(bb); { const p0=proj([bb.minx,bb.miny]), p1=proj([bb.minx,bb.miny+0.001]); _cmPxDegLat=Math.abs(p1[1]-p0[1])/0.001; }
  parc.forEach(p=>{ const rings=geoRings(p.geo); if(!rings.length) return; const col=cartoUsageColor(p.usage); const sel=(p.id===_cmSel);
    const fo=sat?(sel?'.30':'.10'):(sel?'.85':'.55'), stk=ortho?'#fff':(sel?'#111':'#5a4a2a'), sw=sat?(sel?'1.6':'.9'):(sel?'1.4':'.6');
    rings.forEach(ring=>{ const pts=ring.map(proj).map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ');
      inner+='<polygon points="'+pts+'" fill="'+col+'" fill-opacity="'+fo+'" stroke="'+stk+'" stroke-width="'+sw+'" data-cp="'+esc(p.id)+'"/>'; });
    const cc=cmCentroid(rings[0],proj); labels+='<text x="'+cc[0].toFixed(1)+'" y="'+cc[1].toFixed(1)+'" class="cm-lbl">'+esc(p.num)+'</text>';
  });
  let bats=''; const bg=(window.CARTO_SEED&&window.CARTO_SEED.batiments)||[];
  bg.forEach(b=>{ geoRings(b).forEach(ring=>{ const pts=ring.map(proj).map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ');
    bats+='<polygon points="'+pts+'" fill="#4A403A" fill-opacity=".92" stroke="#241d18" stroke-width=".5" pointer-events="none"/>'; }); });
  let paths=''; const chm=(window.CARTO_SEED&&window.CARTO_SEED.chemins)||[];
  if(_cmPaths){ chm.forEach(ch=>{ const pts=(ch.g||[]).map(proj).map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' '); if(!pts) return;
    const top=ch.t==='route'?'#ff8a3d':'#ffd400', dash=ch.t==='route'?'':(ch.t==='sentier'?'stroke-dasharray="1.6 1.8" ':'stroke-dasharray="3 2" ');
    paths+='<polyline points="'+pts+'" fill="none" stroke="#241d18" stroke-opacity=".5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>'+
      '<polyline points="'+pts+'" fill="none" stroke="'+top+'" stroke-width="1" '+dash+'stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>'; }); }
  // étiquettes des chemins nommés (1 par nom, sur le plus long tronçon)
  let clabels=''; if(_cmPaths){ const best={}; chm.forEach(ch=>{ if(!ch.n) return; const len=(ch.g||[]).length; if(!best[ch.n]||len>best[ch.n].len) best[ch.n]={g:ch.g,len}; });
    Object.keys(best).forEach(nm=>{ const g=best[nm].g, mid=g[Math.floor(g.length/2)]; if(!mid) return; const v=proj(mid);
      clabels+='<text x="'+v[0].toFixed(1)+'" y="'+v[1].toFixed(1)+'" class="cm-clbl">'+esc(nm)+'</text>'; }); }
  // points d'intérêt (poser/nommer soi-même) : marqueur cliquable + étiquette
  let poiMarks='', poiLbls=''; const POIS=(cartoS().pois||[]);
  POIS.forEach(po=>{ if(po.lon==null||po.lat==null) return; const v=proj([po.lon,po.lat]);
    poiMarks+='<g data-poi="'+esc(po.id)+'"><circle cx="'+v[0].toFixed(1)+'" cy="'+v[1].toFixed(1)+'" r="4.6" fill="rgba(0,0,0,0.001)"/><circle cx="'+v[0].toFixed(1)+'" cy="'+v[1].toFixed(1)+'" r="2" fill="#fff" stroke="#b23a2e" stroke-width="1.3"/></g>';
    poiLbls+='<text x="'+(v[0]+3.2).toFixed(1)+'" y="'+(v[1]-2.4).toFixed(1)+'" class="cm-poilbl">'+esc(po.n||'')+'</text>'; });
  const meta=cmSatMeta(_cmLayer);
  const rectFor=bb2=>{ const tl=proj([bb2.minx,bb2.maxy]), br=proj([bb2.maxx,bb2.miny]); return {x:tl[0],y:tl[1],w:br[0]-tl[0],h:br[1]-tl[1]}; };
  let bgImg=''; if(sat){
    // image large (contexte : parcelles voisines, ville) sous l'image nette du domaine
    const f=3.6, eLon=(bb.maxx-bb.minx)*(f-1)/2, eLat=(bb.maxy-bb.miny)*(f-1)/2;
    const WB={minx:bb.minx-eLon,maxx:bb.maxx+eLon,miny:bb.miny-eLat,maxy:bb.maxy+eLat};
    const rW=rectFor(WB), rC=rectFor(bb);
    bgImg='<image href="'+esc(cartoSatUrl(WB,_cmLayer,2048))+'" x="'+rW.x.toFixed(1)+'" y="'+rW.y.toFixed(1)+'" width="'+rW.w.toFixed(1)+'" height="'+rW.h.toFixed(1)+'" preserveAspectRatio="none"/>'+
      '<image href="'+esc(cartoSatUrl(bb,_cmLayer,1024))+'" x="'+rC.x.toFixed(1)+'" y="'+rC.y.toFixed(1)+'" width="'+rC.w.toFixed(1)+'" height="'+rC.h.toFixed(1)+'" preserveAspectRatio="none"/>'; }
  const sp=_cmSel?parc.find(x=>x.id===_cmSel):null;
  let h='<div class="cm-wrap cm-full no-swipe">'+
    '<svg id="cmSvg" viewBox="0 0 '+CM_VW+' '+CM_VH+'" class="cm-svg" preserveAspectRatio="xMidYMid meet"><g id="cmG" transform="'+cmTransform()+'">'+bgImg+inner+bats+paths+'<g id="cmCLbl">'+clabels+'</g><g id="cmPLbl">'+labels+poiLbls+'</g><g id="cmMeas">'+cmMeasMarkup()+'</g><g id="cmPOI">'+poiMarks+'</g><g id="cmMe">'+cmMeMarkup()+'</g></g></svg>'+
    '<div class="cm-title">'+(_cmAddPoi?'📌 Touche la carte pour poser un point':(sat?esc(meta.nom):'Domaine du Freyche'))+'</div>'+
    '<button id="cmBack" class="cm-close" title="Fermer la carte">✕</button>'+
    '<div class="cm-zoom">'+
      '<button id="cmReg" title="Registre des parcelles">≡</button>'+
      '<button id="cmRuler" class="'+(_cmMeasure?'onm':'')+'" title="Mesurer une distance">📏</button>'+
      '<button id="cmPoi" class="'+(_cmAddPoi?'onm':'')+'" title="Poser un point d\'intérêt">📌</button>'+
      '<button id="cmFit" title="Recadrer">⤢</button>'+
      (chm.length?'<button id="cmPaths" class="'+(_cmPaths?'onp':'')+'" title="Chemins & sentiers">🚶</button>':'')+
      '<button id="cmLayer" title="Fond : '+(sat?esc(meta.nom):'cadastre')+'">'+meta.ic+'</button>'+
      '<button id="cmGeo" class="'+(_cmFollow&&_cmWatch!=null?'on':'')+'" title="'+(_cmFollow?'Position GPS (carte collée) — toucher pour libérer':'Recoller la carte à ma position')+'">📍</button>'+
      '<button id="cmOut" title="Zoom −">−</button>'+
      '<button id="cmIn" title="Zoom +">+</button>'+
    '</div>'+
    (_cmMeasure?('<div class="cm-meas" id="cmMeasOut"><span id="cmMeasVal">'+esc(cmMeasVal())+'</span><span class="cm-meas-b"><button id="cmMeasUndo" title="Annuler le dernier point">↶</button><button id="cmMeasClear" title="Tout effacer">✕</button></span></div>'):'')+
    (sp?('<div class="cm-info"><div class="ci-main">Parcelle <b>'+esc(sp.num)+'</b></div><div class="ci-sub">'+esc(cartoSurf(sp.cont))+(sp.usage?' · '+esc(sp.usage):'')+(sp.note?' · '+esc(sp.note):'')+'</div><div class="ci-act"><button id="cmEdit">éditer</button><button id="cmDesel">✕</button></div></div>'):'')+
    '<div class="cm-cred">'+(sat?esc(meta.attr):'Cadastre © DGFiP')+(chm.length&&_cmPaths?' · chemins © OpenStreetMap':'')+'</div>'+
    ((_cmMeasure||_cmAddPoi)?'':'<div class="cm-area">🗺️ '+cartoTotalHa().toFixed(2)+' ha · '+parc.length+' parcelles</div>')+
    '</div>';
  $('atfBody').innerHTML=h;
  const svg=$('cmSvg'), G=()=>$('cmG');
  const applyT=()=>{ const g=G(); if(g) g.setAttribute('transform',cmTransform()); cmApplyLabels(); };
  // sélection d'une parcelle (tap simple, sans déplacement ; désactivée en mode mesure/point)
  $('atfBody').querySelectorAll('[data-cp]').forEach(el=>el.onclick=()=>{ if((svg&&svg._moved)||_cmMeasure||_cmAddPoi) return; _cmSel=el.dataset.cp; renderCartoMap(); });
  // clic sur un point d'intérêt : renommer / supprimer
  $('atfBody').querySelectorAll('[data-poi]').forEach(el=>el.onclick=()=>{ if((svg&&svg._moved)||_cmAddPoi||_cmMeasure) return; cartoEditPoi(el.dataset.poi); renderCartoMap(); });
  if(svg){ const pts=new Map(); let pan=null, pinch=null, lastTap=0;
    const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const scl=()=>{ const r=svg.getBoundingClientRect(); return Math.min(r.width/CM_VW,r.height/CM_VH)||1; };
    svg.onpointerdown=e=>{ if(svg.setPointerCapture) try{ svg.setPointerCapture(e.pointerId); }catch(_){}
      pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); svg._moved=false;
      if(pts.size===1){ pan={x:e.clientX,y:e.clientY,ox:_cmX,oy:_cmY}; }
      else if(pts.size===2){ const a=[...pts.values()]; pinch={d:dist(a[0],a[1]),z0:_cmZoom, mid:cmClientToVB(svg,(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2)}; pan=null; } };
    svg.onpointermove=e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pinch&&pts.size>=2){ const a=[...pts.values()]; const nd=dist(a[0],a[1]); if(pinch.d>0){ const nz=Math.max(1,Math.min(12,pinch.z0*(nd/pinch.d)));
          const cx=pinch.mid[0],cy=pinch.mid[1]; _cmX=cx-(cx-_cmX)*(nz/_cmZoom); _cmY=cy-(cy-_cmY)*(nz/_cmZoom); _cmZoom=nz; applyT(); } svg._moved=true; return; }
      if(pan){ const s=scl(); const dx=(e.clientX-pan.x)/s, dy=(e.clientY-pan.y)/s; if(Math.abs(dx)+Math.abs(dy)>1.5) svg._moved=true; _cmX=pan.ox+dx; _cmY=pan.oy+dy; applyT(); } };
    const up=e=>{ pts.delete(e.pointerId); if(pts.size<2) pinch=null;
      if(pts.size===1){ const v=[...pts.values()][0]; pan={x:v.x,y:v.y,ox:_cmX,oy:_cmY}; }
      else if(pts.size===0){ pan=null;
        if(!svg._moved){
          if(_cmMeasure){ const v=cmClientToVB(svg,e.clientX,e.clientY); const ll=_cmUnproj(v); _cmMpts.push([ll[0],ll[1]]); cmUpdateMeas(); }
          else if(_cmAddPoi){ const v=cmClientToVB(svg,e.clientX,e.clientY); const ll=_cmUnproj(v); const added=cartoAddPoi(ll[0],ll[1]); _cmAddPoi=false; if(added) renderCartoMap(); else renderCartoMap(); }
          else { const now=Date.now(); if(now-lastTap<300){ const v=cmClientToVB(svg,e.clientX,e.clientY); cmZoomAt(1.8,v[0],v[1]); applyT(); lastTap=0; } else lastTap=now; } } } };
    svg.onpointerup=svg.onpointercancel=up;
    svg.onwheel=e=>{ e.preventDefault&&e.preventDefault(); const v=cmClientToVB(svg,e.clientX,e.clientY); cmZoomAt(e.deltaY<0?1.18:1/1.18,v[0],v[1]); applyT(); }; }
  if($('cmLayer')) $('cmLayer').onclick=()=>{ _cmLayer=CM_LAYERS[(CM_LAYERS.indexOf(_cmLayer)+1)%CM_LAYERS.length]; renderCartoMap(); };
  if($('cmIn')) $('cmIn').onclick=()=>{ cmZoomBy(1.3); applyT(); };
  if($('cmOut')) $('cmOut').onclick=()=>{ cmZoomBy(1/1.3); applyT(); };
  if($('cmFit')) $('cmFit').onclick=()=>{ _cmZoom=1;_cmX=0;_cmY=0; applyT(); };
  if($('cmDesel')) $('cmDesel').onclick=()=>{ _cmSel=''; renderCartoMap(); };
  if($('cmGeo')) $('cmGeo').onclick=()=>{ if(_cmWatch==null){ _cmFollow=true; _cmGeoFirst=true; cmToggleGeo(); }
    else { _cmFollow=!_cmFollow; if(_cmFollow) cmCenterMe(); renderCartoMap(); } };
  if($('cmPaths')) $('cmPaths').onclick=()=>{ _cmPaths=!_cmPaths; renderCartoMap(); };
  if($('cmReg')) $('cmReg').onclick=()=>{ cmStopGeo(); _cmGeo=null; _cmFollow=false; openCarto(); };
  if($('cmRuler')) $('cmRuler').onclick=()=>{ _cmMeasure=!_cmMeasure; if(_cmMeasure){ _cmFollow=false; _cmAddPoi=false; } else { _cmMpts=[]; } renderCartoMap(); };
  if($('cmPoi')) $('cmPoi').onclick=()=>{ _cmAddPoi=!_cmAddPoi; if(_cmAddPoi){ _cmFollow=false; _cmMeasure=false; } renderCartoMap(); };
  if($('cmMeasUndo')) $('cmMeasUndo').onclick=()=>{ _cmMpts.pop(); cmUpdateMeas(); };
  if($('cmMeasClear')) $('cmMeasClear').onclick=()=>{ _cmMpts=[]; cmUpdateMeas(); };
  if($('cmEdit')) $('cmEdit').onclick=()=>openCartoEdit(_cmSel);
  $('cmBack').onclick=()=>{ cmStopGeo(); _cmGeo=null; _cmFollow=false; _cmMeasure=false; _cmMpts=[]; navBack(); };
  cmDrawMe(); applyT();
  show('scAtelierFlow',{accent:'#3E7C4E',nav:'domains'});
}

/* ====== Pièges à insectes : catalogue par cible + recherche + « déjà fait » ====== */
function piegeS(){ if(!STORE.pieges) STORE.pieges={done:{}}; if(!STORE.pieges.done) STORE.pieges.done={}; return STORE.pieges; }
function piegeKey(n){ return occNorm(n).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function piegeProgress(){ const st=piegeS(); let d=0,t=0; ((window.PIEGES&&window.PIEGES.cats)||[]).forEach(g=>g.items.forEach(k=>{ t++; if(st.done[piegeKey(k.n)]) d++; })); return {done:d,total:t}; }
let _pgQ='';
function piegeListHTML(){
  const q=occNorm(_pgQ); const st=piegeS(); let h='', n=0;
  ((window.PIEGES&&window.PIEGES.cats)||[]).forEach(g=>{
    const items=g.items.filter(k=>!q||occNorm(k.n+' '+(k.cible||'')+' '+k.etapes.join(' ')).includes(q));
    if(!items.length) return; n+=items.length;
    h+='<div class="dep-cat">'+esc((g.ic?g.ic+' ':'')+g.cat)+' — '+items.length+'</div>';
    items.forEach(k=>{ const key=piegeKey(k.n); const on=!!st.done[key];
      h+='<details class="dep-item arb"><summary><span class="arb-ic">🪤</span><span class="dep-s">'+esc(k.n)+'</span><span class="dep-c">'+esc(k.diff)+'</span></summary><div class="dep-k">'+
         '<div class="nk-aka">cible : '+esc(k.cible)+'</div>'+
         '<div class="arb-row"><b>🧰 Matériel :</b><ul class="rec-ingr">'+k.materiel.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul></div>'+
         '<div class="arb-row"><b>🪤 Fabrication :</b><ol class="nk-steps">'+k.etapes.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol></div>'+
         (k.conseils?'<div class="arb-row"><b>💡 Conseils :</b><ul class="mod-tips">'+k.conseils.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul></div>':'')+
         (k.warn?'<div class="arb-warn">⚠️ '+esc(k.warn)+'</div>':'')+
         '<button class="mnt-btn'+(on?'':' add')+'" data-pg="'+key+'">'+(on?'✓ Déjà fait':'☐ Déjà fait')+'</button>'+
         '</div></details>';
    });
  });
  if(!n) h='<p class="atf-note">Aucun piège trouvé — essaie un autre mot.</p>';
  return h;
}
function bindPiegeToggles(){
  $('atfBody').querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{ const st=piegeS(), key=b.dataset.pg;
    if(st.done[key]) delete st.done[key]; else st.done[key]=1; saveStore();
    const on=!!st.done[key]; b.textContent=on?'✓ Déjà fait':'☐ Déjà fait'; b.className='mnt-btn'+(on?'':' add');
    const cc=$('pgCount'); if(cc){ const pr=piegeProgress(); cc.textContent=pr.done+' / '+pr.total+' faits'; } });
}
function openPieges(){ _pgQ=''; go(renderPieges,'pièges'); }
function renderPieges(){
  mode='learn'; const Pg=window.PIEGES; const pr=piegeProgress();
  $('atfTitle').textContent=Pg.name;
  let h='<p class="atf-lead">'+esc(Pg.meta)+'. <b id="pgCount">'+pr.done+' / '+pr.total+' faits</b>.</p>';
  if(Pg.regle) h+='<div class="atf-key">'+esc(Pg.regle)+'</div>';
  h+='<input id="pgSearch" class="occ-search" type="text" placeholder="🔎 Rechercher (insecte ou méthode)" value="'+esc(_pgQ)+'">';
  h+='<div id="pgList">'+piegeListHTML()+'</div>';
  $('atfBody').innerHTML=h; bindPiegeToggles();
  const s=$('pgSearch'); if(s) s.oninput=()=>{ _pgQ=s.value; const l=$('pgList'); if(l){ l.innerHTML=piegeListHTML(); bindPiegeToggles(); } };
  show('scAtelierFlow',{accent:Pg.color,nav:'domains'});
}

/* ====== Bien-être : recettes de boissons + rituels (pas un cours) ====== */
function bienetreS(){ if(!STORE.bienetre) STORE.bienetre={done:{}}; if(!STORE.bienetre.done) STORE.bienetre.done={}; if(!STORE.bienetre.qty) STORE.bienetre.qty={}; return STORE.bienetre; }
/* met à l'échelle les nombres d'un ingrédient (entiers, décimaux à virgule, plages « a à b », fractions ½¼¾) */
function scaleFmt(v){ v=Math.round(v*100)/100; const s=(Math.abs(v-Math.round(v))<1e-9)?String(Math.round(v)):String(v); return s.replace('.',','); }
function scaleIngr(str, f){ if(!f||f===1) return str; const FR={'½':.5,'¼':.25,'¾':.75,'⅓':1/3,'⅔':2/3};
  const conv=x=> (x in FR)?FR[x]:parseFloat(String(x).replace(',','.'));
  const NUM='(?:\\d+(?:[.,]\\d+)?|[½¼¾⅓⅔])';
  const re=new RegExp(NUM+'(\\s*(?:à|-|–|—)\\s*)'+NUM+'|'+NUM,'g');
  return str.replace(re,(m,sep)=>{ if(sep){ const parts=m.split(sep); return scaleFmt(conv(parts[0])*f)+sep+scaleFmt(conv(parts[1])*f); } return scaleFmt(conv(m)*f); });
}
function bienetreProgress(){ const B=window.BIENETRE; const st=bienetreS(); const tot=((B&&B.recettes)||[]).length;
  const done=((B&&B.recettes)||[]).filter(r=>st.done[r.key]).length; return {done, total:tot}; }
function openBienetre(){ go(renderBienetreHub,'bien-être'); }
function renderBienetreHub(){
  mode='learn'; const B=window.BIENETRE; const st=bienetreS();
  $('atfTitle').textContent=B.name;
  const nAst=(B.astuces||[]).reduce((a,g)=>a+g.items.length,0);
  let h='<p class="atf-lead">'+esc(B.meta)+'. Touche une recette pour la préparer ; coche-la quand tu l’as faite.</p>';
  h+='<button class="atelier-banner astuce" type="button" data-beast="1"><span class="ab-ic">🧘</span><span class="ab-mid"><span class="ab-t">Rituels bien-être</span><span class="ab-s">'+nAst+' astuces : bien boire, respirer, dormir, bouger</span></span><span class="ab-go">Ouvrir ›</span></button>';
  const pr=bienetreProgress();
  h+='<p class="atf-note" style="margin:0 0 6px">'+pr.done+' / '+pr.total+' recettes déjà faites</p>';
  const cats=B.cats||[{key:'boissons',label:'Recettes',ic:'🥤'}];
  const rowFor=r=>{ const on=!!st.done[r.key];
    return '<button class="mod-row'+(on?' full':'')+'" type="button" data-berec="'+r.key+'"><span class="arb-ic">'+r.ic+'</span><span class="mod-mid"><span class="dep-s">'+esc(r.t)+(on?' ✓':'')+'</span><span class="mod-s">'+esc(r.s)+(r.apport?' · '+esc(r.apport):'')+'</span></span><span class="ab-go">Voir ›</span></button>'; };
  cats.forEach(cat=>{ const items=B.recettes.filter(r=>(r.cat||'boissons')===cat.key); if(!items.length) return;
    h+='<div class="dep-cat">'+esc((cat.ic?cat.ic+' ':'')+cat.label)+' — '+items.length+'</div>';
    items.forEach(r=>{ h+=rowFor(r); }); });
  h+='<p class="atf-note">Le bissap est en tête, avec le tour de main des anciens. Les plats du coin sont des versions traditionnelles — envoie-moi celles de ta famille à Bonnac et je les remplace.</p>';
  $('atfBody').innerHTML=h;
  $('atfBody').querySelectorAll('[data-berec]').forEach(b=>b.onclick=()=>openRecette(b.dataset.berec));
  const ab=$('atfBody').querySelector('[data-beast]'); if(ab) ab.onclick=()=>openBienetreAstuces();
  show('scAtelierFlow',{accent:B.color,nav:'domains'});
}
function openRecette(key){ go(()=>renderRecette(key),'recette'); }
function renderRecette(key,keep){
  mode='learn'; const B=window.BIENETRE; const r=B.recettes.find(x=>x.key===key); const st=bienetreS();
  if(!r){ $('atfBody').innerHTML='<p class="atf-note">Recette introuvable.</p>'; if(!keep) show('scAtelierFlow',{accent:B.color,nav:'domains'}); return; }
  $('atfTitle').textContent=r.t;
  const on=!!st.done[key]; const f=st.qty[key]||1;
  let h='<p class="atf-lead">'+esc(r.s)+'</p>';
  h+='<div class="rec-meta">'+(r.temps?'<span>⏱️ '+esc(r.temps)+'</span>':'')+(r.pour?'<span>🥃 '+esc(scaleIngr(r.pour,f))+'</span>':'')+(r.apport?'<span>💪 '+esc(scaleIngr(r.apport,f))+'</span>':'')+'</div>';
  h+='<div class="qty-ctrl"><span class="qty-lbl">Quantités</span><button class="qty-b" data-qf="down"'+(f<=0.5?' disabled':'')+'>−</button><b class="qty-f">×'+scaleFmt(f)+'</b><button class="qty-b" data-qf="up"'+(f>=5?' disabled':'')+'>+</button>'+(f!==1?'<button class="qty-reset" data-qf="reset">↺</button>':'')+'</div>';
  h+='<div class="dep-cat">Ingrédients</div><ul class="rec-ingr">'+r.ingr.map(x=>'<li>'+esc(scaleIngr(x,f))+'</li>').join('')+'</ul>';
  h+='<div class="dep-cat">Préparation</div><ol class="tuto-steps big">'+r.etapes.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>';
  if(r.conseils&&r.conseils.length){ h+='<div class="dep-cat">Conseils</div><ul class="mod-tips">'+r.conseils.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'; }
  if(r.anciens&&r.anciens.length){ h+='<div class="dep-cat">👵 Le tour de main des anciens</div><ul class="rec-anc">'+r.anciens.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'; }
  if(r.note) h+='<div class="atf-key">'+esc(r.note)+'</div>';
  h+='<button class="mnt-btn add" id="recDone" style="width:100%;margin-top:14px">'+(on?'✓ Déjà faite — retirer':'☐ Marquer « je l’ai faite »')+'</button>';
  $('atfBody').innerHTML=h;
  const bd=$('recDone'); if(bd) bd.onclick=()=>{ if(st.done[key]) delete st.done[key]; else st.done[key]=new Date().toISOString().slice(0,10); saveStore(); renderRecette(key,true); };
  $('atfBody').querySelectorAll('[data-qf]').forEach(b=>b.onclick=()=>{ let nf=st.qty[key]||1;
    if(b.dataset.qf==='up') nf=Math.min(5,nf+0.5); else if(b.dataset.qf==='down') nf=Math.max(0.5,nf-0.5); else nf=1;
    if(nf===1) delete st.qty[key]; else st.qty[key]=nf; saveStore(); renderRecette(key,true); });
  if(!keep) show('scAtelierFlow',{accent:B.color,nav:'domains'});
}
function openBienetreAstuces(){ go(renderBienetreAstuces,'rituels'); }
function renderBienetreAstuces(){
  mode='learn'; const B=window.BIENETRE;
  $('atfTitle').textContent='Rituels bien-être';
  let h='<p class="atf-lead">Des petits gestes simples, à côté des recettes. Touche une astuce pour dérouler.</p>';
  (B.astuces||[]).forEach(g=>{
    h+='<div class="dep-cat">'+esc((g.ic?g.ic+' ':'')+g.cat)+' — '+g.items.length+'</div>';
    g.items.forEach(a=>{ h+='<details class="dep-item arb"><summary><span class="arb-ic">'+(g.ic||'🌿')+'</span><span class="dep-s">'+esc(a.t)+'</span></summary><div class="dep-k">'+esc(a.d)+'</div></details>'; });
  });
  $('atfBody').innerHTML=h;
  show('scAtelierFlow',{accent:B.color,nav:'domains'});
}

/* ====== Aménagement de camion : guide de chantier en modules (pas un cours) ====== */
function amenS(){ if(!STORE.amenagement) STORE.amenagement={done:{}}; if(!STORE.amenagement.done) STORE.amenagement.done={}; return STORE.amenagement; }
function amenProgress(){ const A=window.AMENAGEMENT; const st=amenS(); let t=0,d=0;
  ((A&&A.modules)||[]).forEach(m=>{ m.etapes.forEach((e,i)=>{ t++; if(st.done[m.key+'_'+i]) d++; }); }); return {done:d,total:t}; }
function openAmenagement(){ go(renderAmenHub,'aménagement'); }
function renderAmenHub(){
  mode='learn'; const A=window.AMENAGEMENT; const st=amenS();
  $('atfTitle').textContent=A.name;
  const nAst=(A.astuces||[]).reduce((a,g)=>a+g.items.length,0);
  let h='<p class="atf-lead">'+esc(A.meta)+'. Pas un cours à valider : un guide de chantier — conseils, exemples et renvois vers les autres domaines, étape par étape.</p>';
  h+='<button class="atelier-banner astuce" type="button" data-amast="1"><span class="ab-ic">💡</span><span class="ab-mid"><span class="ab-t">Meilleures astuces</span><span class="ab-s">'+nAst+' astuces : place, poids, budget, autonomie, hiver, pièges</span></span><span class="ab-go">Ouvrir ›</span></button>';
  const pr=amenProgress();
  h+='<div class="dep-cat">Les '+A.modules.length+' modules du chantier — '+pr.done+' / '+pr.total+' étapes faites</div>';
  A.modules.forEach(m=>{ const d=m.etapes.filter((e,i)=>st.done[m.key+'_'+i]).length;
    h+='<button class="mod-row'+(d===m.etapes.length?' full':'')+'" type="button" data-ammod="'+m.key+'"><span class="arb-ic">'+m.ic+'</span><span class="mod-mid"><span class="dep-s">'+esc(m.t)+'</span><span class="mod-s">'+esc(m.s)+'</span></span><span class="dep-c">'+d+' / '+m.etapes.length+'</span></button>'; });
  h+='<p class="atf-note">L’ordre des modules suit l’ordre du vrai chantier : finis (ou au moins prépare) un module avant d’attaquer le suivant.</p>';
  $('atfBody').innerHTML=h;
  $('atfBody').querySelectorAll('[data-ammod]').forEach(b=>b.onclick=()=>openAmenModule(b.dataset.ammod));
  const ab=$('atfBody').querySelector('[data-amast]'); if(ab) ab.onclick=()=>openAstuces();
  show('scAtelierFlow',{accent:A.color,nav:'domains'});
}
function openAmenModule(key){ go(()=>renderAmenModule(key),'module'); }
function renderAmenModule(key,keep){
  mode='learn'; const A=window.AMENAGEMENT; const m=A.modules.find(x=>x.key===key); const st=amenS();
  const today=new Date().toISOString().slice(0,10);
  if(!m){ $('atfBody').innerHTML='<p class="atf-note">Module introuvable.</p>'; if(!keep) show('scAtelierFlow',{accent:A.color,nav:'domains'}); return; }
  $('atfTitle').textContent=m.t;
  const done=m.etapes.filter((e,i)=>st.done[key+'_'+i]).length;
  let h='<p class="atf-lead">'+esc(m.s)+'</p>';
  h+='<div class="dep-cat">Étapes — '+done+' / '+m.etapes.length+' faite'+(done>1?'s':'')+'</div><ol class="tuto-steps big check">';
  m.etapes.forEach((e,i)=>{ const on=!!st.done[key+'_'+i];
    h+='<li class="'+(on?'done':'')+'"><button class="pan-chk'+(on?' on':'')+'" data-amst="'+i+'" aria-label="fait">'+(on?'✓':'')+'</button><div class="pan-stx"><b>'+esc(e.t)+'.</b> '+esc(e.d);
    if(e.conseils&&e.conseils.length) h+='<ul class="mod-tips">'+e.conseils.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul>';
    if(e.ex) h+='<div class="mod-ex">'+esc(e.ex)+'</div>';
    if(e.liens&&e.liens.length){ const chips=e.liens.filter(k=>D.SKILLS[k]).map(k=>'<button class="dom-chip" type="button" data-dom="'+k+'">'+D.SKILLS[k].icon+' '+D.SKILLS[k].name+'</button>').join('');
      if(chips) h+='<div class="mod-links"><span class="mod-lk">Domaines liés :</span>'+chips+'</div>'; }
    h+='</div></li>'; });
  h+='</ol>';
  const idx=A.modules.indexOf(m); const nx=A.modules[idx+1];
  if(nx) h+='<button class="mod-row next" type="button" data-amnext="'+nx.key+'"><span class="arb-ic">'+nx.ic+'</span><span class="mod-mid"><span class="mod-s">Module suivant</span><span class="dep-s">'+esc(nx.t)+'</span></span><span class="ab-go">Ouvrir ›</span></button>';
  else h+='<p class="atf-note">🏁 Dernier module : après l’essai longue durée, il ne reste qu’à prendre la route.</p>';
  $('atfBody').innerHTML=h;
  $('atfBody').querySelectorAll('[data-amst]').forEach(b=>b.onclick=()=>{ const k=key+'_'+b.dataset.amst;
    if(st.done[k]) delete st.done[k]; else st.done[k]=today; saveStore(); renderAmenModule(key,true); });
  $('atfBody').querySelectorAll('[data-dom]').forEach(b=>b.onclick=()=>openDomain(b.dataset.dom));
  $('atfBody').querySelectorAll('[data-amnext]').forEach(b=>b.onclick=()=>openAmenModule(b.dataset.amnext));
  if(!keep) show('scAtelierFlow',{accent:A.color,nav:'domains'});
}
function openAstuces(){ go(renderAstuces,'astuces'); }
function renderAstuces(){
  mode='learn'; const A=window.AMENAGEMENT;
  $('atfTitle').textContent='Meilleures astuces — aménagement';
  let h='<p class="atf-lead">Le concentré de ce qui marche vraiment sur les chantiers d’aménagement, classé par thème. Touche une astuce pour dérouler.</p>';
  (A.astuces||[]).forEach(g=>{
    h+='<div class="dep-cat">'+esc(g.cat)+' — '+g.items.length+'</div>';
    g.items.forEach(a=>{ h+='<details class="dep-item arb"><summary><span class="arb-ic">'+(g.ic||'💡')+'</span><span class="dep-s">'+esc(a.t)+'</span></summary><div class="dep-k">'+esc(a.d)+'</div></details>'; });
  });
  h+='<p class="atf-note">Ces astuces complètent les modules du chantier — le détail pas-à-pas est dans chaque module.</p>';
  $('atfBody').innerHTML=h;
  show('scAtelierFlow',{accent:A.color,nav:'domains'});
}

/* ====== Occitan : dictionnaire de phrases (recherche) ====== */
let _occQ='';
function occNorm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
function occPhrasesHTML(){
  const q=occNorm(_occQ); let h='', n=0;
  (window.OCCITAN_PHRASES||[]).forEach(g=>{
    const items=g.items.filter(it=>!q||occNorm(it.o+' '+it.f).includes(q));
    if(!items.length) return; n+=items.length;
    h+='<div class="dep-cat">'+esc((g.ic?g.ic+' ':'')+g.cat)+' — '+items.length+'</div>';
    items.forEach(it=>{ h+='<div class="phr-row"><span class="phr-o">'+esc(it.o)+'</span><span class="phr-f">'+esc(it.f)+'</span></div>'; });
  });
  if(!n) h='<p class="atf-note">Cap de frasa trobada — assaja un autre mot.</p>';
  return h;
}
function openOccitanPhrases(){ _occQ=''; go(renderOccitanPhrases,'dictionnaire'); }
function renderOccitanPhrases(keep){
  mode='learn';
  $('atfTitle').textContent='Dictionnaire de phrases';
  const nP=(window.OCCITAN_PHRASES||[]).reduce((a,g)=>a+g.items.length,0);
  let h='<p class="atf-lead">'+nP+' phrases utiles, occitan (languedocien) → français, classées par thème. Tape un mot pour filtrer (en français ou en occitan).</p>';
  h+='<input id="occSearch" class="occ-search" type="text" placeholder="🔎 Rechercher… (ex : bonjour, mercé, marché)" value="'+esc(_occQ)+'">';
  h+='<div id="occList">'+occPhrasesHTML()+'</div>';
  h+='<p class="atf-note">Languedocien standard (norma classica). Des variantes locales existent autour de Pàmias — l’essentiel est de se lancer.</p>';
  $('atfBody').innerHTML=h;
  const s=$('occSearch'); if(s) s.oninput=()=>{ _occQ=s.value; const l=$('occList'); if(l) l.innerHTML=occPhrasesHTML(); };
  if(!keep) show('scAtelierFlow',{accent:'#B23A2E',nav:'domains'});
}

function openElagCalendar(){ go(renderElagCalendar,'calendrier'); }
function renderElagCalendar(){
  mode='learn';
  $('atfTitle').textContent='Calendrier de taille du verger';
  const cur=new Date().getMonth();
  let h='<p class="atf-lead">Mois par mois : ce qu’on taille, les autres travaux, et ce qu’on évite. Le mois en cours est mis en avant. Règle d’or : à pépins l’hiver hors gel, à noyau l’été au sec.</p>';
  (window.ELAG_CALENDAR||[]).forEach((mo,i)=>{
    const open=(i===cur)?' open':'';
    h+='<details class="dep-item arb cal'+(i===cur?' now':'')+'"'+open+'><summary><span class="arb-ic">'+mo.ic+'</span><span class="dep-s">'+esc(mo.m)+(i===cur?' · ce mois-ci':'')+'</span><span class="dep-c">'+esc(mo.sais)+'</span></summary>'+
      '<div class="dep-k"><div class="arb-row"><b>✂️ Tailler :</b><ul class="arb-ul">'+mo.taille.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+
      '<div class="arb-row"><b>🧺 Aussi :</b><ul class="arb-ul">'+mo.a.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+
      '<div class="arb-warn">⚠️ '+esc(mo.evit)+'</div></div></details>';
  });
  h+='<p class="atf-note">Repères pour un climat tempéré (Ariège / piémont pyrénéen) : décale d’1–2 semaines selon l’altitude et l’année. Le détail par essence est dans le Guide par arbre.</p>';
  $('atfBody').innerHTML=h;
  show('scAtelierFlow',{accent:'#557A3C',nav:'domains'});
}

function openElagVarietes(){ go(renderElagVarietes,'variétés'); }
function renderElagVarietes(){
  mode='learn'; const V=window.ELAG_VARIETES;
  $('atfTitle').textContent='Variétés locales d’Ariège';
  let h='<p class="atf-lead">'+esc(V.intro)+'</p>';
  h+='<div class="dep-cat">Quelques variétés du pays</div>';
  (V.varietes||[]).forEach(a=>{
    h+='<details class="dep-item arb"><summary><span class="arb-ic">'+a.ic+'</span><span class="dep-s">'+esc(a.n)+'</span><span class="dep-c">'+esc(a.type)+'</span></summary>'+
       '<div class="dep-k">'+esc(a.desc)+'</div></details>';
  });
  h+='<div class="dep-cat">Où les trouver — conservatoires &amp; pépinières</div>';
  (V.conservatoires||[]).forEach(c=>{
    h+='<div class="phr-row"><span class="phr-o">'+esc(c.n)+' · <span style="font-weight:400;color:var(--mut)">'+esc(c.lieu)+'</span></span><span class="phr-f">'+esc(c.quoi)+'</span></div>';
  });
  h+='<p class="atf-note">Liste non exhaustive, tenue honnête : le patrimoine ariégeois est vaste et surtout gardé par ces associations. Tu connais des variétés de ta vallée (Pàmias, Pays d’Olmes, vallée de l’Hers) ? Dis-les-moi, je les ajoute ici.</p>';
  $('atfBody').innerHTML=h;
  show('scAtelierFlow',{accent:'#557A3C',nav:'domains'});
}

function openAtelier(){ go(renderAtelierHub,'atelier'); }
function renderAtelierHub(){
  mode='learn'; g270S();
  const nb=(STORE.g270.journal||[]).length;
  const filled=G270_FIELDS.filter(f=>(STORE.g270.sheet[f.key]||'').trim()).length;
  $('atelierSummary').textContent='Aide qui reste avec les cours : à consulter et à remplir.';
  const tiles=[
    {v:'depannage', ic:'🩺', t:'Aide-mémoire dépannage', s:'Touche un symptôme → tuto pas-à-pas'},
    {v:'entretien', ic:'🔧', t:'Carnet d\'entretien', s:nb?(nb+' intervention'+(nb>1?'s':'')+' notée'+(nb>1?'s':'')):'Checklist + journal'},
    {v:'fiche',     ic:'📋', t:'Fiche de mon camion', s:filled?(filled+' champ'+(filled>1?'s':'')+' rempli'+(filled>1?'s':'')):'Références & réglages'},
    {v:'reperage',  ic:'📸', t:'Repérage des organes', s:((window.G270_PHOTOS||[]).length||0)+' photos'},
    {v:'conso',     ic:'🛒', t:'Consommables', s:(function(){ const n=Object.values(STORE.g270.conso.buy).filter(Boolean).length+STORE.g270.conso.custom.filter(x=>x.buy).length; return n?(n+' article'+(n>1?'s':'')+' à acheter'):'Réfs & liste de courses'; })()}
  ];
  let html='';
  (window.G270_PANNES||(window.G270_PANNE?[window.G270_PANNE]:[])).forEach(pn=>{ const st=panneState(pn.key||'demarrage'); const res=!!st.resolved;
    html+='<button class="panne-banner'+(res?' res':'')+'" data-panne="'+esc(pn.key||'demarrage')+'"><span class="pb-ic">'+(res?'✅':'⚠️')+'</span><span class="pb-mid"><span class="pb-t">'+esc(pn.short||pn.title||'Panne')+'</span><span class="pb-s">'+(res?'Résolue — dossier consultable':'Diagnostic guidé pas à pas')+'</span></span><span class="ab-go">Ouvrir ›</span></button>'; });
  html+=tiles.map(t=>'<button class="woodtile" data-av="'+t.v+'"><span class="wt-ic">'+t.ic+'</span><span class="wt-mid"><span class="wt-t">'+t.t+'</span><span class="wt-s">'+esc(t.s)+'</span></span><span class="chev">›</span></button>').join('');
  $('atelierTiles').innerHTML=html;
  $('atelierTiles').querySelectorAll('[data-av]').forEach(b=>b.onclick=()=>openAtelierView(b.dataset.av));
  $('atelierTiles').querySelectorAll('[data-panne]').forEach(b=>b.onclick=()=>openPanne(b.dataset.panne));
  show('scAtelier',{accent:'#8C4A4A',nav:'domains'});
}
const ATELIER_LABEL={depannage:'dépannage',entretien:'entretien',fiche:'fiche',reperage:'repérage',conso:'consommables'};
function openAtelierView(v){ go(()=>renderAtelierFlow(v), ATELIER_LABEL[v]||'atelier'); }
function renderAtelierFlow(v){
  mode='learn'; g270S();
  if(v==='depannage'){ $('atfTitle').textContent='Aide-mémoire dépannage'; renderDepannage(); }
  else if(v==='entretien'){ $('atfTitle').textContent='Carnet d\'entretien'; renderEntretien(); }
  else if(v==='fiche'){ $('atfTitle').textContent='Fiche de mon camion'; renderFiche(); }
  else if(v==='reperage'){ $('atfTitle').textContent='Repérage des organes'; renderReperage(); }
  else if(v==='conso'){ $('atfTitle').textContent='Consommables'; renderConso(); }
  show('scAtelierFlow',{accent:'#8C4A4A',nav:'domains'});
}
function renderDepannage(){
  const dep=window.G270_DEP||[];
  let h='<p class="atf-lead">Touche un symptôme pour ouvrir le tutoriel pas-à-pas (outils, étapes, photos).</p>';
  dep.forEach(g=>{
    h+='<div class="dep-cat">'+esc(g.cat)+'</div><div class="mnt-list">';
    g.items.forEach(it=>{
      h+='<button class="dep-btn" data-tuto="'+esc(it.tuto)+'"><span class="dep-mid"><span class="dep-s">'+esc(it.s)+'</span><span class="dep-c">'+esc(it.c)+'</span></span><span class="chev">›</span></button>';
    });
    h+='</div>';
  });
  h+='<p class="atf-note">Pense-bête sécurité : freins à ressort, injection haute pression et soudure sur châssis = un professionnel.</p>';
  $('atfBody').innerHTML=h;
  $('atfBody').querySelectorAll('[data-tuto]').forEach(b=>b.onclick=()=>openTuto(b.dataset.tuto));
}
/* ---- tutoriel pas-à-pas (dépannage & entretien) ---- */
function openTuto(id){ go(()=>renderTutoScreen(id), 'tuto'); }
function tutoPhotosHtml(keys){ if(!keys||!keys.length) return ''; const ph=(window.G270_PHOTOS||[]);
  let h='<div class="tuto-ph">'; keys.forEach(k=>{ const p=ph.find(x=>x.key===k); if(p) h+='<figure class="tuto-pc"><img src="'+p.img+'" data-lb="1" alt="'+esc(p.label)+'"><figcaption>'+esc(p.label)+'</figcaption></figure>'; }); return h+'</div>'; }
function bindLb(){ $('atfBody').querySelectorAll('img[data-lb]').forEach(img=>img.onclick=()=>openLightbox(img.src)); }
function renderTutoScreen(id){
  mode='learn'; const t=(window.G270_TUTO||{})[id];
  if(!t){ $('atfTitle').textContent='Tutoriel'; $('atfBody').innerHTML='<p class="atf-note">Tutoriel indisponible.</p>'; show('scAtelierFlow',{accent:'#8C4A4A',nav:'domains'}); return; }
  $('atfTitle').textContent=t.title;
  let h='';
  if(t.cause) h+='<div class="tuto-top"><span class="dep-c">'+esc(t.cause)+'</span></div>';
  if(t.context) h+='<p class="atf-lead">'+esc(t.context)+'</p>';
  if(t.outils&&t.outils.length) h+='<div class="tuto-tools"><b>Outils</b> '+t.outils.map(esc).join(' · ')+'</div>';
  const phList=(window.G270_PHOTOS||[]); const usedPh=[];
  h+='<ol class="tuto-steps">'+t.etapes.map(e=>{ let txt, ph=null;
    if(typeof e==='string') txt=e; else { txt=(e.t?e.t+' — ':'')+e.d; ph=e.photo||null; }
    let li='<li>'+esc(txt);
    if(ph){ const p=phList.find(x=>x.key===ph); if(p){ usedPh.push(ph); li+='<figure class="step-ph"><img src="'+p.img+'" data-lb="1" alt="'+esc(p.label)+'"><figcaption>'+esc(p.label)+'</figcaption></figure>'; } }
    return li+'</li>';
  }).join('')+'</ol>';
  h+=tutoPhotosHtml((t.photos||[]).filter(k=>usedPh.indexOf(k)<0));
  if(t.securite&&t.securite!=='—') h+='<div class="tuto-secu"><b>⚠️ Sécurité</b> '+esc(t.securite)+'</div>';
  $('atfBody').innerHTML=h; bindLb();
  show('scAtelierFlow',{accent:'#8C4A4A',nav:'domains'});
}
/* ---- diagnostic de la panne en cours ---- */
function openPanne(key){ key=key||'demarrage'; go(()=>renderPanneScreen(key),'panne'); }
/* multi-pannes : état par panne, verdict par règles (données g270_atelier.js) */
function panneState(k){ const S=g270S(); if(!S.pannes[k]) S.pannes[k]={done:{},ans:{},obs:[]};
  const st=S.pannes[k]; if(!st.done) st.done={}; if(!st.ans) st.ans={}; if(!Array.isArray(st.obs)) st.obs=[]; return st; }
function panneByKey(k){ return (window.G270_PANNES||[]).find(p=>p.key===k) || window.G270_PANNE; }
function panneVerdict(def,a){ if(!def||!def.verdicts) return null;
  return def.verdicts.find(v=>Object.keys(v.when).every(kk=>a[kk]===v.when[kk]))||null; }
function renderPanneScreen(key,keep){ key=key||'demarrage';
  mode='learn'; const P0=panneByKey(key); const S=g270S(); const PS=panneState(key);
  $('atfTitle').textContent='Panne en cours';
  if(!P0){ $('atfBody').innerHTML='<p class="atf-note">Diagnostic indisponible.</p>'; if(!keep) show('scAtelierFlow',{accent:'#8C4A4A',nav:'domains'}); return; }
  const today=new Date().toISOString().slice(0,10);
  let h='<div class="panne-head"><span class="pan-badge'+(PS.resolved?' ok':'')+'">'+(PS.resolved?'Panne résolue':'Panne actuelle')+'</span><h2 class="pan-title">'+esc(P0.title)+'</h2></div>';
  if(PS.resolved) h+='<div class="pan-resolved">✓ Résolue le '+esc(PS.resolved.date||'')+(PS.resolved.cause?(' — cause : '+esc(PS.resolved.cause)):'')+'<button class="jr-del" id="panReopen">rouvrir</button></div>';
  h+='<p class="atf-lead">'+esc(P0.resume)+'</p>';
  h+='<div class="dep-cat">Suspects, du plus probable au moins</div>';
  P0.suspects.forEach((s,i)=>{ h+='<div class="pan-susp"><span class="pan-n">'+(i+1)+'</span><span class="pan-mid"><span class="pan-s">'+esc(s.n)+'</span><span class="pan-p">'+esc(s.p)+'</span><span class="pan-w">'+esc(s.why)+'</span></span></div>'; });
  // marche à suivre : étapes cochables (persistées)
  const doneN=P0.etapes.filter((e,i)=>PS.done['e'+i]).length;
  h+='<div class="dep-cat">Marche à suivre — '+doneN+' / '+P0.etapes.length+' fait'+(doneN>1?'s':'')+'</div><ol class="tuto-steps big check">';
  const phList=(window.G270_PHOTOS||[]);
  P0.etapes.forEach((e,i)=>{ const on=!!PS.done['e'+i];
    h+='<li class="'+(on?'done':'')+'"><button class="pan-chk'+(on?' on':'')+'" data-pstep="'+i+'" aria-label="fait">'+(on?'✓':'')+'</button><div class="pan-stx"><b>'+esc(e.t)+'.</b> '+esc(e.d);
    if(e.photo){ const p=phList.find(x=>x.key===e.photo); if(p) h+='<figure class="step-ph"><img src="'+p.img+'" data-lb="1" alt="'+esc(p.label)+'"><figcaption>'+esc(p.label)+'</figcaption></figure>'; }
    h+='</div></li>'; });
  h+='</ol>';
  // check-list d'intervention (si définie)
  if(P0.checklist&&P0.checklist.items&&P0.checklist.items.length){
    const ck=P0.checklist; const dn=ck.items.filter((x,i)=>PS.done['r'+i]).length;
    h+='<div class="dep-cat">'+esc(ck.t)+' — '+dn+' / '+ck.items.length+'</div><ol class="tuto-steps big check">';
    ck.items.forEach((x,i)=>{ const on=!!PS.done['r'+i];
      h+='<li class="'+(on?'done':'')+'"><button class="pan-chk'+(on?' on':'')+'" data-pchk="'+i+'">'+(on?'✓':'')+'</button><div class="pan-stx">'+esc(x)+'</div></li>'; });
    h+='</ol>';
  }
  // tests clés → verdict
  h+='<div class="dep-cat">Tes résultats — le verdict s’affine</div><div class="pan-tests">';
  (P0.tests||[]).forEach(t=>{ const v=PS.ans[t.k]||'';
    h+='<div class="pan-q"><span class="pan-qt">'+esc(t.q)+'</span><span class="pan-qb">'+
      ['oui','non'].map(o=>'<button class="pan-ans'+(v===o?' on':'')+'" data-pq="'+t.k+'" data-pv="'+o+'">'+o+'</button>').join('')+'</span></div>';
  });
  h+='</div>';
  const vd=panneVerdict(P0,PS.ans);
  h+= vd ? '<div class="pan-verdict"><span class="pv-t">🎯 Verdict le plus probable : '+esc(vd.t)+'</span><span class="pv-d">'+esc(vd.d)+'</span></div>'
         : '<div class="pan-verdict empty"><span class="pv-d">Réponds aux questions ci-dessus au fil de tes essais : le verdict s’affichera ici.</span></div>';
  // observations datées
  h+='<div class="dep-cat">Observations</div>';
  h+='<div class="jr-add"><input id="panObsIn" type="text" placeholder="Ex : calé à 40 s, tension tombée à 0"><button id="panObsAdd" class="mnt-btn add">Noter</button></div>';
  const obs=(PS.obs||[]).slice().reverse();
  if(obs.length){ h+='<div class="jr-list">'+obs.map(o=>'<div class="jr-row"><span class="jr-d">'+esc(o.date||'')+'</span><span class="jr-t">'+esc(o.text||'')+'</span><button class="jr-del" data-pdel="'+o.id+'">✕</button></div>').join('')+'</div>'; }
  else h+='<p class="atf-note">Note ici ce que tu constates à chaque essai : ça oriente le verdict et ça évite de refaire les mêmes tests.</p>';
  if(P0.note) h+='<div class="atf-key">'+esc(P0.note)+'</div>';
  if(P0.photoWanted) h+='<p class="atf-note">📸 '+esc(P0.photoWanted)+'</p>';
  if(!PS.resolved) h+='<button class="mnt-btn add" id="panResolve" style="width:100%">✓ Marquer la panne comme résolue</button>';
  $('atfBody').innerHTML=h; bindLb();
  $('atfBody').querySelectorAll('[data-pstep]').forEach(b=>b.onclick=()=>{ const k='e'+b.dataset.pstep; if(PS.done[k]) delete PS.done[k]; else PS.done[k]=today; saveStore(); renderPanneScreen(key,true); });
  $('atfBody').querySelectorAll('[data-pchk]').forEach(b=>b.onclick=()=>{ const k='r'+b.dataset.pchk; if(PS.done[k]) delete PS.done[k]; else PS.done[k]=today; saveStore(); renderPanneScreen(key,true); });
  $('atfBody').querySelectorAll('[data-pq]').forEach(b=>b.onclick=()=>{ const k=b.dataset.pq,v=b.dataset.pv; PS.ans[k]=(PS.ans[k]===v?'':v); saveStore(); renderPanneScreen(key,true); });
  const oa=$('panObsAdd'); if(oa) oa.onclick=()=>{ const t=($('panObsIn').value||'').trim(); if(!t) return;
    PS.obs.push({id:'po_'+Date.now(),date:today,text:t}); if(!saveStoreOk()){ PS.obs.pop(); alert('Stockage plein.'); return; } renderPanneScreen(key,true); };
  $('atfBody').querySelectorAll('[data-pdel]').forEach(b=>b.onclick=()=>{ PS.obs=PS.obs.filter(o=>o.id!==b.dataset.pdel); saveStore(); renderPanneScreen(key,true); });
  const pr=$('panResolve'); if(pr) pr.onclick=()=>{ const vd2=panneVerdict(P0,PS.ans);
    const cause=(typeof prompt==='function')?(prompt('Cause trouvée ?', vd2?vd2.t:'')||''):(vd2?vd2.t:'');
    PS.resolved={date:today, cause:String(cause).trim()};
    S.journal.push({id:'jr_'+Date.now(), date:today, km:'', text:'Panne résolue ('+(P0.short||'')+') — '+(PS.resolved.cause||'cause non précisée')});
    saveStore(); renderPanneScreen(key,true); };
  const ro=$('panReopen'); if(ro) ro.onclick=()=>{ delete PS.resolved; saveStore(); renderPanneScreen(key,true); };
  show('scAtelierFlow',{accent:'#8C4A4A',nav:'domains'});
}
function relDay(d){ if(!d) return 'jamais'; const t=Date.parse(d+'T00:00:00'); if(isNaN(t)) return d;
  const n=Math.floor((Date.now()-t)/86400000); if(n<=0) return "aujourd'hui"; if(n===1) return 'hier'; if(n<30) return 'il y a '+n+' j'; return 'il y a '+Math.floor(n/30)+' mois'; }
function renderEntretien(){
  const S=g270S(); const today=new Date().toISOString().slice(0,10);
  let h='<div class="dep-cat">À faire régulièrement</div><div class="mnt-list">';
  const hasTuto=(window.G270_TUTO||{});
  G270_TASKS.forEach(t=>{ const done=S.fait[t.key]; const on=!!done; const tut=!!hasTuto[t.key];
    h+='<div class="mnt-row'+(on?' done':'')+'"><span class="mnt-mid'+(tut?' link':'')+'"'+(tut?' data-tuto="'+t.key+'"':'')+'><span class="mnt-t">'+esc(t.t)+(tut?' <span class="mnt-how">voir</span>':'')+'</span><span class="mnt-f">'+esc(t.f)+' · fait '+relDay(done&&done.date)+(done&&done.km?(' à '+esc(String(done.km))+' km'):'')+'</span></span><button class="mnt-btn" data-fait="'+t.key+'">'+(on?'refait ✓':'Fait ✓')+'</button></div>';
  });
  h+='</div>';
  h+='<div class="dep-cat">Journal d\'entretien</div>';
  h+='<div class="jr-add"><input id="jrKm" type="number" inputmode="numeric" placeholder="km (optionnel)"><input id="jrText" type="text" placeholder="Ex : vidange + filtre à huile"><button id="jrAdd" class="mnt-btn add">Ajouter</button></div>';
  const j=(S.journal||[]).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(j.length){ h+='<div class="jr-list">'; j.forEach(e=>{ h+='<div class="jr-row"><span class="jr-d">'+esc(e.date||'')+(e.km?(' · '+esc(String(e.km))+' km'):'')+'</span><span class="jr-t">'+esc(e.text||'')+'</span><button class="jr-del" data-del="'+e.id+'" aria-label="supprimer">✕</button></div>'; }); h+='</div>'; }
  else h+='<p class="atf-note">Aucune intervention notée pour l\'instant.</p>';
  $('atfBody').innerHTML=h;
  $('atfBody').querySelectorAll('[data-fait]').forEach(b=>b.onclick=()=>{ S.fait[b.dataset.fait]={date:today}; saveStore(); renderEntretien(); });
  $('atfBody').querySelectorAll('.mnt-mid[data-tuto]').forEach(b=>b.onclick=()=>openTuto(b.dataset.tuto));
  const add=$('jrAdd'); if(add) add.onclick=()=>{
    const txt=($('jrText').value||'').trim(); if(!txt){ $('jrText').focus(); return; }
    const kmv=parseInt($('jrKm').value,10);
    S.journal.push({id:'jr_'+Date.now(), date:today, km:isNaN(kmv)?'':kmv, text:txt});
    if(!saveStoreOk()){ S.journal.pop(); alert('Stockage plein — intervention non enregistrée.'); return; }
    renderEntretien();
  };
  $('atfBody').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ S.journal=S.journal.filter(e=>e.id!==b.dataset.del); saveStore(); renderEntretien(); });
}
function renderFiche(){
  const S=g270S();
  let h='<p class="atf-lead">Note une fois les vraies références de ton camion (relevées sur les plaques). Elles restent enregistrées.</p><div class="fiche">';
  G270_FIELDS.forEach(f=>{
    const val=esc(S.sheet[f.key]||'');
    if(f.big) h+='<label class="fiche-f big"><span>'+esc(f.t)+'</span><textarea data-fk="'+f.key+'" rows="3">'+val+'</textarea></label>';
    else h+='<label class="fiche-f"><span>'+esc(f.t)+'</span><input type="text" data-fk="'+f.key+'" value="'+val+'"></label>';
  });
  h+='</div><p class="atf-note" id="ficheSaved">Enregistré automatiquement.</p>';
  $('atfBody').innerHTML=h;
  $('atfBody').querySelectorAll('[data-fk]').forEach(el=>{ el.onchange=()=>{
    S.sheet[el.dataset.fk]=el.value; if(saveStoreOk()){ const s=$('ficheSaved'); if(s){ s.textContent='✓ Enregistré'; setTimeout(()=>{ if(s) s.textContent='Enregistré automatiquement.'; },1500); } }
    else alert('Stockage plein — modification non enregistrée.');
  }; });
}
function renderConso(){
  const S=g270S(); const C=S.conso; const cat=(window.G270_CONSO||[]);
  const nBuy=Object.values(C.buy).filter(Boolean).length + C.custom.filter(x=>x.buy).length;
  let h='<p class="atf-lead">Les pièces d’usure du camion. Note la référence une fois pour toutes, coche « à acheter » pour faire ta liste de courses.</p>';
  if(nBuy) h+='<div class="atf-key">🛒 '+nBuy+' article'+(nBuy>1?'s':'')+' à acheter.</div>';
  h+='<div class="mnt-list">';
  cat.forEach(it=>{ const buy=!!C.buy[it.k]; const ref=esc(C.refs[it.k]||'');
    h+='<div class="mnt-row conso'+(buy?' tobuy':'')+'"><span class="mnt-mid"><span class="mnt-t">'+esc(it.t)+'</span><span class="mnt-f">'+esc(it.hint)+'</span>'+
       '<input class="conso-ref" data-cref="'+it.k+'" type="text" placeholder="réf. / dimension…" value="'+ref+'"></span>'+
       '<button class="mnt-btn'+(buy?' buy':'')+'" data-cbuy="'+it.k+'">'+(buy?'🛒 à acheter':'Acheter ?')+'</button></div>';
  });
  C.custom.forEach(x=>{ const buy=!!x.buy;
    h+='<div class="mnt-row conso'+(buy?' tobuy':'')+'"><span class="mnt-mid"><span class="mnt-t">'+esc(x.t)+'</span>'+
       '<input class="conso-ref" data-xref="'+x.id+'" type="text" placeholder="réf. / dimension…" value="'+esc(x.ref||'')+'"></span>'+
       '<button class="mnt-btn'+(buy?' buy':'')+'" data-xbuy="'+x.id+'">'+(buy?'🛒 à acheter':'Acheter ?')+'</button><button class="jr-del" data-xdel="'+x.id+'">✕</button></div>';
  });
  h+='</div><div class="jr-add" style="margin-top:12px"><input id="consoNew" type="text" placeholder="Autre article…"><button id="consoAdd" class="mnt-btn add">Ajouter</button></div>';
  $('atfBody').innerHTML=h;
  const b=$('atfBody');
  b.querySelectorAll('[data-cbuy]').forEach(x=>x.onclick=()=>{ C.buy[x.dataset.cbuy]=!C.buy[x.dataset.cbuy]; saveStore(); renderConso(); });
  b.querySelectorAll('[data-cref]').forEach(x=>x.onchange=()=>{ C.refs[x.dataset.cref]=x.value; saveStore(); });
  b.querySelectorAll('[data-xbuy]').forEach(x=>x.onclick=()=>{ const it=C.custom.find(y=>y.id===x.dataset.xbuy); if(it){ it.buy=!it.buy; saveStore(); renderConso(); } });
  b.querySelectorAll('[data-xref]').forEach(x=>x.onchange=()=>{ const it=C.custom.find(y=>y.id===x.dataset.xref); if(it){ it.ref=x.value; saveStore(); } });
  b.querySelectorAll('[data-xdel]').forEach(x=>x.onclick=()=>{ C.custom=C.custom.filter(y=>y.id!==x.dataset.xdel); saveStore(); renderConso(); });
  const ca=$('consoAdd'); if(ca) ca.onclick=()=>{ const t=($('consoNew').value||'').trim(); if(!t) return;
    C.custom.push({id:'cs_'+Date.now(), t, ref:'', buy:true});
    if(!saveStoreOk()){ C.custom.pop(); alert('Stockage plein.'); return; } renderConso(); };
}
function renderReperage(){
  const ph=(window.G270_PHOTOS||[]);
  if(!ph.length){ $('atfBody').innerHTML='<p class="atf-note">Aucune photo embarquée.</p>'; return; }
  const ORDER=['Repère annoté','Moteur','Gasoil','Électricité','Pneumatique','Freinage','Transmission','Entretien','Identification','Châssis','Vue d\'ensemble'];
  const cats=[...new Set([...ORDER.filter(c=>ph.some(p=>p.cat===c)), ...ph.map(p=>p.cat)])];
  let h='<p class="atf-lead">'+ph.length+' photos du camion, classées par système. Touche une image pour l\'agrandir.</p>';
  cats.forEach(cat=>{ const list=ph.filter(p=>p.cat===cat); if(!list.length) return;
    h+='<div class="dep-cat">'+esc(cat)+' — '+list.length+'</div><div class="repgal">';
    list.forEach(p=>{ const i=ph.indexOf(p);
      h+='<figure class="repcard"><img src="'+p.img+'" alt="'+esc(p.label)+'" data-rep="'+i+'" loading="lazy"><figcaption><span class="rep-cat">'+esc(cat)+'</span><span class="rep-l">'+esc(p.label)+'</span><span class="rep-d">'+esc(p.desc)+'</span></figcaption></figure>';
    });
    h+='</div>';
  });
  $('atfBody').innerHTML=h;
  $('atfBody').querySelectorAll('[data-rep]').forEach(img=>img.onclick=()=>openLightbox(img.src));
}
function openLightbox(src){
  let ov=$('repLightbox');
  if(!ov){ ov=document.createElement('div'); ov.id='repLightbox'; ov.className='rep-lb'; document.body.appendChild(ov); ov.onclick=()=>{ ov.style.display='none'; ov.innerHTML=''; }; }
  ov.innerHTML='<img src="'+src+'" alt=""><span class="rep-lb-x">✕</span>';
  ov.style.display='flex';
}

if(cryptoLocked) startVaultUnlock(); else bootEntry();
