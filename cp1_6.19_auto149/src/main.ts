import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GrowthEngine } from './growth/engine';
import { PlantRenderer, createGroundGrid } from './visual/renderer';
import { LightControl } from './visual/lightControl';

class ControlPanel {
  private container: HTMLDivElement;
  private lightIntensitySlider: HTMLInputElement;
  private lightColorSlider: HTMLInputElement;
  private waterSlider: HTMLInputElement;
  private horizontalAngleSlider: HTMLInputElement;
  private verticalAngleSlider: HTMLInputElement;
  private progressBarFill: HTMLDivElement;
  private stageLabel: HTMLDivElement;
  private dayLabel: HTMLDivElement;
  private infoPanel: HTMLDivElement;
  private collapseBtn: HTMLButtonElement;
  private contentWrapper: HTMLDivElement;

  private isCollapsed: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'control-panel';
    this.container.className = 'control-panel';

    this.container.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">🌱 植物生长控制台</span>
        <button class="collapse-btn" title="展开/折叠">▾</button>
      </div>
      <div class="panel-content-wrapper">
        <div class="progress-section">
          <div class="progress-labels">
            <span class="stage-label">阶段：种子</span>
            <span class="day-label">第 0 天 / 15</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill"></div>
          </div>
        </div>
        <div class="info-panel">
          <span class="info-item">🌿 叶片：<span class="leaf-count">0</span></span>
          <span class="info-item">📏 株高：<span class="height">0.50</span></span>
          <span class="info-item">🌸 花苞：<span class="bud-state">未开</span></span>
        </div>
        <div class="slider-group">
          <label>
            <span class="slider-label">☀️ 光照强度</span>
            <input type="range" min="0" max="100" value="50" class="slider light-intensity-slider">
            <span class="slider-value">50</span>
          </label>
          <label>
            <span class="slider-label">🎨 光谱颜色</span>
            <input type="range" min="0" max="100" value="0" class="slider light-color-slider spectrum-slider">
            <span class="slider-value color-hex">#FFFFFF</span>
          </label>
          <label>
            <span class="slider-label">💧 浇水频率</span>
            <input type="range" min="0" max="100" value="50" class="slider water-slider">
            <span class="slider-value">50</span>
          </label>
        </div>
        <div class="angle-group">
          <label>
            <span class="slider-label">↔️ 日照水平</span>
            <input type="range" min="0" max="360" value="45" class="slider horizontal-slider">
            <span class="slider-value">45°</span>
          </label>
          <label>
            <span class="slider-label">↕️ 日照垂直</span>
            <input type="range" min="0" max="90" value="60" class="slider vertical-slider">
            <span class="slider-value">60°</span>
          </label>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.collapseBtn = this.container.querySelector('.collapse-btn')!;
    this.contentWrapper = this.container.querySelector('.panel-content-wrapper')!;
    this.lightIntensitySlider = this.container.querySelector('.light-intensity-slider')!;
    this.lightColorSlider = this.container.querySelector('.light-color-slider')!;
    this.waterSlider = this.container.querySelector('.water-slider')!;
    this.horizontalAngleSlider = this.container.querySelector('.horizontal-slider')!;
    this.verticalAngleSlider = this.container.querySelector('.vertical-slider')!;
    this.progressBarFill = this.container.querySelector('.progress-fill')!;
    this.stageLabel = this.container.querySelector('.stage-label')!;
    this.dayLabel = this.container.querySelector('.day-label')!;
    this.infoPanel = this.container.querySelector('.info-panel')!;

