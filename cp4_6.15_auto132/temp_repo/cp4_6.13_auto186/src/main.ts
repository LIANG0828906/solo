import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DataParser } from './modules/DataParser';
import { DataVisualizer, type BarClickInfo } from './modules/DataVisualizer';
import { UserControl } from './modules/UserControl';
import { MainLoop } from './modules/MainLoop';
import type { OceanDataset, VisualizerConfig } from './types';
import { DEPTH_LEVELS, GRID_SIZE } from './types';

class OceanFlowApp {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;

  private dataParser!: DataParser;
  private visualizer!: DataVisualizer;
  private userControl!: UserControl;
  private mainLoop!: MainLoop;

  private dataset: OceanDataset | null = null;
  private tooltip: HTMLElement | null = null;
  private tooltipHeader: HTMLElement | null = null;
  private tooltipDepth: HTMLElement | null = null;
  private tooltipTemp: HTMLElement | null = null;
  private tooltipSalinity: HTMLElement | null = null;
  private tooltipVelocity: HTMLElement | null = null;
  private tooltipTimer: ReturnType<typeof setTimeout> | null = null;

  async init() {
    this.initScene();
    this.initModules();
    this.initTooltip();
    this.initClickHandler();
    this.initResize();
    this.hideLoadingScreen();
    this.loadSampleData();
  }

