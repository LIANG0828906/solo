export interface Position {
  x: number;
  y: number;
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
  speed: number;
  position: Position;
  kills: number;
  skills: SkillType[];
  visitedTiles: Set<Position>;
  isEvolving: boolean;
  evolutionTimer: number;
  animation: AnimationState;
}

export type TileType = 'room' | 'corridor' | 'wall';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  hasChest: boolean;
  hasPortal: boolean;
  portalTarget?: string;
}

export interface GameState {
  map: Tile[][];
  creatures: Creature[];
  selectedCreatureId: string | null;
  userTarget: Position | null;
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
