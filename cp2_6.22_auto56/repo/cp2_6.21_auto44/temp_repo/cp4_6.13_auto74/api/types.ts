export interface WeaponConfig {
  fireRate: number;
  damage: number;
  projectileColor: string;
}

export interface ShipPart {
  id: string;
  type: 'hull' | 'engine' | 'shield' | 'weapon';
  variant: number;
  slot: string;
  config?: WeaponConfig;
}

export interface ShipData {
  parts: ShipPart[];
}

export interface StarmapCell {
  type: 'empty' | 'asteroid' | 'enemy' | 'resource';
  explored: boolean;
}

export interface BattleAction {
  round: number;
  attacker: 'player' | 'enemy';
  weapon: string;
  damage: number;
  shieldAbsorbed: number;
  hullDamage: number;
  dodged: boolean;
}

export interface BattleResult {
  victory: boolean;
  playerHullRemaining: number;
  enemyHullRemaining: number;
  log: BattleAction[];
  resourcesGained: number;
  partsLost: string[];
}
