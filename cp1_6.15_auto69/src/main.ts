import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuildingModule } from './BuildingModule';
import { InteractionModule } from './InteractionModule';
import { UIModule } from './UIModule';
import type { HeatLevel } from './BuildingModule';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let buildingModule: BuildingModule;
let interactionModule: InteractionModule;
let uiModule: UIModule;
const clock = new THREE.Clock();
let lastTempUpdate = 0;
const TEMP_UPDATE_INTERVAL = 5;

function init(): void {
  const container = document.getElementById('scene-container')!;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 80, 180);

  camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(45, 35, 45);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 15;
  controls.maxDistance = 120;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 5, 0);

  setupLights();

  buildingModule = new BuildingModule(scene, camera);

  const infoPanel = document.getElementById('info-panel')!;
  interactionModule = new InteractionModule(buildingModule, infoPanel);

  uiModule = new UIModule({
    onTimeChange: handleTimeChange,
    onFilterChange: handleFilterChange,
  });

  setupInteraction(container);

  window.addEventListener('resize', onResize);

  loadDataAndStart();
}

function setupLights(): void {
  const ambient = new THREE.AmbientLight(0x404060, 0.55);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x1a1a2e, 0.35);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(40, 60, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.camera.left = -80;
  dirLight.shadow.camera.right = 80;
  dirLight.shadow.camera.top = 80;
  dirLight.shadow.camera.bottom = -80;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);
}

function setupInteraction(container: HTMLElement): void {
  let pointerDownPos: { x: number; y: number } | null = null;
  let pointerDownTime = 0;

  container.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return;
    pointerDownPos = { x: e.clientX, y: e.clientY };
    pointerDownTime = Date.now();
  });

  container.addEventListener('pointerup', (e: PointerEvent) => {
    if (e.button !== 0 || !pointerDownPos) return;
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    const dt = Date.now() - pointerDownTime;
    if (dx * dx + dy * dy < 25 && dt < 500) {
      const rect = container.getBoundingClientRect();
      buildingModule.handleClick(e.clientX, e.clientY, rect);
    }
    pointerDownPos = null;
  });
}

async function loadDataAndStart(): Promise<void> {
  try {
    const buildings = await InteractionModule.fetchBuildings();
    buildingModule.loadBuildings(buildings);

    const currentTime = uiModule.getCurrentTime();
    const tempData = await InteractionModule.fetchTemperatures(currentTime);
    buildingModule.updateTemperatures(tempData.buildings);

    animate();
  } catch (err) {
    console.error('Failed to load initial data:', err);
    const infoPanel = document.getElementById('info-panel')!;
    infoPanel.innerHTML = `
      <h2>连接错误</h2>
      <div style="color:#ff6666; padding:12px 0; font-size:14px;">
        无法连接到后端服务器。<br>
        请确保已运行 <code style="background:#2a2a4a;padding:2px 6px;border-radius:3px;">node server/index.js</code>
      </div>
    `;
  }
}

async function handleTimeChange(time: number): Promise<void> {
  try {
    const tempData = await InteractionModule.fetchTemperatures(time);
    buildingModule.updateTemperatures(tempData.buildings);
    interactionModule.refreshChart();
  } catch (err) {
    console.error('Failed to fetch temperatures:', err);
  }
}

function handleFilterChange(level: 'all' | HeatLevel): void {
  buildingModule.applyFilter(level);
}

function onResize(): void {
  const container = document.getElementById('scene-container')!;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

async function updateTemperatures(): Promise<void> {
  try {
    const currentTime = uiModule.getCurrentTime();
    const tempData = await InteractionModule.fetchTemperatures(currentTime);
    buildingModule.updateTemperatures(tempData.buildings);
  } catch (err) {
    console.error('Periodic temperature update failed:', err);
  }
}

function animate(): void {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  lastTempUpdate += delta;

  if (lastTempUpdate >= TEMP_UPDATE_INTERVAL) {
    lastTempUpdate = 0;
    updateTemperatures();
  }

  buildingModule.updateAnimations(delta);
  controls.update();
  renderer.render(scene, camera);
}

init();
