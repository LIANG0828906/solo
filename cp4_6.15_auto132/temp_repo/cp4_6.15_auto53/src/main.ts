import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { StrataManager, DisplacementVector } from './地层';
import { FaultSystem, FaultType } from './断层';
import { UIManager } from './界面';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private strataManager: StrataManager;
  private faultSystem: FaultSystem;
  private uiManager: UIManager;

  private canvasContainer: HTMLElement;
  private uiContainer: HTMLElement;

  private clock: THREE.Clock;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private currentFPS: number = 60;

  private cameraDistance: number = 30;
  private isCameraMoving: boolean = false;
  private lastCameraMoveTime: number = 0;
  private lastLODDistance: number = -1;

  private lowPerformanceMode: boolean = false;
  private particleUpdateSkipFrames: number = 0;
  private fpsHistory: number[] = [];

  private readonly SCENE_WIDTH = 30;
  private readonly SCENE_DEPTH = 30;
  private readonly TARGET_FPS = 30;
  private readonly LOD_CHECK_INTERVAL = 15;

  constructor() {
    this.clock = new THREE.Clock();

    const app = document.getElementById('app')!;
    app.innerHTML = '';

    this.canvasContainer = document.createElement('div');
    this.canvasContainer.id = 'canvas-container';
    app.appendChild(this.canvasContainer);

    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'ui-overlay';
    app.appendChild(this.uiContainer);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(15, 15, 25);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.canvasContainer.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 80;
    this.controls.maxPolarAngle = Math.PI * 0.48;

    this.strataManager = new StrataManager(this.SCENE_WIDTH, this.SCENE_DEPTH);
    this.scene.add(this.strataManager.group);

    this.faultSystem = new FaultSystem(this.SCENE_WIDTH, this.SCENE_DEPTH);
    this.scene.add(this.faultSystem.particleGroup);

    this.uiManager = new UIManager(this.uiContainer, {
      onLayerParamChange: this.handleLayerParamChange.bind(this),
      onFaultTypeChange: this.handleFaultTypeChange.bind(this),
      onTriggerFault: this.handleTriggerFault.bind(this),
      onReset: this.handleReset.bind(this)
    });

    this.setupLighting();
    this.setupStarfield();
    this.setupEventListeners();
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x6699ff, 0.3);
    fillLight.position.set(-10, 5, -10);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x9966ff, 0.2);
    rimLight.position.set(0, 10, -20);
    this.scene.add(rimLight);
  }

  private setupStarfield(): void {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 200 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.5 + 20;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this));

    this.controls.addEventListener('start', () => {
      this.isCameraMoving = true;
    });

    this.controls.addEventListener('end', () => {
      this.lastCameraMoveTime = performance.now();
      setTimeout(() => {
        if (performance.now() - this.lastCameraMoveTime > 200) {
          this.isCameraMoving = false;
        }
      }, 250);
    });
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private handleLayerParamChange(layerIndex: number, param: 'thickness' | 'texture', value: number): void {
    this.strataManager.updateLayerParam(layerIndex, param, value);
  }

  private handleFaultTypeChange(type: FaultType): void {
    this.faultSystem.setFaultType(type);
  }

  private handleTriggerFault(): void {
    this.strataManager.resetDisplacement();
    this.faultSystem.reset();
    this.faultSystem.triggerFault();
    this.uiManager.setTriggerButtonEnabled(false);
  }

  private handleReset(): void {
    this.strataManager.resetDisplacement();
    this.faultSystem.reset();
    this.uiManager.updateProgress(0);
    this.uiManager.setTriggerButtonEnabled(true);
  }

  private updateGlowIntensity(): void {
    const cameraPos = this.camera.position;
    const target = this.controls.target;
    const distance = cameraPos.distanceTo(target);
    this.cameraDistance = distance;

    const normalizedDistance = (distance - 10) / (80 - 10);
    const baseGlow = 0.3 + (1 - normalizedDistance) * 0.4;

    const movementGlow = this.isCameraMoving ? 0.3 : 0;
    const totalGlow = Math.min(1, baseGlow + movementGlow);

    this.strataManager.setGlowIntensity(totalGlow);
  }

  private updateLOD(): void {
    const actualDistance = this.camera.position.distanceTo(this.controls.target);
    this.cameraDistance = actualDistance;
    const checkLevel = Math.floor(actualDistance / 10);
    const lastLevel = Math.floor(this.lastLODDistance / 10);

    if (checkLevel !== lastLevel) {
      this.strataManager.updateLOD(actualDistance);
      this.lastLODDistance = actualDistance;
    }
  }

  private updateFPS(deltaTime: number): void {
    this.frameCount++;
    this.fpsUpdateTime += deltaTime;

    if (this.fpsUpdateTime >= 0.5) {
      this.currentFPS = this.frameCount / this.fpsUpdateTime;
      this.uiManager.updateFPS(this.currentFPS);

      this.fpsHistory.push(this.currentFPS);
      if (this.fpsHistory.length > 6) {
        this.fpsHistory.shift();
      }

      this.adjustPerformanceLevel();

      this.frameCount = 0;
      this.fpsUpdateTime = 0;
    }
  }

  private adjustPerformanceLevel(): void {
    if (this.fpsHistory.length < 3) return;

    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const minFPS = Math.min(...this.fpsHistory);

    if (minFPS < this.TARGET_FPS * 0.7 || avgFPS < this.TARGET_FPS * 0.85) {
      if (!this.lowPerformanceMode || this.particleUpdateSkipFrames < 3) {
        this.lowPerformanceMode = true;
        this.particleUpdateSkipFrames = Math.min(3, this.particleUpdateSkipFrames + 1);
        this.faultSystem.setUpdateFrequency(this.particleUpdateSkipFrames);
        console.log(`[Performance] 低性能模式: 跳过${this.particleUpdateSkipFrames}帧粒子更新`);
      }

      if (this.renderer.getPixelRatio() > 1.2) {
        this.renderer.setPixelRatio(Math.max(1, this.renderer.getPixelRatio() - 0.3));
      }
    } else if (avgFPS > 50 && this.lowPerformanceMode) {
      if (this.particleUpdateSkipFrames > 0) {
        this.particleUpdateSkipFrames = Math.max(0, this.particleUpdateSkipFrames - 1);
        this.faultSystem.setUpdateFrequency(this.particleUpdateSkipFrames);
      }

      if (this.particleUpdateSkipFrames === 0) {
        this.lowPerformanceMode = false;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        console.log('[Performance] 恢复正常性能模式');
      }
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();
    const currentTime = performance.now();

    this.controls.update();
    this.updateGlowIntensity();

    if (this.frameCount % this.LOD_CHECK_INTERVAL === 0) {
      this.updateLOD();
    }

    this.updateFPS(deltaTime);

    const displacement: DisplacementVector | null = this.faultSystem.update(deltaTime, currentTime);
    if (displacement) {
      this.strataManager.applyDisplacement(displacement, this.faultSystem.getProgress());
    }

    this.uiManager.updateProgress(this.faultSystem.getProgress());

    if (!this.faultSystem.isPlaying() && this.faultSystem.getProgress() >= 1) {
      this.uiManager.setTriggerButtonEnabled(true);
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.strataManager.dispose();
    this.faultSystem.dispose();
    this.renderer.dispose();
    this.controls.dispose();
  }
}

let app: App;

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
});
