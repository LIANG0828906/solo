export interface HexCoord {
  q: number;
  r: number;
}

export type UnitClass = 'warrior' | 'ranger' | 'mage' | 'priest' | 'goblin';

export type Team = 'player' | 'enemy';

export interface Skill {
  id: string;
  name: string;
  icon: string;
  range: number;
  damage?: number;
  heal?: number;
  cooldown: number;
  currentCooldown: number;
  type: 'attack' | 'heal' | 'ranged_attack';
}

export interface Unit {
  id: string;
  name: string;
  team: Team;
  class: UnitClass;
  hp: number;
  maxHp: number;
  attack: number;
  moveRange: number;
  position: HexCoord;
  hasActed: boolean;
  skills: Skill[];
  spawnDelay: number;
}

export type TileType = 'grass' | 'rock' | 'bush';

export interface Tile {
  coord: HexCoord;
  type: TileType;
  evasionBonus?: number;
}

export type EffectType = 'damage' | 'miss' | 'target_mark' | 'shake' | 'heal';

export interface VisualEffect {
  id: string;
  type: EffectType;
  position: HexCoord;
  value?: number;
  isCrit?: boolean;
  startTime: number;
  duration: number;
}

export type Phase = 'player_turn' | 'enemy_turn' | 'battle_end';

export interface GameState {
  phase: Phase;
  turn: number;
  units: Unit[];
  tiles: Map<string, Tile>;
  selectedUnitId: string | null;
  moveRange: HexCoord[];
  attackRange: HexCoord[];
  effects: VisualEffect[];
  winner: Team | null;
  killCount: number;
  turnBanner: { text: string; showTime: number } | null;
  flashScreen: { showTime: number; duration: number } | null;
}
