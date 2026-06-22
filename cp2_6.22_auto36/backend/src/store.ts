import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type { Card, Vote } from '../../shared/types';

interface StoreState {
  cards: Card[];
  votes: Vote[];
}

class CardStore {
  private state: StoreState = { cards: [], votes: [] };

  getCards(): Card[] {
    return this.state.cards;
  }

  getVotes(): Vote[] {
    return this.state.votes;
  }

  getVoteCount(cardId: string): number {
    return this.state.votes.filter((v) => v.cardId === cardId).length;
  }

  hasUserVoted(cardId: string, userId: string): boolean {
    return this.state.votes.some((v) => v.cardId === cardId && v.userId === userId);
  }

  getCardCreator(cardId: string): string | null {
    const card = this.state.cards.find((c) => c.id === cardId);
    return card ? card.creatorId : null;
  }

  addCard(
    input: Omit<Card, 'id' | 'creatorId' | 'createdAt'>,
    creatorId: string
  ): Card {
    const newCard: Card = {
      ...input,
      id: uuidv4(),
      creatorId,
      createdAt: Date.now(),
    };
    this.state = produce(this.state, (draft) => {
      draft.cards.push(newCard);
    });
    return newCard;
  }

  moveCard(id: string, x: number, y: number): Card | null {
    const idx = this.state.cards.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.state = produce(this.state, (draft) => {
      draft.cards[idx].x = x;
      draft.cards[idx].y = y;
    });
    return this.state.cards[idx];
  }

  updateCard(id: string, patch: Partial<Card>): Card | null {
    const idx = this.state.cards.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.state = produce(this.state, (draft) => {
      Object.assign(draft.cards[idx], patch);
    });
    return this.state.cards[idx];
  }

  deleteCard(id: string): boolean {
    const exists = this.state.cards.some((c) => c.id === id);
    if (!exists) return false;
    this.state = produce(this.state, (draft) => {
      draft.cards = draft.cards.filter((c) => c.id !== id);
      draft.votes = draft.votes.filter((v) => v.cardId !== id);
    });
    return true;
  }

  toggleVote(
    cardId: string,
    userId: string
  ): { voted: boolean; total: number } | null {
    const card = this.state.cards.find((c) => c.id === cardId);
    if (!card) return null;
    if (card.creatorId === userId) return null;

    const existingIdx = this.state.votes.findIndex(
      (v) => v.cardId === cardId && v.userId === userId
    );
    let voted: boolean;
    this.state = produce(this.state, (draft) => {
      if (existingIdx >= 0) {
        draft.votes.splice(existingIdx, 1);
        voted = false;
      } else {
        draft.votes.push({ cardId, userId });
        voted = true;
      }
    });
    return { voted: voted!, total: this.getVoteCount(cardId) };
  }
}

export const store = new CardStore();
