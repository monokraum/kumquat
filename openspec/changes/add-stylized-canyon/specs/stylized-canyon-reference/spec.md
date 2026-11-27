# Spec Delta

## Purpose

Proposer un terrain rocheux stylisé que l’on peut explorer à partir de son centre ou observer dans les vues stéréo de Kumquat.

## ADDED Requirements

### Requirement: Terrain de canyon stylisé

Le projet SHALL fournir une scène Canyon stylisé générée avec Three.js et sélectionnable hors ligne. Elle SHALL représenter un terrain carré compact, avec des blocs de grès stratifiés, du relief et de la végétation clairsemée. L’origine SHALL offrir un point de vue dégagé à hauteur d’œil sur le terrain.

#### Scenario: Exploration des quatre directions

- **WHEN** l’utilisateur choisit Canyon stylisé et tourne sur place depuis le centre
- **THEN** la caméra montre du terrain et des reliefs en avant, sur les côtés et en arrière.

#### Scenario: Chargement dans les vues stéréo

- **WHEN** l’utilisateur sélectionne Canyon stylisé dans le livrable décompressé hors ligne
- **THEN** le canyon se charge dans la Vue reprojetée, le Rendu direct et l’onglet Scène 3D sans requête réseau.
