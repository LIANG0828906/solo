export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface ColorTheme {
  name: string;
  id: string;
  colors: string[];
}

export interface ExplosionParticle {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  radius: number;
  colorIndex: number;
  opacity: number;
  startTime: number;
  duration: number;
  frequency: number;
}

export interface NoteParticle {
  id: number;
  x: number;
  y: number;
  radius: number;
  colorIndex: number;
  brightness: number;
  opacity: number;
  createdAt: number;
  lifetime: number;
  frequency: number;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'aurora',
    name: '极光梦境',
    colors: ['#00F5D4', '#00BBF9', '#FEE440', '#F15BB5', '#9B5DE5'],
  },
  {
    id: 'lava',
    name: '熔岩炽热',
    colors: ['#FF6B35', '#F7C59F', '#EFEFD0', '#004E64', '#00A5CF'],
  },
  {
    id: 'ocean',
    name: '深海幽蓝',
    colors: ['#0B132B', '#1C2541', '#3A506B', '#5BC0BE', '#FFFFFF'],
  },
  {
    id: 'neon',
    name: '霓虹电光',
    colors: ['#FF0054', '#FFBD00', '#00F5FF', '#9D4EDD', '#FF006E'],
  },
  {
    id: 'nature',
    name: '草木清新',
    colors: ['#606C38', '#283618', '#DDA15E', '#BC6C25', '#FEFAE0'],
  },
];

export const WAVEFORM_INFO: { type: WaveformType; label: string; icon: string }[] = [
  { type: 'sine', label: '正弦波', icon: '∿' },
  { type: 'square', label: '方波', icon: '⊓⊔' },
  { type: 'sawtooth', label: '锯齿波', icon: '⋰⋰' },
  { type: 'triangle', label: '三角波', icon: '△' },
];
