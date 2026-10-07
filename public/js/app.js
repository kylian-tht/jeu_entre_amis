// =====================================================
// app.js - Logique côté client (téléphone)
// Étape 5 : pseudo, lobby, vote, classement, DÉBAT & JOKER secret
// =====================================================

const socket = io();

// Clés de stockage dans le navigateur
const CLE_ID = 'priorities_idJoueur';
const CLE_PSEUDO = 'priorities_pseudo';
const CLE_AVATAR = 'priorities_avatar';

const LISTE_AVATARS_SOIREE = [
  '🍸', '🍾', '🍻', '🍹', '🪩', '🕺', '💃', '🕶️',
  '🎉', '🍕', '🎧', '🍷', '🥂', '🍿', '🎸', '👑'
];

let monPseudo = null;
let monVote = null;
let monAvatar = localStorage.getItem(CLE_AVATAR) || '🍸';
let dernierEtat = null;
let monClassement = null;       // { mots: [...], valide: boolean }
let monProfil = { jokerUtilise: false, estCapitaine: false };

let sortablePersonnel = null;
let sortableGroupe = null;
let sortableJoker = null;

let annonceAffichee = false;
let intervalleChronoMobile = null;

// --- Éléments du DOM ---
const ecrans = {
  accueil: document.getElementById('ecran-accueil'),
  lobby: document.getElementById('ecran-lobby'),
  vote: document.getElementById('ecran-vote'),
  annonce: document.getElementById('ecran-annonce'),
  classement: document.getElementById('ecran-classement'),
  termine: document.getElementById('ecran-classement-termine'),
  debat: document.getElementById('ecran-debat'),
  debatTermine: document.getElementById('ecran-debat-termine'),
  resultatsManche: document.getElementById('ecran-resultats-manche'),
  finPartie: document.getElementById('ecran-fin-partie'),
  qsSetup: document.getElementById('ecran-qs-setup'),
  qsEcriture: document.getElementById('ecran-qs-ecriture'),
  qsClassement: document.getElementById('ecran-qs-classement'),
  qsRevelation: document.getElementById('ecran-qs-revelation'),
  qsFin: document.getElementById('ecran-qs-fin')
};

const elStatut = document.getElementById('statut');
const elErreur = document.getElementById('erreur-pseudo');
const formPseudo = document.getElementById('form-pseudo');
const champPseudo = document.getElementById('champ-pseudo');
const elListe = document.getElementById('liste-joueurs');
const elCompteur = document.getElementById('compteur-joueurs');
const zoneChef = document.getElementById('zone-chef');
const elAttenteChef = document.getElementById('attente-chef');
const btnLancer = document.getElementById('btn-lancer');
const elAideLancer = document.getElementById('aide-lancer');

// Switch de mode Mobile
const btnSwitchModeMobile = document.getElementById('btn-switch-mode-mobile');
const btnToggleModeChef = document.getElementById('btn-toggle-mode-chef');
const texteModeChef = document.getElementById('texte-mode-chef');
const choixManchesConteneur = document.getElementById('choix-manches-conteneur');
const infoManchesQuickSplash = document.getElementById('info-manches-quicksplash');
const ondeDeChocMobile = document.getElementById('onde-de-choc-mobile');
const mobileBadgeSoiree = document.getElementById('mobile-badge-soiree');
const mobileTitrePrincipal = document.getElementById('mobile-titre-principal');
let modePrecedentMobile = null;

// Avatar personnalisable Mobile
const iconeMonAvatar = document.getElementById('icone-mon-avatar');
const monPseudoLobby = document.getElementById('mon-pseudo-lobby');
const btnOuvrirSelecteurAvatar = document.getElementById('btn-ouvrir-selecteur-avatar');
const modalSelecteurAvatar = document.getElementById('modal-selecteur-avatar');
const btnFermerModalAvatar = document.getElementById('btn-fermer-modal-avatar');
const grilleChoixAvatars = document.getElementById('grille-choix-avatars');

// Vote
const elListeThemes = document.getElementById('liste-themes');
const elCompteurVotes = document.getElementById('compteur-votes');
const btnCloturer = document.getElementById('btn-cloturer');
const elZoneAnnonce = document.getElementById('zone-annonce');

// Classement personnel
const badgeManche = document.getElementById('badge-manche');
const titreThemeManche = document.getElementById('titre-theme-manche');
const texteConsigneHaut = document.getElementById('texte-consigne-haut');
const texteConsigneBas = document.getElementById('texte-consigne-bas');
const listeCartesMots = document.getElementById('liste-cartes-mots');
const btnValiderClassement = document.getElementById('btn-valider-classement');
const btnRerollMots = document.getElementById('btn-reroll-mots');
const compteurReroll = document.getElementById('compteur-reroll');
const listeAvatarsReroll = document.getElementById('liste-avatars-reroll');
const infoStatutClassement = document.getElementById('info-statut-classement');
const btnCloturerClassement = document.getElementById('btn-cloturer-classement');

// Modération Chef (roue crantée & modal)
const btnRoueChef = document.getElementById('btn-roue-chef');
const modalChef = document.getElementById('modal-chef');
const modalChefBackdrop = document.getElementById('modal-chef-backdrop');
const btnFermerModalChef = document.getElementById('btn-fermer-modal-chef');
const listeJoueursChef = document.getElementById('liste-joueurs-chef');
const btnRetourLobbyModalChef = document.getElementById('btn-retour-lobby-modal-chef');

// Débat & Joker
const badgeMancheDebat = document.getElementById('badge-manche-debat');
const chronoDebatMobile = document.getElementById('chrono-debat-mobile');
const zoneCapitaine = document.getElementById('zone-capitaine');
const listeCartesGroupe = document.getElementById('liste-cartes-groupe');
const btnValiderGroupe = document.getElementById('btn-valider-groupe');
const zoneNonCapitaine = document.getElementById('zone-non-capitaine');
const pseudoCapitaineMobile = document.getElementById('pseudo-capitaine-mobile');

// Joker
const zoneJoker = document.getElementById('zone-joker');
const blocDeclencherJoker = document.getElementById('bloc-declencher-joker');
const texteStatutJoker = document.getElementById('texte-statut-joker');
const btnActiverJoker = document.getElementById('btn-activer-joker');
const delaiJokerInfo = document.getElementById('delai-joker-info');
const blocEditionJoker = document.getElementById('bloc-edition-joker');
const listeCartesJoker = document.getElementById('liste-cartes-joker');
const btnValiderJoker = document.getElementById('btn-valider-joker');

// Résultats de la manche Mobile (Étape 6)
const badgeMancheResultatsMobile = document.getElementById('badge-manche-resultats-mobile');
const scoreMancheJoueur = document.getElementById('score-manche-joueur');
const scoreTotalJoueur = document.getElementById('score-total-joueur');
const listeDetailsScoreMobile = document.getElementById('liste-details-score-mobile');
const listeClassementProvisoireMobile = document.getElementById('liste-classement-provisoire-mobile');
const actionsResultatsChef = document.getElementById('actions-resultats-chef');
const btnMancheSuivante = document.getElementById('btn-manche-suivante');
const btnVoirPodium = document.getElementById('btn-voir-podium');
const btnRetourLobbyResultats = document.getElementById('btn-retour-lobby-resultats');
const attenteChefResultats = document.getElementById('attente-chef-resultats');

// Fin de partie & Podium Mobile (Étape 6)
const iconeFinPartie = document.getElementById('icone-fin-partie');
const titreFinPartie = document.getElementById('titre-fin-partie');
const texteRangFinal = document.getElementById('texte-rang-final');
const listePodiumMobile = document.getElementById('liste-podium-mobile');
const blocCarriereMobile = document.getElementById('bloc-carriere-mobile');
const actionsFinChef = document.getElementById('actions-fin-chef');
const btnRejouerLobby = document.getElementById('btn-rejouer-lobby');
const attenteChefFin = document.getElementById('attente-chef-fin');

// --- Éléments Quick Splash (Mobile) ---
// Setup amorce
const btnQsTypeTrou = document.getElementById('btn-qs-type-trou');
const btnQsTypeQuestion = document.getElementById('btn-qs-type-question');
const qsHintType = document.getElementById('qs-hint-type');
const btnQsMagique = document.getElementById('btn-qs-magique');
const qsInputAmorce = document.getElementById('qs-input-amorce');
const qsCompteurCaracteresAmorce = document.getElementById('qs-compteur-caracteres-amorce');
const qsActionsSetup = document.getElementById('qs-actions-setup');
const btnQsValiderAmorce = document.getElementById('btn-qs-valider-amorce');
const qsAttenteSetup = document.getElementById('qs-attente-setup');
const qsStatutAmorcesAttente = document.getElementById('qs-statut-amorces-attente');

// Écriture punchline
const qsBadgeMancheEcriture = document.getElementById('qs-badge-manche-ecriture');
const qsChronoEcritureBox = document.getElementById('qs-chrono-ecriture-box');
const qsChronoEcriture = document.getElementById('qs-chrono-ecriture');
const qsIconeAmorce = document.getElementById('qs-icone-amorce');
const qsTexteAmorce = document.getElementById('qs-texte-amorce');
const qsZoneSaisieReponse = document.getElementById('qs-zone-saisie-reponse');
const qsInputReponse = document.getElementById('qs-input-reponse');
const qsCompteurCaracteresReponse = document.getElementById('qs-compteur-caracteres-reponse');
const btnQsValiderReponse = document.getElementById('btn-qs-valider-reponse');
const qsAttenteEcriture = document.getElementById('qs-attente-ecriture');

// Classement & Sniper
const qsBadgeMancheClassement = document.getElementById('qs-badge-manche-classement');
const qsTexteRappelClassement = document.getElementById('qs-texte-rappel-classement');
const qsListeCartesClassement = document.getElementById('qs-liste-cartes-classement');
const btnQsOuvrirSniper = document.getElementById('btn-qs-ouvrir-sniper');
const qsSniperResume = document.getElementById('qs-sniper-resume');
const qsSniperResumeTexte = document.getElementById('qs-sniper-resume-texte');
const btnQsAnnulerSniper = document.getElementById('btn-qs-annuler-sniper');
const btnQsValiderClassement = document.getElementById('btn-qs-valider-classement');
const qsAttenteClassement = document.getElementById('qs-attente-classement');
const qsStatutClassementsAttente = document.getElementById('qs-statut-classements-attente');

