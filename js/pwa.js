let deferredInstallPrompt = null;

function updateInstallButton(){
  const button = document.getElementById("installAppButton");
  if(!button) return;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  button.classList.toggle("hidden", standalone || !deferredInstallPrompt);
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallButton();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallButton();
});

async function installApp(){
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  updateInstallButton();
}

if("serviceWorker" in navigator && location.protocol !== "file:"){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(error => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

updateInstallButton();
