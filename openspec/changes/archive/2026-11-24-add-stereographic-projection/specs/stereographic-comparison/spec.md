# Spec Delta

## Purpose

Comparer un encodage conforme de toute la sphère avec le rendu direct stéréo dans le livrable hors ligne.

## ADDED Requirements

### Requirement: Reprojection stéréographique par œil

La vue reprojetée SHALL proposer deux disques stéréographiques par œil, centrés sur l’avant et l’arrière et couvrant chacun un hémisphère. Les deux disques SHALL être disponibles hors ligne et utiliser la caméra, la visée et l’écart interoculaire du parcours de comparaison.

#### Scenario: Visée dans chaque hémisphère

- **WHEN** l’utilisateur choisit Stéréographique et oriente la visée vers l’avant puis vers l’arrière
- **THEN** les deux yeux montrent les repères correspondants et s’alignent sur le rendu direct de la scène active.

#### Scenario: Visée au raccord stéréographique

- **WHEN** le champ de vision chevauche le bord commun des deux hémisphères
- **THEN** les deux vues reprojetées utilisent les directions contiguës des deux cartes, avec une image continue au passage du raccord.

#### Scenario: Changement de scène ou d’écart interoculaire

- **WHEN** l’utilisateur modifie la scène ou l’écart interoculaire avant de revenir à la projection stéréographique
- **THEN** la reprojection et la carte correspondent aux captures actuelles des deux yeux.
