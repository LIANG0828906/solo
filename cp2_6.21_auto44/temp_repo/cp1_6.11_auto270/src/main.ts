import { PaintingCanvas } from './canvas';
import { UIManager } from './ui';

function initApp(): void {
  const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const painting = new PaintingCanvas(canvas);
  new UIManager(painting);

  console.log('富春山居图 山水画卷 已就绪');
  console.log(`FPS: ${painting.getFPS()}`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
