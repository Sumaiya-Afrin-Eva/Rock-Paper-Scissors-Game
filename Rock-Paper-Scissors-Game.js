const firebaseConfig = {
  apiKey: "AIzaSyBZU_6lPVQtY_snQlT8S27d5XxpPBxeXmM",
  authDomain: "fir-c18f8.firebaseapp.com",
  databaseURL: "https://fir-c18f8-default-rtdb.firebaseio.com",
  projectId: "fir-c18f8",
  storageBucket: "fir-c18f8.firebasestorage.app",
  messagingSenderId: "310541547987",
  appId: "1:310541547987:web:ea1129a07f87bddf575726",
  measurementId: "G-HDVL3WLP44"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.getElementById("ruleId").addEventListener("click", () => {
  playClickSound();
  document.getElementById("frontInterface").style.display = "none";
  document.getElementById("ruleInterface").style.display = "block";
});

document.getElementById("multiplayerBtn").addEventListener("click", () => {
  playClickSound();
  document.getElementById("frontInterface").style.display = "none";
  document.getElementById("setup-container").style.display = "block";
});

document.getElementById("singlePlayerBtn").addEventListener("click", () => {
  playClickSound();
  document.getElementById("frontInterface").style.display = "none";
  document.getElementById("single-game-container").style.display = "block";
});

function playClickSound() {
  const clickSound = document.getElementById('clickSound');
  clickSound.currentTime = 0;
  clickSound.play();
}

//MultiPlayerInterface

let roomId = '', playerId = '', opponentId = '', score = {}, myMove = null;
let hasHandledResult = false;

function startGame() {
  roomId = document.getElementById('roomIdInput').value;
  playerId = document.getElementById('selectPlayerId').value;
  opponentId = playerId === 'player1' ? 'player2' : 'player1';

  if (!roomId || !playerId) return alert('Please enter Room ID and choose a player role.');

  score = JSON.parse(localStorage.getItem('score_' + playerId)) || { wins: 0, losses: 0, ties: 0 };
  updateScore();
  document.querySelector('.js-status').textContent = playerId === 'player1' ? "Your turn" : "Opponent's turn";

  document.getElementById("setup-container").style.display = "none";
  document.getElementById("game-container").style.display = "block";

  db.ref(`rooms/${roomId}`).on('value', snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const move1 = data.player1?.move || null;
    const move2 = data.player2?.move || null;

    if (!move1 && !move2) {
      document.querySelector('.js-status').textContent = playerId === 'player1' ? "Your turn" : "Opponent's turn";
      return;
    }

    if ((playerId === 'player1' && move1 && !move2) || (playerId === 'player2' && move2 && !move1)) {
      document.querySelector('.js-status').textContent = '⏳ Waiting for opponent...';
      return;
    }

    if ((playerId === 'player1' && !move1 && move2) || (playerId === 'player2' && !move2 && move1)) {
      document.querySelector('.js-status').textContent = 'Your turn';
      return;
    }

    if (move1 && move2 && data.result && data.result[playerId] && !hasHandledResult) {
      hasHandledResult = true;

      const myPlay = playerId === 'player1' ? move1 : move2;
      const oppPlay = playerId === 'player1' ? move2 : move1;
      const outcome = data.result[playerId];

      let result = '';
      let soundType = '';

      if (outcome === 'tie') {
        result = 'Tie 🤝';
        score.ties++;
        soundType = 'tie';
      } else if (outcome === 'win') {
        result = 'You Win ✅';
        score.wins++;
        soundType = 'win';
      } else {
        result = 'You Lose ❌';
        score.losses++;
        soundType = 'lose';
      }

      document.querySelector('.js-status').textContent = '';
      document.querySelector('.js-result').textContent = result;
      document.querySelector('.js-move').innerHTML = `You <img src="${myPlay}.png" class="move-icon"> <img src="${oppPlay}.png" class="move-icon"> Opponent`;
      localStorage.setItem('score_' + playerId, JSON.stringify(score));
      updateScore();
      playResultSound(soundType);

      setTimeout(() => {
        db.ref(`rooms/${roomId}`).update({ result: null, processed: null });
        hasHandledResult = false;
      }, 2000);
    }

    if (move1 && move2 && !data.result && !data.processed) {
      const p1 = move1;
      const p2 = move2;
      const result = {};

      if (p1 === p2) {
        result.player1 = 'tie';
        result.player2 = 'tie';
      } else if (
        (p1 === 'rock' && p2 === 'scissors') ||
        (p1 === 'paper' && p2 === 'rock') ||
        (p1 === 'scissors' && p2 === 'paper')
      ) {
        result.player1 = 'win';
        result.player2 = 'lose';
      } else {
        result.player1 = 'lose';
        result.player2 = 'win';
      }

      db.ref(`rooms/${roomId}`).update({ result, processed: true });
      db.ref(`rooms/${roomId}/player1/move`).remove();
      db.ref(`rooms/${roomId}/player2/move`).remove();
    }
  });
}

