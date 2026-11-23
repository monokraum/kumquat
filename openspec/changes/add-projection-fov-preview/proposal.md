# Aperçu de la projection et du champ de vision

## Why

Les quatre vues de comparaison montrent le résultat de la reprojection. Une carte de la projection permet aussi de situer la zone utilisée par la caméra lorsque sa ligne de visée change.

## What Changes

- Ajouter une cinquième vue sous les vues de comparaison. Elle affiche le panorama équirectangulaire ou les six faces de la cubemap dépliées en croix.
- Afficher la projection de l’œil gauche par défaut, avec un sélecteur gauche/droite pour l’aperçu.
- Superposer l’empreinte du champ de vision et suivre le lacet, le tangage et le roulis jusque sur les raccords.

## Capabilities

### New Capabilities

- `projection-fov-preview` : aperçu de la projection sélectionnée et localisation du champ de vision.

### Modified Capabilities

## Impact

- Interface de comparaison, textures du pipeline WebGPU et géométrie du contour de la caméra. Le livrable embarque les mêmes dépendances.
