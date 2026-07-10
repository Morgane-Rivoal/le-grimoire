const PHOTO_DATABASE = "grimoire-observation-photos";
const PHOTO_STORE = "photos";
const QUEUE_STORE = "queue";

function openPhotoDatabase(){
  return new Promise((resolve, reject) => {
    if(!("indexedDB" in window)){
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(PHOTO_DATABASE, 2);
    request.onupgradeneeded = () => {
      const database = request.result;
      if(!database.objectStoreNames.contains(PHOTO_STORE)){
        database.createObjectStore(PHOTO_STORE);
      }
      if(!database.objectStoreNames.contains(QUEUE_STORE)){
        database.createObjectStore(QUEUE_STORE, {autoIncrement:true});
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeObservationPhoto(id, blob){
  if(!blob) return false;
  const database = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PHOTO_STORE, "readwrite");
    transaction.objectStore(PHOTO_STORE).put(blob, id);
    transaction.oncomplete = () => {
      database.close();
      resolve(true);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getObservationPhoto(id){
  const database = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PHOTO_STORE, "readonly");
    const request = transaction.objectStore(PHOTO_STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function deleteObservationPhoto(id){
  const database = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PHOTO_STORE, "readwrite");
    transaction.objectStore(PHOTO_STORE).delete(id);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}