// Modal Sniper
const modalQsSniper = document.getElementById('modal-qs-sniper');
const modalQsSniperBackdrop = document.getElementById('modal-qs-sniper-backdrop');
const btnFermerModalSniper = document.getElementById('btn-fermer-modal-sniper');
const btnQsFermerSniper = document.getElementById('btn-qs-fermer-sniper');
const qsSelectSniperCarte = document.getElementById('qs-select-sniper-carte');
const qsSelectSniperJoueur = document.getElementById('qs-select-sniper-joueur');
const btnQsConfirmerSniper = document.getElementById('btn-qs-confirmer-sniper');

// Révélation & Scores
const qsBadgeMancheRevelation = document.getElementById('qs-badge-manche-revelation');
const qsScoreMancheJoueur = document.getElementById('qs-score-manche-joueur');
const qsScoreTotalJoueur = document.getElementById('qs-score-total-joueur');
const qsAlertesMancheJoueur = document.getElementById('qs-alertes-manche-joueur');
const qsListeCartesRevelees = document.getElementById('qs-liste-cartes-revelees');
const qsAlerteBotBox = document.getElementById('qs-alerte-bot-box');
const qsAlerteBotTexte = document.getElementById('qs-alerte-bot-texte');
const qsListeSnipersResolus = document.getElementById('qs-liste-snipers-resolus');
const qsClassementProvisoire = document.getElementById('qs-classement-provisoire');
const qsActionsRevelationChef = document.getElementById('qs-actions-revelation-chef');
const btnQsMancheSuivante = document.getElementById('btn-qs-manche-suivante');
const btnQsVoirPodium = document.getElementById('btn-qs-voir-podium');
const btnQsRetourLobbyRevelation = document.getElementById('btn-qs-retour-lobby-revelation');
const qsAttenteChefRevelation = document.getElementById('qs-attente-chef-revelation');

// Podium final
const qsTexteRangFinal = document.getElementById('qs-texte-rang-final');
const qsPodiumVisuelMobile = document.getElementById('qs-podium-visuel-mobile');
const qsListeTropheesMobile = document.getElementById('qs-liste-trophees-mobile');
const qsListePodiumFinal = document.getElementById('qs-liste-podium-final');
const qsActionsFinChef = document.getElementById('qs-actions-fin-chef');
const btnQsRejouerLobby = document.getElementById('btn-qs-rejouer-lobby');
const qsAttenteChefFin = document.getElementById('qs-attente-chef-fin');

// Variables d'état Quick Splash (Mobile)
let qsTypeSelectionne = 'trou';
let qsBanqueIdees = null;
let qsSniperChoisi = null;
let sortableQsClassement = null;
let qsMancheAnimee = null;

function afficherEcran(nom) {
  for (const cle of Object.keys(ecrans)) {
    if (ecrans[cle]) {
      ecrans[cle].classList.toggle('cache', cle !== nom);
    }
  }
}

// ---------------------------------------------------------------------
// Rejoindre & Personnalisation Avatar
// ---------------------------------------------------------------------
function initialiserSelecteurAvatar() {
  if (!grilleChoixAvatars) return;
  grilleChoixAvatars.innerHTML = '';
  LISTE_AVATARS_SOIREE.forEach((av) => {
    const btn = creerElement('button', 'btn-avatar-item', av);
    btn.type = 'button';
    if (av === monAvatar) btn.classList.add('selectionne');
    btn.addEventListener('click', () => {
      choisirAvatar(av);
    });
    grilleChoixAvatars.appendChild(btn);
  });
}

function choisirAvatar(nouvelAvatar) {
  monAvatar = nouvelAvatar;
  localStorage.setItem(CLE_AVATAR, monAvatar);
  if (iconeMonAvatar) iconeMonAvatar.textContent = monAvatar;
  document.querySelectorAll('.btn-avatar-item').forEach((b) => {
    b.classList.toggle('selectionne', b.textContent === monAvatar);
  });
  socket.emit('changerAvatar', nouvelAvatar, (rep) => {
    if (rep && rep.ok) {
      fermerSelecteurAvatar();
    }
  });
}

function ouvrirSelecteurAvatar() {
  if (!modalSelecteurAvatar) return;
  initialiserSelecteurAvatar();
  modalSelecteurAvatar.classList.remove('cache');
}

function fermerSelecteurAvatar() {
  if (modalSelecteurAvatar) modalSelecteurAvatar.classList.add('cache');
}

if (btnOuvrirSelecteurAvatar) {
  btnOuvrirSelecteurAvatar.addEventListener('click', ouvrirSelecteurAvatar);
}
if (btnFermerModalAvatar) {
  btnFermerModalAvatar.addEventListener('click', fermerSelecteurAvatar);
}
const overlayAvatar = document.querySelector('.modal-avatar-overlay');
if (overlayAvatar) {
  overlayAvatar.addEventListener('click', fermerSelecteurAvatar);
}

function rejoindre(pseudo) {
  const idJoueur = localStorage.getItem(CLE_ID);
  socket.emit('rejoindre', { pseudo, idJoueur, avatar: monAvatar }, (reponse) => {
    if (reponse.ok) {
      monPseudo = reponse.pseudo;
      monVote = reponse.monVote;
      if (reponse.avatar) {
        monAvatar = reponse.avatar;
        localStorage.setItem(CLE_AVATAR, monAvatar);
        if (iconeMonAvatar) iconeMonAvatar.textContent = monAvatar;
      }
      localStorage.setItem(CLE_ID, reponse.idJoueur);
      localStorage.setItem(CLE_PSEUDO, reponse.pseudo);
      elErreur.textContent = '';
    } else {
      monPseudo = null;
      elErreur.textContent = reponse.erreur;
    }
    afficher();
  });
}

formPseudo.addEventListener('submit', (e) => {
  e.preventDefault();
  rejoindre(champPseudo.value);
});

// ---------------------------------------------------------------------
// Socket Events
// ---------------------------------------------------------------------
socket.on('connect', () => {
  elStatut.textContent = '';
  const pseudoMemorise = localStorage.getItem(CLE_PSEUDO);
  if (pseudoMemorise) {
    champPseudo.value = pseudoMemorise;
    rejoindre(pseudoMemorise);
  }
});

socket.on('disconnect', () => {
  elStatut.textContent = 'Connexion perdue… reconnexion en cours ⏳';
});

socket.on('etat', (etat) => {
  dernierEtat = etat;
  afficher();
});

socket.on('monClassement', (cl) => {
  monClassement = cl;
  if (dernierEtat && dernierEtat.phase === 'classement') {
    construirePlateauClassement();
  }
});

socket.on('monProfil', (profil) => {
  monProfil = profil;
  if (dernierEtat && dernierEtat.phase === 'debat') {
    mettreAJourVueJoker();
  }
});

// ---------------------------------------------------------------------
// Affichage général
// ---------------------------------------------------------------------
function afficher() {
  if (!dernierEtat) return;
  const etat = dernierEtat;

  if (monPseudo && !etat.joueurs.some((j) => j.pseudo === monPseudo)) {
    monPseudo = null;
  }

  if (!monPseudo) {
    afficherEcran('accueil');
    return;
  }

  if (etat.phase !== 'annonce') {
    annonceAffichee = false;
    arreterRoulette();
  }
  if (etat.phase !== 'vote') monVote = null;

  const estChef = etat.chefPseudo === monPseudo;
  const estCapitaine = etat.capitainePseudo === monPseudo;

  // Gestion du mode de jeu (Priorities / Quick Splash)
  const modeActuel = etat.mode || 'priorities';
  if (modePrecedentMobile !== null && modePrecedentMobile !== modeActuel) {
    declencherOndeDeChocMobile(null, null, modeActuel);
    if (typeof sons !== 'undefined' && sons && sons.joker) {
      sons.joker();
    }
  }
  modePrecedentMobile = modeActuel;

  const estQuickSplash = modeActuel === 'quicksplash';
  document.body.classList.toggle('mode-quicksplash', estQuickSplash);

  if (mobileBadgeSoiree) {
    mobileBadgeSoiree.textContent = estQuickSplash ? '🌊 VIBE QUICK SPLASH 💥' : '🍸 VIBE DE SOIRÉE 🪩';
  }
  if (mobileTitrePrincipal) {
    mobileTitrePrincipal.textContent = estQuickSplash ? 'Quick Splash' : 'Priorities';
  }
  if (btnSwitchModeMobile) {
    btnSwitchModeMobile.classList.toggle('cache', !estChef || etat.phase !== 'lobby');
  }

  if (btnRoueChef) {
    btnRoueChef.classList.toggle('cache', !estChef);
  }
  if (!estChef && modalChef && !modalChef.classList.contains('cache')) {
    fermerModalChef();
  } else if (modalChef && !modalChef.classList.contains('cache')) {
    rendreListeJoueursChef();
  }

  switch (etat.phase) {
    case 'vote':
      arreterChronoMobile();
      afficherVote(etat, estChef);
      break;
    case 'annonce':
      arreterChronoMobile();
      afficherEcran('annonce');
      if (!annonceAffichee) {
        annonceAffichee = true;
        afficherAnnonce(elZoneAnnonce, etat);
      }
      break;
    case 'classement':
      arreterChronoMobile();
      afficherClassement(etat, estChef);
      break;
    case 'classement_termine':
      arreterChronoMobile();
      afficherEcran('termine');
      break;
    case 'debat':
      afficherDebat(etat, estCapitaine);
      break;
    case 'debat_termine':
      arreterChronoMobile();
      afficherEcran('debatTermine');
      break;
    case 'resultats_manche':
      arreterChronoMobile();
      afficherResultatsManche(etat, estChef);
      break;
    case 'fin_partie':
      arreterChronoMobile();
      afficherFinPartie(etat, estChef);
      break;
    case 'qs_setup':
      arreterChronoMobile();
      afficherQsSetup(etat, estChef);
      break;
    case 'qs_ecriture':
      arreterChronoMobile();
      afficherQsEcriture(etat, estChef);
      break;
    case 'qs_classement':
      arreterChronoMobile();
      afficherQsClassement(etat, estChef);
      break;
    case 'qs_revelation':
      arreterChronoMobile();
      afficherQsRevelation(etat, estChef);
      break;
    case 'qs_fin_partie':
      arreterChronoMobile();
      afficherQsFin(etat, estChef);
      break;
    default:
      arreterChronoMobile();
      afficherLobby(etat, estChef);
  }
}

