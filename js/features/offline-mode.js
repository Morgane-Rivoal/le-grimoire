// Mode randonnée : rend l'état hors ligne explicite et prépare les ressources
// indispensables avant de partir sur le terrain.
const HIKING_CACHE_NAME = "grimoire-hike-pack-v2";
const HIKING_PREPARED_KEY = `grimoireHikingPackPreparedAt:${HIKING_CACHE_NAME}`;
const HIKING_CACHE_ASSETS = [
  "/",
  "/le_grimoire.html",
  "/manifest.webmanifest",
  "/css/styles.css",
  "/css/styles.css?v=pwa30",
  "/assets/vendor/leaflet/leaflet.css",
  "/assets/vendor/leaflet/leaflet.js",
  "/assets/vendor/leaflet/MarkerCluster.css",
  "/assets/vendor/leaflet/MarkerCluster.Default.css",
  "/assets/vendor/leaflet/leaflet.markercluster.js",
  "/js/i18n.js",
  "/js/i18n.js?v=pwa30",
  "/js/data/illustrations.js",
  "/js/data/plants.js",
  "/js/data/knowledge-profiles.js",
  "/js/data/content-en.js",
  "/js/storage/photos.js",
  "/js/storage/queue.js",
  "/js/ui/plant-plates.js",
  "/js/core/utils.js",
  "/js/core/state.js",
  "/js/core/navigation.js",
  "/js/features/knowledge.js",
  "/js/features/explorer.js",
  "/js/features/identification.js",
  "/js/features/plant-detail.js",
  "/js/features/herbarium.js",
  "/js/features/map.js",
  "/js/features/map.js?v=pwa30",
  "/js/features/outings.js",
  "/js/features/outings.js?v=pwa30",
  "/js/features/achievements.js",
  "/js/features/dashboard.js",
  "/js/features/onboarding.js",
  "/js/features/offline-queue.js",
  "/js/features/offline-mode.js",
  "/js/init.js",
  "/js/pwa.js",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/icon-maskable-512.png",
  "/assets/illustrations/menthe.svg",
  "/assets/illustrations/lavande.svg",
  "/assets/illustrations/romarin.svg",
  "/assets/illustrations/rose.svg",
  "/assets/illustrations/thym.svg",
  "/assets/illustrations/persil.svg"
];

function hikingPackPreparedAt(){
  const value = localStorage.getItem(HIKING_PREPARED_KEY);
  return value ? new Date(value) : null;
}

function updateOfflineModeUI(){
  const offline = !navigator.onLine;
  const banner = document.getElementById("offlineTrailBanner");
  const status = document.getElementById("offlineStatusText");
  const identifyButton = document.getElementById("identifyButton");
  const preparedAt = hikingPackPreparedAt();

  banner?.classList.toggle("hidden", !offline);
  document.body.classList.toggle("is-offline", offline);

  if(status){
    if(!("caches" in window)){
      status.textContent = t("offline.unsupported");
    } else if(preparedAt){
      status.textContent = t("offline.ready", {
        date: preparedAt.toLocaleDateString(currentLocale === "en" ? "en" : "fr-FR")
      });
    } else {
      status.textContent = t("offline.statusUnknown");
    }
  }

  if(identifyButton){
    identifyButton.textContent = offline ? t("offline.identifyOffline") : t("identify.submit");
  }
}

async function prepareHikingOfflinePack(){
  const button = document.getElementById("prepareOfflineButton");
  const status = document.getElementById("offlineStatusText");
  if(!("caches" in window)){
    showToast(t("offline.unsupported"));
    updateOfflineModeUI();
    return;
  }

  if(button) button.disabled = true;
  if(status) status.textContent = t("offline.preparing");

  try{
    if("serviceWorker" in navigator){
      const registration = await navigator.serviceWorker.ready.catch(() => null);
      await registration?.update?.();
    }
    const cache = await caches.open(HIKING_CACHE_NAME);
    await cache.addAll(HIKING_CACHE_ASSETS);
    localStorage.setItem(HIKING_PREPARED_KEY, new Date().toISOString());
    showToast(t("offline.prepared"));
  } catch{
    showToast(t("offline.prepareFailed"));
  } finally {
    if(button) button.disabled = false;
    updateOfflineModeUI();
  }
}

window.addEventListener("online", () => {
  updateOfflineModeUI();
  showToast(t("offline.backOnline"));
});
window.addEventListener("offline", () => {
  updateOfflineModeUI();
  showToast(t("offline.nowOffline"));
});
