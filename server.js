// =====================================================================
// server.js - Point d'entrée Backend
// Étape 6 : Scoring complet, manches, podium final & persistance scores.json
// Express sert les fichiers statiques, Socket.IO gère le temps réel.
// =====================================================================

const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const QRCode = require('qrcode');
const { Server } = require('socket.io');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------
// Dossiers & Fichiers de données
// ---------------------------------------------------------------------
function estExecutableAutonome() {
  try {
    return require('node:sea').isSea();
  } catch (e) {
    return Boolean(process.pkg);
  }
}
const DOSSIER_RACINE = estExecutableAutonome()
  ? path.dirname(process.execPath)
  : __dirname;
const DOSSIER_DATA = path.join(DOSSIER_RACINE, 'data');
const FICHIER_THEMES = path.join(DOSSIER_DATA, 'themes.json');
const FICHIER_SCORES = path.join(DOSSIER_DATA, 'scores.json');

// ---------------------------------------------------------------------
// Chargement des thèmes
// ---------------------------------------------------------------------
function chargerThemes() {
  try {
    if (!fs.existsSync(FICHIER_THEMES)) {
      if (!fs.existsSync(DOSSIER_DATA)) {
        fs.mkdirSync(DOSSIER_DATA, { recursive: true });
      }
      const bundledThemes = path.join(__dirname, 'data', 'themes.json');
      if (fs.existsSync(bundledThemes) && bundledThemes !== FICHIER_THEMES) {
        fs.copyFileSync(bundledThemes, FICHIER_THEMES);
      }
    }
    if (fs.existsSync(FICHIER_THEMES)) {
      return JSON.parse(fs.readFileSync(FICHIER_THEMES, 'utf8'));
    }
    const internalThemes = path.join(__dirname, 'data', 'themes.json');
    return JSON.parse(fs.readFileSync(internalThemes, 'utf8'));
  } catch (erreur) {
    console.error('[ERREUR] Impossible de lire les thèmes :', erreur.message);
    return {};
  }
}

// ---------------------------------------------------------------------
// Persistance des scores par pseudo (data/scores.json)
// ---------------------------------------------------------------------
function chargerScoresPersistants() {
  try {
    if (fs.existsSync(FICHIER_SCORES)) {
      return JSON.parse(fs.readFileSync(FICHIER_SCORES, 'utf8'));
    }
  } catch (err) {
    console.error('[SCORES] Erreur lecture scores.json :', err.message);
  }
  return {};
}

function enregistrerProfilJoueurLobby(pseudo, avatar) {
  if (!pseudo || typeof pseudo !== 'string') return;
  const scoresGlobal = chargerScoresPersistants();
  const cle = pseudo.toLowerCase().trim();
  const existant = scoresGlobal[cle] || {
    pseudo: pseudo,
    avatar: avatar || '🍸',
    partiesJouees: 0,
    manchesJouees: 0,
    scoreTotal: 0,
    bonnesReponsesTotal: 0,
    victoires: 0,
    meilleureManche: 0,
    meilleurePartie: 0,
    badges: { cameleon: 0, incompris: 0, stratege: 0 }
  };
  existant.pseudo = pseudo;
  if (avatar) existant.avatar = avatar;
  if (!existant.badges) existant.badges = { cameleon: 0, incompris: 0, stratege: 0 };
  if (existant.bonnesReponsesTotal === undefined) existant.bonnesReponsesTotal = 0;
  if (existant.manchesJouees === undefined) existant.manchesJouees = 0;
  scoresGlobal[cle] = existant;
  try {
    fs.writeFileSync(FICHIER_SCORES, JSON.stringify(scoresGlobal, null, 2) + '\n', 'utf8');
  } catch (_) {}
}

function enregistrerScoresFinDePartie() {
  const scoresGlobal = chargerScoresPersistants();

  // 1. Calcul des distances pour les badges
  const comptesDistance = new Map();
  for (const j of joueurs.values()) {
    comptesDistance.set(j.id, { exacts: 0, ecarts: 0 });
  }

  for (const manche of jeu.historiqueManches) {
    if (Array.isArray(manche.joueurs)) {
      for (const jRes of manche.joueurs) {
        const stats = comptesDistance.get(jRes.id);
        if (stats && Array.isArray(jRes.details)) {
          for (const d of jRes.details) {
            if (d.distance === 0) stats.exacts++;
            else if (d.distance >= 2) stats.ecarts++;
          }
        }
      }
    }
  }

  let maxExacts = 0;
  for (const stats of comptesDistance.values()) {
    if (stats.exacts > maxExacts) maxExacts = stats.exacts;
  }
  const cameleonsSet = new Set();
  if (maxExacts > 0) {
    for (const [id, stats] of comptesDistance.entries()) {
      if (stats.exacts === maxExacts) cameleonsSet.add(id);
    }
  }

  let maxEcarts = 0;
  for (const stats of comptesDistance.values()) {
    if (stats.ecarts > maxEcarts) maxEcarts = stats.ecarts;
  }
  const incomprisSet = new Set();
  if (maxEcarts > 0) {
    for (const [id, stats] of comptesDistance.entries()) {
      if (stats.ecarts === maxEcarts) incomprisSet.add(id);
    }
  }

  // 2. Classement final et mise à jour
  const classementFinal = Array.from(joueurs.values()).map((j) => {
    const rec = jeu.scoresPartie.get(j.id) || { total: 0, parManche: [0] };
    const dist = comptesDistance.get(j.id) || { exacts: 0, ecarts: 0 };
    return {
      id: j.id,
      pseudo: j.pseudo,
      avatar: j.avatar || '🍸',
      total: rec.total,
      exacts: dist.exacts,
      meilleureM: Math.max(...(rec.parManche.length ? rec.parManche : [0])),
      aGardeJoker: !jeu.jokersUtilises.has(j.id)
    };
  });

  const scoreMax = Math.max(...classementFinal.map((c) => c.total), 0);

  for (const c of classementFinal) {
    const cle = c.pseudo.toLowerCase();
    const existant = scoresGlobal[cle] || {
      pseudo: c.pseudo,
      avatar: c.avatar,
      partiesJouees: 0,
      manchesJouees: 0,
      scoreTotal: 0,
      bonnesReponsesTotal: 0,
      victoires: 0,
      meilleureManche: 0,
      meilleurePartie: 0,
      badges: { cameleon: 0, incompris: 0, stratege: 0 }
    };

    existant.pseudo = c.pseudo;
    existant.avatar = c.avatar;
    if (!existant.badges) existant.badges = { cameleon: 0, incompris: 0, stratege: 0 };
    if (existant.bonnesReponsesTotal === undefined) existant.bonnesReponsesTotal = 0;
    if (existant.manchesJouees === undefined) existant.manchesJouees = 0;

    existant.partiesJouees += 1;
    existant.manchesJouees += jeu.mancheActuelle;
    existant.scoreTotal += c.total;
    existant.bonnesReponsesTotal += c.exacts;

    if (c.total === scoreMax && scoreMax > 0) {
      existant.victoires += 1;
    }
    if (cameleonsSet.has(c.id)) {
      existant.badges.cameleon = (existant.badges.cameleon || 0) + 1;
    }
    if (incomprisSet.has(c.id)) {
      existant.badges.incompris = (existant.badges.incompris || 0) + 1;
    }
    if (c.aGardeJoker) {
      existant.badges.stratege = (existant.badges.stratege || 0) + 1;
    }

    existant.meilleureManche = Math.max(existant.meilleureManche, c.meilleureM);
    existant.meilleurePartie = Math.max(existant.meilleurePartie, c.total);
    existant.dernierePartie = new Date().toISOString();

    scoresGlobal[cle] = existant;
  }

  try {
    fs.writeFileSync(FICHIER_SCORES, JSON.stringify(scoresGlobal, null, 2) + '\n', 'utf8');
    console.log('[SCORES] data/scores.json mis à jour avec succès.');
  } catch (err) {
    console.error('[SCORES] Impossible d\'écrire dans scores.json :', err.message);
  }
}

function listeSansDoublons(liste) {
  const vus = new Set();
  const resultat = [];
  for (const mot of Array.isArray(liste) ? liste : []) {
    if (typeof mot !== 'string') continue;
    const propre = mot.trim();
    if (propre && !vus.has(propre.toLowerCase())) {
      vus.add(propre.toLowerCase());
      resultat.push(propre);
    }
  }
  return resultat;
}

function preparerThemes(brut, nbManches) {
  const besoin = nbManches * MOTS_PAR_MANCHE;
  const normaux = [];
  const speciaux = [];

  for (const cle of Object.keys(brut)) {
    if (cle === 'quickSplash') continue;
    const t = brut[cle];
    if (!t || typeof t !== 'object') continue;
    const theme = {
      cle: cle,
      nom: String(t.nom || cle),
      description: String(t.description || ''),
      emoji: String(t.emoji || '🎲'),
      hardcore: Boolean(t.hardcore),
      special: Boolean(t.special),
      consigneHaut: String(t.consigne_haut || 'Je préfère'),
      consigneBas: String(t.consigne_bas || 'Je préfère le moins'),
      mots: listeSansDoublons(t.mots)
    };
    (theme.special ? speciaux : normaux).push(theme);
  }

  // Méli-mélo pioche dans tous les thèmes normaux SAUF les thèmes hardcore
  const reserve = listeSansDoublons([].concat(...normaux.filter((t) => !t.hardcore).map((t) => t.mots)));
  for (const t of speciaux) t.mots = reserve;

  return normaux.concat(speciaux).filter((t) => {
    const assez = t.mots.length >= besoin;
    if (!assez) {
      console.warn('[THEMES] "' + t.nom + '" ignoré : ' + t.mots.length + ' mots (il en faut ' + besoin + ')');
    }
    return assez;
  });
}

function themePublic(t) {
  return {
    cle: t.cle,
    nom: t.nom,
    description: t.description,
    emoji: t.emoji,
    hardcore: t.hardcore,
    special: t.special,
    consigneHaut: t.consigneHaut,
    consigneBas: t.consigneBas
  };
}

