import { PhysicsEngine } from './physicsEngine';

interface SliderConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  setter: (value: number) => void;
}

export class UIController {
  private physicsEngine: PhysicsEngine;
  private uiLayer: HTMLElement;

  private controlPanel: HTMLElement | null = null;
  private performancePanel: HTMLElement | null = null;
  private fpsElement: HTMLElement | null = null;
  private countElement: HTMLElement | null = null;
  private upsElement: HTMLElement | null = null;

  private readonly DEFAULT_ROTATION = 1.0;
  private readonly DEFAULT_GRAVITY = 2.0;
  private readonly DEFAULT_FLATNESS = 0.5;

  constructor(physicsEngine: PhysicsEngine) {
    this.physicsEngine = physicsEngine;
    this.uiLayer = document.getElementById('ui-layer')!;
    this.createControlPanel();
    this.createPerformancePanel();
  }

  private createControlPanel(): void {
    this.controlPanel = document.createElement('div');
    this.controlPanel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      width: 280px;
      background: #1e293be0;
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('div');
    title.textContent = '星系演化控制';
    title.style.cssText = `
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    `;
    this.controlPanel.appendChild(title);

    const sliders: SliderConfig[] = [
      {
        key: 'rotation',
        label: '旋转速度',
        min: 0.1,
        max: 2.0,
        step: 0.1,
        defaultValue: this.DEFAULT_ROTATION,
        setter: (v) => this.physicsEngine.setRotationSpeed(v)
      },
      {
        key: 'gravity',
        label: '引力强度',
        min: 0.5,
        max: 5.0,
        step: 0.1,
        defaultValue: this.DEFAULT_GRAVITY,
        setter: (v) => this.physicsEngine.setGravityStrength(v)
      },
      {
        key: 'flatness',
        label: '星系扁平度',
        min: 0.1,
        max: 1.0,
        step: 0.05,
        defaultValue: this.DEFAULT_FLATNESS,
        setter: (v) => this.physicsEngine.setFlatness(v)
      }
    ];

    sliders.forEach((config) => {
      this.controlPanel!.appendChild(this.createSlider(config));
    });

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '重置参数';
    resetBtn.style.cssText = `
      width: 100%;
      height: 40px;
      background: #3b82f6;
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 20px;
      transition: background 0.2s, transform 0.1s;
      font-family: inherit;
    `;

    resetBtn.addEventListener('mouseenter', () => {
      resetBtn.style.background = '#2563eb';
    });
    resetBtn.addEventListener('mouseleave', () => {
      resetBtn.style.background = '#3b82f6';
    });
    resetBtn.addEventListener('mousedown', () => {
      resetBtn.style.transform = 'scale(0.95)';
    });
    resetBtn.addEventListener('mouseup', () => {
      resetBtn.style.transform = 'scale(1)';
    });
    resetBtn.addEventListener('click', () => {
      this.physicsEngine.reset();
      sliders.forEach((config) => {
        const input = document.getElementById(`slider-${config.key}`) as HTMLInputElement;
        const valueDisplay = document.getElementById(`value-${config.key}`);
        if (input) input.value = String(config.defaultValue);
        if (valueDisplay) valueDisplay.textContent = config.defaultValue.toFixed(2);
      });
    });

    this.controlPanel.appendChild(resetBtn);

    const hint = document.createElement('div');
    hint.textContent = '提示：鼠标拖拽旋转 · 滚轮缩放 · 空格键复位';
    hint.style.cssText = `
      font-size: 11px;
      color: #64748b;
      margin-top: 16px;
      line-height: 1.6;
      text-align: center;
    `;
    this.controlPanel.appendChild(hint);

    this.uiLayer.appendChild(this.controlPanel);
  }

  private createSlider(config: SliderConfig): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '16px';

    const labelRow = document.createElement('div');
    labelRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;

    const label = document.createElement('span');
    label.textContent = config.label;
    label.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #cbd5e1;
    `;

    const valueDisplay = document.createElement('span');
    valueDisplay.id = `value-${config.key}`;
    valueDisplay.textContent = config.defaultValue.toFixed(2);
    valueDisplay.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #60a5fa;
      font-family: monospace;
    `;

    labelRow.appendChild(label);
    labelRow.appendChild(valueDisplay);
    wrapper.appendChild(labelRow);

    const sliderContainer = document.createElement('div');
    sliderContainer.style.position = 'relative';
    sliderContainer.style.height = '20px';
    sliderContainer.style.display = 'flex';
    sliderContainer.style.alignItems = 'center';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = `slider-${config.key}`;
    slider.min = String(config.min);
    slider.max = String(config.max);
    slider.step = String(config.step);
    slider.value = String(config.defaultValue);

    slider.style.cssText = `
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      background: #475569;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    `;

    const style = document.createElement('style');
    style.textContent = `
      #slider-${config.key}::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: #3b82f6;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.2s;
        border: none;
      }
      #slider-${config.key}::-webkit-slider-thumb:hover,
      #slider-${config.key}:active::-webkit-slider-thumb {
        background: #60a5fa;
      }
      #slider-${config.key}::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #3b82f6;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.2s;
        border: none;
      }
      #slider-${config.key}::-moz-range-thumb:hover {
        background: #60a5fa;
      }
    `;
    document.head.appendChild(style);

    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      config.setter(value);
      valueDisplay.textContent = value.toFixed(2);
    });

    sliderContainer.appendChild(slider);
    wrapper.appendChild(sliderContainer);

    return wrapper;
  }

  private createPerformancePanel(): void {
    this.performancePanel = document.createElement('div');
    this.performancePanel.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: #1e293bcc;
      border-radius: 8px;
      padding: 12px 16px;
      font-family: monospace;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.8;
      backdrop-filter: blur(4px);
      border: 1px solid transparent;
      transition: border-color 0.3s;
      min-width: 160px;
    `;

    this.fpsElement = document.createElement('div');
    this.fpsElement.textContent = 'FPS: --';

    this.countElement = document.createElement('div');
    this.countElement.textContent = 'Particles: --';

    this.upsElement = document.createElement('div');
    this.upsElement.textContent = 'Updates/s: --';

    this.performancePanel.appendChild(this.fpsElement);
    this.performancePanel.appendChild(this.countElement);
    this.performancePanel.appendChild(this.upsElement);

    this.uiLayer.appendChild(this.performancePanel);
  }

  public updatePerformance(fps: number, particleCount: number, updatesPerSec: number): void {
    if (this.fpsElement) {
      this.fpsElement.textContent = `FPS: ${fps.toFixed(0)}`;
    }
    if (this.countElement) {
      this.countElement.textContent = `Particles: ${particleCount}`;
    }
    if (this.upsElement) {
      this.upsElement.textContent = `Updates/s: ${updatesPerSec.toFixed(0)}`;
    }
    if (this.performancePanel) {
      if (fps < 30) {
        this.performancePanel.style.borderColor = '#ef4444';
      } else {
        this.performancePanel.style.borderColor = 'transparent';
      }
    }
  }
}
