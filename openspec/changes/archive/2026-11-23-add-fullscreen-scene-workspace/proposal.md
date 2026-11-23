# Espace de travail plein écran et scène 3D

## Why

Les trois mockups dans `.assets/` séparent les rendus pour faire tenir la carte et les vues utiles dans la fenêtre. La vue 3D permet de replacer la visée et les deux caméras dans la scène analysée.

## What Changes

- Ajouter trois onglets dans le même espace de travail sans défilement.
- Regrouper la carte et les trames reprojetées dans le premier onglet. Afficher les deux trames directes dans le second.
- Afficher la scène analysée dans le troisième onglet, avec caméra libre et repères de visée stéréo.

## Capabilities

### New Capabilities

- `fullscreen-scene-workspace` : disposition plein écran, navigation par onglets et exploration de la scène 3D.

### Modified Capabilities

## Impact

- Interface, composition WebGPU, gestion du point de vue et documentation d’utilisation.
- Le changement actif `add-projection-fov-preview` adopte le nouvel emplacement de la carte.
