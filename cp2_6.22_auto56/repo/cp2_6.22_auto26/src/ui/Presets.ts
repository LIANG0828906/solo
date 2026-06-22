import type { ParticleConfig, Preset } from '../types';

const defaultPresets: Preset[] = [
  {
    name: '火焰',
    config: {
      emissionRate: 80,
      speed: 150,
      lifetime: 1.5,
      size: 12,
      spreadAngle: 45,
      startColor: '#ffff00',
      endColor: '#ff3300'
    }
  },
  {
    name: '爆炸',
    config: {
      emissionRate: 200,
      speed: 400,
      lifetime: 0.8,
      size: 15,
      spreadAngle: 360,
      startColor: '#ffffff',
      endColor: '#ff6600'
    }
  },
  {
    name: '尾迹',
    config: {
      emissionRate: 60,
      speed: 50,
      lifetime: 1.0,
      size: 6,
      spreadAngle: 20,
      startColor: '#00e5ff',
      endColor: '#0066ff'
    }
  },
  {
    name: '雪花',
    config: {
      emissionRate: 40,
      speed: 80,
      lifetime: 5.0,
      size: 5,
      spreadAngle: 30,
      startColor: '#ffffff',
      endColor: '#aaccff'
    }
  },
  {
    name: '星河',
    config: {
      emissionRate: 100,
      speed: 20,
      lifetime: 3.0,
      size: 3,
      spreadAngle: 360,
      startColor: '#ffffff',
      endColor: '#6633ff'
    }
  }
];

export class PresetManager {
  private presets: Preset[] = [];
  private onPresetChange: ((config: ParticleConfig) => void) | null = null;

  constructor() {
    this.presets = JSON.parse(JSON.stringify(defaultPresets));
  }

  public setOnPresetChange(callback: (config: ParticleConfig) => void): void {
    this.onPresetChange = callback;
  }

  public getPresets(): Preset[] {
    return [...this.presets];
  }

  public getPresetNames(): string[] {
    return this.presets.map(p => p.name);
  }

  public getPresetConfig(name: string): ParticleConfig | null {
    const preset = this.presets.find(p => p.name === name);
    return preset ? { ...preset.config } : null;
  }

  public selectPreset(name: string): void {
    const config = this.getPresetConfig(name);
    if (config && this.onPresetChange) {
      this.onPresetChange(config);
    }
  }

  public addPreset(name: string, config: ParticleConfig): void {
    if (this.presets.some(p => p.name === name)) {
      const idx = this.presets.findIndex(p => p.name === name);
      this.presets[idx] = { name, config: { ...config } };
    } else {
      this.presets.push({ name, config: { ...config } });
    }
  }

  public exportConfig(config: ParticleConfig): string {
    return JSON.stringify(config, null, 2);
  }

  public importConfig(jsonString: string): ParticleConfig | null {
    try {
      const config = JSON.parse(jsonString) as ParticleConfig;
      if (this.validateConfig(config)) {
        return config;
      }
      return null;
    } catch {
      return null;
    }
  }

  private validateConfig(config: ParticleConfig): boolean {
    const requiredKeys: (keyof ParticleConfig)[] = [
      'emissionRate', 'speed', 'lifetime', 'size', 'spreadAngle', 'startColor', 'endColor'
    ];
    return requiredKeys.every(key => key in config && config[key] !== undefined && config[key] !== null);
  }

  public downloadConfig(config: ParticleConfig, filename: string = 'particle-preset.json'): void {
    const json = this.exportConfig(config);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public loadFromFile(file: File): Promise<ParticleConfig | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const config = this.importConfig(content);
        resolve(config);
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  }
}
