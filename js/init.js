// Point d’entrée : rendu initial et nettoyage des ressources temporaires.
window.addEventListener("beforeunload", () => {
  previewUrls.forEach(url => URL.revokeObjectURL(url));
  if(activeObservationPhotoUrl) URL.revokeObjectURL(activeObservationPhotoUrl);
});

translateDocument();
renderPlants();
renderCollection();
