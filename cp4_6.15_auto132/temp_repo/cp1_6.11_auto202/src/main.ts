import * as THREE from 'three';
import { Terrain } from './modules/terrain';
import { BeaconManager } from './modules/beaconManager';
import { WindController } from './modules/windController';
import { CameraControls } from './modules/cameraControls';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private terrain!: Terrain;
  private beaconManager!: BeaconManager;
  private windController!: WindController;
  private cameraControls!: CameraControls;
  private clock: THREE.Clock;
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('app')!;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2D1B0E);
    this.scene.fog = new THREE.Fog(0x2D1B0E, 20, 50);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    this.setupLights();
    this.setupModules();
    this.setupResize();

    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xfff5e6, 0x4A7C59, 0.3);
    this.scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
    directionalLight.position.set(10, 15, 10);
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
  }

  private setupModules(): void {
    this.terrain = new Terrain(this.scene);
    this.windController = new WindController(this.scene);
    this.cameraControls = new CameraControls(this.camera, this.renderer.domElement);
    this.beaconManager = new BeaconManager(
      this.scene,
      this.camera,
      this.terrain,
      this.renderer.domElement
    );
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.1);

    this.cameraControls.update(dt);
    const wind = this.windController.getWindVector();
    this.beaconManager.update(dt, wind);

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
