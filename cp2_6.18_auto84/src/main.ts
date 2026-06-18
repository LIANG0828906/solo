import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ImageParser } from './imageParser';
import { SceneBuilder } from './sceneBuilder';
import { InteractionManager } from './interaction';
import { UI } from './ui';

export interface SharedSceneState {
  buildings: BuildingData[];
  selectedBuildingId: number | null;
  cameraState: {
    position: THREE.Vector3;
    target: THREE.Vector3;
  };
}

export interface BuildingData {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: string;
}

const container = document.getElementById('canvas-container')!;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 18, 20);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 5;
controls.maxDistance = 80;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, 0, 0);

const sharedState: SharedSceneState = {
  buildings: [],
  selectedBuildingId: null,
  cameraState: {
    position: camera.position.clone(),
    target: controls.target.clone(),
  },
};

const imageParser = new ImageParser();
const sceneBuilder = new SceneBuilder();
const ui = new UI();

let currentBuildingMeshes: THREE.Mesh[] = [];
let groundMesh: THREE.Mesh | null = null;
let gridHelper: THREE.GridHelper | null = null;
let gridVisible = false;
let interactionManager: InteractionManager | null = null;

const initialCameraPos = new THREE.Vector3(20, 18, 20);
const initialTarget = new THREE.Vector3(0, 0, 0);

ui.onImageUploaded(async (imageElement: HTMLImageElement) => {
  const buildings = imageParser.parse(imageElement);
  sharedState.buildings = buildings;
  sharedState.selectedBuildingId = null;

  clearScene();

  const result = sceneBuilder.build(buildings);
  result.meshes.forEach((m) => scene.add(m));
  currentBuildingMeshes = result.buildingMeshes;
  groundMesh = result.groundMesh;

  gridHelper = new THREE.GridHelper(40, 40, 0x888888, 0x888888);
  gridHelper.position.y = 0.01;
  gridHelper.material.opacity = 0.3;
  gridHelper.material.transparent = true;
  gridHelper.visible = gridVisible;
  scene.add(gridHelper);

  if (interactionManager) {
    interactionManager.dispose();
  }
  interactionManager = new InteractionManager(
    camera,
    renderer.domElement,
    currentBuildingMeshes,
    sharedState,
  );
  interactionManager.onHover((id) => {
    sharedState.selectedBuildingId = id;
  });
  interactionManager.onClick((id, screenPos) => {
    if (id !== null) {
      const building = sharedState.buildings[id];
      if (building) {
        ui.showInfoCard(id, building.height, screenPos);
      }
    }
  });

  ui.hideUploadArea();

  animateCameraTo(initialCameraPos.clone(), initialTarget.clone());
});

ui.onResetView(() => {
  animateCameraTo(initialCameraPos.clone(), initialTarget.clone());
});

ui.onToggleGrid((visible) => {
  gridVisible = visible;
  if (gridHelper) {
    gridHelper.visible = visible;
  }
});

function clearScene() {
  currentBuildingMeshes.forEach((m) => {
    scene.remove(m);
    if (m.geometry) m.geometry.dispose();
    if ((m as THREE.Mesh).material) {
      const mat = (m as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((t) => t.dispose());
      else mat.dispose();
    }
  });
  if (groundMesh) {
    scene.remove(groundMesh);
    if (groundMesh.geometry) groundMesh.geometry.dispose();
    if (groundMesh.material) (groundMesh.material as THREE.Material).dispose();
  }
  if (gridHelper) {
    scene.remove(gridHelper);
  }
  currentBuildingMeshes = [];
  groundMesh = null;
  gridHelper = null;
}

let cameraAnimating = false;
let cameraAnimStart = 0;
let cameraFrom = new THREE.Vector3();
let cameraTo = new THREE.Vector3();
let targetFrom = new THREE.Vector3();
let targetTo = new THREE.Vector3();
const CAMERA_ANIM_DURATION = 800;

function animateCameraTo(pos: THREE.Vector3, target: THREE.Vector3) {
  cameraFrom.copy(camera.position);
  cameraTo.copy(pos);
  targetFrom.copy(controls.target);
  targetTo.copy(target);
  cameraAnimStart = performance.now();
  cameraAnimating = true;
}

function updateCameraAnimation(now: number) {
  if (!cameraAnimating) return;
  const elapsed = now - cameraAnimStart;
  let t = Math.min(elapsed / CAMERA_ANIM_DURATION, 1);
  t = 1 - Math.pow(1 - t, 3);
  camera.position.lerpVectors(cameraFrom, cameraTo, t);
  controls.target.lerpVectors(targetFrom, targetTo, t);
  if (t >= 1) cameraAnimating = false;
}

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  updateCameraAnimation(now);
  controls.update();
  sharedState.cameraState.position.copy(camera.position);
  sharedState.cameraState.target.copy(controls.target);
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
