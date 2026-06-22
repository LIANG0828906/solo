export interface HexCoord {
  q: number;
  r: number;
}

export type UnitClass = 'warrior' | 'archer' | 'mage';

export type Faction = 'blue' | 'red';

export interface Unit {
  id: string;
  name: string;
  faction: Faction;
  unitClass: UnitClass;
  position: HexCoord;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveRange: number;
  attackRange: number;
  energy: number;
  maxEnergy: number;
  skillCooldown: number;
  hasMoved: boolean;
  hasAttacked: boolean;
}

export interface HexCell {
  coord: HexCoord;
  terrain: 'plain';
  passable: boolean;
}

export interface BattleLogEntry {
  id: number;
  turn: number;
  message: string;
  timestamp: number;
}

export type GamePhase =
  | 'idle'
  | 'deployed'
  | 'selecting_move'
  | 'selecting_attack'
  | 'selecting_skill_target'
  | 'game_over';

export interface GameState {
  phase: GamePhase;
  currentTurn: number;
  currentFaction: Faction;
  currentUnitId: string | null;
  selectedUnitId: string | null;
  selectedSkillId: string | null;
  units: Unit[];
  logs: BattleLogEntry[];
  winner: Faction | null;
  moveableCells: HexCoord[];
  attackableCells: HexCoord[];
  damagePopups: DamagePopup[];
}

export interface DamagePopup {
  id: number;
  unitId: string;
  damage: number;
  isCrit: boolean;
  coord: HexCoord;
}

export interface SkillEffect {
  damageMultiplier?: number;
  ignoreDefensePercent?: number;
  splashRadius?: number;
  splashDamagePercent?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  cooldown: number;
  effect: SkillEffect;
}

export type WorkerMessageType =
  | { type: 'findPath'; start: HexCoord; end: HexCoord; obstacles: HexCoord[]; gridConfig: GridConfig }
  | { type: 'getReachable'; start: HexCoord; range: number; obstacles: HexCoord[]; gridConfig: GridConfig };

export type WorkerResultType =
  | { type: 'path_result'; path: HexCoord[] }
  | { type: 'reachable_result'; cells: HexCoord[] };

export interface GridConfig {
  cols: number;
  rows: number;
  hexSize: number;
}
