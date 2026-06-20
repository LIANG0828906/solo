import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import {
  GameState,
  GamePhase,
  ConnectionStatus,
  Player,
  AttackResult,
  AttackHistoryEntry,
  EmoteBubble,
  PlacingShip,
  TURN_DURATION,
} from '../engine/types';
import { GameEngine } from '../engine/GameEngine';

interface GameStore extends GameState {
  emotes: EmoteBubble[];
  placingShip: PlacingShip | null;
  replayIndex: number;
  isReplayPlaying: boolean;
  highlightedCell: { row: number; col: number } | null;

  setPhase: (phase: GamePhase) => void;
  setPlayer: (player: Player) => void;
  setOpponent: (opponent: Player) => void;
  setCurrentPlayerId: (id: string) => void;
  setTurnTimeLeft: (time: number) => void;
  setWinnerId: (id: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setRoomId: (roomId: string | null) => void;
  setPlacingShip: (placingShip: PlacingShip | null) => void;
  setHighlightedCell: (cell: { row: number; col: number } | null) => void;

  addAttackHistory: (entry: AttackHistoryEntry) => void;
  addEmote: (emote: EmoteBubble) => void;
  removeEmote: (id: string) => void;

  applyAttackResult: (result: AttackResult, isPlayerAttack: boolean) => void;
  startReplay: () => void;
  stopReplay: () => void;
  setReplayIndex: (index: number) => void;

  resetGame: () => void;
  initializeGame: (playerId: string, playerName: string, opponentName: string) => void;
}

const createInitialPlayer = (id: string, name: string): Player => {
  return GameEngine.createPlayer(id, name);
};

const createInitialState = (playerId: string, playerName: string): GameState => ({
  phase: GamePhase.IDLE,
  currentPlayerId: '',
  player: createInitialPlayer(playerId, playerName),
  opponent: createInitialPlayer('', '对手'),
  turnTimeLeft: TURN_DURATION,
  winnerId: null,
  attackHistory: [],
  connectionStatus: ConnectionStatus.DISCONNECTED,
  roomId: null,
});

const generatePlayerId = (): string => {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const playerId = generatePlayerId();
const playerName = `玩家${Math.floor(Math.random() * 1000)}`;

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(playerId, playerName),
  emotes: [],
  placingShip: null,
  replayIndex: 0,
  isReplayPlaying: false,
  highlightedCell: null,

  setPhase: (phase) => set({ phase }),
  setPlayer: (player) => set({ player }),
  setOpponent: (opponent) => set({ opponent }),
  setCurrentPlayerId: (currentPlayerId) => set({ currentPlayerId }),
  setTurnTimeLeft: (turnTimeLeft) => set({ turnTimeLeft }),
  setWinnerId: (winnerId) => set({ winnerId }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setRoomId: (roomId) => set({ roomId }),
  setPlacingShip: (placingShip) => set({ placingShip }),
  setHighlightedCell: (highlightedCell) => set({ highlightedCell }),

  addAttackHistory: (entry) =>
    set((state) => ({
      attackHistory: [...state.attackHistory, entry],
    })),

  addEmote: (emote) =>
    set((state) => ({
      emotes: [...state.emotes, emote],
    })),

  removeEmote: (id) =>
    set((state) => ({
      emotes: state.emotes.filter((e) => e.id !== id),
    })),

  applyAttackResult: (result, isPlayerAttack) => {
    set((state) => {
      if (isPlayerAttack) {
        const { defender, result: processedResult } = GameEngine.processAttack(
          state.opponent,
          state.currentPlayerId,
          result.row,
          result.col
        );
        return {
          opponent: defender,
          winnerId: processedResult.isGameOver ? state.currentPlayerId : null,
          phase: processedResult.isGameOver ? GamePhase.GAME_OVER : state.phase,
        };
      } else {
        const { defender, result: processedResult } = GameEngine.processAttack(
          state.player,
          state.opponent.id,
          result.row,
          result.col
        );
        return {
          player: defender,
          winnerId: processedResult.isGameOver ? state.opponent.id : null,
          phase: processedResult.isGameOver ? GamePhase.GAME_OVER : state.phase,
        };
      }
    });
  },

  startReplay: () => set({ phase: GamePhase.REPLAY, replayIndex: 0, isReplayPlaying: true }),
  stopReplay: () => set({ isReplayPlaying: false }),
  setReplayIndex: (replayIndex) => set({ replayIndex }),

  resetGame: () => {
    const state = get();
    set({
      ...createInitialState(state.player.id, state.player.name),
      emotes: [],
      placingShip: null,
      replayIndex: 0,
      isReplayPlaying: false,
      highlightedCell: null,
    });
  },

  initializeGame: (newPlayerId, newPlayerName, opponentName) => {
    set({
      player: createInitialPlayer(newPlayerId, newPlayerName),
      opponent: createInitialPlayer('', opponentName),
      phase: GamePhase.PLACING,
      attackHistory: [],
      winnerId: null,
      turnTimeLeft: TURN_DURATION,
      emotes: [],
      placingShip: null,
    });
  },
}));

export const usePlayer = () => useGameStore((state) => state.player, shallow);
export const useOpponent = () => useGameStore((state) => state.opponent, shallow);
export const useGamePhase = () => useGameStore((state) => state.phase);
export const useCurrentPlayerId = () => useGameStore((state) => state.currentPlayerId);
export const useIsMyTurn = () => {
  const currentPlayerId = useGameStore((state) => state.currentPlayerId);
  const playerId = useGameStore((state) => state.player.id);
  return currentPlayerId === playerId;
};
export const useTurnTimeLeft = () => useGameStore((state) => state.turnTimeLeft);
export const useAttackHistory = () => useGameStore((state) => state.attackHistory, shallow);
export const useWinnerId = () => useGameStore((state) => state.winnerId);
export const useEmotes = () => useGameStore((state) => state.emotes, shallow);
export const usePlacingShip = () => useGameStore((state) => state.placingShip, shallow);
export const useConnectionStatus = () => useGameStore((state) => state.connectionStatus);
export const useHighlightedCell = () => useGameStore((state) => state.highlightedCell, shallow);
export const useReplayState = () =>
  useGameStore(
    (state) => ({
      isReplayPlaying: state.isReplayPlaying,
      replayIndex: state.replayIndex,
    }),
    shallow
  );
