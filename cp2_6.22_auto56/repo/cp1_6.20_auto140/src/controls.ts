import { NebulaParams, ColorMode, DistributionShape } from './nebulaSystem';

export interface ControlCallbacks {
  onParamsChange: (params: Partial<NebulaParams>) => void;
  onPreset: (presetName: string) => void;
  onResetCamera: () => void;
  onMovementSpeedChange: (speed: number) => void;
  onBackgroundColorChange: (color: string) => void;
}

export interface PresetDefinition {
  name: string;
  label: string;
  params: Partial<NebulaParams>;
}

export const PRESETS: PresetDefinition[] = [
  {
    name: 'nebulaRose',
    label: '星云玫瑰',
    params: {
      particleCount: 20000,
      particleSize: 0.8,
      spreadRadius: 25,
      rotationSpeed: 0.5,
      colorMode: 'dual',
      distribution: 'ellipsoid',
      primaryColor: '#ff6b9d',
      secondaryColor: '#c44dff',
      tertiaryColor: '#ffcc00',
      backgroundColor: '#140a20',
    },
  },
  {
    name: 'spiralGalaxy',
    label: '螺旋星系',
    params: {
      particleCount: 40000,
      particleSize: 0.5,
      spreadRadius: 40,
      rotationSpeed: 1.2,
      colorMode: 'triple',
      distribution: 'ellipsoid',
      primaryColor: '#ffffff',
      secondaryColor: '#4fc3f7',
      tertiaryColor: '#ffb74d',
      backgroundColor: '#0a0a14',
    },
  },
  {
    name: 'auroraNebula',
    label: '极光星云',
    params: {
      particleCount: 25000,
      particleSize: 1.0,
      spreadRadius: 30,
      rotationSpeed: 0.3,
      colorMode: 'dual',
      distribution: 'sphere',
      primaryColor: '#00ff88',
      secondaryColor: '#00bcd4',
      tertiaryColor: '#7c4dff',
      backgroundColor: '#0a1628',
    },
  },
  {
    name: 'starDust',
    label: '星空碎片',
    params: {
      particleCount: 50000,
      particleSize: 0.3,
      spreadRadius: 45,
      rotationSpeed: 0.8,
      colorMode: 'single',
      distribution: 'sphere',
      primaryColor: '#ffffff',
      secondaryColor: '#aaaaaa',
      tertiaryColor: '#666666',
      backgroundColor: '#0a0a14',
    },
  },
];

const BACKGROUND_OPTIONS: { value: string; label: string }[] = [
  { value: '#0a0a14', label: '深空黑' },
  { value: '#0a1628', label: '深蓝' },
  { value: '#140a20', label: '深紫' },
];

export class ControlsUI {
  private container: HTMLElement;
  private callbacks: ControlCallbacks;
  private params: NebulaParams;
  private movementSpeed: number = 2.0;
  private panelCollapsed: boolean = false;

  private sliderParticleCount!: HTMLInputElement;
  private sliderParticleSize!: HTMLInputElement;
  private sliderSpreadRadius!: HTMLInputElement;
  private sliderRotationSpeed!: HTMLInputElement;
  private sliderMovementSpeed!: HTMLInputElement;
  private selectColorMode!: HTMLSelectElement;
  private radioDistributionSphere!: HTMLInputElement;
  private radioDistributionEllipsoid!: HTMLInputElement;
  private selectBackground!: HTMLSelectElement;

  constructor(container: HTMLElement, callbacks: ControlCallbacks, initialParams: NebulaParams) {
    this.container = container;
    this.callbacks = callbacks;
    this.params = { ...initialParams };
    this.buildUI();
    this.bindEvents();
  }

