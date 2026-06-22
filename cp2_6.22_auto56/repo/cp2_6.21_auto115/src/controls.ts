import { ParticleParams } from './particleSystem';

export interface ControlCallbacks {
  onParamChange: (params: Partial<ParticleParams>) => void;
  onTogglePanel?: (visible: boolean) => void;
}

export class ControlPanel {
  private container: HTMLDivElement;
  private toggleButton: HTMLButtonElement;
  private panel: HTMLDivElement;
  private visible: boolean = true;
  private callbacks: ControlCallbacks;
  
  private viscositySlider: HTMLInputElement;
  private viscosityInput: HTMLInputElement;
  private diffusionSlider: HTMLInputElement;
  private diffusionInput: HTMLInputElement;
  private forceSlider: HTMLInputElement;
  private forceInput: HTMLInputElement;

  constructor(callbacks: ControlCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.toggleButton = document.createElement('button');
    this.panel = document.createElement('div');
    
    this.viscositySlider = document.createElement('input');
    this.viscosityInput = document.createElement('input');
    this.diffusionSlider = document.createElement('input');
    this.diffusionInput = document.createElement('input');
    this.forceSlider = document.createElement('input');
    this.forceInput = document.createElement('input');

    this.createPanel();
    this.setupEventListeners();
  }

