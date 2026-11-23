# Design

## Context

La capture actuelle utilise six caméras de perspective à 90° par œil. Le panorama se construit à partir de ces faces. La reprojection stéréo convertit les pixels de la zone active en directions dans la scène et la carte montre les textures de la projection choisie.

## Decisions

- Pour l’EAC, stocker les six faces dans un atlas de trois colonnes sur deux lignes. Transformer les coordonnées de chaque face par tangente à la capture et par arctangente à la lecture. Afficher les six faces en croix dans l’interface.
- Pour l’octaédrique, produire une texture carrée avec l’avant au centre et l’arrière replié vers les bords. Replier aussi les échantillons du filtre bilinéaire qui dépassent du carré. À 2508 × 2508, le total de pixels est proche de celui des six faces de 1024 × 1024.
- Utiliser six cibles de perspective intermédiaires de 2048 × 2048, partagées entre les deux yeux, pour échantillonner les nouvelles cartes. Garder les cartes finales par œil en cache pour la scène et l’écart interoculaire actuels. Une modification de la visée réutilise ces cartes.
- Construire un matériau de composition par mode de rendu pour ne lier que les textures utilisées. Le rendu direct garde sa propre référence suréchantillonnée.
- Partager le découpage par face des contours cubemap et EAC. Approcher les courbes équiangulaires par segments. Sur le carré octaédrique, découper chaque bord du champ de vision là où le rayon traverse un plan de l’octaèdre. Chaque morceau se projette dans un triangle sans traverser une coupure artificielle.

## Risks / Trade-offs

- La première sélection d’une des nouvelles projections demande une capture haute résolution. Le coût dépend du GPU et de la scène. Le budget de pixels comparé concerne les cartes finales.
- Le filtrage EAC conserve le même échantillonnage au plus proche que la cubemap de comparaison. L’atlas limite chaque lecture à la face choisie.