// --- Lobby ---
function afficherLobby(etat, estChef) {
  afficherEcran('lobby');
  const connectes = etat.joueurs.filter((j) => j.connecte).length;
  elCompteur.textContent = connectes + ' / ' + etat.joueursMax + ' invités dans le salon VIP';

  if (monPseudoLobby) monPseudoLobby.textContent = monPseudo || 'Moi';
  if (iconeMonAvatar) iconeMonAvatar.textContent = monAvatar;

  elListe.innerHTML = '';
  for (const joueur of etat.joueurs) {
    const estChefJ = joueur.pseudo === etat.chefPseudo;
    const estMoi = joueur.pseudo === monPseudo;
    if (estMoi && joueur.avatar) {
      monAvatar = joueur.avatar;
      if (iconeMonAvatar) iconeMonAvatar.textContent = monAvatar;
    }

    const li = creerElement('li', 'joueur-item-soiree' + (joueur.connecte ? '' : ' absent') + (estChefJ ? ' chef' : '') + (estMoi ? ' moi' : ''));
    const pastille = creerElement('span', 'pastille-avatar-mobile', joueur.avatar || '🍸');
    const nom = creerElement('span', 'pseudo-joueur-soiree', (estChefJ ? '👑 ' : '') + joueur.pseudo + (estMoi ? ' (toi)' : ''));
    li.append(pastille, nom);

    if (estMoi) {
      const btnCrayon = creerElement('button', 'btn-crayon-inline', '✏️');
      btnCrayon.type = 'button';
      btnCrayon.title = 'Changer mon avatar';
      btnCrayon.addEventListener('click', (e) => {
        e.stopPropagation();
        ouvrirSelecteurAvatar();
      });
      li.appendChild(btnCrayon);
    }

    elListe.appendChild(li);
  }

  const estQuickSplash = etat.mode === 'quicksplash';

  zoneChef.classList.toggle('cache', !estChef);
  elAttenteChef.classList.toggle('cache', estChef);
  if (estChef) {
    if (texteModeChef) {
      texteModeChef.textContent = estQuickSplash ? 'Quick Splash' : 'Priorities';
    }
    if (choixManchesConteneur && infoManchesQuickSplash) {
      choixManchesConteneur.classList.toggle('cache', estQuickSplash);
      infoManchesQuickSplash.classList.toggle('cache', !estQuickSplash);
      if (estQuickSplash) {
        infoManchesQuickSplash.textContent = '⚡ ' + connectes + ' manche' + (connectes > 1 ? 's' : '') + ' (1 par joueur connecté)';
      }
    }
    btnLancer.disabled = !etat.peutLancer;
    elAideLancer.textContent = etat.peutLancer
      ? ''
      : 'Il faut au moins ' + etat.joueursMin + ' joueurs pour lancer.';
    document.querySelectorAll('.bouton-choix').forEach((b) => {
      b.classList.toggle('actif', Number(b.dataset.manches) === etat.nbManches);
    });
  } else {
    elAttenteChef.textContent = estQuickSplash
      ? 'En attente de ' + (etat.chefPseudo || 'un chef') + ' pour lancer Quick Splash (' + connectes + ' manches)…'
      : 'En attente de ' + (etat.chefPseudo || 'un chef') + ' pour lancer la partie (' + etat.nbManches + ' manches)…';
  }
}

// --- Vote ---
function afficherVote(etat, estChef) {
  afficherEcran('vote');
  elListeThemes.innerHTML = '';
  for (const theme of etat.themes) {
    const carte = creerCarteTheme(theme, 'button');
    carte.type = 'button';
    carte.classList.toggle('choisi', theme.cle === monVote);
    carte.addEventListener('click', () => {
      monVote = theme.cle;
      socket.emit('voter', theme.cle);
      afficher();
    });
    elListeThemes.appendChild(carte);
  }
  elCompteurVotes.textContent = etat.nbVotants + ' / ' + etat.nbAttendus + ' joueurs ont voté' +
    (monVote ? ' — tu peux encore changer ton vote' : '');
  btnCloturer.classList.toggle('cache', !(estChef && etat.nbVotants > 0));
}

// --- Classement individuel tactile ---
function afficherClassement(etat, estChef) {
  afficherEcran('classement');

  const theme = etat.themeChoisi;
  badgeManche.textContent = 'Manche ' + etat.mancheActuelle + ' / ' + etat.nbManches;
  if (theme) {
    titreThemeManche.textContent = theme.emoji + ' ' + theme.nom;
    texteConsigneHaut.textContent = theme.consigneHaut;
    texteConsigneBas.textContent = theme.consigneBas;
  }

  construirePlateauClassement();

  const estValide = monClassement && monClassement.valide;
  btnValiderClassement.disabled = Boolean(estValide);
  btnValiderClassement.textContent = estValide
    ? '✅ Classement validé'
    : 'Valider mon classement';

  infoStatutClassement.textContent = etat.nbClasses + ' / ' + etat.nbAttendus + ' joueurs ont validé' +
    (estValide ? ' (en attente des autres…)' : '');

  // Bouton Reroll des mots & Affichage des votants
  if (etat.reroll && btnRerollMots) {
    btnRerollMots.classList.remove('cache');
    const monId = localStorage.getItem(CLE_ID);
    const aiVoteReroll = Array.isArray(etat.reroll.votants) && etat.reroll.votants.some((v) => v.id === monId);

    if (etat.reroll.restants <= 0) {
      btnRerollMots.disabled = true;
      btnRerollMots.innerHTML = '🎲 Changement de mots épuisé (0 restant)';
      btnRerollMots.classList.remove('vote-actif');
    } else {
      btnRerollMots.disabled = false;
      const sRestants = etat.reroll.restants > 1 ? 's' : '';
      btnRerollMots.innerHTML = `🎲 Changer de mots (<strong>${etat.reroll.votes}/${etat.reroll.requis}</strong>) <span class="badge-rerolls-restants">${etat.reroll.restants} restant${sRestants}</span>`;
      btnRerollMots.classList.toggle('vote-actif', Boolean(aiVoteReroll));
    }

    if (listeAvatarsReroll) {
      if (Array.isArray(etat.reroll.votants) && etat.reroll.votants.length > 0) {
        listeAvatarsReroll.classList.remove('cache');
        listeAvatarsReroll.innerHTML = '<span class="label-votants-reroll">Votants :</span> ' +
          etat.reroll.votants.map((v) => `<span class="bulle-avatar-votant">${v.avatar || '🍸'} <small>${v.pseudo}</small></span>`).join(' ');
      } else {
        listeAvatarsReroll.classList.add('cache');
        listeAvatarsReroll.innerHTML = '';
      }
    }
  } else if (btnRerollMots) {
    btnRerollMots.classList.add('cache');
    if (listeAvatarsReroll) listeAvatarsReroll.classList.add('cache');
  }

  btnCloturerClassement.classList.toggle('cache', !(estChef && etat.nbClasses > 0));
}

function construirePlateauClassement() {
  if (!monClassement || !monClassement.mots) return;
  const mots = monClassement.mots;
  const estValide = monClassement.valide;

  const enfants = Array.from(listeCartesMots.querySelectorAll('.carte-mot'));
  const motsActuels = enfants.map((el) => el.dataset.mot);
  const identique = motsActuels.length === mots.length && motsActuels.every((m, i) => m === mots[i]);

  if (!identique) {
    listeCartesMots.innerHTML = '';
    mots.forEach((mot, index) => {
      const carte = creerElement('div', 'carte-mot');
      carte.dataset.mot = mot;

      const badge = creerElement('span', 'badge-rang', '#' + (index + 1));
      const texte = creerElement('span', 'texte-mot', mot);
      const poignee = creerElement('span', 'poignee-drag', '≡');

      carte.append(badge, texte, poignee);
      listeCartesMots.appendChild(carte);
    });
  }

  if (!sortablePersonnel) {
    sortablePersonnel = new Sortable(listeCartesMots, {
      animation: 250,
      forceFallback: true,
      fallbackClass: 'sortable-fallback',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      fallbackOnBody: true,
      swapThreshold: 0.65,
      delay: 0,
      touchStartThreshold: 3,
      onEnd: () => {
        if (typeof navigator.vibrate === 'function') navigator.vibrate(50);
        recalculerBadgesEtEnvoyer(listeCartesMots, 'ordonnerMots');
      }
    });
  }

  sortablePersonnel.option('disabled', Boolean(estValide));
  listeCartesMots.classList.toggle('verrouille', Boolean(estValide));
}

function recalculerBadgesEtEnvoyer(conteneur, socketEvent) {
  const cartes = Array.from(conteneur.querySelectorAll('.carte-mot'));
  const nouvelOrdre = [];
  cartes.forEach((carte, index) => {
    const badge = carte.querySelector('.badge-rang');
    if (badge) badge.textContent = '#' + (index + 1);
    nouvelOrdre.push(carte.dataset.mot);
  });
  if (socketEvent === 'ordonnerMots' && monClassement) {
    monClassement.mots = nouvelOrdre;
  }
  socket.emit(socketEvent, nouvelOrdre);
}

// ---------------------------------------------------------------------
// Phase de Débat & Joker secret (Étape 5)
// ---------------------------------------------------------------------
function afficherDebat(etat, estCapitaine) {
  afficherEcran('debat');
  badgeMancheDebat.textContent = 'Manche ' + etat.mancheActuelle + ' / ' + etat.nbManches;

  // Affichage selon le rôle
  zoneCapitaine.classList.toggle('cache', !estCapitaine);
  zoneNonCapitaine.classList.toggle('cache', estCapitaine);

  if (estCapitaine) {
    construirePlateauGroupe(etat.ordreGroupe || etat.motsManche);
  } else {
    pseudoCapitaineMobile.textContent = etat.capitainePseudo || 'Le chef';
  }

  mettreAJourVueJoker();
  lancerChronoMobile(etat.debutDebat, etat.dureeDebatS, etat.dureeJokerMs);
}

