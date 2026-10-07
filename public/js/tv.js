// =====================================================
// tv.js - Logique de l'écran TV (PC hôte)
// Étape 5 : QR code, vote, classement, DÉBAT & JOKERS secrets
// =====================================================

const socket = io();

// --- Sections de la TV ---
const sections = {
  lobby: document.getElementById('tv-lobby'),
  vote: document.getElementById('tv-vote'),
  annonce: document.getElementById('tv-annonce'),
  classement: document.getElementById('tv-classement'),
  termine: document.getElementById('tv-termine'),
  debat: document.getElementById('tv-debat'),
  debatTermine: document.getElementById('tv-debat-termine'),
  resultatsManche: document.getElementById('tv-resultats-manche'),
  finPartie: document.getElementById('tv-fin-partie'),
  qsSetup: document.getElementById('tv-qs-setup'),
  qsEcriture: document.getElementById('tv-qs-ecriture'),
  qsClassement: document.getElementById('tv-qs-classement'),
  qsRevelation: document.getElementById('tv-qs-revelation'),
  qsFin: document.getElementById('tv-qs-fin')
};

let dernierEtat = null;

const elQr = document.getElementById('qr');
const elUrl = document.getElementById('url');
const elListe = document.getElementById('liste-joueurs');
const elTitre = document.getElementById('titre-joueurs');
const elMessage = document.getElementById('message');

const elThemes = document.getElementById('tv-themes');
const elVotants = document.getElementById('tv-votants');
const elCompteurVotes = document.getElementById('tv-compteur-votes');
const elZoneAnnonce = document.getElementById('tv-zone-annonce');

// Classement TV
const tvBadgeManche = document.getElementById('tv-badge-manche');
const tvTitreTheme = document.getElementById('tv-titre-theme');
const tvConsignes = document.getElementById('tv-consignes');
const tvListeMotsManche = document.getElementById('tv-liste-mots-manche');
const tvRerollBandeau = document.getElementById('tv-reroll-bandeau');
const tvRerollTexte = document.getElementById('tv-reroll-texte');
const tvRerollAvatars = document.getElementById('tv-reroll-avatars');
const tvJoueursClassement = document.getElementById('tv-joueurs-classement');
const tvCompteurClasses = document.getElementById('tv-compteur-classes');

// Modération TV
const btnRoueTv = document.getElementById('btn-roue-tv');
const modalTv = document.getElementById('modal-tv');
const modalTvBackdrop = document.getElementById('modal-tv-backdrop');
const btnFermerModalTv = document.getElementById('btn-fermer-modal-tv');
const listeJoueursTv = document.getElementById('liste-joueurs-tv');
const btnRetourLobbyModalTv = document.getElementById('btn-retour-lobby-modal-tv');

// Scoreboard TV (Panthéon)
const btnScoreboardTv = document.getElementById('btn-scoreboard-tv');
const modalScoreboardTv = document.getElementById('modal-scoreboard-tv');
const modalScoreboardBackdrop = document.getElementById('modal-scoreboard-backdrop');
const btnFermerModalScoreboard = document.getElementById('btn-fermer-modal-scoreboard');
const listeScoreboardTv = document.getElementById('liste-scoreboard-tv');
const tabsTriScoreboard = document.querySelectorAll('#scoreboard-tabs-tri .tab-tri-btn');
let critereTriScoreboard = 'victoires';

// Switch de mode TV (Priorities <-> Quick Splash)
const btnSwitchModeTv = document.getElementById('btn-switch-mode-tv');
const ondeDeChoc = document.getElementById('onde-de-choc');
const tvBadgeSoiree = document.getElementById('tv-badge-soiree');
const tvTitrePrincipal = document.getElementById('tv-titre-principal');
const tvSwitchModeTexte = document.getElementById('tv-switch-mode-texte');
let modePrecedentTv = null;

// Débat TV
const tvBadgeMancheDebat = document.getElementById('tv-badge-manche-debat');
const tvCompteurTempsDebat = document.getElementById('tv-compteur-temps-debat');
const tvStatutJokerBadge = document.getElementById('tv-statut-joker-badge');
const tvListeMotsGroupe = document.getElementById('tv-liste-mots-groupe');
const tvNomCapitaine = document.getElementById('tv-nom-capitaine');

// Résultats de la manche TV (Étape 6)
const tvBadgeMancheResultats = document.getElementById('tv-badge-manche-resultats');
const tvResultatsOrdreGroupe = document.getElementById('tv-resultats-ordre-groupe');
const tvResultatsListeJoueurs = document.getElementById('tv-resultats-liste-joueurs');

// Podium & Fin de partie TV (Étape 6)
const tvPodiumVisuel = document.getElementById('tv-podium-visuel');
const tvTableauManches = document.getElementById('tv-tableau-manches');
const tvStatsCarriere = document.getElementById('tv-stats-carriere');
const tvZoneTrophees = document.getElementById('tv-zone-trophees');

// Coin des Jokers & Outils TV
const tvCoinJokers = document.getElementById('tv-coin-jokers');
const tvCartesJokers = document.getElementById('tv-cartes-jokers');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnSon = document.getElementById('btn-son');

let annonceAffichee = false;
let intervalleDebat = null;
let dernierNbJokers = null;

// --- Éléments Quick Splash TV ---
// Setup
const tvQsCompteurAmorces = document.getElementById('tv-qs-compteur-amorces');
const tvQsListeJoueursSetup = document.getElementById('tv-qs-liste-joueurs-setup');

// Écriture
const tvQsBadgeMancheEcriture = document.getElementById('tv-qs-badge-manche-ecriture');
const tvQsChronoBox = document.getElementById('tv-qs-chrono-box');
const tvQsCompteurChrono = document.getElementById('tv-qs-compteur-chrono');
const tvQsAmorceIcone = document.getElementById('tv-qs-amorce-icone');
const tvQsAmorceTexte = document.getElementById('tv-qs-amorce-texte');
const tvQsCompteurCartesPosees = document.getElementById('tv-qs-compteur-cartes-posees');
const tvQsTableCartes = document.getElementById('tv-qs-table-cartes');

// Classement
const tvQsBadgeMancheClassement = document.getElementById('tv-qs-badge-manche-classement');
const tvQsRappelAmorceClassement = document.getElementById('tv-qs-rappel-amorce-classement');
const tvQsCartesAnonymesGrille = document.getElementById('tv-qs-cartes-anonymes-grille');
const tvQsCompteurClasses = document.getElementById('tv-qs-compteur-classes');
const tvQsListeJoueursClassement = document.getElementById('tv-qs-liste-joueurs-classement');

// Révélation
const tvQsBadgeMancheRevelation = document.getElementById('tv-qs-badge-manche-revelation');
const tvQsAmorceRevelationRuban = document.getElementById('tv-qs-amorce-revelation-ruban');
const tvQsAmorceRevelationTexte = document.getElementById('tv-qs-amorce-revelation-texte');
const tvQsCartesRevelationListe = document.getElementById('tv-qs-cartes-revelation-liste');
const tvQsAlerteBotBox = document.getElementById('tv-qs-alerte-bot-box');
const tvQsBotVictimes = document.getElementById('tv-qs-bot-victimes');
const tvQsSnipersBox = document.getElementById('tv-qs-snipers-box');
const tvQsSnipersListe = document.getElementById('tv-qs-snipers-liste');
const tvQsScoresCumules = document.getElementById('tv-qs-scores-cumules');

// Podium final
const tvQsPodiumVisuel = document.getElementById('tv-qs-podium-visuel');
const tvQsZoneTrophees = document.getElementById('tv-qs-zone-trophees');
const tvQsListePodiumComplet = document.getElementById('tv-qs-liste-podium-complet');

