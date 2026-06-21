export interface Rune {
  id: string;
  name: string;
  element: string;
  color: string;
  glowColor: string;
  symbol: string;
}

export interface RuneSpell {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'heal';
  effect: string;
  power: number;
  color: string;
  gradient: string;
}

export interface Formula {
  id: string;
  runes: string[];
  result: RuneSpell;
}

export interface BattleScore {
  id: string;
  playerName: string;
  remainingHp: number;
  turns: number;
  totalDamage: number;
  score: number;
  date: string;
}

export interface BattleLog {
  turn: number;
  message: string;
  type: 'attack' | 'defense' | 'heal' | 'system';
}

export interface BattleState {
  playerHp: number;
  enemyHp: number;
  maxHp: number;
  defenseTurns: number;
  currentTurn: number;
  totalDamage: number;
  logs: BattleLog[];
  isRunning: boolean;
  isFinished: boolean;
  isVictory: boolean;
  spells: RuneSpell[];
}

export interface CraftingState {
  grid: (string | null)[][];
  selectedCells: { row: number; col: number }[];
  isAnimating: boolean;
  animationType: 'success' | 'failure' | null;
  backpack: RuneSpell[];
}

export interface BattleResult {
  remainingHp: number;
  turns: number;
  totalDamage: number;
  isVictory: boolean;
  rank: number;
  leaderboard: BattleScore[];
}
