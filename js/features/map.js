// Carte des découvertes : place sur une carte interactive (Leaflet) chaque
// plante de l'herbier disposant de coordonnées, avec retour vers sa fiche.
let discoveryMap = null;
let discoveryMarkers = null;

function discoveryEntries(){
  const items = [];
  Object.entries(collection).forEach(([id, entry]) => {
    const lat = Number(entry?.lat);
    const lon = Number(entry?.lon);
    if(!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if(lat === 0 && lon === 0) return;
    if(entry.type === "identification"){
      items.push({
        id, lat, lon,
        name: entry.name || t("image.observation"),
        place: entry.place || "",
        iconMarkup: plantPlateMarkup(entry),
        open: () => openIdentifiedPlant(id)
      });
      return;
    }
    const sourcePlant = plants.find(plant => plant.id === id);
    if(!sourcePlant) return;
    const plant = localizedPlant(sourcePlant);
    items.push({
      id, lat, lon,
      name: plant.name,
      place: entry.place || "",
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

  const entries = discoveryEntries();

  if(typeof L === "undefined"){
    empty.textContent = t("map.libraryMissing");
    empty.style.display = "block";
    container.style.display = "none";
    return;
  }

  if(!entries.length){
    empty.textContent = t("map.empty");
    empty.style.display = "block";
    container.style.display = "none";
    return;
  }

  empty.style.display = "none";
  container.style.display = "block";

  if(!discoveryMap){
    discoveryMap = L.map(container, {zoomControl:true, attributionControl:true});
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap"
    }).addTo(discoveryMap);
    discoveryMarkers = L.layerGroup().addTo(discoveryMap);
  }

  discoveryMarkers.clearLayers();

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
      className: "map-pin-wrap",
      html: `<span class="map-pin-medallion">${item.iconMarkup}</span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -20]
    });
    const marker = L.marker([item.displayLat, item.displayLon], {icon, title: item.name}).addTo(discoveryMarkers);
    marker.bindPopup(
      `<div class="map-popup">
        <strong>${safeText(item.name)}</strong>
        <span>${safeText(item.place || t("plant.placeMissing"))}</span>
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
  setTimeout(() => {
    if(!discoveryMap) return;
    discoveryMap.invalidateSize();
    if(bounds.length === 1){
      discoveryMap.setView(bounds[0], 14);
    } else {
      discoveryMap.fitBounds(bounds, {padding:[34, 34], maxZoom:15});
    }
  }, 90);
}
