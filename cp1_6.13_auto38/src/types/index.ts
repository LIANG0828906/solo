export const MAP_SIZE = 10;
export const TILE_SIZE = 50;
export const MAX_PATHFINDING_TIME = 5;
export const EVOLUTION_KILLS_REQUIRED = 3;
export const CHEST_REWARD_CHANCE = 0.7;
export const MAX_LOG_ENTRIES = 10;
export const TARGET_FPS = 30;

export interface Position {
  x: number;
  y: number;
}

export interface SpeciesStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  name: string;
  color: string;
  trapImmune?: boolean;
}

export type SkillEffectType = 'aura' | 'passive';

export interface SkillEffectBase {
  type: SkillEffectType;
  name: string;
}

export interface AuraSkillEffect extends SkillEffectBase {
  type: 'aura';
  range: number;
  damage: number;
}

export interface PassiveSkillEffect extends SkillEffectBase {
  type: 'passive';
  description?: string;
  damageReduction?: number;
}

export type SkillEffect = AuraSkillEffect | PassiveSkillEffect;

export const SPECIES_STATS: Record<SpeciesType, SpeciesStats> = {
  dragon: { hp: 150, attack: 25, defense: 15, speed: 1, name: '龙', color: '#ff4757' },
  elf: { hp: 80, attack: 15, defense: 5, speed: 3, name: '精灵', color: '#2ed573' },
  gargoyle: { hp: 120, attack: 18, defense: 10, speed: 2, name: '石像鬼', color: '#a55eea', trapImmune: true },
};

export const SKILL_EFFECTS: Record<SkillType, SkillEffect> = {
  flameAura: { type: 'aura', range: 1, damage: 3, name: '火焰光环' },
  multiTeleport: { type: 'passive', name: '多重瞬移', description: '一次可瞬移两个方向' },
  stoneSkin: { type: 'passive', damageReduction: 0.2, name: '石肤' },
};

export interface AIDecision {
  action: 'move' | 'attack' | 'flee' | 'explore' | 'useChest' | 'usePortal';
  targetPosition?: Position;
  targetCreatureId?: string;
}

export interface CombatResult {
  damage: number;
  winnerId: string;
  loserId: string;
  isDefenderDead: boolean;
}

export interface ChestReward {
  isTrap: boolean;
  reward: { type: string; value: number } | null;
  damage?: number;
}

export type SpeciesType = 'dragon' | 'elf' | 'gargoyle';

export type SkillType = 'flameAura' | 'multiTeleport' | 'stoneSkin';

export interface Skill {
  id: SkillType;
  name: string;
  icon: string;
  description: string;
}

export interface AnimationState {
  type: 'idle' | 'moving' | 'attacking' | 'hit' | 'evolving';
  progress: number;
}

export interface Creature {
  id: string;
  species: SpeciesType;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  position: Position;
  renderPosition: Position;
  currentPath: Position[];
  moveProgress: number;
  moveSpeed: number;
  userControlled: boolean;
  kills: number;
  skills: SkillType[];
  visitedTiles: Set<Position>;
  isEvolving: boolean;
  evolutionTimer: number;
  animation: AnimationState;
  displayDamage?: { value: number; offsetY: number; timer: number };
}

export type TileType = 'room' | 'corridor' | 'wall';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  hasChest: boolean;
  chestOpened: boolean;
  hasPortal: boolean;
  portalTarget?: string;
  isExplored: boolean;
}

export interface GameState {
  time: number;
  map: Tile[][];
  mapWidth: number;
  mapHeight: number;
  creatures: Creature[];
  selectedCreatureId: string | null;
  userTarget: Position | null;
  path: Position[];
  eventLogs: LogEntry[];
}

export interface LogEntry {
  message: string;
  timestamp: number;
}

export type EventType =
  | 'CREATURE_MOVED'
  | 'COMBAT_STARTED'
  | 'COMBAT_ENDED'
  | 'CREATURE_EVOLVED'
  | 'CHEST_OPENED'
  | 'PORTAL_USED'
  | 'LOG_ADDED'
  | 'CREATURE_SELECTED'
  | 'TARGET_SET';

export interface EventPayloadMap {
  CREATURE_MOVED: { creatureId: string; from: Position; to: Position };
  COMBAT_STARTED: { attackerId: string; defenderId: string };
  COMBAT_ENDED: { winnerId: string; loserId: string; damage: number };
  CREATURE_EVOLVED: { creatureId: string; newSkill: SkillType };
  CHEST_OPENED: { position: Position; reward: string; isTrap: boolean };
  PORTAL_USED: { creatureId: string; from: Position; to: Position };
  LOG_ADDED: { message: string; timestamp: number };
  CREATURE_SELECTED: { creatureId: string | null };
  TARGET_SET: { position: Position };
}

export interface EventBus {
  on<T extends EventType>(event: T, callback: (payload: EventPayloadMap[T]) => void): void;
  off<T extends EventType>(event: T, callback: (payload: EventPayloadMap[T]) => void): void;
  emit<T extends EventType>(event: T, payload: EventPayloadMap[T]): void;
}

export const SKILLS: Record<SkillType, Skill> = {
  flameAura: {
    id: 'flameAura',
    name: '火焰光环',
    icon: '🔥',
    description: '周围1格敌人持续灼烧',
  },
  multiTeleport: {
    id: 'multiTeleport',
    name: '多重瞬移',
    icon: '⚡',
    description: '一次可瞬移两个方向',
  },
  stoneSkin: {
    id: 'stoneSkin',
    name: '石肤',
    icon: '🛡️',
    description: '减免20%所受伤害',
  },
};

export const SPECIES_INFO: Record<SpeciesType, { name: string; icon: string; color: string }> = {
  dragon: { name: '龙', icon: '🐉', color: '#ff4757' },
  elf: { name: '精灵', icon: '🧝', color: '#2ed573' },
  gargoyle: { name: '石像鬼', icon: '👹', color: '#a55eea' },
};
