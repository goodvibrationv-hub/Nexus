/* g270_atelier.js — Aide-mémoire cliquable (tutos pas-à-pas) + diagnostic de la panne en cours. */

/* Liste dépannage : chaque item ouvre un tutoriel (clé `tuto`). */
window.G270_DEP = [
  {cat:"Démarrage", items:[
    {s:"Le démarreur ne lance pas", c:"Électrique", tuto:"dep_nolance"},
    {s:"Il lance mais le moteur ne part pas", c:"Gasoil / compression", tuto:"dep_nopart"},
    {s:"Démarre mal à froid", c:"Préchauffage", tuto:"dep_froid"} ]},
  {cat:"Moteur", items:[
    {s:"Manque de puissance", c:"Air / gasoil", tuto:"dep_puissance"},
    {s:"Fumée noire", c:"Excès gasoil / manque d'air", tuto:"dep_noire"},
    {s:"Fumée bleue", c:"Brûle de l'huile", tuto:"dep_bleue"},
    {s:"Fumée blanche", c:"Gasoil non brûlé / eau", tuto:"dep_blanche"},
    {s:"Surchauffe", c:"Refroidissement", tuto:"dep_surchauffe"},
    {s:"Chute de pression d'huile", c:"Lubrification", tuto:"dep_huile"} ]},
  {cat:"Air & freins", items:[
    {s:"La pression d'air ne monte pas", c:"Production / fuite", tuto:"dep_pression"},
    {s:"Eau à la purge des réservoirs", c:"Assécheur", tuto:"dep_eau"},
    {s:"Un frein traîne ou reste serré", c:"Commande / ressort", tuto:"dep_traine"},
    {s:"Freins bloqués faute d'air", c:"Sécurité", tuto:"dep_bloque"} ]},
  {cat:"Transmission", items:[
    {s:"Embrayage qui patine", c:"Disque", tuto:"dep_patine"},
    {s:"Passages de vitesses difficiles", c:"Embrayage / synchros", tuto:"dep_passages"},
    {s:"Vibrations / claquements en roulant", c:"Arbre", tuto:"dep_vibrations"} ]}
];

