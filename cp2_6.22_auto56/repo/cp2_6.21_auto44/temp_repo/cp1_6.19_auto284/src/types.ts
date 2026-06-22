export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CardType = 'unit' | 'spell';
export type TerrainType = 'empty' | 'fire' | 'ice' | 'grass' | 'rock' | 'fence';
export type PlayerSide = 'player1' | 'player2';

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'onMove' | 'onAttack';
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  rarity: Rarity;
  attack?: number;
  health?: number;
  movement?: number;
  skills: Skill[];
  description: string;
  lore: string;
  spriteColor: string;
  communityRating: number;
}

export interface DeckCard {
  cardId: string;
  count: number;
}

export interface Deck {
  id: string;
  name: string;
  cards: DeckCard[];
  boundMapId?: string;
  createdAt: number;
}

export interface Unit {
  id: string;
  cardId: string;
  owner: PlayerSide;
  position: { x: number; y: number };
  currentHealth: number;
  maxHealth: number;
  attack: number;
  movement: number;
  movementRemaining: number;
  hasAttacked: boolean;
  skills: Skill[];
  spriteColor: string;
}

export interface BattleCell {
  x: number;
  y: number;
  terrain: TerrainType;
  unit?: Unit;
}

export type GamePhase = 'idle' | 'matching' | 'playing' | 'ended';

export interface Player {
  id: string;
  name: string;
  side: PlayerSide;
  deck: Deck;
  hand: string[];
  mana: number;
  maxMana: number;
  health: number;
}

export interface GameState {
  phase: GamePhase;
  turn: number;
  currentPlayer: PlayerSide;
  turnTimeRemaining: number;
  players: Record<PlayerSide, Player | null>;
  board: BattleCell[][];
  battleLog: string[];
  winner?: PlayerSide;
  replayActions: ReplayAction[];
}

export interface ReplayAction {
  timestamp: number;
  turn: number;
  type: 'summon' | 'move' | 'attack' | 'spell' | 'endTurn';
  data: Record<string, unknown>;
}

export interface BattleMap {
  id: string;
  name: string;
  cells: TerrainType[][];
  createdAt: number;
}

export interface EditorState {
  currentTool: TerrainType;
  cells: TerrainType[][];
  undoStack: TerrainType[][][];
  redoStack: TerrainType[][][];
  selectedMapId?: string;
}

export type NavTab = 'deck' | 'match' | 'editor' | 'history';
