import type { ParticleConfig, Preset } from '../types';

export class Presets {
  private presets: Map<string, Preset> = new Map();
  private onPresetChange: ((config: ParticleConfig) => void) | null = null;

  constructor() {
    this.initPresets();
  }

  private initPresets(): void {
    this.presets.set('fire', {
      name: '火焰',
      config: {
        emissionRate: 120,
        initialSpeed: 150,
        lifespan: 1.5,
        particleSize: 10,
        spreadAngle: 45,
        startColor: '#ffdd00',
        endColor: '#ff4400',
      },
    });

    this.presets.set('explosion', {
      name: '爆炸',
      config: {
        emissionRate: 200,
        initialSpeed: 350,
        lifespan: 0.8,
        particleSize: 12,
        spreadAngle: 360,
        startColor: '#ffffff',
        endColor: '#ff0000',
      },
    });

    this.presets.set('trail', {
      name: '尾迹',
      config: {
        emissionRate: 80,
        initialSpeed: 50,
        lifespan: 3.0,
        particleSize: 6,
        spreadAngle: 15,
        startColor: '#00e5ff',
        endColor: '#0066ff',
      },
    });

    this.presets.set('snow', {
      name: '雪花',
      config: {
        emissionRate: 60,
        initialSpeed: 40,
        lifespan: 5.0,
        particleSize: 5,
        spreadAngle: 180,
        startColor: '#ffffff',
        endColor: '#aaddff',
      },
    });

    this.presets.set('galaxy', {
      name: '星河',
      config: {
        emissionRate: 100,
        initialSpeed: 80,
        lifespan: 4.0,
        particleSize: 4,
        spreadAngle: 360,
        startColor: '#ff00ff',
        endColor: '#00ffff',
      },
    });

    this.presets.set('custom', {
      name: '自定义',
      config: {
        emissionRate: 50,
        initialSpeed: 100,
        lifespan: 2.0,
        particleSize: 8,
        spreadAngle: 360,
        startColor: '#ff6b35',
        endColor: '#ff0000',
      },
    });
  }

  setOnPresetChange(callback: (config: ParticleConfig) => void): void {
    this.onPresetChange = callback;
  }

  getPreset(key: string): ParticleConfig | null {
    const preset = this.presets.get(key);
    return preset ? { ...preset.config } : null;
  }

  getAllPresets(): string[] {
    return Array.from(this.presets.keys());
  }

  applyPreset(key: string): void {
    const config = this.getPreset(key);
    if (config && this.onPresetChange) {
      this.onPresetChange(config);
    }
  }

  exportToJson(config: ParticleConfig): string {
    return JSON.stringify(config, null, 2);
  }

  importFromJson(jsonString: string): ParticleConfig | null {
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

  private validateConfig(config: unknown): config is ParticleConfig {
    if (typeof config !== 'object' || config === null) return false;

    const c = config as Record<string, unknown>;

    return (
      typeof c.emissionRate === 'number' &&
      typeof c.initialSpeed === 'number' &&
      typeof c.lifespan === 'number' &&
      typeof c.particleSize === 'number' &&
      typeof c.spreadAngle === 'number' &&
      typeof c.startColor === 'string' &&
      typeof c.endColor === 'string' &&
      /^#[0-9A-Fa-f]{6}$/.test(c.startColor) &&
      /^#[0-9A-Fa-f]{6}$/.test(c.endColor)
    );
  }

  downloadJson(config: ParticleConfig, filename: string = 'particle-preset.json'): void {
    const json = this.exportToJson(config);
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
}
