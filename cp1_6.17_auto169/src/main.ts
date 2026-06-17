import { particleSystem } from './ParticleSystem';
import { gameEngine } from './GameEngine';
import { eventBus } from './EventBus';

function init(): void {
  const canvas = document.getElementById('particleCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  particleSystem.init(canvas);

  gameEngine.init();

  particleSystem.start();

  console.log('Alchemy Simulator initialized');
  console.log('EventBus ready:', eventBus);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
