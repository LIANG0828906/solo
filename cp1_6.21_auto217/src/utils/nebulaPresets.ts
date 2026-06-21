export interface NebulaPreset {
  name: string;
  id: string;
  centerColor: string;
  edgeColor: string;
  density: number;
  rotationSpeed: number;
  particleSize: number;
  waveAmplitude: number;
  waveFrequency: number;
}

export const PRESETS: Record<string, NebulaPreset> = {
  galaxy: {
    name: '银河',
    id: 'galaxy',
    centerColor: '#FF6B35',
    edgeColor: '#7C3AED',
    density: 8000,
    rotationSpeed: 0.001,
    particleSize: 0.15,
    waveAmplitude: 0.5,
    waveFrequency: 0.002,
  },
  rosette: {
    name: '玫瑰星云',
    id: 'rosette',
    centerColor: '#F43F5E',
    edgeColor: '#EC4899',
    density: 10000,
    rotationSpeed: 0.0008,
    particleSize: 0.18,
    waveAmplitude: 0.3,
    waveFrequency: 0.003,
  },
  crab: {
    name: '蟹状星云',
    id: 'crab',
    centerColor: '#FBBF24',
    edgeColor: '#EF4444',
    density: 12000,
    rotationSpeed: 0.0015,
    particleSize: 0.12,
    waveAmplitude: 0.7,
    waveFrequency: 0.004,
  },
  eagle: {
    name: '鹰状星云',
    id: 'eagle',
    centerColor: '#34D399',
    edgeColor: '#6366F1',
    density: 9000,
    rotationSpeed: 0.0012,
    particleSize: 0.16,
    waveAmplitude: 0.4,
    waveFrequency: 0.0025,
  },
};

export const DEFAULT_PRESET = PRESETS.galaxy;
