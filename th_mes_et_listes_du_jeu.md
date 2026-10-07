# Document de Conception : Thèmes et Listes de Mots ("Priorities" Web App)

## 1. Contexte pour le Développement (Rappel pour Antigravity)
Ce document liste le contenu textuel qui doit être intégré dans le fichier `data/themes.json` du jeu. 
Pour rappel, lors de la phase de jeu "Plateau Personnel", le serveur doit envoyer à chaque joueur une liste de **5 à 6 éléments** liés au thème qui a remporté les votes. Le joueur devra ensuite ordonner ces cartes sur son smartphone (de "Ce que je préfère" à "Ce que je déteste"). 

Les thèmes ont été choisis spécifiquement pour créer du débat, de la mauvaise foi et des dilemmes absurdes entre amis.

## 2. Les Thèmes et leurs Listes de Mots

Voici les 4 thèmes principaux à intégrer dans la structure de données.

### Thème 1 : Les Trucs Totalement Surcotés
**Objectif :** S'attaquer aux intouchables de la culture populaire pour forcer les joueurs à révéler leurs opinions impopulaires.
**Liste des mots/concepts :**
- Les brunchs le dimanche
- Dubaï
- Les messages vocaux de plus d'une minute
- Les toasts à l'avocat
- La série "La Casa de Papel"
- Le Nouvel An

### Thème 2 : Le Dictionnaire du Malaise
**Objectif :** Le thème "Hardcore". Créer un rejet viscéral et un malaise hilarant rien qu'en manipulant ces mots sur l'écran tactile.
**Liste des mots/concepts :**
- Smegma
- Un pet vaginal
- Cyprine
- Furoncle suintant
- Chiasse
- Le mot "Humide"

### Thème 3 : Crimes Culinaires
**Objectif :** Diviser la table sur des habitudes alimentaires clivantes ou des associations douteuses.
**Liste des mots/concepts :**
- L'ananas sur la pizza
- Tremper ses tartines dans le café
- Le Ketchup sur les pâtes
- Manger la peau du saucisson
- La coriandre (le goût de punaise écrasée)
- Tremper ses frites dans la glace (Sundae)

### Thème 4 : Red Flag
**Objectif :** Hiérarchiser les pires comportements sociaux ou amoureux, de l'agaçant à l'éliminatoire.
**Liste des mots/concepts :**
- Parle mal aux serveurs au resto
- Ne pose absolument aucune question sur toi
- Reste hyper pote avec tous ses ex
- Dit souvent : "Je suis très entier, je dis ce que je pense"
- Claque des doigts pour appeler quelqu'un
- Met son téléphone sur haut-parleur dans le bus

---

## 3. Implémentation Spéciale : Le Grand Méli-Mélo

### Thème 5 : Le Grand Méli-Mélo (Chaos Total)
**Attention pour le développement :** Ce thème **ne possède pas** de liste de mots attitrée dans le fichier JSON. 

**Logique backend attendue :** 
Si le thème "Le Grand Méli-Mélo" remporte les votes, le fichier `server.js` doit exécuter une fonction spéciale qui va piocher **aléatoirement 5 à 6 mots parmi l'ensemble des 4 autres catégories réunies**. 
Le but est de forcer un joueur à comparer des éléments qui n'ont rien à voir (ex: comparer "Le Ketchup sur les pâtes" avec "Dubaï" et "Furoncle suintant").