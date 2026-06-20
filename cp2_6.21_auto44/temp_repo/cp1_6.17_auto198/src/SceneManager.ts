import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { EventBus } from './EventBus.js';
import {
  ClimateDataSimulator,
  LAT_COUNT,
  LON_COUNT,
} from './ClimateDataSimulator.js';

const X_SCALE = 60;
const Z_SCALE = 45;
const Y_SCALE = 10;

const TRANSITION_MS = 500;

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function tempToColorRGB(temp: number, out: ColorRGB): void {
  const t = clamp((temp + 3) / 6, 0, 1);
  if (t < 0.5) {
    const ratio = t / 0.5;
    out.r = (30 + 225 * ratio) / 255;
    out.g = (144 + 111 * ratio) / 255;
    out.b = 1;
  } else {
    const ratio = (t - 0.5) / 0.5;
    out.r = 1;
    out.g = (255 - 186 * ratio) / 255;
    out.b = (255 - 255 * ratio) / 255;
  }
}

function gridIndex(i: number, j: number): number {
  return i * LON_COUNT + j;
}

class SceneManager {
  private canvas: HTMLCanvasElement;
  private bus: EventBus;
  private simulator: ClimateDataSimulator;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  private surfaceMesh!: THREE.Mesh;
  private wireframeMesh!: THREE.LineSegments;
  private surfaceGeometry!: THREE.BufferGeometry;
  private wireframeGeometry!: THREE.BufferGeometry;

  private vertexBaseX: Float32Array;
  private vertexBaseZ: Float32Array;

  private startHeights: Float32Array;
  private targetHeights: Float32Array;
  private startColors: Float32Array;
  private targetColors: Float32Array;

  private transitionStart: number = -1;
  private transitionActive: boolean = false;

  private raycaster: THREE.Raycaster;
  private mouseNDC: THREE.Vector2;
  private lastMouseScreenX: number = 0;
  private lastMouseScreenY: number = 0;
  private lastHoverTime: number = 0;
  private hoverEnabled: boolean = true;