/* Tutoriels : {title, cause?, context?, outils[], etapes[], securite?, photos[keys]} */
window.G270_TUTO = {
  /* ---- dépannage ---- */
  dep_nolance:{ title:"Le démarreur ne lance pas", cause:"Circuit électrique",
    outils:["Multimètre","Brosse métallique","Jeu de clés"],
    etapes:[
      "Vérifie que le coupe-batterie est bien enclenché.",
      "Contrôle les deux batteries : environ 24 V au repos, cosses propres et bien serrées.",
      "Nettoie et resserre les masses (moteur et châssis) : une masse corrodée empêche le démarreur de tourner.",
      "Contact mis, écoute le démarreur : un simple « clic » sans rotation oriente vers batteries faibles, masses, ou démarreur usé.",
      "Si batterie et masses sont bonnes, suspecte le contacteur à clé puis le démarreur." ],
    securite:"Coupe le coupe-batterie avant de toucher aux câbles ; un court-circuit 24 V fait fondre outils et bagues.", photos:[] },
  dep_nopart:{ title:"Il lance mais le moteur ne part pas", cause:"Gasoil / compression",
    outils:["Clé de purge","Multimètre"],
    etapes:[
      "Vérifie le niveau de gasoil et l'état du filtre + décanteur (purge l'eau).",
      "Purge le circuit de gasoil pour chasser l'air (voir le tuto « Purger le circuit de gasoil »).",
      "À froid, laisse le préchauffage agir avant de relancer.",
      "Contrôle l'électrovanne d'arrêt (stop) : un « clac » au contact et environ 24 V à ses bornes.",
      "Si le moteur lance bien mais ne prend jamais, fais contrôler la compression et l'injection." ],
    securite:"Ne cherche jamais une fuite de gasoil haute pression à la main : le jet perce la peau.", photos:["pompe_inj","filtre_go1"] },
  dep_froid:{ title:"Démarre mal à froid", cause:"Préchauffage",
    outils:[], etapes:[
      "Attends que le témoin de préchauffage s'éteigne avant de lancer.",
      "Vérifie le réchauffeur d'air (ou les bougies de préchauffage).",
      "Purge l'eau du décanteur : elle fige et bouche par temps froid.",
      "Contrôle la charge des batteries : elles rendent moins de courant au froid." ], photos:[] },
  dep_puissance:{ title:"Manque de puissance", cause:"Air / gasoil",
    outils:[], etapes:[
      "Contrôle et remplace si besoin le filtre à air : un filtre colmaté fait perdre de la puissance et fumer noir.",
      "Remplace le filtre à gasoil et purge le décanteur.",
      "Cherche une prise d'air d'admission (durits, colliers) entre le filtre et le turbo.",
      "Écoute le turbo : une fuite d'air de suralimentation fait chuter la puissance.",
      "Si tout est propre, fais contrôler l'injection." ], photos:["moteur","filtre_go1"] },
  dep_noire:{ title:"Fumée noire", cause:"Excès de gasoil / manque d'air",
    outils:[], etapes:[
      "Vérifie d'abord le filtre à air (cause la plus fréquente et la moins chère).",
      "Contrôle le turbo et les durits d'admission.",
      "Si le reste est bon, fais vérifier le réglage d'injection." ], photos:[] },
  dep_bleue:{ title:"Fumée bleue", cause:"Le moteur brûle de l'huile",
    outils:[], etapes:[
      "Vérifie le niveau d'huile (ne pas surremplir : trop d'huile fait aussi fumer).",
      "Une fumée bleue persistante indique une usure moteur ou un turbo fatigué : diagnostic approfondi." ], photos:[] },
  dep_blanche:{ title:"Fumée blanche", cause:"Gasoil non brûlé ou eau",
    outils:[], etapes:[
      "À froid, un peu de blanc est normal quelques instants (le temps que ça chauffe).",
      "Blanche épaisse + odeur douceâtre + perte d'eau ou surchauffe = suspecte le joint de culasse.",
      "Sens l'odeur : gasoil non brûlé (piquant) ou vapeur d'eau (douceâtre) orientent le diagnostic." ], photos:[] },
  dep_surchauffe:{ title:"Surchauffe", cause:"Refroidissement",
    outils:[], etapes:[
      "Si l'aiguille est au rouge, coupe le moteur et laisse refroidir.",
      "Moteur froid, vérifie le niveau de liquide de refroidissement.",
      "Contrôle la courroie et le ventilateur (viscocoupleur).",
      "Vérifie le thermostat et l'état du radiateur (encrassé, bouché)." ],
    securite:"Ne jamais ouvrir le circuit de refroidissement moteur chaud : projection d'eau brûlante.", photos:[] },
  dep_huile:{ title:"Chute de pression d'huile", cause:"Lubrification",
    outils:[], etapes:[
      "ARRÊTE le moteur immédiatement.",
      "Vérifie le niveau d'huile.",
      "Ne relance pas tant que la cause n'est pas trouvée (pompe à huile, capteur, fuite)." ],
    securite:"Rouler sans pression d'huile détruit le moteur en quelques instants.", photos:[] },
  dep_pression:{ title:"La pression d'air ne monte pas", cause:"Production / fuite",
    outils:["Eau savonneuse","Manomètre de bord"],
    etapes:[
      "Moteur tournant, regarde le manomètre : il doit monter jusqu'au seuil puis se stabiliser.",
      "Si la montée est lente, cherche les fuites à l'eau savonneuse sur les raccords (ça mousse à l'endroit de la fuite).",
      "Vérifie la courroie du compresseur.",
      "Contrôle l'assécheur et sa cartouche." ], photos:["wabco_ctx"] },
  dep_eau:{ title:"Eau à la purge des réservoirs", cause:"Assécheur",
    outils:[], etapes:[
      "Purge les réservoirs : si de l'eau sort, la cartouche d'assécheur ne fait plus son travail.",
      "Remplace la cartouche de l'assécheur.",
      "En hiver, purge chaque jour : l'eau gèle et bloque les valves." ], photos:["wabco_ctx"] },
  dep_traine:{ title:"Un frein traîne ou reste serré", cause:"Commande / ressort",
    outils:[], etapes:[
      "Repère quel frein chauffe ou retient (odeur, tambour brûlant).",
      "Contrôle la valve concernée et le correcteur de charge.",
      "Un cylindre à ressort qui ne se desserre pas = intervention spécialisée." ],
    securite:"Frein à ressort : ne jamais démonter sous contrainte, danger mortel.", photos:["wabco_rem"] },
  dep_bloque:{ title:"Freins bloqués faute d'air", cause:"Sécurité intégrée",
    outils:[], etapes:[
      "Refais d'abord la pression d'air : laisse le compresseur remplir les réservoirs.",
      "Ne force jamais un frein à ressort.",
      "Le desserrage mécanique de secours ne se fait que selon la procédure du manuel." ],
    securite:"Danger mortel : le ressort d'un tristop est sous très forte contrainte.", photos:["wabco_rem"] },
  dep_patine:{ title:"Embrayage qui patine", cause:"Disque",
    outils:[], etapes:[
      "Confirme le symptôme : le régime monte mais le camion n'accélère pas, avec une odeur de brûlé.",
      "Vérifie qu'il n'y a pas d'huile sur le disque (fuite de joint moteur ou de boîte).",
      "Contrôle la garde de la pédale d'embrayage.",
      "Un disque usé se remplace (dépose de la boîte)." ], photos:["trans"] },
  dep_passages:{ title:"Passages de vitesses difficiles", cause:"Embrayage / synchros",
    outils:[], etapes:[
      "Vérifie la garde et la commande d'embrayage (fuite hydraulique ?).",
      "Contrôle le niveau d'huile de boîte au bon bouchon.",
      "Si l'embrayage « traîne », il désaccouple mal : réglage ou commande à revoir." ], photos:["trans","pto"] },
  dep_vibrations:{ title:"Vibrations / claquements en roulant", cause:"Arbre de transmission",
    outils:["Pompe à graisse"], etapes:[
      "Graisse et contrôle le jeu des croisillons.",
      "Cherche un balourd ou un jeu sur l'arbre de transmission.",
      "Contrôle le jeu du pont." ], photos:["trans","tandem"] },

  /* ---- entretien (mêmes tutos, ouverts depuis le carnet) ---- */
  purge_air:{ title:"Purger les réservoirs d'air", context:"À faire chaque jour : c'est le geste le plus rentable et le plus oublié.",
    outils:[], etapes:[
      "Camion à l'arrêt, moteur coupé, circuit encore sous pression.",
      "Sous chaque réservoir, actionne la valve de purge (tirette ou vis).",
      "Laisse s'échapper l'air et l'eau jusqu'à ne plus voir sortir que de l'air sec.",
      "Relâche, puis recommence sur chaque cuve." ],
    securite:"L'air s'échappe fort : garde le visage à l'écart.", photos:[] },
  niveaux:{ title:"Niveaux moteur & refroidissement",
    outils:[], etapes:[
      "Camion sur sol plat, moteur froid.",
      "Jauge d'huile moteur : le niveau doit être entre mini et maxi, sans surremplir.",
      "Vase de refroidissement : au repère, sans jamais ouvrir à chaud." ],
    securite:"Circuit de refroidissement à chaud = brûlures.", photos:[] },
  pneus:{ title:"Pression & état des pneus",
    outils:["Manomètre pneus"], etapes:[
      "À froid, contrôle la pression, y compris sur le tandem arrière.",
      "Cherche coupures, hernies et corps étrangers.",
      "Vérifie l'usure et le serrage des écrous de roue." ], photos:["chassis"] },
  graissage:{ title:"Graisser les croisillons",
    outils:["Pompe à graisse"], etapes:[
      "Repère les graisseurs sur les croisillons de l'arbre de transmission.",
      "Nettoie l'embout, puis injecte la graisse jusqu'à la voir perler aux coupelles.",
      "Essuie l'excédent." ], photos:["trans","ensemble"] },
  vidange:{ title:"Vidange huile moteur + filtre",
    outils:["Bac","Clé à filtre","Huile neuve"], etapes:[
      "Moteur tiède, camion à plat.",
      "Vidange par le bouchon de carter ; remplace son joint.",
      "Remplace le filtre à huile (graisse le joint neuf avant montage).",
      "Refais le plein au bon volume, contrôle la jauge, cherche les fuites." ],
    securite:"Huile chaude : porte des gants.", photos:["filtres"] },
  filtre_air:{ title:"Filtre à air",
    outils:[], etapes:[
      "Ouvre le boîtier et sors la cartouche.",
      "Contrôle-la à contre-jour ; si elle est encrassée, remplace-la (évite de trop souffler dedans).",
      "Vérifie l'étanchéité du boîtier au remontage." ], photos:[] },
  filtre_go:{ title:"Filtre à gasoil + décanteur",
    outils:["Clé à filtre","Clé de purge"], etapes:[
      "Purge l'eau du décanteur (robinet du bas).",
      "Remplace la cartouche de filtre.",
      "Purge le circuit pour chasser l'air, puis relance.",
      "Vérifie l'absence de fuite." ],
    securite:"Gasoil sous pression : jamais à la main.", photos:["filtre_go1","filtre_go2"] },
  assecheur:{ title:"Cartouche d'assécheur d'air",
    outils:["Clé à filtre"], etapes:[
      "Décharge d'abord la pression du circuit d'air.",
      "Dévisse la cartouche de l'assécheur (comme un filtre).",
      "Monte la neuve, graisse le joint, serre à la main.",
      "Refais la pression et vérifie les fuites." ], photos:["wabco_ctx"] },
  freins:{ title:"Garnitures de frein & jeux",
    outils:[], etapes:[
      "Contrôle visuel de l'épaisseur des garnitures / plaquettes.",
      "Vérifie le jeu et le bon rappel des leviers.",
      "Guette un frein qui traîne (échauffement d'un tambour)." ],
    securite:"Freins à ressort : prudence à proximité.", photos:["wabco_rem"] },
  boite_pont:{ title:"Niveaux boîte & pont, garde d'embrayage",
    outils:[], etapes:[
      "Camion sur sol plat.",
      "Boîte : retire le bouchon de niveau ; l'huile doit affleurer le bord.",
      "Pont : même principe au bouchon de niveau.",
      "Complète avec l'huile préconisée si nécessaire.",
      "Contrôle la garde de la pédale d'embrayage." ], photos:["pto"] }
};

