import { ParticleEngine } from './engine';
import { Renderer } from './renderer';

export interface UIConfig {
  particleCount: number;
  particleSize: number;
  forceStrength: number;
  trailLength: number;
  backgroundColor: string;
}

export interface UICallbacks {
  onParticleCountChange: (count: number) => void;
  onParticleSizeChange: (size: number) => void;
  onForceStrengthChange: (strength: number) => void;
  onTrailLengthChange: (length: number) => void;
  onBackgroundColorChange: (color: string) => void;
  onReset: () => void;
}

export class UIPanel {
  private container: HTMLElement;
  private header: HTMLElement;
  private panel: HTMLElement;
  private collapseBtn: HTMLElement;
  private warningElement: HTMLElement;
  private particleCountSlider: HTMLInputElement | null = null;
  private particleSizeSlider: HTMLInputElement | null = null;
  private forceStrengthSlider: HTMLInputElement | null = null;
  private trailLengthSlider: HTMLInputElement | null = null;
  private backgroundColorInput: HTMLInputElement | null = null;
  private particleCountValue: HTMLElement | null = null;
  private particleSizeValue: HTMLElement | null = null;
  private forceStrengthValue: HTMLElement | null = null;
  private trailLengthValue: HTMLElement | null = null;
  private resetBtn: HTMLElement | null = null;
  private particleCountDisplay: HTMLElement | null = null;
  private callbacks: UICallbacks;
  private config: UIConfig;
  private isCollapsed: boolean = false;
  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private warningVisible: boolean = false;

  constructor(config: UIConfig, callbacks: UICallbacks) {
    this.config = { ...config };
    this.callbacks = callbacks;

    this.container = document.createElement('div');
    this.container.id = 'ui-panel-container';
    this.setupContainerStyles();

    this.header = document.createElement('div');
    this.setupHeaderStyles();

    this.warningElement = document.createElement('div');
    this.setupWarningStyles();

    this.panel = document.createElement('div');
    this.setupPanelStyles();

    this.collapseBtn = document.createElement('div');
    this.setupCollapseButton();

    this.buildUI();
    this.setupDrag();
    this.setupCollapse();
    this.checkResponsive();

    document.body.appendChild(this.container);

    window.addEventListener('resize', () => this.checkResponsive());
  }

  private setupContainerStyles(): void {
    this.container.style.cssText = `
      position: fixed;
      top: 120px;
      right: 20px;
      width: 250px;
      z-index: 1000;
      transition: all 0.15s ease-in-out;
      user-select: none;
    `;
  }

