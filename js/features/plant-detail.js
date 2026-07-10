// Fiche plante (locale ou observée) : rendu, notes personnelles et photo d’observation.
let currentPlantView = null;
let activeObservationPhotoUrl = null;
const enrichmentRequests = new Set();

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
  if(lat === "" || lon === "" || lat === undefined || lon === undefined || Number.isNaN(lat) || Number.isNaN(lon)){
    return "";
  }
  const delta = 0.01;
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
  return `
    <div class="observation-map">
      <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${safeText(bbox)}&marker=${safeText(lat)}%2C${safeText(lon)}" loading="lazy" title="${safeText(t("plant.mapTitle"))}"></iframe>
      <a href="${safeText(osmUrl)}" target="_blank" rel="noopener noreferrer">${t("plant.viewOnMap")}</a>
    </div>
  `;
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
      if(mapMount) mapMount.innerHTML = locationMapMarkup(lat, lon);
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

  mount.innerHTML = `
    <div class="topbar">
      <button class="back" onclick="goBack('herbier')" aria-label="Retour">‹</button>
      <div class="topbar-actions">
        <button class="icon-button" onclick="shareIdentifiedPlant('${id}')" aria-label="${t("action.share")}">🔗</button>
        <button class="secondary" onclick="deleteIdentifiedPlant('${id}')">${t("common.remove")}</button>
      </div>
    </div>

    <div class="plate">${plantPlateMarkup(entry)}</div>

    <p class="kicker">${t("plant.savedObservation")}</p>
    <h2>${safeText(entry.name)}</h2>
    <p class="latin">${safeText(entry.latin)}</p>

    <div class="badges">
      <span class="badge">Pl@ntNet</span>
      <span class="badge ${profile.status === "toxique" || profile.status === "prudence" || profile.status === "inconnu" ? "red" : ""}">${safeText(profile.edibility)}</span>
      <span class="badge">${safeText(entry.family)}</span>
    </div>

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
      <button class="danger" onclick="saveIdentifiedPersonal('${id}')">${t("common.save")}</button>
    </div>
  `;
  go("plantPage");
  hydrateObservationPhoto(id, entry);
  refreshMissingEnrichment(id, entry);
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
  if(!mount) return;
  if(activeObservationPhotoUrl){
    URL.revokeObjectURL(activeObservationPhotoUrl);
    activeObservationPhotoUrl = null;
  }
  try{
    const blob = await getObservationPhoto(id);
    if(blob){
      activeObservationPhotoUrl = URL.createObjectURL(blob);
      mount.innerHTML = `<div class="observation-photo"><img src="${activeObservationPhotoUrl}" alt="${safeText(t("photo.observationAlt", {name:entry.name}))}"><span>${t("photo.yours")}</span></div>`;
      return;
    }
  } catch{}
  mount.innerHTML = entry.imageUrl
    ? `<div class="observation-photo"><img src="${safeText(entry.imageUrl)}" alt="${safeText(t("photo.compareAlt", {name:entry.name}))}"><span>${t("photo.reference")}</span></div>`
    : `<p>${safeText(t("photo.none"))}</p>`;
}

async function saveIdentifiedPersonal(id){
  const entry = collection[id];
  if(!entry || entry.type !== "identification") return;
  const place = document.getElementById("placeInput").value;
  const {lat, lon} = await coordinatesForEntry(place, readCoordInput("latInput"), readCoordInput("lonInput"));
  entry.place = place;
  entry.date = document.getElementById("dateInput").value;
  entry.note = document.getElementById("noteInput").value;
  entry.lat = lat;
  entry.lon = lon;
  if(!saveCollection()){
    showToast(t("alert.saveFailed"), 5000);
    return;
  }
  renderPlants();
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
      photo: `<p>${safeText(t("plant.plateNote"))}</p>`,
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
      <div class="personal-photo">${t("plant.personalPhotoSoon")}</div>
      <button class="danger" onclick="savePersonal('${plant.id}')">${t("plant.seal")}</button>
    </div>
  `;
  go("plantPage");
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
  showToast(t(wasSaved ? "alert.pageRemoved" : "alert.pageAdded"));
  openPlant(id);
}

async function savePersonal(id){
  const previous = collection[id] ? { ...collection[id] } : null;
  const place = document.getElementById("placeInput").value;
  const {lat, lon} = await coordinatesForEntry(place, readCoordInput("latInput"), readCoordInput("lonInput"));
  collection[id] = {
    place,
    date: document.getElementById("dateInput").value,
    note: document.getElementById("noteInput").value,
    lat,
    lon,
    createdAt: previous?.createdAt || new Date().toISOString()
  };
  if(!saveCollection()){
    if(previous) collection[id] = previous; else delete collection[id];
    showToast(t("alert.saveFailed"), 5000);
    return;
  }
  showToast(t("alert.personalSaved"));
  openPlant(id);
}
