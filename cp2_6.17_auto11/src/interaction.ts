import * as THREE from 'three';
import { SceneState, getCloudClusters, getClusterBoundingSphere, triggerDiffusion } from './scene';

export interface CameraState {
  targetTheta: number;
  targetPhi: number;
  targetDistance: number;
  currentTheta: number;
  currentPhi: number;
  currentDistance: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}



const SMOOTHING = 1 - Math.pow(0.001, 1 / 60);

let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let cameraState: CameraState;
let currentState: SceneState;
let stateChangeCallback: ((state: SceneState) => void) | null = null;
let targetState: SceneState;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;

let sliderDampingTimer: number | null = null;
const SLIDER_DAMPING_DELAY = 100;

export function setupControls(
  cam: THREE.PerspectiveCamera,
  rend: THREE.WebGLRenderer,
  initialState: SceneState,
  onStateChange: (state: SceneState) => void
): void {
  camera = cam;
  renderer = rend;
  currentState = { ...initialState };
  targetState = { ...initialState };
  stateChangeCallback = onStateChange;
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  cameraState = {
    targetTheta: Math.PI / 4,
    targetPhi: Math.PI / 3,
    targetDistance: 15,
    currentTheta: Math.PI / 4,
    currentPhi: Math.PI / 3,
    currentDistance: 15,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  };

  bindMouseEvents();
  bindTouchEvents();
  bindControlPanel();
  updateCameraPosition();
}

function bindMouseEvents(): void {
  const canvas = renderer.domElement;

  canvas.addEventListener('mousedown', (e) => {
    cameraState.isDragging = true;
    cameraState.lastMouseX = e.clientX;
    cameraState.lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!cameraState.isDragging) return;

    const deltaX = e.clientX - cameraState.lastMouseX;
    const deltaY = e.clientY - cameraState.lastMouseY;

    cameraState.targetTheta -= deltaX * 0.005;
    cameraState.targetPhi -= deltaY * 0.005;
    cameraState.targetPhi = Math.max(Math.PI / 6, Math.min(Math.PI / 2 - 0.01, cameraState.targetPhi));

    cameraState.lastMouseX = e.clientX;
    cameraState.lastMouseY = e.clientY;
  });

  document.addEventListener('mouseup', () => {
    if (cameraState.isDragging) {
      cameraState.isDragging = false;
      canvas.style.cursor = 'grab';
    }
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraState.targetDistance += e.deltaY * 0.01;
    cameraState.targetDistance = Math.max(5, Math.min(30, cameraState.targetDistance));
  }, { passive: false });

  canvas.addEventListener('click', (e) => {
    if (cameraState.isDragging) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const clusters = getCloudClusters();
    let hitIndex = -1;
    let minDist = Infinity;

    for (let i = 0; i < clusters.length; i++) {
      const sphere = getClusterBoundingSphere(i);
      if (!sphere) continue;

      const intersects = raycaster.ray.intersectSphere(sphere, new THREE.Vector3());
      if (intersects) {
        const dist = camera.position.distanceTo(sphere.center);
        if (dist < minDist) {
          minDist = dist;
          hitIndex = i;
        }
      }
    }

    if (hitIndex >= 0) {
      triggerDiffusion(hitIndex);
    }
  });

  canvas.style.cursor = 'grab';
}

