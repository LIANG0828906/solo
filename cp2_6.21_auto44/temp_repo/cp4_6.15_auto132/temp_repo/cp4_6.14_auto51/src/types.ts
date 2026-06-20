export interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  maxHealth: number;
  effectText: string;
}

export type Deck = Card[];

export interface BattleCard extends Card {
  instanceId: string;
  owner: 'A' | 'B';
  currentHealth: number;
  position: { row: number; col: number } | null;
  hasAttacked: boolean;
  justSummoned: boolean;
}

export interface BattleLogEntry {
  id: string;
  turn: number;
  message: string;
  timestamp: number;
}

export interface BattleStats {
  winner: 'A' | 'B' | 'draw';
  aSurvivors: number;
  bSurvivors: number;
  aTotalHealth: number;
  bTotalHealth: number;
}
