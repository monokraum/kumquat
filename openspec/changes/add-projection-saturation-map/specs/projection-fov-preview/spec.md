# Spec Delta

## ADDED Requirements

### Requirement: Carte de densité angulaire

La Carte de projection SHALL proposer un bouton « Densité » qui affiche les pixels par stéradian de la projection sélectionnée. Les cinq projections SHALL utiliser la même échelle et leur disposition habituelle. Le contour du champ de vision, les repères d’angle déjà activés, le glissement et les deux rendus reprojetés SHALL rester utilisables dans ce mode.

#### Scenario: Activation et retour à l’aperçu

- **WHEN** l’utilisateur active le bouton Densité dans la Carte de projection
- **THEN** la carte affiche la densité avec une légende en px/sr et le bouton annonce son état actif
- **AND** une seconde activation réaffiche l’image de l’œil sélectionné.

#### Scenario: Comparaison de deux répartitions

- **WHEN** l’utilisateur passe de la cubemap au panorama équirectangulaire en mode densité
- **THEN** l’échelle reste identique et la carte suit la projection sélectionnée
- **AND** la cubemap montre une densité plus forte dans les coins des faces et le panorama une densité plus forte près des pôles.

#### Scenario: Visée sur les disques stéréographiques

- **WHEN** l’utilisateur active la densité stéréographique et déplace la visée à travers le raccord
- **THEN** la densité reste fixe, les zones hors disque restent vides et le contour passe entre les deux disques
- **AND** les deux trames suivent la nouvelle orientation.
