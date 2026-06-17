export interface User {
  id: string;
  nickname: string;
  avatar: string;
  points: number;
  level: number;
  completedCount: number;
  avgRating: number;
}

export function calculateLevel(completedCount: number, avgRating: number): number {
  const level = Math.floor((completedCount * 10 + avgRating * 20) / 100) + 1;
  return Math.max(1, Math.min(5, level));
}

export function transferPoints(
  publisher: User,
  claimant: User,
  reward: number
): { publisher: User; claimant: User } {
  return {
    publisher: {
      ...publisher,
      points: publisher.points - reward,
    },
    claimant: {
      ...claimant,
      points: claimant.points + reward,
    },
  };
}

export function canAfford(user: User, reward: number): boolean {
  return user.points >= reward;
}

export function updateReputation(user: User, newRating: number): User {
  const newCompletedCount = user.completedCount + 1;
  const totalRating = user.avgRating * user.completedCount + newRating;
  const newAvgRating = totalRating / newCompletedCount;
  const newLevel = calculateLevel(newCompletedCount, newAvgRating);

  return {
    ...user,
    completedCount: newCompletedCount,
    avgRating: newAvgRating,
    level: newLevel,
  };
}
