// Fiche plante (locale ou observée) : rendu, notes personnelles et photo d’observation.
let currentPlantView = null;
let activeObservationPhotoUrl = null;
const enrichmentRequests = new Set();

function valueOrTodo(value){
  return value && String(value).trim() ? value : t("common.complete");
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

function unifiedFicheSections(data){
  return `
    <div class="safety-box"><span>⚠️</span><div>${safeText(t("safety.disclaimer"))}</div></div>
    ${infoBlockMarkup(t("section.summary"), data.summary)}
    ${infoBlockMarkup(t("section.recognition"), data.recognition)}
    ${photoBlockMarkup(data.photo)}
    ${infoBlockMarkup(t("section.consumption"), data.consumption)}
    ${infoBlockMarkup(t("section.benefits"), data.benefits)}
    ${infoBlockMarkup(t("section.care"), data.care)}
    <div class="warning">⚠️ ${safeText(valueOrTodo(data.precautions))}</div>
    ${infoBlockMarkup(t("section.anecdote"), data.anecdote)}
    ${data.linkedFiche || ""}
    ${infoBlockMarkup(t("section.source"), data.source)}
  `;
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
      <button class="secondary" onclick="deleteIdentifiedPlant('${id}')">${t("common.remove")}</button>
    </div>

    <div class="plate">${plantPlateMarkup(entry)}</div>

    <p class="kicker">${t("plant.savedObservation")}</p>
    <h2>${safeText(entry.name)}</h2>
    <p class="latin">${safeText(entry.latin)}</p>

    <div class="badges">
      <span class="badge">Pl@ntNet</span>
      <span class="badge">${t("plant.confidence", {score:safeText(entry.score)})}</span>
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
      <input id="placeInput" placeholder="${t("plant.place")}" value="${safeText(entry.place || "")}">
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

function saveIdentifiedPersonal(id){
  const entry = collection[id];
  if(!entry || entry.type !== "identification") return;
  entry.place = document.getElementById("placeInput").value;
  entry.date = document.getElementById("dateInput").value;
  entry.note = document.getElementById("noteInput").value;
  saveCollection();
  renderPlants();
  showToast(t("alert.observationSaved"));
  openIdentifiedPlant(id);
}

function deleteIdentifiedPlant(id){
  if(!collection[id] || collection[id].type !== "identification") return;
  if(!confirm(t("confirm.remove"))) return;
  delete collection[id];
  deleteObservationPhoto(id).catch(() => {});
  saveCollection();
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
      <button class="secondary" onclick="toggleCollection('${plant.id}')">${t(saved ? "plant.inHerbarium" : "plant.addHerbarium")}</button>
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
      <input id="placeInput" placeholder="${t("plant.place")}" value="${safeText(saved?.place || "")}">
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
  if(collection[id]){
    delete collection[id];
    showToast(t("alert.pageRemoved"));
  } else {
    collection[id] = {place:"", date:"", note:""};
    showToast(t("alert.pageAdded"));
  }
  saveCollection();
  openPlant(id);
}

function savePersonal(id){
  collection[id] = {
    place: document.getElementById("placeInput").value,
    date: document.getElementById("dateInput").value,
    note: document.getElementById("noteInput").value
  };
  saveCollection();
  showToast(t("alert.personalSaved"));
  openPlant(id);
}
