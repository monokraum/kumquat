# reference-scene-library Specification

## Purpose
Fournir plusieurs scènes GLB intégrées pour tester la géométrie et l’éclairage des deux rendus.

## Requirements

### Requirement: Scènes incluses dans le livrable

Le projet SHALL stocker ses scènes intégrées dans `references/`. Le livrable SHALL contenir ces GLB autonomes et les proposer dans le sélecteur de scènes de référence. La scène de calibration SHALL être chargée au démarrage.

#### Scenario: Choix hors ligne

- **WHEN** le livrable hors ligne est lancé et l’utilisateur choisit le studio éclairé
- **THEN** les vues du studio remplacent celles de la calibration sans requête externe.

### Requirement: Éclairage intégré aux GLB

Le rendu direct et la capture de projection SHALL utiliser les lumières intégrées au GLB. Les repères de calibration conservent leurs matériaux non éclairés. Un GLB dépourvu de lumière reçoit un éclairage par défaut.

#### Scenario: Comparaison des matériaux éclairés

- **WHEN** le studio ou la scène de calibration est chargé
- **THEN** les matériaux éclairés montrent le relief produit par les lumières du fichier dans les deux branches de rendu.

#### Scenario: Import d’un GLB sans lumière

- **WHEN** un utilisateur importe un GLB autonome composé de matériaux éclairés et dépourvu de lumières
- **THEN** le rendu utilise l’éclairage par défaut de l’application.