function construirePlateauGroupe(mots) {
  if (!Array.isArray(mots)) return;
  const enfants = Array.from(listeCartesGroupe.querySelectorAll('.carte-mot'));
  const motsActuels = enfants.map((el) => el.dataset.mot);
  const identique = motsActuels.length === mots.length && motsActuels.every((m, i) => m === mots[i]);

  if (!identique) {
    listeCartesGroupe.innerHTML = '';
    mots.forEach((mot, index) => {
      const carte = creerElement('div', 'carte-mot');
      carte.dataset.mot = mot;

      const badge = creerElement('span', 'badge-rang', '#' + (index + 1));
      const texte = creerElement('span', 'texte-mot', mot);
      const poignee = creerElement('span', 'poignee-drag', '≡');

      carte.append(badge, texte, poignee);
      listeCartesGroupe.appendChild(carte);
    });
  }

  if (!sortableGroupe) {
    sortableGroupe = new Sortable(listeCartesGroupe, {
      animation: 250,
      forceFallback: true,
      fallbackClass: 'sortable-fallback',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      fallbackOnBody: true,
      swapThreshold: 0.65,
      delay: 0,
      touchStartThreshold: 3,
      onEnd: () => {
        if (typeof navigator.vibrate === 'function') navigator.vibrate(50);
        recalculerBadgesEtEnvoyer(listeCartesGroupe, 'ordonnerGroupe');
      }
    });
  }
}

function mettreAJourVueJoker() {
  const utilise = monProfil.jokerUtilise;
  const maintenant = Date.now();
  const debut = (dernierEtat && dernierEtat.debutDebat) || maintenant;
  const delaiEcoule = maintenant - debut > (dernierEtat && dernierEtat.dureeJokerMs || 120000);

  if (utilise) {
    texteStatutJoker.textContent = '🃏 Tu as déjà utilisé ton joker pour cette partie.';
    btnActiverJoker.classList.add('cache');
    delaiJokerInfo.textContent = 'Un seul joker par partie.';
  } else if (delaiEcoule) {
    texteStatutJoker.textContent = '🔒 Délai du joker expiré pour cette manche.';
    btnActiverJoker.disabled = true;
    delaiJokerInfo.textContent = 'Le joker était actif pendant les 2 premières minutes.';
  } else {
    texteStatutJoker.textContent = '🃏 Tu as 1 joker secret pour toute la partie.';
    btnActiverJoker.classList.remove('cache');
    btnActiverJoker.disabled = false;
    delaiJokerInfo.textContent = 'Activable pendant les 2 premières minutes du débat.';
  }
}

// Ouvre l'éditeur secret de joker
function ouvrirEditeurJoker() {
  blocDeclencherJoker.classList.add('cache');
  blocEditionJoker.classList.remove('cache');

  if (!monClassement || !monClassement.mots) return;
  const mots = monClassement.mots;

  listeCartesJoker.innerHTML = '';
  mots.forEach((mot, index) => {
    const carte = creerElement('div', 'carte-mot');
    carte.dataset.mot = mot;

    const badge = creerElement('span', 'badge-rang', '#' + (index + 1));
    const texte = creerElement('span', 'texte-mot', mot);
    const poignee = creerElement('span', 'poignee-drag', '≡');

    carte.append(badge, texte, poignee);
    listeCartesJoker.appendChild(carte);
  });

  if (!sortableJoker) {
    sortableJoker = new Sortable(listeCartesJoker, {
      animation: 250,
      forceFallback: true,
      fallbackClass: 'sortable-fallback',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      fallbackOnBody: true,
      swapThreshold: 0.65,
      delay: 0,
      touchStartThreshold: 3,
      onEnd: () => {
        if (typeof navigator.vibrate === 'function') navigator.vibrate(50);
        const cartes = Array.from(listeCartesJoker.querySelectorAll('.carte-mot'));
        cartes.forEach((c, idx) => {
          const b = c.querySelector('.badge-rang');
          if (b) b.textContent = '#' + (idx + 1);
        });
      }
    });
  }
}

function lancerChronoMobile(debutTimestamp, dureeMaxSec, dureeJokerMs) {
  if (intervalleChronoMobile) clearInterval(intervalleChronoMobile);
  const debut = debutTimestamp || Date.now();
  const finDebat = debut + (dureeMaxSec || 180) * 1000;

  function tick() {
    const maintenant = Date.now();
    const restantDebat = Math.max(0, Math.floor((finDebat - maintenant) / 1000));
    const minutes = Math.floor(restantDebat / 60);
    const secondes = restantDebat % 60;
    chronoDebatMobile.textContent = String(minutes).padStart(2, '0') + ':' + String(secondes).padStart(2, '0');

    mettreAJourVueJoker();
  }

  tick();
  intervalleChronoMobile = setInterval(tick, 1000);
}

function arreterChronoMobile() {
  if (intervalleChronoMobile) {
    clearInterval(intervalleChronoMobile);
    intervalleChronoMobile = null;
  }
}

// ---------------------------------------------------------------------
// Actions utilisateur
// ---------------------------------------------------------------------
document.querySelectorAll('.bouton-choix').forEach((bouton) => {
  bouton.addEventListener('click', () => {
    socket.emit('reglerManches', Number(bouton.dataset.manches));
  });
});

btnLancer.addEventListener('click', () => {
  elAideLancer.textContent = '';
  socket.emit('lancerPartie', (reponse) => {
    if (reponse && !reponse.ok) elAideLancer.textContent = reponse.erreur;
  });
});

btnCloturer.addEventListener('click', () => socket.emit('cloturerVote'));

btnValiderClassement.addEventListener('click', () => {
  recalculerBadgesEtEnvoyer(listeCartesMots, 'ordonnerMots');
  socket.emit('validerClassement');
  if (monClassement) monClassement.valide = true;
  afficher();
});

btnCloturerClassement.addEventListener('click', () => {
  socket.emit('cloturerClassement');
});

// Capitaine : validation du groupe
btnValiderGroupe.addEventListener('click', () => {
  recalculerBadgesEtEnvoyer(listeCartesGroupe, 'ordonnerGroupe');
  socket.emit('validerGroupe');
});

// Joker : activation
btnActiverJoker.addEventListener('click', () => {
  socket.emit('utiliserJoker', (reponse) => {
    if (reponse && reponse.ok) {
      monProfil.jokerUtilise = true;
      ouvrirEditeurJoker();
    } else if (reponse && reponse.erreur) {
      alert(reponse.erreur);
    }
  });
});

// Joker : validation secrète
btnValiderJoker.addEventListener('click', () => {
  const cartes = Array.from(listeCartesJoker.querySelectorAll('.carte-mot'));
  const nouvelOrdre = cartes.map((c) => c.dataset.mot);

  // Règle Chef/Capitaine : interdiction formelle de copier à 100% le classement du groupe
  const estChefOuCapitaine = Boolean(dernierEtat && (dernierEtat.chefPseudo === monPseudo || dernierEtat.capitainePseudo === monPseudo));
  if (estChefOuCapitaine && dernierEtat && Array.isArray(dernierEtat.ordreGroupe)) {
    const identiqueAuGroupe = nouvelOrdre.every((m, idx) => m === dernierEtat.ordreGroupe[idx]);
    if (identiqueAuGroupe) {
      alert('👑 En tant que chef, tu n\'as pas le droit de copier exactement le classement du groupe avec ton joker ! Il doit y avoir au moins 1 différence.');
      return;
    }
  }

  socket.emit('validerJoker', nouvelOrdre, (reponse) => {
    if (reponse && !reponse.ok) {
      alert(reponse.erreur);
      return;
    }
    if (monClassement) {
      monClassement.mots = nouvelOrdre;
      monClassement.valide = true;
    }
    blocEditionJoker.classList.add('cache');
    blocDeclencherJoker.classList.remove('cache');
    texteStatutJoker.textContent = '🤫 Modification secrète enregistrée !';
    btnActiverJoker.classList.add('cache');
    delaiJokerInfo.textContent = 'Ton joker a été utilisé pour cette partie.';
  });
});

// Mini-réactions en direct pendant le débat (anti-spam 600ms)
let dernierEnvoiReaction = 0;
document.querySelectorAll('.btn-reaction').forEach((btn) => {
  btn.addEventListener('click', () => {
    const maintenant = Date.now();
    if (maintenant - dernierEnvoiReaction < 600) return;
    dernierEnvoiReaction = maintenant;

    const emoji = btn.dataset.emoji || '🔥';
    const texte = btn.dataset.texte || '';

    btn.classList.add('clic-anime');
    setTimeout(() => btn.classList.remove('clic-anime'), 250);
    if (typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(40); } catch (e) {}
    }

    socket.emit('reactionDebat', { emoji, texte });
  });
});

// =====================================================
// Résultats de la manche & Fin de partie (Étape 6)
// =====================================================

function afficherResultatsManche(etat, estChef) {
  afficherEcran('resultatsManche');
  badgeMancheResultatsMobile.textContent = 'Manche ' + etat.mancheActuelle + ' / ' + etat.nbManches;

  const res = etat.dernierResultatManche;
  if (!res) return;

  // Trouver mes données de score
  const monRes = res.joueurs.find((j) => j.pseudo === monPseudo);
  if (monRes) {
    scoreMancheJoueur.textContent = '+' + monRes.pointsManche + ' pts';
    scoreTotalJoueur.textContent = 'Total : ' + monRes.pointsTotal + ' pts';

    // Détail mot par mot
    listeDetailsScoreMobile.innerHTML = '';
    monRes.details.forEach((d) => {
      const ligne = creerElement('div', 'detail-score-item');
      let classeDistance = 'dist-loin';
      let tagLabel = '0 pt (écart ' + d.distance + ')';
      if (d.distance === 0) {
        classeDistance = 'dist-exact';
        tagLabel = '🎯 +3 pts (pile poil !)';
      } else if (d.distance === 1) {
        classeDistance = 'dist-proche';
        tagLabel = '👌 +1 pt (proche)';
      }
      ligne.classList.add(classeDistance);

      const nomMot = creerElement('div', 'detail-mot-nom', d.mot);
      const rangs = creerElement('div', 'detail-mot-rangs');
      rangs.innerHTML = 'Toi : <strong>#' + d.rangJoueur + '</strong> · Groupe : <strong>#' + d.rangGroupe + '</strong>';

      const badgePoints = creerElement('span', 'detail-badge-pts ' + classeDistance, tagLabel);
      ligne.append(nomMot, rangs, badgePoints);
      listeDetailsScoreMobile.appendChild(ligne);
    });
  }

  // Classement général provisoire de la partie
  listeClassementProvisoireMobile.innerHTML = '';
  res.joueurs.forEach((j, index) => {
    const li = creerElement('li', 'item-classement-provisoire' + (j.pseudo === monPseudo ? ' moi' : ''));
    const rang = creerElement('span', 'rang-numero', '#' + (index + 1));
    const nom = creerElement('span', 'joueur-nom-score', j.pseudo + (j.pseudo === monPseudo ? ' (toi)' : ''));
    const pts = creerElement('span', 'joueur-pts-total', j.pointsTotal + ' pts (+' + j.pointsManche + ')');
    li.append(rang, nom, pts);
    listeClassementProvisoireMobile.appendChild(li);
  });

  // Commandes de transition de manche & retour au lobby (Chef uniquement)
  actionsResultatsChef.classList.toggle('cache', !estChef);
  attenteChefResultats.classList.toggle('cache', estChef);

  if (estChef) {
    const estDerniereManche = etat.mancheActuelle >= etat.nbManches;
    btnMancheSuivante.classList.toggle('cache', estDerniereManche);
    btnMancheSuivante.disabled = false;
    btnVoirPodium.classList.toggle('cache', !estDerniereManche);
    btnVoirPodium.disabled = false;
  } else {
    attenteChefResultats.textContent = 'En attente de ' + (etat.chefPseudo || 'le chef') + ' pour passer à la suite…';
  }
}

