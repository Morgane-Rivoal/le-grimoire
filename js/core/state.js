// Persistance locale de l’herbier et notifications toast.
let collection = loadCollection();
let toastTimer = null;

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
