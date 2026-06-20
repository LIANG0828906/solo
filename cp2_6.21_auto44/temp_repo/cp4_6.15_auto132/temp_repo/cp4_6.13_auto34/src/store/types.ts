export type TileType = 'ocean' | 'wreck' | 'trench';

export interface Position {
  x: number;
  y: number;
}

export type PartType = 'pipe_fragment' | 'valve' | 'engine_piece' | 'hull_plate' | 'circuit_board' | 'battery';

export interface CollectedPart {
  id: string;
  type: PartType;
  name: string;
  icon: string;
}

export type SlotRegion = 'hull' | 'pipeline' | 'engine';

export interface RepairSlot {
  id: string;
  region: SlotRegion;
  requiredType: PartType;
  filled: boolean;
  filledPart?: CollectedPart;
  label: string;
  x: number;
  y: number;
}

export interface GameEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export type GameView = 'map' | 'diving';

export type GamePhase = 'exploring' | 'searching' | 'repairing' | 'diving' | 'gameover' | 'victory';

export interface GameStore {
  playerPosition: Position;
  stamina: number;
  maxStamina: number;
  gamePhase: GamePhase;
  gameView: GameView;

  mapData: TileType[][];
  mapSize: number;
  fog: boolean[][];
  searchedWrecks: Set<string>;

  collectedParts: CollectedPart[];
  repairSlots: RepairSlot[];
  engineStarted: boolean;

  depth: number;
  maxDepth: number;
  oxygen: number;
  maxOxygen: number;
  pressure: number;
  maxPressure: number;
  submarineDamaged: boolean;

  events: GameEvent[];
  turn: number;
  isSearching: boolean;
  searchPosition: Position | null;
  matchCards: MatchCard[];
  matchedPairs: number;
  totalPairs: number;
  flippedCards: string[];

  setPlayerPosition: (pos: Position) => void;
  revealFog: (x: number, y: number) => void;
  addStamina: (amount: number) => void;
  consumeStamina: (amount: number) => boolean;
  setGamePhase: (phase: GamePhase) => void;
  setGameView: (view: GameView) => void;

  addCollectedPart: (part: CollectedPart) => void;
  removeCollectedPart: (partId: string) => void;
  fillRepairSlot: (slotId: string, part: CollectedPart) => void;
  setEngineStarted: (started: boolean) => void;
  checkRepairComplete: () => boolean;

  setDepth: (depth: number) => void;
  consumeOxygen: (amount: number) => void;
  setPressure: (pressure: number) => void;
  setSubmarineDamaged: (damaged: boolean) => void;

  addEvent: (message: string, type?: GameEvent['type']) => void;
  incrementTurn: () => void;
  markWreckSearched: (x: number, y: number) => void;
  isWreckSearched: (x: number, y: number) => boolean;

  startSearch: (pos: Position) => void;
  endSearch: () => void;
  setMatchCards: (cards: MatchCard[]) => void;
  flipCard: (cardId: string) => void;
  resetFlippedCards: () => void;
  incrementMatchedPairs: () => void;
}

export interface MatchCard {
  id: string;
  partType: PartType;
  icon: string;
  name: string;
  matched: boolean;
}
