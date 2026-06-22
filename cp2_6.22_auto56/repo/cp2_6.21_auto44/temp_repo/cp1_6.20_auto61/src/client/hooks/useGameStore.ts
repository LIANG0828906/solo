import { create } from 'zustand';

// 页面状态类型
export type PageState = 'lobby' | 'room' | 'game' | 'roundResult' | 'finalResult';

// 玩家信息类型
interface Player {
  id: string;
  nickname: string;
  teamId: string;
  isReady: boolean;
  isHost: boolean;
  isCaptain: boolean;
  avatarGradient: string;
}

// 队伍类型
interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  helpUsed: boolean;
  hasAnswered: boolean;
  lastAnswerCorrect: boolean | null;
}

// 房间配置类型
interface RoomConfig {
  totalRounds: number;
  timePerQuestion: number;
  teamCount: number;
}

// 房间状态类型
interface RoomState {
  code: string;
  config: RoomConfig;
  players: Player[];
  teams: Team[];
  status: 'waiting' | 'playing' | 'ended';
  allReady: boolean;
}

// 题目类型
interface Question {
  id: number;
  keywords: string[];
  options: string[];
  correctAnswerId: number;
  explanation: string;
  category: string;
}

// 回合状态类型
interface RoundState {
  roundNumber: number;
  totalRounds: number;
  question: Question;
  timeRemaining: number;
  teamsAnswered: string[];
  helpActive: { fromTeamId: string; toTeamId: string } | null;
}

// 回合结果类型
interface RoundResult {
  roundNumber: number;
  question: Question;
  teamAnswers: { teamId: string; answerId: number; correct: boolean; score: number }[];
  teamScores: { teamId: string; score: number }[];
}

// 最终结果类型
interface FinalResult {
  winnerTeam: Team;
  allTeams: Team[];
  totalRounds: number;
}

// 游戏状态Store类型
interface GameStore {
  // 当前玩家信息
  playerId: string;
  nickname: string;
  roomCode: string;

  // 游戏状态
  roomState: RoomState | null;
  roundState: RoundState | null;
  roundResult: RoundResult | null;
  finalResult: FinalResult | null;

  // 页面状态
  pageState: PageState;

  // Action方法 - 玩家信息
  setPlayerInfo: (playerId: string, nickname: string, roomCode: string) => void;
  setPlayerId: (playerId: string) => void;
  setNickname: (nickname: string) => void;
  setRoomCode: (roomCode: string) => void;

  // Action方法 - 游戏状态
  setRoomState: (roomState: RoomState) => void;
  setRoundState: (roundState: RoundState) => void;
  setRoundResult: (roundResult: RoundResult) => void;
  setFinalResult: (finalResult: FinalResult) => void;

  // Action方法 - 页面状态
  setPageState: (pageState: PageState) => void;

  // Action方法 - 重置游戏状态
  resetGame: () => void;
}

/**
 * Zustand全局状态管理
 * - 存储当前玩家信息(playerId, nickname, roomCode)
 * - 存储roomState, roundState, roundResult, finalResult
 * - 存储页面状态
 * - 提供action方法更新各状态
 */
export const useGameStore = create<GameStore>((set) => ({
  // 当前玩家信息初始值
  playerId: '',
  nickname: '',
  roomCode: '',

  // 游戏状态初始值
  roomState: null,
  roundState: null,
  roundResult: null,
  finalResult: null,

  // 页面状态初始值
  pageState: 'lobby',

  // 设置完整玩家信息
  setPlayerInfo: (playerId, nickname, roomCode) => {
    set({ playerId, nickname, roomCode });
  },

  // 设置玩家ID
  setPlayerId: (playerId) => {
    set({ playerId });
  },

  // 设置玩家昵称
  setNickname: (nickname) => {
    set({ nickname });
  },

  // 设置房间码
  setRoomCode: (roomCode) => {
    set({ roomCode });
  },

  // 设置房间状态
  setRoomState: (roomState) => {
    set({ roomState });
  },

  // 设置回合状态
  setRoundState: (roundState) => {
    set({ roundState, roundResult: null });
  },

  // 设置回合结果
  setRoundResult: (roundResult) => {
    set({ roundResult, pageState: 'roundResult' });
  },

  // 设置最终结果
  setFinalResult: (finalResult) => {
    set({ finalResult, pageState: 'finalResult' });
  },

  // 设置页面状态
  setPageState: (pageState) => {
    set({ pageState });
  },

  // 重置所有游戏状态
  resetGame: () => {
    set({
      playerId: '',
      nickname: '',
      roomCode: '',
      roomState: null,
      roundState: null,
      roundResult: null,
      finalResult: null,
      pageState: 'lobby',
    });
  },
}));
