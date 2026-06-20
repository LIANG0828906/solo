import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { sceneManager } from './sceneManager.js';

export type LightType = 'point' | 'spot';

export interface SceneData {
  room: { width: number; height: number; depth: number };
  materials: {
    id: string;
    type: 'standard' | 'metal' | 'glass';
    color: string;
    roughness: number;
    metalness: number;
  }[];
  meshes: {
    id: string;
    geometry: 'box' | 'plane' | 'cylinder' | 'sphere';
    materialId: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    castShadow: boolean;
    receiveShadow: boolean;
  }[];
}

export interface LightingPresets {
  day: GlobalLightState;
  night: GlobalLightState;
}

export interface GlobalLightState {
  ambient: { color: string; intensity: number };
  directional: {
    color: string;
    intensity: number;
    position: [number, number, number];
    shadowSoftness: number;
  };
  backgroundTint: string;
  artificialLightsActive: boolean;
}

interface SceneInstance {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  ambientLight: THREE.AmbientLight;
  directionalLight: THREE.DirectionalLight;
  objects: Map<string, THREE.Object3D>;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  getGroundIntersection: (x: number, y: number) => THREE.Vector3 | null;
  needsShadowUpdate: boolean;
}

let sceneInstance: SceneInstance | null = null;
export const getSceneInstance = (): SceneInstance | null => sceneInstance;

const loadingProgress = (pct: number) => {
  const bar = document.getElementById('loading-progress');
  if (bar) bar.style.width = `${pct}%`;
};

function createMaterial(
  type: string,
  color: string,
  roughness: number,
  metalness: number
): THREE.Material {
  const c = new THREE.Color(color);
  if (type === 'metal') {
    return new THREE.MeshStandardMaterial({
      color: c,
      roughness: Math.max(0.05, roughness),
      metalness: Math.min(1, Math.max(0.5, metalness)),
      envMapIntensity: 1.2,
    });
  }
  if (type === 'glass') {
    return new THREE.MeshPhysicalMaterial({
      color: c,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.6,
      thickness: 0.3,
      transparent: true,
      opacity: 0.7,
      envMapIntensity: 1.5,
    });
  }
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness,
    metalness,
    envMapIntensity: 1.0,
  });
}

function createGeometry(type: string, scale: [number, number, number]): THREE.BufferGeometry {
  const [sx, sy, sz] = scale;
  switch (type) {
    case 'plane':
      return new THREE.PlaneGeometry(sx, sz);
    case 'box':
      return new THREE.BoxGeometry(sx, sy, sz);
    case 'cylinder':
      return new THREE.CylinderGeometry(sx * 0.5, sx * 0.5, sy, 24);
    case 'sphere':
      return new THREE.SphereGeometry(sx * 0.5, 32, 24);
    default:
      return new THREE.BoxGeometry(sx, sy, sz);
  }
}

async function fetchSceneData(): Promise<SceneData> {
  try {
    const res = await fetch('/api/scene');
    if (res.ok) return (await res.json()) as SceneData;
  } catch (_err) { /* fallthrough */ }
  return buildFallbackScene();
}

async function fetchPresets(): Promise<LightingPresets> {
  try {
    const res = await fetch('/api/presets');
    if (res.ok) return (await res.json()) as LightingPresets;
  } catch (_err) { /* fallthrough */ }
  return buildFallbackPresets();
}

