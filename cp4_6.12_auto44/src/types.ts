export type ShipStatus = 'approaching' | 'waiting' | 'docked' | 'loading' | 'unloading' | 'departing' | 'departed';

export type BollardStatus = 'idle' | 'occupied' | 'maintenance';

export type ContainerType = 'import' | 'export' | 'transit';

export type TruckStatus = 'idle' | 'moving_to_bollard' | 'loading' | 'moving_to_yard' | 'unloading';

export interface Container {
  id: string;
  type: ContainerType;
  destination: string;
  shipId?: string;
  gridX?: number;
  gridY?: number;
  stackLevel?: number;
}

export interface Ship {
  id: string;
  name: string;
  hullColor: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  speed: number;
  capacity: number;
  importContainers: number;
  exportContainers: number;
  unloadedImport: number;
  loadedExport: number;
  status: ShipStatus;
  bollardId?: string;
  estimatedDockingTime: number;
  remainingDockingTime: number;
  draft: number;
}

export interface Bollard {
  id: string;
  x: number;
  y: number;
  status: BollardStatus;
  maxDepth: number;
  craneCount: number;
  shipId?: string;
}

export interface YardGrid {
  x: number;
  y: number;
  capacity: number;
  stackedContainers: Container[];
}

export interface Truck {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  status: TruckStatus;
  container?: Container;
  path: { x: number; y: number }[];
  pathIndex: number;
  wheelRotation: number;
}

export interface GameState {
  day: number;
  totalThroughput: number;
  balance: number;
  isPaused: boolean;
  isGameOver: boolean;
  averageDockingTime: number;
  maxYardUtilization: number;
  totalDockingTime: number;
  totalShipsProcessed: number;
}

export interface EventMap {
  shipArrived: { ship: Ship };
  shipDocked: { ship: Ship; bollard: Bollard };
  shipLeft: { ship: Ship };
  bollardAllocated: { bollard: Bollard; ship: Ship };
  bollardFreed: { bollard: Bollard };
  cargoUnloaded: { container: Container; bollardId: string };
  cargoLoaded: { container: Container; shipId: string };
  cargoMoved: { container: Container; fromX: number; fromY: number; toX: number; toY: number };
  truckAssigned: { truck: Truck; bollardId: string };
  truckArrived: { truck: Truck; location: 'bollard' | 'yard' };
  yardGridUpdated: { grid: YardGrid };
  yardOverflow: { grids: YardGrid[] };
  gameStateUpdated: { state: GameState };
  gamePaused: {};
  gameResumed: {};
  gameOver: { reason: string; stats: GameState };
  gameReset: {};
}

export type EventName = keyof EventMap;

export type EventHandler<T extends EventName> = (data: EventMap[T]) => void;
