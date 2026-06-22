import { useEffect, useState, useRef } from 'react'
import { useStore } from '@/store'
import type { LeaderboardEntry } from '@/store'
import { ArrowLeft, Trophy, Medal, Users, Send, Leaf } from 'lucide-react'

export default function Community() {
  const { leaderboard, fetchLeaderboard, currentUser } = useStore()
  const [prevRanks, setPrevRanks] = useState<Map<string, number>>(new Map())
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set())
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null)
  const [friendMsg, setFriendMsg] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws`
    let ws: WebSocket
    try {
      ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'leaderboard_update' || data.type === 'rank_change') {
            const newPrevRanks = new Map<string, number>()
            leaderboard.forEach((entry: LeaderboardEntry) => {
              newPrevRanks.set(entry.userId, entry.rank)
            })
            setPrevRanks(newPrevRanks)
            fetchLeaderboard()

            const animating = new Set<string>()
            if (data.payload) {
              data.payload.forEach((entry: LeaderboardEntry) => {
                const prev = newPrevRanks.get(entry.userId)
                if (prev !== undefined && prev !== entry.rank) {
                  animating.add(entry.userId)
                }
              })
            }
            setAnimatingIds(animating)
            setTimeout(() => setAnimatingIds(new Set()), 600)
          }
        } catch {
          // ignore parse errors
        }
      }
      ws.onerror = () => {}
      ws.onclose = () => {}
    } catch {
      // ws not available, fall back to polling
    }

    const interval = setInterval(() => {
      fetchLeaderboard()
    }, 5000)

    return () => {
      clearInterval(interval)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [])

  useEffect(() => {
    if (leaderboard.length > 0) {
      const newPrevRanks = new Map<string, number>()
      leaderboard.forEach((entry: LeaderboardEntry) => {
        const oldRank = prevRanks.get(entry.userId)
        if (oldRank !== undefined && oldRank !== entry.rank) {
          setAnimatingIds((prev) => new Set(prev).add(entry.userId))
          setTimeout(() => {
            setAnimatingIds((prev) => {
              const next = new Set(prev)
              next.delete(entry.userId)
              return next
            })
          }, 600)
        }
        newPrevRanks.set(entry.userId, entry.rank)
      })
      setPrevRanks(newPrevRanks)
    }
  }, [leaderboard])

  const handleFriendRequest = async (toUserId: string) => {
    try {
      await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: currentUser.userId, to: toUserId }),
      })
      setFriendMsg('碳友申请已发送！🌿')
      setTimeout(() => setFriendMsg(''), 2000)
    } catch {
      setFriendMsg('发送失败，请重试')
      setTimeout(() => setFriendMsg(''), 2000)
    }
  }

  const rankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
    if (rank === 3) return 'bg-gradient-to-r from-orange-300 to-orange-400 text-white'
    return 'bg-white/20 text-white/80'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#a8e6cf] via-[#66bb6a] to-[#1b5e20] flex flex-col items-center py-6 px-4">
      <header className="w-full max-w-[480px] mb-6">
        <a href="/" className="inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-semibold">
          <ArrowLeft size={16} />
          返回首页
        </a>
        <div className="flex items-center gap-2 mt-2">
          <Trophy className="text-yellow-300" size={24} />
          <h1 className="text-xl font-extrabold text-white">社区碳减排挑战</h1>
        </div>
        <p className="text-white/70 text-xs mt-1">排行榜每5秒自动刷新</p>
      </header>

      <div className="w-full max-w-[480px] space-y-3">
        {leaderboard.map((entry: LeaderboardEntry) => {
          const isAnimating = animatingIds.has(entry.userId)
          const isMe = entry.userId === currentUser.userId

          return (
            <div
              key={entry.userId}
              className={`relative bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 transition-all duration-300 cursor-pointer hover:bg-white/25 ${
                isAnimating ? 'animate-bounceSubtle' : ''
              } ${isMe ? 'ring-2 ring-white/50' : ''}`}
              onClick={() => setSelectedUser(entry)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${rankStyle(entry.rank)}`}>
                  {entry.rank}
                </div>
                <div className="text-3xl">{entry.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate">
                      {entry.nickname}
                      {isMe && <span className="text-white/60 text-xs ml-1">(我)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {entry.badges.map((badge) => (
                      <span
                        key={badge.id}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-400/30 text-yellow-200 text-[10px] font-bold border border-yellow-400/40"
                        title={badge.description}
                      >
                        {badge.icon} {badge.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-white">{entry.weeklyReduction.toFixed(1)}</div>
                  <div className="text-[10px] text-white/60 font-semibold">kg 减碳</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div
            className="bg-gradient-to-b from-[#2e7d32] to-[#1b5e20] rounded-3xl p-6 max-w-[400px] w-full shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{selectedUser.avatar}</div>
              <h3 className="text-xl font-bold text-white">{selectedUser.nickname}</h3>
              <p className="text-white/60 text-sm">排名第 {selectedUser.rank} 位</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-semibold">本周减碳</span>
                <span className="text-white font-bold">{selectedUser.weeklyReduction.toFixed(1)} kg</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-semibold">成就徽章</span>
                <div className="flex gap-1">
                  {selectedUser.badges.length === 0 && <span className="text-white/50 text-xs">暂无</span>}
                  {selectedUser.badges.map((badge) => (
                    <span key={badge.id} className="text-sm" title={badge.description}>{badge.icon}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm font-semibold">碳友数量</span>
                <span className="text-white font-bold">{Math.floor(Math.random() * 10)}</span>
              </div>
            </div>

            {selectedUser.userId !== currentUser.userId && (
              <button
                onClick={() => handleFriendRequest(selectedUser.userId)}
                className="w-full py-3 rounded-2xl bg-white/20 text-white font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} />
                发送碳友申请
              </button>
            )}

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full mt-3 py-2 text-white/60 text-sm font-semibold hover:text-white transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {friendMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg z-50 animate-fadeIn">
          {friendMsg}
        </div>
      )}

      <div className="w-full max-w-[480px] mt-6 bg-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Medal className="text-yellow-300" size={18} />
          <h3 className="text-sm font-bold text-white">成就徽章说明</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <span>🏆</span>
            <span className="font-semibold">绿色先锋</span>
            <span className="text-white/50">— 连续7天低碳</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <span>🎯</span>
            <span className="font-semibold">挑战达人</span>
            <span className="text-white/50">— 参与5次挑战</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[480px] mt-4">
        <a
          href="/"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/10 text-white/70 font-semibold hover:bg-white/20 hover:text-white transition-all"
        >
          <Leaf size={16} />
          返回碳足迹速算器
        </a>
      </div>
    </div>
  )
}