let tvQsMancheAnimee = null;
let tvQsCartesPoseesCount = 0;

if (btnFullscreen) {
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      btnFullscreen.textContent = '✕';
    } else {
      document.exitFullscreen().catch(() => {});
      btnFullscreen.textContent = '⛶';
    }
  });
}

if (btnSon) {
  btnSon.addEventListener('click', () => {
    if (window.audio) {
      const muet = window.audio.toggleMuet();
      btnSon.textContent = muet ? '🔇' : '🔊';
    }
  });
}

function afficherSection(nom) {
  for (const cle of Object.keys(sections)) {
    if (sections[cle]) {
      sections[cle].classList.toggle('cache', cle !== nom);
    }
  }
}

// --- QR code et adresse ---
fetch('/api/info')
  .then((r) => r.json())
  .then((info) => {
    elUrl.textContent = info.url;
    if (info.qr) {
      elQr.src = info.qr;
      elQr.classList.remove('cache');
    }
  });

socket.on('connect', () => {
  socket.emit('enregistrerTv');
});

// --- Mise à jour à chaque changement d'état ---
socket.on('etat', (etat) => {
  dernierEtat = etat;
  if (etat.phase !== 'annonce') {
    annonceAffichee = false;
    arreterRoulette();
  }

  // Gestion du mode de jeu (Priorities / Quick Splash)
  const modeActuel = etat.mode || 'priorities';
  if (modePrecedentTv !== null && modePrecedentTv !== modeActuel) {
    declencherOndeDeChocTv(null, null, modeActuel);
    if (typeof sons !== 'undefined' && sons && sons.joker) {
      sons.joker();
    }
  }
  modePrecedentTv = modeActuel;

  const estQuickSplash = modeActuel === 'quicksplash';
  document.body.classList.toggle('mode-quicksplash', estQuickSplash);

  if (tvBadgeSoiree) {
    tvBadgeSoiree.textContent = estQuickSplash
      ? '🌊 QUICK SPLASH CREATIVE CLUB 💥'
      : '🍸 PRIORITIES NIGHT CLUB 🪩';
  }
  if (tvTitrePrincipal) {
    tvTitrePrincipal.textContent = estQuickSplash ? 'Quick Splash' : 'Priorities';
  }
  if (tvSwitchModeTexte) {
    tvSwitchModeTexte.textContent = estQuickSplash ? 'Mode Priorities' : 'Mode Quick Splash';
  }
  if (btnSwitchModeTv) {
    btnSwitchModeTv.classList.toggle('cache', etat.phase !== 'lobby');
  }

  // Si le modal de modération TV est ouvert, on le rafraîchit
  if (modalTv && !modalTv.classList.contains('cache')) {
    rendreListeJoueursTv();
  }

  // Si le scoreboard TV est ouvert, on le rafraîchit
  if (modalScoreboardTv && !modalScoreboardTv.classList.contains('cache')) {
    rendreScoreboardTv();
  }

  // Affichage du bouton Scoreboard : disponible dans le lobby et à la fin de partie
  if (btnScoreboardTv) {
    btnScoreboardTv.classList.toggle('cache', etat.phase !== 'lobby' && etat.phase !== 'fin_partie');
  }

  // Gestion des cartes Jokers dans l'angle de la TV
  mettreAJourJokersCoin(etat);

  switch (etat.phase) {
    case 'vote':
      arreterMinuteurDebat();
      afficherVote(etat);
      break;
    case 'annonce':
      arreterMinuteurDebat();
      afficherSection('annonce');
      if (!annonceAffichee) {
        annonceAffichee = true;
        afficherAnnonce(elZoneAnnonce, etat);
      }
      break;
    case 'classement':
      arreterMinuteurDebat();
      afficherClassement(etat);
      break;
    case 'classement_termine':
      arreterMinuteurDebat();
      afficherSection('termine');
      break;
    case 'debat':
      afficherDebat(etat);
      break;
    case 'debat_termine':
      arreterMinuteurDebat();
      afficherSection('debatTermine');
      break;
    case 'resultats_manche':
      arreterMinuteurDebat();
      afficherResultatsManche(etat);
      break;
    case 'fin_partie':
      arreterMinuteurDebat();
      afficherFinPartie(etat);
      break;
    case 'qs_setup':
      arreterMinuteurDebat();
      afficherQsSetupTv(etat);
      break;
    case 'qs_ecriture':
      arreterMinuteurDebat();
      afficherQsEcritureTv(etat);
      break;
    case 'qs_classement':
      arreterMinuteurDebat();
      afficherQsClassementTv(etat);
      break;
    case 'qs_revelation':
      arreterMinuteurDebat();
      afficherQsRevelationTv(etat);
      break;
    case 'qs_fin_partie':
      arreterMinuteurDebat();
      afficherQsFinTv(etat);
      break;
    default:
      arreterMinuteurDebat();
      afficherLobby(etat);
  }
});

// Mise à jour de l'ordre du groupe en direct quand le capitaine manipule les cartes
socket.on('ordreGroupeMaj', (nouvelOrdre) => {
  afficherOrdreGroupe(nouvelOrdre);
});

// --- Jokers dans l'angle de la TV (disparition discrète) ---
function mettreAJourJokersCoin(etat) {
  if (etat.phase === 'lobby' || etat.phase === 'vote' || etat.phase === 'annonce') {
    tvCoinJokers.classList.add('cache');
    tvCartesJokers.innerHTML = '';
    dernierNbJokers = null;
    return;
  }

  tvCoinJokers.classList.remove('cache');
  const total = etat.jokersTotal || 0;
  const restants = etat.jokersRestants !== undefined ? etat.jokersRestants : total;

  // Création initiale des cartes si nécessaire
  if (tvCartesJokers.children.length !== total) {
    tvCartesJokers.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const carte = creerElement('span', 'tv-joker-mini', '🃏');
      carte.title = 'Joker joueur';
      tvCartesJokers.appendChild(carte);
    }
  }

  // Si un joker vient d'être utilisé (restants diminue)
  const cartes = Array.from(tvCartesJokers.children);
  const disparus = total - restants;

  cartes.forEach((carte, idx) => {
    // Les cartes consommées sont estompées/disparues
    if (idx >= restants) {
      if (!carte.classList.contains('disparu')) {
        carte.classList.add('disparition-discrete');
        setTimeout(() => {
          carte.classList.add('disparu');
        }, 1200);
      }
    } else {
      carte.classList.remove('disparu', 'disparition-discrete');
    }
  });

  dernierNbJokers = restants;
}

// --- Lobby ---
function afficherLobby(etat) {
  afficherSection('lobby');
  const connectes = etat.joueurs.filter((j) => j.connecte).length;
  elTitre.textContent = 'Invités VIP (' + connectes + ' / ' + etat.joueursMax + ')';

  const badgeCompteur = document.getElementById('tv-badge-compteur');
  if (badgeCompteur) {
    badgeCompteur.textContent = connectes + ' / ' + etat.joueursMax;
  }

  elListe.innerHTML = '';
  for (const joueur of etat.joueurs) {
    const estChef = joueur.pseudo === etat.chefPseudo;
    const li = creerElement('li', 'tv-carte-joueur-vip' + (joueur.connecte ? '' : ' absent') + (estChef ? ' chef-vip' : ''));

    // Couronne dorée flottante animée au-dessus de la carte du chef
    if (estChef) {
      const couronneAnim = creerElement('div', 'tv-couronne-flottante-animee', '👑');
      li.appendChild(couronneAnim);
    }

    const cadreAvatar = creerElement('div', 'tv-avatar-cadre-vip');
    const avatarEmoji = creerElement('span', 'tv-avatar-emoji', joueur.avatar || '🍸');
    cadreAvatar.appendChild(avatarEmoji);

    const blocInfos = creerElement('div', 'tv-vip-infos');
    const pseudo = creerElement('span', 'tv-vip-pseudo', joueur.pseudo);
    const badgeRole = creerElement('span', 'tv-vip-role-tag', estChef ? '👑 Hôte de la soirée' : (joueur.connecte ? '✨ Invité VIP' : 'Absent'));
    blocInfos.append(pseudo, badgeRole);

    li.append(cadreAvatar, blocInfos);
    elListe.appendChild(li);
  }

  if (connectes < etat.joueursMin) {
    elMessage.innerHTML = '🍸 En attente d\'invités… (min. <strong>' + etat.joueursMin + '</strong> pour lancer)';
  } else {
    elMessage.innerHTML = '✨ <strong>' + (etat.chefPseudo || 'L\'hôte') + '</strong> peut lancer la soirée (' +
      etat.nbManches + ' manches) !';
  }
}

