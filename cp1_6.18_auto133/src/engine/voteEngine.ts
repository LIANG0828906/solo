export interface VoteResult {
  percentages: Record<string, number>;
  lockedOptionId: string | null;
}

const LOCK_THRESHOLD = 0.6;

export function calculateVoteResult(
  voteCounts: Record<string, number>,
  optionIds: string[]
): VoteResult {
  const totalVotes = optionIds.reduce(
    (sum, id) => sum + (voteCounts[id] || 0),
    0
  );

  const percentages: Record<string, number> = {};
  let lockedOptionId: string | null = null;

  for (const id of optionIds) {
    const count = voteCounts[id] || 0;
    percentages[id] = totalVotes > 0 ? count / totalVotes : 0;

    if (
      totalVotes > 0 &&
      percentages[id] > LOCK_THRESHOLD &&
      !lockedOptionId
    ) {
      lockedOptionId = id;
    }
  }

  return { percentages, lockedOptionId };
}
