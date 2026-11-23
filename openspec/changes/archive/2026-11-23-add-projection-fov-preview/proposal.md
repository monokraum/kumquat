# Aperçu de la projection et du champ de vision

## Why

Une carte de la projection permet de situer la zone utilisée par la caméra lorsque sa ligne de visée change.

## What Changes

- Ajouter une carte qui affiche le panorama équirectangulaire ou les six faces de la cubemap dépliées en croix. Elle se trouve au-dessus des trames de l’onglet Vue reprojetée.
- Afficher la projection de l’œil gauche par défaut, avec un sélecteur gauche/droite pour l’aperçu.
- Superposer l’empreinte du champ de vision et suivre le lacet, le tangage et le roulis jusque sur les raccords.
- Permettre de piloter la ligne de visée en glissant directement sur la carte.

## Capabilities

### New Capabilities

- `projection-fov-preview` : aperçu de la projection sélectionnée, localisation du champ de vision et pilotage de la visée.

### Modified Capabilities

## Impact

- Interface de comparaison, textures du pipeline WebGPU et géométrie du contour de la caméra. Le livrable embarque les mêmes dépendances.
