import { Spell, ElementType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const ELEMENT_CONFIG: Record<ElementType, {
  name: string;
  emoji: string;
  color: string;
  baseDamageRange: [number, number];
  description: string;
}> = {
  fire: {
    name: '烈焰术',
    emoji: '🔥',
    color: '#E25822',
    baseDamageRange: [10, 18],
    description: '直接造成火焰伤害',
  },
  ice: {
    name: '寒霜术',
    emoji: '❄️',
    color: '#00BFFF',
    baseDamageRange: [6, 10],
    description: '冰冻对手一回合',
  },
  thunder: {
    name: '雷霆术',
    emoji: '⚡',
    color: '#FFD700',
    baseDamageRange: [8, 14],
    description: '30%概率连击一次',
  },
  wind: {
    name: '疾风术',
    emoji: '🌪️',
    color: '#32CD32',
    baseDamageRange: [4, 6],
    description: '吹回对方一张手牌',
  },
};

export class SpellDeck {
  private deck: Spell[] = [];
  private spellDamageRanges: Record<ElementType, { min: number; max: number }>;

  constructor() {
    this.spellDamageRanges = this.generateDamageRanges();
    this.initializeDeck();
  }

  private generateDamageRanges(): Record<ElementType, { min: number; max: number }> {
    const ranges: Record<ElementType, { min: number; max: number }> = {} as Record<ElementType, { min: number; max: number }>;
    (Object.keys(ELEMENT_CONFIG) as ElementType[]).forEach((element) => {
      const [baseMin, baseMax] = ELEMENT_CONFIG[element].baseDamageRange;
      const mid = Math.floor((baseMin + baseMax) / 2);
      const spread = Math.floor((baseMax - baseMin) / 2);
      const actualMid = mid + Math.floor(Math.random() * (spread + 1)) - Math.floor(spread / 2);
      const actualMin = Math.max(baseMin, actualMid - 2);
      const actualMax = Math.min(baseMax, actualMid + 2);
      ranges[element] = { min: actualMin, max: actualMax };
    });
    return ranges;
  }

  private getRandomDamage(element: ElementType): number {
    const { min, max } = this.spellDamageRanges[element];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private initializeDeck(): void {
    this.deck = [];
    const elements: ElementType[] = ['fire', 'ice', 'thunder', 'wind'];
    elements.forEach((element) => {
      for (let i = 0; i < 5; i++) {
        const config = ELEMENT_CONFIG[element];
        this.deck.push({
          id: uuidv4(),
          element,
          damage: this.getRandomDamage(element),
          name: config.name,
          emoji: config.emoji,
          color: config.color,
          description: config.description,
        });
      }
    });
    this.shuffle();
  }

  private shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  public drawCards(count: number): Spell[] {
    const drawn: Spell[] = [];
    for (let i = 0; i < count && this.deck.length > 0; i++) {
      const card = this.deck.pop();
      if (card) drawn.push(card);
    }
    return drawn;
  }

  public drawOne(): Spell | null {
    return this.deck.pop() || null;
  }

  public removeCard(id: string): boolean {
    const index = this.deck.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.deck.splice(index, 1);
      return true;
    }
    return false;
  }

  public addCard(card: Spell): void {
    this.deck.push(card);
    this.shuffle();
  }

  public getRemainingCount(): number {
    return this.deck.length;
  }

  public isEmpty(): boolean {
    return this.deck.length === 0;
  }

  public getDamageRanges(): Record<ElementType, { min: number; max: number }> {
    return { ...this.spellDamageRanges };
  }

  public getElementConfig(element: ElementType) {
    return ELEMENT_CONFIG[element];
  }
}
