import {
  initScene,
  getScene,
  getCamera,
  getControls,
  getRenderer,
  animate,
} from './modules/scene';
import { generateLayers, getLayers } from './modules/stratigraphy';
import { initInteraction, updateAnimation } from './modules/interaction';
import { initUI } from './modules/ui';

function bootstrap(): void {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App container #app not found');
    return;
  }

  const container = document.createElement('div');
  container.className = 'scene-container';
  container.style.cssText = `
    position: absolute;
    left: 40px;
    right: 0;
    top: 0;
    bottom: 0;
    width: calc(100% - 40px);
  `;
  app.appendChild(container);

  initScene(container);

  const scene = getScene();
  const camera = getCamera();
  const controls = getControls();
  const renderer = getRenderer();

  ;(window as any).__orbitControls = controls;
  ;(window as any).__camera = camera;
  ;(window as any).__renderer = renderer;

  generateLayers(scene);
  ;(window as any).__layers = getLayers();

  const interactionApi = initInteraction(camera, scene, controls, container);

  initUI(interactionApi, camera);

  const performanceMonitor = createPerformanceMonitor();

  animate((delta, elapsed) => {
    updateAnimation(elapsed, delta);
    if ((window as any).__axisUpdate) {
      (window as any).__axisUpdate();
    }
    performanceMonitor.update(delta);
  });
}

function createPerformanceMonitor() {
  let frames = 0;
  let accum = 0;
  let lastLog = 0;
  return {
    update(delta: number) {
      frames++;
      accum += delta;
      if (accum - lastLog > 2) {
        const fps = frames / (accum - lastLog);
        console.debug(`[Geo3D] FPS: ${fps.toFixed(1)}`);
        frames = 0;
        lastLog = accum;
      }
    },
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
