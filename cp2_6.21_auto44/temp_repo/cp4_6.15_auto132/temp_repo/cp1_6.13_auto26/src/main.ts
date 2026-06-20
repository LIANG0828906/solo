import * as THREE from 'three';
import { Earth } from './earth';
import { WindParticles } from './windParticles';
import { CameraControls } from './cameraControls';
import { Starfield } from './starfield';
import { UIManager } from './uiManager';
import { eventBus, EVENTS } from './eventBus';
import { dataManager } from './dataManager';

class WindGlobeApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  private earth!: Earth;
  private windParticles!: WindParticles;
  private cameraControls!: CameraControls;
  private starfield!: Starfield;
  private uiManager!: UIManager;

  private clock: THREE.Clock;
  private animationFrameId: number = 0;

  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.container.appendChild(this.renderer.domElement);

    this.init();
  }

  private init(): void {
    this.setupLights();
    this.starfield = new Starfield(this.scene, 1500);
    this.earth = new Earth(this.scene);
    this.windParticles = new WindParticles(this.scene);
    this.cameraControls = new CameraControls(this.camera, this.renderer.domElement);
    this.uiManager = new UIManager();

    window.addEventListener('resize', this.onWindowResize);

    this.start();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x4a8eff, 0.4);
    rimLight.position.set(-5, -2, -5);
    this.scene.add(rimLight);
  }

  private onWindowResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  private start(): void {
    this.clock.start();
    this.animate();
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    const frameStart = performance.now();

    this.earth.update(deltaTime);
    this.windParticles.update(deltaTime);
    this.cameraControls.update(deltaTime);
    this.starfield.update(elapsedTime);
    this.uiManager.update(elapsedTime * 1000);

    this.renderer.render(this.scene, this.camera);

    const frameEnd = performance.now();
    const frameDuration = frameEnd - frameStart;

    this.frameCount++;
    if (elapsedTime - this.lastFrameTime >= 5) {
      this.fps = Math.round(this.frameCount / 5);
      this.frameCount = 0;
      this.lastFrameTime = elapsedTime;

      if (this.fps < 50) {
        console.warn(`FPS: ${this.fps}, avg frame: ${(1000 / this.fps).toFixed(1)}ms`);
      }
    }
  };

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);

    this.windParticles.dispose();
    this.cameraControls.dispose();
    this.starfield.dispose();
    this.uiManager.dispose();

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

let app: WindGlobeApp | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new WindGlobeApp();
});

export { app };
