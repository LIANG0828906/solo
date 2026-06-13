import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TerrainEngine, TerrainForce } from './TerrainEngine';
import { ParticleSystem } from './ParticleSystem';

export interface InputEvent {
  type: 'drag' | 'click' | 'doubleClick' | 'move' | 'up' | 'down';
  x: number;
  z: number;
  speed: number;
  pressure: number;
}

export class InputController {
  private container: HTMLElement;
  private camera: THREE.PerspectiveCamera;
  private terrain: TerrainEngine;
  private particleSystem: ParticleSystem;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private isDragging = false;
  private lastMousePos = new THREE.Vector2();
  private lastMouseTime = 0;
  private currentSpeed = 0;
  private smoothedSpeed = 0;
  private pressure = 0;

  private lastClickTime = 0;
  private lastClickPos = new THREE.Vector2();
  private doubleClickThreshold = 300;
  private doubleClickDistance = 20;

  private mouseDownPos = new THREE.Vector2();
  private mouseDownTime = 0;

  private lastDragWorldPos = new THREE.Vector3();
  private hasLastDragPos = false;

  private dragStartWorldPos: THREE.Vector3 | null = null;

  public onSpeedChange: ((speed: number) => void) | null = null;
  public onMouseActivity: (() => void) | null = null;

  private pendingForces: TerrainForce[] = [];
  private lastDragEndPos: { x: number; z: number } | null = null;

  constructor(
    container: HTMLElement,
    camera: THREE.PerspectiveCamera,
    terrain: TerrainEngine,
    particleSystem: ParticleSystem,
    controls: OrbitControls
  ) {
    this.container = container;
    this.camera = camera;
    this.terrain = terrain;
    this.particleSystem = particleSystem;
    this.controls = controls;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.bindEvents();
  }

