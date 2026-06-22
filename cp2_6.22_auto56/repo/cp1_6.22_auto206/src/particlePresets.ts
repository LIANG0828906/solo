export interface ParticleParams {
  count: number;
  emissionRadius: number;
  lifetime: number;
  vortexStrength: number;
  waveFrequency: number;
  gravity: number;
  spreadAngle: number;
}

export interface PresetConfig {
  id: string;
  name: string;
  icon: string;
  params: ParticleParams;
  transitionDuration: number;
}

export const defaultParams: ParticleParams = {
  count: 5000,
  emissionRadius: 5,
  lifetime: 3,
  vortexStrength: 2,
  waveFrequency: 1,
  gravity: 0,
  spreadAngle: 360,
};

export const presets: PresetConfig[] = [
  {
    id: 'spiral',
    name: '螺旋星云',
    icon: 'Sparkles',
    params: {
      count: 5000,
      emissionRadius: 5,
      lifetime: 3,
      vortexStrength: 2.5,
      waveFrequency: 1.2,
      gravity: 0,
      spreadAngle: 360,
    },
    transitionDuration: 1000,
  },
  {
    id: 'explosion',
    name: '爆炸',
    icon: 'Zap',
    params: {
      count: 8000,
      emissionRadius: 1,
      lifetime: 1.5,
      vortexStrength: 0.5,
      waveFrequency: 0.5,
      gravity: 0.3,
      spreadAngle: 180,
    },
    transitionDuration: 1000,
  },
  {
    id: 'wave',
    name: '波浪',
    icon: 'Waves',
    params: {
      count: 6000,
      emissionRadius: 8,
      lifetime: 4,
      vortexStrength: 0.3,
      waveFrequency: 2.5,
      gravity: 0,
      spreadAngle: 90,
    },
    transitionDuration: 1000,
  },
  {
    id: 'vortex',
    name: '旋风',
    icon: 'Tornado',
    params: {
      count: 7000,
      emissionRadius: 3,
      lifetime: 2.5,
      vortexStrength: 4.5,
      waveFrequency: 0.8,
      gravity: -0.2,
      spreadAngle: 45,
    },
    transitionDuration: 1000,
  },
  {
    id: 'waterfall',
    name: '瀑布',
    icon: 'CloudRain',
    params: {
      count: 10000,
      emissionRadius: 4,
      lifetime: 2,
      vortexStrength: 0.8,
      waveFrequency: 1.5,
      gravity: 0.8,
      spreadAngle: 60,
    },
    transitionDuration: 1000,
  },
];

export function lerpParams(
  from: ParticleParams,
  to: ParticleParams,
  t: number
): ParticleParams {
  const easeT = t * t * (3 - 2 * t);
  return {
    count: Math.round(from.count + (to.count - from.count) * easeT),
    emissionRadius: from.emissionRadius + (to.emissionRadius - from.emissionRadius) * easeT,
    lifetime: from.lifetime + (to.lifetime - from.lifetime) * easeT,
    vortexStrength: from.vortexStrength + (to.vortexStrength - from.vortexStrength) * easeT,
    waveFrequency: from.waveFrequency + (to.waveFrequency - from.waveFrequency) * easeT,
    gravity: from.gravity + (to.gravity - from.gravity) * easeT,
    spreadAngle: from.spreadAngle + (to.spreadAngle - from.spreadAngle) * easeT,
  };
}