function submitMove(move) {
  myMove = move;
  db.ref(`rooms/${roomId}/${playerId}`).set({ move });
  document.querySelector('.js-status').textContent = '⏳ Waiting for opponent...';
}

function updateScore() {
  document.querySelector('.js-score').textContent = `Wins: ${score.wins}, Losses: ${score.losses}, Ties: ${score.ties}`;
}

function resetScore() {
  playClickSound();
  score = { wins: 0, losses: 0, ties: 0 };
  localStorage.setItem('score_' + playerId, JSON.stringify(score));
  updateScore();
}

function playResultSound(type) {
  const win = document.getElementById('winSound');
  const lose = document.getElementById('loseSound');
  const tie = document.getElementById('tieSound');
  if (type === 'win') win.play();
  else if (type === 'lose') lose.play();
  else tie.play();
}

//SinglePlayerInterface


let singleScore = JSON.parse(localStorage.getItem('singleScore')) || {
  wins: 0,
  losses: 0,
  ties: 0,
};

singleUpdateScore();

function playResultSoundSingle(resultType) {
  const winSound = document.getElementById('winSound');
  const loseSound = document.getElementById('loseSound');
  const tieSound = document.getElementById('tieSound');

  if (resultType === 'You Win ✅') {
    winSound.currentTime = 0;
    winSound.play();
  } else if (resultType === 'You Lose ❌') {
    loseSound.currentTime = 0;
    loseSound.play();
  } else if (resultType === 'Tie 🤝') {
    tieSound.currentTime = 0;
    tieSound.play();
  }
}

function playGame(playerMove) {
  document.querySelectorAll('choice').forEach(choice => {
    choice.addEventlistener('click', () => {
      choice.classList.add('animate');
      setTimeout(() => choice.classList.remove('animate'), 300);
    });
  });

  const computerMove = pickComputerMove();
  console.log(computerMove);
  let resultSingle = '';

  if (playerMove === 'rock') {
    if (computerMove === 'rock') {
      resultSingle = 'Tie 🤝';
    }
    else if (computerMove === 'paper') {
      resultSingle = 'You Lose ❌';
    }
    else if (computerMove === 'scissors') {
      resultSingle = 'You Win ✅';
    }
    console.log(resultSingle);
  }

  if (playerMove === 'paper') {
    if (computerMove === 'rock') {
      resultSingle = 'You Win ✅';
    }
    else if (computerMove === 'paper') {
      resultSingle = 'Tie 🤝';
    }
    else if (computerMove === 'scissors') {
      resultSingle = 'You Lose ❌';
    }
    console.log(resultSingle);
  }

  if (playerMove === 'scissors') {
    if (computerMove === 'rock') {
      resultSingle = 'You Lose ❌';
    }
    else if (computerMove === 'paper') {
      resultSingle = 'You Win ✅';
    }
    else if (computerMove === 'scissors') {
      resultSingle = 'Tie 🤝';
    }
    console.log(resultSingle);
  }

  if (resultSingle === 'You Win ✅') {
    playResultSoundSingle('You Win ✅');
    singleScore.wins++;
  }
  else if (resultSingle === 'You Lose ❌') {
    playResultSoundSingle('You Lose ❌');
    singleScore.losses++;
  }
  else if (resultSingle === 'Tie 🤝') {
    playResultSoundSingle('Tie 🤝');
    singleScore.ties++;
  }

  document.querySelector('.single-js-result').innerHTML = resultSingle;

  document.querySelector('.single-js-move').innerHTML = `You 
    <img src="${playerMove}.png"
    class="move-icon">
    <img src="${computerMove}.png"
    class="move-icon">
    Computer`;

  localStorage.setItem('singleScore', JSON.stringify(singleScore));
  singleUpdateScore();
}

function singleUpdateScore() {
  document.querySelector('.single-js-score').innerHTML = `Wins: ${singleScore.wins}, Losses: ${singleScore.losses}, Ties: ${singleScore.ties}`;
}

function pickComputerMove() {
  const randomNumber = Math.random();
  let computerMove = '';

  if (randomNumber >= 0 && randomNumber <= 1 / 3) {
    computerMove = 'rock';
  }
  else if (randomNumber > 1 / 3 && randomNumber <= 2 / 3) {
    computerMove = 'paper';
  }
  else {
    computerMove = 'scissors';
  }
  return computerMove;
}