  private bindEvents(): void {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('mouseleave', this.onMouseUp.bind(this));
    this.container.addEventListener('wheel', this.onWheel.bind(this));
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private mercatorProject(lon: number, lat: number): { x: number; z: number } {
    const x = lon;
    const z = Math.log(Math.tan(Math.PI / 4 + lat / 2));
    return { x, z };
  }

  private getTerrainHit(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObject(this.terrain.mesh);
    if (hits.length > 0) {
      return hits[0].point;
    }
    return null;
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;

    this.controls.enabled = false;

    this.updateMouse(event);
    this.mouseDownPos.set(event.clientX, event.clientY);
    this.mouseDownTime = performance.now();
    this.isDragging = true;
    this.lastMousePos.set(event.clientX, event.clientY);
    this.lastMouseTime = this.mouseDownTime;
    this.currentSpeed = 0;
    this.hasLastDragPos = false;

    const hit = this.getTerrainHit();
    if (hit) {
      this.dragStartWorldPos = hit.clone();
    }

    const now = performance.now();
    const timeSinceLastClick = now - this.lastClickTime;
    const distFromLastClick = Math.hypot(
      event.clientX - this.lastClickPos.x,
      event.clientY - this.lastClickPos.y
    );

    if (timeSinceLastClick < this.doubleClickThreshold && distFromLastClick < this.doubleClickDistance) {
      this.handleDoubleClick();
      this.lastClickTime = 0;
    } else {
      this.lastClickTime = now;
      this.lastClickPos.set(event.clientX, event.clientY);
    }

    if (this.onMouseActivity) this.onMouseActivity();
  }

  private onMouseMove(event: MouseEvent): void {
    this.updateMouse(event);

    const now = performance.now();
    const dt = Math.max(1, now - this.lastMouseTime);
    const dx = event.clientX - this.lastMousePos.x;
    const dy = event.clientY - this.lastMousePos.y;
    const pixelSpeed = Math.hypot(dx, dy) / dt;

    this.currentSpeed = Math.min(1, pixelSpeed * 3);
    this.smoothedSpeed += (this.currentSpeed - this.smoothedSpeed) * 0.15;

    if (this.onSpeedChange) {
      this.onSpeedChange(this.smoothedSpeed);
    }

    this.pressure = this.isDragging ? Math.min(1, pixelSpeed * 5) : 0;

    if (this.isDragging) {
      const hit = this.getTerrainHit();
      if (hit) {
        const mercator = this.mercatorProject(hit.x / 25, hit.z / 25);
        const force: TerrainForce = {
          x: mercator.x * 25,
          z: mercator.z * 25,
          strength: Math.min(10, this.smoothedSpeed * 10),
          radius: 2.5,
          isSink: false,
        };
        this.pendingForces.push(force);

        if (this.hasLastDragPos) {
          const dist = hit.distanceTo(this.lastDragWorldPos);
          const steps = Math.max(1, Math.floor(dist / 1.5));
          for (let s = 1; s < steps; s++) {
            const t = s / steps;
            const ix = this.lastDragWorldPos.x + (hit.x - this.lastDragWorldPos.x) * t;
            const iz = this.lastDragWorldPos.z + (hit.z - this.lastDragWorldPos.z) * t;
            const interpMercator = this.mercatorProject(ix / 25, iz / 25);
            this.pendingForces.push({
              x: interpMercator.x * 25,
              z: interpMercator.z * 25,
              strength: Math.min(10, this.smoothedSpeed * 10) * 0.7,
              radius: 2,
              isSink: false,
            });
          }
        }

        this.lastDragWorldPos.copy(hit);
        this.hasLastDragPos = true;
      }
    }

    this.lastMousePos.set(event.clientX, event.clientY);
    this.lastMouseTime = now;

    if (this.onMouseActivity) this.onMouseActivity();
  }

  private onMouseUp(event: MouseEvent): void {
    if (event.button !== 0 && event.type !== 'mouseleave') return;

    if (this.isDragging && (event.button === 0 || event.type === 'mouseleave')) {
      const now = performance.now();
      const moveDist = Math.hypot(
        event.clientX - this.mouseDownPos.x,
        event.clientY - this.mouseDownPos.y
      );
      const holdDuration = now - this.mouseDownTime;

      if (moveDist > 5) {
        const hit = this.getTerrainHit();
        if (hit && this.dragStartWorldPos) {
          const midX = (this.dragStartWorldPos.x + hit.x) / 2;
          const midZ = (this.dragStartWorldPos.z + hit.z) / 2;
          this.lastDragEndPos = { x: midX, z: midZ };
          this.terrain.registerSinkArea(midX, midZ, 3);
        }
      }
    }

    this.isDragging = false;
    this.currentSpeed = 0;
    this.smoothedSpeed = 0;
    this.hasLastDragPos = false;
    this.dragStartWorldPos = null;
    this.controls.enabled = true;

    if (this.onSpeedChange) {
      this.onSpeedChange(0);
    }
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private handleDoubleClick(): void {
    const hit = this.getTerrainHit();
    if (hit) {
      this.terrain.createPool(hit.x, hit.z, 3);
      this.particleSystem.spawnPoolEdgeFountains(hit.x, hit.z, 3);
    }
  }

  public getSmoothedSpeed(): number {
    return this.smoothedSpeed;
  }

  public getPressure(): number {
    return this.pressure;
  }

  public consumePendingForces(): TerrainForce[] {
    const forces = [...this.pendingForces];
    this.pendingForces = [];
    return forces;
  }

  public getLastDragEndPos(): { x: number; z: number } | null {
    return this.lastDragEndPos;
  }

  public broadcastEvents(): InputEvent[] {
    const events: InputEvent[] = [];
    if (this.isDragging) {
      const hit = this.getTerrainHit();
      if (hit) {
        events.push({
          type: 'drag',
          x: hit.x,
          z: hit.z,
          speed: this.smoothedSpeed,
          pressure: this.pressure,
        });
      }
    }
    return events;
  }

  public dispose(): void {
    this.container.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.removeEventListener('mouseleave', this.onMouseUp.bind(this));
    this.container.removeEventListener('wheel', this.onWheel.bind(this));
  }
}
