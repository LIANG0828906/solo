export interface CellData {
  id: number;
  diameter: number;
  fluorescence: number;
  viability: number;
  cellType: string;
}

export type NumericFeature = 'diameter' | 'fluorescence' | 'viability';

export interface AxisMapping {
  x: NumericFeature;
  y: NumericFeature;
  z: NumericFeature;
}

export interface VisualConfig {
  sizeRange: [number, number];
  colorRange: {
    low: { h: number; s: number; l: number };
    mid: { h: number; s: number; l: number };
    high: { h: number; s: number; l: number };
  };
  animationDuration: {
    position: number;
    color: number;
  };
}

export interface SelectionStats {
  count: number;
  avgDiameter: number;
  avgFluorescence: number;
  avgViability: number;
  selectedCells: CellData[];
}

export interface ScatterPlotCallbacks {
  onSelectionChange: (stats: SelectionStats | null) => void;
  onCellClick: (cell: CellData) => void;
  onCellHover: (cell: CellData | null) => void;
}

export const FEATURE_LABELS: Record<NumericFeature, string> = {
  diameter: '直径',
  fluorescence: '荧光强度',
  viability: '活性标记'
};

export const CELL_TYPES = ['T-Cell', 'B-Cell', 'NK-Cell', 'Macrophage'];
