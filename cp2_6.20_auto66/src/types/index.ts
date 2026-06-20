export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'cleric';

export interface Attributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
}

export interface SkillTree {
  class: CharacterClass;
  skills: Skill[];
}

export type EquipmentSlot = 'head' | 'body' | 'weapon' | 'ring';

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'weapon' | 'armor' | 'consumable' | 'accessory' | 'misc';
  slot?: EquipmentSlot;
  attributes?: Partial<Attributes>;
  effects?: {
    health?: number;
    mana?: number;
    damage?: number;
    defense?: number;
  };
  damageDice?: string;
  quantity?: number;
}

export interface Equipment {
  head: Item | null;
  body: Item | null;
  weapon: Item | null;
  ring: Item | null;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  level: number;
  experience: number;
  experienceToNext: number;
  attributes: Attributes;
  baseAttributes: Attributes;
  maxHealth: number;
  currentHealth: number;
  maxMana: number;
  currentMana: number;
  skillPoints: number;
  skills: string[];
  equipment: Equipment;
  inventory: Item[];
  gold: number;
  avatarColor: string;
  avatarShape: 'circle' | 'square' | 'diamond';
}

export interface Enemy {
  id: string;
  name: string;
  maxHealth: number;
  currentHealth: number;
  damage: number;
  defense: number;
  experienceReward: number;
  lootTable: { itemId: string; chance: number }[];
  icon: string;
}

export type CombatAction = 'attack' | 'cast' | 'defend' | 'item';

export interface DiceResult {
  value: number;
  modifier: number;
  total: number;
  success: boolean;
  dc: number;
}

export interface CombatState {
  active: boolean;
  turn: 'player' | 'enemy';
  player: Character;
  enemy: Enemy | null;
  log: string[];
  playerDefending: boolean;
}

export type CellType = 'empty' | 'entrance' | 'exit' | 'treasure' | 'trap' | 'monster' | 'npc' | 'boss';
export type CellStatus = 'hidden' | 'revealed' | 'visited';

export interface DungeonCell {
  x: number;
  y: number;
  type: CellType;
  status: CellStatus;
  eventId?: string;
  cleared: boolean;
}

export interface DungeonMap {
  width: number;
  height: number;
  cells: DungeonCell[][];
  playerPosition: { x: number; y: number };
  floor: number;
}

export type EventType = 'treasure' | 'trap' | 'monster' | 'npc';

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  options: EventOption[];
}

export interface EventOption {
  id: string;
  text: string;
  requiredCheck?: {
    attribute: keyof Attributes;
    dc: number;
  };
  result: EventResult;
}

export interface EventResult {
  success: boolean;
  message: string;
  healthChange?: number;
  manaChange?: number;
  goldChange?: number;
  items?: Item[];
  experienceChange?: number;
  triggerCombat?: boolean;
  enemy?: Enemy;
}

export interface DiceAnimationState {
  rolling: boolean;
  value: number | null;
  finalValue: number | null;
}
