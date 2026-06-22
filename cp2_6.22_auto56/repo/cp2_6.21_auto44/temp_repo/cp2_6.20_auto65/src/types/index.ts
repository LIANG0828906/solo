export type BerthType = 'deep' | 'shallow' | 'maintenance';

export interface Ship {
  id: string;
  name: string;
  containerCount: number;
  berthingDuration: number;
  draft: number;
  berthId?: string;
  status: 'approaching' | 'docked' | 'loading' | 'departing' | 'departed';
  position: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  loadedContainers: number;
  arrivalTime: number;
  dockedTime?: number;
  departureTime?: number;
}

export interface Berth {
  id: string;
  name: string;
  type: BerthType;
  depth: number;
  position: { x: number; y: number; width: number; height: number };
  shipId?: string;
  cranes: string[];
  yardColumnIds: string[];
}

export interface Container {
  id: string;
  color: string;
  destination: string;
  weight: number;
  size: '20ft' | '40ft';
  owner: string;
}

export interface YardColumn {
  id: string;
  berthId: string;
  position: { x: number; y: number; width: number };
  containers: (Container | null)[];
  maxHeight: number;
}

export interface Crane {
  id: string;
  berthId: string;
  position: { x: number; y: number };
  targetX?: number;
  status: 'idle' | 'moving' | 'lowering' | 'grabbing' | 'lifting' | 'placing';
  carriedContainer?: Container;
  currentColumnId?: string;
}

export interface SimulationStats {
  shipsInPort: number;
  usedBerthes: number;
  totalBerthes: number;
  yardOccupancy: number;
  avgLoadingTime: number;
  totalContainersLoaded: number;
  totalContainers: number;
  loadingEfficiency: number;
}

export interface BerthEfficiency {
  berthId: string;
  berthName: string;
  workDuration: number;
  liftCount: number;
}

export interface HistoryEvent {
  timestamp: number;
  type: 'ship_arrival' | 'ship_departure' | 'container_move' | 'crane_move' | 'efficiency_update';
  data: any;
}

export type DashboardTab = 'overview' | 'efficiency' | 'history';

export interface SimulationState {
  simulationTime: number;
  speed: number;
  isRunning: boolean;
  ships: Ship[];
  berthes: Berth[];
  yardColumns: YardColumn[];
  cranes: Crane[];
  stats: SimulationStats;
  berthEfficiencies: BerthEfficiency[];
  history: HistoryEvent[];
  activeDashboardTab: DashboardTab;
  selectedContainerId?: string;
  selectedCraneId?: string;
  selectedColumnId?: string;
  suggestion?: string;
}
