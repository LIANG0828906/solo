export type EmotionType = 'joy' | 'sadness' | 'anger' | 'calm';

export interface EmotionColorDef {
  type: EmotionType;
  label: string;
  hex: string;
  hsl: { h: number; s: number; l: number };
}

export interface EmotionSegment {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  emotion: EmotionType;
  weight: number;
}

export interface EmotionAnalysisResult {
  weights: Record<EmotionType, number>;
  segments: EmotionSegment[];
  rawText: string;
}

export interface ParticleConfig {
  maxParticles: number;
  minSize: number;
  maxSize: number;
  minSpeed: number;
  maxSpeed: number;
  hoverScale: number;
  dimOpacity: number;
  bloomStrength: number;
}

export interface ParticleData {
  id: string;
  emotion: EmotionType;
  basePosition: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  size: number;
  baseSize: number;
  colorHex: string;
  opacity: number;
  targetOpacity: number;
  segmentId: string;
  clusterRadius: number;
  phase: number;
}

export const EMOTION_COLORS: Record<EmotionType, EmotionColorDef> = {
  joy: {
    type: 'joy',
    label: '喜悦',
    hex: '#FFD93D',
    hsl: { h: 49, s: 100, l: 62 }
  },
  sadness: {
    type: 'sadness',
    label: '悲伤',
    hex: '#6C63FF',
    hsl: { h: 243, s: 100, l: 70 }
  },
  anger: {
    type: 'anger',
    label: '愤怒',
    hex: '#FF6B6B',
    hsl: { h: 0, s: 100, l: 71 }
  },
  calm: {
    type: 'calm',
    label: '宁静',
    hex: '#6BCB77',
    hsl: { h: 128, s: 48, l: 60 }
  }
};

export const EMOTION_ORDER: EmotionType[] = ['joy', 'sadness', 'anger', 'calm'];

export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  maxParticles: 12000,
  minSize: 0.3,
  maxSize: 1.2,
  minSpeed: 0.02,
  maxSpeed: 0.08,
  hoverScale: 1.5,
  dimOpacity: 0.15,
  bloomStrength: 1.2
};

export const DEFAULT_EMOTION_WEIGHTS: Record<EmotionType, number> = {
  joy: 0,
  sadness: 0,
  anger: 0,
  calm: 0
};
