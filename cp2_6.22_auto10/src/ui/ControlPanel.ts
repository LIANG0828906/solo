import type { ParticleConfig } from '../types';
import { PresetManager } from './Presets';

interface SliderDef {
  key: keyof ParticleConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SLIDER_GROUPS: { title: string; sliders: SliderDef[] }[] = [
  {
    title: '发射参数',
    sliders: [
      { key: 'emissionRate', label: '发射速率', min: 0, max: 200, step: 1, unit: '/秒' },
    ]
  },
  {
    title: '运动参数',
    sliders: [
      { key: 'initialSpeed', label: '初始速度', min: 0, max: 500, step: 1, unit: 'px/s' },
      { key: 'lifetime', label: '生命周期', min: 0.1, max: 5, step: 0.1, unit: '秒' },
      { key: 'spreadAngle', label: '扩散角度', min: 0, max: 360, step: 1, unit: '°' },
    ]
  },
  {
    title: '外观参数',
    sliders: [
      { key: 'size', label: '粒子大小', min: 1, max: 20, step: 0.5, unit: 'px' },
    ]
  }
];

type ConfigChangeCallback = (config: ParticleConfig) => void;

class ControlPanel {
  private container: HTMLElement;
  private cardsContainer: HTMLElement;
  private presetManager: PresetManager;
  private onConfigChange: ConfigChangeCallback | null = null;
  private config: ParticleConfig;
  private sliders: Map<keyof ParticleConfig, HTMLInputElement> = new Map();
  private valueDisplays: Map<keyof ParticleConfig, HTMLElement> = new Map();
  private startColorInput: HTMLInputElement | null = null;
  private endColorInput: HTMLInputElement | null = null;
  private startColorHex: HTMLElement | null = null;
  private endColorHex: HTMLElement | null = null;
  private isLocked: boolean = false;

  constructor(container: HTMLElement, cardsContainer: HTMLElement, presetSelect: HTMLSelectElement) {
    this.container = container;
    this.cardsContainer = cardsContainer;
    this.config = this.getDefaultConfig();
    this.presetManager = new PresetManager();

    this.buildCards();
    this.buildColorPickers();
    this.presetManager.setSelectElement(presetSelect);
    this.presetManager.setOnChange((config) => {
      this.setConfig(config);
    });
  }

  setOnConfigChange(cb: ConfigChangeCallback): void {
    this.onConfigChange = cb;
  }

  getConfig(): ParticleConfig {
    return { ...this.config };
  }

  setConfig(config: ParticleConfig, fromPreset: boolean = false): void {
    this.config = { ...config };
    this.updateUI();
    if (this.onConfigChange) {
      this.onConfigChange(this.config);
    }
    if (fromPreset) {
      this.triggerFadeTransition();
    }
  }

  getPresetManager(): PresetManager {
    return this.presetManager;
  }

  lock(): void {
    this.isLocked = true;
    this.container.classList.add('hidden');
    this.disableAllInputs(true);
  }

  unlock(): void {
    this.isLocked = false;
    this.container.classList.remove('hidden');
    this.disableAllInputs(false);
  }

  private getDefaultConfig(): ParticleConfig {
    return {
      emissionRate: 80,
      initialSpeed: 120,
      lifetime: 1.2,
      size: 8,
      spreadAngle: 30,
      startColor: '#ff6600',
      endColor: '#ff0044',
    };
  }

  private buildCards(): void {
    SLIDER_GROUPS.forEach((group, groupIdx) => {
      const card = document.createElement('div');
      card.className = 'card';

      const header = document.createElement('div');
      header.className = 'card-header';
      const title = document.createElement('h3');
      title.textContent = group.title;
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrow.setAttribute('viewBox', '0 0 24 24');
      arrow.classList.add('card-arrow');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M7 10l5 5 5-5z');
      arrow.appendChild(path);

      header.appendChild(title);
      header.appendChild(arrow);

      header.addEventListener('click', () => {
        card.classList.toggle('collapsed');
      });

      const body = document.createElement('div');
      body.className = 'card-body';

      group.sliders.forEach(def => {
        const row = document.createElement('div');
        row.className = 'param-row';

        const label = document.createElement('div');
        label.className = 'param-label';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = def.label;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'param-value';
        valueSpan.textContent = `${this.config[def.key]}${def.unit}`;

        label.appendChild(nameSpan);
        label.appendChild(valueSpan);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'param-slider';
        slider.min = String(def.min);
        slider.max = String(def.max);
        slider.step = String(def.step);
        slider.value = String(this.config[def.key]);

        this.updateSliderGradient(slider, def);

        slider.addEventListener('input', () => {
          if (this.isLocked) return;
          const val = parseFloat(slider.value);
          (this.config as any)[def.key] = val;
          valueSpan.textContent = `${val}${def.unit}`;
          this.updateSliderGradient(slider, def);
          if (this.onConfigChange) {
            this.onConfigChange(this.config);
          }
        });

        this.sliders.set(def.key, slider);
        this.valueDisplays.set(def.key, valueSpan);

        row.appendChild(label);
        row.appendChild(slider);
        body.appendChild(row);
      });

      card.appendChild(header);
      card.appendChild(body);
      this.cardsContainer.appendChild(card);
    });
  }

