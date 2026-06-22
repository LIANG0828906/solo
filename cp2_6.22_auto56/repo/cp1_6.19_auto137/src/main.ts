import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CityMap } from './domain/cityMap';
import { NoiseSourceManager, NoiseSourceData } from './domain/noiseSource';
import { NoiseEngine } from './domain/noiseEngine';
import { HeatmapRenderer } from './chart/heatmapRenderer';
import { ElevationRenderer } from './chart/elevationRenderer';
import { ControlsPanel } from './ui/controlsPanel';

class EventBus {
  private listeners: Map<string, Function[]> = new Map();
  on(event: string, fn: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(fn);
  }
  off(event: string, fn: Function) {
    const arr = this.listeners.get(event);
    if (arr) {
      const idx = arr.indexOf(fn);
      if (idx >= 0) arr.splice(idx, 1);
    }
  }
  emit(event: string, data?: any) {
    const arr = this.listeners.get(event);
    if (arr) arr.forEach(fn => fn(data));
  }
}

const eventBus = new EventBus();
const container = document.getElementById('canvas-container')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d1a);
scene.fog = new THREE.FogExp2(0x0d0d1a, 0.006);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  500,
);
camera.position.set(110, 90, 110);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(50, 0, 50);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI / 2.15;
controls.minDistance = 30;
controls.maxDistance = 200;
controls.update();

const ambientLight = new THREE.AmbientLight(0x3344666, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xeeeeff, 1.0);
dirLight.position.set(60, 100, 40);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.left = -60;
dirLight.shadow.camera.right = 60;
dirLight.shadow.camera.top = 60;
dirLight.shadow.camera.bottom = -60;
scene.add(dirLight);

const hemiLight = new THREE.HemisphereLight(0x334488, 0x112233, 0.4);
scene.add(hemiLight);

const gridHelper = new THREE.GridHelper(100, 20, 0x222244, 0x181830);
gridHelper.position.set(50, 0.01, 50);
scene.add(gridHelper);

const cityMap = new CityMap(scene);
const noiseSourceManager = new NoiseSourceManager(cityMap, scene, eventBus);
const noiseEngine = new NoiseEngine(80, cityMap);
const heatmapRenderer = new HeatmapRenderer(scene, 80);
const elevationRenderer = new ElevationRenderer(scene, 80);
elevationRenderer.setVisible(false);

const controlsPanel = new ControlsPanel(
  eventBus,
  noiseSourceManager.getSources(),
  container,
);

let currentView: 'heatmap' | 'elevation' = 'heatmap';
let isTransitioning = false;

eventBus.on('timeChanged', (hour: number) => {
  noiseSourceManager.updateTime(hour);
  controlsPanel.updateSourceList(noiseSourceManager.getSources());
});

eventBus.on('viewChanged', (mode: 'heatmap' | 'elevation') => {
  if (mode === currentView || isTransitioning) return;
  isTransitioning = true;
  currentView = mode;

  if (mode === 'elevation') {
    heatmapRenderer.fadeOut(600);
    elevationRenderer.setVisible(true);
    elevationRenderer.growFromGround(600).then(() => {
      heatmapRenderer.setVisible(false);
      isTransitioning = false;
    });
  } else {
    elevationRenderer.shrinkToGround(600);
    heatmapRenderer.setVisible(true);
    heatmapRenderer.fadeIn(600).then(() => {
      elevationRenderer.setVisible(false);
      isTransitioning = false;
    });
  }
});

