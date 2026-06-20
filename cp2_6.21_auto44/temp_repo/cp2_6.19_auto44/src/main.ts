import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sculpture } from './sculpture';
import { Lighting } from './lighting';
import { Controller } from './controller';
import type { SculptureParams, AnimationState } from './types';
import './style.css';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private sculpture: Sculpture;
  private lighting: Lighting;
  private controller: Controller;
  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private sculptureMesh: THREE.Mesh | null = null;
  private particleSystem: THREE.Points | null = null;
  private showParticles: boolean = false;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private oldSubdivision: number = 24;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.sculpture = new Sculpture();
    this.lighting = new Lighting();
    this.controller = new Controller();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  public init(): void {
    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupLighting();
    this.setupScene();
    this.setupController();
    this.setupEventListeners();
    this.createStarfield();
    this.animate();
  }

  private setupRenderer(): void {
    const container = document.getElementById('canvas-container') as HTMLCanvasElement;
    if (!container) return;

    this.renderer = new THREE.WebGLRenderer({
      canvas: container,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x1a1a2e, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  private setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 4);
  }

  private setupControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.maxPolarAngle = Math.PI * 5 / 6;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.5;
  }

  private setupLighting(): void {
    this.lighting.setup(this.scene);
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.05);

    const initialParams = this.controller.getParams();
    this.sculptureMesh = this.sculpture.create(initialParams);
    this.scene.add(this.sculptureMesh);
    this.oldSubdivision = initialParams.subdivision;

    const gridHelper = new THREE.GridHelper(10, 20, 0x333355, 0x222244);
    gridHelper.position.y = -2;
    this.scene.add(gridHelper);
  }

  private createStarfield(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      colors[i] = brightness;
      colors[i + 1] = brightness;
      colors[i + 2] = brightness * (0.8 + Math.random() * 0.2);
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  }

  private setupController(): void {
    this.controller.init();

    this.controller.onUpdate((params: SculptureParams, animationState: AnimationState | null) => {
      this.updateSculpture(params, animationState);
      this.lighting.update(params.ambientLightOn, params.pointLightOn);
    });

    this.controller.onExport(() => {
      this.exportSnapshot();
    });

    this.controller.onInfoPanel((show: boolean) => {
      this.controls.enabled = !show;
    });
  }

  private updateSculpture(params: SculptureParams, animationState: AnimationState | null): void {
    if (!this.sculptureMesh) return;

    const explosionScale = animationState?.explosionScale || 1;

    if (Math.floor(params.subdivision) !== this.oldSubdivision) {
      this.scene.remove(this.sculptureMesh);
      this.sculptureMesh.geometry.dispose();
      (this.sculptureMesh.material as THREE.Material).dispose();
      this.sculptureMesh = this.sculpture.create(params);
      this.scene.add(this.sculptureMesh);
      this.oldSubdivision = Math.floor(params.subdivision);
    } else {
      this.sculpture.update(params, explosionScale);
    }

    const isRandomActive = this.controller.isRandomAnimationActive();
    if (isRandomActive && !this.showParticles) {
      this.spawnExplosionParticles();
    }
  }

  private spawnExplosionParticles(): void {
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      (this.particleSystem.material as THREE.Material).dispose();
      this.particleSystem.geometry.dispose();
    }

    this.particleSystem = this.sculpture.createExplosionParticles(300);
    this.scene.add(this.particleSystem);
    this.showParticles = true;

    setTimeout(() => {
      this.showParticles = false;
    }, 1500);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onCanvasClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.sculptureMesh) {
      const intersects = this.raycaster.intersectObject(this.sculptureMesh);
      if (intersects.length > 0) {
        this.controller.showInfoPanel();
      }
    }
  }

  private exportSnapshot(): void {
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        exportBtn.style.transform = '';
      }, 150);
    }

    const oldWidth = this.renderer.domElement.width;
    const oldHeight = this.renderer.domElement.height;
    const oldPixelRatio = this.renderer.getPixelRatio();

    this.renderer.setPixelRatio(2);
    this.renderer.setSize(1920, 1080, false);
    this.camera.aspect = 1920 / 1080;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);

    const dataURL = this.renderer.domElement.toDataURL('image/png');

    this.renderer.setPixelRatio(oldPixelRatio);
    this.renderer.setSize(oldWidth / oldPixelRatio, oldHeight / oldPixelRatio, false);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    const link = document.createElement('a');
    link.download = `sculpture_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.controller.update(deltaTime);
    this.controls.update();
    this.lighting.animate(elapsedTime);

    if (this.showParticles && this.particleSystem) {
      const animState = this.controller.getAnimationState();
      const progress = animState ? animState.progress : 1;
      this.sculpture.updateExplosionParticles(deltaTime, progress);
    } else if (this.particleSystem && !this.showParticles) {
      this.scene.remove(this.particleSystem);
      (this.particleSystem.material as THREE.Material).dispose();
      this.particleSystem.geometry.dispose();
      this.particleSystem = null;
    }

    this.renderer.render(this.scene, this.camera);

    this.updateFPS();
  }

  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      const fpsCounter = document.getElementById('fps-counter');
      if (fpsCounter) {
        fpsCounter.textContent = `${this.fps} FPS`;
        fpsCounter.style.color = this.fps >= 30 ? '#00d4ff' : '#ff6b35';
      }
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  public dispose(): void {
    this.sculpture.dispose();
    this.lighting.dispose();
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();

  (window as any).app = app;
});
