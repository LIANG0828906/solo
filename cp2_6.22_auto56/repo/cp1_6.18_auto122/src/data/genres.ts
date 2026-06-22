export interface SoundConfig {
  oscillatorType: OscillatorType;
  baseFrequency: number;
  harmonics: number[];
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface Genre {
  id: string;
  name: string;
  color: string;
  volume: number;
  rhythmPattern: boolean[][];
  soundConfig: SoundConfig;
}

export const GENRE_COLORS: Record<string, string> = {
  jazz: '#F4A261',
  electronic: '#2A9D8F',
  rock: '#E76F51',
  classical: '#E9C46A',
};

export const BPM = 120;

export const DEFAULT_RHYTHM: boolean[][] = [
  [true, false, false, false, true, false, false, false],
  [true, false, false, false, true, false, false, false],
  [true, false, false, false, true, false, false, false],
  [true, false, false, false, true, false, false, false],
];

export const genres: Genre[] = [
  {
    id: 'jazz',
    name: '爵士',
    color: '#F4A261',
    volume: 75,
    rhythmPattern: [
      [true, false, false, true, false, false, true, false],
      [false, true, false, false, true, false, false, false],
      [true, false, true, false, false, false, true, false],
      [false, false, true, false, true, false, false, true],
    ],
    soundConfig: {
      oscillatorType: 'sine',
      baseFrequency: 220,
      harmonics: [1, 0.5, 0.25, 0.1],
      attack: 0.05,
      decay: 0.15,
      sustain: 0.6,
      release: 0.3,
    },
  },
  {
    id: 'electronic',
    name: '电子',
    color: '#2A9D8F',
    volume: 80,
    rhythmPattern: [
      [true, false, false, false, true, false, false, false],
      [false, false, true, false, false, false, true, false],
      [true, false, false, true, false, false, true, false],
      [false, false, true, false, true, false, false, false],
    ],
    soundConfig: {
      oscillatorType: 'sawtooth',
      baseFrequency: 330,
      harmonics: [1, 0.7, 0.4, 0.2],
      attack: 0.01,
      decay: 0.1,
      sustain: 0.4,
      release: 0.1,
    },
  },
  {
    id: 'rock',
    name: '摇滚',
    color: '#E76F51',
    volume: 85,
    rhythmPattern: [
      [true, false, true, false, true, false, true, false],
      [true, false, true, false, true, false, true, false],
      [true, false, true, false, true, false, true, false],
      [true, false, true, false, true, false, true, false],
    ],
    soundConfig: {
      oscillatorType: 'square',
      baseFrequency: 165,
      harmonics: [1, 0.3, 0.15, 0.05],
      attack: 0.01,
      decay: 0.08,
      sustain: 0.5,
      release: 0.05,
    },
  },
  {
    id: 'classical',
    name: '古典',
    color: '#E9C46A',
    volume: 70,
    rhythmPattern: [
      [true, false, false, false, false, false, false, false],
      [false, false, false, false, true, false, false, false],
      [false, false, true, false, false, false, false, false],
      [false, false, false, false, false, false, true, false],
    ],
    soundConfig: {
      oscillatorType: 'triangle',
      baseFrequency: 440,
      harmonics: [1, 0.6, 0.3, 0.15],
      attack: 0.1,
      decay: 0.2,
      sustain: 0.7,
      release: 0.4,
    },
  },
];
