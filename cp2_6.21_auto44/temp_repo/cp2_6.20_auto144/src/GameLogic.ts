import { v4 as uuidv4 } from 'uuid';
import type { Cell, CollisionResult, EventCardType, EventCard, Player, PlayerColor } from '@/types/game';
import { CollisionIndex } from '@/utils/collisionIndex';

export const TOTAL_CELLS = 28;
export const TURN_TIMEOUT_MS = 30000;
export const INITIAL_EVENT_CARDS = 3;

const ZONE_ASSIGNMENTS: (PlayerColor | 'center')[] = [
  'red', 'red', 'red', 'red',
  'center', 'center', 'center', 'center', 'center', 'center',
  'yellow', 'yellow', 'yellow', 'yellow',
  'center', 'center', 'center',
  'blue', 'blue', 'blue', 'blue',
  'center', 'center', 'center',
  'green', 'green', 'green', 'green',
];

const EVENT_CELL_IDS = [5, 11, 18, 25];
const STAR_CELL_IDS = new Set([0, 5, 11, 18, 25, 27]);
const ARROW_CELL_IDS = new Set([6, 7, 13, 14, 20, 21]);

const collisionIndex = new CollisionIndex();

export function buildCellLayout(): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const row = Math.floor(i / 7);
    const colInRow = i % 7;
    const col = row % 2 === 0 ? colInRow : 6 - colInRow;

    let specialMark: 'arrow' | 'star' | undefined;
    if (STAR_CELL_IDS.has(i)) {
      specialMark = 'star';
    } else if (ARROW_CELL_IDS.has(i)) {
      specialMark = 'arrow';
    }

    cells.push({
      id: i,
      zone: ZONE_ASSIGNMENTS[i],
      isStart: i === 0,
      isEvent: EVENT_CELL_IDS.includes(i),
      specialMark,
      row,
      col,
    });
  }
  return cells;
}

export function calculateNewPosition(
  currentPos: number,
  diceValue: number,
  totalDistance: number
): { position: number; totalDistance: number; isFinished: boolean } {
  if (currentPos === -1) {
    const newTotal = diceValue;
    const newPos = newTotal % TOTAL_CELLS;
    return { position: newPos, totalDistance: newTotal, isFinished: false };
  }

  const newTotal = totalDistance + diceValue;
  if (newTotal >= TOTAL_CELLS) {
    return { position: 0, totalDistance: newTotal, isFinished: true };
  }

  return { position: newTotal % TOTAL_CELLS, totalDistance: newTotal, isFinished: false };
}

export function checkCollision(
  newPosition: number,
  currentPieceId: string,
  currentPlayerId: string,
  players: Player[]
): CollisionResult {
  collisionIndex.rebuild(players);

  const opponentPieces = collisionIndex.getOpponentPiecesAt(newPosition, currentPlayerId);
  const alliedPieces = collisionIndex.getAlliedPiecesAt(newPosition, currentPlayerId);

  if (opponentPieces.length === 0) {
    return { collided: false, kickedPieceIds: [], warning: null };
  }

  if (opponentPieces.length >= 2) {
    return {
      collided: false,
      kickedPieceIds: [],
      warning: '格位已满，无法踢回！',
    };
  }

  return {
    collided: true,
    kickedPieceIds: [opponentPieces[0].id],
    warning: null,
  };
}

export function applyCollision(
  players: Player[],
  kickedPieceIds: string[]
): Player[] {
  if (kickedPieceIds.length === 0) return players;

  return players.map((player) => ({
    ...player,
    pieces: player.pieces.map((piece) => {
      if (kickedPieceIds.includes(piece.id)) {
        return { ...piece, position: -1, totalDistance: 0 };
      }
      return piece;
    }),
  }));
}

