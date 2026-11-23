# Proposal

## Why

Le poste cible refuse la connexion au serveur HTTP local de Kumquat. Le livrable doit aussi pouvoir s’ouvrir directement depuis le disque dans Edge.

## What Changes

- Ouvrir l’application en double-cliquant sur `app/index.html` dans le dossier décompressé, sans serveur ni installation.
- Charger la calibration et le studio éclairé depuis le paquet et continuer à accepter les GLB autonomes.
- Documenter l’ouverture directe et le lancement HTTP avec Node.js.

## Capabilities

### New Capabilities

### Modified Capabilities

- `offline-launch` couvre l’ouverture du livrable via `file://` et les diagnostics WebGPU pour les deux modes de lancement.

## Impact

La configuration Vite, le diagnostic de démarrage et le guide du livrable sont concernés. Le dépôt conserve ses sources et ses scènes de référence dans leurs dossiers respectifs.
