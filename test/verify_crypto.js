/* e2e Chiffrement : coffre AES-GCM (Web Crypto natif) — activation, round-trip, mauvaise phrase, secours, désactivation. */
const fs=require('fs'), path=require('path');
const ROOT='/home/user/Nexus'; const P=f=>path.join(ROOT,f);
const webcrypto=require('crypto').webcrypto;
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log('  ✓',n);} else {fail++;console.log('  ✗ ÉCHEC :',n);} };

// --- extraire le module de chiffrement depuis app.js (realm Node, pas de vm : compatible Web Crypto) ---
const app=fs.readFileSync(P('app.js'),'utf8');
const start=app.indexOf("const VAULT_KEY='nexus_vault';");
const end=app.indexOf("\nif(localStorage.getItem(VAULT_KEY)){");
if(start<0||end<0){ console.error('bloc chiffrement introuvable'); process.exit(1); }
const src=app.slice(start,end);

const btoa=s=>Buffer.from(s,'binary').toString('base64');
const atob=s=>Buffer.from(s,'base64').toString('binary');
const mkLS=()=>{ const m=new Map(); return { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,String(v)), removeItem:k=>m.delete(k), has:k=>m.has(k) }; };

const localStorage=mkLS();
const STORE={ g270:{sheet:{vin:'MARK-123'}}, animals:[{id:'a1',name:'Tina'}], mastered:{} };
const RECOVERY_CODE='Lavieaufreyche';
const factory=new Function('crypto','localStorage','STORE','RECOVERY_CODE','btoa','atob','TextEncoder','TextDecoder',
  src+'\n;return { enableEncryption, unlockVault, disableEncryption, cryptoAvailable };');
const api=factory(webcrypto, localStorage, STORE, RECOVERY_CODE, btoa, atob, TextEncoder, TextDecoder);

(async()=>{
  ok('C0 — Web Crypto disponible', api.cryptoAvailable()===true);
  // activation
  await api.enableEncryption('phrase-secrete-1');
  ok('C1 — coffre écrit + clair supprimé', !!localStorage.getItem('nexus_vault') && localStorage.getItem('nexus_stable')===null);
  const vault=JSON.parse(localStorage.getItem('nexus_vault'));
  ok('C2 — structure du coffre (wraps code+secours + data)', !!(vault.wraps&&vault.wraps.code&&vault.wraps.rec&&vault.data&&vault.data.iv&&vault.data.ct));
  ok('C3 — données non lisibles en clair dans le coffre', !JSON.stringify(vault).includes('MARK-123') && !JSON.stringify(vault).includes('Tina'));
  // on « casse » la mémoire puis on déverrouille : les données doivent revenir
  STORE.g270.sheet.vin='WIPED'; STORE.animals[0].name='WIPED';
  const u=await api.unlockVault('phrase-secrete-1');
  ok('C4 — déverrouillage : données restaurées', u===true && STORE.g270.sheet.vin==='MARK-123' && STORE.animals[0].name==='Tina');
  // mauvaise phrase refusée
  const bad=await api.unlockVault('mauvaise-phrase');
  ok('C5 — mauvaise phrase refusée', bad===false);
  // code parent de secours
  const rec=await api.unlockVault('Lavieaufreyche');
  ok('C6 — code parent de secours déverrouille', rec===true);
  // désactivation : retour en clair
  await api.disableEncryption();
  ok('C7 — désactivation : clair restauré, coffre supprimé', localStorage.getItem('nexus_vault')===null && !!localStorage.getItem('nexus_stable') && JSON.parse(localStorage.getItem('nexus_stable')).g270.sheet.vin==='MARK-123');

  console.log('\n=== Bilan verif Chiffrement :', pass, 'réussis,', fail, 'échoués ===');
  process.exit(fail?1:0);
})().catch(e=>{ console.error('Exception :', e); process.exit(1); });
