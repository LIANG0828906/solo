import { GameState, Position, DiceValue, Player, Piece } from './gameState';

export const BOARD_SIZE = 16;

const DIRECTIONS: { dx: number; dy: number }[] = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
  { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
  { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
  { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
];

const RIVER_POSITIONS: Position[] = [
  { x: 7, y: 7 }, { x: 7, y: 8 },
  { x: 8, y: 7 }, { x: 8, y: 8 }
];

const CORNER_AREAS: { x0: number; y0: number; x1: number; y1: number }[] = [
  { x0: 0, y0: 0, x1: 2, y1: 2 },
  { x0: 13, y0: 0, x1: 15, y1: 2 },
  { x0: 0, y0: 13, x1: 2, y1: 15 },
  { x0: 13, y0: 13, x1: 15, y1: 15 }
];

export function isRiverPosition(pos: Position): boolean {
  return RIVER_POSITIONS.some(r => r.x === pos.x && r.y === pos.y);
}

export function isCornerPosition(pos: Position): boolean {
  return CORNER_AREAS.some(c =>
    pos.x >= c.x0 && pos.x <= c.x1 && pos.y >= c.y0 && pos.y <= c.y1
  );
}

export function rollDice(): DiceValue {
  const rand = Math.floor(Math.random() * 6);
  if (rand === 0) return 'xiao';
  return (rand) as DiceValue;
}

export function getValidMoves(state: GameState, pieceId: number): Position[] {
  const piece = state.pieces.find(p => p.id === pieceId);
  if (!piece || piece.player !== state.currentPlayer) return [];
  if (state.currentDiceResult === null || state.currentDiceResult === 'xiao') return [];

  const steps = state.currentDiceResult as number;
  const moves: Position[] = [];

  for (const dir of DIRECTIONS) {
    const target: Position = {
      x: piece.position.x + dir.dx * steps,
      y: piece.position.y + dir.dy * steps
    };

    if (target.x < 0 || target.x >= BOARD_SIZE || target.y < 0 || target.y >= BOARD_SIZE) continue;

    let pathClear = true;
    for (let i = 1; i < steps; i++) {
      const midPos: Position = {
        x: piece.position.x + dir.dx * i,
        y: piece.position.y + dir.dy * i
      };
      if (state.pieces.some(p => p.position.x === midPos.x && p.position.y === midPos.y)) {
        pathClear = false;
        break;
      }
    }
    if (!pathClear) continue;

    const destPiece = state.pieces.find(
      p => p.position.x === target.x && p.position.y === target.y
    );
    if (destPiece) {
      if (destPiece.player === piece.player) continue;
      if (destPiece.position.x === destPiece.startPosition.x &&
          destPiece.position.y === destPiece.startPosition.y) continue;
    }

    moves.push(target);
  }

  return moves;
}

export function getMarkablePieces(state: GameState): Piece[] {
  if (state.currentDiceResult !== 'xiao') return [];
  return state.pieces.filter(p => p.player === state.currentPlayer && !p.isXiao);
}

export function applyDiceRoll(state: GameState, result: DiceValue): GameState {
  const newDiceHistory = [...state.diceHistory, {
    player: state.currentPlayer,
    value: result,
    turn: state.turnNumber
  }];

  if (result === 'xiao') {
    const markable = state.pieces.filter(p => p.player === state.currentPlayer && !p.isXiao);
    if (markable.length === 0) {
      return {
        ...state,
        currentDiceResult: result,
        diceHistory: newDiceHistory,
        diceRollCount: state.diceRollCount + 1,
        gamePhase: 'ended',
        currentPlayer: state.currentPlayer === 'red' ? 'blue' : 'red',
        turnNumber: state.currentPlayer === 'blue' ? state.turnNumber + 1 : state.turnNumber
      };
    }
    return {
      ...state,
      currentDiceResult: result,
      diceHistory: newDiceHistory,
      diceRollCount: state.diceRollCount + 1,
      gamePhase: 'marking',
      selectedPieceId: null,
      validMoves: []
    };
  }

  return {
    ...state,
    currentDiceResult: result,
    diceHistory: newDiceHistory,
    diceRollCount: state.diceRollCount + 1,
    gamePhase: 'moving',
    selectedPieceId: null,
    validMoves: []
  };
}

export function applyPieceMove(state: GameState, pieceId: number, target: Position): GameState {
  const piece = state.pieces.find(p => p.id === pieceId);
  if (!piece) return state;

  const newPieces = state.pieces.map(p => ({ ...p, position: { ...p.position } }));

  let pushedPieceId: number | null = null;
  const destPiece = newPieces.find(
    p => p.position.x === target.x && p.position.y === target.y && p.id !== pieceId
  );
  if (destPiece && destPiece.player !== piece.player) {
    destPiece.position = { ...destPiece.startPosition };
    pushedPieceId = destPiece.id;
  }

  const movingPiece = newPieces.find(p => p.id === pieceId);
  if (movingPiece) {
    movingPiece.position = { ...target };
  }

  const newMoveHistory = [...state.moveHistory, {
    player: state.currentPlayer,
    pieceId,
    from: { ...piece.position },
    to: { ...target },
    pushedPieceId
  }];

  const newState: GameState = {
    ...state,
    pieces: newPieces,
    moveHistory: newMoveHistory,
    currentDiceResult: null,
    selectedPieceId: null,
    validMoves: []
  };

  const winner = checkWin(newState);
  if (winner) {
    return { ...newState, gamePhase: 'ended', winner };
  }

  const nextPlayer: Player = state.currentPlayer === 'red' ? 'blue' : 'red';
  return {
    ...newState,
    currentPlayer: nextPlayer,
    turnNumber: state.currentPlayer === 'blue' ? state.turnNumber + 1 : state.turnNumber,
    gamePhase: 'rolling'
  };
}

export function applyXiaoMark(state: GameState, pieceId: number): GameState {
  const piece = state.pieces.find(p => p.id === pieceId);
  if (!piece || piece.player !== state.currentPlayer || piece.isXiao) return state;

  const newPieces = state.pieces.map(p => {
    if (p.id === pieceId) return { ...p, isXiao: true, position: { ...p.position } };
    return { ...p, position: { ...p.position } };
  });

  const newState: GameState = {
    ...state,
    pieces: newPieces,
    currentDiceResult: null,
    selectedPieceId: null,
    validMoves: []
  };

  const winner = checkWin(newState);
  if (winner) {
    return { ...newState, gamePhase: 'ended', winner };
  }

  const nextPlayer: Player = state.currentPlayer === 'red' ? 'blue' : 'red';
  return {
    ...newState,
    currentPlayer: nextPlayer,
    turnNumber: state.currentPlayer === 'blue' ? state.turnNumber + 1 : state.turnNumber,
    gamePhase: 'rolling'
  };
}

export function checkWin(state: GameState): Player | null {
  for (const player of ['red', 'blue'] as Player[]) {
    const playerPieces = state.pieces.filter(p => p.player === player);
    const hasXiao = playerPieces.some(p => p.isXiao);
    if (!hasXiao) continue;

    for (const piece of playerPieces) {
      for (const dir of DIRECTIONS) {
        let count = 1;
        let xiaoInLine = piece.isXiao;

        for (let i = 1; i <= 2; i++) {
          const nx = piece.position.x + dir.dx * i;
          const ny = piece.position.y + dir.dy * i;
          const found = playerPieces.find(p => p.position.x === nx && p.position.y === ny);
          if (found) {
            count++;
            if (found.isXiao) xiaoInLine = true;
          } else {
            break;
          }
        }

        if (count >= 3 && xiaoInLine) return player;
      }
    }
  }
  return null;
}
