### 📋 Règles et Logique du Mode "Quick Splash" (Mode Créatif)

Bonjour Antigravity. Ce document décrit les règles et la logique technique d'un nouveau mode de jeu à implémenter dans notre application web locale, en parallèle du jeu principal "Priorities". Ce mode, nommé provisoirement "Quick Splash", repose sur la création de texte, le bluff et le classement via `SortableJS`. Il s'intègre dans l'architecture définie dans `contexte_du_projet.md`.

#### 1\. Transition depuis le Lobby (L'Interface)

* **Intégration transparente :** Le joueur ne quitte jamais le lobby principal (avec le QR code et la liste des connectés).  
* **Bouton "Switch Mode" :** En haut à droite de l'écran principal, un bouton avec une icône de flèches circulaires permet de basculer entre les modes de jeu.  
* **Animation et Thème :** Lors du clic sur le bouton "Switch", une animation visuelle (type onde de choc) modifie le thème colorimétrique de la page (ex: passage du violet néon à des tons orange/cyan) et remplace le grand titre "Priorities" par "Quick Splash". Le lobby (QR code \+ liste des joueurs) reste intact.  
* **Lancement :** Lorsque le créateur clique sur "Lancer la partie", le jeu démarre directement sur la Phase 1 du mode sélectionné.

#### 2\. Structure Générale de la Partie

* **Nombre de manches :** Le nombre total de manches dans une partie est strictement égal au nombre de joueurs connectés (ex: 3 joueurs \= 3 manches).  
* **Données :** Les phrases, réponses et scores sont stockés temporairement en mémoire vive (RAM) sur le serveur Node.js pour la durée de la partie.

#### 3\. Phase 1 : Le Setup (Création des Amorces)

*Au lancement du jeu (avant le début de la Manche 1).*

* **Action Joueur :** Sur son smartphone, chaque joueur doit créer une "Amorce" (la phrase qui servira de base pour une manche).  
* **Interface :** Le joueur a le choix via deux boutons :  
  1. **"Texte à trous"** (ex: *"Le secret pour une vie heureuse, c'est de manger du \_\_\_ tous les matins."*)  
  2. **"Question"** (ex: *"Pourquoi les extraterrestres ne nous ont-ils pas encore contactés ?"*)  
* **Bouton "Idée Magique" :** S'il n'a pas d'idée, un petit bouton permet de générer automatiquement une amorce tirée aléatoirement depuis notre fichier `data/themes.json`.  
* **Transition :** Une fois que tous les joueurs ont validé leur Amorce, la Manche 1 commence.

#### 4\. Phase 2 : L'Écriture (Déroulement d'une Manche)

* **Affichage de l'Amorce :** Le serveur Socket.IO tire au sort l'une des Amorces créées à la Phase 1 (une Amorce différente à chaque manche) et l'affiche en grand sur l'écran principal (PC/TV) ET sur les smartphones.  
* **Saisie des réponses :** Un Timer se lance (ex: 45 secondes). **Tous les joueurs** (y compris l'auteur de l'amorce) utilisent leur smartphone pour taper leur réponse.  
* **Le Bot "Passe-Partout" (Mécanique Secrète) :** Côté serveur, Node.js génère automatiquement une "réponse passe-partout" (ex: *"C'est exactement ce que je pensais"*, *"La réponse D"*) piochée dans une section dédiée du `data/themes.json`. Cette phrase est ajoutée secrètement au pool des réponses des joueurs.

#### 5\. Phase 3 : Le Classement et le Joker

* **Le Classement (SortableJS) :** Sur leur smartphone, les joueurs reçoivent toutes les réponses anonymisées sous forme de cartes (incluant celle du Bot). Ils utilisent le drag-and-drop tactile pour les classer de la "Plus drôle" (en haut) à la "Moins drôle" (en bas).  
* **Le Joker "Sniper" :** Pendant la phase de classement, un bouton "Joker" permet aux joueurs de sélectionner UNE réponse et de tenter de deviner quel joueur l'a écrite (accusation secrète).

#### 6\. Phase 4 : Révélation et Calcul des Scores

*Une fois que tout le monde a validé son classement, l'écran principal révèle les auteurs de chaque phrase. Le serveur calcule les points :*

* **A. Le Score de Base (Classement) :**  
  * Réponse classée 1ère par un joueur : **\+3 points**.  
  * Classée 2ème : **\+2 points**.  
  * Classée 3ème : **\+1 point**.  
* **B. Le Malus du Bot (Le Piège) :**  
  * Si un joueur a placé la "réponse passe-partout" du Bot dans son Top 2 (1ère ou 2ème place), ce joueur **perd 2 points**.  
* **C. Résolution des Jokers "Sniper" :**  
  * Accusation réussie : **\+2 points** pour le Sniper (et **\-1 point** pour la victime démasquée).  
  * Accusation ratée : **\-1 point** pour le Sniper.

*Le jeu passe ensuite à la manche suivante avec une nouvelle Amorce. Le gagnant est désigné à la fin de la dernière manche.*

**Mission pour Antigravity :** Merci de me proposer un plan technique d'intégration de ce mode de jeu (nouvelles routes, événements Socket, modifications HTML/CSS, etc.) étape par étape, afin que l'on puisse valider chaque morceau ensemble avant de commencer le code.