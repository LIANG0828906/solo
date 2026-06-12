import * as THREE from 'three';
import { TerrainGenerator, TerrainData, TerrainParams } from './terrain/TerrainGenerator';
import { TerrainVisualizer, VegetationConfig } from './terrain/TerrainVisualizer';
import { UIController, UIParams } from './ui/UIController';
import { FlyCamera } from './camera/FlyCamera';

class TerrainExplorer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvasContainer: HTMLElement;

  private terrainGenerator: TerrainGenerator;
  private terrainVisualizer: TerrainVisualizer;
  private uiController: UIController;
  private flyCamera: FlyCamera;

  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;

  private currentTerrainData: TerrainData | null = null;
  private clock: THREE.Clock;
  private frameCount: number;
  private lastFpsUpdate: number;
  private isRebuilding: boolean;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1A1A2E);
    this.scene.fog = new THREE.Fog(0x1A1A2E, 100, 300);

    this.canvasContainer = document.getElementById('canvas-container')!;

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.canvasContainer.clientWidth / this.canvasContainer.clientHeight,
      0.1,
      2000
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.canvasContainer.clientWidth, this.canvasContainer.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvasContainer.appendChild(this.renderer.domElement);

    this.terrainGenerator = new TerrainGenerator();
    this.terrainVisualizer = new TerrainVisualizer(this.scene);

    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xFFF0E0, 0.8);
    this.directionalLight.position.set(50, 100, 50);
    this.scene.add(this.directionalLight);

    this.uiController = new UIController('gui-container');
    this.uiController.onChange(this.onParamsChanged.bind(this));

    this.flyCamera = new FlyCamera(this.camera, this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.isRebuilding = false;

    this.bindEvents();

    this.rebuildTerrain(this.uiController.getParams());

    this.animate();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    const width = this.canvasContainer.clientWidth;
    const height = this.canvasContainer.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private onParamsChanged(params: UIParams): void {
    this.rebuildTerrain(params);
  }

  private rebuildTerrain(params: UIParams): void {
    if (this.isRebuilding) return;
    this.isRebuilding = true;

    const terrainParams: TerrainParams = {
      size: params.terrainSize,
      heightScale: params.heightScale,
      frequency: params.frequency,
      seed: params.seed
    };

    const newTerrainData = this.terrainGenerator.generate(terrainParams);

    this.terrainVisualizer.buildTerrain(newTerrainData, params.waterHeight, () => {
      const vegConfig: VegetationConfig = {
        density: params.vegetationDensity,
        minAltitude: 0.3,
        maxAltitude: 0.6
      };
      this.terrainVisualizer.buildVegetation(newTerrainData, vegConfig);

      this.flyCamera.setSceneBounds(
        newTerrainData.size / 2,
        newTerrainData.maxHeight
      );

      this.currentTerrainData = newTerrainData;
      this.isRebuilding = false;
    });
  }

  private updateDirectionalLight(): void {
    const cameraPos = this.camera.position;
    const sunDistance = 150;
    const sunAngle = Math.PI * 0.25;
    const sunHeight = Math.sin(sunAngle) * sunDistance;
    const sunHorizontal = Math.cos(sunAngle) * sunDistance;

    this.directionalLight.position.set(
      cameraPos.x + sunHorizontal,
      cameraPos.y + sunHeight,
      cameraPos.z + sunHorizontal
    );

    this.directionalLight.target.position.copy(cameraPos);
    this.directionalLight.target.updateMatrixWorld();
  }

  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsUpdate;

    if (elapsed >= 500) {
      const fps = (this.frameCount * 1000) / elapsed;
      this.uiController.updateFPS(fps);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    this.flyCamera.update(deltaTime);

    this.updateDirectionalLight();

    this.terrainVisualizer.updateWater(elapsedTime);

    this.renderer.render(this.scene, this.camera);

    this.updateFPS();
  };

  public dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this));

    this.flyCamera.dispose();
    this.terrainVisualizer.dispose();
    this.uiController.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

let app: TerrainExplorer | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new TerrainExplorer();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
    app = null;
  }
});
