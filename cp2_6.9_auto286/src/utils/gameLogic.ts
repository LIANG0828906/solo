import type { StoneColor, Position, Move } from '@/types';

export const BOARD_SIZE = 19;

const STAR_POINTS: Position[] = [
  { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
  { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
  { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 },
];

export const getStarPoints = (): Position[] => STAR_POINTS;

export const createEmptyBoard = (): StoneColor[][] => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

export const cloneBoard = (board: StoneColor[][]): StoneColor[][] => {
  return board.map(row => [...row]);
};

const getNeighbors = (pos: Position): Position[] => {
  const neighbors: Position[] = [];
  const { x, y } = pos;
  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < BOARD_SIZE - 1) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < BOARD_SIZE - 1) neighbors.push({ x, y: y + 1 });
  return neighbors;
};

const getGroup = (board: StoneColor[][], pos: Position): Position[] => {
  const color = board[pos.y][pos.x];
  if (!color) return [];

  const group: Position[] = [];
  const visited = new Set<string>();
  const stack: Position[] = [pos];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current.x},${current.y}`;
    if (visited.has(key)) continue;
    if (board[current.y][current.x] !== color) continue;

    visited.add(key);
    group.push(current);

    for (const neighbor of getNeighbors(current)) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (!visited.has(neighborKey) && board[neighbor.y][neighbor.x] === color) {
        stack.push(neighbor);
      }
    }
  }

  return group;
};

const countLiberties = (board: StoneColor[][], group: Position[]): number => {
  const liberties = new Set<string>();
  for (const pos of group) {
    for (const neighbor of getNeighbors(pos)) {
      if (board[neighbor.y][neighbor.x] === null) {
        liberties.add(`${neighbor.x},${neighbor.y}`);
      }
    }
  }
  return liberties.size;
};

const removeGroup = (board: StoneColor[][], group: Position[]): void => {
  for (const pos of group) {
    board[pos.y][pos.x] = null;
  }
};

const hasKo = (
  board: StoneColor[][],
  pos: Position,
  color: StoneColor,
  capturedStones: Position[]
): boolean => {
  if (capturedStones.length !== 1) return false;

  const testBoard = cloneBoard(board);
  testBoard[pos.y][pos.x] = color;
  removeGroup(testBoard, capturedStones);

  const captured = getCapturedStones(testBoard, pos, color === 'black' ? 'white' : 'black');
  return captured.length === 1 &&
    captured[0].x === pos.x &&
    captured[0].y === pos.y;
};

const getCapturedStones = (
  board: StoneColor[][],
  lastMove: Position,
  opponentColor: StoneColor
): Position[] => {
  const captured: Position[] = [];
  const checkedGroups = new Set<string>();

  for (const neighbor of getNeighbors(lastMove)) {
    if (board[neighbor.y][neighbor.x] === opponentColor) {
      const groupKey = `${neighbor.x},${neighbor.y}`;
      if (checkedGroups.has(groupKey)) continue;

      const group = getGroup(board, neighbor);
      group.forEach(p => checkedGroups.add(`${p.x},${p.y}`));

      if (countLiberties(board, group) === 0) {
        captured.push(...group);
      }
    }
  }

  return captured;
};

const isSuicide = (
  board: StoneColor[][],
  pos: Position,
  color: StoneColor
): boolean => {
  const testBoard = cloneBoard(board);
  testBoard[pos.y][pos.x] = color;

  const opponentColor = color === 'black' ? 'white' : 'black';
  const opponentCaptured = getCapturedStones(testBoard, pos, opponentColor);
  if (opponentCaptured.length > 0) return false;

  const ownGroup = getGroup(testBoard, pos);
  return countLiberties(testBoard, ownGroup) === 0;
};

export const isValidMove = (
  board: StoneColor[][],
  pos: Position,
  color: StoneColor,
  lastCaptured: Position[] = []
): boolean => {
  if (pos.x < 0 || pos.x >= BOARD_SIZE || pos.y < 0 || pos.y >= BOARD_SIZE) {
    return false;
  }
  if (board[pos.y][pos.x] !== null) return false;
  if (isSuicide(board, pos, color)) return false;
  if (hasKo(board, pos, color, lastCaptured)) return false;
  return true;
};

export const placeStone = (
  board: StoneColor[][],
  pos: Position,
  color: StoneColor,
  moveNumber: number,
  lastCaptured: Position[] = []
): { newBoard: StoneColor[][]; captured: Position[]; winRate: number } | null => {
  if (!isValidMove(board, pos, color, lastCaptured)) return null;

  const newBoard = cloneBoard(board);
  newBoard[pos.y][pos.x] = color;

  const opponentColor = color === 'black' ? 'white' : 'black';
  const captured = getCapturedStones(newBoard, pos, opponentColor);
  removeGroup(newBoard, captured);

  const winRate = calculateWinRate(newBoard, color, moveNumber);

  return { newBoard, captured, winRate };
};

export const calculateWinRate = (
  board: StoneColor[][],
  lastColor: StoneColor,
  moveNumber: number
): number => {
  let blackScore = 0;
  let whiteScore = 0;

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const stone = board[y][x];
      const group = getGroup(board, { x, y });
      const liberties = countLiberties(board, group);

      if (stone === 'black') {
        blackScore += 10 + liberties * 2;
        if (x >= 3 && x <= 15 && y >= 3 && y <= 15) blackScore += 3;
      } else if (stone === 'white') {
        whiteScore += 10 + liberties * 2;
        if (x >= 3 && x <= 15 && y >= 3 && y <= 15) whiteScore += 3;
      }
    }
  }

  const cornerBonus = (color: StoneColor) => {
    const corners = [
      { x: 0, y: 0 }, { x: 18, y: 0 }, { x: 0, y: 18 }, { x: 18, y: 18 }
    ];
    return corners.filter(c => board[c.y][c.x] === color).length * 5;
  };

  blackScore += cornerBonus('black');
  whiteScore += cornerBonus('white');

  whiteScore += 6.5;

  const totalScore = blackScore + whiteScore;
  const baseRate = lastColor === 'black'
    ? (blackScore / totalScore) * 100
    : (whiteScore / totalScore) * 100;

  const randomFactor = (Math.random() - 0.5) * 10;
  const moveFactor = Math.max(0, 1 - moveNumber / 200) * 15;

  return Math.max(5, Math.min(95, baseRate + randomFactor + (lastColor === 'black' ? moveFactor : -moveFactor)));
};

export const getAIMove = (
  board: StoneColor[][],
  lastMove: Position | null
): Position | null => {
  const validMoves: Position[] = [];
  const moveScores: Map<string, number> = new Map();

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const pos = { x, y };
      if (isValidMove(board, pos, 'white')) {
        validMoves.push(pos);
        let score = 0;

        const testResult = placeStone(board, pos, 'white', 1);
        if (testResult) {
          score += testResult.captured.length * 20;
          score += calculateWinRate(testResult.newBoard, 'white', 1) * 0.5;
        }

        if (lastMove) {
          const dist = Math.abs(x - lastMove.x) + Math.abs(y - lastMove.y);
          if (dist >= 2 && dist <= 6) score += 15;
        }

        if (x >= 2 && x <= 16 && y >= 2 && y <= 16) score += 10;

        for (const sp of STAR_POINTS) {
          if (x === sp.x && y === sp.y && board[y][x] === null) {
            score += 25;
          }
        }

        moveScores.set(`${x},${y}`, score);
      }
    }
  }

  if (validMoves.length === 0) return null;

  validMoves.sort((a, b) => {
    const scoreA = moveScores.get(`${a.x},${a.y}`) || 0;
    const scoreB = moveScores.get(`${b.x},${b.y}`) || 0;
    return scoreB - scoreA;
  });

  const topCount = Math.min(5, validMoves.length);
  const randomIndex = Math.floor(Math.random() * topCount);
  return validMoves[randomIndex];
};

export const getBoardAtMove = (
  moveHistory: Move[],
  moveIndex: number
): StoneColor[][] => {
  const board = createEmptyBoard();
  const movesToApply = moveHistory.slice(0, moveIndex + 1);

  for (const move of movesToApply) {
    board[move.position.y][move.position.x] = move.color;
    for (const captured of move.capturedStones) {
      board[captured.y][captured.x] = null;
    }
  }

  return board;
};

export const determineWinner = (moveHistory: Move[]): StoneColor => {
  if (moveHistory.length < 2) return null;

  let blackTerritory = 0;
  let whiteTerritory = 0;
  let blackStones = 0;
  let whiteStones = 0;

  const finalBoard = getBoardAtMove(moveHistory, moveHistory.length - 1);

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const stone = finalBoard[y][x];
      if (stone === 'black') blackStones++;
      else if (stone === 'white') whiteStones++;
    }
  }

  const visited = new Set<string>();
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const key = `${x},${y}`;
      if (finalBoard[y][x] === null && !visited.has(key)) {
        const emptyGroup: Position[] = [];
        const stack: Position[] = [{ x, y }];
        let touchesBlack = false;
        let touchesWhite = false;

        while (stack.length > 0) {
          const pos = stack.pop()!;
          const posKey = `${pos.x},${pos.y}`;
          if (visited.has(posKey)) continue;
          if (finalBoard[pos.y][pos.x] !== null) {
            if (finalBoard[pos.y][pos.x] === 'black') touchesBlack = true;
            if (finalBoard[pos.y][pos.x] === 'white') touchesWhite = true;
            continue;
          }

          visited.add(posKey);
          emptyGroup.push(pos);

          for (const neighbor of getNeighbors(pos)) {
            stack.push(neighbor);
          }
        }

        if (touchesBlack && !touchesWhite) {
          blackTerritory += emptyGroup.length;
        } else if (touchesWhite && !touchesBlack) {
          whiteTerritory += emptyGroup.length;
        }
      }
    }
  }

  const blackTotal = blackStones + blackTerritory;
  const whiteTotal = whiteStones + whiteTerritory + 6.5;

  return blackTotal > whiteTotal ? 'black' : 'white';
};
