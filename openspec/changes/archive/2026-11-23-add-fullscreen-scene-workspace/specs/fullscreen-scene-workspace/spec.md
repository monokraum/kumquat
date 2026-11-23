# Espace de travail plein écran et scène 3D

## Purpose

Consulter les rendus stéréo et explorer la scène analysée dans un espace de travail qui tient dans la fenêtre.

## ADDED Requirements

### Requirement: Vues par onglets dans la fenêtre

L’application SHALL occuper la fenêtre sans défilement, proposer les onglets Vue reprojetée, Rendu direct et Scène 3D et ouvrir la Vue reprojetée par défaut. La sélection de la scène et le diagnostic WebGPU SHALL être accessibles depuis chaque onglet. Le contrôle plein écran SHALL utiliser le mode du navigateur lorsqu’il est disponible.

#### Scenario: Affichage des deux branches stéréo

- **WHEN** l’utilisateur passe de Vue reprojetée à Rendu direct
- **THEN** la carte et les deux trames reprojetées laissent place aux deux trames directes disposées côte à côte
- **AND** la ligne de visée, l’écart interoculaire et la projection choisie sont conservés.

#### Scenario: Cartouche de scène commun aux onglets

- **WHEN** la scène de calibration est affichée
- **THEN** le cartouche supérieur gauche présente l’icône cube et le libellé Scène de référence
- **AND** ce libellé ouvre le sélecteur et l’action Ouvrir un GLB ouvre le sélecteur de fichiers.

#### Scenario: Redimensionnement de la fenêtre

- **WHEN** la fenêtre est redimensionnée ou passe en plein écran
- **THEN** l’onglet actif et ses commandes restent visibles sans défilement de la page
- **AND** les trames et la carte sont affichées à leur rapport d’aspect.

### Requirement: Exploration de la scène 3D

L’onglet Scène 3D SHALL afficher la scène chargée avec une caméra d’inspection indépendante. L’utilisateur SHALL pouvoir orbiter en glissant, translater avec Maj et glisser, zoomer avec la molette et recentrer la caméra. Deux repères et leurs volumes de visée SHALL indiquer les centres et le champ des caméras d’analyse.

#### Scenario: Déplacement de la caméra libre

- **WHEN** l’utilisateur orbite, déplace ou zoome la caméra libre
- **THEN** la perspective de la scène change et les réglages de visée et de stéréo sont conservés.

#### Scenario: Nouvelle scène ou recentrage

- **WHEN** l’utilisateur charge une autre scène ou actionne Recentrer
- **THEN** la caméra d’inspection cadre la scène active
- **AND** les repères affichent les centres et la visée configurés dans les onglets stéréo.
