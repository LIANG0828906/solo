export interface Card {
  id: string;
  front: string;
  back: string;
  type: 'knowledge' | 'prop';
  propEffect?: 'skip_turn' | 'steal_card' | 'double_score';
}

export interface GameRules {
  answerTimeLimit: number;
  drawLimitPerTurn: number;
}

export interface WinCondition {
  type: 'collect_knowledge' | 'correct_count';
  value: number;
}

export interface Game {
  id: string;
  teacherId: string;
  theme: string;
  cards: Card[];
  rules: GameRules;
  winCondition: WinCondition;
  createdAt: string;
}

export interface CardResult {
  cardId: string;
  cardFront: string;
  cardBack: string;
  correct: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatarId: number;
  score: number;
  hand: Card[];
  correctCount: number;
  wrongCount: number;
  propCount: number;
  results: CardResult[];
  skipped: boolean;
}

export interface Room {
  id: string;
  code: string;
  gameId: string;
  game: Game;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  currentTurnPlayerId: string | null;
  deck: Card[];
}

export interface GameReport {
  roomId: string;
  roomCode: string;
  theme: string;
  players: Player[];
  rankings: Player[];
  timestamp: string;
}

export interface Teacher {
  id: string;
  username: string;
}

export interface WSMessage {
  type: string;
  payload: unknown;
}

export const AVATARS = [
  { id: 1, name: '兔子', emoji: '🐰' },
  { id: 2, name: '猫咪', emoji: '🐱' },
  { id: 3, name: '小狗', emoji: '🐶' },
  { id: 4, name: '小熊', emoji: '🐻' },
  { id: 5, name: '狐狸', emoji: '🦊' },
  { id: 6, name: '熊猫', emoji: '🐼' },
  { id: 7, name: '老虎', emoji: '🐯' },
  { id: 8, name: '狮子', emoji: '🦁' },
  { id: 9, name: '猴子', emoji: '🐵' },
  { id: 10, name: '企鹅', emoji: '🐧' },
  { id: 11, name: '小鹿', emoji: '🦌' },
  { id: 12, name: '海豚', emoji: '🐬' },
] as const;

export const PROP_EFFECT_LABELS: Record<string, string> = {
  skip_turn: '跳过本轮',
  steal_card: '偷取对方一张卡',
  double_score: '双倍得分',
};
