import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Terrain } from './terrain';
import { ParticleSystem } from './particles';
import { UIManager } from './ui';
import { WeatherMode, ControlParams } from './types';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private terrain: Terrain;
  private particleSystem: ParticleSystem;
  private uiManager: UIManager;
  private container: HTMLElement;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private isVisible: boolean = true;
  private params: ControlParams = {
    particleDensity: 3000,
    windStrength: 3,
    terrainScale: 1.0
  };

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();

    this.setupLights();

    this.terrain = new Terrain(this.scene);
    this.particleSystem = new ParticleSystem(this.scene, this.terrain);

    this._uiManager = new UIManager(
      document.getElementById('app')!,
      (mode) => this.handleWeatherChange(mode),
      (params) => this.handleParamsChange(params)
    );

    this.setupVisibilityListener();
    this.setupResizeListener();

    this.startAnimationLoop();
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 2, 0);
    return controls;
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3a5a27, 0.3);
    this.scene.add(hemisphereLight);
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) {
        this.clock.getDelta();
      }
    });
  }

  private setupResizeListener(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });
  }

  private handleWeatherChange(mode: WeatherMode): void {
    this.particleSystem.switchWeather(mode);
  }

  private handleParamsChange(params: Partial<ControlParams>): void {
    this.params = { ...this.params, ...params };

    if (params.terrainScale !== undefined) {
      this.terrain.updateScale(params.terrainScale);
    }

    if (params.particleDensity !== undefined) {
      this.particleSystem.updateParams({ particleDensity: params.particleDensity });
    }
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      if (!this.isVisible) return;

      const deltaTime = Math.min(this.clock.getDelta(), 0.1);
      const elapsedTime = this.clock.getElapsedTime();

      this.controls.update();
      this.terrain.update(elapsedTime, this.params.windStrength);
      this.particleSystem.update(elapsedTime, deltaTime, this.params.windStrength);

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.terrain.dispose();
    this.particleSystem.dispose();
    this.renderer.dispose();
    this.controls.dispose();
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
  }
});
