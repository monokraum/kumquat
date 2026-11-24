# projection-fov-preview Specification

## Purpose
Afficher la projection utilisée par la reprojection et permettre de situer et d’orienter le champ de vision de la caméra sur cette carte.

## Requirements

### Requirement: Aperçu par œil dans la page de comparaison

L’onglet Vue reprojetée SHALL afficher la carte au-dessus des deux trames. La carte de l’œil choisi SHALL prendre la forme d’un panorama équirectangulaire, de six faces dépliées en croix pour la cubemap et l’EAC, d’une carte carrée pour l’octaédrique, ou de deux disques avant et arrière pour la stéréographique. L’œil gauche SHALL être sélectionné par défaut.

#### Scenario: Ouverture de la scène de référence

- **WHEN** la scène de référence est chargée avec les réglages par défaut
- **THEN** les deux trames reprojetées et la cubemap de l’œil gauche sont visibles dans l’onglet Vue reprojetée.

#### Scenario: Sélection de l’œil et de la projection

- **WHEN** l’utilisateur choisit l’œil droit ou change de projection
- **THEN** la carte affiche la projection correspondante issue de la scène active.

### Requirement: Empreinte du champ de vision

La carte SHALL tracer le contour du champ de vision à partir des paramètres de caméra du rendu et suivre le lacet, le tangage et le roulis. Le tracé SHALL suivre les raccords de la projection.

#### Scenario: Visée sur une jonction de cubemap

- **WHEN** le champ de vision traverse une jonction de la cubemap ou de l’EAC
- **THEN** le contour se poursuit sur les faces touchées et reste à l’intérieur de celles-ci.

#### Scenario: Visée au raccord équirectangulaire

- **WHEN** le champ de vision traverse le raccord du panorama
- **THEN** le contour se répartit sur les deux bords du panorama sans segment artificiel à travers son centre.

#### Scenario: Visée sur un bord de la carte octaédrique

- **WHEN** le champ de vision traverse une coupure dans l’hémisphère arrière représenté sur les bords du carré
- **THEN** le contour se poursuit aux emplacements correspondants du carré sans segment artificiel à travers la carte.

#### Scenario: Visée au raccord stéréographique

- **WHEN** le champ de vision traverse le bord commun des deux hémisphères
- **THEN** le contour se prolonge sur les deux disques sans segment artificiel entre eux.

#### Scenario: Modification du roulis ou du tangage

- **WHEN** l’utilisateur modifie le roulis ou le tangage
- **THEN** le contour suit l’orientation et le champ de la vue reprojetée.

### Requirement: Pilotage de la visée depuis la carte

Dans chaque projection, glisser sur la carte SHALL modifier le lacet et le tangage selon le déplacement du pointeur. Le contour, les contrôles d’angle et les deux trames SHALL refléter la même visée pendant le geste. Le lacet SHALL se replier à ±180° et le tangage SHALL rester entre −90° et 90°.

#### Scenario: Traversée du raccord en glissant

- **WHEN** l’utilisateur glisse vers la droite sur le panorama et dépasse 180° de lacet
- **THEN** le lacet se poursuit de l’autre côté du raccord et le contour reflète la nouvelle visée
- **AND** les trames reprojetées suivent la même orientation.

#### Scenario: Déplacement sur la cubemap

- **WHEN** l’utilisateur glisse sur la carte cubemap
- **THEN** la visée se déplace aussi quand le pointeur quitte momentanément la carte pendant le geste.

#### Scenario: Déplacement sur l’EAC ou l’octaédrique

- **WHEN** l’utilisateur glisse sur l’une des deux nouvelles cartes
- **THEN** les angles, le contour et les deux vues évoluent ensemble.

#### Scenario: Déplacement sur la carte stéréographique

- **WHEN** l’utilisateur glisse sur la carte stéréographique et déplace la visée d’un hémisphère à l’autre
- **THEN** les deux trames, les angles et le contour suivent la nouvelle visée.

### Requirement: Repères de comparaison des angles

La carte SHALL proposer une option « Repères d’angle » pour afficher les mêmes petits cercles de rayon angulaire constant sur chaque projection. Les repères SHALL rester fixes sur la sphère lors du déplacement de la ligne de visée.

#### Scenario: Comparaison de la forme locale

- **WHEN** l’utilisateur active les repères et passe du mode stéréographique au mode équirectangulaire
- **THEN** les cercles sont ronds dans les disques stéréographiques et les repères proches des pôles sont étirés sur le panorama.

#### Scenario: Désactivation des repères

- **WHEN** l’utilisateur désactive les repères d’angle
- **THEN** le champ de vision reste visible et les repères disparaissent de la carte.