// --- Vote ---
function afficherVote(etat) {
  afficherSection('vote');
  elThemes.innerHTML = '';
  for (const theme of etat.themes) {
    elThemes.appendChild(creerCarteTheme(theme));
  }
  elVotants.innerHTML = '';
  for (const joueur of etat.joueurs) {
    elVotants.appendChild(
      creerElement('li', 'joueur' + (joueur.aVote ? ' a-vote' : '') + (joueur.connecte ? '' : ' absent'),
        (joueur.aVote ? '✅ ' : '⏳ ') + joueur.pseudo)
    );
  }
  elCompteurVotes.textContent = etat.nbVotants + ' / ' + etat.nbAttendus + ' ont voté';
}

// --- Classement personnel (Étape 4 : mots neutres sans hashtags) ---
function afficherClassement(etat) {
  afficherSection('classement');

  const theme = etat.themeChoisi;
  tvBadgeManche.textContent = 'Manche ' + etat.mancheActuelle + ' / ' + etat.nbManches;
  if (theme) {
    tvTitreTheme.textContent = theme.emoji + ' ' + theme.nom;
    tvConsignes.textContent = '⬆ ' + theme.consigneHaut + '   ·   ⬇ ' + theme.consigneBas;
  }

  // Mots triés par ordre alphabétique NEUTRE SANS HASHTAGS
  tvListeMotsManche.innerHTML = '';
  if (Array.isArray(etat.motsManche)) {
    const motsNeutres = [...etat.motsManche].sort((a, b) => a.localeCompare(b, 'fr'));
    motsNeutres.forEach((mot) => {
      const carte = creerElement('div', 'tv-mot-carte neutre');
      const puce = creerElement('span', 'tv-mot-puce', '🔹');
      const txt = creerElement('span', 'tv-mot-texte', mot);
      carte.append(puce, txt);
      tvListeMotsManche.appendChild(carte);
    });
  }

  // Avancement des joueurs
  tvJoueursClassement.innerHTML = '';
  for (const joueur of etat.joueurs) {
    const li = creerElement('li', 'tv-joueur-item ' + (joueur.aClasse ? 'valide' : 'en-cours') + (joueur.connecte ? '' : ' absent'));
    const nom = creerElement('span', 'tv-joueur-nom', (joueur.pseudo === etat.chefPseudo ? '👑 ' : '') + joueur.pseudo);
    const badge = creerElement('span', 'tv-statut-badge', joueur.aClasse ? '✅ Validé' : '⏳ En cours…');
    li.append(nom, badge);
    tvJoueursClassement.appendChild(li);
  }

  tvCompteurClasses.textContent = etat.nbClasses + ' / ' + etat.nbAttendus + ' validés';

  // Bandeau Reroll des mots & Avatars
  if (tvRerollBandeau && tvRerollTexte) {
    if (etat.reroll && etat.reroll.votes > 0) {
      tvRerollBandeau.classList.remove('cache');
      const sRestants = etat.reroll.restants > 1 ? 's' : '';
      tvRerollTexte.innerHTML = `🎲 Vote pour changer les mots : <strong>${etat.reroll.votes} / ${etat.reroll.requis}</strong> votes requis (${etat.reroll.restants} restant${sRestants})`;
      if (tvRerollAvatars && Array.isArray(etat.reroll.votants)) {
        tvRerollAvatars.innerHTML = etat.reroll.votants.map((v) =>
          `<span class="tv-avatar-votant">${v.avatar || '🍸'} <strong>${v.pseudo}</strong></span>`
        ).join(' ');
      }
    } else {
      tvRerollBandeau.classList.add('cache');
      if (tvRerollAvatars) tvRerollAvatars.innerHTML = '';
    }
  }
}

// --- Phase de Débat (Étape 5) ---
function afficherDebat(etat) {
  afficherSection('debat');

  tvBadgeMancheDebat.textContent = 'Manche ' + etat.mancheActuelle + ' / ' + etat.nbManches;
  tvNomCapitaine.textContent = 'Capitaine : ' + (etat.capitainePseudo || 'Désignation…');

  afficherOrdreGroupe(etat.ordreGroupe);
  lancerMinuteurDebat(etat.debutDebat, etat.dureeDebatS, etat.dureeJokerMs);
}

function afficherOrdreGroupe(mots) {
  if (!Array.isArray(mots) || !tvListeMotsGroupe) return;
  tvListeMotsGroupe.innerHTML = '';
  mots.forEach((mot, idx) => {
    const carte = creerElement('div', 'tv-mot-carte groupe');
    const rang = creerElement('span', 'badge-rang', '#' + (idx + 1));
    const txt = creerElement('span', 'tv-mot-texte', mot);
    carte.append(rang, txt);
    tvListeMotsGroupe.appendChild(carte);
  });
}

// Minuteur indicatif du débat
function lancerMinuteurDebat(debutTimestamp, dureeMaxSec, dureeJokerMs) {
  if (intervalleDebat) clearInterval(intervalleDebat);
  const debut = debutTimestamp || Date.now();
  const finDebat = debut + (dureeMaxSec || 180) * 1000;
  const finJoker = debut + (dureeJokerMs || 120000);

  function tick() {
    const maintenant = Date.now();
    const restantDebat = Math.max(0, Math.floor((finDebat - maintenant) / 1000));
    const restantJoker = Math.max(0, Math.floor((finJoker - maintenant) / 1000));

    const minutes = Math.floor(restantDebat / 60);
    const secondes = restantDebat % 60;
    tvCompteurTempsDebat.textContent = String(minutes).padStart(2, '0') + ':' + String(secondes).padStart(2, '0');

    // Statut Joker (2 minutes)
    if (restantJoker > 0) {
      const jMin = Math.floor(restantJoker / 60);
      const jSec = restantJoker % 60;
      tvStatutJokerBadge.textContent = '🃏 Joker actif (' + (jMin > 0 ? jMin + 'm ' : '') + jSec + 's)';
      tvStatutJokerBadge.className = 'badge-joker-actif';
    } else {
      tvStatutJokerBadge.textContent = '🔒 Jokers clos pour cette manche';
      tvStatutJokerBadge.className = 'badge-joker-clos';
    }

    // Bip sonore pour les 5 dernières secondes du débat
    if (restantDebat <= 5 && restantDebat > 0) {
      if (window.audio) window.audio.bipCompte(false);
    } else if (restantDebat === 0) {
      if (window.audio) window.audio.bipCompte(true);
    }
  }

  tick();
  intervalleDebat = setInterval(tick, 1000);
}

function arreterMinuteurDebat() {
  if (intervalleDebat) {
    clearInterval(intervalleDebat);
    intervalleDebat = null;
  }
}

