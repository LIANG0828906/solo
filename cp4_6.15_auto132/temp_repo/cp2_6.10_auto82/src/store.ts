import { create } from 'zustand';
import { GameState, ChessManual, Position, Move, GameRecord, StoneColor } from './types';
import { createEmptyBoard, placeStone, findDeadBlocks, calculateTerritory, saveGameRecord, loadGameRecords } from './utils';
import { findBestMove } from './AI';
import { playPlaceSound, playCaptureSound } from './sound';

interface GameStore extends GameState {
  records: GameRecord[];
  showResult: boolean;
  resultData: {
    accuracy?: number;
    winRate?: number;
    manualName?: string;
    comment?: string;
    duration?: number;
    type: 'manual' | 'free';
    winner?: 'black' | 'white' | 'draw';
  } | null;
  shaking: boolean;
  fadingStones: Position[];
  lastMove: Position | null;
  setShaking: (v: boolean) => void;
  setFadingStones: (positions: Position[]) => void;
  loadRecords: () => void;
  selectManual: (manual: ChessManual) => void;
  startFreeMode: () => void;
  placeManualStone: () => void;
  prevManualMove: () => void;
  nextManualMove: () => void;
  placeUserStone: (pos: Position) => void;
  makeAIMove: () => void;
  resetGame: () => void;
  endGame: () => void;
  closeResult: () => void;
  loadRecord: (record: GameRecord) => void;
  toggleMode: () => void;
}

