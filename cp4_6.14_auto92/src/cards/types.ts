export type EffectType = 'draw' | 'buff' | 'copy' | 'transform' | 'clear';

export interface CardEffect {
  id: string;
  name: string;
  type: EffectType;
  priority: number;
  params: Record<string, number | string>;
  description: string;
}

export interface EffectState {
  hp: number;
  attack: number;
  defense: number;
  handCount: number;
  deckCount: number;
  fieldCards: string[];
  statusCounters: Record<string, number>;
}

export interface StateChange {
  key: keyof EffectState | string;
  before: number | string[] | Record<string, number>;
  after: number | string[] | Record<string, number>;
  delta?: number;
}

export interface ResolvedEffect {
  effectId: string;
  effectName: string;
  changes: StateChange[];
  timestamp: number;
}
