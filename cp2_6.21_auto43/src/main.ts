import * as THREE from 'three';
import { BrainModel } from './brainModel';
import { WaveOverlay } from './waveOverlay';
import { UIPanel } from './uiPanel';
import { useStatusStore } from './statusStore';

interface AppContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  brainModel: BrainModel;
  waveOverlay: WaveOverlay;
  uiPanel: UIPanel;
  startTime: number;
  rafId: number | null;
  destroyed: boolean;
}

function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  return renderer;
}

function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02040a, 0.08);

  const hemi = new THREE.HemisphereLight(0x4488ff, 0x0a0022, 0.45);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.85);
  dir.position.set(3, 5, 4);
  scene.add(dir);

  const rimL = new THREE.PointLight(0x0088ff, 1.2, 12, 2);
  rimL.position.set(-4, 1.5, -2);
  scene.add(rimL);

  const rimR = new THREE.PointLight(0xaa00ff, 1.0, 12, 2);
  rimR.position.set(4, -1, -2.5);
  scene.add(rimR);

  const ambient = new THREE.AmbientLight(0x222244, 0.25);
  scene.add(ambient);

  (scene as unknown as { _rimL: THREE.PointLight; _rimR: THREE.PointLight })._rimL = rimL;
  (scene as unknown as { _rimL: THREE.PointLight; _rimR: THREE.PointLight })._rimR = rimR;

  return scene;
}

function createCamera(w: number, h: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 0.6, 6);
  camera.lookAt(0, 0, 0);
  return camera;
}

function setupOrbit(ctx: AppContext): (dt: number) => void {
  const { camera, renderer } = ctx;
  const dom = renderer.domElement;
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let yaw = 0.3;
  let pitch = -0.1;
  let distance = 6;
  let autoRotate = true;

  const updateCamera = () => {
    const x = Math.sin(yaw) * Math.cos(pitch) * distance;
    const z = Math.cos(yaw) * Math.cos(pitch) * distance;
    const y = Math.sin(pitch) * distance + 0.5;
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  };

  const onDown = (e: PointerEvent) => {
    isDragging = true;
    autoRotate = false;
    lastX = e.clientX;
    lastY = e.clientY;
    dom.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    yaw -= dx * 0.006;
    pitch = Math.max(-1.2, Math.min(1.2, pitch + dy * 0.006));
    updateCamera();
  };
  const onUp = (e: PointerEvent) => {
    isDragging = false;
    try { dom.releasePointerCapture(e.pointerId); } catch {
      // ignore
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    distance = Math.max(3.2, Math.min(10, distance + e.deltaY * 0.004));
    updateCamera();
  };

  dom.addEventListener('pointerdown', onDown);
  dom.addEventListener('pointermove', onMove);
  dom.addEventListener('pointerup', onUp);
  dom.addEventListener('pointercancel', onUp);
  dom.addEventListener('wheel', onWheel, { passive: false });

  updateCamera();

  return (dt: number) => {
    if (autoRotate && !isDragging) {
      yaw += dt * 0.08;
      updateCamera();
    }
  };
}

function setupResize(ctx: AppContext): () => void {
  const { renderer, camera } = ctx;
  const container = renderer.domElement.parentElement!;

  const handle = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', handle);
  return handle;
}

async function captureScreenshot(ctx: AppContext): Promise<string> {
  const { renderer, scene, camera } = ctx;
  const prevW = renderer.domElement.width;
  const prevH = renderer.domElement.height;
  try {
    renderer.setSize(1000, 1000, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const data = renderer.domElement.toDataURL('image/png');
    return data;
  } finally {
    renderer.setSize(prevW, prevH, true);
    camera.aspect = prevW / prevH;
    camera.updateProjectionMatrix();
  }
}

function updateRimLights(scene: THREE.Scene, colorHex: string, intensity: number): void {
  const sc = scene as unknown as { _rimL?: THREE.PointLight; _rimR?: THREE.PointLight };
  if (sc._rimL && sc._rimR) {
    const c = new THREE.Color(colorHex);
    sc._rimL.color.copy(c).offsetHSL(0.06, 0.1, 0.12);
    sc._rimL.intensity = 0.8 + intensity * 1.2;
    sc._rimR.color.copy(c).offsetHSL(-0.08, 0.05, 0.08);
    sc._rimR.intensity = 0.6 + intensity * 1.0;
  }
}

function startRenderLoop(ctx: AppContext, orbitTick: (dt: number) => void): void {
  let lastFrame = performance.now();
  let lastRecord = 0;
  const RECORD_INTERVAL_MS = 500;

  const tick = (now: number) => {
    if (ctx.destroyed) return;
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    const store = useStatusStore.getState();
    store.tickTransition(now);

    orbitTick(dt);

    const {
      currentColor,
      intensity,
      intensityMap,
      currentStatus,
      isSeeking,
    } = store;

    ctx.brainModel.updateFreqBand(
      currentColor,
      intensity,
      intensityMap.alpha,
      intensityMap.beta,
      intensityMap.theta,
      intensityMap.delta,
    );
    ctx.brainModel.update(now);

    ctx.waveOverlay.setWaveIntensity(currentStatus, currentColor, intensity);
    ctx.waveOverlay.update(now);

    updateRimLights(ctx.scene, currentColor, intensity);

    if (!isSeeking) {
      const elapsed = (now - ctx.startTime) / 1000;
      const prog = Math.min(60, elapsed % 60.0001);
      useStatusStore.setState({ timelineProgress: prog });

      if (now - lastRecord >= RECORD_INTERVAL_MS && store.history.length < 120) {
        store.recordFrame(prog);
        lastRecord = now;
      }
    }

    ctx.renderer.render(ctx.scene, ctx.camera);
    ctx.rafId = requestAnimationFrame(tick);
  };

  ctx.rafId = requestAnimationFrame(tick);
}

export function initApp(containerId: string): { dispose: () => void } {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`#${containerId} not found`);

  const w = container.clientWidth;
  const h = container.clientHeight;

  const renderer = createRenderer(container);
  const scene = createScene();
  const camera = createCamera(w, h);

  const brainModel = new BrainModel();
  scene.add(brainModel.group);

  const waveOverlay = new WaveOverlay();
  scene.add(waveOverlay.points);

  const uiPanel = new UIPanel(container);

  const ctx: AppContext = {
    renderer,
    scene,
    camera,
    brainModel,
    waveOverlay,
    uiPanel,
    startTime: performance.now(),
    rafId: null,
    destroyed: false,
  };

  uiPanel.setScreenshotHandler(() => captureScreenshot(ctx));

  const orbitTick = setupOrbit(ctx);
  setupResize(ctx);

  const store = useStatusStore.getState();
  store.setStatus('focus');
  store.recordFrame(0);

  startRenderLoop(ctx, orbitTick);

  return {
    dispose: () => {
      ctx.destroyed = true;
      if (ctx.rafId !== null) cancelAnimationFrame(ctx.rafId);
      brainModel.dispose();
      waveOverlay.dispose();
      uiPanel.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose?.();
          const mats: THREE.Material[] = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
    },
  };
}

declare global {
  interface Window {
    __neurrowave?: { dispose: () => void };
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.__neurrowave = initApp('app');
  });
}
