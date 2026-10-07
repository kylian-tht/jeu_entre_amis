# 🤖 Contexte & Spécifications Techniques pour IA — Projet Priorities

> **Document destiné à tout assistant IA ou développeur reprenant le projet.**  
> Il synthétise l'architecture complète, la machine à états, le protocole Socket.IO, les structures de données, les règles métier spécifiques et les points d'ancrage pour les évolutions futures (notamment l'Étape 7).

---

## 1. 🎯 Présentation & Concept du Jeu

- **Nom du projet :** Priorities Local
- **Type :** Party Game multijoueur sur réseau local (Web application mobile-first + écran TV type *Jackbox Party Games*).
- **Inspiration :** Jeu de société *Priorities*.
- **Principe fondamental :**
  1. Les joueurs se connectent sur leur smartphone via le Wi-Fi local grâce à un QR code affiché sur une télévision/PC hôte (`/tv`).
  2. Un thème est voté pour l'ensemble de la partie parmi 5 thèmes proposés (avec roulette en cas d'égalité).
  3. À chaque manche, 5 mots/situations sont tirés au sort.
  4. **Phase 1 (Secrète & Individuelle) :** Chaque joueur classe les 5 mots sur son smartphone du plus aimé au moins aimé (ou selon la consigne du thème).
  5. **Phase 2 (Collective & Débat) :** Le Capitaine (le Chef de la manche) ordonne les cartes sur la télé selon ce qu'il pense être l'avis moyen du groupe après un débat oral de 3 minutes.
  6. **Le Joker Secret :** Chaque joueur dispose d'un unique joker secret par partie (activable dans les 2 premières minutes du débat) pour ajuster son classement individuel après avoir entendu les arguments des autres.
  7. **Scoring :** On compare le classement individuel de chaque joueur avec le consensus validé par le capitaine sur la TV.
     - Distance $|rang_{joueur} - rang_{groupe}| = 0 \implies \mathbf{3\text{ pts}}$ (pile poil)
     - Distance $= 1 \implies \mathbf{1\text{ pt}}$ (proche)
     - Distance $\ge 2 \implies \mathbf{0\text{ pt}}$
  8. **Fin de partie & Podium :** Après 3 à 6 manches, le joueur ayant le plus de points l'emporte. Trophées humoristiques, confettis synchronisés, fanfare audio et sauvegarde des statistiques à vie dans `data/scores.json`.

---

## 2. 🏗️ Stack Technique & Contraintes Architecturales

- **Environnement :** Node.js (v18+) sur Windows / Linux / macOS.
- **Backend :**
  - `express` (v4.21+) : serveur de fichiers statiques (`public/`) et API de découverte locale `/api/info`.
  - `socket.io` (v4.8+) : synchronisation temps réel WebSocket avec configuration agressive pour la détection rapide des déconnexions mobiles (`pingInterval: 8000`, `pingTimeout: 7000`).
  - `qrcode` : génération du QR Code data-URL.
  - `child_process.exec` : ouverture automatique du navigateur sur la TV (`http://localhost:3000/tv`) au lancement (`npm start`).
- **Frontend :**
  - **Zero build tool / Zero bundling** : Vanilla HTML5, CSS3 pur, JavaScript ES6+ natif.
  - `SortableJS` (v1.15.6, servi localement via `/lib/sortable/Sortable.min.js`) : manipulation tactile fluide des cartes sur mobile.
  - **Web Audio API native (`audio.js`)** : synthétiseur sonore 100% autonome (aucune dépendance à des fichiers audio externes qui pourraient manquer ou échouer à charger).
  - **Canvas Confetti natif (`confetti.js`)** : rendu 60 FPS sans framework externe.
- **Contraintes absolues :**
  - **100% local et autonome** : Le jeu doit pouvoir tourner dans un chalet de vacances sans accès Internet (aucun CDN distant non packagé).
  - **Forçage Dark Mode** : `:root { color-scheme: dark; }` et styles stricts sur formulaires pour empêcher les OS mobiles en mode clair d'écraser les couleurs.

---

## 3. ⚙️ Machine à États du Serveur (`jeu.phase`)

Le jeu est piloté par la variable globale `jeu.phase` dans `server.js` :

