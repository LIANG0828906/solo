import { useState, useCallback, useEffect } from 'react';
import type { GameState, GameMode } from '../types';
import {
  initGame,
  drawFromStock,
  executeMove,
  undoMove,
  findValidMoves,
  updateElapsedTime,
  validateMove,
} from '../gameLogic';
import type { CardType, PileType, MoveHint } from '../types';
import { playDraw, playFoundationSuccess, playInvalidMove, playCardPlace, playWin } from '../utils/audio';

export const useGameState = (mode: GameMode) => {
  const [gameState, setGameState] = useState<GameState>(() => initGame(mode));
  const [hints, setHints] = useState<MoveHint[]>([]);
  const [invalidCardId, setInvalidCardId] = useState<string | null>(null);
  const [glowFoundation, setGlowFoundation] = useState<{ player: number; index: number } | null>(null);

  useEffect(() => {
    if (gameState.isGameOver) {
      playWin();
      return;
    }

    const timer = setInterval(() => {
      setGameState(prev => updateElapsedTime(prev));
    }, 10);

    return () => clearInterval(timer);
  }, [gameState.isGameOver]);

  const handleDraw = useCallback(() => {
    if (gameState.isGameOver) return;
    setGameState(prev => drawFromStock(prev));
    playDraw();
    setHints([]);
  }, [gameState.isGameOver]);

  const handleMove = useCallback((
    cards: CardType[],
    sourceType: PileType,
    sourceIndex: number,
    sourceColumn: number,
    targetType: PileType,
    targetIndex: number,
    targetColumn: number
  ) => {
    if (gameState.isGameOver) return;

    const playerId = gameState.currentPlayer;
    const validation = validateMove(cards, targetType, targetColumn, gameState, playerId);

    if (!validation.valid) {
      setInvalidCardId(cards[0].id);
      playInvalidMove();
      setTimeout(() => setInvalidCardId(null), 400);
      return false;
    }

    setGameState(prev =>
      executeMove(
        prev,
        cards,
        sourceType,
        sourceIndex,
        sourceColumn,
        targetType,
        targetIndex,
        targetColumn,
        playerId
      )
    );

    if (targetType === 'foundation') {
      playFoundationSuccess(gameState.comboCounts[playerId] + 1);
      setGlowFoundation({ player: playerId, index: targetColumn });
      setTimeout(() => setGlowFoundation(null), 600);
    } else {
      playCardPlace();
    }

    setHints([]);
    return true;
  }, [gameState]);

  const handleUndo = useCallback(() => {
    if (gameState.history.length === 0 || gameState.isGameOver) return;
    setGameState(prev => undoMove(prev));
    setHints([]);
  }, [gameState.history.length, gameState.isGameOver]);

  const handleHint = useCallback(() => {
    if (gameState.isGameOver) return;
    const validHints = findValidMoves(gameState, gameState.currentPlayer);
    setHints(validHints.slice(0, 3));
  }, [gameState]);

  const handleRestart = useCallback(() => {
    setGameState(initGame(mode));
    setHints([]);
    setInvalidCardId(null);
    setGlowFoundation(null);
  }, [mode]);

  const isCardInHint = useCallback((cardId: string): boolean => {
    return hints.some(hint => hint.cards.some(card => card.id === cardId));
  }, [hints]);

  const getHintTarget = useCallback((cardId: string): { type: PileType; column: number } | null => {
    const hint = hints.find(h => h.cards.some(c => c.id === cardId));
    if (!hint) return null;
    return { type: hint.targetType, column: hint.targetColumn ?? hint.targetIndex };
  }, [hints]);

  return {
    gameState,
    hints,
    invalidCardId,
    glowFoundation,
    handleDraw,
    handleMove,
    handleUndo,
    handleHint,
    handleRestart,
    isCardInHint,
    getHintTarget,
  };
};
