import { StyleParams } from './canvasEngine';

interface SliderConfig {
  key: keyof StyleParams;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}

const DEFAULT_PARAMS: StyleParams = {
  lineWidth: 4,
  distortion: 0,
  jitterFrequency: 1,
  fadeAmount: 0,
};

const SLIDER_CONFIGS: SliderConfig[] = [
  { key: 'lineWidth', label: '粗细', min: 2, max: 20, step: 1, suffix: 'px' },
  { key: 'distortion', label: '扭曲', min: 0, max: 15, step: 1, suffix: '' },
  { key: 'jitterFrequency', label: '抖动频率', min: 1, max: 10, step: 1, suffix: '' },
  { key: 'fadeAmount', label: '色彩褪色', min: 0, max: 100, step: 1, suffix: '%' },
];

export class Controls {
  private container: HTMLElement;
  private params: StyleParams = { ...DEFAULT_PARAMS };
  private onChange: (params: StyleParams) => void;
  private sliderElements: Map<keyof StyleParams, HTMLInputElement> = new Map();
  private valueElements: Map<keyof StyleParams, HTMLElement> = new Map();
  private barElements: Map<keyof StyleParams, HTMLElement> = new Map();
  private indicatorElements: Map<keyof StyleParams, HTMLElement> = new Map();
  private throttleTimer: number | null = null;

  constructor(
    container: HTMLElement,
    onChange: (params: StyleParams) => void
  ) {
    this.container = container;
    this.onChange = onChange;
    this.build();
  }

  private build(): void {
    this.container.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '风格控制面板';
    this.container.appendChild(title);

    for (const config of SLIDER_CONFIGS) {
      this.createSlider(config);
    }
  }

  private createSlider(config: SliderConfig): void {
    const group = document.createElement('div');
    group.className = 'slider-group';

    const header = document.createElement('div');
    header.className = 'slider-header';

    const label = document.createElement('span');
    label.className = 'slider-label';
    label.textContent = config.label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'slider-value';
    const currentVal = this.params[config.key];
    valueSpan.textContent = `${currentVal}${config.suffix}`;

    header.appendChild(label);
    header.appendChild(valueSpan);

    const track = document.createElement('div');
    track.className = 'slider-track';

    const bar = document.createElement('div');
    bar.className = 'slider-bar';
    const percent = ((currentVal - config.min) / (config.max - config.min)) * 100;
    bar.style.width = `${percent}%`;

    track.appendChild(bar);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(config.min);
    input.max = String(config.max);
    input.step = String(config.step);
    input.value = String(currentVal);

    const indicator = document.createElement('div');
    indicator.className = 'color-indicator';
    this.updateIndicatorColor(indicator, config.key, currentVal);

    group.appendChild(header);
    group.appendChild(track);
    group.appendChild(input);
    group.appendChild(indicator);

    this.container.appendChild(group);

    this.sliderElements.set(config.key, input);
    this.valueElements.set(config.key, valueSpan);
    this.barElements.set(config.key, bar);
    this.indicatorElements.set(config.key, indicator);

    input.addEventListener('input', (e) => {
      this.handleInput(config, Number((e.target as HTMLInputElement).value));
    });

    const pressHandler = (): void => {
      this.container.classList.add('pressed');
    };
    const releaseHandler = (): void => {
      setTimeout(() => {
        this.container.classList.remove('pressed');
      }, 200);
    };

    input.addEventListener('mousedown', pressHandler);
    input.addEventListener('mouseup', releaseHandler);
    input.addEventListener('touchstart', pressHandler);
    input.addEventListener('touchend', releaseHandler);
  }

  private handleInput(config: SliderConfig, value: number): void {
    this.params[config.key] = value;

    const valueEl = this.valueElements.get(config.key);
    if (valueEl) {
      valueEl.textContent = `${value}${config.suffix}`;
    }

    const barEl = this.barElements.get(config.key);
    if (barEl) {
      const percent = ((value - config.min) / (config.max - config.min)) * 100;
      barEl.style.width = `${percent}%`;
    }

    const indicatorEl = this.indicatorElements.get(config.key);
    if (indicatorEl) {
      this.updateIndicatorColor(indicatorEl, config.key, value);
    }

    if (this.throttleTimer !== null) {
      clearTimeout(this.throttleTimer);
    }
    this.throttleTimer = window.setTimeout(() => {
      this.onChange({ ...this.params });
      this.throttleTimer = null;
    }, 16);
  }

  private updateIndicatorColor(
    el: HTMLElement,
    key: keyof StyleParams,
    value: number
  ): void {
    switch (key) {
      case 'lineWidth':
        el.style.background = 'linear-gradient(90deg, #AAAAAA, #E6A04C)';
        break;
      case 'distortion': {
        const t = value / 15;
        el.style.background = `hsl(${30 + t * 20}, 60%, ${65 - t * 15}%)`;
        break;
      }
      case 'jitterFrequency': {
        const t = (value - 1) / 9;
        el.style.background = `hsl(${210 - t * 180}, 50%, 60%)`;
        break;
      }
      case 'fadeAmount': {
        const t = value / 100;
        const r1 = 43 + 170 * t;
        const g1 = 27 + 170 * t;
        const b1 = 14 + 170 * t;
        el.style.background = `rgb(${Math.round(r1)}, ${Math.round(g1)}, ${Math.round(b1)})`;
        break;
      }
    }
  }

  getParams(): StyleParams {
    return { ...this.params };
  }

  setParams(params: Partial<StyleParams>): void {
    this.params = { ...this.params, ...params };

    for (const config of SLIDER_CONFIGS) {
      const input = this.sliderElements.get(config.key);
      if (input) {
        input.value = String(this.params[config.key]);
      }
      const valueEl = this.valueElements.get(config.key);
      if (valueEl) {
        valueEl.textContent = `${this.params[config.key]}${config.suffix}`;
      }

      const barEl = this.barElements.get(config.key);
      if (barEl) {
        const percent =
          ((this.params[config.key] - config.min) /
            (config.max - config.min)) *
          100;
        barEl.style.width = `${percent}%`;
      }

      const indicatorEl = this.indicatorElements.get(config.key);
      if (indicatorEl) {
        this.updateIndicatorColor(
          indicatorEl,
          config.key,
          this.params[config.key]
        );
      }
    }
  }
}