function buildFallbackScene(): SceneData {
  return {
    room: { width: 14, height: 4.2, depth: 10 },
    materials: [
      { id: 'floor', type: 'standard', color: '#2a2622', roughness: 0.75, metalness: 0.05 },
      { id: 'wall', type: 'standard', color: '#d6d0c7', roughness: 0.92, metalness: 0 },
      { id: 'ceiling', type: 'standard', color: '#efeae1', roughness: 0.95, metalness: 0 },
      { id: 'wood', type: 'standard', color: '#6b4f3a', roughness: 0.65, metalness: 0.05 },
      { id: 'upholstery', type: 'standard', color: '#3b5a6b', roughness: 0.85, metalness: 0 },
      { id: 'fabric2', type: 'standard', color: '#7a6b57', roughness: 0.88, metalness: 0 },
      { id: 'metal', type: 'metal', color: '#b8bcc2', roughness: 0.18, metalness: 0.95 },
      { id: 'glass', type: 'glass', color: '#cfe2ff', roughness: 0.04, metalness: 0 },
      { id: 'accent', type: 'standard', color: '#8a6a4a', roughness: 0.6, metalness: 0.1 },
      { id: 'rug', type: 'standard', color: '#5c4a3a', roughness: 0.98, metalness: 0 },
      { id: 'chrome', type: 'metal', color: '#e8eaed', roughness: 0.08, metalness: 1.0 },
      { id: 'marble', type: 'standard', color: '#e8e4de', roughness: 0.35, metalness: 0.02 },
      { id: 'cushion', type: 'standard', color: '#9b7e5e', roughness: 0.9, metalness: 0 },
    ],
    meshes: [
      { id: 'floor', geometry: 'plane', materialId: 'floor', position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], scale: [14, 1, 10], castShadow: false, receiveShadow: true },
      { id: 'ceiling', geometry: 'plane', materialId: 'ceiling', position: [0, 4.2, 0], rotation: [Math.PI / 2, 0, 0], scale: [14, 1, 10], castShadow: false, receiveShadow: true },
      { id: 'wall-back', geometry: 'box', materialId: 'wall', position: [0, 2.1, -5], rotation: [0, 0, 0], scale: [14, 4.2, 0.15], castShadow: false, receiveShadow: true },
      { id: 'wall-left', geometry: 'box', materialId: 'wall', position: [-7, 2.1, 0], rotation: [0, 0, 0], scale: [0.15, 4.2, 10], castShadow: false, receiveShadow: true },
      { id: 'wall-right', geometry: 'box', materialId: 'wall', position: [7, 2.1, 0], rotation: [0, 0, 0], scale: [0.15, 4.2, 10], castShadow: false, receiveShadow: true },
      { id: 'window-frame-l', geometry: 'box', materialId: 'chrome', position: [-4.5, 2.4, -4.9], rotation: [0, 0, 0], scale: [2.8, 2.2, 0.1], castShadow: true, receiveShadow: true },
      { id: 'window-glass-l', geometry: 'box', materialId: 'glass', position: [-4.5, 2.4, -4.88], rotation: [0, 0, 0], scale: [2.5, 1.9, 0.03], castShadow: false, receiveShadow: false },
      { id: 'window-frame-r', geometry: 'box', materialId: 'chrome', position: [4.5, 2.4, -4.9], rotation: [0, 0, 0], scale: [2.8, 2.2, 0.1], castShadow: true, receiveShadow: true },
      { id: 'window-glass-r', geometry: 'box', materialId: 'glass', position: [4.5, 2.4, -4.88], rotation: [0, 0, 0], scale: [2.5, 1.9, 0.03], castShadow: false, receiveShadow: false },
      { id: 'rug', geometry: 'box', materialId: 'rug', position: [0, 0.02, 0.6], rotation: [0, 0, 0], scale: [8, 0.02, 6.5], castShadow: false, receiveShadow: true },
      { id: 'sofa-base', geometry: 'box', materialId: 'upholstery', position: [-1.8, 0.55, 2.8], rotation: [0, 0, 0], scale: [3.6, 0.7, 1.3], castShadow: true, receiveShadow: true },
      { id: 'sofa-back', geometry: 'box', materialId: 'upholstery', position: [-1.8, 1.3, 3.35], rotation: [0, 0, 0], scale: [3.6, 1.0, 0.25], castShadow: true, receiveShadow: true },
      { id: 'sofa-arm-l', geometry: 'box', materialId: 'upholstery', position: [-3.5, 1.0, 2.8], rotation: [0, 0, 0], scale: [0.25, 0.9, 1.3], castShadow: true, receiveShadow: true },
      { id: 'sofa-arm-r', geometry: 'box', materialId: 'upholstery', position: [-0.1, 1.0, 2.8], rotation: [0, 0, 0], scale: [0.25, 0.9, 1.3], castShadow: true, receiveShadow: true },
      { id: 'cushion-1', geometry: 'box', materialId: 'cushion', position: [-2.7, 0.95, 2.6], rotation: [0, 0.1, 0], scale: [1.5, 0.2, 1.0], castShadow: true, receiveShadow: true },
      { id: 'cushion-2', geometry: 'box', materialId: 'cushion', position: [-0.9, 0.95, 2.6], rotation: [0, -0.08, 0], scale: [1.5, 0.2, 1.0], castShadow: true, receiveShadow: true },
      { id: 'coffee-table-top', geometry: 'box', materialId: 'wood', position: [-1.5, 0.45, 0.6], rotation: [0, 0, 0], scale: [1.8, 0.06, 0.9], castShadow: true, receiveShadow: true },
      { id: 'coffee-leg-1', geometry: 'cylinder', materialId: 'chrome', position: [-2.3, 0.22, 1.0], rotation: [0, 0, 0], scale: [0.06, 0.44, 0.06], castShadow: true, receiveShadow: true },
      { id: 'coffee-leg-2', geometry: 'cylinder', materialId: 'chrome', position: [-0.7, 0.22, 1.0], rotation: [0, 0, 0], scale: [0.06, 0.44, 0.06], castShadow: true, receiveShadow: true },
      { id: 'coffee-leg-3', geometry: 'cylinder', materialId: 'chrome', position: [-2.3, 0.22, 0.2], rotation: [0, 0, 0], scale: [0.06, 0.44, 0.06], castShadow: true, receiveShadow: true },
      { id: 'coffee-leg-4', geometry: 'cylinder', materialId: 'chrome', position: [-0.7, 0.22, 0.2], rotation: [0, 0, 0], scale: [0.06, 0.44, 0.06], castShadow: true, receiveShadow: true },
      { id: 'vase', geometry: 'cylinder', materialId: 'accent', position: [-1.5, 0.62, 0.6], rotation: [0, 0, 0], scale: [0.18, 0.28, 0.18], castShadow: true, receiveShadow: true },
      { id: 'armchair-seat', geometry: 'box', materialId: 'fabric2', position: [3.2, 0.55, 2.4], rotation: [0, -0.5, 0], scale: [1.1, 0.4, 1.1], castShadow: true, receiveShadow: true },
      { id: 'armchair-back', geometry: 'box', materialId: 'fabric2', position: [3.6, 1.15, 2.85], rotation: [0.2, -0.5, 0], scale: [1.1, 0.9, 0.2], castShadow: true, receiveShadow: true },
      { id: 'bookshelf', geometry: 'box', materialId: 'wood', position: [5.8, 1.6, -3.2], rotation: [0, 0, 0], scale: [2.2, 2.8, 0.4], castShadow: true, receiveShadow: true },
      { id: 'shelf-1', geometry: 'box', materialId: 'wood', position: [5.8, 0.9, -3.1], rotation: [0, 0, 0], scale: [2.1, 0.03, 0.36], castShadow: true, receiveShadow: true },
      { id: 'shelf-2', geometry: 'box', materialId: 'wood', position: [5.8, 1.6, -3.1], rotation: [0, 0, 0], scale: [2.1, 0.03, 0.36], castShadow: true, receiveShadow: true },
      { id: 'shelf-3', geometry: 'box', materialId: 'wood', position: [5.8, 2.3, -3.1], rotation: [0, 0, 0], scale: [2.1, 0.03, 0.36], castShadow: true, receiveShadow: true },
      { id: 'floor-lamp-base', geometry: 'cylinder', materialId: 'chrome', position: [-5.6, 0.08, 3.0], rotation: [0, 0, 0], scale: [0.3, 0.08, 0.3], castShadow: true, receiveShadow: true },
      { id: 'floor-lamp-pole', geometry: 'cylinder', materialId: 'chrome', position: [-5.6, 0.8, 3.0], rotation: [0, 0, 0], scale: [0.04, 1.4, 0.04], castShadow: true, receiveShadow: true },
      { id: 'floor-lamp-head', geometry: 'cylinder', materialId: 'accent', position: [-5.6, 1.6, 3.0], rotation: [0, 0, 0], scale: [0.4, 0.35, 0.4], castShadow: true, receiveShadow: true },
      { id: 'side-table', geometry: 'cylinder', materialId: 'marble', position: [5.2, 0.35, 1.8], rotation: [0, 0, 0], scale: [0.6, 0.7, 0.6], castShadow: true, receiveShadow: true },
      { id: 'tv-stand', geometry: 'box', materialId: 'wood', position: [0, 0.3, -4.2], rotation: [0, 0, 0], scale: [3.0, 0.6, 0.45], castShadow: true, receiveShadow: true },
      { id: 'tv-screen', geometry: 'box', materialId: 'glass', position: [0, 1.25, -4.35], rotation: [0, 0, 0], scale: [2.4, 1.4, 0.04], castShadow: false, receiveShadow: false },
      { id: 'tv-frame', geometry: 'box', materialId: 'chrome', position: [0, 1.25, -4.36], rotation: [0, 0, 0], scale: [2.5, 1.5, 0.02], castShadow: true, receiveShadow: true },
      { id: 'plant-pot', geometry: 'cylinder', materialId: 'accent', position: [-5.8, 0.22, -3.5], rotation: [0, 0, 0], scale: [0.28, 0.44, 0.28], castShadow: true, receiveShadow: true },
      { id: 'plant-foliage', geometry: 'sphere', materialId: 'upholstery', position: [-5.8, 0.9, -3.5], rotation: [0, 0, 0], scale: [0.7, 0.65, 0.7], castShadow: true, receiveShadow: true },
    ],
  };
}

