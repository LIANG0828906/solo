import { create } from 'zustand';
import type { Cell, EventCardType, GameState, Player } from '@/types/game';
import {
  buildCellLayout,
  initializePlayers,
  calculateNewPosition,
  checkCollision,
  applyCollision,
  applyEventCard,
  checkWinCondition,
  getNextPlayer,
  getEventCardDefinition,
  replenishEventCard,
  TOTAL_CELLS,
  TURN_TIMEOUT_MS,
} from '@/GameLogic';
import { interpolatePositions, shouldInterpolate } from '@/utils/interpolation';

interface GameActions {
  initGame: (playerNames: string[]) => void;
  rollDice: () => void;
  setDiceComplete: () => void;
  movePiece: (pieceId: string) => void;
  useEventCard: (eventType: EventCardType, targetAllyPieceId?: string) => void;
  skipTurn: () => void;
  handleTurnTimeout: () => void;
  syncState: (remoteState: GameState, remoteTimestamp: number) => void;
  resetGame: () => void;
  selectPiece: (pieceId: string | null) => void;
}

type GameStore = GameState & GameActions;

const initialCells = buildCellLayout();

const initialState: GameState = {
  players: [],
  cells: initialCells,
  currentPlayerIndex: 0,
  diceValue: null,
  isRolling: false,
  activeEvent: null,
  gamePhase: 'lobby',
  winner: null,
  lastStateTimestamp: Date.now(),
  collidedPieces: [],
  selectedPieceId: null,
  turnTimer: 30,
  eventMessage: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  initGame: (playerNames: string[]) => {
    const players = initializePlayers(playerNames);
    const now = Date.now();
    players[0].turnStartTime = now;

    set({
      players,
      currentPlayerIndex: 0,
      gamePhase: 'playing',
      diceValue: null,
      isRolling: false,
      activeEvent: null,
      winner: null,
      lastStateTimestamp: now,
      collidedPieces: [],
      selectedPieceId: null,
      turnTimer: 30,
      eventMessage: null,
    });
  },

  rollDice: () => {
    const state = get();
    if (state.isRolling || state.gamePhase !== 'playing') return;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    set({
      isRolling: true,
      diceValue,
      lastStateTimestamp: Date.now(),
    });
  },

  setDiceComplete: () => {
    set({ isRolling: false });
  },

  movePiece: (pieceId: string) => {
    const state = get();
    if (state.diceValue === null || state.isRolling) return;
    if (state.gamePhase !== 'playing') return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    const piece = currentPlayer.pieces.find((p) => p.id === pieceId);
    if (!piece || piece.isFinished) return;

    const moveResult = calculateNewPosition(
      piece.position,
      state.diceValue,
      piece.totalDistance
    );

    if (!moveResult.isFinished && moveResult.position >= 0) {
      const collision = checkCollision(
        moveResult.position,
        pieceId,
        currentPlayer.id,
        state.players
      );

      let updatedPlayers = state.players.map((player) => {
        if (player.id === currentPlayer.id) {
          return {
            ...player,
            pieces: player.pieces.map((p) => {
              if (p.id === pieceId) {
                return {
                  ...p,
                  position: moveResult.position,
                  totalDistance: moveResult.totalDistance,
                  isFinished: moveResult.isFinished,
                };
              }
              return p;
            }),
          };
        }
        return player;
      });

      const kickedPieceIds = collision.kickedPieceIds;
      if (kickedPieceIds.length > 0) {
        updatedPlayers = applyCollision(updatedPlayers, kickedPieceIds);
      }

      const updatedCurrentPlayer = updatedPlayers.find(
        (p) => p.id === currentPlayer.id
      )!;
      if (updatedCurrentPlayer) {
        const landedCell = initialCells.find(
          (c) => c.id === moveResult.position
        );
        if (landedCell?.isEvent && updatedCurrentPlayer.eventCards.length < 5) {
          const replenishedPlayer = replenishEventCard(
            updatedCurrentPlayer,
            moveResult.position
          );
          updatedPlayers = updatedPlayers.map((p) =>
            p.id === currentPlayer.id ? replenishedPlayer : p
          );
        }
      }

      if (checkWinCondition(updatedCurrentPlayer!)) {
        set({
          players: updatedPlayers,
          gamePhase: 'finished',
          winner: updatedCurrentPlayer,
          diceValue: null,
          collidedPieces: kickedPieceIds,
          lastStateTimestamp: Date.now(),
          eventMessage: collision.warning,
        });
        return;
      }

      const nextIndex = getNextPlayer(
        state.currentPlayerIndex,
        updatedPlayers.length
      );
      const now = Date.now();
      updatedPlayers = updatedPlayers.map((p, i) => ({
        ...p,
        turnStartTime: i === nextIndex ? now : p.turnStartTime,
      }));

      set({
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
        diceValue: null,
        collidedPieces: kickedPieceIds,
        lastStateTimestamp: Date.now(),
        eventMessage: collision.warning,
      });

      setTimeout(() => {
        set({ collidedPieces: [], eventMessage: null });
      }, 500);
    } else if (moveResult.isFinished) {
      let updatedPlayers = state.players.map((player) => {
        if (player.id === currentPlayer.id) {
          return {
            ...player,
            pieces: player.pieces.map((p) => {
              if (p.id === pieceId) {
                return {
                  ...p,
                  position: 0,
                  totalDistance: moveResult.totalDistance,
                  isFinished: true,
                };
              }
              return p;
            }),
          };
        }
        return player;
      });

      const updatedCurrentPlayer = updatedPlayers.find(
        (p) => p.id === currentPlayer.id
      )!;

      if (checkWinCondition(updatedCurrentPlayer)) {
        set({
          players: updatedPlayers,
          gamePhase: 'finished',
          winner: updatedCurrentPlayer,
          diceValue: null,
          collidedPieces: [],
          lastStateTimestamp: Date.now(),
        });
        return;
      }

      const nextIndex = getNextPlayer(
        state.currentPlayerIndex,
        updatedPlayers.length
      );
      const now = Date.now();
      updatedPlayers = updatedPlayers.map((p, i) => ({
        ...p,
        turnStartTime: i === nextIndex ? now : p.turnStartTime,
      }));

      set({
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
        diceValue: null,
        collidedPieces: [],
        lastStateTimestamp: Date.now(),
      });
    }
  },

  useEventCard: (eventType: EventCardType, targetAllyPieceId?: string) => {
    const state = get();
    if (state.gamePhase !== 'playing') return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    const cardIndex = currentPlayer.eventCards.indexOf(eventType);
    if (cardIndex === -1) return;

    const eventCard = getEventCardDefinition(eventType);
    const result = applyEventCard(
      eventType,
      currentPlayer,
      state.players,
      state.selectedPieceId ?? undefined,
      targetAllyPieceId
    );

    const updatedPlayers = result.updatedPlayers.map((p, i) => {
      if (p.id === currentPlayer.id) {
        const newCards = [...p.eventCards];
        newCards.splice(cardIndex, 1);
        return { ...p, eventCards: newCards };
      }
      return p;
    });

    const updatedCurrentPlayer = updatedPlayers.find(
      (p) => p.id === currentPlayer.id
    )!;

    if (checkWinCondition(updatedCurrentPlayer)) {
      set({
        players: updatedPlayers,
        gamePhase: 'finished',
        winner: updatedCurrentPlayer,
        activeEvent: eventCard,
        diceValue: null,
        lastStateTimestamp: Date.now(),
        eventMessage: result.message,
      });
      return;
    }

    set({
      players: updatedPlayers,
      activeEvent: eventCard,
      lastStateTimestamp: Date.now(),
      eventMessage: result.message,
    });

    setTimeout(() => {
      set({ activeEvent: null, eventMessage: null });
    }, 2000);
  },

  skipTurn: () => {
    const state = get();
    if (state.gamePhase !== 'playing') return;

    const nextIndex = getNextPlayer(
      state.currentPlayerIndex,
      state.players.length
    );
    const now = Date.now();
    const updatedPlayers = state.players.map((p, i) => ({
      ...p,
      turnStartTime: i === nextIndex ? now : p.turnStartTime,
    }));

    set({
      players: updatedPlayers,
      currentPlayerIndex: nextIndex,
      diceValue: null,
      collidedPieces: [],
      lastStateTimestamp: Date.now(),
      eventMessage: null,
    });
  },

  handleTurnTimeout: () => {
    const state = get();
    if (state.gamePhase !== 'playing') return;
    get().skipTurn();
  },

  syncState: (remoteState: GameState, remoteTimestamp: number) => {
    const state = get();
    const timestampDelta = remoteTimestamp - state.lastStateTimestamp;

    if (shouldInterpolate(timestampDelta)) {
      const localPositions = new Map<string, number>();
      const remotePositions = new Map<string, number>();

      for (const player of state.players) {
        for (const piece of player.pieces) {
          localPositions.set(piece.id, piece.position);
        }
      }
      for (const player of remoteState.players) {
        for (const piece of player.pieces) {
          remotePositions.set(piece.id, piece.position);
        }
      }

      const interpolated = interpolatePositions(
        localPositions,
        remotePositions,
        timestampDelta
      );

      const mergedPlayers = remoteState.players.map((player) => ({
        ...player,
        pieces: player.pieces.map((piece) => ({
          ...piece,
          position: interpolated.get(piece.id) ?? piece.position,
        })),
      }));

      set({
        players: mergedPlayers,
        currentPlayerIndex: remoteState.currentPlayerIndex,
        diceValue: remoteState.diceValue,
        gamePhase: remoteState.gamePhase,
        winner: remoteState.winner,
        lastStateTimestamp: remoteTimestamp,
        collidedPieces: remoteState.collidedPieces,
        eventMessage: remoteState.eventMessage,
      });
    } else {
      set({
        players: remoteState.players,
        currentPlayerIndex: remoteState.currentPlayerIndex,
        diceValue: remoteState.diceValue,
        gamePhase: remoteState.gamePhase,
        winner: remoteState.winner,
        lastStateTimestamp: remoteTimestamp,
        collidedPieces: remoteState.collidedPieces,
        eventMessage: remoteState.eventMessage,
      });
    }
  },

  resetGame: () => {
    set({
      ...initialState,
      cells: buildCellLayout(),
    });
  },

  selectPiece: (pieceId: string | null) => {
    set({ selectedPieceId: pieceId });
  },
}));