eventBus.on('sourceToggled', (data: { id: string }) => {
  noiseSourceManager.toggleSource(data.id);
  controlsPanel.updateSourceList(noiseSourceManager.getSources());
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointerup', (e) => {
  const dx = e.clientX - pointerDownPos.x;
  const dy = e.clientY - pointerDownPos.y;
  if (dx * dx + dy * dy > 25) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const spheres = noiseSourceManager
    .getSources()
    .filter((s) => s.sphere && s.active)
    .map((s) => s.sphere!);

  if (spheres.length > 0) {
    const sphereHits = raycaster.intersectObjects(spheres);
    if (sphereHits.length > 0) {
      const hitMesh = sphereHits[0].object;
      const source = noiseSourceManager
        .getSources()
        .find((s) => s.sphere === hitMesh);
      if (source) {
        controlsPanel.showSourcePopup(source, e.clientX, e.clientY);
        return;
      }
    }
  }

  const ground = cityMap.getGroundPlane();
  const groundHits = raycaster.intersectObject(ground);
  if (groundHits.length > 0) {
    const point = groundHits[0].point;
    if (point.x >= 0 && point.x <= 100 && point.z >= 0 && point.z <= 100) {
      handleGroundClick(point);
    }
  }
});

function handleGroundClick(point: THREE.Vector3): void {
  const existingTemp = noiseSourceManager
    .getSources()
    .find(
      (s) =>
        s.category === 'temporary' &&
        s.position.distanceTo(new THREE.Vector3(point.x, 0.5, point.z)) < 5,
    );

  if (existingTemp) {
    noiseSourceManager.removeTempSource(existingTemp.id);
  } else {
    const intensity = controlsPanel.getTempIntensity();
    const source = noiseSourceManager.addTempSource(
      new THREE.Vector3(point.x, 0.5, point.z),
      intensity,
    );
    if (source) {
      createRipple(new THREE.Vector3(point.x, 0.1, point.z), scene);
      const target = source.intensity;
      source.intensity = 0;
      const rampStart = performance.now();
      function rampUp() {
        const t = Math.min((performance.now() - rampStart) / 1000, 1);
        source.intensity = target * (t * t * (3 - 2 * t));
        if (t < 1) requestAnimationFrame(rampUp);
      }
      rampUp();
    }
  }
}

function createRipple(position: THREE.Vector3, scn: THREE.Scene): void {
  const ringMeshes: THREE.Mesh[] = [];

  for (let i = 0; i < 3; i++) {
    const geo = new THREE.RingGeometry(0.85, 1, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x6c63ff,
      transparent: true,
      opacity: 0.75 - i * 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.position.y = 0.15 + i * 0.02;
    scn.add(mesh);
    ringMeshes.push(mesh);
  }

  const startT = performance.now();
  const dur = 2000;

  function animRipple() {
    const elapsed = performance.now() - startT;
    const t = elapsed / dur;
    if (t >= 1) {
      for (const m of ringMeshes) {
        scn.remove(m);
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
      return;
    }
    for (let i = 0; i < ringMeshes.length; i++) {
      const delay = i * 0.12;
      const rt = Math.max(0, (t - delay) / (1 - delay));
      const eased = rt * rt * (3 - 2 * rt);
      const s = 2 + eased * 8;
      ringMeshes[i].scale.set(s, 1, s);
      (ringMeshes[i].material as THREE.MeshBasicMaterial).opacity =
        (0.75 - i * 0.2) * (1 - rt);
    }
    requestAnimationFrame(animRipple);
  }
  requestAnimationFrame(animRipple);
}

let lastCalcTime = 0;
const CALC_INTERVAL = 100;
const clock = new THREE.Clock();
let sourceUpdateTimer = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const now = performance.now();

  controls.update();
  noiseSourceManager.update(delta);

  sourceUpdateTimer += delta;
  if (sourceUpdateTimer > 2) {
    sourceUpdateTimer = 0;
    controlsPanel.updateSourceList(noiseSourceManager.getSources());
  }

  if (now - lastCalcTime >= CALC_INTERVAL) {
    lastCalcTime = now;
    const matrix = noiseEngine.calculate(noiseSourceManager.getSources());
    if (currentView === 'heatmap') {
      heatmapRenderer.update(matrix);
    } else {
      elevationRenderer.update(matrix);
    }
  }

  heatmapRenderer.tick();
  elevationRenderer.tick();

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
