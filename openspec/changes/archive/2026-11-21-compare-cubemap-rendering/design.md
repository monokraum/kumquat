# Comparaison cubemap

## Context

Le rendu direct et la cubemap doivent partager le même modèle de caméra.

## Goals / Non-Goals

Charger un GLB local, piloter la visée et comparer les rendus.

## Decisions

Capturer six cibles WebGPU. Un shader TSL choisit la face et lit les texels explicitement. Le rendu direct est calculé à deux fois la résolution linéaire, puis ramené à la résolution nominale par une moyenne 2 × 2.

## Risks / Trade-offs

Utiliser la scène GLB de référence pour vérifier le résultat avant la validation sur le poste cible.
