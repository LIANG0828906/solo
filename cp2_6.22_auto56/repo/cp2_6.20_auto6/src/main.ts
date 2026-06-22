import { GameEngine } from './GameEngine';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const loading = document.getElementById('loading');

  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const engine = new GameEngine(canvas);

  if (loading) {
    loading.style.display = 'none';
  }

  engine.start();

  window.addEventListener('beforeunload', () => {
    engine.destroy();
  });
});