function buildFallbackPresets(): LightingPresets {
  return {
    day: {
      ambient: { color: '#fff5e6', intensity: 0.55 },
      directional: { color: '#fff2d6', intensity: 2.4, position: [-6, 10, -4], shadowSoftness: 0.6 },
      backgroundTint: '#1e293b',
      artificialLightsActive: false,
    },
    night: {
      ambient: { color: '#c4d4ff', intensity: 0.22 },
      directional: { color: '#9eb8ff', intensity: 0.25, position: [4, 8, -6], shadowSoftness: 0.9 },
      backgroundTint: '#0a0f1e',
      artificialLightsActive: true,
    },
  };
}

function buildEnvTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#2a3652');
  g.addColorStop(0.45, '#405273');
  g.addColorStop(0.55, '#6d7a92');
  g.addColorStop(1, '#1a1f2e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size * 0.5;
    const r = Math.random() * 2 + 0.5;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3 + 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

async function tryLoadGLTF(scene: THREE.Scene, objects: Map<string, THREE.Object3D>): Promise<boolean> {
  const modelUrls = ['/models/room.glb', '/models/interior.glb', '/api/models/room.glb'];
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  for (const url of modelUrls) {
    try {
      const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
        gltfLoader.load(url, resolve, undefined, reject);
      });
      const model = gltf.scene;
      model.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.envMapIntensity = 1.0;
              }
            });
          }
        }
      });
      model.scale.setScalar(1);
      scene.add(model);
      objects.set('gltf-model', model);
      return true;
    } catch (_e) { continue; }
  }
  return false;
}

