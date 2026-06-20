import type { Piece, Player, PlayerColor, EventCardType, GameEvent } from './types';
import { PLAYER_START_POSITIONS, TOTAL_CELLS, BOARD_CELLS } from './BoardConfig';

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function calculateNewPosition(
  piece: Piece,
  diceValue: number,
  playerColor: PlayerColor
): { newPosition: number; newDistance: number; newIsHome: boolean } {
  if (piece.isHome || piece.position === TOTAL_CELLS) {
    return { newPosition: TOTAL_CELLS, newDistance: TOTAL_CELLS, newIsHome: true };
  }

  if (piece.position === -1) {
    if (diceValue === 6) {
      return {
        newPosition: PLAYER_START_POSITIONS[playerColor],
        newDistance: 0,
        newIsHome: false,
      };
    }
    return {
      newPosition: piece.position,
      newDistance: piece.distanceTraveled,
      newIsHome: piece.isHome,
    };
  }

  if (piece.position >= 0 && piece.position < TOTAL_CELLS) {
    const newDistance = piece.distanceTraveled + diceValue;
    if (diceValue >= 0) {
      if (newDistance >= TOTAL_CELLS) {
        return { newPosition: TOTAL_CELLS, newDistance: TOTAL_CELLS, newIsHome: true };
      }
      const newPosition = (PLAYER_START_POSITIONS[playerColor] + newDistance) % TOTAL_CELLS;
      return { newPosition, newDistance, newIsHome: false };
    } else {
      let wrappedDistance = newDistance;
      if (wrappedDistance < 0) {
        wrappedDistance = ((wrappedDistance % TOTAL_CELLS) + TOTAL_CELLS) % TOTAL_CELLS;
      }
      const newPosition = ((PLAYER_START_POSITIONS[playerColor] + wrappedDistance) % TOTAL_CELLS + TOTAL_CELLS) % TOTAL_CELLS;
      return { newPosition, newDistance: wrappedDistance, newIsHome: false };
    }
  }

  return {
    newPosition: piece.position,
    newDistance: piece.distanceTraveled,
    newIsHome: piece.isHome,
  };
}

export function checkCollision(
  movingPieceId: string,
  targetPos: number,
  allPlayers: Player[],
  currentPlayerId: string
): { collision: boolean; kickedPieceIds: string[]; blocked: boolean } {
  const enemyPieces: Piece[] = [];

  for (const player of allPlayers) {
    if (player.id === currentPlayerId) continue;
    for (const piece of player.pieces) {
      if (piece.position === targetPos && piece.position >= 0 && piece.position < TOTAL_CELLS) {
        enemyPieces.push(piece);
      }
    }
  }

  if (enemyPieces.length === 0) {
    return { collision: false, kickedPieceIds: [], blocked: false };
  }

  if (enemyPieces.length === 1) {
    return { collision: true, kickedPieceIds: [enemyPieces[0].id], blocked: false };
  }

  return { collision: false, kickedPieceIds: [], blocked: true };
}

export function getMovablePieces(player: Player, diceValue: number): Piece[] {
  return player.pieces.filter((piece) => {
    if (piece.isHome || piece.position === TOTAL_CELLS) {
      return false;
    }
    if (piece.position === -1) {
      return diceValue === 6;
    }
    return true;
  });
}

export function checkWin(player: Player): boolean {
  return player.pieces.every((piece) => piece.isHome);
}

export function getPathPositions(
  fromPos: number,
  diceValue: number,
  playerColor: PlayerColor,
  currentDistance: number,
  isHome: boolean
): number[] {
  if (isHome || fromPos === TOTAL_CELLS || diceValue === 0) {
    return [];
  }

  if (fromPos === -1) {
    if (diceValue === 6) {
      return [PLAYER_START_POSITIONS[playerColor]];
    }
    return [];
  }

  const path: number[] = [];
  const absSteps = Math.abs(diceValue);
  const direction = diceValue >= 0 ? 1 : -1;

  for (let step = 1; step <= absSteps; step++) {
    const stepDistance = currentDistance + direction * step;
    let wrappedDistance = stepDistance;
    if (direction < 0 && wrappedDistance < 0) {
      wrappedDistance = ((wrappedDistance % TOTAL_CELLS) + TOTAL_CELLS) % TOTAL_CELLS;
    }
    if (wrappedDistance >= TOTAL_CELLS) {
      path.push(TOTAL_CELLS);
      break;
    }
    const pos = ((PLAYER_START_POSITIONS[playerColor] + wrappedDistance) % TOTAL_CELLS + TOTAL_CELLS) % TOTAL_CELLS;
    path.push(pos);
  }

  return path;
}

