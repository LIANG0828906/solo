import { useState, useCallback, useRef, useEffect } from 'react';
import { StoneColor, Position, MoveEntry, GameState } from '../types';

const BOARD_SIZE = 15;
const WIN_COUNT = 5;

const DIRECTIONS = [
  [0, 1], [1, 0], [1, 1], [1, -1]
];

const STAR_POINTS = [
  { x: 3, y: 3 }, { x: 11, y: 3 },
  { x: 7, y: 7 },
  { x: 3, y: 11 }, { x: 11, y: 11 }
];

function createEmptyBoard(): StoneColor[][] {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(StoneColor.Empty));
}

function checkWin(board: StoneColor[][], pos: Position, color: StoneColor): boolean {
  for (const [dx, dy] of DIRECTIONS) {
    let count = 1;
    for (let i = 1; i < WIN_COUNT; i++) {
      const nx = pos.x + dx * i;
      const ny = pos.y + dy * i;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
      if (board[ny][nx] !== color) break;
      count++;
    }
    for (let i = 1; i < WIN_COUNT; i++) {
      const nx = pos.x - dx * i;
      const ny = pos.y - dy * i;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
      if (board[ny][nx] !== color) break;
      count++;
    }
    if (count >= WIN_COUNT) return true;
  }
  return false;
}

function countInDirection(
  board: StoneColor[][],
  pos: Position,
  dx: number,
  dy: number,
  color: StoneColor
): number {
  let count = 0;
  for (let i = 1; i < WIN_COUNT; i++) {
    const nx = pos.x + dx * i;
    const ny = pos.y + dy * i;
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
    if (board[ny][nx] !== color) break;
    count++;
  }
  for (let i = 1; i < WIN_COUNT; i++) {
    const nx = pos.x - dx * i;
    const ny = pos.y - dy * i;
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
    if (board[ny][nx] !== color) break;
    count++;
  }
  return count;
}

function getMaxConsecutive(board: StoneColor[][], pos: Position, color: StoneColor): number {
  let max = 0;
  for (const [dx, dy] of DIRECTIONS) {
    const count = countInDirection(board, pos, dx, dy, color) + 1;
    if (count > max) max = count;
  }
  return max;
}

