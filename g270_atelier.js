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
      {d:"Contrôle les deux batteries : environ 24 V au repos, cosses propres et bien serrées.", photo:"batteries"},
      "Nettoie et resserre les masses (moteur et châssis) : une masse corrodée empêche le démarreur de tourner.",
      "Contact mis, écoute le démarreur : un simple « clic » sans rotation oriente vers batteries faibles, masses, ou démarreur usé.",
      "Si batterie et masses sont bonnes, suspecte le contacteur à clé puis le démarreur." ],
    securite:"Coupe le coupe-batterie avant de toucher aux câbles ; un court-circuit 24 V fait fondre outils et bagues.", photos:["coffret_elec"] },
  dep_nopart:{ title:"Il lance mais le moteur ne part pas", cause:"Gasoil / compression",
    outils:["Clé de purge","Multimètre"],
    etapes:[
      {d:"Vérifie le niveau de gasoil et l'état du filtre + décanteur (purge l'eau).", photo:"filtre_go1"},
      "Purge le circuit de gasoil pour chasser l'air (voir le tuto « Purger le circuit de gasoil »).",
      "À froid, laisse le préchauffage agir avant de relancer.",
      {d:"Contrôle l'électrovanne d'arrêt (stop) : un « clac » au contact et environ 24 V à ses bornes.", photo:"pompe_inj"},
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
      {d:"Contrôle et remplace si besoin le filtre à air : un filtre colmaté fait perdre de la puissance et fumer noir.", photo:"moteur"},
      {d:"Remplace le filtre à gasoil et purge le décanteur.", photo:"filtre_go1"},
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
      {d:"Contrôle l'assécheur et sa cartouche.", photo:"wabco_ctx"} ], photos:["wabco_ctx"] },
  dep_eau:{ title:"Eau à la purge des réservoirs", cause:"Assécheur",
    outils:[], etapes:[
      "Purge les réservoirs : si de l'eau sort, la cartouche d'assécheur ne fait plus son travail.",
      {d:"Remplace la cartouche de l'assécheur.", photo:"wabco_ctx"},
      "En hiver, purge chaque jour : l'eau gèle et bloque les valves." ], photos:["wabco_ctx"] },
  dep_traine:{ title:"Un frein traîne ou reste serré", cause:"Commande / ressort",
    outils:[], etapes:[
      "Repère quel frein chauffe ou retient (odeur, tambour brûlant).",
      {d:"Contrôle la valve concernée et le correcteur de charge.", photo:"wabco_rem"},
      "Un cylindre à ressort qui ne se desserre pas = intervention spécialisée." ],
    securite:"Frein à ressort : ne jamais démonter sous contrainte, danger mortel.", photos:["wabco_rem"] },
  dep_bloque:{ title:"Freins bloqués faute d'air", cause:"Sécurité intégrée",
    outils:[], etapes:[
      "Refais d'abord la pression d'air : laisse le compresseur remplir les réservoirs.",
      "Ne force jamais un frein à ressort.",
      {d:"Le desserrage mécanique de secours ne se fait que selon la procédure du manuel.", photo:"wabco_rem"} ],
    securite:"Danger mortel : le ressort d'un tristop est sous très forte contrainte.", photos:["wabco_rem"] },
  dep_patine:{ title:"Embrayage qui patine", cause:"Disque",
    outils:[], etapes:[
      "Confirme le symptôme : le régime monte mais le camion n'accélère pas, avec une odeur de brûlé.",
      {d:"Vérifie qu'il n'y a pas d'huile sur le disque (fuite de joint moteur ou de boîte).", photo:"trans"},
      "Contrôle la garde de la pédale d'embrayage.",
      "Un disque usé se remplace (dépose de la boîte)." ], photos:["trans"] },
  dep_passages:{ title:"Passages de vitesses difficiles", cause:"Embrayage / synchros",
    outils:[], etapes:[
      "Vérifie la garde et la commande d'embrayage (fuite hydraulique ?).",
      {d:"Contrôle le niveau d'huile de boîte au bon bouchon.", photo:"pto"},
      {d:"Si l'embrayage « traîne », il désaccouple mal : réglage ou commande à revoir.", photo:"trans"} ], photos:["trans","pto"] },
  dep_vibrations:{ title:"Vibrations / claquements en roulant", cause:"Arbre de transmission",
    outils:["Pompe à graisse"], etapes:[
      {d:"Graisse et contrôle le jeu des croisillons.", photo:"trans"},
      "Cherche un balourd ou un jeu sur l'arbre de transmission.",
      {d:"Contrôle le jeu du pont.", photo:"tandem"} ], photos:["trans","tandem"] },

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
    {t:"Gasoil visible", d:"Niveau suffisant ; filtre et décanteur : purge l'eau et guette des bulles d'air dans le bol. Un filtre très encrassé se remplace.", photo:"filtre_go1"},
    {t:"Test du reniflard", d:"Quand le moteur cale (ou avant un nouvel essai), desserre le bouchon du réservoir. S'il repart ou tient mieux, la mise à l'air est bouchée.", photo:"bouchon_go"},
    {t:"Purge du circuit de gasoil", d:"Desserre la vis de purge du filtre/pompe, actionne la pompe d'amorçage jusqu'à ce que le gasoil sorte sans bulles, resserre, relance. Si ça tient plus longtemps, c'était une prise d'air."},
    {t:"Écoute l'électrovanne", d:"Sur la pompe d'injection, repère l'électrovanne (petit solénoïde avec un fil). Contact mis puis coupé, on doit sentir/entendre un léger « clac ».", photo:"inj_elec"},
    {t:"Mesure sa tension", d:"Multimètre aux bornes de l'électrovanne, contact en position « marche » : on attend environ 24 V, et surtout que la tension SE MAINTIENNE pendant les 45 s et au moment où ça cale.", photo:"pompe_inj"},
    {t:"Conclure", d:"Tension qui tombe quand ça cale → alimentation (contacteur, relais, fil, masse). Tension maintenue mais moteur qui cale → électrovanne défaillante (à remplacer) ou gasoil en parallèle. Redémarrage seulement après refroidissement → électrovanne thermique quasi confirmée."}
  ],
  note:"Signe très utile à observer : après avoir calé, est-ce que ça redémarre si tu attends quelques minutes (le temps que ça refroidisse) ? Si oui, c'est un fort indice en faveur de l'électrovanne d'arrêt. Le remplacement de l'électrovanne et toute intervention sur l'injection se font au propre : dans le doute, fais confirmer par un professionnel.",
  photos:[],
  photoWanted:"Sur tes photos, l'électrovanne d'arrêt est le solénoïde muni d'un fil, sur la pompe d'injection. Si tu veux, fais un gros plan bien net de ce solénoïde et de son fil : je pourrai l'annoter précisément pour ton camion."
};

