import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN, { Tween } from '@tweenjs/tween.js';
import {
  createHeatmapMesh,
  createRoadSkeletonLines,
  createBaseGrid,
  DisplayMode,
  HeatmapMeshResult
} from './heatmapCalculator';
import {
  TrafficDataset,
  TimeSlotData,
  GRID_SIZE,
  gridToDensityArray,
  lerpDensityArray
} from './dataProcessor';

export interface SceneCallbacks {
  onCellClick: (x: number, z: number, worldPos: THREE.Vector3) => void;
}

export class SceneController {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private dataset: TrafficDataset;
  private heatmap!: HeatmapMeshResult;
  private roadLines!: ReturnType<typeof createRoadSkeletonLines>;

  private currentTimeSlot: number = 0;
  private currentDensities: Float32Array;
  private targetDensities: Float32Array;
  private interpolationState: { t: number } = { t: 1.0 };
  private interpolationTween: Tween<{ t: number }> | null = null;

  private autoRotateEnabled: boolean = false;
  private autoRotateStartTime: number = 0;
  private autoRotateDelay: number = 5000;
  private autoRotatePeriod: number = 30000;
  private baseCameraAngle: number = 0;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private callbacks: SceneCallbacks;

  private rafId: number = 0;
  private running: boolean = false;

  constructor(container: HTMLElement, dataset: TrafficDataset, callbacks: SceneCallbacks) {
    this.container = container;
    this.dataset = dataset;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.currentDensities = gridToDensityArray(dataset.timeSlots[0].grid);
    this.targetDensities = new Float32Array(this.currentDensities);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.Fog(0x0a0a1a, 80, 180);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 60, 60);
    this.camera.lookAt(0, 0, 0);
    this.baseCameraAngle = Math.atan2(this.camera.position.x, this.camera.position.z);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 25;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.enablePan = false;
    this.controls.target.set(0, 0, 0);

    this._setupLights();
    this._setupSceneObjects();
    this._setupEvents();

    setTimeout(() => {
      this.autoRotateEnabled = true;
      this.autoRotateStartTime = performance.now() + this.autoRotateDelay;
    }, 100);
  }

  private _setupLights(): void {
    const ambient = new THREE.AmbientLight(0x404060, 0.45);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(40, 70, 30);
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0x4466ff, 0.25);
    fill.position.set(-40, 30, -30);
    this.scene.add(fill);
  }

  private _setupSceneObjects(): void {
    const baseGrid = createBaseGrid();
    this.scene.add(baseGrid);

    this.heatmap = createHeatmapMesh(this.currentDensities);
    this.scene.add(this.heatmap.mesh);

    this.roadLines = createRoadSkeletonLines(this.dataset.roadSkeletons);
    this.scene.add(this.roadLines.group);
    this.roadLines.setAppear(1.0);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE).rotateX(-Math.PI / 2)),
      new THREE.LineBasicMaterial({ color: 0x2d2d5e, transparent: true, opacity: 0.35 })
    );
    edges.position.y = 0.005;
    this.scene.add(edges);
  }

  private _setupEvents(): void {
    window.addEventListener('resize', this._onResize);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this._onPointerDown);
    canvas.style.touchAction = 'none';
  }

  private _onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private _onPointerDown = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const hits = this.raycaster.intersectObject(this.heatmap.mesh, false);
    if (hits.length > 0 && hits[0].instanceId !== undefined) {
      const { x, z } = this.heatmap.getCellFromInstance(hits[0].instanceId);
      const worldPos = hits[0].point.clone();
      this.callbacks.onCellClick(x, z, worldPos);
    }
  };

  public setTimeSlot(index: number, animate: boolean = true): void {
    const clamped = Math.max(0, Math.min(this.dataset.timeSlots.length - 1, index));
    if (clamped === this.currentTimeSlot && this.interpolationState.t >= 1) return;

    this.currentTimeSlot = clamped;
    this.targetDensities = gridToDensityArray(this.dataset.timeSlots[clamped].grid);

    if (this.interpolationTween) {
      this.interpolationTween.stop();
    }

    if (!animate) {
      this.currentDensities = new Float32Array(this.targetDensities);
      this.heatmap.updateDensities(this.currentDensities);
      this.interpolationState.t = 1;
      return;
    }

    const fromState = { t: 0 };
    const startDensities = new Float32Array(this.currentDensities);

    this.interpolationState = { t: 0 };
    this.interpolationTween = new TWEEN.Tween(this.interpolationState)
      .to({ t: 1 }, 800)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        lerpDensityArray(startDensities, this.targetDensities, this.interpolationState.t, this.currentDensities);
        this.heatmap.updateDensities(this.currentDensities);
        this.roadLines.setAppear(0.3 + this.interpolationState.t * 0.7);
      })
      .onComplete(() => {
        this.roadLines.setAppear(1.0);
      })
      .start();
  }

  public setGain(gain: number): void {
    this.heatmap.setGain(gain);
  }

  public setDisplayMode(mode: DisplayMode): void {
    this.heatmap.setDisplayMode(mode);
    if (mode === DisplayMode.HEATMAP) {
      this.roadLines.setAppear(0.25);
    } else if (mode === DisplayMode.ROAD) {
      this.roadLines.setAppear(1.0);
    } else {
      this.roadLines.setAppear(0.6);
    }
  }

  public setSelectedCell(x: number | null, z: number | null): void {
    this.heatmap.setSelectedCell(x, z);
  }

  public getTimeSlotData(index: number): TimeSlotData | null {
    return this.dataset.timeSlots[index] || null;
  }

  public getDensityAt(x: number, z: number): number {
    return this.heatmap.getDensityAt(x, z);
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this._tick();
  }

  public stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    this.renderer.domElement.removeEventListener('pointerdown', this._onPointerDown);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }

  private _tick = (): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this._tick);

    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    TWEEN.update();

    this.heatmap.material.uniforms.uTime.value = elapsed;
    this.heatmap.material.uniforms.uPulsePhase.value = elapsed * Math.PI * 5;

    if (this.autoRotateEnabled) {
      const now = performance.now();
      if (now > this.autoRotateStartTime) {
        const t = (now - this.autoRotateStartTime) / this.autoRotatePeriod;
        const angle = this.baseCameraAngle + t * Math.PI * 2;
        const dist = Math.sqrt(
          this.camera.position.x * this.camera.position.x +
          this.camera.position.z * this.camera.position.z
        );
        this.camera.position.x = Math.sin(angle) * dist;
        this.camera.position.z = Math.cos(angle) * dist;
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
      } else {
        this.controls.update();
      }
    } else {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  };
}
