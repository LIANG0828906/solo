import { GameEngine, Direction } from './game/GameEngine';
import { Renderer } from './rendering/Renderer';

let rafId = 0;
let started = false;

function bootstrap(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const engine = new GameEngine();
  const renderer = new Renderer(canvas, engine);

  const handleDirection = (dir: Direction): void => {
    if (!started) {
      started = true;
      engine.startGame();
      setTimeout(() => {
        if (engine.phase === 'moving') engine.move(dir);
      }, 3600);
      return;
    }
    if (engine.phase === 'moving' && engine.canMove(dir)) {
      engine.move(dir);
    }
  };

  renderer.setDirectionHandler(handleDirection);

  const onKey = (e: KeyboardEvent): void => {
    renderer.handleKey(e);
  };
  window.addEventListener('keydown', onKey);

  engine.subscribe(() => { /* state change triggers implicit re-render via loop */ });

  const loop = (time: number): void => {
    renderer.render(time);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('keydown', onKey);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
