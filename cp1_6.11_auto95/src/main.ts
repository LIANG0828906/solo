import { GameManager, InputState } from './gameManager';
import { Renderer } from './renderer';

function main() {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  const game = new GameManager(canvas.width, canvas.height);
  const renderer = new Renderer(canvas);

  window.addEventListener('resize', () => {
    resize();
    game.resize(canvas.width, canvas.height);
  });

  const input: InputState = { w: false, a: false, s: false, d: false, shift: false, space: false };

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') input.w = true;
    else if (key === 'a') input.a = true;
    else if (key === 's') input.s = true;
    else if (key === 'd') input.d = true;
    else if (key === 'shift') input.shift = true;
    else if (key === ' ') input.space = true;
    game.setInput(input);
    if (['w', 'a', 's', 'd', ' ', 'shift'].includes(key)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') input.w = false;
    else if (key === 'a') input.a = false;
    else if (key === 's') input.s = false;
    else if (key === 'd') input.d = false;
    else if (key === 'shift') input.shift = false;
    else if (key === ' ') input.space = false;
    game.setInput(input);
  });

  let lastTime = performance.now();

  function loop(now: number) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    game.update(dt);
    renderer.render(game.state, game.getTime());

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
