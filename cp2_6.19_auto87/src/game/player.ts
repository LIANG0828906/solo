import { Card, createDeck, shuffleDeck } from './deck';

export type PlayerId = 'red' | 'blue';

const HAND_SIZE = 5;

export class Player {
  readonly id: PlayerId;
  private deck: Card[];
  private hand: Card[];

  constructor(id: PlayerId) {
    this.id = id;
    this.deck = shuffleDeck(createDeck());
    this.hand = [];
    this.drawInitialHand();
  }

  private drawInitialHand(): void {
    for (let i = 0; i < HAND_SIZE; i++) {
      this.drawCard();
    }
  }

  drawCard(): Card | null {
    if (this.deck.length === 0 || this.hand.length >= HAND_SIZE) {
      return null;
    }
    const card = this.deck.pop()!;
    this.hand.push(card);
    return card;
  }

  getHand(): Card[] {
    return [...this.hand];
  }

  getDeckCount(): number {
    return this.deck.length;
  }

  removeCard(cardId: string): Card | null {
    const index = this.hand.findIndex(c => c.id === cardId);
    if (index === -1) return null;
    const removed = this.hand.splice(index, 1)[0];
    return removed;
  }

  hasCard(cardId: string): boolean {
    return this.hand.some(c => c.id === cardId);
  }
}

export class PlayerManager {
  private players: Record<PlayerId, Player>;
  private currentPlayerId: PlayerId;

  constructor() {
    this.players = {
      red: new Player('red'),
      blue: new Player('blue')
    };
    this.currentPlayerId = 'red';
  }

  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerId];
  }

  getCurrentPlayerId(): PlayerId {
    return this.currentPlayerId;
  }

  getPlayer(id: PlayerId): Player {
    return this.players[id];
  }

  switchPlayer(): PlayerId {
    this.currentPlayerId = this.currentPlayerId === 'red' ? 'blue' : 'red';
    return this.currentPlayerId;
  }

  drawForCurrentPlayer(): Card | null {
    return this.getCurrentPlayer().drawCard();
  }
}
