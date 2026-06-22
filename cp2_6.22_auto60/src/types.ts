export type VisualMode = 'particles' | 'bars' | 'stars';

export interface VisualizerParams {
  mode: VisualMode;
  particleCount: number;
  particleSize: number;
  speed: number;
  colorSaturation: number;
  backgroundBlur: number;
  mouseColorMode: boolean;
}

export interface BeatMarker {
  id: string;
  time: number;
  color: 'red' | 'blue' | 'green' | null;
}
