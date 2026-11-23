# Aperçu de la projection et du champ de vision

## Purpose

Afficher la projection utilisée par la reprojection et permettre de situer et d’orienter le champ de vision de la caméra sur cette carte.

## ADDED Requirements

### Requirement: Aperçu par œil dans la page de comparaison

L’onglet Vue reprojetée SHALL afficher la carte au-dessus des deux trames. La carte SHALL afficher la projection de l’œil sélectionné, sous la forme d’un panorama pour l’équirectangulaire ou de six faces dépliées en croix pour la cubemap. L’œil gauche SHALL être sélectionné par défaut.

#### Scenario: Ouverture de la scène de référence

- **WHEN** la scène de référence est chargée avec les réglages par défaut
- **THEN** les deux trames reprojetées et la cubemap de l’œil gauche sont visibles dans l’onglet Vue reprojetée.

#### Scenario: Sélection de l’œil et de la projection

- **WHEN** l’utilisateur choisit l’œil droit ou change de projection
- **THEN** la carte affiche la projection correspondante issue de la scène active.

### Requirement: Empreinte du champ de vision

La carte SHALL tracer le contour du champ de vision à partir des paramètres de caméra du rendu et suivre le lacet, le tangage et le roulis. Le tracé SHALL suivre les raccords de la projection.

#### Scenario: Visée sur une jonction de cubemap

- **WHEN** le champ de vision traverse une jonction de la cubemap
- **THEN** le contour se poursuit sur les faces touchées et reste à l’intérieur de celles-ci.

#### Scenario: Visée au raccord équirectangulaire

- **WHEN** le champ de vision traverse le raccord du panorama
- **THEN** le contour se répartit sur les deux bords du panorama sans segment artificiel à travers son centre.

#### Scenario: Modification du roulis ou du tangage

- **WHEN** l’utilisateur modifie le roulis ou le tangage
- **THEN** le contour suit l’orientation et le champ de la vue reprojetée.

### Requirement: Pilotage de la visée depuis la carte

Dans les deux projections, glisser sur la carte SHALL modifier le lacet et le tangage selon le déplacement du pointeur. Le contour, les contrôles d’angle et les deux trames SHALL refléter la même visée pendant le geste. Le lacet SHALL se replier à ±180° et le tangage SHALL rester entre −90° et 90°.

#### Scenario: Traversée du raccord en glissant

- **WHEN** l’utilisateur glisse vers la droite sur le panorama et dépasse 180° de lacet
- **THEN** le lacet se poursuit de l’autre côté du raccord et le contour reflète la nouvelle visée
- **AND** les trames reprojetées suivent la même orientation.

#### Scenario: Déplacement sur la cubemap

- **WHEN** l’utilisateur glisse sur la carte cubemap
- **THEN** la visée se déplace aussi quand le pointeur quitte momentanément la carte pendant le geste.
