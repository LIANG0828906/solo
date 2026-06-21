import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createScene } from './scene';
import { TrafficSystem } from './traffic';
import { UIManager } from './ui';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private trafficSystem: TrafficSystem;
  private uiManager: UIManager;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private isRunning: boolean = true;
  private initialCameraPosition: THREE.Vector3;
  private initialTarget: THREE.Vector3;
  private sceneModule: ReturnType<typeof createScene>;

  constructor() {
    const container = document.getElementById('canvas-container');
    if (!container) {
      throw new Error('Canvas container not found');
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 80, 200);

    this.camera = new THREE.PerspectiveCamera(
      60,
      CANVAS_WIDTH / CANVAS_HEIGHT,
      0.1,
      1000
    );
    this.initialCameraPosition = new THREE.Vector3(30, 40, 60);
    this.initialTarget = new THREE.Vector3(0, 0, 0);
    this.camera.position.copy(this.initialCameraPosition);
    this.camera.lookAt(this.initialTarget);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 150;
    this.controls.target.copy(this.initialTarget);

    this.setupLighting();

    this.sceneModule = createScene();
    this.scene.add(this.sceneModule.group);

    this.trafficSystem = new TrafficSystem(this.scene);

    this.uiManager = new UIManager({
      onDensityChange: (value) => this.trafficSystem.setDensity(value),
      onSpeedChange: (value) => this.trafficSystem.setSpeed(value),
      onColorChange: (color) => this.trafficSystem.setHeadlightColor(color),
      onToggle: () => this.toggleAnimation(),
      onResetView: () => this.resetView(),
    });

    this.clock = new THREE.Clock();

    this.animate = this.animate.bind(this);
    this.trafficSystem.start();
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x606080, 0x303040, 0.4);
    this.scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 300;
    directionalLight.shadow.camera.left = -80;
    directionalLight.shadow.camera.right = 80;
    directionalLight.shadow.camera.top = 80;
    directionalLight.shadow.camera.bottom = -80;
    this.scene.add(directionalLight);

    const moonLight = new THREE.PointLight(0xaaaaff, 0.3, 200);
    moonLight.position.set(0, 80, -60);
    this.scene.add(moonLight);
  }

  private toggleAnimation(): void {
    this.isRunning = !this.isRunning;
    if (this.isRunning) {
      this.trafficSystem.start();
    } else {
      this.trafficSystem.stop();
    }
  }

  private resetView(): void {
    this.camera.position.copy(this.initialCameraPosition);
    this.controls.target.copy(this.initialTarget);
    this.controls.update();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.controls.update();

    if (this.isRunning) {
      this.trafficSystem.update(delta);
      this.sceneModule.update(elapsed);
    }

    this.renderer.render(this.scene, this.camera);

    const timestamp = performance.now();
    this.uiManager.updateFPS(timestamp);
    this.trafficSystem.reportFps(this.uiManager.getCurrentFps());
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.trafficSystem.dispose();
    this.renderer.dispose();
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  try {
    app = new App();
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
  }
});
