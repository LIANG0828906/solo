import type { TerrainType, UnitType, TerrainEffect, UnitConfig } from '../../shared/types';

export const BOARD_SIZE = 8;
export const CELL_SIZE = 72;
export const TURN_DURATION = 60;
export const RESOURCE_INCOME = 25;
export const STARTING_GOLD = 200;
export const BASE_HP = 100;

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  plain: '#8FBC6B',
  forest: '#2D5A27',
  mountain: '#8B7D6B',
  river: '#4A90D9',
  desert: '#D4B96A',
};

export const TERRAIN_NAMES: Record<TerrainType, string> = {
  plain: '平原',
  forest: '森林',
  mountain: '山脉',
  river: '河流',
  desert: '沙漠',
};

export const TERRAIN_DESCRIPTIONS: Record<TerrainType, string> = {
  plain: '标准地形，1点移动力',
  forest: '+20%防御，消耗2点移动力',
  mountain: '+30%攻击，消耗3点移动力',
  river: '消耗全部移动力，+15%闪避',
  desert: '移动消耗减半，无加成',
};

export const TERRAIN_EFFECTS: Record<TerrainType, TerrainEffect> = {
  plain: { moveCost: 1, attackBonus: 0, defenseBonus: 0, dodgeBonus: 0, flyingIgnore: false },
  forest: { moveCost: 2, attackBonus: 0, defenseBonus: 0.2, dodgeBonus: 0, flyingIgnore: false },
  mountain: { moveCost: 3, attackBonus: 0.3, defenseBonus: 0, dodgeBonus: 0, flyingIgnore: false },
  river: { moveCost: 99, attackBonus: 0, defenseBonus: 0, dodgeBonus: 0.15, flyingIgnore: false },
  desert: { moveCost: 0.5, attackBonus: 0, defenseBonus: 0, dodgeBonus: 0, flyingIgnore: false },
};

export const UNIT_CONFIGS: Record<UnitType, UnitConfig> = {
  infantry: { type: 'infantry', name: '步兵', cost: 50, attack: 10, hp: 50, movePoints: 4, icon: 'shield' },
  archer: { type: 'archer', name: '弓箭手', cost: 80, attack: 15, hp: 30, movePoints: 3, special: 'ranged', icon: 'bow' },
  knight: { type: 'knight', name: '骑士', cost: 120, attack: 12, hp: 60, movePoints: 5, special: 'charge', icon: 'sword' },
};

export const PLAYER_COLORS = {
  player1: '#4488FF',
  player2: '#FF4444',
};

export const BASE_POSITIONS = {
  player1: { x: 3, y: 0 },
  player2: { x: 4, y: 7 },
};
