import * as THREE from 'three';
import { createScene, updateClouds, updateGround, createCloudClusters, SceneState } from './scene';
import { setupControls, updateCamera, getCurrentState } from './interaction';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let clock: THREE.Clock;
let container: HTMLElement;
let elapsedTime = 0;

const initialState: SceneState = {
  densityMultiplier: 1.0,
  driftSpeed: 0.5,
  colorSpeed: 1.0,
};

let currentState: SceneState = { ...initialState };
let pendingDensityChange = false;
let densityTransitionProgress = 0;

function init(): void {
  container = document.getElementById('canvas-container')!;

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  container.appendChild(renderer.domElement);

  scene = createScene();

  clock = new THREE.Clock();

  setupControls(camera, renderer, initialState, handleStateChange);

  window.addEventListener('resize', onWindowResize);

  animate();
}

function handleStateChange(newState: SceneState): void {
  const oldDensity = currentState.densityMultiplier;
  currentState = { ...newState };

  if (Math.abs(newState.densityMultiplier - oldDensity) > 0.1) {
    pendingDensityChange = true;
    densityTransitionProgress = 0;
  }
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(): void {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.1);
  elapsedTime += deltaTime;

  updateCamera(deltaTime);

  const state = getCurrentState();
  currentState = { ...state };

  updateClouds(deltaTime, currentState, elapsedTime);
  updateGround(deltaTime, elapsedTime);

  if (pendingDensityChange) {
    densityTransitionProgress += deltaTime / 0.3;
    if (densityTransitionProgress >= 1) {
      densityTransitionProgress = 1;
      pendingDensityChange = false;
      createCloudClusters();
    }
  }

  renderer.render(scene, camera);
}

init();
