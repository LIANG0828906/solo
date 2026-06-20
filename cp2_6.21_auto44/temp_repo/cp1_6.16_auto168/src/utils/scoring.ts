export function calculateScore(params: {
  capturedCount: number;
  totalNodes: number;
  elapsedTime: number;
  remainingFragments: number;
  maxFragments: number;
}): number {
  const { capturedCount, totalNodes, elapsedTime, remainingFragments } = params;

  const baseScore = capturedCount * 100;

  const timeBonus = Math.max(0, (300 - elapsedTime) * 2);

  const fragmentBonus = remainingFragments * 50;

  const completionBonus = capturedCount === totalNodes ? 1000 : 0;

  const total = baseScore + timeBonus + fragmentBonus + completionBonus;

  return Math.floor(total);
}
