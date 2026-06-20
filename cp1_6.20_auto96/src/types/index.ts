export interface FrameData {
  timestamp: number;
  power: number;
  temperature: number;
}

export interface CabinetData {
  id: string;
  cabinetId: number;
  x: number;
  z: number;
  power: number;
  temperature: number;
  zone: 'A' | 'B' | 'C';
  history: FrameData[];
}

export type DisplayMode = 'power' | 'temperature';
export type FilterZone = 'all' | 'A' | 'B' | 'C';

export interface AppState {
  items: CabinetData[];
  filter: FilterZone;
  mode: DisplayMode;
  progress: number;
  selectedId: string | null;
  hoveredId: string | null;
  setData: (items: CabinetData[]) => void;
  setFilter: (filter: FilterZone) => void;
  setMode: (mode: DisplayMode) => void;
  setProgress: (progress: number) => void;
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  getCurrentFrameData: (id: string) => FrameData;
  getCurrentValue: (id: string) => number;
}
