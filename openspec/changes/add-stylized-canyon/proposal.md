# Proposal

## Why

Un canyon stylisé inspiré de l’image de référence fournit un terrain de test avec plusieurs plans, des rochers à contourner et un champ de vision intéressant dans toutes les directions.

## What Changes

- Générer dans Three.js un canyon compact sur un terrain carré et l’inclure comme scène de référence GLB hors ligne.
- Ajouter un mode d’exploration qui place la caméra à l’origine de la scène. La caméra tourne sur place à 360° et se déplace au clavier.

## Capabilities

### New Capabilities

- `stylized-canyon-reference` décrit le terrain stylisé et son intégration au sélecteur de scènes.

### Modified Capabilities

- `fullscreen-scene-workspace` couvre le passage entre la vue globale et l’exploration depuis le centre.

## Impact

Le changement ajoute un générateur Three.js et un GLB à la bibliothèque de références. Il étend l’onglet Scène 3D pour explorer la scène depuis l’origine indépendamment des caméras d’analyse.
