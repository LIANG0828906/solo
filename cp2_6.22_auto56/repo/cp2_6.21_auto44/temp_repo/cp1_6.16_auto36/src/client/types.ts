export type ElementType = 'wall' | 'item' | 'clue' | 'exit';
export type InteractionType = 'click_text' | 'drag_target' | 'password' | 'sequence_trigger';
export type PuzzleType = 'sequence' | 'password' | 'position_combo';

export interface RoomElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  interaction?: {
    type: InteractionType;
    content?: string;
    targetId?: string;
    password?: string;
    triggerId?: string;
  };
  color?: string;
}

export interface Puzzle {
  id: string;
  level: number;
  type: PuzzleType;
  solution: string[] | string | { elementId: string; x: number; y: number }[];
  hint: string;
  unlocksExit?: boolean;
}

export interface RoomLayout {
  width: number;
  height: number;
  elements: RoomElement[];
  puzzles: Puzzle[];
  startPosition: { x: number; y: number };
  name: string;
}

export interface PlayerState {
  id: string;
  nickname: string;
  x: number;
  y: number;
  currentLevel: number;
  startTime: number;
  inventory: string[];
  solvedPuzzles: string[];
  sequenceProgress: string[];
}

export interface LeaderboardEntry {
  nickname: string;
  timeMs: number;
  rank: number;
}

export interface RoomState {
  layout: RoomLayout;
  players: Map<string, PlayerState>;
  currentSequence: string[];
  exitUnlocked: boolean;
}

export type ClientMessage =
  | { type: 'join_room'; roomId: string; nickname?: string; role: 'player' | 'observer' }
  | { type: 'player_move'; x: number; y: number }
  | { type: 'player_interact'; elementId: string; action: string; payload?: any }
  | { type: 'leave_room' };

export type ServerMessage =
  | { type: 'room_state'; layout: RoomLayout; players: PlayerState[]; exitUnlocked: boolean }
  | { type: 'player_joined'; player: PlayerState }
  | { type: 'player_left'; playerId: string }
  | { type: 'player_moved'; playerId: string; x: number; y: number }
  | { type: 'player_interacted'; playerId: string; elementId: string; action: string }
  | { type: 'puzzle_solved'; puzzleId: string; nextLevel?: number }
  | { type: 'puzzle_failed'; reason: string }
  | { type: 'level_complete'; level: number }
  | { type: 'show_text'; content: string }
  | { type: 'unlock_exit' }
  | { type: 'game_complete'; time: number; rank: number; rankings: LeaderboardEntry[] };
