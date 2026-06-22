import type { Material, Era, Condition, Liquidity, ValuationResult, ValuationParams, ValuationWeights } from '../types';

export const materialMultipliers: Record<Material, number> = {
  gold: 100,
  silver: 20,
  jade: 80,
  porcelain: 50,
  wood: 10
};

export const eraMultipliers: Record<Era, number> = {
  song: 1.5,
  ming: 1.3,
  qing: 1.0
};

export const conditionMultipliers: Record<Condition, number> = {
  excellent: 1.0,
  good: 0.7,
  poor: 0.4
};

export const liquidityMultipliers: Record<Liquidity, number> = {
  high: 1.0,
  medium: 0.8,
  low: 0.6
};

export const defaultWeights: ValuationWeights = {
  material: 0.35,
  era: 0.25,
  condition: 0.25,
  liquidity: 0.15
};

const PAWN_RATE_MIN = 0.3;
const PAWN_RATE_MAX = 0.6;

export function calculateValuation(params: ValuationParams): ValuationResult {
  const materialScore = materialMultipliers[params.material] * defaultWeights.material;
  const eraScore = eraMultipliers[params.era] * defaultWeights.era;
  const conditionScore = conditionMultipliers[params.condition] * defaultWeights.condition;
  const liquidityScore = liquidityMultipliers[params.liquidity] * defaultWeights.liquidity;

  const weightedValue = (materialScore + eraScore + conditionScore + liquidityScore) * 10;
  const baseValue = weightedValue * (params.weight || 1);

  const pawnRate = PAWN_RATE_MIN + Math.random() * (PAWN_RATE_MAX - PAWN_RATE_MIN);
  const pawnAmount = Math.round(baseValue * pawnRate);

  return {
    baseValue: Math.round(baseValue),
    weightedValue: Math.round(weightedValue),
    pawnAmount,
    weights: defaultWeights
  };
}

export function calculateDeadPawnPrice(pawnAmount: number): number {
  const markup = 1.4 + Math.random() * 0.6;
  return Math.round(pawnAmount * markup);
}

export function calculateRedeemAmount(pawnAmount: number, months: number, monthlyRate: number): number {
  return Math.round(pawnAmount * (1 + monthlyRate * months));
}