  private buildColorPickers(): void {
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'card-header';
    const title = document.createElement('h3');
    title.textContent = '颜色渐变';
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('viewBox', '0 0 24 24');
    arrow.classList.add('card-arrow');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M7 10l5 5 5-5z');
    arrow.appendChild(path);

    header.appendChild(title);
    header.appendChild(arrow);
    header.addEventListener('click', () => {
      card.classList.toggle('collapsed');
    });

    const body = document.createElement('div');
    body.className = 'card-body';

    const colorRow = document.createElement('div');
    colorRow.className = 'color-row';

    const startGroup = this.createColorGroup('起始色', this.config.startColor, (color) => {
      this.config.startColor = color;
      if (this.onConfigChange) this.onConfigChange(this.config);
    });
    const endGroup = this.createColorGroup('结束色', this.config.endColor, (color) => {
      this.config.endColor = color;
      if (this.onConfigChange) this.onConfigChange(this.config);
    });

    this.startColorInput = startGroup.input;
    this.startColorHex = startGroup.hex;
    this.endColorInput = endGroup.input;
    this.endColorHex = endGroup.hex;

    colorRow.appendChild(startGroup.el);
    colorRow.appendChild(endGroup.el);
    body.appendChild(colorRow);

    card.appendChild(header);
    card.appendChild(body);
    this.cardsContainer.appendChild(card);
  }

  private createColorGroup(label: string, initialColor: string, onChange: (color: string) => void): { el: HTMLElement; input: HTMLInputElement; hex: HTMLElement } {
    const group = document.createElement('div');
    group.className = 'color-group';

    const lbl = document.createElement('label');
    lbl.textContent = label;

    const wrap = document.createElement('div');
    wrap.className = 'color-picker-wrap';

    const input = document.createElement('input');
    input.type = 'color';
    input.value = initialColor;

    const hex = document.createElement('span');
    hex.className = 'color-hex';
    hex.textContent = initialColor.toUpperCase();

    input.addEventListener('input', () => {
      if (this.isLocked) return;
      hex.textContent = input.value.toUpperCase();
      onChange(input.value);
    });

    wrap.appendChild(input);
    wrap.appendChild(hex);

    group.appendChild(lbl);
    group.appendChild(wrap);

    return { el: group, input, hex };
  }

  private updateUI(): void {
    this.sliders.forEach((slider, key) => {
      const val = this.config[key];
      if (typeof val === 'number') {
        slider.value = String(val);
        const def = this.findSliderDef(key);
        if (def) {
          const display = this.valueDisplays.get(key);
          if (display) display.textContent = `${val}${def.unit}`;
          this.updateSliderGradient(slider, def);
        }
      }
    });
    if (this.startColorInput) this.startColorInput.value = this.config.startColor;
    if (this.endColorInput) this.endColorInput.value = this.config.endColor;
    if (this.startColorHex) this.startColorHex.textContent = this.config.startColor.toUpperCase();
    if (this.endColorHex) this.endColorHex.textContent = this.config.endColor.toUpperCase();
  }

  private updateSliderGradient(slider: HTMLInputElement, def: SliderDef): void {
    const ratio = (parseFloat(slider.value) - def.min) / (def.max - def.min);
    const pct = ratio * 100;
    slider.style.background = `linear-gradient(to right, #e94560 0%, #e94560 ${pct}%, #3a3a5c ${pct}%, #3a3a5c 100%)`;
  }

  private findSliderDef(key: keyof ParticleConfig): SliderDef | undefined {
    for (const group of SLIDER_GROUPS) {
      for (const s of group.sliders) {
        if (s.key === key) return s;
      }
    }
    return undefined;
  }

  private disableAllInputs(disabled: boolean): void {
    this.sliders.forEach(s => s.disabled = disabled);
    if (this.startColorInput) this.startColorInput.disabled = disabled;
    if (this.endColorInput) this.endColorInput.disabled = disabled;
  }

  private triggerFadeTransition(): void {
    const overlay = document.getElementById('fade-overlay');
    if (!overlay) return;
    overlay.classList.add('active');
    setTimeout(() => {
      overlay.classList.remove('active');
    }, 500);
  }
}

export { ControlPanel };
