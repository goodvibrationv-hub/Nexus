/* Aménagement de camion — PAS un cours : un guide de chantier en modules pas-à-pas,
   avec conseils + exemples + renvois vers les domaines liés, et un onglet « Meilleures astuces ».
   Injecté par assemble.js ; consommé par app.js (renderAmenHub / renderAmenModule / renderAstuces). */
window.AMENAGEMENT={
icon:'🚐', name:'Aménagement de camion', color:'#4E708C',
meta:'Du fourgon vide au camion aménagé : 10 modules, dans l’ordre du vrai chantier',
modules:[
{key:'concevoir', ic:'📐', t:'1. Concevoir le projet', s:'Besoins réels, plan au sol, poids, budget : tout se décide ici — bien avant le premier coup de visseuse.', etapes:[
 {t:'Lister les vrais besoins', d:'Combien de couchages ? Combien de jours d’autonomie ? Hiver ou été ? Week-ends ou vie à bord ? Chaque réponse change le plan, l’isolation et la taille du parc batterie.',
  conseils:['Classe chaque envie en « indispensable / confort / gadget » — et coupe les gadgets.','Pars une semaine en mode camping avec une liste : note ce qui te manque VRAIMENT (c’est rarement la douche).'],
  ex:'Ex : 2 couchages + 3 jours d’autonomie + usage hiver → isolation renforcée, chauffage autonome, ~200 Ah de batterie.'},
 {t:'Dessiner le plan au sol à l’échelle', d:'Mesure l’intérieur (longueur, largeur AU niveau des passages de roue, hauteur sous pavillon) et dessine 2–3 variantes : lit fixe, banquette-lit, cuisine latérale ou arrière.',
  conseils:['Trace le plan grandeur nature au scotch de masquage dans le fourgon vide, et vis dedans une heure : les couloirs trop étroits sautent aux yeux.','Le lit d’abord : c’est le plus gros meuble, tout le reste s’organise autour.'],
  ex:'Ex : un lit en travers ne passe que si la caisse fait plus de 1,80 m de large — sinon lit longitudinal et tout le plan change.'},
 {t:'Faire le bilan de poids (PTAC)', d:'Carte grise : PTAC moins poids à vide = charge utile. Isolation, bois, eau, batteries, passagers, outils : tout se pèse et s’additionne — le dépassement est une infraction et un danger.',
  conseils:['Garde 150–200 kg de marge finale : elle fond toujours.','L’eau pèse 1 kg par litre et les batteries plomb ~30 kg pièce : place-les basses et près de l’essieu.','Passe sur une bascule publique avant ET après le chantier.'], liens:['g270']},
 {t:'Chiffrer le budget et l’ordre du chantier', d:'L’ordre est quasi immuable : base saine → ouvertures → câbles et gaines passés → isolation → habillage → électricité finale → mobilier → eau/gaz → finitions. Revenir en arrière coûte double.',
  conseils:['Prévois +30 % d’imprévus sur le budget : c’est la moyenne constatée, pas du pessimisme.','Achète au fil des modules, pas tout d’avance : le plan bouge toujours.'],
  ex:'Ex : isoler avant d’avoir passé les gaines électriques = tout rouvrir au cutter deux mois plus tard.'}
]},
{key:'base', ic:'🧱', t:'2. Base saine', s:'Rouille traitée, fuites réparées, tôle protégée : on ne construit jamais sur un support douteux.', etapes:[
 {t:'Vider et inspecter', d:'Caisse nue, lampe puissante : rouille (plancher, bas de caisse, passages de roue), traces d’eau après une grosse pluie, joints de portes et de pavillon, dessous du véhicule.',
  conseils:['Arrose le toit au tuyau pendant qu’une personne guette à l’intérieur : les fuites se révèlent tout de suite.','Photographie chaque défaut : c’est ta liste de chantier du module.'], liens:['meca']},
 {t:'Traiter la rouille', d:'Brosse métallique ou disque à lamelles jusqu’au métal sain, convertisseur de rouille sur les piqûres, apprêt antirouille puis peinture. Une rouille cachée sous l’isolant travaille pendant des années.',
  conseils:['La rouille perforante ne se « traite » pas : elle se découpe et se ressoude.','Traite aussi les zones saines qui seront inaccessibles ensuite : c’est maintenant ou jamais.'], liens:['soudure','meca']},
 {t:'Réparer et renforcer', d:'Tôles percées : pièce soudée ou rivetée + étanchéité. C’est aussi le moment de souder des renforts là où le mobilier lourd sera fixé.',
  conseils:['Un insert ou une plaque de répartition soudée maintenant vaut mieux que dix vis dans de la tôle fine plus tard.'], liens:['soudure']},
 {t:'Étanchéité et protection', d:'Mastic carrossier (type Sikaflex) sur les jonctions douteuses, antigravillon sous la caisse, cire corps creux dans les longerons. Puis re-test complet au tuyau d’arrosage.',
  conseils:['Jamais de silicone de salle de bain sur un véhicule : ça bouge, ça se décolle, et rien n’accroche dessus ensuite.'],
  ex:'Ex : une micro-fuite de joint de feu arrière suffit à pourrir un plancher isolé en un hiver.'}
]},
{key:'isolation', ic:'🧣', t:'3. Isolation & condensation', s:'Le confort d’un camion se joue là : isolant adapté, ponts thermiques traités, stratégie anti-condensation claire.', etapes:[
 {t:'Choisir l’isolant', d:'Liège projeté, laine de mouton, laine de bois, ou mousse élastomère (type Armaflex) : chacun a ses forces. Le critère n°1 en véhicule : supporter l’humidité sans se tasser ni moisir.',
  conseils:['Évite la laine de verre : elle se tasse avec les vibrations et retient l’eau.','L’Armaflex autocollant épouse la tôle sans lame d’air : c’est sa grande force contre la condensation.'],
  ex:'Ex courant : 19–25 mm d’Armaflex sur parois et pavillon, liège ou laine de bois au sol.'},
 {t:'Traquer les ponts thermiques', d:'Chaque montant métallique nu est un pont froid qui ruisselle en hiver. Les traverses et raidisseurs se couvrent aussi, même avec une épaisseur fine.',
  conseils:['Passe la main partout après isolation : là où tu sens le froid, ça condensera.','Les passages de roue aussi : souvent oubliés, toujours trempés.']},
 {t:'Choisir sa stratégie vapeur', d:'Deux écoles : barrière étanche (pare-vapeur scotché à 100 %, difficile à réussir) ou paroi qui respire (isolant tolérant + forte ventilation). Choisis-en UNE et tiens-la partout.',
  conseils:['Un pare-vapeur percé de partout est pire que pas de pare-vapeur : l’humidité entre et ne ressort plus.','En fourgon, la ventilation permanente reste ta meilleure assurance anti-moisissure.']},
 {t:'Isoler le sol et poser le plancher', d:'Lambourdes ou isolant haute densité, puis contreplaqué 12–15 mm vissé. Le sol porte tout : il doit être plan, sec et solidement fixé.',
  conseils:['Repère et note les points de fixation châssis AVANT de poser le plancher : tu en auras besoin pour le mobilier.','Un contreplaqué filmé (type CTBX) au sol résiste aux flaques de bottes mouillées.'], liens:['bois']}
]},
{key:'ouvertures', ic:'🪟', t:'4. Ouvertures', s:'Fenêtres, lanterneau, aérations : découper la tôle fait peur, mais c’est méthodique — et la lumière change tout.', etapes:[
 {t:'Positionner les ouvertures', d:'Lumière, vue, vis-à-vis, mais aussi : ne pas tomber sur un montant structurel, et rester cohérent avec le plan des meubles (une fenêtre derrière un placard ne sert à rien).',
  conseils:['Un lanterneau au-dessus du coin cuisine évacue vapeur et odeurs là où elles naissent.','Vérifie l’emplacement des câbles et renforts au détecteur avant de tracer.']},
 {t:'Découper la tôle', d:'Traçage au gabarit du fabricant, perçage des angles, découpe à la scie sauteuse (lame métal fine) ou grignoteuse, ébavurage soigneux, antirouille sur le chant nu.',
  conseils:['Scotch de masquage large le long du trait : la semelle de la scie ne raye pas la peinture.','Fais-toi la main sur la chute avant la vraie découpe.','Habille le chant d’un joint en U : anti-coupure et anti-rouille.'], liens:['meca']},
 {t:'Poser et étancher', d:'Cadre intérieur (contre-cadre bois si paroi fine), mastic-colle carrossier en cordon continu, serrage progressif et modéré : trop serré, le mastic est chassé et ça fuit.',
  conseils:['Pose par temps sec et doux (10–25 °C) : les mastics détestent le froid.','Test au tuyau 24 h après, avant d’habiller l’intérieur.'],
  ex:'Ex : 90 % des fuites de lanterneau viennent d’un cordon interrompu dans un angle.'},
 {t:'Créer une ventilation permanente', d:'Une entrée d’air basse + une sortie haute (lanterneau entrouvrable ou aérateur statique) qui restent ouvertes même fermé/roulant. Obligatoire avec du gaz à bord, vital contre la condensation.',
  conseils:['On dort mieux dans un camion frais et sec que dans une boîte hermétique trempée : ne bouche JAMAIS les aérations, même en hiver.']}
]},
{key:'electricite', ic:'⚡', t:'5. Électricité 12/24 V', s:'Batterie auxiliaire, solaire, protections : le module le plus technique — et celui où l’à-peu-près se paie cash.', etapes:[
 {t:'Dimensionner le besoin', d:'Liste chaque appareil × sa consommation × ses heures par jour = bilan en Ah/jour. Le parc batterie doit couvrir 2–3 jours, le solaire recharger une journée moyenne.',
  conseils:['Le frigo à compresseur est le gros poste : 30–50 Ah/jour à lui seul.','Tout en LED et en 12 V natif : le convertisseur 220 V gaspille.'],
  ex:'Ex : frigo 40 Ah + LED 5 Ah + téléphones 10 Ah + pompe 3 Ah ≈ 60 Ah/j → 150–200 Ah utiles + 300–400 W de solaire.'},
 {t:'Choisir batterie et charge roulante', d:'AGM (économique, lourde, 50 % utilisable) ou lithium LiFePO₄ (chère, légère, 80–90 % utilisable, charge rapide). Recharge en roulant : chargeur booster DC-DC, indispensable avec les alternateurs récents.',
  conseils:['Ne jamais coupler des batteries d’âges ou de technologies différents.','Le lithium refuse la charge sous 0 °C : batterie à l’intérieur du volume chauffé.'], liens:['g270','meca']},
 {t:'Installer le solaire', d:'Panneaux rigides collés/vissés sur rails, presse-étoupe étanche pour la traversée de toit, régulateur MPPT dimensionné, câblage au plus court.',
  conseils:['Le MPPT récupère 20–30 % de plus qu’un PWM : l’économie de 40 € n’en vaut pas la peine.','Passe le câble par un presse-étoupe collé, jamais par un joint de porte pincé.']},
 {t:'Câbler proprement', d:'Sections adaptées à l’intensité ET à la longueur, un fusible à la SOURCE de chaque ligne, coupe-circuit général accessible, cosses serties, gaines partout où ça frotte.',
  conseils:['Le fusible protège le câble, pas l’appareil : il se calcule sur la section du fil.','Étiquette chaque ligne aux deux bouts : le toi de dans 3 ans te remerciera.','Schéma complet sur papier, collé dans le placard électrique.'], liens:['g270']},
 {t:'Le 220 V éventuel', d:'Convertisseur pur sinus si besoin réel (PC, petit électroménager), prise de quai avec disjoncteur différentiel 30 mA pour les campings. Sinon : s’en passer, tout existe en 12 V.',
  conseils:['Le 220 V en véhicule peut tuer : différentiel obligatoire, et dans le doute, fais valider par un pro.']}
]},
{key:'eau', ic:'🚿', t:'6. Eau & plomberie', s:'Simple et réparable : réservoirs, une pompe, un évier — et une vraie stratégie hors gel.', etapes:[
 {t:'Dimensionner les réservoirs', d:'Eau propre : 10–15 L/jour/personne en usage sobre. Eaux grises : au moins la moitié du volume propre. Bidons amovibles (simples, hors gel facile) ou réservoirs fixes (confort).',
  conseils:['Deux bidons de 20 L valent souvent mieux qu’une cuve de 100 L : remplissage partout, portage possible, gel maîtrisé.','Réservoir fixe = à l’intérieur du volume chauffé si tu roules l’hiver.']},
 {t:'Installer pompe et évier', d:'Pompe à pied (fiable, sobre, aucune électricité) ou pompe électrique à pressostat (confort). Évier inox + robinet, évacuation directe vers le réservoir gris.',
  conseils:['La pompe à pied laisse les deux mains libres et ne tombe jamais en panne au fond des Carpates.','Un clapet anti-retour évite de réamorcer à chaque fois.'],
  ex:'Ex : pompe à pied Whale + évier 30 cm : la config la plus répandue en fourgon sobre.'},
 {t:'La douche : vraiment ?', d:'Une cabine de douche coûte 1 m² précieux, de l’eau, de l’énergie et crée de l’humidité. Beaucoup l’enlèvent après un an. Alternatives : douchette extérieure, douche solaire, gants + piscines municipales.',
  conseils:['Si tu la fais quand même : bac étanche, paroi ventilée, et vidange au point bas.']},
 {t:'Prévoir l’hivernage', d:'Tout le circuit doit pouvoir se vidanger par gravité : vannes aux points bas, pompe purgeable, bidons rentrés. Une pompe ou un robinet gelé = fendu = à changer.',
  conseils:['Avant le premier gel : vidange complète + pompe qui tourne 5 s à vide pour chasser l’eau résiduelle.']}
]},
{key:'mobilier', ic:'🪚', t:'7. Mobilier & menuiserie', s:'Léger, solide, fixé au châssis : le mobilier de camion n’est pas du meuble de maison.', etapes:[
 {t:'Construire léger', d:'Ossature tasseaux (ou alu) + contreplaqué peuplier 5–15 mm : rigide et deux fois plus léger que le massif ou l’aggloméré. Chaque kilo compte dans le bilan PTAC.',
  conseils:['Le CP peuplier 15 mm pour les plans qui portent, 5 mm pour les façades et fonds.','Évide les panneaux invisibles à la scie cloche : des centaines de grammes par meuble.'], liens:['bois']},
 {t:'Fixer au véhicule', d:'Un meuble de 40 kg à 80 km/h devient un projectile au freinage. Fixation dans les inserts d’origine, écrous à river dans les montants, plaques de répartition — jamais des vis à bois dans la tôle seule.',
  conseils:['Pense « tonneau » : chaque meuble doit tenir la caisse retournée.','Les écrous à river (rivnuts) transforment n’importe quel montant en point d’ancrage propre.'],
  ex:'Ex : un lit fixé à 6 points (4 au plancher + 2 en paroi) ne bouge pas, même chargé de coffres.'},
 {t:'Le lit et ses coffres', d:'Lit fixe (confort, gros garage dessous) ou banquette-lit (place le jour, manœuvre le soir). Sous le lit : les coffres profonds pour le lourd et le rarement utilisé.',
  conseils:['Hauteur de lit : assez pour glisser des caisses standard dessous, assez bas pour s’asseoir sans toucher le pavillon.','Sommier à lattes ventilé, jamais un panneau plein : le matelas moisit par en dessous.'], liens:['bois']},
 {t:'Finitions qui tiennent la route', d:'Chants poncés ou couverts, huile ou vernis mat, poignées encastrées, et surtout : loquets qui verrouillent VRAIMENT (push-lock, grenouillères). Un placard qui s’ouvre en virage vide sa vaisselle.',
  conseils:['Teste chaque loquet en secouant fort le meuble : le premier col de montagne le fera de toute façon.'], liens:['bois']}
]},
{key:'cuisine', ic:'🍳', t:'8. Cuisine & gaz', s:'Le coin le plus utilisé du camion — et le seul qui peut exploser : implantation maligne, gaz dans les règles.', etapes:[
 {t:'Implanter le coin cuisine', d:'Plan de travail continu (le vrai luxe), rangements lourds en bas, épices et couverts à portée. Près de la porte latérale : on cuisine aussi dehors.',
  conseils:['30 cm de plan de travail libre minimum de chaque côté du feu.','Un rail + crochets au-dessus : ustensiles pendus, tiroirs libérés.']},
 {t:'Le gaz dans les règles', d:'Bouteille dans un coffre étanche vers l’habitacle et ventilé vers l’EXTÉRIEUR (le gaz est plus lourd que l’air : aération en bas), lyre ou flexible daté, détendeur adapté, robinet d’arrêt accessible.',
  conseils:['Test d’étanchéité à l’eau savonneuse à CHAQUE changement de bouteille : des bulles = fuite.','Flexibles : date de péremption dessus, on la respecte.'],
  ex:'Ex de coffre conforme : caisson bois étanche, aération Ø 40 mm vers le bas à travers le plancher, bouteille sanglée.'},
 {t:'Les alternatives au gaz', d:'Réchaud amovible (cartouches, zéro installation fixe), ou induction si (et seulement si) gros parc lithium + convertisseur costaud. Chaque option a son vrai coût en poids et en énergie.',
  conseils:['L’induction consomme ~100 Ah pour un repas complet : réserve-la aux parcs 300 Ah+ avec du solaire sérieux.']},
 {t:'La sécurité incendie', d:'Détecteur de CO + détecteur de gaz (posé BAS), extincteur à poudre ou à mousse accessible depuis le couchage ET la cuisine, couverture anti-feu près du réchaud.',
  conseils:['Le CO ne prévient pas : détecteur obligatoire dès qu’une flamme brûle à bord (réchaud, chauffage).','Teste les détecteurs au changement d’heure, comme à la maison.']}
]},
{key:'confort', ic:'🌡️', t:'9. Chauffage, air & confort', s:'Dormir au sec et au chaud par −5 °C : chauffage adapté, ventilation jamais coupée, occultation sérieuse.', etapes:[
 {t:'Choisir le chauffage', d:'Chauffage diesel à air pulsé (type Webasto, Autoterm ou « chinois ») branché sur le réservoir du véhicule : la référence en fourgon. Gaz possible mais gourmand en bouteilles. Électrique : seulement en camping.',
  conseils:['2 kW suffisent pour un fourgon isolé ; le 5 kW tournera toujours au ralenti et s’encrassera.','Les modèles « chinois » marchent bien SI montage soigné : échappement étanche, carburant propre, CO surveillé.'], liens:['meca','g270']},
 {t:'Monter le chauffage dans les règles', d:'Traversée de plancher avec les passe-cloisons du kit, échappement inox incliné sous caisse loin des ouvertures, prise d’air combustion extérieure, pompe à carburant inclinée et suspendue (bruit).',
  conseils:['L’échappement qui fuit sous le plancher = CO dans l’habitacle : contrôle chaque collier, puis re-contrôle après 500 km.'], liens:['meca']},
 {t:'Ventiler, encore et toujours', d:'Deux personnes qui dorment rejettent ~1 L d’eau par nuit. Sans flux d’air permanent, cette eau finit en gouttelettes sur la tôle froide, puis en moisissure derrière les meubles.',
  conseils:['Lanterneau entrouvert + entrée d’air basse, même en hiver : l’air sec se chauffe vite, l’air humide jamais.','Un petit hygromètre à 5 € t’apprend plus sur ton camion qu’un forum entier.']},
 {t:'Occulter et s’installer', d:'Occultations isolantes (multicouche découpé aux vitres) : anti-regards, anti-froid, anti-condensation sur les vitrages. Moustiquaires aux ouvrants. Puis la vraie literie : un bon matelas change la vie à bord.',
  conseils:['Vitres avant comprises : c’est la plus grande surface froide du véhicule.','Coupe tes occultations dans du multicouche de chantier : 10 € et aussi efficace que le sur-mesure.']}
]},
{key:'homologation', ic:'📋', t:'10. Homologation & essais', s:'VASP, pesée, essai longue durée : les dernières étapes qui transforment un chantier en camion fiable et en règle.', etapes:[
 {t:'Comprendre le VASP', d:'Un fourgon aménagé à demeure devrait passer en carte grise VASP « caravane ». Ça encadre l’assurance (un aménagement non déclaré peut être exclu en cas de sinistre) et fixe des exigences techniques précises.',
  conseils:['Appelle ton assureur AVANT de choisir : certains couvrent l’aménagement en CTTE, d’autres exigent le VASP.','Aménagement amovible (caissons non fixés) = régime différent : renseigne-toi selon ton usage.']},
 {t:'Préparer le dossier technique', d:'Les points contrôlés (type DREAL) : couchage fixé, gaz conforme (coffre ventilé, attestation possible), électricité protégée, aérations permanentes, extincteur, sièges et ceintures d’origine intacts.',
  conseils:['Construis conforme dès le départ (modules 4, 5, 8) : le dossier devient une formalité au lieu d’un re-chantier.','Garde factures et photos du chantier : elles documentent le dossier.']},
 {t:'Peser et équilibrer', d:'Bascule publique, camion chargé comme en voyage (eau, gaz, outils, passagers). Vérifie le total ET la charge par essieu : un arrière surchargé dégrade freinage et tenue de route.',
  conseils:['Trop lourd ? Chasse d’abord l’eau embarquée inutile et les « au cas où » : c’est là que dorment 100 kg.'], liens:['g270']},
 {t:'Faire l’essai longue durée', d:'Un week-end complet à bord, proche de chez toi, par météo moyenne : tout ce qui cloche se révèle (rangement impossible, condensation, loquet faible, câble qui vibre). Note tout, retouche, recommence.',
  conseils:['La liste des retouches du premier week-end vaut tous les plans du monde : c’est le camion qui parle.','Rien ne doit vibrer ni cogner en roulant : chaque bruit est une vis qui se dévisse quelque part.'],
  ex:'Ex : c’est toujours au premier week-end qu’on découvre que la porte du frigo s’ouvre dans les ronds-points.'}
]}
],
astuces:[
{cat:'Gain de place', ic:'📦', items:[
 {t:'Tout doit avoir DEUX fonctions', d:'Banquette = coffre, marche = tiroir, table = rallonge du plan de travail, dossier = tête de lit. Un élément mono-fonction doit mériter sa place.'},
 {t:'Utilise les murs et le plafond', d:'Filets élastiques au pavillon (vestes, pain), rails + crochets, barres aimantées pour les couteaux : le volume en l’air est gratuit.'},
 {t:'Caisses standardisées', d:'Un seul format de caisse (type Euroboxes) partout : tout s’empile, tout se range, et le garage sous le lit devient une étagère mobile.'},
 {t:'La porte est un rangement', d:'Contre-portes arrière : panneaux perforés pour l’outillage, poches en tissu pour le petit matériel. Zéro place volée à l’habitacle.'},
 {t:'Vide sanitaire sous le plancher', d:'Entre deux lambourdes : niveaux, cales, sangles à plat sous une trappe. Parfait pour le plat et le lourd rarement utilisé.'}
]},
{cat:'Poids — l’ennemi n°1', ic:'⚖️', items:[
 {t:'Pèse chaque planche avant de l’embarquer', d:'Un pèse-personne à l’entrée de l’atelier : tu refuseras vite le MDF (lourd) au profit du CP peuplier, et le carrelage au profit du lino.'},
 {t:'Le lourd en bas, entre les essieux', d:'Batteries, eau, outillage : le plus bas et le plus centré possible. Le camion se conduit mieux et freine droit.'},
 {t:'L’eau se module', d:'Pars avec 20 L pour le week-end au lieu de 100 L « au cas où » : 80 kg économisés instantanément. On trouve de l’eau partout.'},
 {t:'Évide ce qui ne se voit pas', d:'Scie cloche dans les fonds, les renforts et les tasseaux surdimensionnés : des kilos invisibles en moins, la solidité reste.'}
]},
{cat:'Budget & récup’', ic:'💶', items:[
 {t:'Le gros œuvre neuf, le reste d’occasion', d:'Isolant, mastic, câbles, fusibles : neufs, toujours. Fenêtres, lanterneau, évier, réchaud, chauffage : le marché de l’occasion van regorge de matériel quasi neuf à −50 %.'},
 {t:'Chutes de chantier', d:'Menuisiers et chantiers jettent du CP et des tasseaux parfaits pour des façades et caissons. Demander coûte zéro.'},
 {t:'N’achète pas d’avance', d:'Le plan change à chaque module : le matériel acheté « pour plus tard » finit revendu à perte. Achète au début de chaque module, pas avant.'},
 {t:'Le multicouche de chantier est ton ami', d:'Occultations de vitres, rideau thermique de cabine, tour de lanterneau : 20 € le rouleau, découpe aux ciseaux, efficacité redoutable.'},
 {t:'Compte tes heures aussi', d:'Un kit meuble à 300 € qui économise 3 week-ends peut être « moins cher » que 100 € de bois : arbitre en connaissance de cause.'}
]},
{cat:'Électricité & autonomie', ic:'🔋', items:[
 {t:'La sobriété avant les ampères', d:'Chaque appareil en moins = des centaines d’euros de batterie et de solaire en moins. LED partout, 12 V natif, pas de bouilloire électrique.'},
 {t:'Un fusible à la source de CHAQUE ligne', d:'Le fusible protège le câble : il se place au départ (batterie/répartiteur), pas près de l’appareil. C’est LA règle qui évite les incendies.'},
 {t:'Étiquette tout, schéma collé au placard', d:'Chaque fil marqué aux deux bouts + un schéma papier à demeure : une panne se diagnostique en 5 minutes au lieu d’une demi-journée.'},
 {t:'Le solaire aime le plat et le frais', d:'Panneau à plat sur le toit : jusqu’à −30 % l’hiver vs incliné, mais zéro manipulation. Le must : un panneau d’appoint pliable à orienter au sol.'},
 {t:'Surveille tes batteries avec un vrai moniteur', d:'Un moniteur à shunt (pas un simple voltmètre) donne le vrai % restant : la voltmètre-roulette a tué plus de batteries que le froid.'}
]},
{cat:'Hiver & condensation', ic:'❄️', items:[
 {t:'On ne coupe JAMAIS la ventilation', d:'Le réflexe « je bouche tout, il fait froid » garantit un camion trempé au matin. Air entrant bas + sortant haut, en continu : l’air sec se réchauffe vite.'},
 {t:'Chauffe en continu doux plutôt qu’en rafales', d:'Le chauffage diesel au ralenti toute la nuit garde les parois au-dessus du point de rosée : moins de conso qu’on croit, zéro condensation.'},
 {t:'Matelas ventilé par dessous', d:'Sommier à lattes ou grille 3D anti-condensation : un matelas posé sur un panneau plein moisit par en dessous en un hiver.'},
 {t:'Occulte aussi le pare-brise', d:'La cabine est la plus grande surface vitrée : rideau thermique ou occultation multicouche, sinon elle aspire toute la chaleur de la cellule.'}
]},
{cat:'Erreurs classiques à éviter', ic:'🚫', items:[
 {t:'Isoler avant d’avoir passé les gaines', d:'L’erreur n°1 des débutants : tout rouvrir au cutter deux mois plus tard. Câbles, gaines ET une ficelle d’attente dans chaque cloison AVANT l’isolant.'},
 {t:'Construire un appartement', d:'Meubles massifs, carrelage, machine à laver : le camion devient surchargé, il ne s’assure plus, ne freine plus, ne passe plus les cols. Un camion reste un camion.'},
 {t:'Viser le camion parfait du premier coup', d:'Personne n’a le bon plan avant d’avoir voyagé dedans. Construis simple et démontable, voyage, PUIS optimise : la v2 sera la bonne.'},
 {t:'Négliger la fixation des meubles', d:'Des vis à bois dans de la tôle fine : au premier freinage appuyé, le meuble traverse la cellule. Inserts, rivnuts, plaques de répartition — toujours.'},
 {t:'Oublier l’assurance et le PTAC', d:'Un aménagement non déclaré + surcharge = double motif de refus d’indemnisation le jour du pépin. Un appel à l’assureur et une pesée coûtent zéro.'}
]}
]
};
