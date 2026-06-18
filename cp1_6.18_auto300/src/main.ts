import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config';
import { Game } from './game';
import { Renderer } from './renderer';

const canvas = document.getElementById('game') as HTMLCanvasElement;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const game = new Game();
const renderer = new Renderer(canvas);

let lastTime = 0;
let running = true;

function gameLoop(currentTime: number): void {
  if (!running) return;

  const deltaTime = lastTime === 0 ? 1 / 60 : (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  game.update(deltaTime);
  renderer.render(game.getState());

  requestAnimationFrame(gameLoop);
}

function handleKeyDown(e: KeyboardEvent): void {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
  game.handleKeyDown(e.key);
}

function handleKeyUp(e: KeyboardEvent): void {
  game.handleKeyUp(e.key);
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

window.addEventListener('beforeunload', () => {
  running = false;
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});

requestAnimationFrame(gameLoop);
