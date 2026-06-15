import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ColorSystem } from './colorSystem';
import { VoxelEditor, VoxelData, VoxelPosition } from './voxelEditor';
import { PresetManager, PresetType } from './presetManager';
import { SceneRenderer } from './sceneRenderer';

class VoxelBloomApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;

  private colorSystem: ColorSystem;
  private voxelEditor: VoxelEditor;
  private presetManager: PresetManager;
  private sceneRenderer: SceneRenderer;

  private clock: THREE.Clock;
  private animationFrameId: number;

  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;

  private isDragging: boolean = false;
  private mouseDownPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0B0C10);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(20, 15, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance = 10;
    this.controls.maxDistance = 60;
    this.controls.update();

    this.setupLighting();

    this.colorSystem = new ColorSystem();
    this.voxelEditor = new VoxelEditor(this.colorSystem);
    this.presetManager = new PresetManager();
    this.sceneRenderer = new SceneRenderer(
      this.scene,
      this.camera,
      this.renderer,
      this.controls,
      this.colorSystem
    );

    this.voxelEditor.setAnimationCallback(this.onVoxelAnimation.bind(this));

    this.setupUI();
    this.setupEventListeners();

    this.animationFrameId = 0;
    this.animate = this.animate.bind(this);

    this.loadDefaultPreset();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight1.position.set(10, 10, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x45a29e, 0.4, 100);
    pointLight2.position.set(-10, 10, -10);
    this.scene.add(pointLight2);
  }

  private setupUI(): void {
    this.buildColorSwatches();
    this.setupColorPicker();
    this.setupIntensitySlider();
    this.setupPresetButtons();
    this.setupHamburgerMenu();
    this.updateVoxelCount();
  }

  private buildColorSwatches(): void {
    const colorGrid = document.getElementById('colorGrid')!;
    colorGrid.innerHTML = '';
    colorGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';

    const colors = this.colorSystem.getPresetColors();

    colors.forEach((color, index) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color.hex;
      swatch.title = color.name;
      swatch.dataset.index = String(index);

      if (
        index === this.colorSystem.getCurrentColorIndex() &&
        !this.colorSystem.isUsingCustomColor()
      ) {
        swatch.classList.add('selected');
      }

      swatch.addEventListener('click', () => {
        this.colorSystem.selectPresetColor(index);
        this.updateSwatchSelection();
      });

      colorGrid.appendChild(swatch);
    });

    this.colorSystem.subscribe(() => {
      this.updateSwatchSelection();
    });
  }

  private updateSwatchSelection(): void {
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach((swatch, index) => {
      if (
        index === this.colorSystem.getCurrentColorIndex() &&
        !this.colorSystem.isUsingCustomColor()
      ) {
        swatch.classList.add('selected');
      } else {
        swatch.classList.remove('selected');
      }
    });
  }

  private setupColorPicker(): void {
    const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
    const colorPickerBtn = document.getElementById('colorPickerBtn')!;

    colorPicker.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.colorSystem.setCustomColor(target.value);
      colorPickerBtn.style.backgroundColor = target.value;
      this.updateSwatchSelection();
    });

    colorPickerBtn.style.backgroundColor = colorPicker.value;
  }

  private setupIntensitySlider(): void {
    const slider = document.getElementById('intensitySlider') as HTMLInputElement;
    const valueDisplay = document.getElementById('intensityValue')!;

    slider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseFloat(target.value);
      this.colorSystem.setEmissiveIntensity(value);
      valueDisplay.textContent = value.toFixed(2);
    });

    this.colorSystem.subscribe(() => {
      const intensity = this.colorSystem.getEmissiveIntensity();
      this.sceneRenderer.updateAllEmissiveIntensity(intensity);
      this.voxelEditor.updateAllEmissiveIntensity(intensity);
    });

    slider.value = String(this.colorSystem.getEmissiveIntensity());
    valueDisplay.textContent = this.colorSystem.getEmissiveIntensity().toFixed(2);
  }

  private setupPresetButtons(): void {
    const buttons = document.querySelectorAll('.preset-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const presetType = target.dataset.preset as PresetType;
        this.applyPreset(presetType);
      });
    });
  }

  private setupHamburgerMenu(): void {
    const hamburgerBtn = document.getElementById('hamburgerBtn')!;
    const controlPanel = document.getElementById('controlPanel')!;

    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('active');
      controlPanel.classList.toggle('open');
    });

    const checkScreenWidth = () => {
      if (window.innerWidth > 1440) {
        hamburgerBtn.classList.remove('active');
        controlPanel.classList.remove('open');
      }
    };

    window.addEventListener('resize', checkScreenWidth);
    checkScreenWidth();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));

    const canvas = this.renderer.domElement;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = false;
      this.mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mousemove', (e) => {
      const dx = e.clientX - this.mouseDownPos.x;
      const dy = e.clientY - this.mouseDownPos.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.isDragging = true;
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (!this.isDragging) {
        this.onMouseClick(e);
      }
      this.isDragging = false;
    });
  }

  private onMouseClick(event: MouseEvent): void {
    if (this.controls === undefined) return;

    const result = this.voxelEditor.handleMouseClick(
      event,
      this.camera,
      this.renderer.domElement,
      this.sceneRenderer.getVoxelObjects(),
      this.sceneRenderer.getGridHelper()
    );

    if (result.position) {
      this.updateVoxelCount();
    }
  }

  private onVoxelAnimation(
    position: VoxelPosition,
    type: 'add' | 'remove',
    data?: VoxelData
  ): void {
    if (!data) return;

    if (type === 'add') {
      this.sceneRenderer.addVoxel(data);
    } else if (type === 'remove') {
      this.sceneRenderer.removeVoxel(data);
    }

    this.updateVoxelCount();
  }

  private applyPreset(type: PresetType): void {
    const presets = this.presetManager.generatePreset(type);
    this.voxelEditor.clearAll();
    this.sceneRenderer.startPresetAnimation(presets, this.colorSystem);
    this.updateVoxelCount();
  }

  private loadDefaultPreset(): void {
    this.applyPreset('sphere');
  }

  private updateVoxelCount(): void {
    const countEl = document.getElementById('voxelCount');
    if (countEl) {
      countEl.textContent = String(this.sceneRenderer.getVoxelCount());
    }
  }

  private updateFPS(deltaTime: number): void {
    this.frameCount++;
    this.lastFrameTime += deltaTime;

    if (this.lastFrameTime >= 0.5) {
      this.fps = Math.round(this.frameCount / this.lastFrameTime);
      const fpsEl = document.getElementById('fpsValue');
      if (fpsEl) {
        fpsEl.textContent = String(this.fps);
      }
      this.frameCount = 0;
      this.lastFrameTime = 0;
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();
    this.updateFPS(deltaTime);

    this.controls.update();

    this.sceneRenderer.update(deltaTime);

    if (this.sceneRenderer.isPresetAnimatingActive()) {
      this.updateVoxelCount();
    }

    this.renderer.render(this.scene, this.camera);
  }

  start(): void {
    this.animate();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.sceneRenderer.dispose();
    this.renderer.dispose();
  }
}

const app = new VoxelBloomApp();
app.start();
