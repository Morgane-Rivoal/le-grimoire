// Logique applicative : navigation, recherche, identification Pl@ntNet et herbier.
let currentFilter = "all";
let herbariumFilter = "all";
let collection = loadCollection();
let currentReliableIdentifications = [];
let currentPlantView = null;
let currentObservationBlob = null;
let activeObservationPhotoUrl = null;
const enrichmentRequests = new Set();
let currentScreenId = "cover";
let plantRenderTimer = null;
let collectionRenderTimer = null;
let toastTimer = null;
const screenScrollPositions = new Map();

function loadCollection(){
  try{
    const saved = JSON.parse(localStorage.getItem("grimoire-v020-collection") || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch{
    return {};
  }
}

function saveCollection(){
  localStorage.setItem("grimoire-v020-collection", JSON.stringify(collection));
}

function showToast(message, duration = 3200){
  const toast = document.getElementById("grimoireToast");
  if(!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove("hidden");
  toastTimer = setTimeout(() => toast.classList.add("hidden"), duration);
}

function go(id){
  screenScrollPositions.set(currentScreenId, window.scrollY);
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(id);
  if(!target) return;
  target.classList.add("active");
  currentScreenId = id;
  const nav = document.getElementById("bottomNav");
  nav.classList.toggle("hidden", ["cover","preface","sommaire","loading"].includes(id));
  document.querySelectorAll("#bottomNav button").forEach(b => b.classList.remove("active"));
  if(id==="explorer") document.querySelectorAll("#bottomNav button")[0].classList.add("active");
  if(id==="identifier") document.querySelectorAll("#bottomNav button")[1].classList.add("active");
  if(id==="herbier") document.querySelectorAll("#bottomNav button")[2].classList.add("active");
  if(id==="parametres") document.querySelectorAll("#bottomNav button")[3].classList.add("active");
  if(id==="explorer") renderPlants();
  if(id==="herbier") renderCollection();
  const restorePosition = ["explorer", "herbier"].includes(id);
  requestAnimationFrame(() => window.scrollTo({
    top: restorePosition ? screenScrollPositions.get(id) || 0 : 0,
    behavior:"auto"
  }));
}

function schedulePlantRender(){
  clearTimeout(plantRenderTimer);
  plantRenderTimer = setTimeout(renderPlants, 140);
}

function scheduleCollectionRender(){
  clearTimeout(collectionRenderTimer);
  collectionRenderTimer = setTimeout(renderCollection, 140);
}

function setFilter(filter){
  currentFilter = filter;
  document.querySelectorAll(".chip[data-filter]").forEach(chip => chip.classList.toggle("active", chip.dataset.filter === filter));
  renderPlants();
}

function setHerbariumFilter(filter){
  herbariumFilter = filter;
  document.querySelectorAll(".herbarium-chip").forEach(chip =>
    chip.classList.toggle("active", chip.dataset.herbariumFilter === filter)
  );
  renderCollection();
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

let previewUrls = [];
let selectedPlantFiles = [];
let currentPredictedOrgans = [];
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const minimumPlantNetScore = 0.2;

function showIdentifyError(message){
  const errorBox = document.getElementById("identifyError");
  errorBox.textContent = message;
  errorBox.classList.toggle("hidden", !message);
}

function previewPhotos(inputId = "plantPhotos"){
  const input = document.getElementById(inputId);
  const preview = document.getElementById("photoPreviews");
  const incomingFiles = Array.from(input?.files || []);
  const proposedFiles = selectedPlantFiles.concat(incomingFiles);
  selectedPlantFiles = proposedFiles.slice(0, 5);
  if(input) input.value = "";

  previewUrls.forEach(url => URL.revokeObjectURL(url));
  previewUrls = [];
  preview.innerHTML = "";
  showIdentifyError("");

  if(proposedFiles.length > 5){
    showIdentifyError(t("error.maxPhotos"));
  }

  selectedPlantFiles.forEach(file => {
    const url = URL.createObjectURL(file);
    previewUrls.push(url);
    const card = document.createElement("div");
    card.className = "photo-preview";
    const image = document.createElement("img");
    image.src = url;
    image.alt = t("photo.selectedAlt");
    card.appendChild(image);
    preview.appendChild(card);
  });
}

function fileExtension(name){
  const match = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function isAcceptedImage(file){
  return acceptedImageTypes.includes(file.type) || fileExtension(file.name) === "webp";
}

function convertImageToJpeg(file){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      const maximumSide = 2000;
      const scale = Math.min(1, maximumSide / Math.max(sourceWidth, sourceHeight));
      canvas.width = Math.round(sourceWidth * scale);
      canvas.height = Math.round(sourceHeight * scale);
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if(!blob){
          reject(new Error(t("error.convert")));
          return;
        }
        const baseName = file.name.replace(/\.[^.]+$/, "") || "photo-plante";
        resolve(new File([blob], `${baseName}.jpg`, {type:"image/jpeg"}));
      }, "image/jpeg", 0.88);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(t("error.read")));
    };
    image.src = url;
  });
}

