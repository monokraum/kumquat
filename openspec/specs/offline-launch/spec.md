# offline-launch Specification

## Purpose
Livrer une application précompilée avec son serveur HTTP local et un diagnostic de backend.

## Requirements

### Requirement: Lancement hors ligne

Le projet SHALL fournir un dossier précompilé transférable qui se lance en ouvrant `app/index.html` sur disque dans Edge ou Chrome, sans serveur ni installation. Il SHALL aussi prendre en charge le lancement HTTP local avec Node.js. Les deux modes SHALL fonctionner sans accès externe et afficher le diagnostic WebGPU.

#### Scenario: Ouverture depuis un fichier local

- **WHEN** l’utilisateur ouvre `app/index.html` depuis le dossier décompressé dans un navigateur compatible WebGPU, avec accès externe coupé et sans serveur local
- **THEN** la scène de calibration se charge et le diagnostic affiche le backend actif.

#### Scenario: Chargement des scènes depuis un fichier local

- **WHEN** l’utilisateur choisit le studio éclairé ou importe un GLB autonome depuis la page ouverte sur disque
- **THEN** la scène choisie remplace la scène courante sans requête HTTP.

#### Scenario: Vérification avec le livrable du MVP

- **WHEN** le dossier généré est démarré sur l’interface locale, avec accès externe coupé
- **THEN** la scène de démonstration se charge et le diagnostic indique si WebGPU est actif.

#### Scenario: API disponible sans adaptateur

- **WHEN** le navigateur expose WebGPU et que la demande d’adaptateur ne retourne aucun résultat
- **THEN** l’application nomme l’absence d’adaptateur et indique que le GLB sera chargé après l’initialisation du rendu.
