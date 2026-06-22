import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CoolingSolution, ThermalResult } from './types';
import { COOLING_SOLUTIONS, tempToColor } from './types';
import { ThermalEngine } from './ThermalEngine';

interface MeshLayer {
  key: 'chip' | 'substrate' | 'heatSink';
  mesh: THREE.Mesh;
  size: [number, number, number];
  vertexWorldPos: Float32Array;
}

export interface SceneHandles {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
}

const CHIP_SIZE: [number, number, number] = [20, 20, 2];
const SUB_SIZE: [number, number, number] = [30, 30, 3];
const HS_SIZE: [number, number, number] = [40, 40, 10];
const BASE_COLOR = 0x808080;
const BG_COLOR = 0x0a0a0f;

export class SceneSetup {
  private readonly container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private chipMesh!: THREE.Mesh;
  private subMesh!: THREE.Mesh;
  private hsMesh!: THREE.Mesh;
  private hottestMesh!: THREE.Mesh;
  private particleSystem!: THREE.Points;
  private particleGeom!: THREE.BufferGeometry;
  private particleMat!: THREE.PointsMaterial;
  private layers: MeshLayer[] = [];
  private currentStats: { tMin: number; tMax: number } = { tMin: 25, tMax: 80 };
  private prevColors: Map<string, Float32Array> = new Map();
  private targetColors: Map<string, Float32Array> = new Map();
  private transitionStart = 0;
  private transitionDuration = 500;
  private inTransition = false;
  private hotFlashStart = 0;
  private rafId: number | null = null;
  private onAnimate: Array<(t: number, dt: number) => void> = [];
  private disposed = false;
  private solutionAccent = new THREE.Color('#3B82F6');

  constructor(container: HTMLElement) {
    this.container = container;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(BG_COLOR, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG_COLOR);
    this.scene.fog = new THREE.Fog(BG_COLOR, 120, 240);

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(60, 60, 60);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, 0, 0);

    this.setupLights();
    this.setupModel();
    this.setupParticles();
    this.setupHelpers();

