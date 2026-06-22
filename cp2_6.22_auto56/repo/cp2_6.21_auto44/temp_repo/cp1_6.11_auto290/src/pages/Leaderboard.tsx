import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Trophy, Medal } from 'lucide-react'

const api = axios.create({ timeout: 5000 })

interface LeaderboardEntry {
  id: number
  name: string
  archeryScore: number
  touhuScore: number
  cujuScore: number
  totalScore: number
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const cacheRef = useRef<{ key: string; data: LeaderboardEntry[]; ts: number } | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [month])

  const fetchLeaderboard = async () => {
    const cacheKey = month
    if (cacheRef.current && cacheRef.current.key === cacheKey) {
      const elapsed = Date.now() - cacheRef.current.ts
      if (elapsed < 30000) {
        setEntries(cacheRef.current.data)
        return
      }
    }
    try {
      const res = await api.get('/api/teacher/leaderboard', { params: { month } })
      setEntries(res.data)
      cacheRef.current = { key: cacheKey, data: res.data, ts: Date.now() }
    } catch {
      // ignore
    }
  }

  const medalColors = ['#D4AF37', '#C0C0C0', '#CD7F32']

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          className="flex items-center gap-2 text-ancient-brown mb-4 hover:text-ancient-red transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="font-title text-2xl md:text-3xl text-ancient-brown tracking-wider mb-6 text-center flex items-center justify-center gap-2">
          <Trophy size={28} className="text-gold" />
          排行榜
        </h1>

        <div className="mb-6 flex items-center justify-center gap-3">
          <label className="text-ancient-brown">月份：</label>
          <input
            type="month"
            className="input-ancient"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <div
          className="rounded-lg border-2 border-gold overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #FFF8DC 0%, #F5F0E1 100%)' }}
        >
          <div className="grid grid-cols-6 gap-2 p-3 bg-ancient-brown text-white text-sm font-title">
            <div>名次</div>
            <div>姓名</div>
            <div className="text-center">射箭</div>
            <div className="text-center">投壶</div>
            <div className="text-center">蹴鞠</div>
            <div className="text-center">总分</div>
          </div>

          {entries.length === 0 && (
            <div className="p-8 text-center text-ancient-brown opacity-60">
              暂无数据
            </div>
          )}

          {entries.slice(0, 10).map((entry, i) => (
            <div
              key={entry.id}
              className={`grid grid-cols-6 gap-2 p-3 border-b border-gold border-opacity-30 items-center ${
                i < 3 ? 'bg-ancient-input' : ''
              }`}
            >
              <div className="flex items-center gap-1">
                {i < 3 ? (
                  <Medal size={20} style={{ color: medalColors[i] }} fill={medalColors[i]} />
                ) : (
                  <span className="text-ancient-brown text-sm">{i + 1}</span>
                )}
              </div>
              <div className="font-title text-ancient-brown">{entry.name}</div>
              <div className="text-center text-ancient-brown text-sm">{entry.archeryScore}</div>
              <div className="text-center text-ancient-brown text-sm">{entry.touhuScore}</div>
              <div className="text-center text-ancient-brown text-sm">{entry.cujuScore}</div>
              <div className="text-center font-title text-ancient-red">{entry.totalScore}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
