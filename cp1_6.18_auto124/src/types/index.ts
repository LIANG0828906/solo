export interface PropElement {
  id: string;
  type: 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  borderColor: string;
}

export interface Character {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

export interface LightKeyframe {
  id: string;
  timestamp: number;
  color: { r: number; g: number; b: number };
  intensity: number;
}

export interface SoundKeyframe {
  id: string;
  timestamp: number;
  name: string;
  audioData: string;
  duration: number;
}

export interface TimelineEntry {
  timestamp: number;
  lightColor: { r: number; g: number; b: number } | null;
  lightIntensity: number | null;
  soundId: string | null;
}

export interface DragState {
  elementId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export type ActiveTool = 'rect' | 'circle' | 'character' | 'light' | 'sound' | null;
