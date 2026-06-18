export interface PlayerInfo {
  id: string;
  nickname: string;
  avatarColor: string;
  score: number;
  correctCount: number;
  totalTime: number;
  isHost: boolean;
}

export interface PlayerAnswer {
  playerId: string;
  answerIndex: number;
  timeElapsed: number;
  isCorrect: boolean;
}

export interface PlayerRanking {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
  correctCount: number;
  avgTime: number;
  avatarColor: string;
}

export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

export type GamePhase = 'waiting' | 'playing' | 'transition' | 'result';

export interface AnswerState {
  selectedIndex: number | null;
  isCorrect: boolean | null;
  isLocked: boolean;
}

export type EventBusEventType =
  | 'playerJoined'
  | 'questionReceived'
  | 'timerSync'
  | 'answerSubmit'
  | 'roundEnd'
  | 'scoreUpdate'
  | 'rankUpdate'
  | 'roundUpdate'
  | 'gameEnd'
  | 'gameStart'
  | 'gameReset';

export interface EventBusEvent {
  type: EventBusEventType;
  payload: Record<string, unknown>;
}
