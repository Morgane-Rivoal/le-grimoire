// Système de succès : gamifie l'observation en récompensant les jalons de
// l'herbier (espèces, familles, lieux, photos, notes…).
const ACHIEVEMENTS = [
  {id:"first-observation", icon:"🌱", predicate:s => s.observations >= 1},
  {id:"species-5",  icon:"🌿", predicate:s => s.species >= 5},
  {id:"species-15", icon:"🍀", predicate:s => s.species >= 15},
  {id:"species-30", icon:"🌳", predicate:s => s.species >= 30},
  {id:"families-5", icon:"📚", predicate:s => s.families >= 5},
  {id:"first-geo",  icon:"📍", predicate:s => s.geolocated >= 1},
  {id:"cartographer-10", icon:"🗺️", predicate:s => s.geolocated >= 10},
  {id:"first-photo", icon:"📷", predicate:s => s.photos >= 1},
  {id:"annotator",  icon:"✍️", predicate:s => s.notes >= 1},
  {id:"blooming",   icon:"🌸", predicate:s => s.bloomingNow >= 1},
  {id:"tagger",     icon:"🏷️", predicate:s => s.tagged >= 1}
];

function loadAchievements(){
  try{
    const saved = JSON.parse(localStorage.getItem("grimoire-achievements") || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch{
    return {};
  }
}

let achievementsState = loadAchievements();

function persistAchievements(){
  try{
    localStorage.setItem("grimoire-achievements", JSON.stringify(achievementsState));
  } catch{}
}

function herbariumStats(){
  const entries = Object.entries(collection);
  const species = new Set();
  const families = new Set();
  const stats = {total:0, observations:0, species:0, families:0, geolocated:0, photos:0, notes:0, locals:0, bloomingNow:0, tagged:0};

  entries.forEach(([id, entry]) => {
    if(!entry) return;
    stats.total++;
    let floweringText = "";
    if(entry.type === "identification"){
      stats.observations++;
      const sci = (entry.shortLatin || entry.latin || "").toLowerCase();
      if(sci) species.add(sci);
      if(entry.family) families.add(String(entry.family).toLowerCase());
      if(entry.hasObservationPhoto) stats.photos++;
      floweringText = entry.flowering || "";
    } else {
      const sourcePlant = plants.find(plant => plant.id === id);
      if(sourcePlant){
        stats.locals++;
        const plant = localizedPlant(sourcePlant);
        if(plant.latin) species.add(plant.latin.toLowerCase());
        if(plant.family) families.add(plant.family.toLowerCase());
        floweringText = plant.flowering || "";
      }
      if(entry.hasPersonalPhoto) stats.photos++;
    }
    const lat = Number(entry.lat), lon = Number(entry.lon);
    if(Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0)) stats.geolocated++;
    if(entry.note && String(entry.note).trim()) stats.notes++;
    if(Array.isArray(entry.tags) && entry.tags.length) stats.tagged++;
    if(typeof isBloomingNow === "function" && isBloomingNow(floweringText)) stats.bloomingNow++;
  });

  stats.species = species.size;
  stats.families = families.size;
  return stats;
}

// Évalue les succès après une action et notifie ceux nouvellement débloqués.
function checkAchievements(){
  const stats = herbariumStats();
  const newly = [];
  ACHIEVEMENTS.forEach(achievement => {
    if(!achievementsState[achievement.id] && achievement.predicate(stats)){
      achievementsState[achievement.id] = new Date().toISOString();
      newly.push(achievement);
    }
  });
  if(newly.length){
    persistAchievements();
    newly.forEach((achievement, index) => {
      setTimeout(
        () => showToast(`${achievement.icon} ${t("achv.unlocked")} : ${t(`achv.${achievement.id}.title`)}`),
        index * 500
      );
    });
  }
  return newly;
}

function achievementsProgress(){
  const unlocked = ACHIEVEMENTS.filter(achievement => achievementsState[achievement.id]).length;
  return {
    unlocked,
    total: ACHIEVEMENTS.length,
    stats: herbariumStats(),
    list: ACHIEVEMENTS.map(achievement => ({
      id: achievement.id,
      icon: achievement.icon,
      unlocked: Boolean(achievementsState[achievement.id]),
      date: achievementsState[achievement.id] || null
    }))
  };
}
