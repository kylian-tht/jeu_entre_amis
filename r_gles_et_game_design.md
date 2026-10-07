# Game Design et Règles - Projet "Priorities"

Ce document détaille les règles du jeu, les mécaniques spécifiques (scoring, jokers), les directives d'interface utilisateur (UI/UX) et le contenu initial. Il complète le fichier `contexte_du_projet.md` et sert de référence absolue pour coder la logique métier de l'application.

## 1. Paramètres Généraux de la Partie
- **Nombre de joueurs :** 3 à 8 joueurs.
- **Durée d'une partie :** 4 à 5 manches (le nombre de manches doit être paramétrable par le créateur dans le lobby, par défaut 4).
- **Rôle du PC Hôte (L'Écran "Télévision") :**
  - Ne participe pas au vote.
  - Affiche le QR Code dans le lobby.
  - Affiche un écran d'attente/statut pendant que les joueurs classent leurs mots ("3 joueurs sur 5 ont terminé...").
  - Révèle les résultats de la manche et le classement général avec des animations.
- **Rôle du Créateur (Host mobile) :** Le premier connecté lance la partie. S'il se déconnecte, le serveur `Socket.IO` transfère automatiquement ses droits au joueur suivant dans la liste.

## 2. Déroulement d'une Manche (Game Loop)

### Phase 1 : Choix du Thème
- Le serveur propose 3 thèmes tirés aléatoirement parmi la base de données.
- Les joueurs votent sur leur smartphone.
- **Mécanique d'égalité :** Si deux thèmes ou plus ont le même nombre de votes, le serveur tranche aléatoirement.
  - *Instruction UI :* L'écran PC doit afficher une courte animation ("Roulette du destin" ou clignotement) pour montrer que le jeu a tranché.

### Phase 2 : Classement Personnel
- Chaque joueur reçoit sur son téléphone les 5 éléments du thème gagnant, dans un ordre aléatoire (différent pour chaque joueur).
- Le joueur ordonne les éléments du haut (préféré/pire) vers le bas (détesté/moins pire).
- Une fois satisfait, il appuie sur "Valider". Il attend ensuite les autres.

### Phase 3 : Le Débat, le Joker et le Classement du Groupe
- Une fois que tous ont validé, l'écran PC annonce le début du débat.
- **Le Capitaine :** Le serveur désigne aléatoirement (ou à tour de rôle) un joueur comme "Capitaine". Sur son téléphone, lui seul a une interface pour classer les mots au nom du groupe.
- **Le Joker (Coup de couteau dans le dos) :** 
  - Chaque joueur ne possède **qu'un seul Joker pour TOUTE la partie**.
  - Pendant le débat, un bouton "Utiliser mon Joker" est visible sur les téléphones des joueurs (sauf le capitaine).
  - S'il l'active, il peut modifier son classement personnel de dernière minute (pendant un temps imparti ou avant que le Capitaine ne valide).
- Le Capitaine valide le classement final du groupe après discussion.

### Phase 4 : Résolution et Scoring
- Le serveur compare la liste de chaque joueur avec la liste validée par le Capitaine.

## 3. Algorithme de Scoring (Calcul des Points)
Pour chaque mot de la liste (généralement 5 mots), le serveur compare l'index du mot dans la liste du joueur avec son index dans la liste du groupe.

- **Distance de 0 (Position exacte) :** +3 points
- **Distance de 1 (Décalage d'une position au-dessus ou en dessous) :** +1 point
- **Distance de 2 ou plus :** 0 point

*Exemple de logique de code :*
`distance = | index_joueur - index_groupe |`
- Si `distance === 0` => 3 pts
- Si `distance === 1` => 1 pt
- Si `distance >= 2` => 0 pt
*Score maximum possible par manche pour 5 mots = 15 points.*

## 4. Directives d'Interface et UX (Mobile-First)
- **Drag-and-Drop (SortableJS) :** Les joueurs manipulent les listes au pouce. 
- **Ergonomie des cartes :** 
  - Blocs rectangulaires prenant 90% de la largeur.
  - Présence obligatoire d'une icône "poignée" (≡) à droite pour indiquer la zone de préhension tactile.
- **Code Couleur du Plateau :** Le fond de la liste (ou le conteneur) doit avoir un dégradé clair pour guider le joueur : le haut dans des tons Vert/Bleu (Positif/Haut du classement) et le bas dans des tons Rouge/Orange (Négatif/Bas du classement).
- **Feedback Haptique :** À chaque déplacement de carte validé par le drag-and-drop, déclencher `navigator.vibrate(50)` (si supporté par le navigateur client) pour donner du poids à l'action.

## 5. Contenu Initial (Base de données `themes.json`)

**Thème 1 : Les trucs totalement surcotés** *(Du plus surcoté au moins surcoté)*
1. Les notes vocales de plus de 2 minutes
2. Dubaï
3. Les sushis
4. L'iPhone
5. Se lever à 6h du matin pour "être productif"

**Thème 2 : Dictionnaire du malaise** *(Du plus insoutenable au plus gérable)*
1. Appeler sa prof (ou son boss) "Maman"
2. Faire coucou à quelqu'un qui saluait la personne derrière soi
3. Oublier le prénom de la personne avec qui l'on flirte
4. Lâcher un pet "silencieux" qui s'avère catastrophique en réunion
5. Laisser un "Vu" à un énorme message de détresse

**Thème 3 : Les crimes culinaires** *(Du pire crime au péché pardonnable)*
1. La pizza à l'ananas
2. Mettre des glaçons dans le vin rouge
3. Commander un faux-filet "très bien cuit"
4. Le ketchup sur des pâtes au beurre
5. Croquer directement dans une plaquette de beurre

**Thème 4 : Red Flag** *(Du plus toxique au plus acceptable)*
1. Parle encore de son ex au premier date
2. Est malpoli avec les serveurs au restaurant
3. Regarde son téléphone toutes les 2 minutes pendant que tu parles
4. N'aime pas la musique (aucune musique)
5. Coupe constamment la parole pour raconter sa vie

**Thème 5 : Grand méli-mélo**
*Note pour le développement :* Ce thème n'a pas de liste fixe. S'il est sélectionné, le serveur doit piocher aléatoirement 1 mot dans chacune des 4 listes précédentes, plus un 5ème mot aléatoire, pour créer une liste absurde unique à classer.