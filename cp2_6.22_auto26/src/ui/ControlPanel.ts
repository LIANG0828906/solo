import type { ParticleConfig, AppMode } from '../types';
import { PresetManager } from './Presets';

export class ControlPanel {
  private elements: {
    emissionRate: HTMLInputElement;
    emissionRateValue: HTMLElement;
    speed: HTMLInputElement;
    speedValue: HTMLElement;
    lifetime: HTMLInputElement;
    lifetimeValue: HTMLElement;
    size: HTMLInputElement;
    sizeValue: HTMLElement;
    spreadAngle: HTMLInputElement;
    spreadAngleValue: HTMLElement;
    startColor: HTMLInputElement;
    endColor: HTMLInputElement;
    presetSelect: HTMLSelectElement;
    exportBtn: HTMLButtonElement;
    importBtn: HTMLButtonElement;
    importFile: HTMLInputElement;
    controlPanel: HTMLElement;
    particleCount: HTMLElement;
    fpsCounter: HTMLElement;
    modeLabel: HTMLElement;
    modeToggle: HTMLButtonElement;
    canvasWrapper: HTMLElement;
  };

  private presetManager: PresetManager;
  private onConfigChange: ((config: ParticleConfig) => void) | null = null;
  private onModeChange: ((mode: AppMode) => void) | null = null;
  private currentMode: AppMode = 'edit';
  private currentConfig: ParticleConfig;

  constructor(presetManager: PresetManager) {
    this.presetManager = presetManager;
    
    this.currentConfig = {
      emissionRate: 50,
      speed: 200,
      lifetime: 2.0,
      size: 8,
      spreadAngle: 360,
      startColor: '#ff6600',
      endColor: '#ff0000'
    };

    this.elements = {
      emissionRate: document.getElementById('emissionRate') as HTMLInputElement,
      emissionRateValue: document.getElementById('emissionRateValue') as HTMLElement,
      speed: document.getElementById('speed') as HTMLInputElement,
      speedValue: document.getElementById('speedValue') as HTMLElement,
      lifetime: document.getElementById('lifetime') as HTMLInputElement,
      lifetimeValue: document.getElementById('lifetimeValue') as HTMLElement,
      size: document.getElementById('size') as HTMLInputElement,
      sizeValue: document.getElementById('sizeValue') as HTMLElement,
      spreadAngle: document.getElementById('spreadAngle') as HTMLInputElement,
      spreadAngleValue: document.getElementById('spreadAngleValue') as HTMLElement,
      startColor: document.getElementById('startColor') as HTMLInputElement,
      endColor: document.getElementById('endColor') as HTMLInputElement,
      presetSelect: document.getElementById('presetSelect') as HTMLSelectElement,
      exportBtn: document.getElementById('exportBtn') as HTMLButtonElement,
      importBtn: document.getElementById('importBtn') as HTMLButtonElement,
      importFile: document.getElementById('importFile') as HTMLInputElement,
      controlPanel: document.getElementById('control-panel') as HTMLElement,
      particleCount: document.getElementById('particleCount') as HTMLElement,
      fpsCounter: document.getElementById('fpsCounter') as HTMLElement,
      modeLabel: document.getElementById('modeLabel') as HTMLElement,
      modeToggle: document.getElementById('modeToggle') as HTMLButtonElement,
      canvasWrapper: document.querySelector('.canvas-wrapper') as HTMLElement
    };

    this.initPresets();
    this.bindEvents();
    this.setupCollapsible();
  }

  private initPresets(): void {
    const presets = this.presetManager.getPresetNames();
    this.elements.presetSelect.innerHTML = '';
    
    for (const name of presets) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      this.elements.presetSelect.appendChild(option);
    }

