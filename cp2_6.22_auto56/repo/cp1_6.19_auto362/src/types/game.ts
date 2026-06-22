export interface Position {
  x: number;
  y: number;
}

export interface Monster {
  id: string;
  position: Position;
  patrolPoints: Position[];
  currentPatrolIndex: number;
  mode: "patrol" | "chase";
  alive: boolean;
}

export interface BattleLog {
  id: string;
  message: string;
  timestamp: number;
}

export interface ExplosionEffect {
  id: string;
  position: Position;
  createdAt: number;
}

export interface DamageNumber {
  id: string;
  position: Position;
  value: number;
  createdAt: number;
}

export interface PathHighlight {
  position: Position;
  createdAt: number;
}
