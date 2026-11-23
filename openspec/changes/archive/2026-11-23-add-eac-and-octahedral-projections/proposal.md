# Proposal

## Why

La cubemap et l’équirectangulaire répartissent différemment les pixels autour du point de vue. La cubemap équiangulaire et l’octaédrique étendent cette comparaison pour les deux yeux, avec le rendu direct comme référence commune.

## What Changes

- Ajouter les options Cubemap équiangulaire (EAC) et Octaédrique dans la vue reprojetée.
- Afficher leur carte par œil et le contour du champ de vision au fil des mouvements de la visée.
- Fournir les deux modes dans le livrable hors ligne.

## Capabilities

### New Capabilities

- `advanced-projection-comparison` décrit le rendu stéréo depuis les cartes EAC et octaédrique.

### Modified Capabilities

- `projection-fov-preview` couvre leurs cartes, le tracé aux raccords et le déplacement de la visée.

## Impact

Les passes de capture et de reprojection WebGPU, le sélecteur de projection, la carte et son contour évoluent. La calibration, le rendu direct et le format des trames par œil sont communs aux quatre projections.