function melanger(tableau) {
  const t = [...tableau];
  for (let i = t.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

function elementAleatoire(liste) {
  return liste[crypto.randomInt(liste.length)];
}

function trouverIpLocale() {
  const interfaces = os.networkInterfaces();
  for (const nom of Object.keys(interfaces)) {
    for (const adresse of interfaces[nom]) {
      if (adresse.family === 'IPv4' && !adresse.internal) {
        return adresse.address;
      }
    }
  }
  return 'localhost';
}

// ---------------------------------------------------------------------
// Express & Socket.IO
// ---------------------------------------------------------------------
const app = express();
const serveur = http.createServer(app);
const io = new Server(serveur, {
  pingInterval: 8000,
  pingTimeout: 7000
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/lib/sortable', express.static(path.join(__dirname, 'node_modules', 'sortablejs')));

app.get('/tv', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tv.html'));
});

app.get('/api/info', async (req, res) => {
  const ip = trouverIpLocale();
  const url = 'http://' + ip + ':' + PORT;
  try {
    const qr = await QRCode.toDataURL(url, { margin: 1, width: 400 });
    res.json({ ip, port: PORT, url, qr });
  } catch (erreur) {
    res.json({ ip, port: PORT, url, qr: null });
  }
});

app.get('/api/scores', (req, res) => {
  res.json(chargerScoresPersistants());
});

function chargerDonneesQuickSplash() {
  const donnees = chargerThemes();
  return donnees.quickSplash || { textesATrous: [], questions: [], reponsesBot: [] };
}

app.get('/api/quicksplash', (req, res) => {
  res.json(chargerDonneesQuickSplash());
});

// =====================================================================
// ÉTAT DU JEU
// =====================================================================
const JOUEURS_MIN = 2;
const JOUEURS_MAX = 12;
const OPTIONS_MANCHES = [3, 4, 5, 6];
const MOTS_PAR_MANCHE = 5;
const DELAI_GRACE_LOBBY = 10000;
const DUREE_ANNONCE = 4500;
const DUREE_ANNONCE_EGALITE = 7000;
const DUREE_JOKER_MS = 120000;         // 2 minutes chrono
const DUREE_DEBAT_INDICATIF_S = 180;   // 3 minutes indicatives
const PSEUDO_MIN = 2;
const PSEUDO_MAX = 16;
const BONUS_JOKER_POINTS = 8;          // Bonus fin de partie si joker conservé
const DUREE_ECRITURE_QS_S = 45;         // Chrono Quick Splash (45 secondes)

function creerEtatInitialQuickSplash() {
  return {
    amorces: new Map(),
    amorcesPool: [],
    amorceManche: null,
    reponses: new Map(),
    reponseBot: null,
    cartesEnAttente: [],
    ordreMelangeReponses: [],
    classements: new Map(),
    snipers: new Map(),
    scoresManche: null,
    scoresCumules: new Map(),
    timerEcriture: null,
    tempsRestantEcriture: DUREE_ECRITURE_QS_S,
    historiqueManches: []
  };
}

const joueurs = new Map();
let compteurOrdre = 0;

const jeu = {
  mode: 'priorities',      // 'priorities' | 'quicksplash'
  phase: 'lobby',          // 'lobby' | 'vote' | 'annonce' | 'classement' | 'classement_termine' | 'debat' | 'debat_termine' | 'resultats_manche' | 'fin_partie' | 'qs_setup' | 'qs_ecriture' | 'qs_classement' | 'qs_revelation' | 'qs_fin_partie'
  nbManches: 4,
  mancheActuelle: 0,
  chefId: null,
  capitaineId: null,
  themes: [],
  votes: new Map(),
  annonce: null,
  themeChoisi: null,
  motsJoues: new Set(),
  motsManche: [],
  votesReroll: new Set(),
  rerollsRestants: 5,
  classements: new Map(),  // idJoueur -> { mots: [...], valide: false }
  ordreGroupe: [],
  debutDebat: null,
  jokersTotal: 0,
  jokersUtilises: new Set(),
  // Données de score Priorities
  scoresPartie: new Map(), // idJoueur -> { total: 0, parManche: [] }
  dernierResultatManche: null,
  historiqueManches: [],
  minuteur: null,
  // État Quick Splash
  qs: creerEtatInitialQuickSplash()
};

// ---------------------------------------------------------------------
// Fonctions utilitaires
// ---------------------------------------------------------------------
function nettoyerPseudo(brut) {
  if (typeof brut !== 'string') return '';
  return brut.replace(/\s+/g, ' ').trim().slice(0, PSEUDO_MAX);
}

function pseudoDejaPris(pseudo, idAIgnorer) {
  const minuscule = pseudo.toLowerCase();
  for (const joueur of joueurs.values()) {
    if (joueur.id !== idAIgnorer && joueur.pseudo.toLowerCase() === minuscule) {
      return true;
    }
  }
  return false;
}

function joueursTries() {
  return Array.from(joueurs.values()).sort((a, b) => a.ordre - b.ordre);
}

function nbConnectes() {
  return joueursTries().filter((j) => j.connecte).length;
}

function designerNouveauChef() {
  const suivant = joueursTries().find((j) => j.connecte);
  jeu.chefId = suivant ? suivant.id : null;
  jeu.capitaineId = jeu.chefId;
  console.log('[CHEF] Couronne passée à : ' + (suivant ? suivant.pseudo : 'aucun'));
}

function nbVotants() {
  return joueursTries().filter((j) => j.connecte && jeu.votes.has(j.id)).length;
}

function nbClasses() {
  if (jeu.phase !== 'classement' && jeu.phase !== 'classement_termine') return 0;
  return joueursTries().filter((j) => {
    const cl = jeu.classements.get(j.id);
    return j.connecte && cl && cl.valide;
  }).length;
}

const AVATARS_SOIREE_DEFAUT = ['🍸', '🍾', '🍻', '🍹', '🪩', '🕺', '💃', '🕶️', '🎉', '🍕', '🎧', '🍷', '🥂', '🍿', '🎸', '👑'];

function calculerPodium() {
  const liste = Array.from(joueurs.values()).map((j) => {
    const rec = jeu.scoresPartie.get(j.id) || { total: 0, parManche: [] };
    const aUtiliseJoker = jeu.jokersUtilises.has(j.id);
    const bonusJoker = (jeu.phase === 'fin_partie' && !aUtiliseJoker) ? BONUS_JOKER_POINTS : 0;
    const scoreFinal = rec.total + bonusJoker;

    return {
      id: j.id,
      pseudo: j.pseudo,
      avatar: j.avatar || '🍸',
      scoreManches: rec.total,
      bonusJoker: bonusJoker,
      aUtiliseJoker: aUtiliseJoker,
      total: scoreFinal,
      parManche: rec.parManche
    };
  });
  liste.sort((a, b) => b.total - a.total);

  let rangActuel = 1;
  return liste.map((j, idx) => {
    if (idx > 0 && j.total < liste[idx - 1].total) {
      rangActuel = idx + 1;
    }
    return {
      ...j,
      rang: rangActuel
    };
  });
}

function calculerTrophees() {
  if (jeu.phase !== 'fin_partie') return [];
  const trophees = [];

  const comptesDistance = new Map();
  for (const j of joueurs.values()) {
    comptesDistance.set(j.id, { exacts: 0, ecarts: 0 });
  }

  for (const manche of jeu.historiqueManches) {
    if (Array.isArray(manche.joueurs)) {
      for (const jRes of manche.joueurs) {
        const stats = comptesDistance.get(jRes.id);
        if (stats && Array.isArray(jRes.details)) {
          for (const d of jRes.details) {
            if (d.distance === 0) stats.exacts++;
            else if (d.distance >= 2) stats.ecarts++;
          }
        }
      }
    }
  }

  // 1. Le Caméléon : joueur avec le plus de distances 0
  let maxExacts = 0;
  let cameleons = [];
  for (const [id, stats] of comptesDistance.entries()) {
    if (stats.exacts > maxExacts) {
      maxExacts = stats.exacts;
      cameleons = [id];
    } else if (stats.exacts === maxExacts && maxExacts > 0) {
      cameleons.push(id);
    }
  }
  if (maxExacts > 0) {
    const pseudos = cameleons.map((id) => (joueurs.get(id) ? joueurs.get(id).pseudo : '')).filter(Boolean).join(', ');
    trophees.push({
      icone: '🦎',
      titre: 'Le Caméléon',
      desc: 'Le plus en phase avec le groupe (' + maxExacts + ' cartes pile poil !)',
      pseudos: pseudos
    });
  }

  // 2. Le Grand Incompris : joueur avec le plus de distances >= 2
  let maxEcarts = 0;
  let incompris = [];
  for (const [id, stats] of comptesDistance.entries()) {
    if (stats.ecarts > maxEcarts) {
      maxEcarts = stats.ecarts;
      incompris = [id];
    } else if (stats.ecarts === maxEcarts && maxEcarts > 0) {
      incompris.push(id);
    }
  }
  if (maxEcarts > 0) {
    const pseudos = incompris.map((id) => (joueurs.get(id) ? joueurs.get(id).pseudo : '')).filter(Boolean).join(', ');
    trophees.push({
      icone: '👽',
      titre: 'Le Grand Incompris',
      desc: 'Avis à contre-courant (' + maxEcarts + ' gros écarts)',
      pseudos: pseudos
    });
  }

  // 3. Le Stratège : joueurs ayant gardé leur joker pour empocher +8 pts
  const economes = Array.from(joueurs.values())
    .filter((j) => !jeu.jokersUtilises.has(j.id))
    .map((j) => j.pseudo);
  if (economes.length > 0) {
    trophees.push({
      icone: '🃏',
      titre: 'Le Stratège',
      desc: 'Joker conservé (+8 pts bonus empochés !)',
      pseudos: economes.join(', ')
    });
  }

  return trophees;
}

function etatPublic() {
  const chef = joueurs.get(jeu.chefId);
  const capitaine = joueurs.get(jeu.capitaineId);
  const connectes = nbConnectes();
  const enPartie = jeu.phase !== 'lobby';
  const themeChoisi = jeu.themes.find((t) => t.cle === jeu.themeChoisi);
  return {
    mode: jeu.mode || 'priorities',
    phase: jeu.phase,
    nbManches: jeu.nbManches,
    mancheActuelle: jeu.mancheActuelle,
    chefPseudo: chef ? chef.pseudo : null,
    chefId: jeu.chefId,
    capitainePseudo: capitaine ? capitaine.pseudo : null,
    capitaineId: jeu.capitaineId,
    joueurs: joueursTries().map((j) => {
      const cl = jeu.classements.get(j.id);
      const rec = jeu.scoresPartie.get(j.id) || { total: 0 };
      const scoreTotal = (jeu.mode === 'quicksplash')
        ? (jeu.qs && jeu.qs.scoresCumules ? (jeu.qs.scoresCumules.get(j.id) || 0) : 0)
        : rec.total;
      return {
        id: j.id,
        pseudo: j.pseudo,
        avatar: j.avatar || '🍸',
        connecte: j.connecte,
        scoreTotal: scoreTotal,
        aVote: jeu.phase === 'vote' && jeu.votes.has(j.id),
        aClasse: (jeu.mode === 'quicksplash')
          ? Boolean(jeu.qs && jeu.qs.classements && jeu.qs.classements.has(j.id))
          : Boolean(cl && cl.valide),
        aSoumisAmorce: Boolean(jeu.mode === 'quicksplash' && jeu.qs && jeu.qs.amorces && jeu.qs.amorces.has(j.id)),
        aSoumisReponse: Boolean(jeu.mode === 'quicksplash' && jeu.qs && jeu.qs.reponses && jeu.qs.reponses.has(j.id))
      };
    }),
    joueursMin: JOUEURS_MIN,
    joueursMax: JOUEURS_MAX,
    peutLancer: connectes >= JOUEURS_MIN && connectes <= JOUEURS_MAX,
    themes: enPartie ? jeu.themes.map(themePublic) : [],
    nbVotants: nbVotants(),
    nbClasses: nbClasses(),
    nbAttendus: connectes,
    annonce: jeu.phase === 'annonce' ? jeu.annonce : null,
    themeChoisi: themeChoisi ? themePublic(themeChoisi) : null,
    motsManche: (jeu.phase !== 'lobby' && jeu.phase !== 'vote' && jeu.phase !== 'annonce') ? jeu.motsManche : [],
    reroll: (jeu.phase === 'classement') ? {
      votes: jeu.votesReroll ? jeu.votesReroll.size : 0,
      requis: Math.floor(connectes / 2) + 1,
      total: connectes,
      restants: jeu.rerollsRestants !== undefined ? jeu.rerollsRestants : 5,
      votants: jeu.votesReroll ? Array.from(jeu.votesReroll).map((id) => {
        const j = joueurs.get(id);
        return {
          id: id,
          pseudo: j ? j.pseudo : '',
          avatar: j ? (j.avatar || '🍸') : '🍸'
        };
      }) : []
    } : null,
    ordreGroupe: (jeu.phase === 'debat' || jeu.phase === 'debat_termine' || jeu.phase === 'resultats_manche' || jeu.phase === 'fin_partie') ? jeu.ordreGroupe : [],
    debutDebat: jeu.debutDebat,
    dureeJokerMs: DUREE_JOKER_MS,
    dureeDebatS: DUREE_DEBAT_INDICATIF_S,
    jokersTotal: jeu.jokersTotal,
    jokersRestants: Math.max(0, jeu.jokersTotal - jeu.jokersUtilises.size),
    dernierResultatManche: (jeu.phase === 'resultats_manche' || jeu.phase === 'fin_partie') ? jeu.dernierResultatManche : null,
    podium: (jeu.phase === 'resultats_manche' || jeu.phase === 'fin_partie') ? calculerPodium() : [],
    trophees: (jeu.phase === 'fin_partie') ? calculerTrophees() : ((jeu.phase === 'qs_fin_partie') ? calculerTropheesQs() : []),
    historiqueManches: jeu.historiqueManches,
    statsGlobales: chargerScoresPersistants(),
    quicksplash: (jeu.mode === 'quicksplash' && jeu.phase !== 'lobby') ? {
      phase: jeu.phase,
      nbAmorcesValidees: jeu.qs.amorces ? jeu.qs.amorces.size : 0,
      nbJoueursTotal: connectes,
      amorceManche: jeu.qs.amorceManche ? {
        type: jeu.qs.amorceManche.type,
        texte: jeu.qs.amorceManche.texte
      } : null,
      tempsRestantEcriture: jeu.qs.tempsRestantEcriture || 0,
      dureeTotaleEcriture: DUREE_ECRITURE_QS_S,
      cartesPoseesEnDirect: jeu.qs.cartesEnAttente || [],
      reponsesAnonymes: (jeu.phase === 'qs_classement' || jeu.phase === 'qs_revelation' || jeu.phase === 'qs_fin_partie') ? jeu.qs.ordreMelangeReponses : [],
      nbClassesValides: jeu.qs.classements ? jeu.qs.classements.size : 0,
      resultatsManche: (jeu.phase === 'qs_revelation' || jeu.phase === 'qs_fin_partie') ? jeu.qs.scoresManche : null,
      podiumFinal: (jeu.phase === 'qs_fin_partie') ? calculerPodiumQs() : [],
      trophees: (jeu.phase === 'qs_fin_partie') ? calculerTropheesQs() : []
    } : null
  };
}

function diffuserEtat() {
  io.emit('etat', etatPublic());
}

function joueurDeSocket(socket) {
  const joueur = joueurs.get(socket.data.idJoueur);
  return joueur && joueur.socketId === socket.id ? joueur : null;
}

function estChef(joueur) {
  return Boolean(joueur) && joueur.id === jeu.chefId;
}

function retournerAuLobby() {
  clearTimeout(jeu.minuteur);
  jeu.minuteur = null;
  if (jeu.qs && jeu.qs.timerEcriture) {
    clearInterval(jeu.qs.timerEcriture);
    jeu.qs.timerEcriture = null;
  }
  jeu.qs = creerEtatInitialQuickSplash();
  jeu.phase = 'lobby';
  jeu.mancheActuelle = 0;
  jeu.themes = [];
  jeu.votes = new Map();
  jeu.annonce = null;
  jeu.themeChoisi = null;
  jeu.motsJoues = new Set();
  jeu.motsManche = [];
  jeu.votesReroll = new Set();
  jeu.rerollsRestants = 5;
  jeu.classements = new Map();
  jeu.ordreGroupe = [];
  jeu.debutDebat = null;
  jeu.jokersTotal = 0;
  jeu.jokersUtilises = new Set();
  jeu.scoresPartie = new Map();
  jeu.dernierResultatManche = null;
  jeu.historiqueManches = [];

  for (const j of joueursTries()) {
    if (!j.connecte) joueurs.delete(j.id);
  }
  if (!joueurs.has(jeu.chefId)) designerNouveauChef();
}

function reinitialiserSiVide() {
  if (joueurs.size === 0) {
    retournerAuLobby();
    jeu.nbManches = 4;
    jeu.chefId = null;
  }
}

// ---------------------------------------------------------------------
// Manche & Classement individuel
// ---------------------------------------------------------------------
function demarrerManche(numeroManche) {
  jeu.mancheActuelle = numeroManche;
  jeu.phase = 'classement';
  jeu.votesReroll = new Set();

  const theme = jeu.themes.find((t) => t.cle === jeu.themeChoisi);
  if (!theme) return;

  // Tirage sans doublon au sein de toute la partie
  const disponibles = theme.mots.filter((m) => !jeu.motsJoues.has(m));
  const selection = melanger(disponibles).slice(0, MOTS_PAR_MANCHE);
  for (const mot of selection) {
    jeu.motsJoues.add(mot);
  }
  jeu.motsManche = selection;

  jeu.classements = new Map();
  for (const j of joueurs.values()) {
    jeu.classements.set(j.id, {
      mots: melanger(selection),
      valide: false
    });
  }

  console.log('[MANCHE ' + numeroManche + '/' + jeu.nbManches + '] ' + theme.nom + ' : mots =', selection);

  for (const j of joueurs.values()) {
    if (j.connecte && j.socketId) {
      const s = io.sockets.sockets.get(j.socketId);
      if (s) {
        s.emit('monClassement', jeu.classements.get(j.id));
      }
    }
  }

  diffuserEtat();
}

// ---------------------------------------------------------------------
// Débat
// ---------------------------------------------------------------------
function demarrerDebat() {
  jeu.phase = 'debat';
  jeu.debutDebat = Date.now();
  jeu.capitaineId = jeu.chefId;
  jeu.ordreGroupe = melanger([...jeu.motsManche]);

  const cap = joueurs.get(jeu.capitaineId);
  console.log('[DÉBAT] Manche ' + jeu.mancheActuelle + ' - Capitaine :', cap ? cap.pseudo : 'aucun');

  for (const j of joueurs.values()) {
    if (j.connecte && j.socketId) {
      const s = io.sockets.sockets.get(j.socketId);
      if (s) {
        s.emit('monProfil', {
          idJoueur: j.id,
          jokerUtilise: jeu.jokersUtilises.has(j.id),
          estCapitaine: j.id === jeu.capitaineId
        });
      }
    }
  }

  diffuserEtat();
}

function verifierFinClassement() {
  if (jeu.phase !== 'classement') return;
  const attendus = nbConnectes();
  if (attendus > 0 && nbClasses() >= attendus) {
    console.log('[CLASSEMENT] Tous les joueurs ont validé leur classement !');
    jeu.phase = 'classement_termine';
    diffuserEtat();
    setTimeout(() => {
      demarrerDebat();
    }, 2200);
  }
}

// ---------------------------------------------------------------------
// Scoring & Résolution (Étape 6)
// ---------------------------------------------------------------------
function calculerScoresManche() {
  const ordreGroupe = jeu.ordreGroupe;
  const resultatManche = {
    numeroManche: jeu.mancheActuelle,
    ordreGroupe: ordreGroupe,
    joueurs: []
  };

  for (const j of joueurs.values()) {
    const cl = jeu.classements.get(j.id);
    const listeJoueur = (cl && Array.isArray(cl.mots)) ? cl.mots : [...ordreGroupe];
    let pointsGagnes = 0;
    const details = [];

    // Algorithme de distance (0 -> 3 pts, 1 -> 1 pt, 2+ -> 0 pt)
    for (let indexJ = 0; indexJ < listeJoueur.length; indexJ++) {
      const mot = listeJoueur[indexJ];
      const indexG = ordreGroupe.indexOf(mot);
      const distance = indexG >= 0 ? Math.abs(indexJ - indexG) : 99;
      let pts = 0;
      if (distance === 0) pts = 3;
      else if (distance === 1) pts = 1;
      else pts = 0;

      pointsGagnes += pts;
      details.push({
        mot,
        rangJoueur: indexJ + 1,
        rangGroupe: indexG + 1,
        distance,
        points: pts
      });
    }

    if (!jeu.scoresPartie.has(j.id)) {
      jeu.scoresPartie.set(j.id, { total: 0, parManche: [] });
    }
    const rec = jeu.scoresPartie.get(j.id);
    rec.total += pointsGagnes;
    rec.parManche.push(pointsGagnes);

    resultatManche.joueurs.push({
      id: j.id,
      pseudo: j.pseudo,
      avatar: j.avatar || '🍸',
      connecte: j.connecte,
      pointsManche: pointsGagnes,
      pointsTotal: rec.total,
      parManche: [...rec.parManche],
      details: details,
      listeJoueur: listeJoueur
    });
  }

  resultatManche.joueurs.sort((a, b) => b.pointsTotal - a.pointsTotal);
  jeu.dernierResultatManche = resultatManche;
  jeu.historiqueManches.push(resultatManche);
  jeu.phase = 'resultats_manche';

  console.log('[SCORING] Manche ' + jeu.mancheActuelle + ' terminée. Scores :',
    resultatManche.joueurs.map((j) => j.pseudo + ': +' + j.pointsManche + ' (total ' + j.pointsTotal + ')').join(', '));

  diffuserEtat();
}

function finaliserPartie() {
  jeu.phase = 'fin_partie';
  enregistrerScoresFinDePartie();
  console.log('[FIN DE PARTIE] Podium final :', calculerPodium().map((p) => '#' + p.rang + ' ' + p.pseudo + ' (' + p.total + ' pts)').join(', '));
  diffuserEtat();
}

// ---------------------------------------------------------------------
// Vote
// ---------------------------------------------------------------------
function resoudreVote() {
  if (jeu.phase !== 'vote') return;

  const comptes = {};
  for (const t of jeu.themes) comptes[t.cle] = 0;
  for (const cle of jeu.votes.values()) {
    if (cle in comptes) comptes[cle]++;
  }
  const maximum = Math.max(...Object.values(comptes));
  const candidats = Object.keys(comptes).filter((cle) => comptes[cle] === maximum);
  const gagnant = elementAleatoire(candidats);

  jeu.themeChoisi = gagnant;
  jeu.annonce = { cle: gagnant, egalite: candidats.length > 1, candidats: candidats, votes: comptes };
  jeu.phase = 'annonce';
  console.log('[VOTE] Thème choisi : ' + gagnant + (jeu.annonce.egalite ? ' (égalité tranchée au sort)' : ''));
  diffuserEtat();

  jeu.minuteur = setTimeout(() => {
    demarrerManche(1);
  }, jeu.annonce.egalite ? DUREE_ANNONCE_EGALITE : DUREE_ANNONCE);
}

function verifierFinVote() {
  if (jeu.phase !== 'vote') return;
  const attendus = nbConnectes();
  if (attendus > 0 && nbVotants() >= attendus) resoudreVote();
}

// =====================================================================
// MOTEUR DU MODE QUICK SPLASH
// =====================================================================

function demarrerPartieQuickSplash() {
  const connectes = nbConnectes();
  if (connectes < JOUEURS_MIN) return;

  for (const j of joueursTries()) {
    if (!j.connecte) joueurs.delete(j.id);
  }

  jeu.phase = 'qs_setup';
  jeu.nbManches = connectes;
  jeu.mancheActuelle = 0;
  jeu.qs = creerEtatInitialQuickSplash();

  for (const j of joueurs.values()) {
    jeu.qs.scoresCumules.set(j.id, 0);
  }

  console.log(`[QUICK SPLASH] Partie lancée avec ${connectes} joueurs pour ${jeu.nbManches} manches.`);
  diffuserEtat();
}

function enregistrerAmorceQs(idJoueur, data) {
  if (jeu.phase !== 'qs_setup') return;
  const j = joueurs.get(idJoueur);
  if (!j) return;

  const type = data.type === 'question' ? 'question' : 'trou';
  const texte = (data.texte || '').trim();
  if (texte.length < 3) return;

  jeu.qs.amorces.set(idJoueur, {
    idJoueur: j.id,
    auteurPseudo: j.pseudo,
    auteurAvatar: j.avatar,
    type: type,
    texte: texte
  });

  console.log(`[QUICK SPLASH] Amorce reçue de ${j.pseudo} (${type})`);
  diffuserEtat();

  const attendus = nbConnectes();
  if (jeu.qs.amorces.size >= attendus && attendus >= JOUEURS_MIN) {
    // Tous les joueurs ont validé leur amorce -> Mélange et démarrage Manche 1
    jeu.qs.amorcesPool = melanger(Array.from(jeu.qs.amorces.values()));
    demarrerMancheQuickSplash(1);
  }
}

function demarrerMancheQuickSplash(numManche) {
  if (jeu.qs.timerEcriture) {
    clearInterval(jeu.qs.timerEcriture);
    jeu.qs.timerEcriture = null;
  }

  jeu.mancheActuelle = numManche;
  jeu.phase = 'qs_ecriture';
  jeu.qs.reponses.clear();
  jeu.qs.classements.clear();
  jeu.qs.snipers.clear();
  jeu.qs.cartesEnAttente = [];
  jeu.qs.scoresManche = null;

  // Sélection de l'amorce
  let amorce = jeu.qs.amorcesPool[numManche - 1];
  if (!amorce) {
    // Si pas assez d'amorces (ex: joueur déconnecté), pioche automatique
    const donnees = chargerDonneesQuickSplash();
    const listeTrous = donnees.textesATrous || [];
    const amorceTexte = listeTrous.length > 0 ? elementAleatoire(listeTrous) : "La vie est belle avec ___";
    amorce = { idJoueur: '__AUTO__', auteurPseudo: 'Système', auteurAvatar: '✨', type: 'trou', texte: amorceTexte };
  }
  jeu.qs.amorceManche = amorce;

  console.log(`[QUICK SPLASH] Manche ${numManche}/${jeu.nbManches} démarrée. Amorce : "${amorce.texte}"`);

  // Minuteur de 45 secondes chrono
  jeu.qs.tempsRestantEcriture = DUREE_ECRITURE_QS_S;
  jeu.qs.timerEcriture = setInterval(() => {
    jeu.qs.tempsRestantEcriture--;
    if (jeu.qs.tempsRestantEcriture <= 0) {
      clearInterval(jeu.qs.timerEcriture);
      jeu.qs.timerEcriture = null;
      terminerEcritureQuickSplash();
    } else {
      io.emit('qsChronoTick', { tempsRestant: jeu.qs.tempsRestantEcriture });
    }
  }, 1000);

  diffuserEtat();
}

function enregistrerReponseQs(idJoueur, texteBrut) {
  if (jeu.phase !== 'qs_ecriture') return;
  const j = joueurs.get(idJoueur);
  if (!j) return;

  const texte = (texteBrut || '').trim() || 'Pas de reponse';
  jeu.qs.reponses.set(idJoueur, {
    id: 'rep_' + idJoueur,
    idJoueur: j.id,
    auteurPseudo: j.pseudo,
    auteurAvatar: j.avatar || '🍸',
    texte: texte,
    estBot: false
  });

  // Notifier la TV en direct : une carte s'envole et atterrit sur la télé !
  jeu.qs.cartesEnAttente.push({
    idJoueur: j.id,
    pseudo: j.pseudo,
    avatar: j.avatar || '🍸'
  });

  io.emit('qsNouvelleCartePosee', {
    pseudo: j.pseudo,
    avatar: j.avatar || '🍸',
    totalPosees: jeu.qs.cartesEnAttente.length,
    totalAttendus: nbConnectes()
  });

  console.log(`[QUICK SPLASH] Réponse reçue de ${j.pseudo} (${jeu.qs.reponses.size}/${nbConnectes()})`);
  diffuserEtat();

  if (jeu.qs.reponses.size >= nbConnectes()) {
    if (jeu.qs.timerEcriture) {
      clearInterval(jeu.qs.timerEcriture);
      jeu.qs.timerEcriture = null;
    }
    // Petit délai de 1.2s pour savourer la dernière carte posée
    setTimeout(() => {
      terminerEcritureQuickSplash();
    }, 1200);
  }
}

function terminerEcritureQuickSplash() {
  if (jeu.qs.timerEcriture) {
    clearInterval(jeu.qs.timerEcriture);
    jeu.qs.timerEcriture = null;
  }

  // Pour les joueurs connectés qui n'ont pas répondu à temps
  for (const j of joueurs.values()) {
    if (j.connecte && !jeu.qs.reponses.has(j.id)) {
      jeu.qs.reponses.set(j.id, {
        id: 'rep_' + j.id,
        idJoueur: j.id,
        auteurPseudo: j.pseudo,
        auteurAvatar: j.avatar || '🍸',
        texte: 'Panne d\'inspi totale',
        estBot: false
      });
    }
  }

  // Injection secrète du Bot Passe-Partout
  const donnees = chargerDonneesQuickSplash();
  const banquesBot = donnees.reponsesBot || ["La reponse D direct"];
  const texteBot = elementAleatoire(banquesBot);
  jeu.qs.reponseBot = {
    id: '__BOT__',
    idJoueur: '__BOT__',
    auteurPseudo: 'Bot Passe-Partout',
    auteurAvatar: '🤖',
    texte: texteBot,
    estBot: true
  };

  // Regroupement, anonymisation et mélange pour les smartphones
  const toutesReponses = Array.from(jeu.qs.reponses.values()).concat([jeu.qs.reponseBot]);
  jeu.qs.ordreMelangeReponses = melanger(toutesReponses.map((r) => ({
    id: r.id,
    texte: r.texte
  })));

  jeu.phase = 'qs_classement';
  console.log('[QUICK SPLASH] Écriture terminée. Réponses prêtes pour le classement SortableJS (avec le Bot secret).');
  diffuserEtat();
}

function enregistrerClassementQs(idJoueur, data) {
  if (jeu.phase !== 'qs_classement') return;
  const j = joueurs.get(idJoueur);
  if (!j) return;

  const ordre = Array.isArray(data.ordreIds) ? data.ordreIds : [];
  jeu.qs.classements.set(idJoueur, {
    ordreIds: ordre,
    valide: true
  });

  if (data.sniper && data.sniper.idReponse && data.sniper.idJoueurAccuse) {
    jeu.qs.snipers.set(idJoueur, {
      idReponse: data.sniper.idReponse,
      idJoueurAccuse: data.sniper.idJoueurAccuse
    });
    console.log(`[QUICK SPLASH] Sniper posé par ${j.pseudo} contre ${data.sniper.idJoueurAccuse}`);
  }

  diffuserEtat();

  if (jeu.qs.classements.size >= nbConnectes()) {
    resoudreMancheQuickSplash();
  }
}

function resoudreMancheQuickSplash() {
  if (jeu.phase !== 'qs_classement') return;
  jeu.phase = 'qs_revelation';

  const reponsesMap = new Map();
  for (const r of jeu.qs.reponses.values()) {
    reponsesMap.set(r.id, r);
  }
  if (jeu.qs.reponseBot) {
    reponsesMap.set(jeu.qs.reponseBot.id, jeu.qs.reponseBot);
  }

  const detailsManche = new Map();
  for (const j of joueurs.values()) {
    detailsManche.set(j.id, {
      idJoueur: j.id,
      pseudo: j.pseudo,
      avatar: j.avatar,
      ptsVotes: 0,
      malusBot: 0,
      ptsSniper: 0,
      totalManche: 0,
      piegeParBot: false,
      sniperSucces: null,
      estVictimeSniper: false,
      reponseTexte: (jeu.qs.reponses.get(j.id) || {}).texte || ''
    });
  }

  // 1. Points de classement (+3, +2, +1, ou +1.5 si auto-vote en #1)
  for (const [idVotant, vote] of jeu.qs.classements.entries()) {
    const ordre = vote.ordreIds || [];
    if (ordre[0]) {
      const rep1 = reponsesMap.get(ordre[0]);
      if (rep1 && !rep1.estBot && detailsManche.has(rep1.idJoueur)) {
        const estAutoVote = rep1.idJoueur === idVotant;
        const ptsGagnes = estAutoVote ? 1.5 : 3;
        detailsManche.get(rep1.idJoueur).ptsVotes += ptsGagnes;
        if (estAutoVote) {
          detailsManche.get(rep1.idJoueur).autoVoteTop1 = true;
        }
      }
    }
    if (ordre[1]) {
      const rep2 = reponsesMap.get(ordre[1]);
      if (rep2 && !rep2.estBot && detailsManche.has(rep2.idJoueur)) {
        detailsManche.get(rep2.idJoueur).ptsVotes += 2;
      }
    }
    if (ordre[2]) {
      const rep3 = reponsesMap.get(ordre[2]);
      if (rep3 && !rep3.estBot && detailsManche.has(rep3.idJoueur)) {
        detailsManche.get(rep3.idJoueur).ptsVotes += 1;
      }
    }

    // 2. Piège du Bot : si le bot est classé 1er ou 2ème (-2 pts)
    if (ordre[0] === '__BOT__' || ordre[1] === '__BOT__') {
      const infoVotant = detailsManche.get(idVotant);
      if (infoVotant) {
        infoVotant.malusBot -= 2;
        infoVotant.piegeParBot = true;
      }
    }
  }

  // 3. Résolution des Snipers (+2 sniper & -1 victime si correct, -1 sniper si faux)
  const accusationsList = [];
  for (const [idSniper, sniper] of jeu.qs.snipers.entries()) {
    const repCible = reponsesMap.get(sniper.idReponse);
    const sniperInfo = detailsManche.get(idSniper);
    const accuseJoueur = joueurs.get(sniper.idJoueurAccuse);

    if (repCible && sniperInfo && accuseJoueur) {
      const correct = repCible.idJoueur === sniper.idJoueurAccuse;
      if (correct) {
        sniperInfo.ptsSniper += 2;
        sniperInfo.sniperSucces = true;
        if (detailsManche.has(sniper.idJoueurAccuse)) {
          detailsManche.get(sniper.idJoueurAccuse).ptsSniper -= 1;
          detailsManche.get(sniper.idJoueurAccuse).estVictimeSniper = true;
        }
      } else {
        sniperInfo.ptsSniper -= 1;
        sniperInfo.sniperSucces = false;
      }

      accusationsList.push({
        sniperId: idSniper,
        sniperPseudo: (joueurs.get(idSniper) || {}).pseudo || '',
        idJoueurAccuse: sniper.idJoueurAccuse,
        pseudoAccuse: accuseJoueur.pseudo,
        correct: correct,
        reponseTexte: repCible.texte
      });
    }
  }

  // Totaux cumulés
  for (const d of detailsManche.values()) {
    d.totalManche = Math.round((d.ptsVotes + d.malusBot + d.ptsSniper) * 10) / 10;
    const cumul = Math.round(((jeu.qs.scoresCumules.get(d.idJoueur) || 0) + d.totalManche) * 10) / 10;
    jeu.qs.scoresCumules.set(d.idJoueur, cumul);
  }

  const reponsesRevelees = Array.from(reponsesMap.values()).map((r) => {
    let top1 = 0, top2 = 0, top3 = 0;
    let autoVoteTop1 = false;
    for (const [idVotant, v] of jeu.qs.classements.entries()) {
      if (v.ordreIds && v.ordreIds[0] === r.id) {
        top1++;
        if (r.idJoueur === idVotant) autoVoteTop1 = true;
      }
      if (v.ordreIds && v.ordreIds[1] === r.id) top2++;
      if (v.ordreIds && v.ordreIds[2] === r.id) top3++;
    }
    const ptsTop1 = autoVoteTop1
      ? Math.round(((top1 - 1) * 3 + 1.5) * 10) / 10
      : (top1 * 3);

    return {
      id: r.id,
      texte: r.texte,
      estBot: Boolean(r.estBot),
      auteurPseudo: r.estBot ? '🤖 Bot Passe-Partout' : (r.auteurPseudo || 'Anonyme'),
      auteurAvatar: r.estBot ? '🤖' : (r.auteurAvatar || '🍸'),
      top1, top2, top3,
      autoVoteTop1,
      ptsTop1,
      totalVotes: top1 + top2 + top3
    };
  });

  jeu.qs.scoresManche = {
    manche: jeu.mancheActuelle,
    totalManches: jeu.nbManches,
    amorce: jeu.qs.amorceManche,
    reponses: reponsesRevelees,
    botTexte: jeu.qs.reponseBot ? jeu.qs.reponseBot.texte : '',
    joueursPiegesParBot: Array.from(detailsManche.values()).filter((d) => d.piegeParBot).map((d) => d.pseudo),
    accusations: accusationsList,
    scoresJoueurs: Array.from(detailsManche.values()),
    classementCumule: Array.from(detailsManche.values()).map((d) => ({
      idJoueur: d.idJoueur,
      pseudo: d.pseudo,
      avatar: d.avatar,
      scoreManche: d.totalManche,
      scoreTotal: jeu.qs.scoresCumules.get(d.idJoueur) || 0
    })).sort((a, b) => b.scoreTotal - a.scoreTotal)
  };

  if (!jeu.qs.historiqueManches) jeu.qs.historiqueManches = [];
  jeu.qs.historiqueManches.push({
    manche: jeu.mancheActuelle,
    amorce: jeu.qs.amorceManche,
    reponses: reponsesRevelees,
    scoresJoueurs: Array.from(detailsManche.values()),
    accusations: accusationsList,
    joueursPiegesParBot: Array.from(detailsManche.values()).filter((d) => d.piegeParBot).map((d) => d.pseudo)
  });

  console.log(`[QUICK SPLASH] Manche ${jeu.mancheActuelle} résolue.`);
  diffuserEtat();
}

function calculerPodiumQs() {
  const liste = Array.from(joueurs.values()).map((j) => {
    const total = jeu.qs ? (jeu.qs.scoresCumules.get(j.id) || 0) : 0;
    return {
      id: j.id,
      pseudo: j.pseudo,
      avatar: j.avatar || '🍸',
      total: total,
      scoreTotal: total
    };
  }).sort((a, b) => b.total - a.total);

  let rangActuel = 1;
  return liste.map((j, idx) => {
    if (idx > 0 && j.total < liste[idx - 1].total) {
      rangActuel = idx + 1;
    }
    return {
      rang: rangActuel,
      id: j.id,
      pseudo: j.pseudo,
      avatar: j.avatar,
      total: j.total,
      scoreTotal: j.total
    };
  });
}

function calculerTropheesQs() {
  if (!jeu.qs || !Array.isArray(jeu.qs.historiqueManches)) return [];
  const trophees = [];

  const piegesParBot = new Map();     // id -> count
  const snipersReussis = new Map();   // id -> count
  const snipersRates = new Map();     // id -> count
  const punchlinesTop1 = new Map();   // id -> count
  const victimesSniper = new Map();   // id -> count

  for (const j of joueurs.values()) {
    piegesParBot.set(j.id, 0);
    snipersReussis.set(j.id, 0);
    snipersRates.set(j.id, 0);
    punchlinesTop1.set(j.id, 0);
    victimesSniper.set(j.id, 0);
  }

  for (const manche of jeu.qs.historiqueManches) {
    if (Array.isArray(manche.scoresJoueurs)) {
      for (const sj of manche.scoresJoueurs) {
        if (sj.piegeParBot) {
          piegesParBot.set(sj.idJoueur, (piegesParBot.get(sj.idJoueur) || 0) + 1);
        }
        if (sj.sniperSucces === true) {
          snipersReussis.set(sj.idJoueur, (snipersReussis.get(sj.idJoueur) || 0) + 1);
        } else if (sj.sniperSucces === false) {
          snipersRates.set(sj.idJoueur, (snipersRates.get(sj.idJoueur) || 0) + 1);
        }
        if (sj.estVictimeSniper) {
          victimesSniper.set(sj.idJoueur, (victimesSniper.get(sj.idJoueur) || 0) + 1);
        }
      }
    }
    if (Array.isArray(manche.reponses)) {
      for (const r of manche.reponses) {
        if (!r.estBot && r.top1 > 0) {
          const jTrouve = Array.from(joueurs.values()).find((j) => j.pseudo === r.auteurPseudo);
          if (jTrouve) {
            punchlinesTop1.set(jTrouve.id, (punchlinesTop1.get(jTrouve.id) || 0) + r.top1);
          }
        }
      }
    }
  }

  // 1. Pigeon du Bot (-2 pts par piège)
  let maxPieges = 0;
  let pigeons = [];
  for (const [id, count] of piegesParBot.entries()) {
    if (count > maxPieges) {
      maxPieges = count;
      pigeons = [id];
    } else if (count === maxPieges && maxPieges > 0) {
      pigeons.push(id);
    }
  }
  if (maxPieges > 0) {
    const pseudos = pigeons.map((id) => (joueurs.get(id) ? joueurs.get(id).pseudo : '')).filter(Boolean).join(', ');
    trophees.push({
      icone: '🤖',
      titre: 'Le Pigeon du Bot',
      desc: `Piégé ${maxPieges} fois en mettant le bot dans son Top 2 (-${maxPieges * 2} pts)`,
      pseudos: pseudos
    });
  } else {
    trophees.push({
      icone: '🛡️',
      titre: 'Imperméable aux Robots',
      desc: "Personne n'a mis le bot dans son Top 2 ! Zéro piège mordu 👏",
      pseudos: 'Tous les joueurs'
    });
  }

  // 2. Le Roi de la Punchline (#1 des votes)
  let maxTop1 = 0;
  let punchliners = [];
  for (const [id, count] of punchlinesTop1.entries()) {
    if (count > maxTop1) {
      maxTop1 = count;
      punchliners = [id];
    } else if (count === maxTop1 && maxTop1 > 0) {
      punchliners.push(id);
    }
  }
  if (maxTop1 > 0) {
    const pseudos = punchliners.map((id) => (joueurs.get(id) ? joueurs.get(id).pseudo : '')).filter(Boolean).join(', ');
    trophees.push({
      icone: '👑',
      titre: 'Le Roi de la Punchline',
      desc: `Élu ${maxTop1} fois meilleure réponse de la table (#1) !`,
      pseudos: pseudos
    });
  }

  // 3. Sniper d'Élite (+2 pts)
  let maxSnipers = 0;
  let snipers = [];
  for (const [id, count] of snipersReussis.entries()) {
    if (count > maxSnipers) {
      maxSnipers = count;
      snipers = [id];
    } else if (count === maxSnipers && maxSnipers > 0) {
      snipers.push(id);
    }
  }
  if (maxSnipers > 0) {
    const pseudos = snipers.map((id) => (joueurs.get(id) ? joueurs.get(id).pseudo : '')).filter(Boolean).join(', ');
    trophees.push({
      icone: '🎯',
      titre: "L'Œil de Lynx",
      desc: `${maxSnipers} accusation(s) sniper réussie(s) (+${maxSnipers * 2} pts empochés) !`,
      pseudos: pseudos
    });
  }

  // 4. Le Paranoïaque (-1 pt)
  let maxRates = 0;
  let paranos = [];
  for (const [id, count] of snipersRates.entries()) {
    if (count > maxRates) {
      maxRates = count;
      paranos = [id];
    } else if (count === maxRates && maxRates > 0) {
      paranos.push(id);
    }
  }
  if (maxRates > 0) {
    const pseudos = paranos.map((id) => (joueurs.get(id) ? joueurs.get(id).pseudo : '')).filter(Boolean).join(', ');
    trophees.push({
      icone: '🤡',
      titre: 'Le Paranoïaque',
      desc: `${maxRates} fausse(s) accusation(s) sniper dans le vent (-${maxRates} pt) !`,
      pseudos: pseudos
    });
  }

  // 5. L'Arnaqueur Démasqué
  let maxVictimes = 0;
  let victimes = [];
  for (const [id, count] of victimesSniper.entries()) {
    if (count > maxVictimes) {
      maxVictimes = count;
      victimes = [id];
    } else if (count === maxVictimes && maxVictimes > 0) {
      victimes.push(id);
    }
  }
  if (maxVictimes > 0) {
    const pseudos = victimes.map((id) => (joueurs.get(id) ? joueurs.get(id).pseudo : '')).filter(Boolean).join(', ');
    trophees.push({
      icone: '🕶️',
      titre: "L'Arnaqueur Démasqué",
      desc: `Identifié et grillé ${maxVictimes} fois par les snipers adverses !`,
      pseudos: pseudos
    });
  }

  return trophees;
}

function finaliserPartieQuickSplash() {
  jeu.phase = 'qs_fin_partie';
  const podium = calculerPodiumQs();
  console.log('[QUICK SPLASH FIN] Podium final :', podium.map((p) => '#' + p.rang + ' ' + p.pseudo + ' (' + p.total + ' pts)').join(', '));
  diffuserEtat();
}

// =====================================================================
// TEMPS RÉEL
// =====================================================================
io.on('connection', (socket) => {
  console.log('[+] Client connecté : ' + socket.id);

  socket.emit('etat', etatPublic());

  // -------------------------------------------------------------------
  // Rejoindre la partie
  // -------------------------------------------------------------------
  socket.on('rejoindre', (data, reponse) => {
    if (typeof reponse !== 'function') return;
    const pseudo = nettoyerPseudo(data && data.pseudo);
    const idConnu = data && typeof data.idJoueur === 'string' ? data.idJoueur : null;

    if (pseudo.length < PSEUDO_MIN) {
      return reponse({ ok: false, erreur: 'Pseudo trop court (min. ' + PSEUDO_MIN + ' caractères).' });
    }

    let joueur = idConnu ? joueurs.get(idConnu) : null;

    if (joueur) {
      const memePseudo = joueur.pseudo.toLowerCase() === pseudo.toLowerCase();
      if (!memePseudo) {
        if (jeu.phase !== 'lobby') {
          return reponse({ ok: false, erreur: 'Partie en cours : tu ne peux pas changer de pseudo.' });
        }
        if (pseudoDejaPris(pseudo, joueur.id)) {
          return reponse({ ok: false, erreur: 'Ce pseudo est déjà utilisé.' });
        }
        joueur.pseudo = pseudo;
      }
    } else {
      if (jeu.phase !== 'lobby') {
        return reponse({ ok: false, erreur: 'Une partie est déjà en cours.' });
      }
      if (pseudoDejaPris(pseudo, null)) {
        return reponse({ ok: false, erreur: 'Ce pseudo est déjà utilisé.' });
      }
      if (joueurs.size >= JOUEURS_MAX) {
        return reponse({ ok: false, erreur: 'La partie est pleine (' + JOUEURS_MAX + ' joueurs max).' });
      }
      joueur = {
        id: crypto.randomUUID(),
        pseudo: pseudo,
        avatar: AVATARS_SOIREE_DEFAUT[compteurOrdre % AVATARS_SOIREE_DEFAUT.length],
        socketId: null,
        connecte: false,
        ordre: ++compteurOrdre
      };
      joueurs.set(joueur.id, joueur);
    }

    joueur.socketId = socket.id;
    joueur.connecte = true;
    socket.data.idJoueur = joueur.id;

    if (!jeu.chefId || !joueurs.has(jeu.chefId) || !joueurs.get(jeu.chefId).connecte) {
      jeu.chefId = joueur.id;
      jeu.capitaineId = joueur.id;
    }

    console.log('[JOUEUR] ' + joueur.pseudo + ' (' + (joueur.avatar || '🍸') + ') a rejoint' + (estChef(joueur) ? ' (chef)' : ''));
    reponse({
      ok: true,
      idJoueur: joueur.id,
      pseudo: joueur.pseudo,
      avatar: joueur.avatar,
      monVote: jeu.phase === 'vote' ? jeu.votes.get(joueur.id) || null : null
    });

    if (jeu.phase !== 'lobby' && jeu.phase !== 'vote' && jeu.phase !== 'annonce') {
      const cl = jeu.classements.get(joueur.id);
      if (cl) socket.emit('monClassement', cl);

      socket.emit('monProfil', {
        idJoueur: joueur.id,
        jokerUtilise: jeu.jokersUtilises.has(joueur.id),
        estCapitaine: joueur.id === jeu.capitaineId
      });
    }

    diffuserEtat();
  });

  // -------------------------------------------------------------------
  // Personnalisation d'avatar de soirée
  // -------------------------------------------------------------------
  socket.on('changerAvatar', (nouvelAvatar, reponse) => {
    const cb = typeof reponse === 'function' ? reponse : () => {};
    const idJoueur = socket.data && socket.data.idJoueur;
    if (!idJoueur || !joueurs.has(idJoueur)) {
      return cb({ ok: false, erreur: 'Joueur non trouvé.' });
    }
    const joueur = joueurs.get(idJoueur);
    if (typeof nouvelAvatar === 'string' && nouvelAvatar.trim().length > 0) {
      joueur.avatar = nouvelAvatar.trim().slice(0, 4);
      console.log('[AVATAR] ' + joueur.pseudo + ' a choisi : ' + joueur.avatar);
      diffuserEtat();
      return cb({ ok: true, avatar: joueur.avatar });
    }
    return cb({ ok: false, erreur: 'Avatar invalide.' });
  });

  // -------------------------------------------------------------------
  // Réglages & Lancement
  // -------------------------------------------------------------------
  socket.on('reglerManches', (nb) => {
    const joueur = joueurDeSocket(socket);
    if (!estChef(joueur) || jeu.phase !== 'lobby') return;
    if (OPTIONS_MANCHES.includes(nb)) {
      jeu.nbManches = nb;
      diffuserEtat();
    }
  });

  socket.on('changerMode', (nouveauMode, reponse) => {
    const repondre = typeof reponse === 'function' ? reponse : () => {};
    if (jeu.phase !== 'lobby') {
      return repondre({ ok: false, erreur: 'Le mode de jeu ne peut être changé que dans le lobby.' });
    }
    if (nouveauMode === 'priorities' || nouveauMode === 'quicksplash') {
      jeu.mode = nouveauMode;
    } else {
      jeu.mode = (jeu.mode === 'quicksplash') ? 'priorities' : 'quicksplash';
    }
    console.log('[MODE] Bascule du mode de jeu vers :', jeu.mode);
    diffuserEtat();
    repondre({ ok: true, mode: jeu.mode });
  });

  socket.on('lancerPartie', (reponse) => {
    const repondre = typeof reponse === 'function' ? reponse : () => {};
    const joueur = joueurDeSocket(socket);
    if (!estChef(joueur) || jeu.phase !== 'lobby') return;
    if (!etatPublic().peutLancer) return;

    if (jeu.mode === 'quicksplash') {
      demarrerPartieQuickSplash();
      return repondre({ ok: true });
    }

    const themes = preparerThemes(chargerThemes(), jeu.nbManches);
    if (themes.length === 0) {
      return repondre({ ok: false, erreur: 'Aucun thème utilisable dans data/themes.json.' });
    }

    for (const j of joueursTries()) {
      if (!j.connecte) joueurs.delete(j.id);
    }
    jeu.themes = themes;
    jeu.votes = new Map();
    jeu.annonce = null;
    jeu.themeChoisi = null;
    jeu.motsJoues = new Set();
    jeu.motsManche = [];
    jeu.classements = new Map();
    jeu.ordreGroupe = [];
    jeu.debutDebat = null;
    jeu.jokersTotal = joueurs.size;
    jeu.jokersUtilises = new Set();
    jeu.scoresPartie = new Map();
    jeu.dernierResultatManche = null;
    jeu.historiqueManches = [];
    jeu.mancheActuelle = 0;
    jeu.capitaineId = jeu.chefId;
    jeu.rerollsRestants = 5;
    jeu.phase = 'vote';

    console.log('[PARTIE] Lancée avec ' + joueurs.size + ' joueurs (' + jeu.jokersTotal + ' jokers), ' +
      jeu.nbManches + ' manches');
    repondre({ ok: true });
    diffuserEtat();
  });

  // -------------------------------------------------------------------
  // Vote
  // -------------------------------------------------------------------
  socket.on('voter', (cle, reponse) => {
    const joueur = joueurDeSocket(socket);
    if (!joueur || jeu.phase !== 'vote') return;
    if (!jeu.themes.some((t) => t.cle === cle)) return;

    jeu.votes.set(joueur.id, cle);
    if (typeof reponse === 'function') reponse({ ok: true, monVote: cle });
    diffuserEtat();
    verifierFinVote();
  });

  socket.on('cloturerVote', () => {
    const joueur = joueurDeSocket(socket);
    if (!estChef(joueur) || jeu.phase !== 'vote') return;
    if (jeu.votes.size === 0) return;
    resoudreVote();
  });

  // -------------------------------------------------------------------
  // Classement individuel
  // -------------------------------------------------------------------
  socket.on('ordonnerMots', (nouvelOrdre) => {
    const joueur = joueurDeSocket(socket);
    if (!joueur) return;
    const cl = jeu.classements.get(joueur.id);
    if (!cl || cl.valide) return;

    if (Array.isArray(nouvelOrdre) && nouvelOrdre.length === MOTS_PAR_MANCHE) {
      const ensembleMots = new Set(jeu.motsManche);
      if (nouvelOrdre.every((m) => ensembleMots.has(m))) {
        cl.mots = nouvelOrdre;
      }
    }
  });

  socket.on('validerClassement', () => {
    const joueur = joueurDeSocket(socket);
    if (!joueur || jeu.phase !== 'classement') return;
    const cl = jeu.classements.get(joueur.id);
    if (!cl || cl.valide) return;

    cl.valide = true;
    console.log('[CLASSEMENT] ' + joueur.pseudo + ' a validé son classement');
    socket.emit('monClassement', cl);
    diffuserEtat();
    verifierFinClassement();
  });

  socket.on('cloturerClassement', () => {
    const joueur = joueurDeSocket(socket);
    if (!estChef(joueur) || jeu.phase !== 'classement') return;
    for (const j of joueurs.values()) {
      const cl = jeu.classements.get(j.id);
      if (cl && !cl.valide) cl.valide = true;
    }
    verifierFinClassement();
  });

  // -------------------------------------------------------------------
  // Enregistrement de l'écran TV (pour modération directe depuis la TV)
  // -------------------------------------------------------------------
  socket.on('enregistrerTv', () => {
    socket.data.estTv = true;
  });

  // -------------------------------------------------------------------
  // Vote pour changer les mots de la manche (Reroll - max 5 par partie)
  // -------------------------------------------------------------------
  socket.on('voterRerollMots', (repondre) => {
    const cb = typeof repondre === 'function' ? repondre : () => {};
    const joueur = joueurDeSocket(socket);
    if (!joueur || jeu.phase !== 'classement') return cb({ ok: false });

    if (jeu.rerollsRestants <= 0) {
      return cb({ ok: false, erreur: 'Limite de 5 changements de mots atteinte pour cette partie !' });
    }

    if (!jeu.votesReroll) jeu.votesReroll = new Set();

    if (jeu.votesReroll.has(joueur.id)) {
      jeu.votesReroll.delete(joueur.id);
      console.log('[REROLL] ' + joueur.pseudo + ' a retiré son vote');
    } else {
      jeu.votesReroll.add(joueur.id);
      console.log('[REROLL] ' + joueur.pseudo + ' a voté pour changer les mots');
    }

    const connectes = Array.from(joueurs.values()).filter((j) => j.connecte);
    const totalConnectes = connectes.length;
    const seuilRequis = Math.floor(totalConnectes / 2) + 1;

    if (jeu.votesReroll.size >= seuilRequis) {
      jeu.rerollsRestants = Math.max(0, jeu.rerollsRestants - 1);
      console.log('[REROLL] Majorité atteinte (' + jeu.votesReroll.size + '/' + totalConnectes + ') -> Changement des mots ! (Restants : ' + jeu.rerollsRestants + ')');
      const theme = jeu.themes.find((t) => t.cle === jeu.themeChoisi);
      if (theme) {
        let disponibles = theme.mots.filter((m) => !jeu.motsJoues.has(m));
        if (disponibles.length < MOTS_PAR_MANCHE) {
          const enCours = new Set(jeu.motsManche);
          disponibles = theme.mots.filter((m) => !enCours.has(m));
        }
        const nouvelleSelection = melanger(disponibles).slice(0, MOTS_PAR_MANCHE);
        for (const mot of nouvelleSelection) {
          jeu.motsJoues.add(mot);
        }
        jeu.motsManche = nouvelleSelection;

        for (const j of joueurs.values()) {
          jeu.classements.set(j.id, {
            mots: melanger(nouvelleSelection),
            valide: false
          });
          if (j.connecte && j.socketId) {
            const s = io.sockets.sockets.get(j.socketId);
            if (s) {
              s.emit('monClassement', jeu.classements.get(j.id));
            }
          }
        }
        jeu.votesReroll.clear();
        io.emit('motsRerolles', {
          message: '🎲 Les 5 mots ont été changés ! (' + jeu.rerollsRestants + ' restant' + (jeu.rerollsRestants > 1 ? 's' : '') + ')'
        });
      }
    }

    diffuserEtat();
    return cb({ ok: true, vote: jeu.votesReroll.has(joueur.id) });
  });

  // -------------------------------------------------------------------
  // Gestion des joueurs (Chef & TV)
  // -------------------------------------------------------------------
  socket.on('nommerChef', (nouveauChefId, repondre) => {
    const cb = typeof repondre === 'function' ? repondre : () => {};
    const joueur = joueurDeSocket(socket);
    const estAutorise = (joueur && joueur.id === jeu.chefId) || Boolean(socket.data && socket.data.estTv);
    if (!estAutorise) {
      return cb({ ok: false, erreur: 'Action réservée au chef ou à la TV.' });
    }
    const cible = joueurs.get(nouveauChefId);
    if (!cible || !cible.connecte) {
      return cb({ ok: false, erreur: 'Joueur introuvable ou déconnecté.' });
    }
    jeu.chefId = cible.id;
    if (jeu.phase === 'debat') {
      jeu.capitaineId = cible.id;
    }
    const initiateur = joueur ? joueur.pseudo : 'TV';
    console.log('[CHEF] Rôle de chef transféré par ' + initiateur + ' à : ' + cible.pseudo);
    diffuserEtat();
    return cb({ ok: true, nouveauChefPseudo: cible.pseudo });
  });

  socket.on('kickerJoueur', (cibleId, repondre) => {
    const cb = typeof repondre === 'function' ? repondre : () => {};
    const joueur = joueurDeSocket(socket);
    const estAutorise = (joueur && joueur.id === jeu.chefId) || Boolean(socket.data && socket.data.estTv);
    if (!estAutorise) {
      return cb({ ok: false, erreur: 'Action réservée au chef ou à la TV.' });
    }
    if (joueur && cibleId === joueur.id) {
      return cb({ ok: false, erreur: 'Tu ne peux pas t\'expulser toi-même.' });
    }
    const cible = joueurs.get(cibleId);
    if (!cible) {
      return cb({ ok: false, erreur: 'Joueur introuvable.' });
    }

    const initiateur = joueur ? joueur.pseudo : 'la TV';
    console.log('[MODÉRATION] ' + initiateur + ' a expulsé le joueur : ' + cible.pseudo);

    if (cible.socketId) {
      const sCible = io.sockets.sockets.get(cible.socketId);
      if (sCible) {
        sCible.emit('kicke', 'Tu as été expulsé de la partie par ' + initiateur + '.');
        sCible.disconnect(true);
      }
    }

    const etaitChef = (cible.id === jeu.chefId);

    joueurs.delete(cible.id);
    jeu.votes.delete(cible.id);
    if (jeu.votesReroll) jeu.votesReroll.delete(cible.id);
    if (jeu.classements) jeu.classements.delete(cible.id);

    if (etaitChef) {
      designerNouveauChef();
    }

    if (jeu.phase === 'classement') {
      verifierFinClassement();
    }

    reinitialiserSiVide();
    diffuserEtat();
    return cb({ ok: true, kickePseudo: cible.pseudo });
  });

  // -------------------------------------------------------------------
  // Débat : Capitaine & Joker secret
  // -------------------------------------------------------------------
  socket.on('ordonnerGroupe', (nouvelOrdre) => {
    const joueur = joueurDeSocket(socket);
    if (!joueur || joueur.id !== jeu.capitaineId || jeu.phase !== 'debat') return;

    if (Array.isArray(nouvelOrdre) && nouvelOrdre.length === MOTS_PAR_MANCHE) {
      const ensembleMots = new Set(jeu.motsManche);
      if (nouvelOrdre.every((m) => ensembleMots.has(m))) {
        jeu.ordreGroupe = nouvelOrdre;
        io.emit('ordreGroupeMaj', jeu.ordreGroupe);
      }
    }
  });

  socket.on('validerGroupe', () => {
    const joueur = joueurDeSocket(socket);
    if (!joueur || joueur.id !== jeu.capitaineId || jeu.phase !== 'debat') return;

    console.log('[DÉBAT] Classement du groupe validé par ' + joueur.pseudo + ' :', jeu.ordreGroupe);
    jeu.phase = 'debat_termine';
    diffuserEtat();

    // Transition vers les résultats et le scoring de la manche
    setTimeout(() => {
      calculerScoresManche();
    }, 1800);
  });

  // -------------------------------------------------------------------
  // Mini-réactions en direct pendant le débat
  // -------------------------------------------------------------------
  socket.on('reactionDebat', (data) => {
    if (jeu.phase !== 'debat') return;
    const joueur = joueurDeSocket(socket);
    if (!joueur) return;

    const emoji = typeof data === 'object' && data.emoji ? String(data.emoji).slice(0, 4) : '🔥';
    const texte = typeof data === 'object' && data.texte ? String(data.texte).slice(0, 30) : '';

    io.emit('reactionDebatAffichee', {
      pseudo: joueur.pseudo,
      avatar: joueur.avatar || '🍸',
      emoji: emoji,
      texte: texte
    });
  });

  socket.on('utiliserJoker', (reponse) => {
    const repondre = typeof reponse === 'function' ? reponse : () => {};
    const joueur = joueurDeSocket(socket);
    if (!joueur || jeu.phase !== 'debat') {
      return repondre({ ok: false, erreur: 'Le débat n\'est pas en cours.' });
    }
    if (jeu.jokersUtilises.has(joueur.id)) {
      return repondre({ ok: false, erreur: 'Tu as déjà utilisé ton joker pour cette partie.' });
    }
    const tempsEcoule = Date.now() - (jeu.debutDebat || 0);
    if (tempsEcoule > DUREE_JOKER_MS) {
      return repondre({ ok: false, erreur: 'Le délai de 2 minutes pour utiliser le joker est expiré.' });
    }

    jeu.jokersUtilises.add(joueur.id);
    const cl = jeu.classements.get(joueur.id);
    if (cl) {
      cl.valide = false;
    }

    console.log('[JOKER] ' + joueur.pseudo + ' a activé son joker !');
    repondre({ ok: true });
    socket.emit('monClassement', cl);
    socket.emit('monProfil', {
      idJoueur: joueur.id,
      jokerUtilise: true,
      estCapitaine: joueur.id === jeu.capitaineId
    });

    diffuserEtat();
  });

  socket.on('validerJoker', (nouvelOrdre, reponse) => {
    const repondre = typeof reponse === 'function' ? reponse : () => {};
    const joueur = joueurDeSocket(socket);
    if (!joueur || jeu.phase !== 'debat') {
      return repondre({ ok: false, erreur: 'Le débat n\'est pas en cours.' });
    }
    const cl = jeu.classements.get(joueur.id);
    if (!cl) return repondre({ ok: false, erreur: 'Classement introuvable.' });

    if (!Array.isArray(nouvelOrdre) || nouvelOrdre.length !== MOTS_PAR_MANCHE) {
      return repondre({ ok: false, erreur: 'Classement incomplet.' });
    }
    const ensembleMots = new Set(jeu.motsManche);
    if (!nouvelOrdre.every((m) => ensembleMots.has(m))) {
      return repondre({ ok: false, erreur: 'Mots non valides.' });
    }

    // Règle Chef / Capitaine : interdiction formelle de copier à 100% l'ordre actuel du groupe
    const estChefOuCapitaine = joueur.id === jeu.chefId || joueur.id === jeu.capitaineId;
    if (estChefOuCapitaine && Array.isArray(jeu.ordreGroupe) && jeu.ordreGroupe.length === MOTS_PAR_MANCHE) {
      const identiqueAuGroupe = nouvelOrdre.every((m, idx) => m === jeu.ordreGroupe[idx]);
      if (identiqueAuGroupe) {
        return repondre({
          ok: false,
          erreur: '👑 En tant que chef, tu n\'as pas le droit de copier exactement le classement du groupe avec ton joker ! Il doit y avoir au moins 1 différence.'
        });
      }
    }

    cl.mots = nouvelOrdre;
    cl.valide = true;
    console.log('[JOKER] ' + joueur.pseudo + ' a validé son nouveau classement secret.');
    socket.emit('monClassement', cl);
    repondre({ ok: true });
  });

  // -------------------------------------------------------------------
  // Enchaînement des manches & Fin de partie (Étape 6)
  // -------------------------------------------------------------------
  socket.on('mancheSuivante', () => {
    const joueur = joueurDeSocket(socket);
    if (!estChef(joueur) || jeu.phase !== 'resultats_manche') {
      console.warn('[MANCHE] Ignoré : chef requis. pseudo=' + (joueur ? joueur.pseudo : 'inconnu') + ', phase=' + jeu.phase);
      return;
    }
    console.log('[MANCHE] Manche suivante déclenchée par le chef ' + joueur.pseudo);
    if (jeu.mancheActuelle < jeu.nbManches) {
      demarrerManche(jeu.mancheActuelle + 1);
    } else {
      finaliserPartie();
    }
  });

  socket.on('terminerPartie', () => {
    const joueur = joueurDeSocket(socket);
    if (!estChef(joueur) || jeu.phase !== 'resultats_manche') return;
    console.log('[PARTIE] Fin de partie demandée par le chef ' + joueur.pseudo);
    finaliserPartie();
  });

  // -------------------------------------------------------------------
  // Retour au lobby
  // -------------------------------------------------------------------
  socket.on('retourLobby', (reponse) => {
    const cb = typeof reponse === 'function' ? reponse : () => {};
    const joueur = joueurDeSocket(socket);
    const estAutorise = (joueur && joueur.id === jeu.chefId) || Boolean(socket.data && socket.data.estTv);
    if (!estAutorise) {
      console.warn('[LOBBY] Ignoré : chef ou TV requis.');
      return cb({ ok: false, erreur: 'Action réservée au chef de partie ou à la TV.' });
    }
    const initiateur = joueur ? joueur.pseudo : 'Écran TV';
    console.log('[LOBBY] Retour au lobby demandé par ' + initiateur);
    retournerAuLobby();
    diffuserEtat();
    cb({ ok: true });
  });

  // -------------------------------------------------------------------
  // Mode Quick Splash
  // -------------------------------------------------------------------
  socket.on('qsSoumettreAmorce', (data, reponse) => {
    const repondre = typeof reponse === 'function' ? reponse : () => {};
    const joueur = joueurDeSocket(socket);
    if (!joueur || jeu.phase !== 'qs_setup') {
      return repondre({ ok: false, erreur: 'Action non autorisée actuellement.' });
    }
    enregistrerAmorceQs(joueur.id, data || {});
    repondre({ ok: true });
  });

  socket.on('qsSoumettreReponse', (texte, reponse) => {
    const repondre = typeof reponse === 'function' ? reponse : () => {};
    const joueur = joueurDeSocket(socket);
    if (!joueur || jeu.phase !== 'qs_ecriture') {
      return repondre({ ok: false, erreur: 'Le temps de réponse est écoulé.' });
    }
    enregistrerReponseQs(joueur.id, texte);
    repondre({ ok: true });
  });

  socket.on('qsValiderClassement', (data, reponse) => {
    const repondre = typeof reponse === 'function' ? reponse : () => {};
    const joueur = joueurDeSocket(socket);
    if (!joueur || jeu.phase !== 'qs_classement') {
      return repondre({ ok: false, erreur: 'Classement non autorisé actuellement.' });
    }
    enregistrerClassementQs(joueur.id, data || {});
    repondre({ ok: true });
  });

  socket.on('qsMancheSuivante', () => {
    const joueur = joueurDeSocket(socket);
    if (!estChef(joueur) || jeu.phase !== 'qs_revelation') return;
    if (jeu.mancheActuelle < jeu.nbManches) {
      demarrerMancheQuickSplash(jeu.mancheActuelle + 1);
    } else {
      finaliserPartieQuickSplash();
    }
  });

  socket.on('qsTerminerPartie', () => {
    const joueur = joueurDeSocket(socket);
    if (!estChef(joueur)) return;
    finaliserPartieQuickSplash();
  });

  // -------------------------------------------------------------------
  // Déconnexion
  // -------------------------------------------------------------------
  socket.on('disconnect', () => {
    console.log('[-] Client déconnecté : ' + socket.id);
    let joueur = socket.data && socket.data.idJoueur ? joueurs.get(socket.data.idJoueur) : null;
    if (!joueur) {
      joueur = Array.from(joueurs.values()).find((j) => j.socketId === socket.id);
    }
    if (!joueur) return;

    joueur.connecte = false;
    console.log('[JOUEUR] ' + joueur.pseudo + ' est déconnecté');

    // Transmission immédiate et inconditionnelle de la couronne au joueur suivant connecté si le chef est parti
    const chefActuel = joueurs.get(jeu.chefId);
    if (!chefActuel || !chefActuel.connecte || jeu.chefId === joueur.id) {
      designerNouveauChef();
    }

    if (jeu.phase === 'lobby') {
      setTimeout(() => {
        const actuel = joueurs.get(joueur.id);
        if (actuel && !actuel.connecte && jeu.phase === 'lobby') {
          joueurs.delete(actuel.id);
          const chefRestant = joueurs.get(jeu.chefId);
          if (!chefRestant || !chefRestant.connecte) {
            designerNouveauChef();
          }
          reinitialiserSiVide();
          diffuserEtat();
        }
      }, DELAI_GRACE_LOBBY);
    }

    diffuserEtat();
    verifierFinVote();
    verifierFinClassement();
  });
});

// ---------------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------------
serveur.listen(PORT, '0.0.0.0', () => {
  const themes = chargerThemes();
  console.log('==============================================');
  console.log(' Priorities - serveur démarré');
  console.log(' Joueurs (téléphones) : http://' + trouverIpLocale() + ':' + PORT);
  console.log(' Écran TV (PC)        : http://localhost:' + PORT + '/tv');
  console.log('----------------------------------------------');
  for (const cle of Object.keys(themes)) {
    const nb = themes[cle].mots ? themes[cle].mots.length + ' mots' : 'thème spécial';
    console.log(' Thème "' + cle + '" : ' + nb);
  }
  console.log('==============================================');

  // Ouverture automatique de la page TV dans le navigateur par défaut
  const urlTV = 'http://localhost:' + PORT + '/tv';
  const commandeOuverture = process.platform === 'win32'
    ? `start ${urlTV}`
    : process.platform === 'darwin'
      ? `open ${urlTV}`
      : `xdg-open ${urlTV}`;
  exec(commandeOuverture, (err) => {
    if (err) {
      console.log('[NAVIGATEUR] Note : Impossible d\'ouvrir automatiquement le navigateur :', err.message);
    } else {
      console.log('[NAVIGATEUR] Écran TV ouvert automatiquement dans le navigateur.');
    }
  });
});
