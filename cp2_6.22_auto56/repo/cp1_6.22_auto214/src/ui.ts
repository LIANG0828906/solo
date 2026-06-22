import { appState, StateKey } from './state';

interface SliderConfig {
  key: StateKey;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  suffix: string;
  transform?: (value: number) => string;
}

const sliderConfigs: SliderConfig[] = [
  {
    key: 'colorSpeed',
    label: '色彩变换速度',
    min: 0.1,
    max: 3.0,
    step: 0.1,
    default: 1.0,
    suffix: 'x'
  },
  {
    key: 'flowSpeed',
    label: '光带飘动速度',
    min: 0.1,
    max: 3.0,
    step: 0.1,
    default: 1.0,
    suffix: 'x'
  },
  {
    key: 'brightness',
    label: '整体亮度',
    min: 0.1,
    max: 1.0,
    step: 0.05,
    default: 0.8,
    suffix: '%',
    transform: (value: number) => `${Math.round(value * 100)}`
  }
];

export class UIController {
  private container: HTMLElement;

  private controlPanel: HTMLDivElement | null;

  private fullscreenButton: HTMLButtonElement | null;

  private isFullscreen: boolean;

  private valueLabels: Map<StateKey, HTMLSpanElement>;

  private fadeTimeouts: Map<StateKey, ReturnType<typeof setTimeout>>;

  constructor(container: HTMLElement) {
    this.container = container;
    this.controlPanel = null;
    this.fullscreenButton = null;
    this.isFullscreen = false;
    this.valueLabels = new Map();
    this.fadeTimeouts = new Map();
    this.init();
  }

  private init(): void {
    this.createControlPanel();
    this.createFullscreenButton();
    this.bindFullscreenEvents();
  }

