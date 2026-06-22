import { create } from 'zustand';
import type { Player, Piece, PlayerColor, EventCardType, GamePhase, GameEvent } from './types';
import * as GameLogic from './GameLogic';
import { v4 as uuidv4 } from 'uuid';

interface GameStoreState {
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  phase: GamePhase;
  eventQueue: GameEvent[];
  winner: string | null;
  timestamp: number;
  turnTimer: number;
  selectedPieceId: string | null;
  movingPieceId: string | null;
  movingPiecePath: number[];
  movingPieceProgress: number;
  isAnimating: boolean;
  flashingPieceIds: string[];
  activeEventCard: EventCardType | null;
  localPlayerId: string | null;
}

interface GameStoreActions {
  initGame: (playerNames: Array<{ name: string; color: PlayerColor }>) => void;
  rollDice: () => void;
  selectPiece: (pieceId: string) => void;
  moveSelectedPiece: () => void;
  useEventCard: (cardType: EventCardType) => void;
  endTurn: () => void;
  kickPiece: (pieceId: string) => void;
  setTurnTimer: (time: number) => void;
  setMovingProgress: (progress: number) => void;
  finishAnimation: () => void;
  clearFlashing: () => void;
  dismissEventCard: () => void;
  applyRemoteState: (state: Partial<GameStoreState>) => void;
  setLocalPlayer: (playerId: string) => void;
  resetGame: () => void;
}

type GameStore = GameStoreState & GameStoreActions;

