import type { ThemePreset } from './nebula';

export interface ControlCallbacks {
  onColorChange: (start: string, end: string) => void;
  onDensityChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
  onThemeChange: (theme: ThemePreset) => void;
  onFullscreen: () => void;
}

const THEMES: ThemePreset[] = [
  { name: '星云', colorStart: '#6366f1', colorEnd: '#ec4899', baseDensity: 0.7, baseSpeed: 0.4 },
  { name: '极光', colorStart: '#10b981', colorEnd: '#3b82f6', baseDensity: 0.6, baseSpeed: 0.3 },
  { name: '火焰', colorStart: '#f59e0b', colorEnd: '#ef4444', baseDensity: 0.8, baseSpeed: 0.6 },
  { name: '深海', colorStart: '#0891b2', colorEnd: '#1e40af', baseDensity: 0.5, baseSpeed: 0.2 },
];

export class UIControls {
  private container: HTMLElement;
  private callbacks: ControlCallbacks;
  private panel: HTMLDivElement;
  private startColorInput: HTMLInputElement;
  private endColorInput: HTMLInputElement;
  private densitySlider: HTMLInputElement;
  private densityValue: HTMLSpanElement;
  private speedSlider: HTMLInputElement;
  private speedValue: HTMLSpanElement;
  private themeButtons: HTMLButtonElement[] = [];
  private fullscreenButton: HTMLButtonElement;
  private styleElement: HTMLStyleElement;
  private activeThemeIndex: number = 0;

  constructor(container: HTMLElement, callbacks: ControlCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.styleElement = this.createStyles();
    document.head.appendChild(this.styleElement);

    this.panel = this.createPanel();
    this.container.appendChild(this.panel);

    const title = this.createTitle();
    this.panel.appendChild(title);

    const colorSection = this.createColorSection();
    this.panel.appendChild(colorSection);

    const densitySection = this.createSliderSection('粒子密度', 'density-slider');
    this.densitySlider = densitySection.slider;
    this.densityValue = densitySection.valueSpan;
    this.panel.appendChild(densitySection.wrapper);

    const speedSection = this.createSliderSection('旋转速度', 'speed-slider');
    this.speedSlider = speedSection.slider;
    this.speedValue = speedSection.valueSpan;
    this.panel.appendChild(speedSection.wrapper);

    const themeSection = this.createThemeSection();
    this.panel.appendChild(themeSection);

    this.fullscreenButton = this.createFullscreenButton();
    this.container.appendChild(this.fullscreenButton);

    this.bindEvents();
  }

  private createStyles(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
      .nebula-controls-panel {
        position: fixed;
        left: 24px;
        bottom: 24px;
        width: 300px;
        padding: 20px;
        background: rgba(20, 20, 40, 0.4);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.08);
        z-index: 10;
        font-family: 'Inter', system-ui, sans-serif;
        color: #e0e0e8;
        box-sizing: border-box;
      }

