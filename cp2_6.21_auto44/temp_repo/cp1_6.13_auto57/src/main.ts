import * as THREE from 'three';
import { ParticleSystem } from './particleSystem';
import { ForceManager } from './forceManager';
import { UIOverlay } from './uiOverlay';

class StellarGardenApp {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private particleSystem: ParticleSystem;
  private forceManager: ForceManager;
  private uiOverlay: UIOverlay;

  private clock: THREE.Clock;
  private cameraAngle: number = 0;
  private cameraDistance: number = 12;
  private cameraHeight: number = 3;
  private cameraRotSpeed: number = (10 * Math.PI) / 180;

  constructor() {
    this.container = document.getElementById('app')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.container.appendChild(this.renderer.domElement);

    this.forceManager = new ForceManager();
    this.particleSystem = new ParticleSystem();

    this.scene.add(this.particleSystem.points);
    this.scene.add(this.forceManager.helperGroup);

    this.uiOverlay = new UIOverlay({
      container: this.container,
      camera: this.camera,
      forceManager: this.forceManager,
      particleSystem: this.particleSystem,
    });

    this.clock = new THREE.Clock();

    this.updateCameraPosition();
    this.bindEvents();
    this.animate();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateCameraPosition(): void {
    const x = Math.cos(this.cameraAngle) * this.cameraDistance;
    const z = Math.sin(this.cameraAngle) * this.cameraDistance;
    this.camera.position.set(x, this.cameraHeight, z);
    this.camera.lookAt(0, 0, 0);
    this.uiOverlay.updatePlaneFromCamera();
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const dt = Math.min(this.clock.getDelta(), 0.1);

    this.cameraAngle += this.cameraRotSpeed * dt;
    this.updateCameraPosition();

    this.particleSystem.update(dt, this.forceManager);

    this.uiOverlay.update(dt);

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.particleSystem.dispose();
    this.uiOverlay.dispose();
    this.renderer.dispose();
  }
}

let app: StellarGardenApp | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new StellarGardenApp();
});
