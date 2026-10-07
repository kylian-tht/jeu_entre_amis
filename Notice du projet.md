# 📖 Notice & Guide Exhaustif des Fichiers — Party Games Suite (Priorities & Quick Splash)

Bienvenue dans la documentation officielle de l'architecture du projet.  
Ce guide détaille le rôle, le contenu et le fonctionnement de **chaque fichier et dossier** du projet pour faciliter la maintenance, les évolutions ou la reprise par un autre développeur ou une IA.

---

## 🗂️ Arborescence Globale du Projet

```text
Priorities/
├── 📜 server.js                      # Cœur Backend & Moteur de jeu (Node.js + Express + Socket.IO)
├── 📦 package.json                   # Dépendances npm, scripts de build et configuration pkg
├── 🔒 package-lock.json              # Arbre verrouillé des dépendances npm
├── 🙈 .gitignore                     # Règles d'exclusion Git (node_modules, builds dist, logs)
├── 🚀 Lancer-Priorities.bat          # Lanceur Windows 1-clic pour démarrer le serveur local
├── ⚙️ start.bat                      # Script batch alternatif de démarrage rapide
├── 🖼️ favicon.jpg                    # Icône festive principale du jeu
├── 📖 README.md                      # Documentation d'accueil GitHub (présentation, badges, installation)
├── 📖 NOTICE_DES_FICHIERS.md         # Ce fichier : Guide technique complet fichier par fichier
├── 📋 Regles_Quick_Splash.md         # Règles officielles et game design du mode Quick Splash
├── 📋 r_gles_et_game_design.md       # Règles officielles et game design du mode Priorities
├── 📋 th_mes_et_listes_du_jeu.md     # Spécifications détaillées des thèmes et listes de mots
├── 📋 contexte_du_projet.md          # Vision produit, intentions et historique du projet
├── 🤖 PROMPT_IA_CONTEXTE_PROJET.md   # Fiche de contexte synthétique pour injection dans une IA
│
├── 📂 data/                          # Données, contenus de jeu et persistance JSON
│   ├── themes.json                   # Banque des thèmes (Priorities), amorces et bot (Quick Splash)
│   ├── themes.backup.json            # Copie de sauvegarde sécurisée du fichier themes.json
│   └── scores.json                   # Sauvegarde permanente des statistiques et victoires des joueurs
│
├── 📂 public/                        # Application Web servie aux clients (TV & Mobiles)
│   ├── index.html                    # Interface web des smartphones (manette des joueurs)
│   ├── tv.html                       # Interface web de l'écran TV (grand écran hôte)
│   ├── favicon.jpg                   # Favicon servi aux navigateurs
│   ├── 📂 css/
│   │   └── style.css                 # Feuille de styles unique (Dark mode Soirée VIP, responsive, animations)
│   ├── 📂 js/
│   │   ├── app.js                    # Logique client mobile (Sortable, saisie, sniper, modération chef)
│   │   ├── tv.js                     # Logique client TV (rendu des phases, animations, scoreboard, modération)
│   │   ├── audio.js                  # Synthétiseur de sons Web Audio API (100% autonome, zéro fichier MP3)
│   │   ├── confetti.js               # Moteur Canvas natif de confettis et feux d'artifice
│   │   └── commun.js                 # Utilitaires partagés (fabrique DOM sécurisée, helpers)
│   └── 📂 lib/
│       └── 📂 sortable/
│           └── Sortable.min.js       # Librairie embarquée hors ligne pour le drag-and-drop tactile
│
├── 📂 dist/                          # Distribution compilée en binaire autonome
│   ├── priorities.exe                # Exécutable autonome Windows x64 (Node.js + code packagé)
│   └── LISEZ-MOI.txt                 # Guide d'utilisation de l'exécutable autonome
│
└── 📂 dist-portable/                 # Distribution portable clé en main
    ├── server.js                     # Serveur Node.js autonome
    ├── package.json                  # Métadonnées du serveur
    ├── Lancer-Priorities.bat         # Lanceur portable 1-clic
    ├── LISEZ-MOI-PORTABLE.txt        # Notice d'instructions portable
    ├── 📂 data/                      # Données de jeu intégrées
    └── 📂 public/                    # Assets web statiques intégrés
```

---

## 🚀 Racine du Projet

