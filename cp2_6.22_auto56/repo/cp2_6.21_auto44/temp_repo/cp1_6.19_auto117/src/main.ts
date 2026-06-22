import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuildingManager, type LayoutMode } from './buildings';
import { SunSimulator } from './sunSim';
import { UIManager } from './ui';

class CitySkylineApp {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private buildingManager!: BuildingManager;
  private sunSimulator!: SunSimulator;
  private clock!: THREE.Clock;
  private ground!: THREE.Mesh;
  private gridHelper!: THREE.GridHelper;
  private fpsValue!: HTMLElement;
  private readonly initialCameraPosition = new THREE.Vector3(25, 35.355, 25);
  private readonly initialCameraTarget = new THREE.Vector3(0, 0, 0);
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.Fog(0x0a0a1a, 80, 150);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.initialCameraPosition);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    const app = document.getElementById('app');
    if (app) {
      app.appendChild(this.renderer.domElement);
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 120;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.copy(this.initialCameraTarget);

    this.clock = new THREE.Clock();

    this.fpsValue = document.getElementById('fpsValue') as HTMLElement;
    this.lastFpsUpdate = performance.now();

    this.createGround();
    this.createGrid();

    this.buildingManager = new BuildingManager(this.scene, {
      count: 30,
      maxHeight: 15,
      layout: 'grid',
      spacing: 3,
    });

    this.sunSimulator = new SunSimulator(this.scene, {
      azimuth: 45,
      altitude: 45,
      intensity: 1.2,
    });

    new UIManager({
      onBuildingCountChange: (count: number) => this.handleBuildingCountChange(count),
      onMaxHeightChange: (height: number) => this.handleMaxHeightChange(height),
      onAzimuthChange: (azimuth: number) => this.handleAzimuthChange(azimuth),
      onAltitudeChange: (altitude: number) => this.handleAltitudeChange(altitude),
      onLayoutChange: (layout: LayoutMode) => this.handleLayoutChange(layout),
      onExportSnapshot: () => this.handleExportSnapshot(),
      onResetView: () => this.handleResetView(),
    });

    this.buildingManager.generateBuildings();
    setTimeout(() => {
      this.buildingManager.startGrowthAnimation();
    }, 300);

    this.setupEventListeners();
    this.animate();
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  private createGrid(): void {
    this.gridHelper = new THREE.GridHelper(120, 60, 0xcccccc, 0xcccccc);
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.1;
    this.scene.add(this.gridHelper);
  }

  private handleBuildingCountChange(count: number): void {
    this.buildingManager.setBuildingCount(count);
  }

  private handleMaxHeightChange(height: number): void {
    this.buildingManager.setMaxHeight(height);
  }

  private handleAzimuthChange(azimuth: number): void {
    this.sunSimulator.setAzimuth(azimuth);
  }

  private handleAltitudeChange(altitude: number): void {
    this.sunSimulator.setAltitude(altitude);
  }

  private handleLayoutChange(layout: LayoutMode): void {
    this.buildingManager.switchLayout(layout);
  }

  private handleExportSnapshot(): void {
    this.renderer.render(this.scene, this.camera);

    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `city-skyline-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }

  private handleResetView(): void {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = this.initialCameraPosition.clone();
    const endTarget = this.initialCameraTarget.clone();
    const duration = 800;
    const startTime = performance.now();

    const animateCamera = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(startPos, endPos, eased);
      this.controls.target.lerpVectors(startTarget, endTarget, eased);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animateCamera);
      }
    };

    animateCamera();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      const fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
      this.fpsValue.textContent = fps.toString();
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    this.buildingManager.update(delta);
    this.sunSimulator.update();
    this.controls.update();

    this.renderer.render(this.scene, this.camera);

    this.updateFPS();
  };

  dispose(): void {
    this.buildingManager.dispose();
    this.sunSimulator.dispose();
    this.renderer.dispose();
    this.controls.dispose();

    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();

    this.gridHelper.geometry.dispose();
    (this.gridHelper.material as THREE.Material).dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CitySkylineApp();
});
