import { SceneManager } from './scene';
import { ControlManager } from './controls';

function init(): void {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  const sceneManager = new SceneManager(container);
  new ControlManager(sceneManager);

  (window as any).__sceneManager = sceneManager;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
