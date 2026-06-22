import { startGame, getState, updateShockwaves, updateFragments, updateParticles, updateRipples, updateScreenShake, updateCores, updateStepCounter } from './game';
import { render } from './renderer';
import { initUI, updateUI } from './ui';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

startGame(0);
initUI(canvas, ctx);

let lastTime = performance.now();

function gameLoop(now: number) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  const state = getState();

  updateCores(dt);
  updateShockwaves(dt);
  updateFragments(dt);
  updateParticles(dt);
  updateRipples(dt);
  updateScreenShake(dt);
  updateStepCounter(dt);
  updateUI(dt);

  render(state, ctx, canvas, now / 1000);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
