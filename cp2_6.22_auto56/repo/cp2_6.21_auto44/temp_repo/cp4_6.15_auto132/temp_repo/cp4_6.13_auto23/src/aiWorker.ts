import type { Board, PieceColor, Move, Difficulty } from './types';
import { makeAIMove } from './ChessEngine';

interface AIRequest {
  board: Board;
  color: PieceColor;
  difficulty: Difficulty;
}

interface AIResponse {
  move: Move | null;
}

self.onmessage = (e: MessageEvent<AIRequest>) => {
  const { board, color, difficulty } = e.data;
  const startTime = performance.now();
  const move = makeAIMove(board, color, difficulty);
  const elapsed = performance.now() - startTime;
  const minDelay = 300;
  const delay = Math.max(0, minDelay - elapsed);

  setTimeout(() => {
    const response: AIResponse = { move };
    self.postMessage(response);
  }, delay);
};
