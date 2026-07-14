// Carte des découvertes : place sur une carte interactive (Leaflet) chaque
// plante de l'herbier disposant de coordonnées, avec retour vers sa fiche.
let discoveryMap = null;
let discoveryMarkers = null;
let userLocationMarker = null;
let mapFilter = "all";

function setMapFilter(filter){
  mapFilter = ["all", "edible", "toxic", "medicinal", "verified"].includes(filter) ? filter : "all";
  document.querySelectorAll(".map-filter-chip").forEach(chip =>
    chip.classList.toggle("active", chip.dataset.mapFilter === mapFilter)
  );
  renderDiscoveryMap();
}

function mapEntryCategory(entry, plant, profile){
  const status = profile?.status || entry?.safetyStatus || plant?.status || "inconnu";
  const text = [
    profile?.benefits,
    profile?.summary,
    plant?.tradition,
    plant?.summary,
    entry?.benefits,
    entry?.summary
  ].join(" ");
  const medicinal = typeof isMedicinalText === "function" ? isMedicinalText(text) : /médicin|medicin|infusion|tisane/i.test(text);
  const verify = entry?.type === "identification" && (entry.needsVerification || Number(entry.score || 0) < 50);
  const toxic = status === "toxique" || /toxique|toxic|ne pas consommer|do not consume/i.test(`${profile?.edibility || ""} ${entry?.edibility || ""}`);
  const edible = status === "comestible";
  const verified = !verify && status !== "inconnu";
  return {status, medicinal, verify, toxic, edible, verified};
}

function mapEntryMatchesFilter(item){
  if(mapFilter === "all") return true;
  if(mapFilter === "edible") return item.category.edible;
  if(mapFilter === "toxic") return item.category.toxic || item.category.status === "toxique";
  if(mapFilter === "medicinal") return item.category.medicinal;
  if(mapFilter === "verified") return item.category.verified;
  return true;
}

function mapPinClass(item){
  if(item.category.verify) return "verify";
  if(item.category.toxic) return "toxic";
  if(item.category.edible) return "edible";
  if(item.category.medicinal) return "medicinal";
  return "caution";
}

function mapPinSymbol(item){
  if(item.category.verify) return "？";
  if(item.category.toxic) return "☠";
  if(item.category.edible) return "🍽";
  if(item.category.medicinal) return "✚";
  return "🌿";
}

function mapFilterDefinitions(){
  return [
    {key:"all", label:t("map.filterAll"), match:() => true},
    {key:"edible", label:t("map.filterEdible"), match:item => item.category.edible},
    {key:"medicinal", label:t("map.filterMedicinal"), match:item => item.category.medicinal},
    {key:"toxic", label:t("map.filterToxic"), match:item => item.category.toxic || item.category.status === "toxique"},
    {key:"verified", label:t("map.filterVerified"), match:item => item.category.verified}
  ];
}

function updateMapFilterCounts(allEntries){
  const filters = mapFilterDefinitions();
  document.querySelectorAll(".map-filter-chip").forEach(chip => {
    const definition = filters.find(item => item.key === chip.dataset.mapFilter);
    if(!definition) return;
    const count = allEntries.filter(definition.match).length;
    chip.textContent = `${definition.label} · ${count}`;
  });
}

