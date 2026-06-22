import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { PointCloudData } from '../DataModule/pointCloudLoader';
import type { MeasurePoint, MeasurementResult } from '../DataModule/measurementTool';

export interface SceneRendererOptions {
  container: HTMLElement;
  data: PointCloudData;
}

interface FilterState {
  min: number;
  max: number;
  targetMin: number;
  targetMax: number;
  animating: boolean;
  startTime: number;
  startMin: number;
  startMax: number;
}

const POINT_SIZE = 3;
const FILTER_DURATION = 300;

class SceneRenderer {
  private container!: HTMLElement;
  private data!: PointCloudData;

  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public renderer!: THREE.WebGLRenderer;
  public controls!: OrbitControls;

  private points!: THREE.Points;
  private baseSizes!: Float32Array;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;

  private hoverSphere!: THREE.Mesh;
  private measureGroup!: THREE.Group;
  private measureLine!: THREE.Line;
  private measureLineTime = 0;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private hoverIndex: number | null = null;

  private filterState: FilterState = {
    min: 0,
    max: 255,
    targetMin: 0,
    targetMax: 255,
    animating: false,
    startTime: 0,
    startMin: 0,
    startMax: 255,
  };

  private running = false;
  private rafId = 0;
  private lastTime = performance.now();
  private fpsUpdateTime = 0;
  private frameCount = 0;
  private currentFps = 60;

  private onFpsUpdate?: (fps: number, visible: number) => void;

  init(options: SceneRendererOptions): void {
    this.container = options.container;
    this.data = options.data;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
    this.camera.position.set(80, 70, 80);
    this.camera.lookAt(0, 10, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.container.appendChild(this.renderer.domElement);

    const light = new THREE.PointLight(0xffffff, 1.2, 500);
    light.position.set(0, 120, 0);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    this.buildPointCloud();
    this.buildInteractionHelpers();
    this.buildMeasureVisuals();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };

    window.addEventListener('resize', this.onResize);
  }

  setFpsCallback(cb: (fps: number, visible: number) => void): void {
    this.onFpsUpdate = cb;
  }

