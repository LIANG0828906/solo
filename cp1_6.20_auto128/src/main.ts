import { GameEngine, GameState } from './gameEngine';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const comboEl = document.getElementById('combo') as HTMLDivElement;
const scoreEl = document.getElementById('score') as HTMLDivElement;
const skillFillEl = document.getElementById('skillFill') as HTMLDivElement;
const skillCooldownEl = document.getElementById('skillCooldown') as HTMLDivElement;
const skillReadyEl = document.getElementById('skillReady') as HTMLDivElement;
const gameOverEl = document.getElementById('gameOver') as HTMLDivElement;
const finalScoreEl = document.getElementById('finalScore') as HTMLDivElement;
const restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;
const heartsContainer = document.getElementById('hearts') as HTMLDivElement;

const game = new GameEngine(canvas);

function updateUI(state: GameState): void {
  comboEl.textContent = `COMBO: ${state.combo}`;
  scoreEl.textContent = `SCORE: ${Math.floor(state.score)}`;

  const chargePercent = (state.skillCharge / state.maxSkillCharge) * 100;
  skillFillEl.style.width = `${chargePercent}%`;

  if (state.skillCooldown > 0) {
    skillCooldownEl.textContent = `COOLDOWN: ${state.skillCooldown.toFixed(1)}s`;
    skillReadyEl.classList.remove('flashing');
  } else if (state.skillCharge >= state.maxSkillCharge) {
    skillCooldownEl.textContent = 'READY! [SPACE]';
    skillReadyEl.classList.add('flashing');
  } else {
    skillCooldownEl.textContent = '';
    skillReadyEl.classList.remove('flashing');
  }

  const hearts = heartsContainer.querySelectorAll('.heart');
  hearts.forEach((heart, index) => {
    if (index < state.health) {
      heart.classList.remove('lost');
    } else {
      heart.classList.add('lost');
    }
  });

  if (state.isGameOver) {
    finalScoreEl.textContent = `FINAL SCORE: ${Math.floor(state.score)} | MAX COMBO: ${state.maxCombo}`;
    gameOverEl.style.display = 'flex';
  } else {
    gameOverEl.style.display = 'none';
  }
}

function handleHeartLost(index: number): void {
  const hearts = heartsContainer.querySelectorAll('.heart');
  if (hearts[index]) {
    hearts[index].classList.add('shake');
    setTimeout(() => {
      hearts[index].classList.remove('shake');
    }, 300);
  }
}

game.setOnStateChange(updateUI);
game.setOnHeartLost(handleHeartLost);

document.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
  if (started) {
    game.handleKeyDown(e.key);
  }
});

document.addEventListener('keyup', (e) => {
  if (started) {
    game.handleKeyUp(e.key);
  }
});

restartBtn.addEventListener('click', () => {
  const hearts = heartsContainer.querySelectorAll('.heart');
  hearts.forEach((heart) => {
    heart.classList.remove('lost', 'shake');
  });

  game.restart();
  updateUI(game.getState());
});

let started = false;
function startGame() {
  if (!started) {
    started = true;
    game.start();
    updateUI(game.getState());
  }
}

document.addEventListener('click', startGame, { once: true });
document.addEventListener('keydown', startGame, { once: true });
