export type GameState = 'MENU' | 'EXPLORING' | 'COMBAT' | 'BOSS_FIGHT' | 'GAME_OVER' | 'TRANSITION';

export type RoomType = 'EMPTY' | 'EQUIPMENT' | 'MONSTER' | 'TRAP' | 'ENTRANCE' | 'STAIRS' | 'BOSS';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type EquipmentType = 'WEAPON' | 'ARMOR';

export type CombatTurn = 'PLAYER' | 'MONSTER';

export type CombatResult = 'ONGOING' | 'PLAYER_WIN' | 'PLAYER_LOSE';

export interface Position {
  x: number;
  y: number;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  name: string;
  attackBonus: number;
  defenseBonus: number;
  color: string;
}

export interface Monster {
  id: string;
  name: string;
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  color: string;
}

export interface Room {
  id: string;
  x: number;
  y: number;
  type: RoomType;
  monster?: Monster;
  equipment?: Equipment;
  trapDamage?: number;
  visited: boolean;
  doors: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
}

export interface Floor {
  level: number;
  rooms: Room[][];
  entrance: Position;
  stairs: Position;
  bossRoom?: Position;
}

export interface PlayerState {
  id: number;
  name: string;
  color: string;
  position: Position;
  renderPosition: Position;
  maxHp: number;
  hp: number;
  baseAttack: number;
  baseDefense: number;
  weapon?: Equipment;
  armor?: Equipment;
  defeatedMonsters: number;
  isMoving: boolean;
  moveProgress: number;
  moveDirection: Direction | null;
  attackAnimation: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
}

export interface CombatState {
  active: boolean;
  playerId: number;
  monster: Monster | null;
  turn: CombatTurn;
  result: CombatResult;
  playerAttackAnimation: number;
  monsterAttackAnimation: number;
  damageText: string;
  damageTextTimer: number;
  turnTimer: number;
}

export interface BossFightState {
  active: boolean;
  safeZoneRadius: number;
  safeZoneMaxRadius: number;
  safeZoneCenter: Position;
  shrinkTimer: number;
  damageTimer: number;
  player1AttackCooldown: number;
  player2AttackCooldown: number;
}

export interface GameConfig {
  ROOM_SIZE: number;
  GRID_WIDTH: number;
  GRID_HEIGHT: number;
  TOTAL_FLOORS: number;
  ROOMS_PER_FLOOR: number;
  PLAYER_MAX_HP: number;
  PLAYER_BASE_ATTACK: number;
  PLAYER_BASE_DEFENSE: number;
  GAME_DURATION: number;
  MOVE_DURATION: number;
  TRANSITION_DURATION: number;
  SAFE_ZONE_INITIAL_RADIUS: number;
  SAFE_ZONE_SHRINK_RATE: number;
  SAFE_ZONE_SHRINK_INTERVAL: number;
  SAFE_ZONE_DAMAGE: number;
  MAX_PARTICLES: number;
  TARGET_FPS: number;
}

export const CONFIG: GameConfig = {
  ROOM_SIZE: 80,
  GRID_WIDTH: 7,
  GRID_HEIGHT: 7,
  TOTAL_FLOORS: 3,
  ROOMS_PER_FLOOR: 10,
  PLAYER_MAX_HP: 100,
  PLAYER_BASE_ATTACK: 10,
  PLAYER_BASE_DEFENSE: 5,
  GAME_DURATION: 300,
  MOVE_DURATION: 0.2,
  TRANSITION_DURATION: 1,
  SAFE_ZONE_INITIAL_RADIUS: 200,
  SAFE_ZONE_SHRINK_RATE: 20,
  SAFE_ZONE_SHRINK_INTERVAL: 5,
  SAFE_ZONE_DAMAGE: 5,
  MAX_PARTICLES: 100,
  TARGET_FPS: 60
};