### 1. `server.js` (Backend Node.js & Moteur de Jeu)
- **Rôle :** Cerveau central de l'application. Gère le serveur HTTP Express, les connexions WebSockets Socket.IO en temps réel, la machine à états de chaque mode de jeu et la persistance des données.
- **Fonctionnalités clés :**
  - **Serveur Web & Réseau Local :** Distribue les assets statiques (`public/`) et détecte l'adresse IP locale de la machine pour générer les QR codes et URLs d'accès.
  - **Ouverture Automatique :** Déclenche automatiquement l'ouverture de l'écran TV (`http://localhost:3000/tv`) au démarrage sur Windows, macOS ou Linux.
  - **Moteur Multi-Modes :**
    - **Mode Priorities :** Phases `lobby` ➡️ `vote` ➡️ `annonce` ➡️ `classement` ➡️ `debat` ➡️ `resultats_manche` ➡️ `fin_partie`. Attribution des points d'écart, gestion des jokers et élection des trophées (Le Caméléon 🦎, Le Grand Incompris 👽, Le Stratège 🃏).
    - **Mode Quick Splash :** Phases `qs_setup` (choix amorce trou/question) ➡️ `qs_ecriture` (chrono 45s avec bips stress) ➡️ `qs_classement` (drag & drop secret + pari Sniper) ➡️ `qs_revelations` (atterrissage animé des cartes et scoring avec règle du self-vote à 1,5 pt) ➡️ `qs_podium` (célébration, confettis, stats décalées).
  - **Punchlines du Bot 🤖 :** Intègre un bot d'appoint qui génère automatiquement des réponses décalées tirées de `themes.json` si les joueurs le souhaitent.
  - **Modération & Contrôle de Salle :**
    - Exclusion de joueurs (`kickerJoueur`).
    - Transmission de la couronne de chef (`nommerChef`).
    - **Retour au lobby en 1 clic (`retourLobby`)** : Réinitialise proprement la partie en cours tout en conservant les joueurs connectés, utilisable depuis le mobile du chef ou directement depuis la TV.
  - **Persistance des Scores :** Lecture et écriture atomique dans `data/scores.json` à l'issue des parties.

### 2. `package.json` & `package-lock.json`
- **Rôle :** Fichiers standards de configuration de l'écosystème Node.js / npm.
- **Scripts configurés :**
  - `npm start` : Démarre `server.js`.
  - `npm run build:exe` : Compile le projet complet en un exécutable binaire autonome pour Windows (`dist/priorities.exe`) via `@yao-pkg/pkg`.
- **Dépendances principales :**
  - `express` : Serveur HTTP léger et rapide.
  - `socket.io` : Moteur de communication bidirectionnelle en temps réel.
  - `qrcode` : Générateur dynamique des images QR Code pour rejoindre la salle.
  - `sortablejs` : Librairie de réordonnancement par glisser-déposer.
  - `@yao-pkg/pkg` (dev) : Outil de compilation en exécutable Windows x64.

### 3. `.gitignore`
- **Rôle :** Définit les fichiers et répertoires qui ne doivent jamais être poussés sur Git :
  - `node_modules/` (dépendances installées via npm).
  - `dist/` et `dist-portable/` (fichiers binaires compilés et distributions volumineuses).
  - Fichiers temporaires de tests, `.log` et caches système (.DS_Store, Thumbs.db).

### 4. `Lancer-Priorities.bat` & `start.bat`
- **Rôle :** Scripts exécutables batch pour Windows.
- **Usage :** Permettent de démarrer le jeu d'un simple double-clic sans ouvrir de terminal.

### 5. `favicon.jpg`
- **Rôle :** Image festive représentant l'identité visuelle du jeu, utilisée comme icône d'onglet par les navigateurs.

