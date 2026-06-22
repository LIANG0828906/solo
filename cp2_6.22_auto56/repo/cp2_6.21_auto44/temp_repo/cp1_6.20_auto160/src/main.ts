import './style.css';
import * as THREE from 'three';
import {
  GeometryParams,
  DEFAULT_PARAMS,
  createSculptureGeometry,
  createMaterial,
  hslToColor
} from './geometry';
import { ControlsManager } from './controls';

class SculptureApp {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mesh: THREE.Mesh | null = null;
  private material: THREE.MeshPhysicalMaterial;

  private currentParams: GeometryParams;
  private targetParams: GeometryParams;
  private isAnimatingParams: boolean = false;
  private paramsAnimationStart: number = 0;
  private paramsAnimationDuration: number = 200;
  private paramsAnimationFrom: GeometryParams | null = null;

  private isRandomTransition: boolean = false;
  private randomTransitionStart: number = 0;
  private randomTransitionDuration: number = 600;

  private isAutoRotating: boolean = true;
  private isDragging: boolean = false;
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;
  private rotationVelocityX: number = 0;
  private rotationVelocityY: number = 0;
  private targetCameraRotationX: number = 0.3;
  private targetCameraRotationY: number = 0;
  private currentCameraRotationX: number = 0.3;
  private currentCameraRotationY: number = 0;
  private cameraDistance: number = 10;
  private autoRotatePauseTimer: number | null = null;

  private controlsManager: ControlsManager;
  private lastFrameTime: number = 0;

  constructor() {
    this.container = document.getElementById('preview-container')!;
    this.currentParams = { ...DEFAULT_PARAMS };
    this.targetParams = { ...DEFAULT_PARAMS };

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.material = createMaterial(this.currentParams);

    this.createInitialMesh();
    this.setupLights();
    this.setupEventListeners();

    this.controlsManager = new ControlsManager({
      onParamsChange: (params) => this.handleParamsChange(params),
      onRandom: (oldParams, newParams) => this.handleRandom(oldParams, newParams),
      onReset: () => this.handleReset(),
      onScreenshot: () => this.handleScreenshot()
    });

    this.animate = this.animate.bind(this);
    this.lastFrameTime = performance.now();
    this.animate();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.updateCameraPosition(camera);
    return camera;
  }

  private updateCameraPosition(targetCamera?: THREE.PerspectiveCamera): void {
    const cam = targetCamera || this.camera;
    const x = this.cameraDistance * Math.sin(this.currentCameraRotationY) * Math.cos(this.currentCameraRotationX);
    const y = this.cameraDistance * Math.sin(this.currentCameraRotationX);
    const z = this.cameraDistance * Math.cos(this.currentCameraRotationY) * Math.cos(this.currentCameraRotationX);
    cam.position.set(x, y, z);
    cam.lookAt(0, 0, 0);
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createInitialMesh(): void {
    const geometry = createSculptureGeometry(this.currentParams);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 8, 5);
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.6);
    fillLight.position.set(-5, 3, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff88aa, 0.4);
    rimLight.position.set(0, -5, 5);
    this.scene.add(rimLight);