  private setupHeaderStyles(): void {
    this.header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: rgba(20, 20, 30, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px 12px 0 0;
      cursor: move;
      color: #00DDFF;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.15s ease-in-out;
    `;

    const title = document.createElement('span');
    title.textContent = 'ParticleFlow 控制';
    this.header.appendChild(title);
  }

  private setupCollapseButton(): void {
    this.collapseBtn.style.cssText = `
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.15s ease-in-out;
      color: #888;
      font-size: 18px;
      line-height: 1;
    `;
    this.collapseBtn.textContent = '−';
    this.collapseBtn.title = '收起';

    this.collapseBtn.addEventListener('mouseenter', () => {
      this.collapseBtn.style.background = 'rgba(255,255,255,0.1)';
      this.collapseBtn.style.color = '#00DDFF';
    });
    this.collapseBtn.addEventListener('mouseleave', () => {
      this.collapseBtn.style.background = 'transparent';
      this.collapseBtn.style.color = '#888';
    });

    this.header.appendChild(this.collapseBtn);
    this.container.appendChild(this.header);
  }

  private setupPanelStyles(): void {
    this.panel.style.cssText = `
      background: rgba(20, 20, 30, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-top: none;
      border-radius: 0 0 12px 12px;
      padding: 20px;
      overflow: hidden;
      transition: all 0.3s ease-out;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
      align-items: center;
    `;
    this.container.appendChild(this.panel);
    this.container.appendChild(this.warningElement);
  }

  private setupWarningStyles(): void {
    this.warningElement.style.cssText = `
      display: none;
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(255, 68, 68, 0.15);
      border: 1px solid rgba(255, 68, 68, 0.4);
      border-radius: 8px;
      color: #FF4444;
      font-size: 12px;
      text-align: center;
      animation: warningBlink 1s ease-in-out infinite;
    `;
    this.warningElement.textContent = '⚠ 性能警告：粒子数已自动降低';

    const style = document.createElement('style');
    style.textContent = `
      @keyframes warningBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }

  private buildUI(): void {
    this.addSliderControl(
      '粒子数量',
      'particleCount',
      500, 5000, 500,
      this.config.particleCount,
      (v) => {
        this.particleCountValue && (this.particleCountValue.textContent = String(v));
        this.callbacks.onParticleCountChange(v);
      },
      (el) => { this.particleCountSlider = el; },
      (el) => { this.particleCountValue = el; }
    );

    this.particleCountDisplay = document.createElement('div');
    this.particleCountDisplay.style.cssText = `
      grid-column: 2;
      color: #888;
      font-size: 10px;
      text-align: right;
      margin-top: -8px;
    `;
    this.particleCountDisplay.textContent = `当前: ${this.config.particleCount}`;
    this.panel.appendChild(this.particleCountDisplay);

    this.addSliderControl(
      '粒子大小',
      'particleSize',
      1, 6, 0.5,
      this.config.particleSize,
      (v) => {
        this.particleSizeValue && (this.particleSizeValue.textContent = v.toFixed(1));
        this.callbacks.onParticleSizeChange(v);
      },
      (el) => { this.particleSizeSlider = el; },
      (el) => { this.particleSizeValue = el; }
    );

    this.addSliderControl(
      '力场强度',
      'forceStrength',
      0.1, 1.0, 0.1,
      this.config.forceStrength,
      (v) => {
        this.forceStrengthValue && (this.forceStrengthValue.textContent = v.toFixed(1));
        this.callbacks.onForceStrengthChange(v);
      },
      (el) => { this.forceStrengthSlider = el; },
      (el) => { this.forceStrengthValue = el; }
    );

    this.addSliderControl(
      '拖尾长度',
      'trailLength',
      0, 15, 1,
      this.config.trailLength,
      (v) => {
        this.trailLengthValue && (this.trailLengthValue.textContent = String(v));
        this.callbacks.onTrailLengthChange(v);
      },
      (el) => { this.trailLengthSlider = el; },
      (el) => { this.trailLengthValue = el; }
    );

    this.addColorControl(
      '背景颜色',
      this.config.backgroundColor,
      (color) => this.callbacks.onBackgroundColorChange(color),
      (el) => { this.backgroundColorInput = el; }
    );

    this.addResetButton();
  }

  private addSliderControl(
    label: string,
    name: string,
    min: number, max: number, step: number,
    value: number,
    onChange: (v: number) => void,
    sliderRef: (el: HTMLInputElement) => void,
    valueRef: (el: HTMLElement) => void
  ): void {
    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
      color: #CCC;
      font-size: 12px;
      text-align: left;
    `;
    labelEl.textContent = label;

    const controlWrap = document.createElement('div');
    controlWrap.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    slider.name = name;

    this.applySliderStyles(slider);

    slider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      onChange(val);
    });

    const valueDisplay = document.createElement('span');
    valueDisplay.style.cssText = `
      color: #00DDFF;
      font-size: 11px;
      font-family: monospace;
      text-align: right;
    `;
    valueDisplay.textContent = step < 1 ? value.toFixed(1) : String(value);

    controlWrap.appendChild(slider);
    controlWrap.appendChild(valueDisplay);

    this.panel.appendChild(labelEl);
    this.panel.appendChild(controlWrap);

    sliderRef(slider);
    valueRef(valueDisplay);
  }

  private applySliderStyles(slider: HTMLInputElement): void {
    slider.style.cssText = `
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      background: #2A2A3A;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    `;

    const style = document.createElement('style');
    const uniqueClass = `slider-${Math.random().toString(36).slice(2, 9)}`;
    slider.classList.add(uniqueClass);
    style.textContent = `
      .${uniqueClass}::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        background: #00DDFF;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #0A0A1A;
        transition: all 0.15s ease-in-out;
        box-shadow: 0 0 8px rgba(0, 221, 255, 0.4);
      }
      .${uniqueClass}::-webkit-slider-thumb:hover {
        transform: scale(1.15);
        box-shadow: 0 0 12px rgba(0, 221, 255, 0.6);
      }
      .${uniqueClass}::-moz-range-thumb {
        width: 14px;
        height: 14px;
        background: #00DDFF;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #0A0A1A;
        transition: all 0.15s ease-in-out;
        box-shadow: 0 0 8px rgba(0, 221, 255, 0.4);
      }
      .${uniqueClass}::-moz-range-thumb:hover {
        transform: scale(1.15);
        box-shadow: 0 0 12px rgba(0, 221, 255, 0.6);
      }
    `;
    document.head.appendChild(style);
  }

  private addColorControl(
    label: string,
    value: string,
    onChange: (color: string) => void,
    inputRef: (el: HTMLInputElement) => void
  ): void {
    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
      color: #CCC;
      font-size: 12px;
      text-align: left;
    `;
    labelEl.textContent = label;

    const controlWrap = document.createElement('div');
    controlWrap.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    `;

    const colorDisplay = document.createElement('div');
    colorDisplay.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 4px;
      background: ${value};
      border: 1px solid rgba(255,255,255,0.2);
      transition: all 0.15s ease-in-out;
    `;

    const input = document.createElement('input');
    input.type = 'color';
    input.value = value;
    input.style.cssText = `
      width: 30px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.15s ease-in-out;
    `;

    input.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      colorDisplay.style.background = color;
      onChange(color);
    });

    controlWrap.appendChild(colorDisplay);
    controlWrap.appendChild(input);

    this.panel.appendChild(labelEl);
    this.panel.appendChild(controlWrap);

    inputRef(input);
  }

  private addResetButton(): void {
    const spacer = document.createElement('div');
    spacer.style.gridColumn = '1 / -1';
    spacer.style.height = '4px';
    this.panel.appendChild(spacer);

    this.resetBtn = document.createElement('button');
    this.resetBtn.textContent = '重置粒子';
    this.resetBtn.style.cssText = `
      grid-column: 1 / -1;
      padding: 10px 16px;
      background: linear-gradient(135deg, #00DDFF22, #FF44AA22);
      border: 1px solid rgba(0, 221, 255, 0.4);
      border-radius: 8px;
      color: #00DDFF;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      margin-top: 8px;
    `;

    this.resetBtn.addEventListener('mouseenter', () => {
      if (this.resetBtn) {
        this.resetBtn.style.background = 'linear-gradient(135deg, #00DDFF44, #FF44AA44)';
        this.resetBtn.style.borderColor = '#00DDFF';
        this.resetBtn.style.transform = 'translateY(-1px)';
        this.resetBtn.style.boxShadow = '0 4px 12px rgba(0, 221, 255, 0.3)';
      }
    });

    this.resetBtn.addEventListener('mouseleave', () => {
      if (this.resetBtn) {
        this.resetBtn.style.background = 'linear-gradient(135deg, #00DDFF22, #FF44AA22)';
        this.resetBtn.style.borderColor = 'rgba(0, 221, 255, 0.4)';
        this.resetBtn.style.transform = 'translateY(0)';
        this.resetBtn.style.boxShadow = 'none';
      }
    });

    this.resetBtn.addEventListener('click', () => {
      this.callbacks.onReset();
      if (this.particleCountSlider) {
        this.particleCountSlider.value = String(this.config.particleCount);
        this.particleCountValue && (this.particleCountValue.textContent = String(this.config.particleCount));
      }
    });

    this.panel.appendChild(this.resetBtn);
  }

  private setupDrag(): void {
    this.header.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement) === this.collapseBtn) return;
      this.isDragging = true;
      const rect = this.container.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      this.container.style.transition = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      let x = e.clientX - this.dragOffsetX;
      let y = e.clientY - this.dragOffsetY;

      x = Math.max(0, Math.min(window.innerWidth - this.container.offsetWidth, x));
      y = Math.max(0, Math.min(window.innerHeight - this.container.offsetHeight, y));

      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;
      this.container.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.container.style.transition = 'all 0.15s ease-in-out';
    });
  }

  private setupCollapse(): void {
    this.collapseBtn.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      if (this.isCollapsed) {
        this.panel.style.maxHeight = '0';
        this.panel.style.paddingTop = '0';
        this.panel.style.paddingBottom = '0';
        this.panel.style.border = 'none';
        this.warningElement.style.display = 'none';
        this.header.style.borderRadius = '12px';
        this.header.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        this.collapseBtn.textContent = '+';
        this.collapseBtn.title = '展开';
      } else {
        this.panel.style.maxHeight = '600px';
        this.panel.style.paddingTop = '20px';
        this.panel.style.paddingBottom = '20px';
        this.panel.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        this.panel.style.borderTop = 'none';
        this.warningElement.style.display = this.warningVisible ? 'block' : 'none';
        this.header.style.borderRadius = '12px 12px 0 0';
        this.header.style.borderBottom = 'none';
        this.collapseBtn.textContent = '−';
        this.collapseBtn.title = '收起';
      }
    });
  }

  private checkResponsive(): void {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.container.style.top = 'auto';
      this.container.style.right = '0';
      this.container.style.left = '0';
      this.container.style.bottom = '0';
      this.container.style.width = '100%';
      this.container.style.borderRadius = '0';
      this.panel.style.gridTemplateColumns = '1fr';
      this.panel.style.padding = '16px';
      this.header.style.padding = '12px 16px';
    } else {
      if (!this.isDragging) {
        this.container.style.top = '120px';
        this.container.style.right = '20px';
        this.container.style.left = 'auto';
        this.container.style.bottom = 'auto';
        this.container.style.width = '250px';
      }
      this.panel.style.gridTemplateColumns = '1fr 1fr';
    }
  }

  public update(particleCount: number, performanceWarning: boolean): void {
    if (this.particleCountDisplay) {
      this.particleCountDisplay.textContent = `当前: ${particleCount}`;
    }

    this.warningVisible = performanceWarning;
    if (performanceWarning && !this.isCollapsed) {
      this.warningElement.style.display = 'block';
    } else if (!performanceWarning) {
      this.warningElement.style.display = 'none';
    }
  }

  public updateParticleCountDisplay(count: number): void {
    if (this.particleCountDisplay) {
      this.particleCountDisplay.textContent = `当前: ${count}`;
    }
  }
}
