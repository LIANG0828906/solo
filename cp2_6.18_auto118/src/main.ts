import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ClothSim } from './clothSim';
import { ClothRenderer, PALETTES } from './renderer';
import { ControlPanel } from './controlPanel';

const CLOTH_WIDTH = 3;
const CLOTH_HEIGHT = 2;
const DEFAULT_SEGMENTS_X = 20;
const DEFAULT_SEGMENTS_Y = 16;
const LOW_SEGMENTS_X = 14;
const LOW_SEGMENTS_Y = 10;

class FlagSimulation {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clothSim: ClothSim;
  private clothRenderer: ClothRenderer;
  private controlPanel: ControlPanel;
  private windSpeed: number = 0;
  private clock: THREE.Clock;
  private frameCount: number = 0;
  private fpsTime: number = 0;
  private currentFPS: number = 60;
  private lowPerformanceMode: boolean = false;
  private pole: THREE.Mesh | null = null;
  private base: THREE.Mesh | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    this.container = container;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.clothSim = new ClothSim(CLOTH_WIDTH, CLOTH_HEIGHT, DEFAULT_SEGMENTS_X, DEFAULT_SEGMENTS_Y);
    this.clothRenderer = new ClothRenderer(this.scene);
    this.controlPanel = new ControlPanel(this.container, {
      onWindSpeedChange: (speed) => this.handleWindSpeedChange(speed),
      onReset: () => this.handleReset(),
      onThemeChange: (theme) => this.handleThemeChange(theme)
    });
    this.clock = new THREE.Clock();

    this.init();
  }

  private init(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.set(2.5, 1.5, 5);
    this.camera.lookAt(1.5, 1, 0);

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.85;
    this.controls.enablePan = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 15;
    this.controls.maxPolarAngle = Math.PI * 0.9;
    this.controls.target.set(1.5, 1, 0);

    this.setupLighting();
    this.setupPoleAndBase();

    const vertices = this.clothSim.update(0, 0);
    this.clothRenderer.buildMesh(vertices, DEFAULT_SEGMENTS_X, DEFAULT_SEGMENTS_Y);

    window.addEventListener('resize', () => this.handleResize());

    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.3);
    fillLight.position.set(-3, 2, -2);
    this.scene.add(fillLight);
  }

  private setupPoleAndBase(): void {
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 16);
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.3
    });
    this.pole = new THREE.Mesh(poleGeometry, poleMaterial);
    this.pole.position.set(-0.05, 1.25, 0);
    this.pole.castShadow = true;
    this.pole.receiveShadow = true;
    this.scene.add(this.pole);

    const baseGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.1
    });
    this.base = new THREE.Mesh(baseGeometry, baseMaterial);
    this.base.position.set(-0.05, 0.075, 0);
    this.base.castShadow = true;
    this.base.receiveShadow = true;
    this.scene.add(this.base);

    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.075;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private handleWindSpeedChange(speed: number): void {
    this.windSpeed = speed;
  }

  private handleReset(): void {
    this.windSpeed = 0;
    this.clothSim.reset();
  }

  private handleThemeChange(theme: string): void {
    const palette = PALETTES[theme];
    if (palette) {
      this.clothRenderer.setColorPalette(palette, 0.3);
    }
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateFPS(deltaTime: number): void {
    this.frameCount++;
    this.fpsTime += deltaTime;

    if (this.fpsTime >= 1) {
      this.currentFPS = this.frameCount / this.fpsTime;
      this.controlPanel.setFPS(this.currentFPS);
      this.frameCount = 0;
      this.fpsTime = 0;

      if (this.currentFPS < 25 && !this.lowPerformanceMode) {
        this.enableLowPerformanceMode();
      } else if (this.currentFPS >= 35 && this.lowPerformanceMode) {
        this.disableLowPerformanceMode();
      }
    }
  }

  private enableLowPerformanceMode(): void {
    this.lowPerformanceMode = true;
    this.clothSim.resize(LOW_SEGMENTS_X, LOW_SEGMENTS_Y);
    const vertices = this.clothSim.update(0, this.windSpeed);
    this.clothRenderer.buildMesh(vertices, LOW_SEGMENTS_X, LOW_SEGMENTS_Y);
  }

  private disableLowPerformanceMode(): void {
    this.lowPerformanceMode = false;
    this.clothSim.resize(DEFAULT_SEGMENTS_X, DEFAULT_SEGMENTS_Y);
    const vertices = this.clothSim.update(0, this.windSpeed);
    this.clothRenderer.buildMesh(vertices, DEFAULT_SEGMENTS_X, DEFAULT_SEGMENTS_Y);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    const vertices = this.clothSim.update(deltaTime, this.windSpeed);
    this.clothRenderer.updateMesh(vertices);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    this.updateFPS(deltaTime);
  }

  dispose(): void {
    this.clothRenderer.dispose();
    this.controlPanel.dispose();
    this.renderer.dispose();
    this.controls.dispose();
    window.removeEventListener('resize', () => this.handleResize());
  }
}

new FlagSimulation('app');
