import * as THREE from 'three';
import { initScene, scene, camera, renderer } from './scene';
import { createPorts, updatePort, onPortHover, resetPorts, PortData } from './ports';
import { initTimeline, updateTimeline, setSpeed } from './timeline';
import { initUI, handlePortHover, onTideUpdate, onReset } from './ui';

let lastFrameTime: number = 0;
let frameCount: number = 0;
let lastFpsUpdate: number = 0;
let currentFps: number = 60;

function init(): void {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  initScene(container);
  createPorts();
  initTimeline();
  initUI();

  onPortHover(handlePortHover);

  onTideUpdate((data: PortData) => {
    updatePort(data);
  });

  onReset(() => {
    resetPorts();
    setSpeed(10);
  });

  lastFrameTime = performance.now();
  animate();

  console.log('Tide Memory initialized successfully');
}

function animate(): void {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;

  updateTimeline(deltaTime);

  renderer.render(scene, camera);

  frameCount++;
  if (currentTime - lastFpsUpdate >= 1000) {
    currentFps = frameCount;
    frameCount = 0;
    lastFpsUpdate = currentTime;
    
    if (currentFps < 30) {
      console.warn(`Low FPS: ${currentFps}`);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