| Valeur de `jeu.phase` | Description | Écran Mobile (`ecran-*`) | Section TV (`tv-*`) |
| :--- | :--- | :--- | :--- |
| `lobby` | Salle d'attente (2 à 8 joueurs), choix des manches (3-6) par le chef. | `ecran-lobby` | `tv-lobby` |
| `vote` | Vote pour le thème de la partie parmi les 5 thèmes disponibles. | `ecran-vote` | `tv-vote` |
| `annonce` | Affichage du thème vainqueur (roulette si égalité). Transition auto vers manche 1. | `ecran-annonce` | `tv-annonce` |
| `classement` | Classement secret tactile des 5 mots par chaque joueur sur son smartphone. | `ecran-classement` | `tv-classement` |
| `classement_termine` | Transition de 2.2s dès que tous les joueurs connectés ont validé. | `ecran-classement-termine` | `tv-termine` |
| `debat` | Débat oral de 3 min. Le capitaine déplace les cartes sur TV. Jokers et mini-réactions actifs. | `ecran-debat` | `tv-debat` |
| `debat_termine` | Transition de 1.8s suite à la validation du classement par le capitaine. | `ecran-debat-termine` | `tv-debat-termine` |
| `resultats_manche` | Révélation des points gagnés, détail mot par mot et classement provisoire. | `ecran-resultats-manche` | `tv-resultats-manche` |
| `fin_partie` | Podium olympique, trophées (Caméléon, Incompris, Stratège), confettis, carrière. | `ecran-fin-partie` | `tv-fin-partie` |

---

## 4. 📡 Protocole Socket.IO (Événements & Payloads)

### A. Événements Émis par le Serveur (`server` ➡️ `clients`)
- `etat` : État public global diffusé à tous les clients lors de tout changement :
  ```typescript
  interface EtatPublic {
    phase: string;
    nbManches: number;
    mancheActuelle: number;
    chefPseudo: string | null;
    capitainePseudo: string | null;
    capitaineId: string | null;
    joueurs: Array<{
      id: string;
      pseudo: string;
      avatar: string;
      connecte: boolean;
      scoreTotal: number;
      aVote: boolean;
      aClasse: boolean;
    }>;
    joueursMin: number;
    joueursMax: number;
    peutLancer: boolean;
    themes: Array<ThemePublic>;
    nbVotants: number;
    nbClasses: number;
    nbAttendus: number;
    themeChoisi: ThemePublic | null;
    motsManche: string[];
    ordreGroupe: string[];
    debutDebat: number | null;
    dureeJokerMs: number;
    dureeDebatS: number;
    jokersTotal: number;
    jokersRestants: number;
    dernierResultatManche: ResultatManche | null;
    podium: Array<JoueurPodium>;
    trophees: Array<Trophee>;
    historiqueManches: ResultatManche[];
    statsGlobales: Record<string, StatJoueur> | null;
  }
  ```
- `monClassement` : Données privées de classement pour le joueur appelant `{ mots: string[], valide: boolean }`.
- `monProfil` : Données de rôle et de joker `{ idJoueur, jokerUtilise: boolean, estCapitaine: boolean }`.
- `ordreGroupeMaj` : Diffuse en direct le tableau `string[]` manipulé par le capitaine pendant le débat.
- `reactionDebatAffichee` : `{ pseudo: string, avatar: string, emoji: string, texte: string }` diffusé à la TV pour afficher les bulles de réaction flottantes en direct.

### B. Événements Émis par le Client Mobile (`client` ➡️ `server`)
- `rejoindre` : `{ pseudo: string, idJoueur?: string, avatar?: string }`, callback `(res) => { ok: boolean, idJoueur, pseudo, avatar, erreur? }`.
- `changerAvatar` : `nouvelAvatar: string`, callback `(res) => { ok: boolean, avatar }`.
- `reglerManches` : `nb: number` (3, 4, 5 ou 6). Réservé au Chef en phase `lobby`.
- `lancerPartie` : Callback `(res) => { ok: boolean, erreur? }`. Réservé au Chef.
- `voterTheme` : `cleTheme: string`. En phase `vote`.
- `cloturerVote` : Forcer la fin du vote si certains joueurs tardent.
- `ordonnerMots` : `nouvelOrdre: string[]`. En phase `classement`.
- `validerClassement` : Valide définitivement l'ordre individuel du joueur.
- `cloturerClassement` : Forcer la fin de phase par le Chef.
- `ordonnerGroupe` : `nouvelOrdre: string[]`. Réservé au Capitaine en phase `debat`.
- `validerGroupe` : Réservé au Capitaine en phase `debat` pour clore le débat.
- `utiliserJoker` : Demande d'activation du joker secret (dans les 2 premières minutes du débat).
- `validerJoker` : `nouvelOrdre: string[]`. Valide le nouvel ordre secret avec contrôle anti-copie du chef.
- `reactionDebat` : `{ emoji: string, texte: string }`. Envoie une réaction instantanée affichée sur la TV.
- `mancheSuivante` : Réservé au Chef en phase `resultats_manche`.
- `terminerPartie` : Réservé au Chef pour aller au podium final après la dernière manche.
- `retourLobby` : Réservé au Chef pour réinitialiser la partie et revenir au lobby sans déconnecter les joueurs.

