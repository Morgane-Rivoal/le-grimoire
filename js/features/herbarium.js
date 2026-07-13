// Carnet Herbier : recherche, filtres, tri et grille des plantes sauvegardées.
let herbariumFilter = "all";
let herbariumSort = "recent";
let collectionRenderTimer = null;

function cardTagsMarkup(tags){
  if(!Array.isArray(tags) || !tags.length) return "";
  return `<div class="card-tags">${tags.slice(0, 4).map(tag => `<span class="card-tag">${safeText(tag)}</span>`).join("")}</div>`;
}

function scheduleCollectionRender(){
  clearTimeout(collectionRenderTimer);
  collectionRenderTimer = setTimeout(renderCollection, 140);
}

function setHerbariumFilter(filter){
  herbariumFilter = filter;
  document.querySelectorAll(".herbarium-chip").forEach(chip =>
    chip.classList.toggle("active", chip.dataset.herbariumFilter === filter)
  );
  renderCollection();
}

function setHerbariumSort(sort){
  herbariumSort = sort === "alpha" ? "alpha" : "recent";
  renderCollection();
}

function herbariumEntryName(id, entry){
  if(entry?.type === "identification") return entry.name || "";
  const sourcePlant = plants.find(p => p.id === id);
  return sourcePlant ? localizedPlant(sourcePlant).name : "";
}

function herbariumEntryCreatedAt(entry){
  return entry?.createdAt || "1970-01-01T00:00:00.000Z";
}

function sortHerbariumIds(ids){
  const sorted = [...ids];
  if(herbariumSort === "alpha"){
    sorted.sort((a, b) => herbariumEntryName(a, collection[a]).localeCompare(herbariumEntryName(b, collection[b]), currentLocale));
  } else {
    sorted.sort((a, b) => herbariumEntryCreatedAt(collection[b]).localeCompare(herbariumEntryCreatedAt(collection[a])));
  }
  return sorted;
}

function isMedicinalText(text){
  const source = String(text || "");
  const negated = /ne\s+recommande\s+pas|pas\s+d[’']usage|no\s+medicinal|not\s+recommended|données\s+insuffisantes|insufficient\s+data/i.test(source);
  if(negated) return false;
  return /médicin|medicin|infusion|tisane|remède|remede|vertus?\b|traditionnellement\s+utilis|traditionally\s+used/i.test(source);
}

function herbariumEntryMatches(id, entry, query){
  if(entry?.type === "identification"){
    const localPlant = plants.find(plant => plant.id === entry.localPlantId);
    const profile = knowledgeForSpecies(entry, localPlant);
    const haystack = [
      entry.name,
      entry.latin,
      entry.family,
      entry.place,
      entry.note,
      (entry.tags || []).join(" "),
      profile.summary,
      profile.benefits,
      profile.edibility
    ].join(" ").toLowerCase();
    const status = profile.status || entry.safetyStatus || "inconnu";
    const medicinal = isMedicinalText(`${profile.benefits || ""} ${profile.summary || ""}`);
    return haystack.includes(query) && (
      herbariumFilter === "all" ||
      (herbariumFilter === "comestible" && status === "comestible") ||
      (herbariumFilter === "prudence" && status !== "comestible") ||
      (herbariumFilter === "medicinal" && medicinal)
    );
  }

  const sourcePlant = plants.find(p => p.id === id);
  if(!sourcePlant) return false;
  const plant = localizedPlant(sourcePlant);
  const haystack = [
    plant.name,
    plant.latin,
    plant.family,
    plant.summary,
    plant.tradition,
    entry?.place,
    entry?.note,
    (entry?.tags || []).join(" ")
  ].join(" ").toLowerCase();
  const medicinal = isMedicinalText(`${plant.tradition || ""} ${plant.summary || ""}`);
  return haystack.includes(query) && (
    herbariumFilter === "all" ||
    (herbariumFilter === "comestible" && plant.status === "comestible") ||
    (herbariumFilter === "prudence" && plant.status !== "comestible") ||
    (herbariumFilter === "medicinal" && medicinal)
  );
}

function renderCollection(){
  const grid = document.getElementById("collectionGrid");
  const empty = document.getElementById("emptyHerbier");
  const query = document.getElementById("herbariumSearch")?.value?.toLowerCase().trim() || "";
  grid.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const ids = sortHerbariumIds(Object.keys(collection).filter(id => herbariumEntryMatches(id, collection[id], query)));
  empty.style.display = ids.length ? "none" : "block";
  ids.forEach(id => {
    const personal = collection[id];
    if(personal?.type === "identification"){
      const localPlant = plants.find(plant => plant.id === personal.localPlantId);
      const profile = knowledgeForSpecies(personal, localPlant);
      const card = document.createElement("article");
      card.className = "plant-card";
      card.onclick = () => openIdentifiedPlant(id);
      card.innerHTML = `
        <div class="plant-visual">${plantPlateMarkup(personal)}</div>
        <h3>${safeText(personal.name)}</h3>
        <p class="latin">${safeText(personal.latin)}</p>
        <div class="badges">
          <span class="badge">${t("status.observation")}</span>
          <span class="badge ${profile.status === "comestible" ? "" : "red"}">${safeText(profile.edibility || t("status.unknown"))}</span>
        </div>
        <p class="small-note">${safeText(personal.place || t("plant.placeMissing"))}</p>
        ${cardTagsMarkup(personal.tags)}
      `;
      fragment.appendChild(card);
      return;
    }

    const sourcePlant = plants.find(p => p.id === id);
    if(!sourcePlant) return;
    const plant = localizedPlant(sourcePlant);
    const card = document.createElement("article");
    card.className = "plant-card";
    card.onclick = () => openPlant(id);
    card.innerHTML = `
      <div class="plant-visual">${plantStaticImageMarkup(plant)}</div>
      <h3>${plant.name}</h3>
      <p class="latin">${plant.latin}</p>
      <div class="badges"><span class="badge">${t("plant.inHerbarium")}</span></div>
      <p class="small-note">${safeText(personal.place || t("plant.placeMissing"))}</p>
      ${cardTagsMarkup(personal.tags)}
    `;
    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
}

async function renderExplorationMap(){
  const map = document.getElementById("explorationMap");
  const empty = document.getElementById("mapEmpty");
  if(!map) return;
  map.innerHTML = "";
  const entries = Object.entries(collection).filter(([, entry]) =>
    Number.isFinite(entry?.lat) && Number.isFinite(entry?.lon)
  );
  empty?.classList.toggle("hidden", entries.length > 0);
  if(!entries.length) return;

  const lats = entries.map(([, entry]) => entry.lat);
  const lons = entries.map(([, entry]) => entry.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  for(const [id, entry] of entries){
    const marker = document.createElement("button");
    marker.className = "map-marker";
    marker.style.left = `${12 + ((entry.lon - minLon) / (maxLon - minLon || 1)) * 76}%`;
    marker.style.top = `${12 + (1 - (entry.lat - minLat) / (maxLat - minLat || 1)) * 76}%`;
    marker.title = `${herbariumEntryName(id, entry) || t("status.observation")} — ${entry.place || t("plant.placeMissing")}`;
    marker.innerHTML = "<span>🌿</span>";
    marker.onclick = () => entry.type === "identification" ? openIdentifiedPlant(id) : openPlant(id);
    map.appendChild(marker);

    if(entry.type === "identification"){
      try{
        const blob = await getObservationPhoto(id);
        if(blob){
          const url = URL.createObjectURL(blob);
          marker.innerHTML = `<img src="${url}" alt="">`;
        }
      } catch{}
    }
  }
}
