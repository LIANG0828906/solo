export interface Idiom {
  word: string;
  pinyin: string;
  meaning: string;
  source: string;
  firstChar: string;
  lastChar: string;
  firstPinyin: string;
  lastPinyin: string;
  rarity: number;
}

export interface PlayerStats {
  totalAttempts: number;
  successCount: number;
  totalReactionTime: number;
  idiomsUsed: string[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
  isHost: boolean;
  lives: number;
  status: 'idle' | 'ready' | 'playing' | 'eliminated' | 'winner';
  stats: PlayerStats;
  color: string;
}

export interface ChainItem {
  idiom: Idiom;
  playerId: string;
  playerName: string;
  timestamp: number;
  reactionTime: number;
}

export type ActionType = 'success' | 'fail' | 'timeout' | 'skip';

export interface ActionRecord {
  round: number;
  playerId: string;
  playerName: string;
  action: ActionType;
  idiom?: string;
  timestamp: number;
  reactionTime?: number;
}

export interface GameState {
  round: number;
  currentPlayerIndex: number;
  chain: ChainItem[];
  currentWord: Idiom | null;
  timeRemaining: number;
  actionHistory: ActionRecord[];
  phase: 'waiting' | 'playing' | 'finished';
  winnerId: string | null;
  usedWords: Set<string>;
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type RoundTime = 20 | 30 | 40;

export interface RoomSettings {
  maxPlayers: 2 | 3 | 4;
  roundTime: RoundTime;
  aiDifficulty: AIDifficulty;
}

export interface Room {
  id: string;
  inviteCode: string;
  name: string;
  password: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  status: 'waiting' | 'playing' | 'finished';
  gameState: GameState | null;
  createdAt: number;
}

export interface PlayerResult {
  playerId: string;
  playerName: string;
  isAI: boolean;
  rank: number;
  avgReactionTime: number;
  successRate: number;
  idiomsUsed: string[];
  livesLeft: number;
}

export interface GameResult {
  roomId: string;
  winner: Player | null;
  players: PlayerResult[];
  totalRounds: number;
  duration: number;
  idiomsByFirstLetter: Record<string, number>;
  allIdiomsUsed: string[];
  actionHistory: ActionRecord[];
}

export type ViewType = 'lobby' | 'room' | 'game' | 'result';

export interface AppView {
  type: ViewType;
  roomId?: string;
}
