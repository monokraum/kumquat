# Proposal

## Why

Les cartes sphériques actuelles déforment les angles locaux. Une projection stéréographique à deux hémisphères permet de comparer un modèle conforme sur les mêmes scènes, à toutes les orientations de la caméra.

## What Changes

- Ajouter un mode stéréographique stéréo avec un disque avant et un disque arrière par œil.
- Afficher le contour du champ de vision sur les deux disques lorsqu’il traverse leur raccord.
- Proposer des repères circulaires activables pour comparer les déformations locales sur les cinq cartes du livrable hors ligne.

## Capabilities

### New Capabilities

- `stereographic-comparison` couvre la capture par œil et la reprojection depuis les deux hémisphères.

### Modified Capabilities

- `projection-fov-preview` inclut l’aperçu stéréographique et les repères de comparaison des angles.

## Impact

Le changement touche les passes WebGPU, le sélecteur de projection et le tracé sur la carte. Les repères sont une superposition de la carte de projection.