    const ro = new ResizeObserver(() => this.onResize());
    ro.observe(container);
  }

  private setupLights(): void {
    const amb = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(amb);

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(50, 80, 40);
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0x4488ff, 0.35);
    fill.position.set(-40, 30, -50);
    this.scene.add(fill);

    const bottom = new THREE.PointLight(0x6688ff, 0.5, 100);
    bottom.position.set(0, -30, 0);
    this.scene.add(bottom);

    const rim = new THREE.PointLight(0xff8844, 0.4, 120);
    rim.position.set(-30, 20, 40);
    this.scene.add(rim);
  }

  private buildLayer(
    key: 'chip' | 'substrate' | 'heatSink',
    size: [number, number, number],
    yOffset: number,
    opacity: number,
  ): MeshLayer {
    const sx = Math.max(2, Math.floor(size[0]));
    const sy = Math.max(1, Math.floor(size[2]));
    const sz = Math.max(2, Math.floor(size[1]));
    const geom = new THREE.BoxGeometry(size[0], size[2], size[1], sx, sy, sz);
    const attrCount = geom.attributes.position.count;
    const colors = new Float32Array(attrCount * 3);
    for (let i = 0; i < attrCount; i++) {
      colors[i * 3] = 0.5;
      colors[i * 3 + 1] = 0.5;
      colors[i * 3 + 2] = 0.5;
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity,
      shininess: 30,
      specular: 0x222233,
      side: THREE.DoubleSide,
      flatShading: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(0, yOffset, 0);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const posArr = geom.attributes.position.array as Float32Array;
    const worldPos = new Float32Array(attrCount * 3);
    const tempVec = new THREE.Vector3();
    for (let i = 0; i < attrCount; i++) {
      tempVec.set(posArr[i * 3], posArr[i * 3 + 1], posArr[i * 3 + 2]);
      tempVec.applyMatrix4(mesh.matrixWorld);
      worldPos[i * 3] = tempVec.x;
      worldPos[i * 3 + 1] = tempVec.y + yOffset;
      worldPos[i * 3 + 2] = tempVec.z;
    }
    void tempVec;
    const layer: MeshLayer = { key, mesh, size, vertexWorldPos: worldPos };
    this.layers.push(layer);
    return layer;
  }

  private setupModel(): void {
    this.layers = [];
    const hsY = -(HS_SIZE[2] / 2);
    const subY = HS_SIZE[2] / 2 + SUB_SIZE[2] / 2;
    const chipY = HS_SIZE[2] / 2 + SUB_SIZE[2] + CHIP_SIZE[2] / 2;

    this.hsMesh = this.buildLayer('heatSink', HS_SIZE, hsY, 0.62).mesh;
    this.subMesh = this.buildLayer('substrate', SUB_SIZE, subY, 0.70).mesh;
    this.chipMesh = this.buildLayer('chip', CHIP_SIZE, chipY, 0.78).mesh;

    const edgesMat = new THREE.LineBasicMaterial({ color: 0x4466aa, transparent: true, opacity: 0.4 });
    for (const layer of this.layers) {
      const edges = new THREE.EdgesGeometry(layer.mesh.geometry);
      const line = new THREE.LineSegments(edges, edgesMat);
      layer.mesh.add(line);
    }

    const hotGeom = new THREE.BoxGeometry(CHIP_SIZE[0] * 0.95, 0.15, CHIP_SIZE[1] * 0.95);
    const hotColors = new Float32Array(hotGeom.attributes.position.count * 3);
    for (let i = 0; i < hotColors.length; i += 3) {
      hotColors[i] = 1.0;
      hotColors[i + 1] = 0.27;
      hotColors[i + 2] = 0.0;
    }
    hotGeom.setAttribute('color', new THREE.BufferAttribute(hotColors, 3));
    const hotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.hottestMesh = new THREE.Mesh(hotGeom, hotMat);
    this.hottestMesh.position.set(0, chipY + CHIP_SIZE[2] / 2 + 0.08, 0);
    this.hottestMesh.visible = false;
    this.scene.add(this.hottestMesh);

    this.hotFlashStart = performance.now();
  }

  private setupParticles(): void {
    const maxVerts = 60000;
    this.particleGeom = new THREE.BufferGeometry();
    const pos = new Float32Array(maxVerts * 3);
    const col = new Float32Array(maxVerts * 3);
    this.particleGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particleGeom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.particleGeom.setDrawRange(0, 0);

    this.particleMat = new THREE.PointsMaterial({
      size: 2.0,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particleSystem = new THREE.Points(this.particleGeom, this.particleMat);
    this.scene.add(this.particleSystem);
  }

  private setupHelpers(): void {
    const grid = new THREE.GridHelper(120, 40, 0x1e2a4a, 0x141a2e);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    grid.position.y = -HS_SIZE[2] / 2 - 0.2;
    this.scene.add(grid);

    const axes = new THREE.AxesHelper(15);
    axes.position.set(-40, -HS_SIZE[2] / 2 - 0.19, -40);
    this.scene.add(axes);
  }

  getHandles(): SceneHandles {
    return {
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      controls: this.controls,
    };
  }

  updateTemperatureColors(
    engine: ThermalEngine,
    result: ThermalResult,
    stats: { tMin: number; tMax: number },
  ): void {
    this.currentStats = stats;
    for (const layer of this.layers) {
      const geom = layer.mesh.geometry as THREE.BufferGeometry;
      const attr = geom.attributes.color as THREE.BufferAttribute;
      const count = attr.count;
      const target = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const wx = layer.vertexWorldPos[i * 3];
        const wy = layer.vertexWorldPos[i * 3 + 1];
        const wz = layer.vertexWorldPos[i * 3 + 2];
        const t = engine.sampleTemp([wx, wz, wy], result.temperatures);
        const [r, g, b] = tempToColor(t, stats.tMin, stats.tMax);
        target[i * 3] = r;
        target[i * 3 + 1] = g;
        target[i * 3 + 2] = b;
      }
      const cur = new Float32Array(attr.array as Float32Array);
      this.prevColors.set(layer.key, cur);
      this.targetColors.set(layer.key, target);
    }
    this.transitionStart = performance.now();
    this.inTransition = true;
  }

  private applyTransitionColors(): void {
    const now = performance.now();
    let t = (now - this.transitionStart) / this.transitionDuration;
    if (t >= 1) {
      t = 1;
      this.inTransition = false;
    }
    const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
    for (const layer of this.layers) {
      const prev = this.prevColors.get(layer.key);
      const tgt = this.targetColors.get(layer.key);
      if (!prev || !tgt) continue;
      const geom = layer.mesh.geometry as THREE.BufferGeometry;
      const attr = geom.attributes.color as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < arr.length; i++) {
        arr[i] = prev[i] + (tgt[i] - prev[i]) * ease;
      }
      attr.needsUpdate = true;
    }
  }

  updateParticles(positions: Float32Array, colors: Float32Array, count: number): void {
    const posAttr = this.particleGeom.attributes.position as THREE.BufferAttribute;
    const colAttr = this.particleGeom.attributes.color as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;
    const limit = Math.min(count, posArr.length / 3);
    const copyN = limit * 3;
    for (let i = 0; i < copyN; i++) {
      posArr[i] = positions[i] ?? 0;
      colArr[i] = colors[i] ?? 0;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    this.particleGeom.setDrawRange(0, limit);
    this.particleGeom.computeBoundingSphere();
  }

  setSolutionTransition(solution: CoolingSolution): void {
    const accents: Record<CoolingSolution, string> = {
      copper_heat_sink: '#B87333',
      aluminum_heat_sink: '#C0C0C0',
      thermal_paste: '#8B4513',
      microchannel: '#1E90FF',
      tec: '#8A2BE2',
    };
    this.solutionAccent = new THREE.Color(accents[solution] ?? '#3B82F6');
    this.transitionStart = performance.now();
    this.inTransition = true;
    void COOLING_SOLUTIONS[solution];
  }

  flashHottestRegion(maxTemp: number, threshold: number): void {
    if (maxTemp >= threshold) {
      this.hottestMesh.visible = true;
      const now = performance.now();
      const phase = ((now - this.hotFlashStart) % 300) / 300;
      const alpha = 0.6 + 0.4 * (0.5 - 0.5 * Math.cos(phase * 2 * Math.PI));
      (this.hottestMesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      const scaleBoost = 1.0 + 0.1 * Math.sin(phase * 2 * Math.PI);
      this.hottestMesh.scale.set(scaleBoost, 1, scaleBoost);
    } else {
      this.hottestMesh.visible = false;
    }
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w <= 0 || h <= 0) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  registerAnimateCallback(cb: (t: number, dt: number) => void): () => void {
    this.onAnimate.push(cb);
    return () => {
      const idx = this.onAnimate.indexOf(cb);
      if (idx >= 0) this.onAnimate.splice(idx, 1);
    };
  }

  startLoop(): void {
    if (this.rafId !== null) return;
    let last = performance.now();
    const loop = () => {
      if (this.disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (const cb of this.onAnimate) {
        try { cb(now, dt); } catch { /* noop */ }
      }
      if (this.inTransition) {
        this.applyTransitionColors();
      }
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getCurrentStats(): { tMin: number; tMax: number } {
    return this.currentStats;
  }

  dispose(): void {
    this.disposed = true;
    this.stopLoop();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat.dispose();
      }
    });
    this.particleGeom.dispose();
    this.particleMat.dispose();
  }
}
