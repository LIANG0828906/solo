import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { cityModule } from './cityModule';
import { windModule } from './windModule';
import { pollutionModule } from './pollutionModule';
import { uiModule } from './uiModule';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let raycaster: THREE.Raycaster;
let pointer: THREE.Vector2;
let groundPlane: THREE.Plane;
let clock: THREE.Clock;

let prevCameraAngle = 0;
let vignetteOverlay: HTMLElement | null;

const AREA_SIZE = 120;

function init() {
  const container = document.getElementById('canvas-container')!;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);
  scene.fog = new THREE.FogExp2(0x0a0e1a, 0.006);

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(90, 70, 90);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 30;
  controls.maxDistance = 250;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(0, 10, 0);

  const ambient = new THREE.AmbientLight(0x335577, 0.6);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x6bb0ff, 0x0a0e1a, 0.5);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
  sun.position.set(60, 100, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 300;
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const rimLight = new THREE.DirectionalLight(0x4488ff, 0.5);
  rimLight.position.set(-60, 40, -60);
  scene.add(rimLight);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0a0e1a);
  const envLight1 = new THREE.PointLight(0x3388cc, 2, 500);
  envLight1.position.set(50, 100, 50);
  envScene.add(envLight1);
  const envLight2 = new THREE.PointLight(0x6644cc, 1.5, 500);
  envLight2.position.set(-50, 50, -50);
  envScene.add(envLight2);
  const envTex = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envTex;

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  clock = new THREE.Clock();

  vignetteOverlay = document.getElementById('vignette-overlay');

  cityModule.initCity(scene, 45);
  windModule.init(scene, AREA_SIZE);
  pollutionModule.init(scene, AREA_SIZE);

  uiModule.initUI(
    (params) => {
      if (params.direction !== undefined) {
        windModule.updateWind({ direction: params.direction });
        cityModule.updateWindHighlight(params.direction);
      }
    },
    (speed) => {
      windModule.updateWind({ speed });
    },
    (turb) => {
      windModule.updateWind({ turbulence: turb });
    }
  );

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('resize', onWindowResize);

  const hint = document.getElementById('info-hint');
  if (hint) {
    setTimeout(() => {
      hint.style.opacity = '0';
      setTimeout(() => hint.remove(), 600);
    }, 6000);
  }

  animate();
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return;
  if (event.target !== renderer.domElement) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const buildings = cityModule.getBuildings();
  const buildingHits = raycaster.intersectObjects(buildings, false);

  let intersectPoint = new THREE.Vector3();

  if (buildingHits.length > 0) {
    intersectPoint.copy(buildingHits[0].point);
    intersectPoint.y += 2;
  } else {
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
      intersectPoint.copy(hit);
      intersectPoint.y = 3 + Math.random() * 2;
    } else {
      return;
    }
  }

  intersectPoint.x = THREE.MathUtils.clamp(intersectPoint.x, -AREA_SIZE / 2.2, AREA_SIZE / 2.2);
  intersectPoint.z = THREE.MathUtils.clamp(intersectPoint.z, -AREA_SIZE / 2.2, AREA_SIZE / 2.2);

  const sources = pollutionModule.getSources();
  if (sources.length >= pollutionModule.getMaxSources()) {
    return;
  }

  const tooClose = sources.some(s => s.position.distanceTo(intersectPoint) < 6);
  if (tooClose) return;

  pollutionModule.addSource(intersectPoint, 5);
  uiModule.updateSourceList();
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateVignette(): void {
  if (!vignetteOverlay) return;

  const currentAngle = camera.rotation.y;
  let delta = Math.abs(currentAngle - prevCameraAngle);
  delta = Math.min(delta, 0.1);

  const currentTransform = vignetteOverlay.style.transform || 'scale(1)';
  const currentScale = parseFloat(currentTransform.replace(/[^\d.]/g, '')) || 1;

  if (delta > 0.002) {
    const targetScale = 1 + delta * 2.5;
    vignetteOverlay.style.transform = `scale(${targetScale})`;
    vignetteOverlay.style.transition = 'transform 0.4s ease-out';
  } else {
    vignetteOverlay.style.transform = 'scale(1)';
    vignetteOverlay.style.transition = 'transform 0.6s ease-out';
  }

  prevCameraAngle = currentAngle;
}

function animate(): void {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  controls.update();
  windModule.update(delta);
  pollutionModule.updateSources(delta, windModule);
  updateVignette();

  renderer.render(scene, camera);
}

init();
