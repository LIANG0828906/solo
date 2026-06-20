export type TerrainType = 'plain' | 'rune' | 'crack' | 'lava' | 'base';
export type RuneColor = 'red' | 'blue' | 'yellow' | 'green';
export type PlayerType = 'player' | 'ai';

export interface HexCoord {
  q: number;
  r: number;
}

export interface HexCell {
  coord: HexCoord;
  terrain: TerrainType;
  runeColor?: RuneColor;
  hasRune: boolean;
  isBase: boolean;
  baseOwner?: PlayerType;
}

export interface Cart {
  id: string;
  owner: PlayerType;
  position: HexCoord;
  carrying: RuneColor | null;
}

export interface Track {
  from: HexCoord;
  to: HexCoord;
  owner: PlayerType;
}

export interface PlayerState {
  type: PlayerType;
  score: number;
  runesCollected: number;
  cart: Cart;
}

export interface GameState {
  grid: HexCell[][];
  hexSize: number;
  gridWidth: number;
  gridHeight: number;
  tracks: Track[];
  players: Record<PlayerType, PlayerState>;
  currentTurn: PlayerType;
  turnNumber: number;
  gameOver: boolean;
  winner: PlayerType | null;
  actionTaken: boolean;
}