  private createControlPanel(): void {
    this.controlPanel = document.createElement('div');
    this.controlPanel.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      width: 640px;
      height: 58px;
      background: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0 24px;
      z-index: 100;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
    `;

    sliderConfigs.forEach((config) => {
      const sliderWrapper = this.createSlider(config);
      this.controlPanel?.appendChild(sliderWrapper);
    });

    this.controlPanel.addEventListener('mouseenter', () => {
      if (this.controlPanel) {
        this.controlPanel.style.transform = 'translateX(-50%) translateY(-2px)';
        this.controlPanel.style.boxShadow = '0 6px 32px rgba(96, 239, 255, 0.15), 0 4px 24px rgba(0, 0, 0, 0.4)';
      }
    });

    this.controlPanel.addEventListener('mouseleave', () => {
      if (this.controlPanel) {
        this.controlPanel.style.transform = 'translateX(-50%) translateY(0)';
        this.controlPanel.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.3)';
      }
    });

    this.container.appendChild(this.controlPanel);
  }

  private createSlider(config: SliderConfig): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 12px;
    `;

    const label = document.createElement('label');
    label.textContent = config.label;
    label.style.cssText = `
      font-size: 11px;
      color: #9CA3AF;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    `;

    const sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = `
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
    `;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = config.min.toString();
    slider.max = config.max.toString();
    slider.step = config.step.toString();
    slider.value = config.default.toString();
    slider.style.cssText = `
      width: 100%;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: #374151;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      transition: box-shadow 0.2s ease;
    `;

    const style = document.createElement('style');
    style.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: #60EFFF;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(96, 239, 255, 0.5);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.15);
        box-shadow: 0 0 12px rgba(96, 239, 255, 0.8);
      }
      input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #60EFFF;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 8px rgba(96, 239, 255, 0.5);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      input[type="range"]::-moz-range-thumb:hover {
        transform: scale(1.15);
        box-shadow: 0 0 12px rgba(96, 239, 255, 0.8);
      }
      input[type="range"]:hover {
        box-shadow: 0 0 8px rgba(96, 239, 255, 0.2);
      }
    `;
    document.head.appendChild(style);

    const valueLabel = document.createElement('span');
    const displayValue = config.transform ? config.transform(config.default) : config.default.toString();
    valueLabel.textContent = `${displayValue}${config.suffix}`;
    valueLabel.style.cssText = `
      position: absolute;
      top: -28px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      font-weight: 600;
      color: #60EFFF;
      background: rgba(17, 24, 39, 0.95);
      padding: 4px 8px;
      border-radius: 6px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
      white-space: nowrap;
    `;

    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      appState.set(config.key, value);
      this.showValueLabel(config.key, value, config);
    });

    slider.addEventListener('mouseenter', () => {
      const value = parseFloat(slider.value);
      this.showValueLabel(config.key, value, config);
    });

    slider.addEventListener('mouseleave', () => {
      this.hideValueLabel(config.key);
    });

    this.valueLabels.set(config.key, valueLabel);

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueLabel);
    wrapper.appendChild(label);
    wrapper.appendChild(sliderContainer);

    return wrapper;
  }

  private showValueLabel(key: StateKey, value: number, config: SliderConfig): void {
    const label = this.valueLabels.get(key);
    if (label) {
      const displayValue = config.transform ? config.transform(value) : value.toFixed(1);
      label.textContent = `${displayValue}${config.suffix}`;
      label.style.opacity = '1';
      label.style.transform = 'translateX(-50%) translateY(-2px)';

      const existingTimeout = this.fadeTimeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
    }
  }

  private hideValueLabel(key: StateKey): void {
    const existingTimeout = this.fadeTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      const label = this.valueLabels.get(key);
      if (label) {
        label.style.opacity = '0';
        label.style.transform = 'translateX(-50%) translateY(0)';
      }
      this.fadeTimeouts.delete(key);
    }, 300);

    this.fadeTimeouts.set(key, timeout);
  }

  private createFullscreenButton(): void {
    this.fullscreenButton = document.createElement('button');
    this.fullscreenButton.innerHTML = this.getFullscreenIcon(false);
    this.fullscreenButton.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(31, 41, 55, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      transition: transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    `;

    const svg = this.fullscreenButton.querySelector('svg');
    if (svg) {
      svg.style.transition = 'transform 0.3s ease';
    }

    this.fullscreenButton.addEventListener('mouseenter', () => {
      if (this.fullscreenButton) {
        this.fullscreenButton.style.transform = 'translateY(-2px) scale(1.05)';
        this.fullscreenButton.style.boxShadow = '0 6px 20px rgba(96, 239, 255, 0.2), 0 4px 16px rgba(0, 0, 0, 0.4)';
      }
    });

    this.fullscreenButton.addEventListener('mouseleave', () => {
      if (this.fullscreenButton) {
        this.fullscreenButton.style.transform = 'translateY(0) scale(1)';
        this.fullscreenButton.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
      }
    });

    this.fullscreenButton.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    this.container.appendChild(this.fullscreenButton);
  }

  private getFullscreenIcon(isFullscreen: boolean): string {
    if (isFullscreen) {
      return `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
        </svg>
      `;
    }
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2m12 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M5 21H3a2 2 0 0 1-2-2v-2"/>
      </svg>
    `;
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  }

  private bindFullscreenEvents(): void {
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      if (this.fullscreenButton) {
        this.fullscreenButton.innerHTML = this.getFullscreenIcon(this.isFullscreen);
        const svg = this.fullscreenButton.querySelector('svg');
        if (svg) {
          svg.style.transition = 'transform 0.3s ease';
        }
      }
    });
  }

  public destroy(): void {
    this.fadeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.fadeTimeouts.clear();
    this.valueLabels.clear();

    if (this.controlPanel && this.controlPanel.parentNode) {
      this.controlPanel.parentNode.removeChild(this.controlPanel);
    }
    if (this.fullscreenButton && this.fullscreenButton.parentNode) {
      this.fullscreenButton.parentNode.removeChild(this.fullscreenButton);
    }

    this.controlPanel = null;
    this.fullscreenButton = null;
  }
}
