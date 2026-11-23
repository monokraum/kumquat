# Spec Delta

## Purpose

Comparer deux répartitions supplémentaires des pixels sur la sphère avec le rendu direct de la scène pour chaque œil.

## ADDED Requirements

### Requirement: Comparaison cubemap équiangulaire et octaédrique

La vue reprojetée SHALL proposer la cubemap équiangulaire à six faces de 1024 × 1024 et la projection octaédrique carrée de 2508 × 2508, par œil. Ces modes SHALL utiliser les paramètres de caméra et la visée communs au rendu direct et rester disponibles dans le livrable hors ligne.

#### Scenario: Sélection des nouvelles projections

- **WHEN** l’utilisateur sélectionne l’EAC ou l’octaédrique dans le livrable hors ligne
- **THEN** les deux yeux affichent la scène active depuis la carte choisie, avec la même visée et le même cadrage que le rendu direct.

#### Scenario: Visée de part et d’autre d’un raccord

- **WHEN** l’utilisateur vise de part et d’autre d’une jonction de faces EAC ou d’un bord replié de la carte octaédrique
- **THEN** les vues reprojetées échantillonnent les directions voisines de la même scène.

#### Scenario: Mise à jour de la scène et de la stéréo

- **WHEN** l’utilisateur change de scène ou d’écart interoculaire avant de revenir à l’une des nouvelles projections
- **THEN** la vue reprojetée utilise les captures correspondant à la scène et à l’écart actuels.
