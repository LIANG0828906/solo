import { Card, BoardCard, Position } from './CardTypes';
import { v4 as uuidv4 } from 'uuid';
import { cardPool } from './CardData';

export const MAX_DECK_SIZE = 40;
export const MIN_DECK_SIZE = 20;
export const MAX_HAND_SIZE = 10;
export const INITIAL_HAND_SIZE = 5;
export const BOARD_ROWS = 6;
export const BOARD_COLS = 4;

export function shuffleDeck(deck: Card[]): Card[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function drawCards(
  deck: Card[],
  hand: Card[],
  count: number
): { deck: Card[]; hand: Card[]; drawn: Card[] } {
  const newDeck = [...deck];
  const newHand = [...hand];
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (newDeck.length === 0) break;
    if (newHand.length >= MAX_HAND_SIZE) break;

    const card = newDeck.shift()!;
    newHand.push(card);
    drawn.push(card);
  }

  return { deck: newDeck, hand: newHand, drawn };
}

export function createBoardCard(
  card: Card,
  position: Position,
  owner: 'player' | 'ai'
): BoardCard {
  const hasCharge = card.skillEffect === 'charge';
  return {
    ...card,
    instanceId: uuidv4(),
    currentAttack: card.attack,
    currentDefense: card.defense,
    maxDefense: card.defense,
    canAttack: hasCharge,
    hasAttacked: false,
    position,
    owner,
    isFrozen: false,
    isShielded: card.skillEffect === 'shield',
    hasCharge,
    hasTaunt: card.skillEffect === 'taunt',
    hasPierce: card.skillEffect === 'pierce',
    hasLifesteal: card.skillEffect === 'lifesteal',
    burnDamage: 0,
  };
}

export function isPositionOccupied(
  board: BoardCard[],
  position: Position
): boolean {
  return board.some(
    (card) =>
      card.position.row === position.row &&
      card.position.col === position.col
  );
}

export function getCardAtPosition(
  board: BoardCard[],
  position: Position
): BoardCard | undefined {
  return board.find(
    (card) =>
      card.position.row === position.row &&
      card.position.col === position.col
  );
}

export function getEmptyPositions(
  board: BoardCard[],
  owner: 'player' | 'ai'
): Position[] {
  const positions: Position[] = [];
  const startRow = owner === 'player' ? 3 : 0;
  const endRow = owner === 'player' ? 6 : 3;

  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (!isPositionOccupied(board, { row, col })) {
        positions.push({ row, col });
      }
    }
  }
  return positions;
}

export function getAdjacentEnemies(
  board: BoardCard[],
  position: Position,
  owner: 'player' | 'ai'
): BoardCard[] {
  const enemies: BoardCard[] = [];
  const directions = [
    { row: -1, col: 0 },
    { row: -1, col: -1 },
    { row: -1, col: 1 },
  ];

  for (const dir of directions) {
    const newPos = {
      row: position.row + dir.row,
      col: position.col + dir.col,
    };
    if (
      newPos.row >= 0 &&
      newPos.row < BOARD_ROWS &&
      newPos.col >= 0 &&
      newPos.col < BOARD_COLS
    ) {
      const card = getCardAtPosition(board, newPos);
      if (card && card.owner !== owner) {
        enemies.push(card);
      }
    }
  }

  return enemies;
}

export function getFrontEnemy(
  board: BoardCard[],
  position: Position,
  owner: 'player' | 'ai'
): BoardCard | undefined {
  const direction = owner === 'player' ? -1 : 1;
  let currentRow = position.row + direction;

  while (currentRow >= 0 && currentRow < BOARD_ROWS) {
    const card = getCardAtPosition(board, { row: currentRow, col: position.col });
    if (card && card.owner !== owner) {
      return card;
    }
    currentRow += direction;
  }

  return undefined;
}

export function hasTauntEnemies(
  board: BoardCard[],
  owner: 'player' | 'ai'
): boolean {
  const enemyOwner = owner === 'player' ? 'ai' : 'player';
  return board.some(
    (card) => card.owner === enemyOwner && card.hasTaunt
  );
}

export function getTauntEnemies(
  board: BoardCard[],
  owner: 'player' | 'ai'
): BoardCard[] {
  const enemyOwner = owner === 'player' ? 'ai' : 'player';
  return board.filter(
    (card) => card.owner === enemyOwner && card.hasTaunt
  );
}

export function calculateDeckStats(deck: Card[]): {
  totalCards: number;
  averageCost: number;
  rarityCount: Record<string, number>;
} {
  const totalCards = deck.length;
  const averageCost =
    totalCards > 0
      ? deck.reduce((sum, card) => sum + card.cost, 0) / totalCards
      : 0;

  const rarityCount: Record<string, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  for (const card of deck) {
    rarityCount[card.rarity] = (rarityCount[card.rarity] || 0) + 1;
  }

  return { totalCards, averageCost, rarityCount };
}

export function createStarterDeck(): Card[] {
  const starterCards: string[] = [
    'card_001', 'card_001', 'card_002', 'card_002', 'card_003',
    'card_004', 'card_005', 'card_005', 'card_006', 'card_007',
    'card_008', 'card_009', 'card_010', 'card_041', 'card_041',
    'card_042', 'card_043', 'card_043', 'card_044', 'card_045',
  ];

  return starterCards
    .map((id) => cardPool.find((c) => c.id === id))
    .filter((c): c is Card => c !== undefined);
}
