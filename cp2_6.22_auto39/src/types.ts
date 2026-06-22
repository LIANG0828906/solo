export type ItemQuality = 'white' | 'blue' | 'purple' | 'gold';
export type ItemType = 'weapon' | 'armor' | 'accessory';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface ItemEffect {
  id: string;
  name: string;
  desc: string;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  quality: ItemQuality;
  stats: {
    attack: number;
    defense: number;
    critRate: number;
  };
  effect: ItemEffect | null;
  upgraded?: boolean;
}

export interface MonsterSkill {
  id: string;
  name: string;
  desc: string;
  cd: number;
  mult: number;
  currentCd: number;
}

export interface Monster {
  id: string;
  name: string;
  type: string;
  stats: {
    maxHp: number;
    hp: number;
    attack: number;
    defense: number;
    critRate: number;
  };
  skills: MonsterSkill[];
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  critRate: number;
}

export interface CombatLogEntry {
  round: number;
  timestamp: string;
  actor: string;
  action: string;
  damage?: number;
  isCrit?: boolean;
  isDodge?: boolean;
  effectTriggered?: string;
}

export interface CombatResult {
  victory: boolean;
  rounds: number;
  logs: CombatLogEntry[];
  playerHp: number;
  monstersRemaining: number;
}
