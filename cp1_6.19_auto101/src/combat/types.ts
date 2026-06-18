import type { MonsterData } from '@/domain/types';

export type { MonsterData };

export type CharacterClass = 'warrior' | 'mage' | 'rogue';

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  attackerId: string;
  targetId: string;
}

export interface BattleFrame {
  type: 'attack' | 'defend' | 'flee' | 'start' | 'end';
  attacker: string;
  target: string;
  damage: number;
  isCritical: boolean;
  playerHp: number;
  playerMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  message: string;
}

export interface BattleState {
  isPlayerTurn: boolean;
  isBattleOver: boolean;
  playerWon: boolean;
  frames: BattleFrame[];
  currentFrameIndex: number;
}
