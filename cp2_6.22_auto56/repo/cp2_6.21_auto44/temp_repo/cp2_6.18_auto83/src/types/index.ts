export type ShipType = 'battleship' | 'cruiser' | 'destroyer';

export type Orientation = 'horizontal' | 'vertical';

export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk' | 'pending';

export type GamePhase = 'deploy' | 'matching' | 'battle' | 'gameover';

export interface ShipDefinition {
  type: ShipType;
  size: number;
  color: string;
  label: string;
}

export interface Ship {
  id: string;
  type: ShipType;
  cells: [number, number][];
  hits: boolean[];
  sunk: boolean;
  orientation: Orientation;
}

export interface Grid {
  cells: CellState[][];
  shipMap: (string | null)[][];
}

export type LogType = 'hit' | 'miss' | 'sunk' | 'timeout' | 'system';

export interface LogEntry {
  id: string;
  type: LogType;
  message: string;
  timestamp: number;
}

export interface AttackResult {
  row: number;
  col: number;
  hit: boolean;
  sunk: boolean;
  sunkShipType?: ShipType;
  gameOver: boolean;
}

export const GRID_SIZE = 6;

export const SHIP_DEFINITIONS: ShipDefinition[] = [
  { type: 'battleship', size: 3, color: '#E63946', label: '战列舰' },
  { type: 'cruiser', size: 2, color: '#F4A261', label: '巡洋舰' },
  { type: 'destroyer', size: 1, color: '#2A9D8F', label: '驱逐舰' },
];

export const TURN_DURATION = 20;
export const MAX_TIMEOUTS = 3;
