// Identification photographique via Pl@ntNet : sélection des photos, appel API et résultats.
let previewUrls = [];
let selectedPlantFiles = [];
let currentPredictedOrgans = [];
let currentReliableIdentifications = [];
let currentObservationBlob = null;
const acceptedImageExtensions = new Set([
  "jpg", "jpeg", "png", "webp", "heic", "heif", "avif", "bmp"
]);
const minimumPlantNetScore = 0.2;

function showIdentifyError(message){
  const errorBox = document.getElementById("identifyError");
  errorBox.textContent = message;
  errorBox.classList.toggle("hidden", !message);
}

// Vide la sélection de photos du formulaire d'identification. Indispensable
// après une identification réussie, sinon un retour au formulaire relance
// l'identification sur les mêmes clichés.
function resetPhotoSelection(){
  previewUrls.forEach(url => URL.revokeObjectURL(url));
  previewUrls = [];
  selectedPlantFiles = [];
  const preview = document.getElementById("photoPreviews");
  if(preview) preview.innerHTML = "";
  const gallery = document.getElementById("plantPhotos");
  if(gallery) gallery.value = "";
  const camera = document.getElementById("plantCamera");
  if(camera) camera.value = "";
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
  const mimeType = String(file?.type || "").toLowerCase();
  const extension = fileExtension(file?.name);
  if(mimeType.startsWith("image/")) return true;
  if(acceptedImageExtensions.has(extension)) return true;
  return !mimeType && !extension && Number(file?.size || 0) > 0;
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
  try{
    return await convertImageToJpeg(file);
  } catch(error){
    if(isAcceptedImage(file)){
      file.grimoireServerSidePhoto = true;
      return file;
    }
    throw error;
  }
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

  // Hors ligne : on met l'observation en file d'attente au lieu d'échouer.
  if(!navigator.onLine && typeof queueObservation === "function"){
    await queueObservation();
    showToast(t("queue.queuedOffline"));
    return;
  }

  const formData = new FormData();
  showIdentifyError("");
  go("loading");

  try{
    const preparedFiles = await Promise.all(files.map(prepareImageForPlantNet));
    currentObservationBlob = preparedFiles.find(file => !file.grimoireServerSidePhoto) || null;
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
    // Photos vidées du formulaire : le blob d'observation reste conservé pour
    // l'enregistrement, mais un retour arrière ne relancera pas l'identification.
    resetPhotoSelection();
    go("result");
  } catch(error){
    if((!navigator.onLine || error instanceof TypeError) && typeof queueObservation === "function"){
      await queueObservation();
      go("identifier");
      showToast(t("queue.queuedOffline"), 5200);
      return;
    }
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
  // Détection de doublon : même nom scientifique déjà présent dans l'herbier.
  const duplicateId = Object.keys(collection).find(key => {
    const existing = collection[key];
    return existing?.type === "identification" && existing.shortLatin && entry.shortLatin &&
      existing.shortLatin.toLowerCase() === entry.shortLatin.toLowerCase();
  });
  if(duplicateId && !confirm(t("duplicate.confirm", {name: collection[duplicateId].name || entry.name}))){
    openIdentifiedPlant(duplicateId);
    return;
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

  if(!saveCollection()){
    delete collection[id];
    showToast(t("alert.saveFailed"), 5000);
    return;
  }
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
  if(typeof checkAchievements === "function") checkAchievements();
  showToast(t("alert.identificationSaved"));
  openIdentifiedPlant(id);
}
