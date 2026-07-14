# Version PWA du Grimoire

## Test sur ordinateur

1. Lancer `Lancer_Le_Grimoire.bat` ou `npm start`.
2. Ouvrir `http://127.0.0.1:3000`.
3. Dans Chrome ou Edge, utiliser l’option **Installer Le Grimoire**.

`localhost` et `127.0.0.1` sont acceptés pour tester les fonctions PWA sans certificat HTTPS.

## Test sur téléphone

L’adresse locale du PC permet de consulter l’application depuis le même réseau Wi-Fi, mais une adresse telle que `http://192.168.x.x:3000` n’est pas un contexte sécurisé. L’installation PWA, le service worker et certaines fonctions caméra nécessitent un déploiement HTTPS ou un tunnel HTTPS de développement.

## Mise en production

Le serveur Node.js doit être déployé avec :

- une variable `PLANTNET_API_KEY` ;
- un domaine HTTPS ;
- la variable `PORT` fournie par l’hébergeur si nécessaire ;
- une écoute réseau autorisée (`HOST` vaut déjà `0.0.0.0` par défaut).

## Mise à jour du cache

Lorsqu’une ressource précachée change, modifier la valeur `CACHE_VERSION` dans `service-worker.js`. À l’activation, le nouveau service worker supprime les anciens caches.

Les requêtes `POST /api/identify` et les images externes ne sont jamais mises en cache par le service worker.

## Mode randonnée

Le panneau **Réglages > Mode randonnée** prépare les ressources essentielles dans le cache du navigateur avant une sortie. Hors ligne, l'utilisateur peut ouvrir l'application, consulter les fiches déjà intégrées, accéder à son herbier local et enregistrer des observations photo dans la file d'attente. L'identification Pl@ntNet nécessite toujours le retour du réseau.
