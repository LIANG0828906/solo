export type PlantType = 'mushroom' | 'thorn' | 'sunflower' | 'cherry';

export interface PlantData {
  type: PlantType;
  name: string;
  cost: number;
  attack: number;
  health: number;
  range: number;
  attackSpeed: number;
  description: string;
  color: string;
}

export interface Plant extends PlantData {
  instanceId: string;
  gridX: number;
  gridY: number;
  owner: 'red' | 'blue';
  lastAttackTime: number;
}

export interface Minion {
  instanceId: string;
  owner: 'red' | 'blue';
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attack: number;
  speed: number;
  lastAttackTime: number;
}

export interface Projectile {
  instanceId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  currentX: number;
  currentY: number;
  targetId: string;
  damage: number;
  color: string;
  speed: number;
  createdAt: number;
}

export interface Explosion {
  instanceId: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  createdAt: number;
  duration: number;
}

export interface Particle {
  instanceId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface Base {
  owner: 'red' | 'blue';
  health: number;
  maxHealth: number;
  gridX: number;
  gridY: number;
}

export interface Player {
  id: string;
  nickname: string;
  faction: 'red' | 'blue';
  mana: number;
  maxMana: number;
  lastManaRegen: number;
  connected: boolean;
  disconnectedAt?: number;
}

export interface GameRoom {
  id: string;
  players: Player[];
  plants: Plant[];
  minions: Minion[];
  projectiles: Projectile[];
  explosions: Explosion[];
  particles: Particle[];
  bases: Base[];
  gridWidth: number;
  gridHeight: number;
  turnInterval: number;
  lastTurnTime: number;
  lastMinionSpawn: number;
  minionSpawnInterval: number;
  gameStartTime: number;
  status: 'waiting' | 'playing' | 'finished';
  winner?: 'red' | 'blue';
}

export type MessageType = 
  | 'match' 
  | 'cancel_match' 
  | 'room_created' 
  | 'game_state' 
  | 'place_plant' 
  | 'plant_placed' 
  | 'attack' 
  | 'minion_spawn' 
  | 'game_over' 
  | 'reconnect' 
  | 'reconnect_success'
  | 'error';

export interface GameMessage<T = any> {
  type: MessageType;
  payload: T;
  timestamp: number;
}
