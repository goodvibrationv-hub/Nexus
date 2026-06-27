# Nexus Learn — Prompts d'illustrations pour « nano banana » (Gemini 2.5 Flash Image)

Ce document permet de (re)générer les **71 illustrations** de l'application dans un style
homogène, via un modèle image type *nano banana* (Gemini 2.5 Flash Image).

Principe : on garde **un seul bloc de STYLE** (identité visuelle de l'app) que l'on préfixe à
**chaque sujet**. Un prompt final = `STYLE` + `Subject: <sujet de la liste>`.

---

## Comment l'utiliser (conseils nano banana)

1. **Cohérence avant tout.** Générez d'abord 1 image (ex. `sfeu`). Une fois le rendu validé,
   **réinjectez cette image comme référence de style** (image + texte) pour générer les
   suivantes : *« Match the exact art style, palette, line weight and background of the
   reference image. Subject: … »*. C'est le point fort de nano banana (cohérence par image de
   référence).
2. **Pas de texte dans l'image.** Les modèles écrivent mal ; l'app affiche déjà les légendes.
   Le bloc STYLE l'interdit explicitement.
3. **Format.** Les vignettes s'affichent en paysage (≈ 3:2). Demandez un **ratio 3:2**, sujet
   **centré**, large marge. Fond **crème `#FBF8F1`** (ou *transparent* si vous préférez des PNG
   détourés à poser sur les cartes).
4. **Palette stricte.** Tons chauds terreux de l'app (voir le bloc STYLE). Refusez tout néon /
   couleur vive hors palette.
5. **Lot.** Générez domaine par domaine pour garder la main sur la cohérence ; nommez chaque
   fichier exactement comme la **clé FIG** (ex. `sfeu.png`) pour un remplacement direct.

> Astuce : vous pouvez aussi fournir une capture de l'app (planche de contraste) comme
> référence visuelle initiale pour coller au style existant.

---

## 🎨 BLOC STYLE (à copier-coller devant chaque sujet)

```
Flat vector editorial illustration, minimalist and instructional, a single centered subject,
icon-like with generous negative space. Clean bold shapes, consistent medium line weight,
gentle rounded forms, soft matte fills, subtle screen-print paper grain, no harsh gradients.
Warm earthy limited palette ONLY: forest green #3F5E4E, terracotta #A4572F, sage green #5B7553,
walnut brown #8A5A3C, amber honey #C99A3F, muted taupe #6E6253, steel blue-grey #5E6E78,
dark ink #2A2520, on a warm cream background #FBF8F1. Calm, handcrafted, modern textbook feel.
No text, no letters, no numbers, no labels, no watermark, no UI. 3:2 landscape, centered.
Subject:
```

**Exemples de prompts complets**

- `… Subject: a cozy campfire with bright flames rising from crossed logs, a few sparks, simple and warm.`
- `… Subject: a queen bee wearing a tiny crown, surrounded by a few worker bees on honeycomb.`
- `… Subject: a welding helmet/mask seen from the front with gloves and a small burst of sparks beside it.`

---

## 📋 Les 71 sujets (groupés par domaine)

> Nom de fichier suggéré = la **clé** (colonne de gauche). `Subject:` = à coller après le bloc STYLE.

### Escalade (17)
| clé | Subject (EN, à coller après le STYLE) |
|-----|----------------------------------------|
| `esafety` | climbing safety gear: a helmet, a harness and a locking carabiner, neatly arranged |
| `eassurage` | two climber silhouettes, one belaying the other, a rope running through a belay device |
| `epieds` | close-up of a climbing shoe pressing precisely on a small foothold on a rock wall |
| `carre` | macro of a climbing shoe edging on its inside edge against a tiny rock ledge |
| `ebloc` | a boulderer silhouette climbing an overhanging wall above a thick crash pad |
| `etete` | a lead climber reaching up to clip the rope into a quickdraw |
| `edyn` | a climber mid-air doing a dynamic leap (dyno) between two holds, motion feel |
| `evoie` | a tall multi-pitch cliff face with small belay anchors, a climber far up |
| `huit` | a figure-eight follow-through climbing knot tied in a thick rope, clear loops |
| `cabestan` | a clove hitch knot wrapped around a climbing carabiner |
| `demicab` | a Munter (Italian) hitch on a climbing carabiner |
| `arret` | a stopper knot tied at the very end of a climbing rope |
| `prusik` | a Prusik friction hitch coiled around a vertical climbing rope |
| `machard` | a Klemheist/Machard friction hitch wrapped around a vertical rope |
| `mule` | a releasable mule knot tied off on a carabiner |
| `chaise` | a bowline knot forming a fixed loop in a thick rope |
| `forces` | a small climber figure hanging on a taut vertical rope with a downward force arrow |

### Mécanique générale (8)
| clé | Subject |
|-----|---------|
| `mtools` | mechanic hand tools, a torque wrench and a ratchet crossed, clean studio look |
| `couple` | a torque wrench tightening a hex bolt, a small star marking the exact setting |
| `mentretien` | car maintenance: an oil can pouring and a dipstick |
| `mfreins` | a car brake disc with its caliper and brake pads |
| `melec` | basic auto electrics: a multimeter connected to a car battery |
| `obd` | a handheld OBD diagnostic scanner with a simple screen (no readable text) |
| `mdistrib` | an engine timing belt looping around two toothed gears/pulleys |
| `mmoteur` | a small engine block with a piston, engine rebuild theme |