const initialState: GameStoreState = {
  players: [],
  currentPlayerIndex: 0,
  diceValue: null,
  isRolling: false,
  phase: 'waiting',
  eventQueue: [],
  winner: null,
  timestamp: Date.now(),
  turnTimer: 30,
  selectedPieceId: null,
  movingPieceId: null,
  movingPiecePath: [],
  movingPieceProgress: 0,
  isAnimating: false,
  flashingPieceIds: [],
  activeEventCard: null,
  localPlayerId: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  initGame: (playerNames) => {
    const createPieces = (): Piece[] => {
      return Array.from({ length: 4 }, () => ({
        id: uuidv4(),
        position: -1,
        distanceTraveled: 0,
        isHome: false,
      }));
    };

    const createPlayers = (names: Array<{ name: string; color: PlayerColor }>): Player[] => {
      return names.map((pn, index) => ({
        id: uuidv4(),
        name: pn.name,
        color: pn.color,
        pieces: createPieces(),
        eventCards: ['advance2_clear', 'retreat3_collision', 'teleport_ally'],
        isCurrentTurn: index === 0,
      }));
    };

    const players = createPlayers(playerNames);
    set({
      players,
      currentPlayerIndex: 0,
      diceValue: null,
      isRolling: false,
      phase: 'waiting',
      eventQueue: [],
      winner: null,
      timestamp: Date.now(),
      turnTimer: 30,
      selectedPieceId: null,
      movingPieceId: null,
      movingPiecePath: [],
      movingPieceProgress: 0,
      isAnimating: false,
      flashingPieceIds: [],
      activeEventCard: null,
    });
  },

  rollDice: () => {
    const state = get();
    if (state.phase !== 'waiting' && state.phase !== 'rolling') return;

    set({ isRolling: true, phase: 'rolling' });

    setTimeout(() => {
      const diceValue = GameLogic.rollDice();
      const currentPlayer = get().players[get().currentPlayerIndex];
      const movablePieces = GameLogic.getMovablePieces(currentPlayer, diceValue);

      set({
        diceValue,
        isRolling: false,
        phase: 'moving',
        timestamp: Date.now(),
      });

      if (movablePieces.length === 0) {
        setTimeout(() => {
          get().endTurn();
        }, 1000);
      }
    }, 1000);
  },

  selectPiece: (pieceId) => {
    const state = get();
    if (state.phase !== 'moving') return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    const movablePieces = GameLogic.getMovablePieces(currentPlayer, state.diceValue!);
    const isMovable = movablePieces.some(p => p.id === pieceId);

    if (!isMovable) return;

    set({ selectedPieceId: pieceId });
  },

  moveSelectedPiece: () => {
    const state = get();
    const { selectedPieceId, diceValue, currentPlayerIndex } = state;
    if (!selectedPieceId || diceValue === null) return;

    const currentPlayer = state.players[currentPlayerIndex];

    const result = GameLogic.resolveMove(selectedPieceId, diceValue, currentPlayer, state.players);

    const updatedPlayers = state.players.map((player, idx) => {
      if (idx === currentPlayerIndex) {
        return {
          ...player,
          pieces: player.pieces.map(p =>
            p.id === selectedPieceId
              ? { ...p, position: result.piece.position, distanceTraveled: result.piece.distanceTraveled, isHome: result.piece.isHome }
              : p
          ),
        };
      }
      return player;
    });

    const newFlashingIds: string[] = [];
    const newEvents: GameEvent[] = [...result.events];

    if (result.kickedPieceIds.length > 0) {
      result.kickedPieceIds.forEach(kickedId => {
        newFlashingIds.push(kickedId);
        const ownerPlayer = updatedPlayers.find(p => p.pieces.some(pc => pc.id === kickedId));
        if (ownerPlayer) {
          const playerIdx = updatedPlayers.findIndex(p => p.id === ownerPlayer.id);
          updatedPlayers[playerIdx] = {
            ...updatedPlayers[playerIdx],
            pieces: updatedPlayers[playerIdx].pieces.map(p =>
              p.id === kickedId
                ? { ...p, position: -1, distanceTraveled: 0, isHome: false }
                : p
            ),
          };
        }
      });
    }

    let winner = null;
    const updatedCurrentPlayer = updatedPlayers[currentPlayerIndex];
    const allHome = GameLogic.checkWin(updatedCurrentPlayer);
    if (allHome) {
      winner = updatedCurrentPlayer.id;
    }

    set({
      players: updatedPlayers,
      selectedPieceId: null,
      movingPieceId: selectedPieceId,
      movingPiecePath: result.path,
      movingPieceProgress: 0,
      isAnimating: true,
      flashingPieceIds: newFlashingIds,
      eventQueue: [...state.eventQueue, ...newEvents],
      winner,
      phase: winner ? 'finished' : 'moving',
      timestamp: Date.now(),
    });

    setTimeout(() => {
      get().finishAnimation();
      if (!winner) {
        get().endTurn();
      }
    }, 300);
  },

  useEventCard: (cardType) => {
    const state = get();
    if (state.phase !== 'waiting') return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    const cardIndex = currentPlayer.eventCards.indexOf(cardType);
    if (cardIndex === -1) return;

    const updatedPlayers = state.players.map((player, idx) => {
      if (idx === state.currentPlayerIndex) {
        return {
          ...player,
          eventCards: [
            ...player.eventCards.slice(0, cardIndex),
            ...player.eventCards.slice(cardIndex + 1),
          ],
        };
      }
      return player;
    });

    const result = GameLogic.applyEventCard(cardType, currentPlayer, updatedPlayers);

    const finalPlayers = updatedPlayers.map(player => {
      if (player.id === currentPlayer.id && result.pieceId) {
        return {
          ...player,
          pieces: player.pieces.map(p =>
            p.id === result.pieceId
              ? { ...p, position: result.newPosition, distanceTraveled: result.newDistance, isHome: result.newIsHome }
              : p
          ),
        };
      }
      return player;
    });

    const newFlashingIds: string[] = [];
    if (result.kickedPieceIds.length > 0) {
      result.kickedPieceIds.forEach(kickedId => {
        newFlashingIds.push(kickedId);
        const ownerPlayer = finalPlayers.find(p => p.pieces.some(pc => pc.id === kickedId));
        if (ownerPlayer) {
          const playerIdx = finalPlayers.findIndex(p => p.id === ownerPlayer.id);
          finalPlayers[playerIdx] = {
            ...finalPlayers[playerIdx],
            pieces: finalPlayers[playerIdx].pieces.map(p =>
              p.id === kickedId
                ? { ...p, position: -1, distanceTraveled: 0, isHome: false }
                : p
            ),
          };
        }
      });
    }

    set({
      players: finalPlayers,
      activeEventCard: cardType,
      flashingPieceIds: newFlashingIds,
      eventQueue: [...state.eventQueue, ...result.events],
      phase: 'waiting',
      timestamp: Date.now(),
    });
  },

  endTurn: () => {
    const state = get();
    const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

    const updatedPlayers = state.players.map((player, idx) => ({
      ...player,
      isCurrentTurn: idx === nextIndex,
    }));

    set({
      players: updatedPlayers,
      currentPlayerIndex: nextIndex,
      diceValue: null,
      selectedPieceId: null,
      turnTimer: 30,
      phase: 'waiting',
      timestamp: Date.now(),
    });
  },

  kickPiece: (pieceId) => {
    const state = get();
    const updatedPlayers = state.players.map(player => ({
      ...player,
      pieces: player.pieces.map(p =>
        p.id === pieceId
          ? { ...p, position: -1, distanceTraveled: 0, isHome: false }
          : p
      ),
    }));

    set({
      players: updatedPlayers,
      timestamp: Date.now(),
    });
  },

  setTurnTimer: (time) => {
    set({ turnTimer: time });
    if (time <= 0) {
      const state = get();
      const newEvent: GameEvent = {
        type: 'turn_timeout',
        description: `${state.players[state.currentPlayerIndex].name}'s turn timed out!`,
        affectedPieceIds: [],
        timestamp: Date.now(),
      };
      set({
        eventQueue: [...state.eventQueue, newEvent],
      });
      get().endTurn();
    }
  },

  setMovingProgress: (progress) => {
    set({ movingPieceProgress: progress });
  },

  finishAnimation: () => {
    set({
      movingPieceId: null,
      movingPiecePath: [],
      movingPieceProgress: 0,
      isAnimating: false,
    });
  },

  clearFlashing: () => {
    set({ flashingPieceIds: [] });
  },

  dismissEventCard: () => {
    set({ activeEventCard: null });
  },

  applyRemoteState: (remoteState) => {
    const state = get();
    const remoteTime = remoteState.timestamp || Date.now();
    const localTime = state.timestamp;
    const diff = Math.abs(remoteTime - localTime);

    if (diff < 200 && remoteState.movingPieceProgress !== undefined && state.isAnimating) {
      const interpolatedProgress = (state.movingPieceProgress + remoteState.movingPieceProgress) / 2;
      set({
        ...remoteState,
        movingPieceProgress: interpolatedProgress,
        timestamp: Math.max(remoteTime, localTime),
      });
    } else {
      set({
        ...remoteState,
        timestamp: Math.max(remoteTime, localTime),
      });
    }
  },

  setLocalPlayer: (playerId) => {
    set({ localPlayerId: playerId });
  },

  resetGame: () => {
    set(initialState);
  },
}));
