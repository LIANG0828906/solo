export type EventType = 'attack' | 'defense' | 'heal';

export interface BattleEvent {
  id: number;
  round: number;
  type: EventType;
  source: string;
  target: string;
  value: number;
  attackPower?: number;
  defensePower?: number;
  reductionPercent?: number;
  finalDamage?: number;
  timestamp: number;
}

export interface Card {
  type: EventType;
  name: string;
  power: number;
}

export interface PlayerConfig {
  name: string;
  hp: number;
  maxHp: number;
  shield: number;
  cards: Card[];
}

export interface BattleConfig {
  rounds: number;
  cardsPerRound: number;
  playerA: PlayerConfig;
  playerB: PlayerConfig;
}

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  attack: '攻击',
  defense: '防御',
  heal: '治疗'
};
