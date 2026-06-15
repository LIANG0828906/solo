export interface BuildingData {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}

export interface BuildingFlowData {
  buildingId: string;
  density: number;
  historicalPeak: number;
  hourlyData: number[];
}

export interface FlowDataset {
  timestamp: number;
  buildings: BuildingFlowData[];
  overallIndex: number;
  trendData: number[];
}

export interface PanelState {
  isExpanded: boolean;
  position: 'top' | 'bottom';
}

export interface TooltipData {
  visible: boolean;
  buildingId: string | null;
  buildingName: string;
  density: number;
  historicalPeak: number;
  position: { x: number; y: number };
}

export interface AppState {
  buildings: BuildingData[];
  flowData: FlowDataset | null;
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  panel: PanelState;
  tooltip: TooltipData;
  lastUpdateTime: number;
}

export interface AppActions {
  setBuildings: (buildings: BuildingData[]) => void;
  setFlowData: (flowData: FlowDataset) => void;
  setSelectedBuilding: (id: string | null) => void;
  setHoveredBuilding: (id: string | null) => void;
  togglePanel: () => void;
  setPanelPosition: (position: 'top' | 'bottom') => void;
  setTooltip: (tooltip: Partial<TooltipData>) => void;
  updateFlowData: () => void;
}

export type AppStore = AppState & AppActions;
