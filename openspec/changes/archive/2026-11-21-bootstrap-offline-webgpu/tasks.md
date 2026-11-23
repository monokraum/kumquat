# Tâches

## 1. Implémentation et vérification

- [x] 1.1 Créer le build, le lanceur et le README. Vérifier le démarrage du dossier copié et le backend via Chromium.
- [x] 1.2 Vérifier la livraison hors ligne avec accélération matérielle sur le poste cible.
- [x] 1.3 Distinguer les échecs d’accès à WebGPU et le chargement GLB. Vérifier sous Chromium Linux sans adaptateur et avec WebGPU logiciel.

Recette du ZIP extrait sous Chromium Snap 157.0.8103.50 sur RTX 3050, pilote 580.178.04, avec la commande X11/Vulkan documentée dans le README. Playwright a confirmé un adaptateur WebGPU NVIDIA matériel et a bloqué les requêtes externes.
