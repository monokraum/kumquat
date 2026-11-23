# Scène de référence du MVP

Charger `reference-scene.glb` comme scène locale. Le fichier contient les géométries et les matériaux non éclairés. Le repère est en mètres, avec **+Y vers le haut** et **−Z vers l’avant**. L’origine est le point de vue nominal.

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

## Régénérer le GLB

Depuis la racine du projet, sur le poste de développement :

```sh
npm ci --prefix fixtures/reference-scene
npm run generate --prefix fixtures/reference-scene
```

Sur le poste cible, charger directement le GLB livré avec l’application.
