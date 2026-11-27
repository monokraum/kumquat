# Design

## Context

La carte dessine les pixels de la scène sur un canvas 2D et les contours sur un second canvas. Les textures sources et les dispositions d’aperçu ont des dimensions différentes.

## Decisions

- Utiliser l’inverse de l’angle solide local par pixel sur la sphère unitaire. Évaluer les jacobiens des cinq projections aux centres des pixels de l’aperçu et prendre les dimensions des textures de reprojection pour exprimer le résultat en px/sr.
- Utiliser une échelle logarithmique commune de 250 000 à 2 000 000 px/sr. La dernière couleur représente aussi les valeurs au-dessus de 2 000 000 px/sr, notamment près des pôles équirectangulaires.
- Calculer la carte au premier affichage de chaque projection et réutiliser ses pixels. L’œil, la scène et la visée modifient l’image de la scène ou les contours. Le mode densité utilise le canvas d’arrière-plan et les mêmes traits et interactions que l’aperçu habituel.

## Risks / Trade-offs

- Une lecture GPU en cours peut terminer après la bascule. Identifier les travaux devenus obsolètes avant de peindre sur le canvas.
- Près des raccords, évaluer chaque zone dans son propre repère. Laisser les cases vides des croix et l’extérieur des disques transparents.