// =====================================================
// Mini-réactions en direct pendant le débat
// =====================================================
const tvReactionsContainer = document.getElementById('tv-reactions-container');

socket.on('reactionDebatAffichee', (data) => {
  if (!tvReactionsContainer) return;

  const bulle = document.createElement('div');
  bulle.className = 'bulle-reaction-flottante';

  // Position horizontale aléatoire (entre 10% et 80%)
  const posLeft = Math.floor(Math.random() * 70 + 10);
  bulle.style.left = posLeft + '%';

  const avatar = creerElement('span', 'bulle-avatar', data.avatar || '🍸');
  const pseudo = creerElement('span', 'bulle-pseudo', data.pseudo || 'Joueur');
  const emoji = creerElement('span', 'bulle-emoji', data.emoji || '🔥');
  const texte = data.texte ? creerElement('span', 'bulle-texte', data.texte) : null;

  bulle.append(avatar, pseudo, emoji);
  if (texte) bulle.appendChild(texte);

  tvReactionsContainer.appendChild(bulle);

  // Petit pop sonore
  if (window.audio) window.audio.popReaction();

  // Suppression après l'animation
  setTimeout(() => {
    if (bulle.parentNode) bulle.parentNode.removeChild(bulle);
  }, 3800);
});

// =====================================================
// Résultats de la manche & Fin de partie (Étape 6)
// =====================================================

function afficherResultatsManche(etat) {
  afficherSection('resultatsManche');
  const res = etat.dernierResultatManche;
  if (!res) return;

  tvBadgeMancheResultats.textContent = 'Manche ' + etat.mancheActuelle + ' / ' + etat.nbManches;

  // Colonne 1 : Ordre officiel de consensus du groupe
  tvResultatsOrdreGroupe.innerHTML = '';
  if (Array.isArray(res.ordreGroupe)) {
    res.ordreGroupe.forEach((mot, idx) => {
      const carte = creerElement('div', 'tv-mot-carte groupe');
      const badge = creerElement('span', 'badge-rang', '#' + (idx + 1));
      const txt = creerElement('span', 'tv-mot-texte', mot);
      carte.append(badge, txt);
      tvResultatsOrdreGroupe.appendChild(carte);
    });
  }

  // Colonne 2 : Scores individuels et détails des 5 cartes
  tvResultatsListeJoueurs.innerHTML = '';
  res.joueurs.forEach((j) => {
    const carteJ = creerElement('div', 'tv-carte-joueur-score');

    // En-tête : pseudo + points manche + cumul total
    const headerJ = creerElement('div', 'tv-joueur-score-header');
    const nomJ = creerElement('span', 'tv-joueur-score-nom', j.pseudo + (j.connecte ? '' : ' (déconnecté)'));
    const boxPts = creerElement('div', 'tv-joueur-score-points');
    const badgePlus = creerElement('span', 'badge-points-plus', '+' + j.pointsManche + ' pts');
    const badgeTotal = creerElement('span', 'badge-points-total', 'Total : ' + j.pointsTotal + ' pts');
    boxPts.append(badgePlus, badgeTotal);
    headerJ.append(nomJ, boxPts);

    // Badges / Chips pour les 5 mots
    const chipsConteneur = creerElement('div', 'tv-joueur-chips-mots');
    j.details.forEach((d) => {
      let classeDistance = 'dist-loin';
      let symbole = '0 pt';
      if (d.distance === 0) {
        classeDistance = 'dist-exact';
        symbole = '+3 pts';
      } else if (d.distance === 1) {
        classeDistance = 'dist-proche';
        symbole = '+1 pt';
      }
      const chip = creerElement('span', 'tv-score-chip ' + classeDistance);
      chip.innerHTML = '<span>' + d.mot + '</span> <span class="chip-pts">#' + d.rangJoueur + ' (' + symbole + ')</span>';
      chipsConteneur.appendChild(chip);
    });

    carteJ.append(headerJ, chipsConteneur);
    tvResultatsListeJoueurs.appendChild(carteJ);
  });
}

function afficherFinPartie(etat) {
  afficherSection('finPartie');
  const podium = etat.podium || [];
  const statsGlobales = etat.statsGlobales || {};

  // Fanfare de victoire
  if (window.audio) window.audio.fanfarePodium();

  // Pluie festive de confettis sur la TV
  if (window.confettis) window.confettis.podiumTV();

  // 1. Podium visuel Top 3 (agencement type JO : 2e à gauche, 1er au centre, 3e à droite)
  tvPodiumVisuel.innerHTML = '';
  const topTrois = podium.slice(0, 3);
  const podiumOrdre = [];
  if (topTrois[1]) podiumOrdre.push({ j: topTrois[1], place: 2, classe: 'marche-argent', medaille: '🥈' });
  if (topTrois[0]) podiumOrdre.push({ j: topTrois[0], place: 1, classe: 'marche-or', medaille: '👑 🥇' });
  if (topTrois[2]) podiumOrdre.push({ j: topTrois[2], place: 3, classe: 'marche-bronze', medaille: '🥉' });

  if (podiumOrdre.length > 0) {
    podiumOrdre.forEach((item) => {
      const marche = creerElement('div', 'tv-podium-marche ' + item.classe);
      const medaille = creerElement('div', 'tv-podium-medaille', item.medaille);
      const avatarBox = creerElement('div', 'tv-podium-avatar', item.j.avatar || '🍸');
      const nom = creerElement('div', 'tv-podium-nom', item.j.pseudo);
      const score = creerElement('div', 'tv-podium-score', item.j.total + ' pts');
      marche.append(medaille, avatarBox, nom, score);

      if (item.j.bonusJoker > 0) {
        const bonusTag = creerElement('div', 'badge-bonus-joker-podium', '🃏 +8 pts (Joker)');
        marche.appendChild(bonusTag);
      }

      const socle = creerElement('div', 'tv-podium-socle', '#' + item.place);
      marche.appendChild(socle);
      tvPodiumVisuel.appendChild(marche);
    });
  }

  // 2. Trophées humoristiques
  if (tvZoneTrophees) {
    tvZoneTrophees.innerHTML = '';
    const trophees = etat.trophees || [];
    trophees.forEach((t) => {
      const carte = creerElement('div', 'tv-trophee-carte');
      const icone = creerElement('span', 'tv-trophee-icone', t.icone);
      const bloc = creerElement('div', 'tv-trophee-texte');
      const titre = creerElement('div', 'tv-trophee-titre', t.titre + ' : ' + t.pseudos);
      const desc = creerElement('div', 'tv-trophee-desc', t.desc);
      bloc.append(titre, desc);
      carte.append(icone, bloc);
      tvZoneTrophees.appendChild(carte);
    });
  }

  // 3. Tableau récapitulatif des manches (Joueurs x Manches)
  tvTableauManches.innerHTML = '';
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  trHead.appendChild(creerElement('th', '', 'Rang & Joueur'));
  for (let m = 1; m <= etat.nbManches; m++) {
    trHead.appendChild(creerElement('th', '', 'M' + m));
  }
  trHead.appendChild(creerElement('th', 'col-total', 'Total'));
  thead.appendChild(trHead);
  tvTableauManches.appendChild(thead);

  const tbody = document.createElement('tbody');
  podium.forEach((j) => {
    const tr = document.createElement('tr');
    const tdNom = creerElement('td', 'cell-nom', '#' + j.rang + ' ' + j.pseudo);
    tr.appendChild(tdNom);

    for (let m = 0; m < etat.nbManches; m++) {
      const pts = (j.parManche && j.parManche[m] !== undefined) ? j.parManche[m] : '-';
      tr.appendChild(creerElement('td', 'cell-pts', String(pts)));
    }
    const bonusTxt = j.bonusJoker > 0 ? ' (' + j.scoreManches + ' + 8)' : '';
    tr.appendChild(creerElement('td', 'cell-total', j.total + ' pts' + bonusTxt));
    tbody.appendChild(tr);
  });
  tvTableauManches.appendChild(tbody);

  // 4. Statistiques carrières persistantes (data/scores.json)
  tvStatsCarriere.innerHTML = '';
  podium.forEach((j) => {
    const cle = j.pseudo.toLowerCase();
    const st = statsGlobales[cle] || {
      partiesJouees: 1,
      victoires: j.rang === 1 ? 1 : 0,
      scoreTotal: j.total,
      meilleureManche: Math.max(...(j.parManche || [0])),
      meilleurePartie: j.total
    };

    const carte = creerElement('div', 'tv-carriere-carte');
    const nom = creerElement('div', 'tv-carriere-nom', j.pseudo);
    const gr = creerElement('div', 'tv-carriere-grille');
    gr.innerHTML = '<div>🏆 Victoires : <strong>' + st.victoires + '</strong></div>' +
      '<div>🎮 Parties : <strong>' + st.partiesJouees + '</strong></div>' +
      '<div>⭐ Record partie : <strong>' + st.meilleurePartie + ' pts</strong></div>' +
      '<div>📊 Total cumulé : <strong>' + st.scoreTotal + ' pts</strong></div>';

    carte.append(nom, gr);
    tvStatsCarriere.appendChild(carte);
  });
}

