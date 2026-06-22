import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Garden } from './Garden';
import { UI } from './UI';

class CrystalGardenApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private garden: Garden;
  private ui: UI;
  private clock: THREE.Clock;
  private container: HTMLElement;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;

    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 12, 20);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 60;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.set(0, 2, 0);

    this.setupLighting();

    this.garden = new Garden(this.scene);

    this.ui = new UI(this.garden, this.container);

    this.setupEventListeners();

    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x403060, 0.6);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.camera.left = -30;
    mainLight.shadow.camera.right = 30;
    mainLight.shadow.camera.top = 30;
    mainLight.shadow.camera.bottom = -30;
    mainLight.shadow.bias = -0.0001;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x9B59B6, 0.4);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x3498DB, 0.3);
    rimLight.position.set(0, 15, -20);
    this.scene.add(rimLight);

    const pointLight1 = new THREE.PointLight(0x9B59B6, 2, 30);
    pointLight1.position.set(-8, 5, 8);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3498DB, 2, 30);
    pointLight2.position.set(8, 5, -8);
    this.scene.add(pointLight2);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));

    this.renderer.domElement.addEventListener('pointermove', (e) => {
      this.garden.handleMouseMove(e, this.renderer.domElement);
    });

    this.renderer.domElement.addEventListener('click', (e) => {
      this.garden.handleClick(e, this.camera, this.renderer.domElement);
    });
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    this.controls.update();

    this.garden.updateRaycaster(this.camera);

    this.garden.update(deltaTime);

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.ui.dispose();
    this.renderer.dispose();
    this.controls.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new CrystalGardenApp('app');
  } catch (error) {
    console.error('Failed to initialize CrystalGarden:', error);
  }
});
