import { useState, useCallback, useEffect } from 'react';
import type { GameState, Move, Position, StoneColor, GameRecord } from '@/types';
import {
  createEmptyBoard,
  placeStone,
  getAIMove,
  getBoardAtMove,
  determineWinner,
  isValidMove,
} from '@/utils/gameLogic';
import { parseSGF, parseJSONGameRecord } from '@/utils/sgfParser';
import { playStoneSound } from '@/utils/audio';

export const useGoGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    currentPlayer: 'black',
    moveHistory: [],
    captures: { black: 0, white: 0 },
    isGameOver: false,
    winner: null,
    startTime: Date.now(),
    lastMoveTime: Date.now(),
  });

  const [currentReviewIndex, setCurrentReviewIndex] = useState<number>(-1);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [lastCaptured, setLastCaptured] = useState<Position[]>([]);

  const makeMove = useCallback((position: Position): boolean => {
    if (gameState.isGameOver || isAIThinking) return false;
    if (gameState.currentPlayer !== 'black') return false;

    const moveNumber = gameState.moveHistory.length + 1;
    const result = placeStone(
      gameState.board,
      position,
      'black',
      moveNumber,
      lastCaptured
    );

    if (!result) return false;

    playStoneSound();

    const newMove: Move = {
      position,
      color: 'black',
      moveNumber,
      winRate: result.winRate,
      capturedStones: result.captured,
    };

    const newCaptures = {
      black: gameState.captures.black + result.captured.length,
      white: gameState.captures.white,
    };

    setLastCaptured(result.captured);
    setGameState(prev => ({
      ...prev,
      board: result.newBoard,
      currentPlayer: 'white',
      moveHistory: [...prev.moveHistory, newMove],
      captures: newCaptures,
      lastMoveTime: Date.now(),
    }));

    setIsAIThinking(true);
    return true;
  }, [gameState, isAIThinking, lastCaptured]);

  useEffect(() => {
    if (!isAIThinking || gameState.isGameOver) return;
    if (gameState.currentPlayer !== 'white') return;

    const aiTimeout = setTimeout(() => {
      const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
      const aiPosition = getAIMove(gameState.board, lastMove?.position || null);

      if (!aiPosition) {
        endGame();
        return;
      }

      const moveNumber = gameState.moveHistory.length + 1;
      const result = placeStone(
        gameState.board,
        aiPosition,
        'white',
        moveNumber,
        lastCaptured
      );

      if (!result) {
        setIsAIThinking(false);
        return;
      }

      playStoneSound();

      const newMove: Move = {
        position: aiPosition,
        color: 'white',
        moveNumber,
        winRate: result.winRate,
        capturedStones: result.captured,
      };

      const newCaptures = {
        black: gameState.captures.black,
        white: gameState.captures.white + result.captured.length,
      };

      setLastCaptured(result.captured);
      setGameState(prev => ({
        ...prev,
        board: result.newBoard,
        currentPlayer: 'black',
        moveHistory: [...prev.moveHistory, newMove],
        captures: newCaptures,
        lastMoveTime: Date.now(),
      }));

      setIsAIThinking(false);

      if (gameState.moveHistory.length >= 150) {
        endGame();
      }
    }, 300 + Math.random() * 600);

    return () => clearTimeout(aiTimeout);
  }, [isAIThinking, gameState]);

  const endGame = useCallback(() => {
    const winner = determineWinner(gameState.moveHistory);
    setGameState(prev => ({
      ...prev,
      isGameOver: true,
      winner,
    }));
    setIsAIThinking(false);
  }, [gameState.moveHistory]);

  const undoMove = useCallback(() => {
    if (gameState.moveHistory.length < 2) return;
    if (isAIThinking) return;

    const newHistory = gameState.moveHistory.slice(0, -2);
    let newBoard = createEmptyBoard();
    let blackCaptures = 0;
    let whiteCaptures = 0;

    for (const move of newHistory) {
      const result = placeStone(newBoard, move.position, move.color, move.moveNumber);
      if (result) {
        newBoard = result.newBoard;
        if (move.color === 'black') {
          blackCaptures += result.captured.length;
        } else {
          whiteCaptures += result.captured.length;
        }
      }
    }

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: 'black',
      moveHistory: newHistory,
      captures: { black: blackCaptures, white: whiteCaptures },
      isGameOver: false,
      winner: null,
      lastMoveTime: Date.now(),
    }));
    setLastCaptured([]);
  }, [gameState.moveHistory, isAIThinking]);

  const resign = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isGameOver: true,
      winner: 'white',
    }));
    setIsAIThinking(false);
  }, []);

  const requestDraw = useCallback(() => {
    if (gameState.moveHistory.length < 10) return;
    setGameState(prev => ({
      ...prev,
      isGameOver: true,
      winner: null,
    }));
    setIsAIThinking(false);
  }, [gameState.moveHistory.length]);

  const loadGameRecord = useCallback((moves: Move[]) => {
    if (moves.length === 0) return;

    let board = createEmptyBoard();
    let blackCaptures = 0;
    let whiteCaptures = 0;

    for (const move of moves) {
      board[move.position.y][move.position.x] = move.color;
      for (const captured of move.capturedStones) {
        board[captured.y][captured.x] = null;
      }
      if (move.color === 'black') {
        blackCaptures += move.capturedStones.length;
      } else {
        whiteCaptures += move.capturedStones.length;
      }
    }

    const winner = determineWinner(moves);

    setGameState({
      board,
      currentPlayer: null,
      moveHistory: moves,
      captures: { black: blackCaptures, white: whiteCaptures },
      isGameOver: true,
      winner,
      startTime: Date.now(),
      lastMoveTime: Date.now(),
    });
    setCurrentReviewIndex(moves.length - 1);
    setIsAIThinking(false);
  }, []);

  const importGame = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) {
          reject(new Error('Empty file'));
          return;
        }

        let moves: Move[] | null = null;

        if (file.name.endsWith('.sgf')) {
          moves = parseSGF(content);
        } else if (file.name.endsWith('.json')) {
          moves = parseJSONGameRecord(content);
        }

        if (moves && moves.length > 0) {
          loadGameRecord(moves);
          resolve();
        } else {
          reject(new Error('Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }, [loadGameRecord]);

  const exportGameRecord = useCallback((): GameRecord => {
    const totalTime = Date.now() - gameState.startTime;
    return {
      version: '1.0',
      date: new Date().toISOString(),
      moves: gameState.moveHistory,
      captures: gameState.captures,
      winner: gameState.winner,
      totalTime,
    };
  }, [gameState]);

  const getReviewBoard = useCallback((): StoneColor[][] => {
    if (currentReviewIndex < 0 || currentReviewIndex >= gameState.moveHistory.length) {
      return gameState.board;
    }
    return getBoardAtMove(gameState.moveHistory, currentReviewIndex);
  }, [currentReviewIndex, gameState]);

  const getReviewMove = useCallback((): Move | null => {
    if (currentReviewIndex < 0 || currentReviewIndex >= gameState.moveHistory.length) {
      return gameState.moveHistory[gameState.moveHistory.length - 1] || null;
    }
    return gameState.moveHistory[currentReviewIndex];
  }, [currentReviewIndex, gameState.moveHistory]);

  const stepForward = useCallback(() => {
    if (currentReviewIndex < gameState.moveHistory.length - 1) {
      setCurrentReviewIndex(prev => prev + 1);
    }
  }, [currentReviewIndex, gameState.moveHistory.length]);

  const stepBackward = useCallback(() => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(prev => prev - 1);
    }
  }, [currentReviewIndex]);

  const goToMove = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, gameState.moveHistory.length - 1));
    setCurrentReviewIndex(clamped);
  }, [gameState.moveHistory.length]);

  const resetGame = useCallback(() => {
    setGameState({
      board: createEmptyBoard(),
      currentPlayer: 'black',
      moveHistory: [],
      captures: { black: 0, white: 0 },
      isGameOver: false,
      winner: null,
      startTime: Date.now(),
      lastMoveTime: Date.now(),
    });
    setCurrentReviewIndex(-1);
    setIsAIThinking(false);
    setLastCaptured([]);
  }, []);

  return {
    gameState,
    currentReviewIndex,
    isAIThinking,
    lastCaptured,
    makeMove,
    undoMove,
    resign,
    requestDraw,
    importGame,
    exportGameRecord,
    getReviewBoard,
    getReviewMove,
    stepForward,
    stepBackward,
    goToMove,
    resetGame,
    loadGameRecord,
    isValidMove: (pos: Position) =>
      isValidMove(gameState.board, pos, gameState.currentPlayer, lastCaptured),
  };
};
