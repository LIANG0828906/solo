export interface CardTemplate {
  id: string;
  name: string;
  class: 'warrior' | 'mage' | 'rogue';
  cost: number;
  effectType: 'damage' | 'shield' | 'heal' | 'draw';
  value: number;
}

export interface BattleCard extends CardTemplate {
  uid: string;
}

export interface EnemyTemplate {
  name: string;
  hp: number;
  attack: number;
  weight: number;
  skillName: string;
}

export interface Enemy extends EnemyTemplate {
  currentHp: number;
  maxHp: number;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  shield: number;
}

export type BattlePhase = 'player_turn' | 'enemy_turn' | 'victory' | 'defeat';

export interface EffectContext {
  player: PlayerState;
  enemy: Enemy;
  cardValue: number;
  cardClass: string;
  drawFn: (count: number) => BattleCard[];
}

export interface EffectResult {
  damage?: number;
  shield?: number;
  heal?: number;
  drawnCards?: BattleCard[];
  log: string;
}
