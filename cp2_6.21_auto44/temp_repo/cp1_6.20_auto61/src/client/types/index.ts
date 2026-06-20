// 玩家信息类型
export interface Player {
  id: string;
  nickname: string;
  teamId: string;
  isReady: boolean;
  isHost: boolean;
  isCaptain: boolean;
  avatarGradient: string;
}

// 队伍信息类型
export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  helpUsed: boolean;
  hasAnswered: boolean;
  lastAnswerCorrect: boolean | null;
}

// 房间配置类型
export interface RoomConfig {
  totalRounds: number;
  timePerQuestion: number;
  teamCount: number;
}

// 房间状态类型
export interface RoomState {
  code: string;
  config: RoomConfig;
  players: Player[];
  teams: Team[];
  status: 'waiting' | 'playing' | 'ended';
  allReady: boolean;
}

// 题目类型
export interface Question {
  id: number;
  keywords: string[];
  options: string[];
  correctAnswerId: number;
  explanation: string;
  category: string;
}

// 回合状态类型
export interface RoundState {
  roundNumber: number;
  totalRounds: number;
  question: Question;
  timeRemaining: number;
  teamsAnswered: string[];
  helpActive: { fromTeamId: string; toTeamId: string } | null;
}

// 回合结果类型
export interface RoundResult {
  roundNumber: number;
  question: Question;
  teamAnswers: { teamId: string; answerId: number; correct: boolean; score: number }[];
  teamScores: { teamId: string; score: number }[];
}

// 最终结果类型
export interface FinalResult {
  winnerTeam: Team;
  allTeams: Team[];
  totalRounds: number;
}

// 客户端发送到服务端的Socket事件类型
export interface ClientToServerEvents {
  'room:create': (data: { nickname: string; config: RoomConfig }) => void;
  'room:join': (data: { nickname: string; roomCode: string }) => void;
  'room:leave': () => void;
  'player:ready': (ready: boolean) => void;
  'game:start': () => void;
  'game:answer': (data: { answerId: number }) => void;
  'game:useHelp': () => void;
  'game:helpAnswer': (data: { answerId: number; targetTeamId: string }) => void;
  'game:nextRound': () => void;
}

// 服务端发送到客户端的Socket事件类型
export interface ServerToClientEvents {
  'room:created': (data: { roomCode: string; playerId: string }) => void;
  'room:joined': (data: { room: RoomState; playerId: string }) => void;
  'room:error': (message: string) => void;
  'room:update': (room: RoomState) => void;
  'game:started': (state: RoomState) => void;
  'game:newRound': (round: RoundState) => void;
  'game:answerResult': (data: { teamId: string; correct: boolean; score: number }) => void;
  'game:helpRequested': (data: { fromTeamId: string; toTeamId: string; hint: string }) => void;
  'game:roundEnd': (data: RoundResult) => void;
  'game:ended': (data: FinalResult) => void;
}
