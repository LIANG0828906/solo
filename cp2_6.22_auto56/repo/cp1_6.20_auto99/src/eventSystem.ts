import { GameEvent, EventOption, EventEffect } from './types';

const API = 'http://localhost:3001/api';

export class EventSystem {
  events: GameEvent[] = [];
  loaded = false;

  async loadEvents(): Promise<GameEvent[]> {
    try {
      const res = await fetch(`${API}/events`);
      const json = await res.json();
      this.events = json?.data?.events || [];
    } catch {
      this.events = FALLBACK_EVENTS;
    }
    this.loaded = true;
    return this.events;
  }

  pickEvent(era: number, turn: number, seed: number): GameEvent | null {
    if (!this.loaded) this.loadEvents();
    const pool = this.events.filter(e => e.minEra <= era);
    if (pool.length === 0) return null;
    const rng = this._mulberry32(seed + turn * 7919);
    return pool[Math.floor(rng() * pool.length)];
  }

  _mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
}

export const FALLBACK_EVENTS: GameEvent[] = [
  {
    id: 'earthquake', name: '大地震颤', type: 'disaster', typeLabel: '自然灾害', minEra: 0,
    description: '大地突然剧烈摇晃，必须立即抉择。',
    options: [
      { id: 'rebuild', text: '修复（-10木材 -5石器）', effects: { wood: -10, stone: -5, population: -2 } as EventEffect, resultText: '重建家园。' },
      { id: 'evacuate', text: '撤离（损失建筑）', effects: { population: -1, randomBuildingDestroy: 1 } as EventEffect, resultText: '建筑损毁。' }
    ]
  }
];
