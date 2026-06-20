export type RoomType = 'empty' | 'chest' | 'monster' | 'exit' | 'boss' | 'start';
export type EquipmentSlot = 'weapon' | 'helmet' | 'armor' | 'boots';
export type EquipmentQuality = 'white' | 'blue' | 'purple' | 'orange';

export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: RoomType;
  connections: string[];
  cleared: boolean;
  monster: Monster | null;
  loot: Equipment[];
  visited: boolean;
}

export interface Monster {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  isBoss: boolean;
  specialSkill: {
    name: string;
    damage: number;
    cooldown: number;
    currentCooldown: number;
  } | null;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  quality: EquipmentQuality;
  attackBonus: number;
  defenseBonus: number;
}

export interface Player {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  x: number;
  y: number;
  equipment: Record<EquipmentSlot, Equipment | null>;
  backpack: Equipment[];
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  startTime: number;
  duration: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
}

export interface LootAnimation {
  id: string;
  equipment: Equipment;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startTime: number;
  duration: number;
}

export interface CombatState {
  inCombat: boolean;
  currentMonster: Monster | null;
  normalAttackCooldown: number;
  skillAttackCooldown: number;
  playerTurn: boolean;
  bossWarningActive: boolean;
  bossWarningStartTime: number;
  combatLog: string[];
}

export interface GameStats {
  kills: number;
  equipmentCollected: number;
  startTime: number;
  maxDamage: number;
}

export interface VictoryState {
  show: boolean;
  startTime: number;
}