function afficherFinPartie(etat, estChef) {
  afficherEcran('finPartie');
  const podium = etat.podium || [];
  const statsGlobales = etat.statsGlobales || {};

  // Trouver mon rang
  const moi = podium.find((j) => j.pseudo === monPseudo);
  if (moi) {
    const bonusTxt = moi.bonusJoker > 0 ? ' (dont +8 pts bonus joker 🃏 !)' : '';
    if (moi.rang === 1) {
      iconeFinPartie.textContent = '👑';
      titreFinPartie.textContent = 'Victoire !';
      texteRangFinal.textContent = 'Félicitations, tu remportes la partie avec ' + moi.total + ' pts ' + bonusTxt;
      // Confettis de victoire et vibration sur le téléphone du vainqueur !
      if (window.confettis) window.confettis.explosion();
      if (navigator.vibrate) {
        try { navigator.vibrate([150, 80, 150, 80, 300]); } catch (e) {}
      }
    } else {
      iconeFinPartie.textContent = '🏆';
      titreFinPartie.textContent = 'Partie terminée !';
      texteRangFinal.textContent = 'Tu termines à la ' + moi.rang + 'ème place avec ' + moi.total + ' pts' + bonusTxt;
    }
  }

  // Liste complète du classement final
  listePodiumMobile.innerHTML = '';
  podium.forEach((j) => {
    const li = creerElement('li', 'item-podium-mobile' + (j.rang === 1 ? ' vainqueur' : '') + (j.pseudo === monPseudo ? ' moi' : ''));
    let medaille = '#' + j.rang;
    if (j.rang === 1) medaille = '🥇 #1';
    else if (j.rang === 2) medaille = '🥈 #2';
    else if (j.rang === 3) medaille = '🥉 #3';

    const spanRang = creerElement('span', 'podium-rang-badge', medaille);
    const spanAvatar = creerElement('span', 'podium-avatar-pastille', j.avatar || '🍸');
    const spanNom = creerElement('span', 'podium-pseudo', j.pseudo + (j.pseudo === monPseudo ? ' (toi)' : ''));
    const bonusTxt = j.bonusJoker > 0 ? ' (🃏 +8)' : '';
    const spanScore = creerElement('span', 'podium-score-total', j.total + ' pts' + bonusTxt);

    li.append(spanRang, spanAvatar, spanNom, spanScore);
    listePodiumMobile.appendChild(li);
  });

  // Trophées humoristiques
  const elTropheesMobile = document.getElementById('liste-trophees-mobile');
  if (elTropheesMobile) {
    elTropheesMobile.innerHTML = '';
    const trophees = etat.trophees || [];
    trophees.forEach((t) => {
      const carte = creerElement('div', 'item-trophee-mobile');
      const icone = creerElement('span', 'trophee-icone-mobile', t.icone);
      const bloc = creerElement('div', 'trophee-bloc-mobile');
      const titre = creerElement('div', 'trophee-titre-mobile', t.titre + ' : ' + t.pseudos);
      const desc = creerElement('div', 'trophee-desc-mobile', t.desc);
      bloc.append(titre, desc);
      carte.append(icone, bloc);
      elTropheesMobile.appendChild(carte);
    });
  }

  // Carrière / Statistiques du pseudo
  if (monPseudo) {
    const cle = monPseudo.toLowerCase();
    const st = statsGlobales[cle];
    if (st) {
      blocCarriereMobile.innerHTML = '<h4>📊 Ta carrière ("' + monPseudo + '")</h4>' +
        '<div class="grille-carriere-mobile">' +
        '<div>🏆 Victoires : <strong>' + st.victoires + '</strong></div>' +
        '<div>🎮 Parties : <strong>' + st.partiesJouees + '</strong></div>' +
        '<div>⭐ Record : <strong>' + st.meilleurePartie + ' pts</strong></div>' +
        '<div>📈 Cumul : <strong>' + st.scoreTotal + ' pts</strong></div>' +
        '</div>';
    }
  }

  // Bouton pour relancer
  actionsFinChef.classList.toggle('cache', !estChef);
  attenteChefFin.classList.toggle('cache', estChef);
}

btnMancheSuivante.addEventListener('click', () => {
  btnMancheSuivante.disabled = true;
  socket.emit('mancheSuivante');
  setTimeout(() => { btnMancheSuivante.disabled = false; }, 1500);
});

btnVoirPodium.addEventListener('click', () => {
  btnVoirPodium.disabled = true;
  socket.emit('terminerPartie');
  setTimeout(() => { btnVoirPodium.disabled = false; }, 1500);
});

if (btnRetourLobbyResultats) {
  btnRetourLobbyResultats.addEventListener('click', () => {
    socket.emit('retourLobby');
  });
}

btnRejouerLobby.addEventListener('click', () => socket.emit('retourLobby'));

// Déconnexion instantanée du socket lors de la fermeture de l'onglet ou mise en veille
window.addEventListener('beforeunload', () => {
  socket.disconnect();
});
window.addEventListener('pagehide', () => {
  socket.disconnect();
});

// ---------------------------------------------------------------------
// Gestion du Reroll des mots de la manche
// ---------------------------------------------------------------------
if (btnRerollMots) {
  btnRerollMots.addEventListener('click', () => {
    audio.popReaction();
    socket.emit('voterRerollMots');
  });
}

socket.on('motsRerolles', () => {
  if (typeof audio.sonReroll === 'function') audio.sonReroll();
});

// ---------------------------------------------------------------------
// Gestion des joueurs par le Chef (⚙️)
// ---------------------------------------------------------------------
function ouvrirModalChef() {
  if (!dernierEtat || !modalChef) return;
  modalChef.classList.remove('cache');
  if (btnRetourLobbyModalChef) {
    btnRetourLobbyModalChef.disabled = Boolean(dernierEtat.phase === 'lobby');
  }
  rendreListeJoueursChef();
}

function fermerModalChef() {
  if (modalChef) modalChef.classList.add('cache');
}

function rendreListeJoueursChef() {
  if (!dernierEtat || !listeJoueursChef) return;
  listeJoueursChef.innerHTML = '';

  const autresJoueurs = dernierEtat.joueurs.filter((j) => j.pseudo !== monPseudo);
  if (autresJoueurs.length === 0) {
    listeJoueursChef.innerHTML = '<p class="compteur">Aucun autre joueur dans la partie.</p>';
    return;
  }

  for (const j of autresJoueurs) {
    const carte = creerElement('div', 'carte-joueur-chef');

    const info = creerElement('div', 'joueur-chef-info');
    info.innerHTML = `<span>${j.avatar || '🍸'}</span> <span>${j.pseudo}</span>`;

    const actions = creerElement('div', 'joueur-chef-actions');

    const btnNommer = creerElement('button', 'btn-action-chef btn-nommer-chef', '👑 Nommer chef');
    btnNommer.type = 'button';
    btnNommer.addEventListener('click', () => {
      audio.popReaction();
      socket.emit('nommerChef', j.id, (res) => {
        if (res && res.ok) {
          fermerModalChef();
        } else if (res && res.erreur) {
          alert(res.erreur);
        }
      });
    });

    const btnKicker = creerElement('button', 'btn-action-chef btn-kicker-joueur', '❌ Exclure');
    btnKicker.type = 'button';
    btnKicker.addEventListener('click', () => {
      if (confirm(`Es-tu sûr de vouloir exclure ${j.pseudo} de la partie ?`)) {
        audio.popReaction();
        socket.emit('kickerJoueur', j.id, (res) => {
          if (res && res.ok) {
            rendreListeJoueursChef();
          } else if (res && res.erreur) {
            alert(res.erreur);
          }
        });
      }
    });

    actions.append(btnNommer, btnKicker);
    carte.append(info, actions);
    listeJoueursChef.appendChild(carte);
  }
}

if (btnRoueChef) btnRoueChef.addEventListener('click', ouvrirModalChef);
if (btnFermerModalChef) btnFermerModalChef.addEventListener('click', fermerModalChef);
if (modalChefBackdrop) modalChefBackdrop.addEventListener('click', fermerModalChef);

if (btnRetourLobbyModalChef) {
  btnRetourLobbyModalChef.addEventListener('click', () => {
    if (dernierEtat && dernierEtat.phase === 'lobby') {
      alert('La partie est déjà dans le lobby.');
      return;
    }
    if (confirm('Voulez-vous vraiment interrompre la partie en cours et retourner au lobby ?')) {
      audio.popReaction();
      socket.emit('retourLobby', (res) => {
        if (res && res.erreur) {
          alert(res.erreur);
        } else {
          fermerModalChef();
        }
      });
    }
  });
}

socket.on('kicke', (msg) => {
  localStorage.removeItem(CLE_ID);
  localStorage.removeItem(CLE_PSEUDO);
  alert(msg || 'Tu as été exclu de la partie.');
  window.location.reload();
});

