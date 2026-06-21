import { GameState } from './gameLogic';
import { Renderer } from './renderer';
import { ParticleSystem } from './particleSystem';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const turnCountEl = document.getElementById('turn-count') as HTMLElement;
const matchedCountEl = document.getElementById('matched-count') as HTMLElement;
const timerEl = document.getElementById('timer') as HTMLElement;
const statusTipEl = document.getElementById('status-tip') as HTMLElement;
const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

const gameState = new GameState();
const renderer = new Renderer(canvas);
const particleSystem = new ParticleSystem();

let lastTime = performance.now();
let currentMessage = '';
let messageTimer: number | null = null;

function updateUI(): void {
  turnCountEl.textContent = String(gameState.turnCount);
  matchedCountEl.textContent = `${gameState.matchedPairs} / ${GameState.TOTAL_CARDS / 2}`;
  timerEl.textContent = gameState.getFormattedTime();

  if (gameState.message !== currentMessage) {
    currentMessage = gameState.message;
    if (messageTimer !== null) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }

    if (currentMessage) {
      statusTipEl.textContent = currentMessage;
      statusTipEl.classList.remove('show');
      void statusTipEl.offsetWidth;
      statusTipEl.classList.add('show');
    } else {
      statusTipEl.classList.remove('show');
    }
  }
}

function gameLoop(currentTime: number): void {
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  gameState.update(deltaTime);
  particleSystem.update(deltaTime);
  renderer.checkForMatchParticles(gameState, particleSystem);

  renderer.render(gameState, particleSystem);
  updateUI();

  requestAnimationFrame(gameLoop);
}

function handleClick(e: MouseEvent): void {
  const gridIndex = renderer.getGridIndexAt(e.clientX, e.clientY);
  if (gridIndex !== -1) {
    gameState.handleCardClick(gridIndex);
  }
}

function resetGame(): void {
  gameState.reset();
  particleSystem.clear();
  renderer.clearMatchState();
  currentMessage = '';
}

canvas.addEventListener('click', handleClick);
resetBtn.addEventListener('click', resetGame);

requestAnimationFrame((time) => {
  lastTime = time;
  gameLoop(time);
});

setTimeout(() => {
  statusTipEl.classList.add('show');
}, 100);
