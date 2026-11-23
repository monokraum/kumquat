# Aperçu de la projection et du champ de vision

## Purpose

Afficher la projection utilisée par la reprojection et situer le champ de vision de la caméra sur cette carte.

## ADDED Requirements

### Requirement: Aperçu par œil dans la page de comparaison

La page SHALL afficher une cinquième vue sous les quatre vues de comparaison. Cette vue SHALL afficher la projection de l’œil sélectionné, sous la forme d’un panorama pour l’équirectangulaire ou de six faces dépliées en croix pour la cubemap. L’œil gauche SHALL être sélectionné par défaut.

#### Scenario: Ouverture de la scène de référence

- **WHEN** la scène de référence est chargée avec les réglages par défaut
- **THEN** les quatre vues de comparaison et la cubemap de l’œil gauche sont visibles dans la même page.

#### Scenario: Sélection de l’œil et de la projection

- **WHEN** l’utilisateur choisit l’œil droit ou change de projection
- **THEN** la cinquième vue affiche la carte correspondante issue de la scène active.

### Requirement: Empreinte du champ de vision

La cinquième vue SHALL tracer le contour du champ de vision à partir des paramètres de caméra du rendu et suivre le lacet, le tangage et le roulis. Le tracé SHALL suivre les raccords de la projection.

#### Scenario: Visée sur une jonction de cubemap

- **WHEN** le champ de vision traverse une jonction de la cubemap
- **THEN** le contour se poursuit sur les faces touchées et reste à l’intérieur de celles-ci.

#### Scenario: Visée au raccord équirectangulaire

- **WHEN** le champ de vision traverse le raccord du panorama
- **THEN** le contour se répartit sur les deux bords du panorama sans segment artificiel à travers son centre.

#### Scenario: Modification du roulis ou du tangage

- **WHEN** l’utilisateur modifie le roulis ou le tangage
- **THEN** le contour suit l’orientation et le champ de la vue reprojetée.
