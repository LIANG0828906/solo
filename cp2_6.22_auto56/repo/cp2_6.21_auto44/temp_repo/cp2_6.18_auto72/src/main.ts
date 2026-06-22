import { eventBus, state, resetState } from './gameState';
import { initMapEngine, updateMap, renderMap, handleKeyDown, handleKeyUp, resizeMapEngine } from './mapEngine';
import { initHud, updateHud, renderHud, handleHudClick, handleHudMouseMove, resizeHud } from './hudRenderer';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let lastTime = 0;
let countdownTimer = 0;
let tutorialTimer = 0;

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  resizeMapEngine(window.innerWidth, window.innerHeight);
  resizeHud(window.innerWidth, window.innerHeight);
}

function resetGame(): void {
  resetState();
  initMapEngine(window.innerWidth, window.innerHeight);
  countdownTimer = 3;
  tutorialTimer = 10;
}

function gameLoop(timestamp: number): void {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (state.phase === 'countdown') {
    countdownTimer -= dt;
    state.countdownValue = countdownTimer;
    if (countdownTimer <= 0) {
      state.phase = 'tutorial';
      state.survivalTime = 0;
    }
  }

  if (state.phase === 'tutorial') {
    state.survivalTime += dt;
    updateMap(dt);
    if (state.survivalTime >= 10) {
      state.phase = 'playing';
    }
  }

  if (state.phase === 'playing') {
    state.survivalTime += dt;
    updateMap(dt);
  }

  updateHud(dt);

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  renderMap(ctx);
  renderHud();

  requestAnimationFrame(gameLoop);
}

function init(): void {
  resize();
  initHud(ctx, window.innerWidth, window.innerHeight);
  window.addEventListener('resize', resize);

  window.addEventListener('keydown', (e) => {
    handleKeyDown(e);
    if (e.key === 'Escape') {
      if (state.phase === 'playing') {
        state.phase = 'paused';
      } else if (state.phase === 'paused') {
        state.phase = 'playing';
      }
    }
  });
  window.addEventListener('keyup', handleKeyUp);

  canvas.addEventListener('click', (e) => {
    handleHudClick(e.clientX, e.clientY);
  });
  canvas.addEventListener('mousemove', (e) => {
    handleHudMouseMove(e.clientX, e.clientY);
  });

  eventBus.on('restart', () => {
    resetGame();
  });

  resetGame();
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

init();