  private buildUI(): void {
    this.container.innerHTML = `
      <div class="panel-header">
        <div class="panel-title">星云发生器</div>
        <button class="collapse-btn" id="collapse-btn" title="收起面板">×</button>
      </div>

      <div class="control-group">
        <div class="group-title">预设风格</div>
        <div class="preset-buttons">
          ${PRESETS.map((p) => `<button class="preset-btn" data-preset="${p.name}">${p.label}</button>`).join('')}
        </div>
      </div>

      <div class="control-group">
        <div class="group-title">粒子参数</div>
        <div class="slider-container">
          <div class="slider-label">
            <span>粒子数量</span>
            <span class="slider-value" id="val-particle-count">${this.params.particleCount}</span>
          </div>
          <input type="range" id="slider-particle-count" min="1000" max="50000" step="500" value="${this.params.particleCount}" />
        </div>
        <div class="slider-container">
          <div class="slider-label">
            <span>粒子大小</span>
            <span class="slider-value" id="val-particle-size">${this.params.particleSize.toFixed(1)}</span>
          </div>
          <input type="range" id="slider-particle-size" min="0.1" max="5.0" step="0.1" value="${this.params.particleSize}" />
        </div>
        <div class="slider-container">
          <div class="slider-label">
            <span>扩散半径</span>
            <span class="slider-value" id="val-spread-radius">${this.params.spreadRadius}</span>
          </div>
          <input type="range" id="slider-spread-radius" min="5" max="50" step="1" value="${this.params.spreadRadius}" />
        </div>
        <div class="slider-container">
          <div class="slider-label">
            <span>旋转速度</span>
            <span class="slider-value" id="val-rotation-speed">${this.params.rotationSpeed.toFixed(1)}</span>
          </div>
          <input type="range" id="slider-rotation-speed" min="0" max="5" step="0.1" value="${this.params.rotationSpeed}" />
        </div>
      </div>

      <div class="control-group">
        <div class="group-title">颜色参数</div>
        <div class="select-container">
          <label>颜色分布模式</label>
          <select id="select-color-mode">
            <option value="single" ${this.params.colorMode === 'single' ? 'selected' : ''}>单一色</option>
            <option value="dual" ${this.params.colorMode === 'dual' ? 'selected' : ''}>双色渐变</option>
            <option value="triple" ${this.params.colorMode === 'triple' ? 'selected' : ''}>三色渐变</option>
          </select>
        </div>
        <div class="radio-container">
          <span>分布形状</span>
          <div class="radio-options">
            <label>
              <input type="radio" name="distribution" value="sphere" ${this.params.distribution === 'sphere' ? 'checked' : ''} />
              <span>球形</span>
            </label>
            <label>
              <input type="radio" name="distribution" value="ellipsoid" ${this.params.distribution === 'ellipsoid' ? 'checked' : ''} />
              <span>椭球形</span>
            </label>
          </div>
        </div>
        <div class="select-container">
          <label>背景色</label>
          <select id="select-background">
            ${BACKGROUND_OPTIONS.map((opt) => `<option value="${opt.value}" ${this.params.backgroundColor === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="control-group">
        <div class="group-title">控制参数</div>
        <div class="slider-container">
          <div class="slider-label">
            <span>漫游速度</span>
            <span class="slider-value" id="val-movement-speed">${this.movementSpeed.toFixed(1)}</span>
          </div>
          <input type="range" id="slider-movement-speed" min="0.5" max="5.0" step="0.1" value="${this.movementSpeed}" />
        </div>
        <button class="action-btn" id="btn-reset-camera">重置视角</button>
      </div>

      <div class="hint-text">
        <p>
          <kbd>鼠标拖拽</kbd> 旋转视角<br/>
          <kbd>滚轮</kbd> 缩放距离<br/>
          <kbd>W A S D</kbd> 漫游场景
        </p>
      </div>
    `;

    this.sliderParticleCount = document.getElementById('slider-particle-count') as HTMLInputElement;
    this.sliderParticleSize = document.getElementById('slider-particle-size') as HTMLInputElement;
    this.sliderSpreadRadius = document.getElementById('slider-spread-radius') as HTMLInputElement;
    this.sliderRotationSpeed = document.getElementById('slider-rotation-speed') as HTMLInputElement;
    this.sliderMovementSpeed = document.getElementById('slider-movement-speed') as HTMLInputElement;
    this.selectColorMode = document.getElementById('select-color-mode') as HTMLSelectElement;
    this.radioDistributionSphere = document.querySelector('input[name="distribution"][value="sphere"]') as HTMLInputElement;
    this.radioDistributionEllipsoid = document.querySelector('input[name="distribution"][value="ellipsoid"]') as HTMLInputElement;
    this.selectBackground = document.getElementById('select-background') as HTMLSelectElement;
  }

  private bindEvents(): void {
    this.sliderParticleCount.addEventListener('input', () => {
      const val = parseInt(this.sliderParticleCount.value);
      this.params.particleCount = val;
      this.updateSliderValue('val-particle-count', val.toString());
      this.callbacks.onParamsChange({ particleCount: val });
    });

    this.sliderParticleSize.addEventListener('input', () => {
      const val = parseFloat(this.sliderParticleSize.value);
      this.params.particleSize = val;
      this.updateSliderValue('val-particle-size', val.toFixed(1));
      this.callbacks.onParamsChange({ particleSize: val });
    });

    this.sliderSpreadRadius.addEventListener('input', () => {
      const val = parseInt(this.sliderSpreadRadius.value);
      this.params.spreadRadius = val;
      this.updateSliderValue('val-spread-radius', val.toString());
      this.callbacks.onParamsChange({ spreadRadius: val });
    });

    this.sliderRotationSpeed.addEventListener('input', () => {
      const val = parseFloat(this.sliderRotationSpeed.value);
      this.params.rotationSpeed = val;
      this.updateSliderValue('val-rotation-speed', val.toFixed(1));
      this.callbacks.onParamsChange({ rotationSpeed: val });
    });

    this.sliderMovementSpeed.addEventListener('input', () => {
      const val = parseFloat(this.sliderMovementSpeed.value);
      this.movementSpeed = val;
      this.updateSliderValue('val-movement-speed', val.toFixed(1));
      this.callbacks.onMovementSpeedChange(val);
    });

    this.selectColorMode.addEventListener('change', () => {
      const val = this.selectColorMode.value as ColorMode;
      this.params.colorMode = val;
      this.callbacks.onParamsChange({ colorMode: val });
    });

    this.radioDistributionSphere.addEventListener('change', () => {
      if (this.radioDistributionSphere.checked) {
        this.params.distribution = 'sphere';
        this.callbacks.onParamsChange({ distribution: 'sphere' as DistributionShape });
      }
    });

    this.radioDistributionEllipsoid.addEventListener('change', () => {
      if (this.radioDistributionEllipsoid.checked) {
        this.params.distribution = 'ellipsoid';
        this.callbacks.onParamsChange({ distribution: 'ellipsoid' as DistributionShape });
      }
    });

    this.selectBackground.addEventListener('change', () => {
      const val = this.selectBackground.value;
      this.params.backgroundColor = val;
      this.callbacks.onBackgroundColorChange(val);
    });

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetName = (btn as HTMLElement).dataset.preset;
        if (presetName) {
          this.callbacks.onPreset(presetName);
        }
      });
    });

    document.getElementById('btn-reset-camera')?.addEventListener('click', () => {
      this.callbacks.onResetCamera();
    });

    document.getElementById('collapse-btn')?.addEventListener('click', () => {
      this.togglePanel();
    });

    document.getElementById('toggle-panel-btn')?.addEventListener('click', () => {
      this.togglePanel();
    });
  }

  private updateSliderValue(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  }

  public togglePanel(): void {
    this.panelCollapsed = !this.panelCollapsed;
    const container = document.getElementById('controls-container');
    const toggleBtn = document.getElementById('toggle-panel-btn');
    if (container) {
      container.classList.toggle('collapsed', this.panelCollapsed);
    }
    if (toggleBtn) {
      toggleBtn.textContent = this.panelCollapsed ? '▶' : '◀';
    }
  }

  public setParams(params: NebulaParams): void {
    this.params = { ...params };

    this.sliderParticleCount.value = params.particleCount.toString();
    this.updateSliderValue('val-particle-count', params.particleCount.toString());

    this.sliderParticleSize.value = params.particleSize.toString();
    this.updateSliderValue('val-particle-size', params.particleSize.toFixed(1));

    this.sliderSpreadRadius.value = params.spreadRadius.toString();
    this.updateSliderValue('val-spread-radius', params.spreadRadius.toString());

    this.sliderRotationSpeed.value = params.rotationSpeed.toString();
    this.updateSliderValue('val-rotation-speed', params.rotationSpeed.toFixed(1));

    this.selectColorMode.value = params.colorMode;

    if (params.distribution === 'sphere') {
      this.radioDistributionSphere.checked = true;
    } else {
      this.radioDistributionEllipsoid.checked = true;
    }

    this.selectBackground.value = params.backgroundColor;
  }

  public getMovementSpeed(): number {
    return this.movementSpeed;
  }
}
