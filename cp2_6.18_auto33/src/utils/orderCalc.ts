import type { OrderItem, DiscountTier, OrderCalculationResult } from '../types';

const DISCOUNT_TIERS: DiscountTier[] = [
  { threshold: 50, discount: 5 },
  { threshold: 80, discount: 10 },
  { threshold: 120, discount: 20 },
];

export function calculateOrder(
  items: OrderItem[],
  peopleCount: number
): OrderCalculationResult {
  const totalPrice = items.reduce((sum, item) => sum + item.discountedPrice, 0);

  let currentTier: DiscountTier | null = null;
  for (let i = DISCOUNT_TIERS.length - 1; i >= 0; i--) {
    if (totalPrice >= DISCOUNT_TIERS[i].threshold) {
      currentTier = DISCOUNT_TIERS[i];
      break;
    }
  }

  const discountAmount = currentTier ? currentTier.discount : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);
  const perPersonPrice = peopleCount > 0
    ? Math.round((finalPrice / peopleCount) * 10) / 10
    : 0;

  const currentTierIndex = currentTier
    ? DISCOUNT_TIERS.indexOf(currentTier)
    : -1;
  const nextTier = currentTierIndex < DISCOUNT_TIERS.length - 1
    ? DISCOUNT_TIERS[currentTierIndex + 1]
    : null;

  let progressToNextTier = 0;
  let amountToNextTier = 0;

  if (nextTier) {
    const currentTierStart = currentTier ? currentTier.threshold : 0;
    const nextTierTarget = nextTier.threshold;
    const tierRange = nextTierTarget - currentTierStart;
    const progressInCurrentTier = totalPrice - currentTierStart;
    const ratio = progressInCurrentTier / tierRange;
    progressToNextTier = Math.min(100, Math.max(0, ratio * 100));
    amountToNextTier = Math.max(0, nextTierTarget - totalPrice);
  } else {
    progressToNextTier = 100;
    amountToNextTier = 0;
  }

  return {
    totalPrice,
    discountAmount,
    finalPrice,
    perPersonPrice,
    currentTier,
    nextTier,
    progressToNextTier,
    amountToNextTier,
  };
}
