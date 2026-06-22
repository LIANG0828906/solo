export interface LightParams {
  sunPosition: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  shadowBlur: number;
  skyColor: string;
  moonIntensity: number;
  moonColor: string;
}

export interface TimePreset {
  id: string;
  time: number;
  name: string;
  createdAt: string;
}

export interface TimeContextValue {
  time: number;
  setTime: (t: number) => void;
  lightParams: LightParams;
  savePreset: () => Promise<void>;
  loadPresets: () => Promise<void>;
  presets: TimePreset[];
  applyPreset: (id: string) => void;
  isLoading: boolean;
  loadProgress: number;
}

export type TimeOfDayLabel = '清晨' | '早晨' | '正午' | '午后' | '黄昏' | '夜晚';

export interface PresetTimeCard {
  label: TimeOfDayLabel;
  time: number;
}
