import { WeaponType, ShieldType, EngineType, PartLevel } from '../types';

export const GAME_CONFIG = {
  PLAYER_WIDTH: 40,
  PLAYER_HEIGHT: 50,
  PLAYER_SPEED: 5,
  PLAYER_LIVES: 3,
  INVINCIBLE_DURATION: 1000,
  BULLET_SPEED: 8,
  ENEMY_BULLET_SPEED: 3,
  ENEMY_SPAWN_RATE: 2000,
  ENEMIES_PER_WAVE: 8,
  BOSS_WAVE_INTERVAL: 5,
  PARTICLE_LIMIT: 500,
  STAR_COUNT: 200,
  FIRE_RATE_AUTO: 200,
} as const;

export const WEAPON_CONFIG: Record<WeaponType, Record<PartLevel, { fireRate: number; damage: number; bulletCount: number; spread: number; bulletWidth: number; bulletHeight: number; cost: number }>> = {
  laser: {
    1: { fireRate: 250, damage: 10, bulletCount: 1, spread: 0, bulletWidth: 4, bulletHeight: 20, cost: 0 },
    2: { fireRate: 200, damage: 18, bulletCount: 1, spread: 0, bulletWidth: 6, bulletHeight: 24, cost: 500 },
    3: { fireRate: 150, damage: 30, bulletCount: 1, spread: 0, bulletWidth: 8, bulletHeight: 30, cost: 1500 },
  },
  scatter: {
    1: { fireRate: 400, damage: 6, bulletCount: 3, spread: 15, bulletWidth: 4, bulletHeight: 12, cost: 0 },
    2: { fireRate: 350, damage: 10, bulletCount: 5, spread: 20, bulletWidth: 4, bulletHeight: 14, cost: 600 },
    3: { fireRate: 300, damage: 15, bulletCount: 7, spread: 25, bulletWidth: 5, bulletHeight: 16, cost: 1800 },
  },
  rapid: {
    1: { fireRate: 120, damage: 4, bulletCount: 1, spread: 0, bulletWidth: 3, bulletHeight: 10, cost: 0 },
    2: { fireRate: 90, damage: 7, bulletCount: 2, spread: 8, bulletWidth: 3, bulletHeight: 12, cost: 550 },
    3: { fireRate: 60, damage: 12, bulletCount: 2, spread: 10, bulletWidth: 4, bulletHeight: 14, cost: 1600 },
  },
};

export const SHIELD_CONFIG: Record<ShieldType, Record<PartLevel, { damageReduction: number; reflectChance: number; armorPoints: number; cost: number; color: string }>> = {
  damage: {
    1: { damageReduction: 0.2, reflectChance: 0, armorPoints: 0, cost: 0, color: '#3742FA' },
    2: { damageReduction: 0.4, reflectChance: 0, armorPoints: 0, cost: 400, color: '#3742FA' },
    3: { damageReduction: 0.6, reflectChance: 0, armorPoints: 0, cost: 1200, color: '#3742FA' },
  },
  reflect: {
    1: { damageReduction: 0, reflectChance: 0.15, armorPoints: 0, cost: 0, color: '#9B59B6' },
    2: { damageReduction: 0.1, reflectChance: 0.3, armorPoints: 0, cost: 450, color: '#9B59B6' },
    3: { damageReduction: 0.2, reflectChance: 0.5, armorPoints: 0, cost: 1300, color: '#9B59B6' },
  },
  armor: {
    1: { damageReduction: 0.1, reflectChance: 0, armorPoints: 1, cost: 0, color: '#FFD700' },
    2: { damageReduction: 0.2, reflectChance: 0, armorPoints: 2, cost: 500, color: '#FFD700' },
    3: { damageReduction: 0.3, reflectChance: 0, armorPoints: 3, cost: 1400, color: '#FFD700' },
  },
};

export const ENGINE_CONFIG: Record<EngineType, Record<PartLevel, { speed: number; dodgeChance: number; boostMultiplier: number; cost: number }>> = {
  speed: {
    1: { speed: 5, dodgeChance: 0, boostMultiplier: 1, cost: 0 },
    2: { speed: 7, dodgeChance: 0, boostMultiplier: 1, cost: 350 },
    3: { speed: 9, dodgeChance: 0, boostMultiplier: 1, cost: 1000 },
  },
  dodge: {
    1: { speed: 4.5, dodgeChance: 0.1, boostMultiplier: 1, cost: 0 },
    2: { speed: 5, dodgeChance: 0.25, boostMultiplier: 1, cost: 400 },
    3: { speed: 5.5, dodgeChance: 0.45, boostMultiplier: 1, cost: 1100 },
  },
  boost: {
    1: { speed: 5, dodgeChance: 0, boostMultiplier: 1.5, cost: 0 },
    2: { speed: 5.5, dodgeChance: 0, boostMultiplier: 2, cost: 450 },
    3: { speed: 6, dodgeChance: 0, boostMultiplier: 2.5, cost: 1300 },
  },
};

export const WEAPON_NAMES: Record<WeaponType, string> = {
  laser: '激光炮',
  scatter: '散射枪',
  rapid: '速射枪',
};

export const SHIELD_NAMES: Record<ShieldType, string> = {
  damage: '减伤护盾',
  reflect: '反弹护盾',
  armor: '护甲护盾',
};

export const ENGINE_NAMES: Record<EngineType, string> = {
  speed: '速度引擎',
  dodge: '闪避引擎',
  boost: '加速引擎',
};

export const ACHIEVEMENTS = [
  { id: 'first_wave', name: '初出茅庐', description: '完成第1波敌机' },
  { id: 'hundred_kills', name: '百人斩', description: '累计击落100架敌机' },
  { id: 'boss_slayer', name: '屠龙勇士', description: '击败第一个Boss' },
  { id: 'custom_master', name: '改装大师', description: '解锁所有部件3级' },
  { id: 'survivor', name: '幸存者', description: '达到第10波' },
] as const;

export const COLORS = {
  background: {
    start: '#0B0C10',
    end: '#1A1A2E',
  },
  weapon: '#FF4757',
  shield: '#3742FA',
  engine: '#2ED573',
  gold: '#FFD700',
  playerBullet: '#00D9FF',
  enemyBullet: '#FF6B6B',
  enemyRed: '#FF4757',
  enemyOrange: '#FF8C00',
  boss: '#FFD700',
  text: '#E0E0E0',
  textDim: '#888888',
} as const;
