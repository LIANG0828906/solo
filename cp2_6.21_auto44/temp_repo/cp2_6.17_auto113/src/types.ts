export type PlayerId = 'player' | 'ai';

export interface Position {
  x: number;
  y: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  damage: number;
  range: number;
  type: 'damage' | 'control';
  stunDuration?: number;
}

export interface Hero {
  id: PlayerId;
  name: string;
  position: Position;
  displayPosition: Position;
  maxHp: number;
  currentHp: number;
  attack: number;
  moveRange: number;
  skills: Skill[];
  stunned: number;
  hasMoved: boolean;
  hasActed: boolean;
}

export interface LogEntry {
  id: string;
  turn: number;
  player: PlayerId;
  message: string;
  timestamp: number;
}

export type GamePhase = 'player_turn' | 'ai_turn' | 'game_over';

export interface GameState {
  gridSize: number;
  heroes: Record<PlayerId, Hero>;
  turn: number;
  currentPlayer: PlayerId;
  phase: GamePhase;
  logs: LogEntry[];
  winner: PlayerId | null;
  selectedSkill: string | null;
  isAnimating: boolean;
}

export type ActionType = 'move' | 'attack' | 'skill';

export interface GameAction {
  type: ActionType;
  player: PlayerId;
  target?: Position;
  skillId?: string;
}
