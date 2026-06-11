import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleSystem } from './particleSystem';
import { GravityNode } from './gravityNode';
import { UIController } from './uiControl';

const container = document.getElementById('app')!;

const scene = new THREE.Scene();

const bgCanvas = document.createElement('canvas');
bgCanvas.width = 2;
bgCanvas.height = 512;
const bgCtx = bgCanvas.getContext('2d')!;
const gradient = bgCtx.createLinearGradient(0, 0, 0, 512);
gradient.addColorStop(0, '#0A0515');
gradient.addColorStop(1, '#050510');
bgCtx.fillStyle = gradient;
bgCtx.fillRect(0, 0, 2, 512);
const bgTexture = new THREE.CanvasTexture(bgCanvas);
scene.background = bgTexture;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.minDistance = 2;
controls.maxDistance = 30;
controls.enablePan = true;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN
};

const startColor = new THREE.Color(0x4422FF);
const endColor = new THREE.Color(0xFF66AA);
const particleSystem = new ParticleSystem(scene, 5000, startColor, endColor);
const gravityNodes: GravityNode[] = [];
const uiController = new UIController(particleSystem);

let gKeyDown = false;
let placingGravityNode = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const planeNormal = new THREE.Vector3();
const plane = new THREE.Plane();
const intersectionPoint = new THREE.Vector3();

window.addEventListener('keydown', (e) => {
  if (e.key === 'g' || e.key === 'G') {
    gKeyDown = true;
    placingGravityNode = true;
    renderer.domElement.style.cursor = 'crosshair';
  }
  if (e.key === 'r' || e.key === 'R') {
    uiController.toggle();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'g' || e.key === 'G') {
    gKeyDown = false;
    placingGravityNode = false;
    renderer.domElement.style.cursor = 'default';
  }
});

renderer.domElement.addEventListener('mousedown', (e) => {
  if (!placingGravityNode || e.button !== 0) return;

  e.stopPropagation();
  e.preventDefault();

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  planeNormal.copy(camera.position).normalize();
  plane.setFromNormalAndCoplanarPoint(planeNormal, new THREE.Vector3(0, 0, 0));

  const intersected = raycaster.ray.intersectPlane(plane, intersectionPoint);
  if (intersected) {
    const node = new GravityNode(intersectionPoint, scene);
    gravityNodes.push(node);
  }
}, true);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = performance.now();
let frameCount = 0;
let fps = 60;
let fpsTimer = 0;

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const deltaTime = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  frameCount++;
  fpsTimer += deltaTime;
  if (fpsTimer >= 0.5) {
    fps = frameCount / fpsTimer;
    frameCount = 0;
    fpsTimer = 0;
  }

  controls.update();

  for (const node of gravityNodes) {
    node.update(deltaTime);
  }

  particleSystem.update(deltaTime, gravityNodes);

  uiController.updateStatus(
    particleSystem.getParticleCount(),
    fps,
    gravityNodes.length
  );

  renderer.render(scene, camera);
}

animate();