function bindTouchEvents(): void {
  const canvas = renderer.domElement;
  let lastTouchDistance = 0;
  let touchStartTime = 0;
  let touchStartPos = { x: 0, y: 0 };

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      cameraState.isDragging = true;
      cameraState.lastMouseX = e.touches[0].clientX;
      cameraState.lastMouseY = e.touches[0].clientY;
      touchStartTime = Date.now();
      touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && cameraState.isDragging) {
      const deltaX = e.touches[0].clientX - cameraState.lastMouseX;
      const deltaY = e.touches[0].clientY - cameraState.lastMouseY;

      cameraState.targetTheta -= deltaX * 0.005;
      cameraState.targetPhi -= deltaY * 0.005;
      cameraState.targetPhi = Math.max(Math.PI / 6, Math.min(Math.PI / 2 - 0.01, cameraState.targetPhi));

      cameraState.lastMouseX = e.touches[0].clientX;
      cameraState.lastMouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (lastTouchDistance > 0) {
        const delta = lastTouchDistance - distance;
        cameraState.targetDistance += delta * 0.05;
        cameraState.targetDistance = Math.max(5, Math.min(30, cameraState.targetDistance));
      }
      lastTouchDistance = distance;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      if (cameraState.isDragging) {
        const touchDuration = Date.now() - touchStartTime;
        const touchEndPos = { x: cameraState.lastMouseX, y: cameraState.lastMouseY };
        const moveDistance = Math.sqrt(
          Math.pow(touchEndPos.x - touchStartPos.x, 2) +
          Math.pow(touchEndPos.y - touchStartPos.y, 2)
        );

        if (touchDuration < 300 && moveDistance < 10) {
          const rect = canvas.getBoundingClientRect();
          mouse.x = ((touchEndPos.x - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((touchEndPos.y - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const clusters = getCloudClusters();
          let hitIndex = -1;
          let minDist = Infinity;

          for (let i = 0; i < clusters.length; i++) {
            const sphere = getClusterBoundingSphere(i);
            if (!sphere) continue;
            const intersects = raycaster.ray.intersectSphere(sphere, new THREE.Vector3());
            if (intersects) {
              const dist = camera.position.distanceTo(sphere.center);
              if (dist < minDist) {
                minDist = dist;
                hitIndex = i;
              }
            }
          }

          if (hitIndex >= 0) {
            triggerDiffusion(hitIndex);
          }
        }

        cameraState.isDragging = false;
      }
      lastTouchDistance = 0;
    }
  }, { passive: false });
}

function bindControlPanel(): void {
  const densitySlider = document.getElementById('density-slider') as HTMLInputElement;
  const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
  const colorSlider = document.getElementById('color-slider') as HTMLInputElement;
  const densityValue = document.getElementById('density-value') as HTMLElement;
  const speedValue = document.getElementById('speed-value') as HTMLElement;
  const colorValue = document.getElementById('color-value') as HTMLElement;
  const legendToggle = document.getElementById('legend-toggle') as HTMLElement;
  const legendCard = document.getElementById('legend-card') as HTMLElement;

  densitySlider.addEventListener('input', () => {
    const value = parseFloat(densitySlider.value);
    densityValue.textContent = value.toFixed(1) + 'x';
    targetState.densityMultiplier = value;
    scheduleStateUpdate();
  });

  speedSlider.addEventListener('input', () => {
    const value = parseFloat(speedSlider.value);
    speedValue.textContent = value.toFixed(1);
    targetState.driftSpeed = value;
    scheduleStateUpdate();
  });

  colorSlider.addEventListener('input', () => {
    const value = parseFloat(colorSlider.value);
    colorValue.textContent = value.toFixed(1);
    targetState.colorSpeed = value;
    scheduleStateUpdate();
  });

  legendToggle.addEventListener('click', () => {
    legendCard.classList.toggle('visible');
  });
}

function scheduleStateUpdate(): void {
  if (sliderDampingTimer !== null) {
    clearTimeout(sliderDampingTimer);
  }

  sliderDampingTimer = window.setTimeout(() => {
    if (stateChangeCallback) {
      currentState = { ...targetState };
      stateChangeCallback(currentState);
    }
    sliderDampingTimer = null;
  }, SLIDER_DAMPING_DELAY);
}

export function updateCamera(deltaTime: number): void {
  const smoothingFactor = Math.min(1, SMOOTHING * deltaTime * 60);

  cameraState.currentTheta += (cameraState.targetTheta - cameraState.currentTheta) * smoothingFactor;
  cameraState.currentPhi += (cameraState.targetPhi - cameraState.currentPhi) * smoothingFactor;
  cameraState.currentDistance += (cameraState.targetDistance - cameraState.currentDistance) * smoothingFactor;

  updateCameraPosition();

  currentState.densityMultiplier += (targetState.densityMultiplier - currentState.densityMultiplier) * 0.05;
  currentState.driftSpeed += (targetState.driftSpeed - currentState.driftSpeed) * 0.05;
  currentState.colorSpeed += (targetState.colorSpeed - currentState.colorSpeed) * 0.05;
}

function updateCameraPosition(): void {
  const { currentTheta, currentPhi, currentDistance } = cameraState;

  camera.position.x = currentDistance * Math.sin(currentPhi) * Math.cos(currentTheta);
  camera.position.y = currentDistance * Math.cos(currentPhi);
  camera.position.z = currentDistance * Math.sin(currentPhi) * Math.sin(currentTheta);

  camera.lookAt(0, 0, 0);
}

export function getCurrentState(): SceneState {
  return currentState;
}