  private rafId: number = 0;
  private lastFrameTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    bus: EventBus,
    simulator: ClimateDataSimulator,
  ) {
    this.canvas = canvas;
    this.bus = bus;
    this.simulator = simulator;

    const totalVertices = LAT_COUNT * LON_COUNT;

    this.vertexBaseX = new Float32Array(totalVertices);
    this.vertexBaseZ = new Float32Array(totalVertices);
    this.startHeights = new Float32Array(totalVertices);
    this.targetHeights = new Float32Array(totalVertices);
    this.startColors = new Float32Array(totalVertices * 3);
    this.targetColors = new Float32Array(totalVertices * 3);

    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2();

    for (let i = 0; i < LAT_COUNT; i++) {
      for (let j = 0; j < LON_COUNT; j++) {
        const lat = -90 + i * 10;
        const lon = -180 + j * 10;
        const idx = gridIndex(i, j);
        this.vertexBaseX[idx] = (lon / 180) * X_SCALE;
        this.vertexBaseZ[idx] = (lat / 90) * Z_SCALE;
        void lat;
      }
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.controls = new OrbitControls(this.camera, this.canvas);

    this.lastFrameTime = performance.now();
  }

  init(): void {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupControls();
    this.setupLights();
    this.setupHelpers();
    this.createSurface();
    this.setupEventHandlers();
    this.updateYear(2023, true);
    this.animate();
  }

  private setupRenderer(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0F111A, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x0F111A);
    this.scene.fog = new THREE.Fog(0x0F111A, 120, 260);
  }

  private setupCamera(): void {
    this.camera.position.set(40, 50, 60);
    this.camera.lookAt(0, 0, 0);
  }

  private setupControls(): void {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 40;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minPolarAngle = Math.PI * 0.12;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 18;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(50, 80, 40);
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0xaac4ff, 0.35);
    fill.position.set(-40, 30, -50);
    this.scene.add(fill);
  }

  private setupHelpers(): void {
    const outerRingPts: THREE.Vector3[] = [];
    for (let a = 0; a <= Math.PI * 2; a += Math.PI / 64) {
      outerRingPts.push(new THREE.Vector3(Math.cos(a) * 50, -0.01, Math.sin(a) * 50));
    }
    const outerRing = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(outerRingPts),
      new THREE.LineBasicMaterial({ color: 0x2A2D3E, transparent: true, opacity: 0.7 }),
    );
    this.scene.add(outerRing);

    for (let r = 10; r <= 50; r += 10) {
      const pts: THREE.Vector3[] = [];
      for (let a = 0; a <= Math.PI * 2; a += Math.PI / 32) {
        pts.push(new THREE.Vector3(Math.cos(a) * r, -0.01, Math.sin(a) * r));
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x2A2D3E, transparent: true, opacity: 0.5 }),
      );
      this.scene.add(line);
    }

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      const pts: THREE.Vector3[] = [];
      for (let r = 0; r <= 50; r += 2) {
        pts.push(new THREE.Vector3(Math.cos(a) * r, -0.01, Math.sin(a) * r));
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x2A2D3E, transparent: true, opacity: 0.35 }),
      );
      this.scene.add(line);
    }
  }

  private createSurface(): void {
    const totalVerts = LAT_COUNT * LON_COUNT;
    const totalQuads = (LAT_COUNT - 1) * (LON_COUNT - 1);
    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    const indices = new Uint32Array(totalQuads * 6);

    for (let i = 0; i < LAT_COUNT; i++) {
      for (let j = 0; j < LON_COUNT; j++) {
        const idx = gridIndex(i, j);
        positions[idx * 3] = this.vertexBaseX[idx];
        positions[idx * 3 + 1] = 0;
        positions[idx * 3 + 2] = this.vertexBaseZ[idx];
      }
    }

    let p = 0;
    for (let i = 0; i < LAT_COUNT - 1; i++) {
      for (let j = 0; j < LON_COUNT - 1; j++) {
        const a = gridIndex(i, j);
        const b = gridIndex(i, j + 1);
        const c = gridIndex(i + 1, j);
        const d = gridIndex(i + 1, j + 1);
        indices[p++] = a;
        indices[p++] = b;
        indices[p++] = c;
        indices[p++] = b;
        indices[p++] = d;
        indices[p++] = c;
      }
    }

    this.surfaceGeometry = new THREE.BufferGeometry();
    this.surfaceGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.surfaceGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.surfaceGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
    this.surfaceGeometry.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false,
      metalness: 0.05,
      roughness: 0.85,
      transparent: true,
      opacity: 0.95,
    });
    this.surfaceMesh = new THREE.Mesh(this.surfaceGeometry, mat);
    this.scene.add(this.surfaceMesh);

    this.wireframeGeometry = new THREE.WireframeGeometry(this.surfaceGeometry);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x4A6FA5,
      transparent: true,
      opacity: 0.35,
    });
    this.wireframeMesh = new THREE.LineSegments(this.wireframeGeometry, wireMat);
    this.scene.add(this.wireframeMesh);
  }

  private setupEventHandlers(): void {
    window.addEventListener('resize', this.onResize);

    this.bus.on('yearChange', this.onYearChange);
    this.bus.on('autoRotateToggle', this.onAutoRotateToggle);

    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  private onYearChange = (year: number): void => {
    this.updateYear(year, false);
  };

  private onAutoRotateToggle = (on: boolean): void => {
    this.controls.autoRotate = on;
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    this.lastMouseScreenX = e.clientX;
    this.lastMouseScreenY = e.clientY;
    this.mouseNDC.x = (sx / rect.width) * 2 - 1;
    this.mouseNDC.y = -(sy / rect.height) * 2 + 1;
    this.hoverEnabled = true;
  };

  private onPointerLeave = (): void => {
    this.hoverEnabled = false;
    this.bus.emit('hoverData', null);
  };

  updateYear(year: number, immediate: boolean): void {
    void year;
    const data = this.simulator.getDataForYear(year);

    this.startHeights.set(this.targetHeights);
    this.startColors.set(this.targetColors);

    const color: ColorRGB = { r: 0, g: 0, b: 0 };
    for (let i = 0; i < LAT_COUNT; i++) {
      for (let j = 0; j < LON_COUNT; j++) {
        const idx = gridIndex(i, j);
        const temp = data[i][j];
        this.targetHeights[idx] = temp * Y_SCALE;
        tempToColorRGB(temp, color);
        this.targetColors[idx * 3] = color.r;
        this.targetColors[idx * 3 + 1] = color.g;
        this.targetColors[idx * 3 + 2] = color.b;
      }
    }

    if (immediate) {
      this.startHeights.set(this.targetHeights);
      this.startColors.set(this.targetColors);
      this.transitionActive = false;
      this.applyGeometry(1);
    } else {
      this.transitionStart = performance.now();
      this.transitionActive = true;
    }
  }

  private applyGeometry(progress: number): void {
    const posArr = this.surfaceGeometry.attributes.position.array as Float32Array;
    const colArr = this.surfaceGeometry.attributes.color.array as Float32Array;
    const total = LAT_COUNT * LON_COUNT;
    for (let k = 0; k < total; k++) {
      posArr[k * 3 + 1] = lerp(this.startHeights[k], this.targetHeights[k], progress);
      colArr[k * 3] = lerp(this.startColors[k * 3], this.targetColors[k * 3], progress);
      colArr[k * 3 + 1] = lerp(this.startColors[k * 3 + 1], this.targetColors[k * 3 + 1], progress);
      colArr[k * 3 + 2] = lerp(this.startColors[k * 3 + 2], this.targetColors[k * 3 + 2], progress);
    }
    (this.surfaceGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.surfaceGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    this.surfaceGeometry.computeVertexNormals();

    const wfPos = this.wireframeGeometry.attributes.position.array as Float32Array;
    wfPos.set(posArr);
    (this.wireframeGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private doHoverPick(): void {
    if (!this.hoverEnabled) return;
    const now = performance.now();
    if (now - this.lastHoverTime < 30) return;
    this.lastHoverTime = now;

    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const hits = this.raycaster.intersectObject(this.surfaceMesh, false);
    if (hits.length === 0) {
      this.bus.emit('hoverData', null);
      return;
    }

    const hit = hits[0];
    const face = hit.face;
    if (!face) {
      this.bus.emit('hoverData', null);
      return;
    }

    const localPoint = hit.point.clone();
    const posAttr = this.surfaceGeometry.attributes.position;
    const vertCount = posAttr.count;
    let minDist = Infinity;
    let idx = face.a;
    for (const vi of [face.a, face.b, face.c]) {
      if (vi >= vertCount) continue;
      const vx = (posAttr.array as Float32Array)[vi * 3];
      const vy = (posAttr.array as Float32Array)[vi * 3 + 1];
      const vz = (posAttr.array as Float32Array)[vi * 3 + 2];
      const dx = localPoint.x - vx;
      const dy = localPoint.y - vy;
      const dz = localPoint.z - vz;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < minDist) {
        minDist = d;
        idx = vi;
      }
    }
    void localPoint;

    let latI = Math.floor(idx / LON_COUNT);
    let lonJ = idx % LON_COUNT;
    latI = clamp(latI, 0, LAT_COUNT - 1);
    lonJ = clamp(lonJ, 0, LON_COUNT - 1);
    const lat = -90 + latI * 10;
    const lon = -180 + lonJ * 10;

    const tempIdx = gridIndex(latI, lonJ);
    const temp = (this.surfaceGeometry.attributes.position.array as Float32Array)[tempIdx * 3 + 1] / Y_SCALE;

    this.bus.emit('hoverData', {
      lon,
      lat,
      temp,
      screenX: this.lastMouseScreenX,
      screenY: this.lastMouseScreenY,
    });
  }

  private animate = (): void => {
    this.rafId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;

    if (this.transitionActive) {
      let progress = (now - this.transitionStart) / TRANSITION_MS;
      if (progress >= 1) {
        progress = 1;
        this.transitionActive = false;
      }
      const eased = easeInOutCubic(clamp(progress, 0, 1));
      this.applyGeometry(eased);
    }

    this.controls.update();
    this.doHoverPick();
    this.renderer.render(this.scene, this.camera);
    void dt;
  };

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.renderer.dispose();
    this.surfaceGeometry.dispose();
    this.wireframeGeometry.dispose();
    (this.surfaceMesh.material as THREE.Material).dispose();
    (this.wireframeMesh.material as THREE.Material).dispose();
  }
}

export { SceneManager };
