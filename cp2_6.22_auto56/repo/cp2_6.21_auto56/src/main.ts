import * as THREE from 'three';
import {
  setupScene,
  STAR_MASS,
  STAR_POSITION,
  adjustCameraForOrbit,
} from './sceneSetup';
import {
  createAsteroid,
  updateAsteroidPosition,
  removeAsteroid,
  type AsteroidObject,
} from './asteroidManager';
import {
  calcGravityAcceleration,
  integrateOrbitStep,
} from './physicsEngine';
import type { Vec3 } from './physicsEngine';
import { useStore } from './store';
import {
  initUIController,
  updateOrbitInfo,
  updateInfoPanel,
} from './uiController';

interface SceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  asteroidObjects: Map<string, AsteroidObject>;
  lastFrameTime: number;
  frameCount: number;
  fps: number;
  orbitSampleRate: number;
  sampleCounter: number;
  cameraTarget: THREE.Vector3;
  cameraAngle: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  cameraDistance: number;
  cameraHeight: number;
}

const state: SceneState = {
  scene: null as unknown as THREE.Scene,
  camera: null as unknown as THREE.PerspectiveCamera,
  renderer: null as unknown as THREE.WebGLRenderer,
  raycaster: new THREE.Raycaster(),
  mouse: new THREE.Vector2(),
  asteroidObjects: new Map(),
  lastFrameTime: performance.now(),
  frameCount: 0,
  fps: 60,
  orbitSampleRate: 1,
  sampleCounter: 0,
  cameraTarget: new THREE.Vector3(0, 0, 0),
  cameraAngle: Math.PI / 4,
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  cameraDistance: 35,
  cameraHeight: 18,
};

function vec3ToThree(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}



function setupInputHandlers(): void {
  const canvas = state.renderer.domElement;

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      state.raycaster.setFromCamera(state.mouse, state.camera);
      const meshes: THREE.Object3D[] = [];
      state.asteroidObjects.forEach((obj) => {
        meshes.push(obj.mesh);
        obj.mesh.children.forEach((c) => {
          if (c instanceof THREE.Sprite) {
            meshes.push(c);
          }
        });
      });

      const intersects = state.raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        let asteroidId: string | null = null;
        while (obj) {
          if (obj.userData && obj.userData.asteroidId) {
            asteroidId = obj.userData.asteroidId;
            break;
          }
          obj = obj.parent;
        }
        if (asteroidId) {
          useStore.getState().selectAsteroid(asteroidId);
          return;
        }
      }

      state.isDragging = true;
      state.dragStart = { x: e.clientX, y: e.clientY };
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (state.isDragging) {
      const dx = e.clientX - state.dragStart.x;
      state.cameraAngle += dx * 0.005;
      state.dragStart = { x: e.clientX, y: e.clientY };
    }
  });

  window.addEventListener('mouseup', () => {
    state.isDragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.cameraDistance = Math.max(15, Math.min(80, state.cameraDistance + e.deltaY * 0.03));
    state.cameraHeight = Math.max(5, Math.min(40, state.cameraHeight + e.deltaY * 0.015));
  }, { passive: false });

  window.addEventListener('click', (e) => {
    if (e.target === state.renderer.domElement || e.target === document.body) {
      state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      state.raycaster.setFromCamera(state.mouse, state.camera);
      const meshes: THREE.Object3D[] = [];
      state.asteroidObjects.forEach((obj) => {
        meshes.push(obj.mesh);
        obj.mesh.children.forEach((c) => {
          if (c instanceof THREE.Sprite) {
            meshes.push(c);
          }
        });
      });
      const intersects = state.raycaster.intersectObjects(meshes, true);
      if (intersects.length === 0) {
        useStore.getState().selectAsteroid(null);
      }
    }
  });
}

function animate(): void {
  requestAnimationFrame(animate);

  const now = performance.now();
  const deltaRaw = (now - state.lastFrameTime) / 1000;
  state.lastFrameTime = now;
  const dt = Math.min(deltaRaw, 0.05);

  state.frameCount++;
  if (state.frameCount % 30 === 0) {
    state.fps = 1 / deltaRaw;
    if (state.fps < 20) {
      state.orbitSampleRate = 2;
    } else if (state.fps > 35) {
      state.orbitSampleRate = 1;
    }
  }

  state.sampleCounter++;
  const shouldSample = state.sampleCounter % state.orbitSampleRate === 0;

  if (!state.isDragging) {
    state.camera.position.x = Math.cos(state.cameraAngle) * state.cameraDistance;
    state.camera.position.z = Math.sin(state.cameraAngle) * state.cameraDistance;
    state.camera.position.y = state.cameraHeight;
    state.camera.lookAt(state.cameraTarget);
  }

  const storeState = useStore.getState();
  const physicsDt = dt * 1.5;

  for (const asteroid of storeState.asteroids) {
    const obj = state.asteroidObjects.get(asteroid.id);
    if (!obj) continue;

    const acceleration = calcGravityAcceleration(
      asteroid.position,
      { x: STAR_POSITION.x, y: STAR_POSITION.y, z: STAR_POSITION.z },
      STAR_MASS
    );

    const result = integrateOrbitStep(
      asteroid.position,
      asteroid.velocity,
      acceleration,
      physicsDt
    );

    storeState.updateAsteroid(asteroid.id, {
      position: result.position,
      velocity: result.velocity,
    });

    const newPos = vec3ToThree(result.position);
    const newVel = vec3ToThree(result.velocity);

    updateAsteroidPosition(
      obj,
      newPos,
      newVel,
      STAR_POSITION,
      state.camera,
      storeState.selectedId === asteroid.id,
      shouldSample
    );

    const distFromOrigin = newPos.length();
    if (distFromOrigin > 80 || distFromOrigin < 2.2) {
      removeAsteroid(state.scene, obj);
      state.asteroidObjects.delete(asteroid.id);
      storeState.removeAsteroid(asteroid.id);
    }
  }

  updateOrbitInfo();
  updateInfoPanel();

  state.renderer.render(state.scene, state.camera);
}

function main(): void {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  const { scene, camera, renderer } = setupScene(container);
  state.scene = scene;
  state.camera = camera;
  state.renderer = renderer;

  setupInputHandlers();

  initUIController({
    onLaunch: (params) => {
      const obj = createAsteroid(
        state.scene,
        params.id,
        params.label,
        params.mass,
        params.position,
        params.velocity,
        params.orbitColor
      );
      state.asteroidObjects.set(params.id, obj);

      if (state.asteroidObjects.size === 1) {
        adjustCameraForOrbit(state.camera, params.position);
        state.cameraAngle = Math.atan2(params.position.z, params.position.x) - Math.PI / 2;
      }
    },
  });

  animate();
}

document.addEventListener('DOMContentLoaded', main);
