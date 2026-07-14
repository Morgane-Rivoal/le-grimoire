// Fiche plante (locale ou observée) : rendu, notes personnelles et photo d’observation.
let currentPlantView = null;
let activeObservationPhotoUrl = null;
let activeLocalPhotoUrl = null;
let ficheMiniMap = null;
const enrichmentRequests = new Set();

function validCoord(value){
  return value !== "" && value !== undefined && value !== null && !Number.isNaN(Number(value));
}

function valueOrTodo(value){
  return value && String(value).trim() ? value : t("common.complete");
}

async function sharePlantSheet(name, latin, summary){
  const text = `${name} (${latin}) — ${summary}\n\n${t("safety.disclaimer")}\n\n${t("app.title")} : ${location.origin}`;
  if(navigator.share){
    try{
      await navigator.share({title: t("app.title"), text});
    } catch{
      // Partage annulé par l’utilisateur : aucune action nécessaire.
    }
    return;
  }
  try{
    await navigator.clipboard.writeText(text);
    showToast(t("alert.shareCopied"));
  } catch{
    showToast(t("alert.shareUnavailable"));
  }
}

function shareLocalPlant(id){
  const sourcePlant = plants.find(p => p.id === id);
  if(!sourcePlant) return;
  const plant = localizedPlant(sourcePlant);
  sharePlantSheet(plant.name, plant.latin, plant.summary);
}

function shareIdentifiedPlant(id){
  const entry = collection[id];
  if(!entry) return;
  const localPlant = plants.find(plant => plant.id === entry.localPlantId);
  const profile = knowledgeForSpecies(entry, localPlant);
  sharePlantSheet(entry.name, entry.latin, profile.summary);
}

function locationMapMarkup(lat, lon){
  if(!validCoord(lat) || !validCoord(lon)) return "";
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
  return `
    <div class="observation-map">
      <div id="ficheMiniMap" class="fiche-mini-map"></div>
      <a href="${safeText(osmUrl)}" target="_blank" rel="noopener noreferrer">${t("plant.viewOnMap")}</a>
    </div>
  `;
}

// Mini-carte Leaflet cohérente avec l'écran Carte (remplace l'ancienne iframe OSM).
function hydrateFicheMap(lat, lon){
  const container = document.getElementById("ficheMiniMap");
  if(!container || typeof L === "undefined" || !validCoord(lat) || !validCoord(lon)) return;
  if(ficheMiniMap){
    ficheMiniMap.remove();
    ficheMiniMap = null;
  }
  const point = [Number(lat), Number(lon)];
  ficheMiniMap = L.map(container, {zoomControl:false, attributionControl:false, scrollWheelZoom:false});
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19, attribution:"© OpenStreetMap"}).addTo(ficheMiniMap);
  L.marker(point, {
    icon: L.divIcon({className:"map-pin-wrap", html:`<span class="map-pin-dot">📍</span>`, iconSize:[26,26], iconAnchor:[13,24]})
  }).addTo(ficheMiniMap);
  ficheMiniMap.setView(point, 14);
  setTimeout(() => { if(ficheMiniMap) ficheMiniMap.invalidateSize(); }, 80);
}

function locationFieldsMarkup(entry){
  const lat = entry?.lat ?? "";
  const lon = entry?.lon ?? "";
  return `
    <div class="place-row">
      <input id="placeInput" placeholder="${t("plant.place")}" value="${safeText(entry?.place || "")}">
      <button type="button" class="icon-button" onclick="captureLocation()" aria-label="${t("plant.useMyLocation")}">📍</button>
    </div>
    <input type="hidden" id="latInput" value="${safeText(lat)}">
    <input type="hidden" id="lonInput" value="${safeText(lon)}">
    <div id="locationMap">${locationMapMarkup(lat, lon)}</div>
  `;
}

async function resolvePlaceName(lat, lon){
  try{
    const response = await fetch(`/api/reverse-geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&lang=${encodeURIComponent(currentLocale)}`);
    if(!response.ok) return "";
    const data = await response.json();
    return data.label || "";
  } catch{
    return "";
  }
}

