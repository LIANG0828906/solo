import * as THREE from 'three';
import { Terrain } from './terrain';
import { ControlsManager } from './controls';
import { UIManager } from './ui';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private terrain: Terrain;
  private controls: ControlsManager;
  private ui: UIManager;
  private clock: THREE.Clock;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private currentFPS: number = 0;
  private animationId: number | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.terrain = new Terrain();
    this.controls = new ControlsManager(this.camera, this.renderer, this.terrain);
    this.ui = new UIManager();
    this.clock = new THREE.Clock();
    this.init();
  }

  private init(): void {
    this.setupRenderer();
    this.setupCamera();
    this.setupLights();
    this.setupBackground();
    this.setupTerrain();
    this.setupUI();
    this.setupEventListeners();
    this.animate();
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const app = document.getElementById('app');
    if (app) {
      app.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }
  }

  private setupCamera(): void {
    this.camera.position.set(300, 200, 300);
    this.camera.lookAt(0, 0, 0);
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(200, 300, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -300;
    directionalLight.shadow.camera.right = 300;
    directionalLight.shadow.camera.top = 300;
    directionalLight.shadow.camera.bottom = -300;
    this.scene.add(directionalLight);
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2, 512);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    this.scene.background = texture;
  }

  private setupTerrain(): void {
    this.scene.add(this.terrain.mesh);
  }

  private setupUI(): void {
    this.ui.onHeightScaleChange((value) => {
      this.controls.setHeightScale(value);
    });
    this.ui.onFrequencyChange((value) => {
      this.controls.setNoiseFrequency(value);
    });
    this.ui.onResolutionChange((value) => {
      this.controls.setResolution(value);
    });
    this.ui.onModeChange((mode) => {
      this.controls.setMode(mode);
    });
    this.ui.onReset(() => {
      this.controls.reset();
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    this.controls.update();
    this.terrain.update(delta);
    this.updateFPS(elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  private updateFPS(elapsedTime: number): void {
    this.frameCount++;
    if (elapsedTime - this.fpsUpdateTime >= 1) {
      this.currentFPS = this.frameCount / (elapsedTime - this.fpsUpdateTime);
      this.ui.updateFPS(this.currentFPS);
      this.frameCount = 0;
      this.fpsUpdateTime = elapsedTime;
    }
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.controls.dispose();
    this.terrain.dispose();
    this.renderer.dispose();
  }
}

const app = new App();

(window as any).app = app;
