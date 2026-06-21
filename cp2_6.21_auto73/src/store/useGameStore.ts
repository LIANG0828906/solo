import { create } from 'zustand';
import type { GameState, BattleResult, PlayerId, InitialGameData } from '../game/types';

type GamePage = 'waiting' | 'game' | 'result';

interface GameStore {
  page: GamePage;
  gameState: GameState | null;
  yourPlayerId: PlayerId;
  selectedPieceId: string | null;
  battleResult: BattleResult | null;
  showBattle: boolean;
  scoreAnimations: Record<PlayerId, number>;

  setPage: (page: GamePage) => void;
  setGameState: (state: GameState) => void;
  setYourPlayerId: (id: PlayerId) => void;
  setSelectedPieceId: (id: string | null) => void;
  setBattleResult: (result: BattleResult | null) => void;
  setShowBattle: (show: boolean) => void;
  triggerScoreAnimation: (playerId: PlayerId, delta: number) => void;
  resetGame: () => void;
  initFromGameData: (data: InitialGameData) => void;
}

const initialGameState: GameState = {
  board: [],
  players: {},
  currentPlayerId: '',
  turnTimeLeft: 15,
  gameStatus: 'waiting',
  winner: null,
  consecutiveNoOpTurns: 0,
};

export const useGameStore = create<GameStore>((set) => ({
  page: 'waiting',
  gameState: null,
  yourPlayerId: '',
  selectedPieceId: null,
  battleResult: null,
  showBattle: false,
  scoreAnimations: { player1: 0, player2: 0 },

  setPage: (page) => set({ page }),
  setGameState: (gameState) => set({ gameState }),
  setYourPlayerId: (yourPlayerId) => set({ yourPlayerId }),
  setSelectedPieceId: (selectedPieceId) => set({ selectedPieceId }),
  setBattleResult: (battleResult) => set({ battleResult }),
  setShowBattle: (showBattle) => set({ showBattle }),

  triggerScoreAnimation: (playerId, delta) =>
    set((state) => ({
      scoreAnimations: {
        ...state.scoreAnimations,
        [playerId]: state.scoreAnimations[playerId] + delta,
      },
    })),

  resetGame: () =>
    set({
      page: 'waiting',
      gameState: initialGameState,
      selectedPieceId: null,
      battleResult: null,
      showBattle: false,
      scoreAnimations: { player1: 0, player2: 0 },
    }),

  initFromGameData: (data) =>
    set({
      gameState: {
        board: data.board,
        players: data.players,
        currentPlayerId: data.currentPlayerId,
        turnTimeLeft: 15,
        gameStatus: 'playing',
        winner: null,
        consecutiveNoOpTurns: 0,
      },
      yourPlayerId: data.yourPlayerId,
      page: 'game',
    }),
}));
