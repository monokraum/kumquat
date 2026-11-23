# Projection équirectangulaire

## Context

Le MVP doit permettre de comparer les deux projections dans le même outil.

## Goals / Non-Goals

Convertir les cubemaps en projection équirectangulaire et exposer le choix dans l’interface.

## Decisions

Calculer la longitude par atan2(x, −z) et la latitude depuis Y. Échantillonner la carte par coordonnées explicites et replier l’indice horizontal au raccord +Z.

## Risks / Trade-offs

Utiliser la scène GLB de référence pour vérifier le résultat avant la validation sur le poste cible.
