# Scènes de référence

Les deux fichiers GLB contiennent leurs géométries, matériaux et lumières. Le repère est en mètres, avec **+Y vers le haut** et **−Z vers l’avant**. L’origine est le point de vue nominal.

## Calibration

`reference-scene.glb` contient les panneaux de calibration et deux objets à des distances différentes. Deux lumières directionnelles éclairent l’octaèdre. Les panneaux utilisent des matériaux non éclairés pour garder leurs couleurs de référence.

Chaque panneau possède un réticule central, un coin coloré et une série de marques qui permettent de repérer une face permutée ou inversée.

| Nœud GLB | Position (x, y, z) en m | Vérification |
| --- | --- | --- |
| `axis_negative_z_front` | (0, 0, −8) | Visée centrale |
| `axis_positive_x_right` | (8, 0, 0) | Droite |
| `axis_positive_z_back_seam` | (0, 0, 8) | Raccord arrière pour une longitude `atan2(x, -z)` |
| `axis_negative_x_left` | (−8, 0, 0) | Gauche |
| `axis_positive_y_up` | (0, 8, 0) | Pôle supérieur |
| `axis_negative_y_down` | (0, −8, 0) | Pôle inférieur |
| `cubemap_edge_positive_x_negative_z` | (6, 0, −6) | Jonction des faces +X et −Z |
| `near_box` | (−0,62 ; −0,43 ; −2,5) | Objet proche pour observer la parallaxe |
| `far_octahedron` | (2,4 ; −0,85 ; −10) | Objet lointain pour observer la parallaxe |

## Studio éclairé

`studio-eclaire.glb` réunit une sphère mate, un nœud torique brillant et des volumes à plusieurs distances. Deux lumières directionnelles et une lumière ponctuelle permettent de comparer le relief et les reflets dans les deux branches de rendu.

## Régénérer les GLB

Exécuter les commandes suivantes depuis la racine du projet sur le poste de développement.

```sh
npm ci --prefix references
npm run generate --prefix references
```

Un GLB autonome ajouté à ce dossier apparaît dans le sélecteur après la prochaine génération du livrable avec `npm run package`.
