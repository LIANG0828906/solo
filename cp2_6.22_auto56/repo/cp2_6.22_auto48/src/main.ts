import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SonarScene } from './scenes/SonarScene';
import { TargetInfo } from './types';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private sonarScene: SonarScene;
  private container: HTMLElement;
  private clock: THREE.Clock = new THREE.Clock();
  private startTime: number = performance.now();

  private fpsEl: HTMLElement | null = null;
  private tStatus: HTMLElement | null = null;
  private tDistance: HTMLElement | null = null;
  private tAzimuth: HTMLElement | null = null;
  private tElevation: HTMLElement | null = null;
  private tVelocity: HTMLElement | null = null;
  private tDoppler: HTMLElement | null = null;
  private tStrength: HTMLElement | null = null;

  constructor() {
    this.container = document.getElementById('canvas-container')!;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(25, 18, 35);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, -5, 0);

    this.sonarScene = new SonarScene(this.scene, this.camera, this.renderer, this.container, {
      onPerformanceUpdate: (fps, particles) => this.updatePerformanceUI(fps, particles),
      onTargetUpdate: (target) => this.updateTargetUI(target),
    });

    this.cacheUIElements();
    window.addEventListener('resize', this.onResize.bind(this));

    this.animate();
  }

  private cacheUIElements(): void {
    this.fpsEl = document.getElementById('fps-counter');
    this.tStatus = document.getElementById('t-status');
    this.tDistance = document.getElementById('t-distance');
    this.tAzimuth = document.getElementById('t-azimuth');
    this.tElevation = document.getElementById('t-elevation');
    this.tVelocity = document.getElementById('t-velocity');
    this.tDoppler = document.getElementById('t-doppler');
    this.tStrength = document.getElementById('t-strength');
  }

  private updatePerformanceUI(fps: number, particleCount: number): void {
    if (this.fpsEl) {
      const fpsColor = fps >= 50 ? '#00ffaa' : fps >= 30 ? '#ffcc44' : '#ff5566';
      this.fpsEl.style.color = fpsColor;
      this.fpsEl.textContent = `FPS: ${fps} | 粒子: ${particleCount}`;
    }
  }

  private updateTargetUI(target: TargetInfo | null): void {
    if (!target || !target.detected) {
      if (this.tStatus) this.tStatus.textContent = '未探测';
      if (this.tDistance) this.tDistance.textContent = '-- m';
      if (this.tAzimuth) this.tAzimuth.textContent = '-- °';
      if (this.tElevation) this.tElevation.textContent = '-- °';
      if (this.tVelocity) this.tVelocity.textContent = '-- m/s';
      if (this.tDoppler) this.tDoppler.textContent = '-- Hz';
      if (this.tStrength) this.tStrength.textContent = '-- dB';
      return;
    }
    const matLabel =
      target.materialType === 'metal' ? '金属 (沉船)' :
      target.materialType === 'fish' ? '生物 (鱼群)' : '岩石';
    if (this.tStatus) this.tStatus.textContent = `已锁定 · ${matLabel}`;
    if (this.tDistance) this.tDistance.textContent = `${target.distance.toFixed(1)} m`;
    if (this.tAzimuth) this.tAzimuth.textContent = `${target.azimuth.toFixed(1)} °`;
    if (this.tElevation) this.tElevation.textContent = `${target.elevation.toFixed(1)} °`;

    const radialVel = target.velocity.clone().normalize();
    const toTarget = target.position.clone().sub(new THREE.Vector3(0, 1.5, 0)).normalize();
    const radialSpeed = target.velocity.dot(toTarget);
    if (this.tVelocity) {
      const sign = radialSpeed >= 0 ? '+' : '';
      this.tVelocity.textContent = `${sign}${radialSpeed.toFixed(2)} m/s`;
      this.tVelocity.style.color = radialSpeed > 0 ? '#ff8866' : radialSpeed < 0 ? '#66ccff' : '#00ffff';
    }
    if (this.tDoppler) {
      const sign = target.dopplerShift >= 0 ? '+' : '';
      this.tDoppler.textContent = `${sign}${target.dopplerShift.toFixed(1)} Hz`;
      this.tDoppler.style.color = target.dopplerShift > 0 ? '#ff6677' : target.dopplerShift < 0 ? '#6699ff' : '#00ffff';
    }
    if (this.tStrength) {
      const dB = 20 * Math.log10(Math.max(0.0001, target.echoStrength));
      this.tStrength.textContent = `${dB.toFixed(1)} dB`;
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    const elapsed = (performance.now() - this.startTime) / 1000;
    this.controls.update();
    this.sonarScene.update(delta, elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.sonarScene.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  (window as any).__app = new App();
});
