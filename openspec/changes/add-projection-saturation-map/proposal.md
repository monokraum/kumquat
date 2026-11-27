# Proposal

## Why

La carte de projection permet de situer le champ de vision mais ne montre pas quelles directions reçoivent davantage de pixels. Un mode de densité angulaire permet de comparer la répartition des pixels entre les cinq projections.

## What Changes

- Ajouter un bouton « Densité » dans la Carte de projection pour basculer entre l’image de la scène et une carte de densité.
- Afficher une échelle commune en pixels par stéradian et conserver le contour du champ de vision et les interactions de la carte.

## Capabilities

### New Capabilities

### Modified Capabilities

- `projection-fov-preview` couvre l’affichage et l’utilisation de la carte de densité.

## Impact

La Carte de projection ajoute un mode d’affichage local et un calcul à partir des dimensions des textures existantes. Les images reprojetées des deux yeux restent visibles.