    if (presets.length > 0) {
      this.presetManager.selectPreset(presets[0]);
    }
  }

  private bindEvents(): void {
    this.elements.emissionRate.addEventListener('input', () => this.updateConfig());
    this.elements.speed.addEventListener('input', () => this.updateConfig());
    this.elements.lifetime.addEventListener('input', () => this.updateConfig());
    this.elements.size.addEventListener('input', () => this.updateConfig());
    this.elements.spreadAngle.addEventListener('input', () => this.updateConfig());
    this.elements.startColor.addEventListener('input', () => this.updateConfig());
    this.elements.endColor.addEventListener('input', () => this.updateConfig());

    this.elements.presetSelect.addEventListener('change', (e) => {
      const select = e.target as HTMLSelectElement;
      this.elements.controlPanel.classList.remove('fade-in');
      void this.elements.controlPanel.offsetWidth;
      this.elements.controlPanel.classList.add('fade-in');
      this.presetManager.selectPreset(select.value);
    });

    this.elements.exportBtn.addEventListener('click', () => {
      const config = this.getConfig();
      this.presetManager.downloadConfig(config);
    });

    this.elements.importBtn.addEventListener('click', () => {
      this.elements.importFile.click();
    });

    this.elements.importFile.addEventListener('change', async (e) => {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0];
      if (file) {
        const config = await this.presetManager.loadFromFile(file);
        if (config) {
          this.setConfig(config);
        } else {
          alert('无法解析JSON文件，请检查文件格式');
        }
      }
      fileInput.value = '';
    });

    this.elements.modeToggle.addEventListener('click', () => {
      this.toggleMode();
    });

    this.presetManager.setOnPresetChange((config) => {
      this.setConfig(config);
    });
  }

  private setupCollapsible(): void {
    const headers = document.querySelectorAll('.panel-header.collapsible');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const section = header.closest('.panel-section');
        if (section) {
          section.classList.toggle('collapsed');
        }
      });
    });
  }

  private updateConfig(): void {
    const config: ParticleConfig = {
      emissionRate: parseFloat(this.elements.emissionRate.value),
      speed: parseFloat(this.elements.speed.value),
      lifetime: parseFloat(this.elements.lifetime.value),
      size: parseFloat(this.elements.size.value),
      spreadAngle: parseFloat(this.elements.spreadAngle.value),
      startColor: this.elements.startColor.value,
      endColor: this.elements.endColor.value
    };

    this.currentConfig = config;

    this.elements.emissionRateValue.textContent = Math.round(config.emissionRate).toString();
    this.elements.speedValue.textContent = Math.round(config.speed).toString();
    this.elements.lifetimeValue.textContent = config.lifetime.toFixed(1);
    this.elements.sizeValue.textContent = Math.round(config.size).toString();
    this.elements.spreadAngleValue.textContent = Math.round(config.spreadAngle).toString();

    if (this.onConfigChange) {
      this.onConfigChange(config);
    }
  }

  public setConfig(config: ParticleConfig): void {
    this.currentConfig = { ...config };

    this.elements.emissionRate.value = config.emissionRate.toString();
    this.elements.speed.value = config.speed.toString();
    this.elements.lifetime.value = config.lifetime.toString();
    this.elements.size.value = config.size.toString();
    this.elements.spreadAngle.value = config.spreadAngle.toString();
    this.elements.startColor.value = config.startColor;
    this.elements.endColor.value = config.endColor;

    this.elements.emissionRateValue.textContent = Math.round(config.emissionRate).toString();
    this.elements.speedValue.textContent = Math.round(config.speed).toString();
    this.elements.lifetimeValue.textContent = config.lifetime.toFixed(1);
    this.elements.sizeValue.textContent = Math.round(config.size).toString();
    this.elements.spreadAngleValue.textContent = Math.round(config.spreadAngle).toString();

    if (this.onConfigChange) {
      this.onConfigChange(config);
    }
  }

  public getConfig(): ParticleConfig {
    return { ...this.currentConfig };
  }

  public setOnConfigChange(callback: (config: ParticleConfig) => void): void {
    this.onConfigChange = callback;
  }

  public setOnModeChange(callback: (mode: AppMode) => void): void {
    this.onModeChange = callback;
  }

  private toggleMode(): void {
    const btn = this.elements.modeToggle;
    btn.classList.add('rotating');
    
    setTimeout(() => {
      btn.classList.remove('rotating');
    }, 300);

    if (this.currentMode === 'edit') {
      this.currentMode = 'play';
      this.elements.controlPanel.classList.add('hidden');
      this.elements.canvasWrapper.classList.add('fullscreen');
      this.elements.modeLabel.textContent = '播放模式';
      const icon = btn.querySelector('.mode-icon') as HTMLElement;
      icon.textContent = '▶️';
    } else {
      this.currentMode = 'edit';
      this.elements.controlPanel.classList.remove('hidden');
      this.elements.canvasWrapper.classList.remove('fullscreen');
      this.elements.modeLabel.textContent = '编辑模式';
      const icon = btn.querySelector('.mode-icon') as HTMLElement;
      icon.textContent = '✏️';
    }

    if (this.onModeChange) {
      this.onModeChange(this.currentMode);
    }
  }

  public getMode(): AppMode {
    return this.currentMode;
  }

  public setMode(mode: AppMode): void {
    if (this.currentMode !== mode) {
      this.toggleMode();
    }
  }

  public updateStats(particleCount: number, fps: number): void {
    this.elements.particleCount.textContent = particleCount.toString();
    this.elements.fpsCounter.textContent = Math.round(fps).toString();
  }
}
