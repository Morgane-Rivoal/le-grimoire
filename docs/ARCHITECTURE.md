# Architecture du Grimoire

## Ce qui a été séparé

- `Le_Grimoire_v0_2_0.html` : structure des écrans uniquement.
- `css/styles.css` : toute la direction visuelle.
- `js/data/illustrations.js` : chemins des illustrations statiques.
- `js/data/plants.js` : base locale des plantes du Grimoire.
- `js/data/knowledge-profiles.js` : profils automatiques pour générer les fiches après Pl@ntNet.
- `js/ui/plant-plates.js` : moteur de planches botaniques pour les plantes ajoutées par l’utilisateur.
- `js/app.js` : navigation, recherche, identification, enregistrement et herbier.
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
