export enum WaveType {
  SINE = 'sine',
  SQUARE = 'square',
  TRIANGLE = 'triangle',
  SAWTOOTH = 'sawtooth',
}

export enum TriggerMode {
  AUTO = 'auto',
  NORMAL = 'normal',
  SINGLE = 'single',
}

export interface WaveParams {
  type: WaveType;
  frequency: number;
  amplitude: number;
  phase: number;
  dutyCycle: number;
  noiseLevel: number;
  mix: number;
  enabled: boolean;
}

export interface WavePoint {
  time: number;
  voltage: number;
}

export type ChannelKey = 'ch1' | 'ch2' | 'ch3' | 'ch4';

export interface ChannelState {
  ch1: WaveParams;
  ch2: WaveParams;
  ch3: WaveParams;
  ch4: WaveParams;
}

export interface CursorState {
  h1: number;
  h2: number;
  v1: number;
  v2: number;
}

export interface StoreState extends ChannelState {
  masterMix: number;
  timeBase: number;
  triggerMode: TriggerMode;
  triggerSource: ChannelKey;
  triggerLevel: number;
  sampleRate: number;
  cursors: CursorState;
  showIndividualWaves: boolean;
  showCursors: boolean;

  setChannelParam: <K extends keyof WaveParams>(
    ch: ChannelKey,
    key: K,
    value: WaveParams[K],
  ) => void;
  setMasterMix: (v: number) => void;
  setTimeBase: (v: number) => void;
  setTriggerMode: (m: TriggerMode) => void;
  setTriggerSource: (s: ChannelKey) => void;
  setTriggerLevel: (v: number) => void;
  setCursor: (key: keyof CursorState, value: number) => void;
  toggleShowIndividual: () => void;
  toggleShowCursors: () => void;
  setSampleRate: (r: number) => void;
}

export const WAVE_COLORS: Record<WaveType, string> = {
  [WaveType.SINE]: '#FF6B6B',
  [WaveType.SQUARE]: '#4FC3F7',
  [WaveType.TRIANGLE]: '#81C784',
  [WaveType.SAWTOOTH]: '#FFB74D',
};

export const CHANNEL_COLORS: Record<ChannelKey, string> = {
  ch1: '#FF6B6B',
  ch2: '#4FC3F7',
  ch3: '#81C784',
  ch4: '#FFB74D',
};

export const WAVE_LABELS: Record<WaveType, string> = {
  [WaveType.SINE]: '正弦波',
  [WaveType.SQUARE]: '方波',
  [WaveType.TRIANGLE]: '三角波',
  [WaveType.SAWTOOTH]: '锯齿波',
};
