// File d'attente hors ligne : conserve dans IndexedDB les photos à identifier
// plus tard (ex. prises en forêt sans réseau), avec leurs coordonnées.
async function enqueueObservation(item){
  const database = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(QUEUE_STORE, "readwrite");
    const request = transaction.objectStore(QUEUE_STORE).add(item);
    transaction.oncomplete = () => {
      database.close();
      resolve(request.result);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getQueue(){
  const database = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(QUEUE_STORE, "readonly");
    const request = transaction.objectStore(QUEUE_STORE).openCursor();
    const items = [];
    request.onsuccess = () => {
      const cursor = request.result;
      if(cursor){
        items.push({key: cursor.key, value: cursor.value});
        cursor.continue();
      }
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(items);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function countQueue(){
  const database = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(QUEUE_STORE, "readonly");
    const request = transaction.objectStore(QUEUE_STORE).count();
    transaction.oncomplete = () => {
      database.close();
      resolve(request.result || 0);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function deleteQueueItem(key){
  const database = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(QUEUE_STORE, "readwrite");
    transaction.objectStore(QUEUE_STORE).delete(key);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}
