import type { InstrumentType, ChordType } from '@/types';

export const instrumentColors: Record<InstrumentType, string> = {
  vocal: '#FFCDD2',
  guitar: '#C8E6C9',
  keyboard: '#BBDEFB',
  drums: '#FFE0B2',
  bass: '#D1C4E9',
};

export const instrumentEmojis: Record<InstrumentType, string> = {
  vocal: '🎤',
  guitar: '🎸',
  keyboard: '🎹',
  drums: '🥁',
  bass: '🎻',
};

export const instrumentLabels: Record<InstrumentType, string> = {
  vocal: '人声',
  guitar: '吉他',
  keyboard: '键盘',
  drums: '鼓组',
  bass: '贝斯',
};

export const chordTypeColors: Record<ChordType, string> = {
  Major: '#EF5350',
  Minor: '#42A5F5',
  Dim: '#AB47BC',
  Aug: '#FFA726',
  Sus4: '#66BB6A',
  Sus2: '#26C6DA',
  '7th': '#EC407A',
};

export const chordRoots: string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

export const chordTypes: ChordType[] = [
  'Major', 'Minor', 'Dim', 'Aug', 'Sus4', 'Sus2', '7th',
];

export const chordTypeShort: Record<ChordType, string> = {
  Major: '',
  Minor: 'm',
  Dim: 'dim',
  Aug: 'aug',
  Sus4: 'sus4',
  Sus2: 'sus2',
  '7th': '7',
};
