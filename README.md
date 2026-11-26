# Kumquat · Projection DAS

Kumquat compare cinq projections sphériques au rendu direct d’une scène GLB locale dans Edge ou Chrome.

## Lancer le livrable hors ligne

Décompresser le ZIP sur le poste cible et ouvrir `app/index.html` dans Edge ou Chrome. Le navigateur peut ouvrir ce fichier depuis son menu ou par glisser-déposer. Garder le dossier `app` entier pour que la page retrouve le script et la feuille de style. Ce mode fonctionne sans serveur local ni installation.

Pour utiliser le serveur HTTP inclus, ouvrir un terminal dans le dossier `kumquat-offline`, lancer `node launch.mjs`, puis ouvrir `http://127.0.0.1:8080`. Pour choisir un autre port, utiliser par exemple `node launch.mjs 8090`.

## Utiliser le MVP

La scène de calibration s’ouvre au démarrage. Le sélecteur de scènes de référence donne aussi accès au **Studio éclairé** et au **Canyon stylisé**. Utiliser **Ouvrir un GLB** ou déposer un fichier dans la zone principale pour charger un GLB autonome. L’application utilise les lumières du fichier quand elles sont présentes.

Les onglets occupent la fenêtre sans défilement. Le bouton en haut à droite active le plein écran du navigateur.

- **Vue reprojetée** affiche la carte et le champ de vision au-dessus des deux trames par œil, gauche puis droite. La carte s’ouvre sur l’œil gauche. Glisser directement sur la carte règle la visée et actualise les deux trames.
- **Rendu direct** affiche les deux rendus directs suréchantillonnés. Les réglages de visée et d’écart interoculaire sont communs aux deux onglets. Régler la visée au clavier ou en glissant sur une trame. Un lacet positif vise vers la droite et un tangage positif vers le haut.
- **Scène 3D** affiche la scène et les deux volumes de visée en vue globale. Glisser pour orbiter, tenir Maj en glissant pour déplacer la caméra, utiliser la molette pour zoomer. Choisir **Depuis le centre** pour regarder dans toutes les directions en glissant et se déplacer avec les flèches, **ZQSD** ou **WASD**. **Espace** et **Maj** règlent la hauteur. **Recentrer** réinitialise la caméra dans le mode actif et **Vue globale** revient à l’orbite. La caméra d’inspection est indépendante des caméras d’analyse.

L’image active de 1600 × 1024 est centrée dans une trame de 1920 × 1080. Les aperçus conservent ce rapport d’aspect. L’écart interoculaire par défaut est de 63 mm. Le rendu direct utilise quatre échantillons par pixel.

| Projection | Résolution par œil | Carte |
| --- | --- | --- |
| Cubemap | 6 faces de 1024 × 1024 | Croix |
| Équirectangulaire | 4096 × 2048 | Panorama |
| Cubemap équiangulaire (EAC) | 6 faces de 1024 × 1024 | Croix |
| Octaédrique | 2508 × 2508 | Carré, avec l’avant au centre et l’arrière replié aux bords |
| Stéréographique | Deux cases de 2048 × 2048 | Disques avant et arrière côte à côte |

Active **Repères d’angle** dans la carte pour afficher les mêmes cercles de rayon angulaire de 6° sur les cinq projections. Compare leur forme en passant de **Stéréographique** à **Équirectangulaire**. Les cercles stéréographiques gardent leur forme et leur taille varie selon leur emplacement. Un repère à cheval sur les deux hémisphères apparaît sur les deux disques.

## Vérifier le poste cible

1. Couper l’accès réseau externe, ouvrir `app/index.html` et contrôler **WebGPU actif**. Dans `edge://gpu` ou `chrome://gpu`, vérifier que WebGPU est **Hardware accelerated**.
2. Comparer les onglets **Vue reprojetée** et **Rendu direct** de face, à 45° de lacet pour la jonction de cubemap et à 90° de tangage pour le pôle.
3. Choisir **Équirectangulaire** et passer de 179° à −179° de lacet avec le tangage et le roulis à zéro. Le panneau violet arrière doit rester continu de part et d’autre du raccord.
4. Recentrer la visée et régler l’écart interoculaire à zéro. Les vues des deux yeux doivent alors coïncider. Revenir à 63 mm pour retrouver la parallaxe de l’objet proche.
5. Dans la carte de projection, sélectionner l’œil droit. Vérifier que le contour passe sur deux faces en cubemap à 45° de lacet, puis apparaît sur les deux bords du panorama à 179° en équirectangulaire.
6. Ouvrir **Scène 3D**. Tester les mouvements de caméra et le recentrage, puis revenir dans un onglet stéréo pour retrouver les réglages d’analyse.
7. Choisir **Cubemap équiangulaire (EAC)** et vérifier le raccord à 45° de lacet. Choisir **Octaédrique**, viser à 179° de lacet puis glisser sur la carte. Le contour arrière se répartit près des coins du carré et les deux trames suivent la visée.
8. Choisir **Stéréographique** et passer de 85° à 95° de lacet. Le contour se répartit entre les deux disques et les trames suivent le mouvement. Active **Repères d’angle** et compare le repère à 60° de tangage au même repère en équirectangulaire.
9. Choisir **Canyon stylisé**, ouvrir **Scène 3D**, puis **Depuis le centre**. Regarder des deux côtés puis derrière soi en glissant. Avancer au clavier, se recentrer et revenir à la vue globale pour retrouver les volumes de visée.

Si Chrome sous Linux affiche **Aucun adaptateur WebGPU**, vérifier que l’accélération graphique est activée dans `chrome://settings/system`, puis redémarrer Chrome. Consulter la ligne WebGPU et la section **Problems Detected** dans `chrome://gpu`. Le message de l’application indique à quelle étape le démarrage s’arrête.

### Chromium Snap avec NVIDIA sous Linux

Avec Chromium Snap 157.0.8103.50 et le pilote NVIDIA 580.178.04, l’application a été testée avec X11 et ANGLE sur Vulkan. Démarrer d’abord `node launch.mjs`, puis lancer Chromium depuis un second terminal avec un profil dédié.

```sh
chromium --user-data-dir="$HOME/snap/chromium/common/kumquat-webgpu" \
  --ozone-platform=x11 --use-angle=vulkan --enable-features=Vulkan \
  --disable-vulkan-surface http://127.0.0.1:8080
```

Le profil dédié permet de lancer cette instance à côté d’un Chromium déjà ouvert. Le bandeau doit afficher **WebGPU actif**, puis les vues de la scène de référence doivent apparaître.

## Préparer le livrable

Sur le poste de développement, utiliser Node.js 20.19+ ou 22.12+.

```sh
npm ci
npm run package
```

Le dossier à transférer est `release/kumquat-offline`. La commande `npm run dev` lance le serveur de développement.

## Arborescence

- `src/` contient l’interface, la géométrie de caméra et les passes WebGPU.
- `scripts/` contient l’assemblage et le lanceur Node.js.
- `references/` contient les scènes GLB intégrées et le générateur. Ajouter un GLB autonome dans ce dossier, puis reconstruire le livrable pour le faire apparaître dans le sélecteur.
- `openspec/` contient les changements et les spécifications.
