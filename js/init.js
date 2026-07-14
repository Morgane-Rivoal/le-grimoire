// Point d’entrée : rendu initial et nettoyage des ressources temporaires.
window.addEventListener("beforeunload", () => {
  previewUrls.forEach(url => URL.revokeObjectURL(url));
  if(activeObservationPhotoUrl) URL.revokeObjectURL(activeObservationPhotoUrl);
});

translateDocument();
renderPlants();
renderCollection();
if(typeof refreshQueuePanel === "function") refreshQueuePanel();
if(typeof updateOfflineModeUI === "function") updateOfflineModeUI();
if(typeof maybeStartOnboarding === "function") maybeStartOnboarding();
