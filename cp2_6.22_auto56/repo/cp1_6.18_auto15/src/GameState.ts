import { create } from 'zustand';
import {
  BOARD_SIZE,
  COUNTDOWN_SECONDS,
  ELEMENT_CONFIGS,
  MAX_HISTORY,
  type Animation,
  type BoardCell,
  type ElementType,
  type GamePhase,
  type GameStatistics,
  type HistoryRecord,
  type Piece,
  type Player,
  type PlayerId,
  type Position,
} from './entities';
import { EventBus, type EventName } from './EventBus';

const generateId = (): string =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

const createEmptyBoard = (): BoardCell[][] => {
  const board: BoardCell[][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row: BoardCell[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      row.push({ x, y, piece: null });
    }
    board.push(row);
  }
  return board;
};

const createInitialPieces = (
  player: PlayerId,
  element: ElementType
): Piece[] => {
  const pieces: Piece[] = [];
  const config = ELEMENT_CONFIGS[element];
  const startY = player === 1 ? BOARD_SIZE - 2 : 0;
  const positions: Position[] = [
    { x: 1, y: startY },
    { x: 3, y: startY },
    { x: 5, y: startY },
    { x: 7, y: startY },
    { x: 2, y: startY + (player === 1 ? -1 : 1) },
    { x: 4, y: startY + (player === 1 ? -1 : 1) },
    { x: 6, y: startY + (player === 1 ? -1 : 1) },
    { x: 0, y: startY + (player === 1 ? -1 : 1) },
  ];

  positions.forEach((pos) => {
    pieces.push({
      id: generateId(),
      element,
      player,
      hp: config.hp,
      maxHp: config.hp,
      attack: config.attack,
      range: config.range,
      position: { ...pos },
      killCount: 0,
    });
  });

  return pieces;
};

const getChebyshevDistance = (a: Position, b: Position): number =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

interface GameStateStore {
  gamePhase: GamePhase;
  board: BoardCell[][];
  currentPlayer: PlayerId;
  players: Record<PlayerId, Player | null>;
  useAI: boolean;
  countdown: number;
  selectedPieceId: string | null;
  animations: Animation[];
  history: HistoryRecord[];
  winner: PlayerId | null;
  statistics: GameStatistics;
  hitPieceIds: Set<string>;

  initGame: (player1: Player, player2: Player, useAI: boolean) => void;
  selectPiece: (pieceId: string | null) => void;
  performAttack: (attackerId: string, targetId: string) => void;
  endTurn: () => void;
  undo: (steps: number) => void;
  addAnimation: (animation: Animation) => void;
  removeAnimation: (animationId: string) => void;
  setHitPiece: (pieceId: string, hit: boolean) => void;
  resetGame: () => void;
  decrementCountdown: () => void;
  getAttackableTargets: (pieceId: string) => Piece[];
  getPieceById: (pieceId: string) => Piece | null;
  getPiecesByPlayer: (playerId: PlayerId) => Piece[];
  saveHistory: (action: string) => void;
}

const initialStatistics: GameStatistics = {
  totalTurns: 0,
  totalDamage: 0,
  pieceKills: {},
};

