import * as THREE from 'three';
import { createPlant, updatePlant, getState } from './plant';
import type { PlantState } from './plant';
import { initGeneEditor } from './geneEditor';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let clock: THREE.Clock;
let plantState: PlantState;

function init(): void {
  const container = document.getElementById('canvas-container')!;

  scene = new THREE.Scene();

  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = 2;
  bgCanvas.height = 256;
  const bgCtx = bgCanvas.getContext('2d')!;
  const gradient = bgCtx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#E0F0FF');
  gradient.addColorStop(1, '#B8D8F0');
  bgCtx.fillStyle = gradient;
  bgCtx.fillRect(0, 0, 2, 256);
  const bgTexture = new THREE.CanvasTexture(bgCanvas);
  bgTexture.colorSpace = THREE.SRGBColorSpace;
  scene.background = bgTexture;

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(5, 6, 10);
  camera.lookAt(0, 3, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3);
  fillLight.position.set(-5, 3, -5);
  scene.add(fillLight);

  const groundGeometry = new THREE.CircleGeometry(10, 32);
  const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0x8B4513,
    transparent: true,
    opacity: 0.3
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.01;
  scene.add(ground);

  createPlant(scene);

  plantState = getState();
  initGeneEditor(plantState);

  clock = new THREE.Clock();

  window.addEventListener('resize', onWindowResize);

  animate();
}

function onWindowResize(): void {
  const w = Math.max(800, window.innerWidth);
  const h = Math.max(600, window.innerHeight);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function animate(): void {
  requestAnimationFrame(animate);

  const delta = clock.getDelta() * 1000;

  updatePlant(delta, plantState);

  const time = clock.getElapsedTime();
  camera.position.x = 10 * Math.sin(time * 0.1);
  camera.position.z = 10 * Math.cos(time * 0.1);
  camera.lookAt(0, 3, 0);

  renderer.render(scene, camera);
}

init();
