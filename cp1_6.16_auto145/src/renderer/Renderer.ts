import * as THREE from 'three';
import { CoralManager } from '../coral/CoralManager';
import { EnvironmentController } from '../environment/EnvironmentController';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Renderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private coralManager: CoralManager | null = null;
  private environmentController: EnvironmentController | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private animationId: number | null = null;
  private composer: any = null;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x1a5276, 0.005);
    this.scene.background = new THREE.Color(0x0a1628);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 15, 25);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 80;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.target.set(0, -4, 0);

    this.createHemisphereBoundary();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private createHemisphereBoundary(): void {
    const geometry = new THREE.SphereGeometry(50, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0x1a5276,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.15,
    });

    const hemisphere = new THREE.Mesh(geometry, material);
    hemisphere.position.y = -5;
    this.scene.add(hemisphere);
  }

  public setCoralManager(manager: CoralManager): void {
    this.coralManager = manager;
  }

  public setEnvironmentController(controller: EnvironmentController): void {
    this.environmentController = controller;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public start(): void {
    this.clock.start();
    this.animate();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();

    this.controls.update();

    if (this.environmentController) {
      this.environmentController.update(deltaTime);
    }

    if (this.coralManager) {
      this.coralManager.update(deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clock.stop();
  }

  public dispose(): void {
    this.stop();

    window.removeEventListener('resize', this.onResize.bind(this));

    this.controls.dispose();
    this.renderer.dispose();

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }

    if (this.composer) {
      this.composer.dispose();
    }
  }
}
