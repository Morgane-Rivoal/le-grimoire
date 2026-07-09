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

## Refactoring appliqué — juillet 2026

`js/app.js` a été découpé en modules, comme recommandé ci-dessus : `core/utils.js`, `core/state.js`, `core/navigation.js`, `features/knowledge.js`, `features/explorer.js`, `features/identification.js`, `features/plant-detail.js`, `features/herbarium.js`, et `init.js` pour le rendu initial. Voir `docs/ARCHITECTURE.md` pour le détail de chaque fichier.

## Prochain refactoring recommandé

La migration vers IndexedDB devra précéder le stockage de photos personnelles : `localStorage` convient aux notes courtes, pas aux images.
