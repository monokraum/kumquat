# Kumquat · Projection DAS

Kumquat compare deux projections sphériques au rendu direct d’une scène GLB locale dans Edge ou Chrome.

## Lancer le livrable hors ligne

Copier le dossier `kumquat-offline`, ouvrir un terminal dans ce dossier et lancer `node launch.mjs`. Ouvrir ensuite `http://127.0.0.1:8080` dans Edge ou Chrome. Node.js et le navigateur déjà présents suffisent. Pour choisir un autre port, utiliser par exemple `node launch.mjs 8090`.

## Utiliser le MVP

La scène de référence s’ouvre au démarrage. Utiliser **Ouvrir un GLB** ou déposer un fichier sur les vues pour charger une autre scène. Le GLB doit contenir ses ressources. Régler la visée au clavier ou en glissant dans les vues. Un lacet positif vise vers la droite et un tangage positif vers le haut.

Chaque ligne affiche un œil. La vue reprojetée apparaît à gauche et le rendu direct à droite. L’image est centrée à l’échelle native dans une trame à marges noires. L’écart interoculaire par défaut est de 63 mm. Les résolutions de projection du MVP sont 1024 × 1024 par face de cubemap et 4096 × 2048 pour la carte équirectangulaire. Le rendu direct prend quatre échantillons par pixel.

## Vérifier le poste cible

1. Couper l’accès réseau externe, lancer le livrable et contrôler **Backend WebGPU actif**. Dans `edge://gpu` ou `chrome://gpu`, vérifier que WebGPU est **Hardware accelerated**.
2. Comparer les vues de la scène de référence de face, à 45° de lacet pour la jonction de cubemap et à 90° de tangage pour le pôle.
3. Choisir **Équirectangulaire** et passer de 179° à −179° de lacet avec le tangage et le roulis à zéro. Le panneau violet arrière doit rester continu de part et d’autre du raccord.
4. Recentrer la visée et régler l’écart interoculaire à zéro. Les vues des deux yeux doivent alors coïncider. Revenir à 63 mm pour retrouver la parallaxe de l’objet proche.

Si Chrome sous Linux affiche **Aucun adaptateur WebGPU**, vérifier que l’accélération graphique est activée dans `chrome://settings/system`, puis redémarrer Chrome. Consulter la ligne WebGPU et la section **Problems Detected** dans `chrome://gpu`. Le message de l’application indique à quelle étape le démarrage s’arrête.

### Chromium Snap avec NVIDIA sous Linux

Avec Chromium Snap 157.0.8103.50 et le pilote NVIDIA 580.178.04, l’application a été testée avec X11 et ANGLE sur Vulkan. Démarrer d’abord `node launch.mjs`, puis lancer Chromium depuis un second terminal avec un profil dédié.

```sh
chromium --user-data-dir="$HOME/snap/chromium/common/kumquat-webgpu" \
  --ozone-platform=x11 --use-angle=vulkan --enable-features=Vulkan \
  --disable-vulkan-surface http://127.0.0.1:8080
```

Le profil dédié permet de lancer cette instance à côté d’un Chromium déjà ouvert. Le bandeau doit afficher **Backend WebGPU actif**, puis les vues de la scène de référence doivent apparaître.

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
- `fixtures/reference-scene/` contient le GLB et sa source de génération.
- `openspec/` contient les changements et les spécifications.