function renderVisibleMapList(entries){
  const mount = document.getElementById("mapVisibleList");
  if(!mount) return;
  if(!entries.length){
    mount.innerHTML = "";
    return;
  }
  mount.innerHTML = `
    <p class="section-title">${safeText(t("map.visibleTitle"))}</p>
    <div class="map-entry-list">
      ${entries.slice(0, 12).map(item => `
        <button type="button" class="map-entry-row" onclick="${item.type === "identification" ? `openIdentifiedPlant('${item.id}')` : `openPlant('${item.id}')`}">
          <span class="map-entry-icon map-entry-icon-${safeText(mapPinClass(item))}">${safeText(mapPinSymbol(item))}</span>
          <span>
            <strong>${safeText(item.name)}</strong>
            <small>${safeText(item.place || t("plant.placeMissing"))}${item.date ? ` · ${safeText(item.date)}` : ""}</small>
          </span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderMapOutingHighlights(entries){
  const mount = document.getElementById("mapOutingHighlights");
  if(!mount) return;
  if(typeof buildOutingGroups !== "function"){
    mount.innerHTML = "";
    return;
  }
  const groups = buildOutingGroups(entries);
  if(!groups.length){
    mount.innerHTML = "";
    return;
  }
  mount.innerHTML = `
    <p class="section-title">${safeText(t("outings.latest"))}</p>
    <div class="outing-mini-list">
      ${groups.slice(0, 3).map(group => `
        <button type="button" class="outing-mini-card" onclick="go('sorties')">
          <span>${safeText(group.icon)}</span>
          <strong>${safeText(group.title)}</strong>
          <small>${safeText(t("outings.count", {count:group.items.length}))}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function saveMapView(){
  if(!discoveryMap) return;
  try{
    const center = discoveryMap.getCenter();
    localStorage.setItem("grimoire-map-view", JSON.stringify({lat:center.lat, lon:center.lng, zoom:discoveryMap.getZoom()}));
  } catch{}
}

function loadMapView(){
  try{
    const saved = JSON.parse(localStorage.getItem("grimoire-map-view") || "null");
    if(saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lon) && Number.isFinite(saved.zoom)) return saved;
  } catch{}
  return null;
}

function locateOnMap(){
  if(!discoveryMap || !("geolocation" in navigator)){
    showToast(t("plant.locationUnavailable"));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    position => {
      const point = [position.coords.latitude, position.coords.longitude];
      if(userLocationMarker){
        userLocationMarker.setLatLng(point);
      } else {
        userLocationMarker = L.marker(point, {
          icon: L.divIcon({className:"map-pin-wrap", html:`<span class="map-pin-me">📍</span>`, iconSize:[26,26], iconAnchor:[13,24]})
        }).addTo(discoveryMap);
      }
      discoveryMap.setView(point, Math.max(discoveryMap.getZoom(), 14));
    },
    () => showToast(t("plant.locationDenied")),
    {enableHighAccuracy:false, timeout:8000}
  );
}

function discoveryEntries(){
  const items = [];
  Object.entries(collection).forEach(([id, entry]) => {
    const lat = Number(entry?.lat);
    const lon = Number(entry?.lon);
    if(!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if(lat === 0 && lon === 0) return;
    if(entry.type === "identification"){
      const localPlant = plants.find(plant => plant.id === entry.localPlantId);
      const profile = knowledgeForSpecies(entry, localPlant);
      const category = mapEntryCategory(entry, localPlant, profile);
      items.push({
        id, lat, lon,
        type: "identification",
        name: entry.name || t("status.observation"),
        place: entry.place || "",
        date: entry.date || "",
        score: entry.score || 0,
        statusLabel: category.verify ? t("result.verify") : (profile.edibility || t("status.observation")),
        category,
        iconMarkup: plantPlateMarkup(entry),
        open: () => openIdentifiedPlant(id)
      });
      return;
    }
    const sourcePlant = plants.find(plant => plant.id === id);
    if(!sourcePlant) return;
    const plant = localizedPlant(sourcePlant);
    const category = mapEntryCategory(entry, plant, {
      status: plant.status,
      edibility: t(plant.status === "comestible" ? "status.edible" : "status.caution"),
      benefits: plant.tradition,
      summary: plant.summary
    });
    items.push({
      id, lat, lon,
      type: "local",
      name: plant.name,
      place: entry.place || "",
      date: entry.date || "",
      score: "",
      statusLabel: t(plant.status === "comestible" ? "status.edible" : "status.caution"),
      category,
      iconMarkup: plantStaticImageMarkup(plant),
      open: () => openPlant(id)
    });
  });
  return items;
}

function renderDiscoveryMap(){
  const container = document.getElementById("discoveryMap");
  const empty = document.getElementById("mapEmpty");
  if(!container || !empty) return;

  const allEntries = discoveryEntries();
  const entries = allEntries.filter(mapEntryMatchesFilter);
  updateMapFilterCounts(allEntries);
  renderVisibleMapList(entries);
  renderMapOutingHighlights(allEntries);
  const summary = document.getElementById("mapSummary");
  if(summary){
    summary.textContent = t("map.summary", {shown:entries.length, total:allEntries.length});
  }

  if(typeof L === "undefined"){
    empty.textContent = t("map.libraryMissing");
    empty.style.display = "block";
    container.style.display = "none";
    return;
  }

  if(!allEntries.length){
    empty.textContent = t("map.empty");
    empty.style.display = "block";
    container.style.display = "none";
    return;
  }

  empty.textContent = entries.length ? "" : t("map.emptyFilter");
  empty.style.display = entries.length ? "none" : "block";
  container.style.display = "block";

  if(!discoveryMap){
    discoveryMap = L.map(container, {zoomControl:true, attributionControl:true});
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap"
    }).addTo(discoveryMap);
    // Regroupe les marqueurs proches en amas cliquables (moins de fouillis).
    discoveryMarkers = (typeof L.markerClusterGroup === "function")
      ? L.markerClusterGroup({showCoverageOnHover:false, maxClusterRadius:46, spiderfyOnMaxZoom:true})
      : L.layerGroup();
    discoveryMarkers.addTo(discoveryMap);

    const LocateControl = L.Control.extend({
      options:{position:"topleft"},
      onAdd:function(){
        const button = L.DomUtil.create("button", "discovery-locate");
        button.type = "button";
        button.title = t("map.locate");
        button.setAttribute("aria-label", t("map.locate"));
        button.innerHTML = "◎";
        L.DomEvent.on(button, "click", L.DomEvent.stop).on(button, "click", locateOnMap);
        return button;
      }
    });
    discoveryMap.addControl(new LocateControl());
    discoveryMap.on("moveend", saveMapView);
  }

  discoveryMarkers.clearLayers();

  if(!entries.length){
    const savedView = loadMapView();
    setTimeout(() => {
      if(!discoveryMap) return;
      discoveryMap.invalidateSize();
      if(savedView){
        discoveryMap.setView([savedView.lat, savedView.lon], savedView.zoom);
      } else {
        discoveryMap.setView([46.603354, 1.888334], 5);
      }
    }, 90);
    return;
  }

  // Plusieurs plantes peuvent partager le même lieu : on écarte légèrement en
  // cercle les marqueurs superposés pour qu'ils restent tous visibles/cliquables.
  const groups = new Map();
  entries.forEach(item => {
    const key = `${item.lat.toFixed(5)},${item.lon.toFixed(5)}`;
    if(!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  groups.forEach(group => {
    if(group.length < 2){
      group[0].displayLat = group[0].lat;
      group[0].displayLon = group[0].lon;
      return;
    }
    const radius = 0.00014; // ~15 m
    group.forEach((item, index) => {
      const angle = (2 * Math.PI * index) / group.length;
      const latRad = item.lat * Math.PI / 180;
      item.displayLat = item.lat + radius * Math.cos(angle);
      item.displayLon = item.lon + (radius * Math.sin(angle)) / Math.max(0.2, Math.cos(latRad));
    });
  });

  const bounds = [];
  entries.forEach(item => {
    const icon = L.divIcon({
      className: `map-pin-wrap map-pin-${mapPinClass(item)}`,
      html: `<span class="map-pin-medallion">${item.iconMarkup}</span><span class="map-pin-symbol">${safeText(mapPinSymbol(item))}</span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -20]
    });
    const marker = L.marker([item.displayLat, item.displayLon], {icon, title: item.name}).addTo(discoveryMarkers);
    marker.bindPopup(
      `<div class="map-popup">
        <strong>${safeText(item.name)}</strong>
        <span>${safeText(item.place || t("plant.placeMissing"))}</span>
        <small>${safeText(item.statusLabel || "")}${item.score ? ` · ${safeText(t("plant.confidence", {score:item.score}))}` : ""}</small>
        ${item.date ? `<small>${safeText(item.date)}</small>` : ""}
        <button type="button" class="map-popup-open">${t("map.openSheet")}</button>
      </div>`
    );
    marker.on("popupopen", event => {
      const element = event.popup.getElement();
      const button = element && element.querySelector(".map-popup-open");
      if(button) button.onclick = () => item.open();
    });
    bounds.push([item.displayLat, item.displayLon]);
  });

  // Le conteneur vient d'être affiché : on laisse la mise en page se stabiliser
  // avant de recalculer la taille et le cadrage de la carte.
  const savedView = loadMapView();
  setTimeout(() => {
    if(!discoveryMap) return;
    discoveryMap.invalidateSize();
    // On restaure la dernière vue consultée si elle existe, sinon on cadre
    // automatiquement sur l'ensemble des découvertes.
    if(savedView){
      discoveryMap.setView([savedView.lat, savedView.lon], savedView.zoom);
    } else if(bounds.length === 1){
      discoveryMap.setView(bounds[0], 14);
    } else {
      discoveryMap.fitBounds(bounds, {padding:[34, 34], maxZoom:15});
    }
  }, 90);
}
