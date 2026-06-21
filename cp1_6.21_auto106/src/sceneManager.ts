import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleSystem, ColorTheme } from './particleSystem';

class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private particleSystem: ParticleSystem;

  private container: HTMLElement;
  private indicatorDot: HTMLElement | null = null;

  private readonly INITIAL_CAMERA_POS = new THREE.Vector3(0, 8, 22);
  private readonly INITIAL_TARGET = new THREE.Vector3(0, 0, 0);

  constructor(container: HTMLElement, initialTheme: ColorTheme, initialCount: number) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0A1A);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.INITIAL_CAMERA_POS);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0A0A1A, 1);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 60;
    this.controls.target.copy(this.INITIAL_TARGET);
    this.controls.update();

    this.particleSystem = new ParticleSystem(initialCount, initialTheme);
    this.scene.add(this.particleSystem.points);
    this.scene.add(this.particleSystem.lines);

    this.createViewIndicator();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private createViewIndicator(): void {
    const indicator = document.createElement('div');
    indicator.className = 'view-indicator';

    this.indicatorDot = document.createElement('div');
    this.indicatorDot.className = 'view-indicator-dot';

    indicator.appendChild(this.indicatorDot);
    this.container.appendChild(indicator);
  }

  private updateViewIndicator(): void {
    if (!this.indicatorDot) return;

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.negate();

    const indicatorRadius = 36;
    const x = direction.x * indicatorRadius + 40;
    const y = -direction.y * indicatorRadius + 40;

    this.indicatorDot.style.left = `${x}px`;
    this.indicatorDot.style.top = `${y}px`;
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public setParticleCount(count: number): void {
    this.particleSystem.setParticleCount(count);
  }

  public setSpeed(multiplier: number): void {
    this.particleSystem.setSpeed(multiplier);
  }

  public setColorTheme(theme: ColorTheme): void {
    this.particleSystem.setColorTheme(theme);
  }

  public resetView(): void {
    this.camera.position.copy(this.INITIAL_CAMERA_POS);
    this.controls.target.copy(this.INITIAL_TARGET);
    this.controls.update();
  }

  public update(time: number, delta: number): void {
    this.particleSystem.update(time, delta);
    this.controls.update();
    this.updateViewIndicator();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    this.particleSystem.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export { SceneManager };
