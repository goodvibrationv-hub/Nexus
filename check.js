#!/usr/bin/env node
/**
 * check.js — Nexus Learn : validation de cohérence des données.
 * Usage: node check.js
 *
 * Vérifie :
 * - 96 nœuds (72 course + 24 safety) répartis dans 13 domaines
 * - Chaque nœud a un contenu dans NEXUS_CONTENT
 * - Chaque nœud a au moins 10 questions dans NEXUS_CARDS
 * - Les deps référencent des ids existants
 * - Les FIG référencés dans les contenus existent
 */

// Charger les données dans le scope Node
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
function read(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(read('data_core.js'),       ctx);
vm.runInContext(read('content_courses.js'), ctx);
vm.runInContext(read('cards.js'),           ctx);

const D = ctx.window.NEXUS_DATA;
const C = ctx.window.NEXUS_CONTENT;
const CARDS = ctx.window.NEXUS_CARDS;

let errors = 0;
function err(msg) { console.error('✗', msg); errors++; }
function ok(msg)  { console.log('✓', msg); }

/* ---- nœuds ---- */
const allNodes = [];
const allIds   = new Set();

for (const [sk, skill] of Object.entries(D.SKILLS)) {
  for (const node of skill.nodes) {
    allNodes.push({ ...node, skill: sk });
    allIds.add(node.id);
  }
}

const courses  = allNodes.filter(n => n.kind === 'course');
const safety   = allNodes.filter(n => n.kind === 'safety');

ok(`Nœuds total : ${allNodes.length} (${courses.length} course, ${safety.length} safety)`);
if (allNodes.length !== 96)  err(`Attendu 96 nœuds, trouvé ${allNodes.length}`);
if (courses.length  !== 72)  err(`Attendu 72 'course', trouvé ${courses.length}`);
if (safety.length   !== 24)  err(`Attendu 24 'safety', trouvé ${safety.length}`);

/* ---- deps ---- */
for (const n of allNodes) {
  for (const dep of n.deps) {
    if (!allIds.has(dep)) err(`Nœud ${n.id} : dep '${dep}' introuvable`);
  }
}
ok('Deps : OK');

/* ---- contenus ---- */
for (const n of allNodes) {
  if (!C[n.id]) err(`Contenu manquant pour nœud ${n.id} (${n.t})`);
}
ok(`Contenus : ${Object.keys(C).length} entrées`);

/* ---- FIG references dans les corps ---- */
const figKeys = new Set(Object.keys(D.FIG));
for (const [id, c] of Object.entries(C)) {
  const refs = [...(c.body || '').matchAll(/<FIG:(\w+)>/g)].map(m => m[1]);
  for (const ref of refs) {
    if (!figKeys.has(ref)) err(`Contenu ${id} : <FIG:${ref}> introuvable dans FIG`);
  }
}
ok(`FIG : ${figKeys.size} schémas définis`);

/* ---- questions ---- */
const cardsByNode = {};
for (const card of CARDS) {
  (cardsByNode[card.node] = cardsByNode[card.node] || []).push(card);
}
ok(`Questions total : ${CARDS.length}`);

for (const n of allNodes) {
  const q = (cardsByNode[n.id] || []).length;
  if (q < 10) err(`Nœud ${n.id} (${n.t}) : seulement ${q} questions (min 10)`);
}

/* ---- résultat ---- */
console.log('');
if (errors === 0) {
  console.log('✓ Vérification OK — aucune erreur.');
  process.exit(0);
} else {
  console.error(`✗ ${errors} erreur(s) détectée(s).`);
  process.exit(1);
}
