export interface Channel {
  id: string;
  name: string;
  genre: string;
  frequency: number;
  angle: number;
  themeColor: string;
  audioUrl: string;
  description: string;
  currentTrack: string;
}

export interface TuningState {
  currentAngle: number;
  currentFrequency: number;
  signalStrength: number;
  nearestChannel: Channel | null;
  frequencyDeviation: number;
}

export interface NoiseParams {
  intensity: number;
  frequency: number;
  filterQ: number;
}

export interface AudioState {
  isPlaying: boolean;
  volume: number;
  noiseMix: number;
  spectrumData: Uint8Array;
}

export interface RadioContextType {
  channels: Channel[];
  tuningState: TuningState;
  audioState: AudioState;
  noiseParams: NoiseParams;
  setTuningAngle: (angle: number) => void;
  setVolume: (volume: number) => void;
  setNoiseMix: (mix: number) => void;
}
