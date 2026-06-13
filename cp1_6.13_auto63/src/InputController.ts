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

  public onSpeedChange: ((speed: number) => void) | null = null;
  public onMouseActivity: (() => void) | null = null;

  private pendingForces: TerrainForce[] = [];

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

    this.updateMouse(event);
    this.mouseDownPos.set(event.clientX, event.clientY);
    this.mouseDownTime = performance.now();
    this.isDragging = true;
    this.lastMousePos.set(event.clientX, event.clientY);
    this.lastMouseTime = this.mouseDownTime;
    this.currentSpeed = 0;
    this.hasLastDragPos = false;

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

    if (this.isDragging && event.button === 0) {
      const hit = this.getTerrainHit();
      if (hit) {
        const force: TerrainForce = {
          x: hit.x,
          z: hit.z,
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
            this.pendingForces.push({
              x: ix,
              z: iz,
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

    if (this.isDragging && event.button === 0) {
      const now = performance.now();
      const moveDist = Math.hypot(
        event.clientX - this.mouseDownPos.x,
        event.clientY - this.mouseDownPos.y
      );
      const holdDuration = now - this.mouseDownTime;

      if (moveDist < 5 && holdDuration < 200) {
        // single click handled in doubleClick check
      } else if (moveDist > 5) {
        const hit = this.getTerrainHit();
        if (hit) {
          this.terrain.registerSinkArea(hit.x, hit.z, 2.5);
        }
      }
    }

    this.isDragging = false;
    this.currentSpeed = 0;
    this.hasLastDragPos = false;
  }

  private