socket.on('motsRerolles', () => {
  if (typeof audio.sonReroll === 'function') audio.sonReroll();
});

// ---------------------------------------------------------------------
// Modération des joueurs depuis la TV (⚙️)
// ---------------------------------------------------------------------
function ouvrirModalTv() {
  if (!dernierEtat || !modalTv) return;
  modalTv.classList.remove('cache');
  if (btnRetourLobbyModalTv) {
    btnRetourLobbyModalTv.disabled = Boolean(dernierEtat.phase === 'lobby');
  }
  rendreListeJoueursTv();
}

function fermerModalTv() {
  if (modalTv) modalTv.classList.add('cache');
}

function rendreListeJoueursTv() {
  if (!dernierEtat || !listeJoueursTv) return;
  listeJoueursTv.innerHTML = '';

  const liste = dernierEtat.joueurs || [];
  if (liste.length === 0) {
    listeJoueursTv.innerHTML = '<p class="compteur">Aucun joueur connecté actuellement.</p>';
    return;
  }

  for (const j of liste) {
    const carte = creerElement('div', 'carte-joueur-chef');

    const info = creerElement('div', 'joueur-chef-info');
    const estChef = (j.pseudo === dernierEtat.chefPseudo);
    info.innerHTML = `<span>${j.avatar || '🍸'}</span> <span>${j.pseudo}</span> ${estChef ? '<small style="color:#ffd700;font-weight:800;">(Chef 👑)</small>' : ''}`;

    const actions = creerElement('div', 'joueur-chef-actions');

    if (!estChef) {
      const btnNommer = creerElement('button', 'btn-action-chef btn-nommer-chef', '👑 Nommer chef');
      btnNommer.type = 'button';
      btnNommer.addEventListener('click', () => {
        socket.emit('nommerChef', j.id, (res) => {
          if (res && res.ok) {
            fermerModalTv();
          } else if (res && res.erreur) {
            alert(res.erreur);
          }
        });
      });
      actions.appendChild(btnNommer);
    }

    const btnKicker = creerElement('button', 'btn-action-chef btn-kicker-joueur', '❌ Exclure');
    btnKicker.type = 'button';
    btnKicker.addEventListener('click', () => {
      if (confirm(`Exclure ${j.pseudo} de la partie depuis la TV ?`)) {
        socket.emit('kickerJoueur', j.id, (res) => {
          if (res && res.ok) {
            rendreListeJoueursTv();
          } else if (res && res.erreur) {
            alert(res.erreur);
          }
        });
      }
    });
    actions.appendChild(btnKicker);

    carte.append(info, actions);
    listeJoueursTv.appendChild(carte);
  }
}

if (btnRoueTv) btnRoueTv.addEventListener('click', ouvrirModalTv);
if (btnFermerModalTv) btnFermerModalTv.addEventListener('click', fermerModalTv);
if (modalTvBackdrop) modalTvBackdrop.addEventListener('click', fermerModalTv);

if (btnRetourLobbyModalTv) {
  btnRetourLobbyModalTv.addEventListener('click', () => {
    if (dernierEtat && dernierEtat.phase === 'lobby') {
      alert('La partie est déjà dans le lobby.');
      return;
    }
    if (confirm('Voulez-vous vraiment interrompre la partie et retourner au lobby depuis la TV ?')) {
      socket.emit('retourLobby', (res) => {
        if (res && res.erreur) {
          alert(res.erreur);
        } else {
          fermerModalTv();
        }
      });
    }
  });
}

// =====================================================================
// Logique du Scoreboard TV (Panthéon des joueurs)
// =====================================================================
function ouvrirScoreboardTv() {
  if (!modalScoreboardTv) return;
  modalScoreboardTv.classList.remove('cache');
  if (typeof sons !== 'undefined' && sons && sons.carte) {
    sons.carte();
  }
  rendreScoreboardTv();
}

function fermerScoreboardTv() {
  if (!modalScoreboardTv) return;
  modalScoreboardTv.classList.add('cache');
}

function obtenirStatsGlobales() {
  if (dernierEtat && dernierEtat.statsGlobales && Object.keys(dernierEtat.statsGlobales).length > 0) {
    return Promise.resolve(dernierEtat.statsGlobales);
  }
  return fetch('/api/scores')
    .then((r) => r.json())
    .catch(() => ({}));
}

