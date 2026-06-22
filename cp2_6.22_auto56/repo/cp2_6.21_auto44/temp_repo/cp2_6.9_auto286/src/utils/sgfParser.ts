import type { Move, Position, StoneColor } from '@/types';
import { calculateWinRate, createEmptyBoard, placeStone } from './gameLogic';

const parseSGFCoord = (coord: string): Position | null => {
  if (!coord || coord.length !== 2) return null;
  const x = coord.charCodeAt(0) - 'a'.charCodeAt(0);
  const y = coord.charCodeAt(1) - 'a'.charCodeAt(0);
  if (x < 0 || x >= 19 || y < 0 || y >= 19) return null;
  return { x, y };
};

const toSGFCoord = (pos: Position): string => {
  return String.fromCharCode('a'.charCodeAt(0) + pos.x) +
         String.fromCharCode('a'.charCodeAt(0) + pos.y);
};

export const parseSGF = (content: string): Move[] => {
  const moves: Move[] = [];
  let board = createEmptyBoard();
  let moveNumber = 0;

  const moveRegex = /([BW])\[([a-s]{0,2})\]/g;
  let match;

  while ((match = moveRegex.exec(content)) !== null) {
    const color: StoneColor = match[1] === 'B' ? 'black' : 'white';
    const coord = match[2];

    if (!coord) continue;

    const position = parseSGFCoord(coord);
    if (!position) continue;

    const lastMove = moves[moves.length - 1];
    const lastCaptured = lastMove?.capturedStones || [];

    const result = placeStone(board, position, color, moveNumber + 1, lastCaptured);
    if (result) {
      moveNumber++;
      moves.push({
        position,
        color,
        moveNumber,
        winRate: result.winRate,
        capturedStones: result.captured,
      });
      board = result.newBoard;
    }
  }

  return moves;
};

export const parseJSONGameRecord = (content: string): Move[] | null => {
  try {
    const data = JSON.parse(content);
    if (data.moves && Array.isArray(data.moves)) {
      return data.moves;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const movesToSGF = (moves: Move[], winner: StoneColor): string => {
  let sgf = '(;GM[1]FF[4]SZ[19]';

  if (winner === 'black') sgf += 'RE[B+]';
  else if (winner === 'white') sgf += 'RE[W+]';

  for (const move of moves) {
    const color = move.color === 'black' ? 'B' : 'W';
    const coord = toSGFCoord(move.position);
    sgf += `;${color}[${coord}]`;
  }

  sgf += ')';
  return sgf;
};
