export type ShipType = 'cruiser' | 'frigate' | 'mothership';

export type Owner = 'player' | 'ai';

export type NodeType = 'normal' | 'resource' | 'mothership_player' | 'mothership_ai';

export type GamePhase = 'player' | 'ai' | 'ended';

export interface Ship {
  id: string;
  type: ShipType;
  hp: number;
  maxHp: number;
  attack: number;
  move: number;
  range: number;
}

export interface Fleet {
  id: string;
  owner: Owner;
  ships: Ship[];
  nodeId: string;
}

export interface StarNode {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  connections: string[];
}

export interface CombatLogEntry {
  attackerType: ShipType;
  defenderType: ShipType;
  damage: number;
  defenderRemainingHp: number;
  defenderDestroyed: boolean;
}

export interface CombatResult {
  winner: Owner | null;
  attackerShipsRemaining: Ship[];
  defenderShipsRemaining: Ship[];
  logs: CombatLogEntry[];
  attackerTotalDamage: number;
  defenderTotalDamage: number;
}

export interface ParticleFlow {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  color: string;
  startTime: number;
  duration: number;
}

export interface GameState {
  nodes: StarNode[];
  fleets: Fleet[];
  turn: number;
  currentPhase: GamePhase;
  selectedNodeId: string | null;
  selectedFleetId: string | null;
  combatLogs: string[];
  winner: Owner | null;
  particleFlows: ParticleFlow[];
}

export const SHIP_CONFIGS: Record<ShipType, Omit<Ship, 'id'>> = {
  cruiser: {
    type: 'cruiser',
    hp: 8,
    maxHp: 8,
    attack: 3,
    move: 2,
    range: 1,
  },
  frigate: {
    type: 'frigate',
    hp: 4,
    maxHp: 4,
    attack: 2,
    move: 3,
    range: 2,
  },
  mothership: {
    type: 'mothership',
    hp: 20,
    maxHp: 20,
    attack: 5,
    move: 0,
    range: 2,
  },
};

export const NODE_RADIUS = 50;
