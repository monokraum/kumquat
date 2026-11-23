# Lancement hors ligne

## Context

Le poste de destination dispose de Node.js et d’un navigateur avec WebGPU.

## Goals / Non-Goals

Livrer une application précompilée avec son serveur HTTP local et un diagnostic de backend.

## Decisions

TypeScript et Vite préparent toutes les ressources. Un lanceur utilisant uniquement Node.js sert le sous-dossier app sur 127.0.0.1. Le navigateur affiche le backend de Three.js.

Le démarrage demande explicitement un adaptateur WebGPU et un périphérique, puis transmet ce périphérique à Three.js. Les erreurs d’accès à l’API, de sélection de l’adaptateur et d’initialisation du rendu ont des messages dédiés.

## Risks / Trade-offs

Utiliser la scène GLB de référence pour vérifier le résultat avant la validation sur le poste cible.
