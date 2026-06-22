import {
  Board,
  PlayerColor,
  getValidMoves,
  makeMove,
  countPieces,
  getOpponent,
  hasValidMoves,
} from './BoardLogic';

function evaluateBoard(board: Board, player: PlayerColor): number {
  const { black, white } = countPieces(board);
  if (player === 'black') {
    return black - white;
  } else {
    return white - black;
  }
}

function evaluateMove(
  board: Board,
  row: number,
  col: number,
  player: PlayerColor
): number {
  const { newBoard } = makeMove(board, row, col, player);
  return evaluateBoard(newBoard, player);
}

function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  aiPlayer: PlayerColor
): number {
  const currentPlayer = isMaximizing ? aiPlayer : getOpponent(aiPlayer);
  const validMoves = getValidMoves(board, currentPlayer);

  if (depth === 0 || validMoves.length === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  if (!hasValidMoves(board, currentPlayer)) {
    return minimax(board, depth - 1, !isMaximizing, aiPlayer);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const [row, col] of validMoves) {
      const { newBoard } = makeMove(board, row, col, currentPlayer);
      const evalScore = minimax(newBoard, depth - 1, false, aiPlayer);
      maxEval = Math.max(maxEval, evalScore);
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const [row, col] of validMoves) {
      const { newBoard } = makeMove(board, row, col, currentPlayer);
      const evalScore = minimax(newBoard, depth - 1, true, aiPlayer);
      minEval = Math.min(minEval, evalScore);
    }
    return minEval;
  }
}

export function getBestMove(
  board: Board,
  player: PlayerColor
): [number, number] | null {
  const validMoves = getValidMoves(board, player);
  if (validMoves.length === 0) {
    return null;
  }

  let bestMoves: [number, number][] = [];
  let bestScore = -Infinity;

  for (const [row, col] of validMoves) {
    const { newBoard, flipped } = makeMove(board, row, col, player);
    
    const immediateGain = flipped.length;
    const depthScore = minimax(newBoard, 1, false, player);
    const totalScore = immediateGain + depthScore * 0.5;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMoves = [[row, col]];
    } else if (totalScore === bestScore) {
      bestMoves.push([row, col]);
    }
  }

  const randomIndex = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[randomIndex];
}