  private initScene() {
    const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050515);
    this.scene.fog = new THREE.FogExp2(0x050515, 0.0008);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      5000
    );
    this.camera.position.set(200, 250, 350);
    this.camera.lookAt(0, 100, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 80;
    this.controls.maxDistance = 1200;
    this.controls.target.set(0, 100, 0);
    this.controls.update();

    this.addLights();
    this.addGridHelper();
  }

  private addLights() {
    const ambientLight = new THREE.AmbientLight(0x304060, 1.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(150, 300, 200);
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0x4488aa, 0.6);
    directionalLight2.position.set(-100, 150, -100);
    this.scene.add(directionalLight2);

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x00008B, 0.4);
    this.scene.add(hemisphereLight);
  }

  private addGridHelper() {
    const gridSize = (GRID_SIZE - 1) * 12 + 20;
    const gridHelper = new THREE.GridHelper(gridSize, 20, 0x00bcd4, 0x0a1a3a);
    gridHelper.position.y = -60;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
  }

  private initModules() {
    this.dataParser = new DataParser();
    this.visualizer = new DataVisualizer(this.scene);
    this.userControl = new UserControl({
      onConfigChange: (config: VisualizerConfig) => {
        this.visualizer.updateConfig(config);
        this.mainLoop.setAutoRotate(config.autoRotate);
      },
      onTimeChange: (index: number) => {
        this.visualizer.updateTimePoint(index);
      },
    });

    this.userControl.onFileUpload = async (file: File) => {
      await this.handleFileUpload(file);
    };

    this.mainLoop = new MainLoop(
      this.renderer,
      this.scene,
      this.camera,
      this.controls,
      this.visualizer
    );
  }

  private initTooltip() {
    this.tooltip = document.getElementById('tooltip')!;
    this.tooltipHeader = document.getElementById('tooltip-header')!;
    this.tooltipDepth = document.getElementById('tooltip-depth')!;
    this.tooltipTemp = document.getElementById('tooltip-temp')!;
    this.tooltipSalinity = document.getElementById('tooltip-salinity')!;
    this.tooltipVelocity = document.getElementById('tooltip-velocity')!;
  }

  private initClickHandler() {
    const canvas = document.getElementById('scene-canvas')!;
    canvas.addEventListener('click', (event: MouseEvent) => {
      if (!this.dataset) return;

      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const info = this.visualizer.handleClick(mouse, this.camera);
      if (info) {
        this.showTooltip(info, event.clientX, event.clientY);
      } else {
        this.hideTooltip();
      }
    });
  }

  private initResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private showTooltip(info: BarClickInfo, screenX: number, screenY: number) {
    if (!this.tooltip) return;

    this.tooltipHeader!.textContent = `深度层 ${info.depth}m`;
    this.tooltipDepth!.textContent = `${info.depth}m`;
    this.tooltipTemp!.textContent = `${info.temperature.toFixed(2)}°C`;
    this.tooltipSalinity!.textContent = `${info.salinity.toFixed(2)} PSU`;
    this.tooltipVelocity!.textContent = `${info.velocity.toFixed(3)} m/s`;

    const vector = info.position.clone().project(this.camera);
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    const x = vector.x * halfWidth + halfWidth;
    const y = -vector.y * halfHeight + halfHeight;

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y - 20}px`;
    this.tooltip.classList.remove('hidden');
    this.tooltip.classList.add('visible');

    if (this.tooltipTimer) clearTimeout(this.tooltipTimer);
    this.tooltipTimer = setTimeout(() => {
      this.hideTooltip();
    }, 2000);
  }

  private hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
      this.tooltip.classList.add('hidden');
    }
    if (this.tooltipTimer) {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = null;
    }
  }

  private async handleFileUpload(file: File) {
    try {
      this.dataset = await this.dataParser.parseCSV(file);
      this.visualizer.setData(this.dataset);
      this.userControl.showControlPanel();
      this.userControl.setUploadZoneLoaded(file.name);
      this.userControl.setTimeline(this.dataset.timePoints);
      this.mainLoop.showStats();
      this.mainLoop.start();
    } catch (error) {
      console.error('Failed to parse CSV:', error);
      alert('CSV解析失败，请检查文件格式是否正确。');
    }
  }

  private hideLoadingScreen() {
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 600);
      }
    }, 1500);
  }

  private async loadSampleData() {
    const sampleCSV = this.generateSampleCSV();
    try {
      this.dataset = await this.dataParser.parseCSVText(sampleCSV);
      this.visualizer.setData(this.dataset);
      this.userControl.showControlPanel();
      this.userControl.setTimeline(this.dataset.timePoints);
      this.mainLoop.showStats();
      this.mainLoop.start();
    } catch (error) {
      console.error('Failed to load sample data:', error);
    }
  }

  private generateSampleCSV(): string {
    const headers = 'longitude,latitude,depth,temperature,salinity,velocity,direction,time';
    const rows: string[] = [headers];
    const lonBase = 120.0;
    const latBase = 30.0;

    for (const depth of DEPTH_LEVELS) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const lon = lonBase + c * 0.5 + (Math.random() - 0.5) * 0.1;
          const lat = latBase + r * 0.5 + (Math.random() - 0.5) * 0.1;

          const depthFactor = 1 - (DEPTH_LEVELS.indexOf(depth) / (DEPTH_LEVELS.length - 1));
          const tempBase = -2 + depthFactor * 32;
          const temperature = tempBase + (Math.random() - 0.5) * 6;

          const salinity = 34.0 + (1 - depthFactor) * 1.5 + (Math.random() - 0.5) * 0.8;

          const velocity = 0.05 + depthFactor * 0.6 + (Math.random() - 0.5) * 0.2;
          const direction = (r * 30 + c * 15 + Math.random() * 40) % 360;

          rows.push(
            `${lon.toFixed(3)},${lat.toFixed(3)},${depth},${temperature.toFixed(2)},${salinity.toFixed(2)},${velocity.toFixed(3)},${direction.toFixed(1)},2024-01-15`
          );
        }
      }
    }

    for (let t = 0; t < 3; t++) {
      const timeStr = `2024-0${2 + t}-15`;
      for (const depth of DEPTH_LEVELS) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const lon = lonBase + c * 0.5 + (Math.random() - 0.5) * 0.1;
            const lat = latBase + r * 0.5 + (Math.random() - 0.5) * 0.1;
            const depthFactor = 1 - (DEPTH_LEVELS.indexOf(depth) / (DEPTH_LEVELS.length - 1));
            const tempBase = -2 + depthFactor * 32;
            const temperature = tempBase + (Math.random() - 0.5) * 8 + t * 2;
            const salinity = 34.0 + (1 - depthFactor) * 1.5 + (Math.random() - 0.5) * 0.8;
            const velocity = 0.05 + depthFactor * 0.6 + (Math.random() - 0.5) * 0.3;
            const direction = (r * 30 + c * 15 + t * 20 + Math.random() * 40) % 360;
            rows.push(
              `${lon.toFixed(3)},${lat.toFixed(3)},${depth},${temperature.toFixed(2)},${salinity.toFixed(2)},${velocity.toFixed(3)},${direction.toFixed(1)},${timeStr}`
            );
          }
        }
      }
    }

    return rows.join('\n');
  }
}

const app = new OceanFlowApp();
app.init();
