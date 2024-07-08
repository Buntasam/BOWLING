const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const historyFile = 'history.json';

let gameData = {
  players: [],
  scores: {},
  frames: 10
};

const askQuestion = (question) => {
  return new Promise((resolve) => rl.question(question, resolve));
};

const startNewGame = async () => {
  const numberOfPlayers = await askQuestion('Entrez le nombre de joueurs (1-6) : ');
  for (let i = 0; i < parseInt(numberOfPlayers); i++) {
    const playerName = await askQuestion(`Entrez le nom du joueur ${i + 1} : `);
    gameData.players.push(playerName);
    gameData.scores[playerName] = [];
  }
};

const playFrame = async (frameNumber) => {
  console.log(`Frame ${frameNumber + 1}`);
  for (let player of gameData.players) {
    const firstRoll = await askQuestion(`${player}, combien de quilles avez-vous renversé lors du premier lancer ? `);
    const secondRoll = firstRoll < 10 ? await askQuestion(`${player}, combien de quilles avez-vous renversé lors du deuxième lancer ? `) : 0;
    gameData.scores[player].push({ frame: frameNumber + 1, rolls: [parseInt(firstRoll), parseInt(secondRoll)] });
  }
};

const calculateScores = () => {
  for (let player of gameData.players) {
    let totalScore = 0;
    for (let i = 0; i < gameData.frames; i++) {
      const frame = gameData.scores[player][i];
      const [firstRoll, secondRoll] = frame.rolls;
      let frameScore = firstRoll + secondRoll;

      // Spare
      if (firstRoll + secondRoll === 10 && firstRoll !== 10) {
        frameScore += gameData.scores[player][i + 1]?.rolls[0] || 0;
      }

      // Strike
      if (firstRoll === 10) {
        frameScore += (gameData.scores[player][i + 1]?.rolls[0] || 0) + (gameData.scores[player][i + 1]?.rolls[1] || 0);
      }

      totalScore += frameScore;
    }
    gameData.scores[player].total = totalScore;
  }
};


const displayScores = () => {
  console.log('Score final:');
  let winner = { name: null, score: 0 };
  for (let player of gameData.players) {
    const totalScore = gameData.scores[player].total;
    console.log(`${player}: ${totalScore}`);
    if (totalScore > winner.score) {
      winner = { name: player, score: totalScore };
    }
  }
  console.log(`${winner.name} est le/la gagnant(e) !`);
};


const saveHistory = () => {
  const history = JSON.parse(fs.readFileSync(historyFile, 'utf8') || '[]');
  history.push(gameData);
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
};

const viewHistory = () => {
  const history = JSON.parse(fs.readFileSync(historyFile, 'utf8') || '[]');
  console.log('Historique des parties:');
  history.forEach((game, index) => {
    console.log(`Partie ${index + 1}:`);
    for (let player of game.players) {
      console.log(`  ${player}: ${game.scores[player].total}`);
    }
  });
};

const main = async () => {
  const action = await askQuestion('Tapez "n" pour commencer une nouvelle partie ou "h" pour voir l\'historique des parties: ');
  if (action === 'n') {
    await startNewGame();
    for (let i = 0; i < gameData.frames; i++) {
      await playFrame(i);
    }
    calculateScores();
    displayScores();
    saveHistory();
  } else if (action === 'h') {
    viewHistory();
  }
  rl.close();
};


main();
