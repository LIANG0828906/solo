import { SceneManager } from './sceneManager';
import type { ColorTheme } from './particleSystem';

interface PresetsResponse {
  themes: ColorTheme[];
  defaults: {
    particleCount: number;
    speedMultiplier: number;
    defaultThemeIndex: number;
  };
}

class UIController {
  private container: HTMLElement;
  private sceneManager: SceneManager;
  private themes: ColorTheme[] = [];

  private countSlider: HTMLInputElement | null = null;
  private speedSlider: HTMLInputElement | null = null;
  private themeSelect: HTMLSelectElement | null = null;

  private countValueLabel: HTMLElement | null = null;
  private speedValueLabel: HTMLElement | null = null;

  constructor(container: HTMLElement, sceneManager: SceneManager) {
    this.container = container;
    this.sceneManager = sceneManager;
  }

  public async init(): Promise<void> {
    let presets: PresetsResponse;

    try {
      const response = await fetch('http://localhost:3001/api/presets', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        presets = await response.json();
      } else {
        throw new Error('API 请求失败');
      }
    } catch (err) {
      console.warn('无法从后端获取预设，使用本地默认配置');
      presets = this.getFallbackPresets();
    }

    this.themes = presets.themes;
    this.createPanel(presets);
  }

  private getFallbackPresets(): PresetsResponse {
    return {
      themes: [
        { name: '极光青紫', colors: ['#00BCD4', '#E91E63', '#9C27B0'] },
        { name: '落日橙粉', colors: ['#FF6B35', '#FF8CC8', '#FFB347'] },
        { name: '海洋蓝绿', colors: ['#006994', '#20B2AA', '#40E0D0'] },
        { name: '霓虹红绿', colors: ['#FF1744', '#00E676', '#FFEA00'] },
      ],
      defaults: {
        particleCount: 5000,
        speedMultiplier: 1.0,
        defaultThemeIndex: 0,
      },
    };
  }

  private createPanel(presets: PresetsResponse): void {
    const panel = document.createElement('div');
    panel.className = 'control-panel';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '控制面板';
    panel.appendChild(title);

    const countGroup = this.createSliderGroup(
      '粒子数量',
      1000,
      10000,
      presets.defaults.particleCount,
      100,
      (value) => {
        this.countValueLabel!.textContent = value.toString();
        this.sceneManager.setParticleCount(value);
      }
    );
    this.countSlider = countGroup.slider;
    this.countValueLabel = countGroup.valueLabel;
    panel.appendChild(countGroup.wrapper);

    const speedGroup = this.createSliderGroup(
      '速度倍数',
      0.1,
      3.0,
      presets.defaults.speedMultiplier,
      0.1,
      (value) => {
        this.speedValueLabel!.textContent = value.toFixed(1);
        this.sceneManager.setSpeed(value);
      }
    );
    this.speedSlider = speedGroup.slider;
    this.speedValueLabel = speedGroup.valueLabel;
    panel.appendChild(speedGroup.wrapper);

    const themeGroup = document.createElement('div');
    themeGroup.className = 'control-group';

    const themeLabel = document.createElement('div');
    themeLabel.className = 'control-label';
    themeLabel.textContent = '颜色主题';
    themeGroup.appendChild(themeLabel);

    this.themeSelect = document.createElement('select');
    this.themes.forEach((theme, index) => {
      const option = document.createElement('option');
      option.value = index.toString();
      option.textContent = theme.name;
      if (index === presets.defaults.defaultThemeIndex) {
        option.selected = true;
      }
      this.themeSelect!.appendChild(option);
    });

    this.themeSelect.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLSelectElement).value, 10);
      if (this.themes[idx]) {
        this.sceneManager.setColorTheme(this.themes[idx]);
      }
    });

    themeGroup.appendChild(this.themeSelect);
    panel.appendChild(themeGroup);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-reset';
    resetBtn.textContent = '重置视角';
    resetBtn.addEventListener('click', () => {
      this.sceneManager.resetView();
    });
    panel.appendChild(resetBtn);

    this.container.appendChild(panel);
  }

  private createSliderGroup(
    label: string,
    min: number,
    max: number,
    value: number,
    step: number,
    onChange: (value: number) => void
  ): { wrapper: HTMLDivElement; slider: HTMLInputElement; valueLabel: HTMLSpanElement } {
    const wrapper = document.createElement('div');
    wrapper.className = 'control-group';

    const labelEl = document.createElement('div');
    labelEl.className = 'control-label';

    const labelText = document.createElement('span');
    labelText.textContent = label;

    const valueLabel = document.createElement('span');
    valueLabel.className = 'control-value';
    valueLabel.textContent = step < 1 ? value.toFixed(1) : value.toString();

    labelEl.appendChild(labelText);
    labelEl.appendChild(valueLabel);
    wrapper.appendChild(labelEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = value.toString();

    slider.addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      onChange(step < 1 ? parseFloat(v.toFixed(1)) : Math.round(v));
    });

    wrapper.appendChild(slider);

    return { wrapper, slider, valueLabel };
  }
}

export { UIController };
