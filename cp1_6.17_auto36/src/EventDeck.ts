import { v4 as uuidv4 } from 'uuid';
import type { EventCard } from './types';

const BASE_EVENTS: Omit<EventCard, 'id'>[] = [
  {
    type: 'beneficial',
    name: '发现宝箱',
    description: '你发现了一个古老的宝箱，生命值+10',
  },
  {
    type: 'beneficial',
    name: '魔法泉水',
    description: '清澈的泉水恢复了你的体力，生命值+15',
  },
  {
    type: 'beneficial',
    name: '祝福之光',
    description: '神秘的光芒笼罩着你，生命值+8',
  },
  {
    type: 'harmful',
    name: '地刺陷阱',
    description: '你踩到了地刺陷阱，生命值-8',
  },
  {
    type: 'harmful',
    name: '毒雾弥漫',
    description: '房间里弥漫着毒雾，生命值-5',
  },
  {
    type: 'harmful',
    name: '落石袭击',
    description: '天花板的石块突然坠落，生命值-10',
  },
  {
    type: 'neutral',
    name: '残破雕像',
    description: '一尊古老的雕像静静矗立，什么也没发生',
  },
  {
    type: 'neutral',
    name: '神秘符文',
    description: '墙上刻着奇怪的符文，你看不懂它的含义',
  },
  {
    type: 'neutral',
    name: '空旷房间',
    description: '这是一个空旷的房间，没有任何特别之处',
  },
  {
    type: 'neutral',
    name: '岔路提示',
    description: '墙上有模糊的路标，似乎指向相邻房间的方向',
  },
];

export class EventDeck {
  private cards: EventCard[] = [];
  private discardPile: EventCard[] = [];

  constructor() {
    this.resetDeck();
  }

  resetDeck(): void {
    this.cards = BASE_EVENTS.map((event) => ({
      ...event,
      id: uuidv4(),
    }));
    this.shuffle();
    this.discardPile = [];
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  drawCard(): EventCard {
    if (this.cards.length === 0) {
      this.cards = [...this.discardPile];
      this.discardPile = [];
      this.shuffle();
    }

    const card = this.cards.pop()!;
    this.discardPile.push(card);
    return card;
  }

  getRemainingCount(): number {
    return this.cards.length;
  }

  getDiscardCount(): number {
    return this.discardPile.length;
  }
}

export const eventDeck = new EventDeck();

export function applyEventEffect(event: EventCard, currentHealth: number, maxHealth: number): number {
  let newHealth = currentHealth;

  switch (event.name) {
    case '发现宝箱':
      newHealth = Math.min(maxHealth, currentHealth + 10);
      break;
    case '魔法泉水':
      newHealth = Math.min(maxHealth, currentHealth + 15);
      break;
    case '祝福之光':
      newHealth = Math.min(maxHealth, currentHealth + 8);
      break;
    case '地刺陷阱':
      newHealth = Math.max(0, currentHealth - 8);
      break;
    case '毒雾弥漫':
      newHealth = Math.max(0, currentHealth - 5);
      break;
    case '落石袭击':
      newHealth = Math.max(0, currentHealth - 10);
      break;
    default:
      break;
  }

  return newHealth;
}