function getAIMove(board: StoneColor[][]): Position | null {
  const emptyPositions: Position[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] === StoneColor.Empty) {
        emptyPositions.push({ x, y });
      }
    }
  }

  if (emptyPositions.length === 0) return null;

  const hasStone = emptyPositions.some(p => {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = p.x + dx;
        const ny = p.y + dy;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
          if (board[ny][nx] !== StoneColor.Empty) return true;
        }
      }
    }
    return false;
  });

  if (!hasStone) {
    return { x: 7, y: 7 };
  }

  let bestScore = -Infinity;
  let bestMove: Position | null = null;

  for (const pos of emptyPositions) {
    let hasNeighbor = false;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = pos.x + dx;
        const ny = pos.y + dy;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
          if (board[ny][nx] !== StoneColor.Empty) {
            hasNeighbor = true;
            break;
          }
        }
      }
      if (hasNeighbor) break;
    }
    if (!hasNeighbor) continue;

    board[pos.y][pos.x] = StoneColor.White;
    const attackScore = getMaxConsecutive(board, pos, StoneColor.White);
    board[pos.y][pos.x] = StoneColor.Empty;

    board[pos.y][pos.x] = StoneColor.Black;
    const defenseScore = getMaxConsecutive(board, pos, StoneColor.Black);
    board[pos.y][pos.x] = StoneColor.Empty;

    let score = 0;
    if (attackScore >= 5) score += 100000;
    else if (defenseScore >= 5) score += 10000;
    else if (attackScore >= 4) score += 5000;
    else if (defenseScore >= 4) score += 1000;
    else if (attackScore >= 3) score += 500;
    else if (defenseScore >= 3) score += 200;
    else if (attackScore >= 2) score += 50;
    else if (defenseScore >= 2) score += 20;
    else score += 1;

    const centerDist = Math.abs(pos.x - 7) + Math.abs(pos.y - 7);
    score += (14 - centerDist) * 0.1;

    if (score > bestScore) {
      bestScore = score;
      bestMove = pos;
    }
  }

  if (!bestMove) {
    bestMove = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  }

  return bestMove;
}

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createEmptyBoard(),
    currentTurn: StoneColor.Black,
    gameOver: false,
    winner: null,
    gameRecord: {
      moves: [],
      startTime: Date.now(),
      totalMoves: 0
    },
    currentMoveIndex: -1,
    isPlaying: true,
    isReplaying: false
  }));

  const aiTimeoutRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  const makeMove = useCallback((pos: Position): boolean => {
    if (isProcessingRef.current) return false;

    let success = false;

    setGameState(prev => {
      if (prev.gameOver || prev.isReplaying) return prev;
      if (prev.board[pos.y][pos.x] !== StoneColor.Empty) return prev;
      if (prev.currentTurn !== StoneColor.Black) return prev;

      const newBoard = prev.board.map(row => [...row]);
      newBoard[pos.y][pos.x] = StoneColor.Black;

      const moveEntry: MoveEntry = {
        moveNumber: prev.gameRecord.moves.length + 1,
        position: pos,
        color: StoneColor.Black,
        timestamp: Date.now()
      };

      const newMoves = [...prev.gameRecord.moves, moveEntry];
      const isWin = checkWin(newBoard, pos, StoneColor.Black);

      success = true;

      return {
        ...prev,
        board: newBoard,
        currentTurn: StoneColor.White,
        gameOver: isWin,
        winner: isWin ? StoneColor.Black : null,
        gameRecord: {
          ...prev.gameRecord,
          moves: newMoves,
          totalMoves: newMoves.length,
          winner: isWin ? StoneColor.Black : undefined,
          endTime: isWin ? Date.now() : undefined
        },
        currentMoveIndex: newMoves.length - 1
      };
    });

    return success;
  }, []);

  useEffect(() => {
    if (
      !gameState.gameOver &&
      !gameState.isReplaying &&
      gameState.currentTurn === StoneColor.White &&
      gameState.isPlaying
    ) {
      isProcessingRef.current = true;

      aiTimeoutRef.current = window.setTimeout(() => {
        setGameState(prev => {
          if (prev.gameOver || prev.currentTurn !== StoneColor.White) {
            isProcessingRef.current = false;
            return prev;
          }

          const aiMove = getAIMove(prev.board);
          if (!aiMove) {
            isProcessingRef.current = false;
            return {
              ...prev,
              gameOver: true,
              gameRecord: {
                ...prev.gameRecord,
                endTime: Date.now()
              }
            };
          }

          const newBoard = prev.board.map(row => [...row]);
          newBoard[aiMove.y][aiMove.x] = StoneColor.White;

          const moveEntry: MoveEntry = {
            moveNumber: prev.gameRecord.moves.length + 1,
            position: aiMove,
            color: StoneColor.White,
            timestamp: Date.now()
          };

          const newMoves = [...prev.gameRecord.moves, moveEntry];
          const isWin = checkWin(newBoard, aiMove, StoneColor.White);

          isProcessingRef.current = false;

          return {
            ...prev,
            board: newBoard,
            currentTurn: StoneColor.Black,
            gameOver: isWin,
            winner: isWin ? StoneColor.White : null,
            gameRecord: {
              ...prev.gameRecord,
              moves: newMoves,
              totalMoves: newMoves.length,
              winner: isWin ? StoneColor.White : undefined,
              endTime: isWin ? Date.now() : undefined
            },
            currentMoveIndex: newMoves.length - 1
          };
        });
      }, 300 + Math.random() * 200);
    }

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
        isProcessingRef.current = false;
      }
    };
  }, [gameState.currentTurn, gameState.gameOver, gameState.isReplaying, gameState.isPlaying]);

  const jumpToMove = useCallback((index: number) => {
    setGameState(prev => {
      if (index < -1 || index >= prev.gameRecord.moves.length) return prev;

      const newBoard = createEmptyBoard();
      for (let i = 0; i <= index; i++) {
        const move = prev.gameRecord.moves[i];
        newBoard[move.position.y][move.position.x] = move.color;
      }

      const isAtEnd = index === prev.gameRecord.moves.length - 1;
      const isGameOverAtPoint = index >= 0 && checkWin(
        newBoard,
        prev.gameRecord.moves[index].position,
        prev.gameRecord.moves[index].color
      );

      return {
        ...prev,
        board: newBoard,
        currentMoveIndex: index,
        currentTurn: index % 2 === 0 ? StoneColor.White : StoneColor.Black,
        gameOver: isGameOverAtPoint,
        winner: isGameOverAtPoint ? prev.gameRecord.moves[index].color : null,
        isReplaying: !isAtEnd,
        isPlaying: isAtEnd
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    isProcessingRef.current = false;

    setGameState({
      board: createEmptyBoard(),
      currentTurn: StoneColor.Black,
      gameOver: false,
      winner: null,
      gameRecord: {
        moves: [],
        startTime: Date.now(),
        totalMoves: 0
      },
      currentMoveIndex: -1,
      isPlaying: true,
      isReplaying: false
    });
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => {
      const newBoard = createEmptyBoard();
      for (const move of prev.gameRecord.moves) {
        newBoard[move.position.y][move.position.x] = move.color;
      }

      const lastMove = prev.gameRecord.moves[prev.gameRecord.moves.length - 1];
      const isGameOver = lastMove ? checkWin(newBoard, lastMove.position, lastMove.color) : false;

      return {
        ...prev,
        board: newBoard,
        currentMoveIndex: prev.gameRecord.moves.length - 1,
        currentTurn: prev.gameRecord.moves.length % 2 === 0 ? StoneColor.Black : StoneColor.White,
        gameOver: isGameOver,
        winner: isGameOver ? lastMove?.color ?? null : null,
        isReplaying: false,
        isPlaying: true
      };
    });
  }, []);

  const toggleAnnotation = useCallback((moveIndex: number, annotation: string) => {
    setGameState(prev => {
      const newMoves = [...prev.gameRecord.moves];
      newMoves[moveIndex] = {
        ...newMoves[moveIndex],
        annotation: newMoves[moveIndex].annotation ? undefined : annotation
      };
      return {
        ...prev,
        gameRecord: {
          ...prev.gameRecord,
          moves: newMoves
        }
      };
    });
  }, []);

  const exportRecord = useCallback((): string => {
    return JSON.stringify(gameState.gameRecord, null, 2);
  }, [gameState.gameRecord]);

  const getElapsedTime = useCallback((): number => {
    const endTime = gameState.gameRecord.endTime ?? Date.now();
    return endTime - gameState.gameRecord.startTime;
  }, [gameState.gameRecord]);

  return {
    gameState,
    makeMove,
    jumpToMove,
    resetGame,
    resumeGame,
    toggleAnnotation,
    exportRecord,
    getElapsedTime,
    starPoints: STAR_POINTS,
    boardSize: BOARD_SIZE
  };
}
