import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useStore, PlantData } from './store';
import { Plant } from './plant';
import { WindSystem } from './wind';
import { createUI } from './ui';

const GROUND_SIZE = 40;

const container = document.getElementById('canvas-container')!;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(8, 6, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.mouseButtons = {
  LEFT: null as unknown as THREE.MOUSE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE,
};
controls.minDistance = 3;
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
dirLight.position.set(10, 15, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.4);
scene.add(hemiLight);

const skyGeom = new THREE.SphereGeometry(80, 32, 32);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    topColor: { value: new THREE.Color(0x87ceeb) },
    bottomColor: { value: new THREE.Color(0xe8f4f8) },
    offset: { value: 10 },
    exponent: { value: 0.6 },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `,
});
const sky = new THREE.Mesh(skyGeom, skyMat);
scene.add(sky);

const groundCanvas = document.createElement('canvas');
groundCanvas.width = 512;
groundCanvas.height = 512;
const ctx = groundCanvas.getContext('2d')!;
ctx.fillStyle = '#7cb342';
ctx.fillRect(0, 0, 512, 512);
ctx.strokeStyle = 'rgba(0,0,0,0.06)';
ctx.lineWidth = 1;
for (let i = 0; i <= 512; i += 16) {
  ctx.beginPath();
  ctx.moveTo(i, 0);
  ctx.lineTo(i, 512);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, i);
  ctx.lineTo(512, i);
  ctx.stroke();
}
const groundTexture = new THREE.CanvasTexture(groundCanvas);
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(8, 8);
const groundGeom = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
const groundMat = new THREE.MeshStandardMaterial({
  map: groundTexture,
  roughness: 0.9,
  metalness: 0.0,
});
const ground = new THREE.Mesh(groundGeom, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.name = 'ground';
scene.add(ground);

const windSystem = new WindSystem();
const plants: Map<string, Plant> = new Map();
const ui = createUI();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };
let isDragging = false;

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
  isDragging = false;
});

renderer.domElement.addEventListener('pointermove', (e) => {
  const dx = e.clientX - pointerDownPos.x;
  const dy = e.clientY - pointerDownPos.y;
  if (Math.sqrt(dx * dx + dy * dy) > 5) {
    isDragging = true;
  }
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (isDragging) return;
  if (e.button !== 0) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const plantMeshes: THREE.Object3D[] = [];
  plants.forEach((p) => {
    p.group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        plantMeshes.push(child);
      }
    });
  });

  const plantIntersects = raycaster.intersectObjects(plantMeshes, false);
  if (plantIntersects.length > 0) {
    let target: THREE.Object3D | null = plantIntersects[0].object;
    while (target && !target.userData.plantId) {
      target = target.parent;
    }
    if (target && target.userData.plantId) {
      const id = target.userData.plantId;
      const store = useStore.getState();
      if (store.selectedPlantId === id) {
        store.selectPlant(null);
      } else {
        store.selectPlant(id);
      }
      return;
    }
  }

  const groundIntersects = raycaster.intersectObject(ground, false);
  if (groundIntersects.length > 0) {
    const point = groundIntersects[0].point;
    const store = useStore.getState();
    if (store.plants.length < 100) {
      store.addPlant({ x: point.x, z: point.z });
    }
    store.selectPlant(null);
  }
});

const store = useStore.getState();

useStore.subscribe((state, prevState) => {
  const added = state.plants.filter(
    (p) => !prevState.plants.find((pp) => pp.id === p.id)
  );
  const removed = prevState.plants.filter(
    (p) => !state.plants.find((pp) => pp.id === p.id)
  );

  added.forEach((p) => {
    if (!plants.has(p.id)) {
      plants.set(p.id, new Plant(p, scene));
    }
  });

  removed.forEach((p) => {
    const plant = plants.get(p.id);
    if (plant) {
      plant.dispose(scene);
      plants.delete(p.id);
    }
  });
});

let lastTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  windSystem.update();
  const windDir = windSystem.getDirection();
  const windStr = windSystem.getStrength();

  const currentStore = useStore.getState();
  currentStore.setWind({
    direction: windDir,
    strength: windStr,
    targetDirection: windSystem.getTargetDirection(),
    targetStrength: windSystem.getTargetStrength(),
  });

  const time = now / 1000;

  plants.forEach((plant) => {
    plant.updateGrowth(delta);

    const pId = plant.getData().id;
    const storePlant = currentStore.plants.find((p) => p.id === pId);
    if (storePlant) {
      currentStore.updatePlant(pId, plant.getData());
    }

    plant.updatePose(windDir, windStr, time);

    const isSelected = currentStore.selectedPlantId === pId;
    plant.setHighlighted(isSelected);
  });

  ui.updateWindIndicator(currentStore.wind);

  const selectedPlant = currentStore.selectedPlantId
    ? currentStore.plants.find((p) => p.id === currentStore.selectedPlantId) || null
    : null;
  ui.updatePlantInfo(selectedPlant);

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
