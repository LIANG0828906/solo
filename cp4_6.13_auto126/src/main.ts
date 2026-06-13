import * as THREE from 'three';
import { Terrain } from './terrain';
import { BrushController } from './brush';
import { UIController } from './ui';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private terrain: Terrain;
  private brushController: BrushController;
  private uiController: UIController;
  private container: HTMLElement;

  private isOrbiting: boolean = false;
  private isBrushing: boolean = false;
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;
  private cameraTheta: number = Math.PI / 4;
  private cameraPhi: number = Math.PI / 3;
  private cameraDistance: number = 35;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 60;

  constructor() {
    this.container = document.getElementById('app')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.Fog(0x0f172a, 50, 100);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x64748b, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
    dirLight.position.set(15, 25, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.bias = -0.001;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x6ee7b7, 0.3);
    fillLight.position.set(-10, 10, -15);
    this.scene.add(fillLight);

    this.terrain = new Terrain(30, 1);
    this.scene.add(this.terrain.mesh);

    this.brushController = new BrushController(
      this.terrain,
      this.camera,
      this.renderer,
      this.scene
    );

    this.uiController = new UIController(
      this.container,
      this.brushController,
      this.terrain
    );

    this.setupCameraControls();

    window.addEventListener('resize', () => this.onWindowResize());

    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    this.animate();
  }

  private setupCameraControls(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2 || e.button === 1) {
        this.isOrbiting = true;
        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isOrbiting) {
        const deltaX = e.clientX - this.previousMouseX;
        const deltaY = e.clientY - this.previousMouseY;
        this.cameraTheta -= deltaX * 0.005;
        this.cameraPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.cameraPhi - deltaY * 0.005));
        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
        this.updateCameraPosition();
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 2 || e.button === 1) {
        this.isOrbiting = false;
      }
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(10, Math.min(80, this.cameraDistance + e.deltaY * 0.03));
      this.updateCameraPosition();
    }, { passive: false });
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);

    this.camera.position.set(
      this.cameraTarget.x + x,
      this.cameraTarget.y + y,
      this.cameraTarget.z + z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = (this.frameCount * 1000) / (now - this.lastFpsTime);
      this.frameCount = 0;
      this.lastFpsTime = now;
      this.uiController.updateFPS(this.currentFps);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

new App();
