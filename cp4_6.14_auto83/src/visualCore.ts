import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { dataManager, MetricType, WeatherDataPoint } from './dataManager';
import { ScatterCube } from './scatterCube';
import { TimeSlider } from './timeSlider';
import { AnalysisPanel } from './analysisPanel';

export interface VisualCoreOptions {
  containerId: string;
}

export class VisualCore {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public scatterCube: ScatterCube;
  public timeSlider: TimeSlider;
  public analysisPanel: AnalysisPanel;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private mouse: THREE.Vector2;
  private tooltip: HTMLElement | null = null;
  private hoveredData: WeatherDataPoint | null = null;
  private isDraggingPlane: boolean = false;
  private onReadyCallback: (() => void) | null = null;
  private activeMetric: MetricType = 'temperature';
  private activeCityIndices: Set<number> = new Set();

  constructor(options: VisualCoreOptions) {
    const container = document.getElementById(options.containerId);
    if (!container) {
      throw new Error(`Container with id "${options.containerId}" not found`);
    }
    this.container = container;
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();

    dataManager.getCities().forEach((c) => this.activeCityIndices.add(c.index));

    this.scatterCube = new ScatterCube(this.scene);
    this.timeSlider = new TimeSlider(this.scene, this.scatterCube);
    this.analysisPanel = new AnalysisPanel();

    this.tooltip = document.getElementById('tooltip');

    this.setupInteractions();
    this.setupModuleCallbacks();
    this.handleResize();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a1a');
    scene.fog = new THREE.Fog('#0a0a1a', 30, 80);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(-10, 15, -8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.25);
    fillLight.position.set(8, 5, 10);
    scene.add(fillLight);

    const groundGeo = new THREE.PlaneGeometry(40, 40, 40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.6,
      metalness: 0.1,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -8;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(40, 40, 0x334155, 0x1e293b);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    gridHelper.position.y = -7.99;
    scene.add(gridHelper);

    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    camera.position.set(14, 10, 18);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = false;
    controls.minDistance = 8;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 0, 0);
    return controls;
  }

  private setupModuleCallbacks(): void {
    this.scatterCube.onPointHover = (point, data) => {
      this.handlePointHover(point, data);
    };

    this.scatterCube.onPointClick = (cityIndex) => {
      this.scatterCube.blinkCity(cityIndex);
    };

    this.timeSlider.onDateChange((dayIndex, date) => {
      this.analysisPanel.onDateChange(dayIndex, date);
      this.updateDateDisplay(dayIndex, date);
    });

    this.analysisPanel.onCityClick((cityIndex) => {
      this.scatterCube.blinkCity(cityIndex);
    });
  }

  private setupInteractions(): void {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointermove', (e) => {
      this.updateMouse(e);

      if (this.isDraggingPlane) {
        const dayIdx = this.timeSlider.projectMouseToDayIndex(this.camera, this.mouse);
        if (dayIdx !== null) {
          this.timeSlider.setDayIndex(dayIdx, true);
          this.syncSliderUI(dayIdx);
        }
      } else {
        this.scatterCube.handleRaycast(this.camera, this.mouse);
      }
    });

    dom.addEventListener('pointerdown', (e) => {
      this.updateMouse(e);
      if (this.timeSlider.isPlaneIntersect(this.camera, this.mouse)) {
        this.isDraggingPlane = true;
        this.timeSlider.setDragging(true);
        this.controls.enabled = false;
      }
    });

    dom.addEventListener('pointerup', () => {
      if (this.isDraggingPlane) {
        this.isDraggingPlane = false;
        this.timeSlider.setDragging(false);
        this.controls.enabled = true;
      }
    });

    dom.addEventListener('pointerleave', () => {
      if (this.isDraggingPlane) {
        this.isDraggingPlane = false;
        this.timeSlider.setDragging(false);
        this.controls.enabled = true;
      }
      this.scatterCube.handleRaycast(this.camera, new THREE.Vector2(9999, 9999));
      this.hideTooltip();
    });

    dom.addEventListener('click', (e) => {
      if (this.isDraggingPlane) return;
      this.updateMouse(e);
      this.scatterCube.handleClick(this.camera, this.mouse);
    });

    window.addEventListener('resize', () => this.handleResize());
  }

  private updateMouse(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private handlePointHover(point: THREE.Mesh | null, data: WeatherDataPoint | null): void {
    this.hoveredData = data;
    if (!point || !data || !this.tooltip) {
      this.hideTooltip();
      return;
    }

    const metric = this.scatterCube.getMetric();
    const value = data[metric];
    const unit = dataManager.getMetricUnit(metric);
    const metricLabel = dataManager.getMetricLabel(metric);

    this.tooltip.innerHTML = `
      <div style="font-weight:600;font-size:13px;color:#3b82f6;margin-bottom:4px;">${data.city}</div>
      <div style="font-size:11px;color:#94a3b8;">${data.date}</div>
      <div style="margin-top:4px;">
        <span style="color:#cbd5e1;">${metricLabel}:</span>
        <span style="color:#ffffff;font-weight:500;">${value}${unit}</span>
      </div>
    `;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const vector = point.position.clone();
    vector.project(this.camera);
    const screenX = (vector.x + 1) / 2 * width;
    const screenY = (-vector.y + 1) / 2 * height;

    let left = screenX + 15;
    let top = screenY - 50;
    const tipWidth = 128;
    const tipHeight = 80;
    if (left + tipWidth > width - 10) left = screenX - tipWidth - 15;
    if (top < 10) top = screenY + 20;
    if (top + tipHeight > height - 10) top = height - tipHeight - 10;

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.display = 'block';
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  private updateDateDisplay(dayIndex: number, date: string): void {
    const display = document.getElementById('current-date-display');
    if (display) {
      display.textContent = date;
    }
    const range = document.getElementById('slider-range');
    if (range) {
      range.textContent = `Day ${dayIndex + 1} / Day ${dataManager.getTotalDays()}`;
    }
  }

  private syncSliderUI(dayIndex: number): void {
    const slider = document.getElementById('date-slider') as HTMLInputElement | null;
    if (slider) {
      slider.value = String(Math.round(dayIndex));
    }
  }

  public setMetric(metric: MetricType): void {
    this.activeMetric = metric;
    this.scatterCube.setMetric(metric);
  }

  public getMetric(): MetricType {
    return this.activeMetric;
  }

  public setActiveCities(cityIndices: number[]): void {
    this.activeCityIndices = new Set(cityIndices);
    this.scatterCube.setActiveCities(cityIndices);
    this.analysisPanel.setActiveCities(cityIndices);
  }

  public getActiveCities(): number[] {
    return Array.from(this.activeCityIndices);
  }

  public setSliceDay(dayIndex: number, animate: boolean = true): void {
    this.timeSlider.setDayIndex(dayIndex, animate);
    this.syncSliderUI(dayIndex);
  }

  public getSliceDay(): number {
    return this.timeSlider.getDayIndex();
  }

  public onReady(callback: () => void): void {
    this.onReadyCallback = callback;
  }

  public start(): void {
    if (this.animationId !== null) return;
    this.clock.start();

    const initialDate = dataManager.getDateByIndex(0);
    this.updateDateDisplay(0, initialDate);
    this.timeSlider.setDayIndex(0, false);

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const delta = Math.min(this.clock.getDelta(), 0.1);

      this.timeSlider.update(delta);
      this.scatterCube.update(delta);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };

    animate();

    if (this.onReadyCallback) {
      this.onReadyCallback();
    }
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    this.stop();
    this.scatterCube.dispose();
    this.timeSlider.dispose();
    this.analysisPanel.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