    this.bindResponsive();
    this.bindCollapse();
  }

  private bindResponsive(): void {
    const check = () => {
      if (window.innerWidth < 768) {
        this.container.classList.add('mobile');
        if (!this.isCollapsed) {
          this.contentWrapper.style.maxHeight = '0px';
          this.contentWrapper.style.opacity = '0';
          this.isCollapsed = true;
          this.collapseBtn.textContent = '▴';
        }
      } else {
        this.container.classList.remove('mobile');
        this.contentWrapper.style.maxHeight = '';
        this.contentWrapper.style.opacity = '';
      }
    };
    window.addEventListener('resize', check);
    check();
  }

  private bindCollapse(): void {
    this.collapseBtn.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      if (this.isCollapsed) {
        this.contentWrapper.style.maxHeight = '0px';
        this.contentWrapper.style.opacity = '0';
        this.collapseBtn.textContent = '▴';
      } else {
        this.contentWrapper.style.maxHeight = '1000px';
        this.contentWrapper.style.opacity = '1';
        this.collapseBtn.textContent = '▾';
      }
    });
  }

  public onLightIntensityChange(cb: (v: number) => void): void {
    this.bindSliderDebounced(this.lightIntensitySlider, (v) => {
      const label = this.container.querySelector('.light-intensity-slider + .slider-value')!;
      label.textContent = String(v);
      cb(v);
    });
  }

  public onLightColorChange(cb: (hex: string, value: number) => void): void {
    this.bindSliderDebounced(this.lightColorSlider, (v) => {
      const ratio = v / 100;
      const r = 255;
      const g = Math.round(255 - (255 - 215) * ratio);
      const b = Math.round(255 - (255 - 0) * ratio);
      const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
      const label = this.container.querySelector('.light-color-slider + .slider-value')!;
      label.textContent = hex;
      cb(hex, v);
    });
  }

  public onWaterChange(cb: (v: number) => void): void {
    this.bindSliderDebounced(this.waterSlider, (v) => {
      const label = this.container.querySelector('.water-slider + .slider-value')!;
      label.textContent = String(v);
      cb(v);
    });
  }

  public onHorizontalAngleChange(cb: (v: number) => void): void {
    this.bindSliderDebounced(this.horizontalAngleSlider, (v) => {
      const label = this.container.querySelector('.horizontal-slider + .slider-value')!;
      label.textContent = `${v}°`;
      cb(v);
    });
  }

  public onVerticalAngleChange(cb: (v: number) => void): void {
    this.bindSliderDebounced(this.verticalAngleSlider, (v) => {
      const label = this.container.querySelector('.vertical-slider + .slider-value')!;
      label.textContent = `${v}°`;
      cb(v);
    });
  }

  private bindSliderDebounced(slider: HTMLInputElement, cb: (v: number) => void): void {
    let timer: number | null = null;
    const handler = () => {
      const value = Number(slider.value);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => cb(value), 300);
    };
    slider.addEventListener('input', handler);
    slider.addEventListener('change', handler);
  }

  public updateProgress(progress: number, stage: string, day: number): void {
    const pct = Math.min(100, progress * 100);
    this.progressBarFill.style.width = `${pct}%`;
    this.stageLabel.textContent = `阶段：${stage}`;
    this.dayLabel.textContent = `第 ${day} 天 / 15`;
  }

  public updateInfo(leafCount: number, height: number, budStateText: string): void {
    (this.infoPanel.querySelector('.leaf-count') as HTMLSpanElement).textContent = String(Math.round(leafCount));
    (this.infoPanel.querySelector('.height') as HTMLSpanElement).textContent = height.toFixed(2);
    (this.infoPanel.querySelector('.bud-state') as HTMLSpanElement).textContent = budStateText;
  }

  public getInitialValues() {
    return {
      lightIntensity: Number(this.lightIntensitySlider.value),
      lightColorValue: Number(this.lightColorSlider.value),
      water: Number(this.waterSlider.value),
      horizontal: Number(this.horizontalAngleSlider.value),
      vertical: Number(this.verticalAngleSlider.value)
    };
  }
}

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private growthEngine: GrowthEngine;
  private plantRenderer: PlantRenderer;
  private lightControl: LightControl;
  private controlPanel: ControlPanel;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private clock: THREE.Clock;

  private lightIntensity: number = 50;
  private waterAmount: number = 50;
  private horizontalAngle: number = 45;
  private verticalAngle: number = 60;
  private lightColorHex: string = '#FFFFFF';

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      (window.innerWidth * 1) / (window.innerHeight * 0.8),
      0.1,
      1000
    );
    this.camera.position.set(8, 6, 12);
    this.camera.lookAt(0, 1.5, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    const canvas = this.renderer.domElement;
    canvas.className = 'three-canvas';
    document.body.appendChild(canvas);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.target.set(0, 1.5, 0);

    createGroundGrid(this.scene);

    this.growthEngine = new GrowthEngine();
    this.plantRenderer = new PlantRenderer(this.scene);
    this.lightControl = new LightControl(this.scene);

    this.controlPanel = new ControlPanel();

    this.bindPanelEvents();
    this.applyInitialValues();
    this.bindInteractionEvents();
    this.bindResize();
    this.animate();
  }

  private applyInitialValues(): void {
    const init = this.controlPanel.getInitialValues();
    this.lightIntensity = init.lightIntensity;
    this.waterAmount = init.water;
    this.horizontalAngle = init.horizontal;
    this.verticalAngle = init.vertical;
    this.lightControl.setLightIntensity(this.lightIntensity);
    this.lightControl.setSunAngle(this.horizontalAngle, this.verticalAngle);
    this.updateLightColorFromValue(init.lightColorValue);
  }

  private updateLightColorFromValue(value: number): void {
    const ratio = value / 100;
    const r = 255;
    const g = Math.round(255 - (255 - 215) * ratio);
    const b = Math.round(255 - (255 - 0) * ratio);
    this.lightColorHex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    this.lightControl.setLightColor(this.lightColorHex);
  }

  private bindPanelEvents(): void {
    this.controlPanel.onLightIntensityChange((v) => {
      this.lightIntensity = v;
      this.lightControl.setLightIntensity(v);
    });

    this.controlPanel.onLightColorChange((hex, value) => {
      this.lightColorHex = hex;
      this.lightControl.setLightColor(hex);
    });

    this.controlPanel.onWaterChange((v) => {
      const prev = this.waterAmount;
      this.waterAmount = v;
      if (v > prev + 5 || v > 80) {
        this.growthEngine.advanceDay();
      }
    });

    this.controlPanel.onHorizontalAngleChange((v) => {
      this.horizontalAngle = v;
      this.lightControl.setSunAngle(v, this.verticalAngle);
    });

    this.controlPanel.onVerticalAngleChange((v) => {
      this.verticalAngle = v;
      this.lightControl.setSunAngle(this.horizontalAngle, v);
    });
  }

  private bindInteractionEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.plantRenderer.plantGroup.children, true);
      this.plantRenderer.handleHover(intersects[0] || null, e.clientX, e.clientY);
    });

    canvas.addEventListener('mouseleave', () => {
      this.plantRenderer.handleHover(null, 0, 0);
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.plantRenderer.plantGroup.children, true);
      const handled = this.plantRenderer.handleClick(intersects[0] || null, () => {
        this.growthEngine.advanceDay();
      });
      if (handled) {
        console.log('触发开花动画');
      }
    });
  }

  private bindResize(): void {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight * 0.8;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
  }

  private getBudStateText(state: number): string {
    const map: Record<number, string> = { 0: '未开', 1: '半开', 2: '全开', 3: '凋谢' };
    return map[Math.round(state)] || '未开';
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    this.growthEngine.update(delta, this.lightIntensity, this.waterAmount);
    this.plantRenderer.updatePlant(this.growthEngine.state);
    this.plantRenderer.animate();

    const progress = this.growthEngine.getGrowthProgress();
    const stage = this.growthEngine.getGrowthStage();
    const day = this.growthEngine.state.growthDay;
    this.controlPanel.updateProgress(progress, stage, day);
    this.controlPanel.updateInfo(
      this.growthEngine.state.leafCount,
      this.growthEngine.state.stemHeight,
      this.getBudStateText(this.growthEngine.state.budState)
    );

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
