// Profils automatiques utilisés pour créer des fiches prêtes après une identification Pl@ntNet.
const plantKnowledgeProfiles = [
  {
    id:"lilium",
    match:["lilium", "lis blanc", "lily"],
    edibility:"Toxique pour les chats / ne pas consommer",
    status:"toxique",
    summary:"Le lis blanc est une plante bulbeuse ornementale aux grandes fleurs claires, souvent parfumées. Il est surtout cultivé pour sa floraison élégante et décorative, en massif, en pot ou en bouquet.",
    benefits:"Usage principal : ornemental. Le Grimoire ne recommande pas d’usage alimentaire ou médicinal à partir d’une identification photo.",
    care:"Installer dans un sol bien drainé, fertile et plutôt frais, avec une exposition lumineuse. Arroser sans excès : le bulbe craint l’humidité stagnante. Supprimer les fleurs fanées et laisser le feuillage jaunir naturellement pour nourrir le bulbe.",
    precautions:"Ne pas consommer. Les vrais lis du genre Lilium sont particulièrement dangereux pour les chats : feuilles, fleurs, pollen et eau du vase peuvent poser problème. En cas d’ingestion ou de contact suspect chez un chat, contacter rapidement un vétérinaire.",
    source:"Références de départ : données horticoles RHS pour les soins des lis et données vétérinaires ASPCA / Pet Poison Helpline sur la toxicité des Lilium pour les chats."
  },
  {
    id:"hydrangea",
    match:["hydrangea", "hortensia"],
    edibility:"Toxique / non comestible",
    status:"toxique",
    summary:"L’hortensia est un arbuste ornemental très apprécié pour ses grosses inflorescences rondes ou plates, souvent bleues, roses, violettes ou blanches. Il est surtout cultivé pour décorer les jardins, terrasses et massifs ombragés.",
    benefits:"Plante surtout ornementale : elle est appréciée pour ses grandes fleurs décoratives. Pas d’usage alimentaire conseillé.",
    care:"Mi-ombre ou soleil doux du matin, sol riche, frais et bien drainé. Arroser régulièrement sans détremper, surtout en pot ou par forte chaleur.",
    precautions:"Ne pas consommer. L’hortensia peut être toxique pour les humains et les animaux domestiques en cas d’ingestion. Éloigner des enfants, chiens, chats et chevaux.",
    source:"Références de départ : ASPCA pour la toxicité animale, guides horticoles RHS / jardinage pour les soins."
  },
  {
    id:"mentha",
    match:["mentha"],
    edibility:"Comestible comme aromate, si la plante est bien confirmée",
    status:"comestible",
    summary:"La menthe est une plante aromatique vivace, fraîche et très parfumée, souvent cultivée en pot ou au jardin. Elle s’étend facilement et se reconnaît notamment à son parfum marqué quand on froisse ses feuilles.",
    benefits:"Traditionnellement utilisée en infusion après les repas et en cuisine pour son parfum frais.",
    care:"Sol frais, lumière douce à mi-ombre, arrosages réguliers. En pot, elle se contrôle mieux.",
    precautions:"Éviter les usages concentrés comme les huiles essentielles sans avis professionnel.",
    source:"Fiche interne du Grimoire."
  },
  {
    id:"lavandula",
    match:["lavandula"],
    edibility:"Comestible en très petite quantité pour certaines lavandes, si bien identifiée",
    status:"prudence",
    summary:"La lavande est un petit sous-arbrisseau méditerranéen aux feuilles étroites et aux épis violets parfumés. Elle est surtout connue pour son parfum, son intérêt décoratif et sa bonne résistance aux sols secs.",
    benefits:"Traditionnellement associée au parfum, au linge et aux usages liés au calme.",
    care:"Plein soleil, sol très drainé, peu d’eau. Elle craint surtout l’excès d’humidité.",
    precautions:"Ne pas ingérer d’huile essentielle sans avis professionnel. Utiliser seulement une lavande alimentaire clairement identifiée.",
    source:"Fiche interne du Grimoire."
  },
  {
    id:"rosemary",
    match:["salvia rosmarinus", "rosmarinus"],
    edibility:"Comestible comme aromate, si la plante est bien confirmée",
    status:"comestible",
    summary:"Le romarin est un arbrisseau persistant méditerranéen aux feuilles fines et coriaces. Son parfum résineux le rend très reconnaissable et très utilisé comme plante aromatique.",
    benefits:"Aromate méditerranéen traditionnellement associé aux plats mijotés et aux infusions légères.",
    care:"Plein soleil, sol drainé, arrosage modéré. Il supporte mieux le sec que l’humidité stagnante.",
    precautions:"Comme aromate alimentaire, il est courant. Les usages concentrés demandent prudence.",
    source:"Fiche interne du Grimoire."
  },
  {
    id:"thymus",
    match:["thymus"],
    edibility:"Comestible comme aromate, si la plante est bien confirmée",
    status:"comestible",
    summary:"Le thym est un petit sous-arbrisseau aromatique des zones sèches et ensoleillées. Ses petites feuilles parfumées sont très utilisées en cuisine et il apprécie les sols pauvres, légers et drainés.",
    benefits:"Très utilisé en cuisine méditerranéenne, traditionnellement en infusion et comme aromate.",
    care:"Plein soleil, sol léger et drainé. Peu d’arrosage une fois installé.",
    precautions:"Usage alimentaire courant comme aromate. Les huiles essentielles demandent prudence.",
    source:"Fiche interne du Grimoire."
  },
  {
    id:"petroselinum",
    match:["petroselinum"],
    edibility:"Comestible si cultivé ou parfaitement identifié",
    status:"prudence",
    summary:"Le persil est une herbe aromatique bisannuelle aux feuilles plates ou frisées. Il est très courant en cuisine, mais demande de la prudence lorsqu’il est trouvé à l’état sauvage à cause des confusions possibles avec d’autres Apiacées.",
    benefits:"Herbe aromatique très courante pour apporter fraîcheur et couleur aux plats.",
    care:"Sol frais, lumière douce, récolte régulière des tiges.",
    precautions:"Prudence avec les plantes sauvages ressemblantes : certaines Apiacées sont dangereuses.",
    source:"Fiche interne du Grimoire."
  },
  {
    id:"rosa",
    match:["rosa"],
    edibility:"Pétales parfois comestibles si rose non traitée et bien identifiée",
    status:"prudence",
    summary:"La rose est un arbuste souvent épineux, cultivé pour ses fleurs parfumées et très variées. Elle est principalement ornementale, même si les pétales de roses non traitées peuvent parfois être utilisés en cuisine.",
    benefits:"Plante ornementale et parfumée, utilisée traditionnellement pour sirops, gelées ou infusions avec des pétales non traités.",
    care:"Situation lumineuse, sol fertile, arrosage régulier en période sèche.",
    precautions:"Ne pas utiliser les fleurs de fleuriste ou traitées. Vérifier l’identification avant tout usage.",
    source:"Fiche interne du Grimoire."
  }
];

