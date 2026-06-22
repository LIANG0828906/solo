import { create } from 'zustand';
import type { PlayerInfo, GamePhase, AnswerState, Question, PlayerRanking } from './types';

interface GameState {
  phase: GamePhase;
  players: PlayerInfo[];
  currentQuestion: Question | null;
  questionIndex: number;
  totalRounds: number;
  timeRemaining: number;
  totalTime: number;
  answerState: AnswerState;
  rankings: PlayerRanking[];
  currentPlayerId: string;
  isTransitioning: boolean;
  roundEndTime: number | null;

  setPhase: (phase: GamePhase) => void;
  addPlayer: (player: PlayerInfo) => void;
  setCurrentQuestion: (q: Question, index: number) => void;
  setTimeRemaining: (t: number) => void;
  setTotalTime: (t: number) => void;
  setAnswerState: (s: AnswerState) => void;
  setRankings: (r: PlayerRanking[]) => void;
  setCurrentPlayerId: (id: string) => void;
  setIsTransitioning: (v: boolean) => void;
  setRoundEndTime: (t: number | null) => void;
  updatePlayerScore: (playerId: string, delta: number, isCorrect: boolean) => void;
  resetGame: () => void;
}

const initialState = {
  phase: 'waiting' as GamePhase,
  players: [],
  currentQuestion: null,
  questionIndex: 0,
  totalRounds: 10,
  timeRemaining: 10,
  totalTime: 10,
  answerState: { selectedIndex: null, isCorrect: null, isLocked: false } as AnswerState,
  rankings: [],
  currentPlayerId: '',
  isTransitioning: false,
  roundEndTime: null as number | null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  addPlayer: (player) => set((s) => ({ players: [...s.players, player] })),
  setCurrentQuestion: (q, index) => set({ currentQuestion: q, questionIndex: index }),
  setTimeRemaining: (t) => set({ timeRemaining: t }),
  setTotalTime: (t) => set({ totalTime: t }),
  setAnswerState: (s) => set({ answerState: s }),
  setRankings: (r) => set({ rankings: r }),
  setCurrentPlayerId: (id) => set({ currentPlayerId: id }),
  setIsTransitioning: (v) => set({ isTransitioning: v }),
  setRoundEndTime: (t) => set({ roundEndTime: t }),
  updatePlayerScore: (playerId, delta, isCorrect) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              score: p.score + delta,
              correctCount: p.correctCount + (isCorrect ? 1 : 0),
              totalTime: p.totalTime + (s.totalTime - s.timeRemaining),
            }
          : p
      ),
    })),
  resetGame: () => set({ ...initialState, players: [], rankings: [] }),
}));
