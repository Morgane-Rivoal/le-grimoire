// Traitement differe des observations : les photos prises sans reseau sont
// conservees localement, puis envoyees a Pl@ntNet quand la connexion revient.
function currentPositionOnce(){
  return new Promise(resolve => {
    if(!("geolocation" in navigator)){
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => resolve({lat: position.coords.latitude, lon: position.coords.longitude}),
      () => resolve(null),
      {enableHighAccuracy:false, timeout:6000, maximumAge:60000}
    );
  });
}

async function refreshQueuePanel(){
  const panel = document.getElementById("queuePanel");
  const summary = document.getElementById("queueSummary");
  const processButton = document.getElementById("queueProcess");
  if(!panel || !summary) return;
  let count = 0;
  try{
    count = await countQueue();
  } catch{
    count = 0;
  }
  panel.classList.toggle("hidden", count === 0);
  if(count === 0) return;
  summary.textContent = navigator.onLine
    ? t("queue.summary", {count})
    : t("queue.summaryOffline", {count});
  if(processButton) processButton.disabled = !navigator.onLine;
}

async function queueObservation(){
  const files = selectedPlantFiles.slice(0, 5);
  if(!files.length){
    showIdentifyError(t("error.noPhoto"));
    return;
  }
  if(files.some(file => !isAcceptedImage(file))){
    showIdentifyError(t("error.format"));
    return;
  }
  showIdentifyError("");
  const queueButton = document.getElementById("queueButton");
  if(queueButton) queueButton.disabled = true;
  try{
    const prepared = await Promise.all(files.map(prepareImageForPlantNet));
    const position = await currentPositionOnce();
    await enqueueObservation({
      blobs: prepared,
      place: "",
      lat: position?.lat,
      lon: position?.lon,
      createdAt: new Date().toISOString()
    });
    resetPhotoSelection();
    showToast(t("queue.added"));
    await refreshQueuePanel();
  } catch{
    showIdentifyError(t("queue.error"));
  } finally {
    if(queueButton) queueButton.disabled = false;
  }
}

async function saveQueuedResult(result, meta){
  const species = result.species || {};
  const entry = {
    name: species.commonNames?.[0] || species.scientificNameWithoutAuthor || t("result.unknownSpecies"),
    latin: species.scientificName || species.scientificNameWithoutAuthor || "",
    shortLatin: species.scientificNameWithoutAuthor || species.scientificName || "",
    family: species.family?.scientificNameWithoutAuthor || species.family?.scientificName || "",
    score: Math.round((Number(result.score) || 0) * 100),
    imageUrl: resultImage(result) || result?.enrichment?.imageUrl || "",
    enrichment: result?.enrichment || null,
    flowering: result?.enrichment?.flowering || "",
    height: result?.enrichment?.height || ""
  };
  const localPlant = findLocalPlant(species);
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
    flowering: entry.flowering,
    height: entry.height,
    organ: "",
    autoProfileVersion: 7,
    edibility: profile.edibility,
    safetyStatus: profile.status,
    summary: profile.summary,
    benefits: profile.benefits,
    care: profile.care,
    precautions: profile.precautions,
    botanicalNote,
    localPlantId: localPlant?.id || "",
    place: meta.place || "",
    lat: meta.lat,
    lon: meta.lon,
    date: new Date().toISOString().slice(0,10),
    note: "",
    createdAt: new Date().toISOString(),
    source: t("queue.source"),
    knowledgeSource: profile.source
  };
  saveCollection();

  if(meta.observationBlob){
    try{
      await storeObservationPhoto(id, meta.observationBlob);
      collection[id].hasObservationPhoto = true;
      saveCollection();
    } catch{
      collection[id].hasObservationPhoto = false;
    }
  }
  return id;
}