### Survie en nature (9)
| clé | Subject |
|-----|---------|
| `sprep` | wilderness preparation kit: a backpack, a folded map and a compass |
| `eau` | a large clean water droplet, water-purification theme, fresh and pure |
| `sfeu` | a cozy campfire with flames rising from crossed logs and a few sparks |
| `sabri` | a simple survival lean-to shelter made of branches |
| `ssecours` | a first-aid kit box with a cross symbol |
| `azimut` | a hiking baseplate compass with the needle pointing north, a bearing |
| `sauto` | a lone hiker with a backpack walking along a winding trail |
| `pecheur` | a double fisherman's knot joining two rope ends |
| `calendrier` | a wall calendar with colored dots marking the seasons (no readable text) |

### Apiculture (8)
| clé | Subject |
|-----|---------|
| `abio` | a single honey bee, friendly and clear, anatomy-focused |
| `areg` | an official paper document with an approval stamp/check, registration theme |
| `amat` | beekeeping equipment: a smoker, a hive tool and a veiled hat |
| `colonie` | an open beehive frame showing brood, pollen and capped honey |
| `asante` | bee health: a varroa mite on the back of a honey bee |
| `cycle` | bee life cycle in four stages: egg, larva, pupa, adult bee |
| `reine` | a queen bee wearing a tiny crown, surrounded by a few worker bees on comb |
| `miel` | harvesting honey: a glass jar of golden honey beside a piece of honeycomb |

### Travail du bois (8)
| clé | Subject |
|-----|---------|
| `bsecurite` | woodshop safety: a no-gloves-near-rotating-blade symbol and ear-protection muffs |
| `boutils` | hand woodworking tools: a wood chisel and a hand plane |
| `bmesure` | woodworking layout: a try square and a marking gauge with a scribed line |
| `belec` | a handheld circular saw (power tool), woodworking |
| `tenon` | a mortise-and-tenon woodworking joint about to fit together |
| `bcolle` | a glue-up: clamps pressing two glued boards, a glue bottle nearby |
| `bmeuble` | a finished small wooden cabinet with drawers and doors |
| `grain` | a wooden plank showing wood-grain direction, planing with the grain |

### Éthologie équine (7)
| clé | Subject |
|-----|---------|
| `hrsecurite` | safety around a horse: a horse with a highlighted rear kick-zone, approach by the shoulder |
| `hretho` | a horse galloping freely, prey animal / flight instinct, dynamic |
| `hrlangage` | a close-up horse head showing ear positions and an attentive eye (body language) |
| `hrloop` | positive reinforcement: a hand clicker and a treat, marker-then-reward |
| `hrshaping` | clicker training: a target stick and a horse's nose touching it |
| `hrdesens` | desensitization: a calm horse facing a scary object, approach-and-retreat arrow |
| `hrprog` | a training journal/notebook with a rising progress curve |

### Guitare (7)
| clé | Subject |
|-----|---------|
| `gsante` | a person seated with good posture cradling an acoustic guitar, relaxed wrists |
| `ganatomie` | an acoustic guitar shown clearly: body, soundhole, neck, headstock and tuners |
| `gaccords` | a guitar chord diagram: a fretboard grid with finger-position dots (no numbers) |
| `grythme` | a strumming hand holding a pick with down/up rhythm arrows over the strings |
| `gtab` | a guitar tablature: six horizontal lines for the six strings (no readable numbers) |
| `gbarre` | a barre chord: one index finger pressing flat across the fretboard, plus a capo |
| `garpege` | fingerstyle arpeggio: guitar strings plucked one by one, notes rising |

### Soudure (7)
| clé | Subject |
|-----|---------|
| `wsecurite` | welding safety: a welding helmet/mask seen from the front, gloves and a burst of sparks |
| `wprincipes` | joining principles: two metal plates meeting, a drop of molten filler and heat |
| `wetain` | soldering: a soldering iron touching a circuit board with a shiny solder joint |
| `wbrasage` | brazing: a torch flame heating a copper pipe joint with a filler rod |
| `warc` | arc welding (stick/MMA): an electrode striking a bright arc with sparks on steel |
| `wmigtig` | MIG/TIG welding: a welding torch/gun next to a shielding-gas bottle |
| `wmateriaux` | welding by material: small swatches of steel, stainless, aluminium, cast iron and plastic |

---

## Variantes utiles
- **Fond transparent** (pour superposer sur les cartes de l'app) : remplacer dans le STYLE
  « on a warm cream background #FBF8F1 » par « on a transparent background (PNG alpha) ».
- **Pictogramme plus simple** : ajouter « ultra-minimal, single icon, maximum negative space ».
- **Plus illustratif/scène** : ajouter « small editorial scene, soft depth, a hint of context ».
- **Cohérence parfaite d'un lot** : toujours fournir la 1ʳᵉ image validée comme référence et
  écrire « keep identical art style, palette and line weight as the reference image ».
