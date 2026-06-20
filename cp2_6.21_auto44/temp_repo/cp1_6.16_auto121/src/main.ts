import * as THREE from 'three';
import { StormSystem } from './storm';
import { UIManager } from './ui';
import { useStormStore } from './store';

class TyphoonSimulator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private storm: StormSystem;
  private ui: UIManager;
  private clock: THREE.Clock;
  private gridHelper: THREE.GridHelper;

  private initialCameraPosition: THREE.Vector3;
  private initialCameraTarget: THREE.Vector3;
  private targetCameraPosition: THREE.Vector3;
  private targetCameraTarget: THREE.Vector3;
  private isAnimatingCamera: boolean;
  private cameraAnimationStartTime: number;
  private cameraAnimationDuration: number;

  private isMouseDown: boolean;
  private previousMouseX: number;
  private previousMouseY: number;
  private cameraTheta: number;
  private cameraPhi: number;
  private cameraDistance: number;
  private readonly rotationSensitivity: number = 0.005;
  private readonly minDistance: number = 1;
  private readonly maxDistance: number = 10;

  private readonly viewArea: number = 20 * 20;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    this.cameraTheta = -Math.PI / 4;
    this.cameraPhi = Math.PI / 4;
    this.cameraDistance = 5;

    this.initialCameraPosition = new THREE.Vector3(
      this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta),
      this.cameraDistance * Math.cos(this.cameraPhi),
      this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta)
    );
    this.initialCameraTarget = new THREE.Vector3(0, 0, 0);
    this.targetCameraPosition = this.initialCameraPosition.clone();
    this.targetCameraTarget = this.initialCameraTarget.clone();
    this.isAnimatingCamera = false;
    this.cameraAnimationStartTime = 0;
    this.cameraAnimationDuration = 0.8;

    this.isMouseDown = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.initialCameraPosition);
    this.camera.lookAt(this.initialCameraTarget);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.storm = new StormSystem();
    this.scene.add(this.storm.group);

    this.gridHelper = this.createGrid();
    this.scene.add(this.gridHelper);

    this.ui = new UIManager(container, {
      onResetCamera: () => this.resetCamera(),
    });

    this.setupEventListeners(container);
    this.animate();
  }

  private createGrid(): THREE.GridHelper {
    const grid = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);
    const material = grid.material as THREE.Material;
    material.transparent = true;
    material.opacity = 0.1;
    grid.position.y = -0.3;
    return grid;
  }

  private setupEventListeners(container: HTMLElement): void {
    const domElement = this.renderer.domElement;

    domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
        this.isAnimatingCamera = false;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        const deltaX = e.clientX - this.previousMouseX;
        const deltaY = e.clientY - this.previousMouseY;

        this.cameraTheta -= deltaX * this.rotationSensitivity;
        this.cameraPhi -= deltaY * this.rotationSensitivity;
        this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));

        this.updateCameraPosition();

        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
      }
    });

    domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance += e.deltaY * 0.005;
      this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance));
      this.updateCameraPosition();
      this.isAnimatingCamera = false;
    }, { passive: false });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  private resetCamera(): void {
    this.targetCameraPosition = this.initialCameraPosition.clone();
    this.targetCameraTarget = this.initialCameraTarget.clone();
    this.isAnimatingCamera = true;
    this.cameraAnimationStartTime = performance.now();

    this.cameraTheta = -Math.PI / 4;
    this.cameraPhi = Math.PI / 4;
    this.cameraDistance = 5;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private updateCameraAnimation(): void {
    if (!this.isAnimatingCamera) return;

    const elapsed = (performance.now() - this.cameraAnimationStartTime) / 1000;
    const progress = Math.min(1, elapsed / this.cameraAnimationDuration);
    const easedProgress = this.easeOutCubic(progress);

    const startX = this.camera.position.x;
    const startY = this.camera.position.y;
    const startZ = this.camera.position.z;

    const currentX = startX + (this.targetCameraPosition.x - startX) * easedProgress;
    const currentY = startY + (this.targetCameraPosition.y - startY) * easedProgress;
    const currentZ = startZ + (this.targetCameraPosition.z - startZ) * easedProgress;

    this.camera.position.set(currentX, currentY, currentZ);
    this.camera.lookAt(this.targetCameraTarget);

    if (progress >= 1) {
      this.isAnimatingCamera = false;
      this.updateCameraPosition();
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    const state = useStormStore.getState();
    const activeParticles = this.storm.update(deltaTime, state.windStrength, state.showTrails);

    if (!this.isAnimatingCamera && !this.isMouseDown) {
    }

    this.updateCameraAnimation();

    this.ui.updateRainfallDisplay(activeParticles, this.viewArea);

    this.renderer.render(this.scene, this.camera);
  };
}

const app = document.getElementById('app');
if (app) {
  new TyphoonSimulator(app);
}
