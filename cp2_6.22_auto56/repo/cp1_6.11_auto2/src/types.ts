export type WeaponType = 'melee' | 'bow' | 'staff';

export interface WeaponStats {
  type: WeaponType;
  name: string;
  damage: number;
  attackSpeed: number;
  range: number;
  staminaCost: number;
  manaCost: number;
  color: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  value: number;
  age: number;
  lifetime: number;
  vx: number;
  vy: number;
  scale: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  size: number;
  color: string;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: 'arrow' | 'magic';
  lifetime: number;
  fromPlayer: boolean;
}

export interface ManaCrystal {
  id: number;
  x: number;
  y: number;
  manaAmount: number;
  age: number;
}

export interface AoeIndicator {
  x: number;
  y: number;
  radius: number;
  age: number;
  lifetime: number;
  damage: number;
}

export type EnemyType = 'normal' | 'elite' | 'boss';

export interface PlayerState {
  position: Position;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  currentWeapon: WeaponType;
  weaponTransition: number;
  isAttacking: boolean;
  attackProgress: number;
  facingAngle: number;
  potions: number;
}

export interface EnemyState {
  id: number;
  type: EnemyType;
  position: Position;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  size: number;
  color: string;
  attackCooldown: number;
  lastAttackTime: number;
  aoeCooldown: number;
  summonCooldown: number;
}
