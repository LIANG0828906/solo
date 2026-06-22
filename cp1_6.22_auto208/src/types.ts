export interface Vec2 {
  x: number;
  y: number;
}

export interface HexCoord {
  q: number;
  r: number;
}

export type AntType = 'worker' | 'soldier';
export type AntState = 'foraging' | 'carrying' | 'patrolling' | 'attacking' | 'returning' | 'idle';

export interface Ant {
  id: string;
  type: AntType;
  state: AntState;
  position: Vec2;
  velocity: Vec2;
  carrying: boolean;
  carryingAmount: number;
  target: Vec2 | null;
  homeNestId: string;
  health: number;
  maxHealth: number;
  speed: number;
  attackPower: number;
  selected: boolean;
  path: Vec2[];
  pathIndex: number;
  lastDecisionTime: number;
}

export type NestType = 'worker_nest' | 'soldier_nest' | 'resource_point';

export interface Nest {
  id: string;
  type: NestType;
  position: Vec2;
  hexCoord: HexCoord;
  level: number;
  capacity: number;
  foodStored: number;
  spawnQueue: number;
  lastSpawnTime: number;
  selected: boolean;
  upgrading: boolean;
  upgradeProgress: number;
  health: number;
  maxHealth: number;
}

export interface PheromoneCell {
  toFood: number;
  toHome: number;
  danger: number;
}

export interface AlertZone {
  id: string;
  position: Vec2;
  radius: number;
  priority: number;
  createdAt: number;
  duration: number;
}

export interface ResourceNode {
  id: string;
  position: Vec2;
  hexCoord: HexCoord;
  amount: number;
  maxAmount: number;
  type: 'food' | 'material';
}

export type CommandType =
  | 'move_to'
  | 'attack_area'
  | 'gather_priority'
  | 'recall'
  | 'spawn_worker'
  | 'spawn_soldier'
  | 'set_alert_zone';

export interface PlayerCommand {
  type: CommandType;
  targetIds: string[];
  position?: Vec2;
  priority?: number;
  resourceType?: 'food' | 'material';
}

export interface GameStats {
  totalAnts: number;
  workerCount: number;
  soldierCount: number;
  foodReserve: number;
  totalNestLevel: number;
  foodGatherRate: number;
  efficiencyIndex: number;
  fps: number;
}