### 6. Documents de Règles et de Conception (.md)
- **`README.md` :** Vitrine officielle GitHub avec présentation des 2 modes, badges de statut, guide d'installation, compilation du `.exe` et licence.
- **`Regles_Quick_Splash.md` :** Spécification complète du mode Quick Splash (mécanique des amorces, chrono, sniper, scoring adapté au vote pour soi-même, bot d'appoint, statistiques de fin).
- **`r_gles_et_game_design.md` :** Document fondateur des règles du jeu de société Priorities (gestion du capitaine, du débat, des jokers et du calcul des pénalités d'écart).
- **`th_mes_et_listes_du_jeu.md` :** Liste et descriptions des thèmes et listes de propositions du jeu Priorities.
- **`contexte_du_projet.md` :** Historique du projet, contraintes techniques (mobile-first, WebSockets, ambiance party game VIP).
- **`PROMPT_IA_CONTEXTE_PROJET.md` :** Fiche de synthèse technique prête à être fournie à un grand modèle de langage pour accélérer toute nouvelle tâche de développement.

---

## 📁 Dossier `data/` (Données & Persistance)

### 1. `data/themes.json`
- **Rôle :** Banque textuelle contenant l'intégralité du contenu éditorial :
  - **Pour Priorities :** Catégories thématiques avec intitulé, description, emoji, consignes haut/bas et listes de propositions variées.
  - **Pour Quick Splash :**
    - Amorces de phrases à trous (`quicksplash_trous`).
    - Amorces de questions ouvertes (`quicksplash_questions`).
    - Réponses et punchlines pré-enregistrées pour le bot IA (`quicksplash_bot_reponses`).

### 2. `data/themes.backup.json`
- **Rôle :** Fichier de sauvegarde de secours du dictionnaire de thèmes.

### 3. `data/scores.json`
- **Rôle :** Sauvegarde persistante de l'historique des joueurs (par pseudo) :
  - Nombre de victoires finales (#1).
  - Nombre de parties complétées.
  - Meilleur score historique.
  - Points cumulés à vie (alimente le Panthéon sur la TV).

---

## 📁 Dossier `public/` (Client Web — Mobile & TV)

### 1. `public/index.html` (Manette Mobile des Joueurs)
- **Rôle :** Application Web monopage (SPA) optimisée pour smartphones et tablettes.
- **Composants inclus :**
  - **Écran d'entrée :** Saisie du pseudo avec validation tactile.
  - **Lobby :** Choix d'avatar VIP, liste des joueurs connectés, switcher animé de mode de jeu.
  - **Modale de réglages Chef (Roue crantée ⚙️) :**
    - Liste des joueurs connectés pour transmission de couronne 👑 ou exclusion ❌.
    - **Section Contrôle de la partie :** Bouton `🔄 Retourner au lobby` avec invite de confirmation.
  - **Écrans Priorities :**
    - Sélection et vote de thème.
    - Classement tactile des 5 cartes via glisser-déposer.
    - Écran de débat avec barre de mini-réactions en direct (🔥, 💥, 🤡, 💀) et tiroir secret du Joker.
  - **Écrans Quick Splash :**
    - Choix de l'amorce de la manche pour le Chef (Trou 📝 ou Question ❓).
    - Zone de rédaction avec compteur de caractères et chrono de 45 secondes.
    - Classement tactile des réponses et sélection secrète de la cible Sniper 🎯.
  - **Résultats & Podium :** Affichage personnalisé des points gagnés, podium final et célébrations.

### 2. `public/tv.html` (Interface Grand Écran TV)
- **Rôle :** Interface grand format pour TV de salon, rétroprojecteur ou moniteur principal.
- **Composants inclus :**
  - **Ambiance Visuelle :** Fond sombre avec orbes lumineuses dynamiques réactives et animations d'ondes de choc lors du changement de mode.
  - **Lobby TV :** QR Code dynamique et URL directe pour rejoindre en un scan.
  - **Modale de modération TV (Roue crantée ⚙️) :** Permet d'exclure un joueur, de désigner un chef ou de déclencher un retour au lobby directement depuis l'écran TV.
  - **Modale Scoreboard (Panthéon 🏆) :** Tableau d'honneur des joueurs avec tri interactif par victoires, parties jouées ou points cumulés.
  - **Animations de Manche :**
    - Roue des thèmes animée (Priorities).
    - Arrivée en direct des réponses rédigées avec animations festives (Quick Splash).
    - Révélation étape par étape des votes avec atterrissage dynamique des cartes et affichage des points (+1, +2, +1.5, etc.).
    - Podium 3D animé, statistiques décalées, confettis et feux d'artifice.
  - **Boutons d'outils :** Plein écran (`⛶`) et activation/coupure audio (`🔊`).

### 3. `public/css/style.css` (Feuille de Styles Globale)
- **Rôle :** Design unifié et responsive de l'ensemble du projet.
- **Points caractéristiques :**
  - **Mode Sombre Forcé (`color-scheme: dark`) :** Garantit un contraste parfait sur tous les téléphones (iOS et Android) quel que soit le réglage système.
  - **Direction Artistique "Soirée VIP" :** Dégradés néons (violet électrique, rose fuchsia, cyan, or), cartes en Glassmorphism translucide et ombres portées brillantes.
  - **Animations Avancées :** Ondes de choc expansives (`@keyframes ondeDeChoc`), orbes lumineuses flottantes (`.lueur-fond-1`, `.lueur-fond-2`), compte à rebours stressant (`.chrono-stress`), badges animés et atterrissage dynamique des cartes.
  - **Styles des Modales :** Design des panneaux de modération pour la TV et le mobile, boutons de retour au lobby avec état actif et désactivé.

### 4. `public/js/app.js` (Script Client Mobile)
- **Rôle :** Logique applicative exécutée sur les téléphones des joueurs.
- **Responsabilités :**
  - Connexion Socket.IO avec reconnexion automatique via `localStorage`.
  - Intégration de SortableJS pour le réordonnancement tactile des cartes.
  - Gestion du modal de modération du Chef (nomination, kick, retour lobby).
  - Chronomètre réactif de Quick Splash avec alertes sonores de stress.
  - Système de pari Sniper et envoi sécurisé des classements.
  - Retours tactiles par vibration (`navigator.vibrate`) lors des interactions.

### 5. `public/js/tv.js` (Script Client TV)
- **Rôle :** Régisseur d'affichage et d'animation sur le grand écran.
- **Responsabilités :**
  - Synchronisation temps réel avec l'état du serveur (`etat`).
  - Gestion des transitions visuelles entre les deux modes de jeu sans coupure d'arrière-plan.
  - Affichage en direct des réponses soumises lors de la phase d'écriture Quick Splash.
  - Animation de révélation des points et attribution des bonus/malus.
  - Mise en scène du podium de fin de partie avec statistiques personnalisées (meilleurs snipers, cibles préférées du bot, etc.).
  - Gestion de l'audio global et du mode plein écran.

### 6. `public/js/audio.js` (Moteur Sonore Web Audio API)
- **Rôle :** Synthétiseur d'effets sonores exploitant nativement l'API Web Audio du navigateur.
- **Avantage clé :** Aucun fichier `.mp3` ou `.wav` à télécharger, temps de latence quasi nul et fonctionnement garanti 100% hors ligne.
- **Bruitages intégrés :** Clics rythmés de la roulette, bips de stress dans les 10 dernières secondes, sonneries de validation, pops de réactions, fanfare triomphale et explosions festives.

### 7. `public/js/confetti.js` (Moteur de Confettis Canvas)
- **Rôle :** Système de particules léger rendu directement dans un élément `<canvas>`.
- **Comportement :** Génère des gerbes multicolores et des pluies d'artifice à 60 FPS lors des victoires et des révélations de podium, sans dépendance externe.

### 8. `public/js/commun.js` (Utilitaires Partagés)
- **Rôle :** Bibliothèque d'aides partagées entre le mobile et la TV.
- **Contenu :** Fonction sécurisée de création d'éléments DOM (`creerElement`), formatage de texte et gestion de temporisation.

### 9. `public/lib/sortable/Sortable.min.js`
- **Rôle :** Version minifiée de la librairie SortableJS intégrée localement pour assurer le bon fonctionnement du glisser-déposer sans dépendre d'une connexion Internet externe.

---

## 📦 Dossiers de Distribution (`dist/` & `dist-portable/`)

### 1. `dist/`
- **`dist/priorities.exe` :** Exécutable compilé tout-en-un pour Windows x64. Contient le runtime Node.js et l'intégralité du code source pour démarrer le serveur sans aucune installation préalable.
- **`dist/LISEZ-MOI.txt` :** Instructions de lancement pour l'utilisateur final.

### 2. `dist-portable/`
- **Rôle :** Version miroir complète prête à être copiée sur clé USB, contenant le serveur Node.js, les fichiers web et les données.
- **`Lancer-Priorities.bat` :** Lanceur batch pour la version portable.
- **`LISEZ-MOI-PORTABLE.txt` :** Notice d'utilisation pour la distribution portable.
