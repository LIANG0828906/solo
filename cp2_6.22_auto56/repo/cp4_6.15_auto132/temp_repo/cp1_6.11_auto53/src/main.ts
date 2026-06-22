import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { TerrainManager } from './TerrainManager';
import { WaterSimulator } from './WaterSimulator';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private terrainManager: TerrainManager;
  private waterSimulator: WaterSimulator;
  private gui!: GUI;
  private clock: THREE.Clock;

  private infoAmplitude: HTMLElement;
  private infoFrequency: HTMLElement;
  private infoSeed: HTMLElement;
  private infoWater: HTMLElement;
  private infoFps: HTMLElement;
  private loadingEl: HTMLElement;
  private snapshotToast: HTMLElement;

  private frameCount: number = 0;
  private fpsTime: number = 0;
  private currentFps: number = 0;

  private params = {
    amplitude: 2.0,
    frequency: 1.5,
    seed: 42,
    waterHeight: 0.8,
    riseSpeed: 0.3,
    autoRise: false,
    saveSnapshot: () => this.saveSnapshot()
  };

  constructor() {
    const container = document.getElementById('canvas-container');
    if (!container) {
      throw new Error('Canvas container not found');
    }

    this.loadingEl = document.getElementById('loading')!;
    this.snapshotToast = document.getElementById('snapshot-toast')!;
    this.infoAmplitude = document.getElementById('info-amplitude')!;
    this.infoFrequency = document.getElementById('info-frequency')!;
    this.infoSeed = document.getElementById('info-seed')!;
    this.infoWater = document.getElementById('info-water')!;
    this.infoFps = document.getElementById('info-fps')!;

    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(8, 8, 8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.set(0, 1, 0);

    this.setupLights();

    this.terrainManager = new TerrainManager(64, 10);
    this.scene.add(this.terrainManager.getMesh());

    this.waterSimulator = new WaterSimulator(10);
    this.waterSimulator.getMeshes().forEach(mesh => this.scene.add(mesh));

    this.setupGUI();
    this.updateInfoPanel();

    window.addEventListener('resize', this.onWindowResize.bind(this));

    setTimeout(() => {
      this.loadingEl.classList.add('hidden');
    }, 500);

    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404080, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  private setupGUI(): void {
    this.gui = new GUI({
      title: '控制面板',
      width: 280
    });

    const terrainFolder = this.gui.addFolder('地形参数');
    terrainFolder.open();

    terrainFolder.add(this.params, 'amplitude', 0.5, 5.0, 0.1)
      .name('起伏幅度')
      .onChange((value: number) => {
        this.terrainManager.setAmplitude(value);
        this.updateInfoPanel();
      });

    terrainFolder.add(this.params, 'frequency', 0.5, 3.0, 0.1)
      .name('频率')
      .onChange((value: number) => {
        this.terrainManager.setFrequency(value);
        this.updateInfoPanel();
      });

    terrainFolder.add(this.params, 'seed', 1, 999, 1)
      .name('随机种子')
      .onChange((value: number) => {
        this.terrainManager.setSeed(value);
        this.updateInfoPanel();
      });

    const waterFolder = this.gui.addFolder('水位模拟');
    waterFolder.open();

    waterFolder.add(this.params, 'waterHeight', 0, 4, 0.01)
      .name('水位高度')
      .onChange((value: number) => {
        this.waterSimulator.setWaterHeight(value);
        this.updateInfoPanel();
      });

    waterFolder.add(this.params, 'riseSpeed', 0.1, 1.0, 0.05)
      .name('上升速度')
      .onChange((value: number) => {
        this.waterSimulator.setRiseSpeed(value);
      });

    waterFolder.add(this.params, 'autoRise')
      .name('自动上升')
      .onChange((value: boolean) => {
        this.waterSimulator.setAutoRise(value);
      });

    const snapshotFolder = this.gui.addFolder('快照');
    snapshotFolder.open();

    snapshotFolder.add(this.params, 'saveSnapshot')
      .name('保存快照');

    this.applyGUIStyles();
  }

  private applyGUIStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .lil-gui {
        --background-color: rgba(10, 10, 46, 0.7);
        --widget-color: rgba(30, 30, 70, 0.8);
        --focus-color: rgba(100, 180, 255, 0.4);
        --hover-color: rgba(60, 80, 140, 0.6);
        --font-family: 'Courier New', Courier, monospace;
        --text-color: #81d4fa;
        --title-background-color: rgba(20, 20, 60, 0.8);
        --title-text-color: #81d4fa;
        --number-color: #81d4fa;
        --string-color: #81d4fa;
        border: 1px solid rgba(100, 180, 255, 0.3) !important;
        border-radius: 12px !important;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 0 20px rgba(100, 180, 255, 0.15);
        top: 20px !important;
        right: 20px !important;
      }
      
      .lil-gui .title {
        border-bottom: 1px solid rgba(100, 180, 255, 0.2) !important;
        text-shadow: 0 0 8px rgba(129, 212, 250, 0.6);
        letter-spacing: 1px;
      }
      
      .lil-gui .controller {
        border-left: none !important;
      }
      
      .lil-gui .slider {
        border-radius: 8px !important;
        transition: all 0.2s ease;
      }
      
      .lil-gui .slider:hover {
        filter: brightness(1.3);
      }
      
      .lil-gui .slider .fill {
        background: linear-gradient(90deg, #4fc3f7, #81d4fa) !important;
        border-radius: 8px !important;
        box-shadow: 0 0 10px rgba(129, 212, 250, 0.5);
      }
      
      .lil-gui .boolean .widget {
        border-radius: 8px !important;
      }
      
      .lil-gui .button .name {
        border-radius: 8px !important;
        transition: all 0.2s ease !important;
        cursor: pointer;
      }
      
      .lil-gui .button:hover .name {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(129, 212, 250, 0.4);
        background: rgba(100, 180, 255, 0.3) !important;
      }
      
      .lil-gui input[type="number"],
      .lil-gui input[type="text"] {
        border-radius: 6px !important;
        background: rgba(20, 20, 50, 0.8) !important;
        border: 1px solid rgba(100, 180, 255, 0.3) !important;
        color: #81d4fa !important;
      }
      
      .lil-gui input[type="number"]:focus,
      .lil-gui input[type="text"]:focus {
        outline: none;
        border-color: rgba(100, 180, 255, 0.6) !important;
        box-shadow: 0 0 10px rgba(129, 212, 250, 0.3);
      }
      
      .lil-gui .folder {
        border-top: 1px solid rgba(100, 180, 255, 0.15) !important;
      }
    `;
    document.head.appendChild(style);
  }

  private updateInfoPanel(): void {
    const terrainParams = this.terrainManager.getParams();
    const waterParams = this.waterSimulator.getParams();

    this.infoAmplitude.textContent = terrainParams.amplitude.toFixed(1);
    this.infoFrequency.textContent = terrainParams.frequency.toFixed(1);
    this.infoSeed.textContent = terrainParams.seed.toString();
    this.infoWater.textContent = waterParams.waterHeight.toFixed(2);
    this.infoFps.textContent = this.currentFps.toString();
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private saveSnapshot(): void {
    this.showSnapshotToast();

    setTimeout(() => {
      const dataURL = this.renderer.domElement.toDataURL('image/png');

      const terrainParams = this.terrainManager.getParams();
      const waterHeight = this.waterSimulator.getWaterHeight();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      const filename = `terrain_amp${terrainParams.amplitude.toFixed(1)}_freq${terrainParams.frequency.toFixed(1)}_seed${terrainParams.seed}_water${waterHeight.toFixed(2)}_${timestamp}.png`;

      const link = document.createElement('a');
      link.href = dataURL;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 500);
  }

  private showSnapshotToast(): void {
    this.snapshotToast.classList.remove('fade-out');
    this.snapshotToast.classList.add('visible');

    setTimeout(() => {
      this.snapshotToast.classList.add('fade-out');
      setTimeout(() => {
        this.snapshotToast.classList.remove('visible');
        this.snapshotToast.classList.remove('fade-out');
      }, 1500);
    }, 500);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();

    this.frameCount++;
    this.fpsTime += deltaTime;

    if (this.fpsTime >= 1.0) {
      this.currentFps = Math.round(this.frameCount / this.fpsTime);
      this.frameCount = 0;
      this.fpsTime = 0;
      this.updateInfoPanel();
    }

    this.waterSimulator.update(deltaTime);
    this.terrainManager.updateWaterEffect(this.waterSimulator.getWaterHeight());
    this.params.waterHeight = this.waterSimulator.getWaterHeight();
    this.infoWater.textContent = this.waterSimulator.getWaterHeight().toFixed(2);

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