    const pointLight1 = new THREE.PointLight(0x38bdf8, 0.8, 30);
    pointLight1.position.set(-6, 4, 6);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa78bfa, 0.6, 30);
    pointLight2.position.set(6, -4, -6);
    this.scene.add(pointLight2);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    canvas.addEventListener('touchend', () => this.onTouchEnd());

    window.addEventListener('resize', () => this.onResize());
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.isAutoRotating = false;
    this.previousMouseX = e.clientX;
    this.previousMouseY = e.clientY;
    if (this.autoRotatePauseTimer) {
      window.clearTimeout(this.autoRotatePauseTimer);
      this.autoRotatePauseTimer = null;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousMouseX;
    const deltaY = e.clientY - this.previousMouseY;

    this.rotationVelocityY = deltaX * 0.005;
    this.rotationVelocityX = deltaY * 0.005;

    this.targetCameraRotationY += this.rotationVelocityY;
    this.targetCameraRotationX += this.rotationVelocityX;

    const maxRotationX = Math.PI / 2 - 0.1;
    this.targetCameraRotationX = Math.max(-maxRotationX, Math.min(maxRotationX, this.targetCameraRotationX));

    this.previousMouseX = e.clientX;
    this.previousMouseY = e.clientY;
  }

  private onMouseUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    this.autoRotatePauseTimer = window.setTimeout(() => {
      this.isAutoRotating = true;
      this.rotationVelocityX = 0;
      this.rotationVelocityY = 0;
    }, 1500);
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length > 0) {
      this.isDragging = true;
      this.isAutoRotating = false;
      this.previousMouseX = e.touches[0].clientX;
      this.previousMouseY = e.touches[0].clientY;
      if (this.autoRotatePauseTimer) {
        window.clearTimeout(this.autoRotatePauseTimer);
        this.autoRotatePauseTimer = null;
      }
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length === 0) return;
    e.preventDefault();

    const deltaX = e.touches[0].clientX - this.previousMouseX;
    const deltaY = e.touches[0].clientY - this.previousMouseY;

    this.targetCameraRotationY += deltaX * 0.005;
    this.targetCameraRotationX += deltaY * 0.005;

    const maxRotationX = Math.PI / 2 - 0.1;
    this.targetCameraRotationX = Math.max(-maxRotationX, Math.min(maxRotationX, this.targetCameraRotationX));

    this.previousMouseX = e.touches[0].clientX;
    this.previousMouseY = e.touches[0].clientY;
  }

  private onTouchEnd(): void {
    this.isDragging = false;
    this.autoRotatePauseTimer = window.setTimeout(() => {
      this.isAutoRotating = true;
    }, 1500);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.cameraDistance += e.deltaY * 0.01;
    this.cameraDistance = Math.max(4, Math.min(25, this.cameraDistance));
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private handleParamsChange(params: GeometryParams): void {
    this.startParamsAnimation(params, 200);
  }

  private handleReset(): void {
    this.startParamsAnimation({ ...DEFAULT_PARAMS }, 300);
  }

  private handleRandom(_oldParams: GeometryParams, newParams: GeometryParams): void {
    this.isRandomTransition = true;
    this.randomTransitionStart = performance.now();
    this.startParamsAnimation(newParams, 600);
  }

  private startParamsAnimation(targetParams: GeometryParams, duration: number): void {
    this.paramsAnimationFrom = { ...this.currentParams };
    this.targetParams = { ...targetParams };
    this.paramsAnimationStart = performance.now();
    this.paramsAnimationDuration = duration;
    this.isAnimatingParams = true;
  }

  private handleScreenshot(): void {
    this.renderer.render(this.scene, this.camera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `sculpture_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private lerpParams(from: GeometryParams, to: GeometryParams, t: number): GeometryParams {
    return {
      thickness: from.thickness + (to.thickness - from.thickness) * t,
      bend: from.bend + (to.bend - from.bend) * t,
      tilt: from.tilt + (to.tilt - from.tilt) * t,
      texture: from.texture + (to.texture - from.texture) * t,
      twist: from.twist + (to.twist - from.twist) * t,
      colorPhase: from.colorPhase + (to.colorPhase - from.colorPhase) * t
    };
  }

  private updateGeometry(params: GeometryParams): void {
    if (!this.mesh) return;

    this.mesh.geometry.dispose();
    this.mesh.geometry = createSculptureGeometry(params);

    const baseColor = hslToColor(params.colorPhase, 0.6, 0.55);
    this.material.color.copy(baseColor);
  }

  private animate(currentTime: number = performance.now()): void {
    requestAnimationFrame(this.animate);

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    if (this.isAnimatingParams && this.paramsAnimationFrom) {
      const elapsed = currentTime - this.paramsAnimationStart;
      const t = Math.min(elapsed / this.paramsAnimationDuration, 1);
      const easedT = this.easeInOutCubic(t);
      this.currentParams = this.lerpParams(this.paramsAnimationFrom, this.targetParams, easedT);
      this.updateGeometry(this.currentParams);

      if (t >= 1) {
        this.isAnimatingParams = false;
        this.paramsAnimationFrom = null;
        this.isRandomTransition = false;
      }
    }

    if (this.isRandomTransition && this.mesh) {
      const elapsed = currentTime - this.randomTransitionStart;
      const t = Math.min(elapsed / this.randomTransitionDuration, 1);
      const easedT = this.easeInOutCubic(t);
      this.mesh.rotation.y = easedT * Math.PI * 2;
      this.mesh.scale.setScalar(0.6 + Math.sin(easedT * Math.PI) * 0.4);
    } else if (this.mesh && !this.isRandomTransition) {
      if (this.isAutoRotating) {
        this.mesh.rotation.y += (deltaTime / 12000) * Math.PI * 2;
      }
      this.mesh.scale.setScalar(1);
    }

    const cameraLerpFactor = this.isDragging ? 0.2 : 0.08;
    this.currentCameraRotationX += (this.targetCameraRotationX - this.currentCameraRotationX) * cameraLerpFactor;
    this.currentCameraRotationY += (this.targetCameraRotationY - this.currentCameraRotationY) * cameraLerpFactor;
    this.updateCameraPosition();

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new SculptureApp();
});
