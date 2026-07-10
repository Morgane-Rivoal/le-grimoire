// Tableau de bord : statistiques de l'herbier, succès et parcours chronologique.
function dashboardEntryDate(entry){
  if(entry?.date && entry.date.length >= 7) return entry.date;
  return String(entry?.createdAt || "").slice(0, 10);
}

function monthLabel(key){
  const [year, month] = key.split("-").map(Number);
  if(!year || !month) return key;
  try{
    return new Intl.DateTimeFormat(currentLocale === "en" ? "en" : "fr", {month:"long", year:"numeric"})
      .format(new Date(year, month - 1, 1));
  } catch{
    return key;
  }
}

function buildTimelineGroups(){
  const items = [];
  Object.entries(collection).forEach(([id, entry]) => {
    if(!entry) return;
    const date = dashboardEntryDate(entry);
    if(!date) return;
    let name;
    let opener;
    if(entry.type === "identification"){
      name = entry.name || t("image.observation");
      opener = `openIdentifiedPlant('${id}')`;
    } else {
      const sourcePlant = plants.find(plant => plant.id === id);
      if(!sourcePlant) return;
      name = localizedPlant(sourcePlant).name;
      opener = `openPlant('${id}')`;
    }
    items.push({date, name, place: entry.place || "", opener});
  });
  items.sort((a, b) => b.date.localeCompare(a.date));

  const groups = [];
  let currentKey = null;
  items.forEach(item => {
    const key = item.date.slice(0, 7);
    if(key !== currentKey){
      currentKey = key;
      groups.push({key, label: monthLabel(key), items: []});
    }
    groups[groups.length - 1].items.push(item);
  });
  return groups;
}

function renderDashboard(){
  const mount = document.getElementById("dashboardMount");
  if(!mount) return;
  const progress = achievementsProgress();
  const stats = progress.stats;

  const tiles = [
    {icon:"🌿", label:t("dash.species"),      value:stats.species},
    {icon:"📚", label:t("dash.families"),     value:stats.families},
    {icon:"🔍", label:t("dash.observations"), value:stats.observations},
    {icon:"📍", label:t("dash.geolocated"),   value:stats.geolocated},
    {icon:"📷", label:t("dash.photos"),       value:stats.photos},
    {icon:"📖", label:t("dash.total"),        value:stats.total}
  ];
  const tilesMarkup = tiles.map(tile =>
    `<div class="stat-tile"><span class="stat-icon">${tile.icon}</span><span class="stat-value">${tile.value}</span><span class="stat-label">${safeText(tile.label)}</span></div>`
  ).join("");

  const badgesMarkup = progress.list.map(achievement =>
    `<div class="achv-badge ${achievement.unlocked ? "unlocked" : "locked"}">
      <span class="achv-icon">${achievement.icon}</span>
      <strong>${safeText(t(`achv.${achievement.id}.title`))}</strong>
      <span class="achv-desc">${safeText(t(`achv.${achievement.id}.desc`))}</span>
    </div>`
  ).join("");

  const groups = buildTimelineGroups();
  const timelineMarkup = groups.length
    ? groups.map(group => `
        <div class="timeline-group">
          <p class="timeline-month">${safeText(group.label)}</p>
          ${group.items.map(item => `
            <button type="button" class="timeline-item" onclick="${item.opener}">
              <span class="timeline-name">${safeText(item.name)}</span>
              <span class="timeline-place">${safeText(item.place || t("plant.placeMissing"))}</span>
            </button>
          `).join("")}
        </div>
      `).join("")
    : `<p class="small-note">${safeText(t("dash.empty"))}</p>`;

  mount.innerHTML = `
    <p class="section-title">${safeText(t("dash.stats"))}</p>
    <div class="stat-grid">${tilesMarkup}</div>

    <p class="section-title">${safeText(t("dash.achievements"))} <span class="achv-progress">${progress.unlocked}/${progress.total}</span></p>
    <div class="achv-grid">${badgesMarkup}</div>

    <p class="section-title">${safeText(t("dash.timeline"))}</p>
    <div class="timeline">${timelineMarkup}</div>
  `;
}
