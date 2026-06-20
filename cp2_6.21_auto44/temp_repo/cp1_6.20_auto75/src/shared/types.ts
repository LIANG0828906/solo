export type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'light';

export type RarityType = 'common' | 'rare' | 'epic' | 'legendary';

export type EffectType = 'burn' | 'freeze' | 'stun' | 'heal' | 'shield';

export type TeamSide = 'player' | 'enemy';

export interface Skill {
  id: string;
  name: string;
  damageMultiplier: number;
  cooldown: number;
  effect?: {
    type: EffectType;
    duration: number;
    value: number;
  };
  description: string;
}

export interface Dragon {
  id: string;
  name: string;
  element: ElementType;
  rarity: RarityType;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  skills: Skill[];
  avatarColor: string;
  description: string;
}

export interface BattleDragon extends Dragon {
  currentHp: number;
  maxHp: number;
  currentAttack: number;
  currentDefense: number;
  currentSpeed: number;
  statusEffects: StatusEffect[];
  skillCooldowns: Record<string, number>;
  position: { row: number; col: number };
  side: TeamSide;
  isAlive: boolean;
}

export interface StatusEffect {
  type: EffectType;
  duration: number;
  value: number;
  source: string;
}

export interface TeamConfig {
  dragons: Dragon[];
}

export interface BattleLogEntry {
  id: string;
  turn: number;
  actor: string;
  actorTeam: TeamSide;
  action: string;
  damage?: number;
  effect?: string;
  target?: string;
  timestamp: number;
}

export interface BattleStatistics {
  totalDamageDealt: Record<string, number>;
  totalDamageTaken: Record<string, number>;
  totalHealing: Record<string, number>;
  turnsCount: number;
  winner: TeamSide | null;
}

export interface BattleResult {
  logs: BattleLogEntry[];
  statistics: BattleStatistics;
  winner: TeamSide | null;
}
