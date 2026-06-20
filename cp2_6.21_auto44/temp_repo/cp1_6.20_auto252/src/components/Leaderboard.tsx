import { useState, useEffect } from 'react'

interface LeaderboardEntry {
  userId: string
  nickname: string
  color: string
  initial: string
  focusing: boolean
  studySeconds: number
}

interface LeaderboardProps {
  roomId: string
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m}m`
  return `${m}m`
}

function getRankColor(rank: number): string {
  if (rank === 1) return '#ffd700'
  if (rank === 2) return '#b0bec5'
  if (rank === 3) return '#cd7f32'
  return '#555'
}

export default function Leaderboard({ roomId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const fetchBoard = () => {
      fetch(`/api/rooms/${roomId}/leaderboard`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setEntries(data)
        })
        .catch(() => {})
    }

    fetchBoard()
    const interval = setInterval(fetchBoard, 10000)
    return () => clearInterval(interval)
  }, [roomId])

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">🏆 学习时长排行榜</h2>
      <div className="leaderboard-list">
        {entries.length === 0 && (
          <div className="leaderboard-empty">暂无学员</div>
        )}
        {entries.map((entry, index) => {
          const rank = index + 1
          return (
            <div key={entry.userId} className="leaderboard-item">
              <div
                className="rank-badge"
                style={{ backgroundColor: getRankColor(rank) }}
              >
                {rank}
              </div>
              <div
                className="user-avatar"
                style={{ backgroundColor: entry.color }}
              >
                {entry.initial}
              </div>
              <div className="user-info">
                <span className="user-nickname">{entry.nickname}</span>
                <span className="user-duration">{formatDuration(entry.studySeconds)}</span>
              </div>
              {entry.focusing && <span className="pulse-dot" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
