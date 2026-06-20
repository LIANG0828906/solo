export type VisualizerMode = 'bars' | 'waveform' | 'circular' | 'particles';

export interface VisualizerParams {
  barCount: number;
  particleSize: number;
  backgroundHue: number;
  backgroundSaturation: number;
  backgroundLightness: number;
  sensitivity: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  buffered: number;
}

export const DEFAULT_PARAMS: VisualizerParams = {
  barCount: 64,
  particleSize: 4,
  backgroundHue: 240,
  backgroundSaturation: 30,
  backgroundLightness: 12,
  sensitivity: 1.0,
};

export const PARAMS_KEY = 'visualizer-params';

export function loadParams(): VisualizerParams {
  try {
    const raw = localStorage.getItem(PARAMS_KEY);
    if (raw) return { ...DEFAULT_PARAMS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PARAMS };
}

export function saveParams(params: VisualizerParams): void {
  try {
    localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
  } catch {}
}
