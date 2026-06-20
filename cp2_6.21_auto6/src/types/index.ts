export type ElementType = 'beatBars' | 'particleGalaxy' | 'waveSphere' | 'lightWall';

export type ThemeType = 'cyberpunk' | 'aurora' | 'lava';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  lightColor: string;
}

export interface SceneElement {
  id: string;
  type: ElementType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  sensitivity: number;
  rotationSpeed: number;
  barCount?: number;
  particleCount?: number;
  waveDetail?: number;
  wallSize?: [number, number];
  flickerFrequency?: number;
}

export interface AppState {
  elements: SceneElement[];
  selectedElementId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  theme: ThemeType;
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  isRecording: boolean;
  audioLoaded: boolean;
}

export interface AppActions {
  addElement: (type: ElementType) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, props: Partial<SceneElement>) => void;
  selectElement: (id: string | null) => void;
  setTheme: (theme: ThemeType) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setFrequencyData: (data: Uint8Array) => void;
  setTimeData: (data: Uint8Array) => void;
  setRecording: (recording: boolean) => void;
  setAudioLoaded: (loaded: boolean) => void;
  syncAllElements: () => void;
}

export const themes: Record<ThemeType, ThemeColors> = {
  cyberpunk: {
    primary: '#ff00ff',
    secondary: '#00ffff',
    accent: '#ffff00',
    bg: '#0a0a1a',
    lightColor: '#ff00ff',
  },
  aurora: {
    primary: '#0000ff',
    secondary: '#00ff88',
    accent: '#88ffff',
    bg: '#0a0a1a',
    lightColor: '#00ff88',
  },
  lava: {
    primary: '#ff3300',
    secondary: '#ff8800',
    accent: '#ffcc00',
    bg: '#0a0a1a',
    lightColor: '#ff8800',
  },
};

export const elementDefaults: Record<ElementType, Partial<SceneElement>> = {
  beatBars: {
    barCount: 32,
    sensitivity: 1,
    scale: 1,
    rotationSpeed: 0.2,
  },
  particleGalaxy: {
    particleCount: 1000,
    sensitivity: 1,
    scale: 1,
    rotationSpeed: 0.5,
  },
  waveSphere: {
    waveDetail: 32,
    sensitivity: 1,
    scale: 1,
    rotationSpeed: 0.3,
  },
  lightWall: {
    wallSize: [4, 3],
    flickerFrequency: 2,
    sensitivity: 1,
    scale: 1,
    rotationSpeed: 0,
  },
};