async function prepareImageForPlantNet(file){
  return convertImageToJpeg(file);
}

function safeText(value){
  return String(value || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function resultImage(result){
  const candidate = result?.images?.[0]?.url;
  const url = candidate?.m || candidate?.o || candidate?.s || "";
  return /^https:\/\//i.test(url) ? url : "";
}

function findLocalPlant(species){
  const scientific = (species?.scientificNameWithoutAuthor || "").toLowerCase();
  return plants.find(plant => plant.latin.toLowerCase().startsWith(scientific));
}

function fallbackKnowledge(entry){
  return {
    edibility:t("knowledge.fallback.edibility"),
    status:"inconnu",
    summary:t("knowledge.fallback.summary", {name:entry.name || t("image.observation")}),
    benefits:t("knowledge.fallback.benefits"),
    care:t("knowledge.fallback.care"),
    precautions:t("knowledge.fallback.precautions"),
    source:t("knowledge.fallback.source")
  };
}

function knowledgeForSpecies(entry, localPlant){
  if(localPlant){
    const plant = localizedPlant(localPlant);
    return mergeEnrichment({
      edibility: plant.status === "comestible" ? t("status.edible") : t("status.caution"),
      status: plant.status,
      summary: plant.summary,
      benefits: plant.tradition,
      care: plant.culture,
      precautions: plant.precautions,
      note: plant.anecdote,
      source: plant.source
    }, entry);
  }

  const haystack = `${entry.name} ${entry.latin} ${entry.shortLatin} ${entry.family}`.toLowerCase();
  const plantProfile = plantKnowledgeProfiles.find(profile =>
    profile.match.some(value => haystack.includes(value))
  );
  if(plantProfile) return mergeEnrichment(localizedKnowledge(plantProfile), entry);

  const familyProfile = familyKnowledgeProfiles.find(profile =>
    profile.match.some(value => haystack.includes(value))
  );
  const profile = familyProfile ? localizedKnowledge(familyProfile) : fallbackKnowledge(entry);
  return mergeEnrichment(profile, entry);
}

function mergeEnrichment(profile, entry){
  const enrichment = entry?.enrichment;
  if(!enrichment) return profile;
  const mentionsToxicity = /tox|poison/i.test(enrichment.safetyNote || "");
  const mentionsFoodUse = /comest|edible|alimentaire|consum/i.test(enrichment.safetyNote || "");
  const genericStatus = profile.status === "inconnu";
  return {
    ...profile,
    edibility: genericStatus && mentionsToxicity
      ? t("status.toxicityReported")
      : genericStatus && mentionsFoodUse
      ? t("status.foodUseReported")
      : profile.edibility,
    status: genericStatus && (mentionsToxicity || mentionsFoodUse) ? "prudence" : profile.status,
    consumption: enrichment.safetyNote || profile.edibility,
    summary: enrichment.summary || profile.summary,
    source: enrichment.sourceLabel
      ? `${profile.source} ${enrichment.sourceLabel}.`
      : profile.source
  };
}

function botanicalNoteFor(entry, profile, localPlant){
  if(localPlant?.anecdote) return localPlant.anecdote;
  if(profile?.note) return profile.note;

  const haystack = `${entry.name || ""} ${entry.latin || ""} ${entry.shortLatin || ""} ${entry.family || ""}`.toLowerCase();

  if(haystack.includes("orchid") || haystack.includes("orchidée") || haystack.includes("orchidee")){
    return t("note.orchid");
  }
  if(haystack.includes("lilium") || haystack.includes(" lis ") || haystack.startsWith("lis ")){
    return t("note.lily");
  }
  if(haystack.includes("hydrangea") || haystack.includes("hortensia")){
    return t("note.hydrangea");
  }
  if(haystack.includes("araceae") || haystack.includes("aracée") || haystack.includes("aracées")){
    return t("note.araceae");
  }
  if(haystack.includes("lamiaceae") || haystack.includes("lamiacée") || haystack.includes("lamiacées")){
    return t("note.lamiaceae");
  }
  if(haystack.includes("apiaceae") || haystack.includes("apiacée") || haystack.includes("apiacées")){
    return t("note.apiaceae");
  }
  if(haystack.includes("asteraceae") || haystack.includes("astéracée") || haystack.includes("astéracées")){
    return t("note.asteraceae");
  }
  if(haystack.includes("rosaceae") || haystack.includes("rosacée") || haystack.includes("rosacées")){
    return t("note.rosaceae");
  }
  if(haystack.includes("poaceae") || haystack.includes("poacée") || haystack.includes("graminée")){
    return t("note.poaceae");
  }
  if(haystack.includes("brassicaceae") || haystack.includes("brassicacée")){
    return t("note.brassicaceae");
  }
  if(haystack.includes("solanaceae") || haystack.includes("solanacée")){
    return t("note.solanaceae");
  }

  if(haystack.includes("pinaceae") || haystack.includes("picea") || haystack.includes("pinus") || haystack.includes("abies") || haystack.includes("epicea") || haystack.includes("sapin") || haystack.includes("pin ")){
    return t("note.pinaceae");
  }

  const family = valueOrTodo(entry.family);
  return t("note.generic", {name:entry.name || t("image.observation"), family});
}

function recognitionTextFor(entry, localPlant, profile){
  if(localPlant?.recognition) return localPlant.recognition;
  if(profile?.recognition) return profile.recognition;
  if(entry?.enrichment?.recognition){
    return entry.enrichment.recognition;
  }
  const haystack = `${entry.name || ""} ${entry.latin || ""} ${entry.shortLatin || ""} ${entry.family || ""}`.toLowerCase();
  if(haystack.includes("pinaceae") || haystack.includes("picea") || haystack.includes("pinus") || haystack.includes("abies") || haystack.includes("epicea") || haystack.includes("sapin") || haystack.includes("pin ")){
    return t("recognition.conifer", {score:entry.score || "—"});
  }
  return t("recognition.generic", {score:entry.score || "—"});
}

function renderIdentificationResults(results){
  const mount = document.getElementById("identificationResults");
  mount.innerHTML = "";
  const reliableResults = results
    .filter(result => Number(result.score) >= minimumPlantNetScore)
    .slice(0,3);
  currentReliableIdentifications = reliableResults;

  if(!reliableResults.length){
    mount.innerHTML = `
      <article class="identification-choice no-result">
        <div>
          <span class="badge red">${t("result.uncertain")}</span>
          <h3>${t("result.none")}</h3>
          <p>${t("result.noneHelp")}</p>
        </div>
      </article>
    `;
    return;
  }

  reliableResults.forEach((result, index) => {
    const species = result.species || {};
    const commonName = species.commonNames?.[0] || t("result.frenchUnavailable");
    const scientificName = species.scientificName || species.scientificNameWithoutAuthor || t("result.unknownSpecies");
    const family = species.family?.scientificNameWithoutAuthor || species.family?.scientificName || "";
    const score = Math.round((Number(result.score) || 0) * 100);
    const localPlant = findLocalPlant(species);
    const visualEntry = {
      name: commonName,
      latin: scientificName,
      shortLatin: species.scientificNameWithoutAuthor || scientificName,
      family
    };
    const profile = knowledgeForSpecies({
      name: commonName,
      latin: scientificName,
      shortLatin: species.scientificNameWithoutAuthor || scientificName,
      family,
      enrichment: result.enrichment || null
    }, localPlant);
    const resultHeight = profile.height || result.enrichment?.height || "";
    const resultFlowering = profile.flowering || result.enrichment?.flowering || "";
    const card = document.createElement("article");
    card.className = "identification-choice";
    card.innerHTML = `
      <div class="identification-plate">${plantPlateMarkup(visualEntry)}</div>
      <div>
        <span class="badge">${t("result.proposal", {number: index + 1})}</span>
        <h3>${safeText(commonName)}</h3>
        <p class="latin">${safeText(scientificName)}</p>
        ${family ? `<p class="small-note">${safeText(family)}</p>` : ""}
        <p class="score">${t("result.confidence", {score})}</p>
        ${resultHeight || resultFlowering ? `
          <div class="result-facts">
            ${resultHeight ? `<span><strong>${t("field.height")}</strong>${safeText(resultHeight)}</span>` : ""}
            ${resultFlowering ? `<span><strong>${t("field.flowering")}</strong>${safeText(resultFlowering)}</span>` : ""}
          </div>
        ` : ""}
        <p class="small-note">${safeText(profile.summary)}</p>
        <p class="small-note"><strong>${t("result.remember")}</strong> ${safeText(profile.edibility)}</p>
        <button class="danger" onclick="saveIdentifiedPlant(${index})">${t("result.save")}</button>
        <details class="correction-panel">
          <summary>${t("result.correctBeforeSave")}</summary>
          <input id="correctName-${index}" value="${safeText(commonName)}" placeholder="${t("field.commonName")}">
          <input id="correctLatin-${index}" value="${safeText(scientificName)}" placeholder="${t("field.latinName")}">
          <button class="secondary" onclick="saveIdentifiedPlant(${index}, true)">${t("result.saveCorrection")}</button>
        </details>
        ${localPlant ? `<button class="secondary" onclick="openPlant('${localPlant.id}')">${t("result.openLocal")}</button>` : ""}
      </div>
    `;
    mount.appendChild(card);
  });
}

async function observePlant(event){
  event.preventDefault();
  const files = selectedPlantFiles.slice(0, 5);

  if(!files.length){
    showIdentifyError(t("error.noPhoto"));
    return;
  }
  if(files.length > 5){
    showIdentifyError(t("error.maxPhotos"));
    return;
  }
  if(files.some(file => !isAcceptedImage(file))){
    showIdentifyError(t("error.format"));
    return;
  }

  const formData = new FormData();
  showIdentifyError("");
  go("loading");

  try{
    const preparedFiles = await Promise.all(files.map(prepareImageForPlantNet));
    currentObservationBlob = preparedFiles[0] || null;
    preparedFiles.forEach(file => {
      formData.append("images", file, file.name);
      formData.append("organs", "auto");
    });

    const response = await fetch(`/api/identify?lang=${encodeURIComponent(currentLocale)}`, {method:"POST", body:formData});
    const data = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(data.error || t("error.identification"));
    if(!Array.isArray(data.results) || !data.results.length){
      throw new Error(t("error.noSpecies"));
    }
    currentPredictedOrgans = Array.isArray(data.predictedOrgans) ? data.predictedOrgans : [];
    renderIdentificationResults(data.results);
    go("result");
  } catch(error){
    go("identifier");
    showIdentifyError(
      location.protocol === "file:"
        ? t("error.localServer")
        : error.message
    );
  }
}

function speciesFromResult(result){
  const species = result?.species || {};
  return {
    name: species.commonNames?.[0] || species.scientificNameWithoutAuthor || "Plante non nommée",
    latin: species.scientificName || species.scientificNameWithoutAuthor || "Nom scientifique non disponible",
    shortLatin: species.scientificNameWithoutAuthor || species.scientificName || "",
    family: species.family?.scientificNameWithoutAuthor || species.family?.scientificName || "Famille non disponible",
    score: Math.round((Number(result?.score) || 0) * 100),
    imageUrl: resultImage(result) || result?.enrichment?.imageUrl || "",
    enrichment: result?.enrichment || null,
    gbifId: result?.gbif?.id || "",
    powoId: result?.powo?.id || "",
    flowering: result?.enrichment?.flowering || "",
    height: result?.enrichment?.height || "",
    organ: currentPredictedOrgan()
  };
}

function currentPredictedOrgan(){
  return currentPredictedOrgans
    .map(item => item?.organ)
    .filter(Boolean)
    .join(", ");
}

async function saveIdentifiedPlant(index, useCorrection = false){
  const result = currentReliableIdentifications[index];
  if(!result) return;

  const entry = speciesFromResult(result);
  if(useCorrection){
    const correctedName = document.getElementById(`correctName-${index}`)?.value?.trim();
    const correctedLatin = document.getElementById(`correctLatin-${index}`)?.value?.trim();
    if(correctedName) entry.name = correctedName;
    if(correctedLatin){
      entry.latin = correctedLatin;
      entry.shortLatin = correctedLatin;
    }
  }
  const localPlant = findLocalPlant(result.species);
  const profile = knowledgeForSpecies(entry, localPlant);
  const botanicalNote = botanicalNoteFor(entry, profile, localPlant);
  const id = `identification-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  collection[id] = {
    type: "identification",
    name: entry.name,
    latin: entry.latin,
    shortLatin: entry.shortLatin,
    family: entry.family,
    score: entry.score,
    imageUrl: entry.imageUrl,
    enrichment: entry.enrichment,
    gbifId: entry.gbifId,
    powoId: entry.powoId,
    flowering: entry.flowering,
    height: entry.height,
    organ: entry.organ,
    autoProfileVersion: 7,
    edibility: profile.edibility,
    safetyStatus: profile.status,
    summary: profile.summary,
    benefits: profile.benefits,
    care: profile.care,
    precautions: profile.precautions,
    botanicalNote,
    localPlantId: localPlant?.id || "",
    place: "",
    date: new Date().toISOString().slice(0,10),
    note: "",
    createdAt: new Date().toISOString(),
    source: "Pl@ntNet",
    knowledgeSource: profile.source
  };

  saveCollection();
  if(currentObservationBlob){
    try{
      await storeObservationPhoto(id, currentObservationBlob);
      collection[id].hasObservationPhoto = true;
      saveCollection();
    } catch{
      collection[id].hasObservationPhoto = false;
    }
  }
  renderPlants();
  showToast(t("alert.identificationSaved"));
  openIdentifiedPlant(id);
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
      <button class="back" onclick="go('herbier')">‹</button>
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

function openPlant(id){
  const sourcePlant = plants.find(p => p.id === id);
  if(!sourcePlant) return;
  const plant = localizedPlant(sourcePlant);
  currentPlantView = {type:"local", id};
  const saved = collection[id];
  const mount = document.getElementById("plantMount");
  mount.innerHTML = `
    <div class="topbar">
      <button class="back" onclick="go('explorer')">‹</button>
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
      profile.summary,
      profile.benefits,
      profile.edibility
    ].join(" ").toLowerCase();
    const status = profile.status || entry.safetyStatus || "inconnu";
    const medicinal = /médicin|medicin|tradition|infusion|usage/i.test(`${profile.benefits || ""} ${profile.summary || ""}`);
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
    entry?.note
  ].join(" ").toLowerCase();
  const medicinal = /médicin|medicin|tradition|infusion|usage/i.test(`${plant.tradition || ""} ${plant.summary || ""}`);
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
  const ids = Object.keys(collection).filter(id => herbariumEntryMatches(id, collection[id], query));
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
          <span class="badge">${safeText(personal.score)} %</span>
          <span class="badge ${profile.status === "comestible" ? "" : "red"}">${safeText(profile.edibility || t("status.unknown"))}</span>
        </div>
        <p class="small-note">${safeText(personal.place || t("plant.placeMissing"))}</p>
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
    `;
    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
}

window.addEventListener("beforeunload", () => {
  previewUrls.forEach(url => URL.revokeObjectURL(url));
  if(activeObservationPhotoUrl) URL.revokeObjectURL(activeObservationPhotoUrl);
});

translateDocument();
renderPlants();
renderCollection();