function rendreScoreboardTv() {
  if (!listeScoreboardTv) return;

  obtenirStatsGlobales().then((statsObj) => {
    listeScoreboardTv.innerHTML = '';
    const joueurs = Object.values(statsObj || {});

    if (joueurs.length === 0) {
      const vide = creerElement('div', 'scoreboard-vide', '✨ Aucun score enregistré pour le moment. Terminez une première partie pour inscrire vos noms au Panthéon !');
      listeScoreboardTv.appendChild(vide);
      return;
    }

    // Tri selon le critère actif
    joueurs.sort((a, b) => {
      const badgesA = a.badges || {};
      const badgesB = b.badges || {};
      switch (critereTriScoreboard) {
        case 'cameleon': {
          const diffC = (badgesB.cameleon || 0) - (badgesA.cameleon || 0);
          if (diffC !== 0) return diffC;
          return (b.bonnesReponsesTotal || 0) - (a.bonnesReponsesTotal || 0);
        }
        case 'incompris': {
          const diffI = (badgesB.incompris || 0) - (badgesA.incompris || 0);
          if (diffI !== 0) return diffI;
          return (b.partiesJouees || 0) - (a.partiesJouees || 0);
        }
        case 'exacts': {
          const diffE = (b.bonnesReponsesTotal || 0) - (a.bonnesReponsesTotal || 0);
          if (diffE !== 0) return diffE;
          return (b.victoires || 0) - (a.victoires || 0);
        }
        case 'parties': {
          const diffP = (b.partiesJouees || 0) - (a.partiesJouees || 0);
          if (diffP !== 0) return diffP;
          return (b.manchesJouees || 0) - (a.manchesJouees || 0);
        }
        case 'score': {
          const diffS = (b.scoreTotal || 0) - (a.scoreTotal || 0);
          if (diffS !== 0) return diffS;
          return (b.victoires || 0) - (a.victoires || 0);
        }
        case 'victoires':
        default: {
          const diffV = (b.victoires || 0) - (a.victoires || 0);
          if (diffV !== 0) return diffV;
          return (b.scoreTotal || 0) - (a.scoreTotal || 0);
        }
      }
    });

    joueurs.forEach((j, index) => {
      const rang = index + 1;
      const carte = creerElement('div', 'carte-scoreboard-joueur' + (rang <= 3 ? ` rang-${rang}` : ''));

      // Médaille / Rang
      let iconeRang = `#${rang}`;
      if (rang === 1) iconeRang = '🥇 #1';
      else if (rang === 2) iconeRang = '🥈 #2';
      else if (rang === 3) iconeRang = '🥉 #3';

      const elRang = creerElement('div', 'scoreboard-rang', iconeRang);

      // Avatar
      const elAvatar = creerElement('div', 'scoreboard-avatar', j.avatar || '🍸');

      // Corps
      const elCorps = creerElement('div', 'scoreboard-corps');

      // Ligne du haut : Pseudo + Badges
      const elLigneHaut = creerElement('div', 'scoreboard-ligne-haut');
      const elPseudo = creerElement('span', 'scoreboard-pseudo', j.pseudo || 'Anonyme');
      elLigneHaut.appendChild(elPseudo);

      const badges = j.badges || {};
      const elBadges = creerElement('div', 'scoreboard-badges');

      if (badges.cameleon && badges.cameleon > 0) {
        const bC = creerElement('span', 'badge-chip badge-chip-cameleon', `🦎 Le plus normal ×${badges.cameleon}`);
        bC.title = 'Élu le plus normal (Caméléon : pensée alignée avec le groupe)';
        elBadges.appendChild(bC);
      }
      if (badges.incompris && badges.incompris > 0) {
        const bI = creerElement('span', 'badge-chip badge-chip-incompris', `👽 Le plus bizarre ×${badges.incompris}`);
        bI.title = 'Élu le plus bizarre (Grand Incompris : choix le plus décalé)';
        elBadges.appendChild(bI);
      }
      if (badges.stratege && badges.stratege > 0) {
        const bS = creerElement('span', 'badge-chip badge-chip-stratege', `🃏 Stratège Joker ×${badges.stratege}`);
        bS.title = 'A conservé son joker jusqu\'au bout';
        elBadges.appendChild(bS);
      }

      elLigneHaut.appendChild(elBadges);

      // Ligne du bas : Pastilles de statistiques
      const elStats = creerElement('div', 'scoreboard-stats-grille');

      const pillVictoires = creerElement('span', 'stat-pill');
      pillVictoires.innerHTML = `🏆 Victoires : <strong>${j.victoires || 0}</strong>`;

      const pillExacts = creerElement('span', 'stat-pill');
      pillExacts.innerHTML = `🎯 Réponses exactes : <strong>${j.bonnesReponsesTotal || 0}</strong>`;

      const pillParties = creerElement('span', 'stat-pill');
      pillParties.innerHTML = `🎮 Parties : <strong>${j.partiesJouees || 0}</strong> <small>(${j.manchesJouees || 0} manches)</small>`;

      const pillScore = creerElement('span', 'stat-pill');
      pillScore.innerHTML = `⭐ Score total : <strong>${j.scoreTotal || 0} pts</strong>`;

      elStats.append(pillVictoires, pillExacts, pillParties, pillScore);

      if (j.meilleurePartie !== undefined && j.meilleurePartie > 0) {
        const pillRecord = creerElement('span', 'stat-pill');
        pillRecord.innerHTML = `🔥 Record : <strong>${j.meilleurePartie} pts</strong> <small>(Manche: ${j.meilleureManche || 0})</small>`;
        elStats.appendChild(pillRecord);
      }

      elCorps.append(elLigneHaut, elStats);
      carte.append(elRang, elAvatar, elCorps);
      listeScoreboardTv.appendChild(carte);
    });
  });
}

// Écouteurs pour les onglets de tri du scoreboard
if (tabsTriScoreboard && tabsTriScoreboard.length > 0) {
  tabsTriScoreboard.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabsTriScoreboard.forEach((t) => t.classList.remove('actif'));
      tab.classList.add('actif');
      critereTriScoreboard = tab.getAttribute('data-tri') || 'victoires';
      rendreScoreboardTv();
    });
  });
}

if (btnScoreboardTv) btnScoreboardTv.addEventListener('click', ouvrirScoreboardTv);
if (btnFermerModalScoreboard) btnFermerModalScoreboard.addEventListener('click', fermerScoreboardTv);
if (modalScoreboardBackdrop) modalScoreboardBackdrop.addEventListener('click', fermerScoreboardTv);

// Onde de choc et switch de mode TV
let coordonneesClicSwitchTv = null;

