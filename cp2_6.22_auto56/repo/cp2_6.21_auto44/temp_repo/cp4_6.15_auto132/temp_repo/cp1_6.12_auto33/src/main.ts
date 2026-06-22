import * as THREE from 'three';
import { TerrainRenderer, TerrainStats } from './TerrainRenderer';
import { InteractionController, CameraState } from './InteractionController';
import { UIOverlay } from './UIOverlay';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let terrainRenderer: TerrainRenderer;
let interactionController: InteractionController;
let uiOverlay: UIOverlay;
const clock = new THREE.Clock();

function init(): void {
  const container = document.getElementById('canvas-container')!;
  const app = document.getElementById('app')!;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 150, 300);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(60, 60, 60);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  terrainRenderer = new TerrainRenderer(scene);
  interactionController = new InteractionController(camera, renderer, terrainRenderer);

  interactionController.setOnCameraChange((state: CameraState) => {
    uiOverlay.updateCameraState(state);
  });

  uiOverlay = new UIOverlay(app);
  uiOverlay.setOnUpload((data: number[][], stats: TerrainStats) => {
    terrainRenderer.updateTerrain(data, stats);
  });

  window.addEventListener('resize', onWindowResize);

  uiOverlay.loadSampleData();

  animate();
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(): void {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();
  interactionController.update();
  terrainRenderer.update(deltaTime);
  renderer.render(scene, camera);
}

init();
