import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GreeneryManager, GreeneryConfig } from './GreeneryManager';
import { runFullSimulation, SimulateResponse } from './ClimateEngineAPI';

const GRID_SIZE = 50;
const RESOLUTION = 32;
const MAX_PLANTS = 60;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let greeneryManager: GreeneryManager;
let groundPlane: THREE.Mesh;
let cloudPlane: THREE.Mesh;
let cloudMaterial: THREE.ShaderMaterial;
let currentClimateData: SimulateResponse | null = null;
let targetClimateData: SimulateResponse | null = null;
let climateTransitionStart = 0;
let isSimulating = false;

let displayTemp = 25;
let displayHumid = 40;
let displayWind = 5;
let targetTemp = 25;
let targetHumid = 40;
let targetWind = 5;
let valueTransitionStart = 0;

let currentTool: 'tree' | 'shrub' = 'tree';

const initialCameraPos = new THREE.Vector3(
  GRID_SIZE / 2 + 30 * Math.sin(Math.PI / 4) * Math.cos(Math.PI / 4),
  30 * Math.cos(Math.PI / 4),
  GRID_SIZE / 2 + 30 * Math.sin(Math.PI / 4) * Math.sin(Math.PI / 4)
);

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.copy(initialCameraPos);
  camera.lookAt(GRID_SIZE / 2, 0, GRID_SIZE / 2);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const container = document.getElementById('canvas-container')!;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 10;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.update();

  setupLighting();
  createGround();
  createBuildings();
  createCloudPlane();
  setupEventListeners();

  greeneryManager = new GreeneryManager(scene, groundPlane, onGreeneryChange);

  updateGreeneryUI();
  const initialTempData = new Array(RESOLUTION * RESOLUTION).fill(25);
  updateCloudTexture(initialTempData, 20, 30);

  animate(performance.now());
}

function setupLighting() {
  const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  dirLight.position.set(30, 40, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -35;
  dirLight.shadow.camera.right = 35;
  dirLight.shadow.camera.top = 35;
  dirLight.shadow.camera.bottom = -35;
  dirLight.shadow.bias = -0.001;
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0x4466aa, 0x223322, 0.3);
  scene.add(hemiLight);
}

function createGround() {
  const groundGeo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a3e,
    roughness: 0.9,
    metalness: 0.1,
  });
  groundPlane = new THREE.Mesh(groundGeo, groundMat);
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
  groundPlane.receiveShadow = true;
  scene.add(groundPlane);

  const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0xffffff, 0xffffff);
  gridHelper.position.set(GRID_SIZE / 2, 0.01, GRID_SIZE / 2);
  const gridMats = Array.isArray(gridHelper.material)
    ? gridHelper.material
    : [gridHelper.material];
  gridMats.forEach(m => {
    if (m instanceof THREE.Material) {
      m.transparent = true;
      m.opacity = 0.12;
    }
  });
  scene.add(gridHelper);
}

function createBuildings() {
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0xd3d3d3,
    roughness: 0.7,
    metalness: 0.1,
  });

  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const occupiedCells = new Set<string>();

  for (let i = 0; i < 20; i++) {
    let bx: number, bz: number, cellKey: string;
    let attempts = 0;
    do {
      bx = Math.floor(seededRandom(i * 3 + 1) * (GRID_SIZE - 6)) + 3;
      bz = Math.floor(seededRandom(i * 3 + 2) * (GRID_SIZE - 6)) + 3;
      cellKey = `${bx},${bz}`;
      attempts++;
    } while (occupiedCells.has(cellKey) && attempts < 20);

    occupiedCells.add(cellKey);

    const height = 3 + seededRandom(i * 3 + 3) * 5;
    const width = 2 + seededRandom(i * 7) * 2;
    const depth = 2 + seededRandom(i * 11) * 2;

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, buildingMat);
    mesh.position.set(bx, height / 2, bz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isBuilding = true;
    scene.add(mesh);
  }
}

