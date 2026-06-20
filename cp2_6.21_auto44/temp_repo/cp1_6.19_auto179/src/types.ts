export type MotionMode = 'vortex' | 'breathing' | 'sinking' | 'mixed';

export interface ParticleConfig {
  primaryColor: string;
  secondaryColor: string;
  motionMode: MotionMode;
  speed: number;
  hasJitter: boolean;
  jitterAmount: number;
  hasTwinkle: boolean;
  baseOpacity: number;
  particleCount: number;
  sphereRadius: number;
  cyclePeriod: number;
}

export type EmotionKey = 'excited' | 'calm' | 'anxious' | 'sad' | 'happy';

export interface EmotionInfo {
  key: EmotionKey;
  label: string;
  color: string;
}
