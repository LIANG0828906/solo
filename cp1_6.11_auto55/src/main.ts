import { GraphEngine } from './GraphEngine';
import { Toolbar } from './Toolbar';
import { PropertyPanel } from './PropertyPanel';

function initApp(): void {
  const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const engine = new GraphEngine(canvas);

  const toolbarContainer = document.getElementById('toolbar');
  if (toolbarContainer) {
    new Toolbar(engine, toolbarContainer);
  }

  const propertyPanelContainer = document.getElementById('property-panel');
  if (propertyPanelContainer) {
    new PropertyPanel(engine, propertyPanelContainer);
  }

  setTimeout(() => {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => {
        loadingOverlay.remove();
      }, 500);
    }
  }, 300);

  const handleResize = (): void => {
    engine.resize();
  };

  window.addEventListener('resize', handleResize);

  const checkFps = (): void => {
    const fps = engine.getFps();
    console.log(`FPS: ${fps}`);
  };
  setInterval(checkFps, 5000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
