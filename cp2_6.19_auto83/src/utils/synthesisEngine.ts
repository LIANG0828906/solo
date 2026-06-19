import type { Card, RarityType } from './cardData';
import { ALL_CARDS } from './cardData';

const RARITY_PROBABILITY: Record<RarityType, number> = {
  common: 1.0,
  uncommon: 0.8,
  rare: 0.5,
  epic: 0.25,
  legendary: 0.1,
};

export function synthesize(
  cardAId: string,
  cardBId: string,
  goldSynthCount: number
): { success: boolean; resultCardId: string | null; newGoldSynthCount: number } {
  const matchedCard = ALL_CARDS.find(
    (card) =>
      card.formula !== undefined &&
      ((card.formula[0] === cardAId && card.formula[1] === cardBId) ||
        (card.formula[0] === cardBId && card.formula[1] === cardAId))
  );

  if (!matchedCard) {
    return { success: false, resultCardId: null, newGoldSynthCount: goldSynthCount + 1 };
  }

  const rarity = matchedCard.rarity;
  let probability = RARITY_PROBABILITY[rarity];

  if (rarity === 'legendary' && goldSynthCount + 1 >= 100) {
    probability = 1.0;
  }

  const roll = Math.random();

  if (roll < probability) {
    const newGoldSynthCount = rarity === 'legendary' ? 0 : goldSynthCount + 1;
    return { success: true, resultCardId: matchedCard.id, newGoldSynthCount };
  } else {
    return { success: false, resultCardId: null, newGoldSynthCount: goldSynthCount + 1 };
  }
}

export function calculateSynthesisProbability(
  cardAId: string,
  cardBId: string,
  goldSynthCount: number
): { canSynthesize: boolean; probability: number; resultCardName: string | null } {
  const matchedCard = ALL_CARDS.find(
    (card) =>
      card.formula !== undefined &&
      ((card.formula[0] === cardAId && card.formula[1] === cardBId) ||
        (card.formula[0] === cardBId && card.formula[1] === cardAId))
  );

  if (!matchedCard) {
    return { canSynthesize: false, probability: 0, resultCardName: null };
  }

  const rarity = matchedCard.rarity;
  let probability = RARITY_PROBABILITY[rarity];

  if (rarity === 'legendary' && goldSynthCount >= 99) {
    probability = 1.0;
  }

  return { canSynthesize: true, probability, resultCardName: matchedCard.name };
}