export function applyEventCard(
  cardType: EventCardType,
  player: Player,
  allPlayers: Player[]
): {
  pieceId: string | null;
  newPosition: number;
  newDistance: number;
  newIsHome: boolean;
  events: GameEvent[];
  kickedPieceIds: string[];
} {
  const nonHomePieces = player.pieces.filter((p) => !p.isHome && p.position !== TOTAL_CELLS);
  const timestamp = Date.now();

  if (cardType === 'advance2_clear') {
    const targetPiece = nonHomePieces[0];
    if (!targetPiece) {
      return {
        pieceId: null,
        newPosition: -1,
        newDistance: 0,
        newIsHome: false,
        events: [],
        kickedPieceIds: [],
      };
    }
    const { newPosition, newDistance, newIsHome } = calculateNewPosition(
      targetPiece,
      2,
      player.color
    );
    const { collision, kickedPieceIds } = checkCollision(
      targetPiece.id,
      newPosition,
      allPlayers,
      player.id
    );
    const events: GameEvent[] = [
      {
        type: 'event_card',
        description: `${player.name} used advance2_clear`,
        affectedPieceIds: [targetPiece.id],
        timestamp,
      },
    ];
    if (collision) {
      events.push({
        type: 'collision',
        description: `Collision at position ${newPosition}`,
        affectedPieceIds: [targetPiece.id, ...kickedPieceIds],
        timestamp,
      });
    }
    return {
      pieceId: targetPiece.id,
      newPosition,
      newDistance,
      newIsHome,
      events,
      kickedPieceIds,
    };
  }

  if (cardType === 'retreat3_collision') {
    const targetPiece = nonHomePieces[0];
    if (!targetPiece) {
      return {
        pieceId: null,
        newPosition: -1,
        newDistance: 0,
        newIsHome: false,
        events: [],
        kickedPieceIds: [],
      };
    }
    const { newPosition, newDistance, newIsHome } = calculateNewPosition(
      targetPiece,
      -3,
      player.color
    );
    const { collision, kickedPieceIds } = checkCollision(
      targetPiece.id,
      newPosition,
      allPlayers,
      player.id
    );
    const events: GameEvent[] = [
      {
        type: 'event_card',
        description: `${player.name} used retreat3_collision`,
        affectedPieceIds: [targetPiece.id],
        timestamp,
      },
    ];
    if (collision) {
      events.push({
        type: 'collision',
        description: `Collision at position ${newPosition}`,
        affectedPieceIds: [targetPiece.id, ...kickedPieceIds],
        timestamp,
      });
    }
    return {
      pieceId: targetPiece.id,
      newPosition,
      newDistance,
      newIsHome,
      events,
      kickedPieceIds,
    };
  }

  if (cardType === 'teleport_ally') {
    const firstPiece = nonHomePieces[0];
    const secondPiece = nonHomePieces.find(
      (p) => p.id !== firstPiece?.id && p.position >= 0 && p.position < TOTAL_CELLS
    );
    if (!firstPiece || !secondPiece) {
      return {
        pieceId: null,
        newPosition: -1,
        newDistance: 0,
        newIsHome: false,
        events: [],
        kickedPieceIds: [],
      };
    }
    const events: GameEvent[] = [
      {
        type: 'event_card',
        description: `${player.name} used teleport_ally`,
        affectedPieceIds: [firstPiece.id, secondPiece.id],
        timestamp,
      },
    ];
    return {
      pieceId: firstPiece.id,
      newPosition: secondPiece.position,
      newDistance: secondPiece.distanceTraveled,
      newIsHome: secondPiece.isHome,
      events,
      kickedPieceIds: [],
    };
  }

  return {
    pieceId: null,
    newPosition: -1,
    newDistance: 0,
    newIsHome: false,
    events: [],
    kickedPieceIds: [],
  };
}

export function resolveMove(
  pieceId: string,
  diceValue: number,
  player: Player,
  allPlayers: Player[]
): {
  piece: Piece;
  events: GameEvent[];
  kickedPieceIds: string[];
  path: number[];
} {
  const piece = player.pieces.find((p) => p.id === pieceId);
  if (!piece) {
    return {
      piece: { id: pieceId, position: -1, distanceTraveled: 0, isHome: false },
      events: [],
      kickedPieceIds: [],
      path: [],
    };
  }

  const timestamp = Date.now();
  const events: GameEvent[] = [];
  const kickedPieceIds: string[] = [];

  const path = getPathPositions(
    piece.position,
    diceValue,
    player.color,
    piece.distanceTraveled,
    piece.isHome
  );

  const { newPosition, newDistance, newIsHome } = calculateNewPosition(
    piece,
    diceValue,
    player.color
  );

  let finalPosition = newPosition;
  let finalDistance = newDistance;
  const finalIsHome = newIsHome;

  if (!finalIsHome && finalPosition >= 0 && finalPosition < TOTAL_CELLS) {
    const targetCell = BOARD_CELLS[finalPosition];
    if (targetCell) {
      if (targetCell.isShortcut && targetCell.shortcutTarget !== undefined) {
        finalPosition = targetCell.shortcutTarget;
        finalDistance =
          ((finalPosition - PLAYER_START_POSITIONS[player.color]) % TOTAL_CELLS + TOTAL_CELLS) % TOTAL_CELLS;
        events.push({
          type: 'shortcut',
          description: `Took shortcut from ${newPosition} to ${finalPosition}`,
          affectedPieceIds: [pieceId],
          timestamp,
        });
        path.push(finalPosition);
      }

      if (targetCell.isEvent) {
        events.push({
          type: 'event_card',
          description: `Landed on event cell ${finalPosition}`,
          affectedPieceIds: [pieceId],
          timestamp,
        });
      }
    }
  }

  const { collision, kickedPieceIds: collisionKicked, blocked } = checkCollision(
    pieceId,
    finalPosition,
    allPlayers,
    player.id
  );

  if (collision) {
    kickedPieceIds.push(...collisionKicked);
    events.push({
      type: 'collision',
      description: `Collision at position ${finalPosition}`,
      affectedPieceIds: [pieceId, ...collisionKicked],
      timestamp,
    });
  }

  if (blocked) {
    return {
      piece: { ...piece },
      events: [],
      kickedPieceIds: [],
      path: [],
    };
  }

  const updatedPiece: Piece = {
    ...piece,
    position: finalPosition,
    distanceTraveled: finalDistance,
    isHome: finalIsHome,
  };

  return {
    piece: updatedPiece,
    events,
    kickedPieceIds,
    path,
  };
}
