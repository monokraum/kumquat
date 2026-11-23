# offline-launch Specification

## Purpose
Livrer une application précompilée avec son serveur HTTP local et un diagnostic de backend.

## Requirements

### Requirement: Lancement hors ligne

Le projet SHALL fournir un dossier transférable qui se lance localement avec Node.js et un navigateur, sans accès externe. Le backend graphique actif SHALL être affiché.

#### Scenario: Vérification avec le livrable du MVP

- **WHEN** le dossier généré est démarré sur l’interface locale, avec accès externe coupé
- **THEN** la scène de démonstration se charge et le diagnostic indique si WebGPU est actif.

#### Scenario: API disponible sans adaptateur

- **WHEN** le navigateur expose WebGPU et que la demande d’adaptateur sur l’adresse locale ne retourne aucun résultat
- **THEN** l’application nomme l’absence d’adaptateur et indique que le GLB sera chargé après l’initialisation du rendu.
