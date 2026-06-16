import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createParticleSystem, SpinState } from './particleSystem';
import { createEntanglementMeter } from './entanglementMeter';
import { createUIController } from './uiController';

const container = document.getElementById('canvas-container')!;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 15;
controls.minPolarAngle = Math.PI * 0.2;
controls.maxPolarAngle = Math.PI * 0.8;
controls.enablePan = false;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x9b59b6, 1, 20);
pointLight1.position.set(-3, 2, 3);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x1abc9c, 1, 20);
pointLight2.position.set(3, 2, 3);
scene.add(pointLight2);

const particleSystem = createParticleSystem(scene);

const meter = createEntanglementMeter('meter-canvas');

function handleSpinChange(particleIndex: number, spinState: SpinState): void {
  particleSystem.setSpin(particleIndex, spinState);
  particleSystem.triggerPulse(particleIndex);
}

let entanglementValue = 75;

function handleEntanglementChange(delta: number): void {
  entanglementValue = Math.max(0, Math.min(100, entanglementValue + delta));
  meter.update(entanglementValue);
}

const uiController = createUIController({
  camera,
  renderer,
  particles: particleSystem.particles,
  onSpinChange: handleSpinChange,
  onEntanglementChange: handleEntanglementChange
});

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  meter.resize();
}

window.addEventListener('resize', onWindowResize);

const clock = new THREE.Clock();
let time = 0;

function animate(): void {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  time += delta;
  
  particleSystem.update(delta, time);
  
  controls.update();
  
  uiController.update();
  
  renderer.render(scene, camera);
}

animate();
