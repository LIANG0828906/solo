import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createGalaxy, disposeGalaxy, GalaxyParams, DEFAULT_PARAMS } from './galaxy';
import { initControls } from './controls';

const container = document.getElementById('canvas-container')!;
const loadingScreen = document.getElementById('loading-screen')!;
const fpsCounter = document.getElementById('fps-counter')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0B0C10);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(4, 3, 5);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1;
controls.maxDistance = 20;

const initialCameraPos = camera.position.clone();
const initialCameraTarget = controls.target.clone();

renderer.domElement.addEventListener('dblclick', () => {
  camera.position.copy(initialCameraPos);
  controls.target.copy(initialCameraTarget);
  controls.update();
});

const raycaster = new THREE.Raycaster();
raycaster.params.Points!.threshold = 0.3;
const mouse = new THREE.Vector2(-9999, -9999);

renderer.domElement.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

renderer.domElement.addEventListener('mouseleave', () => {
  mouse.set(-9999, -9999);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let galaxyPoints: THREE.Points | null = null;
let galaxyMaterial: THREE.ShaderMaterial | null = null;
let currentParams: GalaxyParams = { ...DEFAULT_PARAMS };

function regenerateGalaxy(params: GalaxyParams) {
  if (galaxyPoints) {
    scene.remove(galaxyPoints);
    disposeGalaxy(galaxyPoints);
  }

  currentParams = params;
  const result = createGalaxy(params);
  galaxyPoints = result.points;
  galaxyMaterial = result.material;
  scene.add(galaxyPoints);
}

initControls(regenerateGalaxy);

regenerateGalaxy(DEFAULT_PARAMS);

setTimeout(() => {
  loadingScreen.classList.add('fade-out');
  setTimeout(() => {
    loadingScreen.remove();
  }, 800);
}, 1500);

let frameCount = 0;
let lastFpsTime = performance.now();
let fps = 0;

let time = 0;
let frameSkip = 0;

function animate() {
  requestAnimationFrame(animate);

  const particleCount = currentParams.count;
  const shouldSkip = particleCount >= 100000;

  if (shouldSkip) {
    frameSkip++;
    if (frameSkip % 2 !== 0 && particleCount >= 100000) {
      controls.update();
      renderer.render(scene, camera);
      updateFps();
      return;
    }
  }

  time += 0.016;

  if (galaxyMaterial) {
    galaxyMaterial.uniforms.uTime.value = time;
    galaxyMaterial.uniforms.uSpeed.value = currentParams.speed;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(galaxyPoints!);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      galaxyMaterial.uniforms.uHoverPoint.value.copy(point);
      galaxyMaterial.uniforms.uHoverActive.value = 1.0;
    } else {
      galaxyMaterial.uniforms.uHoverActive.value = 0.0;
    }
  }

  controls.update();
  renderer.render(scene, camera);
  updateFps();
}

function updateFps() {
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsTime = now;
    fpsCounter.textContent = `FPS: ${fps}`;
  }
}

animate();
