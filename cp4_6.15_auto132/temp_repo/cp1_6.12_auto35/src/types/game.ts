export type TerrainType = 'grass' | 'mountain' | 'water';

export type Team = 'player' | 'ai';

export interface Position {
  x: number;
  y: number;
}

export interface Unit {
  id: string;
  name: string;
  type: string;
  team: Team;
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  moveRange: number;
  attackRange: number;
  isAlive: boolean;
  hasMoved: boolean;
  hasAttacked: boolean;
}

export interface Cell {
  x: number;
  y: number;
  terrain: TerrainType;
  walkable: boolean;
  moveCost: number;
}

export interface AiDecision {
  unitId: string;
  targetPosition: Position;
  path: Position[];
  attackTarget: string | null;
  priority: number;
}

export interface AiDecideRequest {
  mapSize: number;
  terrain: TerrainType[][];
  units: Unit[];
}

export interface AiDecideResponse {
  decisions: AiDecision[];
  timestamp: number;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  unitName: string;
  moveDistance: number;
  attackResult: string | null;
  targetUnitName: string | null;
  damage: number | null;
  decision: AiDecision;
  unitsSnapshot: Unit[];
}

export type GamePhase = 'map-select' | 'player-turn' | 'ai-turn' | 'animating' | 'game-over';
