import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildCity, updateBlockData, getBlockByMesh, highlightBlock, removeHighlight, getCityGroup } from './cityModel';
import { initController } from './heatmapController';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let selectedBlock: { row: number; col: number } | null = null;

let lastTime = performance.now();
let frameCount = 0;
let fps = 60;

const clock = new THREE.Clock();

export function getScene(): THREE.Scene {
  return scene;
}

export function getCamera(): THREE.PerspectiveCamera {
  return camera;
}

export function getRaycaster(): THREE.Raycaster {
  return raycaster;
}

export function getMouse(): THREE.Vector2 {
  return mouse;
}

export function setSelectedBlock(block: { row: number; col: number } | null): void {
  if (selectedBlock) {
    removeHighlight(selectedBlock.row, selectedBlock.col);
  }
  selectedBlock = block;
  if (block) {
    highlightBlock(block.row, block.col);
  }
}

export function getSelectedBlock(): { row: number; col: number } | null {
  return selectedBlock;
}

function init(): void {
  const container = document.getElementById('scene-container') as HTMLElement;
  const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(60, 60, 60);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 20;
  controls.maxDistance = 150;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.target.set(0, 5, 0);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  setupLights();
  setupGround();
  buildCity(scene, generateInitialData());
  initController();
  setupEventListeners();
  animate();
}

function setupLights(): void {
  const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 80, 30);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.camera.left = -80;
  directionalLight.shadow.camera.right = 80;
  directionalLight.shadow.camera.top = 80;
  directionalLight.shadow.camera.bottom = -80;
  scene.add(directionalLight);

  const neonLight1 = new THREE.PointLight(0x00d4ff, 1, 80, 2);
  neonLight1.position.set(-30, 20, -30);
  scene.add(neonLight1);

  const neonLight2 = new THREE.PointLight(0xff00ff, 0.8, 80, 2);
  neonLight2.position.set(30, 15, 30);
  scene.add(neonLight2);

  const neonLight3 = new THREE.PointLight(0x00ff88, 0.6, 60, 2);
  neonLight3.position.set(0, 30, 0);
  scene.add(neonLight3);
}

function setupGround(): void {
  const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a1a,
    roughness: 0.9,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const gridHelper = new THREE.GridHelper(100, 50, 0x00d4ff, 0x1a3a5c);
  gridHelper.position.y = 0.01;
  (gridHelper.material as THREE.Material).opacity = 0.3;
  (gridHelper.material as THREE.Material).transparent = true;
  scene.add(gridHelper);

  const outerGridHelper = new THREE.GridHelper(200, 20, 0x533483, 0x2a2a4a);
  outerGridHelper.position.y = 0.02;
  (outerGridHelper.material as THREE.Material).opacity = 0.15;
  (outerGridHelper.material as THREE.Material).transparent = true;
  scene.add(outerGridHelper);
}

function generateInitialData(): number[][] {
  const data: number[][] = [];
  for (let i = 0; i < 8; i++) {
    data[i] = [];
    for (let j = 0; j < 8; j++) {
      data[i][j] = Math.floor(Math.random() * 60) + 20;
    }
  }
  return data;
}

function setupEventListeners(): void {
  const container = document.getElementById('scene-container') as HTMLElement;

  window.addEventListener('resize', onWindowResize);
  container.addEventListener('click', onMouseClick);
}

function onWindowResize(): void {
  const container = document.getElementById('scene-container') as HTMLElement;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function onMouseClick(event: MouseEvent): void {
  const container = document.getElementById('scene-container') as HTMLElement;
  const rect = container.getBoundingClientRect();
  
  mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  const cityGroup = getCityGroup();
  const buildingMeshes: THREE.Mesh[] = [];
  
  cityGroup.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData.isBuilding) {
      buildingMeshes.push(child);
    }
  });

  const intersects = raycaster.intersectObjects(buildingMeshes);

  if (intersects.length > 0) {
    const block = getBlockByMesh(intersects[0].object as THREE.Mesh);
    if (block) {
      const infoCard = document.getElementById('info-card') as HTMLElement;
      const blockNameEl = document.getElementById('block-name') as HTMLElement;
      const flowValueEl = document.getElementById('flow-value') as HTMLElement;
      const flowStatusEl = document.getElementById('flow-status') as HTMLElement;

      setSelectedBlock(block);
      
      const rowLabel = String.fromCharCode(65 + block.row);
      const colLabel = (block.col + 1).toString().padStart(2, '0');
      blockNameEl.textContent = `街区 ${rowLabel}-${colLabel}`;
      
      const flowData = block.flow ?? 50;
      flowValueEl.textContent = Math.round(flowData).toString();
      
      flowStatusEl.className = 'info-status';
      if (flowData < 40) {
        flowStatusEl.classList.add('smooth');
        flowStatusEl.textContent = '畅通';
      } else if (flowData < 70) {
        flowStatusEl.classList.add('moderate');
        flowStatusEl.textContent = '缓行';
      } else {
        flowStatusEl.classList.add('congested');
        flowStatusEl.textContent = '拥堵';
      }

      const cardX = Math.min(event.clientX - rect.left + 20, container.clientWidth - 340);
      const cardY = Math.min(event.clientY - rect.top + 20, container.clientHeight - 280);
      
      infoCard.style.left = `${Math.max(20, cardX)}px`;
      infoCard.style.top = `${Math.max(20, cardY)}px`;
      infoCard.classList.add('visible');
    }
  }
}

function animate(): void {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  controls.update();
  updateBlockData(delta);

  const cityGroup = getCityGroup();
  cityGroup.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData.heatColumn) {
      const targetHeight = child.userData.targetHeight || 10;
      const currentHeight = child.scale.y;
      child.scale.y += (targetHeight - currentHeight) * delta * 3;
      child.position.y = (child.scale.y * child.userData.baseHeight) / 2 + (child.userData.buildingHeight || 20);
    }
    
    if (child instanceof THREE.Mesh && child.userData.isBuilding) {
      const targetColor = child.userData.targetColor;
      if (targetColor) {
        const material = child.material as THREE.MeshStandardMaterial;
        material.color.lerp(targetColor, delta * 3);
        if (material.emissive) {
          material.emissive.lerp(targetColor.clone().multiplyScalar(0.2), delta * 3);
        }
      }
    }

    if (child instanceof THREE.Mesh && child.userData.glowRing) {
      const time = clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 4) * 0.5;
      child.scale.set(scale, 1, scale);
      const material = child.material as THREE.MeshBasicMaterial;
      material.opacity = 0.6 + Math.sin(time * 4) * 0.3;
    }
  });

  renderer.render(scene, camera);

  updateFPS();
}

function updateFPS(): void {
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    fps = Math.round(frameCount * 1000 / (now - lastTime));
    const fpsElement = document.getElementById('fps-value');
    if (fpsElement) {
      fpsElement.textContent = fps.toString();
    }
    frameCount = 0;
    lastTime = now;
  }
}

init();

export { updateBlockData };
