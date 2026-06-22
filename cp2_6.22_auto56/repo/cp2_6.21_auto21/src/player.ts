import { Card, createDeck, MinionCard, DeathrattleEffect } from './card';

export interface BoardMinion {
  instanceId: string;
  cardId: string;
  name: string;
  attack: number;
  maxHealth: number;
  currentHealth: number;
  canAttack: boolean;
  attacksThisTurn: number;
  maxAttacksPerTurn: number;
  taunt?: boolean;
  frozen?: boolean;
  hasCharge?: boolean;
  summonedThisTurn?: boolean;
  deathrattle?: DeathrattleEffect;
}

export interface Weapon {
  cardId: string;
  name: string;
  attack: number;
  durability: number;
}

export interface PlayerState {
  id: 'player' | 'ai';
  name: string;
  hero: {
    health: number;
    maxHealth: number;
  };
  mana: {
    current: number;
    max: number;
  };
  weapon: Weapon | null;
  hand: Card[];
  deck: Card[];
  board: (BoardMinion | null)[][];
}

export const BOARD_ROWS = 3;
export const BOARD_COLS = 4;

let instanceIdCounter = 0;

export function generateInstanceId(): string {
  return `minion_${Date.now()}_${instanceIdCounter++}`;
}

export function createEmptyBoard(): (BoardMinion | null)[][] {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  );
}

export function createPlayer(id: 'player' | 'ai', name: string): PlayerState {
  const deck = createDeck();
  const hand: Card[] = [];
  const initialHandSize = 3;
  for (let i = 0; i < initialHandSize && deck.length > 0; i++) {
    hand.push(deck.pop()!);
  }
  return {
    id,
    name,
    hero: {
      health: 30,
      maxHealth: 30,
    },
    mana: {
      current: id === 'player' ? 3 : 4,
      max: id === 'player' ? 3 : 4,
    },
    weapon: null,
    hand,
    deck,
    board: createEmptyBoard(),
  };
}

export function drawCard(player: PlayerState): Card | null {
  if (player.deck.length === 0) {
    return null;
  }
  const card = player.deck.pop()!;
  if (player.hand.length < 10) {
    player.hand.push(card);
  }
  return card;
}

export function drawCards(player: PlayerState, count: number): Card[] {
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    const card = drawCard(player);
    if (card) drawn.push(card);
  }
  return drawn;
}

export function restoreMana(player: PlayerState): void {
  if (player.mana.max < 10) {
    player.mana.max += 1;
  }
  player.mana.current = player.mana.max;
}

export function createBoardMinion(card: MinionCard): BoardMinion {
  const hasCharge = !!card.charge;
  return {
    instanceId: generateInstanceId(),
    cardId: card.id,
    name: card.name,
    attack: card.attack,
    maxHealth: card.health,
    currentHealth: card.health,
    canAttack: hasCharge,
    attacksThisTurn: 0,
    maxAttacksPerTurn: 1,
    taunt: card.taunt,
    hasCharge,
    summonedThisTurn: true,
    deathrattle: card.deathrattle,
  };
}

export function getBoardMinions(player: PlayerState): BoardMinion[] {
  const minions: BoardMinion[] = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (player.board[row][col]) {
        minions.push(player.board[row][col]!);
      }
    }
  }
  return minions;
}

export function findEmptyCell(player: PlayerState): { row: number; col: number } | null {
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (!player.board[row][col]) {
        return { row, col };
      }
    }
  }
  return null;
}

export function placeMinion(
  player: PlayerState,
  minion: BoardMinion,
  row: number,
  col: number
): boolean {
  if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return false;
  if (player.board[row][col]) return false;
  player.board[row][col] = minion;
  return true;
}

export function removeDeadMinions(player: PlayerState): BoardMinion[] {
  const dead: BoardMinion[] = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const minion = player.board[row][col];
      if (minion && minion.currentHealth <= 0) {
        minion.currentHealth = 0;
        dead.push(minion);
        player.board[row][col] = null;
      }
    }
  }
  return dead;
}

export function resetMinionAttacks(player: PlayerState): void {
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const minion = player.board[row][col];
      if (minion) {
        minion.summonedThisTurn = false;
        minion.canAttack = true;
        minion.attacksThisTurn = 0;
        minion.frozen = false;
        minion.maxAttacksPerTurn = 1;
      }
    }
  }
}

export function canMinionAttack(minion: BoardMinion): boolean {
  if (minion.frozen) return false;
  if (minion.attacksThisTurn >= minion.maxAttacksPerTurn) return false;
  if (minion.summonedThisTurn && !minion.hasCharge) return false;
  return minion.canAttack;
}

export function getDeckRemaining(player: PlayerState): number {
  return player.deck.length;
}

export function damageMinion(minion: BoardMinion, amount: number): void {
  minion.currentHealth = Math.max(0, minion.currentHealth - amount);
}

export function damageHero(player: PlayerState, amount: number): void {
  player.hero.health = Math.max(0, player.hero.health - amount);
}

export function healHero(player: PlayerState, amount: number): void {
  player.hero.health = Math.min(player.hero.maxHealth, player.hero.health + amount);
}

export function getHeroAttack(player: PlayerState): number {
  return player.weapon ? player.weapon.attack : 0;
}
