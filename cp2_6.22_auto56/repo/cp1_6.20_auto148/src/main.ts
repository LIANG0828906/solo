import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneManager } from './sceneManager';
import { UIPanel } from './uiPanel';

interface StressResponse {
  displacements: number[];
  stresses: number[];
  nodeCountX: number;
  nodeCountY: number;
}

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private sceneManager: SceneManager;

  private currentWallType: string = 'point-supported';
  private currentWindPressure: number = 0;
  private currentWindDirection: number = 0;

  private animationStartTime: number = 0;
  private animationDuration: number = 2000;
  private isAnimating: boolean = false;

  private debounceTimer: number | null = null;
  private requestInFlight: boolean = false;
  private pendingRequest: boolean = false;

  constructor() {
    const container = document.getElementById('canvas-container')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0d1a);
    this.scene.fog = new THREE.Fog(0x0d0d1a, 30, 60);

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    this.camera.position.set(0, 0, 18);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.target.set(0, 0, 0);

    this.sceneManager = new SceneManager(this.scene);
    this.sceneManager.createWallMesh('point-supported');

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(5, 5, 10);
    this.scene.add(dirLight);

    new UIPanel({
      onWallTypeChange: this.onWallTypeChange.bind(this),
      onWindPressureChange: this.onWindPressureChange.bind(this),
      onWindDirectionChange: this.onWindDirectionChange.bind(this),
    });

    window.addEventListener('resize', this.onResize.bind(this));

    this.animate();
  }

  private onWallTypeChange(type: string): void {
    this.currentWallType = type;
    this.sceneManager.createWallMesh(type);
    this.sceneManager.updateWindArrow(this.currentWindDirection, this.currentWindPressure);
    this.requestCalculation();
  }

  private onWindPressureChange(pressure: number): void {
    this.currentWindPressure = pressure;
    this.sceneManager.updateWindArrow(this.currentWindDirection, pressure);
    this.debouncedRequestCalculation();
  }

  private onWindDirectionChange(direction: number): void {
    this.currentWindDirection = direction;
    this.sceneManager.updateWindArrow(direction, this.currentWindPressure);
    this.debouncedRequestCalculation();
  }

  private debouncedRequestCalculation(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.requestCalculation();
      this.debounceTimer = null;
    }, 80);
  }

  private async requestCalculation(): Promise<void> {
    if (this.requestInFlight) {
      this.pendingRequest = true;
      return;
    }

    this.requestInFlight = true;

    try {
      const response = await fetch('/api/calculateStress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallType: this.currentWallType,
          windPressure: this.currentWindPressure,
          windDirection: this.currentWindDirection,
        }),
      });

      if (!response.ok) {
        console.error('Calculation request failed:', response.status);
        return;
      }

      const data: StressResponse = await response.json();

      this.sceneManager.setAnimationTargets(
        new Float32Array(data.displacements),
        new Float32Array(data.stresses)
      );

      this.animationStartTime = performance.now();
      this.isAnimating = true;
    } catch (error) {
      console.error('Failed to calculate stress:', error);
    } finally {
      this.requestInFlight = false;

      if (this.pendingRequest) {
        this.pendingRequest = false;
        this.requestCalculation();
      }
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    if (this.isAnimating) {
      const elapsed = performance.now() - this.animationStartTime;
      const t = Math.min(elapsed / this.animationDuration, 1);
      const easedT = this.easeInOutCubic(t);

      this.sceneManager.interpolateDeformation(easedT);

      if (t >= 1) {
        this.isAnimating = false;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    const container = document.getElementById('canvas-container')!;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

new App();