function queuedPhotoFilename(blob, index){
  const type = String(blob?.type || "").toLowerCase();
  if(type.includes("png")) return `queue-${index}.png`;
  if(type.includes("webp")) return `queue-${index}.webp`;
  if(type.includes("heic")) return `queue-${index}.heic`;
  if(type.includes("heif")) return `queue-${index}.heif`;
  if(type.includes("avif")) return `queue-${index}.avif`;
  return `queue-${index}.jpg`;
}

async function prepareQueuedPhotoForUpload(blob, index){
  const fallbackName = queuedPhotoFilename(blob, index);
  const file = blob instanceof File
    ? blob
    : new File([blob], fallbackName, {type: blob?.type || "application/octet-stream"});
  try{
    return await convertImageToJpeg(file);
  } catch{
    try{
      const formData = new FormData();
      formData.append("image", file, file.name || fallbackName);
      const response = await fetch("/api/photo-preview", {method:"POST", body:formData});
      if(response.ok){
        const previewBlob = await response.blob();
        const baseName = String(file.name || fallbackName).replace(/\.[^.]+$/, "") || `queue-${index}`;
        return new File([previewBlob], `${baseName}.jpg`, {type: previewBlob.type || "image/jpeg"});
      }
    } catch{}
    return new File([blob], file.name || fallbackName, {type: file.type || blob?.type || "application/octet-stream"});
  }
}

async function processQueue(){
  if(!navigator.onLine){
    showToast(t("queue.offline"));
    return;
  }
  const items = await getQueue().catch(() => []);
  if(!items.length){
    await refreshQueuePanel();
    return;
  }
  const processButton = document.getElementById("queueProcess");
  if(processButton) processButton.disabled = true;

  let processed = 0;
  let failed = 0;
  let lastError = "";

  for(const item of items){
    const blobs = Array.isArray(item.value?.blobs) ? item.value.blobs : [];
    if(!blobs.length){
      await deleteQueueItem(item.key);
      continue;
    }
    try{
      const preparedBlobs = await Promise.all(blobs.map(prepareQueuedPhotoForUpload));
      const formData = new FormData();
      preparedBlobs.forEach((blob, index) => {
        formData.append("images", blob, blob.name || queuedPhotoFilename(blob, index));
        formData.append("organs", "auto");
      });

      const response = await fetch(`/api/identify?lang=${encodeURIComponent(currentLocale)}`, {method:"POST", body:formData});
      const data = await response.json().catch(() => ({}));
      if(!response.ok){
        failed++;
        lastError = data.error || t("error.identification");
        continue;
      }
      if(!Array.isArray(data.results) || !data.results.length){
        failed++;
        lastError = t("error.noSpecies");
        continue;
      }

      const best = data.results.find(result => Number(result.score) >= minimumPlantNetScore) || data.results[0];
      if(!best){
        failed++;
        lastError = t("error.noSpecies");
        continue;
      }

      let place = item.value.place || "";
      if(!place && Number.isFinite(Number(item.value.lat))){
        place = await resolvePlaceName(item.value.lat, item.value.lon);
      }
      await saveQueuedResult(best, {
        observationBlob: preparedBlobs[0] || blobs[0],
        lat: item.value.lat,
        lon: item.value.lon,
        place
      });
      await deleteQueueItem(item.key);
      processed++;
    } catch{
      failed++;
      lastError = t("queue.processFailed");
    }
  }

  if(processButton) processButton.disabled = false;
  if(typeof renderPlants === "function") renderPlants();
  if(typeof renderCollection === "function") renderCollection();
  if(processed && typeof checkAchievements === "function") checkAchievements();
  await refreshQueuePanel();

  if(processed && failed){
    showToast(t("queue.partial", {count:processed, failed}), 6200);
  } else if(processed){
    showToast(t("queue.done", {count:processed}));
  } else {
    showToast(lastError ? t("queue.failedDetail", {reason:lastError}) : t("queue.noneProcessed"), 7200);
  }
}

window.addEventListener("online", refreshQueuePanel);
window.addEventListener("offline", refreshQueuePanel);
