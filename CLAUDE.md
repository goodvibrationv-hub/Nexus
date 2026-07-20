# Nexus — notes de travail

PWA mono-fichier hors-ligne (français). Build : `node assemble.js` (injecte
data_core.js + content_courses.js + cards.js + g270_photos.js + g270_atelier.js
+ elagage_guide.js + amenagement.js + dom_ateliers.js + occitan_phrases.js + bienetre.js + app.js dans template.html → `nexus_app_vN.html`). Valider : `node check.js`,
`npm test`, `for f in test/verify_*.js; do node "$f"; done`.
Publier : copier le build dans `index.html` sur `main` (GitHub Pages).
Dev sur la branche `claude/nexus-project-resumption-ymnhtx`. Rester en français.

## Économie de tokens (important)
- **Captures d'écran** : n'en prendre QUE pour une UI vraiment nouvelle, **une seule**,
  et jamais pour re-vérifier une logique déjà couverte par les tests. Le rendu headless
  est souvent voilé (animation) → capture peu utile. Préférer les tests e2e.
- **Ne pas relire une image déjà vue** ; ne pas relire/re-grepper pour vérifier ses
  propres edits (Edit échoue si le patch ne s'applique pas).
- **Build Pages** : NE PAS appeler `actions_list` sans filtre (réponse ~380 K car.).
  Utiliser `status:"in_progress"` si besoin, sinon juste annoncer « en cours ».
- **Publier via l'API GitHub** (`create_or_update_file` sur `main`) plutôt qu'un
  checkout local : évite les gros rappels système de diff à chaque bascule de branche.
- Sorties shell courtes (`| tail -1`), pas de logs complets.
- Réponses concises.