function buildSceneFromData(scene: THREE.Scene, sceneData: SceneData, objects: Map<string, THREE.Object3D>) {
  const materialCache = new Map<string, THREE.Material>();
  for (const m of sceneData.materials) {
    materialCache.set(m.id, createMaterial(m.type, m.color, m.roughness, m.metalness));
  }
  for (const meshDef of sceneData.meshes) {
    const mat = materialCache.get(meshDef.materialId);
    if (!mat) continue;
    const geom = createGeometry(meshDef.geometry, meshDef.scale);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(...meshDef.position);
    mesh.rotation.set(...meshDef.rotation);
    mesh.castShadow = meshDef.castShadow;
    mesh.receiveShadow = meshDef.receiveShadow;
    mesh.userData.id = meshDef.id;
    scene.add(mesh);
    objects.set(meshDef.id, mesh);
  }
}

async function init(): Promise<void> {
  const t0 = performance.now();
  const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas not found');

  loadingProgress(10);

  const [sceneData, presets] = await Promise.all([fetchSceneData(), fetchPresets()]);
  loadingProgress(30);

  const scene = new THREE.Scene();
  const envTex = buildEnvTexture();
  scene.environment = envTex;
  scene.background = new THREE.Color(presets.day.backgroundTint);
  scene.fog = new THREE.Fog(presets.day.backgroundTint, 20, 40);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(9, 7.5, 10);
  camera.lookAt(0, 1.5, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.info.autoReset = false;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 3;
  controls.maxDistance = 25;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minPolarAngle = Math.PI * 0.08;
  controls.target.set(0, 1.4, 0);

  loadingProgress(45);

  const objects = new Map<string, THREE.Object3D>();
  const gltfLoaded = await tryLoadGLTF(scene, objects);
  if (!gltfLoaded) {
    buildSceneFromData(scene, sceneData, objects);
  }

  loadingProgress(70);

  const ambientLight = new THREE.AmbientLight(presets.day.ambient.color, presets.day.ambient.intensity);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(presets.day.directional.color, presets.day.directional.intensity);
  directionalLight.position.set(...presets.day.directional.position);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 40;
  const d = 10;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;
  directionalLight.shadow.bias = -0.0003;
  directionalLight.shadow.radius = 4;
  scene.add(directionalLight);

  loadingProgress(85);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  sceneInstance = {
    scene,
    camera,
    renderer,
    controls,
    ambientLight,
    directionalLight,
    objects,
    raycaster,
    pointer,
    needsShadowUpdate: false,
    getGroundIntersection: (x: number, y: number): THREE.Vector3 | null => {
      pointer.x = (x / window.innerWidth) * 2 - 1;
      pointer.y = -(y / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const target = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(ground, target);
      if (hit) {
        target.y = Math.max(0.3, Math.min(target.y, 3.8));
        target.x = Math.max(-6.5, Math.min(6.5, target.x));
        target.z = Math.max(-4.5, Math.min(4.5, target.z));
      }
      return hit ? target : null;
    },
  };

  (window as any).__sceneInstance = sceneInstance;

  sceneManager.bindInstance(sceneInstance, presets);
  sceneManager.bootstrap();

  loadingProgress(100);

  const fpsBadge = document.getElementById('fps-badge');
  let frameCount = 0;
  let lastFpsTime = performance.now();
  let resizeRaf = 0;
  let memoryCheckInterval = 0;

  function onResize() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }
  window.addEventListener('resize', onResize);

  memoryCheckInterval = window.setInterval(() => {
    const mem = (performance as any).memory;
    if (mem && fpsBadge) {
      const usedMB = Math.round(mem.usedJSHeapSize / 1048576);
      if (usedMB > 180) {
        console.warn(`[Lumen] Memory usage: ${usedMB}MB approaching limit`);
      }
    }
  }, 5000);

  const clock = new THREE.Clock();
  function tick() {
    const dt = clock.getDelta();
    controls.update();
    sceneManager.update(dt);

    renderer.info.reset();
    renderer.render(scene, camera);

    if (sceneInstance!.needsShadowUpdate) {
      sceneInstance!.needsShadowUpdate = false;
    }

    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 500 && fpsBadge) {
      const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
      const drawCalls = renderer.info.render.calls;
      const triangles = renderer.info.render.triangles;
      fpsBadge.textContent = `${fps} FPS | ${drawCalls} DC | ${(triangles / 1000).toFixed(1)}K△`;
      fpsBadge.classList.toggle('low', fps < 40 && fps >= 30);
      fpsBadge.classList.toggle('critical', fps < 30);
      frameCount = 0;
      lastFpsTime = now;
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  const loadTime = performance.now() - t0;
  console.log(`[Lumen Studio] Scene loaded in ${loadTime.toFixed(0)}ms`);

  setTimeout(() => {
    document.getElementById('loading-overlay')?.classList.add('hidden');
  }, 450);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init };
