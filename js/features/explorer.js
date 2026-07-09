// Bibliothèque des plantes : recherche, filtres et grille de l’écran Explorer.
let currentFilter = "all";
let plantRenderTimer = null;

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
  return filterOk && haystack.includes(query);
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
    entry.note
  ].join(" ").toLowerCase();
  const status = entry.safetyStatus || "inconnu";
  const filterOk =
    currentFilter === "all" ||
    status === currentFilter ||
    (currentFilter === "prudence" && status !== "comestible") ||
    (currentFilter === "aromatique" && localPlant?.tags?.includes("aromatique"));
  return filterOk && haystack.includes(query);
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
