import { AuroraRenderer } from './aurora';
import { UIController } from './ui';

function init(): void {
  const canvas = document.getElementById('aurora-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  const app = document.getElementById('app') as HTMLElement;
  if (!app) {
    throw new Error('App container not found');
  }

  const renderer = new AuroraRenderer(canvas);
  const ui = new UIController(app);

  renderer.start();

  const handleResize = (): void => {
    renderer.resize();
  };

  window.addEventListener('resize', handleResize);

  const handleUnload = (): void => {
    renderer.destroy();
    ui.destroy();
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('beforeunload', handleUnload);
  };

  window.addEventListener('beforeunload', handleUnload);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