// Onde de choc et switch de mode mobile
let coordonneesClicSwitchMobile = null;

function declencherOndeDeChocMobile(x, y, modeCible) {
  if (!ondeDeChocMobile) return;

  if (x === undefined || y === undefined || x === null || y === null) {
    if (coordonneesClicSwitchMobile) {
      x = coordonneesClicSwitchMobile.x;
      y = coordonneesClicSwitchMobile.y;
    } else if (btnSwitchModeMobile && !btnSwitchModeMobile.classList.contains('cache')) {
      const rect = btnSwitchModeMobile.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (btnToggleModeChef) {
      const rect = btnToggleModeChef.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else {
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }
  }
  coordonneesClicSwitchMobile = null;

  ondeDeChocMobile.style.setProperty('--onde-x', `${Math.round(x)}px`);
  ondeDeChocMobile.style.setProperty('--onde-y', `${Math.round(y)}px`);

  ondeDeChocMobile.classList.remove('actif', 'vers-quicksplash', 'vers-priorities');
  void ondeDeChocMobile.offsetWidth;

  const classeMode = modeCible === 'quicksplash' ? 'vers-quicksplash' : 'vers-priorities';
  ondeDeChocMobile.classList.add('actif', classeMode);

  document.body.classList.remove('secousse-mode');
  void document.body.offsetWidth;
  document.body.classList.add('secousse-mode');

  setTimeout(() => {
    document.body.classList.remove('secousse-mode');
  }, 700);

  setTimeout(() => {
    ondeDeChocMobile.classList.remove('actif', 'vers-quicksplash', 'vers-priorities');
  }, 2000);
}

function basculerModeJeu(e) {
  if (e && e.clientX !== undefined) {
    coordonneesClicSwitchMobile = { x: e.clientX, y: e.clientY };
  }
  socket.emit('changerMode', null, (res) => {
    if (res && res.erreur) {
      alert(res.erreur);
    }
  });
}

if (btnSwitchModeMobile) {
  btnSwitchModeMobile.addEventListener('click', basculerModeJeu);
}
if (btnToggleModeChef) {
  btnToggleModeChef.addEventListener('click', basculerModeJeu);
}

// =====================================================================
// LOGIQUE DU MODE QUICK SPLASH (Mobile)
// =====================================================================

let qsManchePrecedente = 0;
let reponsesConstruitesManche = 0;

async function chargerBanqueIdeesQuickSplash() {
  if (qsBanqueIdees) return qsBanqueIdees;
  try {
    const res = await fetch('/api/quicksplash');
    if (res.ok) {
      qsBanqueIdees = await res.json();
    }
  } catch (err) {
    console.warn('Impossible de charger les banques d\'idées Quick Splash :', err);
  }
  return qsBanqueIdees;
}

function selectionnerTypeAmorce(type) {
  qsTypeSelectionne = type;
  if (btnQsTypeTrou && btnQsTypeQuestion) {
    btnQsTypeTrou.classList.toggle('actif', type === 'trou');
    btnQsTypeQuestion.classList.toggle('actif', type === 'question');
  }
  if (qsHintType) {
    qsHintType.textContent = type === 'trou' ? 'Remplis avec 3 tirets ___' : 'Pose une question ouverte bien piquante';
  }
  if (qsInputAmorce) {
    qsInputAmorce.placeholder = type === 'trou'
      ? 'Ex: Ce soir, la soiree part en vrille des que ___'
      : 'Ex: Tu ferais quoi si tu croisais ton ex dans ce bar ?';
  }
}

async function piocherIdeeMagique() {
  const donnees = await chargerBanqueIdeesQuickSplash();
  if (!donnees) return;
  const liste = qsTypeSelectionne === 'question' ? donnees.questions : donnees.textesATrous;
  if (Array.isArray(liste) && liste.length > 0) {
    const idee = liste[Math.floor(Math.random() * liste.length)];
    if (qsInputAmorce) {
      qsInputAmorce.value = idee;
      if (qsCompteurCaracteresAmorce) {
        qsCompteurCaracteresAmorce.textContent = idee.length;
      }
      if (window.audio && typeof window.audio.sonReroll === 'function') {
        window.audio.sonReroll();
      }
    }
  }
}

function validerAmorceQs() {
  if (!qsInputAmorce) return;
  const texte = qsInputAmorce.value.trim();
  if (texte.length < 3) {
    alert('Ton amorce est trop courte !');
    return;
  }
  if (qsTypeSelectionne === 'trou' && !texte.includes('___')) {
    if (!confirm('Ton texte à trous ne contient pas "___". Veux-tu l\'envoyer quand même ?')) {
      return;
    }
  }
  btnQsValiderAmorce.disabled = true;
  socket.emit('qsSoumettreAmorce', { type: qsTypeSelectionne, texte: texte }, (res) => {
    btnQsValiderAmorce.disabled = false;
    if (res && !res.ok) {
      alert(res.erreur || 'Erreur lors de la validation.');
    } else {
      if (window.audio && typeof window.audio.popReaction === 'function') {
        window.audio.popReaction();
      }
    }
  });
}

function afficherQsSetup(etat, estChef) {
  afficherEcran('qsSetup');
  const moi = (etat.joueurs || []).find((j) => j.pseudo === monPseudo);
  const dejaSoumis = moi && moi.aSoumisAmorce;
  const qs = etat.quicksplash || {};

  if (qsActionsSetup) qsActionsSetup.classList.toggle('cache', Boolean(dejaSoumis));
  if (qsAttenteSetup) qsAttenteSetup.classList.toggle('cache', !dejaSoumis);

  if (dejaSoumis && qsStatutAmorcesAttente) {
    qsStatutAmorcesAttente.textContent = `En attente des autres joueurs (${qs.nbAmorcesValidees || 0} / ${qs.nbJoueursTotal || etat.joueurs.length})…`;
  }
}

function validerReponseQs() {
  if (!qsInputReponse) return;
  const texte = qsInputReponse.value.trim();
  if (!texte) {
    alert('Écris au moins un mot ou une punchline !');
    return;
  }
  btnQsValiderReponse.disabled = true;
  socket.emit('qsSoumettreReponse', texte, (res) => {
    btnQsValiderReponse.disabled = false;
    if (res && !res.ok) {
      alert(res.erreur || 'Erreur lors de l\'envoi.');
    } else {
      if (window.audio && typeof window.audio.popReaction === 'function') {
        window.audio.popReaction();
      }
    }
  });
}

function afficherQsEcriture(etat, estChef) {
  afficherEcran('qsEcriture');
  const qs = etat.quicksplash || {};
  const amorce = qs.amorceManche || { type: 'trou', texte: '...' };

  // Réinitialisation si nouvelle manche
  if (qsManchePrecedente !== etat.mancheActuelle) {
    qsManchePrecedente = etat.mancheActuelle;
    reponsesConstruitesManche = 0;
    qsSniperChoisi = null;
    mettreAJourResumeSniper();
    if (qsInputReponse) {
      qsInputReponse.value = '';
      if (qsCompteurCaracteresReponse) qsCompteurCaracteresReponse.textContent = '0';
    }
  }

  if (qsBadgeMancheEcriture) {
    qsBadgeMancheEcriture.textContent = `Manche ${etat.mancheActuelle} / ${etat.nbManches}`;
  }

  if (qsIconeAmorce) {
    qsIconeAmorce.textContent = amorce.type === 'question' ? '❓' : '📝';
  }
  if (qsTexteAmorce) {
    qsTexteAmorce.textContent = amorce.texte;
  }

  const moi = (etat.joueurs || []).find((j) => j.pseudo === monPseudo);
  const dejaRepondu = moi && moi.aSoumisReponse;

  if (qsZoneSaisieReponse) qsZoneSaisieReponse.classList.toggle('cache', Boolean(dejaRepondu));
  if (qsAttenteEcriture) qsAttenteEcriture.classList.toggle('cache', !dejaRepondu);

  if (qsChronoEcriture) {
    qsChronoEcriture.textContent = qs.tempsRestantEcriture !== undefined ? qs.tempsRestantEcriture : 45;
  }
  if (qsChronoEcritureBox) {
    qsChronoEcritureBox.classList.toggle('chrono-stress', (qs.tempsRestantEcriture || 45) <= 10);
  }
}

// --- Chrono Socket Tick ---
socket.on('qsChronoTick', ({ tempsRestant }) => {
  if (qsChronoEcriture) {
    qsChronoEcriture.textContent = tempsRestant;
  }
  if (qsChronoEcritureBox) {
    const estStress = tempsRestant <= 10;
    qsChronoEcritureBox.classList.toggle('chrono-stress', estStress);
    if (estStress && window.audio && typeof window.audio.bipCompte === 'function') {
      window.audio.bipCompte(tempsRestant <= 3);
    }
  }
});

// --- Classement SortableJS & Sniper ---
function recalculerBadgesQs() {
  if (!qsListeCartesClassement) return;
  const cartes = qsListeCartesClassement.querySelectorAll('.qs-carte-sortable');
  cartes.forEach((carte, idx) => {
    const badge = carte.querySelector('.qs-badge-rang-mobile');
    if (badge) {
      badge.className = 'qs-badge-rang-mobile';
      if (idx === 0) {
        badge.classList.add('rang-1');
        badge.textContent = '#1 (+3)';
      } else if (idx === 1) {
        badge.classList.add('rang-2');
        badge.textContent = '#2 (+2)';
      } else if (idx === 2) {
        badge.classList.add('rang-3');
        badge.textContent = '#3 (+1)';
      } else {
        badge.classList.add('rang-autre');
        badge.textContent = '#' + (idx + 1);
      }
    }
  });
}

function initialiserSortableQs() {
  if (!qsListeCartesClassement || typeof Sortable === 'undefined') return;
  if (sortableQsClassement) {
    sortableQsClassement.destroy();
    sortableQsClassement = null;
  }
  sortableQsClassement = new Sortable(qsListeCartesClassement, {
    animation: 200,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: () => {
      recalculerBadgesQs();
      if (window.audio && typeof window.audio.clicRoulette === 'function') {
        window.audio.clicRoulette(550);
      }
    }
  });
}

function construireCartesClassementQs(reponses) {
  if (!qsListeCartesClassement) return;
  qsListeCartesClassement.innerHTML = '';
  reponses.forEach((rep, idx) => {
    const carte = creerElement('div', 'qs-carte-sortable');
    carte.dataset.idReponse = rep.id;

    const texte = creerElement('span', 'qs-carte-sortable-texte', rep.texte);
    const badge = creerElement('span', 'qs-badge-rang-mobile');
    carte.append(texte, badge);
    qsListeCartesClassement.appendChild(carte);
  });

  recalculerBadgesQs();
  initialiserSortableQs();
}

function afficherQsClassement(etat, estChef) {
  afficherEcran('qsClassement');
  const qs = etat.quicksplash || {};
  const reponses = qs.reponsesAnonymes || [];

  if (qsBadgeMancheClassement) {
    qsBadgeMancheClassement.textContent = `Manche ${etat.mancheActuelle} / ${etat.nbManches}`;
  }
  if (qsTexteRappelClassement && qs.amorceManche) {
    qsTexteRappelClassement.textContent = qs.amorceManche.texte;
  }

  const moi = (etat.joueurs || []).find((j) => j.pseudo === monPseudo);
  const dejaClasse = moi && moi.aClasse;

  if (btnQsValiderClassement) btnQsValiderClassement.parentElement.classList.toggle('cache', Boolean(dejaClasse));
  if (btnQsOuvrirSniper) btnQsOuvrirSniper.parentElement.classList.toggle('cache', Boolean(dejaClasse));
  if (qsAttenteClassement) qsAttenteClassement.classList.toggle('cache', !dejaClasse);

  if (dejaClasse && qsStatutClassementsAttente) {
    qsStatutClassementsAttente.textContent = `En attente des autres joueurs (${qs.nbClassesValides || 0} / ${qs.nbJoueursTotal || etat.joueurs.length})…`;
  }

  if (!dejaClasse && reponses.length > 0 && reponsesConstruitesManche !== etat.mancheActuelle) {
    reponsesConstruitesManche = etat.mancheActuelle;
    construireCartesClassementQs(reponses);
  }
}

function validerClassementQs() {
  if (!qsListeCartesClassement) return;
  const cartes = qsListeCartesClassement.querySelectorAll('.qs-carte-sortable');
  const ordreIds = Array.from(cartes).map((c) => c.dataset.idReponse);
  const payload = {
    ordreIds: ordreIds,
    sniper: qsSniperChoisi ? {
      idReponse: qsSniperChoisi.idReponse,
      idJoueurAccuse: qsSniperChoisi.idJoueurAccuse
    } : null
  };

  btnQsValiderClassement.disabled = true;
  socket.emit('qsValiderClassement', payload, (res) => {
    btnQsValiderClassement.disabled = false;
    if (res && !res.ok) {
      alert(res.erreur || 'Erreur lors de la validation.');
    } else {
      if (window.audio && typeof window.audio.popReaction === 'function') {
        window.audio.popReaction();
      }
    }
  });
}

// Sniper Modal Handlers
function ouvrirModalSniper(etat) {
  if (!modalQsSniper || !qsSelectSniperCarte || !qsSelectSniperJoueur || !etat) return;
  const reponses = (etat.quicksplash && etat.quicksplash.reponsesAnonymes) || [];
  const autresJoueurs = (etat.joueurs || []).filter((j) => j.pseudo !== monPseudo && j.connecte);

  qsSelectSniperCarte.innerHTML = '';
  reponses.forEach((r, idx) => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `Punchline #${idx + 1} : "${r.texte.slice(0, 36)}${r.texte.length > 36 ? '…' : ''}"`;
    qsSelectSniperCarte.appendChild(opt);
  });

  qsSelectSniperJoueur.innerHTML = '';
  autresJoueurs.forEach((j) => {
    const opt = document.createElement('option');
    opt.value = j.id;
    opt.textContent = `${j.avatar || '🍸'} ${j.pseudo}`;
    qsSelectSniperJoueur.appendChild(opt);
  });

  modalQsSniper.classList.remove('cache');
}

function fermerModalSniper() {
  if (modalQsSniper) modalQsSniper.classList.add('cache');
}

function confirmerSniper() {
  if (!qsSelectSniperCarte || !qsSelectSniperJoueur) return;
  const idReponse = qsSelectSniperCarte.value;
  const idJoueurAccuse = qsSelectSniperJoueur.value;
  const optJoueur = qsSelectSniperJoueur.options[qsSelectSniperJoueur.selectedIndex];
  const optCarte = qsSelectSniperCarte.options[qsSelectSniperCarte.selectedIndex];

  if (!idReponse || !idJoueurAccuse) return;

  qsSniperChoisi = {
    idReponse: idReponse,
    idJoueurAccuse: idJoueurAccuse,
    pseudoAccuse: optJoueur ? optJoueur.textContent : 'un joueur',
    texteCarte: optCarte ? optCarte.textContent : 'une carte'
  };

  mettreAJourResumeSniper();
  fermerModalSniper();
  if (window.audio && typeof window.audio.popReaction === 'function') {
    window.audio.popReaction();
  }
}

function annulerSniper() {
  qsSniperChoisi = null;
  mettreAJourResumeSniper();
}

function mettreAJourResumeSniper() {
  if (!qsSniperResume || !qsSniperResumeTexte) return;
  if (qsSniperChoisi) {
    qsSniperResume.classList.remove('cache');
    qsSniperResumeTexte.textContent = `Tu accuses ${qsSniperChoisi.pseudoAccuse} sur ${qsSniperChoisi.texteCarte}`;
  } else {
    qsSniperResume.classList.add('cache');
    qsSniperResumeTexte.textContent = '';
  }
}

// --- Révélations & Slam Animation (Écran 4) ---
function afficherQsRevelation(etat, estChef) {
  afficherEcran('qsRevelation');
  const qs = etat.quicksplash;
  if (!qs || !qs.resultatsManche) return;
  const resManche = qs.resultatsManche;

  if (qsBadgeMancheRevelation) {
    qsBadgeMancheRevelation.textContent = `Manche ${etat.mancheActuelle} / ${etat.nbManches}`;
  }

  // Score perso
  const monInfo = (resManche.scoresJoueurs || []).find((s) => s.pseudo === monPseudo) || {
    ptsVotes: 0, malusBot: 0, ptsSniper: 0, totalManche: 0
  };
  const moiGlobal = (etat.joueurs || []).find((j) => j.pseudo === monPseudo);
  const scoreTotal = moiGlobal ? moiGlobal.scoreTotal : 0;

  if (qsScoreMancheJoueur) {
    const signe = monInfo.totalManche >= 0 ? '+' : '';
    qsScoreMancheJoueur.textContent = `${signe}${monInfo.totalManche} pts`;
  }
  if (qsScoreTotalJoueur) {
    qsScoreTotalJoueur.textContent = `Total : ${scoreTotal} pts`;
  }

  // Alertes joueur (malus bot, sniper)
  if (qsAlertesMancheJoueur) {
    qsAlertesMancheJoueur.innerHTML = '';
    if (monInfo.piegeParBot) {
      const pil = creerElement('div', 'qs-alerte-pilule piege-bot', '🚨 Tu as voté pour le Bot dans ton Top 2 (-2 pts)');
      qsAlertesMancheJoueur.appendChild(pil);
    }
    if (monInfo.sniperSucces === true) {
      const pil = creerElement('div', 'qs-alerte-pilule sniper-bonus', '🎯 Sniper réussi : +2 pts pour toi !');
      qsAlertesMancheJoueur.appendChild(pil);
    } else if (monInfo.sniperSucces === false) {
      const pil = creerElement('div', 'qs-alerte-pilule sniper-malus', '🎯 Sniper manqué : -1 pt');
      qsAlertesMancheJoueur.appendChild(pil);
    }
    if (monInfo.estVictimeSniper) {
      const pil = creerElement('div', 'qs-alerte-pilule sniper-malus', '🎯 Tu as été démasqué par un sniper (-1 pt)');
      qsAlertesMancheJoueur.appendChild(pil);
    }
    if (monInfo.autoVoteTop1) {
      const pil = creerElement('div', 'qs-alerte-pilule', '✨ Vote pour toi-même en #1 (+1.5 pt au lieu de +3)');
      qsAlertesMancheJoueur.appendChild(pil);
    }
  }

  // Cartes révélées avec slam animation et pastilles de points
  if (qsListeCartesRevelees) {
    if (qsMancheAnimee !== etat.mancheActuelle) {
      qsMancheAnimee = etat.mancheActuelle;
      qsListeCartesRevelees.innerHTML = '';

      const reponsesTriees = [...resManche.reponses].sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));

      reponsesTriees.forEach((r, idx) => {
        const carte = creerElement('div', 'qs-carte-slam-item' + (r.estBot ? ' est-bot' : '') + (idx === 0 ? ' top-1' : ''));
        carte.style.animationDelay = `${idx * 0.45}s`;

        const texte = creerElement('div', 'qs-slam-texte', `"${r.texte}"`);

        const auteurRow = creerElement('div', 'qs-slam-auteur-row');
        const auteurInfo = creerElement('div', 'qs-slam-auteur-info');
        auteurInfo.innerHTML = `<span class="qs-slam-auteur-avatar">${r.auteurAvatar || '🍸'}</span> <span class="qs-slam-auteur-pseudo ${r.estBot ? 'est-bot' : ''}">${r.auteurPseudo}</span>`;

        const pointsRow = creerElement('div', 'qs-slam-points-row');
        if (r.top1 > 0) {
          const gainTop1 = r.ptsTop1 !== undefined ? r.ptsTop1 : (r.top1 * 3);
          const libelleTop1 = r.autoVoteTop1
            ? `🥇 +${gainTop1} pts (${r.top1}x #1 dont auto-vote à +1.5)`
            : `🥇 +${gainTop1} pts (${r.top1}x #1)`;
          const p1 = creerElement('span', 'qs-pill-pts pts-plus3', libelleTop1);
          p1.style.animationDelay = `${idx * 0.45 + 0.25}s`;
          pointsRow.appendChild(p1);
        }
        if (r.top2 > 0) {
          const p2 = creerElement('span', 'qs-pill-pts pts-plus2', `🥈 +${r.top2 * 2} pts (${r.top2}x #2)`);
          p2.style.animationDelay = `${idx * 0.45 + 0.35}s`;
          pointsRow.appendChild(p2);
        }
        if (r.top3 > 0) {
          const p3 = creerElement('span', 'qs-pill-pts pts-plus1', `🥉 +${r.top3 * 1} pts (${r.top3}x #3)`);
          p3.style.animationDelay = `${idx * 0.45 + 0.45}s`;
          pointsRow.appendChild(p3);
        }

        auteurRow.append(auteurInfo, pointsRow);
        carte.append(texte, auteurRow);
        qsListeCartesRevelees.appendChild(carte);
      });

      if (window.audio && typeof window.audio.gagnantRoulette === 'function') {
        window.audio.gagnantRoulette();
      }
    }
  }

  // Alerte bot piège
  if (qsAlerteBotBox && qsAlerteBotTexte) {
    if (resManche.joueursPiegesParBot && resManche.joueursPiegesParBot.length > 0) {
      qsAlerteBotBox.classList.remove('cache');
      qsAlerteBotTexte.textContent = `Piégé(s) par le bot : ${resManche.joueursPiegesParBot.join(', ')} (-2 pts chacun) !`;
    } else {
      qsAlerteBotBox.classList.add('cache');
    }
  }

  // Snipers résolus
  if (qsListeSnipersResolus) {
    if (resManche.accusations && resManche.accusations.length > 0) {
      qsListeSnipersResolus.classList.remove('cache');
      qsListeSnipersResolus.innerHTML = '';
      resManche.accusations.forEach((acc) => {
        const item = creerElement('div', 'qs-item-sniper-resolu ' + (acc.correct ? 'succes' : 'echec'),
          acc.correct
            ? `🎯 ${acc.sniperPseudo} a démasqué ${acc.pseudoAccuse} (+2 pts / -1 pt) !`
            : `❌ ${acc.sniperPseudo} a accusé à tort ${acc.pseudoAccuse} (-1 pt).`
        );
        qsListeSnipersResolus.appendChild(item);
      });
    } else {
      qsListeSnipersResolus.classList.add('cache');
    }
  }

  // Classement cumulé provisoire
  if (qsClassementProvisoire) {
    qsClassementProvisoire.innerHTML = '';
    const classement = resManche.classementCumule || [];
    classement.forEach((j, idx) => {
      const li = creerElement('li', 'item-classement-provisoire');
      li.innerHTML = `<span><strong>#${idx + 1}</strong> ${j.avatar || '🍸'} ${j.pseudo}</span><strong>${j.scoreTotal} pts</strong>`;
      qsClassementProvisoire.appendChild(li);
    });
  }

  // Commandes Chef
  if (qsActionsRevelationChef && qsAttenteChefRevelation) {
    qsActionsRevelationChef.classList.toggle('cache', !estChef);
    qsAttenteChefRevelation.classList.toggle('cache', estChef);

    const estDerniereManche = etat.mancheActuelle >= etat.nbManches;
    if (btnQsMancheSuivante) btnQsMancheSuivante.classList.toggle('cache', estDerniereManche);
    if (btnQsVoirPodium) btnQsVoirPodium.classList.toggle('cache', !estDerniereManche);
  }
}

