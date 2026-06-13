import * as THREE from 'three';
import { Visualizer } from './visual/visualizer';
import { audioEngine } from './audio/audioEngine';
import { InteractionManager } from './interaction/interactionManager';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let visualizer: Visualizer;
let interactionManager: InteractionManager;
let clock: THREE.Clock;

let lastTime = performance.now();
let frameCount = 0;
let fps = 60;

function init(): void {
  const container = document.getElementById('canvas-container')!;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87ceeb, 200, 400);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  visualizer = new Visualizer(scene);

  interactionManager = new InteractionManager(
    camera,
    renderer,
    visualizer,
    audioEngine,
    container,
    scene
  );

  clock = new THREE.Clock();

  window.addEventListener('resize', onWindowResize);

  document.addEventListener('click', () => {
    audioEngine.init();
  }, { once: true });

  animate();
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(): void {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.1);

  visualizer.update(deltaTime);
  interactionManager.update(deltaTime);

  renderer.render(scene, camera);

  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = now;
  }
}

window.addEventListener('DOMContentLoaded', init);
