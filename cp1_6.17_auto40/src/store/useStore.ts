import { create } from 'zustand';

// ==================== Types ====================

export type AxisType = 'x' | 'y' | 'z';

export interface AxisMapping {
  x: string | null;
  y: string | null;
  z: string | null;
}

export interface DataSliceState {
  columns: string[];
  rows: Record<string, any>[];
  fileName: string;
  axisMapping: AxisMapping;
}

export interface DataSliceActions {
  setData: (columns: string[], rows: Record<string, any>[], fileName: string) => void;
  setAxis: (axis: AxisType, field: string | null) => void;
  clearData: () => void;
}

export interface DataSlice extends DataSliceState, DataSliceActions {}

export interface InfoCardPosition {
  x: number;
  y: number;
}

export interface UiSliceState {
  dataPanelOpen: boolean;
  controlPanelOpen: boolean;
  selectedDataPoint: Record<string, any> | null;
  infoCardPosition: InfoCardPosition;
}

export interface UiSliceActions {
  toggleDataPanel: () => void;
  toggleControlPanel: () => void;
  setSelectedDataPoint: (point: Record<string, any> | null, position: InfoCardPosition) => void;
  clearSelectedDataPoint: () => void;
}

export interface UiSlice extends UiSliceState, UiSliceActions {}

export type ChartType = 'scatter' | 'bar' | 'line';

export interface ChartConfigSliceState {
  chartType: ChartType;
}

export interface ChartConfigSliceActions {
  setChartType: (type: ChartType) => void;
}

export interface ChartConfigSlice extends ChartConfigSliceState, ChartConfigSliceActions {}

export type BackgroundColor = 'dark' | 'light';
export type GridDensity = 'fine' | 'medium' | 'coarse';

export interface GlobalSettingsSliceState {
  backgroundColor: BackgroundColor;
  axesVisible: boolean;
  gridDensity: GridDensity;
  pointSize: number;
  pointOpacity: number;
}

export interface GlobalSettingsSliceActions {
  setBackgroundColor: (color: BackgroundColor) => void;
  toggleAxesVisible: () => void;
  setGridDensity: (density: GridDensity) => void;
  setPointSize: (size: number) => void;
  setPointOpacity: (opacity: number) => void;
}

export interface GlobalSettingsSlice extends GlobalSettingsSliceState, GlobalSettingsSliceActions {}

export interface ConfigExport {
  axisMapping: AxisMapping;
  chartType: ChartType;
  backgroundColor: BackgroundColor;
  axesVisible: boolean;
  gridDensity: GridDensity;
  pointSize: number;
  pointOpacity: number;
}

export interface StoreConfigActions {
  saveConfig: () => ConfigExport;
  loadConfig: (config: ConfigExport) => void;
}

export type StoreState = DataSlice & UiSlice & ChartConfigSlice & GlobalSettingsSlice & StoreConfigActions;

// ==================== Initial States ====================

const initialDataState: DataSliceState = {
  columns: [],
  rows: [],
  fileName: '',
  axisMapping: {
    x: null,
    y: null,
    z: null,
  },
};

const initialUiState: UiSliceState = {
  dataPanelOpen: true,
  controlPanelOpen: true,
  selectedDataPoint: null,
  infoCardPosition: { x: 0, y: 0 },
};

const initialChartConfigState: ChartConfigSliceState = {
  chartType: 'scatter',
};

const initialGlobalSettingsState: GlobalSettingsSliceState = {
  backgroundColor: 'dark',
  axesVisible: true,
  gridDensity: 'medium',
  pointSize: 5,
  pointOpacity: 0.8,
};

// ==================== Slices ====================

const createDataSlice = (set: any): DataSlice => ({
  ...initialDataState,

  setData: (columns, rows, fileName) =>
    set((state: DataSlice) => ({
      columns,
      rows,
      fileName,
      axisMapping: {
        x: columns[0] || null,
        y: columns[1] || null,
        z: columns[2] || null,
      },
    })),

  setAxis: (axis, field) =>
    set((state: DataSlice) => ({
      axisMapping: {
        ...state.axisMapping,
        [axis]: field,
      },
    })),

  clearData: () =>
    set(() => ({
      ...initialDataState,
    })),
});

const createUiSlice = (set: any): UiSlice => ({
  ...initialUiState,

  toggleDataPanel: () =>
    set((state: UiSlice) => ({
      dataPanelOpen: !state.dataPanelOpen,
    })),

  toggleControlPanel: () =>
    set((state: UiSlice) => ({
      controlPanelOpen: !state.controlPanelOpen,
    })),

  setSelectedDataPoint: (point, position) =>
    set(() => ({
      selectedDataPoint: point,
      infoCardPosition: position,
    })),

  clearSelectedDataPoint: () =>
    set(() => ({
      selectedDataPoint: null,
      infoCardPosition: { x: 0, y: 0 },
    })),
});

const createChartConfigSlice = (set: any): ChartConfigSlice => ({
  ...initialChartConfigState,

  setChartType: (type) =>
    set(() => ({
      chartType: type,
    })),
});

const createGlobalSettingsSlice = (set: any): GlobalSettingsSlice => ({
  ...initialGlobalSettingsState,

  setBackgroundColor: (color) =>
    set(() => ({
      backgroundColor: color,
    })),

  toggleAxesVisible: () =>
    set((state: GlobalSettingsSlice) => ({
      axesVisible: !state.axesVisible,
    })),

  setGridDensity: (density) =>
    set(() => ({
      gridDensity: density,
    })),

  setPointSize: (size) =>
    set(() => ({
      pointSize: Math.min(10, Math.max(2, size)),
    })),

  setPointOpacity: (opacity) =>
    set(() => ({
      pointOpacity: Math.min(1.0, Math.max(0.2, opacity)),
    })),
});

// ==================== Store ====================

export const useStore = create<StoreState>((set, get) => ({
  ...createDataSlice(set),
  ...createUiSlice(set),
  ...createChartConfigSlice(set),
  ...createGlobalSettingsSlice(set),

  saveConfig: (): ConfigExport => {
    const state = get();
    return {
      axisMapping: state.axisMapping,
      chartType: state.chartType,
      backgroundColor: state.backgroundColor,
      axesVisible: state.axesVisible,
      gridDensity: state.gridDensity,
      pointSize: state.pointSize,
      pointOpacity: state.pointOpacity,
    };
  },

  loadConfig: (config: ConfigExport) => {
    set({
      axisMapping: config.axisMapping,
      chartType: config.chartType,
      backgroundColor: config.backgroundColor,
      axesVisible: config.axesVisible,
      gridDensity: config.gridDensity,
      pointSize: config.pointSize,
      pointOpacity: config.pointOpacity,
    });
  },
}));
