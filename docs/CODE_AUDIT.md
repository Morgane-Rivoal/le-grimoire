# Audit de fluidité — juillet 2026

## Améliorations appliquées

- Recherche temporisée à 140 ms pour éviter de reconstruire la grille à chaque frappe.
- Construction des grilles dans un `DocumentFragment` afin de limiter les recalculs de mise en page.
- Redimensionnement des photos à 2 000 px maximum et compression JPEG avant l’envoi à Pl@ntNet.
- Restauration de la position de lecture dans Explorer et l’Herbier.
- Lecture protégée du stockage local si les données sont absentes ou corrompues.
- Libération des URL temporaires de prévisualisation.
- Chargement différé et décodage asynchrone des images.
- Rendu différé des cartes et sections longues avec `content-visibility`.
- Espacement, interlignage et taille des zones tactiles renforcés.
- Cartes du sommaire converties en boutons accessibles au clavier.
- Styles intégrés à la page déplacés dans la feuille CSS.

## Prochain refactoring recommandé

`js/app.js` concentre encore la navigation, l’identification, l’herbier et le rendu des fiches. Avant d’ajouter beaucoup de fonctions natives, le découper en quatre modules :

1. `core/navigation.js`
2. `features/explorer.js`
3. `features/identification.js`
4. `features/herbarium.js`

La migration vers IndexedDB devra précéder le stockage de photos personnelles : `localStorage` convient aux notes courtes, pas aux images.
