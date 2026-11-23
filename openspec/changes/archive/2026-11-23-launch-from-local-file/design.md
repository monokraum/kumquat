# Design

## Context

Le build Vite utilise un script de type module et demande les GLB intégrés avec `fetch`. Chromium applique les règles d’origine aux modules et aux requêtes vers des fichiers locaux. WebGPU dépend du contexte sécurisé et de la disponibilité d’un adaptateur.

## Decisions

- Générer un script classique avec Vite et Rollup pour le paquet. Garder la feuille de style à côté du script et utiliser des chemins relatifs dans le HTML. Le serveur de développement conserve son entrée modulaire.
- Inclure les GLB de `references/` dans le bundle sous forme d’URL `data:`. La logique de sélection et d’import de scènes reste commune aux deux modes de lancement. Le script et la feuille de style restent des fichiers distincts pour faciliter la lecture de l’archive.
- Garder le dossier `app/` comme racine des fichiers servis par le lanceur HTTP. Le même `app/index.html` sert aux deux modes.

## Risks / Trade-offs

- Les GLB intégrés augmentent la taille du script livré. Les scènes couvertes par ce changement sont les références de calibration et de studio.
- Le mode fichier évite le port local. Il dépend toujours de l’adaptateur WebGPU que le navigateur et le pilote exposent au poste.
