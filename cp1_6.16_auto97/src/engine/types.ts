export type ElementType = 'fire' | 'water' | 'wood' | 'light' | 'dark';

export type Rarity = 1 | 2 | 3;

export type SkillType = 'normal' | 'power' | 'defense';

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  damage: number;
  energyCost: number;
  cooldown: number;
  currentCooldown: number;
  healAmount?: number;
  defenseBonus?: number;
}

export interface Spirit {
  id: string;
  name: string;
  element: ElementType;
  rarity: Rarity;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  maxEnergy: number;
  currentEnergy: number;
  skills: Skill[];
  description: string;
  level: number;
  exp: number;
  color: string;
  isDefending: boolean;
  defenseBonus: number;
}

export interface Player {
  id: string;
  name: string;
  spirits: Spirit[];
  activeSpiritId: string | null;
}

export type GamePhase = 'summon' | 'battle' | 'result';

export type TurnPhase = 'player' | 'enemy' | 'idle';

export interface BattleLogEntry {
  id: string;
  turn: number;
  actor: 'player' | 'enemy';
  action: string;
  damage?: number;
  isCritical?: boolean;
  heal?: number;
  message: string;
}

export interface BattleResult {
  winner: 'player' | 'enemy';
  totalTurns: number;
  totalDamageDealt: number;
  criticalHits: number;
  totalEnergyUsed: number;
  expGained: number;
}

export interface PathPoint {
  x: number;
  y: number;
}

export interface SummonPattern {
  id: string;
  name: string;
  element: ElementType;
  points: PathPoint[];
  spiritTemplate: Omit<Spirit, 'id' | 'currentHp' | 'currentEnergy' | 'skills' | 'level' | 'exp' | 'isDefending' | 'defenseBonus' | 'currentCooldown'>;
}

export interface SummonResult {
  success: boolean;
  similarity: number;
  spirit?: Spirit;
  matchedPattern?: SummonPattern;
  message: string;
}

export interface GameState {
  phase: GamePhase;
  turnPhase: TurnPhase;
  currentTurn: number;
  player: Player;
  enemy: Player;
  battleLog: BattleLogEntry[];
  collectedSpirits: Spirit[];
  summonFailCount: number;
  battleResult: BattleResult | null;
}