// --- Podium Final Quick Splash (Écran 5) ---
function afficherQsFin(etat, estChef) {
  afficherEcran('qsFin');
  const podium = (etat.quicksplash && etat.quicksplash.podiumFinal) || [];
  const trophees = (etat.quicksplash && etat.quicksplash.trophees) || etat.trophees || [];

  // Confettis de victoire et fanfare sur mobile
  if (window.confettis) window.confettis.explosion();
  if (window.audio && typeof window.audio.fanfarePodium === 'function') {
    window.audio.fanfarePodium();
  }

  // Rang personnel et score
  const monRang = podium.find((p) => p.pseudo === monPseudo);
  if (qsTexteRangFinal && monRang) {
    const totalPoints = monRang.scoreTotal ?? monRang.total ?? 0;
    qsTexteRangFinal.textContent = `Tu termines #${monRang.rang} avec ${totalPoints} pts`;
    if (monRang.rang === 1 && navigator.vibrate) {
      try { navigator.vibrate([150, 80, 150, 80, 300]); } catch (e) {}
    }
  }

  // 1. Podium Visuel Top 3 Mobile (2e à gauche, 1er au centre, 3e à droite)
  if (qsPodiumVisuelMobile) {
    qsPodiumVisuelMobile.innerHTML = '';
    const topTrois = podium.slice(0, 3);
    const podiumOrdre = [];
    if (topTrois[1]) podiumOrdre.push({ j: topTrois[1], place: 2, classe: 'marche-argent', medaille: '🥈' });
    if (topTrois[0]) podiumOrdre.push({ j: topTrois[0], place: 1, classe: 'marche-or', medaille: '👑 🥇' });
    if (topTrois[2]) podiumOrdre.push({ j: topTrois[2], place: 3, classe: 'marche-bronze', medaille: '🥉' });

    podiumOrdre.forEach((item) => {
      const marche = creerElement('div', 'podium-mobile-marche ' + item.classe);
      const medaille = creerElement('div', 'podium-mobile-medaille', item.medaille);
      const avatarBox = creerElement('div', 'podium-mobile-avatar', item.j.avatar || '🍸');
      const nom = creerElement('div', 'podium-mobile-nom', item.j.pseudo);
      const totalPoints = item.j.scoreTotal ?? item.j.total ?? 0;
      const score = creerElement('div', 'podium-mobile-score', totalPoints + ' pts');
      const socle = creerElement('div', 'podium-mobile-socle', '#' + item.place);

      marche.append(medaille, avatarBox, nom, score, socle);
      qsPodiumVisuelMobile.appendChild(marche);
    });
  }

  // 2. Trophées humoristiques & Faits marquants Mobile
  if (qsListeTropheesMobile) {
    qsListeTropheesMobile.innerHTML = '';
    trophees.forEach((t) => {
      const carte = creerElement('div', 'item-trophee-mobile');
      const icone = creerElement('span', 'trophee-icone-mobile', t.icone);
      const bloc = creerElement('div', 'trophee-bloc-mobile');
      const titre = creerElement('div', 'trophee-titre-mobile', t.titre + ' : ' + t.pseudos);
      const desc = creerElement('div', 'trophee-desc-mobile', t.desc);
      bloc.append(titre, desc);
      carte.append(icone, bloc);
      qsListeTropheesMobile.appendChild(carte);
    });
  }

  // 3. Liste complète du classement final
  if (qsListePodiumFinal) {
    qsListePodiumFinal.innerHTML = '';
    podium.forEach((p) => {
      const totalPoints = p.scoreTotal ?? p.total ?? 0;
      const li = creerElement('li', 'item-podium-mobile rang-' + p.rang + (p.pseudo === monPseudo ? ' moi' : ''));
      let medaille = '#' + p.rang;
      if (p.rang === 1) medaille = '🥇 #1';
      else if (p.rang === 2) medaille = '🥈 #2';
      else if (p.rang === 3) medaille = '🥉 #3';

      const spanRang = creerElement('span', 'podium-rang-badge', medaille);
      const spanAvatar = creerElement('span', 'podium-avatar-pastille', p.avatar || '🍸');
      const spanNom = creerElement('span', 'podium-pseudo', p.pseudo + (p.pseudo === monPseudo ? ' (toi)' : ''));
      const spanScore = creerElement('span', 'podium-score-total', totalPoints + ' pts');

      li.append(spanRang, spanAvatar, spanNom, spanScore);
      qsListePodiumFinal.appendChild(li);
    });
  }

  if (qsActionsFinChef && qsAttenteChefFin) {
    qsActionsFinChef.classList.toggle('cache', !estChef);
    qsAttenteChefFin.classList.toggle('cache', estChef);
  }
}

