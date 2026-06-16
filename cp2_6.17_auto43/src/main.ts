import { Game } from './game';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new Game(canvas);

let lastTime = performance.now();

function loop(now: number): void {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  game.update(dt);
  game.render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
