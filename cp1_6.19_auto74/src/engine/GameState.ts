export type CustomerState =
  | 'entering'
  | 'choosing'
  | 'walking'
  | 'queueing'
  | 'checkout'
  | 'leaving'
  | 'angry';

export interface Point {
  x: number;
  y: number;
}

export interface Customer {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  path: Point[];
  pathIndex: number;
  state: CustomerState;
  items: number;
  waitTime: number;
  checkoutTargetId?: number;
  checkoutTargetType?: 'cashier' | 'self';
  checkoutStartTime?: number;
  angry: boolean;
  rotation: number;
  queuePosition?: number;
}

export interface Cashier {
  id: number;
  gridX: number;
  gridY: number;
  open: boolean;
  rate: number;
  customersServed: number;
  queue: number[];
  currentCustomerId?: number;
  checkoutProgress: number;
}

export interface SelfCheckout {
  id: number;
  gridX: number;
  gridY: number;
  enabled: boolean;
  inUse: boolean;
  currentCustomerId?: number;
  checkoutProgress: number;
}

export interface Shelf {
  id: number;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  stock: number;
  emptyTimer: number;
  restocking: boolean;
  restockProgress: number;
}

export type RestockerState = 'idle' | 'moving' | 'restocking';

export interface Restocker {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  path: Point[];
  pathIndex: number;
  targetShelfId?: number;
  state: RestockerState;
  restockTimer: number;
  rotation: number;
}

export interface FloatText {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface StatsPoint {
  time: number;
  avgWait: number;
  throughput: number;
  satisfaction: number;
}

export interface GameState {
  time: number;
  customers: Customer[];
  cashiers: Cashier[];
  selfCheckouts: SelfCheckout[];
  shelves: Shelf[];
  restockers: Restocker[];
  revenue: number;
  satisfaction: number;
  avgWaitTime: number;
  throughput: number;
  totalWaitTime: number;
  completedCount: number;
  statsHistory: StatsPoint[];
  floatTexts: FloatText[];
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  entryPoint: Point;
  exitPoint: Point;
  warehousePoint: Point;
  grid: number[][];
  lastCustomerSpawn: number;
  nextSpawnDelay: number;
  lastStatsSample: number;
  revenueFlash: number;
}

export const GRID_EMPTY = 0;
export const GRID_OBSTACLE = 1;
export const GRID_CASHIER_FRONT = 2;
export const GRID_SELF_FRONT = 3;
