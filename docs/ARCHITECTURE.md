# Architecture du Grimoire

## Ce qui a été séparé

- `le_grimoire.html` : structure des écrans uniquement.
- `css/styles.css` : toute la direction visuelle.
- `js/data/illustrations.js` : chemins des illustrations statiques.
- `js/data/plants.js` : base locale des plantes du Grimoire.
- `js/data/knowledge-profiles.js` : profils automatiques pour générer les fiches après Pl@ntNet.
- `js/ui/plant-plates.js` : moteur de planches botaniques pour les plantes ajoutées par l’utilisateur.
- `js/core/utils.js` : utilitaires génériques (échappement HTML).
- `js/core/state.js` : persistance de l’herbier (`localStorage`) et notifications toast.
- `js/core/navigation.js` : changement d’écran et pile d’historique pour le retour arrière (`go` / `goBack`).
- `js/features/knowledge.js` : moteur de connaissance qui construit une fiche fiable (plante locale, profil connu ou fiche prudente générique).
- `js/features/explorer.js` : recherche, filtres et grille de l’écran Explorer.
- `js/features/identification.js` : sélection des photos, appel Pl@ntNet et rendu des résultats.
- `js/features/plant-detail.js` : rendu de la fiche plante (locale ou observée) et notes personnelles.
- `js/features/herbarium.js` : recherche, filtres et grille de l’écran Herbier.
- `js/init.js` : rendu initial et nettoyage des ressources temporaires au déchargement de la page.
- `assets/illustrations/` : fichiers SVG des plantes de base.
- `manifest.webmanifest` : identité et paramètres d’installation de la PWA.
- `service-worker.js` : cache hors ligne de l’application et des illustrations.
- `js/pwa.js` : installation de l’application et enregistrement du service worker.
- `assets/icons/` : icônes d’installation Android, iOS et ordinateur.
- `docs/CODE_AUDIT.md` : améliorations de fluidité appliquées et prochain découpage recommandé.

## Règle pour les nouvelles plantes

Toute plante issue d’une identification Pl@ntNet doit être affichée avec `plantPlateMarkup(entry)` dans Explorer et dans l’Herbier. La photo réelle ne doit pas être utilisée comme image principale de carte : elle peut rester dans la fiche détaillée comme photo d’observation.

## Fiches automatiques

Les fiches sont générées par ordre de priorité :

1. fiche locale complète si la plante existe dans `plants.js` ;
2. profil précis dans `plantKnowledgeProfiles` ;
3. profil familial dans `familyKnowledgeProfiles` ;
4. fiche prudente générique si aucune connaissance fiable n’est disponible.
