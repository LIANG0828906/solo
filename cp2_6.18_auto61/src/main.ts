import * as THREE from 'three';
import { StarField } from './starField';
import { ConstellationManager } from './constellation';

const app = document.getElementById('app');
if (!app) throw new Error('App container not found');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a2e);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a2e);
app.appendChild(renderer.domElement);

const starField = new StarField(scene);
const constellationManager = new ConstellationManager(scene, camera);

let isDragging = false;
let isRightDragging = false;
let previousMousePosition = { x: 0, y: 0 };

let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;

let targetDistance = camera.position.length();
let currentDistance = targetDistance;
const minDistance = 2;
const maxDistance = 30;

let targetPanX = 0;
let targetPanY = 0;
let currentPanX = 0;
let currentPanY = 0;

const rotationSpeed = 0.003;
const zoomSpeed = 0.5;
const panSpeed = 0.01;
const damping = 0.95;

const center = new THREE.Vector3(0, 0, 0);

const fpsCounter = document.getElementById('fps-counter') as HTMLElement;
let frameCount = 0;
let lastFpsUpdate = performance.now();

const constellationInput = document.getElementById('constellation-input') as HTMLInputElement;
const saveButton = document.getElementById('save-button') as HTMLButtonElement;
const constellationItems = document.getElementById('constellation-items') as HTMLElement;

function updateConstellationList(): void {
  constellationItems.innerHTML = '';
  const constellations = constellationManager.getConstellations();
  const activeId = constellationManager.getActiveConstellationId();

  for (const [id, constellation] of constellations) {
    const item = document.createElement('div');
    item.className = 'constellation-item' + (id === activeId ? ' active' : '');
    item.innerHTML = `
      <span>${constellation.name}</span>
      <span class="delete-btn" title="删除">×</span>
    `;
    item.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('delete-btn')) {
        e.stopPropagation();
        constellationManager.deleteConstellation(id);
        updateConstellationList();
      } else {
        constellationManager.loadConstellation(id);
        updateConstellationList();
      }
    });
    constellationItems.appendChild(item);
  }
}

saveButton.addEventListener('click', () => {
  const name = constellationInput.value.trim();
  if (name) {
    const success = constellationManager.saveConstellation(name);
    if (success) {
      constellationInput.value = '';
      updateConstellationList();
    }
  }
});

constellationInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveButton.click();
  }
});

renderer.domElement.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  } else if (e.button === 2) {
    isRightDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
});

renderer.domElement.addEventListener('mouseup', (e) => {
  const wasDragging = isDragging || isRightDragging;
  const deltaX = Math.abs(e.clientX - previousMousePosition.x);
  const deltaY = Math.abs(e.clientY - previousMousePosition.y);

  if (e.button === 0 && wasDragging && deltaX < 3 && deltaY < 3) {
    constellationManager.handleClick(e, e.shiftKey);
  }

  isDragging = false;
  isRightDragging = false;
});

renderer.domElement.addEventListener('mousemove', (e) => {
  const deltaX = e.clientX - previousMousePosition.x;
  const deltaY = e.clientY - previousMousePosition.y;

  if (isDragging && !e.shiftKey) {
    targetRotationY += deltaX * rotationSpeed;
    targetRotationX += deltaY * rotationSpeed;
    targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));
  } else if (isRightDragging) {
    const panFactor = panSpeed * currentDistance / 10;
    targetPanX -= deltaX * panFactor;
    targetPanY += deltaY * panFactor;
  }

  previousMousePosition = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 1 : -1;
  targetDistance += delta * zoomSpeed;
  targetDistance = Math.max(minDistance, Math.min(maxDistance, targetDistance));
}, { passive: false });

renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    constellationManager.cancelConnectionSelection();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateConstellationList();

const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.1);

  currentRotationX += (targetRotationX - currentRotationX) * (1 - damping);
  currentRotationY += (targetRotationY - currentRotationY) * (1 - damping);

  currentDistance += (targetDistance - currentDistance) * (1 - damping);

  currentPanX += (targetPanX - currentPanX) * (1 - damping);
  currentPanY += (targetPanY - currentPanY) * (1 - damping);

  const quaternionX = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    currentRotationX
  );
  const quaternionY = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    currentRotationY
  );
  const quaternion = quaternionY.clone().multiply(quaternionX);

  const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
  const distanceVector = direction.multiplyScalar(currentDistance);

  const panOffset = new THREE.Vector3(currentPanX, currentPanY, 0);
  const rotatedPanOffset = panOffset.applyQuaternion(quaternion);

  camera.position.copy(center).add(rotatedPanOffset).add(distanceVector);
  camera.lookAt(center.clone().add(rotatedPanOffset));

  starField.update(deltaTime);
  constellationManager.update(deltaTime, camera);

  renderer.render(scene, camera);

  frameCount++;
  const now = performance.now();
  if (now - lastFpsUpdate >= 1000) {
    const fps = Math.round(frameCount * 1000 / (now - lastFpsUpdate));
    fpsCounter.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastFpsUpdate = now;
  }
}

animate();
