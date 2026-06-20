import { GameEngine } from './gameEngine';

function init(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const gameEngine = new GameEngine(canvas);

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    const movementKeys = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'w', 'a', 's', 'd',
      'W', 'A', 'S', 'D'
    ];
    if (movementKeys.includes(e.key)) {
      e.preventDefault();
      gameEngine.handleKeyDown(e.key);
    }
  }, { passive: false });

  gameEngine.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
