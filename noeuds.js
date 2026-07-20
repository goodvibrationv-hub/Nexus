/* noeuds.js — Compétence « Nœuds » : grand catalogue de nœuds par famille.
   PAS un cours : catalogue consultable + recherche + « je le sais ». Injecté par assemble.js. */
window.NOEUDS={
icon:'➰', name:'Nœuds', color:'#9A8560',
meta:'Le catalogue des nœuds : à quoi ça sert, comment le faire, les pièges',
cats:[
 {cat:'Nœuds d’arrêt', ic:'🛑', noeuds:[
  {n:'Nœud simple (de vache)', diff:'facile', aka:'overhand', usage:'Empêche un cordage de filer ; base de beaucoup d’autres nœuds.',
   faire:['Fais une boucle avec le brin.','Passe l’extrémité à travers la boucle.','Serre.'],
   tips:'Le plus simple — mais il coince et devient dur à défaire sous charge.'},
  {n:'Nœud de huit', diff:'facile', aka:'figure-eight, nœud d’arrêt', usage:'Nœud d’arrêt qui ne coince pas et se défait bien ; base de l’escalade.',
   faire:['Fais une boucle.','Passe l’extrémité derrière le brin puis dans la boucle (tu dessines un 8).','Serre.'],
   tips:'Plus gros et plus sûr que le simple, et il se dénoue facilement.'},
  {n:'Nœud de capucin', diff:'moyen', aka:'nœud de barillet', usage:'Nœud d’arrêt volumineux, lestage, bout de corde.',
   faire:['Forme une boucle.','Passe l’extrémité 2 ou 3 fois dans la boucle (tours enroulés).','Serre en spirale.']}
 ]},
 {cat:'Boucles fixes', ic:'⭕', noeuds:[
  {n:'Nœud de chaise', diff:'moyen', aka:'bowline, roi des nœuds', usage:'La boucle qui ne serre pas et ne glisse pas : sauvetage, amarrage.',
   faire:['Fais un petit « puits » (boucle) sur le brin dormant.','L’extrémité sort du puits, fait le tour du dormant, puis replonge dans le puits.','Moyen mnémo : le lapin sort du terrier, tourne autour de l’arbre, rentre dans le terrier.','Serre.'],
   warn:'Peut se desserrer sous charge alternée : en escalade, ajoute un nœud d’arrêt sur le brin libre.'},
  {n:'Boucle en huit', diff:'facile', aka:'huit doublé, figure-eight loop', usage:'Boucle très sûre, standard en escalade (encordement).',
   faire:['Fais un huit simple en laissant du mou.','Repasse l’extrémité en suivant le tracé du huit à l’envers.','Serre les quatre brins parallèles.'],
   tips:'Se contrôle d’un coup d’œil : cinq paires de brins bien rangées.'},
  {n:'Nœud papillon', diff:'moyen', aka:'nœud de guide, alpine butterfly', usage:'Boucle au MILIEU d’une corde ; tire dans les trois directions.',
   faire:['Fais deux tours autour de la main.','Passe le tour du milieu par-dessus les deux autres, puis dessous.','Sors la boucle, retire la main, serre.'],
   tips:'Parfait pour isoler une portion de corde abîmée.'},
  {n:'Nœud de plein poing', diff:'facile', aka:'boucle simple', usage:'Boucle rapide (moins solide que le huit).',
   faire:['Plie la corde en double.','Fais un nœud simple avec la corde doublée.','Serre.'],
   warn:'Coince très fort : plutôt du dépannage qu’un usage sécurité.'}
 ]},
 {cat:'Ajuts (joindre deux cordes)', ic:'🔗', noeuds:[
  {n:'Nœud plat', diff:'facile', aka:'nœud de récif, reef knot', usage:'Réunit deux cordes de MÊME diamètre sous faible charge (colis, bandage).',
   faire:['Gauche sur droite, passe dessous.','Puis droite sur gauche, passe dessous.','Serre : les deux boucles s’emboîtent à plat.'],
   warn:'Glisse sous forte charge ou diamètres différents : JAMAIS pour la sécurité.'},
  {n:'Nœud d’écoute', diff:'facile', aka:'sheet bend', usage:'Joint deux cordes, même de diamètres différents.',
   faire:['Fais une boucle en U avec la plus grosse corde.','La fine passe dans la boucle, fait le tour des deux brins, puis se coince sous elle-même.','Serre.'],
   tips:'Double le tour (double écoute) pour bien plus de tenue.'},
  {n:'Nœud de pêcheur', diff:'moyen', aka:'fisherman’s knot', usage:'Joint deux cordes fines ; solide, pour cordelette.',
   faire:['Pose les deux cordes côte à côte, têtes opposées.','Avec chaque extrémité, fais un nœud simple autour de l’AUTRE corde.','Tire : les deux nœuds se rejoignent et se bloquent.']},
  {n:'Double nœud de pêcheur', diff:'moyen', aka:'grapevine, double fisherman’s', usage:'Version renforcée : anneaux de cordelette, prusik, rappel.',
   faire:['Comme le pêcheur, mais chaque nœud est un double tour (capucin).','Serre chaque nœud, puis rapproche-les.'],
   tips:'LE standard pour fermer une cordelette en anneau.'},
  {n:'Nœud de Carrick', diff:'moyen', usage:'Joint deux gros cordages ; ne coince pas, se défait après charge.',
   faire:['Fais une boucle avec une corde.','L’autre corde tisse par-dessus/dessous en alternant (sur-sous-sur-sous).','Serre : le nœud se capèle en un beau motif.']},
  {n:'Nœud de ruban', diff:'moyen', aka:'water knot, nœud de sangle', usage:'Joint ou ferme une SANGLE (anneau d’escalade).',
   faire:['Fais un nœud simple lâche dans une extrémité de sangle.','L’autre extrémité le suit à l’envers, bien à plat et parallèle.','Serre à fond, laisse 8–10 cm de rab.'],
   warn:'À vérifier avant CHAQUE usage : il peut se desserrer avec le temps.'}
 ]},
 {cat:'Nœuds d’accroche (sur un support)', ic:'📌', noeuds:[
  {n:'Deux demi-clés', diff:'facile', aka:'two half hitches', usage:'Amarrer à un anneau ou un poteau.',
   faire:['Passe la corde autour du support.','Fais une demi-clé (tour autour du dormant), puis une seconde identique.','Serre.']},
  {n:'Tour mort et deux demi-clés', diff:'facile', aka:'round turn & two half hitches', usage:'Amarrage qui tient sous tension (bateau, bâche).',
   faire:['Fais un TOUR MORT complet (deux tours) autour du support.','Puis deux demi-clés sur le brin dormant.','Serre.'],
   tips:'Le tour mort encaisse la charge pendant que tu fais les clés.'},
  {n:'Nœud de cabestan', diff:'facile', aka:'clove hitch', usage:'Amarrage rapide et réglable ; relais d’escalade.',
   faire:['Fais un tour autour du support.','Un second tour en croisant par-dessus le premier.','Passe l’extrémité sous le croisement, serre.'],
   warn:'Peut se desserrer si la tension varie beaucoup.'},
  {n:'Tête d’alouette', diff:'facile', aka:'cow hitch, lark’s head', usage:'Accrocher une boucle ou une sangle sur un anneau, une barre.',
   faire:['Plie la corde en boucle.','Passe la boucle derrière la barre.','Rabats-la par-dessus, passe les deux extrémités dedans, serre.']},
  {n:'Nœud de bois', diff:'facile', aka:'timber hitch', usage:'Traîner ou hisser une bûche, un rondin.',
   faire:['Passe la corde autour du tronc.','Fais un tour de l’extrémité autour du dormant, puis 3–4 tours sur elle-même.','Tire : ça mord sur le bois.'],
   tips:'Se défait tout seul dès que la tension retombe.'},
  {n:'Nœud de taquet', diff:'facile', aka:'cleat hitch', usage:'Amarrer une aussière sur un taquet (bateau, ponton).',
   faire:['Un tour à la base du taquet.','Des « 8 » autour des deux cornes.','Termine par une demi-clé retournée, serre.']}
 ]},
 {cat:'Tension & coulants', ic:'🎚️', noeuds:[
  {n:'Nœud coulant', diff:'facile', aka:'running knot, nœud coulissant', usage:'Boucle qui se resserre (fermer un sac, un lien).',
   faire:['Fais un nœud simple sans serrer.','Repasse une boucle du dormant dans le nœud.','Tire : la boucle coulisse.'],
   warn:'Se resserre sous charge : jamais autour de soi ni d’un être vivant.'},
  {n:'Nœud de camionneur', diff:'moyen', aka:'trucker’s hitch', usage:'Tendre FORT une corde (arrimage, bâche) : effet palan.',
   faire:['Fais une boucle fixe au milieu (plein poing ou papillon).','Passe l’extrémité autour de l’ancrage puis DANS la boucle.','Tire pour tendre (démultiplication ~3:1), bloque par deux demi-clés.'],
   tips:'Le nœud d’arrimage par excellence.'},
  {n:'Nœud de tension de tente', diff:'moyen', aka:'taut-line hitch', usage:'Hauban de tente réglable qui garde la tension.',
   faire:['Passe la corde autour du piquet.','Fais deux tours à l’INTÉRIEUR de la boucle, puis un tour à l’extérieur.','Serre : le nœud coulisse à la main mais tient sous tension.']},
  {n:'Nœud de jambe de chien', diff:'moyen', aka:'sheepshank', usage:'Raccourcir une corde sans la couper, isoler une partie usée.',
   faire:['Fais deux plis en Z (trois brins parallèles).','À chaque bout, passe une demi-clé du brin sur la boucle.','Serre doucement.'],
   warn:'Ne tient que SOUS tension : dépannage seulement.'}
 ]},
 {cat:'Autobloquants (friction)', ic:'🧗', noeuds:[
  {n:'Nœud de Prusik', diff:'moyen', usage:'Remonter sur corde ; autobloquant symétrique (secours).',
   faire:['Avec un anneau de cordelette (double pêcheur), fais une tête d’alouette sur la corde.','Repasse 2–3 fois de plus dans l’anneau (tours bien rangés, symétriques).','Charge : il bloque ; détends : il coulisse.'],
   tips:'Cordelette nettement plus fine que la corde porteuse (≈ 2/3 du diamètre).'},
  {n:'Machard', diff:'moyen', aka:'klemheist', usage:'Autobloquant qui tient dans un sens, plus facile à faire glisser.',
   faire:['Enroule l’anneau 3–4 fois autour de la corde, vers le haut.','Passe la boucle du bas dans celle du haut.','Charge vers le bas : il mord.']},
  {n:'Machard tressé', diff:'moyen', aka:'French prusik', usage:'Autobloquant débrayable sous charge (contre-assurage du rappel).',
   faire:['Enroule l’anneau autour de la corde 4–6 fois.','Connecte les deux boucles avec un mousqueton.','Se relâche à la main même sous tension.'],
   warn:'Contre-assurage : se place SOUS le descendeur, jamais au-dessus.'}
 ]},
 {cat:'Nœuds de pêche', ic:'🎣', noeuds:[
  {n:'Nœud de Palomar', diff:'facile', usage:'Attacher un hameçon ou un émerillon ; très solide et simple.',
   faire:['Plie le fil en double, passe la boucle dans l’œillet.','Fais un nœud simple avec la boucle doublée.','Passe l’hameçon à travers la boucle.','Mouille et serre.'],
   tips:'Un des nœuds de pêche les plus fiables.'},
  {n:'Clinch amélioré', diff:'moyen', aka:'improved clinch', usage:'Relier le fil à l’hameçon.',
   faire:['Passe le fil dans l’œillet, fais 5 à 7 tours autour du fil.','Repasse l’extrémité dans la petite boucle près de l’œillet, puis dans la grande boucle.','Mouille et serre en tirant sur l’hameçon.']}
 ]},
 {cat:'Marins & décoratifs', ic:'⚓', noeuds:[
  {n:'Pomme de touline', diff:'difficile', aka:'monkey’s fist', usage:'Leste le bout d’un cordage pour le lancer ; décoratif.',
   faire:['Fais trois tours verticaux.','Trois tours horizontaux autour des premiers.','Trois tours à l’intérieur, autour des horizontaux.','Serre progressivement autour d’une bille.']},
  {n:'Tête de turc', diff:'difficile', aka:'Turk’s head', usage:'Nœud décoratif en anneau (poignées, foulards, bracelets).',
   faire:['Enroule en tressant sur-sous autour d’un support cylindrique.','Suis le tracé une 2e voire 3e fois, en parallèle.','Serre régulièrement pour égaliser.']}
 ]}
]
};
