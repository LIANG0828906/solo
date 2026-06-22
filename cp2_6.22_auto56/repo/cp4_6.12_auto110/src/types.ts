export interface ModuleType {
  id: string;
  name: string;
  category: 'cockpit' | 'engine' | 'weapon' | 'shield' | 'cargo';
  weight: number;
  energyCost: number;
  hp: number;
  attack: number;
  armor: number;
  color: string;
  icon: string;
}

export interface ShipModule {
  moduleId: string;
  type: ModuleType;
  gridX: number;
  gridY: number;
}

export interface BattleshipState {
  shipId: string;
  ownerId: string;
  modules: ShipModule[];
  totalHP: number;
  maxHP: number;
  totalAttack: number;
  totalArmor: number;
  totalWeight: number;
  totalEnergy: number;
  thrustCap: number;
  energyCap: number;
  posX: number;
  posY: number;
  alive: boolean;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  ownerId: string;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  z: number;
  particleCount: number;
  radius: number;
  duration: number;
  elapsed: number;
  colors: string[];
}

export interface BattleState {
  player: BattleshipState;
  opponent: BattleshipState;
  bullets: Bullet[];
  explosions: Explosion[];
  phase: 'idle' | 'fighting' | 'ended';
  winner: string | null;
}

export type GamePhase = 'lobby' | 'building' | 'battle';

export interface PlayerInfo {
  id: string;
  name: string;
  shipSnapshot: string | null;
  online: boolean;
}
