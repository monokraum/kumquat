# Conception

## Context

La scène de calibration utilise des panneaux de géométrie connue et des couleurs indépendantes de l’éclairage. Le chargeur applique actuellement son éclairage à toutes les scènes importées.

## Goals / Non-Goals

Rendre les GLB de référence faciles à ajouter et fournir un cas de comparaison dont les matériaux réagissent à la lumière.

## Decisions

- Déplacer le GLB de calibration et son générateur dans `references/`. Le générateur crée deux GLB autonomes avec des lumières ponctuelles ou directionnelles intégrées via glTF.
- La calibration garde ses panneaux non éclairés et utilise un matériau éclairé sur l’octaèdre. Le studio contient des surfaces mates et brillantes ainsi que des objets à plusieurs profondeurs.
- Vite assemble les GLB du dossier. Le sélecteur charge le fichier choisi à partir du serveur local et indique la scène effectivement chargée après un changement ou une erreur.
- L’application crée son éclairage de secours uniquement lorsque le GLB ne fournit aucune lumière.

## Risks / Trade-offs

- Des couleurs sensibles à l’éclairage peuvent rendre les repères difficiles à comparer. Les panneaux de calibration gardent leurs matériaux non éclairés.