export const useGameState = create<GameStateStore>((set, get) => ({
  gamePhase: 'setup',
  board: createEmptyBoard(),
  currentPlayer: 1,
  players: { 1: null, 2: null },
  useAI: false,
  countdown: COUNTDOWN_SECONDS,
  selectedPieceId: null,
  animations: [],
  history: [],
  winner: null,
  statistics: { ...initialStatistics, pieceKills: {} },
  hitPieceIds: new Set(),

  initGame: (player1, player2, useAI) => {
    const board = createEmptyBoard();
    const p1Pieces = createInitialPieces(1, player1.element);
    const p2Pieces = createInitialPieces(2, player2.element);

    [...p1Pieces, ...p2Pieces].forEach((piece) => {
      board[piece.position.y][piece.position.x].piece = piece;
    });

    set({
      gamePhase: 'playing',
      board,
      currentPlayer: 1,
      players: { 1: player1, 2: player2 },
      useAI,
      countdown: COUNTDOWN_SECONDS,
      selectedPieceId: null,
      animations: [],
      history: [],
      winner: null,
      statistics: { ...initialStatistics, pieceKills: {} },
      hitPieceIds: new Set(),
    });

    EventBus.emit('GAME_START' as EventName, {
      player1,
      player2,
      useAI,
    } as never);
  },

  selectPiece: (pieceId) => {
    set({ selectedPieceId: pieceId });
    if (pieceId) {
      EventBus.emit('PIECE_SELECT' as EventName, { pieceId } as never);
    }
  },

  performAttack: (attackerId, targetId) => {
    const state = get();
    const attacker = state.getPieceById(attackerId);
    const target = state.getPieceById(targetId);

    if (!attacker || !target) return;
    if (attacker.player !== state.currentPlayer) return;
    if (target.player === state.currentPlayer) return;

    const distance = getChebyshevDistance(attacker.position, target.position);
    if (distance > attacker.range) return;

    state.saveHistory(`攻击: ${attackerId} -> ${targetId}`);

    EventBus.emit('PIECE_ATTACK' as EventName, {
      attackerId,
      targetId,
    } as never);
  },

  endTurn: () => {
    const state = get();
    const nextPlayer: PlayerId = state.currentPlayer === 1 ? 2 : 1;

    set({
      currentPlayer: nextPlayer,
      countdown: COUNTDOWN_SECONDS,
      selectedPieceId: null,
      statistics: {
        ...state.statistics,
        totalTurns: state.statistics.totalTurns + 1,
      },
    });

    EventBus.emit('TURN_END' as EventName, { nextPlayer } as never);
  },

  undo: (steps) => {
    const state = get();
    if (state.history.length === 0) return;

    const actualSteps = Math.min(steps, state.history.length);
    const newHistory = [...state.history];
    const targetRecord = newHistory[newHistory.length - actualSteps];

    newHistory.splice(newHistory.length - actualSteps, actualSteps);

    set({
      board: JSON.parse(JSON.stringify(targetRecord.stateSnapshot.board)),
      currentPlayer: targetRecord.stateSnapshot.currentPlayer,
      selectedPieceId: targetRecord.stateSnapshot.selectedPieceId,
      statistics: { ...targetRecord.stateSnapshot.statistics },
      history: newHistory,
      countdown: COUNTDOWN_SECONDS,
    });
  },

  addAnimation: (animation) => {
    set((state) => ({
      animations: [...state.animations, animation],
    }));
  },

  removeAnimation: (animationId) => {
    set((state) => ({
      animations: state.animations.filter((a) => a.id !== animationId),
    }));
  },

  setHitPiece: (pieceId, hit) => {
    set((state) => {
      const newSet = new Set(state.hitPieceIds);
      if (hit) {
        newSet.add(pieceId);
      } else {
        newSet.delete(pieceId);
      }
      return { hitPieceIds: newSet };
    });
  },

  resetGame: () => {
    set({
      gamePhase: 'setup',
      board: createEmptyBoard(),
      currentPlayer: 1,
      players: { 1: null, 2: null },
      useAI: false,
      countdown: COUNTDOWN_SECONDS,
      selectedPieceId: null,
      animations: [],
      history: [],
      winner: null,
      statistics: { ...initialStatistics, pieceKills: {} },
      hitPieceIds: new Set(),
    });
  },

  decrementCountdown: () => {
    const state = get();
    if (state.countdown <= 0) {
      state.endTurn();
      return;
    }
    const newCountdown = state.countdown - 1;
    set({ countdown: newCountdown });
    EventBus.emit('COUNTDOWN_TICK' as EventName, {
      remaining: newCountdown,
    } as never);
  },

  getAttackableTargets: (pieceId) => {
    const state = get();
    const piece = state.getPieceById(pieceId);
    if (!piece) return [];

    const targets: Piece[] = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const targetPiece = state.board[y][x].piece;
        if (
          targetPiece &&
          targetPiece.player !== piece.player &&
          getChebyshevDistance(piece.position, { x, y }) <= piece.range
        ) {
          targets.push(targetPiece);
        }
      }
    }
    return targets;
  },

  getPieceById: (pieceId) => {
    const state = get();
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const piece = state.board[y][x].piece;
        if (piece && piece.id === pieceId) return piece;
      }
    }
    return null;
  },

  getPiecesByPlayer: (playerId) => {
    const state = get();
    const pieces: Piece[] = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const piece = state.board[y][x].piece;
        if (piece && piece.player === playerId) pieces.push(piece);
      }
    }
    return pieces;
  },

  saveHistory: (action) => {
    const state = get();
    const snapshot: HistoryRecord['stateSnapshot'] = {
      board: JSON.parse(JSON.stringify(state.board)),
      currentPlayer: state.currentPlayer,
      selectedPieceId: state.selectedPieceId,
      statistics: { ...state.statistics, pieceKills: { ...state.statistics.pieceKills } },
    };

    const record: HistoryRecord = {
      stateSnapshot: snapshot,
      action,
      timestamp: Date.now(),
    };

    const newHistory = [...state.history, record];
    if (newHistory.length > MAX_HISTORY) {
      newHistory.splice(0, newHistory.length - MAX_HISTORY);
    }

    set({ history: newHistory });
  },
}));

export const applyDamageAndCheckWin = (
  attackerId: string,
  targetId: string
): { winner: PlayerId | null; killed: boolean; damage: number } => {
  const state = useGameState.getState();
  const attacker = state.getPieceById(attackerId);
  const target = state.getPieceById(targetId);

  if (!attacker || !target) return { winner: null, killed: false, damage: 0 };

  const damage = attacker.attack;
  const newHp = Math.max(0, target.hp - damage);
  const killed = newHp <= 0;

  const newBoard = state.board.map((row) =>
    row.map((cell) => {
      if (cell.piece?.id === targetId) {
        if (killed) {
          return { ...cell, piece: null };
        }
        return {
          ...cell,
          piece: { ...cell.piece, hp: newHp },
        };
      }
      if (cell.piece?.id === attackerId && killed) {
        return {
          ...cell,
          piece: {
            ...cell.piece,
            killCount: cell.piece.killCount + 1,
          },
        };
      }
      return cell;
    })
  );

  const newKills = { ...state.statistics.pieceKills };
  if (killed) {
    newKills[attackerId] = (newKills[attackerId] || 0) + 1;
  }

  let winner: PlayerId | null = null;
  let p1HasPieces = false;
  let p2HasPieces = false;

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const p = newBoard[y][x].piece;
      if (p) {
        if (p.player === 1) p1HasPieces = true;
        if (p.player === 2) p2HasPieces = true;
      }
    }
  }

  if (!p1HasPieces) winner = 2;
  if (!p2HasPieces) winner = 1;

  useGameState.setState({
    board: newBoard,
    statistics: {
      ...state.statistics,
      totalDamage: state.statistics.totalDamage + damage,
      pieceKills: newKills,
    },
    winner,
    gamePhase: winner ? 'ended' : 'playing',
  });

  if (winner) {
    EventBus.emit('GAME_END' as EventName, {
      winner,
      statistics: {
        ...state.statistics,
        totalDamage: state.statistics.totalDamage + damage,
        pieceKills: newKills,
      },
    } as never);
  }

  return { winner, killed, damage };
};
