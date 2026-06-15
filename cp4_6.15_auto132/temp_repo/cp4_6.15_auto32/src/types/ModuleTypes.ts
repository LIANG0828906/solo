export type ModuleId = string;
export type ConnectionId = string;
export type PortId = string;

export type PortSignalType = 'audio' | 'control' | 'trigger';
export type PortDirection = 'input' | 'output';
export type ModuleType = 'oscillator' | 'filter' | 'envelope' | 'lfo' | 'reverb' | 'output';
export type WaveformType = 'sine' | 'sawtooth' | 'square' | 'triangle';
export type FilterVariant = 'lowpass' | 'highpass';

export interface Port {
  id: PortId;
  moduleId: ModuleId;
  name: string;
  direction: PortDirection;
  signalType: PortSignalType;
}

export interface Module {
  id: ModuleId;
  type: ModuleType;
  x: number;
  y: number;
  params: Record<string, number | string>;
  ports: Port[];
}

export interface Connection {
  id: ConnectionId;
  fromPortId: PortId;
  toPortId: PortId;
}

export interface PortTemplate {
  name: string;
  direction: PortDirection;
  signalType: PortSignalType;
}

export interface ModuleConfig {
  type: ModuleType;
  name: string;
  description: string;
  defaultParams: Record<string, number | string>;
  ports: PortTemplate[];
}

export const SIGNAL_COLORS: Record<PortSignalType, string> = {
  audio: '#00e5ff',
  control: '#ffd600',
  trigger: '#ff6d00',
};

export const MODULE_CONFIGS: Record<ModuleType, ModuleConfig> = {
  oscillator: {
    type: 'oscillator',
    name: '振荡器',
    description: '正弦/锯齿/方波/三角波',
    defaultParams: {
      waveform: 'sine',
      frequency: 440,
      detune: 0,
    },
    ports: [
      { name: '频率', direction: 'input', signalType: 'control' },
      { name: '输出', direction: 'output', signalType: 'audio' },
    ],
  },
  filter: {
    type: 'filter',
    name: '滤波器',
    description: '低通/高通滤波',
    defaultParams: {
      filterType: 'lowpass',
      frequency: 1000,
      Q: 1,
    },
    ports: [
      { name: '输入', direction: 'input', signalType: 'audio' },
      { name: '频率', direction: 'input', signalType: 'control' },
      { name: 'Q值', direction: 'input', signalType: 'control' },
      { name: '输出', direction: 'output', signalType: 'audio' },
    ],
  },
  envelope: {
    type: 'envelope',
    name: 'ADSR包络',
    description: 'Attack/Decay/Sustain/Release',
    defaultParams: {
      attack: 0.05,
      decay: 0.2,
      sustain: 0.5,
      release: 0.3,
    },
    ports: [
      { name: '触发', direction: 'input', signalType: 'trigger' },
      { name: '输出', direction: 'output', signalType: 'control' },
    ],
  },
  lfo: {
    type: 'lfo',
    name: 'LFO',
    description: '低频振荡器',
    defaultParams: {
      waveform: 'sine',
      frequency: 5,
      depth: 100,
    },
    ports: [
      { name: '输出', direction: 'output', signalType: 'control' },
    ],
  },
  reverb: {
    type: 'reverb',
    name: '混响',
    description: '卷积混响效果',
    defaultParams: {
      decay: 2,
      wet: 0.5,
    },
    ports: [
      { name: '输入', direction: 'input', signalType: 'audio' },
      { name: '输出', direction: 'output', signalType: 'audio' },
    ],
  },
  output: {
    type: 'output',
    name: '主输出',
    description: '连接到扬声器',
    defaultParams: {
      volume: 0.5,
    },
    ports: [
      { name: '输入', direction: 'input', signalType: 'audio' },
    ],
  },
};

let _idCounter = 0;
export function generateId(): string {
  _idCounter += 1;
  return `id_${Date.now()}_${_idCounter}`;
}
