# Design

## Context

Le rendu WebGPU réutilise une capture cubique intermédiaire suréchantillonnée pour créer les cartes EAC et octaédrique. Le tracé du champ de vision connaît déjà les raccords de chacune des quatre cartes.

## Decisions

- Ajouter deux cases de 2048 × 2048 par œil dans un atlas de 4096 × 2048. Les hémisphères centrés sur −Z et +Z sont affichés côte à côte. Chaque disque suit la loi radiale `r = tan(θ/2)`, avec le haut vers +Y et la droite relative à son axe de visée.
- Réutiliser les captures cubiques à 2048 × 2048 par face. Échantillonner l’atlas avec un filtre bilinéaire. Prévoir une marge de deux texels et continuer le calcul stéréographique juste au-delà du bord utile de chaque disque pour interpoler au raccord. Masquer ces marges sur la carte.
- Réutiliser l’invalidation par scène et écart interoculaire. Le champ de vision est découpé selon le signe de Z. Chaque morceau est tracé comme une courbe dans le disque correspondant.
- Construire les repères en échantillonnant de vrais cercles de rayon angulaire de 6° sur la sphère. Partager le tracé des raccords avec le champ de vision. Mémoriser les chemins des repères par type de carte, car ils sont fixes. L’option est désactivée au démarrage.

## Risks / Trade-offs

- Une carte conforme préserve la forme locale des repères. Leur taille peut varier avec leur distance au centre du disque.
- Les deux disques occupent des cases carrées. Les coins de l’atlas servent au support de l’échantillonnage et restent masqués dans l’aperçu.

## References

- John P. Snyder, [Map Projections — A Working Manual, projection stéréographique](https://pubs.usgs.gov/pp/1395/report.pdf).
