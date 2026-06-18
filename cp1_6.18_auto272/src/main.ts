import { Game } from './game';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const game = new Game(canvas);

window.addEventListener('keydown', (e) => game.handleKeyDown(e));
canvas.addEventListener('click', (e) => game.handleClick(e));
canvas.addEventListener('mousemove', (e) => game.handleMouseMove(e));
window.addEventListener('resize', () => game.resize());

let lastTime = performance.now();
let fpsAccum = 0;
let fpsCount = 0;

function gameLoop(now: number) {
  const rawDt = (now - lastTime) / 1000;
  const dt = Math.min(rawDt, 0.05);
  lastTime = now;

  fpsAccum += 1 / (rawDt || 0.016);
  fpsCount++;
  if (fpsCount >= 30) {
    game.currentFps = fpsAccum / fpsCount;
    fpsAccum = 0;
    fpsCount = 0;
  }

  game.update(dt);
  game.draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
