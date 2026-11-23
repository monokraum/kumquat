# Conception

## Context

Les mockups définissent un en-tête commun, un panneau de réglages pour les deux vues stéréo et une surface 3D qui occupe tout l’espace principal.

## Goals / Non-Goals

Adapter l’interface à la fenêtre et permettre l’exploration de la scène avec une caméra indépendante des caméras stéréo.

## Decisions

- Utiliser des onglets accessibles au clavier et une grille à hauteur bornée. Placer la carte au-dessus des deux trames reprojetées, et centrer les trames directes dans son onglet. Utiliser le ratio de chaque trame pour ajuster son aperçu dans l’espace disponible.
- Réutiliser le contexte WebGPU et son canevas pour les deux affichages stéréo et la scène 3D. Le compositeur sélectionne la branche visible et échantillonne la trame à ses coordonnées natives.
- Afficher la scène GLB avec ses matériaux et lumières dans un conteneur d’inspection. Les repères 3D emploient les mêmes paramètres de caméra, centres par œil et rotation que la reprojection. La caméra libre utilise la navigation orbitale et cadre la scène à son chargement.
- Actualiser l’emplacement de la carte dans la spécification active `add-projection-fov-preview`.

## Risks / Trade-offs

- Les aperçus se réduisent dans les petites fenêtres. Les réglages se compactent et les deux zones stéréo gardent le rapport de la trame.
- La taille des volumes de visée sert à la présentation 3D. Leur ouverture, orientation et origine reprennent la configuration d’analyse.
