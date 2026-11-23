# stereo-frames Specification

## Purpose
Ajouter les vues par œil, l’écart réglable et la prévisualisation des trames.

## Requirements

### Requirement: Trames stéréo

L’outil SHALL afficher une paire de vues par œil. Chaque image de 1600 × 1024 utilise une focale de 1645 px et le point principal (799,5 ; 511,5), et commence en (160, 28) dans sa trame.

#### Scenario: Vérification avec le livrable du MVP

- **WHEN** l’écart stéréo est modifié
- **THEN** les vues des deux yeux correspondent aux centres révisés et les limites des images restent alignées aux pixels spécifiés.
