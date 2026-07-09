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
    navigator.serviceWorker.register("/service-worker.js").then(registration => {
      registration.update();
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if(!worker) return;
        worker.addEventListener("statechange", () => {
          if(worker.state === "installed" && navigator.serviceWorker.controller){
            worker.postMessage({type:"SKIP_WAITING"});
          }
        });
      });
      if(registration.waiting){
        registration.waiting.postMessage({type:"SKIP_WAITING"});
      }
    }).catch(error => {
      console.warn("Service worker registration failed:", error);
    });
  });

  let refreshingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if(refreshingForUpdate) return;
    refreshingForUpdate = true;
    window.location.reload();
  });
}

updateInstallButton();
