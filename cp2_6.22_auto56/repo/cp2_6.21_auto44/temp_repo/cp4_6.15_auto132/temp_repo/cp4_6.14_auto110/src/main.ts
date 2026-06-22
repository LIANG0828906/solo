import * as THREE from 'three';
import { ParticleSystem } from './particleSystem';
import { PhysicsEngine } from './physicsEngine';
import { UIController } from './uiController';

const CAMERA_INITIAL_POS = new THREE.Vector3(0, 8, 22);
const CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const MIN_ZOOM = 5;
const MAX_ZOOM = 30;
const DAMPING = 0.95;
const FLYBACK_DURATION = 1.5;
const FPS_WINDOW_SIZE = 60;
const PERFORMANCE_UPDATE_INTERVAL = 500;
const FPS_INITIAL_SMOOTH_FRAMES = 30;
const DEFAULT_FPS = 60;

class GalaxyApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvasContainer: HTMLElement;

  private particleSystem: ParticleSystem;
  private physicsEngine: PhysicsEngine;
  private uiController: UIController;

  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private rotationVelocityX: number = 0;
  private rotationVelocityY: number = 0;
  private cameraTheta: number = 0;
  private cameraPhi: number = Math.atan2(
    CAMERA_INITIAL_POS.y,
    Math.sqrt(CAMERA_INITIAL_POS.x ** 2 + CAMERA_INITIAL_POS.z ** 2)
  );
  private cameraDistance: number = CAMERA_INITIAL_POS.length();

  private isFlyingBack: boolean = false;
  private flybackStartTime: number = 0;
  private flybackStartTheta: number = 0;
  private flybackStartPhi: number = 0;
  private flybackStartDistance: number = 0;

  private frameTimestamps: number[] = [];
  private smoothedFps: number = DEFAULT_FPS;
  private updateCount: number = 0;
  private updateWindowStart: number = 0;
  private lastPerformanceUpdate: number = 0;

  constructor() {
    this.canvasContainer = document.getElementById('canvas-container')!;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.canvasContainer.appendChild(this.renderer.domElement);

    this.particleSystem = new ParticleSystem(this.scene);
    this.physicsEngine = new PhysicsEngine(this.particleSystem);
    this.uiController = new UIController(this.physicsEngine);

    this.bindEvents();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.cos(this.cameraPhi) * Math.sin(this.cameraTheta);
    const y = this.cameraDistance * Math.sin(this.cameraPhi);
    const z = this.cameraDistance * Math.cos(this.cameraPhi) * Math.cos(this.cameraTheta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(CAMERA_TARGET);
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.rotationVelocityX = 0;
      this.rotationVelocityY = 0;
      this.isFlyingBack = false;
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;

      this.rotationVelocityX = dx * 0.005;
      this.rotationVelocityY = dy * 0.005;

      this.cameraTheta += this.rotationVelocityX;
      this.cameraPhi = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, this.cameraPhi + this.rotationVelocityY)
      );
      this.updateCameraPosition();

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      this.cameraDistance = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, this.cameraDistance + e.deltaY * zoomSpeed * this.cameraDistance)
      );
      this.updateCameraPosition();
    }, { passive: false });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Space' && !this.isFlyingBack) {
        e.preventDefault();
        this.isFlyingBack = true;
        this.flybackStartTime = performance.now();
        this.flybackStartTheta = this.cameraTheta;
        this.flybackStartPhi = this.cameraPhi;
        this.flybackStartDistance = this.cameraDistance;
        this.rotationVelocityX = 0;
        this.rotationVelocityY = 0;
      }
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private computeAverageFps(now: number): number {
    this.frameTimestamps.push(now);
    if (this.frameTimestamps.length > FPS_WINDOW_SIZE) {
      this.frameTimestamps.shift();
    }

    const frames = this.frameTimestamps.length;
    if (frames < 2) {
      return DEFAULT_FPS;
    }

    const actualFrames = frames - 1;
    const totalTime = (this.frameTimestamps[frames - 1] - this.frameTimestamps[0]) / 1000;
    if (totalTime <= 0) {
      return DEFAULT_FPS;
    }
    const rawFps = actualFrames / totalTime;

    if (frames < FPS_INITIAL_SMOOTH_FRAMES) {
      const alpha = actualFrames / FPS_INITIAL_SMOOTH_FRAMES;
      this.smoothedFps = DEFAULT_FPS * (1 - alpha) + rawFps * alpha;
    } else {
      const smoothing = 0.85;
      this.smoothedFps = this.smoothedFps * smoothing + rawFps * (1 - smoothing);
    }

    return this.smoothedFps;
  }

  private animate(): void {
    requestAnimationFrame(this.animate);

    const now = performance.now();

    let deltaTime: number;
    if (this.frameTimestamps.length === 0) {
      deltaTime = 1 / DEFAULT_FPS;
    } else {
      deltaTime = (now - this.frameTimestamps[this.frameTimestamps.length - 1]) / 1000;
    }
    deltaTime = Math.min(deltaTime, 0.05);

    const currentFps = this.computeAverageFps(now);

    if (this.isFlyingBack) {
      const t = Math.min(1, (now - this.flybackStartTime) / (FLYBACK_DURATION * 1000));
      const eased = this.easeInOut(t);

      const targetTheta = 0;
      const targetPhi = Math.atan2(
        CAMERA_INITIAL_POS.y,
        Math.sqrt(CAMERA_INITIAL_POS.x ** 2 + CAMERA_INITIAL_POS.z ** 2)
      );
      const targetDistance = CAMERA_INITIAL_POS.length();

      this.cameraTheta = this.flybackStartTheta + (targetTheta - this.flybackStartTheta) * eased;
      this.cameraPhi = this.flybackStartPhi + (targetPhi - this.flybackStartPhi) * eased;
      this.cameraDistance = this.flybackStartDistance + (targetDistance - this.flybackStartDistance) * eased;
      this.updateCameraPosition();

      if (t >= 1) {
        this.isFlyingBack = false;
      }
    } else if (!this.isDragging) {
      if (Math.abs(this.rotationVelocityX) > 0.0001 || Math.abs(this.rotationVelocityY) > 0.0001) {
        this.cameraTheta += this.rotationVelocityX;
        this.cameraPhi = Math.max(
          -Math.PI / 2 + 0.05,
          Math.min(Math.PI / 2 - 0.05, this.cameraPhi + this.rotationVelocityY)
        );
        this.rotationVelocityX *= DAMPING;
        this.rotationVelocityY *= DAMPING;
        this.updateCameraPosition();
      }
    }

    this.particleSystem.updateParticleScale(this.cameraDistance);

    const particlesUpdated = this.physicsEngine.update(deltaTime);
    this.updateCount++;

    this.renderer.render(this.scene, this.camera);

    if (this.updateWindowStart === 0) {
      this.updateWindowStart = now;
    }

    if (now - this.lastPerformanceUpdate >= PERFORMANCE_UPDATE_INTERVAL &&
        this.frameTimestamps.length >= 2) {
      const updateWindowDuration = (now - this.updateWindowStart) / 1000;
      const ups = updateWindowDuration > 0 ? this.updateCount / updateWindowDuration : DEFAULT_FPS;

      this.uiController.updatePerformance(currentFps, particlesUpdated, ups);

      this.updateCount = 0;
      this.updateWindowStart = now;
      this.lastPerformanceUpdate = now;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GalaxyApp();
});