function createCloudPlane() {
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D uDataTexture;
    uniform float uOpacity;
    varying vec2 vUv;

    vec3 temperatureColor(float t) {
      t = clamp(t, 0.0, 1.0);
      vec3 blue = vec3(0.0, 0.0, 1.0);
      vec3 cyan = vec3(0.0, 1.0, 1.0);
      vec3 green = vec3(0.0, 1.0, 0.0);
      vec3 yellow = vec3(1.0, 1.0, 0.0);
      vec3 red = vec3(1.0, 0.0, 0.0);

      if (t < 0.25) return mix(blue, cyan, t / 0.25);
      else if (t < 0.5) return mix(cyan, green, (t - 0.25) / 0.25);
      else if (t < 0.75) return mix(green, yellow, (t - 0.5) / 0.25);
      else return mix(yellow, red, (t - 0.75) / 0.25);
    }

    void main() {
      vec4 data = texture2D(uDataTexture, vUv);
      float temp = data.r;
      vec3 col = temperatureColor(temp);
      gl_FragColor = vec4(col, uOpacity * smoothstep(0.0, 0.05, temp) * smoothstep(1.0, 0.95, temp));
    }
  `;

  const initialData = new Float32Array(RESOLUTION * RESOLUTION * 4);
  const defaultTemp = (25 - 20) / (30 - 20);
  for (let i = 0; i < RESOLUTION * RESOLUTION; i++) {
    initialData[i * 4] = defaultTemp;
    initialData[i * 4 + 1] = 0;
    initialData[i * 4 + 2] = 0;
    initialData[i * 4 + 3] = 1;
  }

  const dataTexture = new THREE.DataTexture(
    initialData,
    RESOLUTION,
    RESOLUTION,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  dataTexture.magFilter = THREE.LinearFilter;
  dataTexture.minFilter = THREE.LinearFilter;
  dataTexture.needsUpdate = true;

  cloudMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uDataTexture: { value: dataTexture },
      uOpacity: { value: 0.4 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const cloudGeo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
  cloudPlane = new THREE.Mesh(cloudGeo, cloudMaterial);
  cloudPlane.rotation.x = -Math.PI / 2;
  cloudPlane.position.set(GRID_SIZE / 2, 8, GRID_SIZE / 2);
  scene.add(cloudPlane);
}

function updateCloudTexture(data: number[], minVal: number, maxVal: number) {
  const texData = cloudMaterial.uniforms.uDataTexture.value.image.data as Float32Array;

  for (let i = 0; i < RESOLUTION * RESOLUTION; i++) {
    const normalized = (data[i] - minVal) / (maxVal - minVal);
    texData[i * 4] = Math.max(0, Math.min(1, normalized));
    texData[i * 4 + 1] = 0;
    texData[i * 4 + 2] = 0;
    texData[i * 4 + 3] = 1;
  }

  cloudMaterial.uniforms.uDataTexture.value.needsUpdate = true;
}

function lerpData(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => v + (b[i] - v) * t);
}

function onGreeneryChange(_configs: GreeneryConfig[]) {
  updateGreeneryUI();
}

function updateGreeneryUI() {
  const coverage = greeneryManager.getCoveragePercent();
  const count = greeneryManager.getPlantCount();

  const ring = document.getElementById('ring-progress')!;
  const ringText = document.getElementById('ring-text')!;
  const countEl = document.getElementById('greenery-count')!;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (coverage / 100) * circumference;
  ring.style.strokeDashoffset = offset.toString();

  let strokeColor: string;
  if (coverage < 20) {
    strokeColor = '#ef4444';
  } else if (coverage < 40) {
    strokeColor = '#f97316';
  } else {
    strokeColor = '#22c55e';
  }
  ring.style.stroke = strokeColor;

  ringText.innerHTML = `${Math.round(coverage)}<span>%</span>`;
  countEl.textContent = `植物: ${count} / ${MAX_PLANTS}`;
}

function updateClimateUI() {
  const tempEl = document.getElementById('temp-value')!;
  const humidEl = document.getElementById('humid-value')!;
  const windEl = document.getElementById('wind-value')!;

  tempEl.textContent = displayTemp.toFixed(2);
  humidEl.textContent = displayHumid.toFixed(2);
  windEl.textContent = displayWind.toFixed(2);
}

async function runSimulation() {
  if (isSimulating) return;

  const btn = document.getElementById('simulate-btn')!;
  isSimulating = true;
  btn.classList.add('loading');
  btn.innerHTML = '<div class="spinner"></div>模拟中...';

  try {
    const configs = greeneryManager.getGreenConfig();
    const result = await runFullSimulation({
      greenery: configs.map(c => ({ type: c.type, x: c.x, z: c.z })),
      gridSize: GRID_SIZE,
      resolution: RESOLUTION,
    });

    targetClimateData = result;
    climateTransitionStart = performance.now();

    targetTemp = average(result.temperature);
    targetHumid = average(result.humidity);
    targetWind = average(result.windSpeed);
    valueTransitionStart = performance.now();

    btn.classList.remove('loading');
    btn.innerHTML = '运行模拟';
  } catch (err) {
    console.error('Simulation failed:', err);
    btn.classList.remove('loading');
    btn.classList.add('error');
    btn.innerHTML = '重试';

    setTimeout(() => {
      btn.classList.remove('error');
      btn.innerHTML = '运行模拟';
    }, 3000);
  } finally {
    isSimulating = false;
  }
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function setupEventListeners() {
  const canvas = renderer.domElement;

  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let isDragging = false;
  let mouseDownTime = 0;
  let mouseDownPos = { x: 0, y: 0 };

  canvas.addEventListener('pointerdown', (e) => {
    mouseDownTime = performance.now();
    mouseDownPos = { x: e.clientX, y: e.clientY };
    isDragging = false;
  });

  canvas.addEventListener('pointermove', (e) => {
    const dx = e.clientX - mouseDownPos.x;
    const dy = e.clientY - mouseDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) {
      isDragging = true;
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (isDragging) return;
    if (performance.now() - mouseDownTime > 300) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(groundPlane);
    if (intersects.length === 0) return;

    const point = intersects[0].point;
    const wx = point.x;
    const wz = point.z;

    if (wx < 0 || wx > GRID_SIZE || wz < 0 || wz > GRID_SIZE) return;

    if (e.button === 0) {
      const existing = greeneryManager.findPlantAtPosition(wx, wz);
      if (!existing) {
        if (currentTool === 'tree') {
          greeneryManager.addTree(wx, wz);
        } else {
          greeneryManager.addShrub(wx, wz);
        }
      }
    } else if (e.button === 2) {
      const existing = greeneryManager.findPlantAtPosition(wx, wz);
      if (existing) {
        greeneryManager.removePlant(existing);
      }
    }
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const tool = target.dataset.tool as 'tree' | 'shrub';
      currentTool = tool;
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      target.classList.add('active');
    });
  });

  document.getElementById('simulate-btn')!.addEventListener('click', runSimulation);

  document.getElementById('reset-btn')!.addEventListener('click', resetCamera);

  document.getElementById('clear-btn')!.addEventListener('click', () => {
    greeneryManager.clearAll();
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function resetCamera() {
  const start = camera.position.clone();
  const end = initialCameraPos.clone();
  const duration = 1000;
  const startTime = performance.now();

  function animateReset() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);

    camera.position.lerpVectors(start, end, ease);
    controls.target.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(animateReset);
    }
  }

  animateReset();
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animate(time: number) {
  requestAnimationFrame(animate);

  greeneryManager.update(time);
  controls.update();

  if (targetClimateData) {
    const elapsed = (time - climateTransitionStart) / 1000;
    const t = Math.min(elapsed / 1.0, 1.0);
    const ease = easeInOutCubic(t);

    if (currentClimateData) {
      const tempLerp = lerpData(currentClimateData.temperature, targetClimateData.temperature, ease);
      const humidLerp = lerpData(currentClimateData.humidity, targetClimateData.humidity, ease);
      const windLerp = lerpData(currentClimateData.windSpeed, targetClimateData.windSpeed, ease);

      updateCloudTexture(tempLerp, 20, 30);
    } else {
      updateCloudTexture(targetClimateData.temperature, 20, 30);
    }

    if (t >= 1) {
      currentClimateData = targetClimateData;
      targetClimateData = null;
    }
  } else if (currentClimateData) {
    updateCloudTexture(currentClimateData.temperature, 20, 30);
  }

  const valElapsed = (time - valueTransitionStart) / 1000;
  const valT = Math.min(valElapsed / 0.5, 1.0);
  const valEase = easeInOutCubic(valT);

  displayTemp = displayTemp + (targetTemp - displayTemp) * valEase;
  displayHumid = displayHumid + (targetHumid - displayHumid) * valEase;
  displayWind = displayWind + (targetWind - displayWind) * valEase;

  updateClimateUI();

  renderer.render(scene, camera);
}

init();
