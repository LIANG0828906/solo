export type ColorMode = 'additive' | 'subtractive';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface LightState {
  r: number;
  g: number;
  b: number;
}

export interface FilterState {
  c: number;
  m: number;
  y: number;
}

export interface FavoriteColor {
  id: string;
  rgb: RGB;
  hex: string;
  timestamp: number;
  source: 'picker' | 'target' | 'manual';
}

export interface PickerPixel {
  x: number;
  y: number;
  rgb: RGB;
}

export interface PickerState {
  visible: boolean;
  canvasX: number;
  canvasY: number;
  pixels: PickerPixel[];
  centerColor: RGB;
}

export interface MatchSuggestion {
  params: LightState | FilterState;
  result: RGB;
  deltaE: number;
  similarity: number;
  mode: ColorMode;
}
