import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EarthRenderer } from './earth';
import { CloudLayerManager } from './cloudLayer';
import { WeatherDataManager, WeatherDataType } from './weatherData';
import { HeatmapManager } from './heatmap';
import { UIManager } from './ui';
import './styles.css';

class App {
  private container: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  private earth: EarthRenderer;
  private cloudLayer: CloudLayerManager;
  private weatherData: WeatherDataManager;
  private heatmap: HeatmapManager;
  private ui: UIManager;

  private clock: THREE.Clock;
  private elapsedTime: number = 0;
  private currentHour: number = 0;
  private currentDataType: WeatherDataType = 'temperature';
  private animFrameId: number = 0;
  private isDisposed: boolean = false;

  private lastFpsUpdate: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;

  constructor() {
    this.container = document.getElementById('app-canvas') as HTMLCanvasElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.container,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050a14);
    this.scene.fog = null;

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0.6, 2.9);

    this.controls = new OrbitControls(this.camera, this.container);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 8.0;
    this.controls.minPolarAngle = (10 * Math.PI) / 180;
    this.controls.maxPolarAngle = (170 * Math.PI) / 180;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 0.8;
    this.controls.zoomToCursor = true;

    this.setupLights();

    this.earth = new EarthRenderer(this.scene);
    this.cloudLayer = new CloudLayerManager();
    this.weatherData = new WeatherDataManager();
    this.heatmap = new HeatmapManager();

    this.clock = new THREE.Clock();
    this.clock.start();

    this.ui = new UIManager({
      onHeightChange: (level: number) => this.onHeightChange(level),
      onDataTypeChange: (type: WeatherDataType) => this.onDataTypeChange(type),
      onTimeChange: (hour: number) => this.onTimeChange(hour),
      onPlayToggle: (_playing: boolean) => {}
    });

    this.currentHeight = this.ui.getCurrentHeight();
    this.currentDataType = this.ui.getCurrentDataType();
    this.currentHour = this.ui.getCurrentHour();

    this.earth.setHeightLevel(this.currentHeight);
    this.cloudLayer.setHeightLevel(this.currentHeight);
    this.heatmap.setDataType(this.currentDataType);

    window.addEventListener('resize', () => this.onResize());

    this.weatherData.load('medium').then(() => {
      console.log('[main] Weather data loaded, starting animation');
    });
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.32);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff2d8, 1.2);
    sun.position.set(4, 3.2, 5.5);
    this.scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x88ccff, 0x0a1a3a, 0.55);
    this.scene.add(hemi);

    const fillLight = new THREE.DirectionalLight(0x6699ff, 0.25);
    fillLight.position.set(-3, -1, -4);
    this.scene.add(fillLight);
  }

  private onHeightChange(level: number): void {
    this.cloudLayer.setHeightLevel(level);
    this.earth.setHeightLevel(level);
  }

  private onDataTypeChange(type: WeatherDataType): void {
    this.currentDataType = type;
    this.heatmap.setDataType(type);
  }

  private onTimeChange(hour: number): void {
    this.currentHour = hour;
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  public start(): void {
    this.animate();
  }

  private currentHeight: number = 2;

  private animate = (): void => {
    if (this.isDisposed) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(0.05, this.clock.getDelta());
    this.elapsedTime += dt;
    this.controls.update();

    const hour = this.ui.getCurrentHour();
    const currentHour = hour;
    const playing = this.ui.getIsPlaying();

    const cloudResult = this.cloudLayer.update(dt, this.elapsedTime, currentHour);
    this.earth.updateCloudTexture(cloudResult.texture, cloudResult.opacity);
    this.currentHeight = cloudResult.level;

    let heatOpacity = 0.48;
    if (this.weatherData.isLoaded()) {
      const hourData = this.weatherData.getHourData(currentHour);
      const heatResult = this.heatmap.update(dt, hourData);
      this.earth.updateHeatmapTexture(heatResult.texture, heatResult.opacity);
      heatOpacity = heatResult.opacity;
    } else {
      this.earth.updateHeatmapTexture(this.heatmap.getTexture(), heatOpacity);
    }

    this.earth.update(dt, this.camera);

    const earthGroup = this.earth.getGroup();
    const autoRotSpeed = playing ? 0.012 : 0.0015;
    earthGroup.rotation.y += dt * autoRotSpeed;

    this.renderer.render(this.scene, this.camera);

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1.0) {
      this.lastFpsUpdate = this.frameCount / this.fpsTimer;
      if (this.lastFpsUpdate < 28) {
        console.warn(`[main] FPS dropped to ${this.lastFpsUpdate.toFixed(1)}`);
      }
      this.frameCount = 0;
      this.fpsTimer = 0;
    }
  }

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.animFrameId);
    this.ui.dispose();
    this.cloudLayer.dispose();
    this.heatmap.dispose();
    this.earth.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', () => this.onResize());
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
  app.start();
  console.log('[main] App initialized');
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
    app = null;
  }
});
