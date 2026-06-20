export type TerrainType = 'grass' | 'stone' | 'water';

export interface HexCell {
  q: number;
  r: number;
  terrain: TerrainType;
}

export interface Unit {
  id: string;
  name: string;
  race: string;
  level: number;
  hp: number;
  maxHp: number;
  armor: number;
  movement: number;
  strength: number;
  agility: number;
  intelligence: number;
  position: { q: number; r: number };
  type: 'player' | 'enemy';
  isDead: boolean;
}

export type LogType = 'attack' | 'heal' | 'buff' | 'debuff' | 'move';

export interface LogEntry {
  id: string;
  round: number;
  timestamp: number;
  source: string;
  target: string;
  skill: string;
  value: number;
  type: LogType;
}

export interface GameState {
  units: Unit[];
  terrain: HexCell[];
  currentRound: number;
  selectedUnitId: string | null;
  editMode: boolean;
  brushType: TerrainType;
  logs: LogEntry[];
}

export interface RippleEffect {
  q: number;
  r: number;
  startTime: number;
}

export interface DragState {
  isDragging: boolean;
  unitId: string | null;
  startPos: { x: number; y: number } | null;
  currentPos: { x: number; y: number } | null;
}
