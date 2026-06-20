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
  const matchedCards = ALL_CARDS.filter(
    (card) =>
      card.formula !== undefined &&
      ((card.formula[0] === cardAId && card.formula[1] === cardBId) ||
        (card.formula[0] === cardBId && card.formula[1] === cardAId))
  );

  if (matchedCards.length === 0) {
    return { success: false, resultCardId: null, newGoldSynthCount: goldSynthCount };
  }

  const hasLegendary = matchedCards.some(c => c.rarity === 'legendary');
  const pityTrigger = hasLegendary && goldSynthCount + 1 >= 100;

  const highestRarity = matchedCards.reduce(
    (highest, card) => {
      const rarityOrder: Record<RarityType, number> = {
        common: 0,
        uncommon: 1,
        rare: 2,
        epic: 3,
        legendary: 4,
      };
      return rarityOrder[card.rarity] > rarityOrder[highest] ? card.rarity : highest;
    },
    'common' as RarityType
  );

  let success: boolean;
  let resultCard: Card | null = null;

  if (pityTrigger) {
    const legendaryCards = matchedCards.filter(c => c.rarity === 'legendary');
    resultCard = legendaryCards[Math.floor(Math.random() * legendaryCards.length)];
    success = true;
  } else {
    const prob = RARITY_PROBABILITY[highestRarity];
    const roll = Math.random();
    success = roll < prob;

    if (success) {
      const candidates = matchedCards.filter(c => c.rarity === highestRarity);
      if (candidates.length > 0) {
        resultCard = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        resultCard = matchedCards[Math.floor(Math.random() * matchedCards.length)];
      }
    }
  }

  let newGoldSynthCount = goldSynthCount;
  if (hasLegendary) {
    if (success && resultCard?.rarity === 'legendary') {
      newGoldSynthCount = 0;
    } else {
      newGoldSynthCount = goldSynthCount + 1;
    }
  }

  return {
    success,
    resultCardId: resultCard ? resultCard.id : null,
    newGoldSynthCount,
  };
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
