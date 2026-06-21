import type { ParticleConfig, Mode } from '../types';
import { Presets } from './Presets';

export class ControlPanel {
  private elements: Map<string, HTMLElement | HTMLInputElement | HTMLSelectElement> = new Map();
  private onConfigChange: ((config: Partial<ParticleConfig>) => void) | null = null;
  private onModeChange: ((mode: Mode) => void) | null = null;
  private presets: Presets;
  private currentMode: Mode = 'edit';
  private currentPreset: string = 'fire';
  private currentConfig: ParticleConfig;

  constructor() {
    this.presets = new Presets();
    this.currentConfig = this.presets.getPreset('fire')!;
    this.initElements();
    this.bindEvents();
    this.updateSliderProgress();
  }

  private initElements(): void {
    const ids = [
      'emissionRate', 'initialSpeed', 'lifespan', 'particleSize', 'spreadAngle',
      'startColor', 'endColor', 'presetSelect', 'exportBtn', 'importFile',
      'rateValue', 'speedValue', 'lifeValue', 'sizeValue', 'spreadValue',
      'modeToggle', 'modeIcon', 'controlPanel', 'canvasContainer',
      'sectionEmit', 'sectionMotion', 'sectionAppearance',
      'particleCount', 'frameRate', 'currentMode',
    ];

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        this.elements.set(id, el);
      }
    }

    this.presets.setOnPresetChange((config) => {
      this.updateUIWithConfig(config);
      if (this.onConfigChange) {
        this.onConfigChange(config);
      }
    });
  }

  private bindEvents(): void {
    const sliders = ['emissionRate', 'initialSpeed', 'lifespan', 'particleSize', 'spreadAngle'];

    for (const id of sliders) {
      const slider = this.elements.get(id) as HTMLInputElement;
      if (slider) {
        slider.addEventListener('input', () => {
          this.handleSliderChange(id, slider.value);
          this.updateSliderProgress();
          this.setCustomPreset();
        });
      }
    }

    const colorPickers = ['startColor', 'endColor'];
    for (const id of colorPickers) {
      const picker = this.elements.get(id) as HTMLInputElement;
      if (picker) {
        picker.addEventListener('input', () => {
          this.handleColorChange(id, picker.value);
          this.setCustomPreset();
        });
      }
    }

    const presetSelect = this.elements.get('presetSelect') as HTMLSelectElement;
    if (presetSelect) {
      presetSelect.addEventListener('change', () => {
        this.currentPreset = presetSelect.value;
        if (this.currentPreset !== 'custom') {
          this.applyPresetWithFade(this.currentPreset);
        }
      });
    }

    const exportBtn = this.elements.get('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.presets.downloadJson(this.currentConfig);
      });
    }

    const importFile = this.elements.get('importFile') as HTMLInputElement;
    if (importFile) {
      importFile.addEventListener('change', (e) => {
        this.handleImport(e);
      });
    }

    const modeToggle = this.elements.get('modeToggle');
    if (modeToggle) {
      modeToggle.addEventListener('click', () => {
        this.toggleMode();
      });
    }

    const sections = ['sectionEmit', 'sectionMotion', 'sectionAppearance'];
    for (const id of sections) {
      const section = this.elements.get(id);
      if (section) {
        const header = section.querySelector('.section-header');
        if (header) {
          header.addEventListener('click', () => {
            section.classList.toggle('collapsed');
          });
        }
      }
    }
  }

  private handleSliderChange(id: string, value: string): void {
    const numValue = parseFloat(value);
    const key = id as keyof ParticleConfig;

    this.updateValueLabel(id, numValue);

    if (this.onConfigChange) {
      this.onConfigChange({ [key]: numValue });
    }

    this.currentConfig[key as keyof ParticleConfig] = numValue as never;
  }

  private handleColorChange(id: string, value: string): void {
    const key = id as keyof ParticleConfig;

    if (this.onConfigChange) {
      this.onConfigChange({ [key]: value });
    }

    this.currentConfig[key as keyof ParticleConfig] = value as never;
  }

  private updateValueLabel(id: string, value: number): void {
    const labelMap: Record<string, { id: string; unit: string; decimals: number }> = {
      emissionRate: { id: 'rateValue', unit: ' 个/秒', decimals: 0 },
      initialSpeed: { id: 'speedValue', unit: ' px/s', decimals: 0 },
      lifespan: { id: 'lifeValue', unit: ' s', decimals: 1 },
      particleSize: { id: 'sizeValue', unit: ' px', decimals: 0 },
      spreadAngle: { id: 'spreadValue', unit: '°', decimals: 0 },
    };

    const mapping = labelMap[id];
    if (mapping) {
      const label = this.elements.get(mapping.id);
      if (label) {
        label.textContent = value.toFixed(mapping.decimals) + mapping.unit;
      }
    }
  }

  private updateSliderProgress(): void {
    const sliders = ['emissionRate', 'initialSpeed', 'lifespan', 'particleSize', 'spreadAngle'];

    for (const id of sliders) {
      const slider = this.elements.get(id) as HTMLInputElement;
      if (slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const value = parseFloat(slider.value);
        const progress = ((value - min) / (max - min)) * 100;
        slider.style.setProperty('--progress', `${progress}%`);
      }
    }
  }

  private applyPresetWithFade(presetKey: string): void {
    const canvas = document.getElementById('pixi-canvas');
    if (canvas) {
      canvas.classList.add('fade-out');
      setTimeout(() => {
        this.presets.applyPreset(presetKey);
        canvas.classList.remove('fade-out');
      }, 250);
    } else {
      this.presets.applyPreset(presetKey);
    }
  }

  private updateUIWithConfig(config: ParticleConfig): void {
    this.currentConfig = { ...config };

    const emissionRate = this.elements.get('emissionRate') as HTMLInputElement;
    if (emissionRate) emissionRate.value = config.emissionRate.toString();

    const initialSpeed = this.elements.get('initialSpeed') as HTMLInputElement;
    if (initialSpeed) initialSpeed.value = config.initialSpeed.toString();

    const lifespan = this.elements.get('lifespan') as HTMLInputElement;
    if (lifespan) lifespan.value = config.lifespan.toString();

    const particleSize = this.elements.get('particleSize') as HTMLInputElement;
    if (particleSize) particleSize.value = config.particleSize.toString();

    const spreadAngle = this.elements.get('spreadAngle') as HTMLInputElement;
    if (spreadAngle) spreadAngle.value = config.spreadAngle.toString();

    const startColor = this.elements.get('startColor') as HTMLInputElement;
    if (startColor) startColor.value = config.startColor;

    const endColor = this.elements.get('endColor') as HTMLInputElement;
    if (endColor) endColor.value = config.endColor;

    this.updateValueLabel('emissionRate', config.emissionRate);
    this.updateValueLabel('initialSpeed', config.initialSpeed);
    this.updateValueLabel('lifespan', config.lifespan);
    this.updateValueLabel('particleSize', config.particleSize);
    this.updateValueLabel('spreadAngle', config.spreadAngle);

    this.updateSliderProgress();
  }

  private setCustomPreset(): void {
    const presetSelect = this.elements.get('presetSelect') as HTMLSelectElement;
    if (presetSelect && presetSelect.value !== 'custom') {
      presetSelect.value = 'custom';
      this.currentPreset = 'custom';
    }
  }

  private handleImport(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const config = this.presets.importFromJson(content);
      if (config) {
        this.setCustomPreset();
        this.updateUIWithConfig(config);
        if (this.onConfigChange) {
          this.onConfigChange(config);
        }
      } else {
        alert('无效的粒子配置文件！');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  private toggleMode(): void {
    const modeToggle = this.elements.get('modeToggle');
    if (modeToggle) {
      modeToggle.classList.add('rotating');
      setTimeout(() => {
        modeToggle.classList.remove('rotating');
      }, 300);
    }

    this.currentMode = this.currentMode === 'edit' ? 'play' : 'edit';

    const modeIcon = this.elements.get('modeIcon');
    if (modeIcon) {
      modeIcon.textContent = this.currentMode === 'edit' ? '✏️' : '▶️';
    }

    const currentModeEl = this.elements.get('currentMode');
    if (currentModeEl) {
      currentModeEl.textContent = this.currentMode === 'edit' ? '编辑模式' : '播放模式';
    }

    const controlPanel = this.elements.get('controlPanel');
    const canvasContainer = this.elements.get('canvasContainer');

    if (this.currentMode === 'play') {
      controlPanel?.classList.add('hidden', 'locked');
      canvasContainer?.classList.add('fullscreen');
    } else {
      controlPanel?.classList.remove('hidden', 'locked');
      canvasContainer?.classList.remove('fullscreen');
    }

    if (this.onModeChange) {
      this.onModeChange(this.currentMode);
    }
  }

  setOnConfigChange(callback: (config: Partial<ParticleConfig>) => void): void {
    this.onConfigChange = callback;
  }

  setOnModeChange(callback: (mode: Mode) => void): void {
    this.onModeChange = callback;
  }

  getCurrentConfig(): ParticleConfig {
    return { ...this.currentConfig };
  }

  updateStatus(particleCount: number, fps: number): void {
    const particleCountEl = this.elements.get('particleCount');
    if (particleCountEl) {
      particleCountEl.textContent = particleCount.toString();
      particleCountEl.classList.remove('warning', 'danger');
      if (particleCount >= 5000) {
        particleCountEl.classList.add(particleCount >= 8000 ? 'danger' : 'warning');
      }
    }

    const frameRateEl = this.elements.get('frameRate');
    if (frameRateEl) {
      frameRateEl.textContent = `${Math.round(fps)} FPS`;
      frameRateEl.classList.remove('warning', 'danger');
      if (fps < 30) {
        frameRateEl.classList.add('danger');
      } else if (fps < 45) {
        frameRateEl.classList.add('warning');
      }
    }
  }

  getInitialConfig(): ParticleConfig {
    return this.presets.getPreset('fire')!;
  }
}
