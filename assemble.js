#!/usr/bin/env node
/**
 * assemble.js — Nexus Learn builder
 * Usage: node assemble.js [--version N]
 *
 * Lit data_core.js + content_courses.js + cards.js,
 * les injecte dans template.html, écrit nexus_app_vN.html.
 *
 * La version courante est lue depuis package.json ou passée en --version.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;

/* ---- arguments ---- */
const args    = process.argv.slice(2);
const vFlag   = args.indexOf('--version');
let   version = vFlag !== -1 ? parseInt(args[vFlag + 1], 10) : null;

if (!version) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    version = pkg.nexusVersion || 20;
  } catch { version = 20; }
}

const OUTPUT = path.join(ROOT, `nexus_app_v${version}.html`);

/* ---- lecture des sources ---- */
function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

const template = read('template.html');
const dataCore = read('data_core.js');
const content  = read('content_courses.js');
const cards    = read('cards.js');
const appCode  = read('app.js');

/* données embarquées optionnelles (photos base64, atelier G270) */
let photos = '';  try { photos  = read('g270_photos.js');  } catch { photos  = ''; }
let atelier = ''; try { atelier = read('g270_atelier.js'); } catch { atelier = ''; }
let elagGuide = ''; try { elagGuide = read('elagage_guide.js'); } catch { elagGuide = ''; }
let amen = '';      try { amen      = read('amenagement.js');   } catch { amen      = ''; }
let domAt = '';     try { domAt     = read('dom_ateliers.js');  } catch { domAt     = ''; }
let occPhr = '';    try { occPhr    = read('occitan_phrases.js'); } catch { occPhr   = ''; }

/* ---- injection ---- */
const dataBlock = [dataCore, content, cards, photos, atelier, elagGuide, amen, domAt, occPhr].join('\n');

const html = template
  .replace('/* {{DATA_INJECT}} */', dataBlock)
  .replace('/* {{APP_INJECT}} */',  appCode)
  .replace(/\{\{VERSION\}\}/g, String(version));

/* ---- écriture ---- */
fs.writeFileSync(OUTPUT, html, 'utf8');
console.log(`✓ Assemblé → ${OUTPUT}`);

/* ---- validation syntaxe JS ---- */
try {
  // Extrait tous les blocs <script> et vérifie la syntaxe
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  scripts.forEach((src, i) => {
    try { new Function(src); }
    catch (e) { console.error(`✗ Erreur JS (bloc script #${i+1}) : ${e.message}`); process.exit(1); }
  });
  console.log(`✓ Syntaxe JS : OK (${scripts.length} blocs vérifiés)`);
} catch (e) {
  console.error('✗ Vérification syntaxe échouée :', e.message);
  process.exit(1);
}
