export type ElementType = 'fire' | 'water' | 'earth' | 'wind' | 'neutral';
export type CardType = 'minion' | 'spell' | 'hero_power';
export type ActionType = 'play' | 'attack' | 'spell' | 'hero_power' | 'end_turn';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  element?: ElementType;
  attack?: number;
  health?: number;
  maxHealth?: number;
  spellEffect?: string;
  image?: string;
}

export interface Unit {
  id: string;
  cardId: string;
  name: string;
  attack: number;
  health: number;
  maxHealth: number;
  element: ElementType;
  position: { x: number; y: number };
  owner: 'player' | 'enemy';
  canAttack: boolean;
  hasTaunt: boolean;
}

export interface Player {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  heroPower: Card | null;
  heroPowerUsed: boolean;
}

export interface GameState {
  turn: number;
  currentPlayer: 'player' | 'enemy';
  player: Player;
  enemy: Player;
  board: (Unit | null)[][];
  selectedCard: Card | null;
  selectedUnit: Unit | null;
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;
}

export interface SimulationStep {
  id: string;
  action: ActionType;
  description: string;
  card?: Card;
  unit?: Unit;
  targetPosition?: { x: number; y: number };
  boardSnapshot: (Unit | null)[][];
  playerHealth: number;
  enemyHealth: number;
  playerMana: number;
}

export interface Recommendation {
  id: string;
  rank: number;
  winRate: number;
  description: string;
  steps: SimulationStep[];
  totalDamage: number;
  boardValue: number;
}

export interface AnalysisResult {
  turn: number;
  recommendations: Recommendation[];
  analysisTime: number;
  totalSimulations: number;
}

export interface LogEntry {
  id: string;
  turn: number;
  action: ActionType;
  description: string;
  timestamp: number;
}
