/* bienetre.js — Compétence « Bien-être » : boissons maison & petits rituels.
   PAS un cours à valider : une collection de recettes (cochables « déjà faite »)
   + des rituels bien-être. Injecté par assemble.js ; rendu par app.js. */
window.BIENETRE={
icon:'🌿', name:'Bien-être', color:'#5AA083',
meta:'Boissons maison & petits rituels — le bissap d’abord, puis d’autres recettes',
recettes:[
 {key:'bissap', ic:'🌺', t:'Bissap (jus d’hibiscus)', s:'La boisson reine : fleurs d’hibiscus infusées, fraîche et parfumée.',
  temps:'20 min + repos frais', pour:'≈ 1,5 L',
  ingr:['100 g de fleurs d’hibiscus séchées (bissap)','1,5 à 2 L d’eau','Sucre ou miel selon le goût (150–250 g)','1 sachet de sucre vanillé (ou 1 gousse de vanille)','Au choix : menthe fraîche, fleur d’oranger, jus de citron, gingembre, ananas'],
  etapes:['Rincer rapidement les fleurs d’hibiscus à l’eau claire.','Porter l’eau à frémissement, y jeter l’hibiscus, couper le feu et laisser infuser 15–30 min (plus c’est long, plus c’est corsé et acidulé).','Filtrer en pressant bien les fleurs.','Sucrer à chaud (le sucre se dissout mieux), ajouter la vanille et le parfum choisi.','Laisser refroidir, puis mettre au frais.','Servir très frais, avec des glaçons et une feuille de menthe.'],
  conseils:['Se garde 3–4 jours au réfrigérateur, dans une bouteille fermée.','Trop acidulé ? Rallonge d’eau et resucre. Trop fade ? Rallonge l’infusion la prochaine fois.'],
  anciens:['On ne fait JAMAIS bouillir l’hibiscus longtemps : on coupe le feu et on laisse infuser. Trop bouilli, il devient amer et perd sa belle couleur.','La menthe et la fleur d’oranger s’ajoutent APRÈS l’infusion, jamais pendant : sinon l’amertume prend le dessus.','Le secret des grands-mères : un bout de gingembre et une gousse de vanille dans l’infusion — et pour les jours de fête, un peu de jus d’ananas.','Les anciens laissent parfois infuser à froid, la jarre au soleil une demi-journée : le goût est plus rond, moins âpre.','On garde les fleurs pour une deuxième infusion, plus légère — on ne jette rien.','Ça se boit GLACÉ : au chaud, le bissap perd la moitié de son charme.']},
 {key:'gnamakoudji', ic:'🫚', t:'Jus de gingembre (gnamakoudji)', s:'Piquant et tonique, le cousin gingembre du bissap.',
  temps:'15 min + repos', pour:'≈ 1,5 L',
  ingr:['150 g de gingembre frais épluché','1,5 L d’eau','Le jus de 1–2 citrons','Sucre ou miel selon le goût','Au choix : vanille, fleur d’oranger, un peu d’ananas'],
  etapes:['Mixer le gingembre avec un peu d’eau jusqu’à obtenir une purée.','Ajouter le reste de l’eau, laisser reposer 15–20 min.','Filtrer à travers un linge fin en pressant bien.','Ajouter le jus de citron, sucrer, parfumer.','Servir bien frais — c’est fort, dose à ton goût.'],
  conseils:['Très concentré : on peut le boire allongé d’eau.','Réputé bon pour la digestion et un coup de fouet le matin.'] },
 {key:'menthe', ic:'🍵', t:'Thé à la menthe', s:'Le geste convivial : thé vert, menthe fraîche, bien sucré.',
  temps:'10 min', pour:'1 théière',
  ingr:['1 c. à soupe de thé vert (gunpowder)','1 gros bouquet de menthe fraîche','Sucre en morceaux selon le goût','Eau bouillante'],
  etapes:['Rincer le thé à l’eau chaude (jeter cette première eau, elle est amère).','Remettre le thé, ajouter l’eau bouillante, laisser infuser 3–4 min.','Ajouter la menthe et le sucre.','Verser de haut en versant-reversant dans les verres pour aérer et faire mousser.'],
  conseils:['Le geste de verser de haut fait la petite mousse : c’est la signature.','Deuxième et troisième infusion : chacune a son caractère.'] },
 {key:'golden', ic:'🟡', t:'Lait d’or (curcuma)', s:'Boisson chaude réconfortante, curcuma-gingembre, pour le soir.',
  temps:'10 min', pour:'2 tasses',
  ingr:['400 ml de lait (vache ou végétal)','1 c. à café de curcuma','½ c. à café de gingembre en poudre (ou frais râpé)','1 pincée de poivre noir (aide à assimiler le curcuma)','1 pincée de cannelle','Miel selon le goût'],
  etapes:['Verser le lait dans une casserole.','Ajouter curcuma, gingembre, poivre et cannelle.','Chauffer doucement en fouettant, sans faire bouillir, 3–5 min.','Sucrer au miel hors du feu, boire chaud.'],
  conseils:['La pincée de poivre n’est pas un détail : elle décuple l’effet du curcuma.','Parfait le soir, réconfortant et sans excitant.'] },
 {key:'citronnade', ic:'🍋', t:'Citronnade menthe-gingembre', s:'Ultra désaltérante pour les chaudes journées.',
  temps:'10 min', pour:'1,5 L',
  ingr:['Le jus de 4–5 citrons','1,5 L d’eau fraîche','1 morceau de gingembre râpé (facultatif)','1 bouquet de menthe','Sucre, miel ou sirop d’agave'],
  etapes:['Presser les citrons.','Mélanger jus, eau, gingembre et sucre jusqu’à dissolution.','Ajouter la menthe légèrement froissée.','Laisser reposer 15 min au frais, servir avec des glaçons.'],
  conseils:['Froisser la menthe (sans la déchirer) libère les arômes sans amertume.'] },
 {key:'tisane_soir', ic:'🌙', t:'Tisane du soir (détente)', s:'Le rituel avant de dormir : verveine, camomille, tilleul.',
  temps:'8 min', pour:'1 tasse',
  ingr:['1 c. à soupe de mélange verveine + camomille + tilleul (ou l’un des trois)','250 ml d’eau frémissante','Miel selon le goût'],
  etapes:['Chauffer l’eau sans la faire bouillir à gros bouillons.','Verser sur les plantes, couvrir, laisser infuser 5–7 min.','Filtrer, sucrer légèrement au miel.','Boire tranquillement, écrans éteints.'],
  conseils:['Couvrir pendant l’infusion garde les huiles essentielles apaisantes.','À boire 30–45 min avant le coucher.'] },
 {key:'digestion', ic:'🌱', t:'Infusion digestion', s:'Après un bon repas : menthe, gingembre, citron.',
  temps:'8 min', pour:'1 tasse',
  ingr:['Quelques feuilles de menthe fraîche','2–3 fines lamelles de gingembre','1 rondelle de citron','250 ml d’eau chaude'],
  etapes:['Mettre menthe, gingembre et citron dans la tasse.','Couvrir d’eau chaude, laisser infuser 5 min.','Boire chaud, après le repas.'],
  conseils:['Le trio menthe-gingembre-citron est le classique anti-lourdeurs.'] },
 {key:'detox', ic:'🥒', t:'Eau infusée fraîcheur', s:'Pour boire plus d’eau sans s’ennuyer : concombre, citron, menthe.',
  temps:'5 min + 1 h au frais', pour:'1 L',
  ingr:['1 L d’eau fraîche','½ concombre en rondelles','½ citron en rondelles','Quelques feuilles de menthe','Facultatif : quelques fruits rouges'],
  etapes:['Mettre tous les ingrédients dans une carafe.','Laisser infuser au moins 1 h au réfrigérateur.','Boire dans la journée, recharger d’eau 1 fois.'],
  conseils:['Le truc le plus simple pour boire assez d’eau quand il fait chaud ou qu’on travaille dehors.'] },
 {key:'smoothie', ic:'🍌', t:'Smoothie banane-avoine', s:'Un petit-déj complet à boire, rassasiant et doux.',
  temps:'5 min', pour:'1 grand verre',
  ingr:['1 banane bien mûre','3 c. à soupe de flocons d’avoine','200 ml de lait (ou boisson végétale)','1 c. à café de miel','1 pincée de cannelle','Facultatif : 1 c. à soupe de beurre de cacahuète'],
  etapes:['Mettre tous les ingrédients dans un blender.','Mixer jusqu’à consistance lisse.','Boire aussitôt, bien frais.'],
  conseils:['L’avoine cale pour toute la matinée — idéal avant une journée de chantier.'] }
],
astuces:[
 {cat:'Bien boire, bien se sentir', ic:'💧', items:[
  {t:'Bois avant d’avoir soif', d:'La soif, c’est déjà un début de déshydratation. Une gourde à portée, quelques gorgées régulières : l’eau infusée aide à en boire plus sans y penser.'},
  {t:'Le froid réveille, le chaud apaise', d:'Bissap, citronnade et eau infusée pour la fraîcheur et l’énergie ; tisane du soir et lait d’or pour se poser et préparer le sommeil.'},
  {t:'Sucre : dose à la baisse', d:'Réduis le sucre petit à petit sur quelques semaines — le palais s’habitue, et on savoure mieux le vrai goût des plantes et des fruits.'},
  {t:'Le gingembre, ton allié', d:'Un coup de fouet le matin (gnamakoudji), un coup de main à la digestion le soir : le même rhizome, deux usages.'}
 ]},
 {cat:'Petits rituels qui font du bien', ic:'🧘', items:[
  {t:'Respire en 365', d:'3 fois par jour, 6 respirations par minute, pendant 5 minutes (inspire 5 s / expire 5 s). La cohérence cardiaque calme le stress en quelques minutes.'},
  {t:'Bouge un peu, souvent', d:'Une marche de 10–15 min après le repas vaut mieux qu’une grosse séance rare : ça aide la digestion, la tête et le dos.'},
  {t:'Un sommeil régulier', d:'Se coucher et se lever à heures proches, même le week-end. Écrans éteints 30 min avant, une tisane, et la chambre au frais.'},
  {t:'Le matin sans écran', d:'Les 15 premières minutes réveillées sans téléphone : un verre d’eau, s’étirer, respirer — la journée démarre plus calme.'},
  {t:'La lumière du dehors', d:'Quelques minutes dehors le matin (même gris) calent l’horloge interne et améliorent l’humeur et le sommeil du soir.'}
 ]}
]
};
