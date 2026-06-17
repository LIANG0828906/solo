import { v4 as uuidv4 } from 'uuid';
import cardTemplatesData from '@/data/cardTemplates.json';
import type { CardTemplate, BattleCard } from '@/game/types';

export class CardManager {
  private templates: CardTemplate[] = [];
  private deck: BattleCard[] = [];
  private _hand: BattleCard[] = [];
  private discard: BattleCard[] = [];

  get hand(): BattleCard[] {
    return this._hand;
  }

  get deckSize(): number {
    return this.deck.length;
  }

  loadTemplates(templates?: CardTemplate[]): void {
    this.templates = templates ?? (cardTemplatesData as CardTemplate[]);
  }

  initDeck(count: number = 10): void {
    const shuffled = [...this.templates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    this.deck = selected.map((t) => ({ ...t, uid: uuidv4() }));
    this._hand = [];
    this.discard = [];
    this.shuffle();
  }

  shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  drawCards(count: number): { drawn: BattleCard[]; handFull: boolean } {
    const drawn: BattleCard[] = [];
    let handFull = false;

    for (let i = 0; i < count; i++) {
      if (this._hand.length >= 6) {
        handFull = true;
        break;
      }
      if (this.deck.length === 0) {
        this.recycleDiscard();
      }
      if (this.deck.length === 0) break;
      const card = this.deck.shift()!;
      this._hand.push(card);
      drawn.push(card);
    }

    return { drawn, handFull };
  }

  playCard(index: number): BattleCard | null {
    if (index < 0 || index >= this._hand.length) return null;
    const card = this._hand.splice(index, 1)[0];
    this.discard.push(card);
    return card;
  }

  private recycleDiscard(): void {
    this.deck.push(...this.discard);
    this.discard = [];
    this.shuffle();
  }
}
