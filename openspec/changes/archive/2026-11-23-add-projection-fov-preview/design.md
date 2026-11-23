# Conception

## Context

Le pipeline possède déjà six textures de cubemap par œil et génère le panorama à la demande. Les deux branches de comparaison utilisent une ligne de visée et des paramètres de caméra communs.

## Goals / Non-Goals

Afficher une carte lisible pour l’œil choisi, y tracer le champ de la caméra et permettre d’orienter la visée directement sur cette carte.

## Decisions

- Composer l’aperçu WebGPU à partir des textures produites pour la reprojection. Lire une image d’aperçu réduite uniquement quand la scène, l’écart interoculaire, le type de projection ou l’œil affiché change. La lecture GPU est asynchrone et un résultat périmé est ignoré.
- Aligner la face avant au centre de la croix et conserver l’orientation de chaque face utilisée par la capture. Convertir la couleur linéaire en sRGB pour l’affichage de l’aperçu.
- Tracer le contour sur un canevas transparent à partir des quatre bords de la zone active du capteur, avec les paramètres intrinsèques et la rotation commune. Découper les segments contre les limites de chaque face pour la cubemap. Suivre la longitude en continu et reprendre le tracé sur le bord opposé pour le panorama.
- Partager la gestion du glisser entre la carte et les trames. Sur la carte, rapporter le déplacement à sa largeur affichée. Capturer le pointeur pendant le geste et réutiliser les contrôles de lacet et de tangage pour mettre à jour les trames et le contour.

## Risks / Trade-offs

- À un pôle équirectangulaire, la longitude est indéfinie. Le tracé utilise les limites de part et d’autre du pôle pour éviter un trait à travers la carte.
- Un mouvement de visée redessine le canevas du contour. La carte en arrière-plan est réutilisée pour éviter une lecture GPU à chaque mouvement.
