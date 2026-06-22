import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FireParticleSystem } from './FireParticle';
import { UIControl } from './UIControl';

class FireParticleApp {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  private particleSystem!: FireParticleSystem;
  private uiControl!: UIControl;

  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private fps: number = 0;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 6);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = true;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 20;
    this.controls.target.set(0, 0, 0);

    this.clock = new THREE.Clock();

    this.initSceneHelpers();
    this.initParticleSystem();
    this.initUIControl();
    this.bindEvents();
    this.animate();
  }

  private initSceneHelpers(): void {
    const burnerGeometry = new THREE.CircleGeometry(0.8, 64);
    const burnerMaterial = new THREE.MeshBasicMaterial({
      color: 0x332200,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const burner = new THREE.Mesh(burnerGeometry, burnerMaterial);
    burner.rotation.x = -Math.PI / 2;
    burner.position.y = -2.01;
    this.scene.add(burner);

    const glowGeometry = new THREE.CircleGeometry(1.0, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -2.005;
    this.scene.add(glow);

    const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x333333);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.2;
    gridHelper.position.y = -2;
    this.scene.add(gridHelper);
  }

  private initParticleSystem(): void {
    this.particleSystem = new FireParticleSystem(this.scene, 3000);
  }

  private initUIControl(): void {
    const app = document.getElementById('app')!;
    this.uiControl = new UIControl(app, this.particleSystem);
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.onResize());
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    this.controls.update();
    this.particleSystem.update(deltaTime);

    this.frameCount++;
    this.fpsUpdateTime += deltaTime;
    if (this.fpsUpdateTime >= 0.5) {
      this.fps = this.frameCount / this.fpsUpdateTime;
      this.frameCount = 0;
      this.fpsUpdateTime = 0;
      this.uiControl.updateFPS(this.fps, this.particleSystem.getActiveParticleCount());
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.particleSystem.dispose();
    this.renderer.dispose();
    this.controls.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new FireParticleApp();
  (window as unknown as { fireApp?: FireParticleApp }).fireApp = app;
});
