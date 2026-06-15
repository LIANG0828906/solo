import type { LeaderboardEntry, AddScoreResult, ElementType, LeaderboardRanking } from '../shared/types'
import { v4 } from 'uuid'

const leaderboard: LeaderboardEntry[] = [
  { id: v4(), nickname: '魔法师小明', score: 1850, element: 'fire', timestamp: Date.now() - 86400000 },
  { id: v4(), nickname: '风之使者', score: 1720, element: 'wind', timestamp: Date.now() - 172800000 },
  { id: v4(), nickname: '星辰猎人', score: 1680, element: 'thunder', timestamp: Date.now() - 259200000 },
  { id: v4(), nickname: '暗影刺客', score: 1550, element: 'water', timestamp: Date.now() - 345600000 },
  { id: v4(), nickname: '烈焰凤凰', score: 1480, element: 'fire', timestamp: Date.now() - 432000000 },
  { id: v4(), nickname: '冰雪女王', score: 1320, element: 'water', timestamp: Date.now() - 518400000 },
  { id: v4(), nickname: '雷霆战士', score: 1200, element: 'thunder', timestamp: Date.now() - 604800000 },
  { id: v4(), nickname: '森林守护者', score: 1050, element: 'wind', timestamp: Date.now() - 691200000 },
  { id: v4(), nickname: '沙漠游侠', score: 890, element: 'fire', timestamp: Date.now() - 777600000 },
  { id: v4(), nickname: '海洋之心', score: 720, element: 'water', timestamp: Date.now() - 864000000 },
]

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
    }))
}

function addScore(nickname: string, score: number, element: ElementType): AddScoreResult {
  const newEntry: LeaderboardEntry = {
    id: v4(),
    nickname,
    score,
    element,
    timestamp: Date.now(),
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
