export interface SpectrumData {
  duration: number;
  frameCount: number;
  frameRate: number;
  binsPerFrame: number;
  frames: number[][];
}

export type ThemeType = 'aurora' | 'neon' | 'ink';

export interface ThemeConfig {
  background: string;
  ambientColor: string;
  particleColorStart: string;
  particleColorEnd: string;
  surfaceColorStart: string;
  surfaceColorEnd: string;
  particleSizeMultiplier: number;
}

export interface VisualizerState {
  audioFile: File | null;
  spectrumData: SpectrumData | null;
  currentFrame: number;
  isPlaying: boolean;
  particleCount: number;
  particleSize: number;
  particleColorStart: string;
  particleColorEnd: string;
  rotationSpeed: number;
  clusteringAmount: number;
  theme: ThemeType;
  loopStart: number | null;
  loopEnd: number | null;
  isUploading: boolean;
  uploadProgress: number;
}

export interface VisualizerActions {
  setAudioFile: (file: File | null) => void;
  setSpectrumData: (data: SpectrumData | null) => void;
  setCurrentFrame: (frame: number) => void;
  setPlaying: (playing: boolean) => void;
  setParticleCount: (count: number) => void;
  setParticleSize: (size: number) => void;
  setParticleColorStart: (color: string) => void;
  setParticleColorEnd: (color: string) => void;
  setRotationSpeed: (speed: number) => void;
  setClusteringAmount: (amount: number) => void;
  setTheme: (theme: ThemeType) => void;
  setLoopStart: (frame: number | null) => void;
  setLoopEnd: (frame: number | null) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
}
