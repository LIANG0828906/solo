import { MapEngine } from './mapEngine';
import { HUDRenderer } from './hudRenderer';
import { gameState } from './gameState';

function init(): void {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Game canvas not found');
  }

  const mapEngine = new MapEngine(canvas);
  const hudRenderer = new HUDRenderer(canvas);

  window.addEventListener('resize', () => {
    hudRenderer.resize();
  });

  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTime = 0;

  function gameLoop(currentTime: number): void {
    const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    fpsTime += dt;
    frameCount++;
    if (fpsTime >= 1) {
      fpsTime = 0;
      frameCount = 0;
    }

    gameState.update(dt);
    mapEngine.update(dt);
    hudRenderer.update(dt);

    mapEngine.render();
    hudRenderer.render();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', init);
