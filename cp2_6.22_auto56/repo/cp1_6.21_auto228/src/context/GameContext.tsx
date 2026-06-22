import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { GameState, ShipType, Player } from '../types/game';
import {
  initializeGameState,
  getValidMoves,
  getValidAttacks,
  moveShip,
  executeAttack,
  calculateResources,
  calculateScores,
  buildShip,
  resetShipFlags,
} from '../utils/gameLogic';
import { delay } from '../utils/animation';

interface GameContextType {
  state: GameState;
  startGame: (p1Name: string, p2Name: string) => void;
  selectCell: (x: number, y: number) => void;
  moveSelectedShip: (toX: number, toY: number) => void;
  attackTarget: (targetX: number, targetY: number) => void;
  endTurn: () => void;
  buildNewShip: (type: ShipType) => void;
  clearSelection: () => void;
  loadGame: (state: GameState) => void;
}

type GameAction =
  | { type: 'START_GAME'; payload: { p1Name: string; p2Name: string } }
  | { type: 'SELECT_CELL'; payload: { x: number; y: number } }
  | { type: 'MOVE_SHIP'; payload: { toX: number; toY: number } }
  | { type: 'ATTACK'; payload: { targetX: number; targetY: number } }
  | { type: 'END_TURN' }
  | { type: 'BUILD_SHIP'; payload: { type: ShipType } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_BATTLE_REPORT'; payload: string | null }
  | { type: 'SET_ANIMATING_CELL'; payload: { x: number; y: number } | null }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'GAME_OVER'; payload: { winner: Player | 'draw'; scores: { player1: number; player2: number } } };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      return initializeGameState(action.payload.p1Name, action.payload.p2Name);
    }

    case 'SELECT_CELL': {
      const { x, y } = action.payload;
      const cell = state.board[y][x];
      const playerShips = cell.ships.filter(s => s.player === state.currentPlayer);

      if (state.selectedShip) {
        const isMoveTarget = state.validMoves.some(m => m.x === x && m.y === y);
        if (isMoveTarget) {
          const newBoard = moveShip(
            state.board,
            state.selectedShip,
            state.selectedCell!.x,
            state.selectedCell!.y,
            x,
            y
          );
          return {
            ...state,
            board: newBoard,
            selectedCell: null,
            selectedShip: null,
            validMoves: [],
            validAttacks: [],
          };
        }

        const isAttackTarget = state.validAttacks.some(a => a.x === x && a.y === y);
        if (isAttackTarget) {
          const result = executeAttack(
            state.board,
            state.selectedShip,
            state.selectedCell!.x,
            state.selectedCell!.y,
            x,
            y
          );
          return {
            ...state,
            board: result.board,
            battleReport: result.report,
            selectedCell: null,
            selectedShip: null,
            validMoves: [],
            validAttacks: [],
            animatingCell: { x, y },
          };
        }
      }

      if (playerShips.length > 0) {
        const ship = playerShips[0];
        const validMoves = ship.hasMoved
          ? []
          : getValidMoves(state.board, ship, x, y, state.isDeploymentPhase);
        const validAttacks = getValidAttacks(state.board, ship, x, y, state.isDeploymentPhase);

        return {
          ...state,
          selectedCell: { x, y },
          selectedShip: ship,
          validMoves,
          validAttacks,
        };
      }

      return {
        ...state,
        selectedCell: null,
        selectedShip: null,
        validMoves: [],
        validAttacks: [],
      };
    }

    case 'MOVE_SHIP': {
      if (!state.selectedShip || !state.selectedCell) return state;

      const newBoard = moveShip(
        state.board,
        state.selectedShip,
        state.selectedCell.x,
        state.selectedCell.y,
        action.payload.toX,
        action.payload.toY
      );

      return {
        ...state,
        board: newBoard,
        selectedCell: null,
        selectedShip: null,
        validMoves: [],
        validAttacks: [],
      };
    }

    case 'ATTACK': {
      if (!state.selectedShip || !state.selectedCell) return state;

      const result = executeAttack(
        state.board,
        state.selectedShip,
        state.selectedCell.x,
        state.selectedCell.y,
        action.payload.targetX,
        action.payload.targetY
      );

      return {
        ...state,
        board: result.board,
        battleReport: result.report,
        selectedCell: null,
        selectedShip: null,
        validMoves: [],
        validAttacks: [],
        animatingCell: { x: action.payload.targetX, y: action.payload.targetY },
      };
    }

    case 'END_TURN': {
      const nextPlayer: Player = state.currentPlayer === 1 ? 2 : 1;
      const isNewRound = nextPlayer === 1;
      const newTurn = isNewRound ? state.turn + 1 : state.turn;

      const resourceGain = calculateResources(state.board, nextPlayer);
      const newResources = {
        player1: state.currentPlayer === 1 ? state.resources.player1 + resourceGain : state.resources.player1,
        player2: state.currentPlayer === 2 ? state.resources.player2 + resourceGain : state.resources.player2,
      };

      const newBoard = resetShipFlags(state.board);
      const isDeploymentPhase = newTurn === 1 && nextPlayer === 1 ? false : state.isDeploymentPhase && newTurn <= 1;

      const scores = calculateScores(newBoard);
      const gameOver = newTurn > state.maxTurns;
      let winner: Player | 'draw' | null = null;

      if (gameOver) {
        if (scores.player1 > scores.player2) winner = 1;
        else if (scores.player2 > scores.player1) winner = 2;
        else winner = 'draw';
      }

      return {
        ...state,
        board: newBoard,
        currentPlayer: nextPlayer,
        turn: newTurn,
        isDeploymentPhase,
        resources: newResources,
        selectedCell: null,
        selectedShip: null,
        validMoves: [],
        validAttacks: [],
        gameOver,
        winner,
        scores,
      };
    }

    case 'BUILD_SHIP': {
      const resourceKey = state.currentPlayer === 1 ? 'player1' : 'player2';
      const result = buildShip(
        state.board,
        action.payload.type,
        state.currentPlayer,
        state.resources[resourceKey]
      );

      if (!result.success) {
        return {
          ...state,
          battleReport: result.message,
        };
      }

      return {
        ...state,
        board: result.board,
        resources: {
          ...state.resources,
          [resourceKey]: result.resources,
        },
        battleReport: result.message,
      };
    }

    case 'CLEAR_SELECTION': {
      return {
        ...state,
        selectedCell: null,
        selectedShip: null,
        validMoves: [],
        validAttacks: [],
      };
    }

    case 'SET_BATTLE_REPORT': {
      return {
        ...state,
        battleReport: action.payload,
      };
    }

    case 'SET_ANIMATING_CELL': {
      return {
        ...state,
        animatingCell: action.payload,
      };
    }

    case 'LOAD_GAME': {
      return action.payload;
    }

    case 'GAME_OVER': {
      return {
        ...state,
        gameOver: true,
        winner: action.payload.winner,
        scores: action.payload.scores,
      };
    }

    default:
      return state;
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null as unknown as GameState);

  useEffect(() => {
    if (state && state.battleReport) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_BATTLE_REPORT', payload: null });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.battleReport]);

  useEffect(() => {
    if (state && state.animatingCell) {
      delay(600).then(() => {
        dispatch({ type: 'SET_ANIMATING_CELL', payload: null });
      });
    }
  }, [state?.animatingCell]);

  const startGame = useCallback((p1Name: string, p2Name: string) => {
    dispatch({ type: 'START_GAME', payload: { p1Name, p2Name } });
  }, []);

  const selectCell = useCallback((x: number, y: number) => {
    dispatch({ type: 'SELECT_CELL', payload: { x, y } });
  }, []);

  const moveSelectedShip = useCallback((toX: number, toY: number) => {
    dispatch({ type: 'MOVE_SHIP', payload: { toX, toY } });
  }, []);

  const attackTarget = useCallback((targetX: number, targetY: number) => {
    dispatch({ type: 'ATTACK', payload: { targetX, targetY } });
  }, []);

  const endTurn = useCallback(() => {
    dispatch({ type: 'END_TURN' });
  }, []);

  const buildNewShip = useCallback((type: ShipType) => {
    dispatch({ type: 'BUILD_SHIP', payload: { type } });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const loadGame = useCallback((gameState: GameState) => {
    dispatch({ type: 'LOAD_GAME', payload: gameState });
  }, []);

  return (
    <GameContext.Provider
      value={{
        state,
        startGame,
        selectCell,
        moveSelectedShip,
        attackTarget,
        endTurn,
        buildNewShip,
        clearSelection,
        loadGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
