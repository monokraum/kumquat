# Spec Delta

## MODIFIED Requirements

### Requirement: Exploration de la scène 3D

L’onglet Scène 3D SHALL afficher la scène chargée avec une caméra d’inspection indépendante. En vue globale, l’utilisateur SHALL pouvoir orbiter en glissant, translater avec Maj et glisser, zoomer avec la molette et recentrer la caméra. Dans cette vue, deux repères et leurs volumes de visée SHALL indiquer les centres et le champ des caméras d’analyse.

#### Scenario: Déplacement de la caméra libre

- **WHEN** l’utilisateur orbite, déplace ou zoome la caméra libre
- **THEN** la perspective de la scène change et les réglages de visée et de stéréo sont conservés.

#### Scenario: Nouvelle scène ou recentrage

- **WHEN** l’utilisateur charge une autre scène ou actionne Recentrer en vue globale
- **THEN** la caméra d’inspection cadre la scène active
- **AND** les repères affichent les centres et la visée configurés dans les onglets stéréo.

## ADDED Requirements

### Requirement: Exploration depuis le centre

L’onglet Scène 3D SHALL proposer une caméra à l’origine de la scène, orientée vers l’avant à l’entrée dans ce mode. L’utilisateur SHALL pouvoir tourner sur 360° par glissement, se déplacer au clavier et revenir à la vue globale.

#### Scenario: Rotation à 360° depuis le centre

- **WHEN** l’utilisateur passe en exploration depuis le centre et glisse horizontalement
- **THEN** la caméra pivote autour de sa propre position et la visée stéréo reste inchangée.

#### Scenario: Translation puis retour à la vue globale

- **WHEN** l’utilisateur se déplace au clavier puis revient à la vue globale
- **THEN** l’exploration montre les changements de perspective et la vue globale présente de nouveau les repères des caméras d’analyse.