const initialState: GameState = {
  board: createEmptyBoard(),
  currentPlayer: 'black',
  moveHistory: [],
  currentMoveIndex: -1,
  gameMode: 'idle',
  selectedManual: null,
  manualProgress: 0,
  capturedBlack: 0,
  capturedWhite: 0,
  blackTerritory: 0,
  whiteTerritory: 0,
  isGameOver: false,
  deadBlocks: [],
  aiPulsePosition: null,
  startTime: 0
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  records: [],
  showResult: false,
  resultData: null,
  shaking: false,
  fadingStones: [],
  lastMove: null,

  setShaking: (v) => set({ shaking: v }),
  setFadingStones: (positions) => set({ fadingStones: positions }),

  loadRecords: () => {
    const records = loadGameRecords();
    set({ records });
  },

  selectManual: (manual) => {
    const board = createEmptyBoard();
    let currentBoard = board;
    const moveHistory: Move[] = [];
    
    for (let i = 0; i < 30 && i < manual.moves.length; i++) {
      const pos = manual.moves[i];
      const color = i % 2 === 0 ? 'black' : 'white';
      const result = placeStone(currentBoard, pos, color);
      if (result.success) {
        currentBoard = result.newBoard;
        moveHistory.push({
          position: pos,
          color,
          moveNumber: i + 1,
          timestamp: Date.now()
        });
      }
    }

    const territory = calculateTerritory(currentBoard);
    const deadBlocks = findDeadBlocks(currentBoard);

    set({
      ...initialState,
      board: currentBoard,
      moveHistory,
      currentMoveIndex: moveHistory.length - 1,
      gameMode: 'manual',
      selectedManual: manual,
      manualProgress: 30,
      currentPlayer: moveHistory.length % 2 === 0 ? 'black' : 'white',
      blackTerritory: territory.black,
      whiteTerritory: territory.white,
      deadBlocks,
      lastMove: moveHistory.length > 0 ? moveHistory[moveHistory.length - 1].position : null,
      startTime: Date.now()
    });
  },

  startFreeMode: () => {
    set({
      ...initialState,
      gameMode: 'free',
      board: createEmptyBoard(),
      currentPlayer: 'black',
      startTime: Date.now()
    });
  },

  toggleMode: () => {
    const { gameMode } = get();
    if (gameMode === 'manual') {
      get().startFreeMode();
    } else {
      get().resetGame();
    }
  },

  placeManualStone: () => {
    const { selectedManual, manualProgress, board, moveHistory, currentMoveIndex } = get();
    if (!selectedManual || manualProgress >= selectedManual.moves.length) {
      get().endGame();
      return;
    }

    if (currentMoveIndex < moveHistory.length - 1) {
      set({ currentMoveIndex: currentMoveIndex + 1 });
      return;
    }

    const pos = selectedManual.moves[manualProgress];
    const color = manualProgress % 2 === 0 ? 'black' : 'white';
    const result = placeStone(board, pos, color);

    if (result.success) {
      playPlaceSound();
      get().setShaking(true);
      setTimeout(() => get().setShaking(false), 100);

      if (result.capturedCount > 0) {
        playCaptureSound();
        get().setFadingStones(result.capturedPositions);
        setTimeout(() => get().setFadingStones([]), 300);
      }

      const newMove: Move = {
        position: pos,
        color,
        moveNumber: manualProgress + 1,
        timestamp: Date.now()
      };

      const newHistory = [...moveHistory, newMove];
      const territory = calculateTerritory(result.newBoard);
      const deadBlocks = findDeadBlocks(result.newBoard);

      set({
        board: result.newBoard,
        moveHistory: newHistory,
        currentMoveIndex: newHistory.length - 1,
        manualProgress: manualProgress + 1,
        currentPlayer: color === 'black' ? 'white' : 'black',
        capturedBlack: color === 'white' ? get().capturedBlack + result.capturedCount : get().capturedBlack,
        capturedWhite: color === 'black' ? get().capturedWhite + result.capturedCount : get().capturedWhite,
        blackTerritory: territory.black,
        whiteTerritory: territory.white,
        deadBlocks,
        lastMove: pos
      });
    }
  },

  prevManualMove: () => {
    const { currentMoveIndex } = get();
    if (currentMoveIndex > 0) {
      set({ currentMoveIndex: currentMoveIndex - 1 });
    }
  },

  nextManualMove: () => {
    const { currentMoveIndex, moveHistory, manualProgress, selectedManual } = get();
    if (currentMoveIndex < moveHistory.length - 1) {
      set({ currentMoveIndex: currentMoveIndex + 1 });
    } else if (selectedManual && manualProgress < selectedManual.moves.length) {
      get().placeManualStone();
    }
  },

  placeUserStone: (pos) => {
    const { board, currentPlayer, gameMode, isGameOver, moveHistory } = get();
    if (gameMode !== 'free' || isGameOver || currentPlayer !== 'black') return;

    const result = placeStone(board, pos, 'black');
    if (!result.success) return;

    playPlaceSound();
    get().setShaking(true);
    setTimeout(() => get().setShaking(false), 100);

    if (result.capturedCount > 0) {
      playCaptureSound();
      get().setFadingStones(result.capturedPositions);
      setTimeout(() => get().setFadingStones([]), 300);
    }

    const newMove: Move = {
      position: pos,
      color: 'black',
      moveNumber: moveHistory.length + 1,
      timestamp: Date.now()
    };

    const newHistory = [...moveHistory, newMove];
    const territory = calculateTerritory(result.newBoard);
    const deadBlocks = findDeadBlocks(result.newBoard);

    set({
      board: result.newBoard,
      moveHistory: newHistory,
      currentMoveIndex: newHistory.length - 1,
      currentPlayer: 'white',
      capturedWhite: get().capturedWhite + result.capturedCount,
      blackTerritory: territory.black,
      whiteTerritory: territory.white,
      deadBlocks,
      lastMove: pos
    });

    setTimeout(() => {
      get().makeAIMove();
    }, 500);
  },

  makeAIMove: () => {
    const { board, isGameOver, moveHistory } = get();
    if (isGameOver) return;

    const aiMove = findBestMove(board, 'white');
    if (!aiMove) {
      get().endGame();
      return;
    }

    set({ aiPulsePosition: aiMove });
    setTimeout(() => set({ aiPulsePosition: null }), 1000);

    const result = placeStone(board, aiMove, 'white');
    if (!result.success) {
      get().endGame();
      return;
    }

    playPlaceSound();
    get().setShaking(true);
    setTimeout(() => get().setShaking(false), 100);

    if (result.capturedCount > 0) {
      playCaptureSound();
      get().setFadingStones(result.capturedPositions);
      setTimeout(() => get().setFadingStones([]), 300);
    }

    const newMove: Move = {
      position: aiMove,
      color: 'white',
      moveNumber: moveHistory.length + 1,
      timestamp: Date.now()
    };

    const newHistory = [...moveHistory, newMove];
    const territory = calculateTerritory(result.newBoard);
    const deadBlocks = findDeadBlocks(result.newBoard);

    set({
      board: result.newBoard,
      moveHistory: newHistory,
      currentMoveIndex: newHistory.length - 1,
      currentPlayer: 'black',
      capturedBlack: get().capturedBlack + result.capturedCount,
      blackTerritory: territory.black,
      whiteTerritory: territory.white,
      deadBlocks,
      lastMove: aiMove
    });

    if (newHistory.length >= 100) {
      get().endGame();
    }
  },

  endGame: () => {
    const { gameMode, moveHistory, board, capturedBlack, capturedWhite, selectedManual, startTime, blackTerritory, whiteTerritory } = get();
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);

    set({ isGameOver: true });

    if (gameMode === 'manual' && selectedManual) {
      const { calculateAccuracy, generateAccuracyComment } = require('./utils');
      const accuracy = calculateAccuracy(moveHistory, selectedManual);
      const comment = generateAccuracyComment(accuracy);

      set({
        showResult: true,
        resultData: {
          accuracy,
          manualName: selectedManual.name,
          comment,
          duration,
          type: 'manual'
        }
      });

      const record: GameRecord = {
        id: Date.now().toString(),
        type: 'manual',
        manualName: selectedManual.name,
        moves: moveHistory,
        boardState: board.map(row => [...row]),
        capturedBlack,
        capturedWhite,
        startTime,
        endTime,
        accuracy
      };
      saveGameRecord(record);
    } else if (gameMode === 'free') {
      const { calculateWinRate } = require('./utils');
      const winRate = calculateWinRate(blackTerritory, whiteTerritory, capturedBlack, capturedWhite);
      const blackScore = blackTerritory + capturedWhite;
      const whiteScore = whiteTerritory + capturedBlack + 6.5;
      const winner: 'black' | 'white' | 'draw' = blackScore > whiteScore ? 'black' : whiteScore > blackScore ? 'white' : 'draw';

      set({
        showResult: true,
        resultData: {
          winRate,
          duration,
          type: 'free',
          winner
        }
      });

      const record: GameRecord = {
        id: Date.now().toString(),
        type: 'free',
        moves: moveHistory,
        boardState: board.map(row => [...row]),
        capturedBlack,
        capturedWhite,
        startTime,
        endTime,
        winRate,
        winner
      };
      saveGameRecord(record);
    }

    get().loadRecords();
  },

  resetGame: () => {
    set({
      ...initialState,
      records: get().records
    });
  },

  closeResult: () => {
    set({ showResult: false, resultData: null });
  },

  loadRecord: (record) => {
    const board = createEmptyBoard();
    let currentBoard = board;
    const moveHistory: Move[] = [];

    for (const move of record.moves) {
      const result = placeStone(currentBoard, move.position, move.color as 'black' | 'white');
      if (result.success) {
        currentBoard = result.newBoard;
        moveHistory.push(move);
      }
    }

    const territory = calculateTerritory(currentBoard);
    const deadBlocks = findDeadBlocks(currentBoard);

    set({
      board: currentBoard,
      moveHistory,
      currentMoveIndex: moveHistory.length - 1,
      gameMode: record.type === 'manual' ? 'manual' : 'free',
      selectedManual: null,
      manualProgress: moveHistory.length,
      capturedBlack: record.capturedBlack,
      capturedWhite: record.capturedWhite,
      blackTerritory: territory.black,
      whiteTerritory: territory.white,
      deadBlocks,
      isGameOver: true,
      lastMove: moveHistory.length > 0 ? moveHistory[moveHistory.length - 1].position : null,
      startTime: record.startTime
    });
  }
}));
