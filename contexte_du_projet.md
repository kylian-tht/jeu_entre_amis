# Document de Contexte et d'Architecture - Projet "Priorities (Local Web App)"

## 1. Vision Globale du Projet
L'objectif est de développer une application web multijoueur en réseau local, fortement inspirée du jeu de société "Priorities". 
Les joueurs se connectent à une session locale depuis leurs smartphones pour voter pour des thèmes, recevoir une liste de mots/concepts, les classer par ordre de préférence (du plus aimé au plus détesté), puis comparer leurs classements individuels avec un classement de groupe débattu en direct.

**Cas d'usage cible :** Le jeu doit pouvoir être transporté sur une clé USB ou téléchargé depuis GitHub sous la forme d'un exécutable unique (`.exe`). Il doit pouvoir être lancé sur n'importe quel PC Windows d'un double-clic, créant un serveur local sans nécessiter l'installation de Node.js, Docker, ou d'une connexion internet externe.

## 2. Choix Techniques
- **Backend :** Node.js avec Express.js (pour servir les fichiers statiques) et Socket.IO (pour la communication en temps réel bidirectionnelle).
- **Frontend :** HTML, CSS et JavaScript Vanilla (Mobile-First obligatoire). L'interface doit être conçue pour un écran de smartphone (responsive, gros boutons, interface épurée).
- **Librairie clé :** `SortableJS` (ou équivalent) pour gérer le drag-and-drop tactile natif des blocs/cartes sur mobile de manière fluide.
- **Stockage de données :** En mémoire (RAM) uniquement côté serveur. Pas de base de données persistante (MongoDB, SQL, etc. sont proscrits pour garder le projet ultra-léger).
- **Déploiement / Build final :** Le projet sera compilé en une application autonome (`.exe`) en utilisant un outil comme `pkg`, `nexe` ou la fonctionnalité "Single Executable Application" native de Node.js.

## 3. Déroulement du Jeu (Game Loop)
1. **Lobby (Salle d'attente) :**
   - Le joueur accède à l'IP locale du PC (ex: `http://192.168.x.x:3000`).
   - Saisie du pseudo.
   - Affichage en temps réel des joueurs connectés.
   - Le créateur lance la partie.

2. **Vote du Thème :**
   - Affichage de plusieurs thèmes possibles.
   - Les joueurs votent. 
   - *Règle spécifique :* En cas d'égalité, le serveur tranche aléatoirement. Une petite animation CSS doit annoncer le thème gagnant.

3. **Le Plateau Personnel (Classement) :**
   - Le serveur envoie 5 à 6 mots aléatoires liés au thème choisi.
   - Le joueur utilise le tactile (appui long + déplacement) pour ordonner les cartes de "Ce que je préfère" (en haut) à "Ce que je déteste" (en bas).
   - Un bouton "Valider" fige ce classement.

4. **Débat et Joker :**
   - Les joueurs débattent à l'oral pour créer le "Classement du groupe".
   - Pendant cette phase, un bouton "Joker" permet à chaque joueur de faire une modification secrète et de dernière minute sur son propre classement.

5. **Résultats et Scores :**
   - Le classement du groupe est validé.
   - Le système compare les listes individuelles avec la liste du groupe.
   - Attribution des points et affichage du tableau des scores final.

## 4. Structure de Fichiers Souhaitée (Arborescence)
Bien que le projet sera compilé à la fin, l'environnement de développement doit suivre cette structure claire :
```text
/
├── server.js              # Point d'entrée Backend, logique Socket.IO et routes Express
├── package.json           # Dépendances (express, socket.io, sortablejs) et scripts de build
├── data/
│   └── themes.json        # Base de données locale (JSON) contenant les thèmes et les mots
└── public/                # Fichiers servis au client (Frontend)
    ├── index.html         # Fichier HTML unique (Single Page Application)
    ├── css/
    │   └── style.css      # Styles Mobile-first et animations
    └── js/
        └── app.js         # Logique côté client (Socket.IO client, DOM manipulation, SortableJS)
```

## 5. Directives pour l'Agent de Code (Règles strictes)
- **Code par étapes :** Ne génère jamais tout le projet d'un coup. Demande toujours à valider une étape avant de passer à la suivante (Ex: Étape 1 = Serveur base, Étape 2 = Lobby, Étape 3 = Vote, etc.).
- **Modulaire et Commenté :** Le code doit être clair, indenté et commenté en français.
- **Chemins explicites :** À chaque génération de code, précise dans quel fichier (ex: `public/js/app.js`) le code doit être inséré.
- **Focus Mobile :** Pense constamment à l'UX sur smartphone (taille des textes, zones de clic, fluidité du drag-and-drop).