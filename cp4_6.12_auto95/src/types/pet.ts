export type PetType = 'dragon' | 'unicorn' | 'robot';
export type AnimationState = 'idle' | 'walk' | 'eat' | 'sleep';
export type BattleResult = 'win' | 'lose' | 'draw';

export interface IPetData {
  id: string;
  name: string;
  type: PetType;
  hunger: number;
  mood: number;
  energy: number;
  intelligence: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  currentAnimation: AnimationState;
  lastActionTime: number;
}

export interface IOpponentData extends Omit<IPetData, 'currentAnimation' | 'lastActionTime'> {
  ownerName: string;
}

export interface IBattleState {
  isActive: boolean;
  opponent: IOpponentData | null;
  result: BattleResult | null;
  showingResult: boolean;
  showLevelUp: boolean;
  levelUpTimer: number;
}

export interface IAttributeThresholds {
  min: number;
  max: number;
  warning: number;
}

export const ATTRIBUTE_THRESHOLDS: IAttributeThresholds = {
  min: 0,
  max: 100,
  warning: 20,
};
