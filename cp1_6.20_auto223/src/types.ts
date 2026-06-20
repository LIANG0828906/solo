export interface SpectrumFrame {
  time: number;
  frequencies: Float32Array;
  energy: {
    low: number;
    mid: number;
    high: number;
  };
}

export interface MarkerEvent {
  id: string;
  index: number;
  time: number;
  frequencyRange: [number, number];
  amplitude: number;
  position: { x: number; y: number; z: number };
  createdAt: number;
}

export interface TerrainData {
  vertices: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  dimensions: { width: number; depth: number; heightScale: number };
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface ExportData {
  exportedAt: string;
  audioDuration: number;
  markers: Omit<MarkerEvent, 'createdAt'>[];
}
