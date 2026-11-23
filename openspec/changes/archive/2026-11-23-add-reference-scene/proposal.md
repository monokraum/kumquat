# Scène de référence du MVP

## Why

Les comparaisons entre rendu direct et reprojection demandent une scène locale aux repères et aux profondeurs connus, réutilisable sur le poste cible hors ligne.

## What Changes

- Livrer une scène GLB autonome avec des repères d’orientation, de raccord et de profondeur.
- Fournir le générateur Three.js et les coordonnées utiles à la validation des rendus.

## Capabilities

### New Capabilities

- `reference-scene` : scène d’essai locale pour les projections cubemap et équirectangulaire.

### Modified Capabilities

## Impact

- Ressource GLB, générateur et documentation dans le dossier `fixtures/reference-scene`.
- Dépendance Three.js pour la régénération sur le poste de développement.