async function geocodePlace(query){
  const value = String(query || "").trim();
  if(!value) return null;
  try{
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(value)}&lang=${encodeURIComponent(currentLocale)}`);
    if(!response.ok) return null;
    return await response.json();
  } catch{
    return null;
  }
}

// Complète les coordonnées à partir d'un lieu saisi à la main (sans géoloc),
// afin que l'observation apparaisse quand même sur la carte des découvertes.
async function coordinatesForEntry(place, lat, lon){
  const hasCoords = lat !== undefined && lon !== undefined && !Number.isNaN(lat) && !Number.isNaN(lon);
  if(hasCoords || !String(place || "").trim()) return {lat, lon};
  const located = await geocodePlace(place);
  if(located && Number.isFinite(located.lat) && Number.isFinite(located.lon)){
    return {lat: located.lat, lon: located.lon};
  }
  return {lat, lon};
}

function captureLocation(){
  if(!("geolocation" in navigator)){
    showToast(t("plant.locationUnavailable"));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      document.getElementById("latInput").value = lat;
      document.getElementById("lonInput").value = lon;
      const mapMount = document.getElementById("locationMap");
      if(mapMount){
        mapMount.innerHTML = locationMapMarkup(lat, lon);
        hydrateFicheMap(lat, lon);
      }
      showToast(t("plant.locationCaptured"));

      const placeInput = document.getElementById("placeInput");
      if(placeInput && !placeInput.value.trim()){
        const fallback = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        placeInput.value = fallback;
        placeInput.placeholder = t("plant.locationResolving");
        const label = await resolvePlaceName(lat, lon);
        // On n'écrase pas ce que l'utilisateur a pu saisir entre-temps.
        if(label && placeInput.value === fallback) placeInput.value = label;
        placeInput.placeholder = t("plant.place");
      }
    },
    () => showToast(t("plant.locationDenied")),
    {enableHighAccuracy:false, timeout:8000}
  );
}

function readCoordInput(id){
  const raw = document.getElementById(id)?.value;
  return raw !== "" && raw != null ? parseFloat(raw) : undefined;
}

// --- Étiquettes / carnets personnalisés ---
function tagChipMarkup(tag){
  return `<span class="tag-chip" data-tag="${safeText(tag)}">${safeText(tag)}<button type="button" onclick="removeTagChip(this)" aria-label="${t("tags.remove")}">✕</button></span>`;
}

function tagsEditorMarkup(entry){
  const tags = Array.isArray(entry?.tags) ? entry.tags : [];
  return `
    <div class="tags-editor">
      <span class="tags-label">${t("tags.label")}</span>
      <div id="tagChips" class="tag-chips">${tags.map(tagChipMarkup).join("")}</div>
      <div class="tag-add">
        <input id="tagInput" placeholder="${t("tags.placeholder")}" onkeydown="tagInputKey(event)" maxlength="24">
        <button type="button" class="secondary" onclick="addTagFromInput()">${t("tags.add")}</button>
      </div>
    </div>
  `;
}

function addTagFromInput(){
  const input = document.getElementById("tagInput");
  const chips = document.getElementById("tagChips");
  if(!input || !chips) return;
  const value = input.value.trim();
  if(value){
    const existing = Array.from(chips.querySelectorAll(".tag-chip")).map(chip => chip.dataset.tag.toLowerCase());
    if(!existing.includes(value.toLowerCase())){
      chips.insertAdjacentHTML("beforeend", tagChipMarkup(value));
    }
  }
  input.value = "";
  input.focus();
}

function tagInputKey(event){
  if(event.key === "Enter"){
    event.preventDefault();
    addTagFromInput();
  }
}

function removeTagChip(button){
  button.closest(".tag-chip")?.remove();
}

function readTags(){
  const chips = document.getElementById("tagChips");
  if(!chips) return [];
  return Array.from(chips.querySelectorAll(".tag-chip")).map(chip => chip.dataset.tag).filter(Boolean);
}

function identityMarkup(fields){
  return `
    <div class="identity">
      ${fields.map(field => `<div><strong>${safeText(field.label)}</strong>${safeText(valueOrTodo(field.value))}</div>`).join("")}
    </div>
  `;
}

function infoBlockMarkup(title, content){
  return `<div class="info-block"><strong>${safeText(title)}</strong><p>${safeText(valueOrTodo(content))}</p></div>`;
}

function photoBlockMarkup(content){
  return `<div class="info-block"><strong>${t("photo.section")}</strong>${content}</div>`;
}

function switchFicheTab(button, index){
  const wrap = button.closest(".fiche");
  if(!wrap) return;
  wrap.querySelectorAll(".fiche-tab").forEach((tab, i) => {
    const selected = i === index;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  wrap.querySelectorAll(".fiche-panel").forEach((panel, i) =>
    panel.classList.toggle("active", i === index)
  );
}

function ficheTabs(tabs){
  const nav = tabs.map((tab, index) =>
    `<button type="button" class="fiche-tab ${index === 0 ? "active" : ""}" role="tab" aria-selected="${index === 0}" onclick="switchFicheTab(this, ${index})">${safeText(tab.label)}</button>`
  ).join("");
  const panels = tabs.map((tab, index) =>
    `<div class="fiche-panel ${index === 0 ? "active" : ""}" role="tabpanel" data-panel="${index}">${tab.content}</div>`
  ).join("");
  return `<div class="fiche"><div class="fiche-tabs" role="tablist">${nav}</div><div class="fiche-panels">${panels}</div></div>`;
}

function unifiedFicheSections(data){
  return ficheTabs([
    {
      label: t("tab.overview"),
      content: `
        <div class="safety-box"><span>⚠️</span><div>${safeText(t("safety.disclaimer"))}</div></div>
        ${infoBlockMarkup(t("section.summary"), data.summary)}
      `
    },
    {
      label: t("tab.recognition"),
      content: `
        ${infoBlockMarkup(t("section.recognition"), data.recognition)}
        ${photoBlockMarkup(data.photo)}
      `
    },
    {
      label: t("tab.uses"),
      content: `
        ${infoBlockMarkup(t("section.consumption"), data.consumption)}
        ${infoBlockMarkup(t("section.benefits"), data.benefits)}
        <div class="warning">⚠️ ${safeText(valueOrTodo(data.precautions))}</div>
      `
    },
    {
      label: t("tab.culture"),
      content: `
        ${infoBlockMarkup(t("section.care"), data.care)}
        ${infoBlockMarkup(t("section.anecdote"), data.anecdote)}
      `
    },
    {
      label: t("tab.source"),
      content: `
        ${data.linkedFiche || ""}
        ${infoBlockMarkup(t("section.source"), data.source)}
      `
    }
  ]);
}

function openIdentifiedPlant(id){
  const entry = collection[id];
  if(!entry || entry.type !== "identification") return;
  const localPlant = plants.find(plant => plant.id === entry.localPlantId);
  const displayPlant = localPlant ? localizedPlant(localPlant) : null;
  currentPlantView = {type:"identification", id};
  const mount = document.getElementById("plantMount");
  const computedProfile = knowledgeForSpecies(entry, localPlant);
  const shouldRefreshProfile =
    !entry.autoProfileVersion ||
    entry.autoProfileVersion < 7 ||
    !entry.summary ||
    !entry.botanicalNote ||
    entry.botanicalNote.includes("Fiche créée automatiquement") ||
    entry.summary.includes("ne possède pas encore de fiche complète fiable") ||
    entry.summary.includes("fiche à vérifier");
  if(shouldRefreshProfile){
    entry.autoProfileVersion = 7;
    entry.edibility = computedProfile.edibility;
    entry.safetyStatus = computedProfile.status;
    entry.summary = computedProfile.summary;
    entry.benefits = computedProfile.benefits;
    entry.care = computedProfile.care;
    entry.precautions = computedProfile.precautions;
    entry.botanicalNote = botanicalNoteFor(entry, computedProfile, localPlant);
    entry.knowledgeSource = computedProfile.source;
    saveCollection();
  }
  const profile = {
    edibility: computedProfile.edibility,
    status: computedProfile.status,
    summary: computedProfile.summary,
    benefits: computedProfile.benefits,
    care: computedProfile.care,
    precautions: computedProfile.precautions,
    botanicalNote: botanicalNoteFor(entry, computedProfile, displayPlant),
    source: computedProfile.source
  };
  const needsVerification = entry.needsVerification || Number(entry.score || 0) < 50;
  const originText = entry.origin || t("plant.photoOrigin", {
    date: entry.date || new Date(entry.createdAt || Date.now()).toLocaleDateString(currentLocale === "en" ? "en" : "fr-FR")
  });

  mount.innerHTML = `
    <div class="topbar">
      <button class="back" onclick="goBack('herbier')" aria-label="Retour">‹</button>
      <div class="topbar-actions">
        <button class="icon-button" onclick="window.print()" aria-label="${t("plant.exportPdf")}">🖨️</button>
        <button class="icon-button" onclick="shareIdentifiedPlant('${id}')" aria-label="${t("action.share")}">🔗</button>
        <button class="secondary" onclick="deleteIdentifiedPlant('${id}')">${t("common.remove")}</button>
      </div>
    </div>

    <div id="observationHeroMount" class="observation-hero pending-photo"><p>${safeText(t("photo.loading"))}</p></div>

    <p class="kicker">${t("plant.savedObservation")}</p>
    <h2>${safeText(entry.name)}</h2>
    <p class="latin">${safeText(entry.latin)}</p>
    <p class="observation-origin">${safeText(originText)}</p>

    <div class="badges">
      <span class="badge">Pl@ntNet</span>
      <span class="badge ${needsVerification ? "red" : ""}">${safeText(needsVerification ? t("result.verify") : t("result.validated"))}</span>
      <span class="badge">${t("plant.confidence", {score: entry.score || 0})}</span>
      <span class="badge ${profile.status === "toxique" || profile.status === "prudence" || profile.status === "inconnu" ? "red" : ""}">${safeText(profile.edibility)}</span>
      <span class="badge">${safeText(entry.family)}</span>
    </div>

    ${needsVerification ? `<div class="warning">${safeText(t("result.verifyHelp"))}</div>` : ""}

    <div class="plate">${plantPlateMarkup(entry)}</div>

    ${identityMarkup([
      {label:t("field.family"), value:entry.family},
      {label:t("field.flowering"), value:displayPlant?.flowering || computedProfile.flowering || entry.flowering || t("field.variable")},
      {label:t("field.height"), value:displayPlant?.height || computedProfile.height || entry.height || t("field.variable")},
      {label:t("field.status"), value:profile.edibility},
      {label:t("field.source"), value:entry.source || "Pl@ntNet"},
      {label:t("field.observation"), value:entry.date || t("common.notProvided")},
      {label:t("field.organ"), value:entry.organ || t("common.notProvided")}
    ])}

    ${unifiedFicheSections({
      summary: profile.summary,
      recognition: recognitionTextFor(entry, localPlant, computedProfile),
      photo: `<div id="observationPhotoMount"><p>${safeText(t("photo.loading"))}</p></div>`,
      consumption: profile.consumption || profile.edibility,
      benefits: profile.benefits,
      care: profile.care,
      precautions: profile.precautions,
      anecdote: profile.botanicalNote,
      linkedFiche: localPlant ? `<div class="info-block"><strong>${t("section.linked")}</strong><p><button class="secondary" onclick="openPlant('${localPlant.id}')">${t("section.openFull")}</button></p></div>` : "",
      source: profile.source
    })}

    <div class="note-form">
      <p class="kicker">${t("section.notes")}</p>
      ${locationFieldsMarkup(entry)}
      <input id="dateInput" type="date" value="${safeText(entry.date || "")}">
      <textarea id="noteInput" placeholder="${t("plant.notes")}">${safeText(entry.note || "")}</textarea>
      ${tagsEditorMarkup(entry)}
      <button id="ficheSaveButton" class="danger" onclick="saveIdentifiedPersonal('${id}')">${t("common.save")}</button>
    </div>
  `;
  go("plantPage");
  hydrateObservationPhoto(id, entry);
  hydrateFicheMap(entry.lat, entry.lon);
  refreshMissingEnrichment(id, entry);
}

// État occupé du bouton de sauvegarde pendant les appels réseau (géocodage).
function setFicheSaveBusy(busy){
  const button = document.getElementById("ficheSaveButton");
  if(!button) return;
  if(busy){
    button.dataset.label = button.textContent;
    button.disabled = true;
    button.textContent = t("common.saving");
  } else {
    button.disabled = false;
    if(button.dataset.label) button.textContent = button.dataset.label;
  }
}

async function refreshMissingEnrichment(id, entry){
  if(entry.enrichment || enrichmentRequests.has(id) || !entry.shortLatin) return;
  enrichmentRequests.add(id);
  try{
    const response = await fetch(`/api/species-info?name=${encodeURIComponent(entry.shortLatin)}&lang=${encodeURIComponent(currentLocale)}`);
    if(!response.ok) return;
    const enrichment = await response.json();
    entry.enrichment = enrichment;
    entry.flowering = enrichment.flowering || entry.flowering || "";
    entry.height = enrichment.height || entry.height || "";
    if(!entry.imageUrl && enrichment.imageUrl) entry.imageUrl = enrichment.imageUrl;
    saveCollection();
    if(currentPlantView?.type === "identification" && currentPlantView.id === id){
      openIdentifiedPlant(id);
    }
  } catch{
    // La fiche prudente reste utilisable si la source encyclopédique est indisponible.
  } finally {
    enrichmentRequests.delete(id);
  }
}

async function hydrateObservationPhoto(id, entry){
  const mount = document.getElementById("observationPhotoMount");
  const heroMount = document.getElementById("observationHeroMount");
  if(!mount && !heroMount) return;
  if(activeObservationPhotoUrl){
    URL.revokeObjectURL(activeObservationPhotoUrl);
    activeObservationPhotoUrl = null;
  }
  try{
    const blob = await getObservationPhoto(id);
    if(blob){
      mountIdentificationObservationBlob(id, blob, entry);
      return;
    }
  } catch{}
  const fallback = entry.imageUrl
    ? `<div class="observation-photo"><img src="${safeText(entry.imageUrl)}" alt="${safeText(t("photo.compareAlt", {name:entry.name}))}"><span>${t("photo.reference")}</span></div>`
    : `<p>${safeText(t("photo.none"))}</p>`;
  if(mount) mount.innerHTML = fallback;
  if(heroMount) heroMount.innerHTML = fallback;
}

async function repairStoredObservationPhoto(id, blob){
  if(!navigator.onLine) return null;
  try{
    const file = blob instanceof File
      ? blob
      : new File([blob], "photo-observation", {type: blob?.type || "application/octet-stream"});
    const formData = new FormData();
    formData.append("image", file, file.name || "photo-observation");
    const response = await fetch("/api/photo-preview", {method:"POST", body:formData});
    if(!response.ok) return null;
    const repaired = await response.blob();
    const displayBlob = new File([repaired], "photo-observation.jpg", {type: repaired.type || "image/jpeg"});
    await storeObservationPhoto(id, displayBlob);
    return displayBlob;
  } catch{
    return null;
  }
}

function mountIdentificationObservationBlob(id, blob, entry, allowRepair = true){
  const mount = document.getElementById("observationPhotoMount");
  const heroMount = document.getElementById("observationHeroMount");
  if(!mount && !heroMount) return;
  if(activeObservationPhotoUrl){
    URL.revokeObjectURL(activeObservationPhotoUrl);
  }
  activeObservationPhotoUrl = URL.createObjectURL(blob);
  const fallbackHtml = entry.imageUrl
    ? `<div class="observation-photo"><img src="${safeText(entry.imageUrl)}" alt="${safeText(t("photo.compareAlt", {name:entry.name}))}"><span>${t("photo.reference")}</span></div>`
    : `<p>${safeText(t("photo.none"))}</p>`;
  const userPhotoHtml = `<div class="observation-photo"><img src="${activeObservationPhotoUrl}" alt="${safeText(t("photo.observationAlt", {name:entry.name}))}"><span>${t("photo.yours")}</span></div>`;
  const comparisonHtml = `
    <div class="observation-comparison">
      ${userPhotoHtml}
      ${entry.imageUrl ? `<div class="observation-photo reference-photo"><img src="${safeText(entry.imageUrl)}" alt="${safeText(t("photo.compareAlt", {name:entry.name}))}"><span>${t("photo.reference")}</span></div>` : ""}
    </div>
  `;
  if(heroMount){
    heroMount.classList.remove("pending-photo");
    heroMount.innerHTML = userPhotoHtml;
  }
  if(mount) mount.innerHTML = comparisonHtml;
  const image = (mount || heroMount).querySelector("img");
  if(!image) return;
  image.onerror = async () => {
    if(!allowRepair){
      if(mount) mount.innerHTML = fallbackHtml;
      if(heroMount) heroMount.innerHTML = fallbackHtml;
      return;
    }
    if(mount) mount.innerHTML = `<p>${safeText(t("photo.repairing"))}</p>`;
    if(heroMount) heroMount.innerHTML = `<p>${safeText(t("photo.repairing"))}</p>`;
    const repaired = await repairStoredObservationPhoto(id, blob);
    if(repaired){
      mountIdentificationObservationBlob(id, repaired, entry, false);
    } else {
      if(mount) mount.innerHTML = fallbackHtml;
      if(heroMount) heroMount.innerHTML = fallbackHtml;
    }
  };
}

async function saveIdentifiedPersonal(id){
  const entry = collection[id];
  if(!entry || entry.type !== "identification") return;
  const place = document.getElementById("placeInput").value;
  const note = document.getElementById("noteInput").value;
  const date = document.getElementById("dateInput").value;
  const tags = readTags();
  setFicheSaveBusy(true);
  const {lat, lon} = await coordinatesForEntry(place, readCoordInput("latInput"), readCoordInput("lonInput"));
  entry.place = place;
  entry.date = date;
  entry.note = note;
  entry.tags = tags;
  entry.lat = lat;
  entry.lon = lon;
  if(!saveCollection()){
    setFicheSaveBusy(false);
    showToast(t("alert.saveFailed"), 5000);
    return;
  }
  renderPlants();
  if(typeof checkAchievements === "function") checkAchievements();
  showToast(t("alert.observationSaved"));
  openIdentifiedPlant(id);
}

function deleteIdentifiedPlant(id){
  if(!collection[id] || collection[id].type !== "identification") return;
  if(!confirm(t("confirm.remove"))) return;
  const removed = collection[id];
  delete collection[id];
  if(!saveCollection()){
    collection[id] = removed;
    showToast(t("alert.saveFailed"), 5000);
    return;
  }
  deleteObservationPhoto(id).catch(() => {});
  renderPlants();
  go("herbier");
}

function openPlant(id){
  const sourcePlant = plants.find(p => p.id === id);
  if(!sourcePlant) return;
  const plant = localizedPlant(sourcePlant);
  currentPlantView = {type:"local", id};
  const saved = collection[id];
  const mount = document.getElementById("plantMount");
  mount.innerHTML = `
    <div class="topbar">
      <button class="back" onclick="goBack('explorer')" aria-label="Retour">‹</button>
      <div class="topbar-actions">
        <button class="icon-button" onclick="window.print()" aria-label="${t("plant.exportPdf")}">🖨️</button>
        <button class="icon-button" onclick="shareLocalPlant('${plant.id}')" aria-label="${t("action.share")}">🔗</button>
        <button class="secondary" onclick="toggleCollection('${plant.id}')">${t(saved ? "plant.inHerbarium" : "plant.addHerbarium")}</button>
      </div>
    </div>

    <div class="plate">${plantStaticImageMarkup(plant)}</div>

    <p class="kicker">${t("plant.page")}</p>
    <h2>${plant.name}</h2>
    <p class="latin">${plant.latin}</p>

    <div class="badges">
      <span class="badge ${plant.status === "prudence" ? "red" : ""}">${t(plant.status === "comestible" ? "status.edible" : "status.caution")}</span>
      <span class="badge">${plant.family}</span>
    </div>

    ${identityMarkup([
      {label:t("field.family"), value:plant.family},
      {label:t("field.flowering"), value:plant.flowering},
      {label:t("field.height"), value:plant.height},
      {label:t("field.status"), value:t(plant.status === "comestible" ? "status.edible" : "status.caution")},
      {label:t("field.source"), value:plant.source},
      {label:t("field.observation"), value:saved?.date || t("common.notProvided")}
    ])}

    ${unifiedFicheSections({
      summary: plant.summary,
      recognition: plant.recognition,
      photo: `<div id="localPhotoMount"><p>${safeText(t("photo.loading"))}</p></div>`,
      consumption: plant.cuisine,
      benefits: plant.tradition,
      care: plant.culture,
      precautions: plant.precautions,
      anecdote: plant.anecdote,
      linkedFiche: "",
      source: plant.source
    })}

    <div class="note-form">
      <p class="kicker">${t("plant.personalPage")}</p>
      ${locationFieldsMarkup(saved)}
      <input id="dateInput" type="date" value="${saved?.date || ""}">
      <textarea id="noteInput" placeholder="${t("plant.notes")}">${safeText(saved?.note || "")}</textarea>
      ${tagsEditorMarkup(saved)}
      <label class="photo-picker personal-photo-picker">
        <span>${t("plant.addPhoto")}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,.webp" onchange="addPersonalPhoto('${plant.id}', this)">
      </label>
      <button id="ficheSaveButton" class="danger" onclick="savePersonal('${plant.id}')">${t("plant.seal")}</button>
    </div>
  `;
  go("plantPage");
  hydrateLocalPhoto(id, plant);
  hydrateFicheMap(saved?.lat, saved?.lon);
}

async function hydrateLocalPhoto(id, plant){
  const mount = document.getElementById("localPhotoMount");
  if(!mount) return;
  if(activeLocalPhotoUrl){
    URL.revokeObjectURL(activeLocalPhotoUrl);
    activeLocalPhotoUrl = null;
  }
  try{
    const blob = await getObservationPhoto(id);
    if(blob){
      activeLocalPhotoUrl = URL.createObjectURL(blob);
      mount.innerHTML = `<div class="observation-photo"><img src="${activeLocalPhotoUrl}" alt="${safeText(t("photo.observationAlt", {name:plant.name}))}"><span>${t("photo.yours")}</span></div>`;
      return;
    }
  } catch{}
  mount.innerHTML = `<p>${safeText(t("plant.plateNote"))}</p>`;
}

async function addPersonalPhoto(id, input){
  const file = input?.files?.[0];
  if(!file) return;
  if(!isAcceptedImage(file)){
    showToast(t("error.format"));
    return;
  }
  input.value = "";
  showToast(t("photo.loading"));
  try{
    const prepared = await convertImageToJpeg(file);
    await storeObservationPhoto(id, prepared);
    if(!collection[id]){
      collection[id] = {place:"", date:"", note:"", createdAt:new Date().toISOString()};
    }
    collection[id].hasPersonalPhoto = true;
    saveCollection();
    if(typeof checkAchievements === "function") checkAchievements();
    showToast(t("plant.photoSaved"));
    if(currentPlantView?.type === "local" && currentPlantView.id === id){
      openPlant(id);
    }
  } catch{
    showToast(t("plant.photoFailed"));
  }
}

function refreshCurrentPlantView(){
  if(!document.getElementById("plantPage")?.classList.contains("active")) return;
  if(currentPlantView?.type === "local") openPlant(currentPlantView.id);
  if(currentPlantView?.type === "identification") openIdentifiedPlant(currentPlantView.id);
}

function toggleCollection(id){
  const wasSaved = collection[id];
  const previous = wasSaved ? { ...collection[id] } : null;
  if(wasSaved){
    delete collection[id];
  } else {
    collection[id] = {place:"", date:"", note:"", createdAt: new Date().toISOString()};
  }
  if(!saveCollection()){
    if(previous) collection[id] = previous; else delete collection[id];
    showToast(t("alert.saveFailed"), 5000);
    return;
  }
  if(!wasSaved && typeof checkAchievements === "function") checkAchievements();
  showToast(t(wasSaved ? "alert.pageRemoved" : "alert.pageAdded"));
  openPlant(id);
}

async function savePersonal(id){
  const previous = collection[id] ? { ...collection[id] } : null;
  const place = document.getElementById("placeInput").value;
  const date = document.getElementById("dateInput").value;
  const note = document.getElementById("noteInput").value;
  const tags = readTags();
  setFicheSaveBusy(true);
  const {lat, lon} = await coordinatesForEntry(place, readCoordInput("latInput"), readCoordInput("lonInput"));
  collection[id] = {
    ...previous,
    place,
    date,
    note,
    tags,
    lat,
    lon,
    createdAt: previous?.createdAt || new Date().toISOString()
  };
  if(!saveCollection()){
    if(previous) collection[id] = previous; else delete collection[id];
    setFicheSaveBusy(false);
    showToast(t("alert.saveFailed"), 5000);
    return;
  }
  if(typeof checkAchievements === "function") checkAchievements();
  showToast(t("alert.personalSaved"));
  openPlant(id);
}
