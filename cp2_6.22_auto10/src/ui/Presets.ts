import type { PresetData, ParticleConfig } from '../types';

const BUILT_IN_PRESETS: PresetData[] = [
  {
    name: '火焰',
    config: {
      emissionRate: 80,
      initialSpeed: 120,
      lifetime: 1.2,
      size: 8,
      spreadAngle: 30,
      startColor: '#ff6600',
      endColor: '#ff0044',
    }
  },
  {
    name: '爆炸',
    config: {
      emissionRate: 200,
      initialSpeed: 400,
      lifetime: 0.8,
      size: 10,
      spreadAngle: 360,
      startColor: '#ffee00',
      endColor: '#ff2200',
    }
  },
  {
    name: '尾迹',
    config: {
      emissionRate: 60,
      initialSpeed: 50,
      lifetime: 2.0,
      size: 4,
      spreadAngle: 15,
      startColor: '#00e5ff',
      endColor: '#0f3460',
    }
  },
  {
    name: '雪花',
    config: {
      emissionRate: 40,
      initialSpeed: 30,
      lifetime: 4.0,
      size: 3,
      spreadAngle: 60,
      startColor: '#ffffff',
      endColor: '#aaccff',
    }
  },
  {
    name: '星河',
    config: {
      emissionRate: 100,
      initialSpeed: 80,
      lifetime: 3.5,
      size: 2,
      spreadAngle: 360,
      startColor: '#e94560',
      endColor: '#00e5ff',
    }
  }
];

type PresetChangeCallback = (config: ParticleConfig) => void;

class PresetManager {
  private presets: PresetData[];
  private onChange: PresetChangeCallback | null = null;
  private selectEl: HTMLSelectElement | null = null;

  constructor() {
    this.presets = [...BUILT_IN_PRESETS];
  }

  setSelectElement(el: HTMLSelectElement): void {
    this.selectEl = el;
    this.populateSelect();
    el.addEventListener('change', () => {
      const preset = this.presets[el.selectedIndex];
      if (preset && this.onChange) {
        this.onChange(preset.config);
      }
    });
  }

  setOnChange(cb: PresetChangeCallback): void {
    this.onChange = cb;
  }

  getPresets(): PresetData[] {
    return this.presets;
  }

  getCurrentConfig(): ParticleConfig | null {
    if (!this.selectEl || this.selectEl.selectedIndex < 0) return null;
    return this.presets[this.selectEl.selectedIndex]?.config ?? null;
  }

  selectPresetByName(name: string): void {
    if (!this.selectEl) return;
    const idx = this.presets.findIndex(p => p.name === name);
    if (idx >= 0) {
      this.selectEl.selectedIndex = idx;
      if (this.onChange) {
        this.onChange(this.presets[idx].config);
      }
    }
  }

  applyConfig(config: ParticleConfig): void {
    if (this.onChange) {
      this.onChange(config);
    }
  }

  exportConfig(config: ParticleConfig): void {
    const data: PresetData = {
      name: 'custom',
      config: { ...config }
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `particle-preset-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importConfig(file: File, callback: (config: ParticleConfig) => void): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as PresetData;
        if (data.config) {
          callback(data.config);
        }
      } catch {
        console.error('Failed to import preset file');
      }
    };
    reader.readAsText(file);
  }

  private populateSelect(): void {
    if (!this.selectEl) return;
    this.selectEl.innerHTML = '';
    this.presets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = p.name;
      this.selectEl!.appendChild(opt);
    });
  }
}

export { PresetManager, BUILT_IN_PRESETS };