const familyKnowledgeProfiles = [
  {
    id:"liliaceae",
    match:["liliaceae", "liliacée", "liliacées"],
    edibility:"À vérifier — prudence",
    status:"prudence",
    summary:"Cette plante appartient à une famille de plantes souvent bulbeuses, cultivées pour leurs fleurs décoratives. Plusieurs espèces proches peuvent être sensibles ou toxiques selon les animaux et les usages.",
    benefits:"Usage à considérer comme ornemental tant que l’espèce n’est pas confirmée.",
    care:"Sol drainé, lumière généreuse, arrosage modéré. Pour les bulbes, éviter l’eau stagnante et laisser le feuillage reconstituer les réserves après floraison.",
    precautions:"Ne pas consommer sans confirmation fiable. Prudence renforcée avec les animaux domestiques, surtout les chats pour les vrais lis.",
    source:"Profil familial automatique du Grimoire."
  },
  {
    id:"lamiaceae",
    match:["lamiaceae", "lamiacée", "lamiacées"],
    edibility:"Souvent aromatique, mais à confirmer",
    status:"prudence",
    summary:"Les Lamiacées regroupent beaucoup de plantes aromatiques comme la menthe, le thym, la sauge ou le romarin. Elles se reconnaissent souvent à leurs tiges carrées, feuilles opposées et odeurs marquées.",
    benefits:"Nombreuses espèces sont utilisées comme aromates ou en infusions traditionnelles, mais l’usage dépend fortement de l’espèce exacte.",
    care:"Lumière abondante, sol drainé, arrosage adapté à l’espèce : certaines aiment le frais, d’autres préfèrent le sec.",
    precautions:"Ne pas utiliser en huile essentielle ou en infusion concentrée sans avis fiable. Confirmer l’espèce avant consommation.",
    source:"Profil familial automatique du Grimoire."
  },
  {
    id:"rosaceae",
    match:["rosaceae", "rosacée", "rosacées"],
    edibility:"Variable selon l’espèce",
    status:"prudence",
    summary:"Les Rosacées rassemblent de nombreuses plantes de jardin et de verger : rosiers, fraisiers, pommiers, pruniers, ronces. Certaines sont comestibles, d’autres surtout ornementales.",
    benefits:"Usages très variables : fruits, fleurs ornementales, parfums ou cuisine selon l’espèce et la partie utilisée.",
    care:"Souvent une situation lumineuse, un sol fertile et un arrosage régulier en période sèche. La taille dépend beaucoup de l’espèce.",
    precautions:"Ne consommer que les parties clairement reconnues comme comestibles et non traitées.",
    source:"Profil familial automatique du Grimoire."
  },
  {
    id:"asteraceae",
    match:["asteraceae", "astéracée", "astéracées", "compositae"],
    edibility:"Variable — à vérifier",
    status:"prudence",
    summary:"Les Astéracées forment une très grande famille de plantes à fleurs composées : marguerites, pissenlits, asters, tournesols, chardons. Elles sont fréquentes dans les jardins, prairies et friches.",
    benefits:"Certaines espèces ont des usages alimentaires ou traditionnels, mais beaucoup se ressemblent : l’identification doit être solide.",
    care:"Souvent faciles en sol drainé et situation lumineuse, avec des besoins en eau variables selon l’espèce.",
    precautions:"Risque de confusion élevé dans cette grande famille. Ne pas consommer sans identification confirmée.",
    source:"Profil familial automatique du Grimoire."
  },
  {
    id:"apiaceae",
    match:["apiaceae", "apiacée", "apiacées", "umbelliferae"],
    edibility:"Prudence forte — famille à risques",
    status:"prudence",
    summary:"Les Apiacées comprennent des aromatiques connues comme le persil, la carotte ou le fenouil, mais aussi des plantes sauvages très toxiques. Elles ont souvent des ombelles et des feuilles découpées.",
    benefits:"Certaines espèces cultivées sont alimentaires ou aromatiques, mais les confusions peuvent être dangereuses.",
    care:"Culture souvent en sol frais, lumière douce à ensoleillée selon l’espèce.",
    precautions:"Ne jamais consommer une Apiacée sauvage identifiée seulement par photo.",
    source:"Profil familial automatique du Grimoire."
  },
  {
    id:"araceae",
    match:["araceae", "aracée", "aracées"],
    edibility:"Souvent irritante / non comestible",
    status:"toxique",
    summary:"Les Aracées regroupent beaucoup de plantes d’intérieur décoratives, souvent appréciées pour leurs feuilles graphiques.",
    benefits:"Usage principalement ornemental.",
    care:"Lumière indirecte, substrat drainant, arrosage modéré et atmosphère pas trop sèche pour beaucoup d’espèces d’intérieur.",
    precautions:"Beaucoup d’Aracées contiennent des substances irritantes pour la bouche et le système digestif. Tenir hors de portée des enfants et animaux.",
    source:"Profil familial automatique du Grimoire."
  },
  {
    id:"orchidaceae",
    match:["orchidaceae", "orchidacée", "orchidacées", "orchidée", "orchidee"],
    edibility:"Ornementale — ne pas consommer",
    status:"prudence",
    summary:"Les orchidées sont des plantes surtout ornementales, connues pour leurs fleurs très graphiques et durables. Beaucoup d’orchidées d’intérieur, comme les Phalaenopsis, vivent naturellement accrochées aux arbres : elles aiment l’air autour des racines plus qu’une terre compacte.",
    benefits:"Usage principal : décoration et collection. Elles apportent une floraison longue et élégante, mais le Grimoire ne recommande pas d’usage alimentaire ou médicinal.",
    care:"Lumière vive sans soleil brûlant, pot très drainant avec substrat spécial orchidée, arrosage modéré lorsque les racines deviennent gris clair ou que le substrat sèche. Éviter l’eau stagnante dans le cache-pot. Les Phalaenopsis aiment souvent une ambiance douce et légèrement humide.",
    precautions:"Ne pas consommer. Beaucoup d’orchidées courantes sont considérées comme peu problématiques pour les chats et chiens, mais l’ingestion peut irriter l’estomac et les traitements sur la plante peuvent être toxiques. Garder hors de portée des animaux qui mâchouillent.",
    source:"Profil familial automatique du Grimoire : soins inspirés des recommandations horticoles courantes pour orchidées d’intérieur, avec prudence animaux selon les listes ASPCA."
  },
  {
    id:"amaryllidaceae",
    match:["amaryllidaceae", "amaryllidacée", "amaryllidacées", "narcisse", "jonquille", "amaryllis"],
    edibility:"Toxique / non comestible",
    status:"toxique",
    summary:"Cette famille regroupe plusieurs plantes bulbeuses décoratives comme les narcisses, jonquilles et amaryllis. Elles sont appréciées pour leurs floraisons marquées, souvent au printemps ou en intérieur.",
    benefits:"Usage principal : ornemental.",
    care:"Sol ou substrat drainant, bonne lumière, arrosage modéré pendant la croissance. Laisser le feuillage reconstituer le bulbe après floraison.",
    precautions:"Ne pas consommer : les bulbes et parfois d’autres parties peuvent être toxiques. Tenir éloigné des enfants et animaux.",
    source:"Profil familial automatique du Grimoire."
  },
  {
    id:"solanaceae",
    match:["solanaceae", "solanacée", "solanacées"],
    edibility:"Variable — prudence forte",
    status:"prudence",
    summary:"Les Solanacées comprennent à la fois des plantes alimentaires très connues comme la tomate, la pomme de terre ou le piment, et des plantes toxiques. Les parties comestibles dépendent énormément de l’espèce.",
    benefits:"Usages très variables : potager, ornement, épices ou plantes toxiques selon l’espèce.",
    care:"Souvent besoin de chaleur, lumière et sol riche pour les espèces cultivées au potager.",
    precautions:"Ne jamais consommer une Solanacée sauvage ou inconnue sur photo seule. Certaines espèces et certaines parties vertes peuvent être toxiques.",
    source:"Profil familial automatique du Grimoire."
  },
  {
    id:"brassicaceae",
    match:["brassicaceae", "brassicacée", "brassicacées"],
    edibility:"Souvent comestible, mais à confirmer",
    status:"prudence",
    summary:"Les Brassicacées regroupent choux, roquette, moutardes, radis et de nombreuses plantes sauvages à petites fleurs en croix. Beaucoup sont comestibles, mais l’espèce doit être confirmée.",
    benefits:"Usages fréquents en cuisine comme feuilles, graines, racines ou condiments selon l’espèce.",
    care:"Souvent culture en sol frais, lumière douce à ensoleillée, arrosage régulier.",
    precautions:"Confirmer l’espèce et éviter les zones polluées ou traitées avant tout usage alimentaire.",
    source:"Profil familial automatique du Grimoire."
  },
  {
    id:"poaceae",
    match:["poaceae", "poacée", "poacées", "graminée", "graminées"],
    edibility:"Variable selon l’espèce",
    status:"prudence",
    summary:"Les Poacées regroupent les herbes et graminées : gazons, céréales, bambous et nombreuses plantes de prairie. Elles se reconnaissent souvent à leurs feuilles étroites et tiges noueuses.",
    benefits:"Famille majeure pour les céréales et les prairies, mais toutes les espèces ne sont pas destinées à la consommation.",
    care:"Besoins très variables : beaucoup aiment la lumière et un sol drainé, avec arrosage selon l’espèce.",
    precautions:"Ne pas consommer les graines ou jeunes pousses sans identification claire. Attention aux traitements sur gazon.",
    source:"Profil familial automatique du Grimoire."
  },
  {
    id:"pinaceae",
    match:["pinaceae", "pinacee", "pinacée", "pinacées", "picea", "pinus", "abies", "cedrus", "larix", "épicéa", "epicea", "pin", "sapin", "cèdre", "cedre", "mélèze", "meleze"],
    edibility:"Non alimentaire / à ne pas consommer sans expertise",
    status:"prudence",
    summary:"Les Pinacées regroupent de nombreux conifères comme les épicéas, pins, sapins, cèdres et mélèzes. Ce sont surtout des arbres ornementaux, forestiers ou de paysage, reconnaissables à leurs aiguilles et à leurs cônes plutôt qu’à des fleurs voyantes.",
    benefits:"Usage principal : ornement, ombrage, bois, haies ou arbre de paysage selon l’espèce. Le Grimoire ne recommande pas d’usage alimentaire ou médicinal à partir d’une simple photo.",
    care:"Prévoir beaucoup d’espace, une situation lumineuse et un sol plutôt drainé. Beaucoup de conifères n’aiment pas l’eau stagnante ni les tailles sévères dans le vieux bois. En pot, surveiller l’arrosage et la chaleur qui dessèche vite les racines.",
    precautions:"Ne pas consommer sans identification experte. Certaines confusions avec d’autres conifères peuvent être dangereuses, notamment avec l’if qui n’appartient pas aux Pinacées et qui est toxique.",
    source:"Profil familial automatique du Grimoire pour les Pinacées et conifères."
  }
];