// --- Écouteurs d'événements Quick Splash ---
if (btnQsTypeTrou) {
  btnQsTypeTrou.addEventListener('click', () => selectionnerTypeAmorce('trou'));
}
if (btnQsTypeQuestion) {
  btnQsTypeQuestion.addEventListener('click', () => selectionnerTypeAmorce('question'));
}
if (btnQsMagique) {
  btnQsMagique.addEventListener('click', piocherIdeeMagique);
}
if (qsInputAmorce) {
  qsInputAmorce.addEventListener('input', () => {
    if (qsCompteurCaracteresAmorce) {
      qsCompteurCaracteresAmorce.textContent = qsInputAmorce.value.length;
    }
  });
}
if (btnQsValiderAmorce) {
  btnQsValiderAmorce.addEventListener('click', validerAmorceQs);
}

if (qsInputReponse) {
  qsInputReponse.addEventListener('input', () => {
    if (qsCompteurCaracteresReponse) {
      qsCompteurCaracteresReponse.textContent = qsInputReponse.value.length;
    }
  });
}
if (btnQsValiderReponse) {
  btnQsValiderReponse.addEventListener('click', validerReponseQs);
}

if (btnQsOuvrirSniper) {
  btnQsOuvrirSniper.addEventListener('click', () => ouvrirModalSniper(dernierEtat));
}
if (btnFermerModalSniper) {
  btnFermerModalSniper.addEventListener('click', fermerModalSniper);
}
if (btnQsFermerSniper) {
  btnQsFermerSniper.addEventListener('click', fermerModalSniper);
}
if (modalQsSniperBackdrop) {
  modalQsSniperBackdrop.addEventListener('click', fermerModalSniper);
}
if (btnQsConfirmerSniper) {
  btnQsConfirmerSniper.addEventListener('click', confirmerSniper);
}
if (btnQsAnnulerSniper) {
  btnQsAnnulerSniper.addEventListener('click', annulerSniper);
}

if (btnQsValiderClassement) {
  btnQsValiderClassement.addEventListener('click', validerClassementQs);
}

if (btnQsMancheSuivante) {
  btnQsMancheSuivante.addEventListener('click', () => socket.emit('qsMancheSuivante'));
}
if (btnQsVoirPodium) {
  btnQsVoirPodium.addEventListener('click', () => socket.emit('qsTerminerPartie'));
}
if (btnQsRetourLobbyRevelation) {
  btnQsRetourLobbyRevelation.addEventListener('click', () => socket.emit('retourLobby'));
}
if (btnQsRejouerLobby) {
  btnQsRejouerLobby.addEventListener('click', () => socket.emit('retourLobby'));
}




