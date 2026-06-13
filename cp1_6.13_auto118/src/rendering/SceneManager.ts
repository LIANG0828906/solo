import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { StarData } from '@/core/GalaxyGenerator';

const COLOR_A = new THREE.Color(50 / 255, 100 / 255, 255 / 255);
const COLOR_B = new THREE.Color(255 / 255, 150 / 255, 50 / 255);
const COLOR_WARM = new THREE.Color(255 / 255, 80 / 255, 60 / 255);
const COLOR_COOL = new THREE.Color(60 / 255, 120 / 255, 255 / 255);

const BG_STAR_COUNT = 200;
const TRAIL_FRAMES = 300;

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private starPoints: THREE.Points | null = null;
  private starGeometry: THREE.BufferGeometry | null = null;
  private starMaterial: THREE.PointsMaterial | null = null;
  private trailLines: THREE.Line[] = [];
  private trailGeometries: THREE.BufferGeometry[] = [];
  private bgStars: THREE.Points | null = null;

  private trailMode = false;
  private trailHistory: Float32Array[] = [];
  private trailHead = 0;
  private trailCount = 0;
  private galaxyAssignments: Uint8Array | null = null;
  private initialSizes: Float32Array | null = null;

  private targetLookAt = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private animatingCamera = false;
  private cameraAnimStart = 0;
  private cameraAnimDuration = 800;
  private cameraFrom = new THREE.Vector3();
  private cameraTo = new THREE.Vector3();
  private targetFrom = new THREE.Vector3();
  private targetTo = new THREE.Vector3();

  private animFrameId: number | null = null;
  private onFrameCb: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05060f);

    this.camera = new THREE.PerspectiveCamera(
      60, container.clientWidth / container.clientHeight, 0.1, 5000
    );
    this.camera.position.set(0, 80, 300);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x05060f, 1);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    this.controls.minDistance = 50;
    this.controls.maxDistance = 1500;

    this.createBackgroundStars();
    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  setOnFrame(cb: () => void) {
    this.onFrameCb = cb;
  }

  private createBackgroundStars() {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(BG_STAR_COUNT * 3);
    const colors = new Float32Array(BG_STAR_COUNT * 3);
    for (let i = 0; i < BG_STAR_COUNT; i++) {
      const r = 800 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = 0.5 + Math.random() * 0.5;
      colors[i * 3] = c;
      colors[i * 3 + 1] = c;
      colors[i * 3 + 2] = c;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.2, vertexColors: true, transparent: true,
      opacity: 0.8, sizeAttenuation: false,
    });
    this.bgStars = new THREE.Points(geom, mat);
    this.scene.add(this.bgStars);
  }

  buildStars(stars: StarData[]) {
    this.clearStars();
    const count = stars.length;

    this.galaxyAssignments = new Uint8Array(count);
    this.initialSizes = new Float32Array(count);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const s = stars[i];
      positions[i * 3] = s.x;
      positions[i * 3 + 1] = s.y;
      positions[i * 3 + 2] = s.z;
      this.galaxyAssignments[i] = s.galaxy;
      const baseColor = s.galaxy === 0 ? COLOR_A : COLOR_B;
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
      const size = 1 + (s.mass / 3.2) * 3;
      sizes[i] = size;
      this.initialSizes[i] = size;
    }

    this.starGeometry = new THREE.BufferGeometry();
    this.starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.starMaterial = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    (this.starMaterial as unknown as { onBeforeCompile: (shader: unknown) => void }).onBeforeCompile = (shader: { vertexShader: string }) => {
      shader.vertexShader = shader.vertexShader
        .replace('attribute vec3 color;', 'attribute vec3 color;\nattribute float size;')
        .replace('gl_PointSize = size;', 'gl_PointSize = size * 3.0;');
    };

    this.starPoints = new THREE.Points(this.starGeometry, this.starMaterial);
    this.starPoints.frustumCulled = false;
    this.scene.add(this.starPoints);

    this.trailHistory = [];
    this.trailHead = 0;
    this.trailCount = 0;
    this.clearTrails();
    this.buildTrails(count);
    this.updateTrails(positions);
  }

  private buildTrails(count: number) {
    this.trailLines = [];
    this.trailGeometries = [];
    if (!this.trailMode) return;

    for (let i = 0; i < count; i++) {
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(TRAIL_FRAMES * 3);
      const colors = new Float32Array(TRAIL_FRAMES * 3);
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geom.setDrawRange(0, 0);

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geom, mat);
      line.frustumCulled = false;
      this.scene.add(line);
      this.trailLines.push(line);
      this.trailGeometries.push(geom);
    }
  }

  private clearTrails() {
    for (const l of this.trailLines) {
      this.scene.remove(l);
      (l.geometry as THREE.BufferGeometry).dispose();
      (l.material as THREE.Material).dispose();
    }
    this.trailLines = [];
    this.trailGeometries = [];
  }

  private clearStars() {
    if (this.starPoints) {
      this.scene.remove(this.starPoints);
      this.starGeometry?.dispose();
      this.starMaterial?.dispose();
      this.starPoints = null;
      this.starGeometry = null;
      this.starMaterial = null;
    }
    this.clearTrails();
  }

  setTrailMode(enabled: boolean) {
    if (this.trailMode === enabled) return;
    this.trailMode = enabled;
    this.trailHead = 0;
    this.trailCount = 0;
    this.trailHistory = [];

    if (this.starPoints) {
      const count = this.galaxyAssignments?.length ?? 0;
      this.clearTrails();
      if (enabled) this.buildTrails(count);
    }
  }

  updatePositions(positions: Float32Array, velocities: Float32Array) {
    if (!this.starGeometry || !this.galaxyAssignments || !this.initialSizes) return;

    const posAttr = this.starGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.starGeometry.getAttribute('color') as THREE.BufferAttribute;
    (posAttr.array as Float32Array).set(positions);
    posAttr.needsUpdate = true;

    const n = positions.length / 3;
    let cx = 0, cy = 0, cz = 0;
    let maxSpeed = 1;

    for (let i = 0; i < n; i++) {
      const vx = velocities[i * 3];
      const vy = velocities[i * 3 + 1];
      const vz = velocities[i * 3 + 2];
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (speed > maxSpeed) maxSpeed = speed;
    }

    for (let i = 0; i < n; i++) {
      cx += positions[i * 3];
      cy += positions[i * 3 + 1];
      cz += positions[i * 3 + 2];

      const vx = velocities[i * 3];
      const vy = velocities[i * 3 + 1];
      const vz = velocities[i * 3 + 2];
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const t = Math.min(speed / Math.max(maxSpeed, 50), 1);

      const base = this.galaxyAssignments[i] === 0 ? COLOR_A : COLOR_B;
      const warmT = t * 0.8;
      const r = base.r * (1 - warmT) + COLOR_WARM.r * warmT;
      const g = base.g * (1 - warmT) + COLOR_WARM.g * warmT;
      const b = base.b * (1 - warmT) + COLOR_WARM.b * warmT;
      colAttr.setXYZ(i, r, g, b);
    }
    colAttr.needsUpdate = true;

    if (n > 0) {
      this.targetLookAt.set(cx / n, cy / n, cz / n);
    }

    if (this.trailMode) {
      this.updateTrails(positions);
    }
  }

  private updateTrails(positions: Float32Array) {
    if (!this.trailMode || !this.galaxyAssignments) return;

    const snap = new Float32Array(positions);
    this.trailHistory[this.trailHead] = snap;
    this.trailHead = (this.trailHead + 1) % TRAIL_FRAMES;
    this.trailCount = Math.min(this.trailCount + 1, TRAIL_FRAMES);

    const starCount = positions.length / 3;
    for (let i = 0; i < starCount && i < this.trailGeometries.length; i++) {
      const geom = this.trailGeometries[i];
      const posArr = (geom.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
      const colArr = (geom.getAttribute('color') as THREE.BufferAttribute).array as Float32Array;
      const base = this.galaxyAssignments[i] === 0 ? COLOR_A : COLOR_B;

      for (let t = 0; t < this.trailCount; t++) {
        const histIdx = (this.trailHead - this.trailCount + t + TRAIL_FRAMES) % TRAIL_FRAMES;
        const history = this.trailHistory[histIdx];
        if (!history) continue;
        posArr[t * 3] = history[i * 3];
        posArr[t * 3 + 1] = history[i * 3 + 1];
        posArr[t * 3 + 2] = history[i * 3 + 2];

        const alphaT = t / Math.max(this.trailCount - 1, 1);
        const r = base.r * (1 - alphaT) + COLOR_WARM.r * alphaT;
        const g = base.g * (1 - alphaT * 0.5) + COLOR_WARM.g * (alphaT * 0.5);
        const b = COLOR_COOL.b * (1 - alphaT) + base.b * alphaT;
        colArr[t * 3] = r * alphaT;
        colArr[t * 3 + 1] = g * alphaT;
        colArr[t * 3 + 2] = b * alphaT;
      }
      (geom.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (geom.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
      geom.setDrawRange(0, this.trailCount);
    }
  }

  resetCamera() {
    this.animatingCamera = true;
    this.cameraAnimStart = performance.now();
    this.cameraFrom.copy(this.camera.position);
    this.cameraTo.set(0, 80, 300);
    this.targetFrom.copy(this.controls.target);
    this.targetTo.set(0, 0, 0);
  }

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private easeInOut(t: number) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    if (this.animatingCamera) {
      const t = Math.min((now - this.cameraAnimStart) / this.cameraAnimDuration, 1);
      const e = this.easeInOut(t);
      this.camera.position.lerpVectors(this.cameraFrom, this.cameraTo, e);
      this.controls.target.lerpVectors(this.targetFrom, this.targetTo, e);
      if (t >= 1) this.animatingCamera = false;
    }

    if (!this.animatingCamera) {
      this.currentLookAt.lerp(this.targetLookAt, 0.04);
      this.controls.target.lerp(this.currentLookAt, 0.02);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.onFrameCb?.();
  };

  dispose() {
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    this.clearStars();
    if (this.bgStars) {
      this.scene.remove(this.bgStars);
      (this.bgStars.geometry as THREE.BufferGeometry).dispose();
      (this.bgStars.material as THREE.Material).dispose();
    }
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
