import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

export function initScene(container: HTMLElement): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
} {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a14);
  scene.fog = new THREE.FogExp2(0x0a0a14, 0.008);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(25, 30, 35);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 10;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffeedd, 0.8);
  directionalLight.position.set(30, 50, 20);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 150;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  scene.add(directionalLight);

  const hemisphereLight = new THREE.HemisphereLight(0x4466aa, 0x223322, 0.3);
  scene.add(hemisphereLight);

  createGround();
  createGrid();
  createGreenPatches();

  window.addEventListener('resize', onWindowResize);

  return { scene, camera, renderer, controls };
}

function createGround(): void {
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2a,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);
}

function createGrid(): void {
  const gridSize = 80;
  const divisions = 40;
  const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x2a2a4a, 0x1e1e36);
  gridHelper.position.y = 0;
  scene.add(gridHelper);
}

function createGreenPatches(): void {
  const patchCount = 25;
  const spread = 35;

  for (let i = 0; i < patchCount; i++) {
    const w = 0.5 + Math.random() * 2;
    const h = 0.5 + Math.random() * 2;
    const geo = new THREE.PlaneGeometry(w, h);
    const shade = 0.15 + Math.random() * 0.15;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shade * 0.5, shade + 0.15, shade * 0.3),
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    const patch = new THREE.Mesh(geo, mat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(
      (Math.random() - 0.5) * spread,
      0.01,
      (Math.random() - 0.5) * spread
    );
    patch.receiveShadow = true;
    scene.add(patch);
  }
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function getScene(): THREE.Scene { return scene; }
export function getCamera(): THREE.PerspectiveCamera { return camera; }
export function getRenderer(): THREE.WebGLRenderer { return renderer; }
export function getControls(): OrbitControls { return controls; }
