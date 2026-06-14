export type EffectType = 'eq' | 'compressor' | 'reverb' | 'delay' | 'distortion';

export interface EffectParamConfig {
  name: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
  unit?: string;
}

export interface EffectConfig {
  type: EffectType;
  name: string;
  icon: string;
  params: EffectParamConfig[];
}

export interface EffectState {
  id: string;
  type: EffectType;
  params: Record<string, number>;
  bypassed: boolean;
  slotIndex: number;
}

export interface TrackState {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: EffectState[];
  duration: number;
  waveformData: Float32Array | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bpm: number;
}

export interface AudioEngineState {
  tracks: TrackState[];
  playback: PlaybackState;
  masterVolume: number;
}

export interface SelectionRange {
  trackId: string;
  startTime: number;
  endTime: number;
}

export const EFFECT_CONFIGS: Record<EffectType, EffectConfig> = {
  eq: {
    type: 'eq',
    name: '均衡器 EQ',
    icon: '🎚️',
    params: [
      { name: 'lowGain', label: '低频', min: -12, max: 12, default: 0, step: 0.5, unit: 'dB' },
      { name: 'midGain', label: '中频', min: -12, max: 12, default: 0, step: 0.5, unit: 'dB' },
      { name: 'highGain', label: '高频', min: -12, max: 12, default: 0, step: 0.5, unit: 'dB' },
    ],
  },
  compressor: {
    type: 'compressor',
    name: '压缩器 Compressor',
    icon: '🔊',
    params: [
      { name: 'threshold', label: '阈值', min: -100, max: 0, default: -24, step: 1, unit: 'dB' },
      { name: 'ratio', label: '比率', min: 1, max: 20, default: 4, step: 0.5, unit: ':1' },
      { name: 'attack', label: '启动', min: 0, max: 1, default: 0.003, step: 0.001, unit: 's' },
      { name: 'release', label: '释放', min: 0, max: 1, default: 0.25, step: 0.01, unit: 's' },
    ],
  },
  reverb: {
    type: 'reverb',
    name: '混响 Reverb',
    icon: '🌊',
    params: [
      { name: 'decay', label: '衰减', min: 0.1, max: 10, default: 2, step: 0.1, unit: 's' },
      { name: 'wet', label: '湿信号', min: 0, max: 1, default: 0.3, step: 0.01 },
    ],
  },
  delay: {
    type: 'delay',
    name: '延迟 Delay',
    icon: '⏱️',
    params: [
      { name: 'delayTime', label: '延迟时间', min: 0, max: 2, default: 0.3, step: 0.01, unit: 's' },
      { name: 'feedback', label: '反馈', min: 0, max: 0.9, default: 0.3, step: 0.01 },
      { name: 'wet', label: '湿信号', min: 0, max: 1, default: 0.3, step: 0.01 },
    ],
  },
  distortion: {
    type: 'distortion',
    name: '失真 Distortion',
    icon: '🔥',
    params: [
      { name: 'amount', label: '失真量', min: 0, max: 1, default: 0.5, step: 0.01 },
      { name: 'wet', label: '湿信号', min: 0, max: 1, default: 0.5, step: 0.01 },
    ],
  },
};

export const MAX_EFFECTS_PER_TRACK = 4;
export const WAVEFORM_SAMPLES = 1024;
