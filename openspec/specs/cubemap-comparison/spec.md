# cubemap-comparison Specification

## Purpose
Charger un GLB local, piloter la visée et comparer les rendus.

## Requirements

### Requirement: Comparaison cubemap

L’outil SHALL comparer une vue reprojetée depuis une cubemap à un rendu direct suréchantillonné de la même scène, avec une ligne de visée commune.

#### Scenario: Vérification avec le livrable du MVP

- **WHEN** la scène de référence est chargée et plusieurs orientations sont sélectionnées
- **THEN** les repères visibles s’alignent dans les deux branches en utilisant le même point de vue.
