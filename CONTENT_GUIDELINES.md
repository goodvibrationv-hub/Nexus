# Nexus Learn — Guide de rédaction du contenu

Conventions **prospectives** pour la création de futures fiches/questions. Ce document
ne modifie aucun contenu existant ; il oriente la rédaction à venir.

---

## 1. Ancrage concret : formuler en situation (Bloc 6)

Une information ancrée dans une situation réelle se retient et se transfère mieux qu'une
définition abstraite. **Préférer la mise en situation à la définition pure.**

- ✅ « Ton cheval boite après le parage : que vérifies-tu en premier ? »
- ❌ « Qu'est-ce qu'une boiterie ? »

- ✅ « Le cordon de soudure creuse des caniveaux et perce la tôle : quel réglage corriges-tu ? »
- ❌ « Définis l'intensité de soudage. »

- ✅ « Tu n'arrives pas à changer de Do à Sol sans t'arrêter : que travailles-tu en priorité ? »
- ❌ « Qu'est-ce qu'un changement d'accord ? »

Règles pratiques :
- Placer l'apprenant **acteur** d'une scène plausible (« tu observes… », « tu dois… »).
- Faire appel à une **décision** ou un **diagnostic**, pas à une simple restitution de définition.
- Garder l'énoncé court : une situation, une question.

---

## 2. Modèle de données d'une fiche (`cards.js`)

Chaque fiche est un objet de `window.NEXUS_CARDS`. **`id` est l'identifiant stable** qui relie
la fiche à sa carte FSRS — ne jamais le réutiliser ni le dériver du texte/position.

| champ | type | obligatoire | rôle |
|------|------|:---:|------|
| `id` | string | oui | identifiant **stable & unique** (préfixes : `f_`/`q_`/`c_` vrai-faux, `r_` rappel, `z_` cloze) |
| `skill` | string | oui | clé du domaine |
| `node` | string | oui | id du nœud/cours |
| `type` | string | non | `"tf"` (défaut, vrai/faux), `"recall"` (rappel libre), `"cloze"` (texte à trous) |
| `stmt` | string | oui | énoncé / question (pour `cloze`, marquer chaque trou par `___`) |
| `truth` | bool | si `tf` | réponse vrai/faux attendue |
| `answer` | string | si `recall` | réponse attendue, affichée après « Révéler » |
| `answers` | string[] | si `cloze` | réponses des trous, **dans l'ordre** des `___` |
| `explain` | string | non | explication affichée après la réponse |
| `elaboration` | string | non | question de compréhension (« pourquoi ») révélée après la réponse |
| `image` | string | non | image de référence en **data-URI base64** (embarquée, hors-ligne) |
| `imageUpfront` | bool | non | `true` = image montrée avant réponse ; défaut = révélée après (anti-indice) |

Tous les champs hors obligatoires sont **optionnels et rétro-compatibles** : une fiche au
vieux format (sans `type`) reste une fiche vrai/faux et fonctionne sans erreur.

### Choisir le type de fiche
- **`recall`** (rappel libre) : meilleure mémorisation (récupération active). À privilégier
  pour un fait clé qu'on doit savoir restituer. Le vrai/faux laisse 50 % au hasard.
- **`cloze`** (texte à trous) : effet de génération ; idéal pour une formule, une liste ordonnée,
  un vocabulaire précis. Plusieurs trous possibles.
- **`tf`** (vrai/faux) : utile pour les idées reçues et les nuances ; sert aussi au test de
  validation des cours (les `recall`/`cloze` n'entrent pas dans ce test).

### Images (`image`)
- Encoder en **base64** et viser **≤ ~100 Ko/image** (SVG ou JPEG/WebP optimisé).
- Surveiller le poids total du fichier assemblé : rester **sous ~3 Mo** pour préserver le
  chargement instantané hors-ligne.
- Par défaut l'image est révélée **après** la réponse pour ne pas servir d'indice ; n'utiliser
  `imageUpfront:true` que si l'image ne dévoile pas la réponse.

---

## 3. À proscrire (fondé sur la recherche)

- ❌ Aucun « style d'apprentissage » (visuel/auditif/kinesthésique) : non soutenu par la recherche.
- ❌ Aucune gamification anxiogène ni message culpabilisant (la série de régularité reste positive).
- ❌ Aucune sur-stimulation visuelle ni couleur « pour la mémoire » : la charge cognitive
  extrinsèque nuit à l'encodage. UI sobre.

---

## 4. Pipeline (rappel)

Sources `data_core.js` + `content_courses.js` + `cards.js` (+ `app.js`) → injectées dans
`template.html` par `node assemble.js` → `nexus_app_v<N>.html` (single-file, hors-ligne).
Valider avec `node check.js`.