function declencherOndeDeChocTv(x, y, modeCible) {
  if (!ondeDeChoc) return;

  // Calcul de l'origine si non fournie (clic local ou centre du bouton de switch)
  if (x === undefined || y === undefined || x === null || y === null) {
    if (coordonneesClicSwitchTv) {
      x = coordonneesClicSwitchTv.x;
      y = coordonneesClicSwitchTv.y;
    } else if (btnSwitchModeTv) {
      const rect = btnSwitchModeTv.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else {
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }
  }
  coordonneesClicSwitchTv = null;

  ondeDeChoc.style.setProperty('--onde-x', `${Math.round(x)}px`);
  ondeDeChoc.style.setProperty('--onde-y', `${Math.round(y)}px`);

  ondeDeChoc.classList.remove('actif', 'vers-quicksplash', 'vers-priorities');
  void ondeDeChoc.offsetWidth; // Force reflow

  const classeMode = modeCible === 'quicksplash' ? 'vers-quicksplash' : 'vers-priorities';
  ondeDeChoc.classList.add('actif', classeMode);

  document.body.classList.remove('secousse-mode');
  void document.body.offsetWidth;
  document.body.classList.add('secousse-mode');

  setTimeout(() => {
    document.body.classList.remove('secousse-mode');
  }, 700);

  setTimeout(() => {
    ondeDeChoc.classList.remove('actif', 'vers-quicksplash', 'vers-priorities');
  }, 2000);
}

if (btnSwitchModeTv) {
  btnSwitchModeTv.addEventListener('click', (e) => {
    coordonneesClicSwitchTv = { x: e.clientX, y: e.clientY };
    socket.emit('changerMode', null, (res) => {
      if (res && res.erreur) {
        alert(res.erreur);
      }
    });
  });
}

// =====================================================================
// CONTRÔLEUR DU MODE QUICK SPLASH SUR L'ÉCRAN TV (Étape 5)
// =====================================================================

let tvQsManchePrecedente = 0;

function afficherQsSetupTv(etat) {
  afficherSection('qsSetup');
  const qs = etat.quicksplash || {};
  const total = qs.nbJoueursTotal || etat.joueurs.length;
  const valides = qs.nbAmorcesValidees || 0;

  if (tvQsCompteurAmorces) {
    tvQsCompteurAmorces.textContent = `${valides} / ${total} amorces reçues`;
  }

  if (tvQsListeJoueursSetup) {
    tvQsListeJoueursSetup.innerHTML = '';
    (etat.joueurs || []).forEach((j) => {
      const li = creerElement('li', 'tv-statut-item' + (j.aSoumisAmorce ? ' valide' : ''));
      const gauche = creerElement('div', 'tv-statut-gauche');
      gauche.appendChild(creerElement('span', 'pastille-avatar-tv', j.avatar || '🍸'));
      gauche.appendChild(creerElement('span', 'pseudo-joueur-tv', j.pseudo));

      const badge = creerElement('span', 'tv-badge-statut', j.aSoumisAmorce ? 'Prêt ! 🚀' : 'En écriture... ✍️');
      li.append(gauche, badge);
      tvQsListeJoueursSetup.appendChild(li);
    });
  }
}

function afficherQsEcritureTv(etat) {
  afficherSection('qsEcriture');
  const qs = etat.quicksplash || {};
  const amorce = qs.amorceManche || { type: 'trou', texte: '...' };

  // Réinitialisation si nouvelle manche
  if (tvQsManchePrecedente !== etat.mancheActuelle) {
    tvQsManchePrecedente = etat.mancheActuelle;
    if (tvQsTableCartes) tvQsTableCartes.innerHTML = '';
    tvQsCartesPoseesCount = 0;
  }

  if (tvQsBadgeMancheEcriture) {
    tvQsBadgeMancheEcriture.textContent = `Manche ${etat.mancheActuelle} / ${etat.nbManches}`;
  }

  if (tvQsAmorceIcone) {
    tvQsAmorceIcone.textContent = amorce.type === 'question' ? '❓' : '📝';
  }
  if (tvQsAmorceTexte) {
    tvQsAmorceTexte.textContent = `« ${amorce.texte} »`;
  }

  const tempsRestant = qs.tempsRestantEcriture !== undefined ? qs.tempsRestantEcriture : 45;
  if (tvQsCompteurChrono) {
    tvQsCompteurChrono.textContent = tempsRestant;
  }
  if (tvQsChronoBox) {
    tvQsChronoBox.classList.toggle('tv-chrono-stress', tempsRestant <= 10);
  }

  // Rendu des cartes déjà posées sur la table
  const cartesPosees = qs.cartesPoseesEnDirect || [];
  if (tvQsCompteurCartesPosees) {
    tvQsCompteurCartesPosees.textContent = `${cartesPosees.length} / ${etat.joueurs.length}`;
  }

  if (tvQsTableCartes && tvQsTableCartes.children.length === 0 && cartesPosees.length > 0) {
    cartesPosees.forEach((c) => {
      creerEtPoserCarteSurTableTv(c.pseudo, c.avatar);
    });
  }
}

function creerEtPoserCarteSurTableTv(pseudo, avatar) {
  if (!tvQsTableCartes) return;
  const carte = creerElement('div', 'tv-qs-carte-posee');
  carte.appendChild(creerElement('span', 'tv-qs-carte-avatar', avatar || '🍸'));
  carte.appendChild(creerElement('span', 'tv-qs-carte-pseudo', pseudo));
  carte.appendChild(creerElement('span', 'tv-qs-carte-tampon', 'PUNCHLINE REÇUE'));
  tvQsTableCartes.appendChild(carte);
}

// Événement en direct : une carte s'envole et atterrit sur la télé
socket.on('qsNouvelleCartePosee', ({ pseudo, avatar, totalPosees, totalAttendus }) => {
  if (tvQsCompteurCartesPosees) {
    tvQsCompteurCartesPosees.textContent = `${totalPosees} / ${totalAttendus}`;
  }
  creerEtPoserCarteSurTableTv(pseudo, avatar);

  if (window.audio && typeof window.audio.popReaction === 'function') {
    window.audio.popReaction();
  }
});

// Tick du chrono de 45 secondes pour la TV
socket.on('qsChronoTick', ({ tempsRestant }) => {
  if (tvQsCompteurChrono) {
    tvQsCompteurChrono.textContent = tempsRestant;
  }
  if (tvQsChronoBox) {
    const estStress = tempsRestant <= 10;
    tvQsChronoBox.classList.toggle('tv-chrono-stress', estStress);
    if (estStress && window.audio && typeof window.audio.bipCompte === 'function') {
      window.audio.bipCompte(tempsRestant <= 3);
    }
  }
});

function afficherQsClassementTv(etat) {
  afficherSection('qsClassement');
  const qs = etat.quicksplash || {};
  const reponses = qs.reponsesAnonymes || [];

  if (tvQsBadgeMancheClassement) {
    tvQsBadgeMancheClassement.textContent = `Manche ${etat.mancheActuelle} / ${etat.nbManches}`;
  }
  if (tvQsRappelAmorceClassement && qs.amorceManche) {
    tvQsRappelAmorceClassement.textContent = qs.amorceManche.texte;
  }

  // Grille des cartes anonymes
  if (tvQsCartesAnonymesGrille) {
    tvQsCartesAnonymesGrille.innerHTML = '';
    reponses.forEach((rep) => {
      const carte = creerElement('div', 'tv-qs-carte-anonyme', `« ${rep.texte} »`);
      tvQsCartesAnonymesGrille.appendChild(carte);
    });
  }

  // Statut des joueurs votants
  const total = qs.nbJoueursTotal || etat.joueurs.length;
  const classes = qs.nbClassesValides || 0;
  if (tvQsCompteurClasses) {
    tvQsCompteurClasses.textContent = `${classes} / ${total} classements verrouillés`;
  }

  if (tvQsListeJoueursClassement) {
    tvQsListeJoueursClassement.innerHTML = '';
    (etat.joueurs || []).forEach((j) => {
      const li = creerElement('li', 'tv-statut-item' + (j.aClasse ? ' valide' : ''));
      const gauche = creerElement('div', 'tv-statut-gauche');
      gauche.appendChild(creerElement('span', 'pastille-avatar-tv', j.avatar || '🍸'));
      gauche.appendChild(creerElement('span', 'pseudo-joueur-tv', j.pseudo));

      const badge = creerElement('span', 'tv-badge-statut', j.aClasse ? 'Verrouillé ! 🔒' : 'En réflexion... 🤔');
      li.append(gauche, badge);
      tvQsListeJoueursClassement.appendChild(li);
    });
  }
}

// --- Révélations & Slam Cartes TV (Étape 4 de manche) ---
function afficherQsRevelationTv(etat) {
  afficherSection('qsRevelation');
  const qs = etat.quicksplash;
  if (!qs || !qs.resultatsManche) return;
  const resManche = qs.resultatsManche;

  if (tvQsBadgeMancheRevelation) {
    tvQsBadgeMancheRevelation.textContent = `Manche ${etat.mancheActuelle} / ${etat.nbManches}`;
  }
  if (tvQsAmorceRevelationTexte && resManche.amorce) {
    tvQsAmorceRevelationTexte.textContent = `Amorce : « ${resManche.amorce.texte} »`;
  }

  // Animation slam des cartes sur la TV
  if (tvQsCartesRevelationListe) {
    if (tvQsMancheAnimee !== etat.mancheActuelle) {
      tvQsMancheAnimee = etat.mancheActuelle;
      tvQsCartesRevelationListe.innerHTML = '';

      const reponsesTriees = [...resManche.reponses].sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));

      reponsesTriees.forEach((r, idx) => {
        const carte = creerElement('div', 'tv-qs-carte-slam' + (r.estBot ? ' est-bot' : '') + (idx === 0 ? ' top-1' : ''));
        carte.style.animationDelay = `${idx * 0.45}s`;

        const texte = creerElement('div', 'tv-qs-slam-texte', `« ${r.texte} »`);

        const auteurRow = creerElement('div', 'tv-qs-slam-auteur-row');
        const auteurInfo = creerElement('div', 'tv-qs-slam-auteur-info');
        auteurInfo.innerHTML = `<span class="tv-qs-slam-auteur-avatar">${r.auteurAvatar || '🍸'}</span> <span class="tv-qs-slam-auteur-pseudo ${r.estBot ? 'est-bot' : ''}">${r.auteurPseudo}</span>`;

        const pointsRow = creerElement('div', 'tv-qs-slam-points-row');
        if (r.top1 > 0) {
          const gainTop1 = r.ptsTop1 !== undefined ? r.ptsTop1 : (r.top1 * 3);
          const libelleTop1 = r.autoVoteTop1
            ? `🥇 +${gainTop1} pts (${r.top1}x #1 dont auto-vote à +1.5)`
            : `🥇 +${gainTop1} pts (${r.top1}x #1)`;
          const p1 = creerElement('span', 'tv-qs-pill-pts qs-pill-pts pts-plus3', libelleTop1);
          p1.style.animationDelay = `${idx * 0.45 + 0.25}s`;
          pointsRow.appendChild(p1);
        }
        if (r.top2 > 0) {
          const p2 = creerElement('span', 'tv-qs-pill-pts qs-pill-pts pts-plus2', `🥈 +${r.top2 * 2} pts (${r.top2}x #2)`);
          p2.style.animationDelay = `${idx * 0.45 + 0.35}s`;
          pointsRow.appendChild(p2);
        }
        if (r.top3 > 0) {
          const p3 = creerElement('span', 'tv-qs-pill-pts qs-pill-pts pts-plus1', `🥉 +${r.top3 * 1} pts (${r.top3}x #3)`);
          p3.style.animationDelay = `${idx * 0.45 + 0.45}s`;
          pointsRow.appendChild(p3);
        }

        auteurRow.append(auteurInfo, pointsRow);
        carte.append(texte, auteurRow);
        tvQsCartesRevelationListe.appendChild(carte);
      });

      if (window.audio && typeof window.audio.gagnantRoulette === 'function') {
        window.audio.gagnantRoulette();
      }
    }
  }

  // Alerte Bot Piège TV
  if (tvQsAlerteBotBox && tvQsBotVictimes) {
    if (resManche.joueursPiegesParBot && resManche.joueursPiegesParBot.length > 0) {
      tvQsAlerteBotBox.classList.remove('cache');
      tvQsBotVictimes.textContent = `🚨 Attention : ${resManche.joueursPiegesParBot.join(', ')} ont placé le Bot dans leur Top 2 (-2 pts chacun) !`;
    } else {
      tvQsAlerteBotBox.classList.add('cache');
    }
  }

  // Accusations Sniper TV
  if (tvQsSnipersBox && tvQsSnipersListe) {
    if (resManche.accusations && resManche.accusations.length > 0) {
      tvQsSnipersBox.classList.remove('cache');
      tvQsSnipersListe.innerHTML = '';
      resManche.accusations.forEach((acc) => {
        const item = creerElement('div', 'tv-qs-item-sniper ' + (acc.correct ? 'succes' : 'echec'),
          acc.correct
            ? `🎯 ${acc.sniperPseudo} a démasqué ${acc.pseudoAccuse} sur "${acc.reponseTexte.slice(0, 30)}…" (+2 pts / -1 pt) !`
            : `❌ ${acc.sniperPseudo} a accusé à tort ${acc.pseudoAccuse} (-1 pt).`
        );
        tvQsSnipersListe.appendChild(item);
      });
    } else {
      tvQsSnipersBox.classList.add('cache');
    }
  }

  // Classement général provisoire TV
  if (tvQsScoresCumules) {
    tvQsScoresCumules.innerHTML = '';
    const classement = resManche.classementCumule || [];
    classement.forEach((j, idx) => {
      const li = creerElement('div', 'item-score-joueur-tv');
      const gauche = creerElement('div', 'joueur-info-score-tv');
      gauche.innerHTML = `<span class="rang-badge">#${idx + 1}</span> <span class="pastille-avatar-tv">${j.avatar || '🍸'}</span> <span class="pseudo-joueur-tv">${j.pseudo}</span>`;

      const droite = creerElement('div', 'joueur-points-score-tv');
      droite.innerHTML = `<span class="pts-manche-gain">+${j.scoreManche}</span> <strong class="pts-total-score">${j.scoreTotal} pts</strong>`;

      li.append(gauche, droite);
      tvQsScoresCumules.appendChild(li);
    });
  }
}

