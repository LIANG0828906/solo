export type Era = 0 | 1 | 2 | 3;

export const ERA_INFO: Record<Era, { name: string; sub: string; pop: number }> = {
  0: { name: '石器时代', sub: 'Stone Age — 采集狩猎，部落初兴', pop: 0 },
  1: { name: '农业时代', sub: 'Agricultural Age — 灌溉农耕，粮食丰收', pop: 10 },
  2: { name: '青铜时代', sub: 'Bronze Age — 冶炼铸币，军威初显', pop: 25 },
  3: { name: '铁器时代', sub: 'Iron Age — 百业兴旺，雄城屹立', pop: 50 }
};

export type TerrainType = 'grass' | 'forest' | 'river' | 'mountain';

export type BuildingType =
  | 'gatherer'
  | 'lumber'
  | 'quarry'
  | 'house'
  | 'farm'
  | 'irrigation'
  | 'barracks'
  | 'mint'
  | 'wall'
  | 'smithy'
  | 'workshop';

export interface BuildingDef {
  type: BuildingType;
  name: string;
  icon: string;
  bgColor: string;
  minEra: Era;
  cost: Partial<Resources>;
  perTurn: Partial<Resources>;
  popCapBonus?: number;
  desc: string;
}

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  gatherer:  { type: 'gatherer',  name: '采集场',  icon: '🧺', bgColor: '#8FBC8F', minEra: 0, cost: { wood: 5 },             perTurn: { food: 2 }, desc: '每回合+2食物' },
  lumber:    { type: 'lumber',    name: '伐木场',  icon: '🪓', bgColor: '#A0522D', minEra: 0, cost: { wood: 3, stone: 2 },   perTurn: { wood: 2 }, desc: '每回合+2木材' },
  quarry:    { type: 'quarry',    name: '采石场',  icon: '⛏️', bgColor: '#808080', minEra: 0, cost: { wood: 6 },             perTurn: { stone: 2 }, desc: '每回合+2石器' },
  house:     { type: 'house',     name: '房屋',    icon: '🏠', bgColor: '#DEB887', minEra: 0, cost: { wood: 8, stone: 3 },   perTurn: {}, popCapBonus: 5, desc: '+5人口上限' },
  farm:      { type: 'farm',      name: '农田',    icon: '🌾', bgColor: '#DAA520', minEra: 1, cost: { wood: 6 },             perTurn: { food: 4 }, desc: '每回合+4食物' },
  irrigation:{ type: 'irrigation',name: '灌溉渠',  icon: '💧', bgColor: '#5F9EA0', minEra: 1, cost: { wood: 4, stone: 8 },  perTurn: { food: 2 }, desc: '每回合+2食物，邻近农田+1' },
  barracks:  { type: 'barracks',  name: '兵营',    icon: '🛡️', bgColor: '#8B0000', minEra: 2, cost: { wood: 10, stone: 12 }, perTurn: {}, desc: '降低游牧入侵损失' },
  mint:      { type: 'mint',      name: '铸币所',  icon: '🪙', bgColor: '#FFD700', minEra: 2, cost: { wood: 12, stone: 15 }, perTurn: { stone: 1 }, desc: '每回合+1石器，贸易收益+25%' },
  wall:      { type: 'wall',      name: '城墙',    icon: '🧱', bgColor: '#696969', minEra: 3, cost: { stone: 20 },           perTurn: {}, desc: '大幅降低灾害损失' },
  smithy:    { type: 'smithy',    name: '铁匠铺',  icon: '🔨', bgColor: '#4A4A4A', minEra: 3, cost: { wood: 10, stone: 15 }, perTurn: { stone: 3 }, desc: '每回合+3石器' },
  workshop:  { type: 'workshop',  name: '作坊',    icon: '🏭', bgColor: '#B8860B', minEra: 2, cost: { wood: 12, stone: 10 }, perTurn: { wood: 2, stone: 1 }, desc: '每回合+2木材+1石器' }
};

export interface Resources {
  food: number;
  wood: number;
  stone: number;
  science: number;
}

export interface StatusEffect {
  name: string;
  turns: number;
  effect?: string;
  perTurn?: Partial<Resources>;
}

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  buildProgress: number;
  justBuilt?: number;
}

export interface Tile {
  x: number;
  y: number;
  terrain: TerrainType;
  building: Building | null;
}

export interface GameState {
  turn: number;
  era: Era;
  population: number;
  populationCap: number;
  resources: Resources;
  resourcesPrev: Resources;
  map: Tile[][];
  cols: number;
  rows: number;
  statuses: StatusEffect[];
  eventHistory: string[];
  techBoost: number;
  rngSeed: number;
  justUnlockedEra?: Era;
}

export interface GameStateSnapshot extends GameState {
  timestamp: number;
}

export interface EventEffect {
  food?: number;
  wood?: number;
  stone?: number;
  population?: number;
  populationPercent?: number;
  randomBuildingDestroy?: number;
  foodBonus?: number;
  status?: StatusEffect;
  techBoost?: number;
  science?: number;
}

export interface EventOption {
  id: string;
  text: string;
  effects: EventEffect;
  resultText: string;
  effectText?: string;
}

export interface GameEvent {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  minEra: number;
  description: string;
  options: EventOption[];
}

export interface FloatText {
  id: string;
  text: string;
  kind: 'good' | 'bad' | 'info';
  x: number;
  y: number;
  createdAt: number;
}

export interface Particle {
  id: string;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string;
  size: number;
  kind: 'dirt' | 'spark' | 'float';
}

export interface SaveMeta {
  slot: number;
  id: string;
  name: string;
  savedAt: string;
  turn: number;
  era: number;
  population: number;
  summary: string;
}