/* Diagnostic guidé de la panne actuelle du camion. */
window.G270_PANNE = {
  title:"Démarre, tourne ~45 s, cale, puis ne redémarre plus",
  resume:"Le moteur reçoit assez de gasoil pour démarrer et tenir ~45 s (celui déjà présent dans le filtre et les canalisations), puis l'alimentation est coupée. Le fait qu'il ne redémarre plus ensuite oriente d'abord vers l'électrovanne d'arrêt (stop), son alimentation, ou une prise d'air / un colmatage du circuit de gasoil.",
  suspects:[
    {n:"Électrovanne d'arrêt (stop) de la pompe d'injection", p:"très probable",
     why:"Elle laisse passer le gasoil tant qu'elle est alimentée. Si sa bobine faiblit, chauffe ou perd le courant après le démarrage, elle se referme : le moteur cale et ne repart pas tant qu'elle reste fermée."},
    {n:"Alimentation de l'électrovanne (contacteur, relais, fil, masse)", p:"probable",
     why:"Si le 24 V n'est pas maintenu en position « marche », l'électrovanne retombe et coupe le gasoil peu après le démarrage."},
    {n:"Prise d'air ou colmatage du circuit de gasoil", p:"possible",
     why:"Le moteur démarre sur le gasoil des canalisations, puis s'étouffe quand l'air ou un filtre bouché empêche l'alimentation de suivre ; il ne réamorce plus seul."},
    {n:"Mise à l'air du réservoir (reniflard) bouchée", p:"possible",
     why:"Une dépression se crée dans le réservoir et étrangle l'arrivée de gasoil."}
  ],
  etapes:[
    {t:"Sécurité", d:"Frein de parking serré, roues calées, boîte au point mort. On ne cherche pas une fuite de gasoil à la main."},
    {t:"Gasoil visible", d:"Niveau suffisant ; filtre et décanteur : purge l'eau et guette des bulles d'air dans le bol. Un filtre très encrassé se remplace."},
    {t:"Test du reniflard", d:"Quand le moteur cale (ou avant un nouvel essai), desserre le bouchon du réservoir. S'il repart ou tient mieux, la mise à l'air est bouchée."},
    {t:"Purge du circuit de gasoil", d:"Desserre la vis de purge du filtre/pompe, actionne la pompe d'amorçage jusqu'à ce que le gasoil sorte sans bulles, resserre, relance. Si ça tient plus longtemps, c'était une prise d'air."},
    {t:"Écoute l'électrovanne", d:"Sur la pompe d'injection, repère l'électrovanne (petit solénoïde avec un fil). Contact mis puis coupé, on doit sentir/entendre un léger « clac »."},
    {t:"Mesure sa tension", d:"Multimètre aux bornes de l'électrovanne, contact en position « marche » : on attend environ 24 V, et surtout que la tension SE MAINTIENNE pendant les 45 s et au moment où ça cale."},
    {t:"Conclure", d:"Tension qui tombe quand ça cale → alimentation (contacteur, relais, fil, masse). Tension maintenue mais moteur qui cale → électrovanne défaillante (à remplacer) ou gasoil en parallèle. Redémarrage seulement après refroidissement → électrovanne thermique quasi confirmée."}
  ],
  note:"Signe très utile à observer : après avoir calé, est-ce que ça redémarre si tu attends quelques minutes (le temps que ça refroidisse) ? Si oui, c'est un fort indice en faveur de l'électrovanne d'arrêt. Le remplacement de l'électrovanne et toute intervention sur l'injection se font au propre : dans le doute, fais confirmer par un professionnel.",
  photos:["pompe_inj","inj_elec","filtre_go1"],
  photoWanted:"Sur tes photos, l'électrovanne d'arrêt est le solénoïde muni d'un fil, sur la pompe d'injection. Si tu veux, fais un gros plan bien net de ce solénoïde et de son fil : je pourrai l'annoter précisément pour ton camion."
};
