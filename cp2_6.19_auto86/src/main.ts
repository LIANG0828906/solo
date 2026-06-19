import * as THREE from 'three';
import { initScene, SceneData } from './scene';
import { createPlant, PlantObject, setTargetParams, updatePlant, getPlantHeight, EnvironmentParams } from './plant';
import { createUI } from './ui';

let sceneData: SceneData;
let plant: PlantObject;
let ui: ReturnType<typeof createUI>;
let lastTime = 0;
let animationId: number;

function init(): void {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  sceneData = initScene(container);
  plant = createPlant();
  sceneData.scene.add(plant.group);

  ui = createUI({
    onParamChange: (params: EnvironmentParams) => {
      setTargetParams(plant, params);
    }
  });

  lastTime = performance.now();
  animate();
}

function animate(): void {
  animationId = requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  updatePlant(plant, deltaTime);
  sceneData.controls.update();

  const height = getPlantHeight(plant);
  ui.updateValues(plant.params, height);

  sceneData.renderer.render(sceneData.scene, sceneData.camera);
}

window.addEventListener('DOMContentLoaded', init);
