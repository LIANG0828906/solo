export type Rarity = 'common' | 'rare' | 'exotic';

export type PatternType = 
  | 'petal' 
  | 'spike' 
  | 'radiate' 
  | 'star' 
  | 'heart' 
  | 'bell' 
  | 'cluster' 
  | 'feather';

export interface Flower {
  id: string;
  name: string;
  rarity: Rarity;
  pattern: PatternType;
  color: string;
  secondaryColor: string;
  description: string;
}

export interface HandFlower extends Flower {
  instanceId: string;
  collectedAt: number;
}

export interface BattleRecord {
  round: number;
  playerFlower: Flower;
  aiFlower: Flower;
  winner: 'player' | 'ai' | 'draw';
}

export type GamePhase = 'collecting' | 'battling' | 'result';

export interface CurrentBattle {
  playerFlower: Flower | null;
  aiFlower: Flower | null;
  result: 'player' | 'ai' | 'draw' | null;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  playerScore: number;
  aiScore: number;
  gardenFlowers: Flower[];
  playerHand: HandFlower[];
  battleRecords: BattleRecord[];
  currentBattle: CurrentBattle | null;
  collectingFlowerId: string | null;
}

export interface GameActions {
  initGame: () => void;
  collectFlower: (flowerId: string) => void;
  startBattle: () => void;
  resolveBattle: () => void;
  nextRound: () => void;
  showResult: () => void;
  restartGame: () => void;
  setCollectingFlowerId: (id: string | null) => void;
}

export type Title = '花魁' | '探花' | '榜眼' | '进士' | '秀才' | '白丁';

export const RARITY_LABEL: Record<Rarity, string> = {
  common: '普通',
  rare: '珍品',
  exotic: '异种',
};

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 1,
  rare: 2,
  exotic: 3,
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8d6e63',
  rare: '#7b1fa2',
  exotic: '#ff6f00',
};
