# Trames stéréo

## Context

Le cahier des charges définit deux caméras et le placement des images vidéo.

## Goals / Non-Goals

Ajouter les vues par œil, l’écart réglable et la prévisualisation des trames.

## Decisions

Utiliser deux centres fixes autour de l’origine de projection, à 63 mm d’écart par défaut. Les vues utilisent les mêmes intrinsics. La composition GPU place les vues à l’échelle 1 dans des cases de 1920 × 1080.

## Risks / Trade-offs

Utiliser la scène GLB de référence pour vérifier le résultat avant la validation sur le poste cible.
