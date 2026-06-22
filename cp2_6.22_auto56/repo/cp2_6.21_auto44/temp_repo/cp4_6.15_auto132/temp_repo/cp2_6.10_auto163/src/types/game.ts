export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

export type BetOption = 'big' | 'small' | 'odd' | 'even' | 'pair' | 'triple';

export interface Bet {
  id: string;
  option: BetOption;
  amount: number;
  playerId: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  isBanker: boolean;
  isAI: boolean;
}

export type GamePhase = 'betting' | 'rolling' | 'revealing' | 'settling';

export interface GameResult {
  big: boolean;
  small: boolean;
  odd: boolean;
  even: boolean;
  pair: boolean;
  triple: boolean;
  sum: number;
}

export interface GameHistory {
  id: string;
  dice: [DiceValue, DiceValue, DiceValue];
  result: GameResult;
  bets: Bet[];
  timestamp: number;
  playerProfit: number;
}

export interface GameState {
  currentPlayer: Player;
  aiPlayers: Player[];
  banker: Player | null;
  phase: GamePhase;
  dice: [DiceValue, DiceValue, DiceValue];
  bets: Bet[];
  history: GameHistory[];
  selectedBetAmount: number;
  placeBet: (option: BetOption, amount: number) => void;
  rollDice: () => void;
  becomeBanker: () => void;
  leaveBanker: () => void;
  startNewRound: () => void;
  setSelectedBetAmount: (amount: number) => void;
}

export const BET_OPTIONS: Record<BetOption, { label: string; odds: number; description: string }> = {
  big: { label: '大', odds: 1, description: '点数和 10-18' },
  small: { label: '小', odds: 1, description: '点数和 3-9' },
  odd: { label: '单', odds: 1, description: '点数和为奇数' },
  even: { label: '双', odds: 1, description: '点数和为偶数' },
  pair: { label: '对子', odds: 8, description: '两枚点数相同' },
  triple: { label: '围骰', odds: 24, description: '三枚点数相同' },
};

export const INITIAL_CHIPS = 1000;
