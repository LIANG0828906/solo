export interface Constellation {
  id: number;
  name: string;
  azimuth: number;
  elevation: number;
  description: string;
}

export interface ZodiacSign {
  id: number;
  letter: string;
  angle: number;
  color: string;
  name: string;
  description: string;
}

export interface PanelData {
  title: string;
  azimuth?: number;
  elevation?: number;
  description: string;
  type: 'constellation' | 'ring' | 'zodiac';
}

export type ViewMode = 'armillary' | 'astrodisk';

export interface AppState {
  mode: ViewMode;
  mix: number;
  isEclipsing: boolean;
  panelData: PanelData | null;
  setMode: (mode: ViewMode) => void;
  setMix: (value: number) => void;
  setEclipsing: (value: boolean) => void;
  openPanel: (data: PanelData) => void;
  closePanel: () => void;
}