  private createPanel(): void {
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      height: 100%;
      pointer-events: none;
      z-index: 100;
    `;

    this.toggleButton.innerHTML = '👁';
    this.toggleButton.title = '显示/隐藏控制面板';
    this.toggleButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.3s ease;
    `;
    this.toggleButton.addEventListener('mouseenter', () => {
      this.toggleButton.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    this.toggleButton.addEventListener('mouseleave', () => {
      this.toggleButton.style.background = 'rgba(255, 255, 255, 0.1)';
    });

    this.panel.style.cssText = `
      position: absolute;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      width: 220px;
      padding: 24px 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      pointer-events: auto;
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    const title = document.createElement('div');
    title.textContent = '控制面板';
    title.style.cssText = `
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      text-align: center;
      letter-spacing: 1px;
    `;
    this.panel.appendChild(title);

    this.viscositySlider = this.createSlider('viscosity', 0.1, 10.0, 0.1, 2.0);
    this.viscosityInput = this.createNumberInput('viscosity-input', 0.1, 10.0, 0.1, 2.0);
    this.panel.appendChild(this.createControlGroup('粘度', this.viscositySlider, this.viscosityInput));

    this.diffusionSlider = this.createSlider('diffusion', 0.01, 0.5, 0.01, 0.1);
    this.diffusionInput = this.createNumberInput('diffusion-input', 0.01, 0.5, 0.01, 0.1);
    this.panel.appendChild(this.createControlGroup('扩散率', this.diffusionSlider, this.diffusionInput));

    this.forceSlider = this.createSlider('force', 0.0, 5.0, 0.1, 1.0);
    this.forceInput = this.createNumberInput('force-input', 0.0, 5.0, 0.1, 1.0);
    this.panel.appendChild(this.createControlGroup('力场强度', this.forceSlider, this.forceInput));

    const hint = document.createElement('div');
    hint.innerHTML = '💡 点击画面可产生排斥力';
    hint.style.cssText = `
      margin-top: 20px;
      padding: 10px;
      background: rgba(78, 78, 128, 0.3);
      border-radius: 8px;
      color: #aaaacc;
      font-size: 12px;
      text-align: center;
    `;
    this.panel.appendChild(hint);

    this.container.appendChild(this.toggleButton);
    this.container.appendChild(this.panel);
    document.body.appendChild(this.container);

    this.applySliderStyles();
  }

  private createControlGroup(label: string, slider: HTMLInputElement, input: HTMLInputElement): HTMLDivElement {
    const group = document.createElement('div');
    group.style.cssText = `
      margin-bottom: 20px;
    `;

    const labelRow = document.createElement('div');
    labelRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: #ddd;
      font-size: 14px;
      font-weight: 500;
    `;

    labelRow.appendChild(labelEl);
    labelRow.appendChild(input);
    group.appendChild(labelRow);
    group.appendChild(slider);

    return group;
  }

  private createSlider(id: string, min: number, max: number, step: number, value: number): HTMLInputElement {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = value.toString();
    slider.style.cssText = `
      width: 100%;
      height: 6px;
      border-radius: 3px;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
    `;
    return slider;
  }

  private createNumberInput(id: string, min: number, max: number, step: number, value: number): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.value = value.toString();
    input.style.cssText = `
      width: 70px;
      height: 28px;
      padding: 0 8px;
      border: none;
      border-radius: 8px;
      background: #2a2a4a;
      color: #fff;
      font-size: 13px;
      text-align: right;
      outline: none;
      -moz-appearance: textfield;
    `;
    return input;
  }

  private applySliderStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      input[type="range"] {
        background: transparent;
      }
      input[type="range"]::-webkit-slider-runnable-track {
        height: 6px;
        background: #4a4a6a;
        border-radius: 3px;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: #8e8eff;
        border-radius: 50%;
        cursor: pointer;
        margin-top: -6px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 10px rgba(142, 142, 255, 0.5);
      }
      input[type="range"]::-moz-range-track {
        height: 6px;
        background: #4a4a6a;
        border-radius: 3px;
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: #8e8eff;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      input[type="range"]::-moz-range-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 10px rgba(142, 142, 255, 0.5);
      }
      input[type="number"]::-webkit-inner-spin-button,
      input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    `;
    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    this.toggleButton.addEventListener('click', () => this.togglePanel());

    const syncSliderAndInput = (
      slider: HTMLInputElement,
      input: HTMLInputElement,
      paramKey: keyof ParticleParams
    ) => {
      slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        input.value = value.toFixed(this.getDecimalPlaces(slider.step));
        this.emitChange(paramKey, value);
      });

      input.addEventListener('input', () => {
        let value = parseFloat(input.value);
        if (isNaN(value)) return;
        value = Math.max(parseFloat(input.min), Math.min(parseFloat(input.max), value));
        slider.value = value.toString();
        this.emitChange(paramKey, value);
      });

      input.addEventListener('blur', () => {
        let value = parseFloat(input.value);
        if (isNaN(value)) value = parseFloat(input.min);
        value = Math.max(parseFloat(input.min), Math.min(parseFloat(input.max), value));
        input.value = value.toFixed(this.getDecimalPlaces(input.step));
      });
    };

    syncSliderAndInput(this.viscositySlider, this.viscosityInput, 'viscosity');
    syncSliderAndInput(this.diffusionSlider, this.diffusionInput, 'diffusionRate');
    syncSliderAndInput(this.forceSlider, this.forceInput, 'forceFieldStrength');
  }

  private getDecimalPlaces(step: string): number {
    const parts = step.split('.');
    return parts.length > 1 ? parts[1].length : 0;
  }

  private emitChange(key: keyof ParticleParams, value: number): void {
    this.callbacks.onParamChange({ [key]: value });
  }

  private togglePanel(): void {
    this.visible = !this.visible;
    if (this.visible) {
      this.panel.style.opacity = '1';
      this.panel.style.transform = 'translateY(-50%) translateX(0)';
      this.toggleButton.innerHTML = '👁';
    } else {
      this.panel.style.opacity = '0';
      this.panel.style.transform = 'translateY(-50%) translateX(20px)';
      this.toggleButton.innerHTML = '👁‍🗨';
    }
    this.callbacks.onTogglePanel?.(this.visible);
  }

  isVisible(): boolean {
    return this.visible;
  }

  setParams(params: ParticleParams): void {
    this.viscositySlider.value = params.viscosity.toString();
    this.viscosityInput.value = params.viscosity.toFixed(1);
    this.diffusionSlider.value = params.diffusionRate.toString();
    this.diffusionInput.value = params.diffusionRate.toFixed(2);
    this.forceSlider.value = params.forceFieldStrength.toString();
    this.forceInput.value = params.forceFieldStrength.toFixed(1);
  }
}

export class FPSCounter {
  private element: HTMLDivElement;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 60;
  private lowFPSTime: number = 0;

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'fps-counter';
    this.element.style.cssText = `
      position: fixed;
      left: 20px;
      bottom: 20px;
      color: #00ff88;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: bold;
      text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
      z-index: 100;
      pointer-events: none;
    `;
    this.element.textContent = 'FPS: 60';
    document.body.appendChild(this.element);
  }

  update(): number {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = now;
      this.element.textContent = `FPS: ${this.fps}`;
    }

    return this.fps;
  }

  getFPS(): number {
    return this.fps;
  }

  isLowFPS(threshold: number = 55): boolean {
    if (this.fps < threshold) {
      this.lowFPSTime += 16;
      return this.lowFPSTime > 1000;
    } else {
      this.lowFPSTime = Math.max(0, this.lowFPSTime - 16);
      return false;
    }
  }

  setColor(color: string): void {
    this.element.style.color = color;
  }
}
