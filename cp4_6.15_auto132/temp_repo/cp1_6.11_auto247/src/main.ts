import { SceneManager } from './scene.js';
import { ModelManager } from './modelManager.js';
import { ParticleSystem } from './particleSystem.js';
import { UIController } from './uiController.js';

const canvasContainer = document.getElementById('canvas-container');
if (!canvasContainer) {
  throw new Error('canvas-container not found');
}

const sceneManager = new SceneManager(canvasContainer);
const particleSystem = new ParticleSystem(sceneManager.scene);
const modelManager = new ModelManager(sceneManager.scene, particleSystem);

const uiController = new UIController(modelManager, particleSystem);
uiController.init();

modelManager.attachUpdate(sceneManager);
uiController.attachUpdate(sceneManager);

sceneManager.start();
