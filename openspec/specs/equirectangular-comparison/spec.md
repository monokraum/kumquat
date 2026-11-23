# equirectangular-comparison Specification

## Purpose
Convertir les cubemaps en projection équirectangulaire et exposer le choix dans l’interface.

## Requirements

### Requirement: Projection équirectangulaire

L’outil SHALL proposer une projection équirectangulaire par œil dans le parcours de comparaison. Les indices horizontaux de la carte SHALL se replier au raccord.

#### Scenario: Vérification avec le livrable du MVP

- **WHEN** l’utilisateur passe sur la projection équirectangulaire et vise de part et d’autre du raccord
- **THEN** le repère arrière se prolonge au raccord et les vues directes correspondent toujours à la visée.
