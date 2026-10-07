console.log('--- TEST AUTO-VOTE 1.5 PTS QUICK SPLASH ---');

const joueurs = new Map([
  ['j1', { id: 'j1', pseudo: 'Alice' }],
  ['j2', { id: 'j2', pseudo: 'Bob' }],
  ['j3', { id: 'j3', pseudo: 'Clara' }]
]);

const reponsesMap = new Map([
  ['rep1', { id: 'rep1', idJoueur: 'j1', texte: 'Punchline Alice', estBot: false }],
  ['rep2', { id: 'rep2', idJoueur: 'j2', texte: 'Punchline Bob', estBot: false }],
  ['rep3', { id: 'rep3', idJoueur: 'j3', texte: 'Punchline Clara', estBot: false }],
  ['__BOT__', { id: '__BOT__', idJoueur: '__BOT__', texte: 'Punchline Bot', estBot: true }]
]);

// Case 1: Alice votes for herself at #1
// Bob votes for Alice at #1
// Clara votes for Bob at #1
const classements = new Map([
  ['j1', { ordreIds: ['rep1', 'rep2', 'rep3'] }], // Alice votes for herself #1
  ['j2', { ordreIds: ['rep1', 'rep3', '__BOT__'] }], // Bob votes for Alice #1
  ['j3', { ordreIds: ['rep2', 'rep1', '__BOT__'] }]  // Clara votes for Bob #1
]);

const detailsManche = new Map();
for (const j of joueurs.values()) {
  detailsManche.set(j.id, {
    idJoueur: j.id,
    pseudo: j.pseudo,
    ptsVotes: 0,
    malusBot: 0,
    ptsSniper: 0,
    totalManche: 0
  });
}

for (const [idVotant, vote] of classements.entries()) {
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
}

for (const d of detailsManche.values()) {
  d.totalManche = Math.round((d.ptsVotes + d.malusBot + d.ptsSniper) * 10) / 10;
}

console.log('Scores calculés :');
for (const [id, d] of detailsManche.entries()) {
  console.log(`- ${d.pseudo}: ptsVotes=${d.ptsVotes}, total=${d.totalManche}, autoVoteTop1=${d.autoVoteTop1 || false}`);
}

// Alice:
// - j1 (Alice) voted rep1 in #1 -> +1.5
// - j2 (Bob) voted rep1 in #1 -> +3
// - j3 (Clara) voted rep1 in #2 -> +2
// Total ptsVotes Alice = 1.5 + 3 + 2 = 6.5
if (detailsManche.get('j1').ptsVotes !== 6.5) {
  throw new Error(`Attendu 6.5 pts pour Alice, obtenu ${detailsManche.get('j1').ptsVotes}`);
}
if (!detailsManche.get('j1').autoVoteTop1) {
  throw new Error('autoVoteTop1 devrait être true pour Alice');
}

// Bob:
// - j1 (Alice) voted rep2 in #2 -> +2
// - j3 (Clara) voted rep2 in #1 -> +3
// Total ptsVotes Bob = 5
if (detailsManche.get('j2').ptsVotes !== 5) {
  throw new Error(`Attendu 5 pts pour Bob, obtenu ${detailsManche.get('j2').ptsVotes}`);
}

console.log('✓ Tous les tests auto-vote 1.5 pts sont passés avec succès !');
