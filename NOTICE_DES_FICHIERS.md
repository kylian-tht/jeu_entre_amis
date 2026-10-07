# 📖 Notice & Guide des Fichiers — Priorities

Bienvenue dans la documentation officielle du projet **Priorities**.  
Ce guide détaille le rôle de **chaque fichier et dossier** du projet pour que n'importe qui puisse comprendre en un coup d'œil où se trouve chaque fonctionnalité et comment les modifier ou les faire évoluer.

---

## 🗂️ Arborescence Globale du Projet

```text
Priorities/
├── Lancer-Priorities.bat          # Lanceur Windows en 1 clic
├── server.js                      # Cœur Backend (Node.js + Express + Socket.IO)
├── package.json                   # Dépendances et configuration npm
├── package-lock.json              # Versions verrouillées des paquets npm
├── NOTICE_DES_FICHIERS.md         # Ce fichier (notice pour les humains)
├── PROMPT_IA_CONTEXTE_PROJET.md    # Fiche technique complète pour donner à une IA
├── data/
│   ├── themes.json                # Banque officielle des thèmes et des mots
│   └── scores.json                # Sauvegarde permanente des victoires et scores
└── public/                        # Fichiers servis aux navigateurs (TV & Mobile)
    ├── index.html                 # Interface web des smartphones (joueurs)
    ├── tv.html                    # Interface web de la télé (grand écran hôte)
    ├── css/
    │   └── style.css              # Feuille de styles unique (Soirée VIP, mode sombre, responsive)
    └── js/
        ├── app.js                 # Logique client mobile (glisser-déposer, vote, joker, avatars)
        ├── tv.js                  # Logique client TV (affichage manches, minuteur, podium, bulles)
        ├── audio.js               # Synthétiseur de sons Web Audio API (100% autonome, zéro MP3)
        ├── confetti.js            # Moteur de confettis Canvas natif (TV & Vainqueur)
        └── commun.js              # Fonctions utilitaires partagées (DOM, roulette des thèmes)
```

---

## 🚀 Racine du Projet

### 1. `server.js` (Backend Node.js)
- **Rôle :** C'est le moteur central du jeu. Il fait tourner le serveur HTTP avec Express et gère la communication instantanée avec Socket.IO.
- **Ce qu'il fait :**
  - **Serveur web :** Sert les fichiers du dossier `public/` et génère l'URL d'accès réseau local (ex : `http://192.168.0.151:3000`).
  - **Ouverture automatique :** Ouvre automatiquement la page TV (`http://localhost:3000/tv`) au lancement sur Windows, Mac ou Linux.
  - **Gestion des joueurs :** Inscription des pseudos (2 à 8 joueurs), attribution automatique des avatars de soirée, gestion des connexions/déconnexions.
  - **Machine à états (`jeu.phase`) :** Enchaîne les étapes du jeu (`lobby` ➡️ `vote` ➡️ `annonce` ➡️ `classement` ➡️ `debat` ➡️ `resultats_manche` ➡️ `fin_partie`).
  - **Transmission dynamique de la couronne :** Si le chef actuel coupe son téléphone ou ferme son onglet, la couronne passe instantanément au joueur connecté suivant.
  - **Règle anti-triche du Chef sur le Joker :** Empêche le chef de valider un joker dont le classement est 100% identique au consensus de groupe.
  - **Calcul des scores & Trophées :** Attribution des points (0 pt, 1 pt, 3 pts), bonus de +8 pts pour le joker conservé, et élection des trophées (Le Caméléon 🦎, Le Grand Incompris 👽, Le Stratège 🃏).
  - **Persistance des données :** Met à jour le fichier `data/scores.json` à chaque fin de partie.

### 2. `Lancer-Priorities.bat` (Script Windows 1-clic)
- **Rôle :** Permet à l'hôte de lancer le jeu sans jamais toucher à un terminal ou taper une ligne de commande.
- **Fonctionnement :** Double-cliquer dessus lance `npm start`, qui démarre le serveur et ouvre directement la TV avec le QR code dans le navigateur par défaut.

### 3. `package.json`
- **Rôle :** Déclaration du projet Node.js et de ses dépendances :
  - `express` : serveur web HTTP léger.
  - `socket.io` : gestion du temps réel bidirectionnel (WebSockets).
  - `qrcode` : génération du QR code de connexion affiché sur la TV.
  - `sortablejs` : bibliothèque de glisser-déposer tactile sur smartphone.

---

## 📁 Dossier `data/` (Données & Persistance)

### 1. `data/themes.json`
- **Rôle :** Base de données textuelle contenant tous les thèmes et listes de mots du jeu.
- **Structure de chaque thème :**
  - `nom` : Intitulé affiché (ex. : *"Les trucs surcotés"*, *"Mode hardcore"*, *"Crime culinaire"*, *"Red flag"*, *"Thème général"*).
  - `description` : Phrase explicative affichée lors du vote.
  - `emoji` : Icône représentative.
  - `consigne_haut` : Critère du haut de la pile (ex. : *"Totalement surcoté"*, *"Gros red flag"*).
  - `consigne_bas` : Critère du bas de la pile (ex. : *"Mérite sa hype"*, *"Passe crème"*).
  - `mots` : Tableau d'au moins 50 mots/situations uniques tirés au sort pendant les manches.

