// Navigation entre écrans avec pile d’historique pour le retour arrière.
let currentScreenId = "cover";
const screenScrollPositions = new Map();
const navigationHistory = [];
const transientScreens = new Set(["loading"]);

function go(id, options = {}){
  const target = document.getElementById(id);
  if(!target) return;
  if(!options.replace && currentScreenId && currentScreenId !== id && !transientScreens.has(currentScreenId)){
    navigationHistory.push(currentScreenId);
  }
  screenScrollPositions.set(currentScreenId, window.scrollY);
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  target.classList.add("active");
  currentScreenId = id;
  const nav = document.getElementById("bottomNav");
  nav.classList.toggle("hidden", ["cover","preface","sommaire","loading"].includes(id));
  document.querySelectorAll("#bottomNav button").forEach(b => b.classList.remove("active"));
  document.querySelector(`#bottomNav [data-nav="${id}"]`)?.classList.add("active");
  if(id==="explorer") renderPlants();
  if(id==="herbier") renderCollection();
  if(id==="carte" && typeof renderDiscoveryMap === "function") renderDiscoveryMap();
  if(id==="identifier" && typeof refreshQueuePanel === "function") refreshQueuePanel();
  const restorePosition = ["explorer", "herbier"].includes(id);
  requestAnimationFrame(() => window.scrollTo({
    top: restorePosition ? screenScrollPositions.get(id) || 0 : 0,
    behavior:"auto"
  }));
}

function goBack(fallback = "sommaire"){
  const previous = navigationHistory.pop();
  go(previous || fallback, {replace:true});
}
