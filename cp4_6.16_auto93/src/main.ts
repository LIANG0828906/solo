import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useStore, PlantData } from './store';
import { PlantRenderSystem } from './plant';
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
const plantRenderSystem = new PlantRenderSystem(scene);
const ui = createUI();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };
let isDragging = false;
let rightDown = false;

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
  isDragging = false;
  if (e.button === 2) rightDown = true;
});

renderer.domElement.addEventListener('pointermove', (e) => {
  const dx = e.clientX - pointerDownPos.x;
  const dy = e.clientY - pointerDownPos.y;
  if (Math.sqrt(dx * dx + dy * dy) > 5) {
    isDragging = true;
  }
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (e.button === 2) rightDown = false;
  if (isDragging) return;
  if (e.button !== 0) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const pickedId = plantRenderSystem.pickPlant(raycaster);
  if (pickedId) {
    const store = useStore.getState();
    if (store.selectedPlantId === pickedId) {
      store.selectPlant(null);
    } else {
      store.selectPlant(pickedId);
    }
    return;
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

useStore.subscribe((state, prevState) => {
  const added = state.plants.filter(
    (p) => !prevState.plants.find((pp) => pp.id === p.id)
  );
  const removed = prevState.plants.filter(
    (p) => !state.plants.find((pp) => pp.id === p.id)
  );

  added.forEach((p) => {
    plantRenderSystem.addPlant(p);
  });

  removed.forEach((p) => {
    plantRenderSystem.removePlant(p.id);
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

  plantRenderSystem.update(delta, time, windDir, windStr, (id, data) => {
    currentStore.updatePlant(id, data);
  });

  const selectedId = currentStore.selectedPlantId;
  plantRenderSystem.plants.forEach((state, id) => {
    plantRenderSystem.setHighlighted(id, id === selectedId);
  });

  ui.updateWindIndicator(currentStore.wind);

  const selectedPlantData = selectedId
    ? plantRenderSystem.getPlantData(selectedId)
    : null;
  if (selectedPlantData) {
    ui.updatePlantInfo({
      ...selectedPlantData,
      initialHeight: selectedPlantData.currentHeight,
      targetHeight: selectedPlantData.currentHeight,
      position: { x: 0, z: 0 },
      id: selectedId,
    } as PlantData);
  } else {
    ui.updatePlantInfo(null);
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('contextmenu', (e) => e.preventDefault());
