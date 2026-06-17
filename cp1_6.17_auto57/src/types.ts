export type Direction = 'up' | 'down' | 'left' | 'right';

export type EnemyType = 'slime' | 'skeleton' | 'bat';

export type ChestType = 'wooden' | 'silver';

export type TrapType = 'falling_rock' | 'spike';

export type ItemRarity = 'common' | 'rare' | 'epic';

export type ItemType = 'weapon' | 'armor' | 'accessory';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Player {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  gold: number;
  experience: number;
  experienceToNext: number;
  level: number;
  direction: Direction;
  isMoving: boolean;
  isAttacking: boolean;
  attackTimer: number;
  bounceTimer: number;
  bounceOffset: number;
  invincible: boolean;
  invincibleTimer: number;
  hurtFlash: boolean;
  hurtFlashTimer: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  attack: number;
  speed: number;
  direction: Direction;
  aiState: Record<string, number>;
  alive: boolean;
  deathTimer: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  owner: 'player' | 'enemy';
  color: string;
  size: number;
  active: boolean;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  stats: {
    attack?: number;
    defense?: number;
    health?: number;
  };
  icon: string;
}

export interface Chest {
  id: string;
  type: ChestType;
  x: number;
  y: number;
  width: number;
  height: number;
  opened: boolean;
  openAnimation: number;
  glowAnimation: number;
  contents: {
    gold?: number;
    item?: Item;
  };
}

export interface Trap {
  id: string;
  type: TrapType;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  animationTimer: number;
  triggered: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface Floor {
  level: number;
  width: number;
  height: number;
  floorColor: string;
  enemies: Enemy[];
  chests: Chest[];
  traps: Trap[];
  stairsX: number;
  stairsY: number;
  isBossFloor: boolean;
}

export interface GameState {
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';
  player: Player;
  currentFloor: number;
  totalFloors: number;
  floors: Floor[];
  timeRemaining: number;
  isTimeWarning: boolean;
  warningAlpha: number;
  inventory: Item[];
  projectiles: Projectile[];
  particles: Particle[];
  keys: Record<string, boolean>;
}

export interface GameActions {
  movePlayer: (direction: Direction) => void;
  attack: () => void;
  update: (deltaTime: number) => void;
  nextFloor: () => void;
  restart: () => void;
  setKey: (key: string, pressed: boolean) => void;
  addToInventory: (item: Item) => void;
  addGold: (amount: number) => void;
  addExperience: (amount: number) => void;
  damagePlayer: (amount: number) => void;
  updateEnemies: (enemies: Enemy[]) => void;
  updateChests: (chests: Chest[]) => void;
  updateTraps: (traps: Trap[]) => void;
  addProjectile: (projectile: Projectile) => void;
  updateProjectiles: (projectiles: Projectile[]) => void;
  addParticles: (particles: Particle[]) => void;
  updateParticles: (particles: Particle[]) => void;
}
