export type Rarity = 'gold' | 'purple' | 'blue' | 'green';
export type Element = 'fire' | 'water' | 'wind' | 'earth';
export type LogType = 'attack' | 'skill' | 'critical' | 'death' | 'info';
export type BattleSide = 'player' | 'enemy';

export interface Skill {
  name: string;
  description: string;
  multiplier: number;
  energyCost: number;
  cooldown: number;
  type: 'active' | 'passive';
  effect?: string;
}

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  element: Element;
  baseAttack: number;
  baseDefense: number;
  baseHp: number;
  speed: number;
  level: number;
  maxLevel: number;
  skills: Skill[];
  avatar: string;
}

export interface BattleCard extends Card {
  instanceId: string;
  side: BattleSide;
  currentHp: number;
  maxHp: number;
  currentEnergy: number;
  maxEnergy: number;
  cooldowns: Record<string, number>;
  isAlive: boolean;
  position: { row: number; col: number };
}

export interface BattleLogEntry {
  id: string;
  round: number;
  timestamp: number;
  type: LogType;
  attacker?: string;
  target?: string;
  damage?: number;
  message: string;
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  isSkill: boolean;
  skillName?: string;
  logEntry: BattleLogEntry;
}

export interface ActionResult {
  attacker: BattleCard;
  target: BattleCard;
  damageResult: DamageResult;
  updatedAttacker: BattleCard;
  updatedTarget: BattleCard;
  logs: BattleLogEntry[];
}

export interface BattleStats {
  totalDamage: number;
  maxSingleDamage: number;
  critCount: number;
  totalRounds: number;
}

export interface GameState {
  playerGold: number;
  ownedCards: Card[];
  teamSlots: (Card | null)[];
  isInBattle: boolean;
  currentRound: number;
  battleLog: BattleLogEntry[];
  battleResult: 'win' | 'lose' | null;
  playerTeam: BattleCard[];
  enemyTeam: BattleCard[];
  currentView: 'collection' | 'battle';
  selectedCard: Card | null;
  showResultModal: boolean;
  stats: BattleStats;
}
