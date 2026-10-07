# 🎯 Party Games Suite (Priorities & Quick Splash)

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.io-v4-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-v4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

> **Une plateforme de jeux d'ambiance multijoueur festive et clé en main**, inspirée de *Jackbox Party Games*, pensée pour animer vos soirées sur grand écran avec des smartphones comme manettes !

---

## 📺 Présentation

Connectez votre ordinateur à une **TV** ou un vidéoprojecteur, les invités scannent le **QR Code** avec leur smartphone (ou tapent l'adresse locale), et la partie commence instantanément sans aucune application à installer !

Le projet intègre **2 modes de jeu complets et dynamiques** :

### 1. 🥇 Mode *Priorities* (Coopération & Déduction)
*Vous pensez connaître vos amis ? Rien n'est moins sûr !*
- **Le Capitaine** classe secrètement 5 cartes (objets du quotidien, situations absurdes, dilemmes).
- **Le Groupe** débat ensemble contre la montre pour tenter de deviner l'ordre exact du Capitaine.
- **Cartes Joker** pour sécuriser des points critiques ou renverser la vapeur.
- **Reroll de mots** et scores de précision pour battre le record d'équipe.

### 2. ⚡ Mode *Quick Splash* (Punchlines & Bluff)
*Le jeu de punchlines rapide et déjanté façon Qui Pourrait !*
- **Génération d'amorces** : Phrases à trous croustillantes ou questions ouvertes piquantes.
- **Rédaction secrète** sous pression du chrono avec stress sonore dans les 10 dernières secondes.
- **Vote & Classement** par drag-and-drop sur smartphone.
- **Système Sniper 🎯** : Pariez sur la réponse qui remportera la première place pour rafler des points bonus.
- **Invité surprise IA / Bot 🤖** : Un bot glisse ses propres réponses décalées dans le lot !
- **Grand Final** : Podium animé, effets de confettis/feux d'artifice et statistiques décalées de fin de partie.

---

## ✨ Fonctionnalités Clés

- **📱 Expérience Mobile-First** : Interface tactile ultra fluide (Sortable.js), retours haptiques et animations dynamiques.
- **🖥️ Écran TV Réactif** : Effets sonores festifs (Web Audio API), transitions d'ondes de choc, orbes lumineuses d'ambiance et affichage des classements en direct.
- **👑 Gestion & Modération Intégrée (Roue crantée ⚙️)** :
  - Nommer un nouveau chef de partie.
  - Exclure un joueur indésirable.
  - **Retourner au lobby** en un clic pour relancer une session ou changer de mode.
- **🏆 Panthéon & Statistiques** : Scoreboard persistant des victoires et des parties jouées consultable sur la TV.
- **🚀 Exécutable Standalone** : Fichier `.exe` portable généré avec `pkg`, lançable d'un double-clic sans nécessiter l'installation de Node.js.

---

## 🚀 Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (v18 ou supérieure recommandée)
- Un réseau local partagé (Wi-Fi de la maison ou partage de connexion 4G/5G)

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/kylian-tht/jeu_entre_amis.git

# 2. Accéder au dossier du projet
cd jeu_entre_amis

# 3. Installer les dépendances
npm install

# 4. Lancer le serveur
npm start
```

Le serveur s'exécute par défaut sur le port **3000** :
- **Écran TV** : `http://<IP_LOCALE>:3000/tv` (ou `http://localhost:3000/tv`)
- **Joueurs (Smartphones)** : `http://<IP_LOCALE>:3000/` (ou directement en scannant le QR Code affiché sur l'écran TV)

---

## 📦 Compilation en Exécutable Portable (.exe)

Pour générer un fichier exécutable autonome sous Windows :

```bash
npm run build:exe
```

L'exécutable standalone sera créé dans le dossier `dist/priorities.exe`. Vous pouvez le copier sur n'importe quel PC Windows pour lancer le jeu sans Node.js.

---

## 🛠️ Stack Technique

- **Backend** : Node.js, Express, Socket.IO
- **Frontend TV & Mobile** : HTML5, CSS3 Moderne (Glassmorphism, animations CSS), JavaScript ES6+ Vanilla
- **Librairies & Outils** :
  - [Socket.IO](https://socket.io/) (Synchronisation temps réel bi-directionnelle)
  - [SortableJS](https://sortablejs.github.io/Sortable/) (Drag and drop mobile ultra fluide)
  - [QRCode](https://github.com/soldair/node-qrcode) (Génération automatique des QR codes de connexion)
  - [@yao-pkg/pkg](https://github.com/yao-pkg/pkg) (Packaging en exécutable Windows x64)
  - Web Audio API (Sons d'ambiance et bruitages synthétisés légers)

---

## 📂 Structure du Projet

```text
├── data/                  # Fichiers de données (mots, amorces, statistiques)
├── dist/                  # Exécutable autonome compilé (priorities.exe)
├── dist-portable/         # Version packagée portable avec assets
├── public/                # Interface web (HTML, CSS, JS, sons)
│   ├── css/               # Feuilles de style (design responsive & animations)
│   ├── js/                # Logique client mobile (app.js) et TV (tv.js)
│   ├── audio/             # Effets sonores
│   ├── index.html         # Vue joueur (manette mobile)
│   └── tv.html            # Vue télévision (grand écran)
├── server.js              # Serveur Express & moteur de jeu Socket.IO
└── package.json           # Métadonnées et scripts de build
```

---

## 🤝 Contribution & Personnalisation

Les contributions, suggestions et ajouts de nouveaux paquets de questions/amorces sont les bienvenus !

1. Forkez le projet.
2. Créez votre branche (`git checkout -b feature/nouvelle-fonctionnalite`).
3. Committez vos modifications (`git commit -m 'Ajout d'une nouvelle amorce'`).
4. Pushez sur votre branche (`git push origin feature/nouvelle-fonctionnalite`).
5. Ouvrez une Pull Request.

---

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.
