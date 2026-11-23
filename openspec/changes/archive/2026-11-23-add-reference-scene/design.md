# Conception

## Context

Le MVP doit pouvoir charger le même GLB local dans les deux branches de rendu. Le jeu d’essai peut être livré avant le lanceur et le moteur de comparaison.

## Goals / Non-Goals

**Goals**

- Obtenir un fichier compact, régénérable sur un poste de développement et directement chargeable hors ligne.
- Disposer d’une convention de scène explicite et de motifs qui révèlent la rotation, la symétrie et la parallaxe.

**Non-Goals**

- Moteur de rendu du MVP, empaquetage de l’application et export FPGA.

## Decisions

- Générer des panneaux et des volumes avec Three.js. Leurs noms, couleurs et positions sont fixes.
- Orienter la scène avec +Y en haut et −Z vers l’avant. Le panneau arrière est centré sur +Z, le raccord attendu lorsque la longitude est définie par `atan2(x, -z)`.
- Utiliser des matériaux non éclairés et une géométrie sans textures. Le GLB exporté par `GLTFExporter` est autonome et les motifs ne dépendent pas d’un éclairage.
- Isoler le générateur et sa dépendance dans le dossier du jeu d’essai. Le GLB fait partie des fichiers livrés.

## Risks / Trade-offs

- Les conventions de la future projection peuvent positionner le raccord à un autre angle. Les directions des repères sont documentées indépendamment de l’implémentation.
