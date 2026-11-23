# reference-scene Specification

## Purpose
Fournir un jeu d’essai reproductible pour comparer les rendus direct et reprojeté du MVP.

## Requirements

### Requirement: Chargement hors ligne
Le projet SHALL fournir une scène de référence GLB autonome contenant toutes les données nécessaires à son chargement local.

#### Scenario: Ouverture du fichier autonome
- **WHEN** le GLB est chargé depuis ses octets sur un poste hors ligne
- **THEN** la scène se charge et ses repères sont disponibles.

### Requirement: Repères de validation géométrique
La scène SHALL comporter des repères nommés, d’orientation identifiable et de positions documentées, avec une couverture des axes, d’une jonction de cubemap, d’un raccord panoramique et de plusieurs profondeurs.

#### Scenario: Inspection des repères
- **WHEN** le GLB est chargé
- **THEN** les repères des six axes, le repère de jonction entre deux faces et les objets à deux profondeurs sont présents aux positions documentées
- **AND** le repère arrière traverse le raccord panoramique de la scène.