export function applyEventCard(
  eventType: EventCardType,
  player: Player,
  allPlayers: Player[],
  targetPieceId?: string,
  targetAllyPieceId?: string
): { updatedPlayers: Player[]; message: string } {
  const targetPiece = targetPieceId
    ? player.pieces.find((p) => p.id === targetPieceId)
    : player.pieces.find((p) => !p.isFinished && p.position >= 0);

  if (!targetPiece) {
    return { updatedPlayers: allPlayers, message: '没有可用的棋子！' };
  }

  switch (eventType) {
    case 'advance_clear': {
      const newPos = (targetPiece.position + 2) % TOTAL_CELLS;
      const kickedIds: string[] = [];

      const updatedPlayers = allPlayers.map((p) => ({
        ...p,
        pieces: p.pieces.map((piece) => {
          if (
            piece.playerId !== player.id &&
            piece.position === newPos &&
            !piece.isFinished
          ) {
            kickedIds.push(piece.id);
            return { ...piece, position: -1, totalDistance: 0 };
          }
          if (piece.id === targetPiece.id) {
            return {
              ...piece,
              position: newPos,
              totalDistance: targetPiece.totalDistance + 2,
            };
          }
          return piece;
        }),
      }));

      const message =
        kickedIds.length > 0
          ? '冲锋号令：前进2格并清空目标格棋子！'
          : '冲锋号令：前进2格！';
      return { updatedPlayers, message };
    }

    case 'back_collision': {
      let newPos = targetPiece.position - 3;
      if (newPos < 0) newPos += TOTAL_CELLS;

      const nearbyPositions = [newPos - 1, newPos + 1].map((p) => {
        if (p < 0) return p + TOTAL_CELLS;
        if (p >= TOTAL_CELLS) return p - TOTAL_CELLS;
        return p;
      });

      const kickedIds: string[] = [];
      const processedPositions = new Set<number>();

      const updatedPlayers = allPlayers.map((p) => ({
        ...p,
        pieces: p.pieces.map((piece) => {
          if (piece.id === targetPiece.id) {
            return { ...piece, position: newPos };
          }
          if (
            piece.playerId !== player.id &&
            nearbyPositions.includes(piece.position) &&
            !piece.isFinished &&
            !processedPositions.has(piece.position)
          ) {
            const opponentCount = allPlayers
              .flatMap((pl) => pl.pieces)
              .filter(
                (pc) =>
                  pc.position === piece.position &&
                  pc.playerId !== player.id &&
                  !pc.isFinished
              ).length;

            if (opponentCount === 1) {
              processedPositions.add(piece.position);
              kickedIds.push(piece.id);
              return { ...piece, position: -1, totalDistance: 0 };
            }
          }
          return piece;
        }),
      }));

      const message =
        kickedIds.length > 0
          ? '回旋陷阱：后退3格并触发附近碰撞！'
          : '回旋陷阱：后退3格！';
      return { updatedPlayers, message };
    }

    case 'teleport_teammate': {
      const allyPieces = player.pieces.filter(
        (p) =>
          p.id !== targetPiece.id && !p.isFinished && p.position >= 0
      );

      if (allyPieces.length === 0) {
        return {
          updatedPlayers: allPlayers,
          message: '没有可传送的队友棋子！',
        };
      }

      const targetAlly = targetAllyPieceId
        ? allyPieces.find((p) => p.id === targetAllyPieceId)
        : allyPieces[0];

      if (!targetAlly) {
        return {
          updatedPlayers: allPlayers,
          message: '没有可传送的队友棋子！',
        };
      }

      const updatedPlayers = allPlayers.map((p) => ({
        ...p,
        pieces: p.pieces.map((piece) => {
          if (piece.id === targetPiece.id) {
            return { ...piece, position: targetAlly.position };
          }
          return piece;
        }),
      }));

      return {
        updatedPlayers,
        message: '队友传送：传送至己方棋子所在格子！',
      };
    }

    default:
      return { updatedPlayers: allPlayers, message: '' };
  }
}

export function checkWinCondition(player: Player): boolean {
  return player.pieces.every((p) => p.isFinished);
}

export function getNextPlayer(currentIndex: number, totalPlayers: number): number {
  return (currentIndex + 1) % totalPlayers;
}

export function getRandomEventCard(): EventCardType {
  const cards: EventCardType[] = [
    'advance_clear',
    'back_collision',
    'teleport_teammate',
  ];
  return cards[Math.floor(Math.random() * cards.length)];
}

export function createInitialEventCards(): EventCardType[] {
  return Array.from({ length: INITIAL_EVENT_CARDS }, () => getRandomEventCard());
}

export const EVENT_CARD_DEFINITIONS: Record<
  EventCardType,
  { name: string; description: string }
> = {
  advance_clear: {
    name: '冲锋号令',
    description: '前进2格并清空目标格棋子',
  },
  back_collision: {
    name: '回旋陷阱',
    description: '后退3格并触发附近格子碰撞',
  },
  teleport_teammate: {
    name: '队友传送',
    description: '传送至任意己方棋子所在的格子',
  },
};

export function createPlayer(
  name: string,
  color: PlayerColor,
  index: number
): Player {
  return {
    id: uuidv4(),
    name,
    color,
    pieces: Array.from({ length: 4 }, (_, i) => ({
      id: uuidv4(),
      playerId: '',
      position: -1,
      totalDistance: 0,
      isFinished: false,
    })),
    eventCards: createInitialEventCards(),
    turnStartTime: 0,
  };
}

export function initializePlayers(names: string[]): Player[] {
  const colors: PlayerColor[] = ['red', 'blue', 'yellow', 'green'];
  return names.map((name, i) => {
    const player = createPlayer(name, colors[i], i);
    player.pieces = player.pieces.map((piece) => ({
      ...piece,
      playerId: player.id,
    }));
    return player;
  });
}

export function replenishEventCard(
  player: Player,
  cellId: number
): Player {
  if (!EVENT_CELL_IDS.includes(cellId)) return player;
  return {
    ...player,
    eventCards: [...player.eventCards, getRandomEventCard()],
  };
}

export function getEventCardDefinition(type: EventCardType): EventCard {
  const def = EVENT_CARD_DEFINITIONS[type];
  return { type, name: def.name, description: def.description };
}

export function getCellPosition(cellId: number): { row: number; col: number } {
  const row = Math.floor(cellId / 7);
  const colInRow = cellId % 7;
  const col = row % 2 === 0 ? colInRow : 6 - colInRow;
  return { row, col };
}

export { collisionIndex };
