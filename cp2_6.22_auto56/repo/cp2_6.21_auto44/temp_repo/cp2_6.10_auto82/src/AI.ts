import { StoneColor, Position } from './types';
import { placeStone, getLiberties, getGroup, getAdjacentPositions } from './utils';

const BOARD_SIZE = 19;

interface MoveScore {
  position: Position;
  score: number;
}

export const findBestMove = (
  board: StoneColor[][],
  aiColor: 'black' | 'white'
): Position | null => {
  const startTime = performance.now();
  const userColor = aiColor === 'black' ? 'white' : 'black';
  
  const validMoves = getValidMoves(board);
  if (validMoves.length === 0) return null;
  
  const scoredMoves: MoveScore[] = [];
  
  for (const move of validMoves) {
    const score = evaluateMove(board, move, aiColor, userColor);
    scoredMoves.push({ position: move, score });
  }
  
  scoredMoves.sort((a, b) => b.score - a.score);
  
  const topMoves = scoredMoves.slice(0, Math.min(5, scoredMoves.length));
  let bestMove = topMoves[0];
  let bestScore = -Infinity;
  
  for (const candidate of topMoves) {
    const { newBoard, success } = placeStone(board, candidate.position, aiColor);
    if (!success) continue;
    
    const opponentBestScore = findBestOpponentMove(newBoard, userColor, aiColor);
    const finalScore = candidate.score - opponentBestScore * 0.8;
    
    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestMove = candidate;
    }
  }
  
  const elapsed = performance.now() - startTime;
  if (elapsed > 90) {
    console.warn(`AI决策耗时: ${elapsed.toFixed(2)}ms，接近阈值`);
  }
  
  return bestMove.position;
};

const findBestOpponentMove = (
  board: StoneColor[][],
  opponentColor: 'black' | 'white',
  aiColor: 'black' | 'white'
): number => {
  const validMoves = getValidMoves(board);
  if (validMoves.length === 0) return 0;
  
  let bestScore = -Infinity;
  
  for (const move of validMoves.slice(0, 10)) {
    const score = evaluateMove(board, move, opponentColor, aiColor);
    if (score > bestScore) {
      bestScore = score;
    }
  }
  
  return bestScore;
};

const evaluateMove = (
  board: StoneColor[][],
  pos: Position,
  myColor: 'black' | 'white',
  opponentColor: 'black' | 'white'
): number => {
  let score = 0;
  
  const { newBoard, success, capturedCount } = placeStone(board, pos, myColor);
  if (!success) return -10000;
  
  score += capturedCount * 100;
  
  const myGroup = getGroup(newBoard, pos);
  const myLiberties = getLiberties(newBoard, myGroup);
  score += myLiberties.length * 5;
  
  if (myLiberties.length <= 1) {
    score -= 200;
  }
  
  const adjacent = getAdjacentPositions(pos);
  for (const adj of adjacent) {
    if (newBoard[adj.row][adj.col] === opponentColor) {
      const oppGroup = getGroup(newBoard, adj);
      const oppLiberties = getLiberties(newBoard, oppGroup);
      score += (4 - oppLiberties.length) * 20;
      
      if (oppLiberties.length === 1) {
        score += 150;
      }
    }
  }
  
  const centerDist = Math.abs(pos.row - 9) + Math.abs(pos.col - 9);
  score += (18 - centerDist) * 0.5;
  
  const cornerDist = Math.min(
    pos.row + pos.col,
    pos.row + (18 - pos.col),
    (18 - pos.row) + pos.col,
    (18 - pos.row) + (18 - pos.col)
  );
  if (cornerDist <= 6) {
    score += (6 - cornerDist) * 2;
  }
  
  score += countConnections(newBoard, pos, myColor) * 15;
  
  score += evaluateTerritoryGain(newBoard, pos, myColor);
  
  return score;
};

const evaluateTerritoryGain = (
  board: StoneColor[][],
  pos: Position,
  _color: StoneColor
): number => {
  let score = 0;
  const radius = 3;
  
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const r = pos.row + dr;
      const c = pos.col + dc;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
      
      const dist = Math.abs(dr) + Math.abs(dc);
      if (board[r][c] === null) {
        score += (radius - dist + 1);
      }
    }
  }
  
  return score;
};

const countConnections = (
  board: StoneColor[][],
  pos: Position,
  color: StoneColor
): number => {
  let count = 0;
  const adjacent = getAdjacentPositions(pos);
  
  for (const adj of adjacent) {
    if (board[adj.row][adj.col] === color) {
      count++;
    }
  }
  
  const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of diagonals) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
      count += 0.5;
    }
  }
  
  return count;
};

const getValidMoves = (board: StoneColor[][]): Position[] => {
  const moves: Position[] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== null) continue;
      
      const hasNeighbor = hasAdjacentStone(board, { row, col });
      if (hasNeighbor || isNearStone(board, { row, col }, 2)) {
        const { success } = placeStone(board, { row, col }, 'black');
        if (success) {
          moves.push({ row, col });
        }
      }
    }
  }
  
  if (moves.length === 0) {
    for (let row = 3; row < BOARD_SIZE - 3; row += 3) {
      for (let col = 3; col < BOARD_SIZE - 3; col += 3) {
        if (board[row][col] === null) {
          moves.push({ row, col });
        }
      }
    }
  }
  
  return moves;
};

const hasAdjacentStone = (board: StoneColor[][], pos: Position): boolean => {
  const adjacent = getAdjacentPositions(pos);
  for (const adj of adjacent) {
    if (board[adj.row][adj.col] !== null) {
      return true;
    }
  }
  return false;
};

const isNearStone = (board: StoneColor[][], pos: Position, radius: number): boolean => {
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const r = pos.row + dr;
      const c = pos.col + dc;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
      if (board[r][c] !== null) return true;
    }
  }
  return false;
};
