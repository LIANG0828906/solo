export type QualityLevel = 'low' | 'medium' | 'high';

export interface GameConfig {
  matchDistanceThreshold: number;
  particleCount: number;
  enableBloom: boolean;
  enableVignette: boolean;
  animationSmoothness: number;
}

const QUALITY_PRESETS: Record<QualityLevel, GameConfig> = {
  low: {
    matchDistanceThreshold: 2.5,
    particleCount: 400,
    enableBloom: false,
    enableVignette: true,
    animationSmoothness: 0.15,
  },
  medium: {
    matchDistanceThreshold: 2.2,
    particleCount: 800,
    enableBloom: true,
    enableVignette: true,
    animationSmoothness: 0.2,
  },
  high: {
    matchDistanceThreshold: 2.0,
    particleCount: 1200,
    enableBloom: true,
    enableVignette: true,
    animationSmoothness: 0.25,
  },
};

const detectDeviceCapability = (): QualityLevel => {
  if (typeof navigator === 'undefined') return 'high';

  const cores = (navigator.hardwareConcurrency || 4) as number;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;

  if (cores <= 2 || memory <= 2) return 'low';
  if (cores <= 4 || memory <= 4) return 'medium';
  return 'high';
};

let currentQuality: QualityLevel = detectDeviceCapability();
let currentConfig: GameConfig = { ...QUALITY_PRESETS[currentQuality] };

const scaleFactor = (() => {
  if (typeof window === 'undefined') return 1;
  const baseWidth = 1920;
  return Math.max(0.8, Math.min(1.2, window.innerWidth / baseWidth));
})();

currentConfig.matchDistanceThreshold *= scaleFactor;

export const getConfig = (): GameConfig => ({ ...currentConfig });

export const getQuality = (): QualityLevel => currentQuality;

export const setQuality = (quality: QualityLevel) => {
  currentQuality = quality;
  currentConfig = { ...QUALITY_PRESETS[quality] };
  currentConfig.matchDistanceThreshold *= scaleFactor;
};

export const MATCH_DISTANCE_THRESHOLD = () => currentConfig.matchDistanceThreshold;
export const PARTICLE_COUNT = () => currentConfig.particleCount;
export const ANIMATION_SMOOTHNESS = () => currentConfig.animationSmoothness;
export const BLOOM_ENABLED = () => currentConfig.enableBloom;
export const VIGNETTE_ENABLED = () => currentConfig.enableVignette;
