// Bibliothèque des plantes : recherche, filtres et grille de l’écran Explorer.
let currentFilter = "all";
let plantRenderTimer = null;
let bloomingNowOnly = false;

const MONTH_NAMES = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const SEASON_MONTHS = {
  "printemps":[3,4,5],
  "été":[6,7,8],
  "automne":[9,10,11],
  "hiver":[12,1,2]
};

function findWordPosition(normalized, word){
  const match = new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, "u").exec(normalized);
  return match ? match.index : -1;
}

function floweringMonths(text){
  if(!text) return [];
  const normalized = text.toLowerCase();
  const found = [];
  MONTH_NAMES.forEach((name, index) => {
    const pos = findWordPosition(normalized, name);
    if(pos !== -1) found.push({month: index + 1, pos});
  });
  Object.entries(SEASON_MONTHS).forEach(([season, months]) => {
    const pos = findWordPosition(normalized, season);
    if(pos !== -1) found.push({month: months[0], endMonth: months[months.length - 1], pos});
  });
  if(!found.length) return [];
  found.sort((a, b) => a.pos - b.pos);
  const first = found[0];
  const last = found[found.length - 1];
  const startMonth = first.month;
  const endMonth = last.endMonth ?? last.month;
  const months = [startMonth];
  let month = startMonth;
  while(month !== endMonth && months.length <= 12){
    month = month === 12 ? 1 : month + 1;
    months.push(month);
  }
  return months;
}

function isBloomingNow(floweringText, referenceDate = new Date()){
  const months = floweringMonths(floweringText);
  return months.includes(referenceDate.getMonth() + 1);
}

function toggleBloomingNow(){
  bloomingNowOnly = !bloomingNowOnly;
  const toggle = document.getElementById("bloomToggle");
  toggle.classList.toggle("active", bloomingNowOnly);
  toggle.setAttribute("aria-pressed", String(bloomingNowOnly));
  renderPlants();
}

function schedulePlantRender(){
  clearTimeout(plantRenderTimer);
  plantRenderTimer = setTimeout(renderPlants, 140);
}

function setFilter(filter){
  currentFilter = filter;
  document.querySelectorAll(".chip[data-filter]").forEach(chip => chip.classList.toggle("active", chip.dataset.filter === filter));
  renderPlants();
}

function plantMatches(plant, query){
  const haystack = [plant.name, plant.latin, plant.family, plant.summary, plant.recognition, plant.cuisine].join(" ").toLowerCase();
  const filterOk = currentFilter === "all" || plant.status === currentFilter || plant.tags.includes(currentFilter);
  const bloomOk = !bloomingNowOnly || isBloomingNow(plant.flowering);
  return filterOk && bloomOk && haystack.includes(query);
}

function identifiedPlantMatches(entry, query){
  const localPlant = plants.find(plant => plant.id === entry.localPlantId);
  const haystack = [
    entry.name,
    entry.latin,
    entry.family,
    entry.summary,
    entry.edibility,
    entry.benefits,
    entry.care,
    entry.place,
    entry.note,
    (entry.tags || []).join(" ")
  ].join(" ").toLowerCase();
  const status = entry.safetyStatus || "inconnu";
  const filterOk =
    currentFilter === "all" ||
    status === currentFilter ||
    (currentFilter === "prudence" && status !== "comestible") ||
    (currentFilter === "aromatique" && localPlant?.tags?.includes("aromatique"));
  const floweringText = localPlant ? localizedPlant(localPlant).flowering : entry.flowering;
  const bloomOk = !bloomingNowOnly || isBloomingNow(floweringText);
  return filterOk && bloomOk && haystack.includes(query);
}

function renderPlants(){
  const query = document.getElementById("search").value.toLowerCase().trim();
  const grid = document.getElementById("plantGrid");
  grid.innerHTML = "";
  const fragment = document.createDocumentFragment();
  plants.map(localizedPlant).filter(p => plantMatches(p, query)).forEach(plant => {
    const card = document.createElement("article");
    card.className = "plant-card";
    card.onclick = () => openPlant(plant.id);
    card.innerHTML = `
      <div class="plant-visual">${plantStaticImageMarkup(plant)}</div>
      <h3>${plant.name}</h3>
      <p class="latin">${plant.latin}</p>
      <div class="badges">
        <span class="badge ${plant.status === "prudence" ? "red" : ""}">${t(plant.status === "comestible" ? "status.edible" : "status.caution")}</span>
      </div>
    `;
    fragment.appendChild(card);
  });

  Object.entries(collection)
    .filter(([, entry]) => entry?.type === "identification" && identifiedPlantMatches(entry, query))
    .forEach(([id, entry]) => {
      const localPlant = plants.find(plant => plant.id === entry.localPlantId);
      const profile = knowledgeForSpecies(entry, localPlant);
      const card = document.createElement("article");
      card.className = "plant-card";
      card.onclick = () => openIdentifiedPlant(id);
      card.innerHTML = `
        <div class="plant-visual">${plantPlateMarkup(entry)}</div>
        <h3>${safeText(entry.name)}</h3>
        <p class="latin">${safeText(entry.latin)}</p>
        <div class="badges">
          <span class="badge">${t("status.observation")}</span>
          <span class="badge ${profile.status === "comestible" ? "" : "red"}">${safeText(profile.edibility || t("status.unknown"))}</span>
        </div>
      `;
      fragment.appendChild(card);
    });
  grid.appendChild(fragment);
}
