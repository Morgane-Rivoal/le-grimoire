# Le Grimoire

Encyclopédie botanique, herbier personnel et identification photographique avec Pl@ntNet.

## Lancer localement

1. Copier `.env.example` sous le nom `.env`.
2. Ajouter la clé `PLANTNET_API_KEY`.
3. Lancer `npm start` ou `Lancer_Le_Grimoire.bat`.
4. Ouvrir `http://127.0.0.1:3000`.

## Déploiement

Le fichier `render.yaml` crée un Web Service Node.js sur Render. La clé Pl@ntNet doit être saisie dans le tableau de bord Render et ne doit jamais être ajoutée au dépôt GitHub.

Voir également :

- `docs/PWA.md`
- `docs/ARCHITECTURE.md`
- `docs/CODE_AUDIT.md`
