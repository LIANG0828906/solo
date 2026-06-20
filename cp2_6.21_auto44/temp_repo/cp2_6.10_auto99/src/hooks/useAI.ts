import { useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { BOI_POSITIONS } from '../utils/constants';
import { getValidMoves, getManhattanDistance } from '../utils/helpers';
import type { Position, Piece } from '../types/game';

export const useAI = () => {
  const {
    phase,
    currentPlayer,
    isAITurn,
    isAIThinking,
    hasCasted,
    lastSteps,
    pieces,
    selectedPiece,
    validMoves,
    setAIThinking,
    castZhus,
    selectPiece,
    movePiece,
  } = useGameStore();

  const findBestMove = useCallback(() => {
    const aiPieces = pieces.filter((p) => p.player === 'leopard');
    const tigerPieces = pieces.filter((p) => p.player === 'tiger');

    let bestPiece: Piece | null = null;
    let bestMove: Position | null = null;
    let bestScore = -Infinity;

    for (const piece of aiPieces) {
      const moves = getValidMoves(piece, lastSteps, pieces);

      for (const move of moves) {
        let score = 0;

        if (BOI_POSITIONS.some((p) => p.x === move.x && p.y === move.y)) {
          score += 1000;
        }

        for (const tiger of tigerPieces) {
          const dist = getManhattanDistance(move, tiger.position);
          score += Math.max(0, 20 - dist);
        }

        const centerX = 3.5;
        const centerY = 3.5;
        const centerDist = Math.sqrt(
          Math.pow(move.x - centerX, 2) + Math.pow(move.y - centerY, 2)
        );
        score += Math.max(0, 10 - centerDist * 2);

        if (score > bestScore) {
          bestScore = score;
          bestPiece = piece;
          bestMove = move;
        }
      }
    }

    return { bestPiece, bestMove };
  }, [pieces, lastSteps]);

  useEffect(() => {
    if (
      phase !== 'playing' ||
      !isAITurn ||
      currentPlayer !== 'leopard' ||
      isAIThinking
    ) {
      return;
    }

    const executeAI = async () => {
      setAIThinking(true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!hasCasted) {
        castZhus();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setAIThinking(false);

      const { bestPiece, bestMove } = findBestMove();

      if (bestPiece && bestMove) {
        setTimeout(() => {
          selectPiece(bestPiece.id);
          setTimeout(() => {
            movePiece(bestPiece.id, bestMove);
          }, 300);
        }, 200);
      } else {
        const state = useGameStore.getState();
        const nextPlayer = 'tiger';
        useGameStore.setState({
          currentPlayer: nextPlayer,
          turn: state.turn + 1,
          hasCasted: false,
        });
      }
    };

    executeAI();
  }, [
    phase,
    isAITurn,
    currentPlayer,
    isAIThinking,
    hasCasted,
    lastSteps,
    setAIThinking,
    castZhus,
    selectPiece,
    movePiece,
    findBestMove,
  ]);

  return { isAIThinking };
};