      .nebula-controls-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 18px;
        font-weight: 600;
        color: #e0e0e8;
        margin: 0 0 20px 0;
        letter-spacing: 1px;
      }

      .nebula-color-section {
        margin-bottom: 20px;
      }

      .nebula-section-label {
        font-size: 13px;
        color: #a0a0b0;
        margin-bottom: 10px;
        display: block;
      }

      .nebula-color-pickers {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .nebula-color-picker-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }

      .nebula-color-picker {
        width: 60px;
        height: 60px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        padding: 0;
        background: none;
        -webkit-appearance: none;
        appearance: none;
        overflow: hidden;
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.1);
        transition: box-shadow 0.3s ease;
      }

      .nebula-color-picker:hover {
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.25);
      }

      .nebula-color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
      }

      .nebula-color-picker::-webkit-color-swatch {
        border: none;
        border-radius: 50%;
      }

      .nebula-color-picker::-moz-color-swatch {
        border: none;
        border-radius: 50%;
      }

      .nebula-color-label {
        font-size: 11px;
        color: #a0a0b0;
      }

      .nebula-slider-section {
        margin-bottom: 18px;
      }

      .nebula-slider-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .nebula-slider-label {
        font-size: 13px;
        color: #a0a0b0;
      }

      .nebula-slider-value {
        font-size: 13px;
        color: #e0e0e8;
        font-weight: 500;
      }

      .nebula-slider {
        width: 100%;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }

      .nebula-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #e0e0e8;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(224, 224, 232, 0.6);
        transition: box-shadow 0.2s ease;
      }

      .nebula-slider::-webkit-slider-thumb:hover {
        box-shadow: 0 0 16px rgba(224, 224, 232, 0.9);
      }

      .nebula-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #e0e0e8;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 10px rgba(224, 224, 232, 0.6);
        transition: box-shadow 0.2s ease;
      }

      .nebula-slider::-moz-range-thumb:hover {
        box-shadow: 0 0 16px rgba(224, 224, 232, 0.9);
      }

      .nebula-theme-section {
        margin-top: 4px;
      }

      .nebula-theme-buttons {
        display: flex;
        gap: 8px;
      }

      .nebula-theme-btn {
        flex: 1;
        padding: 8px 0;
        font-size: 12px;
        font-family: 'Inter', system-ui, sans-serif;
        color: #a0a0b0;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .nebula-theme-btn:hover {
        color: #e0e0e8;
        box-shadow: 0 0 12px rgba(224, 224, 232, 0.15);
      }

      .nebula-theme-btn.active {
        color: #e0e0e8;
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 0 16px rgba(224, 224, 232, 0.2);
      }

      .nebula-fullscreen-btn {
        position: fixed;
        top: 24px;
        right: 24px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(20, 20, 40, 0.4);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 2px solid rgba(255, 255, 255, 0.08);
        color: #e0e0e8;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.3s ease;
        line-height: 1;
      }

      .nebula-fullscreen-btn:hover {
        box-shadow: 0 0 16px rgba(224, 224, 232, 0.25);
        background: rgba(20, 20, 40, 0.55);
      }
    `;
    return style;
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'nebula-controls-panel';
    return panel;
  }

  private createTitle(): HTMLHeadingElement {
    const title = document.createElement('h2');
    title.className = 'nebula-controls-title';
    title.textContent = '星云控制台';
    return title;
  }

  private createColorSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'nebula-color-section';

    const label = document.createElement('span');
    label.className = 'nebula-section-label';
    label.textContent = '主色调';
    section.appendChild(label);

    const pickers = document.createElement('div');
    pickers.className = 'nebula-color-pickers';

    const startWrapper = document.createElement('div');
    startWrapper.className = 'nebula-color-picker-wrapper';
    this.startColorInput = document.createElement('input');
    this.startColorInput.type = 'color';
    this.startColorInput.className = 'nebula-color-picker';
    this.startColorInput.value = '#6366f1';
    const startLabel = document.createElement('span');
    startLabel.className = 'nebula-color-label';
    startLabel.textContent = '起始';
    startWrapper.appendChild(this.startColorInput);
    startWrapper.appendChild(startLabel);

    const endWrapper = document.createElement('div');
    endWrapper.className = 'nebula-color-picker-wrapper';
    this.endColorInput = document.createElement('input');
    this.endColorInput.type = 'color';
    this.endColorInput.className = 'nebula-color-picker';
    this.endColorInput.value = '#ec4899';
    const endLabel = document.createElement('span');
    endLabel.className = 'nebula-color-label';
    endLabel.textContent = '结束';
    endWrapper.appendChild(this.endColorInput);
    endWrapper.appendChild(endLabel);

    pickers.appendChild(startWrapper);
    pickers.appendChild(endWrapper);
    section.appendChild(pickers);

    return section;
  }

  private createSliderSection(label: string, className: string): {
    wrapper: HTMLDivElement;
    slider: HTMLInputElement;
    valueSpan: HTMLSpanElement;
  } {
    const wrapper = document.createElement('div');
    wrapper.className = 'nebula-slider-section';

    const header = document.createElement('div');
    header.className = 'nebula-slider-header';

    const labelEl = document.createElement('span');
    labelEl.className = 'nebula-slider-label';
    labelEl.textContent = label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'nebula-slider-value';
    valueSpan.textContent = '50%';

    header.appendChild(labelEl);
    header.appendChild(valueSpan);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = '0.5';
    slider.className = `nebula-slider ${className}`;

    wrapper.appendChild(header);
    wrapper.appendChild(slider);

    return { wrapper, slider, valueSpan };
  }

  private createThemeSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'nebula-theme-section';

    const label = document.createElement('span');
    label.className = 'nebula-section-label';
    label.textContent = '主题预设';
    section.appendChild(label);

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'nebula-theme-buttons';

    THEMES.forEach((theme, index) => {
      const btn = document.createElement('button');
      btn.className = 'nebula-theme-btn';
      if (index === 0) {
        btn.classList.add('active');
      }
      btn.textContent = theme.name;
      btn.dataset.themeIndex = String(index);
      this.themeButtons.push(btn);
      buttonsWrapper.appendChild(btn);
    });

    section.appendChild(buttonsWrapper);
    return section;
  }

  private createFullscreenButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'nebula-fullscreen-btn';
    btn.textContent = '⛶';
    btn.title = '全屏';
    return btn;
  }

  private bindEvents(): void {
    this.startColorInput.addEventListener('input', this.handleColorChange);
    this.endColorInput.addEventListener('input', this.handleColorChange);

    this.densitySlider.addEventListener('input', this.handleDensityChange);
    this.speedSlider.addEventListener('input', this.handleSpeedChange);

    this.themeButtons.forEach((btn) => {
      btn.addEventListener('click', this.handleThemeClick);
    });

    this.fullscreenButton.addEventListener('click', this.handleFullscreenClick);
  }

  private handleColorChange = (): void => {
    this.callbacks.onColorChange(this.startColorInput.value, this.endColorInput.value);
  };

  private handleDensityChange = (): void => {
    const value = parseFloat(this.densitySlider.value);
    this.densityValue.textContent = `${Math.round(value * 100)}%`;
    this.callbacks.onDensityChange(value);
  };

  private handleSpeedChange = (): void => {
    const value = parseFloat(this.speedSlider.value);
    this.speedValue.textContent = `${Math.round(value * 100)}%`;
    this.callbacks.onSpeedChange(value);
  };

  private handleThemeClick = (e: Event): void => {
    const btn = e.currentTarget as HTMLButtonElement;
    const index = parseInt(btn.dataset.themeIndex || '0', 10);
    this.activeThemeIndex = index;

    this.themeButtons.forEach((b, i) => {
      if (i === index) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    this.callbacks.onThemeChange(THEMES[index]);
  };

  private handleFullscreenClick = (): void => {
    this.callbacks.onFullscreen();
  };

  public setInitialValues(params: {
    colorStart: string;
    colorEnd: string;
    density: number;
    speed: number;
  }): void {
    this.startColorInput.value = params.colorStart;
    this.endColorInput.value = params.colorEnd;

    this.densitySlider.value = String(params.density);
    this.densityValue.textContent = `${Math.round(params.density * 100)}%`;

    this.speedSlider.value = String(params.speed);
    this.speedValue.textContent = `${Math.round(params.speed * 100)}%`;
  }

  public dispose(): void {
    this.startColorInput.removeEventListener('input', this.handleColorChange);
    this.endColorInput.removeEventListener('input', this.handleColorChange);
    this.densitySlider.removeEventListener('input', this.handleDensityChange);
    this.speedSlider.removeEventListener('input', this.handleSpeedChange);
    this.themeButtons.forEach((btn) => {
      btn.removeEventListener('click', this.handleThemeClick);
    });
    this.fullscreenButton.removeEventListener('click', this.handleFullscreenClick);

    if (this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    if (this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    if (this.fullscreenButton.parentNode) {
      this.fullscreenButton.parentNode.removeChild(this.fullscreenButton);
    }
  }
}
