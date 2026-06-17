import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { EmotionType, EmotionSegment } from '../types';

export interface InteractionCallbacks {
  onHoverEmotion: (emotion: EmotionType | null) => void;
  onHoverSegment: (segment: EmotionSegment | null, screenPos: { x: number; y: number } | null) => void;
  onSubmitBurst: () => void;
}

export interface HoverResult {
  emotion: EmotionType | null;
  segment: EmotionSegment | null;
  worldPoint: THREE.Vector3 | null;
}

export type QueryFunction = (ray: THREE.Ray) => {
  dominantEmotion: EmotionType | null;
  dominantSegment: EmotionSegment | null;
  point: { x: number; y: number; z: number } | null;
};

export class InteractionEngine {
  private container: HTMLElement;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private ndc: THREE.Vector2;
  private callbacks: InteractionCallbacks;
  private queryFn: QueryFunction | null = null;
  private lastHoverEmotion: EmotionType | null = null;
  private lastHoverSegment: EmotionSegment | null = null;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private needsUpdate = false;
  private mouseX = 0;
  private mouseY = 0;
  private resizeObserver: ResizeObserver | null = null;
  private readonly RESPONSIVE_THRESHOLD = 5;

  constructor(
    container: HTMLElement,
    camera: THREE.PerspectiveCamera,
    callbacks: InteractionCallbacks
  ) {
    this.container = container;
    this.camera = camera;
    this.callbacks = callbacks;

    this.controls = new OrbitControls(camera, container);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 40;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 0.9;

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();

    this.setupEventListeners();
  }

  setQueryFunction(fn: QueryFunction): void {
    this.queryFn = fn;
  }

  getControls(): OrbitControls {
    return this.controls;
  }

  getCameraState(): { position: THREE.Vector3; target: THREE.Vector3 } {
    return {
      position: this.camera.position.clone(),
      target: this.controls.target.clone()
    };
  }

  setCameraState(pos: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }): void {
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.controls.target.set(target.x, target.y, target.z);
    this.controls.update();
  }

  resetCamera(): void {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = new THREE.Vector3(0, 2, 16);
    const endTarget = new THREE.Vector3(0, 0, 0);
    const duration = 700;
    const startTime = performance.now();

    const animate = () => {
      const t = Math.min(1, (performance.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.camera.position.lerpVectors(startPos, endPos, eased);
      this.controls.target.lerpVectors(startTarget, endTarget, eased);
      this.controls.update();
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  private setupEventListeners(): void {
    const el = this.container;

    el.addEventListener('mousedown', this.onMouseDown);
    el.addEventListener('mousemove', this.onMouseMove);
    el.addEventListener('mouseup', this.onMouseUp);
    el.addEventListener('mouseleave', this.onMouseLeave);
    el.addEventListener('wheel', this.onWheel, { passive: false });

    el.addEventListener('touchstart', this.onTouchStart, { passive: false });
    el.addEventListener('touchmove', this.onTouchMove, { passive: false });
    el.addEventListener('touchend', this.onTouchEnd);

    window.addEventListener('resize', this.onWindowResize);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.onWindowResize);
      this.resizeObserver.observe(el);
    }
  }

  dispose(): void {
    const el = this.container;
    el.removeEventListener('mousedown', this.onMouseDown);
    el.removeEventListener('mousemove', this.onMouseMove);
    el.removeEventListener('mouseup', this.onMouseUp);
    el.removeEventListener('mouseleave', this.onMouseLeave);
    el.removeEventListener('wheel', this.onWheel);
    el.removeEventListener('touchstart', this.onTouchStart);
    el.removeEventListener('touchmove', this.onTouchMove);
    el.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('resize', this.onWindowResize);
    this.resizeObserver?.disconnect();
    this.controls.dispose();
  }

  private onMouseDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.dragStart.x = e.clientX;
    this.dragStart.y = e.clientY;
  };

  private onMouseUp = (_e: MouseEvent): void => {
    this.isDragging = false;
  };

  private onMouseLeave = (_e: MouseEvent): void => {
    this.isDragging = false;
    this.updateHover(null);
  };

  private onMouseMove = (e: MouseEvent): void => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.needsUpdate = true;

    if (this.isDragging) {
      const ddx = Math.abs(e.clientX - this.dragStart.x);
      const ddy = Math.abs(e.clientY - this.dragStart.y);
      if (ddx > this.RESPONSIVE_THRESHOLD || ddy > this.RESPONSIVE_THRESHOLD) {
        this.updateHover(null);
      }
    }
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.dragStart.x = e.touches[0].clientX;
      this.dragStart.y = e.touches[0].clientY;
      this.mouseX = e.touches[0].clientX;
      this.mouseY = e.touches[0].clientY;
      this.needsUpdate = true;
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      this.mouseX = e.touches[0].clientX;
      this.mouseY = e.touches[0].clientY;
      const ddx = Math.abs(this.mouseX - this.dragStart.x);
      const ddy = Math.abs(this.mouseY - this.dragStart.y);
      if (ddx > this.RESPONSIVE_THRESHOLD || ddy > this.RESPONSIVE_THRESHOLD) {
        this.updateHover(null);
      } else {
        this.needsUpdate = true;
      }
    } else if (e.touches.length === 2) {
      this.updateHover(null);
    }
    if (e.cancelable) e.preventDefault();
  };

  private onTouchEnd = (): void => {
    this.isDragging = false;
  };

  private onWindowResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private updateHover(result: HoverResult | null): void {
    if (result?.emotion !== this.lastHoverEmotion) {
      this.lastHoverEmotion = result?.emotion ?? null;
      this.callbacks.onHoverEmotion(this.lastHoverEmotion);
    }

    const seg = result?.segment ?? null;
    const pos = result ? { x: this.mouseX, y: this.mouseY } : null;
    if (seg !== this.lastHoverSegment || (!seg && this.lastHoverSegment)) {
      this.lastHoverSegment = seg;
      this.callbacks.onHoverSegment(seg, pos);
    }
  }

  tick(): void {
    this.controls.update();

    if (this.isDragging) {
      this.needsUpdate = false;
      return;
    }

    if (!this.needsUpdate) return;
    this.needsUpdate = false;

    if (!this.queryFn) return;

    const rect = this.container.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    this.ndc.x = ((this.mouseX - rect.left) / w) * 2 - 1;
    this.ndc.y = -((this.mouseY - rect.top) / h) * 2 + 1;

    this.raycaster.setFromCamera(this.ndc, this.camera);
    const ray = this.raycaster.ray;

    const result = this.queryFn(ray);
    const worldPoint = result.point
      ? new THREE.Vector3(result.point.x, result.point.y, result.point.z)
      : null;

    this.updateHover({
      emotion: result.dominantEmotion,
      segment: result.dominantSegment,
      worldPoint
    });
  }
}
