import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleSystem, ParticleMode } from './particleSystem';
import { UIController } from './uiController';
import { EffectsManager } from './effects';

class App {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private particleSystem: ParticleSystem;
  private uiController: UIController;
  private effectsManager: EffectsManager;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private clock: THREE.Clock;
  private fps: number = 60;
  private frames: number = 0;
  private fpsTime: number = 0;

  private animationId: number | null = null;

  constructor() {
    this.container = document.getElementById('canvas-container') as HTMLElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);
    this.scene.fog = new THREE.Fog(0x0a0a0f, 100, 200);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 10, 120);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 180;
    this.controls.maxPolarAngle = Math.PI * 0.9;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.clock = new THREE.Clock();

    this.particleSystem = new ParticleSystem(this.scene);
    this.effectsManager = new EffectsManager(this.scene);
    this.uiController = new UIController({
      onModeChange: (mode: ParticleMode) => this.particleSystem.setMode(mode),
      onCountChange: (count: number) => {
        this.particleSystem.setCount(count);
        this.uiController.updateParticleCount(count);
      },
      onSizeChange: (size: number) => this.particleSystem.setSize(size),
      onSpeedChange: (speed: number) => this.particleSystem.setSpeed(speed),
      onColorChange: (hue: number) => this.particleSystem.setColor(hue),
      onLineChange: (threshold: number) => this.particleSystem.setLineThreshold(threshold)
    });

    this.addAmbientElements();
    this.bindEvents();
    this.animate();

    this.uiController.animatePanelIn();
    this.uiController.animateStatsIn();
    this.uiController.updateParticleCount(this.particleSystem.getCount());
  }

  private addAmbientElements(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x4a9eff, 1, 200);
    pointLight1.position.set(50, 50, 50);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff6b9d, 0.5, 150);
    pointLight2.position.set(-50, -30, -30);
    this.scene.add(pointLight2);
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    this.renderer.domElement.addEventListener('pointermove', this.onMouseMove.bind(this));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  private onMouseClick(event: MouseEvent): void {
    const panel = document.querySelector('.control-panel');
    const stats = document.querySelector('.stats-display');

    if (panel && (panel as HTMLElement).contains(event.target as Node)) return;
    if (stats && (stats as HTMLElement).contains(event.target as Node)) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const plane = new THREE.Plane(
      new THREE.Vector3(0, 0, 1),
      -this.camera.position.clone().normalize().dot(new THREE.Vector3(0, 0, 50))
    );

    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersectPoint);

    if (intersectPoint) {
      this.particleSystem.explode(intersectPoint, 18);
      this.effectsManager.createExplosionRing(intersectPoint, 18);
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    this.controls.update();
    this.particleSystem.update(delta, this.camera);

    this.uiController.updateLineCount(this.particleSystem.lineCount);

    this.frames++;
    this.fpsTime += delta;
    if (this.fpsTime >= 0.5) {
      this.fps = this.frames / this.fpsTime;
      this.uiController.updateFPS(this.fps);
      this.frames = 0;
      this.fpsTime = 0;
    }

    this.camera.position.x += Math.sin(elapsed * 0.1) * 0.02;
    this.camera.position.y += Math.cos(elapsed * 0.15) * 0.01;

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.particleSystem.dispose();
    this.effectsManager.dispose();
    this.renderer.dispose();
    this.controls.dispose();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  void new App();
});
