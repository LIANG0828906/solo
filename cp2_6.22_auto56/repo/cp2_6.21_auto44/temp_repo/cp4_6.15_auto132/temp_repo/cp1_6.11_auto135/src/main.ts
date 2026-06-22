import * as THREE from 'three';
import { initScene, scene, camera, renderer, controls, handleResize, updateStars } from './scene';
import { createCity, updateBuildingColors } from './cityModel';
import { initHeatmap, updateParticles } from './heatmap';
import { initUI } from './ui';

const clock = new THREE.Clock();

function init(): void {
  const container = document.getElementById('canvas-container')!;
  
  initScene(container);
  createCity();
  initHeatmap();
  initUI();
  
  window.addEventListener('resize', () => handleResize(container));
  
  animate();
}

function animate(): void {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();
  
  controls.update();
  updateBuildingColors(deltaTime);
  updateParticles(deltaTime);
  updateStars(elapsedTime);
  
  renderer.render(scene, camera);
}

init();