---

## 5. 🛡️ Règles Métier Clés & Algorithmes

1. **Passation Dynamique de la Couronne (Chef) :**
   - Dès qu'un client socket se déconnecte (`socket.on('disconnect')`), si le joueur était chef ou si le chef actuel n'est plus connecté, `designerNouveauChef()` est exécuté immédiatement.
   - La couronne passe inconditionnellement au premier joueur connecté de la liste (`joueursTries().find(j => j.connecte)`).
   - Les événements `beforeunload` et `pagehide` sur smartphone appellent `socket.disconnect()` pour garantir une détection instantanée (sans attendre le timeout).

2. **Règle Anti-Triche du Chef / Capitaine sur le Joker :**
   - Lorsque le Chef utilise son Joker secret pendant le débat, le serveur et le client vérifient que son nouvel ordre secret n'est **pas identique à 100%** à l'ordre actuellement défini pour le groupe (`dernierEtat.ordreGroupe`).
   - S'il tente de copier-coller exactement le groupe pour obtenir 15 points faciles, la validation est bloquée et une alerte est levée.

3. **Bonus Joker (+8 points) :**
   - Tout joueur qui traverse l'intégralité de la partie **sans jamais utiliser son joker secret** reçoit un bonus net de **+8 points** ajouté à son total final lors du calcul du podium.
   - Ce bonus est distingué sur le podium TV (`🃏 +8 pts (Joker)`), dans le récapitulatif des manches, et sur mobile.

4. **Trophées de Fin de Partie (`calculerTrophees()`) :**
   - 🦎 **Le Caméléon :** Joueur(s) ayant cumulé le plus de cartes à distance 0 (exactement au même rang que le groupe).
   - 👽 **Le Grand Incompris :** Joueur(s) ayant cumulé le plus de cartes à distance $\ge 2$ (les avis les plus divergents).
   - 🃏 **Le Stratège :** Tous les joueurs ayant conservé leur joker pour empocher les +8 points bonus.

5. **Gestion des Déconnexions & Récupération de Session :**
   - L'identifiant unique `idJoueur` (UUID v4) et le `pseudo` sont stockés dans le `localStorage` du smartphone.
   - En cas de rafraîchissement ou retour sur la page, le client transmet son `idJoueur` et retrouve automatiquement son état, ses cartes et ses scores.

---

## 6. 🎨 Thème Visuel « Soirée VIP / Nightclub »

- **Palette :** Fond violet-nuit profond (`#0c0824` / `#181138`), accents néons fuchsia (`#ff2a85`), cyan électrique (`#00f5d4`), violet améthyste (`#a855f7`) et or ambré (`#fbbf24`).
- **Composants clés :**
  - Orbes lumineuses en arrière-plan avec animations de dérive douce (`floatOrbe`).
  - Carte TV en Pass VIP avec bordure néon brillante et voyant en direct pulsant.
  - Couronne dorée flottante animée en 3D/lévitation (`levitationCouronne`) au-dessus de la carte du chef.
  - Avatars personnalisables : pastilles rondes avec 16 emojis de fête (🍸, 🍾, 🍻, 🍹, 🪩, 🕺, 💃, 🕶️, etc.).
  - Boutons capsules modernes avec gradients dynamiques, ombres portées intenses et retours tactiles.

---

## 7. 🚀 Préparation pour l'Étape 7

Toutes les étapes fondamentales (1 à 6) + les extensions de confort (refonte visuelle, son Web Audio, confettis, auto-open navigateur, mini-réactions) sont stables et validées.

Lorsque l'utilisateur entamera l'**Étape 7**, voici les bases prêtes à être étendues selon ses instructions :
- L'architecture est totalement modulaire (`server.js` pour la logique serveur, `app.js` pour les téléphones, `tv.js` pour l'affichage TV).
- Toute nouvelle règle ou phase peut être ajoutée en introduisant un nouvel état dans `jeu.phase`, un écran dans `index.html` et une section dans `tv.html`.