// --- Podium Final TV (Étape 5) ---
function afficherQsFinTv(etat) {
  afficherSection('qsFin');
  const podium = (etat.quicksplash && etat.quicksplash.podiumFinal) || [];
  const trophees = (etat.quicksplash && etat.quicksplash.trophees) || etat.trophees || [];

  // Effet de confettis festifs & fanfare sur la TV
  if (window.confettis) window.confettis.podiumTV();
  if (window.audio && typeof window.audio.fanfarePodium === 'function') {
    window.audio.fanfarePodium();
  }

  // 1. Podium Visuel Top 3 (2e à gauche, 1er au milieu surélevé, 3e à droite)
  if (tvQsPodiumVisuel) {
    tvQsPodiumVisuel.innerHTML = '';
    const topTrois = podium.slice(0, 3);
    const podiumOrdre = [];
    if (topTrois[1]) podiumOrdre.push({ j: topTrois[1], place: 2, classe: 'marche-argent', medaille: '🥈' });
    if (topTrois[0]) podiumOrdre.push({ j: topTrois[0], place: 1, classe: 'marche-or', medaille: '👑 🥇' });
    if (topTrois[2]) podiumOrdre.push({ j: topTrois[2], place: 3, classe: 'marche-bronze', medaille: '🥉' });

    podiumOrdre.forEach((item) => {
      const marche = creerElement('div', 'tv-podium-marche ' + item.classe);
      const medaille = creerElement('div', 'tv-podium-medaille', item.medaille);
      const avatarBox = creerElement('div', 'tv-podium-avatar', item.j.avatar || '🍸');
      const nom = creerElement('div', 'tv-podium-nom', item.j.pseudo);
      const totalPoints = item.j.scoreTotal ?? item.j.total ?? 0;
      const score = creerElement('div', 'tv-podium-score', totalPoints + ' pts');
      const socle = creerElement('div', 'tv-podium-socle', '#' + item.place);

      marche.append(medaille, avatarBox, nom, score, socle);
      tvQsPodiumVisuel.appendChild(marche);
    });
  }

  // 2. Trophées & Statistiques insolites Quick Splash (Bot, snipers, punchlines)
  if (tvQsZoneTrophees) {
    tvQsZoneTrophees.innerHTML = '';
    trophees.forEach((t) => {
      const carte = creerElement('div', 'tv-trophee-carte');
      const icone = creerElement('span', 'tv-trophee-icone', t.icone);
      const bloc = creerElement('div', 'tv-trophee-texte');
      const titre = creerElement('div', 'tv-trophee-titre', t.titre + ' : ' + t.pseudos);
      const desc = creerElement('div', 'tv-trophee-desc', t.desc);
      bloc.append(titre, desc);
      carte.append(icone, bloc);
      tvQsZoneTrophees.appendChild(carte);
    });
  }

  // 3. Liste complète du classement
  if (tvQsListePodiumComplet) {
    tvQsListePodiumComplet.innerHTML = '';
    podium.forEach((p) => {
      const item = creerElement('div', 'item-score-joueur-tv');
      const gauche = creerElement('div', 'joueur-info-score-tv');
      gauche.innerHTML = `<span class="rang-badge">#${p.rang}</span> <span class="pastille-avatar-tv">${p.avatar || '🍸'}</span> <strong class="pseudo-joueur-tv">${p.pseudo}</strong>`;

      const totalPoints = p.scoreTotal ?? p.total ?? 0;
      const droite = creerElement('div', 'joueur-points-score-tv');
      droite.innerHTML = `<strong class="pts-total-score">${totalPoints} pts</strong>`;

      item.append(gauche, droite);
      tvQsListePodiumComplet.appendChild(item);
    });
  }
}




