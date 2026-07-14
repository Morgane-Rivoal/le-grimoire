// Sorties : transforme les observations enregistrées en carnets de balade.
// L'objectif est de donner une mémoire personnelle sans imposer de saisie lourde.

function outingEntryDate(entry){
  return (entry?.date || String(entry?.observedAt || entry?.createdAt || "").slice(0, 10) || new Date().toISOString().slice(0, 10));
}

function outingDateLabel(date){
  try{
    return new Intl.DateTimeFormat(currentLocale === "en" ? "en" : "fr-FR", {
      day:"numeric",
      month:"long",
      year:"numeric"
    }).format(new Date(`${date}T12:00:00`));
  } catch{
    return date;
  }
}

function outingEntryName(id, entry){
  if(entry?.name) return entry.name;
  const plant = plants.find(item => item.id === id);
  return plant ? localizedPlant(plant).name : t("status.observation");
}

function outingEntryType(id, entry){
  return entry?.type === "identification" ? "identification" : "local";
}

function outingEntryOpen(id, entry){
  return outingEntryType(id, entry) === "identification"
    ? `openIdentifiedPlant('${id}')`
    : `openPlant('${id}')`;
}

function outingTerrainFor(entry){
  const text = `${entry?.place || ""} ${entry?.note || ""} ${(entry?.tags || []).join(" ")}`.toLowerCase();
  if(/jardin|potager|verger|garden|yard/.test(text)) return "garden";
  if(/for[eê]t|bois|sous-bois|sentier|randonn|trail|forest|wood/.test(text)) return "hike";
  if(/mer|plage|littoral|c[ôo]te|dune|port|granville|sea|beach|coast/.test(text)) return "sea";
  return "walk";
}

function outingTypeMeta(type){
  const meta = {
    garden: {icon:"🌱", key:"outings.typeGarden"},
    hike: {icon:"🥾", key:"outings.typeHike"},
    sea: {icon:"🌊", key:"outings.typeSea"},
    walk: {icon:"🍃", key:"outings.typeWalk"}
  };
  return meta[type] || meta.walk;
}

function normalizeOutingItem(id, entry){
  const lat = Number(entry?.lat);
  const lon = Number(entry?.lon);
  return {
    id,
    type: outingEntryType(id, entry),
    name: outingEntryName(id, entry),
    place: entry?.place || "",
    date: outingEntryDate(entry),
    note: entry?.note || "",
    hasPhoto: Boolean(entry?.hasObservationPhoto || entry?.hasPersonalPhoto),
    lat: Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0) ? lat : null,
    lon: Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0) ? lon : null,
    opener: outingEntryOpen(id, entry),
    terrain: outingTerrainFor(entry)
  };
}

function buildOutingGroups(sourceItems){
  const items = Array.isArray(sourceItems)
    ? sourceItems.map(item => ({
        ...item,
        date: item.date || new Date().toISOString().slice(0, 10),
        terrain: outingTerrainFor(item),
        opener: item.type === "identification" ? `openIdentifiedPlant('${item.id}')` : `openPlant('${item.id}')`,
        hasPhoto: Boolean(item.hasPhoto)
      }))
    : Object.entries(collection).map(([id, entry]) => normalizeOutingItem(id, entry));

  const groups = new Map();
  items.filter(item => item.date).forEach(item => {
    const key = `${item.date}-${item.terrain}`;
    if(!groups.has(key)){
      const meta = outingTypeMeta(item.terrain);
      groups.set(key, {
        key,
        date: item.date,
        terrain: item.terrain,
        icon: meta.icon,
        title: t(meta.key, {date: outingDateLabel(item.date)}),
        items: []
      });
    }
    groups.get(key).items.push(item);
  });

  return Array.from(groups.values())
    .map(group => ({
      ...group,
      places: Array.from(new Set(group.items.map(item => item.place).filter(Boolean))).slice(0, 3),
      geolocated: group.items.filter(item => item.lat !== null && item.lon !== null).length,
      photos: group.items.filter(item => item.hasPhoto).length
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function outingMiniMapMarkup(group){
  const points = group.items.filter(item => item.lat !== null && item.lon !== null);
  if(!points.length){
    return `<div class="outing-map outing-map-empty">${safeText(t("outings.noMap"))}</div>`;
  }
  const lats = points.map(item => item.lat);
  const lons = points.map(item => item.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return `
    <div class="outing-map" aria-label="${safeText(t("outings.mapPreview"))}">
      ${points.map(item => {
        const left = 12 + ((item.lon - minLon) / (maxLon - minLon || 1)) * 76;
        const top = 12 + (1 - (item.lat - minLat) / (maxLat - minLat || 1)) * 76;
        return `<span class="outing-map-dot" style="left:${left}%;top:${top}%"></span>`;
      }).join("")}
    </div>
  `;
}

function outingCardMarkup(group){
  return `
    <article class="outing-card">
      <div class="outing-card-head">
        <span class="outing-icon">${safeText(group.icon)}</span>
        <div>
          <p class="kicker">${safeText(t("outings.cardKicker"))}</p>
          <h3>${safeText(group.title)}</h3>
        </div>
      </div>
      <div class="outing-stats">
        <span>${safeText(t("outings.count", {count:group.items.length}))}</span>
        <span>${safeText(t("outings.geoCount", {count:group.geolocated}))}</span>
        <span>${safeText(t("outings.photoCount", {count:group.photos}))}</span>
      </div>
      ${group.places.length ? `<p class="small-note">${safeText(group.places.join(" · "))}</p>` : ""}
      ${outingMiniMapMarkup(group)}
      <div class="outing-photos" data-outing-photos="${safeText(group.key)}">
        ${group.items.slice(0, 4).map(item => `
          <button type="button" class="outing-photo" onclick="${item.opener}" data-photo-id="${safeText(item.id)}">
            <span>${safeText(item.name.slice(0, 1).toUpperCase())}</span>
          </button>
        `).join("")}
      </div>
      <div class="outing-plants">
        ${group.items.slice(0, 6).map(item => `
          <button type="button" onclick="${item.opener}">
            <strong>${safeText(item.name)}</strong>
            <small>${safeText(item.place || t("plant.placeMissing"))}</small>
          </button>
        `).join("")}
      </div>
    </article>
  `;
}

async function hydrateOutingPhotos(){
  const buttons = Array.from(document.querySelectorAll(".outing-photo[data-photo-id]"));
  await Promise.all(buttons.map(async button => {
    const id = button.dataset.photoId;
    try{
      const blob = await getObservationPhoto(id);
      if(!blob) return;
      const url = URL.createObjectURL(blob);
      button.innerHTML = `<img src="${url}" alt="">`;
    } catch{}
  }));
}

function renderOutings(){
  const grid = document.getElementById("outingsGrid");
  const empty = document.getElementById("outingsEmpty");
  if(!grid || !empty) return;
  const groups = buildOutingGroups();
  empty.classList.toggle("hidden", groups.length > 0);
  grid.innerHTML = groups.length
    ? groups.map(outingCardMarkup).join("")
    : "";
  hydrateOutingPhotos();
}