### 2. `data/scores.json`
- **Rôle :** Sauvegarde persistante de la carrière des joueurs basée sur leur pseudo.
- **Données conservées :**
  - Nombre de parties jouées.
  - Nombre de victoires finales (#1).
  - Meilleur score en une seule manche et sur une partie entière.
  - Cumul total de points à vie.

---

## 📁 Dossier `public/` (Frontend TV & Téléphones)

### 1. `public/index.html` (Interface Smartphone)
- **Rôle :** Page unique (SPA - Single Page Application) chargée par les joueurs sur leur téléphone après avoir scanné le QR code.
- **Sections intégrées :**
  - Écran de bienvenue (saisie du pseudo).
  - Salle d'attente (Lobby VIP) avec carte d'avatar personnalisable et bouton crayon `✏️`.
  - Écran de vote de thème avec sélection tactile.
  - Écran de classement tactile individuel des 5 mots de la manche.
  - Écran de débat avec barre de mini-réactions en direct (🔥, 💥, 🤡, 💀) et tiroir secret pour le Joker.
  - Écran de résultats de manche détaillant les écarts et points gagnés.
  - Écran de podium final, trophées et bilan de carrière personnel.

### 2. `public/tv.html` (Interface Grand Écran / TV)
- **Rôle :** Affichage grand format destiné à la télévision du salon ou à l'écran du PC hôte.
- **Sections intégrées :**
  - Fond animé immersif d'ambiance soirée (orbes lumineuses flottantes et néons).
  - Carte VIP Pass QR Code avec URL en direct.
  - Grille des invités VIP avec cartes animées et couronne dorée flottante 👑.
  - Tableau de bord en 1 seul écran lors des classements (sans scroll).
  - Phase de débat avec classement du groupe en direct et minuteur de 3 minutes.
  - Zone d'envol des bulles de mini-réactions en direct.
  - Podium olympique animé avec affichage des trophées, classement détaillé des manches et statistiques.
  - Barre d'outils discrète en bas à droite : Plein écran (`⛶`) et Mute (`🔊`).

### 3. `public/css/style.css` (Design & Animations)
- **Rôle :** Feuille de style complète réunissant le mobile-first et le grand écran TV.
- **Points clés :**
  - Forçage strict du mode sombre (`color-scheme: dark`) pour garantir un rendu parfait sur iOS et Android quel que soit le réglage du smartphone.
  - Thème Soirée VIP / Nightclub : Dégradés néons fuchsia/cyan/violet, reflets glossy et ombres portées lumineuses.
  - Boutons capsules modernes avec états tactiles réactifs.
  - Animations CSS : lévitation de la couronne, envol des bulles de réaction, pop-in des joueurs et reflets dorés.

### 4. `public/js/app.js` (Logique Smartphone)
- **Rôle :** Script exécuté sur chaque téléphone connecté.
- **Fonctionnalités :**
  - Reconnexion automatique grâce au `localStorage`.
  - Intégration de SortableJS pour réordonner les cartes d'un simple glissement de doigt.
  - Personnalisation d'avatar de soirée en direct via un modal interactif.
  - Envoi des mini-réactions au débat avec limitation anti-spam et retour haptique (vibration).
  - Activation et manipulation du Joker secret.
  - Déclenchement de confettis sur l'écran du gagnant en cas de 1ère place.

### 5. `public/js/tv.js` (Logique Écran TV)
- **Rôle :** Script régissant l'affichage sur la télévision.
- **Fonctionnalités :**
  - Écoute des mises à jour Socket.IO (`etat`, `ordreGroupeMaj`, `reactionDebatAffichee`).
  - Contrôle du minuteur de débat et émission des bips sonores de fin.
  - Apparition et envol dynamique des bulles de réactions envoyées par les téléphones.
  - Orchestration de la fin de partie : fanfare audio, double gerbe de confettis et mise en scène du podium.
  - Gestion du plein écran et coupure/activation du son.

### 6. `public/js/audio.js` (Synthétiseur Sonore)
- **Rôle :** Générateur d'effets sonores exploitant l'API Web Audio native du navigateur.
- **Avantage :** Fonctionne à 100% hors ligne sans aucun fichier audio externe (.mp3, .wav) qui pourrait échouer au chargement.
- **Sons intégrés :**
  - Clic rythmé de la roulette qui ralentit.
  - Carillon majeur lors de la sélection du thème.
  - Bips de compte à rebours (5 dernières secondes du débat).
  - Bruitage *pop* aigu lors des mini-réactions.
  - Fanfare triomphale de victoire sur le podium final.

### 7. `public/js/confetti.js` (Moteur de Confettis)
- **Rôle :** Petit moteur de particules autonome en `<canvas>` HTML5.
- **Avantage :** Ultra-léger, fluide à 60 images par seconde sans aucune librairie externe.
- **Déclencheurs :**
  - Sur TV : double gerbe depuis les coins inférieurs vers les marches du podium.
  - Sur Smartphone : pluie festive dorée et néon réservée au vainqueur de la partie.

### 8. `public/js/commun.js` (Utilitaires partagés)
- **Rôle :** Fonctions réutilisables à la fois par `app.js` et `tv.js`.
- **Contenu :** Fabrique d'éléments DOM sécurisés (`creerElement`), animation de la roulette des thèmes avec synchronisation audio.
