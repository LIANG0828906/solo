import type { LeaderboardEntry, AddScoreResult, ElementType, LeaderboardRanking } from '../shared/types'
import { v4 } from 'uuid'

const leaderboard: LeaderboardEntry[] = []

function sortLeaderboard(): void {
  leaderboard.sort((a, b) => b.score - a.score)
}

function getTopTen(): LeaderboardRanking[] {
  return [...leaderboard]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((entry, index) => ({
      rank: index + 1,
      nickname: entry.nickname,
      score: entry.score,
      isNewRecord: entry.isNewRecord,
    }))
}

function addScore(nickname: string, score: number, element: ElementType): AddScoreResult {
  const newEntry: LeaderboardEntry = {
    id: v4(),
    nickname,
    score,
    element,
    timestamp: Date.now(),
    isNewRecord: false,
  }

  const wasEmpty = leaderboard.length === 0
  const currentTopScore = leaderboard.length > 0 ? leaderboard[0].score : 0

  if (wasEmpty || score > currentTopScore) {
    newEntry.isNewRecord = true
  }

  leaderboard.push(newEntry)
  sortLeaderboard()

  const rank = leaderboard.findIndex(entry => entry.id === newEntry.id) + 1
  const isInTopTen = rank <= 10

  return { rank, isInTopTen }
}

function clearLeaderboard(): void {
  leaderboard.length = 0
}

export { getTopTen, addScore, clearLeaderboard }
