import * as THREE from 'three';
import { createNebula } from './nebula';
import { createUI } from './ui';
import type { NebulaParams } from './types';

const app = document.getElementById('app')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
app.appendChild(renderer.domElement);

const initialParams: NebulaParams = {
  density: 50,
  colorPalette: 'rainbow',
  turbulence: 2.0,
  particleCount: 75000,
};

const nebula = createNebula(initialParams);
scene.add(nebula.points);

const ui = createUI({
  density: initialParams.density,
  colorPalette: initialParams.colorPalette,
  turbulence: initialParams.turbulence,
});
document.body.appendChild(ui.container);
document.body.appendChild(ui.fpsCounter);
document.body.appendChild(ui.modeIndicator);

let updateTimer: number | null = null;
let pendingParams: Partial<NebulaParams> = {};

ui.onParamsChange((params) => {
  pendingParams = { ...pendingParams, ...params };
  if (updateTimer === null) {
    updateTimer = window.setTimeout(() => {
      nebula.updateParams(pendingParams);
      pendingParams = {};
      updateTimer = null;
    }, 300);
  }
});

type CameraMode = 'orbit' | 'fly';
let cameraMode: CameraMode = 'orbit';

const orbitState = {
  theta: 0,
  phi: Math.PI / 2,
  radius: 25,
  target: new THREE.Vector3(0, 0, 0),
};

const flyState = {
  position: new THREE.Vector3(0, 0, 25),
  yaw: Math.PI,
  pitch: 0,
};

const keys = new Set<string>();
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

const modeTransition = {
  active: false,
  duration: 0.5,
  progress: 1,
  fromPos: new THREE.Vector3(),
  toPos: new THREE.Vector3(),
  fromQuat: new THREE.Quaternion(),
  toQuat: new THREE.Quaternion(),
};

function updateOrbitCamera(delta: number) {
  const moveSpeed = 5 * delta;
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  if (keys.has('KeyW')) {
    orbitState.target.addScaledVector(forward, moveSpeed);
  }
  if (keys.has('KeyS')) {
    orbitState.target.addScaledVector(forward, -moveSpeed);
  }
  if (keys.has('KeyA')) {
    orbitState.target.addScaledVector(right, -moveSpeed);
  }
  if (keys.has('KeyD')) {
    orbitState.target.addScaledVector(right, moveSpeed);
  }

  const x = orbitState.target.x + orbitState.radius * Math.sin(orbitState.phi) * Math.sin(orbitState.theta);
  const y = orbitState.target.y + orbitState.radius * Math.cos(orbitState.phi);
  const z = orbitState.target.z + orbitState.radius * Math.sin(orbitState.phi) * Math.cos(orbitState.theta);

  camera.position.set(x, y, z);
  camera.lookAt(orbitState.target);
}

function updateFlyCamera(delta: number) {
  const moveSpeed = 5 * delta;
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  if (keys.has('KeyW')) {
    flyState.position.addScaledVector(forward, moveSpeed);
  }
  if (keys.has('KeyS')) {
    flyState.position.addScaledVector(forward, -moveSpeed);
  }
  if (keys.has('KeyA')) {
    flyState.position.addScaledVector(right, -moveSpeed);
  }
  if (keys.has('KeyD')) {
    flyState.position.addScaledVector(right, moveSpeed);
  }

  camera.position.copy(flyState.position);
  camera.rotation.order = 'YXZ';
  camera.rotation.set(flyState.pitch, flyState.yaw, 0);
}

function switchMode() {
  modeTransition.fromPos.copy(camera.position);
  modeTransition.fromQuat.copy(camera.quaternion);

  if (cameraMode === 'orbit') {
    cameraMode = 'fly';
    flyState.position.copy(camera.position);
    flyState.yaw = camera.rotation.y;
    flyState.pitch = camera.rotation.x;

    const euler = new THREE.Euler(0, flyState.yaw, flyState.pitch, 'YXZ');
    modeTransition.toQuat.setFromEuler(euler);
    modeTransition.toPos.copy(flyState.position);
  } else {
    cameraMode = 'orbit';
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    orbitState.target.copy(camera.position).addScaledVector(dir, orbitState.radius * 0.5);
    orbitState.radius = 25;

    const tempCam = new THREE.PerspectiveCamera();
    tempCam.position.set(
      orbitState.target.x + orbitState.radius * Math.sin(orbitState.phi) * Math.sin(orbitState.theta),
      orbitState.target.y + orbitState.radius * Math.cos(orbitState.phi),
      orbitState.target.z + orbitState.radius * Math.sin(orbitState.phi) * Math.cos(orbitState.theta)
    );
    tempCam.lookAt(orbitState.target);
    modeTransition.toPos.copy(tempCam.position);
    modeTransition.toQuat.copy(tempCam.quaternion);
  }

  ui.setMode(cameraMode);
  modeTransition.active = true;
  modeTransition.progress = 0;
}

renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  if (cameraMode === 'orbit' && !modeTransition.active) {
    orbitState.theta -= dx * 0.005;
    orbitState.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbitState.phi - dy * 0.005));
  } else if (cameraMode === 'fly' && !modeTransition.active) {
    flyState.yaw -= dx * 0.002;
    flyState.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, flyState.pitch - dy * 0.002));
  }
});

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (cameraMode === 'orbit') {
    orbitState.radius = Math.max(5, Math.min(50, orbitState.radius + e.deltaY * 0.02));
  }
}, { passive: false });

window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'Space') {
    e.preventDefault();
    if (!modeTransition.active) {
      switchMode();
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

camera.position.set(0, 0, 25);
camera.lookAt(0, 0, 0);

const clock = new THREE.Clock();
let elapsed = 0;

let frameCount = 0;
let fpsTimer = 0;
let currentFps = 60;
let smoothedFps = 60;
let lastReduceTime = -5;
let lowFpsCount = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);
  elapsed += delta;

  frameCount++;
  fpsTimer += delta;
  if (fpsTimer >= 0.5) {
    currentFps = frameCount / fpsTimer;
    smoothedFps = smoothedFps * 0.7 + currentFps * 0.3;
    ui.setFPS(smoothedFps);
    frameCount = 0;
    fpsTimer = 0;

    const particleCount = nebula.getCurrentParticleCount();
    if (smoothedFps < 30 && particleCount > 20000) {
      lowFpsCount++;
      if (lowFpsCount >= 2 && elapsed - lastReduceTime > 2) {
        nebula.reduceParticles(0.2);
        lastReduceTime = elapsed;
        lowFpsCount = 0;
      }
    } else if (smoothedFps >= 30) {
      lowFpsCount = 0;
    }
  }

  if (modeTransition.active) {
    modeTransition.progress = Math.min(1, modeTransition.progress + delta / modeTransition.duration);
    const t = modeTransition.progress;
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    camera.position.lerpVectors(modeTransition.fromPos, modeTransition.toPos, easeT);
    camera.quaternion.slerpQuaternions(modeTransition.fromQuat, modeTransition.toQuat, easeT);

    if (modeTransition.progress >= 1) {
      modeTransition.active = false;
    }
  } else {
    if (cameraMode === 'orbit') {
      updateOrbitCamera(delta);
    } else {
      updateFlyCamera(delta);
    }
  }

  nebula.animate(delta, elapsed);

  renderer.render(scene, camera);
}

animate();
