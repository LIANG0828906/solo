export type Rarity = 'common' | 'rare' | 'legendary';

export interface PetTemplate {
  id: string;
  name: string;
  rarity: Rarity;
  baseHp: number;
  baseAttack: number;
  baseSpeed: number;
}

export interface PetInstance {
  uid: string;
  templateId: string;
  name: string;
  rarity: Rarity;
  hp: number;
  attack: number;
  speed: number;
  power: number;
  slotIndex: number;
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#B0BEC5',
  rare: '#FFD54F',
  legendary: '#E57373',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  legendary: '传说',
};

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 0.6,
  rare: 0.3,
  legendary: 0.1,
};

export const PET_TEMPLATES: PetTemplate[] = [
  { id: 'cloud_kitty', name: '云喵', rarity: 'common', baseHp: 80, baseAttack: 30, baseSpeed: 50 },
  { id: 'puff_pup', name: '泡泡犬', rarity: 'common', baseHp: 70, baseAttack: 40, baseSpeed: 45 },
  { id: 'star_hammy', name: '星仓', rarity: 'common', baseHp: 90, baseAttack: 25, baseSpeed: 35 },
  { id: 'moon_bunny', name: '月兔', rarity: 'common', baseHp: 60, baseAttack: 35, baseSpeed: 55 },
  { id: 'dew_fawn', name: '露鹿', rarity: 'common', baseHp: 75, baseAttack: 30, baseSpeed: 40 },
  { id: 'thunder_dragon', name: '雷龙', rarity: 'rare', baseHp: 120, baseAttack: 60, baseSpeed: 50 },
  { id: 'crystal_fox', name: '晶狐', rarity: 'rare', baseHp: 100, baseAttack: 55, baseSpeed: 65 },
  { id: 'flame_phoenix', name: '炎凰', rarity: 'rare', baseHp: 110, baseAttack: 70, baseSpeed: 45 },
  { id: 'frost_wolf', name: '冰狼', rarity: 'rare', baseHp: 130, baseAttack: 50, baseSpeed: 55 },
  { id: 'sky_whale', name: '天鲸', rarity: 'rare', baseHp: 140, baseAttack: 45, baseSpeed: 40 },
  { id: 'cosmic_dragon', name: '星穹龙', rarity: 'legendary', baseHp: 200, baseAttack: 90, baseSpeed: 80 },
  { id: 'eternal_phoenix', name: '永恒凤', rarity: 'legendary', baseHp: 180, baseAttack: 100, baseSpeed: 70 },
  { id: 'void_unicorn', name: '虚空独角', rarity: 'legendary', baseHp: 190, baseAttack: 85, baseSpeed: 90 },
];

export const BLIND_BOX_COST = 100;

export const SHELF_ROWS = 4;
export const SHELF_COLS = 5;
export const TOTAL_SLOTS = SHELF_ROWS * SHELF_COLS;

export function calculatePower(hp: number, attack: number, speed: number): number {
  return Math.round(hp * 0.3 + attack * 0.5 + speed * 0.2);
}
