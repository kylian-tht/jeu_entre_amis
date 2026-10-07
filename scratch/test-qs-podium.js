const fs = require('fs');

console.log('--- TEST QUICK SPLASH PODIUM & STATS ---');

// Mock data structures like server.js
const joueurs = new Map([
  ['j1', { id: 'j1', pseudo: 'Alice', avatar: '💃', connecte: true }],
  ['j2', { id: 'j2', pseudo: 'Bob', avatar: '🕺', connecte: true }],
  ['j3', { id: 'j3', pseudo: 'Clara', avatar: '🍹', connecte: true }]
]);

const scoresCumules = new Map([
  ['j1', 12],
  ['j2', 8],
  ['j3', 5]
]);

// Test calculating podium
function calculerPodiumQs() {
  const liste = Array.from(joueurs.values()).map((j) => {
    const total = scoresCumules.get(j.id) || 0;
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

const podium = calculerPodiumQs();
console.log('Podium calculé :', podium);

// Assert scoreTotal and total are defined and equal
podium.forEach((p) => {
  if (p.total === undefined || p.scoreTotal === undefined) {
    throw new Error(`Score undefined for ${p.pseudo}!`);
  }
  console.log(`✓ ${p.pseudo}: #${p.rang} avec ${p.scoreTotal} pts (total: ${p.total})`);
});

// Test historical trophies calculation
const historiqueManches = [
  {
    manche: 1,
    scoresJoueurs: [
      { idJoueur: 'j1', pseudo: 'Alice', piegeParBot: false, sniperSucces: true, estVictimeSniper: false },
      { idJoueur: 'j2', pseudo: 'Bob', piegeParBot: true, sniperSucces: false, estVictimeSniper: false },
      { idJoueur: 'j3', pseudo: 'Clara', piegeParBot: false, sniperSucces: null, estVictimeSniper: true }
    ],
    reponses: [
      { auteurPseudo: 'Alice', top1: 2, estBot: false },
      { auteurPseudo: 'Bob', top1: 0, estBot: false },
      { auteurPseudo: '🤖 Bot', top1: 1, estBot: true }
    ]
  },
  {
    manche: 2,
    scoresJoueurs: [
      { idJoueur: 'j1', pseudo: 'Alice', piegeParBot: false, sniperSucces: true, estVictimeSniper: false },
      { idJoueur: 'j2', pseudo: 'Bob', piegeParBot: true, sniperSucces: null, estVictimeSniper: true },
      { idJoueur: 'j3', pseudo: 'Clara', piegeParBot: false, sniperSucces: null, estVictimeSniper: false }
    ],
    reponses: [
      { auteurPseudo: 'Alice', top1: 1, estBot: false },
      { auteurPseudo: 'Clara', top1: 2, estBot: false }
    ]
  }
];

function calculerTropheesQs() {
  const trophees = [];
  const piegesParBot = new Map();
  const snipersReussis = new Map();
  const snipersRates = new Map();
  const punchlinesTop1 = new Map();
  const victimesSniper = new Map();

  for (const j of joueurs.values()) {
    piegesParBot.set(j.id, 0);
    snipersReussis.set(j.id, 0);
    snipersRates.set(j.id, 0);
    punchlinesTop1.set(j.id, 0);
    victimesSniper.set(j.id, 0);
  }

  for (const manche of historiqueManches) {
    if (Array.isArray(manche.scoresJoueurs)) {
      for (const sj of manche.scoresJoueurs) {
        if (sj.piegeParBot) piegesParBot.set(sj.idJoueur, (piegesParBot.get(sj.idJoueur) || 0) + 1);
        if (sj.sniperSucces === true) snipersReussis.set(sj.idJoueur, (snipersReussis.get(sj.idJoueur) || 0) + 1);
        else if (sj.sniperSucces === false) snipersRates.set(sj.idJoueur, (snipersRates.get(sj.idJoueur) || 0) + 1);
        if (sj.estVictimeSniper) victimesSniper.set(sj.idJoueur, (victimesSniper.get(sj.idJoueur) || 0) + 1);
      }
    }
    if (Array.isArray(manche.reponses)) {
      for (const r of manche.reponses) {
        if (!r.estBot && r.top1 > 0) {
          const jTrouve = Array.from(joueurs.values()).find((j) => j.pseudo === r.auteurPseudo);
          if (jTrouve) punchlinesTop1.set(jTrouve.id, (punchlinesTop1.get(jTrouve.id) || 0) + r.top1);
        }
      }
    }
  }

  // 1. Pigeon du bot
  let maxPieges = 0, pigeons = [];
  for (const [id, count] of piegesParBot.entries()) {
    if (count > maxPieges) { maxPieges = count; pigeons = [id]; }
    else if (count === maxPieges && maxPieges > 0) pigeons.push(id);
  }
  if (maxPieges > 0) {
    trophees.push({
      icone: '🤖',
      titre: 'Le Pigeon du Bot',
      desc: `Piégé ${maxPieges} fois en mettant le bot dans son Top 2 (-${maxPieges * 2} pts)`,
      pseudos: pigeons.map((id) => joueurs.get(id).pseudo).join(', ')
    });
  }

  // 2. Punchline
  let maxTop1 = 0, punchliners = [];
  for (const [id, count] of punchlinesTop1.entries()) {
    if (count > maxTop1) { maxTop1 = count; punchliners = [id]; }
    else if (count === maxTop1 && maxTop1 > 0) punchliners.push(id);
  }
  if (maxTop1 > 0) {
    trophees.push({
      icone: '👑',
      titre: 'Le Roi de la Punchline',
      desc: `Élu ${maxTop1} fois meilleure réponse de la table (#1) !`,
      pseudos: punchliners.map((id) => joueurs.get(id).pseudo).join(', ')
    });
  }

  // 3. Sniper
  let maxSnipers = 0, snipers = [];
  for (const [id, count] of snipersReussis.entries()) {
    if (count > maxSnipers) { maxSnipers = count; snipers = [id]; }
    else if (count === maxSnipers && maxSnipers > 0) snipers.push(id);
  }
  if (maxSnipers > 0) {
    trophees.push({
      icone: '🎯',
      titre: "L'Œil de Lynx",
      desc: `${maxSnipers} accusation(s) sniper réussie(s) (+${maxSnipers * 2} pts empochés) !`,
      pseudos: snipers.map((id) => joueurs.get(id).pseudo).join(', ')
    });
  }

  return trophees;
}

const trophees = calculerTropheesQs();
console.log('Trophées calculés :', trophees);

if (!trophees.some(t => t.titre.includes('Pigeon'))) throw new Error('Trophee Pigeon manquant !');
if (!trophees.some(t => t.titre.includes('Roi de la Punchline'))) throw new Error('Trophee Roi Punchline manquant !');
if (!trophees.some(t => t.titre.includes('Lynx'))) throw new Error('Trophee Lynx manquant !');

console.log('✓ Tous les tests Quick Splash Podium & Trophées sont validés avec succès !');
