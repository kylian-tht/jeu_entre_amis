// =====================================================
// commun.js - Fonctions partagées par le téléphone et la TV
// (affichage des thèmes, annonce du thème gagnant, roulette)
// =====================================================

let minuteurRoulette = null;

// Crée un petit élément HTML avec une classe et un texte (textContent = sûr)
function creerElement(balise, classe, texte) {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  if (texte !== undefined) el.textContent = texte;
  return el;
}

// Carte d'un thème (utilisée pour le vote sur téléphone et sur la TV)
// Le thème hardcore est rouge avec un panneau d'avertissement.
function creerCarteTheme(theme, tag) {
  const carte = creerElement(tag || 'div', 'carte-theme' + (theme.hardcore ? ' hardcore' : ''));
  carte.appendChild(creerElement('span', 'carte-emoji', theme.emoji));
  const texte = creerElement('span', 'carte-texte');
  texte.appendChild(creerElement('span', 'carte-nom', theme.nom));
  texte.appendChild(creerElement('span', 'carte-desc', theme.description));
  if (theme.hardcore) {
    texte.appendChild(creerElement('span', 'carte-alerte', '⚠️ HARDCORE – public averti, pas pour les enfants'));
  }
  carte.appendChild(texte);
  return carte;
}

// Texte récapitulatif "💸 2 · 🚩 2" des votes reçus
function resumeVotes(etat) {
  return etat.themes
    .filter((t) => etat.annonce.votes[t.cle] > 0)
    .map((t) => t.emoji + ' ' + etat.annonce.votes[t.cle])
    .join('  ·  ');
}

// Annonce du thème gagnant dans le conteneur donné.
// S'il y a égalité : roulette du destin qui ralentit puis s'arrête sur le gagnant.
function afficherAnnonce(conteneur, etat) {
  clearTimeout(minuteurRoulette);
  const annonce = etat.annonce;
  const parCle = (cle) => etat.themes.find((t) => t.cle === cle);
  const gagnant = parCle(annonce.cle);

  conteneur.innerHTML = '';
  const titre = creerElement('p', 'annonce-titre');
  const nom = creerElement('div', 'annonce-nom');
  const sous = creerElement('p', 'annonce-sous');
  const votes = creerElement('p', 'annonce-votes', 'Votes : ' + resumeVotes(etat));
  conteneur.append(titre, nom, sous, votes);

  function montrerGagnant() {
    titre.textContent = annonce.egalite ? '🎯 Le hasard a tranché !' : '🎉 Thème choisi !';
    nom.textContent = gagnant.emoji + ' ' + gagnant.nom;
    nom.classList.toggle('hardcore', gagnant.hardcore);
    nom.classList.add('gagnant');
    sous.textContent = '⬆ ' + gagnant.consigneHaut + '   ·   ⬇ ' + gagnant.consigneBas;
    if (window.audio) window.audio.gagnantRoulette();
  }

  if (!annonce.egalite) {
    montrerGagnant();
    return;
  }

  // --- Roulette du destin ---
  titre.textContent = '🎰 Égalité ! La roulette du destin tourne…';
  const candidats = annonce.candidats.map(parCle);
  let compteur = 0;
  function tourner() {
    const courant = candidats[compteur % candidats.length];
    compteur++;
    nom.textContent = courant.emoji + ' ' + courant.nom;
    nom.classList.toggle('hardcore', courant.hardcore);
    if (window.audio) window.audio.clicRoulette(420 + (compteur % 4) * 50);
    // Elle ralentit, puis s'arrête sur le gagnant
    if (compteur >= 20 && courant.cle === gagnant.cle) {
      montrerGagnant();
      return;
    }
    minuteurRoulette = setTimeout(tourner, 70 + compteur * 12);
  }
  tourner();
}

// Arrête une éventuelle roulette en cours (quand on quitte l'écran d'annonce)
function arreterRoulette() {
  clearTimeout(minuteurRoulette);
}