  private buildPointCloud(): void {
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.data.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.data.colors, 3));

    this.baseSizes = new Float32Array(this.data.count);
    this.baseSizes.fill(POINT_SIZE);
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.baseSizes.slice(), 1));

    this.material = new THREE.PointsMaterial({
      size: POINT_SIZE,
      vertexColors: true,
      sizeAttenuation: false,
      transparent: true,
      opacity: 1,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  private buildInteractionHelpers(): void {
    const hoverGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0xffff88,
      transparent: true,
      opacity: 0.85,
    });
    this.hoverSphere = new THREE.Mesh(hoverGeo, hoverMat);
    this.hoverSphere.visible = false;
    this.scene.add(this.hoverSphere);
  }

  private buildMeasureVisuals(): void {
    this.measureGroup = new THREE.Group();
    this.scene.add(this.measureGroup);

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xff3355,
      transparent: true,
      opacity: 1,
    });
    this.measureLine = new THREE.Line(lineGeo, lineMat);
    this.measureLine.visible = false;
    this.measureGroup.add(this.measureLine);
  }

  private onResize = (): void => {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  applyIntensityFilter(min: number, max: number): void {
    if (min === this.filterState.targetMin && max === this.filterState.targetMax) return;
    this.filterState.startMin = this.filterState.min;
    this.filterState.startMax = this.filterState.max;
    this.filterState.targetMin = min;
    this.filterState.targetMax = max;
    this.filterState.animating = true;
    this.filterState.startTime = performance.now();
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private updateFilter(now: number): void {
    if (!this.filterState.animating) {
      this.updatePointSizes(this.filterState.min, this.filterState.max, 1);
      return;
    }
    const raw = (now - this.filterState.startTime) / FILTER_DURATION;
    const t = Math.max(0, Math.min(1, raw));
    const k = this.easeOutCubic(t);
    const curMin = this.filterState.startMin + (this.filterState.targetMin - this.filterState.startMin) * k;
    const curMax = this.filterState.startMax + (this.filterState.targetMax - this.filterState.startMax) * k;
    this.updatePointSizes(curMin, curMax, 1);
    this.filterState.min = curMin;
    this.filterState.max = curMax;
    if (t >= 1) {
      this.filterState.animating = false;
      this.filterState.min = this.filterState.targetMin;
      this.filterState.max = this.filterState.targetMax;
    }
  }

  private updatePointSizes(curMin: number, curMax: number, _k: number): void {
    const sizeAttr = this.geometry.getAttribute('size') as THREE.BufferAttribute;
    const sizes = sizeAttr.array as Float32Array;
    const intensities = this.data.intensities;
    const softBand = 12;
    for (let i = 0; i < this.data.count; i++) {
      const v = intensities[i];
      let scale = 1;
      if (v < curMin) {
        scale = Math.max(0, 1 - (curMin - v) / softBand);
      } else if (v > curMax) {
        scale = Math.max(0, 1 - (v - curMax) / softBand);
      }
      sizes[i] = POINT_SIZE * scale;
    }
    sizeAttr.needsUpdate = true;
  }

  getVisibleCount(): number {
    const { min, max } = this.filterState;
    let count = 0;
    const intensities = this.data.intensities;
    for (let i = 0; i < this.data.count; i++) {
      const v = intensities[i];
      if (v >= min && v <= max) count++;
    }
    return count;
  }

  private updateHover(normalizedX: number, normalizedY: number): void {
    this.pointer.set(normalizedX, normalizedY);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.points, false);
    if (hits.length > 0 && hits[0].index !== undefined) {
      const idx = hits[0].index;
      const v = this.data.intensities[idx];
      if (v >= this.filterState.min && v <= this.filterState.max) {
        this.hoverIndex = idx;
        this.hoverSphere.position.set(
          this.data.positions[idx * 3],
          this.data.positions[idx * 3 + 1],
          this.data.positions[idx * 3 + 2]
        );
        this.hoverSphere.visible = true;
        return;
      }
    }
    this.hoverIndex = null;
    this.hoverSphere.visible = false;
  }

  raycastNormalized(normalizedX: number, normalizedY: number): MeasurePoint | null {
    this.pointer.set(normalizedX, normalizedY);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.points, false);
    if (hits.length > 0 && hits[0].index !== undefined) {
      const idx = hits[0].index;
      return {
        x: this.data.positions[idx * 3],
        y: this.data.positions[idx * 3 + 1],
        z: this.data.positions[idx * 3 + 2],
      };
    }
    return null;
  }

  updateMeasureVisuals(result: MeasurementResult): void {
    while (this.measureGroup.children.length > 1) {
      const c = this.measureGroup.children[this.measureGroup.children.length - 1];
      this.measureGroup.remove(c);
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material.dispose();
      }
    }

    const sphereGeo = new THREE.SphereGeometry(0.5, 16, 16);
    result.points.forEach((p) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(p.x, p.y, p.z);
      this.measureGroup.add(mesh);
    });

    if (result.points.length === 2 && result.distance !== null) {
      const [a, b] = result.points;
      const posAttr = this.measureLine.geometry.getAttribute('position') as THREE.BufferAttribute;
      (posAttr.array as Float32Array).set([a.x, a.y, a.z, b.x, b.y, b.z]);
      posAttr.needsUpdate = true;
      this.measureLine.visible = true;
      this.measureLineTime = 0;
    } else {
      this.measureLine.visible = false;
    }
  }

  private updateMeasureLine(now: number): void {
    if (!this.measureLine.visible) return;
    this.measureLineTime += now - this.lastTime;
    const mat = this.measureLine.material as THREE.LineBasicMaterial;
    mat.opacity = 0.45 + 0.55 * Math.abs(Math.sin(this.measureLineTime / 280));
    mat.transparent = true;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const tick = (): void => {
      if (!this.running) return;
      const now = performance.now();
      const dt = now - this.lastTime;
      this.lastTime = now;

      this.frameCount++;
      if (now - this.fpsUpdateTime >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.fpsUpdateTime));
        this.frameCount = 0;
        this.fpsUpdateTime = now;
        this.onFpsUpdate?.(this.currentFps, this.getVisibleCount());
      }

      this.updateFilter(now);
      this.updateMeasureLine(now);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  setHoverFromScreen(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.updateHover(nx, ny);
  }

  raycastFromScreen(clientX: number, clientY: number): MeasurePoint | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
    return this.raycastNormalized(nx, ny);
  }

  setMeasureMode(active: boolean): void {
    this.renderer.domElement.style.cursor = active ? 'crosshair' : 'default';
    if (!active) {
      this.controls.enabled = true;
    }
  }

  setControlsEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.geometry.dispose();
    this.material.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export const sceneRenderer = new SceneRenderer();
