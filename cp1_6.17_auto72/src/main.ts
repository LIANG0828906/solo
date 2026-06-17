import * as THREE from 'three';
import { NoiseField } from './noiseField';
import { ShapeManager, easeInOutCubic } from './shapeManager';
import type { ShapeName } from './shapeManager';
import { ParticleSystem } from './particleSystem';
import { UIController } from './uiController';

class App {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private noiseField: NoiseField;
  private shapeManager: ShapeManager;
  private particleSystem: ParticleSystem;
  private uiController: UIController;

  private clock: THREE.Clock;
  private elapsedMs: number = 0;
  private lastTime: number = 0;

  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  private cameraRadius: number = 5;
  private cameraTargetRadius: number = 5;
  private theta: number = 0;
  private phi: number = 0;
  private targetTheta: number = 0;
  private targetPhi: number = 0;

  private readonly MIN_RADIUS = 1.5;
  private readonly MAX_RADIUS = 15;
  private readonly MIN_PHI = -Math.PI / 3;
  private readonly MAX_PHI = Math.PI / 3;

  private readonly PARTICLE_COUNT = 6000;

  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private fps: number = 60;

  private resizeHandler: () => void;
  private mouseDownHandler: (e: MouseEvent) => void;
  private mouseMoveHandler: (e: MouseEvent) => void;
  private mouseUpHandler: (e: MouseEvent) => void;
  private wheelHandler: (e: WheelEvent) => void;
  private contextMenuHandler: (e: Event) => void;

  private animationId: number = 0;

  constructor() {
    this.container = document.getElementById('app') || document.body;

    this.resizeHandler = this.handleResize.bind(this);
    this.mouseDownHandler = this.handleMouseDown.bind(this);
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
    this.mouseUpHandler = this.handleMouseUp.bind(this);
    this.wheelHandler = this.handleWheel.bind(this);
    this.contextMenuHandler = (e) => e.preventDefault();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0A0F);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.4;
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    this.noiseField = new NoiseField(0.009, 0.18, 1.3);
    this.shapeManager = new ShapeManager(this.PARTICLE_COUNT);

    const initialVerts = this.shapeManager.getInitialVertices();
    this.particleSystem = new ParticleSystem(
      this.scene,
      this.PARTICLE_COUNT,
      this.noiseField,
      initialVerts
    );

    this.uiController = new UIController({
      shapes: [
        { name: 'cube', label: '立方体', color: '#FF6B6B' },
        { name: 'sphere', label: '球体', color: '#4ECDC4' },
        { name: 'torus', label: '环面', color: '#FFE66D' }
      ],
      initialShape: 'cube',
      onShapeChange: this.handleShapeChange.bind(this)
    });

    this.targetTheta = Math.PI * 0.25;
    this.targetPhi = -Math.PI / 12;
    this.theta = this.targetTheta;
    this.phi = this.targetPhi;
    this.updateCamera(0);

    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.resizeHandler);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', this.mouseDownHandler);
    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
    canvas.addEventListener('wheel', this.wheelHandler, { passive: false });
    canvas.addEventListener('contextmenu', this.contextMenuHandler);
  }

  private handleResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0 || e.button === 2) {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    this.targetTheta -= dx * 0.005;
    this.targetPhi -= dy * 0.005;
    this.targetPhi = Math.max(this.MIN_PHI, Math.min(this.MAX_PHI, this.targetPhi));
  }

  private handleMouseUp(_e: MouseEvent): void {
    this.isDragging = false;
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.08 : 0.92;
    this.cameraTargetRadius = Math.max(
      this.MIN_RADIUS,
      Math.min(this.MAX_RADIUS, this.cameraTargetRadius * delta)
    );
  }

  private handleShapeChange(name: ShapeName): void {
    const result = this.shapeManager.switchShape(name, this.elapsedMs);
    if (result.duration > 0) {
      this.particleSystem.setTargetPositions(
        result.vertices,
        result.duration,
        result.easing,
        this.elapsedMs
      );
    }
  }

  private updateCamera(dt: number): void {
    const smooth = 1 - Math.pow(0.001, dt);
    this.theta += (this.targetTheta - this.theta) * smooth;
    this.phi += (this.targetPhi - this.phi) * smooth;
    this.cameraRadius += (this.cameraTargetRadius - this.cameraRadius) * smooth;

    const cosPhi = Math.cos(this.phi);
    const x = this.cameraRadius * cosPhi * Math.sin(this.theta);
    const y = this.cameraRadius * Math.sin(this.phi);
    const z = this.cameraRadius * cosPhi * Math.cos(this.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const rawDelta = this.clock.getDelta();
    const delta = Math.min(rawDelta, 0.05);
    const elapsedSeconds = this.clock.elapsedTime;
    this.elapsedMs += delta * 1000;

    this.frameCount++;
    if (elapsedSeconds - this.fpsUpdateTime >= 0.5) {
      this.fps = this.frameCount / (elapsedSeconds - this.fpsUpdateTime);
      this.frameCount = 0;
      this.fpsUpdateTime = elapsedSeconds;
    }

    this.updateCamera(delta);
    this.shapeManager.update(this.elapsedMs);
    this.particleSystem.update(delta, this.elapsedMs, elapsedSeconds);

    if (!this.isDragging) {
      this.targetTheta += delta * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
    this.lastTime = performance.now();
  }

  start(): void {
    this.lastTime = performance.now();
    this.clock.start();
    this.fpsUpdateTime = 0;
    this.frameCount = 0;
    this.animate();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);

    window.removeEventListener('resize', this.resizeHandler);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this.mouseDownHandler);
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('mouseup', this.mouseUpHandler);
    canvas.removeEventListener('wheel', this.wheelHandler);
    canvas.removeEventListener('contextmenu', this.contextMenuHandler);

    this.particleSystem.dispose();
    this.uiController.dispose();
    this.renderer.dispose();

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}

let app: App | null = null;

const start = (): void => {
  if (app) app.dispose();
  app = new App();
  app.start();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