/* ---- multi-pannes : la panne historique + la pompe de la cuve (camion de pompiers) ---- */
window.G270_PANNE.key='demarrage';
window.G270_PANNE.short='Démarre puis cale à ~45 s';
window.G270_PANNE.tests=[
  {k:'volt',    q:'Les ~24 V se maintiennent-ils à l’électrovanne au moment où ça cale ?'},
  {k:'cool',    q:'Après avoir calé, redémarre-t-il après quelques minutes (refroidissement) ?'},
  {k:'purge',   q:'Ça tient plus longtemps après une purge du circuit de gasoil ?'},
  {k:'bouchon', q:'Ça va mieux avec le bouchon du réservoir desserré ?'}
];
window.G270_PANNE.verdicts=[
  {when:{volt:'non'}, t:'Alimentation de l’électrovanne', d:'La tension ne se maintient pas quand ça cale : contacteur, relais, fil ou masse à contrôler et réparer. L’électrovanne elle-même est probablement bonne.'},
  {when:{purge:'oui'}, t:'Prise d’air / colmatage du circuit de gasoil', d:'La purge améliore nettement : remplace le filtre à gasoil, purge le décanteur et traque la prise d’air (colliers, joints, durites).'},
  {when:{bouchon:'oui'}, t:'Reniflard du réservoir bouché', d:'Le moteur respire mieux bouchon desserré : nettoie la mise à l’air du réservoir (ou perce/remplace le bouchon).'},
  {when:{volt:'oui',cool:'oui'}, t:'Électrovanne d’arrêt défaillante', d:'Tension maintenue + redémarrage après refroidissement : bobine qui chauffe et lâche. Remplace l’électrovanne (SODEREP sur la pompe).'},
  {when:{cool:'oui'}, t:'Électrovanne d’arrêt (à confirmer au multimètre)', d:'Le redémarrage après refroidissement pointe la bobine de l’électrovanne. Mesure les 24 V au moment où ça cale pour confirmer.'},
  {when:{volt:'oui'}, t:'Électrovanne ou alimentation en gasoil', d:'Le courant tient : reste l’électrovanne elle-même ou le gasoil (purge, filtre, reniflard). Fais les essais 3 et 4.'}
];
window.G270_PANNES=[ window.G270_PANNE, {
  key:'pompe', short:'La pompe de la cuve ne s’enclenche pas',
  title:'La pompe à eau de la cuve ne s’enclenche pas',
  resume:'Sur ce camion de pompiers, la pompe de la cuve est entraînée par la prise de force (PTO) montée sur la boîte de vitesses — celle qu’on voit sur tes photos (plaque PTO + distributeur pneumatique). Son crabotage se commande depuis la cabine et se fait à l’air comprimé, embrayage enfoncé. Si la pompe ne s’enclenche pas, c’est presque toujours la chaîne de commande (procédure, air, distributeur) avant la mécanique.',
  suspects:[
    {n:'Commande pneumatique de la prise de force', p:'très probable',
     why:'L’enclenchement se fait par un vérin alimenté via le distributeur pneumatique de la boîte. Pression d’air trop basse, flexible fuyard, distributeur ou électrovanne de commande grippés : l’air n’arrive pas, le crabot ne bouge pas.'},
    {n:'Procédure d’enclenchement non respectée', p:'probable',
     why:'Une PTO s’enclenche véhicule À L’ARRÊT, embrayage ENFONCÉ à fond, moteur au ralenti. Trop de régime ou embrayage relâché : les dents refusent de craboter (c’est voulu).'},
    {n:'Commande électrique (interrupteur, fusible, témoin)', p:'possible',
     why:'Si la commande en cabine passe par une électrovanne : fusible, contacteur ou fil de masse peuvent couper l’ordre avant même l’air.'},
    {n:'Crabot / fourchette PTO ou pompe grippée', p:'possible',
     why:'L’air arrive (clac audible) mais rien ne tourne : fourchette usée, dents face à face, ou pompe bloquée (gel, corps étranger, joint grippé après hivernage).'}
  ],
  etapes:[
    {t:'Sécurité', d:'Véhicule à l’arrêt, frein de parc serré, roues calées. On n’intervient jamais sous le camion pendant les essais d’enclenchement.'},
    {t:'Procédure exacte', d:'Moteur au ralenti, embrayage ENFONCÉ À FOND, actionne la commande PTO, attends 3 secondes, puis relâche l’embrayage TRÈS lentement. Beaucoup de « pannes » de PTO sont des enclenchements trop rapides.'},
    {t:'Pression d’air', d:'Regarde le manomètre : il faut le plein d’air (~8 bar). En dessous, le vérin de crabotage n’a pas la force d’enclencher. Laisse le compresseur remplir, réessaie.', photo:'distrib_air'},
    {t:'Écoute le distributeur', d:'Une deuxième personne actionne la commande pendant que tu écoutes près de la boîte : un « clac / pshit » net doit venir du distributeur pneumatique. Pas de bruit = l’ordre n’arrive pas (électrique ou air).', photo:'trans'},
    {t:'Commande & fusible', d:'Contrôle le voyant PTO en cabine, le fusible et le contacteur de la commande. Au multimètre : 24 V à l’électrovanne du distributeur quand on actionne.', photo:'coffret_elec'},
    {t:'Flexible et vérin', d:'Suis le flexible d’air de la commande jusqu’au vérin de la prise de force sur la boîte : fuite audible, flexible pincé, raccord déboîté ? Savonne pour voir les bulles.', photo:'pto'},
    {t:'Mécanique en dernier', d:'Moteur COUPÉ, essaie d’enclencher : si le crabot entre moteur arrêté, les dents étaient face à face (réessaie moteur tournant en relâchant une seconde l’embrayage). Vérifie aussi que l’arbre de la pompe tourne à la main — une pompe hivernée peut être grippée ou gelée.'}
  ],
  tests:[
    {k:'proc',   q:'Tu enclenches bien à l’arrêt, embrayage à fond, moteur au ralenti ?'},
    {k:'air',    q:'La pression d’air est au maximum (~8 bar) au moment de l’essai ?'},
    {k:'clac',   q:'Un « clac » d’air se fait entendre au distributeur quand tu actionnes ?'},
    {k:'temoin', q:'Le voyant / témoin PTO s’allume en cabine ?'}
  ],
  verdicts:[
    {when:{proc:'non'}, t:'Procédure d’enclenchement', d:'Refais l’essai dans les règles : arrêt complet, ralenti, embrayage enfoncé à fond, commande, 3 secondes, relâcher lentement. La plupart des PTO « en panne » s’enclenchent parfaitement ainsi.'},
    {when:{air:'non'}, t:'Pression d’air insuffisante', d:'Le crabotage est pneumatique : sans le plein d’air il ne bougera pas. Refais 8 bar moteur tournant ; si la pression ne monte pas, traite d’abord cette panne-là (compresseur/fuite).'},
    {when:{clac:'non',temoin:'non'}, t:'Commande électrique coupée', d:'Ni voyant ni clac : l’ordre n’arrive pas. Fusible, interrupteur de commande, masse — contrôle 24 V à l’électrovanne du distributeur.'},
    {when:{clac:'non',air:'oui'}, t:'Distributeur / électrovanne pneumatique', d:'L’air est là mais le distributeur ne bascule pas : électrovanne grippée ou HS (celle de tes photos, sur la boîte). Démonte, nettoie, remplace si besoin.'},
    {when:{clac:'oui'}, t:'Crabotage mécanique ou pompe grippée', d:'L’air arrive mais rien ne s’entraîne : dents face à face (relâche l’embrayage une seconde et réessaie), fourchette PTO usée, ou pompe bloquée — vérifie que son arbre tourne à la main, moteur coupé.'}
  ],
  note:'Après un long hivernage, pense simple : une pompe qui n’a pas tourné depuis des mois peut être simplement grippée ou gelée, et un flexible d’air poreux. Fais les essais dans l’ordre : procédure → air → clac → mécanique.',
  photos:['trans','pto'],
  photoWanted:'Il me manque encore : 1) la COMMANDE PTO en cabine (levier/bouton + voyant), 2) la POMPE elle-même sous/derrière la cuve avec son arbre. Envoie-les dans la discussion et je les intégrerai.'
} ];
