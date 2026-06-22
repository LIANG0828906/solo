import { Controller } from './controller';
import { UIManager } from './uiManager';

const canvasContainer = document.getElementById('canvas-container')!;

const controller = new Controller(canvasContainer);
const uiManager = new UIManager(controller);

controller.init();
uiManager.init();

let frameCount = 0;
let fpsUpdateTime = 0;
let currentFps = 0;

controller.onRenderFrame(() => {
  frameCount++;
  const now = performance.now();
  if (now - fpsUpdateTime >= 1000) {
    currentFps = frameCount;
    frameCount = 0;
    fpsUpdateTime = now;
    (window as unknown as { __voxelsculpt_fps: number }).__voxelsculpt_fps = currentFps;
  }
});

window.addEventListener('beforeunload', () => {
  controller.dispose();
});

(window as unknown as { __voxelsculpt_getFps: () => number }).__voxelsculpt_getFps = () => {
  return (window as unknown as { __voxelsculpt_fps: number }).__voxelsculpt_fps || 0;
};
