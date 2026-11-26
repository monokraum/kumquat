# Design

## Context

Le générateur de références Three.js exporte des scènes autonomes et le sélecteur les découvre dans `references/`. Le point de vue nominal des rendus stéréo est l’origine, avec +Y vers le haut et −Z vers l’avant.

## Decisions

- Construire un terrain carré d’une centaine de mètres, avec des maillages aux facettes visibles et des couleurs de sommet. Placer des piles de grès orangé devant le point de vue, des falaises mauves à distance et des reliefs plus bas autour de l’origine. Garder une zone de départ dégagée, avec le sol à environ 1,65 m sous la caméra au centre.
- Générer la scène de façon déterministe dans le dossier `references/`, puis utiliser le même exporteur GLB que les autres scènes. Représenter le ciel dans le GLB pour le rendre visible dans les différentes projections.
- Proposer une vue au centre en plus de la caméra orbitale. Le glissement contrôle la direction du regard et le clavier la translation horizontale ou verticale. Les repères stéréo et la grille sont présentés dans la vue globale.

## Risks / Trade-offs

- Le terrain couvre une zone finie. Les falaises et les reliefs périphériques donnent de la profondeur à la vue à 360° depuis le centre.
- La caméra d’exploration peut traverser la géométrie. La navigation utilise le même repère et le même point de vue nominal pour toutes les scènes.
