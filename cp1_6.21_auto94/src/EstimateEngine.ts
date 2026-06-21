export function calculatePERT(
  optimistic: number,
  pessimistic: number,
  mostLikely: number
): number {
  if (
    optimistic < 0 ||
    pessimistic < 0 ||
    mostLikely < 0
  ) {
    throw new Error('估算值不能为负数');
  }
  return (optimistic + 4 * mostLikely + pessimistic) / 6;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function calculatePoker(
  mostLikely: number,
  seed: number
): number {
  if (mostLikely < 0) {
    throw new Error('估算值不能为负数');
  }
  const offset = (seededRandom(seed) * 0.4 - 0.2) * mostLikely;
  return Math.max(0, mostLikely + offset);
}
